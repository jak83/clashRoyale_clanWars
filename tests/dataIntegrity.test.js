const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, '../ongoing/history.json');

describe('Data Integrity Checks', () => {
    let historyData;

    beforeAll(() => {
        if (fs.existsSync(HISTORY_FILE)) {
            const rawData = fs.readFileSync(HISTORY_FILE, 'utf8');
            historyData = JSON.parse(rawData);
        }
    });

    test('History file should exist', () => {
        expect(historyData).toBeDefined();
    });

    test('Players should not have > 4 decks used in a single day', () => {
        if (!historyData || !historyData.days) return;

        Object.entries(historyData.days).forEach(([day, data]) => {
            Object.values(data.players).forEach(player => {
                // Determine daily decks. 
                // Logic depends on how 'decksUsed' is stored (cumulative vs daily).
                // If stored as cumulative, we need prev day.
                // But 'decksUsedToday' field, if present and reliable, should generally be <= 4.
                // However, the bug was that 'decksUsed' (cumulative) jumped by > 4.

                // Let's check inferred daily decks
                // This requires iterating days in order.
            });
        });

        // Simpler check: If any day has a known 'decksUsedToday' (if we trust it) > 4?
        // Actually the bug was in cumulative calc.

        // Let's check consistency:
        // For each player, Decks(Day N) - Decks(Day N-1) <= 4

        const days = Object.keys(historyData.days).sort((a, b) => Number(a) - Number(b));
        const playerDecks = {}; // Map of tag -> cumulative decks

        days.forEach(dayIndex => {
            const dayData = historyData.days[dayIndex];
            Object.entries(dayData.players).forEach(([tag, player]) => {
                const prevDecks = playerDecks[tag] || 0;
                const dailyDecks = player.decksUsed - prevDecks;

                if (dailyDecks > 4) {
                    throw new Error(`Player ${player.name} (${tag}) used ${dailyDecks} decks on Day ${dayIndex}! (Prev: ${prevDecks}, Curr: ${player.decksUsed})`);
                }

                // Also cannot be negative
                if (dailyDecks < 0) {
                    // This might happen if player left? Or data reset?
                    // Verify logic.
                }

                playerDecks[tag] = player.decksUsed;
            });
        });
    });
});
