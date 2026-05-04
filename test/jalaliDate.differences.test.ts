/**
 * Tests for JalaliDate difference calculation methods
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/index.js';

describe('differenceInDays', () => {
    it('returns positive difference for future dates', () => {
        const date1 = new JalaliDate(1403, 5, 1);
        const date2 = new JalaliDate(1403, 5, 11);
        assert.equal(date1.differenceInDays(date2), 10);
    });

    it('returns negative difference for past dates', () => {
        const date1 = new JalaliDate(1403, 5, 11);
        const date2 = new JalaliDate(1403, 5, 1);
        assert.equal(date1.differenceInDays(date2), -10);
    });

    it('returns zero for same dates', () => {
        const date1 = new JalaliDate(1403, 5, 15);
        const date2 = new JalaliDate(1403, 5, 15);
        assert.equal(date1.differenceInDays(date2), 0);
    });

    it('works across month boundaries', () => {
        const date1 = new JalaliDate(1403, 5, 25);
        const date2 = new JalaliDate(1403, 6, 5);
        assert.equal(date1.differenceInDays(date2), 11);
    });

    it('works across year boundaries', () => {
        const date1 = new JalaliDate(1402, 12, 25);
        const date2 = new JalaliDate(1403, 1, 5);
        assert.equal(date1.differenceInDays(date2), 9);
    });
});

describe('differenceInMonths', () => {
    it('returns positive difference for future dates', () => {
        const date1 = new JalaliDate(1403, 1, 15);
        const date2 = new JalaliDate(1403, 5, 15);
        assert.equal(date1.differenceInMonths(date2), 4);
    });

    it('returns negative difference for past dates', () => {
        const date1 = new JalaliDate(1403, 5, 15);
        const date2 = new JalaliDate(1403, 1, 15);
        assert.equal(date1.differenceInMonths(date2), -4);
    });

    it('returns zero for same month', () => {
        const date1 = new JalaliDate(1403, 5, 15);
        const date2 = new JalaliDate(1403, 5, 20);
        assert.equal(date1.differenceInMonths(date2), 0);
    });

    it('adjusts for day differences', () => {
        const date1 = new JalaliDate(1403, 1, 20);
        const date2 = new JalaliDate(1403, 2, 15);
        assert.equal(date1.differenceInMonths(date2), 0); // Not a full month yet
    });

    it('works across year boundaries', () => {
        const date1 = new JalaliDate(1402, 10, 15);
        const date2 = new JalaliDate(1403, 2, 15);
        assert.equal(date1.differenceInMonths(date2), 4);
    });

    it('handles year 0 gap correctly', () => {
        const date1 = new JalaliDate(-1, 6, 15);
        const date2 = new JalaliDate(1, 6, 15);
        assert.equal(date1.differenceInMonths(date2), 12); // 1 year = 12 months
    });
});

describe('differenceInYears', () => {
    it('returns positive difference for future dates', () => {
        const date1 = new JalaliDate(1400, 5, 15);
        const date2 = new JalaliDate(1403, 5, 15);
        assert.equal(date1.differenceInYears(date2), 3);
    });

    it('returns negative difference for past dates', () => {
        const date1 = new JalaliDate(1403, 5, 15);
        const date2 = new JalaliDate(1400, 5, 15);
        assert.equal(date1.differenceInYears(date2), -3);
    });

    it('returns zero for same year', () => {
        const date1 = new JalaliDate(1403, 1, 15);
        const date2 = new JalaliDate(1403, 12, 15);
        assert.equal(date1.differenceInYears(date2), 0);
    });

    it('adjusts for anniversary not reached', () => {
        const date1 = new JalaliDate(1400, 6, 15);
        const date2 = new JalaliDate(1403, 5, 15);
        assert.equal(date1.differenceInYears(date2), 2); // Not 3 yet
    });

    it('counts full years when anniversary reached', () => {
        const date1 = new JalaliDate(1400, 5, 15);
        const date2 = new JalaliDate(1403, 6, 15);
        assert.equal(date1.differenceInYears(date2), 3);
    });

    it('handles year 0 gap correctly', () => {
        const date1 = new JalaliDate(-1, 5, 15);
        const date2 = new JalaliDate(1, 5, 15);
        assert.equal(date1.differenceInYears(date2), 1); // 1 year gap
    });
});
