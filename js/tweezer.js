/* ================================================================
   tweezer.js — the live electrostatic nanotweezer on the home page
   ----------------------------------------------------------------
   PHYSICS (simple but faithful lumped model)
   Two cantilever nanowires face each other across a gap g0. A voltage
   V pulls the tips together. Let u = (closure of the gap)/g0, so the
   gap ratio is r = 1 − u. Each arm behaves like a spring pulled by an
   electrostatic force that grows as the gap shrinks:

        ü + 2ζω u̇ + ω² u = ω² λ V² / r^n

   • Static equilibrium:  u · r^n = λ V²
   • Pull-in happens where the stable and unstable branches meet:
        r* = n/(n+1)   and   λ V_PI² = r*^n /(n+1)
   We choose n and λ so that the result matches the COMSOL benchmark
   reproduced in our 3D NanoTweezer simulator:
        V_PI ≈ 99.4 V and gap at pull-in ≈ 3.72 μm (g0 = 6.90 μm).
   Because the model is dynamic, a SUDDEN voltage step pulls in at a
   lower voltage than a slow sweep ("dynamic pull-in").
   ================================================================ */
(function () {
  const canvas = document.getElementById("tweezerCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  /* ---------- parameters (edit here to change the device) ---------- */
  const P = {
    L: 19.6,        // nanowire length [μm]
    phi: 0.30,      // diameter [μm]
    g0: 6.90,       // initial gap [μm]
    Vpi: 99.4,      // static pull-in voltage [V]
    gapPI: 3.72,    // gap at pull-in [μm]
    zeta: 0.06,     // damping ratio — light damping: a 94 V step pulls in dynamically (threshold ≈ 92.5 V)
    omega: 9.0,     // natural angular frequency of the animation [rad/s]
    releaseFrac: 0.45, // collapsed arms release below 45% of V_PI (adhesion/vdW)
  };
  const rStar = P.gapPI / P.g0;                 // 0.539
  const n = rStar / (1 - rStar);                // exponent so that r* = n/(n+1)
  const lambda = Math.pow(rStar, n) / (n + 1) / (P.Vpi * P.Vpi);

  /* ---------- state ---------- */
  const S = {
    V: 0, u: 0, du: 0,
    collapsed: false, gripped: false, particle: false, dp: 4.5,
    sweep: false, sweepT: 0, flash: 0, t: 0,
    warned: false,
  };

  /* ---------- UI elements ---------- */
  const $ = id => document.getElementById(id);
  const vSlider = $("vSlider"), vLabel = $("vLabel"), status = $("simStatus");
  const roV = $("roV"), roD = $("roD"), roG = $("roG"), roR = $("roR");
  const dpSlider = $("dpSlider"), dpWrap = $("dpWrap"), dpLabel = $("dpLabel");

  const setV = v => { S.V = Math.max(0, Math.min(130, v)); vSlider.value = S.V; vLabel.textContent = S.V.toFixed(1) + " V"; };

  vSlider.addEventListener("input", () => { S.sweep = false; setV(+vSlider.value); });
  $("btnSweep").addEventListener("click", () => { reset(false); S.sweep = true; S.sweepT = 0; });
  $("btnStep").addEventListener("click", () => { reset(false); setV(94); });
  $("btnReset").addEventListener("click", () => reset(true));
  $("btnGrab").addEventListener("click", e => {
    S.particle = !S.particle; e.currentTarget.classList.toggle("on", S.particle);
    dpWrap.hidden = !S.particle; reset(false);
  });
  dpSlider.addEventListener("input", () => { S.dp = +dpSlider.value; dpLabel.textContent = S.dp.toFixed(1) + " μm"; S.gripped = false; });

  function reset(zeroV) {
    S.u = 0; S.du = 0; S.collapsed = false; S.gripped = false; S.sweep = false; S.flash = 0;
    setV(zeroV ? 0 : 0);
  }

  /* drag on the canvas to change the voltage */
  let drag = null;
  canvas.addEventListener("pointerdown", e => { drag = { y: e.clientY, v: S.V }; canvas.setPointerCapture(e.pointerId); S.sweep = false; });
  canvas.addEventListener("pointermove", e => { if (drag) setV(drag.v + (drag.y - e.clientY) * 0.45); });
  canvas.addEventListener("pointerup", () => drag = null);
  canvas.addEventListener("wheel", e => { e.preventDefault(); S.sweep = false; setV(S.V - Math.sign(e.deltaY) * 2); }, { passive: false });

  /* ---------- physics step ---------- */
  function step(dt) {
    if (S.sweep) {                         // slow quasi-static ramp 0 → 105 V
      S.sweepT += dt; setV(Math.min(105, S.sweepT * 16));
      if (S.V >= 105 || S.collapsed || S.gripped) S.sweep = false;
    }
    const contactU = S.particle ? 1 - S.dp / P.g0 : 0.985;   // where the tips stop

    if (S.collapsed) {                     // stuck together until voltage is low
      S.u = contactU; S.du = 0;
      if (S.V < P.releaseFrac * P.Vpi) { S.collapsed = false; S.gripped = false; }
      return;
    }
    const w = P.omega, sub = 8, h = dt / sub;
    for (let k = 0; k < sub; k++) {
      const r = Math.max(1 - S.u, 0.01);
      const acc = w * w * (lambda * S.V * S.V / Math.pow(r, n) - S.u) - 2 * P.zeta * w * S.du;
      S.du += acc * h; S.u += S.du * h;
      if (S.u < 0) { S.u = 0; S.du = 0; }
      if (S.u >= contactU) {               // tips touch the particle or each other
        const hit = Math.abs(S.du);
        S.u = contactU; S.du = 0;
        if (S.particle) {
          S.gripped = true;
          // contact beyond the stable branch (particle smaller than the pull-in gap) = uncontrolled snap
          S.collapsed = contactU > 1 / (n + 1);
          S.flash = (S.collapsed || hit > 0.8) ? 1 : 0;
        } else { S.collapsed = true; S.flash = 1; }
        break;
      }
    }
    if (S.particle && S.gripped && !S.collapsed) {
      // release the particle if the voltage drops so the arms would open
      const r = 1 - contactU;
      if (lambda * S.V * S.V / Math.pow(r, n) < contactU * 0.98) S.gripped = false;
    }
  }

  /* ---------- drawing ---------- */
  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);

  function hexBg() {
    ctx.save(); ctx.strokeStyle = "rgba(0,180,219,0.07)"; ctx.lineWidth = 1;
    const r = 16, dx = r * Math.sqrt(3), dy = r * 1.5;
    for (let j = 0, y = 0; y < H + r; j++, y += dy)
      for (let x = (j % 2) * dx / 2; x < W + r; x += dx) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); }
        ctx.closePath(); ctx.stroke();
      }
    ctx.restore();
  }

  // deflection shape of a cantilever under distributed load, w(1)=1
  const shape = s => (6 * s * s - 4 * s ** 3 + s ** 4) / 3;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    hexBg();
    const x0 = W * 0.13, L = W * 0.74;                 // anchor x, beam length
    const cy = H * 0.5, gapPx = H * 0.56;              // centre line, initial gap in px
    const scale = gapPx / P.g0;                        // px per μm (vertical)
    const thick = Math.max(7, H * 0.035);              // exaggerated nanowire diameter
    const defl = S.u * P.g0 / 2 * scale;               // tip deflection per arm [px]
    const yTop = cy - gapPx / 2, yBot = cy + gapPx / 2;
    const vRatio = Math.min(S.V / P.Vpi, 1.3);

    // electric field glow between the arms
    const tipGap = (P.g0 - S.u * P.g0) * scale;
    const grd = ctx.createRadialGradient(x0 + L, cy, 4, x0 + L, cy, Math.max(60, L * 0.6));
    grd.addColorStop(0, `rgba(0,180,219,${0.10 + 0.35 * vRatio})`); grd.addColorStop(1, "rgba(0,180,219,0)");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

    // field lines (density & brightness grow with V)
    const lines = 14;
    for (let k = 1; k < lines; k++) {
      const s = k / lines, x = x0 + L * s;
      const ya = yTop + defl * shape(s) + thick / 2, yb = yBot - defl * shape(s) - thick / 2;
      const alpha = 0.06 + 0.5 * vRatio * s * s;
      ctx.strokeStyle = `rgba(0,180,219,${alpha})`; ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]); ctx.lineDashOffset = -S.t * 30 * (0.3 + vRatio);
      ctx.beginPath(); ctx.moveTo(x, ya);
      ctx.bezierCurveTo(x + 6, ya + (yb - ya) * 0.35, x - 6, ya + (yb - ya) * 0.65, x, yb); ctx.stroke();
    }
    ctx.setLineDash([]);

    // anchor block (gold) with hatching
    const aw = Math.max(18, W * 0.03);
    ctx.fillStyle = "#FFD700"; roundRect(x0 - aw, yTop - thick * 2.2, aw, gapPx + thick * 4.4, 5); ctx.fill();
    ctx.strokeStyle = "rgba(255,215,0,0.6)"; ctx.lineWidth = 1.5;
    for (let y = yTop - thick * 2; y < yBot + thick * 2; y += 10) { ctx.beginPath(); ctx.moveTo(x0 - aw, y); ctx.lineTo(x0 - aw - 10, y + 9); ctx.stroke(); }

    // the two nanowires
    drawWire(x0, L, yTop, +defl, thick, "top");
    drawWire(x0, L, yBot, -defl, thick, "bot");

    // charges along the arms
    const nCh = Math.round(3 + 9 * Math.min(vRatio, 1));
    ctx.font = `700 ${Math.max(10, thick * 1.1)}px ui-monospace, monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (let k = 0; k < nCh; k++) {
      const s = 0.12 + 0.86 * k / Math.max(nCh - 1, 1);
      const x = x0 + L * s;
      ctx.fillStyle = `rgba(255,215,0,${0.4 + 0.6 * vRatio})`;
      ctx.fillText("+", x, yTop + defl * shape(s) - thick * 1.25);
      ctx.fillStyle = `rgba(120,220,255,${0.4 + 0.6 * vRatio})`;
      ctx.fillText("−", x, yBot - defl * shape(s) + thick * 1.3);
    }

    // nanoparticle
    if (S.particle) {
      const pr = S.dp / 2 * scale, px = x0 + L * 0.985;
      const g2 = ctx.createRadialGradient(px - pr * 0.3, cy - pr * 0.3, pr * 0.1, px, cy, pr);
      g2.addColorStop(0, "#fff6b0"); g2.addColorStop(1, S.gripped ? "#00B4DB" : "#c99a00");
      ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(px, cy, Math.max(pr - thick / 2, 3), 0, Math.PI * 2); ctx.fill();
    }

    // spark when pulled in
    if (S.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${S.flash * 0.6})`;
      ctx.beginPath(); ctx.arc(x0 + L, cy, 30 * S.flash + 6, 0, Math.PI * 2); ctx.fill();
      S.flash = Math.max(0, S.flash - 0.04);
    }

    // dimension arrow for the tip gap
    const xt = x0 + L + thick * 1.8, ya = yTop + defl + thick / 2, yb = yBot - defl - thick / 2;
    if (yb - ya > 8) {
      ctx.strokeStyle = "#8ea3c4"; ctx.fillStyle = "#8ea3c4"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xt, ya); ctx.lineTo(xt, yb); ctx.stroke();
      arrow(xt, ya, -1); arrow(xt, yb, 1);
      ctx.font = "11px ui-monospace, monospace"; ctx.textAlign = "left";
      ctx.fillText("g", xt + 5, cy);
    }

    // labels
    ctx.textAlign = "left"; ctx.font = "11px ui-monospace, monospace"; ctx.fillStyle = "#6f86a8";
    ctx.fillText("V = " + S.V.toFixed(1) + " V", 12, 18);
    ctx.fillText("L = 19.6 μm · φ = 0.30 μm", 12, H - 12);
    ctx.textAlign = "right"; ctx.fillText("not to scale", W - 10, H - 12);
  }

  function drawWire(x0, L, y, d, thick, which) {
    const pts = [];
    for (let i = 0; i <= 50; i++) { const s = i / 50; pts.push([x0 + L * s, y + d * shape(s)]); }
    const path = () => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); };
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(0,180,219,0.8)"; ctx.shadowBlur = 14 + 10 * Math.min(S.V / P.Vpi, 1);
    path(); ctx.strokeStyle = "#007A99"; ctx.lineWidth = thick; ctx.stroke();
    ctx.shadowBlur = 0;
    path(); ctx.strokeStyle = "#00B4DB"; ctx.lineWidth = thick * 0.62; ctx.stroke();
    ctx.save(); ctx.translate(0, which === "top" ? -thick * 0.18 : -thick * 0.18);
    path(); ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.lineWidth = thick * 0.16; ctx.stroke();
    ctx.restore();
  }
  function arrow(x, y, dir) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y - 6 * dir); ctx.lineTo(x + 3, y - 6 * dir); ctx.closePath(); ctx.fill(); }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  /* ---------- readouts & status ---------- */
  function updateUI() {
    const gap = P.g0 * (1 - S.u);
    roV.textContent = S.V.toFixed(1) + " V";
    roD.textContent = (S.u * P.g0 / 2).toFixed(2) + " μm";
    roG.textContent = gap.toFixed(2) + " μm";
    roR.textContent = (1 - S.u).toFixed(3);
    let txt = "STABLE — before pull-in", cls = "";
    if (S.particle && S.gripped && !S.collapsed) { txt = "GRIPPED — particle held"; cls = "grip"; }
    else if (S.particle && S.gripped && S.collapsed) { txt = "SNAP — pull-in onto particle"; cls = "bad"; }
    else if (S.collapsed) { txt = "PULL-IN — arms collapsed"; cls = "bad"; }
    else if (S.V > 0.9 * P.Vpi) { txt = "CRITICAL — near pull-in"; cls = "warn"; }
    status.textContent = txt; status.className = "sim-status " + cls;
  }

  /* ---------- equilibrium curve (inside <details>) ---------- */
  const cc = document.getElementById("curveCanvas"), cx2 = cc && cc.getContext("2d");
  function drawCurve() {
    if (!cc || !cc.offsetParent) return;           // hidden → skip
    const d = Math.min(window.devicePixelRatio || 1, 2), r = cc.getBoundingClientRect();
    if (cc.width !== Math.round(r.width * d)) { cc.width = Math.round(r.width * d); cc.height = Math.round(r.height * d); }
    const w = r.width, h = r.height; cx2.setTransform(d, 0, 0, d, 0, 0); cx2.clearRect(0, 0, w, h);
    const m = { l: 40, r: 12, t: 12, b: 26 }, pw = w - m.l - m.r, ph = h - m.t - m.b;
    const uMax = 1 - S.dp / P.g0, X = u => m.l + (u * P.g0 / 2) / (P.g0 / 2) * pw, Y = v => m.t + ph - v / 120 * ph;
    cx2.strokeStyle = "rgba(255,255,255,.15)"; cx2.lineWidth = 1;
    cx2.beginPath(); cx2.moveTo(m.l, m.t); cx2.lineTo(m.l, m.t + ph); cx2.lineTo(m.l + pw, m.t + ph); cx2.stroke();
    cx2.fillStyle = "#8ea3c4"; cx2.font = "10px ui-monospace, monospace";
    cx2.textAlign = "right"; [0, 40, 80, 120].forEach(v => cx2.fillText(v + "V", m.l - 4, Y(v) + 3));
    cx2.textAlign = "center"; cx2.fillText("tip deflection per arm (μm) →", m.l + pw / 2, h - 6);
    const uStar = 1 / (n + 1);
    const branch = (a, b, color, dash) => {
      cx2.strokeStyle = color; cx2.setLineDash(dash); cx2.lineWidth = 2; cx2.beginPath();
      for (let i = 0; i <= 80; i++) { const u = a + (b - a) * i / 80, v = Math.sqrt(u * Math.pow(1 - u, n) / lambda); i ? cx2.lineTo(X(u), Y(v)) : cx2.moveTo(X(u), Y(v)); }
      cx2.stroke(); cx2.setLineDash([]);
    };
    branch(0, uStar, "#3ef08a", []); branch(uStar, 0.995, "#FF5C7A", [5, 4]);
    cx2.strokeStyle = "#FFD700"; cx2.lineWidth = 2; const px = X(uStar), py = Y(P.Vpi);
    cx2.beginPath(); cx2.moveTo(px - 5, py - 5); cx2.lineTo(px + 5, py + 5); cx2.moveTo(px + 5, py - 5); cx2.lineTo(px - 5, py + 5); cx2.stroke();
    cx2.fillStyle = "#FFD700"; cx2.textAlign = "left"; cx2.fillText("pull-in 99.4 V", px + 8, py - 4);
    if (S.particle) { cx2.strokeStyle = "rgba(0,180,219,.6)"; cx2.setLineDash([2, 3]); cx2.beginPath(); cx2.moveTo(X(uMax), m.t); cx2.lineTo(X(uMax), m.t + ph); cx2.stroke(); cx2.setLineDash([]); }
    cx2.fillStyle = "#fff"; cx2.beginPath(); cx2.arc(X(S.u), Y(Math.min(S.V, 120)), 4.5, 0, Math.PI * 2); cx2.fill();
  }

  /* ---------- main loop (pauses when the card is off-screen) ---------- */
  let last = performance.now(), visible = true;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; if (visible) { last = performance.now(); requestAnimationFrame(loop); } }).observe(canvas);
  function loop(now) {
    if (!visible) return;
    const dt = Math.min((now - last) / 1000, 0.04); last = now; S.t += dt;
    step(dt); draw(); updateUI(); drawCurve();
    requestAnimationFrame(loop);
  }

  resize(); setV(0);
  // a short demo so visitors immediately see the arms move
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setTimeout(() => { if (S.V === 0) setV(70); }, 900);
  requestAnimationFrame(loop);
})();
