const ADMIN_ID = "f5c8f562-6178-4956-89ff-a6d1e3b32514";

async function handleLogout() {
    await sb.auth.signOut();
    window.location.href = 'index.html';
}

function updateWeights() {
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

async function deleteReg(regId) {
    if (confirm("Sei sicuro di voler eliminare questa iscrizione?")) {
        const { error } = await sb
            .from('iscrizioni_eventi')
            .delete()
            .eq('id', regId);

        if (error) {
            alert("Errore durante l'eliminazione: " + error.message);
        } else {
            alert("Iscrizione eliminata!");
            fetchRegistrations();
        }
    }
}

async function fetchRegistrations() {
    const eventId = new URLSearchParams(window.location.search).get('event_id');
    if (!eventId) { 
        document.getElementById('lockOverlay').style.display = 'block'; 
        return; 
    }

    const { data: iscritti } = await sb.from('iscrizioni_eventi').select('id, atleti(*)').eq('evento_id', eventId);
    const container = document.getElementById('registrationsList');
    document.getElementById('counter').innerText = iscritti.length;
    
    container.innerHTML = iscritti.map(i => `
        <tr>
            <td>${i.atleti.last_name} ${i.atleti.first_name}</td>
            <td>${i.atleti.classe}</td>
            <td>${i.atleti.weight_category}</td>
            <td><button class="btn btn-danger btn-sm" onclick="deleteReg('${i.id}')">Elimina</button></td>
        </tr>`).join('');
}

document.getElementById('athleteForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. Controllo Sessione (Risolve il TypeError)
    const { data: { user }, error: authError } = await sb.auth.getUser();
    if (!user || authError) {
        alert("Sessione scaduta. Effettua nuovamente il login.");
        window.location.href = 'index.html';
        return;
    }

    const eventId = new URLSearchParams(window.location.search).get('event_id');
    
    // 2. Preparazione dati
    const athlete = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        birthdate: document.getElementById('birthdate').value,
        classe: document.getElementById('classe').value,
        weight_category: document.getElementById('weightCategory').value,
        society_id: user.id 
    };

    try {
        // 3. Inserimento Atleta (Gestione errore 409)
        const { data: newAtleta, error: aErr } = await sb
            .from('atleti')
            .insert([athlete])
            .select()
            .single();

        if (aErr) {
            if (aErr.code === '23505') {
                throw new Error("Questo atleta è già registrato nel database della tua società.");
            }
            throw aErr;
        }
        
        // 4. Iscrizione all'evento
        const { error: iErr } = await sb
            .from('iscrizioni_eventi')
            .insert([{ atleta_id: newAtleta.id, evento_id: eventId }]);
            
        if (iErr) throw iErr;

        alert("Atleta iscritto correttamente!");
        location.reload();

    } catch (err) {
        alert("Errore: " + err.message);
        console.error("Dettaglio errore:", err);
    }
});
document.getElementById('birthdate').addEventListener('change', (e) => {
    const year = new Date(e.target.value).getFullYear();
    document.getElementById('classe').value = year >= 2012 ? "Esordienti" : "Senior";
    updateWeights();
});

document.addEventListener('DOMContentLoaded', () => {
    sb.auth.getUser().then(({data}) => { 
        if(!data.user) {
            window.location.href = 'index.html'; 
        } else {
            fetchRegistrations(); 
        }
    });
});
