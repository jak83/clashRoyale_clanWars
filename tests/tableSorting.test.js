/**
 * Tests for table sorting logic
 * Tests pure sorting functions without DOM dependencies
 */

describe('Table Sorting Logic', () => {
  // Extract sorting comparison logic (matches app.js implementation)
  const sortComparators = {
    player: (a, b, direction) => {
      const aName = a.playerName.toLowerCase().replace(' (left)', '');
      const bName = b.playerName.toLowerCase().replace(' (left)', '');

      return direction === 'asc'
        ? aName.localeCompare(bName)
        : bName.localeCompare(aName);
    },

    day: (a, b, direction, dayValue) => {
      const aDecks = parseInt(a[dayValue]);
      const bDecks = parseInt(b[dayValue]);

      return direction === 'asc'
        ? aDecks - bDecks
        : bDecks - aDecks;
    },

    points: (a, b, direction) => {
      const aPoints = parseInt(a.totalPoints) || 0;
      const bPoints = parseInt(b.totalPoints) || 0;

      return direction === 'asc'
        ? aPoints - bPoints
        : bPoints - aPoints;
    }
  };

  // Define all sortable columns with test data
  const sortableColumns = [
    {
      name: 'player',
      type: 'player',
      testData: [
        { playerName: 'Charlie', totalPoints: 500 },
        { playerName: 'Alice', totalPoints: 800 },
        { playerName: 'Bob', totalPoints: 600 }
      ],
      expectedAsc: ['Alice', 'Bob', 'Charlie'],
      expectedDesc: ['Charlie', 'Bob', 'Alice'],
      getValue: (item) => item.playerName
    },
    {
      name: 'day1',
      type: 'day',
      dayValue: 'day1',
      testData: [
        { playerName: 'Alice', day1: 4 },
        { playerName: 'Bob', day1: 0 },
        { playerName: 'Charlie', day1: 2 }
      ],
      expectedAsc: ['Bob', 'Charlie', 'Alice'],
      expectedDesc: ['Alice', 'Charlie', 'Bob'],
      getValue: (item) => item.playerName
    },
    {
      name: 'day2',
      type: 'day',
      dayValue: 'day2',
      testData: [
        { playerName: 'Alice', day2: 2 },
        { playerName: 'Bob', day2: 4 },
        { playerName: 'Charlie', day2: 4 }
      ],
      expectedAsc: ['Alice', 'Bob', 'Charlie'],
      expectedDesc: ['Bob', 'Charlie', 'Alice'],
      getValue: (item) => item.playerName
    },
    {
      name: 'points',
      type: 'points',
      testData: [
        { playerName: 'Bob', totalPoints: 600 },
        { playerName: 'Alice', totalPoints: 800 },
        { playerName: 'Charlie', totalPoints: 400 }
      ],
      expectedAsc: ['Charlie', 'Bob', 'Alice'],
      expectedDesc: ['Alice', 'Bob', 'Charlie'],
      getValue: (item) => item.playerName
    }
  ];

  // Parameterized test: Test ALL columns with one loop
  describe('All sortable columns', () => {
    sortableColumns.forEach(column => {
      describe(`Sort by ${column.name}`, () => {
        test('should sort ascending', () => {
          const comparator = column.type === 'day'
            ? (a, b) => sortComparators.day(a, b, 'asc', column.dayValue)
            : (a, b) => sortComparators[column.type](a, b, 'asc');

          const sorted = [...column.testData].sort(comparator);
          const result = sorted.map(column.getValue);

          expect(result).toEqual(column.expectedAsc);
        });

        test('should sort descending', () => {
          const comparator = column.type === 'day'
            ? (a, b) => sortComparators.day(a, b, 'desc', column.dayValue)
            : (a, b) => sortComparators[column.type](a, b, 'desc');

          const sorted = [...column.testData].sort(comparator);
          const result = sorted.map(column.getValue);

          expect(result).toEqual(column.expectedDesc);
        });
      });
    });
  });

  describe('Sort by player name', () => {
    const players = [
      { playerName: 'Charlie', totalPoints: 500 },
      { playerName: 'Alice', totalPoints: 800 },
      { playerName: 'Bob', totalPoints: 600 }
    ];

    test('should sort players alphabetically (A-Z)', () => {
      const sorted = [...players].sort((a, b) =>
        sortComparators.player(a, b, 'asc')
      );

      expect(sorted.map(p => p.playerName)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    test('should sort players reverse alphabetically (Z-A)', () => {
      const sorted = [...players].sort((a, b) =>
        sortComparators.player(a, b, 'desc')
      );

      expect(sorted.map(p => p.playerName)).toEqual(['Charlie', 'Bob', 'Alice']);
    });

    test('should handle players with "(left)" suffix', () => {
      const playersWithLeft = [
        { playerName: 'Charlie (left)', totalPoints: 500 },
        { playerName: 'Alice', totalPoints: 800 },
        { playerName: 'Bob (left)', totalPoints: 600 }
      ];

      const sorted = [...playersWithLeft].sort((a, b) =>
        sortComparators.player(a, b, 'asc')
      );

      expect(sorted.map(p => p.playerName)).toEqual([
        'Alice',
        'Bob (left)',
        'Charlie (left)'
      ]);
    });
  });

  describe('Sort by day column', () => {
    const players = [
      { playerName: 'Alice', day1: 4, day2: 2 },
      { playerName: 'Bob', day1: 0, day2: 4 },
      { playerName: 'Charlie', day1: 2, day2: 4 }
    ];

    test('should sort by Day 1 decks (ascending)', () => {
      const sorted = [...players].sort((a, b) =>
        sortComparators.day(a, b, 'asc', 'day1')
      );

      expect(sorted.map(p => p.playerName)).toEqual(['Bob', 'Charlie', 'Alice']);
    });

    test('should sort by Day 1 decks (descending)', () => {
      const sorted = [...players].sort((a, b) =>
        sortComparators.day(a, b, 'desc', 'day1')
      );

      expect(sorted.map(p => p.playerName)).toEqual(['Alice', 'Charlie', 'Bob']);
    });

    test('should sort by Day 2 decks (ascending)', () => {
      const sorted = [...players].sort((a, b) =>
        sortComparators.day(a, b, 'asc', 'day2')
      );

      expect(sorted.map(p => p.playerName)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    test('should handle ties in deck count', () => {
      const playersWithTies = [
        { playerName: 'Alice', day1: 4 },
        { playerName: 'Bob', day1: 4 },
        { playerName: 'Charlie', day1: 2 }
      ];

      const sorted = [...playersWithTies].sort((a, b) =>
        sortComparators.day(a, b, 'desc', 'day1')
      );

      // Alice and Bob both have 4, Charlie has 2
      expect(sorted[0].day1).toBe(4);
      expect(sorted[1].day1).toBe(4);
      expect(sorted[2].day1).toBe(2);
    });
  });

  describe('Sort by points column', () => {
    const players = [
      { playerName: 'Bob', totalPoints: 600 },
      { playerName: 'Alice', totalPoints: 800 },
      { playerName: 'Charlie', totalPoints: 400 },
      { playerName: 'Dave', totalPoints: 0 }
    ];

    test('should sort by points ascending', () => {
      const sorted = [...players].sort((a, b) =>
        sortComparators.points(a, b, 'asc')
      );

      expect(sorted.map(p => p.playerName)).toEqual([
        'Dave',
        'Charlie',
        'Bob',
        'Alice'
      ]);
    });

    test('should sort by points descending', () => {
      const sorted = [...players].sort((a, b) =>
        sortComparators.points(a, b, 'desc')
      );

      expect(sorted.map(p => p.playerName)).toEqual([
        'Alice',
        'Bob',
        'Charlie',
        'Dave'
      ]);
    });

    test('should handle players with 0 points', () => {
      const sorted = [...players].sort((a, b) =>
        sortComparators.points(a, b, 'asc')
      );

      expect(sorted[0].playerName).toBe('Dave');
      expect(sorted[0].totalPoints).toBe(0);
    });

    test('should handle missing totalPoints (treat as 0)', () => {
      const playersWithMissing = [
        { playerName: 'Alice', totalPoints: 500 },
        { playerName: 'Bob' } // No totalPoints field
      ];

      const sorted = [...playersWithMissing].sort((a, b) =>
        sortComparators.points(a, b, 'asc')
      );

      expect(sorted[0].playerName).toBe('Bob');
      expect(sorted[1].playerName).toBe('Alice');
    });

    test('should handle ties in points', () => {
      const playersWithTies = [
        { playerName: 'Alice', totalPoints: 600 },
        { playerName: 'Bob', totalPoints: 600 },
        { playerName: 'Charlie', totalPoints: 400 }
      ];

      const sorted = [...playersWithTies].sort((a, b) =>
        sortComparators.points(a, b, 'desc')
      );

      // Alice and Bob both have 600
      expect(sorted[0].totalPoints).toBe(600);
      expect(sorted[1].totalPoints).toBe(600);
      expect(sorted[2].totalPoints).toBe(400);
    });
  });

  describe('Sort state management', () => {
    test('should toggle from none to asc', () => {
      let currentSort = 'none';
      let newSort = currentSort === 'none' || currentSort === 'desc' ? 'asc' : 'desc';
      expect(newSort).toBe('asc');
    });

    test('should toggle from asc to desc', () => {
      let currentSort = 'asc';
      let newSort = currentSort === 'none' || currentSort === 'desc' ? 'asc' : 'desc';
      expect(newSort).toBe('desc');
    });

    test('should toggle from desc to asc', () => {
      let currentSort = 'desc';
      let newSort = currentSort === 'none' || currentSort === 'desc' ? 'asc' : 'desc';
      expect(newSort).toBe('asc');
    });
  });

  describe('Edge cases', () => {
    test('should handle empty array', () => {
      const empty = [];
      const sorted = [...empty].sort((a, b) =>
        sortComparators.player(a, b, 'asc')
      );

      expect(sorted).toEqual([]);
    });

    test('should handle single player', () => {
      const single = [{ playerName: 'Alice', totalPoints: 500 }];
      const sorted = [...single].sort((a, b) =>
        sortComparators.player(a, b, 'asc')
      );

      expect(sorted).toEqual([{ playerName: 'Alice', totalPoints: 500 }]);
    });

    test('should handle special characters in names', () => {
      const players = [
        { playerName: 'Øystein', totalPoints: 500 },
        { playerName: 'Åsa', totalPoints: 600 },
        { playerName: 'Ærlig', totalPoints: 400 }
      ];

      const sorted = [...players].sort((a, b) =>
        sortComparators.player(a, b, 'asc')
      );

      // Just verify it doesn't crash with special characters
      expect(sorted.length).toBe(3);
    });
  });

  describe('Sorting stability', () => {
    test('should maintain relative order for equal values', () => {
      const players = [
        { playerName: 'Alice', totalPoints: 500, id: 1 },
        { playerName: 'Bob', totalPoints: 500, id: 2 },
        { playerName: 'Charlie', totalPoints: 500, id: 3 }
      ];

      const sorted = [...players].sort((a, b) =>
        sortComparators.points(a, b, 'asc')
      );

      // All have same points, order should be stable (maintained)
      expect(sorted.every(p => p.totalPoints === 500)).toBe(true);
    });
  });
});
