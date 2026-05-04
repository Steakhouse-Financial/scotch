// ────────────────────────────────────────────────────────────────
// chart-analytics.js — Compact analytical companion charts
// Renders the 8 sub-charts that flank the headline System and
// Bank Rankings views. Each chart is small, single-purpose, and
// shares a common look-and-feel with the rest of the dashboard.
// ────────────────────────────────────────────────────────────────

import { catmullRom, el, nearestIdx } from './utils.js';

const W = 1280;
const H = 420;
const M = { top: 28, right: 28, bottom: 44, left: 64 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;

const CRISIS_MARKERS = [
  { year: 1878, label: 'CGB' },
  { year: 1914, label: 'WWI' },
  { year: 1929, label: 'Crash' },
  { year: 1939, label: 'WWII' },
];

const SERIES_COLORS = [
  'var(--brand-emerald)',
  'var(--brand-ochre)',
  'var(--brand-plum)',
  'var(--brand-sky)',
  'var(--brand-orange)',
];

// Cache parsed CSV rows so each chart doesn't refetch.
const cache = new Map();

// The appendix CSVs have a 1-2 line preamble (table title + units)
// before the column-name row. Pass `skipLines` to drop those lines and
// parse the remainder with PapaParse using the chosen row as headers.
// Several appendix tables leave the year column unlabelled, so we also
// normalise it back to "Year" for downstream code.
async function loadAppendixCSV(path, skipLines = 1) {
  const cacheKey = `${path}|${skipLines}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const promise = (async () => {
    const resp = await fetch(path);
    const text = await resp.text();
    const lines = text.split(/\r?\n/);
    const trimmed = lines.slice(skipLines).join('\n');
    const result = Papa.parse(trimmed, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });
    return result.data.map(row => {
      if (row.Year != null) return row;
      // Find a column whose value looks like a 4-digit year and rename it.
      for (const k of Object.keys(row)) {
        const v = row[k];
        if (typeof v === 'number' && v > 1600 && v < 2100) {
          row.Year = v;
          if (k !== 'Year') delete row[k];
          break;
        }
      }
      return row;
    });
  })();
  cache.set(cacheKey, promise);
  return promise;
}

function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

// Skip the table-title and column-header rows in the appendix CSVs:
// rows whose Year column is not numeric.
function cleanRows(rows, yearKey = 'Year') {
  return rows
    .map(r => {
      const y = num(r[yearKey]);
      if (y == null) return null;
      const out = { Year: y };
      for (const k of Object.keys(r)) {
        if (k === yearKey) continue;
        out[k] = num(r[k]);
      }
      return out;
    })
    .filter(Boolean)
    .sort((a, b) => a.Year - b.Year);
}

// ── Shared rendering primitives ────────────────────────────────

function buildScales(years, yMin, yMax) {
  const xMin = years[0];
  const xMax = years[years.length - 1];
  const xAt = y => M.left + ((y - xMin) / (xMax - xMin || 1)) * PLOT_W;
  const yAt = v => M.top + ((yMax - v) / (yMax - yMin || 1)) * PLOT_H;
  return { xAt, yAt, xMin, xMax };
}

function niceTicks(min, max, count = 5) {
  const range = max - min;
  const rough = range / count;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const n = rough / pow;
  let step;
  if (n < 1.5) step = 1;
  else if (n < 3) step = 2;
  else if (n < 7) step = 5;
  else step = 10;
  step *= pow;
  const start = Math.ceil(min / step) * step;
  const ticks = [];
  for (let v = start; v <= max + 1e-9; v += step) ticks.push(+v.toFixed(8));
  return ticks;
}

function pickYearTicks(xMin, xMax) {
  const span = xMax - xMin;
  let step = 25;
  if (span <= 60) step = 10;
  else if (span <= 120) step = 20;
  const start = Math.ceil(xMin / step) * step;
  const ticks = [];
  for (let y = start; y <= xMax; y += step) ticks.push(y);
  if (ticks[0] !== xMin) ticks.unshift(xMin);
  if (ticks[ticks.length - 1] !== xMax) ticks.push(xMax);
  return ticks;
}

function drawAxes(svg, xAt, yAt, xMin, xMax, yTicks, yLabel, opts = {}) {
  const grid = el('g', { class: 'mini-grid' }, svg);

  for (const t of yTicks) {
    const y = yAt(t);
    el('line', {
      class: 'grid-line dashed',
      x1: M.left, x2: W - M.right, y1: y, y2: y,
    }, grid);
    el('text', {
      class: 'axis-label',
      x: M.left - 10, y: y + 3, 'text-anchor': 'end',
    }, grid).textContent = opts.fmtY ? opts.fmtY(t) : t;
  }

  if (yLabel) {
    el('text', {
      class: 'axis-label',
      x: M.left - 10, y: M.top - 10, 'text-anchor': 'end',
    }, grid).textContent = yLabel;
  }

  for (const yr of pickYearTicks(xMin, xMax)) {
    const x = xAt(yr);
    el('line', {
      class: 'grid-line',
      x1: x, x2: x, y1: M.top, y2: H - M.bottom,
      stroke: 'var(--brand-bone-deep)', 'stroke-width': 0.5,
    }, grid);
    el('text', {
      class: 'axis-year',
      x, y: H - M.bottom + 20,
    }, grid).textContent = yr;
  }

  el('rect', {
    x: M.left, y: M.top,
    width: PLOT_W, height: PLOT_H,
    fill: 'none',
    stroke: 'var(--brand-charcoal)',
    'stroke-width': 1,
  }, svg);
}

function drawCrisisMarkers(svg, xAt, xMin, xMax, markers) {
  if (!markers) return;
  const g = el('g', { class: 'crisis-markers' }, svg);
  for (const m of markers) {
    if (m.year < xMin || m.year > xMax) continue;
    const x = xAt(m.year);
    el('line', {
      x1: x, x2: x, y1: M.top, y2: H - M.bottom,
      stroke: 'var(--brand-charcoal)',
      'stroke-opacity': 0.35,
      'stroke-dasharray': '3 4',
      'stroke-width': 1,
    }, g);
    el('text', {
      class: 'crisis-label',
      x: x + 4, y: M.top + 12,
    }, g).textContent = m.label;
  }
}

function drawCrisisBands(svg, xAt, xMin, xMax, bands) {
  if (!bands) return;
  const g = el('g', { class: 'crisis-bands' }, svg);
  for (const b of bands) {
    const x0 = Math.max(xMin, b.from);
    const x1 = Math.min(xMax, b.to);
    if (x1 <= x0) continue;
    const xa = xAt(x0), xb = xAt(x1);
    el('rect', {
      x: xa, y: M.top, width: xb - xa, height: PLOT_H,
      fill: 'var(--brand-orange)', 'fill-opacity': 0.06,
    }, g);
    el('text', {
      class: 'crisis-label',
      x: (xa + xb) / 2, y: M.top + 12, 'text-anchor': 'middle',
    }, g).textContent = b.label;
  }
}

function drawSeriesLine(svg, points, color, opts = {}) {
  const filtered = points.filter(p => p[1] != null);
  if (filtered.length < 2) return;
  const d = catmullRom(filtered, 0.5);
  el('path', {
    d, fill: 'none',
    stroke: color, 'stroke-width': 2,
    'stroke-dasharray': opts.dashed ? '4 4' : null,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  }, svg);

  if (opts.fillBelow) {
    const yBase = opts.fillBaseline;
    let area = `M ${filtered[0][0]} ${yBase} L `;
    for (const [x, y] of filtered) area += `${x} ${y} `;
    area += `L ${filtered[filtered.length - 1][0]} ${yBase} Z`;
    el('path', {
      d: area, fill: color, 'fill-opacity': 0.1, stroke: 'none',
    }, svg);
  }

  if (opts.markers) {
    for (const [x, y] of filtered) {
      el('circle', {
        cx: x, cy: y, r: 2.5,
        fill: 'var(--brand-bone)', stroke: color, 'stroke-width': 1.5,
      }, svg);
    }
  }
}

function drawHorizontalReference(svg, yAt, yVal, label, color = 'var(--brand-slate)') {
  const y = yAt(yVal);
  el('line', {
    x1: M.left, x2: W - M.right, y1: y, y2: y,
    stroke: color, 'stroke-width': 1,
    'stroke-dasharray': '6 4',
  }, svg);
  if (label) {
    el('text', {
      class: 'reference-label',
      x: W - M.right - 6, y: y - 4, 'text-anchor': 'end', fill: color,
    }, svg).textContent = label;
  }
}

function drawLegend(legendEl, series) {
  legendEl.innerHTML = series
    .map(s => `
      <span class="mini-legend-item">
        <span class="mini-legend-swatch" style="background:${s.color}"></span>
        <span>${s.label}</span>
      </span>
    `)
    .join('');
}

function setupHover(svg, tooltipEl, wrapEl, years, rowsByIdx, fmtRow) {
  const xMin = years[0], xMax = years[years.length - 1];
  const xAt = y => M.left + ((y - xMin) / (xMax - xMin || 1)) * PLOT_W;

  const cursor = el('line', {
    class: 'cursor-line',
    x1: 0, x2: 0,
    y1: M.top, y2: H - M.bottom,
  }, svg);

  const overlay = el('rect', {
    x: M.left, y: M.top, width: PLOT_W, height: PLOT_H,
    fill: 'transparent', cursor: 'crosshair',
  }, svg);

  overlay.addEventListener('mousemove', e => {
    const rect = svg.getBoundingClientRect();
    const scale = rect.width / W;
    const px = (e.clientX - rect.left) / scale;
    const yv = xMin + ((px - M.left) / PLOT_W) * (xMax - xMin);
    const idx = nearestIdx(years, yv);
    const cx = xAt(years[idx]);
    cursor.setAttribute('x1', cx);
    cursor.setAttribute('x2', cx);
    cursor.classList.add('visible');

    tooltipEl.innerHTML = fmtRow(rowsByIdx[idx], years[idx]);
    tooltipEl.classList.add('visible');

    const wrap = wrapEl.getBoundingClientRect();
    const lx = e.clientX - wrap.left;
    const ly = e.clientY - wrap.top;
    const tw = tooltipEl.offsetWidth;
    const th = tooltipEl.offsetHeight;
    let left = lx + 16;
    if (left + tw > wrap.width - 8) left = lx - tw - 16;
    left = Math.max(8, Math.min(wrap.width - tw - 8, left));
    let top = ly - th / 2;
    top = Math.max(8, Math.min(wrap.height - th - 8, top));
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
  });

  overlay.addEventListener('mouseleave', () => {
    cursor.classList.remove('visible');
    tooltipEl.classList.remove('visible');
  });
}

function prepareContainer(containerId) {
  const wrap = document.getElementById(`${containerId}-wrap`);
  const svg = document.getElementById(`${containerId}-svg`);
  const tooltip = document.getElementById(`${containerId}-tooltip`);
  const legend = document.getElementById(`${containerId}-legend`);
  const loading = document.getElementById(`${containerId}-loading`);
  if (!svg || !wrap) return null;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  if (loading) loading.remove();
  return { wrap, svg, tooltip, legend };
}

// ────────────────────────────────────────────────────────────────
// Chart 1: Long Decline of Capital Ratios (1744-1972)
// ────────────────────────────────────────────────────────────────
export async function initCapitalRatioChart(containerId) {
  const ctx = prepareContainer(containerId);
  if (!ctx) return;
  const { svg, tooltip, wrap, legend } = ctx;

  const earlyData = [
    { Year: 1744, ratio: 54 },
    { Year: 1772, ratio: 36 },
    { Year: 1802, ratio: 29 },
    { Year: 1825, ratio: 27 },
    { Year: 1850, ratio: 27 },
  ];

  const t44Raw = await loadAppendixCSV('./original_tables/appendix3/T44.csv', 1);
  const t44 = cleanRows(t44Raw);
  const fromT44 = t44
    .map(r => {
      const cap = (r.Capital || 0) + (r.Reserve || 0);
      const tpl = r['Total Public Liabilities'] || 0;
      const total = cap + tpl;
      if (!total) return null;
      return { Year: r.Year, ratio: +(cap / total * 100).toFixed(2) };
    })
    .filter(Boolean);

  const data = [...earlyData, ...fromT44].sort((a, b) => a.Year - b.Year);
  const years = data.map(r => r.Year);

  const { xAt, yAt, xMin, xMax } = buildScales(years, 0, 60);
  const yTicks = niceTicks(0, 60, 6);

  drawAxes(svg, xAt, yAt, xMin, xMax, yTicks, '%', { fmtY: t => t + '%' });

  const points = data.map(r => [xAt(r.Year), yAt(r.ratio)]);
  drawSeriesLine(svg, points, 'var(--brand-orange)', {
    fillBelow: true, fillBaseline: yAt(0), markers: true,
  });

  drawLegend(legend, [
    { label: 'Capital + Reserves (% of total liabilities & equity)', color: 'var(--brand-orange)' },
  ]);

  setupHover(svg, tooltip, wrap, years, data, (row, year) => `
    <h4>${year}</h4>
    <div class="sub">Capital cushion</div>
    <div class="row"><span>Capital + Reserves</span><b>${row.ratio.toFixed(1)}%</b></div>
  `);
}

// ────────────────────────────────────────────────────────────────
// Chart 2: Asset Composition (1865-1972)
// Advances / Investments / Liquid Assets, % of deposits
// ────────────────────────────────────────────────────────────────
export async function initAssetCompositionChart(containerId) {
  const ctx = prepareContainer(containerId);
  if (!ctx) return;
  const { svg, tooltip, wrap, legend } = ctx;

  // T45 has 2 preamble rows before the headerline ("Advance,Investments,...")
  const t45Raw = await loadAppendixCSV('./original_tables/appendix3/T45.csv', 1);
  const data = t45Raw
    .map(r => ({
      Year: num(r.Year),
      Advances: num(r.Advance) ?? num(r.Advances),
      Investments: num(r.Investments),
      Liquid: num(r['Liquid assets']) ?? num(r['Liquid Assets']),
    }))
    .filter(r => r.Year != null && r.Advances != null);

  const series = [
    { key: 'Advances', label: 'Advances', color: SERIES_COLORS[0] },
    { key: 'Investments', label: 'Investments', color: SERIES_COLORS[1] },
    { key: 'Liquid', label: 'Liquid Assets', color: SERIES_COLORS[2] },
  ];

  const years = data.map(r => r.Year);
  const dataMax = Math.max(
    ...data.flatMap(r => series.map(s => r[s.key] ?? 0)),
  );
  // Round up to the next 10 with a small headroom so the highest line
  // (advances briefly exceeded 100% of deposits in the 1870s) sits inside
  // the plot frame.
  const ymax = Math.ceil((dataMax + 5) / 10) * 10;
  const { xAt, yAt, xMin, xMax } = buildScales(years, 0, ymax);
  const yTicks = niceTicks(0, ymax, 5);

  drawAxes(svg, xAt, yAt, xMin, xMax, yTicks, '%', { fmtY: t => t + '%' });
  drawCrisisBands(svg, xAt, xMin, xMax, [
    { from: 1914, to: 1918, label: 'WWI' },
    { from: 1939, to: 1945, label: 'WWII' },
  ]);

  for (const s of series) {
    const pts = data.map(r => [xAt(r.Year), r[s.key] != null ? yAt(r[s.key]) : null]);
    drawSeriesLine(svg, pts, s.color);
  }

  drawLegend(legend, series);

  setupHover(svg, tooltip, wrap, years, data, (row, year) => `
    <h4>${year}</h4>
    <div class="sub">% of Deposits</div>
    ${series.map(s => `
      <div class="row"><span><span class="dot" style="background:${s.color}"></span>${s.label}</span><b>${row[s.key] != null ? row[s.key].toFixed(1) + '%' : '—'}</b></div>
    `).join('')}
  `);
}

// ────────────────────────────────────────────────────────────────
// Chart 3: Branch Density — Scotland vs England (1886-1972)
// Grouped bar chart, hand-built data from Checkland's comparisons
// ────────────────────────────────────────────────────────────────
export async function initBranchDensityChart(containerId) {
  const ctx = prepareContainer(containerId);
  if (!ctx) return;
  const { svg, legend } = ctx;

  const data = [
    { Year: 1886, Scotland: 0.246, England: 0.056 },
    { Year: 1914, Scotland: 0.288, England: 0.127 },
    { Year: 1946, Scotland: 0.344, England: 0.211 },
    { Year: 1952, Scotland: 0.333, England: 0.232 },
    { Year: 1966, Scotland: 0.307, England: 0.264 },
    { Year: 1972, Scotland: 0.316, England: 0.265 },
  ];

  const ymax = 0.4;
  const yTicks = [0, 0.1, 0.2, 0.3, 0.4];
  const yAt = v => M.top + ((ymax - v) / ymax) * PLOT_H;

  // Categorical X
  const slot = PLOT_W / data.length;
  const groupPad = slot * 0.2;
  const innerW = slot - groupPad;
  const barW = innerW / 2 * 0.8;
  const barGap = (innerW / 2) - barW;

  const grid = el('g', { class: 'mini-grid' }, svg);
  for (const t of yTicks) {
    const y = yAt(t);
    el('line', {
      class: 'grid-line dashed',
      x1: M.left, x2: W - M.right, y1: y, y2: y,
    }, grid);
    el('text', {
      class: 'axis-label',
      x: M.left - 10, y: y + 3, 'text-anchor': 'end',
    }, grid).textContent = t.toFixed(2);
  }
  el('text', {
    class: 'axis-label',
    x: M.left - 10, y: M.top - 10, 'text-anchor': 'end',
  }, grid).textContent = 'offices / 1,000 pop';

  data.forEach((row, i) => {
    const cx = M.left + slot * i + slot / 2;
    const xS = cx - barW - barGap / 2;
    const xE = cx + barGap / 2;

    el('rect', {
      x: xS, y: yAt(row.Scotland),
      width: barW, height: yAt(0) - yAt(row.Scotland),
      fill: 'var(--brand-emerald)',
    }, svg);
    el('rect', {
      x: xE, y: yAt(row.England),
      width: barW, height: yAt(0) - yAt(row.England),
      fill: 'var(--brand-ochre)',
    }, svg);

    el('text', {
      x: xS + barW / 2, y: yAt(row.Scotland) - 6, 'text-anchor': 'middle',
      class: 'bar-value',
    }, svg).textContent = row.Scotland.toFixed(2);
    el('text', {
      x: xE + barW / 2, y: yAt(row.England) - 6, 'text-anchor': 'middle',
      class: 'bar-value',
    }, svg).textContent = row.England.toFixed(2);

    el('text', {
      x: cx, y: H - M.bottom + 20, 'text-anchor': 'middle',
      class: 'axis-year',
    }, svg).textContent = row.Year;
  });

  el('rect', {
    x: M.left, y: M.top, width: PLOT_W, height: PLOT_H,
    fill: 'none', stroke: 'var(--brand-charcoal)', 'stroke-width': 1,
  }, svg);

  drawLegend(legend, [
    { label: 'Scotland', color: 'var(--brand-emerald)' },
    { label: 'England & Wales', color: 'var(--brand-ochre)' },
  ]);
}

// ────────────────────────────────────────────────────────────────
// Chart 4: Scotland's Share of Great Britain (1865-1972)
// Notes and Deposits as % of GB total — T46
// ────────────────────────────────────────────────────────────────
export async function initScotlandShareChart(containerId) {
  const ctx = prepareContainer(containerId);
  if (!ctx) return;
  const { svg, tooltip, wrap, legend } = ctx;

  const raw = await loadAppendixCSV('./original_tables/appendix3/T46.csv', 1);
  const data = raw
    .map(r => {
      const keys = Object.keys(r);
      const noteKey = keys.find(k => /Note/i.test(k));
      const depKey = keys.find(k => /Deposit/i.test(k));
      return {
        Year: num(r.Year),
        Notes: noteKey ? num(r[noteKey]) : null,
        Deposits: depKey ? num(r[depKey]) : null,
      };
    })
    .filter(r => r.Year != null && (r.Notes != null || r.Deposits != null));

  const years = data.map(r => r.Year);
  const ymax = 30;
  const { xAt, yAt, xMin, xMax } = buildScales(years, 0, ymax);
  const yTicks = niceTicks(0, ymax, 6);

  drawAxes(svg, xAt, yAt, xMin, xMax, yTicks, '%', { fmtY: t => t + '%' });

  const series = [
    { key: 'Notes', label: 'Notes (Scottish % of GB)', color: SERIES_COLORS[0] },
    { key: 'Deposits', label: 'Deposits (Scottish % of GB)', color: SERIES_COLORS[1] },
  ];

  for (const s of series) {
    const pts = data.map(r => [xAt(r.Year), r[s.key] != null ? yAt(r[s.key]) : null]);
    drawSeriesLine(svg, pts, s.color, { markers: true });
  }

  drawHorizontalReference(svg, yAt, 10, "Scotland's ~10% pop. share");

  drawLegend(legend, series);

  setupHover(svg, tooltip, wrap, years, data, (row, year) => `
    <h4>${year}</h4>
    <div class="sub">Scottish share of GB</div>
    ${series.map(s => `
      <div class="row"><span><span class="dot" style="background:${s.color}"></span>${s.label.split(' (')[0]}</span><b>${row[s.key] != null ? row[s.key].toFixed(1) + '%' : '—'}</b></div>
    `).join('')}
  `);
}

// ────────────────────────────────────────────────────────────────
// Chart 5: System Profitability (1865-1972) — T45
// Profit before/after tax as % of deposits
// ────────────────────────────────────────────────────────────────
export async function initSystemProfitabilityChart(containerId) {
  const ctx = prepareContainer(containerId);
  if (!ctx) return;
  const { svg, tooltip, wrap, legend } = ctx;

  const raw = await loadAppendixCSV('./original_tables/appendix3/T45.csv', 1);
  const data = raw
    .map(r => ({
      Year: num(r.Year),
      ProfitBT: num(r['Profit before tax']),
      ProfitAT: num(r['Profit after tax']),
    }))
    .filter(r => r.Year != null && r.ProfitBT != null);

  const years = data.map(r => r.Year);
  const ymax = 2.5;
  const { xAt, yAt, xMin, xMax } = buildScales(years, 0, ymax);
  const yTicks = [0, 0.5, 1.0, 1.5, 2.0, 2.5];

  drawAxes(svg, xAt, yAt, xMin, xMax, yTicks, '%', { fmtY: t => t.toFixed(1) + '%' });
  drawCrisisMarkers(svg, xAt, xMin, xMax, CRISIS_MARKERS);

  const series = [
    { key: 'ProfitBT', label: 'Profit before tax', color: SERIES_COLORS[0] },
    { key: 'ProfitAT', label: 'Profit after tax', color: SERIES_COLORS[2] },
  ];
  for (const s of series) {
    const pts = data.map(r => [xAt(r.Year), r[s.key] != null ? yAt(r[s.key]) : null]);
    drawSeriesLine(svg, pts, s.color);
  }

  drawLegend(legend, series);

  setupHover(svg, tooltip, wrap, years, data, (row, year) => `
    <h4>${year}</h4>
    <div class="sub">% of Deposits</div>
    ${series.map(s => `
      <div class="row"><span><span class="dot" style="background:${s.color}"></span>${s.label}</span><b>${row[s.key] != null ? row[s.key].toFixed(2) + '%' : '—'}</b></div>
    `).join('')}
  `);
}

// ────────────────────────────────────────────────────────────────
// Chart 6: Return on Equity (1865-1972) — T44 derived
// Profit before tax / (Capital + Reserve)
// ────────────────────────────────────────────────────────────────
export async function initReturnOnEquityChart(containerId) {
  const ctx = prepareContainer(containerId);
  if (!ctx) return;
  const { svg, tooltip, wrap, legend } = ctx;

  const t44Raw = await loadAppendixCSV('./original_tables/appendix3/T44.csv', 1);
  const t44 = cleanRows(t44Raw);
  const data = t44
    .map(r => {
      const eq = (r.Capital || 0) + (r.Reserve || 0);
      const pbt = r['Profit before tax'];
      if (!eq || pbt == null) return null;
      return { Year: r.Year, ROE: +(pbt / eq * 100).toFixed(2) };
    })
    .filter(Boolean);

  const years = data.map(r => r.Year);
  const allROE = data.map(r => r.ROE);
  const ymax = Math.max(20, Math.ceil(Math.max(...allROE) / 5) * 5);
  const { xAt, yAt, xMin, xMax } = buildScales(years, 0, ymax);
  const yTicks = niceTicks(0, ymax, 5);

  drawAxes(svg, xAt, yAt, xMin, xMax, yTicks, '%', { fmtY: t => t + '%' });
  drawCrisisMarkers(svg, xAt, xMin, xMax, CRISIS_MARKERS);

  const pts = data.map(r => [xAt(r.Year), yAt(r.ROE)]);
  drawSeriesLine(svg, pts, 'var(--brand-emerald)', {
    fillBelow: true, fillBaseline: yAt(0),
  });

  drawLegend(legend, [
    { label: 'Return on Equity (Profit before tax / Capital + Reserves)', color: 'var(--brand-emerald)' },
  ]);

  setupHover(svg, tooltip, wrap, years, data, (row, year) => `
    <h4>${year}</h4>
    <div class="sub">Return on equity</div>
    <div class="row"><span>ROE</span><b>${row.ROE.toFixed(1)}%</b></div>
  `);
}

// ────────────────────────────────────────────────────────────────
// Chart 7: Capital Adequacy — Basel lens (1865-1972) — T45
// Capital + Reserve as % of Total Public Liabilities
// ────────────────────────────────────────────────────────────────
export async function initCapitalAdequacyChart(containerId) {
  const ctx = prepareContainer(containerId);
  if (!ctx) return;
  const { svg, tooltip, wrap, legend } = ctx;

  const raw = await loadAppendixCSV('./original_tables/appendix3/T45.csv', 1);
  const data = raw
    .map(r => ({
      Year: num(r.Year),
      CapRes: num(r['Capital and Reserve']),
    }))
    .filter(r => r.Year != null && r.CapRes != null);

  const years = data.map(r => r.Year);
  const ymax = 18;
  const { xAt, yAt, xMin, xMax } = buildScales(years, 0, ymax);
  const yTicks = [0, 3, 6, 8, 12, 15, 18];

  drawAxes(svg, xAt, yAt, xMin, xMax, yTicks, '%', { fmtY: t => t + '%' });
  drawCrisisMarkers(svg, xAt, xMin, xMax, CRISIS_MARKERS);

  const pts = data.map(r => [xAt(r.Year), yAt(r.CapRes)]);
  drawSeriesLine(svg, pts, 'var(--brand-orange)', {
    fillBelow: true, fillBaseline: yAt(0),
  });

  drawHorizontalReference(svg, yAt, 8, 'Basel III ~8% Tier 1 (indicative)', 'var(--brand-emerald)');
  drawHorizontalReference(svg, yAt, 3, 'Basel III 3% leverage ratio', 'var(--brand-orange)');

  drawLegend(legend, [
    { label: 'Capital + Reserves (% of public liabilities)', color: 'var(--brand-orange)' },
    { label: 'Basel III references (indicative)', color: 'var(--brand-slate)' },
  ]);

  setupHover(svg, tooltip, wrap, years, data, (row, year) => `
    <h4>${year}</h4>
    <div class="sub">Leverage ratio</div>
    <div class="row"><span>Cap + Res / Liab</span><b>${row.CapRes.toFixed(1)}%</b></div>
  `);
}

// ────────────────────────────────────────────────────────────────
// Chart 8: Crisis Impact — Asset ratios around shocks (1865-1972)
// T44 derived: Adv/Dep, Inv/Dep, Liq/Dep, with WWI & WWII bands
// ────────────────────────────────────────────────────────────────
export async function initCrisisImpactChart(containerId) {
  const ctx = prepareContainer(containerId);
  if (!ctx) return;
  const { svg, tooltip, wrap, legend } = ctx;

  const t44Raw = await loadAppendixCSV('./original_tables/appendix3/T44.csv', 1);
  const t44 = cleanRows(t44Raw);
  const data = t44
    .map(r => {
      const dep = r.Deposits;
      if (!dep) return null;
      return {
        Year: r.Year,
        AdvDep: r.Advances != null ? +(r.Advances / dep * 100).toFixed(2) : null,
        InvDep: r.Investments != null ? +(r.Investments / dep * 100).toFixed(2) : null,
        LiqDep: r['Liquid Assets'] != null ? +(r['Liquid Assets'] / dep * 100).toFixed(2) : null,
      };
    })
    .filter(Boolean);

  const years = data.map(r => r.Year);
  const ymax = 110;
  const { xAt, yAt, xMin, xMax } = buildScales(years, 0, ymax);
  const yTicks = [0, 25, 50, 75, 100];

  drawAxes(svg, xAt, yAt, xMin, xMax, yTicks, '%', { fmtY: t => t + '%' });
  drawCrisisBands(svg, xAt, xMin, xMax, [
    { from: 1914, to: 1918, label: 'WWI' },
    { from: 1939, to: 1945, label: 'WWII' },
  ]);

  const series = [
    { key: 'AdvDep', label: 'Advances / Deposits', color: SERIES_COLORS[0] },
    { key: 'InvDep', label: 'Investments / Deposits', color: SERIES_COLORS[1] },
    { key: 'LiqDep', label: 'Liquid Assets / Deposits', color: SERIES_COLORS[2] },
  ];
  for (const s of series) {
    const pts = data.map(r => [xAt(r.Year), r[s.key] != null ? yAt(r[s.key]) : null]);
    drawSeriesLine(svg, pts, s.color);
  }

  drawLegend(legend, series);

  setupHover(svg, tooltip, wrap, years, data, (row, year) => `
    <h4>${year}</h4>
    <div class="sub">Asset ratios</div>
    ${series.map(s => `
      <div class="row"><span><span class="dot" style="background:${s.color}"></span>${s.label}</span><b>${row[s.key] != null ? row[s.key].toFixed(0) + '%' : '—'}</b></div>
    `).join('')}
  `);
}
