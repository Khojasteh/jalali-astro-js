/**
 * Tests for src/julianDay.ts
 *
 * Verifies for Julian Day Number (JDN) and Gregorian calendar conversion utilities
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
    gregorianToJDN,
    gregorianFromJDN,
    gregorianIsLeapYear,
    gregorianDaysInMonth,
} from '../src/julianDay.ts';

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

    it('increments JDN by 1 for consecutive Gregorian dates', () => {
        const cases: Array<[GregorianDate, GregorianDate]> = [
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

        for (const [a, b] of cases) {
            const jdnA = gregorianToJDN(a.year, a.month, a.day);
            const jdnB = gregorianToJDN(b.year, b.month, b.day);

            assert.equal(
                jdnB - jdnA,
                1,
                `Expected ${b.year}-${b.month}-${b.day} to be one day after ${a.year}-${a.month}-${a.day}`
            );
        }
    });

    it('rejects year zero', () => {
        assert.throws(
            () => gregorianToJDN(0, 1, 1),
            RangeError
        );
    });

    it('rejects invalid months', () => {
        const invalidMonths = [0, 13, -1, 99];

        for (const month of invalidMonths) {
            assert.throws(
                () => gregorianToJDN(2024, month, 1),
                RangeError,
                `Expected month ${month} to be rejected`
            );
        }
    });
});

// ---------------------------------------------------------------------------
// gregorianFromJDN
// ---------------------------------------------------------------------------

describe('gregorianFromJDN', () => {
    it('crosses a normal year boundary correctly', () => {
        const dec31 = gregorianToJDN(2023, 12, 31);

        assertGregorianDateEqual(
            gregorianFromJDN(dec31),
            { year: 2023, month: 12, day: 31 }
        );

        assertGregorianDateEqual(
            gregorianFromJDN(dec31 + 1),
            { year: 2024, month: 1, day: 1 }
        );
    });

    it('crosses the no-year-zero boundary correctly', () => {
        const bceDec31 = gregorianToJDN(-1, 12, 31);

        assertGregorianDateEqual(
            gregorianFromJDN(bceDec31),
            { year: -1, month: 12, day: 31 }
        );

        assertGregorianDateEqual(
            gregorianFromJDN(bceDec31 + 1),
            { year: 1, month: 1, day: 1 }
        );
    });
});

// ---------------------------------------------------------------------------
// gregorianIsLeapYear
// ---------------------------------------------------------------------------

describe('gregorianIsLeapYear', () => {
    const cases: Array<{
        year: number;
        expected: boolean;
        reason: string;
    }> = [
            { year: 1, expected: false, reason: 'ordinary common year' },
            { year: 4, expected: true, reason: 'divisible by 4' },
            { year: 2023, expected: false, reason: 'ordinary common year' },
            { year: 2024, expected: true, reason: 'divisible by 4, not by 100' },
            { year: 1900, expected: false, reason: 'divisible by 100 but not by 400' },
            { year: 2000, expected: true, reason: 'divisible by 400' },
            { year: 2100, expected: false, reason: 'divisible by 100 but not by 400' },
            { year: 2400, expected: true, reason: 'divisible by 400' },
            { year: -1, expected: false, reason: '1 BCE, common year' },
            { year: -4, expected: true, reason: '5 BCE, leap year under implementation convention' },
        ];

    for (const { year, expected, reason } of cases) {
        it(`identifies ${year} as ${expected ? 'leap' : 'common'} year (${reason})`, () => {
            assert.equal(gregorianIsLeapYear(year), expected);
        });
    }

    it('rejects year zero', () => {
        assert.throws(
            () => gregorianIsLeapYear(0),
            RangeError
        );
    });
});

// ---------------------------------------------------------------------------
// gregorianDaysInMonth
// ---------------------------------------------------------------------------

describe('gregorianDaysInMonth', () => {
    const monthLengths2024: Array<[number, number]> = [
        [1, 31],
        [2, 29],
        [3, 31],
        [4, 30],
        [5, 31],
        [6, 30],
        [7, 31],
        [8, 31],
        [9, 30],
        [10, 31],
        [11, 30],
        [12, 31],
    ];

    for (const [month, days] of monthLengths2024) {
        it(`returns ${days} days for month ${month} in leap year 2024`, () => {
            assert.equal(gregorianDaysInMonth(2024, month), days);
        });
    }

    const februaryCases: Array<{
        year: number;
        days: number;
        reason: string;
    }> = [
            { year: 2023, days: 28, reason: 'ordinary common year' },
            { year: 2024, days: 29, reason: 'ordinary leap year' },
            { year: 1900, days: 28, reason: 'century common year' },
            { year: 2000, days: 29, reason: '400-year leap year' },
            { year: -1, days: 28, reason: '1 BCE common year' },
            { year: -4, days: 29, reason: '5 BCE leap year under implementation convention' },
        ];

    for (const { year, days, reason } of februaryCases) {
        it(`returns ${days} days for February ${year} (${reason})`, () => {
            assert.equal(gregorianDaysInMonth(year, 2), days);
        });
    }

    it('rejects year zero', () => {
        assert.throws(
            () => gregorianDaysInMonth(0, 2),
            RangeError
        );
    });

    it('rejects invalid months', () => {
        const invalidMonths = [0, 13, -1, 99];

        for (const month of invalidMonths) {
            assert.throws(
                () => gregorianDaysInMonth(2024, month),
                RangeError,
                `Expected month ${month} to be rejected`
            );
        }
    });
});