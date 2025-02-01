const fs = require('fs');
const path = require('path');
const { format } = require('fast-csv');
const { exportQueue } = require('./queue');
const db = require('./db');

const EXPORTS_DIR = '/tmp/exports';
const TOTAL_USERS = 100000;
const BATCH_SIZE  = 1000;

if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });

async function updateExportStatus(exportId, fields) {
    const keys = Object.keys(fields);
    const vals = Object.values(fields);
    const set  = keys.map((k, i) => ${k} = {i + 1}).join(', ');
    await db.query(UPDATE exports SET  WHERE id = {keys.length + 1}, [...vals, exportId]);
}

exportQueue.process(async (job) => {
    const { exportId } = job.data;
    const filePath = path.join(EXPORTS_DIR, export-.csv);
    const writeStream = fs.createWriteStream(filePath);
    const csvStream   = format({ headers: true });
    csvStream.pipe(writeStream);

    for (let offset = 0; offset < TOTAL_USERS; offset += BATCH_SIZE) {
        const result = await db.query(
            'SELECT id, name, email, created_at FROM users ORDER BY id LIMIT  OFFSET ',
            [BATCH_SIZE, offset]
        );
        for (const row of result.rows) csvStream.write(row);
    }

    csvStream.end();
    await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    });
    console.log([worker] Export  done);
});

console.log('[worker] listening for jobs...');

