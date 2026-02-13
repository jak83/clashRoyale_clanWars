# Test Fixtures

This directory contains captured real war data for testing purposes.

## Files

- `war_data_latest.json` - Most recently captured war data (updated when you run the capture script)
- `war_data_YYYY-MM-DDTHH-MM-SS.json` - Timestamped snapshots of war data

## Data Structure

Each fixture file contains:
```json
{
  "capturedAt": "ISO timestamp",
  "clanTag": "#2QPY0R",
  "currentRace": { /* Current river race data */ },
  "clanMembers": { /* Current clan member list */ },
  "raceLog": { /* War history */ }
}
```

## Capturing New Data

Run the capture script to save current war state:
```bash
node capture_test_data.js
```

This creates:
1. A timestamped file: `war_data_2026-02-13T06-32-09.json`
2. Overwrites `war_data_latest.json` with the same data

## Usage in Tests

```javascript
const testData = require('./fixtures/war_data_latest.json');

describe('My test', () => {
    test('should work with real data', () => {
        const participants = testData.currentRace.clan.participants;
        expect(participants.length).toBeGreaterThan(0);
    });
});
```

## When to Capture

Good times to capture test data:
- **War Day 1** (Thursday) - Initial state
- **War Day 4** (Sunday) - Final state with all data
- **Training Day** - Different periodType
- **After player joins/leaves** - Edge case scenarios

## Privacy Note

These files contain real player names and tags. If you plan to share the code publicly, consider anonymizing the data or adding these files to `.gitignore`.
