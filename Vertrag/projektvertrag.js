/* projektvertrag.js
   - Lädt PDF (Standard oder Upload)
   - Füllt Seite 1 (Projektvertrag), Seite 2 (Logbuch), Seite 3 (Forschungsfragen)
   - Single-Line Felder: Auto-Font-Fit (schrumpft, wenn zu lang)
   - Multi-Line Felder: Wrap + maxLines + "…" wenn zu lang
   - Seitenkoordinaten: Alle Werte in PDF-Punkten (pt), Ursprung unten links
*/

/* =========================
   Konfiguration
========================= */

const DEFAULT_PDF_PATH = "Projektvertrag Standard 5-7.pdf";

// A4-Designgröße (pt)
const DESIGN = { w: 595, h: 842 };

// Globales Feintuning: Falls ALLES minimal verschoben ist → hier anpassen
const TUNE_ALL = { dx: 0, dy: 0 };

// Debug: Rote Kreuze an allen Textpositionen einzeichnen (zum Kalibrieren)
const DEBUG_DRAW = false;

// Anzahl Logbuch-Zeilen und Forschungsfragen
const LOGBUCH_ROWS   = 10;
const FORSCHUNGS_ROWS = 8;

/* =========================
   DOM
========================= */

const statusBox    = document.getElementById("statusBox");
const pdfFileInput = document.getElementById("pdfFile");
const useDefaultBtn= document.getElementById("useDefaultBtn");
const exportBtn    = document.getElementById("exportPdfBtn");
const formEl       = document.getElementById("vertragForm");

let selectedPdfBytes = null;

/* =========================
   Koordinaten – Seite 1
   y = Baseline (Text sitzt auf Linie), Ursprung unten links
========================= */

const P1 = {
  projekt:     { x: 155, y: 742, maxWidth: 405, size: 14, minSize: 10 },
  lerngruppe:  { x: 170, y: 705, maxWidth: 250, size: 11, minSize: 9 },
  datum:       { x: 460, y: 705, maxWidth: 120, size: 11, minSize: 9 },
  projektteam: { x: 170, y: 688, maxWidth: 250, size: 10, lineHeight: 12, maxLines: 2 },
  lehrer:      { x: 460, y: 688, maxWidth: 120, size: 10, minSize: 8 },
  sprecher:    { x: 255, y: 620, maxWidth: 325, size: 11, minSize: 9 },
  compliance:  { x: 285, y: 595, maxWidth: 295, size: 11, minSize: 9 },
  zeit:        { x: 235, y: 570, maxWidth: 345, size: 11, minSize: 9 },
  produkt:     { x: 110, firstLineY: 492, lineGap: 25, maxLines: 2, maxWidth: 470, size: 11 },
  beschreibung:{ x: 110, firstLineY: 417, lineGap: 25, maxLines: 5, maxWidth: 470, size: 10 },
  bezug:       { x: 110, firstLineY: 267, lineGap: 25, maxLines: 4, maxWidth: 470, size: 10 },
  praes:       { x: 110, y: 145, maxWidth: 470, size: 11, minSize: 9 }
};

/* =========================
   Koordinaten – Seite 2 (Projektlogbuch)
   10 Zeilen mit Spalten: Aufgabe | Wer? | Erledigt?
   Hinweis: Koordinaten kalibrieren falls Text nicht auf Linien sitzt.
   DEBUG_DRAW = true einschalten zum Sehen der Ankerpunkte.
========================= */

const P2 = {
  // firstRowY: y der ersten Datenzeile, rowGap: Abstand zwischen Zeilen
  logbuch: {
    aufgabe:  { x: 20,  firstRowY: 700, rowGap: 25, maxWidth: 300, size: 9 },
    wer:      { x: 350, firstRowY: 700, rowGap: 25, maxWidth: 130, size: 9 },
    erledigt: { x: 503, firstRowY: 700, rowGap: 25, maxWidth: 60,  size: 9 }
  }
};

/* =========================
   Koordinaten – Seite 3 (Forschungsfragen)
   8 Zeilen mit Spalten: Forschungsfrage | Wie beantworten wir das? | Erledigt?
========================= */

const P3 = {
  forschung: {
    frage:    { x: 20,  firstRowY: 710, rowGap: 28, maxWidth: 290, size: 9 },
    wie:      { x: 340, firstRowY: 710, rowGap: 28, maxWidth: 170, size: 9 },
    erledigt: { x: 530, firstRowY: 710, rowGap: 28, maxWidth: 50,  size: 9 }
  }
};

const LINE_BASELINE_OFFSET = 3;

/* =========================
   Tabellen-Zeilen initialisieren
========================= */

function initLogbuchRows() {
  const container = document.getElementById("logbuchRows");
  if (!container) return;

  for (let i = 1; i <= LOGBUCH_ROWS; i++) {
    const row = document.createElement("div");
    row.className = "tRow";
    row.innerHTML = `
      <div><input type="text" name="log_aufgabe_${i}" placeholder="Aufgabe …"></div>
      <div><input type="text" name="log_wer_${i}"     placeholder="Wer?"></div>
      <div class="tCell-check">
        <input type="checkbox" name="log_erledigt_${i}" title="Erledigt?">
      </div>`;
    container.appendChild(row);
  }
}

function initForschungsRows() {
  const container = document.getElementById("forschungsRows");
  if (!container) return;

  for (let i = 1; i <= FORSCHUNGS_ROWS; i++) {
    const row = document.createElement("div");
    row.className = "tRow";
    row.innerHTML = `
      <div><input type="text" name="ff_frage_${i}" placeholder="Forschungsfrage …"></div>
      <div><input type="text" name="ff_wie_${i}"   placeholder="Wie beantworten wir das?"></div>
      <div class="tCell-check">
        <input type="checkbox" name="ff_erledigt_${i}" title="Erledigt?">
      </div>`;
    container.appendChild(row);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initLogbuchRows();
  initForschungsRows();
});

/* =========================
   Events
========================= */

if (useDefaultBtn) {
  useDefaultBtn.addEventListener("click", () => {
    selectedPdfBytes = null;
    if (pdfFileInput) pdfFileInput.value = "";
    setStatus("✅ Standard-PDF ausgewählt.");
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
      const fd = new FormData(formEl);

      let pdfBytes = await fillPage1(templateBytes, getFormDataPage1(fd));
      pdfBytes = await fillPage2(pdfBytes, getLogbuchData(fd));
      pdfBytes = await fillPage3(pdfBytes, getForschungsData(fd));

      const nameForFile = dataForFilename(fd);
      downloadBytes(pdfBytes, `Projektvertrag_${sanitizeFileName(nameForFile)}.pdf`);

      setStatus("✅ PDF heruntergeladen – Seiten 1, 2 und 3 befüllt.");
    } catch (err) {
      console.error(err);
      setStatus("❌ Fehler beim Erstellen des PDFs. Details in der Konsole (F12).", true);
    } finally {
      lockExport(false);
    }
  });
}

/* =========================
   PDF Fill – Seite 1
========================= */

async function fillPage1(templateBytes, data) {
  if (!window.PDFLib) throw new Error("PDFLib nicht geladen.");
  const { PDFDocument, StandardFonts, rgb } = window.PDFLib;

  const pdfDoc = await PDFDocument.load(templateBytes);
  const font   = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const color  = rgb(0, 0, 0);
  const pages  = pdfDoc.getPages();

  if (!pages[0]) throw new Error("Seite 1 nicht gefunden.");
  const page  = pages[0];
  const scale = getScaleForPage(page);

  drawSingleLineFit(page, font, data.projekt,      scaleCfg(P1.projekt,      scale), color);
  drawSingleLineFit(page, font, data.lerngruppe,   scaleCfg(P1.lerngruppe,   scale), color);
  drawSingleLineFit(page, font, data.datum,        scaleCfg(P1.datum,        scale), color);
  drawMultilineBox (page, font, data.projektteam,  scaleCfg(P1.projektteam,  scale), color);
  drawSingleLineFit(page, font, data.lehrer,       scaleCfg(P1.lehrer,       scale), color);
  drawSingleLineFit(page, font, data.sprecher,     scaleCfg(P1.sprecher,     scale), color);
  drawSingleLineFit(page, font, data.compliance,   scaleCfg(P1.compliance,   scale), color);
  drawSingleLineFit(page, font, data.zeit,         scaleCfg(P1.zeit,         scale), color);
  drawLinedText    (page, font, data.produkt,      scaleLinedCfg(P1.produkt,      scale), color);
  drawLinedText    (page, font, data.beschreibung, scaleLinedCfg(P1.beschreibung, scale), color);
  drawLinedText    (page, font, data.bezug,        scaleLinedCfg(P1.bezug,        scale), color);
  drawSingleLineFit(page, font, data.praesentation,scaleCfg(P1.praes,        scale), color);

  if (DEBUG_DRAW) {
    Object.values(P1).forEach(cfg => {
      const c = scaleCfg(cfg, scale);
      const yy = cfg.firstLineY ? scalePt(cfg.firstLineY, scale.sy) : c.y;
      drawDebugCross(page, c.x, yy);
    });
  }

  return await pdfDoc.save();
}

/* =========================
   PDF Fill – Seite 2 (Logbuch)
========================= */

async function fillPage2(templateBytes, rows) {
  if (!window.PDFLib) throw new Error("PDFLib nicht geladen.");
  const { PDFDocument, StandardFonts, rgb } = window.PDFLib;

  const pdfDoc = await PDFDocument.load(templateBytes);
  const font   = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const color  = rgb(0, 0, 0);
  const pages  = pdfDoc.getPages();

  if (!pages[1]) return await pdfDoc.save(); // Seite 2 existiert nicht → überspringen

  const page  = pages[1];
  const scale = getScaleForPage(page);
  const cfg   = P2.logbuch;

  rows.forEach((row, idx) => {
    const dy = idx * scalePt(cfg.aufgabe.rowGap, scale.sy);

    if (row.aufgabe) {
      page.drawText(clean(row.aufgabe), {
        x:    scalePt(cfg.aufgabe.x, scale.sx),
        y:    scalePt(cfg.aufgabe.firstRowY, scale.sy) - dy,
        size: scalePt(cfg.aufgabe.size, scale.sFont),
        font, color,
        maxWidth: scalePt(cfg.aufgabe.maxWidth, scale.sx)
      });
    }
    if (row.wer) {
      page.drawText(clean(row.wer), {
        x:    scalePt(cfg.wer.x, scale.sx),
        y:    scalePt(cfg.wer.firstRowY, scale.sy) - dy,
        size: scalePt(cfg.wer.size, scale.sFont),
        font, color,
        maxWidth: scalePt(cfg.wer.maxWidth, scale.sx)
      });
    }
    if (row.erledigt) {
      page.drawText("✓", {
        x:    scalePt(cfg.erledigt.x, scale.sx),
        y:    scalePt(cfg.erledigt.firstRowY, scale.sy) - dy,
        size: scalePt(cfg.erledigt.size, scale.sFont),
        font, color
      });
    }

    if (DEBUG_DRAW) {
      drawDebugCross(page, scalePt(cfg.aufgabe.x, scale.sx), scalePt(cfg.aufgabe.firstRowY, scale.sy) - dy);
    }
  });

  return await pdfDoc.save();
}

/* =========================
   PDF Fill – Seite 3 (Forschungsfragen)
========================= */

async function fillPage3(templateBytes, rows) {
  if (!window.PDFLib) throw new Error("PDFLib nicht geladen.");
  const { PDFDocument, StandardFonts, rgb } = window.PDFLib;

  const pdfDoc = await PDFDocument.load(templateBytes);
  const font   = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const color  = rgb(0, 0, 0);
  const pages  = pdfDoc.getPages();

  if (!pages[2]) return await pdfDoc.save(); // Seite 3 existiert nicht → überspringen

  const page  = pages[2];
  const scale = getScaleForPage(page);
  const cfg   = P3.forschung;

  rows.forEach((row, idx) => {
    const dy = idx * scalePt(cfg.frage.rowGap, scale.sy);

    if (row.frage) {
      page.drawText(clean(row.frage), {
        x:    scalePt(cfg.frage.x, scale.sx),
        y:    scalePt(cfg.frage.firstRowY, scale.sy) - dy,
        size: scalePt(cfg.frage.size, scale.sFont),
        font, color,
        maxWidth: scalePt(cfg.frage.maxWidth, scale.sx)
      });
    }
    if (row.wie) {
      page.drawText(clean(row.wie), {
        x:    scalePt(cfg.wie.x, scale.sx),
        y:    scalePt(cfg.wie.firstRowY, scale.sy) - dy,
        size: scalePt(cfg.wie.size, scale.sFont),
        font, color,
        maxWidth: scalePt(cfg.wie.maxWidth, scale.sx)
      });
    }
    if (row.erledigt) {
      page.drawText("✓", {
        x:    scalePt(cfg.erledigt.x, scale.sx),
        y:    scalePt(cfg.erledigt.firstRowY, scale.sy) - dy,
        size: scalePt(cfg.erledigt.size, scale.sFont),
        font, color
      });
    }

    if (DEBUG_DRAW) {
      drawDebugCross(page, scalePt(cfg.frage.x, scale.sx), scalePt(cfg.frage.firstRowY, scale.sy) - dy);
    }
  });

  return await pdfDoc.save();
}

/* =========================
   Draw Helpers
========================= */

function drawSingleLineFit(page, font, text, cfg, color) {
  const value = clean(text);
  if (!value) return;

  const dx = (cfg.dx || 0) + TUNE_ALL.dx;
  const dy = (cfg.dy || 0) + TUNE_ALL.dy;
  const maxWidth = cfg.maxWidth ?? 400;
  let size = cfg.size ?? 11;
  const minSize = cfg.minSize ?? 8;

  while (size > minSize && font.widthOfTextAtSize(value, size) > maxWidth) {
    size -= 0.5;
  }

  page.drawText(value, { x: cfg.x + dx, y: cfg.y + dy, size, font, color });
}

function drawMultilineBox(page, font, text, cfg, color) {
  const value = clean(text);
  if (!value) return;

  const dx = (cfg.dx || 0) + TUNE_ALL.dx;
  const dy = (cfg.dy || 0) + TUNE_ALL.dy;
  const size       = cfg.size ?? 10;
  const lineHeight = cfg.lineHeight ?? (size + 3);
  const maxWidth   = cfg.maxWidth ?? 400;
  const maxLines   = cfg.maxLines ?? 3;

  let lines = wrapText(value, font, size, maxWidth);
  lines = clipLines(lines, maxLines);

  lines.forEach((line, idx) => {
    page.drawText(line, {
      x: cfg.x + dx,
      y: (cfg.y + dy) - idx * lineHeight,
      size, font, color
    });
  });
}

function drawLinedText(page, font, text, cfg, color) {
  const value = clean(text);
  if (!value) return;

  const dx = (cfg.dx || 0) + TUNE_ALL.dx;
  const dy = (cfg.dy || 0) + TUNE_ALL.dy;
  const size     = cfg.size ?? 10;
  const maxWidth = cfg.maxWidth ?? 450;
  const lineGap  = cfg.lineGap ?? 25;
  const maxLines = cfg.maxLines ?? 4;

  let lines = wrapText(value, font, size, maxWidth);
  lines = clipLines(lines, maxLines);

  const baseY = cfg.firstLineY + LINE_BASELINE_OFFSET;

  lines.forEach((line, idx) => {
    page.drawText(line, {
      x: cfg.x + dx,
      y: (baseY + dy) - idx * lineGap,
      size, font, color
    });
  });
}

function wrapText(text, font, size, maxWidth) {
  const words = text.replace(/\r/g, "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const w of words) {
    const test  = current ? current + " " + w : w;
    const width = font.widthOfTextAtSize(test, size);

    if (width <= maxWidth) {
      current = test;
      continue;
    }
    if (current) lines.push(current);

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
  clipped[maxLines - 1] = clipped[maxLines - 1].trim().replace(/[.…\s]+$/, "") + " …";
  return clipped;
}

function clean(v) {
  return (v || "").toString().trim();
}

/* =========================
   Skalierung
========================= */

function getScaleForPage(page) {
  const { width, height } = page.getSize();
  return {
    sx:    width  / DESIGN.w,
    sy:    height / DESIGN.h,
    sFont: Math.min(width / DESIGN.w, height / DESIGN.h)
  };
}

function scalePt(v, s) {
  return typeof v === "number" ? v * s : v;
}

function scaleCfg(cfg, scale) {
  return {
    ...cfg,
    x:          scalePt(cfg.x,          scale.sx),
    y:          scalePt(cfg.y,          scale.sy),
    maxWidth:   scalePt(cfg.maxWidth ?? 0,  scale.sx),
    size:       scalePt(cfg.size    ?? 11, scale.sFont),
    minSize:    scalePt(cfg.minSize ?? 8,  scale.sFont),
    lineHeight: scalePt(cfg.lineHeight ?? 0, scale.sy),
    dx:         scalePt(cfg.dx || 0,    scale.sx),
    dy:         scalePt(cfg.dy || 0,    scale.sy)
  };
}

function scaleLinedCfg(cfg, scale) {
  return {
    ...cfg,
    x:          scalePt(cfg.x,          scale.sx),
    firstLineY: scalePt(cfg.firstLineY, scale.sy),
    lineGap:    scalePt(cfg.lineGap,    scale.sy),
    maxWidth:   scalePt(cfg.maxWidth,   scale.sx),
    size:       scalePt(cfg.size,       scale.sFont),
    dx:         scalePt(cfg.dx || 0,    scale.sx),
    dy:         scalePt(cfg.dy || 0,    scale.sy)
  };
}

/* =========================
   Formdata lesen
========================= */

function getFormDataPage1(fd) {
  return {
    projekt:       (fd.get("projekt")     || "").toString(),
    lerngruppe:    (fd.get("lerngruppe")  || "").toString(),
    datum:         (fd.get("datum")       || "").toString(),
    lehrer:        (fd.get("lehrer")      || "").toString(),
    projektteam:   (fd.get("projektteam") || "").toString(),
    sprecher:      (fd.get("sprecher")    || "").toString(),
    compliance:    (fd.get("compliance")  || "").toString(),
    zeit:          (fd.get("zeitwaechter")|| "").toString(),
    produkt:       (fd.get("produkt")     || "").toString(),
    beschreibung:  (fd.get("beschreibung")|| "").toString(),
    bezug:         (fd.get("bezug")       || "").toString(),
    praesentation: (fd.get("praesentation")|| "").toString()
  };
}

function getLogbuchData(fd) {
  const rows = [];
  for (let i = 1; i <= LOGBUCH_ROWS; i++) {
    rows.push({
      aufgabe:  (fd.get(`log_aufgabe_${i}`)  || "").toString().trim(),
      wer:      (fd.get(`log_wer_${i}`)      || "").toString().trim(),
      erledigt: fd.get(`log_erledigt_${i}`) === "on"
    });
  }
  return rows;
}

function getForschungsData(fd) {
  const rows = [];
  for (let i = 1; i <= FORSCHUNGS_ROWS; i++) {
    rows.push({
      frage:    (fd.get(`ff_frage_${i}`) || "").toString().trim(),
      wie:      (fd.get(`ff_wie_${i}`)   || "").toString().trim(),
      erledigt: fd.get(`ff_erledigt_${i}`) === "on"
    });
  }
  return rows;
}

function dataForFilename(fd) {
  return (
    (fd.get("dateiZusatz")  || "").toString().trim() ||
    (fd.get("projektteam")  || "").toString().trim() ||
    (fd.get("projekt")      || "").toString().trim() ||
    "Projekt"
  );
}

/* =========================
   Fetch / Download / UI
========================= */

async function fetchPdf(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`PDF nicht gefunden: ${path} (HTTP ${res.status})`);
  return await res.arrayBuffer();
}

function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
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
  statusBox.style.background      = isError ? "#fff2f2" : "#f3fbf6";
}

function lockExport(locked) {
  if (!exportBtn) return;
  exportBtn.disabled    = locked;
  exportBtn.textContent = locked ? "⏳ PDF wird erstellt…" : "📥 PDF erstellen";
}

function sanitizeFileName(name) {
  return (name || "Projekt")
    .toString().trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w\-ÄÖÜäöüß]/g, "")
    .slice(0, 80) || "Projekt";
}

/* =========================
   Debug
========================= */

function drawDebugCross(page, x, y) {
  const { rgb } = window.PDFLib;
  const c = rgb(1, 0, 0);
  page.drawLine({ start: { x: x - 6, y }, end: { x: x + 6, y }, thickness: 0.8, color: c });
  page.drawLine({ start: { x, y: y - 6 }, end: { x, y: y + 6 }, thickness: 0.8, color: c });
}
