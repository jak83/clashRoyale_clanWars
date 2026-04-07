/**
 * Tests for "Hide Completed" filter behavior with day filters
 * The selected day should drive ALL behavior, including completion status
 */

describe('Hide Completed Filter - Day-Based Behavior', () => {
    // Helper to create mock row data
    function createMockRow(dailyDecks, totalDecks) {
        return {
            dataset: {
                dailyDecks: JSON.stringify(dailyDecks),
                totalDecks: totalDecks.toString()
            },
            classList: {
                classes: new Set(),
                add(className) { this.classes.add(className); },
                remove(className) { this.classes.delete(className); },
                contains(className) { return this.classes.has(className); }
            }
        };
    }

    // Simulate the completion status update logic from filterByDay
    function updateCompletionStatus(row, selectedDay) {
        const dailyDecksData = row.dataset.dailyDecks;
        if (!dailyDecksData) return;

        const dailyDecksMap = JSON.parse(dailyDecksData);
        let isCompleted = false;

        if (selectedDay === 'all') {
            // For "Show All", check if player completed ALL days
            const totalDecks = parseInt(row.dataset.totalDecks) || 0;
            const days = Object.keys(dailyDecksMap);
            const maxTotalDecks = days.length * 4;
            isCompleted = totalDecks >= maxTotalDecks;
        } else {
            // For specific day, check if player completed THAT day (4 decks)
            const dayDecks = dailyDecksMap[selectedDay] || 0;
            isCompleted = dayDecks >= 4;
        }

        // Update row class based on completion status
        if (isCompleted) {
            row.classList.add('history-row-completed');
        } else {
            row.classList.remove('history-row-completed');
        }

        return isCompleted;
    }

    describe('Positive Tests - Correct Completion Detection', () => {
        test('Day 1 filter: Player with 4/4 on Day 1 should be marked completed', () => {
            const row = createMockRow({ '1': 4, '2': 4, '3': 4 }, 12);
            const isCompleted = updateCompletionStatus(row, '1');

            expect(isCompleted).toBe(true);
            expect(row.classList.contains('history-row-completed')).toBe(true);
        });

        test('Day 2 filter: Player with 4/4 on Day 2 should be marked completed', () => {
            const row = createMockRow({ '1': 3, '2': 4, '3': 4 }, 11);
            const isCompleted = updateCompletionStatus(row, '2');

            expect(isCompleted).toBe(true);
            expect(row.classList.contains('history-row-completed')).toBe(true);
        });

        test('Day 3 filter: Player with 4/4 on Day 3 should be marked completed', () => {
            const row = createMockRow({ '1': 4, '2': 3, '3': 4 }, 11);
            const isCompleted = updateCompletionStatus(row, '3');

            expect(isCompleted).toBe(true);
            expect(row.classList.contains('history-row-completed')).toBe(true);
        });

        test('Show All: Player with 4/4 on all days should be marked completed', () => {
            const row = createMockRow({ '1': 4, '2': 4, '3': 4 }, 12);
            const isCompleted = updateCompletionStatus(row, 'all');

            expect(isCompleted).toBe(true);
            expect(row.classList.contains('history-row-completed')).toBe(true);
        });
    });

    describe('Negative Tests - Incorrect Completion Should NOT Be Detected', () => {
        test('NEGATIVE: Day 1 filter should NOT mark player completed if they have 3/4 on Day 1', () => {
            const row = createMockRow({ '1': 3, '2': 4, '3': 4 }, 11);
            const isCompleted = updateCompletionStatus(row, '1');

            expect(isCompleted).toBe(false);
            expect(row.classList.contains('history-row-completed')).toBe(false);
        });

        test('NEGATIVE: Day 1 filter should NOT mark player completed if they have 4/4 on Day 2 but not Day 1', () => {
            const row = createMockRow({ '1': 2, '2': 4, '3': 4 }, 10);
            const isCompleted = updateCompletionStatus(row, '1');

            expect(isCompleted).toBe(false);
            expect(row.classList.contains('history-row-completed')).toBe(false);
        });

        test('NEGATIVE: Day 2 filter should NOT mark player completed if they have 0/4 on Day 2', () => {
            const row = createMockRow({ '1': 4, '2': 0, '3': 4 }, 8);
            const isCompleted = updateCompletionStatus(row, '2');

            expect(isCompleted).toBe(false);
            expect(row.classList.contains('history-row-completed')).toBe(false);
        });

        test('NEGATIVE: Show All should NOT mark player completed if they missed any day', () => {
            const row = createMockRow({ '1': 4, '2': 3, '3': 4 }, 11); // Missed 1 deck on Day 2
            const isCompleted = updateCompletionStatus(row, 'all');

            expect(isCompleted).toBe(false);
            expect(row.classList.contains('history-row-completed')).toBe(false);
        });

        test('NEGATIVE: Show All should NOT mark player completed if total < maxTotal', () => {
            const row = createMockRow({ '1': 4, '2': 4, '3': 3 }, 11); // 11 < 12
            const isCompleted = updateCompletionStatus(row, 'all');

            expect(isCompleted).toBe(false);
            expect(row.classList.contains('history-row-completed')).toBe(false);
        });
    });

    describe('Day Filter Changes - Completion Status Should Update', () => {
        test('Player completed Day 1 but not Day 2: Status changes when switching filters', () => {
            const row = createMockRow({ '1': 4, '2': 2, '3': 4 }, 10);

            // Switch to Day 1 - should be completed
            let isCompleted = updateCompletionStatus(row, '1');
            expect(isCompleted).toBe(true);
            expect(row.classList.contains('history-row-completed')).toBe(true);

            // Switch to Day 2 - should NOT be completed
            isCompleted = updateCompletionStatus(row, '2');
            expect(isCompleted).toBe(false);
            expect(row.classList.contains('history-row-completed')).toBe(false);

            // Switch to Day 3 - should be completed again
            isCompleted = updateCompletionStatus(row, '3');
            expect(isCompleted).toBe(true);
            expect(row.classList.contains('history-row-completed')).toBe(true);
        });

        test('Player completed all individual days but Show All shows different status', () => {
            const row = createMockRow({ '1': 4, '2': 4, '3': 4 }, 12);

            // Each individual day should show completed
            expect(updateCompletionStatus(row, '1')).toBe(true);
            expect(updateCompletionStatus(row, '2')).toBe(true);
            expect(updateCompletionStatus(row, '3')).toBe(true);

            // Show All should also show completed (perfect player)
            expect(updateCompletionStatus(row, 'all')).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        test('EDGE: Player with 0 decks on all days should never be completed', () => {
            const row = createMockRow({ '1': 0, '2': 0, '3': 0 }, 0);

            expect(updateCompletionStatus(row, '1')).toBe(false);
            expect(updateCompletionStatus(row, '2')).toBe(false);
            expect(updateCompletionStatus(row, '3')).toBe(false);
            expect(updateCompletionStatus(row, 'all')).toBe(false);
        });

        test('EDGE: Player with exactly 4 decks should be completed', () => {
            const row = createMockRow({ '1': 4 }, 4);
            expect(updateCompletionStatus(row, '1')).toBe(true);
        });

        test('EDGE: Player with more than 4 decks on a day should still be completed', () => {
            // This shouldn't happen in practice, but test boundary
            const row = createMockRow({ '1': 5, '2': 4, '3': 4 }, 13);
            expect(updateCompletionStatus(row, '1')).toBe(true); // >= 4 is completed
        });

        test('EDGE: Missing day data should treat as 0 decks (incomplete)', () => {
            const row = createMockRow({ '1': 4, '3': 4 }, 8); // Day 2 missing
            expect(updateCompletionStatus(row, '2')).toBe(false); // Missing = 0 decks
        });

        test('EDGE: Player joined mid-war (Day 2), should not affect Day 1 completion check', () => {
            const row = createMockRow({ '2': 4, '3': 4 }, 8); // Joined on Day 2

            // Day 1 check - player wasn't there, so 0 decks = incomplete
            expect(updateCompletionStatus(row, '1')).toBe(false);

            // Day 2 check - player completed
            expect(updateCompletionStatus(row, '2')).toBe(true);

            // Show All - player completed all days THEY participated in (Days 2 & 3)
            // This is CORRECT: totalDecks (8) >= maxTotalDecks (2 days * 4 = 8)
            expect(updateCompletionStatus(row, 'all')).toBe(true);
        });
    });

    describe('Real-World Scenarios', () => {
        test('SCENARIO: Inconsistent player - completed some days, missed others', () => {
            const row = createMockRow({ '1': 4, '2': 2, '3': 4, '4': 1 }, 11);

            // Days they completed
            expect(updateCompletionStatus(row, '1')).toBe(true);
            expect(updateCompletionStatus(row, '3')).toBe(true);

            // Days they missed
            expect(updateCompletionStatus(row, '2')).toBe(false);
            expect(updateCompletionStatus(row, '4')).toBe(false);

            // Overall - not perfect
            expect(updateCompletionStatus(row, 'all')).toBe(false);
        });

        test('SCENARIO: Almost perfect player (15/16 decks)', () => {
            const row = createMockRow({ '1': 4, '2': 4, '3': 4, '4': 3 }, 15);

            // First 3 days completed
            expect(updateCompletionStatus(row, '1')).toBe(true);
            expect(updateCompletionStatus(row, '2')).toBe(true);
            expect(updateCompletionStatus(row, '3')).toBe(true);

            // Day 4 incomplete
            expect(updateCompletionStatus(row, '4')).toBe(false);

            // Show All - not perfect due to Day 4
            expect(updateCompletionStatus(row, 'all')).toBe(false);
        });

        test('SCENARIO: Perfect player (16/16 decks)', () => {
            const row = createMockRow({ '1': 4, '2': 4, '3': 4, '4': 4 }, 16);

            // All days completed
            expect(updateCompletionStatus(row, '1')).toBe(true);
            expect(updateCompletionStatus(row, '2')).toBe(true);
            expect(updateCompletionStatus(row, '3')).toBe(true);
            expect(updateCompletionStatus(row, '4')).toBe(true);

            // Show All - perfect
            expect(updateCompletionStatus(row, 'all')).toBe(true);
        });
    });

    describe('Regression Tests - Bug Prevention', () => {
        test('REGRESSION: Day filter should NOT use "all days" completion status', () => {
            // Bug: Day 1 filter incorrectly checking if player completed ALL days
            const row = createMockRow({ '1': 4, '2': 0, '3': 0 }, 4);

            // Day 1 should show completed (4/4 on Day 1)
            expect(updateCompletionStatus(row, '1')).toBe(true);

            // Show All should show incomplete (only 4/16 total)
            expect(updateCompletionStatus(row, 'all')).toBe(false);
        });

        test('REGRESSION: Switching filters should update completion class', () => {
            // Bug: Completion status from previous filter persists
            const row = createMockRow({ '1': 4, '2': 2 }, 6);

            // Start with Day 1 - completed
            updateCompletionStatus(row, '1');
            expect(row.classList.contains('history-row-completed')).toBe(true);

            // Switch to Day 2 - should remove completed class
            updateCompletionStatus(row, '2');
            expect(row.classList.contains('history-row-completed')).toBe(false);
        });

        test('REGRESSION: Show All should require ALL days complete, not just some', () => {
            // Bug: Show All marking player completed if ANY day is 4/4
            const row = createMockRow({ '1': 4, '2': 3, '3': 3 }, 10);

            // Even though Day 1 is 4/4, Show All should be incomplete (10 < 12)
            expect(updateCompletionStatus(row, 'all')).toBe(false);
        });
    });
});
