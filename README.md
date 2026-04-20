# Scottish Banking: A History, 1695-1973

Data tables from **Scottish Banking: A History, 1695-1973** by SG Checkland (Expanded Edition, Steakhouse Financial Ltd, 2026).

ISBN: 978-1-0369-0175-2

This repository contains all 48 statistical tables from the book, digitised as CSV files and verified against the printed text.

## Repository structure

### `original_tables/book/` (Tables 1-32)

Tables embedded in the main text, covering the full sweep of Scottish banking from 1744 to 1972.

| Table | Description | Period |
|-------|-------------|--------|
| T1 | The system, March 1744 | 1744 |
| T2 | Scottish banks, bankers and banking companies | Dec 1772 |
| T3 | Scottish banks, bankers and banking companies | 1772-1810 |
| T4 | Royal Bank of Scotland, distribution of capital | June 1788 |
| T5 | Royal Bank of Scotland, Glasgow agency | 1794-1807 |
| T6 | Discounts in Glasgow | 1810 |
| T7 | The system, March 1772 | 1772 |
| T8 | The system, 1802 | 1802 |
| T9 | Scottish banks, bankers and banking companies | 1810-30 |
| T10 | Scottish bank absorptions | 1810-50 |
| T11 | Scottish banks, bankers and banking companies | 1830-50 |
| T12 | Royal Bank of Scotland advances, deposits and investments | 1824-25 |
| T13 | Royal Bank of Scotland, Glasgow agency | 1817-36 |
| T14 | The system, 1825 | 1825 |
| T15 | The system, 1850 | 1850 |
| T16 | Scottish banks, banking companies and joint-stock banks | 1850-85 |
| T17 | The system | 1850-60 |
| T18 | Scottish banks, growth of total liabilities | 1865-85 |
| T19 | Scottish-English comparison of public and joint-stock banks | 1865-85 |
| T20 | Scottish banks, growth of total liabilities | 1886-1914 |
| T21 | Scottish-English comparison of joint-stock banks | 1886-1914 |
| T22 | Scottish banks, growth of total liabilities | 1915-45 |
| T23 | Scottish-English comparison of joint-stock banks | 1915-45 |
| T24 | Scottish and English deposits | 1951-58 |
| T25 | Scottish clearing banks staffs | 1955 |
| T26 | Scottish clearing banks staffs | 1972 |
| T27 | Unionisation in Scottish banks | Dec 1964 |
| T28 | Scottish banks, growth of total liabilities | 1946-72 |
| T29 | Scottish-English comparison of joint-stock banks | 1946-72 |
| T30 | The system, total liabilities | 1744-1865 |
| T31 | The system | 1744-1850 |
| T32 | The system | 1865-1972 |

### `original_tables/appendix3/` (Tables 33-48)

Statistical appendix tables, primarily balance sheets of individual banks and system-wide aggregates.

| Table | Description | Period |
|-------|-------------|--------|
| T33 | Bank of Scotland, liabilities and assets | 1700-1744 |
| T34 | Bank of Scotland, liabilities and assets | 1747-71 |
| T35 | Dundee Banking Company (Geo Dempster & Co.), liabilities and assets | 1764-72 |
| T36 | Bank of Scotland, liabilities and assets | 1775-1810 |
| T37 | Royal Bank of Scotland, liabilities and assets | 1794-1802 |
| T38 | Dundee Banking Company, balance sheets | 1775-1810 |
| T39 | Bank of Scotland, balances with netted branch totals | 1811-49 |
| T40 | Bank of Scotland, balances with full branch totals | 1814-40 |
| T41 | Royal Bank of Scotland, liabilities and assets | 1817-25 |
| T42 | Royal Bank of Scotland, liabilities and assets | 1830-50 |
| T43 | Dundee Banking Company, liabilities and assets | 1815-50 |
| T44 | The system: liabilities, assets and profits | 1865-1972 |
| T45 | The system: asset distribution, capitalisation and profitability ratios | 1865-1972 |
| T46 | Scottish notes and deposits as percentage of Great Britain | 1865-1972 |
| T47 | Major Scottish banks compared, ranking for total liabilities, deposits and advances | 1865-1972 |
| T48 | Bank liabilities, Edinburgh, Glasgow and northern-based banks | 1865-1972 |

### `flattened/`

Normalised long-format versions of the appendix tables, suitable for programmatic analysis.

- **`appendix_banks.csv`** -- Individual bank balance sheets (from Tables 33-43), one row per bank/date/line item. Columns include the original value, a multiplier, the computed raw value in pounds, and standardised category labels.
- **`appendix_system.csv`** -- System-wide balance sheet aggregates (from Table 44), one row per date/line item.
- **`appendix_ranks.csv`** -- Comparative rankings of the major Scottish banks by total liabilities, deposits and advances (from Table 47).

## Units

Most tables from the earlier period are denominated in thousands of pounds (shown as £1,000s in the table headers). Tables 44 and later use millions of pounds. The `multiple` column in the flattened files records the unit so that `raw_value = value * multiple`.

## Bank abbreviations

| Abbreviation | Bank |
|-------------|------|
| BS | Bank of Scotland |
| RBS | Royal Bank of Scotland |
| BLB | British Linen Bank |
| CB | Commercial Bank of Scotland |
| NB | National Bank of Scotland |
| UB | Union Bank of Scotland |
| CIB | Clydesdale and North of Scotland Bank |
| CGB | City of Glasgow Bank |

## Source

All data is transcribed from *Scottish Banking: A History, 1695-1973* by SG Checkland, Expanded Edition published 2026 by [Steakhouse Financial Ltd](https://steakhouse.financial). The original edition was published in 1975 by Collins.

The underlying sources for the tables are the published balance sheets of the Scottish banks (from 1865 onward), surviving bank ledgers, minute books and fragments (for the earlier period), and parliamentary papers. Full source notes are given in the book's Appendix 2 ("A note on Scottish banking data") and at the foot of each table.
