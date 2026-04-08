# BoazTask - Development Setup Guide

## Prerequisites
- Docker installed (OrbStack or Docker Desktop)
- Git
- Node.js (for frontend development)
- Python 3.12 (for backend development)

## Step 1: Clone the repo

```bash
git clone https://github.com/boazeng/boaztask.git
cd boaztask
```

## Step 2: Start local development database

```bash
docker run -d --name boaztask-dev-db \
  -e POSTGRES_DB=boaztask \
  -e POSTGRES_USER=boaztask \
  -e POSTGRES_PASSWORD=dev123 \
  -p 5432:5432 \
  postgres:16-alpine
```

## Step 3: Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:
```
DATABASE_URL=postgresql://boaztask:dev123@localhost:5432/boaztask
TELEGRAM_BOT_TOKEN=<leave empty for dev, bot runs on server only>
```

Run the backend:
```bash
uvicorn app.main:app --reload --port 8002
```

## Step 4: Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173 and proxies `/api` to backend on port 8002.

## Step 5: Push changes to deploy

```bash
git add .
git commit -m "your changes"
git push origin main
```

The server auto-deploys on push - no manual action needed.

## Architecture

```
Development (your laptop)        Production (Mac mini server)
┌─────────────────────┐          ┌──────────────────────────┐
│ Frontend :5173       │          │ Frontend (nginx)         │
│ Backend  :8002       │          │ Backend  (uvicorn)       │
│ PostgreSQL :5432     │          │ PostgreSQL :5432         │
│ (local dev DB)       │          │ (production DB)          │
│                      │          │ Telegram Bot             │
│ git push ───────────────────>   │ Cloudflare Tunnel        │
│                      │          │   task.newavera.co.il    │
└─────────────────────┘          └──────────────────────────┘
```
