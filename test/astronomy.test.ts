/**
 * Tests for src/astronomy.ts
 *
 * Verifies vernalEquinoxJD(year), which returns a fractional Julian Day
 * for the March/vernal equinox.
 *
 * These spot checks compare against known UTC equinox instants converted
 * to fractional Julian Day. The algorithm is expected to be accurate to
 * at least 60 seconds for supported years.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { vernalEquinoxJD, MEEUS_MIN_YEAR, MEEUS_MAX_YEAR } from '../src/astronomy.ts';

function dateToJD(isoUtc: string): number {
    const ms = Date.parse(isoUtc);
    return ms / 86_400_000 + 2_440_587.5;
}

function assertAlmostEqualJD(
    actual: number,
    expected: number,
    toleranceSeconds: number
): void {
    assert.ok(Number.isFinite(actual), `Actual JD is not finite: ${actual}`);

    const diffSeconds = Math.abs(actual - expected) * 86_400;

    assert.ok(
        diffSeconds <= toleranceSeconds,
        [
            `Expected ${actual.toFixed(8)} ≈ ${expected.toFixed(8)}`,
            `diff = ${diffSeconds.toFixed(1)}s`,
            `tolerance = ${toleranceSeconds}s`,
        ].join(', ')
    );
}

describe('vernalEquinoxJD', () => {
    it('rejects years below MEEUS_MIN_YEAR', () => {
        assert.throws(
            () => vernalEquinoxJD(MEEUS_MIN_YEAR - 1),
            RangeError,
            `Expected vernalEquinoxJD(${MEEUS_MIN_YEAR - 1}) to throw`
        );
    });

    it('rejects years above MEEUS_MAX_YEAR', () => {
        assert.throws(
            () => vernalEquinoxJD(MEEUS_MAX_YEAR + 1),
            RangeError,
            `Expected vernalEquinoxJD(${MEEUS_MAX_YEAR + 1}) to throw`
        );
    });

    it('accepts year at MEEUS_MIN_YEAR', () => {
        const jd = vernalEquinoxJD(MEEUS_MIN_YEAR);
        assert.ok(Number.isFinite(jd));
    });

    it('accepts year at MEEUS_MAX_YEAR', () => {
        const jd = vernalEquinoxJD(MEEUS_MAX_YEAR);
        assert.ok(Number.isFinite(jd));
    });

    const spotChecks: Array<{ year: number; utc: string }> = [
        { year: 1800, utc: '1800-03-20T20:12:00Z' },
        { year: 1900, utc: '1900-03-21T01:39:00Z' },
        { year: 2000, utc: '2000-03-20T07:35:00Z' },
        { year: 2010, utc: '2010-03-20T17:32:00Z' },
        { year: 2020, utc: '2020-03-20T03:50:00Z' },
        { year: 2023, utc: '2023-03-20T21:24:00Z' },
        { year: 2024, utc: '2024-03-20T03:06:00Z' },
        { year: 2025, utc: '2025-03-20T09:01:00Z' },
        { year: 2026, utc: '2026-03-20T14:46:00Z' },
    ];

    const TOLERANCE_SECONDS = 60;

    for (const { year, utc } of spotChecks) {
        it(`year ${year}: within ${TOLERANCE_SECONDS}s of ${utc}`, () => {
            const expected = dateToJD(utc);
            const actual = vernalEquinoxJD(year);

            assertAlmostEqualJD(actual, expected, TOLERANCE_SECONDS);
        });
    }
});