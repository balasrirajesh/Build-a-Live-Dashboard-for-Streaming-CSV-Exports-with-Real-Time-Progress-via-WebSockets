const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { addExportJob } = require('../queue');

// POST /api/exports
router.post('/', async (req, res) => {
    const exportId = uuidv4();
    await db.query(
        INSERT INTO exports (id, status, created_at) VALUES (, 'queued', NOW()),
        [exportId]
    );
    await addExportJob(exportId);
    res.status(202).json({ exportId });
});

// GET /api/exports
router.get('/', async (req, res) => {
    const result = await db.query(
        SELECT id AS "exportId", status, created_at AS "createdAt", completed_at AS "completedAt"
         FROM exports ORDER BY created_at DESC LIMIT 50
    );
    res.status(200).json({ exports: result.rows });
});

module.exports = router;

