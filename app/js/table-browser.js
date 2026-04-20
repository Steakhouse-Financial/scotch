// ────────────────────────────────────────────────────────────────
// table-browser.js — ES module for the table browser page
// ────────────────────────────────────────────────────────────────

import { loadCSV, downloadCSV } from './csv.js';

/**
 * Initialize the table browser: fetch index, render sidebar, handle navigation.
 */
export async function initTableBrowser() {
  // 1. Fetch the tables index
  const resp = await fetch('./data/tables-index.json');
  const tables = await resp.json();

  // Separate into groups
  const bookTables = tables.filter(t => t.section === 'book');
  const appendixTables = tables.filter(t => t.section === 'appendix');

  // 2. Render sidebar
  const sidebar = document.getElementById('table-sidebar');
  sidebar.innerHTML = '';

  // Render a group of table links
  function renderGroup(label, entries) {
    const groupTitle = document.createElement('div');
    groupTitle.className = 'table-group-title';
    groupTitle.textContent = label;
    sidebar.appendChild(groupTitle);

    for (const entry of entries) {
      const number = entry.id.replace('T', '');
      const link = document.createElement('a');
      link.className = 'table-link';
      link.href = `#${entry.id}`;
      link.dataset.id = entry.id;
      link.innerHTML = `<strong>Table ${number}</strong><span class="table-link-desc">${entry.title}</span>`;
      sidebar.appendChild(link);
    }
  }

  renderGroup('Book Tables', bookTables);
  renderGroup('Appendix Tables', appendixTables);

  // 7. Mobile select
  const mobileSelect = document.createElement('select');
  mobileSelect.id = 'table-select-mobile';
  mobileSelect.className = 'table-select-mobile';

  for (const entry of tables) {
    const number = entry.id.replace('T', '');
    const option = document.createElement('option');
    option.value = entry.id;
    option.textContent = `Table ${number} — ${entry.title}`;
    mobileSelect.appendChild(option);
  }

  sidebar.parentNode.insertBefore(mobileSelect, sidebar);

  mobileSelect.addEventListener('change', () => {
    location.hash = mobileSelect.value;
  });

  // 3. Table selection handler
  async function selectTable(id) {
    const entry = tables.find(t => t.id === id);
    if (!entry) return;

    // Update active link
    const links = sidebar.querySelectorAll('.table-link');
    links.forEach(link => {
      if (link.dataset.id === id) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update mobile select
    mobileSelect.value = id;

    // Fetch and parse CSV
    const csvResp = await fetch(entry.path);
    const text = await csvResp.text();
    const parsed = Papa.parse(text, { skipEmptyLines: false });
    const rows = parsed.data;

    // 5. Title extraction logic
    let title = '';
    let startRow = 0;

    if (rows.length > 0) {
      const firstRow = rows[0];
      const nonEmptyCells = firstRow.filter(cell => cell && cell.trim() !== '');
      if (nonEmptyCells.length <= 1 && firstRow[0] && firstRow[0].includes('Table')) {
        title = firstRow[0].trim();
        startRow = 1;
      }
    }

    // Build the table view
    const tableView = document.getElementById('table-view');
    tableView.innerHTML = '';

    // Title
    if (title) {
      const h2 = document.createElement('h2');
      h2.className = 'table-title';
      h2.textContent = title;
      tableView.appendChild(h2);
    }

    // Build HTML table
    const dataRows = rows.slice(startRow).filter(row => row.some(cell => cell && cell.trim() !== ''));

    if (dataRows.length > 0) {
      const scrollWrapper = document.createElement('div');
      scrollWrapper.className = 'table-scroll';

      const table = document.createElement('table');
      table.className = 'data-table';

      // First row is the header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      for (const cell of dataRows[0]) {
        const th = document.createElement('th');
        th.textContent = cell || '';
        headerRow.appendChild(th);
      }
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Remaining rows are the body
      const tbody = document.createElement('tbody');
      for (let i = 1; i < dataRows.length; i++) {
        const tr = document.createElement('tr');
        for (const cell of dataRows[i]) {
          const td = document.createElement('td');
          const cellText = cell != null ? cell : '';

          // 6. Cell formatting
          if (/^-?[\d,.]+%?$/.test(cellText.trim()) && cellText.trim() !== '') {
            td.className = 'numeric';
          }
          td.textContent = cellText;
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);

      scrollWrapper.appendChild(table);
      tableView.appendChild(scrollWrapper);
    }

    // Download button
    const filename = entry.path.split('/').pop();
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn';
    downloadBtn.textContent = `Download ${filename}`;
    downloadBtn.addEventListener('click', () => {
      downloadCSV(filename, entry.path);
    });
    tableView.appendChild(downloadBtn);
  }

  // 4. Hash navigation
  function loadFromHash() {
    const hash = location.hash.replace('#', '');
    if (hash && tables.find(t => t.id === hash)) {
      selectTable(hash);
    } else {
      selectTable('T1');
    }
  }

  // Click handler for sidebar links
  sidebar.addEventListener('click', (e) => {
    const link = e.target.closest('.table-link');
    if (link) {
      e.preventDefault();
      location.hash = link.dataset.id;
    }
  });

  window.addEventListener('hashchange', loadFromHash);

  // Initial load
  loadFromHash();
}
