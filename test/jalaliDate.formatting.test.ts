/**
 * Tests for JalaliDate formatting and serialization methods.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('format', () => {
    const date = new JalaliDate(1402, 6, 5);
    const dayName = date.dayOfWeekName;

    const cases: Array<[string, string]> = [
        ['YYYY', '۱۴۰۲'],
        ['YY', '۰۲'],
        ['M', '۶'],
        ['MM', '۰۶'],
        ['MMMM', 'شهریور'],
        ['D', '۵'],
        ['DD', '۰۵'],
        ['DDDD', dayName],
        ['YYYY/MM/DD', '۱۴۰۲/۰۶/۰۵'],
        ['DDDD، D MMMM YYYY', `${dayName}، ۵ شهریور ۱۴۰۲`],
        ['"Year: "YYYY', 'Year: ۱۴۰۲'],
        ["'Date: 'YYYY/M/D", 'Date: ۱۴۰۲/۶/۵'],
        ['YYYY"-"MM"-"DD', '۱۴۰۲-۰۶-۰۵'],
    ];

    for (const [pattern, expected] of cases) {
        it(`formats pattern ${JSON.stringify(pattern)}`, () => {
            assert.equal(date.format(pattern), expected);
        });
    }

    it('formats all Persian month names', () => {
        const monthNames = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
        ];

        for (let month = 1; month <= 12; month++) {
            assert.equal(new JalaliDate(1402, month, 1).format('MMMM'), monthNames[month - 1]);
        }
    });

    it('formats negative years with Persian digits and sign', () => {
        assert.equal(new JalaliDate(-1, 1, 1).format('YYYY/MM/DD'), '-۰۰۰۱/۰۱/۰۱');
    });
});

describe('format RLM option', () => {
    const date = new JalaliDate(1402, 6, 5);
    const dayName = date.dayOfWeekName;

    it('does not add RLM by default or with "never"', () => {
        assert.equal(date.format('D MMMM YYYY'), '۵ شهریور ۱۴۰۲');
        assert.equal(date.format('D MMMM YYYY', 'never'), '۵ شهریور ۱۴۰۲');
    });

    it('always adds RLM with "always"', () => {
        assert.equal(date.format('D MMMM YYYY', 'always'), '\u200F۵ شهریور ۱۴۰۲');
        assert.equal(date.format('DDDD D MMMM YYYY', 'always'), `\u200F${dayName} ۵ شهریور ۱۴۰۲`);
    });

    it('adds RLM automatically only when formatted text starts with a Persian digit', () => {
        assert.equal(date.format('YYYY/MM/DD', 'auto'), '\u200F۱۴۰۲/۰۶/۰۵');
        assert.equal(date.format('D MMMM YYYY', 'auto'), '\u200F۵ شهریور ۱۴۰۲');
        assert.equal(date.format('DDDD D MMMM YYYY', 'auto'), `${dayName} ۵ شهریور ۱۴۰۲`);
    });
});

describe('toString and toJSON', () => {
    it('toString returns zero-padded Jalali YYYY/MM/DD using Latin digits', () => {
        assert.equal(new JalaliDate(1402, 6, 5).toString(), '1402/06/05');
    });

    it('toString formats negative years with the sign before zero-padding', () => {
        assert.equal(new JalaliDate(-1, 1, 1).toString(), '-0001/01/01');
    });

    it('toJSON returns the same value as toString', () => {
        const date = new JalaliDate(1402, 6, 5);

        assert.equal(date.toJSON(), date.toString());
        assert.equal(JSON.stringify({ date }), '{"date":"1402/06/05"}');
    });
});
