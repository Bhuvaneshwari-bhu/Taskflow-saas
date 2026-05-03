const { getClient } = require('../config/redis');

// ── TTLs (seconds) ─────────────────────────────────────────────────────────────

const TTL = {
    PROJECTS: 5 * 60,  // 5 minutes
    TASKS:    2 * 60,  // 2 minutes
};

// ── Key builders ───────────────────────────────────────────────────────────────

const KEYS = {
    userProjects: (userId)    => `projects:user:${userId}`,
    orgProjects:  (orgId)     => `projects:org:${orgId}`,
    projectTasks: (projectId) => `tasks:project:${projectId}`,
};

// ── Core helpers ───────────────────────────────────────────────────────────────

/**
 * Returns parsed cached value, or null on miss / Redis error.
 * Never throws — callers treat null as a cache miss and query the DB.
 */
const getCache = async (key) => {
    try {
        const redis = getClient();
        if (!redis || redis.status !== 'ready') return null;

        const raw = await redis.get(key);
        if (raw !== null) {
            console.log(`[cache] CACHE HIT  » ${key}`);
            return JSON.parse(raw);
        }

        console.log(`[cache] CACHE MISS » ${key}`);
        return null;
    } catch (err) {
        console.error(`[cache] getCache failed (${key}): ${err.message}`);
        return null;
    }
};

/**
 * Serialises data and stores it under key for ttl seconds.
 * Never throws.
 */
const setCache = async (key, data, ttl) => {
    try {
        const redis = getClient();
        if (!redis || redis.status !== 'ready') return;

        await redis.set(key, JSON.stringify(data), 'EX', ttl);
    } catch (err) {
        console.error(`[cache] setCache failed (${key}): ${err.message}`);
    }
};

/**
 * Removes a single key.
 * Never throws.
 */
const deleteCache = async (key) => {
    try {
        const redis = getClient();
        if (!redis || redis.status !== 'ready') return;

        await redis.del(key);
        console.log(`[cache] INVALIDATED » ${key}`);
    } catch (err) {
        console.error(`[cache] deleteCache failed (${key}): ${err.message}`);
    }
};

/**
 * Removes all keys matching a glob pattern (e.g. "projects:user:*").
 * Use sparingly — KEYS is O(N) across the whole keyspace.
 * Never throws.
 */
const deleteCacheByPattern = async (pattern) => {
    try {
        const redis = getClient();
        if (!redis || redis.status !== 'ready') return;

        const found = await redis.keys(pattern);
        if (found.length > 0) {
            await redis.del(...found);
            console.log(`[cache] INVALIDATED pattern » ${pattern} (${found.length} key(s))`);
        }
    } catch (err) {
        console.error(`[cache] deleteCacheByPattern failed (${pattern}): ${err.message}`);
    }
};

module.exports = { getCache, setCache, deleteCache, deleteCacheByPattern, KEYS, TTL };
