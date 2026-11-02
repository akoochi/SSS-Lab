# Project / thesis folder template

Copy this folder and rename it with the project ID used in `data/projects.csv`.

```
projects/<project-id>/
├── cover.svg / cover.jpg  ← 16:9 picture shown on the website
├── README.md              ← goals, team, timeline, DOI of papers
├── docs/                  ← proposal, reports, slides
├── media/                 ← figures, videos of simulations
└── data/                  ← small datasets (large ones → Zenodo)
```

Add one row to `data/projects.csv`:

```
my-project,Project title,ongoing,3,"One-sentence summary.",Student Name – MSc,Dr. Ali Koochi,Keyword 1; Keyword 2,projects/my-project/cover.jpg,2027,
```

- `status`: `open` (open thesis topic), `ongoing`, `completed`
- `axis`: 1–5 (see data/axes.csv) — the project then also appears inside that research axis
- When a student takes an open topic: change `open` → `ongoing` and write the student's name.
