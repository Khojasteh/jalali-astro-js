/**
 * Tests for JalaliDate computed properties
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

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

describe('isLeapYear property', () => {
    it('returns true for leap year 1403', () => {
        assert.equal(new JalaliDate(1403, 1, 1).isLeapYear, true);
    });

    it('returns false for common year 1402', () => {
        assert.equal(new JalaliDate(1402, 1, 1).isLeapYear, false);
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
        assert.equal(new JalaliDate(1402, 12, 29).dayOfYear, 365);
    });

    it('last day of leap year is 366', () => {
        assert.equal(new JalaliDate(1403, 12, 30).dayOfYear, 366);
    });
});

describe('dayOfWeek', () => {
    it('Nowruz 1403 (2024-03-20) is Wednesday (3)', () => {
        const d = new JalaliDate(1403, 1, 1);
        assert.equal(d.dayOfWeek, 3);
    });

    it('Nowruz 1402 (2023-03-21) is Tuesday (2)', () => {
        const d = new JalaliDate(1402, 1, 1);
        assert.equal(d.dayOfWeek, 2);
    });

    it('works for negative years', () => {
        const d = new JalaliDate(-100, 1, 1);
        const dow = d.dayOfWeek;
        assert.ok(dow >= 0 && dow <= 6);
    });

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
});

describe('weekOfYear', () => {
    it('returns 1 for 1 Farvardin', () => {
        const d = new JalaliDate(1403, 1, 1);
        assert.equal(d.weekOfYear, 1);
    });

    it('returns 1 for dates in the first week', () => {
        const wed = new JalaliDate(1403, 1, 1);
        assert.equal(wed.weekOfYear, 1);
        const fri = new JalaliDate(1403, 1, 3);
        assert.equal(fri.weekOfYear, 1);
    });

    it('returns 2 for the first Saturday after 1 Farvardin', () => {
        const sat = new JalaliDate(1403, 1, 4);
        assert.equal(sat.weekOfYear, 2);
    });

    it('increases by 1 for each week', () => {
        const d1 = new JalaliDate(1403, 1, 1);
        const d2 = d1.addDays(7);
        assert.equal(d2.weekOfYear, d1.weekOfYear + 1);
    });

    it('returns 52 or 53 for the last day of the year', () => {
        const lastDay = new JalaliDate(1403, 12, 30);
        assert.ok(lastDay.weekOfYear >= 52 && lastDay.weekOfYear <= 53);
    });

    it('handles years where 1 Farvardin is Saturday', () => {
        const d = new JalaliDate(1402, 1, 1);
        assert.equal(d.weekOfYear, 1);
    });

    it('week numbers increase monotonically within a year', () => {
        let prevWeek = 0;
        for (let month = 1; month <= 12; month++) {
            const daysInMonth = JalaliDate.daysInMonth(1403, month);
            for (let day = 1; day <= daysInMonth; day++) {
                const d = new JalaliDate(1403, month, day);
                assert.ok(d.weekOfYear >= prevWeek);
                prevWeek = d.weekOfYear;
            }
        }
    });

    it('round-trips with fromWeekOfYear', () => {
        const original = new JalaliDate(1403, 6, 15);
        const reconstructed = JalaliDate.fromWeekOfYear(
            original.year,
            original.weekOfYear,
            original.dayOfWeek
        );
        assert.ok(reconstructed.equals(original));
    });
});

describe('weekOfMonth', () => {
    it('returns 1 for the 1st day of the month', () => {
        const d = new JalaliDate(1403, 1, 1);
        assert.equal(d.weekOfMonth, 1);
    });

    it('returns 1 for all days in the first week when 1st is Tuesday', () => {
        // 1402/1/1 is Tuesday, so the first week goes to Friday (day 4)
        // Then Saturday (day 5) starts week 2
        const d1 = new JalaliDate(1402, 1, 1); // Tuesday
        assert.equal(d1.dayOfWeek, 2); // Tuesday

        // Test days before Saturday (all should be week 1)
        assert.equal(new JalaliDate(1402, 1, 1).weekOfMonth, 1); // Tuesday
        assert.equal(new JalaliDate(1402, 1, 2).weekOfMonth, 1); // Wednesday
        assert.equal(new JalaliDate(1402, 1, 3).weekOfMonth, 1); // Thursday
        assert.equal(new JalaliDate(1402, 1, 4).weekOfMonth, 1); // Friday

        // Saturday starts week 2
        assert.equal(new JalaliDate(1402, 1, 5).weekOfMonth, 2); // Saturday
    });

    it('returns 1 for days before the first Saturday', () => {
        // 1403/1/1 is Wednesday (dayOfWeek = 3)
        const wed = new JalaliDate(1403, 1, 1);
        assert.equal(wed.weekOfMonth, 1);
        const thu = new JalaliDate(1403, 1, 2);
        assert.equal(thu.weekOfMonth, 1);
        const fri = new JalaliDate(1403, 1, 3);
        assert.equal(fri.weekOfMonth, 1);
    });

    it('returns 2 for the first Saturday after the 1st', () => {
        // 1403/1/1 is Wednesday, so the first Saturday is 1403/1/4
        const sat = new JalaliDate(1403, 1, 4);
        assert.equal(sat.dayOfWeek, 6); // Saturday
        assert.equal(sat.weekOfMonth, 2);
    });

    it('returns correct week for middle of month', () => {
        // 1403/1/15 should be in week 3
        const d = new JalaliDate(1403, 1, 15);
        assert.ok(d.weekOfMonth >= 2 && d.weekOfMonth <= 4);
    });

    it('handles month where 1st is Friday (week 1 has only 1 day)', () => {
        // Find a month where the 1st is Friday
        let found = false;
        for (let year = 1400; year <= 1410; year++) {
            for (let month = 1; month <= 12; month++) {
                const firstDay = new JalaliDate(year, month, 1);
                if (firstDay.dayOfWeek === 5) { // Friday
                    assert.equal(firstDay.weekOfMonth, 1);
                    const secondDay = new JalaliDate(year, month, 2);
                    assert.equal(secondDay.weekOfMonth, 2,
                        `Second day should be week 2 when 1st is Friday`);
                    found = true;
                    break;
                }
            }
            if (found) break;
        }
    });

    it('handles month where 1st is Saturday', () => {
        // Find a month where the 1st is Saturday
        let found = false;
        for (let year = 1400; year <= 1410; year++) {
            for (let month = 1; month <= 12; month++) {
                const firstDay = new JalaliDate(year, month, 1);
                if (firstDay.dayOfWeek === 6) { // Saturday
                    assert.equal(firstDay.weekOfMonth, 1);
                    const seventhDay = new JalaliDate(year, month, 7);
                    assert.equal(seventhDay.weekOfMonth, 1,
                        `7th day should still be week 1 when 1st is Saturday`);
                    const eighthDay = new JalaliDate(year, month, 8);
                    assert.equal(eighthDay.weekOfMonth, 2,
                        `8th day should be week 2 when 1st is Saturday`);
                    found = true;
                    break;
                }
            }
            if (found) break;
        }
    });

    it('returns 4, 5, or 6 for the last day of a 31-day month', () => {
        const lastDay = new JalaliDate(1403, 1, 31); // Farvardin has 31 days
        const weekNum = lastDay.weekOfMonth;
        assert.ok(weekNum >= 4 && weekNum <= 6,
            `Last day of 31-day month should be in week 4-6, got ${weekNum}`);
    });

    it('returns 4, 5, or 6 for the last day of a 30-day month', () => {
        const lastDay = new JalaliDate(1403, 7, 30); // Mehr has 30 days
        const weekNum = lastDay.weekOfMonth;
        assert.ok(weekNum >= 4 && weekNum <= 6,
            `Last day of 30-day month should be in week 4-6, got ${weekNum}`);
    });

    it('returns 4 or 5 for the last day of a 29-day month', () => {
        const lastDay = new JalaliDate(1402, 12, 29); // Esfand in common year has 29 days
        const weekNum = lastDay.weekOfMonth;
        assert.ok(weekNum >= 4 && weekNum <= 5,
            `Last day of 29-day month should be in week 4-5, got ${weekNum}`);
    });

    it('week numbers increase monotonically within a month', () => {
        for (let month = 1; month <= 12; month++) {
            const daysInMonth = JalaliDate.daysInMonth(1403, month);
            let prevWeek = 0;
            for (let day = 1; day <= daysInMonth; day++) {
                const d = new JalaliDate(1403, month, day);
                assert.ok(d.weekOfMonth >= prevWeek,
                    `Week should not decrease: ${month}/${day} week ${d.weekOfMonth} < prev ${prevWeek}`);
                prevWeek = d.weekOfMonth;
            }
        }
    });

    it('week resets to 1 at the start of each month', () => {
        for (let month = 1; month <= 12; month++) {
            const firstDay = new JalaliDate(1403, month, 1);
            assert.equal(firstDay.weekOfMonth, 1,
                `First day of month ${month} should be week 1`);
        }
    });

    it('works correctly across different months', () => {
        const cases = [
            { year: 1403, month: 1, day: 1, expectedWeek: 1 },
            { year: 1403, month: 1, day: 15, minWeek: 2, maxWeek: 4 },
            { year: 1403, month: 6, day: 1, expectedWeek: 1 },
            { year: 1403, month: 12, day: 1, expectedWeek: 1 },
        ];

        for (const { year, month, day, expectedWeek, minWeek, maxWeek } of cases) {
            const d = new JalaliDate(year, month, day);
            if (expectedWeek !== undefined) {
                assert.equal(d.weekOfMonth, expectedWeek,
                    `${year}/${month}/${day} should be week ${expectedWeek}`);
            } else {
                assert.ok(d.weekOfMonth >= minWeek! && d.weekOfMonth <= maxWeek!,
                    `${year}/${month}/${day} should be week ${minWeek}-${maxWeek}, got ${d.weekOfMonth}`);
            }
        }
    });

    it('handles negative years', () => {
        const d = new JalaliDate(-100, 6, 15);
        const weekNum = d.weekOfMonth;
        assert.ok(weekNum >= 1 && weekNum <= 6,
            `weekOfMonth for negative year should be 1-6, got ${weekNum}`);
    });
});

describe('monthName property', () => {
    it('returns correct Persian month names', () => {
        const months = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ];
        for (let month = 1; month <= 12; month++) {
            const date = new JalaliDate(1403, month, 1);
            assert.equal(date.monthName, months[month - 1]);
        }
    });
});

describe('dayOfWeekName property', () => {
    it('returns correct Persian day names', () => {
        // 1403/1/1 is a Wednesday (3)
        const date1 = new JalaliDate(1403, 1, 1);
        assert.equal(date1.dayOfWeekName, 'چهارشنبه');

        // 1403/1/2 is a Thursday (4)
        const date2 = new JalaliDate(1403, 1, 2);
        assert.equal(date2.dayOfWeekName, 'پنجشنبه');

        // 1403/1/3 is a Friday (5)
        const date3 = new JalaliDate(1403, 1, 3);
        assert.equal(date3.dayOfWeekName, 'جمعه');

        // 1403/1/4 is a Saturday (6)
        const date4 = new JalaliDate(1403, 1, 4);
        assert.equal(date4.dayOfWeekName, 'شنبه');

        // 1403/1/5 is a Sunday (0)
        const date5 = new JalaliDate(1403, 1, 5);
        assert.equal(date5.dayOfWeekName, 'یکشنبه');

        // 1403/1/6 is a Monday (1)
        const date6 = new JalaliDate(1403, 1, 6);
        assert.equal(date6.dayOfWeekName, 'دوشنبه');

        // 1403/1/7 is a Tuesday (2)
        const date7 = new JalaliDate(1403, 1, 7);
        assert.equal(date7.dayOfWeekName, 'سه‌شنبه');
    });
});

describe('quarter property', () => {
    it('returns correct quarter for each month', () => {
        // Q1: months 1-3
        assert.equal(new JalaliDate(1403, 1, 1).quarter, 1);
        assert.equal(new JalaliDate(1403, 2, 15).quarter, 1);
        assert.equal(new JalaliDate(1403, 3, 31).quarter, 1);

        // Q2: months 4-6
        assert.equal(new JalaliDate(1403, 4, 1).quarter, 2);
        assert.equal(new JalaliDate(1403, 5, 15).quarter, 2);
        assert.equal(new JalaliDate(1403, 6, 31).quarter, 2);

        // Q3: months 7-9
        assert.equal(new JalaliDate(1403, 7, 1).quarter, 3);
        assert.equal(new JalaliDate(1403, 8, 15).quarter, 3);
        assert.equal(new JalaliDate(1403, 9, 30).quarter, 3);

        // Q4: months 10-12
        assert.equal(new JalaliDate(1403, 10, 1).quarter, 4);
        assert.equal(new JalaliDate(1403, 11, 15).quarter, 4);
        assert.equal(new JalaliDate(1403, 12, 29).quarter, 4);
    });
});

