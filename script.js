// ==========================================
// 1. CONFIGURAZIONE SUPABASE
// ==========================================
const { createClient } = window.supabase;
const supabaseUrl = 'https://qdlfdfswufifgjdhmcsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGZkZnN3dWZpZmdqZGhtY3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEwODI0OSwiZXhwIjoyMDc1Njg0MjQ5fQ.cPQpmwujaQWufmk6BThsW15Hk3xD1dplw9FRrZG38BQ';
window.supabaseClient = createClient(supabaseUrl, supabaseKey);
var supabase = window.supabaseClient;

// Sostituisci questo ID con il tuo UUID che trovi in Supabase -> Auth -> Users
const ADMIN_USER_ID = '1a02fab9-1a2f-48d7-9391-696f4fba88a1';

// ==========================================
// 2. FUNZIONI DI AUTENTICAZIONE (Globale)
// ==========================================
window.signIn = async function(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        console.log("Login OK");
        window.location.href = 'index.html';
    } catch (err) {
        alert("Errore Accesso: " + err.message);
    }
};

window.signOut = async function() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
};

window.checkAuth = async function() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = "login.html";
        }
        return null;
    }
    return user;
};

// ==========================================
// 3. CARICAMENTO DATI SOCIETÀ E ADMIN
// ==========================================
window.fetchSocietyNameOnLoad = async function() {
    const user = await window.checkAuth();
    if (!user) return;

    try {
        const { data: society, error } = await supabase
            .from('societa')
            .select('id, nome')
            .eq('user_id', user.id)
            .single();

        if (society) {
            // Aggiorna Nome Società
            const nameDisplay = document.getElementById('societyNameDisplay');
            if (nameDisplay) nameDisplay.textContent = society.nome;

            // Aggiorna ID per creazione eventi
            const idDisplay = document.getElementById('adminSocietyIdDisplay');
            if (idDisplay) idDisplay.textContent = society.id;

            // Attivazione Pannello Admin
            if (user.id === ADMIN_USER_ID) {
                const adminSection = document.getElementById('adminEventCreation');
                if (adminSection) adminSection.style.display = 'block';
            }
        }
    } catch (err) {
        console.error("Errore fetchSociety:", err.message);
    }
};

// Inizializzazione automatica
document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.includes('login.html')) {
        window.fetchSocietyNameOnLoad();
    }
});
