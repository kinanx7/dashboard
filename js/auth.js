/**
 * Authentication, login/logout, user profile modals & Customer Code sessions
 */

function migrateMonthlyData() {
    let migrated = false;
    let company = getCompanyData();
    const isAdmin = currentUser && currentUser.role === 'admin';
    const email = currentUser ? currentUser.email.toLowerCase() : "";

    company.workers.forEach((w, workerIndex) => {
        // If not admin, the worker can ONLY migrate their own record
        if (!isAdmin && (!w.email || w.email.toLowerCase() !== email)) {
            return;
        }

        let workerMigrated = false;
        if (!w.email) {
            w.email = "";
            workerMigrated = true;
        } else if (w.email !== w.email.toLowerCase()) {
            w.email = w.email.toLowerCase();
            workerMigrated = true;
        }
        if (!w.permissions) { w.permissions = { warehouse: false, drivers: false, finance: false }; workerMigrated = true; }
        if (!w.monthlyStats) { w.monthlyStats = {}; workerMigrated = true; }
        if (!w.monthlyStats[currentGlobalMonth]) {
            w.monthlyStats[currentGlobalMonth] = { custodyList: [], rewardsList: [], costs: 0, paymentsList: [], violationsList: [], deliveriesList: [], legacyDeliveries: 0 };
            workerMigrated = true;
        }
        if (!w.role) { w.role = "General Staff"; workerMigrated = true; }
        if (!w.initialBalance) { w.initialBalance = 0; workerMigrated = true; }
        if (!w.jobs) { w.jobs = []; workerMigrated = true; }
        if (!w.rank) { w.rank = "Unranked"; workerMigrated = true; }
        if (w.lastEvalDate === undefined) { w.lastEvalDate = Date.now(); workerMigrated = true; }

        if (workerMigrated) {
            migrated = true;
            if (!isAdmin) {
                // Targeted write to their own worker path
                db.ref(`companies/${currentCompany}/workers/${workerIndex}`).set(w)
                    .catch(err => console.error("Error migrating worker profile:", err));
            }
        }
    });

    if (isAdmin) {
        if (migrated) saveData();
        company.workers.forEach(w => {
            if (w.id && w.email) {
                const key = w.email.toLowerCase().replace(/\./g, ',');
                db.ref(`companies/${currentCompany}/users/${key}`).set(w.id)
                    .catch(err => console.error("Error syncing user email mapping:", err));
                db.ref(`companies/${currentCompany}/userPermissions/${w.id}`).set({
                    email: w.email.toLowerCase(),
                    warehouse: w.permissions ? !!w.permissions.warehouse : false,
                    drivers: w.permissions ? !!w.permissions.drivers : false,
                    finance: w.permissions ? !!w.permissions.finance : false,
                    sales: w.permissions ? !!w.permissions.sales : false,
                    costs: w.permissions ? !!w.permissions.costs : false,
                    adverts: w.permissions ? !!w.permissions.adverts : false
                }).catch(err => console.error("Error syncing user permissions:", err));
            }
        });
    }
}

function startGlobalTick() {
    if (globalInterval) clearInterval(globalInterval);
    globalInterval = setInterval(() => {
        updateActiveDriverTimer();
        updateViolationTimers();
        updateTaskTimers();
    }, 1000);
}

function updateTaskTimers() {
    const timers = document.querySelectorAll('.task-timer-display');
    let mostUrgentTask = null;
    let minDiff = Infinity;

    // FIX: Use 'timerEl' instead of 't' so it doesn't break the t() translation function
    timers.forEach(timerEl => {
        const deadline = parseInt(timerEl.getAttribute('data-deadline'));
        const diff = deadline - Date.now();
        if (diff <= 0) {
            timerEl.innerHTML = `🚨 ${t('status-late')}`;
            timerEl.style.color = 'var(--danger)';
        } else {
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
            timerEl.innerHTML = `⏳ ${t('status-time-remaining')} ${m}:${s}`;
            timerEl.style.color = 'var(--warning)';
        }
    });

    // Update persistent banner for the current worker
    const banner = document.getElementById('worker-task-timer-banner');
    const timerDisplay = document.getElementById('worker-timer-display');
    const taskNameDisplay = document.getElementById('worker-timer-task-name');

    if (currentUser && currentUser.role === 'worker') {
        const email = currentUser.email.toLowerCase();
        const worker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === email);
        if (worker && worker.jobs) {
            worker.jobs.forEach(j => {
                if ((j.status === 'seen' || (!j.status && j.done === false)) && j.deadlineMins > 0 && j.seenAt) {
                    const deadlineMs = j.seenAt + (j.deadlineMins * 60000);
                    const diff = deadlineMs - Date.now();
                    if (diff < minDiff) {
                        minDiff = diff;
                        mostUrgentTask = { title: j.title, diff: diff };
                    }
                }
            });
        }
    }

    // Ensure the banner elements actually exist before trying to update them
    if (banner && timerDisplay && taskNameDisplay) {
        if (mostUrgentTask) {
            banner.style.display = 'block';
            taskNameDisplay.textContent = mostUrgentTask.title;
            const diff = mostUrgentTask.diff;
            if (diff <= 0) {
                timerDisplay.textContent = t('status-late');
                timerDisplay.style.color = 'var(--danger)';
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
                timerDisplay.textContent = `${m}:${s}`;
                timerDisplay.style.color = 'var(--warning)';
            }
        } else {
            banner.style.display = 'none';
        }
    }
}

function updateViolationTimers() {
    let expiredSomething = false;
    const timers = document.querySelectorAll('.viol-timer');

    // FIX: Changed 't' to 'timerEl'
    timers.forEach(timerEl => {
        const deadline = parseInt(timerEl.getAttribute('data-deadline'));
        const diff = deadline - Date.now();
        if (diff <= 0) {
            timerEl.classList.remove('viol-timer');
            timerEl.innerHTML = '🚨 Applied (Time Expired)';
            timerEl.style.color = 'var(--danger)';
            const parent = timerEl.closest('.flex-between');
            if (parent && parent.children[1]) parent.children[1].innerHTML = '';
            expiredSomething = true;
        } else {
            const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
            const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
            const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
            timerEl.innerHTML = `⏳ Pending (${h}h ${m}m ${s}s left)`;
        }
    });

    if (expiredSomething) {
        if (currentTab === 'finance') { renderFinDetails(); renderFinanceTable(); }
        else if (currentTab === 'summary') { renderSummaryTable(); }
    }
}

// --- AUTO LOGGER ---
function getDaysInMonth(year, month) { return new Date(year, month, 0).getDate(); }

function runAutoLogger() {
    let updated = false;
    const selDate = new Date(currentGlobalMonth + "-01");
    const selYear = selDate.getFullYear();
    const selMonthNum = selDate.getMonth() + 1;

    const todayDate = new Date();
    const todayYear = todayDate.getFullYear();
    const todayMonthNum = todayDate.getMonth() + 1;
    const todayDay = todayDate.getDate();

    let targetDayLimit = 0;
    let isFuture = false;

    if (selYear < todayYear || (selYear === todayYear && selMonthNum < todayMonthNum)) {
        targetDayLimit = getDaysInMonth(selYear, selMonthNum);
    } else if (selYear === todayYear && selMonthNum === todayMonthNum) {
        targetDayLimit = todayDay;
    } else {
        targetDayLimit = getDaysInMonth(selYear, selMonthNum);
        isFuture = true;
    }

    const monthStrPad = selMonthNum.toString().padStart(2, '0');
    const todayStr = `${todayYear}-${todayMonthNum.toString().padStart(2, '0')}-${todayDay.toString().padStart(2, '0')}`;

    const isAdmin = currentUser && currentUser.role === 'admin';
    const email = currentUser ? currentUser.email.toLowerCase() : "";

    getCompanyData().workers.forEach((w, workerIndex) => {
        // If not admin, the worker can ONLY auto-log their own records
        if (!isAdmin && (!w.email || w.email.toLowerCase() !== email)) {
            return;
        }

        let workerUpdated = false;
        if (!isFuture) {
            const originalCount = w.logs.length;
            w.logs = w.logs.filter(l => l.date <= todayStr || l.note !== 'Auto-logged ✅');
            if (w.logs.length !== originalCount) workerUpdated = true;
        }

        for (let i = 1; i <= targetDayLimit; i++) {
            let dStr = `${selYear}-${monthStrPad}-${i.toString().padStart(2, '0')}`;
            let existing = w.logs.find(l => l.date === dStr);
            if (!existing) {
                w.logs.push({ date: dStr, score: 100, note: 'Auto-logged ✅', noteType: 'good' });
                workerUpdated = true;
            }
        }
        w.logs.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (workerUpdated) {
            updated = true;
            if (!isAdmin) {
                // Workers write specifically to their own logs path to satisfy security rules
                db.ref(`companies/${currentCompany}/workers/${workerIndex}/logs`).set(w.logs)
                    .catch(err => console.error("Error auto-logging for worker:", err));
            }
        }
    });

    if (updated && isAdmin) {
        saveData();
    }
}

function getVisibleWorkers() {
    const workers = getCompanyData().workers;
    if (!currentUser) return [];

    const email = currentUser.email.toLowerCase();
    const admins = getCompanyData().admins || { "kinan,rahal@hotmail,com": true };
    const isAdmin = email === 'kinan.rahal@hotmail.com' || admins[email.replace(/\./g, ',')] === true;

    const worker = workers.find(w => w.email && w.email.toLowerCase() === email);
    const hasFinancePerm = worker && worker.permissions && worker.permissions.finance;

    if (isAdmin || hasFinancePerm) {
        return workers;
    } else {
        return workers.filter(w => w.email && w.email.toLowerCase() === email);
    }
}

// --- ADMIN / MANAGER ACCESS SYSTEM ---
function renderManagersList() {
    const list = document.getElementById('managers-list');
    if (!list) return;
    list.innerHTML = '';
    const admins = getCompanyData().admins || {};
    Object.keys(admins).forEach(key => {
        const email = key.replace(/,/g, '.');
        const li = document.createElement('li'); li.className = 'flex-between list-item';
        let delBtn = '';
        if (currentUser && currentUser.isKinan && email !== 'kinan.rahal@hotmail.com') {
            // Renamed to 'Demote' as requested
            delBtn = `<button class="btn-outline-danger admin-only" style="padding: 2px 8px; font-size: 0.7rem;" onclick="deleteManager('${email}')">${t('btn-remove')}</button>`;
        } else if (email === 'kinan.rahal@hotmail.com') {
            delBtn = `<span class="badge" style="background:var(--primary);">${t('label-master')}</span>`;
        }
        li.innerHTML = `<span style="font-weight: 500; font-size: 0.9rem; color: var(--text-main);">${email}</span> ${delBtn}`;
        list.appendChild(li);
    });
}

function addManager() {
    const email = document.getElementById('new-manager-email').value.trim().toLowerCase();
    if (!email) return;
    const key = email.replace(/\./g, ',');
    if (!getCompanyData().admins) getCompanyData().admins = {};
    if (!getCompanyData().admins[key]) {
        getCompanyData().admins[key] = true;
        document.getElementById('new-manager-email').value = '';

        // Targeted write to admins list
        db.ref('companies/' + currentCompany + '/admins/' + key).set(true)
            .catch(err => console.error("Error adding admin manager:", err));
    }
}

function deleteManager(email) {
    if (!currentUser.isKinan) return alert("Only the ultimate admin can demote managers.");
    if (email === 'kinan.rahal@hotmail.com') return alert("Cannot demote master admin.");
    if (confirm(`${t('btn-remove')} ${email}?`)) {
        const key = email.replace(/\./g, ',');
        if (getCompanyData().admins) {
            delete getCompanyData().admins[key];
        }

        // Targeted write to admins list
        db.ref('companies/' + currentCompany + '/admins/' + key).remove()
            .catch(err => console.error("Error deleting admin manager:", err));
        renderManagersList();
    }
}

function loadWorkerPerms() {
    const wId = document.getElementById('perm-worker-select').value;
    if (!wId) {
        document.getElementById('perm-wh').checked = false;
        document.getElementById('perm-drv').checked = false;
        document.getElementById('perm-fin').checked = false;
        document.getElementById('perm-sales').checked = false;
        document.getElementById('perm-costs').checked = false;
        document.getElementById('perm-adverts').checked = false;
        document.getElementById('perm-attendance').checked = false;
        if (document.getElementById('perm-tasks')) document.getElementById('perm-tasks').checked = false;
        return;
    }
    const worker = getCompanyData().workers.find(w => w.id === wId);
    if (!worker) return;
    const p = worker.permissions || { warehouse: false, drivers: false, finance: false, sales: false, costs: false, adverts: false, attendance: false, tasks: false };
    document.getElementById('perm-wh').checked = !!p.warehouse;
    document.getElementById('perm-drv').checked = !!p.drivers;
    document.getElementById('perm-fin').checked = !!p.finance;
    document.getElementById('perm-sales').checked = !!p.sales;
    document.getElementById('perm-costs').checked = !!p.costs;
    document.getElementById('perm-adverts').checked = !!p.adverts;
    document.getElementById('perm-attendance').checked = !!p.attendance;
    if (document.getElementById('perm-tasks')) document.getElementById('perm-tasks').checked = !!p.tasks;
    if (document.getElementById('perm-prepare')) document.getElementById('perm-prepare').checked = !!p.prepare;
}

function saveWorkerPerms() {
    const wId = document.getElementById('perm-worker-select').value;
    if (!wId) return alert("Select a worker first.");
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === wId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    worker.permissions = {
        warehouse: document.getElementById('perm-wh').checked,
        drivers: document.getElementById('perm-drv').checked,
        finance: document.getElementById('perm-fin').checked,
        sales: document.getElementById('perm-sales').checked,
        costs: document.getElementById('perm-costs').checked,
        adverts: document.getElementById('perm-adverts').checked,
        attendance: document.getElementById('perm-attendance').checked,
        tasks: document.getElementById('perm-tasks') ? document.getElementById('perm-tasks').checked : false,
        prepare: document.getElementById('perm-prepare') ? document.getElementById('perm-prepare').checked : false
    };

    // Targeted write to worker permissions path
    db.ref(`companies/${currentCompany}/workers/${workerIndex}/permissions`).set(worker.permissions)
        .catch(err => console.error("Error saving worker perms:", err));

    // Flat lookup update for rules scalability
    if (worker.id && worker.email) {
        const key = worker.email.toLowerCase().replace(/\./g, ',');
        db.ref(`companies/${currentCompany}/users/${key}`).set(worker.id)
            .catch(err => console.error("Error updating user email mapping:", err));
        db.ref(`companies/${currentCompany}/userPermissions/${worker.id}`).set({
            email: worker.email.toLowerCase(),
            ...worker.permissions
        }).catch(err => console.error("Error updating flat user permissions:", err));
    }
    alert("Permissions updated!");
}


function saveMonthlySales() {
    const sources = getCompanyData().incomeSources || [];
    let salesForMonth = {};
    sources.forEach(s => {
        const inputId = 'sales-input-' + s.replace(/[^a-zA-Z0-9]/g, '');
        const el = document.getElementById(inputId);
        if (el) {
            salesForMonth[s] = parseFloat(el.value) || 0;
        }
    });
    if (!getCompanyData().monthlySales) getCompanyData().monthlySales = {};
    getCompanyData().monthlySales[currentGlobalMonth] = salesForMonth;

    // Targeted write to monthlySales for current month
    db.ref(`companies/${currentCompany}/monthlySales/${currentGlobalMonth}`).set(salesForMonth)
        .catch(err => console.error("Error saving monthly sales:", err));
    alert(`Sales successfully saved for ${currentGlobalMonth} 💰`);
}



// --- COMMUNICATION & NOTES SYSTEM ---
let noteAttachmentType = null; // 'image' or 'voice'
let noteAttachmentData = null; // base64 Data URL
let noteMediaRecorder = null;
let noteAudioChunks = [];
let noteRecordingTimer = null;
let noteRecordingDuration = 0;
let noteRecorderShouldSave = false;

function triggerNoteImageUpload(source) {
    if (noteMediaRecorder && noteMediaRecorder.state === 'recording') {
        stopVoiceRecording(false);
    }
    if (source === 'camera') {
        document.getElementById('note-camera-input').click();
    } else {
        document.getElementById('note-image-input').click();
    }
}

function handleNoteImageSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    compressImage(file, (base64Img) => {
        noteAttachmentType = 'image';
        noteAttachmentData = base64Img;
        updateNoteAttachmentPreview();
    });
}

function toggleVoiceRecording() {
    if (noteMediaRecorder && noteMediaRecorder.state === 'recording') {
        stopVoiceRecording(true);
        return;
    }

    clearNoteAttachment();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Microphone recording is not supported in this browser or environment.");
        return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            noteAudioChunks = [];
            let options = { mimeType: 'audio/webm' };
            if (!MediaRecorder.isTypeSupported('audio/webm')) {
                options = { mimeType: 'audio/ogg' };
            }
            if (!MediaRecorder.isTypeSupported('audio/ogg')) {
                options = {};
            }

            try {
                noteMediaRecorder = new MediaRecorder(stream, options);
            } catch (e) {
                noteMediaRecorder = new MediaRecorder(stream);
            }

            noteMediaRecorder.ondataavailable = e => {
                if (e.data && e.data.size > 0) {
                    noteAudioChunks.push(e.data);
                }
            };

            noteMediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());

                if (noteRecorderShouldSave && noteAudioChunks.length > 0) {
                    const audioBlob = new Blob(noteAudioChunks, { type: noteMediaRecorder.mimeType || 'audio/octet-stream' });
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = () => {
                        noteAttachmentType = 'voice';
                        noteAttachmentData = reader.result;
                        updateNoteAttachmentPreview();
                    };
                }
            };

            noteRecorderShouldSave = false;
            noteMediaRecorder.start();

            document.getElementById('note-voice-recording-ui').style.display = 'flex';
            const recordBtn = document.getElementById('note-btn-record-voice');
            recordBtn.innerHTML = '🛑 Stop Recording';
            recordBtn.style.borderColor = 'var(--danger)';
            recordBtn.style.color = 'var(--danger)';

            noteRecordingDuration = 0;
            document.getElementById('recording-timer').innerText = '0:00';
            clearInterval(noteRecordingTimer);
            noteRecordingTimer = setInterval(() => {
                noteRecordingDuration++;
                const mins = Math.floor(noteRecordingDuration / 60);
                const secs = noteRecordingDuration % 60;
                document.getElementById('recording-timer').innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

                if (noteRecordingDuration >= 120) {
                    stopVoiceRecording(true);
                }
            }, 1000);
        })
        .catch(err => {
            console.error("Microphone access error:", err);
            if (typeof AndroidInterface !== 'undefined') {
                document.getElementById('apk-permission-modal').style.display = 'flex';
            } else {
                alert("Unable to access microphone. Please make sure that your phone's browser or the Burgeroov App has Microphone permissions enabled in your phone's Settings 🎤");
            }
        });
}

function stopVoiceRecording(save) {
    if (!noteMediaRecorder || noteMediaRecorder.state !== 'recording') return;

    noteRecorderShouldSave = save;
    noteMediaRecorder.stop();

    clearInterval(noteRecordingTimer);
    noteRecordingTimer = null;

    document.getElementById('note-voice-recording-ui').style.display = 'none';
    const recordBtn = document.getElementById('note-btn-record-voice');
    recordBtn.innerHTML = '🎤 Record Voice Note';
    recordBtn.style.borderColor = 'var(--border-color)';
    recordBtn.style.color = 'var(--text-main)';
}

function updateNoteAttachmentPreview() {
    const previewEl = document.getElementById('note-attachment-preview');
    const contentEl = document.getElementById('note-preview-content');
    if (!previewEl || !contentEl) return;

    previewEl.style.display = 'block';
    contentEl.innerHTML = '';

    if (noteAttachmentType === 'image') {
        contentEl.innerHTML = `
                    <div style="position:relative; display:inline-block; max-width: 100%;">
                        <img src="${noteAttachmentData}" style="max-height:100px; max-width:100%; border-radius:6px; border:1px solid var(--border-color);" alt="Attachment preview">
                        <span style="display:block; font-size:0.75rem; color:var(--text-muted); margin-top:4px;">📷 Image Selected</span>
                    </div>
                `;
    } else if (noteAttachmentType === 'voice') {
        contentEl.innerHTML = `
                    <div style="display:flex; align-items:center; gap:8px; width: 100%; max-width: calc(100% - 30px); flex-wrap: wrap;">
                        <span style="font-size:1.25rem;">🎤</span>
                        <audio src="${noteAttachmentData}" controls style="height:36px; max-width:100%;"></audio>
                        <span style="font-size:0.75rem; color:var(--text-muted); white-space:nowrap;">Voice note attached</span>
                    </div>
                `;
    }
}

function clearNoteAttachment() {
    noteAttachmentType = null;
    noteAttachmentData = null;
    document.getElementById('note-attachment-preview').style.display = 'none';
    document.getElementById('note-preview-content').innerHTML = '';
    document.getElementById('note-image-input').value = '';

    const recordBtn = document.getElementById('note-btn-record-voice');
    if (recordBtn) {
        recordBtn.innerHTML = '🎤 Record Voice Note';
        recordBtn.style.borderColor = 'var(--border-color)';
        recordBtn.style.color = 'var(--text-main)';
    }
    const recordUI = document.getElementById('note-voice-recording-ui');
    if (recordUI) recordUI.style.display = 'none';

    if (noteRecordingTimer) {
        clearInterval(noteRecordingTimer);
        noteRecordingTimer = null;
    }
}

// Reply Attachments state
let replyAttachmentTypes = {}; // noteId -> 'image' | 'voice'
let replyAttachmentDatas = {}; // noteId -> base64
let replyMediaRecorders = {}; // noteId -> MediaRecorder
let replyAudioChunks = {}; // noteId -> array
let replyRecordingTimers = {}; // noteId -> intervalId
let replyRecordingDurations = {}; // noteId -> int
let replyRecordersShouldSave = {}; // noteId -> bool

function triggerReplyImageUpload(noteId, source) {
    if (replyMediaRecorders[noteId] && replyMediaRecorders[noteId].state === 'recording') {
        stopReplyVoiceRecording(noteId, false);
    }

    const inputId = source === 'camera' ? 'reply-camera-input-global' : 'reply-image-input-global';
    const fileInput = document.getElementById(inputId);
    if (!fileInput) return;

    fileInput.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        compressImage(file, (base64Img) => {
            replyAttachmentTypes[noteId] = 'image';
            replyAttachmentDatas[noteId] = base64Img;
            updateReplyAttachmentPreview(noteId);
        });
    };

    fileInput.click();
}

function toggleReplyVoiceRecording(noteId) {
    if (replyMediaRecorders[noteId] && replyMediaRecorders[noteId].state === 'recording') {
        stopReplyVoiceRecording(noteId, true);
        return;
    }

    clearReplyAttachment(noteId);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Microphone recording is not supported in this browser or environment.");
        return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            replyAudioChunks[noteId] = [];
            let options = { mimeType: 'audio/webm' };
            if (!MediaRecorder.isTypeSupported('audio/webm')) {
                options = { mimeType: 'audio/ogg' };
            }
            if (!MediaRecorder.isTypeSupported('audio/ogg')) {
                options = {};
            }

            try {
                replyMediaRecorders[noteId] = new MediaRecorder(stream, options);
            } catch (e) {
                replyMediaRecorders[noteId] = new MediaRecorder(stream);
            }

            replyMediaRecorders[noteId].ondataavailable = e => {
                if (e.data && e.data.size > 0) {
                    replyAudioChunks[noteId].push(e.data);
                }
            };

            replyMediaRecorders[noteId].onstop = () => {
                stream.getTracks().forEach(track => track.stop());

                if (replyRecordersShouldSave[noteId] && replyAudioChunks[noteId].length > 0) {
                    const audioBlob = new Blob(replyAudioChunks[noteId], { type: replyMediaRecorders[noteId].mimeType || 'audio/octet-stream' });
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = () => {
                        replyAttachmentTypes[noteId] = 'voice';
                        replyAttachmentDatas[noteId] = reader.result;
                        updateReplyAttachmentPreview(noteId);
                    };
                }
            };

            replyRecordersShouldSave[noteId] = false;
            replyMediaRecorders[noteId].start();

            document.getElementById(`reply-voice-ui-${noteId}`).style.display = 'flex';
            const recordBtn = document.getElementById(`reply-btn-voice-${noteId}`);
            if (recordBtn) {
                recordBtn.innerHTML = '🛑 Stop';
                recordBtn.style.borderColor = 'var(--danger)';
                recordBtn.style.color = 'var(--danger)';
            }

            replyRecordingDurations[noteId] = 0;
            document.getElementById(`reply-timer-${noteId}`).innerText = '0:00';
            clearInterval(replyRecordingTimers[noteId]);
            replyRecordingTimers[noteId] = setInterval(() => {
                replyRecordingDurations[noteId]++;
                const mins = Math.floor(replyRecordingDurations[noteId] / 60);
                const secs = replyRecordingDurations[noteId] % 60;
                document.getElementById(`reply-timer-${noteId}`).innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

                if (replyRecordingDurations[noteId] >= 120) {
                    stopReplyVoiceRecording(noteId, true);
                }
            }, 1000);
        })
        .catch(err => {
            console.error("Microphone access error:", err);
            if (typeof AndroidInterface !== 'undefined') {
                document.getElementById('apk-permission-modal').style.display = 'flex';
            } else {
                alert("Unable to access microphone. Please make sure that your phone's browser or the Burgeroov App has Microphone permissions enabled in your phone's Settings 🎤");
            }
        });
}

function stopReplyVoiceRecording(noteId, save) {
    if (!replyMediaRecorders[noteId] || replyMediaRecorders[noteId].state !== 'recording') return;

    replyRecordersShouldSave[noteId] = save;
    replyMediaRecorders[noteId].stop();

    clearInterval(replyRecordingTimers[noteId]);
    replyRecordingTimers[noteId] = null;

    document.getElementById(`reply-voice-ui-${noteId}`).style.display = 'none';
    const recordBtn = document.getElementById(`reply-btn-voice-${noteId}`);
    if (recordBtn) {
        recordBtn.innerHTML = '🎤 Voice';
        recordBtn.style.borderColor = 'var(--border-color)';
        recordBtn.style.color = 'var(--text-main)';
    }
}

function updateReplyAttachmentPreview(noteId) {
    const previewEl = document.getElementById(`reply-preview-${noteId}`);
    const contentEl = document.getElementById(`reply-preview-content-${noteId}`);
    if (!previewEl || !contentEl) return;

    previewEl.style.display = 'block';
    contentEl.innerHTML = '';

    const type = replyAttachmentTypes[noteId];
    const data = replyAttachmentDatas[noteId];

    if (type === 'image') {
        contentEl.innerHTML = `
                    <div style="position:relative; display:inline-block; max-width: 100%;">
                        <img src="${data}" style="max-height:80px; max-width:100%; border-radius:6px; border:1px solid var(--border-color);" alt="Reply preview">
                        <span style="display:block; font-size:0.7rem; color:var(--text-muted); margin-top:2px;">📷 Image Selected</span>
                    </div>
                `;
    } else if (type === 'voice') {
        contentEl.innerHTML = `
                    <div style="display:flex; align-items:center; gap:6px; width: 100%; max-width: calc(100% - 24px); flex-wrap: wrap;">
                        <span style="font-size:1.1rem;">🎤</span>
                        <audio src="${data}" controls style="height:32px; max-width:100%;"></audio>
                    </div>
                `;
    }
}

function clearReplyAttachment(noteId) {
    delete replyAttachmentTypes[noteId];
    delete replyAttachmentDatas[noteId];

    const previewEl = document.getElementById(`reply-preview-${noteId}`);
    if (previewEl) previewEl.style.display = 'none';
    const contentEl = document.getElementById(`reply-preview-content-${noteId}`);
    if (contentEl) contentEl.innerHTML = '';

    const recordBtn = document.getElementById(`reply-btn-voice-${noteId}`);
    if (recordBtn) {
        recordBtn.innerHTML = '🎤 Voice';
        recordBtn.style.borderColor = 'var(--border-color)';
        recordBtn.style.color = 'var(--text-main)';
    }
    const recordUI = document.getElementById(`reply-voice-ui-${noteId}`);
    if (recordUI) recordUI.style.display = 'none';

    if (replyRecordingTimers[noteId]) {
        clearInterval(replyRecordingTimers[noteId]);
        delete replyRecordingTimers[noteId];
    }
}

function postManagerNote() {
    const text = document.getElementById('manage-note-text').value.trim();
    if (!text && !noteAttachmentData) return alert("Write a note or add a media attachment first.");

    const privacy = document.querySelector('input[name="note-privacy"]:checked').value;
    let targets = [];

    if (privacy === 'private') {
        const checkboxes = document.querySelectorAll('.private-target-cb:checked');
        checkboxes.forEach(cb => targets.push(cb.value));
    }

    const activeWorker = typeof getActiveWorker === 'function' ? getActiveWorker() : null;
    const worker = (getCompanyData().workers || []).find(w => w.email && currentUser && currentUser.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
    const authorDisplayName = worker ? worker.name : (activeWorker ? activeWorker.name : (currentUser && currentUser.role === 'admin' ? (currentAppLang === 'ar' ? 'المدير' : 'Manager') : (currentUser ? currentUser.email : 'Unknown')));

    const nowMs = Date.now();
    const newNote = {
        id: nowMs.toString(),
        timestamp: nowMs,
        text: text,
        date: formatTimestamp(),
        author: currentUser ? currentUser.email : 'Unknown',
        authorName: authorDisplayName,
        isPrivate: privacy === 'private',
        targetWorkers: targets,
        replies: [],
        attachmentType: noteAttachmentType || null,
        attachmentData: noteAttachmentData || null
    };

    if (!getCompanyData().managerNotes) getCompanyData().managerNotes = [];
    getCompanyData().managerNotes.unshift(newNote);
    document.getElementById('manage-note-text').value = '';

    document.querySelectorAll('.private-target-cb').forEach(cb => cb.checked = false);
    clearNoteAttachment();

    // Targeted write to managerNotes
    db.ref('companies/' + currentCompany + '/managerNotes/' + newNote.id).set(newNote)
        .then(() => {
            if (typeof logActivity === 'function') {
                const targetNames = targets.map(tid => {
                    const w = getCompanyData().workers.find(wk => wk.id === tid);
                    return w ? w.name : tid;
                }).join(', ');
                const detailsStr = privacy === 'private' ? `private note to ${targetNames || 'No targets'}` : 'public note';
                logActivity('perf_note', targets[0] || 'all', targetNames || 'All Workers', `Posted a performance note: "${text}" (${detailsStr})`);
            }
        })
        .catch(error => {
            console.error("Error saving note:", error);
            alert("Failed to save note.");
        });
}


// --- AUTOMATIC IN-SCOPE WINDOW EXPORTS ---
if (typeof migrateMonthlyData === 'function') window.migrateMonthlyData = migrateMonthlyData;
if (typeof startGlobalTick === 'function') window.startGlobalTick = startGlobalTick;
if (typeof updateTaskTimers === 'function') window.updateTaskTimers = updateTaskTimers;
if (typeof updateViolationTimers === 'function') window.updateViolationTimers = updateViolationTimers;
if (typeof getDaysInMonth === 'function') window.getDaysInMonth = getDaysInMonth;
if (typeof runAutoLogger === 'function') window.runAutoLogger = runAutoLogger;
if (typeof getVisibleWorkers === 'function') window.getVisibleWorkers = getVisibleWorkers;
if (typeof renderManagersList === 'function') window.renderManagersList = renderManagersList;
if (typeof addManager === 'function') window.addManager = addManager;
if (typeof deleteManager === 'function') window.deleteManager = deleteManager;
if (typeof loadWorkerPerms === 'function') window.loadWorkerPerms = loadWorkerPerms;
if (typeof saveWorkerPerms === 'function') window.saveWorkerPerms = saveWorkerPerms;
if (typeof saveMonthlySales === 'function') window.saveMonthlySales = saveMonthlySales;
if (typeof triggerNoteImageUpload === 'function') window.triggerNoteImageUpload = triggerNoteImageUpload;
if (typeof handleNoteImageSelected === 'function') window.handleNoteImageSelected = handleNoteImageSelected;
if (typeof toggleVoiceRecording === 'function') window.toggleVoiceRecording = toggleVoiceRecording;
if (typeof stopVoiceRecording === 'function') window.stopVoiceRecording = stopVoiceRecording;
if (typeof updateNoteAttachmentPreview === 'function') window.updateNoteAttachmentPreview = updateNoteAttachmentPreview;
if (typeof clearNoteAttachment === 'function') window.clearNoteAttachment = clearNoteAttachment;
if (typeof triggerReplyImageUpload === 'function') window.triggerReplyImageUpload = triggerReplyImageUpload;
if (typeof toggleReplyVoiceRecording === 'function') window.toggleReplyVoiceRecording = toggleReplyVoiceRecording;
if (typeof stopReplyVoiceRecording === 'function') window.stopReplyVoiceRecording = stopReplyVoiceRecording;
if (typeof updateReplyAttachmentPreview === 'function') window.updateReplyAttachmentPreview = updateReplyAttachmentPreview;
if (typeof clearReplyAttachment === 'function') window.clearReplyAttachment = clearReplyAttachment;
if (typeof postManagerNote === 'function') window.postManagerNote = postManagerNote;
