# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web application that tracks Clash Royale clan war participation by displaying which players have completed their daily decks during River Race events. The app fetches data from the Clash Royale API via a Node.js proxy server.

## Development Commands

```bash
# Install dependencies
npm install

# Run server (production mode)
npm start

# Run with auto-reload (development mode)
npm run dev
```

Server runs on http://localhost:3000 (or PORT from .env).

## Environment Setup

Copy `.env.example` to `.env` and configure:
- `CLASH_API_TOKEN` - Obtain from https://developer.clashroyale.com
- `CLAN_TAG` - Your clan tag (with or without # prefix)
- `PORT` - Server port (default: 3000)
- `HISTORY_PATH` - Optional. Directory path for storing war history snapshots (default: project root). Can be set to a Google Drive synced folder for cloud backup.

## Architecture

### Backend (`server.js`)
Express server with automatic background polling and caching:

**Background Polling System:**
- Polls Clash Royale API every 5 minutes to fetch current race status
- Stores latest data in memory cache (`latestRaceData`) for instant UI loads
- Automatically updates local history snapshots via `historyManager`

**API Endpoints:**
- `/api/race` - Returns cached current war status (instant response) or fetches if unavailable
- `/api/race/log` - Proxies to `/v1/clans/{tag}/riverracelog` (war history from API)
- `/api/race/history` - Returns locally tracked history snapshots
- `/api/demo/load` (POST) - Generates synthetic demo data for testing/previews

The server handles clan tag formatting (prepends `%23` if tag starts with `#`) and adds Bearer token authentication.

### Supporting Modules

**`historyManager.js`** - Local war history tracking:
- Stores daily snapshots of player deck usage during war days (Thu-Sun)
- Auto-archives completed wars to `history/WarData_week_X_YYYY-MM-DD_YYYY-MM-DD.json`
- Maintains ongoing war state in `ongoing/history.json`
- Detects new war weeks (via `seasonId` + `sectionIndex` changes) and archives previous week
- Configurable storage location via `HISTORY_PATH` environment variable

**`demoManager.js`** - Demo data generation:
- Creates synthetic war data with 10 fictional players
- Simulates realistic player behavior patterns (e.g., perfect players, inconsistent players)
- Useful for testing UI and previewing features without real API data

### Frontend (`public/`)
Vanilla JavaScript SPA:
- `index.html` - Layout with summary stats, player lists, and last war section
- `app.js` - Fetches race data, renders player cards sorted by deck usage
- `style.css` - Clash Royale themed styling

### Key Frontend Logic
- **War Days**: Shows players sorted by `decksUsedToday` (0-4 decks). Separates incomplete (<4) from complete (≥4) players.
- **Training Days**: Displays "Training Day" message and automatically loads last war stats showing players with partial deck usage (`decksUsed % 4 !== 0`), useful for identifying who missed specific days.
- Player list auto-sorts by least decks used first to prioritize who needs to play.

### Debug Scripts
- `debug_race_log.js`, `inspect_log.js`, `inspect_log_deep.js` - Debugging tools for API responses
- `verify_connection.js` - Tests API connectivity
These are not part of the main application flow.

## API Integration

Uses Clash Royale official API (https://api.clashroyale.com/v1). Rate limits apply. The API requires:
- Bearer token authentication
- Proper URL encoding of clan tags
- Accept header: `application/json`

Data structure: API returns `clan.participants` array with `decksUsedToday` field during war days.

## Deployment

For detailed deployment instructions, see the comprehensive guide at `G:\My Drive\clanWars\GOING_LIVE.md`.

### Quick Deployment Overview

**Critical Issue:** Clash Royale API requires whitelisting specific IP addresses - you cannot use `0.0.0.0` or wildcards. This is the main deployment challenge.

**Recommended Hosting Options:**

1. **DigitalOcean Droplet** ($6/month) - Recommended for beginners
   - Static IP (solves whitelisting issue)
   - Persistent storage (history preserved)
   - Simple setup with PM2 process manager
   - 24/7 uptime guaranteed

2. **Oracle Cloud Free Tier** ($0/month) - Best for free option
   - Truly free forever (not a trial)
   - Static IP included
   - More complex initial setup (~2 hours)

3. **Railway** ($5/month) - Easy GitHub deployment
   - GitHub auto-deploy on push
   - Persistent storage
   - Still requires IP whitelisting solution (RoyaleAPI Proxy)

**NOT Recommended:**
- **Render Free Tier** - Sleeps after 15 minutes, breaking the 5-minute polling system

### Pre-Deployment Checklist

Before deploying, verify locally:
```bash
npm install
npm start
# Visit http://localhost:3000 and verify player data loads
curl http://localhost:3000/api/race
```

### Deployment Steps (VPS Example)

```bash
# On server (DigitalOcean, Oracle Cloud, Linode, etc.)
git clone <your-repo-url>
cd clashApi
npm install
npm install -g pm2

# Create .env file
nano .env
# Add: CLASH_API_TOKEN=your_token
#      CLAN_TAG=#YOUR_TAG
#      PORT=3000

# Start with PM2
pm2 start server.js
pm2 startup  # Auto-restart on reboot
pm2 save
```

### IP Whitelisting Solutions

**Option 1: Static IP (Recommended for VPS)**
1. Deploy to VPS (DigitalOcean, Oracle Cloud, etc.)
2. Get server IP: `curl ifconfig.me`
3. Whitelist IP at https://developer.clashroyale.com
4. Add token to `.env` as `CLASH_API_TOKEN`

**Option 2: RoyaleAPI Proxy (For dynamic IP platforms)**
- Use RoyaleAPI's proxy service instead of direct API calls
- Modify `server.js` to use `https://proxy.royaleapi.dev/v1/...`
- See GOING_LIVE.md for code examples

### Common Deployment Issues

**403 Forbidden Error:**
- Cause: Server IP not whitelisted
- Fix: Run `curl ifconfig.me` on server, add IP at developer.clashroyale.com

**Polling Stopped:**
- Check server status: `pm2 list`
- View logs: `pm2 logs server`
- Restart if needed: `pm2 restart server`

**History Lost After Restart:**
- Cause: Using ephemeral storage (Render free tier)
- Fix: Use VPS with persistent storage or set up Google Drive sync via `HISTORY_PATH`

### Verification After Deployment

```bash
# Check server is running
pm2 list

# Test API endpoint (replace YOUR_URL)
curl https://YOUR_URL/api/race

# Verify polling in logs
pm2 logs server
# Should see: "[time] Polling Clash Royale API..." every 5 minutes
```

### Cost Summary

- **Free:** Oracle Cloud ($0) - requires credit card but won't charge
- **Paid:** DigitalOcean ($6/month) or Railway ($5/month)
- **Domain (optional):** $12/year (~$1/month)
- **API Token:** Free from Clash Royale

See GOING_LIVE.md for complete setup instructions, troubleshooting guide, and Google Drive sync configuration.
