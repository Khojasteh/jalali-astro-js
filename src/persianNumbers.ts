/**
 * Formatting and parsing of Persian numbers.
 *
 * This module converts between Latin digits and Persian-Indic digits,
 * and parses signed integer strings containing Latin, Persian, or mixed digits.
 */

const ASCII_ZERO = '0'.charCodeAt(0);
const PERSIAN_ZERO = '\u06F0'.charCodeAt(0);

/**
 * Utility class for formatting and parsing Persian integer numbers.
 */
export class PersianNumbers {
    /**
     * Converts an integer number to a string using Persian-Indic digits, with optional minimum width padding.
     *
     * @param value    - The number to convert.
     * @param minDigits - Minimum number of digits to output, padded with leading zeros if necessary (default is zero).
     * @returns The number as a string of Persian-Indic digits.
     * @throws {Error} If the value is not an integer.
     */
    static format(value: number, minDigits = 0): string {
        if (!Number.isInteger(value)) {
            throw new Error('Value must be an integer.');
        }

        const digits: string[] = [];
        let n = Math.abs(value);

        do {
            digits.push(String.fromCharCode(PERSIAN_ZERO + (n % 10)));
            n = Math.floor(n / 10);
        } while (n > 0);

        while (digits.length < minDigits) {
            digits.push(String.fromCharCode(PERSIAN_ZERO));
        }

        if (value < 0) {
            digits.push('-');
        }

        return digits.reverse().join('');
    }

    /**
     * Parses a string representing an integer number, which may contain Latin or Persian-Indic digits,
     * and may be prefixed with a '+' or '-' sign.
     *
     * @param str - Input string to parse.
     * @returns The parsed numeric value.
     * @throws {Error} If the string is not a valid integer.
     */
    static parse(str: string): number {
        const input = str.trim();
        if (input.length === 0) {
            throw new Error('Cannot parse empty string as a number.');
        }

        let index = 0;
        let negative = false;

        const first = input[0];
        if (first === '-' || first === '\u2212') {
            negative = true;
            index = 1;
        } else if (first === '+') {
            index = 1;
        }

        if (index >= input.length) {
            throw new Error(`String "${str}" is not a valid integer number.`);
        }

        let value = 0;
        for (; index < input.length; index++) {
            const code = input.charCodeAt(index);

            let digit;
            if (code >= ASCII_ZERO && code < ASCII_ZERO + 10) {
                digit = code - ASCII_ZERO;
            } else if (code >= PERSIAN_ZERO && code < PERSIAN_ZERO + 10) {
                digit = code - PERSIAN_ZERO;
            } else {
                throw new Error(`String "${str}" is not a valid number.`);
            }

            value = value * 10 + digit;
        }

        return negative ? -value : value;
    }
}
