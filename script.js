// script.js
const ADMIN_ID = "f5c8f562-6178-4956-89ff-a6d1e3b32514";

// 1. Gestione Logout
async function handleLogout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

// 2. Controllo Utente e Inizializzazione
async function initPage() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    if (!user || error) {
        window.location.href = 'index.html';
        return;
    }

    // Se è admin, mostra il tasto per creare eventi
    if (user.id === ADMIN_ID) {
        const btn = document.getElementById('adminAddEventBtn');
        if (btn) btn.style.display = 'inline-block';
    }

    // Solo ora carichiamo gli eventi
    fetchEvents();
}

async function fetchEvents() {
    const container = document.getElementById('eventsList');
    if (!container) return;

    const { data: gare, error } = await supabaseClient
        .from('eventi')
        .select('*')
        .order('data_evento', { ascending: true });

    if (error) {
        console.error("Errore download eventi:", error);
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

function goToAthleteManager(eventId) {
    window.location.href = eventId ? `athlete_manager.html?event_id=${eventId}` : 'athlete_manager.html';
}

// Avvio
document.addEventListener('DOMContentLoaded', initPage);
