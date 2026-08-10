import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { verifyStudent } from '../services/api';

const AuthContext = createContext(null);

/* Loose on purpose: the server owns the real list (see studentController) and
   rejects anything else. This only avoids pointless calls. */
const EDU_DOMAIN = /\.(edu|ac)(\.[a-z]{2})?(\.[a-z]{2})?$/i;

/**
 * A first name to greet the user by, or null when nothing usable exists.
 *
 * The two sign-in paths write different metadata and neither can be assumed:
 * email signup sets `first_name` itself (see signUp below), while Google sets
 * `given_name` alongside a `full_name`/`name` pair and no `first_name` at all.
 * Both shapes have to resolve here, or every Google user gets greeted by their
 * email prefix.
 *
 * Returns null rather than a placeholder so each call site keeps its own
 * fallback wording — the header wants "User", the dashboard wants "there".
 */
export const firstNameFrom = (user) => {
  const meta = user?.user_metadata || {};
  const full = meta.full_name || meta.name || '';

  return meta.first_name
    || meta.given_name
    || full.trim().split(/\s+/)[0]
    || user?.email?.split('@')[0]
    || null;
};

/**
 * The user's profile picture, or null when there isn't one.
 *
 * Google sends this as `picture`, and Supabase mirrors it to `avatar_url`.
 * Which of the two is populated has varied across provider versions, so both
 * are checked. Email signups have neither, so every consumer needs a fallback.
 */
export const avatarUrlFrom = (user) => {
  const meta = user?.user_metadata || {};
  return meta.avatar_url || meta.picture || null;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Grant the student plan once a .edu address is confirmed.
   *
   * This deliberately does not live on the signup form. The server requires
   * `email_confirmed_at` before granting (see studentController), and that is
   * not set at the moment signUp resolves on any project that requires email
   * confirmation — so calling it there silently does nothing. It also cannot
   * live on a single page: a student may well arrive through Google, since
   * universities run on Workspace, and never touch the register route.
   *
   * The route allows five attempts an hour per IP, so this is capped at one per
   * browser session rather than one per page load. The server is idempotent
   * (409 once a grant is active) and every outcome here is non-blocking.
   */
  useEffect(() => {
    if (!user?.email) return;
    if (!(user.email_confirmed_at || user.confirmed_at)) return;
    if (!EDU_DOMAIN.test(user.email.split('@')[1] || '')) return;

    // sessionStorage is unavailable in some privacy modes. Falling back to one
    // attempt per mount is fine given the server is idempotent.
    let triedAlready = false;
    try {
      const key = `cvo:student-check:${user.id}`;
      triedAlready = !!sessionStorage.getItem(key);
      if (!triedAlready) sessionStorage.setItem(key, '1');
    } catch { /* no storage — try once for this mount */ }
    if (triedAlready) return;

    verifyStudent().catch(() => {
      /* Not eligible, already granted, already paying, or rate limited. All of
         those are fine and none should reach the user. */
    });
  }, [user]);

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: metadata.firstName || '',
          last_name: metadata.lastName || '',
        },
        // Where the confirmation link lands. Only consulted when the project
        // requires email confirmation, and harmless when it does not.
        ...(metadata.emailRedirectTo ? { emailRedirectTo: metadata.emailRedirectTo } : {}),
      },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  /**
   * Google sign-in.
   *
   * Leaves the app entirely: the browser goes to Google, Google returns to
   * Supabase, and Supabase returns here with a `?code=` that supabase-js
   * exchanges for a session while it initialises. So there is nothing to await
   * past this call and no session to set — the onAuthStateChange listener above
   * picks it up on the next page load.
   *
   * `next` is where to land afterwards. It has to be on Supabase's redirect
   * allow-list (Authentication → URL Configuration) or the provider drops the
   * user on the project's Site URL instead.
   */
  const signInWithGoogle = async (next = '/dashboard') => {
    // A leading `//` would make this protocol-relative and hand the session to
    // another origin, so anything that is not a plain in-app path is discarded.
    const path = /^\/(?!\/)/.test(next) ? next : '/dashboard';

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${path}` },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  /**
   * Second half of the reset flow, called from the page the emailed link lands
   * on. Requires the recovery session Supabase establishes from that link — it
   * is the only thing authorising the change, so there is no old-password
   * argument to pass.
   */
  const updatePassword = async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  const value = {
    user,
    firstName: firstNameFrom(user),
    avatarUrl: avatarUrlFrom(user),
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
