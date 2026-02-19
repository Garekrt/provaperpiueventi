var supabase = window.supabaseClient;

// ================================================================================
// 1. GESTIONE CATEGORIE DI PESO (RICHIESTA)
// ================================================================================
window.updateWeightCategoryOptions = function(classe, gender, specialty) {
    const weightField = document.getElementById("weightCategory");
    if (!weightField) return;

    weightField.innerHTML = "";
    const isMale = (gender === "M" || gender === "Maschio");

    if (specialty === "Kumite") {
        weightField.disabled = false;
        let options = "";
        
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

        options.split(',').forEach(o => {
            weightField.innerHTML += `<option value="${o}">${isMale ? 'M' : 'F'} ${o} Kg</option>`;
        });
    } else if (specialty === "ParaKarate") {
        weightField.disabled = false;
        ["K20", "K21", "K22", "K30"].forEach(k => {
            weightField.innerHTML += `<option value="${k}">${k}</option>`;
        });
    } else {
        weightField.disabled = true;
        weightField.innerHTML = `<option value="">N/A</option>`;
    }
};

// ================================================================================
// 2. CALCOLO AUTOMATICO ATTRIBUTI
// ================================================================================
window.calculateAthleteAttributes = function(birthDate, gender) {
    const birthYear = new Date(birthDate).getFullYear();
    const classeSelect = document.getElementById('classe');
    const specialtySelect = document.getElementById('specialty');
    const beltSelect = document.getElementById('belt');
    
    let classe = "Master";
    if (birthYear >= 2018) classe = "Bambini";
    else if (birthYear >= 2016) classe = "Fanciulli";
    else if (birthYear >= 2014) classe = "Ragazzi";
    else if (birthYear >= 2012) classe = "Esordienti";
    else if (birthYear >= 2010) classe = "Cadetti";
    else if (birthYear >= 2008) classe = "Juniores";
    else if (birthYear >= 1990) classe = "Seniores";

    if (classeSelect) classeSelect.innerHTML = `<option value="${classe}">${classe}</option>`;

    if (specialtySelect) {
        let specs = classe === "Bambini" ? 
            `<option value="Percorso-Kata">Percorso-Kata</option><option value="Percorso-Palloncino">Percorso-Palloncino</option>` :
            `<option value="Kata">Kata</option><option value="Kumite">Kumite</option><option value="ParaKarate">ParaKarate</option>`;
        specialtySelect.innerHTML = specs;
        
        // Trigger iniziale pesi
        updateWeightCategoryOptions(classe, gender, specialtySelect.value);
        specialtySelect.onchange = () => updateWeightCategoryOptions(classe, gender, specialtySelect.value);
    }
};

// ================================================================================
// 3. FUNZIONI ADMIN (RISOLUZIONE REFERENCEERROR)
// ================================================================================
window.handleCreateEvent = async function() {
    // 1. Recupero valori dai campi
    const nome = document.getElementById("eventName").value.trim();
    const data_raw = document.getElementById("eventDate").value; // Formato previsto: YYYY-MM-DD
    const luogo = document.getElementById("eventLocation").value.trim();
    const quota = document.getElementById("eventFee") ? parseFloat(document.getElementById("eventFee").value) : 0;

    // 2. Controllo validità base
    if (!nome || !data_raw) {
        alert("Nome e Data sono campi obbligatori.");
        return;
    }

    // 3. Preparazione oggetto (PULITO)
    // Assicurati che societa_organizzatrice_id sia del tipo corretto nel tuo DB (UUID o INT)
    const nuovoEvento = {
        nome: nome,
        data_evento: data_raw, 
        luogo: luogo || "Da definire",
        societa_organizzatrice_id: '1a02fab9-1a2f-48d7-9391-696f4fba88a1'
    };

    console.log("Tentativo di invio dati:", nuovoEvento);

    // 4. Invio a Supabase
    const { data, error } = await supabase
        .from('eventi')
        .insert([nuovoEvento])
        .select();

    if (error) {
        console.error("ERRORE 400 - Dettagli:", error);
        alert(`Errore di sistema (${error.code}): ${error.message}\n\nVerifica che il formato della data sia corretto e che le colonne nel DB esistano.`);
    } else {
        alert("Evento creato con successo!");
        location.reload();
    }
};
// ================================================================================
// 4. LISTENERS
// ================================================================================
document.addEventListener('DOMContentLoaded', () => {
    const bday = document.getElementById('birthdate');
    const gend = document.getElementById('gender');
    if (bday && gend) {
        const update = () => calculateAthleteAttributes(bday.value, gend.value);
        bday.addEventListener('change', update);
        gend.addEventListener('change', update);
    }

    // Gestione invio form atleta
    document.getElementById('athleteForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Logica addAthlete (puoi usare quella del messaggio precedente)
        alert("Funzione di invio attivata!");
    });
});
