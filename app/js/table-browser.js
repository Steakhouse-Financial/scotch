// ────────────────────────────────────────────────────────────────
// table-browser.js — ES module for the table browser page
// ────────────────────────────────────────────────────────────────

import { downloadCSV } from './csv.js';

export async function initTableBrowser() {
  const resp = await fetch('./data/tables-index.json');
  const tables = await resp.json();

  const select = document.getElementById('table-select');
  const view = document.getElementById('table-view');

  // Build grouped dropdown
  const bookGroup = document.createElement('optgroup');
  bookGroup.label = 'Book Tables';
  const appendixGroup = document.createElement('optgroup');
  appendixGroup.label = 'Appendix Tables';

  for (const entry of tables) {
    const num = entry.id.replace('T', '');
    const opt = document.createElement('option');
    opt.value = entry.id;
    opt.textContent = `Table ${num} — ${entry.title}`;
    if (entry.section === 'book') bookGroup.appendChild(opt);
    else appendixGroup.appendChild(opt);
  }
  select.appendChild(bookGroup);
  select.appendChild(appendixGroup);

  // Load a table
  async function loadTable(id) {
    const entry = tables.find(t => t.id === id);
    if (!entry) return;

    select.value = id;

    const csvResp = await fetch(entry.path);
    const text = await csvResp.text();
    const parsed = Papa.parse(text, { skipEmptyLines: false });
    const rows = parsed.data;

    // Extract title from first row if present
    let title = '';
    let startRow = 0;
    if (rows.length > 0) {
      const first = rows[0];
      const nonEmpty = first.filter(c => c && c.trim() !== '');
      if (nonEmpty.length <= 1 && first[0] && first[0].includes('Table')) {
        title = first[0].trim();
        startRow = 1;
      }
    }

    view.innerHTML = '';

    // Title
    if (title) {
      const h2 = document.createElement('h2');
      h2.className = 'table-title';
      h2.textContent = title;
      view.appendChild(h2);
    }

    // Table
    const dataRows = rows.slice(startRow).filter(row => row.some(c => c && c.trim() !== ''));
    if (dataRows.length > 0) {
      const wrap = document.createElement('div');
      wrap.className = 'table-scroll';

      const table = document.createElement('table');
      table.className = 'data-table';

      const thead = document.createElement('thead');
      const hr = document.createElement('tr');
      for (const cell of dataRows[0]) {
        const th = document.createElement('th');
        th.textContent = cell || '';
        hr.appendChild(th);
      }
      thead.appendChild(hr);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      for (let i = 1; i < dataRows.length; i++) {
        const tr = document.createElement('tr');
        for (const cell of dataRows[i]) {
          const td = document.createElement('td');
          td.textContent = cell != null ? cell : '';
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      wrap.appendChild(table);
      view.appendChild(wrap);
    }

    // Download button
    const filename = entry.path.split('/').pop();
    const btn = document.createElement('button');
    btn.className = 'download-btn';
    btn.textContent = `Download ${filename}`;
    btn.addEventListener('click', () => downloadCSV(filename, entry.path));
    view.appendChild(btn);
  }

  // Navigation
  select.addEventListener('change', () => {
    location.hash = select.value;
  });

  function loadFromHash() {
    const hash = location.hash.replace('#', '');
    if (hash && tables.find(t => t.id === hash)) loadTable(hash);
    else loadTable('T1');
  }

  window.addEventListener('hashchange', loadFromHash);
  loadFromHash();
}
