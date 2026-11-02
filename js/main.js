/* ================================================================
   main.js — builds every data-driven section of index.html
   ----------------------------------------------------------------
   Reads the CSV files in data/ and turns each row into a card.
   Normally you edit only the CSV files, not this program.
   ================================================================ */
(function () {
  const { loadCSV, esc, list, slug, failMessage } = window.S3;
  const $ = id => document.getElementById(id);

  /* ---------- profile-link buttons (column name → label/icon) ---------- */
  const LINKS = [
    ["scholar", "Scholar", '<path d="M12 3 1 9l11 6 9-4.9V17h2V9z"/><path d="M5 13.2V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.8z"/>'],
    ["scopus", "Scopus", '<path fill="none" stroke="currentColor" stroke-width="2.4" d="M17 6.5c-1.2-1-2.8-1.5-4.5-1.5C9.5 5 7 6.8 7 9c0 5 10 3 10 8 0 2.2-2.5 4-5.5 4-1.9 0-3.6-.6-4.8-1.7"/>'],
    ["orcid", "ORCID", '<circle cx="12" cy="12" r="10"/><path fill="#0A1A3A" d="M8 10h1.6v7H8zm.8-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM11 10h2.8c2.2 0 3.6 1.4 3.6 3.5S16 17 13.8 17H11zm1.6 1.4v4.2h1.2c1.3 0 2-.8 2-2.1s-.7-2.1-2-2.1z"/>'],
    ["researchgate", "ResearchGate", '<rect x="2" y="2" width="20" height="20" rx="3"/><text x="12" y="16.3" font-size="9.5" font-family="Arial" font-weight="700" text-anchor="middle" fill="#0A1A3A">RG</text>'],
    ["linkedin", "LinkedIn", '<path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.3 0-2.9-1.8-2.9S14 14.3 14 15.7V21h-4z"/>'],
    ["github", "GitHub", '<path d="M12 1.5A10.5 10.5 0 0 0 8.7 22c.5.1.7-.2.7-.5v-1.9c-2.9.6-3.5-1.3-3.5-1.3-.5-1.2-1.2-1.5-1.2-1.5-.9-.7.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.5 1.1 3.1.9.1-.7.4-1.1.7-1.4-2.3-.3-4.8-1.2-4.8-5.2 0-1.1.4-2 1.1-2.8-.1-.3-.5-1.4.1-2.8 0 0 .9-.3 2.9 1.1a10 10 0 0 1 5.3 0c2-1.4 2.9-1.1 2.9-1.1.6 1.4.2 2.5.1 2.8.7.8 1.1 1.7 1.1 2.8 0 4-2.5 4.9-4.8 5.2.4.3.7 1 .7 2v3c0 .3.2.6.7.5A10.5 10.5 0 0 0 12 1.5z"/>'],
    ["website", "Website", '<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="M2.5 12h19M12 2.5c2.6 2.6 4 6 4 9.5s-1.4 6.9-4 9.5c-2.6-2.6-4-6-4-9.5s1.4-6.9 4-9.5z"/>'],
  ];
  const socials = p => {
    const a = LINKS.filter(([c]) => p[c]).map(([c, label, svg]) =>
      `<a href="${esc(p[c])}" target="_blank" rel="noopener" title="${label}"><svg viewBox="0 0 24 24" fill="currentColor">${svg}</svg>${label}</a>`);
    return a.length ? `<div class="socials">${a.join("")}</div>` : "";
  };
  const DEFAULT_PHOTO = "assets/images/people/placeholder-person.svg";
  const DEFAULT_COVER = "assets/images/projects/placeholder-project.svg";
  const img = (src, def, alt = "") => `<img src="${esc(src || def)}" alt="${esc(alt)}" loading="lazy" onerror="this.onerror=null;this.src='${def}'">`;
  const STATUS = { open: "Open thesis", ongoing: "Ongoing", completed: "Completed" };

  let AXES = [], PROJECTS = [];

  /* =================== RESEARCH AXES =================== */
  function renderAxes() {
    const tabs = $("axisTabs");
    tabs.innerHTML = AXES.map((a, i) => `
      <button class="axis-tab ${i ? "" : "on"}" role="tab" data-i="${i}" aria-selected="${!i}">
        <img src="${esc(a.icon)}" alt="">
        <small>AXIS ${esc(a.number)}</small>
        <b>${esc(a.title)}</b>
      </button>`).join("");
    tabs.addEventListener("click", e => {
      const b = e.target.closest(".axis-tab"); if (!b) return;
      tabs.querySelectorAll(".axis-tab").forEach(t => { t.classList.toggle("on", t === b); t.setAttribute("aria-selected", t === b); });
      showAxis(+b.dataset.i);
    });
    showAxis(0);
  }
  function showAxis(i) {
    const a = AXES[i];
    const theses = PROJECTS.filter(p => p.axis === a.number);
    $("axisPanel").innerHTML = `
      <p class="sec-no">AXIS ${esc(a.number)} · ${esc(a.short)}</p>
      <h3>${esc(a.title)}</h3>
      <p class="axis-vision">${esc(a.vision)}</p>
      <div class="axis-cols">
        <div><h4>Research questions</h4><ol class="qlist">${list(a.questions).map(q => `<li>${esc(q)}</li>`).join("")}</ol></div>
        <div>
          <h4>Models &amp; methods</h4><div class="tags">${list(a.methods).map(m => `<span class="tag">${esc(m)}</span>`).join("")}</div>
          <h4>Software</h4><div class="tags">${list(a.tools).map(m => `<span class="tag dark">${esc(m)}</span>`).join("")}</div>
          <h4>Target journals</h4><div class="tags">${list(a.journals).map(m => `<span class="tag gold">${esc(m)}</span>`).join("")}</div>
        </div>
      </div>
      ${theses.length ? `<div class="thesis-list"><h4 style="font-size:.74rem;letter-spacing:.14em;text-transform:uppercase;color:var(--cyan-ink);margin:0 0 6px">Projects &amp; thesis topics in this axis</h4>
        ${theses.map(p => `<a class="thesis" href="#p-${esc(p.id)}" data-jump="${esc(p.id)}"><span class="st st-${esc(p.status)}">${STATUS[p.status] || esc(p.status)}</span><span>${esc(p.title)}</span></a>`).join("")}</div>` : ""}`;
  }

  /* =================== PEOPLE =================== */
  function renderPeople(team) {
    const cat = p => (p.category || "").toLowerCase();
    $("facultyList").innerHTML = team.filter(p => cat(p) === "faculty").map(p => `
      <article class="prof reveal">
        <div class="photo">${img(p.photo, DEFAULT_PHOTO, "Photo of " + p.name)}</div>
        <div class="body">
          ${p.role ? `<span class="role">${esc(p.role)}</span>` : ""}
          <h3>${esc(p.name)}</h3>
          <p class="ptitle">${esc(p.title)}</p>
          ${p.bio ? `<p class="pbio">${esc(p.bio)}</p>` : ""}
          ${p.interests ? `<div class="tags">${list(p.interests).map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
          ${p.email ? `<a class="pmail" href="mailto:${esc(p.email)}">✉ ${esc(p.email)}</a>` : ""}
          ${socials(p)}
        </div>
      </article>`).join("");

    const collabs = team.filter(p => cat(p) === "collaborator");
    $("collabList").innerHTML = collabs.length ? collabs.map(p => `
      <article class="collab-card reveal">
        <div class="ini">${esc(p.name.replace(/^Dr\.?\s*/, "").split(/\s+/).map(w => w[0]).slice(0, 2).join(""))}</div>
        <div><h4>${esc(p.name)}</h4><p>${esc(p.role || "")}${p.title ? " · " + esc(p.title) : ""}</p>${socials(p)}</div>
      </article>`).join("") : `<p class="empty">—</p>`;

    const students = team.filter(p => !["faculty", "collaborator"].includes(cat(p)));
    const box = $("studentList");
    box.innerHTML = students.length ? students.map(p => `
      <article class="stu reveal" data-cat="${esc(cat(p))}">
        ${img(p.photo, DEFAULT_PHOTO, "Photo of " + p.name)}
        <h4>${esc(p.name)}</h4>
        <p class="ptitle">${esc(p.title)}</p>
        ${p.research_topic ? `<p class="topic">${esc(p.research_topic)}</p>` : ""}
        ${socials(p)}
      </article>`).join("") : `<p class="empty">Student profiles coming soon.</p>`;

    const filters = $("studentFilters");
    filters.querySelectorAll(".pill").forEach(b => {
      const f = b.dataset.f;
      if (f !== "all" && !students.some(s => cat(s) === f)) b.hidden = true;
      b.addEventListener("click", () => {
        filters.querySelectorAll(".pill").forEach(x => x.classList.toggle("on", x === b));
        box.querySelectorAll(".stu").forEach(c => c.style.display = f === "all" || c.dataset.cat === f ? "" : "none");
      });
    });
  }

  /* =================== PROJECTS =================== */
  function renderProjects() {
    const axisName = n => (AXES.find(a => a.number === n) || {}).title || "";
    const order = { ongoing: 0, completed: 1, open: 2 };
    const items = [...PROJECTS].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
    $("projectList").innerHTML = items.map(p => {
      const title = p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.title)} ↗</a>` : esc(p.title);
      return `
      <article class="proj reveal" id="p-${esc(p.id)}" data-status="${esc(p.status)}">
        <div class="thumb">${img(p.image, DEFAULT_COVER)}</div>
        <div class="body">
          <div class="meta-top"><span class="st st-${esc(p.status)}">${STATUS[p.status] || esc(p.status)}</span>
            ${p.axis ? `<span class="axis-badge">Axis ${esc(p.axis)} · ${esc(axisName(p.axis))}</span>` : ""}</div>
          <h3>${title}</h3>
          <p>${esc(p.summary)}</p>
          ${p.keywords ? `<div class="tags">${list(p.keywords).map(k => `<span class="tag">${esc(k)}</span>`).join("")}</div>` : ""}
          <div class="who">
            ${p.student ? `<div><b>${p.status === "open" ? "Position" : "Team"}:</b> ${esc(p.student.replace(/;/g, ","))}</div>` : ""}
            ${p.supervisor ? `<div><b>Supervisor:</b> ${esc(p.supervisor.replace(/;/g, ","))}</div>` : ""}
            ${p.start ? `<div><b>Year:</b> ${esc(p.start)}</div>` : ""}
          </div>
        </div>
      </article>`;
    }).join("");
    $("projectFilters").addEventListener("click", e => {
      const b = e.target.closest(".pill"); if (b) filterProjects(b.dataset.f);
    });
  }
  function filterProjects(f) {
    document.querySelectorAll("#projectFilters .pill").forEach(x => x.classList.toggle("on", x.dataset.f === f));
    document.querySelectorAll("#projectList .proj").forEach(c => c.style.display = f === "all" || c.dataset.status === f ? "" : "none");
  }
  // links from the axis panel / Join box jump to a project and highlight it
  document.addEventListener("click", e => {
    const j = e.target.closest("[data-jump]");
    if (j) {
      filterProjects("all");
      const card = document.getElementById("p-" + j.dataset.jump);
      if (card) { card.classList.add("in", "hl"); setTimeout(() => card.classList.remove("hl"), 2400); }
    }
    const o = e.target.closest("[data-open-filter]");
    if (o) filterProjects(o.dataset.openFilter);
  });

  /* =================== PUBLICATIONS =================== */
  function renderPubs(pubs) {
    pubs.sort((a, b) => b.year - a.year);
    const draw = q => {
      q = (q || "").toLowerCase().trim();
      const hits = pubs.filter(p => !q || [p.title, p.authors, p.venue, p.year, p.topic].join(" ").toLowerCase().includes(q));
      $("pubCount").textContent = `${hits.length} of ${pubs.length}`;
      let html = "", year = null, n = 0;
      hits.forEach(p => {
        if (p.year !== year) { year = p.year; html += `<div class="pub-year">${esc(year)}</div>`; }
        n++;
        const authors = esc(p.authors).replace(/(A\. Koochi|M\. Goharimanesh)/g, "<mark>$1</mark>");
        const title = p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.title)}</a>` : esc(p.title);
        html += `<div class="pub ${p.type === "book" ? "book" : ""}"><span class="n">[${n}]</span>
          <div><div class="t">${title}</div><div class="a">${authors}</div><div class="v">${esc(p.venue)}</div></div>
          <span class="pt">${p.type === "book" ? "📘 Book" : esc(p.topic || p.type)}</span></div>`;
      });
      $("pubList").innerHTML = html || `<p class="empty">No publication matches “${esc(q)}”.</p>`;
    };
    $("pubSearch").addEventListener("input", e => draw(e.target.value));
    draw("");
  }

  /* =================== TERM OF THE DAY =================== */
  function renderTerm(terms) {
    $("termCount").textContent = terms.length;
    const day = Math.floor(Date.now() / 864e5);
    let i = day % terms.length;
    const show = () => {
      const t = terms[i];
      $("termOfDay").innerHTML = `
        <p class="term-label">Term of the day · ${esc(t.category)}</p>
        <h3>${esc(t.term)}${t.abbr ? ` <small style="color:var(--cyan-ink);font-size:.6em">(${esc(t.abbr)})</small>` : ""}</h3>
        <p>${esc(t.definition)}</p>
        ${t.formula ? `<div class="formula">${esc(t.formula)}</div>` : ""}
        <div class="term-actions"><a href="encyclopedia.html#${slug(t.term)}">Open in encyclopedia →</a>
          <button class="linkish" id="nextTerm">Another term ↻</button></div>`;
      $("nextTerm").onclick = () => { i = Math.floor(Math.random() * terms.length); show(); };
    };
    show();
  }

  /* =================== RESOURCES =================== */
  const RICONS = {
    cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>',
    git: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="9" r="2.5"/><path d="M6 8.5v7M18 11.5c0 4-6 3-11 5"/>',
    book: '<path d="M4 4h7a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4zM20 4h-6"/><path d="M20 4v13.5h-6"/>',
  };
  function renderResources(rows) {
    $("resourceList").innerHTML = rows.map(r => `
      <article class="res reveal">
        <div class="ri"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${RICONS[r.icon] || RICONS.layers}</svg></div>
        <div><small>${esc(r.category)}</small><h3>${esc(r.name)}</h3><p>${esc(r.description)}</p></div>
      </article>`).join("");
  }

  /* =================== NEWS (auto-split by today's date) =================== */
  function renderNews(rows) {
    const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = s => { const [y, m, dd] = (s || "").split("-").map(Number); return y ? new Date(y, (m || 1) - 1, dd || 1) : null; };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const ev = rows.map(r => ({ ...r, s: d(r.date), e: d(r.end_date) || d(r.date) })).filter(r => r.s);
    const f = x => `${x.getDate()} ${M[x.getMonth()]} ${x.getFullYear()}`;
    const item = r => `
      <div class="tl reveal"><time>${f(r.s)}${r.end_date ? " – " + f(r.e) : ""}</time>${r.type ? `<span class="tt">${esc(r.type)}</span>` : ""}
        <h4>${r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener">${esc(r.title)} ↗</a>` : esc(r.title)}</h4>
        <p>${esc(r.description)}${r.location ? ` · <i>${esc(r.location)}</i>` : ""}</p></div>`;
    const up = ev.filter(r => r.e >= today).sort((a, b) => a.s - b.s);
    const past = ev.filter(r => r.e < today).sort((a, b) => b.s - a.s).slice(0, 6);
    $("newsUpcoming").innerHTML = up.length ? up.map(item).join("") : `<p class="empty">No upcoming events.</p>`;
    $("newsPast").innerHTML = past.length ? past.map(item).join("") : `<p class="empty">No past events yet.</p>`;
  }

  /* =================== STATIC INTERACTIONS =================== */
  const JOURNEY = [
    "2010–2016 · Foundations: size-dependent models of nano-beams and nano-actuators using strain-gradient, couple-stress and nonlocal theories — solved with semi-analytical methods (modified Adomian decomposition, homotopy perturbation, GDQ).",
    "Surface energy and Gurtin–Murdoch surface elasticity were added to explain why nanostructures are stiffer or softer than classical theory predicts.",
    "Electromechanical instability: how electrostatic, Casimir and van der Waals forces cause pull-in of nano-switches, cantilevers and doubly-clamped beams — the group's most-cited work.",
    "2017–2021 · Applications to real devices: CNT nanotweezers, nanoresonators, nanobridges, nanoscanners and graphene sensors — one theoretical platform, many devices.",
    "2021–2025 · From analysis to control: fuzzy control of nano-tweezers, robust QFT control of a nanoscanner, dynamic modeling of three-finger micro-tweezers, electromagnetic nanosensors.",
    "2026 → · Intelligent micro/nano systems: physics-informed AI, surrogate models, digital twins, energy harvesting, 2D-material resonators and compliant micro-robotics — the five axes of S³ Lab.",
  ];
  function setupJourney() {
    const steps = $("journey"), txt = $("journeyText");
    const set = i => { steps.querySelectorAll("li").forEach((l, k) => l.classList.toggle("on", k === i)); txt.textContent = JOURNEY[i]; };
    steps.addEventListener("click", e => { const li = e.target.closest("li"); if (li) set(+li.dataset.i); });
    set(0);
  }

  function setupNav() {
    const burger = document.querySelector(".burger"), menu = document.querySelector(".menu");
    burger.addEventListener("click", () => { const o = menu.classList.toggle("open"); burger.setAttribute("aria-expanded", o); });
    menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => menu.classList.remove("open")));
    const spy = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) menu.querySelectorAll("a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
    }), { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach(s => spy.observe(s));
  }

  function setupCounters() {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || "", t0 = performance.now();
      const tick = t => { const k = Math.min((t - t0) / 1400, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))) + (k === 1 ? suf : ""); if (k < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }));
    document.querySelectorAll("[data-count]").forEach(el => io.observe(el));
  }

  function setupLightbox() {
    const lb = $("lightbox");
    $("infoBtn").addEventListener("click", () => lb.showModal ? lb.showModal() : lb.setAttribute("open", ""));
    lb.addEventListener("click", e => { if (e.target === lb || e.target.closest(".lb-close")) lb.close(); });
  }

  function setupReveal() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.08 });
    document.querySelectorAll(".reveal:not(.in)").forEach(el => io.observe(el));
  }

  /* =================== START =================== */
  document.addEventListener("DOMContentLoaded", async () => {
    $("year").textContent = new Date().getFullYear();
    setupNav(); setupJourney(); setupCounters(); setupLightbox();

    const safe = async (file, fn, box) => {
      try { return fn(await loadCSV(file)); }
      catch (err) { console.error(err); if (box && $(box)) $(box).innerHTML = `<p class="empty">${esc(failMessage(file))}</p>`; }
    };

    // axes + projects belong together (each axis lists its projects)
    try {
      [AXES, PROJECTS] = await Promise.all([loadCSV("data/axes.csv"), loadCSV("data/projects.csv")]);
      renderAxes(); renderProjects();
    } catch (err) { console.error(err); $("axisPanel").innerHTML = `<p class="empty">${esc(failMessage("data/axes.csv"))}</p>`; }

    await Promise.all([
      safe("data/team.csv", renderPeople, "facultyList"),
      safe("data/publications.csv", renderPubs, "pubList"),
      safe("data/glossary.csv", renderTerm, "termOfDay"),
      safe("data/facilities.csv", renderResources, "resourceList"),
      safe("data/events.csv", renderNews, "newsUpcoming"),
    ]);
    setupReveal();
    if (location.hash) { const t = document.querySelector(location.hash); if (t) t.scrollIntoView(); }
  });
})();
