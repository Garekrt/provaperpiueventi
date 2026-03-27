async function handleLogout() {
    await sb.auth.signOut();
    window.location.href = 'index.html';
}

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) alert("Errore Login: " + error.message);
    else window.location.href = 'event_selector.html';
});

document.getElementById('registrationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const socName = document.getElementById('regSocietyName').value;

    const { data: authData, error: authError } = await sb.auth.signUp({
        email, password, options: { data: { society_name: socName } }
    });

    if (authError) return alert("Errore: " + authError.message);

    if (authData.user) {
        const { error: dbError } = await sb.from('societa').insert([
            { id: authData.user.id, nome: socName, email: email }
        ]);
        if (dbError) console.error("Errore salvataggio società:", dbError);
        alert("Registrazione effettuata! Conferma l'email per accedere.");
        window.location.href = 'index.html';
    }
});
