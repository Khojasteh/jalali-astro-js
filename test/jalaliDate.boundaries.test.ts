/**
 * Tests for JalaliDate range boundaries and edge cases
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('JalaliDate range boundaries', () => {
    it('constructs at JalaliDate.MIN_YEAR 1/1/1', () => {
        const d = new JalaliDate(JalaliDate.MIN_YEAR, 1, 1);
        assert.equal(d.year, JalaliDate.MIN_YEAR);
    });

    it('constructs at JalaliDate.MAX_YEAR 12/(last day)', () => {
        const lastDay = JalaliDate.isLeapYear(JalaliDate.MAX_YEAR) ? 30 : 29;
        const d = new JalaliDate(JalaliDate.MAX_YEAR, 12, lastDay);
        assert.equal(d.year, JalaliDate.MAX_YEAR);
        assert.equal(d.day, lastDay);
    });

    it('throws RangeError for year below JalaliDate.MIN_YEAR', () => {
        assert.throws(() => new JalaliDate(JalaliDate.MIN_YEAR - 1, 1, 1), RangeError);
    });

    it('throws RangeError for year above JalaliDate.MAX_YEAR', () => {
        assert.throws(() => new JalaliDate(JalaliDate.MAX_YEAR + 1, 1, 1), RangeError);
    });

    it('MIN_YEAR 1/1/1 converts to Gregorian but cannot round-trip', () => {
        const d = new JalaliDate(JalaliDate.MIN_YEAR, 1, 1);
        const g = d.toGregorian();
        assert.equal(g.year, -1001);
        assert.throws(
            () => JalaliDate.fromGregorian(g.year, g.month, g.day),
            RangeError
        );
    });

    it('round-trips via toGregorian/fromGregorian at a valid boundary date', () => {
        const d = new JalaliDate(JalaliDate.MIN_YEAR + 200, 1, 1);
        const g = d.toGregorian();
        assert.ok(g.year >= JalaliDate.MIN_GREGORIAN_YEAR);
        assert.ok(JalaliDate.fromGregorian(g.year, g.month, g.day).equals(d));
    });

    it('round-trips via toGregorian/fromGregorian at JalaliDate.MAX_YEAR 1/1/1', () => {
        const d = new JalaliDate(JalaliDate.MAX_YEAR, 1, 1);
        const g = d.toGregorian();
        assert.ok(JalaliDate.fromGregorian(g.year, g.month, g.day).equals(d));
    });

    it('dayOfYear works at MIN_YEAR', () => {
        const d = new JalaliDate(JalaliDate.MIN_YEAR, 1, 1);
        assert.equal(d.dayOfYear, 1);
    });

    it('dayOfYear works at MAX_YEAR', () => {
        const lastDay = JalaliDate.isLeapYear(JalaliDate.MAX_YEAR) ? 30 : 29;
        const d = new JalaliDate(JalaliDate.MAX_YEAR, 12, lastDay);
        const expectedDayOfYear = JalaliDate.isLeapYear(JalaliDate.MAX_YEAR) ? 366 : 365;
        assert.equal(d.dayOfYear, expectedDayOfYear);
    });
});

describe('JalaliDate.fromDate Unix epoch', () => {
    it('Unix epoch maps to Gregorian 1970-01-01 in Tehran', () => {
        const d = JalaliDate.fromDate(new Date(0));
        assert.deepEqual(d.toGregorian(), { year: 1970, month: 1, day: 1 });
    });

    it('Unix epoch round-trips via toGregorian/fromGregorian', () => {
        const d = JalaliDate.fromDate(new Date(0));
        const g = d.toGregorian();
        assert.ok(JalaliDate.fromGregorian(g.year, g.month, g.day).equals(d));
    });

    it('handles timestamps just before Tehran midnight', () => {
        const beforeMidnight = new Date('2024-03-19T20:29:59Z');
        const d = JalaliDate.fromDate(beforeMidnight);
        const afterMidnight = new Date('2024-03-19T20:30:01Z');
        const d2 = JalaliDate.fromDate(afterMidnight);
        assert.ok(!d.equals(d2) || d.day !== d2.day);
    });
});
