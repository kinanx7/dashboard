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
    const notes = getNotesArray();
    const note = notes.find(n => n && n.id === id);
    if (note) note.text = trimmedText;

    db.ref(`companies/${currentCompany}/managerNotes/${id}`).update({
        text: trimmedText,
        editedAt: now
    }).then(() => {
        closeEditNoteModal();
        renderNotes();
    }).catch(err => {
        console.error("Error editing note:", err);
        alert(isAr ? 'حدث خطأ أثناء تعديل الملاحظة.' : 'Error editing note.');
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
