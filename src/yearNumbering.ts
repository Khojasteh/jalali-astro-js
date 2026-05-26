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
 * @throws {RangeError} If the year is not a non-zero integer.
 */
export function toAstronomicalYear(year: number): number {
    if (!Number.isInteger(year) || year === 0) {
        throw new RangeError('Year must be a non-zero integer.');
    }

    return year < 0 ? year + 1 : year;
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
 * @throws {RangeError} If the year is not an integer.
 */
export function toCalendarYear(year: number): number {
    if (!Number.isInteger(year)) {
        throw new RangeError('Year must be an integer.');
    }

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

/**
 * Expands a two-digit Jalali year to the nearest full year around a reference Jalali year.
 *
 * The same two digits of the absolute year number are checked in the previous,
 * current, and next century, then the year closest to `referenceYear` is returned.
 *
 * @param year          - Two-digit Jalali year in the range 0-99.
 * @param referenceYear - Full Jalali year used to choose the nearest century; cannot be 0.
 * @returns The corresponding full Jalali year.
 * @throws {RangeError} If `year` is not an integer in the range 0-99.
 * @throws {RangeError} If `referenceYear` is not a non-zero integer.
 */
export function expandTwoDigitJalaliYear(year: number, referenceYear: number): number {
    if (!Number.isInteger(year) || year < 0 || year > 99) {
        throw new RangeError(`Two-digit Jalali year ${year} is out of valid range (0-99).`);
    }
    if (!Number.isInteger(referenceYear) || referenceYear === 0) {
        throw new RangeError('Reference Jalali year must be a non-zero integer.');
    }

    const referenceAstronomicalYear = toAstronomicalYear(referenceYear);
    const referenceCentury = Math.floor(Math.abs(referenceYear) / 100) * 100;

    let closestYear = referenceYear;
    let minDistance = Number.POSITIVE_INFINITY;

    // Check candidates from previous, current, and next century
    for (const centuryOffset of [-100, 0, 100]) {
        const absoluteYear = referenceCentury + centuryOffset + year;
        if (absoluteYear <= 0) continue;

        // Check positive candidate
        const positiveDistance = Math.abs(absoluteYear - referenceAstronomicalYear);
        if (positiveDistance < minDistance) {
            minDistance = positiveDistance;
            closestYear = absoluteYear;
        }

        // Only check negative candidate if reference year is negative or close to zero
        if (referenceYear < 0 || absoluteYear <= 200) {
            const negativeCandidate = -absoluteYear;
            const negativeDistance = Math.abs(toAstronomicalYear(negativeCandidate) - referenceAstronomicalYear);
            if (negativeDistance < minDistance) {
                minDistance = negativeDistance;
                closestYear = negativeCandidate;
            }
        }
    }

    return closestYear;
}
