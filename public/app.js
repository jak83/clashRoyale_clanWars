document.addEventListener('DOMContentLoaded', () => {
    fetchRaceData();

    document.getElementById('toggle-completed').addEventListener('click', function () {
        const list = document.getElementById('completed-list');
        list.classList.toggle('hidden');
        this.textContent = list.classList.contains('hidden') ? 'Show Completed Players' : 'Hide Completed Players';
    });

    // Tab Handling
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => {
                c.classList.remove('active');
                c.classList.add('hidden');
            });

            // Activate clicked tab
            btn.classList.add('active');
            const targetId = `view-${btn.dataset.tab}`;
            const targetContent = document.getElementById(targetId);
            targetContent.classList.remove('hidden');
            targetContent.classList.add('active');

            // Load data if needed
            if (btn.dataset.tab === 'history') {
                fetchHistory();
            } else if (btn.dataset.tab === 'last-war') {
                // Check if already loaded? or just load again
                fetchRaceData().then(data => {
                    if (data && data.clan) fetchLastWarLog(data.clan.tag);
                });
            }
        });
    });

    // History Actions
    document.getElementById('refresh-history').addEventListener('click', fetchHistory);

    const toggleHistoryBtn = document.getElementById('toggle-history-completed');
    if (toggleHistoryBtn) {
        toggleHistoryBtn.addEventListener('click', () => {
            const rows = document.querySelectorAll('.history-row-completed');
            // Toggle state
            const isHidden = toggleHistoryBtn.dataset.hidden === 'true';

            rows.forEach(row => {
                if (isHidden) row.classList.remove('hidden-row'); // Show
                else row.classList.add('hidden-row'); // Hide
            });

            // Flip state
            toggleHistoryBtn.dataset.hidden = !isHidden;
            toggleHistoryBtn.textContent = !isHidden ? 'Show Completed' : 'Hide Completed';

            // Visual Toggle Style (optional)
            if (!isHidden) toggleHistoryBtn.style.backgroundColor = '#666';
            else toggleHistoryBtn.style.backgroundColor = 'var(--accent-blue)';
        });
    }

    // Demo Buttons (Day 1-4)
    document.querySelectorAll('.btn-demo').forEach(btn => {
        btn.addEventListener('click', async () => {
            // User requested no popups. Removing confirm.

            const days = parseInt(btn.dataset.days);

            try {
                const res = await fetch('/api/demo/load', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ days: days })
                });

                if (res.ok) {
                    const responseData = await res.json();
                    console.log(`Demo data for ${days} days loaded!`);

                    // Show Disclaimer
                    const banner = document.getElementById('demo-disclaimer');
                    if (banner) banner.classList.remove('hidden');

                    // Manually switch to history tab WITHOUT triggering fetchHistory
                    // Deactivate all tabs
                    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    document.querySelectorAll('.tab-content').forEach(c => {
                        c.classList.remove('active');
                        c.classList.add('hidden');
                    });

                    // Activate History tab UI
                    const historyBtn = document.querySelector('[data-tab="history"]');
                    if (historyBtn) historyBtn.classList.add('active');

                    const historyContent = document.getElementById('view-history');
                    if (historyContent) {
                        historyContent.classList.remove('hidden');
                        historyContent.classList.add('active');
                    }

                    // Render the returned demo data directly
                    renderHistory(responseData.history);
                } else {
                    console.error('Failed to load demo data.');
                }
            } catch (e) {
                console.error(e);
                console.error('Error calling demo API');
            }
        });
    });

    // Close Demo Banner
    const closeBannerBtn = document.getElementById('close-demo-banner');
    if (closeBannerBtn) {
        closeBannerBtn.addEventListener('click', () => {
            document.getElementById('demo-disclaimer').classList.add('hidden');
        });
    }
});

async function fetchHistory() {
    const container = document.getElementById('history-container');
    container.innerHTML = '<div class="loading-text">Loading history...</div>';

    try {
        const response = await fetch('/api/race/history');
        if (!response.ok) throw new Error('Failed to fetch history');
        const history = await response.json();
        renderHistory(history);
    } catch (error) {
        console.error("History fetch error:", error);
        container.innerHTML = '<div class="error-text">Could not load history.</div>';
    }
}

function renderHistory(history) {
    const container = document.getElementById('history-container');
    container.innerHTML = '';

    if (!history || !history.days || Object.keys(history.days).length === 0) {
        container.innerHTML = '<div class="training-message">No history data allocated yet. Wait for API updates.</div>';
        return;
    }

    const days = Object.keys(history.days).sort((a, b) => Number(a) - Number(b));

    // Collect all unique player tags
    const allTags = new Set();
    days.forEach(day => {
        const dayObj = history.days[day];
        // Handle potentially nested 'players' object
        const participants = dayObj.players || dayObj;
        if (participants) {
            Object.keys(participants).forEach(tag => allTags.add(tag));
        }
    });

    const table = document.createElement('table');
    table.className = 'history-table';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Player</th>';

    days.forEach(day => {
        const dayObj = history.days[day];
        let dateStr = '';
        if (dayObj.timestamp) {
            const d = new Date(dayObj.timestamp);
            dateStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        headerRow.innerHTML += `<th class="history-val">Day ${day}<div class="timestamp-small">${dateStr}</div></th>`;
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');

    // Prepare player list
    const playerArray = [];
    allTags.forEach(tag => {
        let name = tag;
        // Find latest name
        for (let i = days.length - 1; i >= 0; i--) {
            const d = days[i];
            const dayObj = history.days[d];
            const participants = dayObj.players || dayObj;
            if (participants && participants[tag]) {
                name = participants[tag].name;
                break;
            }
        }
        playerArray.push({ tag, name });
    });

    playerArray.sort((a, b) => a.name.localeCompare(b.name));

    playerArray.forEach(p => {
        const tr = document.createElement('tr');
        let rowHtml = `<td><div class="player-name">${p.name}</div><div class="player-tag">${p.tag}</div></td>`;

        let isPerfectPlayer = true; // Assume perfect until proven otherwise

        days.forEach((day, index) => {
            const currentDayObj = history.days[day];
            const prevDayObj = index > 0 ? history.days[days[index - 1]] : null;

            const currentPlayers = currentDayObj.players || currentDayObj;
            const prevPlayers = prevDayObj ? (prevDayObj.players || prevDayObj) : {};

            const currP = currentPlayers[p.tag];
            const prevP = prevPlayers[p.tag];

            let decksTotal = currP ? currP.decksUsed : 0;
            let decksPrev = prevP ? prevP.decksUsed : 0;

            let dailyDecks = decksTotal - decksPrev;
            if (dailyDecks < 0) dailyDecks = 0;
            if (dailyDecks < 4) isPerfectPlayer = false; // logic: if any day is less than 4, not perfect

            // Color Logic
            let valClass = 'val-miss';
            if (dailyDecks >= 4) valClass = 'val-perfect';

            rowHtml += `<td class="history-val ${valClass}">${dailyDecks} / 4</td>`;
        });

        if (isPerfectPlayer) {
            tr.classList.add('history-row-completed');
        }

        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);

    // Re-apply hidden state if filter was active (e.g. after refresh)
    const toggleBtn = document.getElementById('toggle-history-completed');
    if (toggleBtn && toggleBtn.dataset.hidden === 'true') {
        table.querySelectorAll('.history-row-completed').forEach(row => row.classList.add('hidden-row'));
    }
}


async function fetchRaceData() {
    const statusEl = document.getElementById('loading');

    try {
        const response = await fetch('/api/race');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        renderData(data);
        statusEl.textContent = 'Updated just now';
        statusEl.style.color = 'var(--accent-green)';
    } catch (error) {
        console.error('Fetch error:', error);
        statusEl.textContent = 'Error loading data. Check console/server logs.';
        statusEl.style.color = 'var(--accent-red)';
    }
}

async function fetchLastWarLog(clanTag) {
    const section = document.getElementById('last-war-section');
    const list = document.getElementById('last-war-list');

    section.classList.remove('hidden');
    list.innerHTML = '<div class="loading-text">Loading last war stats...</div>';

    try {
        const response = await fetch('/api/race/log');
        if (!response.ok) throw new Error('Failed to fetch log');
        const data = await response.json();
        renderLastWarLog(data, clanTag);
    } catch (error) {
        console.error("Log fetch error:", error);
        list.innerHTML = '<div class="error-text">Could not load last war stats.</div>';
    }
}

function renderLastWarLog(data, clanTag) {
    const list = document.getElementById('last-war-list');
    const summary = document.getElementById('last-war-summary');
    list.innerHTML = '';
    summary.innerHTML = '';

    if (!data.items || data.items.length === 0) {
        list.innerHTML = '<div>No past war data found.</div>';
        return;
    }

    const lastWar = data.items[0];

    // Find my clan using the passed clanTag
    let myClanStanding = null;
    if (clanTag) myClanStanding = lastWar.standings.find(s => s.clan.tag === clanTag);

    if (!myClanStanding) {
        myClanStanding = lastWar.standings.find(s => s.clan.participants && s.clan.participants.length > 0);
    }

    if (!myClanStanding || !myClanStanding.clan.participants) {
        list.innerHTML = `<div>No data found for clan.</div>`;
        return;
    }

    const participants = myClanStanding.clan.participants;
    const maxPossibleDecks = 16 * 50;
    let totalDecksUsed = 0;

    participants.forEach(p => {
        totalDecksUsed += p.decksUsed;
    });

    const unusedDecks = maxPossibleDecks - totalDecksUsed;

    summary.innerHTML = `
        <div class="summary-item">
            <span class="summary-label">Total Decks Used</span>
            <span class="summary-value">${totalDecksUsed} / ${maxPossibleDecks}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Unused Decks</span>
            <span class="summary-value highlight-red">${unusedDecks}</span>
        </div>
    `;

    participants.sort((a, b) => a.decksUsed - b.decksUsed);
    const filteredParticipants = participants.filter(p => p.decksUsed % 4 !== 0);

    if (filteredParticipants.length === 0) {
        list.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">No players found with partial deck usage (%4 != 0).</div>';
    }

    filteredParticipants.forEach(player => {
        const decksUsed = player.decksUsed;
        const totalPossible = 16;
        const isComplete = decksUsed >= totalPossible;
        const div = document.createElement('div');
        div.className = 'player-card';
        const statusClass = isComplete ? 'status-complete' : 'status-incomplete';

        div.innerHTML = `
            <div class="player-info">
                <span class="player-name">${player.name}</span>
                <span class="player-tag">Total Decks</span>
            </div>
            <div class="decks-status ${statusClass}">
                ${decksUsed} / ${totalPossible}
            </div>
        `;
        list.appendChild(div);
    });
}

function renderData(data) {
    if (data.clan) {
        document.getElementById('clan-name').textContent = `${data.clan.name} (${data.clan.tag})`;
    }

    const isTrainingDay = data.periodType === 'training';
    const warStatusEl = document.getElementById('war-status');
    const warDatesEl = document.getElementById('war-dates');
    const warDayLabel = document.getElementById('war-day');
    const incompleteCountLabel = document.getElementById('incomplete-count');
    const playerList = document.getElementById('player-list');
    const completedList = document.getElementById('completed-list');
    const toggleBtn = document.getElementById('toggle-completed');

    // 1. War Status Indicator
    if (isTrainingDay) {
        warStatusEl.textContent = "War has not yet started.";
        warDayLabel.textContent = "Training";
    } else {
        warStatusEl.textContent = "War started!!";
        warDayLabel.textContent = `Day ${data.periodIndex % 7 + 1} / 4`;
    }

    // 2. Date Range (Approximation from local time if not in API)
    // Most API responses for currentriverrace don't give the full week range, 
    // but we can show the current date or calculate the week if we had more info.
    // For now, let's show the current date or "Season X"
    const today = new Date();
    const options = { month: 'short', day: 'numeric' };
    warDatesEl.textContent = `${today.toLocaleDateString(undefined, options)}`;

    if (isTrainingDay) {
        incompleteCountLabel.textContent = "-";
        playerList.innerHTML = '<div class="training-message">War has not started yet. (Training Day)</div>';
        completedList.innerHTML = '';
        const clanTag = data.clan ? data.clan.tag : null;
        fetchLastWarLog(clanTag);
        return;
    }

    const participants = data.clan ? data.clan.participants : [];
    participants.sort((a, b) => (a.decksUsedToday || 0) - (b.decksUsedToday || 0));
    let incompleteCount = 0;

    playerList.innerHTML = '';
    completedList.innerHTML = '';

    participants.forEach(player => {
        const decksUsed = player.decksUsedToday || 0;
        const isComplete = decksUsed >= 4;
        if (!isComplete) incompleteCount++;

        const div = document.createElement('div');
        div.className = 'player-card';
        const statusClass = isComplete ? 'status-complete' : 'status-incomplete';
        const statusText = `${decksUsed} / 4`;

        div.innerHTML = `
            <div class="player-info">
                <span class="player-name">${player.name}</span>
                <span class="player-tag">${player.tag}</span>
            </div>
            <div class="decks-status ${statusClass}">
                ${statusText}
            </div>
        `;

        if (isComplete) completedList.appendChild(div);
        else playerList.appendChild(div);
    });

    incompleteCountLabel.textContent = incompleteCount;

    // Default: Show only incomplete. Ensure button shows correct text.
    if (completedList.classList.contains('hidden')) {
        toggleBtn.textContent = 'Show all players';
    } else {
        toggleBtn.textContent = 'Hide completed players';
    }
}
