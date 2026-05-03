# jalali-astro

Accurate Gregorian and Jalali date conversion for JavaScript and TypeScript, with leap years derived from astronomical Nowruz calculations instead of fixed arithmetic cycles.

`jalali-astro` implements the equinox-based rule of the Jalali calendar, also known as the Iranian or Persian calendar. It computes Nowruz from the vernal equinox in Iran Standard Time and derives leap years from the distance between consecutive Nowruz dates.

Unlike libraries that rely on repeating leap-year cycles, this package does not use a fixed arithmetic approximation, avoiding known failure cases in years where cycle-based rules place Nowruz on the wrong Gregorian day.

> تفاوت اصلی این بسته با بسیاری از کتابخانه‌های رایج جلالی این است که برای تشخیص سال کبیسه از چرخه‌های عددی ثابت استفاده نمی‌کند.
>
> این بسته زمان نوروز را بر پایهٔ محاسبهٔ نجومی اعتدال بهاری در زمان رسمی ایران به‌دست می‌آورد و کبیسه بودن هر سال را از فاصلهٔ میان دو نوروز پیاپی تعیین می‌کند.
>
> در نتیجه، در سال‌هایی که روش‌های چرخه‌ای ممکن است روز آغاز سال جلالی را اشتباه محاسبه کنند، این بسته همچنان از قاعدهٔ مبتنی بر اعتدال بهاری پیروی می‌کند.

## Features

* Gregorian to Jalali conversion
* Jalali to Gregorian conversion
* Leap years derived from astronomical Nowruz calculation
* Immutable `JalaliDate` value object
* Date arithmetic with days, months, and years
* Formatting and parsing of Jalali dates
* TypeScript declarations included
* ES module and CommonJS builds
* Zero runtime dependencies

## Installation

```sh
npm install jalali-astro
```

## Quick start

```ts
import { JalaliDate } from 'jalali-astro';

// Today's Jalali date in Tehran civil time
const today = JalaliDate.today();
console.log(today.toString()); // e.g. "1405/02/12"

// Date arithmetic
const yesterday = today.addDays(-1);
const nextMonth = today.addMonths(1);
const lastYear = today.addYears(-1);

// Formatting
console.log(today.format('DDDD D MMMM YYYY'));
// "جمعه ۱ فروردین ۱۴۰۴"

// Convert from Gregorian
const j = JalaliDate.fromGregorian(2025, 3, 21);
console.log(j.toString()); // "1404/01/01"
console.log(j.isLeapYear); // false
console.log(j.daysInYear); // 365

// Convert to Gregorian
const g = j.toGregorian(); // { year: 2025, month: 3, day: 21 }

// Parsing
const parsed = JalaliDate.parse('جمعه ۱ فروردین ۱۴۰۴', 'DDDD D MMMM YYYY');
```

## How the calendar works

The Jalali year begins at Nowruz, the first day of the year. Nowruz is determined from the vernal equinox, also known as the March equinox in the Northern Hemisphere.

The calendar rule is:

> If the vernal equinox occurs before 12:00 noon in Iran Standard Time (UTC+03:30), the Jalali year begins at the start of that civil day. If the equinox occurs at or after 12:00 noon, the year begins at the start of the following civil day.

A Jalali year is a leap year when the number of days from its Nowruz to the next year's Nowruz is 366. Otherwise, it is a common year of 365 days.

Leap years are therefore a consequence of the equinox calculation, not a separate repeating rule.

## Why equinox-based calculation matters

Many Jalali libraries use arithmetic leap-year cycles. These are convenient approximations and are often correct for ordinary dates, but the Jalali calendar is not defined by a repeating cycle.

`jalali-astro` is built for correctness according to the equinox-based calendar rule. It computes the vernal equinox, applies the Iran Standard Time noon rule, and derives Nowruz and leap-year behavior from that calculation.

This distinction matters most in boundary years, when the equinox occurs close enough to noon that a cycle-based implementation and an astronomical implementation may place Nowruz on different Gregorian days.

For example, SH 1396, corresponding to 2017, is a useful boundary case. The vernal equinox occurred after noon in Iran Standard Time, so the first day of the Jalali year fell on 2017-03-21.

In years like this, a repeating arithmetic cycle can choose a different Gregorian day for the start of the Jalali year. `jalali-astro` avoids that class of error by deriving the year boundary from the equinox itself.

### Common approaches and trade-offs

| Approach                 | Description                                                                | Trade-off                                                              |
| ------------------------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 33-year cycle            | Distributes leap years across a repeating 33-year pattern                  | Simple and fast, but approximate over long periods                     |
| 2820-year cycle          | Uses a more elaborate arithmetic cycle often associated with Ahmad Birashk | More refined, but still fixed-cycle rather than equinox-based          |
| Lookup tables            | Stores known Nowruz dates or leap years                                    | Excellent within the table range, but limited outside it               |
| Astronomical calculation | Computes the vernal equinox and derives Nowruz from it                     | Follows the equinox-based calendar rule without fixed leap-year cycles |

## Module formats

The package ships with both ES module and CommonJS builds.

```ts
// ES module, TypeScript, and modern bundlers
import { JalaliDate } from 'jalali-astro';
```

```js
// CommonJS
const { JalaliDate } = require('jalali-astro');
```

Full TypeScript declarations are included.

## Building and testing

```sh
npm install
npm run build
npm test
```

## Notes on accuracy

`jalali-astro` uses the equinox algorithm from Jean Meeus, *Astronomical Algorithms*, 2nd edition, Chapter 27. The calculation is intended to provide high-accuracy vernal equinox estimates over the supported range, especially for modern dates.

The supported range is Gregorian years -1000 to +3000, equivalent to Jalali years -1621 to +2378.

For contemporary years, the resulting equinox times are typically close enough for reliable application of the noon rule. Near a noon boundary, however, even small differences between astronomical models, time-scale assumptions, or official determinations can matter.

## API Reference

### `JalaliDate`

Immutable value object representing a Jalali calendar date.

```ts
import { JalaliDate } from 'jalali-astro';
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

Returns today's Jalali date in Tehran civil time.

```ts
const today = JalaliDate.today();
```

#### `JalaliDate.fromDate(date)`

Creates a Jalali date from a JavaScript `Date`. The instant is interpreted in Tehran civil time before conversion.

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

#### `JalaliDate.fromDayOfYear(year, dayOfYear)`

Creates a Jalali date from a Jalali year and 1-based day of year.

```ts
const nowruz = JalaliDate.fromDayOfYear(1404, 1);
```

Throws `RangeError` if `dayOfYear` is outside the valid range for the given year.

#### `JalaliDate.fromJDN(jdn)`

Creates a Jalali date from a Julian Day Number.

```ts
const date = JalaliDate.fromJDN(2460756);
```

Throws `RangeError` if the Julian Day Number is outside the supported conversion range.

#### `JalaliDate.parse(str, pattern)`

Parses a Jalali date string using a format pattern. The default pattern is `YYYY/M/D`.

```ts
const date = JalaliDate.parse('جمعه ۱ فروردین ۱۴۰۴', 'DDDD D MMMM YYYY');
```

Supported tokens:

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

Persian-Indic digits are accepted when parsing. Quoted text in single or double quotes is matched literally.

### Static utilities

| Method                                | Description                                                                                    |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `JalaliDate.isLeapYear(year)`         | Returns whether the given Jalali year is a leap year.                                          |
| `JalaliDate.daysInMonth(year, month)` | Returns the number of days in a Jalali month.                                                  |
| `JalaliDate.daysInYear(year)`         | Returns the number of days in a Jalali year.                                                   |
| `JalaliDate.vernalEquinox(year)`      | Returns the UTC time of the vernal equinox used to determine Nowruz for the given Jalali year. |

```ts
JalaliDate.isLeapYear(year: number): boolean
JalaliDate.daysInMonth(year: number, month: number): number
JalaliDate.daysInYear(year: number): number
JalaliDate.vernalEquinox(year: number): Date
```

### Range constants

| Constant                        | Description                       |
| ------------------------------- | --------------------------------- |
| `JalaliDate.MIN_YEAR`           | Minimum supported Jalali year.    |
| `JalaliDate.MAX_YEAR`           | Maximum supported Jalali year.    |
| `JalaliDate.MIN_GREGORIAN_YEAR` | Minimum supported Gregorian year. |
| `JalaliDate.MAX_GREGORIAN_YEAR` | Maximum supported Gregorian year. |

### Instance properties

| Property           | Description                                                                          |
| ------------------ | ------------------------------------------------------------------------------------ |
| `date.year`        | Jalali year.                                                                         |
| `date.month`       | Jalali month, from `1` to `12`.                                                      |
| `date.day`         | Jalali day of month.                                                                 |
| `date.jdn`         | Julian Day Number for the date.                                                      |
| `date.dayOfYear`   | 1-based day of year.                                                                 |
| `date.dayOfWeek`   | Day of week using the JavaScript `Date` convention: `0 = Sunday`, …, `6 = Saturday`. |
| `date.isLeapYear`  | Whether the date's year is a leap year.                                              |
| `date.daysInMonth` | Number of days in the date's month.                                                  |
| `date.daysInYear`  | Number of days in the date's year.                                                   |

### Conversion

#### `date.toGregorian()`

Returns the equivalent proleptic Gregorian date.

```ts
const gregorian = date.toGregorian();
// { year: 2025, month: 3, day: 21 }
```

### Arithmetic

All arithmetic methods return new `JalaliDate` instances. The original date is never mutated.

| Method              | Description                           |
| ------------------- | ------------------------------------- |
| `date.addDays(n)`   | Returns a date shifted by `n` days.   |
| `date.addMonths(n)` | Returns a date shifted by `n` months. |
| `date.addYears(n)`  | Returns a date shifted by `n` years.  |

```ts
const tomorrow = today.addDays(1);
const nextMonth = today.addMonths(1);
const lastYear = today.addYears(-1);
```

When adding months or years, the day is clamped if the target month or year has fewer days.

### Comparison

| Method                  | Description                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `date.compareTo(other)` | Returns a negative number, zero, or a positive number depending on whether this date is before, equal to, or after `other`. |
| `date.equals(other)`    | Returns `true` if both dates represent the same calendar day.                                                               |
| `date.isBefore(other)`  | Returns `true` if this date is strictly earlier than `other`.                                                               |
| `date.isAfter(other)`   | Returns `true` if this date is strictly later than `other`.                                                                 |

### Formatting and serialization

#### `date.format(pattern)`

Formats the date using Persian month names, Persian weekday names, and Persian-Indic digits for numeric fields.

```ts
date.format('DDDD D MMMM YYYY');
// "جمعه ۱ فروردین ۱۴۰۴"
```

The format tokens are the same as the tokens accepted by `JalaliDate.parse()`.

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

## License

[MIT](./LICENSE) © Kambiz Khojasteh
