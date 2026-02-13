# E2E Tests with Robot Framework

End-to-end and integration tests that verify the application works correctly with a running server.

## Test Types

### 1. Integration Tests (`integration_tests.robot`)
API-level tests that verify backend endpoints work correctly:
- Server health checks
- API endpoint responses
- Data structure validation
- Demo mode functionality

**Fast** - No browser overhead
**Run first** - Catches API issues before UI testing

### 2. Browser E2E Tests (`browser_tests.robot`)
True end-to-end tests that verify the full user experience:
- Opens Chrome browser
- Tests actual UI interactions
- Verifies tab navigation
- Tests button clicks and toggles
- Validates page content and behavior

**Slower** - Opens real browser
**More comprehensive** - Tests what users actually see and interact with

## Setup

### One-time setup:

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install Robot Framework and dependencies
pip install -r requirements.txt
```

This installs:
- Robot Framework
- RequestsLibrary (for API tests)
- SeleniumLibrary (for browser tests)
- webdriver-manager (auto-manages ChromeDriver)

## Running Tests

### Manual testing:

```bash
# 1. Activate venv (if not already active)
venv\Scripts\activate

# 2. Start the server in one terminal
npm start

# 3. In another terminal (with venv active), run tests:

# Run ALL e2e tests (integration + browser)
robot tests/e2e

# Run only integration tests (fast, API only)
robot tests/e2e/integration_tests.robot

# Run only browser tests (slower, full UI)
robot tests/e2e/browser_tests.robot

# Deactivate venv when done
deactivate
```

### Automated testing (via deploy.bat):

The deployment script automatically:
1. Activates venv
2. Starts server in background
3. Runs unit tests (Jest)
4. Runs integration tests (Robot/API)
5. Runs browser e2e tests (Robot/Selenium)
6. Deploys if all pass
7. Cleans up server process

```bash
deploy.bat
```

## Test Structure

```
tests/e2e/
├── integration_tests.robot  # API endpoint tests (fast)
├── browser_tests.robot       # Browser UI tests (comprehensive)
├── keywords/                 # Custom Robot keywords (future)
└── results/                  # Test results (gitignored)
```

## Browser Configuration

Browser tests use **Chrome** with auto-managed ChromeDriver (via webdriver-manager).

To run **headless** (no visible browser window), edit `browser_tests.robot`:
```robot
*** Keywords ***
Setup Browser
    ${chrome_options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
    Call Method    ${chrome_options}    add_argument    --headless  # Uncomment this line
    Open Browser    ${BASE_URL}    ${BROWSER}    options=${chrome_options}
```

## Writing New Tests

### Integration Test Example:
```robot
*** Test Cases ***
My API Test
    [Documentation]    Test description
    ${response}=    GET On Session    localhost    /api/my-endpoint
    Should Be Equal As Numbers    ${response.status_code}    200
```

### Browser E2E Test Example:
```robot
*** Test Cases ***
My UI Test
    [Documentation]    Test description
    Go To    http://localhost:3000
    Wait Until Element Is Visible    id:my-element
    Click Button    id:my-button
    Page Should Contain    Expected Text
```

## Test Reports

After running tests, Robot Framework generates:
- `log.html` - Detailed execution log with screenshots on failure
- `report.html` - High-level summary with statistics
- `output.xml` - Machine-readable results for CI/CD

Open `tests/e2e/results/report.html` in a browser to view results.

## Debugging Failed Tests

When browser tests fail:
1. Check `tests/e2e/results/log.html` for screenshots
2. Remove `--headless` flag to see browser actions live
3. Increase `${DELAY}` variable in browser_tests.robot
4. Check if server is running: `curl http://localhost:3000`

## Resources

- [Robot Framework User Guide](https://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html)
- [RequestsLibrary Documentation](https://marketsquare.github.io/robotframework-requests/doc/RequestsLibrary.html)
- [SeleniumLibrary Documentation](https://robotframework.org/SeleniumLibrary/SeleniumLibrary.html)
