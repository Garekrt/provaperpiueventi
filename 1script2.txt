// ASSUNZIONE: La variabile 'supabase' è definita e inizializzata in script.js.
// Vengono usati ADMIN_USER_ID, fetchAthletes, isCurrentUserAdmin, getAdminSocietyId da script.js

//================================================================================
// 1. GESTIONE LIMITI E CONTEGGIO PER EVENTO
//================================================================================

/**
 * Funzione per ottenere il limite massimo di atleti/squadre per specialità e evento.
 */
async function getMaxAthletesForSpecialty(specialty, eventId = null) {
    const isKidsSpecialty = specialty === "Percorso-Palloncino" || specialty === "Percorso-Kata" || specialty === "Palloncino";
    const key = isKidsSpecialty ? 'KIDS' : specialty;

    // 1. Cerca il limite specifico per l'evento nel DB
    if (eventId) {
        try {
            const { data, error } = await supabase
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
             console.error(`[Errore critico in Limiti]:`, e.message);
        }
    } 

    // 2. Limiti Predefiniti (Default)
    if (specialty === "Kata_Squadre" || specialty === "Kumite_Squadre") {
        return 50; 
    }
    
    if (key === "Kumite") return 6;
    if (key === "Kata") return 5;
    if (key === "ParaKarate") return 5;
    if (key === 'KIDS') return 5; 
    
    return Infinity;
}

// Funzione per ottenere il conteggio totale degli atleti per specialità e EVENTO
async function getSpecialtyCount(specialty, eventId = null) {
    if (!eventId) return 0;
    
    const isKids = specialty === "Percorso-Palloncino" || specialty === "Percorso-Kata" || specialty === "Palloncino";
    const isTeamSpecialty = specialty === "Kata_Squadre" || specialty === "Kumite_Squadre"; 

    let specialtyList = [];
    if (isKids) {
         specialtyList = ["Percorso-Palloncino", "Percorso-Kata", "Palloncino"];
    } else {
        specialtyList = [specialty];
    }

    let query = supabase
        .from('iscrizioni_eventi')
        .select(`atleta_id, atleti!inner(specialty, is_team)`, { count: 'exact', head: true }) 
        .eq('evento_id', eventId)
        .in('atleti.specialty', specialtyList);
    
    if (isTeamSpecialty) {
        query = query.eq('atleti.is_team', true); 
    } else {
        query = query.eq('atleti.is_team', false); 
    }
    
    const { count, error } = await query;
    
    if (error) {
        console.error(`Errore nel conteggio:`, error.message);
        return 0;
    }
    return count || 0;
}

// Funzione per aggiornare i contatori
async function updateAllCounters(eventId = null) {
    const specialties = ["Kumite", "Kata", "ParaKarate", "KIDS", "Kata_Squadre", "Kumite_Squadre"]; 
    const statsContainer = document.querySelector('.stats-container');
    const athleteForm = document.getElementById('athleteForm');

    // FIX: Se non c'è evento (Gestione Generale), nascondi le stats MA MOSTRA IL FORM
    if (!eventId) {
        if (statsContainer) statsContainer.style.display = 'none';
        if (athleteForm) athleteForm.style.display = 'block'; 
        return;
    }

    // Se c'è un evento, mostra tutto
    if (statsContainer) statsContainer.style.display = 'block';
    if (athleteForm) athleteForm.style.display = 'block';

    for (const specialty of specialties) {
        const countKey = specialty; 
        const specialtyToCount = (specialty === 'KIDS') ? 'Percorso-Palloncino' : specialty;
        
        const maxLimit = await getMaxAthletesForSpecialty(specialtyToCount, eventId);
        const count = await getSpecialtyCount(specialtyToCount, eventId);
        
        const displayElement = document.getElementById(`${countKey}AthleteCountDisplay`);
        
        if (displayElement) {
            displayElement.textContent = `${count} / ${maxLimit}`;
            if (count >= maxLimit) {
                displayElement.style.color = 'red';
            } else {
                displayElement.style.color = 'green';
            }
        }
    }
    
    if (typeof showAdminLimitsSection === 'function') {
        await showAdminLimitsSection(eventId); 
    }
}

//================================================================================
// 2. LOGICA FORM: CLASSE, SPECIALITÀ E CATEGORIE DI PESO (ESTESA)
//================================================================================

function calculateAthleteAttributes(birthDate, gender) {
    const today = new Date();
    const birth = new Date(birthDate);
    const birthYear = birth.getFullYear();

    const classeSelect = document.getElementById('classe');
    const specialtySelect = document.getElementById('specialty');
    const beltSelect = document.getElementById('belt');
    
    if (!classeSelect || !specialtySelect || !beltSelect) return;

    let currentClasse = "";
    
    if (birthYear >= 2018 && birthYear <= 2019) {
        currentClasse = "Bambini U8";
    } else if (birthYear >= 2020 && birthYear <= 2021) {
        currentClasse = "Bambini U6";
    } else if (birthYear >= 2016 && birthYear <= 2017) {
        currentClasse = "Fanciulli";
    } else if (birthYear >= 2014 && birthYear <= 2015) {
        currentClasse = "Ragazzi";
    } else if (birthYear >= 2012 && birthYear <= 2013) {
        currentClasse = "Esordienti";
    } else if (birthYear >= 2010 && birthYear <= 2011) {
        currentClasse = "Cadetti";
    } else if (birthYear >= 2008 && birthYear <= 2009) {
        currentClasse = "Juniores";
    } else if (birthYear >= 1990 && birthYear <= 2007) {
        currentClasse = "Seniores";
    } else {
        currentClasse = "Master";
    }
    
    classeSelect.innerHTML = `<option value="${currentClasse}">${currentClasse}</option>`;

    // Popolamento Specialità
    specialtySelect.innerHTML = "";
    if (currentClasse.includes("Bambini")) { 
        specialtySelect.innerHTML += `<option value="Percorso-Kata">Percorso-Kata</option>`;
        specialtySelect.innerHTML += `<option value="Percorso-Palloncino">Percorso-Palloncino</option>`;
        specialtySelect.innerHTML += `<option value="ParaKarate">ParaKarate</option>`;
    } else if (currentClasse === "Fanciulli") {
        specialtySelect.innerHTML += `<option value="Kata">Kata</option>`;
        specialtySelect.innerHTML += `<option value="Kumite">Kumite</option>`;
        specialtySelect.innerHTML += `<option value="Palloncino">Palloncino</option>`;
        specialtySelect.innerHTML += `<option value="ParaKarate">ParaKarate</option>`;
    } else if (["Ragazzi", "Esordienti", "Cadetti", "Juniores"].includes(currentClasse)) {
        specialtySelect.innerHTML += `<option value="Kata">Kata</option>`;
        specialtySelect.innerHTML += `<option value="Kumite">Kumite</option>`;
        specialtySelect.innerHTML += `<option value="ParaKarate">ParaKarate</option>`;
    } else {
        specialtySelect.innerHTML += `<option value="ParaKarate">ParaKarate</option>`;
    }

    // Popolamento Cinture
    beltSelect.innerHTML = "";
    if (["Fanciulli", "Ragazzi", "Esordienti"].includes(currentClasse)) {
        beltSelect.innerHTML += `<option value="Gialla">Gialla</option>`;
        beltSelect.innerHTML += `<option value="Arancio-Verde">Arancio-Verde</option>`;
        beltSelect.innerHTML += `<option value="Blu-Marrone">Blu-Marrone</option>`;
    } else if (currentClasse === "Cadetti") {
        beltSelect.innerHTML += `<option value="Gialla">Gialla</option>`;
        beltSelect.innerHTML += `<option value="Arancio-Verde">Arancio-Verde</option>`;
        beltSelect.innerHTML += `<option value="Blu-Marrone-Nera">Blu-Marrone-Nera</option>`;
    } else if (currentClasse === "Juniores") {
        beltSelect.innerHTML += `<option value="Marrone-Nera">Marrone-Nera</option>`;
    } else {
         beltSelect.innerHTML += `<option value="Tutte le cinture">Tutte le cinture</option>`;
    }

    updateWeightCategoryOptions(currentClasse, gender, specialtySelect.value);

    specialtySelect.onchange = () => {
        updateWeightCategoryOptions(currentClasse, gender, specialtySelect.value);
    };
}

function updateWeightCategoryOptions(classe, gender, specialty) {
    const weightCategoryField = document.getElementById("weightCategory");
    if (!weightCategoryField) return;

    weightCategoryField.innerHTML = "";
    const isMale = (gender === "M" || gender === "Maschio");
    
    if (specialty === "Kumite") {
        weightCategoryField.removeAttribute("disabled");

        if (classe === "Esordienti") {
            if (isMale) {
                weightCategoryField.innerHTML += `<option value="-40">M -40 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="-45">M -45 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="-50">M -50 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="-55">M -55 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="+55">M +55 Kg</option>`;
            } else { 
                weightCategoryField.innerHTML += `<option value="-42">F -42 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="-47">F -47 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="-52">F -52 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="+52">F +52 Kg</option>`;
            }
        } else if (classe === "Cadetti") { 
             if (isMale) {
                weightCategoryField.innerHTML += `<option value="-47">M -47 Kg</option><option value="-52">M -52 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="-57">M -57 Kg</option><option value="-63">M -63 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="-70">M -70 Kg</option><option value="-78">M -78 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="+78">M +78 Kg</option>`;
            } else { 
                weightCategoryField.innerHTML += `<option value="-42">F -42 Kg</option><option value="-47">F -47 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="-54">F -54 Kg</option><option value="-61">F -61 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="-68">F -68 Kg</option><option value="+68">F +68 Kg</option>`;
            }
        } else if (classe === "Juniores") { 
             if (isMale) {
                weightCategoryField.innerHTML += `<option value="-50">M -50 Kg</option><option value="-55">M -55 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="-61">M -61 Kg</option><option value="-68">M -68 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="-76">M -76 Kg</option><option value="-86">M -86 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="+86">M +86 Kg</option>`;
            } else { 
                weightCategoryField.innerHTML += `<option value="-48">F -48 Kg</option><option value="-53">F -53 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="-59">F -59 Kg</option><option value="-66">F -66 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="-74">F -74 Kg</option><option value="+74">F +74 Kg</option>`;
            }
        } else if (classe === "Seniores" || classe === "U21" || classe === "Master") { 
            if (isMale) {
                weightCategoryField.innerHTML += `<option value="-60">M -60 Kg</option><option value="-67">M -67 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="-75">M -75 Kg</option><option value="-84">M -84 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="+84">M +84 Kg</option>`;
            } else { 
                weightCategoryField.innerHTML += `<option value="-50">F -50 Kg</option><option value="-55">F -55 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="-61">F -61 Kg</option><option value="-68">F -68 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="+68">F +68 Kg</option>`;
            }
        } else if (classe === "Ragazzi") { 
            if (isMale) {
                weightCategoryField.innerHTML += `<option value="-32">M -32 Kg</option><option value="-37">M -37 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="-42">M -42 Kg</option><option value="-47">M -47 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="+47">M +47 Kg</option>`;
            } else { 
                weightCategoryField.innerHTML += `<option value="-32">F -32 Kg</option><option value="-37">F -37 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="-42">F -42 Kg</option><option value="-47">F -47 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="+47">F +47 Kg</option>`;
            }
        } else if (classe === "Fanciulli") { 
            if (isMale) {
                weightCategoryField.innerHTML += `<option value="-22">M -22 Kg</option><option value="-27">M -27 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="-32">M -32 Kg</option><option value="-37">M -37 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="+37">M +37 Kg</option>`;
            } else { 
                weightCategoryField.innerHTML += `<option value="-22">F -22 Kg</option><option value="-27">F -27 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="-32">F -32 Kg</option><option value="-37">F -37 Kg</option>`;
                weightCategoryField.innerHTML += `<option value="+37">F +37 Kg</option>`;
            }
        }
    } else if (specialty === "ParaKarate") {
        weightCategoryField.removeAttribute("disabled");
        weightCategoryField.innerHTML += `<option value="K20">K 20</option><option value="K21">K 21</option><option value="K22">K 22</option>`;
        weightCategoryField.innerHTML += `<option value="K30">K 30</option><option value="K31">K 31</option><option value="K32">K 32</option>`;
        weightCategoryField.innerHTML += `<option value="K33">K 33</option><option value="K34">K 34</option><option value="K35">K 35</option>`;
        weightCategoryField.innerHTML += `<option value="K36">K 36</option><option value="K40">K 40</option>`;
    } else {
        weightCategoryField.setAttribute("disabled", "disabled");
        weightCategoryField.innerHTML = "";
    }
}

//================================================================================
// 3. FUNZIONI DI INSERIMENTO (ATLETI E SQUADRE)
//================================================================================

async function addAthlete() {
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const gender = document.getElementById('gender').value;
    const birthdate = document.getElementById('birthdate').value;
    const classe = document.getElementById('classe').value;
    const specialty = document.getElementById('specialty').value;
    const weightCategory = document.getElementById('weightCategory').value;
    const belt = document.getElementById('belt').value;
    
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) return alert("Sessione scaduta.");

    const { data: society } = await supabase.from('societa').select('id').eq('user_id', userData.user.id).single();

    if (eventId) {
        const currentCount = await getSpecialtyCount(specialty, eventId);
        const maxLimit = await getMaxAthletesForSpecialty(specialty, eventId);
        if (currentCount >= maxLimit) {
            alert(`Limite massimo raggiunto per ${specialty}.`);
            return;
        }
    }

    const { data: newAthlete, error } = await supabase.from('atleti').insert([{
        first_name: firstName,
        last_name: lastName,
        gender: gender,
        birthdate: birthdate,
        classe: classe,
        specialty: specialty,
        weight_category: weightCategory || null,
        belt: belt,
        society_id: society.id,
        is_team: false
    }]).select().single();

    if (error) {
        alert("Errore inserimento database.");
        return;
    }

    if (eventId) {
        const { error: subError } = await supabase.from('iscrizioni_eventi').insert([{
            atleta_id: newAthlete.id,
            evento_id: eventId,
            stato_iscrizione: 'Iscritto'
        }]);
        if (!subError) alert("Atleta iscritto con successo!");
    } else {
        alert("Atleta salvato in anagrafica società!");
    }

    if (typeof fetchAthletes === 'function') fetchAthletes(eventId);
    document.getElementById('athleteForm').reset();
}

async function addTeam() {
    const teamName = document.getElementById('teamName').value;
    const teamSpecialty = document.getElementById('teamSpecialty').value; 
    const teamMembersText = document.getElementById('teamMembers').value;
    const teamClasse = document.getElementById('teamClasse').value;
    const teamBelt = document.getElementById('teamBelt').value;
    const teamGender = document.getElementById('teamGender').value;

    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');
    
    if (!eventId) {
        alert("Le squadre possono essere aggiunte solo dentro un evento.");
        return;
    }

    const membersArray = teamMembersText.split(',').map(name => name.trim()).filter(name => name);
    if (membersArray.length < 3 || membersArray.length > 5) {
        alert("La squadra deve avere da 3 a 5 atleti.");
        return;
    }
    
    const { data: userData } = await supabase.auth.getUser();
    const { data: society } = await supabase.from('societa').select('id').eq('user_id', userData.user.id).single();

    const { data: newTeam, error } = await supabase.from('atleti').insert([{
        first_name: teamName,
        last_name: 'Squadra',
        gender: teamGender,
        birthdate: '2000-01-01',
        classe: teamClasse,
        specialty: teamSpecialty,
        belt: teamBelt,
        society_id: society.id,
        is_team: true,
        team_members: teamMembersText 
    }]).select().single();

    if (!error) {
        await supabase.from('iscrizioni_eventi').insert([{
            atleta_id: newTeam.id,
            evento_id: eventId,
            stato_iscrizione: 'Iscritto'
        }]);
        alert("Squadra registrata!");
        if (typeof fetchAthletes === 'function') fetchAthletes(eventId);
        document.getElementById('teamForm').reset();
    }
}

//================================================================================
// 4. SEZIONE ADMIN (EVENTI E LIMITI)
//================================================================================

async function showAdminSection() {
    const adminSection = document.getElementById('adminEventCreation');
    if (!adminSection) return;

    if (await isCurrentUserAdmin()) {
        adminSection.style.display = 'block';
        const adminSocietyIdDisplay = document.getElementById('adminSocietyIdDisplay');
        if (adminSocietyIdDisplay) {
            const adminSocietyId = await getAdminSocietyId();
            adminSocietyIdDisplay.textContent = adminSocietyId;
        }
    } else {
        adminSection.style.display = 'none';
    }
}

async function showAdminLimitsSection(eventId) {
    const adminLimitsSection = document.getElementById('adminLimitsConfig');
    if (!adminLimitsSection || !eventId) return;
    
    if (await isCurrentUserAdmin()) {
        adminLimitsSection.style.display = 'block';
        document.getElementById('limitsEventId').textContent = eventId;
        await loadEventLimits(eventId);
    } else {
        adminLimitsSection.style.display = 'none';
    }
}

async function loadEventLimits(eventId) {
    const specialties = ["Kumite", "Kata", "ParaKarate", "KIDS", "Kata_Squadre", "Kumite_Squadre"]; 
    const limitContainer = document.getElementById('limitInputs');
    if (!limitContainer) return;
    limitContainer.innerHTML = '';
    
    const { data: limits } = await supabase.from('limiti_evento').select('specialty, limite_max').eq('evento_id', eventId);
    const existingLimits = {};
    if (limits) {
        limits.forEach(l => { existingLimits[l.specialty] = l.limite_max; });
    }

    for (const spec of specialties) {
        const specDefault = (spec === 'KIDS') ? 'Percorso-Palloncino' : spec;
        const defaultLimit = await getMaxAthletesForSpecialty(specDefault); 
        const currentLimit = existingLimits[spec] !== undefined ? existingLimits[spec] : defaultLimit;
        
        limitContainer.innerHTML += `
            <div class="form-group col-md-3">
                <label for="limit-${spec}">${spec.replace(/_/g, ' ')} (Default: ${defaultLimit})</label>
                <input type="number" id="limit-${spec}" value="${currentLimit}" min="0" class="form-control">
            </div>`;
    }
}

async function saveEventLimits() {
    const eventId = document.getElementById('limitsEventId').textContent;
    const specialties = ["Kumite", "Kata", "ParaKarate", "KIDS", "Kata_Squadre", "Kumite_Squadre"];
    
    const updates = specialties.map(spec => {
        return {
            evento_id: eventId,
            specialty: spec,
            limite_max: parseInt(document.getElementById(`limit-${spec}`).value) || 0
        };
    });

    const { error } = await supabase.from('limiti_evento').upsert(updates, { onConflict: 'evento_id, specialty' }); 

    if (error) {
        alert("Errore nel salvataggio dei limiti.");
    } else {
        alert("Limiti aggiornati correttamente!");
        updateAllCounters(eventId);
    }
}

async function handleCreateEvent() { 
    if (!await isCurrentUserAdmin()) return;
    const adminSocietyId = await getAdminSocietyId();
    
    const nome = document.getElementById("eventName").value;
    const data_evento = document.getElementById("eventDate").value;
    const luogo = document.getElementById("eventLocation").value;

    if (!nome || !data_evento) {
        alert("Compila i campi obbligatori.");
        return;
    }

    const { error } = await supabase.from('eventi').insert([{
        nome: nome,
        data_evento: data_evento,
        luogo: luogo,
        societa_organizzatrice_id: adminSocietyId 
    }]);

    if (error) {
        alert("Errore durante la creazione dell'evento.");
    } else {
        alert("Evento creato con successo!");
        location.reload();
    }
}

//================================================================================
// 5. LISTENERS FINALI
//================================================================================

document.addEventListener('DOMContentLoaded', async () => { 
    const birthdateInput = document.getElementById('birthdate');
    const genderSelect = document.getElementById('gender');
    
    if (birthdateInput && genderSelect) {
        const recalculate = () => {
            if (birthdateInput.value && genderSelect.value) {
                calculateAthleteAttributes(birthdateInput.value, genderSelect.value);
            }
        };
        birthdateInput.addEventListener('change', recalculate);
        genderSelect.addEventListener('change', recalculate);
    }

    const athleteForm = document.getElementById('athleteForm');
    if (athleteForm) {
        athleteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addAthlete();
        });
    }

    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCreateEvent();
        });
    }

    const saveLimitsButton = document.getElementById('saveLimitsButton');
    if (saveLimitsButton) {
        saveLimitsButton.addEventListener('click', saveEventLimits);
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');

    await showAdminSection();
    await updateAllCounters(eventId);
});
