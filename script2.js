const ADMIN_ID = "f5c8f562-6178-4956-89ff-a6d1e3b32514";

// Funzione per ottenere l'ID gara dall'URL (usata da più parti)
function getEventId() {
    return new URLSearchParams(window.location.search).get('event_id');
}

async function updateWeights() {
    const classe = document.getElementById('classe').value;
    const specialty = document.getElementById('specialty').value;
    const gender = document.getElementById('gender').value;
    const w = document.getElementById('weightCategory');

    if (specialty === "Kata") {
        w.innerHTML = '<option value="N/A">N/A</option>';
        w.disabled = true;
    } else {
        w.disabled = false;
        let options = classe === "Esordienti" 
            ? (gender === "M" ? "-38,-45,+45" : "-35,-42,+42") 
            : "Open";
        w.innerHTML = options.split(',').map(o => `<option value="${o}">${o}kg</option>`).join('');
    }
}

async function fetchRegistrations() {
    const currentEventId = getEventId();
    if (!currentEventId) { 
        document.getElementById('lockOverlay').style.display = 'block'; 
        return; 
    }

    const { data: iscritti } = await sb.from('iscrizioni_eventi')
        .select('id, atleti(*)')
        .eq('evento_id', currentEventId);

    document.getElementById('counter').innerText = iscritti.length;
    document.getElementById('registrationsList').innerHTML = iscritti.map(i => `
        <tr>
            <td>${i.atleti.last_name} ${i.atleti.first_name}</td>
            <td>${i.atleti.classe}</td>
            <td>${i.atleti.weight_category}</td>
            <td><button class="btn btn-danger btn-sm" onclick="deleteReg('${i.id}')">Elimina</button></td>
        </tr>`).join('');
}

async function deleteReg(regId) {
    if (confirm("Eliminare iscrizione?")) {
        await sb.from('iscrizioni_eventi').delete().eq('id', regId);
        fetchRegistrations();
    }
}

document.getElementById('athleteForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { user } } = await sb.auth.getUser();
    
    if (!user) { alert("Sessione scaduta"); return; }

    const athlete = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        birthdate: document.getElementById('birthdate').value,
        classe: document.getElementById('classe').value,
        weight_category: document.getElementById('weightCategory').value,
        society_id: user.id 
    };

    try {
        const { data: newAtleta, error: aErr } = await sb.from('atleti').insert([athlete]).select().single();
        if (aErr) throw aErr;

        await sb.from('iscrizioni_eventi').insert([{ atleta_id: newAtleta.id, evento_id: getEventId() }]);
        alert("Iscritto!");
        location.reload();
    } catch (err) {
        alert("Errore: " + err.message);
    }
});

document.getElementById('birthdate')?.addEventListener('change', (e) => {
    const year = new Date(e.target.value).getFullYear();
    document.getElementById('classe').value = year >= 2012 ? "Esordienti" : "Senior";
    updateWeights();
});

document.addEventListener('DOMContentLoaded', () => {
    sb.auth.getUser().then(({data}) => { 
        if(!data.user) window.location.href = 'index.html'; 
        else fetchRegistrations(); 
    });
});
