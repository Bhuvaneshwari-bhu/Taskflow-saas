const Redis = require('ioredis');

let client = null;

/**
 * Creates and connects the Redis client.
 * Called once in server.js during startup.
 * All cache helpers read the client via getClient().
 */
const connectRedis = () => {
    client = new Redis({
        host:     process.env.REDIS_HOST     || '127.0.0.1',
        port:     parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,

        // Retry up to 3 times with exponential backoff, then stop.
        // The app runs fine without Redis — cache just degrades to DB fallback.
        retryStrategy: (times) => {
            if (times > 3) {
                console.warn('[redis] max retries reached — running without cache');
                return null; // stops retrying; client enters error state
            }
            return Math.min(times * 200, 2000);
        },

        // Do not crash the process on connection failure
        enableOfflineQueue: false,
        lazyConnect: false,
    });

    client.on('connect', () => {
        console.log('[redis] connected');
    });

    client.on('error', (err) => {
        // Log but never throw — cache errors must not bring down the app
        console.error(`[redis] error: ${err.message}`);
    });

    return client;
};

/** Returns the active Redis client, or null if not yet initialised. */
const getClient = () => client;

module.exports = { connectRedis, getClient };
