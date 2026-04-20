// ────────────────────────────────────────────────────────────────
// csv.js — ES module for CSV loading, aggregation, and download
// ────────────────────────────────────────────────────────────────

/**
 * Fetch and parse a CSV file using PapaParse (assumed globally available).
 * Returns an array of row objects.
 */
export async function loadCSV(path) {
  const resp = await fetch(path);
  const text = await resp.text();
  const result = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
  return result.data;
}

/**
 * Aggregate rows from appendix_banks.csv for a specific bank.
 * Groups by date and builds asset/liability/equity arrays per date.
 *
 * Returns:
 *   { years, dates, data: [{a, l, e}, ...], assetOrder, liabOrder, eqOrder }
 */
export function aggregateBanks(rows, bankName) {
  // Filter rows for the specified bank
  const bankRows = rows.filter(r => r.bank === bankName);

  // Determine unique categories per account type
  const assetCats = new Set();
  const liabCats = new Set();
  const eqCats = new Set();

  for (const r of bankRows) {
    if (r.account === 'Assets') assetCats.add(r.shf_subaccount);
    else if (r.account === 'Liabilities') liabCats.add(r.shf_subaccount);
    else if (r.account === 'Equity') eqCats.add(r.shf_subaccount);
  }

  const assetOrder = [...assetCats];
  const liabOrder = [...liabCats];
  const eqOrder = [...eqCats];

  // Group rows by date
  const byDate = new Map();
  for (const r of bankRows) {
    if (!byDate.has(r.date)) byDate.set(r.date, []);
    byDate.get(r.date).push(r);
  }

  // Sort dates chronologically
  const dates = [...byDate.keys()].sort();
  const years = dates.map(d => parseInt(d.split('-')[0], 10));

  // Build data array
  const data = dates.map(date => {
    const dateRows = byDate.get(date);
    const a = assetOrder.map(cat => {
      const match = dateRows.find(r => r.account === 'Assets' && r.shf_subaccount === cat);
      return match ? Math.abs(match.value) : 0;
    });
    const l = liabOrder.map(cat => {
      const match = dateRows.find(r => r.account === 'Liabilities' && r.shf_subaccount === cat);
      return match ? Math.abs(match.value) : 0;
    });
    const e = eqOrder.map(cat => {
      const match = dateRows.find(r => r.account === 'Equity' && r.shf_subaccount === cat);
      return match ? Math.abs(match.value) : 0;
    });
    return { a, l, e };
  });

  return { years, dates, data, assetOrder, liabOrder, eqOrder };
}

/**
 * Download a CSV file by fetching its URL and triggering a browser download.
 */
export async function downloadCSV(filename, url) {
  const resp = await fetch(url);
  const text = await resp.text();
  const blob = new Blob([text], { type: 'text/csv' });
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}
