/**
 * JalaliDate — an immutable value object representing a Jalali date.
 *
 * Instances are created via the constructor or static factory methods.
 *
 * Supported year range: {@link JalaliDate.MIN_YEAR} to {@link JalaliDate.MAX_YEAR}
 * (Gregorian: {@link JalaliDate.MIN_GREGORIAN_YEAR} to {@link JalaliDate.MAX_GREGORIAN_YEAR}).
 */

import { vernalEquinoxJD, MEEUS_MIN_YEAR, MEEUS_MAX_YEAR } from './astronomy.ts';
import { gregorianToJDN, gregorianFromJDN, dayOfWeekFromJDN } from './julianDay.ts';
import { toAstronomicalYear, toCalendarYear, jalaliToGregorianYear, gregorianToJalaliYear, expandTwoDigitYear } from './yearNumbering.ts';
import { compilePattern, getFormatSegments, type CalendarSystem, type FormatToken } from './datePattern.ts';
import { formatInteger, parseInteger } from './persianNumbers.ts';
import { gregorianDaysInMonth } from './gregorianRules.ts';
import { nowruzJDN } from './nowruz.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * Day of week enumeration following the JavaScript Date convention.
 */
export enum DayOfWeek {
    Sunday = 0,
    Monday = 1,
    Tuesday = 2,
    Wednesday = 3,
    Thursday = 4,
    Friday = 5,
    Saturday = 6
}

/**
 * Named constants for nth occurrence of a weekday in a month.
 */
export enum Occurrence {
    First = 1,
    Second = 2,
    Third = 3,
    Fourth = 4,
    Last = -1
}

/**
 * Named constants for Jalali calendar quarters.
 */
export enum Quarter {
    Spring = 1,
    Summer = 2,
    Autumn = 3,
    Winter = 4
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Julian Day Number of the Unix epoch (1970-01-01 at noon UTC).
 *
 * Used to convert between Julian Day Numbers and Unix timestamps.
 * JDN 2440587 corresponds to 1970-01-01; the fractional .5 shifts
 * the JD epoch (noon) to midnight.
 */
const UNIX_EPOCH_JD = 2440587.5;

/**
 * Number of milliseconds in a day.
 */
const MILLISECONDS_PER_DAY = 86400 * 1000;

/**
 * Mean length of a Jalali year in days.
 */
const MEAN_JALALI_YEAR_DAYS = 365.24219858156;

/**
 * Iran Standard Time offset in milliseconds (+03:30).
 */
const IRAN_OFFSET_MS = (3 * 60 + 30) * 60 * 1000;

/**
 * Names of the days of the week in Persian, following the JS Date convention:
 * 0=Sunday, 1=Monday, …, 6=Saturday.
 */
const DOW_NAMES_FA: ReadonlyArray<string> = [
    'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'
];

/**
 * Names of the Jalali quarters (seasons) in Persian.
 */
const SEASON_NAMES_FA: ReadonlyArray<string> = [
    'بهار', 'تابستان', 'پاییز', 'زمستان'
];

/**
 * Names of the Jalali months in Persian.
 */
const JALALI_MONTH_NAMES_FA: ReadonlyArray<string> = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

/**
 * Names of the Gregorian months in Persian.
 */
const GREGORIAN_MONTH_NAMES_FA: ReadonlyArray<string> = [
    'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'
];

/**
 * Bidirectional control characters that can appear around Persian/RTL text.
 */
const BIDI_CONTROLS = /[\u200E\u200F\u061C\u202A-\u202E]/g;

// ---------------------------------------------------------------------------
// Parse helpers
// ---------------------------------------------------------------------------

/**
 * Normalizes text before parsing.
 *
 * Depending on the provided flags, this helper can remove bidirectional control
 * characters and/or normalize whitespace. It is applied to both the input string
 * and the format pattern so they are compared under the same normalization rules.
 *
 * @param text - The input string or format pattern to normalize.
 * @param stripBidiControls - Whether to remove bidirectional control characters.
 * @param normalizeWhitespace - Whether to trim leading/trailing whitespace and collapse consecutive whitespace to a single space.
 * @returns The normalized text.
 */
function normalizeParseText(text: string, stripBidiControls: boolean, normalizeWhitespace: boolean): string {
    if (stripBidiControls) {
        text = text.replace(BIDI_CONTROLS, '');
    }
    if (normalizeWhitespace) {
        text = text.trim().replace(/\s+/g, ' ');
    }
    return text;
}

/**
 * Returns `next` unless a previous value exists and conflicts with it.
 *
 * Used to ensure that multiple tokens representing the same component do not
 * specify conflicting values in the parse pattern, which would indicate a
 * malformed pattern.
 *
 * @param componentName - The name of the date component for error messages.
 * @param previous - The previously parsed value for this component, or `undefined` if not yet set.
 * @param next - The newly parsed value for this component.
 * @returns `next` if `previous` is `undefined` or equal to `next`; otherwise, throws an error.
 * @throws {Error} If `previous` is defined and not equal to `next`, indicating a conflict in the pattern.
 */
function assignConsistentValue(componentName: string, previous: number | undefined, next: number): number {
    if (previous !== undefined && previous !== next) {
        throw new Error(`Conflicting ${componentName} values in parse pattern.`);
    }
    return next;
}

// ---------------------------------------------------------------------------
// Helper interfaces
// ---------------------------------------------------------------------------

/**
 * Represents the components of a date.
 */
export interface DateComponents {
    /**
     * Year component of the date.
     */
    year: number;

    /**
     * Month component of the date (1-based).
     */
    month: number;

    /**
     * Day of month component of the date (1-based).
     */
    day: number;
}

/**
 * Options for {@link JalaliDate.format}.
 */
export interface FormatOptions {
    /**
     * Controls Right-to-Left Mark (U+200F) insertion:
     * - `'never'`: Never add RLM (default).
     * - `'always'`: Always prepend RLM to the result.
     * - `'auto'`: Add RLM only when the result starts with a Persian digit.
     *
     * Default: `'never'`.
     */
    rlm?: 'never' | 'always' | 'auto';
}

/**
 * Options for {@link JalaliDate.parse}.
 */
export interface ParseOptions {
    /**
     * Preserves bidirectional control characters in both the input string and pattern.
     *
     * By default, bidirectional control characters such as RLM, LRM, ALM, and Unicode
     * embedding/override marks are removed before parsing. Set this option to `true`
     * when these characters are intentional and must be matched exactly.
     *
     * Default: `false`.
     */
    preserveBidiControls?: boolean;

    /**
     * Preserves whitespace exactly in both the input string and pattern.
     *
     * By default, leading/trailing whitespace is ignored and consecutive whitespace
     * characters are collapsed to a single space before parsing. Set this option to
     * `true` when whitespace is significant and must be matched exactly.
     *
     * Default: `false`.
     */
    preserveWhitespace?: boolean;

    /**
     * Skips validation of day-of-week names, quarter names, and scoped Gregorian tokens.
     *
     * By default, day-of-week names (`DDDD`), quarter names (`Q`), and tokens inside
     * `[gregorian:...]` blocks are checked against the parsed Jalali date.
     *
     * When this option is `true`, those parts must still match the pattern shape,
     * but their values are not checked against the parsed date.
     *
     * Default: `false`.
     */
    skipValidation?: boolean;
}

// ---------------------------------------------------------------------------
// JalaliDate class
// ---------------------------------------------------------------------------

/**
 * Immutable value object representing a Jalali date.
 *
 * Instances can be created via the constructor or static factory methods.
 */
export class JalaliDate {
    // ---------------------------------------------------------------------------
    // Year range constants
    // ---------------------------------------------------------------------------

    /**
     * Minimum supported Gregorian year.
     */
    static readonly MIN_GREGORIAN_YEAR = MEEUS_MIN_YEAR;

    /**
     * Maximum supported Gregorian year.
     *
     * One less than MEEUS_MAX_YEAR to ensure that the days in the final Jalali year
     * are computable, since the algorithm relies on finding the next Nowruz JDN which
     * would be out of range for MEEUS_MAX_YEAR.
     */
    static readonly MAX_GREGORIAN_YEAR = MEEUS_MAX_YEAR - 1;

    /**
     * Minimum supported Jalali year.
     */
    static readonly MIN_YEAR = gregorianToJalaliYear(JalaliDate.MIN_GREGORIAN_YEAR);

    /**
     * Maximum supported Jalali year.
     */
    static readonly MAX_YEAR = gregorianToJalaliYear(JalaliDate.MAX_GREGORIAN_YEAR);

    // ---------------------------------------------------------------------------
    // Static test state
    // ---------------------------------------------------------------------------

    /**
     * Test-only override for methods that depend on today's date.
     */
    private static testToday: JalaliDate | null = null;

    // ---------------------------------------------------------------------------
    // Instance fields
    // ---------------------------------------------------------------------------

    /**
     * Jalali year.
     */
    readonly year: number;

    /**
     * Jalali Month (1 = Farvardin … 12 = Esfand).
     */
    readonly month: number;

    /**
     * Jalali day of month (1-based).
     */
    readonly day: number;

    // ---------------------------------------------------------------------------
    // Protected static helpers
    // ---------------------------------------------------------------------------

    /**
     * Throws `RangeError` if `year` is not in the supported Gregorian year range.
     *
     * @param year - Gregorian year to validate.
     * @throws {RangeError} If `year` is out of range or is 0.
     */
    protected static assertGregorianYearInRange(year: number): void {
        if (!Number.isInteger(year) || year === 0) {
            throw new RangeError('Year must be a non-zero integer in the Gregorian calendar.');
        }

        if (year < JalaliDate.MIN_GREGORIAN_YEAR || year > JalaliDate.MAX_GREGORIAN_YEAR) {
            throw new RangeError(
                `Gregorian year ${year} is out of supported range (${JalaliDate.MIN_GREGORIAN_YEAR}..-1 and 1..${JalaliDate.MAX_GREGORIAN_YEAR}).`
            );
        }
    }

    /**
     * Throws `RangeError` if `year` is not in the supported Jalali year range.
     *
     * @param year - Jalali year to validate.
     * @throws {RangeError} If `year` is out of range or is 0.
     */
    protected static assertJalaliYearInRange(year: number): void {
        if (!Number.isInteger(year) || year === 0) {
            throw new RangeError('Year must be a non-zero integer in the Jalali calendar.');
        }

        if (year < JalaliDate.MIN_YEAR || year > JalaliDate.MAX_YEAR) {
            throw new RangeError(
                `Jalali year ${year} is out of supported range (${JalaliDate.MIN_YEAR}..-1 and 1..${JalaliDate.MAX_YEAR}).`
            );
        }
    }

    /**
     * Throws `RangeError` if `month` is not in the range 1 to 12.
     *
     * @param month - Month number to validate.
     * @throws {RangeError} If `month` is not in the range 1 to 12.
     */
    protected static assertMonthInRange(month: number): void {
        if (!Number.isInteger(month) || month < 1 || month > 12) {
            throw new RangeError(`Month ${month} is out of valid range (1..12).`);
        }
    }

    /**
     * Throws `RangeError` if `day` is not in the range 1 to `maxDay`.
     *
     * @param day    - Day of month to validate.
     * @param maxDay - Inclusive upper bound (from {@link daysInMonth}).
     * @throws {RangeError} If `day` is not in the range 1 to `maxDay`.
     */
    protected static assertDayInRange(day: number, maxDay: number): void {
        if (!Number.isInteger(day) || day < 1 || day > maxDay) {
            throw new RangeError(`Day ${day} is out of valid range (1..${maxDay}).`);
        }
    }

    /**
     * Throws `RangeError` if `weekNumber` is not in the range 1 to 53.
     *
     * @param weekNumber - Week number to validate.
     * @throws {RangeError} If `weekNumber` is not an integer or out of range.
     */
    protected static assertWeekNumberInRange(weekNumber: number): void {
        if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 53) {
            throw new RangeError(`Week number ${weekNumber} is out of valid range (1..53).`);
        }
    }

    /**
     * Throws `RangeError` if `dayOfWeek` is not in the range 0 to 6.
     *
     * @param dayOfWeek - Day of week to validate (0 = Sunday, …, 6 = Saturday).
     * @throws {RangeError} If `dayOfWeek` is not an integer or out of range.
     */
    protected static assertDayOfWeekInRange(dayOfWeek: number): void {
        if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
            throw new RangeError(`Day of week ${dayOfWeek} is out of valid range (0..6).`);
        }
    }

    /**
     * Throws `RangeError` if `nth` is not a non-zero integer.
     *
     * @param nth - Occurrence number to validate. Cannot be 0.
     * @throws {RangeError} If `nth` is not a non-zero integer.
     */
    protected static assertNthInRange(nth: number): void {
        if (!Number.isInteger(nth) || nth === 0) {
            throw new RangeError('nth must be a non-zero integer.');
        }
    }

    /**
     * Returns the number of days from the start of the year to the start of
     * `month` (0-based).
     *
     * @param month - Month number (1-12).
     * @returns 0-based day offset to the first day of `month`.
     */
    protected static daysToMonth(month: number): number {
        return Math.min(month - 1, 6) + (month - 1) * 30;
    }

    /**
     * Finds the Jalali year that contains the given Julian Day Number (JDN).
     *
     * @param jdn - Julian Day Number to locate within a Jalali year.
     * @returns The Jalali year that contains `jdn`, or 0 if `jdn` is out of range.
     * @throws {RangeError} If `jdn` is not an integer.
     */
    protected static findYear(jdn: number): number {
        if (!Number.isInteger(jdn)) {
            throw new RangeError(`Julian Day Number must be an integer, got ${jdn}.`);
        }

        const minJDN = nowruzJDN(JalaliDate.MIN_YEAR);
        if (jdn < minJDN) {
            return 0;
        }

        const maxJDN = nowruzJDN(JalaliDate.MAX_YEAR + 1);
        if (jdn >= maxJDN) {
            return 0;
        }

        const minAstronomicalYear = toAstronomicalYear(JalaliDate.MIN_YEAR);
        const maxAstronomicalYear = toAstronomicalYear(JalaliDate.MAX_YEAR);

        // Approximate using the mean Jalali year length.
        let y = minAstronomicalYear + Math.trunc((jdn - minJDN) / MEAN_JALALI_YEAR_DAYS);

        // Clamp in case floating-point estimation lands just outside the range.
        if (y < minAstronomicalYear) {
            y = minAstronomicalYear;
        }
        if (y > maxAstronomicalYear) {
            y = maxAstronomicalYear;
        }

        // Adjust downward if the Nowruz of the estimated year is after the JDN.
        while (nowruzJDN(toCalendarYear(y)) > jdn) {
            --y;
        }

        // Adjust upward if the Nowruz of the next year is on or before the JDN.
        while (nowruzJDN(toCalendarYear(y + 1)) <= jdn) {
            ++y;
        }

        return toCalendarYear(y);
    }

    // ---------------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------------

    /**
     * Creates a JalaliDate from explicit Jalali year, month, and day.
     *
     * @param year  - Jalali year
     * @param month - Month of year (1 = Farvardin … 12 = Esfand).
     * @param day   - Day of month (1-based).
     * @throws {RangeError} If the parameters do not form a valid Jalali date or the year is out of supported range.
     */
    constructor(year: number, month: number, day: number) {
        JalaliDate.assertJalaliYearInRange(year);
        JalaliDate.assertMonthInRange(month);
        JalaliDate.assertDayInRange(day, JalaliDate.daysInMonth(year, month));

        this.year = year;
        this.month = month;
        this.day = day;
    }

    // ---------------------------------------------------------------------------
    // Static factories
    // ---------------------------------------------------------------------------

    /**
     * Returns today's Jalali date in Tehran time.
     *
     * @returns A `JalaliDate` representing the current civil date in Iran Standard Time.
     * @throws {RangeError} If the current date is outside the supported range for Jalali dates.
     */
    static today(): JalaliDate {
        return JalaliDate.testToday ?? JalaliDate.fromUnixTime(Date.now());
    }

    /**
     * Returns yesterday's Jalali date in Tehran time.
     *
     * @returns A `JalaliDate` representing yesterday's civil date in Iran Standard Time.
     * @throws {RangeError} If the resulting date is outside the supported range for Jalali dates.
     */
    static yesterday(): JalaliDate {
        return JalaliDate.today().addDays(-1);
    }

    /**
     * Returns tomorrow's Jalali date in Tehran time.
     * @returns A `JalaliDate` representing tomorrow's civil date in Iran Standard Time.
     * @throws {RangeError} If the resulting date is outside the supported range for Jalali dates.
     */
    static tomorrow(): JalaliDate {
        return JalaliDate.today().addDays(1);
    }

    /**
     * Creates a JalaliDate from a Julian Day Number.
     *
     * @param jdn - Julian Day Number (integer).
     * @returns The corresponding `JalaliDate` for the given JDN.
     * @throws {RangeError} If the resulting date is outside the supported range for Jalali dates.
     */
    static fromJDN(jdn: number): JalaliDate {
        const year = JalaliDate.findYear(jdn);
        if (year === 0) {
            throw new RangeError(
                `Julian Day Number ${jdn} is out of range for conversion to Jalali date.`
            );
        }

        const dayOfYear = jdn - nowruzJDN(year) + 1;
        return JalaliDate.fromDayOfYear(year, dayOfYear);
    }

    /**
     * Creates a JalaliDate from a Unix timestamp (milliseconds since 1970-01-01T00:00:00Z).
     *
     * @param unixTime - Unix timestamp in milliseconds.
     * @return The corresponding `JalaliDate` in Tehran civil time.
     * @throws {RangeError} If the resulting date is outside the supported range for Jalali dates.
     */
    static fromUnixTime(unixTime: number): JalaliDate {
        const jd = UNIX_EPOCH_JD + (unixTime + IRAN_OFFSET_MS) / MILLISECONDS_PER_DAY;
        const jdn = Math.floor(jd + 0.5);
        return JalaliDate.fromJDN(jdn);
    }

    /**
     * Creates a JalaliDate from a JavaScript `Date` object.
     *
     * The calendar date is determined by shifting the UTC instant to Tehran
     * civil time (UTC+03:30) and reading the resulting Gregorian date.
     *
     * @param date - A JavaScript `Date` object.
     * @returns The corresponding `JalaliDate` in Tehran civil time.
     * @throws {RangeError} If the resulting date is outside the supported range for Jalali dates.
     */
    static fromDate(date: Date): JalaliDate {
        return JalaliDate.fromUnixTime(date.getTime());
    }

    /**
     * Creates a JalaliDate from a year and day-of-year offset.
     *
     * @param year Jalali year
     * @param dayOfYear 1-based day of year (1 = 1 Farvardin)
     * @returns The corresponding `JalaliDate` for the given year and day-of-year.
     * @throws {RangeError} If the parameters do not form a valid Jalali date or the year is out of supported range.
     */
    static fromDayOfYear(year: number, dayOfYear: number): JalaliDate {
        JalaliDate.assertJalaliYearInRange(year);
        JalaliDate.assertDayInRange(dayOfYear, JalaliDate.daysInYear(year));

        const firstSixMonthDays = 6 * 31;
        const month = dayOfYear <= firstSixMonthDays
            ? Math.floor((dayOfYear - 1) / 31) + 1
            : Math.floor((dayOfYear - firstSixMonthDays - 1) / 30) + 6 + 1;
        const day = dayOfYear - JalaliDate.daysToMonth(month);
        return new JalaliDate(year, month, day);
    }

    /**
     * Creates a JalaliDate from a year, week number, and day of week.
     *
     * Week 1 is the week containing 1 Farvardin. Weeks start on Saturday (6) and end on Friday (5).
     *
     * @param year - Jalali year.
     * @param weekNumber - Week number (1-based, typically 1-52 or 1-53).
     * @param dayOfWeek - Day of week (0 = Sunday, …, 6 = Saturday). Can use {@link DayOfWeek} enum or a number.
     * @returns The corresponding `JalaliDate` for the given week and day.
     * @throws {RangeError} If the parameters are out of range or the resulting date is outside the supported range for Jalali dates.
     */
    static fromWeekOfYear(year: number, weekNumber: number, dayOfWeek: DayOfWeek | number): JalaliDate {
        JalaliDate.assertJalaliYearInRange(year);
        JalaliDate.assertWeekNumberInRange(weekNumber);
        JalaliDate.assertDayOfWeekInRange(dayOfWeek);

        // Get JDN of 1 Farvardin and find the Saturday of that week
        const firstDayJDN = nowruzJDN(year);
        const firstDayOfWeek = dayOfWeekFromJDN(firstDayJDN);
        const daysFromSaturday = (firstDayOfWeek - 6 + 7) % 7;
        const firstSaturday = firstDayJDN - daysFromSaturday;

        // Calculate the target date
        const daysOffset = (weekNumber - 1) * 7 + (dayOfWeek - 6 + 7) % 7;
        const targetJDN = firstSaturday + daysOffset;

        // Verify the resulting date is reasonable:
        // - Week 1 can extend into the previous year
        // - Week 52/53 can extend into the next year
        const nextYear = toCalendarYear(toAstronomicalYear(year) + 1);
        const lastDayJDN = nowruzJDN(nextYear) - 1;
        const lastDayOfWeek = dayOfWeekFromJDN(lastDayJDN);
        const daysToFriday = (5 - lastDayOfWeek + 7) % 7;
        const lastFriday = lastDayJDN + daysToFriday;

        if (targetJDN < firstSaturday || targetJDN > lastFriday) {
            throw new RangeError(
                `Week ${weekNumber}, day ${dayOfWeek} of year ${year} is out of range.`
            );
        }

        return JalaliDate.fromJDN(targetJDN);
    }

    /**
     * Creates a JalaliDate for the nth occurrence of a weekday within a specific month.
     *
     * Positive `nth` values count from the beginning of the month (1 = first occurrence, 2 = second, etc.).
     * Negative `nth` values count from the end of the month (-1 = last occurrence, -2 = second-to-last, etc.).
     *
     * @param year - Jalali year.
     * @param month - Month (1 = Farvardin … 12 = Esfand).
     * @param nth - Occurrence number. Positive for counting from start (1 = first, 2 = second, etc.),
     *              negative for counting from end (-1 = last, -2 = second-to-last, etc.). Cannot be 0.
     *              Can use {@link Occurrence} enum or a number.
     * @param dayOfWeek - Day of week (0 = Sunday, …, 6 = Saturday). Can use {@link DayOfWeek} enum or a number.
     * @returns The corresponding `JalaliDate` for the nth occurrence of the weekday in the month.
     * @throws {RangeError} If the parameters are out of range or if the specified occurrence does not exist in the month, or if the resulting date is outside the supported range for Jalali dates.
     */
    static fromNthWeekdayOfMonth(year: number, month: number, nth: Occurrence | number, dayOfWeek: DayOfWeek | number): JalaliDate {
        JalaliDate.assertJalaliYearInRange(year);
        JalaliDate.assertMonthInRange(month);
        JalaliDate.assertNthInRange(nth);
        JalaliDate.assertDayOfWeekInRange(dayOfWeek);

        const daysInMonth = JalaliDate.daysInMonth(year, month);
        const firstDayJDN = nowruzJDN(year) + JalaliDate.daysToMonth(month);

        let targetDay: number;

        if (nth > 0) {
            const firstDayOfWeek = dayOfWeekFromJDN(firstDayJDN);
            const daysToFirstOccurrence = (dayOfWeek - firstDayOfWeek + 7) % 7;
            targetDay = 1 + daysToFirstOccurrence + (nth - 1) * 7;

            if (targetDay > daysInMonth) {
                throw new RangeError(
                    `Occurrence ${nth} of day-of-week ${dayOfWeek} does not exist in month ${month} of year ${year}.`
                );
            }
        } else {
            const lastDayJDN = firstDayJDN + daysInMonth - 1;
            const lastDayOfWeek = dayOfWeekFromJDN(lastDayJDN);
            const daysToLastOccurrence = (lastDayOfWeek - dayOfWeek + 7) % 7;
            targetDay = daysInMonth - daysToLastOccurrence - (Math.abs(nth) - 1) * 7;

            if (targetDay < 1) {
                throw new RangeError(
                    `Occurrence ${Math.abs(nth)} from the end of day-of-week ${dayOfWeek} does not exist in month ${month} of year ${year}.`
                );
            }
        }

        return new JalaliDate(year, month, targetDay);
    }

    /**
     * Creates a JalaliDate from a Gregorian date.
     *
     * @param year  - Proleptic Gregorian year.
     * @param month - Gregorian month (1-12).
     * @param day   - Gregorian day of month (1-based).
     * @returns The corresponding Jalali date as a `JalaliDate`.
     * @throws {RangeError} If the Gregorian date is invalid, or if the resulting Jalali date is outside the supported range for Jalali dates.
     */
    static fromGregorian(year: number, month: number, day: number): JalaliDate {
        JalaliDate.assertGregorianYearInRange(year);
        JalaliDate.assertMonthInRange(month);
        JalaliDate.assertDayInRange(day, gregorianDaysInMonth(year, month));

        const jdn = gregorianToJDN(year, month, day);
        return JalaliDate.fromJDN(jdn);
    }

    /**
     * Creates a JalaliDate from an ISO 8601 date string in the format "YYYY-MM-DD".
     *
     * @param isoString - The Gregorian date string in "YYYY-MM-DD" format.
     * @returns The corresponding `JalaliDate` for the given Gregorian date string.
     * @throws {Error} If the input string is not in the correct format.
     * @throws {RangeError} if the Gregorian date is invalid, or if the resulting Jalali date is outside the supported range for Jalali dates.
     */
    static fromIsoDateString(isoString: string): JalaliDate {
        const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) {
            throw new Error(`Invalid ISO date string: "${isoString}". Expected format: "YYYY-MM-DD".`);
        }

        const [_, yyyy, mm, dd] = match;
        const year = parseInt(yyyy!, 10);
        const month = parseInt(mm!, 10);
        const day = parseInt(dd!, 10);
        return JalaliDate.fromGregorian(year, month, day);
    }

    /**
     * Parses a Jalali date string using the given format pattern.
     *
     * Tokens outside a scoped calendar block use the Jalali calendar. The same is
     * true inside an explicit `[jalali:...]` block. Gregorian components can be
     * included with a `[gregorian:...]` block.
     *
     * Jalali (block) tokens:
     * - `YY`: 2-digit Jalali year
     * - `YYYY`: Full Jalali year, zero-padded to 4 digits
     * - `M`: Jalali month number
     * - `MM`: Jalali month number, zero-padded to 2 digits
     * - `MMMM`: Full Jalali month name in Persian
     * - `D`: Jalali day of month
     * - `DD`: Jalali day of month, zero-padded to 2 digits
     * - `DDDD`: Full Persian day-of-week name, for validation only
     * - `Q`: Persian quarter/season name, for validation only
     *
     * Gregorian block tokens:
     * - `YY`: 2-digit Gregorian year, for validation only
     * - `YYYY`: Full Gregorian year, zero-padded to 4 digits, for validation only
     * - `M`: Gregorian month number, for validation only
     * - `MM`: Gregorian month number, zero-padded to 2 digits, for validation only
     * - `MMMM`: Full Gregorian month name in Persian, for validation only
     * - `D`: Gregorian day of month, for validation only
     * - `DD`: Gregorian day of month, zero-padded to 2 digits, for validation only
     * - `DDDD`: Full Persian day-of-week name, for validation only
     *
     * Parsing behavior:
     * - Persian-Indic digits are accepted alongside Latin digits.
     * - By default, bidirectional control characters are removed from both the input string
     *   and pattern. Use `preserveBidiControls` to keep them significant.
     * - By default, leading/trailing whitespace is ignored and consecutive whitespace is
     *   collapsed to a single space in both the input string and pattern. Use
     *   `preserveWhitespace` to require exact whitespace matching.
     * - Quoted text in single or double quotes is treated as literal text after the selected
     *   normalization rules have been applied.
     * - Jalali year/month/day tokens outside scoped blocks, and inside `[jalali:...]`
     *   blocks, construct the returned date.
     * - Day-of-week names, quarter names, and tokens inside `[gregorian:...]` blocks do not
     *   participate in constructing the Jalali date. By default, they are validated against
     *   the parsed date, unless `skipValidation` is set to `true`.
     *
     * @param str - Input string to parse.
     * @param pattern - Format pattern. Defaults to `'YYYY/M/D'`.
     * @param options - Optional parsing behavior. See {@link ParseOptions}.
     * @returns A `JalaliDate` parsed from the input string.
     * @throws {Error} If the pattern is malformed.
     * @throws {Error} If the input string does not match the pattern or contains conflicting values for the same component.
     * @throws {Error} If required Jalali date components cannot be extracted.
     * @throws {Error} If a day-of-week name, quarter name, or scoped Gregorian token does not match the parsed date.
     * @throws {RangeError} If the parsed Jalali date is outside the supported range or otherwise invalid.
     */
    static parse(str: string, pattern = 'YYYY/M/D', options?: ParseOptions): JalaliDate {
        const cleanStr = normalizeParseText(str, !options?.preserveBidiControls, !options?.preserveWhitespace);
        const cleanPattern = normalizeParseText(pattern, !options?.preserveBidiControls, !options?.preserveWhitespace);

        const { regex, captureGroups } = compilePattern(cleanPattern);

        const match = cleanStr.match(regex);
        if (!match) {
            throw new Error(`Failed to parse "${str}" with pattern "${pattern}".`);
        }

        let year: number | undefined;
        let month: number | undefined;
        let day: number | undefined;
        let dayOfWeekName: string | undefined;
        let quarterName: string | undefined;
        let gregorianYear: number | undefined;
        let gregorianMonth: number | undefined;
        let gregorianDay: number | undefined;

        for (let i = 0; i < captureGroups.length; i++) {
            const group = captureGroups[i];
            const value = match[i + 1];

            if (!group || !value) {
                continue;
            }

            switch (group.type) {
                case 'year':
                    if (group.calendar === 'gregorian') {
                        gregorianYear = assignConsistentValue(
                            'Gregorian year',
                            gregorianYear,
                            group.token === 'YY'
                                ? expandTwoDigitYear(parseInteger(value), JalaliDate.today().toGregorian().year)
                                : parseInteger(value)
                        );
                    } else {
                        year = assignConsistentValue(
                            'Jalali year',
                            year,
                            group.token === 'YY'
                                ? expandTwoDigitYear(parseInteger(value), JalaliDate.today().year)
                                : parseInteger(value)
                        );
                    }
                    break;
                case 'month':
                    if (group.calendar === 'gregorian') {
                        if (group.token === 'MMMM') {
                            const monthIndex = GREGORIAN_MONTH_NAMES_FA.indexOf(value);
                            if (monthIndex === -1) {
                                throw new Error(`Unrecognized Gregorian month name: "${value}".`);
                            }
                            gregorianMonth = assignConsistentValue('Gregorian month', gregorianMonth, monthIndex + 1);
                        } else {
                            gregorianMonth = assignConsistentValue('Gregorian month', gregorianMonth, parseInteger(value));
                        }
                    } else if (group.token === 'MMMM') {
                        const monthIndex = JALALI_MONTH_NAMES_FA.indexOf(value);
                        if (monthIndex === -1) {
                            throw new Error(`Unrecognized month name: "${value}".`);
                        }
                        month = assignConsistentValue('Jalali month', month, monthIndex + 1);
                    } else {
                        month = assignConsistentValue('Jalali month', month, parseInteger(value));
                    }
                    break;
                case 'day':
                    if (group.calendar === 'gregorian') {
                        gregorianDay = assignConsistentValue('Gregorian day', gregorianDay, parseInteger(value));
                    } else {
                        day = assignConsistentValue('Jalali day', day, parseInteger(value));
                    }
                    break;
                case 'dayOfWeek':
                    dayOfWeekName = value;
                    break;
                case 'quarter':
                    quarterName = value;
                    break;
            }
        }

        if (year === undefined || month === undefined || day === undefined) {
            throw new Error(`Failed to extract Jalali date components from "${str}" with pattern "${pattern}".`);
        }

        const parsed = new JalaliDate(year, month, day);

        if (options?.skipValidation) {
            return parsed;
        }

        if (dayOfWeekName !== undefined && dayOfWeekName !== parsed.dayOfWeekName) {
            throw new Error(`Day of week "${dayOfWeekName}" does not match the date ${parsed} (expected "${parsed.dayOfWeekName}").`);
        }

        if (quarterName !== undefined && quarterName !== parsed.quarterName) {
            throw new Error(`Quarter "${quarterName}" does not match the date ${parsed} (expected "${parsed.quarterName}").`);
        }

        if (gregorianYear !== undefined || gregorianMonth !== undefined || gregorianDay !== undefined) {
            const gregorian = parsed.toGregorian();

            if (gregorianYear !== undefined && gregorianYear !== gregorian.year) {
                throw new Error(`Gregorian year "${gregorianYear}" does not match the date ${parsed} (expected "${gregorian.year}").`);
            }

            if (gregorianMonth !== undefined && gregorianMonth !== gregorian.month) {
                throw new Error(`Gregorian month "${gregorianMonth}" does not match the date ${parsed} (expected "${gregorian.month}").`);
            }

            if (gregorianDay !== undefined && gregorianDay !== gregorian.day) {
                throw new Error(`Gregorian day "${gregorianDay}" does not match the date ${parsed} (expected "${gregorian.day}").`);
            }
        }

        return parsed;
    }

    // ---------------------------------------------------------------------------
    // Static utilities
    // ---------------------------------------------------------------------------

    /**
     * Returns `true` if the given year, month, and day form a valid Jalali date.
     *
     * @param year - Jalali year.
     * @param month - Month (1-12).
     * @param day - Day of month (1-based).
     * @returns `true` if the date is valid, `false` otherwise.
     */
    static isValidDate(year: number, month: number, day: number): boolean {
        try {
            JalaliDate.assertJalaliYearInRange(year);
            JalaliDate.assertMonthInRange(month);
            JalaliDate.assertDayInRange(day, JalaliDate.daysInMonth(year, month));
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Returns `true` when the given Jalali year is a leap year.
     *
     * @param year - Jalali year.
     * @returns `true` if `year` is a leap year, `false` otherwise.
     * @throws {RangeError} If `year` is outside the supported range or is 0.
     */
    static isLeapYear(year: number): boolean {
        return JalaliDate.daysInYear(year) === 366;
    }

    /**
     * Returns the number of days in the given month of the given Jalali year.
     *
     * @param year  - Jalali year.
     * @param month - Month number (1-12).
     * @returns Number of days in the month (29-31).
     * @throws {RangeError} If `year` is outside the supported range or is 0, or if `month` is not in the range 1-12.
     */
    static daysInMonth(year: number, month: number): number {
        JalaliDate.assertJalaliYearInRange(year);
        JalaliDate.assertMonthInRange(month);

        if (month <= 6) return 31;
        if (month <= 11) return 30;
        return JalaliDate.isLeapYear(year) ? 30 : 29;
    }

    /**
     * Returns the total number of days in the given Jalali year.
     *
     * @param year - Jalali year.
     * @returns Number of days in the year (365 or 366).
     * @throws {RangeError} If `year` is outside the supported range or is 0.
     */
    static daysInYear(year: number): number {
        JalaliDate.assertJalaliYearInRange(year);

        const nextYear = toCalendarYear(toAstronomicalYear(year) + 1);
        return nowruzJDN(nextYear) - nowruzJDN(year);
    }

    /**
     * Returns the time of the vernal equinox for the given Jalali year as a JavaScript `Date` in UTC.
     *
     * @param year - Jalali year.
     * @returns A JavaScript `Date` representing the UTC time of the vernal equinox for the given year,
     *          or null if the date is before the Unix epoch (1970-01-01) and cannot be represented as
     *          a JavaScript `Date`.
     * @throws {RangeError} If `year` is outside the supported range or is 0.
     */
    static vernalEquinox(year: number): Date | null {
        JalaliDate.assertJalaliYearInRange(year);

        const equinoxJD = vernalEquinoxJD(jalaliToGregorianYear(year));
        if (equinoxJD < UNIX_EPOCH_JD) {
            return null; // Cannot represent dates before 1970-01-01 in JavaScript Date
        }

        const unixTime = (equinoxJD - UNIX_EPOCH_JD) * MILLISECONDS_PER_DAY;
        return new Date(unixTime)
    }

    /**
     * Calculates the age in complete years from a birth date to a reference date.
     *
     * @param birthDate - The birth date.
     * @param referenceDate - The reference date for age calculation. Defaults to today.
     * @returns The age in complete years.
     */
    static age(birthDate: JalaliDate, referenceDate?: JalaliDate): number {
        const ref = referenceDate ?? JalaliDate.today();
        return birthDate.differenceInYears(ref);
    }

    // ---------------------------------------------------------------------------
    // Static test helpers
    // ---------------------------------------------------------------------------

    /**
     * Sets a fixed Jalali date for methods that depend on today's date.
     *
     * This method allows tests to override the current date returned by {@link today()},
     * {@link yesterday()}, and {@link tomorrow()} for deterministic testing.
     *
     * Passing `null` clears the override and restores the real current date.
     *
     * @param testToday - Fixed Jalali date to use as today, or `null` to clear it.
     */
    static setTestToday(testToday: JalaliDate | null): void {
        JalaliDate.testToday = testToday;
    }

    /**
     * Gets the currently set test date for "today", if any.
     *
     * @returns The fixed Jalali date set for testing, or `null` if no override is set.
     */
    static getTestToday(): JalaliDate | null {
        return JalaliDate.testToday;
    }

    // ---------------------------------------------------------------------------
    // Computed properties
    // ---------------------------------------------------------------------------

    /**
     * Julian Day Number for this date.
     */
    get jdn(): number {
        return nowruzJDN(this.year) + this.dayOfYear - 1;
    }

    /**
     * Week number of the year (1-based).
     *
     * Week 1 is the week containing 1 Farvardin. Weeks start on Saturday.
     * A year typically has 52 or 53 weeks.
     */
    get weekOfYear(): number {
        const firstDayJDN = nowruzJDN(this.year);
        const firstDayOfWeek = dayOfWeekFromJDN(firstDayJDN);
        const daysFromSaturday = (firstDayOfWeek - 6 + 7) % 7;
        const daysSinceFirstSaturday = this.dayOfYear - 1 + daysFromSaturday;
        return Math.floor(daysSinceFirstSaturday / 7) + 1;
    }

    /**
     * Week number of the month (1-based).
     *
     * Week 1 is the week containing the 1st day of the month. Weeks start on Saturday.
     * A month typically has 4, 5, or 6 weeks.
     */
    get weekOfMonth(): number {
        const firstDayJDN = nowruzJDN(this.year) + JalaliDate.daysToMonth(this.month);
        const firstDayOfWeek = dayOfWeekFromJDN(firstDayJDN);
        const daysFromSaturday = (firstDayOfWeek - 6 + 7) % 7;
        const daysSinceFirstSaturday = this.day - 1 + daysFromSaturday;
        return Math.floor(daysSinceFirstSaturday / 7) + 1;
    }

    /**
     * Day of the year (1-based, 1 = 1 Farvardin).
     */
    get dayOfYear(): number {
        return JalaliDate.daysToMonth(this.month) + this.day;
    }

    /**
     * Day of the week for this date.
     *
     * The value follows the JavaScript `Date` convention:
     * 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday.
     */
    get dayOfWeek(): number {
        return dayOfWeekFromJDN(this.jdn);
    }

    /**
     * Whether this year is a leap year.
     */
    get isLeapYear(): boolean {
        return JalaliDate.isLeapYear(this.year);
    }

    /**
     * Number of days in this month (29-31).
     */
    get daysInMonth(): number {
        return JalaliDate.daysInMonth(this.year, this.month);
    }

    /**
     * Number of days in this year (365 or 366).
     */
    get daysInYear(): number {
        return JalaliDate.daysInYear(this.year);
    }

    /**
     * Persian name of the day of week.
     *
     * @returns The Persian name of the day (e.g., 'شنبه', 'یکشنبه', etc.).
     */
    get dayOfWeekName(): string {
        return DOW_NAMES_FA[this.dayOfWeek]!;
    }

    /**
     * Persian name of the month.
     *
     * @returns The Persian name of the month (e.g., 'فروردین', 'اردیبهشت', etc.).
     */
    get monthName(): string {
        return JALALI_MONTH_NAMES_FA[this.month - 1]!;
    }

    /**
     * Quarter of the year (1-4).
     *
     * The quarters are defined as follows:
     * - Bahar (1): Farvardin, Ordibehesht, Khordad
     * - Tabestan (2): Tir, Mordad, Shahrivar
     * - Paeez (3): Mehr, Aban, Azar
     * - Zemestan (4): Dey, Bahman, Esfand
     */
    get quarter(): number {
        return Math.ceil(this.month / 3);
    }

    /**
     * Persian name of the quarter.
     *
     * @returns The Persian name of the quarter (e.g., 'بهار', 'تابستان', etc.).
     */
    get quarterName(): string {
        return SEASON_NAMES_FA[this.quarter - 1]!;
    }

    // ---------------------------------------------------------------------------
    // Conversion
    // ---------------------------------------------------------------------------

    /**
     * Returns the Jalali date as an array of `[year, month, day]`.
     *
     * @returns An array containing the year, month, and day of this Jalali date.
     */
    toArray(): [year: number, month: number, day: number] {
        return [this.year, this.month, this.day];
    }

    /**
     * Returns the Jalali date as a plain object.
     *
     * @returns Plain `{ year, month, day }` for this Jalali date.
     */
    toObject(): DateComponents {
        return { year: this.year, month: this.month, day: this.day };
    }

    /**
     * Returns the equivalent proleptic Gregorian date.
     *
     * @returns Plain `{ year, month, day }` in the proleptic Gregorian calendar.
     */
    toGregorian(): DateComponents {
        return gregorianFromJDN(this.jdn);
    }

    /**
     * Returns the equivalent Gregorian date as an ISO 8601 date string in "YYYY-MM-DD" format.
     *
     * @returns The ISO 8601 date string for the equivalent Gregorian date.
     */
    toIsoDateString(): string {
        const g = this.toGregorian();
        const year = g.year < 0
            ? '-' + (-g.year).toString().padStart(4, '0')
            : g.year.toString().padStart(4, '0');
        const month = g.month.toString().padStart(2, '0');
        const day = g.day.toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // ---------------------------------------------------------------------------
    // Arithmetic  (all return new JalaliDate instances)
    // ---------------------------------------------------------------------------

    /**
     * Returns a new JalaliDate offset by the given number of days.
     *
     * @param n - Number of days to add (may be negative).
     * @returns A new `JalaliDate` shifted by `n` days.
     * @throws {RangeError} If the resulting date is outside the supported range.
     */
    addDays(n: number): JalaliDate {
        return JalaliDate.fromJDN(this.jdn + n);
    }

    /**
     * Returns a new JalaliDate with the given number of months added.
     *
     * If the resulting month has fewer days than `this.day`, the day is clamped
     * to the last day of the resulting month.
     *
     * @param n - Number of months to add (may be negative).
     * @returns A new `JalaliDate` shifted by `n` months.
     * @throws {RangeError} If the resulting year is outside the supported range.
     */
    addMonths(n: number): JalaliDate {
        const astYear = toAstronomicalYear(this.year);
        const totalMonths = (astYear - 1) * 12 + (this.month - 1) + n;
        const newAstYear = Math.floor(totalMonths / 12) + 1;
        const newMonth = (totalMonths % 12 + 12) % 12 + 1;
        const newYear = toCalendarYear(newAstYear);
        const newDay = Math.min(this.day, JalaliDate.daysInMonth(newYear, newMonth));
        return new JalaliDate(newYear, newMonth, newDay);
    }

    /**
     * Returns a new JalaliDate with the given number of years added.
     *
     * If this is a leap day (Esfand 30) and the resulting year is not a leap year,
     * the day is clamped to the last day of the resulting year (Esfand 29).
     *
     * @param n - Number of years to add (may be negative).
     * @returns A new `JalaliDate` shifted by `n` years.
     * @throws {RangeError} If the resulting year is outside the supported range.
     */
    addYears(n: number): JalaliDate {
        const newYear = toCalendarYear(toAstronomicalYear(this.year) + n);
        const maxDay = JalaliDate.daysInMonth(newYear, this.month);
        return new JalaliDate(newYear, this.month, Math.min(this.day, maxDay));
    }

    // ---------------------------------------------------------------------------
    // Derived dates (all return new JalaliDate instances)
    // ---------------------------------------------------------------------------

    /**
     * Returns the first day of this date's year (1 Farvardin).
     *
     * @returns A new `JalaliDate` representing 1 Farvardin of this year.
     */
    startOfYear(): JalaliDate {
        return new JalaliDate(this.year, 1, 1);
    }

    /**
     * Returns the last day of this date's year (29 or 30 Esfand).
     *
     * @returns A new `JalaliDate` representing the last day of this year.
     */
    endOfYear(): JalaliDate {
        const lastDay = this.isLeapYear ? 30 : 29;
        return new JalaliDate(this.year, 12, lastDay);
    }

    /**
     * Returns the first day of this date's month.
     *
     * @returns A new `JalaliDate` representing the 1st day of this month.
     */
    startOfMonth(): JalaliDate {
        return new JalaliDate(this.year, this.month, 1);
    }

    /**
     * Returns the last day of this date's month.
     *
     * @returns A new `JalaliDate` representing the last day of this month.
     */
    endOfMonth(): JalaliDate {
        return new JalaliDate(this.year, this.month, this.daysInMonth);
    }

    /**
     * Returns the first day of the week containing this date.
     *
     * Weeks start on Saturday (the traditional first day of the week in Iran).
     *
     * @returns A new `JalaliDate` representing the start of the week (Saturday).
     * @throws {RangeError} If the resulting date is outside the supported range.
     */
    startOfWeek(): JalaliDate {
        const daysFromSaturday = (this.dayOfWeek - 6 + 7) % 7;
        return this.addDays(-daysFromSaturday);
    }

    /**
     * Returns the last day of the week containing this date.
     *
     * Weeks end on Friday (the traditional last day of the week in Iran).
     *
     * @returns A new `JalaliDate` representing the end of the week (Friday).
     * @throws {RangeError} If the resulting date is outside the supported range.
     */
    endOfWeek(): JalaliDate {
        const daysFromSaturday = (this.dayOfWeek - 6 + 7) % 7;
        const daysToFriday = 6 - daysFromSaturday;
        return this.addDays(daysToFriday);
    }

    /**
     * Returns the first day of this date's quarter.
     *
     * @returns A new `JalaliDate` representing the first day of the quarter.
     */
    startOfQuarter(): JalaliDate {
        const firstMonthOfQuarter = (this.quarter - 1) * 3 + 1;
        return new JalaliDate(this.year, firstMonthOfQuarter, 1);
    }

    /**
     * Returns the last day of this date's quarter.
     *
     * @returns A new `JalaliDate` representing the last day of the quarter.
     */
    endOfQuarter(): JalaliDate {
        const lastMonthOfQuarter = this.quarter * 3;
        const lastDay = JalaliDate.daysInMonth(this.year, lastMonthOfQuarter);
        return new JalaliDate(this.year, lastMonthOfQuarter, lastDay);
    }

    // ---------------------------------------------------------------------------
    // Immutability helpers (all return new JalaliDate instances)
    // ---------------------------------------------------------------------------

    /**
     * Returns a new JalaliDate with the specified year.
     *
     * If this is a leap day (Esfand 30) and the new year is not a leap year,
     * the day is clamped to Esfand 29.
     *
     * @param year - The year to set.
     * @returns A new `JalaliDate` with the year changed.
     * @throws {RangeError} If the year is outside the supported range.
     */
    withYear(year: number): JalaliDate {
        const maxDay = JalaliDate.daysInMonth(year, this.month);
        return new JalaliDate(year, this.month, Math.min(this.day, maxDay));
    }

    /**
     * Returns a new JalaliDate with the specified month.
     *
     * If the current day exceeds the number of days in the new month,
     * the day is clamped to the last day of the new month.
     *
     * @param month - The month to set (1-12).
     * @returns A new `JalaliDate` with the month changed.
     * @throws {RangeError} If the month is outside the valid range.
     */
    withMonth(month: number): JalaliDate {
        const maxDay = JalaliDate.daysInMonth(this.year, month);
        return new JalaliDate(this.year, month, Math.min(this.day, maxDay));
    }

    /**
     * Returns a new JalaliDate with the specified day.
     *
     * @param day - The day to set (1-based).
     * @returns A new `JalaliDate` with the day changed.
     * @throws {RangeError} If the day is outside the valid range for this month.
     */
    withDay(day: number): JalaliDate {
        return new JalaliDate(this.year, this.month, day);
    }

    // ---------------------------------------------------------------------------
    // Comparison
    // ---------------------------------------------------------------------------

    /**
     * Returns a negative number, zero, or a positive number depending on whether
     * this date is before, equal to, or after the other date.
     *
     * @param other - The date to compare against.
     * @returns Negative if `this < other`, 0 if equal, positive if `this > other`.
     */
    compareTo(other: JalaliDate): number {
        return this.jdn - other.jdn;
    }

    /**
     * Returns true if this date is the same calendar day as `other`.
     *
     * @param other - The date to compare against.
     * @returns `true` if both dates fall on the same day.
     */
    equals(other: JalaliDate): boolean {
        return this.jdn === other.jdn;
    }

    /**
     * Returns true if this date is before `other`.
     *
     * @param other - The date to compare against.
     * @returns `true` if this date is strictly earlier than `other`.
     */
    isBefore(other: JalaliDate): boolean {
        return this.jdn < other.jdn;
    }

    /**
     * Returns true if this date is after `other`.
     *
     * @param other - The date to compare against.
     * @returns `true` if this date is strictly later than `other`.
     */
    isAfter(other: JalaliDate): boolean {
        return this.jdn > other.jdn;
    }

    /**
     * Returns true if this date is between `start` and `end` (inclusive).
     *
     * @param start - The start date of the range.
     * @param end - The end date of the range.
     * @returns `true` if this date is between start and end (inclusive).
     */
    isBetween(start: JalaliDate, end: JalaliDate): boolean {
        const thisJDN = this.jdn;
        return thisJDN >= start.jdn && thisJDN <= end.jdn;
    }

    /**
     * Returns true if this date and `other` are in the same Jalali year.
     *
     * @param other - The date to compare against.
     * @returns `true` if both dates are in the same year.
     */
    isSameYear(other: JalaliDate): boolean {
        return this.year === other.year;
    }

    /**
     * Returns true if this date and `other` are in the same Jalali month.
     *
     * @param other - The date to compare against.
     * @returns `true` if both dates are in the same year and month.
     */
    isSameMonth(other: JalaliDate): boolean {
        return this.year === other.year && this.month === other.month;
    }

    /**
     * Returns true if this date and `other` are in the same week.
     *
     * Week 1 is the week containing 1 Farvardin. Weeks start on Saturday (6) and end on Friday (5).
     *
     * @param other - The date to compare against.
     * @returns `true` if both dates are in the same year and week.
     */
    isSameWeek(other: JalaliDate): boolean {
        return this.year === other.year && this.weekOfYear === other.weekOfYear;
    }

    /**
     * Returns true if this date and `other` are in the same quarter.
     *
     * @param other - The date to compare against.
     * @returns `true` if both dates are in the same year and quarter.
     */
    isSameQuarter(other: JalaliDate): boolean {
        return this.year === other.year && this.quarter === other.quarter;
    }

    // ---------------------------------------------------------------------------
    // Date differences
    // ---------------------------------------------------------------------------

    /**
     * Returns the number of days between this date and another date.
     *
     * @param other - The date to compare against.
     * @returns The number of days from this date to `other` (negative if `other` is earlier).
     */
    differenceInDays(other: JalaliDate): number {
        return other.jdn - this.jdn;
    }

    /**
     * Returns the approximate number of months between this date and another date.
     *
     * @param other - The date to compare against.
     * @returns The approximate number of months from this date to `other` (negative if `other` is earlier).
     */
    differenceInMonths(other: JalaliDate): number {
        const thisMonths = (toAstronomicalYear(this.year) - 1) * 12 + this.month;
        const otherMonths = (toAstronomicalYear(other.year) - 1) * 12 + other.month;

        let diff = otherMonths - thisMonths;

        // Adjust for day differences
        if (other.day < this.day) {
            diff--;
        }

        return diff;
    }

    /**
     * Returns the approximate number of years between this date and another date.
     *
     * @param other - The date to compare against.
     * @returns The approximate number of years from this date to `other` (negative if `other` is earlier).
     */
    differenceInYears(other: JalaliDate): number {
        let diff = toAstronomicalYear(other.year) - toAstronomicalYear(this.year);

        // Adjust if the anniversary hasn't been reached yet
        if (other.month < this.month || (other.month === this.month && other.day < this.day)) {
            diff--;
        }

        return diff;
    }

    // ---------------------------------------------------------------------------
    // Formatting and serialization
    // ---------------------------------------------------------------------------

    /**
     * Formats this date using the given pattern string.
     *
     * Tokens outside a scoped calendar block use the Jalali calendar. The same is
     * true inside an explicit `[jalali:...]` block. Gregorian components can be
     * formatted with a `[gregorian:...]` block.
     *
     * Jalali (block) tokens:
     * - `YY`: 2-digit Jalali year
     * - `YYYY`: Full Jalali year, zero-padded to 4 digits
     * - `M`: Jalali month number
     * - `MM`: Jalali month number, zero-padded to 2 digits
     * - `MMMM`: Full Jalali month name in Persian
     * - `D`: Jalali day of month
     * - `DD`: Jalali day of month, zero-padded to 2 digits
     * - `DDDD`: Full Persian day-of-week name
     * - `Q`: Persian quarter/season name
     *
     * Gregorian block tokens:
     * - `YY`: 2-digit Gregorian year
     * - `YYYY`: Full Gregorian year, zero-padded to 4 digits
     * - `M`: Gregorian month number
     * - `MM`: Gregorian month number, zero-padded to 2 digits
     * - `MMMM`: Full Gregorian month name in Persian
     * - `D`: Gregorian day of month
     * - `DD`: Gregorian day of month, zero-padded to 2 digits
     * - `DDDD`: Full Persian day-of-week name
     *
     * Formatting behavior:
     * - Quoted text in single or double quotes is output verbatim, without the quotes.
     * - Number fields are formatted using Persian-Indic digits.
     *
     * @example
     * Formatting examples:
     * ```ts
     * const date = new JalaliDate(1405, 1, 15);
     *
     * date.format('DDDD، D MMMM YYYY');
     * // "شنبه، ۱۵ فروردین ۱۴۰۵"
     *
     * date.format('[jalali:DDDD، D MMMM YYYY] برابر با [gregorian:D MMMM YYYY]');
     * // "شنبه، ۱۵ فروردین ۱۴۰۵ برابر با ۴ آوریل ۲۰۲۶"
     *
     * date.format('DDDD "["YYYY/MM/DD"]"', { rlm: 'auto' });
     * // "شنبه [۱۴۰۵/۰۱/۱۵]"
     * ```
     *
     * @param pattern - Format string.
     * @param options - Optional formatting behavior. If a string is provided, it is
     *                  treated as the `rlm` option. See {@link FormatOptions}.
     * @returns Formatted date string.
     * @throws {Error} If the pattern is malformed.
     */
    format(pattern: string, options?: FormatOptions | 'never' | 'always' | 'auto'): string {
        const rlm: 'never' | 'always' | 'auto' =
            typeof options === 'string' ? options :
                options?.rlm ?? 'never';

        let gregorian: DateComponents | undefined;
        const getGregorian = (): DateComponents => (gregorian ??= this.toGregorian());

        const formatToken = (token: FormatToken, calendar: CalendarSystem): string => {
            if (calendar === 'gregorian') {
                const g = getGregorian();

                switch (token) {
                    case 'YYYY':
                        return formatInteger(g.year, 4);
                    case 'YY':
                        return formatInteger(g.year % 100, 2);
                    case 'MMMM':
                        return GREGORIAN_MONTH_NAMES_FA[g.month - 1]!;
                    case 'MM':
                        return formatInteger(g.month, 2);
                    case 'M':
                        return formatInteger(g.month);
                    case 'DDDD':
                        return this.dayOfWeekName;
                    case 'DD':
                        return formatInteger(g.day, 2);
                    case 'D':
                        return formatInteger(g.day);
                    case 'Q':
                        return token;
                }
            }

            switch (token) {
                case 'YYYY':
                    return formatInteger(this.year, 4);
                case 'YY':
                    return formatInteger(this.year % 100, 2);
                case 'MMMM':
                    return this.monthName;
                case 'MM':
                    return formatInteger(this.month, 2);
                case 'M':
                    return formatInteger(this.month);
                case 'DDDD':
                    return this.dayOfWeekName;
                case 'DD':
                    return formatInteger(this.day, 2);
                case 'D':
                    return formatInteger(this.day);
                case 'Q':
                    return this.quarterName;
            }
        };

        const result = getFormatSegments(pattern)
            .map((segment): string =>
                segment.kind === 'literal'
                    ? segment.text
                    : formatToken(segment.token, segment.calendar)
            )
            .join('');

        return rlm === 'always' || (rlm === 'auto' && /^[\u06F0-\u06F9]/.test(result))
            ? '\u200F' + result
            : result;
    }

    /**
     * Returns the Jalali date as "YYYY/MM/DD" with Latin digits.
     *
     * @returns The date string in the ISO-like Jalali format.
     */
    toString(): string {
        const year = this.year < 0
            ? '-' + (-this.year).toString().padStart(4, '0')
            : this.year.toString().padStart(4, '0');
        const month = this.month.toString().padStart(2, '0');
        const day = this.day.toString().padStart(2, '0');
        return `${year}/${month}/${day}`;
    }

    /**
     * Enables JSON serialization of Jalali date as string in "YYYY/MM/DD" format with Latin digits.
     *
     * @returns The JSON string for this `JalaliDate`.
     */
    toJSON(): string {
        return this.toString();
    }
}
