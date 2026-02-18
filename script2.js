// ================================================================================
// 1. COLLEGAMENTO GLOBALE
// ================================================================================
var supabase = window.supabaseClient;

// Helper interni per gestire i permessi admin richiesti dalle tue funzioni
async function isCurrentUserAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    return user && user.id === '1a02fab9-1a2f-48d7-9391-696f4fba88a1'; // Sostituisci col tuo ID
}

async function getAdminSocietyId() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: society } = await supabase.from('societa').select('id').eq('user_id', user.id).single();
    return society ? society.id : null;
}

// ================================================================================
// 2. GESTIONE LIMITI E CONTEGGIO
// ================================================================================

window.getMaxAthletesForSpecialty = async function(specialty, eventId = null) {
    const isKidsSpecialty = ["Percorso-Palloncino", "Percorso-Kata", "Palloncino"].includes(specialty);
    const key = isKidsSpecialty ? 'KIDS' : specialty;

    if (eventId) {
        try {
            const { data, error } = await supabase
                .from('limiti_evento')
                .select('limite_max')
                .eq('evento_id', eventId)
                .in('specialty', [key])
                .single();
            
            if (data) return data.limite_max;
        } catch (e) {
            console.error("Errore recupero limiti DB:", e);
        }
    } 

    // Limiti di Default
    if (specialty.includes("Squadre")) return 50; 
    if (key === "Kumite") return 6;
    if (key === "Kata") return 5;
    if (key === 'KIDS') return 5; 
    return Infinity;
};

window.getSpecialtyCount = async function(specialty, eventId = null) {
    if (!eventId) return 0;
    
    const isKids = ["Percorso-Palloncino", "Percorso-Kata", "Palloncino"].includes(specialty);
    const isTeamSpecialty = specialty.includes("Squadre");

    let specialtyList = isKids ? ["Percorso-Palloncino", "Percorso-Kata", "Palloncino"] : [specialty];

    let query = supabase
        .from('iscrizioni_eventi')
        .select(`atleta_id, atleti!inner(specialty, is_team)`, { count: 'exact', head: true }) 
        .eq('evento_id', eventId)
        .in('atleti.specialty', specialtyList);
    
    query = query.eq('atleti.is_team', isTeamSpecialty);
    
    const { count, error } = await query;
    return error ? 0 : (count || 0);
};

window.updateAllCounters = async function(eventId = null) {
    const specialties = ["Kumite", "Kata", "ParaKarate", "KIDS", "Kata_Squadre", "Kumite_Squadre"]; 
    if (!eventId) return;

    for (const specialty of specialties) {
        const specialtyToCount = (specialty === 'KIDS') ? 'Percorso-Palloncino' : specialty;
        const maxLimit = await getMaxAthletesForSpecialty(specialtyToCount, eventId);
        const count = await getSpecialtyCount(specialtyToCount, eventId);
        
        const displayElement = document.getElementById(`${specialty}AthleteCountDisplay`);
        if (displayElement) {
            displayElement.textContent = `${count} / ${maxLimit}`;
            displayElement.style.color = count >= maxLimit ? 'red' : 'green';
        }
    }
};

// ================================================================================
// 3. LOGICA FORM (CALCOLO AUTOMATICO CLASSI)
// ================================================================================

window.calculateAthleteAttributes = function(birthDate, gender) {
    const birthYear = new Date(birthDate).getFullYear();
    const classeSelect = document.getElementById('classe');
    const specialtySelect = document.getElementById('specialty');
    const beltSelect = document.getElementById('belt');
    
    if (!classeSelect || !specialtySelect || !beltSelect) return;

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

    // Popolamento Specialità
    let specs = "";
    if (currentClasse.includes("Bambini")) specs = `<option value="Percorso-Kata">Percorso-Kata</option><option value="Percorso-Palloncino">Percorso-Palloncino</option>`;
    else specs = `<option value="Kata">Kata</option><option value="Kumite">Kumite</option><option value="ParaKarate">ParaKarate</option>`;
    specialtySelect.innerHTML = specs;

    // Popolamento Cinture
    beltSelect.innerHTML = `<option value="Gialla">Gialla</option><option value="Arancio-Verde">Arancio-Verde</option><option value="Blu-Marrone">Blu-Marrone</option><option value="Marrone-Nera">Marrone-Nera</option>`;
    
    updateWeightCategoryOptions(currentClasse, gender, specialtySelect.value);
};

// ================================================================================
// 4. FUNZIONI DI INSERIMENTO (ADD)
// ================================================================================

window.addAthlete = async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');
    if (!eventId) return alert("Seleziona un evento!");

    const user = await window.checkAuth();
    const { data: society } = await supabase.from('societa').select('id').eq('user_id', user.id).single();

    const athleteData = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        gender: document.getElementById('gender').value,
        birthdate: document.getElementById('birthdate').value,
        classe: document.getElementById('classe').value,
        specialty: document.getElementById('specialty').value,
        weight_category: document.getElementById('weightCategory')?.value || null,
        belt: document.getElementById('belt').value,
        society_id: society.id,
        is_team: false
    };

    const { data: newAthlete, error } = await supabase.from('atleti').insert([athleteData]).select().single();
    if (!error) {
        await supabase.from('iscrizioni_eventi').insert([{ atleta_id: newAthlete.id, evento_id: eventId, stato_iscrizione: 'Iscritto' }]);
        alert("Atleta Iscritto!");
        fetchAthletes(eventId);
    }
};

window.addTeam = async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');
    
    const teamData = {
        first_name: document.getElementById('teamName').value,
        last_name: 'Squadra',
        gender: document.getElementById('teamGender').value,
        specialty: document.getElementById('teamSpecialty').value,
        team_members: document.getElementById('teamMembers').value,
        is_team: true,
        birthdate: '2000-01-01'
    };

    const { data: newTeam, error } = await supabase.from('atleti').insert([teamData]).select().single();
    if (!error) {
        await supabase.from('iscrizioni_eventi').insert([{ atleta_id: newTeam.id, evento_id: eventId }]);
        alert("Squadra Iscritta!");
        fetchAthletes(eventId);
    }
};

// ================================================================================
// 5. INIZIALIZZAZIONE LISTENERS
// ================================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Listener per il calcolo automatico
    const birthdateInput = document.getElementById('birthdate');
    const genderSelect = document.getElementById('gender');
    if (birthdateInput && genderSelect) {
        const trigger = () => calculateAthleteAttributes(birthdateInput.value, genderSelect.value);
        birthdateInput.addEventListener('change', trigger);
        genderSelect.addEventListener('change', trigger);
    }

    // Listener per i Form
    document.getElementById('athleteForm')?.addEventListener('submit', (e) => { e.preventDefault(); addAthlete(); });
    document.getElementById('teamForm')?.addEventListener('submit', (e) => { e.preventDefault(); addTeam(); });

    // Aggiorna contatori se siamo in una pagina evento
    const eventId = new URLSearchParams(window.location.search).get('event_id');
    if (eventId) updateAllCounters(eventId);
});
