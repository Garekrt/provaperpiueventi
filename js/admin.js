const ALLOWED_ADMINS = [
    "f5c8f562-6178-4956-89ff-a6d1e3b32514", // ID Utente 1
    "ff995ba0-7587-4123-a747-0dfa8024ab1c"              // ID Utente 2 (opzionale)
];

async function checkAdmin() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user || !ALLOWED_ADMINS.includes(user.id)) {
        window.location.href = 'index.html';
        return;
    }
    fetchGlobalData();
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
                weight_category,
                societa ( nome )
            )
        `);

    if (error) {
        console.error(error);
        return;
    }

    const container = document.getElementById('globalList');
    container.innerHTML = data.map(i => `
        <tr>
            <td>${i.eventi?.nome || 'N/A'}</td>
            <td>${i.atleti?.societa?.nome || 'N/A'}</td>
            <td>${i.atleti?.last_name} ${i.atleti?.first_name}</td>
            <td>${i.atleti?.classe}</td>
            <td>${i.atleti?.weight_category}</td>
            <td>${i.atleti?.gender || 'N/A'}</td>
        </tr>
    `).join('');
}

function exportToCSV() {
    let csv = "Gara,Societa,Atleta,Classe,Peso\n";
    const rows = document.querySelectorAll("#adminTable tr");
    
    for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].querySelectorAll("td");
        let rowData = [];
        for (let j = 0; j < cols.length; j++) rowData.push('"' + cols[j].innerText + '"');
        csv += rowData.join(",") + "\n";
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "iscritti_totali.csv");
    link.click();
}

document.addEventListener('DOMContentLoaded', checkAdmin);
