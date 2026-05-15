/**
 * =============================================================================
 * LITTLESTEPS - APP.JS                          
 * =============================================================================
 * * PROIECT: Sistem de Management și Monitorizare pentru Evoluția Copilului
 * MATERIE: Tehnologii Web / Dezvoltare Aplicații Web
 * AUTOR: Alexa Ioana
 * VERSIUNE: 2.2 (Build: 2026.05.15)
 * * DESCRIERE:
 * Acest fișier conține întreaga logică de frontend a aplicației LittleSteps.
 * Gestionează interacțiunea cu utilizatorul, comunicarea cu API-ul PHP (REST),
 * administrarea cookie-urilor pentru preferințe, randarea graficelor (Chart.js)
 * și procesarea timeline-ului în timp real.
 * * IMPLEMENTĂRI RECENTE:
 * - Sistem de consimțământ Cookie (GDPR Compliance)
 * - Persistență temă (Dark Mode) prin module Cookie
 * - Monitorizare Dentiție (Interfață interactivă)
 * - Monitorizare Scutece (Umed/Murdar/Ambele)
 * - Cronometru somn în timp real
 * * =============================================================================
 */


/**
 * -----------------------------------------------------------------------------
 * --- UTILITARE PENTRU MODULELE COOKIE ---
 * -----------------------------------------------------------------------------
 * Folosim cookie-uri pentru a respecta cerințele de stocare a datelor pe
 * partea de client, accesibile și de către server (PHP).
 */

/**
 * Setează un cookie în browserul utilizatorului.
 * * @param {string} name - Numele identificatorului pentru cookie.
 * @param {string} value - Valoarea ce urmează a fi stocată.
 * @param {number} days - Numărul de zile până la expirare.
 */
function setCookie(name, value, days) {
    const date = new Date();
    
    // Calculăm data de expirare transformând zilele în milisecunde
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    
    let expires = "expires=" + date.toUTCString();
    
    // Construim string-ul final pentru document.cookie
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
    
    console.log(`[Cookie System] S-a setat cookie: ${name}`);
}

/**
 * Recuperează valoarea unui cookie existent.
 * * @param {string} name - Numele cookie-ului căutat.
 * @returns {string|null} - Returnează valoarea sau null dacă nu există.
 */
function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        
        // Eliminăm spațiile libere de la începutul string-ului
        while (c.charAt(0) == ' ') {
            c = c.substring(1, c.length);
        }
        
        // Dacă găsim potrivirea, returnăm valoarea extrasă
        if (c.indexOf(nameEQ) == 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    
    return null;
}


/**
 * -----------------------------------------------------------------------------
 * --- VARIABILE DE STARE GLOBALE ---
 * -----------------------------------------------------------------------------
 */

// ID-ul copilului selectat curent în interfață
let selectedChildId = null; 

// Instanța obiectului Chart.js pentru a permite distrugerea/recrearea graficului
let growthChart = null; 

// Reținem timpul de start al somnului în localStorage pentru persistență la refresh
let sleepStartTime = localStorage.getItem('sleepStartTime'); 


/**
 * -----------------------------------------------------------------------------
 * --- SISTEM DARK MODE (PERSISTENȚĂ COOKIE) ---
 * -----------------------------------------------------------------------------
 */

/**
 * Schimbă tema vizuală între Light și Dark.
 * Salvează preferința într-un cookie pentru a fi reținută pe termen lung.
 */
function toggleDarkMode() {
    const rootElement = document.documentElement;
    const currentTheme = rootElement.getAttribute('data-theme');
    
    // Switch între cele două stări
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Aplicăm atributul în DOM
    rootElement.setAttribute('data-theme', newTheme);
    
    // Persistăm alegerea utilizatorului (valabilitate 1 an)
    setCookie("theme", newTheme, 365);
    
    console.log(`[UI] Tema a fost schimbată în: ${newTheme}`);
}

/**
 * Verificare inițială a temei la încărcarea paginii.
 */
(function initializeTheme() {
    const savedTheme = getCookie("theme");
    
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
})();


/**
 * -----------------------------------------------------------------------------
 * --- GESTIONARE CONSIMȚĂMÂNT GDPR ---
 * -----------------------------------------------------------------------------
 */

/**
 * Verifică dacă utilizatorul a acceptat deja politica de module cookie.
 * Dacă nu, afișează bannerul de informare.
 */
function checkCookieConsent() {
    const consent = getCookie("cookie_consent");
    
    if (!consent) {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.style.display = 'block';
        }
    }
}

/**
 * Acțiunea executată la apăsarea butonului "Accept" din banner.
 */
function acceptCookies() {
    // Salvăm consimțământul pentru 30 de zile
    setCookie("cookie_consent", "accepted", 30);
    
    const banner = document.getElementById('cookie-banner');
    if (banner) {
        banner.style.display = 'none';
    }
    
    console.log("[Compliance] Consimțământ cookie înregistrat.");
}


/**
 * -----------------------------------------------------------------------------
 * --- UTILITARE CALCUL ȘI FORMATARE ---
 * -----------------------------------------------------------------------------
 */

/**
 * Calculează vârsta exactă (Ani, Luni, Zile) pornind de la o dată de naștere.
 * * @param {string} birthday - Data în format YYYY-MM-DD.
 * @returns {string} - String formatat pentru afișare.
 */
function getAgeString(birthday) {
    if (!birthday) return "";
    
    const birthDate = new Date(birthday);
    const today = new Date();
    
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    // Corecție pentru zile negative
    if (days < 0) {
        months--;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        days += lastMonth;
    }

    // Corecție pentru luni negative
    if (months < 0) {
        years--;
        months += 12;
    }

    let parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'an' : 'ani'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'lună' : 'luni'}`);
    if (days > 0) parts.push(`${days} ${days === 1 ? 'zi' : 'zile'}`);

    return parts.length > 0 ? parts.join(', ') : "Nou-născut";
}


/**
 * -----------------------------------------------------------------------------
 * --- NAVIGARE ȘI GESTIONARE SECȚIUNI (SPA) ---
 * -----------------------------------------------------------------------------
 */

/**
 * Gestionează vizibilitatea secțiunilor în format Single Page Application.
 * * @param {string} sectionName - Numele secțiunii de activat.
 */
function showSection(sectionName) {
    // 1. Ascundem toate elementele din clasa app-section
    const allSections = document.querySelectorAll('.app-section');
    allSections.forEach(section => {
        section.style.display = 'none';
    });
    
    // 2. Resetăm starea meniului lateral (clasa active)
    const menuItems = document.querySelectorAll('.sidebar li');
    menuItems.forEach(li => {
        li.classList.remove('active');
    });

    // 3. Activăm secțiunea cerută și butonul corespunzător
    const targetSection = document.getElementById(`section-${sectionName}`);
    const targetMenu = document.getElementById(`menu-${sectionName}`);
    
    if (targetSection) targetSection.style.display = 'block';
    if (targetMenu) targetMenu.classList.add('active');
    
    // 4. Actualizăm titlul din Top Bar
    const titles = { 
        timeline: '🏠 Timeline Activități', 
        daily: '📝 Jurnal Zilnic',
        medical: '🏥 Istoric Medical', 
        teeth: '🦷 Harta Dentiție',
        evolution: '📈 Evoluție & Creștere',
        vaccines: '💉 Schema Vaccinare',
        gallery: '🖼️ Galerie Multimedia', 
        family: '👪 Membrii Familiei',
        export: '📊 Export & RSS',
        admin: '🛡️ Administrare Sistem'
    };
    
    const titleElement = document.getElementById('section-title');
    if (titleElement) {
        titleElement.innerText = titles[sectionName] || 'LittleSteps';
    }

    // 5. Declanșăm procesele de încărcare a datelor specifice
    switch(sectionName) {
        case 'timeline': loadTimeline(); break;
        case 'daily': updateSleepUI(); break;
        case 'medical': loadMedicalRecords(); break;
        case 'vaccines': loadVaccines(); break;
        case 'teeth': loadTeeth(); break;
        case 'gallery': loadGallery(); break;
        case 'admin': loadAdminData(); break;
        case 'family': loadFamilyData(); break;
        case 'evolution': loadEvolutionData(); break;
    }
}


/**
 * -----------------------------------------------------------------------------
 * --- JURNAL ZILNIC (LOGICĂ ACȚIUNI RAPIDE) ---
 * -----------------------------------------------------------------------------
 */

/**
 * Înregistrează o masă personalizată.
 */
async function addCustomFeeding() {
    if (!selectedChildId) return alert("Vă rugăm să selectați un copil activ!");
    
    const inputField = document.getElementById('feeding-input');
    const foodDescription = inputField.value || "Masă nespecificată";

    try {
        const response = await fetch('api/feeding.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                child_id: selectedChildId, 
                type: foodDescription, 
                details: 'Înregistrare manuală din Jurnal' 
            })
        });

        if (response.ok) {
            inputField.value = ""; 
            alert("Informațiile despre hrănire au fost salvate.");
        }
    } catch (error) {
        console.error("[Feeding Error] Nu s-a putut comunica cu serverul:", error);
    }
}

/**
 * Gestionează pornirea și oprirea cronometrului de somn.
 */
function handleSleepTimer() {
    if (!selectedChildId) return alert("Selectați un copil înainte de a porni cronometrul.");
    
    const btn = document.getElementById('sleep-timer-btn');
    
    if (!sleepStartTime) {
        // --- START SESIUNE ---
        sleepStartTime = Date.now();
        localStorage.setItem('sleepStartTime', sleepStartTime);
        updateSleepUI();
        console.log("[Sleep] Sesiune pornită la ora: " + new Date(sleepStartTime).toLocaleTimeString());
    } else {
        // --- FINALIZARE SESIUNE ---
        const endTime = Date.now();
        const differenceMs = endTime - sleepStartTime;
        const durationMinutes = Math.round(differenceMs / 1000 / 60); 

        if (confirm(`Bebelușul a dormit timp de ${durationMinutes} minute. Salvați în baza de date?`)) {
            saveSleepRecord(durationMinutes);
        }

        // Resetare stare locală
        sleepStartTime = null;
        localStorage.removeItem('sleepStartTime');
        
        if (btn) {
            btn.innerText = "😴 Start Somn";
            btn.classList.remove('active');
        }
    }
}

/**
 * Salvează rezultatul cronometrului prin API.
 * * @param {number} minutes - Durata somnului în minute.
 */
async function saveSleepRecord(minutes) {
    try {
        const response = await fetch('api/sleep.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                child_id: selectedChildId, 
                details: `Durată sesiune: ${minutes} minute` 
            })
        });
        
        if (response.ok) {
            console.log("[Sleep] Record salvat cu succes.");
        }
    } catch (err) {
        console.error("[Sleep Error] Eroare la salvare:", err);
    }
}

/**
 * Actualizează aspectul butonului de somn dacă există o sesiune activă.
 */
function updateSleepUI() {
    const btn = document.getElementById('sleep-timer-btn');
    if (btn && sleepStartTime) {
        btn.classList.add('active');
        btn.innerText = "🛑 Stop Somn (Sesiune în curs)";
    }
}

/**
 * --- MONITORIZARE SCUTEC ---
 * Nouă funcționalitate cerută pentru completarea jurnalului zilnic.
 * * @param {string} status - Starea (Umed, Murdar, Ambele).
 */
async function addDiaper(status) {
    if (!selectedChildId) return alert("Selectați un profil de copil!");
    
    console.log(`[Diaper] Se înregistrează scutec: ${status}`);
    
    try {
        const response = await fetch('api/diaper.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                child_id: selectedChildId, 
                type: status 
            })
        });

        if (response.ok) {
            alert(`Eveniment scutec (${status}) înregistrat.`);
            
            // Reîncărcăm timeline-ul dacă suntem pe acea secțiune
            if (document.getElementById('section-timeline').style.display === 'block') {
                loadTimeline();
            }
        }
    } catch (error) {
        console.error("[Diaper Error] Eșec la trimiterea datelor:", error);
    }
}


/**
 * -----------------------------------------------------------------------------
 * --- DENTIȚIE (LOGICĂ VIZUALĂ) ---
 * -----------------------------------------------------------------------------
 */

/**
 * Încarcă starea dinților din baza de date și randează arcadele.
 */
async function loadTeeth() {
    if (!selectedChildId) return;
    
    const upperContainer = document.getElementById('teeth-upper');
    const lowerContainer = document.getElementById('teeth-lower');
    
    if (!upperContainer || !lowerContainer) return;

    try {
        const res = await fetch(`api/teeth.php?child_id=${selectedChildId}`);
        const eruptedData = await res.json(); 

        // Generăm 10 dinți pentru arcada de sus și 10 pentru jos
        renderTeethArch(upperContainer, 'U', eruptedData);
        renderTeethArch(lowerContainer, 'L', eruptedData);
        
    } catch (e) {
        console.error("[Teeth] Eroare la preluarea datelor:", e);
    }
}

/**
 * Creează elementele DOM pentru o arcadă dentară.
 * * @param {HTMLElement} container - Div-ul unde se randează.
 * @param {string} prefix - 'U' pentru Upper, 'L' pentru Lower.
 * @param {object} data - Obiectul cu dinții deja ieșiți.
 */
function renderTeethArch(container, prefix, data) {
    container.innerHTML = '';
    
    for (let i = 1; i <= 10; i++) {
        const toothId = `${prefix}-${i}`;
        const eruptionDate = data[toothId] || null;
        
        const toothDiv = document.createElement('div');
        toothDiv.className = `tooth ${eruptionDate ? 'erupted' : ''}`;
        toothDiv.innerHTML = i;
        
        // Atribuim evenimentul de click
        toothDiv.onclick = () => handleToothClick(toothId, eruptionDate);
        
        container.appendChild(toothDiv);
    }
}

/**
 * Gestionează click-ul pe un dinte din hartă.
 * * @param {string} id - Identificatorul dintelui.
 * @param {string|null} date - Data erupției (dacă există).
 */
async function handleToothClick(id, date) {
    if (date) {
        alert(`Acest dințișor a erupt la data de: ${date}`);
        return;
    }
    
    const inputDate = prompt("Introduceți data apariției dințișorului (YYYY-MM-DD):", 
                             new Date().toISOString().split('T')[0]);
    
    if (inputDate) {
        try {
            const response = await fetch('api/teeth.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    child_id: selectedChildId, 
                    tooth_id: id, 
                    date: inputDate 
                })
            });
            
            if (response.ok) {
                console.log("[Teeth] Dinte marcat ca erupt.");
                loadTeeth(); // Refresh vizual
            }
        } catch (error) {
            console.error("[Teeth Error] Salvare eșuată:", error);
        }
    }
}


/**
 * -----------------------------------------------------------------------------
 * --- GESTIONARE FAMILIE ȘI DATE COPII ---
 * -----------------------------------------------------------------------------
 */

/**
 * Încarcă lista de membrii ai familiei și populează selectorul de copii.
 */
async function loadFamilyData() {
    const listDisplay = document.getElementById('family-list-display');
    const childSelector = document.getElementById('active-child-select');
    
    try {
        const response = await fetch('api/family.php'); 
        const data = await response.json();

        // 1. Randare Părinți
        let htmlContent = '<h4 class="sub-header">Părinți și Tutori</h4>';
        data.parents.forEach(p => {
            const genderEmoji = (p.gender === 'F') ? '👩' : '👨';
            htmlContent += `
                <div class="item family-item">
                    <strong>${genderEmoji} ${p.fullname}</strong>
                    <br><small>${p.email} (Rol: ${p.role})</small>
                </div>`;
        });

        // 2. Randare Copii
        htmlContent += '<h4 class="sub-header" style="margin-top:25px;">Copii Înregistrați</h4>';
        data.children.forEach(c => {
            const genderEmoji = (c.gender === 'F') ? '👧' : '👦';
            const ageDisplay = getAgeString(c.birthday);

            htmlContent += `
                <div class="item family-item child-item">
                    <strong>${genderEmoji} ${c.name}</strong> 
                    <span class="age-badge">(${ageDisplay})</span>
                    <br><small>Data nașterii: ${c.birthday}</small>
                </div>`;
        });
        
        if (listDisplay) {
            listDisplay.innerHTML = htmlContent;
        }

        // 3. Actualizare Selector Dropdown
        if (data.children.length > 0) {
            childSelector.innerHTML = data.children.map(c => {
                const emoji = (c.gender === 'F') ? '👧' : '👦';
                const isSelected = (c.id == selectedChildId) ? 'selected' : '';
                return `<option value="${c.id}" ${isSelected}>${emoji} ${c.name}</option>`;
            }).join('');
            
            // Setăm automat primul copil dacă nu e selectat nimic
            if (!selectedChildId) {
                selectedChildId = data.children[0].id;
                loadTimeline();
            }
        } else {
            childSelector.innerHTML = '<option value="">Adăugați un copil...</option>';
        }
    } catch (err) {
        console.error("[Family] Eroare încărcare date:", err);
    }
}

/**
 * Schimbă contextul aplicației pentru un alt copil.
 */
function updateSelectedChild() {
    const selector = document.getElementById('active-child-select');
    if (!selector) return;
    
    selectedChildId = selector.value;
    
    console.log("[System] Copil activ schimbat la ID: " + selectedChildId);
    
    // Reîncărcăm modulele dependente de ID-ul copilului
    loadTimeline();
    loadMedicalRecords();
    loadGallery();
    loadEvolutionData();
    loadVaccines();
    loadTeeth();
}

/**
 * Salvează un membru nou în baza de date.
 * * @param {string} type - 'child' sau 'parent'.
 */
async function saveFamilyMember(type) {
    let payload = { type: type };
    
    if (type === 'child') {
        payload.name = document.getElementById('new-child-name').value;
        payload.birthday = document.getElementById('new-child-birth').value;
        payload.gender = document.getElementById('new-child-gender').value; 
        if(!payload.name) return alert("Numele copilului este obligatoriu!");
    } else {
        payload.fullname = document.getElementById('new-parent-name').value;
        payload.email = document.getElementById('new-parent-email').value;
        payload.gender = document.getElementById('new-parent-gender').value;
        if(!payload.email) return alert("Email-ul este obligatoriu!");
    }

    try {
        const response = await fetch('api/family.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Salvare reușită!");
            loadFamilyData();
        }
    } catch (e) {
        console.error("[Family Save] Eroare:", e);
    }
}


/**
 * -----------------------------------------------------------------------------
 * --- SISTEM DE AUTENTIFICARE ȘI ACCES ---
 * -----------------------------------------------------------------------------
 */

/**
 * Procesează cererile de Login sau Register.
 */
async function handleAuth(action) {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const fullNameField = document.getElementById('auth-fullname');
    const fullName = fullNameField ? fullNameField.value : "";

    if (!email || !password) {
        return alert("Vă rugăm să introduceți atât emailul cât și parola.");
    }

    try {
        const response = await fetch(`api/auth.php?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullname: fullName })
        });

        const result = await response.json();

        if (response.ok) {
            if (action === 'login') {
                finalizeLogin(result.user);
            } else {
                alert("Contul a fost creat! Vă rugăm să vă conectați.");
            }
        } else {
            alert("Eroare: " + (result.error || "A apărut o problemă la server."));
        }
    } catch (err) {
        console.error("[Auth] Eroare de rețea:", err);
    }
}

/**
 * Finalizează procesul de login și deschide dashboard-ul.
 */
function finalizeLogin(user) {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.style.display = 'none';
    
    const displayUser = document.getElementById('display-user');
    if (displayUser) {
        displayUser.innerText = user.fullname || user.email;
    }
    
    // Verificăm drepturile de administrator
    const adminTab = document.getElementById('menu-admin');
    if (adminTab) {
        adminTab.style.display = (user.role === 'admin') ? 'block' : 'none';
    }

    console.log(`[Auth] Bine ai venit, ${user.email}!`);
    
    loadFamilyData();
    loadTimeline();
}

/**
 * Verifică starea sesiunii la pornirea aplicației.
 */
async function checkLoginStatus() {
    try {
        const res = await fetch('api/auth.php?action=status');
        const data = await res.json();
        
        if (res.ok && data.logged_in) {
            finalizeLogin(data.user);
        }
    } catch (e) {
        console.warn("[System] Utilizator neautentificat.");
    }
    
    // Inițializare GDPR
    checkCookieConsent();
}

/**
 * Deconectează utilizatorul curent.
 */
function logout() {
    fetch('api/auth.php?action=logout').then(() => {
        console.log("[Auth] Sesiune închisă.");
        location.reload();
    });
}


/**
 * -----------------------------------------------------------------------------
 * --- TIMELINE INTELIGENT (ALGORITM DE SORTARE) ---
 * -----------------------------------------------------------------------------
 */

/**
 * Colectează date din 6 surse diferite (API-uri) și le combină cronologic.
 * S-a adăugat sursa de date pentru SCUTECE.
 */
async function loadTimeline() {
    if (!selectedChildId) return;
    
    const timelineList = document.getElementById('activity-list');
    timelineList.innerHTML = '<p class="placeholder-text">Se procesează istoricul activităților...</p>';

    try {
        // Lansăm toate cererile în paralel pentru a optimiza timpul de răspuns (Concurrent Fetching)
        const [fRes, sRes, medRes, mediaRes, evoRes, diaperRes] = await Promise.all([
            fetch(`api/feeding.php?child_id=${selectedChildId}`),
            fetch(`api/sleep.php?child_id=${selectedChildId}`),
            fetch(`api/medical.php?child_id=${selectedChildId}`),
            fetch(`api/media.php?child_id=${selectedChildId}`),
            fetch(`api/evolution.php?child_id=${selectedChildId}`),
            fetch(`api/diaper.php?child_id=${selectedChildId}`) // ADAUGAT: Scutece
        ]);

        const feedingData = await fRes.json();
        const sleepData = await sRes.json();
        const medicalData = await medRes.json();
        const mediaData = await mediaRes.json();
        const evolutionData = await evoRes.json();
        const diaperData = await diaperRes.json(); // ADAUGAT: Scutece

        // Compilăm array-ul unificat
        let combinedEvents = [
            ...feedingData.map(f => ({ ...f, icon: '🍼', title: `Hrană: ${f.type}`, date: f.created_at })),
            ...sleepData.map(s => ({ ...s, icon: '😴', title: 'Somn', date: s.created_at })),
            ...medicalData.map(m => ({ ...m, icon: '🏥', title: `Medical: ${m.diagnosis}`, date: m.event_date, isDateOnly: true })),
            ...mediaData.map(i => ({ ...i, icon: '🖼️', title: 'Imagine capturată', date: i.created_at, isMedia: true })),
            ...diaperData.map(d => ({ ...d, icon: '🧷', title: `Scutec: ${d.type}`, date: d.created_at })), // ADAUGAT
            ...evolutionData.growth.map(g => ({ 
                icon: '📏', 
                title: 'Evoluție: Creștere', 
                details: `⚖️ ${g.weight}kg | 📏 ${g.height}cm`, 
                date: g.recorded_date,
                isDateOnly: true 
            })),
            ...evolutionData.milestones.map(m => ({ 
                icon: '🏆', 
                title: `Reper: ${m.milestone_name}`, 
                details: 'Etapă de dezvoltare bifată!', 
                date: m.milestone_date,
                isDateOnly: true 
            }))
        ];

        // --- ALGORITM SORTARE ---
        combinedEvents.sort((a, b) => {
            const timestampA = new Date(a.date).getTime();
            const timestampB = new Date(b.date).getTime();
            
            // Ordonare descrescătoare (cel mai nou sus)
            if (timestampB !== timestampA) {
                return timestampB - timestampA; 
            }
            // Tie-breaker: utilizăm ID-ul pentru evenimente concomitente
            return (b.id || 0) - (a.id || 0);
        });

        if (combinedEvents.length === 0) {
            timelineList.innerHTML = `<p class="info-text">Nu există nicio activitate înregistrată pentru acest profil.</p>`;
            return;
        }

        // --- RENDERIZARE HTML ---
        timelineList.innerHTML = combinedEvents.map(item => {
            const dateObj = new Date(item.date);
            
            // Formatare în funcție de tipul de eveniment
            const formattedTime = item.isDateOnly 
                ? dateObj.toLocaleDateString('ro-RO') 
                : dateObj.toLocaleString('ro-RO', { 
                    day: 'numeric', month: 'long', year: 'numeric', 
                    hour: '2-digit', minute: '2-digit' 
                  });

            return `
                <div class="item timeline-card">
                    <div class="item-icon-wrapper">${item.icon}</div>
                    <div class="item-content">
                        <strong>${item.title}</strong>
                        <p class="details-text">${item.details || item.treatment || item.caption || 'Fără detalii suplimentare'}</p>
                        ${item.isMedia && item.file_path ? `<img src="${item.file_path}" class="timeline-img">` : ''}
                        <span class="timestamp-label">📅 ${formattedTime}</span>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error("[Timeline] Eroare la procesarea fluxului de date:", error);
        timelineList.innerHTML = '<p class="error-text">Sistemul de timeline este indisponibil momentan.</p>';
    }
}


/**
 * -----------------------------------------------------------------------------
 * --- ISTORIC MEDICAL ---
 * -----------------------------------------------------------------------------
 */

/**
 * Salvează o vizită medicală nouă.
 */
async function addMedicalRecord() {
    const data = {
        child_id: selectedChildId,
        date: document.getElementById('med-date').value,
        diagnosis: document.getElementById('med-diagnosis').value,
        treatment: document.getElementById('med-treatment').value,
        doctor: document.getElementById('med-doctor').value
    };

    if (!data.date || !data.diagnosis) {
        return alert("Vă rugăm să introduceți cel puțin data și diagnosticul/motivul vizitei.");
    }

    try {
        const response = await fetch('api/medical.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            console.log("[Medical] Înregistrare salvată.");
            loadMedicalRecords();
            document.getElementById('medical-form').reset();
            loadTimeline();
        }
    } catch (e) {
        console.error("[Medical Error] Eșec salvare:", e);
    }
}

/**
 * Încarcă lista vizitelor medicale pentru afișare separată.
 */
async function loadMedicalRecords() {
    if (!selectedChildId) return;
    
    const container = document.getElementById('medical-list');
    
    try {
        const response = await fetch(`api/medical.php?child_id=${selectedChildId}`);
        const records = await response.json();
        
        if (records.length === 0) {
            container.innerHTML = '<p>Nicio vizită medicală înregistrată încă.</p>';
            return;
        }

        container.innerHTML = records.map(r => `
            <div class="item medical-entry">
                <strong>🏥 ${r.event_date} - ${r.diagnosis}</strong>
                <p>Prescripție: ${r.treatment || 'N/A'} | Medic: ${r.doctor || 'Nespecificat'}</p>
            </div>
        `).join('');
        
    } catch (err) {
        console.error("[Medical] Eroare fetch:", err);
    }
}


/**
 * -----------------------------------------------------------------------------
 * --- SISTEM VACCINARE ---
 * -----------------------------------------------------------------------------
 */

/**
 * Încarcă schema de vaccinare și starea fiecărei doze.
 */
async function loadVaccines() {
    if (!selectedChildId) return;
    
    const listContainer = document.getElementById('vaccine-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '<p>Se consultă registrul de vaccinări...</p>';

    try {
        const response = await fetch(`api/vaccines.php?child_id=${selectedChildId}`);
        const vaccines = await response.json();

        listContainer.innerHTML = vaccines.map(v => `
            <div class="vaccine-item ${v.status == 1 ? 'completed' : 'pending'}">
                <div class="v-info">
                    <strong>${v.name}</strong>
                    <small>Recomandat la vârsta de: ${v.age_tag}</small>
                    ${v.status == 1 ? `<span class="v-date-done">Efectuat în data de: ${v.date_administered}</span>` : ''}
                </div>
                <div class="v-action">
                    <button onclick="toggleVaccineState(${v.id}, ${v.status == 1 ? 0 : 1})" 
                            class="${v.status == 1 ? 'btn-alt' : 'btn-primary'}">
                        ${v.status == 1 ? '✅ Administrat' : 'Bifează ca Efectuat'}
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error("[Vaccines] Eroare API:", error);
    }
}

/**
 * Schimbă statusul unui vaccin (Administrat / Neadministrat).
 * * @param {number} vaccineId - ID-ul înregistrării.
 * @param {number} newStatus - 1 sau 0.
 */
async function toggleVaccineState(vaccineId, newStatus) {
    try {
        const response = await fetch('api/vaccines.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: vaccineId, status: newStatus })
        });
        
        if (response.ok) {
            loadVaccines();
            loadTimeline();
        }
    } catch (e) {
        console.error("[Vaccine Update Error]:", e);
    }
}


/**
 * -----------------------------------------------------------------------------
 * --- GALERIE ȘI GESTIONARE MEDIA ---
 * -----------------------------------------------------------------------------
 */

/**
 * Procesează încărcarea unui fișier media.
 */
async function uploadMedia() {
    const fileSelector = document.getElementById('media-file');
    const captionText = document.getElementById('media-caption').value;
    
    if (fileSelector.files.length === 0) {
        return alert("Vă rugăm să alegeți un fișier imagine sau video.");
    }

    const fileToUpload = fileSelector.files[0];
    const formData = new FormData();
    
    formData.append('file', fileToUpload);
    formData.append('caption', captionText);
    formData.append('child_id', selectedChildId);

    console.log(`[Media] Se încarcă fișierul: ${fileToUpload.name}`);

    try {
        const response = await fetch('api/media.php', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            console.log("[Media] Upload finalizat cu succes.");
            loadGallery();
            loadTimeline();
            document.getElementById('upload-form').reset();
        } else {
            alert("Eroare la încărcarea fișierului.");
        }
    } catch (err) {
        console.error("[Media Error] Eroare rețea:", err);
    }
}

/**
 * Încarcă toate amintirile salvate pentru copilul activ.
 */
async function loadGallery() {
    if (!selectedChildId) return;
    
    const galleryGrid = document.getElementById('gallery-grid');
    
    try {
        const response = await fetch(`api/media.php?child_id=${selectedChildId}`);
        const mediaItems = await response.json();
        
        if (mediaItems.length === 0) {
            galleryGrid.innerHTML = '<p class="empty-gallery-msg">Nu ați urcat nicio amintire încă.</p>';
            return;
        }

        galleryGrid.innerHTML = mediaItems.map(item => `
            <div class="gallery-card">
                <div class="media-container">
                    <img src="${item.file_path}" alt="Moment LittleSteps" loading="lazy">
                </div>
                <div class="media-caption-area">
                    <p>${item.caption || 'Moment fără descriere'}</p>
                    <small>Postat la: ${new Date(item.created_at).toLocaleDateString()}</small>
                </div>
            </div>
        `).join('');
        
    } catch (e) {
        console.error("[Gallery Error] Nu s-au putut încărca pozele:", e);
    }
}


/**
 * -----------------------------------------------------------------------------
 * --- EVOLUȚIE ȘI ANALIZĂ GRAFICĂ (CHART.JS) ---
 * -----------------------------------------------------------------------------
 */

/**
 * Prelucrează datele de creștere și le randează vizual.
 */
async function loadEvolutionData() {
    if (!selectedChildId) return;
    
    const weightList = document.getElementById('growth-list');
    const milestoneList = document.getElementById('milestones-list');

    try {
        const res = await fetch(`api/evolution.php?child_id=${selectedChildId}`);
        const data = await res.json();

        // 1. Populare listă măsurători
        weightList.innerHTML = data.growth.map(g => 
            `<div class="item growth-entry">
                ⚖️ <strong>${g.weight}kg</strong> | 📏 <strong>${g.height}cm</strong>
                <br><small>Data măsurării: ${g.recorded_date}</small>
            </div>`).join('') || '<p>Nicio măsurătoare salvată.</p>';

        // 2. Populare listă repere
        milestoneList.innerHTML = data.milestones.map(m => 
            `<div class="item milestone-entry">
                🏆 <strong>${m.milestone_name}</strong>
                <br><small>Data: ${m.milestone_date}</small>
            </div>`).join('') || '<p>Niciun reper marcat.</p>';

        // 3. Generare sau actualizare grafic
        if (data.growth.length > 0) {
            renderEvolutionChart(data.growth);
        }
        
    } catch (error) {
        console.error("[Evolution] Eroare la prelucrare:", error);
    }
}

/**
 * Configurează și randează instanța Chart.js pentru datele de creștere.
 * * @param {Array} rawData - Array de obiecte de măsurare.
 */
function renderEvolutionChart(rawData) {
    // Sortăm datele cronologic pentru un grafic corect
    const sorted = [...rawData].sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date));
    
    const labels = sorted.map(d => d.recorded_date);
    const weightPoints = sorted.map(d => d.weight);
    const heightPoints = sorted.map(d => d.height);

    const canvas = document.getElementById('growthChart');
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    
    // Distrugem graficul anterior dacă există (prevenim suprapunerea)
    if (growthChart) {
        growthChart.destroy();
    }
    
    growthChart = new Chart(context, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Greutate (kg)',
                    data: weightPoints,
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.15)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35
                },
                {
                    label: 'Înălțime (cm)',
                    data: heightPoints,
                    borderColor: '#4ecdc4',
                    backgroundColor: 'rgba(78, 205, 196, 0.15)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: false,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { position: 'top' }
            }
        }
    });
    
    console.log("[Chart] Graficul de creștere a fost actualizat.");
}

/**
 * Salvează date noi de evoluție (Greutate/Înălțime sau Reper).
 */
async function saveEvolution(category) {
    if (!selectedChildId) return alert("Selectați un copil!");
    
    let requestData = { child_id: selectedChildId, target: category };
    
    if (category === 'growth') {
        requestData.date = document.getElementById('growth-date').value;
        requestData.weight = document.getElementById('growth-weight').value;
        requestData.height = document.getElementById('growth-height').value;
        if (!requestData.date) return alert("Introduceți data măsurătorii.");
    } else {
        requestData.date = document.getElementById('milestone-date').value;
        requestData.name = document.getElementById('milestone-name').value;
        if (!requestData.name || !requestData.date) return alert("Completați datele reperului.");
    }

    try {
        const response = await fetch('api/evolution.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        if (response.ok) {
            console.log(`[Evolution] S-au salvat date pentru: ${category}`);
            loadEvolutionData();
            loadTimeline();
        }
    } catch (err) {
        console.error("[Evolution Save Error]:", err);
    }
}


/**
 * -----------------------------------------------------------------------------
 * --- PANOU ADMINISTRARE ȘI GESTIONARE UTILIZATORI ---
 * -----------------------------------------------------------------------------
 */

/**
 * Prelucrează lista utilizatorilor (doar pentru utilizatori cu rol Admin).
 */
async function loadAdminData() {
    const tableBody = document.getElementById('admin-user-list');
    
    try {
        const response = await fetch('api/admin.php');
        
        if (!response.ok) {
            tableBody.innerHTML = '<tr><td colspan="5">Acces refuzat: Drepturi insuficiente.</td></tr>';
            return;
        }

        const usersList = await response.json();
        
        tableBody.innerHTML = usersList.map(u => `
            <tr class="admin-row">
                <td>${u.id}</td>
                <td>${u.email}</td>
                <td>${u.fullname || '<i>Nume lipsă</i>'}</td>
                <td><span class="badge ${u.role}">${u.role.toUpperCase()}</span></td>
                <td>
                    <button class="btn-delete" onclick="executeUserDeletion(${u.id})">
                        Șterge Cont
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (e) {
        console.error("[Admin Panel] Eroare la preluarea bazei de date utilizatori:", e);
    }
}

/**
 * Lansează procedura de ștergere a unui cont.
 */
async function executeUserDeletion(id) {
    if (confirm("ATENȚIE: Ștergerea unui utilizator este ireversibilă. Confirmați operațiunea?")) {
        try {
            const response = await fetch(`api/admin.php?id=${id}`, { 
                method: 'DELETE' 
            });
            
            if (response.ok) {
                console.log(`[Admin] Utilizatorul cu ID ${id} a fost eliminat.`);
                loadAdminData();
            }
        } catch (err) {
            alert("Eroare la procesarea ștergerii.");
        }
    }
}


/**
 * -----------------------------------------------------------------------------
 * --- EXPORT ȘI INTEGRARE DATE ---
 * -----------------------------------------------------------------------------
 */

/**
 * Redirecționează către scriptul de export pentru descărcarea datelor.
 * * @param {string} format - 'json' sau 'csv'.
 */
function exportData(format) {
    if (!selectedChildId) return alert("Selectați un copil pentru export.");
    
    const exportUrl = `api/export.php?format=${format}&child_id=${selectedChildId}`;
    
    console.log(`[Export] Se generează fișierul în format: ${format.toUpperCase()}`);
    
    // Deschidem în tab nou pentru a declanșa descărcarea
    window.location.href = exportUrl;
}


/**
 * -----------------------------------------------------------------------------
 * --- SECVENȚĂ DE BOOTSTRAP (INITIALIZARE) ---
 * -----------------------------------------------------------------------------
 */

// Punctul de intrare al aplicației
document.addEventListener('DOMContentLoaded', () => {
    console.log("[System] Aplicația LittleSteps a fost încărcată.");
    checkLoginStatus();
});

// Verificare periodică (opțional) sau apel direct
// checkLoginStatus();