// script2.js
const ADMIN_ID = "f5c8f562-6178-4956-89ff-a6d1e3b32514";

// --- 1. FUNZIONE PER POPOLARE LA TABELLA (GRIGLIA) ---
async function fetchAthletes() {
    // 1. Recupera l'utente loggato
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const list = document.getElementById('registrationsList'); // ID corretto della tabella
    if (!list) return;

    let query = supabaseClient.from('atleti').select('*');

    // 2. Filtro Privacy: se non è l'admin, vede solo i propri atleti
    if (user.id !== ADMIN_ID) {
        query = query.eq('created_by', user.id);
    }

    const { data: athletes, error } = await query;

    if (error) {
        console.error("Errore nel caricamento atleti:", error);
        return;
    }

    // 3. Popolamento HTML
    list.innerHTML = '';
    athletes?.forEach(a => {
        const row = list.insertRow();
        row.innerHTML = `
            <td><strong>${a.last_name} ${a.first_name}</strong></td>
            <td><span class="badge bg-secondary">${a.classe}</span></td>
            <td>${a.specialty}</td>
            <td>${a.belt}</td>
            <td>${a.gender}</td>
            <td class="text-end">
                <button class="btn btn-danger btn-sm" onclick="removeAthlete('${a.id}')">Elimina</button>
            </td>
        `;
    });

    // Aggiorna contatore
    const counter = document.getElementById('counter');
    if (counter) counter.innerText = athletes.length;
}

// --- 2. ELIMINAZIONE ATLETA ---
async function removeAthlete(id) {
    if (confirm("Eliminare definitivamente questo atleta?")) {
        const { error } = await supabaseClient.from('atleti').delete().eq('id', id);
        if (error) alert("Errore durante l'eliminazione");
        fetchAthletes(); // Ricarica la tabella
    }
}

// --- 3. CALCOLO AUTOMATICO CLASSE ---
function updateClass() {
    const bDate = document.getElementById('birthdate').value;
    if (!bDate) return;
    const year = new Date(bDate).getFullYear();
    
    // Esempio logica classi
    let classe = "";
    if (year >= 2012) classe = "Esordienti";
    else if (year >= 2010) classe = "Cadetti";
    else classe = "Senior/Master";

    document.getElementById('classe').value = classe;
    
    const spec = document.getElementById('specialty');
    spec.innerHTML = `<option value="Kata">Kata</option><option value="Kumite">Kumite</option>`;
}

// --- 4. INVIO NUOVO ATLETA ---
document.getElementById('athleteForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return alert("Devi essere loggato!");

    const athlete = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        birthdate: document.getElementById('birthdate').value,
        gender: document.getElementById('gender').value,
        classe: document.getElementById('classe').value,
        specialty: document.getElementById('specialty').value,
        belt: document.getElementById('belt').value,
        created_by: user.id // Assicurati che questa colonna esista su Supabase
    };

    const { error } = await supabaseClient.from('atleti').insert([athlete]);
    
    if (error) {
        alert("Errore salvataggio: " + error.message);
    } else {
        e.target.reset();
        fetchAthletes(); // Ricarica la tabella dopo l'inserimento
    }
});

// --- 5. INIZIALIZZAZIONE ---
document.addEventListener('DOMContentLoaded', () => {
    fetchAthletes();
    document.getElementById('birthdate')?.addEventListener('change', updateClass);
});
