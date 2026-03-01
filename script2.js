// Costanti e configurazione iniziale
const ADMIN_ID = "f5c8f562-6178-4956-89ff-a6d1e3b32514"; [cite: 32]

// 1. Funzione Logout Universale
async function handleLogout() {
    await sb.auth.signOut(); [cite: 32]
    window.location.href = 'index.html'; [cite: 32]
} [cite: 33]

// 2. Aggiornamento dinamico dei pesi e delle specialità
function updateWeights() {
    const classe = document.getElementById('classe').value; [cite: 33]
    const specialty = document.getElementById('specialty').value; [cite: 33]
    const gender = document.getElementById('gender').value; [cite: 33]
    const w = document.getElementById('weightCategory'); [cite: 34]

    if (specialty === "Kata") {
        w.innerHTML = '<option value="N/A">N/A</option>'; [cite: 34]
        w.disabled = true; [cite: 35]
    } else {
        w.disabled = false; [cite: 35]
        let options = classe === "Esordienti"  [cite: 36]
            ? (gender === "M" ? "-38,-45,+45" : "-35,-42,+42")  [cite: 37]
            : "Open"; [cite: 37]
        w.innerHTML = options.split(',').map(o => `<option value="${o}">${o}kg</option>`).join(''); [cite: 38]
    }
}

// 3. FUNZIONE ELIMINA ISCRIZIONE (Aggiunta per completare la base zero)
async function deleteReg(regId) {
    if (confirm("Sei sicuro di voler eliminare questa iscrizione?")) {
        const { error } = await sb
            .from('iscrizioni_eventi')
            .delete()
            .eq('id', regId); [cite: 40, 122]

        if (error) {
            alert("Errore durante l'eliminazione: " + error.message);
        } else {
            alert("Iscrizione eliminata con successo!");
            fetchRegistrations(); // Ricarica la lista senza ricaricare la pagina
        }
    }
}

// 4. Caricamento degli atleti iscritti alla gara selezionata
async function fetchRegistrations() {
    const eventId = new URLSearchParams(window.location.search).get('event_id'); [cite: 38]
    if (!eventId) { 
        document.getElementById('lockOverlay').style.display = 'block';  [cite: 39]
        return; 
    }

    const { data: iscritti } = await sb.from('iscrizioni_eventi').select('id, atleti(*)').eq('evento_id', eventId); [cite: 39]
    const container = document.getElementById('registrationsList'); [cite: 40]
    document.getElementById('counter').innerText = iscritti.length; [cite: 40]
    
    container.innerHTML = iscritti.map(i => `
        <tr>
            <td>${i.atleti.last_name} ${i.atleti.first_name}</td>
            <td>${i.atleti.classe}</td>
            <td>${i.atleti.weight_category}</td>
            <td><button class="btn btn-danger btn-sm" onclick="deleteReg('${i.id}')">Elimina</button></td>
        </tr>`).join(''); [cite: 40]
}

// 5. Gestione invio modulo iscrizione atleta
document.getElementById('athleteForm').addEventListener('submit', async (e) => {
    e.preventDefault(); [cite: 41]
    const eventId = new URLSearchParams(window.location.search).get('event_id'); [cite: 41]
    const { data: { user } } = await sb.auth.getUser(); [cite: 41]

    const athlete = {
        first_name: document.getElementById('firstName').value, [cite: 41]
        last_name: document.getElementById('lastName').value, [cite: 41]
        birthdate: document.getElementById('birthdate').value, [cite: 41]
        classe: document.getElementById('classe').value, [cite: 41]
        weight_category: document.getElementById('weightCategory').value, [cite: 41]
        created_by: user.id [cite: 41]
    };

    // Inserimento atleta e successiva iscrizione all'evento
    const { data: newAtleta } = await sb.from('atleti').insert([athlete]).select().single(); [cite: 41, 42]
    await sb.from('iscrizioni_eventi').insert([{ atleta_id: newAtleta.id, evento_id: eventId }]); [cite: 42]
    
    alert("Atleta iscritto correttamente!");
    location.reload(); [cite: 42]
});

// 6. Calcolo automatico della classe in base alla data di nascita
document.getElementById('birthdate').addEventListener('change', (e) => {
    const year = new Date(e.target.value).getFullYear(); [cite: 43]
    document.getElementById('classe').value = year >= 2012 ? "Esordienti" : "Senior"; [cite: 43]
    updateWeights(); [cite: 43]
});

// 7. Inizializzazione pagina e controllo autenticazione
document.addEventListener('DOMContentLoaded', () => {
    sb.auth.getUser().then(({data}) => { 
        if(!data.user) {
            window.location.href = 'index.html';  [cite: 44]
        } else {
            fetchRegistrations();  [cite: 44]
        }
    });
}); [cite: 44]
