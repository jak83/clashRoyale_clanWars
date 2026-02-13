const http = require('http');

http.get('http://localhost:3000/api/race', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        console.log('Top-level keys:', Object.keys(json));

        const jsonStr = JSON.stringify(json);
        const hasFinishTime = jsonStr.includes('finishTime');
        const hasEndTime = jsonStr.includes('endTime');
        const hasResetTime = jsonStr.includes('resetTime');
        const hasCollectionEnd = jsonStr.includes('collectionEndTime');
        const hasWarEnd = jsonStr.includes('warEndTime');

        console.log('\nTiming fields found:');
        console.log('  finishTime:', hasFinishTime);
        console.log('  endTime:', hasEndTime);
        console.log('  resetTime:', hasResetTime);
        console.log('  collectionEndTime:', hasCollectionEnd);
        console.log('  warEndTime:', hasWarEnd);

        if (!hasFinishTime && !hasEndTime && !hasResetTime && !hasCollectionEnd && !hasWarEnd) {
            console.log('\n❌ API does NOT provide reset time information.');
            console.log('   We need to hardcode the reset time (12:00 PM Helsinki).');
        } else {
            console.log('\n✅ API provides timing information!');
        }
    });
});
