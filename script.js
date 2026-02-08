(function() {
    if (typeof window.supabaseClient === 'undefined') {
        const supabaseUrl = 'https://qdlfdfswufifgjdhmcsn.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGZkZnN3dWZpZmdqZGhtY3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDgyNDksImV4cCI6MjA3NTY4NDI0OX0.M6z_C3naK-EmcUawCjZa6rOkLc57p3XZ98k67CyXPDQ'; 
        window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    }
})();

window.ADMIN_USER_ID = '1bd94d5f-af2b-4835-a8ce-f6ccea8f066c';

// --- AUTH ---
window.checkAuth = async function() {
    const { data } = await window.supabaseClient.auth.getUser();
    if (!data || !data.user) {
        if (!window.location.href.includes("login.html")) window.location.href = "login.html";
        return null;
    }
    return data.user;
};

window.isCurrentUserAdmin = async function() {
    const user = await window.checkAuth();
    return user && user.id === window.ADMIN_USER_ID;
};

window.signOut = async function() {
    await window.supabaseClient.auth.signOut();
    window.location.href = 'login.html';
};

// --- GESTIONE ATLETI (Generica + Evento) ---
window.fetchAthletes = async function(filterEventId = null) {
    try {
        const user = await window.checkAuth();
        if (!user) return;

        // Recupero ID società dell'utente loggato
        const { data: society } = await window.supabaseClient.from('societa').select('id').eq('user_id', user.id).single();
        if (!society) return;

        let athletesData = [];

        if (filterEventId) {
            // Visualizzazione filtrata per evento
            const { data, error } = await window.supabaseClient
                .from('iscrizioni_eventi')
                .select('atleti (*), eventi (nome)')
                .eq('evento_id', filterEventId);
            
            if (data) {
                athletesData = data
                    .filter(sub => sub.atleti && sub.atleti.society_id === society.id)
                    .map(sub => ({ ...sub.atleti, iscritti_evento_nome: sub.eventi.nome }));
            }
        } else {
            // GESTIONE ATLETI GENERICA (Senza filtro)
            const { data } = await window.supabaseClient
                .from('atleti')
                .select('*')
                .eq('society_id', society.id);
            athletesData = data || [];
        }

        const list = document.getElementById('athleteList');
        if (list) {
            list.innerHTML = '';
            athletesData.forEach(a => {
                const row = list.insertRow();
                row.insertCell().textContent = a.first_name;
                row.insertCell().textContent = a.last_name || (a.is_team ? 'SQUADRA' : '-');
                row.insertCell().textContent = a.gender;
                row.insertCell().textContent = a.birthdate || 'N/A';
                row.insertCell().textContent = a.belt;
                row.insertCell().textContent = a.classe;
                row.insertCell().textContent = a.specialty;
                row.insertCell().textContent = a.weight_category || a.team_members || '-';
                row.insertCell().textContent = a.society_id;
                
                const status = row.insertCell();
                status.innerHTML = a.iscritti_evento_nome 
                    ? `<span class="badge badge-success">Iscritto: ${a.iscritti_evento_nome}</span>` 
                    : `<span class="badge badge-secondary">In Anagrafica</span>`;

                const actions = row.insertCell();
                actions.innerHTML = `<button class="btn btn-danger btn-sm" onclick="removeAthlete('${a.id}', this.parentElement.parentElement)">Elimina</button>`;
            });
        }
    } catch (err) { console.error(err); }
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
