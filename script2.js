const ADMIN_ID = "f5c8f562-6178-4956-89ff-a6d1e3b32514";

async function handleLogout() {
    await sb.auth.signOut();
    window.location.href = 'index.html';
}

// Logica Pesi e Classi (Script 2 Vecchio)
function handleDataChange() {
    const bDate = document.getElementById('birthdate').value;
    const gender = document.getElementById('gender').value;
    const specialty = document.getElementById('specialty').value;
    if (!bDate) return;

    const year = new Date(bDate).getFullYear();
    let classe = "";
    if (year >= 2012) classe = "Esordienti";
    else if (year >= 2010) classe = "Cadetti";
    else classe = "Senior";
    document.getElementById('classe').value = classe;

    const w = document.getElementById('weightCategory');
    if (specialty === "Kata") {
        w.innerHTML = '<option value="N/A">N/A</option>';
        w.disabled = true;
    } else {
        w.disabled = false;
        let options = classe === "Esordienti" ? "-38,-45,+45" : "Open";
        w.innerHTML = options.split(',').map(o => `<option value="${o}">${o}kg</option>`).join('');
    }
}

async function fetchRegistrations() {
    const eventId = new URLSearchParams(window.location.search).get('event_id');
    if (!eventId) return;

    const { data: iscritti } = await sb.from('iscrizioni_eventi').select('id, atleti(*)').eq('evento_id', eventId);
    const container = document.getElementById('registrationsList');
    if (container) {
        container.innerHTML = iscritti.map(i => `
            <tr>
                <td>${i.atleti.last_name} ${i.atleti.first_name}</td>
                <td>${i.atleti.classe}</td>
                <td>${i.atleti.weight_category}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteReg('${i.id}')">Elimina</button></td>
            </tr>`).join('');
    }
}

// FUNZIONE REGISTRAZIONE CORRETTA
document.getElementById('athleteForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const eventId = new URLSearchParams(window.location.search).get('event_id');
    if (!eventId) return alert("Devi selezionare un evento!");

    const { data: { user } } = await sb.auth.getUser();

    const athlete = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        birthdate: document.getElementById('birthdate').value,
        classe: document.getElementById('classe').value,
        weight_category: document.getElementById('weightCategory').value,
        created_by: user.id
    };

    const { data: newAtleta, error } = await sb.from('atleti').insert([athlete]).select().single();
    
    if (error) {
        alert("Errore registrazione: " + error.message);
    } else {
        await sb.from('iscrizioni_eventi').insert([{ atleta_id: newAtleta.id, evento_id: eventId }]);
        alert("Atleta Iscritto!");
        location.reload();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    sb.auth.getUser().then(({data}) => { 
        if(!data.user) window.location.href='index.html'; 
        else fetchRegistrations(); 
    });
    document.getElementById('birthdate')?.addEventListener('change', handleDataChange);
    document.getElementById('specialty')?.addEventListener('change', handleDataChange);
});
