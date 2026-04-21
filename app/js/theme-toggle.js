const STORAGE_KEY = 'scotch:theme';

function resolve(theme) {
  if (theme === 'auto') {
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

function apply(theme) {
  document.documentElement.classList.toggle('dark', resolve(theme) === 'dark');
}

function read() {
  return localStorage.getItem(STORAGE_KEY) || 'auto';
}

function write(theme) {
  if (theme === 'auto') localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, theme);
}

function syncUI(theme) {
  document.querySelectorAll('.theme-toggle button[data-theme]').forEach(btn => {
    const active = btn.dataset.theme === theme;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
}

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (read() === 'auto') apply('auto');
});

export function initThemeToggle() {
  const current = read();
  apply(current);
  syncUI(current);

  document.querySelectorAll('.theme-toggle').forEach(el => {
    el.addEventListener('click', e => {
      const btn = e.target.closest('button[data-theme]');
      if (!btn) return;
      const theme = btn.dataset.theme;
      write(theme);
      apply(theme);
      syncUI(theme);
    });
  });
}
