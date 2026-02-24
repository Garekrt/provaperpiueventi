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

// ⚠️ SOSTITUISCI CON IL TUO USER_ID REALE DI SUPABASE
const ADMIN_USER_ID = 'c50a2401-32e7-4851-9e68-0f283ad8556d'; 

// ================================================================================
// 2. FUNZIONI DI AUTENTICAZIONE (RESE GLOBALI)
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

window.signUp = async function(email, password, nomeSocieta, Phone) {
    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        const { error: societaError } = await supabase.from('societa').insert([{ nome: nomeSocieta, email: email, Phone: Phone, user_id: data.user.id }]);
        if (societaError) throw societaError;
        alert('Registrazione avvenuta! Verifica la tua email.');
        window.location.href = 'login.html';
    } catch (error) { alert('Errore: ' + error.message); }
};

window.signIn = async function(email, password) {
    try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = 'index.html';
    } catch (error) { alert('Errore: ' + error.message); }
};

// ================================================================================
// 3. LOGICA UI E CARICAMENTO DATI
// ================================================================================
window.fetchAthletes = async function(filterEventId = null) {
    try {
        const user = await window.checkAuth();
        if (!user) return;
        const { data: society } = await supabase.from('societa').select('id').eq('user_id', user.id).single();
        if (!society) return;

        let query = supabase.from('atleti').select('*').eq('society_id', society.id);
        const { data: athletes, error } = await query;
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
                    <td>${athlete.society_id}</td>
                    <td>Disponibile</td>
                    <td><button class="btn btn-danger btn-sm" onclick="deleteAthlete('${athlete.id}')">Elimina</button></td>
                </tr>`;
                athleteList.innerHTML += row;
            });
        }
    } catch (error) { console.error("Errore fetchAthletes:", error.message); }
};

window.fetchSocietyNameOnLoad = async function() {
    try {
        // 1. Controlla se l'utente è loggato
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            console.log("Utente non loggato");
            return;
        }

        // 2. Cerca la società associata all'utente
        const { data: societyData, error: socError } = await supabase
            .from('societa')
            .select('id, nome')
            .eq('user_id', user.id)
            .single();

        if (socError) {
            console.error("Errore nel recupero società:", socError.message);
            const display = document.getElementById('societyNameDisplay');
            if (display) display.textContent = "Società non trovata";
            return;
        }

        // 3. Aggiorna i campi nella pagina
        if (societyData) {
            // Aggiorna il nome in alto
            const nameDisplay = document.getElementById('societyNameDisplay');
            if (nameDisplay) nameDisplay.textContent = societyData.nome;

            // Aggiorna il testo "Caricamento..." con l'ID reale
            const idDisplay = document.getElementById('adminSocietyIdDisplay');
            if (idDisplay) idDisplay.textContent = societyData.id;
            
            // Mostra la sezione admin se sei l'admin configurato
            if (user.id === ADMIN_USER_ID) {
                const adminSection = document.getElementById('adminEventCreation');
                if (adminSection) adminSection.style.display = 'block';
            }
        }
    } catch (error) {
        console.error("Errore generale in fetchSocietyNameOnLoad:", error);
    }
};
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('registrazione.html')) {
        await fetchSocietyNameOnLoad();
    }
});
