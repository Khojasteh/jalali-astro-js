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

/**
 * Converts a proleptic Gregorian date to its Julian Day Number.
 *
 * This is a low-level conversion function that does not validate inputs.
 * Invalid dates (e.g., year 0, month 13, or 2024-02-30) will produce
 * mathematically consistent JDN values as if the calendar were extended.
 *
 * @param year  - Proleptic Gregorian year (year −1 = 1 BCE, no year 0).
 * @param month - Month (1 = January … 12 = December).
 * @param day   - Day of month (1-based).
 * @returns The Julian Day Number (integer) for the given date.
 */
export function gregorianToJDN(year: number, month: number, day: number): number {
    // Convert from the "no year 0" convention (year -1 = 1 BCE) to astronomical
    // (year 0 = 1 BCE) as required by the Richards formula.  Year 0 does not
    // exist in the input; year -1 maps to astronomical 0, year -2 to -1, etc.
    const y0 = year <= 0 ? year + 1 : year;
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
    // Proleptic Gregorian has no year 0: skip from -1 to 1
    const year = rawYear <= 0 ? rawYear - 1 : rawYear;

    return { year, month, day };
}

/**
 * Returns the number of days in a given month of the proleptic Gregorian calendar.
 *
 * @param year  - Proleptic Gregorian year (for leap year calculation).
 * @param month - Month (1 = January … 12 = December).
 * @returns Number of days in the month (28–31).
 */
export function gregorianDaysInMonth(year: number, month: number): number {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return month === 2 && gregorianIsLeapYear(year) ? 29 : daysInMonth[month - 1]!;
}

/**
 * Returns true if the given proleptic Gregorian year is a leap year.
 *
 * @param year - Proleptic Gregorian year.
 * @returns `true` if the year is a leap year, `false` otherwise.
 */
export function gregorianIsLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}