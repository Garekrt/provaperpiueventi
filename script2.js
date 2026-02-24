var supabase = window.supabaseClient;

// ==========================================
// 1. GESTIONE DINAMICA CATEGORIE DI PESO
// ==========================================
window.updateWeightCategoryOptions = function(classe, gender, specialty) {
    const weightField = document.getElementById("weightCategory");
    if (!weightField) return;

    weightField.innerHTML = "";
    const isMale = (gender === "M" || gender === "Maschio");

    if (specialty === "Kumite") {
        weightField.disabled = false;
        let options = "";
        
        // Configurazioni specifiche per classe e genere
        if (classe === "Esordienti") {
            options = isMale ? "-40,-45,-50,-55,+55" : "-42,-47,-52,+52";
        } else if (classe === "Cadetti") {
            options = isMale ? "-47,-52,-57,-63,-70,-78,+78" : "-42,-47,-54,-61,-68,+68";
        } else if (classe === "Juniores") {
            options = isMale ? "-50,-55,-61,-68,-76,-86,+86" : "-48,-53,-59,-66,-74,+74";
        } else if (classe === "Seniores") {
            options = isMale ? "-60,-67,-75,-84,+84" : "-50,-55,-61,-68,+68";
        } else if (classe === "Ragazzi") {
            options = "-32,-37,-42,-47,+47";
        } else if (classe === "Fanciulli") {
            options = "-22,-27,-32,-37,+37";
        }

        if (options) {
            options.split(',').forEach(o => {
                const opt = document.createElement("option");
                opt.value = o;
                opt.textContent = `${isMale ? 'Maschi' : 'Femmine'} ${o} Kg`;
                weightField.appendChild(opt);
            });
        }
    } else if (specialty === "ParaKarate") {
        weightField.disabled = false;
        ["K20", "K21", "K22", "K30"].forEach(k => {
            weightField.innerHTML += `<option value="${k}">${k}</option>`;
        });
    } else {
        weightField.disabled = true;
        weightField.innerHTML = `<option value="">N/A (Kata/Altro)</option>`;
    }
};

// ==========================================
// 2. CALCOLO AUTOMATICO CLASSE D'ETÀ
// ==========================================
window.calculateAthleteAttributes = function(birthDate, gender) {
    if (!birthDate) return;
    const birthYear = new Date(birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    
    const classeSelect = document.getElementById('classe');
    const specialtySelect = document.getElementById('specialty');
    
    let classe = "Master";
    if (birthYear >= 2018) classe = "Bambini";
    else if (birthYear >= 2016) classe = "Fanciulli";
    else if (birthYear >= 2014) classe = "Ragazzi";
    else if (birthYear >= 2012) classe = "Esordienti";
    else if (birthYear >= 2010) classe = "Cadetti";
    else if (birthYear >= 2008) classe = "Juniores";
    else if (birthYear >= 1990) classe = "Seniores";

    if (classeSelect) {
        classeSelect.innerHTML = `<option value="${classe}">${classe}</option>`;
    }

    // Trigger per le categorie di peso basate sulla classe calcolata
    if (specialtySelect) {
        window.updateWeightCategoryOptions(classe, gender, specialtySelect.value);
    }
};

// ==========================================
// 3. POPOLAMENTO SELETTORE EVENTI
// ==========================================
window.populateEventSelector = async function() {
    const eventSelector = document.getElementById('eventSelector');
    if (!eventSelector) return;

    try {
        const { data: events, error } = await supabase
            .from('eventi')
            .select('id, nome, data_evento')
            .order('data_evento', { ascending: false });

        if (error) throw error;

        eventSelector.innerHTML = '<option value="">-- Seleziona un Evento --</option>';
        events.forEach(event => {
            const option = document.createElement('option');
            option.value = event.id;
            option.textContent = `${event.nome} (${event.data_evento})`;
            eventSelector.appendChild(option);
        });
    } catch (err) {
        console.error("Errore popolamento eventi:", err.message);
    }
};

// ==========================================
// 4. FUNZIONI ADMIN: CREAZIONE EVENTO E LIMITI
// ==========================================
window.handleCreateEvent = async function() {
    const nome = document.getElementById("eventName").value.trim();
    const data = document.getElementById("eventDate").value;
    const luogo = document.getElementById("eventLocation").value.trim();
    const societaId = document.getElementById('adminSocietyIdDisplay').textContent;

    if (!nome || !data) return alert("Nome e Data sono obbligatori!");
    if (societaId === "Caricamento...") return alert("ID Società non ancora caricato. Attendi...");

    try {
        const { error } = await supabase.from('eventi').insert([{
            nome: nome,
            data_evento: data,
            luogo: luogo || "Sede Sociale",
            societa_organizzatrice_id: societaId
        }]);

        if (error) throw error;

        alert("Evento creato con successo!");
        location.reload();
    } catch (err) {
        alert("Errore durante la creazione: " + err.message);
    }
};

window.saveEventLimits = async function(eventId) {
    const categories = ['Kumite', 'Kata', 'KIDS'];
    try {
        for (const cat of categories) {
            const val = document.getElementById(`limit_${cat}`)?.value || 0;
            const { error } = await supabase
                .from('limiti_evento')
                .upsert({ 
                    evento_id: eventId, 
                    specialty: cat, 
                    limite_max: parseInt(val) 
                }, { onConflict: 'evento_id,specialty' });
            if (error) throw error;
        }
        alert("Limiti aggiornati!");
    } catch (err) {
        alert("Errore salvataggio limiti: " + err.message);
    }
};

// ==========================================
// 5. INIZIALIZZAZIONE EVENT LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Gestione selettore eventi
    window.populateEventSelector();

    // Listener per calcolo automatico classe e pesi
    const birthdateInput = document.getElementById('birthdate');
    const genderInput = document.getElementById('gender');
    const specialtyInput = document.getElementById('specialty');

    if (birthdateInput && genderInput) {
        const triggerUpdate = () => {
            window.calculateAthleteAttributes(birthdateInput.value, genderInput.value);
        };
        birthdateInput.addEventListener('change', triggerUpdate);
        genderInput.addEventListener('change', triggerUpdate);
        if (specialtyInput) {
            specialtyInput.addEventListener('change', () => {
                const classe = document.getElementById('classe')?.value;
                window.updateWeightCategoryOptions(classe, genderInput.value, specialtyInput.value);
            });
        }
    }
});
