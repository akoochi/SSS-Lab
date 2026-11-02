/* ================================================================
   encyclopedia.js — builds encyclopedia.html from data/glossary.csv
   ----------------------------------------------------------------
   • live search (also from the home page: encyclopedia.html?q=word)
   • category filter, A–Z jump bar, random term
   • every term has its own link: encyclopedia.html#pull-in-voltage
   To add a term, add one row to data/glossary.csv — nothing else.
   ================================================================ */
(function () {
  const { loadCSV, esc, list, slug, failMessage } = window.S3;
  const $ = id => document.getElementById(id);
  let TERMS = [], cat = "All", query = "";

  // find a term by name, abbreviation or the beginning of its name
  function findTerm(name) {
    const n = name.toLowerCase();
    return TERMS.find(t => t.term.toLowerCase() === n || (t.abbr && t.abbr.toLowerCase() === n))
        || TERMS.find(t => t.term.toLowerCase().startsWith(n))
        || TERMS.find(t => t.term.toLowerCase().includes(n));
  }

  const hl = text => {
    const safe = esc(text);
    if (!query) return safe;
    const q = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return safe.replace(new RegExp("(" + esc(q) + ")", "ig"), "<mark>$1</mark>");
  };

  function card(t) {
    const rel = list(t.related).map(r => {
      const hit = findTerm(r);
      return hit ? `<a href="#${slug(hit.term)}">${esc(r)}</a>` : `<em>${esc(r)}</em>`;
    }).join("");
    return `
      <article class="e-card" id="${slug(t.term)}">
        <button class="e-link" title="Copy link to this term" data-copy="${slug(t.term)}">🔗</button>
        <span class="cat">${esc(t.category)}</span>
        <h2>${hl(t.term)}${t.abbr ? `<abbr>${hl(t.abbr)}</abbr>` : ""}</h2>
        <p>${hl(t.definition)}</p>
        ${t.formula ? `<div class="formula">${esc(t.formula)}</div>` : ""}
        ${rel ? `<div class="e-rel"><span>see also →</span>${rel}</div>` : ""}
      </article>`;
  }

  function render() {
    const q = query.toLowerCase();
    const hits = TERMS.filter(t => (cat === "All" || t.category === cat) &&
      (!q || [t.term, t.abbr, t.definition, t.category].join(" ").toLowerCase().includes(q)));
    let html = "", letter = "";
    hits.forEach(t => {
      const L = t.term[0].toUpperCase();
      if (L !== letter) { letter = L; html += `<h3 class="e-letter" id="letter-${L}">${L}</h3>`; }
      html += card(t);
    });
    $("eGrid").innerHTML = html || `<p class="empty">No term matches “${esc(query)}”. Try another word — or suggest a new term to the lab!</p>`;
    $("eStatus").textContent = `${hits.length} of ${TERMS.length} terms` + (cat !== "All" ? ` · ${cat}` : "") + (query ? ` · “${query}”` : "");
    const letters = new Set(hits.map(t => t.term[0].toUpperCase()));
    $("eAZ").innerHTML = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(L =>
      letters.has(L) ? `<a href="#letter-${L}">${L}</a>` : `<span>${L}</span>`).join("");
  }

  function renderCats() {
    const counts = {};
    TERMS.forEach(t => counts[t.category] = (counts[t.category] || 0) + 1);
    const cats = ["All", ...Object.keys(counts).sort()];
    $("eCats").innerHTML = cats.map(c => `<button class="e-cat ${c === cat ? "on" : ""}" data-c="${esc(c)}">${esc(c)}<b>${c === "All" ? TERMS.length : counts[c]}</b></button>`).join("");
  }

  function focusHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id || id.startsWith("letter-")) return;
    let el = document.getElementById(id);
    if (!el) { cat = "All"; query = ""; $("eSearch").value = ""; renderCats(); render(); el = document.getElementById(id); }
    if (el) {
      document.querySelectorAll(".e-card.target").forEach(x => x.classList.remove("target"));
      el.classList.add("target"); el.scrollIntoView({ block: "center" });
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    $("year").textContent = new Date().getFullYear();
    const burger = document.querySelector(".burger"), menu = document.querySelector(".menu");
    burger.addEventListener("click", () => burger.setAttribute("aria-expanded", menu.classList.toggle("open")));

    try { TERMS = await loadCSV("data/glossary.csv"); }
    catch (e) { $("eGrid").innerHTML = `<p class="empty">${esc(failMessage("data/glossary.csv"))}</p>`; return; }
    TERMS.sort((a, b) => a.term.localeCompare(b.term));
    $("eCount").textContent = TERMS.length;

    const params = new URLSearchParams(location.search);
    query = params.get("q") || ""; $("eSearch").value = query;
    renderCats(); render(); focusHash();

    $("eSearch").addEventListener("input", e => { query = e.target.value.trim(); render(); });
    $("eCats").addEventListener("click", e => {
      const b = e.target.closest(".e-cat"); if (!b) return;
      cat = b.dataset.c; renderCats(); render();
    });
    $("eRandom").addEventListener("click", () => {
      const t = TERMS[Math.floor(Math.random() * TERMS.length)];
      location.hash = slug(t.term);
    });
    $("eGrid").addEventListener("click", e => {
      const b = e.target.closest("[data-copy]"); if (!b) return;
      const url = location.href.split("#")[0].split("?")[0] + "#" + b.dataset.copy;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => { b.textContent = "✓"; setTimeout(() => b.textContent = "🔗", 1200); }).catch(() => {});
    });
    window.addEventListener("hashchange", focusHash);
  });
})();
