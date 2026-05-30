/**
 * Tests for JalaliDate derived date methods.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('JalaliDate.startOfYear', () => {
    it('returns start of a common year', () => {
        const date = new JalaliDate(1402, 6, 15);
        const start = date.startOfYear();
        assert.deepEqual(start.toObject(), { year: 1402, month: 1, day: 1 });
    });

    it('returns start of a leap year', () => {
        const date = new JalaliDate(1403, 6, 15);
        const start = date.startOfYear();
        assert.deepEqual(start.toObject(), { year: 1403, month: 1, day: 1 });
    });

    it('returns equal but distinct instance when already at start', () => {
        const start = new JalaliDate(1403, 1, 1);
        const startResult = start.startOfYear();
        assert.ok(startResult.equals(start), 'Expected startResult to equal start');
        assert.notEqual(startResult, start);
    });
});

describe('JalaliDate.endOfYear', () => {
    it('returns end of a common year', () => {
        const date = new JalaliDate(1402, 6, 15);
        const end = date.endOfYear();
        assert.deepEqual(end.toObject(), { year: 1402, month: 12, day: 29 });
    });

    it('returns end of a leap year', () => {
        const date = new JalaliDate(1403, 6, 15);
        const end = date.endOfYear();
        assert.deepEqual(end.toObject(), { year: 1403, month: 12, day: 30 });
    });

    it('returns equal but distinct instance when already at end', () => {
        const end = new JalaliDate(1403, 12, 30);
        const endResult = end.endOfYear();
        assert.ok(endResult.equals(end), 'Expected endResult to equal end');
        assert.notEqual(endResult, end);
    });
});

describe('JalaliDate.startOfMonth', () => {
    it('returns start of month', () => {
        const date = new JalaliDate(1402, 6, 15);
        const start = date.startOfMonth();
        assert.deepEqual(start.toObject(), { year: 1402, month: 6, day: 1 });
    });
});

describe('JalaliDate.endOfMonth', () => {
    it('returns end of 31-day month', () => {
        const date = new JalaliDate(1402, 6, 15);
        const end = date.endOfMonth();
        assert.deepEqual(end.toObject(), { year: 1402, month: 6, day: 31 });
    });

    it('returns end of 30-day month', () => {
        const date = new JalaliDate(1402, 7, 15);
        const end = date.endOfMonth();
        assert.deepEqual(end.toObject(), { year: 1402, month: 7, day: 30 });
    });

    it('returns end of Esfand in common year', () => {
        const date = new JalaliDate(1402, 12, 15);
        const end = date.endOfMonth();
        assert.deepEqual(end.toObject(), { year: 1402, month: 12, day: 29 });
    });

    it('returns end of Esfand in leap year', () => {
        const date = new JalaliDate(1403, 12, 15);
        const end = date.endOfMonth();
        assert.deepEqual(end.toObject(), { year: 1403, month: 12, day: 30 });
    });
});

describe('JalaliDate.startOfWeek', () => {
    it('returns Saturday as start of week', () => {
        const wednesday = new JalaliDate(1403, 1, 1);
        assert.equal(wednesday.dayOfWeek, 3);
        const start = wednesday.startOfWeek();
        assert.deepEqual(start.toObject(), { year: 1402, month: 12, day: 26 });
    });

    it('returns same date when already at start of week', () => {
        const saturday = new JalaliDate(1403, 1, 4);
        assert.equal(saturday.dayOfWeek, 6);
        assert.ok(saturday.startOfWeek().equals(saturday));
    });
});

describe('JalaliDate.endOfWeek', () => {
    it('returns Friday as end of week', () => {
        const wednesday = new JalaliDate(1403, 1, 1);
        assert.equal(wednesday.dayOfWeek, 3);
        const end = wednesday.endOfWeek();
        assert.deepEqual(end.toObject(), { year: 1403, month: 1, day: 3 });
    });

    it('returns same date when already at end of week', () => {
        const friday = new JalaliDate(1403, 1, 3);
        assert.equal(friday.dayOfWeek, 5);
        assert.ok(friday.endOfWeek().equals(friday));
    });

    it('startOfWeek and endOfWeek span exactly 6 days', () => {
        const date = new JalaliDate(1403, 6, 15);
        assert.equal(date.endOfWeek().jdn - date.startOfWeek().jdn, 6);
    });
});

describe('JalaliDate.startOfQuarter', () => {
    const cases: Array<[JalaliDate, { year: number; month: number; day: number }]> = [
        [new JalaliDate(1403, 2, 15), { year: 1403, month: 1, day: 1 }],
        [new JalaliDate(1403, 5, 20), { year: 1403, month: 4, day: 1 }],
        [new JalaliDate(1403, 8, 10), { year: 1403, month: 7, day: 1 }],
        [new JalaliDate(1402, 11, 15), { year: 1402, month: 10, day: 1 }],
        [new JalaliDate(1403, 11, 15), { year: 1403, month: 10, day: 1 }],
    ];

    for (const [date, expected] of cases) {
        it(`returns start of quarter for ${date.toString()}`, () => {
            const start = date.startOfQuarter();
            assert.deepEqual(start.toObject(), expected);
        });
    }
});

describe('JalaliDate.endOfQuarter', () => {
    const cases: Array<[JalaliDate, { year: number; month: number; day: number }]> = [
        [new JalaliDate(1403, 2, 15), { year: 1403, month: 3, day: 31 }],
        [new JalaliDate(1403, 5, 20), { year: 1403, month: 6, day: 31 }],
        [new JalaliDate(1403, 8, 10), { year: 1403, month: 9, day: 30 }],
        [new JalaliDate(1402, 11, 15), { year: 1402, month: 12, day: 29 }],
        [new JalaliDate(1403, 11, 15), { year: 1403, month: 12, day: 30 }],
    ];

    for (const [date, expected] of cases) {
        it(`returns end of quarter for ${date.toString()}`, () => {
            const end = date.endOfQuarter();
            assert.deepEqual(end.toObject(), expected);
        });
    }
});
