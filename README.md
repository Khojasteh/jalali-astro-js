# jalali-astro

Accurate Gregorian and Jalali date conversion for JavaScript and TypeScript, with leap years derived from astronomical Nowruz calculations instead of fixed arithmetic cycles.

`jalali-astro` implements the equinox-based rule of the Jalali calendar, also known as the Iranian or Persian calendar. It computes Nowruz from the vernal equinox in Iran Standard Time and derives leap years from the distance between consecutive Nowruz dates.

The library provides a complete API for working with Jalali dates, including conversion, validation, formatting, parsing, date arithmetic, week calculations, derived dates, and immutable date manipulation.

## Why jalali-astro?

Many Jalali date libraries use fixed arithmetic leap-year cycles. These rules are simple and fast, but they are approximations of the calendar. In some years, cycle-based methods can place Nowruz on the wrong Gregorian day.

`jalali-astro` does not use a fixed leap-year cycle. Instead, it follows the astronomical rule of the Jalali calendar: Nowruz is determined from the vernal equinox in Iran civil time, and leap years are derived from the number of days between consecutive Nowruz dates.

As a result, `jalali-astro` follows the astronomical definition of the Jalali calendar rather than approximating it with a repeating arithmetic cycle.

> تفاوت اصلی این بسته با بسیاری از کتابخانه‌های رایج جلالی این است که برای تشخیص سال کبیسه از چرخه‌های عددی ثابت استفاده نمی‌کند.
>
> این بسته زمان نوروز را بر پایهٔ محاسبهٔ نجومی اعتدال بهاری در زمان رسمی ایران به‌دست می‌آورد و کبیسه بودن هر سال را از فاصلهٔ میان دو نوروز پیاپی تعیین می‌کند.
>
> در نتیجه، در سال‌هایی که روش‌های چرخه‌ای ممکن است روز آغاز سال جلالی را اشتباه محاسبه کنند، این بسته همچنان از قاعدهٔ مبتنی بر اعتدال بهاری پیروی می‌کند.

## Astronomical calendar rule

`jalali-astro` calculates Jalali calendar dates from astronomical estimates of the vernal equinox. It uses the equinox algorithm described by Jean Meeus in *Astronomical Algorithms*, 2nd edition, Chapter 27, and is intended to provide high-accuracy results, especially for modern dates.

In the Jalali calendar, the first day of the year, Nowruz, is determined by the time of the vernal equinox in Iran civil time (UTC+03:30). If the equinox occurs before local noon, Nowruz falls on that day. If it occurs at or after local noon, Nowruz falls on the following day.

Because this rule depends on which side of local noon the equinox falls, dates near that boundary require particular care. When the calculated equinox time is very close to noon, small differences in astronomical models, time-scale conventions, or rounding methods can place the event on either side of the boundary. In these rare cases, the resulting Nowruz date may differ by one day.

## Supported date range

The astronomical calculation is supported from 1001 BCE through 3000 CE in the proleptic Gregorian calendar, corresponding approximately to Jalali years -1622 through 2378.

`jalali-astro` enforces this range for date conversions that depend on the equinox calculation.

## Features

**Astronomical conversion**
* Gregorian to Jalali and Jalali to Gregorian conversion
* Leap years derived from vernal equinox calculations, not fixed cycles
* Nowruz calculation based on Iran civil time
* Access to the vernal equinox used for a Jalali year

**Date creation and validation**
* Create dates from Jalali year, month, and day
* Create dates from Gregorian dates, ISO date strings, JavaScript `Date` objects, Unix timestamps, and Julian Day Numbers
* Create dates from day of year, week of year, or nth weekday of a month

**Date arithmetic and derived dates**
* Add or subtract days, months, and years
* Get the start or end of a year, quarter, month, or week
* Calculate differences in days, months, and years
* Calculate age in complete years
* Weeks start on Saturday and end on Friday

**Immutable date object**
* Immutable `JalaliDate` value object
* Rich date properties, including year, quarter, month, day, day of year, week of year, week of month, and Julian Day Number
* Fluent helpers for changing year, month, or day without mutating the original date
* Comparison helpers such as `equals`, `isBefore`, `isAfter`, `isBetween`, `isSameWeek`, and `isSameQuarter`

**Formatting and parsing**
* Format dates with Persian month names, weekday names, quarter names, and Persian-Indic digits
* Parse dates with Persian or Latin digits
* Pattern-based parsing with validation of month names, weekday names, and quarter names
* Optional Right-to-Left Mark handling for correct display of Persian text

**Quality and compatibility**
* Full TypeScript type definitions
* ES module and CommonJS builds
* Direct browser usage via IIFE build
* Zero runtime dependencies
* Comprehensive test suite

## Installation

```sh
npm install jalali-astro
```

## Quick start

```ts
import { JalaliDate } from 'jalali-astro';

// Convert from Gregorian to Jalali
const nowruz1404 = JalaliDate.fromGregorian(2025, 3, 21);
console.log(nowruz1404.toString());  // "1404/01/01"
console.log(nowruz1404.isLeapYear);  // false

// Convert to Gregorian
const g = nowruz1404.toGregorian();  // { year: 2025, month: 3, day: 21 }

// Today's Jalali date in Tehran civil time
const today = JalaliDate.today();
const yesterday = today.addDays(-1);
const nextMonth = today.addMonths(1);

// Comparison
if (today.isAfter(nowruz1404)) {
  console.log('Today is after Nowruz 1404');
}

// Create a fixed date for demonstration
const date = new JalaliDate(1405, 2, 14);
console.log(date.toString());      // "1405/02/14"
console.log(date.monthName);       // "اردیبهشت"
console.log(date.dayOfWeekName);   // "دوشنبه"
console.log(date.weekOfYear);      // 7

// Formatting with Persian numerals and names
console.log(date.format('DDDD D MMMM YYYY'));
// "دوشنبه ۱۴ اردیبهشت ۱۴۰۵"

// Parsing (supports Persian and Latin digits)
const parsed1 = JalaliDate.parse('1405/02/14');
const parsed2 = JalaliDate.parse('۱۴۰۵/۰۲/۱۴');
const parsed3 = JalaliDate.parse('‏۱۴ اردیبهشت ۱۴۰۵', 'D MMMM YYYY');
```

## Module formats

The package ships with ES module, CommonJS, and browser (IIFE) builds.
Full TypeScript declarations are included.

### Node.js and bundlers

```ts
// ES module, TypeScript, and modern bundlers
import { JalaliDate } from 'jalali-astro';
```

```js
// CommonJS
const { JalaliDate } = require('jalali-astro');
```

### Browser usage

**Modern browsers (ES modules):**

```html
<script type="module">
  import { JalaliDate } from 'https://esm.sh/jalali-astro';

  const today = JalaliDate.today();
  console.log(today.format('DDDD، D MMMM YYYY'));
</script>
```

**All browsers (IIFE global):**

A minified browser bundle is available for CDN/production use (`dist/index.min.global.js`). The unminified IIFE build (`dist/index.global.js`) is also available for debugging or local inclusion. Source maps are published alongside the minified bundle to aid debugging.

```html
<!-- Production (minified) -->
<script src="https://unpkg.com/jalali-astro/dist/index.min.global.js"></script>

<!-- Or the unminified IIFE for debugging -->
<script src="https://unpkg.com/jalali-astro/dist/index.global.js"></script>

<script>
  const { JalaliDate } = JalaliAstro;

  const today = JalaliDate.today();
  document.getElementById('current-date').textContent =
    today.format('DDDD، D MMMM YYYY', { rlm: 'auto' });
</script>
```

## Building and testing

```sh
npm install
npm run build
npm test
```

## API Reference

### `JalaliDate`

Immutable value object representing a Jalali calendar date.

```ts
import { JalaliDate, DayOfWeek, Occurrence, Quarter } from 'jalali-astro';
```

### Constructor

#### `new JalaliDate(year, month, day)`

Creates a Jalali date from explicit Jalali year, month, and day.

```ts
const date = new JalaliDate(1404, 1, 1);
console.log(date.toString()); // "1404/01/01"
```

Throws `RangeError` if the year, month, or day is outside the supported range.

### Static factories

#### `JalaliDate.today()`

Returns today's Jalali date in Tehran civil time (UTC+03:30), based on the current system time.

```ts
const today = JalaliDate.today();
```

#### `JalaliDate.yesterday()`

Returns yesterday's Jalali date in Tehran civil time (UTC+03:30), based on the current system time.

```ts
const yesterday = JalaliDate.yesterday();
```

#### `JalaliDate.tomorrow()`

Returns tomorrow's Jalali date in Tehran civil time (UTC+03:30), based on the current system time.

```ts
const tomorrow = JalaliDate.tomorrow();
```

#### `JalaliDate.fromUnixTime(unixTime)`

Creates a JalaliDate from a Unix timestamp (milliseconds since 1970-01-01T00:00:00Z).

The timestamp is interpreted in Tehran civil time (UTC+03:30) to determine the corresponding Jalali date.

```ts
const today = JalaliDate.fromUnixTime(Date.now());
const specificDate = JalaliDate.fromUnixTime(1609459200000); // 2021-01-01 00:00:00 UTC
```

#### `JalaliDate.fromDate(date)`

Creates a Jalali date from a JavaScript `Date`.

The `Date` instant is interpreted in Tehran civil time (UTC+03:30) to determine the corresponding Jalali date.

```ts
const date = JalaliDate.fromDate(new Date());
```

#### `JalaliDate.fromGregorian(gYear, gMonth, gDay)`

Creates a Jalali date from a proleptic Gregorian date.

```ts
const date = JalaliDate.fromGregorian(2025, 3, 21);
console.log(date.toString()); // "1404/01/01"
```

Throws `RangeError` if the Gregorian date is invalid or outside the supported range.

#### `JalaliDate.fromIsoDateString(isoString)`

Creates a JalaliDate from an ISO 8601 date string in the format "YYYY-MM-DD".

```ts
const date = JalaliDate.fromIsoDateString("2025-03-21");
console.log(date.toString()); // "1404/01/01"
```

Throws `Error` if the input string is not a valid ISO date.

Throws `RangeError` if the Gregorian date is invalid or out of supported range.

#### `JalaliDate.fromDayOfYear(year, dayOfYear)`

Creates a Jalali date from a Jalali year and 1-based day of year.

```ts
const nowruz = JalaliDate.fromDayOfYear(1404, 1);
console.log(nowruz.toString()); // "1404/01/01"
```

Throws `RangeError` if `dayOfYear` is outside the valid range for the given year.

#### `JalaliDate.fromWeekOfYear(year, weekNumber, dayOfWeek)`

Creates a Jalali date from a year, week number, and day of week.

Week 1 is the week containing 1 Farvardin. Weeks start on Saturday (6) and end on Friday (5).

```ts
const saturday = JalaliDate.fromWeekOfYear(1404, 1, DayOfWeek.Saturday);
const friday = JalaliDate.fromWeekOfYear(1404, 1, DayOfWeek.Friday);
```

Throws `RangeError` if the parameters are out of range or the resulting date is invalid.

#### `JalaliDate.fromNthWeekdayOfMonth(year, month, nth, dayOfWeek)`

Creates a Jalali date for the nth occurrence of a weekday within a specific month.

Positive `nth` values count from the beginning of the month (1 = first occurrence, 2 = second, etc.).
Negative `nth` values count from the end of the month (-1 = last occurrence, -2 = second-to-last, etc.).

```ts
// Second Tuesday of Ordibehesht 1405
const date = JalaliDate.fromNthWeekdayOfMonth(1405, 2, Occurrence.Second, DayOfWeek.Tuesday);

// Last Friday of Esfand 1404
const lastFriday = JalaliDate.fromNthWeekdayOfMonth(1404, 12, Occurrence.Last, DayOfWeek.Friday);

// First Saturday of Farvardin 1404
const firstSat = JalaliDate.fromNthWeekdayOfMonth(1404, 1, Occurrence.First, DayOfWeek.Saturday);
```

Throws `RangeError` if the parameters are out of range or the nth occurrence doesn't exist in the month.

#### `JalaliDate.fromJDN(jdn)`

Creates a Jalali date from a Julian Day Number.

```ts
const date = JalaliDate.fromJDN(2460756);
```

Throws `RangeError` if the Julian Day Number is outside the supported conversion range.

#### `JalaliDate.parse(str, pattern)`

Parses a Jalali date string using a format pattern. The default pattern is `YYYY/M/D`.

Supported tokens in the pattern are:

| Token  | Meaning                  |
| ------ | ------------------------ |
| `YY`   | 2-digit year             |
| `YYYY` | Full year                |
| `M`    | Month number             |
| `MM`   | Zero-padded month number |
| `MMMM` | Persian month name       |
| `D`    | Day of month             |
| `DD`   | Zero-padded day of month |
| `DDDD` | Persian weekday name     |
| `Q`    | Persian quarter name     |

The parser follows these rules:
- Both Persian and Latin digits are accepted in the input string for numeric fields.
- Quoted text in single or double quotes is matched literally.
- Day of week (`DDDD`) and quarter (`Q`) names are validated against the resulting date when present.
- Bidirectional control characters (RLM, LRM, etc.) are automatically stripped from both the input string and pattern.
- Leading and trailing whitespace in both the input string and pattern is ignored.

```ts
const date = JalaliDate.parse('جمعه ۱ فروردین ۱۴۰۴', 'DDDD D MMMM YYYY');
console.log(date.toString()); // "1404/01/01"
```

Throws `Error` if the input string doesn't match the pattern, contains invalid names, or includes a weekday or quarter that does not match the parsed date.

Throws `RangeError` if the resulting date is invalid or out of supported range.

### Static utilities

| Method                                                 | Description                                                                                    |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `JalaliDate.isValidDate(year, month, day)`             | Returns `true` if the given date is valid, `false` otherwise (without throwing).               |
| `JalaliDate.isLeapYear(year)`                          | Returns whether the given Jalali year is a leap year.                                          |
| `JalaliDate.daysInMonth(year, month)`                  | Returns the number of days in a Jalali month.                                                  |
| `JalaliDate.daysInYear(year)`                          | Returns the number of days in a Jalali year.                                                   |
| `JalaliDate.vernalEquinox(year)`                       | Returns the UTC time of the vernal equinox used to determine Nowruz for the given Jalali year. |
| `JalaliDate.age(birthDate, referenceDate?)`            | Calculates age in complete years from birth date to reference date (defaults to today).        |

```ts
JalaliDate.isValidDate(year: number, month: number, day: number): boolean
JalaliDate.isLeapYear(year: number): boolean
JalaliDate.daysInMonth(year: number, month: number): number
JalaliDate.daysInYear(year: number): number
JalaliDate.vernalEquinox(year: number): Date | null
JalaliDate.age(birthDate: JalaliDate, referenceDate?: JalaliDate): number
```

```ts
if (JalaliDate.isValidDate(1403, 12, 30)) {
  const date = new JalaliDate(1403, 12, 30);
  console.log(date.format('Q YYYY')); // "زمستان ۱۴۰۳"
}

const equinox = JalaliDate.vernalEquinox(1404);
if (equinox !== null) {
    console.log(equinox.toISOString()); // e.g., "2025-03-20T09:45:00.000Z"
} else {
    console.log('JS Date does not support the year of the equinox calculation.');
}

const birthDate = new JalaliDate(1380, 5, 15);
const currentAge = JalaliDate.age(birthDate); // Age as of today
const ageAtDate = JalaliDate.age(birthDate, new JalaliDate(1403, 5, 15)); // Age at specific date
```

### Range constants

| Constant                        | Description                       |
| ------------------------------- | --------------------------------- |
| `JalaliDate.MIN_YEAR`           | Minimum supported Jalali year.    |
| `JalaliDate.MAX_YEAR`           | Maximum supported Jalali year.    |
| `JalaliDate.MIN_GREGORIAN_YEAR` | Minimum supported Gregorian year. |
| `JalaliDate.MAX_GREGORIAN_YEAR` | Maximum supported Gregorian year. |

### Instance properties

| Property             | Description                                                                          |
| -------------------- | ------------------------------------------------------------------------------------ |
| `date.year`          | Jalali year.                                                                         |
| `date.month`         | Jalali month, from `1` to `12`.                                                      |
| `date.day`           | Jalali day of month.                                                                 |
| `date.quarter`       | Quarter of the year: `Quarter.Spring`, `Quarter.Summer`, `Quarter.Autumn`, or `Quarter.Winter`. |
| `date.jdn`           | Julian Day Number for the date.                                                      |
| `date.weekOfYear`    | 1-based week number. Week 1 contains 1 Farvardin.                                    |
| `date.weekOfMonth`   | 1-based week number of the month. Week 1 contains day 1.                             |
| `date.dayOfYear`     | 1-based day of year.                                                                 |
| `date.dayOfWeek`     | Day of week using the JavaScript `Date` convention: `0 = Sunday`, …, `6 = Saturday`. |
| `date.monthName`     | Persian name of the month (e.g., 'فروردین', 'اردیبهشت', etc.).                      |
| `date.dayOfWeekName` | Persian name of the day (e.g., 'شنبه', 'یکشنبه', etc.).                             |
| `date.quarterName`   | Persian name of the quarter (e.g., 'بهار', 'تابستان', etc.).                        |
| `date.isLeapYear`    | Whether the date's year is a leap year.                                              |
| `date.daysInMonth`   | Number of days in the date's month.                                                  |
| `date.daysInYear`    | Number of days in the date's year.                                                   |

### Conversion
#### `date.toGregorian()`

Returns the equivalent proleptic Gregorian date.

```ts
const gregorian = date.toGregorian();
// { year: 2025, month: 3, day: 21 }
```

#### `date.toArray()`

Returns the Jalali date as an array of `[year, month, day]`.

```ts
const arr = date.toArray();
// [1404, 1, 1]
```

#### `date.toObject()`

Returns the Jalali date as a plain object.

```ts
const obj = date.toObject();
// { year: 1404, month: 1, day: 1 }
```

#### `date.toIsoDateString()`

Returns the equivalent Gregorian date as an ISO 8601 date string in "YYYY-MM-DD" format.

```ts
const iso = date.toIsoDateString();
// "2025-03-21"
```

### Arithmetic

Methods to offset the date by a number of days, months, or years. All return new `JalaliDate` instances.

| Method              | Description                                                                  |
| ------------------- | ---------------------------------------------------------------------------- |
| `date.addDays(n)`   | Returns a date shifted by `n` days, where `n` can be positive or negative.   |
| `date.addMonths(n)` | Returns a date shifted by `n` months, where `n` can be positive or negative. |
| `date.addYears(n)`  | Returns a date shifted by `n` years, where `n` can be positive or negative.  |

When adding months or years, the day is clamped if the target month or year has fewer days.

```ts
const tomorrow = today.addDays(1);
const nextMonth = today.addMonths(1);
const lastYear = today.addYears(-1);
```

### Derived dates

Methods to obtain related dates from the current date. All return new `JalaliDate` instances.

| Method                   | Description                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| `date.startOfYear()`     | Returns the first day of this date's year (1 Farvardin).           |
| `date.endOfYear()`       | Returns the last day of this date's year (29 or 30 Esfand).        |
| `date.startOfQuarter()`  | Returns the first day of this date's quarter.                      |
| `date.endOfQuarter()`    | Returns the last day of this date's quarter.                       |
| `date.startOfMonth()`    | Returns the first day of this date's month.                        |
| `date.endOfMonth()`      | Returns the last day of this date's month.                         |
| `date.startOfWeek()`     | Returns the first day of the week containing this date (Saturday). |
| `date.endOfWeek()`       | Returns the last day of the week containing this date (Friday).    |

Weeks start on Saturday (the traditional first day of the week in Iran) and end on Friday.

```ts
const date = new JalaliDate(1403, 6, 15);

// Year boundaries
const yearStart = date.startOfYear();   // 1403/01/01
const yearEnd = date.endOfYear();       // 1403/12/30 (leap year)

// Quarter boundaries
const quarterStart = date.startOfQuarter(); // 1403/04/01 (Q2)
const quarterEnd = date.endOfQuarter();     // 1403/06/31 (Q2)

// Month boundaries
const monthStart = date.startOfMonth(); // 1403/06/01
const monthEnd = date.endOfMonth();     // 1403/06/31

// Week boundaries (Saturday to Friday)
const weekStart = date.startOfWeek();   // Saturday of this week
const weekEnd = date.endOfWeek();       // Friday of this week
```

### Immutability helpers

Methods to create a copy of the date with specific fields changed. All return new `JalaliDate` instances.

| Method                  | Description                                               |
| ----------------------- | --------------------------------------------------------- |
| `date.withYear(year)`   | Returns a new date with the specified year.               |
| `date.withMonth(month)` | Returns a new date with the specified month.              |
| `date.withDay(day)`     | Returns a new date with the specified day.                |

When changing the year or month, the day is clamped if the target month has fewer days.

```ts
const date = new JalaliDate(1403, 5, 15);

const sameDate1404 = date.withYear(1404);   // 1404/05/15
const differentMonth = date.withMonth(8);   // 1403/08/15
const differentDay = date.withDay(20);      // 1403/05/20
```

### Comparison

| Method                            | Description                                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `date.compareTo(other)`           | Returns a negative number, zero, or a positive number depending on whether this date is before, equal to, or after `other`. |
| `date.equals(other)`              | Returns `true` if both dates represent the same calendar day.                                                               |
| `date.isBefore(other)`            | Returns `true` if this date is strictly earlier than `other`.                                                               |
| `date.isAfter(other)`             | Returns `true` if this date is strictly later than `other`.                                                                 |
| `date.isBetween(start, end)`      | Returns `true` if this date is between `start` and `end` (inclusive).                                                       |
| `date.isSameYear(other)`          | Returns `true` if both dates are in the same Jalali year.                                                                   |
| `date.isSameMonth(other)`         | Returns `true` if both dates are in the same year and month.                                                                |
| `date.isSameWeek(other)`          | Returns `true` if both dates are in the same year and week (weeks start on Saturday).                                       |
| `date.isSameQuarter(other)`       | Returns `true` if both dates are in the same year and quarter.                                                              |

```ts
const date = new JalaliDate(1403, 5, 15);
const start = new JalaliDate(1403, 5, 1);
const end = new JalaliDate(1403, 5, 31);

date.isBetween(start, end); // true

// Check if dates are in the same period
const date1 = new JalaliDate(1403, 5, 15);
const date2 = new JalaliDate(1403, 6, 20);

date1.isSameYear(date2);    // true (both in 1403)
date1.isSameMonth(date2);   // false (different months)
date1.isSameQuarter(date2); // true (both in Q2: months 4-6)

// Week comparison (weeks start on Saturday)
const wed = new JalaliDate(1403, 1, 1);  // 1 Farvardin 1403 (Wednesday)
const sat = wed.startOfWeek();           // Saturday of the same week
wed.isSameWeek(sat);                     // true
```

### Date differences

Methods to calculate differences between dates.

| Method                           | Description                                                         |
| -------------------------------- | ------------------------------------------------------------------- |
| `date.differenceInDays(other)`   | Returns the number of days from this date to `other`.               |
| `date.differenceInMonths(other)` | Returns the approximate number of months from this date to `other`. |
| `date.differenceInYears(other)`  | Returns the approximate number of years from this date to `other`.  |

The results are whole numbers, and is positive if `other` is in the future relative to this date, negative if `other` is in the past.

```ts
const date1 = new JalaliDate(1400, 5, 15);
const date2 = new JalaliDate(1403, 8, 20);

date1.differenceInDays(date2);   // Positive number (future)
date1.differenceInMonths(date2); // ~39 months
date1.differenceInYears(date2);  // 3 years

date2.differenceInDays(date1);   // Negative number (past)
```

### Formatting and serialization

#### `date.format(pattern, options?)`

Formats the date using Persian month names, Persian weekday names, and Persian-Indic digits for numeric fields.

Supported tokens in the pattern are:

| Token  | Meaning                  |
| ------ | ------------------------ |
| `YY`   | 2-digit year             |
| `YYYY` | Full year                |
| `M`    | Month number             |
| `MM`   | Zero-padded month number |
| `MMMM` | Persian month name       |
| `D`    | Day of month             |
| `DD`   | Zero-padded day of month |
| `DDDD` | Persian weekday name     |
| `Q`    | Persian quarter name     |

The optional `options` object supports a single property:

- **`rlm`** — Controls insertion of the Right-to-Left Mark (U+200F):
  - **`'never'`** — Do not add an RLM (default).
  - **`'always'`** — Always prepend an RLM to the formatted string.
  - **`'auto'`** — Prepend an RLM only when the formatted result begins with a Persian digit.

The RLM is important for correct display of bidirectional text when the formatted date starts with a Persian digit, ensuring that the date is rendered in the proper right-to-left context.

```ts
date.format('DDDD D MMMM YYYY');
// "جمعه ۱ فروردین ۱۴۰۴"

date.format('Q YYYY');
// "بهار ۱۴۰۴"

// With RLM (Right-to-Left Mark) for proper bidirectional text display
date.format('D MMMM YYYY', { rlm: 'auto' });
// "‏۱۴ اردیبهشت ۱۴۰۵" (with RLM prefix for correct RTL display)
```

#### `date.toString()`

Returns the date as `"YYYY/MM/DD"` with Latin digits.

```ts
date.toString(); // "1404/01/01"
```

#### `date.toJSON()`

Serializes the date as `"YYYY/MM/DD"`, matching `date.toString()`.

```ts
JSON.stringify(date); // "\"1404/01/01\""
```

### Testing helpers

#### `JalaliDate.setTestToday(testToday)`

Sets a fixed Jalali date for methods that depend on today's date. Pass `null` to restore the real current date.

```ts
JalaliDate.setTestToday(new JalaliDate(1405, 3, 3));
const today = JalaliDate.today(); // 1405/03/03
JalaliDate.setTestToday(null);
```

#### `JalaliDate.getTestToday()`

Returns the currently set test date for "today" or `null` if the real current date is used.

```ts
const testToday = JalaliDate.getTestToday();
if (testToday !== null) {
  console.log(`Test "today" is set to: ${testToday.toString()}`);
} else {
  console.log('Using real current date for "today".');
}
```


## License

[MIT](./LICENSE) © Kambiz Khojasteh
