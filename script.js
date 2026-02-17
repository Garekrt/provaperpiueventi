// ================================================================================
// 1. INIZIALIZZAZIONE UNICA (CORREZIONE ERRORE "ALREADY DECLARED")
// ================================================================================
if (!window.supabaseClient) {
    const { createClient } = window.supabase;
    const supabaseUrl = 'https://qdlfdfswufifgjdhmcsn.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGZkZnN3dWZpZmdqZGhtY3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEwODI0OSwiZXhwIjoyMDc1Njg0MjQ5fQ.cPQpmwujaQWufmk6BThsW15Hk3xD1dplw9FRrZG38BQ';
    window.supabaseClient = createClient(supabaseUrl, supabaseKey);
}
var supabase = window.supabaseClient;

const ADMIN_USER_ID = '1a02fab9-1a2f-48d7-9391-696f4fba88a1'; 
let ADMIN_SOCIETY_ID = null;

// ================================================================================
// 2. FUNZIONI DI AUTENTICAZIONE E SICUREZZA
// ================================================================================

window.checkAuth = async function() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
        window.location.href = "login.html";
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

// ================================================================================
// 3. LOGICA AMMINISTRATORE (PER FAR APPARIRE I FORM NASCOSTI)
// ================================================================================

async function showAdminSection() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === ADMIN_USER_ID) {
        // Questi ID devono esistere nel tuo index.html
        const adminDiv = document.getElementById('adminEventCreation');
        const adminLimits = document.getElementById('adminLimitsConfig');
        if (adminDiv) adminDiv.style.display = 'block';
        if (adminLimits) adminLimits.style.display = 'block';
        console.log("Modalità Admin Attivata");
    }
}

// ================================================================================
// 4. RECUPERO DATI E VISUALIZZAZIONE ATLETI (LOGICA ORIGINALE)
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
            const { data: subData } = await supabase
                .from('iscrizioni_eventi')
                .select(`atleti (*), eventi (nome)`)
                .eq('evento_id', filterEventId);
            
            athletesData = subData
                .filter(sub => sub.atleti && sub.atleti.society_id === societyId)
                .map(sub => ({ ...sub.atleti, iscritti_evento_nome: sub.eventi.nome, iscritti_evento_stato: 'Iscritto' }));
        } else {
            const { data } = await supabase.from('atleti').select('*').eq('society_id', societyId);
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
        console.error("Errore fetchAtleti:", error.message);
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
        await showAdminSection(); // <--- IMPORTANTE: Sblocca admin dopo il caricamento
        
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('event_id');
        if (document.getElementById('athleteList')) fetchAthletes(eventId);
    }
}

// ================================================================================
// 5. EVENT LISTENERS (DOM)
// ================================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Gestione Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await signIn(document.getElementById('email').value, document.getElementById('password').value);
        });
    }

    // Gestione Registrazione
    const regForm = document.getElementById('registrazioneForm');
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await signUp(
                document.getElementById('email').value,
                document.getElementById('password').value,
                document.getElementById('nomeSocieta').value,
                document.getElementById('Phone').value
            );
        });
    }

    // Toggle Modulo Squadra
    const toggleBtn = document.getElementById('toggleTeamForm');
    const teamDiv = document.getElementById('teamFormContainer');
    if (toggleBtn && teamDiv) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = teamDiv.style.display === 'none';
            teamDiv.style.display = isHidden ? 'block' : 'none';
            toggleBtn.textContent = isHidden ? 'Nascondi Modulo Squadra' : 'Mostra Modulo Squadra';
        });
    }

    if (!loginForm && !regForm) await fetchSocietyNameOnLoad();
});
