/**
 * Tests for JalaliDate immutable with* methods.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('withYear', () => {
    it('changes only the year when the original day exists in the target year', () => {
        const original = new JalaliDate(1403, 5, 15);
        const changed = original.withYear(1400);

        assert.deepEqual(changed.toObject(), { year: 1400, month: 5, day: 15 });
        assert.deepEqual(original.toObject(), { year: 1403, month: 5, day: 15 });
        assert.notEqual(changed, original);
    });

    it('clamps Esfand 30 when moving to a common year', () => {
        const changed = new JalaliDate(1403, 12, 30).withYear(1402);
        assert.deepEqual(changed.toObject(), { year: 1402, month: 12, day: 29 });
    });

    it('skips year zero when changing year across the BCE/CE boundary', () => {
        const changed = new JalaliDate(-1, 6, 15).withYear(1);
        assert.deepEqual(changed.toObject(), { year: 1, month: 6, day: 15 });
    });

    it('rejects invalid target years', () => {
        const date = new JalaliDate(1403, 5, 15);

        assert.throws(
            () => date.withYear(0),
            RangeError,
            `Expected withYear(0) to throw`
        );
        assert.throws(
            () => date.withYear(1.5),
            RangeError,
            `Expected withYear(1.5) to throw`
        );
        assert.throws(
            () => date.withYear(JalaliDate.MIN_YEAR - 1),
            RangeError,
            `Expected withYear(${JalaliDate.MIN_YEAR - 1}) to throw`
        );
        assert.throws(
            () => date.withYear(JalaliDate.MAX_YEAR + 1),
            RangeError,
            `Expected withYear(${JalaliDate.MAX_YEAR + 1}) to throw`
        );
    });
});

describe('withMonth', () => {
    it('changes only the month when the original day exists in the target month', () => {
        const original = new JalaliDate(1403, 5, 15);
        const changed = original.withMonth(8);

        assert.deepEqual(changed.toObject(), { year: 1403, month: 8, day: 15 });
        assert.deepEqual(original.toObject(), { year: 1403, month: 5, day: 15 });
        assert.notEqual(changed, original);
    });

    it('clamps day when moving to a shorter month', () => {
        const changed = new JalaliDate(1403, 1, 31).withMonth(7);
        assert.deepEqual(changed.toObject(), { year: 1403, month: 7, day: 30 });
    });

    it('rejects invalid target months', () => {
        const date = new JalaliDate(1403, 5, 15);

        assert.throws(
            () => date.withMonth(0),
            RangeError,
            `Expected withMonth(0) to throw`
        );
        assert.throws(
            () => date.withMonth(13),
            RangeError,
            `Expected withMonth(13) to throw`
        );
        assert.throws(
            () => date.withMonth(1.5),
            RangeError,
            `Expected withMonth(1.5) to throw`
        );
    });
});

describe('withDay', () => {
    it('changes only the day', () => {
        const original = new JalaliDate(1403, 5, 15);
        const changed = original.withDay(20);

        assert.deepEqual(changed.toObject(), { year: 1403, month: 5, day: 20 });
        assert.deepEqual(original.toObject(), { year: 1403, month: 5, day: 15 });
        assert.notEqual(changed, original);
    });

    it('rejects invalid target days for the existing month', () => {
        const date = new JalaliDate(1403, 7, 15);

        assert.throws(
            () => date.withDay(0),
            RangeError,
            `Expected withDay(0) to throw`
        );
        assert.throws(
            () => date.withDay(31),
            RangeError,
            `Expected withDay(31) to throw`
        );
        assert.throws(
            () => date.withDay(1.5),
            RangeError,
            `Expected withDay(1.5) to throw`
        );
    });
});
