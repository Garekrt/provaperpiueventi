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

const ADMIN_USER_ID = '1a02fab9-1a2f-48d7-9391-696f4fba88a1'; 

// ================================================================================
// 2. FUNZIONI DI AUTENTICAZIONE
// ================================================================================
window.checkAuth = async function() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
        if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('registrazione.html')) {
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

// ================================================================================
// 3. RECUPERO E VISUALIZZAZIONE ATLETI (LA FUNZIONE MANCANTE)
// ================================================================================
async function fetchAthletes(filterEventId = null) {
    try {
        const user = await window.checkAuth();
        if (!user) return;

        // Recupera ID società
        const { data: society } = await supabase.from('societa').select('id').eq('user_id', user.id).single();
        if (!society) return;
        
        const societyId = society.id;
        let athletesData = [];

        if (filterEventId) {
            // Filtra per evento specifico
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
            // Prendi tutti gli atleti della società
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

// ================================================================================
// 4. GESTIONE ADMIN E CARICAMENTO INIZIALE
// ================================================================================
async function showAdminSection() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === ADMIN_USER_ID) {
        const adminDiv = document.getElementById('adminEventCreation');
        const adminLimits = document.getElementById('adminLimitsConfig');
        if (adminDiv) adminDiv.style.display = 'block';
        if (adminLimits) adminLimits.style.display = 'block';
        console.log("Admin sbloccato");
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
        
        await showAdminSection(); 
        
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('event_id');
        
        // Ora fetchAthletes è definita e non darà più errore
        if (document.getElementById('athleteList')) {
            await fetchAthletes(eventId);
        }
    }
}

// ================================================================================
// 5. AVVIO E LISTENERS
// ================================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // Gestione Logout (se il bottone esiste)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', window.signOut);

    // Se siamo nella dashboard, carica i dati
    if (document.getElementById('societyNameDisplay') || document.getElementById('athleteList')) {
        await fetchSocietyNameOnLoad();
    }
});
