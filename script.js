const { createClient } = window.supabase;
const supabaseUrl = 'https://qdlfdfswufifgjdhmcsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGZkZnN3dWZpZmdqZGhtY3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEwODI0OSwiZXhwIjoyMDc1Njg0MjQ5fQ.cPQpmwujaQWufmk6BThsW15Hk3xD1dplw9FRrZG38BQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// Funzioni di Autenticazione
async function signUp(email, password, nomeSocieta, Phone) {
    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

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

//================================================================================
// ⭐️ FUNZIONE PRINCIPALE: FETCH ATLETI (AGGIORNATA PER IL FILTRO) ⭐️
//================================================================================
/**
 * Recupera gli atleti della società loggata.
 * Può filtrare per un Evento specifico se viene fornito filterEventId.
 * @param {string|null} filterEventId - ID dell'evento da usare come filtro.
 */
async function fetchAthletes(filterEventId = null) {
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
        let athletesData = [];
        let error = null;

        // ⭐️ LOGICA DI FILTRO ⭐️
        if (filterEventId) {
             // Recupera solo gli atleti iscritti all'evento X, con i dettagli dell'evento
            const { data: subscriptionData, error: subError } = await supabase
                .from('iscrizioni_eventi')
                .select(`
                    atleti (*),
                    eventi (nome)
                `)
                .eq('evento_id', filterEventId);

            if (subError) throw subError;
            
            // Mappa i dati per includere i dettagli dell'iscrizione nell'oggetto atleta
            athletesData = subscriptionData
                .filter(sub => sub.atleti.society_id === societyId)
                .map(sub => ({ 
                    ...sub.atleti, 
                    iscritti_evento_nome: sub.eventi.nome,
                    iscritti_evento_stato: 'Iscritto' // Lo stato 'Iscritto' è implicito dal filtro
                }));

        } else {
            // Nessun filtro: recupera TUTTI gli atleti della società
            const { data: allAthletes, error: fetchError } = await supabase
                .from('atleti')
                .select('*')
                .eq('society_id', societyId);
            
            athletesData = allAthletes;
            error = fetchError;
        }

        if (error) throw error;

        // Pulisci la tabella esistente e popola con i dati
        const athleteList = document.getElementById('athleteList');
        if (athleteList) {
            athleteList.innerHTML = '';
            // Passa il flag filterEventId (true/false) alla funzione per aggiornare la colonna Stato Iscrizione
            athletesData.forEach(athlete => addAthleteToTable(athlete, !!filterEventId)); 
        }
        
        // Esegue le funzioni di aggiornamento (definite in script2.js)
        await updateAllCounters(); 
        await populateEventSelector('eventSelector'); 
        await showAdminSection(); 

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
            // Recupera gli atleti al caricamento (senza filtro)
            fetchAthletes();
        }
    }
}


//================================================================================
// NUOVE FUNZIONI UTILITY PER GESTIONE ADMIN E EVENTI
//================================================================================

// ⚠️ IMPORTANTE: SOSTITUISCI CON IL TUO USER_ID REALE DI SUPABASE (auth.users.id)
const ADMIN_USER_ID = 'PLACEHOLDER_YOUR_ADMIN_UUID'; 

let ADMIN_SOCIETY_ID = null;

async function isCurrentUserAdmin() {
    const user = await supabase.auth.getUser();
    if (!user.data?.user?.id) return false;
    return user.data.user.id === ADMIN_USER_ID;
}

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
    
    fetchSocietyNameOnLoad(); 
});
