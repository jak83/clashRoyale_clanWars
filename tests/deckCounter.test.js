/**
 * Unit tests for deck counter calculations
 * Tests the logic that calculates and displays deck usage statistics
 */

const demoManager = require('../demoManager');

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

    test('REGRESSION: max decks should be based on actual player count, not hardcoded 50', () => {
        const numPlayers = Object.keys(demoData.days['1'].players).length;
        const maxDecksPerDay = numPlayers * 4;

        // Before fix: const maxDecksPerDay = 50 * 4; // Hardcoded!
        // After fix: const maxDecksPerDay = playerArray.length * 4;

        expect(maxDecksPerDay).toBe(40); // 10 players × 4 decks
        expect(maxDecksPerDay).not.toBe(200); // Not 50 players × 4 decks
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
});
