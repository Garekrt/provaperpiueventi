// ================================================================================
// 1. INIZIALIZZAZIONE GLOBALE (MODIFICATA PER EVITARE "ALREADY DECLARED")
// ================================================================================
// Usiamo window.supabaseClient per assicurarci che l'istanza sia unica in tutto il sito
if (!window.supabaseClient) {
    const { createClient } = window.supabase;
    const supabaseUrl = 'https://qdlfdfswufifgjdhmcsn.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGZkZnN3dWZpZmdqZGhtY3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEwODI0OSwiZXhwIjoyMDc1Njg0MjQ5fQ.cPQpmwujaQWufmk6BThsW15Hk3xD1dplw9FRrZG38BQ';
    window.supabaseClient = createClient(supabaseUrl, supabaseKey);
}

// Definiamo 'supabase' come variabile globale (senza 'const' o 'let' se già esistente)
var supabase = window.supabaseClient;

const ADMIN_USER_ID = '1a02fab9-1a2f-48d7-9391-696f4fba88a1'; 
let ADMIN_SOCIETY_ID = null;

// ================================================================================
// 2. FUNZIONI DI AUTENTICAZIONE (MODIFICATE: ESPOSTE SU WINDOW)
// ================================================================================

window.checkAuth = async function() {
    try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
            window.location.href = "login.html";
            return null;
        }
        return data.user;
    } catch (e) {
        window.location.href = "login.html";
    }
};

window.signOut = async function() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Errore logout:', error.message);
    }
};

// ================================================================================
// 3. GESTIONE ADMIN E VISIBILITÀ (MODIFICATA PER ESSERE CHIAMATA AUTOMATICAMENTE)
// ================================================================================

async function showAdminSection() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === ADMIN_USER_ID) {
        // Mostra i contenitori nascosti nell'index.html
        const adminDiv = document.getElementById('adminEventCreation');
        const adminLimits = document.getElementById('adminLimitsConfig');
        if (adminDiv) adminDiv.style.display = 'block';
        if (adminLimits) adminLimits.style.display = 'block';
        console.log("Accesso Amministratore garantito");
    }
}

// ================================================================================
// 4. CARICAMENTO DATI INIZIALE
// ================================================================================

async function fetchSocietyNameOnLoad() {
    const user = await window.checkAuth(); // Verifica auth prima di tutto
    if (user) {
        const { data: societyData, error } = await supabase
            .from('societa')
            .select('nome')
            .eq('user_id', user.id)
            .single();

        if (!error && societyData) {
            const display = document.getElementById('societyNameDisplay');
            if (display) display.textContent = societyData.nome;
            
            // ATTIVAZIONE MODALITÀ ADMIN
            await showAdminSection();
            
            // CARICAMENTO ATLETI (Se presente la tabella)
            const urlParams = new URLSearchParams(window.location.search);
            const eventId = urlParams.get('event_id');
            if (document.getElementById('athleteList')) {
                fetchAthletes(eventId);
            }
        }
    }
}

// ================================================================================
// 5. RESTO DELLE FUNZIONI ORIGINALI (Senza modifiche strutturali)
// ================================================================================

async function signUp(email, password, nomeSocieta, Phone) {
    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        const { error: societaError } = await supabase.from('societa').insert([{ nome: nomeSocieta, email: email, Phone:Phone, user_id: data.user.id }]);
        if (societaError) throw societaError;
        alert('Registrazione avvenuta! Verifica la tua email.');
        window.location.href = '/login.html';
    } catch (error) {
        alert('Errore: ' + error.message);
    }
}

async function signIn(email, password) {
    try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = '/index.html';
    } catch (error) {
        alert('Accesso fallito: ' + error.message);
    }
}

// ... (Incolla qui le altre funzioni come fetchAthletes, addAthlete, etc. se le hai) ...

// ================================================================================
// 6. AVVIO APPLICAZIONE (MODIFICATO: PUNTO DI INGRESSO UNICO)
// ================================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // Gestione pulsanti login/registrazione se presenti nella pagina
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            await signIn(email, password);
        });
    }

    const registrazioneForm = document.getElementById('registrazioneForm');
    if (registrazioneForm) {
        registrazioneForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const nome = document.getElementById('nomeSocieta').value;
            const phone = document.getElementById('Phone').value;
            await signUp(email, password, nome, phone);
        });
    }

    // Se non siamo in login/registrazione, carica i dati della società e admin
    if (!loginForm && !registrazioneForm) {
        await fetchSocietyNameOnLoad();
    }
});
