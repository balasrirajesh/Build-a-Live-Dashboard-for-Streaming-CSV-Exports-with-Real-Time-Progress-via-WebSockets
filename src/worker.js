const fs = require('fs');
const path = require('path');
const { format } = require('fast-csv');
const { exportQueue } = require('./queue');
const db = require('./db');
const { publisher } = require('./redis');

const EXPORTS_DIR = '/tmp/exports';
const TOTAL_USERS = 100000;
const BATCH_SIZE = 1000;

if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });

async function updateExportStatus(exportId, fields) {
    const keys = Object.keys(fields);
    const vals = Object.values(fields);
    const set = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    await db.query(`UPDATE exports SET ${set} WHERE id = $${keys.length + 1}`, [...vals, exportId]);
}

function publish(exportId, payload) {
    const finalPayload = {
        exportId,
        ...payload,
        timestamp: new Date().toISOString()
    };
    publisher.publish(`export-progress:${exportId}`, JSON.stringify(finalPayload));
}

exportQueue.process(async (job) => {
    const { exportId } = job.data;
    const startTime = Date.now();
    const filePath = path.join(EXPORTS_DIR, `${exportId}.csv`);

    await updateExportStatus(exportId, { status: 'processing' });
    publish(exportId, { status: 'processing', progress: { processed: 0, total: TOTAL_USERS, percentage: 0, etaSeconds: null } });

    const writeStream = fs.createWriteStream(filePath);
    const csvStream = format({ headers: true });
    csvStream.pipe(writeStream);

    let processed = 0;

    for (let offset = 0; offset < TOTAL_USERS; offset += BATCH_SIZE) {
        // Check if job has been cancelled
        const freshJob = await job.queue.getJob(job.id);
        if (!freshJob || await freshJob.isFailed()) {
            csvStream.end();
            await updateExportStatus(exportId, { status: 'cancelled' });
            publish(exportId, { status: 'cancelled' });
            return;
        }

        const result = await db.query(
            'SELECT id, name, email, created_at FROM users ORDER BY id LIMIT $1 OFFSET $2',
            [BATCH_SIZE, offset]
        );
        for (const row of result.rows) csvStream.write(row);

        processed += result.rows.length;
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = processed / elapsed;
        const remaining = TOTAL_USERS - processed;
        const etaSeconds = rate > 0 ? remaining / rate : null;
        const percentage = Math.round((processed / TOTAL_USERS) * 100);

        publish(exportId, {
            status: 'processing',
            progress: { processed, total: TOTAL_USERS, percentage, etaSeconds: etaSeconds !== null ? Math.round(etaSeconds) : null }
        });
    }

    csvStream.end();
    await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    });

    const fileSize = fs.statSync(filePath).size;
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    await updateExportStatus(exportId, {
        status: 'completed',
        completed_at: new Date(),
        file_path: filePath,
        file_size: fileSize,
    });

    publish(exportId, {
        status: 'completed',
        fileSize,
        durationSeconds,
        downloadUrl: `/api/exports/${exportId}/download`,
    });

    console.log(`[worker] Export ${exportId} done in ${durationSeconds}s`);
});

exportQueue.on('failed', async (job, err) => {
    const { exportId } = job.data;
    if (err.message === 'Cancelled by user') {
        try {
            await updateExportStatus(exportId, { status: 'cancelled' });
            publish(exportId, { status: 'cancelled' });
        } catch (_) {}
        return;
    }
    console.error(`[worker] Job ${job.id} failed:`, err.message);
    try {
        await updateExportStatus(exportId, { status: 'failed' });
        publish(exportId, { status: 'failed', error: err.message });
    } catch (_) { }
});

console.log('[worker] listening for jobs...');
