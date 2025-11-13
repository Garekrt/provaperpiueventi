const { createClient } = window.supabase;
const supabaseUrl = 'https://biuvdnwscvijltnqjxxe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpdXZkbndzY3Zpamx0bnFqeHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTIxMDYsImV4cCI6MjA3NDEyODEwNn0.fl7l8rCeEeat_YITDUpkwonDvpskWqGpmWquGXqjVJk';
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
        alert(error.message);
    }
}

async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Fetch and display society name
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
                // Esegui questo codice solo quando il DOM è pronto
                document.addEventListener('DOMContentLoaded', () => {
                    const societyNameDisplay = document.getElementById('societyNameDisplay');
                    if (societyNameDisplay) {
                        societyNameDisplay.textContent = societyData.nome;
                    }

                    // Set the society name in the form as well
                    const societyInput = document.getElementById('society');
                    if (societyInput) {
                        societyInput.value = societyData.nome;
                    }
                });
                // Recupera e visualizza gli atleti dopo il login
                await fetchAthletes();
            }
        }

        alert('Login avvenuto!');
        window.location.href = '/index.html';
    } catch (error) {
        console.error('Errore login:', error.message);
        alert(error.message);
    }
}

async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        alert('Logout avvenuto!');
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Errore logout:', error.message);
        alert(error.message);
    }
}

// Event Listener per la Registrazione
const registrazioneForm = document.getElementById('registrazioneForm');
if (registrazioneForm) {
    registrazioneForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nomeSocieta = document.getElementById('nomeSocieta').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const Phone = document.getElementById('Phone').value
        await signUp(email, password, nomeSocieta, Phone);
    });
}

// Event Listener per il Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        await signIn(email, password);
    });
}

// Event Listener per il Logout
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        window.location.href = "login.html"; // Reindirizza alla pagina di login
    } catch (error) {
        console.error("Errore durante il logout:", error.message);
    }
}
async function fetchAthletes() {
    try {
        const user = await supabase.auth.getUser();
        if (!user.data?.user?.id) {
            console.error("Utente non autenticato.");
            return;
        }

        // Recupera gli atleti associati all'utente loggato
        const { data, error } = await supabase
            .from('athletes') // Assicurati che il nome della tabella sia corretto
            .select('*')
            .eq('user_id', user.data.user.id); 

        if (error) {
            throw error;
        }

        console.log("Atleti recuperati:", data);

        // Popola il frontend con i dati degli atleti (se necessario)
        const athletesList = document.getElementById('athletesList'); 
        if (athletesList) {
            athletesList.innerHTML = data.map(athlete => `<li>${athlete.nome}</li>`).join('');
        }

    } catch (error) {
        console.error("Errore nel recupero degli atleti:", error.message);
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
            // Set the society name in the form as well
            const societyInput = document.getElementById('society');
            if (societyInput) {
                societyInput.value = societyData.nome;
            }
            // Recupera gli atleti al caricamento se l'utente è loggato
            await fetchAthletes();
        }
    }
}

fetchSocietyNameOnLoad();
// ⚠️ IMPORTANTE: SOSTITUISCI CON IL TUO USER_ID REALE DI SUPABASE (auth.users.id)
const ADMIN_USER_ID = 'PLACEHOLDER_YOUR_ADMIN_UUID'; 

// Variabile per memorizzare l'ID della società collegata all'ADMIN_USER_ID
let ADMIN_SOCIETY_ID = null;

/**
 * Controlla se l'utente loggato è l'amministratore.
 * @returns {boolean} True se l'utente loggato corrisponde a ADMIN_USER_ID.
 */
async function isCurrentUserAdmin() {
    [cite_start]const user = await supabase.auth.getUser(); [cite: 346]
    [cite_start]if (!user.data?.user?.id) return false; [cite: 346]
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
        [cite_start].from('societa') [cite: 347]
        .select('id')
        [cite_start].eq('user_id', ADMIN_USER_ID) [cite: 347]
        .single();

    if (error || !societyData) {
        [cite_start]console.error('Errore nel recupero dell\'ID della società admin o società admin non trovata:', error?.message); [cite: 347, 348]
        return null;
    }
    ADMIN_SOCIETY_ID = societyData.id;
    return ADMIN_SOCIETY_ID;
