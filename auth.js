// Gestione della Registrazione Nuova Società
document.getElementById('registrationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault(); // BLOCCA il refresh automatico della pagina
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if(submitBtn) submitBtn.disabled = true; // Disabilita il tasto per evitare doppi invii

    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const societyName = document.getElementById('regSocietyName').value;

    try {
        // 1. Chiamata a Supabase Auth
        const { data: authData, error: authError } = await sb.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { society_name: societyName }
            }
        });

        if (authError) throw authError;

        // 2. Se arriviamo qui, la registrazione ha avuto successo
        if (authData) {
            alert("✅ Società inserita con successo!\n\nPer favore, controlla la tua casella email (" + email + ") e clicca sul link di conferma per attivare l'account.");
            
            // Opzionale: pulisce il form invece di cambiare pagina
            e.target.reset();
            
            // Se vuoi rimandarlo al login dopo che ha letto l'alert:
            // window.location.href = 'index.html'; 
        }
    } catch (error) {
        console.error("Errore:", error.message);
        alert("❌ Errore durante la creazione: " + error.message);
    } finally {
        if(submitBtn) submitBtn.disabled = false; // Riabilita il tasto
    }
});
