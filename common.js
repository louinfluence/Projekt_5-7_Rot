document.addEventListener("DOMContentLoaded", () => {
  // 1. Challenge aus dem Formular speichern
  const form = document.getElementById('challengeForm');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const challenge = document.getElementById('challenge').value;
      localStorage.setItem('challenge', challenge);
      const target = form.getAttribute('data-target');
      if (target) {
        window.location.href = target;
      }
    });
  }

  // 2. Prompt generieren und Buttons aktivieren
  const challenge = localStorage.getItem('challenge') || '[kein Thema angegeben]';
  const promptText = `Wir spielen ein Spiel als Gruppe, um Forscherfragen zum Thema '${challenge}' zu finden.
Du forderst die erste Person der Gruppe auf zu würfeln und den passenden Aspekt zu finden…`;

  const resultEl = document.getElementById('resultText');
  if (resultEl) resultEl.textContent = promptText;

  const statusEl = document.getElementById('copyStatus');

  // Universelle Kopier- und Weiterleitungsfunktion
  function handleCopyAndRedirect(url) {
  navigator.clipboard.writeText(promptText)
    .then(() => {
      if (statusEl) statusEl.textContent = "✅ Prompt kopiert!";
      // Fenster erst öffnen, wenn Kopieren erfolgreich war
      window.open(url, "_blank");
    })
    .catch(() => {
      alert("Fehler beim Kopieren. Bitte manuell kopieren.");
    });
}

  const btnChatGPT = document.getElementById('copyAndGoBtn');
  if (btnChatGPT) {
    btnChatGPT.addEventListener('click', () => {
      handleCopyAndRedirect("https://chat.openai.com");
    });
  }

  const btnFobizz = document.getElementById('copyAndGoFobizzBtn');
  if (btnFobizz) {
    btnFobizz.addEventListener('click', () => {
      handleCopyAndRedirect("https://app.fobizz.com");
    });
  }
});


document.addEventListener("DOMContentLoaded", function () {
  // Kalender-Container finden
  var calendarEl = document.getElementById("calendar");
  if (!calendarEl) return; // Abbruch, wenn kein Element existiert

  // Beispiel-Daten (später durch Formularwerte ersetzen)
  var projektTage   = 3;            // Anzahl der Projekttage
  var stundenProTag = 2;            // Stunden pro Tag
  var startDatum    = new Date();   // Start: heute

  // Events erzeugen
  var events = [];
  for (var i = 0; i < projektTage; i++) {
    var d = new Date(startDatum);
    d.setDate(d.getDate() + i);
    events.push({
      title: stundenProTag + " Std.",
      date:  d.toISOString().slice(0,10)  // Format "YYYY-MM-DD"
    });
  }

  // Kalender initialisieren
  var calendar = new FullCalendar.Calendar(calendarEl, {
    plugins:      [ FullCalendarDayGrid ],  // dayGrid-Plugin
    initialView:  "dayGridMonth",           // Monatsansicht
    locale:       "de",                     // Deutsch
    headerToolbar:{
      left:   "prev,next today",
      center: "title",
      right:  ""
    },
    events: events
  });

  // Rendern
  calendar.render();
});
