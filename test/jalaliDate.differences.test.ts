/**
 * Tests for JalaliDate difference calculation methods.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('JalaliDate.differenceInDays', () => {
    const cases: Array<[JalaliDate, JalaliDate, number]> = [
        [new JalaliDate(1403, 5, 1), new JalaliDate(1403, 5, 11), 10],
        [new JalaliDate(1403, 5, 11), new JalaliDate(1403, 5, 1), -10],
        [new JalaliDate(1403, 5, 15), new JalaliDate(1403, 5, 15), 0],
        [new JalaliDate(1403, 5, 25), new JalaliDate(1403, 6, 5), 11],
        [new JalaliDate(1402, 12, 25), new JalaliDate(1403, 1, 5), 9],
    ];

    for (const [start, end, expected] of cases) {
        it(`${start.toString()} to ${end.toString()} = ${expected} days`, () => {
            assert.equal(start.differenceInDays(end), expected);
        });
    }

    it('treats final day of Jalali year -1 and 1/1/1 as consecutive days', () => {
        const lastDay = JalaliDate.daysInMonth(-1, 12);
        const date1 = new JalaliDate(-1, 12, lastDay);
        const date2 = new JalaliDate(1, 1, 1);

        assert.equal(date1.differenceInDays(date2), 1);
        assert.equal(date2.differenceInDays(date1), -1);
    });
});

describe('JalaliDate.differenceInMonths', () => {
    const cases: Array<[JalaliDate, JalaliDate, number]> = [
        [new JalaliDate(1403, 1, 15), new JalaliDate(1403, 5, 15), 4],
        [new JalaliDate(1403, 5, 15), new JalaliDate(1403, 1, 15), -4],
        [new JalaliDate(1403, 5, 15), new JalaliDate(1403, 5, 20), 0],
        [new JalaliDate(1403, 1, 20), new JalaliDate(1403, 2, 15), 0],
        [new JalaliDate(1403, 1, 15), new JalaliDate(1403, 2, 14), 0],
        [new JalaliDate(1403, 1, 15), new JalaliDate(1403, 2, 15), 1],
        [new JalaliDate(1402, 10, 15), new JalaliDate(1403, 2, 15), 4],
        [new JalaliDate(-1, 6, 15), new JalaliDate(1, 6, 15), 12],
    ];

    for (const [start, end, expected] of cases) {
        it(`${start.toString()} to ${end.toString()} = ${expected} full months`, () => {
            assert.equal(start.differenceInMonths(end), expected);
        });
    }
});

describe('JalaliDate.differenceInYears', () => {
    const cases: Array<[JalaliDate, JalaliDate, number]> = [
        [new JalaliDate(1400, 5, 15), new JalaliDate(1403, 5, 15), 3],
        [new JalaliDate(1403, 5, 15), new JalaliDate(1400, 5, 15), -3],
        [new JalaliDate(1403, 1, 15), new JalaliDate(1403, 12, 15), 0],
        [new JalaliDate(1400, 6, 15), new JalaliDate(1403, 5, 15), 2],
        [new JalaliDate(1400, 5, 15), new JalaliDate(1403, 6, 15), 3],
        [new JalaliDate(-1, 5, 15), new JalaliDate(1, 5, 15), 1],
    ];

    for (const [start, end, expected] of cases) {
        it(`${start.toString()} to ${end.toString()} = ${expected} full years`, () => {
            assert.equal(start.differenceInYears(end), expected);
        });
    }
});
