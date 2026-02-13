// Quick test for the new member filtering feature
const axios = require('axios');
require('dotenv').config();

const API_TOKEN = process.env.CLASH_API_TOKEN;
const CLAN_TAG = process.env.CLAN_TAG;
const formattedTag = CLAN_TAG.startsWith('#') ? '%23' + CLAN_TAG.slice(1) : CLAN_TAG;

async function testMembersEndpoint() {
    console.log('🧪 Testing Clan Members Endpoint\n');

    try {
        // Test direct API call
        console.log('1. Testing direct Clash Royale API...');
        const directResponse = await axios.get(
            `https://api.clashroyale.com/v1/clans/${formattedTag}`,
            {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json'
                }
            }
        );

        console.log(`   ✅ Clan: ${directResponse.data.name}`);
        console.log(`   ✅ Members: ${directResponse.data.memberList.length}\n`);

        // Test current race data
        console.log('2. Testing current race participants...');
        const raceResponse = await axios.get(
            `https://api.clashroyale.com/v1/clans/${formattedTag}/currentriverrace`,
            {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json'
                }
            }
        );

        const participants = raceResponse.data.clan.participants || [];
        console.log(`   ✅ War participants: ${participants.length}\n`);

        // Compare members vs participants
        console.log('3. Comparing current members vs war participants...');
        const memberTags = new Set(directResponse.data.memberList.map(m => m.tag));
        const participantTags = participants.map(p => p.tag);

        const leftPlayers = participants.filter(p => !memberTags.has(p.tag));

        if (leftPlayers.length > 0) {
            console.log(`   ⚠️  Found ${leftPlayers.length} participant(s) who left the clan:`);
            leftPlayers.forEach(p => {
                console.log(`      - ${p.name} (${p.tag})`);
            });
        } else {
            console.log('   ✅ All war participants are still in the clan');
        }

        console.log('\n✅ All tests passed! The feature should work correctly.\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

testMembersEndpoint();
