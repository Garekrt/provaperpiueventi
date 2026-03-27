const ALLOWED_ADMINS = [
    "f5c8f562-6178-4956-89ff-a6d1e3b32514", // ID Utente 1
    "ff995ba0-7587-4123-a747-0dfa8024ab1c"              // ID Utente 2 (opzionale)
]
let allIscrizioni = []; // Variabile d'appoggio per il filtro locale

async function checkAdmin() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user || !ALLOWED_ADMINS.includes(user.id)) {
        window.location.href = 'index.html';
        return;
    }
    // Carica prima le gare per il filtro, poi i dati
    await fetchEventsForFilter();
    fetchGlobalData();
}

async function fetchEventsForFilter() {
    const { data: gare } = await sb.from('eventi').select('id, nome');
    const select = document.getElementById('eventFilter');
    if (gare) {
        gare.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.nome; // Usiamo il nome per comodità nel filtraggio
            opt.innerText = g.nome;
            select.appendChild(opt);
        });
    }
}

async function fetchGlobalData() {
    const { data, error } = await sb
        .from('iscrizioni_eventi')
        .select(`
            id,
            eventi ( nome ),
            atleti ( 
                first_name, 
                last_name, 
                classe, 
                weight_category),
                societa ( nome )
            )
        `);

    if (error) return;

    allIscrizioni = data; // Salviamo i dati originali
    renderTable(allIscrizioni);
}

function renderTable(list) {
    const container = document.getElementById('globalList');
    const counter = document.getElementById('globalCounter');
    
    counter.innerText = list.length; // Aggiorna il contatore in alto

    container.innerHTML = list.map(i => `
        <tr>
            <td>${i.eventi?.nome || 'N/A'}</td>
            <td>${i.atleti?.societa?.nome || 'N/A'}</td>
            <td>${i.atleti?.last_name} ${i.atleti?.first_name}</td>
            <td>${i.atleti?.classe}</td>
            <td>${i.atleti?.weight_category}</td>
        </tr>
    `).join('');
}

function filterData() {
    const selectedEvent = document.getElementById('eventFilter').value;
    
    if (selectedEvent === "all") {
        renderTable(allIscrizioni);
    } else {
        const filtered = allIscrizioni.filter(i => i.eventi?.nome === selectedEvent);
        renderTable(filtered);
    }
}

function exportToCSV() {
    // Esporta solo ciò che è attualmente visibile in tabella (rispetta il filtro)
    let csv = "Gara,Societa,Atleta,Classe,Peso\n";
    const rows = document.querySelectorAll("#adminTable tbody tr");
    
    rows.forEach(row => {
        const cols = row.querySelectorAll("td");
        if (cols.length > 1) { // Salta messaggi di errore o vuoti
            let rowData = Array.from(cols).map(c => `"${c.innerText}"`);
            csv += rowData.join(",") + "\n";
        }
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `export_iscritti_${new Date().toISOString().slice(0,10)}.csv`);
    link.click();
}

document.addEventListener('DOMContentLoaded', checkAdmin);
