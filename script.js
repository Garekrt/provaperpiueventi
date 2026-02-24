// ==========================================
// CONFIGURAZIONE E INIZIALIZZAZIONE
// ==========================================
const { createClient } = window.supabase;
const supabaseUrl = 'https://qdlfdfswufifgjdhmcsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGZkZnN3dWZpZmdqZGhtY3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEwODI0OSwiZXhwIjoyMDc1Njg0MjQ5fQ.cPQpmwujaQWufmk6BThsW15Hk3xD1dplw9FRrZG38BQ';
window.supabaseClient = createClient(supabaseUrl, supabaseKey);
var supabase = window.supabaseClient;

// ID Admin (Verifica che corrisponda al tuo UUID in Authentication)
const ADMIN_USER_ID = ' c50a2401-32e7-4851-9e68-0f283ad8556d';

// ==========================================
// GESTIONE UTENTE E SESSIONE
// ==========================================
window.checkAuth = async function() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = "login.html";
        }
        return null;
    }
    return user;
};

window.signOut = async function() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
};

// ==========================================
// CARICAMENTO DATI SOCIETÀ (Sblocca la creazione eventi)
// ==========================================
window.fetchSocietyNameOnLoad = async function() {
    const user = await window.checkAuth();
    if (!user) return;

    try {
        const { data: society, error } = await supabase
            .from('societa')
            .select('id, nome')
            .eq('user_id', user.id)
            .single();

        if (error) throw error;

        if (society) {
            // Aggiorna il nome in alto
            const nameDisplay = document.getElementById('societyNameDisplay');
            if (nameDisplay) nameDisplay.textContent = society.nome;

            // Aggiorna l'ID nascosto/visibile per la creazione eventi
            const idDisplay = document.getElementById('adminSocietyIdDisplay');
            if (idDisplay) idDisplay.textContent = society.id;

            // Se l'utente è l'admin, mostriamo la sezione creazione eventi
            if (user.id === ADMIN_USER_ID) {
                const adminSection = document.getElementById('adminEventCreation');
                if (adminSection) adminSection.style.display = 'block';
            }
        }
    } catch (err) {
        console.error("Errore fetchSociety:", err.message);
    }
};

// ==========================================
// GESTIONE ATLETI (Fetch e Delete)
// ==========================================
window.fetchAthletes = async function() {
    const user = await window.checkAuth();
    if (!user) return;

    try {
        const { data: society } = await supabase.from('societa').select('id').eq('user_id', user.id).single();
        if (!society) return;

        const { data: athletes, error } = await supabase
            .from('atleti')
            .select('*')
            .eq('society_id', society.id);

        if (error) throw error;

        const athleteList = document.getElementById('athleteList');
        if (athleteList) {
            athleteList.innerHTML = '';
            athletes.forEach(athlete => {
                const row = `<tr>
                    <td>${athlete.first_name}</td>
                    <td>${athlete.last_name}</td>
                    <td>${athlete.gender}</td>
                    <td>${athlete.birthdate}</td>
                    <td>${athlete.belt}</td>
                    <td>${athlete.classe}</td>
                    <td>${athlete.specialty}</td>
                    <td>${athlete.weight_category || athlete.team_members || 'N/A'}</td>
                    <td><button class="btn btn-danger btn-sm" onclick="deleteAthlete('${athlete.id}')">Elimina</button></td>
                </tr>`;
                athleteList.innerHTML += row;
            });
        }
    } catch (err) {
        console.error("Errore fetchAthletes:", err.message);
    }
};

window.deleteAthlete = async function(id) {
    if (!confirm("Sei sicuro di voler eliminare questo atleta?")) return;
    const { error } = await supabase.from('atleti').delete().eq('id', id);
    if (error) alert("Errore: " + error.message);
    else window.fetchAthletes();
};

document.addEventListener('DOMContentLoaded', window.fetchSocietyNameOnLoad);
