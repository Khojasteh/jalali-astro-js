/**
 * Tests for src/persianNumbers.ts
 *
 * Verifies formatting and parsing of Persian-Indic integer strings.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PersianNumbers } from '../src/persianNumbers.ts';

describe('PersianNumbers.format', () => {
    const cases: Array<{
        value: number;
        expected: string;
        minDigits?: number;
    }> = [
            { value: 0, expected: '۰' },
            { value: 1, expected: '۱' },
            { value: 9, expected: '۹' },
            { value: 10, expected: '۱۰' },
            { value: 42, expected: '۴۲' },
            { value: 1234567890, expected: '۱۲۳۴۵۶۷۸۹۰' },

            { value: -1, expected: '-۱' },
            { value: -42, expected: '-۴۲' },
            { value: -1234567890, expected: '-۱۲۳۴۵۶۷۸۹۰' },

            { value: 0, minDigits: 2, expected: '۰۰' },
            { value: 0, minDigits: 4, expected: '۰۰۰۰' },
            { value: 7, minDigits: 2, expected: '۰۷' },
            { value: 42, minDigits: 5, expected: '۰۰۰۴۲' },
            { value: 123, minDigits: 2, expected: '۱۲۳' },

            { value: -7, minDigits: 2, expected: '-۰۷' },
            { value: -42, minDigits: 5, expected: '-۰۰۰۴۲' },
        ];

    for (const { value, minDigits, expected } of cases) {
        it(`formats ${value}${minDigits === undefined ? '' : ` with minDigits ${minDigits}`} as "${expected}"`, () => {
            assert.equal(
                PersianNumbers.format(value, minDigits),
                expected
            );
        });
    }

    it('throws for non-integer values', () => {
        const invalidValues = [
            1.5,
            -1.5,
            NaN,
            Infinity,
            -Infinity,
        ];

        for (const value of invalidValues) {
            assert.throws(
                () => PersianNumbers.format(value),
                Error,
                `Expected format(${value}) to throw`
            );
        }
    });
});

describe('PersianNumbers.parse', () => {
    const cases: Array<{
        input: string;
        expected: number;
    }> = [
            { input: '۰', expected: 0 },
            { input: '۱', expected: 1 },
            { input: '۹', expected: 9 },
            { input: '۱۰', expected: 10 },
            { input: '۴۲', expected: 42 },
            { input: '۱۲۳۴۵۶۷۸۹۰', expected: 1234567890 },

            { input: '0', expected: 0 },
            { input: '1', expected: 1 },
            { input: '9', expected: 9 },
            { input: '10', expected: 10 },
            { input: '42', expected: 42 },
            { input: '1234567890', expected: 1234567890 },

            { input: '۱۲3۴۵', expected: 12345 },
            { input: '1۲3۴5', expected: 12345 },

            { input: '-۱', expected: -1 },
            { input: '-۴۲', expected: -42 },
            { input: '-123', expected: -123 },
            { input: '-۱۲3', expected: -123 },

            { input: '−۱', expected: -1 },
            { input: '−۴۲', expected: -42 },
            { input: '−123', expected: -123 },

            { input: '+۱', expected: 1 },
            { input: '+۴۲', expected: 42 },
            { input: '+123', expected: 123 },
            { input: '+۱۲3', expected: 123 },

            { input: '  ۴۲  ', expected: 42 },
            { input: '\t-۱۲۳\n', expected: -123 },

            { input: '۰۰۷', expected: 7 },
            { input: '-۰۰۷', expected: -7 },
            { input: '+۰۰۷', expected: 7 },
        ];

    for (const { input, expected } of cases) {
        it(`parses "${input}" as ${expected}`, () => {
            assert.equal(
                PersianNumbers.parse(input),
                expected
            );
        });
    }

    it('throws for empty or whitespace-only strings', () => {
        const invalidInputs = [
            '',
            ' ',
            '   ',
            '\t',
            '\n',
            '\t\n ',
        ];

        for (const input of invalidInputs) {
            assert.throws(
                () => PersianNumbers.parse(input),
                Error,
                `Expected parse(${JSON.stringify(input)}) to throw`
            );
        }
    });

    it('throws for sign-only strings', () => {
        const invalidInputs = [
            '+',
            '-',
            '−',
            ' + ',
            ' - ',
            ' − ',
        ];

        for (const input of invalidInputs) {
            assert.throws(
                () => PersianNumbers.parse(input),
                Error,
                `Expected parse(${JSON.stringify(input)}) to throw`
            );
        }
    });

    it('throws for invalid characters', () => {
        const invalidInputs = [
            'abc',
            '۱۲a',
            'a۱۲',
            '۱۲ ۳',
            '1 2',
            '۴۲.۰',
            '42.0',
            '۴۲,۰۰۰',
            '42,000',
            '--1',
            '++1',
            '+-1',
            '-+1',
        ];

        for (const input of invalidInputs) {
            assert.throws(
                () => PersianNumbers.parse(input),
                Error,
                `Expected parse(${JSON.stringify(input)}) to throw`
            );
        }
    });
});

describe('PersianNumbers format/parse round-trip', () => {
    const values = [
        0,
        1,
        7,
        10,
        42,
        999,
        1234567890,
        -1,
        -7,
        -10,
        -42,
        -999,
        -1234567890,
    ];

    for (const value of values) {
        it(`round-trips ${value}`, () => {
            assert.equal(
                PersianNumbers.parse(PersianNumbers.format(value)),
                value
            );
        });
    }

    it('round-trips padded positive values', () => {
        assert.equal(PersianNumbers.parse(PersianNumbers.format(7, 3)), 7);
        assert.equal(PersianNumbers.parse(PersianNumbers.format(42, 5)), 42);
    });

    it('round-trips padded negative values', () => {
        assert.equal(PersianNumbers.parse(PersianNumbers.format(-7, 3)), -7);
        assert.equal(PersianNumbers.parse(PersianNumbers.format(-42, 5)), -42);
    });
});