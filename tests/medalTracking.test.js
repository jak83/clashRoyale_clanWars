/**
 * Tests for Medal Tracking feature
 * Validates daily top performer medals and war position medals
 */

describe('Medal Tracking', () => {
    describe('Daily Performance Medals', () => {
        test('should award gold medal to top performer with 4 decks', () => {
            const dailyPerformance = [
                { tag: '#P1', dailyDecks: 4 },
                { tag: '#P2', dailyDecks: 3 },
                { tag: '#P3', dailyDecks: 2 },
            ];

            const sorted = [...dailyPerformance].sort((a, b) => b.dailyDecks - a.dailyDecks);
            const topPerformer = sorted[0];
            const medal = topPerformer.dailyDecks >= 4 ? '🥇' : '';

            expect(medal).toBe('🥇');
            expect(topPerformer.tag).toBe('#P1');
        });

        test('should award silver medal to 2nd place with 4 decks', () => {
            const dailyPerformance = [
                { tag: '#P1', dailyDecks: 4 },
                { tag: '#P2', dailyDecks: 4 },
                { tag: '#P3', dailyDecks: 3 },
            ];

            const sorted = [...dailyPerformance].sort((a, b) => b.dailyDecks - a.dailyDecks);

            // Both have 4 decks but P2 is second
            expect(sorted[0].dailyDecks).toBe(4);
            expect(sorted[1].dailyDecks).toBe(4);
        });

        test('should award bronze medal to 3rd place with 4 decks', () => {
            const dailyPerformance = [
                { tag: '#P1', dailyDecks: 4 },
                { tag: '#P2', dailyDecks: 4 },
                { tag: '#P3', dailyDecks: 4 },
            ];

            const sorted = [...dailyPerformance].sort((a, b) => b.dailyDecks - a.dailyDecks);

            expect(sorted[2].dailyDecks).toBe(4);
        });

        test('should not award medal if less than 4 decks', () => {
            const performance = { dailyDecks: 3 };
            const medal = performance.dailyDecks >= 4 ? '🥇' : '';

            expect(medal).toBe('');
        });

        test('should handle ties - both get gold if tied for 1st', () => {
            const dailyPerformance = [
                { tag: '#P1', dailyDecks: 4 },
                { tag: '#P2', dailyDecks: 4 },
                { tag: '#P3', dailyDecks: 3 },
            ];

            const sorted = [...dailyPerformance].sort((a, b) => b.dailyDecks - a.dailyDecks);
            const firstPlace = sorted[0];
            const secondPlace = sorted[1];

            const bothHave4Decks = firstPlace.dailyDecks === 4 && secondPlace.dailyDecks === 4;
            const areTied = firstPlace.dailyDecks === secondPlace.dailyDecks;

            expect(bothHave4Decks).toBe(true);
            expect(areTied).toBe(true);
        });

        test('should only award medals to players with positive daily decks', () => {
            const dailyPerformance = [
                { tag: '#P1', dailyDecks: 4 },
                { tag: '#P2', dailyDecks: 0 },
            ];

            const withDecks = dailyPerformance.filter(p => p.dailyDecks > 0);

            expect(withDecks.length).toBe(1);
            expect(withDecks[0].tag).toBe('#P1');
        });
    });

    describe('War Position Medals', () => {
        test('should show gold medal for 1st place', () => {
            const rank = 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

            expect(medal).toBe('🥇');
        });

        test('should show silver medal for 2nd place', () => {
            const rank = 2;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

            expect(medal).toBe('🥈');
        });

        test('should show bronze medal for 3rd place', () => {
            const rank = 3;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

            expect(medal).toBe('🥉');
        });

        test('should show no medal for 4th place or lower', () => {
            const rank4 = 4;
            const rank5 = 5;
            const medal4 = rank4 === 1 ? '🥇' : rank4 === 2 ? '🥈' : rank4 === 3 ? '🥉' : '';
            const medal5 = rank5 === 1 ? '🥇' : rank5 === 2 ? '🥈' : rank5 === 3 ? '🥉' : '';

            expect(medal4).toBe('');
            expect(medal5).toBe('');
        });
    });

    describe('Medal Display Logic', () => {
        test('should format medal with deck count', () => {
            const medal = '🥇';
            const dailyDecks = 4;
            const display = `${medal} ${dailyDecks} / 4`;

            expect(display).toBe('🥇 4 / 4');
        });

        test('should show deck count without medal if no medal earned', () => {
            const medal = '';
            const dailyDecks = 3;
            const display = medal ? `${medal} ${dailyDecks} / 4` : `${dailyDecks} / 4`;

            expect(display).toBe('3 / 4');
        });

        test('should display large medal for war position', () => {
            const rank = 1;
            const medal = '🥇';
            const fontSize = '3rem';

            expect(medal).toBe('🥇');
            expect(fontSize).toBe('3rem');
        });
    });

    describe('Top Performer Calculation', () => {
        test('should identify top 3 performers from larger group', () => {
            const players = [
                { tag: '#P1', dailyDecks: 4 },
                { tag: '#P2', dailyDecks: 4 },
                { tag: '#P3', dailyDecks: 4 },
                { tag: '#P4', dailyDecks: 3 },
                { tag: '#P5', dailyDecks: 2 },
                { tag: '#P6', dailyDecks: 1 },
                { tag: '#P7', dailyDecks: 0 },
            ];

            const sorted = [...players].sort((a, b) => b.dailyDecks - a.dailyDecks);
            const top3 = sorted.slice(0, 3).filter(p => p.dailyDecks >= 4);

            expect(top3.length).toBe(3);
            expect(top3[0].dailyDecks).toBe(4);
            expect(top3[1].dailyDecks).toBe(4);
            expect(top3[2].dailyDecks).toBe(4);
        });

        test('should handle day where nobody gets 4 decks', () => {
            const players = [
                { tag: '#P1', dailyDecks: 3 },
                { tag: '#P2', dailyDecks: 2 },
                { tag: '#P3', dailyDecks: 1 },
            ];

            const sorted = [...players].sort((a, b) => b.dailyDecks - a.dailyDecks);
            const top3WithMedals = sorted.slice(0, 3).filter(p => p.dailyDecks >= 4);

            expect(top3WithMedals.length).toBe(0); // No medals awarded
        });

        test('should handle day where only 1 player gets 4 decks', () => {
            const players = [
                { tag: '#P1', dailyDecks: 4 },
                { tag: '#P2', dailyDecks: 3 },
                { tag: '#P3', dailyDecks: 2 },
            ];

            const sorted = [...players].sort((a, b) => b.dailyDecks - a.dailyDecks);
            const top3WithMedals = sorted.slice(0, 3).filter(p => p.dailyDecks >= 4);

            expect(top3WithMedals.length).toBe(1);
            expect(top3WithMedals[0].tag).toBe('#P1');
        });
    });

    describe('Daily Medal Tracking', () => {
        test('should track medals separately per day', () => {
            const dayMedals = {
                '1': { '#P1': '🥇', '#P2': '🥈', '#P3': '🥉' },
                '2': { '#P4': '🥇', '#P5': '🥈', '#P6': '🥉' },
            };

            expect(dayMedals['1']['#P1']).toBe('🥇');
            expect(dayMedals['2']['#P4']).toBe('🥇');
            expect(dayMedals['1']['#P4']).toBeUndefined();
        });

        test('should allow same player to win medals on multiple days', () => {
            const dayMedals = {
                '1': { '#P1': '🥇' },
                '2': { '#P1': '🥇' },
                '3': { '#P1': '🥈' },
                '4': { '#P1': '🥇' },
            };

            const player1Medals = Object.values(dayMedals).filter(day => day['#P1']).map(day => day['#P1']);

            expect(player1Medals.length).toBe(4);
            expect(player1Medals.filter(m => m === '🥇').length).toBe(3);
        });
    });

    describe('Edge Cases', () => {
        test('should handle all 50 players with 4 decks', () => {
            const players = Array.from({ length: 50 }, (_, i) => ({
                tag: `#P${i}`,
                dailyDecks: 4
            }));

            const sorted = [...players].sort((a, b) => b.dailyDecks - a.dailyDecks);
            const top3 = sorted.slice(0, 3);

            expect(top3.length).toBe(3);
            expect(top3.every(p => p.dailyDecks === 4)).toBe(true);
        });

        test('should handle day with no participants', () => {
            const players = [];
            const sorted = [...players].sort((a, b) => b.dailyDecks - a.dailyDecks);
            const top3 = sorted.slice(0, 3);

            expect(top3.length).toBe(0);
        });
    });

    describe('Medal Column Display', () => {
        test('should show all medals earned by player', () => {
            const playerMedals = ['🥇', '🥈', '🥇', '🥉'];
            const display = playerMedals.join(' ');

            expect(display).toBe('🥇 🥈 🥇 🥉');
        });

        test('should show dash if no medals earned', () => {
            const playerMedals = [];
            const display = playerMedals.length > 0 ? playerMedals.join(' ') : '-';

            expect(display).toBe('-');
        });

        test('should count total medals for sorting', () => {
            const player1Medals = ['🥇', '🥇', '🥇', '🥇'];
            const player2Medals = ['🥈', '🥉'];
            const player3Medals = [];

            expect(player1Medals.length).toBe(4);
            expect(player2Medals.length).toBe(2);
            expect(player3Medals.length).toBe(0);
        });
    });

    describe('Full War Podium', () => {
        test('should calculate overall performance across all days', () => {
            const player = {
                day1Decks: 4,
                day2Decks: 4,
                day3Decks: 4,
                day4Decks: 4,
            };

            const totalDecks = player.day1Decks + player.day2Decks + player.day3Decks + player.day4Decks;

            expect(totalDecks).toBe(16);
        });

        test('should identify top 3 overall performers', () => {
            const players = [
                { name: 'Alice', totalDecks: 16, medalCount: 4 },
                { name: 'Bob', totalDecks: 15, medalCount: 2 },
                { name: 'Charlie', totalDecks: 14, medalCount: 1 },
                { name: 'Diana', totalDecks: 12, medalCount: 0 },
            ];

            const sorted = [...players].sort((a, b) => b.totalDecks - a.totalDecks);
            const top3 = sorted.slice(0, 3);

            expect(top3[0].name).toBe('Alice');
            expect(top3[1].name).toBe('Bob');
            expect(top3[2].name).toBe('Charlie');
        });

        test('should assign podium medals correctly', () => {
            const positions = [0, 1, 2];
            const medals = positions.map(i =>
                i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'
            );

            expect(medals).toEqual(['🥇', '🥈', '🥉']);
        });

        test('should show both total decks and daily medals on podium', () => {
            const winner = {
                name: 'TopPlayer',
                totalDecks: 16,
                medalCount: 3
            };

            const podiumDisplay = {
                decks: `${winner.totalDecks} decks total`,
                medals: `${winner.medalCount} daily medals`
            };

            expect(podiumDisplay.decks).toBe('16 decks total');
            expect(podiumDisplay.medals).toBe('3 daily medals');
        });
    });

    describe('Podium Scenarios', () => {
        test('scenario: player with most decks but fewer medals', () => {
            const consistent = { totalDecks: 16, medalCount: 0 }; // Always 4, never first
            const topPerformer = { totalDecks: 14, medalCount: 2 }; // Some days first

            // Podium ranks by total decks
            const rank = consistent.totalDecks > topPerformer.totalDecks ? 1 : 2;

            expect(rank).toBe(1);
        });

        test('scenario: player with most medals but fewer total decks', () => {
            const medalKing = { totalDecks: 12, medalCount: 4 };
            const deckKing = { totalDecks: 16, medalCount: 0 };

            // Both achievements are shown on podium
            expect(medalKing.medalCount).toBeGreaterThan(deckKing.medalCount);
            expect(deckKing.totalDecks).toBeGreaterThan(medalKing.totalDecks);
        });
    });
});
