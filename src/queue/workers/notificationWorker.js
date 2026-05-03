require('dotenv').config();
const { Worker } = require('bullmq');
const connection = require('../connection');

// ── Job handlers ───────────────────────────────────────────────────────────────

const handlers = {
    taskAssigned({ userId, taskId, taskTitle }) {
        // Replace with push notification service, FCM, etc.
        console.log(`[notification] Task assigned — user: ${userId}, task: "${taskTitle}" (${taskId})`);
    },

    taskUpdated({ userId, taskId, taskTitle, newStatus }) {
        console.log(`[notification] Task updated — user: ${userId}, task: "${taskTitle}" → ${newStatus} (${taskId})`);
    },
};

// ── Worker ─────────────────────────────────────────────────────────────────────

const worker = new Worker(
    'notification',
    async (job) => {
        console.log(`[notification worker] processing job ${job.id} (${job.name})`);

        const handler = handlers[job.name];
        if (!handler) throw new Error(`Unknown job type: ${job.name}`);

        await handler(job.data);
    },
    {
        connection,
        concurrency: 10,
    }
);

// ── Lifecycle logging ──────────────────────────────────────────────────────────

worker.on('completed', (job) => {
    console.log(`[notification worker] job ${job.id} (${job.name}) completed`);
});

worker.on('failed', (job, err) => {
    console.error(`[notification worker] job ${job?.id} (${job?.name}) failed [attempt ${job?.attemptsMade}/${job?.opts?.attempts}]: ${err.message}`);
});

worker.on('error', (err) => {
    console.error('[notification worker] worker error:', err.message);
});

console.log('[notification worker] started — waiting for jobs…');
