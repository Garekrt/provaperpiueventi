// ASSUNZIONE: La variabile 'supabase' è definita e inizializzata in script.js.
// Vengono usati ADMIN_USER_ID e ADMIN_SOCIETY_ID da script.js

//================================================================================
// 1. GESTIONE LIMITI MASSIMI E CONTEGGIO PER EVENTO
//================================================================================

/**
 * Funzione per ottenere il limite massimo di atleti per specialità e evento.
 * Se eventId è null, usa i limiti predefiniti (come fallback o per l'Admin).
 */
async function getMaxAthletesForSpecialty(specialty, eventId = null) {
    // 1. Se l'evento è noto, cerca il limite nella tabella `limiti_evento`.
    if (eventId) {
        const key = (specialty === 'GTP-Tecnica-libera' || specialty === 'GTP-Kata') ? 'KIDS' : specialty;
        
        const { data, error } = await supabase
            .from('limiti_evento')
            .select('limite_max')
            .eq('evento_id', eventId)
            .eq('specialty', key)
            .single();

        if (data && data.limite_max !== undefined) {
            return data.limite_max;
        }
        // Se non trova il limite specifico, cade al limite predefinito, ma lancia un warning
        console.warn(`Limite non trovato per ${key} nell'evento ${eventId}. Usando limite predefinito.`);
    } 

    // 2. Limiti Predefiniti 
    if (specialty === "Kumite") return 400;
    if (specialty === "Kata") return 250;
    if (specialty === "ParaKarate") return 50;
    // Limite KIDS unificato
    if (specialty === 'GTP-Tecnica-libera' || specialty === 'GTP-Kata') return 400;
    
    return Infinity;
}

// Funzione per ottenere il conteggio totale degli atleti per specialità e EVENTO
async function getSpecialtyCount(specialty, eventId = null) {
    const isKids = specialty === 'GTP-Tecnica-libera' || specialty === 'GTP-Kata';
    
    if (!eventId) return 0; // Se nessun evento, il conteggio per evento è 0

    let query = supabase
        .from('iscrizioni_eventi')
        .select(`
            atleti(specialty)
        `, { count: 'exact', head: true })
        .eq('evento_id', eventId);
    
    // Filtriamo la specialità corretta nella tabella atleti tramite la join
    if (isKids) {
         const specialtyList = ["GTP-Tecnica-libera", "GTP-Kata"];
         query = query.in('atleti.specialty', specialtyList);
            
    } else {
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
// script2.js (riga ~75)

async function updateAllCounters(eventId = null) {
    // ⭐ USA LE CHIAVI DI CONTEGGIO: Kumite, Kata, ParaKarate, KIDS
    const specialties = ["Kumite", "Kata", "ParaKarate", "KIDS"]; 
    
    // ... (Logica di visualizzazione/nascondimento) ...

    for (const specialty of specialties) { 
        
        const countKey = specialty; // 'Kumite', 'Kata', 'ParaKarate', 'KIDS'

        // ⭐ QUANDO LA CHIAVE È 'KIDS', CHIAMIAMO LA FUNZIONE CON UNA DELLE SOTTOCATEGORIE GTP
        // getSpecialtyCount('GTP-Tecnica-libera', eventId) ritornerà il conteggio totale di entrambi i GTP.
        const specialtyToCount = (specialty === 'KIDS') ? 'GTP-Tecnica-libera' : specialty;
        
        // Calcola il limite e il conteggio
        const maxLimit = await getMaxAthletesForSpecialty(specialtyToCount, eventId);
        const count = await getSpecialtyCount(specialtyToCount, eventId);
        
        const displayElement = document.getElementById(`${countKey}AthleteCountDisplay`);
        // ... (resto della funzione) ...
        if (displayElement) {
            displayElement.textContent = `${count} / ${maxLimit}`;
            if (count >= maxLimit) {
                displayElement.style.color = 'red';
            } else {
                displayElement.style.color = 'green';
            }
        }
    }
    
    await showAdminLimitsSection(eventId);
}
    
    // Carica la sezione Admin Limiti 
    await showAdminLimitsSection(eventId);
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
    
    const classeSelect = document.getElementById('classe');
    const weightSelect = document.getElementById('weightCategory');

    let classe = "";

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
    } else if (birthYear >= 2022 || birthYear <=1959) {
        classe = "ERROR";
        classeSelect.innerHTML = `<option value="ERROR">ERROR</option>`;
    } else {
        classe = "Master";
        classeSelect.innerHTML = `<option value="Master">Master</option>`;
    }

    // 2. Calcolo Categoria di Peso (Logica semplificata)
    weightSelect.innerHTML = '<option value="">N/D</option>';
    if (classe === "Esordienti" || classe === "Cadetti") {
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
}
document.addEventListener('DOMContentLoaded', () => {
    const birthdateInput = document.getElementById('birthdate');
    const genderSelect = document.getElementById('gender');
    
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

    const athleteForm = document.getElementById('athleteForm');
    if (athleteForm) {
        athleteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addAthlete();
        });
    }
});


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
    
    // Recupera l'ID Evento dall'URL
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
        console.error('Errore nel recupero della società:', societyError.message);
        alert('Impossibile trovare la Società associata all\'utente.');
        return;
    }
    const societyId = society.id;

    // VERIFICA NUOVI LIMITI PER EVENTO 
    const currentSpecialtyCount = await getSpecialtyCount(specialty, eventId);
    const maxLimit = await getMaxAthletesForSpecialty(specialty, eventId);
    
    if (currentSpecialtyCount >= maxLimit) {
        alert(`Limite massimo di ${maxLimit} atleti per la specialità ${specialty} in questo evento raggiunto. Conteggio attuale: ${currentSpecialtyCount}.`);
        return;
    }

    // 1. Inserimento nel database (tabella atleti)
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
    
    // 2. Iscrizione automatica all'evento attivo
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

    // Aggiorna l'interfaccia
    fetchAthletes(eventId); // Ricarica la lista degli iscritti all'evento
    document.getElementById('athleteForm').reset();
}

// Funzione per rimuovere un atleta
async function removeAthlete(athleteId, rowElement) {
    if (!confirm("Sei sicuro di voler rimuovere questo atleta? Verrà rimosso da tutti gli eventi.")) {
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
        rowElement.remove(); 
        
        // Ricarica la lista per aggiornare i contatori (passando l'ID evento)
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('event_id');
        fetchAthletes(eventId); 
    }
}


// Funzione per popolare la tabella atleti
function addAthleteToTable(athlete, eventId = null) { 
    const athleteList = document.getElementById('athleteList');
    const row = athleteList.insertRow();
    
    row.insertCell().textContent = athlete.first_name;
    row.insertCell().textContent = athlete.last_name;
    row.insertCell().textContent = athlete.gender;
    row.insertCell().textContent = athlete.birthdate;
    row.insertCell().textContent = athlete.belt;
    row.insertCell().textContent = athlete.classe;
    row.insertCell().textContent = athlete.specialty;
    row.insertCell().textContent = athlete.weight_category || 'N/D';
    row.insertCell().textContent = athlete.society_id;

    const statusCell = row.insertCell();
    const isFilteredByEvent = athlete.iscritti_evento_nome; // Verifica se i dati di iscrizione sono presenti nel record

    if (isFilteredByEvent) {
        statusCell.textContent = `${athlete.iscritti_evento_nome} (${athlete.iscritti_evento_stato})`;
        statusCell.style.backgroundColor = '#d4edda';
    } else if (eventId) {
        statusCell.textContent = 'Non iscritto all\'evento selezionato';
        statusCell.style.backgroundColor = '#f8d7da';
    } else {
        statusCell.textContent = 'Nessun filtro evento attivo';
    }
    
    const actionsCell = row.insertCell();
    
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Rimuovi';
    removeButton.classList.add('btn', 'btn-danger', 'btn-sm', 'mb-1');
    removeButton.addEventListener('click', () => removeAthlete(athlete.id, row));
    actionsCell.appendChild(removeButton);

}


//================================================================================
// GESTIONE EVENTI, ADMIN E LIMITI
//================================================================================

// Funzione ADMIN: Mostra la sezione di creazione Eventi
async function showAdminSection() {
    const adminSection = document.getElementById('adminEventCreation');
    if (adminSection) {
        if (await isCurrentUserAdmin()) {
            adminSection.style.display = 'block';
            await getAdminSocietyId(); 
            const adminSocietyIdDisplay = document.getElementById('adminSocietyIdDisplay');
            if (adminSocietyIdDisplay && ADMIN_SOCIETY_ID) {
                adminSocietyIdDisplay.textContent = ADMIN_SOCIETY_ID;
            }
        } else {
            adminSection.style.display = 'none';
        }
    }
}

// NUOVA FUNZIONE ADMIN: Sezione per la gestione dei Limiti per Evento 
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

// Funzione ADMIN: Carica i limiti esistenti per l'evento selezionato
async function loadEventLimits(eventId) {
    const specialties = ["Kumite", "Kata", "ParaKarate", "KIDS"];
    const limitContainer = document.getElementById('limitInputs');
    limitContainer.innerHTML = '';
    
    const { data: limits, error } = await supabase
        .from('limiti_evento')
        .select('specialty, limite_max')
        .eq('evento_id', eventId);

    const existingLimits = limits?.reduce((acc, limit) => {
        acc[limit.specialty] = limit.limite_max;
        return acc;
    }, {}) || {};

    // Usa getMaxAthletesForSpecialty per ottenere i default se non sono impostati
    for (const spec of specialties) {
        const defaultLimit = await getMaxAthletesForSpecialty(spec); 
        const currentLimit = existingLimits[spec] !== undefined ? existingLimits[spec] : defaultLimit;
        
        limitContainer.innerHTML += `
            <div class="form-group col-md-3">
                <label for="limit-${spec}">${spec} (Default: ${defaultLimit})</label>
                <input type="number" id="limit-${spec}" data-specialty="${spec}" value="${currentLimit}" min="0" class="form-control">
            </div>
        `;
    }
}

// Funzione ADMIN: Salva i limiti aggiornati
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

    // Uso upsert per inserire o aggiornare i limiti
    const { error } = await supabase
        .from('limiti_evento')
        .upsert(updates, { onConflict: 'evento_id, specialty' }); 

    if (error) {
        console.error('Errore salvataggio limiti:', error.message);
        alert(`Errore durante il salvataggio dei limiti: ${error.message}`);
    } else {
        alert('Limiti salvati con successo! Aggiornamento contatori in corso...');
        await updateAllCounters(eventId); // Aggiorna i contatori con i nuovi limiti
    }
}

// Funzione ADMIN: Creazione di un nuovo Evento (Rinominata per evitare conflitto DOM).
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

// Funzione per il popolamento del selettore (usata sia in index che event_selector)
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
    
    // Se c'è un evento nell'URL, selezionalo nel dropdown
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');
    if (eventId) {
         selector.value = eventId;
    }
}
