/**
 * Astronomical calculations for the vernal equinox.
 * Implements the algorithm from Jean Meeus, "Astronomical Algorithms", Chapter 27.
 */

/**
 * Minimum Gregorian year supported by the Meeus equinox algorithm.
 */
export const MEEUS_MIN_YEAR = -1000;

/**
 * Maximum Gregorian year supported by the Meeus equinox algorithm.
 */
export const MEEUS_MAX_YEAR = 3000;

/**
 * Calculates the difference between Terrestrial Time (TT) and Universal Time (UT)
 * in seconds for a given decimal year. Based on the polynomial tables by Morrison
 * and Stephenson, extended with NASA's predictions.
 *
 * @param yearDecimal - Decimal year (e.g. 2000.5 = mid-2000).
 * @returns ΔT in seconds (TT − UT).
 */
function deltaTSeconds(yearDecimal: number): number {
    if (yearDecimal < -500) {
        const u = (yearDecimal - 1820) / 100;
        return -20 + 32 * u * u;
    }
    if (yearDecimal < 500) {
        const u = yearDecimal / 100;
        return 10583.6 - 1014.41 * u + 33.78311 * u ** 2
            - 5.952053 * u ** 3 - 0.1798452 * u ** 4
            + 0.022174192 * u ** 5 + 0.0090316521 * u ** 6;
    }
    if (yearDecimal < 1600) {
        const u = (yearDecimal - 1000) / 100;
        return 1574.2 - 556.01 * u + 71.23472 * u ** 2
            + 0.319781 * u ** 3 - 0.8503463 * u ** 4
            - 0.005050998 * u ** 5 + 0.0083572073 * u ** 6;
    }
    if (yearDecimal < 1700) {
        const t = yearDecimal - 1600;
        return 120 - 0.9808 * t - 0.01532 * t ** 2 + t ** 3 / 7129;
    }
    if (yearDecimal < 1800) {
        const t = yearDecimal - 1700;
        return 8.83 + 0.1603 * t - 0.0059285 * t ** 2
            + 0.00013336 * t ** 3 - t ** 4 / 1174000;
    }
    if (yearDecimal < 1860) {
        const t = yearDecimal - 1800;
        return 13.72 - 0.332447 * t + 0.0068612 * t ** 2
            + 0.0041116 * t ** 3 - 0.00037436 * t ** 4
            + 0.0000121272 * t ** 5 - 0.0000001699 * t ** 6
            + 0.000000000875 * t ** 7;
    }
    if (yearDecimal < 1900) {
        const t = yearDecimal - 1860;
        return 7.62 + 0.5737 * t - 0.251754 * t ** 2
            + 0.01680668 * t ** 3 - 0.0004473624 * t ** 4
            + t ** 5 / 233174;
    }
    if (yearDecimal < 1920) {
        const t = yearDecimal - 1900;
        return -2.79 + 1.494119 * t - 0.0598939 * t ** 2
            + 0.0061966 * t ** 3 - 0.000197 * t ** 4;
    }
    if (yearDecimal < 1941) {
        const t = yearDecimal - 1920;
        return 21.20 + 0.84493 * t - 0.076100 * t ** 2 + 0.0020936 * t ** 3;
    }
    if (yearDecimal < 1961) {
        const t = yearDecimal - 1950;
        return 29.07 + 0.407 * t - t ** 2 / 233 + t ** 3 / 2547;
    }
    if (yearDecimal < 1986) {
        const t = yearDecimal - 1975;
        return 45.45 + 1.067 * t - t ** 2 / 260 - t ** 3 / 718;
    }
    if (yearDecimal < 2005) {
        const t = yearDecimal - 2000;
        return 63.86 + 0.3345 * t - 0.060374 * t ** 2
            + 0.0017275 * t ** 3 + 0.000651814 * t ** 4
            + 0.00002373599 * t ** 5;
    }
    if (yearDecimal < 2050) {
        const t = yearDecimal - 2000;
        return 62.92 + 0.32217 * t + 0.005589 * t ** 2;
    }
    if (yearDecimal < 2150) {
        const u = (yearDecimal - 1820) / 100;
        return -20 + 32 * u * u - 0.5628 * (2150 - yearDecimal);
    }
    const u = (yearDecimal - 1820) / 100;
    return -20 + 32 * u * u;
}

/**
 * Periodic correction terms for the vernal equinox (Meeus Ch. 27, Table 27.a).
 * Each entry is [amplitude (0.00001 JD), phase (°), frequency (°/Julian century)].
 */
const VERNAL_EQUINOX_CORRECTIONS: ReadonlyArray<readonly [number, number, number]> = [
    [485, 324.96, 1934.136],
    [203, 337.23, 32964.467],
    [199, 342.08, 20.186],
    [182, 27.85, 445267.112],
    [156, 73.14, 45036.886],
    [136, 171.52, 22518.443],
    [77, 222.54, 65928.934],
    [74, 296.72, 3034.906],
    [70, 243.58, 9037.513],
    [58, 119.81, 33718.147],
    [52, 297.17, 150.678],
    [50, 21.02, 2281.226],
    [45, 247.54, 29929.562],
    [44, 325.15, 31555.956],
    [29, 60.93, 4443.417],
    [18, 155.12, 67555.328],
    [17, 288.79, 4562.452],
    [16, 198.04, 62894.029],
    [14, 199.76, 31436.921],
    [12, 95.39, 14577.848],
    [12, 287.11, 31931.756],
    [12, 320.81, 34777.259],
    [9, 227.73, 1222.114],
    [8, 15.45, 16859.074],
];

const DEG_TO_RAD = Math.PI / 180;
const J2000_JD = 2451545.0;

/**
 * Calculates the Julian Day of the vernal equinox for a given Gregorian year,
 * expressed in Universal Time (UT).
 *
 * @param gregorianYear - The Gregorian year (integer; no year 0 in the proleptic calendar).
 * @returns The Julian Day Number of the vernal equinox instant, in UT (fractional JD).
 * @throws {RangeError} If the year is outside [{@link MEEUS_MIN_YEAR}, {@link MEEUS_MAX_YEAR}].
 */
export function vernalEquinoxJD(gregorianYear: number): number {
    if (gregorianYear < MEEUS_MIN_YEAR || gregorianYear > MEEUS_MAX_YEAR) {
        throw new RangeError(
            `Year ${gregorianYear} is out of range. Valid range: ${MEEUS_MIN_YEAR}–${MEEUS_MAX_YEAR}.`
        );
    }

    // Mean equinox JDE in Terrestrial Time (Meeus Ch. 27, Table 27.a)
    let jde0: number;
    if (gregorianYear >= 1000) {
        const t = (gregorianYear - 2000) / 1000;
        jde0 = 2451623.80984 + 365242.37404 * t + 0.05169 * t ** 2
            - 0.00411 * t ** 3 - 0.00057 * t ** 4;
    } else {
        const t = gregorianYear / 1000;
        jde0 = 1721139.29189 + 365242.13740 * t + 0.06134 * t ** 2
            + 0.00111 * t ** 3 - 0.00071 * t ** 4;
    }

    // W is T in Julian centuries from J2000 for the mean equinox moment
    const w = (jde0 - J2000_JD) / 36525;

    // Sum periodic correction terms
    let s = 0;
    for (const [a, b, c] of VERNAL_EQUINOX_CORRECTIONS) {
        s += a * Math.cos((b + c * w) * DEG_TO_RAD);
    }
    const ttJde = jde0 + s * 0.00001;

    // Convert TT → UT by subtracting ΔT (estimated at mid-March)
    const deltaT = deltaTSeconds(gregorianYear + 2.5 / 12);
    return ttJde - deltaT / 86400;
}
