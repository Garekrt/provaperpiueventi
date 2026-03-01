// js/auth.js

// Gestione Registrazione
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const societyName = document.getElementById('regSocietyName').value;
    const messageDiv = document.getElementById('authMessage');

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { society_name: societyName } }
        });

        if (error) throw error;
        messageDiv.innerText = "Registrazione completata! Verifica la tua email.";
        messageDiv.className = "mt-3 text-center text-success fw-bold";
    } catch (err) {
        messageDiv.innerText = "Errore: " + err.message;
        messageDiv.className = "mt-3 text-center text-danger fw-bold";
    }
});

// Gestione Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const messageDiv = document.getElementById('authMessage');

    try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = 'event_selector.html';
    } catch (err) {
        messageDiv.innerText = "Errore: " + err.message;
        messageDiv.className = "mt-3 text-center text-danger fw-bold";
    }
});
