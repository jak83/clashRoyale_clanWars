const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'clans.json');

let _clans = null;

function loadClans() {
    if (_clans) return _clans;

    const sharedToken = process.env.CLASH_API_TOKEN;

    if (fs.existsSync(CONFIG_PATH)) {
        try {
            const parsed = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
            if (Array.isArray(parsed) && parsed.length > 0) {
                _clans = parsed.map(c => ({ ...c, apiToken: sharedToken }));
                console.log(`[clanConfig] Loaded ${_clans.length} clan(s) from clans.json`);
                return _clans;
            }
        } catch (e) {
            console.error('[clanConfig] Failed to parse clans.json:', e.message);
        }
    }

    // Fallback to .env for single-clan operators.
    // Use id 'default' so existing data at ongoing/history.json is preserved.
    // Mark as protected so it cannot be removed via the UI.
    const tag = process.env.CLAN_TAG;
    if (tag && sharedToken) {
        _clans = [{ id: 'default', name: tag, tag, apiToken: sharedToken, protected: true }];
        console.log('[clanConfig] Using single clan from .env (legacy mode)');
    } else {
        _clans = [];
        console.warn('[clanConfig] No clans configured — set CLAN_TAG/CLASH_API_TOKEN in .env or create clans.json');
    }
    return _clans;
}

/** Convert a clan tag like '#2ABC' to a safe id like '2abc' */
function tagToId(tag) {
    return tag.replace(/^#/, '').toLowerCase();
}

/** Serialize current clans to disk (strips apiToken — that lives in .env) */
function saveToDisk(clans) {
    const toSave = clans.map(({ id, tag, name, protected: p }) => {
        const entry = { id, tag };
        if (name) entry.name = name;
        if (p) entry.protected = true;
        return entry;
    });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(toSave, null, 2));
}

/**
 * Add a new clan. Persists to clans.json, migrating the .env clan first if needed.
 * @param {{ id: string, tag: string }} clanData
 * @returns {Object} The new clan object (with apiToken injected)
 */
function addClan(clanData) {
    const existing = loadClans();

    if (existing.find(c => c.id === clanData.id)) {
        throw new Error(`Clan with id '${clanData.id}' already exists`);
    }
    if (existing.find(c => c.tag.toUpperCase() === clanData.tag.toUpperCase())) {
        throw new Error(`Clan with tag '${clanData.tag}' is already tracked`);
    }

    const sharedToken = process.env.CLASH_API_TOKEN;
    const newClan = { ...clanData, apiToken: sharedToken };
    const newList = [...existing, newClan];

    saveToDisk(newList);
    _clans = newList;
    return newClan;
}

/**
 * Remove a clan by id. Persists the change to clans.json.
 * @param {string} id
 */
function removeClan(id) {
    const existing = loadClans();
    const filtered = existing.filter(c => c.id !== id);
    if (filtered.length === existing.length) {
        throw new Error(`Clan '${id}' not found`);
    }
    saveToDisk(filtered);
    _clans = filtered;
}

function getAllClans() {
    return loadClans();
}

function getClanById(id) {
    return loadClans().find(c => c.id === id) || null;
}

function getDefaultClan() {
    return loadClans()[0] || null;
}

module.exports = { getAllClans, getClanById, getDefaultClan, addClan, removeClan, tagToId };
