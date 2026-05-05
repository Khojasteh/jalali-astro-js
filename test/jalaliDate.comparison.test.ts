/**
 * Tests for JalaliDate comparison methods.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('equals, compareTo, isBefore, isAfter', () => {
    const earlier = new JalaliDate(1402, 3, 10);
    const same = new JalaliDate(1402, 3, 10);
    const later = new JalaliDate(1402, 3, 11);

    it('compares equal dates', () => {
        assert.equal(earlier.equals(same), true);
        assert.equal(earlier.compareTo(same), 0);
        assert.equal(earlier.isBefore(same), false);
        assert.equal(earlier.isAfter(same), false);
    });

    it('compares different dates in chronological order', () => {
        assert.equal(earlier.equals(later), false);
        assert.ok(earlier.compareTo(later) < 0);
        assert.ok(later.compareTo(earlier) > 0);
        assert.equal(earlier.isBefore(later), true);
        assert.equal(later.isAfter(earlier), true);
    });

    it('compares across year boundaries', () => {
        const endOfYear = new JalaliDate(1402, 12, 29);
        const startOfNextYear = new JalaliDate(1403, 1, 1);

        assert.equal(endOfYear.isBefore(startOfNextYear), true);
        assert.equal(startOfNextYear.isAfter(endOfYear), true);
    });

    it('compares across the BCE/CE no-year-zero boundary', () => {
        const lastDay = JalaliDate.daysInMonth(-1, 12);
        const bce = new JalaliDate(-1, 12, lastDay);
        const ce = new JalaliDate(1, 1, 1);

        assert.equal(bce.isBefore(ce), true);
        assert.equal(ce.isAfter(bce), true);
        assert.ok(bce.compareTo(ce) < 0);
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
