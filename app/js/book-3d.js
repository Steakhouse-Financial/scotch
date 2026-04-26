// Book 3D — drag-rotate, with per-face Lambertian shading.
// Each face darkens as it rotates away from a fixed world-space light
// (above and slightly forward of the camera).
(function () {
  const stage = document.querySelector('.book-stage');
  if (!stage) return;
  const book = stage.querySelector('.book-3d');
  const hint = stage.querySelector('.book-hint');

  let ry = -28, rx = -8;
  let dragging = false;
  let lastX = 0, lastY = 0;

  // Light direction in world space: above and slightly forward of camera.
  // Values are pre-normalised.
  const LIGHT = (() => {
    const v = [0, -0.55, 0.84];
    const len = Math.hypot(v[0], v[1], v[2]);
    return v.map(c => c / len);
  })();

  // How dark a fully-back-facing face gets (0 = no shading, 1 = pure black).
  const STRENGTH = 0.7;
  // Minimum darkness applied even on the brightest face — a small uniform
  // shadow keeps the cover from looking flat at the brightest pose.
  const AMBIENT = 0.06;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // Apply rotateX(rxR) * rotateY(ryR) to a book-frame normal.
  function worldNormal(nx, ny, nz, ryR, rxR) {
    const cy = Math.cos(ryR), sy = Math.sin(ryR);
    const cx = Math.cos(rxR), sx = Math.sin(rxR);
    // rotateY(ry):
    const x1 = cy * nx + sy * nz;
    const y1 = ny;
    const z1 = -sy * nx + cy * nz;
    // rotateX(rx):
    return [
      x1,
      cx * y1 - sx * z1,
      sx * y1 + cx * z1,
    ];
  }

  function shadowFor(localN, ryR, rxR) {
    const n = worldNormal(localN[0], localN[1], localN[2], ryR, rxR);
    const dot = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2];
    const lambert = Math.max(0, dot);
    return clamp((1 - lambert) * STRENGTH + AMBIENT, 0, 1);
  }

  function apply() {
    book.style.setProperty('--ry', ry + 'deg');
    book.style.setProperty('--rx', rx + 'deg');

    const ryR = ry * Math.PI / 180;
    const rxR = rx * Math.PI / 180;

    // Book-frame outward normals for each face.
    book.style.setProperty('--shadow-front',  shadowFor([ 0,  0,  1], ryR, rxR).toFixed(3));
    book.style.setProperty('--shadow-back',   shadowFor([ 0,  0, -1], ryR, rxR).toFixed(3));
    book.style.setProperty('--shadow-spine',  shadowFor([-1,  0,  0], ryR, rxR).toFixed(3));
    book.style.setProperty('--shadow-edge',   shadowFor([ 1,  0,  0], ryR, rxR).toFixed(3));
    book.style.setProperty('--shadow-top',    shadowFor([ 0, -1,  0], ryR, rxR).toFixed(3));
    book.style.setProperty('--shadow-bottom', shadowFor([ 0,  1,  0], ryR, rxR).toFixed(3));
  }

  function pt(e) {
    if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function onDown(e) {
    dragging = true;
    if (hint) hint.classList.add('hidden');
    const p = pt(e);
    lastX = p.x; lastY = p.y;
    stage.setPointerCapture && e.pointerId != null && stage.setPointerCapture(e.pointerId);
  }
  function onMove(e) {
    if (!dragging) return;
    const p = pt(e);
    const dx = p.x - lastX;
    const dy = p.y - lastY;
    lastX = p.x; lastY = p.y;
    ry += dx * 0.45;
    rx -= dy * 0.30;
    rx = clamp(rx, -55, 55);
    apply();
  }
  function onUp(e) {
    if (!dragging) return;
    dragging = false;
    stage.releasePointerCapture && e.pointerId != null && stage.releasePointerCapture(e.pointerId);
  }

  stage.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);

  apply();
})();
