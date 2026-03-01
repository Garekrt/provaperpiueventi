const ADMIN_ID = "f5c8f562-6178-4956-89ff-a6d1e3b32514";

async function handleLogout() {
    await sb.auth.signOut();
    window.location.href = 'index.html';
}

async function initPage() {
    const { data: { user }, error } = await sb.auth.getUser();
    if (!user || error) {
        window.location.href = 'index.html';
        return;
    }
    if (user.id === ADMIN_ID) {
        document.getElementById('adminAddEventBtn').style.display = 'inline-block';
    }
    fetchEvents();
}

async function fetchEvents() {
    const { data: gare } = await sb.from('eventi').select('*').order('data_evento');
    const container = document.getElementById('eventsList');
    container.innerHTML = gare.map(g => `
        <tr>
            <td>${g.nome}</td>
            <td>${new Date(g.data_evento).toLocaleDateString()}</td>
            <td>${g.luogo}</td>
            <td class="text-end">
                <button class="btn btn-primary btn-sm" onclick="location.href='athlete_manager.html?event_id=${g.id}'">Seleziona</button>
            </td>
        </tr>`).join('');
}

document.getElementById('addEventForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nuovo = {
        nome: document.getElementById('eventTitle').value,
        data_evento: document.getElementById('eventDate').value,
        luogo: document.getElementById('eventLocation').value
    };
    await sb.from('eventi').insert([nuovo]);
    location.reload();
});

document.addEventListener('DOMContentLoaded', initPage);
