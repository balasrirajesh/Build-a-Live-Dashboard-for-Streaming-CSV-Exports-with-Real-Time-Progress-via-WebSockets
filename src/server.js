const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectRedis } = require('./redis');
const exportsRouter = require('./routes/exports');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/exports', exportsRouter);
app.use(express.static(path.join(__dirname, '..', 'public')));

async function start() {
    await connectRedis();
    const PORT = parseInt(process.env.PORT || '8080', 10);
    server.listen(PORT, '0.0.0.0', () => console.log([server] Listening on http://0.0.0.0:));
}

start().catch((err) => { console.error(err); process.exit(1); });
