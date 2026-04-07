const WebSocket = require('ws');
const url = require('url');
const http = require('http');
const { subscriber } = require('./redis');

const clients = new Map();
const subscribedChannels = new Set();

subscriber.on('message', (channel, message) => {
    const exportId = channel.replace('export-progress:', '');
    const wsClients = clients.get(exportId);
    if (!wsClients || wsClients.size === 0) return;
    wsClients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(message);
    });
});

function setupWebSocket(server) {
    const wss = new WebSocket.Server({ server });
    wss.on('connection', (ws, req) => {
        const match = url.parse(req.url).pathname.match(/^\/ws\/exports\/([^/]+)$/);
        if (!match) { ws.close(1003, 'Invalid path'); return; }
        const exportId = match[1];
        const channel = `export-progress:${exportId}`;
        if (!clients.has(exportId)) clients.set(exportId, new Set());
        clients.get(exportId).add(ws);
        if (!subscribedChannels.has(channel)) { subscriber.subscribe(channel); subscribedChannels.add(channel); }

        // Fetch latest status to provide immediate feedback on connection
        (async () => {
            try {
                const res = await db.query('SELECT status, file_size FROM exports WHERE id = $1', [exportId]);
                if (res.rows.length > 0) {
                    const row = res.rows[0];
                    if (row.status === 'completed') {
                        ws.send(JSON.stringify({
                            exportId,
                            status: 'completed',
                            downloadUrl: `/api/exports/${exportId}/download`,
                            fileSize: parseInt(row.file_size, 10),
                            timestamp: new Date().toISOString()
                        }));
                    } else if (row.status === 'failed' || row.status === 'cancelled') {
                        ws.send(JSON.stringify({ exportId, status: row.status, timestamp: new Date().toISOString() }));
                    } else if (row.status === 'processing' || row.status === 'queued') {
                        ws.send(JSON.stringify({ exportId, status: row.status, timestamp: new Date().toISOString() }));
                    }
                }
            } catch (_) {}
        })();

        ws.on('message', (raw) => {
            const data = raw.toString();
            
            // Handle plain string 'ping'
            if (data === 'ping') {
                ws.send('pong');
                return;
            }

            try {
                const msg = JSON.parse(data);
                
                // Handle JSON ping
                if (msg.action === 'ping' || msg.type === 'ping') {
                    ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
                    return;
                }

                if (msg.action === 'cancel') {
                    const opts = {
                        hostname: 'localhost',
                        port: parseInt(process.env.PORT || '8080', 10),
                        path: `/api/exports/${exportId}`,
                        method: 'DELETE',
                    };
                    const req2 = http.request(opts);
                    req2.on('error', (e) => console.error('[ws] cancel request error:', e.message));
                    req2.end();
                }
            } catch (_) { }
        });

        // Built-in websocket ping frame support (send pong on ping)
        ws.on('ping', () => ws.pong());

        ws.on('close', () => {
            clients.get(exportId)?.delete(ws);
        });
    });
    console.log('[ws] WebSocket server attached');
    return wss;
}

module.exports = { setupWebSocket };
