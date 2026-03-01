// script2.js
const ADMIN_ID = "f5c8f562-6178-4956-89ff-a6d1e3b32514";

async function fetchRegistrations() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');
    const container = document.getElementById('registrationsList');
    if (!eventId || !container) return;

    // Recupera l'utente attuale
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    let query = supabaseClient
        .from('iscrizioni_eventi')
        .select(`id, atleti ( first_name, last_name, classe, specialty, belt, created_by )`)
        .eq('evento_id', eventId);

    // Se non è l'admin, filtra solo per gli atleti creati dall'utente loggato
    if (user.id !== ADMIN_ID) {
        // Nota: Assicurati che nella tabella 'atleti' ci sia la colonna 'created_by'
        query = query.eq('atleti.created_by', user.id);
    }

    const { data: iscrizioni, error } = await query;

    if (error) return console.error(error);

    container.innerHTML = '';
    document.getElementById('counter').innerText = iscrizioni.length;

    iscrizioni.forEach(item => {
        const a = item.atleti;
        if(!a) return; // Salta se i dati atleta sono mancanti
        container.innerHTML += `
            <tr>
                <td><strong>${a.last_name} ${a.first_name}</strong></td>
                <td><span class="badge bg-secondary">${a.classe}</span></td>
                <td>${a.specialty}</td>
                <td>${a.belt}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteRegistration('${item.id}')">Elimina</button>
                </td>
            </tr>`;
    });
}

// Funzione per eliminare iscrizione
async function deleteRegistration(id) {
    if(confirm("Vuoi cancellare questa iscrizione?")) {
        await supabaseClient.from('iscrizioni_eventi').delete().eq('id', id);
        fetchRegistrations();
    }
}

// Calcolo classe automatica (già esistente nel tuo codice)
function updateClass() {
    const bDate = document.getElementById('birthdate').value;
    if (!bDate) return;
    const year = new Date(bDate).getFullYear();
    let classe = year >= 2012 ? "Esordienti" : (year >= 2010 ? "Cadetti" : "Master/Senior");
    document.getElementById('classe').value = classe;
    
    const spec = document.getElementById('specialty');
    spec.innerHTML = `<option value="Kata">Kata</option><option value="Kumite">Kumite</option>`;
}

// Invio Form
document.getElementById('athleteForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');
    const { data: { user } } = await supabaseClient.auth.getUser();

    const athlete = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        birthdate: document.getElementById('birthdate').value,
        gender: document.getElementById('gender').value,
        classe: document.getElementById('classe').value,
        specialty: document.getElementById('specialty').value,
        belt: document.getElementById('belt').value,
        created_by: user.id // Salviamo chi ha creato l'atleta
    };

    const { data: newAtleta, error: errA } = await supabaseClient.from('atleti').insert([athlete]).select().single();
    
    if (newAtleta) {
        await supabaseClient.from('iscrizioni_eventi').insert([{ 
            atleta_id: newAtleta.id, 
            evento_id: eventId 
        }]);
        fetchRegistrations();
        e.target.reset();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    fetchRegistrations();
    document.getElementById('birthdate').addEventListener('change', updateClass);
});
