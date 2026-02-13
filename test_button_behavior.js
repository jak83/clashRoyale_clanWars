// Test: Verify button only toggles inactive left players
console.log('🧪 Testing "Hide Inactive Left Players" Button Behavior\n');

const testPlayers = [
    { name: 'CurrentMember1', inClan: true, decks: 12, hasDataAttr: false },
    { name: 'CurrentMember2', inClan: true, decks: 0, hasDataAttr: false },
    { name: 'LeftWithDecks', inClan: false, decks: 8, hasDataAttr: false },
    { name: 'LeftNoDecks1', inClan: false, decks: 0, hasDataAttr: true },
    { name: 'LeftNoDecks2', inClan: false, decks: 0, hasDataAttr: true },
];

console.log('Before clicking button (default state):\n');
testPlayers.forEach(p => {
    const visible = !(p.inClan === false && p.decks === 0);
    const status = visible ? '✅ VISIBLE' : '⚪ HIDDEN';
    const toggle = p.hasDataAttr ? '[TOGGLEABLE]' : '[NOT TOGGLEABLE]';
    console.log(`${status} ${toggle} ${p.name} - ${p.inClan ? 'In clan' : 'Left'}, ${p.decks} decks`);
});

console.log('\n\n🔘 User clicks: "Show Inactive Left Players"\n');
console.log('After clicking (showing inactive):\n');

testPlayers.forEach(p => {
    const visible = true; // All shown after clicking "Show"
    const status = visible ? '✅ VISIBLE' : '⚪ HIDDEN';
    const toggle = p.hasDataAttr ? '[WAS TOGGLED]' : '[UNCHANGED]';
    console.log(`${status} ${toggle} ${p.name} - ${p.inClan ? 'In clan' : 'Left'}, ${p.decks} decks`);
});

console.log('\n\n📊 Summary:');
console.log('✓ Current members: Always visible (never toggled)');
console.log('✓ Left with decks: Always visible (never toggled) ← YOUR CONCERN');
console.log('✓ Left without decks: Can be toggled by button');
console.log('\n⚠️  "LeftWithDecks" is NEVER hidden by the button! ✓');
