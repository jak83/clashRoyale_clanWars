const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env manually since we might not have 'dotenv' installed yet
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
                // Remove surrounding quotes if present
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

if (!env) {
    console.error("❌ Could not read .env file. Please make sure it exists.");
    process.exit(1);
}

const CLAN_TAG = env.CLAN_TAG;
const API_TOKEN = env.CLASH_API_TOKEN;

if (!CLAN_TAG || !API_TOKEN || API_TOKEN === 'your_api_token_here') {
    console.error("❌ Please fill in your CLAN_TAG and CLASH_API_TOKEN in the .env file.");
    process.exit(1);
}

console.log(`Testing connection for Clan: ${CLAN_TAG}...`);

const formattedTag = CLAN_TAG.startsWith('#') ? '%23' + CLAN_TAG.slice(1) : CLAN_TAG;
const options = {
    hostname: 'api.clashroyale.com',
    path: `/v1/clans/${formattedTag}/currentriverrace`,
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Accept': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log("\n✅ SUCCESS! Connection established.");
            try {
                const json = JSON.parse(data);
                console.log(`Clan Name: ${json.clan.name}`);
                console.log(`State: ${json.state}`);
            } catch (e) {
                console.log("Could not parse JSON response.");
            }
        } else {
            console.error(`\n❌ Request Failed. Status Code: ${res.statusCode}`);
            if (res.statusCode === 403) {
                console.error("Reason: Access Denied. Check your API Token and ensure your IP address is allowed in the Clash Royale Developer Portal.");
            } else if (res.statusCode === 404) {
                console.error("Reason: Not Found. Check your Clan Tag.");
            } else {
                console.error("Response:", data);
            }
        }
    });
});

req.on('error', (e) => {
    console.error(`\n❌ Error: ${e.message}`);
});

req.end();
