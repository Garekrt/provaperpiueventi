// ASSUNZIONE: La variabile 'supabase' è definita e inizializzata altrove (in script.js).

//================================================================================
// 1. GESTIONE LIMITI MASSIMI E CONTEGGIO UNIFICATO KIDS
//================================================================================

// Funzione per ottenere il limite massimo di atleti per specialità
function getMaxAthletesForSpecialty(specialty) {
    if (specialty === "Kumite") {
        return 400;
    } else if (specialty === "Kata") {
        return 250;
    } else if (specialty === "ParaKarate") {
        return 50;
    } 
    // Limite unificato per le specialità Percorso (Palloncino/Kata)
    else if (specialty === 'GTP-Tecnica-libera' || specialty === 'GTP-Kata') {
             return 400; 
    } else {
        return Infinity;
    }
}

// Funzione per ottenere il conteggio totale unificato degli atleti KIDS
async function getKidsCount() {
    const specialtyList = ["GTP-Tecnica-libera", "GTP-Kata"];
    
    const { 
        count, 
        error 
    } = await supabase
        .from('atleti')
        .select('*', { 
            count: 'exact', 
            head: true 
        })
        .in('specialty', specialtyList); 

    if (error) {
        console.error("Errore nel conteggio KIDS:", error.message);
        return 0;
    }
    return count;
}

// Funzione per aggiornare i contatori di tutte le specialità
async function updateAllCounters() {
    const specialties = ["Kumite", "Kata", "ParaKarate"];
    
    for (const specialty of specialties) {
        const maxLimit = getMaxAthletesForSpecialty(specialty);
        
        const { count, error } = await supabase
            .from('atleti')
            .select('id', { count: 'exact', head: true })
            .eq('specialty', specialty);

        if (error) {
            console.error(`Errore nel conteggio ${specialty}:`, error.message);
            continue;
        }

        const displayElement = document.getElementById(`${specialty}AthleteCountDisplay`);
        if (displayElement) {
            displayElement.textContent = `${count} / ${maxLimit}`;
            if (count >= maxLimit) {
                displayElement.style.color = 'red';
            } else {
                displayElement.style.color = 'green';
            }
        }
    }
    
    // Aggiorna il conteggio KIDS (unificato)
    const kidsCount = await getKidsCount();
    const kidsLimit = getMaxAthletesForSpecialty('GTP-Tecnica-libera');
    const kidsDisplayElement = document.getElementById('KIDSAthleteCountDisplay');
    if (kidsDisplayElement) {
        kidsDisplayElement.textContent = `${kidsCount} / ${kidsLimit}`;
        if (kidsCount >= kidsLimit) {
            kidsDisplayElement.style.color = 'red';
        } else {
            kidsDisplayElement.style.color = 'green';
        }
    }
}

//================================================================================
// 2. GESTIONE FORM E LOGICA DI CLASSE
//================================================================================

function calculateClassAndWeight(birthDate, gender) {
    const today = new Date();
    const birth = new Date(birthDate);
    const birthYear = birth.getFullYear();
    const currentYear = today.getFullYear();
    const age = currentYear - birthYear;
    
    // Elementi HTML per aggiornare classe e categoria
    const classeSelect = document.getElementById('classe');
    const weightSelect = document.getElementById('weightCategory');

    let classe = "";
    let weightCategory = "";

    // 1. Calcolo Classe
    if (birthYear >= 2010 && birthYear <= 2013) {
        classe = "Esordienti";
        classeSelect.innerHTML = `<option value="Esordienti">Esordienti</option>`;
    } else if (birthYear >= 2008 && birthYear <= 2009) {
        classe = "Cadetti";
        classeSelect.innerHTML = `<option value="Cadetti">Cadetti</option>`;
    } else if (birthYear >= 2006 && birthYear <= 2007) {
        classe = "Juniores";
        classeSelect.innerHTML = `<option value="Juniores">Juniores</option>`;
    } else if (birthYear >= 2003 && birthYear <= 2005) {
        classe = "U21";
        classeSelect.innerHTML = `<option value="U21">U21</option>`;
    } else if (birthYear >= 2014 && birthYear <= 2015) {
        classe = "Ragazzi";
        classeSelect.innerHTML = `<option value="Ragazzi">Ragazzi</option>`;
    } else if (birthYear >= 2016 && birthYear <= 2017) {
        classe = "Fanciulli";
        classeSelect.innerHTML = `<option value="Fanciulli">Fanciulli</option>`;
    } else if (birthYear >= 2018 && birthYear <= 2019) {
        classe = "Bambini U8";
        classeSelect.innerHTML = `<option value="Bambini_U8">Bambini U8</option>`;
    } else if (birthYear >= 2020 && birthYear <= 2021) {
         classe = "Bambini U6";
         classeSelect.innerHTML = `<option value="Bambini_U6">Bambini U6</option>`;
    } else if (birthYear >= 1990 && birthYear <= 2007) {
          classe = "Seniores";
          classeSelect.innerHTML = `<option value="Seniores">Seniores</option>`;
    } else if (birthYear >= 2022) {
        classe = "ERROR";
        classeSelect.innerHTML = `<option value="ERROR">ERROR</option>`;
    } else if (birthYear <=1959) {
        classe = "ERROR";
        classeSelect.innerHTML = `<option value="ERROR">ERROR</option>`;
    } else {
        classe = "Master";
        classeSelect.innerHTML = `<option value="Master">Master</option>`;
    }

    // 2. Calcolo Categoria di Peso (Logica semplificata)
    // Svuota il selettore e lo ripopola solo se necessario
    weightSelect.innerHTML = '<option value="">N/D</option>';
    if (classe === "Esordienti" || classe === "Cadetti") {
        // Logica per le categorie Kumite (solo per esempio)
        if (gender === 'M') {
            weightSelect.innerHTML += '<option value="M-45">M -45 Kg</option>';
            weightSelect.innerHTML += '<option value="M-50">M -50 Kg</option>';
            weightSelect.innerHTML += '<option value="M-55">M -55 Kg</option>';
        } else if (gender === 'F') {
            weightSelect.innerHTML += '<option value="F-40">F -40 Kg</option>';
            weightSelect.innerHTML += '<option value="F-45">F -45 Kg</option>';
            weightSelect.innerHTML += '<option value="F-50">F -50 Kg</option>';
        }
        weightSelect.disabled = false;
    } else {
        weightSelect.disabled = true;
    }

    // Qui puoi anche aggiornare altri campi, se necessario, in base alla logica di specialità/classe
}

document.addEventListener('DOMContentLoaded', () => {
    const birthdateInput = document.getElementById('birthdate');
    const genderSelect = document.getElementById('gender');
    
    // Listener per ricalcolare classe e peso quando cambiano data o genere
    if (birthdateInput && genderSelect) {
        const recalculate = () => {
            const birthDate = birthdateInput.value;
            const gender = genderSelect.value;
            if (birthDate && gender) {
                calculateClassAndWeight(birthDate, gender);
            }
        };
        
        birthdateInput.addEventListener('change', recalculate);
        genderSelect.addEventListener('change', recalculate);
    }

    // Listener per il form di aggiunta atleti
    const athleteForm = document.getElementById('athleteForm');
    if (athleteForm) {
        athleteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addAthlete();
        });
    }
});


// Funzione per rimuovere un atleta dal database
async function removeAthlete(athleteId, rowElement) {
    if (!confirm("Sei sicuro di voler rimuovere questo atleta?")) {
        return;
    }

    const { error } = await supabase
        .from('atleti')
        .delete()
        .eq('id', athleteId);

    if (error) {
        console.error('Errore durante la rimozione:', error.message);
        alert('Errore durante la rimozione dell\'atleta.');
    } else {
        rowElement.remove(); // Rimuovi la riga dalla tabella
        await updateAllCounters(); // Aggiorna i contatori
    }
}

// Funzione per popolare la tabella degli atleti loggati
function addAthleteToTable(athlete) {
    const athleteList = document.getElementById('athleteList');
    const row = athleteList.insertRow();

    // Inserimento dati atleta
    row.insertCell().textContent = athlete.first_name;
    row.insertCell().textContent = athlete.last_name;
    row.insertCell().textContent = athlete.gender;
    row.insertCell().textContent = athlete.birthdate;
    row.insertCell().textContent = athlete.belt;
    row.insertCell().textContent = athlete.classe;
    row.insertCell().textContent = athlete.specialty;
    row.insertCell().textContent = athlete.weight_category || 'N/D';
    row.insertCell().textContent = athlete.society_id;

    // Cella delle Azioni
    const actionsCell = row.insertCell();
    
    // 1. Pulsante Rimuovi (esistente)
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Rimuovi';
    removeButton.classList.add('btn', 'btn-danger', 'btn-sm', 'mb-1');
    removeButton.addEventListener('click', () => removeAthlete(athlete.id, row));
    actionsCell.appendChild(removeButton);

    // 2. Pulsante Iscrivi all'Evento (NUOVO)
    const subscribeButton = document.createElement('button');
    subscribeButton.textContent = 'Iscrivi Evento';
    subscribeButton.classList.add('btn', 'btn-success', 'btn-sm', 'mt-1');
    subscribeButton.addEventListener('click', () => {
        const selectedEventId = document.getElementById('eventSelector').value;
        if (selectedEventId) {
            subscribeAthleteToEvent(athlete.id, selectedEventId); // Chiama la nuova funzione
        } else {
            alert("Seleziona prima un evento dal menu a tendina sopra.");
        }
    });
    actionsCell.appendChild(subscribeButton);
}


// Funzione per l'aggiunta di un nuovo atleta
async function addAthlete() {
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const gender = document.getElementById('gender').value;
    const birthdate = document.getElementById('birthdate').value;
    const classe = document.getElementById('classe').value;
    const specialty = document.getElementById('specialty').value;
    const weightCategory = document.getElementById('weightCategory').value;
    const belt = document.getElementById('belt').value;
    
    const user = await supabase.auth.getUser();
    if (!user.data?.user?.id) {
        alert("Utente non autenticato.");
        return;
    }

    // Recupera l'ID della società dell'utente loggato
    const { data: society, error: societyError } = await supabase
        .from('societa')
        .select('id')
        .eq('user_id', user.data.user.id)
        .single();

    if (societyError || !society) {
        console.error('Errore nel recupero della società:', societyError.message);
        alert('Impossibile trovare la Società associata all\'utente.');
        return;
    }
    const societyId = society.id;

    // Verifica i limiti prima di inserire
    const currentSpecialtyCount = await getSpecialtyCount(specialty);
    const maxLimit = getMaxAthletesForSpecialty(specialty);
    
    if (currentSpecialtyCount >= maxLimit) {
        alert(`Limite massimo di ${maxLimit} atleti per la specialità ${specialty} raggiunto.`);
        return;
    }

    // Inserimento nel database
    const { data: newAthlete, error } = await supabase
        .from('atleti')
        .insert([{
            first_name: firstName,
            last_name: lastName,
            gender: gender,
            birthdate: birthdate,
            classe: classe,
            specialty: specialty,
            weight_category: weightCategory || null, // Inserisce null se vuoto
            belt: belt,
            society_id: societyId // Assegna l'atleta alla società
        }])
        .select()
        .single();

    if (error) {
        console.error('Errore nell\'aggiunta dell\'atleta:', error.message);
        alert('Errore nell\'aggiunta dell\'atleta.');
    } else {
        alert('Atleta aggiunto con successo!');
        addAthleteToTable(newAthlete);
        document.getElementById('athleteForm').reset();
        await updateAllCounters();
    }
}


// Funzione di utilità per il conteggio (usata in addAthlete)
async function getSpecialtyCount(specialty) {
    if (specialty === 'GTP-Tecnica-libera' || specialty === 'GTP-Kata') {
        return getKidsCount();
    }
    
    const { count, error } = await supabase
        .from('atleti')
        .select('id', { count: 'exact', head: true })
        .eq('specialty', specialty);

    if (error) {
        console.error(`Errore nel conteggio ${specialty}:`, error.message);
        return 0;
    }
    return count;
}


//================================================================================
// ⭐️ NUOVE FUNZIONI LOGICA EVENTI ⭐️
//================================================================================

/**
 * Funzione ADMIN: Mostra la sezione di creazione Eventi solo se l'utente è Admin.
 * Dipende da isCurrentUserAdmin() e getAdminSocietyId() in script.js.
 */
async function showAdminSection() {
    const adminSection = document.getElementById('adminEventCreation');
    if (adminSection) {
        if (await isCurrentUserAdmin()) {
            adminSection.style.display = 'block';
            await getAdminSocietyId(); // Pre-carica l'ID Società Admin
            const adminSocietyIdDisplay = document.getElementById('adminSocietyIdDisplay');
            if (adminSocietyIdDisplay && ADMIN_SOCIETY_ID) {
                adminSocietyIdDisplay.textContent = ADMIN_SOCIETY_ID;
            }
        } else {
            adminSection.style.display = 'none';
        }
    }
}

/**
 * Funzione ADMIN: Creazione di un nuovo Evento.
 * Utilizza l'ID della Società Admin pre-caricato.
 */
async function handleCreateEvent() {
    if (!await isCurrentUserAdmin()) {
        alert('Accesso negato. Solo l\'amministratore può creare eventi.');
        return;
    }
    
    const adminSocietyId = await getAdminSocietyId();
    if (!adminSocietyId) {
        alert('Impossibile determinare la Società Admin. Controlla la configurazione ADMIN_USER_ID.');
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
            societa_organizzatrice_id: adminSocietyId // Usa l'ID della Società Admin
        }]);

    if (error) {
        console.error('Errore creazione evento:', error.message);
        alert(`Errore durante la creazione dell'evento: ${error.message}`);
    } else {
        alert('Evento creato con successo!');
        document.getElementById("eventForm").reset();
        await populateEventSelector('eventSelector'); // Aggiorna la lista eventi
    }
}

/**
 * Recupera tutti gli Eventi Disponibili (da oggi in poi).
 */
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

/**
 * Popola il selettore degli eventi nell'interfaccia utente della società.
 */
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
}

/**
 * Funzione Società: Iscrive un Atleta a un Evento tramite la tabella iscrizioni_eventi.
 */
async function subscribeAthleteToEvent(athleteId, eventId) {
    // 1. Verifica se l'atleta è già iscritto a questo evento 
    const { count: existingSubscription, error: checkError } = await supabase
        .from('iscrizioni_eventi')
        .select('atleta_id', { count: 'exact', head: true })
        .eq('atleta_id', athleteId)
        .eq('evento_id', eventId);
    
    if (checkError) {
        console.error("Errore verifica iscrizione:", checkError.message);
        return;
    }
    if (existingSubscription > 0) {
        alert("Questo atleta è già iscritto a questo evento!");
        return;
    }

    // 2. Esegue l'iscrizione inserendo una riga nella tabella pivot
    const { error } = await supabase
        .from('iscrizioni_eventi')
        .insert([{
            atleta_id: athleteId,
            evento_id: eventId,
            stato_iscrizione: 'Iscritto' 
        }]);

    if (error) {
        console.error('Errore iscrizione atleta:', error.message);
        alert(`Errore durante l'iscrizione: ${error.message}`);
    } else {
        alert('Atleta iscritto all\'evento con successo!');
    }
}
