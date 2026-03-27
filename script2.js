const getGaraId = () => new URLSearchParams(window.location.search).get('event_id');

async function fetchRegistrations() {
    const gid = getGaraId();
    if (!gid) return;

    const { data: iscritti, error } = await sb.from('iscrizioni_eventi')
        .select('id, atleti(*)')
        .eq('evento_id', gid);

    if (error) return;

    const list = document.getElementById('registrationsList');
    if (list && iscritti) {
        document.getElementById('counter').innerText = iscritti.length;
        list.innerHTML = iscritti.map(i => {
            if (!i.atleti) return '';
            return `
                <tr>
                    <td>${i.atleti.last_name} ${i.atleti.first_name}</td>
                    <td>${i.atleti.classe}</td>
                    <td>${i.atleti.weight_category}</td>
                    <td><button class="btn btn-danger btn-sm" onclick="deleteReg('${i.id}')">Elimina</button></td>
                </tr>`;
        }).join('');
    }
}

document.getElementById('athleteForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
        alert("Sessione scaduta.");
        window.location.href = 'index.html';
        return;
    }

    // MAPPATURA SINCRONIZZATA
    const atleta = {
        first_name: document.getElementById('firstName').value.trim(),
        last_name: document.getElementById('lastName').value.trim(),
        birthdate: document.getElementById('birthdate').value, // PROVA CON 'birthdate' (con la E)
        gender: document.getElementById('gender')?.value || 'M',
        classe: document.getElementById('classe').value,
        speciality: document.getElementById('specialty')?.value || 'Kumite',
        belt: document.getElementById('belt')?.value || 'Bianca',
        weight_category: document.getElementById('weightCategory').value,
        society_id: user.id 
    };

    try {
        const { data: newAtleta, error: aErr } = await sb.from('atleti').insert([atleta]).select().single();
        
        if (aErr) {
            console.error("Errore DB:", aErr);
            // Se l'errore dice ancora "Could not find column", cambia 'birthdate' in 'birthday' sopra
            throw new Error("Errore: " + aErr.message);
        }

        await sb.from('iscrizioni_eventi').insert([
            { atleta_id: newAtleta.id, evento_id: getGaraId() }
        ]);

        alert("Atleta iscritto!");
        location.reload();

    } catch (err) {
        alert(err.message);
        submitBtn.disabled = false;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    sb.auth.getUser().then(({data}) => {
        if (!data.user) window.location.href = 'index.html';
        else fetchRegistrations();
    });
});
