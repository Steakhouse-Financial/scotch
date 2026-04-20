// ────────────────────────────────────────────────────────────────
// chart-bump.js — ES module: bump chart of bank rankings over time
// ────────────────────────────────────────────────────────────────

import { catmullRom, el, fmtShort } from './utils.js';
import { loadCSV } from './csv.js';

const BANKS = [
  { code: 'BS',  name: 'Bank of Scotland',  color: 'var(--chart-1)' },
  { code: 'RBS', name: 'Royal Bank',        color: 'var(--chart-2)' },
  { code: 'BLB', name: 'British Linen',     color: 'var(--chart-3)' },
  { code: 'CB',  name: 'Commercial Bank',   color: 'var(--chart-4)' },
  { code: 'NB',  name: 'National Bank',     color: 'var(--chart-5)' },
  { code: 'UB',  name: 'Union Bank',        color: 'var(--chart-6)' },
  { code: 'CIB', name: 'Clydesdale',        color: 'var(--chart-7)' },
  { code: 'CGB', name: 'City of Glasgow',   color: 'var(--chart-8)' },
];

const W = 1280, H = 480;
const M = { top: 40, right: 140, bottom: 44, left: 48 };
const plotW = W - M.left - M.right;
const plotH = H - M.top - M.bottom;

export async function initBumpChart(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const svg = container.querySelector(`#${containerId}-svg`);
  const tooltip = container.querySelector(`#${containerId}-tooltip`);
  const metricWrap = container.querySelector(`#${containerId}-metric`);

  if (!svg || !tooltip || !metricWrap) return;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  // Load data
  const rows = await loadCSV('../flattened/appendix_ranks.csv');

  // Extract unique sorted years
  const yearsSet = new Set(rows.map(r => r.year));
  const years = [...yearsSet].sort((a, b) => a - b);

  // State
  let activeMetric = 'TL';

  // Metric buttons
  const buttons = metricWrap.querySelectorAll('button[data-metric]');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      activeMetric = btn.dataset.metric;
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    });
  });
  // Set initial active
  buttons.forEach(btn => {
    if (btn.dataset.metric === activeMetric) btn.classList.add('active');
  });

  // Scales
  function xScale(year) {
    const idx = years.indexOf(year);
    return M.left + (idx / (years.length - 1)) * plotW;
  }

  function yScale(rank) {
    // rank 1 at top, rank 8 at bottom
    return M.top + ((rank - 1) / 7) * plotH;
  }

  // ── Render ──────────────────────────────────────────────────────
  function render() {
    // Clear SVG
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const filtered = rows.filter(r => r.account === activeMetric);

    // Defs for clip-path reveal animation
    const defs = el('defs', {}, svg);
    const clipPath = el('clipPath', { id: `${containerId}-reveal` }, defs);
    const clipRect = el('rect', { x: 0, y: 0, width: W, height: H }, clipPath);

    // Grid group
    const gridG = el('g', { class: 'grid' }, svg);

    // Horizontal grid lines at each rank
    for (let rank = 1; rank <= 8; rank++) {
      const y = yScale(rank);
      el('line', {
        x1: M.left, y1: y, x2: W - M.right, y2: y,
        stroke: 'var(--brand-charcoal)', 'stroke-opacity': 0.12,
        'stroke-dasharray': '3 3', 'stroke-width': 0.5
      }, gridG);
    }

    // Vertical grid lines at each year
    for (const yr of years) {
      const x = xScale(yr);
      el('line', {
        x1: x, y1: M.top, x2: x, y2: H - M.bottom,
        stroke: 'var(--brand-charcoal)', 'stroke-opacity': 0.08,
        'stroke-width': 0.5
      }, gridG);
    }

    // Axes group
    const axesG = el('g', { class: 'axes' }, svg);

    // Y-axis: rank numbers
    for (let rank = 1; rank <= 8; rank++) {
      const y = yScale(rank);
      el('text', {
        x: M.left - 12, y: y,
        'text-anchor': 'end', 'dominant-baseline': 'middle',
        'font-family': 'var(--font-sans)', 'font-size': 11,
        fill: 'var(--brand-charcoal)', 'fill-opacity': 0.6
      }, axesG).textContent = rank;
    }

    // Y-axis label "RANK" rotated
    const rankLabel = el('text', {
      x: 14, y: M.top + plotH / 2,
      'text-anchor': 'middle', 'dominant-baseline': 'middle',
      'font-family': 'var(--font-sans)', 'font-size': 10,
      fill: 'var(--brand-charcoal)', 'fill-opacity': 0.5,
      transform: `rotate(-90, 14, ${M.top + plotH / 2})`
    }, axesG);
    rankLabel.textContent = 'RANK';

    // X-axis: year labels
    for (const yr of years) {
      const x = xScale(yr);
      el('text', {
        x, y: H - M.bottom + 18,
        'text-anchor': 'middle', 'dominant-baseline': 'middle',
        'font-family': 'var(--font-sans)', 'font-size': 10,
        fill: 'var(--brand-charcoal)', 'fill-opacity': 0.6
      }, axesG).textContent = yr;
    }

    // Lines group (clipped for reveal)
    const linesG = el('g', { 'clip-path': `url(#${containerId}-reveal)` }, svg);

    // Draw each bank's line
    for (const bank of BANKS) {
      const bankData = filtered
        .filter(r => r.bank === bank.code && r.rank != null && r.rank !== '')
        .sort((a, b) => a.year - b.year);

      if (bankData.length === 0) continue;

      const points = bankData.map(r => [xScale(r.year), yScale(r.rank)]);

      // Catmull-Rom spline (tension 0.3 to keep between integer ranks)
      const pathD = catmullRom(points, 0.3);

      el('path', {
        d: pathD,
        fill: 'none',
        stroke: bank.color,
        'stroke-width': 2.5,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      }, linesG);

      // Circles at data points
      for (const pt of points) {
        el('circle', {
          cx: pt[0], cy: pt[1], r: 4,
          fill: 'var(--brand-bone)', stroke: bank.color, 'stroke-width': 2
        }, linesG);
      }

      // End label at rightmost point
      const lastRow = bankData[bankData.length - 1];
      const lastX = xScale(lastRow.year);
      const lastY = yScale(lastRow.rank);
      el('text', {
        x: lastX + 8, y: lastY,
        'dominant-baseline': 'middle',
        'font-family': 'var(--font-sans)', 'font-size': 11,
        'font-weight': 600,
        fill: bank.color
      }, linesG).textContent = bank.code;
    }

    // ── Hover interaction ──────────────────────────────────────────
    const hoverG = el('g', { class: 'hover-layer' }, svg);

    // Cursor line (hidden initially)
    const cursorLine = el('line', {
      x1: 0, y1: M.top, x2: 0, y2: H - M.bottom,
      stroke: 'var(--brand-charcoal)', 'stroke-opacity': 0.3,
      'stroke-dasharray': '4 3', 'stroke-width': 1,
      visibility: 'hidden'
    }, hoverG);

    // Invisible overlay for mouse events
    const overlay = el('rect', {
      x: M.left, y: M.top,
      width: plotW, height: plotH,
      fill: 'transparent', cursor: 'crosshair'
    }, hoverG);

    overlay.addEventListener('mousemove', (e) => {
      const svgRect = svg.getBoundingClientRect();
      const scaleX = W / svgRect.width;
      const mouseX = (e.clientX - svgRect.left) * scaleX;

      // Find nearest year
      let nearestYr = years[0];
      let nearestDist = Infinity;
      for (const yr of years) {
        const dist = Math.abs(xScale(yr) - mouseX);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestYr = yr;
        }
      }

      const cx = xScale(nearestYr);
      cursorLine.setAttribute('x1', cx);
      cursorLine.setAttribute('x2', cx);
      cursorLine.setAttribute('visibility', 'visible');

      // Build tooltip content
      const yearRows = filtered
        .filter(r => r.year === nearestYr && r.rank != null && r.rank !== '')
        .sort((a, b) => a.rank - b.rank);

      let html = `<h4>${nearestYr}</h4><table>`;
      for (const r of yearRows) {
        const bankCfg = BANKS.find(b => b.code === r.bank);
        if (!bankCfg) continue;
        html += `<tr>
          <td><span class="dot" style="background:${bankCfg.color}"></span></td>
          <td>${bankCfg.name}</td>
          <td class="rank-num">${r.rank}</td>
        </tr>`;
      }
      html += '</table>';
      tooltip.innerHTML = html;
      tooltip.style.opacity = '1';

      // Position tooltip
      const tipX = (e.clientX - svgRect.left) + 16;
      const tipY = (e.clientY - svgRect.top) - 10;
      tooltip.style.left = tipX + 'px';
      tooltip.style.top = tipY + 'px';
    });

    overlay.addEventListener('mouseleave', () => {
      cursorLine.setAttribute('visibility', 'hidden');
      tooltip.style.opacity = '0';
    });

    // ── Reveal animation (clip-path sweep, 1200ms) ───────────────
    clipRect.setAttribute('width', '0');
    const start = performance.now();
    const duration = 1200;

    function animate(now) {
      const t = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      clipRect.setAttribute('width', String(W * ease));
      if (t < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  // Initial render
  render();
}
