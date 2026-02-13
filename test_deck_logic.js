// Test new deck counting logic
const axios = require('axios');
require('dotenv').config();

const API_TOKEN = process.env.CLASH_API_TOKEN;
const CLAN_TAG = process.env.CLAN_TAG;
const formattedTag = CLAN_TAG.startsWith('#') ? '%23' + CLAN_TAG.slice(1) : CLAN_TAG;

async function testDeckLogic() {
    console.log('🧪 Testing New Deck Display Logic\n');

    try {
        // Get current members
        const membersResponse = await axios.get(
            `https://api.clashroyale.com/v1/clans/${formattedTag}`,
            {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json'
                }
            }
        );

        // Get war participants
        const raceResponse = await axios.get(
            `https://api.clashroyale.com/v1/clans/${formattedTag}/currentriverrace`,
            {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json'
                }
            }
        );

        const memberTags = new Set(membersResponse.data.memberList.map(m => m.tag));
        const participants = raceResponse.data.clan.participants || [];

        console.log(`📊 Analysis:\n`);
        console.log(`Current members: ${memberTags.size}`);
        console.log(`War participants: ${participants.length}\n`);

        // Categorize players
        const currentMembersActive = participants.filter(p => memberTags.has(p.tag));
        const leftWithDecks = participants.filter(p => !memberTags.has(p.tag) && p.decksUsed > 0);
        const leftWithoutDecks = participants.filter(p => !memberTags.has(p.tag) && p.decksUsed === 0);

        console.log(`✅ Current members (active): ${currentMembersActive.length}`);
        console.log(`   Will be shown by default\n`);

        console.log(`🔶 Left players WITH decks: ${leftWithDecks.length}`);
        if (leftWithDecks.length > 0) {
            console.log(`   Will be shown (contributed to war):`);
            leftWithDecks.forEach(p => {
                console.log(`   - ${p.name}: ${p.decksUsed} decks`);
            });
        }
        console.log();

        console.log(`⚪ Left players WITHOUT decks: ${leftWithoutDecks.length}`);
        if (leftWithoutDecks.length > 0) {
            console.log(`   Will be HIDDEN by default (no contribution):`);
            leftWithoutDecks.forEach(p => {
                console.log(`   - ${p.name}: 0 decks`);
            });
        }
        console.log();

        // Calculate total decks
        const totalDecks = participants.reduce((sum, p) => sum + (p.decksUsedToday || 0), 0);
        const maxDecks = 50 * 4; // Theoretical max per day
        const percentage = ((totalDecks / maxDecks) * 100).toFixed(1);

        console.log(`📈 Deck Counter (current day):`);
        console.log(`   ${totalDecks} / ${maxDecks} decks played (${percentage}%)\n`);

        console.log(`✅ New logic will show: ${currentMembersActive.length + leftWithDecks.length} players by default`);
        console.log(`   (${currentMembersActive.length} current + ${leftWithDecks.length} left with decks)`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testDeckLogic();
