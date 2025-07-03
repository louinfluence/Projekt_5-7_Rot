document.addEventListener("DOMContentLoaded", function () {
    // Formularverarbeitung (speichert die Eingabe in localStorage)
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

     // 2) Klick-Handler für den „Kopieren & Weiterleiten“-Button
  const copyBtn = document.getElementById('copyAndGoBtn');
  copyBtn.addEventListener('click', () => {
    // Popup sofort öffnen, Safari erlaubt das
    const win = window.open('', '_blank');

    // Prompt in die Zwischenablage kopieren
    navigator.clipboard.writeText(promptText)
      .then(() => {
        // Erfolg: Status-Text anpassen
        if (statusEl) statusEl.textContent = "✅ Prompt kopiert! Du wirst weitergeleitet…";

        // Weiterleitung durchführen
        win.location = "https://chat.openai.com";
      })
      .catch(() => {
        // Bei Fehler Fenster schließen und Meldung zeigen
        win.close();
        alert("Fehler beim Kopieren des Prompts. Bitte manuell kopieren.");
      });
  });
});

