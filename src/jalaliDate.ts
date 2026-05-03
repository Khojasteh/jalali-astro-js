/**
 * JalaliDate — an immutable value object representing a Jalali date.
 *
 * Instances are created via the constructor or static factory methods.
 * All arithmetic methods return new instances; the original is never mutated.
 *
 * Supported year range: {@link JalaliDate.MIN_YEAR} to {@link JalaliDate.MAX_YEAR}
 * (Gregorian: {@link JalaliDate.MIN_GREGORIAN_YEAR} to {@link JalaliDate.MAX_GREGORIAN_YEAR}).
 *
 * Day-of-week follows the JS Date convention: 0=Sunday, 1=Monday, …, 6=Saturday.
 */

import { vernalEquinoxJD, MEEUS_MIN_YEAR, MEEUS_MAX_YEAR } from './astronomy.js';
import { gregorianToJDN, gregorianFromJDN, gregorianDaysInMonth } from './julianDay.js';
import { nowruzJDN, JALALI_TO_GREGORIAN_OFFSET } from './nowruz.js';
import { PersianNumbers } from './persianNumbers.js';

/**
 * Iran Standard Time offset in milliseconds (+03:30).
 */
const IRAN_OFFSET_MS = (3 * 60 + 30) * 60 * 1000;

/**
 * Julian Day Number of the Unix epoch (1970-01-01 at noon UTC).
 * Used to convert between Julian Day Numbers and Unix timestamps.
 * JDN 2440587 corresponds to 1970-01-01; the fractional .5 shifts
 * the JD epoch (noon) to midnight.
 */
const UNIX_EPOCH_JD = 2440587.5;

/**
 * Regular expression to match format tokens in pattern strings.
 */
const FORMAT_TOKENS = /"[^"]*"|'[^']*'|YYYY|YY|MMMM|MM|M|DDDD|DD|D/gi;

/**
 * Names of the Jalali months in Persian.
 */
const MONTH_NAMES_FA: ReadonlyArray<string> = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

/**
 * Names of the days of the week in Persian, following the JS Date convention:
 * 0=Sunday, 1=Monday, …, 6=Saturday.
 */
const DOW_NAMES_FA: ReadonlyArray<string> = [
    'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'
];

// ---------------------------------------------------------------------------
// Pattern parsing helpers
// ---------------------------------------------------------------------------

/**
 * Metadata for a compiled pattern, including the regex and capture group information.
 */
interface CompiledPattern {
    regex: RegExp;
    captureGroups: Array<{ type: 'year' | 'month' | 'day'; token: string }>;
}

/**
 * Cache of compiled patterns to avoid re-parsing the same pattern multiple times.
 */
const patternCache = new Map<string, CompiledPattern>();

/**
 * Compiles a date format pattern into a regular expression and capture group metadata.
 * Results are cached for performance.
 *
 * @param pattern - The date format pattern string.
 * @returns An object containing the compiled regex and capture group information.
 */
function compilePattern(pattern: string): CompiledPattern {
    // Check cache first
    const cached = patternCache.get(pattern);
    if (cached) {
        return cached;
    }

    // Helper to escape regex special characters in literal text
    const escapeRegex = function (text: string): string {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // Track which component each capture group represents
    const captureGroups: Array<{ type: 'year' | 'month' | 'day'; token: string }> = [];

    // Build a regular expression from the pattern
    let regexPattern = '';
    let lastIndex = 0;

    // Iterate over all format tokens in the pattern
    for (const match of pattern.matchAll(FORMAT_TOKENS)) {
        const token = match[0];
        const tokenIndex = match.index!;

        // Add any literal text before this token
        if (tokenIndex > lastIndex) {
            const literal = pattern.slice(lastIndex, tokenIndex);
            regexPattern += escapeRegex(literal);
        }
        lastIndex = tokenIndex + token.length;

        // Handle quoted strings (literal text)
        if (token[0] === '"' || token[0] === "'") {
            const literalText = token.slice(1, -1);
            regexPattern += escapeRegex(literalText);
            continue;
        }

        // Handle date component tokens
        const upperToken = token.toUpperCase();
        switch (upperToken) {
            case 'YYYY':
            case 'YY':
                captureGroups.push({ type: 'year', token: upperToken });
                regexPattern += '([\\d۰-۹]+)';
                break;
            case 'MMMM':
                captureGroups.push({ type: 'month', token: upperToken });
                regexPattern += '([^\\s\\/\\-]+)';
                break;
            case 'MM':
            case 'M':
                captureGroups.push({ type: 'month', token: upperToken });
                regexPattern += '([\\d۰-۹]+)';
                break;
            case 'DDDD':
                // Day of week is ignored during parsing
                regexPattern += '[^\\s\\/\\-]+';
                break;
            case 'DD':
            case 'D':
                captureGroups.push({ type: 'day', token: upperToken });
                regexPattern += '([\\d۰-۹]+)';
                break;
        }
    }

    // Add any remaining literal text after the last token
    if (lastIndex < pattern.length) {
        const literal = pattern.slice(lastIndex);
        regexPattern += escapeRegex(literal);
    }

    // Compile the final regex (case-insensitive)
    const compiled: CompiledPattern = {
        regex: new RegExp(`^${regexPattern}$`, 'i'),
        captureGroups
    };

    // Cache and return the result
    patternCache.set(pattern, compiled);
    return compiled;
}

// ---------------------------------------------------------------------------
// JalaliDate class
// ---------------------------------------------------------------------------

export class JalaliDate {
    // ---------------------------------------------------------------------------
    // Year range constants
    // ---------------------------------------------------------------------------

    /**
     * Minimum supported Jalali year.
     */
    static readonly MIN_YEAR = MEEUS_MIN_YEAR - JALALI_TO_GREGORIAN_OFFSET; // −1621

    /**
     * Maximum supported Jalali year.
     *
     * One year below the Meeus ceiling so that year+1 remains computable
     * for {@link isLeapYear} and {@link daysInYear}.
     */
    static readonly MAX_YEAR = MEEUS_MAX_YEAR - JALALI_TO_GREGORIAN_OFFSET - 1; // 2378

    /**
     * Minimum supported Gregorian year.
     */
    static readonly MIN_GREGORIAN_YEAR = MEEUS_MIN_YEAR;

    /**
     * Maximum supported Gregorian year.
     */
    static readonly MAX_GREGORIAN_YEAR = MEEUS_MAX_YEAR;

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
     * Throws `RangeError` if `year` is outside [{@link MIN_YEAR}, {@link MAX_YEAR}].
     *
     * @param year - Jalali year to validate.
     * @throws {RangeError} If `year` is out of range or is 0 (there is no year 0).
     */
    protected static assertYearInRange(year: number): void {
        if (year === 0) {
            throw new RangeError('Year 0 does not exist in the Jalali calendar.');
        }
        if (year < JalaliDate.MIN_YEAR || year > JalaliDate.MAX_YEAR) {
            throw new RangeError(
                `Jalali year ${year} is out of range. Supported range: ${JalaliDate.MIN_YEAR}–${JalaliDate.MAX_YEAR}.`
            );
        }
    }

    /**
     * Throws `RangeError` if `month` is outside 1–12.
     *
     * @param month - Month number to validate.
     * @throws {RangeError} If `month` is not in 1–12.
     */
    protected static assertMonthInRange(month: number): void {
        if (month < 1 || month > 12) {
            throw new RangeError(`Month ${month} is out of range. Valid range: 1–12.`);
        }
    }

    /**
     * Throws `RangeError` if `day` is outside 1–`maxDay`.
     *
     * @param day    - Day of month to validate.
     * @param maxDay - Inclusive upper bound (from {@link daysInMonth}).
     * @throws {RangeError} If `day` is not in 1–`maxDay`.
     */
    protected static assertDayInRange(day: number, maxDay: number): void {
        if (day < 1 || day > maxDay) {
            throw new RangeError(`Day ${day} is out of range. Valid range: 1–${maxDay}.`);
        }
    }

    /**
     * Returns the number of days from the start of the year to the start of
     * `month` (0-based).
     *
     * @param month - Month number (1–12).
     * @returns 0-based day offset to the first day of `month`.
     */
    protected static daysToMonth(month: number): number {
        return Math.min(month - 1, 6) + (month - 1) * 30;
    }

    /**
     * Binary-searches for the Jalali year whose Nowruz JDN is ≤ `jdn`
     * and whose next Nowruz JDN is > `jdn`.
     *
     * @param jdn - Julian Day Number to locate within a Jalali year.
     * @returns The Jalali year that contains `jdn`.
     */
    protected static findYear(jdn: number): number {
        let lo = JalaliDate.MIN_YEAR;
        let hi = JalaliDate.MAX_YEAR;
        while (lo < hi) {
            const mid = Math.ceil((lo + hi) / 2);
            if (nowruzJDN(mid) <= jdn) lo = mid;
            else hi = mid - 1;
        }
        return lo;
    }

    // ---------------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------------

    /**
     * Creates a JalaliDate from explicit Jalali year, month, and day.
     *
     * @param year  - Jalali year (must be in [{@link JalaliDate.MIN_YEAR}, {@link JalaliDate.MAX_YEAR}]).
     * @param month - Month (1 = Farvardin … 12 = Esfand).
     * @param day   - Day of month (1-based).
     * @throws {RangeError} If any component is out of range.
     */
    constructor(year: number, month: number, day: number) {
        JalaliDate.assertYearInRange(year);
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
     */
    static today(): JalaliDate {
        return JalaliDate.fromDate(new Date());
    }

    /**
     * Creates a JalaliDate from a JavaScript `Date` object.
     *
     * The calendar date is determined by shifting the UTC instant to Tehran
     * civil time (UTC+03:30) and reading the resulting Gregorian date.
     *
     * @param date - A JavaScript `Date` object.
     * @returns The corresponding `JalaliDate` in Tehran civil time.
     */
    static fromDate(date: Date): JalaliDate {
        const tehran = new Date(date.getTime() + IRAN_OFFSET_MS);
        return JalaliDate.fromGregorian(
            tehran.getUTCFullYear(),
            tehran.getUTCMonth() + 1,
            tehran.getUTCDate(),
        );
    }

    /**
     * Creates a JalaliDate from a year and day-of-year offset.
     *
     * @param year Jalali year
     * @param dayOfYear 1-based day of year (1 = 1 Farvardin)
     * @returns The corresponding `JalaliDate` for the given year and day-of-year.
     * @throws {RangeError} If `dayOfYear` is out of range for the given year.
     */
    static fromDayOfYear(year: number, dayOfYear: number): JalaliDate {
        if (dayOfYear < 1 || dayOfYear > JalaliDate.daysInYear(year)) {
            throw new RangeError(`Day-of-year ${dayOfYear} is out of range for year ${year}.`);
        }

        const firstSixMonthDays = 6 * 31;
        const month = dayOfYear <= firstSixMonthDays
            ? Math.floor((dayOfYear - 1) / 31) + 1
            : Math.floor((dayOfYear - firstSixMonthDays - 1) / 30) + 6 + 1;
        const day = dayOfYear - JalaliDate.daysToMonth(month);
        return new JalaliDate(year, month, day);
    }

    /**
     * Creates a JalaliDate from a Gregorian date.
     *
     * @param gYear  - Proleptic Gregorian year.
     * @param gMonth - Gregorian month (1–12).
     * @param gDay   - Gregorian day of month (1-based).
     * @returns The corresponding Jalali date as a `JalaliDate`.
     * @throws {RangeError} If the Gregorian date is invalid or out of supported range.
     */
    static fromGregorian(gYear: number, gMonth: number, gDay: number): JalaliDate {
        if (gYear === 0) {
            throw new RangeError('Year 0 does not exist in the Gregorian calendar.');
        }
        if (gYear < JalaliDate.MIN_GREGORIAN_YEAR || gYear > JalaliDate.MAX_GREGORIAN_YEAR) {
            throw new RangeError(
                `Gregorian year ${gYear} is out of range. Supported range: ${JalaliDate.MIN_GREGORIAN_YEAR}–${JalaliDate.MAX_GREGORIAN_YEAR}.`
            );
        }
        if (gMonth < 1 || gMonth > 12) {
            throw new RangeError(`Gregorian month ${gMonth} is out of range. Valid range: 1–12.`);
        }
        const maxDay = gregorianDaysInMonth(gYear, gMonth);
        if (gDay < 1 || gDay > maxDay) {
            throw new RangeError(`Gregorian day ${gDay} is out of range for ${gYear}-${gMonth}. Valid range: 1–${maxDay}.`);
        }

        const jdn = gregorianToJDN(gYear, gMonth, gDay);
        return JalaliDate.fromJDN(jdn);
    }

    /**
     * Creates a JalaliDate from a Julian Day Number.
     *
     * @param jdn - Julian Day Number (integer).
     * @returns The corresponding `JalaliDate` for the given JDN.
     * @throws {RangeError} If the JDN is outside the supported range for conversion to a Jalali date.
     */
    static fromJDN(jdn: number): JalaliDate {
        const year = JalaliDate.findYear(jdn);
        if (year < JalaliDate.MIN_YEAR || year > JalaliDate.MAX_YEAR) {
            throw new RangeError(
                `Julian Day Number ${jdn} is out of range for conversion to Jalali date.`
            );
        }

        const dayOfYear = jdn - nowruzJDN(year) + 1;
        return JalaliDate.fromDayOfYear(year, dayOfYear);
    }

    /**
     * Parses a Jalali date string using the given format pattern.
     *
     * Format tokens:
     * - `YY`: 2-digit year
     * - `YYYY`: full year, zero-padded to 4 digits
     * - `M`: Month number
     * - `MM`: Month number, zero-padded to 2 digits
     * - `MMMM`: Full month name in Persian
     * - `D`: Day of month
     * - `DD`: Day of month, zero-padded to 2 digits
     * - `DDDD`: Full day of week name in Persian
     *
     * Quoted text in single or double quotes must match verbatim (without the quotes).
     * Persian-Indic digits are accepted alongside Latin digits.
     *
     * @param str     - The input string.
     * @param pattern - Format pattern. Defaults to `'YYYY/M/D'`.
     * @returns A `JalaliDate` parsed from the string.
     * @throws {Error} If parsing fails.
     * @throws {RangeError} If the resulting date is out of range.
     */
    static parse(str: string, pattern = 'YYYY/M/D'): JalaliDate {
        const { regex, captureGroups } = compilePattern(pattern);

        const match = str.match(regex);
        if (!match) {
            throw new Error(`Failed to parse "${str}" with pattern "${pattern}".`);
        }

        let year: number | undefined;
        let month: number | undefined;
        let day: number | undefined;

        for (let i = 0; i < captureGroups.length; i++) {
            const group = captureGroups[i];
            const value = match[i + 1];

            if (!group || !value) {
                continue;
            }

            if (group.type === 'year') {
                if (group.token === 'YY') {
                    const twoDigitYear = PersianNumbers.parse(value);
                    year = twoDigitYear >= 50 ? 1300 + twoDigitYear : 1400 + twoDigitYear;
                } else {
                    year = PersianNumbers.parse(value);
                }
            } else if (group.type === 'month') {
                if (group.token === 'MMMM') {
                    const monthIndex = MONTH_NAMES_FA.indexOf(value);
                    if (monthIndex === -1) {
                        throw new Error(`Unrecognized month name: "${value}".`);
                    }
                    month = monthIndex + 1;
                } else {
                    month = PersianNumbers.parse(value);
                }
            } else if (group.type === 'day') {
                day = PersianNumbers.parse(value);
            }
        }

        if (year === undefined || month === undefined || day === undefined) {
            throw new Error(`Failed to extract date components from "${str}" with pattern "${pattern}".`);
        }

        return new JalaliDate(year, month, day);
    }

    // ---------------------------------------------------------------------------
    // Static utilities
    // ---------------------------------------------------------------------------

    /**
     * Returns `true` when the given Jalali year is a leap year.
     *
     * @param year - Jalali year.
     * @returns `true` if `year` is a leap year, `false` otherwise.
     * @throws {RangeError} If `year` is outside the supported range or is 0.
     */
    static isLeapYear(year: number): boolean {
        JalaliDate.assertYearInRange(year);
        // Skip year 0 when calculating next year
        const nextYear = year === -1 ? 1 : year + 1;
        return nowruzJDN(nextYear) - nowruzJDN(year) === 366;
    }

    /**
     * Returns the number of days in the given month of the given Jalali year.
     *
     * @param year  - Jalali year.
     * @param month - Month number (1–12).
     * @returns Number of days in the month (29–31).
     * @throws {RangeError} If `month` is outside 1–12 or `year` is invalid.
     */
    static daysInMonth(year: number, month: number): number {
        JalaliDate.assertYearInRange(year);
        JalaliDate.assertMonthInRange(month);
        if (month <= 6) return 31;
        if (month <= 11) return 30;
        // Month 12 depends on whether it's a leap year
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
        JalaliDate.assertYearInRange(year);
        // Skip year 0 when calculating next year
        const nextYear = year === -1 ? 1 : year + 1;
        return nowruzJDN(nextYear) - nowruzJDN(year);
    }

    /**
     * Returns the time of the vernal equinox for the given Jalali year as a JavaScript `Date` in UTC.
     *
     * @param year - Jalali year.
     * @returns A JavaScript `Date` representing the UTC time of the vernal equinox for the given year.
     * @throws {RangeError} If `year` is outside the supported range or is 0.
     */
    static vernalEquinox(year: number): Date {
        JalaliDate.assertYearInRange(year);
        const equinoxJD = vernalEquinoxJD(year + JALALI_TO_GREGORIAN_OFFSET);
        return new Date((equinoxJD - UNIX_EPOCH_JD) * 86400 * 1000);
    }

    // ---------------------------------------------------------------------------
    // Computed properties
    // ---------------------------------------------------------------------------

    /**
     * Julian Day Number for this date.
     */
    get jdn(): number {
        return nowruzJDN(this.year) + JalaliDate.daysToMonth(this.month) + (this.day - 1);
    }

    /**
     * Day of the year (1-based, 1 = 1 Farvardin).
     */
    get dayOfYear(): number {
        return this.jdn - nowruzJDN(this.year) + 1;
    }

    /**
     * Day of the week for this date.
     *
     * The value follows the JavaScript `Date` convention:
     * 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday.
     */
    get dayOfWeek(): number {
        return (this.jdn + 1) % 7;
    }

    /**
     * Whether this year is a leap year.
     */
    get isLeapYear(): boolean {
        return JalaliDate.isLeapYear(this.year);
    }

    /**
     * Number of days in this month (29–31).
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

    // ---------------------------------------------------------------------------
    // Conversion
    // ---------------------------------------------------------------------------

    /**
     * Returns the equivalent proleptic Gregorian date.
     *
     * @returns Plain `{ year, month, day }` in the proleptic Gregorian calendar.
     */
    toGregorian(): { year: number; month: number; day: number } {
        return gregorianFromJDN(this.jdn);
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
        // Convert to continuous year numbering to handle year 0 gap
        const continuousYear = this.year <= 0 ? this.year + 1 : this.year;
        const totalMonths = (continuousYear - 1) * 12 + (this.month - 1) + n;
        const newContinuousYear = Math.floor(totalMonths / 12) + 1;
        const newMonth = (totalMonths % 12 + 12) % 12 + 1;
        // Convert back from continuous to calendar year (skipping 0)
        const newYear = newContinuousYear <= 0 ? newContinuousYear - 1 : newContinuousYear;
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
        // Convert to continuous year numbering to handle year 0 gap
        const continuousYear = this.year <= 0 ? this.year + 1 : this.year;
        const newContinuousYear = continuousYear + n;
        // Convert back from continuous to calendar year (skipping 0)
        const newYear = newContinuousYear <= 0 ? newContinuousYear - 1 : newContinuousYear;
        const maxDay = JalaliDate.daysInMonth(newYear, this.month);
        return new JalaliDate(newYear, this.month, Math.min(this.day, maxDay));
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

    // ---------------------------------------------------------------------------
    // Formatting
    // ---------------------------------------------------------------------------

    /**
     * Formats this date using the given pattern string.
     *
     * Number fields are formatted using Persian-Indic digits.
     *
     * Format tokens:
     * - `YY`: 2-digit year
     * - `YYYY`: full year, zero-padded to 4 digits
     * - `M`: Month number
     * - `MM`: Month number, zero-padded to 2 digits
     * - `MMMM`: Full month name in Persian
     * - `D`: Day of month
     * - `DD`: Day of month, zero-padded to 2 digits
     * - `DDDD`: Full day of week name in Persian
     *
     * Quoted text in single or double quotes is output verbatim (without the quotes).
     *
     * @param pattern - Format string.
     * @returns Formatted date string.
     */
    format(pattern: string): string {
        return pattern.replace(FORMAT_TOKENS, (token): string => {
            if (token[0] === '"' || token[0] === "'") {
                return token.slice(1, -1);
            }

            switch (token.toUpperCase()) {
                case 'YYYY':
                    return PersianNumbers.format(this.year, 4);
                case 'YY':
                    return PersianNumbers.format(this.year % 100, 2);
                case 'MMMM':
                    return MONTH_NAMES_FA[this.month - 1] ?? '';
                case 'MM':
                    return PersianNumbers.format(this.month, 2);
                case 'M':
                    return PersianNumbers.format(this.month);
                case 'DDDD':
                    return DOW_NAMES_FA[this.dayOfWeek] ?? '';
                case 'DD':
                    return PersianNumbers.format(this.day, 2);
                case 'D':
                    return PersianNumbers.format(this.day);
                default:
                    return token;
            }
        });
    }

    /**
     * Returns the date as "YYYY/MM/DD" with Latin digits.
     *
     * @returns The date string in the ISO-like Jalali format.
     */
    toString(): string {
        const year = this.year.toString().padStart(4, '0');
        const month = this.month.toString().padStart(2, '0');
        const day = this.day.toString().padStart(2, '0');
        return `${year}/${month}/${day}`;
    }

    /**
     * Enables JSON serialization as "YYYY/MM/DD".
     *
     * @returns The JSON string for this `JalaliDate`.
     */
    toJSON(): string {
        return this.toString();
    }
}
