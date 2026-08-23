/**
 * Official Contracts Management & Worker Digital Signature System
 * Module: js/contracts.js
 * 
 * Features:
 * - Admin-Only Contracts Section (create/upload text or image contracts)
 * - PDF Viewers & A4 Printable Documents with official company header & verification stamp
 * - Worker Digital Signature System (HTML5 Canvas supporting mouse and touch)
 * - Worker Operations Notification Banner & Inbox
 * - Signed Contracts Box for Admin review and PDF export
 */

var currentContractFilter = 'all'; // 'all', 'draft', 'pending_signature', 'signed'
var activeContractSignaturePad = null;
var signatureDrawing = false;
var signatureCanvasCtx = null;
var signatureHasDrawn = false;

// 1. RENDER CONTRACTS SECTION (ADMIN ONLY)
function renderContractsSection() {
    const grid = document.getElementById('contracts-grid');
    if (!grid) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const isAdmin = (typeof currentUser !== 'undefined' && currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.isAdmin));
    
    // Admin Only Security Gate
    const contractsView = document.getElementById('view-contracts');
    if (contractsView) {
        // Ensure inline display:none is never blocking the view
        if (contractsView.style.display === 'none' && contractsView.classList.contains('active-view')) {
            contractsView.style.display = '';
        }
    }

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const contractsObj = data.contracts || {};
    let contracts = Object.values(contractsObj);

    // Search Query Filter
    const searchInput = document.getElementById('contract-search-input');
    const q = searchInput ? searchInput.value.toLowerCase().trim() : '';

    if (q) {
        contracts = contracts.filter(c => {
            if (!c) return false;
            const title = (c.title || '').toLowerCase();
            const worker = (c.workerName || '').toLowerCase();
            const type = (c.type || '').toLowerCase();
            return title.includes(q) || worker.includes(q) || type.includes(q);
        });
    }

    // Status Filter
    if (currentContractFilter !== 'all') {
        contracts = contracts.filter(c => c && c.status === currentContractFilter);
    }

    // Sort newest first
    contracts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // Update Counter Badges
    const allContracts = Object.values(contractsObj);
    const totalCount = allContracts.length;
    const pendingCount = allContracts.filter(c => c.status === 'pending_signature').length;
    const signedCount = allContracts.filter(c => c.status === 'signed').length;

    const badgeTotal = document.getElementById('contract-stat-total');
    const badgePending = document.getElementById('contract-stat-pending');
    const badgeSigned = document.getElementById('contract-stat-signed');

    if (badgeTotal) badgeTotal.textContent = `${totalCount} ${isAr ? 'عقود' : 'Total'}`;
    if (badgePending) badgePending.textContent = `${pendingCount} ${isAr ? 'بانتظار التوقيع' : 'Pending'}`;
    if (badgeSigned) badgeSigned.textContent = `${signedCount} ${isAr ? 'موقع' : 'Signed'}`;

    if (contracts.length === 0) {
        const emptyTitle = isAr ? 'لا توجد عقود مسجلة' : 'No Contracts Found';
        const emptyDesc = q 
            ? (isAr ? 'لا توجد عقود تطابق بحثك الحالي.' : 'No contracts match your search filter.')
            : (isAr ? 'استخدم أزرار "إنشاء عقد نصي" أو "رفع صورة عقد" بالأعلى لإنشاء وإرسال العقود للموظفين للتوقيع عليها إلكترونياً.' : 'Use the "Create Text Contract" or "Upload Contract Image" buttons above to draft and send contracts to workers for digital signing.');
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; background: var(--input-bg); border-radius: 18px; border: 2px dashed var(--border-color); max-width: 600px; margin: 0 auto; width: 100%; box-sizing: border-box;">
                <div style="font-size: 3.5rem; margin-bottom: 12px;">📜</div>
                <h3 style="margin: 0 0 8px 0; color: var(--text-main); font-size: 1.2rem; font-weight: 800;">${emptyTitle}</h3>
                <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem; line-height: 1.6;">${emptyDesc}</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = contracts.map(c => {
        const isSigned = c.status === 'signed';
        const isPending = c.status === 'pending_signature';
        const isDraft = !isSigned && !isPending;

        const dateFormatted = c.createdAt ? new Date(c.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
        const signedDateFormatted = c.signedAt ? new Date(c.signedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

        const statusBadge = isSigned 
            ? `<span style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); padding: 4px 10px; border-radius: 20px; font-size: 0.76rem; font-weight: 800;">✅ ${isAr ? 'موقع ومكتمل' : 'Signed'}</span>`
            : (isPending 
                ? `<span style="background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); padding: 4px 10px; border-radius: 20px; font-size: 0.76rem; font-weight: 800;">⏳ ${isAr ? 'بانتظار توقيع الموظف' : 'Pending Signature'}</span>`
                : `<span style="background: rgba(100,116,139,0.15); color: var(--text-muted); border: 1px solid var(--border-color); padding: 4px 10px; border-radius: 20px; font-size: 0.76rem; font-weight: 800;">📝 ${isAr ? 'مسودة' : 'Draft'}</span>`);

        const typeBadge = c.type === 'image'
            ? `<span style="background: rgba(59,130,246,0.12); color: #3b82f6; padding: 2px 8px; border-radius: 8px; font-size: 0.72rem; font-weight: 800;">🖼️ ${isAr ? 'صورة عقد' : 'Image Contract'}</span>`
            : `<span style="background: rgba(139,92,246,0.12); color: #8b5cf6; padding: 2px 8px; border-radius: 8px; font-size: 0.72rem; font-weight: 800;">📄 ${isAr ? 'عقد نصي' : 'Text Contract'}</span>`;

        const workerDisplay = c.workerName 
            ? `<div style="font-size: 0.82rem; color: var(--text-main); font-weight: 700; margin-top: 6px; display: flex; align-items: center; gap: 6px;">
                <span>👤</span> <span>${c.workerName}</span>
               </div>`
            : `<div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-top: 6px;">${isAr ? '⚠️ غير مسند لموظف بعد' : 'Unassigned'}</div>`;

        return `
            <div class="card ledger-card" style="margin: 0; padding: 18px; border-radius: 16px; border: 1px solid var(--border-color); background: var(--card-bg); display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--shadow-sm); box-sizing: border-box; transition: transform 0.2s ease;">
                <div>
                    <!-- Header Badges -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 8px; flex-wrap: wrap;">
                        ${typeBadge}
                        ${statusBadge}
                    </div>

                    <!-- Title -->
                    <h3 style="margin: 0 0 8px 0; font-size: 1.05rem; font-weight: 900; color: var(--text-main); line-height: 1.4;">${typeof escapeHtml === 'function' ? escapeHtml(c.title) : c.title}</h3>

                    <!-- Assigned Worker -->
                    ${workerDisplay}

                    <!-- Date & Signed Info -->
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 10px; border-top: 1px dashed var(--border-color); padding-top: 8px; display: flex; flex-direction: column; gap: 4px;">
                        <div>📅 ${isAr ? 'تاريخ الإنشاء' : 'Created'}: ${dateFormatted}</div>
                        ${isSigned ? `<div style="color: #10b981; font-weight: 800;">✍️ ${isAr ? 'تاريخ التوقيع' : 'Signed'}: ${signedDateFormatted}</div>` : ''}
                    </div>
                </div>

                <!-- Action Buttons -->
                <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-color); display: flex; gap: 6px; flex-wrap: wrap; align-items: center; justify-content: space-between;">
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        <button type="button" onclick="viewContractAsPDF('${c.id}')" class="btn-primary" style="padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 800; background: linear-gradient(135deg, #4f46e5, #3730a3); border: none; color: white; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                            <span>👁️</span> <span>${isAr ? 'عرض كـ PDF' : 'View PDF'}</span>
                        </button>
                        ${!isSigned ? `
                            <button type="button" onclick="openSendContractModal('${c.id}')" class="btn-success" style="padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 800; background: linear-gradient(135deg, #10b981, #059669); border: none; color: white; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                                <span>📤</span> <span>${isAr ? 'إرسال للموظف' : 'Send'}</span>
                            </button>
                        ` : `
                            <button type="button" onclick="printContractPDF('${c.id}')" class="btn-outline" style="padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 800; border: 1px solid #10b981; color: #10b981; background: rgba(16,185,129,0.08); cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                                <span>🖨️</span> <span>${isAr ? 'طباعة العقد' : 'Print'}</span>
                            </button>
                        `}
                    </div>
                    <div style="display: flex; gap: 4px;">
                        ${!isSigned ? `
                            <button type="button" onclick="openContractEditor('${c.id}', '${c.type || 'text'}')" style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25); border-radius: 6px; padding: 4px 8px; font-size: 0.75rem; color: #6366f1; cursor: pointer;" title="${isAr ? 'تعديل' : 'Edit'}">✏️</button>
                        ` : ''}
                        <button type="button" onclick="deleteContract('${c.id}')" style="background: rgba(220,38,38,0.1); border: 1px solid rgba(220,38,38,0.25); border-radius: 6px; padding: 4px 8px; font-size: 0.75rem; color: var(--danger); cursor: pointer;" title="${isAr ? 'حذف' : 'Delete'}">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}
window.renderContractsSection = renderContractsSection;

function setContractStatusFilter(filter) {
    currentContractFilter = filter;
    document.querySelectorAll('.btn-contract-filter').forEach(b => {
        const isMatch = b.getAttribute('data-filter') === filter;
        b.classList.toggle('active-contract-filter', isMatch);
        b.style.background = isMatch ? '#6366f1' : 'transparent';
        b.style.color = isMatch ? '#ffffff' : 'var(--text-main)';
    });
    renderContractsSection();
}
window.setContractStatusFilter = setContractStatusFilter;

// 2. OPEN CONTRACT EDITOR MODAL (TEXT OR IMAGE)
function openContractEditor(contractId, mode) {
    const isAdmin = (typeof currentUser !== 'undefined' && currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.isAdmin));
    if (!isAdmin) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const modal = document.getElementById('modal-contract-editor');
    if (!modal) return;

    const editIdEl = document.getElementById('contract-edit-id');
    const modeEl = document.getElementById('contract-mode-select');
    const titleEl = document.getElementById('contract-form-title');
    const textGroup = document.getElementById('contract-text-group');
    const imageGroup = document.getElementById('contract-image-group');
    const modalTitle = document.getElementById('contract-modal-title');

    const titleInput = document.getElementById('contract-input-title');
    const textInput = document.getElementById('contract-input-text');
    const previewImg = document.getElementById('contract-image-preview');
    const imageContainer = document.getElementById('contract-image-preview-container');
    const workerSelect = document.getElementById('contract-worker-select');

    // Populate workers dropdown
    if (workerSelect) {
        const workers = (typeof getCompanyData === 'function' ? getCompanyData().workers : []) || [];
        workerSelect.innerHTML = `<option value="">${isAr ? '-- اختر موظفاً (اختياري) --' : '-- Choose Worker (Optional) --'}</option>` +
            workers.map(w => `<option value="${w.id}">${w.name}</option>`).join('');
    }

    const effectiveMode = mode || 'text';
    if (modeEl) modeEl.value = effectiveMode;
    toggleContractEditorMode(effectiveMode);

    if (contractId) {
        const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
        const c = data.contracts?.[contractId];
        if (c) {
            if (editIdEl) editIdEl.value = contractId;
            if (titleInput) titleInput.value = c.title || '';
            if (textInput) textInput.value = c.content || '';
            if (workerSelect) workerSelect.value = c.workerId || '';
            if (modeEl) modeEl.value = c.type || 'text';
            toggleContractEditorMode(c.type || 'text');

            if (c.imageUrl && previewImg && imageContainer) {
                previewImg.src = c.imageUrl;
                imageContainer.style.display = 'block';
            } else if (imageContainer) {
                imageContainer.style.display = 'none';
            }

            if (modalTitle) modalTitle.textContent = isAr ? '✏️ تعديل بيانات العقد' : '✏️ Edit Contract';
        }
    } else {
        if (editIdEl) editIdEl.value = '';
        if (titleInput) titleInput.value = '';
        if (textInput) {
            textInput.value = isAr 
                ? `عقد عمل رسمي\n\nالطرف الأول: شركة ${typeof currentCompany !== 'undefined' ? currentCompany.toUpperCase() : 'MVC Fresh'}\nالطرف الثاني: [اسم الموظف]\n\nالبنود والشروط:\n1. يلتزم الطرف الثاني بأداء مهام عمله وفقاً للوائح والأنظمة المعمول بها في المنشأة.\n2. مدة هذا العقد سنة واحدة تبدأ من تاريخ توقيعه وتتجدد باتفاق الطرفين.\n3. يلتزم الطرف الثاني بالمحافظة على سرية بيانات ومعلومات العمل.\n4. يخضع هذا العقد لنظام العمل واللوائح المعتمدة بالمملكة العربية السعودية.`
                : `OFFICIAL EMPLOYMENT CONTRACT\n\nFirst Party: ${typeof currentCompany !== 'undefined' ? currentCompany.toUpperCase() : 'MVC Fresh'} Corporation\nSecond Party: [Employee Name]\n\nTerms and Conditions:\n1. The Second Party agrees to perform their duties in accordance with company policies and job specifications.\n2. The term of this agreement shall be one year commencing from the date of digital execution.\n3. The Second Party agrees to maintain strict confidentiality of all business information.\n4. Both parties agree to abide by official labor regulations and company bylaws.`;
        }
        if (workerSelect) workerSelect.value = '';
        if (imageContainer) imageContainer.style.display = 'none';
        if (previewImg) previewImg.src = '';

        if (modalTitle) modalTitle.textContent = effectiveMode === 'image' 
            ? (isAr ? '📤 رفع صورة عقد رسمي' : '📤 Upload Contract Image')
            : (isAr ? '➕ إنشاء عقد نصي رسمي' : '➕ Create Official Text Contract');
    }

    modal.style.display = 'flex';
}
window.openContractEditor = openContractEditor;

function closeContractEditor() {
    const modal = document.getElementById('modal-contract-editor');
    if (modal) modal.style.display = 'none';
}
window.closeContractEditor = closeContractEditor;

function toggleContractEditorMode(mode) {
    const textGroup = document.getElementById('contract-text-group');
    const imageGroup = document.getElementById('contract-image-group');
    if (textGroup) textGroup.style.display = (mode === 'text') ? 'block' : 'none';
    if (imageGroup) imageGroup.style.display = (mode === 'image') ? 'block' : 'none';
}
window.toggleContractEditorMode = toggleContractEditorMode;

// Handle Contract Image Upload Preview
function handleContractImageUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const previewImg = document.getElementById('contract-image-preview');
        const container = document.getElementById('contract-image-preview-container');
        if (previewImg && container) {
            previewImg.src = e.target.result;
            container.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}
window.handleContractImageUpload = handleContractImageUpload;

// 3. SAVE CONTRACT (TEXT OR IMAGE)
function saveContract() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const editIdEl = document.getElementById('contract-edit-id');
    const modeEl = document.getElementById('contract-mode-select');
    const titleInput = document.getElementById('contract-input-title');
    const textInput = document.getElementById('contract-input-text');
    const previewImg = document.getElementById('contract-image-preview');
    const workerSelect = document.getElementById('contract-worker-select');

    const editingId = editIdEl ? editIdEl.value.trim() : '';
    const mode = modeEl ? modeEl.value : 'text';
    const title = titleInput ? titleInput.value.trim() : '';
    const content = textInput ? textInput.value.trim() : '';
    const imageUrl = previewImg ? previewImg.src : '';
    const workerId = workerSelect ? workerSelect.value : '';

    if (!title) {
        alert(isAr ? 'يرجى كتابة عنوان العقد.' : 'Please enter contract title.');
        return;
    }

    if (mode === 'text' && !content) {
        alert(isAr ? 'يرجى كتابة بنود ونص العقد.' : 'Please enter contract text terms.');
        return;
    }

    if (mode === 'image' && (!imageUrl || imageUrl.length < 10)) {
        alert(isAr ? 'يرجى اختيار صورة العقد لرفعها.' : 'Please upload contract image.');
        return;
    }

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    let workerName = '';
    if (workerId) {
        const w = (data.workers || []).find(w => w.id === workerId);
        if (w) workerName = w.name;
    }

    const contractId = editingId || ('contract_' + Date.now());
    const existing = data.contracts?.[contractId] || {};
    const now = Date.now();

    const contractObj = {
        id: contractId,
        title: title,
        type: mode,
        content: (mode === 'text') ? content : '',
        imageUrl: (mode === 'image') ? imageUrl : '',
        workerId: workerId || '',
        workerName: workerName || '',
        status: existing.status || (workerId ? 'pending_signature' : 'draft'),
        createdAt: existing.createdAt || now,
        createdBy: (typeof currentUser !== 'undefined' && currentUser && currentUser.email) ? currentUser.email : 'Admin',
        signedAt: existing.signedAt || null,
        signatureDataUrl: existing.signatureDataUrl || null,
        signDate: existing.signDate || null,
        updatedAt: now
    };

    if (!data.contracts) data.contracts = {};
    data.contracts[contractId] = contractObj;

    if (typeof appData !== 'undefined' && currentCompany && appData[currentCompany]) {
        if (!appData[currentCompany].contracts) appData[currentCompany].contracts = {};
        appData[currentCompany].contracts[contractId] = contractObj;
    }

    closeContractEditor();
    renderContractsSection();

    if (typeof db !== 'undefined' && currentCompany) {
        db.ref(`companies/${currentCompany}/contracts/${contractId}`).set(contractObj).then(() => {
            if (typeof showInAppNotification === 'function') {
                showInAppNotification(isAr ? '📜 تم حفظ العقد بنجاح!' : '📜 Contract saved successfully!');
            }
        }).catch(err => console.error("Error saving contract:", err));
    }
}
window.saveContract = saveContract;

// 4. SEND CONTRACT TO WORKER MODAL
var currentSendContractId = null;

function openSendContractModal(contractId) {
    currentSendContractId = contractId;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const modal = document.getElementById('modal-send-contract');
    const select = document.getElementById('send-contract-worker-select');
    if (!modal || !select) return;

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const workers = data.workers || [];

    select.innerHTML = `<option value="">${isAr ? '-- اختر الموظف المستلم --' : '-- Choose Recipient Worker --'}</option>` +
        workers.map(w => `<option value="${w.id}">${w.name}</option>`).join('');

    const c = data.contracts?.[contractId];
    if (c && c.workerId) select.value = c.workerId;

    modal.style.display = 'flex';
}
window.openSendContractModal = openSendContractModal;

function closeSendContractModal() {
    const modal = document.getElementById('modal-send-contract');
    if (modal) modal.style.display = 'none';
    currentSendContractId = null;
}
window.closeSendContractModal = closeSendContractModal;

function confirmSendContractToWorker() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const select = document.getElementById('send-contract-worker-select');
    const workerId = select ? select.value : '';

    if (!currentSendContractId || !workerId) {
        alert(isAr ? 'الرجاء اختيار الموظف أولاً.' : 'Please select a worker first.');
        return;
    }

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const c = data.contracts?.[currentSendContractId];
    if (!c) return;

    const w = (data.workers || []).find(wk => wk.id === workerId);
    const workerName = w ? w.name : 'Worker';

    c.workerId = workerId;
    c.workerName = workerName;
    c.status = 'pending_signature';
    c.sentAt = Date.now();

    closeSendContractModal();
    renderContractsSection();

    if (typeof db !== 'undefined' && currentCompany) {
        const updates = {};
        updates[`companies/${currentCompany}/contracts/${currentSendContractId}`] = c;
        updates[`companies/${currentCompany}/workerPendingContracts/${workerId}/${currentSendContractId}`] = true;

        db.ref().update(updates).then(() => {
            if (typeof showInAppNotification === 'function') {
                showInAppNotification(isAr ? `📤 تم إرسال العقد للموظف (${workerName}) بانتظار توقيعه الإلكتروني!` : `📤 Contract sent to (${workerName}) for digital signature!`);
            }
        }).catch(err => console.error("Error sending contract:", err));
    }
}
window.confirmSendContractToWorker = confirmSendContractToWorker;

// 5. DELETE CONTRACT
function deleteContract(contractId) {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا العقد نهائياً؟' : 'Are you sure you want to delete this contract?')) {
        return;
    }

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    if (data.contracts && data.contracts[contractId]) delete data.contracts[contractId];

    if (typeof appData !== 'undefined' && currentCompany && appData[currentCompany]?.contracts) {
        delete appData[currentCompany].contracts[contractId];
    }

    renderContractsSection();

    if (typeof db !== 'undefined' && currentCompany) {
        db.ref(`companies/${currentCompany}/contracts/${contractId}`).remove().then(() => {
            if (typeof showInAppNotification === 'function') {
                showInAppNotification(isAr ? '🗑️ تم حذف العقد.' : '🗑️ Contract deleted.');
            }
        }).catch(err => console.error("Error deleting contract:", err));
    }
}
window.deleteContract = deleteContract;

// 6. VIEW CONTRACT AS PDF (A4 DOCUMENT MODAL)
var currentViewingContractId = null;

function viewContractAsPDF(contractId) {
    currentViewingContractId = contractId;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const modal = document.getElementById('modal-contract-pdf-viewer');
    const container = document.getElementById('contract-pdf-paper-container');
    if (!modal || !container) return;

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const c = data.contracts?.[contractId];
    if (!c) return;

    const compName = (typeof currentCompany !== 'undefined' && currentCompany) ? currentCompany.toUpperCase() : 'MVC FRESH';
    const isSigned = (c.status === 'signed' || !!c.signatureDataUrl || !!c.signedAt);
    const dateStr = c.createdAt ? new Date(c.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    const signDateStr = c.signedAt ? new Date(c.signedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (c.signDate || '');

    let bodyHTML = '';
    if (c.type === 'image') {
        bodyHTML = `
            <div style="text-align: center; margin: 15px 0;">
                <img src="${c.imageUrl}" style="max-width: 100%; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.08);" alt="Contract Document" />
            </div>
        `;
    } else {
        const formattedText = (c.content || '').split('\n').map(p => p.trim() ? `<p style="margin-bottom: 12px; line-height: 1.8; text-align: justify; font-size: 1rem; color: #1e293b;">${escapeHtml(p)}</p>` : '<br/>').join('');
        bodyHTML = `
            <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #1e293b; line-height: 1.8; margin: 20px 0;">
                ${formattedText}
            </div>
        `;
    }

    const signatureBlockHTML = isSigned ? `
        <div style="margin-top: 35px; padding-top: 20px; border-top: 2px solid #cbd5e1; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: flex-end;">
            <!-- First Party (Company) -->
            <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #f8fafc; text-align: center;">
                <div style="font-weight: 800; font-size: 0.9rem; color: #475569; margin-bottom: 6px;">طرف أول (المنشأة / الشركة)</div>
                <div style="font-weight: 900; font-size: 1rem; color: #0f172a;">${compName}</div>
                <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px;">ختم واعتماد الإدارة الإلكتروني ✅</div>
            </div>

            <!-- Second Party (Worker Signature) -->
            <div style="border: 2px solid #10b981; border-radius: 12px; padding: 14px; background: #ecfdf5; text-align: center; position: relative;">
                <div style="font-weight: 800; font-size: 0.9rem; color: #065f46; margin-bottom: 4px;">طرف ثانٍ (الموظف الموقع)</div>
                <div style="font-weight: 900; font-size: 1.05rem; color: #047857; margin-bottom: 8px;">${c.workerName || 'الموظف'}</div>
                
                ${c.signatureDataUrl ? `
                    <div style="background: white; border: 1px dashed #10b981; border-radius: 8px; padding: 6px; margin: 6px auto; max-width: 220px;">
                        <img src="${c.signatureDataUrl}" style="max-height: 70px; max-width: 100%; display: block; margin: 0 auto;" alt="Digital Signature" />
                    </div>
                ` : ''}

                <div style="font-size: 0.75rem; color: #047857; font-weight: 700; margin-top: 4px;">
                    📅 تم التوقيع إلكترونياً بتاريخ: ${signDateStr}
                </div>
                <div style="display: inline-block; background: #10b981; color: white; padding: 2px 8px; border-radius: 100px; font-size: 0.7rem; font-weight: 800; margin-top: 4px;">
                    VERIFIED DIGITAL SIGNATURE
                </div>
            </div>
        </div>
    ` : `
        <div style="margin-top: 35px; padding-top: 20px; border-top: 2px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center; background: #fffbeb; padding: 14px; border-radius: 10px; border: 1px dashed #f59e0b; flex-wrap: wrap; gap: 10px;">
            <div style="color: #b45309; font-weight: 800; font-size: 0.9rem;">
                ⏳ ${isAr ? `حالة العقد: بانتظار توقيع الموظف (${c.workerName || 'غير مسند'})` : `Contract Status: Pending Signature (${c.workerName || 'Unassigned'})`}
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button type="button" onclick="openWorkerContractSignModal('${c.id}')" class="btn-success" style="padding: 8px 16px; font-weight: 800; font-size: 0.85rem; border-radius: 8px; background: linear-gradient(135deg, #10b981, #059669); border: none; color: white; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(16,185,129,0.3);">
                    <span>✍️</span> <span>${isAr ? 'توقيع العقد الآن' : 'Sign Contract Now'}</span>
                </button>
                <button type="button" onclick="openSendContractModal('${c.id}')" class="btn-primary" style="padding: 8px 16px; font-weight: 800; font-size: 0.85rem; border-radius: 8px; background: #4f46e5; border: none; color: white; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                    <span>📤</span> <span>${isAr ? 'إرسال لموظف آخر' : 'Send to Worker'}</span>
                </button>
            </div>
        </div>
    `;

    container.innerHTML = `
        <div class="a4-contract-page" style="background: #ffffff; color: #0f172a; padding: 35px 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); max-width: 800px; margin: 0 auto; width: 100%; box-sizing: border-box; border: 1px solid #e2e8f0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif;">
            
            <!-- A4 Document Official Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #0f172a; padding-bottom: 14px; margin-bottom: 20px;">
                <div>
                    <h1 style="margin: 0; font-size: 1.4rem; font-weight: 900; color: #0f172a; letter-spacing: 0.5px;">${compName}</h1>
                    <div style="font-size: 0.8rem; color: #64748b; font-weight: 700; margin-top: 2px;">إدارة الموارد البشرية والعمليات القانونية</div>
                </div>
                <div style="text-align: left; font-size: 0.78rem; color: #475569; font-weight: 700;">
                    <div>رقم المرجع: #${c.id.substring(0, 12).toUpperCase()}</div>
                    <div>تاريخ الإصدار: ${dateStr}</div>
                </div>
            </div>

            <!-- Title -->
            <div style="text-align: center; margin: 18px 0;">
                <h2 style="margin: 0; font-size: 1.3rem; font-weight: 900; color: #0f172a; text-decoration: underline; text-underline-offset: 6px;">
                    ${escapeHtml(c.title)}
                </h2>
            </div>

            <!-- Body (Text or Image) -->
            ${bodyHTML}

            <!-- Bottom Signatures Block -->
            ${signatureBlockHTML}

            <!-- Official Footer Watermark -->
            <div style="margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 0.72rem; color: #94a3b8; font-weight: 600;">
                وثيقة رسمية صادرة من لوحة تحكم ${compName} - معتمدة ومحفوظة إلكترونياً
            </div>
        </div>
    `;

    modal.style.display = 'flex';
}
window.viewContractAsPDF = viewContractAsPDF;

function closeContractPDFViewer() {
    const modal = document.getElementById('modal-contract-pdf-viewer');
    if (modal) modal.style.display = 'none';
    currentViewingContractId = null;
}
window.closeContractPDFViewer = closeContractPDFViewer;

// Print / Export Contract PDF directly
function printContractPDF(contractId) {
    const id = contractId || currentViewingContractId;
    if (!id) return;

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const c = data.contracts?.[id];
    if (!c) return;

    viewContractAsPDF(id);
    setTimeout(() => {
        const container = document.getElementById('contract-pdf-paper-container');
        if (!container) return;

        const printHTML = `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>${c.title}</title>
                <style>
                    @media print {
                        html, body { margin: 0 !important; padding: 0 !important; }
                        .a4-contract-page { box-shadow: none !important; border: none !important; padding: 20mm !important; }
                    }
                    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #ffffff; color: #0f172a; margin: 0; padding: 15mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                </style>
            </head>
            <body>
                ${container.innerHTML}
            </body>
            </html>
        `;

        const blob = new Blob([printHTML], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.src = url;
        document.body.appendChild(iframe);

        iframe.onload = function() {
            setTimeout(function() {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(url);
                }, 2000);
            }, 300);
        };
    }, 200);
}
window.printContractPDF = printContractPDF;

// 7. WORKER DIGITAL SIGNATURE SYSTEM (CANVAS MOUSE & TOUCH)
var currentSigningContractId = null;

function openWorkerContractSignModal(contractId) {
    currentSigningContractId = contractId;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const modal = document.getElementById('modal-worker-contract-sign');
    const contractBodyContainer = document.getElementById('worker-sign-contract-body');
    const dateInput = document.getElementById('worker-signature-date');
    if (!modal) return;

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const c = data.contracts?.[contractId];
    if (!c) return;

    // Set today's date in YYYY-MM-DD
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    if (contractBodyContainer) {
        if (c.type === 'image') {
            contractBodyContainer.innerHTML = `
                <div style="text-align:center; padding: 10px;">
                    <img src="${c.imageUrl}" style="max-width: 100%; border-radius: 8px; border: 1px solid var(--border-color);" alt="Contract" />
                </div>
            `;
        } else {
            const formattedText = (c.content || '').split('\n').map(p => p.trim() ? `<p style="margin-bottom: 12px; line-height: 1.7; font-size: 0.95rem; color: var(--text-main);">${escapeHtml(p)}</p>` : '<br/>').join('');
            contractBodyContainer.innerHTML = `
                <div style="background: var(--input-bg); padding: 18px; border-radius: 12px; border: 1px solid var(--border-color); max-height: 280px; overflow-y: auto;">
                    <h3 style="margin: 0 0 12px 0; color: var(--text-main); font-weight: 800; font-size: 1.1rem;">${escapeHtml(c.title)}</h3>
                    ${formattedText}
                </div>
            `;
        }
    }

    modal.style.display = 'flex';
    setTimeout(initWorkerSignaturePad, 100);
}
window.openWorkerContractSignModal = openWorkerContractSignModal;

function closeWorkerContractSignModal() {
    const modal = document.getElementById('modal-worker-contract-sign');
    if (modal) modal.style.display = 'none';
    currentSigningContractId = null;
}
window.closeWorkerContractSignModal = closeWorkerContractSignModal;

// Initialize HTML5 Canvas Signature Pad (Mouse + Touch)
function initWorkerSignaturePad() {
    const canvas = document.getElementById('worker-signature-canvas');
    if (!canvas) return;

    signatureCanvasCtx = canvas.getContext('2d');
    signatureHasDrawn = false;

    // Adjust canvas resolution for sharp display
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 450;
    canvas.height = 140;

    signatureCanvasCtx.strokeStyle = '#0f172a';
    signatureCanvasCtx.lineWidth = 2.5;
    signatureCanvasCtx.lineCap = 'round';
    signatureCanvasCtx.lineJoin = 'round';

    // Clear canvas
    signatureCanvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    function getCanvasCoords(e) {
        const r = canvas.getBoundingClientRect();
        if (e.touches && e.touches[0]) {
            return {
                x: e.touches[0].clientX - r.left,
                y: e.touches[0].clientY - r.top
            };
        }
        return {
            x: e.clientX - r.left,
            y: e.clientY - r.top
        };
    }

    function startDraw(e) {
        e.preventDefault();
        signatureDrawing = true;
        const coords = getCanvasCoords(e);
        signatureCanvasCtx.beginPath();
        signatureCanvasCtx.moveTo(coords.x, coords.y);
    }

    function draw(e) {
        if (!signatureDrawing) return;
        e.preventDefault();
        const coords = getCanvasCoords(e);
        signatureCanvasCtx.lineTo(coords.x, coords.y);
        signatureCanvasCtx.stroke();
        signatureHasDrawn = true;
    }

    function endDraw(e) {
        if (signatureDrawing) {
            signatureDrawing = false;
        }
    }

    // Mouse Events (PC)
    canvas.onmousedown = startDraw;
    canvas.onmousemove = draw;
    canvas.onmouseup = endDraw;
    canvas.onmouseleave = endDraw;

    // Touch Events (Mobile / Web / Tablet)
    canvas.ontouchstart = startDraw;
    canvas.ontouchmove = draw;
    canvas.ontouchend = endDraw;
    canvas.ontouchcancel = endDraw;
}
window.initWorkerSignaturePad = initWorkerSignaturePad;

function clearWorkerSignature() {
    const canvas = document.getElementById('worker-signature-canvas');
    if (!canvas || !signatureCanvasCtx) return;
    signatureCanvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    signatureHasDrawn = false;
}
window.clearWorkerSignature = clearWorkerSignature;

// Submit Signed Contract
function submitSignedWorkerContract() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (!currentSigningContractId) return;

    if (!signatureHasDrawn) {
        alert(isAr ? 'يرجى رسم توقيعك في المربع المخصص قبل الإرسال.' : 'Please draw your signature in the box before submitting.');
        return;
    }

    const agreeCheck = document.getElementById('worker-agree-terms-check');
    if (agreeCheck && !agreeCheck.checked) {
        alert(isAr ? 'يرجى التأشير بالموافقة على بنود العقد.' : 'Please check the agreement confirmation checkbox.');
        return;
    }

    const dateInput = document.getElementById('worker-signature-date');
    const signDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];

    const canvas = document.getElementById('worker-signature-canvas');
    const signatureDataUrl = canvas ? canvas.toDataURL('image/png') : '';

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    if (!data.contracts) data.contracts = {};
    const c = data.contracts[currentSigningContractId];
    if (!c) return;

    const now = Date.now();
    c.status = 'signed';
    c.signedAt = now;
    c.signDate = signDate;
    c.signatureDataUrl = signatureDataUrl;

    // If workerName is not set, resolve from currentUser or active worker
    if (!c.workerName || c.workerName === 'غير مسند' || c.workerName === 'Unassigned') {
        const workers = data.workers || [];
        const opsWorkerSelect = document.getElementById('ops-worker-select');
        const selectedWorkerId = opsWorkerSelect ? opsWorkerSelect.value : '';
        let matched = null;
        if (c.workerId) matched = workers.find(w => w.id === c.workerId);
        if (!matched && selectedWorkerId) matched = workers.find(w => w.id === selectedWorkerId);
        if (!matched && typeof currentUser !== 'undefined' && currentUser && currentUser.email) {
            matched = workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
        }
        if (matched) {
            c.workerId = matched.id;
            c.workerName = matched.name;
        } else if (typeof currentUser !== 'undefined' && currentUser) {
            c.workerName = currentUser.name || currentUser.email || (isAr ? 'الموظف الموقع' : 'Signed Employee');
        }
    }

    // Persist in local memory
    data.contracts[currentSigningContractId] = c;
    if (typeof appData !== 'undefined' && currentCompany && appData[currentCompany]) {
        if (!appData[currentCompany].contracts) appData[currentCompany].contracts = {};
        appData[currentCompany].contracts[currentSigningContractId] = c;
    }

    const savedId = currentSigningContractId;
    closeWorkerContractSignModal();

    // If PDF viewer was open, refresh it live with the new signature
    const pdfModal = document.getElementById('modal-contract-pdf-viewer');
    if (pdfModal && pdfModal.style.display !== 'none') {
        viewContractAsPDF(savedId);
    }

    renderWorkerOperationsContractBanner();
    renderContractsSection();

    if (typeof db !== 'undefined' && currentCompany) {
        const updates = {};
        updates[`companies/${currentCompany}/contracts/${savedId}`] = c;
        if (c.workerId) {
            updates[`companies/${currentCompany}/workerPendingContracts/${c.workerId}/${savedId}`] = null;
        }

        db.ref().update(updates).then(() => {
            if (typeof showInAppNotification === 'function') {
                showInAppNotification(isAr ? '✅ تم توقيع العقد وإرساله للإدارة بنجاح!' : '✅ Contract signed and submitted to administration successfully!');
            }
        }).catch(err => console.error("Error saving signed contract:", err));
    }
}
window.submitSignedWorkerContract = submitSignedWorkerContract;

// 8. WORKER OPERATIONS INBOX & DEDICATED CONTRACTS CARD
function renderWorkerOperationsContractBanner() {
    const card = document.getElementById('worker-ops-contracts-card');
    const legacyBanner = document.getElementById('worker-ops-contracts-banner');
    if (legacyBanner) legacyBanner.style.display = 'none';
    if (!card) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const contractsObj = data.contracts || {};
    const allContracts = Object.values(contractsObj);
    const workers = data.workers || [];

    const currentEmail = (typeof currentUser !== 'undefined' && currentUser && currentUser.email) ? currentUser.email.toLowerCase() : '';
    const isAdmin = (typeof currentUser !== 'undefined' && currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.isAdmin));
    
    // Determine the target worker:
    const opsWorkerSelect = document.getElementById('ops-worker-select');
    const selectedWorkerId = opsWorkerSelect ? opsWorkerSelect.value : '';
    
    let targetWorker = null;
    if (selectedWorkerId) {
        targetWorker = workers.find(w => w.id === selectedWorkerId);
    }
    if (!targetWorker && !isAdmin && currentEmail) {
        targetWorker = workers.find(w => w.email && w.email.toLowerCase() === currentEmail);
    }

    // Filter contracts relevant to target worker (or all pending contracts if admin without selection)
    let workerContracts = [];
    if (targetWorker) {
        workerContracts = allContracts.filter(c => {
            if (!c) return false;
            if (c.workerId && c.workerId === targetWorker.id) return true;
            if (c.workerEmail && targetWorker.email && c.workerEmail.toLowerCase() === targetWorker.email.toLowerCase()) return true;
            if (c.workerName && targetWorker.name && c.workerName.trim().toLowerCase() === targetWorker.name.trim().toLowerCase()) return true;
            return false;
        });
    } else if (isAdmin) {
        // Admin overview: show all contracts or all pending contracts
        workerContracts = allContracts;
    } else {
        // Fallback for worker: match by email or name
        workerContracts = allContracts.filter(c => {
            if (!c) return false;
            if (c.workerEmail && currentEmail && c.workerEmail.toLowerCase() === currentEmail) return true;
            return false;
        });
    }

    const pendingContracts = workerContracts.filter(c => c && c.status === 'pending_signature');
    const signedContracts = workerContracts.filter(c => c && c.status === 'signed');

    let contentHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.6rem;">📜</span>
                <div>
                    <h2 class="card-title" style="margin: 0; font-size: 1.15rem; font-weight: 900; color: var(--text-main);">
                        ${isAr ? 'العقود والاتفاقيات الرسمية والتوقيع الإلكتروني' : 'Official Contracts & Digital Signature'}
                    </h2>
                    <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-top: 2px;">
                        ${targetWorker ? (isAr ? `الموظف: ${targetWorker.name}` : `Worker: ${targetWorker.name}`) : (isAr ? 'صندوق العقود' : 'Contracts Box')}
                    </div>
                </div>
            </div>
            ${isAdmin ? `
                <button type="button" onclick="switchTab('contracts')" class="btn-outline" style="padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 800; border: 1px solid var(--primary); color: var(--primary); cursor: pointer;">
                    ${isAr ? '⚙️ إدارة كافة العقود' : '⚙️ Manage All Contracts'}
                </button>
            ` : ''}
        </div>
    `;

    // 1. PENDING CONTRACTS WAITING FOR SIGNATURE
    if (pendingContracts.length > 0) {
        contentHTML += `
            <div style="background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.1)); border: 2px solid #f59e0b; border-radius: 14px; padding: 16px; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                    <span style="font-size: 1.3rem;">⚠️</span>
                    <strong style="color: #d97706; font-size: 1rem; font-weight: 900;">
                        ${isAr ? `يوجد (${pendingContracts.length}) عقد رسمي بانتظار التوقيع الإلكتروني!` : `You have (${pendingContracts.length}) contract(s) waiting for digital signature!`}
                    </strong>
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${pendingContracts.map(c => {
                        const dateFormatted = c.createdAt ? new Date(c.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
                        return `
                            <div style="background: var(--card-bg); border: 1px solid #f59e0b; border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                                <div>
                                    <h4 style="margin: 0 0 4px 0; font-size: 0.95rem; font-weight: 800; color: var(--text-main);">${typeof escapeHtml === 'function' ? escapeHtml(c.title) : c.title}</h4>
                                    <div style="font-size: 0.78rem; color: var(--text-muted);">
                                        <span>📅 ${isAr ? 'تاريخ الإصدار' : 'Issued'}: ${dateFormatted}</span>
                                        ${c.workerName ? `<span style="margin-right: 10px; margin-left: 10px;">👤 ${c.workerName}</span>` : ''}
                                    </div>
                                </div>
                                <button type="button" onclick="openWorkerContractSignModal('${c.id}')" class="btn-success" style="padding: 8px 18px; border-radius: 8px; font-weight: 900; font-size: 0.85rem; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; cursor: pointer; box-shadow: 0 4px 10px rgba(16,185,129,0.3); display: inline-flex; align-items: center; gap: 6px;">
                                    <span>✍️</span> <span>${isAr ? 'مراجعة وتوقيع العقد الآن' : 'Review & Sign Contract'}</span>
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // 2. SIGNED CONTRACTS ARCHIVE
    if (signedContracts.length > 0) {
        contentHTML += `
            <div style="margin-top: 12px;">
                <h4 style="margin: 0 0 10px 0; font-size: 0.9rem; font-weight: 800; color: #10b981; display: flex; align-items: center; gap: 6px;">
                    <span>✅</span> <span>${isAr ? 'العقود الموقعة والمعتمدة' : 'Signed & Verified Contracts'}</span>
                </h4>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${signedContracts.map(c => {
                        const signDateFormatted = c.signedAt ? new Date(c.signedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (c.signDate || '');
                        return `
                            <div style="background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                                <div>
                                    <div style="font-weight: 800; font-size: 0.9rem; color: var(--text-main);">${typeof escapeHtml === 'function' ? escapeHtml(c.title) : c.title}</div>
                                    <div style="font-size: 0.75rem; color: #10b981; font-weight: 700; margin-top: 2px;">
                                        ✍️ ${isAr ? 'تم التوقيع بنجاح في' : 'Signed on'}: ${signDateFormatted}
                                    </div>
                                </div>
                                <div style="display: flex; gap: 6px;">
                                    <button type="button" onclick="viewContractAsPDF('${c.id}')" class="btn-primary" style="padding: 5px 12px; border-radius: 6px; font-weight: 700; font-size: 0.78rem; background: linear-gradient(135deg, #4f46e5, #3730a3); border: none; color: white; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                                        <span>👁️</span> <span>${isAr ? 'عرض العقد (PDF)' : 'View PDF'}</span>
                                    </button>
                                    <button type="button" onclick="printContractPDF('${c.id}')" class="btn-outline" style="padding: 5px 12px; border-radius: 6px; font-weight: 700; font-size: 0.78rem; border: 1px solid #10b981; color: #10b981; background: rgba(16,185,129,0.08); cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                                        <span>🖨️</span> <span>${isAr ? 'طباعة' : 'Print'}</span>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // 3. IF NO PENDING AND NO SIGNED CONTRACTS
    if (pendingContracts.length === 0 && signedContracts.length === 0) {
        contentHTML += `
            <div style="text-align: center; padding: 20px 14px; background: var(--input-bg); border-radius: 10px; border: 1px dashed var(--border-color);">
                <div style="font-size: 2rem; margin-bottom: 6px;">📜</div>
                <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-main);">
                    ${isAr ? 'لا توجد عقود معلقة أو موقعة لهذا الحساب حالياً.' : 'No pending or signed contracts for this account at the moment.'}
                </div>
                <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: var(--text-muted);">
                    ${isAr ? 'عندما ترسل الإدارة عقداً جديداً لك، سيظهر هنا فوراً مع زر التوقيع الإلكتروني.' : 'When administration sends you a contract, it will appear here immediately for your digital signature.'}
                </p>
            </div>
        `;
    }

    card.innerHTML = contentHTML;
}
window.renderWorkerOperationsContractBanner = renderWorkerOperationsContractBanner;

// Auto-trigger on init
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (typeof renderWorkerOperationsContractBanner === 'function') renderWorkerOperationsContractBanner();
        });
    } else {
        setTimeout(() => {
            if (typeof renderWorkerOperationsContractBanner === 'function') renderWorkerOperationsContractBanner();
        }, 150);
    }
}
