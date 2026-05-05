/**
 * Conversions between proleptic Gregorian calendar dates and
 * Julian Day Numbers (JDN).
 *
 * A JDN is an integer — the Julian Day that begins at noon on a given civil day.
 * JDN 0 = 1 January 4713 BC (Julian), i.e. 24 November 4714 BC (proleptic Gregorian).
 *
 * These functions use the standard astronomical algorithm (Richards 2013 / Wikipedia).
 * No year zero: year −1 precedes year 1.
 */

import { toAstronomicalYear, toCalendarYear } from './yearUtils.js';

/**
 * Asserts that the given year is a valid non-zero integer for the proleptic Gregorian calendar.
 *
 * @param year - The year to validate.
 * @throws {RangeError} If the year is not a non-zero integer.
 */
function assertValidYear(year: number): asserts year is number {
    if (!Number.isInteger(year) || year === 0) {
        throw new RangeError('Year must be a non-zero integer in the proleptic Gregorian calendar.');
    }
}

/**
 * Asserts that the given month is a valid integer between 1 and 12.
 *
 * @param month - The month to validate.
 * @throws {RangeError} If the month is not an integer between 1 and 12.
 */
function assertValidMonth(month: number): asserts month is number {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new RangeError('Month must be an integer between 1 and 12.');
    }
}

/**
 * Converts a proleptic Gregorian date to its Julian Day Number.
 *
 * @param year  - Proleptic Gregorian year (year −1 = 1 BCE, no year 0).
 * @param month - Month (1 = January … 12 = December).
 * @param day   - Day of month (1-based).
 * @returns The Julian Day Number (integer) for the given date.
 * @throws {RangeError} If the year is zero or the month is out of range.
 */
export function gregorianToJDN(year: number, month: number, day: number): number {
    assertValidYear(year);
    assertValidMonth(month);

    const y0 = toAstronomicalYear(year);
    // Shift Jan/Feb into the previous year for the calculation
    const a = Math.floor((14 - month) / 12);
    const y = y0 + 4800 - a;
    const m = month + 12 * a - 3;
    return day
        + Math.floor((153 * m + 2) / 5)
        + 365 * y
        + Math.floor(y / 4)
        - Math.floor(y / 100)
        + Math.floor(y / 400)
        - 32045;
}

/**
 * Converts a Julian Day Number to a proleptic Gregorian date.
 *
 * @param jdn - Julian Day Number (integer).
 * @returns The corresponding proleptic Gregorian date as `{ year, month, day }`.
 *          The year is never 0; years before 1 CE are returned as negative numbers.
 */
export function gregorianFromJDN(jdn: number): { year: number; month: number; day: number } {
    const a = jdn + 32044;
    const b = Math.floor((4 * a + 3) / 146097);
    const c = a - Math.floor(146097 * b / 4);
    const d = Math.floor((4 * c + 3) / 1461);
    const e = c - Math.floor(1461 * d / 4);
    const m = Math.floor((5 * e + 2) / 153);

    const day = e - Math.floor((153 * m + 2) / 5) + 1;
    const month = m + 3 - 12 * Math.floor(m / 10);
    const rawYear = 100 * b + d - 4800 + Math.floor(m / 10);
    const year = toCalendarYear(rawYear);

    return { year, month, day };
}

/**
 * Returns the day of week for a given Julian Day Number.
 *
 * The value follows the JavaScript `Date` convention:
 * 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday.
 *
 * @param jdn - Julian Day Number (integer).
 * @returns Day of week (0 = Sunday … 6 = Saturday).
 */
export function dayOfWeekFromJDN(jdn: number): number {
    return (jdn + 1) % 7;
}

/**
 * Returns the number of days in a given month of the proleptic Gregorian calendar.
 *
 * @param year  - Proleptic Gregorian year (for leap year calculation).
 * @param month - Month (1 = January … 12 = December).
 * @returns Number of days in the month (28–31).
 * @throws {RangeError} If the year is zero or the month is out of range.
 */
export function gregorianDaysInMonth(year: number, month: number): number {
    assertValidYear(year);
    assertValidMonth(month);

    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return month === 2 && gregorianIsLeapYear(year) ? 29 : daysInMonth[month - 1]!;
}

/**
 * Returns true if the given proleptic Gregorian year is a leap year.
 *
 * @param year - Proleptic Gregorian year.
 * @returns `true` if the year is a leap year, `false` otherwise.
 * @throws {RangeError} If the year is zero.
 */
export function gregorianIsLeapYear(year: number): boolean {
    assertValidYear(year);

    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}
