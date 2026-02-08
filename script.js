/**
 * INIZIALIZZAZIONE SUPABASE
 */
(function() {
    // La libreria CDN v2 espone 'supabase' come oggetto globale
    if (typeof window.supabaseClient === 'undefined') {
        const supabaseUrl = 'https://qdlfdfswufifgjdhmcsn.supabase.co';
        // ⚠️ SOSTITUISCI CON LA TUA "ANON PUBLIC KEY" (NON LA SERVICE ROLE)
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGZkZnN3dWZpZmdqZGhtY3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDgyNDksImV4cCI6MjA3NTY4NDI0OX0.M6z_C3naK-EmcUawCjZa6rOkLc57p3XZ98k67CyXPDQ'; 

        // Inizializzazione corretta per la v2 caricata da CDN
        window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log("Supabase Client inizializzato.");
    }
})();

// Shortcut globale per tutti gli altri file
var supabase = window.supabaseClient;

// --- FUNZIONI GLOBALI (window.nomeFunzione le rende accessibili ovunque) ---

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
        console.error("Errore critico in checkAuth:", e);
        return null;
    }
};

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
            const { data } = await window.supabaseClient.from('iscrizioni_eventi')
                .select('atleti (*), eventi (nome)')
                .eq('evento_id', filterEventId);
            
            athletesData = (data || [])
                .filter(sub => sub.atleti && sub.atleti.society_id === society.id)
                .map(sub => ({ ...sub.atleti, iscritti_evento_nome: sub.eventi.nome }));
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
    } catch (err) { 
        console.error("Errore in fetchAthletes:", err); 
    }
};

window.removeAthlete = async function(id, row) {
    if (confirm("Eliminare?")) {
        const { error } = await window.supabaseClient.from('atleti').delete().eq('id', id);
        if (!error) row.remove();
    }
};
// Aggiungi questo in fondo a script.js
window.signOut = async function() {
    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) throw error;
        
        // Pulisce eventuali dati in memoria
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Errore durante il logout:', error.message);
        alert('Errore durante il logout.');
    }
};
