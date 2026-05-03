require('dotenv').config();
const { Worker } = require('bullmq');
const connection = require('../connection');

// ── Job handlers ───────────────────────────────────────────────────────────────

const handlers = {
    sendInviteEmail({ email, projectName, invitedBy }) {
        // Replace console.log with a real email client (nodemailer, SendGrid, etc.)
        console.log(`[email] Sending invite to ${email} — project: "${projectName}" — invited by: ${invitedBy}`);
    },
};

// ── Worker ─────────────────────────────────────────────────────────────────────

const worker = new Worker(
    'email',
    async (job) => {
        console.log(`[email worker] processing job ${job.id} (${job.name})`);

        const handler = handlers[job.name];
        if (!handler) throw new Error(`Unknown job type: ${job.name}`);

        await handler(job.data);
    },
    {
        connection,
        concurrency: 5,
    }
);

// ── Lifecycle logging ──────────────────────────────────────────────────────────

worker.on('completed', (job) => {
    console.log(`[email worker] job ${job.id} (${job.name}) completed`);
});

worker.on('failed', (job, err) => {
    console.error(`[email worker] job ${job?.id} (${job?.name}) failed [attempt ${job?.attemptsMade}/${job?.opts?.attempts}]: ${err.message}`);
});

worker.on('error', (err) => {
    // Connection-level errors — never crash the process
    console.error('[email worker] worker error:', err.message);
});

console.log('[email worker] started — waiting for jobs…');
