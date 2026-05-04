/**
 * Tests for JalaliDate formatting methods
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('format method', () => {
    const d = new JalaliDate(1402, 6, 5);

    it('formats with YYYY', () => {
        assert.equal(d.format('YYYY'), '۱۴۰۲');
    });

    it('formats with YY', () => {
        assert.equal(d.format('YY'), '۰۲');
    });

    it('formats with M', () => {
        assert.equal(d.format('M'), '۶');
    });

    it('formats with MM', () => {
        assert.equal(d.format('MM'), '۰۶');
    });

    it('formats with MMMM', () => {
        assert.equal(d.format('MMMM'), 'شهریور');
    });

    it('formats with D', () => {
        assert.equal(d.format('D'), '۵');
    });

    it('formats with DD', () => {
        assert.equal(d.format('DD'), '۰۵');
    });

    it('formats with DDDD', () => {
        const dow = d.dayOfWeek;
        const expected = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'][dow];
        assert.equal(d.format('DDDD'), expected);
    });

    it('formats with combined pattern YYYY/MM/DD', () => {
        assert.equal(d.format('YYYY/MM/DD'), '۱۴۰۲/۰۶/۰۵');
    });

    it('formats with combined pattern DDDD، D MMMM YYYY', () => {
        const dow = d.dayOfWeek;
        const dayName = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'][dow];
        assert.equal(d.format('DDDD، D MMMM YYYY'), `${dayName}، ۵ شهریور ۱۴۰۲`);
    });

    it('formats with double-quoted literal text', () => {
        assert.equal(d.format('"Year: "YYYY'), 'Year: ۱۴۰۲');
    });

    it('formats with single-quoted literal text', () => {
        assert.equal(d.format("'Date: 'YYYY/M/D"), 'Date: ۱۴۰۲/۶/۵');
    });

    it('formats with mixed literal and tokens', () => {
        assert.equal(d.format('YYYY"-"MM"-"DD'), '۱۴۰۲-۰۶-۰۵');
    });

    it('formats all month names correctly', () => {
        const monthNames = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ];
        for (let m = 1; m <= 12; m++) {
            const date = new JalaliDate(1402, m, 1);
            assert.equal(date.format('MMMM'), monthNames[m - 1]);
        }
    });

    it('formats day 31 correctly', () => {
        const d31 = new JalaliDate(1402, 1, 31);
        assert.equal(d31.format('DD'), '۳۱');
    });
});

describe('toString / toJSON', () => {
    it('toString returns "yyyy/MM/dd"', () => {
        assert.equal(new JalaliDate(1402, 6, 5).toString(), '1402/06/05');
    });

    it('toJSON returns the same string', () => {
        const d = new JalaliDate(1402, 6, 5);
        assert.equal(d.toJSON(), d.toString());
    });
});

describe('format with RLM parameter', () => {
    const d = new JalaliDate(1402, 6, 5);

    it('does not add RLM by default (never)', () => {
        const formatted = d.format('D MMMM YYYY');
        assert.equal(formatted, '۵ شهریور ۱۴۰۲');
        assert.ok(!formatted.startsWith('\u200F'));
    });

    it('does not add RLM with explicit "never"', () => {
        const formatted = d.format('D MMMM YYYY', 'never');
        assert.equal(formatted, '۵ شهریور ۱۴۰۲');
        assert.ok(!formatted.startsWith('\u200F'));
    });

    it('always adds RLM with "always" option', () => {
        const formatted = d.format('D MMMM YYYY', 'always');
        assert.equal(formatted, '\u200F۵ شهریور ۱۴۰۲');
        assert.ok(formatted.startsWith('\u200F'));
    });

    it('always adds RLM even when starting with text', () => {
        const formatted = d.format('DDDD D MMMM YYYY', 'always');
        assert.ok(formatted.startsWith('\u200F'));
    });

    it('adds RLM with "auto" when starting with Persian digit', () => {
        const formatted = d.format('D MMMM YYYY', 'auto');
        assert.equal(formatted, '\u200F۵ شهریور ۱۴۰۲');
        assert.ok(formatted.startsWith('\u200F'));
    });

    it('does not add RLM with "auto" when starting with text', () => {
        const formatted = d.format('DDDD D MMMM YYYY', 'auto');
        assert.ok(!formatted.startsWith('\u200F'));
    });

    it('adds RLM with "auto" for date starting with year', () => {
        const formatted = d.format('YYYY/MM/DD', 'auto');
        assert.equal(formatted, '\u200F۱۴۰۲/۰۶/۰۵');
        assert.ok(formatted.startsWith('\u200F'));
    });

    it('adds RLM with "auto" for 2-digit year', () => {
        const formatted = d.format('YY/M/D', 'auto');
        assert.ok(formatted.startsWith('\u200F'));
    });
});
