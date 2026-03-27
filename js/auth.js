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
document.getElementById('registrationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const socName = document.getElementById('regSocietyName').value;

    // 1. Tenta la registrazione nell'Auth
    const { data: authData, error: authError } = await sb.auth.signUp({
        email, 
        password, 
        options: { data: { society_name: socName } }
    });

    // Se l'auth fallisce (es. email già in uso o password debole)
    if (authError) {
        alert("Errore registrazione: " + authError.message);
        return; // BLOCCA TUTTO QUI
    }

    if (authData.user) {
        // 2. Tenta l'inserimento nel database
        const { error: dbError } = await sb.from('societa').insert([
            {                
                nome: socName, 
                email: email,
                user_id: authData.user.id 
            }
        ]);

        // GESTIONE DUPLICATI E ERRORI DB
        if (dbError) {
            console.error("Errore database:", dbError);
            
            // Se l'errore è un duplicato (codice 23505 in PostgreSQL)
            if (dbError.code === '23505') {
                alert("Attenzione: Questa società è già registrata nel sistema.");
            } else {
                alert("Errore durante il salvataggio dei dati: " + dbError.message);
            }
            return; // BLOCCA QUI, non mostrare il successo
        }

        // SOLO SE ARRIVIAMO QUI mostriamo il successo
        alert("✅ Registrazione effettuata con successo!\nControlla la tua email per confermare l'account.");
        e.target.reset();
    // Reindirizzamento alla home di login
        window.location.href = 'index.html';
    }
});
