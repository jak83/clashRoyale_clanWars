*** Settings ***
Documentation     API Integration tests for Clash Wars Tracker backend endpoints
Library           RequestsLibrary
Library           Collections
Suite Setup       Create Session    localhost    http://localhost:3000
Suite Teardown    Delete All Sessions

*** Variables ***
${BASE_URL}       http://localhost:3000

*** Test Cases ***
Server Should Be Running
    [Documentation]    Verify server responds to health check
    ${response}=    GET On Session    localhost    /
    Should Be Equal As Numbers    ${response.status_code}    200

API Race Endpoint Should Return Valid Data
    [Documentation]    Verify /api/race returns proper structure
    ${response}=    GET On Session    localhost    /api/race
    Should Be Equal As Numbers    ${response.status_code}    200

    # Verify response is JSON
    ${json}=    Set Variable    ${response.json()}
    Dictionary Should Contain Key    ${json}    clan

    # Verify clan data structure
    ${clan}=    Get From Dictionary    ${json}    clan
    Dictionary Should Contain Key    ${clan}    name
    Dictionary Should Contain Key    ${clan}    participants

API Race History Endpoint Should Work
    [Documentation]    Verify /api/race/history endpoint
    ${response}=    GET On Session    localhost    /api/race/history
    Should Be Equal As Numbers    ${response.status_code}    200

    # Verify response is JSON array or object
    ${json}=    Set Variable    ${response.json()}
    Should Not Be Empty    ${json}

API Race Log Endpoint Should Work
    [Documentation]    Verify /api/race/log proxies to Clash API
    ${response}=    GET On Session    localhost    /api/race/log    expected_status=any

    # Should return either 200 (success) or 403 (API token issue)
    Should Be True    ${response.status_code} == 200 or ${response.status_code} == 403

Demo Data Should Load Successfully
    [Documentation]    Verify demo mode POST endpoint
    ${response}=    POST On Session    localhost    /api/demo/load
    Should Be Equal As Numbers    ${response.status_code}    200

    ${json}=    Set Variable    ${response.json()}
    Dictionary Should Contain Key    ${json}    message
    Should Contain    ${json['message']}    Demo data loaded

Participants Should Have Required Fields
    [Documentation]    Verify participant data structure after demo load
    # First load demo data
    POST On Session    localhost    /api/demo/load

    # Then fetch race data
    ${response}=    GET On Session    localhost    /api/race
    ${json}=    Set Variable    ${response.json()}
    ${clan}=    Get From Dictionary    ${json}    clan
    ${participants}=    Get From Dictionary    ${clan}    participants

    # Verify at least one participant exists
    ${length}=    Get Length    ${participants}
    Should Be True    ${length} > 0

    # Verify first participant has required fields
    ${first_player}=    Get From List    ${participants}    0
    Dictionary Should Contain Key    ${first_player}    tag
    Dictionary Should Contain Key    ${first_player}    name
    Dictionary Should Contain Key    ${first_player}    decksUsedToday
    Dictionary Should Contain Key    ${first_player}    fame

*** Keywords ***
# Add custom keywords here if needed
