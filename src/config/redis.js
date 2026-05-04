const Redis = require('ioredis');

let client = null;

/**
 * Creates and connects the Redis client.
 * Safe for production:
 * - Supports Upstash (TLS)
 * - Does not crash if Redis fails
 * - Gracefully degrades to no-cache mode
 */
const connectRedis = () => {
    try {
        // If no Redis config → skip completely
        if (!process.env.REDIS_HOST || !process.env.REDIS_PASSWORD) {
            console.warn('[redis] skipped (no config)');
            return null;
        }

        client = new Redis({
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD,

            // 🔥 REQUIRED for Upstash (TLS connection)
            tls: {},

            retryStrategy: (times) => {
                if (times > 3) {
                    console.warn('[redis] max retries reached — running without cache');
                    return null;
                }
                return Math.min(times * 200, 2000);
            },

            enableOfflineQueue: false,
            lazyConnect: false,
        });

        client.on('connect', () => {
            console.log('[redis] connected');
        });

        client.on('error', (err) => {
            console.error(`[redis] error: ${err.message}`);
        });

        return client;

    } catch (err) {
        console.error('[redis] failed to initialize:', err.message);
        client = null;
        return null;
    }
};

/** Returns the active Redis client, or null if unavailable */
const getClient = () => client;

module.exports = { connectRedis, getClient };
