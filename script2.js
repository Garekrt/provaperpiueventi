const getGaraId = () => new URLSearchParams(window.location.search).get('event_id');

async function fetchRegistrations() {
    const gid = getGaraId();
    if (!gid) return;

    const { data: iscritti } = await sb.from('iscrizioni_eventi')
        .select('id, atleti(*)')
        .eq('evento_id', gid);

    const list = document.getElementById('registrationsList');
    if (list && iscritti) {
        document.getElementById('counter').innerText = iscritti.length;
        list.innerHTML = iscritti.map(i => `
            <tr>
                <td>${i.atleti.last_name} ${i.atleti.first_name}</td>
                <td>${i.atleti.classe}</td>
                <td>${i.atleti.weight_category}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteReg('${i.id}')">Elimina</button></td>
            </tr>`).join('');
    }
}

async function deleteReg(id) {
    if (confirm("Eliminare iscrizione?")) {
        await sb.from('iscrizioni_eventi').delete().eq('id', id);
        fetchRegistrations();
    }
}

document.getElementById('athleteForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { user } } = await sb.auth.getUser();
    
    if (!user) {
        alert("Sessione scaduta. Rifai il login.");
        window.location.href = 'index.html';
        return;
    }

    const atleta = {
        first_name: document.getElementById('firstName').value.trim(),
        last_name: document.getElementById('lastName').value.trim(),
        birthdate: document.getElementById('birthdate').value,
        classe: document.getElementById('classe').value,
        weight_category: document.getElementById('weightCategory').value,
        society_id: user.id 
    };

    try {
        const { data: newAtleta, error: aErr } = await sb.from('atleti').insert([atleta]).select().single();
        
        if (aErr) {
            if (aErr.code === '23503') throw new Error("Società non configurata nel DB.");
            if (aErr.code === '23505') throw new Error("Atleta già presente.");
            throw aErr;
        }

        await sb.from('iscrizioni_eventi').insert([{ atleta_id: newAtleta.id, evento_id: getGaraId() }]);
        alert("Iscritto con successo!");
        location.reload();
    } catch (err) {
        alert(err.message);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    sb.auth.getUser().then(({data}) => {
        if (!data.user) window.location.href = 'index.html';
        else fetchRegistrations();
    });
});
