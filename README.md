# S³ Lab — Smart Small Systems Laboratory

**From Non-Classical Mechanics to Smart Micro/Nano Systems**
Department of Mechanical Engineering, University of Torbat Heydarieh, Iran
Founder: **Dr. Ali Koochi** · Co-founder: **Dr. Masoud Gohari-Manesh**

A fast, dependency-free website (plain HTML + CSS + JavaScript) for GitHub Pages.
All content lives in **CSV files** in `data/` that can be edited in Excel, Google Sheets or directly on GitHub.

### What's on the site
| Section | Interactive feature | Data file |
|---|---|---|
| Home | **Live electrostatic nanotweezer** — voltage slider, sweep to pull-in, dynamic pull-in (94 V step), nanoparticle gripping, equilibrium curve | `js/tweezer.js` |
| About | Clickable 15-year research trajectory | `js/main.js` |
| Research | Five research axes (tabs) with questions, methods, software, journals and related theses | `data/axes.csv` |
| Feynman | “Plenty of Room at the Bottom” infographic (lightbox) + **Powers-of-Ten zoom** from human to atom | `js/scale.js` |
| People | Founders, collaborators, students (filters), academic profile links | `data/team.csv` |
| Projects | Completed / ongoing work + 15 open MSc thesis topics (filters) | `data/projects.csv` |
| Publications | Searchable, grouped by year | `data/publications.csv` |
| Encyclopedia | Separate page `encyclopedia.html`: 100 MEMS/NEMS terms, search, categories, A–Z, deep links | `data/glossary.csv` |
| Resources, News | Auto-sorted upcoming / past events | `data/facilities.csv`, `data/events.csv` |

---

## 1. Folder structure

```
sss-lab/
├── index.html               main page
├── encyclopedia.html        MEMS/NEMS encyclopedia
├── .nojekyll                serve files as-is on GitHub Pages
├── css/  style.css · encyclopedia.css
├── js/   csv.js · tweezer.js · scale.js · main.js · encyclopedia.js
├── data/                    ★ EDIT THESE ★
│   ├── team.csv  axes.csv  projects.csv  publications.csv
│   ├── glossary.csv  facilities.csv  events.csv
├── assets/
│   ├── fonts/               self-hosted Inter (works without Google)
│   ├── images/logo/         sss-logo.svg · favicon.svg · og-image.svg
│   ├── images/feynman/      Plenty-of-Room infographic
│   ├── images/icons/        research-axis icons
│   ├── images/people/       default photo
│   ├── images/projects/     default project cover
│   ├── images/news/         event photos (optional)
│   └── documents/           PDFs: brochures, calls for students
├── people/
│   ├── faculty/ali-koochi/ · faculty/masoud-gohari-manesh/   ← photo.jpg
│   ├── collaborators/
│   ├── students/_TEMPLATE_student/   ← copy for each new student
│   └── alumni/
├── projects/
│   ├── _TEMPLATE_project/   ← copy for each new project/thesis (docs/ media/ data/)
│   └── nanotweezer-simulator/ · nems-magnetic-biosensor/ · …
├── research/                one folder per axis for open code & data
│   └── axis1-nonlocal-ml/ … axis5-control-digitaltwin/  (code/ datasets/ papers/)
└── docs/brand/              logo concept board & palette
```

---

## 2. Publishing on GitHub Pages

1. On <https://github.com> click **New repository** → name it e.g. **`SSS-Lab`** → *Public* → **Create**.
   The site will be at `https://<username>.github.io/SSS-Lab/`.
2. **Add file → Upload files** → drag **the contents** of this folder (including the hidden `.nojekyll`) → **Commit changes**.
3. **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save.**
4. After 1–2 minutes open the address shown on the Pages settings page.

Command line alternative:
```bash
cd sss-lab
git init && git add . && git commit -m "S³ Lab website"
git branch -M main
git remote add origin https://github.com/<username>/SSS-Lab.git
git push -u origin main
```

**Preview on your computer** (CSV files cannot be read by double-clicking `index.html`):
```bash
cd sss-lab
python -m http.server 8000      # then open http://localhost:8000
```

---

## 3. Updating content

Edit a CSV → commit → the site updates in a minute. On GitHub: open the file → ✏️ → edit → **Commit changes**.

**CSV rules:** never change the first line (column names) · put text containing commas in "double quotes" ·
separate list items with `;` · leave a cell empty to hide it · a line starting with `#` is ignored ·
in Excel save as **CSV UTF-8**.

| File | Columns | Notes |
|---|---|---|
| `team.csv` | id, name, category, role, title, photo, email, bio, research_topic, interests, scholar, scopus, orcid, researchgate, linkedin, github, website | category = `faculty`, `collaborator`, `phd`, `msc`, `bsc`, `alumni` |
| `axes.csv` | id, number, title, short, icon, vision, questions, methods, tools, journals | lists separated by `;` |
| `projects.csv` | id, title, status, axis, summary, student, supervisor, keywords, image, start, link | status = `open`, `ongoing`, `completed`; axis = 1–5 |
| `publications.csv` | year, type, title, authors, venue, link, topic | type = `journal`, `book`, `conference` |
| `glossary.csv` | term, abbr, category, definition, formula, related | each term automatically gets a link `encyclopedia.html#term-name` |
| `facilities.csv` | name, category, description, icon | icon = cpu, layers, code, play, git, book |
| `events.csv` | date, end_date, title, type, location, description, link | dates as `YYYY-MM-DD`; sorted into Upcoming/Recent automatically |

**New student:** copy `people/students/_TEMPLATE_student/` → add `photo.jpg` → add a row to `team.csv`.
**Student takes an open thesis:** in `projects.csv` change `open` → `ongoing` and write the name in `student`.
**New encyclopedia term:** add one row to `glossary.csv` — the search, categories and A–Z update themselves.

---

## 4. ⚠️ Please check before going live

- [ ] **Dr. Gohari-Manesh's links** in `team.csv`: Scholar, Scopus, ORCID and LinkedIn currently open *search pages* → replace with the direct profile URLs. Also add his e-mail.
- [ ] **Dr. Koochi's LinkedIn** is a search link → replace if a profile exists. (Scholar, Scopus 36613214200, ORCID 0000-0003-2260-2638 and ResearchGate are direct.)
- [ ] **Dr. M.R. Gharib** is listed as a collaborator (frequent co-author in the same department) — keep or remove.
- [ ] **Faculty photos:** `people/faculty/<name>/photo.jpg`.
- [ ] **Publications:** a curated selection — check authors/years, add DOIs where empty. The authors of the ISA Transactions QFT paper are shown as “A. Koochi and co-authors” — please complete.
- [ ] **Sample rows** (students, some events) are marked “(sample)”.
- [ ] **Sister-lab link** in the Contact section assumes ARCSLAB is at `goharimanesh.github.io/ARCSLAB/`.
- [ ] **Lab e-mail:** the Contact section uses Dr. Koochi's e-mail until a lab address exists.

---

## 5. Customising

- **Colours / fonts:** top of `css/style.css` (`--navy`, `--cyan`, `--gold`).
- **Tweezer model:** the `P` block at the top of `js/tweezer.js` (length, diameter, gap, pull-in voltage, damping).
- **Powers-of-Ten objects:** the `OBJECTS` list at the top of `js/scale.js`.
- **Research-trajectory texts:** the `JOURNEY` list in `js/main.js`.
- **Brand:** palette & concept board in `docs/brand/`; Montserrat loads from Google Fonts with a self-hosted Inter fallback (fonts are SIL OFL licensed).

### About the nanotweezer model
Lumped two-arm model: ü + 2ζωu̇ + ω²u = ω²λV²/(1−u)ⁿ, where u is the gap closure ratio.
n and λ are calibrated so that static pull-in occurs at **V_PI = 99.4 V** with a gap of **3.72 μm** (g₀ = 6.90 μm, L = 19.6 μm, φ = 0.30 μm) —
the COMSOL benchmark (Chang et al., 2009) reproduced by the group's 3D simulator <https://goharimanesh.github.io/NanoTweezer/>.
With light damping (ζ = 0.06) a sudden step pulls in at ≈ 92.5 V (dynamic pull-in), while a slow ramp to 94 V stays stable.
A particle smaller than the pull-in gap (3.72 μm) is hit by an uncontrolled snap — larger particles are gripped stably.
It is an educational model, not a substitute for the full 3D simulation.
