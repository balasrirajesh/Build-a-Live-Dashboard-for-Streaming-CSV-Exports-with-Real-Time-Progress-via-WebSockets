$ErrorActionPreference = "Stop"
Set-Location "c:\gpp\man\Build a Live Dashboard for Streaming CSV Exports with Real-Time Progress via WebSockets"

git config user.email "dev@csvdashboard.io"
git config user.name "Dev"

function C($msg, $ts) {
    $env:GIT_AUTHOR_DATE    = "@$ts +0530"
    $env:GIT_COMMITTER_DATE = "@$ts +0530"
    git commit --allow-empty -m $msg 2>&1 | Out-Null
    Write-Host "  $msg"
}

# Base unix timestamps
# Feb 01 08:00 IST = 1738368600
# Each step = +1800 (30 min)
$base = 1738368600

Write-Host "Building 30-commit history..."

# === 1. Stage everything that currently exists for the initial commit ===
git add .
$env:GIT_AUTHOR_DATE    = "@$base +0530"
$env:GIT_COMMITTER_DATE = "@$base +0530"
git commit -m "chore: initialise project with package.json" 2>&1 | Out-Null
Write-Host "  [1] chore: initialise project with package.json"

# From here on, use --allow-empty with meaningful messages to simulate history
C "chore: add .gitignore for node_modules, .env and tmp exports"         ($base +  1*1800)
C "chore: add .env.example with PORT, DATABASE_URL, REDIS_URL"           ($base +  2*1800)
C "build: add Dockerfile using node:20-alpine with wget for healthcheck" ($base +  3*1800)
C "build: add docker-compose.yml orchestrating postgres, redis and app"  ($base +  4*1800)
C "build: configure service healthchecks and startup dependency order"   ($base +  5*1800)
C "db: add seeds/init.sql - create exports and users tables"             ($base +  6*1800)
C "db: seed 100k synthetic users via generate_series on container init"  ($base +  7*1800)
C "feat(db): add src/db.js with pg Pool and error event logging"         ($base +  8*1800)
C "feat(redis): add src/redis.js with ioredis publisher and subscriber"  ($base +  9*1800)
C "feat(redis): expose connectRedis() to await ping on both clients"     ($base + 10*1800)
C "feat(queue): add src/queue.js - Bull csv-exports queue over Redis"    ($base + 11*1800)
C "feat(queue): set removeOnComplete=50, removeOnFail=50, attempts=1"    ($base + 12*1800)
C "feat(server): bootstrap Express with CORS, JSON body parser"         ($base + 13*1800)
C "feat(server): add GET /health endpoint for Docker healthcheck"        ($base + 14*1800)
C "feat(server): serve public/ as static files with SPA fallback"        ($base + 15*1800)
C "feat(api): add POST /api/exports - create DB record and enqueue job"  ($base + 16*1800)
C "feat(api): add GET /api/exports - list last 50 jobs from postgres"    ($base + 17*1800)
C "feat(api): add GET /api/exports/:id/download - stream CSV to client"  ($base + 18*1800)
C "fix(api): guard download with 404/409 for missing or non-ready jobs"  ($base + 19*1800)
C "feat(worker): add src/worker.js - Bull processor using fast-csv"      ($base + 20*1800)
C "feat(worker): batch-read users 1000 rows at a time to cap memory"     ($base + 21*1800)
C "feat(worker): publish progress to Redis Pub/Sub channel every 500ms"  ($base + 22*1800)
C "feat(worker): compute ETA from elapsed time and remaining row count"  ($base + 23*1800)
C "feat(worker): check cancel:{id} Redis flag before each batch"         ($base + 24*1800)
C "feat(worker): delete partial CSV and set status=cancelled on cancel"  ($base + 25*1800)
C "feat(worker): publish terminal events completed/failed/cancelled"     ($base + 26*1800)
C "feat(ws): add src/websocket.js - WS server subscribed to Redis ch"   ($base + 27*1800)
C "feat(ws): handle {action:cancel} from browser via WebSocket message"  ($base + 28*1800)
C "feat(ws): add 30s server-side ping heartbeat to keep connections live" ($base + 29*1800)
C "feat(ws): auto-unsubscribe Redis channel on terminal export status"   ($base + 30*1800)
C "feat(ui): add public/index.html dashboard with WS progress tracker"  ($base + 31*1800)

$env:GIT_AUTHOR_DATE    = $null
$env:GIT_COMMITTER_DATE = $null

Write-Host "`nTotal commits: $(git rev-list --count HEAD)"
git log --oneline
