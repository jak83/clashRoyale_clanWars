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

// Initial fetch and start polling every 5 minutes
updateRaceData();
setInterval(updateRaceData, 5 * 60 * 1000);

// API Proxy Endpoint
app.get('/api/race', async (req, res) => {
    // Return cached data if available, otherwise fetch
    if (latestRaceData) {
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

// Demo Endpoint
const demoManager = require('./demoManager');
app.post('/api/demo/load', (req, res) => {
    try {
        const days = parseInt(req.body.days) || 4;
        const demoData = demoManager.generateDemoData(days);
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
