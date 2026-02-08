/**
 * INIZIALIZZAZIONE SUPABASE
 * Usiamo window.supabaseClient per evitare l'errore "already declared"
 */
(function() {
    if (typeof window.supabaseClient === 'undefined') {
        const supabaseUrl = 'https://qdlfdfswufifgjdhmcsn.supabase.co';
        
        // ⚠️ SOSTITUISCI CON LA TUA "ANON PUBLIC KEY"
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGZkZnN3dWZpZmdqZGhtY3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDgyNDksImV4cCI6MjA3NTY4NDI0OX0.M6z_C3naK-EmcUawCjZa6rOkLc57p3XZ98k67CyXPDQ'; 

        // Inizializzazione client v2
        // La libreria caricata via CDN espone l'oggetto 'supabase' globale
        window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log("Supabase Client inizializzato correttamente.");
    }
})();

// Creiamo un riferimento globale 'supabase' sicuro
var supabase = window.supabaseClient;

// Variabile Admin
window.ADMIN_USER_ID = '1bd94d5f-af2b-4835-a8ce-f6ccea8f066c';

// --- FUNZIONI DI AUTENTICAZIONE ---

window.checkAuth = async function() {
    try {
        const { data, error } = await window.supabaseClient.auth.getUser();
        if (error || !data || !data.user) {
            if (!window.location.href.includes("login.html") && !window.location.href.includes("registrazione.html")) {
                window.location.href = "login.html";
            }
            return null;
        }
        return data.user;
    } catch (e) {
        console.error("Errore Auth:", e);
        return null;
    }
};

window.signUp = async function(email, password, nomeSocieta, Phone) {
    try {
        const { data, error } = await window.supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
            const { error: societaError } = await window.supabaseClient.from('societa').insert([
                { nome: nomeSocieta, email: email, Phone: Phone, user_id: data.user.id }
            ]);
            if (societaError) throw societaError;
            await window.supabaseClient.auth.signOut();
            alert('Registrazione completata! Verifica la mail prima di accedere.');
            window.location.replace('login.html');
        }
    } catch (error) {
        alert('Errore registrazione: ' + error.message);
    }
};

window.signIn = async function(email, password) {
    try {
        const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = 'index.html';
    } catch (error) {
        alert("Errore accesso: " + error.message);
    }
};

window.signOut = async function() {
    await window.supabaseClient.auth.signOut();
    window.location.href = 'login.html';
};

// --- GESTIONE DATI ---

window.fetchSocietyNameOnLoad = async function() {
    const user = await window.checkAuth();
    if (user) {
        const { data } = await window.supabaseClient.from('societa').select('nome').eq('user_id', user.id).single();
        if (data && document.getElementById('societyNameDisplay')) {
            document.getElementById('societyNameDisplay').textContent = data.nome;
        }
    }
};

window.fetchAthletes = async function(filterEventId = null) {
    try {
        const user = await window.checkAuth();
        if (!user) return;
        const { data: society } = await window.supabaseClient.from('societa').select('id').eq('user_id', user.id).single();
        if (!society) return;

        let athletesData = [];
        if (filterEventId) {
            const { data } = await window.supabaseClient.from('iscrizioni_eventi').select('atleti (*), eventi (nome)').eq('evento_id', filterEventId);
            athletesData = (data || []).filter(s => s.atleti && s.atleti.society_id === society.id).map(s => ({ ...s.atleti, iscritti_evento_nome: s.eventi.nome }));
        } else {
            const { data } = await window.supabaseClient.from('atleti').select('*').eq('society_id', society.id);
            athletesData = data || [];
        }

        const list = document.getElementById('athleteList');
        if (list) {
            list.innerHTML = '';
            athletesData.forEach(a => {
                const row = list.insertRow();
                row.insertCell().textContent = a.first_name;
                row.insertCell().textContent = a.last_name || 'SQUADRA';
                row.insertCell().textContent = a.gender;
                row.insertCell().textContent = a.birthdate || 'N/A';
                row.insertCell().textContent = a.belt;
                row.insertCell().textContent = a.classe;
                row.insertCell().textContent = a.specialty;
                row.insertCell().textContent = a.weight_category || a.team_members || '-';
                row.insertCell().textContent = a.society_id;
                const status = row.insertCell();
                status.textContent = a.iscritti_evento_nome ? 'Iscritto' : 'No';
                const actions = row.insertCell();
                actions.innerHTML = `<button class="btn btn-danger btn-sm" onclick="removeAthlete('${a.id}', this.parentElement.parentElement)">Rimuovi</button>`;
            });
        }
    } catch (err) { console.error(err); }
};

window.removeAthlete = async function(id, row) {
    if (confirm("Eliminare?")) {
        const { error } = await window.supabaseClient.from('atleti').delete().eq('id', id);
        if (!error) row.remove();
    }
};

// Event Listeners per i form
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            window.signIn(document.getElementById('email').value, document.getElementById('password').value);
        };
    }
    const regForm = document.getElementById('registrazioneForm');
    if (regForm) {
        regForm.onsubmit = (e) => {
            e.preventDefault();
            window.signUp(document.getElementById('email').value, document.getElementById('password').value, document.getElementById('nomeSocieta').value, document.getElementById('Phone').value);
        };
    }
});

