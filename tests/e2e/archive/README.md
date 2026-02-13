# Archived E2E Tests

This folder contains browser tests that are **optional** and not run by default.

## Why archived?

These tests are slow (browser-based) and duplicate coverage that unit tests provide faster. They're kept here for:
- Comprehensive end-to-end testing before major releases
- Manual verification when needed
- Reference for test scenarios

## Files

- **behavioral_tests.robot** (11 tests, ~30s)
  - Tests actual UI outcomes (button text changes, row counts, etc.)
  - Duplicates logic covered by fast unit tests
  - Use for full regression testing before production deployment

## How to run

```bash
# Run archived tests manually
.venv/Scripts/python -m robot --outputdir tests/e2e/results tests/e2e/archive/behavioral_tests.robot
```

## Regular E2E Suite

The main E2E suite (run by `deploy.bat`) includes:
- `integration_tests.robot` - Fast API tests (no browser)
- `day_filter_bug.robot` - Critical UI regression
- `browser_tests.robot` - Basic smoke tests

Total: ~20 tests, runs in <30 seconds
