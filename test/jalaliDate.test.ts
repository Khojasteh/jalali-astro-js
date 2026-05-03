/**
 * Tests for src/jalaliDate.ts
 * Covers construction, static factories, computed properties,
 * arithmetic, comparison, and formatting.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

// ---------------------------------------------------------------------------
// Constructor validation
// ---------------------------------------------------------------------------

describe('JalaliDate constructor', () => {
    it('creates a valid date', () => {
        const d = new JalaliDate(1402, 6, 31);
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('throws RangeError for month < 1', () => {
        assert.throws(() => new JalaliDate(1402, 0, 1), RangeError);
    });

    it('throws RangeError for month > 12', () => {
        assert.throws(() => new JalaliDate(1402, 13, 1), RangeError);
    });

    it('throws RangeError for day < 1', () => {
        assert.throws(() => new JalaliDate(1402, 1, 0), RangeError);
    });

    it('throws RangeError for day 32 in month 1', () => {
        assert.throws(() => new JalaliDate(1402, 1, 32), RangeError);
    });

    it('throws RangeError for Esfand 30 in a common year', () => {
        // 1402 is a common year
        assert.equal(new JalaliDate(1402, 1, 1).isLeapYear, false);
        assert.throws(() => new JalaliDate(1402, 12, 30), RangeError);
    });

    it('allows Esfand 30 in a leap year', () => {
        // 1403 is a leap year
        const d = new JalaliDate(1403, 12, 30);
        assert.equal(d.day, 30);
    });

    it('creates date with negative year', () => {
        const d = new JalaliDate(-100, 1, 1);
        assert.equal(d.year, -100);
        assert.equal(d.month, 1);
        assert.equal(d.day, 1);
    });

    it('throws RangeError for year 0', () => {
        assert.throws(() => new JalaliDate(0, 1, 1), RangeError);
    });
});

// ---------------------------------------------------------------------------
// Static factories
// ---------------------------------------------------------------------------

describe('JalaliDate.today', () => {
    it('returns a valid JalaliDate', () => {
        const d = JalaliDate.today();
        assert.ok(d instanceof JalaliDate);
        assert.ok(d.year >= JalaliDate.MIN_YEAR && d.year <= JalaliDate.MAX_YEAR);
        assert.ok(d.month >= 1 && d.month <= 12);
        assert.ok(d.day >= 1 && d.day <= 31);
    });
});

describe('JalaliDate.fromDayOfYear', () => {
    it('creates date from day 1', () => {
        const d = JalaliDate.fromDayOfYear(1402, 1);
        assert.equal(d.year, 1402);
        assert.equal(d.month, 1);
        assert.equal(d.day, 1);
    });

    it('creates date from day 32 (first day of month 2)', () => {
        const d = JalaliDate.fromDayOfYear(1402, 32);
        assert.equal(d.year, 1402);
        assert.equal(d.month, 2);
        assert.equal(d.day, 1);
    });

    it('creates date from day 365 (last day of common year)', () => {
        const d = JalaliDate.fromDayOfYear(1402, 365);
        assert.equal(d.year, 1402);
        assert.equal(d.month, 12);
        assert.equal(d.day, 29);
    });

    it('creates date from day 366 (last day of leap year)', () => {
        const d = JalaliDate.fromDayOfYear(1403, 366);
        assert.equal(d.year, 1403);
        assert.equal(d.month, 12);
        assert.equal(d.day, 30);
    });

    it('creates date from day 186 (first day of second half)', () => {
        const d = JalaliDate.fromDayOfYear(1402, 187);
        assert.equal(d.year, 1402);
        assert.equal(d.month, 7);
        assert.equal(d.day, 1);
    });

    it('throws RangeError for day 0', () => {
        assert.throws(() => JalaliDate.fromDayOfYear(1402, 0), RangeError);
    });

    it('throws RangeError for day 366 in common year', () => {
        assert.throws(() => JalaliDate.fromDayOfYear(1402, 366), RangeError);
    });

    it('throws RangeError for day 367 in leap year', () => {
        assert.throws(() => JalaliDate.fromDayOfYear(1403, 367), RangeError);
    });

    it('throws RangeError for year 0', () => {
        assert.throws(() => JalaliDate.fromDayOfYear(0, 1), RangeError);
    });
});

describe('JalaliDate.fromGregorian', () => {
    it('converts 2024-03-20 → 1403/1/1 (Nowruz 1403)', () => {
        const d = JalaliDate.fromGregorian(2024, 3, 20);
        assert.equal(d.year, 1403);
        assert.equal(d.month, 1);
        assert.equal(d.day, 1);
    });

    it('converts 2026-05-02 → 1405/2/12', () => {
        const d = JalaliDate.fromGregorian(2026, 5, 2);
        assert.equal(d.year, 1405);
        assert.equal(d.month, 2);
        assert.equal(d.day, 12);
    });

    it('converts date in negative Jalali year', () => {
        const d = JalaliDate.fromGregorian(100, 3, 21);
        assert.ok(d.year < 0);
    });

    it('throws RangeError for Gregorian year 0', () => {
        assert.throws(
            () => JalaliDate.fromGregorian(0, 1, 1),
            RangeError
        );
    });

    it('throws RangeError for Gregorian year below MIN_GREGORIAN_YEAR', () => {
        assert.throws(
            () => JalaliDate.fromGregorian(JalaliDate.MIN_GREGORIAN_YEAR - 1, 1, 1),
            RangeError
        );
    });

    it('throws RangeError for Gregorian year above MAX_GREGORIAN_YEAR', () => {
        assert.throws(
            () => JalaliDate.fromGregorian(JalaliDate.MAX_GREGORIAN_YEAR + 1, 1, 1),
            RangeError
        );
    });

    it('throws RangeError for month 0', () => {
        assert.throws(
            () => JalaliDate.fromGregorian(2024, 0, 1),
            RangeError
        );
    });

    it('throws RangeError for month 13', () => {
        assert.throws(
            () => JalaliDate.fromGregorian(2024, 13, 1),
            RangeError
        );
    });

    it('accepts date at MIN_GREGORIAN_YEAR boundary', () => {
        const d = JalaliDate.fromGregorian(JalaliDate.MIN_GREGORIAN_YEAR, 1, 1);
        assert.ok(d instanceof JalaliDate);
    });

    it('accepts date at MAX_GREGORIAN_YEAR boundary within Jalali range', () => {
        // MAX_GREGORIAN_YEAR is 3000, but we need to ensure it maps to a valid Jalali year
        // Test with a date that's definitely within range
        const d = JalaliDate.fromGregorian(JalaliDate.MAX_GREGORIAN_YEAR, 1, 1);
        assert.ok(d instanceof JalaliDate);
    });

    it('throws RangeError when Gregorian date maps to Jalali year beyond MAX_YEAR', () => {
        // Gregorian 3000-12-31 would map to beyond Jalali MAX_YEAR
        assert.throws(
            () => JalaliDate.fromGregorian(JalaliDate.MAX_GREGORIAN_YEAR, 12, 31),
            RangeError
        );
    });

    it('throws RangeError for day 0', () => {
        assert.throws(
            () => JalaliDate.fromGregorian(2024, 1, 0),
            RangeError
        );
    });

    it('throws RangeError for day 32 in January (31 days)', () => {
        assert.throws(
            () => JalaliDate.fromGregorian(2024, 1, 32),
            RangeError
        );
    });

    it('throws RangeError for day 30 in February non-leap year (28 days)', () => {
        assert.throws(
            () => JalaliDate.fromGregorian(2023, 2, 30),
            RangeError
        );
    });

    it('throws RangeError for day 30 in February leap year (29 days)', () => {
        assert.throws(
            () => JalaliDate.fromGregorian(2024, 2, 30),
            RangeError
        );
    });

    it('throws RangeError for day 31 in April (30 days)', () => {
        assert.throws(
            () => JalaliDate.fromGregorian(2024, 4, 31),
            RangeError
        );
    });

    it('accepts February 29 in leap year (2024)', () => {
        const d = JalaliDate.fromGregorian(2024, 2, 29);
        assert.ok(d instanceof JalaliDate);
    });

    it('throws RangeError for February 29 in non-leap year (2023)', () => {
        assert.throws(
            () => JalaliDate.fromGregorian(2023, 2, 29),
            RangeError
        );
    });

    it('accepts day 1 (minimum valid day)', () => {
        const d = JalaliDate.fromGregorian(2024, 1, 1);
        assert.ok(d instanceof JalaliDate);
    });

    it('accepts day 31 in January (maximum for that month)', () => {
        const d = JalaliDate.fromGregorian(2024, 1, 31);
        assert.ok(d instanceof JalaliDate);
    });

    it('accepts day 28 in February non-leap year', () => {
        const d = JalaliDate.fromGregorian(2023, 2, 28);
        assert.ok(d instanceof JalaliDate);
    });

    it('accepts day 30 in April (maximum for that month)', () => {
        const d = JalaliDate.fromGregorian(2024, 4, 30);
        assert.ok(d instanceof JalaliDate);
    });
});

describe('JalaliDate.fromJDN', () => {
    it('creates date from JDN for Nowruz 1403 (2024-03-20)', () => {
        // JDN for 2024-03-20
        const d = JalaliDate.fromJDN(2460390);
        assert.equal(d.year, 1403);
        assert.equal(d.month, 1);
        assert.equal(d.day, 1);
    });

    it('creates date from JDN at JalaliDate.MIN_YEAR boundary', () => {
        const minDate = new JalaliDate(JalaliDate.MIN_YEAR, 1, 1);
        const d = JalaliDate.fromJDN(minDate.jdn);
        assert.equal(d.year, JalaliDate.MIN_YEAR);
        assert.equal(d.month, 1);
        assert.equal(d.day, 1);
    });

    it('creates date from JDN at JalaliDate.MAX_YEAR boundary', () => {
        const lastDay = JalaliDate.isLeapYear(JalaliDate.MAX_YEAR) ? 30 : 29;
        const maxDate = new JalaliDate(JalaliDate.MAX_YEAR, 12, lastDay);
        const d = JalaliDate.fromJDN(maxDate.jdn);
        assert.equal(d.year, JalaliDate.MAX_YEAR);
        assert.equal(d.month, 12);
        assert.equal(d.day, lastDay);
    });

    it('throws RangeError for JDN below MIN_YEAR range', () => {
        const minDate = new JalaliDate(JalaliDate.MIN_YEAR, 1, 1);
        const jdnBeforeMin = minDate.jdn - 365;
        assert.throws(
            () => JalaliDate.fromJDN(jdnBeforeMin),
            RangeError
        );
    });

    it('throws RangeError for JDN above MAX_YEAR range', () => {
        const lastDay = JalaliDate.isLeapYear(JalaliDate.MAX_YEAR) ? 30 : 29;
        const maxDate = new JalaliDate(JalaliDate.MAX_YEAR, 12, lastDay);
        const jdnAfterMax = maxDate.jdn + 365;
        assert.throws(
            () => JalaliDate.fromJDN(jdnAfterMax),
            RangeError
        );
    });

    it('round-trips via jdn property', () => {
        const original = new JalaliDate(1402, 6, 15);
        const roundTrip = JalaliDate.fromJDN(original.jdn);
        assert.ok(original.equals(roundTrip));
    });
});

describe('JalaliDate.fromDate', () => {
    it('derives date from UTC timestamp using Tehran time', () => {
        // 2024-03-20T00:00:00Z = 2024-03-20 03:30 Tehran → Nowruz 1403
        const d = JalaliDate.fromDate(new Date('2024-03-20T00:00:00Z'));
        assert.equal(d.year, 1403);
        assert.equal(d.month, 1);
        assert.equal(d.day, 1);
    });

    it('handles date just before Tehran midnight (still previous day)', () => {
        // 2024-03-19T20:29:59Z = 2024-03-19 23:59:59 Tehran → last day of Jalali 1402
        const d = JalaliDate.fromDate(new Date('2024-03-19T20:29:59Z'));
        assert.equal(d.year, 1402);
        assert.equal(d.month, 12);
        assert.equal(d.day, 29);
    });
});

describe('JalaliDate.parse', () => {
    it('parses "1402/06/31" with default pattern', () => {
        const d = JalaliDate.parse('1402/06/31');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('parses "31-06-1402" with custom pattern', () => {
        const d = JalaliDate.parse('31-06-1402', 'dd-MM-yyyy');
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1402, month: 6, day: 31 });
    });

    it('parses Persian digits', () => {
        const d = JalaliDate.parse('۱۴۰۲/۰۶/۳۱');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('parses mixed Latin and Persian digits', () => {
        const d = JalaliDate.parse('14۰2/6/۳1');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('parses with month name (MMMM)', () => {
        const d = JalaliDate.parse('31 شهریور 1402', 'D MMMM YYYY');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('parses all month names correctly', () => {
        const monthNames = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ];
        for (let m = 0; m < monthNames.length; m++) {
            const d = JalaliDate.parse(`15 ${monthNames[m]} 1402`, 'D MMMM YYYY');
            assert.equal(d.month, m + 1);
        }
    });

    it('parses with day of week (DDDD is ignored)', () => {
        const d = JalaliDate.parse('جمعه 1402/6/31', 'DDDD YYYY/M/D');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('parses with quoted literal text', () => {
        const d = JalaliDate.parse('Year: 1402, Month: 6, Day: 31', '"Year: "YYYY", Month: "M", Day: "D');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('parses with single-quoted literal text', () => {
        const d = JalaliDate.parse('Date: 1402-6-31', "'Date: 'YYYY-M-D");
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('parses 2-digit year (YY)', () => {
        const d = JalaliDate.parse('02/6/31', 'YY/M/D');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('parses zero-padded day and month (DD and MM)', () => {
        const d = JalaliDate.parse('1402-06-09', 'YYYY-MM-DD');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 9);
    });

    it('parses non-zero-padded day and month (D and M)', () => {
        const d = JalaliDate.parse('1402/6/9', 'YYYY/M/D');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 9);
    });

    it('parses with different separators', () => {
        const d = JalaliDate.parse('1402.06.31', 'YYYY.MM.DD');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('throws for unrecognised string', () => {
        assert.throws(() => JalaliDate.parse('not-a-date'), Error);
    });

    it('throws for mismatched pattern', () => {
        assert.throws(() => JalaliDate.parse('1402/06/31', 'DD-MM-YYYY'), Error);
    });

    it('throws for unrecognized month name', () => {
        assert.throws(() => JalaliDate.parse('31 InvalidMonth 1402', 'D MMMM YYYY'), Error);
    });

    it('throws for out-of-range date', () => {
        assert.throws(() => JalaliDate.parse('1402/13/1'), RangeError);
    });

    it('throws for out-of-range day', () => {
        assert.throws(() => JalaliDate.parse('1402/6/32'), RangeError);
    });

    it('throws for invalid input that partially matches', () => {
        assert.throws(() => JalaliDate.parse('1402/6'), Error);
    });

    it('throws when required components are missing', () => {
        assert.throws(() => JalaliDate.parse('1402', 'YYYY/M/D'), Error);
    });

    it('parses with extra whitespace handled by pattern', () => {
        const d = JalaliDate.parse('1402 / 6 / 31', 'YYYY / M / D');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });
});

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

describe('toGregorian', () => {
    it('converts 1403/1/1 to 2024-03-20', () => {
        const d = new JalaliDate(1403, 1, 1);
        const g = d.toGregorian();
        assert.deepEqual(g, { year: 2024, month: 3, day: 20 });
    });

    it('converts 1402/6/31 to correct Gregorian date', () => {
        const d = new JalaliDate(1402, 6, 31);
        const g = d.toGregorian();
        // Verify round-trip
        const back = JalaliDate.fromGregorian(g.year, g.month, g.day);
        assert.ok(back.equals(d));
    });

    it('converts negative Jalali year correctly', () => {
        const d = new JalaliDate(-100, 1, 1);
        const g = d.toGregorian();
        assert.ok(typeof g.year === 'number');
        // Verify round-trip
        const back = JalaliDate.fromGregorian(g.year, g.month, g.day);
        assert.ok(back.equals(d));
    });
});

// ---------------------------------------------------------------------------
// toDate / fromDate round-trip
// ---------------------------------------------------------------------------

describe('toDate / fromDate round-trip', () => {
    const samples = [
        new JalaliDate(1402, 1, 1),
        new JalaliDate(1403, 12, 30), // leap day
        new JalaliDate(1400, 6, 31),
        new JalaliDate(1395, 12, 30), // leap
        new JalaliDate(1380, 7, 15),
    ];

    for (const original of samples) {
        it(`${original} round-trips via toGregorian/fromGregorian`, () => {
            const g = original.toGregorian();
            const roundTripped = JalaliDate.fromGregorian(g.year, g.month, g.day);
            assert.ok(
                roundTripped.equals(original),
                `Expected ${original}, got ${roundTripped}`
            );
        });
    }
});

// ---------------------------------------------------------------------------
// Static utilities
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Computed properties
// ---------------------------------------------------------------------------

describe('jdn property', () => {
    it('returns consistent value for same date', () => {
        const d1 = new JalaliDate(1402, 6, 15);
        const d2 = new JalaliDate(1402, 6, 15);
        assert.equal(d1.jdn, d2.jdn);
    });

    it('increases by 1 for next day', () => {
        const d1 = new JalaliDate(1402, 6, 15);
        const d2 = new JalaliDate(1402, 6, 16);
        assert.equal(d2.jdn - d1.jdn, 1);
    });
});

describe('daysInMonth property', () => {
    it('returns 31 for month 1', () => {
        assert.equal(new JalaliDate(1402, 1, 1).daysInMonth, 31);
    });

    it('returns 30 for month 7', () => {
        assert.equal(new JalaliDate(1402, 7, 1).daysInMonth, 30);
    });

    it('returns 29 for month 12 in common year', () => {
        assert.equal(new JalaliDate(1402, 12, 1).daysInMonth, 29);
    });

    it('returns 30 for month 12 in leap year', () => {
        assert.equal(new JalaliDate(1403, 12, 1).daysInMonth, 30);
    });
});

describe('daysInYear property', () => {
    it('returns 365 for common year', () => {
        assert.equal(new JalaliDate(1402, 1, 1).daysInYear, 365);
    });

    it('returns 366 for leap year', () => {
        assert.equal(new JalaliDate(1403, 1, 1).daysInYear, 366);
    });
});

describe('dayOfYear', () => {
    it('Farvardin 1 is day 1', () => {
        assert.equal(new JalaliDate(1402, 1, 1).dayOfYear, 1);
    });

    it('Farvardin 31 is day 31', () => {
        assert.equal(new JalaliDate(1402, 1, 31).dayOfYear, 31);
    });

    it('Ordibehesht 1 is day 32', () => {
        assert.equal(new JalaliDate(1402, 2, 1).dayOfYear, 32);
    });

    it('last day of common year is 365', () => {
        // 1402 is common
        assert.equal(new JalaliDate(1402, 12, 29).dayOfYear, 365);
    });

    it('last day of leap year is 366', () => {
        // 1403 is leap
        assert.equal(new JalaliDate(1403, 12, 30).dayOfYear, 366);
    });
});

describe('dayOfWeek', () => {
    // 2024-03-20 (Nowruz 1403) was a Wednesday → JS dayOfWeek = 3
    it('Nowruz 1403 (2024-03-20) is Wednesday (3)', () => {
        const d = new JalaliDate(1403, 1, 1);
        assert.equal(d.dayOfWeek, 3);
    });

    // 2023-03-21 (Nowruz 1402) was a Tuesday → JS dayOfWeek = 2
    it('Nowruz 1402 (2023-03-21) is Tuesday (2)', () => {
        const d = new JalaliDate(1402, 1, 1);
        assert.equal(d.dayOfWeek, 2);
    });
});

// ---------------------------------------------------------------------------
// Arithmetic
// ---------------------------------------------------------------------------

describe('addDays', () => {
    it('adds positive days', () => {
        const d = new JalaliDate(1402, 6, 31).addDays(1);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1402, month: 7, day: 1 });
    });

    it('adds negative days', () => {
        const d = new JalaliDate(1402, 7, 1).addDays(-1);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1402, month: 6, day: 31 });
    });

    it('crosses year boundary', () => {
        const d = new JalaliDate(1402, 12, 29).addDays(1);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1403, month: 1, day: 1 });
    });

    it('is commutative: +n then -n returns original', () => {
        const original = new JalaliDate(1402, 6, 15);
        assert.ok(original.addDays(100).addDays(-100).equals(original));
    });

    it('handles adding 0 days', () => {
        const d = new JalaliDate(1402, 6, 15);
        const same = d.addDays(0);
        assert.ok(same.equals(d));
    });
});

describe('addMonths', () => {
    it('adds one month within the same year', () => {
        const d = new JalaliDate(1402, 5, 15).addMonths(1);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1402, month: 6, day: 15 });
    });

    it('wraps from month 12 to month 1 of next year', () => {
        const d = new JalaliDate(1402, 12, 1).addMonths(1);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1403, month: 1, day: 1 });
    });

    it('clamps day to last day of shorter month', () => {
        // Month 6 (Shahrivar) has 31 days; month 7 (Mehr) has 30
        const d = new JalaliDate(1402, 6, 31).addMonths(1);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1402, month: 7, day: 30 });
    });

    it('subtracts months with negative n', () => {
        const d = new JalaliDate(1402, 3, 15).addMonths(-2);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1402, month: 1, day: 15 });
    });

    it('adds 12 months (one year)', () => {
        const d = new JalaliDate(1402, 6, 15).addMonths(12);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1403, month: 6, day: 15 });
    });

    it('adds 24 months (two years)', () => {
        const d = new JalaliDate(1402, 6, 15).addMonths(24);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1404, month: 6, day: 15 });
    });

    it('subtracts 13 months crossing year boundary', () => {
        const d = new JalaliDate(1402, 2, 15).addMonths(-13);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1401, month: 1, day: 15 });
    });

    it('handles 0 months', () => {
        const d = new JalaliDate(1402, 6, 15);
        const same = d.addMonths(0);
        assert.ok(same.equals(d));
    });

    it('clamps Esfand 30 when moving to common year', () => {
        const d = new JalaliDate(1403, 12, 30).addMonths(12);
        assert.equal(d.day, 29);
    });

    it('skips year 0 when adding months from year -1 to year 1', () => {
        const d = new JalaliDate(-1, 12, 15).addMonths(1);
        assert.equal(d.year, 1);
        assert.equal(d.month, 1);
        assert.equal(d.day, 15);
    });

    it('skips year 0 when subtracting months from year 1 to year -1', () => {
        const d = new JalaliDate(1, 1, 15).addMonths(-1);
        assert.equal(d.year, -1);
        assert.equal(d.month, 12);
        assert.equal(d.day, 15);
    });

    it('skips year 0 when adding many months across the boundary', () => {
        const d = new JalaliDate(-1, 6, 15).addMonths(7);
        assert.equal(d.year, 1);
        assert.equal(d.month, 1);
    });
});

describe('addYears', () => {
    it('adds one year', () => {
        const d = new JalaliDate(1402, 6, 15).addYears(1);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1403, month: 6, day: 15 });
    });

    it('clamps Esfand 30 (leap day) to Esfand 29 in a common year', () => {
        // 1403 is leap; 1404 is common
        const d = new JalaliDate(1403, 12, 30).addYears(1);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1404, month: 12, day: 29 });
    });

    it('subtracts years with negative n', () => {
        const d = new JalaliDate(1402, 6, 15).addYears(-2);
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1400, month: 6, day: 15 });
    });

    it('handles 0 years', () => {
        const d = new JalaliDate(1402, 6, 15);
        const same = d.addYears(0);
        assert.ok(same.equals(d));
    });

    it('adds multiple years', () => {
        const d = new JalaliDate(1400, 6, 15).addYears(10);
        assert.equal(d.year, 1410);
    });

    it('skips year 0 when adding years from negative to positive', () => {
        const d = new JalaliDate(-1, 6, 15).addYears(1);
        assert.equal(d.year, 1);
        assert.equal(d.month, 6);
        assert.equal(d.day, 15);
    });

    it('skips year 0 when subtracting years from positive to negative', () => {
        const d = new JalaliDate(1, 6, 15).addYears(-1);
        assert.equal(d.year, -1);
        assert.equal(d.month, 6);
        assert.equal(d.day, 15);
    });

    it('skips year 0 when adding multiple years across the boundary', () => {
        const d = new JalaliDate(-5, 6, 15).addYears(10);
        assert.equal(d.year, 6); // -5 + 10 = 5, but skipping 0 gives 6
        assert.equal(d.month, 6);
    });
});

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

describe('format method', () => {
    const d = new JalaliDate(1402, 6, 5); // 1402/06/05

    it('formats with YYYY', () => {
        assert.equal(d.format('YYYY'), '۱۴۰۲');
    });

    it('formats with YY', () => {
        assert.equal(d.format('YY'), '۰۲');
    });

    it('formats with M', () => {
        assert.equal(d.format('M'), '۶');
    });

    it('formats with MM', () => {
        assert.equal(d.format('MM'), '۰۶');
    });

    it('formats with MMMM', () => {
        assert.equal(d.format('MMMM'), 'شهریور');
    });

    it('formats with D', () => {
        assert.equal(d.format('D'), '۵');
    });

    it('formats with DD', () => {
        assert.equal(d.format('DD'), '۰۵');
    });

    it('formats with DDDD', () => {
        // 1402/6/5 is جمعه (Friday)
        const dow = d.dayOfWeek; // Get actual day of week
        const expected = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'][dow];
        assert.equal(d.format('DDDD'), expected);
    });

    it('formats with combined pattern YYYY/MM/DD', () => {
        assert.equal(d.format('YYYY/MM/DD'), '۱۴۰۲/۰۶/۰۵');
    });

    it('formats with combined pattern DDDD، D MMMM YYYY', () => {
        const dow = d.dayOfWeek;
        const dayName = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'][dow];
        assert.equal(d.format('DDDD، D MMMM YYYY'), `${dayName}، ۵ شهریور ۱۴۰۲`);
    });

    it('formats with double-quoted literal text', () => {
        assert.equal(d.format('"Year: "YYYY'), 'Year: ۱۴۰۲');
    });

    it('formats with single-quoted literal text', () => {
        assert.equal(d.format("'Date: 'YYYY/M/D"), 'Date: ۱۴۰۲/۶/۵');
    });

    it('formats with mixed literal and tokens', () => {
        assert.equal(d.format('YYYY"-"MM"-"DD'), '۱۴۰۲-۰۶-۰۵');
    });

    it('formats all month names correctly', () => {
        const monthNames = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ];
        for (let m = 1; m <= 12; m++) {
            const date = new JalaliDate(1402, m, 1);
            assert.equal(date.format('MMMM'), monthNames[m - 1]);
        }
    });

    it('formats day 31 correctly', () => {
        const d31 = new JalaliDate(1402, 1, 31);
        assert.equal(d31.format('DD'), '۳۱');
    });
});

describe('toString / toJSON', () => {
    it('toString returns "yyyy/MM/dd"', () => {
        assert.equal(new JalaliDate(1402, 6, 5).toString(), '1402/06/05');
    });

    it('toJSON returns the same string', () => {
        const d = new JalaliDate(1402, 6, 5);
        assert.equal(d.toJSON(), d.toString());
    });
});

// ---------------------------------------------------------------------------
// Range boundaries
// ---------------------------------------------------------------------------

describe('JalaliDate range boundaries', () => {
    it('constructs at JalaliDate.MIN_YEAR 1/1/1', () => {
        const d = new JalaliDate(JalaliDate.MIN_YEAR, 1, 1);
        assert.equal(d.year, JalaliDate.MIN_YEAR);
    });

    it('constructs at JalaliDate.MAX_YEAR 12/(last day)', () => {
        const lastDay = JalaliDate.isLeapYear(JalaliDate.MAX_YEAR) ? 30 : 29;
        const d = new JalaliDate(JalaliDate.MAX_YEAR, 12, lastDay);
        assert.equal(d.year, JalaliDate.MAX_YEAR);
        assert.equal(d.day, lastDay);
    });

    it('throws RangeError for year below JalaliDate.MIN_YEAR', () => {
        assert.throws(() => new JalaliDate(JalaliDate.MIN_YEAR - 1, 1, 1), RangeError);
    });

    it('throws RangeError for year above JalaliDate.MAX_YEAR', () => {
        assert.throws(() => new JalaliDate(JalaliDate.MAX_YEAR + 1, 1, 1), RangeError);
    });

    it('MIN_YEAR 1/1/1 converts to Gregorian but cannot round-trip', () => {
        // MIN_YEAR (-1621) maps to Gregorian year -1001, which is below MIN_GREGORIAN_YEAR (-1000)
        const d = new JalaliDate(JalaliDate.MIN_YEAR, 1, 1);
        const g = d.toGregorian();
        assert.equal(g.year, -1001); // Below MIN_GREGORIAN_YEAR
        // Cannot round-trip because -1001 is out of range for fromGregorian
        assert.throws(
            () => JalaliDate.fromGregorian(g.year, g.month, g.day),
            RangeError
        );
    });

    it('round-trips via toGregorian/fromGregorian at a valid boundary date', () => {
        // Use MIN_YEAR + some offset to ensure it maps to a valid Gregorian year
        const d = new JalaliDate(JalaliDate.MIN_YEAR + 200, 1, 1);
        const g = d.toGregorian();
        assert.ok(g.year >= JalaliDate.MIN_GREGORIAN_YEAR);
        assert.ok(JalaliDate.fromGregorian(g.year, g.month, g.day).equals(d));
    });

    it('round-trips via toGregorian/fromGregorian at JalaliDate.MAX_YEAR 1/1/1', () => {
        const d = new JalaliDate(JalaliDate.MAX_YEAR, 1, 1);
        const g = d.toGregorian();
        assert.ok(JalaliDate.fromGregorian(g.year, g.month, g.day).equals(d));
    });

    it('dayOfYear works at MIN_YEAR', () => {
        const d = new JalaliDate(JalaliDate.MIN_YEAR, 1, 1);
        assert.equal(d.dayOfYear, 1);
    });

    it('dayOfYear works at MAX_YEAR', () => {
        const lastDay = JalaliDate.isLeapYear(JalaliDate.MAX_YEAR) ? 30 : 29;
        const d = new JalaliDate(JalaliDate.MAX_YEAR, 12, lastDay);
        const expectedDayOfYear = JalaliDate.isLeapYear(JalaliDate.MAX_YEAR) ? 366 : 365;
        assert.equal(d.dayOfYear, expectedDayOfYear);
    });
});

// ---------------------------------------------------------------------------
// fromDate at Unix epoch
// ---------------------------------------------------------------------------

describe('JalaliDate.fromDate Unix epoch', () => {
    it('Unix epoch maps to Gregorian 1970-01-01 in Tehran', () => {
        // 1970-01-01T00:00:00Z = 1970-01-01T03:30:00 Tehran → still Jan 1
        const d = JalaliDate.fromDate(new Date(0));
        assert.deepEqual(d.toGregorian(), { year: 1970, month: 1, day: 1 });
    });

    it('Unix epoch round-trips via toGregorian/fromGregorian', () => {
        const d = JalaliDate.fromDate(new Date(0));
        const g = d.toGregorian();
        assert.ok(JalaliDate.fromGregorian(g.year, g.month, g.day).equals(d));
    });

    it('handles timestamps just before Tehran midnight', () => {
        // Test that Tehran offset is correctly applied
        const beforeMidnight = new Date('2024-03-19T20:29:59Z'); // Just before midnight in Tehran
        const d = JalaliDate.fromDate(beforeMidnight);
        const afterMidnight = new Date('2024-03-19T20:30:01Z'); // Just after midnight in Tehran
        const d2 = JalaliDate.fromDate(afterMidnight);
        // Should be different days
        assert.ok(!d.equals(d2) || d.day !== d2.day);
    });
});

// ---------------------------------------------------------------------------
// dayOfWeek — all 7 values (anchored to Nowruz 1403 = 2024-03-20 = Wednesday)
// ---------------------------------------------------------------------------

describe('dayOfWeek all 7 values', () => {
    const cases = [
        { day: 1, dow: 3, name: 'Wednesday' },
        { day: 2, dow: 4, name: 'Thursday' },
        { day: 3, dow: 5, name: 'Friday' },
        { day: 4, dow: 6, name: 'Saturday' },
        { day: 5, dow: 0, name: 'Sunday' },
        { day: 6, dow: 1, name: 'Monday' },
        { day: 7, dow: 2, name: 'Tuesday' },
    ];

    for (const { day, dow, name } of cases) {
        it(`1403/1/${day} is ${name} (${dow})`, () => {
            assert.equal(new JalaliDate(1403, 1, day).dayOfWeek, dow);
        });
    }

    it('works for negative years', () => {
        const d = new JalaliDate(-100, 1, 1);
        const dow = d.dayOfWeek;
        assert.ok(dow >= 0 && dow <= 6);
    });
});

// ---------------------------------------------------------------------------
// Arithmetic out of range
// ---------------------------------------------------------------------------

describe('arithmetic out of supported range', () => {
    it('addDays past JalaliDate.MAX_YEAR throws', () => {
        const d = new JalaliDate(JalaliDate.MAX_YEAR, 12, 29);
        assert.throws(() => d.addDays(10), Error);
    });

    it('addDays before JalaliDate.MIN_YEAR throws', () => {
        const d = new JalaliDate(JalaliDate.MIN_YEAR, 1, 1);
        assert.throws(() => d.addDays(-1), Error);
    });

    it('addMonths past JalaliDate.MAX_YEAR throws', () => {
        const d = new JalaliDate(JalaliDate.MAX_YEAR, 1, 1);
        assert.throws(() => d.addMonths(13), RangeError);
    });

    it('addMonths before JalaliDate.MIN_YEAR throws', () => {
        const d = new JalaliDate(JalaliDate.MIN_YEAR, 1, 1);
        assert.throws(() => d.addMonths(-1), RangeError);
    });

    it('addYears past JalaliDate.MAX_YEAR throws', () => {
        const d = new JalaliDate(JalaliDate.MAX_YEAR, 1, 1);
        assert.throws(() => d.addYears(1), RangeError);
    });

    it('addYears before JalaliDate.MIN_YEAR throws', () => {
        const d = new JalaliDate(JalaliDate.MIN_YEAR, 1, 1);
        assert.throws(() => d.addYears(-1), RangeError);
    });
});
