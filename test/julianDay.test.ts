/**
 * Tests for src/julianDay.ts
 * Covers gregorianToJDN and gregorianFromJDN including known anchor values,
 * the no-year-0 convention, and round-trip correctness for negative years.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { gregorianToJDN, gregorianFromJDN, gregorianDaysInMonth, gregorianIsLeapYear } from '../src/julianDay.ts';

// ---------------------------------------------------------------------------
// gregorianToJDN — known anchor values
// ---------------------------------------------------------------------------

describe('gregorianToJDN', () => {
    it('1970-01-01 → JDN 2440588  (Unix epoch = JD 2440587.5, so noon = JDN 2440588)', () => {
        assert.equal(gregorianToJDN(1970, 1, 1), 2440588);
    });

    it('2000-01-01 → JDN 2451545  (J2000.0 reference date)', () => {
        assert.equal(gregorianToJDN(2000, 1, 1), 2451545);
    });

    // ---- No-year-0 boundary ----
    it('year −1 (1 BCE) Dec 31 and year 1 (1 CE) Jan 1 are consecutive days', () => {
        // In the "no year 0" convention: ...−2, −1, 1, 2, ...
        // year −1 = 1 BCE; year 1 = 1 CE; the two dates must differ by exactly 1 JDN.
        assert.equal(gregorianToJDN(1, 1, 1), gregorianToJDN(-1, 12, 31) + 1);
    });

    // ---- Round-trips ----
    const SAMPLES: Array<[number, number, number]> = [
        [2024, 3, 20],   // Nowruz 1403
        [2000, 1, 1],   // J2000
        [1970, 1, 1],   // Unix epoch
        [1, 1, 1],   // 1 CE
        [-1, 12, 31],   // 1 BCE
        [-500, 6, 15],   // deep historical
        [2999, 12, 31],   // far future
    ];

    for (const [y, m, d] of SAMPLES) {
        it(`round-trip ${y}-${m}-${d}`, () => {
            assert.deepEqual(gregorianFromJDN(gregorianToJDN(y, m, d)), { year: y, month: m, day: d });
        });
    }

    it('handles leap day in leap year', () => {
        const jdn = gregorianToJDN(2000, 2, 29);
        assert.deepEqual(gregorianFromJDN(jdn), { year: 2000, month: 2, day: 29 });
    });

    it('handles leap day in year 2024', () => {
        const jdn = gregorianToJDN(2024, 2, 29);
        assert.deepEqual(gregorianFromJDN(jdn), { year: 2024, month: 2, day: 29 });
    });

    it('handles very large negative years', () => {
        const jdn = gregorianToJDN(-10000, 6, 15);
        assert.ok(typeof jdn === 'number' && Number.isFinite(jdn));
        const result = gregorianFromJDN(jdn);
        assert.deepEqual(result, { year: -10000, month: 6, day: 15 });
    });

    it('handles very large positive years', () => {
        const jdn = gregorianToJDN(10000, 6, 15);
        assert.ok(typeof jdn === 'number' && Number.isFinite(jdn));
        const result = gregorianFromJDN(jdn);
        assert.deepEqual(result, { year: 10000, month: 6, day: 15 });
    });

    it('consecutive days increment JDN by 1', () => {
        const jdn1 = gregorianToJDN(2024, 5, 3);
        const jdn2 = gregorianToJDN(2024, 5, 4);
        assert.equal(jdn2 - jdn1, 1);
    });
});

// ---------------------------------------------------------------------------
// gregorianFromJDN — known anchor values
// ---------------------------------------------------------------------------

describe('gregorianFromJDN', () => {
    it('JDN 0 = 4714 BC Nov 24 (proleptic Gregorian; year = −4714 in no-year-0 system)', () => {
        assert.deepEqual(gregorianFromJDN(0), { year: -4714, month: 11, day: 24 });
    });

    it('JDN 2440588 = 1970-01-01', () => {
        assert.deepEqual(gregorianFromJDN(2440588), { year: 1970, month: 1, day: 1 });
    });

    it('JDN 2451545 = 2000-01-01', () => {
        assert.deepEqual(gregorianFromJDN(2451545), { year: 2000, month: 1, day: 1 });
    });

    it('consecutive JDNs cross a normal year boundary (Dec 31 → Jan 1)', () => {
        assert.deepEqual(
            gregorianFromJDN(gregorianToJDN(2023, 12, 31)),
            { year: 2023, month: 12, day: 31 }
        );
        assert.deepEqual(
            gregorianFromJDN(gregorianToJDN(2023, 12, 31) + 1),
            { year: 2024, month: 1, day: 1 }
        );
    });

    it('consecutive JDNs cross the no-year-0 boundary (1 BCE → 1 CE)', () => {
        assert.deepEqual(
            gregorianFromJDN(gregorianToJDN(-1, 12, 31)),
            { year: -1, month: 12, day: 31 }
        );
        assert.deepEqual(
            gregorianFromJDN(gregorianToJDN(-1, 12, 31) + 1),
            { year: 1, month: 1, day: 1 }
        );
    });
});

// ---------------------------------------------------------------------------
// gregorianIsLeapYear
// ---------------------------------------------------------------------------

describe('gregorianIsLeapYear', () => {
    it('identifies 2024 as leap year (divisible by 4, not by 100)', () => {
        assert.equal(gregorianIsLeapYear(2024), true);
    });

    it('identifies 2023 as non-leap year', () => {
        assert.equal(gregorianIsLeapYear(2023), false);
    });

    it('identifies 2000 as leap year (divisible by 400)', () => {
        assert.equal(gregorianIsLeapYear(2000), true);
    });

    it('identifies 1900 as non-leap year (divisible by 100 but not 400)', () => {
        assert.equal(gregorianIsLeapYear(1900), false);
    });

    it('identifies 2100 as non-leap year (divisible by 100 but not 400)', () => {
        assert.equal(gregorianIsLeapYear(2100), false);
    });

    it('identifies 2400 as leap year (divisible by 400)', () => {
        assert.equal(gregorianIsLeapYear(2400), true);
    });

    it('identifies year 4 as leap year', () => {
        assert.equal(gregorianIsLeapYear(4), true);
    });

    it('identifies year 1 as non-leap year', () => {
        assert.equal(gregorianIsLeapYear(1), false);
    });

    it('handles negative years: -4 (5 BCE) is leap year', () => {
        assert.equal(gregorianIsLeapYear(-4), true);
    });

    it('handles negative years: -1 (1 BCE) is not leap year', () => {
        assert.equal(gregorianIsLeapYear(-1), false);
    });
});

// ---------------------------------------------------------------------------
// gregorianDaysInMonth
// ---------------------------------------------------------------------------

describe('gregorianDaysInMonth', () => {
    it('returns 31 for January', () => {
        assert.equal(gregorianDaysInMonth(2024, 1), 31);
    });

    it('returns 28 for February in non-leap year', () => {
        assert.equal(gregorianDaysInMonth(2023, 2), 28);
    });

    it('returns 29 for February in leap year', () => {
        assert.equal(gregorianDaysInMonth(2024, 2), 29);
    });

    it('returns 31 for March', () => {
        assert.equal(gregorianDaysInMonth(2024, 3), 31);
    });

    it('returns 30 for April', () => {
        assert.equal(gregorianDaysInMonth(2024, 4), 30);
    });

    it('returns 31 for May', () => {
        assert.equal(gregorianDaysInMonth(2024, 5), 31);
    });

    it('returns 30 for June', () => {
        assert.equal(gregorianDaysInMonth(2024, 6), 30);
    });

    it('returns 31 for July', () => {
        assert.equal(gregorianDaysInMonth(2024, 7), 31);
    });

    it('returns 31 for August', () => {
        assert.equal(gregorianDaysInMonth(2024, 8), 31);
    });

    it('returns 30 for September', () => {
        assert.equal(gregorianDaysInMonth(2024, 9), 30);
    });

    it('returns 31 for October', () => {
        assert.equal(gregorianDaysInMonth(2024, 10), 31);
    });

    it('returns 30 for November', () => {
        assert.equal(gregorianDaysInMonth(2024, 11), 30);
    });

    it('returns 31 for December', () => {
        assert.equal(gregorianDaysInMonth(2024, 12), 31);
    });

    it('returns 29 for February 2000 (leap year)', () => {
        assert.equal(gregorianDaysInMonth(2000, 2), 29);
    });

    it('returns 28 for February 1900 (not leap year)', () => {
        assert.equal(gregorianDaysInMonth(1900, 2), 28);
    });

    it('handles negative years: February in -4 (5 BCE, leap year)', () => {
        assert.equal(gregorianDaysInMonth(-4, 2), 29);
    });

    it('handles negative years: February in -1 (1 BCE, not leap year)', () => {
        assert.equal(gregorianDaysInMonth(-1, 2), 28);
    });
});
