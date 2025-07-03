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

const btn = document.getElementById('copyAndGoBtn');
console.log(btn); // sollte das Button-Element ausgeben, sonst null!
