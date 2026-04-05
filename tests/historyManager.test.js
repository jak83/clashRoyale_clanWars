const historyManager = require('../historyManager');

describe('historyManager', () => {
  describe('updateHistory', () => {
    test('should calculate war day correctly for Day 1 (Thursday)', () => {
      const mockRaceData = {
        seasonId: 123,
        sectionIndex: 1,
        periodIndex: 3, // Thursday (3 % 7 = 3, 3 - 2 = 1)
        periodType: 'warDay',
        clan: {
          participants: [
            { tag: '#TEST1', name: 'Player1', decksUsed: 0, decksUsedToday: 0, fame: 0 }
          ]
        }
      };

      const history = historyManager.updateHistory(mockRaceData, null, false);

      expect(history.days[1]).toBeDefined();
      expect(history.days[1].players['#TEST1']).toEqual({
        name: 'Player1',
        decksUsed: 0,
        decksUsedToday: 0,
        fame: 0
      });
    });

    test('should calculate war day correctly for Day 2 (Friday)', () => {
      const mockRaceData = {
        seasonId: 123,
        sectionIndex: 1,
        periodIndex: 4, // Friday (4 % 7 = 4, 4 - 2 = 2)
        periodType: 'warDay',
        clan: {
          participants: [
            { tag: '#TEST1', name: 'Player1', decksUsed: 2, decksUsedToday: 2, fame: 200 }
          ]
        }
      };

      const history = historyManager.updateHistory(mockRaceData, null, false);

      expect(history.days[2]).toBeDefined();
    });

    test('should calculate war day correctly for Day 3 (Saturday)', () => {
      const mockRaceData = {
        seasonId: 123,
        sectionIndex: 1,
        periodIndex: 5, // Saturday (5 % 7 = 5, 5 - 2 = 3)
        periodType: 'warDay',
        clan: {
          participants: [
            { tag: '#TEST1', name: 'Player1', decksUsed: 3, decksUsedToday: 1, fame: 300 }
          ]
        }
      };

      const history = historyManager.updateHistory(mockRaceData, null, false);

      expect(history.days[3]).toBeDefined();
    });

    test('should calculate war day correctly for Day 4 (Sunday)', () => {
      const mockRaceData = {
        seasonId: 123,
        sectionIndex: 1,
        periodIndex: 6, // Sunday (6 % 7 = 6, 6 - 2 = 4)
        periodType: 'warDay',
        clan: {
          participants: [
            { tag: '#TEST1', name: 'Player1', decksUsed: 4, decksUsedToday: 0, fame: 400 }
          ]
        }
      };

      const history = historyManager.updateHistory(mockRaceData, null, false);

      expect(history.days[4]).toBeDefined();
    });

    test('should record history during colosseum week (periodType colosseum)', () => {
      const mockRaceData = {
        seasonId: 123,
        sectionIndex: 5,
        periodIndex: 31, // Colosseum Day 1 (31 % 7 = 3, 3 - 2 = 1)
        periodType: 'colosseum',
        clan: {
          participants: [
            { tag: '#TEST1', name: 'Player1', decksUsed: 2, decksUsedToday: 2, fame: 500 }
          ]
        }
      };

      const history = historyManager.updateHistory(mockRaceData, null, false);

      expect(history.days[1]).toBeDefined();
      expect(history.days[1].players['#TEST1'].decksUsedToday).toBe(2);
    });

    test('should map colosseum periodIndex to correct war days (31-34 → days 1-4)', () => {
      const days = [
        { periodIndex: 31, expectedDay: 1 },
        { periodIndex: 32, expectedDay: 2 },
        { periodIndex: 33, expectedDay: 3 },
        { periodIndex: 34, expectedDay: 4 },
      ];

      days.forEach(({ periodIndex, expectedDay }) => {
        const mockRaceData = {
          seasonId: 123,
          sectionIndex: 5,
          periodIndex,
          periodType: 'colosseum',
          clan: { participants: [{ tag: '#T', name: 'P', decksUsed: 0, decksUsedToday: 0, fame: 0 }] }
        };
        const history = historyManager.updateHistory(mockRaceData, null, false);
        expect(history.days[expectedDay]).toBeDefined();
      });
    });

    test('should not save data during training days', () => {
      const emptyHistory = {
        seasonId: null,
        sectionIndex: null,
        days: {}
      };

      const mockRaceData = {
        seasonId: 123,
        sectionIndex: 1,
        periodIndex: 0, // Monday - training day
        periodType: 'training',
        clan: {
          participants: [
            { tag: '#TEST1', name: 'Player1', decksUsed: 0, decksUsedToday: 0, fame: 0 }
          ]
        }
      };

      const history = historyManager.updateHistory(mockRaceData, emptyHistory, false);

      expect(Object.keys(history.days).length).toBe(0);
    });

    test('should preserve existing days when adding new day', () => {
      const existingHistory = {
        seasonId: 123,
        sectionIndex: 1,
        days: {
          '1': {
            timestamp: '2026-02-12T10:00:00.000Z',
            players: {
              '#TEST1': { name: 'Player1', decksUsed: 2, decksUsedToday: 2, fame: 200 }
            }
          }
        }
      };

      const mockRaceData = {
        seasonId: 123,
        sectionIndex: 1,
        periodIndex: 4, // Day 2
        periodType: 'warDay',
        clan: {
          participants: [
            { tag: '#TEST1', name: 'Player1', decksUsed: 4, decksUsedToday: 2, fame: 400 }
          ]
        }
      };

      const history = historyManager.updateHistory(mockRaceData, existingHistory, false);

      expect(history.days[1]).toBeDefined();
      expect(history.days[2]).toBeDefined();
      expect(Object.keys(history.days).length).toBe(2);
    });
  });

  describe('clanId parameter', () => {
    const makeRaceData = (sectionIndex = 1, periodIndex = 3) => ({
      seasonId: 1,
      sectionIndex,
      periodIndex,
      periodType: 'warDay',
      clan: {
        participants: [
          { tag: '#P1', name: 'Player1', decksUsed: 2, decksUsedToday: 2, fame: 200 }
        ]
      }
    });

    test('clanId does not affect returned data shape', () => {
      const histA = historyManager.updateHistory(makeRaceData(), null, false, 'clan-a');
      const histB = historyManager.updateHistory(makeRaceData(), null, false, 'clan-b');

      expect(histA.days[1].players['#P1'].decksUsed).toBe(2);
      expect(histB.days[1].players['#P1'].decksUsed).toBe(2);
    });

    test('two clans with different base histories remain independent', () => {
      const baseA = { seasonId: 1, sectionIndex: 1, days: { 1: { timestamp: 't', players: { '#A': { name: 'Alpha', decksUsed: 4, decksUsedToday: 4, fame: 400 } } } } };
      const baseB = { seasonId: 1, sectionIndex: 1, days: {} };

      const histA = historyManager.updateHistory(makeRaceData(1, 4), baseA, false, 'clan-a');
      const histB = historyManager.updateHistory(makeRaceData(1, 4), baseB, false, 'clan-b');

      // clan-a has day 1 data carried over; clan-b does not
      expect(histA.days[1]).toBeDefined();
      expect(histB.days[1]).toBeUndefined();
    });

    test('omitting clanId defaults to "default" behaviour (same result as explicit default)', () => {
      const raceData = makeRaceData();
      const withDefault = historyManager.updateHistory(raceData, null, false, 'default');
      const withOmitted = historyManager.updateHistory(raceData, null, false);

      expect(withDefault.days[1].players['#P1']).toEqual(withOmitted.days[1].players['#P1']);
    });

    test('new week detection works per-clan independently', () => {
      // clan-a has old sectionIndex in its history
      const oldHistory = { seasonId: 1, sectionIndex: 5, days: { 1: { timestamp: 't', players: {} } } };
      // New race data has sectionIndex 6 — should trigger archive+reset
      // With save=false, archiving is skipped but history still resets
      const newRace = { ...makeRaceData(6, 3), sectionIndex: 6 };

      const result = historyManager.updateHistory(newRace, oldHistory, false, 'clan-a');

      // After week reset, old days are gone and new sectionIndex is set
      expect(result.sectionIndex).toBe(6);
      expect(Object.keys(result.days).length).toBeLessThanOrEqual(1); // only new day 1
    });
  });
});
