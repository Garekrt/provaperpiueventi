// Inizializzazione globale di Supabase (evita doppie dichiarazioni)
if (typeof window.supabase === 'undefined') {
    const { createClient } = window.supabaseJs;
    const supabaseUrl = 'https://qdlfdfswufifgjdhmcsn.supabase.co';
    // ⚠️ USA LA "ANON PUBLIC KEY", NON LA SERVICE ROLE KEY!
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGZkZnN3dWZpZmdqZGhtY3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDgyNDksImV4cCI6MjA3NTY4NDI0OX0.M6z_C3naK-EmcUawCjZa6rOkLc57p3XZ98k67CyXPDQ'; 
    window.supabase = createClient(supabaseUrl, supabaseKey);
}

// Shortcut locale
const supabase = window.supabase;

const ADMIN_USER_ID = '1a02fab9-1a2f-48d7-9391-696f4fba88a1'; 
let ADMIN_SOCIETY_ID = null;

// --- FUNZIONI DI AUTENTICAZIONE ---

async function checkAuth() {
    try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
            window.location.href = "login.html";
            return null;
        }
        return data.user;
    } catch (e) {
        window.location.href = "login.html";
    }
}

async function signUp(email, password, nomeSocieta, Phone) {
    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        const { error: societaError } = await supabase.from('societa').insert([
            { nome: nomeSocieta, email: email, Phone: Phone, user_id: data.user.id }
        ]);
        if (societaError) throw societaError;
        alert('Registrazione avvenuta! Verifica la tua email');
        window.location.href = 'login.html';
    } catch (error) {
        alert('Errore: ' + error.message);
    }
}

async function signIn(email, password) {
    try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = 'index.html';
    } catch (error) {
        alert('Errore di accesso: ' + error.message);
    }
}

async function signOut() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
}

// --- FUNZIONI CARICAMENTO DATI ---

async function fetchSocietyNameOnLoad() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data } = await supabase.from('societa').select('nome').eq('user_id', user.id).single();
        if (data) {
            const el = document.getElementById('societyNameDisplay');
            if (el) el.textContent = data.nome;
        }
    }
}

async function fetchAthletes(filterEventId = null) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: society } = await supabase.from('societa').select('id').eq('user_id', user.id).single();
        if (!society) return;

        let athletesData = [];
        if (filterEventId) {
            const { data } = await supabase.from('iscrizioni_eventi')
                .select('atleti (*), eventi (nome)')
                .eq('evento_id', filterEventId);
            athletesData = data.filter(sub => sub.atleti && sub.atleti.society_id === society.id)
                               .map(sub => ({ ...sub.atleti, iscritti_evento_nome: sub.eventi.nome }));
        } else {
            const { data } = await supabase.from('atleti').select('*').eq('society_id', society.id);
            athletesData = data;
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
}

async function removeAthlete(id, row) {
    if (confirm("Eliminare?")) {
        const { error } = await supabase.from('atleti').delete().eq('id', id);
        if (!error) row.remove();
    }
}

// --- GESTORE EVENTI DOM ---
document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            signIn(document.getElementById('email').value, document.getElementById('password').value);
        };
    }
    
    const regForm = document.getElementById('registrazioneForm');
    if (regForm) {
        regForm.onsubmit = (e) => {
            e.preventDefault();
            signUp(document.getElementById('email').value, document.getElementById('password').value, document.getElementById('nomeSocieta').value, document.getElementById('Phone').value);
        };
    }
});
