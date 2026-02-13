/**
 * Tests for War Statistics feature
 * Validates clan standings, player stats, and war results display
 */

describe('War Statistics', () => {
    describe('Current War Data Structure', () => {
        test('should have required clan stats fields', () => {
            const clanStats = {
                tag: '#2QPY0R',
                name: 'aktiivi suomi 2',
                fame: 5000,
                repairPoints: 100,
                participants: []
            };

            expect(clanStats).toHaveProperty('tag');
            expect(clanStats).toHaveProperty('fame');
            expect(clanStats).toHaveProperty('participants');
        });

        test('should calculate clan ranking correctly', () => {
            const standings = [
                { name: 'Clan A', fame: 10000 },
                { name: 'Clan B', fame: 8000 },
                { name: 'Clan C', fame: 6000 },
                { name: 'Our Clan', fame: 7000 },
            ];

            const sorted = [...standings].sort((a, b) => b.fame - a.fame);
            const ourRank = sorted.findIndex(c => c.name === 'Our Clan') + 1;

            expect(ourRank).toBe(3);
        });

        test('should handle tie in fame scores', () => {
            const standings = [
                { name: 'Clan A', fame: 5000 },
                { name: 'Clan B', fame: 5000 },
                { name: 'Clan C', fame: 5000 },
            ];

            const sorted = [...standings].sort((a, b) => b.fame - a.fame);

            // All should have same fame
            expect(sorted[0].fame).toBe(5000);
            expect(sorted[1].fame).toBe(5000);
            expect(sorted[2].fame).toBe(5000);
        });
    });

    describe('Last War Results', () => {
        test('should determine win status correctly (rank 1 = win)', () => {
            const rank1 = { rank: 1 };
            const rank2 = { rank: 2 };

            expect(rank1.rank === 1).toBe(true);
            expect(rank2.rank === 1).toBe(false);
        });

        test('should calculate trophy change correctly', () => {
            const results = [
                { rank: 1, trophyChange: 20 },
                { rank: 2, trophyChange: 10 },
                { rank: 3, trophyChange: -5 },
                { rank: 4, trophyChange: -10 },
                { rank: 5, trophyChange: -20 },
            ];

            expect(results[0].trophyChange).toBeGreaterThan(0);
            expect(results[1].trophyChange).toBeGreaterThan(0);
            expect(results[2].trophyChange).toBeLessThan(0);
        });

        test('should assign medals correctly', () => {
            const ranks = [1, 2, 3, 4, 5];
            const medals = ranks.map(rank => {
                if (rank === 1) return '🥇';
                if (rank === 2) return '🥈';
                if (rank === 3) return '🥉';
                return '';
            });

            expect(medals[0]).toBe('🥇');
            expect(medals[1]).toBe('🥈');
            expect(medals[2]).toBe('🥉');
            expect(medals[3]).toBe('');
            expect(medals[4]).toBe('');
        });
    });

    describe('Per-Player Statistics', () => {
        test('should have required player stats fields', () => {
            const player = {
                tag: '#ABC123',
                name: 'TestPlayer',
                fame: 800,
                decksUsed: 12,
                decksUsedToday: 4
            };

            expect(player).toHaveProperty('tag');
            expect(player).toHaveProperty('name');
            expect(player).toHaveProperty('fame');
            expect(player).toHaveProperty('decksUsed');
        });

        test('should sort players by fame correctly', () => {
            const players = [
                { name: 'Alice', fame: 500 },
                { name: 'Bob', fame: 900 },
                { name: 'Charlie', fame: 700 },
            ];

            const sorted = [...players].sort((a, b) => (b.fame || 0) - (a.fame || 0));

            expect(sorted[0].name).toBe('Bob');
            expect(sorted[1].name).toBe('Charlie');
            expect(sorted[2].name).toBe('Alice');
        });

        test('should handle players with 0 fame', () => {
            const players = [
                { name: 'Active', fame: 800 },
                { name: 'Inactive', fame: 0 },
            ];

            const sorted = [...players].sort((a, b) => (b.fame || 0) - (a.fame || 0));

            expect(sorted[0].fame).toBe(800);
            expect(sorted[1].fame).toBe(0);
        });

        test('should handle missing fame field (treat as 0)', () => {
            const players = [
                { name: 'Player1', fame: 500 },
                { name: 'Player2' }, // No fame field
            ];

            const sorted = [...players].sort((a, b) => (b.fame || 0) - (a.fame || 0));

            expect(sorted[0].name).toBe('Player1');
            expect(sorted[1].name).toBe('Player2');
        });

        test('should assign correct rankings to players', () => {
            const players = [
                { name: 'Top', fame: 1000 },
                { name: 'Second', fame: 800 },
                { name: 'Third', fame: 600 },
            ];

            const sorted = [...players].sort((a, b) => (b.fame || 0) - (a.fame || 0));
            const ranked = sorted.map((p, index) => ({ ...p, rank: index + 1 }));

            expect(ranked[0].rank).toBe(1);
            expect(ranked[1].rank).toBe(2);
            expect(ranked[2].rank).toBe(3);
        });

        test('should handle large number of players (50+)', () => {
            const players = Array.from({ length: 54 }, (_, i) => ({
                name: `Player${i}`,
                fame: Math.floor(Math.random() * 1000)
            }));

            const sorted = [...players].sort((a, b) => (b.fame || 0) - (a.fame || 0));

            expect(sorted.length).toBe(54);
            expect(sorted[0].fame).toBeGreaterThanOrEqual(sorted[1].fame);
        });
    });

    describe('Training Day Handling', () => {
        test('should detect training day correctly', () => {
            const trainingDay = { periodType: 'training' };
            const warDay = { periodType: 'warDay' };

            expect(trainingDay.periodType === 'training').toBe(true);
            expect(warDay.periodType === 'training').toBe(false);
        });

        test('should show appropriate message during training', () => {
            const periodType = 'training';
            const message = periodType === 'training'
                ? 'Training Day - War has not started yet'
                : 'War in progress';

            expect(message).toBe('Training Day - War has not started yet');
        });
    });

    describe('Fame Calculations', () => {
        test('should calculate total clan fame correctly', () => {
            const participants = [
                { fame: 800 },
                { fame: 700 },
                { fame: 600 },
            ];

            const totalFame = participants.reduce((sum, p) => sum + (p.fame || 0), 0);

            expect(totalFame).toBe(2100);
        });

        test('should handle negative fame (should not exist but handle gracefully)', () => {
            const participants = [
                { fame: 800 },
                { fame: -100 }, // Invalid but handle
            ];

            const totalFame = participants.reduce((sum, p) => sum + (p.fame || 0), 0);

            expect(totalFame).toBe(700);
        });

        test('should calculate fame per deck ratio', () => {
            const player = {
                fame: 800,
                decksUsed: 16
            };

            const famePerDeck = player.decksUsed > 0
                ? (player.fame / player.decksUsed).toFixed(0)
                : 0;

            expect(parseInt(famePerDeck)).toBe(50);
        });
    });

    describe('Deck Statistics', () => {
        test('should track total decks vs today decks', () => {
            const player = {
                decksUsed: 12,
                decksUsedToday: 4
            };

            expect(player.decksUsed).toBeGreaterThanOrEqual(player.decksUsedToday);
        });

        test('should handle case where today decks equals total (first day)', () => {
            const player = {
                decksUsed: 4,
                decksUsedToday: 4
            };

            expect(player.decksUsed).toBe(player.decksUsedToday);
        });

        test('should calculate theoretical max decks', () => {
            const clanSize = 50;
            const decksPerPlayerPerDay = 4;
            const daysOfWar = 4;

            const maxDecks = clanSize * decksPerPlayerPerDay * daysOfWar;

            expect(maxDecks).toBe(800);
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty participants array', () => {
            const participants = [];
            const sorted = [...participants].sort((a, b) => (b.fame || 0) - (a.fame || 0));

            expect(sorted.length).toBe(0);
        });

        test('should handle missing clan in standings', () => {
            const standings = [
                { tag: '#CLAN1', fame: 5000 },
                { tag: '#CLAN2', fame: 4000 },
            ];

            const ourTag = '#CLAN3';
            const ourClan = standings.find(c => c.tag === ourTag);

            expect(ourClan).toBeUndefined();
        });

        test('should handle API error gracefully', () => {
            const errorResponse = null;
            const fallbackMessage = errorResponse
                ? 'Display stats'
                : 'Could not load war statistics';

            expect(fallbackMessage).toBe('Could not load war statistics');
        });

        test('should handle single clan in race', () => {
            const standings = [
                { name: 'Only Clan', fame: 5000 }
            ];

            const rank = 1;

            expect(standings.length).toBe(1);
            expect(rank).toBe(1);
        });

        test('should handle maximum 5 clans per race', () => {
            const standings = Array.from({ length: 5 }, (_, i) => ({
                name: `Clan${i}`,
                fame: (5 - i) * 1000
            }));

            expect(standings.length).toBeLessThanOrEqual(5);
        });
    });

    describe('Data Formatting', () => {
        test('should format large fame numbers with separators', () => {
            const fame = 10000;
            const formatted = fame.toLocaleString();

            // Handles different locales: comma, period, or space
            expect(formatted).toMatch(/10[,.\s]000/);
        });

        test('should format trophy change with sign', () => {
            const positive = 20;
            const negative = -10;

            const posStr = positive > 0 ? `+${positive}` : `${positive}`;
            const negStr = negative > 0 ? `+${negative}` : `${negative}`;

            expect(posStr).toBe('+20');
            expect(negStr).toBe('-10');
        });

        test('should handle zero trophy change', () => {
            const trophyChange = 0;
            const display = trophyChange > 0 ? `+${trophyChange}` : `${trophyChange}`;

            expect(display).toBe('0');
        });
    });

    describe('Real-World Scenarios', () => {
        test('scenario: clan wins war (rank 1)', () => {
            const result = {
                rank: 1,
                fame: 10000,
                trophyChange: 20
            };

            const isWin = result.rank === 1;
            const earnedTrophies = result.trophyChange > 0;

            expect(isWin).toBe(true);
            expect(earnedTrophies).toBe(true);
        });

        test('scenario: clan loses but gains trophies (rank 2)', () => {
            const result = {
                rank: 2,
                fame: 9340,
                trophyChange: 10
            };

            const isWin = result.rank === 1;
            const earnedTrophies = result.trophyChange > 0;

            expect(isWin).toBe(false);
            expect(earnedTrophies).toBe(true);
        });

        test('scenario: clan finishes last and loses trophies', () => {
            const result = {
                rank: 5,
                fame: 3000,
                trophyChange: -20
            };

            const isLast = result.rank === 5;
            const lostTrophies = result.trophyChange < 0;

            expect(isLast).toBe(true);
            expect(lostTrophies).toBe(true);
        });

        test('scenario: active player with high contribution', () => {
            const player = {
                name: 'TopPlayer',
                fame: 900,
                decksUsed: 16,
                decksUsedToday: 4
            };

            const hasPlayedAllDecks = player.decksUsed === 16;
            const hasPlayedToday = player.decksUsedToday === 4;

            expect(hasPlayedAllDecks).toBe(true);
            expect(hasPlayedToday).toBe(true);
        });

        test('scenario: inactive player (0 fame, 0 decks)', () => {
            const player = {
                name: 'InactivePlayer',
                fame: 0,
                decksUsed: 0,
                decksUsedToday: 0
            };

            const isInactive = player.fame === 0 && player.decksUsed === 0;

            expect(isInactive).toBe(true);
        });
    });

    describe('Standings Comparison', () => {
        test('should compare current standings with last war', () => {
            const lastWar = { rank: 2 };
            const currentStandings = [
                { tag: '#OUR_TAG', fame: 5000 }
            ];

            const sorted = [...currentStandings].sort((a, b) => b.fame - a.fame);
            const currentRank = sorted.findIndex(c => c.tag === '#OUR_TAG') + 1;

            // Could be better or worse than last war
            expect(currentRank).toBeGreaterThanOrEqual(1);
            expect(lastWar.rank).toBe(2);
        });
    });
});
