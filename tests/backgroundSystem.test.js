/**
 * Background System Tests
 *
 * Tests the critical background polling and snapshot system that powers
 * historical war tracking. These tests verify:
 * - Snapshots are saved correctly
 * - War day calculation works with real dates
 * - File persistence works
 * - Training days are handled correctly
 */

const fs = require('fs');
const path = require('path');

// Use a temp directory for testing to avoid polluting real data
const TEST_STORAGE = path.join(__dirname, 'temp_history');
const TEST_ONGOING = path.join(TEST_STORAGE, 'ongoing');
const TEST_HISTORY_DIR = path.join(TEST_STORAGE, 'history');
const TEST_HISTORY_FILE = path.join(TEST_ONGOING, 'history.json');

// Set environment BEFORE requiring historyManager
process.env.HISTORY_PATH = TEST_STORAGE;

// Create parent directory BEFORE requiring historyManager
// (historyManager creates subdirectories at load time)
if (!fs.existsSync(TEST_STORAGE)) fs.mkdirSync(TEST_STORAGE, { recursive: true });

// Now require historyManager after setting up environment
const historyManager = require('../historyManager');

describe('Background Polling System', () => {

    beforeEach(() => {
        // Create directories
        if (!fs.existsSync(TEST_STORAGE)) fs.mkdirSync(TEST_STORAGE);
        if (!fs.existsSync(TEST_ONGOING)) fs.mkdirSync(TEST_ONGOING);
        if (!fs.existsSync(TEST_HISTORY_DIR)) fs.mkdirSync(TEST_HISTORY_DIR);

        // Clean any existing test data
        if (fs.existsSync(TEST_HISTORY_FILE)) {
            fs.unlinkSync(TEST_HISTORY_FILE);
        }

        // Clean archive directory
        if (fs.existsSync(TEST_HISTORY_DIR)) {
            const files = fs.readdirSync(TEST_HISTORY_DIR);
            files.forEach(file => {
                fs.unlinkSync(path.join(TEST_HISTORY_DIR, file));
            });
        }
    });

    afterEach(() => {
        // Clean up test directory
        if (fs.existsSync(TEST_HISTORY_FILE)) {
            fs.unlinkSync(TEST_HISTORY_FILE);
        }

        // Clean archive directory
        if (fs.existsSync(TEST_HISTORY_DIR)) {
            const files = fs.readdirSync(TEST_HISTORY_DIR);
            files.forEach(file => {
                fs.unlinkSync(path.join(TEST_HISTORY_DIR, file));
            });
            fs.rmdirSync(TEST_HISTORY_DIR);
        }

        if (fs.existsSync(TEST_ONGOING)) {
            fs.rmdirSync(TEST_ONGOING);
        }
        if (fs.existsSync(TEST_STORAGE)) {
            fs.rmdirSync(TEST_STORAGE);
        }
    });

    describe('Snapshot Creation', () => {

        test('should save Day 1 snapshot on Thursday (periodIndex=3)', () => {
            // Mock race data for Thursday (Day 1)
            const raceData = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 3, // Thursday
                periodType: 'warDay',
                clan: {
                    participants: [
                        { tag: '#PLAYER1', name: 'Alice', decksUsed: 4, decksUsedToday: 4, fame: 400 },
                        { tag: '#PLAYER2', name: 'Bob', decksUsed: 2, decksUsedToday: 2, fame: 200 }
                    ]
                }
            };

            // Update history (this should save a snapshot)
            historyManager.updateHistory(raceData);

            // Verify file was created
            expect(fs.existsSync(TEST_HISTORY_FILE)).toBe(true);

            // Verify snapshot content
            const savedHistory = JSON.parse(fs.readFileSync(TEST_HISTORY_FILE, 'utf8'));

            expect(savedHistory.seasonId).toBe(100);
            expect(savedHistory.sectionIndex).toBe(5);
            expect(savedHistory.days['1']).toBeDefined();
            expect(savedHistory.days['1'].players['#PLAYER1']).toEqual({
                name: 'Alice',
                decksUsed: 4,
                decksUsedToday: 4,
                fame: 400
            });
        });

        test('should save Day 2 snapshot on Friday (periodIndex=4)', () => {
            const raceData = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 4, // Friday
                periodType: 'warDay',
                clan: {
                    participants: [
                        { tag: '#PLAYER1', name: 'Alice', decksUsed: 8, decksUsedToday: 4, fame: 800 }
                    ]
                }
            };

            historyManager.updateHistory(raceData);

            const savedHistory = JSON.parse(fs.readFileSync(TEST_HISTORY_FILE, 'utf8'));
            expect(savedHistory.days['2']).toBeDefined();
            expect(savedHistory.days['2'].players['#PLAYER1'].decksUsed).toBe(8);
        });

        test('should save Day 3 snapshot on Saturday (periodIndex=5)', () => {
            const raceData = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 5, // Saturday
                periodType: 'warDay',
                clan: { participants: [{ tag: '#P1', name: 'Test', decksUsed: 12, decksUsedToday: 4, fame: 1200 }] }
            };

            historyManager.updateHistory(raceData);

            const savedHistory = JSON.parse(fs.readFileSync(TEST_HISTORY_FILE, 'utf8'));
            expect(savedHistory.days['3']).toBeDefined();
        });

        test('should save Day 4 snapshot on Sunday (periodIndex=6)', () => {
            const raceData = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 6, // Sunday
                periodType: 'warDay',
                clan: { participants: [{ tag: '#P1', name: 'Test', decksUsed: 16, decksUsedToday: 4, fame: 1600 }] }
            };

            historyManager.updateHistory(raceData);

            const savedHistory = JSON.parse(fs.readFileSync(TEST_HISTORY_FILE, 'utf8'));
            expect(savedHistory.days['4']).toBeDefined();
        });
    });

    describe('War Day Calculation', () => {

        test('should calculate warDay = 1 for periodIndex = 3 (Thursday)', () => {
            const raceData = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 3, // Thursday
                periodType: 'warDay',
                clan: { participants: [{ tag: '#P1', name: 'Test', decksUsed: 4, decksUsedToday: 4, fame: 400 }] }
            };

            historyManager.updateHistory(raceData);
            const history = JSON.parse(fs.readFileSync(TEST_HISTORY_FILE, 'utf8'));

            expect(history.days['1']).toBeDefined();
            expect(history.days['2']).toBeUndefined();
        });

        test('should calculate warDay = 2 for periodIndex = 4 (Friday)', () => {
            const raceData = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 4,
                periodType: 'warDay',
                clan: { participants: [{ tag: '#P1', name: 'Test', decksUsed: 4, decksUsedToday: 4, fame: 400 }] }
            };

            historyManager.updateHistory(raceData);
            const history = JSON.parse(fs.readFileSync(TEST_HISTORY_FILE, 'utf8'));

            expect(history.days['2']).toBeDefined();
            expect(history.days['1']).toBeUndefined();
        });

        test('should handle edge case: periodIndex < 3 should default to warDay 1', () => {
            // Safety fallback test
            const raceData = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 1, // Unusual but test the fallback
                periodType: 'warDay',
                clan: { participants: [{ tag: '#P1', name: 'Test', decksUsed: 4, decksUsedToday: 4, fame: 400 }] }
            };

            historyManager.updateHistory(raceData);
            const history = JSON.parse(fs.readFileSync(TEST_HISTORY_FILE, 'utf8'));

            // Should fallback to Day 1
            expect(history.days['1']).toBeDefined();
        });
    });

    describe('Training Day Handling', () => {

        test('should NOT save snapshot during training day', () => {
            const trainingData = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 0, // Training day
                periodType: 'training',
                clan: { participants: [] }
            };

            historyManager.updateHistory(trainingData);

            // File should not be created or should be empty
            if (fs.existsSync(TEST_HISTORY_FILE)) {
                const history = JSON.parse(fs.readFileSync(TEST_HISTORY_FILE, 'utf8'));
                expect(Object.keys(history.days).length).toBe(0);
            }
        });

        test('should preserve existing snapshots when training day occurs', () => {
            // First, save a Day 1 snapshot
            const day1Data = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 3,
                periodType: 'warDay',
                clan: { participants: [{ tag: '#P1', name: 'Test', decksUsed: 4, decksUsedToday: 4, fame: 400 }] }
            };
            historyManager.updateHistory(day1Data);

            // Then receive training day data
            const trainingData = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 1,
                periodType: 'training',
                clan: { participants: [] }
            };
            historyManager.updateHistory(trainingData);

            // Day 1 should still exist
            const history = JSON.parse(fs.readFileSync(TEST_HISTORY_FILE, 'utf8'));
            expect(history.days['1']).toBeDefined();
        });
    });

    describe('Snapshot Data Structure', () => {

        test('snapshot should contain all required player fields', () => {
            const raceData = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 3,
                periodType: 'warDay',
                clan: {
                    participants: [
                        { tag: '#PLAYER1', name: 'Alice', decksUsed: 4, decksUsedToday: 4, fame: 400 }
                    ]
                }
            };

            historyManager.updateHistory(raceData);
            const history = JSON.parse(fs.readFileSync(TEST_HISTORY_FILE, 'utf8'));
            const player = history.days['1'].players['#PLAYER1'];

            expect(player).toHaveProperty('name');
            expect(player).toHaveProperty('decksUsed');
            expect(player).toHaveProperty('decksUsedToday');
            expect(player).toHaveProperty('fame');
        });

        test('snapshot should handle multiple players', () => {
            const raceData = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 3,
                periodType: 'warDay',
                clan: {
                    participants: [
                        { tag: '#P1', name: 'Alice', decksUsed: 4, decksUsedToday: 4, fame: 400 },
                        { tag: '#P2', name: 'Bob', decksUsed: 3, decksUsedToday: 3, fame: 300 },
                        { tag: '#P3', name: 'Charlie', decksUsed: 0, decksUsedToday: 0, fame: 0 }
                    ]
                }
            };

            historyManager.updateHistory(raceData);
            const history = JSON.parse(fs.readFileSync(TEST_HISTORY_FILE, 'utf8'));

            expect(Object.keys(history.days['1'].players).length).toBe(3);
            expect(history.days['1'].players['#P1'].name).toBe('Alice');
            expect(history.days['1'].players['#P2'].name).toBe('Bob');
            expect(history.days['1'].players['#P3'].name).toBe('Charlie');
        });

        test('snapshot should handle player with 0 decks', () => {
            const raceData = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 3,
                periodType: 'warDay',
                clan: {
                    participants: [
                        { tag: '#LAZY', name: 'Lazy Player', decksUsed: 0, decksUsedToday: 0, fame: 0 }
                    ]
                }
            };

            historyManager.updateHistory(raceData);
            const history = JSON.parse(fs.readFileSync(TEST_HISTORY_FILE, 'utf8'));

            expect(history.days['1'].players['#LAZY']).toBeDefined();
            expect(history.days['1'].players['#LAZY'].decksUsed).toBe(0);
        });

        test('snapshot should include timestamp', () => {
            const raceData = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 3,
                periodType: 'warDay',
                clan: { participants: [{ tag: '#P1', name: 'Test', decksUsed: 4, decksUsedToday: 4, fame: 400 }] }
            };

            const beforeTime = new Date().toISOString();
            historyManager.updateHistory(raceData);
            const afterTime = new Date().toISOString();

            const history = JSON.parse(fs.readFileSync(TEST_HISTORY_FILE, 'utf8'));
            const timestamp = history.days['1'].timestamp;

            expect(timestamp).toBeDefined();
            expect(timestamp >= beforeTime).toBe(true);
            expect(timestamp <= afterTime).toBe(true);
        });
    });

    describe('Multiple Days Accumulation', () => {

        test('should accumulate multiple day snapshots in same file', () => {
            // Day 1
            const day1Data = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 3,
                periodType: 'warDay',
                clan: { participants: [{ tag: '#P1', name: 'Test', decksUsed: 4, decksUsedToday: 4, fame: 400 }] }
            };
            historyManager.updateHistory(day1Data);

            // Day 2
            const day2Data = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 4,
                periodType: 'warDay',
                clan: { participants: [{ tag: '#P1', name: 'Test', decksUsed: 8, decksUsedToday: 4, fame: 800 }] }
            };
            historyManager.updateHistory(day2Data);

            // Both days should exist
            const history = JSON.parse(fs.readFileSync(TEST_HISTORY_FILE, 'utf8'));
            expect(history.days['1']).toBeDefined();
            expect(history.days['2']).toBeDefined();
            expect(history.days['1'].players['#P1'].decksUsed).toBe(4);
            expect(history.days['2'].players['#P1'].decksUsed).toBe(8);
        });

        test('should preserve previous days when adding new day', () => {
            // Save Days 1, 2, 3
            for (let periodIndex = 3; periodIndex <= 5; periodIndex++) {
                const data = {
                    seasonId: 100,
                    sectionIndex: 5,
                    periodIndex: periodIndex,
                    periodType: 'warDay',
                    clan: { participants: [{ tag: '#P1', name: 'Test', decksUsed: 4 * (periodIndex - 2), decksUsedToday: 4, fame: 400 }] }
                };
                historyManager.updateHistory(data);
            }

            const history = JSON.parse(fs.readFileSync(TEST_HISTORY_FILE, 'utf8'));
            expect(Object.keys(history.days).length).toBe(3);
            expect(history.days['1']).toBeDefined();
            expect(history.days['2']).toBeDefined();
            expect(history.days['3']).toBeDefined();
        });
    });

    describe('Edge Cases', () => {

        test('should handle null/undefined raceData gracefully', () => {
            const result1 = historyManager.updateHistory(null);
            const result2 = historyManager.updateHistory(undefined);

            expect(result1).toBeDefined();
            expect(result2).toBeDefined();
        });

        test('should handle missing clan data', () => {
            const raceData = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 3,
                periodType: 'warDay'
                // Missing clan field
            };

            const result = historyManager.updateHistory(raceData);
            expect(result).toBeDefined();
        });

        test('should handle empty participants array', () => {
            const raceData = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 3,
                periodType: 'warDay',
                clan: { participants: [] }
            };

            historyManager.updateHistory(raceData);
            const history = JSON.parse(fs.readFileSync(TEST_HISTORY_FILE, 'utf8'));

            expect(history.days['1']).toBeDefined();
            expect(Object.keys(history.days['1'].players).length).toBe(0);
        });

        test('should handle missing decksUsedToday field', () => {
            const raceData = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 3,
                periodType: 'warDay',
                clan: {
                    participants: [
                        { tag: '#P1', name: 'Test', decksUsed: 4, fame: 400 }
                        // Missing decksUsedToday
                    ]
                }
            };

            historyManager.updateHistory(raceData);
            const history = JSON.parse(fs.readFileSync(TEST_HISTORY_FILE, 'utf8'));

            // Should default to 0
            expect(history.days['1'].players['#P1'].decksUsedToday).toBe(0);
        });
    });

    describe('File Persistence', () => {

        test('should create history file if it does not exist', () => {
            expect(fs.existsSync(TEST_HISTORY_FILE)).toBe(false);

            const raceData = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 3,
                periodType: 'warDay',
                clan: { participants: [{ tag: '#P1', name: 'Test', decksUsed: 4, decksUsedToday: 4, fame: 400 }] }
            };

            historyManager.updateHistory(raceData);

            expect(fs.existsSync(TEST_HISTORY_FILE)).toBe(true);
        });

        test('should overwrite existing history file', () => {
            // Write initial data
            const initialData = { seasonId: 99, sectionIndex: 4, days: {} };
            fs.writeFileSync(TEST_HISTORY_FILE, JSON.stringify(initialData));

            // Update with new data
            const raceData = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 3,
                periodType: 'warDay',
                clan: { participants: [{ tag: '#P1', name: 'Test', decksUsed: 4, decksUsedToday: 4, fame: 400 }] }
            };
            historyManager.updateHistory(raceData);

            // Should have new seasonId
            const history = JSON.parse(fs.readFileSync(TEST_HISTORY_FILE, 'utf8'));
            expect(history.seasonId).toBe(100);
        });

        test('should write valid JSON format', () => {
            const raceData = {
                seasonId: 100,
                sectionIndex: 5,
                periodIndex: 3,
                periodType: 'warDay',
                clan: { participants: [{ tag: '#P1', name: 'Test', decksUsed: 4, decksUsedToday: 4, fame: 400 }] }
            };

            historyManager.updateHistory(raceData);

            // Should be able to parse without errors
            expect(() => {
                JSON.parse(fs.readFileSync(TEST_HISTORY_FILE, 'utf8'));
            }).not.toThrow();
        });
    });
});
