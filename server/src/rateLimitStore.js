/**
 * Shared rate-limit store factory.
 *
 * express-rate-limit's default store is in-memory, which on Vercel is
 * per-function-instance — so limits don't actually hold across the fleet.
 * This returns a store backed by a SHARED datastore so a limit is enforced
 * globally:
 *   1. Upstash Redis (preferred) via rate-limit-redis + @upstash/redis.
 *   2. Supabase counter table (fallback) if Upstash isn't configured.
 *   3. undefined (express-rate-limit's in-memory default) only as a last resort
 *      when neither is configured — never silently in production.
 *
 * Each limiter must get its OWN store instance with a unique `prefix` so their
 * counters don't collide (they are all keyed by client IP).
 */
const { createClient } = require('@supabase/supabase-js');
const logger = require('./logger');

// ---- Lazy Supabase client (so importing never throws without env) ----------
let _supabase = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return _supabase;
}

// ---- Supabase-backed store -------------------------------------------------
class SupabaseRateLimitStore {
  constructor(prefix = 'rl:') {
    this.prefix = prefix;
    this.windowMs = 60_000;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  async increment(key) {
    const k = this.prefix + key;
    try {
      const { data, error } = await getSupabase().rpc('increment_rate_limit', {
        p_key: k,
        p_window_ms: this.windowMs,
      });
      if (error || !data || !data[0]) throw error || new Error('empty rate-limit response');
      return { totalHits: data[0].total_hits, resetTime: new Date(data[0].reset_at) };
    } catch (err) {
      // Fail OPEN (don't take the app down if the counter store is unavailable),
      // but log so the gap is visible. The endpoint is not directly billed.
      logger.warn({ err: err?.message, key: k }, 'rate-limit store increment failed; allowing request');
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }
  }

  async decrement(key) {
    const k = this.prefix + key;
    try {
      const { data } = await getSupabase()
        .from('rate_limit_counters')
        .select('count')
        .eq('key', k)
        .single();
      if (data && data.count > 0) {
        await getSupabase().from('rate_limit_counters').update({ count: data.count - 1 }).eq('key', k);
      }
    } catch {
      // best-effort; not used by our limiter config
    }
  }

  async resetKey(key) {
    try {
      await getSupabase().from('rate_limit_counters').delete().eq('key', this.prefix + key);
    } catch {
      // best-effort
    }
  }
}

// ---- Upstash Redis store (preferred) ---------------------------------------
// @upstash/redis has no `sendCommand`, so adapt rate-limit-redis's command
// calls onto its individual command methods.
function upstashSendCommand(client) {
  return async (...args) => {
    const cmd = String(args[0]).toUpperCase();
    const rest = args.slice(1);
    switch (cmd) {
      case 'SCRIPT':
        if (String(rest[0]).toUpperCase() === 'LOAD') return client.scriptLoad(rest[1]);
        throw new Error(`Unsupported SCRIPT subcommand: ${rest[0]}`);
      case 'EVALSHA': {
        const sha = rest[0];
        const numkeys = Number(rest[1]);
        return client.evalsha(sha, rest.slice(2, 2 + numkeys), rest.slice(2 + numkeys));
      }
      case 'EVAL': {
        const script = rest[0];
        const numkeys = Number(rest[1]);
        return client.eval(script, rest.slice(2, 2 + numkeys), rest.slice(2 + numkeys));
      }
      case 'GET': return client.get(rest[0]);
      case 'SET': return client.set(rest[0], rest[1]);
      case 'INCR': return client.incr(rest[0]);
      case 'DECR': return client.decr(rest[0]);
      case 'DEL': return client.del(...rest);
      case 'PEXPIRE': return client.pexpire(rest[0], Number(rest[1]));
      default:
        throw new Error(`Unsupported Redis command for Upstash adapter: ${cmd}`);
    }
  };
}

function buildUpstashStore(prefix) {
  // Lazy-require so the dependency only loads when Upstash is configured
  // (also avoids express-rate-limit major-version peer issues in local dev).
  const { Redis } = require('@upstash/redis');
  const { RedisStore } = require('rate-limit-redis');
  const client = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    automaticDeserialization: false, // return raw replies like a normal Redis client
  });
  return new RedisStore({ prefix, sendCommand: upstashSendCommand(client) });
}

/**
 * @param {string} prefix Unique per-limiter key prefix (e.g. 'rl:ats-hour:').
 * @returns {object|undefined} An express-rate-limit Store, or undefined to use
 *   the library default (in-memory).
 */
function createRateLimitStore(prefix = 'rl:') {
  const hasUpstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
  if (hasUpstash) {
    try {
      return buildUpstashStore(prefix);
    } catch (err) {
      logger.warn({ err: err?.message }, 'Upstash rate-limit store unavailable; falling back to Supabase');
    }
  }

  const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (hasSupabase) {
    return new SupabaseRateLimitStore(prefix);
  }

  logger.warn('No shared rate-limit store configured (no Upstash/Supabase); using in-memory store (per-instance, not enforced fleet-wide)');
  return undefined;
}

module.exports = { createRateLimitStore, SupabaseRateLimitStore };
