/**
 * Tests for src/julianDay.ts
 *
 * Verifies for Julian Day Number (JDN) and Gregorian calendar conversion utilities
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { gregorianToJDN, gregorianFromJDN, dayOfWeekFromJDN } from '../src/julianDay.ts';

type GregorianDate = {
    year: number;
    month: number;
    day: number;
};

function assertGregorianDateEqual(actual: GregorianDate, expected: GregorianDate): void {
    assert.deepEqual(
        actual,
        expected,
        `Expected ${expected.year}-${expected.month}-${expected.day}, got ${actual.year}-${actual.month}-${actual.day}`
    );
}

function assertRoundTrip(year: number, month: number, day: number): void {
    const jdn = gregorianToJDN(year, month, day);

    assert.equal(
        Number.isInteger(jdn),
        true,
        `JDN should be an integer for ${year}-${month}-${day}`
    );

    assertGregorianDateEqual(gregorianFromJDN(jdn), { year, month, day });
}

// ---------------------------------------------------------------------------
// gregorianToJDN / gregorianFromJDN — known anchor values
// ---------------------------------------------------------------------------

describe('Gregorian calendar JDN conversion', () => {
    const knownJdns: Array<{
        date: GregorianDate;
        jdn: number;
        label: string;
    }> = [
            {
                date: { year: -4714, month: 11, day: 24 },
                jdn: 0,
                label: 'JDN epoch in proleptic Gregorian calendar',
            },
            {
                date: { year: 1970, month: 1, day: 1 },
                jdn: 2440588,
                label: 'Unix epoch date',
            },
            {
                date: { year: 2000, month: 1, day: 1 },
                jdn: 2451545,
                label: 'J2000 civil date',
            },
            {
                date: { year: 2024, month: 5, day: 3 },
                jdn: 2460434,
                label: 'modern date anchor',
            },
        ];

    for (const { date, jdn, label } of knownJdns) {
        it(`converts ${date.year}-${date.month}-${date.day} to JDN ${jdn} (${label})`, () => {
            assert.equal(
                gregorianToJDN(date.year, date.month, date.day),
                jdn
            );
        });

        it(`converts JDN ${jdn} to ${date.year}-${date.month}-${date.day} (${label})`, () => {
            assertGregorianDateEqual(
                gregorianFromJDN(jdn),
                date
            );
        });
    }

    const roundTripDates: GregorianDate[] = [
        { year: 1, month: 1, day: 1 },
        { year: -1, month: 12, day: 31 },
        { year: -500, month: 6, day: 15 },
        { year: 2999, month: 12, day: 31 },
        { year: -10000, month: 6, day: 15 },
        { year: 10000, month: 6, day: 15 },

        { year: 4, month: 2, day: 29 },
        { year: 2000, month: 2, day: 29 },
        { year: 2024, month: 2, day: 29 },

        { year: 1900, month: 2, day: 28 },
        { year: 2100, month: 2, day: 28 },
        { year: 2400, month: 2, day: 29 },

        { year: 2023, month: 12, day: 31 },
        { year: 2024, month: 1, day: 1 },
    ];

    for (const { year, month, day } of roundTripDates) {
        it(`round-trips ${year}-${month}-${day}`, () => {
            assertRoundTrip(year, month, day);
        });
    }

    const consecutiveCases: Array<[GregorianDate, GregorianDate]> = [
        [
            { year: 2024, month: 5, day: 3 },
            { year: 2024, month: 5, day: 4 },
        ],
        [
            { year: 2023, month: 12, day: 31 },
            { year: 2024, month: 1, day: 1 },
        ],
        [
            { year: -1, month: 12, day: 31 },
            { year: 1, month: 1, day: 1 },
        ],
    ];

    for (const [a, b] of consecutiveCases) {
        it(`increments JDN by 1: ${a.year}-${a.month}-${a.day} -> ${b.year}-${b.month}-${b.day}`, () => {
            const jdnA = gregorianToJDN(a.year, a.month, a.day);
            const jdnB = gregorianToJDN(b.year, b.month, b.day);

            assert.equal(
                jdnB - jdnA,
                1,
                `Expected ${b.year}-${b.month}-${b.day} to be one day after ${a.year}-${a.month}-${a.day}`
            );
        });
    }

    it('rejects year zero', () => {
        assert.throws(
            () => gregorianToJDN(0, 1, 1),
            RangeError
        );
    });

    const invalidMonths = [0, 13, -1, 99];
    for (const month of invalidMonths) {
        it(`rejects invalid month ${month}`, () => {
            assert.throws(
                () => gregorianToJDN(2024, month, 1),
                RangeError,
                `Expected month ${month} to be rejected`
            );
        });
    }
});

// ---------------------------------------------------------------------------
// gregorianFromJDN
// ---------------------------------------------------------------------------

describe('gregorianFromJDN', () => {
    const dec31 = gregorianToJDN(2023, 12, 31);

    it('returns 2023-12-31 for JDN of 2023-12-31', () => {
        assertGregorianDateEqual(
            gregorianFromJDN(dec31),
            { year: 2023, month: 12, day: 31 }
        );
    });

    it('returns 2024-1-1 for JDN one greater than 2023-12-31', () => {
        assertGregorianDateEqual(
            gregorianFromJDN(dec31 + 1),
            { year: 2024, month: 1, day: 1 }
        );
    });

    const bceDec31 = gregorianToJDN(-1, 12, 31);

    it('returns -1-12-31 for JDN of -1-12-31', () => {
        assertGregorianDateEqual(
            gregorianFromJDN(bceDec31),
            { year: -1, month: 12, day: 31 }
        );
    });

    it('returns 1-1-1 for JDN one greater than -1-12-31', () => {
        assertGregorianDateEqual(
            gregorianFromJDN(bceDec31 + 1),
            { year: 1, month: 1, day: 1 }
        );
    });
});

// ---------------------------------------------------------------------------
// dayOfWeekFromJDN
// ---------------------------------------------------------------------------

describe('dayOfWeekFromJDN', () => {
    const cases: Array<{ date: GregorianDate; expected: number; label: string }> = [
        { date: { year: 1970, month: 1, day: 1 }, expected: 4, label: 'Unix epoch (Thursday)' },
        { date: { year: 2000, month: 1, day: 1 }, expected: 6, label: 'J2000 (Saturday)' },
        { date: { year: 2024, month: 5, day: 3 }, expected: 5, label: 'modern date (Friday)' },
    ];

    for (const { date, expected, label } of cases) {
        it(`returns ${expected} for ${date.year}-${date.month}-${date.day} (${label})`, () => {
            const jdn = gregorianToJDN(date.year, date.month, date.day);

            assert.equal(
                dayOfWeekFromJDN(jdn),
                expected
            );
        });
    }

    const sampleJDN = gregorianToJDN(2024, 5, 3);

    it('advances by 1 for the next JDN', () => {
        assert.equal(
            dayOfWeekFromJDN(sampleJDN + 1),
            (dayOfWeekFromJDN(sampleJDN) + 1) % 7
        );
    });

    it('repeats every 7 days', () => {
        assert.equal(
            dayOfWeekFromJDN(sampleJDN + 7),
            dayOfWeekFromJDN(sampleJDN)
        );
    });

    it('handles negative JDNs (returns 0..6 and repeats every 7 days)', () => {
        const negativeJDN = -1;
        const negDow = dayOfWeekFromJDN(negativeJDN);

        assert.equal(Number.isInteger(negDow), true, 'dayOfWeek should be an integer for negative JDN');
        assert.ok(negDow >= 0 && negDow <= 6, `dayOfWeek ${negDow} out of range for negative JDN`);
        assert.equal(dayOfWeekFromJDN(negativeJDN + 7), negDow, 'dayOfWeek should repeat every 7 days for negative JDNs');
    });
});
