const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const publisher  = new Redis(redisUrl);
const subscriber = new Redis(redisUrl);

async function connectRedis() {
    await publisher.ping();
    await subscriber.ping();
    console.log('[redis] Connected');
}

module.exports = { publisher, subscriber, connectRedis };
