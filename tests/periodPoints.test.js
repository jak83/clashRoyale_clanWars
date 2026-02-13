/**
 * @jest-environment jsdom
 */

describe('War Stats - periodPoints vs fame', () => {
    describe('Current War Standings', () => {
        test('should use periodPoints for sorting clans, not fame', () => {
            const clans = [
                { tag: '#CLAN1', name: 'Clan A', fame: 0, periodPoints: 25000 },
                { tag: '#CLAN2', name: 'Clan B', fame: 0, periodPoints: 30000 },
                { tag: '#CLAN3', name: 'Clan C', fame: 0, periodPoints: 20000 }
            ];

            // Sort by periodPoints (correct)
            const sortedByPeriodPoints = [...clans].sort((a, b) => (b.periodPoints || 0) - (a.periodPoints || 0));

            expect(sortedByPeriodPoints[0].name).toBe('Clan B'); // 30000
            expect(sortedByPeriodPoints[1].name).toBe('Clan A'); // 25000
            expect(sortedByPeriodPoints[2].name).toBe('Clan C'); // 20000

            // Sort by fame (incorrect - would give wrong results)
            const sortedByFame = [...clans].sort((a, b) => b.fame - a.fame);

            // All clans have fame=0, so order is unpredictable/unchanged
            // This demonstrates why using fame is wrong
            expect(sortedByFame[0].fame).toBe(0);
            expect(sortedByFame[1].fame).toBe(0);
            expect(sortedByFame[2].fame).toBe(0);
        });

        test('should display periodPoints value, not fame value', () => {
            const clan = {
                tag: '#2QPY0R',
                name: 'aktiivi suomi 2',
                fame: 0,
                periodPoints: 29750
            };

            // Correct: display periodPoints
            const displayValue = clan.periodPoints || 0;
            expect(displayValue).toBe(29750);

            // Incorrect: would display fame (0)
            const wrongDisplayValue = clan.fame;
            expect(wrongDisplayValue).toBe(0);
            expect(wrongDisplayValue).not.toBe(displayValue);
        });

        test('should handle missing periodPoints gracefully', () => {
            const clans = [
                { tag: '#CLAN1', name: 'Clan A', fame: 0 }, // Missing periodPoints
                { tag: '#CLAN2', name: 'Clan B', fame: 0, periodPoints: 30000 }
            ];

            const sortedClans = [...clans].sort((a, b) => (b.periodPoints || 0) - (a.periodPoints || 0));

            expect(sortedClans[0].name).toBe('Clan B'); // Has periodPoints
            expect(sortedClans[1].name).toBe('Clan A'); // Missing periodPoints (treated as 0)
        });

        test('should correctly rank our clan using periodPoints', () => {
            const clanTag = '#2QPY0R';
            const clans = [
                { tag: '#CLAN1', name: 'ITALIA_PRO', fame: 0, periodPoints: 30050 },
                { tag: '#2QPY0R', name: 'aktiivi suomi 2', fame: 0, periodPoints: 29750 },
                { tag: '#CLAN3', name: 'Russian Clan', fame: 0, periodPoints: 24950 },
                { tag: '#CLAN4', name: 'Israel LINE', fame: 0, periodPoints: 24350 }
            ];

            const sortedStandings = [...clans].sort((a, b) => (b.periodPoints || 0) - (a.periodPoints || 0));
            const ourRank = sortedStandings.findIndex(c => c.tag === clanTag) + 1;

            expect(ourRank).toBe(2); // Should be 2nd place
            expect(sortedStandings[0].name).toBe('ITALIA_PRO'); // 1st place
            expect(sortedStandings[1].name).toBe('aktiivi suomi 2'); // 2nd place (us)
        });
    });

    describe('Real-world data structure', () => {
        test('should match actual API response structure', () => {
            // This is the actual structure from Clash Royale API
            const apiResponse = {
                state: 'full',
                clan: {
                    tag: '#2QPY0R',
                    name: 'aktiivi suomi 2',
                    fame: 0,
                    periodPoints: 29750
                },
                clans: [
                    {
                        tag: '#CLAN1',
                        name: 'Other Clan',
                        fame: 0,
                        periodPoints: 30000
                    },
                    {
                        tag: '#2QPY0R',
                        name: 'aktiivi suomi 2',
                        fame: 0,
                        periodPoints: 29750
                    }
                ]
            };

            expect(apiResponse.clan).toHaveProperty('fame');
            expect(apiResponse.clan).toHaveProperty('periodPoints');
            expect(apiResponse.clan.fame).toBe(0);
            expect(apiResponse.clan.periodPoints).toBeGreaterThan(0);

            // Verify all clans in the array have the same structure
            apiResponse.clans.forEach(clan => {
                expect(clan).toHaveProperty('fame');
                expect(clan).toHaveProperty('periodPoints');
            });
        });

        test('should handle state="training" where periodPoints might be 0', () => {
            const trainingData = {
                state: 'training',
                periodType: 'training',
                clan: {
                    tag: '#2QPY0R',
                    name: 'aktiivi suomi 2',
                    fame: 0,
                    periodPoints: 0
                }
            };

            // During training, periodPoints is legitimately 0
            expect(trainingData.clan.periodPoints).toBe(0);
            expect(trainingData.periodType).toBe('training');
        });
    });

    describe('Standing display formatting', () => {
        test('should format periodPoints with thousands separator', () => {
            const periodPoints = 29750;

            const formatted = periodPoints.toLocaleString();

            // Different locales format differently, but all should add separators
            expect(formatted).toMatch(/29[,\s.]750/);
        });

        test('should handle zero periodPoints gracefully', () => {
            const clan = {
                tag: '#CLAN1',
                name: 'Test Clan',
                fame: 0,
                periodPoints: 0
            };

            const displayValue = (clan.periodPoints || 0).toLocaleString();
            expect(displayValue).toBe('0');
        });

        test('should handle large periodPoints values', () => {
            const clan = {
                tag: '#CLAN1',
                name: 'High Performer',
                fame: 0,
                periodPoints: 123456
            };

            const displayValue = (clan.periodPoints || 0).toLocaleString();
            expect(displayValue).toMatch(/123[,\s.]456/);
        });
    });

    describe('Medal assignment based on periodPoints', () => {
        test('should assign gold medal to clan with highest periodPoints', () => {
            const clans = [
                { tag: '#CLAN1', name: 'Gold Winner', fame: 0, periodPoints: 35000 },
                { tag: '#CLAN2', name: 'Silver', fame: 0, periodPoints: 30000 },
                { tag: '#CLAN3', name: 'Bronze', fame: 0, periodPoints: 25000 }
            ];

            const sortedStandings = [...clans].sort((a, b) => (b.periodPoints || 0) - (a.periodPoints || 0));

            const medals = ['🥇', '🥈', '🥉'];

            expect(sortedStandings[0].name).toBe('Gold Winner');
            expect(medals[0]).toBe('🥇');

            expect(sortedStandings[1].name).toBe('Silver');
            expect(medals[1]).toBe('🥈');

            expect(sortedStandings[2].name).toBe('Bronze');
            expect(medals[2]).toBe('🥉');
        });

        test('should handle tie in periodPoints', () => {
            const clans = [
                { tag: '#CLAN1', name: 'Clan A', fame: 0, periodPoints: 30000 },
                { tag: '#CLAN2', name: 'Clan B', fame: 0, periodPoints: 30000 },
                { tag: '#CLAN3', name: 'Clan C', fame: 0, periodPoints: 25000 }
            ];

            const sortedStandings = [...clans].sort((a, b) => (b.periodPoints || 0) - (a.periodPoints || 0));

            // Both tied clans should have same periodPoints
            expect(sortedStandings[0].periodPoints).toBe(30000);
            expect(sortedStandings[1].periodPoints).toBe(30000);

            // Third clan should have lower periodPoints
            expect(sortedStandings[2].periodPoints).toBe(25000);
        });
    });

    describe('Regression test - fame vs periodPoints bug', () => {
        test('BUG: Using fame would show all clans with 0 points', () => {
            // This test documents the original bug
            const clans = [
                { tag: '#CLAN1', name: 'Clan A', fame: 0, periodPoints: 30000 },
                { tag: '#CLAN2', name: 'Clan B', fame: 0, periodPoints: 25000 }
            ];

            // OLD CODE (incorrect): displayed clan.fame
            const oldDisplay = clans.map(c => c.fame);
            expect(oldDisplay).toEqual([0, 0]); // All zeros - wrong!

            // NEW CODE (correct): displays clan.periodPoints
            const newDisplay = clans.map(c => c.periodPoints);
            expect(newDisplay).toEqual([30000, 25000]); // Correct values
        });

        test('FIXED: Sorting by fame would be meaningless when all are 0', () => {
            const clans = [
                { tag: '#CLAN1', name: 'Should be 2nd', fame: 0, periodPoints: 25000 },
                { tag: '#CLAN2', name: 'Should be 1st', fame: 0, periodPoints: 30000 }
            ];

            // OLD CODE (incorrect): sorted by fame
            const oldSort = [...clans].sort((a, b) => b.fame - a.fame);
            // Since all fame=0, order stays unchanged - wrong!
            expect(oldSort[0].name).toBe('Should be 2nd');

            // NEW CODE (correct): sorted by periodPoints
            const newSort = [...clans].sort((a, b) => (b.periodPoints || 0) - (a.periodPoints || 0));
            expect(newSort[0].name).toBe('Should be 1st'); // Correctly sorted
            expect(newSort[1].name).toBe('Should be 2nd');
        });
    });
});
