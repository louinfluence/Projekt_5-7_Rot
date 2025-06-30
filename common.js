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

    // Copy-to-clipboard Funktion
    const copyButton = document.getElementById('copyButton');
    if (copyButton) {
        copyButton.addEventListener('click', function () {
            const textToCopy = document.getElementById('resultText').innerText;
            navigator.clipboard.writeText(textToCopy).then(() => {
                alert('Prompt wurde kopiert!');
            }).catch(err => {
                console.error('Kopieren fehlgeschlagen: ', err);
            });
        });
    }
});
