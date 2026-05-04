/**
 * Tests for JalaliDate arithmetic methods (addDays, addMonths, addYears)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('addDays', () => {
    it('adds positive days', () => {
        const d = new JalaliDate(1402, 6, 31).addDays(1);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1402, month: 7, day: 1 });
    });

    it('adds negative days', () => {
        const d = new JalaliDate(1402, 7, 1).addDays(-1);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1402, month: 6, day: 31 });
    });

    it('crosses year boundary', () => {
        const d = new JalaliDate(1402, 12, 29).addDays(1);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1403, month: 1, day: 1 });
    });

    it('is commutative: +n then -n returns original', () => {
        const original = new JalaliDate(1402, 6, 15);
        assert.ok(original.addDays(100).addDays(-100).equals(original));
    });

    it('handles adding 0 days', () => {
        const d = new JalaliDate(1402, 6, 15);
        const same = d.addDays(0);
        assert.ok(same.equals(d));
    });
});

describe('addMonths', () => {
    it('adds one month within the same year', () => {
        const d = new JalaliDate(1402, 5, 15).addMonths(1);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1402, month: 6, day: 15 });
    });

    it('wraps from month 12 to month 1 of next year', () => {
        const d = new JalaliDate(1402, 12, 1).addMonths(1);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1403, month: 1, day: 1 });
    });

    it('clamps day to last day of shorter month', () => {
        const d = new JalaliDate(1402, 6, 31).addMonths(1);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1402, month: 7, day: 30 });
    });

    it('subtracts months with negative n', () => {
        const d = new JalaliDate(1402, 3, 15).addMonths(-2);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1402, month: 1, day: 15 });
    });

    it('adds 12 months (one year)', () => {
        const d = new JalaliDate(1402, 6, 15).addMonths(12);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1403, month: 6, day: 15 });
    });

    it('adds 24 months (two years)', () => {
        const d = new JalaliDate(1402, 6, 15).addMonths(24);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1404, month: 6, day: 15 });
    });

    it('subtracts 13 months crossing year boundary', () => {
        const d = new JalaliDate(1402, 2, 15).addMonths(-13);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1401, month: 1, day: 15 });
    });

    it('handles 0 months', () => {
        const d = new JalaliDate(1402, 6, 15);
        const same = d.addMonths(0);
        assert.ok(same.equals(d));
    });

    it('clamps Esfand 30 when moving to common year', () => {
        const d = new JalaliDate(1403, 12, 30).addMonths(12);
        assert.equal(d.day, 29);
    });

    it('skips year 0 when adding months from year -1 to year 1', () => {
        const d = new JalaliDate(-1, 12, 15).addMonths(1);
        assert.equal(d.year, 1);
        assert.equal(d.month, 1);
        assert.equal(d.day, 15);
    });

    it('skips year 0 when subtracting months from year 1 to year -1', () => {
        const d = new JalaliDate(1, 1, 15).addMonths(-1);
        assert.equal(d.year, -1);
        assert.equal(d.month, 12);
        assert.equal(d.day, 15);
    });

    it('skips year 0 when adding many months across the boundary', () => {
        const d = new JalaliDate(-1, 6, 15).addMonths(7);
        assert.equal(d.year, 1);
        assert.equal(d.month, 1);
    });
});

describe('addYears', () => {
    it('adds one year', () => {
        const d = new JalaliDate(1402, 6, 15).addYears(1);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1403, month: 6, day: 15 });
    });

    it('clamps Esfand 30 (leap day) to Esfand 29 in a common year', () => {
        const d = new JalaliDate(1403, 12, 30).addYears(1);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1404, month: 12, day: 29 });
    });

    it('subtracts years with negative n', () => {
        const d = new JalaliDate(1402, 6, 15).addYears(-2);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1400, month: 6, day: 15 });
    });

    it('handles 0 years', () => {
        const d = new JalaliDate(1402, 6, 15);
        const same = d.addYears(0);
        assert.ok(same.equals(d));
    });

    it('adds multiple years', () => {
        const d = new JalaliDate(1400, 6, 15).addYears(10);
        assert.equal(d.year, 1410);
    });

    it('skips year 0 when adding years from negative to positive', () => {
        const d = new JalaliDate(-1, 6, 15).addYears(1);
        assert.equal(d.year, 1);
        assert.equal(d.month, 6);
        assert.equal(d.day, 15);
    });

    it('skips year 0 when subtracting years from positive to negative', () => {
        const d = new JalaliDate(1, 6, 15).addYears(-1);
        assert.equal(d.year, -1);
        assert.equal(d.month, 6);
        assert.equal(d.day, 15);
    });

    it('skips year 0 when adding multiple years across the boundary', () => {
        const d = new JalaliDate(-5, 6, 15).addYears(10);
        assert.equal(d.year, 6);
        assert.equal(d.month, 6);
    });
});

describe('arithmetic out of supported range', () => {
    it('addDays past JalaliDate.MAX_YEAR throws', () => {
        const d = new JalaliDate(JalaliDate.MAX_YEAR, 12, 29);
        assert.throws(() => d.addDays(10), Error);
    });

    it('addDays before JalaliDate.MIN_YEAR throws', () => {
        const d = new JalaliDate(JalaliDate.MIN_YEAR, 1, 1);
        assert.throws(() => d.addDays(-1), Error);
    });

    it('addMonths past JalaliDate.MAX_YEAR throws', () => {
        const d = new JalaliDate(JalaliDate.MAX_YEAR, 1, 1);
        assert.throws(() => d.addMonths(13), RangeError);
    });

    it('addMonths before JalaliDate.MIN_YEAR throws', () => {
        const d = new JalaliDate(JalaliDate.MIN_YEAR, 1, 1);
        assert.throws(() => d.addMonths(-1), RangeError);
    });

    it('addYears past JalaliDate.MAX_YEAR throws', () => {
        const d = new JalaliDate(JalaliDate.MAX_YEAR, 1, 1);
        assert.throws(() => d.addYears(1), RangeError);
    });

    it('addYears before JalaliDate.MIN_YEAR throws', () => {
        const d = new JalaliDate(JalaliDate.MIN_YEAR, 1, 1);
        assert.throws(() => d.addYears(-1), RangeError);
    });
});
