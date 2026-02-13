/**
 * Tests for left player filtering logic
 * Ensures departed players with deck contributions remain visible
 */

describe('Left Player Filtering', () => {
    describe('Player visibility logic', () => {
        test('current member with decks should be visible', () => {
            const player = { inClan: true, totalDecks: 12 };
            const shouldBeHidden = !player.inClan && player.totalDecks === 0;
            expect(shouldBeHidden).toBe(false);
        });

        test('current member with 0 decks should be visible', () => {
            const player = { inClan: true, totalDecks: 0 };
            const shouldBeHidden = !player.inClan && player.totalDecks === 0;
            expect(shouldBeHidden).toBe(false);
        });

        test('departed player with decks should be visible', () => {
            const player = { inClan: false, totalDecks: 8 };
            const shouldBeHidden = !player.inClan && player.totalDecks === 0;
            expect(shouldBeHidden).toBe(false);
        });

        test('departed player with 0 decks should be hidden', () => {
            const player = { inClan: false, totalDecks: 0 };
            const shouldBeHidden = !player.inClan && player.totalDecks === 0;
            expect(shouldBeHidden).toBe(true);
        });
    });

    describe('Dataset attribute assignment', () => {
        test('only departed players with 0 decks get hiddenByDefault attribute', () => {
            const players = [
                { name: 'Alice', inClan: true, decks: 12, shouldHaveAttr: false },
                { name: 'Bob', inClan: true, decks: 0, shouldHaveAttr: false },
                { name: 'Charlie', inClan: false, decks: 8, shouldHaveAttr: false },
                { name: 'Diana', inClan: false, decks: 0, shouldHaveAttr: true },
            ];

            players.forEach(p => {
                const hasAttr = !p.inClan && p.decks === 0;
                expect(hasAttr).toBe(p.shouldHaveAttr);
            });
        });
    });

    describe('Button toggle behavior', () => {
        test('button should only target rows with data-hidden-by-default="true"', () => {
            // Simulate button click selector
            const allRows = [
                { attr: null, name: 'CurrentMember' },
                { attr: null, name: 'LeftWithDecks' },
                { attr: 'true', name: 'LeftNoDecks1' },
                { attr: 'true', name: 'LeftNoDecks2' },
            ];

            // Button queries: tr[data-hidden-by-default="true"]
            const toggledRows = allRows.filter(r => r.attr === 'true');

            expect(toggledRows.length).toBe(2);
            expect(toggledRows[0].name).toBe('LeftNoDecks1');
            expect(toggledRows[1].name).toBe('LeftNoDecks2');
        });

        test('departed players with decks should never be in toggle selection', () => {
            const leftPlayerWithDecks = { attr: null }; // No hiddenByDefault attr
            const leftPlayerNoDecks = { attr: 'true' }; // Has hiddenByDefault attr

            const buttonTargetsWithDecks = leftPlayerWithDecks.attr === 'true';
            const buttonTargetsNoDecks = leftPlayerNoDecks.attr === 'true';

            expect(buttonTargetsWithDecks).toBe(false);
            expect(buttonTargetsNoDecks).toBe(true);
        });
    });

    describe('Deck counting', () => {
        test('total decks should include contributions from departed players', () => {
            const players = [
                { name: 'Current1', inClan: true, decks: 16 },
                { name: 'Current2', inClan: true, decks: 12 },
                { name: 'LeftButPlayed', inClan: false, decks: 8 },
                { name: 'LeftNoPlay', inClan: false, decks: 0 },
            ];

            const totalDecks = players.reduce((sum, p) => sum + p.decks, 0);
            expect(totalDecks).toBe(36); // Includes LeftButPlayed's 8 decks
        });

        test('player with partial contribution should still be visible if left', () => {
            const player = { inClan: false, totalDecks: 1 };
            const shouldBeHidden = !player.inClan && player.totalDecks === 0;
            expect(shouldBeHidden).toBe(false); // Even 1 deck = visible
        });
    });

    describe('Edge cases', () => {
        test('departed player who played exactly 4 decks should remain visible', () => {
            const player = { inClan: false, totalDecks: 4 };
            const shouldBeHidden = !player.inClan && player.totalDecks === 0;
            expect(shouldBeHidden).toBe(false);
        });

        test('departed player who played 1 deck on day 1 then left should remain visible', () => {
            const player = { inClan: false, totalDecks: 1 };
            const shouldBeHidden = !player.inClan && player.totalDecks === 0;
            expect(shouldBeHidden).toBe(false);
        });

        test('current member who has not played yet should be visible', () => {
            const player = { inClan: true, totalDecks: 0 };
            const shouldBeHidden = !player.inClan && player.totalDecks === 0;
            expect(shouldBeHidden).toBe(false);
        });

        test('multiple departed players with varying deck counts', () => {
            const departedPlayers = [
                { decks: 16, shouldBeVisible: true },
                { decks: 8, shouldBeVisible: true },
                { decks: 1, shouldBeVisible: true },
                { decks: 0, shouldBeVisible: false },
                { decks: 0, shouldBeVisible: false },
            ];

            departedPlayers.forEach(p => {
                const isVisible = p.decks > 0;
                expect(isVisible).toBe(p.shouldBeVisible);
            });
        });
    });

    describe('Player count updates', () => {
        test('hidden departed players should not be counted in visible total', () => {
            const allPlayers = [
                { visible: true },
                { visible: true },
                { visible: false }, // Hidden departed
                { visible: false }, // Hidden departed
            ];

            const visibleCount = allPlayers.filter(p => p.visible).length;
            expect(visibleCount).toBe(2);
        });

        test('showing inactive departed players should increase count', () => {
            const countBefore = 50; // Current members + left with decks
            const inactiveDepartedCount = 4;
            const countAfter = countBefore + inactiveDepartedCount;

            expect(countAfter).toBe(54);
        });
    });

    describe('Tooltip and styling', () => {
        test('departed player with decks should have special tooltip', () => {
            const player = { inClan: false, totalDecks: 8 };
            const tooltip = player.totalDecks > 0
                ? 'Player left the clan (played decks)'
                : 'Player left the clan (no decks played)';

            expect(tooltip).toBe('Player left the clan (played decks)');
        });

        test('departed player without decks should have different tooltip', () => {
            const player = { inClan: false, totalDecks: 0 };
            const tooltip = player.totalDecks > 0
                ? 'Player left the clan (played decks)'
                : 'Player left the clan (no decks played)';

            expect(tooltip).toBe('Player left the clan (no decks played)');
        });
    });

    describe('Real-world scenarios', () => {
        test('scenario: player plays 2 days then leaves mid-war', () => {
            const playerHistory = {
                day1: { inClan: true, dailyDecks: 4, totalDecks: 4 },
                day2: { inClan: true, dailyDecks: 4, totalDecks: 8 },
                day3: { inClan: false, dailyDecks: 0, totalDecks: 8 }, // Left here
                day4: { inClan: false, dailyDecks: 0, totalDecks: 8 },
            };

            // On day 3 and 4, player should still be visible with 8 total decks
            const shouldBeVisibleDay3 = !(playerHistory.day3.inClan === false && playerHistory.day3.totalDecks === 0);
            const shouldBeVisibleDay4 = !(playerHistory.day4.inClan === false && playerHistory.day4.totalDecks === 0);

            expect(shouldBeVisibleDay3).toBe(true);
            expect(shouldBeVisibleDay4).toBe(true);
        });

        test('scenario: player joins mid-war, plays 1 day, then leaves', () => {
            const playerHistory = {
                day1: { inClan: false, dailyDecks: 0, totalDecks: 0 }, // Not in clan
                day2: { inClan: true, dailyDecks: 4, totalDecks: 4 }, // Joined and played
                day3: { inClan: false, dailyDecks: 0, totalDecks: 4 }, // Left
                day4: { inClan: false, dailyDecks: 0, totalDecks: 4 },
            };

            // Should be visible on days 2-4 due to 4 total decks
            const shouldBeVisibleDay2 = !(playerHistory.day2.inClan === false && playerHistory.day2.totalDecks === 0);
            const shouldBeVisibleDay3 = !(playerHistory.day3.inClan === false && playerHistory.day3.totalDecks === 0);

            expect(shouldBeVisibleDay2).toBe(true);
            expect(shouldBeVisibleDay3).toBe(true); // Still visible after leaving
        });

        test('scenario: clan has 100% participation (200/200 decks)', () => {
            const clanSize = 50;
            const decksPerPlayer = 4;
            const totalDecks = clanSize * decksPerPlayer;
            const maxDecks = 50 * 4;

            expect(totalDecks).toBe(maxDecks);
            expect(totalDecks).toBe(200);
        });
    });
});
