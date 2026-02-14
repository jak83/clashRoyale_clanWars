require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const historyManager = require('./historyManager');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Required for parsing JSON bodies (req.body)
app.use(express.static('public'));

// In-memory cache for fast UI loading
let latestRaceData = null;

async function updateRaceData() {
    console.log(`[${new Date().toLocaleTimeString()}] Polling Clash Royale API...`);
    const clanTag = process.env.CLAN_TAG;
    const apiToken = process.env.CLASH_API_TOKEN;

    if (!clanTag || !apiToken) {
        console.error('Polling failed: Missing credentials');
        return null;
    }

    const formattedTag = clanTag.startsWith('#') ? '%23' + clanTag.slice(1) : clanTag;
    const url = `https://api.clashroyale.com/v1/clans/${formattedTag}/currentriverrace`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Accept': 'application/json'
            }
        });

        latestRaceData = response.data;

        // Save snapshot for history
        try {
            historyManager.updateHistory(response.data);
        } catch (histError) {
            console.error("Failed to update history:", histError);
        }

        return response.data;
    } catch (error) {
        console.error('Polling error:', error.message);
        return null;
    }
}

// Initial fetch and start polling every 2 minutes
updateRaceData();
setInterval(updateRaceData, 2 * 60 * 1000);

// API Proxy Endpoint
app.get('/api/race', async (req, res) => {
    // Return cached data if available, otherwise fetch
    // Return cached data if available, unless forced
    if (latestRaceData && !req.query.force) {
        return res.json(latestRaceData);
    }

    const data = await updateRaceData();
    if (data) {
        res.json(data);
    } else {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.get('/api/race/log', async (req, res) => {
    const clanTag = process.env.CLAN_TAG;
    const apiToken = process.env.CLASH_API_TOKEN;

    if (!clanTag || !apiToken) {
        return res.status(500).json({ error: 'Missing API credentials in .env file' });
    }

    const formattedTag = clanTag.startsWith('#') ? '%23' + clanTag.slice(1) : clanTag;
    const url = `https://api.clashroyale.com/v1/clans/${formattedTag}/riverracelog`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
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

app.get('/api/race/history', (req, res) => {
    try {
        const history = historyManager.loadHistory();
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load history' });
    }
});

// Get current clan members
app.get('/api/clan/members', async (req, res) => {
    const clanTag = process.env.CLAN_TAG;
    const apiToken = process.env.CLASH_API_TOKEN;

    if (!clanTag || !apiToken) {
        return res.status(500).json({ error: 'Missing API credentials in .env file' });
    }

    const formattedTag = clanTag.startsWith('#') ? '%23' + clanTag.slice(1) : clanTag;
    const url = `https://api.clashroyale.com/v1/clans/${formattedTag}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Accept': 'application/json'
            }
        });

        // Return just the member list with tags for easy lookup
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

// Player Activity Status (for last 30 minutes only)
app.post('/api/players/activity', async (req, res) => {
    const apiToken = process.env.CLASH_API_TOKEN;
    const { playerTags } = req.body;

    if (!apiToken) {
        return res.status(500).json({ error: 'Missing API credentials' });
    }

    if (!Array.isArray(playerTags) || playerTags.length === 0) {
        return res.status(400).json({ error: 'playerTags array required' });
    }

    try {
        // Fetch battle history for each player
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

                return {
                    tag,
                    ...status
                };
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
function isInCriticalWindow() {
    const now = new Date();
    const nextReset = new Date(now);

    // Set to 5:00 AM UTC
    nextReset.setUTCHours(5, 0, 0, 0);

    // If we're past 5 AM today, move to tomorrow
    if (now.getUTCHours() >= 5) {
        nextReset.setUTCDate(nextReset.getUTCDate() + 1);
    }

    // Subtract 4 minutes to match game clock
    nextReset.setMinutes(nextReset.getMinutes() - 4);

    const minutesUntilReset = Math.floor((nextReset - now) / (1000 * 60));
    return minutesUntilReset <= 30;
}

// Endpoint to check if we're in critical window
app.get('/api/critical-window', (req, res) => {
    res.json({ inCriticalWindow: isInCriticalWindow() });
});

// Demo Endpoint
const demoManager = require('./demoManager');
app.post('/api/demo/load', (req, res) => {
    try {
        const days = parseInt(req.body.days) || 4;
        const demoData = demoManager.generateDemoData(days);

        // CRITICAL: Save demo data to history file so /api/race/history returns it
        historyManager.saveHistory(demoData);

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
