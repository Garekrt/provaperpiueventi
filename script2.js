// Funzione sicura per ottenere l'ID della gara
function getEventId() {
    return new URLSearchParams(window.location.search).get('event_id');
}

async function fetchRegistrations() {
    const eid = getEventId();
    if (!eid) { document.getElementById('lockOverlay').style.display = 'block'; return; }

    const { data: iscritti, error } = await sb.from('iscrizioni_eventi')
        .select('id, atleti(*)')
        .eq('evento_id', eid);

    if (error) return console.error(error);
    
    document.getElementById('counter').innerText = iscritti.length;
    document.getElementById('registrationsList').innerHTML = iscritti.map(i => `
        <tr>
            <td>${i.atleti.last_name} ${i.atleti.first_name}</td>
            <td>${i.atleti.classe}</td>
            <td>${i.atleti.weight_category}</td>
            <td><button class="btn btn-danger btn-sm" onclick="deleteReg('${i.id}')">Elimina</button></td>
        </tr>`).join('');
}

document.getElementById('athleteForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. Controllo Utente (Risolve il TypeError "reading id")
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
        alert("Sessione scaduta o non valida. Effettua il login.");
        window.location.href = 'index.html';
        return;
    }

    const eid = getEventId();
    const athlete = {
        first_name: document.getElementById('firstName').value.trim(),
        last_name: document.getElementById('lastName').value.trim(),
        birthdate: document.getElementById('birthdate').value,
        classe: document.getElementById('classe').value,
        weight_category: document.getElementById('weightCategory').value,
        society_id: user.id 
    };

    try {
        // 2. Inserimento Atleta
        const { data: newAtleta, error: aErr } = await sb.from('atleti').insert([athlete]).select().single();
        
        if (aErr) {
            // Gestione errore 409 Conflict / Duplicato
            if (aErr.code === '23505') throw new Error("Questo atleta è già stato registrato dalla tua società.");
            if (aErr.code === '23503') throw new Error("La tua società non è configurata correttamente nel DB. Contatta l'admin.");
            throw aErr;
        }

        // 3. Iscrizione alla gara
        const { error: iErr } = await sb.from('iscrizioni_eventi').insert([{ atleta_id: newAtleta.id, evento_id: eid }]);
        if (iErr) throw iErr;

        alert("Atleta iscritto con successo!");
        location.reload();
    } catch (err) {
        alert(err.message);
        console.error("Dettaglio Errore:", err);
    }
});

// Listener per data nascita e classi
document.getElementById('birthdate')?.addEventListener('change', (e) => {
    const year = new Date(e.target.value).getFullYear();
    document.getElementById('classe').value = year >= 2012 ? "Esordienti" : "Senior";
    if (typeof updateWeights === "function") updateWeights();
});

document.addEventListener('DOMContentLoaded', () => {
    sb.auth.getUser().then(({data}) => { 
        if(!data.user) window.location.href = 'index.html'; 
        else fetchRegistrations(); 
    });
});
