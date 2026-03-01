const ADMIN_ID = "f5c8f562-6178-4956-89ff-a6d1e3b32514";

// 1. Funzione Logout
async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}

// 2. Inizializzazione e Protezione
async function initPage() {
    // Verifichiamo l'utente
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (!user || error) {
        window.location.href = 'index.html';
        return;
    }

    // Se è admin (tu), mostra il tasto aggiunta
    if (user.id === ADMIN_ID) {
        document.getElementById('adminAddEventBtn').style.display = 'block';
    }

    // Carica la tabella
    await fetchEvents();
}

// 3. Caricamento Eventi
async function fetchEvents() {
    const container = document.getElementById('eventsList');
    const { data: gare, error } = await supabase
        .from('eventi')
        .select('*')
        .order('data_evento', { ascending: true });

    if (error) {
        console.error("Errore:", error);
        container.innerHTML = '<tr><td colspan="4 text-center">Errore nel caricamento.</td></tr>';
        return;
    }

    container.innerHTML = '';
    gare.forEach(g => {
        container.innerHTML += `
            <tr>
                <td><strong>${g.nome}</strong></td>
                <td>${new Date(g.data_evento).toLocaleDateString('it-IT')}</td>
                <td>${g.luogo || 'N/D'}</td>
                <td class="text-end">
                    <button class="btn btn-primary btn-sm" onclick="goToAthleteManager('${g.id}')">Seleziona</button>
                </td>
            </tr>`;
    });
}

// 4. Aggiunta Nuovo Evento
document.getElementById('addEventForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nuovoEvento = {
        nome: document.getElementById('eventTitle').value,
        data_evento: document.getElementById('eventDate').value,
        luogo: document.getElementById('eventLocation').value
    };

    const { error } = await supabase.from('eventi').insert([nuovoEvento]);

    if (error) {
        alert("Errore: " + error.message);
    } else {
        alert("Gara creata!");
        location.reload();
    }
});

function goToAthleteManager(eventId) {
    window.location.href = `athlete_manager.html?event_id=${eventId}`;
}

// Avvia tutto al caricamento
document.addEventListener('DOMContentLoaded', initPage);
