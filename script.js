// 1. Inizializzazione sicura e globale
(function() {
    if (typeof window.supabase === 'undefined') {
        // La libreria CDN espone 'supabase' con la funzione 'createClient'
        const supabaseUrl = 'https://qdlfdfswufifgjdhmcsn.supabase.co';
        // ⚠️ USA LA "ANON PUBLIC KEY"
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGZkZnN3dWZpZmdqZGhtY3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDgyNDksImV4cCI6MjA3NTY4NDI0OX0.M6z_C3naK-EmcUawCjZa6rOkLc57p3XZ98k67CyXPDQ'; 
        
        window.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    }
})();

// Definiamo le variabili come globali (window.nome) per evitare conflitti tra file
window.ADMIN_USER_ID = '1a02fab9-1a2f-48d7-9391-696f4fba88a1';

// --- FUNZIONE DI AUTENTICAZIONE ---
window.checkAuth = async function() {
    try {
        const { data, error } = await window.supabase.auth.getUser();
        if (error || !data || !data.user) {
            if (!window.location.href.includes("login.html")) {
                window.location.href = "login.html";
            }
            return null;
        }
        return data.user;
    } catch (e) {
        console.error("Errore auth:", e);
        return null;
    }
};

// --- FUNZIONE CARICAMENTO NOME SOCIETA ---
window.fetchSocietyNameOnLoad = async function() {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (user) {
        const { data } = await window.supabase.from('societa').select('nome').eq('user_id', user.id).single();
        if (data && document.getElementById('societyNameDisplay')) {
            document.getElementById('societyNameDisplay').textContent = data.nome;
        }
    }
};

// --- FUNZIONE CARICAMENTO ATLETI (Quella che ti dava errore) ---
window.fetchAthletes = async function(filterEventId = null) {
    try {
        console.log("Eseguo fetchAthletes per evento:", filterEventId);
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) return;

        const { data: society } = await window.supabase.from('societa').select('id').eq('user_id', user.id).single();
        if (!society) return;

        let athletesData = [];
        if (filterEventId) {
            const { data } = await window.supabase.from('iscrizioni_eventi')
                .select('atleti (*), eventi (nome)')
                .eq('evento_id', filterEventId);
            
            athletesData = (data || [])
                .filter(sub => sub.atleti && sub.atleti.society_id === society.id)
                .map(sub => ({ ...sub.atleti, iscritti_evento_nome: sub.eventi.nome }));
        } else {
            const { data } = await window.supabase.from('atleti').select('*').eq('society_id', society.id);
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
        console.error("Errore critico in fetchAthletes:", err); 
    }
};

window.removeAthlete = async function(id, row) {
    if (confirm("Eliminare?")) {
        const { error } = await window.supabase.from('atleti').delete().eq('id', id);
        if (!error) row.remove();
    }
};
