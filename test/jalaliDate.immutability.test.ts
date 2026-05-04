/**
 * Tests for JalaliDate immutability helper methods
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/index.js';

describe('withYear', () => {
    it('changes the year', () => {
        const date = new JalaliDate(1403, 5, 15);
        const newDate = date.withYear(1400);
        assert.equal(newDate.year, 1400);
        assert.equal(newDate.month, 5);
        assert.equal(newDate.day, 15);
        // Original unchanged
        assert.equal(date.year, 1403);
    });

    it('clamps day when moving from leap year to common year', () => {
        const date = new JalaliDate(1403, 12, 30); // Leap year
        const newDate = date.withYear(1402); // Common year
        assert.equal(newDate.year, 1402);
        assert.equal(newDate.month, 12);
        assert.equal(newDate.day, 29); // Clamped from 30
    });

    it('throws for invalid year', () => {
        const date = new JalaliDate(1403, 5, 15);
        assert.throws(() => date.withYear(0));
    });
});

describe('withMonth', () => {
    it('changes the month', () => {
        const date = new JalaliDate(1403, 5, 15);
        const newDate = date.withMonth(8);
        assert.equal(newDate.year, 1403);
        assert.equal(newDate.month, 8);
        assert.equal(newDate.day, 15);
        // Original unchanged
        assert.equal(date.month, 5);
    });

    it('clamps day when moving to shorter month', () => {
        const date = new JalaliDate(1403, 1, 31); // Farvardin has 31 days
        const newDate = date.withMonth(7); // Mehr has 30 days
        assert.equal(newDate.year, 1403);
        assert.equal(newDate.month, 7);
        assert.equal(newDate.day, 30); // Clamped from 31
    });

    it('throws for invalid month', () => {
        const date = new JalaliDate(1403, 5, 15);
        assert.throws(() => date.withMonth(13));
        assert.throws(() => date.withMonth(0));
    });
});

describe('withDay', () => {
    it('changes the day', () => {
        const date = new JalaliDate(1403, 5, 15);
        const newDate = date.withDay(20);
        assert.equal(newDate.year, 1403);
        assert.equal(newDate.month, 5);
        assert.equal(newDate.day, 20);
        // Original unchanged
        assert.equal(date.day, 15);
    });

    it('throws for invalid day', () => {
        const date = new JalaliDate(1403, 7, 15);
        assert.throws(() => date.withDay(32));
        assert.throws(() => date.withDay(0));
    });
});
