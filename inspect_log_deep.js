const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env manually
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '.env');
        const envData = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envData.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                let value = parts.slice(1).join('=').trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                env[key] = value;
            }
        });
        return env;
    } catch (err) {
        return null;
    }
}

const env = loadEnv();
const CLAN_TAG = env.CLAN_TAG;
const API_TOKEN = env.CLASH_API_TOKEN;

if (!CLAN_TAG || !API_TOKEN) {
    console.error("Missing credentials.");
    process.exit(1);
}

const formattedTag = CLAN_TAG.startsWith('#') ? '%23' + CLAN_TAG.slice(1) : CLAN_TAG;
const options = {
    hostname: 'api.clashroyale.com',
    path: `/v1/clans/${formattedTag}/members`,
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Accept': 'application/json'
    }
};

console.log(`Fetching clan members for ${CLAN_TAG}...`);

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            try {
                const json = JSON.parse(data);
                if (json.items && json.items.length > 0) {
                    // Find "Spring Onion"
                    const player = json.items.find(p => p.name.includes("Spring")) || json.items[0];

                    console.log("\nFull Member Object Keys:", Object.keys(player));
                    console.log("Full Member Object:", JSON.stringify(player, null, 2));
                }
            } catch (e) {
                console.log("Error parsing JSON.");
            }
        } else {
            console.error(`Request Failed: ${res.statusCode}`);
        }
    });
});

req.on('error', (e) => console.error(e));
req.end();
