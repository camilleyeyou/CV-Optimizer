import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext(null);

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
