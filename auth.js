// Funzione Logout Universale
async function handleLogout() {
    try {
        await sb.auth.signOut();
        window.location.href = 'index.html';
    } catch (err) {
        console.error("Errore Logout:", err);
        window.location.href = 'index.html'; // Forza il ritorno anche se c'è errore
    }
}

// Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const { data, error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
        alert("Errore: " + error.message);
    } else {
        window.location.href = 'event_selector.html';
    }
});

// Registrazione
document.getElementById('registrationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const socName = document.getElementById('regSocietyName').value;

    const { data, error } = await sb.auth.signUp({
        email, password, options: { data: { society_name: socName } }
    });

    if (error) alert(error.message);
    else alert("Società registrata! Controlla la mail per confermare.");
});
