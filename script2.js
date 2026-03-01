// script2.js
function handleBirthDateChange() {
    const bDate = document.getElementById('birthdate').value;
    const gender = document.getElementById('gender').value;
    if (!bDate) return;

    const year = new Date(bDate).getFullYear();
    let classe = "";
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
}

function updateSpecialties(classe) {
    const s = document.getElementById('specialty');
    s.innerHTML = classe.includes("Bambini") 
        ? `<option value="Percorso-Kata">Percorso-Kata</option><option value="Percorso-Palloncino">Percorso-Palloncino</option>`
        : `<option value="Kata">Kata</option><option value="Kumite">Kumite</option>`;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return alert("Devi essere loggato!");

    const athlete = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        birthdate: document.getElementById('birthdate').value,
        gender: document.getElementById('gender').value,
        classe: document.getElementById('classe').value,
        specialty: document.getElementById('specialty').value,
        belt: document.getElementById('belt').value
    };

    const { data: newAtleta, error: errA } = await supabaseClient.from('atleti').insert([athlete]).select().single();
    if (errA) return alert("Errore: " + errA.message);

    if (eventId) {
        await supabaseClient.from('iscrizioni_eventi').insert([{ atleta_id: newAtleta.id, evento_id: eventId }]);
    }

    alert("Atleta registrato!");
    location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('birthdate')?.addEventListener('change', handleBirthDateChange);
    document.getElementById('athleteForm')?.addEventListener('submit', handleFormSubmit);
});
