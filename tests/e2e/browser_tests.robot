*** Settings ***
Documentation     Browser-based E2E tests for Clash Wars Tracker UI
Library           SeleniumLibrary
Suite Setup       Setup Browser
Suite Teardown    Close All Browsers

*** Variables ***
${BASE_URL}       http://localhost:3000
${BROWSER}        Chrome
${DELAY}          0.5

*** Test Cases ***
User Can Load Home Page
    [Documentation]    Verify the main page loads and displays correctly
    Go To    ${BASE_URL}
    Wait Until Page Contains    Clash Wars Tracker    timeout=10s
    Page Should Contain Element    css:[data-testid="page-title"]
    Title Should Be    Clash Royale War Tracker

User Can See Tab Navigation
    [Documentation]    Verify all navigation tabs are present
    Go To    ${BASE_URL}
    Wait Until Element Is Visible    css:[data-testid="navigation-tabs"]    timeout=10s
    Page Should Contain Element    css:[data-testid="tab-daily-history"]
    Page Should Contain Element    css:[data-testid="tab-war-stats"]
    Page Should Contain Element    css:[data-testid="tab-last-war"]

    # Verify Daily History tab is active by default
    Element Should Have Class    css:[data-testid="tab-daily-history"]    active

User Can Switch Between Tabs
    [Documentation]    Verify tab switching works correctly
    Go To    ${BASE_URL}

    # Switch to War Stats tab (may take time if API unavailable)
    Click Element    css:[data-testid="tab-war-stats"]
    Wait Until Element Is Visible    css:[data-testid="view-war-stats"]    timeout=10s
    Element Should Not Have Class    css:[data-testid="tab-daily-history"]    active
    Element Should Have Class    css:[data-testid="tab-war-stats"]    active

    # Switch to Last War tab
    Click Element    css:[data-testid="tab-last-war"]
    Wait Until Element Is Visible    css:[data-testid="view-last-war"]    timeout=10s
    Element Should Have Class    css:[data-testid="tab-last-war"]    active

    # Switch back to Daily History
    Click Element    css:[data-testid="tab-daily-history"]
    Wait Until Element Is Visible    css:[data-testid="view-daily-history"]    timeout=10s
    Element Should Have Class    css:[data-testid="tab-daily-history"]    active

Daily History View Displays Control Buttons
    [Documentation]    Verify Daily History view has all control buttons
    Go To    ${BASE_URL}
    Wait Until Element Is Visible    css:[data-testid="history-controls"]    timeout=10s
    Page Should Contain Element    css:[data-testid="btn-refresh-history"]
    Page Should Contain Element    css:[data-testid="btn-toggle-completed"]
    Page Should Contain Element    css:[data-testid="btn-toggle-left-players"]

History Container Loads Data
    [Documentation]    Verify history container shows data or loading state
    Go To    ${BASE_URL}
    Wait Until Element Is Visible    css:[data-testid="history-container"]    timeout=10s

    # Should either show loading text or actual data
    # We'll check that the container exists and is visible
    Element Should Be Visible    css:[data-testid="history-container"]

War Stats Tab Loads Content
    [Documentation]    Verify War Stats tab loads its content
    Go To    ${BASE_URL}
    Click Element    css:[data-testid="tab-war-stats"]
    Wait Until Element Is Visible    css:[data-testid="view-war-stats"]    timeout=5s

    # Should show the container
    Element Should Be Visible    css:[data-testid="war-stats-container"]
    Page Should Contain Element    css:[data-testid="war-stats-title"]

Last War Tab Loads Content
    [Documentation]    Verify Last War tab loads its content
    Go To    ${BASE_URL}
    Click Element    css:[data-testid="tab-last-war"]
    Wait Until Element Is Visible    css:[data-testid="view-last-war"]    timeout=5s

    # Should show the note element (section may be empty initially)
    Page Should Contain Element    css:[data-testid="last-war-section"]
    Element Should Be Visible    css:[data-testid="last-war-note"]

User Can Click Refresh History Button
    [Documentation]    Verify refresh button is clickable
    Go To    ${BASE_URL}
    Wait Until Element Is Visible    css:[data-testid="btn-refresh-history"]    timeout=10s

    # Click the refresh button (should not error)
    Click Element    css:[data-testid="btn-refresh-history"]
    Sleep    ${DELAY}

    # History container should still be visible
    Element Should Be Visible    css:[data-testid="history-container"]

User Can Toggle Hide Completed Button
    [Documentation]    Verify hide completed players toggle works
    Go To    ${BASE_URL}
    Wait Until Element Is Visible    css:[data-testid="btn-toggle-completed"]    timeout=10s

    # Get initial button text
    ${initial_text}=    Get Text    css:[data-testid="btn-toggle-completed"]

    # Click to toggle
    Click Element    css:[data-testid="btn-toggle-completed"]
    Sleep    ${DELAY}

    # Button text should change
    ${new_text}=    Get Text    css:[data-testid="btn-toggle-completed"]
    Should Not Be Equal    ${initial_text}    ${new_text}

User Can Toggle Hide Left Players Button
    [Documentation]    Verify hide left players toggle works
    Go To    ${BASE_URL}
    Wait Until Element Is Visible    css:[data-testid="btn-toggle-left-players"]    timeout=10s

    # Get initial button text
    ${initial_text}=    Get Text    css:[data-testid="btn-toggle-left-players"]

    # Click to toggle
    Click Element    css:[data-testid="btn-toggle-left-players"]
    Sleep    ${DELAY}

    # Button text should change
    ${new_text}=    Get Text    css:[data-testid="btn-toggle-left-players"]
    Should Not Be Equal    ${initial_text}    ${new_text}

Footer Contains Support Link
    [Documentation]    Verify support footer is present
    Go To    ${BASE_URL}
    Element Should Be Visible    css:[data-testid="support-footer"]
    Element Should Be Visible    css:[data-testid="support-message"]
    Element Should Be Visible    css:[data-testid="support-paypal-link"]

*** Keywords ***
Setup Browser
    [Documentation]    Initialize browser with ChromeDriver auto-management
    # webdriver-manager will auto-download and manage ChromeDriver
    ${chrome_options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
    Call Method    ${chrome_options}    add_argument    --disable-gpu
    Call Method    ${chrome_options}    add_argument    --no-sandbox
    Call Method    ${chrome_options}    add_argument    --disable-dev-shm-usage

    # For demo: run headless. Remove headless to see browser
    # Call Method    ${chrome_options}    add_argument    --headless

    Open Browser    ${BASE_URL}    ${BROWSER}    options=${chrome_options}
    Set Window Size    1920    1080
    Set Selenium Speed    ${DELAY}

Element Should Have Class
    [Arguments]    ${locator}    ${class_name}
    [Documentation]    Verify element has a specific CSS class
    ${classes}=    Get Element Attribute    ${locator}    class
    Should Contain    ${classes}    ${class_name}

Element Should Not Have Class
    [Arguments]    ${locator}    ${class_name}
    [Documentation]    Verify element does not have a specific CSS class
    ${classes}=    Get Element Attribute    ${locator}    class
    Should Not Contain    ${classes}    ${class_name}
