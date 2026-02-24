// 1. INIZIALIZZAZIONE SUPABASE
const { createClient } = window.supabase;
const supabaseUrl = 'https://qdlfdfswufifgjdhmcsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGZkZnN3dWZpZmdqZGhtY3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEwODI0OSwiZXhwIjoyMDc1Njg0MjQ5fQ.cPQpmwujaQWufmk6BThsW15Hk3xD1dplw9FRrZG38BQ';
window.supabaseClient = createClient(supabaseUrl, supabaseKey);
var supabase = window.supabaseClient;

// ⚠️ ADMIN ID (Deve corrispondere al tuo UUID in Auth -> Users)
const ADMIN_USER_ID = '1a02fab9-1a2f-48d7-9391-696f4fba88a1';

// 2. FUNZIONI DI AUTENTICAZIONE
window.checkAuth = async function() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        if (!window.location.pathname.includes('login.html')) window.location.href = "login.html";
        return null;
    }
    return user;
};

window.signIn = async function(email, password) {
    try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = 'index.html';
    } catch (err) { alert("Errore Accesso: " + err.message); }
};

window.signOut = async function() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
};

// 3. CARICAMENTO DATI INIZIALI (SOCIETÀ E MODALITÀ ADMIN)
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
            // Aggiorna UI con nome società e ID reale per i form
            if (document.getElementById('societyNameDisplay')) document.getElementById('societyNameDisplay').textContent = society.nome;
            if (document.getElementById('adminSocietyIdDisplay')) document.getElementById('adminSocietyIdDisplay').textContent = society.id;

            // ATTIVAZIONE MODALITÀ ADMIN
            if (user.id === ADMIN_USER_ID) {
                const adminSection = document.getElementById('adminEventCreation');
                if (adminSection) {
                    adminSection.style.display = 'block';
                    console.log("Modalità Amministratore Attivata.");
                }
            }
        }
    } catch (err) { console.error("Errore Caricamento Società:", err.message); }
};

// Esegui al caricamento
document.addEventListener('DOMContentLoaded', window.fetchSocietyNameOnLoad);
