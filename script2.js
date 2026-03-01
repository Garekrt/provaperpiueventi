// script2.js
const ADMIN_ID = "f5c8f562-6178-4956-89ff-a6d1e3b32514";

// --- 1. CONTROLLO EVENTO OBBLIGATORIO ---
function checkEventSelected() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');
    const form = document.getElementById('athleteForm');
    const overlay = document.getElementById('lockOverlay');

    if (!eventId || eventId === 'null') {
        if (form) form.style.opacity = "0.3";
        if (form) form.style.pointerEvents = "none"; // Disabilita click
        if (overlay) overlay.style.display = "block";
        return null;
    }
    return eventId;
}

// --- 2. LOGICA VECCHIA PESI (dal tuo script2.txt) ---
function updateWeights(classe, gender, specialty) {
    const w = document.getElementById('weightCategory');
    if (!w) return;

    if (specialty === "Kata" || specialty.includes("Percorso")) {
        w.innerHTML = '<option value="N/A">N/A (Kata)</option>';
        w.disabled = true;
        return;
    }

    w.disabled = false;
    let options = "";

    if (classe === "Esordienti") {
        options = gender === "M" 
            ? "-38,-43,-48,-53,-58,-63,-68,+68" 
            : "-35,-42,-47,-54,-62,+62";
    } else if (classe === "Cadetti") {
        options = gender === "M" 
            ? "-47,-52,-57,-63,-70,+70" 
            : "-42,-47,-54,-61,+61";
    } else {
        options = "Open";
    }

    w.innerHTML = options.split(',').map(o => `<option value="${o}">${o} kg</option>`).join('');
}

// --- 3. AGGIORNAMENTO AUTOMATICO ---
function handleDataChange() {
    const bDate = document.getElementById('birthdate').value;
    const gender = document.getElementById('gender').value;
    if (!bDate) return;

    const year = new Date(bDate).getFullYear();
    let classe = "";
    
    // Tua vecchia logica classi
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

    // Aggiorna specialità
    const s = document.getElementById('specialty');
    const oldVal = s.value;
    s.innerHTML = classe.includes("Bambini") 
        ? `<option value="Percorso">Percorso</option><option value="Kata">Kata</option>`
        : `<option value="Kata">Kata</option><option value="Kumite">Kumite</option>`;
    
    if (oldVal) s.value = oldVal;

    updateWeights(classe, gender, s.value);
}

// --- 4. INVIO DATI ---
document.getElementById('athleteForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const eventId = checkEventSelected();
    if (!eventId) return; // Blocco ulteriore di sicurezza

    const { data: { user } } = await supabaseClient.auth.getUser();

    const athlete = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        birthdate: document.getElementById('birthdate').value,
        gender: document.getElementById('gender').value,
        classe: document.getElementById('classe').value,
        specialty: document.getElementById('specialty').value,
        belt: document.getElementById('belt').value,
        weight_category: document.getElementById('weightCategory').value, // Nuovo campo
        created_by: user.id
    };

    const { data: newAtleta, error: errA } = await supabaseClient.from('atleti').insert([athlete]).select().single();
    
    if (newAtleta) {
        await supabaseClient.from('iscrizioni_eventi').insert([{ 
            atleta_id: newAtleta.id, 
            evento_id: eventId 
        }]);
        alert("Atleta Iscritto con successo!");
        location.reload(); 
    } else {
        alert("Errore: " + errA.message);
    }
});

// --- 5. INIZIALIZZAZIONE ---
document.addEventListener('DOMContentLoaded', () => {
    checkEventSelected();
    
    const bDateInput = document.getElementById('birthdate');
    const genderInput = document.getElementById('gender');
    const specialtyInput = document.getElementById('specialty');

    bDateInput?.addEventListener('change', handleDataChange);
    genderInput?.addEventListener('change', handleDataChange);
    specialtyInput?.addEventListener('change', handleDataChange);
});
