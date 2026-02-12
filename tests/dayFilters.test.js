/**
 * @jest-environment jsdom
 */

describe('Day Filter Logic', () => {
  // Mock the checkDaysWithData function (extracted from app.js)
  function checkDaysWithData(table) {
    const daysWithData = [];
    const headerCells = table.querySelectorAll('thead th');

    headerCells.forEach((th, index) => {
      if (index === 0) return; // Skip player name column

      const dayMatch = th.textContent.match(/Day (\d+)/);
      if (dayMatch) {
        const dayNum = String(dayMatch[1]).trim();
        daysWithData.push(dayNum);
      }
    });

    return daysWithData;
  }

  test('should detect Day 1 from table header', () => {
    document.body.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Day 1 <div class="timestamp-small">12:34</div></th>
          </tr>
        </thead>
      </table>
    `;

    const table = document.querySelector('table');
    const daysWithData = checkDaysWithData(table);

    expect(daysWithData).toContain('1');
    expect(daysWithData).toHaveLength(1);
  });

  test('should detect multiple days from table headers', () => {
    document.body.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Day 1 <div class="timestamp-small">12:34</div></th>
            <th>Day 2 <div class="timestamp-small">15:45</div></th>
            <th>Day 3 <div class="timestamp-small">18:20</div></th>
          </tr>
        </thead>
      </table>
    `;

    const table = document.querySelector('table');
    const daysWithData = checkDaysWithData(table);

    expect(daysWithData).toEqual(['1', '2', '3']);
    expect(daysWithData).toHaveLength(3);
  });

  test('should handle empty table', () => {
    document.body.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Player</th>
          </tr>
        </thead>
      </table>
    `;

    const table = document.querySelector('table');
    const daysWithData = checkDaysWithData(table);

    expect(daysWithData).toHaveLength(0);
  });

  test('day button should NOT be grayed out if day exists in table', () => {
    document.body.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Day 1 <div class="timestamp-small">12:34</div></th>
          </tr>
        </thead>
      </table>
    `;

    const table = document.querySelector('table');
    const daysWithData = checkDaysWithData(table);

    // Simulate button check logic
    const dayToCheck = '1';
    const hasData = daysWithData.includes(String(dayToCheck).trim());

    expect(hasData).toBe(true);
  });

  test('day button SHOULD be grayed out if day does not exist in table', () => {
    document.body.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Day 1 <div class="timestamp-small">12:34</div></th>
          </tr>
        </thead>
      </table>
    `;

    const table = document.querySelector('table');
    const daysWithData = checkDaysWithData(table);

    // Check for Day 2 which doesn't exist
    const dayToCheck = '2';
    const hasData = daysWithData.includes(String(dayToCheck).trim());

    expect(hasData).toBe(false);
  });

  test('string comparison: "1" should equal "1"', () => {
    const daysWithData = ['1', '2', '3'];
    const day = '1';

    expect(daysWithData.includes(day)).toBe(true);
  });

  test('string comparison: number 1 should be converted to string "1"', () => {
    const daysWithData = ['1', '2', '3'];
    const day = 1; // number

    // This would FAIL without String() conversion
    expect(daysWithData.includes(String(day))).toBe(true);
  });

  test('regex should extract day number from header text with nested HTML', () => {
    const headerText = 'Day 1\n12:34'; // textContent includes newlines from nested divs
    const dayMatch = headerText.match(/Day (\d+)/);

    expect(dayMatch).not.toBeNull();
    expect(dayMatch[1]).toBe('1');
  });

  test('should handle day numbers with whitespace', () => {
    const dayMatch = ' Day 2 '.match(/Day (\d+)/);
    const dayNum = String(dayMatch[1]).trim();

    expect(dayNum).toBe('2');
  });
});
