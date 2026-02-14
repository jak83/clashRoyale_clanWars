// Global countdown interval
let countdownInterval = null;

/**
 * Pure function to calculate deck counter statistics
 * @param {Array} playerData - Array of {totalDecks, dailyDecks: {1: x, 2: y, ...}}
 * @param {string} selectedDay - 'all' or '1', '2', '3', '4'
 * @param {number} availableDays - Number of available days (1-4)
 * @returns {Object} {totalDecks, maxDecks, percentage}
 */
function calculateDeckCounterStats(playerData, selectedDay, availableDays) {
    let totalDecks = 0;
    let daysCount = 1;

    if (selectedDay === 'all') {
        // Sum total decks across all days
        totalDecks = playerData.reduce((sum, p) => sum + p.totalDecks, 0);
        daysCount = availableDays;
    } else {
        // Sum daily decks for selected day
        totalDecks = playerData.reduce((sum, p) => sum + (p.dailyDecks[selectedDay] || 0), 0);
        daysCount = 1;
    }

    // Use clan max capacity (50 players), not actual players in history
    // This shows "what % of our clan's potential did we use?"
    const maxDecks = 50 * 4 * daysCount;
    const percentage = maxDecks > 0 ? ((totalDecks / maxDecks) * 100).toFixed(1) : '0.0';

    return { totalDecks, maxDecks, percentage };
}

function updatePlayerCount() {
    const countElement = document.getElementById('player-count');
    if (!countElement) return;

    const table = document.querySelector('.history-table tbody');
    if (!table) {
        countElement.textContent = '';
        return;
    }

    const allRows = table.querySelectorAll('tr');
    const visibleRows = Array.from(allRows).filter(row => {
        const displayStyle = window.getComputedStyle(row).display;
        const hasHiddenClass = row.classList.contains('hidden-row');
        return displayStyle !== 'none' && !hasHiddenClass;
    });

    countElement.textContent = `${visibleRows.length} player${visibleRows.length !== 1 ? 's' : ''} shown`;
}

document.addEventListener('DOMContentLoaded', () => {
    // Load history by default
    fetchHistory();

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
            } else if (btn.dataset.tab === 'war-stats') {
                fetchWarStats();
            } else if (btn.dataset.tab === 'last-war') {
                // Check if already loaded? or just load again
                fetchRaceData().then(data => {
                    if (data && data.clan) fetchLastWarLog(data.clan.tag);
                });
            }
        });
    });

    // History Actions
    document.getElementById('refresh-history').addEventListener('click', () => fetchHistory(true));

    const toggleLeftPlayersBtn = document.getElementById('toggle-left-players');
    if (toggleLeftPlayersBtn) {
        toggleLeftPlayersBtn.addEventListener('click', () => {
            // Only toggle inactive left players (0 decks)
            const rows = document.querySelectorAll('tbody tr[data-hidden-by-default="true"]');
            const isHidden = toggleLeftPlayersBtn.dataset.hidden === 'true';

            rows.forEach(row => {
                if (isHidden) row.style.display = ''; // Show
                else row.style.display = 'none'; // Hide
            });

            // Flip state
            toggleLeftPlayersBtn.dataset.hidden = !isHidden;
            toggleLeftPlayersBtn.textContent = !isHidden ? 'Show Inactive Left Players' : 'Hide Inactive Left Players';

            // Visual toggle
            if (!isHidden) toggleLeftPlayersBtn.style.backgroundColor = '#666';
            else toggleLeftPlayersBtn.style.backgroundColor = 'var(--accent-orange)';

            // Update player count
            updatePlayerCount();
        });
    }

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

            // Update player count
            updatePlayerCount();
        });
    }

    // Refresh War Stats Button
    const refreshWarBtn = document.getElementById('refresh-war-stats');
    if (refreshWarBtn) {
        refreshWarBtn.addEventListener('click', () => fetchWarStats(true));
    }
});

async function fetchHistory(force = false) {
    const container = document.getElementById('history-container');
    container.innerHTML = '<div class="loading-text">Loading history...</div>';

    try {
        // Fetch both history and current clan members
        const [historyResponse, membersResponse] = await Promise.all([
            fetch(`/api/race/history${force ? '?force=true' : ''}`),
            fetch('/api/clan/members')
        ]);

        if (!historyResponse.ok) throw new Error('Failed to fetch history');

        const history = await historyResponse.json();
        let currentMemberTags = [];

        if (membersResponse.ok) {
            const membersData = await membersResponse.json();
            currentMemberTags = membersData.memberTags || [];
        } else {
            console.warn('Failed to fetch current members, will show all participants');
        }

        renderHistory(history, currentMemberTags);
    } catch (error) {
        console.error("History fetch error:", error);
        container.innerHTML = '<div class="error-text">Could not load history.</div>';
    }
}

async function fetchWarStats(force = false) {
    const container = document.getElementById('war-stats-container');
    container.innerHTML = '<div class="loading-text">Loading war statistics...</div>';

    try {
        const [raceResponse, logResponse] = await Promise.all([
            fetch(`/api/race${force ? '?force=true' : ''}`),
            fetch('/api/race/log')
        ]);

        if (!raceResponse.ok || !logResponse.ok) {
            throw new Error('Failed to fetch war stats');
        }

        const currentRace = await raceResponse.json();
        const raceLog = await logResponse.json();

        renderWarStats(currentRace, raceLog);
    } catch (error) {
        console.error("War stats fetch error:", error);
        container.innerHTML = '<div class="error-text">Could not load war statistics.</div>';
    }
}

function calculateTimeUntilReset() {
    const now = new Date();

    // Next reset is at 10:00 UTC (daily deck reset time)
    const nextReset = new Date(now);
    nextReset.setUTCHours(10, 0, 0, 0);

    // If we're past 10:00 UTC today, target tomorrow
    if (now >= nextReset) {
        nextReset.setUTCDate(nextReset.getUTCDate() + 1);
    }

    // ADJUSTMENT: User reports game clock is ~4 minutes ahead (reset happens earlier?)
    // Or we are "behind" by 4 mins.
    // If web shows 1h 04m and game shows 1h 00m, we are targeting a time 4 mins later than the game.
    // So we subtract 4 minutes from the target.
    nextReset.setMinutes(nextReset.getMinutes() - 4);

    const diff = nextReset - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
        hours,
        minutes,
        seconds,
        formatted: `${hours}h ${minutes}m ${seconds}s`
    };
}

function renderWarStats(currentRace, raceLog) {
    const container = document.getElementById('war-stats-container');
    container.innerHTML = '';

    // Get clan tag from current race data
    const clanTag = currentRace.clan?.tag;

    // Current War Section
    const currentSection = document.createElement('div');
    currentSection.className = 'war-section';
    currentSection.innerHTML = '<h3>⚔️ Current War</h3>';

    const currentStandings = currentRace.clans || [];
    const ourClan = currentStandings.find(c => c.tag === clanTag);

    if (currentRace.periodType === 'training') {
        currentSection.innerHTML += '<div class="training-message">Training Day - War has not started yet</div>';
    } else if (ourClan) {
        const sortedStandings = [...currentStandings].sort((a, b) => (b.periodPoints || 0) - (a.periodPoints || 0));
        const ourRank = sortedStandings.findIndex(c => c.tag === clanTag) + 1;

        const ourMedal = ourRank === 1 ? '🥇' : ourRank === 2 ? '🥈' : ourRank === 3 ? '🥉' : '';
        const medalDisplay = ourMedal || `${ourRank}th`;

        const timeRemaining = calculateTimeUntilReset();

        currentSection.innerHTML += `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Current Position</div>
                    <div class="stat-value" style="font-size: 3rem;">${ourMedal || ourRank}</div>
                    <div class="stat-label" style="margin-top: 0.5rem;">${ourMedal ? '' : `${ourRank} / ${currentStandings.length}`}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Time Until Deck Reset</div>
                    <div class="stat-value" id="countdown-timer" style="font-size: 2rem;">${timeRemaining.formatted}</div>
                    <div class="stat-label" style="margin-top: 0.5rem;">Resets daily at 10:00 UTC</div>
                </div>
            </div>
            <h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem;">🏆 Live Standings</h4>
            <div class="standings-table">
                ${sortedStandings.map((clan, index) => {
            const isUs = clan.tag === clanTag;
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            return `
                        <div class="standing-row ${isUs ? 'standing-us' : ''}">
                            <span class="standing-rank">${medal} ${index + 1}</span>
                            <span class="standing-name">${clan.name}</span>
                            <span class="standing-fame">${(clan.periodPoints || 0).toLocaleString()}</span>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    }

    container.appendChild(currentSection);

    // Last War Section
    if (raceLog.items && raceLog.items.length > 0) {
        const lastWar = raceLog.items[0];
        const lastWarClan = lastWar.standings.find(s => s.clan.tag === clanTag);

        if (lastWarClan) {
            const lastSection = document.createElement('div');
            lastSection.className = 'war-section';
            lastSection.style.marginTop = '2rem';
            lastSection.innerHTML = '<h3>📜 Last War Results</h3>';

            const lastMedal = lastWarClan.rank === 1 ? '🥇' : lastWarClan.rank === 2 ? '🥈' : lastWarClan.rank === 3 ? '🥉' : '';
            const resultClass = lastWarClan.rank === 1 ? 'result-won' : '';
            const trophyChange = lastWarClan.trophyChange;
            const trophyClass = trophyChange > 0 ? 'trophy-positive' : trophyChange < 0 ? 'trophy-negative' : '';

            lastSection.innerHTML += `
                <div class="stats-grid">
                    <div class="stat-card ${resultClass}">
                        <div class="stat-label">Final Position</div>
                        <div class="stat-value" style="font-size: 3rem;">${lastMedal || lastWarClan.rank}</div>
                        <div class="stat-label" style="margin-top: 0.5rem;">${lastMedal ? '' : `${lastWarClan.rank} / ${lastWar.standings.length}`}</div>
                    </div>
                    <div class="stat-card ${trophyClass}">
                        <div class="stat-label">Trophy Change</div>
                        <div class="stat-value">${trophyChange > 0 ? '+' : ''}${trophyChange}</div>
                    </div>
                </div>
                <h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem;">🏁 Final Standings</h4>
                <div class="standings-table">
                    ${lastWar.standings.map((standing, index) => {
                const isUs = standing.clan.tag === clanTag;
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
                const tChange = standing.trophyChange;
                const trophyColor = tChange > 0 ? 'var(--accent-green)' : tChange < 0 ? 'var(--accent-red)' : '';
                return `
                            <div class="standing-row ${isUs ? 'standing-us' : ''}">
                                <span class="standing-rank">${medal} ${standing.rank}</span>
                                <span class="standing-name">${standing.clan.name}</span>
                                <span class="standing-fame">${standing.clan.fame.toLocaleString()}</span>
                                <span class="standing-trophy" style="color: ${trophyColor}">${tChange > 0 ? '+' : ''}${tChange}</span>
                            </div>
                        `;
            }).join('')}
                </div>
            `;

            container.appendChild(lastSection);
        }
    }

    // Player Stats Section
    if (currentRace.periodType !== 'training' && ourClan && ourClan.participants) {
        const playerSection = document.createElement('div');
        playerSection.className = 'war-section';
        playerSection.style.marginTop = '2rem';
        playerSection.innerHTML = '<h3>👥 Player Statistics</h3>';

        const participants = ourClan.participants;
        const sortedByFame = [...participants].sort((a, b) => (b.fame || 0) - (a.fame || 0));

        // Calculate totals for header
        const totalFame = participants.reduce((sum, p) => sum + (p.fame || 0), 0);
        const totalDecksUsed = participants.reduce((sum, p) => sum + (p.decksUsed || 0), 0);
        const totalDecksToday = participants.reduce((sum, p) => sum + (p.decksUsedToday || 0), 0);
        const totalBoatAttacks = participants.reduce((sum, p) => sum + (p.boatAttacks || 0), 0);

        playerSection.innerHTML += `
            <div class="player-stats-table">
                <table class="stats-table war-performance-table">
                    <thead>
                        <tr>
                            <th style="width: 50px;">#</th>
                            <th>Participants: ${participants.length}</th>
                            <th class="stat-column" title="Total Decks">${totalDecksUsed} 👑</th>
                            <th class="stat-column" title="Decks Today">${totalDecksToday} 👑</th>
                            <th class="stat-column" title="Boat Attacks">${totalBoatAttacks} 🛡️</th>
                            <th class="stat-column fame-column" title="Total Points">${totalFame.toLocaleString()} 🏅</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedByFame.map((player, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            return `
                                <tr>
                                    <td class="rank-cell">${index + 1}</td>
                                    <td class="player-name-cell">
                                        <div style="font-weight: 600;">${medal} ${player.name}</div>
                                        <div style="font-size: 0.75rem; color: var(--text-secondary);">Member</div>
                                    </td>
                                    <td class="stat-column">${player.decksUsed || 0} 👑</td>
                                    <td class="stat-column">${player.decksUsedToday || 0}/4 👑</td>
                                    <td class="stat-column">${player.boatAttacks || 0} 🛡️</td>
                                    <td class="stat-column fame-column">${(player.fame || 0).toLocaleString()} 🏅</td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.appendChild(playerSection);
    }

    // Start countdown timer update (only if not training day)
    if (countdownInterval) clearInterval(countdownInterval);

    if (currentRace.periodType !== 'training') {
        countdownInterval = setInterval(() => {
            const timerEl = document.getElementById('countdown-timer');
            if (timerEl) {
                const timeRemaining = calculateTimeUntilReset();
                timerEl.textContent = timeRemaining.formatted;
            } else {
                // Element not found, clear interval
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
        }, 1000);
    }
}

function renderHistory(history, currentMemberTags = []) {
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
    // Store member tags and history on table for filtering
    table.dataset.currentMembers = JSON.stringify(currentMemberTags);
    table.dataset.history = JSON.stringify(history);

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // Player name header with sort
    const playerHeader = document.createElement('th');
    playerHeader.innerHTML = '<span class="sort-header">Player <span class="sort-arrow"></span></span>';
    playerHeader.classList.add('sortable');
    playerHeader.dataset.column = 'player';
    playerHeader.dataset.sort = 'none';
    headerRow.appendChild(playerHeader);

    // Day headers with sort
    days.forEach(day => {
        const dayObj = history.days[day];
        let dateStr = '';
        if (dayObj.timestamp) {
            const d = new Date(dayObj.timestamp);
            dateStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        const dayHeader = document.createElement('th');
        dayHeader.className = 'history-val sortable';
        dayHeader.innerHTML = `<span class="sort-header">Day ${day} <span class="sort-arrow"></span></span><div class="timestamp-small">${dateStr}</div>`;
        dayHeader.dataset.column = `day${day}`;
        dayHeader.dataset.sort = 'none';
        dayHeader.dataset.dayIndex = days.indexOf(day);
        headerRow.appendChild(dayHeader);
    });

    // Total Points header with sort (rightmost column)
    const pointsHeader = document.createElement('th');
    pointsHeader.innerHTML = '<span class="sort-header">Points <span class="sort-arrow"></span></span>';
    pointsHeader.classList.add('sortable', 'history-val', 'points-header');
    pointsHeader.dataset.column = 'points';
    pointsHeader.dataset.sort = 'none';
    pointsHeader.title = 'Total points earned';
    headerRow.appendChild(pointsHeader);

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

    // Calculate total decks played for deck counter
    let totalDecksPlayed = 0;
    const maxDecksPerDay = 50 * 4; // Clan max capacity (50 players) × 4 decks - shows % of clan potential used

    playerArray.forEach(p => {
        const tr = document.createElement('tr');

        // Check if player left (not in current clan members)
        const hasLeft = currentMemberTags.length > 0 && !currentMemberTags.includes(p.tag);

        const playerNameDisplay = hasLeft ? `${p.name} <span style="color: var(--text-secondary); font-size: 0.75rem;">(left)</span>` : p.name;

        // Store tag for filtering
        tr.dataset.playerTag = p.tag;
        tr.dataset.hasLeft = hasLeft;
        let rowHtml = `<td><div class="player-name">${playerNameDisplay}</div><div class="player-tag">${p.tag}</div></td>`;

        let isPerfectPlayer = true; // Assume perfect until proven otherwise
        let totalDecksForPlayer = 0; // Track total decks for this player
        let totalPointsForPlayer = 0; // Track total points for this player
        const dailyPointsMap = {}; // Track points per day
        const dailyDecksMap = {}; // Track decks per day

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

            dailyDecksMap[day] = dailyDecks;
            totalDecksForPlayer += dailyDecks;

            // Calculate daily points (difference from previous day)
            let fameTotal = currP ? (currP.fame || 0) : 0;
            let famePrev = prevP ? (prevP.fame || 0) : 0;
            let dailyPoints = fameTotal - famePrev;
            if (dailyPoints < 0) dailyPoints = 0;

            dailyPointsMap[day] = dailyPoints;
            totalPointsForPlayer = fameTotal; // Keep cumulative total

            // Color Logic
            let valClass = 'val-miss';
            if (dailyDecks >= 4) valClass = 'val-perfect';

            rowHtml += `<td class="history-val ${valClass}" data-day="${day}">${dailyDecks} / 4</td>`;
        });

        // Add points column as rightmost column
        const pointsDisplay = totalPointsForPlayer > 0 ? totalPointsForPlayer.toLocaleString() : '-';
        rowHtml += `<td class="history-val points-cell">${pointsDisplay}</td>`;

        // Add to total deck count
        totalDecksPlayed += totalDecksForPlayer;

        // Store total decks and points on row for filtering/sorting
        tr.dataset.totalDecks = totalDecksForPlayer;
        tr.dataset.totalPoints = totalPointsForPlayer;
        tr.dataset.dailyPoints = JSON.stringify(dailyPointsMap); // Store daily points for filtering
        tr.dataset.dailyDecks = JSON.stringify(dailyDecksMap); // Store daily decks for filtering

        if (isPerfectPlayer) {
            tr.classList.add('history-row-completed');
            tr.classList.add('hidden-row'); // Hidden by default
        }

        // Only hide departed players with 0 decks by default
        if (hasLeft && totalDecksForPlayer === 0) {
            tr.style.display = 'none';
            tr.dataset.hiddenByDefault = 'true';
        }

        if (hasLeft) {
            tr.style.opacity = '0.6';
            tr.title = totalDecksForPlayer > 0 ? 'Player left the clan (played decks)' : 'Player left the clan (no decks played)';
        }

        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);

    // Add sorting functionality to headers
    addTableSorting(table, history, days);

    // Initialize button states
    const toggleBtn = document.getElementById('toggle-history-completed');
    if (toggleBtn && !toggleBtn.dataset.hidden) {
        toggleBtn.dataset.hidden = 'true';
        toggleBtn.textContent = 'Show Completed';
        toggleBtn.style.backgroundColor = '#666';
    }

    const toggleLeftBtn = document.getElementById('toggle-left-players');
    if (toggleLeftBtn) {
        // Always reset to default state: inactive left players are hidden
        toggleLeftBtn.dataset.hidden = 'true';
        toggleLeftBtn.textContent = 'Show Inactive Left Players';
        toggleLeftBtn.style.backgroundColor = '#666';

        // Rows are already hidden by default in the row creation logic
    }

    // Display deck counter using pure function (consistent with filter logic)
    const deckCounter = document.createElement('div');
    deckCounter.className = 'deck-counter';
    deckCounter.id = 'deck-counter';
    deckCounter.style.cssText = 'text-align: center; margin: 0.5rem 0; font-size: 1.1rem; font-weight: 600; color: var(--accent-blue);';

    // Use pure function for calculation (showing all days)
    const playerDataForCounter = playerArray.map(p => ({
        totalDecks: totalDecksPlayed / playerArray.length,  // Average per player for now
        dailyDecks: {}
    }));

    // Calculate max based on clan capacity (50 players), not actual players in history
    const maxDecks = 50 * 4 * days.length;
    const percentage = maxDecks > 0 ? ((totalDecksPlayed / maxDecks) * 100).toFixed(1) : '0.0';
    deckCounter.innerHTML = `<span style="color: var(--accent-green);">${totalDecksPlayed}</span> / ${maxDecks} decks played (${percentage}%)`;

    // Store max decks per day on table for filtering
    table.dataset.maxDecksPerDay = 50 * 4; // Clan capacity, not actual player count

    // Insert deck counter before the table
    container.insertBefore(deckCounter, table);

    // Create podium showing top 3 by points
    const podium = createPodium(history, days);
    container.appendChild(podium);

    // Create day filter buttons - always show 1-4
    createDayFilters(['1', '2', '3', '4'], table);

    // Update player count after rendering
    updatePlayerCount();
}

function updatePodium(history, days) {
    const existingPodium = document.getElementById('history-podium');
    if (existingPodium) {
        const newPodium = createPodium(history, days);
        existingPodium.replaceWith(newPodium);
    }
}

function createPodium(history, days) {
    const podiumContainer = document.createElement('div');
    podiumContainer.id = 'history-podium';
    podiumContainer.style.cssText = 'display: flex; justify-content: center; gap: 1.5rem; margin: 2rem 0; flex-wrap: wrap;';

    // Calculate top 3 players by total points
    const playerStats = {};

    // Collect all unique players
    const allTags = new Set();
    days.forEach(day => {
        const dayObj = history.days[day];
        const participants = dayObj.players || dayObj;
        Object.keys(participants).forEach(tag => allTags.add(tag));
    });

    // Calculate stats for each player (daily decks and points for filtered days)
    allTags.forEach(tag => {
        let name = tag;
        let totalPoints = 0;
        let totalDecks = 0;

        days.forEach((day) => {
            const dayNum = parseInt(day);
            const dayObj = history.days[day];

            // IMPORTANT: Look at ACTUAL previous day in history, not just previous in filtered array
            const prevDay = String(dayNum - 1);
            const prevDayObj = dayNum > 1 ? history.days[prevDay] : null;

            const participants = dayObj.players || dayObj;
            const prevParticipants = prevDayObj ? (prevDayObj.players || prevDayObj) : {};

            if (participants[tag]) {
                name = participants[tag].name;

                // Calculate DAILY points (current - previous day in history)
                const currentPoints = participants[tag].fame || 0;
                const prevPoints = prevParticipants[tag] ? (prevParticipants[tag].fame || 0) : 0;
                const dailyPoints = Math.max(0, currentPoints - prevPoints);
                totalPoints += dailyPoints;

                // Calculate DAILY decks (current - previous day in history)
                const currentDecks = participants[tag].decksUsed || 0;
                const prevDecks = prevParticipants[tag] ? (prevParticipants[tag].decksUsed || 0) : 0;
                const dailyDecks = Math.max(0, currentDecks - prevDecks);
                totalDecks += dailyDecks;
            }
        });

        playerStats[tag] = { name, totalPoints, totalDecks };
    });

    // Sort by points and get top 3
    const top3 = Object.values(playerStats)
        .filter(p => p.totalPoints > 0) // Only include players with points
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 3);

    if (top3.length === 0) {
        podiumContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary);">No data yet</div>';
        return podiumContainer;
    }

    // Create podium cards
    const medals = ['🥇', '🥈', '🥉'];
    const positions = ['1st', '2nd', '3rd'];
    const colors = ['var(--accent-green)', '#C0C0C0', '#CD7F32'];

    top3.forEach((player, index) => {
        const card = document.createElement('div');
        card.style.cssText = `
            background: var(--card-bg);
            border: 3px solid ${colors[index]};
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            min-width: 180px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;

        card.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 0.5rem;">${medals[index]}</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.1em;">${positions[index]} Place</div>
            <div style="font-weight: 700; font-size: 1.2rem; margin: 0.5rem 0; color: var(--text-primary);">${player.name}</div>
            <div style="color: ${colors[index]}; font-size: 1.5rem; font-weight: 700; margin: 0.5rem 0;">${player.totalPoints.toLocaleString()} pts</div>
            <div style="color: var(--text-secondary); font-size: 0.9rem;">${player.totalDecks} / ${days.length * 4} decks</div>
        `;

        podiumContainer.appendChild(card);
    });

    return podiumContainer;
}

function addTableSorting(table, history, days) {
    const headers = table.querySelectorAll('th.sortable');

    headers.forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            const column = header.dataset.column;
            const currentSort = header.dataset.sort;

            // Reset all other headers
            headers.forEach(h => {
                if (h !== header) {
                    h.dataset.sort = 'none';
                    const arrow = h.querySelector('.sort-arrow');
                    if (arrow) arrow.textContent = '';
                }
            });

            // Toggle sort direction
            let newSort = 'asc';
            if (currentSort === 'none' || currentSort === 'desc') {
                newSort = 'asc';
            } else {
                newSort = 'desc';
            }

            header.dataset.sort = newSort;
            const arrow = header.querySelector('.sort-arrow');
            if (arrow) {
                arrow.textContent = newSort === 'asc' ? ' ↑' : ' ↓';
            }

            // Sort the table
            sortTable(table, column, newSort, header.dataset.dayIndex, history, days);
        });
    });
}

function sortTable(table, column, direction, dayIndex, history, days) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    rows.sort((a, b) => {
        let aValue, bValue;

        if (column === 'player') {
            // Sort by player name
            aValue = a.querySelector('.player-name').textContent.trim().toLowerCase();
            bValue = b.querySelector('.player-name').textContent.trim().toLowerCase();

            // Remove "(left)" suffix for fair comparison
            aValue = aValue.replace(' (left)', '');
            bValue = bValue.replace(' (left)', '');

            return direction === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        } else if (column.startsWith('day')) {
            // Sort by deck usage for specific day
            const colIndex = parseInt(dayIndex) + 1; // +1 because player column is 0
            const aCells = a.querySelectorAll('td');
            const bCells = b.querySelectorAll('td');

            if (aCells[colIndex] && bCells[colIndex]) {
                // Extract number from "X / 4" format
                const aText = aCells[colIndex].textContent.trim();
                const bText = bCells[colIndex].textContent.trim();
                aValue = parseInt(aText.split('/')[0].trim());
                bValue = parseInt(bText.split('/')[0].trim());

                return direction === 'asc'
                    ? aValue - bValue
                    : bValue - aValue;
            }
        } else if (column === 'points') {
            // Sort by currently displayed points (respects day filter)
            const aPointsCell = a.querySelector('.points-cell');
            const bPointsCell = b.querySelector('.points-cell');

            if (aPointsCell && bPointsCell) {
                const aText = aPointsCell.textContent.trim();
                const bText = bPointsCell.textContent.trim();

                // Handle "-" as 0
                aValue = aText === '-' ? 0 : parseInt(aText.replace(/,/g, '')) || 0;
                bValue = bText === '-' ? 0 : parseInt(bText.replace(/,/g, '')) || 0;
            } else {
                aValue = 0;
                bValue = 0;
            }

            return direction === 'asc'
                ? aValue - bValue
                : bValue - aValue;
        }

        return 0;
    });

    // Re-append sorted rows
    rows.forEach(row => tbody.appendChild(row));
}

function createDayFilters(days, table) {
    const filterContainer = document.getElementById('day-filter-buttons');
    if (!filterContainer || days.length === 0) return;

    filterContainer.innerHTML = '';
    filterContainer.style.display = 'flex';

    // Check which days have data
    const daysWithData = checkDaysWithData(table);

    // "Show All" button
    const allBtn = document.createElement('button');
    allBtn.className = 'day-filter-btn';
    allBtn.textContent = 'Show All';
    allBtn.dataset.day = 'all';
    allBtn.dataset.testid = 'filter-show-all';
    allBtn.addEventListener('click', () => filterByDay('all', table, allBtn));
    filterContainer.appendChild(allBtn);

    // Individual day buttons
    days.forEach((day, index) => {
        const btn = document.createElement('button');
        btn.className = 'day-filter-btn';
        btn.textContent = `Day ${day}`;
        btn.dataset.day = day;
        btn.dataset.testid = `filter-day-${day}`;

        // Gray out if no data
        const dayStr = String(day).trim();
        const hasData = daysWithData.includes(dayStr);

        if (!hasData) {
            btn.classList.add('no-data');
            btn.title = 'No data available for this day';
        }

        // Add click listener to all buttons (even grayed out ones)
        btn.addEventListener('click', () => filterByDay(day, table, btn));

        filterContainer.appendChild(btn);
    });

    // Auto-select the highest day that has data
    for (let i = daysWithData.length - 1; i >= 0; i--) {
        const dayToSelect = daysWithData[i];
        const btnToActivate = filterContainer.querySelector(`[data-day="${dayToSelect}"]`);
        if (btnToActivate && !btnToActivate.classList.contains('no-data')) {
            btnToActivate.classList.add('active');
            filterByDay(dayToSelect, table, btnToActivate, true);
            break;
        }
    }
}

function checkDaysWithData(table) {
    const daysWithData = [];
    const headerCells = table.querySelectorAll('thead th');

    // If a day column exists, it has data (even if everyone has 0/4)
    headerCells.forEach((th, index) => {
        if (index === 0) return; // Skip player name column

        const dayMatch = th.textContent.match(/Day (\d+)/);
        if (dayMatch) {
            const dayNum = String(dayMatch[1]).trim();
            daysWithData.push(dayNum);
        }
    });

    return daysWithData;
}

function filterByDay(selectedDay, table, activeBtn, silent = false) {
    // Update active button
    if (!silent) {
        document.querySelectorAll('.day-filter-btn').forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    // "Show All" should reveal ALL players (completed + inactive left)
    if (selectedDay === 'all') {
        table.querySelectorAll('tbody tr').forEach(row => {
            // Show completed players
            row.classList.remove('hidden-row');
            // Show inactive left players
            if (row.dataset.hiddenByDefault === 'true') {
                row.style.display = '';
            }
        });

        // Update toggle button states to reflect visible state
        const toggleCompletedBtn = document.getElementById('toggle-history-completed');
        if (toggleCompletedBtn) {
            toggleCompletedBtn.dataset.hidden = 'false';
            toggleCompletedBtn.textContent = 'Hide Completed';
            toggleCompletedBtn.style.backgroundColor = '';
        }

        const toggleLeftBtn = document.getElementById('toggle-left-players');
        if (toggleLeftBtn) {
            toggleLeftBtn.dataset.hidden = 'false';
            toggleLeftBtn.textContent = 'Hide Inactive Left Players';
            toggleLeftBtn.style.backgroundColor = '';
        }
    }

    // Update podium based on filtered days
    const history = table.dataset.history ? JSON.parse(table.dataset.history) : null;
    if (history) {
        const filteredDays = selectedDay === 'all'
            ? Object.keys(history.days).sort()
            : [String(selectedDay)];
        updatePodium(history, filteredDays);
    }

    // Get all column indices (0 = player name, 1+ = days)
    // Do this BEFORE checking if day exists, and use original headers
    const headerCells = table.querySelectorAll('thead th');
    const dayColumns = [];

    headerCells.forEach((th, index) => {
        if (index === 0) return; // Skip player name column

        // FIX: Use originalHeader if it exists (header was changed to "Decks")
        const headerText = th.dataset.originalHeader || th.textContent;
        const dayMatch = headerText.match(/Day (\d+)/);

        if (dayMatch) {
            dayColumns.push({ index, day: dayMatch[1] });
        }
    });

    // Check if selected day has data
    const container = document.getElementById('history-container');
    if (selectedDay !== 'all') {
        let dayExists = dayColumns.some(col => col.day === String(selectedDay));

        if (!dayExists) {
            container.innerHTML = `<div class="training-message" style="text-align: center; padding: 2rem; font-size: 1.2rem;">WAR DAY ${selectedDay} has not yet started</div>`;
            return;
        }
    }

    // Restore table if it was replaced with message
    if (!container.querySelector('.history-table')) {
        container.innerHTML = '';
        container.appendChild(table);
    }

    // Show/hide columns
    if (selectedDay === 'all') {
        // Show all columns and restore original headers
        headerCells.forEach(th => {
            th.style.display = '';
            // Restore original day header text if it was changed
            if (th.dataset.originalHeader) {
                const sortArrow = th.querySelector('.sort-arrow');
                const timestamp = th.querySelector('.timestamp-small');
                th.querySelector('.sort-header').childNodes[0].textContent = th.dataset.originalHeader + ' ';
            }
        });
        table.querySelectorAll('tbody td').forEach(td => td.style.display = '');
    } else {
        // Show only player name + selected day + points
        headerCells.forEach((th, index) => {
            if (index === 0) {
                th.style.display = ''; // Always show player name
            } else if (th.classList.contains('points-header') || th.textContent.includes('Points')) {
                th.style.display = ''; // Always show points column
            } else {
                // FIX: Use originalHeader if it exists, otherwise use current text
                const headerText = th.dataset.originalHeader || th.textContent;
                const dayMatch = headerText.match(/Day (\d+)/);

                if (dayMatch && dayMatch[1] === selectedDay.toString()) {
                    th.style.display = '';
                    // Store original header text and change to "Decks"
                    if (!th.dataset.originalHeader) {
                        th.dataset.originalHeader = dayMatch[0];
                    }
                    const sortArrow = th.querySelector('.sort-arrow');
                    th.querySelector('.sort-header').childNodes[0].textContent = 'Decks ';
                } else {
                    th.style.display = 'none';
                }
            }
        });

        table.querySelectorAll('tbody tr').forEach(row => {
            row.querySelectorAll('td').forEach((td, index) => {
                if (index === 0) {
                    td.style.display = ''; // Always show player name
                } else if (td.classList.contains('points-cell')) {
                    td.style.display = ''; // Always show points column
                } else {
                    const correspondingDay = dayColumns[index - 1];
                    td.style.display = (correspondingDay && correspondingDay.day === selectedDay.toString()) ? '' : 'none';
                }
            });
        });
    }

    // Update points column based on filtered days
    table.querySelectorAll('tbody tr').forEach(row => {
        const pointsCell = row.querySelector('.points-cell');
        if (!pointsCell) return;

        const dailyPointsData = row.dataset.dailyPoints;
        const totalPoints = row.dataset.totalPoints;

        if (!dailyPointsData) return;

        try {
            const dailyPointsMap = JSON.parse(dailyPointsData);
            let displayPoints = 0;

            if (selectedDay === 'all') {
                // Show cumulative total
                displayPoints = parseInt(totalPoints) || 0;
            } else {
                // Show only selected day's points
                displayPoints = dailyPointsMap[selectedDay] || 0;
            }

            pointsCell.textContent = displayPoints > 0 ? displayPoints.toLocaleString() : '-';
        } catch (e) {
            console.error('Error parsing daily points:', e);
        }
    });

    // Update deck counter based on filtered days
    const deckCounter = document.getElementById('deck-counter');
    if (deckCounter) {
        // Gather data from DOM
        const playerData = Array.from(table.querySelectorAll('tbody tr')).map(row => ({
            totalDecks: parseInt(row.dataset.totalDecks) || 0,
            dailyDecks: (() => {
                try {
                    return JSON.parse(row.dataset.dailyDecks || '{}');
                } catch (e) {
                    console.error('Error parsing daily decks:', e);
                    return {};
                }
            })()
        }));

        // Debug: Log player count and data
        console.log(`[Deck Counter] Players in table: ${playerData.length}, Filtering by: ${selectedDay}`);

        const availableDays = Array.from(table.querySelectorAll('thead th'))
            .filter(th => th.textContent.match(/Day (\d+)/))
            .length;

        // Calculate stats (pure function, testable)
        const stats = calculateDeckCounterStats(playerData, selectedDay, availableDays);

        // Debug: Log calculation results
        console.log(`[Deck Counter] totalDecks: ${stats.totalDecks}, maxDecks: ${stats.maxDecks}, percentage: ${stats.percentage}%`);

        // Display result
        deckCounter.innerHTML = `<span style="color: var(--accent-green);">${stats.totalDecks}</span> / ${stats.maxDecks} decks played (${stats.percentage}%)`;
    }

    // Update player count after filtering
    updatePlayerCount();
}


async function fetchRaceData() {
    const statusEl = document.getElementById('loading');
    if (statusEl) statusEl.textContent = 'Loading...';

    try {
        const response = await fetch('/api/race');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        renderData(data);
        if (statusEl) {
            statusEl.textContent = 'Updated just now';
            statusEl.style.color = 'var(--accent-green)';
        }
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        if (statusEl) {
            statusEl.textContent = 'Error loading data. Check console/server logs.';
            statusEl.style.color = 'var(--accent-red)';
        }
        return null;
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
    // Live view elements removed - this function is now only used internally
    // All DOM manipulations are skipped if elements don't exist
    const clanNameEl = document.getElementById('clan-name');
    if (data.clan && clanNameEl) {
        clanNameEl.textContent = `${data.clan.name} (${data.clan.tag})`;
    }

    const isTrainingDay = data.periodType === 'training';
    const warStatusEl = document.getElementById('war-status');
    const warDatesEl = document.getElementById('war-dates');
    const warDayLabel = document.getElementById('war-day');
    const incompleteCountLabel = document.getElementById('incomplete-count');
    const playerList = document.getElementById('player-list');
    const completedList = document.getElementById('completed-list');
    const toggleBtn = document.getElementById('toggle-completed');

    // Skip rendering if live view elements don't exist
    if (!warStatusEl || !playerList) return;

    // 1. War Status Indicator
    if (isTrainingDay) {
        warStatusEl.textContent = "War has not yet started.";
        warDayLabel.textContent = "Training";
    } else {
        warStatusEl.textContent = "War started!!";
        warDayLabel.textContent = `Day ${(data.periodIndex % 7) - 2} / 4`;
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
