# CLAUDE.md — AI Assistant Guide for Projekt_5-7_Rot

## Project Overview

**Projekt_5-7_Rot** is a static, client-side web application for German primary school students (Jahrgänge 5–7). It provides interactive tools to guide students through the stages of a school project:

1. **Idea brainstorming** (`idee.html`) — multi-step wizard with timer and localStorage persistence
2. **Research question generation** (`forscherfrage.html`) — input form with links to child-safe encyclopedias
3. **Project contract** (`Vertrag/projektvertrag.html`) — fills a real PDF template using PDF-Lib
4. **Supporting pages** — sustainability goals (`nachhaltigkeit.html`), project council (`rat.html`), results (`1-result.html`), and stubs (`produkt.html`, `buddeln.html`)

The entire application runs without a backend, build system, or package manager. Everything is served as plain HTML/CSS/JS files.

---

## Repository Structure

```
Projekt_5-7_Rot/
├── index.html                  # Landing page / navigation hub
├── idee.html                   # Project idea wizard (multi-phase)
├── forscherfrage.html          # Research question generator
├── nachhaltigkeit.html         # Sustainability goals (SDGs)
├── rat.html                    # Project council page
├── produkt.html                # Product development (stub)
├── buddeln.html                # Alternative project doc (WIP)
├── vertrag.html                # Older contract tool
├── 1-result.html               # AI-prompt result display
├── grundstruktur               # PDF generator HTML template (no extension)
├── projekt.css                 # Main shared stylesheet
├── common.js                   # Shared client-side utilities
├── assets/
│   └── images/                 # Shared image assets (cycle arrows, header)
├── Vertrag/
│   ├── projektvertrag.html     # Smart contract PDF form
│   ├── projektvertrag.css      # Contract form styles
│   ├── projektvertrag.js       # PDF text overlay engine (488 lines)
│   └── Projektvertrag Standard 5-7.pdf  # PDF template (do not modify)
├── logo-winterhuder-reformschule-data.jpg
├── buddel.png / buddeln.png    # Large image assets
├── backround.png               # Background image
├── IMG_0052.png
├── Projektarbeit an der WIR.png
├── README.md                   # Minimal title-only readme
└── CLAUDE.md                   # This file
```

---

## Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Markup | HTML5 | `lang="de"`, UTF-8, semantic elements |
| Styling | Custom CSS + Bulma v0.9.4 (CDN) | Some pages use Bulma; others use pure CSS |
| Scripting | Vanilla JavaScript (ES6+) | No frameworks, no bundler |
| PDF generation | PDF-Lib v1.17.1 (CDN) | Used in Vertrag/ pages |
| Fonts | Google Fonts — Comic Neue | Loaded via CDN |
| Build system | None | Direct file editing only |
| Testing | None | No test runner configured |
| Backend | None | 100% client-side |

---

## Development Workflow

### Running Locally

Serve files with any static HTTP server:

```bash
# Python (built-in)
python3 -m http.server 8080

# Node.js (if installed globally)
npx http-server . -p 8080
```

Then open `http://localhost:8080` in a browser.

### Git Workflow

```bash
# Check current branch
git branch --show-current

# Stage and commit
git add <files>
git commit -m "descriptive message"

# Push to remote
git push -u origin <branch-name>
```

- **Main branch**: `master`
- **Active development branch**: `claude/add-claude-documentation-dTWbn`
- Remote is proxied locally: `http://local_proxy@127.0.0.1:44499/git/louinfluence/Projekt_5-7_Rot`

### Making Changes

Since there is no build step:
1. Edit HTML/CSS/JS files directly
2. Refresh browser to see changes
3. Commit and push

---

## Code Conventions

### JavaScript

- **Module pattern**: IIFE (`(() => { ... })()`) for page-specific scripts to avoid global scope pollution
- **Helper aliases**: `$` for `getElementById`, `on` for `addEventListener`
- **Indentation**: 2 spaces
- **State persistence**: `localStorage` is used for multi-step wizards (e.g., idea list in `idee.html`)
- **Comments**: Section dividers use `/* ====...==== */` headers before logical blocks
- **No external runtime dependencies** — all libraries loaded from CDN; no npm

Example pattern used throughout:
```js
const $ = id => document.getElementById(id);
const on = (el, ev, fn) => el.addEventListener(ev, fn);

(() => {
  function init() { /* ... */ }
  document.addEventListener('DOMContentLoaded', init);
})();
```

### HTML

- Language: German (`lang="de"`) — all user-facing text is in German
- Encoding: `<meta charset="UTF-8">` on every page
- Viewport: `<meta name="viewport" content="width=device-width, initial-scale=1">` on every page
- Emoji are used intentionally in headings and labels (👋, 💡, 🌱, etc.) — this is by design
- Forms use native HTML elements; no form library

### CSS

- **Variables**: CSS custom properties in `:root` (e.g., `--ok`, `--accent`) in `projekt.css`
- **Layout**: CSS Grid with `minmax()` for responsive card layouts; Flexbox for alignment
- **Naming**: German-language class/ID names (e.g., `forscherfrage`, `themenfeld`, `projektvertrag`)
- **Animations**: Subtle CSS transitions for hover states and step visibility
- **Mobile-first**: Media queries adjust layouts for smaller screens

### PDF Generation (`Vertrag/projektvertrag.js`)

- Uses **PDF-Lib** to overlay text onto a pre-existing PDF template
- Text positions are hardcoded as coordinate constants (e.g., `P1`, `P2` objects with `x`, `y`, `size`)
- If the PDF template changes, coordinates must be manually recalibrated
- The PDF template (`Projektvertrag Standard 5-7.pdf`) should never be modified without updating all coordinate mappings

---

## Key Files to Understand

| File | Why It Matters |
|------|---------------|
| `idee.html` | Most complex page; contains multi-phase wizard logic, timers, localStorage state |
| `Vertrag/projektvertrag.js` | Most complex JS file; 488-line PDF layout engine with precise coordinate math |
| `projekt.css` | Shared styles; understand CSS variables and step visibility before editing any page |
| `common.js` | Shared JS utilities; check here before duplicating helper logic |
| `index.html` | Navigation hub; adding a new page requires updating this file |

---

## Adding a New Page

1. Copy an existing page (e.g., `forscherfrage.html`) as a starting point
2. Link the shared stylesheet: `<link rel="stylesheet" href="projekt.css">`
3. Include `common.js`: `<script src="common.js"></script>`
4. Add a navigation card in `index.html` matching the existing card grid pattern
5. Use German for all user-facing text
6. No build step required — the file is immediately accessible

---

## Important Constraints

- **No package manager** — do not add `npm`, `yarn`, or any bundler without explicit discussion
- **No frameworks** — do not introduce React, Vue, Angular, or similar without explicit discussion
- **German language** — all UI text must be in German; variable names and IDs also use German words
- **No backend** — all logic must run client-side; do not add server-side code
- **PDF template is fixed** — `Projektvertrag Standard 5-7.pdf` is a finalized school document; do not alter it
- **CDN-only external libraries** — external JS/CSS libraries are loaded from CDN, not installed locally

---

## Known Stubs / Work in Progress

- `produkt.html` — minimal stub, not yet implemented
- `buddeln.html` — alternative documentation tool, incomplete
- `grundstruktur` — HTML file without extension; older PDF generator prototype
- `vertrag.html` — older contract tool superseded by `Vertrag/projektvertrag.html`

---

## Accessibility & Localization

- Target audience: German-speaking school students aged 10–13
- Language is deliberately simple and encouraging (informal "du" address)
- Emoji and visual icons are used to aid navigation for younger users
- No internationalization (i18n) layer — the project is German-only by design
