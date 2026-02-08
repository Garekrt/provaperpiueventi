// ASSUNZIONE: La variabile 'supabase' è ora window.supabaseClient definita in script.js.
// Vengono usati ADMIN_USER_ID, fetchAthletes, isCurrentUserAdmin da script.js via window.

//================================================================================
// 1. GESTIONE LIMITI E CONTEGGIO PER EVENTO
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
            
            if (error && error.code !== 'PGRST103') { 
                 console.warn(`[Limite non impostato]: Fallback a limite di default per ${key}.`);
            }
            
            if (data && data.limite_max !== undefined) {
                return data.limite_max;
            }
        } catch (e) {
             console.error(`[Errore critico in Limiti]`, e.message);
        }
    } 

    if (specialty === "Kata_Squadre" || specialty === "Kumite_Squadre") return 50; 
    if (key === "Kumite") return 6;
    if (key === "Kata") return 5;
    if (key === "ParaKarate") return 5;
    if (key === 'KIDS') return 5; 
    
    return Infinity;
}

async function getSpecialtyCount(specialty, eventId = null) {
    if (!eventId) return 0;
    
    const isKids = specialty === "Percorso-Palloncino" || specialty === "Percorso-Kata" || specialty === "Palloncino";
    const isTeamSpecialty = specialty === "Kata_Squadre" || specialty === "Kumite_Squadre"; 

    let specialtyList = isKids ? ["Percorso-Palloncino", "Percorso-Kata", "Palloncino"] : [specialty];

    let query = window.supabaseClient
        .from('iscrizioni_eventi')
        .select(`atleta_id, atleti!inner(specialty, is_team)`, { count: 'exact', head: true }) 
        .eq('evento_id', eventId)
        .in('atleti.specialty', specialtyList);
    
    query = isTeamSpecialty ? query.eq('atleti.is_team', true) : query.eq('atleti.is_team', false);
    
    const { count, error } = await query;
    return error ? 0 : (count || 0);
}

window.updateAllCounters = async function(eventId = null) {
    const specialties = ["Kumite", "Kata", "ParaKarate", "KIDS", "Kata_Squadre", "Kumite_Squadre"]; 
    const statsContainer = document.querySelector('.stats-container');
    const athleteForm = document.getElementById('athleteForm');

    if (!eventId) {
        if (statsContainer) statsContainer.style.display = 'none';
        return;
    }
    if (statsContainer) statsContainer.style.display = 'block';

    for (const specialty of specialties) {
        const countKey = specialty; 
        const specialtyToCount = (specialty === 'KIDS') ? 'Percorso-Palloncino' : specialty;
        const maxLimit = await getMaxAthletesForSpecialty(specialtyToCount, eventId);
        const count = await getSpecialtyCount(specialtyToCount, eventId);
        const displayElement = document.getElementById(`${countKey}AthleteCountDisplay`);
        
        if (displayElement) {
            displayElement.textContent = `${count} / ${maxLimit}`;
            displayElement.style.color = count >= maxLimit ? 'red' : 'green';
        }
    }
    
    if (typeof window.showAdminLimitsSection === 'function') {
        await window.showAdminLimitsSection(eventId); 
    }
};

//================================================================================
// 2. AGGIUNTA SQUADRA E ATLETA
//================================================================================

async function addTeam() {
    const teamName = document.getElementById('teamName').value;
    const teamSpecialty = document.getElementById('teamSpecialty').value; 
    const teamMembersText = document.getElementById('teamMembers').value;
    const teamClasse = document.getElementById('teamClasse').value;
    const teamBelt = document.getElementById('teamBelt').value;
    const teamGender = document.getElementById('teamGender').value;

    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');
    
    if (!eventId) return alert("Seleziona un evento.");

    const membersArray = teamMembersText.split(',').map(name => name.trim()).filter(name => name);
    if (membersArray.length < 3 || membersArray.length > 5) return alert("Squadra da 3 a 5 atleti.");
    
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    const { data: society } = await window.supabaseClient.from('societa').select('id').eq('user_id', user.id).single();

    const currentTeamCount = await getSpecialtyCount(teamSpecialty, eventId);
    const maxLimit = await getMaxAthletesForSpecialty(teamSpecialty, eventId);
    if (currentTeamCount >= maxLimit) return alert("Limite squadre raggiunto.");

    const { data: newTeam, error } = await window.supabaseClient.from('atleti').insert([{
        first_name: teamName, last_name: 'Squadra', gender: teamGender, birthdate: '2000-01-01', 
        classe: teamClasse, specialty: teamSpecialty, belt: teamBelt, society_id: society.id,
        is_team: true, team_members: teamMembersText 
    }]).select().single();

    if (error) return alert('Errore aggiunta squadra');

    await window.supabaseClient.from('iscrizioni_eventi').insert([{
        atleta_id: newTeam.id, evento_id: eventId, stato_iscrizione: 'Iscritto' 
    }]);

    alert('Squadra iscritta!');
    if (typeof window.fetchAthletes === 'function') window.fetchAthletes(eventId);
    document.getElementById('teamForm').reset();
}

async function addAthlete() {
    const firstName = document.getElementById('first_name')?.value || document.getElementById('firstName')?.value;
    const lastName = document.getElementById('last_name')?.value || document.getElementById('lastName')?.value;
    const gender = document.getElementById('gender').value;
    const birthdate = document.getElementById('birthdate').value;
    const classe = document.getElementById('classe').value;
    const specialty = document.getElementById('specialty').value;
    const weightCategory = document.getElementById('weightCategory')?.value || null;
    const belt = document.getElementById('belt').value;
    
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');

    if (!eventId) return alert("Seleziona un evento.");
    
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    const { data: society } = await window.supabaseClient.from('societa').select('id').eq('user_id', user.id).single();

    const currentCount = await getSpecialtyCount(specialty, eventId);
    const maxLimit = await getMaxAthletesForSpecialty(specialty, eventId);
    if (currentCount >= maxLimit) return alert("Limite raggiunto.");

    const { data: newAthlete, error } = await window.supabaseClient.from('atleti').insert([{
        first_name: firstName, last_name: lastName, gender, birthdate, 
        classe, specialty, weight_category: weightCategory, belt, 
        society_id: society.id, is_team: false
    }]).select().single();

    if (error) return alert('Errore invio dati');
    
    await window.supabaseClient.from('iscrizioni_eventi').insert([{
        atleta_id: newAthlete.id, evento_id: eventId, stato_iscrizione: 'Iscritto' 
    }]);

    alert('Atleta iscritto!');
    if (typeof window.fetchAthletes === 'function') window.fetchAthletes(eventId);
    document.getElementById('athleteForm').reset();
}

//================================================================================
// 3. CALCOLO ATTRIBUTI (CLASSE, CINTURE, PESI)
//================================================================================

window.calculateAthleteAttributes = function(birthDate, gender) {
    const birthYear = new Date(birthDate).getFullYear();
    const classeSelect = document.getElementById('classe');
    const specialtySelect = document.getElementById('specialty');
    const beltSelect = document.getElementById('belt');
    if (!classeSelect || !specialtySelect || !beltSelect) return;

    let currentClasse = "";
    if (birthYear >= 2018 && birthYear <= 2019) currentClasse = "Bambini U8";
    else if (birthYear >= 2020 && birthYear <= 2021) currentClasse = "Bambini U6";
    else if (birthYear >= 2016 && birthYear <= 2017) currentClasse = "Fanciulli";
    else if (birthYear >= 2014 && birthYear <= 2015) currentClasse = "Ragazzi";
    else if (birthYear >= 2012 && birthYear <= 2013) currentClasse = "Esordienti";
    else if (birthYear >= 2010 && birthYear <= 2011) currentClasse = "Cadetti";
    else if (birthYear >= 2008 && birthYear <= 2009) currentClasse = "Juniores";
    else if (birthYear >= 1990 && birthYear <= 2007) currentClasse = "Seniores";
    else currentClasse = "Master";
    
    classeSelect.innerHTML = `<option value="${currentClasse}">${currentClasse}</option>`;

    specialtySelect.innerHTML = "";
    if (currentClasse.includes("Bambini")) { 
        specialtySelect.innerHTML = `<option value="Percorso-Kata">Percorso-Kata</option><option value="Percorso-Palloncino">Percorso-Palloncino</option><option value="ParaKarate">ParaKarate</option>`;
    } else {
        specialtySelect.innerHTML = `<option value="Kata">Kata</option><option value="Kumite">Kumite</option><option value="ParaKarate">ParaKarate</option>`;
        if (currentClasse === "Fanciulli") specialtySelect.innerHTML += `<option value="Palloncino">Palloncino</option>`;
    }

    beltSelect.innerHTML = (["Seniores", "Master"].includes(currentClasse) || currentClasse.includes("Bambini")) ? 
        `<option value="Tutte">Tutte le cinture</option>` : 
        `<option value="Gialla">Gialla</option><option value="Arancio-Verde">Arancio-Verde</option><option value="Blu-Marrone">Blu-Marrone</option>`;

    updateWeightCategoryOptions(currentClasse, gender, specialtySelect.value);
    specialtySelect.onchange = () => updateWeightCategoryOptions(currentClasse, gender, specialtySelect.value);
};

function updateWeightCategoryOptions(classe, gender, specialty) {
    const weightField = document.getElementById("weightCategory") || document.getElementById("weight_category");
    if (!weightField) return;
    weightField.innerHTML = "";
    if (specialty !== "Kumite" && specialty !== "ParaKarate") return weightField.setAttribute("disabled", "disabled");
    
    weightField.removeAttribute("disabled");
    if (specialty === "ParaKarate") {
        weightField.innerHTML = `<option value="K20">K 20</option><option value="K21">K 21</option>`;
    } else {
        weightField.innerHTML = `<option value="Open">Categoria Open</option>`; // Semplificato per brevità
    }
}

//================================================================================
// 4. ADMIN E LISTENERS
//================================================================================

window.showAdminSection = async function() {
    const adminDiv = document.getElementById('adminEventCreation');
    if (adminDiv && await window.isCurrentUserAdmin()) adminDiv.style.display = 'block';
};

window.showAdminLimitsSection = async function(eventId) {
    const limitsDiv = document.getElementById('adminLimitsConfig');
    if (limitsDiv && await window.isCurrentUserAdmin()) {
        limitsDiv.style.display = 'block';
        document.getElementById('limitsEventId').textContent = eventId;
        await loadEventLimits(eventId);
    }
};

async function loadEventLimits(eventId) {
    const specialties = ["Kumite", "Kata", "ParaKarate", "KIDS", "Kata_Squadre", "Kumite_Squadre"];
    const container = document.getElementById('limitInputs');
    if (!container) return;
    container.innerHTML = "";
    for (const spec of specialties) {
        const currentLimit = await getMaxAthletesForSpecialty(spec, eventId);
        container.innerHTML += `<div class="col-3">${spec}: <input type="number" id="limit-${spec}" value="${currentLimit}" class="form-control"></div>`;
    }
}

async function saveEventLimits() {
    const eventId = document.getElementById('limitsEventId').textContent;
    const specialties = ["Kumite", "Kata", "ParaKarate", "KIDS", "Kata_Squadre", "Kumite_Squadre"];
    const updates = specialties.map(spec => ({
        evento_id: eventId, specialty: spec, limite_max: parseInt(document.getElementById(`limit-${spec}`).value) || 0
    }));
    await window.supabaseClient.from('limiti_evento').upsert(updates, { onConflict: 'evento_id, specialty' });
    alert('Limiti salvati!');
    window.updateAllCounters(eventId);
}

async function handleCreateEvent() {
    const nome = document.getElementById("eventName").value;
    const data_evento = document.getElementById("eventDate").value;
    const luogo = document.getElementById("eventLocation").value;
    await window.supabaseClient.from('eventi').insert([{ nome, data_evento, luogo }]);
    alert('Evento creato!');
    location.reload();
}

document.addEventListener('DOMContentLoaded', async () => { 
    const birthdateInput = document.getElementById('birthdate');
    const genderSelect = document.getElementById('gender');
    if (birthdateInput && genderSelect) {
        const recalculate = () => window.calculateAthleteAttributes(birthdateInput.value, genderSelect.value);
        birthdateInput.addEventListener('change', recalculate);
        genderSelect.addEventListener('change', recalculate);
    }

    document.getElementById('athleteForm')?.addEventListener('submit', async (e) => { e.preventDefault(); await addAthlete(); });
    document.getElementById('eventForm')?.addEventListener('submit', async (e) => { e.preventDefault(); await handleCreateEvent(); });
    document.getElementById('saveLimitsButton')?.addEventListener('click', saveEventLimits);
    
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');
    
    await window.showAdminSection();
    if (eventId) await window.updateAllCounters(eventId);
});
