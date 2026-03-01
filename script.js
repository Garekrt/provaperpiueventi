const ADMIN_ID = "f5c8f562-6178-4956-89ff-a6d1e3b32514";

// 1. Funzione Logout
async function handleLogout() {
    await sb.auth.signOut();
    window.location.href = 'index.html';
}

// 2. Inizializzazione e Protezione
async function initPage() {
    // Verifichiamo l'utente usando 'sb'
    const { data: { user }, error } = await sb.auth.getUser();
    
    if (!user || error) {
        window.location.href = 'index.html';
        return;
    }

    // Se è admin, mostra il tasto aggiunta
    const adminBtn = document.getElementById('adminAddEventBtn');
    if (user.id === ADMIN_ID && adminBtn) {
        adminBtn.style.display = 'block';
    }

    await fetchEvents();
}

// 3. Caricamento Eventi
async function fetchEvents() {
    const container = document.getElementById('eventsList');
    const { data: gare, error } = await sb
        .from('eventi')
        .select('*')
        .order('data_evento', { ascending: true });

    if (error) {
        container.innerHTML = '<tr><td colspan="4" class="text-center">Errore caricamento.</td></tr>';
        return;
    }

    container.innerHTML = '';
    gare.forEach(g => {
        container.innerHTML += `
            <tr class="align-middle">
                <td><strong>${g.nome}</strong></td>
                <td>${new Date(g.data_evento).toLocaleDateString('it-IT')}</td>
                <td>${g.luogo || 'N/D'}</td>
                <td class="text-end">
                    <button class="btn btn-primary btn-sm" onclick="goToAthleteManager('${g.id}')">Seleziona</button>
                </td>
            </tr>`;
    });
}

// 4. Aggiunta Evento
document.getElementById('addEventForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nuovo = {
        nome: document.getElementById('eventTitle').value,
        data_evento: document.getElementById('eventDate').value,
        luogo: document.getElementById('eventLocation').value
    };
    const { error } = await sb.from('eventi').insert([nuovo]);
    if (error) alert(error.message);
    else location.reload();
});

function goToAthleteManager(eventId) {
    window.location.href = `athlete_manager.html?event_id=${eventId}`;
}

document.addEventListener('DOMContentLoaded', initPage);
