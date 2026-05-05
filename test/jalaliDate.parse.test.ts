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
            { input: 'Year: 1402, Month: 6, Day: 31', pattern: '"Year: "YYYY", Month: "M", Day: "D', expected: { year: 1402, month: 6, day: 31 } },
            { input: 'Date: 1402-6-31', pattern: "'Date: 'YYYY-M-D", expected: { year: 1402, month: 6, day: 31 } },
            { input: '02/6/31', pattern: 'YY/M/D', expected: { year: 1402, month: 6, day: 31 } },
            { input: '99/6/31', pattern: 'YY/M/D', expected: { year: 1399, month: 6, day: 31 } },
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

    it('ignores the day-of-week token instead of validating it against the actual date', () => {
        const parsed = JalaliDate.parse('جمعه 1402/6/31', 'DDDD YYYY/M/D');
        assert.deepEqual(
            parsed.toObject(),
            { year: 1402, month: 6, day: 31 }
        );
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
