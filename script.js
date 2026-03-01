// script.js
function goToAthleteManager(eventId) {
    if (!eventId || eventId === 'null') {
        window.location.href = 'athlete_manager.html';
    } else {
        window.location.href = `athlete_manager.html?event_id=${eventId}`;
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
                    <button class="btn btn-primary" onclick="goToAthleteManager('${g.id}')">Seleziona</button>
                </td>
            </tr>`;
    });
}

document.addEventListener('DOMContentLoaded', fetchEvents);
