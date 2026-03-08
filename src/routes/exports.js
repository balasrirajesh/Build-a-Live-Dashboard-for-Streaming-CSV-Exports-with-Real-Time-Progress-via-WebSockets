const express = require('express');
const router = express.Router();
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { addExportJob, exportQueue } = require('../queue');

// POST /api/exports  — create & enqueue a new export job
router.post('/', async (req, res) => {
    const exportId = uuidv4();
    await db.query(
        'INSERT INTO exports (id, status, created_at) VALUES ($1, \'queued\', NOW())',
        [exportId]
    );
    await addExportJob(exportId);
    res.status(202).json({ exportId });
});

// GET /api/exports  — list recent exports
router.get('/', async (req, res) => {
    const result = await db.query(
        'SELECT id AS "exportId", status, created_at AS "createdAt", completed_at AS "completedAt" FROM exports ORDER BY created_at DESC LIMIT 50'
    );
    res.status(200).json({ exports: result.rows });
});

// DELETE /api/exports/:id  — cancel a running export
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const job = await exportQueue.getJob(id);
        if (job) {
            await job.discard();
            await job.moveToFailed({ message: 'Cancelled by user' }, true);
        }
        await db.query(
            'UPDATE exports SET status = \'cancelled\' WHERE id = $1 AND status IN (\'queued\', \'processing\')',
            [id]
        );
        res.status(200).json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/exports/:id/download  — stream the CSV file to the client
router.get('/:id/download', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            'SELECT file_path, status FROM exports WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Export not found' });
        const { file_path, status } = result.rows[0];
        if (status !== 'completed') return res.status(409).json({ error: `Export is ${status}` });
        if (!file_path || !fs.existsSync(file_path)) return res.status(404).json({ error: 'File not found on disk' });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="export-${id}.csv"`);
        fs.createReadStream(file_path).pipe(res);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
