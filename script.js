// ================================================================================
// 1. INIZIALIZZAZIONE GLOBALE SICURA
// ================================================================================
if (!window.supabaseClient) {
    const { createClient } = window.supabase;
    const supabaseUrl = 'https://qdlfdfswufifgjdhmcsn.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGZkZnN3dWZpZmdqZGhtY3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEwODI0OSwiZXhwIjoyMDc1Njg0MjQ5fQ.cPQpmwujaQWufmk6BThsW15Hk3xD1dplw9FRrZG38BQ';
    window.supabaseClient = createClient(supabaseUrl, supabaseKey);
}
var supabase = window.supabaseClient;

// ⚠️ IMPORTANTE: Assicurati che questo ID corrisponda al tuo User ID nella dashboard Supabase
const ADMIN_USER_ID = 'c50a2401-32e7-4851-9e68-0f283ad8556d'; 

// ================================================================================
// 2. FUNZIONI DI AUTENTICAZIONE
// ================================================================================

window.checkAuth = async function() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
        // Se non siamo loggati e non siamo già in login/registrazione, vai al login
        const path = window.location.pathname;
        if (!path.includes('login.html') && !path.includes('registrazione.html')) {
            window.location.href = "login.html";
        }
        return null;
    }
    return data.user;
};

window.signOut = async function() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
};

async function signUp(email, password, nomeSocieta, Phone) {
    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        const { error: societaError } = await supabase.from('societa').insert([{ 
            nome: nomeSocieta, 
            email: email, 
            Phone: Phone, 
            user_id: data.user.id 
        }]);
        
        if (societaError) throw societaError;
        alert('Registrazione avvenuta! Verifica la tua email.');
        window.location.href = 'login.html';
    } catch (error) {
        alert('Errore registrazione: ' + error.message);
    }
}

async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = 'index.html';
    } catch (error) {
        alert('Accesso fallito: ' + error.message);
    }
}

// ================================================================================
// 3. LOGICA AMMINISTRATORE E VISIBILITÀ UI
// ================================================================================

async function showAdminSection() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === ADMIN_USER_ID) {
        console.log("Accesso Amministratore confermato.");
        // Mostra le sezioni nascoste nell'index.html
        const adminDiv = document.getElementById('adminEventCreation');
        const adminLimits = document.getElementById('adminLimitsConfig');
        if (adminDiv) adminDiv.style.display = 'block';
        if (adminLimits) adminLimits.style.display = 'block';
    }
}

// ================================================================================
// 4. GESTIONE ATLETI (TABELLA E DATI)
// ================================================================================

async function fetchAthletes(filterEventId = null) {
    try {
        const user = await window.checkAuth();
        if (!user) return;

        const { data: society } = await supabase.from('societa').select('id').eq('user_id', user.id).single();
        if (!society) return;
        
        const societyId = society.id;
        let athletesData = [];

        if (filterEventId) {
            const { data: subData, error: subError } = await supabase
                .from('iscrizioni_eventi')
                .select(`atleti (*), eventi (nome)`)
                .eq('evento_id', filterEventId);
            
            if (subError) throw subError;

            athletesData = subData
                .filter(sub => sub.atleti && sub.atleti.society_id === societyId)
                .map(sub => ({ 
                    ...sub.atleti, 
                    iscritti_evento_nome: sub.eventi.nome, 
                    iscritti_evento_stato: 'Iscritto' 
                }));
        } else {
            const { data, error } = await supabase.from('atleti').select('*').eq('society_id', societyId);
            if (error) throw error;
            athletesData = data;
        }

        const athleteList = document.getElementById('athleteList');
        if (athleteList) {
            athleteList.innerHTML = '';
            athletesData.forEach(athlete => {
                const row = `<tr>
                    <td>${athlete.nome}</td>
                    <td>${athlete.cognome || athlete.tipo_squadra || ''}</td>
                    <td>${athlete.sesso || ''}</td>
                    <td>${athlete.birthdate || 'N/A'}</td>
                    <td>${athlete.cintura || ''}</td>
                    <td>${athlete.classe || ''}</td>
                    <td>${athlete.specialita || ''}</td>
                    <td>${athlete.peso || athlete.membri_nomi || ''}</td>
                    <td>${athlete.society_id}</td>
                    <td>${athlete.iscritti_evento_stato || 'Disponibile'}</td>
                    <td><button class="btn btn-danger btn-sm" onclick="deleteAthlete('${athlete.id}')">Elimina</button></td>
                </tr>`;
                athleteList.innerHTML += row;
            });
        }
    } catch (error) {
        console.error("Errore fetchAthletes:", error.message);
    }
}

async function fetchSocietyNameOnLoad() {
    const user = await window.checkAuth();
    if (user) {
        const { data: societyData } = await supabase.from('societa').select('nome').eq('user_id', user.id).single();
        if (societyData) {
            const display = document.getElementById('societyNameDisplay');
            if (display) display.textContent = societyData.nome;
        }
        
        // Attiva funzioni admin e form
        await showAdminSection(); 
        
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('event_id');
        
        if (document.getElementById('athleteList')) {
            await fetchAthletes(eventId);
        }
    }
}

// ================================================================================
// 5. EVENT LISTENERS E AVVIO
// ================================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Listener per il form di Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            await signIn(email, password);
        });
    }

    // Listener per il form di Registrazione
    const regForm = document.getElementById('registrazioneForm');
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const nome = document.getElementById('nomeSocieta').value;
            const phone = document.getElementById('Phone').value;
            await signUp(email, password, nome, phone);
        });
    }

    // Toggle Modulo Squadra (se presente)
    const toggleBtn = document.getElementById('toggleTeamForm');
    const teamDiv = document.getElementById('teamFormContainer');
    if (toggleBtn && teamDiv) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = teamDiv.style.display === 'none';
            teamDiv.style.display = isHidden ? 'block' : 'none';
            toggleBtn.textContent = isHidden ? 'Nascondi Modulo Squadra' : 'Mostra Modulo Squadra';
        });
    }

    // Avvio caricamento dati società/admin se siamo loggati
    if (!loginForm && !regForm) {
        await fetchSocietyNameOnLoad();
    }
});
