/**
 * Tests for Persian number formatting and parsing.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PersianNumbers } from '../src/persianNumbers.ts';

describe('PersianNumbers', () => {
    it('formats a positive number with Persian digits', () => {
        assert.equal(PersianNumbers.format(1405), '۱۴۰۵');
    });

    it('formats a number with minimum width padding', () => {
        assert.equal(PersianNumbers.format(5, 3), '۰۰۵');
    });

    it('formats a negative number with Persian digits', () => {
        assert.equal(PersianNumbers.format(-12), '-۱۲');
    });

    it('formats zero', () => {
        assert.equal(PersianNumbers.format(0), '۰');
    });

    it('formats zero with padding', () => {
        assert.equal(PersianNumbers.format(0, 3), '۰۰۰');
    });

    it('formats with minDigits of 0', () => {
        assert.equal(PersianNumbers.format(123, 0), '۱۲۳');
    });

    it('formats large numbers', () => {
        assert.equal(PersianNumbers.format(123456789), '۱۲۳۴۵۶۷۸۹');
    });

    it('formats single digit', () => {
        assert.equal(PersianNumbers.format(7), '۷');
    });

    it('parses Latin digits', () => {
        assert.equal(PersianNumbers.parse('2026'), 2026);
    });

    it('parses Persian digits', () => {
        assert.equal(PersianNumbers.parse('۲۰۲۶'), 2026);
    });

    it('parses mixed Latin and Persian digits', () => {
        assert.equal(PersianNumbers.parse('2۰2۶'), 2026);
    });

    it('parses a negative Latin number', () => {
        assert.equal(PersianNumbers.parse('-1405'), -1405);
    });

    it('parses a negative Persian number', () => {
        assert.equal(PersianNumbers.parse('-۱۴۰۵'), -1405);
    });

    it('parses a number with + prefix', () => {
        assert.equal(PersianNumbers.parse('+123'), 123);
    });

    it('parses a Persian number with + prefix', () => {
        assert.equal(PersianNumbers.parse('+۱۲۳'), 123);
    });

    it('parses a number with Unicode minus (−)', () => {
        assert.equal(PersianNumbers.parse('−۱۲۳'), -123);
    });

    it('parses a number with leading zeros and Latin digits', () => {
        assert.equal(PersianNumbers.parse('0007'), 7);
    });

    it('parses a number with leading zeros and Persian digits', () => {
        assert.equal(PersianNumbers.parse('۰۰۰۷'), 7);
    });

    it('parses a number with leading zeros and mixed digits', () => {
        assert.equal(PersianNumbers.parse('۰۰07'), 7);
    });

    it('parses Latin zero', () => {
        assert.equal(PersianNumbers.parse('0'), 0);
    });

    it('parses Persian zero', () => {
        assert.equal(PersianNumbers.parse('۰'), 0);
    });

    it('parses a number with leading and trailing whitespace', () => {
        assert.equal(PersianNumbers.parse('  ۱۴۰۵  '), 1405);
    });

    it('throws on invalid numeric input', () => {
        assert.throws(() => PersianNumbers.parse('۱۴۰۵A'), Error);
    });

    it('throws on empty string input', () => {
        assert.throws(() => PersianNumbers.parse(''), Error);
    });

    it('throws on whitespace-only input', () => {
        assert.throws(() => PersianNumbers.parse('   '), Error);
    });

    it('throws on sign-only input', () => {
        assert.throws(() => PersianNumbers.parse('-'), Error);
    });

    it('throws on + sign only', () => {
        assert.throws(() => PersianNumbers.parse('+'), Error);
    });

    it('throws on invalid characters in middle', () => {
        assert.throws(() => PersianNumbers.parse('12A34'), Error);
    });

    it('throws on mixed valid and invalid characters', () => {
        assert.throws(() => PersianNumbers.parse('۱۲.۳۴'), Error);
    });

    it('parses large numbers', () => {
        assert.equal(PersianNumbers.parse('123456789'), 123456789);
    });

    it('parses large Persian numbers', () => {
        assert.equal(PersianNumbers.parse('۱۲۳۴۵۶۷۸۹'), 123456789);
    });

    it('parses negative zero as zero', () => {
        const result = PersianNumbers.parse('-0');
        // -0 and 0 are considered equal in non-strict comparison
        assert.ok(result === 0 || result === -0);
    });

    it('parses number with many leading zeros', () => {
        assert.equal(PersianNumbers.parse('000000123'), 123);
    });
});
