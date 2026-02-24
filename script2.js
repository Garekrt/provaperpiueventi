var supabase = window.supabaseClient;

// ==========================================
// 1. CATEGORIE DI PESO AUTOMATICHE
// ==========================================
window.updateWeightCategoryOptions = function(classe, gender, specialty) {
    const weightField = document.getElementById("weightCategory");
    if (!weightField) return;

    weightField.innerHTML = "";
    const isMale = (gender === "M" || gender === "Maschio");

    if (specialty === "Kumite") {
        weightField.disabled = false;
        let options = "";
        if (classe === "Esordienti") options = isMale ? "-40,-45,-50,-55,+55" : "-42,-47,-52,+52";
        else if (classe === "Cadetti") options = isMale ? "-47,-52,-57,-63,-70,-78,+78" : "-42,-47,-54,-61,-68,+68";
        else if (classe === "Juniores") options = isMale ? "-50,-55,-61,-68,-76,-86,+86" : "-48,-53,-59,-66,-74,+74";
        else if (classe === "Seniores") options = isMale ? "-60,-67,-75,-84,+84" : "-50,-55,-61,-68,+68";
        else if (classe === "Ragazzi") options = "-32,-37,-42,-47,+47";
        else if (classe === "Fanciulli") options = "-22,-27,-32,-37,+37";

        if (options) {
            options.split(',').forEach(o => {
                weightField.innerHTML += `<option value="${o}">${isMale ? 'M' : 'F'} ${o} Kg</option>`;
            });
        }
    } else {
        weightField.disabled = true;
        weightField.innerHTML = '<option value="">N/A</option>';
    }
};

// ==========================================
// 2. CREAZIONE EVENTI (ADMIN)
// ==========================================
window.handleCreateEvent = async function() {
    const nome = document.getElementById("eventName")?.value;
    const data = document.getElementById("eventDate")?.value;
    const luogo = document.getElementById("eventLocation")?.value;
    const societaId = document.getElementById('adminSocietyIdDisplay')?.textContent;

    if (!nome || !data || !societaId || societaId === "Caricamento...") {
        return alert("Compila tutti i campi obbligatori!");
    }

    try {
        const { error } = await supabase.from('eventi').insert([{
            nome: nome,
            data_evento: data,
            luogo: luogo || "Sede Sociale",
            societa_organizzatrice_id: societaId
        }]);

        if (error) throw error;
        alert("Evento Creato!");
        location.reload();
    } catch (err) {
        alert("Errore Creazione: " + err.message);
    }
};

// ==========================================
// 3. POPOLAMENTO SELETTORE EVENTI
// ==========================================
window.populateEventSelector = async function() {
    const sel = document.getElementById('eventSelector');
    if (!sel) return;

    try {
        const { data: events, error } = await supabase.from('eventi').select('*').order('data_evento', { ascending: false });
        if (error) throw error;

        sel.innerHTML = '<option value="">-- Seleziona Evento --</option>';
        events.forEach(ev => {
            sel.innerHTML += `<option value="${ev.id}">${ev.nome} (${ev.data_evento})</option>`;
        });
    } catch (err) { console.error(err); }
};

// ==========================================
// 4. INIZIALIZZAZIONE LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    window.populateEventSelector();
    
    // Listener per Calcolo Classe
    const bday = document.getElementById('birthdate');
    const gend = document.getElementById('gender');
    const spec = document.getElementById('specialty');

    if (bday && gend) {
        const update = () => {
            const birthYear = new Date(bday.value).getFullYear();
            const currentYear = new Date().getFullYear();
            const age = currentYear - birthYear;
            let classe = "Seniores"; // Default
            if (birthYear >= 2012) classe = "Esordienti";
            // ...aggiungi altre classi se necessario
            
            const clSelect = document.getElementById('classe');
            if (clSelect) clSelect.innerHTML = `<option value="${classe}">${classe}</option>`;
            window.updateWeightCategoryOptions(classe, gend.value, spec.value);
        };
        bday.addEventListener('change', update);
        gend.addEventListener('change', update);
    }
});
