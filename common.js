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

    // Button zum Kopieren und Weiterleiten
    const btn = document.getElementById('copyAndGoBtn');
    console.log(btn); // Debug: zeigt Button oder null

    const resultEl = document.getElementById('resultText');
    const challenge = localStorage.getItem('challenge');

    if (challenge && resultEl) {
        const promptText = `Wir spielen ein Spiel als Gruppe, um Forscherfragen zum Thema "${challenge}" zu finden.
Du forderst die erste Person auf zu würfeln und den gewürfelten Aspekt mit dir zu teilen. Danach gibst du eine herausfordernde Frage, die die Person zum Nachdenken anregt.
Die Antworten sollen auf Ideen, Erfahrungen und Überlegungen basieren – keine Faktenfragen. Sobald die Person fertig ist, fragst du die nächste.`;

        resultEl.textContent = promptText;

        if (btn) {
            btn.addEventListener('click', () => {
                const win = window.open('', '_blank');

                navigator.clipboard.writeText(promptText)
                    .then(() => {
                        win.location = 'https://chat.openai.com';
                    })
                    .catch(() => {
                        win.close();
                        alert("Fehler beim Kopieren. Bitte manuell versuchen.");
                    });
            });
        }
    }
});