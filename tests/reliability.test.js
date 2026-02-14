const fs = require('fs');
const path = require('path');
const historyManager = require('../historyManager');

jest.mock('fs');

describe('History Reliability', () => {
    const MOCK_HISTORY_DIR = '/mock/history';
    const MOCK_ONGOING_DIR = '/mock/ongoing';
    const MOCK_HISTORY_FILE = '/mock/ongoing/history.json';

    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mocks
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify({ sectionIndex: null, days: {} }));
    });

    describe('Atomic Writes (saveHistory)', () => {
        test('should write to temp file and rename it', () => {
            const history = { test: 'data' };

            historyManager.saveHistory(history);

            // Expect write to .tmp
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining('.tmp'),
                expect.any(String)
            );

            // Expect rename .tmp -> real
            expect(fs.renameSync).toHaveBeenCalledWith(
                expect.stringContaining('.tmp'),
                expect.stringContaining('history.json')
            );
        });

        test('should NOT rename if write fails', () => {
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Disk full');
            });

            const history = { test: 'data' };
            historyManager.saveHistory(history);

            // Write called
            expect(fs.writeFileSync).toHaveBeenCalled();
            // Rename NOT called
            expect(fs.renameSync).not.toHaveBeenCalled();
            // Cleanup attempted (unlink)
            expect(fs.unlinkSync).toHaveBeenCalled();
        });
    });

    describe('New Week Detection (updateHistory)', () => {
        test('should NOT archive on first run (null -> 1)', () => {
            const baseHistory = {
                sectionIndex: null,
                seasonId: null,
                days: {}
            };

            const raceData = {
                sectionIndex: 1,
                seasonId: 55,
                periodIndex: 3, // War Day 1
                periodType: 'warDay',
                clan: { participants: [] }
            };

            historyManager.updateHistory(raceData, baseHistory, true);

            // Should NOT have written to history/WarData...
            // Note: saveHistory internally calls write, but we are looking for the *Archive* write specifically
            // The archive write happens to `history/WarData...`
            // The regular save happens to `ongoing/history.json`

            const writeCalls = fs.writeFileSync.mock.calls;
            const archiveCall = writeCalls.find(call => call[0].includes('WarData'));

            expect(archiveCall).toBeUndefined();
        });

        test('should archive on valid transition (1 -> 2)', () => {
            const baseHistory = {
                sectionIndex: 1, // Valid previous state
                seasonId: 55,
                days: { '1': { timestamp: '2023-01-01', players: {} } }
            };

            const raceData = {
                sectionIndex: 2, // New week
                seasonId: 55,
                periodIndex: 3,
                periodType: 'warDay',
                clan: { participants: [] }
            };

            historyManager.updateHistory(raceData, baseHistory, true);

            const writeCalls = fs.writeFileSync.mock.calls;
            const archiveCall = writeCalls.find(call => call[0].includes('WarData'));

            expect(archiveCall).toBeDefined();
        });
    });
});
