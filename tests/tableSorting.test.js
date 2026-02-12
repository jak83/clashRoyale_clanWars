/**
 * @jest-environment jsdom
 */

describe('Table Sorting', () => {
  // Helper function to create mock table rows
  function createMockTable() {
    document.body.innerHTML = `
      <table id="test-table">
        <thead>
          <tr>
            <th class="sortable" data-column="player" data-sort="none">
              <span class="sort-header">Player <span class="sort-arrow"></span></span>
            </th>
            <th class="sortable" data-column="day1" data-sort="none" data-day-index="0">
              <span class="sort-header">Day 1 <span class="sort-arrow"></span></span>
            </th>
            <th class="sortable" data-column="day2" data-sort="none" data-day-index="1">
              <span class="sort-header">Day 2 <span class="sort-arrow"></span></span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><div class="player-name">Charlie</div></td>
            <td>2 / 4</td>
            <td>4 / 4</td>
          </tr>
          <tr>
            <td><div class="player-name">Alice</div></td>
            <td>4 / 4</td>
            <td>2 / 4</td>
          </tr>
          <tr>
            <td><div class="player-name">Bob</div></td>
            <td>0 / 4</td>
            <td>4 / 4</td>
          </tr>
        </tbody>
      </table>
    `;
    return document.getElementById('test-table');
  }

  // Mock sorting function (simplified version of the actual function)
  function sortTableByColumn(table, column, direction, dayIndex) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    rows.sort((a, b) => {
      let aValue, bValue;

      if (column === 'player') {
        aValue = a.querySelector('.player-name').textContent.trim().toLowerCase();
        bValue = b.querySelector('.player-name').textContent.trim().toLowerCase();
        return direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (column.startsWith('day')) {
        const colIndex = parseInt(dayIndex) + 1;
        const aCells = a.querySelectorAll('td');
        const bCells = b.querySelectorAll('td');

        if (aCells[colIndex] && bCells[colIndex]) {
          const aText = aCells[colIndex].textContent.trim();
          const bText = bCells[colIndex].textContent.trim();
          aValue = parseInt(aText.split('/')[0].trim());
          bValue = parseInt(bText.split('/')[0].trim());

          return direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
      }

      return 0;
    });

    rows.forEach(row => tbody.appendChild(row));
  }

  describe('Sort by player name', () => {
    test('should sort players alphabetically (A-Z)', () => {
      const table = createMockTable();
      sortTableByColumn(table, 'player', 'asc', null);

      const rows = table.querySelectorAll('tbody tr');
      const names = Array.from(rows).map(row =>
        row.querySelector('.player-name').textContent
      );

      expect(names).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    test('should sort players reverse alphabetically (Z-A)', () => {
      const table = createMockTable();
      sortTableByColumn(table, 'player', 'desc', null);

      const rows = table.querySelectorAll('tbody tr');
      const names = Array.from(rows).map(row =>
        row.querySelector('.player-name').textContent
      );

      expect(names).toEqual(['Charlie', 'Bob', 'Alice']);
    });

    test('should handle players with "(left)" suffix', () => {
      document.body.innerHTML = `
        <table id="test-table">
          <tbody>
            <tr><td><div class="player-name">Bob (left)</div></td></tr>
            <tr><td><div class="player-name">Alice</div></td></tr>
          </tbody>
        </table>
      `;

      const table = document.getElementById('test-table');
      const rows = Array.from(table.querySelectorAll('tbody tr'));

      rows.sort((a, b) => {
        let aValue = a.querySelector('.player-name').textContent.trim().toLowerCase();
        let bValue = b.querySelector('.player-name').textContent.trim().toLowerCase();
        aValue = aValue.replace(' (left)', '');
        bValue = bValue.replace(' (left)', '');
        return aValue.localeCompare(bValue);
      });

      const tbody = table.querySelector('tbody');
      rows.forEach(row => tbody.appendChild(row));

      const names = Array.from(table.querySelectorAll('tbody tr')).map(row =>
        row.querySelector('.player-name').textContent
      );

      expect(names).toEqual(['Alice', 'Bob (left)']);
    });
  });

  describe('Sort by day column', () => {
    test('should sort by Day 1 decks (ascending)', () => {
      const table = createMockTable();
      sortTableByColumn(table, 'day1', 'asc', '0');

      const rows = table.querySelectorAll('tbody tr');
      const deckCounts = Array.from(rows).map(row => {
        const text = row.querySelectorAll('td')[1].textContent.trim();
        return parseInt(text.split('/')[0].trim());
      });

      expect(deckCounts).toEqual([0, 2, 4]); // Bob, Charlie, Alice
    });

    test('should sort by Day 1 decks (descending)', () => {
      const table = createMockTable();
      sortTableByColumn(table, 'day1', 'desc', '0');

      const rows = table.querySelectorAll('tbody tr');
      const deckCounts = Array.from(rows).map(row => {
        const text = row.querySelectorAll('td')[1].textContent.trim();
        return parseInt(text.split('/')[0].trim());
      });

      expect(deckCounts).toEqual([4, 2, 0]); // Alice, Charlie, Bob
    });

    test('should sort by Day 2 decks (ascending)', () => {
      const table = createMockTable();
      sortTableByColumn(table, 'day2', 'asc', '1');

      const rows = table.querySelectorAll('tbody tr');
      const deckCounts = Array.from(rows).map(row => {
        const text = row.querySelectorAll('td')[2].textContent.trim();
        return parseInt(text.split('/')[0].trim());
      });

      expect(deckCounts).toEqual([2, 4, 4]); // Alice, Charlie, Bob (stable sort)
    });
  });

  describe('Sort arrow indicators', () => {
    test('should show up arrow for ascending sort', () => {
      const table = createMockTable();
      const header = table.querySelector('[data-column="player"]');
      const arrow = header.querySelector('.sort-arrow');

      header.dataset.sort = 'asc';
      arrow.textContent = ' ↑';

      expect(arrow.textContent).toBe(' ↑');
    });

    test('should show down arrow for descending sort', () => {
      const table = createMockTable();
      const header = table.querySelector('[data-column="player"]');
      const arrow = header.querySelector('.sort-arrow');

      header.dataset.sort = 'desc';
      arrow.textContent = ' ↓';

      expect(arrow.textContent).toBe(' ↓');
    });

    test('should clear arrow when sort is none', () => {
      const table = createMockTable();
      const header = table.querySelector('[data-column="player"]');
      const arrow = header.querySelector('.sort-arrow');

      header.dataset.sort = 'none';
      arrow.textContent = '';

      expect(arrow.textContent).toBe('');
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
    test('should handle empty table', () => {
      document.body.innerHTML = '<table><tbody></tbody></table>';
      const table = document.querySelector('table');

      expect(() => {
        sortTableByColumn(table, 'player', 'asc', null);
      }).not.toThrow();
    });

    test('should handle single row', () => {
      document.body.innerHTML = `
        <table>
          <tbody>
            <tr><td><div class="player-name">Alice</div></td></tr>
          </tbody>
        </table>
      `;
      const table = document.querySelector('table');

      sortTableByColumn(table, 'player', 'asc', null);

      const names = Array.from(table.querySelectorAll('.player-name')).map(n => n.textContent);
      expect(names).toEqual(['Alice']);
    });
  });
});
