/**
 * Tests for JalaliDate comparison methods.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('JalaliDate.equals', () => {
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

describe('JalaliDate.compareTo', () => {
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

describe('JalaliDate.isBefore', () => {
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

describe('JalaliDate.isAfter', () => {
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

describe('JalaliDate.isBetween', () => {
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

describe('JalaliDate.isSameYear', () => {
    it('returns true for identical dates', () => {
        const date1 = new JalaliDate(1403, 5, 15);
        const date2 = new JalaliDate(1403, 5, 15);
        assert.equal(date1.isSameYear(date2), true);
    });

    it('returns true for different dates in the same year', () => {
        const date1 = new JalaliDate(1403, 1, 1);
        const date2 = new JalaliDate(1403, 12, 29);
        assert.equal(date1.isSameYear(date2), true);
    });

    it('returns false for dates in different years', () => {
        const date1 = new JalaliDate(1403, 12, 29);
        const date2 = new JalaliDate(1404, 1, 1);
        assert.equal(date1.isSameYear(date2), false);
    });

    it('works across the no-year-zero boundary', () => {
        const lastDay = JalaliDate.daysInMonth(-1, 12);
        const bce = new JalaliDate(-1, 12, lastDay);
        const ce = new JalaliDate(1, 1, 1);
        assert.equal(bce.isSameYear(ce), false);
    });

    it('returns true for dates in negative years', () => {
        const date1 = new JalaliDate(-100, 1, 1);
        const date2 = new JalaliDate(-100, 12, 29);
        assert.equal(date1.isSameYear(date2), true);
    });
});

describe('JalaliDate.isSameMonth', () => {
    it('returns true for identical dates', () => {
        const date1 = new JalaliDate(1403, 5, 15);
        const date2 = new JalaliDate(1403, 5, 15);
        assert.equal(date1.isSameMonth(date2), true);
    });

    it('returns true for different days in the same month', () => {
        const date1 = new JalaliDate(1403, 5, 1);
        const date2 = new JalaliDate(1403, 5, 31);
        assert.equal(date1.isSameMonth(date2), true);
    });

    it('returns false for dates in different months of the same year', () => {
        const date1 = new JalaliDate(1403, 5, 15);
        const date2 = new JalaliDate(1403, 6, 15);
        assert.equal(date1.isSameMonth(date2), false);
    });

    it('returns false for the same month in different years', () => {
        const date1 = new JalaliDate(1403, 5, 15);
        const date2 = new JalaliDate(1404, 5, 15);
        assert.equal(date1.isSameMonth(date2), false);
    });

    it('works across year boundaries', () => {
        const endOfYear = new JalaliDate(1403, 12, 29);
        const startOfNextYear = new JalaliDate(1404, 1, 1);
        assert.equal(endOfYear.isSameMonth(startOfNextYear), false);
    });

    it('works for leap year Esfand', () => {
        const date1 = new JalaliDate(1403, 12, 29);
        const date2 = new JalaliDate(1403, 12, 30);
        assert.equal(date1.isSameMonth(date2), true);
    });
});

describe('JalaliDate.isSameWeek', () => {
    it('returns true for identical dates', () => {
        const date1 = new JalaliDate(1403, 5, 15);
        const date2 = new JalaliDate(1403, 5, 15);
        assert.equal(date1.isSameWeek(date2), true);
    });

    it('returns true for different dates in the same week', () => {
        // Pick a date whose week doesn't span year boundaries
        const date1 = new JalaliDate(1403, 2, 15);  // Middle of Ordibehesht 1403
        const sat = date1.startOfWeek();  // Saturday of this week
        const fri = date1.endOfWeek();    // Friday of this week

        // Verify all dates are in the same year (no year boundary crossing)
        assert.equal(sat.year, date1.year);
        assert.equal(fri.year, date1.year);

        // All dates in the week should be in the same week
        assert.equal(sat.isSameWeek(date1), true);
        assert.equal(fri.isSameWeek(date1), true);
        assert.equal(date1.isSameWeek(sat), true);
        assert.equal(date1.isSameWeek(fri), true);
    });

    it('returns false for dates in different weeks', () => {
        const date1 = new JalaliDate(1403, 1, 1);
        const nextWeek = date1.addDays(7);
        assert.equal(date1.isSameWeek(nextWeek), false);
    });

    it('returns false for the same week number in different years', () => {
        const date1 = new JalaliDate(1403, 1, 10);
        const date2 = new JalaliDate(1404, 1, 10);

        // Even if they happen to have the same week number, different years = false
        if (date1.weekOfYear === date2.weekOfYear) {
            assert.equal(date1.isSameWeek(date2), false);
        }
    });

    it('handles week 1 correctly when it spans into previous year', () => {
        const date1 = new JalaliDate(1403, 1, 1);  // Nowruz 1403
        const weekStart = date1.startOfWeek();

        // Week start might be in previous year, but weekOfYear should handle this
        if (weekStart.year === 1402) {
            // They should NOT be in the same week since they're in different years
            assert.equal(date1.isSameWeek(weekStart), false);
        }
    });
});

describe('JalaliDate.isSameQuarter', () => {
    it('returns true for identical dates', () => {
        const date1 = new JalaliDate(1403, 5, 15);
        const date2 = new JalaliDate(1403, 5, 15);
        assert.equal(date1.isSameQuarter(date2), true);
    });

    it('returns true for different dates in the same quarter', () => {
        // Q1: months 1-3
        const q1_1 = new JalaliDate(1403, 1, 1);
        const q1_2 = new JalaliDate(1403, 3, 31);
        assert.equal(q1_1.isSameQuarter(q1_2), true);

        // Q2: months 4-6
        const q2_1 = new JalaliDate(1403, 4, 1);
        const q2_2 = new JalaliDate(1403, 6, 31);
        assert.equal(q2_1.isSameQuarter(q2_2), true);

        // Q3: months 7-9
        const q3_1 = new JalaliDate(1403, 7, 1);
        const q3_2 = new JalaliDate(1403, 9, 30);
        assert.equal(q3_1.isSameQuarter(q3_2), true);

        // Q4: months 10-12
        const q4_1 = new JalaliDate(1403, 10, 1);
        const q4_2 = new JalaliDate(1403, 12, 30);
        assert.equal(q4_1.isSameQuarter(q4_2), true);
    });

    it('returns false for dates in different quarters of the same year', () => {
        const q1 = new JalaliDate(1403, 3, 31);  // End of Q1
        const q2 = new JalaliDate(1403, 4, 1);   // Start of Q2
        assert.equal(q1.isSameQuarter(q2), false);

        const q2_2 = new JalaliDate(1403, 6, 31);  // End of Q2
        const q3 = new JalaliDate(1403, 7, 1);     // Start of Q3
        assert.equal(q2_2.isSameQuarter(q3), false);

        const q3_2 = new JalaliDate(1403, 9, 30);  // End of Q3
        const q4 = new JalaliDate(1403, 10, 1);    // Start of Q4
        assert.equal(q3_2.isSameQuarter(q4), false);
    });

    it('returns false for the same quarter in different years', () => {
        const date1 = new JalaliDate(1403, 5, 15);  // Q2
        const date2 = new JalaliDate(1404, 5, 15);  // Q2 of next year
        assert.equal(date1.isSameQuarter(date2), false);
    });

    it('works across year boundaries', () => {
        const endOfYear = new JalaliDate(1403, 12, 30);  // Q4
        const startOfNextYear = new JalaliDate(1404, 1, 1);  // Q1
        assert.equal(endOfYear.isSameQuarter(startOfNextYear), false);
    });

    it('verifies all quarter boundaries', () => {
        const date = new JalaliDate(1403, 1, 15);

        // Q1: Farvardin, Ordibehesht, Khordad (months 1-3)
        assert.equal(new JalaliDate(1403, 1, 1).quarter, 1);
        assert.equal(new JalaliDate(1403, 2, 15).quarter, 1);
        assert.equal(new JalaliDate(1403, 3, 31).quarter, 1);

        // Q2: Tir, Mordad, Shahrivar (months 4-6)
        assert.equal(new JalaliDate(1403, 4, 1).quarter, 2);
        assert.equal(new JalaliDate(1403, 5, 15).quarter, 2);
        assert.equal(new JalaliDate(1403, 6, 31).quarter, 2);

        // Q3: Mehr, Aban, Azar (months 7-9)
        assert.equal(new JalaliDate(1403, 7, 1).quarter, 3);
        assert.equal(new JalaliDate(1403, 8, 15).quarter, 3);
        assert.equal(new JalaliDate(1403, 9, 30).quarter, 3);

        // Q4: Dey, Bahman, Esfand (months 10-12)
        assert.equal(new JalaliDate(1403, 10, 1).quarter, 4);
        assert.equal(new JalaliDate(1403, 11, 15).quarter, 4);
        assert.equal(new JalaliDate(1403, 12, 30).quarter, 4);
    });
});
