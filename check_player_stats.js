const axios = require('axios');
require('dotenv').config();

const API_TOKEN = process.env.CLASH_API_TOKEN;
const CLAN_TAG = process.env.CLAN_TAG;
const formattedTag = CLAN_TAG.startsWith('#') ? '%23' + CLAN_TAG.slice(1) : CLAN_TAG;

async function checkPlayerStats() {
    console.log('📊 Checking Per-Player Statistics\n');

    try {
        // Current race data
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
        const ourClan = race.clans?.find(c => c.tag === CLAN_TAG);

        if (ourClan && ourClan.participants) {
            console.log('Per-Player Stats Available:\n');

            // Show first 3 players as examples
            const samplePlayers = ourClan.participants.slice(0, 3);

            samplePlayers.forEach(player => {
                console.log(`Player: ${player.name}`);
                console.log(`  - Tag: ${player.tag}`);
                console.log(`  - Fame: ${player.fame || 0}`);
                console.log(`  - Repair Points: ${player.repairPoints || 0}`);
                console.log(`  - Boat Attacks: ${player.boatAttacks || 0}`);
                console.log(`  - Decks Used: ${player.decksUsed || 0}`);
                console.log(`  - Decks Used Today: ${player.decksUsedToday || 0}`);
                console.log('');
            });

            console.log(`✅ Total ${ourClan.participants.length} players with stats available!`);

            // Analyze what stats are useful
            console.log('\n📈 Available Per-Player Stats:');
            console.log('  ✓ Fame (points contributed)');
            console.log('  ✓ Repair Points');
            console.log('  ✓ Boat Attacks');
            console.log('  ✓ Decks Used (total)');
            console.log('  ✓ Decks Used Today');

            // Top performers
            const topFame = [...ourClan.participants].sort((a, b) => (b.fame || 0) - (a.fame || 0)).slice(0, 5);
            console.log('\n🏆 Top 5 by Fame:');
            topFame.forEach((p, i) => {
                console.log(`  ${i + 1}. ${p.name}: ${p.fame || 0} fame`);
            });

        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkPlayerStats();
