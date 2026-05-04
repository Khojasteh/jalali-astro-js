/**
 * Tests for JalaliDate static utility methods
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('JalaliDate.isValidDate', () => {
    it('returns true for valid dates', () => {
        assert.equal(JalaliDate.isValidDate(1403, 1, 1), true);
        assert.equal(JalaliDate.isValidDate(1403, 12, 29), true);
        assert.equal(JalaliDate.isValidDate(1403, 12, 30), true); // Leap year
    });

    it('returns false for invalid year', () => {
        assert.equal(JalaliDate.isValidDate(0, 5, 15), false);
        assert.equal(JalaliDate.isValidDate(3000, 5, 15), false); // Out of range
        assert.equal(JalaliDate.isValidDate(-2000, 5, 15), false); // Out of range
    });

    it('returns false for invalid month', () => {
        assert.equal(JalaliDate.isValidDate(1403, 0, 15), false);
        assert.equal(JalaliDate.isValidDate(1403, 13, 15), false);
    });

    it('returns false for invalid day', () => {
        assert.equal(JalaliDate.isValidDate(1403, 5, 0), false);
        assert.equal(JalaliDate.isValidDate(1403, 5, 32), false);
        assert.equal(JalaliDate.isValidDate(1403, 7, 31), false); // Mehr has 30 days
        assert.equal(JalaliDate.isValidDate(1402, 12, 30), false); // Common year
    });

    it('handles leap year validation correctly', () => {
        assert.equal(JalaliDate.isValidDate(1403, 12, 30), true); // Leap year
        assert.equal(JalaliDate.isValidDate(1402, 12, 30), false); // Common year
    });
});

describe('JalaliDate.daysInMonth static', () => {
    it('returns 31 for months 1-6', () => {
        for (let month = 1; month <= 6; month++) {
            assert.equal(JalaliDate.daysInMonth(1402, month), 31);
        }
    });

    it('returns 30 for months 7-11', () => {
        for (let month = 7; month <= 11; month++) {
            assert.equal(JalaliDate.daysInMonth(1402, month), 30);
        }
    });

    it('returns 29 for month 12 in common year', () => {
        assert.equal(JalaliDate.daysInMonth(1402, 12), 29);
    });

    it('returns 30 for month 12 in leap year', () => {
        assert.equal(JalaliDate.daysInMonth(1403, 12), 30);
    });

    it('throws RangeError for month < 1', () => {
        assert.throws(() => JalaliDate.daysInMonth(1402, 0), RangeError);
    });

    it('throws RangeError for month > 12', () => {
        assert.throws(() => JalaliDate.daysInMonth(1402, 13), RangeError);
    });

    it('throws RangeError for year 0', () => {
        assert.throws(() => JalaliDate.daysInMonth(0, 1), RangeError);
    });
});

describe('JalaliDate.isLeapYear static', () => {
    it('identifies 1403 as leap year', () => {
        assert.equal(JalaliDate.isLeapYear(1403), true);
    });

    it('identifies 1402 as common year', () => {
        assert.equal(JalaliDate.isLeapYear(1402), false);
    });

    it('works for negative years', () => {
        const isLeap = JalaliDate.isLeapYear(-100);
        assert.equal(typeof isLeap, 'boolean');
    });

    it('throws for year below MIN_YEAR', () => {
        assert.throws(() => JalaliDate.isLeapYear(JalaliDate.MIN_YEAR - 1), RangeError);
    });

    it('throws for year above MAX_YEAR', () => {
        assert.throws(() => JalaliDate.isLeapYear(JalaliDate.MAX_YEAR + 1), RangeError);
    });

    it('throws for year 0', () => {
        assert.throws(() => JalaliDate.isLeapYear(0), RangeError);
    });
});

describe('JalaliDate.daysInYear static', () => {
    it('returns 365 for common year', () => {
        assert.equal(JalaliDate.daysInYear(1402), 365);
    });

    it('returns 366 for leap year', () => {
        assert.equal(JalaliDate.daysInYear(1403), 366);
    });

    it('throws RangeError for year 0', () => {
        assert.throws(() => JalaliDate.daysInYear(0), RangeError);
    });
});

describe('JalaliDate.vernalEquinox', () => {
    it('returns a Date object', () => {
        const eq = JalaliDate.vernalEquinox(1403);
        assert.ok(eq instanceof Date);
    });

    it('returns date in March for recent years', () => {
        const eq = JalaliDate.vernalEquinox(1403);
        assert.equal(eq.getUTCMonth(), 2); // March (0-indexed)
    });

    it('throws RangeError for year below MIN_YEAR', () => {
        assert.throws(() => JalaliDate.vernalEquinox(JalaliDate.MIN_YEAR - 1), RangeError);
    });

    it('throws RangeError for year above MAX_YEAR + 1', () => {
        assert.throws(() => JalaliDate.vernalEquinox(JalaliDate.MAX_YEAR + 2), RangeError);
    });

    it('throws RangeError for year 0', () => {
        assert.throws(() => JalaliDate.vernalEquinox(0), RangeError);
    });
});

describe('JalaliDate.age', () => {
    it('calculates age correctly with explicit reference date', () => {
        const birthDate = new JalaliDate(1380, 5, 15);
        const referenceDate = new JalaliDate(1403, 5, 15);
        assert.equal(JalaliDate.age(birthDate, referenceDate), 23);
    });

    it('calculates age before birthday in year', () => {
        const birthDate = new JalaliDate(1380, 6, 15);
        const referenceDate = new JalaliDate(1403, 5, 15);
        assert.equal(JalaliDate.age(birthDate, referenceDate), 22); // Birthday not reached
    });

    it('calculates age after birthday in year', () => {
        const birthDate = new JalaliDate(1380, 5, 15);
        const referenceDate = new JalaliDate(1403, 6, 15);
        assert.equal(JalaliDate.age(birthDate, referenceDate), 23);
    });

    it('returns 0 for dates in the same year', () => {
        const birthDate = new JalaliDate(1403, 1, 1);
        const referenceDate = new JalaliDate(1403, 12, 29);
        assert.equal(JalaliDate.age(birthDate, referenceDate), 0);
    });

    it('uses today as default reference date', () => {
        const birthDate = new JalaliDate(1380, 1, 1);
        const age = JalaliDate.age(birthDate);
        assert.ok(age >= 0); // Age should be non-negative
    });
});
