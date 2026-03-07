# Live CSV Export Dashboard

A full-stack service that exports large datasets to CSV with **real-time progress updates** streamed to the browser via WebSockets.

Built with **Node.js**, **PostgreSQL**, **Redis (Bull + Pub/Sub)**, and **Docker**.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [API Reference](#api-reference)
8. [WebSocket API](#websocket-api)
9. [Database Schema](#database-schema)
10. [How It Works](#how-it-works)
11. [Manual Testing](#manual-testing)
12. [Docker Services](#docker-services)
13. [License](#license)

---

## Features

- **Async Job Processing** — Export jobs are queued with [Bull](https://github.com/OptimalBits/bull) and processed in the background without blocking the API.
- **Real-Time Progress** — Live per-job progress updates streamed to the browser via WebSockets, including percentage, rows processed, and estimated time remaining.
- **Cancellation Support** — Cancel any in-progress export at any time from the dashboard or directly through the WebSocket channel.
- **CSV Download** — Download completed exports through a streaming HTTP endpoint with no memory buffering.
- **Heartbeat Mechanism** — WebSocket connections are kept alive with periodic server-side ping/pong frames every 30 seconds.
- **Fully Dockerized** — A single `docker compose up --build` command starts the entire stack.
- **Auto-seeded Database** — PostgreSQL is pre-seeded with 100,000 synthetic user records on first startup.

---

## Tech Stack

| Layer           | Technology       | Purpose                                        |
|-----------------|------------------|------------------------------------------------|
| Runtime         | Node.js 20       | JavaScript server runtime                      |
| API Framework   | Express.js 4     | HTTP REST API                                  |
| WebSocket       | ws               | Real-time bidirectional communication          |
| Job Queue       | Bull 4           | Background job processing backed by Redis      |
| Database        | PostgreSQL 16    | Persistent export metadata and user data       |
| Cache / Pub-Sub | Redis 7          | Job queue storage and real-time event channel  |
| CSV Generation  | fast-csv         | Memory-efficient streaming CSV writer          |
| Containers      | Docker Compose   | Service orchestration                          |

---

## Architecture

```
+------------------------------------------------------------------+
|                         Browser (Client)                         |
|                                                                  |
|   POST /api/exports          --> Start a new export              |
|   GET  /api/exports          --> List recent exports             |
|   WS   /ws/exports/{id}      --> Receive live progress updates   |
|   GET  /api/exports/{id}/download --> Download completed CSV     |
+---------------------------+------------------+-------------------+
                            | HTTP             | WebSocket
                            v                  v
+------------------------------------------------------------------+
|                  Node.js Application  (Port 8080)                |
|                                                                  |
|  +----------------+   +------------------+   +---------------+  |
|  |  Express API   |   |  WebSocket Srv   |   |  Bull Worker  |  |
|  |  server.js     |   |  websocket.js    |   |  worker.js    |  |
|  |                |   |                  |   |               |  |
|  | POST /exports  |   | /ws/exports/{id} |   | Reads DB in   |  |
|  | GET  /exports  |   |                  |   | batches of    |  |
|  | GET  /download |   | Subscribes to    |   | 1,000 rows    |  |
|  +-------+--------+   | Redis channel    |   |               |  |
|          |            | per export ID    |   | Writes CSV to |  |
|          | enqueue    +--------+---------+   | /tmp/exports/ |  |
|          v                     |             |               |  |
|  +----------------+            |             | Publishes     |  |
|  |   Bull Queue   |            |             | progress to   |  |
|  |   queue.js     |            |             | Redis Pub/Sub |  |
|  +----------------+            +-------------+---------------+  |
|                                     Redis Pub/Sub               |
+-----------------------------+------------------+----------------+
                              |                  |
                              v                  v
              +---------------+--+   +-----------+------------+
              |  PostgreSQL :5432 |   |       Redis :6379      |
              |                  |   |                        |
              |  exports table   |   |  Bull Queue            |
              |  users table     |   |  Pub/Sub channels      |
              |  (100,000 rows)  |   |  Cancel flags          |
              +------------------+   +------------------------+
```

### Request and Event Flow

```
Client          API Server        Bull Queue       Worker        Redis        WebSocket
  |                |                  |              |              |              |
  |-- POST /exports-->                |              |              |              |
  |                |-- add job ------>|              |              |              |
  |<-- 202 { exportId } -------------|              |              |              |
  |                |                  |-- process -->|              |              |
  |-- WS connect ---------------------------------------------------------------->|
  |                |                  |              |-- publish -->|              |
  |                |                  |              |  (progress)  |-- forward -->|
  |<-- { status, progress% } ----------------------------------------------- -----|
  |                |                  |              |-- publish -->|              |
  |                |                  |              | (completed)  |-- forward -->|
  |<-- { status: completed, downloadUrl } --------------------------------------- -|
  |-- GET /download -->               |              |              |              |
  |<-- CSV stream -----|              |              |              |              |
```

---

## Project Structure

```
.
├── docker-compose.yml       # Orchestrates app, PostgreSQL, and Redis
├── Dockerfile               # Node.js 20 Alpine image
├── package.json
├── .env.example             # Environment variable template
│
├── public/
│   └── index.html           # Single-page dashboard UI
│
├── seeds/
│   └── init.sql             # Creates tables and seeds 100k users
│
└── src/
    ├── server.js            # Express app entry point
    ├── db.js                # PostgreSQL pool connection
    ├── redis.js             # ioredis publisher and subscriber
    ├── queue.js             # Bull queue configuration
    ├── websocket.js         # WebSocket server + Redis Pub/Sub bridge
    ├── worker.js            # CSV export job processor
    └── routes/
        └── exports.js       # REST API route handlers
```

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose v2+
- Node.js 20+ (optional, only needed for local development without Docker)

### Step 1 — Clone the repository

```bash
git clone https://github.com/balasrirajesh/Build-a-Live-Dashboard-for-Streaming-CSV-Exports-with-Real-Time-Progress-via-WebSockets.git
cd Build-a-Live-Dashboard-for-Streaming-CSV-Exports-with-Real-Time-Progress-via-WebSockets
```

### Step 2 — Configure environment variables

```bash
cp .env.example .env
# The defaults work out of the box with Docker Compose.
# Edit .env only if you need to use custom credentials.
```

### Step 3 — Start all services

```bash
docker compose up --build
```

This will:

1. Build the Node.js application Docker image
2. Start PostgreSQL and wait for it to pass its health check
3. Automatically run `seeds/init.sql` to create tables and seed 100,000 users
4. Start Redis
5. Start the application on port **8080**

### Step 4 — Open the dashboard

Visit [http://localhost:8080](http://localhost:8080) in your browser.

---

## Environment Variables

| Variable       | Default                                          | Description                    |
|----------------|--------------------------------------------------|--------------------------------|
| `PORT`         | `8080`                                           | HTTP server listening port     |
| `DATABASE_URL` | `postgres://postgres:postgres@db:5432/exports_db`| PostgreSQL connection string   |
| `REDIS_URL`    | `redis://redis:6379`                             | Redis connection string        |

---

## API Reference

### POST /api/exports

Start a new CSV export job. The job is queued immediately and processed in the background.

**Response — 202 Accepted**

```json
{
  "exportId": "3f6e4567-e89b-12d3-a456-426614174000"
}
```

---

### GET /api/exports

List the 50 most recently created export jobs.

**Response — 200 OK**

```json
{
  "exports": [
    {
      "exportId": "3f6e4567-e89b-12d3-a456-426614174000",
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "completedAt": "2024-01-15T10:30:45.000Z"
    }
  ]
}
```

---

### GET /api/exports/:exportId/download

Download a completed export as a CSV file. The file is streamed directly from disk.

| Response Code | Meaning                                          |
|---------------|--------------------------------------------------|
| `200`         | CSV file bytes (`Content-Type: text/csv`)        |
| `404`         | Export not found, or CSV file missing from disk  |
| `409`         | Export exists but is not yet in `completed` state|

---

### GET /health

Health check used by Docker and load balancers.

**Response — 200 OK**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## WebSocket API

Connect to a per-export channel to receive live status and progress events.

**Endpoint:** `ws://localhost:8080/ws/exports/{exportId}`

### Messages from Server to Client

#### Progress update (sent every ~500 ms during processing)

```json
{
  "exportId": "3f6e4567-...",
  "status": "processing",
  "progress": {
    "total": 100000,
    "processed": 45000,
    "percentage": 45,
    "etaSeconds": 12
  },
  "timestamp": "2024-01-15T10:30:20.000Z"
}
```

#### Export completed

```json
{
  "exportId": "3f6e4567-...",
  "status": "completed",
  "downloadUrl": "/api/exports/3f6e4567-.../download",
  "fileSize": 8388608,
  "durationSeconds": 42.35
}
```

#### Export failed

```json
{
  "exportId": "3f6e4567-...",
  "status": "failed",
  "error": "Database connection lost",
  "timestamp": "2024-01-15T10:30:20.000Z"
}
```

#### Export cancelled

```json
{
  "exportId": "3f6e4567-...",
  "status": "cancelled",
  "timestamp": "2024-01-15T10:30:20.000Z"
}
```

### Messages from Client to Server

#### Cancel an in-progress export

```json
{ "action": "cancel" }
```

#### Application-level ping / keepalive

```json
{ "type": "ping" }
```

The server responds with:

```json
{ "type": "pong", "timestamp": "2024-01-15T10:30:20.000Z" }
```

---

## Database Schema

### exports table

Tracks the lifecycle of every export job.

| Column            | Type           | Description                                              |
|-------------------|----------------|----------------------------------------------------------|
| `id`              | VARCHAR(36)    | UUID — primary key                                       |
| `status`          | VARCHAR(20)    | `queued`, `processing`, `completed`, `failed`, `cancelled` |
| `created_at`      | TIMESTAMP      | Job creation time                                        |
| `completed_at`    | TIMESTAMP      | Completion time (null until done)                        |
| `file_path`       | TEXT           | Absolute path to the generated CSV on disk               |
| `file_size`       | BIGINT         | File size in bytes                                       |
| `duration_seconds`| NUMERIC(10,2)  | Total processing time in seconds                         |
| `error_message`   | TEXT           | Error details if the job failed                          |

### users table

Source data for CSV exports. Pre-seeded with 100,000 rows.

| Column       | Type         | Description                  |
|--------------|--------------|------------------------------|
| `id`         | SERIAL       | Auto-incrementing primary key |
| `name`       | VARCHAR(255) | User display name             |
| `email`      | VARCHAR(255) | Unique email address          |
| `created_at` | TIMESTAMP    | Account creation timestamp    |

---

## How It Works

### Export job lifecycle

```
queued  -->  processing  -->  completed
                         \->  failed
                         \->  cancelled
```

1. The client sends `POST /api/exports`. The API inserts a row with `status = queued` into PostgreSQL, then adds a Bull job to Redis.
2. The Bull worker picks up the job, sets `status = processing`, and starts reading users from PostgreSQL in batches of 1,000 rows at a time.
3. After each batch, the worker publishes a progress event to a Redis Pub/Sub channel named `export:{exportId}`. Events include percentage complete and estimated time remaining, throttled to at most one per 500 ms.
4. The WebSocket server subscribes to that Redis channel when a browser client connects, and forwards every message directly to the connected client.
5. When all rows are written, the CSV is finalized on disk, the DB row is updated to `completed`, and a final WebSocket message is sent with the download URL.
6. To cancel, the browser sends `{ "action": "cancel" }` over the WebSocket. The server writes a `cancel:{exportId}` flag to Redis. The worker checks this flag before processing each batch and stops gracefully, deleting the partial file and setting `status = cancelled`.

### Redis key reference

| Key                  | Type        | Purpose                                           |
|----------------------|-------------|---------------------------------------------------|
| `bull:csv-exports:*` | Hash / List | Internal Bull queue data                          |
| `export:{exportId}`  | Pub/Sub     | Real-time progress and status events              |
| `cancel:{exportId}`  | String      | Cancellation flag (`"1"`), expires after 1 hour  |

---

## Manual Testing

### With curl (bash / WSL)

```bash
# Start a new export
EXPORT_ID=$(curl -s -X POST http://localhost:8080/api/exports | jq -r '.exportId')
echo "Export ID: $EXPORT_ID"

# Check the job list
curl -s http://localhost:8080/api/exports | jq

# Download the file after completion
curl -O -J "http://localhost:8080/api/exports/$EXPORT_ID/download"
```

### WebSocket with wscat

```bash
npx wscat -c ws://localhost:8080/ws/exports/$EXPORT_ID

# To cancel, type in the wscat REPL:
> {"action":"cancel"}
```

---

## Docker Services

| Service | Image                  | Port          | Role                              |
|---------|------------------------|---------------|-----------------------------------|
| `app`   | node:20-alpine (custom)| 8080 (public) | Express API + Worker + WebSocket  |
| `db`    | postgres:16-alpine     | internal only | Persistent data store             |
| `redis` | redis:7-alpine         | internal only | Job queue and Pub/Sub broker      |

All three services have health checks configured. The `app` container is blocked from starting until both `db` and `redis` pass their health checks.

---

## License

MIT