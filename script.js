// 1. INIZIALIZZAZIONE
if (!window.supabaseClient) {
    const { createClient } = window.supabase;
    const supabaseUrl = 'https://qdlfdfswufifgjdhmcsn.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGZkZnN3dWZpZmdqZGhtY3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEwODI0OSwiZXhwIjoyMDc1Njg0MjQ5fQ.cPQpmwujaQWufmk6BThsW15Hk3xD1dplw9FRrZG38BQ';
    window.supabaseClient = createClient(supabaseUrl, supabaseKey);
}
var supabase = window.supabaseClient;

// 2. FUNZIONE DI ACCESSO (CON ERRORI ESPLICITI)
async function signIn(email, password) {
    console.log("Tentativo di accesso per:", email);
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ 
            email: email, 
            password: password 
        });

        if (error) {
            console.error("Errore Supabase Auth:", error.message);
            alert("Errore di accesso: " + error.message);
            return;
        }

        if (data.user) {
            console.log("Accesso riuscito!");
            window.location.href = 'index.html'; // Assicurati che il percorso sia corretto
        }
    } catch (err) {
        console.error("Errore imprevisto:", err);
        alert("Errore di connessione. Verifica che il progetto Supabase non sia in pausa.");
    }
}

// 3. CONTROLLO SESSIONE
window.checkAuth = async function() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        console.warn("Utente non autenticato.");
        // Reindirizza solo se non siamo già nelle pagine di login/reg
        if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('registrazione.html')) {
            window.location.href = "login.html";
        }
        return null;
    }
    return user;
};

// 4. GESTIONE EVENTI AL CARICAMENTO
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            await signIn(email, password);
        });
    }

    // Se siamo nella index, controlliamo l'identità
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        window.checkAuth().then(user => {
            if (user) {
                console.log("Utente autenticato correttamente:", user.email);
                // Qui puoi chiamare fetchSocietyNameOnLoad()
            }
        });
    }
});
