// CONTROLLO DI SICUREZZA: Inizializza Supabase solo se non esiste già
if (typeof window.supabase === 'undefined') {
    const { createClient } = window.supabaseJs;
    const supabaseUrl = 'https://qdlfdfswufifgjdhmcsn.supabase.co';
    // ⚠️ USA LA ANON KEY (quella pubblica), NON LA SERVICE ROLE KEY
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGZkZnN3dWZpZmdqZGhtY3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDgyNDksImV4cCI6MjA3NTY4NDI0OX0.M6z_C3naK-EmcUawCjZa6rOkLc57p3XZ98k67CyXPDQ'; 

    window.supabase = createClient(supabaseUrl, supabaseKey);
}

// Rendiamo le variabili accessibili globalmente senza errori di ridichiarazione
var supabase = window.supabase;
var ADMIN_USER_ID = '1a02fab9-1a2f-48d7-9391-696f4fba88a1';

// --- FUNZIONI GLOBALI ---

async function checkAuth() {
    try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data || !data.user) {
            console.warn("Utente non autenticato, reindirizzamento...");
            window.location.href = "login.html";
            return null;
        }
        return data.user;
    } catch (e) {
        window.location.href = "login.html";
    }
}

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
            const { data } = await supabase.from('iscrizioni_eventi').select('atleti (*), eventi (nome)').eq('evento_id', filterEventId);
            athletesData = (data || [])
                .filter(sub => sub.atleti && sub.atleti.society_id === society.id)
                .map(sub => ({ ...sub.atleti, iscritti_evento_nome: sub.eventi.nome }));
        } else {
            const { data } = await supabase.from('atleti').select('*').eq('society_id', society.id);
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
    } catch (err) { console.error("Errore fetchAthletes:", err); }
}

async function removeAthlete(id, row) {
    if (confirm("Eliminare definitivamente?")) {
        const { error } = await supabase.from('atleti').delete().eq('id', id);
        if (!error) row.remove();
    }
}

// --- GESTIONE FORM ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) alert("Errore login: " + error.message);
            else window.location.href = 'index.html';
        };
    }
});
