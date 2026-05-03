const { Queue } = require('bullmq');
const connection = require('./connection');

const JOB_OPTIONS = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,  // keep last 100 completed jobs for inspection
    removeOnFail:     50,
};

const emailQueue = new Queue('email', {
    connection,
    defaultJobOptions: JOB_OPTIONS,
});

const notificationQueue = new Queue('notification', {
    connection,
    defaultJobOptions: JOB_OPTIONS,
});

emailQueue.on('error',        (err) => console.error('[queue:email] error:', err.message));
notificationQueue.on('error', (err) => console.error('[queue:notification] error:', err.message));

module.exports = { emailQueue, notificationQueue };
