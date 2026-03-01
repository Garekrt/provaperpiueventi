// Gestione Registrazione
document.getElementById('registrationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const socName = document.getElementById('regSocietyName').value;

    // Usiamo 'sb'
    const { data, error } = await sb.auth.signUp({
        email: email,
        password: password,
        options: { data: { society_name: socName } }
    });

    if (error) {
        alert("Errore registrazione: " + error.message);
    } else {
        alert("Registrazione effettuata! Controlla la tua email per confermare l'account.");
    }
});

// Gestione Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const { data, error } = await sb.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert("Errore login: " + error.message);
    } else {
        window.location.href = 'event_selector.html';
    }
});

// Funzione Logout (da usare nelle altre pagine)
async function handleLogout() {
    await sb.auth.signOut();
    window.location.href = 'index.html';
}
