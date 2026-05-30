/**
 * Pattern parsing and compilation helpers for JalaliDate formatting and parsing.
 *
 * The pattern language supports ordinary Jalali tokens, scoped calendar blocks
 * such as `[jalali:YYYY/M/D]` and `[gregorian:YYYY-MM-DD]`, quoted literals,
 * literal square brackets written as `[[` and `]]`.
 *
 * This module is intentionally syntax-only: it understands pattern structure, but
 * it does not format values or perform calendar conversions.
 */

/**
 * Calendar systems supported by scoped pattern blocks.
 */
export type CalendarSystem = 'jalali' | 'gregorian';

/**
 * Supported date/format tokens, listed longest-first so the scanner can match
 * greedily without relying on a large alternation regex.
 */
export const FORMAT_TOKEN_NAMES = [
    'YYYY', 'MMMM', 'DDDD', 'YY', 'MM', 'DD', 'M', 'D', 'Q'
] as const;

/**
 * Supported date/format token.
 */
export type FormatToken = typeof FORMAT_TOKEN_NAMES[number];

/**
 * Date component represented by a pattern token.
 */
export type PatternComponent = 'year' | 'month' | 'day' | 'dayOfWeek' | 'quarter';

/**
 * Represents a reusable parsed pattern segment.
 */
export type PatternSegment =
    | { kind: 'literal'; text: string }
    | { kind: 'token'; calendar: CalendarSystem; token: FormatToken };

/**
 * Information about one regex capture group in a compiled parse pattern.
 */
export type PatternCaptureGroup = {
    /**
     * Calendar context for this captured token.
     */
    calendar: CalendarSystem;

    /**
     * Date component captured by this group.
     */
    type: PatternComponent;

    /**
     * Original token that produced this group.
     */
    token: FormatToken;
};

/**
 * Compiled pattern metadata used by {@link JalaliDate.parse} and {@link JalaliDate.format}.
 */
export interface CompiledPattern {
    /**
     * Regex that matches the complete normalized input string.
     */
    regex: RegExp;

    /**
     * Capture-group metadata in regex capture order.
     */
    captureGroups: PatternCaptureGroup[];
}

/**
 * Captures either Latin or Persian-Indic digits.
 */
const DIGIT_CAPTURE = '([\\d\\u06F0-\\u06F9]+)';

/**
 * Captures a name token up to common date separators.
 */
const NAME_CAPTURE = '([^\\s\\/\\-]+)';

/**
 * Caches for parsed patterns and compiled regexes, keyed by pattern string.
 */
const patternCache = new Map<string, CompiledPattern>();

/**
 * Cache for parsed pattern segments, keyed by pattern string.
 *
 * This is separate from the compiled pattern cache because formatting only
 * needs segments, while parsing needs both segments and compiled regexes.
 */
const segmentCache = new Map<string, PatternSegment[]>();

/**
 * Escapes a literal string so it can be embedded in a regular expression.
 *
 * @param text The literal text to escape.
 * @returns The escaped text, safe for use in a regex.
 */
function escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Adds a literal segment, merging adjacent literals to keep compiled patterns compact.
 *
 * @param segments The array of pattern segments to append to.
 * @param text The literal text to add.
 */
function appendLiteralSegment(segments: PatternSegment[], text: string): void {
    if (!text) return;

    const previous = segments[segments.length - 1];
    if (previous?.kind === 'literal') {
        previous.text += text;
    } else {
        segments.push({ kind: 'literal', text });
    }
}

/**
 * Returns the format token at `index`, if the pattern starts with one there.
 *
 * @param pattern The pattern string to scan.
 * @param index The index to check for a token.
 * @returns The matched token, or `undefined` if no token matches at `index`.
 */
function matchFormatTokenAt(pattern: string, index: number): FormatToken | undefined {
    for (const token of FORMAT_TOKEN_NAMES) {
        if (pattern.slice(index, index + token.length).toUpperCase() === token) {
            return token;
        }
    }
    return undefined;
}

/**
 * Reads a scoped calendar block starting at `index`.
 *
 * Supported forms are `[jalali:...]` and `[gregorian:...]`. Nested calendar
 * blocks are intentionally unsupported. Literal square brackets inside a block
 * can be written as `[[` and `]]`.
 *
 * @param pattern The pattern string to scan.
 * @param index The index of the opening `[` for the calendar block.
 * @returns An object containing the block's calendar, body, and end index.
 * @throws {Error} If the block is malformed, uses an unsupported calendar, is
 * nested, or is not closed.
 */
function readCalendarBlockAt(
    pattern: string,
    index: number
): { calendar: CalendarSystem; body: string; endIndex: number } {
    const colonIndex = pattern.indexOf(':', index + 1);
    const closingBracketIndex = pattern.indexOf(']', index + 1);

    if (colonIndex === -1 || (closingBracketIndex !== -1 && closingBracketIndex < colonIndex)) {
        throw new Error(`Malformed calendar scope at index ${index}. Expected [jalali:...] or [gregorian:...].`);
    }

    const calendarName = pattern.slice(index + 1, colonIndex).toLowerCase();
    if (calendarName !== 'jalali' && calendarName !== 'gregorian') {
        throw new Error(`Unsupported calendar scope "${calendarName}" at index ${index}.`);
    }

    const bodyStart = colonIndex + 1;
    for (let i = bodyStart; i < pattern.length; i++) {
        const char = pattern[i];

        if (char === '[' && pattern[i + 1] === '[') {
            i++;
            continue;
        }

        if (char === ']' && pattern[i + 1] === ']') {
            i++;
            continue;
        }

        if (char === '[') {
            throw new Error(`Nested calendar scopes are not supported at index ${i}.`);
        }

        if (char === ']') {
            return {
                calendar: calendarName,
                body: pattern.slice(bodyStart, i),
                endIndex: i
            };
        }
    }

    throw new Error(`Unclosed calendar scope starting at index ${index}.`);
}

/**
 * Appends parsed segments for `pattern` to `segments`.
 *
 * @param pattern The pattern string to parse.
 * @param calendar The calendar context for tokens in this pattern.
 * @param segments The array to append parsed segments to.
 */
function appendPatternSegments(
    pattern: string,
    calendar: CalendarSystem,
    segments: PatternSegment[]
): void {
    let literal = '';

    const flushLiteral = (): void => {
        appendLiteralSegment(segments, literal);
        literal = '';
    };

    for (let i = 0; i < pattern.length;) {
        const char = pattern[i]!;

        if (char === '[' && pattern[i + 1] === '[') {
            literal += '[';
            i += 2;
            continue;
        }

        if (char === ']' && pattern[i + 1] === ']') {
            literal += ']';
            i += 2;
            continue;
        }

        if (char === '[') {
            const block = readCalendarBlockAt(pattern, i);
            flushLiteral();
            appendPatternSegments(block.body, block.calendar, segments);
            i = block.endIndex + 1;
            continue;
        }

        if (char === ']') {
            throw new Error(`Unmatched closing bracket in pattern at index ${i}. Use ]] for a literal ].`);
        }

        if (char === '"' || char === "'") {
            const closingQuoteIndex = pattern.indexOf(char, i + 1);
            if (closingQuoteIndex === -1) {
                throw new Error(`Unclosed quoted literal starting at index ${i}.`);
            }

            literal += pattern.slice(i + 1, closingQuoteIndex);
            i = closingQuoteIndex + 1;
            continue;
        }

        const token = matchFormatTokenAt(pattern, i);
        if (token) {
            flushLiteral();
            segments.push({ kind: 'token', calendar, token });
            i += token.length;
            continue;
        }

        literal += char;
        i++;
    }

    flushLiteral();
}

/**
 * Parses a format/parse pattern into reusable segments.
 *
 * Tokens outside a scoped block use the Jalali calendar. Tokens inside
 * `[jalali:...]` or `[gregorian:...]` use that block's calendar. Literal square
 * brackets can be written as `[[` and `]]`.
 *
 * @param pattern The pattern string to parse.
 * @returns An array of pattern segments representing the structure of `pattern`.
 * @throws {Error} If the pattern contains a malformed, unsupported, unclosed,
 * nested, or unmatched calendar-scope bracket.
 */
export function parsePattern(pattern: string): PatternSegment[] {
    const segments: PatternSegment[] = [];
    appendPatternSegments(pattern, 'jalali', segments);
    return segments;
}

/**
 * Returns cached parsed pattern segments for formatting.
 *
 * @param pattern The pattern string to parse.
 * @returns An array of pattern segments representing the structure of `pattern`.
 */
export function getFormatSegments(pattern: string): readonly PatternSegment[] {
    const cached = segmentCache.get(pattern);
    if (cached) return cached;

    const segments = parsePattern(pattern);
    segmentCache.set(pattern, segments);
    return segments;
}

/**
 * Appends the regex fragment for a token segment, recording capture metadata when
 * the token is parseable or validatable.
 *
 * @param segment The token segment to process.
 * @param regexParts The array of regex fragments to append to.
 * @param captureGroups The array of capture group metadata to append to when a
 *                      capture group is added for this token.
 */
function appendTokenRegex(
    segment: Extract<PatternSegment, { kind: 'token' }>,
    regexParts: string[],
    captureGroups: PatternCaptureGroup[]
): void {
    const { calendar, token } = segment;

    switch (token) {
        case 'YYYY':
        case 'YY':
            captureGroups.push({ calendar, type: 'year', token });
            regexParts.push(DIGIT_CAPTURE);
            break;
        case 'MMMM':
            captureGroups.push({ calendar, type: 'month', token });
            regexParts.push(NAME_CAPTURE);
            break;
        case 'MM':
        case 'M':
            captureGroups.push({ calendar, type: 'month', token });
            regexParts.push(DIGIT_CAPTURE);
            break;
        case 'DDDD':
            captureGroups.push({ calendar, type: 'dayOfWeek', token });
            regexParts.push(NAME_CAPTURE);
            break;
        case 'DD':
        case 'D':
            captureGroups.push({ calendar, type: 'day', token });
            regexParts.push(DIGIT_CAPTURE);
            break;
        case 'Q':
            if (calendar === 'jalali') {
                captureGroups.push({ calendar, type: 'quarter', token });
                regexParts.push(NAME_CAPTURE);
            } else {
                regexParts.push(escapeRegex(token));
            }
            break;
    }
}

/**
 * Compiles a date format pattern into a regular expression and capture group metadata.
 * Results are cached for performance.
 *
 * @param pattern The pattern string to compile.
 * @returns An object containing the compiled regex and capture group metadata for `pattern`.
 */
export function compilePattern(pattern: string): CompiledPattern {
    const cached = patternCache.get(pattern);
    if (cached) return cached;

    const captureGroups: PatternCaptureGroup[] = [];
    const regexParts: string[] = [];

    for (const segment of parsePattern(pattern)) {
        if (segment.kind === 'literal') {
            regexParts.push(escapeRegex(segment.text));
        } else {
            appendTokenRegex(segment, regexParts, captureGroups);
        }
    }

    const compiled: CompiledPattern = {
        regex: new RegExp(`^${regexParts.join('')}$`, 'i'),
        captureGroups
    };

    patternCache.set(pattern, compiled);
    return compiled;
}
