/**
 * --- VARIABILE GLOBALE ---
 */
let selectedChildId = null; 

/**
 * --- NAVIGARE ȘI UI ---
 */
function showSection(sectionName) {
    // Ascundem tot
    document.querySelectorAll('.app-section').forEach(section => section.style.display = 'none');
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));

    // Afișăm secțiunea selectată
    const targetSection = document.getElementById(`section-${sectionName}`);
    const targetMenu = document.getElementById(`menu-${sectionName}`);
    
    if (targetSection) targetSection.style.display = 'block';
    if (targetMenu) targetMenu.classList.add('active');
    
    const titles = { 
        timeline: 'Timeline Activități', 
        medical: 'Istoric Medical', 
        gallery: 'Galerie Multimedia', 
        family: 'Membrii Familiei',
        evolution: '📈 Evoluție & Creștere', // Adăugat pentru Evoluție
        export: 'Export & RSS',
        admin: 'Administrare Sistem'
    };
    document.getElementById('section-title').innerText = titles[sectionName] || 'LittleSteps';

    // Refresh date la schimbarea secțiunii
    if(sectionName === 'timeline') loadTimeline();
    if(sectionName === 'medical') loadMedicalRecords();
    if(sectionName === 'gallery') loadGallery();
    if(sectionName === 'admin') loadAdminData();
    if(sectionName === 'family') loadFamilyData();
    if(sectionName === 'evolution') loadEvolutionData(); // Adăugat pentru Evoluție
}

/**
 * --- GESTIONARE FAMILIE ȘI GEN (👦/👧/👨/👩) ---
 */
async function loadFamilyData() {
    const display = document.getElementById('family-list-display');
    const selector = document.getElementById('active-child-select');
    
    try {
        const response = await fetch('../api/family.php');
        const data = await response.json();

        // 1. Construim lista de membri cu emoji-uri dinamice în funcție de Gen
        let html = '<h4>Părinți și Rude</h4>';
        data.parents.forEach(p => {
            const emoji = (p.gender === 'F') ? '👩' : '👨';
            html += `<div class="item"><strong>${emoji} ${p.fullname}</strong> (${p.role})<br><small>${p.email}</small></div>`;
        });

        html += '<h4 style="margin-top:20px;">Copii</h4>';
        data.children.forEach(c => {
            const emoji = (c.gender === 'F') ? '👧' : '👦';
            html += `<div class="item" style="border-left-color: var(--secondary)"><strong>${emoji} ${c.name}</strong><br><small>Născut la: ${c.birthday}</small></div>`;
        });
        if (display) display.innerHTML = html;

        // 2. Populăm selectorul global din Header (doar copiii)
        if (data.children.length > 0) {
            selector.innerHTML = data.children.map(c => {
                const emoji = (c.gender === 'F') ? '👧' : '👦';
                return `<option value="${c.id}" ${c.id == selectedChildId ? 'selected' : ''}>${emoji} ${c.name}</option>`;
            }).join('');
            
            // Dacă e prima încărcare, selectăm primul copil automat
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
    // La schimbarea copilului, curățăm și reîncărcăm totul pentru a evita amestecarea datelor
    loadTimeline();
    loadMedicalRecords();
    loadGallery();
    loadEvolutionData(); // Adăugat pentru refresh la schimbarea copilului
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

    const response = await fetch('../api/family.php', {
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
    const fullname = document.getElementById('auth-fullname').value;

    const response = await fetch(`../api/auth.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullname })
    });

    const result = await response.json();
    if (response.ok) {
        if (action === 'login') setupUserUI(result.user);
        else alert("Cont creat! Acum te poți loga.");
    } else {
        alert(result.error);
    }
}

function setupUserUI(user) {
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('display-user').innerText = user.fullname || user.email;
    
    // Vizibilitate meniu Admin
    const adminMenu = document.getElementById('menu-admin');
    adminMenu.style.display = (user.role === 'admin') ? 'block' : 'none';

    loadFamilyData();
    loadTimeline();
}

async function checkLoginStatus() {
    const res = await fetch('../api/auth.php?action=status');
    const result = await res.json();
    if (res.ok && result.logged_in) setupUserUI(result.user);
}

function logout() {
    fetch('../api/auth.php?action=logout').then(() => location.reload());
}

/**
 * --- TIMELINE UNIFICAT (REPARAT ORA ȘI EVOLUȚIE) ---
 */
async function loadTimeline() {
    if (!selectedChildId) return;
    const list = document.getElementById('activity-list');
    list.innerHTML = '<p class="placeholder-text">Se generează timeline-ul...</p>';

    try {
        // Preluăm și datele de Evoluție
        const [fRes, sRes, medRes, mediaRes, evoRes] = await Promise.all([
            fetch(`../api/feeding.php?child_id=${selectedChildId}`),
            fetch(`../api/sleep.php?child_id=${selectedChildId}`),
            fetch(`../api/medical.php?child_id=${selectedChildId}`),
            fetch(`../api/media.php?child_id=${selectedChildId}`),
            fetch(`../api/evolution.php?child_id=${selectedChildId}`)
        ]);

        const feeding = await fRes.json();
        const sleep = await sRes.json();
        const medical = await medRes.json();
        const media = await mediaRes.json();
        const evolution = await evoRes.json();

        let allEvents = [
            ...feeding.map(f => ({ ...f, icon: '🍼', title: `Hrană: ${f.type}`, date: f.created_at })),
            ...sleep.map(s => ({ ...s, icon: '😴', title: 'Somn', date: s.created_at })),
            // FIX: Am scos concatenarea de 00:00:00 și am marcat ca isMedical
            ...medical.map(m => ({ ...m, icon: '🏥', title: `Medical: ${m.diagnosis}`, date: m.event_date, isMedical: true })),
            ...media.map(i => ({ ...i, icon: '🖼️', title: 'Moment capturat', date: i.created_at, isMedia: true })),
            // ADĂUGAT: Creștere în timeline
            ...evolution.growth.map(g => ({ 
                icon: '📏', 
                title: 'Evoluție: Creștere', 
                details: `Greutate: ${g.weight}kg | Înălțime: ${g.height}cm`, 
                date: g.recorded_date,
                isDateOnly: true 
            })),
            // ADĂUGAT: Milestones în timeline
            ...evolution.milestones.map(m => ({ 
                icon: '🏆', 
                title: `Reper: ${m.milestone_name}`, 
                details: 'Un moment important în dezvoltare!', 
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
            
            // FIX ORA: Dacă e Medical sau Evoluție, folosim doar data, altfel dată + oră
            const timeString = (item.isMedical || item.isDateOnly) 
                ? dateObj.toLocaleDateString('ro-RO') 
                : dateObj.toLocaleString('ro-RO');

            return `
                <div class="item">
                    <span class="item-icon">${item.icon}</span>
                    <div class="item-content">
                        <strong>${item.title}</strong>
                        <p>${item.details || item.treatment || item.caption || ''}</p>
                        ${item.isMedia ? `<img src="../public/${item.file_path}" style="max-width:180px; border-radius:10px; margin-top:10px;">` : ''}
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
 * --- SALVARE ACTIVITĂȚI (LEGATE DE CHILD_ID) ---
 */
async function addFeeding(type) {
    if(!selectedChildId) return alert("Selectează un copil!");
    await fetch('../api/feeding.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: selectedChildId, type: type, details: 'Masă înregistrată' })
    });
    loadTimeline();
}

async function addSleep() {
    if(!selectedChildId) return alert("Selectează un copil!");
    await fetch('../api/sleep.php', {
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

    const response = await fetch('../api/medical.php', {
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
    const res = await fetch(`../api/medical.php?child_id=${selectedChildId}`);
    const records = await res.json();
    list.innerHTML = records.map(r => `
        <div class="item medical-item">
            <strong>🏥 ${r.event_date} - ${r.diagnosis}</strong>
            <p>💊 ${r.treatment || 'Fără tratament'} | 🩺 ${r.doctor || 'N/A'}</p>
        </div>
    `).join('') || '<p>Nicio înregistrare medicală.</p>';
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
    formData.append('child_id', selectedChildId); // Esențial pentru izolare

    const response = await fetch('../api/media.php', {
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
    const res = await fetch(`../api/media.php?child_id=${selectedChildId}`);
    const items = await res.json();
    grid.innerHTML = items.map(item => `
        <div class="gallery-card">
            <img src="../public/${item.file_path}" alt="Foto">
            <p>${item.caption || ''}</p>
        </div>
    `).join('') || '<p>Galeria este goală.</p>';
}

/**
 * --- EVOLUȚIE (CREȘTERE & MILESTONES) ---
 */
async function loadEvolutionData() {
    if (!selectedChildId) return;
    const growthList = document.getElementById('growth-list');
    const milestonesList = document.getElementById('milestones-list');

    try {
        const response = await fetch(`../api/evolution.php?child_id=${selectedChildId}`);
        const data = await response.json();

        growthList.innerHTML = data.growth.map(g => 
            `<div class="item" style="border-left: 4px solid var(--success);">
                ⚖️ ${g.weight}kg | 📏 ${g.height}cm <br><small>Data: ${g.recorded_date}</small>
            </div>`).join('') || '<p>Nicio măsurătoare încă.</p>';

        milestonesList.innerHTML = data.milestones.map(m => 
            `<div class="item" style="border-left: 4px solid var(--warning);">
                🏆 <strong>${m.milestone_name}</strong> <br><small>Data: ${m.milestone_date}</small>
            </div>`).join('') || '<p>Niciun reper înregistrat.</p>';
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

    const response = await fetch('../api/evolution.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        alert("Date salvate!");
        loadEvolutionData();
        loadTimeline(); // Update timeline-ul general dacă e cazul
    }
}

/**
 * --- ADMIN ---
 */
async function loadAdminData() {
    const list = document.getElementById('admin-user-list');
    const res = await fetch('../api/admin.php');
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
        await fetch(`../api/admin.php?id=${id}`, { method: 'DELETE' });
        loadAdminData();
    }
}

/**
 * --- EXPORT ---
 */
function exportData(format) {
    window.location.href = `../api/export.php?format=${format}&child_id=${selectedChildId}`;
}

// Start
checkLoginStatus();