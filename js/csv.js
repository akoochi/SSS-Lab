/* ================================================================
   csv.js — shared helpers used by every page
   ----------------------------------------------------------------
   • S3.loadCSV("data/team.csv")  → list of rows (objects)
   • S3.esc(text)                  → makes text safe inside HTML
   • S3.list("a; b; c")            → ["a","b","c"]
   You do not need to edit this file.
   ================================================================ */
window.S3 = (function () {

  /* Turns CSV text into objects. Handles "quoted, text", "" quotes,
     line breaks inside quotes, blank lines and lines starting with # */
  function parseCSV(text) {
    text = text.replace(/^﻿/, "");             // remove Excel BOM
    const rows = []; let row = [], field = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') q = false;
        else field += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else field += c;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    const head = rows.shift().map(h => h.trim().toLowerCase());
    return rows
      .filter(r => r.some(x => x.trim() !== "") && !r[0].trim().startsWith("#"))
      .map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || "").trim()])));
  }

  async function loadCSV(path) {
    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) throw new Error(path + " → " + res.status);
    return parseCSV(await res.text());
  }

  const esc = v => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const list = v => (v || "").split(";").map(s => s.trim()).filter(Boolean);

  /* Turns a term into a URL-friendly id: "Pull-in Voltage" → "pull-in-voltage" */
  const slug = v => String(v).toLowerCase().normalize("NFKD")
    .replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");

  /* Message shown when a file cannot be loaded */
  function failMessage(file) {
    return location.protocol === "file:"
      ? "Data cannot load when the page is opened directly from disk — use GitHub Pages or a local server (see README)."
      : "Could not load " + file + ".";
  }

  return { parseCSV, loadCSV, esc, list, slug, failMessage };
})();
