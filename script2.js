// ASSUNZIONE: La variabile 'supabase' è definita e inizializzata in script.js.
// Vengono usati ADMIN_USER_ID, fetchAthletes, isCurrentUserAdmin, getAdminSocietyId da script.js

//================================================================================
// 1. GESTIONE LIMITI E CONTEGGIO PER EVENTO (FIX APPLICATO QUI)
//================================================================================

/**
 * Funzione per ottenere il limite massimo di atleti per specialità e evento.
 */
async function getMaxAthletesForSpecialty(specialty, eventId = null) {
    // SPECIALITÀ UNIFICATE KIDS
    const isKidsSpecialty = specialty === "Percorso-Palloncino" || specialty === "Percorso-Kata" || specialty === "Palloncino";
    const key = isKidsSpecialty ? 'KIDS' : specialty;

    // 1. Cerca il limite specifico per l'evento nel DB
    if (eventId) {
        const { data, error } = await supabase
            .from('limiti_evento')
            .select('limite_max')
            .eq('evento_id', eventId)
            .eq('specialty', key)
            .single();

        if (data && data.limite_max !== undefined) {
            return data.limite_max;
        }
    } 

    // 2. Limiti Predefiniti
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
    
    let query = supabase
        .from('iscrizioni_eventi')
        // ⭐ FIX: Usiamo 'atleti!inner(specialty)' per forzare un INNER JOIN 
        // che garantisce che il filtro sulla 'specialty' venga applicato prima del conteggio.
        .select(`atleta_id, atleti!inner(specialty)`, { count: 'exact', head: true }) 
        .eq('evento_id', eventId);
    
    // Filtriamo la specialità corretta nella tabella atleti tramite la join
    if (isKids) {
         const specialtyList = ["Percorso-Palloncino", "Percorso-Kata", "Palloncino"];
         query = query.in('atleti.specialty', specialtyList); 
            
    } else {
        // Conteggio per la singola specialità (Kumite, Kata, ParaKarate)
        query = query.eq('atleti.specialty', specialty);
    }
    
    const { count, error } = await query;
    
    if (error) {
        console.error(`Errore nel conteggio ${specialty} per evento ${eventId}:`, error.message);
        return 0;
    }
    return count || 0;
}


// Funzione per aggiornare i contatori di tutte le specialità
async function updateAllCounters(eventId = null) {
    const specialties = ["Kumite", "Kata", "ParaKarate", "KIDS"]; 
    
    const statsContainer = document.querySelector('.stats-container');
    const athleteForm = document.getElementById('athleteForm');

    if (!eventId) {
        if (statsContainer) statsContainer.style.display = 'none';
        if (athleteForm) athleteForm.style.display = 'none';
        return;
    }
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
    
    // Carica la sezione Admin Limiti (se l'utente è Admin)
    await showAdminLimitsSection(eventId); 
}


//================================================================================
// 2. LOGICA FORM: CLASSE, SPECIALITÀ, PESO E CINTURE (Unificata - Nessuna Modifica)
//================================================================================

function calculateAthleteAttributes(birthDate, gender) {
    const today = new Date();
    const birth = new Date(birthDate);
    const birthYear = birth.getFullYear();

    const classeSelect = document.getElementById('classe');
    const specialtySelect = document.getElementById('specialty');
    const beltSelect = document.getElementById('belt');

    let currentClasse = "";
    
    // --- 1. Calcolo CLASSE e popolamento dropdown CLASSE ---
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
    } else if (birthYear >= 2022 || birthYear <= 1959) {
        currentClasse = "ERROR";
    } else {
        currentClasse = "Master";
    }
    
    classeSelect.innerHTML = `<option value="${currentClasse}">${currentClasse.replace('_', ' ')}</option>`;

    // --- 2. Popolamento Specialità (basato sulla CLASSE) ---
    specialtySelect.innerHTML = "";
    if (currentClasse.includes("Bambini")) { 
        specialtySelect.innerHTML += `
            <option value="Percorso-Kata">Percorso-Kata</option>
            <option value="Percorso-Palloncino">Percorso-Palloncino</option>
            <option value="ParaKarate">ParaKarate</option>`;
    } else if (currentClasse === "Fanciulli") {
        specialtySelect.innerHTML += `
            <option value="Kata">Kata</option>
            <option value="Kumite">Kumite</option>
            <option value="Palloncino">Palloncino</option>
            <option value="ParaKarate">ParaKarate</option>`;
    } else if (["Ragazzi", "Esordienti", "Cadetti", "Juniores"].includes(currentClasse)) {
        specialtySelect.innerHTML += `
            <option value="Kata">Kata</option>
            <option value="Kumite">Kumite</option>
            <option value="ParaKarate">ParaKarate</option>`;
    } else if (["Seniores", "Master"].includes(currentClasse)) {
        specialtySelect.innerHTML += `<option value="ParaKarate">ParaKarate</option>`;
    } else {
        specialtySelect.innerHTML += `<option value="ERROR">ERROR</option>`;
    }

    // --- 3. Popolamento Cinture (basato sulla CLASSE) ---
    beltSelect.innerHTML = "";
    if (["Fanciulli", "Ragazzi", "Esordienti"].includes(currentClasse)) {
        beltSelect.innerHTML += `
            <option value="Gialla">Gialla</option>
            <option value="Arancio-Verde">Arancio-Verde</option>
            <option value="Blu-Marrone">Blu-Marrone</option>`;
    } else if (currentClasse === "Cadetti") {
        beltSelect.innerHTML += `
            <option value="Gialla">Gialla</option>
            <option value="Arancio-Verde">Arancio-Verde</option>
            <option value="Blu-Marrone-Nera">Blu-Marrone-Nera</option>`;
    } else if (currentClasse === "Juniores") {
        beltSelect.innerHTML += `
            <option value="Marrone-Nera">Marrone-Nera</option>`;
    } else if (currentClasse.includes("Bambini") || currentClasse === "Seniores" || currentClasse === "Master") {
         beltSelect.innerHTML += `<option value="Tutte le cinture"> Tutte le cinture </option >`;
    } else {
         beltSelect.innerHTML += `<option value="ERROR">ERROR</option >`;
    }

    // --- 4. Popolamento Categoria di Peso ---
    updateWeightCategoryOptions(currentClasse, gender, specialtySelect.value);

    specialtySelect.onchange = () => {
        updateWeightCategoryOptions(currentClasse, gender, specialtySelect.value);
    };
}


function updateWeightCategoryOptions(classe, gender, specialty) {
    const weightCategoryField = document.getElementById("weightCategory");
    weightCategoryField.innerHTML = "";

    const isMale = gender === "M" || gender === "Maschio";
    
    if (specialty === "Kumite") {
        weightCategoryField.removeAttribute("disabled");

        if (classe === "Esordienti") {
            if (isMale) {
                weightCategoryField.innerHTML += `
                    <option value="-40">M -40 Kg</option><option value="-45">M -45 Kg</option>
                    <option value="-50">M -50 Kg</option><option value="-55">M -55 Kg</option>
                    <option value="+55">M +55 Kg</option>`;
            } else { 
                weightCategoryField.innerHTML += `
                    <option value="-42">F -42 Kg</option><option value="-47">F -47 Kg</option>
                    <option value="-52">F -52 Kg</option><option value="+52">F +52 Kg</option>`;
            }
        } else if (classe === "Cadetti") { 
             if (isMale) {
                weightCategoryField.innerHTML += `
                    <option value="-47">M -47 Kg</option><option value="-52">M -52 Kg</option>
                    <option value="-57">M -57 Kg</option><option value="-63">M -63 Kg</option>
                    <option value="-70">M -70 Kg</option><option value="-78">M -78 Kg</option>
                    <option value="+78">M +78 Kg</option>`;
            } else { 
                weightCategoryField.innerHTML += `
                    <option value="-42">F -42 Kg</option><option value="-47">F -47 Kg</option>
                    <option value="-54">F -54 Kg</option><option value="-61">F -61 Kg</option>
                    <option value="-68">F -68 Kg</option><option value="+68">F +68 Kg</option>`;
            }
        } else if (classe === "Juniores") { 
             if (isMale) {
                weightCategoryField.innerHTML += `
                    <option value="-50">M -50 Kg</option><option value="-55">M -55 Kg</option>
                    <option value="-61">M -61 Kg</option><option value="-68">M -68 Kg</option>
                    <option value="-76">M -76 Kg</option><option value="-86">M -86 Kg</option>
                    <option value="+86">M +86 Kg</option>`;
            } else { 
                weightCategoryField.innerHTML += `
                    <option value="-48">F -48 Kg</option><option value="-53">F -53 Kg</option>
                    <option value="-59">F -59 Kg</option><option value="-66">F -66 Kg</option>
                    <option value="-74">F -74 Kg</option><option value="+74">F +74 Kg</option>`;
            }
        } else if (classe === "Seniores" || classe === "U21") { 
            if (isMale) {
                weightCategoryField.innerHTML += `
                    <option value="-60">M -60 Kg</option><option value="-67">M -67 Kg</option>
                    <option value="-75">M -75 Kg</option><option value="-84">M -84 Kg</option>
                    <option value="+84">M +84 Kg</option>`;
            } else { 
                weightCategoryField.innerHTML += `
                    <option value="-50">F -50 Kg</option><option value="-55">F -55 Kg</option>
                    <option value="-61">F -61 Kg</option><option value="-68">F -68 Kg</option>
                    <option value="+68">F +68 Kg</option>`;
            }
        } else if (classe === "Ragazzi") { 
            if (isMale) {
                weightCategoryField.innerHTML += `
                    <option value="-32">M -32 Kg</option><option value="-37">M -37 Kg</option>
                    <option value="-42">M -42 Kg</option><option value="-47">M -47 Kg</option>
                    <option value="+47">M +47 Kg</option>`;
            } else { 
                weightCategoryField.innerHTML += `
                    <option value="-32">F -32 Kg</option><option value="-37">F -37 Kg</option>
                    <option value="-42">F -42 Kg</option><option value="-47">F -47 Kg</option>
                    <option value="+47">F +47 Kg</option>`;
            }
        } else if (classe === "Fanciulli") { 
            if (isMale) {
                weightCategoryField.innerHTML += `
                    <option value="-22">M -22 Kg</option><option value="-27">M -27 Kg</option>
                    <option value="-32">M -32 Kg</option><option value="-37">M -37 Kg</option>
                    <option value="+37">M +37 Kg</option>`;
            } else { 
                weightCategoryField.innerHTML += `
                    <option value="-22">F -22 Kg</option><option value="-27">F -27 Kg</option>
                    <option value="-32">F -32 Kg</option><option value="-37">F -37 Kg</option>
                    <option value="+37">F +37 Kg</option>`;
            }
        }
    } else if (specialty === "ParaKarate") {
        weightCategoryField.removeAttribute("disabled");
        weightCategoryField.innerHTML += `
            <option value="K20">K 20</option><option value="K21">K 21</option><option value="K22">K 22</option>
            <option value="K30">K 30</option><option value="K31">K 31</option><option value="K32">K 32</option>
            <option value="K33">K 33</option><option value="K34">K 34</option><option value="K35">K 35</option>
            <option value="K36">K 36</option><option value="K40">K 40</option>`;
    } else {
        weightCategoryField.setAttribute("disabled", "disabled");
        weightCategoryField.innerHTML = "";
    }
}


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

    if (!eventId) {
        alert("Impossibile aggiungere atleti: devi prima selezionare un evento dalla pagina precedente.");
        return;
    }
    
    const user = await supabase.auth.getUser();
    if (!user.data?.user?.id) {
        alert("Utente non autenticato.");
        return;
    }

    const { data: society, error: societyError } = await supabase
        .from('societa')
        .select('id')
        .eq('user_id', user.data.user.id)
        .single();

    if (societyError || !society) {
        alert('Impossibile trovare la Società associata all\'utente.');
        return;
    }
    const societyId = society.id;

    // VERIFICA LIMITI
    const currentSpecialtyCount = await getSpecialtyCount(specialty, eventId);
    const maxLimit = await getMaxAthletesForSpecialty(specialty, eventId);
    
    if (currentSpecialtyCount >= maxLimit) {
        alert(`Limite massimo di ${maxLimit} atleti per la specialità ${specialty} in questo evento raggiunto. Conteggio attuale: ${currentSpecialtyCount}.`);
        return;
    }

    // 1. Inserimento Atleta
    const { data: newAthlete, error } = await supabase
        .from('atleti')
        .insert([{
            first_name: firstName,
            last_name: lastName,
            gender: gender,
            birthdate: birthdate,
            classe: classe,
            specialty: specialty,
            weight_category: weightCategory || null,
            belt: belt,
            society_id: societyId
        }])
        .select()
        .single();

    if (error) {
        console.error('Errore nell\'aggiunta dell\'atleta:', error.message);
        alert('Errore nell\'aggiunta dell\'atleta.');
        return;
    }
    
    // 2. Iscrizione automatica all'evento
    const { error: subError } = await supabase
        .from('iscrizioni_eventi')
        .insert([{
            atleta_id: newAthlete.id,
            evento_id: eventId,
            stato_iscrizione: 'Iscritto' 
        }]);

    if (subError) {
        console.error('Errore nell\'iscrizione automatica all\'evento:', subError.message);
        alert('Atleta aggiunto, ma l\'iscrizione automatica all\'evento è fallita! Riprova iscrizione manuale.');
    } else {
        alert('Atleta aggiunto e iscritto all\'evento con successo!');
    }

    fetchAthletes(eventId); // Ricarica la lista degli iscritti (funzione in script.js)
    document.getElementById('athleteForm').reset();
}


//================================================================================
// 3. GESTIONE EVENTI E ADMIN (Nessuna Modifica)
//================================================================================

async function showAdminSection() {
    const adminSection = document.getElementById('adminEventCreation');
    if (adminSection) {
        if (await isCurrentUserAdmin()) {
            adminSection.style.display = 'block';
            const adminSocietyId = await getAdminSocietyId(); 
            const adminSocietyIdDisplay = document.getElementById('adminSocietyIdDisplay');
            if (adminSocietyIdDisplay && adminSocietyId) {
                adminSocietyIdDisplay.textContent = adminSocietyId;
            }
        } else {
            adminSection.style.display = 'none';
        }
    }
}

async function showAdminLimitsSection(eventId) {
    const adminLimitsSection = document.getElementById('adminLimitsConfig');
    if (!adminLimitsSection) return;
    
    if (await isCurrentUserAdmin() && eventId) {
        adminLimitsSection.style.display = 'block';
        document.getElementById('limitsEventId').textContent = eventId;
        await loadEventLimits(eventId);
    } else {
        adminLimitsSection.style.display = 'none';
    }
}

async function loadEventLimits(eventId) {
    const specialties = ["Kumite", "Kata", "ParaKarate", "KIDS"];
    const limitContainer = document.getElementById('limitInputs');
    limitContainer.innerHTML = '';
    
    const { data: limits } = await supabase
        .from('limiti_evento')
        .select('specialty, limite_max')
        .eq('evento_id', eventId);

    const existingLimits = limits?.reduce((acc, limit) => {
        acc[limit.specialty] = limit.limite_max;
        return acc;
    }, {}) || {};

    for (const spec of specialties) {
        const specialtyForDefault = (spec === 'KIDS') ? 'Percorso-Palloncino' : spec; 
        const defaultLimit = await getMaxAthletesForSpecialty(specialtyForDefault); 
        const currentLimit = existingLimits[spec] !== undefined ? existingLimits[spec] : defaultLimit;
        
        limitContainer.innerHTML += `
            <div class="form-group col-md-3">
                <label for="limit-${spec}">${spec} (Default: ${defaultLimit})</label>
                <input type="number" id="limit-${spec}" data-specialty="${spec}" value="${currentLimit}" min="0" class="form-control">
            </div>
        `;
    }
}

async function saveEventLimits() {
    const eventId = document.getElementById('limitsEventId').textContent;
    const specialties = ["Kumite", "Kata", "ParaKarate", "KIDS"];
    
    if (!eventId) {
        alert("Errore: ID evento mancante.");
        return;
    }

    const updates = specialties.map(spec => ({
        evento_id: eventId,
        specialty: spec,
        limite_max: parseInt(document.getElementById(`limit-${spec}`).value) || 0
    }));

    const { error } = await supabase
        .from('limiti_evento')
        .upsert(updates, { onConflict: 'evento_id, specialty' }); 

    if (error) {
        console.error('Errore salvataggio limiti:', error.message);
        alert(`Errore durante il salvataggio dei limiti: ${error.message}`);
    } else {
        alert('Limiti salvati con successo! Aggiornamento contatori in corso...');
        await updateAllCounters(eventId); 
    }
}

async function handleCreateEvent() { 
    if (!await isCurrentUserAdmin()) {
        alert('Accesso negato.');
        return;
    }
    
    const adminSocietyId = await getAdminSocietyId();
    if (!adminSocietyId) {
        alert('Impossibile determinare la Società Admin.');
        return;
    }

    const nome = document.getElementById("eventName").value;
    const descrizione = document.getElementById("eventDescription").value;
    const data_evento = document.getElementById("eventDate").value;
    const luogo = document.getElementById("eventLocation").value;
    const quota = parseFloat(document.getElementById("eventFee").value) || 0;

    if (!nome || !data_evento || !luogo) {
        alert("Per favore, compila tutti i campi obbligatori dell'evento.");
        return;
    }

    const { error } = await supabase
        .from('eventi')
        .insert([{
            nome: nome,
            descrizione: descrizione,
            data_evento: data_evento,
            luogo: luogo,
            quota_iscrizione: quota,
            societa_organizzatrice_id: adminSocietyId 
        }]);

    if (error) {
        console.error('Errore creazione evento:', error.message);
        alert(`Errore durante la creazione dell'evento: ${error.message}`);
    } else {
        alert('Evento creato con successo!');
        document.getElementById("eventForm").reset();
        await populateEventSelector('eventSelector'); 
    }
}

async function fetchAvailableEvents() {
    const { data: events, error } = await supabase
        .from('eventi')
        .select('id, nome, data_evento')
        .gte('data_evento', new Date().toISOString().split('T')[0]) 
        .order('data_evento', { ascending: true });

    if (error) {
        console.error('Errore nel recupero degli eventi:', error.message);
        return [];
    }
    return events;
}

async function populateEventSelector(selectorId) {
    const selector = document.getElementById(selectorId);
    if (!selector) return;

    const events = await fetchAvailableEvents();
    selector.innerHTML = '<option value="">Seleziona un Evento</option>'; 

    events.forEach(event => {
        const option = document.createElement('option');
        option.value = event.id;
        option.textContent = `${event.nome} (${new Date(event.data_evento).toLocaleDateString()})`;
        selector.appendChild(option);
    });
    
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');
    if (eventId) {
         selector.value = eventId;
    }
}


//================================================================================
// 4. LISTENERS (Nessuna Modifica)
//================================================================================

document.addEventListener('DOMContentLoaded', async () => { 
    const birthdateInput = document.getElementById('birthdate');
    const genderSelect = document.getElementById('gender');
    
    if (birthdateInput && genderSelect) {
        const recalculate = () => {
            const birthDate = birthdateInput.value;
            const gender = genderSelect.value;
            if (birthDate && gender) {
                calculateAthleteAttributes(birthDate, gender); 
            }
        };
        
        birthdateInput.addEventListener('change', recalculate);
        genderSelect.addEventListener('change', recalculate);
    }

    const athleteForm = document.getElementById('athleteForm');
    if (athleteForm) {
        athleteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addAthlete();
        });
    }

    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleCreateEvent();
        });
    }
    
    const saveLimitsButton = document.getElementById('saveLimitsButton');
    if (saveLimitsButton) {
        saveLimitsButton.addEventListener('click', async () => {
             await saveEventLimits();
        });
    }
    
    await showAdminSection(); 
});
