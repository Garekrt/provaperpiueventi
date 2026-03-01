// Gestione della Registrazione Nuova Società
document.getElementById('registrationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const societyName = document.getElementById('regSocietyName').value;

    try {
        // 1. Creazione utente in Supabase Auth
        const { data: authData, error: authError } = await sb.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { society_name: societyName }
            }
        });

        if (authError) throw authError;

        if (authData.user) {
            // 2. Inserimento nei metadati della tabella 'societa' (opzionale se hai una tabella dedicata)
            const { error: dbError } = await sb.from('societa').insert([
                { 
                    user_id: authData.user.id, 
                    nome: societyName, 
                    email: email 
                }
            ]);

            if (dbError) throw dbError;

            alert("Registrazione completata! Controlla la tua email per confermare l'account.");
            location.reload();
        }
    } catch (error) {
        console.error("Errore durante la registrazione:", error.message);
        alert("Impossibile creare la società: " + error.message);
    }
});
