/* projektvertrag.js (Seite 1 only)
   - Lädt PDF (Standard oder Upload)
   - Füllt NUR Seite 1 (Overlay-Text in Vorlage) mit pdf-lib
   - Text sitzt auf den Linien (feste Zeilenabstände passend zur Vorlage)
   - Single-Line Felder: Auto-Font-Fit (schrumpft, wenn zu lang)
   - Multi-Line Felder: Wrap + maxLines + "…" wenn zu lang
*/

/* =========================
   Konfiguration
========================= */

const DEFAULT_PDF_PATH = "Projektvertrag Standard 5-7.pdf";

// A4-Designgröße (pt) – Koordinaten sind darauf optimiert
const DESIGN = { w: 595, h: 842 };

// Globales Feintuning (pt)
// Wenn am Ende ALLES minimal verschoben ist: z.B. dx:+2 / dy:-2
const TUNE_ALL = { dx: 0, dy: 0 };

// Debug: Marker/Boxen einzeichnen (true zum Kalibrieren)
const DEBUG_DRAW = false;

/* =========================
   DOM
========================= */

const statusBox = document.getElementById("statusBox");
const pdfFileInput = document.getElementById("pdfFile");
const useDefaultBtn = document.getElementById("useDefaultBtn");
const exportBtn = document.getElementById("exportPdfBtn");
const formEl = document.getElementById("vertragForm");

let selectedPdfBytes = null;

/* =========================
   Positions (Seite 1)
   - Einheit: PDF-Punkte (pt)
   - Ursprung: unten links
   - y ist Baseline (Text sitzt auf Linie)
========================= */

/*
  Tipp zur Vorlage:
  - Kopfbox: keine Linien -> wir setzen optisch "mittig" in den Zeilenbereich.
  - Rollen: jeweils auf die vorgedruckte Linie
  - Textblöcke: exakt Zeilenabstand ~25pt (passt zu den Linien auf der Vorlage)
*/

const P1 = {
  // Kopfbox (oben)
  projekt:     { x: 155, y: 742, maxWidth: 405, size: 14, minSize: 10 }, // single-line fit
  lerngruppe:  { x: 170, y: 705, maxWidth: 250, size: 11, minSize: 9 },
  datum:       { x: 460, y: 705, maxWidth: 120, size: 11, minSize: 9 },

  // Projektteam (im linken Bereich der Kopfbox)
  projektteam: { x: 170, y: 688, maxWidth: 250, size: 10, lineHeight: 12, maxLines: 2 },

  // Lehrer*in (rechter Bereich)
  lehrer:      { x: 460, y: 688, maxWidth: 120, size: 10, minSize: 8 },

  // Rollen – jeweils auf die Linie
  sprecher:    { x: 255, y: 620, maxWidth: 325, size: 11, minSize: 9 },
  compliance:  { x: 285, y: 595, maxWidth: 295, size: 11, minSize: 9 },
  zeit:        { x: 235, y: 570, maxWidth: 345, size: 11, minSize: 9 },

  // Projektziel – 2 Linien (y=492 & y=467)
  produkt:     { x: 110, firstLineY: 492, lineGap: 25, maxLines: 2, maxWidth: 470, size: 11 },

  // Beschreibung – 5 Linien (y=417,392,367,342,317)
  beschreibung:{ x: 110, firstLineY: 417, lineGap: 25, maxLines: 5, maxWidth: 470, size: 10 },

  // Bezug – 4 Linien (y=267,242,217,192)
  bezug:       { x: 110, firstLineY: 267, lineGap: 25, maxLines: 4, maxWidth: 470, size: 10 },

  // Datum der Projektpräsentation – 1 Linie (y=142)
  praes:       { x: 110, y: 145, maxWidth: 470, size: 11, minSize: 9 }
};

// Baseline-Offset bei Linienfeldern: Text sitzt minimal über der Linie
const LINE_BASELINE_OFFSET = 3;

/* =========================
   Events
========================= */

if (useDefaultBtn) {
  useDefaultBtn.addEventListener("click", () => {
    selectedPdfBytes = null;
    if (pdfFileInput) pdfFileInput.value = "";
    setStatus("✅ Standard-PDF ausgewählt. Seite 1 wird präzise befüllt.");
  });
}

if (pdfFileInput) {
  pdfFileInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    selectedPdfBytes = await file.arrayBuffer();
    setStatus(`✅ Eigene PDF-Datei gewählt: ${file.name}`);
  });
}

if (exportBtn) {
  exportBtn.addEventListener("click", async () => {
    try {
      if (!formEl) throw new Error("Formular nicht gefunden.");

      if (!formEl.reportValidity()) return;

      lockExport(true);

      const templateBytes = selectedPdfBytes || await fetchPdf(DEFAULT_PDF_PATH);
      const outBytes = await fillPage1(templateBytes, getFormDataPage1());

      const nameForFile = dataForFilename();
      downloadBytes(outBytes, `Projektvertrag_${sanitizeFileName(nameForFile)}.pdf`);

      setStatus("✅ Fertig! Seite 1 ist sauber formatiert und das PDF wurde heruntergeladen.");
    } catch (err) {
      console.error(err);
      setStatus("❌ Fehler beim Erstellen des PDFs. Schau in die Konsole (F12).", true);
      alert("Beim Erstellen des PDFs ist etwas schiefgelaufen. (Details in der Konsole)");
    } finally {
      lockExport(false);
    }
  });
}

setStatus("✅ Bereit. (Aktuell wird nur Seite 1 befüllt – dafür richtig sauber.)");

/* =========================
   PDF Fill (Seite 1)
========================= */

async function fillPage1(templateBytes, data) {
  if (!window.PDFLib) throw new Error("PDFLib nicht geladen.");
  const { PDFDocument, StandardFonts, rgb } = window.PDFLib;

  const pdfDoc = await PDFDocument.load(templateBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const color = rgb(0, 0, 0);

  const pages = pdfDoc.getPages();
  if (!pages[0]) throw new Error("Seite 1 nicht gefunden.");

  const page = pages[0];

  // Skalierung, falls Seite minimal andere Maße hat
  const scale = getScaleForPage(page);

  // Optional Debug: Zeige Marker
  if (DEBUG_DRAW) {
    drawDebugCross(page, scalePt(50, scale.sx), scalePt(800, scale.sy));
  }

  // --- Kopfbox ---
  drawSingleLineFit(page, font, data.projekt, scaleCfg(P1.projekt, scale), color);
  drawSingleLineFit(page, font, data.lerngruppe, scaleCfg(P1.lerngruppe, scale), color);
  drawSingleLineFit(page, font, data.datum, scaleCfg(P1.datum, scale), color);

  drawMultilineBox(page, font, data.projektteam, scaleCfg(P1.projektteam, scale), color);

  drawSingleLineFit(page, font, data.lehrer, scaleCfg(P1.lehrer, scale), color);

  // --- Rollen (auf Linie) ---
  drawSingleLineFit(page, font, data.sprecher, scaleCfg(P1.sprecher, scale), color);
  drawSingleLineFit(page, font, data.compliance, scaleCfg(P1.compliance, scale), color);
  drawSingleLineFit(page, font, data.zeit, scaleCfg(P1.zeit, scale), color);

  // --- Linienfelder (exakt Zeile für Zeile) ---
  drawLinedText(page, font, data.produkt, scaleLinedCfg(P1.produkt, scale), color);
  drawLinedText(page, font, data.beschreibung, scaleLinedCfg(P1.beschreibung, scale), color);
  drawLinedText(page, font, data.bezug, scaleLinedCfg(P1.bezug, scale), color);

  // --- Präsentationsdatum ---
  drawSingleLineFit(page, font, data.praesentation, scaleCfg(P1.praes, scale), color);

  // Debug: Felder markieren
  if (DEBUG_DRAW) {
    debugMarkField(page, scaleCfg(P1.projekt, scale));
    debugMarkField(page, scaleCfg(P1.lerngruppe, scale));
    debugMarkField(page, scaleCfg(P1.datum, scale));
    debugMarkField(page, scaleCfg(P1.projektteam, scale));
    debugMarkField(page, scaleCfg(P1.lehrer, scale));
    debugMarkField(page, scaleCfg(P1.sprecher, scale));
    debugMarkField(page, scaleCfg(P1.compliance, scale));
    debugMarkField(page, scaleCfg(P1.zeit, scale));
  }

  return await pdfDoc.save();
}

/* =========================
   Draw Helpers
========================= */

// Single-line, schrumpft bis es in maxWidth passt
function drawSingleLineFit(page, font, text, cfg, color) {
  const value = clean(text);
  if (!value) return;

  const dx = (cfg.dx || 0) + TUNE_ALL.dx;
  const dy = (cfg.dy || 0) + TUNE_ALL.dy;

  const maxWidth = cfg.maxWidth ?? 400;
  let size = cfg.size ?? 11;
  const minSize = cfg.minSize ?? 8;

  // Fit loop
  while (size > minSize && font.widthOfTextAtSize(value, size) > maxWidth) {
    size -= 0.5;
  }

  page.drawText(value, {
    x: cfg.x + dx,
    y: cfg.y + dy,
    size,
    font,
    color
  });
}

// Multiline innerhalb einer Box (kein Linienraster), mit maxLines + Ellipsis
function drawMultilineBox(page, font, text, cfg, color) {
  const value = clean(text);
  if (!value) return;

  const dx = (cfg.dx || 0) + TUNE_ALL.dx;
  const dy = (cfg.dy || 0) + TUNE_ALL.dy;

  const size = cfg.size ?? 10;
  const lineHeight = cfg.lineHeight ?? (size + 3);
  const maxWidth = cfg.maxWidth ?? 400;
  const maxLines = cfg.maxLines ?? 3;

  let lines = wrapText(value, font, size, maxWidth);
  lines = clipLines(lines, maxLines);

  lines.forEach((line, idx) => {
    page.drawText(line, {
      x: cfg.x + dx,
      y: (cfg.y + dy) - idx * lineHeight,
      size,
      font,
      color
    });
  });
}

// Multiline auf vorgedruckten Linien (fixer lineGap!)
function drawLinedText(page, font, text, cfg, color) {
  const value = clean(text);
  if (!value) return;

  const dx = (cfg.dx || 0) + TUNE_ALL.dx;
  const dy = (cfg.dy || 0) + TUNE_ALL.dy;

  const size = cfg.size ?? 10;
  const maxWidth = cfg.maxWidth ?? 450;
  const lineGap = cfg.lineGap ?? 25;
  const maxLines = cfg.maxLines ?? 4;

  let lines = wrapText(value, font, size, maxWidth);
  lines = clipLines(lines, maxLines);

  const baseY = cfg.firstLineY + LINE_BASELINE_OFFSET;

  lines.forEach((line, idx) => {
    page.drawText(line, {
      x: cfg.x + dx,
      y: (baseY + dy) - idx * lineGap,
      size,
      font,
      color
    });
  });
}

function wrapText(text, font, size, maxWidth) {
  const words = text.replace(/\r/g, "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const w of words) {
    const test = current ? current + " " + w : w;
    const width = font.widthOfTextAtSize(test, size);

    if (width <= maxWidth) {
      current = test;
      continue;
    }

    if (current) lines.push(current);

    // Wort zu lang -> hart umbrechen
    if (font.widthOfTextAtSize(w, size) > maxWidth) {
      lines.push(...breakLongWord(w, font, size, maxWidth));
      current = "";
    } else {
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function breakLongWord(word, font, size, maxWidth) {
  const parts = [];
  let buf = "";

  for (const ch of word) {
    const test = buf + ch;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      buf = test;
    } else {
      if (buf) parts.push(buf);
      buf = ch;
    }
  }
  if (buf) parts.push(buf);
  return parts;
}

function clipLines(lines, maxLines) {
  if (lines.length <= maxLines) return lines;
  const clipped = lines.slice(0, maxLines);
  // Ellipsis auf letzter Zeile (wenn Platz)
  clipped[maxLines - 1] = addEllipsis(clipped[maxLines - 1]);
  return clipped;
}

function addEllipsis(line) {
  const trimmed = line.trim();
  if (!trimmed) return trimmed;
  // schon mit Punkt? egal, wir setzen …
  return trimmed.replace(/[.…\s]+$/, "") + " …";
}

function clean(v) {
  return (v || "").toString().trim();
}

/* =========================
   Skalierung (falls PDF minimal anders ist)
========================= */

function getScaleForPage(page) {
  const { width, height } = page.getSize();
  const sx = width / DESIGN.w;
  const sy = height / DESIGN.h;
  const sFont = Math.min(sx, sy);
  return { sx, sy, sFont };
}

function scalePt(v, s) {
  return typeof v === "number" ? v * s : v;
}

function scaleCfg(cfg, scale) {
  return {
    ...cfg,
    x: scalePt(cfg.x, scale.sx),
    y: scalePt(cfg.y, scale.sy),
    maxWidth: scalePt(cfg.maxWidth ?? 0, scale.sx),
    size: scalePt(cfg.size ?? 11, scale.sFont),
    minSize: scalePt(cfg.minSize ?? 8, scale.sFont),
    lineHeight: scalePt(cfg.lineHeight ?? 0, scale.sy),
    dx: scalePt(cfg.dx || 0, scale.sx),
    dy: scalePt(cfg.dy || 0, scale.sy)
  };
}

function scaleLinedCfg(cfg, scale) {
  return {
    ...cfg,
    x: scalePt(cfg.x, scale.sx),
    firstLineY: scalePt(cfg.firstLineY, scale.sy),
    lineGap: scalePt(cfg.lineGap, scale.sy),
    maxWidth: scalePt(cfg.maxWidth, scale.sx),
    size: scalePt(cfg.size, scale.sFont),
    maxLines: cfg.maxLines,
    dx: scalePt(cfg.dx || 0, scale.sx),
    dy: scalePt(cfg.dy || 0, scale.sy)
  };
}

/* =========================
   Formdata (Seite 1)
========================= */

function getFormDataPage1() {
  const fd = new FormData(formEl);
  return {
    projekt:        (fd.get("projekt") || "").toString(),
    lerngruppe:     (fd.get("lerngruppe") || "").toString(),
    datum:          (fd.get("datum") || "").toString(),
    lehrer:         (fd.get("lehrer") || "").toString(),
    projektteam:    (fd.get("projektteam") || "").toString(),

    sprecher:       (fd.get("sprecher") || "").toString(),
    compliance:     (fd.get("compliance") || "").toString(),
    zeit:           (fd.get("zeitwaechter") || "").toString(),

    produkt:        (fd.get("produkt") || "").toString(),
    beschreibung:   (fd.get("beschreibung") || "").toString(),
    bezug:          (fd.get("bezug") || "").toString(),
    praesentation:  (fd.get("praesentation") || "").toString()
  };
}

function dataForFilename() {
  // schöner Dateiname: Zusatz > Projektteam > Projekt > fallback
  const fd = new FormData(formEl);
  return (
    (fd.get("dateiZusatz") || "").toString().trim() ||
    (fd.get("projektteam") || "").toString().trim() ||
    (fd.get("projekt") || "").toString().trim() ||
    "Projekt"
  );
}

/* =========================
   Fetch / Download / UI
========================= */

async function fetchPdf(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`PDF nicht gefunden unter: ${path}`);
  return await res.arrayBuffer();
}

function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function setStatus(msg, isError = false) {
  if (!statusBox) return;
  statusBox.textContent = msg;
  statusBox.style.borderLeftColor = isError ? "#c23232" : "var(--ok)";
  statusBox.style.background = isError ? "#fff2f2" : "#f3fbf6";
}

function lockExport(locked) {
  if (!exportBtn) return;
  exportBtn.disabled = locked;
  exportBtn.textContent = locked ? "⏳ PDF wird erstellt…" : "📥 PDF erstellen";
}

function sanitizeFileName(name) {
  return (name || "Projekt")
    .toString()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w\-ÄÖÜäöüß]/g, "")
    .slice(0, 80) || "Projekt";
}

/* =========================
   Debug (optional)
========================= */

function drawDebugCross(page, x, y) {
  const { rgb } = window.PDFLib;
  const c = rgb(1, 0, 0);
  page.drawLine({ start: { x: x - 6, y }, end: { x: x + 6, y }, thickness: 0.8, color: c });
  page.drawLine({ start: { x, y: y - 6 }, end: { x, y: y + 6 }, thickness: 0.8, color: c });
}

function debugMarkField(page, cfg) {
  if (!DEBUG_DRAW) return;
  const { rgb } = window.PDFLib;
  const c = rgb(0.2, 0.6, 1);
  // kleine Markierung am Startpunkt
  page.drawCircle({ x: cfg.x, y: cfg.y, size: 2.2, color: c, borderColor: c, borderWidth: 0.5 });
}