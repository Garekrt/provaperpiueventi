// --- MODIFICA DEFINITIVA PER ELIMINARE IL CONFLITTO ---
// Non usiamo più "const" a livello globale per evitare "already been declared"
if (!window.supabase) {
    var { createClient } = window.supabase;
    var supabaseUrl = 'https://qdlfdfswufifgjdhmcsn.supabase.co';
    var supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGZkZnN3dWZpZmdqZGhtY3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEwODI0OSwiZXhwIjoyMDc1Njg0MjQ5fQ.cPQpmwujaQWufmk6BThsW15Hk3xD1dplw9FRrZG38BQ';
    window.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
}

// Definiamo signOut come proprietà di window così l'HTML lo trova sempre
window.signOut = async function() {
    try {
        const { error } = await window.supabase.auth.signOut();
        if (error) throw error;
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Errore durante il logout:', error.message);
        alert('Errore durante il logout.');
    }
};

// Definiamo anche checkAuth globalmente
window.checkAuth = async function() {
    try {
        const { data } = await window.supabase.auth.getUser();
        if (!data || !data.user) {
            window.location.href = "login.html";
        }
    } catch (e) {
        window.location.href = "login.html";
    }
};
// --- FINE MODIFICHE ---F
// ⚠️ IMPORTANTE: SOSTITUISCI CON IL TUO USER_ID REALE DI SUPABASE (auth.users.id)
const ADMIN_USER_ID = '1a02fab9-1a2f-48d7-9391-696f4fba88a1'; 
let ADMIN_SOCIETY_ID = null;
//================================================================================
// FUNZIONI DI AUTENTICAZIONE
//================================================================================

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
        
        window.location.href = '/index.html'; // Porta a index.html
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

async function forgotPassword(email) {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/update-password.html', 
        });

        if (error) throw error;
        
        alert('Richiesta inviata! Controlla la tua casella email per il link di recupero della password.');
        
    } catch (error) {
        console.error('Errore nel recupero password:', error.message);
        alert('Errore nell\'invio della richiesta: ' + error.message);
    }
}
//================================================================================
// FUNZIONI UTILITY PER GESTIONE ADMIN
//================================================================================

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

//================================================================================
// FUNZIONE PER POPOLARE LA TABELLA ATLETI
//================================================================================
function addAthleteToTable(athlete, eventId = null) { 
    const athleteList = document.getElementById('athleteList');
    if (!athleteList) return; 

    const row = athleteList.insertRow();
    
    // GESTIONE SQUADRE
    if (athlete.is_team) {
        row.insertCell().textContent = athlete.first_name; 
        row.insertCell().textContent = 'SQUADRA'; 
        row.insertCell().textContent = athlete.gender;
        row.insertCell().textContent = 'N/A'; 
        row.insertCell().textContent = athlete.belt;
        row.insertCell().textContent = athlete.classe;
        // Sostituisce il trattino basso per la visualizzazione
        row.insertCell().textContent = athlete.specialty.replace(/_/g, ' '); 
        row.insertCell().textContent = athlete.team_members || 'Membri non listati'; 
    } else {
        // Logica esistente per gli atleti individuali
        row.insertCell().textContent = athlete.first_name;
        row.insertCell().textContent = athlete.last_name;
        row.insertCell().textContent = athlete.gender;
        row.insertCell().textContent = athlete.birthdate;
        row.insertCell().textContent = athlete.belt;
        row.insertCell().textContent = athlete.classe;
        row.insertCell().textContent = athlete.specialty;
        row.insertCell().textContent = athlete.weight_category || 'N/D';
    }
    
    row.insertCell().textContent = athlete.society_id;

    const statusCell = row.insertCell();
    const isFilteredByEvent = athlete.iscritti_evento_nome; 

    if (isFilteredByEvent) {
        statusCell.textContent = `${athlete.iscritti_evento_nome} (${athlete.iscritti_evento_stato})`;
        statusCell.style.backgroundColor = '#d4edda';
    } else if (eventId) {
        statusCell.textContent = 'Non iscritto all\'evento selezionato';
        statusCell.style.backgroundColor = '#f8d7da';
    } else {
        statusCell.textContent = 'Nessun filtro evento attivo';
    }
    
    const actionsCell = row.insertCell();
    
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Rimuovi';
    removeButton.classList.add('btn', 'btn-danger', 'btn-sm', 'mb-1');
    removeButton.addEventListener('click', () => removeAthlete(athlete.id, row));
    actionsCell.appendChild(removeButton);
}

// Funzione per la rimozione di un atleta/squadra
async function removeAthlete(athleteId, rowElement) {
    if (!confirm("Sei sicuro di voler rimuovere questo atleta/squadra? Verrà rimosso da tutti gli eventi.")) {
        return;
    }

    const { error } = await supabase
        .from('atleti')
        .delete()
        .eq('id', athleteId);

    if (error) {
        console.error('Errore durante la rimozione:', error.message);
        alert('Errore durante la rimozione dell\'atleta/squadra.');
    } else {
        rowElement.remove(); 
        
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('event_id');
        if (typeof fetchAthletes === 'function') {
            fetchAthletes(eventId); 
        }
    }
}


//================================================================================
// FUNZIONE PRINCIPALE: FETCH ATLETI 
//================================================================================

async function fetchAthletes(filterEventId = null) {
    try {
        const user = await supabase.auth.getUser();
        if (!user.data?.user?.id) return;

        const { data: society, error: societyError } = await supabase
            .from('societa')
            .select('id')
            .eq('user_id', user.data.user.id)
            .single();

        if (societyError || !society) throw societyError || new Error("Società non trovata.");
        
        const societyId = society.id;
        let athletesData = [];
        let error = null;

        // LOGICA DI FILTRO 
        if (filterEventId) {
            const { data: subscriptionData, error: subError } = await supabase
                .from('iscrizioni_eventi')
                .select(`
                    atleti (*),
                    eventi (nome)
                `)
                .eq('evento_id', filterEventId);

            if (subError) throw subError;
            
            athletesData = subscriptionData
                .filter(sub => sub.atleti && sub.atleti.society_id === societyId) 
                .map(sub => ({ 
                    ...sub.atleti, 
                    iscritti_evento_nome: sub.eventi.nome,
                    iscritti_evento_stato: 'Iscritto' 
                }));

        } else {
            const { data: allAthletes, error: fetchError } = await supabase
                .from('atleti')
                .select('*')
                .eq('society_id', societyId);
            
            athletesData = allAthletes;
            error = fetchError;
        }

        if (error) throw error;

        const athleteList = document.getElementById('athleteList');
        if (athleteList) { // CONTROLLO NULL
            athleteList.innerHTML = '';
            athletesData.forEach(athlete => addAthleteToTable(athlete, filterEventId)); 
        }
        
        // Esegue le funzioni di aggiornamento (definite in script2.js)
        if (typeof updateAllCounters === 'function') {
            await updateAllCounters(filterEventId); 
        }
        if (typeof populateEventSelector === 'function') {
            await populateEventSelector('eventSelector'); 
        }
        if (typeof showAdminSection === 'function') {
            await showAdminSection(); 
        }

    } catch (error) {
        console.error("Errore nel recupero degli atleti:", error.message);
        
        // ⭐ CONTROLLO NULL RAFFORZATO (per l'errore a riga 247)
        const societyNameDisplay = document.getElementById('societyNameDisplay');
        if (societyNameDisplay) {
            societyNameDisplay.textContent = "Errore di caricamento dati.";
        }
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
            const societyNameDisplay = document.getElementById('societyNameDisplay');
            const currentEventDisplay = document.getElementById('currentEventDisplay'); // Check aggiuntivo
            
            if (societyNameDisplay) { // Check 1
                societyNameDisplay.textContent = societyData.nome;
            }
            
            const urlParams = new URLSearchParams(window.location.search);
            const eventId = urlParams.get('event_id');
            
            if (currentEventDisplay) { // Check 2
                currentEventDisplay.textContent = eventId ? `ID: ${eventId}` : 'Nessun Evento Selezionato';
            }
            
            // Call fetchAthletes only if the main table exists (i.e. we are on index.html)
            if (document.getElementById('athleteList')) { 
                if (typeof fetchAthletes === 'function') {
                     fetchAthletes(eventId);
                }
            }
        }
    }
}


// Inizializza i listener per i form
document.addEventListener('DOMContentLoaded', async () => { 
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
            const emailConfirm = document.getElementById('emailConfirm').value; 
            const password = document.getElementById('password').value;
            const passwordConfirm = document.getElementById('passwordConfirm').value; 
            const Phone = document.getElementById('Phone').value;

            if (email !== emailConfirm) {
                alert('Errore: L\'email e la conferma email non corrispondono.');
                return;
            }
            if (password !== passwordConfirm) {
                alert('Errore: La password e la conferma password non corrispondono.');
                return;
            }
            
            signUp(email, password, nomeSocieta, Phone);
        });
    }

    // LISTENER PER RECUPERO PASSWORD
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            const email = prompt('Inserisci l\'email associata al tuo account per recuperare la password:');
            if (email) {
                forgotPassword(email);
            }
        });
    }
    
    // LISTENER PER TOGGLE FORM SQUADRA
    const toggleButton = document.getElementById('toggleTeamForm');
    const teamFormContainer = document.getElementById('teamFormContainer');
    
    if (toggleButton && teamFormContainer) {
        toggleButton.addEventListener('click', () => {
            const isHidden = teamFormContainer.style.display === 'none';
            teamFormContainer.style.display = isHidden ? 'block' : 'none';
            toggleButton.textContent = isHidden ? 
                'Nascondi Modulo Iscrizione Squadra' : 
                'Mostra Modulo Iscrizione Squadra';
        });
    }
    
    // LISTENER PER REGISTRAZIONE SQUADRA
    const teamForm = document.getElementById('teamForm');
    if (teamForm) {
        teamForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (typeof addTeam === 'function') {
                await addTeam(); 
            } else {
                alert('Errore: Funzione di aggiunta squadra non disponibile (controlla script2.js).');
            }
        });
    }
    
    await fetchSocietyNameOnLoad(); 
});
