/**
 * Tests for clanConfig.js
 * Focus: business logic — tagToId conversion, .env fallback, addClan/removeClan validation
 */

describe('clanConfig', () => {
    let clanConfig;

    // Reset module cache before each test so _clans cache doesn't bleed between tests
    beforeEach(() => {
        jest.resetModules();
        process.env.CLASH_API_TOKEN = 'test-token';
        process.env.CLAN_TAG = '#LEGACY';
    });

    afterEach(() => {
        delete process.env.CLASH_API_TOKEN;
        delete process.env.CLAN_TAG;
    });

    // -------------------------------------------------------------------------
    describe('tagToId', () => {
        beforeEach(() => { clanConfig = require('../clanConfig'); });

        test('strips # and lowercases the tag', () => {
            expect(clanConfig.tagToId('#ABC123')).toBe('abc123');
        });

        test('works without a # prefix', () => {
            expect(clanConfig.tagToId('ABC123')).toBe('abc123');
        });

        test('handles mixed case', () => {
            expect(clanConfig.tagToId('#2YGj8UpQ')).toBe('2ygj8upq');
        });
    });

    // -------------------------------------------------------------------------
    describe('.env fallback (no clans.json)', () => {
        beforeEach(() => {
            jest.mock('fs', () => ({
                ...jest.requireActual('fs'),
                existsSync: () => false, // pretend clans.json does not exist
            }));
            clanConfig = require('../clanConfig');
        });

        test('returns one clan from .env', () => {
            const clans = clanConfig.getAllClans();
            expect(clans).toHaveLength(1);
        });

        test('clan tag matches CLAN_TAG env var', () => {
            expect(clanConfig.getAllClans()[0].tag).toBe('#LEGACY');
        });

        test('clan id is "default" for backward compatibility', () => {
            expect(clanConfig.getAllClans()[0].id).toBe('default');
        });

        test('clan apiToken is injected from CLASH_API_TOKEN', () => {
            expect(clanConfig.getAllClans()[0].apiToken).toBe('test-token');
        });

        test('getDefaultClan returns the .env clan', () => {
            expect(clanConfig.getDefaultClan().id).toBe('default');
        });

        test('getClanById("default") returns the clan', () => {
            expect(clanConfig.getClanById('default')).not.toBeNull();
        });

        test('getClanById with unknown id returns null', () => {
            expect(clanConfig.getClanById('nonexistent')).toBeNull();
        });

        test('returns empty list when CLAN_TAG is missing', () => {
            delete process.env.CLAN_TAG;
            jest.resetModules();
            jest.mock('fs', () => ({ ...jest.requireActual('fs'), existsSync: () => false }));
            const fresh = require('../clanConfig');
            expect(fresh.getAllClans()).toHaveLength(0);
            expect(fresh.getDefaultClan()).toBeNull();
        });
    });

    // -------------------------------------------------------------------------
    describe('loading from clans.json', () => {
        beforeEach(() => {
            const mockFile = JSON.stringify([
                { id: 'main', tag: '#MAIN' },
                { id: 'junior', tag: '#JR' }
            ]);
            jest.mock('fs', () => ({
                ...jest.requireActual('fs'),
                existsSync: () => true,
                readFileSync: () => mockFile,
            }));
            clanConfig = require('../clanConfig');
        });

        test('loads all clans from clans.json', () => {
            expect(clanConfig.getAllClans()).toHaveLength(2);
        });

        test('injects shared API token into every clan', () => {
            clanConfig.getAllClans().forEach(c => {
                expect(c.apiToken).toBe('test-token');
            });
        });

        test('getClanById returns correct clan', () => {
            expect(clanConfig.getClanById('main').tag).toBe('#MAIN');
            expect(clanConfig.getClanById('junior').tag).toBe('#JR');
        });

        test('getDefaultClan returns first clan', () => {
            expect(clanConfig.getDefaultClan().id).toBe('main');
        });
    });

    // -------------------------------------------------------------------------
    describe('addClan validation', () => {
        let writtenData;

        beforeEach(() => {
            writtenData = null;
            const existingClans = [{ id: 'main', tag: '#MAIN' }];
            jest.mock('fs', () => ({
                ...jest.requireActual('fs'),
                existsSync: () => true,
                readFileSync: () => JSON.stringify(existingClans),
                writeFileSync: (p, data) => { writtenData = data; },
            }));
            clanConfig = require('../clanConfig');
        });

        test('throws when id already exists', () => {
            expect(() => clanConfig.addClan({ id: 'main', tag: '#OTHER' }))
                .toThrow("Clan with id 'main' already exists");
        });

        test('throws when tag already exists (case-insensitive)', () => {
            expect(() => clanConfig.addClan({ id: 'new', tag: '#main' }))
                .toThrow('already tracked');
        });

        test('adds new clan to the list', () => {
            clanConfig.addClan({ id: 'junior', tag: '#JR' });
            expect(clanConfig.getAllClans()).toHaveLength(2);
            expect(clanConfig.getClanById('junior').tag).toBe('#JR');
        });

        test('persists new clan to disk (writeFileSync called)', () => {
            clanConfig.addClan({ id: 'junior', tag: '#JR' });
            expect(writtenData).not.toBeNull();
            const saved = JSON.parse(writtenData);
            expect(saved).toHaveLength(2);
            expect(saved[1].id).toBe('junior');
        });

        test('saved data does not include apiToken', () => {
            clanConfig.addClan({ id: 'junior', tag: '#JR' });
            const saved = JSON.parse(writtenData);
            saved.forEach(c => expect(c.apiToken).toBeUndefined());
        });

        test('new clan has apiToken injected in memory', () => {
            const newClan = clanConfig.addClan({ id: 'junior', tag: '#JR' });
            expect(newClan.apiToken).toBe('test-token');
        });
    });

    // -------------------------------------------------------------------------
    describe('removeClan', () => {
        let writtenData;

        beforeEach(() => {
            writtenData = null;
            const existingClans = [
                { id: 'main', tag: '#MAIN' },
                { id: 'junior', tag: '#JR' }
            ];
            jest.mock('fs', () => ({
                ...jest.requireActual('fs'),
                existsSync: () => true,
                readFileSync: () => JSON.stringify(existingClans),
                writeFileSync: (p, data) => { writtenData = data; },
            }));
            clanConfig = require('../clanConfig');
        });

        test('removes clan from the list', () => {
            clanConfig.removeClan('junior');
            expect(clanConfig.getAllClans()).toHaveLength(1);
            expect(clanConfig.getClanById('junior')).toBeNull();
        });

        test('persists removal to disk', () => {
            clanConfig.removeClan('junior');
            const saved = JSON.parse(writtenData);
            expect(saved).toHaveLength(1);
            expect(saved[0].id).toBe('main');
        });

        test('throws when clan id does not exist', () => {
            expect(() => clanConfig.removeClan('nonexistent'))
                .toThrow("Clan 'nonexistent' not found");
        });
    });
});
