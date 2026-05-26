/**
 * Functions for working with the proleptic Gregorian calendar.
 *
 * The proleptic Gregorian calendar extends the Gregorian calendar backward to dates
 * before its introduction in 1582. It uses the same leap year rules and month lengths
 * as the modern Gregorian calendar, but allows for negative years (BCE) and does not
 * have a year zero.
 */

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
