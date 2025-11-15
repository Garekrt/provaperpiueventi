// ASSUNZIONE: La variabile 'supabase', ADMIN_USER_ID, e le funzioni fetchAthletes, 
// isCurrentUserAdmin, getAdminSocietyId sono definite in script.js.

//================================================================================
// 1. GESTIONE LIMITI E CONTEGGIO PER EVENTO (Aggiornato per supportare eventId)
//================================================================================

/**
 * Funzione per ottenere il limite massimo di atleti per specialità e evento.
 * Usa i limiti predefiniti se non specificato un evento.
 */
async function getMaxAthletesForSpecialty(specialty, eventId = null) {
    // SPECIALITÀ UNIFICATE KIDS: Usiamo Percorso-Palloncino come chiave di default per il raggruppamento
    const isKidsSpecialty = specialty === "Percorso-Palloncino" || specialty === "Percorso-Kata" || specialty === "Palloncino";
    const key = isKidsSpecialty ? 'KIDS' : specialty;

    // 1. Cerca il limite specifico per l'evento nel DB
    if (eventId) {
        const { data, error } = await supabase
            .from('limiti_evento')
            .select('limite_max')
            .eq('evento_id', eventId)
            .eq('specialty', key) // Cerca per la chiave KIDS se applicabile
            .single();

        if (data && data.limite_max !== undefined) {
            return data.limite_max;
        }
    } 

    // 2. Limiti Predefiniti (Valori che hai fornito: 6/5/5/5)
    if (key === "Kumite") return 6;
    if (key === "Kata") return 5;
    if (key === "ParaKarate") return 5;
    if (key === 'KIDS') return 5; // Limite KIDS unificato
    
    return Infinity;
}

// Funzione per ottenere il conteggio totale degli atleti per specialità e EVENTO
async function getSpecialtyCount(specialty, eventId = null) {
    if (!eventId) return 0; // Se nessun evento è selezionato, il conteggio è 0

    const isKids = specialty === "Percorso-Palloncino" || specialty === "Percorso-Kata" || specialty === "Palloncino";
    
    let query = supabase
        // Contiamo gli iscritti all'evento X che hanno una certa specialità
        .from('iscrizioni_eventi')
        .select(`atleti(specialty)`, { count: 'exact', head: true }) 
        .eq('evento_id', eventId);
    
    // Filtriamo la specialità corretta nella tabella atleti tramite la join
    if (isKids) {
         const specialtyList = ["Percorso-Palloncino", "Percorso-Kata", "Palloncino"];
         // Il conteggio unificato dei KIDS per l'evento selezionato
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
    // CHIAVI DI CONTEGGIO MOSTRATE NEL FRONTEND
    const specialties = ["Kumite", "Kata", "ParaKarate", "KIDS"]; 
    
    // Logica per nascondere/mostrare l'interfaccia se manca l'evento...
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
        const countKey = specialty; // 'Kumite', 'Kata', 'ParaKarate', 'KIDS'

        // Per KIDS, usiamo "Percorso-Palloncino" per innescare la logica unificata in getSpecialtyCount
        const specialtyToCount = (specialty === 'KIDS') ? 'Percorso-Palloncino' : specialty;
        
        // Calcola il limite e il conteggio
        const maxLimit = await getMaxAthletesForSpecialty(specialtyToCount, eventId);
        const count = await getSpecialtyCount(specialtyToCount, eventId);
        
        const displayElement = document.getElementById(`${countKey}AthleteCountDisplay`);
        
        if (displayElement) {
            const remainingSlots = maxLimit - count;
            // Aggiorna la visualizzazione per mostrare Posti Rimanenti / Limite Totale
            displayElement.textContent = `${count} / ${maxLimit}`;
            
            if (count >= maxLimit) {
                displayElement.style.color = 'red';
            } else {
                displayElement.style.color = 'green';
            }
        }
    }
    
    // Carica la sezione Admin Limiti (se l'utente è Admin e siamo su index.html)
    // await showAdminLimitsSection(eventId); // Assumendo che questa funzione sia in script2.js
}

//================================================================================
// 2. LOGICA FORM: CLASSE, SPECIALITÀ, PESO E CINTURE
//================================================================================

/**
 * Calcola e popola i campi CLASSE, SPECIALITÀ, PESO e CINTURA 
 * basandosi su Data di Nascita e Genere.
 * @param {string} birthDate - Data di nascita (YYYY-MM-DD).
 * @param {string} gender - Genere ('M' o 'F').
 */
function calculateAthleteAttributes(birthDate, gender) {
    const today = new Date();
    const birth = new Date(birthDate);
    const birthYear = birth.getFullYear();
    const currentYear = today.getFullYear();

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
    
    // Popola il selettore della Classe
    classeSelect.innerHTML = `<option value="${currentClasse}">${currentClasse.replace('_', ' ')}</option>`;

    // --- 2. Popolamento Specialità (basato sulla CLASSE) ---
    specialtySelect.innerHTML = "";
    if (currentClasse === "Bambini U6" || currentClasse === "Bambini U8") {
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

    // --- 4. Popolamento Categoria di Peso (richiama la funzione separata per Kumite/ParaKarate) ---
    updateWeightCategoryOptions(currentClasse, gender, specialtySelect.value);

    // Aggiungi un listener alla specialità in modo che, se l'utente la cambia, aggiorni il peso
    specialtySelect.onchange = () => {
        updateWeightCategoryOptions(currentClasse, gender, specialtySelect.value);
    };
}


/**
 * Popola il selettore della categoria di peso (logica complessa Kumite/ParaKarate)
 * Nota: Questa è la tua vecchia funzione 'toggleWeightCategory' adattata
 */
function updateWeightCategoryOptions(classe, gender, specialty) {
    const weightCategoryField = document.getElementById("weightCategory");
    weightCategoryField.innerHTML = ""; // Pulisci prima di tutto

    const isMale = gender === "M" || gender === "Maschio";
    
    if (specialty === "Kumite") {
        weightCategoryField.removeAttribute("disabled");

        if (classe === "Esordienti") {
            if (isMale) {
                weightCategoryField.innerHTML += `
                    <option value="-40">M -40 Kg</option><option value="-45">M -45 Kg</option>
                    <option value="-50">M -50 Kg</option><option value="-55">M -55 Kg</option>
                    <option value="+55">M +55 Kg</option>`;
            } else { // Femmina
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
            } else { // Femmina
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
            } else { // Femmina
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
            } else { // Femmina
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
            } else { // Femmina
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
            } else { // Femmina
                weightCategoryField.innerHTML += `
                    <option value="-22">F -22 Kg</option><option value="-27">F -27 Kg</option>
                    <option value="-32">F -32 Kg</option><option value="-37">F -37 Kg</option>
                    <option value="+37">F +37 Kg</option>`;
            }
        }
    } else if (specialty === "ParaKarate") {
        weightCategoryField.removeAttribute("disabled");
        // Le categorie ParaKarate sono le stesse per Maschio e Femmina
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


// Funzione per l'aggiunta di un nuovo atleta
async function addAthlete() {
    // ... (La funzione addAthlete rimane la stessa)
    // Ho rimosso il codice per brevità, ma assicurati che usi:
    // 1. const currentSpecialtyCount = await getSpecialtyCount(specialty, eventId);
    // 2. const maxLimit = await getMaxAthletesForSpecialty(specialty, eventId);
    // ...
    // fetchAthletes(eventId); 
    // ...
}


//================================================================================
// 3. LISTENERS
//================================================================================

// Listener generale per la pagina
document.addEventListener('DOMContentLoaded', async () => { 
    const birthdateInput = document.getElementById('birthdate');
    const genderSelect = document.getElementById('gender');
    
    if (birthdateInput && genderSelect) {
        // Funzione per eseguire il calcolo completo
        const recalculate = () => {
            const birthDate = birthdateInput.value;
            const gender = genderSelect.value;
            if (birthDate && gender) {
                calculateAthleteAttributes(birthDate, gender);
            }
        };
        
        // Esegui il ricalcolo quando cambiano i campi chiave
        birthdateInput.addEventListener('change', recalculate);
        genderSelect.addEventListener('change', recalculate);
        
        // Aggiungi un listener anche al campo 'specialty' che verrà popolato
        // Il listener verrà impostato dinamicamente in calculateAthleteAttributes
    }

    // Listener per la creazione dell'Evento (se presente)
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleCreateEvent(); // Assumi che sia definita altrove
        });
    }

    // Listener per il salvataggio dei limiti (se presente)
    const saveLimitsButton = document.getElementById('saveLimitsButton');
    if (saveLimitsButton) {
        saveLimitsButton.addEventListener('click', async () => {
             await saveEventLimits(); // Assumi che sia definita altrove
        });
    }

    // Listener per l'aggiunta di un Atleta
    const athleteForm = document.getElementById('athleteForm');
    if (athleteForm) {
        athleteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addAthlete(); // Assumi che sia definita altrove
        });
    }
});
