/* projektvertrag.js
   - Lädt ein PDF (Standard oder Upload)
   - Schreibt Text an feste Positionen (Overlay) mit pdf-lib
   - Speichert als neues PDF
   - Inkl. globalem Feintuning + Auto-Skalierung (falls Seite nicht exakt 595x842pt ist)
*/

/* =========================
   Konfiguration
========================= */

const DEFAULT_PDF_PATH = "Projektvertrag Standard 5-7.pdf";

// PDF-Design-Größe, auf die die Koordinaten unten optimiert sind (A4 in pt)
const DESIGN = { w: 595, h: 842 };

// Globales Feintuning (pt). Wenn alles noch leicht daneben liegt:
// z.B. dx: +2 (rechts), dy: -2 (runter)
const TUNE_ALL = { dx: 0, dy: 0 };

/* =========================
   DOM
========================= */

const statusBox = document.getElementById("statusBox");
const pdfFileInput = document.getElementById("pdfFile");
const useDefaultBtn = document.getElementById("useDefaultBtn");
const exportBtn = document.getElementById("exportPdfBtn");
const formEl = document.getElementById("vertragForm");

const logbuchRowsEl = document.getElementById("logbuchRows");
const forschungsRowsEl = document.getElementById("forschungsRows");

let selectedPdfBytes = null; // User-PDF (ArrayBuffer) oder null

/* =========================
   Positions (optimiert für deine Vorlage)
   - Einheit: PDF-Punkte (pt)
   - Ursprung: unten links
========================= */

const POS = {
  // Seite 1 (Index 0)
  p1: {
    projekt:        { x: 170, y: 744, maxWidth: 390, size: 14 },
    lerngruppe:     { x: 170, y: 707, maxWidth: 260, size: 12 },
    datum:          { x: 470, y: 707, maxWidth: 110, size: 12 },

    projektteam:    { x: 170, y: 675, maxWidth: 265, size: 10, lineHeight: 12 },
    lehrer:         { x: 470, y: 675, maxWidth: 110, size: 10 },

    sprecher:       { x: 300, y: 625, maxWidth: 260, size: 11 },
    compliance:     { x: 285, y: 600, maxWidth: 275, size: 11 },
    zeitwaechter:   { x: 240, y: 575, maxWidth: 320, size: 11 },

    produkt:        { x: 110, y: 500, maxWidth: 470, size: 11, lineHeight: 14 },
    beschreibung:   { x: 110, y: 425, maxWidth: 470, size: 10, lineHeight: 13 },
    bezug:          { x: 110, y: 250, maxWidth: 470, size: 10, lineHeight: 13 },
    praesentation:  { x: 110, y: 150, maxWidth: 470, size: 11 }
  },

  // Seite 2 (Index 1): Projektlogbuch – 10 Zeilen
  p2: {
    startY: 735,
    rowH: 48,
    cols: {
      aufgabe: { x: 110, w: 300, size: 10, lineHeight: 12 },
      wer:     { x: 420, w: 110, size: 10, lineHeight: 12 },
      done:    { x: 540, w: 45,  size: 10, lineHeight: 12 }
    }
  },

  // Seite 3 (Index 2): Forschungsfragen – 8 Zeilen
  p3: {
    startY: 735,
    rowH: 58,
    cols: {
      frage:   { x: 110, w: 250, size: 10, lineHeight: 12 },
      wie:     { x: 370, w: 175, size: 10, lineHeight: 12 },
      done:    { x: 550, w: 35,  size: 10, lineHeight: 12 }
    }
  },

  // Seite 5 (Index 4)
  p5: {
    gut:       { x: 110, y: 640, maxWidth: 470, size: 10, lineHeight: 13 },
    schwierig:  { x: 110, y: 520, maxWidth: 470, size: 10, lineHeight: 13 }
  },

  // Seite 6 (Index 5)
  p6: {
    gelernt:    { x: 110, y: 640, maxWidth: 470, size: 10, lineHeight: 13 },
    anders:     { x: 110, y: 520, maxWidth: 470, size: 10, lineHeight: 13 }
  },

  // Seite 8 (Index 7)
  p8: {
    notizen:    { x: 110, y: 760, maxWidth: 470, size: 10, lineHeight: 13 }
  }
};

/* =========================
   Init
========================= */

if (logbuchRowsEl && forschungsRowsEl) initDynamicRows();

if (useDefaultBtn) {
  useDefaultBtn.addEventListener("click", () => {
    selectedPdfBytes = null;
    if (pdfFileInput) pdfFileInput.value = "";
    setStatus("✅ Standard-PDF ausgewählt. Du kannst jetzt exportieren.");
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

      // HTML5-Validierung
      if (!formEl.reportValidity()) return;

      lockExport(true);

      const templateBytes = selectedPdfBytes || await fetchPdf(DEFAULT_PDF_PATH);
      const outBytes = await fillPdf(templateBytes, getFormData());

      const groupNameRaw =
        getValue("dateiZusatz") ||
        getValue("projektteam") ||
        getValue("projekt") ||
        "Projekt";

      const fileName = `Projektvertrag_${sanitizeFileName(groupNameRaw)}.pdf`;
      downloadBytes(outBytes, fileName);

      setStatus("✅ Fertig! Das PDF wurde heruntergeladen.");
    } catch (err) {
      console.error(err);
      setStatus("❌ Fehler beim Erstellen des PDFs. Schau in die Konsole (F12).", true);
      alert("Beim Erstellen des PDFs ist etwas schiefgelaufen. (Details in der Konsole)");
    } finally {
      lockExport(false);
    }
  });
}

setStatus("✅ Bereit. Fülle die Felder aus und klicke „PDF erstellen“.");

/* =========================
   PDF-Fill
========================= */

async function fillPdf(templateBytes, data) {
  if (!window.PDFLib) throw new Error("PDFLib nicht geladen.");
  const { PDFDocument, StandardFonts, rgb } = window.PDFLib;

  const pdfDoc = await PDFDocument.load(templateBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const color = rgb(0, 0, 0);

  const pages = pdfDoc.getPages();

  // Seite 1 (Index 0)
  if (pages[0]) {
    const p = pages[0];
    const scale = getScaleForPage(p);

    drawText(p, font, data.projekt,        scaleCfg(POS.p1.projekt, scale), color);
    drawText(p, font, data.lerngruppe,     scaleCfg(POS.p1.lerngruppe, scale), color);
    drawText(p, font, data.datum,          scaleCfg(POS.p1.datum, scale), color);
    drawTextBox(p, font, data.projektteam, scaleCfg(POS.p1.projektteam, scale), color);

    drawText(p, font, data.lehrer,         scaleCfg(POS.p1.lehrer, scale), color);
    drawText(p, font, data.sprecher,       scaleCfg(POS.p1.sprecher, scale), color);
    drawText(p, font, data.compliance,     scaleCfg(POS.p1.compliance, scale), color);
    drawText(p, font, data.zeitwaechter,   scaleCfg(POS.p1.zeitwaechter, scale), color);

    drawTextBox(p, font, data.produkt,       scaleCfg(POS.p1.produkt, scale), color);
    drawTextBox(p, font, data.beschreibung,  scaleCfg(POS.p1.beschreibung, scale), color);
    drawTextBox(p, font, data.bezug,         scaleCfg(POS.p1.bezug, scale), color);
    drawText(p, font, data.praesentation,    scaleCfg(POS.p1.praesentation, scale), color);
  }

  // Seite 2 (Index 1) Logbuch
  if (pages[1]) {
    const p = pages[1];
    const scale = getScaleForPage(p);

    const startY = scaleVal(POS.p2.startY, scale.sy);
    const rowH = scaleVal(POS.p2.rowH, scale.sy);

    const colAufgabe = scaleCol(POS.p2.cols.aufgabe, scale);
    const colWer = scaleCol(POS.p2.cols.wer, scale);
    const colDone = scaleCol(POS.p2.cols.done, scale);

    data.logbuch.forEach((row, i) => {
      const y = startY - i * rowH;
      drawTextBox(p, font, row.aufgabe, { x: colAufgabe.x, y, maxWidth: colAufgabe.w, size: colAufgabe.size, lineHeight: colAufgabe.lineHeight }, color);
      drawTextBox(p, font, row.wer,     { x: colWer.x,     y, maxWidth: colWer.w,     size: colWer.size,     lineHeight: colWer.lineHeight }, color);
      drawTextBox(p, font, row.done,    { x: colDone.x,    y, maxWidth: colDone.w,    size: colDone.size,    lineHeight: colDone.lineHeight }, color);
    });
  }

  // Seite 3 (Index 2) Forschungsfragen
  if (pages[2]) {
    const p = pages[2];
    const scale = getScaleForPage(p);

    const startY = scaleVal(POS.p3.startY, scale.sy);
    const rowH = scaleVal(POS.p3.rowH, scale.sy);

    const colFrage = scaleCol(POS.p3.cols.frage, scale);
    const colWie = scaleCol(POS.p3.cols.wie, scale);
    const colDone = scaleCol(POS.p3.cols.done, scale);

    data.forschungsfragen.forEach((row, i) => {
      const y = startY - i * rowH;
      drawTextBox(p, font, row.frage, { x: colFrage.x, y, maxWidth: colFrage.w, size: colFrage.size, lineHeight: colFrage.lineHeight }, color);
      drawTextBox(p, font, row.wie,   { x: colWie.x,   y, maxWidth: colWie.w,   size: colWie.size,   lineHeight: colWie.lineHeight }, color);
      drawTextBox(p, font, row.done,  { x: colDone.x,  y, maxWidth: colDone.w,  size: colDone.size,  lineHeight: colDone.lineHeight }, color);
    });
  }

  // Seite 5 (Index 4) Reflexion 1
  if (pages[4]) {
    const p = pages[4];
    const scale = getScaleForPage(p);
    drawTextBox(p, font, data.ref_gut,      scaleCfg(POS.p5.gut, scale), color);
    drawTextBox(p, font, data.ref_schwierig,scaleCfg(POS.p5.schwierig, scale), color);
  }

  // Seite 6 (Index 5) Reflexion 2
  if (pages[5]) {
    const p = pages[5];
    const scale = getScaleForPage(p);
    drawTextBox(p, font, data.ref_gelernt,  scaleCfg(POS.p6.gelernt, scale), color);
    drawTextBox(p, font, data.ref_anders,   scaleCfg(POS.p6.anders, scale), color);
  }

  // Seite 8 (Index 7) Notizen
  if (pages[7]) {
    const p = pages[7];
    const scale = getScaleForPage(p);
    drawTextBox(p, font, data.notizen, scaleCfg(POS.p8.notizen, scale), color);
  }

  return await pdfDoc.save();
}

/* =========================
   Zeichnen + Umbruch
========================= */

function drawText(page, font, text, cfg, color) {
  const value = (text || "").toString().trim();
  if (!value) return;

  const dx = (cfg.dx || 0) + TUNE_ALL.dx;
  const dy = (cfg.dy || 0) + TUNE_ALL.dy;

  page.drawText(value, {
    x: cfg.x + dx,
    y: cfg.y + dy,
    size: cfg.size ?? 11,
    font,
    color
  });
}

function drawTextBox(page, font, text, cfg, color) {
  const value = (text || "").toString().trim();
  if (!value) return;

  const dx = (cfg.dx || 0) + TUNE_ALL.dx;
  const dy = (cfg.dy || 0) + TUNE_ALL.dy;

  const size = cfg.size ?? 10;
  const lineHeight = cfg.lineHeight ?? (size + 3);
  const maxWidth = cfg.maxWidth ?? 400;

  const lines = wrapText(value, font, size, maxWidth);

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

/* =========================
   Skalierung (robuster bei minimal anderen Seitenmaßen)
========================= */

function getScaleForPage(page) {
  const { width, height } = page.getSize();
  const sx = width / DESIGN.w;
  const sy = height / DESIGN.h;
  const sFont = Math.min(sx, sy);
  return { sx, sy, sFont };
}

function scaleVal(v, f) {
  return typeof v === "number" ? v * f : v;
}

function scaleCfg(cfg, scale) {
  return {
    ...cfg,
    x: scaleVal(cfg.x, scale.sx),
    y: scaleVal(cfg.y, scale.sy),
    maxWidth: scaleVal(cfg.maxWidth, scale.sx),
    size: scaleVal(cfg.size, scale.sFont),
    lineHeight: scaleVal(cfg.lineHeight, scale.sy),
    dx: scaleVal(cfg.dx || 0, scale.sx),
    dy: scaleVal(cfg.dy || 0, scale.sy)
  };
}

function scaleCol(col, scale) {
  return {
    x: scaleVal(col.x, scale.sx),
    w: scaleVal(col.w, scale.sx),
    size: scaleVal(col.size, scale.sFont),
    lineHeight: scaleVal(col.lineHeight, scale.sy)
  };
}

/* =========================
   Formdaten
========================= */

function getValue(name) {
  if (!formEl) return "";
  return (new FormData(formEl).get(name) || "").toString();
}

function getFormData() {
  const fd = new FormData(formEl);

  const logbuch = [];
  for (let i = 0; i < 10; i++) {
    logbuch.push({
      aufgabe: (fd.get(`log_aufgabe_${i}`) || "").toString(),
      wer:     (fd.get(`log_wer_${i}`) || "").toString(),
      done:    (fd.get(`log_done_${i}`) || "").toString()
    });
  }

  const forschungsfragen = [];
  for (let i = 0; i < 8; i++) {
    forschungsfragen.push({
      frage: (fd.get(`fq_frage_${i}`) || "").toString(),
      wie:   (fd.get(`fq_wie_${i}`) || "").toString(),
      done:  (fd.get(`fq_done_${i}`) || "").toString()
    });
  }

  return {
    projekt:        (fd.get("projekt") || "").toString(),
    lerngruppe:     (fd.get("lerngruppe") || "").toString(),
    datum:          (fd.get("datum") || "").toString(),
    lehrer:         (fd.get("lehrer") || "").toString(),
    projektteam:    (fd.get("projektteam") || "").toString(),

    sprecher:       (fd.get("sprecher") || "").toString(),
    compliance:     (fd.get("compliance") || "").toString(),
    zeitwaechter:   (fd.get("zeitwaechter") || "").toString(),

    produkt:        (fd.get("produkt") || "").toString(),
    beschreibung:   (fd.get("beschreibung") || "").toString(),
    bezug:          (fd.get("bezug") || "").toString(),
    praesentation:  (fd.get("praesentation") || "").toString(),

    logbuch,
    forschungsfragen,

    ref_gut:        (fd.get("ref_gut") || "").toString(),
    ref_schwierig:  (fd.get("ref_schwierig") || "").toString(),
    ref_gelernt:    (fd.get("ref_gelernt") || "").toString(),
    ref_anders:     (fd.get("ref_anders") || "").toString(),

    notizen:        (fd.get("notizen") || "").toString()
  };
}

/* =========================
   UI: Dynamische Zeilen
========================= */

function initDynamicRows() {
  // Logbuch: 10 Zeilen
  logbuchRowsEl.innerHTML = "";
  for (let i = 0; i < 10; i++) {
    logbuchRowsEl.appendChild(makeRow([
      inputCell(`log_aufgabe_${i}`, "Aufgabe…"),
      inputCell(`log_wer_${i}`, "Wer?"),
      inputCell(`log_done_${i}`, "ja/nein")
    ]));
  }

  // Forschungsfragen: 8 Zeilen
  forschungsRowsEl.innerHTML = "";
  for (let i = 0; i < 8; i++) {
    forschungsRowsEl.appendChild(makeRow([
      inputCell(`fq_frage_${i}`, "Forschungsfrage…"),
      inputCell(`fq_wie_${i}`, "Wie beantworten wir das?"),
      inputCell(`fq_done_${i}`, "ja/nein")
    ]));
  }
}

function makeRow(cells) {
  const row = document.createElement("div");
  row.className = "tRow";
  cells.forEach(c => row.appendChild(c));
  return row;
}

function inputCell(name, placeholder) {
  const wrap = document.createElement("div");
  const inp = document.createElement("input");
  inp.name = name;
  inp.placeholder = placeholder;
  wrap.appendChild(inp);
  return wrap;
}

/* =========================
   Helfer: Fetch/Download/Status
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