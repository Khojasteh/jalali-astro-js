/**
 * Tests for JalaliDate instance conversion methods.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('toGregorian', () => {
    const cases: Array<{
        jalali: JalaliDate;
        gregorian: { year: number; month: number; day: number };
    }> = [
        { jalali: new JalaliDate(1402, 1, 1), gregorian: { year: 2023, month: 3, day: 21 } },
        { jalali: new JalaliDate(1402, 12, 29), gregorian: { year: 2024, month: 3, day: 19 } },
        { jalali: new JalaliDate(1403, 1, 1), gregorian: { year: 2024, month: 3, day: 20 } },
        { jalali: new JalaliDate(1403, 12, 30), gregorian: { year: 2025, month: 3, day: 20 } },
        { jalali: new JalaliDate(1404, 1, 1), gregorian: { year: 2025, month: 3, day: 21 } },
        { jalali: new JalaliDate(1405, 2, 12), gregorian: { year: 2026, month: 5, day: 2 } },
    ];

    for (const { jalali, gregorian } of cases) {
        it(`converts ${jalali.toString()} to Gregorian ${gregorian.year}-${gregorian.month}-${gregorian.day}`, () => {
            assert.deepEqual(jalali.toGregorian(), gregorian);
        });
    }

    it('round-trips through fromGregorian', () => {
        const samples = [
            new JalaliDate(1402, 1, 1),
            new JalaliDate(1403, 12, 30),
            new JalaliDate(1400, 6, 31),
            new JalaliDate(1395, 12, 30),
            new JalaliDate(1380, 7, 15),
            new JalaliDate(-100, 1, 1),
        ];

        for (const original of samples) {
            const g = original.toGregorian();
            const roundTripped = JalaliDate.fromGregorian(g.year, g.month, g.day);

            assert.ok(
                roundTripped.equals(original),
                `Expected ${original}, got ${roundTripped}`
            );
        }
    });
});

describe('toObject', () => {
    it('returns a plain object with year, month, and day', () => {
        const date = new JalaliDate(1402, 6, 15);
        assert.deepEqual(date.toObject(), { year: 1402, month: 6, day: 15 });
    });

    it('works for negative years', () => {
        const date = new JalaliDate(-100, 1, 1);
        assert.deepEqual(date.toObject(), { year: -100, month: 1, day: 1 });
    });

    it('returns a distinct object each time', () => {
        const date = new JalaliDate(1402, 6, 15);
        const obj1 = date.toObject();
        const obj2 = date.toObject();

        assert.deepEqual(obj1, obj2);
        assert.notEqual(obj1, obj2);
    });
});

describe('toIsoDateString', () => {
    it('returns the Gregorian ISO date for the Jalali date', () => {
        assert.equal(new JalaliDate(1403, 1, 1).toIsoDateString(), '2024-03-20');
        assert.equal(new JalaliDate(1404, 1, 1).toIsoDateString(), '2025-03-21');
        assert.equal(new JalaliDate(1403, 12, 30).toIsoDateString(), '2025-03-20');
    });

    it('uses zero-padded month and day values', () => {
        assert.equal(new JalaliDate(1405, 2, 12).toIsoDateString(), '2026-05-02');
    });

    it('round-trips through fromIsoDateString', () => {
        const samples = [
            new JalaliDate(1402, 1, 1),
            new JalaliDate(1403, 12, 30),
            new JalaliDate(1380, 7, 15),
        ];

        for (const original of samples) {
            assert.ok(
                JalaliDate.fromIsoDateString(original.toIsoDateString()).equals(original),
                `Expected ${original} to round-trip through ISO date string`
            );
        }
    });
});
