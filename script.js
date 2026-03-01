const ADMIN_ID = "f5c8f562-6178-4956-89ff-a6d1e3b32514";

// 1. Funzione Logout
async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}

// 2. Inizializzazione e Protezione
async function initPage() {
    // Controllo se supabase è caricato
    if (typeof supabase === 'undefined') {
        console.error("Supabase non è caricato. Controlla l'ordine dei tag <script>.");
        return;
    }

    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (!user || error) {
        window.location.href = 'index.html';
        return;
    }

    // Mostra il tasto admin se l'ID corrisponde
    const adminBtn = document.getElementById('adminAddEventBtn');
    if (user.id === ADMIN_ID && adminBtn) {
        adminBtn.style.display = 'block';
    }

    // Carica gli eventi
    fetchEvents();
}

// 3. Caricamento Eventi
async function fetchEvents() {
    const container = document.getElementById('eventsList');
    if (!container) return;

    const { data: gare, error } = await supabase
        .from('eventi')
        .select('*')
        .order('data_evento', { ascending: true });

    if (error) {
        container.innerHTML = '<tr><td colspan="4" class="text-center">Errore nel caricamento dati.</td></tr>';
        return;
    }

    container.innerHTML = '';
    gare.forEach(g => {
        container.innerHTML += `
            <tr class="align-middle">
                <td><strong>${g.nome}</strong></td>
                <td>${new Date(g.data_evento).toLocaleDateString('it-IT')}</td>
                <td>${g.luogo || 'Da definire'}</td>
                <td class="text-end">
                    <button class="btn btn-primary btn-sm" onclick="goToAthleteManager('${g.id}')">Seleziona</button>
                </td>
            </tr>`;
    });
}

// 4. Creazione Evento (Admin)
document.getElementById('addEventForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nuovoEvento = {
        nome: document.getElementById('eventTitle').value,
        data_evento: document.getElementById('eventDate').value,
        luogo: document.getElementById('eventLocation').value
    };

    const { error } = await supabase.from('eventi').insert([nuovoEvento]);
    if (error) alert(error.message);
    else location.reload();
});

function goToAthleteManager(eventId) {
    window.location.href = `athlete_manager.html?event_id=${eventId}`;
}

document.addEventListener('DOMContentLoaded', initPage);
