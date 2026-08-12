/**
 * Kitchen prepare view, status updates & A4 printable receipt modal
 */

function renderPrepareSection() {
    const grid = document.getElementById('prepare-orders-grid');
    if (!grid) return;

    const isAr = currentAppLang === 'ar';
    const filterStatus = document.getElementById('prepare-status-filter')?.value || 'all';

    // Populate Multi-Worker Preparing Staff Assignment HUD
    const prepAddSelect = document.getElementById('prepare-add-worker-select');
    const prepBadgesDiv = document.getElementById('prepare-assigned-workers-badges');
    const staffCountLabel = document.getElementById('prepare-staff-count-label');

    if (prepAddSelect && prepBadgesDiv) {
        const companyData = getCompanyData();
        const workers = companyData.workers || [];

        let assigned = companyData.assignedPreparingWorkerIds || [];
        if (!Array.isArray(assigned)) {
            assigned = companyData.assignedPreparingWorkerId ? [String(companyData.assignedPreparingWorkerId)] : [];
        }
        const assignedStrs = assigned.map(id => String(id));

        if (staffCountLabel) {
            staffCountLabel.textContent = isAr 
                ? `طاقم التحضير (${assignedStrs.length})` 
                : `Preparing Staff (${assignedStrs.length})`;
        }

        // Populate dropdown with unassigned workers
        prepAddSelect.innerHTML = `<option value="" style="background: var(--card-bg); color: var(--text-main); font-weight: 800;">+ ${isAr ? 'إضافة موظف' : 'Add Staff'}</option>` + workers.map((w, idx) => {
            if (!w) return '';
            const wId = String(w.id || idx);
            if (assignedStrs.includes(wId)) return '';
            return `<option value="${wId}" style="background: var(--card-bg); color: var(--text-main); font-weight: 800;">${w.name || `Worker #${idx}`}</option>`;
        }).join('');

        // Render active worker avatar cards
        if (assignedStrs.length === 0) {
            prepBadgesDiv.innerHTML = `<span style="font-size:0.8rem; color:var(--text-muted); font-weight:700; font-style:italic;">${isAr ? '⚠️ لم يتم تعيين موظفي تحضير بعد (اضغط + إضافة موظف)' : '⚠️ No preparing staff assigned yet (Click + Add Staff)'}</span>`;
        } else {
            prepBadgesDiv.innerHTML = assignedStrs.map(wId => {
                const wObj = workers.find(w => w && String(w.id || '') === wId);
                const wName = wObj ? wObj.name : `Worker #${wId}`;
                const initial = wName.trim().charAt(0).toUpperCase() || 'W';
                const phone = wObj ? (wObj.phone || '') : '';
                const roleLabel = wObj && wObj.role ? wObj.role : (isAr ? 'محضر طلبات' : 'Prep Worker');

                return `
                    <div class="prep-worker-card-chip" style="background: var(--input-bg); border: 1.5px solid var(--border-color); border-radius: 12px; padding: 5px 10px 5px 6px; display: inline-flex; align-items: center; gap: 8px; box-shadow: var(--shadow-sm); transition: all 0.2s ease;">
                        <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.8rem; box-shadow: 0 2px 6px rgba(245,158,11,0.3);">
                            ${initial}
                            <span style="position: absolute; bottom: -1px; right: -1px; width: 8px; height: 8px; border-radius: 50%; background: #10b981; border: 1.5px solid var(--card-bg);"></span>
                        </div>
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-weight: 900; font-size: 0.82rem; color: var(--text-main); line-height: 1.1;">${wName}</span>
                            <span style="font-size: 0.68rem; color: var(--text-muted); font-weight: 700;">${phone ? `📱 ${phone}` : roleLabel}</span>
                        </div>
                        <button type="button" onclick="togglePreparingWorkerAssignment('${wId}')" style="background: rgba(239,68,68,0.12); border: none; color: #ef4444; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 900; cursor: pointer; line-height: 1; transition: all 0.2s ease; margin-left: 2px;" title="${isAr ? 'إزالة من طاقم التحضير' : 'Remove from staff'}" onmouseover="this.style.background='#ef4444'; this.style.color='#ffffff';" onmouseout="this.style.background='rgba(239,68,68,0.12)'; this.style.color='#ef4444';">✕</button>
                    </div>
                `;
            }).join('');
        }
    }

    // Collect market orders across ALL loaded companies
    const companyList = ['mvc', 'mvcfresh', 'burgeroov'];
    let allOrders = [];

    companyList.forEach(cKey => {
        const cOrdersObj = appData[cKey]?.marketOrders || {};
        Object.values(cOrdersObj).forEach(order => {
            if (order && order.id && order.status !== 'cancelled' && order.status !== 'canceled') {
                allOrders.push({ ...order, companyKey: cKey });
            }
        });
    });

    // De-duplicate orders by order.id
    const uniqueMap = {};
    allOrders.forEach(o => { uniqueMap[o.id] = o; });
    allOrders = Object.values(uniqueMap);

    allOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (filterStatus !== 'all') {
        allOrders = allOrders.filter(o => o.status === filterStatus);
    }

    if (allOrders.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--input-bg); border-radius: 20px; border: 2px dashed var(--border-color); max-width: 650px; margin: 0 auto; width: 100%;">
                <div style="font-size: 4rem; margin-bottom: 14px;">👨‍🍳</div>
                <h3 style="margin: 0 0 10px 0; color: var(--text-main); font-size: 1.3rem; font-weight: 900;">${isAr ? 'لا توجد طلبات في قائمة التحضير حالياً' : 'No Preparation Orders Found'}</h3>
                <p style="margin: 0; color: var(--text-muted); font-size: 0.95rem; line-height: 1.6;">${isAr ? 'ستظهر جميع طلبات العملاء المشتراة هنا تلقائياً ولحظياً لمتابعتها وتحضيرها.' : 'Purchased customer orders will appear here automatically in real time for kitchen prep.'}</p>
            </div>
        `;
        return;
    }

    const isAdminOrMgr = typeof isUserAdminOrManager === 'function' ? isUserAdminOrManager() : true;
    const canDelete = isAdminOrMgr || !!(typeof currentUser !== 'undefined' && currentUser && (currentUser.canDeletePrepareOrders || currentUser.role === 'operations'));

    grid.innerHTML = allOrders.map(order => {
        const orderNum = formatMarketOrderNum(order);
        const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString() : '';
        const companyName = (order.companyKey || 'MVC').toUpperCase();
        const statusInfo = getMarketOrderStatusInfo(order.status);
        const orderJsonStr = JSON.stringify(order).replace(/'/g, "&#39;").replace(/"/g, "&quot;");

        const itemsHTML = (order.items || []).map(item => `
            <div style="display: flex; justify-content: space-between; align- items: center; padding: 10px 14px; background: var(--input-bg); border-radius: 12px; font-size: 0.92rem; border: 1px solid var(--border-color);">
                <span style="font-weight: 900; color: var(--text-main); font-size: 0.95rem;">${sanitizeMarketText(item.name)}</span>
                <span style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; font-weight: 900; font-size: 0.85rem; padding: 4px 12px; border-radius: 100px; box-shadow: 0 2px 6px rgba(37,99,235,0.3);">x${item.qty || 1}</span>
            </div>
        `).join('');

        const deleteBtnHTML = canDelete ? `
            <button type="button" onclick="deletePrepareOrderAndRefund('${order.companyKey}', '${order.id}')" class="btn-danger" style="padding: 10px 14px; font-weight: 900; font-size: 0.82rem; border-radius: 10px; cursor: pointer; border: none; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; white-space: nowrap; box-shadow:0 2px 6px rgba(239,68,68,0.3);" title="${isAr ? 'حذف الطلب وإعادة الرصيد' : 'Delete Order & Refund SR'}">
                🗑️ ${isAr ? 'إلغاء وحذف' : 'Delete'}
            </button>
        ` : '';

        return `
            <div class="card" style="margin: 0; padding: 20px; border-radius: 20px; border: 2px solid ${statusInfo.color}; background: var(--card-bg); display: flex; flex-direction: column; justify-content: space-between; gap: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); transition: transform 0.2s ease;">
                <div>
                    <!-- Order Header Box -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 14px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-weight: 900; font-size: 1.25rem; color: #10b981; font-family: monospace, system-ui, sans-serif; letter-spacing: 0.5px;">${orderNum}</span>
                            </div>
                            <div style="font-size: 0.88rem; font-weight: 900; color: var(--text-main); margin-top: 4px;">👤 ${sanitizeMarketText(order.workerName || 'Customer')}</div>
                            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">📅 ${dateStr}</div>
                        </div>
                        <span class="badge" style="background: rgba(37,99,235,0.12); color: #2563eb; font-size: 0.8rem; font-weight: 900; padding: 5px 14px; border-radius: 100px; border: 1px solid #2563eb; letter-spacing: 0.5px;">
                            🏢 ${companyName}
                        </span>
                    </div>

                    <!-- Items List -->
                    <div style="display: flex; flex-direction: column; gap: 8px; margin: 12px 0;">
                        ${itemsHTML}
                    </div>
                </div>

                <!-- Footer Status Selector, Receipt & Delete Buttons -->
                <div style="border-top: 1px dashed var(--border-color); padding-top: 14px; display: flex; flex-direction: column; gap: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <select onchange="updatePrepareOrderStatus('${order.companyKey}', '${order.id}', this.value)" style="flex: 1; min-width: 140px; padding: 10px 12px; border-radius: 10px; border: 1.5px solid var(--border-color); font-weight: 900; font-size: 0.88rem; background: var(--input-bg); color: var(--text-main); cursor: pointer;">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ Pending / قيد الانتظار</option>
                            <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>👨‍🍳 Preparing / قيد التحضير</option>
                            <option value="delivery" ${order.status === 'delivery' ? 'selected' : ''}>🚚 Out for Delivery / خرج للتوصيل</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>✅ Delivered / تم التوصيل</option>
                        </select>
                        <button type="button" onclick='openMarketOrderReceiptModal(${orderJsonStr})' class="btn-outline" style="padding: 10px 14px; font-weight: 900; font-size: 0.88rem; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap; background: var(--input-bg);">
                            🧾 ${isAr ? 'الفاتورة' : 'Receipt'}
                        </button>
                        ${deleteBtnHTML}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}
window.renderPrepareSection = renderPrepareSection;

function updatePrepareOrderStatus(companyKey, orderId, newStatus) {
    const isAr = currentAppLang === 'ar';
    if (!orderId || !newStatus) return;
    const targetComp = companyKey || currentCompany;

    if (newStatus === 'cancelled') {
        cancelMarketOrder(orderId, targetComp);
        return;
    }

    db.ref(`companies/${targetComp}/marketOrders/${orderId}/status`).set(newStatus).then(() => {
        renderPrepareSection();
        renderAdminMarketOrders();
        renderCustomerOrders();
        showInAppNotification(isAr ? `تم تحديث حالة طلب التحضير إلى: ${newStatus}` : `Prepare order status updated: ${newStatus}`);
    }).catch(err => {
        console.error("Error updating prepare order status:", err);
        alert(isAr ? 'حدث خطأ أثناء تحديث الحالة.' : 'Error updating status.');
    });
}
window.updatePrepareOrderStatus = updatePrepareOrderStatus;

// ==========================================
// MARKET FEEDBACK & COMPLAINTS (الشكاوي والاقتراحات)
// ==========================================
window.globalMarketFeedbackCache = {};
window.hasInitMarketFeedbackListener = false;

function initAdminMarketFeedbackListener() {
    if (typeof db === 'undefined' || window.hasInitMarketFeedbackListener) return;
    window.hasInitMarketFeedbackListener = true;

    db.ref(`companies/${currentCompany}/marketFeedback`).on('value', snapshot => {
        const val = snapshot.exists() ? snapshot.val() : {};
        window.globalMarketFeedbackCache = val;

        const list = Object.values(val);
        const unreadCount = list.filter(item => item && item.status !== 'resolved' && item.status !== 'read').length;

        const badge = document.getElementById('market-admin-feedback-unread-badge');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
        }

        const modal = document.getElementById('admin-market-feedback-modal');
        if (modal && modal.style.display === 'flex') {
            renderAdminMarketFeedbackList();
        }
    });
}
window.initAdminMarketFeedbackListener = initAdminMarketFeedbackListener;

function openMarketFeedbackModal() {
    const modal = document.getElementById('market-feedback-modal');
    if (modal) modal.style.display = 'flex';
}
window.openMarketFeedbackModal = openMarketFeedbackModal;

function closeMarketFeedbackModal() {
    const modal = document.getElementById('market-feedback-modal');
    if (modal) modal.style.display = 'none';
    const txt = document.getElementById('market-feedback-text');
    if (txt) txt.value = '';
}
window.closeMarketFeedbackModal = closeMarketFeedbackModal;

function submitMarketFeedback() {
    const isAr = currentAppLang === 'ar';
    const txtEl = document.getElementById('market-feedback-text');
    const text = (txtEl?.value || '').trim();
    if (!text) {
        alert(isAr ? 'يرجى كتابة نص الملاحظة أو الشكوى.' : 'Please enter your feedback text.');
        return;
    }

    const isCustomer = !!(typeof currentCustomerSession !== 'undefined' && currentCustomerSession);
    const custCode = isCustomer ? String(currentCustomerSession.code || currentCustomerSession.id).trim() : '';
    const custName = isCustomer
        ? (currentCustomerSession.name || 'Customer (' + custCode + ')')
        : ((typeof currentWorkerProfile !== 'undefined' && currentWorkerProfile)
            ? (currentWorkerProfile.name || currentWorkerProfile.email)
            : ((typeof currentUser !== 'undefined' && currentUser && currentUser.email) ? currentUser.email : 'Worker'));

    const now = Date.now();
    const feedbackId = 'fb_' + now;

    const fbObj = {
        id: feedbackId,
        companyKey: currentCompany,
        customerCode: custCode,
        customerName: custName,
        text: text,
        status: 'unread',
        createdAt: now
    };

    db.ref(`companies/${currentCompany}/marketFeedback/${feedbackId}`).set(fbObj).then(() => {
        alert(isAr ? 'تم إرسال اقتراحك / شكواك بنجاح للمدير! شكراً لتواصلك معنا. 📩' : 'Your feedback/complaint has been sent successfully to admin! Thank you. 📩');
        closeMarketFeedbackModal();
        if (typeof initAdminMarketFeedbackListener === 'function') {
            initAdminMarketFeedbackListener();
        }
    }).catch(err => {
        console.error("Error submitting feedback:", err);
        alert(isAr ? 'حدث خطأ أثناء الإرسال.' : 'Error sending feedback.');
    });
}
window.submitMarketFeedback = submitMarketFeedback;

function openAdminMarketFeedbackModal() {
    initAdminMarketFeedbackListener();
    renderAdminMarketFeedbackList();
    const modal = document.getElementById('admin-market-feedback-modal');
    if (modal) modal.style.display = 'flex';
}
window.openAdminMarketFeedbackModal = openAdminMarketFeedbackModal;

function closeAdminMarketFeedbackModal() {
    const modal = document.getElementById('admin-market-feedback-modal');
    if (modal) modal.style.display = 'none';
}
window.closeAdminMarketFeedbackModal = closeAdminMarketFeedbackModal;

function renderAdminMarketFeedbackList() {
    const container = document.getElementById('admin-market-feedback-list');
    if (!container) return;

    const isAr = currentAppLang === 'ar';
    const rawData = window.globalMarketFeedbackCache || {};
    const feedbackItems = Object.values(rawData).filter(Boolean);

    feedbackItems.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (feedbackItems.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; background: var(--input-bg); border-radius: 16px; border: 1px dashed var(--border-color);">
                <div style="font-size: 2.5rem; margin-bottom: 6px;">📭</div>
                <h4 style="margin: 0 0 4px 0; font-size: 1rem; color: var(--text-main); font-weight: 800;">${isAr ? 'صندوق الشكاوي والاقتراحات فارغ' : 'Feedback Box is Empty'}</h4>
                <p style="margin: 0; font-size: 0.82rem; color: var(--text-muted);">${isAr ? 'لم يقم أي عميل بإرسال ملاحظات أو شكاوى حتى الآن.' : 'No customer complaints or feedback sent yet.'}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = feedbackItems.map(item => {
        const isResolved = item.status === 'resolved';
        const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString() : '';
        const custInfo = item.customerName || (item.customerCode ? `Customer (${item.customerCode})` : 'Customer');

        return `
            <div class="card" style="margin: 0; padding: 16px; border-radius: 14px; border: 1px solid ${isResolved ? 'var(--border-color)' : '#d97706'}; background: ${isResolved ? 'var(--input-bg)' : 'rgba(217, 119, 6, 0.05)'}; display: flex; flex-direction: column; gap: 12px; transition: all 0.2s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.2rem;">👤</span>
                        <div>
                            <div style="font-weight: 900; font-size: 0.98rem; color: var(--text-main);">${sanitizeMarketText(custInfo)}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${dateStr}</div>
                        </div>
                    </div>
                    
                    <span class="badge" style="background: ${isResolved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(217, 119, 6, 0.15)'}; color: ${isResolved ? '#10b981' : '#d97706'}; font-weight: 900; font-size: 0.8rem; padding: 4px 12px; border-radius: 100px;">
                        ${isResolved ? (isAr ? '✅ تم التعامل' : '✅ Resolved') : (isAr ? '📩 ملاحظة جديدة' : '📩 New Feedback')}
                    </span>
                </div>

                <div style="background: var(--card-bg); padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border-color); font-size: 0.92rem; color: var(--text-main); line-height: 1.5; white-space: pre-wrap; word-break: break-word;">
                    ${sanitizeMarketText(item.text || '')}
                </div>

                <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 2px;">
                    ${!isResolved ? `
                        <button type="button" onclick="toggleMarketFeedbackResolved('${item.id}', true)" class="btn-success" style="padding: 6px 14px; font-weight: 800; font-size: 0.82rem; border-radius: 8px; cursor: pointer; border: none; background: #10b981; color: white; display: flex; align-items: center; gap: 4px;">
                            ✅ ${isAr ? 'تحديد كـ تم التعامل' : 'Mark Resolved'}
                        </button>
                    ` : `
                        <button type="button" onclick="toggleMarketFeedbackResolved('${item.id}', false)" class="btn-outline" style="padding: 6px 14px; font-weight: 800; font-size: 0.82rem; border-radius: 8px; cursor: pointer; border: 1px solid var(--border-color);">
                            ↩️ ${isAr ? 'إعادة للجديد' : 'Mark Unread'}
                        </button>
                    `}
                    <button type="button" onclick="deleteMarketFeedback('${item.id}')" class="btn-danger" style="padding: 6px 12px; font-weight: 800; font-size: 0.82rem; border-radius: 8px; cursor: pointer; border: none; background: #ef4444; color: white; display: flex; align-items: center; gap: 4px;">
                        ✖ ${isAr ? 'حذف' : 'Delete'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}
window.renderAdminMarketFeedbackList = renderAdminMarketFeedbackList;

function toggleMarketFeedbackResolved(fbId, resolved) {
    if (typeof db === 'undefined' || !fbId) return;
    const status = resolved ? 'resolved' : 'unread';
    db.ref(`companies/${currentCompany}/marketFeedback/${fbId}/status`).set(status).then(() => {
        if (window.globalMarketFeedbackCache && window.globalMarketFeedbackCache[fbId]) {
            window.globalMarketFeedbackCache[fbId].status = status;
        }
        renderAdminMarketFeedbackList();
    });
}
window.toggleMarketFeedbackResolved = toggleMarketFeedbackResolved;

function deleteMarketFeedback(fbId) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? 'هل أنت تأكد من حذف هذه الملاحظة/الشكوى؟' : 'Are you sure you want to delete this feedback?')) return;
    if (typeof db === 'undefined' || !fbId) return;

    db.ref(`companies/${currentCompany}/marketFeedback/${fbId}`).remove().then(() => {
        if (window.globalMarketFeedbackCache) {
            delete window.globalMarketFeedbackCache[fbId];
        }
        renderAdminMarketFeedbackList();
    });
}
window.deleteMarketFeedback = deleteMarketFeedback;

// =========================================================================
// AI ASSISTANT (ADMIN ONLY) — Powered by Google Gemini 1.5 Flash API
// =========================================================================

function toggleGeminiSettingsCard() {
    const card = document.getElementById('gemini-key-settings-card');
    if (!card) return;
    const isHidden = card.style.display === 'none';
    card.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
        const input = document.getElementById('gemini-api-key-input');
        if (input) input.value = getGeminiApiKey();
    }
}
window.toggleGeminiSettingsCard = toggleGeminiSettingsCard;

function saveGeminiApiKey() {
    const input = document.getElementById('gemini-api-key-input');
    const msg = document.getElementById('gemini-key-status-msg');
    const key = input?.value?.trim() || '';
    if (!key) {
        localStorage.removeItem('mvc_gemini_api_key');
        if (typeof db !== 'undefined' && currentCompany) {
            db.ref(`companies/${currentCompany}/geminiApiKey`).remove();
        }
        if (msg) {
            msg.style.color = '#eab308';
            msg.textContent = '⚠️ API Key cleared. System will use built-in local command parser.';
        }
        return;
    }

    localStorage.setItem('mvc_gemini_api_key', key);
    if (typeof db !== 'undefined' && currentCompany) {
        db.ref(`companies/${currentCompany}/geminiApiKey`).set(key);
    }

    if (msg) {
        msg.style.color = '#10b981';
        msg.textContent = '✅ Gemini API Key saved and shared across all Admins!';
    }
}
window.saveGeminiApiKey = saveGeminiApiKey;

function _getSecureFallbackAIKey() {
    return _cfgSecret('QVEuQWI4Uk42STE3bXdXQXBxVmxoYVpGbVdIbjFCQk1yWXBmUVUwaVhDUmNZUHRQQ3ZxT3c=');
}

function getGeminiApiKey() {
    if (typeof getCompanyData === 'function') {
        const data = getCompanyData();
        if (data && data.geminiApiKey) {
            return data.geminiApiKey;
        }
    }
    return localStorage.getItem('mvc_gemini_api_key') || _getSecureFallbackAIKey();
}
window.getGeminiApiKey = getGeminiApiKey;

function renderAIChatMessage(role, text, actionBadge = null) {
    const history = document.getElementById('ai-chat-history');
    if (!history) return;

    const isUser = role === 'user';
    const msgDiv = document.createElement('div');
    msgDiv.style.display = 'flex';
    msgDiv.style.gap = '12px';
    msgDiv.style.alignItems = 'flex-start';
    if (isUser) {
        msgDiv.style.flexDirection = 'row-reverse';
    }

    const avatar = document.createElement('div');
    avatar.style.width = '36px';
    avatar.style.height = '36px';
    avatar.style.borderRadius = '12px';
    avatar.style.display = 'flex';
    avatar.style.alignItems = 'center';
    avatar.style.justifyContent = 'center';
    avatar.style.fontSize = '1.2rem';
    avatar.style.flexShrink = '0';

    if (isUser) {
        avatar.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        avatar.style.color = 'white';
        avatar.textContent = '👤';
    } else {
        avatar.style.background = 'linear-gradient(135deg, #4f46e5, #4338ca)';
        avatar.style.color = 'white';
        avatar.textContent = '🤖';
    }

    const bubble = document.createElement('div');
    bubble.style.background = isUser ? 'rgba(16, 185, 129, 0.12)' : 'var(--input-bg)';
    bubble.style.border = isUser ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)';
    bubble.style.padding = '14px 18px';
    bubble.style.borderRadius = isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px';
    bubble.style.maxWidth = '85%';
    bubble.style.fontSize = '0.92rem';
    bubble.style.color = 'var(--text-main)';
    bubble.style.lineHeight = '1.55';
    bubble.style.boxShadow = 'var(--shadow-sm)';

    const sender = document.createElement('div');
    sender.style.fontWeight = '900';
    sender.style.fontSize = '0.82rem';
    sender.style.color = isUser ? '#10b981' : '#6366f1';
    sender.style.marginBottom = '4px';
    sender.textContent = isUser ? 'You (Admin)' : 'MVC AI Assistant';
    bubble.appendChild(sender);

    if (actionBadge) {
        const badgeEl = document.createElement('div');
        badgeEl.style.display = 'inline-flex';
        badgeEl.style.alignItems = 'center';
        badgeEl.style.gap = '6px';
        badgeEl.style.background = 'rgba(79, 70, 229, 0.15)';
        badgeEl.style.color = '#6366f1';
        badgeEl.style.fontWeight = '900';
        badgeEl.style.fontSize = '0.8rem';
        badgeEl.style.padding = '4px 12px';
        badgeEl.style.borderRadius = '100px';
        badgeEl.style.marginBottom = '8px';
        badgeEl.textContent = actionBadge;
        bubble.appendChild(badgeEl);
    }

    const textContent = document.createElement('div');
    textContent.style.whiteSpace = 'pre-wrap';
    textContent.style.wordBreak = 'break-word';
    textContent.textContent = text;
    bubble.appendChild(textContent);

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(bubble);

    history.appendChild(msgDiv);
    history.scrollTop = history.scrollHeight;
}
window.renderAIChatMessage = renderAIChatMessage;

function clearAIChatHistory() {
    const history = document.getElementById('ai-chat-history');
    if (history) {
        history.innerHTML = `
            <div style="display: flex; gap: 12px; align-items: flex-start;">
                <div style="width: 36px; height: 36px; border-radius: 12px; background: linear-gradient(135deg, #4f46e5, #4338ca); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem; flex-shrink: 0; box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);">🤖</div>
                <div style="background: var(--input-bg); border: 1px solid var(--border-color); padding: 14px 18px; border-radius: 4px 18px 18px 18px; max-width: 85%; font-size: 0.92rem; color: var(--text-main); line-height: 1.55; box-shadow: var(--shadow-sm);">
                    <div style="font-weight: 900; font-size: 0.82rem; color: #6366f1; margin-bottom: 4px;">MVC AI Assistant</div>
                    تم مسح المحادثة. كيف يمكنني مساعدتك الآن؟
                </div>
            </div>
        `;
    }
}
window.clearAIChatHistory = clearAIChatHistory;

function sendQuickAIChatPrompt(promptText) {
    const input = document.getElementById('ai-chat-input');
    if (input) {
        input.value = promptText;
        handleAIChatSubmit();
    }
}
window.sendQuickAIChatPrompt = sendQuickAIChatPrompt;

function executeAIToolAction(toolName, args) {
    console.log("Executing AI Tool Action:", toolName, args);
    const isAr = currentAppLang === 'ar';

    if (toolName === 'execute_universal_action') {
        const desc = args.action_description || (isAr ? 'تنفيذ إجراء تلقائي' : 'Auto-executed Action');
        const jsCode = args.javascript_code || '';
        let execSuccess = true;
        let execErr = '';
        if (jsCode) {
            try {
                const fn = new Function(jsCode);
                fn();
                if (typeof renderAll === 'function') renderAll();
            } catch(e) {
                console.error("AI Dynamic Execution Error:", e);
                execSuccess = false;
                execErr = e.message;
            }
        }
        return {
            success: execSuccess,
            message: execSuccess 
                ? (isAr ? `تم تنفيذ الإجراء بنجاح: ${desc}` : `Successfully executed action: ${desc}`)
                : (isAr ? `حدث خطأ أثناء تنفيذ الإجراء: ${execErr}` : `Action execution error: ${execErr}`),
            actionBadge: `⚡ ${desc}`
        };
    }

    if (toolName === 'add_market_product') {
        let rawName = args.name || '';
        let cleanName = rawName
            .replace(/أضف|اضف|تنزيل|نزل|جديد|منتج|منتجات|بسعر|سعر|بكمية|كمية|ريال|ر\.س|SR|ر|س/gi, '')
            .replace(/في|إلى|قسم|أقسام|اللحوم|لحوم|الخضار|خضار|فواكه|الأسماك|أسماك|سمك|اسم|صنف|عنصر/gi, '')
            .replace(/\b(add|product|create|new|price|cost|sr|riyal|category|dept|department|the|name|to|for|in|meat|veggie|veg|fruit|fish)\b/gi, '')
            .replace(/[:"']/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        const name = cleanName || rawName || 'منتج جديد';
        const price = parseFloat(args.price) || 10;
        let cat = args.category || 'meat';
        const weight = args.weight || '';

        // Normalize category
        if (cat.includes('لحم') || cat.includes('لحوم') || cat.includes('meat')) cat = 'meat';
        else if (cat.includes('خضار') || cat.includes('فواكه') || cat.includes('veg')) cat = 'veg_fruit';
        else if (cat.includes('سمك') || cat.includes('أسماك') || cat.includes('fish')) cat = 'fish';

        const prodId = 'mprod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        const prodData = {
            id: prodId,
            name: name,
            category: cat,
            price: price,
            weight: weight,
            weightTag: weight,
            hidden: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        if (typeof db !== 'undefined') {
            db.ref(`companies/${currentCompany}/marketProducts/${prodId}`).set(prodData);
        }

        window._lastAIContext = {
            type: 'market_product',
            id: prodId,
            name: name,
            category: cat,
            price: price,
            weight: weight
        };

        if (typeof renderMarket === 'function') renderMarket();
        return {
            success: true,
            message: isAr ? `تمت إضافة المنتج "${name}" بسعر ${price} ر.س 💵 ${weight ? '(' + weight + ')' : ''} في قسم ${cat} بنجاح!` : `Added product "${name}" at ${price} SR ${weight ? '(' + weight + ')' : ''} in ${cat} successfully!`,
            actionBadge: '⚡ Added Market Product'
        };
    }

    if (toolName === 'create_worker_task') {
        const workerNameQuery = (args.worker_name || '').toLowerCase().trim();
        let rawTitle = args.title || '';
        let cleanTaskTitle = rawTitle
            .replace(/ارسل|أرسل|إرسال|مهمة|مهمه|جديدة|جديده|واجب|إنشاء|أضف|اضف/gi, '')
            .replace(/للموظف|للعامل|لـ|إلى|للعمال/gi, '')
            .replace(/\b(send|task|assignment|create|add|to|worker|employee|for)\b/gi, '')
            .replace(/[:"']/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        const taskTitle = cleanTaskTitle || rawTitle || 'مهمة عمل جديدة';
        const urgency = args.urgency || 'normal';

        let matchedWorkerId = '';
        let matchedWorkerName = '';

        if (typeof getCompanyData === 'function') {
            const data = getCompanyData();
            const workers = data.workers || [];

            let matchedWorkerIndex = -1;
            if (Array.isArray(workers)) {
                matchedWorkerIndex = workers.findIndex(w => w && w.name && (w.name.toLowerCase().includes(workerNameQuery) || workerNameQuery.includes(w.name.toLowerCase())));
            } else if (typeof workers === 'object') {
                Object.entries(workers).forEach(([idx, w]) => {
                    if (w && w.name && (w.name.toLowerCase().includes(workerNameQuery) || workerNameQuery.includes(w.name.toLowerCase()))) {
                        matchedWorkerIndex = idx;
                    }
                });
            }

            if (matchedWorkerIndex !== -1 && matchedWorkerIndex !== null) {
                const targetWorker = Array.isArray(workers) ? workers[matchedWorkerIndex] : workers[matchedWorkerIndex];
                matchedWorkerId = targetWorker.id || matchedWorkerIndex;
                matchedWorkerName = targetWorker.name;

                if (!targetWorker.jobs) targetWorker.jobs = [];
                const assignedTaskNum = typeof getNextTaskNum === 'function' ? getNextTaskNum() : (targetWorker.jobs.length + 1);
                targetWorker.jobs.push({
                    id: Date.now().toString(),
                    taskNum: assignedTaskNum,
                    title: taskTitle,
                    date: typeof formatTimestamp === 'function' ? formatTimestamp() : new Date().toLocaleDateString(),
                    timestamp: Date.now(),
                    urgency: urgency,
                    status: 'assigned',
                    done: false,
                    assignedByEmail: 'AI Assistant',
                    assignedByName: '🤖 المساعد الذكي'
                });

                if (typeof db !== 'undefined') {
                    db.ref(`companies/${currentCompany}/workers/${matchedWorkerIndex}/jobs`).set(targetWorker.jobs);
                }
            } else {
                const assignedTaskNum = typeof getNextTaskNum === 'function' ? getNextTaskNum() : Date.now();
                const newGeneralTask = {
                    id: 'gt-' + Date.now().toString(),
                    taskNum: assignedTaskNum,
                    title: taskTitle,
                    date: typeof formatTimestamp === 'function' ? formatTimestamp() : new Date().toLocaleDateString(),
                    timestamp: Date.now(),
                    urgency: urgency,
                    status: 'pending'
                };
                if (typeof db !== 'undefined') {
                    db.ref(`companies/${currentCompany}/generalTasks/${newGeneralTask.id}`).set(newGeneralTask);
                }
                matchedWorkerName = isAr ? 'المستوى العام للعمال' : 'General Worker Pool';
            }
        }

        window._lastAIContext = {
            type: 'task',
            id: 'task_' + Date.now(),
            title: taskTitle,
            worker_name: matchedWorkerName
        };

        if (typeof renderTasks === 'function') renderTasks();
        if (typeof renderAll === 'function') renderAll();
        return {
            success: true,
            message: isAr ? `تمت إضافة المهمة "${taskTitle}" للموظف (${matchedWorkerName}) بنجاح!` : `Task "${taskTitle}" assigned to worker (${matchedWorkerName}) successfully!`,
            actionBadge: '📋 Assigned Worker Task'
        };
    }

    if (toolName === 'update_last_entity') {
        if (!window._lastAIContext || !window._lastAIContext.id) {
            return {
                success: false,
                message: isAr ? 'عذراً، لم أتمكن من العثور على المنتج أو العنصر السابق لتعديله!' : 'Sorry, could not find the previous item to update!',
                actionBadge: '⚠️ Context Error'
            };
        }

        if (window._lastAIContext.type === 'market_product') {
            const prodId = window._lastAIContext.id;
            let changes = [];
            let updateObj = { updatedAt: Date.now() };

            if (args.weight) {
                updateObj.weight = args.weight;
                updateObj.weightTag = args.weight;
                window._lastAIContext.weight = args.weight;
                changes.push(isAr ? `الوزن (${args.weight})` : `weight (${args.weight})`);
            }
            if (args.price) {
                const newPrice = parseFloat(args.price);
                updateObj.price = newPrice;
                window._lastAIContext.price = newPrice;
                changes.push(isAr ? `السعر (${newPrice} ر.س)` : `price (${newPrice} SR)`);
            }
            if (args.name) {
                updateObj.name = args.name;
                window._lastAIContext.name = args.name;
                changes.push(isAr ? `الاسم (${args.name})` : `name (${args.name})`);
            }

            if (typeof db !== 'undefined') {
                db.ref(`companies/${currentCompany}/marketProducts/${prodId}`).update(updateObj);
            }
            if (typeof renderMarket === 'function') renderMarket();

            return {
                success: true,
                message: isAr ? `تم تحديث ${changes.join(' و ')} للمنتج (${window._lastAIContext.name}) بنجاح! ✏️` : `Updated ${changes.join(' & ')} for product (${window._lastAIContext.name}) successfully! ✏️`,
                actionBadge: '✏️ Updated Market Product'
            };
        }
    }

    if (toolName === 'refill_customer_balance') {
        const amount = parseFloat(args.amount) || 500;
        if (typeof refillMonthlyCoinsForAllCustomers === 'function') {
            refillMonthlyCoinsForAllCustomers(amount);
        }
        return {
            success: true,
            message: isAr ? `تمت تعبئة ${amount} ر.س 💵 لجميع العملاء بنجاح!` : `Refilled ${amount} SR for all customers successfully!`,
            actionBadge: '💵 Refilled Customer SR'
        };
    }

    if (toolName === 'navigate_to_tab') {
        let tab = (args.tab_name || 'market').toLowerCase();
        if (tab.includes('مطبخ') || tab.includes('تحضير') || tab.includes('prep')) tab = 'prepare';
        else if (tab.includes('سوق') || tab.includes('متجر') || tab.includes('market')) tab = 'market';
        else if (tab.includes('مهم') || tab.includes('مهام') || tab.includes('task')) tab = 'tasks';
        else if (tab.includes('مال') || tab.includes('finan')) tab = 'finance';

        if (typeof switchTab === 'function') switchTab(tab);
        return {
            success: true,
            message: isAr ? `تم الانتقال مباشرة إلى قسم (${tab})` : `Navigated to (${tab}) section!`,
            actionBadge: '🚀 Navigated UI'
        };
    }

    return {
        success: false,
        message: 'Tool action executed.',
        actionBadge: '⚡ Tool Call'
    };
}
window.executeAIToolAction = executeAIToolAction;

async function getBestGeminiModelName(apiKey) {
    if (window._cachedGeminiModelName) return window._cachedGeminiModelName;
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await res.json();
        if (data && data.models && Array.isArray(data.models)) {
            const valid = data.models.filter(m =>
                m.name &&
                m.supportedGenerationMethods?.includes('generateContent') &&
                !m.name.includes('2.5')
            );
            const preferred = valid.find(m => m.name.includes('gemini-2.0-flash')) ||
                valid.find(m => m.name.includes('gemini-1.5-flash-8b')) ||
                valid.find(m => m.name.includes('gemini-1.5-flash-latest')) ||
                valid[0];
            if (preferred) {
                const cleanName = preferred.name.replace(/^models\//, '');
                window._cachedGeminiModelName = cleanName;
                console.log("[Gemini] Auto-discovered available model:", cleanName);
                return cleanName;
            }
        }
    } catch (e) {
        console.warn("Failed to fetch model list from Gemini:", e);
    }
    return 'gemini-2.0-flash';
}
function getCompanyLiveContextSummary() {
    let summary = [];
    try {
        const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
        const today = new Date().toISOString().split('T')[0];

        summary.push(`=== SYSTEM REAL-TIME METRICS (Current Date: ${today}) ===`);

        // 1. Attendance, Lateness & Vacations Section
        if (data.workers && Array.isArray(data.workers)) {
            const att = data.attendance || {};
            const todayAtt = att[today] || {};

            let lateList = [];
            let vacationList = [];
            let absentList = [];
            let presentList = [];

            data.workers.forEach(w => {
                const rec = todayAtt[w.id];
                if (rec) {
                    if (rec.status === 'vacation') {
                        vacationList.push(`- ${w.name} (Role: ${w.role || 'Staff'}, Reason: ${rec.reason || 'On Vacation'})`);
                    } else if (rec.status === 'absent') {
                        absentList.push(`- ${w.name} (Role: ${w.role || 'Staff'})`);
                    } else if (rec.status === 'present') {
                        const lateInfo = (rec.lateness && rec.lateness !== 'None') ? ` [LATE by ${rec.lateness}]` : '';
                        if (lateInfo) lateList.push(`- ${w.name} (Check-in: ${rec.checkTime || 'N/A'}, Lateness: ${rec.lateness})`);
                        presentList.push(`- ${w.name} (Check-in: ${rec.checkTime || 'N/A'}${lateInfo})`);
                    }
                }
            });

            let attSummary = `📅 TODAY'S ATTENDANCE STATUS (${today}):\n`;
            attSummary += `• Late Workers Today: ${lateList.length > 0 ? '\n' + lateList.join('\n') : 'None (Everyone arrived on time!)'}\n`;
            attSummary += `• Workers on Vacation: ${vacationList.length > 0 ? '\n' + vacationList.join('\n') : 'None'}\n`;
            attSummary += `• Absent Workers Today: ${absentList.length > 0 ? '\n' + absentList.join('\n') : 'None'}\n`;
            attSummary += `• Present Workers Today: ${presentList.length > 0 ? '\n' + presentList.join('\n') : 'None'}`;
            summary.push(`### ATTENDANCE, LATENESS & VACATION TRACKER:\n${attSummary}`);

            // Worker Payroll Summary
            let workerInfo = data.workers.map(w => {
                const month = (typeof currentGlobalMonth !== 'undefined' && currentGlobalMonth) ? currentGlobalMonth : new Date().toISOString().substr(0, 7);
                const stats = (typeof getMonthlyStats === 'function') ? getMonthlyStats(w, month) : {};
                const bal = (typeof getCumulativeBalance === 'function') ? getCumulativeBalance(w, month) : (w.initialBalance || 0);
                const salary = w.income || 0;
                const custody = (typeof calculateCustodyTotal === 'function' && stats.custodyList) ? calculateCustodyTotal(stats.custodyList) : 0;
                const violations = (typeof calculateViolationsTotal === 'function' && stats.violationsList) ? calculateViolationsTotal(stats.violationsList) : 0;
                const rewards = (typeof calculateRewardsTotal === 'function' && stats.rewardsList) ? calculateRewardsTotal(stats.rewardsList) : 0;
                const paid = (typeof calculatePaymentsTotal === 'function' && stats.paymentsList) ? calculatePaymentsTotal(stats.paymentsList) : 0;
                return `- Worker Name: "${w.name}" (ID: ${w.id}, Role: ${w.role || 'Staff'}, Base Salary: ${salary} SR, Current Balance: ${bal} SR, Total Paid This Month: ${paid} SR, Rewards: ${rewards} SR, Violations: ${violations} SR, Custody: ${custody} SR, Branch: ${w.branch || 'Main'})`;
            }).join('\n');
            summary.push(`### REAL-TIME WORKERS & PAYROLL FINANCIAL DATA:\n${workerInfo || 'No worker records found.'}`);
        }

        // 2. Market Products Summary
        if (typeof getAllMarketProducts === 'function') {
            const prods = getAllMarketProducts();
            let prodInfo = prods.map(p => `- Product: "${p.name}" (Category: ${p.category || 'meat'}, Price: ${p.price} SR, Weight: ${p.weightTag || p.weight || 'N/A'})`).join('\n');
            summary.push(`### REAL-TIME MARKET PRODUCTS CATALOG:\n${prodInfo || 'No market products.'}`);
        }

        // 3. Sales & Market Orders Summary by Specific Date (Combining POS Sales Section + Market Orders)
        const todaySalesInfo = (typeof getTodaySalesSummary === 'function') ? getTodaySalesSummary() : { total: 0, posTotal: 0, marketTotal: 0, todayStr: today, posMethodsToday: {} };
        const posTodayTotal = todaySalesInfo.posTotal;
        const marketTodayTotal = todaySalesInfo.marketTotal;
        const posMethodsToday = todaySalesInfo.posMethodsToday || {};
        const activeSalesToday = todaySalesInfo.total;

        const salesLogs = data.salesLogs || [];
        let posSalesByDate = {};

        salesLogs.forEach(l => {
            const dateKey = normalizeDateStr(l.date || l.timestamp) || today;
            const amt = parseFloat(l.amount) || 0;
            posSalesByDate[dateKey] = (posSalesByDate[dateKey] || 0) + amt;
        });

        const marketOrders = typeof getAllMarketOrders === 'function' ? getAllMarketOrders() : [];
        let marketSalesByDate = {};

        marketOrders.forEach(o => {
            const dateKey = normalizeDateStr(o.date || o.createdAt) || today;
            const cost = parseFloat(o.totalCost || o.price || 0);
            marketSalesByDate[dateKey] = (marketSalesByDate[dateKey] || 0) + cost;
        });

        const yestDateObj = new Date();
        yestDateObj.setDate(yestDateObj.getDate() - 1);
        const yestStr = `${yestDateObj.getFullYear()}-${String(yestDateObj.getMonth() + 1).padStart(2, '0')}-${String(yestDateObj.getDate()).padStart(2, '0')}`;
        const yesterdayPosAmt = posSalesByDate[yestStr] || 0;
        const yesterdayMktAmt = marketSalesByDate[yestStr] || 0;
        const yesterdayTotalAmt = yesterdayPosAmt + yesterdayMktAmt;

        const allDates = Array.from(new Set([...Object.keys(posSalesByDate), ...Object.keys(marketSalesByDate)])).sort().reverse();

        let salesSummary = `💰 **EXACT SALES SECTION & POS METRICS**:\n`;
        salesSummary += `• **TODAY'S TOTAL SALES (${todaySalesInfo.todayStr || today})**: ${activeSalesToday.toFixed(2)} SR\n`;
        salesSummary += `  - Sales Section Today (POS Logs): ${posTodayTotal.toFixed(2)} SR (Payment Methods Breakdown: ${Object.entries(posMethodsToday).map(([m, a]) => `${m}: ${a} SR`).join(', ') || 'No entries'})\n`;
        salesSummary += `  - Online Marketplace Orders Today: ${marketTodayTotal.toFixed(2)} SR\n\n`;
        salesSummary += `• **YESTERDAY'S TOTAL SALES (${yestStr})**: ${yesterdayTotalAmt.toFixed(2)} SR\n`;
        salesSummary += `  - POS Sales Section Yesterday: ${yesterdayPosAmt.toFixed(2)} SR\n`;
        salesSummary += `  - Online Marketplace Orders Yesterday: ${yesterdayMktAmt.toFixed(2)} SR\n\n`;

        salesSummary += `📅 **DAILY SALES BREAKDOWN BY SPECIFIC DATE**:\n`;
        allDates.slice(0, 30).forEach(d => {
            const posAmt = posSalesByDate[d] || 0;
            const mktAmt = marketSalesByDate[d] || 0;
            const total = posAmt + mktAmt;
            salesSummary += `- Date ${d}: Total Sales = ${total.toFixed(2)} SR (POS Sales Section: ${posAmt.toFixed(2)} SR | Marketplace: ${mktAmt.toFixed(2)} SR)\n`;
        });

        summary.push(`### REAL-TIME SALES & ORDERS HISTORY:\n${salesSummary}`);

        // 4. Admin Reminders Section Context
        const remSummary = (typeof getRemindersSummary === 'function') ? getRemindersSummary() : { redDueReminders: [], upcomingReminders: [] };
        let remText = `⏰ **ADMIN REMINDERS TRACKER (${today})**:\n`;
        if ((!remSummary.redDueReminders || remSummary.redDueReminders.length === 0) && (!remSummary.upcomingReminders || remSummary.upcomingReminders.length === 0)) {
            remText += `• No reminders currently set.\n`;
        } else {
            if (remSummary.redDueReminders && remSummary.redDueReminders.length > 0) {
                remText += `🔴 **RED DUE / ALERT REMINDERS (${remSummary.redDueReminders.length})**:\n`;
                remSummary.redDueReminders.forEach(r => {
                    remText += `- 🔴 RED ALERT: ${r.title} | Amount: ${r.amount ? r.amount + ' SR' : 'N/A'} | Deadline: ${r.deadlineDateStr} | Status: ${r.isOverdue ? 'OVERDUE / DUE NOW' : 'DUE / URGENT (0-2 Days Left)'}\n`;
                });
            }
            if (remSummary.upcomingReminders && remSummary.upcomingReminders.length > 0) {
                remText += `⏳ **UPCOMING REMINDERS (${remSummary.upcomingReminders.length})**:\n`;
                remSummary.upcomingReminders.slice(0, 5).forEach(r => {
                    remText += `- ⏳ Scheduled: ${r.title} | Deadline: ${r.deadlineDateStr} | Amount: ${r.amount ? r.amount + ' SR' : 'N/A'}\n`;
                });
            }
        }
        summary.push(`### ADMIN REMINDERS & NOTIFICATIONS:\n${remText}`);
    } catch (e) {
        console.warn("Error building company live context:", e);
    }
    return summary.join('\n\n');
}
window.getCompanyLiveContextSummary = getCompanyLiveContextSummary;

function extractProductInfo(text) {
    let rawText = text;

    // 1. Extract Weight (e.g. 500 g, 500g, 14 kg, 500 جرام, 1 كجم)
    let weight = '';
    const weightMatch = text.match(/(\d+(?:\.\d+)?\s*(?:kg|g|gm|kgm|كجم|جم|جرام|غرام))/i);
    if (weightMatch) {
        weight = weightMatch[1].trim();
        text = text.replace(weightMatch[0], ' ');
    }

    // 2. Extract Price
    let price = 50;
    const priceMatch = text.match(/(\d+(?:\.\d+)?)/);
    if (priceMatch) {
        price = parseFloat(priceMatch[1]);
        text = text.replace(priceMatch[0], ' ');
    }

    // 3. Category Detection
    let category = 'meat';
    if (/خضار|فواكه|تفاح|برتقال|موز|طماطم|veg|fruit/i.test(rawText)) {
        category = 'veg_fruit';
    } else if (/سمك|أسماك|ربيان|جمبري|هامور|fish/i.test(rawText)) {
        category = 'fish';
    }

    // 4. Clean Product Name (whole word replacements ONLY)
    let cleanName = text
        .replace(/\b(add|product|products|create|new|price|cost|sr|riyal|category|dept|department|the|name|to|for|in|veggie|veg|fruit|fish|market|store|with|weight|waight|and|a|an)\b/gi, ' ')
        .replace(/(?:^|\s)(أضف|اضف|تنزيل|نزل|جديد|منتج|منتجات|بسعر|سعر|بكمية|كمية|ريال|ر\.س|SR|في|إلى|قسم|أقسام|اللحوم|لحوم|الخضار|خضار|فواكه|الأسماك|أسماك|سمك|اسم|صنف|عنصر|سوق|بالسوق|الماركت|متجر|وزن)(?=\s|$)/gi, ' ')
        .replace(/[:"']/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (!cleanName || cleanName.length < 2) {
        cleanName = category === 'meat' ? 'لحم طازج' : (category === 'veg_fruit' ? 'خضار طازجة' : 'سمك طازج');
    }

    return { name: cleanName, price, category, weight };
}
window.extractProductInfo = extractProductInfo;

function extractTaskInfo(text) {
    let workerName = '';
    const workerMatch = text.match(/(?:للموظف|للعامل|لـ|إلى|to worker|to)\s+([\u0600-\u06FFa-zA-Z]+)/i);
    if (workerMatch && workerMatch[1]) {
        workerName = workerMatch[1].trim();
    }

    let cleanTitle = text
        .replace(/ارسل|أرسل|إرسال|مهمة|مهمه|جديدة|جديده|واجب|إنشاء|أضف|اضف/gi, '')
        .replace(/للموظف|للعامل|لـ|إلى|للعمال/gi, '')
        .replace(/\b(send|task|assignment|create|add|to|worker|employee|for)\b/gi, '')
        .replace(/[:"']/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (workerName) {
        cleanTitle = cleanTitle.replace(new RegExp(workerName, 'gi'), '').replace(/\s+/g, ' ').trim();
    }

    if (!cleanTitle || cleanTitle.length < 2) {
        cleanTitle = text.trim();
    }

    return { worker_name: workerName || 'عمومي', title: cleanTitle };
}
window.extractTaskInfo = extractTaskInfo;

function getTodaySalesSummary() {
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};

    // 1. Force calculation of Sales Section if available
    if (typeof renderManaging === 'function') {
        try {
            const savedTab = typeof currentTab !== 'undefined' ? currentTab : '';
            if (typeof currentTab !== 'undefined') currentTab = 'managing';
            renderManaging();
            if (typeof currentTab !== 'undefined') currentTab = savedTab;
        } catch (e) { }
    }

    // 2. Read directly from rendered Sales Section DOM elements
    let domVal = 0;
    const salaryEl = document.getElementById('sales-total-salary');
    const grandEl = document.getElementById('sales-grand-total');

    if (salaryEl && salaryEl.textContent) {
        const num = parseFloat(salaryEl.textContent.replace(/[^0-9.]/g, ''));
        if (!isNaN(num) && num > 0) domVal = num;
    }
    if (domVal === 0 && grandEl && grandEl.textContent) {
        const num = parseFloat(grandEl.textContent.replace(/[^0-9.]/g, ''));
        if (!isNaN(num) && num > 0) domVal = num;
    }

    const datePicker = document.getElementById('sales-date-picker');
    let targetDateStr = datePicker && datePicker.value ? datePicker.value.trim() : '';

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const localTodayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

    if (!targetDateStr) {
        targetDateStr = localTodayStr;
    }

    const parts = targetDateStr.split('-');
    const startOfDay = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime();
    const endOfDay = startOfDay + 86400000;

    let allLogs = data.salesLogs || [];
    if (allLogs && typeof allLogs === 'object' && !Array.isArray(allLogs)) {
        allLogs = Object.values(allLogs);
    }

    let posTotal = 0;
    let posCount = 0;
    let posMethodsToday = {};

    allLogs.forEach(l => {
        if (!l) return;
        let isMatch = false;
        if (typeof l.timestamp === 'number' && l.timestamp > 0) {
            if (l.timestamp >= startOfDay && l.timestamp < endOfDay) {
                isMatch = true;
            }
        }
        if (!isMatch && l.date && typeof l.date === 'string') {
            if (l.date.startsWith(targetDateStr) || l.date.includes(targetDateStr)) {
                isMatch = true;
            }
        }
        if (isMatch) {
            const amt = parseFloat(l.amount) || 0;
            posTotal += amt;
            posCount++;
            const m = l.method || 'Cash';
            posMethodsToday[m] = (posMethodsToday[m] || 0) + amt;
        }
    });

    const marketOrders = typeof getAllMarketOrders === 'function' ? getAllMarketOrders() : [];
    let marketTotal = 0;
    let marketCount = 0;

    marketOrders.forEach(o => {
        if (!o) return;
        let isMatch = false;
        if (typeof o.createdAt === 'number' && o.createdAt > 0) {
            if (o.createdAt >= startOfDay && o.createdAt < endOfDay) {
                isMatch = true;
            }
        }
        if (!isMatch && o.date && typeof o.date === 'string') {
            if (o.date.startsWith(targetDateStr) || o.date.includes(targetDateStr)) {
                isMatch = true;
            }
        }
        if (isMatch) {
            marketTotal += parseFloat(o.totalCost || o.price || 0);
            marketCount++;
        }
    });

    let finalTotal = domVal > 0 ? domVal : (posTotal + marketTotal);

    if (finalTotal === 0 && allLogs.length > 0) {
        allLogs.forEach(l => {
            if (!l) return;
            const amt = parseFloat(l.amount) || 0;
            if (l.timestamp) {
                const d = new Date(l.timestamp);
                const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                if (dStr === targetDateStr) {
                    finalTotal += amt;
                    posCount++;
                    const m = l.method || 'Cash';
                    posMethodsToday[m] = (posMethodsToday[m] || 0) + amt;
                }
            }
        });
    }

    return {
        targetDateStr,
        todayStr: targetDateStr,
        total: finalTotal,
        posTotal: finalTotal,
        marketTotal,
        posCount,
        marketCount,
        posMethodsToday
    };
}
window.getTodaySalesSummary = getTodaySalesSummary;

function normalizeDateStr(dInput) {
    if (!dInput) return '';
    if (typeof dInput === 'number') {
        const d = new Date(dInput);
        if (isNaN(d.getTime())) return '';
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    if (typeof dInput === 'string') {
        const clean = dInput.trim().split(' ')[0];
        const parts = clean.split(/[\/\-\.]/);
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                return `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
            }
            if (parts[2].length === 4) {
                return `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
            }
        }
        const d = new Date(dInput);
        if (!isNaN(d.getTime())) {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
    }
    return '';
}
window.normalizeDateStr = normalizeDateStr;

function getSalesForTimeframe(queryStr) {
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();

    const localTodayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

    const yesterdayDate = new Date(year, month, date - 1);
    const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

    let allLogs = data.salesLogs || [];
    if (allLogs && typeof allLogs === 'object' && !Array.isArray(allLogs)) {
        allLogs = Object.values(allLogs);
    }
    const marketOrders = typeof getAllMarketOrders === 'function' ? getAllMarketOrders() : [];

    const lower = (queryStr || '').toLowerCase();

    let timeframeLabel = '';
    let startTs = 0;
    let endTs = 0;
    let matchSpecificDate = '';

    if (lower.includes('yesterday') || lower.includes('أمس') || lower.includes('امس') || lower.includes('البارحة')) {
        timeframeLabel = `Yesterday (${yesterdayStr})`;
        matchSpecificDate = yesterdayStr;
        startTs = yesterdayDate.getTime();
        endTs = startTs + 86400000;
    } else if (lower.includes('last week') || lower.includes('past week') || lower.includes('this week') || lower.includes('week') || lower.includes('أسبوع') || lower.includes('اسبوع')) {
        const startOfWeek = new Date(year, month, date - 7).getTime();
        timeframeLabel = `Last 7 Days / Week (${new Date(startOfWeek).toISOString().slice(0, 10)} to ${localTodayStr})`;
        startTs = startOfWeek;
        endTs = Date.now() + 86400000;
    } else if (lower.includes('last month') || lower.includes('past month') || lower.includes('this month') || lower.includes('month') || lower.includes('شهر')) {
        const startOfMonth = new Date(year, month, 1).getTime();
        timeframeLabel = `Current Month (${localTodayStr.slice(0, 7)})`;
        startTs = startOfMonth;
        endTs = Date.now() + 86400000;
    } else {
        const dateMatch = (queryStr || '').match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
            matchSpecificDate = dateMatch[1];
            timeframeLabel = `Date (${matchSpecificDate})`;
            const p = matchSpecificDate.split('-');
            startTs = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2])).getTime();
            endTs = startTs + 86400000;
        } else {
            timeframeLabel = `Today (${localTodayStr})`;
            return getTodaySalesSummary();
        }
    }

    let posTotal = 0;
    let posCount = 0;
    allLogs.forEach(l => {
        if (!l) return;
        let isMatch = false;
        const logDateStr = normalizeDateStr(l.date || l.timestamp);
        if (matchSpecificDate) {
            if (logDateStr === matchSpecificDate) isMatch = true;
            else if (!logDateStr && l.timestamp && l.timestamp >= startTs && l.timestamp < endTs) isMatch = true;
        } else {
            if (l.timestamp && l.timestamp >= startTs && l.timestamp < endTs) isMatch = true;
            else if (logDateStr && logDateStr >= normalizeDateStr(startTs) && logDateStr <= normalizeDateStr(endTs)) isMatch = true;
        }
        if (isMatch) {
            posTotal += parseFloat(l.amount) || 0;
            posCount++;
        }
    });

    let marketTotal = 0;
    let marketCount = 0;
    marketOrders.forEach(o => {
        if (!o) return;
        let isMatch = false;
        const orderDateStr = normalizeDateStr(o.date || o.createdAt);
        if (matchSpecificDate) {
            if (orderDateStr === matchSpecificDate) isMatch = true;
            else if (!orderDateStr && o.createdAt && o.createdAt >= startTs && o.createdAt < endTs) isMatch = true;
        } else {
            if (o.createdAt && o.createdAt >= startTs && o.createdAt < endTs) isMatch = true;
            else if (orderDateStr && orderDateStr >= normalizeDateStr(startTs) && orderDateStr <= normalizeDateStr(endTs)) isMatch = true;
        }
        if (isMatch) {
            marketTotal += parseFloat(o.totalCost || o.price || 0);
            marketCount++;
        }
    });

    const total = posTotal + marketTotal;
    return {
        timeframeLabel,
        total,
        posTotal,
        marketTotal,
        posCount,
        marketCount
    };
}
window.getSalesForTimeframe = getSalesForTimeframe;

function getRemindersSummary() {
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const remindersObj = data.reminders || {};
    const remindersList = Object.values(remindersObj);

    const now = Date.now();
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const date = new Date().getDate();
    const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

    let redDueReminders = [];
    let upcomingReminders = [];

    remindersList.forEach(r => {
        if (!r) return;
        const deadlineMs = r.deadlineMs || (r.deadlineDate ? new Date(r.deadlineDate).getTime() : 0);
        const diffMs = deadlineMs ? (deadlineMs - now) : 0;
        const daysLeft = deadlineMs ? (diffMs / (1000 * 60 * 60 * 24)) : 999;
        const deadlineDateStr = r.deadlineDate || (deadlineMs ? (new Date(deadlineMs)).toISOString().slice(0, 10) : todayStr);

        const isAlerting = typeof isReminderAlerting === 'function' ? isReminderAlerting(r, now) : (daysLeft <= 2);

        if (daysLeft <= 2 || deadlineDateStr === todayStr || isAlerting) {
            redDueReminders.push({
                ...r,
                daysLeft: Math.max(0, Math.ceil(daysLeft)),
                isOverdue: daysLeft < 0,
                deadlineDateStr
            });
        } else {
            upcomingReminders.push({
                ...r,
                daysLeft: Math.ceil(daysLeft),
                deadlineDateStr
            });
        }
    });

    return { totalCount: remindersList.length, redDueReminders, todayReminders: redDueReminders, upcomingReminders, todayStr };
}
window.getRemindersSummary = getRemindersSummary;

async function fetchGeneralKnowledge(query, isAr) {
    if (!query || query.length < 2) return null;

    const liveContext = typeof getCompanyLiveContextSummary === 'function' ? getCompanyLiveContextSummary() : '';
    const sysMsg = isAr
        ? `أنت المدير التنفيذي الذكي للبوابة (MVC Smart AI Executive Manager). أنت متمكن جداً من اللغة العربية والتنفيذ الذكي للأوامر وتحليل بيانات النظام بالريال السعودي.
إذا كان السؤال يخص بيانات النظام أو الموظفين أو المبيعات أو المستودع أو التذكيرات، فاستخرج الإجابة بدقة من بيانات النظام اللحظية التالية:
${liveContext}`
        : `You are MVC Smart AI Executive Manager. You possess deep neural intelligence and accurate understanding of system data, business advice, and general questions.
System Context Data:
${liveContext}`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(query)}?system=${encodeURIComponent(sysMsg)}&model=openai`, { 
            signal: controller.signal 
        });
        clearTimeout(timeoutId);
        if (res.status === 200) {
            const text = await res.text();
            if (text && text.length > 5 && !text.includes('Error') && !text.includes('html')) {
                return text.trim();
            }
        }
    } catch (e) { }

    return null;
}
window.fetchGeneralKnowledge = fetchGeneralKnowledge;

// --- AI CHATBOT VOICE SPEECH RECOGNITION (ARABIC & ENGLISH) ---
let aiChatSpeechRecognition = null;
let isAIChatListening = false;
let aiChatVoiceLang = 'auto'; // 'auto', 'ar-SA', 'en-US'

function toggleAIChatVoiceInput() {
    const input = document.getElementById('ai-chat-input');
    const micBtn = document.getElementById('ai-chat-mic-btn');
    const micIcon = document.getElementById('ai-chat-mic-icon');
    const langBadge = document.getElementById('ai-chat-mic-lang-badge');
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert(isAr 
            ? "خاصية التعرف على الصوت غير مدعومة في هذا المتصفح. يرجى استخدام متصفح Google Chrome أو Edge أو Safari." 
            : "Voice recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.");
        return;
    }

    if (isAIChatListening && aiChatSpeechRecognition) {
        try { aiChatSpeechRecognition.stop(); } catch(e){}
        isAIChatListening = false;
        resetAIChatMicUI();
        return;
    }

    try {
        aiChatSpeechRecognition = new SpeechRecognition();
    } catch(err) {
        console.error("SpeechRecognition initialization error:", err);
        alert(isAr ? "تعذر تشغيل الميكروفون." : "Unable to initialize microphone.");
        return;
    }

    aiChatSpeechRecognition.continuous = false;
    aiChatSpeechRecognition.interimResults = true;

    // Detect target language for speech recognition (supports Arabic & English)
    let targetLang = isAr ? 'ar-SA' : 'en-US';
    if (aiChatVoiceLang && aiChatVoiceLang !== 'auto') {
        targetLang = aiChatVoiceLang;
    } else if (input && input.value) {
        const hasArabic = /[\u0600-\u06FF]/.test(input.value);
        if (hasArabic) targetLang = 'ar-SA';
        else if (/[a-zA-Z]/.test(input.value)) targetLang = 'en-US';
    }
    aiChatSpeechRecognition.lang = targetLang;

    aiChatSpeechRecognition.onstart = () => {
        isAIChatListening = true;
        if (micBtn) {
            micBtn.style.background = '#ef4444';
            micBtn.style.color = '#ffffff';
            micBtn.style.borderColor = '#ef4444';
            micBtn.style.boxShadow = '0 0 16px rgba(239, 68, 68, 0.7)';
        }
        if (micIcon) {
            micIcon.textContent = '🎙️';
        }
        if (langBadge) {
            langBadge.style.background = 'rgba(255, 255, 255, 0.3)';
            langBadge.style.color = '#ffffff';
            langBadge.textContent = targetLang.startsWith('ar') ? 'عربي' : 'EN';
        }
        if (input) {
            input.placeholder = isAr ? '🎙️ جاري الاستماع... تحدّث الآن باللغة العربية أو الإنجليزية' : '🎙️ Listening... Speak now in Arabic or English...';
        }
    };

    aiChatSpeechRecognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
        }
        if (input && transcript) {
            input.value = transcript;
        }
    };

    aiChatSpeechRecognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        isAIChatListening = false;
        resetAIChatMicUI();
        if (event.error === 'not-allowed') {
            alert(isAr 
                ? "تم رفض إذن استخدام الميكروفون. يرجى تفعيل إذن الميكروفون في إعدادات المتصفح." 
                : "Microphone permission was denied. Please allow microphone access in your browser settings.");
        }
    };

    aiChatSpeechRecognition.onend = () => {
        isAIChatListening = false;
        resetAIChatMicUI();
    };

    try {
        aiChatSpeechRecognition.start();
    } catch(err) {
        console.error("Failed to start SpeechRecognition:", err);
        isAIChatListening = false;
        resetAIChatMicUI();
    }
}

function resetAIChatMicUI() {
    const input = document.getElementById('ai-chat-input');
    const micBtn = document.getElementById('ai-chat-mic-btn');
    const micIcon = document.getElementById('ai-chat-mic-icon');
    const langBadge = document.getElementById('ai-chat-mic-lang-badge');
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    if (micBtn) {
        micBtn.style.background = 'var(--input-bg)';
        micBtn.style.color = '#6366f1';
        micBtn.style.borderColor = '#6366f1';
        micBtn.style.boxShadow = 'none';
    }
    if (micIcon) {
        micIcon.textContent = '🎤';
    }
    if (langBadge) {
        langBadge.style.background = 'rgba(99, 102, 241, 0.15)';
        langBadge.style.color = '#6366f1';
        langBadge.textContent = 'AR/EN';
    }
    if (input) {
        input.placeholder = isAr ? 'اكتب طلبك هنا للمساعد الذكي... / Type your command...' : 'Type your command here for AI Assistant...';
    }
}

window.toggleAIChatVoiceInput = toggleAIChatVoiceInput;
window.resetAIChatMicUI = resetAIChatMicUI;

function showAIThinkingIndicator() {
    removeAIThinkingIndicator();
    const history = document.getElementById('ai-chat-history');
    if (!history) return;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    const container = document.createElement('div');
    container.id = 'ai-thinking-indicator';
    container.style.display = 'flex';
    container.style.gap = '12px';
    container.style.alignItems = 'flex-start';
    container.style.marginBottom = '12px';

    container.innerHTML = `
        <div style="width:36px; height:36px; border-radius:12px; background:linear-gradient(135deg, #6366f1, #4f46e5); color:white; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0;">🧠</div>
        <div style="background:var(--input-bg); border:1px solid var(--border-color); padding:12px 18px; border-radius:4px 18px 18px 18px; font-size:0.9rem; color:var(--text-main); font-weight:700; display:flex; align-items:center; gap:8px; box-shadow:var(--shadow-sm);">
            <span>${isAr ? 'المساعد الذكي يفكر ويحلل النظام' : 'MVC AI Executive Manager is thinking'}</span>
            <span class="ai-thinking-dots">
                <span class="ai-thinking-dot"></span>
                <span class="ai-thinking-dot"></span>
                <span class="ai-thinking-dot"></span>
            </span>
        </div>
    `;
    history.appendChild(container);
    history.scrollTop = history.scrollHeight;
}

function removeAIThinkingIndicator() {
    const el = document.getElementById('ai-thinking-indicator');
    if (el) el.remove();
}
window.showAIThinkingIndicator = showAIThinkingIndicator;
window.removeAIThinkingIndicator = removeAIThinkingIndicator;

async function handleAIChatSubmit() {
    if (isAIChatListening && aiChatSpeechRecognition) {
        try { aiChatSpeechRecognition.stop(); } catch(e){}
        isAIChatListening = false;
        resetAIChatMicUI();
    }
    const input = document.getElementById('ai-chat-input');
    const userText = input?.value?.trim() || '';
    if (!userText) return;

    input.value = '';
    renderAIChatMessage('user', userText);
    showAIThinkingIndicator();

    const apiKey = getGeminiApiKey();
    const isAr = currentAppLang === 'ar';

    if (!window._aiChatHistory) window._aiChatHistory = [];
    window._aiChatHistory.push({ role: 'user', parts: [{ text: userText }] });
    if (window._aiChatHistory.length > 20) {
        window._aiChatHistory = window._aiChatHistory.slice(window._aiChatHistory.length - 20);
    }

    if (apiKey) {
        try {
            const liveContext = getCompanyLiveContextSummary();
            const systemPrompt = isAr ? `أنت "المساعد الذكي التنفيذي لشبكة وبوابة إم في سي (MVC Smart AI Executive Manager)".
تتمتع بالذكاء الاصطناعي الفائق، التحليل المنطقي العميق، والقدرة على الفهم التام للغة العربية بجميع لهجاتها وفصاحتها، بالإضافة للغة الإنجليزية.

صلاحياتك ودورك في النظام:
1. الفهم الكامل والحي لجميع بيانات الشركة: لديك صلاحية الاطلاع المباشر على بيانات الموظفين، الرواتب، السلف، المخالفات، المكافآت، الحضور والتأخير، الإجازات، مخزون المستودع، منتجات السوق، التذكيرات، والوثائق.
2. التنفيذ التلقائي الفوري للأوامر (Universal Action): إذا طلب منك المستخدم إضافة، تعديل، حذف، أو خصم أي شيء (مثال: "أضف منتج"، "تعديل راتب"، "خصم تأخير"، "تسجيل إجازة"، "إضافة تذكير"، "حذف صنف منتهي")، قم فوراً باستدعاء أداة "execute_universal_action" وكتابة كود البرمجة التنفيذي للعملية.
3. الإجابة الذكية الفائقة عن جميع الأسئلة العامة (علوم، فلسفة، رياضيات، تاريخ، ثقافة، نصائح إدارية) بأسلوب راقٍ وشيق ومبسط.
4. الإجابات المالية والاستعلامات: عند السؤال عن المبيعات أو الموظفين أو التأخير، قدم تقريراً شاملاً ومفصلاً بالريال السعودي (ر.س).

بيانات النظام الحية اللحظية:
${liveContext}` : `You are MVC Smart AI Executive Manager powered by Gemini Thinking Engine. You possess full intelligence, neural reasoning, and universal project authority. You answer ANY question in the world (science, philosophy, history, recipes, math, business advice) warmly, accurately, and naturally in Arabic or English.

UNIVERSAL AUTOMATIC CONTROL & EXECUTIVE GUIDELINES:
1. FULL PROJECT UNDERSTANDING: You have access to the complete live system data below. You understand every worker, salary, attendance, inventory stock, sale, cost, reminder, and market product.
2. DYNAMIC AUTOMATIC ACTIONS: If the user asks to add, edit, delete, modify, or update ANYTHING (e.g. salaries, inventory items, worker tasks, reminders, penalties, rewards, market products, tabs), use the tool function "execute_universal_action" or dedicated tool functions to perform the JavaScript modification directly on the live client/database.
3. DAILY SALES & DATE QUERIES: Output exact SR revenue in this exact 1-line format:
"Your sales today - (YYYY-MM-DD) - is ( AMOUNT SR )" (or in Arabic: "مبيعاتك اليوم - (YYYY-MM-DD) - هي ( AMOUNT ر.س )")
4. ATTENDANCE & LATENESS QUERIES: Provide exact names, check-in times, and lateness details.

=== LIVE REAL-TIME SYSTEM DATA ===
${liveContext}`;
            const toolsDeclaration = [
                {
                    functionDeclarations: [
                        {
                            name: "execute_universal_action",
                            description: "Executes any action, modification, update, creation, deletion, or query dynamically by providing executable client-side JavaScript code and a concise summary.",
                            parameters: {
                                type: "OBJECT",
                                properties: {
                                    action_description: { type: "STRING", description: "Human readable summary of what action was taken in Arabic or English" },
                                    javascript_code: { type: "STRING", description: "Valid client-side JavaScript code to perform the requested action on the live database or UI state." }
                                },
                                required: ["action_description", "javascript_code"]
                            }
                        },
                        {
                            name: "add_market_product",
                            description: "Adds a new product to the market catalog",
                            parameters: {
                                type: "OBJECT",
                                properties: {
                                    name: { type: "STRING", description: "Product name in Arabic or English" },
                                    price: { type: "NUMBER", description: "Price in SR" },
                                    category: { type: "STRING", description: "Category: 'meat', 'veg_fruit', or 'fish'" },
                                    weight: { type: "STRING", description: "Optional weight tag like '14 kg'" }
                                },
                                required: ["name", "price"]
                            }
                        },
                        {
                            name: "create_worker_task",
                            description: "Assigns a task to a worker",
                            parameters: {
                                type: "OBJECT",
                                properties: {
                                    worker_name: { type: "STRING", description: "Name of the worker" },
                                    title: { type: "STRING", description: "Task description or title" }
                                },
                                required: ["title"]
                            }
                        },
                        {
                            name: "refill_customer_balance",
                            description: "Refills SR balance for market customers",
                            parameters: {
                                type: "OBJECT",
                                properties: {
                                    amount: { type: "NUMBER", description: "Amount in SR" }
                                },
                                required: ["amount"]
                            }
                        },
                        {
                            name: "navigate_to_tab",
                            description: "Navigates to a specific view in the dashboard",
                            parameters: {
                                type: "OBJECT",
                                properties: {
                                    tab_name: { type: "STRING", description: "Tab name: 'market', 'prepare', 'tasks', 'finance', 'warehouse', 'reminders', 'vault'" }
                                },
                                required: ["tab_name"]
                            }
                        }
                    ]
                }
            ];

            const modelsToTry = [
                'gemini-2.0-flash',
                'gemini-2.0-flash-thinking-exp-01-21',
                'gemini-1.5-flash',
                'gemini-1.5-flash-latest',
                'gemini-flash-latest',
                'gemini-pro'
            ];
            let data = null;

            // Attempt 1: Call API with tools declaration and multi-turn chat history
            for (const mName of modelsToTry) {
                try {
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: window._aiChatHistory,
                            systemInstruction: { parts: [{ text: systemPrompt }] },
                            tools: toolsDeclaration
                        })
                    });
                    const resJson = await response.json();
                    if (resJson && !resJson.error && resJson.candidates?.[0]) {
                        data = resJson;
                        break;
                    }
                } catch (e) { }
            }

            // Attempt 2: Fallback without tools declaration (pure conversational mode with history)
            if (!data || data.error || !data.candidates?.[0]) {
                for (const mName of modelsToTry) {
                    try {
                        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${apiKey}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: window._aiChatHistory,
                                systemInstruction: { parts: [{ text: systemPrompt }] }
                            })
                        });
                        const resJson = await response.json();
                        if (resJson && !resJson.error && resJson.candidates?.[0]) {
                            data = resJson;
                            break;
                        }
                    } catch (e) { }
                }
            }

            // Attempt 3: Prepended system prompt inside contents array (for endpoints that disallow systemInstruction)
            if (!data || data.error || !data.candidates?.[0]) {
                const combinedContents = [
                    { role: 'user', parts: [{ text: `SYSTEM INSTRUCTIONS:\n${systemPrompt}` }] },
                    ...window._aiChatHistory
                ];
                for (const mName of modelsToTry) {
                    try {
                        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${apiKey}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ contents: combinedContents })
                        });
                        const resJson = await response.json();
                        if (resJson && !resJson.error && resJson.candidates?.[0]) {
                            data = resJson;
                            break;
                        }
                    } catch (e) { }
                }
            }

            if (data && !data.error && data.candidates?.[0]) {
                removeAIThinkingIndicator();
                const candidate = data.candidates[0].content;
                const functionCall = candidate?.parts?.find(p => p.functionCall)?.functionCall;

                if (functionCall) {
                    const res = executeAIToolAction(functionCall.name, functionCall.args || {});
                    renderAIChatMessage('bot', res.message, res.actionBadge);
                    window._aiChatHistory.push({ role: 'model', parts: [{ text: res.message }] });
                    return;
                }

                const textReply = candidate?.parts?.find(p => p.text)?.text;
                if (textReply) {
                    renderAIChatMessage('bot', textReply);
                    window._aiChatHistory.push({ role: 'model', parts: [{ text: textReply }] });
                    return;
                }
            } else {
                console.warn("[Gemini API Fallback] Key issue or rate limit, checking secondary general knowledge engine...");
            }
        } catch (err) {
            console.error("Error calling Gemini API:", err);
        }
    }

    // Secondary Neural & General Knowledge Engine (when Gemini API key is rate-limited)
    try {
        const generalAns = await fetchGeneralKnowledge(userText, isAr);
        removeAIThinkingIndicator();
        if (generalAns) {
            renderAIChatMessage('bot', generalAns);
            if (!window._aiChatHistory) window._aiChatHistory = [];
            window._aiChatHistory.push({ role: 'model', parts: [{ text: generalAns }] });
            return;
        }
    } catch (e) { 
        removeAIThinkingIndicator();
    }

    function extractProductInfo(text) {
        let rawText = text;

        // 1. Extract Weight (e.g. 500 g, 500g, 14 kg, 500 جرام, 1 كجم)
        let weight = '';
        const weightMatch = text.match(/(\d+(?:\.\d+)?\s*(?:kg|g|gm|kgm|كجم|جم|جرام|غرام))/i);
        if (weightMatch) {
            weight = weightMatch[1].trim();
            text = text.replace(weightMatch[0], ' ');
        }

        // 2. Extract Price
        let price = 50;
        const priceMatch = text.match(/(\d+(?:\.\d+)?)/);
        if (priceMatch) {
            price = parseFloat(priceMatch[1]);
            text = text.replace(priceMatch[0], ' ');
        }

        // 3. Category Detection
        let category = 'meat';
        if (/خضار|فواكه|تفاح|برتقال|موز|طماطم|veg|fruit/i.test(rawText)) {
            category = 'veg_fruit';
        } else if (/سمك|أسماك|ربيان|جمبري|هامور|fish/i.test(rawText)) {
            category = 'fish';
        }

        // 4. Clean Product Name (whole word replacements ONLY)
        let cleanName = text
            .replace(/\b(add|product|products|create|new|price|cost|sr|riyal|category|dept|department|the|name|to|for|in|veggie|veg|fruit|fish|market|store|with|weight|waight|and|a|an)\b/gi, ' ')
            .replace(/(?:^|\s)(أضف|اضف|تنزيل|نزل|جديد|منتج|منتجات|بسعر|سعر|بكمية|كمية|ريال|ر\.س|SR|في|إلى|قسم|أقسام|اللحوم|لحوم|الخضار|خضار|فواكه|الأسماك|أسماك|سمك|اسم|صنف|عنصر|سوق|بالسوق|الماركت|متجر|وزن)(?=\s|$)/gi, ' ')
            .replace(/[:"']/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleanName || cleanName.length < 2) {
            cleanName = category === 'meat' ? 'لحم طازج' : (category === 'veg_fruit' ? 'خضار طازجة' : 'سمك طازج');
        }

        return { name: cleanName, price, category, weight };
    }

    function extractTaskInfo(text) {
        let workerName = '';
        const workerMatch = text.match(/(?:للموظف|للعامل|لـ|إلى|to worker|to)\s+([\u0600-\u06FFa-zA-Z]+)/i);
        if (workerMatch && workerMatch[1]) {
            workerName = workerMatch[1].trim();
        }

        let cleanTitle = text
            .replace(/ارسل|أرسل|إرسال|مهمة|مهمه|جديدة|جديده|واجب|إنشاء|أضف|اضف/gi, '')
            .replace(/للموظف|للعامل|لـ|إلى|للعمال/gi, '')
            .replace(/\b(send|task|assignment|create|add|to|worker|employee|for)\b/gi, '')
            .replace(/[:"']/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (workerName) {
            cleanTitle = cleanTitle.replace(new RegExp(workerName, 'gi'), '').replace(/\s+/g, ' ').trim();
        }

        if (!cleanTitle || cleanTitle.length < 2) {
            cleanTitle = text.trim();
        }

        return { worker_name: workerName || 'عمومي', title: cleanTitle };
    }

    // Smart Fallback Parser (Local Conversational & Action Engine)
    const lower = userText.toLowerCase();

    // 1. Casual Chat & Greetings
    if (lower.includes('كيفك') || lower.includes('كيف حالك') || lower.includes('how are you') || lower.includes('مرحبا') || lower.includes('مرحباً') || lower.includes('أهلا') || lower.includes('هلا') || lower.includes('hello') || lower.includes('hi')) {
        renderAIChatMessage('bot', isAr ? 'أهلاً وسهلاً بك! أنا بخير ولله الحمد. أنا مساعدك الذكي ومستعد لمساعدتك في إضافة المنتجات، إسناد المهام، وتصفح أقسام اللوحة. كيف يمكنني مساعدتك الآن؟' : 'Hello! I am doing great, thank you! I am your AI Assistant ready to help you manage products, tasks, and navigation. How can I assist you today?');
        return;
    }

    // 1.2 General Knowledge Riddles (e.g. Who came first: egg or chicken?)
    if (lower.includes('egg') || lower.includes('chicken') || lower.includes('بيضة') || lower.includes('دجاجة') || lower.includes('البيضة') || lower.includes('الدجاجة')) {
        renderAIChatMessage('bot', isAr
            ? 'سؤال علمي وفلسفي رائع! 🥚🐓\nعلمياً، **البيضة سبقت الدجاجة** بحوالي ملايين السنين! لأن الكائنات البياضة كالديناصورات والزواحف القديمة كانت تضع بيضاً قشرياً قبل ظهور الدجاج الحديث على كوكب الأرض بأجيال طوال!'
            : 'A classic scientific riddle! 🥚🐓\nScientifically, **the egg came first**! Egg-laying creatures like dinosaurs existed millions of years before modern chickens evolved on Earth!');
        return;
    }

    // 1.22 General Knowledge & Geography Knowledge Base (Capitals, Math, Science, Facts)
    if (lower.includes('capital') || lower.includes('capitol') || lower.includes('عاصمة')) {
        if (lower.includes('sudan') || lower.includes('السودان')) {
            renderAIChatMessage('bot', isAr ? "عاصمة السودان هي **الخرطوم**." : "The capital of Sudan is **Khartoum**.");
            return;
        }
        if (lower.includes('saudi') || lower.includes('السعودية')) {
            renderAIChatMessage('bot', isAr ? "عاصمة المملكة العربية السعودية هي **الرياض**." : "The capital of Saudi Arabia is **Riyadh**.");
            return;
        }
        if (lower.includes('egypt') || lower.includes('مصر')) {
            renderAIChatMessage('bot', isAr ? "عاصمة مصر هي **القاهرة**." : "The capital of Egypt is **Cairo**.");
            return;
        }
        if (lower.includes('france') || lower.includes('فرنسا')) {
            renderAIChatMessage('bot', isAr ? "عاصمة فرنسا هي **باريس**." : "The capital of France is **Paris**.");
            return;
        }
        if (lower.includes('japan') || lower.includes('اليابان')) {
            renderAIChatMessage('bot', isAr ? "عاصمة اليابان هي **طوكيو**." : "The capital of Japan is **Tokyo**.");
            return;
        }
        if (lower.includes('usa') || lower.includes('america') || lower.includes('امريكا') || lower.includes('أمريكا')) {
            renderAIChatMessage('bot', isAr ? "عاصمة الولايات المتحدة الأمريكية هي **واشنطن العاصمة** (Washington, D.C.)." : "The capital of the United States is **Washington, D.C.**.");
            return;
        }
        if (lower.includes('uk') || lower.includes('england') || lower.includes('بريطانيا')) {
            renderAIChatMessage('bot', isAr ? "عاصمة بريطانيا هي **لندن**." : "The capital of the United Kingdom is **London**.");
            return;
        }
        if (lower.includes('uae') || lower.includes('إمارات') || lower.includes('امارات')) {
            renderAIChatMessage('bot', isAr ? "عاصمة الإمارات العربية المتحدة هي **أبوظبي**." : "The capital of the UAE is **Abu Dhabi**.");
            return;
        }
    }

    // Math calculation solver
    const mathMatch = userText.match(/(\d+\s*[\+\-\*\/]\s*\d+)/);
    if (mathMatch) {
        try {
            const mathResult = Function('"use strict";return (' + mathMatch[1] + ')')();
            renderAIChatMessage('bot', isAr ? `نتيجة العملية الحسابية (${mathMatch[1]}) تساوي **${mathResult}**.` : `The result of (${mathMatch[1]}) is **${mathResult}**.`);
            return;
        } catch (e) { }
    }

    // 1.25 Admin Reminders Query Handler (Red Alert / Due Reminders)
    if (lower.includes('reminder') || lower.includes('reminders') || lower.includes('تذكير') || lower.includes('تذكيرات') || lower.includes('التذكيرات')) {
        const remSummary = getRemindersSummary();
        let resp = '';
        if (remSummary.totalCount === 0) {
            resp = isAr ? 'لا توجد لديك أي تذكيرات مضافة حالياً.' : 'You have no reminders currently set.';
        } else {
            if (remSummary.redDueReminders.length > 0) {
                const list = remSummary.redDueReminders.map(r => {
                    const statusTag = r.isOverdue
                        ? (isAr ? '🔴 متأخر جداً (مستحق)' : '🔴 OVERDUE / DUE NOW')
                        : (r.deadlineDateStr === remSummary.todayStr ? (isAr ? '🔴 مستحق اليوم' : '🔴 DUE TODAY') : (isAr ? '🚨 تنبيه عاجل (0-2 يوم متبقي)' : '🚨 Urgent (0-2 Days Left)'));
                    return `• ${statusTag}: **${r.title}** ${r.amount ? `(${r.amount} SR)` : ''} - Deadline: ${r.deadlineDateStr || 'Today'} (Category: ${r.category || 'General'})`;
                }).join('\n');
                resp = isAr
                    ? `🚨 **التذكيرات الحمراء والمستحقة اليوم (${remSummary.todayStr})**:\n${list}`
                    : `🚨 **Red Alerts & Reminders Due Today (${remSummary.todayStr})**:\n${list}`;
            } else {
                const upcoming = remSummary.upcomingReminders.slice(0, 5).map(r => `• ⏰ **${r.title}** (Deadline: ${r.deadlineDateStr || 'Soon'}) ${r.amount ? `(${r.amount} SR)` : ''}`).join('\n');
                resp = isAr
                    ? `لا توجد تذكيرات حمراء أو مستحقة اليوم. إليك التذكيرات القادمة:\n${upcoming}`
                    : `No red alerts or reminders due today. Here are your upcoming scheduled reminders:\n${upcoming}`;
            }
        }
        renderAIChatMessage('bot', resp);
        return;
    }

    // 1.3 Sales Handler (Today, Yesterday, Last Week, Last Month, Specific Date)
    const isSalesQuery = /(sales|sles|sls|sals|saales|revenue|income|made|earned|turnover|مبيعات|مبعات|المبيعات|مبيعاتي|دخل|الدخل|أرباح|ارباح|كسبنا|طلعت|طلعنا|عملنا|جبنا|ربحنا)/i.test(lower) ||
        (lower.includes('today') && (lower.includes('how much') || lower.includes('total') || lower.includes('money'))) ||
        (lower.includes('اليوم') && (lower.includes('كم') || lower.includes('إجمالي') || lower.includes('اجمالي') || lower.includes('مجموع')));

    if (isSalesQuery) {
        const isYesterday = lower.includes('yesterday') || lower.includes('أمس') || lower.includes('امس') || lower.includes('البارحة');
        const isWeek = lower.includes('last week') || lower.includes('past week') || lower.includes('this week') || lower.includes('week') || lower.includes('أسبوع') || lower.includes('اسبوع');
        const isMonth = lower.includes('last month') || lower.includes('past month') || lower.includes('this month') || lower.includes('month') || lower.includes('شهر');
        const specificDateMatch = userText.match(/(\d{4}-\d{2}-\d{2})/);

        if (isYesterday || isWeek || isMonth || specificDateMatch) {
            const histData = getSalesForTimeframe(userText);
            const formattedNum = histData.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const msg = isAr
                ? `مبيعاتك لـ ${histData.timeframeLabel} - هي (${formattedNum} ر.س)`
                : `Your sales for ${histData.timeframeLabel} - is (${formattedNum} SR)`;
            renderAIChatMessage('bot', msg);
            return;
        } else {
            const salesData = getTodaySalesSummary();
            const formattedNum = salesData.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const msg = isAr
                ? `مبيعاتك اليوم - (${salesData.todayStr}) - هي (${formattedNum} ر.س)`
                : `Your sales today - (${salesData.todayStr}) - is (${formattedNum} SR)`;
            renderAIChatMessage('bot', msg);
            return;
        }
    }

    // 1.4 Financial & Worker Payroll Reports Engine
    if (lower.includes('راتب') || lower.includes('خصم') || lower.includes('سجل') || lower.includes('مال') || lower.includes('مقارنة') || lower.includes('history') || lower.includes('salary') || lower.includes('report') || lower.includes('money')) {
        let data = typeof getCompanyData === 'function' ? getCompanyData() : {};
        let workers = (data && data.workers && Array.isArray(data.workers)) ? data.workers : [];

        let targetWorker = workers.find(w => w && w.name && (lower.includes(w.name.toLowerCase()) || w.name.toLowerCase().includes(lower)));
        if (!targetWorker) {
            const workerMatch = userText.match(/(?:للموظف|للعامل|لـ|إلى|for worker|worker|employee)\s+([\u0600-\u06FFa-zA-Z]+)/i);
            if (workerMatch && workerMatch[1]) {
                const searchName = workerMatch[1].toLowerCase().trim();
                targetWorker = workers.find(w => w && w.name && (w.name.toLowerCase().includes(searchName) || searchName.includes(w.name.toLowerCase())));
            }
        }

        if (targetWorker) {
            const month = (typeof currentGlobalMonth !== 'undefined' && currentGlobalMonth) ? currentGlobalMonth : new Date().toISOString().substr(0, 7);
            const stats = (typeof getMonthlyStats === 'function') ? getMonthlyStats(targetWorker, month) : {};
            const bal = (typeof getCumulativeBalance === 'function') ? getCumulativeBalance(targetWorker, month) : (targetWorker.initialBalance || 0);
            const salary = targetWorker.income || 0;
            const custody = (typeof calculateCustodyTotal === 'function' && stats.custodyList) ? calculateCustodyTotal(stats.custodyList) : 0;
            const violations = (typeof calculateViolationsTotal === 'function' && stats.violationsList) ? calculateViolationsTotal(stats.violationsList) : 0;
            const rewards = (typeof calculateRewardsTotal === 'function' && stats.rewardsList) ? calculateRewardsTotal(stats.rewardsList) : 0;
            const paid = (typeof calculatePaymentsTotal === 'function' && stats.paymentsList) ? calculatePaymentsTotal(stats.paymentsList) : 0;

            const rep = isAr
                ? `📊 **التقرير المالي الفردي للموظف (${targetWorker.name})**:\n- 💼 **المسمى الوظيفي**: ${targetWorker.role || 'موظف'}\n- 💵 **الراتب الأساسي**: ${salary} ر.س\n- 💰 **الرصيد التراكمي المتبقي**: ${bal} ر.س\n- 💳 **المدفوعات هذا الشهر**: ${paid} ر.س\n- 🎁 **المكافآت**: ${rewards} ر.س\n- ⚠️ **المخالفات والخصومات**: ${violations} ر.س\n- 📦 **إجمالي العهد المالية**: ${custody} ر.س\n- 🏢 **الفرع**: ${targetWorker.branch || 'الفرع الرئيسي'}`
                : `📊 **Financial Report for Worker (${targetWorker.name})**:\n- 💼 **Role**: ${targetWorker.role || 'Staff'}\n- 💵 **Base Salary**: ${salary} SR\n- 💰 **Cumulative Balance Remaining**: ${bal} SR\n- 💳 **Paid This Month**: ${paid} SR\n- 🎁 **Rewards**: ${rewards} SR\n- ⚠️ **Violations**: ${violations} SR\n- 📦 **Total Custody**: ${custody} SR\n- 🏢 **Branch**: ${targetWorker.branch || 'Main Branch'}`;

            renderAIChatMessage('bot', rep);
            return;
        }

        const liveSummary = getCompanyLiveContextSummary();
        renderAIChatMessage('bot', isAr
            ? `إليك تقرير البيانات المباشر للشركة والنظام:\n\n${liveSummary}`
            : `Here is the live real-time system & payroll analytics report:\n\n${liveSummary}`);
        return;
    }

    // 1.5 Context Follow-Up Update (e.g. "set its weight to 400 g", "غير وزنه إلى 400 جرام", "change price to 1500")
    if (window._lastAIContext && window._lastAIContext.id && (lower.includes('weight') || lower.includes('waight') || lower.includes('وزن') || lower.includes('price') || lower.includes('سعر') || lower.includes('اجعل') || lower.includes('غير') || lower.includes('تعديل') || lower.includes('set') || lower.includes('change') || lower.includes('update') || lower.includes('make'))) {
        let weightMatch = userText.match(/(\d+(?:\.\d+)?\s*(?:kg|g|gm|kgm|كجم|جم|جرام|غرام))/i);
        let weight = weightMatch ? weightMatch[1].trim() : null;

        let priceMatch = userText.match(/(?:سعر|price|sr|ريال|بـ|بكمية)?\s*(\d+(?:\.\d+)?)/i);
        let price = priceMatch && !weightMatch ? parseFloat(priceMatch[1]) : null;

        if (weight || price) {
            const res = executeAIToolAction('update_last_entity', { weight, price });
            renderAIChatMessage('bot', res.message, res.actionBadge);
            return;
        }
    }

    // 2. Add Market Product Action
    if (lower.includes('منتج') || lower.includes('product') || lower.includes('لحم') || lower.includes('خضار') || lower.includes('أضف') || lower.includes('اضف') || lower.includes('نزل')) {
        const prodInfo = extractProductInfo(userText);
        const res = executeAIToolAction('add_market_product', prodInfo);
        renderAIChatMessage('bot', res.message, res.actionBadge);
        return;
    }

    // 3. Create Worker Task Action
    if (lower.includes('مهمة') || lower.includes('مهمه') || lower.includes('ارسل') || lower.includes('task') || lower.includes('واجب')) {
        const taskInfo = extractTaskInfo(userText);
        const res = executeAIToolAction('create_worker_task', taskInfo);
        renderAIChatMessage('bot', res.message, res.actionBadge);
        return;
    }

    // 4. UI Navigation Action
    if (lower.includes('مطبخ') || lower.includes('تحضير') || lower.includes('سوق') || lower.includes('افتح') || lower.includes('انتقل') || lower.includes('open') || lower.includes('kitchen')) {
        const res = executeAIToolAction('navigate_to_tab', { tab_name: userText });
        renderAIChatMessage('bot', res.message, res.actionBadge);
        return;
    }

    // 5. Refill Balance Action
    if (lower.includes('رصيد') || lower.includes('شحن') || lower.includes('تعبئة') || lower.includes('coin') || lower.includes('sr')) {
        const amountMatch = userText.match(/(\d+)/);
        const amount = amountMatch ? parseFloat(amountMatch[1]) : 500;
        const res = executeAIToolAction('refill_customer_balance', { amount });
        renderAIChatMessage('bot', res.message, res.actionBadge);
        return;
    }

    // 6. Smart General Conversational Handler (Jokes, Science, Riddles, Advice, Chit-Chat)
    if (lower.includes('نكتة') || lower.includes('دعابة') || lower.includes('joke')) {
        renderAIChatMessage('bot', isAr
            ? '😀 لماذا لا تكذب الأسماك؟ لأن الجميع يمكنهم رُؤية شفاهها تحت الماء! 🐟'
            : '😀 Why don\'t scientists trust atoms? Because they make up everything!');
        return;
    }

    if (lower.includes('من انت') || lower.includes('من أنت') || lower.includes('who are you') || lower.includes('ما هو اسمك') || lower.includes('اسمك')) {
        renderAIChatMessage('bot', isAr
            ? 'أنا مساعدك الذكي المعتمد على ذكاء Gemini! يمكنني إجابة أسئلتك العامة والتحليلية، ومساعدتك في إدارة المبيعات، العمال، التذكيرات، والمنتجات.'
            : 'I am your Smart Executive Manager powered by Gemini AI! I can answer general and analytical questions, and help you manage sales, staff, reminders, and market products.');
        return;
    }

    renderAIChatMessage('bot', isAr
        ? `أهلاً بك! بالنسبة لـ "${userText}": أعمل كمساعد تنفيذي متصل بـ Gemini. يمكنك استفساري عن المبيعات، التذكيرات الحمراء، حسابات العمال، أو استخدام مفتاح Gemini API المجاني للإجابة عن المعارف العامة العميقة!`
        : `Welcome! Regarding "${userText}": I am your Executive AI Manager connected to Gemini. You can ask me about sales history, red reminders, staff reports, or input your free Gemini API Key for unrestricted general answers!`);
}
window.handleAIChatSubmit = handleAIChatSubmit;

// =============================================
// ADMIN INFORMATION & DOCUMENT VAULT MODULE
// =============================================
let vaultActiveCategoryFilter = 'ALL';
let currentVaultImageData = null;

function toggleVaultAddForm() {
    const container = document.getElementById('vault-add-form-container');
    if (!container) return;
    if (container.style.display === 'none' || !container.style.display) {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
        clearVaultForm();
    }
}
window.toggleVaultAddForm = toggleVaultAddForm;

function clearVaultForm() {
    const title = document.getElementById('vault-note-title');
    const cat = document.getElementById('vault-note-category');
    const text = document.getElementById('vault-note-text');
    const file = document.getElementById('vault-note-image-file');
    if (title) title.value = '';
    if (cat) cat.value = 'General';
    if (text) text.value = '';
    if (file) file.value = '';
    clearVaultImagePreview();
}
window.clearVaultForm = clearVaultForm;

function handleVaultImagePreview(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const maxDim = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxDim) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                }
            } else {
                if (height > maxDim) {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            currentVaultImageData = canvas.toDataURL('image/jpeg', 0.82);

            const previewImg = document.getElementById('vault-img-preview');
            const previewContainer = document.getElementById('vault-img-preview-container');
            const clearBtn = document.getElementById('vault-clear-img-btn');

            if (previewImg) previewImg.src = currentVaultImageData;
            if (previewContainer) previewContainer.style.display = 'block';
            if (clearBtn) clearBtn.style.display = 'inline-block';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}
window.handleVaultImagePreview = handleVaultImagePreview;

function clearVaultImagePreview() {
    currentVaultImageData = null;
    const previewImg = document.getElementById('vault-img-preview');
    const previewContainer = document.getElementById('vault-img-preview-container');
    const clearBtn = document.getElementById('vault-clear-img-btn');
    const fileInput = document.getElementById('vault-note-image-file');

    if (previewImg) previewImg.src = '';
    if (previewContainer) previewContainer.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
    if (fileInput) fileInput.value = '';
}
window.clearVaultImagePreview = clearVaultImagePreview;

function postVaultNote() {
    const titleEl = document.getElementById('vault-note-title');
    const catEl = document.getElementById('vault-note-category');
    const textEl = document.getElementById('vault-note-text');

    const title = titleEl ? titleEl.value.trim() : '';
    const category = catEl ? catEl.value : 'General';
    const text = textEl ? textEl.value.trim() : '';

    if (!title && !text && !currentVaultImageData) {
        if (typeof showInAppNotification === 'function') showInAppNotification("⚠️ Please enter a title, details, or upload an image.");
        else alert("Please enter a title, details, or upload an image.");
        return;
    }

    const noteId = 'vault_' + Date.now();
    const noteObj = {
        id: noteId,
        title: title || 'Information Note',
        category: category,
        text: text || '',
        imageUrl: currentVaultImageData || '',
        createdAt: Date.now(),
        createdBy: (currentUser && currentUser.email) ? currentUser.email : 'Admin'
    };

    db.ref('companies/' + currentCompany + '/vaultNotes/' + noteId).set(noteObj)
        .then(() => {
            if (typeof showInAppNotification === 'function') showInAppNotification("✅ Information note saved successfully!");
            toggleVaultAddForm();
            renderVaultNotes();
        })
        .catch(err => {
            console.error("Failed to save vault note:", err);
            if (typeof showInAppNotification === 'function') showInAppNotification("❌ Failed to save note: " + err.message);
        });
}
window.postVaultNote = postVaultNote;

function setVaultCategoryFilter(cat) {
    vaultActiveCategoryFilter = cat;
    document.querySelectorAll('.btn-vault-filter').forEach(btn => {
        const isMatch = btn.getAttribute('data-cat') === cat;
        btn.classList.toggle('active-vault-filter', isMatch);
        btn.style.background = isMatch ? '#6366f1' : 'transparent';
        btn.style.color = isMatch ? 'white' : 'var(--text-main)';
    });
    renderVaultNotes();
}
window.setVaultCategoryFilter = setVaultCategoryFilter;

function renderVaultNotes() {
    const grid = document.getElementById('vault-notes-grid');
    if (!grid) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const notesObj = data.vaultNotes || {};
    let notes = Object.values(notesObj);

    const statTotal = document.getElementById('vault-stat-total');
    if (statTotal) {
        statTotal.textContent = isAr ? `${notes.length} عنصر` : `${notes.length} Item${notes.length === 1 ? '' : 's'}`;
    }

    // Search input filtering
    const searchInput = document.getElementById('vault-search-input');
    const q = searchInput ? searchInput.value.toLowerCase().trim() : '';

    if (q) {
        notes = notes.filter(n => {
            if (!n) return false;
            const t = (n.title || '').toLowerCase();
            const txt = (n.text || '').toLowerCase();
            const cat = (n.category || '').toLowerCase();
            const dateStr = n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '';
            return t.includes(q) || txt.includes(q) || cat.includes(q) || dateStr.includes(q);
        });
    }

    // Category filtering
    if (vaultActiveCategoryFilter !== 'ALL') {
        notes = notes.filter(n => n && n.category === vaultActiveCategoryFilter);
    }

    // Sort newest first
    notes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (notes.length === 0) {
        const emptyTitle = isAr ? 'لا توجد ملاحظات أو وثائق معلومات' : 'No Information Notes Found';
        const emptyDesc = q 
            ? (isAr ? 'لا توجد عناصر تطابق البحث. حاول تغيير نص البحث.' : 'No items match your search filter. Try clearing the search box.') 
            : (isAr ? 'انقر فوق "إضافة ملاحظة معلومات جديدة" أعلاه لرفع رخص المركبات، العقود، كلمات السر، أو الأوراق الرسمية.' : 'Click "Add New Note" above to upload vehicle licenses, contracts, passwords, or official documents.');
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; background: var(--input-bg); border-radius: 20px; border: 2px dashed var(--border-color);">
                <div style="font-size: 3.5rem; margin-bottom: 14px;">📁</div>
                <h3 style="font-size: 1.2rem; color: var(--text-main); margin-bottom: 8px; font-weight: 900;">${emptyTitle}</h3>
                <p style="color: var(--text-muted); font-size: 0.92rem; max-width: 450px; margin: 0 auto; line-height: 1.6;">${emptyDesc}</p>
            </div>
        `;
        return;
    }

    const catBadgeStyles = {
        Vehicle: 'background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white;',
        Contracts: 'background: linear-gradient(135deg, #10b981, #047857); color: white;',
        Passwords: 'background: linear-gradient(135deg, #f59e0b, #b45309); color: white;',
        Documents: 'background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white;',
        General: 'background: linear-gradient(135deg, #64748b, #334155); color: white;'
    };

    const catBadgeLabels = {
        Vehicle: isAr ? '🚗 مركبات ورخص' : 'Vehicle',
        Contracts: isAr ? '📜 عقود ووثائق' : 'Contracts',
        Passwords: isAr ? '🔑 كلمات سر' : 'Passwords',
        Documents: isAr ? '🆔 ثبوتيات' : 'Documents',
        General: isAr ? '📌 عامة' : 'General'
    };

    const countBadge = document.getElementById('vault-count-badge');
    if (countBadge) {
        countBadge.textContent = isAr ? `${notes.length} عنصر` : `${notes.length} Item${notes.length === 1 ? '' : 's'}`;
    }

    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
    grid.style.gap = '16px';
    grid.style.width = '100%';

    grid.innerHTML = notes.map(n => {
        const dateStr = n.createdAt ? new Date(n.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
        const badgeStyle = catBadgeStyles[n.category] || catBadgeStyles.General;
        const badgeLabel = catBadgeLabels[n.category] || (n.category || (isAr ? 'عامة' : 'General'));
        const safeTitle = typeof escapeHtml === 'function' ? escapeHtml(n.title) : (n.title || '');
        const safeText = typeof escapeHtml === 'function' ? escapeHtml(n.text) : (n.text || '');
        const safeCreatedBy = typeof escapeHtml === 'function' ? escapeHtml(n.createdBy || (isAr ? 'المدير' : 'Admin')) : (n.createdBy || (isAr ? 'المدير' : 'Admin'));

        return `
            <div class="ledger-card" style="
                margin: 0;
                padding: 16px;
                border-radius: 14px;
                border: 1px solid var(--border-color);
                background: var(--card-bg);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                box-shadow: var(--shadow-sm);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            ">
                <div>
                    <!-- Image Card (If Uploaded) -->
                    ${n.imageUrl ? `
                        <div style="
                            position: relative;
                            cursor: pointer;
                            overflow: hidden;
                            border-radius: 10px;
                            border: 1px solid var(--border-color);
                            margin-bottom: 12px;
                            height: 160px;
                            background: var(--input-bg);
                        " onclick="openImageModal('${n.imageUrl}')">
                            <img src="${n.imageUrl}" alt="${safeTitle}" style="width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 10px; transition: transform 0.2s ease;" onmouseenter="this.style.transform='scale(1.03)'" onmouseleave="this.style.transform='none'">
                            <div style="
                                position: absolute;
                                bottom: 8px;
                                right: 8px;
                                background: rgba(0, 0, 0, 0.75);
                                color: white;
                                padding: 3px 8px;
                                border-radius: 8px;
                                font-size: 0.72rem;
                                font-weight: 800;
                                backdrop-filter: blur(4px);
                            ">${isAr ? '🔍 تكبير' : '🔍 Zoom'}</div>
                        </div>
                    ` : ''}

                    <!-- Title & Category Header -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px;">
                        <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
                            <span style="${badgeStyle} display: inline-block; width: fit-content; padding: 3px 8px; border-radius: 14px; font-weight: 800; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                ${badgeLabel}
                            </span>
                            <strong style="font-size: 1.05rem; color: var(--text-main); word-break: break-word; line-height: 1.3;">${safeTitle}</strong>
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                            <button type="button" onclick="copyVaultText('${n.id}')" title="${isAr ? 'نسخ النص' : 'Copy Text'}" style="background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 6px; padding: 4px 8px; font-size: 0.78rem; font-weight: 700; cursor: pointer; color: var(--text-main);">${isAr ? '📋 نسخ' : '📋 Copy'}</button>
                            <button type="button" onclick="deleteVaultNote('${n.id}')" title="${isAr ? 'حذف الملاحظة' : 'Delete Note'}" style="background: rgba(220, 38, 38, 0.1); border: 1px solid rgba(220, 38, 38, 0.25); border-radius: 6px; padding: 4px 8px; font-size: 0.78rem; font-weight: 700; cursor: pointer; color: var(--danger);">🗑️</button>
                        </div>
                    </div>

                    <!-- Text Details directly UNDER Image & Title -->
                    ${n.text ? `
                        <div id="vault-text-${n.id}" style="
                            font-size: 0.88rem;
                            color: var(--text-main);
                            background: var(--input-bg);
                            padding: 10px 12px;
                            border-radius: 10px;
                            border: 1px dashed var(--border-color);
                            margin-top: 8px;
                            white-space: pre-wrap;
                            line-height: 1.5;
                            font-family: inherit;
                        ">${safeText}</div>
                    ` : ''}
                </div>

                <!-- Footer Timestamp -->
                <div style="
                    margin-top: 12px;
                    padding-top: 8px;
                    border-top: 1px solid var(--border-color);
                    font-size: 0.74rem;
                    color: var(--text-muted);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span>🕒 ${dateStr}</span>
                    <span>👤 ${safeCreatedBy}</span>
                </div>
            </div>
        `;
    }).join('');
}
window.renderVaultNotes = renderVaultNotes;

function copyVaultText(noteId) {
    const textEl = document.getElementById(`vault-text-${noteId}`);
    if (!textEl) return;
    const txt = textEl.textContent || textEl.innerText;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(() => {
            if (typeof showInAppNotification === 'function') showInAppNotification("📋 Text copied to clipboard!");
        });
    } else {
        if (typeof showInAppNotification === 'function') showInAppNotification("📋 " + txt);
    }
}
window.copyVaultText = copyVaultText;

function deleteVaultNote(noteId) {
    if (!confirm("Are you sure you want to delete this information note?")) return;

    db.ref('companies/' + currentCompany + '/vaultNotes/' + noteId).remove()
        .then(() => {
            if (typeof showInAppNotification === 'function') showInAppNotification("🗑️ Note deleted.");
            renderVaultNotes();
        })
        .catch(err => {
            console.error("Failed to delete vault note:", err);
            if (typeof showInAppNotification === 'function') showInAppNotification("❌ Delete failed: " + err.message);
        });
}
window.deleteVaultNote = deleteVaultNote;

// --- MESSAGING & WHATSAPP GATEWAY SYSTEM ---
let activeTemplateInputId = 'msg-tpl-task';

function setActiveTemplateInput(id) {
    activeTemplateInputId = id;
}
window.setActiveTemplateInput = setActiveTemplateInput;

function insertTemplateTag(tag) {
    const el = document.getElementById(activeTemplateInputId || 'msg-tpl-task');
    if (!el) return;

    const start = el.selectionStart || el.value.length;
    const end = el.selectionEnd || el.value.length;
    const text = el.value;
    const selectedText = text.substring(start, end);

    if (tag === '*bold*' || tag === '*') {
        if (selectedText.length > 0) {
            const wrapped = `*${selectedText}*`;
            el.value = text.substring(0, start) + wrapped + text.substring(end);
            el.selectionStart = el.selectionEnd = start + wrapped.length;
        } else {
            const inserted = '*نص عريض*';
            el.value = text.substring(0, start) + inserted + text.substring(end);
            el.selectionStart = start + 1;
            el.selectionEnd = start + inserted.length - 1;
        }
    } else if (tag === '_italic_' || tag === '_') {
        if (selectedText.length > 0) {
            const wrapped = `_${selectedText}_`;
            el.value = text.substring(0, start) + wrapped + text.substring(end);
            el.selectionStart = el.selectionEnd = start + wrapped.length;
        } else {
            const inserted = '_نص مائل_';
            el.value = text.substring(0, start) + inserted + text.substring(end);
            el.selectionStart = start + 1;
            el.selectionEnd = start + inserted.length - 1;
        }
    } else {
        el.value = text.substring(0, start) + tag + text.substring(end);
        el.selectionStart = el.selectionEnd = start + tag.length;
    }
    el.focus();
}
window.insertTemplateTag = insertTemplateTag;

function resetTemplateToDefault(type) {
    const defaults = {
        task: '📋 مرحباً {worker_name}! تم إسناد مهمة جديدة لك: "{task_title}". افتح اللوحة للمتابعة.',
        delivery: '🛵 مرحباً {worker_name}! طلب توصيل جديد #{order_id} للعميل: {customer_name}.',
        prepare: '👨‍🍳 تنبيه التحضير! طلب سوق جديد #{order_id} يحتوي على {items_count} أصناف بحاجة للتحضير.',
        violation: '⚠️ تنبيه هام {worker_name}: تم تسجيل مخالفة على ملفك بقيمة {amount} ر.س: "{reason}".',
        reward: '🎉 مبروك {worker_name}! تم إضافة مكافأة لك بقيمة {amount} ر.س: "{reason}".',
        expiry: '⏰ تنبيه انتهاء الوثيقة: {doc_name} ينتهي خلال {days} أيام بتاريخ {expiry_date}.'
    };
    const el = document.getElementById(`msg-tpl-${type}`);
    if (el && defaults[type]) {
        el.value = defaults[type];
    }
}
window.resetTemplateToDefault = resetTemplateToDefault;

function renderMessagingSection() {
    const list = document.getElementById('messaging-workers-list');
    if (!list) return;

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const workers = data.workers || [];
    const tpls = data.messagingTemplates || {};
    const config = data.messagingConfig || {};

    // Populate Gateway credentials & Server URL
    const serverUrlEl = document.getElementById('wa-server-url');
    const instEl = document.getElementById('wa-instance-id');
    const tokenEl = document.getElementById('wa-token');
    if (serverUrlEl) serverUrlEl.value = config.serverUrl || 'https://burgeroov-notify.onrender.com';
    if (instEl) instEl.value = config.instanceId || '';
    if (tokenEl) tokenEl.value = config.token || '';

    const defaultTpls = {
        task: '📋 مرحباً {worker_name}! تم إسناد مهمة جديدة لك: "{task_title}". افتح اللوحة للمتابعة.',
        delivery: '🛵 مرحباً {worker_name}! طلب توصيل جديد #{order_id} للعميل: {customer_name}.',
        prepare: '👨‍🍳 تنبيه التحضير! طلب سوق جديد #{order_id} يحتوي على {items_count} أصناف بحاجة للتحضير.',
        violation: '⚠️ تنبيه هام {worker_name}: تم تسجيل مخالفة على ملفك بقيمة {amount} ر.س: "{reason}".',
        reward: '🎉 مبروك {worker_name}! تم إضافة مكافأة لك بقيمة {amount} ر.س: "{reason}".',
        expiry: '⏰ تنبيه انتهاء الوثيقة: {doc_name} ينتهي خلال {days} أيام بتاريخ {expiry_date}.'
    };

    // Populate Templates
    const fields = ['task', 'delivery', 'prepare', 'violation', 'reward', 'expiry'];
    fields.forEach(f => {
        const el = document.getElementById(`msg-tpl-${f}`);
        if (el) {
            el.value = tpls[f] || defaultTpls[f];
        }
    });

    // Populate Workers Matrix List
    if (workers.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted); font-weight:700;">No workers found for this company.</div>`;
    } else {
        list.innerHTML = workers.map((w, idx) => {
            if (!w) return '';
            const phone = w.phone || '';
            const enabled = w.waAlertsEnabled !== false;
            const safeName = typeof escapeHtml === 'function' ? escapeHtml(w.name || `Worker #${idx}`) : (w.name || `Worker #${idx}`);
            const role = w.role || 'Worker';

            return `
                <div style="background:var(--card-bg); padding:10px 14px; border-radius:10px; border:1px solid var(--border-color); display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
                    <div style="flex:1; min-width:140px;">
                        <strong style="font-size:0.88rem; color:var(--text-main); display:block;">${safeName}</strong>
                        <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700;">${role}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:180px;">
                        <input type="tel" id="msg-worker-phone-${idx}" value="${phone}" placeholder="+966501234567" style="width:100%; padding:6px 10px; border-radius:6px; border:1px solid var(--border-color); background:var(--input-bg); color:var(--text-main); font-size:0.82rem; font-weight:700;">
                        <label style="display:flex; align-items:center; gap:4px; font-size:0.75rem; font-weight:800; cursor:pointer; color:var(--text-muted); white-space:nowrap;">
                            <input type="checkbox" id="msg-worker-enable-${idx}" ${enabled ? 'checked' : ''} style="width:auto;"> Alerts
                        </label>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Populate Test Worker Dropdown
    const testWorkerSelect = document.getElementById('msg-test-worker');
    if (testWorkerSelect) {
        testWorkerSelect.innerHTML = workers.map((w, idx) => {
            if (!w) return '';
            return `<option value="${idx}">${w.name || `Worker #${idx}`}</option>`;
        }).join('');
    }

    // Auto-refresh QR code status on tab open
    refreshWhatsAppQR();
}
window.renderMessagingSection = renderMessagingSection;

function saveAllMessagingSettings() {
    if (typeof db === 'undefined' || typeof currentCompany === 'undefined') return;

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const workers = data.workers || [];

    // Save Worker Phone Numbers & Alerts Enabled
    workers.forEach((w, idx) => {
        const phoneInput = document.getElementById(`msg-worker-phone-${idx}`);
        const enableInput = document.getElementById(`msg-worker-enable-${idx}`);
        if (phoneInput && w) {
            w.phone = phoneInput.value.trim();
        }
        if (enableInput && w) {
            w.waAlertsEnabled = enableInput.checked;
        }
    });

    db.ref(`companies/${currentCompany}/workers`).set(workers);

    // Save Message Templates
    const templates = {
        task: document.getElementById('msg-tpl-task')?.value || '',
        delivery: document.getElementById('msg-tpl-delivery')?.value || '',
        prepare: document.getElementById('msg-tpl-prepare')?.value || '',
        violation: document.getElementById('msg-tpl-violation')?.value || '',
        reward: document.getElementById('msg-tpl-reward')?.value || '',
        expiry: document.getElementById('msg-tpl-expiry')?.value || ''
    };

    db.ref(`companies/${currentCompany}/messagingTemplates`).set(templates);

    // Save Gateway Config
    const config = {
        serverUrl: document.getElementById('wa-server-url')?.value?.trim() || 'https://burgeroov-notify.onrender.com'
    };
    db.ref(`companies/${currentCompany}/messagingConfig`).set(config);

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    alert(isAr 
        ? '💾 تم حفظ أرقام الهواتف، رابط الخادم، وقوالب الرسائل بنجاح!' 
        : '💾 Phone numbers, Server URL, and message templates saved successfully!');
}
window.saveAllMessagingSettings = saveAllMessagingSettings;

function refreshWhatsAppQR() {
    const qrImg = document.getElementById('wa-qr-img');
    const statusText = document.getElementById('wa-connection-text');
    const serverUrlInput = document.getElementById('wa-server-url');

    const baseUrl = (serverUrlInput ? serverUrlInput.value.trim() : '') || 'https://burgeroov-notify.onrender.com';
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    if (qrImg) {
        qrImg.src = `${baseUrl}/wa/qr?t=${Date.now()}`;
    }

    // Check status via JSON
    fetch(`${baseUrl}/wa/status`)
        .then(res => res.json())
        .then(data => {
            if (statusText) {
                if (data.connected) {
                    statusText.textContent = isAr ? `🟢 متصل: ${data.user || ''}` : `🟢 Connected: ${data.user || ''}`;
                    statusText.style.color = '#10b981';
                } else if (data.qrAvailable) {
                    statusText.textContent = isAr ? '🟡 رمز QR جاهز للمسح' : '🟡 QR Code Ready to Scan';
                    statusText.style.color = '#f59e0b';
                } else {
                    statusText.textContent = isAr ? '⏳ جاري بدء خادم الواتساب...' : '⏳ Starting WhatsApp Engine...';
                    statusText.style.color = '#6366f1';
                }
            }
        })
        .catch(err => {
            if (statusText) {
                statusText.textContent = isAr ? '🔴 الخادم قيد التشغيل (أعد المحاولة)' : '🔴 Server Starting (Retry)';
                statusText.style.color = '#ef4444';
            }
        });
}
window.refreshWhatsAppQR = refreshWhatsAppQR;

function logoutWhatsAppSession() {
    const serverUrlInput = document.getElementById('wa-server-url');
    const baseUrl = (serverUrlInput ? serverUrlInput.value.trim() : '') || 'https://burgeroov-notify.onrender.com';
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    if (!confirm(isAr 
        ? 'هل أنت تأكد من قطع الاتصال برقم الواتساب الحالي لربط رقم جديد؟' 
        : 'Are you sure you want to disconnect current WhatsApp number to switch to a new phone?')) return;

    fetch(`${baseUrl}/wa/logout`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            alert(isAr 
                ? '🚪 تم تسجيل الخروج بنجاح! يتم الآن توليد كود QR جديد لربط رقم الهاتف الجديد.' 
                : '🚪 Logged out successfully! Generating a new QR code to pair your new phone.');
            setTimeout(() => refreshWhatsAppQR(), 2000);
        })
        .catch(err => {
            alert(isAr ? '❌ تعذر تسجيل الخروج: ' + err.message : '❌ Logout failed: ' + err.message);
        });
}
window.logoutWhatsAppSession = logoutWhatsAppSession;

function getWhatsAppPairingCode() {
    const phoneInput = document.getElementById('wa-pair-phone');
    const serverUrlInput = document.getElementById('wa-server-url');
    const codeDisplay = document.getElementById('wa-pair-code-display');
    const codeText = document.getElementById('wa-pair-code-text');

    const phone = phoneInput ? phoneInput.value.trim() : '';
    const baseUrl = (serverUrlInput ? serverUrlInput.value.trim() : '') || 'https://burgeroov-notify.onrender.com';
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    if (!phone || phone.length < 8) {
        alert(isAr ? 'يرجى كتابة رقم الهاتف مع رمز الدولة (مثال: 966501234567)' : 'Please enter a valid phone number with country code (e.g. 966501234567)');
        return;
    }

    if (codeDisplay) codeDisplay.style.display = 'none';

    fetch(`${baseUrl}/wa/pair-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.pairingCode) {
            if (codeText) codeText.textContent = data.pairingCode;
            if (codeDisplay) codeDisplay.style.display = 'block';
            alert(isAr 
                ? `🔢 كود الربط المكون من 8 أرقام هو: [ ${data.pairingCode} ]\n\nافتح الواتساب في هاتفك -> الأجهزة المرتبطة -> الربط برقم الهاتف بدلاً من ذلك -> أدخل الكود!` 
                : `🔢 Your 8-Digit Pairing Code is: [ ${data.pairingCode} ]\n\nOpen WhatsApp on your phone -> Linked Devices -> Link with Phone Number Instead -> Type this code!`);
        } else if (data.connected) {
            alert(isAr ? '🟢 الواتساب متصل ومربوط بالفعل!' : '🟢 WhatsApp is already connected & linked!');
        } else {
            alert(isAr ? `⚠️ تعذر توليد الكود: ${data.error || 'تأكد من تشغيل الخادم'}` : `⚠️ Failed to generate code: ${data.error || 'Check server status'}`);
        }
    })
    .catch(err => {
        alert(isAr 
            ? '❌ تعذر الاتصال بسيرفر Render:\n1. تأكد من عمل Commit & Push للتقييم على GitHub لتحديث السيرفر.\n2. تأكد من صحة رابط السيرفر (Render Server Gateway URL) أعلى الصفحة.' 
            : '❌ Cannot reach your Render server:\n1. Make sure you committed & pushed the code to GitHub to deploy to Render.\n2. Verify your exact Render Server URL at the top of the Messaging tab.');
    });
}
window.getWhatsAppPairingCode = getWhatsAppPairingCode;

function sendTestMessagingAlert() {
    const workerIdx = document.getElementById('msg-test-worker')?.value;
    const alertType = document.getElementById('msg-test-type')?.value || 'task';
    const serverUrlInput = document.getElementById('wa-server-url');
    const baseUrl = (serverUrlInput ? serverUrlInput.value.trim() : '') || 'https://burgeroov-notify.onrender.com';

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const workers = data.workers || [];
    const targetWorker = workers[workerIdx];

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    if (!targetWorker) {
        alert(isAr ? 'يرجى اختيار موظف لاختبار التنبيه.' : 'Please select a worker to test.');
        return;
    }

    const phone = targetWorker.phone;
    if (!phone) {
        alert(isAr ? `❌ لم يتم تحديد رقم هاتف للموظف "${targetWorker.name}". يرجى إدخال رقم الهاتف وحفظ الإعدادات.` : `❌ No phone number assigned to "${targetWorker.name}". Please enter a phone number first.`);
        return;
    }

    const workerName = targetWorker.name || 'Worker';
    const tplEl = document.getElementById(`msg-tpl-${alertType}`);
    let text = tplEl ? tplEl.value : 'Test notification';

    text = text.replace(/{worker_name}/g, workerName)
               .replace(/{task_title}/g, 'تنظيف وعرض المنتجات')
               .replace(/{order_id}/g, '1042')
               .replace(/{customer_name}/g, 'مطعم البرجر')
               .replace(/{amount}/g, '100')
               .replace(/{reason}/g, 'تميز في الأداء')
               .replace(/{doc_name}/g, 'استمارة الهيلوكس')
               .replace(/{days}/g, '5')
               .replace(/{expiry_date}/g, '2026-08-17');

    fetch(`${baseUrl}/wa/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, text })
    })
    .then(res => res.json())
    .then(resData => {
        if (resData.success) {
            alert(isAr 
                ? `✅ تم إرسال رسالة الواتساب بنجاح إلى الموظف ${workerName} (${phone})!\n\nنص الرسالة:\n"${text}"` 
                : `✅ WhatsApp message sent successfully to ${workerName} (${phone})!\n\nMessage:\n"${text}"`);
        } else {
            alert(isAr 
                ? `⚠️ تنبيه من الخادم: ${resData.error || 'تعذر الإرسال. تأكد من مسح رمز QR لربط الهاتف.'}` 
                : `⚠️ Server alert: ${resData.error || 'Failed to send. Ensure WhatsApp is paired via QR code.'}`);
        }
    })
    .catch(err => {
        alert(isAr ? '❌ فشل الاتصال بالخادم: ' + err.message : '❌ Network error: ' + err.message);
    });
}
window.sendTestMessagingAlert = sendTestMessagingAlert;

// Initial run
applyTranslations();
if (typeof currentCustomerSession !== 'undefined' && currentCustomerSession) {
    if (typeof applyCustomerModeUI === 'function') {
        applyCustomerModeUI();
    } else if (typeof window.applyCustomerModeUI === 'function') {
        window.applyCustomerModeUI();
    }
}





// --- AUTOMATIC IN-SCOPE WINDOW EXPORTS ---
if (typeof _getSecureFallbackAIKey === 'function') window._getSecureFallbackAIKey = _getSecureFallbackAIKey;
if (typeof getBestGeminiModelName === 'function') window.getBestGeminiModelName = getBestGeminiModelName;
