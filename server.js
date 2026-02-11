require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static('public'));

// API Proxy Endpoint
app.get('/api/race', async (req, res) => {
    const clanTag = process.env.CLAN_TAG;
    const apiToken = process.env.CLASH_API_TOKEN;

    if (!clanTag || !apiToken) {
        return res.status(500).json({ error: 'Missing API credentials in .env file' });
    }

    // Encode clan tag for URL if it contains #
    const formattedTag = clanTag.startsWith('#') ? '%23' + clanTag.slice(1) : clanTag;
    const url = `https://api.clashroyale.com/v1/clans/${formattedTag}/currentriverrace`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Accept': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: 'Failed to fetch data from Clash Royale API' });
        }
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

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
