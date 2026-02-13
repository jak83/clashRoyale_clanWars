const axios = require('axios');
require('dotenv').config();

const API_TOKEN = process.env.CLASH_API_TOKEN;
const CLAN_TAG = process.env.CLAN_TAG;
const formattedTag = CLAN_TAG.startsWith('#') ? '%23' + CLAN_TAG.slice(1) : CLAN_TAG;

async function checkWarStats() {
    console.log('📊 Checking Available War Statistics\n');

    try {
        // Current race data
        console.log('1. Current River Race Data:');
        const raceResponse = await axios.get(
            `https://api.clashroyale.com/v1/clans/${formattedTag}/currentriverrace`,
            {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json'
                }
            }
        );

        const race = raceResponse.data;
        console.log('   - Season ID:', race.seasonId);
        console.log('   - Section Index:', race.sectionIndex);
        console.log('   - Period Type:', race.periodType);
        console.log('   - Period Index:', race.periodIndex);

        // Find our clan in standings
        const standings = race.clans || [];
        console.log('   - Number of clans racing:', standings.length);

        const ourClan = standings.find(c => c.tag === CLAN_TAG);
        if (ourClan) {
            console.log('\n   📈 Our Clan Current Stats:');
            console.log('   - Fame (Points):', ourClan.fame);
            console.log('   - Repair Points:', ourClan.repairPoints || 0);
            console.log('   - Trophy Change:', ourClan.trophyChange || 'TBD');
            console.log('   - Total Decks Used:', ourClan.totalDecksUsed || 'N/A');
            console.log('   - Participants:', ourClan.participants?.length || 0);

            // Show all clans for ranking
            console.log('\n   🏆 Current Standings:');
            standings.sort((a, b) => b.fame - a.fame).forEach((clan, index) => {
                const isUs = clan.tag === CLAN_TAG;
                const marker = isUs ? '👉' : '  ';
                console.log(`   ${marker} ${index + 1}. ${clan.name}: ${clan.fame} fame`);
            });
        }

        console.log('\n\n2. River Race Log (Past Wars):');
        const logResponse = await axios.get(
            `https://api.clashroyale.com/v1/clans/${formattedTag}/riverracelog`,
            {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json'
                }
            }
        );

        const lastWar = logResponse.data.items[0];
        if (lastWar) {
            console.log('   📜 Last Completed War:');
            console.log('   - Season ID:', lastWar.seasonId);
            console.log('   - Section Index:', lastWar.sectionIndex);
            console.log('   - Created Date:', lastWar.createdDate);

            const lastWarClan = lastWar.standings.find(s => s.clan.tag === CLAN_TAG);
            if (lastWarClan) {
                console.log('\n   🏁 Final Results:');
                console.log('   - Final Rank:', lastWarClan.rank);
                console.log('   - Final Fame:', lastWarClan.clan.fame);
                console.log('   - Trophy Change:', lastWarClan.trophyChange);
                console.log('   - Total Decks Used:', lastWarClan.clan.totalDecksUsed);
                console.log('   - Participants:', lastWarClan.clan.participants?.length);

                const result = lastWarClan.rank === 1 ? 'WON' : 'LOST';
                console.log(`   - Result: ${result} (Rank ${lastWarClan.rank})`);
            }

            // Show final standings
            console.log('\n   🏆 Final Standings:');
            lastWar.standings.forEach((standing, index) => {
                const isUs = standing.clan.tag === CLAN_TAG;
                const marker = isUs ? '👉' : '  ';
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
                console.log(`   ${marker}${medal} ${standing.rank}. ${standing.clan.name}: ${standing.clan.fame} fame (${standing.trophyChange > 0 ? '+' : ''}${standing.trophyChange} trophies)`);
            });
        }

        console.log('\n\n✅ All stats available for display!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
        }
    }
}

checkWarStats();
