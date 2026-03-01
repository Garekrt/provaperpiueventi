const ADMIN_ID = "f5c8f562-6178-4956-89ff-a6d1e3b32514";

async function init() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    if (user.id === ADMIN_ID) {
        document.getElementById('adminAddEventBtn').style.display = 'block';
    }
    fetchEvents();
}

async function fetchEvents() {
    const { data: gare } = await sb.from('eventi').select('*').order('data_evento');
    const list = document.getElementById('eventsList');
    list.innerHTML = gare.map(g => `
        <tr>
            <td>${g.nome}</td>
            <td>${new Date(g.data_evento).toLocaleDateString()}</td>
            <td class="text-end"><button class="btn btn-primary btn-sm" onclick="location.href='athlete_manager.html?event_id=${g.id}'">Seleziona</button></td>
        </tr>
    `).join('');
}

document.addEventListener('DOMContentLoaded', init);
