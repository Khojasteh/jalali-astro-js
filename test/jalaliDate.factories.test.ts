/**
 * Tests for JalaliDate factory methods.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { gregorianToJDN } from '../src/julianDay.ts';
import { DayOfWeek, JalaliDate, Occurrence } from '../src/jalaliDate.ts';

describe('JalaliDate.fromDate', () => {
    it('uses Tehran civil date, not UTC civil date', () => {
        const date1 = JalaliDate.fromDate(new Date('2024-03-19T20:29:59Z'));
        assert.deepEqual(date1.toObject(), { year: 1402, month: 12, day: 29 });

        const date2 = JalaliDate.fromDate(new Date('2024-03-19T20:30:00Z'));
        assert.deepEqual(date2.toObject(), { year: 1403, month: 1, day: 1 });
    });

    it('maps the Unix epoch using Tehran civil time', () => {
        assert.deepEqual(
            JalaliDate.fromDate(new Date(0)).toGregorian(),
            { year: 1970, month: 1, day: 1 }
        );
    });

    it('rejects invalid Date values', () => {
        assert.throws(() => JalaliDate.fromDate(new Date(Number.NaN)), RangeError);
    });
});

describe('JalaliDate.fromUnixTime', () => {
    it('uses Tehran civil date, not UTC civil date', () => {
        const unixTime1 = Date.parse('2024-03-19T20:29:59Z');
        const date1 = JalaliDate.fromUnixTime(unixTime1);
        assert.deepEqual(date1.toObject(), { year: 1402, month: 12, day: 29 });

        const unixTime2 = Date.parse('2024-03-19T20:30:00Z');
        const date2 = JalaliDate.fromUnixTime(unixTime2);
        assert.deepEqual(date2.toObject(), { year: 1403, month: 1, day: 1 });
    });

    it('maps the Unix epoch using Tehran civil time', () => {
        assert.deepEqual(
            JalaliDate.fromUnixTime(0).toGregorian(),
            { year: 1970, month: 1, day: 1 }
        );
    });
});

describe('JalaliDate.fromJDN', () => {
    it('creates Nowruz 1403 from the Gregorian JDN for 2024-03-20', () => {
        const jdn = gregorianToJDN(2024, 3, 20);
        const date = JalaliDate.fromJDN(jdn);
        assert.deepEqual(date.toObject(), { year: 1403, month: 1, day: 1 });
    });

    it('round-trips the jdn property across representative dates including the no-year-zero boundary', () => {
        const lastDayOfYearMinusOne = JalaliDate.daysInMonth(-1, 12);
        const samples = [
            new JalaliDate(1402, 1, 1),
            new JalaliDate(1403, 12, 30),
            new JalaliDate(1, 1, 1),
            new JalaliDate(-1, 12, lastDayOfYearMinusOne),
            new JalaliDate(-100, 6, 15),
        ];

        for (const original of samples) {
            const roundTripped = JalaliDate.fromJDN(original.jdn);

            assert.ok(
                roundTripped.equals(original),
                `Expected ${original}, got ${roundTripped}`
            );
        }
    });

    it('rejects non-integer or non-finite JDN values', () => {
        for (const jdn of [2451545.5, NaN, Infinity, -Infinity]) {
            assert.throws(
                () => JalaliDate.fromJDN(jdn),
                RangeError,
                `Expected JalaliDate.fromJDN(${jdn}) to throw`
            );
        }
    });

    it('rejects JDNs outside the supported Jalali range', () => {
        const min = new JalaliDate(JalaliDate.MIN_YEAR, 1, 1).jdn;
        assert.throws(
            () => JalaliDate.fromJDN(min - 1),
            RangeError,
            `Expected JalaliDate.fromJDN(${min - 1}) to throw`
        );

        const max = new JalaliDate(JalaliDate.MAX_YEAR, 12, 29).jdn;
        assert.throws(
            () => JalaliDate.fromJDN(max + 1),
            RangeError,
            `Expected JalaliDate.fromJDN(${max + 1}) to throw`
        );
    });
});

describe('JalaliDate.fromGregorian', () => {
    const knownDates: Array<{
        gregorian: [number, number, number];
        jalali: [number, number, number];
    }> = [
            { gregorian: [2023, 3, 21], jalali: [1402, 1, 1] },
            { gregorian: [2024, 2, 29], jalali: [1402, 12, 10] },
            { gregorian: [2024, 3, 19], jalali: [1402, 12, 29] },
            { gregorian: [2024, 3, 20], jalali: [1403, 1, 1] },
            { gregorian: [2025, 3, 20], jalali: [1403, 12, 30] },
            { gregorian: [2025, 3, 21], jalali: [1404, 1, 1] },
            { gregorian: [2026, 5, 2], jalali: [1405, 2, 12] },
        ];

    for (const { gregorian, jalali } of knownDates) {
        const [gYear, gMonth, gDay] = gregorian;
        const [year, month, day] = jalali;

        it(`converts Gregorian ${gYear}-${gMonth}-${gDay} to Jalali ${year}/${month}/${day}`, () => {
            const date = JalaliDate.fromGregorian(gYear, gMonth, gDay);
            assert.deepEqual(date.toObject(), { year, month, day });
        });
    }

    it('rejects invalid Gregorian dates', () => {
        const invalidDates: Array<[number, number, number]> = [
            [0, 1, 1],
            [2024, 0, 1],
            [2024, 13, 1],
            [2024, 1, 0],
            [2024, 1, 32],
            [2023, 2, 29],
            [2024, 2, 30],
            [2024, 4, 31],
        ];

        for (const [year, month, day] of invalidDates) {
            assert.throws(
                () => JalaliDate.fromGregorian(year, month, day),
                RangeError,
                `Expected JalaliDate.fromGregorian(${year}, ${month}, ${day}) to throw`
            );
        }
    });

    it('rejects Gregorian years outside the supported range', () => {
        assert.throws(
            () => JalaliDate.fromGregorian(JalaliDate.MIN_GREGORIAN_YEAR - 1, 1, 1),
            RangeError,
            `Expected JalaliDate.fromGregorian(${JalaliDate.MIN_GREGORIAN_YEAR - 1}, 1, 1) to throw`
        );

        assert.throws(
            () => JalaliDate.fromGregorian(JalaliDate.MAX_GREGORIAN_YEAR + 1, 1, 1),
            RangeError,
            `Expected JalaliDate.fromGregorian(${JalaliDate.MAX_GREGORIAN_YEAR + 1}, 1, 1) to throw`
        );
    });
});

describe('JalaliDate.fromIsoDateString', () => {
    it('parses Gregorian ISO date strings', () => {
        const date = JalaliDate.fromIsoDateString('2024-03-20');
        assert.deepEqual(date.toObject(), { year: 1403, month: 1, day: 1 });
    });

    it('round-trips toIsoDateString', () => {
        const original = new JalaliDate(1403, 12, 30);
        assert.ok(JalaliDate.fromIsoDateString(original.toIsoDateString()).equals(original));
    });

    it('rejects malformed or invalid ISO strings', () => {
        const invalid = [
            '',
            '2024/03/20',
            '24-03-20',
            '2024-3-20',
            '2024-03-2',
            '2024-02-30',
            '0000-01-01',
            '2024-03-20T00:00:00Z',
            '-0010-01-01',
        ];

        for (const input of invalid) {
            assert.throws(
                () => JalaliDate.fromIsoDateString(input),
                `Expected JalaliDate.fromIsoDateString('${input}') to throw`
            );
        }
    });
});

describe('JalaliDate.fromDayOfYear', () => {
    const cases: Array<[number, number, number, number]> = [
        [1402, 1, 1, 1],
        [1402, 31, 1, 31],
        [1402, 32, 2, 1],
        [1402, 186, 6, 31],
        [1402, 187, 7, 1],
        [1402, 365, 12, 29],
        [1403, 366, 12, 30],
    ];

    for (const [year, dayOfYear, month, day] of cases) {
        it(`creates ${year}/${month}/${day} from day ${dayOfYear}`, () => {
            const date = JalaliDate.fromDayOfYear(year, dayOfYear);
            assert.deepEqual(date.toObject(), { year, month, day });
        });
    }

    it('rejects invalid day-of-year values', () => {
        const cases: Array<[number, number]> = [
            [1402, 0],
            [1402, 366],
            [1403, 367],
            [0, 1],
            [1403, 1.5],
        ];

        for (const [year, dayOfYear] of cases) {
            assert.throws(
                () => JalaliDate.fromDayOfYear(year, dayOfYear),
                RangeError,
                `Expected JalaliDate.fromDayOfYear(${year}, ${dayOfYear}) to throw`
            );
        }
    });
});

describe('JalaliDate.fromWeekOfYear', () => {
    it('creates the start of week 1 for a year whose Nowruz is Wednesday', () => {
        const date = JalaliDate.fromWeekOfYear(1403, 1, DayOfWeek.Saturday);

        assert.deepEqual(date.toObject(), { year: 1402, month: 12, day: 26 });
        assert.equal(date.dayOfWeek, DayOfWeek.Saturday);
    });

    it('creates Nowruz 1403 from week 1 Wednesday', () => {
        const date = JalaliDate.fromWeekOfYear(1403, 1, DayOfWeek.Wednesday);
        assert.deepEqual(date.toObject(), { year: 1403, month: 1, day: 1 });
        assert.equal(date.dayOfWeek, DayOfWeek.Wednesday);
    });

    it('round-trips representative dates through weekOfYear/dayOfWeek', () => {
        const samples = [
            new JalaliDate(1403, 1, 1),
            new JalaliDate(1403, 1, 4),
            new JalaliDate(1403, 6, 15),
            new JalaliDate(1403, 12, 30),
        ];

        for (const original of samples) {
            const reconstructed = JalaliDate.fromWeekOfYear(
                original.year,
                original.weekOfYear,
                original.dayOfWeek
            );

            assert.ok(
                reconstructed.equals(original),
                `Expected ${original} to round-trip through weekOfYear/dayOfWeek`
            );
        }
    });

    it('rejects invalid week or day-of-week values', () => {
        const cases: Array<[number, number, number]> = [
            [1403, 0, 6],
            [1403, 54, 6],
            [1403, 1, -1],
            [1403, 1, 7],
            [0, 1, 6],
        ];

        for (const [year, weekOfYear, dayOfWeek] of cases) {
            assert.throws(
                () => JalaliDate.fromWeekOfYear(year, weekOfYear, dayOfWeek),
                RangeError,
                `Expected JalaliDate.fromWeekOfYear(${year}, ${weekOfYear}, ${dayOfWeek}) to throw`
            );
        }
    });
});

describe('JalaliDate.fromNthWeekdayOfMonth', () => {
    it('finds the first Saturday of Farvardin 1403', () => {
        const date = JalaliDate.fromNthWeekdayOfMonth(1403, 1, Occurrence.First, DayOfWeek.Saturday);
        assert.deepEqual(date.toObject(), { year: 1403, month: 1, day: 4 });
        assert.equal(date.dayOfWeek, DayOfWeek.Saturday);
    });

    it('finds the last Friday of Farvardin 1403', () => {
        const date = JalaliDate.fromNthWeekdayOfMonth(1403, 1, Occurrence.Last, DayOfWeek.Friday);
        assert.deepEqual(date.toObject(), { year: 1403, month: 1, day: 31 });
    });

    it('finds the second Wednesday of Mehr 1403', () => {
        const date = JalaliDate.fromNthWeekdayOfMonth(1403, 7, Occurrence.Second, DayOfWeek.Wednesday);
        assert.deepEqual(date.toObject(), { year: 1403, month: 7, day: 11 });
        assert.equal(date.dayOfWeek, DayOfWeek.Wednesday);
    });

    it('finds the first Saturday of Farvardin 1405', () => {
        const date = JalaliDate.fromNthWeekdayOfMonth(1405, 1, Occurrence.First, DayOfWeek.Saturday);
        assert.deepEqual(date.toObject(), { year: 1405, month: 1, day: 1 });
        assert.equal(date.dayOfWeek, DayOfWeek.Saturday);
    });

    it('finds the last Saturday of Farvardin 1405', () => {
        const date = JalaliDate.fromNthWeekdayOfMonth(1405, 1, Occurrence.Last, DayOfWeek.Saturday);
        assert.deepEqual(date.toObject(), { year: 1405, month: 1, day: 29 });
        assert.equal(date.dayOfWeek, DayOfWeek.Saturday);
    });

    it('finds the second Saturday of Mehr 1405', () => {
        const date = JalaliDate.fromNthWeekdayOfMonth(1405, 7, Occurrence.Second, DayOfWeek.Saturday);
        assert.deepEqual(date.toObject(), { year: 1405, month: 7, day: 11 });
        assert.equal(date.dayOfWeek, DayOfWeek.Saturday);
    });

    it('rejects invalid occurrence parameters', () => {
        const cases: Array<[number, number, number, number]> = [
            [1403, 1, 0, 6],
            [1403, 1, 6, 6],
            [1403, 1, -6, 6],
            [1403, 0, 1, 6],
            [1403, 1, 1, 7],
        ];

        for (const [year, month, occurrence, dayOfWeek] of cases) {
            assert.throws(
                () => JalaliDate.fromNthWeekdayOfMonth(year, month, occurrence, dayOfWeek),
                RangeError,
                `Expected JalaliDate.fromNthWeekdayOfMonth(${year}, ${month}, ${occurrence}, ${dayOfWeek}) to throw`
            );
        }
    });
});
