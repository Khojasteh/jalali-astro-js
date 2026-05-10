/**
 * Tests for JalaliDate comparison methods.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('equals', () => {
    it('returns true for identical dates', () => {
        const date1 = new JalaliDate(1402, 3, 10);
        const date2 = new JalaliDate(1402, 3, 10);
        assert.equal(date1.equals(date2), true);
    });

    it('returns false for different dates', () => {
        const earlier = new JalaliDate(1402, 3, 10);
        const later = new JalaliDate(1402, 3, 11);
        assert.equal(earlier.equals(later), false);
    });
});

describe('compareTo', () => {
    it('returns 0 for equal dates', () => {
        const date1 = new JalaliDate(1402, 3, 10);
        const date2 = new JalaliDate(1402, 3, 10);
        assert.equal(date1.compareTo(date2), 0);
    });

    it('returns negative when this is before other', () => {
        const earlier = new JalaliDate(1402, 3, 10);
        const later = new JalaliDate(1402, 3, 11);
        assert.ok(earlier.compareTo(later) < 0);
    });

    it('returns positive when this is after other', () => {
        const later = new JalaliDate(1402, 3, 11);
        const earlier = new JalaliDate(1402, 3, 10);
        assert.ok(later.compareTo(earlier) > 0);
    });

    it('compares across year boundaries', () => {
        const endOfYear = new JalaliDate(1402, 12, 29);
        const startOfNextYear = new JalaliDate(1403, 1, 1);
        assert.ok(endOfYear.compareTo(startOfNextYear) < 0);
    });

    it('compares across the no-year-zero boundary', () => {
        const lastDay = JalaliDate.daysInMonth(-1, 12);
        const bce = new JalaliDate(-1, 12, lastDay);
        const ce = new JalaliDate(1, 1, 1);
        assert.ok(bce.compareTo(ce) < 0);
    });
});

describe('isBefore', () => {
    it('returns false for equal dates', () => {
        const date1 = new JalaliDate(1402, 3, 10);
        const date2 = new JalaliDate(1402, 3, 10);
        assert.equal(date1.isBefore(date2), false);
    });

    it('returns true when this is before other', () => {
        const earlier = new JalaliDate(1402, 3, 10);
        const later = new JalaliDate(1402, 3, 11);
        assert.equal(earlier.isBefore(later), true);
    });

    it('returns false when this is after other', () => {
        const later = new JalaliDate(1402, 3, 11);
        const earlier = new JalaliDate(1402, 3, 10);
        assert.equal(later.isBefore(earlier), false);
    });

    it('works across year boundaries', () => {
        const endOfYear = new JalaliDate(1402, 12, 29);
        const startOfNextYear = new JalaliDate(1403, 1, 1);
        assert.equal(endOfYear.isBefore(startOfNextYear), true);
    });

    it('works across the no-year-zero boundary', () => {
        const lastDay = JalaliDate.daysInMonth(-1, 12);
        const bce = new JalaliDate(-1, 12, lastDay);
        const ce = new JalaliDate(1, 1, 1);
        assert.equal(bce.isBefore(ce), true);
    });
});

describe('isAfter', () => {
    it('returns false for equal dates', () => {
        const date1 = new JalaliDate(1402, 3, 10);
        const date2 = new JalaliDate(1402, 3, 10);
        assert.equal(date1.isAfter(date2), false);
    });

    it('returns true when this is after other', () => {
        const later = new JalaliDate(1402, 3, 11);
        const earlier = new JalaliDate(1402, 3, 10);
        assert.equal(later.isAfter(earlier), true);
    });

    it('returns false when this is before other', () => {
        const earlier = new JalaliDate(1402, 3, 10);
        const later = new JalaliDate(1402, 3, 11);
        assert.equal(earlier.isAfter(later), false);
    });

    it('works across year boundaries', () => {
        const startOfNextYear = new JalaliDate(1403, 1, 1);
        const endOfYear = new JalaliDate(1402, 12, 29);
        assert.equal(startOfNextYear.isAfter(endOfYear), true);
    });

    it('works across the no-year-zero boundary', () => {
        const ce = new JalaliDate(1, 1, 1);
        const lastDay = JalaliDate.daysInMonth(-1, 12);
        const bce = new JalaliDate(-1, 12, lastDay);
        assert.equal(ce.isAfter(bce), true);
    });
});

describe('isBetween', () => {
    const start = new JalaliDate(1403, 5, 1);
    const middle = new JalaliDate(1403, 5, 15);
    const end = new JalaliDate(1403, 5, 31);

    it('is inclusive of both endpoints', () => {
        assert.equal(start.isBetween(start, end), true);
        assert.equal(middle.isBetween(start, end), true);
        assert.equal(end.isBetween(start, end), true);
    });

    it('returns false outside the range', () => {
        assert.equal(new JalaliDate(1403, 4, 30).isBetween(start, end), false);
        assert.equal(new JalaliDate(1403, 6, 1).isBetween(start, end), false);
    });

    it('works across year boundaries', () => {
        assert.equal(
            new JalaliDate(1403, 1, 15).isBetween(
                new JalaliDate(1402, 12, 1),
                new JalaliDate(1403, 2, 1)
            ),
            true
        );
    });

    it('works across the no-year-zero boundary', () => {
        const lastDay = JalaliDate.daysInMonth(-1, 12);

        assert.equal(
            new JalaliDate(1, 1, 1).isBetween(
                new JalaliDate(-1, 12, lastDay),
                new JalaliDate(1, 1, 2)
            ),
            true
        );
    });

    it('does not reorder reversed ranges', () => {
        assert.equal(middle.isBetween(end, start), false);
    });
});
