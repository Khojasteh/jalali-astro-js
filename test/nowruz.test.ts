/**
 * Tests for src/nowruz.ts
 *
 * Verifies Nowruz JDN calculation against known Gregorian calendar dates.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MEEUS_MIN_YEAR, MEEUS_MAX_YEAR } from '../src/astronomy.ts';
import { nowruzJDN, clearNowruzCache } from '../src/nowruz.ts';
import { gregorianToJalaliYear } from '../src/yearNumbering.ts';
import { gregorianToJDN } from '../src/julianDay.ts';

function expectedNowruzJDN(gYear: number, gMonth: number, gDay: number): number {
    return gregorianToJDN(gYear, gMonth, gDay);
}

function formatGregorianDate(gYear: number, gMonth: number, gDay: number): string {
    return `${gYear}-${String(gMonth).padStart(2, '0')}-${String(gDay).padStart(2, '0')}`;
}

function assertNowruzDate(
    jalaliYear: number,
    gYear: number,
    gMonth: number,
    gDay: number
): void {
    const expected = expectedNowruzJDN(gYear, gMonth, gDay);
    const actual = nowruzJDN(jalaliYear);
    const gregorianDate = formatGregorianDate(gYear, gMonth, gDay);

    assert.equal(
        actual,
        expected,
        [
            `Nowruz JDN for Jalali ${jalaliYear}`,
            `expected ${expected} (${gregorianDate})`,
            `got ${actual}`,
        ].join(': ')
    );
}

describe('nowruzJDN', () => {
    beforeEach(() => {
        clearNowruzCache();
    });

    describe('input validation', () => {
        it('rejects non-integer Jalali years', () => {
            const invalidYears = [
                1.5,
                -1.5,
                NaN,
                Infinity,
                -Infinity,
            ];

            for (const year of invalidYears) {
                assert.throws(
                    () => nowruzJDN(year),
                    RangeError,
                    `Expected nowruzJDN(${year}) to throw`
                );
            }
        });

        it('rejects Jalali year 0', () => {
            assert.throws(
                () => nowruzJDN(0),
                RangeError,
                `Expected nowruzJDN(0) to throw`
            );
        });

        it('rejects years below the Meeus-supported range', () => {
            const minSupportedJalaliYear = gregorianToJalaliYear(MEEUS_MIN_YEAR);

            assert.throws(
                () => nowruzJDN(minSupportedJalaliYear - 1),
                RangeError,
                `Expected nowruzJDN(${minSupportedJalaliYear - 1}) to throw`
            );
        });

        it('rejects years above the Meeus-supported range', () => {
            const maxSupportedJalaliYear = gregorianToJalaliYear(MEEUS_MAX_YEAR);

            assert.throws(
                () => nowruzJDN(maxSupportedJalaliYear + 1),
                RangeError,
                `Expected nowruzJDN(${maxSupportedJalaliYear + 1}) to throw`
            );
        });
    });

    describe('supported range boundaries', () => {
        it('accepts the minimum supported Jalali year', () => {
            const minSupportedJalaliYear = gregorianToJalaliYear(MEEUS_MIN_YEAR);

            const jdn = nowruzJDN(minSupportedJalaliYear);

            assert.ok(Number.isInteger(jdn));
        });

        it('accepts the maximum supported Jalali year', () => {
            const maxSupportedJalaliYear = gregorianToJalaliYear(MEEUS_MAX_YEAR);

            const jdn = nowruzJDN(maxSupportedJalaliYear);

            assert.ok(Number.isInteger(jdn));
        });
    });

    describe('known Nowruz dates', () => {
        const knownNowruz: Array<{
            jalali: number;
            gYear: number;
            gMonth: number;
            gDay: number;
            note?: string;
        }> = [
                {
                    jalali: 1395,
                    gYear: 2016,
                    gMonth: 3,
                    gDay: 20,
                    note: 'equinox before Tehran noon',
                },
                {
                    jalali: 1396,
                    gYear: 2017,
                    gMonth: 3,
                    gDay: 21,
                    note: 'equinox at/after Tehran noon, so next civil day',
                },
                {
                    jalali: 1397,
                    gYear: 2018,
                    gMonth: 3,
                    gDay: 21,
                },
                {
                    jalali: 1398,
                    gYear: 2019,
                    gMonth: 3,
                    gDay: 21,
                },
                {
                    jalali: 1399,
                    gYear: 2020,
                    gMonth: 3,
                    gDay: 20,
                },
                {
                    jalali: 1400,
                    gYear: 2021,
                    gMonth: 3,
                    gDay: 21,
                },
                {
                    jalali: 1401,
                    gYear: 2022,
                    gMonth: 3,
                    gDay: 21,
                },
                {
                    jalali: 1402,
                    gYear: 2023,
                    gMonth: 3,
                    gDay: 21,
                },
                {
                    jalali: 1403,
                    gYear: 2024,
                    gMonth: 3,
                    gDay: 20,
                },
                {
                    jalali: 1404,
                    gYear: 2025,
                    gMonth: 3,
                    gDay: 21,
                    note: 'equinox at/after Tehran noon, so next civil day',
                },
                {
                    jalali: 1405,
                    gYear: 2026,
                    gMonth: 3,
                    gDay: 21,
                },
            ];

        for (const { jalali, gYear, gMonth, gDay, note } of knownNowruz) {
            const gregorianDate = formatGregorianDate(gYear, gMonth, gDay);

            it(`Jalali ${jalali} Nowruz = ${gregorianDate}${note ? ` (${note})` : ''}`, () => {
                assertNowruzDate(jalali, gYear, gMonth, gDay);
            });
        }
    });

    describe('year-to-year behavior', () => {
        it('successive Nowruz dates are 365 or 366 days apart', () => {
            const years = [
                1395,
                1396,
                1397,
                1398,
                1399,
                1400,
                1401,
                1402,
                1403,
                1404,
                1405,
            ];

            for (let i = 1; i < years.length; i++) {
                const previousYear = years[i - 1]!;
                const currentYear = years[i]!;

                const previous = nowruzJDN(previousYear);
                const current = nowruzJDN(currentYear);
                const diff = current - previous;

                assert.ok(
                    diff === 365 || diff === 366,
                    `Expected Jalali ${currentYear} Nowruz to be 365 or 366 days after Jalali ${previousYear}; got ${diff}`
                );
            }
        });

        it('works for a supported negative Jalali year', () => {
            const jdn = nowruzJDN(-100);

            assert.ok(Number.isInteger(jdn));
        });
    });

    describe('cache behavior', () => {
        it('returns the same result before and after clearing the cache', () => {
            const first = nowruzJDN(1402);
            const second = nowruzJDN(1402);

            assert.equal(second, first);

            clearNowruzCache();

            const third = nowruzJDN(1402);

            assert.equal(third, first);
        });

        it('clearNowruzCache is safe to call repeatedly', () => {
            clearNowruzCache();
            clearNowruzCache();

            assertNowruzDate(1403, 2024, 3, 20);
        });
    });
});