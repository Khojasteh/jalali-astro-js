/**
 * Tests for src/astronomy.ts
 * Verifies the Meeus vernal equinox algorithm against known astronomical data.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { vernalEquinoxJD, MEEUS_MIN_YEAR, MEEUS_MAX_YEAR } from '../src/astronomy.ts';

/** Julian Day for a known UTC date+time, accurate to ~1 second. */
function dateToJD(isoUtc: string): number {
    return new Date(isoUtc).getTime() / 86400000 + 2440587.5;
}

describe('vernalEquinoxJD', () => {
    it('rejects years below MEEUS_MIN_YEAR', () => {
        assert.throws(() => vernalEquinoxJD(MEEUS_MIN_YEAR - 1), RangeError);
    });

    it('rejects years above MEEUS_MAX_YEAR', () => {
        assert.throws(() => vernalEquinoxJD(MEEUS_MAX_YEAR + 1), RangeError);
    });

    it('accepts year at MEEUS_MIN_YEAR', () => {
        const jd = vernalEquinoxJD(MEEUS_MIN_YEAR);
        assert.ok(typeof jd === 'number' && Number.isFinite(jd));
    });

    it('accepts year at MEEUS_MAX_YEAR', () => {
        const jd = vernalEquinoxJD(MEEUS_MAX_YEAR);
        assert.ok(typeof jd === 'number' && Number.isFinite(jd));
    });

    // Spot checks: known equinox instants (UT) per Meeus Table 27.a.
    // Tolerance: 60 seconds
    const TOLERANCE_DAYS = 60 / 86400;

    const cases: Array<{ year: number; utc: string }> = [
        { year: 2000, utc: '2000-03-20T07:35:00Z' },
        { year: 2010, utc: '2010-03-20T17:32:00Z' },
        { year: 2020, utc: '2020-03-20T03:50:00Z' },
        { year: 2023, utc: '2023-03-20T21:24:00Z' },
        { year: 2024, utc: '2024-03-20T03:06:00Z' },
        { year: 1900, utc: '1900-03-21T01:39:00Z' },
        { year: 1800, utc: '1800-03-20T20:12:00Z' },
    ];

    for (const { year, utc } of cases) {
        it(`year ${year}: within 1 minute of ${utc}`, () => {
            const expected = dateToJD(utc);
            const actual = vernalEquinoxJD(year);
            const diffDays = Math.abs(actual - expected);
            assert.ok(
                diffDays <= TOLERANCE_DAYS,
                `Expected ${actual.toFixed(6)} ≈ ${expected.toFixed(6)}, diff = ${(diffDays * 86400).toFixed(0)}s`
            );
        });
    }

    it('returns different JD for consecutive years', () => {
        const jd2023 = vernalEquinoxJD(2023);
        const jd2024 = vernalEquinoxJD(2024);
        // Should be roughly 365 days apart
        const diff = Math.abs(jd2024 - jd2023);
        assert.ok(diff > 364 && diff < 367, 'Consecutive years should differ by ~365 days');
    });

    it('works for negative years', () => {
        const jd = vernalEquinoxJD(-500);
        assert.ok(typeof jd === 'number' && Number.isFinite(jd));
    });

    it('works for year 1 CE', () => {
        const jd = vernalEquinoxJD(1);
        assert.ok(typeof jd === 'number' && Number.isFinite(jd));
    });

    it('works across different ΔT algorithm ranges', () => {
        // Test years that hit different ranges in deltaTSeconds
        const testYears = [-600, 400, 1550, 1650, 1750, 1850, 1920, 1950, 1990, 2010, 2100];
        for (const year of testYears) {
            const jd = vernalEquinoxJD(year);
            assert.ok(typeof jd === 'number' && Number.isFinite(jd), `Failed for year ${year}`);
        }
    });
});
