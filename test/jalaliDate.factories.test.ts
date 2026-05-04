/**
 * Tests for JalaliDate static factory methods
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('JalaliDate.today', () => {
    it('returns a valid JalaliDate', () => {
        const d = JalaliDate.today();
        assert.ok(d instanceof JalaliDate);
        assert.ok(d.year >= JalaliDate.MIN_YEAR && d.year <= JalaliDate.MAX_YEAR);
        assert.ok(d.month >= 1 && d.month <= 12);
        assert.ok(d.day >= 1 && d.day <= 31);
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

    it('Unix epoch maps to Gregorian 1970-01-01 in Tehran', () => {
        // 1970-01-01T00:00:00Z = 1970-01-01T03:30:00 Tehran → still Jan 1
        const d = JalaliDate.fromDate(new Date(0));
        assert.deepEqual(d.toGregorian(), { year: 1970, month: 1, day: 1 });
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

    it('creates date from day 187 (first day of second half)', () => {
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

describe('JalaliDate.fromWeekOfYear', () => {
    it('creates date from week 1, Saturday for year where Saturday is before 1 Farvardin', () => {
        // 1403/1/1 is Wednesday, so week 1 Saturday is 4 days earlier in year 1402
        const d = JalaliDate.fromWeekOfYear(1403, 1, 6);
        assert.equal(d.dayOfWeek, 6);
        // This Saturday is in year 1402, week 53
        assert.equal(d.year, 1402);
        assert.equal(d.weekOfYear, 53);
    });

    it('creates date from week 1, Wednesday (1 Farvardin)', () => {
        // 1403/1/1 is Wednesday
        const d = JalaliDate.fromWeekOfYear(1403, 1, 3);
        assert.equal(d.dayOfWeek, 3);
        assert.equal(d.year, 1403);
        assert.equal(d.month, 1);
        assert.equal(d.day, 1);
    });

    it('creates date from week 1, Friday', () => {
        const d = JalaliDate.fromWeekOfYear(1403, 1, 5);
        assert.equal(d.dayOfWeek, 5);
        assert.equal(d.year, 1403);
        // Friday of week 1 is 2 days after Wednesday (1 Farvardin)
        assert.equal(d.month, 1);
        assert.equal(d.day, 3);
    });

    it('creates date from week 2, Saturday', () => {
        const d = JalaliDate.fromWeekOfYear(1403, 2, 6);
        assert.equal(d.dayOfWeek, 6);
        assert.equal(d.weekOfYear, 2);
        assert.equal(d.year, 1403);
    });

    it('round-trips with weekOfYear property', () => {
        const original = new JalaliDate(1403, 6, 15);
        const reconstructed = JalaliDate.fromWeekOfYear(
            original.year,
            original.weekOfYear,
            original.dayOfWeek
        );
        assert.ok(reconstructed.equals(original));
    });

    it('round-trips for various dates in the year', () => {
        const testDates = [
            new JalaliDate(1403, 1, 1),
            new JalaliDate(1403, 1, 15),
            new JalaliDate(1403, 6, 15),
            new JalaliDate(1403, 12, 15),
            new JalaliDate(1403, 12, 30),
        ];

        for (const original of testDates) {
            const reconstructed = JalaliDate.fromWeekOfYear(
                original.year,
                original.weekOfYear,
                original.dayOfWeek
            );
            assert.ok(
                reconstructed.equals(original),
                `Failed for ${original.toString()}`
            );
        }
    });

    it('throws RangeError for week number < 1', () => {
        assert.throws(
            () => JalaliDate.fromWeekOfYear(1403, 0, 6),
            RangeError
        );
    });

    it('throws RangeError for week number > 53', () => {
        assert.throws(
            () => JalaliDate.fromWeekOfYear(1403, 54, 6),
            RangeError
        );
    });

    it('throws RangeError for dayOfWeek < 0', () => {
        assert.throws(
            () => JalaliDate.fromWeekOfYear(1403, 1, -1),
            RangeError
        );
    });

    it('throws RangeError for dayOfWeek > 6', () => {
        assert.throws(
            () => JalaliDate.fromWeekOfYear(1403, 1, 7),
            RangeError
        );
    });

    it('throws RangeError for year 0', () => {
        assert.throws(
            () => JalaliDate.fromWeekOfYear(0, 1, 6),
            RangeError
        );
    });

    it('works for negative years', () => {
        const d = JalaliDate.fromWeekOfYear(-100, 1, 6);
        assert.equal(d.dayOfWeek, 6);
        assert.ok(d.year >= -101 && d.year <= -100);
    });
});

describe('JalaliDate.fromNthWeekdayOfMonth', () => {
    // Positive nth tests (counting from start)
    it('creates first occurrence of a weekday in a month', () => {
        // First Tuesday of Ordibehesht 1403
        // 1403/2/1 is a Thursday (4), so first Tuesday is 1403/2/6
        const d = JalaliDate.fromNthWeekdayOfMonth(1403, 2, 1, 2);
        assert.equal(d.year, 1403);
        assert.equal(d.month, 2);
        assert.equal(d.dayOfWeek, 2); // Tuesday
    });

    it('creates second occurrence of a weekday in a month', () => {
        // Second Tuesday of Ordibehesht 1405
        const d = JalaliDate.fromNthWeekdayOfMonth(1405, 2, 2, 2);
        assert.equal(d.year, 1405);
        assert.equal(d.month, 2);
        assert.equal(d.dayOfWeek, 2); // Tuesday
        // Should be 7 days after the first Tuesday
        const firstTuesday = JalaliDate.fromNthWeekdayOfMonth(1405, 2, 1, 2);
        assert.equal(d.day, firstTuesday.day + 7);
    });

    it('creates third occurrence of a weekday in a month', () => {
        // Third Wednesday of Farvardin 1403
        const d = JalaliDate.fromNthWeekdayOfMonth(1403, 1, 3, 3);
        assert.equal(d.year, 1403);
        assert.equal(d.month, 1);
        assert.equal(d.dayOfWeek, 3); // Wednesday
    });

    it('creates fourth occurrence when it exists', () => {
        // Fourth Saturday of a month
        const d = JalaliDate.fromNthWeekdayOfMonth(1403, 1, 4, 6);
        assert.equal(d.year, 1403);
        assert.equal(d.month, 1);
        assert.equal(d.dayOfWeek, 6); // Saturday
    });

    it('creates fifth occurrence when it exists', () => {
        // Find a month with 5 occurrences of a weekday
        // A month needs at least 29 days and the weekday must appear on days 1-3 to have 5 occurrences
        let found = false;
        for (let month = 1; month <= 12; month++) {
            for (let dow = 0; dow <= 6; dow++) {
                const firstDay = new JalaliDate(1403, month, 1);
                const daysInMonth = JalaliDate.daysInMonth(1403, month);
                const firstDow = firstDay.dayOfWeek;
                const daysToFirst = (dow - firstDow + 7) % 7;
                const fifthDay = 1 + daysToFirst + 4 * 7; // 5th occurrence

                if (fifthDay <= daysInMonth) {
                    // This month has 5 occurrences of this weekday
                    const d = JalaliDate.fromNthWeekdayOfMonth(1403, month, 5, dow);
                    assert.equal(d.year, 1403);
                    assert.equal(d.month, month);
                    assert.equal(d.dayOfWeek, dow);
                    assert.ok(d.day >= 29 && d.day <= 31);
                    found = true;
                    break;
                }
            }
            if (found) break;
        }
        assert.ok(found, 'Should find at least one month with 5 occurrences of a weekday');
    });

    it('handles when first day of month is the target weekday', () => {
        // If 1403/1/1 is Wednesday, first Wednesday should be day 1
        const d = JalaliDate.fromNthWeekdayOfMonth(1403, 1, 1, 3);
        assert.equal(d.day, 1);
        assert.equal(d.dayOfWeek, 3);
    });

    // Negative nth tests (counting from end)
    it('creates last occurrence of a weekday in a month', () => {
        // Last Friday of Esfand 1404
        const d = JalaliDate.fromNthWeekdayOfMonth(1404, 12, -1, 5);
        assert.equal(d.year, 1404);
        assert.equal(d.month, 12);
        assert.equal(d.dayOfWeek, 5); // Friday

        // Verify it's the last Friday by checking next Friday would be in next month
        const nextFriday = d.addDays(7);
        assert.ok(nextFriday.month !== 12 || nextFriday.year !== 1404);
    });

    it('creates second-to-last occurrence of a weekday', () => {
        // Second-to-last Monday of a month
        const d = JalaliDate.fromNthWeekdayOfMonth(1403, 6, -2, 1);
        assert.equal(d.year, 1403);
        assert.equal(d.month, 6);
        assert.equal(d.dayOfWeek, 1); // Monday

        // Verify: last Monday should be 7 days after this one
        const lastMonday = JalaliDate.fromNthWeekdayOfMonth(1403, 6, -1, 1);
        assert.equal(lastMonday.day, d.day + 7);
    });

    it('creates third-to-last occurrence when it exists', () => {
        // Third-to-last Sunday of a 31-day month
        const d = JalaliDate.fromNthWeekdayOfMonth(1403, 1, -3, 0);
        assert.equal(d.year, 1403);
        assert.equal(d.month, 1);
        assert.equal(d.dayOfWeek, 0); // Sunday
    });

    it('handles when last day of month is the target weekday', () => {
        // Find a month where the last day is a specific weekday
        // Test with various months
        for (let month = 1; month <= 12; month++) {
            const lastDay = new JalaliDate(1403, month, JalaliDate.daysInMonth(1403, month));
            const lastOccurrence = JalaliDate.fromNthWeekdayOfMonth(1403, month, -1, lastDay.dayOfWeek);
            assert.equal(lastOccurrence.day, lastDay.day,
                `Last ${lastDay.dayOfWeek} of month ${month} should be day ${lastDay.day}`);
        }
    });

    // Edge cases and validation
    it('throws RangeError when nth is 0', () => {
        assert.throws(() => JalaliDate.fromNthWeekdayOfMonth(1403, 1, 0, 3), RangeError);
    });

    it('throws RangeError when nth occurrence does not exist (5th in short month)', () => {
        // Try to get 5th occurrence in a month that has only 4
        assert.throws(() => JalaliDate.fromNthWeekdayOfMonth(1403, 12, 5, 0), RangeError);
    });

    it('throws RangeError when nth occurrence does not exist (6th occurrence)', () => {
        // No month has 6 occurrences of the same weekday
        assert.throws(() => JalaliDate.fromNthWeekdayOfMonth(1403, 1, 6, 6), RangeError);
    });

    it('throws RangeError when negative nth occurrence does not exist', () => {
        // Try to get 5th-to-last in a short month (29 days, max 4-5 of any weekday)
        assert.throws(() => JalaliDate.fromNthWeekdayOfMonth(1402, 12, -6, 3), RangeError);
    });

    it('throws RangeError for invalid dayOfWeek < 0', () => {
        assert.throws(() => JalaliDate.fromNthWeekdayOfMonth(1403, 1, 1, -1), RangeError);
    });

    it('throws RangeError for invalid dayOfWeek > 6', () => {
        assert.throws(() => JalaliDate.fromNthWeekdayOfMonth(1403, 1, 1, 7), RangeError);
    });

    it('throws RangeError for invalid year', () => {
        assert.throws(() => JalaliDate.fromNthWeekdayOfMonth(0, 1, 1, 3), RangeError);
    });

    it('throws RangeError for invalid month', () => {
        assert.throws(() => JalaliDate.fromNthWeekdayOfMonth(1403, 13, 1, 3), RangeError);
    });

    // All weekdays test
    it('works for all days of the week', () => {
        for (let dow = 0; dow <= 6; dow++) {
            const d = JalaliDate.fromNthWeekdayOfMonth(1403, 6, 1, dow);
            assert.equal(d.dayOfWeek, dow);
            assert.equal(d.month, 6);
        }
    });

    // All months test
    it('works for all months', () => {
        for (let month = 1; month <= 12; month++) {
            const d = JalaliDate.fromNthWeekdayOfMonth(1403, month, 1, 3);
            assert.equal(d.month, month);
            assert.equal(d.dayOfWeek, 3);
        }
    });

    // Leap year test
    it('works correctly in leap year Esfand', () => {
        // 1403 is a leap year, Esfand has 30 days
        const d = JalaliDate.fromNthWeekdayOfMonth(1403, 12, -1, 5);
        assert.equal(d.year, 1403);
        assert.equal(d.month, 12);
        assert.ok(d.day <= 30);
    });

    // Common year test
    it('works correctly in common year Esfand', () => {
        // 1402 is a common year, Esfand has 29 days
        const d = JalaliDate.fromNthWeekdayOfMonth(1402, 12, -1, 2);
        assert.equal(d.year, 1402);
        assert.equal(d.month, 12);
        assert.ok(d.day <= 29);
    });

    // Consistency between positive and negative nth
    it('first and last produce different dates when month has 5 occurrences', () => {
        // In a month with 5 Saturdays, first != last
        const first = JalaliDate.fromNthWeekdayOfMonth(1403, 1, 1, 6);
        const last = JalaliDate.fromNthWeekdayOfMonth(1403, 1, -1, 6);
        assert.ok(!first.equals(last));
        assert.ok(last.day > first.day);
    });

    it('first and last produce same date when month has only 4 occurrences and checking 4th/-1', () => {
        // Find a weekday that appears exactly 4 times in the month
        // For a 30 or 31 day month, some weekdays appear 4 times, some 5 times
        let found = false;
        for (let month = 1; month <= 12; month++) {
            for (let dow = 0; dow <= 6; dow++) {
                try {
                    const fourth = JalaliDate.fromNthWeekdayOfMonth(1403, month, 4, dow);
                    try {
                        // If 5th doesn't exist, then 4th === last
                        JalaliDate.fromNthWeekdayOfMonth(1403, month, 5, dow);
                    } catch {
                        // 5th doesn't exist, so 4th should equal -1
                        const last = JalaliDate.fromNthWeekdayOfMonth(1403, month, -1, dow);
                        assert.ok(fourth.equals(last),
                            `4th and last should be same for dow ${dow} in month ${month}`);
                        found = true;
                        break;
                    }
                } catch {
                    // This weekday doesn't have 4 occurrences
                    continue;
                }
            }
            if (found) break;
        }
        assert.ok(found, 'Should find at least one case where 4th === last');
    });

    // Negative years
    it('works for negative years', () => {
        const d = JalaliDate.fromNthWeekdayOfMonth(-100, 6, 2, 4);
        assert.equal(d.year, -100);
        assert.equal(d.month, 6);
        assert.equal(d.dayOfWeek, 4);
    });

    // Practical examples
    it('example: second Tuesday of Ordibehesht 1405', () => {
        const d = JalaliDate.fromNthWeekdayOfMonth(1405, 2, 2, 2);
        assert.equal(d.dayOfWeek, 2);
        assert.equal(d.month, 2);
        assert.equal(d.year, 1405);
    });

    it('example: last Friday of Esfand 1404', () => {
        const d = JalaliDate.fromNthWeekdayOfMonth(1404, 12, -1, 5);
        assert.equal(d.dayOfWeek, 5);
        assert.equal(d.month, 12);
        assert.equal(d.year, 1404);
    });

    it('example: first Saturday of Farvardin 1404', () => {
        const d = JalaliDate.fromNthWeekdayOfMonth(1404, 1, 1, 6);
        assert.equal(d.dayOfWeek, 6);
        assert.equal(d.month, 1);
        assert.equal(d.year, 1404);
    });
});

