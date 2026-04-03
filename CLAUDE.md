# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web application that tracks Clash Royale clan war participation by displaying which players have completed their daily decks during River Race events. The app fetches data from the Clash Royale API via a Node.js proxy server.

## Development Commands

```bash
npm install          # Install dependencies
npm start            # Run server (production)
npm run dev          # Run with auto-reload (development)
npm test             # Run all unit tests (ALWAYS run before committing)
npm run test:watch   # Run unit tests in watch mode
npm test -- tableSorting  # Run a single test file by name pattern
npm run test:e2e     # Run Robot Framework e2e tests (requires server running)
npm run test:all     # Run unit + e2e tests
```

**E2E test setup (one-time):**
```bash
python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt
```

Server runs on http://localhost:3000 (or PORT from .env).

## Architecture

### Data Flow

```
Clash Royale API
    │ (polled every 2 min by updateRaceData())
    ▼
server.js ──► historyManager.updateHistory() ──► ongoing/history.json
    │                                              history/WarData_week_*.json
    │ (in-memory cache: latestRaceData)
    ▼
Frontend (public/app.js)
    ├── GET /api/race          — cached current race status
    ├── GET /api/race/history  — daily snapshots from historyManager
    ├── POST /api/players/activity — real-time battle log status
    └── GET /api/critical-window   — boolean: within 30 min of 5 AM UTC reset
```

### Backend (`server.js`)

- **Background polling**: `updateRaceData()` runs every 2 minutes, caches result in `latestRaceData`
- **`/api/players/activity`**: Fetches each player's last 30 battles and classifies them as `active / war-recent / playing / idle / unknown` based on time since last battle
- **`/api/critical-window`**: Returns `true` if current time is within 30 minutes of the 5 AM UTC daily deck reset

### `historyManager.js` — War Week Persistence

Tracks player deck usage across war days (Thu–Sun) and persists to disk.

**War day mapping** (from `raceData.periodIndex % 7`):
- 0–2 = Training days (ignored)
- 3 = Thursday = War Day 1
- 4 = Friday = War Day 2
- 5 = Saturday = War Day 3
- 6 = Sunday = War Day 4

**New week detection**: When `seasonId` or `sectionIndex` changes, archives the previous week to `history/WarData_week_{index}_{dateRange}.json` and resets `ongoing/history.json`.

**Atomic writes**: Saves to a `.tmp` file first, then renames, to prevent corruption.

**History data shape:**
```json
{
  "seasonId": 1, "sectionIndex": 5,
  "days": {
    "1": { "timestamp": "...", "players": { "<tag>": { "name": "...", "decksUsed": 4, "decksUsedToday": 4, "fame": 1200 } } }
  }
}
```

### `demoManager.js`

Generates synthetic 10-player war data for UI testing without real API data. Called via `POST /api/demo/load`. Does not write to disk.

### Frontend (`public/app.js`)

Vanilla JS SPA (~76KB). Key patterns:
- **`createPlayerCard()`** and **`createPlayerRow()`** are the single source of truth for player UI components — always update these when changing player display
- **`PollingTimer`** class tracks the server's 2-minute poll cycle and renders a countdown
- Tab navigation switches between: Daily History (main table), War Stats, Last War
- Day filter buttons are generated dynamically from available history data
- Activity status uses `ACTIVITY_CONFIG` object with 5 states: Active (🟢), War-Recent (🔵), Playing (🟡), Idle (⚪), Unknown (❓)

## Testing

Two-tier approach: Jest unit tests + Robot Framework e2e tests.

### Unit Test Philosophy

Test **behavior/logic**, not DOM structure or implementation details. From `tests/TESTING_GUIDELINES.md`:
- ✅ Test: calculations, data transforms, sort/filter logic, state transitions, edge cases
- ❌ Avoid: HTML structure, CSS, DOM queries (`getElementById`, `querySelector`)

Prefer pure function tests over jsdom DOM tests. When writing regression tests for bugs, test the calculation/logic directly.

### Test Files (`tests/*.test.js`)

18 files covering: war day calculation, history snapshots, deck counting, filtering (hide completed, hide left players), sorting, statistics, medal tracking, activity status, countdown timer, reliability metrics, time formatting, and data integrity.

### E2E Tests (`tests/e2e/`)

Robot Framework tests verify server startup, all API endpoints, background polling, and demo mode. Results in `tests/e2e/results/report.html`.

## Environment

Copy `.env.example` to `.env`:
```
CLASH_API_TOKEN=your_api_token_here
CLAN_TAG=#YOUR_CLAN_TAG
PORT=3000
HISTORY_PATH=  # Optional: path for history files (e.g., Google Drive folder)
```

API token obtained from https://developer.clashroyale.com — requires whitelisting the server's IP address.

## Deployment

`deploy.bat` runs unit tests + e2e tests and only deploys if all pass. For hosting details and IP whitelisting solutions, see `G:\My Drive\clanWars\GOING_LIVE.md`.

**Production server** (Oracle Cloud) uses PM2: `pm2 start server.js` / `pm2 logs server`.

History backups run daily at 2 AM via cron (`./setup_backup.sh` to configure). See `backup_history.sh` for manual backup.
