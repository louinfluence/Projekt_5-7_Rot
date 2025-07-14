document.addEventListener("DOMContentLoaded", () => {
  // === 1. Forscherfragen-Formular ===
  const form = document.getElementById("challengeForm");
  if (form) {
    form.addEventListener("submit", event => {
      event.preventDefault();
      const challenge = document.getElementById("challenge").value.trim();
      if (!challenge) return;      // Schutz: nichts tun, wenn leer
      localStorage.setItem("challenge", challenge);
      // data-target auslesen
      const target = form.dataset.target;
      if (target) {
        window.location.href = target; 
      }
    });
  }

  // === 2. Prompt einfügen (1-result-Seite) ===
  const resultEl = document.getElementById("resultText");
  if (resultEl) {
    const stored = localStorage.getItem ("challenge") || "[kein Thema eingegeben]";
    const promptText = `Wir spielen ein Spiel als Gruppe, um gemeinsam interessante Forscherfragen zum Thema „${stored}“ zu entwickeln. Eine Person der Gruppe würfelt und sucht sich den passenden Aspekt aus unserer vorbereiteten Liste aus, der der gewürfelten Zahl entspricht. Sie nennt diesen Aspekt laut der Gruppe und teilt ihn auch dir, der KI, mit. (falls nicht 6 stichtworte gegeben wurden aber mindestens 1, dann erfinde stichtworte die zum thema passen dazu, um auf 6 stichworte zukommen.)
Deine Aufgabe als KI ist es, daraufhin eine verständlich formulierte, aber tiefgehende Forscherfrage zu stellen, die sowohl zum Thema als auch zum gewählten Aspekt passt. Diese Frage darf nicht mit einem einzigen Satz oder einer Zahl beantwortet werden. Sie soll zum Nachdenken anregen, Gespräche ermöglichen und möglichst persönliches Interesse wecken. Achte bei der Formulierung darauf, geeignete Fragestarter wie „Warum“, „Wie“, „Inwieweit“, „Was passiert, wenn“, „Welche Unterschiede“ oder „Im Vergleich zu“ zu verwenden.
Die Schülerin oder der Schüler wird anschließend aufgefordert, über die Frage nachzudenken und ihre oder seine Überlegungen mit der Gruppe zu teilen. Darüber hinaus wird sie oder er ermutigt, weitere eigene Forscherfragen zum Aspekt oder zum Thema zu entwickeln. Die Gruppe kann dabei miteinander ins Gespräch kommen und gemeinsam überlegen, welche Fragen besonders spannend sind und weiterverfolgt werden sollen.`;
    resultEl.textContent = promptText;
  }

  // === 3. Copy-&-Go Buttons ===
  const statusEl = document.getElementById("copyStatus");
  function handleCopy(url) {
    const text = resultEl?.textContent || "";
    navigator.clipboard.writeText(text)
      .then(() => {
        if (statusEl) statusEl.textContent = "✅ Prompt kopiert!";
        window.open(url, "_blank");
      })
      .catch(() => alert("Fehler beim Kopieren. Bitte manuell kopieren."));
  }
  document.getElementById("copyAndGoBtn")?.addEventListener("click", () => handleCopy("https://chat.openai.com"));
  document.getElementById("copyAndGoFobizzBtn")?.addEventListener("click", () => handleCopy("https://go.fobizz.com/?token=d75b049a1c4ff664"));



 // === Fobizz-Kalender mit Auto-Login & Fallback ===
  const fobizzLoginFrame = document.getElementById("fobizzLoginFrame");
  const fobizzContainer = document.getElementById("fobizzContainer");
  const introText = document.getElementById("introText");
  const fallbackHint = document.getElementById("fallbackHint");
  const fallbackBtn = document.getElementById("fallbackBtn");

  if (fobizzLoginFrame && fobizzContainer) {
    fobizzLoginFrame.src = "https://go.fobizz.com/?token=d75b049a1c4ff664";

    setTimeout(() => {
      fobizzContainer.classList.remove("hidden");
      if (introText) introText.style.display = "none";
    }, 1500);

    setTimeout
    }
});

		// Idee.JS

let currentStep = 1;
let timerInterval;
let timeLeft = 300;
let ideas = [];
let selectedIdeas = [];
let themenfeld = '';

const boosters = [
  "💭 Was würde Lisa Simpson jetzt machen?",
  "💰 Stell dir vor, du hättest unendlich viel Geld – was dann?",
  "🌍 Was wäre anders, wenn du das Projekt in Afrika oder Japan machst?",
  "🤖 Wie könnte dir ein Roboter helfen?",
  "👶 Was würde ein Kindergartenkind vorschlagen?",
  "🎮 Wie könntest du daraus ein Spiel machen?",
  "📱 Welches digitale Gerät könnte dir helfen?",
  "🌱 Wie könntest du die Umwelt dabei schützen?",
  "⚡ Wie verrückt darf deine Idee sein?",
  "🔮 Wie sieht deine Idee in 10 Jahren aus?"
];

function showStep(step) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById(`step${step}`).classList.add('active');
  currentStep = step;
}

function updateStartButton() {
  const input = document.getElementById('themenfeld');
  document.getElementById('start-btn').disabled = !input.value.trim();
}

function startIdeensammlung() {
  const input = document.getElementById('themenfeld');
  themenfeld = input.value.trim();
  if (!themenfeld) return;
  document.getElementById('themenfeld-display').textContent = themenfeld;
  showStep(2);
  startTimer();
}

function startTimer() {
  const timerEl = document.getElementById('timer');
  timerInterval = setInterval(() => {
    timeLeft--;
    const min = Math.floor(timeLeft / 60);
    const sec = String(timeLeft % 60).padStart(2, '0');
    timerEl.textContent = `⏰ Zeit: ${min}:${sec}`;
    if (timeLeft <= 60) timerEl.classList.add('warning');
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      finishIdeensammlung();
    }
  }, 1000);
}

function addIdee() {
  const input = document.getElementById('neue-idee');
  const val = input.value.trim();
  if (!val) return;
  ideas.push(val);
  input.value = '';
  updateIdeasDisplay();
}

function updateIdeasDisplay() {
  const list = document.getElementById('ideas-container');
  list.innerHTML = ideas.map((i, idx) => `<div class="idea-item">${idx + 1}. ${i}</div>`).join('');
  document.getElementById('ideas-display').style.display = 'block';
}

function getCreativityBooster() {
  const el = document.getElementById('creativity-booster');
  el.textContent = boosters[Math.floor(Math.random() * boosters.length)];
  el.classList.add('show');
}

function finishIdeensammlung() {
  showStep(3);
  document.getElementById('themenfeld-final').textContent = themenfeld;
  document.getElementById('total-ideas').textContent = ideas.length;
  const list = document.getElementById('final-ideas-list');
  list.innerHTML = ideas.map((i, idx) =>
    `<div class="idea-item" onclick="toggleIdea(${idx})" data-index="${idx}">
      <input type="checkbox" style="margin-right: 10px;">${i}</div>`
  ).join('');
}

function toggleIdea(index) {
  const item = document.querySelector(`[data-index="${index}"]`);
  const checkbox = item.querySelector('input[type="checkbox"]');
  if (selectedIdeas.includes(index)) {
    selectedIdeas = selectedIdeas.filter(i => i !== index);
    item.classList.remove('selected');
    checkbox.checked = false;
  } else if (selectedIdeas.length < 3) {
    selectedIdeas.push(index);
    item.classList.add('selected');
    checkbox.checked = true;
  } else {
    alert('Du kannst maximal 3 Ideen auswählen!');
  }
  document.getElementById('generate-btn').style.display = selectedIdeas.length > 0 ? 'inline-flex' : 'none';
}

function generatePrompt() {
  const selectedText = selectedIdeas.map(i => ideas[i]).join('\n- ');
  const prompt = `Hey! Schön, dass du da bist! 

Ich mache gerade ein spannendes Projekt mit Kindern zwischen 9 und 12 Jahren – vielleicht so alt wie du – und brauche deine Unterstützung beim Nachdenken.

Es geht darum, wie wir unsere Welt ein kleines Stück besser machen können. Du hast bestimmt schon von wichtigen Themen wie Umweltschutz, Gerechtigkeit oder guter Bildung für alle gehört – das sind Teile der 17 Ziele für eine nachhaltige Entwicklung (auch SDGs genannt).

Mein Thema ist: ${themenfeld} 

Dazu habe ich mir schon ein paar Ideen überlegt, die ich richtig spannend finde:
- ${selectedText}

Welche dieser Ideen eignet sich am besten, um mit Kindern gemeinsam etwas zu bewegen? Ich suche eine Idee, die nicht nur spannend ist, sondern auch zeigt, wie man mit kleinen Schritten etwas Großes verändern kann – am besten mit digitalen Werkzeugen und ganz viel Kreativität!

Was denkst du – welche der drei Ideen klingt für dich am interessantesten? Und warum?`;
  document.getElementById('generated-prompt').textContent = prompt;
  document.getElementById('prompt-section').style.display = 'block';
}

function copyPrompt() {
  const prompt = document.getElementById('generated-prompt').textContent;
  navigator.clipboard.writeText(prompt).then(() => {
    alert('Prompt kopiert!');
  });
}

function restart() {
  ideas = [];
  selectedIdeas = [];
  themenfeld = '';
  timeLeft = 300;
  clearInterval(timerInterval);
  showStep(1);
  document.getElementById('themenfeld').value = '';
  document.getElementById('neue-idee').value = '';
  document.getElementById('creativity-booster').classList.remove('show');
  document.getElementById('ideas-display').style.display = 'none';
  document.getElementById('timer').classList.remove('warning');
}

function forceFinishTimer() {
  clearInterval(timerInterval);
  timeLeft = 0;
  finishIdeensammlung();
}

// Event Binding
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('themenfeld').addEventListener('input', updateStartButton);
  document.getElementById('themenfeld').addEventListener('keypress', e => {
    if (e.key === 'Enter' && !document.getElementById('start-btn').disabled) {
      e.preventDefault();
      startIdeensammlung();
    }
  });
  document.getElementById('start-btn').addEventListener('click', startIdeensammlung);
  document.getElementById('neue-idee').addEventListener('keypress', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addIdee();
    }
  });
  document.getElementById('add-idee-btn').addEventListener('click', addIdee);
  document.getElementById('booster-btn').addEventListener('click', getCreativityBooster);
  document.getElementById('finish-btn').addEventListener('click', forceFinishTimer);
  document.getElementById('generate-btn').addEventListener('click', generatePrompt);
  document.getElementById('copy-btn').addEventListener('click', copyPrompt);
  document.getElementById('restart-btn').addEventListener('click', restart);
});
