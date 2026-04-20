// ────────────────────────────────────────────────────────────────
// chart-system.js — ES module: system-wide stacked area chart
// Ported from sbank/Scottish Banking System.html
// ────────────────────────────────────────────────────────────────

import {
  hexToHsl, hslToHex, buildRamp, catmullRom, drawStack,
  niceCeil, fmtShort, fmt, nearestIdx, formatDate, el
} from './utils.js';

// ── Configuration ────────────────────────────────────────────────
const CFG = {
  width: 1280,
  height: 620,
  margin: { top: 30, right: 24, bottom: 44, left: 78 },
};

// ── Category orders ──────────────────────────────────────────────
const ASSET_ORDER = ['Advances', 'Investments', 'Liquid Assets', 'Notes (other banks)', 'Property'];
const LIAB_ORDER  = ['Deposits', 'Notes', 'Notes (other banks)', 'Other liabilities'];
const EQ_ORDER    = ['Capital'];

// ── Base hues ────────────────────────────────────────────────────
const ASSET_HUE  = '#086552';  // emerald
const LIAB_HUE   = '#DAA544';  // ochre
const EQUITY_HUE = '#934997';  // plum

// ── Color ramps (derived once) ───────────────────────────────────
const ASSET_COLORS = Object.fromEntries(
  ASSET_ORDER.map((k, i) => [k, buildRamp(ASSET_HUE, ASSET_ORDER.length)[i]])
);
const LIAB_COLORS = Object.fromEntries(
  LIAB_ORDER.map((k, i) => [k, buildRamp(LIAB_HUE, LIAB_ORDER.length)[i]])
);
const EQ_COLORS = Object.fromEntries(
  EQ_ORDER.map((k, i) => [k, buildRamp(EQUITY_HUE, EQ_ORDER.length)[i]])
);

// ── Annotations ──────────────────────────────────────────────────
const ANNOTATIONS = [
  { year: 1695, label: 'Bank of Scotland founded', place: 'bottom' },
  { year: 1727, label: 'Royal Bank founded', place: 'top' },
  { year: 1772, label: 'Ayr Bank crisis', place: 'top' },
  { year: 1810, label: 'System zenith', place: 'bottom' },
  { year: 1845, label: 'Bank Notes Act', place: 'bottom' },
  { year: 1857, label: 'Western Bank failure', place: 'top' },
  { year: 1878, label: 'City of Glasgow Bank failure', place: 'top' },
  { year: 1914, label: 'WWI', place: 'top' },
  { year: 1919, label: 'Post-war depression', place: 'bottom' },
  { year: 1939, label: 'WWII', place: 'top' },
  { year: 1945, label: 'Reconstruction', place: 'bottom' },
  { year: 1959, label: 'Banking revolution', place: 'top' },
];

// ── Module-level state ───────────────────────────────────────────
let DATA = null;
let currentYScale = 'normal';
let showAnnotations = false;

// DOM references (set during init)
let svgEl, tooltipEl, legendEl, wrapEl;

// ────────────────────────────────────────────────────────────────
// Public export
// ────────────────────────────────────────────────────────────────
export async function initSystemChart(containerId) {
  wrapEl      = document.getElementById(`${containerId}-wrap`);
  svgEl       = document.getElementById(`${containerId}-svg`);
  tooltipEl   = document.getElementById(`${containerId}-tooltip`);
  legendEl    = document.getElementById(`${containerId}-legend`);

  const yScaleEl = document.getElementById(`${containerId}-yscale`);
  const annotEl  = document.getElementById(`${containerId}-annot`);

  // Fetch system data
  const resp = await fetch('../sbank/data.json');
  DATA = await resp.json();

  // Wire y-scale segmented control
  const yBtns = yScaleEl.querySelectorAll('button');
  function syncYBtns() {
    yBtns.forEach(b => b.classList.toggle('active', b.dataset.yscale === currentYScale));
  }
  yBtns.forEach(b => b.addEventListener('click', () => {
    currentYScale = b.dataset.yscale;
    syncYBtns();
    render({ animate: false });
  }));
  syncYBtns();

  // Wire annotations checkbox
  annotEl.checked = showAnnotations;
  annotEl.addEventListener('change', () => {
    showAnnotations = annotEl.checked;
    render({ animate: false });
  });

  // Initial render with animation
  render({ animate: true });
}

// ────────────────────────────────────────────────────────────────
// Render
// ────────────────────────────────────────────────────────────────
function render(opts = {}) {
  const animate = opts.animate !== false;
  const years = DATA.years;
  const data  = DATA.data;
  const yScale = currentYScale;

  // X scale: linear by year
  const xMin = years[0], xMax = years[years.length - 1];
  const plotW = CFG.width - CFG.margin.left - CFG.margin.right;
  const plotH = CFG.height - CFG.margin.top - CFG.margin.bottom;
  const xAt = y => CFG.margin.left + ((y - xMin) / (xMax - xMin)) * plotW;

  // Per-row totals (for percent mode & tooltip)
  const totalsA  = data.map(d => d.a.reduce((s, v) => s + v, 0));
  const totalsLE = data.map(d => -(d.l.reduce((s, v) => s + v, 0) + d.e.reduce((s, v) => s + v, 0)));

  // Y transform
  let yAt;
  let posTicks = [], negTicks = [];
  const yZero = CFG.margin.top + plotH / 2;
  const halfH = plotH / 2;

  if (yScale === 'percent') {
    yAt = (v, rowIdx) => {
      const t = v >= 0 ? totalsA[rowIdx] : totalsLE[rowIdx];
      if (!t) return yZero;
      const frac = v / t;
      return yZero - frac * halfH;
    };
    posTicks = [0.25, 0.5, 0.75, 1.0];
    negTicks = posTicks;
  } else if (yScale === 'log') {
    let maxMag = 0;
    for (let i = 0; i < data.length; i++) maxMag = Math.max(maxMag, totalsA[i], totalsLE[i]);
    const lo = 1e5, hi = maxMag;
    const lg = Math.log10;
    const span = lg(hi) - lg(lo);
    yAt = (v) => {
      if (v === 0) return yZero;
      const sign = v >= 0 ? -1 : 1;
      const m = Math.max(lo, Math.abs(v));
      const frac = (lg(m) - lg(lo)) / span;
      return yZero + sign * frac * halfH;
    };
    for (let e = Math.ceil(lg(lo)); e <= Math.floor(lg(hi)); e++) {
      posTicks.push(Math.pow(10, e));
    }
    negTicks = posTicks;
  } else {
    // normal
    let maxPos = 0, maxNeg = 0;
    for (let i = 0; i < data.length; i++) {
      maxPos = Math.max(maxPos, totalsA[i]);
      maxNeg = Math.max(maxNeg, totalsLE[i]);
    }
    const yMax = Math.max(maxPos, maxNeg);
    const yTop = niceCeil(yMax);
    yAt = (v) => yZero - (v / yTop) * halfH;
    const step = yTop / 4;
    for (let i = 1; i <= 4; i++) posTicks.push(step * i);
    negTicks = posTicks;
  }

  // Build stack arrays (cumulative, data units)
  const assetStack = data.map(d => {
    let cum = 0;
    return ASSET_ORDER.map((cat, i) => {
      const v = d.a[i];
      const y0 = cum;
      cum += v;
      return [y0, cum];
    });
  });

  const liabStack = data.map(d => {
    let cum = 0;
    return LIAB_ORDER.map((cat, i) => {
      const v = d.l[i];
      const y0 = cum;
      cum += v;
      return [y0, cum];
    });
  });

  const eqStack = data.map((d, idx) => {
    let cum = liabStack[idx].length ? liabStack[idx][liabStack[idx].length - 1][1] : 0;
    return EQ_ORDER.map((cat, i) => {
      const v = d.e[i];
      const y0 = cum;
      cum += v;
      return [y0, cum];
    });
  });

  // Screen-space stack (mode-aware)
  function screenStack(stack, rowIdx, sign) {
    const row = stack[rowIdx];
    if (yScale === 'log') {
      const total = sign > 0 ? totalsA[rowIdx] : totalsLE[rowIdx];
      const totalScreen = yAt(sign * total) - yZero;
      const signedTotal = sign * total;
      if (!signedTotal) return row.map(() => [yZero, yZero]);
      return row.map(([a, b]) => {
        const fracA = a / signedTotal;
        const fracB = b / signedTotal;
        return [yZero + fracA * totalScreen, yZero + fracB * totalScreen];
      });
    }
    if (yScale === 'percent') {
      const total = sign > 0 ? totalsA[rowIdx] : totalsLE[rowIdx];
      if (!total) return row.map(() => [yZero, yZero]);
      const sgn = sign;
      return row.map(([a, b]) => [
        yZero - (a / (sgn * total)) * halfH * sgn,
        yZero - (b / (sgn * total)) * halfH * sgn,
      ]);
    }
    // normal
    return row.map(([a, b]) => [yAt(a), yAt(b)]);
  }

  // ── Build SVG ──────────────────────────────────────────────────
  svgEl.innerHTML = '';
  svgEl.setAttribute('viewBox', `0 0 ${CFG.width} ${CFG.height}`);

  // Grid (horizontal)
  const gridG = el('g', { class: 'grid' }, svgEl);
  for (const t of posTicks) {
    const yp = yScale === 'percent' ? (yZero - t * halfH) : yAt(t);
    const yn = yScale === 'percent' ? (yZero + t * halfH) : yAt(-t);
    const labelP = yScale === 'percent' ? (Math.round(t * 100) + '%') : fmtShort(t);
    const labelN = yScale === 'percent' ? ('\u2212' + Math.round(t * 100) + '%') : ('\u2212' + fmtShort(t));
    el('line', { class: 'grid-line dashed', x1: CFG.margin.left, x2: CFG.width - CFG.margin.right, y1: yp, y2: yp }, gridG);
    el('text', { class: 'axis-label', x: CFG.margin.left - 10, y: yp + 3, 'text-anchor': 'end' }, gridG).textContent = labelP;
    el('line', { class: 'grid-line dashed', x1: CFG.margin.left, x2: CFG.width - CFG.margin.right, y1: yn, y2: yn }, gridG);
    el('text', { class: 'axis-label', x: CFG.margin.left - 10, y: yn + 3, 'text-anchor': 'end' }, gridG).textContent = labelN;
  }

  // Axis unit label (top-left)
  el('text', {
    class: 'axis-label', x: CFG.margin.left - 10, y: CFG.margin.top - 10,
    'text-anchor': 'end',
  }, gridG).textContent = yScale === 'percent' ? '%' : (yScale === 'log' ? '\u00A3 (log)' : '\u00A3');

  // Band labels (ASSETS / LIABILITIES & EQUITY)
  el('text', {
    class: 'band-label',
    x: CFG.margin.left - 52,
    y: CFG.margin.top + plotH / 4,
    transform: `rotate(-90, ${CFG.margin.left - 52}, ${CFG.margin.top + plotH / 4})`,
    'text-anchor': 'middle',
    fill: 'var(--brand-emerald)',
  }, svgEl).textContent = 'ASSETS';

  el('text', {
    class: 'band-label',
    x: CFG.margin.left - 52,
    y: CFG.margin.top + plotH * 3 / 4,
    transform: `rotate(-90, ${CFG.margin.left - 52}, ${CFG.margin.top + plotH * 3 / 4})`,
    'text-anchor': 'middle',
    fill: '#A77B18',
  }, svgEl).textContent = 'LIABILITIES & EQUITY';

  // Year ticks (x-axis) — vertical grid at decades
  const xG = el('g', { class: 'xaxis' }, svgEl);
  const yearTicks = [1744, 1772, 1800, 1825, 1850, 1875, 1900, 1925, 1950, 1972];
  for (const yr of yearTicks) {
    if (yr < xMin || yr > xMax) continue;
    const x = xAt(yr);
    el('line', {
      class: 'grid-line',
      x1: x, x2: x,
      y1: CFG.margin.top, y2: CFG.height - CFG.margin.bottom,
      stroke: 'var(--brand-bone-deep)',
      'stroke-width': 0.5,
    }, xG);
    el('text', {
      class: 'axis-year',
      x, y: CFG.height - CFG.margin.bottom + 20,
    }, xG).textContent = yr;
  }

  // Defs: reveal clip-path
  const defs = el('defs', {}, svgEl);
  const clip = el('clipPath', { id: 'reveal' }, defs);
  const clipRect = el('rect', {
    x: CFG.margin.left, y: CFG.margin.top,
    width: 0, height: plotH,
  }, clip);

  // Chart body group, clipped
  const bodyG = el('g', { 'clip-path': 'url(#reveal)' }, svgEl);

  // Stacked area paths
  drawStack(bodyG, data, eqStack, EQ_ORDER, EQ_COLORS, xAt, screenStack, -1, el, years);
  drawStack(bodyG, data, liabStack, LIAB_ORDER, LIAB_COLORS, xAt, screenStack, -1, el, years);
  drawStack(bodyG, data, assetStack, ASSET_ORDER, ASSET_COLORS, xAt, screenStack, +1, el, years);

  // Zero line
  el('line', {
    class: 'zero-line',
    x1: CFG.margin.left, x2: CFG.width - CFG.margin.right,
    y1: yZero, y2: yZero,
  }, svgEl);

  // Plot frame
  el('rect', {
    x: CFG.margin.left, y: CFG.margin.top,
    width: plotW, height: plotH,
    fill: 'none',
    stroke: 'var(--brand-charcoal)',
    'stroke-width': 1,
  }, svgEl);

  // ── Annotations ────────────────────────────────────────────────
  if (showAnnotations) {
    const annG = el('g', { class: 'annotations' }, svgEl);
    for (const a of ANNOTATIONS) {
      if (a.year < xMin || a.year > xMax) continue;
      const idx = nearestIdx(years, a.year);
      const x = xAt(years[idx]);
      const aScreen = screenStack(assetStack, idx, +1);
      const leScreen = [...screenStack(liabStack, idx, -1), ...screenStack(eqStack, idx, -1)];
      const topY = aScreen.length ? aScreen[aScreen.length - 1][1] : yZero;
      const botY = leScreen.length ? leScreen[leScreen.length - 1][1] : yZero;

      if (a.place === 'top') {
        const tipY = Math.max(CFG.margin.top + 28, topY - 36);
        el('line', { class: 'annotation-line', x1: x, y1: topY, x2: x, y2: tipY + 4 }, annG);
        el('circle', { class: 'annotation-dot', cx: x, cy: topY, r: 3 }, annG);
        el('text', { class: 'annotation-title', x: x + 6, y: tipY }, annG).textContent = a.year;
        el('text', { class: 'annotation', x: x + 6, y: tipY + 13 }, annG).textContent = a.label;
      } else {
        const tipY = Math.min(CFG.height - CFG.margin.bottom - 30, botY + 32);
        el('line', { class: 'annotation-line', x1: x, y1: botY, x2: x, y2: tipY - 10 }, annG);
        el('circle', { class: 'annotation-dot', cx: x, cy: botY, r: 3 }, annG);
        el('text', { class: 'annotation-title', x: x + 6, y: tipY }, annG).textContent = a.year;
        el('text', { class: 'annotation', x: x + 6, y: tipY + 13 }, annG).textContent = a.label;
      }
    }
  }

  // ── Cursor line for hover ──────────────────────────────────────
  const cursorLine = el('line', {
    class: 'cursor-line',
    x1: 0, x2: 0,
    y1: CFG.margin.top, y2: CFG.height - CFG.margin.bottom,
  }, svgEl);

  // Hover overlay
  const overlay = el('rect', {
    x: CFG.margin.left, y: CFG.margin.top,
    width: plotW, height: plotH,
    fill: 'transparent',
  }, svgEl);

  overlay.addEventListener('mousemove', e => {
    const rect = svgEl.getBoundingClientRect();
    const scale = rect.width / CFG.width;
    const px = (e.clientX - rect.left) / scale;
    const y = xMin + ((px - CFG.margin.left) / plotW) * (xMax - xMin);
    const idx = nearestIdx(years, y);
    const cx = xAt(years[idx]);
    cursorLine.setAttribute('x1', cx);
    cursorLine.setAttribute('x2', cx);
    cursorLine.classList.add('visible');
    showTooltip(idx, e);
  });

  overlay.addEventListener('mouseleave', () => {
    cursorLine.classList.remove('visible');
    tooltipEl.classList.remove('visible');
  });

  function showTooltip(idx, ev) {
    const d = data[idx];
    const date = DATA.dates[idx];
    const sumA = d.a.reduce((s, v) => s + v, 0);
    const sumL = d.l.reduce((s, v) => s + v, 0);
    const sumE = d.e.reduce((s, v) => s + v, 0);

    const assetRows = ASSET_ORDER.map((cat, i) => d.a[i] ? `
      <div class="k" style="display:flex;align-items:center;gap:6px">
        <span style="display:inline-block;width:10px;height:8px;background:${ASSET_COLORS[cat]};border:1px solid var(--brand-charcoal)"></span>${cat}
      </div>
      <div class="v">${fmt(d.a[i])}</div>
    ` : '').join('');

    const liabRows = LIAB_ORDER.map((cat, i) => d.l[i] ? `
      <div class="k" style="display:flex;align-items:center;gap:6px">
        <span style="display:inline-block;width:10px;height:8px;background:${LIAB_COLORS[cat]};border:1px solid var(--brand-charcoal)"></span>${cat}
      </div>
      <div class="v">${fmt(-d.l[i])}</div>
    ` : '').join('');

    const eqRows = EQ_ORDER.map((cat, i) => d.e[i] ? `
      <div class="k" style="display:flex;align-items:center;gap:6px">
        <span style="display:inline-block;width:10px;height:8px;background:${EQ_COLORS[cat]};border:1px solid var(--brand-charcoal)"></span>${cat}
      </div>
      <div class="v">${fmt(-d.e[i])}</div>
    ` : '').join('');

    tooltipEl.innerHTML = `
      <h4>${years[idx]}</h4>
      <div class="sub">Balance Sheet \u00B7 ${formatDate(date)}</div>
      ${assetRows}
      ${liabRows}${eqRows}
      <div class="totals" style="margin-top:8px">
        <div class="k">Assets</div><div class="v assets">${fmt(sumA)}</div>
        <div class="k">Liabilities</div><div class="v liab">${fmt(-sumL)}</div>
        <div class="k">Equity</div><div class="v eq">${fmt(-sumE)}</div>
      </div>
    `;
    tooltipEl.classList.add('visible');

    // Position tooltip relative to container
    const wrap = wrapEl.getBoundingClientRect();
    const px = ev.clientX - wrap.left;
    const py = ev.clientY - wrap.top;
    const tw = tooltipEl.offsetWidth;
    const th = tooltipEl.offsetHeight;
    let left = px + 16;
    if (left + tw > wrap.clientWidth - 8) left = px - tw - 16;
    let top = py - th / 2;
    top = Math.max(8, Math.min(wrap.height - th - 8, top));
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top  = top + 'px';
  }

  // ── Legend ──────────────────────────────────────────────────────
  const lastYr = data[data.length - 1];
  const lastTotalA = lastYr.a.reduce((s, v) => s + v, 0);
  const lastTotalL = -lastYr.l.reduce((s, v) => s + v, 0);
  const lastTotalE = -lastYr.e.reduce((s, v) => s + v, 0);

  function buildLegendCard(title, sign, order, colors, values, total) {
    const items = order.map((cat, i) => {
      const v = values[i] || 0;
      const pct = total ? (Math.abs(v) / total * 100) : 0;
      const dim = v === 0 ? 'style="opacity:.4"' : '';
      return `
        <div class="legend-item" ${dim}>
          <span class="swatch" style="background:${colors[cat]}"></span>
          <span>${cat}</span>
          <span class="pct">${v === 0 ? '\u2014' : pct.toFixed(1) + '%'}</span>
        </div>`;
    }).join('');
    return `
      <div class="legend-card">
        <h3>${title}<span class="sign">${sign}</span></h3>
        <div class="legend-items">${items}</div>
      </div>`;
  }

  legendEl.innerHTML =
    buildLegendCard('Assets', '\n', ASSET_ORDER, ASSET_COLORS,
      lastYr.a.map(v => v), lastTotalA) +
    buildLegendCard('Liabilities', '\n', LIAB_ORDER, LIAB_COLORS,
      lastYr.l.map(v => -v), lastTotalL) +
    buildLegendCard('Equity', '\n', EQ_ORDER, EQ_COLORS,
      lastYr.e.map(v => -v), lastTotalE);

  // ── Reveal animation ───────────────────────────────────────────
  if (animate) {
    requestAnimationFrame(() => {
      const dur = 2000;
      const start = performance.now();
      const ease = t => 1 - Math.pow(1 - t, 2.5);
      function tick(now) {
        const t = Math.min(1, (now - start) / dur);
        const w = plotW * ease(t);
        clipRect.setAttribute('width', w);
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          const cards = legendEl.querySelectorAll('.legend-card');
          cards.forEach((c, i) => setTimeout(() => c.classList.add('on'), i * 120));
        }
      }
      requestAnimationFrame(tick);
    });
  } else {
    clipRect.setAttribute('width', plotW);
    legendEl.querySelectorAll('.legend-card').forEach(c => c.classList.add('on'));
  }
}
