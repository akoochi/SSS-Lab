/* ================================================================
   scale.js — "Powers of Ten" explorer for the Feynman section
   ----------------------------------------------------------------
   Move the slider (or press "Dive to the atom") to zoom from the
   size of a person down to a single atom. Each circle is an object
   drawn at its true relative size. Add or edit objects in OBJECTS.
   size = characteristic size in metres.
   ================================================================ */
(function () {
  const canvas = document.getElementById("scaleCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const OBJECTS = [
    { size: 1.7,     name: "Human",                       text: "Our everyday scale — about 1.7 m. Gravity and inertia dominate." },
    { size: 0.15,    name: "Smartphone",                  text: "A phone carries several MEMS: accelerometer, gyroscope, microphones and pressure sensor." },
    { size: 5e-3,    name: "Ant",                         text: "An ant is about 5 mm long — and lifts many times its own weight, thanks to scaling laws." },
    { size: 1.6e-3,  name: "Pin head",                    text: "Feynman: the whole Encyclopaedia Britannica would fit on a pin head if reduced 25,000 times." },
    { size: 1e-3,    name: "MEMS chip",                   text: "A typical MEMS die (≈1 mm) holds proof masses, springs and comb drives." },
    { size: 4e-4,    name: "Feynman's motor (1/64 inch)", text: "Feynman offered $1,000 for a working motor smaller than 1/64 inch; William McLellan built one in 1960." },
    { size: 8e-5,    name: "Human hair",                  text: "A human hair is ≈ 80 μm thick — wider than most MEMS beams." },
    { size: 1.96e-5, name: "Nanotweezer arm",             text: "Each arm of our electrostatic nanotweezer is 19.6 μm long (see the live model above)." },
    { size: 7e-6,    name: "Red blood cell",              text: "A red blood cell is ≈ 7 μm — the scale of “swallowing the surgeon”." },
    { size: 1e-6,    name: "Bacterium",                   text: "A bacterium is about 1 μm. Below this, surface forces overwhelm inertia." },
    { size: 3e-7,    name: "Nanowire diameter",           text: "The tweezer's carbon nanowires are only 0.30 μm thick." },
    { size: 1e-7,    name: "Virus",                       text: "≈ 100 nm: the gateway to NEMS. Surface effects and size-dependent stiffness matter here." },
    { size: 2e-8,    name: "Casimir / vdW gap",           text: "Gaps of tens of nanometres: quantum Casimir and van der Waals forces can cause pull-in without any voltage." },
    { size: 2e-9,    name: "DNA helix / CNT",             text: "DNA and a carbon nanotube are both ≈ 2 nm wide — nature's information storage that inspired Feynman." },
    { size: 3.4e-10, name: "Graphene layer",              text: "One graphene layer is 0.34 nm thick — a 2D material for ultra-sensitive resonators." },
    { size: 1e-10,   name: "Atom",                        text: "≈ 0.1 nm. Arranging atoms one by one — Feynman's ultimate goal — is now possible with probe microscopes." },
  ];

  const slider = document.getElementById("scaleSlider");
  const outSize = document.getElementById("scaleSize"), outZone = document.getElementById("scaleZone"), outText = document.getElementById("scaleText");
  const playBtn = document.getElementById("scalePlay");

  let z = -slider.value, target = z, playing = false, W = 0, H = 0;

  function resize() {
    const d = Math.min(window.devicePixelRatio || 1, 2), r = canvas.getBoundingClientRect();
    W = r.width; H = r.height; canvas.width = Math.round(W * d); canvas.height = Math.round(H * d);
    ctx.setTransform(d, 0, 0, d, 0, 0); draw();
  }

  /* nice human-readable length */
  function fmt(m) {
    const units = [[1, "m"], [1e-3, "mm"], [1e-6, "μm"], [1e-9, "nm"], [1e-12, "pm"]];
    for (const [f, u] of units) if (m >= f * 0.999) { const v = m / f; return String(+(v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2))) + " " + u; }
    return m.toExponential(1) + " m";
  }
  function zone(m) {
    if (m >= 1e-3) return ["Macro world", ""];
    if (m >= 1e-6) return ["MEMS world · micrometres", "mems"];
    if (m >= 1e-7) return ["Micro → nano transition", "mems"];
    if (m >= 1e-9) return ["NEMS world · nanometres", "nems"];
    return ["Atomic scale", "nems"];
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const view = Math.pow(10, z);                 // metres represented by the canvas height
    const cx = W / 2, cy = H / 2 + 6, unit = (H * 0.86) / view;

    // background: micro-grid fading into an atomic lattice at the bottom of the scale
    const atomic = Math.max(0, Math.min(1, (-z - 8.3) / 1.5));
    ctx.strokeStyle = `rgba(0,180,219,${0.05 + 0.10 * atomic})`; ctx.lineWidth = 1;
    const step = 40;
    for (let x = (cx % step); x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = (cy % step); y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // nearest object = the "current" one
    let cur = 0, best = 1e9;
    OBJECTS.forEach((o, i) => { const d = Math.abs(Math.log10(o.size) - (z - 0.25)); if (d < best) { best = d; cur = i; } });

    OBJECTS.forEach((o, i) => {
      const r = o.size * unit / 2;
      if (r < 1.5 || r > Math.hypot(W, H)) return;
      const on = i === cur;
      if (on) {
        const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
        g.addColorStop(0, "rgba(0,180,219,0.28)"); g.addColorStop(1, "rgba(0,180,219,0.02)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = on ? "#00B4DB" : i % 2 ? "rgba(255,215,0,0.55)" : "rgba(160,190,230,0.45)";
      ctx.lineWidth = on ? 2.5 : 1.3;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

      if (r > 7 && r < H * 0.62) {           // label around the circle at different angles
        const a = -Math.PI / 2 + (i % 5 - 2) * 0.5;
        const lx = cx + Math.cos(a) * (r + 8), ly = cy + Math.sin(a) * (r + 8);
        ctx.font = (on ? "600 13px " : "12px ") + "Montserrat, InterS3, Arial, sans-serif";
        ctx.fillStyle = on ? "#ffffff" : "#9fb2cf";
        ctx.textAlign = Math.cos(a) > 0.2 ? "left" : Math.cos(a) < -0.2 ? "right" : "center";
        ctx.textBaseline = Math.sin(a) < 0 ? "bottom" : "top";
        ctx.fillText(o.name + " · " + fmt(o.size), lx, ly);
      }
    });

    // atoms appear as dots at the bottom of the scale
    if (atomic > 0) {
      const ar = 0.5e-10 * unit, sp = 2.5e-10 * unit;
      if (sp > 6) {
        ctx.fillStyle = `rgba(255,215,0,${0.25 * atomic})`;
        for (let x = cx % sp; x < W; x += sp) for (let y = cy % sp; y < H; y += sp) { ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, ar * 0.6), 0, Math.PI * 2); ctx.fill(); }
      }
    }

    // scale bar
    const bar = Math.pow(10, Math.floor(z - 0.6)), bpx = bar * unit;
    ctx.fillStyle = "#fff"; ctx.fillRect(16, H - 22, bpx, 3);
    ctx.font = "11px ui-monospace, monospace"; ctx.textAlign = "left"; ctx.textBaseline = "bottom"; ctx.fillStyle = "#c6d3e6";
    ctx.fillText(fmt(bar), 16, H - 26);

    // readout
    const o = OBJECTS[cur], [zn, zc] = zone(o.size);
    outSize.textContent = o.name + " — " + fmt(o.size);
    outZone.textContent = zn; outZone.className = "zone " + zc;
    outText.textContent = o.text;
  }

  slider.addEventListener("input", () => { playing = false; playBtn.textContent = "▶ Dive to the atom"; target = z = -slider.value; draw(); });
  playBtn.addEventListener("click", () => {
    if (playing) { playing = false; playBtn.textContent = "▶ Dive to the atom"; return; }
    if (z < -9.8) z = -slider.min;           // restart from the top
    playing = true; playBtn.textContent = "❚❚ Pause";
  });

  let last = 0;
  function loop(t) {
    if (playing) {
      const dt = last ? (t - last) / 1000 : 0;
      z = Math.max(-slider.max, z - dt * 0.85);
      slider.value = -z; draw();
      if (z <= -slider.max) { playing = false; playBtn.textContent = "↺ Back to human scale"; }
    }
    last = t; requestAnimationFrame(loop);
  }
  window.addEventListener("resize", resize);
  resize(); requestAnimationFrame(loop);
})();
