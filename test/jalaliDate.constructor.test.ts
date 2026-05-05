/**
 * Tests for JalaliDate constructor validation.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('JalaliDate constructor', () => {
    it('creates valid dates at representative positions', () => {
        const cases = [
            { input: [1402, 1, 1], expected: { year: 1402, month: 1, day: 1 } },
            { input: [1402, 6, 31], expected: { year: 1402, month: 6, day: 31 } },
            { input: [1402, 7, 30], expected: { year: 1402, month: 7, day: 30 } },
            { input: [1403, 12, 30], expected: { year: 1403, month: 12, day: 30 } },
            { input: [-100, 1, 1], expected: { year: -100, month: 1, day: 1 } },
            { input: [-1, 12, JalaliDate.daysInMonth(-1, 12)], expected: { year: -1, month: 12, day: JalaliDate.daysInMonth(-1, 12) } },
        ] as const;

        for (const { input, expected } of cases) {
            const [year, month, day] = input;
            const date = new JalaliDate(year, month, day);
            assert.deepEqual(date.toObject(), expected);
        }
    });

    it('constructs the supported range boundaries', () => {
        const date1 = new JalaliDate(JalaliDate.MIN_YEAR, 1, 1);
        assert.deepEqual(date1.toObject(), { year: JalaliDate.MIN_YEAR, month: 1, day: 1 });

        const lastDay = JalaliDate.daysInMonth(JalaliDate.MAX_YEAR, 12);
        const date2 = new JalaliDate(JalaliDate.MAX_YEAR, 12, lastDay);
        assert.deepEqual(date2.toObject(), { year: JalaliDate.MAX_YEAR, month: 12, day: lastDay });
    });

    it('rejects invalid years', () => {
        const invalidYears = [
            JalaliDate.MIN_YEAR - 1,
            JalaliDate.MAX_YEAR + 1,
            0,
            1.5,
            -1.5,
            NaN,
            Infinity,
            -Infinity,
        ];

        for (const year of invalidYears) {
            assert.throws(
                () => new JalaliDate(year, 1, 1),
                RangeError,
                `Expected new JalaliDate(${year}, 1, 1) to throw`
            );
        }
    });

    it('rejects invalid months', () => {
        const invalidMonths = [0, 13, -1, 1.5, NaN, Infinity, -Infinity];

        for (const month of invalidMonths) {
            assert.throws(
                () => new JalaliDate(1403, month, 1),
                RangeError,
                `Expected new JalaliDate(1403, ${month}, 1) to throw`
            );
        }
    });

    it('rejects invalid days by actual Jalali month length', () => {
        const invalidDates = [
            { year: 1403, month: 1, day: 0 },
            { year: 1403, month: 1, day: 32 },
            { year: 1403, month: 7, day: 31 },
            { year: 1402, month: 12, day: 30 },
            { year: 1403, month: 12, day: 31 },
            { year: 1403, month: 5, day: 1.5 },
            { year: 1403, month: 5, day: NaN },
            { year: 1403, month: 5, day: Infinity },
            { year: 1403, month: 5, day: -Infinity },
        ];

        for (const { year, month, day } of invalidDates) {
            assert.throws(
                () => new JalaliDate(year, month, day),
                RangeError,
                `Expected new JalaliDate(${year}, ${month}, ${day}) to throw`
            );
        }
    });
});
