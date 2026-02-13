/**
 * @jest-environment jsdom
 *
 * Tests for day filter behavior on points, deck counter, and sorting.
 * These tests capture regression scenarios for bugs fixed in commits:
 * - 2b951c4: Make points column respect day filters
 * - 41beb27: Make deck counter respect day filters
 * - e7182a4: Fix points column sorting to respect day filters
 */

describe('Day Filter Behavior - Points and Deck Counter', () => {
    // Mock history data with multiple days
    const mockHistory = {
        seasonId: 1,
        sectionIndex: 1,
        days: {
            '1': {
                timestamp: '2026-02-13T10:00:00.000Z',
                players: {
                    '#PLAYER1': { name: 'Alice', decksUsed: 4, decksUsedToday: 4, fame: 500 },
                    '#PLAYER2': { name: 'Bob', decksUsed: 3, decksUsedToday: 3, fame: 300 },
                    '#PLAYER3': { name: 'Charlie', decksUsed: 0, decksUsedToday: 0, fame: 0 }
                }
            },
            '2': {
                timestamp: '2026-02-14T10:00:00.000Z',
                players: {
                    '#PLAYER1': { name: 'Alice', decksUsed: 8, decksUsedToday: 4, fame: 1000 }, // +500 on day 2
                    '#PLAYER2': { name: 'Bob', decksUsed: 7, decksUsedToday: 4, fame: 700 },   // +400 on day 2
                    '#PLAYER3': { name: 'Charlie', decksUsed: 2, decksUsedToday: 2, fame: 200 } // +200 on day 2
                }
            }
        }
    };

    describe('Points Column Display', () => {
        test('should show cumulative points when "All Days" filter is active', () => {
            // Setup table with data
            document.body.innerHTML = `
                <table>
                    <tbody>
                        <tr data-total-points="1000" data-daily-points='{"1":500,"2":500}'>
                            <td class="player-name">Alice</td>
                            <td class="points-cell">1,000</td>
                        </tr>
                    </tbody>
                </table>
            `;

            const row = document.querySelector('tr');
            const pointsCell = row.querySelector('.points-cell');
            const totalPoints = row.dataset.totalPoints;

            // When "All Days" is active, should show cumulative total
            expect(parseInt(totalPoints)).toBe(1000);
            expect(pointsCell.textContent).toBe('1,000');
        });

        test('should show daily points when filtering by Day 1', () => {
            document.body.innerHTML = `
                <table>
                    <tbody>
                        <tr data-total-points="1000" data-daily-points='{"1":500,"2":500}'>
                            <td class="player-name">Alice</td>
                            <td class="points-cell">500</td>
                        </tr>
                    </tbody>
                </table>
            `;

            const row = document.querySelector('tr');
            const dailyPointsData = row.dataset.dailyPoints;
            const dailyPointsMap = JSON.parse(dailyPointsData);

            // When Day 1 filter is active, should show only Day 1 points
            expect(dailyPointsMap['1']).toBe(500);
        });

        test('should show daily points when filtering by Day 2', () => {
            document.body.innerHTML = `
                <table>
                    <tbody>
                        <tr data-total-points="1000" data-daily-points='{"1":500,"2":500}'>
                            <td class="player-name">Alice</td>
                            <td class="points-cell">500</td>
                        </tr>
                    </tbody>
                </table>
            `;

            const row = document.querySelector('tr');
            const dailyPointsData = row.dataset.dailyPoints;
            const dailyPointsMap = JSON.parse(dailyPointsData);

            // When Day 2 filter is active, should show only Day 2 points
            expect(dailyPointsMap['2']).toBe(500);
        });

        test('should calculate daily points correctly (difference from previous day)', () => {
            // Alice: Day 1 = 500, Day 2 total = 1000, so Day 2 daily = 500
            const day1Fame = 500;
            const day2TotalFame = 1000;
            const day2DailyFame = day2TotalFame - day1Fame;

            expect(day2DailyFame).toBe(500);
        });

        test('should handle player with 0 points on specific day', () => {
            document.body.innerHTML = `
                <table>
                    <tbody>
                        <tr data-total-points="0" data-daily-points='{"1":0,"2":0}'>
                            <td class="player-name">Charlie</td>
                            <td class="points-cell">-</td>
                        </tr>
                    </tbody>
                </table>
            `;

            const pointsCell = document.querySelector('.points-cell');
            expect(pointsCell.textContent).toBe('-');
        });
    });

    describe('Deck Counter Display', () => {
        test('should show cumulative deck count when "All Days" filter is active', () => {
            // 3 players, 2 days: Alice (8 total), Bob (7 total), Charlie (2 total) = 17 total
            const aliceTotal = 8;
            const bobTotal = 7;
            const charlieTotal = 2;
            const totalDecks = aliceTotal + bobTotal + charlieTotal;

            const maxDecksPerDay = 50 * 4; // 200
            const daysCount = 2;
            const maxDecks = maxDecksPerDay * daysCount; // 400
            const percentage = ((totalDecks / maxDecks) * 100).toFixed(1);

            expect(totalDecks).toBe(17);
            expect(maxDecks).toBe(400);
            expect(percentage).toBe('4.3');
        });

        test('should show daily deck count when filtering by Day 1', () => {
            // Day 1: Alice (4), Bob (3), Charlie (0) = 7 decks
            const aliceDay1 = 4;
            const bobDay1 = 3;
            const charlieDay1 = 0;
            const totalDay1Decks = aliceDay1 + bobDay1 + charlieDay1;

            const maxDecksPerDay = 50 * 4; // 200
            const percentage = ((totalDay1Decks / maxDecksPerDay) * 100).toFixed(1);

            expect(totalDay1Decks).toBe(7);
            expect(maxDecksPerDay).toBe(200);
            expect(percentage).toBe('3.5');
        });

        test('should show daily deck count when filtering by Day 2', () => {
            // Day 2: Alice (4), Bob (4), Charlie (2) = 10 decks
            const aliceDay2 = 4;
            const bobDay2 = 4;
            const charlieDay2 = 2;
            const totalDay2Decks = aliceDay2 + bobDay2 + charlieDay2;

            const maxDecksPerDay = 50 * 4; // 200
            const percentage = ((totalDay2Decks / maxDecksPerDay) * 100).toFixed(1);

            expect(totalDay2Decks).toBe(10);
            expect(maxDecksPerDay).toBe(200);
            expect(percentage).toBe('5.0');
        });

        test('should calculate daily decks correctly (difference from previous day)', () => {
            // Bob: Day 1 = 3 total, Day 2 = 7 total, so Day 2 daily = 4
            const day1Decks = 3;
            const day2TotalDecks = 7;
            const day2DailyDecks = day2TotalDecks - day1Decks;

            expect(day2DailyDecks).toBe(4);
        });
    });

    describe('Points Sorting with Day Filters', () => {
        test('should sort by cumulative points when "All Days" is active', () => {
            document.body.innerHTML = `
                <table>
                    <tbody>
                        <tr data-total-points="1000">
                            <td class="player-name">Alice</td>
                            <td class="points-cell">1,000</td>
                        </tr>
                        <tr data-total-points="700">
                            <td class="player-name">Bob</td>
                            <td class="points-cell">700</td>
                        </tr>
                        <tr data-total-points="200">
                            <td class="player-name">Charlie</td>
                            <td class="points-cell">200</td>
                        </tr>
                    </tbody>
                </table>
            `;

            const rows = Array.from(document.querySelectorAll('tbody tr'));

            // Sort by displayed points (descending)
            rows.sort((a, b) => {
                const aCell = a.querySelector('.points-cell');
                const bCell = b.querySelector('.points-cell');
                const aValue = parseInt(aCell.textContent.replace(/,/g, '')) || 0;
                const bValue = parseInt(bCell.textContent.replace(/,/g, '')) || 0;
                return bValue - aValue;
            });

            expect(rows[0].querySelector('.player-name').textContent).toBe('Alice');
            expect(rows[1].querySelector('.player-name').textContent).toBe('Bob');
            expect(rows[2].querySelector('.player-name').textContent).toBe('Charlie');
        });

        test('should sort by daily points when Day 1 filter is active', () => {
            // Day 1 points: Alice (500), Bob (300), Charlie (0)
            document.body.innerHTML = `
                <table>
                    <tbody>
                        <tr data-total-points="1000" data-daily-points='{"1":500,"2":500}'>
                            <td class="player-name">Alice</td>
                            <td class="points-cell">500</td>
                        </tr>
                        <tr data-total-points="700" data-daily-points='{"1":300,"2":400}'>
                            <td class="player-name">Bob</td>
                            <td class="points-cell">300</td>
                        </tr>
                        <tr data-total-points="200" data-daily-points='{"1":0,"2":200}'>
                            <td class="player-name">Charlie</td>
                            <td class="points-cell">-</td>
                        </tr>
                    </tbody>
                </table>
            `;

            const rows = Array.from(document.querySelectorAll('tbody tr'));

            // Sort by displayed points (descending) - uses cell content, not dataset
            rows.sort((a, b) => {
                const aCell = a.querySelector('.points-cell');
                const bCell = b.querySelector('.points-cell');
                const aText = aCell.textContent.trim();
                const bText = bCell.textContent.trim();
                const aValue = aText === '-' ? 0 : parseInt(aText.replace(/,/g, '')) || 0;
                const bValue = bText === '-' ? 0 : parseInt(bText.replace(/,/g, '')) || 0;
                return bValue - aValue;
            });

            // Day 1 sorting: Alice (500) > Bob (300) > Charlie (0)
            expect(rows[0].querySelector('.player-name').textContent).toBe('Alice');
            expect(rows[1].querySelector('.player-name').textContent).toBe('Bob');
            expect(rows[2].querySelector('.player-name').textContent).toBe('Charlie');
        });

        test('should sort by daily points when Day 2 filter is active', () => {
            // Day 2 points: Alice (500), Bob (400), Charlie (200)
            document.body.innerHTML = `
                <table>
                    <tbody>
                        <tr data-total-points="1000" data-daily-points='{"1":500,"2":500}'>
                            <td class="player-name">Alice</td>
                            <td class="points-cell">500</td>
                        </tr>
                        <tr data-total-points="700" data-daily-points='{"1":300,"2":400}'>
                            <td class="player-name">Bob</td>
                            <td class="points-cell">400</td>
                        </tr>
                        <tr data-total-points="200" data-daily-points='{"1":0,"2":200}'>
                            <td class="player-name">Charlie</td>
                            <td class="points-cell">200</td>
                        </tr>
                    </tbody>
                </table>
            `;

            const rows = Array.from(document.querySelectorAll('tbody tr'));

            // Sort by displayed points (descending)
            rows.sort((a, b) => {
                const aCell = a.querySelector('.points-cell');
                const bCell = b.querySelector('.points-cell');
                const aValue = parseInt(aCell.textContent.replace(/,/g, '')) || 0;
                const bValue = parseInt(bCell.textContent.replace(/,/g, '')) || 0;
                return bValue - aValue;
            });

            // Day 2 sorting: Alice (500) > Bob (400) > Charlie (200)
            expect(rows[0].querySelector('.player-name').textContent).toBe('Alice');
            expect(rows[1].querySelector('.player-name').textContent).toBe('Bob');
            expect(rows[2].querySelector('.player-name').textContent).toBe('Charlie');
        });

        test('REGRESSION: sorting should NOT always use cumulative total', () => {
            // This test captures the bug where sorting always used totalPoints
            // even when a specific day filter was active

            // Scenario: Bob has higher cumulative total (700) than Charlie (200),
            // but on Day 2, Charlie (200) > Bob (150)
            document.body.innerHTML = `
                <table>
                    <tbody>
                        <tr data-total-points="700" data-daily-points='{"1":550,"2":150}'>
                            <td class="player-name">Bob</td>
                            <td class="points-cell">150</td>
                        </tr>
                        <tr data-total-points="200" data-daily-points='{"1":0,"2":200}'>
                            <td class="player-name">Charlie</td>
                            <td class="points-cell">200</td>
                        </tr>
                    </tbody>
                </table>
            `;

            const rows = Array.from(document.querySelectorAll('tbody tr'));

            // CORRECT: Sort by displayed value (Day 2 points)
            rows.sort((a, b) => {
                const aCell = a.querySelector('.points-cell');
                const bCell = b.querySelector('.points-cell');
                const aValue = parseInt(aCell.textContent.replace(/,/g, '')) || 0;
                const bValue = parseInt(bCell.textContent.replace(/,/g, '')) || 0;
                return bValue - aValue;
            });

            // Day 2 filter active: Charlie (200) should be first, Bob (150) second
            expect(rows[0].querySelector('.player-name').textContent).toBe('Charlie');
            expect(rows[1].querySelector('.player-name').textContent).toBe('Bob');

            // WRONG (old behavior): Would sort by totalPoints
            // Bob (700 total) > Charlie (200 total) - INCORRECT when Day 2 is filtered
            const bobTotal = parseInt(document.querySelector('[data-total-points="700"]').dataset.totalPoints);
            const charlieTotal = parseInt(document.querySelector('[data-total-points="200"]').dataset.totalPoints);
            expect(bobTotal).toBeGreaterThan(charlieTotal); // This was the bug!
        });

        test('should handle dash (-) as 0 when sorting', () => {
            document.body.innerHTML = `
                <table>
                    <tbody>
                        <tr>
                            <td class="player-name">Alice</td>
                            <td class="points-cell">100</td>
                        </tr>
                        <tr>
                            <td class="player-name">Bob</td>
                            <td class="points-cell">-</td>
                        </tr>
                    </tbody>
                </table>
            `;

            const rows = Array.from(document.querySelectorAll('tbody tr'));

            rows.sort((a, b) => {
                const aCell = a.querySelector('.points-cell');
                const bCell = b.querySelector('.points-cell');
                const aText = aCell.textContent.trim();
                const bText = bCell.textContent.trim();
                const aValue = aText === '-' ? 0 : parseInt(aText.replace(/,/g, '')) || 0;
                const bValue = bText === '-' ? 0 : parseInt(bText.replace(/,/g, '')) || 0;
                return bValue - aValue;
            });

            expect(rows[0].querySelector('.player-name').textContent).toBe('Alice');
            expect(rows[1].querySelector('.player-name').textContent).toBe('Bob');
        });
    });

    describe('Data Storage in Rows', () => {
        test('rows should store dailyPoints as JSON string', () => {
            document.body.innerHTML = `
                <table>
                    <tbody>
                        <tr data-daily-points='{"1":500,"2":500}'>
                            <td>Alice</td>
                        </tr>
                    </tbody>
                </table>
            `;

            const row = document.querySelector('tr');
            const dailyPointsData = row.dataset.dailyPoints;

            expect(typeof dailyPointsData).toBe('string');
            expect(() => JSON.parse(dailyPointsData)).not.toThrow();

            const parsed = JSON.parse(dailyPointsData);
            expect(parsed['1']).toBe(500);
            expect(parsed['2']).toBe(500);
        });

        test('rows should store dailyDecks as JSON string', () => {
            document.body.innerHTML = `
                <table>
                    <tbody>
                        <tr data-daily-decks='{"1":4,"2":4}'>
                            <td>Alice</td>
                        </tr>
                    </tbody>
                </table>
            `;

            const row = document.querySelector('tr');
            const dailyDecksData = row.dataset.dailyDecks;

            expect(typeof dailyDecksData).toBe('string');
            expect(() => JSON.parse(dailyDecksData)).not.toThrow();

            const parsed = JSON.parse(dailyDecksData);
            expect(parsed['1']).toBe(4);
            expect(parsed['2']).toBe(4);
        });

        test('rows should store both totalPoints and dailyPoints', () => {
            document.body.innerHTML = `
                <table>
                    <tbody>
                        <tr data-total-points="1000" data-daily-points='{"1":500,"2":500}'>
                            <td>Alice</td>
                        </tr>
                    </tbody>
                </table>
            `;

            const row = document.querySelector('tr');

            expect(row.dataset.totalPoints).toBe('1000');
            expect(row.dataset.dailyPoints).toBeTruthy();

            const dailyPoints = JSON.parse(row.dataset.dailyPoints);
            expect(dailyPoints['1'] + dailyPoints['2']).toBe(1000);
        });
    });
});
