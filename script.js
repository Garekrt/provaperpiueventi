// Aggiungi questa costante in alto nel tuo script.js
const ALLOWED_ADMINS = ["f5c8f562-6178-4956-89ff-a6d1e3b32514", "ff995ba0-7587-4123-a747-0dfa8024ab1c"];

async function init() {const ADMIN_ID = "ff995ba0-7587-4123-a747-0dfa8024ab1c";

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
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { window.location.href = 'index.html'; return; }

    // Mostra tasto Nuova Gara e tasto Dashboard solo se Admin
    if (ALLOWED_ADMINS.includes(user.id)) {
        if (document.getElementById('adminAddEventBtn')) {
            document.getElementById('adminAddEventBtn').style.display = 'block';
        }
        
        // Aggiungiamo dinamicamente un tasto per la dashboard nella barra se siamo admin
        const navContainer = document.querySelector('.navbar .container');
        if (navContainer && !document.getElementById('adminDashBtn')) {
            const dashBtn = document.createElement('button');
            dashBtn.id = 'adminDashBtn';
            dashBtn.className = 'btn btn-warning btn-sm ms-2';
            dashBtn.innerText = 'Dashboard Globale';
            dashBtn.onclick = () => window.location.href = 'admin_dashboard.html';
            navContainer.insertBefore(dashBtn, navContainer.lastElementChild);
        }
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
