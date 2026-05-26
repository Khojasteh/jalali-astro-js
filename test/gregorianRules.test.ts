/**
 * Tests for src/gregorianRules.ts
 *
 * Verifies for Gregorian calendar leap year and month length rules.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { gregorianDaysInMonth, gregorianIsLeapYear } from '../src/gregorianRules.ts';

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
        assert.throws(() => gregorianIsLeapYear(0), RangeError);
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
        assert.throws(() => gregorianDaysInMonth(0, 2), RangeError);
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