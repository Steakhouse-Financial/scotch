// Book 3D — drag-rotate, fresnel rim tracks rotation.
// Purely user-driven: no idle auto-spin.
(function () {
  const stage = document.querySelector('.book-stage');
  if (!stage) return;
  const book  = stage.querySelector('.book-3d');
  const hint  = stage.querySelector('.book-hint');
  const cover = stage.querySelector('.book-cover');

  // Initial pose
  let ry = -28;   // yaw
  let rx = -8;    // pitch
  let dragging = false;
  let lastX = 0, lastY = 0;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function apply() {
    // Yaw and pitch on the book.
    book.style.setProperty('--ry', ry + 'deg');
    book.style.setProperty('--rx', rx + 'deg');

    if (cover) {
      // Specular highlight position — light source treated as fixed in world
      // space (above-front of the book). Each face has its own "facing the
      // light" angle: front=0°, back=±180°, spine=+90° (left edge).
      // The highlight slides on each face based on how far that face has
      // yawed away from its facing-the-light pose.
      const wrap = (a) => {
        // Shortest signed angular distance, in [-180, 180]
        let x = ((a + 180) % 360 + 360) % 360 - 180;
        return x;
      };
      const k = 0.9;          // horizontal sweep per degree of yaw
      const gy = 30 + rx * 1.4; // shared vertical position from pitch

      const dxFront = wrap(ry);          // 0 when front faces light
      const dxBack  = wrap(ry - 180);    // 0 when back faces light
      const dxSpine = wrap(ry + 90);     // 0 when spine faces light

      book.style.setProperty('--gloss-x-front', clamp(50 - dxFront * k, -20, 120) + '%');
      book.style.setProperty('--gloss-x-back',  clamp(50 - dxBack  * k, -20, 120) + '%');
      book.style.setProperty('--gloss-x-spine', clamp(50 - dxSpine * k, -20, 120) + '%');
      book.style.setProperty('--gloss-y',       clamp(gy, -20, 120) + '%');

      // Fresnel rim — brightens when the cover is rotated away from the viewer.
      // 0 at face-on, ~0.85 at grazing angles.
      const yawAway = Math.min(Math.abs(ry) / 70, 1);
      const pitchAway = Math.min(Math.abs(rx) / 60, 1);
      const fres = 0.10 + 0.75 * Math.max(yawAway, pitchAway);
      cover.style.setProperty('--fresnel', fres.toFixed(3));
    }
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
