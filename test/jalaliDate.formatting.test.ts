/**
 * Tests for JalaliDate formatting and serialization methods.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('JalaliDate.format', () => {
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
        ['Q', 'تابستان'],
        ['YYYY/MM/DD', '۱۴۰۲/۰۶/۰۵'],
        ['DDDD، D MMMM YYYY', `${dayName}، ۵ شهریور ۱۴۰۲`],
        ['"Year: "YYYY', 'Year: ۱۴۰۲'],
        ["'Date: 'YYYY/M/D", 'Date: ۱۴۰۲/۶/۵'],
        ['YYYY"-"MM"-"DD', '۱۴۰۲-۰۶-۰۵'],
        ['[jalali:YYYY/MM/DD]', '۱۴۰۲/۰۶/۰۵'],
        ['[jalali:D MMMM YYYY]', '۵ شهریور ۱۴۰۲'],
        ['[gregorian:YYYY/MM/DD]', '۲۰۲۳/۰۸/۲۷'],
        ['[gregorian:YY/M/D]', '۲۳/۸/۲۷'],
        ['[gregorian:D MMMM YYYY]', '۲۷ اوت ۲۰۲۳'],
        ['[gregorian:DDDD]', dayName],
        ['[gregorian:Q]', 'Q'],
        ['YYYY/MM/DD برابر با [gregorian:YYYY/MM/DD]', '۱۴۰۲/۰۶/۰۵ برابر با ۲۰۲۳/۰۸/۲۷'],
        ['[[YYYY/MM/DD]]', '[۱۴۰۲/۰۶/۰۵]'],
        ['[gregorian:[[YYYY/MM/DD]]]', '[۲۰۲۳/۰۸/۲۷]'],
        ['"[gregorian:YYYY/MM/DD]" YYYY/MM/DD', '[gregorian:YYYY/MM/DD] ۱۴۰۲/۰۶/۰۵'],
    ];

    for (const [pattern, expected] of cases) {
        it(`formats pattern ${JSON.stringify(pattern)}`, () => {
            assert.equal(date.format(pattern), expected);
        });
    }

    it('throws for malformed calendar scopes', () => {
        assert.throws(
            () => date.format('[gregorian:YYYY/MM/DD'),
            /Unclosed calendar scope/
        );
        assert.throws(
            () => date.format('[julian:YYYY/MM/DD]'),
            /Unsupported calendar scope "julian"/
        );
        assert.throws(
            () => date.format('[gregorian] YYYY/MM/DD'),
            /Malformed calendar scope/
        );
        assert.throws(
            () => date.format('[gregorian:[jalali:YYYY/MM/DD]]'),
            /Nested calendar scopes are not supported/
        );
        assert.throws(
            () => date.format('YYYY/MM/DD]'),
            /Unmatched closing bracket/
        );
    });

    it('formats all Persian quarter names', () => {
        const quarterNames = ['بهار', 'تابستان', 'پاییز', 'زمستان'];
        const quarterMonths = [1, 4, 7, 10];
        for (let i = 0; i < 4; i++) {
            assert.equal(new JalaliDate(1402, quarterMonths[i]!, 1).format('Q'), quarterNames[i]);
        }
    });

    it('formats all Persian Jalali month names', () => {
        const monthNames = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
        ];

        for (let month = 1; month <= 12; month++) {
            assert.equal(new JalaliDate(1402, month, 1).format('MMMM'), monthNames[month - 1]);
        }
    });

    it('formats all Persian Gregorian month names', () => {
        const cases: Array<[JalaliDate, string]> = [
            [JalaliDate.fromGregorian(2023, 1, 1), 'ژانویه'],
            [JalaliDate.fromGregorian(2023, 2, 1), 'فوریه'],
            [JalaliDate.fromGregorian(2023, 3, 1), 'مارس'],
            [JalaliDate.fromGregorian(2023, 4, 1), 'آوریل'],
            [JalaliDate.fromGregorian(2023, 5, 1), 'مه'],
            [JalaliDate.fromGregorian(2023, 6, 1), 'ژوئن'],
            [JalaliDate.fromGregorian(2023, 7, 1), 'ژوئیه'],
            [JalaliDate.fromGregorian(2023, 8, 1), 'اوت'],
            [JalaliDate.fromGregorian(2023, 9, 1), 'سپتامبر'],
            [JalaliDate.fromGregorian(2023, 10, 1), 'اکتبر'],
            [JalaliDate.fromGregorian(2023, 11, 1), 'نوامبر'],
            [JalaliDate.fromGregorian(2023, 12, 1), 'دسامبر'],
        ];

        for (const [date, expected] of cases) {
            assert.equal(date.format('[gregorian:MMMM]'), expected);
        }
    });

    it('formats negative years with Persian digits and sign', () => {
        assert.equal(new JalaliDate(-1, 1, 1).format('YYYY/MM/DD'), '-۰۰۰۱/۰۱/۰۱');
    });
});

describe('JalaliDate.format with RLM option', () => {
    const date = new JalaliDate(1402, 6, 5);
    const dayName = date.dayOfWeekName;

    it('does not add RLM by default or with "never"', () => {
        assert.equal(date.format('D MMMM YYYY'), '۵ شهریور ۱۴۰۲');
        assert.equal(date.format('D MMMM YYYY', 'never'), '۵ شهریور ۱۴۰۲');
        assert.equal(date.format('D MMMM YYYY', { rlm: 'never' }), '۵ شهریور ۱۴۰۲');
        assert.equal(date.format('D MMMM YYYY', {}), '۵ شهریور ۱۴۰۲');
    });

    it('always adds RLM with "always"', () => {
        assert.equal(date.format('D MMMM YYYY', 'always'), '\u200F۵ شهریور ۱۴۰۲');
        assert.equal(date.format('DDDD D MMMM YYYY', 'always'), `\u200F${dayName} ۵ شهریور ۱۴۰۲`);
        assert.equal(date.format('D MMMM YYYY', { rlm: 'always' }), '\u200F۵ شهریور ۱۴۰۲');
        assert.equal(date.format('DDDD D MMMM YYYY', { rlm: 'always' }), `\u200F${dayName} ۵ شهریور ۱۴۰۲`);
    });

    it('adds RLM automatically only when formatted text starts with a Persian digit', () => {
        assert.equal(date.format('YYYY/MM/DD', 'auto'), '\u200F۱۴۰۲/۰۶/۰۵');
        assert.equal(date.format('D MMMM YYYY', 'auto'), '\u200F۵ شهریور ۱۴۰۲');
        assert.equal(date.format('DDDD D MMMM YYYY', 'auto'), `${dayName} ۵ شهریور ۱۴۰۲`);
        assert.equal(date.format('YYYY/MM/DD', { rlm: 'auto' }), '\u200F۱۴۰۲/۰۶/۰۵');
        assert.equal(date.format('D MMMM YYYY', { rlm: 'auto' }), '\u200F۵ شهریور ۱۴۰۲');
        assert.equal(date.format('DDDD D MMMM YYYY', { rlm: 'auto' }), `${dayName} ۵ شهریور ۱۴۰۲`);
    });
});

describe('JalaliDate.toString', () => {
    it('toString returns zero-padded Jalali YYYY/MM/DD using Latin digits', () => {
        assert.equal(new JalaliDate(1402, 6, 5).toString(), '1402/06/05');
    });

    it('toString formats negative years with the sign before zero-padding', () => {
        assert.equal(new JalaliDate(-1, 1, 1).toString(), '-0001/01/01');
    });
});


describe('JalaliDate.toJSON', () => {
    it('toJSON returns zero-padded Jalali YYYY/MM/DD using Latin digits', () => {
        assert.equal(new JalaliDate(1402, 6, 5).toJSON(), '1402/06/05');
    });

    it('toJSON formats negative years with the sign before zero-padding', () => {
        assert.equal(new JalaliDate(-1, 1, 1).toJSON(), '-0001/01/01');
    });
});
