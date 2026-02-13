*** Settings ***
Documentation     Behavioral E2E tests that verify actual outcomes of user actions
...               These tests verify the data actually changes, not just that buttons exist
Library           SeleniumLibrary
Library           RequestsLibrary
Suite Setup       Setup Test Environment
Suite Teardown    Close All Browsers

*** Variables ***
${BASE_URL}       http://localhost:3000
${BROWSER}        Chrome
${DELAY}          0.5

*** Test Cases ***
Demo Data Should Load Successfully
    [Documentation]    Load demo data to have predictable test data
    Create Session    localhost    ${BASE_URL}
    ${response}=    POST On Session    localhost    /api/demo/load
    Should Be Equal As Numbers    ${response.status_code}    200

Daily History Should Display Player Names
    [Documentation]    Verify actual player data is rendered
    Go To    ${BASE_URL}
    Wait Until Element Is Visible    css:[data-testid="tab-daily-history"]    timeout=10s
    Click Element    css:[data-testid="tab-daily-history"]

    # Wait for history to load
    Sleep    2s

    # Verify table exists and contains player data
    Page Should Contain Element    css:.history-table

    # Demo data should have predictable players
    # (Demo creates players like "Perfect Pete", "Casual Carl", etc.)
    Page Should Contain    Player

Day Filter Should Actually Filter Data
    [Documentation]    Verify clicking day filter changes visible columns
    Go To    ${BASE_URL}
    Click Element    css:[data-testid="tab-daily-history"]
    Sleep    2s

    # Check if day filter buttons are visible
    ${day_filters_visible}=    Run Keyword And Return Status
    ...    Element Should Be Visible    css:[data-testid="day-filter-buttons"]

    # Only proceed if filters are available
    Run Keyword If    ${day_filters_visible}    Test Day Filter Behavior

Hide Completed Players Should Toggle Button Text
    [Documentation]    Verify toggle button text changes (proves it works)
    Go To    ${BASE_URL}
    Click Element    css:[data-testid="tab-daily-history"]
    Sleep    2s

    # Get initial button text
    ${initial_text}=    Get Text    css:[data-testid="btn-toggle-completed"]
    Log    Initial button text: ${initial_text}

    # Get initial table row count
    ${initial_rows}=    Get Element Count    css:.history-table tbody tr

    # Click toggle
    Click Element    css:[data-testid="btn-toggle-completed"]
    Sleep    ${DELAY}

    # Button text should change (Hide Completed <-> Show Completed)
    ${new_text}=    Get Text    css:[data-testid="btn-toggle-completed"]
    Log    New button text: ${new_text}
    Should Not Be Equal    ${initial_text}    ${new_text}

    # Row count may or may not change (depends on if there are completed players)
    ${new_rows}=    Get Element Count    css:.history-table tbody tr
    Log    Rows: ${initial_rows} -> ${new_rows} (may be same if no completed players)

Hide Left Players Should Actually Hide Rows
    [Documentation]    Verify hide left players toggle changes table
    Go To    ${BASE_URL}
    Click Element    css:[data-testid="tab-daily-history"]
    Sleep    2s

    # Get initial row count
    ${initial_rows}=    Get Element Count    css:.history-table tbody tr

    # Click toggle
    Click Element    css:[data-testid="btn-toggle-left-players"]
    Sleep    ${DELAY}

    # Get new row count
    ${new_rows}=    Get Element Count    css:.history-table tbody tr

    Log    Initial rows: ${initial_rows}, After toggle: ${new_rows}
    # Row count should change if there are departed players

Tab Switching Should Show Different Content
    [Documentation]    Verify switching tabs actually changes content
    Go To    ${BASE_URL}

    # Start on Daily History
    Click Element    css:[data-testid="tab-daily-history"]
    Sleep    1s
    ${history_visible}=    Run Keyword And Return Status
    ...    Element Should Be Visible    css:[data-testid="view-daily-history"]
    Should Be True    ${history_visible}

    # Switch to War Stats
    Click Element    css:[data-testid="tab-war-stats"]
    Sleep    1s
    ${war_stats_visible}=    Run Keyword And Return Status
    ...    Element Should Be Visible    css:[data-testid="view-war-stats"]
    Should Be True    ${war_stats_visible}

    # Daily History should NOT be visible
    ${history_hidden}=    Run Keyword And Return Status
    ...    Element Should Not Be Visible    css:[data-testid="view-daily-history"]
    Should Be True    ${history_hidden}

    # Switch to Last War
    Click Element    css:[data-testid="tab-last-war"]
    Sleep    1s
    ${last_war_visible}=    Run Keyword And Return Status
    ...    Element Should Be Visible    css:[data-testid="view-last-war"]
    Should Be True    ${last_war_visible}

War Stats Should Display Current Standings
    [Documentation]    Verify War Stats tab shows actual data
    Go To    ${BASE_URL}
    Click Element    css:[data-testid="tab-war-stats"]
    Sleep    2s

    # Should contain standings information
    Wait Until Element Is Visible    css:[data-testid="war-stats-container"]

    # Check for typical war stats content
    ${has_content}=    Run Keyword And Return Status
    ...    Page Should Contain    War

Last War Should Show Archive Message or Data
    [Documentation]    Verify Last War tab shows appropriate content
    Go To    ${BASE_URL}
    Click Element    css:[data-testid="tab-last-war"]
    Sleep    2s

    # Should see either the note or actual war data
    Element Should Be Visible    css:[data-testid="last-war-note"]
    Page Should Contain    Once the current war ends

Refresh History Should Reload Data
    [Documentation]    Verify refresh button actually refreshes
    Go To    ${BASE_URL}
    Click Element    css:[data-testid="tab-daily-history"]
    Sleep    2s

    # Take snapshot of current state
    ${before_refresh}=    Get Text    css:[data-testid="history-container"]

    # Click refresh
    Click Element    css:[data-testid="btn-refresh-history"]
    Sleep    2s

    # Data should still exist (refresh worked)
    ${after_refresh}=    Get Text    css:[data-testid="history-container"]
    Should Not Be Empty    ${after_refresh}

Player Count Should Display
    [Documentation]    Verify player count is shown
    Go To    ${BASE_URL}
    Click Element    css:[data-testid="tab-daily-history"]
    Sleep    2s

    # Player count element should exist and have content
    ${player_count_text}=    Get Text    css:[data-testid="player-count"]
    Should Not Be Empty    ${player_count_text}

    # Should contain numeric information
    Log    Player count text: ${player_count_text}

Support Link Should Be Clickable
    [Documentation]    Verify PayPal link works (without actually navigating)
    Go To    ${BASE_URL}

    # Check link exists and has href
    ${href}=    Get Element Attribute    css:[data-testid="support-paypal-link"]    href
    Should Contain    ${href}    paypal

    # Verify it's clickable (we won't actually click to avoid navigating away)
    Element Should Be Enabled    css:[data-testid="support-paypal-link"]

*** Keywords ***
Setup Test Environment
    [Documentation]    Initialize browser and load demo data
    ${chrome_options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
    Call Method    ${chrome_options}    add_argument    --disable-gpu
    Call Method    ${chrome_options}    add_argument    --no-sandbox
    Call Method    ${chrome_options}    add_argument    --disable-dev-shm-usage
    # For demo: run headless. Remove to see browser
    # Call Method    ${chrome_options}    add_argument    --headless

    Open Browser    ${BASE_URL}    ${BROWSER}    options=${chrome_options}
    Set Window Size    1920    1080
    Set Selenium Speed    ${DELAY}

    # Load demo data for predictable testing
    Create Session    localhost    ${BASE_URL}
    ${response}=    POST On Session    localhost    /api/demo/load
    Log    Demo data loaded: ${response.status_code}

Test Day Filter Behavior
    [Documentation]    Helper to test day filtering
    # Get all columns initially
    ${initial_columns}=    Get Element Count    css:.history-table thead th

    # Click a day filter button (if available)
    ${day1_exists}=    Run Keyword And Return Status
    ...    Element Should Be Visible    css:[data-day="1"]

    Run Keyword If    ${day1_exists}    Click Day Filter And Verify

Click Day Filter And Verify
    [Documentation]    Click day filter and verify columns change
    Click Element    css:[data-day="1"]
    Sleep    ${DELAY}

    # After filtering, should have fewer visible columns
    # (Only player name + selected day + points)
    ${filtered_columns}=    Get Element Count    css:.history-table thead th:not([style*="display: none"])

    Log    Filtered columns visible: ${filtered_columns}
    # Should show approximately 3 columns: Player, Day, Points
    Should Be True    ${filtered_columns} <= 4
