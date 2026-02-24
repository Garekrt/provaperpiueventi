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
    const nomeInput = document.getElementById("eventName");
    const dataInput = document.getElementById("eventDate");
    const luogoInput = document.getElementById("eventLocation");

    if (!nomeInput.value || !dataInput.value) {
        return alert("Nome e Data sono obbligatori per creare l'evento.");
    }

    try {
        // Recupero l'utente loggato
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Sessione scaduta. Effettua di nuovo il login.");

        // Recupero l'ID reale della società
        const { data: society, error: socError } = await supabase
            .from('societa')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (socError || !society) {
            throw new Error("Impossibile trovare la società associata al tuo profilo admin.");
        }

        // Inserimento con gestione colonne extra
        const { error: insertError } = await supabase
            .from('eventi')
            .insert([{
                nome: nomeInput.value.trim(),
                data_evento: dataInput.value,
                luogo: luogoInput.value.trim() || "Da definire",
                societa_organizzatrice_id: society.id,
                quota_iscrizione: 0, // Evita errore 400 se la colonna è NOT NULL
                attivo: true         // Se hai una colonna per attivare/disattivare l'evento
            }]);

        if (insertError) {
            // Se l'errore è 23505, significa che hai un vincolo UNIQUE sul nome
            if (insertError.code === '23505') {
                throw new Error("Esiste già un evento con questo nome.");
            }
            throw insertError;
        }

        alert("Evento creato con successo!");
        location.reload();

    } catch (err) {
        console.error("DEBUG CREAZIONE EVENTO:", err);
        alert("Attenzione: " + err.message);
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
