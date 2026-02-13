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
    Page Should Contain Element    css:header h1
    Title Should Be    Clash Royale War Tracker

User Can See Tab Navigation
    [Documentation]    Verify all navigation tabs are present
    Go To    ${BASE_URL}
    Wait Until Element Is Visible    css:.tabs    timeout=10s
    Page Should Contain Element    xpath://button[@data-tab='history']
    Page Should Contain Element    xpath://button[@data-tab='war-stats']
    Page Should Contain Element    xpath://button[@data-tab='last-war']

    # Verify Daily History tab is active by default
    Element Should Have Class    xpath://button[@data-tab='history']    active

User Can Switch Between Tabs
    [Documentation]    Verify tab switching works correctly
    Go To    ${BASE_URL}

    # Switch to War Stats tab
    Click Element    xpath://button[@data-tab='war-stats']
    Wait Until Element Is Visible    id:view-war-stats    timeout=5s
    Element Should Not Have Class    xpath://button[@data-tab='history']    active
    Element Should Have Class    xpath://button[@data-tab='war-stats']    active

    # Switch to Last War tab
    Click Element    xpath://button[@data-tab='last-war']
    Wait Until Element Is Visible    id:view-last-war    timeout=5s
    Element Should Have Class    xpath://button[@data-tab='last-war']    active

    # Switch back to Daily History
    Click Element    xpath://button[@data-tab='history']
    Wait Until Element Is Visible    id:view-history    timeout=5s
    Element Should Have Class    xpath://button[@data-tab='history']    active

Daily History View Displays Control Buttons
    [Documentation]    Verify Daily History view has all control buttons
    Go To    ${BASE_URL}
    Wait Until Element Is Visible    id:refresh-history    timeout=10s
    Page Should Contain Button    id:refresh-history
    Page Should Contain Button    id:toggle-history-completed
    Page Should Contain Button    id:toggle-left-players

History Container Loads Data
    [Documentation]    Verify history container shows data or loading state
    Go To    ${BASE_URL}
    Wait Until Element Is Visible    id:history-container    timeout=10s

    # Should either show loading text or actual data
    # We'll check that the container exists and is visible
    Element Should Be Visible    id:history-container

War Stats Tab Loads Content
    [Documentation]    Verify War Stats tab loads its content
    Go To    ${BASE_URL}
    Click Element    xpath://button[@data-tab='war-stats']
    Wait Until Element Is Visible    id:view-war-stats    timeout=5s

    # Should show the container
    Element Should Be Visible    id:war-stats-container
    Page Should Contain Element    css:#view-war-stats h2

Last War Tab Loads Content
    [Documentation]    Verify Last War tab loads its content
    Go To    ${BASE_URL}
    Click Element    xpath://button[@data-tab='last-war']
    Wait Until Element Is Visible    id:view-last-war    timeout=5s

    # Should show the section and note
    Element Should Be Visible    id:last-war-section
    Page Should Contain    Once the current war ends

User Can Click Refresh History Button
    [Documentation]    Verify refresh button is clickable
    Go To    ${BASE_URL}
    Wait Until Element Is Visible    id:refresh-history    timeout=10s

    # Click the refresh button (should not error)
    Click Button    id:refresh-history
    Sleep    ${DELAY}

    # History container should still be visible
    Element Should Be Visible    id:history-container

User Can Toggle Hide Completed Button
    [Documentation]    Verify hide completed players toggle works
    Go To    ${BASE_URL}
    Wait Until Element Is Visible    id:toggle-history-completed    timeout=10s

    # Get initial button text
    ${initial_text}=    Get Text    id:toggle-history-completed

    # Click to toggle
    Click Button    id:toggle-history-completed
    Sleep    ${DELAY}

    # Button text should change
    ${new_text}=    Get Text    id:toggle-history-completed
    Should Not Be Equal    ${initial_text}    ${new_text}

User Can Toggle Hide Left Players Button
    [Documentation]    Verify hide left players toggle works
    Go To    ${BASE_URL}
    Wait Until Element Is Visible    id:toggle-left-players    timeout=10s

    # Get initial button text
    ${initial_text}=    Get Text    id:toggle-left-players

    # Click to toggle
    Click Button    id:toggle-left-players
    Sleep    ${DELAY}

    # Button text should change
    ${new_text}=    Get Text    id:toggle-left-players
    Should Not Be Equal    ${initial_text}    ${new_text}

Footer Contains Support Link
    [Documentation]    Verify support footer is present
    Go To    ${BASE_URL}
    Page Should Contain    Enjoying the tracker?
    Page Should Contain Element    css:.support-footer a[href*='paypal']

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
