// GESTIONE VISIBILITÀ E CONTATORI
async function updateAllCounters(eventId = null) {
    const form = document.getElementById('athleteForm');
    if (form) form.style.display = 'block'; // Forza visibilità

    if (!eventId) return; // Se non c'è evento, non carica i contatori

    const specialties = ["Kumite", "Kata", "ParaKarate", "KIDS"];
    for (const spec of specialties) {
        const { count } = await supabase.from('iscrizioni_eventi').select('id', { count: 'exact' }).eq('evento_id', eventId);
        const display = document.getElementById(`${spec}AthleteCountDisplay`);
        if (display) display.textContent = count || 0;
    }
}

// CATEGORIE DI PESO DETTAGLIATE
function updateWeightCategoryOptions(classe, gender, specialty) {
    const weightField = document.getElementById("weightCategory");
    if (!weightField) return;
    weightField.innerHTML = "";
    const isM = (gender === "M" || gender === "Maschio");

    if (specialty === "Kumite") {
        weightField.removeAttribute("disabled");
        if (classe === "Esordienti") {
            if (isM) {
                weightField.innerHTML += `<option value="-40">M -40 Kg</option>`;
                weightField.innerHTML += `<option value="-45">M -45 Kg</option>`;
                weightField.innerHTML += `<option value="-50">M -50 Kg</option>`;
                weightField.innerHTML += `<option value="-55">M -55 Kg</option>`;
                weightField.innerHTML += `<option value="+55">M +55 Kg</option>`;
            } else {
                weightField.innerHTML += `<option value="-42">F -42 Kg</option>`;
                weightField.innerHTML += `<option value="-47">F -47 Kg</option>`;
                weightField.innerHTML += `<option value="-52">F -52 Kg</option>`;
                weightField.innerHTML += `<option value="+52">F +52 Kg</option>`;
            }
        } 
        else if (classe === "Cadetti") {
            if (isM) {
                weightField.innerHTML += `<option value="-47">M -47 Kg</option>`;
                weightField.innerHTML += `<option value="-52">M -52 Kg</option>`;
                weightField.innerHTML += `<option value="-57">M -57 Kg</option>`;
                weightField.innerHTML += `<option value="-63">M -63 Kg</option>`;
                weightField.innerHTML += `<option value="-70">M -70 Kg</option>`;
                weightField.innerHTML += `<option value="-78">M -78 Kg</option>`;
                weightField.innerHTML += `<option value="+78">M +78 Kg</option>`;
            } else {
                weightField.innerHTML += `<option value="-42">F -42 Kg</option>`;
                weightField.innerHTML += `<option value="-47">F -47 Kg</option>`;
                weightField.innerHTML += `<option value="-54">F -54 Kg</option>`;
                weightField.innerHTML += `<option value="-61">F -61 Kg</option>`;
                weightField.innerHTML += `<option value="-68">F -68 Kg</option>`;
                weightField.innerHTML += `<option value="+68">F +68 Kg</option>`;
            }
        }
        // ... (Qui puoi aggiungere tutte le altre classi seguendo lo stesso schema)
    } else if (specialty === "ParaKarate") {
        weightField.removeAttribute("disabled");
        weightField.innerHTML += `<option value="K20">K 20</option>`;
        weightField.innerHTML += `<option value="K21">K 21</option>`;
        weightField.innerHTML += `<option value="K22">K 22</option>`;
        weightField.innerHTML += `<option value="K30">K 30</option>`;
    } else {
        weightField.setAttribute("disabled", "disabled");
    }
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');
    updateAllCounters(eventId);
});
