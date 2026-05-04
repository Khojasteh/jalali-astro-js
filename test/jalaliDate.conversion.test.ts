/**
 * Tests for JalaliDate conversion methods (Gregorian, JDN)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('JalaliDate.fromGregorian', () => {
    it('converts 2024-03-20 → 1403/1/1 (Nowruz 1403)', () => {
        const d = JalaliDate.fromGregorian(2024, 3, 20);
        assert.equal(d.year, 1403);
        assert.equal(d.month, 1);
        assert.equal(d.day, 1);
    });

    it('converts 2026-05-02 → 1405/2/12', () => {
        const d = JalaliDate.fromGregorian(2026, 5, 2);
        assert.equal(d.year, 1405);
        assert.equal(d.month, 2);
        assert.equal(d.day, 12);
    });

    it('converts date in negative Jalali year', () => {
        const d = JalaliDate.fromGregorian(100, 3, 21);
        assert.ok(d.year < 0);
    });

    it('throws RangeError for Gregorian year 0', () => {
        assert.throws(
            () => JalaliDate.fromGregorian(0, 1, 1),
            RangeError
        );
    });

    it('throws RangeError for Gregorian year below MIN_GREGORIAN_YEAR', () => {
        assert.throws(
            () => JalaliDate.fromGregorian(JalaliDate.MIN_GREGORIAN_YEAR - 1, 1, 1),
            RangeError
        );
    });

    it('throws RangeError for Gregorian year above MAX_GREGORIAN_YEAR', () => {
        assert.throws(
            () => JalaliDate.fromGregorian(JalaliDate.MAX_GREGORIAN_YEAR + 1, 1, 1),
            RangeError
        );
    });

    it('throws RangeError for month 0', () => {
        assert.throws(
            () => JalaliDate.fromGregorian(2024, 0, 1),
            RangeError
        );
    });

    it('throws RangeError for month 13', () => {
        assert.throws(
            () => JalaliDate.fromGregorian(2024, 13, 1),
            RangeError
        );
    });

    it('throws RangeError for February 29 in non-leap year (2023)', () => {
        assert.throws(
            () => JalaliDate.fromGregorian(2023, 2, 29),
            RangeError
        );
    });

    it('accepts February 29 in leap year (2024)', () => {
        const d = JalaliDate.fromGregorian(2024, 2, 29);
        assert.ok(d instanceof JalaliDate);
    });
});

describe('JalaliDate.fromJDN', () => {
    it('creates date from JDN for Nowruz 1403 (2024-03-20)', () => {
        const d = JalaliDate.fromJDN(2460390);
        assert.equal(d.year, 1403);
        assert.equal(d.month, 1);
        assert.equal(d.day, 1);
    });

    it('creates date from JDN at JalaliDate.MIN_YEAR boundary', () => {
        const minDate = new JalaliDate(JalaliDate.MIN_YEAR, 1, 1);
        const d = JalaliDate.fromJDN(minDate.jdn);
        assert.equal(d.year, JalaliDate.MIN_YEAR);
        assert.equal(d.month, 1);
        assert.equal(d.day, 1);
    });

    it('throws RangeError for JDN below MIN_YEAR range', () => {
        const minDate = new JalaliDate(JalaliDate.MIN_YEAR, 1, 1);
        const jdnBeforeMin = minDate.jdn - 365;
        assert.throws(
            () => JalaliDate.fromJDN(jdnBeforeMin),
            RangeError
        );
    });

    it('round-trips via jdn property', () => {
        const original = new JalaliDate(1402, 6, 15);
        const roundTrip = JalaliDate.fromJDN(original.jdn);
        assert.ok(original.equals(roundTrip));
    });
});

describe('toGregorian', () => {
    it('converts 1403/1/1 to 2024-03-20', () => {
        const d = new JalaliDate(1403, 1, 1);
        const g = d.toGregorian();
        assert.deepEqual(g, { year: 2024, month: 3, day: 20 });
    });

    it('converts 1404/1/1 to 2025-03-21', () => {
        const d = new JalaliDate(1404, 1, 1);
        const g = d.toGregorian();
        assert.deepEqual(g, { year: 2025, month: 3, day: 21 });
    });

    it('converts negative Jalali year correctly', () => {
        const d = new JalaliDate(-100, 1, 1);
        const g = d.toGregorian();
        assert.ok(typeof g.year === 'number');
        const back = JalaliDate.fromGregorian(g.year, g.month, g.day);
        assert.ok(back.equals(d));
    });
});

describe('toGregorian / fromGregorian round-trip', () => {
    const samples = [
        new JalaliDate(1402, 1, 1),
        new JalaliDate(1403, 12, 30),
        new JalaliDate(1400, 6, 31),
        new JalaliDate(1395, 12, 30),
        new JalaliDate(1380, 7, 15),
    ];

    for (const original of samples) {
        it(`${original} round-trips via toGregorian/fromGregorian`, () => {
            const g = original.toGregorian();
            const roundTripped = JalaliDate.fromGregorian(g.year, g.month, g.day);
            assert.ok(
                roundTripped.equals(original),
                `Expected ${original}, got ${roundTripped}`
            );
        });
    }
});
