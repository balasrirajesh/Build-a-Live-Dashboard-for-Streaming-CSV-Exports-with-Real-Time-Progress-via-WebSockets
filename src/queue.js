const Bull = require('bull');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const exportQueue = new Bull('csv-exports', redisUrl, {
    defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 50,
        attempts: 1,
    },
});

exportQueue.on('error', (err) => console.error('[queue] Error:', err.message));

async function addExportJob(exportId) {
    const job = await exportQueue.add({ exportId }, { jobId: exportId });
    console.log(`[queue] Added job ${job.id} for export ${exportId}`);
    return job;
}

module.exports = { exportQueue, addExportJob };
