const ALLOWED_ADMINS = ["f5c8f562-6178-4956-89ff-a6d1e3b32514"];

async function init() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { window.location.href = 'index.html'; return; }

    if (ALLOWED_ADMINS.includes(user.id)) {
        const adminBtn = document.getElementById('adminAddEventBtn');
        if (adminBtn) adminBtn.style.display = 'block';
        
        const nav = document.querySelector('.navbar .container');
        if (nav && !document.getElementById('dashBtn')) {
            const btn = document.createElement('button');
            btn.id = 'dashBtn';
            btn.className = 'btn btn-warning btn-sm ms-2';
            btn.innerText = 'Dashboard Globale';
            btn.onclick = () => window.location.href = 'admin_dashboard.html';
            nav.appendChild(btn);
        }
    }
    fetchEvents();
}

async function fetchEvents() {
    const { data: gare } = await sb.from('eventi').select('*').order('data_evento');
    const list = document.getElementById('eventsList');
    if (list) {
        list.innerHTML = (gare || []).map(g => `
            <tr>
                <td>${g.nome}</td>
                <td>${new Date(g.data_evento).toLocaleDateString()}</td>
                <td class="text-end"><button class="btn btn-primary btn-sm" onclick="location.href='athlete_manager.html?event_id=${g.id}'">Seleziona</button></td>
            </tr>`).join('');
    }
}

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

document.addEventListener('DOMContentLoaded', init);
