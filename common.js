document.addEventListener("DOMContentLoaded", () => {
  // Prompt-Funktion (für Forscherfrage-Seite)
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

  const challenge = localStorage.getItem('challenge') || '[kein Thema angegeben]';
  const promptText = `Wir spielen ein Spiel als Gruppe, um gemeinsam interessante Forscherfragen zum Thema „${challenge}“ zu entwickeln. [...]`;

  const resultEl = document.getElementById('resultText');
  if (resultEl) resultEl.textContent = promptText;

  const statusEl = document.getElementById('copyStatus');
  function handleCopyAndRedirect(url) {
    navigator.clipboard.writeText(promptText)
      .then(() => {
        if (statusEl) statusEl.textContent = "✅ Prompt kopiert!";
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

  // Automatischer Login für Kalender + Chat
  const fobizzLoginFrame1 = document.getElementById("fobizzLoginFrame1"); // für Kalender
  const fobizzLoginFrame2 = document.getElementById("fobizzLoginFrame2"); // für KI-Chat
  const fobizzContainer = document.getElementById("fobizzContainer");
  const introText = document.getElementById("introText");
  const fallbackHint = document.getElementById("fallbackHint");
  const fallbackBtn = document.getElementById("fallbackBtn");

  if (fobizzLoginFrame1 && fobizzLoginFrame2 && fobizzContainer) {
    fobizzLoginFrame1.src = "https://go.fobizz.com/?token=c69be1b6608aeb23";
    fobizzLoginFrame2.src = "https://go.fobizz.com/?token=c69be1b6608aeb23";

    setTimeout(() => {
      fobizzContainer.classList.remove("hidden");
      if (introText) introText.style.display = "none";
    }, 1500);

    setTimeout(() => {
      const iframeVisible = fobizzContainer.offsetHeight > 100;
      if (!iframeVisible && fallbackHint) {
        fallbackHint.classList.remove("hidden");
      }
    }, 3000);
  }

  if (fallbackBtn && fobizzContainer && fallbackHint) {
    fallbackBtn.addEventListener('click', () => {
      fobizzContainer.classList.remove("hidden");
      fallbackHint.classList.add("hidden");
    });
  }
});