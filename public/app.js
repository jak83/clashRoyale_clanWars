document.addEventListener('DOMContentLoaded', () => {
    fetchRaceData();

    document.getElementById('toggle-completed').addEventListener('click', function () {
        const list = document.getElementById('completed-list');
        list.classList.toggle('hidden');
        this.textContent = list.classList.contains('hidden') ? 'Show Completed Players' : 'Hide Completed Players';
    });
});

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

    // Get the most recent war (index 0)
    const lastWar = data.items[0];

    // Find my clan using the passed clanTag
    let myClanStanding = null;

    if (clanTag) {
        // Tag coming from API might not have hash or might be formatted differently?
        // Usually API returns tags with #. Let's try exact match first.
        myClanStanding = lastWar.standings.find(s => s.clan.tag === clanTag);
    }

    // Fallback if tag match failed
    if (!myClanStanding) {
        console.warn("Could not find clan by tag:", clanTag, "Scanning for participants...");
        myClanStanding = lastWar.standings.find(s => s.clan.participants && s.clan.participants.length > 0);
    }

    if (!myClanStanding) {
        list.innerHTML = `<div>No data found for clan ${clanTag || ''} in last war log.</div>`;
        return;
    }

    // Check if we actually have participants
    if (!myClanStanding.clan.participants || myClanStanding.clan.participants.length === 0) {
        list.innerHTML = `<div>No participant list available for ${myClanStanding.clan.name}.</div>`;
        return;
    }

    const participants = myClanStanding.clan.participants;

    // Calculate Totals
    // User requested Max to be 16 * 50
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

    // Sort by decks used (ascending to show 0s first)
    participants.sort((a, b) => a.decksUsed - b.decksUsed);

    // User Request: "Add %4!=0 filtering".
    // This hides players who missed whole days (0, 4, 8, 12, 16) and shows only those with partial day participation.
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
    // 1. Set Clan Info
    if (data.clan) {
        document.getElementById('clan-name').textContent = `${data.clan.name} (${data.clan.tag})`;
    }

    // 2. Check for Training Day
    const isTrainingDay = data.periodType === 'training';
    const warDayLabel = document.getElementById('war-day');
    const incompleteCountLabel = document.getElementById('incomplete-count');
    const playerList = document.getElementById('player-list');
    const completedList = document.getElementById('completed-list');

    if (isTrainingDay) {
        warDayLabel.textContent = "Training Day";
        incompleteCountLabel.textContent = "-";
        playerList.innerHTML = '<div class="training-message">War has not started yet. (Training Day)</div>';
        completedList.innerHTML = '';

        // Fetch and show last war stats
        // Pass the clan tag from the current race data
        const clanTag = data.clan ? data.clan.tag : null;
        fetchLastWarLog(clanTag);
        return; // Stop rendering players
    }

    // 3. Determine Current War Day
    // The API returns 'periodIndex'. In river race, it's typically 0-3 for training, 4-7 for race days?
    // Actually, 'periodIndex' resets every week.
    // 'sectionIndex' might separate weeks.
    // simpler calculation: We just need to know if decks are used.
    // The API structure for participants is inside 'clan.participants' usually.
    // Let's check the structure returned. 
    // Docs say: clan object contains 'participants' list.

    const participants = data.clan ? data.clan.participants : [];

    // Sort: Least decks used first
    participants.sort((a, b) => a.decksUsedToday - b.decksUsedToday);


    let incompleteCount = 0;

    playerList.innerHTML = '';
    completedList.innerHTML = '';

    participants.forEach(player => {
        const decksUsed = player.decksUsedToday || 0;
        const isComplete = decksUsed >= 4;

        if (!isComplete) incompleteCount++;

        const createPlayerCard = (player, decksUsed, isComplete) => {
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
            return div;
        };

        const card = createPlayerCard(player, decksUsed, isComplete);

        if (isComplete) {
            completedList.appendChild(card);
        } else {
            playerList.appendChild(card);
        }
    });

    incompleteCountLabel.textContent = incompleteCount;
    // Section index indicates the week. +1 for user friendliness if needed, or just day of week
    warDayLabel.textContent = `Day ${data.periodIndex % 7 + 1} / 4`;
}
