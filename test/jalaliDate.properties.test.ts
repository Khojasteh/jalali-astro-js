/**
 * Tests for JalaliDate computed properties.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';
import { gregorianToJDN } from '../src/julianDay.ts';

describe('jdn', () => {
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

describe('daysInMonth', () => {
    it('reports correct days in month for common year', () => {
        const common = new JalaliDate(1402, 12, 1);
        assert.equal(common.daysInMonth, 29);
    });

    it('reports correct days in month for leap year', () => {
        const leap = new JalaliDate(1403, 12, 1);
        assert.equal(leap.daysInMonth, 30);
    });
});

describe('daysInYear', () => {
    it('reports correct days in year for common year', () => {
        const common = new JalaliDate(1402, 12, 1);
        assert.equal(common.daysInYear, 365);
    });

    it('reports correct days in year for leap year', () => {
        const leap = new JalaliDate(1403, 12, 1);
        assert.equal(leap.daysInYear, 366);
    });
});

describe('isLeapYear', () => {
    it('identifies common year correctly', () => {
        const common = new JalaliDate(1402, 12, 1);
        assert.equal(common.isLeapYear, false);
    });

    it('identifies leap year correctly', () => {
        const leap = new JalaliDate(1403, 12, 1);
        assert.equal(leap.isLeapYear, true);
    });
});

describe('dayOfYear', () => {
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

describe('dayOfWeek', () => {
    const cases: Array<[JalaliDate, number]> = [
        [new JalaliDate(1403, 1, 1), 3],
        [new JalaliDate(1403, 1, 2), 4],
        [new JalaliDate(1403, 1, 3), 5],
        [new JalaliDate(1403, 1, 4), 6],
        [new JalaliDate(1403, 1, 5), 0],
        [new JalaliDate(1403, 1, 6), 1],
        [new JalaliDate(1403, 1, 7), 2],
    ];

    for (const [date, expected] of cases) {
        it(`${date.toString()} has dayOfWeek=${expected}`, () => {
            assert.equal(date.dayOfWeek, expected);
        });
    }
});

describe('dayOfWeekName', () => {
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

describe('weekOfYear', () => {
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

describe('weekOfMonth', () => {
    it('uses Saturday-start weeks for weekOfMonth', () => {
        assert.equal(new JalaliDate(1403, 1, 1).weekOfMonth, 1);
        assert.equal(new JalaliDate(1403, 1, 3).weekOfMonth, 1);
        assert.equal(new JalaliDate(1403, 1, 4).weekOfMonth, 2);
        assert.equal(new JalaliDate(1403, 1, 31).weekOfMonth, 5);
    });
});

describe('monthName', () => {
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

describe('quarter', () => {
    for (let month = 1; month <= 12; month++) {
        it(`month ${month} has correct quarter`, () => {
            const date = new JalaliDate(1403, month, 1);
            assert.equal(date.quarter, Math.ceil(month / 3));
        });
    }
});
