const historyManager = require('./historyManager');

function generateDemoData(targetDay = 4) {
    console.log(`Generating Demo Data for Day 1 to ${targetDay}... (Type: ${typeof targetDay})`);

    const players = [
        { tag: '#DEMO01', name: 'King Arthur' },
        { tag: '#DEMO02', name: 'Lancelot' },
        { tag: '#DEMO03', name: 'Galahad' },
        { tag: '#DEMO04', name: 'Merlin' },
        { tag: '#DEMO05', name: 'Morgana' },
        { tag: '#DEMO06', name: 'Percival' },
        { tag: '#DEMO07', name: 'Gawain' },
        { tag: '#DEMO08', name: 'Tristan' },
        { tag: '#DEMO09', name: 'Isolde' },
        { tag: '#DEMO10', name: 'Mordred' }
    ];

    let history = {
        seasonId: 99999,
        sectionIndex: 0,
        days: {}
    };

    // Track state for each player to accumulate decks properly
    const playerStates = players.map(p => ({
        ...p,
        cumulativeDecks: 0
    }));

    // Simulate up to targetDay
    for (let day = 1; day <= targetDay; day++) {
        const dayPlayers = {};

        playerStates.forEach(p => {
            // Determine decks driven by player persona
            let decksToday = 0;

            if (p.name === 'King Arthur') decksToday = 4; // Perfect war player
            else if (p.name === 'Mordred') decksToday = (day % 2 !== 0) ? 4 : 0; // Alternates: 4, 0, 4, 0
            else if (p.name === 'Lancelot') {
                // Lancelot is consistent but not perfect, say 3/4
                decksToday = 3;
            }
            else if (p.name === 'Merlin') decksToday = 4; // also perfect
            else if (p.name === 'Galahad') decksToday = 4;
            else {
                // Random 0-4
                decksToday = Math.floor(Math.random() * 5);
            }

            p.cumulativeDecks += decksToday;

            // Safety cap (can't have more than total possible accumulated)
            const maxPossible = day * 4;
            if (p.cumulativeDecks > maxPossible) p.cumulativeDecks = maxPossible;

            dayPlayers[p.tag] = {
                name: p.name,
                decksUsed: p.cumulativeDecks,
                fame: p.cumulativeDecks * 100 // Approximation
            };
        });

        const mockRaceData = {
            seasonId: 99999,
            sectionIndex: 0,
            periodIndex: 2 + day,
            periodType: 'warDay',
            clan: {
                tag: '#DEMO_CLAN',
                name: 'Round Table',
                participants: Object.values(dayPlayers).map(dp => ({
                    tag: Object.keys(dayPlayers).find(key => dayPlayers[key] === dp),
                    name: dp.name,
                    decksUsed: dp.decksUsed,
                    fame: dp.fame
                }))
            }
        };

        // Inject this data into history, DO NOT SAVE to disk
        history = historyManager.updateHistory(mockRaceData, history, false);
    }

    return history;
}

module.exports = { generateDemoData };
