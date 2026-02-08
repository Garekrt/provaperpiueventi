/**
 * SCRIPT2.JS - Logica Avanzata, Admin e Iscrizioni
 */

//================================================================================
// 1. FUNZIONI DI VISUALIZZAZIONE E POPOLAMENTO (NUOVE)
//================================================================================

// Mostra o nasconde le sezioni admin in base all'ID utente
window.showAdminSection = async function() {
    try {
        const isAdmin = await window.isCurrentUserAdmin();
        const adminDiv = document.getElementById('adminEventCreation');
        const limitsDiv = document.getElementById('adminLimitsConfig');

        if (isAdmin) {
            if (adminDiv) adminDiv.style.display = 'block';
            if (limitsDiv) limitsDiv.style.display = 'block';
            console.log("Modalità Amministratore Attivata");
        } else {
            if (adminDiv) adminDiv.style.display = 'none';
            if (limitsDiv) limitsDiv.style.display = 'none';
        }
    } catch (err) {
        console.error("Errore showAdminSection:", err);
    }
};

// Popola i menu a tendina degli eventi
window.populateEventSelector = async function(elementId) {
    try {
        const { data: eventi, error } = await window.supabaseClient
            .from('eventi')
            .select('*')
            .order('data_evento', { ascending: true });

        const selector = document.getElementById(elementId);
        if (selector && eventi) {
            selector.innerHTML = '<option value="">-- Seleziona un Evento --</option>';
            eventi.forEach(ev => {
                const opt = document.createElement('option');
                opt.value = ev.id;
                opt.textContent = ev.nome;
                selector.appendChild(opt);
            });
        }
    } catch (err) {
        console.error("Errore populateEventSelector:", err);
    }
};

// Calcolo automatico Classe e Categoria basato sull'anno di nascita
window.calculateAthleteAttributes = function(birthDate, gender) {
    if (!birthDate || !gender) return;
    
    const birthYear = new Date(birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    let classe = "";
    // Esempio logica classi (personalizzala se necessario)
    if (age <= 10) classe = "BAMBINI";
    else if (age <= 12) classe = "Fanciulli";
    else if (age <= 14) classe = "Ragazzi";
    else if (age <= 16) classe = "Esordienti";
    else if (age <= 18) classe = "Cadetti";
    else classe = "Senior";

    const classeInput = document.getElementById('classe');
    if (classeInput) classeInput.value = classe;
};

//================================================================================
// 2. GESTIONE LIMITI (Tua logica originale integrata)
//================================================================================

async function getMaxAthletesForSpecialty(specialty, eventId = null) {
    const isKidsSpecialty = specialty === "Percorso-Palloncino" || specialty === "Percorso-Kata" || specialty === "Palloncino";
    const key = isKidsSpecialty ? 'KIDS' : specialty;

    if (eventId) {
        try {
            const { data, error } = await window.supabaseClient
                .from('limiti_evento')
                .select('limite_max')
                .eq('evento_id', eventId)
                .in('specialty', [key])
                .single();
            
            if (data) return data.limite_max;
        } catch (e) { return 1000; }
    }
    return 1000; 
}

//================================================================================
// 3. AGGIUNTA ATLETI E SQUADRE (Tua logica originale)
//================================================================================

async function addAthlete() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');

    if (!eventId) {
        alert("Seleziona prima un evento dalla pagina di selezione!");
        return;
    }

    const first_name = document.getElementById('first_name').value;
    const last_name = document.getElementById('last_name').value;
    const gender = document.getElementById('gender').value;
    const birthdate = document.getElementById('birthdate').value;
    const belt = document.getElementById('belt').value;
    const classe = document.getElementById('classe').value;
    const specialty = document.getElementById('specialty').value;
    const weight_category = document.getElementById('weight_category').value;

    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        const { data: society } = await window.supabaseClient.from('societa').select('id').eq('user_id', user.id).single();

        // Inserimento Atleta
        const { data: athlete, error: aError } = await window.supabaseClient
            .from('atleti')
            .insert([{
                first_name, last_name, gender, birthdate, belt, 
                classe, specialty, weight_category, society_id: society.id
            }])
            .select()
            .single();

        if (aError) throw aError;

        // Iscrizione all'evento
        const { error: iError } = await window.supabaseClient
            .from('iscrizioni_eventi')
            .insert([{ athlete_id: athlete.id, evento_id: eventId }]);

        if (iError) throw iError;

        alert("Atleta iscritto con successo!");
        window.fetchAthletes(eventId); // Aggiorna la tabella
        document.getElementById('athleteForm').reset();
    } catch (err) {
        alert("Errore: " + err.message);
    }
}

async function handleCreateEvent() {
    const nome = document.getElementById('eventName').value;
    const data_evento = document.getElementById('eventDate').value;
    const luogo = document.getElementById('eventLocation').value;

    const { error } = await window.supabaseClient
        .from('eventi')
        .insert([{ nome, data_evento, luogo }]);

    if (error) alert("Errore creazione evento: " + error.message);
    else {
        alert("Evento creato!");
        location.reload();
    }
}

//================================================================================
// 4. INIZIALIZZAZIONE DOM
//================================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Calcoli automatici
    const birthdateInput = document.getElementById('birthdate');
    const genderSelect = document.getElementById('gender');
    
    if (birthdateInput && genderSelect) {
        const recalculate = () => window.calculateAthleteAttributes(birthdateInput.value, genderSelect.value);
        birthdateInput.addEventListener('change', recalculate);
        genderSelect.addEventListener('change', recalculate);
    }

    // Listener Form Atleta
    const athleteForm = document.getElementById('athleteForm');
    if (athleteForm) {
        athleteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addAthlete();
        });
    }

    // Listener Form Evento (Admin)
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleCreateEvent();
        });
    }
    
    // Attivazione sezioni Admin
    await window.showAdminSection();
});
