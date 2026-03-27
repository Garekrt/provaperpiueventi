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
// Gestione Registrazione in auth.js
document.getElementById('registrationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const socName = document.getElementById('regSocietyName').value;

    // 1. Creazione Utente Auth
    const { data: authData, error: authError } = await sb.auth.signUp({
        email, 
        password, 
        options: { data: { society_name: socName } }
    });

    if (authError) {
        alert("Errore Auth: " + authError.message);
        return;
    }

    if (authData.user) {
        // 2. Inserimento nella tabella 'societa' per avere un record DB
        const { error: dbError } = await sb.from('societa').insert([
            { 
               nome: socName, 
                email: email,
                user_id: authData.user.id // Usiamo lo stesso ID dell'Auth
            }
        ]);

        if (dbError) {
            console.error("Errore salvataggio società:", dbError.message);
        }

        alert("Società registrata correttamente! Controlla la mail per confermare.");
    }
});

