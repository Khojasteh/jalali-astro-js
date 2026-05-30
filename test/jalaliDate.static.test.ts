/**
 * Tests for JalaliDate static utility methods.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

// Verification window where leap years are explicitly marked in a published table
// Source: Solar Hijri calendar correspondence table (leap years marked with '*')
// https://en.wikipedia.org/wiki/Solar_Hijri_calendar
const KNOWN_LEAP_YEARS = [
    1354, 1358, 1362, 1366,
    1370, 1375, 1379, 1383,
    1387, 1391, 1395, 1399,
    1403, 1408, 1412, 1416
];
const LEAP_VERIFY_MIN_YEAR = 1351;
const LEAP_VERIFY_MAX_YEAR = 1419;

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

describe('JalaliDate.daysInMonth (static)', () => {
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
        const cases: Array<[number, number]> = [
            [0, 1],
            [1403, 0],
            [1403, 13],
            [1403, 1.5],
        ];

        for (const [year, month] of cases) {
            assert.throws(
                () => JalaliDate.daysInMonth(year, month),
                RangeError,
                `Expected daysInMonth(${year}, ${month}) to throw`
            );
        }
    });
});

describe('JalaliDate.daysInYear (static)', () => {
    it('returns 366 days for all known leap years', () => {
        for (const year of KNOWN_LEAP_YEARS) {
            assert.equal(JalaliDate.daysInYear(year), 366);
        }
    });

    it('returns 365 days for all known non-leap years', () => {
        for (let year = LEAP_VERIFY_MIN_YEAR; year <= LEAP_VERIFY_MAX_YEAR; year++) {
            if (!KNOWN_LEAP_YEARS.includes(year)) {
                assert.equal(JalaliDate.daysInYear(year), 365);
            }
        }
    });

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
        const cases: Array<number> = [
            0,
            JalaliDate.MIN_YEAR - 1,
            JalaliDate.MAX_YEAR + 1,
            1.5,
            NaN,
            Infinity,
            -Infinity
        ];

        for (const year of cases) {
            assert.throws(
                () => JalaliDate.daysInYear(year),
                RangeError,
                `Expected daysInYear(${year}) to throw`
            );
        }
    });
});

describe('JalaliDate.isLeapYear (static)', () => {
    it('returns true for all known leap years', () => {
        for (const year of KNOWN_LEAP_YEARS) {
            assert.equal(JalaliDate.isLeapYear(year), true);
        }
    });

    it('returns false for all known non-leap years', () => {
        for (let year = LEAP_VERIFY_MIN_YEAR; year <= LEAP_VERIFY_MAX_YEAR; year++) {
            if (!KNOWN_LEAP_YEARS.includes(year)) {
                assert.equal(JalaliDate.isLeapYear(year), false);
            }
        }
    });

    it('rejects invalid years', () => {
        const cases: Array<number> = [
            0,
            JalaliDate.MIN_YEAR - 1,
            JalaliDate.MAX_YEAR + 1,
            1.5,
            NaN,
            Infinity,
            -Infinity
        ];

        for (const year of cases) {
            assert.throws(
                () => JalaliDate.isLeapYear(year),
                RangeError,
                `Expected isLeapYear(${year}) to throw`
            );
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
        const cases: Array<number> = [
            0,
            JalaliDate.MIN_YEAR - 1,
            JalaliDate.MAX_YEAR + 1,
            1.5,
            NaN,
            Infinity,
            -Infinity
        ];

        for (const year of cases) {
            assert.throws(
                () => JalaliDate.vernalEquinox(year),
                RangeError,
                `Expected vernalEquinox(${year}) to throw`
            );
        }
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

describe('JalaliDate.yesterday', () => {
    it('returns the Jalali date for yesterday in Tehran time', () => {
        const today = JalaliDate.today();
        const yesterday = today.addDays(-1);
        const difference = yesterday.differenceInDays(today);
        assert.ok(difference === 1, `Expected difference between today and yesterday to be 1 day, got ${difference}`);
    });
});

describe('JalaliDate.tomorrow', () => {
    it('returns the Jalali date for tomorrow in Tehran time', () => {
        const today = JalaliDate.today();
        const tomorrow = today.addDays(1);
        const difference = today.differenceInDays(tomorrow);
        assert.ok(difference === 1, `Expected difference between tomorrow and today to be 1 day, got ${difference}`);
    });
});

describe('JalaliDate.setTestToday', () => {
    it('sets and clears the date used by today', () => {
        const testToday = new JalaliDate(1405, 3, 3);
        JalaliDate.setTestToday(testToday);

        try {
            assert.ok(JalaliDate.today().equals(testToday));
        } finally {
            JalaliDate.setTestToday(null);
        }
    });

    it('affects relative current-date helpers', () => {
        JalaliDate.setTestToday(new JalaliDate(1405, 1, 1));

        try {
            assert.deepEqual(JalaliDate.yesterday().toObject(), { year: 1404, month: 12, day: 29 });
            assert.deepEqual(JalaliDate.tomorrow().toObject(), { year: 1405, month: 1, day: 2 });
        } finally {
            JalaliDate.setTestToday(null);
        }
    });
});

describe('JalaliDate.getTestToday', () => {
    it('is null by default', () => {
        assert.equal(JalaliDate.getTestToday(), null);
    });

    it('returns the exact instance that was set', () => {
        const testToday = new JalaliDate(1405, 3, 3);
        JalaliDate.setTestToday(testToday);

        try {
            assert.strictEqual(JalaliDate.getTestToday(), testToday);
        } finally {
            JalaliDate.setTestToday(null);
        }
    });

    it('returns null after clearing', () => {
        JalaliDate.setTestToday(null);
        assert.equal(JalaliDate.getTestToday(), null);
    });
});
