# TODO List - Clash Royale War Tracker

## High Priority

### 🔴 Expandable Player Cards - Reimplementation Needed
**Status:** Feature disabled (commit e5354db)
**Problem:** Table layout breaks when expanding cards - columns shift and UI looks broken
**Root Cause:** `table-layout: fixed` conflicts with colspan detail rows

**Implementation Options:**
1. **Modal/Dialog approach** - Click opens overlay with details (cleanest)
2. **Side panel** - Details appear in fixed panel beside table
3. **Tooltip/Popover** - Hover or click shows floating details
4. **Non-table layout** - Redesign history view as cards instead of table

**Original Features:**
- Show player battle activity (status indicator, last battle time, battle type, battle mode)
- Only show for incomplete players in critical 30-min window before reset
- Expandable via + button, collapsible via - button

---

## Medium Priority

### 🟡 In-Progress Player Filter
**Requested Feature:** Show only players with 1-3 decks (incomplete but started)
**Why:** Players with 3/4 decks are most likely to forget their last battle
**Implementation:** Add filter button "Show In Progress Only" that hides 0/4 and 4/4 players

---

## Low Priority / Future Ideas

### 🟢 Notifications & Alerts
- Browser notifications for players who haven't played (last 2 hours before reset)
- Alert when specific players come online
- Notification when war status changes

### 🟢 Player Statistics & Trends
- Individual player performance history graph
- Consistency score (how often they complete all 4 decks)
- Best/worst performing days of the week
- Compare players head-to-head

### 🟢 War Analytics
- Win/loss rate tracking
- Average final position per season
- Trophy gain/loss trends
- Optimal war participation patterns

### 🟢 UI Improvements
- Dark/light mode toggle
- Customizable deck counter (show % of actual players vs clan capacity)
- Drag-and-drop to reorder columns
- Export data to CSV/Excel
- Print-friendly view

### 🟢 Social Features
- Share war results screenshot
- Player of the week/month badges
- Clan leaderboard across multiple wars
- Integration with Discord webhooks

### 🟢 Performance Optimizations
- Check if background polling can be more efficient
- Consider caching strategies for repeated API calls
- Lazy load history data (pagination for old wars)

### 🟢 Data Management
- Archive old war data automatically
- Backup/restore functionality
- Import data from other tracking tools
- Data visualization dashboard

---

## Completed ✅

- ✅ Refactor player card/row generation (DRY principle)
- ✅ Default sorting: highest decks first
- ✅ Hide completed players filter
- ✅ Hide left players filter
- ✅ Day filters with podium rankings
- ✅ Expandable player cards (disabled due to bugs)
- ✅ Activity status indicators
- ✅ Developer testing section
- ✅ 291 comprehensive tests

---

**Last Updated:** 2026-02-15
