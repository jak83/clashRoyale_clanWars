// Quick debug script to check current race data
require('dotenv').config();

async function debugRaceData() {
    try {
        const clanTag = process.env.CLAN_TAG.replace('#', '%23');
        const token = process.env.CLASH_API_TOKEN;

        console.log('Fetching race data for clan:', process.env.CLAN_TAG);
        console.log('API URL:', `https://api.clashroyale.com/v1/clans/${clanTag}/currentriverrace`);

        const response = await fetch(`https://api.clashroyale.com/v1/clans/${clanTag}/currentriverrace`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('API Error:', response.status, response.statusText);
            const text = await response.text();
            console.error('Response:', text);
            return;
        }

        const data = await response.json();

        console.log('\n=== CURRENT RACE DATA ===');
        console.log('State:', data.state);
        console.log('Period Type:', data.periodType);
        console.log('Period Index:', data.periodIndex);
        console.log('Season ID:', data.seasonId);
        console.log('Section Index:', data.sectionIndex);

        if (data.clan) {
            console.log('\n=== CLAN DATA ===');
            console.log('Clan:', data.clan.name, data.clan.tag);
            console.log('Fame:', data.clan.fame);
            console.log('Period Points:', data.clan.periodPoints);
            console.log('Participants:', data.clan.participants?.length || 0);
        }

        if (data.clans && data.clans.length > 0) {
            console.log('\n=== STANDINGS ===');
            data.clans.forEach((clan, index) => {
                console.log(`${index + 1}. ${clan.name} - ${clan.periodPoints} points`);
            });
        }

        console.log('\n=== WAR DAY CALCULATION ===');
        const dayOfWeekIndex = data.periodIndex % 7;
        const warDay = dayOfWeekIndex - 2;
        console.log('periodIndex % 7 =', dayOfWeekIndex);
        console.log('War Day =', warDay > 0 ? warDay : 'Training Day');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugRaceData();
