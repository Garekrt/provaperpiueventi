/**
 * script2.js - Calcolo Classi, Pesi e Invio Dati
 */

// 1. Calcolo automatico Classe e Specialità in base all'età
function handleBirthDateChange() {
    const bDate = document.getElementById('birthdate').value;
    const gender = document.getElementById('gender').value;
    if (!bDate) return;

    const year = new Date(bDate).getFullYear();
    let classe = "";
    
    // Logica Anno Corrente 2024/2025/2026
    if (year >= 2020) classe = "Bambini U6";
    else if (year >= 2018) classe = "Bambini U8";
    else if (year >= 2016) classe = "Fanciulli";
    else if (year >= 2014) classe = "Ragazzi";
    else if (year >= 2012) classe = "Esordienti";
    else if (year >= 2010) classe = "Cadetti";
    else if (year >= 2008) classe = "Juniores";
    else if (year >= 1990) classe = "Seniores";
    else classe = "Master";

    document.getElementById('classe').value = classe;
    updateSpecialties(classe);
    updateWeights(classe, gender, document.getElementById('specialty').value);
}

function updateSpecialties(classe) {
    const s = document.getElementById('specialty');
    s.innerHTML = "";
    if (classe.includes("Bambini")) {
        s.innerHTML = `<option value="Percorso-Kata">Percorso-Kata</option><option value="Percorso-Palloncino">Percorso-Palloncino</option><option value="ParaKarate">ParaKarate</option>`;
    } else {
        s.innerHTML = `<option value="Kata">Kata</option><option value="Kumite">Kumite</option><option value="ParaKarate">ParaKarate</option>`;
    }
}

// 2. Logica Pesi (Tutte le categorie)
function updateWeights(classe, gender, specialty) {
    const w = document.getElementById('weightCategory');
    w.innerHTML = "";
    if (specialty !== "Kumite" && specialty !== "ParaKarate") {
        w.setAttribute("disabled", "disabled");
        return;
    }
    w.removeAttribute("disabled");
    const isM = (gender === "M");

    if (specialty === "Kumite") {
        if (classe === "Esordienti") {
            if (isM) ["-40", "-45", "-50", "-55", "+55"].forEach(p => w.innerHTML += `<option value="${p}">${p} Kg</option>`);
            else ["-42", "-47", "-52", "+52"].forEach(p => w.innerHTML += `<option value="${p}">${p} Kg</option>`);
        } else if (classe === "Cadetti") {
            if (isM) ["-47", "-52", "-57", "-63", "-70", "-78", "+78"].forEach(p => w.innerHTML += `<option value="${p}">${p} Kg</option>`);
            else ["-42", "-47", "-54", "-61", "-68", "+68"].forEach(p => w.innerHTML += `<option value="${p}">${p} Kg</option>`);
        } else if (classe === "Juniores") {
            if (isM) ["-50", "-55", "-61", "-68", "-76", "-86", "+86"].forEach(p => w.innerHTML += `<option value="${p}">${p} Kg</option>`);
            else ["-48", "-53", "-59", "-66", "-74", "+74"].forEach(p => w.innerHTML += `<option value="${p}">${p} Kg</option>`);
        } else if (classe === "Seniores" || classe === "Master") {
            if (isM) ["-60", "-67", "-75", "-84", "+84"].forEach(p => w.innerHTML += `<option value="${p}">${p} Kg</option>`);
            else ["-50", "-55", "-61", "-68", "+68"].forEach(p => w.innerHTML += `<option value="${p}">${p} Kg</option>`);
        } else {
            w.innerHTML = `<option value="Open">Categoria Unica</option>`;
        }
    } else if (specialty === "ParaKarate") {
        ["K21", "K22", "K30"].forEach(k => w.innerHTML += `<option value="${k}">${k}</option>`);
    }
}

// 3. Invio a Supabase
async function handleFormSubmit(e) {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');

    // Recupera ID società (Assunto che l'utente sia loggato)
    const { data: { user } } = await supabase.auth.getUser();
    const { data: soc } = await supabase.from('societa').select('id').eq('user_id', user.id).single();

    const athlete = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        birthdate: document.getElementById('birthdate').value,
        gender: document.getElementById('gender').value,
        classe: document.getElementById('classe').value,
        specialty: document.getElementById('specialty').value,
        belt: document.getElementById('belt').value,
        weight_category: document.getElementById('weightCategory').value,
        society_id: soc.id
    };

    const { data: newAtleta, error: errA } = await supabase.from('atleti').insert([athlete]).select().single();
    if (errA) return alert("Errore: " + errA.message);

    if (eventId) {
        await supabase.from('iscrizioni_eventi').insert([{ atleta_id: newAtleta.id, evento_id: eventId }]);
    }

    alert("Atleta registrato con successo!");
    location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('birthdate').addEventListener('change', handleBirthDateChange);
    document.getElementById('gender').addEventListener('change', handleBirthDateChange);
    document.getElementById('specialty').addEventListener('change', handleBirthDateChange);
    document.getElementById('athleteForm').addEventListener('submit', handleFormSubmit);
});
