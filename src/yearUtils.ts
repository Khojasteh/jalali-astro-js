/**
 * Year-numbering conversion utilities.
 *
 * Both the proleptic Gregorian and Jalali calendars have no year 0 — the
 * sequence goes …, −2, −1, 1, 2, … — while astronomical / mathematical
 * contexts use a continuous scale where year 0 = 1 BCE.
 *
 * These utilities centralize all year-numbering conversions so the rest of
 * the codebase never has to inline the `y <= 0 ? y + 1 : y` idiom again.
 */

/**
 * The offset between a Jalali calendar year and its corresponding Gregorian
 * calendar year for positive Jalali years.
 *
 * Jalali year 1 = Gregorian 622, so the base offset is 621.
 * For negative Jalali years an extra +1 is needed because both calendars skip
 * year 0 — use {@link jalaliToGregorianYear} which handles this automatically.
 */
const JALALI_TO_GREGORIAN_OFFSET = 621;

/**
 * Converts a calendar year (no year 0) to an astronomical year (continuous scale).
 *
 * Calendar: …, −2, −1,  1, 2, …
 * Astronomical: …, −2, −1, 0, 1, 2, …
 *
 * Positive years are unchanged. The calendar year −1 becomes astronomical 0,
 * −2 becomes −1, and so on.
 *
 * @param year - Calendar year (non-zero integer).
 * @returns The corresponding astronomical year.
 */
export function toAstronomicalYear(year: number): number {
    return year <= 0 ? year + 1 : year;
}

/**
 * Converts an astronomical year (continuous scale) to a calendar year (no year 0).
 *
 * Astronomical: …, −2, −1, 0, 1, 2, …
 * Calendar: …, −3, −2, −1,  1, 2, …
 *
 * Positive astronomical years are unchanged. Astronomical 0 becomes calendar −1,
 * −1 becomes −2, and so on.
 *
 * @param year - Astronomical year (integer, may be 0).
 * @returns The corresponding calendar year (never 0).
 */
export function toCalendarYear(year: number): number {
    return year <= 0 ? year - 1 : year;
}

/**
 * Converts a Jalali calendar year to its corresponding Gregorian calendar year.
 *
 * Both calendars have no year 0, so the conversion is:
 *   - Positive Jalali years: gregorian = jalali + 621
 *   - Negative Jalali years: gregorian = jalali + 622
 *
 * Chronological correspondence:
 *   Jalali  …, −2, −1,  1, 2, …
 *   Gregorian …, 620, 621, 622, 623, …
 *
 * @param jalaliYear - Jalali calendar year (non-zero integer).
 * @returns The corresponding Gregorian calendar year (non-zero integer).
 */
export function jalaliToGregorianYear(jalaliYear: number): number {
    return toCalendarYear(toAstronomicalYear(jalaliYear) + JALALI_TO_GREGORIAN_OFFSET);
}

/**
 * Converts a Gregorian calendar year to its corresponding Jalali calendar year.
 *
 * This is the inverse of {@link jalaliToGregorianYear}. Both calendars have no
 * year 0, so the conversion is:
 *   - Positive Gregorian years ≥ 622: jalali = gregorian − 621
 *   - Gregorian years ≤ 621: jalali = gregorian − 622
 *
 * Chronological correspondence:
 *   Gregorian …, 620, 621, 622, 623, …
 *   Jalali    …,  −2,  −1,   1,   2, …
 *
 * @param gregorianYear - Gregorian calendar year (non-zero integer).
 * @returns The corresponding Jalali calendar year (non-zero integer).
 */
export function gregorianToJalaliYear(gregorianYear: number): number {
    return toCalendarYear(toAstronomicalYear(gregorianYear) - JALALI_TO_GREGORIAN_OFFSET);
}
