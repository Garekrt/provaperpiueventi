/**
 * script2.js - Gestione Iscrizioni e Griglia
 */

// 1. Calcolo automatico Classe
function handleBirthDateChange() {
    const bDate = document.getElementById('birthdate').value;
    if (!bDate) return;

    const year = new Date(bDate).getFullYear();
    let classe = "";
    
    if (year >= 2020) classe = "Bambini U6";
    else if (year >= 2018) classe = "Bambini U8";
    else if (year >= 2016) classe = "Fanciulli";
    else if (year >= 2014) classe = "Ragazzi";
    else if (year >= 2012) classe = "Esordienti";
    else if (year >= 2010) classe = "Cadetti";
    else if (year >= 2008) classe = "Juniores";
    else if (year >= 1990) classe = "Seniores";
    else classe = "Master";

    document.getElementById('classe').value = classe;
    updateSpecialties(classe);
}

function updateSpecialties(classe) {
    const s = document.getElementById('specialty');
    s.innerHTML = classe.includes("Bambini") 
        ? `<option value="Percorso">Percorso</option><option value="Kata">Kata</option>`
        : `<option value="Kata">Kata</option><option value="Kumite">Kumite</option>`;
}

// 2. FUNZIONE PER CARICARE LA GRIGLIA
async function fetchRegistrations() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');
    const container = document.getElementById('registrationsList');
    const counter = document.getElementById('counter');

    if (!eventId) return;

    // Recupera iscrizioni + dati atleti con una join (Supabase syntax)
    const { data: iscrizioni, error } = await supabaseClient
        .from('iscrizioni_eventi')
        .select(`
            id,
            atleti ( id, first_name, last_name, classe, specialty, belt )
        `)
        .eq('evento_id', eventId);

    if (error) {
        console.error("Errore fetch:", error);
        return;
    }

    container.innerHTML = '';
    counter.innerText = iscrizioni.length;

    iscrizioni.forEach(item => {
        const a = item.atleti;
        container.innerHTML += `
            <tr>
                <td><strong>${a.last_name} ${a.first_name}</strong></td>
                <td><span class="badge bg-info text-dark">${a.classe}</span></td>
                <td>${a.specialty}</td>
                <td>${a.belt}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-danger" onclick="deleteRegistration('${item.id}')">Elimina</button>
                </td>
            </tr>`;
    });
}

// 3. INVIO NUOVO ATLETA
async function handleFormSubmit(e) {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');

    if (!eventId) return alert("Errore: Nessun evento selezionato!");

    const athleteData = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        birthdate: document.getElementById('birthdate').value,
        gender: document.getElementById('gender').value,
        classe: document.getElementById('classe').value,
        specialty: document.getElementById('specialty').value,
        belt: document.getElementById('belt').value
    };

    // Inserisci atleta
    const { data: newAtleta, error: errA } = await supabaseClient
        .from('atleti')
        .insert([athleteData])
        .select()
        .single();

    if (errA) return alert("Errore inserimento atleta: " + errA.message);

    // Collega atleta all'evento
    const { error: errI } = await supabaseClient
        .from('iscrizioni_eventi')
        .insert([{ atleta_id: newAtleta.id, evento_id: eventId }]);

    if (errI) return alert("Errore iscrizione evento: " + errI.message);

    alert("Iscrizione completata!");
    document.getElementById('athleteForm').reset();
    fetchRegistrations(); // Aggiorna la griglia senza ricaricare la pagina
}

// 4. ELIMINA ISCRIZIONE
async function deleteRegistration(id) {
    if (!confirm("Sei sicuro di voler eliminare questa iscrizione?")) return;
    
    const { error } = await supabaseClient
        .from('iscrizioni_eventi')
        .delete()
        .eq('id', id);

    if (error) alert("Errore eliminazione");
    else fetchRegistrations();
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    fetchRegistrations();
    document.getElementById('birthdate').addEventListener('change', handleBirthDateChange);
    document.getElementById('athleteForm').addEventListener('submit', handleFormSubmit);
});
