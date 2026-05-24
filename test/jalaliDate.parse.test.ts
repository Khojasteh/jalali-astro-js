/**
 * Tests for JalaliDate.parse.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JalaliDate } from '../src/jalaliDate.ts';

describe('JalaliDate.parse', () => {
    const cases: Array<{
        input: string;
        pattern?: string;
        expected: { year: number; month: number; day: number };
    }> = [
            { input: '1402/06/31', expected: { year: 1402, month: 6, day: 31 } },
            { input: '۱۴۰۲/۰۶/۳۱', expected: { year: 1402, month: 6, day: 31 } },
            { input: '14۰2/6/۳1', expected: { year: 1402, month: 6, day: 31 } },
            { input: '31-06-1402', pattern: 'DD-MM-YYYY', expected: { year: 1402, month: 6, day: 31 } },
            { input: '31 شهریور 1402', pattern: 'D MMMM YYYY', expected: { year: 1402, month: 6, day: 31 } },
            { input: 'جمعه 1402/6/31', pattern: 'DDDD YYYY/M/D', expected: { year: 1402, month: 6, day: 31 } },
            { input: 'تابستان 1402/6/31', pattern: 'Q YYYY/M/D', expected: { year: 1402, month: 6, day: 31 } },
            { input: 'Year: 1402, Month: 6, Day: 31', pattern: '"Year: "YYYY", Month: "M", Day: "D', expected: { year: 1402, month: 6, day: 31 } },
            { input: 'Date: 1402-6-31', pattern: "'Date: 'YYYY-M-D", expected: { year: 1402, month: 6, day: 31 } },
            { input: '  1402/6/31  ', expected: { year: 1402, month: 6, day: 31 } },
            { input: '\u200F۱۴۰۲/۰۶/۳۱', expected: { year: 1402, month: 6, day: 31 } },
            { input: '\u200F\u200E1402\u061C/6/31', expected: { year: 1402, month: 6, day: 31 } },
            { input: '1402-06-31', pattern: '  YYYY-MM-DD  ', expected: { year: 1402, month: 6, day: 31 } },
        ];

    for (const { input, pattern, expected } of cases) {
        it(`parses ${JSON.stringify(input)}${pattern ? ` with ${JSON.stringify(pattern)}` : ''}`, () => {
            const result = pattern === undefined ? JalaliDate.parse(input) : JalaliDate.parse(input, pattern);
            assert.deepEqual(result.toObject(), expected);
        });
    }

    it('parses every Persian month name', () => {
        const monthNames = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
        ];

        for (let index = 0; index < monthNames.length; index++) {
            const result = JalaliDate.parse(`15 ${monthNames[index]} 1402`, 'D MMMM YYYY');
            assert.deepEqual(
                result.toObject(),
                { year: 1402, month: index + 1, day: 15 }
            );
        }
    });

    it('ignores the quarter token value but still requires a valid Persian quarter name', () => {
        const parsed = JalaliDate.parse('تابستان 1402/6/31', 'Q YYYY/M/D');
        assert.deepEqual(
            parsed.toObject(),
            { year: 1402, month: 6, day: 31 }
        );
    });

    it('ignores the day-of-week token value but still requires a valid Persian day name', () => {
        const parsed = JalaliDate.parse('جمعه 1402/6/31', 'DDDD YYYY/M/D');
        assert.deepEqual(
            parsed.toObject(),
            { year: 1402, month: 6, day: 31 }
        );
    });

    it('expands YY to the nearest full year near the start of a Jalali century', () => {
        JalaliDate.setTestToday(new JalaliDate(1405, 3, 3));
        const cases: Array<[input: string, expectedYear: number]> = [
            ['00/1/1', 1400],
            ['02/1/1', 1402],
            ['10/1/1', 1410],
            ['92/1/1', 1392],
            ['99/1/1', 1399],
        ];

        try {
            for (const [input, expectedYear] of cases) {
                assert.deepEqual(
                    JalaliDate.parse(input, 'YY/M/D').toObject(),
                    { year: expectedYear, month: 1, day: 1 }
                );
            }
        } finally {
            JalaliDate.setTestToday(null);
        }
    });

    it('expands YY to the nearest full year near the end of a Jalali century', () => {
        JalaliDate.setTestToday(new JalaliDate(1492, 1, 1));
        const cases: Array<[input: string, expectedYear: number]> = [
            ['05/1/1', 1505],
            ['88/1/1', 1488],
            ['92/1/1', 1492],
            ['99/1/1', 1499],
        ];

        try {
            for (const [input, expectedYear] of cases) {
                assert.deepEqual(
                    JalaliDate.parse(input, 'YY/M/D').toObject(),
                    { year: expectedYear, month: 1, day: 1 }
                );
            }
        } finally {
            JalaliDate.setTestToday(null);
        }
    });

    it('rejects invalid strings and patterns', () => {
        const invalidCases: Array<[string, string?]> = [
            [''],
            ['1402/06'],
            ['1402/06/31 extra'],
            ['1402-06-31'],
            ['31 Unknown 1402', 'D MMMM YYYY'],
            ['1402/13/01'],
            ['1402/07/31'],
            ['1402/12/30'],
            ['Year: 1402, Month: 6, Day: 31', '"Wrong: "YYYY", Month: "M", Day: "D'],
            ['1402/06/31', 'YYYY/MM'],
            ['1402/06/31', 'YYYY/MM/DDDD'],
            ['InvalidDay 1402/6/31', 'DDDD YYYY/M/D'],
            ['InvalidQuarter 1402/6/31', 'Q YYYY/M/D'],
            ['شنبه 1402/6/31', 'DDDD YYYY/M/D'],  // 1402/6/31 is Friday not Saturday
            ['بهار 1402/6/31', 'Q YYYY/M/D'],     // month 6 is in Tabestan not Bahar
            ['100/1/1', 'YY/M/D'],
        ];

        for (const [input, pattern] of invalidCases) {
            assert.throws(
                () => JalaliDate.parse(input, pattern),
                Error,
                pattern === undefined
                    ? `Expected parse(${JSON.stringify(input)}) to throw`
                    : `Expected parse(${JSON.stringify(input)}, ${JSON.stringify(pattern)}) to throw`
            );
        }
    });
});
