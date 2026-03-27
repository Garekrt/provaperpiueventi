async function handleLogout() {
    await sb.auth.signOut();
    window.location.href = 'index.html';
}

// Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) alert("Errore Login: " + error.message);
    else window.location.href = 'event_selector.html';
});

// Registrazione
document.getElementById('registrationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const socName = document.getElementById('regSocietyName').value;

    const { data: authData, error: authError } = await sb.auth.signUp({
        email, password, options: { data: { society_name: socName } }
    });

    if (authError) return alert("Errore Registrazione: " + authError.message);

    if (authData.user) {
        // NOTA: Usiamo 'user_id' perché il tuo database lo richiede espressamente
        const { error: dbError } = await sb.from('societa').insert([
            { 
                user_id: authData.user.id, 
                nome: socName, 
                email: email 
            }
        ]);

        if (dbError) {
            console.error("Errore DB:", dbError);
            alert("Errore configurazione società: " + dbError.message);
            return;
        }

        alert("Registrazione completata! Conferma l'email per accedere.");
        window.location.href = 'index.html';
    }
});
