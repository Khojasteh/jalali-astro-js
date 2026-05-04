/**
 * Tests for JalaliDate comparison methods
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('comparisons', () => {
    const earlier = new JalaliDate(1402, 3, 10);
    const same = new JalaliDate(1402, 3, 10);
    const later = new JalaliDate(1402, 3, 11);

    it('equals', () => {
        assert.ok(earlier.equals(same));
        assert.ok(!earlier.equals(later));
    });

    it('isBefore', () => {
        assert.ok(earlier.isBefore(later));
        assert.ok(!later.isBefore(earlier));
        assert.ok(!earlier.isBefore(same));
    });

    it('isAfter', () => {
        assert.ok(later.isAfter(earlier));
        assert.ok(!earlier.isAfter(later));
    });

    it('compareTo returns negative/zero/positive', () => {
        assert.ok(earlier.compareTo(later) < 0);
        assert.equal(earlier.compareTo(same), 0);
        assert.ok(later.compareTo(earlier) > 0);
    });

    it('equals returns false for different dates', () => {
        const d1 = new JalaliDate(1402, 6, 15);
        const d2 = new JalaliDate(1402, 6, 16);
        assert.ok(!d1.equals(d2));
    });

    it('comparisons work across year boundaries', () => {
        const endOfYear = new JalaliDate(1402, 12, 29);
        const startOfNextYear = new JalaliDate(1403, 1, 1);
        assert.ok(endOfYear.isBefore(startOfNextYear));
        assert.ok(startOfNextYear.isAfter(endOfYear));
    });

    it('comparisons work with negative years', () => {
        const d1 = new JalaliDate(-100, 6, 15);
        const d2 = new JalaliDate(-99, 6, 15);
        assert.ok(d1.isBefore(d2));
        assert.ok(d2.isAfter(d1));
    });
});

describe('isBetween', () => {
    it('returns true when date is between start and end (inclusive)', () => {
        const date = new JalaliDate(1403, 5, 15);
        const start = new JalaliDate(1403, 5, 1);
        const end = new JalaliDate(1403, 5, 31);
        assert.equal(date.isBetween(start, end), true);
    });

    it('returns true when date equals start', () => {
        const date = new JalaliDate(1403, 5, 1);
        const start = new JalaliDate(1403, 5, 1);
        const end = new JalaliDate(1403, 5, 31);
        assert.equal(date.isBetween(start, end), true);
    });

    it('returns true when date equals end', () => {
        const date = new JalaliDate(1403, 5, 31);
        const start = new JalaliDate(1403, 5, 1);
        const end = new JalaliDate(1403, 5, 31);
        assert.equal(date.isBetween(start, end), true);
    });

    it('returns false when date is before start', () => {
        const date = new JalaliDate(1403, 4, 30);
        const start = new JalaliDate(1403, 5, 1);
        const end = new JalaliDate(1403, 5, 31);
        assert.equal(date.isBetween(start, end), false);
    });

    it('returns false when date is after end', () => {
        const date = new JalaliDate(1403, 6, 1);
        const start = new JalaliDate(1403, 5, 1);
        const end = new JalaliDate(1403, 5, 31);
        assert.equal(date.isBetween(start, end), false);
    });

    it('works across year boundaries', () => {
        const date = new JalaliDate(1403, 1, 15);
        const start = new JalaliDate(1402, 12, 1);
        const end = new JalaliDate(1403, 2, 1);
        assert.equal(date.isBetween(start, end), true);
    });
});
