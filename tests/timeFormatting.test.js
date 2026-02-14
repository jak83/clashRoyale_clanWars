/**
 * Unit tests for time formatting utility
 * Tests the formatMinutesToHourMin function that converts minutes to h:mm format
 */

const fs = require('fs');
const path = require('path');

// Load the function from app.js for testing
const appJsContent = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
const functionMatch = appJsContent.match(/function formatMinutesToHourMin\([\s\S]*?\n\}/);
if (!functionMatch) {
    throw new Error('Could not extract formatMinutesToHourMin function from app.js');
}
// Create an isolated function for testing
const formatMinutesToHourMin = eval(`(${functionMatch[0].replace('function formatMinutesToHourMin', 'function')})`);

describe('Time Formatting - formatMinutesToHourMin', () => {
    test('should format 0 minutes as 0:00', () => {
        expect(formatMinutesToHourMin(0)).toBe('0:00');
    });

    test('should format single digit minutes with leading zero', () => {
        expect(formatMinutesToHourMin(2)).toBe('0:02');
        expect(formatMinutesToHourMin(5)).toBe('0:05');
        expect(formatMinutesToHourMin(9)).toBe('0:09');
    });

    test('should format double digit minutes without leading zero', () => {
        expect(formatMinutesToHourMin(15)).toBe('0:15');
        expect(formatMinutesToHourMin(30)).toBe('0:30');
        expect(formatMinutesToHourMin(45)).toBe('0:45');
        expect(formatMinutesToHourMin(59)).toBe('0:59');
    });

    test('should format exactly 1 hour as 1:00', () => {
        expect(formatMinutesToHourMin(60)).toBe('1:00');
    });

    test('should format hours with single digit minutes', () => {
        expect(formatMinutesToHourMin(61)).toBe('1:01');
        expect(formatMinutesToHourMin(65)).toBe('1:05');
        expect(formatMinutesToHourMin(125)).toBe('2:05');
    });

    test('should format hours with double digit minutes', () => {
        expect(formatMinutesToHourMin(90)).toBe('1:30');
        expect(formatMinutesToHourMin(145)).toBe('2:25');
        expect(formatMinutesToHourMin(179)).toBe('2:59');
    });

    test('should format exactly 2 hours as 2:00', () => {
        expect(formatMinutesToHourMin(120)).toBe('2:00');
    });

    test('should format multiple hours correctly', () => {
        expect(formatMinutesToHourMin(180)).toBe('3:00');
        expect(formatMinutesToHourMin(240)).toBe('4:00');
        expect(formatMinutesToHourMin(300)).toBe('5:00');
    });

    test('should handle large time values', () => {
        expect(formatMinutesToHourMin(600)).toBe('10:00'); // 10 hours
        expect(formatMinutesToHourMin(1440)).toBe('24:00'); // 24 hours (1 day)
        expect(formatMinutesToHourMin(1500)).toBe('25:00'); // > 24 hours
    });

    test('should format realistic battle time examples', () => {
        // Common scenarios in the app
        expect(formatMinutesToHourMin(2)).toBe('0:02');   // Battle 2 minutes ago
        expect(formatMinutesToHourMin(10)).toBe('0:10');  // Battle 10 minutes ago
        expect(formatMinutesToHourMin(25)).toBe('0:25');  // Battle 25 minutes ago
        expect(formatMinutesToHourMin(90)).toBe('1:30');  // Battle 1.5 hours ago
    });

    test('REGRESSION: should always pad minutes with leading zero', () => {
        // Bug: "1:5" instead of "1:05"
        expect(formatMinutesToHourMin(65)).not.toBe('1:5');
        expect(formatMinutesToHourMin(65)).toBe('1:05');

        expect(formatMinutesToHourMin(122)).not.toBe('2:2');
        expect(formatMinutesToHourMin(122)).toBe('2:02');
    });

    test('REGRESSION: should not show "m" suffix (new format)', () => {
        // Old format: "2m", "90m"
        // New format: "0:02", "1:30"
        const result = formatMinutesToHourMin(2);
        expect(result).not.toContain('m');
        expect(result).toBe('0:02');
    });

    test('should return string, not number', () => {
        const result = formatMinutesToHourMin(90);
        expect(typeof result).toBe('string');
        expect(result).toBe('1:30');
    });
});
