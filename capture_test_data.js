const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_TOKEN = process.env.CLASH_API_TOKEN;
const CLAN_TAG = process.env.CLAN_TAG;

if (!API_TOKEN || !CLAN_TAG) {
    console.error('❌ Missing CLASH_API_TOKEN or CLAN_TAG in .env file');
    process.exit(1);
}

const formattedTag = CLAN_TAG.startsWith('#') ? '%23' + CLAN_TAG.slice(1) : CLAN_TAG;

async function captureTestData() {
    console.log('📊 Capturing test data from current war...\n');

    try {
        // Create fixtures directory if it doesn't exist
        const fixturesDir = path.join(__dirname, 'tests', 'fixtures');
        if (!fs.existsSync(fixturesDir)) {
            fs.mkdirSync(fixturesDir, { recursive: true });
        }

        // Fetch current race data
        console.log('Fetching current river race...');
        const raceResponse = await axios.get(
            `https://api.clashroyale.com/v1/clans/${formattedTag}/currentriverrace`,
            {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json'
                }
            }
        );

        // Fetch current clan members
        console.log('Fetching clan members...');
        const membersResponse = await axios.get(
            `https://api.clashroyale.com/v1/clans/${formattedTag}`,
            {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json'
                }
            }
        );

        // Fetch river race log (war history)
        console.log('Fetching river race log...');
        const logResponse = await axios.get(
            `https://api.clashroyale.com/v1/clans/${formattedTag}/riverracelog`,
            {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json'
                }
            }
        );

        // Save captured data
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const testData = {
            capturedAt: new Date().toISOString(),
            clanTag: CLAN_TAG,
            currentRace: raceResponse.data,
            clanMembers: membersResponse.data,
            raceLog: logResponse.data
        };

        const filename = `war_data_${timestamp}.json`;
        const filepath = path.join(fixturesDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(testData, null, 2));

        console.log(`\n✅ Test data saved to: ${filepath}`);
        console.log(`\n📈 Captured data summary:`);
        console.log(`  - Clan: ${testData.clanMembers.name}`);
        console.log(`  - Members: ${testData.clanMembers.members}`);
        console.log(`  - War State: ${testData.currentRace.periodType}`);
        console.log(`  - Participants: ${testData.currentRace.clan?.participants?.length || 0}`);
        console.log(`  - War Logs: ${testData.raceLog.items?.length || 0}`);

        // Also save a "latest" version for easy reference in tests
        const latestPath = path.join(fixturesDir, 'war_data_latest.json');
        fs.writeFileSync(latestPath, JSON.stringify(testData, null, 2));
        console.log(`  - Also saved as: war_data_latest.json`);

        console.log('\n💡 You can now use this data in tests like:');
        console.log('   const testData = require("./fixtures/war_data_latest.json");');

    } catch (error) {
        console.error('❌ Error capturing test data:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Message: ${error.response.data?.message || error.message}`);
        } else {
            console.error(`   ${error.message}`);
        }
        process.exit(1);
    }
}

captureTestData();
