// ────────────────────────────────────────────────────────────────
// utils.js — ES module utility functions for SVG chart rendering
// ────────────────────────────────────────────────────────────────

const NS = 'http://www.w3.org/2000/svg';

export function hexToHsl(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h=0, s=0, l=(max+min)/2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h = (g-b)/d + (g<b?6:0); break;
      case g: h = (b-r)/d + 2; break;
      case b: h = (r-g)/d + 4; break;
    }
    h *= 60;
  }
  return {h, s: s*100, l: l*100};
}

export function hslToHex(h, s, l) {
  s/=100; l/=100;
  const k = n => (n + h/30) % 12;
  const a = s * Math.min(l, 1-l);
  const f = n => {
    const v = l - a * Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n), 1)));
    return Math.round(v*255).toString(16).padStart(2,'0');
  };
  return '#' + f(0) + f(8) + f(4);
}

export function buildRamp(baseHex, n, mode) {
  // mode: 'dark-to-light' for assets (deepest at zero), 'dark-to-light' for liab
  const {h, s, l} = hexToHsl(baseHex);
  const out = [];
  for (let i = 0; i < n; i++) {
    // keep base as first entry, progressively lighten
    const t = n === 1 ? 0 : i / (n - 1);
    const L = l + (92 - l) * t * 0.8; // lighten toward near-white but capped
    const S = s * (1 - t * 0.35);
    out.push(hslToHex(h, S, Math.min(L, 92)));
  }
  return out;
}

export function catmullRom(points, tension = 0.5) {
  if (points.length < 2) return '';
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i-1] || points[i];
    const p1 = points[i];
    const p2 = points[i+1];
    const p3 = points[i+2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6 * tension * 2;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6 * tension * 2;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6 * tension * 2;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6 * tension * 2;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export function drawStack(parent, data, stack, order, colors, xAt, screenStack, sign, el, years) {
  for (let layerIdx = 0; layerIdx < order.length; layerIdx++) {
    const cat = order[layerIdx];
    const color = colors[cat];
    const pts = data.map((_, i) => {
      const screenRow = screenStack(stack, i, sign);
      const [topY, botY] = [screenRow[layerIdx][1], screenRow[layerIdx][0]];
      return { x: xAt(years[i]), top: topY, bot: botY };
    });
    const tension = 1;
    const topPath = catmullRom(pts.map(p=>[p.x, p.top]), tension);
    const botPathRev = catmullRom(pts.slice().reverse().map(p=>[p.x, p.bot]), tension);
    const d = topPath + ' L ' + pts[pts.length-1].x + ' ' + pts[pts.length-1].bot + ' ' +
        botPathRev.replace(/^M [^ ]+ [^ ]+/, '') + ' Z';
    el('path', { class: 'layer', d, fill: color }, parent);
  }
}

export function niceCeil(v) {
  // round up to nearest 100M, 500M, 1B, 2B, 5B...
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  let step;
  if (n <= 1) step = 1;
  else if (n <= 2) step = 2;
  else if (n <= 2.5) step = 2.5;
  else if (n <= 5) step = 5;
  else step = 10;
  return step * pow;
}

export function fmtShort(v) {
  const a = Math.abs(v);
  if (a >= 1e9) return (v/1e9).toFixed(v % 1e9 === 0 ? 0 : 1).replace(/\.0$/,'') + 'B';
  if (a >= 1e6) return (v/1e6).toFixed(0) + 'M';
  if (a >= 1e3) return (v/1e3).toFixed(0) + 'K';
  return v + '';
}

export function fmt(v) {
  const a = Math.abs(v);
  if (a >= 1e9) return '£' + (v/1e9).toFixed(2) + 'B';
  if (a >= 1e6) return '£' + (v/1e6).toFixed(1) + 'M';
  if (a >= 1e3) return '£' + (v/1e3).toFixed(0) + 'K';
  return '£' + v.toLocaleString();
}

export function nearestIdx(arr, val) {
  let idx = 0, best = Infinity;
  for (let i = 0; i < arr.length; i++) {
    const d = Math.abs(arr[i] - val);
    if (d < best) { best = d; idx = i; }
  }
  return idx;
}

export function formatDate(d) {
  const [y,m,day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${day} ${months[parseInt(m)-1]} ${y}`;
}

export function el(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  for (const [k,v] of Object.entries(attrs||{})) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
}
