/**
 * Tests for JalaliDate arithmetic methods.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('addDays', () => {
    const cases: Array<{
        start: JalaliDate;
        days: number;
        expected: { year: number; month: number; day: number };
    }> = [
            { start: new JalaliDate(1402, 6, 31), days: 1, expected: { year: 1402, month: 7, day: 1 } },
            { start: new JalaliDate(1402, 7, 1), days: -1, expected: { year: 1402, month: 6, day: 31 } },
            { start: new JalaliDate(1402, 12, 29), days: 1, expected: { year: 1403, month: 1, day: 1 } },
            { start: new JalaliDate(1403, 1, 1), days: -1, expected: { year: 1402, month: 12, day: 29 } },
            { start: new JalaliDate(1403, 12, 30), days: 1, expected: { year: 1404, month: 1, day: 1 } },
            { start: new JalaliDate(1403, 1, 1), days: 365, expected: { year: 1403, month: 12, day: 30 } },
        ];

    for (const { start, days, expected } of cases) {
        it(`${start.toString()}.addDays(${days})`, () => {
            const result = start.addDays(days);
            assert.deepEqual(result.toObject(), expected);
        });
    }

    it('skips year 0 when adding one day after the final day of Jalali year -1', () => {
        const lastDay = JalaliDate.daysInMonth(-1, 12);
        const result = new JalaliDate(-1, 12, lastDay).addDays(1);
        assert.deepEqual(result.toObject(), { year: 1, month: 1, day: 1 });
    });

    it('skips year 0 when subtracting one day before Jalali 1/1/1', () => {
        const lastDay = JalaliDate.daysInMonth(-1, 12);
        const result = new JalaliDate(1, 1, 1).addDays(-1);
        assert.deepEqual(result.toObject(), { year: -1, month: 12, day: lastDay });
    });

    it('adding n and then -n returns the original date', () => {
        const original = new JalaliDate(1402, 6, 15);
        const result = original.addDays(100).addDays(-100);
        assert.ok(result.equals(original), 'Expected addDays to be reversible');
    });

    it('addDays(0) returns an equal but distinct value object', () => {
        const original = new JalaliDate(1402, 6, 15);
        const result = original.addDays(0);

        assert.ok(result.equals(original), 'Expected result to equal original');
        assert.notEqual(result, original);
    });

    it('rejects non-integer day counts', () => {
        const original = new JalaliDate(1402, 6, 15);

        for (const value of [1.5, NaN, Infinity, -Infinity]) {
            assert.throws(
                () => original.addDays(value),
                RangeError,
                `Expected addDays(${value}) to throw`
            );
        }
    });

    it('rejects results outside the supported range', () => {
        assert.throws(
            () => new JalaliDate(JalaliDate.MIN_YEAR, 1, 1).addDays(-1),
            RangeError,
            `Expected addDays(-1) on MIN_YEAR to throw`
        );

        assert.throws(
            () => new JalaliDate(JalaliDate.MAX_YEAR, 12, 29).addDays(1),
            RangeError,
            `Expected addDays(1) on MAX_YEAR to throw`
        );
    });
});

describe('addMonths', () => {
    const cases: Array<{
        start: JalaliDate;
        months: number;
        expected: { year: number; month: number; day: number };
    }> = [
            { start: new JalaliDate(1402, 5, 15), months: 1, expected: { year: 1402, month: 6, day: 15 } },
            { start: new JalaliDate(1402, 12, 1), months: 1, expected: { year: 1403, month: 1, day: 1 } },
            { start: new JalaliDate(1402, 6, 31), months: 1, expected: { year: 1402, month: 7, day: 30 } },
            { start: new JalaliDate(1402, 3, 15), months: -2, expected: { year: 1402, month: 1, day: 15 } },
            { start: new JalaliDate(1402, 6, 15), months: 12, expected: { year: 1403, month: 6, day: 15 } },
            { start: new JalaliDate(1402, 6, 15), months: 24, expected: { year: 1404, month: 6, day: 15 } },
            { start: new JalaliDate(1402, 2, 15), months: -13, expected: { year: 1401, month: 1, day: 15 } },
            { start: new JalaliDate(1403, 12, 30), months: 12, expected: { year: 1404, month: 12, day: 29 } },
            { start: new JalaliDate(1, 1, 15), months: -1, expected: { year: -1, month: 12, day: 15 } },
            { start: new JalaliDate(-1, 6, 15), months: 7, expected: { year: 1, month: 1, day: 15 } },
        ];

    for (const { start, months, expected } of cases) {
        it(`${start.toString()}.addMonths(${months})`, () => {
            const result = start.addMonths(months);
            assert.deepEqual(result.toObject(), expected);
        });
    }

    it('addMonths(0) returns an equal but distinct value object', () => {
        const original = new JalaliDate(1402, 6, 15);
        const result = original.addMonths(0);

        assert.ok(result.equals(original));
        assert.notEqual(result, original);
    });

    it('rejects non-integer month counts', () => {
        const original = new JalaliDate(1402, 6, 15);

        for (const value of [1.5, NaN, Infinity, -Infinity]) {
            assert.throws(
                () => original.addMonths(value),
                RangeError,
                `Expected addMonths(${value}) to throw`
            );
        }
    });

    it('rejects results outside the supported range', () => {
        assert.throws(
            () => new JalaliDate(JalaliDate.MIN_YEAR, 1, 1).addMonths(-1),
            RangeError,
            `Expected addMonths(-1) on MIN_YEAR to throw`
        );
        assert.throws(
            () => new JalaliDate(JalaliDate.MAX_YEAR, 12, 1).addMonths(1),
            RangeError,
            `Expected addMonths(1) on MAX_YEAR to throw`
        );
    });
});

describe('addYears', () => {
    const cases: Array<{
        start: JalaliDate;
        years: number;
        expected: { year: number; month: number; day: number };
    }> = [
            { start: new JalaliDate(1402, 6, 15), years: 1, expected: { year: 1403, month: 6, day: 15 } },
            { start: new JalaliDate(1403, 12, 30), years: 1, expected: { year: 1404, month: 12, day: 29 } },
            { start: new JalaliDate(1402, 6, 15), years: -2, expected: { year: 1400, month: 6, day: 15 } },
            { start: new JalaliDate(1400, 6, 15), years: 10, expected: { year: 1410, month: 6, day: 15 } },
            { start: new JalaliDate(-1, 6, 15), years: 1, expected: { year: 1, month: 6, day: 15 } },
            { start: new JalaliDate(1, 6, 15), years: -1, expected: { year: -1, month: 6, day: 15 } },
            { start: new JalaliDate(-5, 6, 15), years: 10, expected: { year: 6, month: 6, day: 15 } },
        ];

    for (const { start, years, expected } of cases) {
        it(`${start.toString()}.addYears(${years})`, () => {
            const result = start.addYears(years);
            assert.deepEqual(result.toObject(), expected);
        });
    }

    it('addYears(0) returns an equal but distinct value object', () => {
        const original = new JalaliDate(1402, 6, 15);
        const result = original.addYears(0);

        assert.ok(result.equals(original), 'Expected result to equal original');
        assert.notEqual(result, original);
    });

    it('rejects non-integer year counts', () => {
        const original = new JalaliDate(1402, 6, 15);

        for (const value of [1.5, NaN, Infinity, -Infinity]) {
            assert.throws(
                () => original.addYears(value),
                RangeError,
                `Expected addYears(${value}) to throw`
            );
        }
    });

    it('rejects results outside the supported range', () => {
        assert.throws(
            () => new JalaliDate(JalaliDate.MIN_YEAR, 1, 1).addYears(-1),
            RangeError,
            `Expected addYears(-1) on MIN_YEAR to throw`
        );
        assert.throws(
            () => new JalaliDate(JalaliDate.MAX_YEAR, 1, 1).addYears(1),
            RangeError,
            `Expected addYears(1) on MAX_YEAR to throw`
        );
    });
});
