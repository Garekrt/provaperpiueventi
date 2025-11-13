const { createClient } = window.supabase;
const supabaseUrl = 'https://qdlfdfswufifgjdhmcsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGZkZnN3dWZpZmdqZGhtY3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEwODI0OSwiZXhwIjoyMDc1Njg0MjQ5fQ.cPQpmwujaQWufmk6BThsW15Hk3xD1dplw9FRrZG38BQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// Funzioni di Autenticazione
async function signUp(email, password, nomeSocieta, Phone) {
    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        // Assicurati che il tuo schema 'societa' supporti il campo 'CSF' (che qui manca, ma era nel tuo schema originale)
        const { error: societaError } = await supabase.from('societa').insert([{ nome: nomeSocieta, email: email, Phone:Phone, user_id: data.user.id }]);
        if (societaError) throw societaError;

        alert('Registrazione avvenuta! Verifica la posta e convalida la tua email');
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Errore:', error.message);
        alert('Errore di registrazione: ' + error.message);
    }
}

async function signIn(email, password) {
    try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = '/index.html';
    } catch (error) {
        console.error('Errore:', error.message);
        alert('Errore di accesso: ' + error.message);
    }
}

async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Errore durante il logout:', error.message);
        alert('Errore durante il logout.');
    }
}

// Funzioni per l'index.html
async function fetchAthletes() {
    try {
        const user = await supabase.auth.getUser();
        if (!user.data?.user?.id) {
            console.error("Utente non loggato o ID non disponibile.");
            return;
        }

        // 1. Trova l'ID della società basato sull'user_id
        const { data: society, error: societyError } = await supabase
            .from('societa')
            .select('id')
            .eq('user_id', user.data.user.id)
            .single();

        if (societyError || !society) throw societyError || new Error("Società non trovata.");
        
        const societyId = society.id;

        // 2. Recupera gli atleti associati a quell'ID società
        const { data, error } = await supabase
            .from('atleti')
            .select('*')
            .eq('society_id', societyId);

        if (error) throw error;

        // Pulisci la tabella esistente e popola con i dati
        const athleteList = document.getElementById('athleteList');
        if (athleteList) {
            athleteList.innerHTML = '';
            data.forEach(athlete => addAthleteToTable(athlete)); // addAthleteToTable è in script2.js
        }
        
        // 3. Esegui le funzioni necessarie dopo il caricamento degli atleti
        await updateAllCounters(); // Contatori in script2.js
        await populateEventSelector('eventSelector'); // Popola il selettore eventi (nuovo, in script2.js)
        await showAdminSection(); // Mostra/Nasconde la sezione admin (nuovo, in script2.js)

    } catch (error) {
        console.error("Errore nel recupero degli atleti:", error.message);
        document.getElementById('societyNameDisplay').textContent = "Errore di caricamento dati.";
    }
}

// Fetch society name on page load if user is logged in
async function fetchSocietyNameOnLoad() {
    const user = await supabase.auth.getUser();
    if (user.data?.user?.id) {
        const { data: societyData, error: societyError } = await supabase
            .from('societa')
            .select('nome')
            .eq('user_id', user.data.user.id)
            .single();

        if (societyError) {
            console.error("Errore nel recupero del nome della società:", societyError.message);
        } else if (societyData) {
            document.getElementById('societyNameDisplay').textContent = societyData.nome;
            // Recupera gli atleti al caricamento se l'utente è loggato
            fetchAthletes();
        }
    }
}


//================================================================================
// ⭐️ NUOVE FUNZIONI UTILITY PER GESTIONE ADMIN E EVENTI ⭐️
//================================================================================

// ⚠️ IMPORTANTE: SOSTITUISCI CON IL TUO USER_ID REALE DI SUPABASE (auth.users.id)
const ADMIN_USER_ID = 'PLACEHOLDER_YOUR_ADMIN_UUID'; 

// Variabile per memorizzare l'ID della società collegata all'ADMIN_USER_ID
let ADMIN_SOCIETY_ID = null;

/**
 * Controlla se l'utente loggato è l'amministratore.
 * @returns {boolean} True se l'utente loggato corrisponde a ADMIN_USER_ID.
 */
async function isCurrentUserAdmin() {
    const user = await supabase.auth.getUser();
    if (!user.data?.user?.id) return false;
    return user.data.user.id === ADMIN_USER_ID;
}

/**
 * Recupera e memorizza l'ID della Società collegata all'Amministratore.
 * Necessario per impostare la societa_organizzatrice_id degli eventi.
 * @returns {string|null} L'ID della società Admin o null in caso di errore.
 */
async function getAdminSocietyId() {
    if (ADMIN_SOCIETY_ID) return ADMIN_SOCIETY_ID;
    
    const { data: societyData, error } = await supabase
        .from('societa')
        .select('id')
        .eq('user_id', ADMIN_USER_ID)
        .single();

    if (error || !societyData) {
        console.error('Errore nel recupero dell\'ID della società admin o società admin non trovata:', error?.message);
        return null;
    }
    ADMIN_SOCIETY_ID = societyData.id;
    return ADMIN_SOCIETY_ID;
}

// Inizializza l'ascoltatore per il loginForm e l'esecuzione al caricamento
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            signIn(email, password);
        });
    }

    const registrazioneForm = document.getElementById('registrazioneForm');
    if (registrazioneForm) {
        registrazioneForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nomeSocieta = document.getElementById('nomeSocieta').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const Phone = document.getElementById('Phone').value;
            signUp(email, password, nomeSocieta, Phone);
        });
    }
    
    // Esegue il fetch del nome società (che a sua volta chiama fetchAthletes)
    fetchSocietyNameOnLoad(); 
});
