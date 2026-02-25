async function fetchEvents() {
    const container = document.getElementById('eventsList');
    if (!container) return;

    const { data: eventi, error } = await supabase.from('eventi').select('*');
    if (error) return console.error(error);

    container.innerHTML = '';
    eventi.forEach(event => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${event.nome}</td>
            <td>${new Date(event.data_evento).toLocaleDateString()}</td>
            <td><button class="btn btn-sm btn-success" onclick="goToAthleteManager('${event.id}')">Seleziona</button></td>
        `;
        container.appendChild(row);
    });
}

// FUNZIONE GLOBALE DI NAVIGAZIONE
function goToAthleteManager(eventId) {
    if (!eventId || eventId === 'null') {
        window.location.href = 'athlete_manager.html';
    } else {
        window.location.href = `athlete_manager.html?event_id=${eventId}`;
    }
}

document.addEventListener('DOMContentLoaded', fetchEvents);
