// ────────────────────────────────────────────────────────────────
// chart-banks.js — Per-bank stacked area chart (ES module)
// ────────────────────────────────────────────────────────────────

import { hexToHsl, hslToHex, buildRamp, catmullRom, drawStack, niceCeil, fmtShort, fmt, nearestIdx, el } from './utils.js';
import { loadCSV, aggregateBanks } from './csv.js';

const CFG = {
  width: 1280,
  height: 620,
  margin: { top: 30, right: 24, bottom: 44, left: 78 },
};

const BASE_HUES = {
  asset: '#086552',   // emerald
  liab: '#DAA544',    // ochre
  equity: '#934997',  // plum
};

const BANK_NAMES = ['Bank of Scotland', 'Royal Bank of Scotland', 'Dundee Banking Co'];

let cachedRows = null;

export async function initBankChart(containerId, selectId) {
  // Load CSV once
  if (!cachedRows) {
    cachedRows = await loadCSV('../flattened/appendix_banks.csv');
  }

  const select = document.getElementById(selectId);
  const svgEl = document.getElementById(`${containerId}-svg`);
  const tooltip = document.getElementById(`${containerId}-tooltip`);
  const legendRow = document.getElementById(`${containerId}-legend`);
  const yscaleDiv = document.getElementById(`${containerId}-yscale`);

  // Populate select dropdown
  select.innerHTML = '';
  for (const name of BANK_NAMES) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  }

  let currentScale = 'normal';
  let firstRender = true;

  // Setup y-scale buttons
  const scaleBtns = yscaleDiv.querySelectorAll('button');
  function syncScaleBtns() {
    scaleBtns.forEach(b => {
      const mode = b.textContent.trim().toLowerCase().replace('100%', 'percent');
      b.classList.toggle('active', mode === currentScale);
    });
  }
  scaleBtns.forEach(b => {
    b.addEventListener('click', () => {
      const label = b.textContent.trim().toLowerCase();
      if (label === '100%') currentScale = 'percent';
      else if (label === 'log') currentScale = 'log';
      else currentScale = 'normal';
      syncScaleBtns();
      renderBank(false);
    });
  });
  syncScaleBtns();

  // Bank select handler
  select.addEventListener('change', () => {
    renderBank(false);
  });

  function renderBank(animate) {
    const bankName = select.value;
    const chartData = aggregateBanks(cachedRows, bankName);
    render(chartData, { animate, yScale: currentScale });
  }

  function render(chartData, opts = {}) {
    const animate = opts.animate !== false;
    const yScale = opts.yScale || 'normal';
    const { years, dates, data, assetOrder, liabOrder, eqOrder } = chartData;

    // Build color maps
    const aRamp = buildRamp(BASE_HUES.asset, assetOrder.length);
    const lRamp = buildRamp(BASE_HUES.liab, liabOrder.length);
    const eRamp = buildRamp(BASE_HUES.equity, eqOrder.length);
    const ASSET_COLORS = Object.fromEntries(assetOrder.map((k, i) => [k, aRamp[i]]));
    const LIAB_COLORS = Object.fromEntries(liabOrder.map((k, i) => [k, lRamp[i]]));
    const EQ_COLORS = Object.fromEntries(eqOrder.map((k, i) => [k, eRamp[i]]));

    // X scale
    const xMin = years[0], xMax = years[years.length - 1];
    const plotW = CFG.width - CFG.margin.left - CFG.margin.right;
    const plotH = CFG.height - CFG.margin.top - CFG.margin.bottom;
    const xAt = y => CFG.margin.left + ((y - xMin) / (xMax - xMin)) * plotW;

    // Per-row totals
    const totalsA = data.map(d => d.a.reduce((s, v) => s + v, 0));
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
      const lo = 1e4, hi = maxMag || 1e5;
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
      let maxPos = 0, maxNeg = 0;
      for (let i = 0; i < data.length; i++) {
        maxPos = Math.max(maxPos, totalsA[i]);
        maxNeg = Math.max(maxNeg, totalsLE[i]);
      }
      const yMax = Math.max(maxPos, maxNeg) || 1;
      const yTop = niceCeil(yMax);
      yAt = (v) => yZero - (v / yTop) * halfH;
      const step = yTop / 4;
      for (let i = 1; i <= 4; i++) posTicks.push(step * i);
      negTicks = posTicks;
    }

    // Build stack arrays
    const assetStack = data.map(d => {
      let cum = 0;
      return assetOrder.map((cat, i) => {
        const v = d.a[i];
        const y0 = cum;
        cum += v;
        return [y0, cum];
      });
    });
    const liabStack = data.map(d => {
      let cum = 0;
      return liabOrder.map((cat, i) => {
        const v = d.l[i];
        const y0 = cum;
        cum += v;
        return [y0, cum];
      });
    });
    const eqStack = data.map((d, idx) => {
      let cum = liabStack[idx].length ? liabStack[idx][liabStack[idx].length - 1][1] : 0;
      return eqOrder.map((cat, i) => {
        const v = d.e[i];
        const y0 = cum;
        cum += v;
        return [y0, cum];
      });
    });

    // Screen-space stacking (mode-aware)
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

    // ── Build SVG ──
    svgEl.innerHTML = '';
    svgEl.setAttribute('viewBox', `0 0 ${CFG.width} ${CFG.height}`);

    // Grid
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

    // Axis unit label
    el('text', {
      class: 'axis-label', x: CFG.margin.left - 10, y: CFG.margin.top - 10,
      'text-anchor': 'end',
    }, gridG).textContent = yScale === 'percent' ? '%' : (yScale === 'log' ? '\u00A3 (log)' : '\u00A3');

    // Band labels
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

    // X-axis ticks (adaptive to bank date range)
    const xG = el('g', { class: 'xaxis' }, svgEl);
    const span = xMax - xMin;
    let tickInterval = 25;
    if (span <= 60) tickInterval = 10;
    else if (span <= 100) tickInterval = 20;
    else if (span <= 200) tickInterval = 25;
    else tickInterval = 50;
    const firstTick = Math.ceil(xMin / tickInterval) * tickInterval;
    for (let yr = firstTick; yr <= xMax; yr += tickInterval) {
      const x = xAt(yr);
      el('line', {
        class: 'grid-line',
        x1: x, x2: x,
        y1: CFG.margin.top, y2: CFG.height - CFG.margin.bottom,
        stroke: 'var(--brand-bone-deep)',
        'stroke-width': 0.5,
      }, xG);
      el('text', { class: 'axis-year', x, y: CFG.height - CFG.margin.bottom + 20 }, xG).textContent = yr;
    }
    // Always show first and last year if not already shown
    if (xMin % tickInterval !== 0) {
      const x = xAt(xMin);
      el('text', { class: 'axis-year', x, y: CFG.height - CFG.margin.bottom + 20 }, xG).textContent = xMin;
    }
    if (xMax % tickInterval !== 0) {
      const x = xAt(xMax);
      el('text', { class: 'axis-year', x, y: CFG.height - CFG.margin.bottom + 20 }, xG).textContent = xMax;
    }

    // Clip-path for reveal animation
    const defs = el('defs', {}, svgEl);
    const clip = el('clipPath', { id: `${containerId}-reveal` }, defs);
    const clipRect = el('rect', {
      x: CFG.margin.left, y: CFG.margin.top,
      width: animate ? 0 : plotW, height: plotH,
    }, clip);

    // Chart body group (clipped)
    const bodyG = el('g', { 'clip-path': `url(#${containerId}-reveal)` }, svgEl);

    // Draw stacked areas
    drawStack(bodyG, data, eqStack, eqOrder, EQ_COLORS, xAt, screenStack, -1, el, years);
    drawStack(bodyG, data, liabStack, liabOrder, LIAB_COLORS, xAt, screenStack, -1, el, years);
    drawStack(bodyG, data, assetStack, assetOrder, ASSET_COLORS, xAt, screenStack, +1, el, years);

    // Zero line
    el('line', {
      class: 'zero-line',
      x1: CFG.margin.left, x2: CFG.width - CFG.margin.right,
      y1: yZero, y2: yZero,
    }, svgEl);

    // Frame
    el('rect', {
      x: CFG.margin.left, y: CFG.margin.top,
      width: plotW, height: plotH,
      fill: 'none',
      stroke: 'var(--brand-charcoal)',
      'stroke-width': 1,
    }, svgEl);

    // Cursor line for hover
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
      tooltip.classList.remove('visible');
    });

    function showTooltip(idx, ev) {
      const d = data[idx];
      const date = dates[idx];
      const sumA = d.a.reduce((s, v) => s + v, 0);
      const sumL = d.l.reduce((s, v) => s + v, 0);
      const sumE = d.e.reduce((s, v) => s + v, 0);

      const assetRows = assetOrder.map((cat, i) => d.a[i] ? `
        <div class="k" style="display:flex;align-items:center;gap:6px">
          <span style="display:inline-block;width:10px;height:8px;background:${ASSET_COLORS[cat]};border:1px solid var(--brand-charcoal)"></span>${cat}
        </div>
        <div class="v">${fmt(d.a[i])}</div>
      ` : '').join('');

      const liabRows = liabOrder.map((cat, i) => d.l[i] ? `
        <div class="k" style="display:flex;align-items:center;gap:6px">
          <span style="display:inline-block;width:10px;height:8px;background:${LIAB_COLORS[cat]};border:1px solid var(--brand-charcoal)"></span>${cat}
        </div>
        <div class="v">${fmt(-d.l[i])}</div>
      ` : '').join('');

      const eqRows = eqOrder.map((cat, i) => d.e[i] ? `
        <div class="k" style="display:flex;align-items:center;gap:6px">
          <span style="display:inline-block;width:10px;height:8px;background:${EQ_COLORS[cat]};border:1px solid var(--brand-charcoal)"></span>${cat}
        </div>
        <div class="v">${fmt(-d.e[i])}</div>
      ` : '').join('');

      tooltip.innerHTML = `
        <h4>${years[idx]}</h4>
        <div class="sub">Balance Sheet \u00b7 ${formatDate(date)}</div>
        ${assetRows}
        ${liabRows}${eqRows}
        <div class="totals" style="margin-top:8px">
          <div class="k">Assets</div><div class="v assets">${fmt(sumA)}</div>
          <div class="k">Liabilities</div><div class="v liab">${fmt(-sumL)}</div>
          <div class="k">Equity</div><div class="v eq">${fmt(-sumE)}</div>
        </div>
      `;
      tooltip.classList.add('visible');

      // Position tooltip
      const wrap = svgEl.parentElement.getBoundingClientRect();
      const px = ev.clientX - wrap.left;
      const py = ev.clientY - wrap.top;
      const tw = tooltip.offsetWidth;
      const th = tooltip.offsetHeight;
      let left = px + 16;
      if (left + tw > wrap.width - 8) left = px - tw - 16;
      let top = py - th / 2;
      top = Math.max(8, Math.min(wrap.height - th - 8, top));
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
    }

    // ── Legend ──
    const lastYr = data[data.length - 1];
    const lastTotalA = lastYr.a.reduce((s, v) => s + v, 0);
    const lastTotalL = lastYr.l.reduce((s, v) => s + v, 0);
    const lastTotalE = lastYr.e.reduce((s, v) => s + v, 0);

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

    legendRow.innerHTML =
      buildLegendCard('Assets', '+', assetOrder, ASSET_COLORS, lastYr.a, lastTotalA) +
      buildLegendCard('Liabilities', '\u2212', liabOrder, LIAB_COLORS, lastYr.l.map(v => -v), lastTotalL) +
      buildLegendCard('Equity', '\u2212', eqOrder, EQ_COLORS, lastYr.e.map(v => -v), lastTotalE);

    // ── Reveal animation ──
    if (animate) {
      requestAnimationFrame(() => {
        const dur = 2000;
        const start = performance.now();
        const ease = t => 1 - Math.pow(1 - t, 2.5);
        function tick(now) {
          const t = Math.min(1, (now - start) / dur);
          const w = plotW * ease(t);
          clipRect.setAttribute('width', w);
          if (t < 1) requestAnimationFrame(tick);
          else {
            const cards = legendRow.querySelectorAll('.legend-card');
            cards.forEach((c, i) => setTimeout(() => c.classList.add('on'), i * 120));
          }
        }
        requestAnimationFrame(tick);
      });
    } else {
      clipRect.setAttribute('width', plotW);
      legendRow.querySelectorAll('.legend-card').forEach(c => c.classList.add('on'));
    }
  }

  // Initial render (first bank, with animation)
  renderBank(true);
  firstRender = false;
}

// ── Local helper ──
function formatDate(d) {
  const [y, m, day] = d.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[parseInt(m) - 1]} ${y}`;
}
