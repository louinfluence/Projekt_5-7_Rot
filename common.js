document.addEventListener("DOMContentLoaded", () => {
  // === 1. Prompt-Logik ===
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
  const promptText = `Wir spielen ein Spiel als Gruppe, um gemeinsam interessante Forscherfragen zum Thema „${challenge}“ zu entwickeln. Eine Person der Gruppe würfelt und sucht sich den passenden Aspekt aus unserer vorbereiteten Liste aus, der der gewürfelten Zahl entspricht. Sie nennt diesen Aspekt laut der Gruppe und teilt ihn auch dir, der KI, mit. (falls nicht 6 stichtworte gegeben wurden aber mindestens 1, dann erfinde stichtworte die zum thema passen dazu, um auf 6 stichworte zukommen.)
Deine Aufgabe als KI ist es, daraufhin eine verständlich formulierte, aber tiefgehende Forscherfrage zu stellen, die sowohl zum Thema als auch zum gewählten Aspekt passt. Diese Frage darf nicht mit einem einzigen Satz oder einer Zahl beantwortet werden. Sie soll zum Nachdenken anregen, Gespräche ermöglichen und möglichst persönliches Interesse wecken. Achte bei der Formulierung darauf, geeignete Fragestarter wie „Warum“, „Wie“, „Inwieweit“, „Was passiert, wenn“, „Welche Unterschiede“ oder „Im Vergleich zu“ zu verwenden.
Die Schülerin oder der Schüler wird anschließend aufgefordert, über die Frage nachzudenken und ihre oder seine Überlegungen mit der Gruppe zu teilen. Darüber hinaus wird sie oder er ermutigt, weitere eigene Forscherfragen zum Aspekt oder zum Thema zu entwickeln. Die Gruppe kann dabei miteinander ins Gespräch kommen und gemeinsam überlegen, welche Fragen besonders spannend sind und weiterverfolgt werden sollen.`;

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

  // === 2. Fobizz-Kalender mit Auto-Login & Fallback ===
  const fobizzLoginFrame = document.getElementById("fobizzLoginFrame");
  const fobizzContainer = document.getElementById("fobizzContainer");
  const introText = document.getElementById("introText");
  const fallbackHint = document.getElementById("fallbackHint");
  const fallbackBtn = document.getElementById("fallbackBtn");

  if (fobizzLoginFrame && fobizzContainer) {
    fobizzLoginFrame.src = "https://go.fobizz.com/?token=c69be1b6608aeb23";

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
    fallbackBtn.addEventListener("click", () => {
      fobizzContainer.classList.remove("hidden");
      fallbackHint.classList.add("hidden");
    });
  }
});