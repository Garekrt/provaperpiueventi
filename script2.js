var supabase = window.supabaseClient;

// ================================================================================
// 1. GESTIONE CATEGORIE DI PESO E ATTRIBUTI (Tua Logica Originale)
// ================================================================================
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

window.calculateAthleteAttributes = function(birthDate, gender) {
    if (!birthDate) return;
    const birthYear = new Date(birthDate).getFullYear();
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

    if (classeSelect) classeSelect.innerHTML = `<option value="${classe}">${classe}</option>`;

    if (specialtySelect) {
        let specs = (classe === "Bambini" || classe === "Fanciulli") ? 
            `<option value="Percorso-Kata">Percorso-Kata</option><option value="Percorso-Palloncino">Percorso-Palloncino</option><option value="Kata">Kata</option><option value="Kumite">Kumite</option>` :
            `<option value="Kata">Kata</option><option value="Kumite">Kumite</option><option value="ParaKarate">ParaKarate</option>`;
        specialtySelect.innerHTML = specs;
        
        window.updateWeightCategoryOptions(classe, gender, specialtySelect.value);
        specialtySelect.onchange = () => window.updateWeightCategoryOptions(classe, gender, specialtySelect.value);
    }
};

// ================================================================================
// 2. LOGICA ADMIN: MOSTRA/NASCONDI PANNELLO CREAZIONE
// ================================================================================
async function checkAdminStatus() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Recuperiamo la società dell'utente
        const { data: society } = await supabase.from('societa').select('*').eq('user_id', user.id).single();
        
        // Se la società ha il flag is_admin (o se vuoi filtrarlo per ID specifico)
        const adminArea = document.getElementById('adminArea');
        if (society && (society.is_admin === true || society.nome.includes("ORGANIZZATORE"))) {
            adminArea.style.display = 'block';
        } else {
            adminArea.style.display = 'none';
        }
    } catch (err) {
        console.error("Errore controllo admin:", err);
    }
}

// ================================================================================
// 3. OPERAZIONI DATABASE
// ================================================================================
window.handleCreateEvent = async function() {
    const nome = document.getElementById("eventName").value;
    const dataEv = document.getElementById("eventDate").value;
    const luogo = document.getElementById("eventLocation").value;

    if (!nome || !dataEv) return alert("Nome e Data obbligatori");

    try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: society } = await supabase.from('societa').select('id').eq('user_id', user.id).single();

        const { error } = await supabase.from('eventi').insert([{
            nome: nome,
            data_evento: dataEv,
            luogo: luogo || "Da definire",
            societa_organizzatrice_id: society.id
        }]);

        if (error) throw error;
        alert("Evento Creato!");
        location.reload();
    } catch (err) { alert("Errore: " + err.message); }
};

window.fetchAthletes = async function() {
    const eventId = document.getElementById('eventSelector')?.value;
    const list = document.getElementById('athleteList');
    if (!eventId || !list) return;

    const { data, error } = await supabase.from('atleti').select('*').eq('event_id', eventId);
    if (error) return;

    list.innerHTML = '';
    data?.forEach(a => {
        list.innerHTML += `<tr>
            <td>${a.first_name} ${a.last_name}</td>
            <td>${a.classe}</td>
            <td>${a.weight_category || 'N/A'}</td>
            <td>${a.specialty}</td>
            <td><button onclick="window.deleteAthlete('${a.id}')" class="btn btn-danger btn-sm">Elimina</button></td>
        </tr>`;
    });
};

window.deleteAthlete = async function(id) {
    if (!confirm("Eliminare l'atleta?")) return;
    await supabase.from('atleti').delete().eq('id', id);
    window.fetchAthletes();
};

window.populateEventSelector = async function() {
    const sel = document.getElementById('eventSelector');
    if (!sel) return;
    const { data } = await supabase.from('eventi').select('*').order('data_evento', { ascending: false });
    sel.innerHTML = '<option value="">-- Seleziona Gara --</option>';
    data?.forEach(ev => { sel.innerHTML += `<option value="${ev.id}">${ev.nome}</option>`; });
};

// ================================================================================
// 4. INIT
// ================================================================================
document.addEventListener('DOMContentLoaded', () => {
    checkAdminStatus(); // Controlla se mostrare il pannello Admin
    window.populateEventSelector();
    
    document.getElementById('eventSelector')?.addEventListener('change', window.fetchAthletes);

    const bday = document.getElementById('birthdate');
    const gend = document.getElementById('gender');
    if (bday && gend) {
        const update = () => window.calculateAthleteAttributes(bday.value, gend.value);
        bday.addEventListener('change', update);
        gend.addEventListener('change', update);
    }

    document.getElementById('athleteForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: society } = await supabase.from('societa').select('id').eq('user_id', user.id).single();
            const eventId = document.getElementById('eventSelector').value;

            const payload = {
                first_name: document.getElementById('firstName').value,
                last_name: document.getElementById('lastName').value,
                gender: document.getElementById('gender').value,
                birthdate: document.getElementById('birthdate').value,
                belt: document.getElementById('belt').value,
                specialty: document.getElementById('specialty').value,
                classe: document.getElementById('classe').value,
                weight_category: document.getElementById('weightCategory').value,
                society_id: society.id,
                event_id: eventId
            };

            const { error } = await supabase.from('atleti').insert([payload]);
            if (error) throw error;
            alert("Atleta registrato!");
            window.fetchAthletes();
            document.getElementById('athleteForm').reset();
        } catch (err) { alert(err.message); }
    });
});
