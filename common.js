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
      handleCopyAndRedirect("https://go.fobizz.com/?token=9a51b4f8e95d85e3");
    });
  }
});

