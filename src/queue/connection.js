// Shared connection config for BullMQ Queues and Workers.
// BullMQ manages its own ioredis instances internally — do NOT share
// the cache client here; keep them separate.
const connection = {
    host:     process.env.REDIS_HOST     || '127.0.0.1',
    port:     parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
};

module.exports = connection;
