// script.js
const ADMIN_ID = "f5c8f562-6178-4956-89ff-a6d1e3b32514";

function goToAthleteManager(eventId) {
    if (!eventId || eventId === 'null') {
        window.location.href = 'athlete_manager.html';
    } else {
        window.location.href = `athlete_manager.html?event_id=${eventId}`;
    }
}

async function checkAdminStatus() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user && user.id === ADMIN_ID) {
        const btn = document.getElementById('adminAddEventBtn');
        if (btn) btn.style.display = 'inline-block';
    }
}

async function fetchEvents() {
    const container = document.getElementById('eventsList');
    if (!container) return;

    const { data: gare, error } = await supabaseClient
        .from('eventi')
        .select('*')
        .order('data_evento', { ascending: true });

    if (error) {
        container.innerHTML = '<tr><td colspan="4">Errore caricamento dati.</td></tr>';
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

// Gestione invio nuovo evento
document.getElementById('addEventForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nuovoEvento = {
        nome: document.getElementById('eventTitle').value,
        data_evento: document.getElementById('eventDate').value,
        luogo: document.getElementById('eventLocation').value
    };

    const { error } = await supabaseClient.from('eventi').insert([nuovoEvento]);

    if (error) {
        alert("Errore durante il salvataggio: " + error.message);
    } else {
        alert("Evento creato con successo!");
        location.reload(); // Ricarica la lista
    }
});

document.addEventListener('DOMContentLoaded', () => {
    fetchEvents();
    checkAdminStatus();
});
