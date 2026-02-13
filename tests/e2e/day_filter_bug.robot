*** Settings ***
Documentation     Regression test for day filter bug
...               BUG: Switching Day 1 -> Day 2 -> Day 1 breaks the view
...               Expected: Should be able to switch between days without issues
Library           SeleniumLibrary
Library           RequestsLibrary
Suite Setup       Setup Test With Demo Data
Suite Teardown    Close All Browsers

*** Variables ***
${BASE_URL}       http://localhost:3000
${BROWSER}        Chrome
${DELAY}          1.0

*** Test Cases ***
REGRESSION: Day Filter Should Work When Switching Between Days
    [Documentation]    Reproduce bug: Day 1 -> Day 2 -> Day 1 breaks view
    ...                This test should FAIL before fix, PASS after fix

    Go To    ${BASE_URL}
    Click Element    css:[data-testid="tab-daily-history"]
    Sleep    2s

    # Verify day filter buttons exist
    Wait Until Element Is Visible    css:[data-testid="day-filter-buttons"]    timeout=5s

    # Step 1: Click Day 1 filter
    Click Element    css:[data-testid="filter-day-1"]
    Sleep    ${DELAY}

    # Verify table is visible
    ${table_visible_1}=    Run Keyword And Return Status
    ...    Element Should Be Visible    css:[data-testid="history-container"] .history-table
    Should Be True    ${table_visible_1}    msg=Table should be visible after clicking Day 1

    # Verify "Decks" header appears (just check table is still visible)
    # The important part is that table doesn't disappear (bug is fixed)

    # Step 2: Click Day 2 filter
    Click Element    css:[data-testid="filter-day-2"]
    Sleep    ${DELAY}

    # BUG OCCURS HERE: Table should still be visible but it breaks
    ${table_visible_2}=    Run Keyword And Return Status
    ...    Element Should Be Visible    css:[data-testid="history-container"] .history-table
    Should Be True    ${table_visible_2}    msg=Table should be visible after switching to Day 2

    # Verify no error message
    ${has_error}=    Run Keyword And Return Status
    ...    Page Should Contain    has not yet started
    Should Not Be True    ${has_error}    msg=Should not show error message for Day 2

    # Step 3: Click Day 1 again
    Click Element    css:[data-testid="filter-day-1"]
    Sleep    ${DELAY}

    # BUG: Table is broken, nothing loads
    ${table_visible_3}=    Run Keyword And Return Status
    ...    Element Should Be Visible    css:[data-testid="history-container"] .history-table
    Should Be True    ${table_visible_3}    msg=Table should be visible after switching back to Day 1

    # Verify table contains player data
    ${has_players}=    Run Keyword And Return Status
    ...    Page Should Contain Element    css:[data-testid="history-container"] .history-table tbody tr
    Should Be True    ${has_players}    msg=Table should contain player rows

Multiple Day Switches Should All Work
    [Documentation]    Test multiple back-and-forth switches
    Go To    ${BASE_URL}
    Click Element    css:[data-testid="tab-daily-history"]
    Sleep    2s

    # Click through days multiple times
    FOR    ${i}    IN RANGE    3
        Click Element    css:[data-testid="filter-day-1"]
        Sleep    ${DELAY}
        Element Should Be Visible    css:[data-testid="history-container"] .history-table

        Click Element    css:[data-testid="filter-day-2"]
        Sleep    ${DELAY}
        Element Should Be Visible    css:[data-testid="history-container"] .history-table
    END

    # Final verification
    ${table_visible}=    Run Keyword And Return Status
    ...    Element Should Be Visible    css:[data-testid="history-container"] .history-table
    Should Be True    ${table_visible}    msg=Table should still be visible after multiple switches

Show All Should Reset After Day Filter Issues
    [Documentation]    Verify Show All button fixes broken state (workaround)
    Go To    ${BASE_URL}
    Click Element    css:[data-testid="tab-daily-history"]
    Sleep    2s

    # Break it by switching days
    Click Element    css:[data-testid="filter-day-1"]
    Sleep    ${DELAY}
    Click Element    css:[data-testid="filter-day-2"]
    Sleep    ${DELAY}
    Click Element    css:[data-testid="filter-day-1"]
    Sleep    ${DELAY}

    # Click Show All (workaround)
    Click Element    css:[data-testid="filter-show-all"]
    Sleep    ${DELAY}

    # Should work again
    Element Should Be Visible    css:[data-testid="history-container"] .history-table
    Page Should Contain Element    css:[data-testid="history-container"] .history-table tbody tr

*** Keywords ***
Setup Test With Demo Data
    [Documentation]    Initialize browser and load demo data
    ${chrome_options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
    Call Method    ${chrome_options}    add_argument    --disable-gpu
    Call Method    ${chrome_options}    add_argument    --no-sandbox
    Call Method    ${chrome_options}    add_argument    --disable-dev-shm-usage
    # Remove headless to see the bug in action
    # Call Method    ${chrome_options}    add_argument    --headless

    Open Browser    ${BASE_URL}    ${BROWSER}    options=${chrome_options}
    Set Window Size    1920    1080
    Set Selenium Speed    ${DELAY}

    # Load demo data
    Create Session    localhost    ${BASE_URL}
    ${response}=    POST On Session    localhost    /api/demo/load
    Log    Demo data loaded: ${response.status_code}
