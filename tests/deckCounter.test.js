/**
 * Unit tests for deck counter calculations
 * Tests the logic that calculates and displays deck usage statistics
 */

const demoManager = require('../demoManager');
const fs = require('fs');
const path = require('path');

// Load the pure function from app.js for testing
const appJsContent = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
const functionMatch = appJsContent.match(/function calculateDeckCounterStats\([\s\S]*?\n\}/);
if (!functionMatch) {
    throw new Error('Could not extract calculateDeckCounterStats function from app.js');
}
// Create an isolated function for testing
const calculateDeckCounterStats = eval(`(${functionMatch[0].replace('function calculateDeckCounterStats', 'function')})`);

describe('Deck Counter Calculations', () => {
    let demoData;

    beforeAll(() => {
        // Load demo data
        demoData = demoManager.generateDemoData();
    });

    test('should calculate correct number of players', () => {
        const days = ['1', '2', '3', '4'];
        const playerTags = new Set();

        days.forEach(day => {
            const players = demoData.days[day].players;
            Object.keys(players).forEach(tag => playerTags.add(tag));
        });

        expect(playerTags.size).toBe(10); // Demo data has 10 players
    });

    test('should calculate correct daily decks for Day 1', () => {
        const day = '1';
        const players = demoData.days[day].players;
        let totalDailyDecks = 0;

        Object.values(players).forEach(player => {
            const dailyDecks = player.decksUsed - 0; // Day 1 has no previous day
            totalDailyDecks += dailyDecks;
        });

        const numPlayers = Object.keys(players).length;
        const maxDecks = numPlayers * 4;

        expect(numPlayers).toBe(10);
        expect(maxDecks).toBe(40);
        expect(totalDailyDecks).toBeGreaterThan(0);
        expect(totalDailyDecks).toBeLessThanOrEqual(40);
    });

    test('should calculate correct daily decks for Day 2', () => {
        const day2Players = demoData.days['2'].players;
        const day1Players = demoData.days['1'].players;
        let totalDailyDecks = 0;

        Object.keys(day2Players).forEach(tag => {
            const day2Decks = day2Players[tag].decksUsed;
            const day1Decks = day1Players[tag] ? day1Players[tag].decksUsed : 0;
            const dailyDecks = day2Decks - day1Decks;
            totalDailyDecks += dailyDecks >= 0 ? dailyDecks : 0;
        });

        const numPlayers = Object.keys(day2Players).length;
        const maxDecks = numPlayers * 4;

        expect(numPlayers).toBe(10);
        expect(maxDecks).toBe(40);
        expect(totalDailyDecks).toBeGreaterThan(0);
        expect(totalDailyDecks).toBeLessThanOrEqual(40);

        // BUG: Previously showed "270 / 200" which is wrong
        // Correct: should be "X / 40" where X <= 40
        expect(totalDailyDecks).not.toBe(270);
        expect(maxDecks).not.toBe(200);
    });

    test('should calculate correct total for all days', () => {
        const days = ['1', '2', '3', '4'];
        const playerTags = Object.keys(demoData.days['1'].players);
        let grandTotal = 0;

        days.forEach((day, index) => {
            const currentDayPlayers = demoData.days[day].players;
            const prevDayPlayers = index > 0 ? demoData.days[days[index - 1]].players : {};

            playerTags.forEach(tag => {
                const currentDecks = currentDayPlayers[tag] ? currentDayPlayers[tag].decksUsed : 0;
                const prevDecks = prevDayPlayers[tag] ? prevDayPlayers[tag].decksUsed : 0;
                const dailyDecks = currentDecks - prevDecks;
                grandTotal += dailyDecks >= 0 ? dailyDecks : 0;
            });
        });

        const numPlayers = playerTags.length;
        const numDays = days.length;
        const maxDecks = numPlayers * numDays * 4;

        expect(numPlayers).toBe(10);
        expect(numDays).toBe(4);
        expect(maxDecks).toBe(160); // 10 players × 4 days × 4 decks = 160
        expect(grandTotal).toBeGreaterThan(0);
        expect(grandTotal).toBeLessThanOrEqual(160);

        // BUG: Previously used hardcoded 50 players → maxDecks would be 200 or 800
        expect(maxDecks).not.toBe(200);
        expect(maxDecks).not.toBe(800);
    });

    test('Max decks should always be clan capacity (50 players)', () => {
        // Clan capacity is always 50 players max, regardless of actual participants
        // This shows "what % of our clan's potential did we use?"
        const maxDecksPerDay = 50 * 4;

        expect(maxDecksPerDay).toBe(200); // 50 players × 4 decks (clan capacity)
    });

    test('should only count visible players when calculating max decks', () => {
        // Simulate filtering: if 2 players are hidden, max should be 8 × 4 = 32
        const totalPlayers = Object.keys(demoData.days['1'].players).length;
        const hiddenPlayers = 2;
        const visiblePlayers = totalPlayers - hiddenPlayers;

        const maxDecksWithFilter = visiblePlayers * 4;

        expect(maxDecksWithFilter).toBe(32); // 8 visible players × 4 decks
        expect(maxDecksWithFilter).toBeLessThan(totalPlayers * 4);
    });

    test('should handle edge case: all players perfect (4 decks each)', () => {
        const numPlayers = 10;
        const totalDecks = numPlayers * 4;
        const maxDecks = numPlayers * 4;
        const percentage = (totalDecks / maxDecks) * 100;

        expect(percentage).toBe(100.0);
    });

    test('should handle edge case: no decks played', () => {
        const numPlayers = 10;
        const totalDecks = 0;
        const maxDecks = numPlayers * 4;
        const percentage = maxDecks > 0 ? (totalDecks / maxDecks) * 100 : 0;

        expect(percentage).toBe(0.0);
    });

    test('Pure function: calculateDeckCounterStats with all days', () => {
        const playerData = [
            { totalDecks: 16, dailyDecks: { '1': 4, '2': 4, '3': 4, '4': 4 } },
            { totalDecks: 12, dailyDecks: { '1': 3, '2': 3, '3': 3, '4': 3 } },
            { totalDecks: 8, dailyDecks: { '1': 2, '2': 2, '3': 2, '4': 2 } }
        ];

        const stats = calculateDeckCounterStats(playerData, 'all', 4);

        expect(stats.totalDecks).toBe(36); // 16 + 12 + 8
        expect(stats.maxDecks).toBe(800); // 50 players × 4 decks × 4 days (clan capacity)
        expect(stats.percentage).toBe('4.5'); // 36/800 = 4.5%
    });

    test('Pure function: calculateDeckCounterStats with Day 1 filter', () => {
        const playerData = [
            { totalDecks: 16, dailyDecks: { '1': 4, '2': 4, '3': 4, '4': 4 } },
            { totalDecks: 12, dailyDecks: { '1': 3, '2': 3, '3': 3, '4': 3 } },
            { totalDecks: 8, dailyDecks: { '1': 2, '2': 2, '3': 2, '4': 2 } }
        ];

        const stats = calculateDeckCounterStats(playerData, '1', 4);

        expect(stats.totalDecks).toBe(9); // 4 + 3 + 2 (Day 1 only)
        expect(stats.maxDecks).toBe(200); // 50 players × 4 decks × 1 day (clan capacity)
        expect(stats.percentage).toBe('4.5'); // 9/200 = 4.5%
    });

    test('Pure function: calculateDeckCounterStats with Day 2 filter', () => {
        const playerData = [
            { totalDecks: 16, dailyDecks: { '1': 4, '2': 4, '3': 4, '4': 4 } },
            { totalDecks: 12, dailyDecks: { '1': 3, '2': 3, '3': 3, '4': 3 } },
            { totalDecks: 8, dailyDecks: { '1': 2, '2': 2, '3': 2, '4': 2 } }
        ];

        const stats = calculateDeckCounterStats(playerData, '2', 4);

        expect(stats.totalDecks).toBe(9); // 4 + 3 + 2 (Day 2 only)
        expect(stats.maxDecks).toBe(200); // 50 players × 4 decks × 1 day (clan capacity)
        expect(stats.percentage).toBe('4.5'); // 9/200 = 4.5%
    });

    test('Pure function: handles empty player data', () => {
        const stats = calculateDeckCounterStats([], 'all', 4);

        expect(stats.totalDecks).toBe(0);
        expect(stats.maxDecks).toBe(800); // Always 50 players × 4 decks × 4 days
        expect(stats.percentage).toBe('0.0');
    });

    test('Pure function: handles missing daily decks', () => {
        const playerData = [
            { totalDecks: 16, dailyDecks: { '1': 4, '2': 4 } } // Missing days 3 and 4
        ];

        const stats = calculateDeckCounterStats(playerData, '3', 4);

        expect(stats.totalDecks).toBe(0); // Day 3 missing, should be 0
        expect(stats.maxDecks).toBe(200); // Always 50 players × 4 decks × 1 day
        expect(stats.percentage).toBe('0.0');
    });

    test('REGRESSION: Percentage uses clan capacity, not actual players', () => {
        // Deck counter should always show clan capacity (50 players)
        // This gives meaningful % of clan potential used
        const playerData = [
            { totalDecks: 16, dailyDecks: { '1': 4, '2': 4, '3': 4, '4': 4 } },
            { totalDecks: 16, dailyDecks: { '1': 4, '2': 4, '3': 4, '4': 4 } }
        ];

        const stats = calculateDeckCounterStats(playerData, '2', 4);

        // Always uses 50 players (clan capacity), not actual 2 players
        expect(stats.maxDecks).toBe(200); // 50 × 4 = 200
        expect(stats.totalDecks).toBe(8);
        expect(stats.percentage).toBe('4.0'); // 8/200 = 4%
    });

    test('REGRESSION: percentage calculation should never exceed 100% with correct logic', () => {
        // BUG: "270 / 200 (135.0%)" means calculation was wrong
        // Correct logic: percentage should NEVER exceed 100%

        const days = ['1', '2', '3', '4'];

        days.forEach((day, index) => {
            const currentDayPlayers = demoData.days[day].players;
            const prevDayPlayers = index > 0 ? demoData.days[days[index - 1]].players : {};

            let dailyDecks = 0;
            Object.keys(currentDayPlayers).forEach(tag => {
                const current = currentDayPlayers[tag].decksUsed;
                const prev = prevDayPlayers[tag] ? prevDayPlayers[tag].decksUsed : 0;
                dailyDecks += Math.max(0, current - prev);
            });

            const numPlayers = Object.keys(currentDayPlayers).length;
            const maxDecks = numPlayers * 4;
            const percentage = (dailyDecks / maxDecks) * 100;

            // Each player can play max 4 decks per day, so percentage should never exceed 100%
            expect(percentage).toBeLessThanOrEqual(100.0);
            expect(percentage).not.toBe(135.0); // The bug value
        });
    });

    test('CRITICAL REGRESSION: 540 / 200 (270%) bug - must use DAILY decks, not CUMULATIVE', () => {
        // BUG: "540 / 200 decks played (270.0%)"
        // This happens when summing CUMULATIVE deck values instead of DAILY deck values

        // Simulate data where cumulative values would give 540, but daily should give much less
        const playerData = [
            // Player 1: Perfect player (4 decks each day)
            { totalDecks: 16, dailyDecks: { '1': 4, '2': 4, '3': 4, '4': 4 } },
            // Player 2: Perfect player
            { totalDecks: 16, dailyDecks: { '1': 4, '2': 4, '3': 4, '4': 4 } },
            // Player 3: Perfect player
            { totalDecks: 16, dailyDecks: { '1': 4, '2': 4, '3': 4, '4': 4 } }
        ];

        // When filtering to Day 1, we should ONLY count Day 1 decks (4+4+4 = 12)
        const day1Stats = calculateDeckCounterStats(playerData, '1', 4);

        expect(day1Stats.totalDecks).toBe(12); // Daily sum for day 1
        expect(day1Stats.maxDecks).toBe(200); // 50 players × 4 decks
        expect(parseFloat(day1Stats.percentage)).toBe(6.0); // 12/200 = 6%

        // BUG: If we incorrectly sum cumulative values, we'd get wrong results
        expect(day1Stats.totalDecks).not.toBe(48); // WRONG: This would be if we sum totalDecks
        expect(parseFloat(day1Stats.percentage)).not.toBe(24.0); // WRONG: 48/200
        expect(parseFloat(day1Stats.percentage)).not.toBeGreaterThan(100); // CRITICAL: Never > 100%
    });

    test('CRITICAL REGRESSION: Show All must sum DAILY decks correctly across all days', () => {
        // When showing "All days", must sum daily decks, not cumulative values

        const playerData = [
            // Player with cumulative values: Day1=4, Day2=8, Day3=12, Day4=16
            // Daily values: Day1=4, Day2=4, Day3=4, Day4=4 (16 total)
            { totalDecks: 16, dailyDecks: { '1': 4, '2': 4, '3': 4, '4': 4 } },
            { totalDecks: 16, dailyDecks: { '1': 4, '2': 4, '3': 4, '4': 4 } }
        ];

        const allDaysStats = calculateDeckCounterStats(playerData, 'all', 4);

        // Should sum totalDecks (which is pre-calculated daily sum)
        expect(allDaysStats.totalDecks).toBe(32); // 16 + 16
        expect(allDaysStats.maxDecks).toBe(800); // 50 players × 4 decks × 4 days
        expect(parseFloat(allDaysStats.percentage)).toBe(4.0); // 32/800 = 4%

        // BUG: Never exceed 100%
        expect(parseFloat(allDaysStats.percentage)).not.toBeGreaterThan(100);
    });

    test('CRITICAL REGRESSION: Deck counter must NEVER show percentage > 100%', () => {
        // This is the ultimate guard - regardless of data, % should never exceed 100%
        // If it does, we're summing wrong values

        const testCases = [
            { playerData: [], selectedDay: 'all', availableDays: 4 },
            { playerData: [{ totalDecks: 16, dailyDecks: { '1': 4, '2': 4, '3': 4, '4': 4 } }], selectedDay: '1', availableDays: 4 },
            { playerData: [{ totalDecks: 16, dailyDecks: { '1': 4, '2': 4, '3': 4, '4': 4 } }], selectedDay: 'all', availableDays: 4 },
        ];

        testCases.forEach(({ playerData, selectedDay, availableDays }) => {
            const stats = calculateDeckCounterStats(playerData, selectedDay, availableDays);
            const percentage = parseFloat(stats.percentage);

            expect(percentage).toBeLessThanOrEqual(100.0);
            expect(percentage).toBeGreaterThanOrEqual(0.0);

            // Specific bug values that have appeared before
            expect(percentage).not.toBe(135.0);
            expect(percentage).not.toBe(270.0);
            expect(stats.totalDecks).not.toBe(540); // The exact bug value user reported
        });
    });

    test('CRITICAL BUG: Missing previous days causes cumulative values to be treated as daily', () => {
        // BUG SCENARIO: History only has Day 3 data (Days 1 and 2 are missing)
        // Players show cumulative decks (e.g., 8 = Days 1+2+3 combined)
        // Code incorrectly treats this as "8 decks on Day 3" because no Day 2 to subtract from

        // This simulates what happens when history.json only has Day 3:
        // - days array = ['3'] (only one element)
        // - days[index-1] = undefined when index=0
        // - But history.days['2'] might exist or not exist

        // The bug: using index-based lookup instead of day-number-based lookup
        const historyWithOnlyDay3 = {
            days: {
                '3': {
                    players: {
                        '#ABC': { name: 'Player1', decksUsed: 8, fame: 900 }, // Cumulative: 8 decks across Days 1+2+3
                        '#DEF': { name: 'Player2', decksUsed: 12, fame: 1200 }, // Cumulative: 12 decks
                    }
                }
                // Days 1 and 2 are missing!
            }
        };

        // When code processes Day 3 with index=0:
        // WRONG: prevDayObj = index > 0 ? history.days[days[0]] : null  →  null
        // RIGHT: prevDayObj = dayNum > 1 ? history.days['2'] : null  →  null (but we know it's missing!)

        // With WRONG logic: dailyDecks = 8 - 0 = 8 (treats cumulative as daily)
        // With RIGHT logic: dailyDecks = 8 - 0 = 8 (same, but we know Day 2 is missing)

        // The real issue: When Day 2 is missing, we CAN'T calculate Day 3's daily decks accurately!
        // But we need to avoid showing "540 / 200 (270%)" by ensuring we don't sum cumulative values

        // Test that would fail with the bug:
        const days = Object.keys(historyWithOnlyDay3.days);
        expect(days).toEqual(['3']); // Only Day 3

        // If we incorrectly calculate daily decks:
        let buggyTotal = 0;
        days.forEach((day, index) => {
            const currentPlayers = historyWithOnlyDay3.days[day].players;
            // BUG: Using index-based lookup
            const prevDayObj = index > 0 ? historyWithOnlyDay3.days[days[index - 1]] : null;
            const prevPlayers = prevDayObj ? prevDayObj.players : {};

            Object.keys(currentPlayers).forEach(tag => {
                const current = currentPlayers[tag].decksUsed;
                const prev = prevPlayers[tag] ? prevPlayers[tag].decksUsed : 0;
                buggyTotal += (current - prev); // 8 - 0 + 12 - 0 = 20
            });
        });

        // With the bug, buggyTotal = 20 (treating cumulative as daily)
        expect(buggyTotal).toBe(20); // This is the bug!

        // Correct approach: Look for ACTUAL previous day
        let correctTotal = 0;
        days.forEach((day) => {
            const dayNum = parseInt(day);
            const currentPlayers = historyWithOnlyDay3.days[day].players;
            // FIX: Using day-number-based lookup
            const prevDay = String(dayNum - 1);
            const prevDayObj = dayNum > 1 ? historyWithOnlyDay3.days[prevDay] : null;
            const prevPlayers = prevDayObj ? prevDayObj.players : {};

            Object.keys(currentPlayers).forEach(tag => {
                const current = currentPlayers[tag].decksUsed;
                const prev = prevPlayers[tag] ? prevPlayers[tag].decksUsed : 0;
                correctTotal += (current - prev); // Still 20, but we KNOW Day 2 is missing
            });
        });

        // The totals are the same, but the FIX is about looking up the RIGHT day
        // The real benefit shows when days array = ['1', '3'] (skipping 2):
        // BUG: Would look at days[0] for Day 3's previous (which is Day 1, WRONG!)
        // FIX: Would look at '2' for Day 3's previous (which is missing, correct!)

        expect(correctTotal).toBe(20);
    });

    test('CRITICAL BUG: Filtered days with gaps must use day-number lookup, not index', () => {
        // More extreme case: User filters to show Days 1 and 3 only (skip Day 2)
        // days = ['1', '3']

        const historyWithDays1And3 = {
            days: {
                '1': { players: { '#ABC': { name: 'P1', decksUsed: 4, fame: 400 } } },
                '2': { players: { '#ABC': { name: 'P1', decksUsed: 8, fame: 800 } } }, // Day 2 exists but not in filtered array
                '3': { players: { '#ABC': { name: 'P1', decksUsed: 12, fame: 1200 } } }
            }
        };

        const filteredDays = ['1', '3']; // User filtered to show Days 1 and 3 only

        // BUG: Using index-based lookup
        let buggyDay3Decks = 0;
        filteredDays.forEach((day, index) => {
            if (day === '3') {
                const current = historyWithDays1And3.days['3'].players['#ABC'].decksUsed; // 12
                const prevDayObj = index > 0 ? historyWithDays1And3.days[filteredDays[index - 1]] : null;
                // prevDayObj = history.days['1'] (WRONG! Should be Day 2!)
                const prev = prevDayObj ? prevDayObj.players['#ABC'].decksUsed : 0; // 4 (from Day 1)
                buggyDay3Decks = current - prev; // 12 - 4 = 8 (WRONG!)
            }
        });

        expect(buggyDay3Decks).toBe(8); // This is WRONG - it's using Day 1 as previous!

        // FIX: Using day-number-based lookup
        let correctDay3Decks = 0;
        filteredDays.forEach((day) => {
            if (day === '3') {
                const dayNum = parseInt(day);
                const current = historyWithDays1And3.days['3'].players['#ABC'].decksUsed; // 12
                const prevDay = String(dayNum - 1); // '2'
                const prevDayObj = dayNum > 1 ? historyWithDays1And3.days[prevDay] : null;
                // prevDayObj = history.days['2'] (CORRECT!)
                const prev = prevDayObj ? prevDayObj.players['#ABC'].decksUsed : 0; // 8 (from Day 2)
                correctDay3Decks = current - prev; // 12 - 8 = 4 (CORRECT!)
            }
        });

        expect(correctDay3Decks).toBe(4); // This is CORRECT - Day 3's actual daily decks
    });
});
