const historyManager = require('../historyManager');

describe('Player Join/Leave Edge Cases', () => {
  describe('Player leaves during war', () => {
    test('should save Day 1 data for player who later leaves', () => {
      const day1Data = {
        seasonId: 123,
        sectionIndex: 1,
        periodIndex: 3, // Day 1 (Thursday)
        periodType: 'warDay',
        clan: {
          participants: [
            { tag: '#BOB', name: 'Bob', decksUsed: 4, fame: 400 },
            { tag: '#ALICE', name: 'Alice', decksUsed: 4, fame: 400 }
          ]
        }
      };

      const history = historyManager.updateHistory(day1Data, null, false);

      expect(history.days[1].players['#BOB']).toBeDefined();
      expect(history.days[1].players['#BOB'].decksUsed).toBe(4);
    });

    test('should not include departed player in Day 2 snapshot', () => {
      const existingHistory = {
        seasonId: 123,
        sectionIndex: 1,
        days: {
          '1': {
            timestamp: '2026-02-12T10:00:00.000Z',
            players: {
              '#BOB': { name: 'Bob', decksUsed: 4, fame: 400 },
              '#ALICE': { name: 'Alice', decksUsed: 4, fame: 400 }
            }
          }
        }
      };

      const day2Data = {
        seasonId: 123,
        sectionIndex: 1,
        periodIndex: 4, // Day 2 (Friday)
        periodType: 'warDay',
        clan: {
          participants: [
            // Bob left, only Alice remains
            { tag: '#ALICE', name: 'Alice', decksUsed: 8, fame: 800 }
          ]
        }
      };

      const history = historyManager.updateHistory(day2Data, existingHistory, false);

      // Day 1 should still have Bob
      expect(history.days[1].players['#BOB']).toBeDefined();

      // Day 2 should NOT have Bob (he left)
      expect(history.days[2].players['#BOB']).toBeUndefined();

      // Day 2 should have Alice
      expect(history.days[2].players['#ALICE']).toBeDefined();
      expect(history.days[2].players['#ALICE'].decksUsed).toBe(8);
    });
  });

  describe('Player joins during war', () => {
    test('should not include new player in Day 1 snapshot', () => {
      const day1Data = {
        seasonId: 123,
        sectionIndex: 1,
        periodIndex: 3, // Day 1
        periodType: 'warDay',
        clan: {
          participants: [
            { tag: '#ALICE', name: 'Alice', decksUsed: 4, fame: 400 }
          ]
        }
      };

      const history = historyManager.updateHistory(day1Data, null, false);

      expect(history.days[1].players['#CHARLIE']).toBeUndefined();
    });

    test('should include new player starting from Day 2', () => {
      const existingHistory = {
        seasonId: 123,
        sectionIndex: 1,
        days: {
          '1': {
            timestamp: '2026-02-12T10:00:00.000Z',
            players: {
              '#ALICE': { name: 'Alice', decksUsed: 4, fame: 400 }
            }
          }
        }
      };

      const day2Data = {
        seasonId: 123,
        sectionIndex: 1,
        periodIndex: 4, // Day 2
        periodType: 'warDay',
        clan: {
          participants: [
            { tag: '#ALICE', name: 'Alice', decksUsed: 8, fame: 800 },
            { tag: '#CHARLIE', name: 'Charlie', decksUsed: 2, fame: 200 } // New player
          ]
        }
      };

      const history = historyManager.updateHistory(day2Data, existingHistory, false);

      // Day 1 should not have Charlie
      expect(history.days[1].players['#CHARLIE']).toBeUndefined();

      // Day 2 should have Charlie
      expect(history.days[2].players['#CHARLIE']).toBeDefined();
      expect(history.days[2].players['#CHARLIE'].decksUsed).toBe(2);
    });

    test('new player total decks should reflect only their participation', () => {
      const existingHistory = {
        seasonId: 123,
        sectionIndex: 1,
        days: {
          '1': {
            timestamp: '2026-02-12T10:00:00.000Z',
            players: {
              '#ALICE': { name: 'Alice', decksUsed: 4, fame: 400 }
            }
          }
        }
      };

      const day2Data = {
        seasonId: 123,
        sectionIndex: 1,
        periodIndex: 4, // Day 2
        periodType: 'warDay',
        clan: {
          participants: [
            { tag: '#ALICE', name: 'Alice', decksUsed: 8, fame: 800 },
            { tag: '#CHARLIE', name: 'Charlie', decksUsed: 3, fame: 300 }
          ]
        }
      };

      const history = historyManager.updateHistory(day2Data, existingHistory, false);

      // Charlie's decksUsed should be 3 (not cumulative with anything)
      expect(history.days[2].players['#CHARLIE'].decksUsed).toBe(3);

      // Frontend should calculate daily decks as: 3 - 0 = 3 (since no Day 1 data)
      const day1Charlie = history.days[1]?.players?.['#CHARLIE'];
      const day2Charlie = history.days[2].players['#CHARLIE'];

      const prevDecks = day1Charlie ? day1Charlie.decksUsed : 0;
      const currDecks = day2Charlie.decksUsed;
      const dailyDecks = currDecks - prevDecks;

      expect(dailyDecks).toBe(3);
    });
  });

  describe('Player leaves and rejoins', () => {
    test('should handle player who leaves and rejoins', () => {
      let history = {
        seasonId: 123,
        sectionIndex: 1,
        days: {
          '1': {
            timestamp: '2026-02-12T10:00:00.000Z',
            players: {
              '#BOB': { name: 'Bob', decksUsed: 4, fame: 400 },
              '#ALICE': { name: 'Alice', decksUsed: 4, fame: 400 }
            }
          }
        }
      };

      // Day 2: Bob leaves
      const day2Data = {
        seasonId: 123,
        sectionIndex: 1,
        periodIndex: 4,
        periodType: 'warDay',
        clan: {
          participants: [
            { tag: '#ALICE', name: 'Alice', decksUsed: 8, fame: 800 }
          ]
        }
      };

      history = historyManager.updateHistory(day2Data, history, false);
      expect(history.days[2].players['#BOB']).toBeUndefined();

      // Day 3: Bob rejoins with fresh deck count
      const day3Data = {
        seasonId: 123,
        sectionIndex: 1,
        periodIndex: 5,
        periodType: 'warDay',
        clan: {
          participants: [
            { tag: '#ALICE', name: 'Alice', decksUsed: 12, fame: 1200 },
            { tag: '#BOB', name: 'Bob', decksUsed: 2, fame: 200 } // Rejoined
          ]
        }
      };

      history = historyManager.updateHistory(day3Data, history, false);

      expect(history.days[1].players['#BOB'].decksUsed).toBe(4);
      expect(history.days[2].players['#BOB']).toBeUndefined();
      expect(history.days[3].players['#BOB']).toBeDefined();
      expect(history.days[3].players['#BOB'].decksUsed).toBe(2);
    });
  });

  describe('Daily deck calculation edge cases', () => {
    test('daily decks should be 0 when player not in snapshot', () => {
      // Simulating frontend logic
      const history = {
        days: {
          '1': {
            players: {
              '#BOB': { name: 'Bob', decksUsed: 4, fame: 400 }
            }
          },
          '2': {
            players: {
              // Bob not here (left clan)
            }
          }
        }
      };

      const day1Bob = history.days['1'].players['#BOB'];
      const day2Bob = history.days['2'].players?.['#BOB'];

      const prevDecks = day1Bob ? day1Bob.decksUsed : 0;
      const currDecks = day2Bob ? day2Bob.decksUsed : 0;
      let dailyDecks = currDecks - prevDecks;
      if (dailyDecks < 0) dailyDecks = 0;

      expect(dailyDecks).toBe(0); // Should be 0, not negative
    });

    test('daily decks should handle negative calculation correctly', () => {
      // Edge case: decksUsed goes DOWN (shouldn't happen, but test the clamp)
      const prevDecks = 4;
      const currDecks = 2; // Somehow decreased

      let dailyDecks = currDecks - prevDecks;
      if (dailyDecks < 0) dailyDecks = 0;

      expect(dailyDecks).toBe(0);
    });
  });

  describe('Player left detection', () => {
    test('should detect player who left by checking last day', () => {
      const history = {
        days: {
          '1': {
            players: {
              '#ALICE': { name: 'Alice', decksUsed: 4, fame: 400 },
              '#BOB': { name: 'Bob', decksUsed: 4, fame: 400 }
            }
          },
          '2': {
            players: {
              '#ALICE': { name: 'Alice', decksUsed: 8, fame: 800 }
              // Bob left
            }
          }
        }
      };

      const days = ['1', '2'];
      const lastDay = days[days.length - 1];
      const lastDayPlayers = history.days[lastDay].players;

      // Bob should be detected as left
      const bobHasLeft = !lastDayPlayers['#BOB'];
      expect(bobHasLeft).toBe(true);

      // Alice should NOT be detected as left
      const aliceHasLeft = !lastDayPlayers['#ALICE'];
      expect(aliceHasLeft).toBe(false);
    });
  });

  describe('All players collection edge case', () => {
    test('should collect players from all days including joiners and leavers', () => {
      const history = {
        days: {
          '1': {
            players: {
              '#ALICE': { name: 'Alice', decksUsed: 4, fame: 400 },
              '#BOB': { name: 'Bob', decksUsed: 4, fame: 400 }
            }
          },
          '2': {
            players: {
              '#ALICE': { name: 'Alice', decksUsed: 8, fame: 800 },
              '#CHARLIE': { name: 'Charlie', decksUsed: 3, fame: 300 }
              // Bob left
            }
          },
          '3': {
            players: {
              '#ALICE': { name: 'Alice', decksUsed: 12, fame: 1200 },
              '#CHARLIE': { name: 'Charlie', decksUsed: 7, fame: 700 },
              '#DAVID': { name: 'David', decksUsed: 1, fame: 100 }
            }
          }
        }
      };

      // Simulate frontend's allTags collection
      const allTags = new Set();
      Object.keys(history.days).forEach(day => {
        const dayObj = history.days[day];
        if (dayObj.players) {
          Object.keys(dayObj.players).forEach(tag => allTags.add(tag));
        }
      });

      expect(allTags.size).toBe(4); // Alice, Bob, Charlie, David
      expect(allTags.has('#ALICE')).toBe(true);
      expect(allTags.has('#BOB')).toBe(true);
      expect(allTags.has('#CHARLIE')).toBe(true);
      expect(allTags.has('#DAVID')).toBe(true);
    });
  });
});
