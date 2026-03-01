// script2.js
const ADMIN_ID = "f5c8f562-6178-4956-89ff-a6d1e3b32514";

async function handleLogout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

// Inizializzazione con protezione
async function initManager() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Una volta confermato l'utente, carichiamo la griglia
    fetchRegistrations();
}

async function fetchRegistrations() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');
    const container = document.getElementById('registrationsList');
    if (!eventId || !container) return;

    const { data: { user } } = await supabaseClient.auth.getUser();

    // Query con JOIN sulla tabella atleti
    let query = supabaseClient
        .from('iscrizioni_eventi')
        .select(`
            id,
            atleti ( id, first_name, last_name, classe, specialty, belt, created_by, weight_category )
        `)
        .eq('evento_id', eventId);

    // Se non sei l'admin, vedi solo i TUOI atleti
    if (user.id !== ADMIN_ID) {
        query = query.eq('atleti.created_by', user.id);
    }

    const { data: iscrizioni, error } = await query;

    if (error) {
        console.error("Errore fetch:", error);
        container.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Errore nel caricamento dei dati</td></tr>';
        return;
    }

    container.innerHTML = '';
    document.getElementById('counter').innerText = iscrizioni.length;

    iscrizioni.forEach(item => {
        const a = item.atleti;
        if (!a) return; 
        
        container.innerHTML += `
            <tr>
                <td><strong>${a.last_name} ${a.first_name}</strong></td>
                <td><span class="badge bg-secondary">${a.classe}</span></td>
                <td>${a.specialty}</td>
                <td>${a.weight_category || 'N/A'}</td>
                <td>${a.belt}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteRegistration('${item.id}')">Elimina</button>
                </td>
            </tr>`;
    });
}

// Funzione eliminazione
async function deleteRegistration(id) {
    if (!confirm("Cancellare questa iscrizione?")) return;
    const { error } = await supabaseClient.from('iscrizioni_eventi').delete().eq('id', id);
    if (!error) fetchRegistrations();
}

// Logica Pesi (Ripristinata)
function handleDataChange() {
    const bDate = document.getElementById('birthdate').value;
    const gender = document.getElementById('gender').value;
    const specialty = document.getElementById('specialty').value;
    if (!bDate) return;

    const year = new Date(bDate).getFullYear();
    let classe = year >= 2012 ? "Esordienti" : (year >= 2010 ? "Cadetti" : "Senior");
    document.getElementById('classe').value = classe;

    const w = document.getElementById('weightCategory');
    if (specialty === "Kumite") {
        w.disabled = false;
        w.innerHTML = '<option value="-40">-40kg</option><option value="-50">-50kg</option><option value="+50">+50kg</option>';
    } else {
        w.disabled = true;
        w.innerHTML = '<option value="N/A">N/A</option>';
    }
}

// Avvio
document.addEventListener('DOMContentLoaded', () => {
    initManager();
    document.getElementById('birthdate')?.addEventListener('change', handleDataChange);
    document.getElementById('specialty')?.addEventListener('change', handleDataChange);
});
