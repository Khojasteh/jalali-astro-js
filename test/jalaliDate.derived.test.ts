/**
 * Tests for JalaliDate derived date methods
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('startOfYear', () => {
    it('returns 1 Farvardin of the same year', () => {
        const d = new JalaliDate(1402, 6, 15).startOfYear();
        assert.equal(d.year, 1402);
        assert.equal(d.month, 1);
        assert.equal(d.day, 1);
    });

    it('returns the same date when already at start of year', () => {
        const d = new JalaliDate(1402, 1, 1).startOfYear();
        assert.equal(d.year, 1402);
        assert.equal(d.month, 1);
        assert.equal(d.day, 1);
    });

    it('works for leap year', () => {
        const d = new JalaliDate(1403, 12, 30).startOfYear();
        assert.equal(d.year, 1403);
        assert.equal(d.month, 1);
        assert.equal(d.day, 1);
    });

    it('works for negative year', () => {
        const d = new JalaliDate(-100, 6, 15).startOfYear();
        assert.equal(d.year, -100);
        assert.equal(d.month, 1);
        assert.equal(d.day, 1);
    });
});

describe('endOfYear', () => {
    it('returns 29 Esfand for common year', () => {
        const d = new JalaliDate(1402, 6, 15).endOfYear();
        assert.equal(d.year, 1402);
        assert.equal(d.month, 12);
        assert.equal(d.day, 29);
    });

    it('returns 30 Esfand for leap year', () => {
        const d = new JalaliDate(1403, 6, 15).endOfYear();
        assert.equal(d.year, 1403);
        assert.equal(d.month, 12);
        assert.equal(d.day, 30);
    });

    it('returns the same date when already at end of common year', () => {
        const d = new JalaliDate(1402, 12, 29).endOfYear();
        assert.equal(d.year, 1402);
        assert.equal(d.month, 12);
        assert.equal(d.day, 29);
    });

    it('returns the same date when already at end of leap year', () => {
        const d = new JalaliDate(1403, 12, 30).endOfYear();
        assert.equal(d.year, 1403);
        assert.equal(d.month, 12);
        assert.equal(d.day, 30);
    });

    it('works for negative year', () => {
        const d = new JalaliDate(-100, 1, 1).endOfYear();
        assert.equal(d.year, -100);
        assert.equal(d.month, 12);
        const expectedDay = JalaliDate.isLeapYear(-100) ? 30 : 29;
        assert.equal(d.day, expectedDay);
    });
});

describe('startOfMonth', () => {
    it('returns 1st day of the same month', () => {
        const d = new JalaliDate(1402, 6, 15).startOfMonth();
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 1);
    });

    it('returns the same date when already at start of month', () => {
        const d = new JalaliDate(1402, 6, 1).startOfMonth();
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 1);
    });

    it('works for last day of month', () => {
        const d = new JalaliDate(1402, 6, 31).startOfMonth();
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 1);
    });

    it('works for Esfand', () => {
        const d = new JalaliDate(1402, 12, 29).startOfMonth();
        assert.equal(d.year, 1402);
        assert.equal(d.month, 12);
        assert.equal(d.day, 1);
    });
});

describe('endOfMonth', () => {
    it('returns last day of 31-day month', () => {
        const d = new JalaliDate(1402, 1, 15).endOfMonth();
        assert.equal(d.year, 1402);
        assert.equal(d.month, 1);
        assert.equal(d.day, 31);
    });

    it('returns last day of 30-day month', () => {
        const d = new JalaliDate(1402, 7, 15).endOfMonth();
        assert.equal(d.year, 1402);
        assert.equal(d.month, 7);
        assert.equal(d.day, 30);
    });

    it('returns 29 for Esfand in common year', () => {
        const d = new JalaliDate(1402, 12, 15).endOfMonth();
        assert.equal(d.year, 1402);
        assert.equal(d.month, 12);
        assert.equal(d.day, 29);
    });

    it('returns 30 for Esfand in leap year', () => {
        const d = new JalaliDate(1403, 12, 15).endOfMonth();
        assert.equal(d.year, 1403);
        assert.equal(d.month, 12);
        assert.equal(d.day, 30);
    });

    it('returns the same date when already at end of month', () => {
        const d = new JalaliDate(1402, 1, 31).endOfMonth();
        assert.equal(d.year, 1402);
        assert.equal(d.month, 1);
        assert.equal(d.day, 31);
    });

    it('works for all months in a year', () => {
        const year = 1402;
        for (let month = 1; month <= 12; month++) {
            const d = new JalaliDate(year, month, 1).endOfMonth();
            const expectedDays = JalaliDate.daysInMonth(year, month);
            assert.equal(d.day, expectedDays, `Month ${month} should end on day ${expectedDays}`);
        }
    });
});

describe('startOfWeek', () => {
    it('returns Saturday when called on Saturday', () => {
        const saturday = new JalaliDate(1403, 1, 4);
        assert.equal(saturday.dayOfWeek, 6);
        const start = saturday.startOfWeek();
        assert.ok(start.equals(saturday));
    });

    it('returns Saturday of the week for a Wednesday', () => {
        const wednesday = new JalaliDate(1403, 1, 1);
        assert.equal(wednesday.dayOfWeek, 3);
        const start = wednesday.startOfWeek();
        assert.equal(start.dayOfWeek, 6);
        assert.ok(start.equals(wednesday.addDays(-4)));
    });

    it('returns Saturday for a Sunday', () => {
        const sunday = new JalaliDate(1403, 1, 5);
        assert.equal(sunday.dayOfWeek, 0);
        const start = sunday.startOfWeek();
        assert.equal(start.dayOfWeek, 6);
        assert.ok(start.equals(sunday.addDays(-1)));
    });

    it('returns Saturday for a Friday', () => {
        const friday = new JalaliDate(1403, 1, 3);
        assert.equal(friday.dayOfWeek, 5);
        const start = friday.startOfWeek();
        assert.equal(start.dayOfWeek, 6);
        assert.ok(start.equals(friday.addDays(-6)));
    });

    it('works across month boundaries', () => {
        const wednesday = new JalaliDate(1403, 1, 1);
        const start = wednesday.startOfWeek();
        assert.equal(start.month, 12);
        assert.equal(start.year, 1402);
    });

    it('works across year boundaries', () => {
        const earlyYear = new JalaliDate(1403, 1, 1);
        const start = earlyYear.startOfWeek();
        assert.equal(start.year, 1402);
    });
});

describe('endOfWeek', () => {
    it('returns Friday when called on Friday', () => {
        const friday = new JalaliDate(1403, 1, 3);
        assert.equal(friday.dayOfWeek, 5);
        const end = friday.endOfWeek();
        assert.ok(end.equals(friday));
    });

    it('returns Friday of the week for a Wednesday', () => {
        const wednesday = new JalaliDate(1403, 1, 1);
        const end = wednesday.endOfWeek();
        assert.equal(end.dayOfWeek, 5);
        assert.ok(end.equals(wednesday.addDays(2)));
    });

    it('returns Friday for a Saturday', () => {
        const saturday = new JalaliDate(1403, 1, 4);
        assert.equal(saturday.dayOfWeek, 6);
        const end = saturday.endOfWeek();
        assert.equal(end.dayOfWeek, 5);
        assert.ok(end.equals(saturday.addDays(6)));
    });

    it('returns Friday for a Sunday', () => {
        const sunday = new JalaliDate(1403, 1, 5);
        assert.equal(sunday.dayOfWeek, 0);
        const end = sunday.endOfWeek();
        assert.equal(end.dayOfWeek, 5);
        assert.ok(end.equals(sunday.addDays(5)));
    });

    it('works across month boundaries', () => {
        const lastDay = new JalaliDate(1402, 12, 29);
        const end = lastDay.endOfWeek();
        if (end.month !== lastDay.month) {
            assert.ok(end.isAfter(lastDay));
        }
    });

    it('works across year boundaries', () => {
        const lastDay = new JalaliDate(1402, 12, 29);
        const end = lastDay.endOfWeek();
        if (end.year !== lastDay.year) {
            assert.equal(end.year, 1403);
        }
    });

    it('startOfWeek and endOfWeek span exactly 6 days', () => {
        const date = new JalaliDate(1403, 6, 15);
        const start = date.startOfWeek();
        const end = date.endOfWeek();
        assert.equal(end.jdn - start.jdn, 6);
    });
});

describe('startOfQuarter', () => {
    it('returns first day of Q1', () => {
        const date = new JalaliDate(1403, 2, 15);
        const start = date.startOfQuarter();
        assert.equal(start.year, 1403);
        assert.equal(start.month, 1);
        assert.equal(start.day, 1);
    });

    it('returns first day of Q2', () => {
        const date = new JalaliDate(1403, 5, 20);
        const start = date.startOfQuarter();
        assert.equal(start.year, 1403);
        assert.equal(start.month, 4);
        assert.equal(start.day, 1);
    });

    it('returns first day of Q3', () => {
        const date = new JalaliDate(1403, 8, 10);
        const start = date.startOfQuarter();
        assert.equal(start.year, 1403);
        assert.equal(start.month, 7);
        assert.equal(start.day, 1);
    });

    it('returns first day of Q4', () => {
        const date = new JalaliDate(1403, 12, 29);
        const start = date.startOfQuarter();
        assert.equal(start.year, 1403);
        assert.equal(start.month, 10);
        assert.equal(start.day, 1);
    });
});

describe('endOfQuarter', () => {
    it('returns last day of Q1 (31st of Khordad)', () => {
        const date = new JalaliDate(1403, 1, 15);
        const end = date.endOfQuarter();
        assert.equal(end.year, 1403);
        assert.equal(end.month, 3);
        assert.equal(end.day, 31);
    });

    it('returns last day of Q2 (31st of Shahrivar)', () => {
        const date = new JalaliDate(1403, 6, 20);
        const end = date.endOfQuarter();
        assert.equal(end.year, 1403);
        assert.equal(end.month, 6);
        assert.equal(end.day, 31);
    });

    it('returns last day of Q3 (30th of Azar)', () => {
        const date = new JalaliDate(1403, 7, 10);
        const end = date.endOfQuarter();
        assert.equal(end.year, 1403);
        assert.equal(end.month, 9);
        assert.equal(end.day, 30);
    });

    it('returns last day of Q4 in common year (29th of Esfand)', () => {
        const date = new JalaliDate(1402, 11, 15);
        const end = date.endOfQuarter();
        assert.equal(end.year, 1402);
        assert.equal(end.month, 12);
        assert.equal(end.day, 29);
    });

    it('returns last day of Q4 in leap year (30th of Esfand)', () => {
        const date = new JalaliDate(1403, 10, 5);
        const end = date.endOfQuarter();
        assert.equal(end.year, 1403);
        assert.equal(end.month, 12);
        assert.equal(end.day, 30);
    });
});
