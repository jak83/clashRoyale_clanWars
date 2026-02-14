const fs = require('fs');
const path = require('path');

const BASE_STORAGE = process.env.HISTORY_PATH || __dirname;
const ONGOING_DIR = path.join(BASE_STORAGE, 'ongoing');
const HISTORY_DIR = path.join(BASE_STORAGE, 'history');
const HISTORY_FILE = path.join(ONGOING_DIR, 'history.json');

// Ensure directories exist
if (!fs.existsSync(ONGOING_DIR)) fs.mkdirSync(ONGOING_DIR);
if (!fs.existsSync(HISTORY_DIR)) fs.mkdirSync(HISTORY_DIR);

function getEmptyHistory() {
    return {
        seasonId: null,
        sectionIndex: null,
        days: {}
    };
}

function loadHistory() {
    if (!fs.existsSync(HISTORY_FILE)) {
        return getEmptyHistory();
    }
    try {
        const data = fs.readFileSync(HISTORY_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading history file", err);
        return getEmptyHistory();
    }
}

function saveHistory(history) {
    const tempFile = HISTORY_FILE + '.tmp';
    try {
        // Write to temp file first
        fs.writeFileSync(tempFile, JSON.stringify(history, null, 2));
        // Rename temp file to actual file (atomic operation)
        fs.renameSync(tempFile, HISTORY_FILE);
    } catch (err) {
        console.error("Error writing history file", err);
        // Clean up temp file if it exists
        if (fs.existsSync(tempFile)) {
            try { fs.unlinkSync(tempFile); } catch (e) { }
        }
    }
}

function updateHistory(raceData, baseHistory = null, save = true) {
    if (!raceData || !raceData.clan) return baseHistory || loadHistory();

    let history = baseHistory || loadHistory();

    const currentSeasonId = raceData.seasonId;
    const currentSectionIndex = raceData.sectionIndex;

    // 1. Check for New War Week -> Archive & Reset
    // Only archive if we have a valid previous section (not null) AND it changed.
    if (save && history.sectionIndex !== null &&
        (history.sectionIndex !== currentSectionIndex || history.seasonId !== currentSeasonId)) {

        console.log(`New war week detected. Archiving old history. Old: ${history.sectionIndex}, New: ${currentSectionIndex}`);

        // Archive Logic
        const dayKeys = Object.keys(history.days).sort();
        if (dayKeys.length > 0) {
            const startDay = history.days[dayKeys[0]];
            const endDay = history.days[dayKeys[dayKeys.length - 1]];

            const formatDate = (isoStr) => {
                if (!isoStr) return 'unknown';
                return new Date(isoStr).toISOString().split('T')[0];
            };

            // Support both old (no timestamp) and new structures during transition
            const startTs = startDay.timestamp || new Date().toISOString();
            const endTs = endDay.timestamp || new Date().toISOString();
            const dateRange = `${formatDate(startTs)}_${formatDate(endTs)}`;

            const archiveName = `WarData_week_${history.sectionIndex}_${dateRange}.json`;
            const archivePath = path.join(HISTORY_DIR, archiveName);

            try {
                fs.writeFileSync(archivePath, JSON.stringify(history, null, 2));
                console.log(`Archived to ${archivePath}`);
            } catch (err) {
                console.error("Archive failed:", err);
            }
        }

        history = getEmptyHistory();
    }

    // Always update these to current
    history.seasonId = currentSeasonId;
    history.sectionIndex = currentSectionIndex;

    // 2. Determine War Day
    // periodIndex % 7: 0-2 Training, 3-6 War Days (Thu-Sun)
    const dayOfWeekIndex = raceData.periodIndex % 7;

    // If not war day, we can exit or maybe log training? User focused on War.
    if (raceData.periodType !== 'warDay') {
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
            decksUsedToday: p.decksUsedToday || 0,  // Daily decks (0-4)
            fame: p.fame
        };
    });

    // 4. Update History
    history.days[warDay] = {
        timestamp: new Date().toISOString(),
        players: players
    };

    if (save) {
        saveHistory(history);
    }

    return history;
}

module.exports = {
    loadHistory,
    updateHistory,
    saveHistory
};
