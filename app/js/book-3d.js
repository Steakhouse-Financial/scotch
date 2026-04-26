// Book 3D — drag-rotate, plus passive mouse-tracking parallax.
// Each face darkens as it rotates away from a fixed world-space light
// (above and slightly forward of the camera).
(function () {
  const stage = document.querySelector('.book-stage');
  if (!stage) return;
  const book = stage.querySelector('.book-3d');
  const hint = stage.querySelector('.book-hint');

  // Base pose — set by drag, persists after release.
  let baseRy = -28, baseRx = -8;
  // Mouse-follow offset, eases toward target each frame.
  let offsetY = 0, offsetX = 0;
  let targetOffsetY = 0, targetOffsetX = 0;

  let dragging = false;
  let lastX = 0, lastY = 0;

  // Parallax range and easing for the passive mouse-follow.
  const FOLLOW_RANGE_Y = 14;   // ° max horizontal sway
  const FOLLOW_RANGE_X = 7;    // ° max vertical tilt
  const EASE = 0.08;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Light direction in world space: above and slightly forward of camera.
  // Values are pre-normalised.
  const LIGHT = (() => {
    const v = [0, -0.55, 0.84];
    const len = Math.hypot(v[0], v[1], v[2]);
    return v.map(c => c / len);
  })();

  // How dark a fully-back-facing face gets (0 = no shading, 1 = pure black).
  const STRENGTH = 0.55;
  // Minimum darkness applied even on the brightest face — a small uniform
  // shadow keeps the cover from looking flat at the brightest pose.
  const AMBIENT = 0.02;

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
    const ry = baseRy + offsetY;
    const rx = baseRx + offsetX;
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

  function tick() {
    if (dragging) {
      // Decay parallax to 0 during drag so the drag itself feels direct.
      offsetY += (0 - offsetY) * 0.2;
      offsetX += (0 - offsetX) * 0.2;
    } else {
      offsetY += (targetOffsetY - offsetY) * EASE;
      offsetX += (targetOffsetX - offsetX) * EASE;
    }
    apply();
    requestAnimationFrame(tick);
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
    baseRy += dx * 0.45;
    baseRx -= dy * 0.30;
    baseRx = clamp(baseRx, -55, 55);
  }
  function onUp(e) {
    if (!dragging) return;
    dragging = false;
    stage.releasePointerCapture && e.pointerId != null && stage.releasePointerCapture(e.pointerId);
  }

  // Passive mouse-follow over the whole window — gives the book a
  // tasteful sway as the cursor moves around the page.
  function onWindowMouseMove(e) {
    if (dragging || reducedMotion) return;
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    targetOffsetY = clamp(nx, -1, 1) * FOLLOW_RANGE_Y;
    targetOffsetX = -clamp(ny, -1, 1) * FOLLOW_RANGE_X;
  }

  function onPageLeave() {
    targetOffsetY = 0;
    targetOffsetX = 0;
  }

  stage.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  window.addEventListener('mousemove', onWindowMouseMove, { passive: true });
  document.addEventListener('mouseleave', onPageLeave);

  apply();
  requestAnimationFrame(tick);
})();
