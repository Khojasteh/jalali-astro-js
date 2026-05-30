/**
 * Tests for JalaliDate computed properties.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate, DayOfWeek, Quarter } from '../src/jalaliDate.ts';
import { gregorianToJDN } from '../src/julianDay.ts';

describe('JalaliDate.jdn', () => {
    it('matches known Gregorian JDN anchors through conversion', () => {
        assert.equal(new JalaliDate(1403, 1, 1).jdn, gregorianToJDN(2024, 3, 20));
        assert.equal(new JalaliDate(1404, 1, 1).jdn, gregorianToJDN(2025, 3, 21));
    });

    it('increments by one for consecutive Jalali dates', () => {
        assert.equal(new JalaliDate(1402, 7, 1).jdn - new JalaliDate(1402, 6, 31).jdn, 1);
        assert.equal(new JalaliDate(1403, 1, 1).jdn - new JalaliDate(1402, 12, 29).jdn, 1);
    });

    it('is consecutive across the no-year-zero boundary', () => {
        const lastDay = JalaliDate.daysInMonth(-1, 12);
        assert.equal(new JalaliDate(1, 1, 1).jdn - new JalaliDate(-1, 12, lastDay).jdn, 1);
    });
});

describe('JalaliDate.daysInMonth', () => {
    it('reports correct days in month for common year', () => {
        const common = new JalaliDate(1402, 12, 1);
        assert.equal(common.daysInMonth, 29);
    });

    it('reports correct days in month for leap year', () => {
        const leap = new JalaliDate(1403, 12, 1);
        assert.equal(leap.daysInMonth, 30);
    });
});

describe('JalaliDate.daysInYear', () => {
    it('reports correct days in year for common year', () => {
        const common = new JalaliDate(1402, 12, 1);
        assert.equal(common.daysInYear, 365);
    });

    it('reports correct days in year for leap year', () => {
        const leap = new JalaliDate(1403, 12, 1);
        assert.equal(leap.daysInYear, 366);
    });
});

describe('JalaliDate.isLeapYear', () => {
    it('identifies common year correctly', () => {
        const common = new JalaliDate(1402, 12, 1);
        assert.equal(common.isLeapYear, false);
    });

    it('identifies leap year correctly', () => {
        const leap = new JalaliDate(1403, 12, 1);
        assert.equal(leap.isLeapYear, true);
    });
});

describe('JalaliDate.dayOfYear', () => {
    const cases: Array<[JalaliDate, number]> = [
        [new JalaliDate(1402, 1, 1), 1],
        [new JalaliDate(1402, 1, 31), 31],
        [new JalaliDate(1402, 2, 1), 32],
        [new JalaliDate(1402, 6, 31), 186],
        [new JalaliDate(1402, 7, 1), 187],
        [new JalaliDate(1402, 12, 29), 365],
        [new JalaliDate(1403, 12, 30), 366],
    ];

    for (const [date, expected] of cases) {
        it(`${date.toString()} is day ${expected} of the year`, () => {
            assert.equal(date.dayOfYear, expected);
        });
    }
});

describe('JalaliDate.dayOfWeek', () => {
    const cases: Array<[JalaliDate, DayOfWeek]> = [
        [new JalaliDate(1403, 1, 1), DayOfWeek.Wednesday],
        [new JalaliDate(1403, 1, 2), DayOfWeek.Thursday],
        [new JalaliDate(1403, 1, 3), DayOfWeek.Friday],
        [new JalaliDate(1403, 1, 4), DayOfWeek.Saturday],
        [new JalaliDate(1403, 1, 5), DayOfWeek.Sunday],
        [new JalaliDate(1403, 1, 6), DayOfWeek.Monday],
        [new JalaliDate(1403, 1, 7), DayOfWeek.Tuesday],
    ];

    for (const [date, expected] of cases) {
        it(`${date.toString()} has dayOfWeek=${expected}`, () => {
            assert.equal(date.dayOfWeek, expected);
        });
    }
});

describe('JalaliDate.dayOfWeekName', () => {
    const cases: Array<[JalaliDate, string]> = [
        [new JalaliDate(1403, 1, 1), 'چهارشنبه'],
        [new JalaliDate(1403, 1, 2), 'پنجشنبه'],
        [new JalaliDate(1403, 1, 3), 'جمعه'],
        [new JalaliDate(1403, 1, 4), 'شنبه'],
        [new JalaliDate(1403, 1, 5), 'یکشنبه'],
        [new JalaliDate(1403, 1, 6), 'دوشنبه'],
        [new JalaliDate(1403, 1, 7), 'سه‌شنبه'],
    ];

    for (const [date, expected] of cases) {
        it(`${date.toString()} has dayOfWeekName ${expected}`, () => {
            assert.equal(date.dayOfWeekName, expected);
        });
    }
});

describe('JalaliDate.weekOfYear', () => {
    it('uses Saturday-start weeks for weekOfYear', () => {
        assert.equal(new JalaliDate(1403, 1, 1).weekOfYear, 1);
        assert.equal(new JalaliDate(1403, 1, 3).weekOfYear, 1);
        assert.equal(new JalaliDate(1403, 1, 4).weekOfYear, 2);
    });

    it('weekOfYear round-trips through fromWeekOfYear for representative dates', () => {
        const samples = [
            new JalaliDate(1403, 1, 1),
            new JalaliDate(1403, 1, 4),
            new JalaliDate(1403, 6, 15),
            new JalaliDate(1403, 12, 30),
        ];

        for (const original of samples) {
            assert.ok(
                JalaliDate.fromWeekOfYear(original.year, original.weekOfYear, original.dayOfWeek).equals(original),
                `Expected ${original} to round-trip through weekOfYear/dayOfWeek`
            );
        }
    });
});

describe('JalaliDate.weekOfMonth', () => {
    it('uses Saturday-start weeks for weekOfMonth', () => {
        assert.equal(new JalaliDate(1403, 1, 1).weekOfMonth, 1);
        assert.equal(new JalaliDate(1403, 1, 3).weekOfMonth, 1);
        assert.equal(new JalaliDate(1403, 1, 4).weekOfMonth, 2);
        assert.equal(new JalaliDate(1403, 1, 31).weekOfMonth, 5);
    });
});

describe('JalaliDate.monthName', () => {
    const months = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
    ];

    for (let month = 1; month <= 12; month++) {
        it(`month ${month} has correct name`, () => {
            const date = new JalaliDate(1403, month, 1);
            assert.equal(date.monthName, months[month - 1]);
        });
    }
});

describe('JalaliDate.quarter', () => {
    const cases: Array<[number, Quarter]> = [
        [1, Quarter.Spring],
        [2, Quarter.Spring],
        [3, Quarter.Spring],
        [4, Quarter.Summer],
        [5, Quarter.Summer],
        [6, Quarter.Summer],
        [7, Quarter.Autumn],
        [8, Quarter.Autumn],
        [9, Quarter.Autumn],
        [10, Quarter.Winter],
        [11, Quarter.Winter],
        [12, Quarter.Winter],
    ];

    for (const [month, expected] of cases) {
        it(`month ${month} has correct quarter`, () => {
            const date = new JalaliDate(1403, month, 1);
            assert.equal(date.quarter, expected);
        });
    }
});

describe('JalaliDate.quarterName', () => {
    const quarters = ['بهار', 'تابستان', 'پاییز', 'زمستان'];
    for (let month = 1; month <= 12; month++) {
        it(`month ${month} has correct quarter name`, () => {
            const date = new JalaliDate(1403, month, 1);
            const expected = quarters[Math.ceil(month / 3) - 1];
            assert.equal(date.quarterName, expected);
        });
    }
});