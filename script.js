/**
 * CONFIGURAZIONE GLOBALE SUPABASE
 * Questo blocco garantisce che 'supabase' sia dichiarato una sola volta
 */
if (typeof window.supabaseClient === 'undefined') {
    // La libreria CDN espone 'supabase' come oggetto globale per creare il client
    const createClient = window.supabase.createClient; 
    
    const supabaseUrl = 'https://qdlfdfswufifgjdhmcsn.supabase.co';
    
    // ⚠️ SOSTITUISCI QUESTA CHIAVE CON LA TUA "ANON PUBLIC KEY"
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGZkZnN3dWZpZmdqZGhtY3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDgyNDksImV4cCI6MjA3NTY4NDI0OX0.M6z_C3naK-EmcUawCjZa6rOkLc57p3XZ98k67CyXPDQ'; 

    window.supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase Client inizializzato correttamente.");
}

// Variabile globale da usare in tutti gli altri script (index, script2.js, ecc.)
var supabase = window.supabaseClient;

const ADMIN_USER_ID = '1a02fab9-1a2f-48d7-9391-696f4fba88a1';

// --- FUNZIONI DI AUTENTICAZIONE ---

async function checkAuth() {
    try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data || !data.user) {
            if (!window.location.href.includes("login.html") && !window.location.href.includes("registrazione.html")) {
                window.location.href = "login.html";
            }
            return null;
        }
        return data.user;
    } catch (e) {
        console.error("Errore checkAuth:", e);
        return null;
    }
}

async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = 'index.html';
    } catch (error) {
        alert("Errore di accesso: " + error.message);
    }
}

// --- CARICAMENTO DATI ---

async function fetchSocietyNameOnLoad() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data } = await supabase.from('societa').select('nome').eq('user_id', user.id).single();
        if (data && document.getElementById('societyNameDisplay')) {
            document.getElementById('societyNameDisplay').textContent = data.nome;
        }
    }
}

// --- GESTIONE EVENTI DOM ---

document.addEventListener('DOMContentLoaded', () => {
    // Gestione Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            await signIn(email, password);
        };
    }

    // Listener per Logout (se presente il bottone)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            await supabase.auth.signOut();
            window.location.href = 'login.html';
        };
    }
});
