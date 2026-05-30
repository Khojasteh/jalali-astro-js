/**
 * Tests for src/yearUtils.ts
 *
 * Verifies year-numbering conversions across the no-year-zero boundary.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    toAstronomicalYear,
    toCalendarYear,
    jalaliToGregorianYear,
    gregorianToJalaliYear,
    expandTwoDigitYear
} from '../src/yearNumbering.ts';

describe('toAstronomicalYear', () => {
    it('leaves positive years unchanged', () => {
        assert.equal(toAstronomicalYear(1), 1);
        assert.equal(toAstronomicalYear(2), 2);
        assert.equal(toAstronomicalYear(1404), 1404);
    });

    it('maps calendar -1 to astronomical 0', () => {
        assert.equal(toAstronomicalYear(-1), 0);
    });

    it('maps calendar -2 to astronomical -1', () => {
        assert.equal(toAstronomicalYear(-2), -1);
    });

    it('maps calendar -100 to astronomical -99', () => {
        assert.equal(toAstronomicalYear(-100), -99);
    });
});

describe('toCalendarYear', () => {
    it('leaves positive years unchanged', () => {
        assert.equal(toCalendarYear(1), 1);
        assert.equal(toCalendarYear(2), 2);
        assert.equal(toCalendarYear(1404), 1404);
    });

    it('maps astronomical 0 to calendar -1', () => {
        assert.equal(toCalendarYear(0), -1);
    });

    it('maps astronomical -1 to calendar -2', () => {
        assert.equal(toCalendarYear(-1), -2);
    });

    it('maps astronomical -99 to calendar -100', () => {
        assert.equal(toCalendarYear(-99), -100);
    });
});

describe('toAstronomicalYear / toCalendarYear round-trip', () => {
    const years = [-100, -2, -1, 1, 2, 100, 1404];

    for (const y of years) {
        it(`round-trips calendar year ${y}`, () => {
            assert.equal(toCalendarYear(toAstronomicalYear(y)), y);
        });
    }

    it('result is never 0', () => {
        for (const astY of [-2, -1, 0, 1, 2]) {
            assert.notEqual(toCalendarYear(astY), 0);
        }
    });
});

describe('jalaliToGregorianYear', () => {
    it('Jalali 1 → Gregorian 622', () => {
        assert.equal(jalaliToGregorianYear(1), 622);
    });

    it('Jalali 2 → Gregorian 623', () => {
        assert.equal(jalaliToGregorianYear(2), 623);
    });

    it('Jalali -1 → Gregorian 621', () => {
        assert.equal(jalaliToGregorianYear(-1), 621);
    });

    it('Jalali -2 → Gregorian 620', () => {
        assert.equal(jalaliToGregorianYear(-2), 620);
    });

    it('Jalali 1404 → Gregorian 2025', () => {
        assert.equal(jalaliToGregorianYear(1404), 2025);
    });

    it('Jalali 1405 → Gregorian 2026', () => {
        assert.equal(jalaliToGregorianYear(1405), 2026);
    });

    it('result is never 0', () => {
        for (const y of [-2, -1, 1, 2]) {
            assert.notEqual(jalaliToGregorianYear(y), 0);
        }
    });
});

describe('gregorianToJalaliYear', () => {
    it('Gregorian 622 → Jalali 1', () => {
        assert.equal(gregorianToJalaliYear(622), 1);
    });

    it('Gregorian 623 → Jalali 2', () => {
        assert.equal(gregorianToJalaliYear(623), 2);
    });

    it('Gregorian 621 → Jalali -1', () => {
        assert.equal(gregorianToJalaliYear(621), -1);
    });

    it('Gregorian 620 → Jalali -2', () => {
        assert.equal(gregorianToJalaliYear(620), -2);
    });

    it('Gregorian 2025 → Jalali 1404', () => {
        assert.equal(gregorianToJalaliYear(2025), 1404);
    });

    it('Gregorian 2026 → Jalali 1405', () => {
        assert.equal(gregorianToJalaliYear(2026), 1405);
    });

    it('result is never 0', () => {
        for (const y of [-2, -1, 1, 2, 621, 622]) {
            assert.notEqual(gregorianToJalaliYear(y), 0);
        }
    });
});

describe('jalaliToGregorianYear / gregorianToJalaliYear round-trip', () => {
    const jalaliYears = [-100, -2, -1, 1, 2, 100, 1404, 1405];

    for (const y of jalaliYears) {
        it(`round-trips Jalali year ${y}`, () => {
            assert.equal(gregorianToJalaliYear(jalaliToGregorianYear(y)), y);
        });
    }
});

describe('expandTwoDigitYear', () => {
    it('chooses the nearest matching full year around a positive reference year', () => {
        assert.equal(expandTwoDigitYear(0, 1410), 1400);
        assert.equal(expandTwoDigitYear(5, 1410), 1405);
        assert.equal(expandTwoDigitYear(50, 1410), 1450);
        assert.equal(expandTwoDigitYear(95, 1410), 1395);

        assert.equal(expandTwoDigitYear(0, 1590), 1600);
        assert.equal(expandTwoDigitYear(5, 1590), 1605);
        assert.equal(expandTwoDigitYear(50, 1590), 1550);
        assert.equal(expandTwoDigitYear(95, 1590), 1595);
    });

    it('chooses the nearest matching full year around a negative reference year', () => {
        assert.equal(expandTwoDigitYear(0, -1410), -1400);
        assert.equal(expandTwoDigitYear(5, -1410), -1405);
        assert.equal(expandTwoDigitYear(50, -1410), -1450);
        assert.equal(expandTwoDigitYear(95, -1410), -1395);

        assert.equal(expandTwoDigitYear(0, -1590), -1600);
        assert.equal(expandTwoDigitYear(5, -1590), -1605);
        assert.equal(expandTwoDigitYear(50, -1590), -1550);
        assert.equal(expandTwoDigitYear(95, -1590), -1595);
    });

    it('never returns year zero near the calendar era boundary', () => {
        assert.notEqual(expandTwoDigitYear(0, -1), 0);
        assert.notEqual(expandTwoDigitYear(0, 1), 0);
    });

    it('rejects values outside the two-digit range', () => {
        for (const year of [-1, 100, 1405, 1.5, NaN]) {
            assert.throws(
                () => expandTwoDigitYear(year, 1405),
                RangeError,
                `Expected expandTwoDigitYear(${year}, 1405) to throw`
            );
        }
    });

    it('rejects invalid reference years', () => {
        for (const referenceYear of [0, 1405.5, NaN]) {
            assert.throws(
                () => expandTwoDigitYear(10, referenceYear),
                RangeError,
                `Expected expandTwoDigitYear(10, ${referenceYear}) to throw`
            );
        }
    });
});
