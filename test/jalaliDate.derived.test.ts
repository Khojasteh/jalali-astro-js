/**
 * Tests for JalaliDate derived date methods.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('year and month boundaries', () => {
    it('returns start and end of a common year', () => {
        const date = new JalaliDate(1402, 6, 15);

        const start = date.startOfYear();
        assert.deepEqual(start.toObject(), { year: 1402, month: 1, day: 1 });
        const end = date.endOfYear();
        assert.deepEqual(end.toObject(), { year: 1402, month: 12, day: 29 });
    });

    it('returns start and end of a leap year', () => {
        const date = new JalaliDate(1403, 6, 15);

        const start = date.startOfYear();
        assert.deepEqual(start.toObject(), { year: 1403, month: 1, day: 1 });
        const end = date.endOfYear();
        assert.deepEqual(end.toObject(), { year: 1403, month: 12, day: 30 });
    });

    it('returns start and end of month for 31-day, 30-day, and Esfand months', () => {
        const start1 = new JalaliDate(1402, 6, 15).startOfMonth();
        assert.deepEqual(start1.toObject(), { year: 1402, month: 6, day: 1 });
        const end1 = new JalaliDate(1402, 6, 15).endOfMonth();
        assert.deepEqual(end1.toObject(), { year: 1402, month: 6, day: 31 });
        const end2 = new JalaliDate(1402, 7, 15).endOfMonth();
        assert.deepEqual(end2.toObject(), { year: 1402, month: 7, day: 30 });
        const end3 = new JalaliDate(1402, 12, 15).endOfMonth();
        assert.deepEqual(end3.toObject(), { year: 1402, month: 12, day: 29 });
        const end4 = new JalaliDate(1403, 12, 15).endOfMonth();
        assert.deepEqual(end4.toObject(), { year: 1403, month: 12, day: 30 });
    });

    it('returns equal but distinct instances when already at boundaries', () => {
        const start = new JalaliDate(1403, 1, 1);
        const startResult = start.startOfYear();
        assert.ok(startResult.equals(start), 'Expected startResult to equal start');
        assert.notEqual(startResult, start);

        const end = new JalaliDate(1403, 12, 30);
        const endResult = end.endOfYear();
        assert.ok(endResult.equals(end), 'Expected endResult to equal end');
        assert.notEqual(endResult, end);
    });
});

describe('week boundaries', () => {
    it('returns Saturday as start of week and Friday as end of week', () => {
        const wednesday = new JalaliDate(1403, 1, 1);

        assert.equal(wednesday.dayOfWeek, 3);
        const start = wednesday.startOfWeek();
        assert.deepEqual(start.toObject(), { year: 1402, month: 12, day: 26 });
        const end = wednesday.endOfWeek();
        assert.deepEqual(end.toObject(), { year: 1403, month: 1, day: 3 });
    });

    it('returns same date when already at week boundaries', () => {
        const saturday = new JalaliDate(1403, 1, 4);
        const friday = new JalaliDate(1403, 1, 3);

        assert.equal(saturday.dayOfWeek, 6);
        assert.equal(friday.dayOfWeek, 5);

        assert.ok(saturday.startOfWeek().equals(saturday));
        assert.ok(friday.endOfWeek().equals(friday));
    });

    it('startOfWeek and endOfWeek span exactly 6 days', () => {
        const date = new JalaliDate(1403, 6, 15);
        assert.equal(date.endOfWeek().jdn - date.startOfWeek().jdn, 6);
    });
});

describe('quarter boundaries', () => {
    const cases: Array<{
        date: JalaliDate;
        start: { year: number; month: number; day: number };
        end: { year: number; month: number; day: number };
    }> = [
            {
                date: new JalaliDate(1403, 2, 15),
                start: { year: 1403, month: 1, day: 1 },
                end: { year: 1403, month: 3, day: 31 },
            },
            {
                date: new JalaliDate(1403, 5, 20),
                start: { year: 1403, month: 4, day: 1 },
                end: { year: 1403, month: 6, day: 31 },
            },
            {
                date: new JalaliDate(1403, 8, 10),
                start: { year: 1403, month: 7, day: 1 },
                end: { year: 1403, month: 9, day: 30 },
            },
            {
                date: new JalaliDate(1402, 11, 15),
                start: { year: 1402, month: 10, day: 1 },
                end: { year: 1402, month: 12, day: 29 },
            },
            {
                date: new JalaliDate(1403, 11, 15),
                start: { year: 1403, month: 10, day: 1 },
                end: { year: 1403, month: 12, day: 30 },
            },
        ];

    for (const { date, start, end } of cases) {
        it(`returns quarter boundaries for ${date.toString()}`, () => {
            const quarterStart = date.startOfQuarter();
            assert.deepEqual(quarterStart.toObject(), start);
            const quarterEnd = date.endOfQuarter();
            assert.deepEqual(quarterEnd.toObject(), end);
        });
    }
});
