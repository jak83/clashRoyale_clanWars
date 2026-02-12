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
            { tag: '#TEST1', name: 'Player1', decksUsed: 0, fame: 0 }
          ]
        }
      };

      const history = historyManager.updateHistory(mockRaceData, null, false);

      expect(history.days[1]).toBeDefined();
      expect(history.days[1].players['#TEST1']).toEqual({
        name: 'Player1',
        decksUsed: 0,
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
            { tag: '#TEST1', name: 'Player1', decksUsed: 2, fame: 200 }
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
            { tag: '#TEST1', name: 'Player1', decksUsed: 3, fame: 300 }
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
            { tag: '#TEST1', name: 'Player1', decksUsed: 4, fame: 400 }
          ]
        }
      };

      const history = historyManager.updateHistory(mockRaceData, null, false);

      expect(history.days[4]).toBeDefined();
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
            { tag: '#TEST1', name: 'Player1', decksUsed: 0, fame: 0 }
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
              '#TEST1': { name: 'Player1', decksUsed: 2, fame: 200 }
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
            { tag: '#TEST1', name: 'Player1', decksUsed: 4, fame: 400 }
          ]
        }
      };

      const history = historyManager.updateHistory(mockRaceData, existingHistory, false);

      expect(history.days[1]).toBeDefined();
      expect(history.days[2]).toBeDefined();
      expect(Object.keys(history.days).length).toBe(2);
    });
  });
});
