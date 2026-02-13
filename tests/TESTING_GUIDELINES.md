# Testing Guidelines

## Philosophy: Test Logic, Not Implementation

Focus on **what the code does** (behavior), not **how it does it** (implementation details).

## Good vs Bad Tests

### ✅ GOOD - Logic Testing
```javascript
test('should calculate daily decks correctly', () => {
  const totalDecks = 8;
  const previousDecks = 4;
  const dailyDecks = totalDecks - previousDecks;

  expect(dailyDecks).toBe(4);
});
```

**Why good:**
- Tests pure function/logic
- No DOM dependencies
- Fast execution
- Easy to maintain
- Adding new features doesn't break test

### ❌ BAD - Implementation Testing
```javascript
test('should show deck count in table cell', () => {
  document.body.innerHTML = `<table><tr><td id="decks"></td></tr></table>`;
  const cell = document.getElementById('decks');
  cell.textContent = '4 / 4';

  expect(cell.textContent).toBe('4 / 4');
});
```

**Why bad:**
- Tests DOM structure, not logic
- Brittle (breaks if HTML changes)
- Slow (needs jsdom)
- Hard to maintain
- Doesn't test actual behavior

## What to Test

### ✅ Test These (Business Logic)
- **Calculations**: Points, deck counts, percentages, rankings
- **Data transformations**: Sorting, filtering, mapping
- **Conditionals**: "If player left AND has 0 decks, hide"
- **Edge cases**: Empty arrays, null values, negative numbers
- **State transitions**: Training day → War day

### ❌ Don't Test These (Implementation Details)
- HTML structure (`<table>`, `<div>`, class names)
- CSS styling (colors, fonts, widths)
- Framework internals (React rendering, Vue reactivity)
- Third-party libraries (Jest, axios work correctly)

## Test Structure

```javascript
describe('Feature Name', () => {
  describe('Specific Behavior', () => {
    test('should do X when Y happens', () => {
      // Arrange: Set up test data
      const input = { ... };

      // Act: Execute the logic
      const result = functionToTest(input);

      // Assert: Verify the result
      expect(result).toBe(expectedOutput);
    });
  });
});
```

## Examples from This Project

### ✅ Good Example: historyManager.test.js
```javascript
test('should calculate war day correctly for Day 1 (Thursday)', () => {
  const periodIndex = 3; // Thursday
  const warDay = periodIndex - 2;

  expect(warDay).toBe(1);
});
```
**Why:** Tests the calculation logic directly.

### ✅ Good Example: tableSorting.test.js
```javascript
test('should sort by points ascending', () => {
  const players = [
    { playerName: 'Bob', totalPoints: 600 },
    { playerName: 'Alice', totalPoints: 800 }
  ];

  const sorted = players.sort((a, b) => a.totalPoints - b.totalPoints);

  expect(sorted[0].playerName).toBe('Bob');
});
```
**Why:** Tests sorting behavior with plain objects.

### ❌ Avoid: dayFilters.test.js (needs refactoring)
```javascript
test('should detect Day 1 from table header', () => {
  document.body.innerHTML = `<table><th>Day 1</th></table>`;
  const header = document.querySelector('th');

  expect(header.textContent).toContain('Day 1');
});
```
**Why:** Should test the day detection logic, not HTML parsing.

## When to Write Tests

### Always Write Tests For:
1. **Bug fixes** - Regression test to prevent bug from returning
2. **Complex logic** - Calculations, conditionals, data transformations
3. **Edge cases** - Empty data, nulls, negative numbers, max values
4. **Critical paths** - User authentication, data loss prevention

### Optional Tests For:
1. Simple getters/setters
2. Configuration files
3. Constant definitions

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test tableSorting

# Run tests in watch mode (during development)
npm run test:watch
```

## Test Coverage Goals

- **Critical logic**: 100% coverage
- **Business rules**: 100% coverage
- **Edge cases**: High coverage
- **UI rendering**: Low coverage (test logic, not markup)

## Quick Checklist

Before writing a test, ask:

- [ ] Am I testing **behavior** or **implementation**?
- [ ] Can this test run without DOM/browser?
- [ ] Will this test break if I change HTML/CSS?
- [ ] Does this test document **what** the code does?
- [ ] Is this testing business logic or framework internals?

**If you answered "implementation", "needs DOM", "yes", "no", or "framework" - refactor the test!**

## Refactoring Existing Tests

If you find a test with:
- `document.body.innerHTML =`
- `querySelector`, `getElementById`
- HTML mock data
- `@jest-environment jsdom`

Consider refactoring to test the logic directly instead.

## Resources

- [Testing Library Philosophy](https://testing-library.com/docs/guiding-principles/)
- [Jest Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Test Desiderata](https://kentcdodds.com/blog/test-desiderata) by Kent C. Dodds
