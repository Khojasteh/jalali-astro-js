/**
 * Conversions between proleptic Gregorian calendar dates and Julian Day Numbers (JDN).
 *
 * A JDN is an integer — the Julian Day that begins at noon on a given civil day.
 * JDN 0 = 1 January 4713 BC (Julian), i.e. 24 November 4714 BC (proleptic Gregorian).
 *
 * These functions use the standard astronomical algorithm (Richards 2013 / Wikipedia).
 * No year zero: year −1 precedes year 1.
 */

import { toAstronomicalYear, toCalendarYear } from './yearNumbering.ts';

/**
 * Converts a proleptic Gregorian date to its Julian Day Number.
 *
 * The proleptic Gregorian calendar extends the Gregorian calendar backward to dates
 * before its introduction in 1582.
 *
 * This method does not account for the gap between the Julian and Gregorian calendars
 * that occurred in 1582 (and later in some regions).
 *
 * The method also does not validate the day of month against the month and year. An
 * invalid date (e.g. 31 February) will produce a JDN as if the calendar were extended
 * indefinitely, without any adjustments for month lengths or leap years.
 *
 * @param year  - Proleptic Gregorian year (year −1 = 1 BCE, no year 0).
 * @param month - Month (1 = January … 12 = December).
 * @param day   - Day of month (1-based).
 * @returns The Julian Day Number (integer) for the given date.
 * @throws RangeError if the year is not a non-zero integer, or if the month is not between 1 and 12, or if the day is not a positive integer.
 */
export function gregorianToJDN(year: number, month: number, day: number): number {
    if (!Number.isInteger(year) || year === 0) {
        throw new RangeError('Year must be a non-zero integer');
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new RangeError('Month must be between 1 and 12');
    }
    if (!Number.isInteger(day) || day < 1) {
        throw new RangeError('Day must be a positive integer');
    }

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
 * @throws RangeError if the JDN is not an integer.
 */
export function gregorianFromJDN(jdn: number): { year: number; month: number; day: number } {
    if (!Number.isInteger(jdn)) {
        throw new RangeError('Julian Day Number must be an integer');
    }

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
 * @throws RangeError if the JDN is not an integer.
 */
export function dayOfWeekFromJDN(jdn: number): number {
    if (!Number.isInteger(jdn)) {
        throw new RangeError('Julian Day Number must be an integer');
    }

    return ((jdn + 1) % 7 + 7) % 7;
}
