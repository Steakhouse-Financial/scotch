# CSV vs PDF Verification Report

Comparison of CSV tables against SCOTS_Interior-05-2026_04_13-half-letter.pdf.
Tables with no differences: T1, T4, T5, T6, T7, T8, T13, T14, T15, T17, T18, T20, T22, T25, T26, T27, T28, T35, T37, T38, T40, T42, T48.

---

## original_tables/book/T2.csv

LINE 37
CSV has `failed 1772` but PDF has `Failed 1753` (Merchants' Bank date of failure)

## original_tables/book/T3.csv

LINE 29
CSV has `c1779` for James Sterling founding date but PDF has `1789`

LINE 30
CSV has `c1779` for Adam Kier founding date but PDF has `1789`

LINE 35
CSV has `(c) Provincial Banking Companies` but PDF has `(a) Provincial Banking Companies`

LINE 77
CSV has `22` (Ended 1773-1810) but PDF has `21`

LINE 78
CSV has `37` (Total trading 31 December 1810) but PDF has `38`

## original_tables/book/T9.csv

LINE 11
CSV has `Wm Alexander and Sons c1730's` as a standalone entry; this line does not exist in the PDF

LINE 46
CSV has `Greenock Banking Cos` but PDF has `Greenock Banking Co.`

## original_tables/book/T10.csv

LINE 1
CSV has `Scotish` but PDF has `Scottish` (missing letter t)

## original_tables/book/T11.csv

LINE 23
CSV has `ended cl 849` but PDF has `Ended c1849` (Alexander Allan & Co)

LINE 37
CSV has `The Glasgow Bank (No` but PDF has `The Glasgow Bank (No. 2)` (truncated entry)

LINE 47
CSV has `to Dundee BC, 1838` but PDF has `To Dundee Banking Co., 1838`

LINE 54
CSV has `Greenock Banking Cos` but PDF has `Greenock Banking Co.`

## original_tables/book/T12.csv

LINE 2
CSV has third column header `Sept. 1824` but PDF has `Sept. 1825`

## original_tables/book/T16.csv

LINE 8
CSV has `The British Linen Bank` but PDF has `The British Linen Co.`

## original_tables/book/T19.csv

LINE 9 (1880 Scotland as % England and Wales row)
CSV has `11.20%` but PDF has `11.24`
CSV has `36.80%` but PDF has `36.84`
CSV has `255.90%` but PDF has `255.97`
CSV has `332.30%` but PDF has `332.26`
CSV has `67.40%` but PDF has `67.42`
CSV has `461.50%` but PDF has `461.54`

LINE 13 (1885 Scotland as % England and Wales row)
CSV has `9.10%` but PDF has `9.09`
CSV has `29.50%` but PDF has `29.48`
CSV has `207.90%` but PDF has `207.94`
CSV has `321.20%` but PDF has `321.21`
CSV has `63.00%` but PDF has `63.02`
CSV has `671.40%` but PDF has `671.43`
CSV has `445.50%` but PDF has `445.45`

## original_tables/book/T21.csv

LINE 7 (1886 Scotland as % England and Wales row)
CSV has `9.20%` but PDF has `9.17`
CSV has `205.40%` but PDF has `205.44`
CSV has `302.90%` but PDF has `302.86`
CSV has `62.00%` but PDF has `62.03`
CSV has `685.70%` but PDF has `685.71`
CSV has `439.30%` but PDF has `439.29`

LINE 11 (1900 Scotland as % England and Wales row)
CSV has `20.30%` but PDF has `20.33`
CSV has `147.70%` but PDF has `147.67`
CSV has `156.80%` but PDF has `156.82`
CSV has `28.20%` but PDF has `28.16`
CSV has `220.40%` but PDF has `220.41`
CSV has `147.60%` but PDF has `147.59`

LINE 15 (1914 Scotland as % England and Wales row)
CSV has `21.10%` but PDF has `21.05`
CSV has `80.80%` but PDF has `80.77`
CSV has `21.50%` but PDF has `21.49`

## original_tables/book/T23.csv

LINE 7 (1919 Scotland as % England and Wales row)
CSV has `21.60%` but PDF has `21.62`
CSV has `16.30%` but PDF has `16.33`
CSV has `120.40%` but PDF has `119.35`
CSV has `75.40%` but PDF has `75.86`
CSV has `20.90%` but PDF has `20.89`
CSV has `115.40%` but PDF has `115.44`
CSV has `155.30%` but PDF has `155.29`

LINE 11 (1931 Scotland as % England and Wales row)
CSV has `15.50%` but PDF has `15.49`
CSV has `128.20%` but PDF has `128.57`
CSV has `31.10%` but PDF has `30.89`
CSV has `34.00%` but PDF has `33.96`
CSV has `139.60%` but PDF has `139.61`

LINE 15 (1938 Scotland as % England and Wales row)
CSV has `53.30%` but PDF has `53.33`
CSV has `16.80%` but PDF has `16.76`
CSV has `138.30%` but PDF has `137.29`
CSV has `31.40%` but PDF has `31.68`
CSV has `155.30%` but PDF has `155.28`

LINE 19 (1945 Scotland as % England and Wales row)
CSV has `61.50%` but PDF has `61.54`
CSV has `14.30%` but PDF has `14.34`
CSV has `117.90%` but PDF has `118.10`
CSV has `19.50%` but PDF has `19.51`
CSV has `165.30%` but PDF has `165.31`

## original_tables/book/T24.csv

LINE 2
CSV has `G.N.P. (U.K.)` but PDF has `GDP (UK)`

## original_tables/book/T29.csv

LINE 7 (1946 Scotland as % row — all values have erroneous minus signs; several also have wrong magnitudes)
CSV has `-13.65` but PDF has `13.65`
CSV has `-114.05` but PDF has `113.51`
CSV has `-22.19` but PDF has `22.19`
CSV has `-18.68` but PDF has `18.59`
CSV has `-30.3` but PDF has `30.16`
CSV has `-158.5` but PDF has `163.03`

LINE 11 (1952 Scotland as % row — erroneous minus signs)
CSV has `-14.17` but PDF has `14.17`
CSV has `-121.78` but PDF has `121.78`
CSV has `-24.3` but PDF has `24.30`
CSV has `-19.62` but PDF has `19.62`
CSV has `-33.75` but PDF has `33.75`
CSV has `-169.54` but PDF has `169.54`

LINE 15 (1966 Scotland as % row — erroneous minus signs)
CSV has `-12.65` but PDF has `12.65`
CSV has `-117.14` but PDF has `117.14`
CSV has `-30.36` but PDF has `30.36`
CSV has `-14.55` but PDF has `14.55`
CSV has `-34.94` but PDF has `34.94`
CSV has `-134.68` but PDF has `134.68`

LINE 19 (1972 Scotland as % row — erroneous minus signs)
CSV has `-14.39` but PDF has `14.39`
CSV has `-117.03` but PDF has `117.03`
CSV has `-28.76` but PDF has `28.76`
CSV has `-14.73` but PDF has `14.73`
CSV has `-29.44` but PDF has `29.44`
CSV has `-138.1` but PDF has `138.11`

## original_tables/book/T30.csv

LINE 6
CSV has a spurious data row `,,401,,,,` which does not exist in the PDF (footnote artifact)

## original_tables/book/T31.csv

LINE 2
CSV has first year column header `1774` but PDF has `1744`

LINE 13
CSV has `17` for 1802 Assets Sundries percentage but PDF has `7`

LINE 16
CSV has `37` for 1825 Number of Branches but PDF has `137`

## original_tables/book/T32.csv

LINE 7
CSV has `1113.97` for 1905 To Public value but PDF has `113.97` (extra leading 1)

LINE 10
CSV has `106,09` (comma) for 1885 total but PDF has `106.09` (decimal point)

LINE 19
CSV has `1,563` for 1925 Number of Branches but PDF has `1,536` (digits transposed)

## original_tables/appendix3/T33.csv

LINE 27
CSV has `Source: Table 44.` but PDF has `Source: BS Ledgers`

## original_tables/appendix3/T34.csv

LINE 26
CSV has `-,9` for 1771 Due from Royal Bank percentage but PDF has `-,-`

LINE 27
CSV has `-,9` for 1771 Investments percentage but PDF has `-,-`

## original_tables/appendix3/T36.csv

MISSING ROW (between Surplus and Assets sections)
CSV is missing the entire `5. Sundries` liabilities row. PDF has: 1775: 10/2, 1780: 53/8, 1792: 34/5, 1797: -/-, 1800: 39/2, 1802: -/-, 1805: 44/2, 1810: 105/5

## original_tables/appendix3/T39.csv

LINE 4
CSV has `1365` for 1840 Deposits at head office but PDF has `1465` (subtotal 2619 and percentage 32% both confirm PDF value)

## original_tables/appendix3/T41.csv

LINE 26
CSV has `Source: BS Minutes, 1 June 1840` but PDF has `Source: RBS balance sheets`

## original_tables/appendix3/T43.csv

LINE 15
CSV has `546.7` for 1830 assets total but PDF has `477.5` (individual 1830 assets sum to 477.5; the value 546.7 is the 1835 total, duplicated in error)

## original_tables/appendix3/T44.csv

LINE 10 (Year 1872)
CSV has Distributed profits `1.292` but PDF has `1.129`

LINE 40 (Year 1902)
CSV has Notes `8:00` but PDF has `8.00` (colon instead of decimal point)

LINE 40 (Year 1902)
CSV has l&e column `129.8` but PDF has `137.5`

LINE 42 (Year 1904)
CSV has Capital `6.3` but PDF has `9.3`

LINE 90 (Year 1952)
CSV has Retained profits `1.1 41` but PDF has `1.141` (embedded space)

LINE 91 (Year 1953)
CSV has Profit before tax `5326` but PDF has `5.326` (missing decimal point)

LINE 97 (Year 1959)
CSV has Liquid Assets `33.638` but PDF has `336.38` (misplaced decimal point)

LINE 97 (Year 1959)
CSV has assets column `756.9` but PDF has `1,059.7`

LINE 104 (Year 1966)
CSV has Distributed profits `5833` but PDF has `5.833` (missing decimal point)

LINE 106 (Year 1968)
CSV has Distributed profits `6777` but PDF has `6.777` (missing decimal point)

## original_tables/appendix3/T45.csv

T45 has systematic errors where decimal points are missing from percentage values (e.g. `9524` instead of `95.24`), colons used instead of decimal points (e.g. `4:00` instead of `4.00`), and spaces embedded in numbers (e.g. `1 .64` instead of `1.64`). Below lists every affected line.

LINE 4 (1865): Advance `9524` → `95.24`; Capital and Reserve `1562` → `15.62`
LINE 5 (1866): Capital and Reserve `1529` → `15.29`
LINE 6 (1867): Capital `1104` → `11.04`; Capital and Reserve `1513` → `15.13`
LINE 7 (1868): Capital `10'82'` → `10.82` (apostrophes); Capital and Reserve `1495` → `14.95`
LINE 8 (1869): Liquid assets `2031` → `20.31`
LINE 9 (1870): Advance `9732` → `97.32`; Liquid assets `1995` → `19.95`
LINE 10 (1871): Advance `9541` → `95.41`; Capital `1019` → `10.19`; Capital and Reserve `1429` → `14.29`
LINE 12 (1873): Liquid assets `1943` → `19.43`; Profit after tax has trailing comma `1.85,` → `1.85`
LINE 13 (1874): Advance `9807` → `98.07`
LINE 14 (1875): Liquid assets `1838` → `18.38`; Profit before tax `1.31` → `1.71`
LINE 15 (1876): Advance `9744` → `97.44`; Profit before tax `1.32` → `1.72`
LINE 16 (1877): Advance `10361` → `103.61`
LINE 17 (1878): Investments `1601` → `16.01`; Liquid assets `1843` → `18.43`; Capital `950` → `9.50`
LINE 18 (1879): % distributed `9701` → `97.01`
LINE 19 (1880): Liquid assets `2329` → `23.29`
LINE 20 (1881): Liquid assets `2334` → `23.34`
LINE 21 (1882): Liquid assets `2349` → `23.49`; % distributed `9012` → `90.12`
LINE 23 (1884): Advance `8005` → `80.05`
LINE 24 (1885): Advance `8058` → `80.58`
LINE 28 (1889): Liquid assets `2761` → `27.61`
LINE 29 (1890): Liquid assets `2641` → `26.41`
LINE 30 (1891): Year `1881` → `1891`; Investments `2683` → `26.83`; Liquid assets `2571` → `25.71`
LINE 31 (1892): Investments `2836` → `28.36`; Liquid assets `2699` → `26.99`; % distributed `8860` → `88.60`
LINE 32 (1893): Advance `7103` → `71.03`; Investments `2850` → `28.50`; Liquid assets `2667` → `26.67`; Capital `778` → `7.78`; Profit after tax `143` → `1.43`; % distributed `8669` → `86.69`
LINE 33 (1894): Advance `6908` → `69.08`
LINE 35 (1896): Advance `7274` → `72.74`
LINE 36 (1897): Capital and Reserve `1313` → `13.13`
LINE 37 (1898): Profit before tax `1 .64` → `1.64` (embedded space)
LINE 38 (1899): Advance `7341` → `73.41`
LINE 39 (1900): Advance `6975` → `69.75`; Investments `2417` → `24.17`; Capital and Reserve `1261` → `12.61`; % distributed `7950` → `79.50`
LINE 40 (1901): Advance `7152` → `71.52`; Investments `2439` → `24.39`
LINE 41 (1902): Investments `2385` → `23.85`
LINE 43 (1904): Investments `2488` → `24.88`; Capital and Reserve `1372` → `13.72`
LINE 44 (1905): Advance `7402` → `74.02`; Liquid assets `2895` → `28.95`; Capital and Reserve `1389` → `13.89`; % distributed `8124` → `81.24`
LINE 45 (1906): Capital `635` → `6.35`; Dividend rate `14.85.` → `14.85` (trailing period)
LINE 47 (1908): Profit before tax `1 .72` → `1.72` (embedded space)
LINE 49 (1910): Liquid assets `2918` → `29.18`
LINE 50 (1911): Investments `2323` → `23.23`; Profit before tax `1 .71` → `1.71` (embedded space)
LINE 51 (1912): Investments `2315` → `23.15`
LINE 68 (1929): Advance, Investments, Liquid assets, Capital, Reserve, Capital and Reserve all empty in CSV but PDF has `61.87`, `35.53`, `24.84`, `3.86`, `5.66`, `9.52` (entire row of ratio data missing)
LINE 70 (1931): Advance `5365` → `53.65`
LINE 71 (1932): Advance `4261` → `42.61`; Capital `4:00` → `4.00` (colon)
LINE 72 (1933): Investments `5738` → `57.38`
LINE 73 (1934): Advance `3949` → `39.49`; Investments `5727` → `57.27`
LINE 74 (1935): Advance `3756` → `37.56`
LINE 75 (1936): Investments `6016` → `60.16`
LINE 76 (1937): Advance `3909` → `39.09`; Investments `5741` → `57.41`
LINE 77 (1938): Advance `4621` → `40.21` (wrong value and missing decimal point)
LINE 78 (1939): Advance `3949` → `39.49`
LINE 79 (1940): Advance `3192` → `31.92`; Investments `6118` → `61.18`
LINE 80 (1941): Advance `2612` → `26.12`; Investments `6816` → `68.16`; Capital and Reserve `7:04` → `7.04` (colon)
LINE 82 (1943): Advance `2118` → `21.18`; Investments `7118` → `71.18`
LINE 83 (1944): Advance `1935` → `19.35`
LINE 84 (1945): Advance `1802` → `18.02`
LINE 85 (1946): Advance `1963` → `19.63`
LINE 87 (1948): Advance `2354` → `23.54`
LINE 88 (1949): Advance `2780` → `27.80`
LINE 91 (1952): Advance `3369` → `33.69`
LINE 93 (1954): Advance `3414` → `34.14`
LINE 95 (1956): Advance `3554` → `35.54`
LINE 96 (1957): Advance `3699` → `36.99`
LINE 97 (1958): Advance `3824` → `38.24`
LINE 98 (1959): Advance `4518` → `45.18`
LINE 99 (1960): Advance `5108` → `51.08`
LINE 100 (1961): Advance `5348` → `53.48`
LINE 101 (1962): Advance `5750` → `57.50`
LINE 102 (1963): Advance `5888` → `58.88`; Capital `3:10` → `2.70` (wrong value and colon)
LINE 105 (1966): Advance `6016` → `60.16`
LINE 106 (1967): Reserve `3:16` → `3.16` (colon instead of decimal point)

## original_tables/appendix3/T46.csv

LINE 3 (Year 1870)
CSV has Notes `14.76` but PDF has `14.78`

## original_tables/appendix3/T47.csv

LINE 26 (Year 1960)
CSV has CB Advances ranking `21` but PDF has `2`

LINE 27 (Year 1965)
CSV has CB Advances ranking `21` but PDF has `2`
