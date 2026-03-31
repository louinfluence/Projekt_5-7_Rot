/* projektvertrag.js
   Füllt NUR Seite 1 der Vorlage mit pdf-lib.
   Koordinaten in PDF-Punkten (pt), Ursprung unten links.

   x-Werte sind so gewählt, dass der eingefügte Text
   RECHTS vom aufgedruckten Label steht und nicht überlappt.

   Zum Kalibrieren: DEBUG_DRAW = true setzt rote Kreuze
   an jede Textposition.
*/

/* ── Konfiguration ─────────────────────────────────── */

const DEFAULT_PDF_PATH = "Projektvertrag Standard 5-7.pdf";
const DESIGN = { w: 595, h: 842 }; // A4 in pt
const DEBUG_DRAW = false;

/* ── Koordinaten Seite 1 ───────────────────────────── */
/*
  Seite 1 – Struktur (von oben nach unten):
  ┌─────────────────────────────────────────┐
  │ Projekt: [___________________________]  │  y≈742
  ├──────────────────────┬──────────────────┤
  │ Lerngruppe: [______] │ Datum: [_______] │  y≈705
  │ Projektteam: [_____] │ Lehrer*in: [___] │  y≈688
  ├──────────────────────┴──────────────────┤
  │ Projektteamsprecher*in:   [___________] │  y≈620
  │ Compliance-Manager*in:    [___________] │  y≈595
  │ Zeitwächter*in:           [___________] │  y≈570
  ├─────────────────────────────────────────┤
  │ Projektziel (2 Linien)               y≈492/467
  │ Beschreibung (5 Linien)           y≈417..317
  │ Bezug (4 Linien)                  y≈267..192
  │ Datum der Projektpräsentation:  [_____] │  y≈145
  └─────────────────────────────────────────┘

  Gemessene Labelbreiten (Handschrift-Font der Vorlage):
  - "Projekt:"                   ≈ 100 pt  → x=145
  - "Lerngruppe:"                ≈ 155 pt  → x=200
  - "Datum:"  (rechte Spalte)    ≈  50 pt  → x=370, Spaltenanfang≈315
  - "Projektteam:"               ≈ 155 pt  → x=200
  - "Lehrer*in:" (rechte Spalte) ≈  65 pt  → x=385
  - "Projektteamsprecher*in:"    ≈ 255 pt  → x=300
  - "Compliance-Manager*in:"     ≈ 270 pt  → x=320
  - "Zeitwächter*in:"            ≈ 220 pt  → x=268
  - "Datum der Projektpräsentation" ≈ 285 pt → x=330
  - Schreiblinien (Produkt/Beschr./Bezug): kein Inline-Label → x=45
*/

const P1 = {
  // ── Kopfbereich ──────────────────────────────────
  projekt:     { x: 145, y: 742, maxWidth: 390, size: 13, minSize: 9 },

  // ── Gitter (Lerngruppe | Datum / Projektteam | Lehrer) ──
  lerngruppe:  { x: 200, y: 705, maxWidth: 105, size: 10, minSize: 8 },
  datum:       { x: 370, y: 705, maxWidth: 160, size: 10, minSize: 8 },
  projektteam: { x: 200, y: 688, maxWidth: 105, size:  9, lineHeight: 11, maxLines: 2 },
  lehrer:      { x: 385, y: 688, maxWidth: 145, size:  9, minSize: 7 },

  // ── Rollen ───────────────────────────────────────
  sprecher:    { x: 300, y: 620, maxWidth: 255, size: 10, minSize: 8 },
  compliance:  { x: 320, y: 595, maxWidth: 235, size: 10, minSize: 8 },
  zeit:        { x: 268, y: 570, maxWidth: 287, size: 10, minSize: 8 },

  // ── Schreiblinien (kein Inline-Label, volle Breite) ──
  produkt:     { x: 45, firstLineY: 492, lineGap: 25, maxLines: 2, maxWidth: 505, size: 10 },
  beschreibung:{ x: 45, firstLineY: 417, lineGap: 25, maxLines: 5, maxWidth: 505, size: 10 },
  bezug:       { x: 45, firstLineY: 267, lineGap: 25, maxLines: 4, maxWidth: 505, size: 10 },

  // ── Präsentationsdatum (nach langem Inline-Label) ──
  praes:       { x: 330, y: 145, maxWidth: 220, size: 10, minSize: 8 },
};

/* ── DOM-Referenzen ────────────────────────────────── */

const statusBox  = document.getElementById("statusBox");
const pdfInput   = document.getElementById("pdfFile");
const exportBtn  = document.getElementById("exportPdfBtn");
const formEl     = document.getElementById("vertragForm");

let customPdfBytes = null;

/* ── Events ────────────────────────────────────────── */

if (pdfInput) {
  pdfInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    customPdfBytes = await file.arrayBuffer();
    setStatus(`✅ Eigene Vorlage geladen: ${file.name}`);
  });
}

if (exportBtn) {
  exportBtn.addEventListener("click", async () => {
    if (!formEl.reportValidity()) return;
    try {
      lockBtn(true);
      const templateBytes = customPdfBytes ?? await fetchPdf(DEFAULT_PDF_PATH);
      const outBytes = await fillPage1(templateBytes, collectFormData());
      downloadPdf(outBytes, buildFilename());
      setStatus("✅ PDF heruntergeladen.");
    } catch (err) {
      console.error(err);
      setStatus("❌ Fehler: " + err.message + " – Details in der Konsole (F12).", true);
    } finally {
      lockBtn(false);
    }
  });
}

/* ── PDF befüllen ───────────────────────────────────── */

async function fillPage1(templateBytes, data) {
  if (!window.PDFLib) throw new Error("PDFLib nicht geladen – Seite neu laden.");

  const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
  const pdfDoc = await PDFDocument.load(templateBytes);
  const font   = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const black  = rgb(0, 0, 0);
  const pages  = pdfDoc.getPages();

  if (!pages[0]) throw new Error("Seite 1 nicht gefunden.");
  const page  = pages[0];
  const scale = computeScale(page);

  // Einzelzeilige Felder
  writeLine(page, font, data.projekt,      scale, P1.projekt,      black);
  writeLine(page, font, data.lerngruppe,   scale, P1.lerngruppe,   black);
  writeLine(page, font, data.datum,        scale, P1.datum,        black);
  writeLine(page, font, data.lehrer,       scale, P1.lehrer,       black);
  writeLine(page, font, data.sprecher,     scale, P1.sprecher,     black);
  writeLine(page, font, data.compliance,   scale, P1.compliance,   black);
  writeLine(page, font, data.zeit,         scale, P1.zeit,         black);
  writeLine(page, font, data.praesentation,scale, P1.praes,        black);

  // Mehrzeiliges Feld ohne Linienraster (Projektteam)
  writeBox(page, font, data.projektteam, scale, P1.projektteam, black);

  // Felder auf vorgedruckten Linien
  writeLines(page, font, data.produkt,      scale, P1.produkt,      black);
  writeLines(page, font, data.beschreibung, scale, P1.beschreibung, black);
  writeLines(page, font, data.bezug,        scale, P1.bezug,        black);

  if (DEBUG_DRAW) {
    const red = rgb(1, 0, 0);
    for (const cfg of Object.values(P1)) {
      const sx = cfg.x * scale.sx;
      const sy = (cfg.firstLineY ?? cfg.y) * scale.sy;
      page.drawLine({ start: { x: sx-5, y: sy }, end: { x: sx+5, y: sy }, thickness: 0.7, color: red });
      page.drawLine({ start: { x: sx, y: sy-5 }, end: { x: sx, y: sy+5 }, thickness: 0.7, color: red });
    }
  }

  return await pdfDoc.save();
}

/* ── Zeichenhilfen ─────────────────────────────────── */

// Einzelzeile – schrumpft Font bis Text in maxWidth passt
function writeLine(page, font, text, scale, cfg, color) {
  const val = trim(text);
  if (!val) return;

  const x  = cfg.x * scale.sx;
  const y  = cfg.y * scale.sy;
  const mw = cfg.maxWidth * scale.sx;
  let size = cfg.size * scale.sf;
  const minSize = (cfg.minSize ?? 8) * scale.sf;

  while (size > minSize && font.widthOfTextAtSize(val, size) > mw) size -= 0.5;

  page.drawText(val, { x, y, size, font, color });
}

// Mehrzeilig in Box (kein Linienraster) – z. B. Projektteam
function writeBox(page, font, text, scale, cfg, color) {
  const val = trim(text);
  if (!val) return;

  const size       = cfg.size * scale.sf;
  const lineHeight = (cfg.lineHeight ?? cfg.size + 3) * scale.sy;
  const maxWidth   = cfg.maxWidth * scale.sx;
  const maxLines   = cfg.maxLines ?? 3;

  const lines = clip(wrap(val, font, size, maxWidth), maxLines);
  lines.forEach((line, i) => {
    page.drawText(line, {
      x: cfg.x * scale.sx,
      y: cfg.y * scale.sy - i * lineHeight,
      size, font, color
    });
  });
}

// Mehrzeilig auf vorgedruckten Linien (fixer lineGap aus Vorlage)
function writeLines(page, font, text, scale, cfg, color) {
  const val = trim(text);
  if (!val) return;

  const size     = cfg.size * scale.sf;
  const maxWidth = cfg.maxWidth * scale.sx;
  const lineGap  = cfg.lineGap * scale.sy;
  const maxLines = cfg.maxLines;
  const baseY    = cfg.firstLineY * scale.sy + 3; // +3 pt über der Linie

  const lines = clip(wrap(val, font, size, maxWidth), maxLines);
  lines.forEach((line, i) => {
    page.drawText(line, { x: cfg.x * scale.sx, y: baseY - i * lineGap, size, font, color });
  });
}

/* ── Text-Utilities ────────────────────────────────── */

function wrap(text, font, size, maxWidth) {
  const words = text.replace(/\r/g, " ").split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";

  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) { cur = test; continue; }
    if (cur) lines.push(cur);
    if (font.widthOfTextAtSize(w, size) > maxWidth) {
      lines.push(...breakWord(w, font, size, maxWidth));
      cur = "";
    } else {
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function breakWord(word, font, size, maxWidth) {
  const parts = []; let buf = "";
  for (const ch of word) {
    if (font.widthOfTextAtSize(buf + ch, size) <= maxWidth) { buf += ch; }
    else { if (buf) parts.push(buf); buf = ch; }
  }
  if (buf) parts.push(buf);
  return parts;
}

function clip(lines, max) {
  if (lines.length <= max) return lines;
  const out = lines.slice(0, max);
  out[max - 1] = out[max - 1].trimEnd().replace(/[.…]+$/, "") + " …";
  return out;
}

function trim(v) { return (v ?? "").toString().trim(); }

/* ── Skalierung ────────────────────────────────────── */

function computeScale(page) {
  const { width, height } = page.getSize();
  return {
    sx: width  / DESIGN.w,
    sy: height / DESIGN.h,
    sf: Math.min(width / DESIGN.w, height / DESIGN.h),
  };
}

/* ── Formulardaten ─────────────────────────────────── */

function collectFormData() {
  const fd = new FormData(formEl);
  const g  = k => (fd.get(k) ?? "").toString();
  return {
    projekt:       g("projekt"),
    lerngruppe:    g("lerngruppe"),
    datum:         g("datum"),
    projektteam:   g("projektteam"),
    lehrer:        g("lehrer"),
    sprecher:      g("sprecher"),
    compliance:    g("compliance"),
    zeit:          g("zeitwaechter"),
    produkt:       g("produkt"),
    beschreibung:  g("beschreibung"),
    bezug:         g("bezug"),
    praesentation: g("praesentation"),
  };
}

function buildFilename() {
  const fd  = new FormData(formEl);
  const raw = (fd.get("projekt") ?? "").toString().trim() || "Projektvertrag";
  return "Projektvertrag_" + raw.replace(/\s+/g, "_").replace(/[^\w\-ÄÖÜäöüß]/g, "").slice(0, 60) + ".pdf";
}

/* ── Hilfsfunktionen ────────────────────────────────── */

async function fetchPdf(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Vorlage nicht gefunden (${path}) – HTTP ${res.status}`);
  return res.arrayBuffer();
}

function downloadPdf(bytes, filename) {
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a   = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function setStatus(msg, isError = false) {
  if (!statusBox) return;
  statusBox.textContent          = msg;
  statusBox.style.borderLeftColor = isError ? "#c23232" : "var(--ok)";
  statusBox.style.background      = isError ? "#fff2f2" : "#f3fbf6";
}

function lockBtn(locked) {
  if (!exportBtn) return;
  exportBtn.disabled    = locked;
  exportBtn.textContent = locked ? "⏳ PDF wird erstellt …" : "📥 PDF erstellen & herunterladen";
}
