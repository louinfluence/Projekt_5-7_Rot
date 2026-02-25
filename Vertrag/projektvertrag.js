/* projektvertrag.js
   - Lädt ein PDF (Standard oder Upload)
   - Schreibt Text an feste Positionen (Overlay)
   - Speichert als neues PDF
*/

const DEFAULT_PDF_PATH = "Projektvertrag Standard 5-7.pdf";

const statusBox = document.getElementById("statusBox");
const pdfFileInput = document.getElementById("pdfFile");
const useDefaultBtn = document.getElementById("useDefaultBtn");
const exportBtn = document.getElementById("exportPdfBtn");
const formEl = document.getElementById("vertragForm");

// Dynamische Tabellen (Logbuch + Forschungsfragen)
const logbuchRowsEl = document.getElementById("logbuchRows");
const forschungsRowsEl = document.getElementById("forschungsRows");

initDynamicRows();

let selectedPdfBytes = null; // wenn User eine Datei auswählt

useDefaultBtn.addEventListener("click", async () => {
  selectedPdfBytes = null;
  setStatus("✅ Standard-PDF ausgewählt. Du kannst jetzt exportieren.");
});

pdfFileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  selectedPdfBytes = await file.arrayBuffer();
  setStatus(`✅ Eigene PDF-Datei gewählt: ${file.name}`);
});

exportBtn.addEventListener("click", async () => {
  try {
    exportBtn.disabled = true;
    exportBtn.textContent = "⏳ PDF wird erstellt…";

    const pdfBytes = selectedPdfBytes || await fetchPdf(DEFAULT_PDF_PATH);
    const outBytes = await fillPdf(pdfBytes, getFormData());

    const groupName = (getValue("projektteam") || getValue("projekt") || "Projekt")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^\w\-ÄÖÜäöüß]/g, "");

    const suffix = (getValue("dateiZusatz") || "").trim().replace(/\s+/g, "_");
    const fileName = `Projektvertrag_${groupName}${suffix ? "_" + suffix : ""}.pdf`;

    downloadBytes(outBytes, fileName);
    setStatus("✅ Fertig! Das PDF wurde heruntergeladen.");
  } catch (err) {
    console.error(err);
    setStatus("❌ Fehler beim Erstellen des PDFs. Schau in die Konsole (F12).", true);
    alert("Beim Erstellen des PDFs ist etwas schiefgelaufen. (Details in der Konsole)");
  } finally {
    exportBtn.disabled = false;
    exportBtn.textContent = "📥 PDF erstellen";
  }
});

/* -------------------------
   PDF-Overlay Positionen
   Einheit: PDF-Punkte (pt)
   Origin: unten links
   Seite A4: 595 x 842
--------------------------*/

// Seite 1 (Index 0)
const POS = {
  p1: {
    projekt:        { x: 140, y: 760, maxWidth: 410, size: 12 },
    lerngruppe:     { x: 140, y: 704, maxWidth: 290, size: 11 },
    datum:          { x: 455, y: 704, maxWidth: 120, size: 11 },
    projektteam:    { x: 140, y: 684, maxWidth: 290, size: 10, lineHeight: 12 },
    lehrer:         { x: 455, y: 684, maxWidth: 120, size: 10 },

    sprecher:       { x: 170, y: 635, maxWidth: 380, size: 11 },
    compliance:     { x: 190, y: 608, maxWidth: 360, size: 11 },
    zeitwaechter:   { x: 165, y: 582, maxWidth: 385, size: 11 },

    produkt:        { x: 70,  y: 495, maxWidth: 510, size: 11, lineHeight: 13 },
    beschreibung:   { x: 70,  y: 410, maxWidth: 510, size: 10, lineHeight: 13 },
    bezug:          { x: 70,  y: 250, maxWidth: 510, size: 10, lineHeight: 13 },
    praesentation:  { x: 70,  y: 175, maxWidth: 510, size: 11 }
  },

  // Seite 2: Projektlogbuch (Index 1) - 10 Zeilen
  p2: {
    startY: 760,
    rowH: 50,
    cols: {
      aufgabe: { x: 70,  w: 290, size: 10, lineHeight: 12 },
      wer:     { x: 365, w: 120, size: 10, lineHeight: 12 },
      done:    { x: 495, w: 70,  size: 10, lineHeight: 12 }
    }
  },

  // Seite 3: Forschungsfragen (Index 2) - 8 Zeilen
  p3: {
    startY: 760,
    rowH: 62,
    cols: {
      frage:   { x: 70,  w: 260, size: 10, lineHeight: 12 },
      wie:     { x: 335, w: 180, size: 10, lineHeight: 12 },
      done:    { x: 520, w: 50,  size: 10, lineHeight: 12 }
    }
  },

  // Seite 5/6/7 grob (Index 4/5/6) – Kurzantworten an sinnvollen Stellen
  // Hinweis: Diese Seiten haben viele Linien – wir setzen je Frage einen Block.
  p5: {
    gut:       { x: 70, y: 640, maxWidth: 510, size: 10, lineHeight: 13 },
    schwierig:  { x: 70, y: 520, maxWidth: 510, size: 10, lineHeight: 13 },
  },
  p6: {
    gelernt:    { x: 70, y: 640, maxWidth: 510, size: 10, lineHeight: 13 },
    anders:     { x: 70, y: 520, maxWidth: 510, size: 10, lineHeight: 13 },
  },

  // Seite 8 Notizen (Index 7)
  p8: {
    notizen:    { x: 70, y: 760, maxWidth: 510, size: 10, lineHeight: 13 }
  }
};

/* -------------------------
   PDF-Fill Logik
--------------------------*/

async function fillPdf(templateBytes, data) {
  const { PDFDocument, StandardFonts, rgb } = PDFLib;

  const pdfDoc = await PDFDocument.load(templateBytes);
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  const color = rgb(0, 0, 0);

  // Seite 1
  if (pages[0]) {
    const p = pages[0];
    drawText(p, helv, data.projekt, POS.p1.projekt, color);
    drawText(p, helv, data.lerngruppe, POS.p1.lerngruppe, color);
    drawText(p, helv, data.datum, POS.p1.datum, color);
    drawTextBox(p, helv, data.projektteam, POS.p1.projektteam, color);

    drawText(p, helv, data.lehrer, POS.p1.lehrer, color);
    drawText(p, helv, data.sprecher, POS.p1.sprecher, color);
    drawText(p, helv, data.compliance, POS.p1.compliance, color);
    drawText(p, helv, data.zeitwaechter, POS.p1.zeitwaechter, color);

    drawTextBox(p, helv, data.produkt, POS.p1.produkt, color);
    drawTextBox(p, helv, data.beschreibung, POS.p1.beschreibung, color);
    drawTextBox(p, helv, data.bezug, POS.p1.bezug, color);
    drawText(p, helv, data.praesentation, POS.p1.praesentation, color);
  }

  // Seite 2 – Logbuch
  if (pages[1]) {
    const p = pages[1];
    const startY = POS.p2.startY;

    data.logbuch.forEach((row, i) => {
      const y = startY - i * POS.p2.rowH;
      drawTextBox(p, helv, row.aufgabe, { x: POS.p2.cols.aufgabe.x, y, maxWidth: POS.p2.cols.aufgabe.w, size: POS.p2.cols.aufgabe.size, lineHeight: POS.p2.cols.aufgabe.lineHeight }, color);
      drawTextBox(p, helv, row.wer,     { x: POS.p2.cols.wer.x,     y, maxWidth: POS.p2.cols.wer.w,     size: POS.p2.cols.wer.size,     lineHeight: POS.p2.cols.wer.lineHeight }, color);
      drawTextBox(p, helv, row.done,    { x: POS.p2.cols.done.x,    y, maxWidth: POS.p2.cols.done.w,    size: POS.p2.cols.done.size,    lineHeight: POS.p2.cols.done.lineHeight }, color);
    });
  }

  // Seite 3 – Forschungsfragen
  if (pages[2]) {
    const p = pages[2];
    const startY = POS.p3.startY;

    data.forschungsfragen.forEach((row, i) => {
      const y = startY - i * POS.p3.rowH;
      drawTextBox(p, helv, row.frage, { x: POS.p3.cols.frage.x, y, maxWidth: POS.p3.cols.frage.w, size: POS.p3.cols.frage.size, lineHeight: POS.p3.cols.frage.lineHeight }, color);
      drawTextBox(p, helv, row.wie,   { x: POS.p3.cols.wie.x,   y, maxWidth: POS.p3.cols.wie.w,   size: POS.p3.cols.wie.size,   lineHeight: POS.p3.cols.wie.lineHeight }, color);
      drawTextBox(p, helv, row.done,  { x: POS.p3.cols.done.x,  y, maxWidth: POS.p3.cols.done.w,  size: POS.p3.cols.done.size,  lineHeight: POS.p3.cols.done.lineHeight }, color);
    });
  }

  // Seite 5 (Index 4) – Reflexion Teil 1
  if (pages[4]) {
    const p = pages[4];
    drawTextBox(p, helv, data.ref_gut, POS.p5.gut, color);
    drawTextBox(p, helv, data.ref_schwierig, POS.p5.schwierig, color);
  }

  // Seite 6 (Index 5) – Reflexion Teil 2
  if (pages[5]) {
    const p = pages[5];
    drawTextBox(p, helv, data.ref_gelernt, POS.p6.gelernt, color);
    drawTextBox(p, helv, data.ref_anders, POS.p6.anders, color);
  }

  // Seite 8 (Index 7) – Notizen
  if (pages[7]) {
    const p = pages[7];
    drawTextBox(p, helv, data.notizen, POS.p8.notizen, color);
  }

  return await pdfDoc.save();
}

/* -------------------------
   Helpers: Text, Wrapping, Download
--------------------------*/

function drawText(page, font, text, cfg, color) {
  const value = (text || "").toString().trim();
  if (!value) return;
  page.drawText(value, {
    x: cfg.x,
    y: cfg.y,
    size: cfg.size ?? 11,
    font,
    color
  });
}

function drawTextBox(page, font, text, cfg, color) {
  const value = (text || "").toString().trim();
  if (!value) return;

  const size = cfg.size ?? 10;
  const lineHeight = cfg.lineHeight ?? (size + 3);
  const maxWidth = cfg.maxWidth ?? 400;

  const lines = wrapText(value, font, size, maxWidth);
  lines.forEach((line, idx) => {
    page.drawText(line, {
      x: cfg.x,
      y: cfg.y - idx * lineHeight,
      size,
      font,
      color
    });
  });
}

function wrapText(text, font, size, maxWidth) {
  const words = text.replace(/\r/g, "").split(/\s+/);
  const lines = [];
  let current = "";

  for (const w of words) {
    const test = current ? current + " " + w : w;
    const width = font.widthOfTextAtSize(test, size);
    if (width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      // sehr langes Wort: hart umbrechen
      if (font.widthOfTextAtSize(w, size) > maxWidth) {
        lines.push(...breakLongWord(w, font, size, maxWidth));
        current = "";
      } else {
        current = w;
      }
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
      parts.push(buf);
      buf = ch;
    }
  }
  if (buf) parts.push(buf);
  return parts;
}

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

function setStatus(msg, isError=false) {
  statusBox.textContent = msg;
  statusBox.style.borderLeftColor = isError ? "#c23232" : "var(--ok)";
  statusBox.style.background = isError ? "#fff2f2" : "#f3fbf6";
}

function getValue(name) {
  return (new FormData(formEl).get(name) || "").toString();
}

function getFormData() {
  const fd = new FormData(formEl);

  const logbuch = [];
  for (let i = 0; i < 10; i++) {
    logbuch.push({
      aufgabe: (fd.get(`log_aufgabe_${i}`) || "").toString(),
      wer: (fd.get(`log_wer_${i}`) || "").toString(),
      done: (fd.get(`log_done_${i}`) || "").toString(),
    });
  }

  const forschungsfragen = [];
  for (let i = 0; i < 8; i++) {
    forschungsfragen.push({
      frage: (fd.get(`fq_frage_${i}`) || "").toString(),
      wie: (fd.get(`fq_wie_${i}`) || "").toString(),
      done: (fd.get(`fq_done_${i}`) || "").toString(),
    });
  }

  return {
    projekt: (fd.get("projekt") || "").toString(),
    lerngruppe: (fd.get("lerngruppe") || "").toString(),
    datum: (fd.get("datum") || "").toString(),
    lehrer: (fd.get("lehrer") || "").toString(),
    projektteam: (fd.get("projektteam") || "").toString(),
    sprecher: (fd.get("sprecher") || "").toString(),
    compliance: (fd.get("compliance") || "").toString(),
    zeitwaechter: (fd.get("zeitwaechter") || "").toString(),
    produkt: (fd.get("produkt") || "").toString(),
    beschreibung: (fd.get("beschreibung") || "").toString(),
    bezug: (fd.get("bezug") || "").toString(),
    praesentation: (fd.get("praesentation") || "").toString(),
    dateiZusatz: (fd.get("dateiZusatz") || "").toString(),

    logbuch,
    forschungsfragen,

    ref_gut: (fd.get("ref_gut") || "").toString(),
    ref_schwierig: (fd.get("ref_schwierig") || "").toString(),
    ref_gelernt: (fd.get("ref_gelernt") || "").toString(),
    ref_anders: (fd.get("ref_anders") || "").toString(),

    notizen: (fd.get("notizen") || "").toString()
  };
}

/* -------------------------
   UI: Rows erzeugen
--------------------------*/

function initDynamicRows() {
  // Logbuch: 10 Zeilen
  logbuchRowsEl.innerHTML = "";
  for (let i = 0; i < 10; i++) {
    logbuchRowsEl.appendChild(makeRow([
      inputCell(`log_aufgabe_${i}`, "Aufgabe…"),
      inputCell(`log_wer_${i}`, "Wer?"),
      inputCell(`log_done_${i}`, "ja/nein"),
    ]));
  }

  // Forschungsfragen: 8 Zeilen
  forschungsRowsEl.innerHTML = "";
  for (let i = 0; i < 8; i++) {
    forschungsRowsEl.appendChild(makeRow([
      inputCell(`fq_frage_${i}`, "Forschungsfrage…"),
      inputCell(`fq_wie_${i}`, "Wie beantworten wir das?"),
      inputCell(`fq_done_${i}`, "ja/nein"),
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