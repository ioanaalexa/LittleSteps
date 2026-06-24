    function esteEmailValid(email) {
    const formulaRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return formulaRegex.test(email);
}
function esteDataValida(dataIntrodusa) {
    if (!dataIntrodusa) return false; 

    const data = new Date(dataIntrodusa);
    const dataDeAzi = new Date();
    const limitaJos = new Date("2000-01-01");

    if (isNaN(data.getTime())) return false;

    if (data > dataDeAzi) return false;

    if (data < limitaJos) return false;

    return true; 
}

/**
 * seteaza un cookie in browserul utilizatorului
 * * @param {string} name - Numele identificatorului pentru cookie
 * @param {string} value - Valoarea ce urmeaza a fi stocata
 * @param {number} days - Numarul de zile până la expirare
 */
function setCookie(name, value, days) {
    const date = new Date();
}

/**
 * Setează un cookie în browserul utilizatorului.
 * * @param {string} name - Numele identificatorului pentru cookie.
 * @param {string} value - Valoarea ce urmează a fi stocată.
 * @param {number} days - Numărul de zile până la expirare.
 */
function setCookie(name, value, days) {
    const date = new Date();
    
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    
    let expires = "expires=" + date.toUTCString();
    
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
        
        while (c.charAt(0) == ' ') {
            c = c.substring(1, c.length);
        }
        
        if (c.indexOf(nameEQ) == 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    
    return null;
}


// Id ul copilului
let selectedChildId = null; 

// graful
let growthChart = null; 

//retine somnul in local storage 
let sleepStartTime = localStorage.getItem('sleepStartTime'); 


///darkmode
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

(function initializeTheme() {
    const savedTheme = getCookie("theme");
    
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
})();


function checkCookieConsent() {
    const consent = getCookie("cookie_consent");
    
    if (!consent) {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.style.display = 'block';
        }
    }
}

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
 * Calculeaza varsta 
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

    if (days < 0) {
        months--;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        days += lastMonth;
    }

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


///Navigare 

/**
 * Gestionează vizibilitatea secțiunilor în format Single Page Application.
 * * @param {string} sectionName - Numele secțiunii de activat.
 */
function showSection(sectionName) {
    const allSections = document.querySelectorAll('.app-section');
    allSections.forEach(section => {
        section.style.display = 'none';
    });
    const menuItems = document.querySelectorAll('.sidebar li');
    menuItems.forEach(li => {
        li.classList.remove('active');
    });

    const targetSection = document.getElementById(`section-${sectionName}`);
    const targetMenu = document.getElementById(`menu-${sectionName}`);
    
    if (targetSection) targetSection.style.display = 'block';
    if (targetMenu) targetMenu.classList.add('active');
    
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
        admin: ' Administrare Sistem'
    };
    
    const titleElement = document.getElementById('section-title');
    if (titleElement) {
        titleElement.innerText = titles[sectionName] || 'LittleSteps';
    }
    switch(sectionName) {
        case 'timeline': loadTimeline(); break;
        case 'daily': updateSleepUI(); break;
        case 'medical': loadMedicalRecords(); break;
        case 'vaccines': loadVaccines(); break;
        case 'teeth': loadTeeth(); break;
        case 'gallery': loadGallery(); break;
        case 'admin': loadAdminData(); break;
        case 'family': loadFamilyData();loadFriendsData(); break;
        case 'evolution': loadEvolutionData(); break;
        case 'admin': 
            loadAdminData(); 
            loadSecurityLogs(); 
            break;
    }
}


///Jurnal zilnic 

///inregistrare masa 
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
            addSecurityLog(`A înregistrat o masă nouă: "${foodDescription}"`);
            inputField.value = ""; 
            alert("Informațiile despre hrănire au fost salvate.");
        }
    } catch (error) {
        console.error("[Feeding Error] Nu s-a putut comunica cu serverul:", error);
    }
}

///cronometrul de somn
function handleSleepTimer() {
    initializeWebNotifications();
    if (!selectedChildId) return alert("Selectați un copil înainte de a porni cronometrul.");
    
    const btn = document.getElementById('sleep-timer-btn');
    
    if (!sleepStartTime) {
        sleepStartTime = Date.now();
        localStorage.setItem('sleepStartTime', sleepStartTime);
        updateSleepUI();
        console.log("[Sleep] Sesiune pornită la ora: " + new Date(sleepStartTime).toLocaleTimeString());
    } else {
        
        const endTime = Date.now();
        const differenceMs = endTime - sleepStartTime;
        const durationMinutes = Math.round(differenceMs / 1000 / 60); 

        if (confirm(`Bebelușul a dormit timp de ${durationMinutes} minute. Salvați în baza de date?`)) {
            saveSleepRecord(durationMinutes);
        }

        sleepStartTime = null;
        localStorage.removeItem('sleepStartTime');
        
        if (btn) {
            btn.innerText = " Start Somn";
            btn.classList.remove('active');
        }
    }
}

/**
 * Salveaza cronometrul
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

function updateSleepUI() {
    const btn = document.getElementById('sleep-timer-btn');
    if (btn && sleepStartTime) {
        btn.classList.add('active');
        btn.innerText = " Stop Somn (Sesiune în curs)";
    }
}

/**
 * ///Monitorizare scutec
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


///Dentitie 
async function loadTeeth() {
    if (!selectedChildId) return;
    
    const upperContainer = document.getElementById('teeth-upper');
    const lowerContainer = document.getElementById('teeth-lower');
    
    // Verificare de urgență pentru DOM
    if (!upperContainer || !lowerContainer) {
        console.error("[Teeth Error] Containerele teeth-upper sau teeth-lower lipsesc din HTML!");
        return;
    }

    let eruptedData = {}; 

    try {
        const res = await fetch(`api/teeth.php?child_id=${selectedChildId}`);
        
        if (res.ok) {
            const textData = await res.text();
            if (textData && (textData.startsWith('{') || textData.startsWith('['))) {
                eruptedData = JSON.parse(textData);
            }
        }
    } catch (e) {
        console.warn("[Teeth Emergency Recovery] Serverul a dat eroare, dar desenăm harta oricum:", e);
    }

    // ruleaza oricum
    renderTeethArch(upperContainer, 'U', eruptedData);
    renderTeethArch(lowerContainer, 'L', eruptedData);
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
        toothDiv.onclick = () => handleToothClick(toothId, eruptionDate);
        
        container.appendChild(toothDiv);
    }
}


async function handleToothClick(id, date) {
    if (date) {
        alert(`Acest dințișor a apărut la data de: ${date}`);
        return;
    }
    
    ///data 
    const localNow = new Date();
    const localYear = localNow.getFullYear();
    const localMonth = String(localNow.getMonth() + 1).padStart(2, '0');
    const localDay = String(localNow.getDate()).padStart(2, '0');
    const defaultLocalDate = `${localYear}-${localMonth}-${localDay}`;
    
    const inputDate = prompt("Introduceți data apariției dințișorului (YYYY-MM-DD):", defaultLocalDate);
    
    if (inputDate) {
        if (!esteDataValida(inputDate)) {
            return alert("Data introdusă este invalidă! Te rugăm să folosești formatul YYYY-MM-DD și să nu folosești o dată din viitor.");
        }
        try {
            const response = await fetch('api/teeth.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    child_id: parseInt(selectedChildId), 
                    tooth_id: id, 
                    date: inputDate 
                })
            });
            
            if (response.ok) {
                console.log("[Teeth] Dinte marcat ca erupt cu succes.");
                await loadTeeth(); 
            } else {
                const errResult = await response.json();
                alert("Eroare server: " + (errResult.error || "Nu s-a putut salva dintele."));
            }
        } catch (error) {
            console.error("[Teeth Error] Salvare eșuată:", error);
        }
    }
}


async function loadFamilyData() {
    const listDisplay = document.getElementById('family-list-display');
    const childSelector = document.getElementById('active-child-select');
    
    try {
        const response = await fetch('api/family.php'); 
        const data = await response.json();

        //parinti
        let htmlContent = '<h4 class="sub-header">Părinți și Tutori</h4>';
        data.parents.forEach(p => {
            const genderEmoji = (p.gender === 'F') ? '👩' : '👨';
            htmlContent += `
                <div class="item family-item">
                    <strong>${genderEmoji} ${p.fullname}</strong>
                    <br><small>${p.email} (Rol: ${p.role})</small>
                </div>`;
        });

        //copii
        htmlContent += '<h4 class="sub-header" style="margin-top:25px;">Copii Înregistrați</h4>';
        
        if (childSelector) {
            childSelector.innerHTML = '';
        }

        data.children.forEach(c => {
            const genderEmoji = (c.gender === 'F') ? '👧' : '👦';
            const ageDisplay = typeof getAgeString === 'function' ? getAgeString(c.birthday) : c.birthday;

            htmlContent += `
                <div class="item family-item child-item">
                    <strong>${genderEmoji} ${c.name}</strong> 
                    <span class="age-badge">(${ageDisplay})</span>
                    <br><small>Data nașterii: ${c.birthday}</small>
                </div>`;
                
            if (childSelector) {
                childSelector.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            }
        });

        if (listDisplay) {
            listDisplay.innerHTML = htmlContent;
        }

        if (typeof loadFriendsList === "function") {
            loadFriendsList();
        }

    } catch (error) {
        console.error("[Family Data] Eroare la încărcare:", error);
    }
}

function updateSelectedChild() {
    const selector = document.getElementById('active-child-select');
    if (!selector) return;
    
    selectedChildId = selector.value;
    
    console.log("[System] Copil activ schimbat la ID: " + selectedChildId);
    
    if (typeof loadTimeline === "function") loadTimeline();
    if (typeof loadMedicalRecords === "function") loadMedicalRecords();
    if (typeof loadGallery === "function") loadGallery();
    if (typeof loadEvolutionData === "function") loadEvolutionData();
    if (typeof loadVaccines === "function") loadVaccines();
    if (typeof loadTeeth === "function") loadTeeth();
    
    if (typeof loadFriendsList === "function") {
        // text temporar de incarcare 
        const friendsDisplay = document.getElementById('friends-list-display');
        if (friendsDisplay) {
            friendsDisplay.innerHTML = '<span style="color:gray; font-style:italic;">Se actualizează cercul social... ⏳</span>';
        }
        
        loadFriendsList(); 
    }
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

        if (!esteDataValida(payload.birthday)) {
            return alert("Data de naștere este invalidă! Asigură-te că ai completat-o corect și că nu este din viitor.");
        }

    } else {
        payload.fullname = document.getElementById('new-parent-name').value;
        payload.email = document.getElementById('new-parent-email').value;
        payload.gender = document.getElementById('new-parent-gender').value;
        payload.role = document.getElementById('new-parent-role').value; // NOU: Preluăm rolul ales
        
        if(!payload.email) return alert("Email-ul este obligatoriu!");

        if (!esteEmailValid(payload.email)) {
            return alert("Te rugăm să introduci o adresă de email validă pentru noul membru!");
        }
    }

    try {
        const response = await fetch('api/family.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Salvare reușită!");
            loadFamilyData(); // Reîncarcă lista familiei
        }
    } catch (e) {
        console.error("[Family Save] Eroare:", e);
    }
}

///autentificare
function showRegisterFields() {
    const termsContainer = document.getElementById('register-terms-container');
    const fullNameInput = document.getElementById('auth-fullname');
    const authTitle = document.getElementById('auth-title');
    
    const loginBtn = document.getElementById('btn-login-action') || document.querySelector("button[onclick*='login']");
    const toggleBtn = document.getElementById('btn-toggle-mode') || document.querySelector("button[onclick*='showRegisterFields']");
    const registerBtn = document.getElementById('btn-register-action');
    
    if (termsContainer && fullNameInput) {
        termsContainer.style.display = 'block';
        fullNameInput.style.display = 'block';
        
        if (registerBtn) {
            registerBtn.style.display = 'block';
            if (loginBtn) loginBtn.style.display = 'none';
            if (toggleBtn) toggleBtn.style.display = 'none';
        } else if (loginBtn) {
            loginBtn.innerText = "Creează Cont 🚀";
            loginBtn.setAttribute("onclick", "handleAuth('register')");
            if (toggleBtn) toggleBtn.style.display = 'none';
        }
        
        if (authTitle) {
            authTitle.innerText = "👶 Creează un cont nou în LittleSteps";
        }
        
        console.log("[Auth UI] Formularul a fost configurat pentru modul de Înregistrare.");
    }
}
async function handleAuth(action) {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const fullNameField = document.getElementById('auth-fullname');
    const fullName = fullNameField ? fullNameField.value : "";
    const termsCheckbox = document.getElementById('auth-terms');

    if (!email || !password) {
        return alert("Vă rugăm să introduceți atât emailul cât și parola.");
    }

    if (!esteEmailValid(email)) {
        return alert("Te rugăm să introduci o adresă de email validă (ex: nume@domeniu.com)!");
    }

    if (action === 'register') {
        if (!termsCheckbox || !termsCheckbox.checked) {
            return alert("Trebuie să fii de acord cu termenii și condițiile (bifează căsuța GDPR) pentru a crea contul.");
        }
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
                alert("Contul a fost creat! Vă rugăm să vă conectați utilizând noile date.");
                location.reload();
            }
        } else {
            alert("Eroare: " + (result.error || "A apărut o problemă la server."));
        }
    } catch (err) {
        console.error("[Auth] Eroare de rețea:", err);
    }
}

///deschide dashboard
function finalizeLogin(user) {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.style.display = 'none';
    
    const displayUser = document.getElementById('display-user');
    if (displayUser) {
        displayUser.innerText = user.fullname || user.email;
    }
        const adminTab = document.getElementById('menu-admin');
    if (adminTab) {
        adminTab.style.display = (user.role === 'admin' || user.role === 'family_admin') ? 'block' : 'none';
    }

    console.log(`[Auth] Bine ai venit, ${user.email}!`);
    
    loadFamilyData();
    loadTimeline();
}

function finalizeLogin(user) {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.style.display = 'none';
    
    const displayUser = document.getElementById('display-user');
    if (displayUser) {
        displayUser.innerText = user.fullname || user.email;
    }
    
    // REPARAT: Afișăm panoul de admin atât pentru administratorul global, cât și pentru administratorul de familie
    const adminTab = document.getElementById('menu-admin');
    if (adminTab) {
        adminTab.style.display = (user.role === 'admin' || user.role === 'family_admin') ? 'block' : 'none';
    }

    console.log(`[Auth] Bine ai venit, ${user.email}!`);
    
    loadFamilyData();
    loadTimeline();
}
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
    
    checkCookieConsent();
}

function logout() {
    fetch('api/auth.php?action=logout').then(() => {
        console.log("[Auth] Sesiune închisă.");
        location.reload();
    });
}

///curatare caractere
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
async function loadTimeline() {
    if (!selectedChildId) return;
    const timelineList = document.getElementById('activity-list');
    const dateFilterElement = document.getElementById('timeline-date-filter');
    const dateFilter = dateFilterElement ? dateFilterElement.value : '';
    timelineList.innerHTML = '<p class="placeholder-text">Se procesează fluxul de date de pe server... ⏳</p>';

    try {
        const response = await fetch(`api/timeline.php?child_id=${selectedChildId}&date=${dateFilter}`);
        if (!response.ok) throw new Error("Eroare răspuns server");
        
        const filteredEvents = await response.json();

        if (filteredEvents.length === 0) {
            const msg = dateFilter 
                ? `Nicio activitate înregistrată pentru data de ${dateFilter}.` 
                : `Jurnalul este gol. Începe să adaugi activități!`;
            timelineList.innerHTML = `<p class="info-text" style="text-align:center; padding: 40px;">📭 ${msg}</p>`;
            return;
        }
        timelineList.innerHTML = filteredEvents.map(item => {
            const dateObj = new Date(item.date);
            const displayTime = dateObj.toLocaleString('ro-RO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

            const safeTitle = escapeHTML(item.title);
            const safeDetails = escapeHTML(item.details);

            return `
                <div class="item timeline-card" style="animation: fadeIn 0.4s ease forwards;">
                    <div class="item-icon-wrapper" style="font-size: 1.5rem;">${item.icon}</div>
                    <div class="item-content">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <strong>${safeTitle}</strong>
                            <span class="timestamp-label" style="font-size: 0.75rem; background: var(--bg); padding: 2px 8px; border-radius: 10px;">📅 ${displayTime}</span>
                        </div>
                        <p class="details-text" style="margin-top: 5px; color: var(--text-light);">${safeDetails}</p>
                    </div>
                </div>
            `;
        }).join('');

        console.log(`[Timeline] S-au randat ${filteredEvents.length} evenimente procesate de server.`);

    } catch (error) {
        console.error("[Critical Error] Timeline Crash:", error);
        timelineList.innerHTML = '<p class="error-text">Sistemul de jurnalizare întâmpină dificultăți tehnice.</p>';
    }
}
function resetTimelineFilter() {
    const filterInput = document.getElementById('timeline-date-filter');
    if (filterInput) {
        filterInput.value = ""; // Resetăm valoarea input-ului
        loadTimeline(); // Reîncărcăm toate datele
        console.log("[Timeline Filter] Filtrul a fost resetat la 'Toate'.");
    }
}
///istoric medical
async function addMedicalRecord() {
    const data = {
        child_id: selectedChildId,
        date: document.getElementById('med-date').value,
        diagnosis: document.getElementById('med-diagnosis').value,
        treatment: document.getElementById('med-treatment').value,
        doctor: document.getElementById('med-doctor').value
    };

    if (!esteDataValida(data.date)) {
        return alert("Data vizitei medicale este invalidă! Asigură-te că ai completat-o corect și că nu este din viitor.");
    }
    if (!data.diagnosis) {
        return alert("Vă rugăm să introduceți diagnosticul sau motivul vizitei.");
    }
    try {
        const response = await fetch('api/medical.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            addSecurityLog(`A adăugat o fișă medicală nouă: Diagnosticul "${data.diagnosis}"`);
            console.log("[Medical] Înregistrare salvată.");
            loadMedicalRecords();
            document.getElementById('medical-form').reset();
            loadTimeline();
        }
    } catch (e) {
        console.error("[Medical Error] Eșec salvare:", e);
    }
}
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

///galerie
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


///evolutie si grafic 
async function loadEvolutionData() {
    if (!selectedChildId) return;
    
    const weightList = document.getElementById('growth-list');
    const milestoneList = document.getElementById('milestones-list');

    try {
        const res = await fetch(`api/evolution.php?child_id=${selectedChildId}`);
        const data = await res.json();

        weightList.innerHTML = data.growth.map(g => 
            `<div class="item growth-entry">
                ⚖️ <strong>${g.weight}kg</strong> | 📏 <strong>${g.height}cm</strong>
                <br><small>Data măsurării: ${g.recorded_date}</small>
            </div>`).join('') || '<p>Nicio măsurătoare salvată.</p>';

        milestoneList.innerHTML = data.milestones.map(m => 
            `<div class="item milestone-entry">
                🏆 <strong>${m.milestone_name}</strong>
                <br><small>Data: ${m.milestone_date}</small>
            </div>`).join('') || '<p>Niciun reper marcat.</p>';

        if (data.growth.length > 0) {
            renderEvolutionChart(data.growth);
        }
        
    } catch (error) {
        console.error("[Evolution] Eroare la prelucrare:", error);
    }
}

/**
 * Configurează și randează instanța Chart.js pentru datele de creștere.
 * FIX: S-au adăugat setări stricte pentru a preveni mărirea infinită a canvas-ului.
 * * @param {Array} rawData - Array de obiecte de măsurare.
 */
function renderEvolutionChart(rawData) {
    const sorted = [...rawData].sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date));
    
    const labels = sorted.map(d => d.recorded_date);
    const weightPoints = sorted.map(d => d.weight);
    const heightPoints = sorted.map(d => d.height);

    const canvas = document.getElementById('growthChart');
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    
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
                    tension: 0.35,
                    pointRadius: 4
                },
                {
                    label: 'Înălțime (cm)',
                    data: heightPoints,
                    borderColor: '#4ecdc4',
                    backgroundColor: 'rgba(78, 205, 196, 0.15)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, 
            resizeDelay: 200, 
            
            layout: {
                padding: {
                    top: 10,
                    bottom: 10,
                    left: 5,
                    right: 5
                }
            },
            scales: {
                y: { 
                    beginAtZero: false,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: {
                        font: { size: 11 }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 11 }
                    }
                }
            },
            plugins: {
                legend: { 
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 20,
                        font: { weight: 'bold' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: '#ddd',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true
                }
            }
        }
    });
    
    console.log("[Chart System] Graficul de creștere a fost stabilizat și randat.");
}

async function saveEvolution(category) {
    if (!selectedChildId) return alert("Selectați un copil!");
    
    let requestData = { child_id: selectedChildId, target: category };
    
    if (category === 'growth') {
        requestData.date = document.getElementById('growth-date').value;
        requestData.weight = document.getElementById('growth-weight').value;
        requestData.height = document.getElementById('growth-height').value;
        
        if (!esteDataValida(requestData.date)) {
            return alert("Data măsurătorii este invalidă! Asigură-te că ai completat-o corect și că nu este din viitor.");
        }
        
    } else {
        requestData.date = document.getElementById('milestone-date').value;
        requestData.name = document.getElementById('milestone-name').value;
        
        if (!esteDataValida(requestData.date)) {
            return alert("Data reperului este invalidă! Asigură-te că nu este din viitor.");
        }
        if (!requestData.name) {
            return alert("Completați numele reperului.");
        }
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

///Panou admin

async function loadAdminData() {
    const userTableBody = document.getElementById('admin-user-list');
    const childTableBody = document.getElementById('admin-children-list');
    const friendTableBody = document.getElementById('admin-friends-list'); // <-- Adăugat pentru Cercul Social
    
    try {
        const responseUsers = await fetch('api/admin.php');
        if (responseUsers.ok) {
            const usersList = await responseUsers.json();
            userTableBody.innerHTML = usersList.map(u => `
                <tr class="admin-row">
                    <td>${u.id}</td>
                    <td>${u.email}</td>
                    <td>${u.fullname || '<i>Nume lipsă</i>'}</td>
                    <td><span class="badge ${u.role}">${u.role.toUpperCase()}</span></td>
                    <td>
                        <button class="btn-delete" onclick="executeUserDeletion(${u.id})" style="background: var(--danger, #ff4757); color: white; padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer;">
                            Șterge Cont
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (e) {
        console.error("[Admin Panel] Eroare la preluarea adulților:", e);
    }


    try {
        const responseChildren = await fetch('api/admin.php?type=children');
        if (responseChildren.ok) {
            const childrenList = await responseChildren.json();
            childTableBody.innerHTML = childrenList.map(c => `
                <tr class="admin-row">
                    <td>${c.id}</td>
                    <td><strong>${c.name}</strong></td>
                    <td>${c.birthday || '-'}</td>
                    <td>
                        <button onclick="editChildName(${c.id}, '${c.name}')" class="badge admin" style="cursor: pointer; border: none; margin-right: 8px;">
                            ✏️ Modifică Nume
                        </button>
                        <button onclick="executeChildDeletion(${c.id})" style="background: var(--danger, #ff4757); color: white; padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer;">
                            Șterge Copil
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (e) {
        console.error("[Admin Panel] Eroare la preluarea copiilor:", e);
    }

    try {
        const responseFriends = await fetch('api/friends.php');
        if (responseFriends.ok) {
            const friendsList = await responseFriends.json();
            if (friendTableBody) {
                friendTableBody.innerHTML = friendsList.map(f => `
                    <tr class="admin-row">
                        <td>${f.id}</td>
                        <td><strong>${f.name}</strong></td>
                        <td><span class="badge relationship">${f.relation}</span></td>
                        <td>${f.details || '-'}</td>
                        <td>
                            <button onclick="executeFriendDeletion(${f.id})" style="background: var(--danger, #ff4757); color: white; padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer;">
                                Șterge Relație
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (e) {
        console.error("[Admin Panel] Eroare preluare cerc social:", e);
    }

    if (typeof loadSecurityLogs === "function") {
        loadSecurityLogs();
    }
}
///stergere cont 
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


///export date 

/**
 * Redirecționează către scriptul de export pentru descărcarea datelor.
 * @param {string} format - 'json' sau 'csv'.
 */
function exportData(format) {
  if (!selectedChildId) return alert("Selectați un copil pentru export.");
  const exportUrl = `api/export.php?format=${format}&child_id=${selectedChildId}`;
  console.log(`[Export] Se generează fișierul în format: ${format.toUpperCase()}`);
  window.location.href = exportUrl;
}

///cerc social 

async function saveFriendRelation() {
    const destinationSelect = document.getElementById('friend-child-destinatar').value;
    const activeChildSelect = document.getElementById('active-child-select');
    const selectedChildId = activeChildSelect ? activeChildSelect.value : null;

    let finalChildIdToSave = 0; 
    if (destinationSelect === 'active') {
        if (!selectedChildId) {
            return alert("⚠️ Te rugăm să selectezi un copil din meniul de sus!");
        }
        finalChildIdToSave = selectedChildId; 
    }

    const payload = {
        name: document.getElementById('friend-name').value,
        relation: document.getElementById('friend-relation').value,
        details: document.getElementById('friend-details').value,
        child_id: finalChildIdToSave  // Aici se trimite 0 pentru verișori comuni
    };

    if (!payload.name) {
        return alert("Te rugăm să introduci numele persoanei!");
    }

    try {
        const response = await fetch('api/friends.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Relație înregistrată cu succes!");
            
            document.getElementById('friend-name').value = '';
            document.getElementById('friend-details').value = '';
            
            if (typeof loadFriendsList === "function") {
                loadFriendsList(); 
            }
        } else {
            const err = await response.json();
            alert("Eroare: " + (err.error || "Nu s-a putut salva."));
        }
    } catch (e) {
        console.error("[Friends Save] Eroare:", e);
    }
}

function loadFriendsData() {
    const targetZone = document.getElementById('zona-prieteni-sigura');
    if (!targetZone) return; 

    const childSelectorGlobal = document.getElementById('active-child-select');
    const currentChildId = childSelectorGlobal ? childSelectorGlobal.value : selectedChildId;

    if (!currentChildId) return;

    let friends = JSON.parse(localStorage.getItem('littleStepsFriends')) || [];
    
    let currentChildFriends = friends.filter(f => 
        String(f.childId) === String(currentChildId) || 
        f.childId === "ALL_CHILDREN" ||
        f.isShared === true
    );

    let htmlContent = '<h4 class="sub-header" style="margin-top:25px; color: #1abc9c; border-top: 1px dashed #ddd; padding-top: 15px;">👦 Cerc Social & Colegi (Cerinta)</h4>';

    if (currentChildFriends.length === 0) {
        htmlContent += '<p style="font-style: italic; color: #8585a8; font-size: 0.9rem; margin-top: 5px;">Nu au fost adăugate relații sociale pentru acest copil.</p>';
    } else {
        currentChildFriends.forEach(f => {
            const isShared = f.childId === "ALL_CHILDREN" || f.isShared === true;
            const borderStyle = isShared ? "border-left: 4px solid #e67e22;" : "border-left: 4px solid #1abc9c;";
            const labelPrefix = isShared ? "🧑‍🤝‍🧑" : "🤝";

            htmlContent += `
                <div class="item family-item" style="${borderStyle} background: #fbfcfc; padding: 10px; margin-bottom: 8px; border-radius: 6px;">
                    <strong>${labelPrefix} ${f.name}</strong> (${f.relation})
                    ${isShared ? '<span style="font-size:0.75rem; background:#fef5e7; color:#e67e22; padding:2px 6px; border-radius:4px; margin-left:5px; font-weight:bold;">Comun pentru familie</span>' : ''}
                    <br><small style="color: #7f8c8d;">Locație/Grup: ${f.details}</small>
                </div>`;
        });
    }

    targetZone.innerHTML = htmlContent;
}
///Audit si securitate
function addSecurityLog(actionDetails) {
    if (!selectedChildId) return; // Nu logăm dacă nu există un context activ

    const userDisplay = document.getElementById('display-user');
    const currentUser = userDisplay ? userDisplay.innerText : "Utilizator";
    
    const now = new Date();
    const timestamp = now.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const storageKey = `littleStepsLogs_child_${selectedChildId}`;
    let logs = JSON.parse(localStorage.getItem(storageKey)) || [];

    logs.unshift({
        time: timestamp,
        user: currentUser,
        details: actionDetails
    });

    if (logs.length > 30) logs.pop();

    localStorage.setItem(storageKey, JSON.stringify(logs));
}


function loadSecurityLogs() {
    const display = document.getElementById('security-log-display');
    if (!display) return;

    if (!selectedChildId) {
        display.innerHTML = '<p style="font-style: italic; color: #bdc3c7; margin: 0;">Selectați un copil activ pentru a vedea jurnalul de audit.</p>';
        return;
    }
    const storageKey = `littleStepsLogs_child_${selectedChildId}`;
    let logs = JSON.parse(localStorage.getItem(storageKey));

    if (!logs || logs.length === 0) {
        const userDisplay = document.getElementById('display-user');
        const currentUser = userDisplay ? userDisplay.innerText : "utilizator";
        
        logs = [
            {
                time: "12:00:00",
                user: "Sistem",
                details: ` Jurnal de audit izolat și securizat pentru contextul curent.`
            },
            {
                time: "12:01:15",
                user: currentUser,
                details: " Sesiune de lucru monitorizată anti-duplicare date în cuplu."
            }
        ];
        localStorage.setItem(storageKey, JSON.stringify(logs));
    }

    let html = '';
    logs.forEach(log => {
        const userColor = (log.user === 'Sistem') ? '#7f8c8d' : '#2980b9';
        const badgeStyle = (log.user === 'Sistem') ? 'background: #eceff1; padding: 2px 6px; border-radius: 4px;' : '';

        html += `
            <div style="padding: 10px; border-bottom: 1px solid #f8f9fa; font-family: monospace; font-size: 0.85rem; display: flex; gap: 10px; align-items: center;">
                <span style="color: #e67e22; font-weight: bold;">[${log.time}]</span> 
                <span style="color: ${userColor}; font-weight: bold; ${badgeStyle}">${log.user}</span> 
                <span style="color: #2c3e50;">— ${log.details}</span>
            </div>`;
    });

    display.innerHTML = html;
}

function clearSecurityLogs() {
    if (confirm("Sigur doriți să ștergeți jurnalul de audit pentru această sesiune?")) {
        if (selectedChildId) {
            localStorage.removeItem(`littleStepsLogs_child_${selectedChildId}`);
            loadSecurityLogs();
        }
    }
}


function initializeWebNotifications() {
    if (!("Notification" in window)) return;

    // Forțăm cererea de permisiune nativă
    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            console.log("[Notifications] Permisiune acordată de utilizator.");
            // Trimite instant o notificare de test ca să vezi că merge!
            new Notification(" LittleSteps", {
                body: "Sistemul de alerte pentru părinți funcționează perfect!",
                requireInteraction: false
            });
        }
    });
}

/**
 * Verifică dacă au trecut mai mult de 3 ore de la ultima masă și trimite o alertă
 * @param {Array} feedingRecords - Lista de mese venită de la API
 */
function checkFeedingAlerts(feedingRecords) {
    if (!feedingRecords || feedingRecords.length === 0 || Notification.permission !== "granted") return;

    const lastFeeding = feedingRecords[0];
    
    // Extragerea datei și orei (presupunând că ai un câmp numit 'created_at' sau 'date' + 'time')
    const lastFeedingTime = new Date(lastFeeding.created_at || `${lastFeeding.date} T${lastFeeding.time || '00:00'}`);
    const now = new Date();

    // Calculăm diferența în ore
    const diffInMs = now - lastFeedingTime;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    // Dacă au trecut mai mult de 3 ore, declanșăm alerta vizuală pe ecran!
    if (diffInHours >= 3) {
        new Notification("⚠️ Alertă Hrănire - LittleSteps", {
            body: `Au trecut mai mult de 3 ore de la ultima masă a copilului (${lastFeeding.food_type || 'Mâncare'}). Este momentul pentru o nouă masă!`,
            requireInteraction: true // Notificarea rămâne pe ecran până dă părintele click pe ea
        });
        
        // Salvăm și în jurnalul de audit pe care l-am făcut mai devreme!
        if (typeof addSecurityLog === "function") {
            addSecurityLog("⚠️ Sistemul a declanșat o alertă automată de hrănire în browser.");
        }
    }
}
///bootstrap

document.addEventListener('DOMContentLoaded', () => {
    console.log("[System] Aplicația LittleSteps a fost încărcată.");
    initializeWebNotifications();
    checkLoginStatus();
});
async function deleteUser(userId) {
    const isConfirmed = confirm("⚠️ Ești sigur că vrei să ștergi acest membru? Acțiunea este ireversibilă și îi va șterge toate datele!");
    
    if (!isConfirmed) {
        return; 
    }

    try {
        const response = await fetch(`api/admin.php?id=${userId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            alert("Membru șters cu succes!");
            loadAdminUsers(); 
        } else {
            alert("Eroare la ștergere: " + (result.error || "Problemă necunoscută."));
        }
    } catch (error) {
        console.error("[Admin Delete] Eroare:", error);
        alert("A apărut o eroare de conexiune.");
    }
}
async function saveFriendRelation() {
    // 1. Citim valoarea din dropdown-ul de destinatar (din index.html)
    const destinationSelect = document.getElementById('friend-child-destinatar').value;
    const activeChildSelect = document.getElementById('active-child-select');
    const selectedChildId = activeChildSelect ? activeChildSelect.value : null;

    let finalChildIdToSave = 0; 

    if (destinationSelect === 'active') {
        if (!selectedChildId) {
            return alert("⚠️ Te rugăm să selectezi un copil din meniul de sus înainte de a înregistra relația!");
        }
        finalChildIdToSave = selectedChildId; 
    }
    const payload = {
        name: document.getElementById('friend-name').value,
        relation: document.getElementById('friend-relation').value,
        details: document.getElementById('friend-details').value,
        child_id: finalChildIdToSave // Trimite 0 pentru ambii, sau ID-ul real pentru un singur copil
    };

    if (!payload.name || payload.name.trim() === "") {
        return alert("Te rugăm să introduci numele persoanei sau al copilului!");
    }

    try {
        const response = await fetch('api/friends.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Relație înregistrată cu succes!");
            
            document.getElementById('friend-name').value = '';
            document.getElementById('friend-details').value = '';
            
            if (typeof loadFriendsList === "function") {
                loadFriendsList(); 
            }
        } else {
            const err = await response.json();
            alert("Eroare de la server: " + (err.error || "Nu s-a putut salva."));
        }
    } catch (e) {
        console.error("[Friends Save] Eroare:", e);
        alert("A apărut o eroare neașteptată. Verifică consola (F12).");
    }
}
async function loadFriendsList() {
    const friendsDisplay = document.getElementById('friends-list-display');
    const activeChildSelect = document.getElementById('active-child-select');
    

    if (!friendsDisplay || !activeChildSelect) return;

    const selectedChildId = activeChildSelect.value;

    if (!selectedChildId) {
        friendsDisplay.innerHTML = '<p style="color: gray; font-style: italic;">Selectează un copil pentru a-i vedea cercul social.</p>';
        return;
    }

    try {
        const response = await fetch(`api/friends.php?child_id=${selectedChildId}`);
        
        if (response.ok) {
            const friends = await response.json();
            
            let html = '<h4 class="sub-header" style="margin-top:25px; color: #16a085;">👦 Cerc Social & Colegi</h4>';

            if (friends.length === 0) {
                html += '<p style="color: gray; font-style: italic; font-size: 0.9rem;">Nu au fost adăugate relații sociale pentru acest copil.</p>';
            } else {
                html += '<ul style="list-style: none; padding: 0;">';
                friends.forEach(f => {
                    const badgeColor = (f.child_id == 0 || f.child_id === "0") ? '#f39c12' : '#1abc9c'; 
                    
                    html += `
                        <li class="item family-item" style="border-left: 4px solid ${badgeColor}; display: flex; justify-content: space-between; align-items: center; background: white; margin-bottom: 10px; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                            <div>
                                <strong>🤝 ${f.name}</strong> 
                                <span class="badge" style="background: #f0f3f4; color: #333; margin-left: 10px;">${f.relation}</span>
                                <div style="font-size: 0.85rem; color: #7f8c8d; margin-top: 5px;">📍 ${f.details || 'Fără detalii'}</div>
                            </div>
                        </li>
                    `;
                });
                html += '</ul>';
            }

            friendsDisplay.innerHTML = html;
        }
    } catch (e) {
        console.error("[Cerc Social] Eroare la preluare date:", e);
    }
}
async function executeChildDeletion(childId) {
    const isConfirmed = confirm("⚠️ Ești sigur că vrei să ștergi acest copil? Acțiunea este ireversibilă și îi va șterge istoricul!");
    
    if (!isConfirmed) return;

    try {
        const response = await fetch(`api/admin.php?type=children&id=${childId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert("Copil șters cu succes!");
            if (typeof loadAdminData === "function") loadAdminData(); 
        } else {
            alert("Eroare la ștergerea copilului.");
        }
    } catch (error) {
        console.error("[Admin Delete] Eroare ștergere copil:", error);
    }
}

async function executeFriendDeletion(friendId) {
    const isConfirmed = confirm("⚠️ Ești sigur că vrei să ștergi această persoană din Cercul Social?");
    
    if (!isConfirmed) return;

    try {
        const response = await fetch(`api/friends.php?id=${friendId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert("Persoană ștearsă din cercul social!");
            if (typeof loadAdminData === "function") loadAdminData(); 
        } else {
            alert("Eroare la ștergerea relației.");
        }
    } catch (error) {
        console.error("[Social Delete] Eroare ștergere relație:", error);
    }
}
async function openRssFeed() {
    if (!selectedChildId) {
        alert("Te rog să selectezi un copil din meniul de sus mai întâi!");
        return;
    }

    try {
        const response = await fetch(`api/get_rss_link.php?child_id=${selectedChildId}`);
        const data = await response.json();

        if (data.success) {
            window.open(data.rss_url, '_blank');
        } else {
            alert("Eroare: Nu am putut genera link-ul securizat.");
        }
    } catch (error) {
        console.error("Eroare la obținerea RSS-ului:", error);
        alert("Eroare de conexiune la server.");
    }
}
async function editChildName(childId, currentName) {
    const newName = prompt("Introdu noul nume pentru copil:", currentName);
        if (!newName || newName.trim() === "" || newName.trim() === currentName) {
        return; 
    }

    try {
        const response = await fetch('api/update_child.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                child_id: childId, 
                name: newName.trim() 
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (typeof loadAdminTable === "function") {
                loadAdminTable(); 
            }
            if (typeof populateChildrenSelect === "function") {
                populateChildrenSelect();
            }
        } else {
            alert("Eroare la modificare: " + result.error);
        }
    } catch (error) {
        console.error("Eroare:", error);
        alert("Nu m-am putut conecta la server pentru modificare.");
    }
}
