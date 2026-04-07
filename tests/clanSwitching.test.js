/**
 * Regression tests for clan-switching data isolation.
 *
 * Bug: switching to a clan with no history left stale day-filter buttons in the
 * DOM (they live outside history-container). Clicking any of them triggered
 * filterByDay(), which re-inserted the OLD clan's table via its closure
 * reference — showing the previous clan's data under the newly-selected clan.
 *
 * Fix contract: whenever history has no days (or is partial), day-filter
 * buttons MUST NOT exist. The logic that decides this is extracted as
 * shouldShowDayFilters() so it can be tested independently of the DOM.
 */

/**
 * Pure function extracted from fetchHistory / renderHistory.
 * Mirrors the logic used to decide whether to render day-filter buttons.
 * If this returns false, fetchHistory must clear the day-filter-buttons
 * container so stale buttons from a previous clan cannot re-insert old data.
 */
function shouldShowDayFilters(history) {
    if (!history || !history.days) return false;
    if (history.partial) return false;
    return Object.keys(history.days).length > 0;
}

describe('Clan switching — day filter isolation', () => {
    describe('shouldShowDayFilters()', () => {
        it('returns false for null history', () => {
            expect(shouldShowDayFilters(null)).toBe(false);
        });

        it('returns false for undefined history', () => {
            expect(shouldShowDayFilters(undefined)).toBe(false);
        });

        it('returns false when days is empty — new clan with no war data', () => {
            expect(shouldShowDayFilters({ seasonId: null, sectionIndex: null, days: {} })).toBe(false);
        });

        it('returns false for partial history — clan added mid-war', () => {
            const partialHistory = {
                partial: true,
                seasonId: 130,
                sectionIndex: 4,
                days: { '4': { timestamp: '2026-04-06T09:59:33Z', players: {} } }
            };
            expect(shouldShowDayFilters(partialHistory)).toBe(false);
        });

        it('returns true when history has days — normal case', () => {
            const fullHistory = {
                seasonId: 130,
                sectionIndex: 4,
                days: {
                    '1': { players: { '#TAG1': { decksUsed: 4 } } },
                    '2': { players: { '#TAG1': { decksUsed: 8 } } }
                }
            };
            expect(shouldShowDayFilters(fullHistory)).toBe(true);
        });

        it('returns true even for a single war day', () => {
            const oneDayHistory = {
                days: { '1': { players: { '#TAG1': { decksUsed: 4 } } } }
            };
            expect(shouldShowDayFilters(oneDayHistory)).toBe(true);
        });
    });

    describe('Regression: empty history must not show day filters', () => {
        it('clan added this war but no data yet — no filters', () => {
            // This is exactly the state of "aktiivi suomi 3" when first added
            const newClanHistory = { seasonId: null, sectionIndex: null, days: {} };
            expect(shouldShowDayFilters(newClanHistory)).toBe(false);
        });

        it('switching away from a clan with history should not leave usable filters', () => {
            // The previous clan had data — the NEW clan does not
            const previousClanHistory = { days: { '1': {}, '2': {}, '3': {}, '4': {} } };
            const newClanHistory = { days: {} };

            expect(shouldShowDayFilters(previousClanHistory)).toBe(true);  // had filters
            expect(shouldShowDayFilters(newClanHistory)).toBe(false);      // must clear them
        });
    });
});
