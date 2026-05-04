/**
 * Tests for JalaliDate.parse method
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('JalaliDate.parse', () => {
    it('parses "1402/06/31" with default pattern', () => {
        const d = JalaliDate.parse('1402/06/31');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('parses "31-06-1402" with custom pattern', () => {
        const d = JalaliDate.parse('31-06-1402', 'dd-MM-yyyy');
        assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: 1402, month: 6, day: 31 });
    });

    it('parses Persian digits', () => {
        const d = JalaliDate.parse('۱۴۰۲/۰۶/۳۱');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('parses mixed Latin and Persian digits', () => {
        const d = JalaliDate.parse('14۰2/6/۳1');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('parses with month name (MMMM)', () => {
        const d = JalaliDate.parse('31 شهریور 1402', 'D MMMM YYYY');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('parses all month names correctly', () => {
        const monthNames = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ];
        for (let m = 0; m < monthNames.length; m++) {
            const d = JalaliDate.parse(`15 ${monthNames[m]} 1402`, 'D MMMM YYYY');
            assert.equal(d.month, m + 1);
        }
    });

    it('parses with day of week (DDDD is ignored)', () => {
        const d = JalaliDate.parse('جمعه 1402/6/31', 'DDDD YYYY/M/D');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('parses with quoted literal text', () => {
        const d = JalaliDate.parse('Year: 1402, Month: 6, Day: 31', '"Year: "YYYY", Month: "M", Day: "D');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('parses with single-quoted literal text', () => {
        const d = JalaliDate.parse('Date: 1402-6-31', "'Date: 'YYYY-M-D");
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('parses 2-digit year (YY)', () => {
        const d = JalaliDate.parse('02/6/31', 'YY/M/D');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('parses zero-padded day and month (DD and MM)', () => {
        const d = JalaliDate.parse('1402-06-09', 'YYYY-MM-DD');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 9);
    });

    it('parses non-zero-padded day and month (D and M)', () => {
        const d = JalaliDate.parse('1402/6/9', 'YYYY/M/D');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 9);
    });

    it('parses with different separators', () => {
        const d = JalaliDate.parse('1402.06.31', 'YYYY.MM.DD');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('throws for unrecognised string', () => {
        assert.throws(() => JalaliDate.parse('not-a-date'), Error);
    });

    it('throws for mismatched pattern', () => {
        assert.throws(() => JalaliDate.parse('1402/06/31', 'DD-MM-YYYY'), Error);
    });

    it('throws for unrecognized month name', () => {
        assert.throws(() => JalaliDate.parse('31 InvalidMonth 1402', 'D MMMM YYYY'), Error);
    });

    it('throws for out-of-range date', () => {
        assert.throws(() => JalaliDate.parse('1402/13/1'), RangeError);
    });

    it('throws for out-of-range day', () => {
        assert.throws(() => JalaliDate.parse('1402/6/32'), RangeError);
    });

    it('throws for invalid input that partially matches', () => {
        assert.throws(() => JalaliDate.parse('1402/6'), Error);
    });

    it('throws when required components are missing', () => {
        assert.throws(() => JalaliDate.parse('1402', 'YYYY/M/D'), Error);
    });

    it('parses with extra whitespace handled by pattern', () => {
        const d = JalaliDate.parse('1402 / 6 / 31', 'YYYY / M / D');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('strips leading and trailing whitespace from input', () => {
        const d = JalaliDate.parse('  1402/6/31  ');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('strips leading and trailing whitespace from pattern', () => {
        const d = JalaliDate.parse('1402-06-31', '  YYYY-MM-DD  ');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('strips RLM (Right-to-Left Mark) from input', () => {
        const d = JalaliDate.parse('\u200F1402/6/31');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('strips LRM (Left-to-Right Mark) from input', () => {
        const d = JalaliDate.parse('\u200E1402/6/31');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('strips ALM (Arabic Letter Mark) from input', () => {
        const d = JalaliDate.parse('\u061C1402/6/31');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('strips bidirectional marks from pattern', () => {
        const d = JalaliDate.parse('1402-06-31', '\u200FYYYY-MM-DD');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('strips multiple bidirectional marks from input', () => {
        const d = JalaliDate.parse('\u200F\u200E1402\u061C/6/31');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('handles whitespace and bidirectional marks together', () => {
        const d = JalaliDate.parse('  \u200F1402/6/31\u200E  ', '  YYYY/M/D  ');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });

    it('parses Persian digits with RLM prefix', () => {
        const d = JalaliDate.parse('\u200F۱۴۰۲/۰۶/۳۱');
        assert.equal(d.year, 1402);
        assert.equal(d.month, 6);
        assert.equal(d.day, 31);
    });
});
