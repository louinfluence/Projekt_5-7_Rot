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

     
<script>
document.addEventListener("DOMContentLoaded", () => {
  const challenge = localStorage.getItem('challenge') || '[kein Thema angegeben]';
  const promptText = `Wir spielen ein Spiel als Gruppe, um Forscherfragen zum Thema '${challenge}' zu finden.
Du forderst die erste Person der Gruppe auf zu würfeln und den passenden Aspekt zu finden…`;

  const statusEl = document.getElementById('copyStatus');
  const copyBtn = document.getElementById('copyAndGoBtn');

  copyBtn.addEventListener('click', () => {
    // 1) Unmittelbar ChatGPT in neuem Tab öffnen
    window.open("https://chat.openai.com", "_blank");

    // 2) Prompt in die Zwischenablage kopieren
    navigator.clipboard.writeText(promptText)
      .then(() => {
        if (statusEl) statusEl.textContent = "✅ Prompt kopiert!";
      })
      .catch(() => {
        alert("Fehler beim Kopieren. Bitte manuell kopieren.");
      });
  });
});
</script>
