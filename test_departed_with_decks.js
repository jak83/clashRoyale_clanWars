// Demonstrate handling of departed players with decks
console.log('📋 Departed Player Logic Test\n');

// Simulated scenario
const scenarios = [
    { name: 'Alice', inClan: true, decks: 16, shown: true, reason: 'Current member' },
    { name: 'Bob', inClan: true, decks: 0, shown: true, reason: 'Current member (no decks yet)' },
    { name: 'Charlie', inClan: false, decks: 12, shown: true, reason: 'Left but played decks (COUNTS!)' },
    { name: 'Diana', inClan: false, decks: 8, shown: true, reason: 'Left but played decks (COUNTS!)' },
    { name: 'Eve', inClan: false, decks: 0, shown: false, reason: 'Left without playing (hidden)' },
];

console.log('Player Status:\n');
scenarios.forEach(p => {
    const status = p.shown ? '✅ SHOWN' : '⚪ HIDDEN';
    const badge = p.inClan ? '[IN CLAN]' : '[LEFT]';
    console.log(`${status} ${badge} ${p.name} - ${p.decks} decks`);
    console.log(`       → ${p.reason}\n`);
});

const visiblePlayers = scenarios.filter(p => p.shown);
const totalDecks = scenarios.reduce((sum, p) => sum + p.decks, 0);
const maxDecks = 5 * 4 * 4; // 5 players × 4 decks × 4 days

console.log('\n📊 Summary:');
console.log(`Visible players: ${visiblePlayers.length}/${scenarios.length}`);
console.log(`Total decks: ${totalDecks} (includes decks from departed players)`);
console.log(`\nKey point: Charlie & Diana left but their 20 combined decks still count! ✓`);
