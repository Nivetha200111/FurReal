# FurReal - Instagram AI Animal Video Detector

This is a full-stack project scaffold for FurReal, an Instagram-focused app that detects AI-generated animal videos.

## Tech Stack
- Client: React + TypeScript + Vite + Tailwind
- Server: Node.js + Express + TypeScript
- DB: PostgreSQL
- Queue: Redis + BullMQ

## Quick Start (Docker)
1. Create a `.env` for the server (see below).
2. Start services:
   ```bash
   docker compose up --build
   ```
3. Open client: http://localhost:5173
4. API: http://localhost:3001/health

## Server Environment (.env)
```
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@db:5432/furreal
REDIS_URL=redis://redis:6379
REPLICATE_API_TOKEN=
HUGGINGFACE_API_KEY=
RAPIDAPI_KEY=
MAX_VIDEO_DURATION=180
FRAME_EXTRACTION_FPS=3
CACHE_DIR=./cache
INSTAGRAM_SESSION_ID=
PROXY_URL=
MAX_CONCURRENT_ANALYSES=5
PUPPETEER_HEADLESS=true
USER_AGENT_ROTATION=true
```

If running the server locally (without Docker), set `DATABASE_URL` to your local Postgres.

## Scripts
- Server dev: from `server/` run `npm install` then `npm run dev`
- Client dev: from `client/` run `npm install` then `npm run dev`

## Current Status
- Minimal API endpoints implemented and job queued via BullMQ
- DB schema auto-initialized on server start
- Client includes an input to analyze Instagram URLs

## Next Steps (Phases)
- Phase 1: Implement Instagram scraping/downloading (Playwright/Puppeteer + instagram-url-direct) and video storage
- Phase 2: Detection pipeline (MediaPipe, Transformers.js/Replicate, TF.js), frame extraction via ffmpeg
- Phase 3: Reels-optimized UI and player, results visualization
- Phase 4+: Profile analysis, stories, creator tracking, sharing, and more