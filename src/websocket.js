const WebSocket = require('ws');
const url = require('url');
const http = require('http');
const { subscriber } = require('./redis');

const clients = new Map();
const subscribedChannels = new Set();

subscriber.on('message', (channel, message) => {
    const exportId = channel.replace('export:', '');
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
        const channel = `export:${exportId}`;
        if (!clients.has(exportId)) clients.set(exportId, new Set());
        clients.get(exportId).add(ws);
        if (!subscribedChannels.has(channel)) { subscriber.subscribe(channel); subscribedChannels.add(channel); }

        ws.on('message', (raw) => {
            try {
                const msg = JSON.parse(raw);
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

        ws.on('close', () => {
            clients.get(exportId)?.delete(ws);
        });
    });
    console.log('[ws] WebSocket server attached');
    return wss;
}

module.exports = { setupWebSocket };
