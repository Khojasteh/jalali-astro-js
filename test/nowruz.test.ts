/**
 * Tests for src/nowruz.ts
 * Verifies Nowruz JDN calculation against known Gregorian calendar dates.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { nowruzJDN, clearNowruzCache } from '../src/nowruz.ts';
import { gregorianToJDN } from '../src/julianDay.ts';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('nowruzJDN', () => {
    beforeEach(() => clearNowruzCache());

    it('throws RangeError for year below supported minimum', () => {
        assert.throws(() => nowruzJDN(JalaliDate.MIN_YEAR - 1), RangeError);
    });

    it('throws RangeError for year above supported maximum', () => {
        assert.throws(() => nowruzJDN(JalaliDate.MAX_YEAR + 2), RangeError);
    });

    it('throws RangeError for year 0', () => {
        assert.throws(() => nowruzJDN(0), RangeError);
    });

    it('returns consistent results with and without cache', () => {
        const first = nowruzJDN(1402);
        clearNowruzCache();
        const second = nowruzJDN(1402);
        assert.equal(first, second);
    });

    // Known Nowruz dates (Gregorian) from published Iranian calendar sources
    const knownNowruz: Array<{ sh: number; gYear: number; gMonth: number; gDay: number }> = [
        // Note: Nowruz falls on the NEXT day when the equinox is at or after Tehran noon.
        { sh: 1395, gYear: 2016, gMonth: 3, gDay: 20 }, // equinox ~08:00 Tehran (before noon)
        { sh: 1396, gYear: 2017, gMonth: 3, gDay: 21 }, // equinox ~13:58 Tehran (after noon → next day)
        { sh: 1397, gYear: 2018, gMonth: 3, gDay: 21 },
        { sh: 1398, gYear: 2019, gMonth: 3, gDay: 21 },
        { sh: 1399, gYear: 2020, gMonth: 3, gDay: 20 },
        { sh: 1400, gYear: 2021, gMonth: 3, gDay: 21 },
        { sh: 1401, gYear: 2022, gMonth: 3, gDay: 21 },
        { sh: 1402, gYear: 2023, gMonth: 3, gDay: 21 },
        { sh: 1403, gYear: 2024, gMonth: 3, gDay: 20 },
        { sh: 1404, gYear: 2025, gMonth: 3, gDay: 21 }, // equinox ~12:31 Tehran (after noon → next day)
        { sh: 1405, gYear: 2026, gMonth: 3, gDay: 21 },
    ];

    for (const { sh, gYear, gMonth, gDay } of knownNowruz) {
        it(`SH ${sh} Nowruz = ${gYear}-${String(gMonth).padStart(2, '0')}-${String(gDay).padStart(2, '0')}`, () => {
            const expected = gregorianToJDN(gYear, gMonth, gDay);
            const actual = nowruzJDN(sh);
            assert.equal(actual, expected,
                `Nowruz JDN for SH ${sh}: expected ${expected} (${gYear}-${gMonth}-${gDay}), got ${actual}`);
        });
    }

    // ---- Supported-range extremes ----
    it('Minimum supported year succeeds', () => {
        const jdn = nowruzJDN(JalaliDate.MIN_YEAR);
        assert.ok(typeof jdn === 'number' && Number.isFinite(jdn));
    });

    it('Maximum supported year succeeds', () => {
        const jdn = nowruzJDN(JalaliDate.MAX_YEAR + 1);
        assert.ok(typeof jdn === 'number' && Number.isFinite(jdn));
    });

    it('consecutive Jalali years have different JDN', () => {
        const jdn1402 = nowruzJDN(1402);
        const jdn1403 = nowruzJDN(1403);
        // Should differ by 365 or 366 days
        const diff = jdn1403 - jdn1402;
        assert.ok(diff === 365 || diff === 366, `Expected 365 or 366, got ${diff}`);
    });

    it('works for negative Jalali years', () => {
        const jdn = nowruzJDN(-100);
        assert.ok(typeof jdn === 'number' && Number.isFinite(jdn));
    });

    it('cache improves performance on repeated calls', () => {
        clearNowruzCache();
        // First call computes
        nowruzJDN(1400);
        // Second call should use cache (we can't easily measure performance, but verify it works)
        const cachedResult = nowruzJDN(1400);
        assert.ok(typeof cachedResult === 'number');
    });
});
