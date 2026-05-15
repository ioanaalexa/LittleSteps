/**
 * --- VARIABILE GLOBALE ---
 */
let selectedChildId = null; 
let growthChart = null; 
let sleepStartTime = localStorage.getItem('sleepStartTime'); // Reține dacă bebelușul doarme deja

/**
 * --- DARK MODE ---
 */
function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Aplică tema salvată la pornire
if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
}

/**
 * --- UTILITARE: CALCUL VÂRSTĂ EXACTĂ ---
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

/**
 * --- NAVIGARE ȘI UI ---
 */
function showSection(sectionName) {
    document.querySelectorAll('.app-section').forEach(section => section.style.display = 'none');
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));

    const targetSection = document.getElementById(`section-${sectionName}`);
    const targetMenu = document.getElementById(`menu-${sectionName}`);
    
    if (targetSection) targetSection.style.display = 'block';
    if (targetMenu) targetMenu.classList.add('active');
    
    const titles = { 
        timeline: 'Timeline Activități', 
        daily: '📝 Jurnal Zilnic',
        medical: 'Istoric Medical', 
        gallery: 'Galerie Multimedia', 
        family: 'Membrii Familiei',
        evolution: '📈 Evoluție & Creștere',
        vaccines: '💉 Schema Vaccinare',
        export: 'Export & RSS',
        admin: 'Administrare Sistem'
    };
    document.getElementById('section-title').innerText = titles[sectionName] || 'LittleSteps';

    if(sectionName === 'timeline') loadTimeline();
    if(sectionName === 'daily') updateSleepUI();
    if(sectionName === 'medical') loadMedicalRecords();
    if(sectionName === 'vaccines') loadVaccines();
    if(sectionName === 'gallery') loadGallery();
    if(sectionName === 'admin') loadAdminData();
    if(sectionName === 'family') loadFamilyData();
    if(sectionName === 'evolution') loadEvolutionData();
}

/**
 * --- JURNAL ZILNIC (HRANĂ CUSTOM + SOMN TIMER) ---
 */
async function addCustomFeeding() {
    if(!selectedChildId) return alert("Selectează un copil!");
    const input = document.getElementById('feeding-input');
    const foodType = input.value || "Masă nespecificată";

    await fetch('api/feeding.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: selectedChildId, type: foodType, details: 'Înregistrat din Jurnal' })
    });
    
    input.value = ""; 
    alert("Masă înregistrată!");
}

function handleSleepTimer() {
    if (!selectedChildId) return alert("Selectează un copil!");
    const btn = document.getElementById('sleep-timer-btn');
    
    if (!sleepStartTime) {
        // START SOMN
        sleepStartTime = Date.now();
        localStorage.setItem('sleepStartTime', sleepStartTime);
        updateSleepUI();
    } else {
        // STOP SOMN
        const endTime = Date.now();
        const durationMs = endTime - sleepStartTime;
        const durationMin = Math.round(durationMs / 1000 / 60); 

        if (confirm(`Bebelușul a dormit ${durationMin} minute. Salvezi înregistrările?`)) {
            saveSleepRecord(durationMin);
        }

        sleepStartTime = null;
        localStorage.removeItem('sleepStartTime');
        btn.innerText = "😴 Start Somn";
        btn.classList.remove('active');
    }
}

async function saveSleepRecord(minutes) {
    await fetch('api/sleep.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            child_id: selectedChildId, 
            details: `Durată somn: ${minutes} minute` 
        })
    });
}

function updateSleepUI() {
    const btn = document.getElementById('sleep-timer-btn');
    if (btn && sleepStartTime) {
        btn.classList.add('active');
        btn.innerText = "🛑 Stop Somn (În curs...)";
    }
}

/**
 * --- GESTIONARE FAMILIE ȘI GEN ---
 */
async function loadFamilyData() {
    const display = document.getElementById('family-list-display');
    const selector = document.getElementById('active-child-select');
    
    try {
        const response = await fetch('api/family.php'); 
        const data = await response.json();

        let html = '<h4>Părinți și Rude</h4>';
        data.parents.forEach(p => {
            const emoji = (p.gender === 'F') ? '👩' : '👨';
            html += `<div class="item"><strong>${emoji} ${p.fullname}</strong> (${p.role})<br><small>${p.email}</small></div>`;
        });

        html += '<h4 style="margin-top:20px;">Copii</h4>';
        data.children.forEach(c => {
            const emoji = (c.gender === 'F') ? '👧' : '👦';
            const varstaExacta = getAgeString(c.birthday);

            html += `
                <div class="item" style="border-left-color: var(--secondary)">
                    <strong>${emoji} ${c.name}</strong> 
                    <span style="color: var(--primary); font-size: 0.85em; font-weight: bold; margin-left: 8px;">
                        (${varstaExacta})
                    </span>
                    <br>
                    <small>Născut la: ${c.birthday}</small>
                </div>`;
        });
        if (display) display.innerHTML = html;

        if (data.children.length > 0) {
            selector.innerHTML = data.children.map(c => {
                const emoji = (c.gender === 'F') ? '👧' : '👦';
                return `<option value="${c.id}" ${c.id == selectedChildId ? 'selected' : ''}>${emoji} ${c.name}</option>`;
            }).join('');
            
            if (!selectedChildId) {
                selectedChildId = data.children[0].id;
                loadTimeline();
            }
        } else {
            selector.innerHTML = '<option value="">Adaugă un copil în Familie...</option>';
        }
    } catch (e) {
        console.error("Eroare încărcare familie:", e);
    }
}

function updateSelectedChild() {
    selectedChildId = document.getElementById('active-child-select').value;
    loadTimeline();
    loadMedicalRecords();
    loadGallery();
    loadEvolutionData();
    loadVaccines();
}

async function saveFamilyMember(type) {
    let payload = { type: type };
    
    if (type === 'child') {
        payload.name = document.getElementById('new-child-name').value;
        payload.birthday = document.getElementById('new-child-birth').value;
        payload.gender = document.getElementById('new-child-gender').value; 
        if(!payload.name) return alert("Introdu numele!");
    } else {
        payload.fullname = document.getElementById('new-parent-name').value;
        payload.email = document.getElementById('new-parent-email').value;
        payload.gender = document.getElementById('new-parent-gender').value;
        if(!payload.email) return alert("Introdu email-ul!");
    }

    const response = await fetch('api/family.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        alert("Salvat cu succes!");
        loadFamilyData();
    }
}

/**
 * --- AUTENTIFICARE ---
 */
async function handleAuth(action) {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const fullnameField = document.getElementById('auth-fullname');
    const fullname = fullnameField ? fullnameField.value : "";

    if(!email || !password) return alert("Te rog introdu email și parolă!");

    try {
        const response = await fetch(`api/auth.php?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullname })
        });

        const rawResponse = await response.text();
        let result;
        try {
            result = JSON.parse(rawResponse);
        } catch (e) {
            return alert("Eroare Server: Verifică consola!");
        }

        if (response.ok) {
            if (action === 'login') {
                setupUserUI(result.user);
            } else {
                alert("Cont creat! Acum te poți loga.");
            }
        } else {
            alert("Eroare: " + (result.error || "Ceva nu a mers corect."));
        }
    } catch (e) {
        alert("Eroare de rețea: " + e.message);
    }
}

function setupUserUI(user) {
    document.getElementById('auth-overlay').style.display = 'none';
    const userDisplay = document.getElementById('display-user');
    if(userDisplay) userDisplay.innerText = user.fullname || user.email;
    
    const adminMenu = document.getElementById('menu-admin');
    if(adminMenu) adminMenu.style.display = (user.role === 'admin') ? 'block' : 'none';

    loadFamilyData();
    loadTimeline();
}

async function checkLoginStatus() {
    try {
        const res = await fetch('api/auth.php?action=status');
        const result = await res.json();
        if (res.ok && result.logged_in) setupUserUI(result.user);
    } catch(e) {}
}

function logout() {
    fetch('api/auth.php?action=logout').then(() => location.reload());
}

/**
 * --- TIMELINE UNIFICAT ---
 */
async function loadTimeline() {
    if (!selectedChildId) return;
    const list = document.getElementById('activity-list');
    list.innerHTML = '<p class="placeholder-text">Se generează timeline-ul...</p>';

    try {
        const [fRes, sRes, medRes, mediaRes, evoRes] = await Promise.all([
            fetch(`api/feeding.php?child_id=${selectedChildId}`),
            fetch(`api/sleep.php?child_id=${selectedChildId}`),
            fetch(`api/medical.php?child_id=${selectedChildId}`),
            fetch(`api/media.php?child_id=${selectedChildId}`),
            fetch(`api/evolution.php?child_id=${selectedChildId}`)
        ]);

        const feeding = await fRes.json();
        const sleep = await sRes.json();
        const medical = await medRes.json();
        const media = await mediaRes.json();
        const evolution = await evoRes.json();

        let allEvents = [
            ...feeding.map(f => ({ ...f, icon: '🍼', title: `Hrană: ${f.type}`, date: f.created_at })),
            ...sleep.map(s => ({ ...s, icon: '😴', title: 'Somn', date: s.created_at })),
            ...medical.map(m => ({ ...m, icon: '🏥', title: `Medical: ${m.diagnosis}`, date: m.event_date, isMedical: true })),
            ...media.map(i => ({ ...i, icon: '🖼️', title: 'Moment capturat', date: i.created_at, isMedia: true })),
            ...evolution.growth.map(g => ({ 
                icon: '📏', 
                title: 'Evoluție: Creștere', 
                details: `Greutate: ${g.weight}kg | Înălțime: ${g.height}cm`, 
                date: g.recorded_date,
                isDateOnly: true 
            })),
            ...evolution.milestones.map(m => ({ 
                icon: '🏆', 
                title: `Reper: ${m.milestone_name}`, 
                details: 'Un moment important!', 
                date: m.milestone_date,
                isDateOnly: true 
            }))
        ];

        allEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (allEvents.length === 0) {
            list.innerHTML = `<p>Nicio activitate pentru profilul selectat.</p>`;
            return;
        }

        list.innerHTML = allEvents.map(item => {
            const dateObj = new Date(item.date);
            const timeString = (item.isMedical || item.isDateOnly) 
                ? dateObj.toLocaleDateString('ro-RO') 
                : dateObj.toLocaleString('ro-RO');

            return `
                <div class="item">
                    <span class="item-icon">${item.icon}</span>
                    <div class="item-content">
                        <strong>${item.title}</strong>
                        <p>${item.details || item.treatment || item.caption || ''}</p>
                        ${item.isMedia ? `<img src="${item.file_path}" style="max-width:180px; border-radius:10px; margin-top:10px;">` : ''}
                        <span class="time">📅 ${timeString}</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        list.innerHTML = '<p>Eroare la procesarea timeline-ului.</p>';
    }
}

/**
 * --- SALVARE ACTIVITĂȚI (Folosite în alte părți dacă e cazul) ---
 */
async function addFeeding(type) {
    if(!selectedChildId) return alert("Selectează un copil!");
    await fetch('api/feeding.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: selectedChildId, type: type, details: 'Masă înregistrată' })
    });
    loadTimeline();
}

async function addSleep() {
    if(!selectedChildId) return alert("Selectează un copil!");
    await fetch('api/sleep.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: selectedChildId, details: 'Sesiune de somn' })
    });
    loadTimeline();
}

async function addMedicalRecord() {
    const data = {
        child_id: selectedChildId,
        date: document.getElementById('med-date').value,
        diagnosis: document.getElementById('med-diagnosis').value,
        treatment: document.getElementById('med-treatment').value,
        doctor: document.getElementById('med-doctor').value
    };

    if(!data.date || !data.diagnosis) return alert("Data și diagnosticul sunt obligatorii!");

    const response = await fetch('api/medical.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        loadMedicalRecords();
        document.getElementById('medical-form').reset();
        loadTimeline();
    }
}

async function loadMedicalRecords() {
    const list = document.getElementById('medical-list');
    const res = await fetch(`api/medical.php?child_id=${selectedChildId}`);
    const records = await res.json();
    list.innerHTML = records.map(r => `
        <div class="item medical-item">
            <strong>🏥 ${r.event_date} - ${r.diagnosis}</strong>
            <p>💊 ${r.treatment || 'Fără tratament'} | 🩺 ${r.doctor || 'N/A'}</p>
        </div>
    `).join('') || '<p>Nicio înregistrare medicală.</p>';
}

/**
 * --- VACCINURI ---
 */
async function loadVaccines() {
    if (!selectedChildId) return;
    const list = document.getElementById('vaccine-list');
    if (!list) return;
    list.innerHTML = '<p>Se încarcă schema de vaccinare...</p>';

    try {
        const res = await fetch(`api/vaccines.php?child_id=${selectedChildId}`);
        const data = await res.json();

        list.innerHTML = data.map(v => `
            <div class="vaccine-item ${v.status == 1 ? 'completed' : ''}">
                <div class="v-info">
                    <strong>${v.name}</strong>
                    <small>📅 Recomandat la: ${v.age_tag}</small>
                    ${v.status == 1 ? `<span class="v-date">Efectuat la: ${v.date_administered}</span>` : ''}
                </div>
                <button onclick="toggleVaccine(${v.id}, ${v.status == 1 ? 0 : 1})" class="${v.status == 1 ? 'btn-alt' : ''}">
                    ${v.status == 1 ? '✅ Efectuat' : 'Bifează'}
                </button>
            </div>
        `).join('');
    } catch (e) { console.error(e); }
}

async function toggleVaccine(id, newStatus) {
    await fetch('api/vaccines.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, status: newStatus })
    });
    loadVaccines();
}

/**
 * --- GALERIE ȘI MEDIA ---
 */
async function uploadMedia() {
    const fileInput = document.getElementById('media-file');
    const caption = document.getElementById('media-caption').value;
    
    if (fileInput.files.length === 0) return alert("Selectează un fișier!");

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('caption', caption);
    formData.append('child_id', selectedChildId);

    const response = await fetch('api/media.php', {
        method: 'POST',
        body: formData
    });

    if (response.ok) {
        loadGallery();
        loadTimeline();
        document.getElementById('upload-form').reset();
    }
}

async function loadGallery() {
    const grid = document.getElementById('gallery-grid');
    const res = await fetch(`api/media.php?child_id=${selectedChildId}`);
    const items = await res.json();
    grid.innerHTML = items.map(item => `
        <div class="gallery-card">
            <img src="${item.file_path}" alt="Foto">
            <p>${item.caption || ''}</p>
        </div>
    `).join('') || '<p>Galeria este goală.</p>';
}

/**
 * --- EVOLUȚIE (CU GRAFIC) ---
 */
async function loadEvolutionData() {
    if (!selectedChildId) return;
    const growthList = document.getElementById('growth-list');
    const milestonesList = document.getElementById('milestones-list');

    try {
        const response = await fetch(`api/evolution.php?child_id=${selectedChildId}`);
        const data = await response.json();

        growthList.innerHTML = data.growth.map(g => 
            `<div class="item" style="border-left: 4px solid var(--success);">
                ⚖️ ${g.weight}kg | 📏 ${g.height}cm <br><small>Data: ${g.recorded_date}</small>
            </div>`).join('') || '<p>Nicio măsurătoare încă.</p>';

        milestonesList.innerHTML = data.milestones.map(m => 
            `<div class="item" style="border-left: 4px solid var(--warning);">
                🏆 <strong>${m.milestone_name}</strong> <br><small>Data: ${m.milestone_date}</small>
            </div>`).join('') || '<p>Niciun reper înregistrat.</p>';

        if (data.growth.length > 0) {
            const sortedData = [...data.growth].sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date));
            
            const labels = sortedData.map(g => g.recorded_date);
            const weights = sortedData.map(g => g.weight);
            const heights = sortedData.map(g => g.height);

            const chartEl = document.getElementById('growthChart');
            if (chartEl) {
                const ctx = chartEl.getContext('2d');
                if (growthChart) growthChart.destroy();

                growthChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Greutate (kg)',
                                data: weights,
                                borderColor: '#ff6b6b',
                                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                                fill: true,
                                tension: 0.3
                            },
                            {
                                label: 'Înălțime (cm)',
                                data: heights,
                                borderColor: '#4ecdc4',
                                backgroundColor: 'rgba(78, 205, 196, 0.1)',
                                fill: true,
                                tension: 0.3
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: { beginAtZero: false }
                        }
                    }
                });
            }
        }
    } catch (e) {
        console.error("Eroare la încărcarea evoluției:", e);
    }
}

async function saveEvolution(target) {
    if (!selectedChildId) return alert("Selectează un copil!");
    
    let payload = { child_id: selectedChildId, target: target };
    if(target === 'growth') {
        payload.date = document.getElementById('growth-date').value;
        payload.weight = document.getElementById('growth-weight').value;
        payload.height = document.getElementById('growth-height').value;
        if(!payload.date) return alert("Selectează data!");
    } else {
        payload.date = document.getElementById('milestone-date').value;
        payload.name = document.getElementById('milestone-name').value;
        if(!payload.name || !payload.date) return alert("Numele și data sunt obligatorii!");
    }

    const response = await fetch('api/evolution.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        alert("Date salvate!");
        loadEvolutionData();
        loadTimeline();
    }
}

/**
 * --- ADMIN ---
 */
async function loadAdminData() {
    const list = document.getElementById('admin-user-list');
    const res = await fetch('api/admin.php');
    if (!res.ok) return list.innerHTML = '<tr><td colspan="5">Acces interzis.</td></tr>';

    const users = await res.json();
    list.innerHTML = users.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${u.email}</td>
            <td>${u.fullname || '-'}</td>
            <td><span class="role-badge ${u.role}">${u.role}</span></td>
            <td><button class="btn-delete" onclick="deleteUser(${u.id})">Șterge</button></td>
        </tr>
    `).join('');
}

async function deleteUser(id) {
    if (confirm("Sigur ștergi?")) {
        await fetch(`api/admin.php?id=${id}`, { method: 'DELETE' });
        loadAdminData();
    }
}

/**
 * --- EXPORT ---
 */
function exportData(format) {
    window.location.href = `api/export.php?format=${format}&child_id=${selectedChildId}`;
}

// Start
checkLoginStatus();