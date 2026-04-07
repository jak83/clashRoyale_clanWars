const fs = require('fs');
const path = require('path');

/**
 * Resolve storage paths for a given clan.
 * For 'default' (legacy single-clan mode), paths are the same as before:
 *   ongoing/history.json and history/WarData_week_*.json
 * For named clans:
 *   clans/{clanId}/ongoing/history.json and clans/{clanId}/history/WarData_week_*.json
 */
function getStoragePaths(clanId = 'default') {
    const base = process.env.HISTORY_PATH || __dirname;
    const clanDir = (!clanId || clanId === 'default')
        ? base
        : path.join(base, 'clans', clanId);
    return {
        ongoingDir: path.join(clanDir, 'ongoing'),
        historyDir: path.join(clanDir, 'history'),
        historyFile: path.join(clanDir, 'ongoing', 'history.json'),
    };
}

function ensureDirs(paths) {
    if (!fs.existsSync(paths.ongoingDir)) fs.mkdirSync(paths.ongoingDir, { recursive: true });
    if (!fs.existsSync(paths.historyDir)) fs.mkdirSync(paths.historyDir, { recursive: true });
}

// Ensure default clan directories exist at startup (backward compat)
ensureDirs(getStoragePaths('default'));

function getEmptyHistory() {
    return {
        seasonId: null,
        sectionIndex: null,
        days: {}
    };
}

function loadHistory(clanId = 'default') {
    const paths = getStoragePaths(clanId);
    if (!fs.existsSync(paths.historyFile)) {
        console.log(`[historyManager] No history file found for clan '${clanId}', starting fresh`);
        return getEmptyHistory();
    }
    try {
        const data = fs.readFileSync(paths.historyFile, 'utf8');
        const parsed = JSON.parse(data);
        console.log(`[historyManager] Loaded history for clan '${clanId}': sectionIndex=${parsed.sectionIndex}, days=${Object.keys(parsed.days || {}).join(',') || 'none'}`);
        return parsed;
    } catch (err) {
        console.error(`[historyManager] ERROR reading history file for clan '${clanId}':`, err.message);
        return getEmptyHistory();
    }
}

function saveHistory(history, clanId = 'default') {
    const paths = getStoragePaths(clanId);
    ensureDirs(paths);
    const tempFile = paths.historyFile + '.tmp';
    try {
        fs.writeFileSync(tempFile, JSON.stringify(history, null, 2));
        fs.renameSync(tempFile, paths.historyFile);
        console.log(`[historyManager] Saved history for clan '${clanId}': sectionIndex=${history.sectionIndex}, days=${Object.keys(history.days || {}).join(',') || 'none'}`);
    } catch (err) {
        console.error(`[historyManager] ERROR writing history file for clan '${clanId}':`, err.message);
        if (fs.existsSync(tempFile)) {
            try { fs.unlinkSync(tempFile); } catch (e) { }
        }
    }
}

function updateHistory(raceData, baseHistory = null, save = true, clanId = 'default') {
    if (!raceData || !raceData.clan) {
        console.warn('[historyManager] updateHistory called with missing raceData or clan');
        return baseHistory || loadHistory(clanId);
    }

    let history = baseHistory || loadHistory(clanId);

    const currentSeasonId = raceData.seasonId;
    const currentSectionIndex = raceData.sectionIndex;

    // 1. Check for New War Week -> Archive & Reset
    // Only archive if we have a valid previous section (not null) AND it changed.
    if (save && history.sectionIndex !== null &&
        (history.sectionIndex !== currentSectionIndex || history.seasonId !== currentSeasonId)) {

        console.log(`[historyManager] New war week detected for clan '${clanId}'. Archiving sectionIndex=${history.sectionIndex} → ${currentSectionIndex}`);

        // Archive Logic
        const paths = getStoragePaths(clanId);
        ensureDirs(paths);

        const dayKeys = Object.keys(history.days).sort();
        if (dayKeys.length > 0) {
            const startDay = history.days[dayKeys[0]];
            const endDay = history.days[dayKeys[dayKeys.length - 1]];

            const formatDate = (isoStr) => {
                if (!isoStr) return 'unknown';
                return new Date(isoStr).toISOString().split('T')[0];
            };

            const startTs = startDay.timestamp || new Date().toISOString();
            const endTs = endDay.timestamp || new Date().toISOString();
            const dateRange = `${formatDate(startTs)}_${formatDate(endTs)}`;

            const archiveName = `WarData_week_${history.sectionIndex}_${dateRange}.json`;
            const archivePath = path.join(paths.historyDir, archiveName);

            try {
                fs.writeFileSync(archivePath, JSON.stringify(history, null, 2));
                console.log(`[historyManager] Archived ${dayKeys.length} days to ${archivePath}`);
            } catch (err) {
                console.error('[historyManager] ERROR archiving history:', err.message);
            }
        } else {
            console.log('[historyManager] No days to archive, resetting');
        }

        history = getEmptyHistory();
    }

    // Always update these to current
    history.seasonId = currentSeasonId;
    history.sectionIndex = currentSectionIndex;

    // 2. Determine War Day
    // periodIndex % 7: 0-2 Training, 3-6 War Days (Thu-Sun)
    const dayOfWeekIndex = raceData.periodIndex % 7;

    // If not war day (or colosseum week), exit early without saving.
    // Colosseum week uses periodType 'colosseum' but same periodIndex % 7 mapping.
    if (raceData.periodType !== 'warDay' && raceData.periodType !== 'colosseum') {
        console.log(`[historyManager] Training day (periodType=${raceData.periodType}), skipping snapshot`);
        return history;
    }

    // Thursday(3) -> WarDay 1
    let warDay = dayOfWeekIndex - 2;
    if (warDay < 1) warDay = 1; // Safety fallback

    // 3. Create Daily Snapshot
    const players = {};
    const participants = raceData.clan.participants || [];

    participants.forEach(p => {
        players[p.tag] = {
            name: p.name,
            decksUsed: p.decksUsed,
            decksUsedToday: p.decksUsedToday || 0,
            fame: p.fame
        };
    });

    // If this is the first snapshot and it's not Day 1, mark history as partial.
    // This happens when a clan is added mid-war and earlier days were never tracked.
    if (Object.keys(history.days).length === 0 && warDay > 1) {
        history.partial = true;
        console.log(`[historyManager] Marking history as partial for clan '${clanId}': first snapshot is warDay=${warDay}`);
    }

    // Guard against API returning all-zero data at period transition (section end/start).
    // If the existing snapshot for this day has more total decksUsed, keep it.
    const newTotalDecks = participants.reduce((sum, p) => sum + (p.decksUsed || 0), 0);
    const existingDay = history.days[warDay];
    if (existingDay) {
        const existingTotalDecks = Object.values(existingDay.players || {})
            .reduce((sum, p) => sum + (p.decksUsed || 0), 0);
        if (newTotalDecks < existingTotalDecks) {
            console.log(`[historyManager] Skipping snapshot for clan '${clanId}' warDay=${warDay}: new total ${newTotalDecks} < existing ${existingTotalDecks} (API transition artifact)`);
            if (save) saveHistory(history, clanId);
            return history;
        }
    }

    console.log(`[historyManager] Snapshot for clan '${clanId}': periodType=${raceData.periodType}, warDay=${warDay}, players=${participants.length}`);

    // 4. Update History
    history.days[warDay] = {
        timestamp: new Date().toISOString(),
        players: players
    };

    if (save) {
        saveHistory(history, clanId);
    }

    return history;
}

module.exports = {
    loadHistory,
    updateHistory,
    saveHistory
};
