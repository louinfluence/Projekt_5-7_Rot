/* --------------------------------------------------
 * common.js – vereinheitlichte Version 16 Jul 2025
 * -------------------------------------------------- */
(() => {
  /* ---------- Hilfsfunktionen ---------- */
  const $  = id  => document.getElementById(id);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    initForscherfragenForm();
    initForscherfragenResult();
    initFobizzLogin();
    initIdeenWizard();
  });

  /* ==================================================
   * 1. Forscherfragen-Formular (forscherfrage.html)
   * ================================================== */
  function initForscherfragenForm () {
    const form = $('challengeForm');
    if (!form) return;

    on(form, 'submit', ev => {
      ev.preventDefault();
      const value = $('challenge').value.trim();
      if (value) {
        localStorage.setItem('challenge', value);
        window.location.href = form.dataset.target || '1-result.html';
      }
    });
  }

  /* ==============================================
   * 2. Result-Seite (1-result.html)
   * ============================================== */
  function initForscherfragenResult () {
    const box = $('resultText');
    if (!box) return;

    const topic = localStorage.getItem('challenge') || '[kein Thema]';
    box.textContent = makePrompt(topic);

    const makeHandler = url => () =>
      navigator.clipboard.writeText(box.textContent)
        .then(() => {
          $('copyStatus').textContent = '✅ Prompt kopiert!';
          window.open(url, '_blank');
        });

    on($('copyAndGoBtn'),       'click', makeHandler('https://chat.openai.com'));
    on($('copyAndGoFobizzBtn'), 'click', makeHandler('https://go.fobizz.com/?token=d75b049a1c4ff664'));
  }

  const makePrompt = t =>
    `Wir spielen ein Spiel … zum Thema „${t}“ … (hier folgt dein langer Prompt).`;

  /* =======================================
   * 3. Fobizz-Login-Block (index.html etc.)
   * ======================================= */
  function initFobizzLogin () {
    const frame     = $('fobizzLoginFrame');
    const container = $('fobizzContainer');
    const intro     = $('introText');
    if (!frame || !container) return;

    frame.src = 'https://go.fobizz.com/?token=d75b049a1c4ff664';
    setTimeout(() => {
      container.classList.remove('hidden');
      if (intro) intro.style.display = 'none';
    }, 1500);
  }

  /* ===========================================================
   * 4. Ideen-Wizard  –  mit dauerhafter Speicherung
   * =========================================================== */
  function initIdeenWizard () {
    const feld = $('themenfeld');
    if (!feld) return;                // nur auf idee.html vorhanden

    /* ---------- Konstanten & State ---------- */
    const KEY = 'ideenState';
    let {
      phase = 1,        // 1:Start, 2:Brainstorm, 3:Auswahl
      thema = '',
      rest  = 300,      // Timer-Sekunden
      ideen = [],
      sel   = []        // gewählte Indizes
    } = load();

    let timerId = null;

    const boosters = [
      '💭 Was würde Lisa Simpson …',
      '💰 Unendlich Geld – was dann?',
      '🌍 Afrika vs. Japan?',
      '🤖 Roboter-Hilfe?',
      '👶 Kindergarten-Idee?',
      '🎮 Spiel daraus?',
      '📱 Digitales Tool?',
      '🌱 Umwelt schützen?',
      '⚡ Verrückte Idee?',
      '🔮 In 10 Jahren?'
    ];

    /* ---------- Helpers ---------- */
    const save = () =>
      localStorage.setItem(KEY, JSON.stringify({ phase, thema, rest, ideen, sel }));

    const step = n => {
      phase = n; save();
      document.querySelectorAll('.step')
        .forEach(s => s.classList.toggle('active', s.id === `step${n}`));
    };

    /* ---------- Initialer Render ---------- */
    if (phase > 1) {
      $('themenfeld-display').textContent = thema;
      feld.value = thema;
    }
    if (phase === 2) {
      renderIdeas();
      tick();                      // Timer weiterführen
    }
    if (phase === 3) {
      finishPhase(true);           // DOM aufbauen, nichts speichern
    }
    step(phase);

    /* ---------- Events ---------- */
    on(feld, 'input',    () => $('start-btn').disabled = !feld.value.trim());
    on(feld, 'keypress', e => {
      if (e.key === 'Enter' && feld.value.trim()) { e.preventDefault(); start(); }
    });
    on($('start-btn'),    'click', start);
    on($('add-idee-btn'), 'click', addIdea);
    on($('booster-btn'),  'click',
      () => $('creativity-booster').textContent =
        boosters[Math.random() * boosters.length | 0]);
    on($('finish-btn'),   'click', finishPhase);
    on($('generate-btn'), 'click', generatePrompt);
    on($('copy-btn'),     'click',
      () => navigator.clipboard.writeText($('generated-prompt').textContent));
    on($('restart-btn'),  'click',
      () => { localStorage.removeItem(KEY); location.reload(); });

    /* ---------- Funktionen ---------- */
    function start () {
      thema = feld.value.trim();
      $('themenfeld-display').textContent = thema;
      step(2);
      tick();
    }

    function tick () {
      $('timer').textContent =
        `⏰ Zeit: ${Math.floor(rest / 60)}:${String(rest % 60).padStart(2, '0')}`;
      if (rest === 0) return finishPhase();
      if (rest-- === 60) $('timer').classList.add('warning');
      save();
      timerId = setTimeout(tick, 1000);
    }

    function addIdea () {
      const text = $('neue-idee').value.trim();
      if (!text) return;
      ideen.push(text);
      $('neue-idee').value = '';
      renderIdeas();
      save();
    }

    function renderIdeas () {
      $('ideas-display').style.display = ideen.length ? 'block' : 'none';
      $('ideas-container').innerHTML = ideen
        .map((t, i) => `<div class="idea-item">${i + 1}. ${t}</div>`)
        .join('');
    }

    function finishPhase (onlyRender = false) {
      clearTimeout(timerId);
      step(3);
      $('themenfeld-final').textContent = thema;
      $('final-ideas-list').innerHTML = ideen
        .map((t, i) => `
          <div class="idea-item ${sel.includes(i) ? 'selected' : ''}" data-i="${i}">
            <input type="checkbox" ${sel.includes(i) ? 'checked' : ''}> ${t}
          </div>`).join('');
      document.querySelectorAll('#final-ideas-list .idea-item')
        .forEach(div => on(div, 'click', () => toggleIdea(+div.dataset.i, div)));
      if (!onlyRender) save();
    }

    function toggleIdea (i, div) {
      const idx = sel.indexOf(i);
      const cb  = div.querySelector('input');

      if (idx > -1) {
        sel.splice(idx, 1);
        div.classList.remove('selected');
        cb.checked = false;
      } else if (sel.length < 3) {
        sel.push(i);
        div.classList.add('selected');
        cb.checked = true;
      } else {
        alert('Du kannst maximal 3 Ideen auswählen!');
      }
      $('generate-btn').style.display = sel.length ? 'inline-flex' : 'none';
      save();
    }

    function generatePrompt () {
      const list = sel.map(i => ideen[i]).join('\n- ');
      $('generated-prompt').textContent =
`Hey! Mein Thema ist: ${thema}
- ${list}

Welche Idee ist am besten geeignet, um …?`;
      $('prompt-section').style.display = 'block';
      save();
    }

    function load () {
      try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
      catch { return {}; }
    }
  }
})();