/**
 * Tests for JalaliDate constructor validation
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('JalaliDate constructor', () => {
    it('creates a valid date', () => {
        const d = new JalaliDate(1402, 6, 31);
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('throws RangeError for month < 1', () => {
        assert.throws(() => new JalaliDate(1402, 0, 1), RangeError);
    });

    it('throws RangeError for month > 12', () => {
        assert.throws(() => new JalaliDate(1402, 13, 1), RangeError);
    });

    it('throws RangeError for day < 1', () => {
        assert.throws(() => new JalaliDate(1402, 1, 0), RangeError);
    });

    it('throws RangeError for day 32 in month 1', () => {
        assert.throws(() => new JalaliDate(1402, 1, 32), RangeError);
    });

    it('throws RangeError for Esfand 30 in a common year', () => {
        // 1402 is a common year
        assert.equal(new JalaliDate(1402, 1, 1).isLeapYear, false);
        assert.throws(() => new JalaliDate(1402, 12, 30), RangeError);
    });

    it('allows Esfand 30 in a leap year', () => {
        // 1403 is a leap year
        const d = new JalaliDate(1403, 12, 30);
        assert.equal(d.day, 30);
    });

    it('creates date with negative year', () => {
        const d = new JalaliDate(-100, 1, 1);
        assert.equal(d.year, -100);
        assert.equal(d.month, 1);
        assert.equal(d.day, 1);
    });

    it('throws RangeError for year 0', () => {
        assert.throws(() => new JalaliDate(0, 1, 1), RangeError);
    });
});
