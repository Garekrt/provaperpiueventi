const getGaraId = () => new URLSearchParams(window.location.search).get('event_id');

async function fetchRegistrations() {
    const gid = getGaraId();
    if (!gid) return;

    const { data: iscritti, error } = await sb.from('iscrizioni_eventi')
        .select('id, atleti(*)')
        .eq('evento_id', gid);

    if (error) return console.error("Errore fetch:", error);

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

    // MAPPATURA ESATTA SULLE TUE COLONNE:
    // society_id, first_name, last_name, gender, birthday, classe, speciality, belt, weight_category
    const atleta = {
        first_name: document.getElementById('firstName').value.trim(),
        last_name: document.getElementById('lastName').value.trim(),
        birthday: document.getElementById('birthdate').value, // Nel DB è 'birthday'
        gender: document.getElementById('gender')?.value || 'M',
        classe: document.getElementById('classe').value,
        speciality: document.getElementById('specialty')?.value || 'Kumite',
        belt: document.getElementById('belt')?.value || 'Bianca',
        weight_category: document.getElementById('weightCategory').value,
        society_id: user.id // Nella tabella ATLETI si chiama 'society_id'
    };

    try {
        // 1. Inserimento Atleta
        const { data: newAtleta, error: aErr } = await sb.from('atleti').insert([atleta]).select().single();
        
        if (aErr) {
            console.error("Errore Dettagliato:", aErr);
            throw new Error("Errore inserimento atleta: " + aErr.message);
        }

        // 2. Iscrizione alla gara
        const { error: iErr } = await sb.from('iscrizioni_eventi').insert([
            { atleta_id: newAtleta.id, evento_id: getGaraId() }
        ]);

        if (iErr) throw iErr;

        alert("Atleta iscritto con successo!");
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
