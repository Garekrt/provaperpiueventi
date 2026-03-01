const ADMIN_ID = "f5c8f562-6178-4956-89ff-a6d1e3b32514";

async function init() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    if (user.id === ADMIN_ID) {
        const btn = document.getElementById('adminAddEventBtn');
        if (btn) btn.style.display = 'block';
    }
    fetchEvents();
}

async function fetchEvents() {
    const { data: gare, error } = await sb.from('eventi').select('*').order('data_evento', { ascending: true });
    const list = document.getElementById('eventsList');
    if (!list) return;

    if (error) {
        list.innerHTML = '<tr><td colspan="3">Errore nel caricamento gare.</td></tr>';
        return;
    }

    list.innerHTML = gare.map(g => `
        <tr>
            <td>${g.nome}</td>
            <td>${new Date(g.data_evento).toLocaleDateString('it-IT')}</td>
            <td class="text-end">
                <button class="btn btn-primary btn-sm" onclick="location.href='athlete_manager.html?event_id=${g.id}'">Seleziona</button>
            </td>
        </tr>
    `).join('');
}

document.getElementById('addEventForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nuovoEvento = {
        nome: document.getElementById('eventTitle').value,
        data_evento: document.getElementById('eventDate').value,
        luogo: document.getElementById('eventLocation').value
    };

    const { error } = await sb.from('eventi').insert([nuovoEvento]);

    if (error) {
        alert("Errore durante il salvataggio: " + error.message);
    } else {
        alert("Gara aggiunta con successo!");
        location.reload();
    }
});

document.addEventListener('DOMContentLoaded', init);
