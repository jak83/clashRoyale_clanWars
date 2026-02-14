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

        // CRITICAL FIX: Must use day-number-based lookup, not index-based
        // This matches the fix in renderHistory to prevent cumulative values being treated as daily

        const days = Object.keys(historyData.days).sort((a, b) => Number(a) - Number(b));

        days.forEach(day => {
            const dayNum = parseInt(day);
            const currentDayData = historyData.days[day];

            // Look for ACTUAL previous day number, not previous in array
            const prevDay = String(dayNum - 1);
            const prevDayData = dayNum > 1 ? historyData.days[prevDay] : null;

            Object.entries(currentDayData.players).forEach(([tag, player]) => {
                // Only validate if previous day exists (can't validate if days are missing)
                if (prevDayData && prevDayData.players[tag]) {
                    const prevDecks = prevDayData.players[tag].decksUsed;
                    const currDecks = player.decksUsed;
                    const dailyDecks = currDecks - prevDecks;

                    if (dailyDecks > 4) {
                        throw new Error(`Player ${player.name} (${tag}) used ${dailyDecks} decks on Day ${day}! (Prev: ${prevDecks}, Curr: ${currDecks})`);
                    }

                    if (dailyDecks < 0) {
                        console.warn(`Warning: Player ${player.name} (${tag}) has negative daily decks on Day ${day} (Prev: ${prevDecks}, Curr: ${currDecks})`);
                    }
                } else if (dayNum > 1 && !prevDayData) {
                    // Previous day is missing - can't validate this day
                    console.warn(`Warning: Day ${prevDay} is missing, cannot validate Day ${day} for player ${player.name}`);
                }
                // If dayNum === 1, no previous day to check against (valid)
            });
        });
    });
});
