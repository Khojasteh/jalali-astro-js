/**
 * Tests for JalaliDate static utility methods.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('JalaliDate.isValidDate', () => {
    const cases: Array<[number, number, number, boolean]> = [
        [1403, 1, 1, true],
        [1403, 6, 31, true],
        [1403, 7, 30, true],
        [1403, 12, 30, true],
        [1402, 12, 29, true],
        [1402, 12, 30, false],
        [1403, 7, 31, false],
        [1403, 1, 0, false],
        [1403, 1, 32, false],
        [1403, 0, 1, false],
        [1403, 13, 1, false],
        [0, 1, 1, false],
        [JalaliDate.MIN_YEAR - 1, 1, 1, false],
        [JalaliDate.MAX_YEAR + 1, 1, 1, false],
    ];

    for (const [year, month, day, expected] of cases) {
        it(`returns ${expected} for ${year}/${month}/${day}`, () => {
            assert.equal(JalaliDate.isValidDate(year, month, day), expected);
        });
    }

    it('returns false instead of throwing for non-integer inputs', () => {
        assert.equal(JalaliDate.isValidDate(1403.5, 1, 1), false);
        assert.equal(JalaliDate.isValidDate(1403, 1.5, 1), false);
        assert.equal(JalaliDate.isValidDate(1403, 1, 1.5), false);
    });
});

describe('JalaliDate.daysInMonth', () => {
    it('returns 31 for months 1 through 6', () => {
        for (let month = 1; month <= 6; month++) {
            assert.equal(JalaliDate.daysInMonth(1403, month), 31);
        }
    });

    it('returns 30 for months 7 through 11', () => {
        for (let month = 7; month <= 11; month++) {
            assert.equal(JalaliDate.daysInMonth(1403, month), 30);
        }
    });

    it('returns 29 for Esfand in a common year and 30 in a leap year', () => {
        assert.equal(JalaliDate.daysInMonth(1402, 12), 29);
        assert.equal(JalaliDate.daysInMonth(1403, 12), 30);
    });

    it('rejects invalid year or month', () => {
        assert.throws(() => JalaliDate.daysInMonth(0, 1), RangeError);
        assert.throws(() => JalaliDate.daysInMonth(1403, 0), RangeError);
        assert.throws(() => JalaliDate.daysInMonth(1403, 13), RangeError);
        assert.throws(() => JalaliDate.daysInMonth(1403, 1.5), RangeError);
    });
});

describe('JalaliDate.daysInYear', () => {
    const cases: Array<[number, number]> = [
        [1395, 366],
        [1402, 365],
        [1403, 366],
        [1404, 365],
    ];

    for (const [year, days] of cases) {
        it(`${year} has ${days} days`, () => {
            assert.equal(JalaliDate.daysInYear(year), days);
        });
    }

    it('returns days in year for Jalali year 1 correctly', () => {
        const days = JalaliDate.daysInYear(1);

        assert.ok(
            days === 365 || days === 366,
            `Expected Jalali year 1 to have 365 or 366 days, got ${days}`
        );
    });

    it('returns days in year for Jalali year -1 correctly', () => {
        const days = JalaliDate.daysInYear(-1);

        assert.ok(
            days === 365 || days === 366,
            `Expected Jalali year -1 to have 365 or 366 days, got ${days}`
        );
    });

    it('rejects invalid years', () => {
        for (const year of [0, JalaliDate.MIN_YEAR - 1, JalaliDate.MAX_YEAR + 1, 1.5, NaN, Infinity]) {
            assert.throws(() => JalaliDate.daysInYear(year), RangeError);
        }
    });
});

describe('JalaliDate.isLeapYear', () => {
    const cases: Array<[number, boolean]> = [
        [1395, true],
        [1402, false],
        [1403, true],
        [1404, false],
    ];

    for (const [year, isLeap] of cases) {
        it(`${year} is ${isLeap ? 'a leap year' : 'not a leap year'}`, () => {
            assert.equal(JalaliDate.isLeapYear(year), isLeap);
        });
    }

    it('rejects invalid years', () => {
        for (const year of [0, JalaliDate.MIN_YEAR - 1, JalaliDate.MAX_YEAR + 1, 1.5, NaN, Infinity]) {
            assert.throws(() => JalaliDate.isLeapYear(year), RangeError);
        }
    });
});

describe('JalaliDate.vernalEquinox', () => {
    it('returns a UTC Date for post-Unix-epoch years', () => {
        const equinox = JalaliDate.vernalEquinox(1405);

        assert.ok(equinox instanceof Date);
        assert.equal(equinox.getUTCFullYear(), 2026);
        assert.equal(equinox.getUTCMonth(), 2);
        assert.equal(equinox.getUTCDate(), 20);
        assert.equal(equinox.getUTCHours(), 14);
        assert.equal(equinox.getUTCMinutes(), 45);
    });

    it('returns null for years whose equinox is before the Unix epoch', () => {
        assert.equal(JalaliDate.vernalEquinox(1300), null);
    });

    it('rejects invalid Jalali years', () => {
        assert.throws(() => JalaliDate.vernalEquinox(0), RangeError);
        assert.throws(() => JalaliDate.vernalEquinox(JalaliDate.MIN_YEAR - 1), RangeError);
        assert.throws(() => JalaliDate.vernalEquinox(JalaliDate.MAX_YEAR + 1), RangeError);
    });
});

describe('JalaliDate.age', () => {
    it('calculates complete years when birthday is today or already passed', () => {
        assert.equal(
            JalaliDate.age(new JalaliDate(1370, 6, 15), new JalaliDate(1403, 6, 15)),
            33
        );
        assert.equal(
            JalaliDate.age(new JalaliDate(1370, 6, 15), new JalaliDate(1403, 6, 16)),
            33
        );
    });

    it('does not count the current year before birthday', () => {
        assert.equal(
            JalaliDate.age(new JalaliDate(1370, 6, 15), new JalaliDate(1403, 6, 14)),
            32
        );
    });

    it('handles the no-year-zero boundary', () => {
        assert.equal(
            JalaliDate.age(new JalaliDate(-1, 6, 15), new JalaliDate(1, 6, 15)),
            1
        );
    });
});

describe('JalaliDate.today', () => {
    it('matches fromDate(new Date()) for the current Tehran civil day', () => {
        const before = JalaliDate.fromDate(new Date());
        const today = JalaliDate.today();
        const after = JalaliDate.fromDate(new Date());

        assert.ok(
            today.equals(before) || today.equals(after),
            `today() returned ${today}, expected ${before} or ${after}`
        );
    });
});
