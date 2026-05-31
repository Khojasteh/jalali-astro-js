/**
 * Tests for date pattern parsing and compilation helpers.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compilePattern, getFormatSegments, parsePattern, type PatternSegment } from '../src/datePattern.ts';

function assertSegments(pattern: string, expected: PatternSegment[]): void {
    assert.deepEqual(parsePattern(pattern), expected);
}

describe('parsePattern', () => {
    it('parses Jalali tokens outside scoped calendar blocks', () => {
        assertSegments('YYYY/MM/DD', [
            { kind: 'token', calendar: 'jalali', token: 'YYYY' },
            { kind: 'literal', text: '/' },
            { kind: 'token', calendar: 'jalali', token: 'MM' },
            { kind: 'literal', text: '/' },
            { kind: 'token', calendar: 'jalali', token: 'DD' },
        ]);
    });

    it('parses explicit Jalali scoped blocks the same as the default calendar', () => {
        assertSegments('[jalali:YYYY/M/D]', [
            { kind: 'token', calendar: 'jalali', token: 'YYYY' },
            { kind: 'literal', text: '/' },
            { kind: 'token', calendar: 'jalali', token: 'M' },
            { kind: 'literal', text: '/' },
            { kind: 'token', calendar: 'jalali', token: 'D' },
        ]);
    });

    it('parses Gregorian scoped blocks with Gregorian token context', () => {
        assertSegments('[gregorian:YYYY-MM-DD]', [
            { kind: 'token', calendar: 'gregorian', token: 'YYYY' },
            { kind: 'literal', text: '-' },
            { kind: 'token', calendar: 'gregorian', token: 'MM' },
            { kind: 'literal', text: '-' },
            { kind: 'token', calendar: 'gregorian', token: 'DD' },
        ]);
    });

    it('parses mixed Jalali and Gregorian patterns in capture order', () => {
        assertSegments('YYYY/M/D برابر با [gregorian:YYYY/M/D]', [
            { kind: 'token', calendar: 'jalali', token: 'YYYY' },
            { kind: 'literal', text: '/' },
            { kind: 'token', calendar: 'jalali', token: 'M' },
            { kind: 'literal', text: '/' },
            { kind: 'token', calendar: 'jalali', token: 'D' },
            { kind: 'literal', text: ' برابر با ' },
            { kind: 'token', calendar: 'gregorian', token: 'YYYY' },
            { kind: 'literal', text: '/' },
            { kind: 'token', calendar: 'gregorian', token: 'M' },
            { kind: 'literal', text: '/' },
            { kind: 'token', calendar: 'gregorian', token: 'D' },
        ]);
    });

    it('treats quoted square brackets as literal brackets outside scoped blocks', () => {
        assertSegments('"["YYYY/MM/DD"]"', [
            { kind: 'literal', text: '[' },
            { kind: 'token', calendar: 'jalali', token: 'YYYY' },
            { kind: 'literal', text: '/' },
            { kind: 'token', calendar: 'jalali', token: 'MM' },
            { kind: 'literal', text: '/' },
            { kind: 'token', calendar: 'jalali', token: 'DD' },
            { kind: 'literal', text: ']' },
        ]);
    });

    it('treats quoted square brackets as literal brackets inside scoped blocks', () => {
        assertSegments('[gregorian:"["YYYY/MM/DD"]"]', [
            { kind: 'literal', text: '[' },
            { kind: 'token', calendar: 'gregorian', token: 'YYYY' },
            { kind: 'literal', text: '/' },
            { kind: 'token', calendar: 'gregorian', token: 'MM' },
            { kind: 'literal', text: '/' },
            { kind: 'token', calendar: 'gregorian', token: 'DD' },
            { kind: 'literal', text: ']' },
        ]);
    });

    it('preserves quoted literals and does not scan tokens inside quotes', () => {
        assertSegments('YYYY "Year" \'MMMM\'', [
            { kind: 'token', calendar: 'jalali', token: 'YYYY' },
            { kind: 'literal', text: ' Year MMMM' },
        ]);
    });

    it('allows single quotes inside double-quoted literals', () => {
        assertSegments('"Year\'s value: "YYYY', [
            { kind: 'literal', text: "Year's value: " },
            { kind: 'token', calendar: 'jalali', token: 'YYYY' },
        ]);
    });

    it('allows double quotes inside single-quoted literals', () => {
        assertSegments('\'He said "date": \'YYYY', [
            { kind: 'literal', text: 'He said "date": ' },
            { kind: 'token', calendar: 'jalali', token: 'YYYY' },
        ]);
    });

    it('treats scope-like blocks inside single-quoted text as literals', () => {
        assertSegments("'[gregorian:YYYY/MM/DD]' YYYY", [
            { kind: 'literal', text: '[gregorian:YYYY/MM/DD] ' },
            { kind: 'token', calendar: 'jalali', token: 'YYYY' },
        ]);
    });

    it('throws for unclosed double-quoted literals', () => {
        assert.throws(
            () => parsePattern('"unfinished YYYY'),
            /Unclosed quoted literal/
        );
    });

    it('throws for unclosed single-quoted literals', () => {
        assert.throws(
            () => parsePattern("'unfinished YYYY"),
            /Unclosed quoted literal/
        );
    });

    it('throws for unclosed calendar scopes', () => {
        assert.throws(
            () => parsePattern('[gregorian:YYYY/MM/DD'),
            /Unclosed calendar scope/
        );
    });

    it('throws for unsupported calendar scopes', () => {
        assert.throws(
            () => parsePattern('[julian:YYYY/MM/DD]'),
            /Unsupported calendar scope \"julian\"/
        );
    });

    it('throws for malformed scope-like blocks', () => {
        assert.throws(
            () => parsePattern('[gregorian] YYYY/MM/DD'),
            /Malformed calendar scope/
        );
    });

    it('throws for nested calendar scopes', () => {
        assert.throws(
            () => parsePattern('[gregorian:[jalali:YYYY/MM/DD]]'),
            /Nested calendar scopes are not supported/
        );
    });

    it('throws for unmatched closing brackets', () => {
        assert.throws(
            () => parsePattern('YYYY/MM/DD]'),
            /Unmatched closing bracket/
        );
    });

    it('treats scope-like blocks inside quoted text as literals', () => {
        assertSegments('"[gregorian:YYYY/MM/DD]" YYYY', [
            { kind: 'literal', text: '[gregorian:YYYY/MM/DD] ' },
            { kind: 'token', calendar: 'jalali', token: 'YYYY' },
        ]);
    });

    it('matches tokens greedily using the longest token first', () => {
        assertSegments('YYYY MMMM DDDD YY MM DD M D Q', [
            { kind: 'token', calendar: 'jalali', token: 'YYYY' },
            { kind: 'literal', text: ' ' },
            { kind: 'token', calendar: 'jalali', token: 'MMMM' },
            { kind: 'literal', text: ' ' },
            { kind: 'token', calendar: 'jalali', token: 'DDDD' },
            { kind: 'literal', text: ' ' },
            { kind: 'token', calendar: 'jalali', token: 'YY' },
            { kind: 'literal', text: ' ' },
            { kind: 'token', calendar: 'jalali', token: 'MM' },
            { kind: 'literal', text: ' ' },
            { kind: 'token', calendar: 'jalali', token: 'DD' },
            { kind: 'literal', text: ' ' },
            { kind: 'token', calendar: 'jalali', token: 'M' },
            { kind: 'literal', text: ' ' },
            { kind: 'token', calendar: 'jalali', token: 'D' },
            { kind: 'literal', text: ' ' },
            { kind: 'token', calendar: 'jalali', token: 'Q' },
        ]);
    });
});

describe('getFormatSegments', () => {
    it('returns cached parsed segments for the same pattern', () => {
        const first = getFormatSegments('[gregorian:YYYY/MM/DD]');
        const second = getFormatSegments('[gregorian:YYYY/MM/DD]');

        assert.strictEqual(first, second);
    });
});

describe('compilePattern', () => {
    it('compiles Jalali tokens into capture groups', () => {
        const compiled = compilePattern('YYYY/MM/DD');

        assert.deepEqual(compiled.captureGroups, [
            { calendar: 'jalali', type: 'year', token: 'YYYY' },
            { calendar: 'jalali', type: 'month', token: 'MM' },
            { calendar: 'jalali', type: 'day', token: 'DD' },
        ]);
        assert.match('۱۴۰۲/۰۶/۰۵', compiled.regex);
        assert.match('1402/06/05', compiled.regex);
        assert.equal(compiled.regex.test('1402-06-05'), false);
    });

    it('compiles mixed Jalali and Gregorian scoped tokens in capture order', () => {
        const compiled = compilePattern('YYYY/M/D [gregorian:YYYY-M-D]');

        assert.deepEqual(compiled.captureGroups, [
            { calendar: 'jalali', type: 'year', token: 'YYYY' },
            { calendar: 'jalali', type: 'month', token: 'M' },
            { calendar: 'jalali', type: 'day', token: 'D' },
            { calendar: 'gregorian', type: 'year', token: 'YYYY' },
            { calendar: 'gregorian', type: 'month', token: 'M' },
            { calendar: 'gregorian', type: 'day', token: 'D' },
        ]);
        assert.match('۱۴۰۲/۶/۵ ۲۰۲۳-۸-۲۷', compiled.regex);
    });

    it('compiles explicit Jalali scoped tokens as Jalali capture groups', () => {
        const compiled = compilePattern('[jalali:YYYY/M/D]');

        assert.deepEqual(compiled.captureGroups, [
            { calendar: 'jalali', type: 'year', token: 'YYYY' },
            { calendar: 'jalali', type: 'month', token: 'M' },
            { calendar: 'jalali', type: 'day', token: 'D' },
        ]);
        assert.match('۱۴۰۲/۶/۵', compiled.regex);
    });

    it('compiles quoted square brackets as literal brackets', () => {
        const compiled = compilePattern('"["YYYY/MM/DD"]"');

        assert.deepEqual(compiled.captureGroups, [
            { calendar: 'jalali', type: 'year', token: 'YYYY' },
            { calendar: 'jalali', type: 'month', token: 'MM' },
            { calendar: 'jalali', type: 'day', token: 'DD' },
        ]);
        assert.match('[۱۴۰۲/۰۶/۰۵]', compiled.regex);
        assert.equal(compiled.regex.test('۱۴۰۲/۰۶/۰۵'), false);
    });

    it('treats Gregorian quarter tokens as literals because Gregorian quarters are unsupported', () => {
        const compiled = compilePattern('[gregorian:Q YYYY]');

        assert.deepEqual(compiled.captureGroups, [
            { calendar: 'gregorian', type: 'year', token: 'YYYY' },
        ]);
        assert.match('Q ۲۰۲۳', compiled.regex);
        assert.equal(compiled.regex.test('تابستان ۲۰۲۳'), false);
    });

    it('throws when compiling nested calendar scopes', () => {
        assert.throws(
            () => compilePattern('[gregorian:[jalali:YYYY/MM/DD]]'),
            /Nested calendar scopes are not supported/
        );
    });

    it('compiles scope-like text inside quotes as a literal', () => {
        const compiled = compilePattern('"[gregorian:YYYY/MM/DD]" YYYY');

        assert.deepEqual(compiled.captureGroups, [
            { calendar: 'jalali', type: 'year', token: 'YYYY' },
        ]);
        assert.match('[gregorian:YYYY/MM/DD] ۱۴۰۲', compiled.regex);
    });

    it('throws when compiling unclosed quoted literals', () => {
        assert.throws(
            () => compilePattern('YYYY "- MMM'),
            /Unclosed quoted literal/
        );
    });

    it('returns cached compiled patterns for the same pattern', () => {
        const first = compilePattern('YYYY/MM/DD');
        const second = compilePattern('YYYY/MM/DD');

        assert.strictEqual(first, second, 'Expected the same compiled pattern instance');
    });
});
