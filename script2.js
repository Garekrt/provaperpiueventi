var supabase = window.supabaseClient;

//================================================================================
// 1. CALCOLO AUTOMATICO ATTRIBUTI
//================================================================================
window.calculateAthleteAttributes = function(birthDate, gender) {
    const birthYear = new Date(birthDate).getFullYear();
    const classeSelect = document.getElementById('classe');
    const specialtySelect = document.getElementById('specialty');
    const beltSelect = document.getElementById('belt');
    const weightField = document.getElementById('weightCategory');

    if (!classeSelect) return;

    let currentClasse = "Master";
    if (birthYear >= 2018 && birthYear <= 2019) currentClasse = "Bambini U8";
    else if (birthYear >= 2020 && birthYear <= 2021) currentClasse = "Bambini U6";
    else if (birthYear >= 2016 && birthYear <= 2017) currentClasse = "Fanciulli";
    else if (birthYear >= 2014 && birthYear <= 2015) currentClasse = "Ragazzi";
    else if (birthYear >= 2012 && birthYear <= 2013) currentClasse = "Esordienti";
    else if (birthYear >= 2010 && birthYear <= 2011) currentClasse = "Cadetti";
    else if (birthYear >= 2008 && birthYear <= 2009) currentClasse = "Juniores";
    else if (birthYear >= 1990 && birthYear <= 2007) currentClasse = "Seniores";

    classeSelect.innerHTML = `<option value="${currentClasse}">${currentClasse}</option>`;

    // Specialità
    specialtySelect.innerHTML = currentClasse.includes("Bambini") 
        ? `<option value="Percorso-Kata">Percorso-Kata</option><option value="Percorso-Palloncino">Percorso-Palloncino</option>`
        : `<option value="Kata">Kata</option><option value="Kumite">Kumite</option><option value="ParaKarate">ParaKarate</option>`;

    // Cinture
    beltSelect.innerHTML = `<option value="Gialla">Gialla</option><option value="Arancio-Verde">Arancio-Verde</option><option value="Blu-Marrone">Blu-Marrone</option><option value="Marrone-Nera">Marrone-Nera</option>`;
};

//================================================================================
// 2. AGGIUNTA ATLETI E SQUADRE
//================================================================================
window.addAthlete = async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');
    if (!eventId) { alert("Seleziona un evento prima!"); return; }

    const user = await window.checkAuth();
    const { data: soc } = await supabase.from('societa').select('id').eq('user_id', user.id).single();

    const payload = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        gender: document.getElementById('gender').value,
        birthdate: document.getElementById('birthdate').value,
        classe: document.getElementById('classe').value,
        specialty: document.getElementById('specialty').value,
        weight_category: document.getElementById('weightCategory').value || null,
        belt: document.getElementById('belt').value,
        society_id: soc.id,
        is_team: false
    };

    const { data: newAtleta, error } = await supabase.from('atleti').insert([payload]).select().single();
    if (error) alert("Errore: " + error.message);
    else {
        await supabase.from('iscrizioni_eventi').insert([{ atleta_id: newAtleta.id, evento_id: eventId }]);
        alert("Atleta Iscritto!");
        fetchAthletes(eventId);
    }
};

//================================================================================
// 3. LOGICA AMMINISTRATORE
//================================================================================
window.handleCreateEvent = async function() {
    const user = await window.checkAuth();
    if (user.id !== window.ADMIN_USER_ID) return;

    const eventData = {
        nome: document.getElementById("eventName").value,
        data_evento: document.getElementById("eventDate").value,
        luogo: document.getElementById("eventLocation").value,
        quota_iscrizione: parseFloat(document.getElementById("eventFee").value) || 0
    };

    const { error } = await supabase.from('eventi').insert([eventData]);
    if (error) alert("Errore creazione: " + error.message);
    else { alert("Evento Creato!"); location.reload(); }
};

//================================================================================
// 4. INIT LISTENERS
//================================================================================
document.addEventListener('DOMContentLoaded', async () => {
    const birthInput = document.getElementById('birthdate');
    const genderInput = document.getElementById('gender');
    
    if (birthInput) {
        birthInput.addEventListener('change', () => calculateAthleteAttributes(birthInput.value, genderInput.value));
    }

    const athleteForm = document.getElementById('athleteForm');
    if (athleteForm) {
        athleteForm.addEventListener('submit', (e) => { e.preventDefault(); addAthlete(); });
    }

    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', (e) => { e.preventDefault(); handleCreateEvent(); });
    }

    await fetchSocietyNameOnLoad();
    const eventId = new URLSearchParams(window.location.search).get('event_id');
    if (eventId) fetchAthletes(eventId);
});
