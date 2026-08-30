/**
 * Manager notes board, attachments & advert banners
 */

function getNotesArray() {
    const raw = getCompanyData().managerNotes || {};
    if (Array.isArray(raw)) return raw;
    return Object.values(raw);
}

function deleteManagerNote(id) {
    const isAr = currentAppLang === 'ar';
    const notes = getNotesArray();
    const targetStr = String(id);
    const note = notes.find(n => n && String(n.id) === targetStr);
    if (!note) return;

    const isAdmin = currentUser && currentUser.role === 'admin';
    const isAuthor = currentUser && currentUser.email && note.author && (note.author.toLowerCase() === currentUser.email.toLowerCase());

    if (!isAdmin && !isAuthor) {
        alert(isAr ? 'لا تملك صلاحية حذف هذه الملاحظة.' : 'You do not have permission to delete this note.');
        return;
    }

    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا الموضوع بالكامل؟' : 'Delete this thread entirely?')) return;

    const data = getCompanyData();
    if (Array.isArray(data.managerNotes)) {
        data.managerNotes = data.managerNotes.filter(n => n && String(n.id) !== targetStr);
    } else if (data.managerNotes && typeof data.managerNotes === 'object') {
        delete data.managerNotes[id];
        delete data.managerNotes[targetStr];
    }

    // Render immediately so thread disappears instantly
    renderNotes();

    // Atomically overwrite managerNotes node in Firebase so it never re-appears
    db.ref('companies/' + currentCompany + '/managerNotes').set(data.managerNotes)
        .then(() => {
            if (typeof logActivity === 'function') {
                logActivity('perf_note', 'multiple', 'Workers', `Deleted performance note (ID: ${id})`);
            }
            renderNotes();
        })
        .catch(error => {
            console.error("Error deleting note:", error);
            alert(isAr ? "فشل حذف الموضوع." : "Failed to delete thread.");
            renderNotes();
        });
}
window.deleteManagerNote = deleteManagerNote;
window.editManagerNote = editManagerNote;

function editManagerNote(id) {
    const isAr = currentAppLang === 'ar';
    const notes = getNotesArray();
    const note = notes.find(n => n && n.id === id);
    if (!note) return;

    const isAuthor = currentUser && currentUser.email && note.author && (note.author.toLowerCase() === currentUser.email.toLowerCase());
    const isAdmin = currentUser && currentUser.role === 'admin';

    if (!isAuthor && !isAdmin) {
        alert(isAr ? 'لا يمكنك تعديل هذه الملاحظة.' : 'You do not have permission to edit this note.');
        return;
    }

    const modal = document.getElementById('edit-note-modal');
    const inputHidden = document.getElementById('edit-note-id-hidden');
    const textInput = document.getElementById('edit-note-text-input');

    if (modal && inputHidden && textInput) {
        inputHidden.value = id;
        textInput.value = note.text || '';
        modal.style.display = 'flex';
    } else {
        const newText = prompt(isAr ? 'تعديل الملاحظة:' : 'Edit note text:', note.text || '');
        if (newText === null) return;
        const trimmed = newText.trim();
        saveEditedManagerNoteDirect(id, trimmed);
    }
}

function closeEditNoteModal() {
    const modal = document.getElementById('edit-note-modal');
    if (modal) modal.style.display = 'none';
}

function saveEditedManagerNote() {
    const isAr = currentAppLang === 'ar';
    const inputHidden = document.getElementById('edit-note-id-hidden');
    const textInput = document.getElementById('edit-note-text-input');
    if (!inputHidden || !textInput) return;

    const id = inputHidden.value;
    const trimmed = textInput.value.trim();

    const notes = getNotesArray();
    const note = notes.find(n => n && n.id === id);

    if (!trimmed && note && !note.attachmentData) {
        alert(isAr ? 'لا يمكن ترك الملاحظة فارغة.' : 'Note content cannot be empty.');
        return;
    }

    saveEditedManagerNoteDirect(id, trimmed);
}

function saveEditedManagerNoteDirect(id, trimmedText) {
    const isAr = currentAppLang === 'ar';
    const now = Date.now();
    const targetStr = String(id);
    const data = getCompanyData();
    const notes = getNotesArray();

    // 1. Update memory notes array
    const note = notes.find(n => n && String(n.id) === targetStr);
    if (note) {
        note.text = trimmedText;
        note.editedAt = now;
    }

    if (Array.isArray(data.managerNotes)) {
        const targetNote = data.managerNotes.find(n => n && String(n.id) === targetStr);
        if (targetNote) {
            targetNote.text = trimmedText;
            targetNote.editedAt = now;
        }
    } else if (data.managerNotes && typeof data.managerNotes === 'object') {
        if (data.managerNotes[id]) {
            data.managerNotes[id].text = trimmedText;
            data.managerNotes[id].editedAt = now;
        }
        if (data.managerNotes[targetStr]) {
            data.managerNotes[targetStr].text = trimmedText;
            data.managerNotes[targetStr].editedAt = now;
        }
    }

    closeEditNoteModal();
    renderNotes();

    // 2. Persist to Firebase RTDB
    db.ref(`companies/${currentCompany}/managerNotes/${id}`).update({
        text: trimmedText,
        editedAt: now
    }).then(() => {
        renderNotes();
    }).catch(err => {
        console.error("Error editing note:", err);
        // Fallback: full node set
        db.ref(`companies/${currentCompany}/managerNotes`).set(data.managerNotes)
            .then(() => renderNotes());
    });
}

window.closeEditNoteModal = closeEditNoteModal;
window.saveEditedManagerNote = saveEditedManagerNote;

function addNoteReply(noteId) {
    const input = document.getElementById(`reply-input-${noteId}`);
    if (!input) return;
    const text = input.value.trim();
    const type = replyAttachmentTypes[noteId] || null;
    const data = replyAttachmentDatas[noteId] || null;

    if (!text && !data) return;

    const notes = getNotesArray();
    const note = notes.find(n => n && n.id === noteId);
    if (note) {
        if (!note.replies || Array.isArray(note.replies)) {
            const obj = {};
            if (note.replies && Array.isArray(note.replies)) {
                note.replies.forEach((r, idx) => {
                    obj[idx.toString()] = r;
                });
            }
            note.replies = obj;
        }

        const activeWorker = typeof getActiveWorker === 'function' ? getActiveWorker() : null;
        const worker = (getCompanyData().workers || []).find(w => w.email && currentUser && currentUser.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
        const authorDisplayName = worker ? worker.name : (activeWorker ? activeWorker.name : (currentUser && currentUser.role === 'admin' ? (currentAppLang === 'ar' ? 'المدير' : 'Manager') : (currentUser ? currentUser.email : 'Unknown')));

        const replyId = Date.now().toString();
        const newReply = {
            author: currentUser ? currentUser.email : 'Unknown',
            authorName: authorDisplayName,
            text: text,
            date: formatTimestamp(),
            attachmentType: type,
            attachmentData: data
        };
        note.replies[replyId] = newReply;

        input.value = '';
        clearReplyAttachment(noteId);

        // Targeted write to replies subnode using the unique key
        db.ref('companies/' + currentCompany + '/managerNotes/' + noteId + '/replies/' + replyId).set(newReply)
            .then(() => {
                renderNotes();
            })
            .catch(error => {
                console.error("Error saving reply:", error);
                alert("Failed to save reply.");
            });
    }
}

function deleteNoteReply(noteId, replyKey) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? "هل أنت متأكد من حذف هذا الرد؟" : "Are you sure you want to delete this reply?")) return;
    const notes = getNotesArray();
    const note = notes.find(n => n && n.id === noteId);
    if (note && note.replies && note.replies[replyKey]) {
        const r = note.replies[replyKey];
        const isAdmin = currentUser && currentUser.role === 'admin';
        const isAuthor = currentUser && currentUser.email && r.author && (r.author.toLowerCase() === currentUser.email.toLowerCase());
        if (!isAdmin && !isAuthor) {
            alert(isAr ? "لا تملك صلاحية حذف هذا الرد." : "You don't have permission to delete this reply.");
            return;
        }

        delete note.replies[replyKey];

        // Targeted write to remove from Firebase
        db.ref(`companies/${currentCompany}/managerNotes/${noteId}/replies/${replyKey}`).remove()
            .then(() => {
                renderNotes();
            })
            .catch(err => {
                console.error("Error deleting reply:", err);
                alert("Failed to delete reply.");
            });
    }
}
window.deleteNoteReply = deleteNoteReply;
window.addNoteReply = addNoteReply;

function renderNotes() {
    if (currentTab !== 'notes') return;
    const isAr = currentAppLang === 'ar';

    const cbContainer = document.getElementById('private-worker-checkboxes');
    if (cbContainer) {
        cbContainer.innerHTML = '';
        (getCompanyData().workers || []).forEach(w => {
            cbContainer.innerHTML += `
                        <label style="display:flex; align-items:center; gap:6px; cursor:pointer; text-transform:none; margin:0; font-size:0.9rem; background:var(--input-bg); padding:8px; border-radius:6px; border:1px solid var(--border-color);">
                            <input type="checkbox" class="private-target-cb" value="${w.id}"> ${w.name} <span style="font-size:0.75rem; color:var(--text-muted); padding-left:4px;">(${w.role})</span>
                        </label>
                    `;
        });
    }

    const feed = document.getElementById('manage-notes-feed');
    if (!feed) return;
    feed.innerHTML = '';
    const allNotes = getNotesArray();

    const visibleNotes = allNotes.filter(n => {
        if (currentUser.role === 'admin') return true;
        if (!n.isPrivate) return true;
        const myWorkerProfile = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
        return myWorkerProfile && n.targetWorkers && n.targetWorkers.includes(myWorkerProfile.id);
    });

    if (visibleNotes.length === 0) {
        feed.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding: 40px; font-size: 1.1rem;">No notes available.</p>';
    }

    visibleNotes.forEach(n => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.cssText = `border-left: ${n.isPrivate ? '6px solid var(--danger)' : '6px solid var(--info)'}; padding: 20px; margin-bottom:15px; border-radius: 12px;`;

        const now = Date.now();
        const noteTime = n.timestamp || parseInt(n.id) || 0;
        const ageMs = now - noteTime;
        const isWithin2Mins = ageMs <= 2 * 60 * 1000;
        const isAuthor = currentUser && currentUser.email && n.author && (n.author.toLowerCase() === currentUser.email.toLowerCase());
        const isAdmin = currentUser && currentUser.role === 'admin';

        const authorWorker = (getCompanyData().workers || []).find(w => w.email && n.author && w.email.toLowerCase() === n.author.toLowerCase());
        const authorDisplayName = n.authorName || (authorWorker ? authorWorker.name : n.author || (isAr ? 'المدير' : 'Manager'));
        const authorBadge = `<span style="font-size:0.85rem; font-weight:700; color:var(--text-main); display:inline-flex; align-items:center; gap:4px; background:var(--input-bg); padding:3px 10px; border-radius:6px; border:1px solid var(--border-color);" title="${isAr ? 'كاتب الملاحظة' : 'Author'}">👤 ${authorDisplayName}</span>`;

        let editBtn = '';
        if (isAuthor || isAdmin) {
            editBtn = `<button onclick="editManagerNote('${n.id}')" class="btn-outline" style="padding:2px 8px; font-size:0.75rem; border-radius:4px; border:1px solid var(--primary); color:var(--primary); font-weight:600; cursor:pointer; margin-left:6px;" title="${isAr ? 'تعديل الملاحظة' : 'Edit note'}">✏️ ${isAr ? 'تعديل' : 'Edit'}</button>`;
        }

        let convertBtn = n.text ? `<button type="button" onclick="convertNoteToTask('${encodeURIComponent(n.text.replace(/'/g, "\\'"))}')" class="btn-outline" style="padding:2px 8px; font-size:0.75rem; border-radius:4px; border:1px solid var(--secondary); color:var(--secondary); font-weight:600; cursor:pointer; margin-left:6px;" title="${isAr ? 'تحويل إلى مهمة' : 'Convert to Task'}">📋 ${isAr ? 'تحويل إلى مهمة' : 'Convert to Task'}</button>` : '';

        let delBtn = (isAdmin || isAuthor) ? `<button onclick="deleteManagerNote('${n.id}')" class="btn-outline-danger" style="padding:4px 10px; font-size:0.8rem; border:none; text-decoration:underline; cursor:pointer;" title="${isAr ? 'حذف الملاحظة' : 'Delete note'}">${isAr ? 'حذف' : 'Delete Thread'}</button>` : '';
        let lockIcon = n.isPrivate ? `<span class="badge" style="background:var(--danger); font-size:0.85rem;">🔒 Private Note</span>` : `<span class="badge" style="background:var(--info); font-size:0.85rem;">📢 Public Announcement</span>`;

        let repliesHtml = '';
        const replies = n.replies ? Object.entries(n.replies) : [];
        if (replies.length > 0) {
            repliesHtml = replies.map(([replyKey, r]) => {
                let replyTextHtml = r.text ? `<div style="color:var(--text-main); font-size:0.95rem;">${r.text}</div>` : '';
                let replyAttachmentHtml = '';
                if (r.attachmentType === 'image' && r.attachmentData) {
                    replyAttachmentHtml = `
                                <div style="margin-top: 8px; max-width: 150px; cursor: pointer; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color);" onclick="showImage('${r.attachmentData.replace(/'/g, "\\'")}')">
                                    <img src="${r.attachmentData}" alt="Reply attachment" style="width: 100%; display: block; height: auto;">
                                </div>
                            `;
                } else if (r.attachmentType === 'voice' && r.attachmentData) {
                    replyAttachmentHtml = `
                                <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px; background: var(--input-bg); padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border-color); max-width: 250px;">
                                    <span style="font-size: 1.1rem; line-height: 1;">🎤</span>
                                    <audio src="${r.attachmentData}" controls style="flex: 1; height: 28px; max-width: calc(100% - 20px);"></audio>
                                </div>
                            `;
                }

                let deleteReplyBtn = '';
                if (currentUser && (r.author === currentUser.email || currentUser.role === 'admin')) {
                    deleteReplyBtn = `<button onclick="deleteNoteReply('${n.id}', '${replyKey}')" class="btn-outline-danger" style="border:none; background:none; text-decoration:underline; font-size:0.75rem; padding:0 0 0 8px; cursor:pointer;">Delete</button>`;
                }

                const replyAuthorWorker = (getCompanyData().workers || []).find(w => w.email && r.author && w.email.toLowerCase() === r.author.toLowerCase());
                const replyAuthorName = r.authorName || (replyAuthorWorker ? replyAuthorWorker.name : r.author);

                return `
                            <div style="background: var(--bg-color); padding: 12px 16px; border-radius: 8px; margin-top: 10px; border-left: 3px solid var(--border-color);">
                                <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-muted); margin-bottom:6px;">
                                    <strong>👤 ${replyAuthorName}</strong> <span>🕒 ${r.date}${deleteReplyBtn}</span>
                                </div>
                                ${replyTextHtml}
                                ${replyAttachmentHtml}
                            </div>
                        `;
            }).join('');
        }

        let replyBox = !n.isPrivate ? `
                    <div style="margin-top:16px; border-top:1px dashed var(--border-color); padding-top:16px;">
                        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                            <input type="text" id="reply-input-${n.id}" placeholder="Write a reply..." style="flex:1; min-width: 150px; padding: 10px; font-size:0.9rem; margin: 0;">
                            
                            <div style="display:flex; gap:6px;">
                                <button type="button" class="btn-outline" style="padding: 8px 10px; min-height:36px; height:36px; font-size: 0.8rem; border-radius: 6px; display:flex; align-items:center; gap:4px; border:1px solid var(--border-color); background:var(--card-bg); color:var(--text-main); cursor:pointer;" onclick="triggerReplyImageUpload('${n.id}', 'camera')" title="Take Photo">
                                    📷 Camera
                                </button>
                                <button type="button" class="btn-outline" style="padding: 8px 10px; min-height:36px; height:36px; font-size: 0.8rem; border-radius: 6px; display:flex; align-items:center; gap:4px; border:1px solid var(--border-color); background:var(--card-bg); color:var(--text-main); cursor:pointer;" onclick="triggerReplyImageUpload('${n.id}', 'gallery')" title="Choose Photo">
                                    🖼️ Gallery
                                </button>
                                <button type="button" id="reply-btn-voice-${n.id}" class="btn-outline" style="padding: 8px 10px; min-height:36px; height:36px; font-size: 0.8rem; border-radius: 6px; display:flex; align-items:center; gap:4px; border:1px solid var(--border-color); background:var(--card-bg); color:var(--text-main); cursor:pointer;" onclick="toggleReplyVoiceRecording('${n.id}')" title="Record Voice">
                                    🎤 Voice
                                </button>
                            </div>
                            
                            <button onclick="addNoteReply('${n.id}')" class="btn-info" style="padding: 8px 14px; min-height:36px; height:36px; font-size: 0.85rem; border-radius: 6px;">Reply</button>
                        </div>
                        
                        <!-- Voice Recording UI (collapsible) -->
                        <div id="reply-voice-ui-${n.id}" style="display:none; align-items:center; gap:8px; margin-top:8px; background:var(--input-bg); padding:6px 10px; border-radius:6px; border:1px solid var(--border-color); font-size:0.85rem;">
                            <span class="recording-pulse" style="display:inline-block; width:8px; height:8px; background-color:#dc2626; border-radius:50%;"></span>
                            <span id="reply-timer-${n.id}" style="font-family:monospace; font-weight:600;">0:00</span>
                            <button type="button" class="btn-success" style="padding:3px 8px; font-size:0.75rem; min-height:24px; height:24px; line-height:1; cursor:pointer;" onclick="stopReplyVoiceRecording('${n.id}', true)">Done</button>
                            <button type="button" class="btn-outline-danger" style="padding:3px 8px; font-size:0.75rem; min-height:24px; height:24px; line-height:1; border:1px solid var(--danger); background:transparent; color:var(--danger); border-radius:4px; cursor:pointer;" onclick="stopReplyVoiceRecording('${n.id}', false)">Cancel</button>
                        </div>
                        
                        <!-- Attachment Preview -->
                        <div id="reply-preview-${n.id}" style="display:none; margin-top:8px; padding:8px; background:var(--input-bg); border-radius:6px; border:1px solid var(--border-color); position:relative;">
                            <div id="reply-preview-content-${n.id}"></div>
                            <button type="button" onclick="clearReplyAttachment('${n.id}')" style="position:absolute; top:6px; right:6px; background:var(--danger); color:white; border:none; border-radius:50%; width:18px; height:18px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; font-size:0.75rem; line-height:1;">✕</button>
                        </div>
                    </div>
                ` : '';

        const canEditNote = isAuthor || isAdmin;
        let textHtml = n.text ? `<div ${canEditNote ? `ondblclick="editManagerNote('${n.id}')" title="${isAr ? 'انقر مرتين لتعديل الملاحظة' : 'Double-click to edit note'}" style="font-size:1.1rem; color:var(--text-main); white-space: pre-wrap; line-height: 1.6; margin-bottom: 16px; cursor:pointer;"` : 'style="font-size:1.1rem; color:var(--text-main); white-space: pre-wrap; line-height: 1.6; margin-bottom: 16px;"'}>${n.text}</div>` : '';
        let attachmentHtml = '';
        if (n.attachmentType === 'image' && n.attachmentData) {
            attachmentHtml = `
                        <div style="margin-bottom: 16px; max-width: 320px; cursor: pointer; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);" onclick="showImage('${n.attachmentData.replace(/'/g, "\\'")}')">
                            <img src="${n.attachmentData}" alt="Attachment" style="width: 100%; display: block; height: auto; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                        </div>
                    `;
        } else if (n.attachmentType === 'voice' && n.attachmentData) {
            attachmentHtml = `
                        <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px; background: var(--input-bg); padding: 12px 16px; border-radius: 10px; border: 1px solid var(--border-color); max-width: 360px; box-sizing: border-box;">
                            <span style="font-size: 1.4rem; line-height: 1;">🎤</span>
                            <audio src="${n.attachmentData}" controls style="flex: 1; height: 36px; max-width: calc(100% - 30px);"></audio>
                        </div>
                    `;
        }

        div.innerHTML = `
                    <div class="flex-between" style="margin-bottom:12px; flex-wrap:wrap; gap:8px;">
                        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                            ${authorBadge} ${lockIcon} <span style="font-size:0.85rem; color:var(--text-muted);">🕒 ${n.date}</span>
                            ${editBtn} ${convertBtn}
                        </div>
                        ${delBtn}
                    </div>
                    ${textHtml}
                    ${attachmentHtml}
                    ${repliesHtml}
                    ${replyBox}
                `;
        feed.appendChild(div);
    });
}


// --- AUTOMATIC IN-SCOPE WINDOW EXPORTS ---
if (typeof getNotesArray === 'function') window.getNotesArray = getNotesArray;
if (typeof renderNotes === 'function') window.renderNotes = renderNotes;


// =========================================================
// STAFF ANNOUNCEMENTS, TEMPLATES & POP-UP BROADCAST SYSTEM
// =========================================================

let currentAnnouncementUploadedImage = null;
let currentEditingTemplateId = null;

/**
 * Handle Image Upload for Announcement (with automatic downscaling for storage efficiency)
 */
function handleAnnouncementImageUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Compress/downscale to max 1000px width/height for fast loading & minimal RTDB footprint
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 1000;

            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            currentAnnouncementUploadedImage = compressedDataUrl;

            // Show preview
            const previewContainer = document.getElementById('ann-img-preview-container');
            const previewImg = document.getElementById('ann-img-preview');
            if (previewContainer && previewImg) {
                previewImg.src = compressedDataUrl;
                previewContainer.style.display = 'block';
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}
window.handleAnnouncementImageUpload = handleAnnouncementImageUpload;

/**
 * Remove attached image from form
 */
function removeAnnouncementImage() {
    currentAnnouncementUploadedImage = null;
    const fileInput = document.getElementById('ann-file-input');
    if (fileInput) fileInput.value = '';
    const previewContainer = document.getElementById('ann-img-preview-container');
    const previewImg = document.getElementById('ann-img-preview');
    if (previewContainer) previewContainer.style.display = 'none';
    if (previewImg) previewImg.src = '';
}
window.removeAnnouncementImage = removeAnnouncementImage;

/**
 * Format executive author name cleanly (never showing full email, extracts first name like "Kinan")
 */
function formatExecutiveAuthorName(raw) {
    if (!raw) return 'Kinan';
    let str = String(raw).trim();
    if (str.includes('@')) {
        str = str.split('@')[0];
    }
    if (str.includes('.')) {
        str = str.split('.')[0];
    }
    if (str.includes('_')) {
        str = str.split('_')[0];
    }
    str = str.trim();
    if (!str || str.toLowerCase() === 'admin' || str === 'المدير' || str.toLowerCase() === 'manager') return 'Kinan';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
window.formatExecutiveAuthorName = formatExecutiveAuthorName;

/**
 * Save / Update Announcement Template
 */
function handleSaveAnnouncementTemplate(event) {
    if (event) event.preventDefault();
    const titleInput = document.getElementById('ann-input-title');
    const textInput = document.getElementById('ann-input-text');
    const hiddenId = document.getElementById('ann-template-id-hidden');

    const title = String(titleInput ? titleInput.value : '').trim();
    const text = String(textInput ? textInput.value : '').trim();
    const isEditing = hiddenId && hiddenId.value;
    const templateId = isEditing ? hiddenId.value : ('tpl_' + Date.now());

    if (!title || !text) {
        alert(currentAppLang === 'ar' ? 'يرجى كتابة عنوان ونص الإعلان.' : 'Please enter announcement title and text.');
        return;
    }

    const isAr = currentAppLang === 'ar';
    const authorName = formatExecutiveAuthorName((currentUser && currentUser.name) || (currentUser && currentUser.email));

    const templateData = {
        id: templateId,
        title: title,
        text: text,
        imageUrl: currentAnnouncementUploadedImage || null,
        updatedAt: Date.now(),
        updatedBy: authorName
    };

    if (!isEditing) {
        templateData.createdAt = Date.now();
        templateData.createdBy = authorName;
    }

    // Save to Firebase RTDB
    db.ref(`companies/${currentCompany}/announcementTemplates/${templateId}`).set(templateData)
        .then(() => {
            // Update local memory
            const data = getCompanyData();
            if (!data.announcementTemplates) data.announcementTemplates = {};
            data.announcementTemplates[templateId] = templateData;

            cancelAnnouncementEdit();
            renderAnnouncementTemplates();
        })
        .catch(err => {
            console.error('Error saving announcement template:', err);
            alert(isAr ? 'حدث خطأ أثناء حفظ القالب.' : 'Error saving announcement template.');
        });
}
window.handleSaveAnnouncementTemplate = handleSaveAnnouncementTemplate;

/**
 * Edit an existing announcement template
 */
function editAnnouncementTemplate(templateId) {
    const data = getCompanyData();
    const templates = data.announcementTemplates || {};
    const tpl = templates[templateId];
    if (!tpl) return;

    currentEditingTemplateId = templateId;
    const isAr = currentAppLang === 'ar';

    const heading = document.getElementById('ann-form-heading');
    const cancelBtn = document.getElementById('ann-cancel-edit-btn');
    const hiddenId = document.getElementById('ann-template-id-hidden');
    const titleInput = document.getElementById('ann-input-title');
    const textInput = document.getElementById('ann-input-text');
    const saveBtnText = document.getElementById('ann-save-btn-text');

    if (heading) heading.innerHTML = `<span>✏️</span> <span>${isAr ? 'تعديل قالب الإعلان' : 'Edit Announcement Template'}</span>`;
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
    if (hiddenId) hiddenId.value = templateId;
    if (titleInput) titleInput.value = tpl.title || '';
    if (textInput) textInput.value = tpl.text || '';
    if (saveBtnText) saveBtnText.textContent = isAr ? 'حفظ التعديلات' : 'Save Changes';

    if (tpl.imageUrl) {
        currentAnnouncementUploadedImage = tpl.imageUrl;
        const previewContainer = document.getElementById('ann-img-preview-container');
        const previewImg = document.getElementById('ann-img-preview');
        if (previewContainer && previewImg) {
            previewImg.src = tpl.imageUrl;
            previewContainer.style.display = 'block';
        }
    } else {
        removeAnnouncementImage();
    }

    const formElem = document.getElementById('form-announcement-template');
    if (formElem) formElem.scrollIntoView({ behavior: 'smooth' });
}
window.editAnnouncementTemplate = editAnnouncementTemplate;

/**
 * Cancel editing template
 */
function cancelAnnouncementEdit() {
    currentEditingTemplateId = null;
    const isAr = currentAppLang === 'ar';

    const heading = document.getElementById('ann-form-heading');
    const cancelBtn = document.getElementById('ann-cancel-edit-btn');
    const hiddenId = document.getElementById('ann-template-id-hidden');
    const titleInput = document.getElementById('ann-input-title');
    const textInput = document.getElementById('ann-input-text');
    const saveBtnText = document.getElementById('ann-save-btn-text');

    if (heading) heading.innerHTML = `<span>➕</span> <span>${isAr ? 'إنشاء قالب إعلان جديد' : 'Create Announcement Template'}</span>`;
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (hiddenId) hiddenId.value = '';
    if (titleInput) titleInput.value = '';
    if (textInput) textInput.value = '';
    if (saveBtnText) saveBtnText.textContent = isAr ? 'حفظ قالب الإعلان' : 'Save Announcement Template';

    removeAnnouncementImage();
}
window.cancelAnnouncementEdit = cancelAnnouncementEdit;

/**
 * Delete announcement template
 */
function deleteAnnouncementTemplate(templateId) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا القالب؟' : 'Are you sure you want to delete this template?')) return;

    db.ref(`companies/${currentCompany}/announcementTemplates/${templateId}`).remove()
        .then(() => {
            const data = getCompanyData();
            if (data.announcementTemplates && data.announcementTemplates[templateId]) {
                delete data.announcementTemplates[templateId];
            }
            if (currentEditingTemplateId === templateId) {
                cancelAnnouncementEdit();
            }
            renderAnnouncementTemplates();
        })
        .catch(err => {
            console.error('Error deleting template:', err);
            alert(isAr ? 'فشل حذف القالب.' : 'Failed to delete template.');
        });
}
window.deleteAnnouncementTemplate = deleteAnnouncementTemplate;

/**
 * Publish announcement template to ALL workers
 */
function publishAnnouncementToAll(templateId) {
    const isAr = currentAppLang === 'ar';
    const data = getCompanyData();
    const templates = data.announcementTemplates || {};
    const tpl = templates[templateId];
    if (!tpl) return;

    if (!confirm(isAr ? `هل تريد نشر الإعلان "${tpl.title}" لجميع الموظفين بشكل إلزامي وفوري؟` : `Publish announcement "${tpl.title}" to ALL staff as mandatory pop-up?`)) return;

    const authorName = formatExecutiveAuthorName((currentUser && currentUser.name) || (currentUser && currentUser.email));
    const activeAnnId = 'ann_' + Date.now();

    const activeAnnData = {
        id: activeAnnId,
        templateId: templateId,
        title: tpl.title,
        text: tpl.text,
        imageUrl: tpl.imageUrl || null,
        publishedAt: Date.now(),
        publishedBy: authorName,
        target: 'all',
        viewers: {}
    };

    // Atomically set activeAnnouncement in Firebase (replaces any previous active broadcast)
    db.ref(`companies/${currentCompany}/activeAnnouncement`).set(activeAnnData)
        .then(() => {
            data.activeAnnouncement = activeAnnData;
            renderActiveAnnouncementHUD();
            renderAnnouncementTemplates();
            alert(isAr ? '🚀 تم نشر الإعلان لجميع الموظفين بنجاح! سيظهر تلقائياً كشاشة إلزامية عند فتح التطبيق.' : '🚀 Announcement published to all workers successfully!');
        })
        .catch(err => {
            console.error('Error publishing announcement:', err);
            alert(isAr ? 'فشل نشر الإعلان.' : 'Failed to publish announcement.');
        });
}
window.publishAnnouncementToAll = publishAnnouncementToAll;

/**
 * Open Target Workers Selection Modal for specific publishing
 */
function openTargetWorkersModal(templateId) {
    const isAr = currentAppLang === 'ar';
    const data = getCompanyData();
    const templates = data.announcementTemplates || {};
    const tpl = templates[templateId];
    if (!tpl) return;

    const modal = document.getElementById('modal-announcement-target-workers');
    const inputHidden = document.getElementById('target-publish-template-id');
    const container = document.getElementById('target-workers-checkboxes-container');
    if (!modal || !inputHidden || !container) return;

    inputHidden.value = templateId;
    container.innerHTML = '';

    const workers = data.workers || [];
    if (workers.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:10px;">${isAr ? 'لا يوجد موظفين مسجلين.' : 'No workers registered.'}</p>`;
    } else {
        workers.forEach(w => {
            const roleBadge = w.role ? `<span style="font-size:0.75rem; color:var(--text-muted); background:var(--card-bg); padding:2px 6px; border-radius:4px; border:1px solid var(--border-color);">${w.role}</span>` : '';
            container.innerHTML += `
                <label style="display:flex; align-items:center; justify-content:space-between; background:var(--card-bg); padding:10px 12px; border-radius:8px; border:1px solid var(--border-color); cursor:pointer; user-select:none;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <input type="checkbox" class="target-worker-cb" value="${w.id}" style="width:18px; height:18px; cursor:pointer;">
                        <span style="font-weight:700; font-size:0.88rem; color:var(--text-main);">👤 ${w.name || w.id}</span>
                    </div>
                    ${roleBadge}
                </label>
            `;
        });
    }

    modal.style.display = 'flex';
}
window.openTargetWorkersModal = openTargetWorkersModal;

function closeTargetWorkersModal() {
    const modal = document.getElementById('modal-announcement-target-workers');
    if (modal) modal.style.display = 'none';
}
window.closeTargetWorkersModal = closeTargetWorkersModal;

function toggleAllTargetWorkers(select) {
    document.querySelectorAll('.target-worker-cb').forEach(cb => cb.checked = !!select);
}
window.toggleAllTargetWorkers = toggleAllTargetWorkers;

/**
 * Confirm Publish to Specific Workers
 */
function confirmPublishSpecificWorkers() {
    const isAr = currentAppLang === 'ar';
    const inputHidden = document.getElementById('target-publish-template-id');
    const templateId = inputHidden ? inputHidden.value : '';
    const data = getCompanyData();
    const tpl = (data.announcementTemplates || {})[templateId];
    if (!tpl) return;

    const selectedWorkerIds = [];
    document.querySelectorAll('.target-worker-cb:checked').forEach(cb => {
        selectedWorkerIds.push(cb.value);
    });

    if (selectedWorkerIds.length === 0) {
        alert(isAr ? 'يرجى اختيار موظف واحد على الأقل.' : 'Please select at least one worker.');
        return;
    }

    const authorName = formatExecutiveAuthorName((currentUser && currentUser.name) || (currentUser && currentUser.email));
    const activeAnnId = 'ann_' + Date.now();

    const activeAnnData = {
        id: activeAnnId,
        templateId: templateId,
        title: tpl.title,
        text: tpl.text,
        imageUrl: tpl.imageUrl || null,
        publishedAt: Date.now(),
        publishedBy: authorName,
        target: selectedWorkerIds,
        viewers: {}
    };

    db.ref(`companies/${currentCompany}/activeAnnouncement`).set(activeAnnData)
        .then(() => {
            data.activeAnnouncement = activeAnnData;
            closeTargetWorkersModal();
            renderActiveAnnouncementHUD();
            renderAnnouncementTemplates();
            alert(isAr ? `🚀 تم نشر الإعلان لـ (${selectedWorkerIds.length}) موظفين محددين بنجاح!` : `🚀 Announcement published to ${selectedWorkerIds.length} workers successfully!`);
        })
        .catch(err => {
            console.error('Error publishing announcement:', err);
            alert(isAr ? 'فشل نشر الإعلان.' : 'Failed to publish announcement.');
        });
}
window.confirmPublishSpecificWorkers = confirmPublishSpecificWorkers;

/**
 * Deactivate / End live broadcast
 */
function deactivateActiveAnnouncement() {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? 'هل أنت متأكد من إنهاء وإيقاف البث النشط لهذا الإعلان؟' : 'End and deactivate this live announcement broadcast?')) return;

    db.ref(`companies/${currentCompany}/activeAnnouncement`).remove()
        .then(() => {
            const data = getCompanyData();
            delete data.activeAnnouncement;
            renderActiveAnnouncementHUD();
            renderAnnouncementTemplates();
        })
        .catch(err => {
            console.error('Error deactivating announcement:', err);
        });
}
window.deactivateActiveAnnouncement = deactivateActiveAnnouncement;

/**
 * Render Live Announcement HUD Banner Card
 */
function renderActiveAnnouncementHUD() {
    const hudContainer = document.getElementById('announcement-live-hud-card');
    if (!hudContainer) return;

    const isAr = currentAppLang === 'ar';
    const data = getCompanyData();
    const activeAnn = data.activeAnnouncement || (typeof appData !== 'undefined' && appData[currentCompany] && appData[currentCompany].activeAnnouncement);

    if (!activeAnn || !activeAnn.id) {
        hudContainer.innerHTML = `
            <div class="card" style="padding: 16px 20px; border: 1px dashed var(--border-color); background: var(--card-bg); display: flex; align-items: center; justify-content: space-between; border-radius: 12px; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.3rem;">ℹ️</span>
                    <div>
                        <div style="font-weight: 800; font-size: 0.92rem; color: var(--text-main);">${isAr ? 'لا يوجد إعلان نشط معروض حالياً' : 'No Active Announcement Currently Live'}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${isAr ? 'اختر أحد القوالب أدناه وانقر على "نشر للجميع" أو "تحديد موظف" لبدء البث الفوري.' : 'Select a template below and click "Publish" to start a mandatory pop-up broadcast.'}</div>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    const workers = data.workers || [];
    let totalTargetWorkers = 0;
    let targetLabel = '';

    if (activeAnn.target === 'all') {
        totalTargetWorkers = workers.length;
        targetLabel = isAr ? '📢 جميع الموظفين (All Staff)' : '📢 All Staff';
    } else if (Array.isArray(activeAnn.target)) {
        totalTargetWorkers = activeAnn.target.length;
        targetLabel = isAr ? `🎯 ${totalTargetWorkers} موظفين محددين` : `🎯 ${totalTargetWorkers} Specific Workers`;
    }

    const viewersMap = activeAnn.viewers || {};
    const viewedCount = Object.keys(viewersMap).length;
    const percentage = totalTargetWorkers > 0 ? Math.round((viewedCount / totalTargetWorkers) * 100) : 0;
    const pubDateStr = activeAnn.publishedAt ? new Date(activeAnn.publishedAt).toLocaleString('en-US', { timeZone: 'Asia/Riyadh', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '-';

    hudContainer.innerHTML = `
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border: 1px solid rgba(16,185,129,0.3); border-radius: 16px; padding: 22px 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); margin-bottom: 20px;">
            <!-- Header Status -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <span class="exec-pulse-dot"></span>
                    <span style="font-weight: 800; font-size: 0.92rem; color: #10b981;">📢 ${isAr ? 'إعلان نشط يبث حالياً' : 'Live Active Broadcast'}</span>
                    <span style="font-size: 0.78rem; font-weight: 700; color: #cbd5e1; background: rgba(255,255,255,0.06); padding: 3px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">${targetLabel}</span>
                </div>
                <div style="font-size: 0.78rem; color: #94a3b8; font-weight: 600;">
                    🕒 ${pubDateStr}
                </div>
            </div>

            <!-- Subject & Content Preview -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px; margin-bottom: 16px;">
                <div style="flex: 1; min-width: 280px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 1.25rem; font-weight: 800; color: #ffffff;">${activeAnn.title}</h3>
                    <p style="margin: 0; font-size: 0.92rem; color: #cbd5e1; line-height: 1.65; white-space: pre-wrap; word-break: break-word; max-height: 350px; overflow-y: auto;">${activeAnn.text}</p>
                </div>

                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button type="button" onclick="openAnnouncementReadershipModal()" class="btn-primary" style="padding: 8px 16px; border-radius: 10px; font-weight: 800; font-size: 0.84rem; background: linear-gradient(135deg, #3b82f6, #2563eb); border: none; color: white; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 3px 10px rgba(59,130,246,0.35);">
                        <span>👁️</span> <span>${isAr ? 'قائمة المشاهدات والاطلاع' : 'View Readership List'}</span>
                    </button>
                    <button type="button" onclick="deactivateActiveAnnouncement()" class="btn-outline-danger" style="padding: 8px 14px; border-radius: 10px; font-weight: 800; font-size: 0.84rem; border: 1px solid var(--danger); background: transparent; color: var(--danger); cursor: pointer; display: flex; align-items: center; gap: 6px;">
                        <span>🛑</span> <span>${isAr ? 'إنهاء البث' : 'End Broadcast'}</span>
                    </button>
                </div>
            </div>

            <!-- Readership Progress Bar -->
            <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 12px 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.84rem; font-weight: 700; color: #e2e8f0; margin-bottom: 6px;">
                    <span>👁️ ${isAr ? 'نسبة اطلاع الموظفين على الإعلان' : 'Staff Readership'}: <b>${viewedCount}</b> / ${totalTargetWorkers} ${isAr ? 'موظف' : 'Staff'}</span>
                    <span style="color: #10b981; font-weight: 800;">${percentage}%</span>
                </div>
                <div style="height: 8px; background: rgba(255,255,255,0.08); border-radius: 100px; overflow: hidden;">
                    <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, #10b981, #059669); border-radius: 100px; transition: width 0.4s ease;"></div>
                </div>
            </div>
        </div>
    `;
}
window.renderActiveAnnouncementHUD = renderActiveAnnouncementHUD;

/**
 * Render Saved Announcement Templates Grid
 */
function renderAnnouncementTemplates() {
    const grid = document.getElementById('announcement-templates-grid');
    const countBadge = document.getElementById('ann-templates-count-badge');
    if (!grid) return;

    const isAr = currentAppLang === 'ar';
    const data = getCompanyData();
    const templates = data.announcementTemplates || {};
    const tplList = Object.values(templates).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (countBadge) {
        countBadge.textContent = `${tplList.length} ${isAr ? 'قالب' : 'Templates'}`;
    }

    if (tplList.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 36px 16px; color: var(--text-muted); background: var(--input-bg); border-radius: 14px; border: 1px dashed var(--border-color);">
                <div style="font-size: 2.2rem; margin-bottom: 8px;">📝</div>
                <div style="font-weight: 800; font-size: 1rem; color: var(--text-main); margin-bottom: 4px;">${isAr ? 'لا توجد قوالب محفوظة بعد' : 'No Announcement Templates Yet'}</div>
                <div style="font-size: 0.82rem;">${isAr ? 'أنشئ أول قالب من النموذج الجانبي لتتمكن من نشره فورياً بضغطة زر.' : 'Create your first template using the form to publish anytime.'}</div>
            </div>
        `;
        return;
    }

    grid.innerHTML = '';
    const activeAnn = data.activeAnnouncement;

    tplList.forEach(tpl => {
        const isLive = activeAnn && activeAnn.templateId === tpl.id;
        const liveIndicator = isLive ? `<span style="background: rgba(16,185,129,0.15); color: #10b981; font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 100px; border: 1px solid rgba(16,185,129,0.3);">🟢 ${isAr ? 'يبث الآن' : 'Live'}</span>` : '';
        const imgThumb = tpl.imageUrl ? `
            <div style="width: 100%; height: 110px; border-radius: 8px; overflow: hidden; margin-bottom: 10px; background: #000; display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="showImage('${tpl.imageUrl.replace(/'/g, "\\'")}')">
                <img src="${tpl.imageUrl}" alt="Preview" style="max-height: 100%; max-width: 100%; object-fit: contain;">
            </div>
        ` : '';

        const dateStr = tpl.createdAt ? new Date(tpl.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

        grid.innerHTML += `
            <div class="announcement-card" style="display: flex; flex-direction: column; justify-content: space-between; border-left: 5px solid ${isLive ? '#10b981' : '#8b5cf6'};">
                <div>
                    ${imgThumb}
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
                        <h4 style="margin: 0; font-size: 0.98rem; font-weight: 900; color: var(--text-main); line-height: 1.3;">${tpl.title}</h4>
                        ${liveIndicator}
                    </div>
                    <p style="margin: 0 0 12px 0; font-size: 0.82rem; color: var(--text-muted); line-height: 1.5; white-space: pre-wrap; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${tpl.text}</p>
                </div>

                <div>
                    <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 10px;">📅 ${dateStr}</div>
                    
                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        <button type="button" onclick="publishAnnouncementToAll('${tpl.id}')" class="btn-primary" style="flex: 1; padding: 7px 10px; border-radius: 8px; font-weight: 800; font-size: 0.78rem; background: linear-gradient(135deg, #8b5cf6, #6d28d9); border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                            <span>📢</span> <span>${isAr ? 'نشر للجميع' : 'Publish All'}</span>
                        </button>
                        <button type="button" onclick="openTargetWorkersModal('${tpl.id}')" class="btn-outline" style="padding: 7px 10px; border-radius: 8px; font-weight: 800; font-size: 0.78rem; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                            <span>🎯</span> <span>${isAr ? 'تحديد موظف' : 'Specific'}</span>
                        </button>
                        <button type="button" onclick="editAnnouncementTemplate('${tpl.id}')" class="btn-outline" style="padding: 7px 8px; border-radius: 8px; font-size: 0.78rem; border: 1px solid var(--border-color); cursor: pointer;" title="Edit">
                            ✏️
                        </button>
                        <button type="button" onclick="deleteAnnouncementTemplate('${tpl.id}')" class="btn-outline-danger" style="padding: 7px 8px; border-radius: 8px; font-size: 0.78rem; border: 1px solid var(--danger); background: transparent; color: var(--danger); cursor: pointer;" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}
window.renderAnnouncementTemplates = renderAnnouncementTemplates;

/**
 * Render Announcements Section when tab is opened
 */
function renderAnnouncementsSection() {
    renderActiveAnnouncementHUD();
    renderAnnouncementTemplates();
}
window.renderAnnouncementsSection = renderAnnouncementsSection;
window.renderAdverts = renderAnnouncementsSection; // Aliased to renderAdverts so all existing calls switch seamlessly

let inlineImgZoomScale = 1;
let inlineImgTranslateX = 0;
let inlineImgTranslateY = 0;
let isPanningImg = false;
let startPanX = 0;
let startPanY = 0;
let initialPinchDistance = 0;
let initialPinchScale = 1;

function updateInlineImageTransform() {
    const img = document.getElementById('worker-popup-img');
    const container = document.getElementById('worker-popup-image-container');
    if (!img) return;
    
    if (inlineImgZoomScale <= 1) {
        inlineImgZoomScale = 1;
        inlineImgTranslateX = 0;
        inlineImgTranslateY = 0;
        if (container) container.style.cursor = 'grab';
    } else {
        if (container) container.style.cursor = 'grabbing';
    }
    
    img.style.transform = `translate(${inlineImgTranslateX}px, ${inlineImgTranslateY}px) scale(${inlineImgZoomScale})`;
    
    const scaleBadge = document.getElementById('inline-img-scale-badge');
    if (scaleBadge) {
        scaleBadge.textContent = `${Math.round(inlineImgZoomScale * 100)}%`;
    }
}

function zoomInlineImage(delta) {
    inlineImgZoomScale += delta;
    if (inlineImgZoomScale < 1) inlineImgZoomScale = 1;
    if (inlineImgZoomScale > 4.5) inlineImgZoomScale = 4.5;
    if (inlineImgZoomScale === 1) {
        inlineImgTranslateX = 0;
        inlineImgTranslateY = 0;
    }
    updateInlineImageTransform();
}
window.zoomInlineImage = zoomInlineImage;

function resetInlineImageZoom() {
    inlineImgZoomScale = 1;
    inlineImgTranslateX = 0;
    inlineImgTranslateY = 0;
    updateInlineImageTransform();
}
window.resetInlineImageZoom = resetInlineImageZoom;

function toggleInlineImageZoom() {
    if (inlineImgZoomScale > 1.2) {
        resetInlineImageZoom();
    } else {
        inlineImgZoomScale = 2.2;
        updateInlineImageTransform();
    }
}
window.toggleInlineImageZoom = toggleInlineImageZoom;

function initInlineImageTouchEngine() {
    const container = document.getElementById('worker-popup-image-container');
    if (!container || container._touchEngineInit) return;
    container._touchEngineInit = true;

    // Mouse Drag
    container.addEventListener('mousedown', (e) => {
        if (inlineImgZoomScale <= 1) return;
        isPanningImg = true;
        startPanX = e.clientX - inlineImgTranslateX;
        startPanY = e.clientY - inlineImgTranslateY;
        container.style.cursor = 'grabbing';
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPanningImg) return;
        inlineImgTranslateX = e.clientX - startPanX;
        inlineImgTranslateY = e.clientY - startPanY;
        updateInlineImageTransform();
    });

    window.addEventListener('mouseup', () => {
        isPanningImg = false;
        if (container) container.style.cursor = inlineImgZoomScale > 1 ? 'grab' : 'default';
    });

    // Mouse Wheel Zoom
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.25 : -0.25;
        zoomInlineImage(delta);
    }, { passive: false });

    // Touch Events for Mobile (Pinch-to-zoom and swipe-to-pan)
    container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            initialPinchDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialPinchScale = inlineImgZoomScale;
        } else if (e.touches.length === 1) {
            isPanningImg = true;
            startPanX = e.touches[0].clientX - inlineImgTranslateX;
            startPanY = e.touches[0].clientY - inlineImgTranslateY;
        }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && initialPinchDistance > 0) {
            e.preventDefault();
            const currentDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const ratio = currentDist / initialPinchDistance;
            inlineImgZoomScale = Math.min(Math.max(initialPinchScale * ratio, 1), 4.5);
            if (inlineImgZoomScale === 1) {
                inlineImgTranslateX = 0;
                inlineImgTranslateY = 0;
            }
            updateInlineImageTransform();
        } else if (e.touches.length === 1 && isPanningImg && inlineImgZoomScale > 1) {
            e.preventDefault();
            inlineImgTranslateX = e.touches[0].clientX - startPanX;
            inlineImgTranslateY = e.touches[0].clientY - startPanY;
            updateInlineImageTransform();
        }
    }, { passive: false });

    container.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
            initialPinchDistance = 0;
        }
        if (e.touches.length === 0) {
            isPanningImg = false;
        }
    }, { passive: true });

    // Double-tap to zoom
    let lastTapTime = 0;
    container.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        if (tapLength < 300 && tapLength > 0 && e.touches.length === 0) {
            toggleInlineImageZoom();
            e.preventDefault();
        }
        lastTapTime = currentTime;
    });
}

/**
 * Worker Mandatory Pop-up Trigger Logic
 */
function checkAndShowWorkerAnnouncementPopup() {
    const data = getCompanyData();
    const activeAnn = data.activeAnnouncement || (typeof appData !== 'undefined' && appData[currentCompany] && appData[currentCompany].activeAnnouncement);
    if (!activeAnn || !activeAnn.id) {
        closeWorkerAnnouncementPopup();
        return;
    }

    if (!currentUser || currentUser.role === 'admin') return; // Admins don't get forced popups

    const myWorker = (data.workers || []).find(w => w.email && currentUser.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
    if (!myWorker) return;

    // Check target audience
    const isTargeted = (activeAnn.target === 'all' || (Array.isArray(activeAnn.target) && activeAnn.target.includes(myWorker.id)));
    if (!isTargeted) {
        closeWorkerAnnouncementPopup();
        return;
    }

    // Check if worker already viewed it
    const viewers = activeAnn.viewers || {};
    if (viewers[myWorker.id]) {
        closeWorkerAnnouncementPopup();
        return;
    }

    // Display Popup Modal
    const modal = document.getElementById('modal-worker-announcement-popup');
    const titleElem = document.getElementById('worker-popup-title');
    const textElem = document.getElementById('worker-popup-text');
    const imgContainer = document.getElementById('worker-popup-image-container');
    const imgElem = document.getElementById('worker-popup-img');
    const metaElem = document.getElementById('worker-popup-meta');

    if (!modal) return;

    if (titleElem) titleElem.textContent = activeAnn.title || '';
    if (textElem) textElem.textContent = activeAnn.text || '';
    if (imgContainer && imgElem) {
        if (activeAnn.imageUrl) {
            imgElem.src = activeAnn.imageUrl;
            imgContainer.style.display = 'flex';
            resetInlineImageZoom();
            initInlineImageTouchEngine();
        } else {
            imgContainer.style.display = 'none';
            imgElem.src = '';
        }
    }

    const authorElem = document.getElementById('worker-popup-author');
    if (authorElem) {
        authorElem.textContent = `👤 ${formatExecutiveAuthorName(activeAnn.publishedBy)}`;
    }

    if (metaElem) {
        const pubDateStr = activeAnn.publishedAt ? new Date(activeAnn.publishedAt).toLocaleString('en-US', { timeZone: 'Asia/Riyadh', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '-';
        metaElem.textContent = `🕒 ${pubDateStr}`;
    }

    modal.style.display = 'flex';
}
window.checkAndShowWorkerAnnouncementPopup = checkAndShowWorkerAnnouncementPopup;

function closeWorkerAnnouncementPopup() {
    const modal = document.getElementById('modal-worker-announcement-popup');
    if (modal) modal.style.display = 'none';
}
window.closeWorkerAnnouncementPopup = closeWorkerAnnouncementPopup;

/**
 * Worker acknowledges the announcement (marks as read and saves to Firebase)
 */
function acknowledgeAnnouncement() {
    const data = getCompanyData();
    const activeAnn = data.activeAnnouncement || (typeof appData !== 'undefined' && appData[currentCompany] && appData[currentCompany].activeAnnouncement);
    if (!activeAnn || !activeAnn.id) {
        closeWorkerAnnouncementPopup();
        return;
    }

    const myWorker = (data.workers || []).find(w => w.email && currentUser && currentUser.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
    const workerId = myWorker ? myWorker.id : (currentUser ? currentUser.email.replace(/[^a-zA-Z0-9]/g, '_') : 'unknown');
    const workerName = myWorker ? myWorker.name : ((currentUser && currentUser.name) || (currentUser && currentUser.email) || 'Staff');
    const workerRole = myWorker ? myWorker.role : 'Worker';
    const workerPhone = myWorker ? (myWorker.phone || '') : '';

    const viewerRecord = {
        id: workerId,
        name: workerName,
        role: workerRole,
        phone: workerPhone,
        viewedAt: Date.now()
    };

    // Save to Firebase RTDB
    db.ref(`companies/${currentCompany}/activeAnnouncement/viewers/${workerId}`).set(viewerRecord)
        .then(() => {
            if (!activeAnn.viewers) activeAnn.viewers = {};
            activeAnn.viewers[workerId] = viewerRecord;
            closeWorkerAnnouncementPopup();
        })
        .catch(err => {
            console.error('Error acknowledging announcement:', err);
            closeWorkerAnnouncementPopup();
        });
}
window.acknowledgeAnnouncement = acknowledgeAnnouncement;

/**
 * Open Readership Modal (Admin Insights)
 */
function openAnnouncementReadershipModal() {
    const isAr = currentAppLang === 'ar';
    const data = getCompanyData();
    const activeAnn = data.activeAnnouncement || (typeof appData !== 'undefined' && appData[currentCompany] && appData[currentCompany].activeAnnouncement);
    if (!activeAnn || !activeAnn.id) return;

    const modal = document.getElementById('modal-announcement-readership');
    const titleElem = document.getElementById('readership-ann-title');
    const statsBar = document.getElementById('readership-stats-bar');
    const listsContainer = document.getElementById('readership-lists-container');
    if (!modal || !statsBar || !listsContainer) return;

    if (titleElem) titleElem.textContent = activeAnn.title;

    const allWorkers = data.workers || [];
    let targetWorkersList = [];

    if (activeAnn.target === 'all') {
        targetWorkersList = allWorkers;
    } else if (Array.isArray(activeAnn.target)) {
        targetWorkersList = allWorkers.filter(w => activeAnn.target.includes(w.id));
    }

    const viewers = activeAnn.viewers || {};
    const viewedWorkers = [];
    const pendingWorkers = [];

    targetWorkersList.forEach(w => {
        if (viewers[w.id]) {
            viewedWorkers.push({ worker: w, viewData: viewers[w.id] });
        } else {
            pendingWorkers.push(w);
        }
    });

    const totalTarget = targetWorkersList.length;
    const viewedCount = viewedWorkers.length;
    const percentage = totalTarget > 0 ? Math.round((viewedCount / totalTarget) * 100) : 0;

    statsBar.innerHTML = `
        <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; padding: 14px; text-align: center;">
            <div style="font-size: 0.8rem; font-weight: 800; color: #10b981; margin-bottom: 4px;">🟢 ${isAr ? 'تم الاطلاع والقراءة' : 'Viewed & Acknowledged'}</div>
            <div style="font-size: 1.4rem; font-weight: 900; color: #10b981;">${viewedCount} / ${totalTarget} (${percentage}%)</div>
        </div>
        <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 14px; text-align: center;">
            <div style="font-size: 0.8rem; font-weight: 800; color: #ef4444; margin-bottom: 4px;">⏳ ${isAr ? 'لم يطّلع بعد' : 'Not Viewed Yet'}</div>
            <div style="font-size: 1.4rem; font-weight: 900; color: #ef4444;">${pendingWorkers.length} ${isAr ? 'موظف' : 'Staff'}</div>
        </div>
    `;

    let viewedHtml = '';
    if (viewedWorkers.length === 0) {
        viewedHtml = `<p style="color:var(--text-muted); font-size:0.84rem; padding:10px; margin:0;">${isAr ? 'لا يوجد مشاهدات مسجلة بعد.' : 'No views recorded yet.'}</p>`;
    } else {
        viewedHtml = viewedWorkers.map(vw => {
            const timeStr = vw.viewData.viewedAt ? new Date(vw.viewData.viewedAt).toLocaleString('en-US', { timeZone: 'Asia/Riyadh', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '-';
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:6px;">
                    <div>
                        <div style="font-weight:800; font-size:0.88rem; color:var(--text-main);">👤 ${vw.worker.name || vw.viewData.name}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">${vw.worker.role || vw.viewData.role || ''} • 📱 ${vw.worker.phone || '-'}</div>
                    </div>
                    <span style="font-size:0.78rem; font-weight:800; color:#10b981; background:rgba(16,185,129,0.15); padding:4px 10px; border-radius:6px;">🕒 ${timeStr}</span>
                </div>
            `;
        }).join('');
    }

    let pendingHtml = '';
    if (pendingWorkers.length === 0) {
        pendingHtml = `<p style="color:#10b981; font-size:0.84rem; font-weight:800; padding:10px; margin:0;">🎉 ${isAr ? 'جميع الموظفين اطلعوا على الإعلان!' : 'All staff have viewed the announcement!'}</p>`;
    } else {
        pendingHtml = pendingWorkers.map(w => {
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:6px;">
                    <div>
                        <div style="font-weight:800; font-size:0.88rem; color:var(--text-main);">👤 ${w.name}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">${w.role || ''} • 📱 ${w.phone || '-'}</div>
                    </div>
                    <span style="font-size:0.78rem; font-weight:800; color:#ef4444; background:rgba(239,68,68,0.12); padding:4px 10px; border-radius:6px;">⏳ ${isAr ? 'قيد الانتظار' : 'Pending'}</span>
                </div>
            `;
        }).join('');
    }

    listsContainer.innerHTML = `
        <div style="background:var(--input-bg); border-radius:12px; padding:14px; border:1px solid var(--border-color);">
            <h4 style="margin:0 0 10px 0; font-size:0.92rem; font-weight:900; color:#10b981; display:flex; align-items:center; gap:6px;">
                <span>🟢</span> <span>${isAr ? 'الموظفون الذين اطلعوا على الإعلان' : 'Staff Who Viewed & Acknowledged'} (${viewedWorkers.length})</span>
            </h4>
            <div style="max-height:180px; overflow-y:auto;">${viewedHtml}</div>
        </div>

        <div style="background:var(--input-bg); border-radius:12px; padding:14px; border:1px solid var(--border-color);">
            <h4 style="margin:0 0 10px 0; font-size:0.92rem; font-weight:900; color:#ef4444; display:flex; align-items:center; gap:6px;">
                <span>⏳</span> <span>${isAr ? 'الموظفون الذين لم يطّلعوا بعد' : 'Staff Who Have Not Viewed Yet'} (${pendingWorkers.length})</span>
            </h4>
            <div style="max-height:180px; overflow-y:auto;">${pendingHtml}</div>
        </div>
    `;

    modal.style.display = 'flex';
}
window.openAnnouncementReadershipModal = openAnnouncementReadershipModal;

function closeAnnouncementReadershipModal() {
    const modal = document.getElementById('modal-announcement-readership');
    if (modal) modal.style.display = 'none';
}
window.closeAnnouncementReadershipModal = closeAnnouncementReadershipModal;
