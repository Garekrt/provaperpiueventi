var supabase = window.supabaseClient;

// ================================================================================
// 1. CALCOLO AUTOMATICO ATTRIBUTI
// ================================================================================
window.calculateAthleteAttributes = function(birthDate, gender) {
    const birthYear = new Date(birthDate).getFullYear();
    const classeSelect = document.getElementById('classe');
    const specialtySelect = document.getElementById('specialty');
    const beltSelect = document.getElementById('belt');
    
    if (!classeSelect || !specialtySelect || !beltSelect) return;

    let classe = "Master";
    if (birthYear >= 2018 && birthYear <= 2019) classe = "Bambini U8";
    else if (birthYear >= 2020 && birthYear <= 2021) classe = "Bambini U6";
    else if (birthYear >= 2016 && birthYear <= 2017) classe = "Fanciulli";
    else if (birthYear >= 2014 && birthYear <= 2015) classe = "Ragazzi";
    else if (birthYear >= 2012 && birthYear <= 2013) classe = "Esordienti";
    else if (birthYear >= 2010 && birthYear <= 2011) classe = "Cadetti";
    else if (birthYear >= 2008 && birthYear <= 2009) classe = "Juniores";
    else if (birthYear >= 1990 && birthYear <= 2007) classe = "Seniores";

    classeSelect.innerHTML = `<option value="${classe}">${classe}</option>`;

    // Specialità
    let specs = "";
    if (classe.includes("Bambini")) {
        specs = `<option value="Percorso-Kata">Percorso-Kata</option><option value="Percorso-Palloncino">Percorso-Palloncino</option>`;
    } else {
        specs = `<option value="Kata">Kata</option><option value="Kumite">Kumite</option><option value="ParaKarate">ParaKarate</option>`;
    }
    specialtySelect.innerHTML = specs;

    // Cinture
    beltSelect.innerHTML = `
        <option value="Gialla">Gialla</option>
        <option value="Arancio-Verde">Arancio-Verde</option>
        <option value="Blu-Marrone">Blu-Marrone</option>
        <option value="Marrone-Nera">Marrone-Nera</option>`;
};

// ================================================================================
// 2. AGGIUNTA ATLETA E SQUADRA
// ================================================================================
window.addAthlete = async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');
    if (!eventId) return alert("Seleziona un evento prima!");

    const user = await window.checkAuth();
    const { data: society } = await supabase.from('societa').select('id').eq('user_id', user.id).single();

    const athleteData = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        gender: document.getElementById('gender').value,
        birthdate: document.getElementById('birthdate').value,
        classe: document.getElementById('classe').value,
        specialty: document.getElementById('specialty').value,
        belt: document.getElementById('belt').value,
        weight_category: document.getElementById('weightCategory')?.value || null,
        society_id: society.id,
        is_team: false
    };

    const { data: newAtleta, error } = await supabase.from('atleti').insert([athleteData]).select().single();
    if (error) return alert("Errore: " + error.message);

    await supabase.from('iscrizioni_eventi').insert([{ atleta_id: newAtleta.id, evento_id: eventId }]);
    alert("Atleta registrato!");
    fetchAthletes(eventId);
    document.getElementById('athleteForm').reset();
};

// ================================================================================
// 3. LISTENERS
// ================================================================================
document.addEventListener('DOMContentLoaded', () => {
    const birthdateInput = document.getElementById('birthdate');
    const genderSelect = document.getElementById('gender');
    
    if (birthdateInput && genderSelect) {
        const update = () => calculateAthleteAttributes(birthdateInput.value, genderSelect.value);
        birthdateInput.addEventListener('change', update);
        genderSelect.addEventListener('change', update);
    }

    document.getElementById('athleteForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        addAthlete();
    });
});
