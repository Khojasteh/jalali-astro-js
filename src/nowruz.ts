/**
 * Nowruz (Iranian New Year) calculation.
 *
 * Nowruz falls on the day of the vernal equinox as observed in Tehran (UTC+3:30).
 *
 * The official rule:
 * - if the equinox moment occurs **before** Tehran noon, Nowruz is that civil day;
 * - if it occurs **at or after** noon, Nowruz is the following civil day.
 */

import { vernalEquinoxJD } from './astronomy.js';
import { jalaliToGregorianYear } from './yearNumbering.ts';

/**
 * Iran Standard Time offset from UTC in fractional days (+03:30).
 */
const IRAN_UTC_OFFSET_DAYS = 3.5 / 24;

/**
 * Cache: Jalali year → Nowruz Julian Day Number.
 */
const nowruzCache = new Map<number, number>();

/**
 * Returns the Julian Day Number (integer) of Nowruz for the given Jalali year.
 *
 * The JDN is computed from the astronomical vernal equinox and Iran Standard Time.
 * Results are memoised.
 *
 * @param jalaliYear - Jalali year.
 * @returns The JDN of the first day of the given Jalali year (Nowruz).
 * @throws {RangeError} If the year zero or if the corresponding Gregorian year is outside the supported range for the Meeus algorithm.
 */
export function nowruzJDN(jalaliYear: number): number {
    const cached = nowruzCache.get(jalaliYear);
    if (cached !== undefined) return cached;

    if (jalaliYear === 0) {
        throw new RangeError('Year 0 does not exist in the Jalali calendar.');
    }

    const gregorianYear = jalaliToGregorianYear(jalaliYear);

    // Equinox Julian Day in Universal Time (noon-based)
    const equinoxJD_UT = vernalEquinoxJD(gregorianYear);

    // Shift to Tehran civil time (still noon-based)
    const equinoxJD_Tehran = equinoxJD_UT + IRAN_UTC_OFFSET_DAYS;

    // Shift noon-based JD to midnight-based to get the civil day boundary
    const midnightJD = equinoxJD_Tehran + 0.5;

    // Integer part = civil day number; fractional part = time within that day (0=midnight, 0.5=noon)
    const civilDay = Math.trunc(midnightJD);
    const fractionOfDay = midnightJD - civilDay;

    // Nowruz rule: before noon → same day; noon or after → next day
    const jdn = fractionOfDay < 0.5 ? civilDay : civilDay + 1;

    nowruzCache.set(jalaliYear, jdn);
    return jdn;
}

/**
 * Clears the Nowruz JDN cache.
 *
 * @returns void
 */
export function clearNowruzCache(): void {
    nowruzCache.clear();
}
