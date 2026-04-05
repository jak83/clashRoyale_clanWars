require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const historyManager = require('./historyManager');
const clanConfig = require('./clanConfig');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Required for parsing JSON bodies (req.body)
app.use(express.static('public'));

// --- Per-clan in-memory state ---
// Each entry: { latestRaceData, lastKnownPeriodIndex, lastResetTimestamp, resetTimeFile }
const clanCache = new Map();

function getResetTimeFile(clan) {
    const base = process.env.HISTORY_PATH || __dirname;
    const clanDir = (!clan.id || clan.id === 'default')
        ? base
        : path.join(base, 'clans', clan.id);
    return path.join(clanDir, 'ongoing', 'reset_time.json');
}

function initClanState(clan) {
    const resetTimeFile = getResetTimeFile(clan);
    let lastResetTimestamp = null;
    let lastKnownPeriodIndex = null;

    try {
        if (fs.existsSync(resetTimeFile)) {
            const saved = JSON.parse(fs.readFileSync(resetTimeFile, 'utf8'));
            lastResetTimestamp = saved.lastResetTimestamp || null;
            lastKnownPeriodIndex = saved.lastKnownPeriodIndex || null;
        }
    } catch (e) { /* start fresh */ }

    clanCache.set(clan.id, {
        latestRaceData: null,
        lastKnownPeriodIndex,
        lastResetTimestamp,
        resetTimeFile
    });
}

function getNextResetTimestamp(clanId) {
    const state = clanCache.get(clanId);
    if (!state || !state.lastResetTimestamp) return null;
    const oneDayMs = 24 * 60 * 60 * 1000;
    let next = state.lastResetTimestamp;
    const now = Date.now();
    while (next <= now) next += oneDayMs;
    return next;
}

async function updateRaceData(clan) {
    console.log(`[${new Date().toLocaleTimeString()}] Polling API for clan '${clan.id}' (${clan.tag})...`);

    if (!clan.tag || !clan.apiToken) {
        console.error(`Polling failed for clan '${clan.id}': Missing credentials`);
        return null;
    }

    const formattedTag = clan.tag.startsWith('#') ? '%23' + clan.tag.slice(1) : clan.tag;
    const url = `https://api.clashroyale.com/v1/clans/${formattedTag}/currentriverrace`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${clan.apiToken}`,
                'Accept': 'application/json'
            }
        });

        const state = clanCache.get(clan.id);

        // Detect daily reset: periodIndex increments by 1 each day at reset time
        const newPeriodIndex = response.data.periodIndex;
        if (state.lastKnownPeriodIndex !== null && newPeriodIndex > state.lastKnownPeriodIndex) {
            state.lastResetTimestamp = Date.now();
            console.log(`[Reset detected for '${clan.id}'] periodIndex ${state.lastKnownPeriodIndex} → ${newPeriodIndex} at ${new Date().toISOString()}`);
        }
        if (newPeriodIndex !== state.lastKnownPeriodIndex) {
            state.lastKnownPeriodIndex = newPeriodIndex;
            try {
                fs.mkdirSync(path.dirname(state.resetTimeFile), { recursive: true });
                fs.writeFileSync(state.resetTimeFile, JSON.stringify({
                    lastResetTimestamp: state.lastResetTimestamp,
                    lastKnownPeriodIndex: state.lastKnownPeriodIndex
                }));
            } catch (e) { console.error(`Failed to save reset time for '${clan.id}':`, e.message); }
        }

        state.latestRaceData = response.data;

        // Save snapshot for history
        try {
            historyManager.updateHistory(response.data, null, true, clan.id);
        } catch (histError) {
            console.error(`Failed to update history for clan '${clan.id}':`, histError);
        }

        return response.data;
    } catch (error) {
        console.error(`Polling error for clan '${clan.id}':`, error.message);
        return null;
    }
}

// Helper: resolve clan from request, defaulting to first configured clan
function resolveClan(req) {
    const id = req.query.clanId || clanConfig.getDefaultClan()?.id;
    if (!id) return null;
    return clanConfig.getClanById(id);
}

// Initialize state and start polling for all clans
clanConfig.getAllClans().forEach(clan => {
    initClanState(clan);
    updateRaceData(clan);
});
// Use live clan list so newly added clans are polled automatically
setInterval(() => {
    clanConfig.getAllClans().forEach(clan => updateRaceData(clan));
}, 2 * 60 * 1000);

// --- API Endpoints ---

// List all configured clans (never exposes apiToken)
// Returns live clan name from API cache when available, falling back to config name/tag
app.get('/api/clans', (req, res) => {
    const clans = clanConfig.getAllClans().map(({ id, name, tag, protected: p }) => {
        const state = clanCache.get(id);
        const liveName = state?.latestRaceData?.clan?.name;
        return { id, name: liveName || name || tag, tag, protected: p || false };
    });
    res.json(clans);
});

// Add a new clan by tag — verifies it exists via the Clash Royale API first
app.post('/api/clans', async (req, res) => {
    const { tag } = req.body;
    if (!tag || typeof tag !== 'string') {
        return res.status(400).json({ error: 'tag is required' });
    }

    const apiToken = process.env.CLASH_API_TOKEN;
    if (!apiToken) {
        return res.status(500).json({ error: 'API token not configured in .env' });
    }

    const MAX_CLANS = 10;
    if (clanConfig.getAllClans().length >= MAX_CLANS) {
        return res.status(400).json({ error: `Maximum of ${MAX_CLANS} clans allowed` });
    }

    const normalizedTag = tag.startsWith('#') ? tag.toUpperCase() : '#' + tag.toUpperCase();
    const formattedTag = '%23' + normalizedTag.slice(1);

    try {
        // Fetch clan info to verify it exists and get its official name
        const response = await axios.get(`https://api.clashroyale.com/v1/clans/${formattedTag}`, {
            headers: { 'Authorization': `Bearer ${apiToken}`, 'Accept': 'application/json' }
        });

        const clanInfo = response.data;
        const id = clanConfig.tagToId(clanInfo.tag);

        const newClan = clanConfig.addClan({ id, tag: clanInfo.tag, name: clanInfo.name });
        initClanState(newClan);
        updateRaceData(newClan); // Kick off first poll immediately

        res.status(201).json({ id: newClan.id, name: clanInfo.name, tag: newClan.tag });
    } catch (error) {
        if (error.response?.status === 404) {
            return res.status(404).json({ error: 'Clan not found. Check the tag and try again.' });
        }
        if (error.message.includes('already')) {
            return res.status(409).json({ error: error.message });
        }
        console.error('Error adding clan:', error.message);
        res.status(500).json({ error: 'Failed to verify clan with Clash Royale API' });
    }
});

// Remove a clan by id
app.delete('/api/clans/:id', (req, res) => {
    const { id } = req.params;

    if (clanConfig.getAllClans().length <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last clan' });
    }

    const clan = clanConfig.getClanById(id);
    if (clan?.protected) {
        return res.status(403).json({ error: `'${clan.name || clan.tag}' is a protected clan and cannot be removed` });
    }

    try {
        clanConfig.removeClan(id);
        clanCache.delete(id);
        res.json({ message: `Clan '${id}' removed` });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// Current race status
app.get('/api/race', async (req, res) => {
    const clan = resolveClan(req);
    if (!clan) return res.status(400).json({ error: 'Unknown clan' });

    const state = clanCache.get(clan.id);
    if (state.latestRaceData && !req.query.force) {
        return res.json(state.latestRaceData);
    }

    const data = await updateRaceData(clan);
    if (data) {
        res.json(data);
    } else {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// River race log (last war)
app.get('/api/race/log', async (req, res) => {
    const clan = resolveClan(req);
    if (!clan) return res.status(400).json({ error: 'Unknown clan' });

    const formattedTag = clan.tag.startsWith('#') ? '%23' + clan.tag.slice(1) : clan.tag;
    const url = `https://api.clashroyale.com/v1/clans/${formattedTag}/riverracelog`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${clan.apiToken}`,
                'Accept': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching race log:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: 'Failed to fetch race log' });
        }
    }
});

// War history (local snapshots)
app.get('/api/race/history', (req, res) => {
    const clan = resolveClan(req);
    if (!clan) return res.status(400).json({ error: 'Unknown clan' });

    try {
        const history = historyManager.loadHistory(clan.id);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load history' });
    }
});

// Clan member list
app.get('/api/clan/members', async (req, res) => {
    const clan = resolveClan(req);
    if (!clan) return res.status(400).json({ error: 'Unknown clan' });

    const formattedTag = clan.tag.startsWith('#') ? '%23' + clan.tag.slice(1) : clan.tag;
    const url = `https://api.clashroyale.com/v1/clans/${formattedTag}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${clan.apiToken}`,
                'Accept': 'application/json'
            }
        });

        const memberTags = new Set(response.data.memberList.map(m => m.tag));
        res.json({
            memberList: response.data.memberList,
            memberTags: Array.from(memberTags)
        });
    } catch (error) {
        console.error('Error fetching clan members:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: 'Failed to fetch clan members' });
        }
    }
});

// Player Activity Status
app.post('/api/players/activity', async (req, res) => {
    const { playerTags, clanId } = req.body;

    // Resolve clan from body or fall back to default
    const id = clanId || clanConfig.getDefaultClan()?.id;
    const clan = id ? clanConfig.getClanById(id) : null;
    const apiToken = clan ? clan.apiToken : null;

    if (!apiToken) {
        return res.status(500).json({ error: 'Missing API credentials' });
    }

    if (!Array.isArray(playerTags) || playerTags.length === 0) {
        return res.status(400).json({ error: 'playerTags array required' });
    }

    try {
        const activityPromises = playerTags.map(async (tag) => {
            const formattedTag = tag.startsWith('#') ? '%23' + tag.slice(1) : tag;
            const url = `https://api.clashroyale.com/v1/players/${formattedTag}/battlelog`;

            try {
                const response = await axios.get(url, {
                    headers: {
                        'Authorization': `Bearer ${apiToken}`,
                        'Accept': 'application/json'
                    }
                });

                const battles = response.data;
                const status = determinePlayerStatus(battles);

                return { tag, ...status };
            } catch (error) {
                console.error(`Error fetching battles for ${tag}:`, error.message);
                return {
                    tag,
                    status: 'unknown',
                    lastBattleMinutesAgo: null,
                    lastBattleType: null
                };
            }
        });

        const results = await Promise.all(activityPromises);
        res.json({ players: results });

    } catch (error) {
        console.error('Error fetching player activity:', error.message);
        res.status(500).json({ error: 'Failed to fetch player activity' });
    }
});

/**
 * Determine player activity status from battle history
 */
function determinePlayerStatus(battles) {
    if (!battles || battles.length === 0) {
        return {
            status: 'idle',
            lastBattleMinutesAgo: null,
            lastBattleType: null
        };
    }

    const latestBattle = battles[0];
    const battleTime = parseBattleTime(latestBattle.battleTime);
    const minutesAgo = Math.floor((Date.now() - battleTime) / (1000 * 60));
    const isWarBattle = latestBattle.type === 'riverRacePvP' ||
                       latestBattle.type === 'riverRaceDuel' ||
                       latestBattle.type === 'boatBattle';

    let status;
    if (minutesAgo < 2) {
        status = 'active'; // 🟢 Green - Just played
    } else if (minutesAgo < 5 && isWarBattle) {
        status = 'war-recent'; // 🔵 Blue - Recent war battle
    } else if (minutesAgo < 10) {
        status = 'playing'; // 🟡 Yellow - Recently active
    } else {
        status = 'idle'; // ⚪ Gray - Idle
    }

    return {
        status,
        lastBattleMinutesAgo: minutesAgo,
        lastBattleType: latestBattle.type,
        isWarBattle
    };
}

/**
 * Parse Clash Royale battle time format: "20260214T194919.000Z"
 */
function parseBattleTime(battleTimeStr) {
    const year = battleTimeStr.substring(0, 4);
    const month = battleTimeStr.substring(4, 6);
    const day = battleTimeStr.substring(6, 8);
    const hour = battleTimeStr.substring(9, 11);
    const minute = battleTimeStr.substring(11, 13);
    const second = battleTimeStr.substring(13, 15);

    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
}

/**
 * Check if we're in the last 30 minutes before reset
 */
function isInCriticalWindow(clanId) {
    const now = new Date();
    const nextReset = getNextResetTimestamp(clanId);

    let target;
    if (nextReset) {
        target = new Date(nextReset);
    } else {
        // Fallback until first reset is observed
        target = new Date(now);
        target.setUTCHours(9, 46, 0, 0);
        if (now >= target) target.setUTCDate(target.getUTCDate() + 1);
    }

    const minutesUntilReset = Math.floor((target - now) / (1000 * 60));
    return minutesUntilReset <= 30;
}

// Endpoint to check if we're in critical window
app.get('/api/critical-window', (req, res) => {
    const clan = resolveClan(req);
    if (!clan) return res.status(400).json({ error: 'Unknown clan' });
    res.json({ inCriticalWindow: isInCriticalWindow(clan.id) });
});

// Expose next reset timestamp so the frontend can show an accurate countdown
app.get('/api/reset-time', (req, res) => {
    const clan = resolveClan(req);
    if (!clan) return res.status(400).json({ error: 'Unknown clan' });
    res.json({ nextResetTimestamp: getNextResetTimestamp(clan.id) });
});

// Demo Endpoint
const demoManager = require('./demoManager');
app.post('/api/demo/load', (req, res) => {
    const clan = resolveClan(req);
    const clanId = clan ? clan.id : 'default';

    try {
        const days = parseInt(req.body.days) || 4;
        const demoData = demoManager.generateDemoData(days);

        // CRITICAL: Save demo data to history file so /api/race/history returns it
        historyManager.saveHistory(demoData, clanId);

        res.json({ message: 'Demo data loaded', history: demoData });
    } catch (error) {
        console.error("Demo load failed:", error);
        res.status(500).json({ error: 'Failed to load demo data' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
