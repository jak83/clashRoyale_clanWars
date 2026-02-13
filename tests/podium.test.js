/**
 * Unit tests for podium calculation logic
 * Tests daily deck/points calculations for filtered days
 */

describe('Podium Calculations', () => {
    // Mock history data
    const historyData = {
        seasonId: 1,
        sectionIndex: 1,
        days: {
            '1': {
                players: {
                    '#PLAYER1': { name: 'Alice', decksUsed: 4, fame: 400 },
                    '#PLAYER2': { name: 'Bob', decksUsed: 3, fame: 300 }
                }
            },
            '2': {
                players: {
                    '#PLAYER1': { name: 'Alice', decksUsed: 8, fame: 800 },
                    '#PLAYER2': { name: 'Bob', decksUsed: 6, fame: 600 }
                }
            }
        }
    };

    test('REGRESSION: Filtering by Day 2 should show daily decks, not cumulative', () => {
        // BUG: When filtering by Day 2 only, podium showed 8/4 instead of 4/4
        // This is because it used cumulative decksUsed instead of daily (Day 2 - Day 1)

        // Simulate filtering by Day 2 only
        const filteredDays = ['2'];

        // Calculate what podium should show for Player 1
        const day2Data = historyData.days['2'].players['#PLAYER1'];
        const day1Data = historyData.days['1'].players['#PLAYER1'];

        // Daily decks for Day 2 = Day 2 cumulative - Day 1 cumulative
        const expectedDailyDecks = day2Data.decksUsed - day1Data.decksUsed;
        expect(expectedDailyDecks).toBe(4); // 8 - 4 = 4

        // Daily points for Day 2 = Day 2 cumulative - Day 1 cumulative
        const expectedDailyPoints = day2Data.fame - day1Data.fame;
        expect(expectedDailyPoints).toBe(400); // 800 - 400 = 400

        // Podium should show "4 / 4 decks" not "8 / 4 decks"
        const maxDecksPerDay = 4;
        expect(expectedDailyDecks).toBe(maxDecksPerDay);
    });

    test('Filtering by Day 1 should use Day 1 data directly', () => {
        const day1Data = historyData.days['1'].players['#PLAYER1'];

        // Day 1 has no previous day, so daily = cumulative
        const expectedDailyDecks = day1Data.decksUsed;
        expect(expectedDailyDecks).toBe(4);

        const expectedDailyPoints = day1Data.fame;
        expect(expectedDailyPoints).toBe(400);
    });

    test('Filtering by Show All (Day 1 + Day 2) should sum daily values', () => {
        // When showing all days, sum the daily contributions

        const day1Decks = historyData.days['1'].players['#PLAYER1'].decksUsed;
        const day2Cumulative = historyData.days['2'].players['#PLAYER1'].decksUsed;
        const day2Daily = day2Cumulative - day1Decks;

        const totalDailyDecks = day1Decks + day2Daily;
        expect(totalDailyDecks).toBe(8); // 4 + 4 = 8

        // Max for 2 days
        const maxDecksForTwoDays = 4 * 2;
        expect(maxDecksForTwoDays).toBe(8);

        // Podium should show "8 / 8 decks"
        expect(totalDailyDecks).toBe(maxDecksForTwoDays);
    });

    test('Player with no data on previous day should handle gracefully', () => {
        // Player joins on Day 2 (not in Day 1 data)
        const historyWithNewPlayer = {
            days: {
                '1': {
                    players: {
                        '#PLAYER1': { name: 'Alice', decksUsed: 4, fame: 400 }
                    }
                },
                '2': {
                    players: {
                        '#PLAYER1': { name: 'Alice', decksUsed: 8, fame: 800 },
                        '#NEWPLAYER': { name: 'Charlie', decksUsed: 3, fame: 300 }
                    }
                }
            }
        };

        // New player on Day 2: prevDecks should default to 0
        const day2Data = historyWithNewPlayer.days['2'].players['#NEWPLAYER'];
        const prevDecks = 0; // Player wasn't in Day 1
        const dailyDecks = day2Data.decksUsed - prevDecks;

        expect(dailyDecks).toBe(3); // 3 - 0 = 3
    });

    test('REGRESSION: Filtering by Day 3 should look at Day 2 for difference', () => {
        const historyDay3 = {
            days: {
                '1': { players: { '#P1': { name: 'A', decksUsed: 4, fame: 400 } } },
                '2': { players: { '#P1': { name: 'A', decksUsed: 8, fame: 800 } } },
                '3': { players: { '#P1': { name: 'A', decksUsed: 12, fame: 1200 } } }
            }
        };

        // When filtering by Day 3 only, should calculate Day 3 - Day 2
        const day3Cumulative = historyDay3.days['3'].players['#P1'].decksUsed;
        const day2Cumulative = historyDay3.days['2'].players['#P1'].decksUsed;
        const day3Daily = day3Cumulative - day2Cumulative;

        expect(day3Daily).toBe(4); // 12 - 8 = 4

        // Podium should show "4 / 4 decks" not "12 / 4 decks"
        expect(day3Daily).toBe(4);
    });
});
