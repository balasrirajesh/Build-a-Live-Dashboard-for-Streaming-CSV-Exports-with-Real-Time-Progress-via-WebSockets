# ðŸ“Š Live CSV Export Dashboard

> **A full-stack service that exports large datasets to CSV files with real-time WebSocket progress tracking, built with Node.js, PostgreSQL, Redis, and Docker.**

![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time-010101?style=flat-square&logo=websocket)

---

## âœ¨ Features

- **ðŸš€ Async Job Processing** â€” Export jobs are queued with [Bull](https://github.com/OptimalBits/bull) and processed in the background without blocking the API
- **ðŸ“¡ Real-Time Progress** â€” Live per-job progress updates streamed to the browser via WebSockets (progress %, ETA, rows processed)
- **âŒ Cancellation Support** â€” Cancel any in-progress export at any time from the dashboard or via the WebSocket channel
- **ðŸ“¥ CSV Download** â€” Download completed exports directly through a streaming HTTP endpoint
- **ðŸ’“ Heartbeat Mechanism** â€” WebSocket connections are kept alive with periodic ping/pong frames
- **ðŸ³ Fully Dockerized** â€” Single `docker compose up` command brings the full stack online
- **ðŸŒ± Auto-seeded Database** â€” PostgreSQL is pre-seeded with 100,000 synthetic user records on first run

---

## ðŸ—ï¸ Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                          Browser / Client                           â”‚
â”‚                                                                     â”‚
â”‚   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚   â”‚                     Dashboard (index.html)                   â”‚  â”‚
â”‚   â”‚  - POST /api/exports        â†’ Start export                   â”‚  â”‚
â”‚   â”‚  - GET  /api/exports        â†’ List recent exports            â”‚  â”‚
â”‚   â”‚  - WS   /ws/exports/{id}    â†’ Receive live progress updates  â”‚  â”‚
â”‚   â”‚  - GET  /api/exports/{id}/download  â†’ Download CSV           â”‚  â”‚
â”‚   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                           â”‚ HTTP / WS             â”‚
                           â–¼                       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                     Node.js Application (Port 8080)                  â”‚
â”‚                                                                      â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚   Express API   â”‚   â”‚  WebSocket Srv  â”‚   â”‚   Bull Worker    â”‚   â”‚
â”‚  â”‚   server.js     â”‚   â”‚  websocket.js   â”‚   â”‚   worker.js      â”‚   â”‚
â”‚  â”‚                 â”‚   â”‚                 â”‚   â”‚                  â”‚   â”‚
â”‚  â”‚ POST /exports   â”‚   â”‚ Path:           â”‚   â”‚ - Reads DB in    â”‚   â”‚
â”‚  â”‚ GET  /exports   â”‚   â”‚ /ws/exports/    â”‚   â”‚   batches of     â”‚   â”‚
â”‚  â”‚ GET  /download  â”‚â”€â”€â–¶â”‚ {exportId}      â”‚   â”‚   1,000 rows     â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚                 â”‚   â”‚ - Writes CSV     â”‚   â”‚
â”‚           â”‚            â”‚ Subscribes to   â”‚   â”‚   to /tmp/       â”‚   â”‚
â”‚           â”‚ enqueue    â”‚ Redis channel   â”‚   â”‚ - Publishes      â”‚   â”‚
â”‚           â–¼            â”‚ per exportId    â”‚   â”‚   progress to    â”‚   â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚   Redis Pub/Sub  â”‚   â”‚
â”‚  â”‚   Bull Queue    â”‚            â”‚             â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚  â”‚   queue.js      â”‚            â”‚                      â”‚             â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜            â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜             â”‚
â”‚                                          Redis Pub/Sub              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
               â”‚                                  â”‚
               â–¼                                  â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  PostgreSQL :5432   â”‚              â”‚          Redis :6379            â”‚
â”‚                     â”‚              â”‚                                 â”‚
â”‚  exports table      â”‚              â”‚  Bull Queue: "csv-exports"      â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚              â”‚  Pub/Sub: "export:{id}"         â”‚
â”‚  â”‚ id (UUID)     â”‚  â”‚              â”‚  Cancel Flag: "cancel:{id}"     â”‚
â”‚  â”‚ status        â”‚  â”‚              â”‚                                 â”‚
â”‚  â”‚ created_at    â”‚  â”‚              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”‚  â”‚ completed_at  â”‚  â”‚
â”‚  â”‚ file_path     â”‚  â”‚
â”‚  â”‚ file_size     â”‚  â”‚
â”‚  â”‚ duration_secs â”‚  â”‚
â”‚  â”‚ error_message â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                     â”‚
â”‚  users table        â”‚
â”‚  (100,000 rows)     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Data Flow

```
Client                  API              Bull Queue          Worker           Redis Pub/Sub       WebSocket
  â”‚                      â”‚                   â”‚                 â”‚                   â”‚                  â”‚
  â”‚â”€â”€â”€ POST /exports â”€â”€â”€â–¶â”‚                   â”‚                 â”‚                   â”‚                  â”‚
  â”‚                      â”‚â”€â”€ addJob â”€â”€â”€â”€â”€â”€â”€â”€â–¶â”‚                 â”‚                   â”‚                  â”‚
  â”‚â—€â”€â”€ 202 {exportId} â”€â”€â”€â”‚                   â”‚                 â”‚                   â”‚                  â”‚
  â”‚                      â”‚                   â”‚â”€â”€ processJob â”€â”€â–¶â”‚                   â”‚                  â”‚
  â”‚â”€â”€â”€ WS connect â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶â”‚
  â”‚                      â”‚                   â”‚                 â”‚â”€â”€ publish â”€â”€â”€â”€â”€â”€â”€â–¶â”‚                  â”‚
  â”‚                      â”‚                   â”‚                 â”‚   (progress)      â”‚â”€â”€ forward msg â”€â”€â–¶â”‚
  â”‚â—€â”€ {status, progress%} â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
  â”‚                      â”‚                   â”‚                 â”‚â”€â”€ publish â”€â”€â”€â”€â”€â”€â”€â–¶â”‚                  â”‚
  â”‚                      â”‚                   â”‚                 â”‚   (completed)     â”‚â”€â”€ forward msg â”€â”€â–¶â”‚
  â”‚â—€â”€ {status:completed, downloadUrl} â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
  â”‚â”€â”€â”€ GET /download â”€â”€â”€â–¶â”‚                   â”‚                 â”‚                   â”‚                  â”‚
  â”‚â—€â”€â”€ CSV stream â”€â”€â”€â”€â”€â”€â”€â”‚                   â”‚                 â”‚                   â”‚                  â”‚
```

---

## ðŸ—‚ï¸ Project Structure

```
.
â”œâ”€â”€ docker-compose.yml          # Orchestrates app, PostgreSQL, and Redis
â”œâ”€â”€ Dockerfile                  # Multi-stage Node.js 20 Alpine image
â”œâ”€â”€ package.json
â”œâ”€â”€ .env.example                # Environment variable template
â”‚
â”œâ”€â”€ public/
â”‚   â””â”€â”€ index.html              # Single-page dashboard UI
â”‚
â”œâ”€â”€ seeds/
â”‚   â””â”€â”€ init.sql                # DB schema + 100k user seed data
â”‚
â””â”€â”€ src/
    â”œâ”€â”€ server.js               # Express app + HTTP server bootstrap
    â”œâ”€â”€ queue.js                # Bull queue configuration
    â”œâ”€â”€ redis.js                # ioredis publisher + subscriber clients
    â”œâ”€â”€ db.js                   # pg Pool connection
    â”œâ”€â”€ websocket.js            # WebSocket server + Redis Pub/Sub bridge
    â”œâ”€â”€ worker.js               # CSV export job processor
    â””â”€â”€ routes/
        â””â”€â”€ exports.js          # REST API route handlers
```

---

## âš™ï¸ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js 20 | JavaScript server runtime |
| **API Framework** | Express.js 4 | HTTP REST API |
| **WebSocket** | `ws` library | Real-time bidirectional communication |
| **Job Queue** | Bull 4 | Background job processing and retry logic |
| **Database** | PostgreSQL 16 | Persistent export job metadata and user data |
| **Cache / Pub-Sub** | Redis 7 | Job queue backend + real-time progress events |
| **CSV Generation** | fast-csv | Streaming CSV writing for memory efficiency |
| **Containerization** | Docker Compose | Service orchestration |

---

## ðŸš€ Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started) & Docker Compose
- (Optional) Node.js 20+ for local development

### 1. Clone the repository

```bash
git clone <repository-url>
cd "Build a Live Dashboard for Streaming CSV Exports with Real-Time Progress via WebSockets"
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env if you need to override defaults
```

### 3. Start all services

```bash
docker compose up --build
```

This command will:
1. Build the Node.js application image
2. Start PostgreSQL and wait for it to be healthy
3. Auto-run `seeds/init.sql` to create the schema and seed 100,000 users
4. Start Redis
5. Start the application on **http://localhost:8080**

### 4. Open the Dashboard

Navigate to **[http://localhost:8080](http://localhost:8080)** in your browser.

---

## ðŸ“¡ API Reference

### `POST /api/exports`

Initiate a new CSV export job.

**Response** `202 Accepted`
```json
{
  "exportId": "3f6e4567-e89b-12d3-a456-426614174000"
}
```

---

### `GET /api/exports`

List the 50 most recent export jobs.

**Response** `200 OK`
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

### `GET /api/exports/:exportId/download`

Stream and download a completed CSV file.

| Status | Meaning |
|--------|---------|
| `200` | CSV file bytes, `Content-Type: text/csv` |
| `404` | Export not found or file missing from disk |
| `409` | Export is not yet in `completed` state |

---

### `GET /health`

Health check endpoint for Docker and load balancers.

**Response** `200 OK`
```json
{ "status": "ok", "timestamp": "2024-01-15T10:30:00.000Z" }
```

---

## ðŸ”Œ WebSocket API

Connect to a per-export WebSocket channel to receive live status and progress events.

**Endpoint:** `ws://localhost:8080/ws/exports/{exportId}`

### Server â†’ Client Messages

#### Progress Update
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

#### Completed
```json
{
  "exportId": "3f6e4567-...",
  "status": "completed",
  "downloadUrl": "/api/exports/3f6e4567-.../download",
  "fileSize": 8388608,
  "durationSeconds": 42.35
}
```

#### Failed
```json
{
  "exportId": "3f6e4567-...",
  "status": "failed",
  "error": "Database connection lost",
  "timestamp": "2024-01-15T10:30:20.000Z"
}
```

#### Cancelled
```json
{
  "exportId": "3f6e4567-...",
  "status": "cancelled",
  "timestamp": "2024-01-15T10:30:20.000Z"
}
```

### Client â†’ Server Messages

#### Cancel an Export
```json
{ "action": "cancel" }
```

#### Ping / Keepalive
```json
{ "type": "ping" }
```
Server responds with `{ "type": "pong", "timestamp": "..." }`.

---

## ðŸ—„ï¸ Database Schema

### `exports` table
| Column | Type | Description |
|--------|------|-------------|
| `id` | `VARCHAR(36)` | UUID export identifier (Primary Key) |
| `status` | `VARCHAR(20)` | `queued` \| `processing` \| `completed` \| `failed` \| `cancelled` |
| `created_at` | `TIMESTAMP` | Job creation time |
| `completed_at` | `TIMESTAMP` | Job completion time (nullable) |
| `file_path` | `TEXT` | Absolute path to generated CSV (nullable) |
| `file_size` | `BIGINT` | File size in bytes (nullable) |
| `duration_seconds` | `NUMERIC(10,2)` | Processing duration (nullable) |
| `error_message` | `TEXT` | Error details on failure (nullable) |

### `users` table
| Column | Type | Description |
|--------|------|-------------|
| `id` | `SERIAL` | Auto-incrementing user ID (Primary Key) |
| `name` | `VARCHAR(255)` | User's display name |
| `email` | `VARCHAR(255)` | Unique email address |
| `created_at` | `TIMESTAMP` | Account creation timestamp |

---

## ðŸ”§ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | HTTP server listening port |
| `DATABASE_URL` | `postgres://postgres:postgres@db:5432/exports_db` | PostgreSQL connection string |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |

---

## ðŸ—ï¸ How It Works â€” Deep Dive

### Export Job Lifecycle

```
queued â†’ processing â†’ completed
                    â†˜ failed
                    â†˜ cancelled
```

1. **Client** sends `POST /api/exports` â†’ API creates a record in PostgreSQL with status `queued` and enqueues a Bull job.
2. **Bull Worker** picks up the job, updates the DB to `processing`, and begins reading users in batches of 1,000 rows.
3. **Progress** is published to a Redis Pub/Sub channel (`export:{exportId}`) at most every 500ms with ETA and percentage.
4. **WebSocket Server** subscribes to the Redis channel on client connection and forwards all messages to connected browsers.
5. **On completion**, the CSV file is saved to `/tmp/exports/`, DB is updated to `completed`, and a final WebSocket message with the `downloadUrl` is sent.
6. **On cancellation**, the client sends `{ action: "cancel" }` via WebSocket. The server sets a Redis flag (`cancel:{exportId}`) that the worker checks before each batch, enabling graceful mid-export cancellation.

### Redis Usage

| Key pattern | Type | Purpose |
|-------------|------|---------|
| `bull:csv-exports:*` | Hash/List | Bull job queue internals |
| `export:{exportId}` | Pub/Sub channel | Real-time progress broadcasting |
| `cancel:{exportId}` | String (`"1"`) | Cancellation signal flag (TTL: 1 hour) |

---

## ðŸ§ª Manual Testing

### Using curl

```bash
# 1. Start an export
EXPORT_ID=$(curl -s -X POST http://localhost:8080/api/exports | jq -r '.exportId')
echo "Export ID: $EXPORT_ID"

# 2. List all exports
curl -s http://localhost:8080/api/exports | jq

# 3. Download (after completion)
curl -O -J "http://localhost:8080/api/exports/$EXPORT_ID/download"
```

### WebSocket Testing (wscat)

```bash
npx wscat -c ws://localhost:8080/ws/exports/$EXPORT_ID

# Cancel from WebSocket REPL:
> {"action":"cancel"}
```

---

## ðŸ³ Docker Services

| Service | Image | Port | Role |
|---------|-------|------|------|
| `app` | `node:20-alpine` (custom) | `8080` | Node.js API + Worker + WebSocket |
| `db` | `postgres:16-alpine` | â€” (internal) | Persistent data store |
| `redis` | `redis:7-alpine` | â€” (internal) | Job queue + Pub/Sub |

All services include health checks. The `app` container waits for both `db` and `redis` to be healthy before starting.
}
  ]
}
```

---

### `GET /api/exports/:exportId/download`

Stream and download a completed CSV file.

| Status | Meaning |
|--------|---------|
| `200` | CSV file bytes, `Content-Type: text/csv` |
| `404` | Export not found or file missing from disk |
| `409` | Export is not yet in `completed` state |

---

### `GET /health`

Health check endpoint for Docker and load balancers.

**Response** `200 OK`
```json
{ "status": "ok", "timestamp": "2024-01-15T10:30:00.000Z" }
```

---

## ðŸ”Œ WebSocket API

Connect to a per-export WebSocket channel to receive live status and progress events.

**Endpoint:** `ws://localhost:8080/ws/exports/{exportId}`

### Server â†’ Client Messages

#### Progress Update
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

#### Completed
```json
{
  "exportId": "3f6e4567-...",
  "status": "completed",
  "downloadUrl": "/api/exports/3f6e4567-.../download",
  "fileSize": 8388608,
  "durationSeconds": 42.35
}
```

#### Failed
```json
{
  "exportId": "3f6e4567-...",
  "status": "failed",
  "error": "Database connection lost",
  "timestamp": "2024-01-15T10:30:20.000Z"
}
```

#### Cancelled
```json
{
  "exportId": "3f6e4567-...",
  "status": "cancelled",
  "timestamp": "2024-01-15T10:30:20.000Z"
}
```

### Client â†’ Server Messages

#### Cancel an Export
```json
{ "action": "cancel" }
```

#### Ping / Keepalive
```json
{ "type": "ping" }
```
Server responds with `{ "type": "pong", "timestamp": "..." }`.

---

## ðŸ—„ï¸ Database Schema

### `exports` table
| Column | Type | Description |
|--------|------|-------------|
| `id` | `VARCHAR(36)` | UUID export identifier (Primary Key) |
| `status` | `VARCHAR(20)` | `queued` \| `processing` \| `completed` \| `failed` \| `cancelled` |
| `created_at` | `TIMESTAMP` | Job creation time |
| `completed_at` | `TIMESTAMP` | Job completion time (nullable) |
| `file_path` | `TEXT` | Absolute path to generated CSV (nullable) |
| `file_size` | `BIGINT` | File size in bytes (nullable) |
| `duration_seconds` | `NUMERIC(10,2)` | Processing duration (nullable) |
| `error_message` | `TEXT` | Error details on failure (nullable) |

### `users` table
| Column | Type | Description |
|--------|------|-------------|
| `id` | `SERIAL` | Auto-incrementing user ID (Primary Key) |
| `name` | `VARCHAR(255)` | User's display name |
| `email` | `VARCHAR(255)` | Unique email address |
| `created_at` | `TIMESTAMP` | Account creation timestamp |

---

## ðŸ”§ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | HTTP server listening port |
| `DATABASE_URL` | `postgres://postgres:postgres@db:5432/exports_db` | PostgreSQL connection string |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |

---

## ðŸ—ï¸ How It Works â€” Deep Dive

### Export Job Lifecycle

```
queued â†’ processing â†’ completed
                    â†˜ failed
                    â†˜ cancelled
```

1. **Client** sends `POST /api/exports` â†’ API creates a record in PostgreSQL with status `queued` and enqueues a Bull job.
2. **Bull Worker** picks up the job, updates the DB to `processing`, and begins reading users in batches of 1,000 rows.
3. **Progress** is published to a Redis Pub/Sub channel (`export:{exportId}`) at most every 500ms with ETA and percentage.
4. **WebSocket Server** subscribes to the Redis channel on client connection and forwards all messages to connected browsers.
5. **On completion**, the CSV file is saved to `/tmp/exports/`, DB is updated to `completed`, and a final WebSocket message with the `downloadUrl` is sent.
6. **On cancellation**, the client sends `{ action: "cancel" }` via WebSocket. The server sets a Redis flag (`cancel:{exportId}`) that the worker checks before each batch, enabling graceful mid-export cancellation.

### Redis Usage

| Key pattern | Type | Purpose |
|-------------|------|---------|
| `bull:csv-exports:*` | Hash/List | Bull job queue internals |
| `export:{exportId}` | Pub/Sub channel | Real-time progress broadcasting |
| `cancel:{exportId}` | String (`"1"`) | Cancellation signal flag (TTL: 1 hour) |

---

## ðŸ§ª Manual Testing

### Using curl

```bash
# 1. Start an export
EXPORT_ID=$(curl -s -X POST http://localhost:8080/api/exports | jq -r '.exportId')
echo "Export ID: $EXPORT_ID"

# 2. List all exports
curl -s http://localhost:8080/api/exports | jq

# 3. Download (after completion)
curl -O -J "http://localhost:8080/api/exports/$EXPORT_ID/download"
```

### WebSocket Testing (wscat)

```bash
npx wscat -c ws://localhost:8080/ws/exports/$EXPORT_ID

# Cancel from WebSocket REPL:
> {"action":"cancel"}
```

---

## ðŸ³ Docker Services

| Service | Image | Port | Role |
|---------|-------|------|------|
| `app` | `node:20-alpine` (custom) | `8080` | Node.js API + Worker + WebSocket |
| `db` | `postgres:16-alpine` | â€” (internal) | Persistent data store |
| `redis` | `redis:7-alpine` | â€” (internal) | Job queue + Pub/Sub |

All services include health checks. The `app` container waits for both `db` and `redis` to be healthy before starting.

---

## ðŸ“„ License

MIT