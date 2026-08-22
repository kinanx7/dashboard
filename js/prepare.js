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

        const isAdmin = document.body.classList.contains('role-admin');

        if (staffCountLabel) {
            staffCountLabel.textContent = isAr 
                ? `طاقم التحضير (${assignedStrs.length})` 
                : `Preparing Staff (${assignedStrs.length})`;
        }

        // Populate dropdown with unassigned workers (visible to admins only)
        if (prepAddSelect) {
            prepAddSelect.style.display = isAdmin ? 'inline-block' : 'none';
            if (isAdmin) {
                prepAddSelect.innerHTML = `<option value="" style="background: var(--card-bg); color: var(--text-main); font-weight: 800;">+ ${isAr ? 'إضافة موظف' : 'Add Staff'}</option>` + workers.map((w, idx) => {
                    if (!w) return '';
                    const wId = String(w.id || idx);
                    if (assignedStrs.includes(wId)) return '';
                    return `<option value="${wId}" style="background: var(--card-bg); color: var(--text-main); font-weight: 800;">${w.name || `Worker #${idx}`}</option>`;
                }).join('');
            }
        }

        // Render active worker avatar cards
        if (assignedStrs.length === 0) {
            prepBadgesDiv.innerHTML = `<span style="font-size:0.8rem; color:var(--text-muted); font-weight:700; font-style:italic;">${isAr ? '⚠️ لم يتم تعيين موظفي تحضير بعد' : '⚠️ No preparing staff assigned yet'}</span>`;
        } else {
            prepBadgesDiv.innerHTML = assignedStrs.map(wId => {
                const wObj = workers.find(w => w && String(w.id || '') === wId);
                const wName = wObj ? wObj.name : `Worker #${wId}`;
                const initial = wName.trim().charAt(0).toUpperCase() || 'W';
                const phone = wObj ? (wObj.phone || '') : '';
                const roleLabel = wObj && wObj.role ? wObj.role : (isAr ? 'محضر طلبات' : 'Prep Worker');

                const removeBtnHTML = isAdmin ? `<button type="button" onclick="togglePreparingWorkerAssignment('${wId}')" style="background: rgba(239,68,68,0.12); border: none; color: #ef4444; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 900; cursor: pointer; line-height: 1; transition: all 0.2s ease; margin-left: 2px;" title="${isAr ? 'إزالة من طاقم التحضير' : 'Remove from staff'}" onmouseover="this.style.background='#ef4444'; this.style.color='#ffffff';" onmouseout="this.style.background='rgba(239,68,68,0.12)'; this.style.color='#ef4444';">✕</button>` : '';

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
                        ${removeBtnHTML}
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

    const canDelete = document.body.classList.contains('role-admin');

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
var aiChatSpeechRecognition = aiChatSpeechRecognition || null;
var isAIChatListening = isAIChatListening || false;
var aiChatVoiceLang = aiChatVoiceLang || 'auto'; // 'auto', 'ar-SA', 'en-US'

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
var vaultActiveCategoryFilter = 'ALL';
var currentVaultImageData = null;
var currentEditingVaultId = null;

// Toggle New Folder Form / Modal
function toggleVaultFolderForm() {
    const container = document.getElementById('vault-folder-form-container');
    if (!container) return;
    if (container.style.display === 'none' || !container.style.display) {
        container.style.display = 'block';
        const input = document.getElementById('vault-folder-name-input');
        if (input) input.focus();
    } else {
        container.style.display = 'none';
        const input = document.getElementById('vault-folder-name-input');
        if (input) input.value = '';
    }
}
window.toggleVaultFolderForm = toggleVaultFolderForm;

// Save Custom Vault Folder
function saveCustomVaultFolder() {
    const nameInput = document.getElementById('vault-folder-name-input');
    const iconInput = document.getElementById('vault-folder-icon-select');
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    const folderName = nameInput ? nameInput.value.trim() : '';
    const icon = iconInput ? iconInput.value : '📁';

    if (!folderName) {
        const msg = isAr ? '⚠️ يرجى كتابة اسم المجلد الجديد.' : '⚠️ Please enter a folder name.';
        if (typeof showInAppNotification === 'function') showInAppNotification(msg);
        else alert(msg);
        return;
    }

    const folderId = 'vfolder_' + Date.now();
    const folderObj = {
        id: folderId,
        name: folderName,
        icon: icon,
        createdAt: Date.now(),
        createdBy: (typeof currentUser !== 'undefined' && currentUser && currentUser.email) ? currentUser.email : 'Admin'
    };

    db.ref('companies/' + currentCompany + '/vaultFolders/' + folderId).set(folderObj)
        .then(() => {
            const successMsg = isAr ? `✅ تم إنشاء مجلد "${folderName}" بنجاح!` : `✅ Folder "${folderName}" created successfully!`;
            if (typeof showInAppNotification === 'function') showInAppNotification(successMsg);

            if (nameInput) nameInput.value = '';
            toggleVaultFolderForm();

            vaultActiveCategoryFilter = folderId;
            renderVaultCategoryFilters();
            populateVaultCategoryDropdowns();
            renderVaultNotes();
        })
        .catch(err => {
            console.error("Failed to save vault folder:", err);
            if (typeof showInAppNotification === 'function') showInAppNotification("❌ Failed to create folder: " + err.message);
        });
}
window.saveCustomVaultFolder = saveCustomVaultFolder;

// Delete Custom Vault Folder
function deleteCustomVaultFolder(folderId, folderName) {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (folderId === 'ALL') return;

    const confirmMsg = isAr 
        ? `هل أنت متأكد من حذف المجلد "${folderName}"؟ سيتم إرجاع جميع العناصر الموجودة بداخل هذا المجلد إلى قسم "عامة".`
        : `Are you sure you want to delete folder "${folderName}"? All notes inside will be moved to General.`;

    if (!confirm(confirmMsg)) return;

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    if (!data.hiddenVaultFolders) data.hiddenVaultFolders = {};
    data.hiddenVaultFolders[folderId] = true;

    if (data.vaultFolders && data.vaultFolders[folderId]) delete data.vaultFolders[folderId];

    if (typeof appData !== 'undefined' && currentCompany && appData[currentCompany]) {
        if (!appData[currentCompany].hiddenVaultFolders) appData[currentCompany].hiddenVaultFolders = {};
        appData[currentCompany].hiddenVaultFolders[folderId] = true;
        if (appData[currentCompany].vaultFolders) delete appData[currentCompany].vaultFolders[folderId];
    }

    const notesObj = data.vaultNotes || {};
    const updates = {};
    updates[`companies/${currentCompany}/hiddenVaultFolders/${folderId}`] = true;
    updates[`companies/${currentCompany}/vaultFolders/${folderId}`] = null;

    Object.values(notesObj).forEach(n => {
        if (n && (n.category === folderId || n.category === folderName)) {
            n.category = 'General';
            updates[`companies/${currentCompany}/vaultNotes/${n.id}/category`] = 'General';
        }
    });

    if (vaultActiveCategoryFilter === folderId || vaultActiveCategoryFilter === folderName) {
        vaultActiveCategoryFilter = 'ALL';
    }

    renderVaultCategoryFilters();
    populateVaultCategoryDropdowns();
    renderVaultNotes();

    if (typeof db !== 'undefined' && currentCompany) {
        db.ref().update(updates)
            .then(() => {
                if (typeof showInAppNotification === 'function') {
                    showInAppNotification(isAr ? `🗑️ تم حذف المجلد "${folderName}" بنجاح.` : `🗑️ Folder "${folderName}" deleted successfully.`);
                }
            })
            .catch(err => console.error("Failed to delete folder:", err));
    }
}
window.deleteCustomVaultFolder = deleteCustomVaultFolder;

// Quick move note to folder (direct from card or edit modal)
function moveVaultNoteCategory(noteId, newCategory) {
    if (!noteId || !newCategory) return;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    db.ref('companies/' + currentCompany + '/vaultNotes/' + noteId + '/category').set(newCategory)
        .then(() => {
            const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
            const folders = data.vaultFolders || {};
            const folderObj = folders[newCategory] || Object.values(folders).find(f => f.name === newCategory);
            const folderName = folderObj ? `${folderObj.icon || '📁'} ${folderObj.name}` : newCategory;

            const msg = isAr ? `📂 تم نقل الملاحظة إلى مجلد "${folderName}"` : `📂 Note moved to folder "${folderName}"`;
            if (typeof showInAppNotification === 'function') showInAppNotification(msg);

            renderVaultNotes();
        })
        .catch(err => {
            console.error("Failed to move note category:", err);
        });
}
window.moveVaultNoteCategory = moveVaultNoteCategory;

// Render dynamic filter tabs bar (Standard + Custom Folders + Add Folder)
function renderVaultCategoryFilters() {
    const container = document.getElementById('vault-category-filters');
    if (!container) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const isAdmin = (typeof currentUser !== 'undefined' && currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.isAdmin));
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const customFoldersObj = data.vaultFolders || {};

    const hiddenVault = data.hiddenVaultFolders || {};
    const standardFilters = [
        { id: 'ALL', labelAr: 'جميع الملاحظات', labelEn: 'All Notes', icon: '🌟' },
        { id: 'Vehicle', labelAr: 'مركبات ورخص', labelEn: 'Vehicles', icon: '🚗' },
        { id: 'Contracts', labelAr: 'عقود ووثائق', labelEn: 'Contracts', icon: '📜' },
        { id: 'Passwords', labelAr: 'كلمات سر', labelEn: 'Passwords', icon: '🔑' },
        { id: 'Documents', labelAr: 'ثبوتيات ورخص', labelEn: 'IDs', icon: '🆔' },
        { id: 'General', labelAr: 'معلومات عامة', labelEn: 'General', icon: '📌' }
    ].filter(f => f.id === 'ALL' || !hiddenVault[f.id]);

    let html = standardFilters.map(f => {
        const isMatch = vaultActiveCategoryFilter === f.id;
        const customOverride = customFoldersObj[f.id];
        const icon = customOverride ? (customOverride.icon || f.icon) : f.icon;
        const label = customOverride ? (isAr ? (customOverride.nameAr || customOverride.name) : (customOverride.nameEn || customOverride.name)) : (isAr ? f.labelAr : f.labelEn);
        const bg = isMatch ? '#6366f1' : 'var(--card-bg)';
        const color = isMatch ? '#ffffff' : 'var(--text-main)';

        return `
            <div style="display:inline-flex; align-items:center; background:${bg}; border:1px solid ${isMatch ? '#6366f1' : 'var(--border-color)'}; border-radius:20px; padding:2px 4px 2px 10px; gap:2px; transition:all 0.2s ease;">
                <button type="button" onclick="setVaultCategoryFilter('${f.id}')" class="btn-vault-filter ${isMatch ? 'active-vault-filter' : ''}" data-cat="${f.id}" style="padding:6px 6px; border-radius:20px; font-weight:800; font-size:0.8rem; border:none; background:transparent; color:${color}; cursor:pointer;">
                    ${icon} ${label}
                </button>
                ${(isAdmin && f.id !== 'ALL') ? `
                    <button type="button" onclick="editVaultCategory('${f.id}')" style="background:none; border:none; color:${isMatch ? '#ffffff' : 'var(--primary)'}; cursor:pointer; font-size:0.75rem; font-weight:800; padding:2px 3px;" title="${isAr ? 'تعديل القسم' : 'Edit category'}">✏️</button>
                    <button type="button" onclick="deleteCustomVaultFolder('${f.id}', '${label}')" style="background:none; border:none; color:${isMatch ? '#ffffff' : 'var(--danger)'}; cursor:pointer; font-size:0.75rem; font-weight:800; padding:2px 3px;" title="${isAr ? 'حذف القسم' : 'Delete category'}">✖</button>
                ` : ''}
            </div>
        `;
    }).join('');

    // Add Custom Folders
    Object.values(customFoldersObj).forEach(cf => {
        if (!cf || !cf.id || ['ALL', 'Vehicle', 'Contracts', 'Passwords', 'Documents', 'General'].includes(cf.id)) return;

        const isMatch = vaultActiveCategoryFilter === cf.id || vaultActiveCategoryFilter === cf.name;
        const bg = isMatch ? '#6366f1' : 'var(--card-bg)';
        const color = isMatch ? '#ffffff' : 'var(--text-main)';
        const safeName = isAr ? (cf.nameAr || cf.name) : (cf.nameEn || cf.name);

        html += `
            <div style="display:inline-flex; align-items:center; background:${bg}; border:1px solid ${isMatch ? '#6366f1' : 'var(--border-color)'}; border-radius:20px; padding:2px 4px 2px 10px; gap:2px; transition:all 0.2s ease;">
                <button type="button" onclick="setVaultCategoryFilter('${cf.id}')" class="btn-vault-filter ${isMatch ? 'active-vault-filter' : ''}" data-cat="${cf.id}" style="padding:6px 6px; border-radius:20px; font-weight:800; font-size:0.8rem; border:none; background:transparent; color:${color}; cursor:pointer;">
                    ${cf.icon || '📁'} ${safeName}
                </button>
                ${isAdmin ? `
                    <button type="button" onclick="editVaultCategory('${cf.id}')" style="background:none; border:none; color:${isMatch ? '#ffffff' : 'var(--primary)'}; cursor:pointer; font-size:0.75rem; font-weight:800; padding:2px 3px;" title="${isAr ? 'تعديل المجلد' : 'Edit folder'}">✏️</button>
                    <button type="button" onclick="deleteCustomVaultFolder('${cf.id}', '${safeName}')" style="background:none; border:none; color:${isMatch ? '#ffffff' : 'var(--danger)'}; cursor:pointer; font-size:0.75rem; font-weight:800; padding:2px 3px;" title="${isAr ? 'حذف المجلد' : 'Delete folder'}">✖</button>
                ` : ''}
            </div>
        `;
    });

    // Add New Folder button at end of filter bar
    if (isAdmin) {
        html += `
            <button type="button" onclick="openVaultFolderModal()" style="padding:8px 14px; border-radius:20px; font-weight:800; font-size:0.8rem; border:2px dashed #6366f1; background:rgba(99,102,241,0.12); color:#6366f1; cursor:pointer;">
                📁 ${isAr ? '+ إنشاء مجلد جديد' : '+ New Folder'}
            </button>
        `;
    }

    container.innerHTML = html;
}
window.renderVaultCategoryFilters = renderVaultCategoryFilters;

// Populate category dropdown in Add/Edit Note form
function populateVaultCategoryDropdowns() {
    const select = document.getElementById('vault-note-category');
    if (!select) return;

    const currentVal = select.value || 'General';
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const customFoldersObj = data.vaultFolders || {};
    const customFolders = Object.values(customFoldersObj).filter(f => f && (f.id || f.name));

    let html = `
        <optgroup label="${isAr ? 'الأقسام الرئيسية (افتراضي)' : 'Standard Categories'}">
            <option value="General" ${currentVal === 'General' ? 'selected' : ''}>📌 ${isAr ? 'عامة (معلومات عامة)' : 'General Information'}</option>
            <option value="Vehicle" ${currentVal === 'Vehicle' ? 'selected' : ''}>🚗 ${isAr ? 'مركبات ورخص (استمارة/رخصة)' : 'Vehicle / License'}</option>
            <option value="Contracts" ${currentVal === 'Contracts' ? 'selected' : ''}>📜 ${isAr ? 'عقود ووثائق' : 'Contracts & Legal'}</option>
            <option value="Passwords" ${currentVal === 'Passwords' ? 'selected' : ''}>🔑 ${isAr ? 'كلمات سر ومعلومات دخول' : 'Passwords & Credentials'}</option>
            <option value="Documents" ${currentVal === 'Documents' ? 'selected' : ''}>🆔 ${isAr ? 'ثبوتيات وأوراق رسمية' : 'IDs & Official Papers'}</option>
        </optgroup>
    `;

    if (customFolders.length > 0) {
        html += `<optgroup label="${isAr ? 'المجلدات المخصصة' : 'Custom Folders'}">`;
        customFolders.forEach(cf => {
            const isSel = (currentVal === cf.id || currentVal === cf.name);
            const safeName = typeof escapeHtml === 'function' ? escapeHtml(cf.name) : cf.name;
            html += `<option value="${cf.id}" ${isSel ? 'selected' : ''}>${cf.icon || '📁'} ${safeName}</option>`;
        });
        html += `</optgroup>`;
    }

    html += `<option value="__NEW_FOLDER__">📁 ${isAr ? '+ إنشاء مجلد مخصص جديد...' : '+ Create New Folder...'}</option>`;

    select.innerHTML = html;
    select.onchange = function() {
        if (this.value === '__NEW_FOLDER__') {
            this.value = 'General';
            toggleVaultFolderForm();
        }
    };
}
window.populateVaultCategoryDropdowns = populateVaultCategoryDropdowns;

function toggleVaultAddForm() {
    const container = document.getElementById('vault-add-form-container');
    if (!container) return;
    if (container.style.display === 'none' || !container.style.display) {
        if (!currentEditingVaultId) clearVaultForm();
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
        clearVaultForm();
    }
}
window.toggleVaultAddForm = toggleVaultAddForm;

var currentVaultImagesData = [];

function renderVaultFormImagePreviews() {
    if (typeof currentVaultImageData !== 'undefined') {
        currentVaultImageData = currentVaultImagesData[0] || null;
    }
    const previewContainer = document.getElementById('vault-img-preview-container');
    const clearBtn = document.getElementById('vault-clear-img-btn');
    const fileInput = document.getElementById('vault-note-image-file');
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    if (!previewContainer) return;

    if (currentVaultImagesData.length === 0) {
        previewContainer.style.display = 'none';
        previewContainer.innerHTML = '';
        if (clearBtn) clearBtn.style.display = 'none';
        if (fileInput) fileInput.value = '';
        return;
    }

    if (clearBtn) {
        clearBtn.style.display = 'inline-block';
        clearBtn.textContent = isAr ? '✕ حذف جميع الصور' : '✕ Remove All Photos';
    }

    previewContainer.style.display = 'flex';
    previewContainer.style.flexWrap = 'wrap';
    previewContainer.style.gap = '10px';
    previewContainer.style.marginTop = '12px';

    previewContainer.innerHTML = currentVaultImagesData.map((imgUrl, idx) => `
        <div style="position: relative; display: inline-block;">
            <img src="${imgUrl}" style="max-height: 120px; border-radius: 10px; border: 2px solid #6366f1; box-shadow: var(--shadow-sm); object-fit: cover;">
            <button type="button" onclick="removeVaultFormImage(${idx})" style="
                position: absolute;
                top: -6px;
                right: -6px;
                background: #dc2626;
                color: white;
                border: none;
                border-radius: 50%;
                width: 22px;
                height: 22px;
                font-size: 0.75rem;
                font-weight: 900;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            " title="${isAr ? 'حذف هذه الصورة' : 'Delete this photo'}">✖</button>
        </div>
    `).join('');
}

function removeVaultFormImage(index) {
    if (index >= 0 && index < currentVaultImagesData.length) {
        currentVaultImagesData.splice(index, 1);
        renderVaultFormImagePreviews();
    }
}
window.removeVaultFormImage = removeVaultFormImage;

function clearVaultForm() {
    currentEditingVaultId = null;
    currentVaultImagesData = [];
    if (typeof currentVaultImageData !== 'undefined') currentVaultImageData = null;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const headerTitle = document.getElementById('vault-form-header-title');
    const submitBtn = document.getElementById('vault-submit-btn');

    if (headerTitle) {
        headerTitle.textContent = isAr ? '📝 رفع معلومات أو وثائق جديدة' : '📝 Upload New Information / Documents';
        headerTitle.setAttribute('data-i18n', 'title-upload-vault-note');
    }
    if (submitBtn) {
        submitBtn.textContent = isAr ? '🔒 حفظ ملاحظة المعلومات' : '🔒 Save Information Note';
        submitBtn.setAttribute('data-i18n', 'btn-save-vault-note');
    }

    const title = document.getElementById('vault-note-title');
    const cat = document.getElementById('vault-note-category');
    const text = document.getElementById('vault-note-text');
    const file = document.getElementById('vault-note-image-file');
    if (title) title.value = '';
    if (cat) cat.value = 'General';
    if (text) text.value = '';
    if (file) file.value = '';
    renderVaultFormImagePreviews();
}
window.clearVaultForm = clearVaultForm;

function handleVaultImagePreview(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    let processedCount = 0;
    files.forEach(file => {
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

                const base64Data = canvas.toDataURL('image/jpeg', 0.82);
                currentVaultImagesData.push(base64Data);

                processedCount++;
                if (processedCount === files.length) {
                    renderVaultFormImagePreviews();
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}
window.handleVaultImagePreview = handleVaultImagePreview;

function clearVaultImagePreview() {
    currentVaultImagesData = [];
    renderVaultFormImagePreviews();
}
window.clearVaultImagePreview = clearVaultImagePreview;

function editVaultNote(noteId) {
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const notesObj = data.vaultNotes || {};
    const noteObj = notesObj[noteId];
    if (!noteObj) return;

    currentEditingVaultId = noteId;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    const titleEl = document.getElementById('vault-note-title');
    const catEl = document.getElementById('vault-note-category');
    const textEl = document.getElementById('vault-note-text');
    const headerTitle = document.getElementById('vault-form-header-title');
    const submitBtn = document.getElementById('vault-submit-btn');

    if (titleEl) titleEl.value = noteObj.title || '';
    if (catEl) catEl.value = noteObj.category || 'General';
    if (textEl) textEl.value = noteObj.text || '';

    if (headerTitle) {
        headerTitle.textContent = isAr ? '✏️ تعديل ملاحظة / وثيقة معلومات' : '✏️ Edit Information / Document';
        headerTitle.setAttribute('data-i18n', 'title-edit-vault-note');
    }
    if (submitBtn) {
        submitBtn.textContent = isAr ? '💾 حفظ التعديلات' : '💾 Save Changes';
        submitBtn.setAttribute('data-i18n', 'btn-update-vault-note');
    }

    if (noteObj.imageUrls && Array.isArray(noteObj.imageUrls) && noteObj.imageUrls.length > 0) {
        currentVaultImagesData = [...noteObj.imageUrls];
    } else if (noteObj.imageUrl) {
        currentVaultImagesData = [noteObj.imageUrl];
    } else {
        currentVaultImagesData = [];
    }
    const fileInput = document.getElementById('vault-note-image-file');
    if (fileInput) fileInput.value = '';
    renderVaultFormImagePreviews();

    const container = document.getElementById('vault-add-form-container');
    if (container) {
        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}
window.editVaultNote = editVaultNote;

function postVaultNote() {
    const titleEl = document.getElementById('vault-note-title');
    const catEl = document.getElementById('vault-note-category');
    const textEl = document.getElementById('vault-note-text');

    const title = titleEl ? titleEl.value.trim() : '';
    const category = catEl ? catEl.value : 'General';
    const text = textEl ? textEl.value.trim() : '';
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    if (!title && !text && currentVaultImagesData.length === 0) {
        const msg = isAr ? "⚠️ يرجى كتابة عنوان أو تفاصيل أو رفع صورة." : "⚠️ Please enter a title, details, or upload an image.";
        if (typeof showInAppNotification === 'function') showInAppNotification(msg);
        else alert(msg);
        return;
    }

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const isEditing = !!currentEditingVaultId;
    const noteId = currentEditingVaultId || ('vault_' + Date.now());
    const existingNote = (data.vaultNotes && data.vaultNotes[noteId]) ? data.vaultNotes[noteId] : {};

    const noteObj = {
        id: noteId,
        title: title || (isAr ? 'ملاحظة معلومات' : 'Information Note'),
        category: category,
        text: text || '',
        imageUrl: currentVaultImagesData[0] || '',
        imageUrls: currentVaultImagesData || [],
        createdAt: existingNote.createdAt || Date.now(),
        createdBy: existingNote.createdBy || ((currentUser && currentUser.email) ? currentUser.email : 'Admin'),
        updatedAt: Date.now()
    };

    db.ref('companies/' + currentCompany + '/vaultNotes/' + noteId).set(noteObj)
        .then(() => {
            const successMsg = isEditing
                ? (isAr ? "✅ تم حفظ التعديلات بنجاح!" : "✅ Information note updated successfully!")
                : (isAr ? "✅ تم حفظ ملاحظة المعلومات بنجاح!" : "✅ Information note saved successfully!");
            if (typeof showInAppNotification === 'function') showInAppNotification(successMsg);

            const container = document.getElementById('vault-add-form-container');
            if (container) container.style.display = 'none';
            clearVaultForm();
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

    // Auto-clean stored notes in memory
    Object.values(notesObj).forEach(n => {
        if (n) {
            if (n.title) n.title = deepCleanNoteText(n.title);
            if (n.text) n.text = deepCleanNoteText(n.text);
        }
    });
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

    const customFolders = data.vaultFolders || {};

    // Render filters bar & category dropdowns
    renderVaultCategoryFilters();
    populateVaultCategoryDropdowns();

    // Category filtering with custom folder support
    if (vaultActiveCategoryFilter !== 'ALL') {
        notes = notes.filter(n => {
            if (!n) return false;
            if (n.category === vaultActiveCategoryFilter) return true;
            const cf = customFolders[vaultActiveCategoryFilter] || Object.values(customFolders).find(f => f.id === vaultActiveCategoryFilter || f.name === vaultActiveCategoryFilter);
            if (cf) {
                return n.category === cf.id || n.category === cf.name;
            }
            return false;
        });
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
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(310px, 1fr))';
    grid.style.boxSizing = 'border-box';
    grid.style.gap = '16px';
    grid.style.width = '100%';

    grid.innerHTML = notes.map(n => {
        const dateStr = n.createdAt ? new Date(n.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
        const customFolderObj = customFolders[n.category] || Object.values(customFolders).find(f => f.id === n.category || f.name === n.category);
        const badgeStyle = catBadgeStyles[n.category] || 'background: linear-gradient(135deg, #6366f1, #4f46e5); color: white;';
        let badgeLabel = catBadgeLabels[n.category];
        if (!badgeLabel) {
            if (customFolderObj) badgeLabel = `${customFolderObj.icon || '📁'} ${customFolderObj.name}`;
            else badgeLabel = `📁 ${n.category || (isAr ? 'عامة' : 'General')}`;
        }

        const customFoldersList = Object.values(customFolders).filter(f => f && (f.id || f.name));
        let moveOptionsHtml = customFoldersList.map(cf => {
            const isCurr = (n.category === cf.id || n.category === cf.name);
            const safeName = typeof escapeHtml === 'function' ? escapeHtml(cf.name) : cf.name;
            return `<option value="${cf.id}" ${isCurr ? 'disabled' : ''}>${cf.icon || '📁'} ${safeName}</option>`;
        }).join('');

        const moveSelectHtml = `
            <select onchange="moveVaultNoteCategory('${n.id}', this.value)" style="background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 6px; padding: 4px 6px; font-size: 0.76rem; font-weight: 700; color: var(--text-main); cursor: pointer;" title="${isAr ? 'نقل الملاحظة إلى مجلد آخر' : 'Move note to folder'}">
                <option value="" disabled selected>📂 ${isAr ? 'نقل إلى...' : 'Move to...'}</option>
                <optgroup label="${isAr ? 'الأقسام الرئيسية' : 'Standard Categories'}">
                    <option value="General" ${n.category === 'General' ? 'disabled' : ''}>📌 ${isAr ? 'عامة' : 'General'}</option>
                    <option value="Vehicle" ${n.category === 'Vehicle' ? 'disabled' : ''}>🚗 ${isAr ? 'مركبات' : 'Vehicles'}</option>
                    <option value="Contracts" ${n.category === 'Contracts' ? 'disabled' : ''}>📜 ${isAr ? 'عقود' : 'Contracts'}</option>
                    <option value="Passwords" ${n.category === 'Passwords' ? 'disabled' : ''}>🔑 ${isAr ? 'كلمات سر' : 'Passwords'}</option>
                    <option value="Documents" ${n.category === 'Documents' ? 'disabled' : ''}>🆔 ${isAr ? 'ثبوتيات' : 'IDs'}</option>
                </optgroup>
                ${customFoldersList.length > 0 ? `<optgroup label="${isAr ? 'المجلدات المخصصة' : 'Custom Folders'}">${moveOptionsHtml}</optgroup>` : ''}
            </select>
        `;
        const safeTitle = typeof escapeHtml === 'function' ? escapeHtml(n.title) : (n.title || '');
        const safeText = typeof escapeHtml === 'function' ? escapeHtml(n.text) : (n.text || '');
        const safeCreatedBy = typeof escapeHtml === 'function' ? escapeHtml(n.createdBy || (isAr ? 'المدير' : 'Admin')) : (n.createdBy || (isAr ? 'المدير' : 'Admin'));

        const rawText = n.text || '';
        const isLongText = rawText.length > 140 || (rawText.match(/\n/g) || []).length >= 3;
        const isMatchingSearch = q && rawText.toLowerCase().includes(q);
        const startExpanded = isMatchingSearch;

        const textStyle = startExpanded ? `
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
            display: block;
            max-height: none;
            overflow: visible;
        ` : `
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
            display: -webkit-box;
            -webkit-line-clamp: 4;
            -webkit-box-orient: vertical;
            overflow: hidden;
            max-height: 100px;
            text-overflow: ellipsis;
        `;

        return `
            <div class="ledger-card" ondblclick="if (!event.target.closest('button')) editVaultNote('${n.id}')" style="
                margin: 0;
                padding: 14px;
                border-radius: 14px;
                border: 1px solid var(--border-color);
                background: var(--card-bg);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                box-shadow: var(--shadow-sm);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                cursor: pointer;
                box-sizing: border-box;
                width: 100%;
                max-width: 100%;
                overflow: hidden;
            " title="${isAr ? 'انقر مرتين لتعديل الملاحظة' : 'Double-click to edit note'}">
                <div>
                    <!-- Image Card (If Uploaded) -->
                    <!-- Images Gallery (Single or Multi-Image Grid) -->
                    ${(() => {
                        const imgs = (n.imageUrls && Array.isArray(n.imageUrls) && n.imageUrls.length > 0) ? n.imageUrls : (n.imageUrl ? [n.imageUrl] : []);
                        if (imgs.length === 0) return '';

                        if (imgs.length === 1) {
                            return `
                                <div style="
                                    position: relative;
                                    cursor: pointer;
                                    overflow: hidden;
                                    border-radius: 10px;
                                    border: 1px solid var(--border-color);
                                    margin-bottom: 12px;
                                    height: 160px;
                                    background: var(--input-bg);
                                " onclick="openImageModal('${imgs[0]}')">
                                    <img src="${imgs[0]}" alt="${safeTitle}" style="width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 10px; transition: transform 0.2s ease;" onmouseenter="this.style.transform='scale(1.03)'" onmouseleave="this.style.transform='none'">
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
                            `;
                        } else {
                            const gridCols = imgs.length === 2 ? '1fr 1fr' : 'repeat(auto-fit, minmax(70px, 1fr))';
                            return `
                                <div style="position: relative; margin-bottom: 12px;">
                                    <div style="
                                        display: grid;
                                        grid-template-columns: ${gridCols};
                                        gap: 6px;
                                        max-height: 180px;
                                        overflow-y: auto;
                                        padding: 4px;
                                        background: var(--input-bg);
                                        border-radius: 10px;
                                        border: 1px solid var(--border-color);
                                    ">
                                        ${imgs.map(imgUrl => `
                                            <div style="position: relative; height: 80px; cursor: pointer; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color);" onclick="openImageModal('${imgUrl}')">
                                                <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.2s ease;" onmouseenter="this.style.transform='scale(1.05)'" onmouseleave="this.style.transform='none'">
                                            </div>
                                        `).join('')}
                                    </div>
                                    <span style="
                                        display: inline-block;
                                        margin-top: 4px;
                                        font-size: 0.72rem;
                                        color: var(--text-muted);
                                        font-weight: 800;
                                    ">📷 ${imgs.length} ${isAr ? 'صور مرفقة (انقر للتكبير)' : 'Photos attached (Click to view)'}</span>
                                </div>
                            `;
                        }
                    })()}

                    <!-- Row 1: Category Badge & Action Buttons (Compact, Zero Overflow) -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; gap: 6px; width: 100%; box-sizing: border-box; flex-wrap: wrap;">
                        <span style="${badgeStyle} display: inline-block; padding: 3px 8px; border-radius: 10px; font-weight: 800; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.3px; max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 1;" title="${badgeLabel}">
                            ${badgeLabel}
                        </span>
                        <div style="display: flex; align-items: center; gap: 3px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end;">
                            <button type="button" onclick="shareVaultNote('${n.id}')" title="${isAr ? 'مشاركة الملاحظة والصور في أي تطبيق' : 'Share note & photos to any app'}" style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 6px; padding: 3px 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer; color: #10b981; display: inline-flex; align-items: center; gap: 2px;">
                                <span>📲</span><span>${isAr ? 'مشاركة' : 'Share'}</span>
                            </button>
                            <button type="button" onclick="copyVaultText('${n.id}')" title="${isAr ? 'نسخ النص' : 'Copy Text'}" style="background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 6px; padding: 3px 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer; color: var(--text-main); display: inline-flex; align-items: center; gap: 2px;">
                                <span>📋</span><span>${isAr ? 'نسخ' : 'Copy'}</span>
                            </button>
                            <button type="button" onclick="editVaultNote('${n.id}')" title="${isAr ? 'تعديل الملاحظة' : 'Edit Note'}" style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 6px; padding: 3px 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer; color: #6366f1; display: inline-flex; align-items: center; gap: 2px;">
                                <span>✏️</span><span>${isAr ? 'تعديل' : 'Edit'}</span>
                            </button>
                            <button type="button" onclick="deleteVaultNote('${n.id}')" title="${isAr ? 'حذف الملاحظة' : 'Delete Note'}" style="background: rgba(220, 38, 38, 0.12); border: 1px solid rgba(220, 38, 38, 0.3); border-radius: 6px; padding: 3px 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer; color: var(--danger); display: inline-flex; align-items: center; justify-content: center;">
                                <span>🗑️</span>
                            </button>
                        </div>
                    </div>

                    <!-- Row 2: Full-Width Title (Natural Flexible Arabic Text Flow) -->
                    <div style="margin-bottom: 10px; width: 100%;">
                        <strong style="font-size: 1.08rem; font-weight: 900; color: var(--text-main); word-break: break-word; line-height: 1.4; display: block; width: 100%;">${safeTitle}</strong>
                    </div>

                    <!-- Text Details directly UNDER Image & Title -->
                    ${n.text ? `
                        <div id="vault-text-${n.id}" class="${startExpanded ? 'expanded' : ''}" style="${textStyle}">${safeText}</div>
                        ${isLongText ? `
                            <button type="button" id="vault-toggle-btn-${n.id}" onclick="toggleVaultNoteExpand('${n.id}')" style="background:none; border:none; color:var(--primary); font-size:0.78rem; font-weight:800; cursor:pointer; margin-top:6px; padding:2px 4px; display:inline-flex; align-items:center; gap:4px;">
                                📖 ${startExpanded ? (isAr ? 'طي الملاحظة' : 'Show Less') : (isAr ? 'عرض المزيد' : 'Show More')}
                            </button>
                        ` : ''}
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

function toggleVaultNoteExpand(noteId) {
    const textEl = document.getElementById(`vault-text-${noteId}`);
    const btnEl = document.getElementById(`vault-toggle-btn-${noteId}`);
    if (!textEl) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const isExpanded = textEl.classList.contains('expanded');

    if (isExpanded) {
        textEl.classList.remove('expanded');
        textEl.style.display = '-webkit-box';
        textEl.style.webkitLineClamp = '4';
        textEl.style.webkitBoxOrient = 'vertical';
        textEl.style.overflow = 'hidden';
        textEl.style.maxHeight = '100px';
        if (btnEl) btnEl.innerHTML = `📖 ${isAr ? 'عرض المزيد' : 'Show More'}`;
    } else {
        textEl.classList.add('expanded');
        textEl.style.display = 'block';
        textEl.style.webkitLineClamp = 'none';
        textEl.style.overflow = 'visible';
        textEl.style.maxHeight = 'none';
        if (btnEl) btnEl.innerHTML = `📖 ${isAr ? 'طي الملاحظة' : 'Show Less'}`;
    }
}
window.toggleVaultNoteExpand = toggleVaultNoteExpand;




function deepCleanNoteText(str) {
    if (!str) return '';
    let text = String(str);

    try {
        if (text.includes('%')) {
            text = decodeURIComponent(text);
        }
    } catch(e) {}

    // 1. Decode or clean URL-encoded linebreaks, spaces & percent noise
    text = text.replace(/%20/gi, ' ');
    text = text.replace(/A%0A0%/gi, '\n');
    text = text.replace(/A%0A/gi, '\n');
    text = text.replace(/%0A/gi, '\n');
    text = text.replace(/%0D/gi, '\n');
    text = text.replace(/%A0/gi, ' ');
    text = text.replace(/A0%/gi, ' ');
    text = text.replace(/0%/g, ' ');

    // 2. Remove HTML tags & entities
    text = text.replace(/<[^>]*>/g, '');
    text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ');

    // 3. Remove isolated capital 'A' used as separator between Arabic characters or digits
    text = text.replace(/([\u0600-\u06FF0-9])A([\u0600-\u06FF0-9])/g, '$1 $2');
    text = text.replace(/([\u0600-\u06FF0-9])A(?=\s|$|[^\u0600-\u06FF0-9])/g, '$1 ');

    // 4. Remove any remaining raw markdown symbols (*, `, #) and emojis
    text = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '');
    text = text.replace(/[\*`#_~]/g, '');

    // 5. Clean up multiple spaces & excessive linebreaks
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n\s*\n\s*\n+/g, '\n\n');

    return text.trim();
}
window.deepCleanNoteText = deepCleanNoteText;

function dataURLtoFile(dataurl, filename) {
    if (!dataurl || typeof dataurl !== 'string') return null;
    if (!dataurl.startsWith('data:')) return null;
    try {
        const arr = dataurl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    } catch (e) {
        console.warn("dataURLtoFile error:", e);
        return null;
    }
}
window.dataURLtoFile = dataURLtoFile;

async function shareVaultNote(noteId) {
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const notesObj = data.vaultNotes || {};
    const note = notesObj[noteId];

    if (!note) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    let cleanTitle = note.title ? deepCleanNoteText(note.title) : '';
    let cleanDesc = note.description ? deepCleanNoteText(note.description) : '';

    let shareText = '';
    if (cleanTitle && cleanDesc) {
        shareText = `${cleanTitle}\n\n${cleanDesc}`;
    } else {
        shareText = cleanTitle || cleanDesc || '';
    }

    if (!shareText) {
        if (typeof showInAppNotification === 'function') {
            showInAppNotification(isAr ? '⚠️ لا يوجد نص للمشاركة في هذه الملاحظة.' : '⚠️ No text to share in this note.');
        }
        return;
    }

    const shareData = {
        title: cleanTitle || 'Information Note',
        text: shareText
    };

    // Helper to copy text to clipboard as robust backup
    const copyToClipboard = (text) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
        } catch (e) {
            console.warn("Clipboard copy fallback error:", e);
        }
    };

    // MULTI-TIER BULLETPROOF APP & WEBVIEW SHARE STRATEGY
    // Tier 1: Try Native navigator.share (Text Only first for WebView compatibility)
    if (navigator.share) {
        navigator.share(shareData).then(() => {
            console.log("Successfully shared via navigator.share");
        }).catch(err => {
            if (err.name === 'AbortError') return; // User closed share sheet intentionally
            console.warn("navigator.share failed, executing Tier 2 App fallback:", err);

            // Tier 2: Copy to clipboard + WhatsApp direct URL
            copyToClipboard(shareText);
            const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
            window.open(waUrl, '_blank');

            if (typeof showInAppNotification === 'function') {
                showInAppNotification(isAr ? '📋 تم نسخ النص وإعادة التوجيه للمشاركة!' : '📋 Text copied & sharing opened!');
            }
        });
        return;
    }

    // Tier 3: Direct Web/App Fallback if navigator.share is completely missing
    copyToClipboard(shareText);
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');

    if (typeof showInAppNotification === 'function') {
        showInAppNotification(isAr ? '📋 تم نسخ النص كحفظ احتياطي وفتح المشاركة!' : '📋 Text copied to clipboard!');
    }
}
window.shareVaultNote = shareVaultNote;

function copyVaultText(noteId) {
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const notesObj = data.vaultNotes || {};
    const note = notesObj[noteId];
    const textEl = document.getElementById(`vault-text-${noteId}`);
    const txt = note ? note.text : (textEl ? (textEl.textContent || textEl.innerText) : '');

    if (!txt) return;

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
var activeTemplateInputId = 'msg-tpl-task';

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
        cycle: '🔁 تنبيه مهمة دورية مجدولة [{company_name}]\n\nالمهمة: {task_title}\nالموظف: {worker_name}\n\nيرجى الإنجاز والمتابعة!',
        inquiry: '❓ استفسار جديد من المدير [{company_name}]\n\nالموظف: {worker_name}\nسؤال المدير: "{task_title}"\n\nيرجى الرد في اللوحة برمز تم التنفيذ / لم ينفذ.',
        delivery: '🛵 مرحباً {worker_name}! طلب توصيل جديد #{order_id} للعميل: {customer_name}.',
        prepare: '👨‍🍳 تنبيه التحضير! طلب سوق جديد #{order_id} يحتوي على {items_count} أصناف بحاجة للتحضير.',
        reminder: '⏰ تنبيه تذكير هام [{company_name}]\n\nالتذكير: "{task_title}"\nالموعد النهائي: {reason}',
        payment: '💵 تم قبول طلب السلفة [{company_name}]\n\nالموظف: {worker_name}\nالمبلغ: {amount} ر.س\nرمز الصرف الخاص بك: {order_id}',
        custody: '📦 تم قبول طلب العهدة [{company_name}]\n\nالموظف: {worker_name}\nالقيمة: {amount} ر.س\nرمز الاستلام الخاص بك: {order_id}',
        violation: '⚠️ تنبيه هام {worker_name}: تم تسجيل مخالفة على ملفك بقيمة {amount} ر.س: "{reason}".',
        reward: '🎉 مبروك {worker_name}! تم إضافة مكافأة لك بقيمة {amount} ر.س: "{reason}".',
        expiry: '⏰ تنبيه انتهاء الوثيقة: {reason} ينتهي خلال {amount} أيام بتاريخ {customer_name}.'
    };
    const el = document.getElementById(`msg-tpl-${type}`);
    if (el && defaults[type]) {
        el.value = defaults[type];
    }
}
window.resetTemplateToDefault = resetTemplateToDefault;

function filterMessagingTemplates(cat, btn) {
    const cards = document.querySelectorAll('#messaging-templates-grid .msg-tpl-card');
    cards.forEach(card => {
        if (cat === 'all' || card.classList.contains(`cat-${cat}`)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });

    const buttons = document.querySelectorAll('.btn-filter-tpl');
    buttons.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'var(--card-bg)';
        b.style.color = 'var(--text-main)';
        b.style.border = '1px solid var(--border-color)';
    });

    if (btn) {
        btn.classList.add('active');
        btn.style.background = 'var(--primary)';
        btn.style.color = 'white';
        btn.style.border = 'none';
    }
}
window.filterMessagingTemplates = filterMessagingTemplates;

function toggleAllWorkerAlerts(enable) {
    const checkboxes = document.querySelectorAll('#messaging-workers-list input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = !!enable;
    });
}
window.toggleAllWorkerAlerts = toggleAllWorkerAlerts;

function filterMessagingWorkers() {
    const query = document.getElementById('msg-worker-search')?.value?.toLowerCase().trim() || '';
    const container = document.getElementById('messaging-workers-list');
    if (!container) return;

    const rows = container.children;
    for (let r of rows) {
        const text = r.textContent.toLowerCase();
        if (!query || text.includes(query)) {
            r.style.display = 'flex';
        } else {
            r.style.display = 'none';
        }
    }
}
window.filterMessagingWorkers = filterMessagingWorkers;

function sendTestTemplateAlert(type) {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const el = document.getElementById(`msg-tpl-${type}`);
    const rawTpl = el ? el.value : '';

    if (!rawTpl) {
        alert(isAr ? 'القالب فارغ.' : 'Template is empty.');
        return;
    }

    const testData = {
        worker_name: 'أحمد علي',
        task_title: 'فحص جودة المخزون',
        order_id: 'ORD-9982',
        customer_name: 'سارة خالد',
        items_count: '5',
        amount: '150',
        reason: 'تجديد تصريح العمل',
        company_name: (typeof currentCompany !== 'undefined' ? currentCompany.toUpperCase() : 'DEMO')
    };

    let msg = rawTpl;
    Object.keys(testData).forEach(k => {
        msg = msg.replace(new RegExp(`{${k}}`, 'g'), testData[k]);
    });

    const testWorkerIdx = document.getElementById('msg-test-worker')?.value;
    let targetPhone = '';
    if (testWorkerIdx !== undefined && testWorkerIdx !== null && testWorkerIdx !== '') {
        const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
        const worker = (data.workers || [])[testWorkerIdx];
        if (worker && worker.phone) targetPhone = worker.phone;
    }

    if (!targetPhone) {
        const userPhone = prompt(isAr ? 'أدخل رقم الهاتف لتلقي رسالة الاختبار (مع رمز الدولة):' : 'Enter recipient phone number for test message:', '+966500000000');
        if (!userPhone) return;
        targetPhone = userPhone.trim();
    }

    if (typeof sendWhatsAppDirect === 'function') {
        sendWhatsAppDirect(targetPhone, msg);
        alert((isAr ? '🚀 تم إرسال الرسالة التجريبية إلى: ' : '🚀 Test WhatsApp alert sent to: ') + targetPhone);
    } else {
        alert((isAr ? '📱 معاينة رسالة الاختبار:\n\n' : '📱 Test Message Preview:\n\n') + msg);
    }
}
window.sendTestTemplateAlert = sendTestTemplateAlert;

function formatMessagingText(rawTpl, replacements = {}) {
    if (!rawTpl) return '';
    let text = String(rawTpl);

    const compData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const compName = replacements.company_name || replacements.companyName || compData.name || compData.companyName || (typeof currentCompany !== 'undefined' ? currentCompany.toUpperCase() : 'DEMO');

    const defaultVars = {
        company_name: compName,
        companyName: compName,
        worker_name: replacements.worker_name || replacements.workerName || 'الموظف',
        task_title: replacements.task_title || replacements.title || '',
        order_id: replacements.order_id || replacements.code || replacements.id || '',
        customer_name: replacements.customer_name || replacements.customer || '',
        items_count: replacements.items_count || '1',
        amount: replacements.amount || '0',
        reason: replacements.reason || replacements.note || ''
    };

    const finalVars = { ...defaultVars, ...replacements };

    Object.keys(finalVars).forEach(key => {
        const val = finalVars[key] !== undefined && finalVars[key] !== null ? String(finalVars[key]) : '';
        text = text.replace(new RegExp(`\\[\\s*{${key}}\\s*\\]`, 'gi'), val);
        text = text.replace(new RegExp(`{${key}}`, 'gi'), val);
    });

    text = text.replace(/\[\s*{[a-zA-Z0-9_$]+}\s*\]/g, '').replace(/{[a-zA-Z0-9_$]+}/g, '');
    return text.trim();
}
window.formatMessagingText = formatMessagingText;

function sendWhatsAppDirect(phone, text) {
    if (!phone || !text) return Promise.resolve({ success: false, error: 'Missing phone or text' });
    const cleanPhone = String(phone).replace(/[^0-9]/g, '').trim();
    if (!cleanPhone) return Promise.resolve({ success: false, error: 'Invalid phone format' });

    const serverUrlInput = document.getElementById('wa-server-url');
    const config = typeof getCompanyData === 'function' ? (getCompanyData().messagingConfig || {}) : {};
    let baseUrl = (serverUrlInput ? serverUrlInput.value.trim() : '') || config.serverUrl || 'https://burgeroov-notify.onrender.com';
    baseUrl = baseUrl.replace(/\/+$/, '');

    const formattedText = formatMessagingText(text);

    return fetch(`${baseUrl}/wa/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, text: formattedText })
    })
    .then(res => res.json().catch(() => ({ success: false, error: `HTTP ${res.status} ${res.statusText}` })))
    .then(data => {
        console.log(`WhatsApp direct message result for ${cleanPhone}:`, data);
        return data;
    })
    .catch(err => {
        console.warn(`WhatsApp direct message HTTP error for ${cleanPhone}:`, err);
        return { success: false, error: err.message || 'Failed to fetch (Network error)' };
    });
}
window.sendWhatsAppDirect = sendWhatsAppDirect;

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
        cycle: '🔁 تنبيه مهمة دورية مجدولة [{company_name}]\n\nالمهمة: {task_title}\nالموظف: {worker_name}\n\nيرجى الإنجاز والمتابعة!',
        inquiry: '❓ استفسار جديد من المدير [{company_name}]\n\nالموظف: {worker_name}\nسؤال المدير: "{task_title}"\n\nيرجى الرد في اللوحة برمز تم التنفيذ / لم ينفذ.',
        delivery: '🛵 مرحباً {worker_name}! طلب توصيل جديد #{order_id} للعميل: {customer_name}.',
        prepare: '👨‍🍳 تنبيه التحضير! طلب سوق جديد #{order_id} يحتوي على {items_count} أصناف بحاجة للتحضير.',
        reminder: '⏰ تنبيه تذكير هام [{company_name}]\n\nالتذكير: "{task_title}"\nالموعد النهائي: {reason}',
        payment: '💵 تم قبول طلب السلفة [{company_name}]\n\nالموظف: {worker_name}\nالمبلغ: {amount} ر.س\nرمز الصرف الخاص بك: {order_id}',
        custody: '📦 تم قبول طلب العهدة [{company_name}]\n\nالموظف: {worker_name}\nالقيمة: {amount} ر.س\nرمز الاستلام الخاص بك: {order_id}',
        violation: '⚠️ تنبيه هام {worker_name}: تم تسجيل مخالفة على ملفك بقيمة {amount} ر.س: "{reason}".',
        reward: '🎉 مبروك {worker_name}! تم إضافة مكافأة لك بقيمة {amount} ر.س: "{reason}".',
        expiry: '⏰ تنبيه انتهاء الوثيقة: {reason} ينتهي خلال {amount} أيام بتاريخ {customer_name}.'
    };

    // Populate Templates
    const fields = ['task', 'cycle', 'inquiry', 'delivery', 'prepare', 'reminder', 'payment', 'custody', 'violation', 'reward', 'expiry'];
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

var messagingTemplateSaveDebounce = null;
function autoSaveMessagingTemplate(tplKey) {
    if (!tplKey || typeof db === 'undefined' || typeof currentCompany === 'undefined') return;
    const el = document.getElementById(`msg-tpl-${tplKey}`);
    if (!el) return;
    const val = el.value;

    if (messagingTemplateSaveDebounce) clearTimeout(messagingTemplateSaveDebounce);
    messagingTemplateSaveDebounce = setTimeout(() => {
        db.ref(`companies/${currentCompany}/messagingTemplates/${tplKey}`).set(val);
        console.log(`Autosaved template msg-tpl-${tplKey}`);
    }, 400);
}
window.autoSaveMessagingTemplate = autoSaveMessagingTemplate;

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
        cycle: document.getElementById('msg-tpl-cycle')?.value || '',
        inquiry: document.getElementById('msg-tpl-inquiry')?.value || '',
        delivery: document.getElementById('msg-tpl-delivery')?.value || '',
        prepare: document.getElementById('msg-tpl-prepare')?.value || '',
        reminder: document.getElementById('msg-tpl-reminder')?.value || '',
        payment: document.getElementById('msg-tpl-payment')?.value || '',
        custody: document.getElementById('msg-tpl-custody')?.value || '',
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
        ? '💾 تم حفظ أرقام الهواتف، رابط الخادم، وقوالب الرسائل الـ 11 بنجاح!' 
        : '💾 Phone numbers, Server URL, and all 11 message templates saved successfully!');
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

// ─── General Advertisement Broadcast Engine ────────────────────────────────
var adRecipients = [];
var selectedAdGroupFilter = 'ALL';
var selectedAdImageBase64 = null;
var activeAdBroadcastTimer = null;
var isAdBroadcastRunning = false;
var adSearchQuery = '';

function saveAdRecipients() {
    if (typeof currentCompany !== 'undefined' && currentCompany) {
        try {
            localStorage.setItem('adRecipients_' + currentCompany, JSON.stringify(adRecipients));
        } catch(e) {}
        if (typeof db !== 'undefined' && db) {
            db.ref(`companies/${currentCompany}/adRecipients`).set(adRecipients);
        }
    }
}
window.saveAdRecipients = saveAdRecipients;

function loadAdRecipients() {
    if (typeof currentCompany !== 'undefined' && currentCompany) {
        // LocalStorage fast load
        try {
            const cached = localStorage.getItem('adRecipients_' + currentCompany);
            if (cached) {
                adRecipients = JSON.parse(cached);
                renderAdRecipientsList();
            }
        } catch(e) {}

        // Firebase RTDB sync
        if (typeof db !== 'undefined' && db) {
            db.ref(`companies/${currentCompany}/adRecipients`).once('value', snapshot => {
                const val = snapshot.val();
                if (Array.isArray(val)) {
                    adRecipients = val;
                } else if (val && typeof val === 'object') {
                    adRecipients = Object.values(val);
                } else if (!val) {
                    // if empty in DB and no local cache
                    if (!localStorage.getItem('adRecipients_' + currentCompany)) {
                        adRecipients = [];
                    }
                }
                recalculateAdRecipientGroups();
                renderAdRecipientsList();
            });
        }
    }
}
window.loadAdRecipients = loadAdRecipients;

function onAdSearchInput(val) {
    adSearchQuery = (val || '').trim().toLowerCase();
    const clearBtn = document.getElementById('btn-ad-clear-search');
    if (clearBtn) {
        clearBtn.style.display = adSearchQuery ? 'inline-block' : 'none';
    }
    renderAdRecipientsList();
}
window.onAdSearchInput = onAdSearchInput;

function clearAdSearch() {
    const input = document.getElementById('ad-search-input');
    const clearBtn = document.getElementById('btn-ad-clear-search');
    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    adSearchQuery = '';
    renderAdRecipientsList();
}
window.clearAdSearch = clearAdSearch;

function removeDuplicateAdRecipients() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (!adRecipients || adRecipients.length === 0) {
        alert(isAr ? 'القائمة خالية لا توجد أرقام.' : 'No phone numbers to check for duplicates.');
        return;
    }

    const seenPhones = new Set();
    const uniqueList = [];
    let removedCount = 0;

    adRecipients.forEach(r => {
        const normPhone = (r.phone || '').replace(/[^0-9]/g, '');
        if (seenPhones.has(normPhone)) {
            removedCount++;
        } else {
            seenPhones.add(normPhone);
            uniqueList.push(r);
        }
    });

    if (removedCount === 0) {
        alert(isAr ? '✅ جميع الأرقام فريدة! لا يوجد أرقام مكررة.' : '✅ All phone numbers are unique! No duplicates found.');
        return;
    }

    adRecipients = uniqueList;
    recalculateAdRecipientGroups();
    saveAdRecipients();
    renderAdRecipientsList();

    alert(isAr 
        ? `🧹 تم إزالة ${removedCount} رقم مكرر بنجاح!` 
        : `🧹 Successfully removed ${removedCount} duplicate phone number(s)!`);
}
window.removeDuplicateAdRecipients = removeDuplicateAdRecipients;

function clearAllAdRecipients() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (!adRecipients || adRecipients.length === 0) {
        alert(isAr ? 'القائمة خالية بالفعل!' : 'Recipients list is already empty!');
        return;
    }
    if (!confirm(isAr 
        ? `هل أنت تأكد من مسح جميع الأرقام (${adRecipients.length} رقم) من القائمة والمجموعات؟` 
        : `Are you sure you want to delete all ${adRecipients.length} recipients from the list?`)) return;

    adRecipients = [];
    saveAdRecipients();
    recalculateAdRecipientGroups();
    renderAdRecipientsList();
}
window.clearAllAdRecipients = clearAllAdRecipients;

function toggleAdRecipientStatus(id) {
    const item = adRecipients.find(r => r.id === id);
    if (item) {
        item.disabled = !item.disabled;
        saveAdRecipients();
        renderAdRecipientsList();
    }
}
window.toggleAdRecipientStatus = toggleAdRecipientStatus;

function toggleMessagingViewMode(mode) {
    const gatewayContainer = document.getElementById('msg-mode-gateway-container');
    const adContainer = document.getElementById('msg-mode-ad-container');
    const btnGateway = document.getElementById('btn-msg-mode-gateway');
    const btnAd = document.getElementById('btn-msg-mode-ad');

    if (mode === 'ad') {
        if (gatewayContainer) gatewayContainer.style.display = 'none';
        if (adContainer) adContainer.style.display = 'block';

        if (btnGateway) {
            btnGateway.className = 'btn-neutral';
            btnGateway.style.background = 'var(--input-bg)';
            btnGateway.style.color = 'var(--text-main)';
            btnGateway.style.border = '1px solid var(--border-color)';
        }
        if (btnAd) {
            btnAd.className = 'btn-primary';
            btnAd.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            btnAd.style.color = 'white';
            btnAd.style.border = 'none';
        }
        loadAdRecipients();
        renderAdRecipientsList();
    } else {
        if (gatewayContainer) gatewayContainer.style.display = 'block';
        if (adContainer) adContainer.style.display = 'none';

        if (btnGateway) {
            btnGateway.className = 'btn-primary';
            btnGateway.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            btnGateway.style.color = 'white';
            btnGateway.style.border = 'none';
        }
        if (btnAd) {
            btnAd.className = 'btn-neutral';
            btnAd.style.background = 'var(--input-bg)';
            btnAd.style.color = 'var(--text-main)';
            btnAd.style.border = '1px solid var(--border-color)';
        }
    }
}
window.toggleMessagingViewMode = toggleMessagingViewMode;

function recalculateAdRecipientGroups() {
    adRecipients.forEach((item, idx) => {
        item.tag = `#${idx + 1}`;
        item.group = Math.floor(idx / 50) + 1;
    });
}

function addAdRecipientFromForm() {
    const nameEl = document.getElementById('ad-input-name');
    const phoneEl = document.getElementById('ad-input-phone');

    const name = nameEl ? nameEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    if (!phone || phone.length < 8) {
        alert(isAr ? 'يرجى كتابة رقم هاتف صحيح مع رمز الدولة.' : 'Please enter a valid phone number with country code.');
        return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');

    adRecipients.push({
        id: 'ad_rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name: name || `Contact #${adRecipients.length + 1}`,
        phone: cleanPhone,
        tag: `#${adRecipients.length + 1}`,
        group: Math.floor(adRecipients.length / 50) + 1,
        disabled: false
    });

    recalculateAdRecipientGroups();
    saveAdRecipients();

    if (nameEl) nameEl.value = '';
    if (phoneEl) phoneEl.value = '';

    renderAdRecipientsList();
}
window.addAdRecipientFromForm = addAdRecipientFromForm;

function deleteAdRecipient(id) {
    adRecipients = adRecipients.filter(item => item.id !== id);
    recalculateAdRecipientGroups();
    saveAdRecipients();
    renderAdRecipientsList();
}
window.deleteAdRecipient = deleteAdRecipient;

function openBulkImportAdModal() {
    const modal = document.getElementById('ad-bulk-import-modal');
    if (modal) modal.style.display = 'flex';
}
window.openBulkImportAdModal = openBulkImportAdModal;

function closeBulkImportAdModal() {
    const modal = document.getElementById('ad-bulk-import-modal');
    if (modal) modal.style.display = 'none';
}
window.closeBulkImportAdModal = closeBulkImportAdModal;

function processBulkImportAdRecipients() {
    const textarea = document.getElementById('ad-bulk-import-textarea');
    if (!textarea) return;
    const rawText = textarea.value;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    if (!rawText.trim()) {
        alert(isAr ? 'يرجى لصق قائمة الأرقام أولاً.' : 'Please paste text containing phone numbers.');
        return;
    }

    const lines = rawText.split('\n');
    let addedCount = 0;

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        let parts = trimmed.split(/,|\t|;/);
        let phone = parts[0] ? parts[0].replace(/[^0-9]/g, '') : '';
        let name = parts[1] ? parts[1].trim() : '';

        if (!phone && parts.length > 1) {
            phone = parts[1].replace(/[^0-9]/g, '');
            name = parts[0].trim();
        }

        if (phone && phone.length >= 8) {
            adRecipients.push({
                id: 'ad_rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                name: name || `Contact #${adRecipients.length + 1}`,
                phone: phone,
                tag: `#${adRecipients.length + 1}`,
                group: Math.floor(adRecipients.length / 50) + 1,
                disabled: false
            });
            addedCount++;
        }
    });

    recalculateAdRecipientGroups();
    saveAdRecipients();
    textarea.value = '';
    closeBulkImportAdModal();
    renderAdRecipientsList();

    alert(isAr 
        ? `✅ تم استيراد ${addedCount} رقم بنجاح وحفظها تلقائياً!` 
        : `✅ Successfully imported and saved ${addedCount} contacts!`);
}
window.processBulkImportAdRecipients = processBulkImportAdRecipients;

function handleAdImageUpload(evt) {
    const file = evt.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        selectedAdImageBase64 = e.target.result;
        const preview = document.getElementById('ad-image-preview');
        const container = document.getElementById('ad-image-preview-container');
        const removeBtn = document.getElementById('btn-ad-remove-img');

        if (preview) preview.src = selectedAdImageBase64;
        if (container) container.style.display = 'block';
        if (removeBtn) removeBtn.style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
}
window.handleAdImageUpload = handleAdImageUpload;

function removeAdImage() {
    selectedAdImageBase64 = null;
    const fileInput = document.getElementById('ad-image-file-input');
    const container = document.getElementById('ad-image-preview-container');
    const removeBtn = document.getElementById('btn-ad-remove-img');

    if (fileInput) fileInput.value = '';
    if (container) container.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'none';
}
window.removeAdImage = removeAdImage;

function insertAdTemplateTag(tag) {
    const el = document.getElementById('ad-broadcast-text');
    if (!el) return;
    const start = el.selectionStart || el.value.length;
    const end = el.selectionEnd || el.value.length;
    el.value = el.value.substring(0, start) + tag + el.value.substring(end);
    el.focus();
    el.selectionStart = el.selectionEnd = start + tag.length;
}
window.insertAdTemplateTag = insertAdTemplateTag;

function setAdGroupFilter(grp, btnEl) {
    selectedAdGroupFilter = grp;
    renderAdRecipientsList();
}
window.setAdGroupFilter = setAdGroupFilter;

function renderAdRecipientsList() {
    recalculateAdRecipientGroups();

    const pillsContainer = document.getElementById('ad-group-filter-pills');
    const selectEl = document.getElementById('ad-target-group-select');
    const tbody = document.getElementById('ad-recipients-tbody');
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    // Determine total groups & stats
    const totalCount = adRecipients.length;
    const activeCount = adRecipients.filter(r => !r.disabled).length;
    const disabledCount = totalCount - activeCount;
    const groupCount = Math.ceil(totalCount / 50) || 1;

    // Update Stats Badge
    const statsBadge = document.getElementById('ad-stats-badge');
    if (statsBadge) {
        if (isAr) {
            statsBadge.textContent = `📊 الإجمالي: ${totalCount} رقم (المفعّل: ${activeCount}، المعطل: ${disabledCount})`;
        } else {
            statsBadge.textContent = `📊 Total: ${totalCount} Phones (Active: ${activeCount}, Off: ${disabledCount})`;
        }
    }

    // Render Pills
    if (pillsContainer) {
        let html = `<button type="button" onclick="setAdGroupFilter('ALL', this)" style="padding:4px 10px; border-radius:14px; font-weight:800; font-size:0.75rem; border:1px solid var(--border-color); cursor:pointer; background:${selectedAdGroupFilter === 'ALL' ? 'var(--primary)' : 'var(--card-bg)'}; color:${selectedAdGroupFilter === 'ALL' ? 'white' : 'var(--text-main)'};">
            ${isAr ? 'الكل' : 'All'} (${totalCount})
        </button>`;

        for (let g = 1; g <= groupCount; g++) {
            const startIdx = (g - 1) * 50 + 1;
            const endIdx = Math.min(g * 50, totalCount);
            const countInGrp = adRecipients.filter(r => r.group === g).length;
            if (countInGrp === 0 && g > 1) continue;

            const isSelected = (selectedAdGroupFilter === g || selectedAdGroupFilter === String(g));
            html += `<button type="button" onclick="setAdGroupFilter(${g}, this)" style="padding:4px 10px; border-radius:14px; font-weight:800; font-size:0.75rem; border:1px solid var(--border-color); cursor:pointer; background:${isSelected ? 'var(--primary)' : 'var(--card-bg)'}; color:${isSelected ? 'white' : 'var(--text-main)'};">
                ${isAr ? 'المجموعة' : 'Group'} ${g} (#${startIdx}-${endIdx})
            </button>`;
        }

        pillsContainer.innerHTML = html;
    }

    // Render Target Select Dropdown Options
    if (selectEl) {
        let optsHtml = `<option value="ALL">${isAr ? '🌐 جميع المستلمين والمجموعات' : '🌐 All Recipients & Groups'} (${totalCount})</option>`;
        for (let g = 1; g <= groupCount; g++) {
            const startIdx = (g - 1) * 50 + 1;
            const endIdx = Math.min(g * 50, totalCount);
            const countInGrp = adRecipients.filter(r => r.group === g).length;
            if (countInGrp === 0 && g > 1) continue;
            optsHtml += `<option value="${g}">${isAr ? 'المجموعة' : 'Group'} ${g} (#${startIdx}-${endIdx}) — [${countInGrp} ${isAr ? 'أرقام' : 'phones'}]</option>`;
        }
        selectEl.innerHTML = optsHtml;
    }

    // Filter Table Rows by Group & Search Query
    const filtered = adRecipients.filter(r => {
        // Group Filter
        if (selectedAdGroupFilter !== 'ALL' && r.group !== Number(selectedAdGroupFilter)) {
            return false;
        }
        // Search Query Filter
        if (adSearchQuery) {
            const matchName = (r.name || '').toLowerCase().includes(adSearchQuery);
            const matchPhone = (r.phone || '').toLowerCase().includes(adSearchQuery);
            const matchTag = (r.tag || '').toLowerCase().includes(adSearchQuery);
            return matchName || matchPhone || matchTag;
        }
        return true;
    });

    if (tbody) {
        if (filtered.length === 0) {
            const msg = adSearchQuery 
                ? (isAr ? `لا تظهر نتائج مطابقة لـ "${adSearchQuery}"` : `No contacts matching "${adSearchQuery}"`)
                : (isAr ? 'لا توجد أرقام مسجلة. أضف شخصاً أو استورد قائمة أعلاه.' : 'No recipients found. Add a person or import numbers above.');
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted); font-weight:700;">${msg}</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(r => {
            const isDisabled = !!r.disabled;
            const rowStyle = isDisabled 
                ? 'border-bottom:1px solid var(--border-color); opacity:0.55; background:rgba(239,68,68,0.03);'
                : 'border-bottom:1px solid var(--border-color);';

            return `
                <tr style="${rowStyle}">
                    <td style="padding:8px 12px; font-weight:900; color:#10b981; font-family:monospace;">${r.tag}</td>
                    <td style="padding:8px 12px; font-weight:700; color:var(--text-main);">${r.name}</td>
                    <td style="padding:8px 12px; font-weight:700; color:var(--text-muted); font-family:monospace;">${r.phone}</td>
                    <td style="padding:8px 12px; text-align:center;">
                        <button type="button" onclick="toggleAdRecipientStatus('${r.id}')" title="${isDisabled ? (isAr ? 'انقر لتفعيل هذا الرقم لإرسال الرسائل' : 'Click to enable messaging for this number') : (isAr ? 'انقر لإيقاف هذا الرقم من الإرسال' : 'Click to disable messaging for this number')}" style="padding:3px 10px; border-radius:12px; font-size:0.75rem; font-weight:800; border:none; cursor:pointer; background:${isDisabled ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}; color:${isDisabled ? '#ef4444' : '#10b981'};">
                            ${isDisabled ? (isAr ? '⛔ معطل' : '⛔ Off') : (isAr ? '🟢 مفعّل' : '🟢 Active')}
                        </button>
                    </td>
                    <td style="padding:8px 12px; text-align:right;">
                        <button type="button" onclick="deleteAdRecipient('${r.id}')" style="background:rgba(239,68,68,0.12); color:#ef4444; border:1px solid rgba(239,68,68,0.3); border-radius:6px; padding:3px 8px; font-size:0.75rem; font-weight:800; cursor:pointer;">✕ ${isAr ? 'حذف' : 'Delete'}</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}
window.renderAdRecipientsList = renderAdRecipientsList;

function startAdBroadcast() {
    const textEl = document.getElementById('ad-broadcast-text');
    const targetGroupVal = document.getElementById('ad-target-group-select')?.value || 'ALL';
    const serverUrlInput = document.getElementById('wa-server-url');
    let rawBaseUrl = (serverUrlInput ? serverUrlInput.value.trim() : '') || 'https://burgeroov-notify.onrender.com';
    let baseUrl = rawBaseUrl.replace(/\/+$/, '');
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    const rawMessage = textEl ? textEl.value.trim() : '';

    if (!rawMessage) {
        alert(isAr ? 'يرجى كتابة نص رسالة الإعلان أولاً.' : 'Please enter the advertisement message text first.');
        return;
    }

    // Filter recipients (Skip disabled recipients)
    let recipientsToSend = adRecipients.filter(r => {
        if (r.disabled) return false;
        if (targetGroupVal === 'ALL') return true;
        return r.group === Number(targetGroupVal);
    });

    if (recipientsToSend.length === 0) {
        alert(isAr ? 'لا توجد أرقام مستلمين في المجموعة المختارة للإرسال!' : 'No recipient numbers found in the selected target group!');
        return;
    }

    if (!confirm(isAr 
        ? `هل أنت تأكد من بدء إرسال الإعلان عبر الواتساب إلى [${recipientsToSend.length}] رقم هاتف مع فاصل زمني 5 ثوانٍ بين كل رقم؟` 
        : `Are you sure you want to start broadcasting to [${recipientsToSend.length}] phone numbers with a 5-second interval between each number?`)) {
        return;
    }

    isAdBroadcastRunning = true;
    const startBtn = document.getElementById('btn-start-ad-broadcast');
    const cancelBtn = document.getElementById('btn-cancel-ad-broadcast');
    const statusText = document.getElementById('ad-hud-status-text');
    const counterText = document.getElementById('ad-hud-counter-text');
    const progressBar = document.getElementById('ad-hud-progress-bar');
    const logBox = document.getElementById('ad-hud-log');

    if (startBtn) startBtn.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'inline-block';

    const compData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const companyName = compData.name || 'BURGEROOV';

    let currentIndex = 0;
    const total = recipientsToSend.length;

    if (logBox) logBox.innerHTML = `🚀 [Broadcast Started] Target: ${total} recipients with 5-second interval...\n📡 Connecting to: ${baseUrl}/wa/send\n`;

    function sendNext() {
        if (!isAdBroadcastRunning) {
            if (statusText) statusText.textContent = isAr ? '🛑 تم إلغاء البث بواسطة المستخدم' : '🛑 Broadcast Cancelled by User';
            if (logBox) logBox.innerHTML += `\n🛑 Broadcast cancelled by user.`;
            if (startBtn) startBtn.style.display = 'inline-block';
            if (cancelBtn) cancelBtn.style.display = 'none';
            return;
        }

        if (currentIndex >= total) {
            isAdBroadcastRunning = false;
            if (statusText) statusText.textContent = isAr ? '✅ اكتمل بث الإعلانات بنجاح!' : '✅ Broadcast Completed Successfully!';
            if (counterText) counterText.textContent = `${total} / ${total}`;
            if (progressBar) progressBar.style.width = '100%';
            if (logBox) logBox.innerHTML += `\n✅ All ${total} WhatsApp messages dispatched cleanly.`;
            if (startBtn) startBtn.style.display = 'inline-block';
            if (cancelBtn) cancelBtn.style.display = 'none';
            return;
        }

        const recipient = recipientsToSend[currentIndex];
        const pct = Math.round(((currentIndex + 1) / total) * 100);

        if (statusText) statusText.textContent = isAr ? `🚀 جاري الإرسال (${currentIndex + 1}/${total}): ${recipient.name} (${recipient.tag})` : `🚀 Sending (${currentIndex + 1}/${total}): ${recipient.name} (${recipient.tag})`;
        if (counterText) counterText.textContent = `${currentIndex + 1} / ${total}`;
        if (progressBar) progressBar.style.width = `${pct}%`;

        // Replace tags
        let textToSend = rawMessage
            .replace(/{name}/gi, recipient.name)
            .replace(/{number_tag}/gi, recipient.tag)
            .replace(/{company_name}/gi, companyName);

        fetch(`${baseUrl}/wa/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                phone: recipient.phone, 
                text: textToSend,
                image: selectedAdImageBase64
            })
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            return res.json();
        })
        .then(resData => {
            if (resData && resData.success) {
                if (logBox) logBox.innerHTML += `💬 [${recipient.tag}] Sent to ${recipient.name} (${recipient.phone})\n`;
            } else {
                if (logBox) logBox.innerHTML += `⚠️ [${recipient.tag}] ${recipient.name}: ${resData?.error || 'Failed'}\n`;
            }
        })
        .catch(err => {
            if (logBox) {
                logBox.innerHTML += `❌ [${recipient.tag}] ${recipient.name} (${recipient.phone}) Error: ${err.message || 'Failed to fetch (Server waking up or offline)'}\n`;
            }
        });

        currentIndex++;

        if (currentIndex < total && isAdBroadcastRunning) {
            activeAdBroadcastTimer = setTimeout(sendNext, 5000);
        } else if (currentIndex >= total) {
            setTimeout(sendNext, 1000);
        }
    }

    sendNext();
}
window.startAdBroadcast = startAdBroadcast;

function cancelAdBroadcast() {
    isAdBroadcastRunning = false;
    if (activeAdBroadcastTimer) clearTimeout(activeAdBroadcastTimer);

    const startBtn = document.getElementById('btn-start-ad-broadcast');
    const cancelBtn = document.getElementById('btn-cancel-ad-broadcast');
    const statusText = document.getElementById('ad-hud-status-text');

    if (startBtn) startBtn.style.display = 'inline-block';
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (statusText) statusText.textContent = '🛑 Broadcast Stopped';
}
window.cancelAdBroadcast = cancelAdBroadcast;
// Universal Search Bar Clear (X) Button Engine
function setupSearchInputClearButtons() {
    const selector = '#reminders-search-input, #market-search-input, #tasks-search-input, #wh-search, #vault-search-input, #map-search-input, input[type="search"], .search-with-clear';
    const searchInputs = document.querySelectorAll(selector);

    searchInputs.forEach(input => {
        if (!input) return;

        let wrapper = input.parentElement;
        if (!wrapper || !wrapper.classList.contains('search-input-wrapper')) {
            const newWrapper = document.createElement('div');
            newWrapper.className = 'search-input-wrapper';
            newWrapper.style.position = 'relative';
            newWrapper.style.display = 'inline-block';
            newWrapper.style.width = '100%';

            input.parentNode.insertBefore(newWrapper, input);
            newWrapper.appendChild(input);
            wrapper = newWrapper;
        }

        input.style.paddingRight = '32px';

        let clearBtn = wrapper.querySelector('.search-clear-btn');
        if (!clearBtn) {
            clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'search-clear-btn';
            clearBtn.innerHTML = '✖';
            clearBtn.style.position = 'absolute';
            clearBtn.style.right = '8px';
            clearBtn.style.top = '50%';
            clearBtn.style.transform = 'translateY(-50%)';
            clearBtn.style.zIndex = '5';
            clearBtn.style.background = 'rgba(239, 68, 68, 0.2)';
            clearBtn.style.color = '#ef4444';
            clearBtn.style.border = '1px solid rgba(239, 68, 68, 0.4)';
            clearBtn.style.borderRadius = '50%';
            clearBtn.style.width = '20px';
            clearBtn.style.height = '20px';
            clearBtn.style.display = 'none';
            clearBtn.style.alignItems = 'center';
            clearBtn.style.justifyContent = 'center';
            clearBtn.style.fontSize = '0.7rem';
            clearBtn.style.cursor = 'pointer';
            clearBtn.title = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar') ? 'مسح البحث' : 'Clear search';
            wrapper.appendChild(clearBtn);
        }

        const updateVisibility = () => {
            const val = (input.value || '').trim();
            if (val.length > 0) {
                clearBtn.style.display = 'flex';
            } else {
                clearBtn.style.display = 'none';
            }
        };

        if (!input.dataset.clearListenersBound) {
            input.dataset.clearListenersBound = 'true';
            input.addEventListener('input', updateVisibility);
            input.addEventListener('keyup', updateVisibility);
            input.addEventListener('change', updateVisibility);

            clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                input.value = '';
                clearBtn.style.display = 'none';

                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('keyup', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));

                const id = input.id;
                if (id === 'reminders-search-input') {
                    if (typeof currentRemindersLimit !== 'undefined') currentRemindersLimit = 20;
                    if (typeof renderReminders === 'function') renderReminders();
                } else if (id === 'market-search-input') {
                    if (typeof renderMarket === 'function') renderMarket();
                } else if (id === 'tasks-search-input') {
                    if (typeof renderTasks === 'function') renderTasks();
                } else if (id === 'wh-search') {
                    if (typeof renderWarehouse === 'function') renderWarehouse();
                } else if (id === 'vault-search-input') {
                    if (typeof renderVaultNotes === 'function') renderVaultNotes();
                } else if (id === 'map-search-input') {
                    if (typeof searchMapLocation === 'function') searchMapLocation();
                }

                input.focus();
            });
        }

        updateVisibility();
    });
}
window.setupSearchInputClearButtons = setupSearchInputClearButtons;

// =============================================
// TASK INQUIRY SYSTEM & DEPARTMENT
// =============================================
var currentTaskFormMode = 'assign'; // 'assign' | 'inquiry'

function setTaskFormMode(mode) {
    currentTaskFormMode = mode;
    const assignBtn = document.getElementById('task-mode-assign-btn');
    const inquiryBtn = document.getElementById('task-mode-inquiry-btn');
    const hudBtn = document.getElementById('task-mode-hud-btn');
    const cycleBtn = document.getElementById('task-mode-cycle-btn');
    const constantBtn = document.getElementById('task-mode-constant-btn');
    const trackedBtn = document.getElementById('task-mode-tracked-btn');

    const assignForm = document.getElementById('task-assign-form');
    const inquiryForm = document.getElementById('task-inquiry-form');
    const constantContainer = document.getElementById('constant-tasks-container');
    const trackedContainer = document.getElementById('tracked-task-container');

    const resetBtnStyles = () => {
        if (assignBtn) { assignBtn.className = 'btn-outline'; assignBtn.style.background = 'var(--input-bg)'; assignBtn.style.color = 'var(--text-main)'; }
        if (inquiryBtn) { inquiryBtn.className = 'btn-outline'; inquiryBtn.style.background = 'var(--input-bg)'; inquiryBtn.style.color = 'var(--text-main)'; }
        if (hudBtn) { hudBtn.className = 'btn-outline'; hudBtn.style.background = 'var(--input-bg)'; hudBtn.style.color = 'var(--text-main)'; }
        if (cycleBtn) { cycleBtn.className = 'btn-outline'; cycleBtn.style.background = 'var(--input-bg)'; cycleBtn.style.color = 'var(--text-main)'; }
        if (constantBtn) { constantBtn.className = 'btn-outline'; constantBtn.style.background = 'var(--input-bg)'; constantBtn.style.color = 'var(--text-main)'; }
        if (trackedBtn) { trackedBtn.className = 'btn-outline'; trackedBtn.style.background = 'var(--input-bg)'; trackedBtn.style.color = 'var(--text-main)'; }
    };

    resetBtnStyles();

    if (mode === 'inquiry') {
        if (assignForm) assignForm.style.display = 'none';
        if (inquiryForm) inquiryForm.style.display = 'block';
        if (constantContainer) constantContainer.style.display = 'none';
        if (trackedContainer) trackedContainer.style.display = 'none';

        if (inquiryBtn) { inquiryBtn.className = 'btn-primary'; inquiryBtn.style.background = 'linear-gradient(135deg, #8b5cf6, #6d28d9)'; inquiryBtn.style.color = 'white'; }

        populateInquiryWorkerDropdown();
    } else if (mode === 'hud') {
        openInquiriesHUDModal();
    } else if (mode === 'cycle') {
        openTaskCycleHUDModal();
    } else if (mode === 'constant') {
        if (assignForm) assignForm.style.display = 'none';
        if (inquiryForm) inquiryForm.style.display = 'none';
        if (constantContainer) constantContainer.style.display = 'block';
        if (trackedContainer) trackedContainer.style.display = 'none';

        if (constantBtn) { constantBtn.className = 'btn-primary'; constantBtn.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)'; constantBtn.style.color = 'white'; }

        if (typeof renderConstantTasks === 'function') renderConstantTasks();
    } else if (mode === 'tracked') {
        if (assignForm) assignForm.style.display = 'none';
        if (inquiryForm) inquiryForm.style.display = 'none';
        if (constantContainer) constantContainer.style.display = 'none';
        if (trackedContainer) trackedContainer.style.display = 'block';

        if (trackedBtn) { trackedBtn.className = 'btn-warning'; trackedBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)'; trackedBtn.style.color = 'white'; }

        populateTrackedWorkerDropdowns();
    } else {
        if (assignForm) assignForm.style.display = 'block';
        if (inquiryForm) inquiryForm.style.display = 'none';
        if (constantContainer) constantContainer.style.display = 'none';
        if (trackedContainer) trackedContainer.style.display = 'none';

        if (assignBtn) { assignBtn.className = 'btn-primary'; assignBtn.style.background = 'linear-gradient(135deg, #4f46e5, #3730a3)'; assignBtn.style.color = 'white'; }
    }
}

function populateTrackedWorkerDropdowns() {
    const isAr = currentAppLang === 'ar';
    const companyData = getCompanyData();
    const workers = companyData.workers || [];
    const permanentSpyId = companyData.permanentSpyWorkerId || '';

    const workerSelect = document.getElementById('tracked-task-worker-select');
    const spySelect = document.getElementById('tracked-task-spy-select');

    let workerHtml = `<option value="">-- ${isAr ? 'اختر الموظف المنفذ' : 'Choose Target Worker'} --</option>`;
    let spyHtml = `<option value="">-- ${isAr ? 'اختر الموظف المراقب (السباي)' : 'Choose Spy Worker'} --</option>`;

    workers.forEach(w => {
        workerHtml += `<option value="${w.id}">👤 ${w.name}</option>`;
        const isPerm = String(w.id) === String(permanentSpyId);
        spyHtml += `<option value="${w.id}" ${isPerm ? 'selected' : ''}>🕵️ ${w.name}${isPerm ? ' ⭐ (Permanent Spy)' : ''}</option>`;
    });

    if (workerSelect) workerSelect.innerHTML = workerHtml;
    if (spySelect) spySelect.innerHTML = spyHtml;
}
window.populateTrackedWorkerDropdowns = populateTrackedWorkerDropdowns;

function setPermanentSpyWorker() {
    const isAr = currentAppLang === 'ar';
    const spySelect = document.getElementById('tracked-task-spy-select');
    const spyId = spySelect ? spySelect.value : '';

    if (!spyId) {
        alert(isAr ? 'الرجاء اختيار الموظف المراقب (السباي) أولاً من القائمة ثم النقر على زر التعيين كدائم.' : 'Please select a Spy Worker from the dropdown first.');
        return;
    }

    const companyData = getCompanyData();
    const workers = companyData.workers || [];
    const spyWorker = workers.find(w => String(w.id) === String(spyId));
    if (!spyWorker) return;

    db.ref(`companies/${currentCompany}/permanentSpyWorkerId`).set(spyId)
        .then(() => {
            alert(isAr ? `تم حفظ الموظف "${spyWorker.name}" كـ مراقب دائم (Permanent Spy) بنجاح!` : `Worker "${spyWorker.name}" set as Permanent Spy Worker successfully!`);
            populateTrackedWorkerDropdowns();
        })
        .catch(err => console.error("Error setting permanent spy worker:", err));
}
window.setPermanentSpyWorker = setPermanentSpyWorker;
window.setTaskFormMode = setTaskFormMode;

function populateInquiryWorkerDropdown() {
    const sel = document.getElementById('inquiry-worker-select');
    if (!sel) return;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const workers = data.workers || [];

    let html = `<option value="">-- ${isAr ? 'اختر الموظف' : 'Choose Employee'} --</option>`;
    html += `<option value="all">👥 ${isAr ? 'جميع الموظفين (استفسار عام)' : 'All Workers (General Inquiry)'}</option>`;

    workers.forEach(w => {
        if (w) html += `<option value="${w.id}">👤 ${w.name || ('Worker #' + w.id)}</option>`;
    });

    sel.innerHTML = html;
}
window.populateInquiryWorkerDropdown = populateInquiryWorkerDropdown;

function createInquiry() {
    const workerSel = document.getElementById('inquiry-worker-select');
    const questionEl = document.getElementById('inquiry-question-input');
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    const targetWorkerId = workerSel ? workerSel.value : '';
    const questionText = questionEl ? questionEl.value.trim() : '';

    if (!targetWorkerId || !questionText) {
        const msg = isAr ? '⚠️ يرجى اختيار الموظف وكتابة نص الاستفسار.' : '⚠️ Please select a worker and type your inquiry question.';
        if (typeof showInAppNotification === 'function') showInAppNotification(msg);
        else alert(msg);
        return;
    }

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const workers = data.workers || [];
    let targetWorkerName = isAr ? 'جميع الموظفين' : 'All Workers';
    let targetWorkerPhone = '';

    if (targetWorkerId !== 'all') {
        const found = workers.find(w => w && String(w.id) === String(targetWorkerId));
        if (found) {
            targetWorkerName = found.name || ('Worker #' + found.id);
            targetWorkerPhone = found.phone || '';
        }
    }

    const inqId = 'inq_' + Date.now();
    const inqObj = {
        id: inqId,
        companyKey: currentCompany,
        workerId: targetWorkerId,
        workerName: targetWorkerName,
        workerPhone: targetWorkerPhone,
        question: questionText,
        createdAt: Date.now(),
        createdBy: (currentUser && currentUser.email) ? currentUser.email : 'Manager',
        status: 'pending',
        reply: null
    };

    db.ref(`companies/${currentCompany}/inquiries/${inqId}`).set(inqObj)
        .then(() => {
            const successMsg = isAr ? '✅ تم إرسال الاستفسار للموظف بنجاح!' : '✅ Inquiry sent to worker successfully!';
            if (typeof showInAppNotification === 'function') showInAppNotification(successMsg);

            if (questionEl) questionEl.value = '';
            renderTasks();
            renderInquiries();
        })
        .catch(err => {
            console.error("Failed to save inquiry:", err);
            if (typeof showInAppNotification === 'function') showInAppNotification("❌ Failed to send inquiry: " + err.message);
        });
}
window.createInquiry = createInquiry;

function replyToInquiry(inqId, choice) {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const inputEl = document.getElementById(`inquiry-reply-text-${inqId}`);
    const replyText = inputEl ? inputEl.value.trim() : '';

    const replyObj = {
        choice: choice,
        text: replyText || (choice === 'did_it' ? (isAr ? 'تم الإنجاز' : 'Did it') : (isAr ? 'لم أقم به' : 'Did not do it')),
        repliedAt: Date.now(),
        repliedBy: (currentUser && currentUser.email) ? currentUser.email : (isAr ? 'الموظف' : 'Worker')
    };

    db.ref(`companies/${currentCompany}/inquiries/${inqId}/status`).set('replied');
    db.ref(`companies/${currentCompany}/inquiries/${inqId}/reply`).set(replyObj)
        .then(() => {
            const msg = isAr ? '✅ تم إرسال الرد للإدارة بنجاح!' : '✅ Reply sent to managers successfully!';
            if (typeof showInAppNotification === 'function') showInAppNotification(msg);
            renderTasks();
            renderInquiries();
        })
        .catch(err => {
            console.error("Failed to reply to inquiry:", err);
            if (typeof showInAppNotification === 'function') showInAppNotification("❌ Failed to send reply: " + err.message);
        });
}
window.replyToInquiry = replyToInquiry;

function deleteInquiry(inqId) {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (!confirm(isAr ? 'هل أنت تأكد من حذف هذا الاستفسار؟' : 'Are you sure you want to delete this inquiry?')) return;

    db.ref(`companies/${currentCompany}/inquiries/${inqId}`).remove()
        .then(() => {
            if (typeof showInAppNotification === 'function') showInAppNotification(isAr ? 'تم حذف الاستفسار بنجاح!' : 'Inquiry deleted!');
            renderInquiries();
            renderInquiriesModal();
        })
        .catch(err => console.error("Failed to delete inquiry:", err));
}
window.deleteInquiry = deleteInquiry;

function renderInquiries() {
    const grid = document.getElementById('inquiries-grid');
    const countBadge = document.getElementById('inquiries-count-badge');
    const workerFilterSel = document.getElementById('inquiries-filter-worker');
    if (!grid) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const inquiriesObj = data.inquiries || {};
    let inquiries = Object.values(inquiriesObj);

    if (workerFilterSel && workerFilterSel.options.length <= 1) {
        const workers = data.workers || [];
        workers.forEach(w => {
            if (w) {
                const opt = document.createElement('option');
                opt.value = w.id;
                opt.textContent = w.name || ('Worker #' + w.id);
                workerFilterSel.appendChild(opt);
            }
        });
    }

    const statusFilter = document.getElementById('inquiries-filter-status') ? document.getElementById('inquiries-filter-status').value : 'all';
    const workerFilter = workerFilterSel ? workerFilterSel.value : 'all';

    if (statusFilter !== 'all') {
        inquiries = inquiries.filter(inq => {
            if (statusFilter === 'pending') return inq.status === 'pending';
            if (statusFilter === 'did_it') return inq.status === 'replied' && inq.reply && inq.reply.choice === 'did_it';
            if (statusFilter === 'did_not_do_it') return inq.status === 'replied' && inq.reply && inq.reply.choice === 'did_not_do_it';
            return true;
        });
    }

    if (workerFilter !== 'all') {
        inquiries = inquiries.filter(inq => String(inq.workerId) === String(workerFilter) || inq.workerId === 'all');
    }

    inquiries.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (countBadge) {
        countBadge.textContent = isAr ? `${inquiries.length} استفسارات` : `${inquiries.length} Inquir${inquiries.length === 1 ? 'y' : 'ies'}`;
    }

    if (inquiries.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 30px; font-size: 0.9rem;">${isAr ? 'لا توجد استفسارات مطابقة بعد.' : 'No inquiries found.'}</div>`;
        return;
    }

    const canManageInquiry = (currentUser && (currentUser.role === 'admin' || currentUser.isAdmin)) || (document.body && document.body.classList.contains('perm-tasks'));

    grid.innerHTML = inquiries.map(inq => {
        const dateStr = inq.createdAt ? new Date(inq.createdAt).toLocaleString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
        const isReplied = inq.status === 'replied';
        const replyObj = inq.reply || {};
        const choice = replyObj.choice || '';

        let statusBadge = `<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-size:0.75rem;">⏳ ${isAr ? 'بانتظار رد الموظف' : 'Pending Reply'}</span>`;

        if (isReplied) {
            if (choice === 'did_it') {
                statusBadge = `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-size:0.75rem;">✅ ${isAr ? 'تم الإنجاز (Did It)' : 'Did It'}</span>`;
            } else {
                statusBadge = `<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); font-size:0.75rem;">❌ ${isAr ? 'لم يتم الإنجاز (Did Not Do It)' : 'Did Not Do It'}</span>`;
            }
        }

        const safeQuestion = typeof escapeHtml === 'function' ? escapeHtml(inq.question) : (inq.question || '');
        const safeWorkerName = typeof escapeHtml === 'function' ? escapeHtml(inq.workerName) : (inq.workerName || 'Worker');
        const safeReplyText = typeof escapeHtml === 'function' ? escapeHtml(replyObj.text) : (replyObj.text || '');

        const deleteBtn = canManageInquiry ? `<button type="button" onclick="deleteInquiry('${inq.id}')" class="btn-outline" style="background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3); font-size:0.75rem; font-weight:800; padding:4px 10px; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:4px;" title="${isAr ? 'حذف الاستفسار بعد الاطلاع عليه' : 'Delete Inquiry'}">🗑️ ${isAr ? 'حذف' : 'Delete'}</button>` : '';

        return `
            <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--shadow-sm); border-top: 4px solid ${isReplied ? (choice === 'did_it' ? '#10b981' : '#ef4444') : '#f59e0b'};">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
                        <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">🕒 ${dateStr}</span>
                        <div style="display:flex; align-items:center; gap:6px;">
                            ${statusBadge}
                            ${deleteBtn}
                        </div>
                    </div>
                    <div style="font-size:0.85rem; font-weight:800; color:var(--primary); margin-bottom:6px;">👤 ${safeWorkerName}</div>
                    <div style="font-size:0.95rem; font-weight:700; color:var(--text-main); line-height:1.4; word-break:break-word; margin-bottom:12px; background:var(--input-bg); padding:10px 12px; border-radius:10px; border:1px dashed var(--border-color);">
                        ❓ ${safeQuestion}
                    </div>

                    ${isReplied ? `
                        <div style="background: ${choice === 'did_it' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)'}; border: 1px solid ${choice === 'did_it' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}; padding:10px 12px; border-radius:10px;">
                            <div style="font-size:0.75rem; font-weight:800; color:${choice === 'did_it' ? '#10b981' : '#ef4444'}; margin-bottom:4px;">
                                💬 ${isAr ? 'رد الموظف:' : 'Worker Reply:'}
                            </div>
                            <div style="font-size:0.88rem; font-weight:600; color:var(--text-main); white-space:pre-wrap;">${safeReplyText}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}
window.renderInquiries = renderInquiries;

// =============================================
// INQUIRIES POPUP MODAL HUD FUNCTIONS
// =============================================
var currentInquiryModalFilter = 'all';

function openInquiriesHUDModal() {
    const modal = document.getElementById('modal-inquiries-hud');
    if (!modal) return;
    modal.style.display = 'flex';

    // Populate worker filter dropdown in modal
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const sel = document.getElementById('modal-inquiries-worker-filter');
    if (sel && sel.options.length <= 1) {
        const workers = data.workers || [];
        workers.forEach(w => {
            if (w) {
                const opt = document.createElement('option');
                opt.value = w.id;
                opt.textContent = w.name || ('Worker #' + w.id);
                sel.appendChild(opt);
            }
        });
    }

    renderInquiriesModal();
}
window.openInquiriesHUDModal = openInquiriesHUDModal;

function closeInquiriesHUDModal() {
    const modal = document.getElementById('modal-inquiries-hud');
    if (modal) modal.style.display = 'none';
}
window.closeInquiriesHUDModal = closeInquiriesHUDModal;

function setInquiryModalFilter(filter) {
    currentInquiryModalFilter = filter;
    ['all', 'pending', 'did_it', 'did_not_do_it'].forEach(f => {
        const btn = document.getElementById(`modal-inq-filter-${f}`);
        if (btn) {
            if (f === filter) {
                btn.className = 'btn-primary';
            } else {
                btn.className = 'btn-outline';
            }
        }
    });
    renderInquiriesModal();
}
window.setInquiryModalFilter = setInquiryModalFilter;

function renderInquiriesModal() {
    const grid = document.getElementById('modal-inquiries-grid');
    const countBadge = document.getElementById('modal-inquiries-count-badge');
    const workerFilterSel = document.getElementById('modal-inquiries-worker-filter');
    if (!grid) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const inquiriesObj = data.inquiries || {};
    let inquiries = Object.values(inquiriesObj);

    const workerFilter = workerFilterSel ? workerFilterSel.value : 'all';

    if (currentInquiryModalFilter !== 'all') {
        inquiries = inquiries.filter(inq => {
            if (currentInquiryModalFilter === 'pending') return inq.status === 'pending';
            if (currentInquiryModalFilter === 'did_it') return inq.status === 'replied' && inq.reply && inq.reply.choice === 'did_it';
            if (currentInquiryModalFilter === 'did_not_do_it') return inq.status === 'replied' && inq.reply && inq.reply.choice === 'did_not_do_it';
            return true;
        });
    }

    if (workerFilter !== 'all') {
        inquiries = inquiries.filter(inq => String(inq.workerId) === String(workerFilter) || inq.workerId === 'all');
    }

    inquiries.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (countBadge) {
        countBadge.textContent = isAr ? `${inquiries.length} استفسارات` : `${inquiries.length} Inquir${inquiries.length === 1 ? 'y' : 'ies'}`;
    }

    if (inquiries.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px; font-size: 0.95rem;">${isAr ? 'لا توجد استفسارات مطابقة بعد.' : 'No inquiries found.'}</div>`;
        return;
    }

    const canManageInquiry = (currentUser && (currentUser.role === 'admin' || currentUser.isAdmin)) || (document.body && document.body.classList.contains('perm-tasks'));

    grid.innerHTML = inquiries.map(inq => {
        const dateStr = inq.createdAt ? new Date(inq.createdAt).toLocaleString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
        const isReplied = inq.status === 'replied';
        const replyObj = inq.reply || {};
        const choice = replyObj.choice || '';

        let statusBadge = `<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-size:0.75rem;">⏳ ${isAr ? 'بانتظار رد الموظف' : 'Pending Reply'}</span>`;

        if (isReplied) {
            if (choice === 'did_it') {
                statusBadge = `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-size:0.75rem;">✅ ${isAr ? 'تم الإنجاز (Did It)' : 'Did It'}</span>`;
            } else {
                statusBadge = `<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); font-size:0.75rem;">❌ ${isAr ? 'لم يتم الإنجاز (Did Not Do It)' : 'Did Not Do It'}</span>`;
            }
        }

        const safeQuestion = typeof escapeHtml === 'function' ? escapeHtml(inq.question) : (inq.question || '');
        const safeWorkerName = typeof escapeHtml === 'function' ? escapeHtml(inq.workerName) : (inq.workerName || 'Worker');
        const safeReplyText = typeof escapeHtml === 'function' ? escapeHtml(replyObj.text) : (replyObj.text || '');

        const deleteBtn = canManageInquiry ? `<button type="button" onclick="deleteInquiry('${inq.id}')" class="btn-outline" style="background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3); font-size:0.75rem; font-weight:800; padding:4px 10px; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:4px;" title="${isAr ? 'حذف الاستفسار بعد الاطلاع عليه' : 'Delete Inquiry'}">🗑️ ${isAr ? 'حذف' : 'Delete'}</button>` : '';

        return `
            <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--shadow-sm); border-top: 4px solid ${isReplied ? (choice === 'did_it' ? '#10b981' : '#ef4444') : '#f59e0b'};">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
                        <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">🕒 ${dateStr}</span>
                        <div style="display:flex; align-items:center; gap:6px;">
                            ${statusBadge}
                            ${deleteBtn}
                        </div>
                    </div>
                    <div style="font-size:0.85rem; font-weight:800; color:var(--primary); margin-bottom:6px;">👤 ${safeWorkerName}</div>
                    <div style="font-size:0.95rem; font-weight:700; color:var(--text-main); line-height:1.4; word-break:break-word; margin-bottom:12px; background:var(--input-bg); padding:10px 12px; border-radius:10px; border:1px dashed var(--border-color);">
                        ❓ ${safeQuestion}
                    </div>

                    ${isReplied ? `
                        <div style="background: ${choice === 'did_it' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)'}; border: 1px solid ${choice === 'did_it' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}; padding:10px 12px; border-radius:10px;">
                            <div style="font-size:0.75rem; font-weight:800; color:${choice === 'did_it' ? '#10b981' : '#ef4444'}; margin-bottom:4px;">
                                💬 ${isAr ? 'رد الموظف:' : 'Worker Reply:'}
                            </div>
                            <div style="font-size:0.88rem; font-weight:600; color:var(--text-main); white-space:pre-wrap;">${safeReplyText}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}
window.renderInquiriesModal = renderInquiriesModal;

// =============================================
// TASK CYCLE SYSTEM (SCHEDULED TASKS PER WORKER & DAYS)
// =============================================
var currentCycleItemsDraft = [];
var currentEditingCycleItemId = null;

function toggleCycleDaysPillsVisibility() {
    const sel = document.getElementById('cycle-recurrence-select');
    const container = document.getElementById('cycle-days-pills-container');
    if (!sel || !container) return;
    container.style.display = sel.value === 'specific' ? 'flex' : 'none';
}
window.toggleCycleDaysPillsVisibility = toggleCycleDaysPillsVisibility;

function toggleCycleDayPill(btn) {
    if (!btn) return;
    const isSelected = btn.classList.contains('active-day-pill');
    if (isSelected) {
        btn.classList.remove('active-day-pill');
        btn.style.background = 'var(--input-bg)';
        btn.style.color = 'var(--text-main)';
        btn.style.borderColor = 'var(--border-color)';
    } else {
        btn.classList.add('active-day-pill');
        btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        btn.style.color = 'white';
        btn.style.borderColor = '#10b981';
    }
}
window.toggleCycleDayPill = toggleCycleDayPill;

function getSelectedCycleDays() {
    const recSel = document.getElementById('cycle-recurrence-select');
    if (!recSel || recSel.value === 'every') return ['every'];

    const pills = document.querySelectorAll('.cycle-day-pill.active-day-pill');
    const days = [];
    pills.forEach(p => {
        const d = p.getAttribute('data-day');
        if (d) days.push(d);
    });
    return days.length > 0 ? days : ['every'];
}
window.getSelectedCycleDays = getSelectedCycleDays;

function openTaskCycleHUDModal() {
    const modal = document.getElementById('modal-task-cycle-hud');
    if (!modal) return;
    modal.style.display = 'flex';
    resetCycleTaskForm();

    // Populate worker dropdown
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const sel = document.getElementById('cycle-worker-select');
    if (sel) {
        sel.innerHTML = `<option value="">${(typeof currentAppLang !== 'undefined' && currentAppLang === 'ar') ? '-- اختر الموظف --' : '-- Choose Worker --'}</option>`;
        const workers = data.workers || [];
        workers.forEach(w => {
            if (w) {
                const opt = document.createElement('option');
                opt.value = w.id;
                opt.textContent = w.name || ('Worker #' + w.id);
                sel.appendChild(opt);
            }
        });
        if (workers.length > 0 && workers[0]) {
            sel.value = workers[0].id;
            onCycleWorkerSelected();
        }
    }
}
window.openTaskCycleHUDModal = openTaskCycleHUDModal;

function closeTaskCycleHUDModal() {
    const modal = document.getElementById('modal-task-cycle-hud');
    if (modal) modal.style.display = 'none';
    resetCycleTaskForm();
}
window.closeTaskCycleHUDModal = closeTaskCycleHUDModal;

function onCycleWorkerSelected() {
    resetCycleTaskForm();
    const sel = document.getElementById('cycle-worker-select');
    if (!sel || !sel.value) {
        currentCycleItemsDraft = [];
        renderCycleItemsDraft();
        return;
    }

    const workerId = sel.value;
    
    // Fetch directly from Firebase RTDB to guarantee loading saved tasks
    db.ref(`companies/${currentCompany}/taskCycles/${workerId}`).once('value')
        .then(snap => {
            const workerCycle = snap.val() || {};
            const items = Array.isArray(workerCycle.items) ? workerCycle.items : (workerCycle.items ? Object.values(workerCycle.items) : []);
            
            // Sync local cache
            const companyData = typeof getCompanyData === 'function' ? getCompanyData() : {};
            if (!companyData.taskCycles) companyData.taskCycles = {};
            companyData.taskCycles[workerId] = workerCycle;

            currentCycleItemsDraft = JSON.parse(JSON.stringify(items));
            renderCycleItemsDraft();
        })
        .catch(err => {
            console.error("Failed to load worker task cycle:", err);
            currentCycleItemsDraft = [];
            renderCycleItemsDraft();
        });
}
window.onCycleWorkerSelected = onCycleWorkerSelected;

function resetCycleTaskForm() {
    currentEditingCycleItemId = null;
    const titleInput = document.getElementById('cycle-item-title');
    const timeInput = document.getElementById('cycle-item-time');
    const recSel = document.getElementById('cycle-recurrence-select');
    const submitBtn = document.getElementById('btn-add-cycle-item-submit');
    const cancelBtn = document.getElementById('btn-cancel-cycle-edit');
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    if (titleInput) titleInput.value = '';
    if (timeInput && !timeInput.value) timeInput.value = '14:20';
    if (recSel) {
        recSel.value = 'every';
        toggleCycleDaysPillsVisibility();
    }

    const pills = document.querySelectorAll('.cycle-day-pill');
    pills.forEach(p => {
        p.classList.remove('active-day-pill');
        p.style.background = 'var(--input-bg)';
        p.style.color = 'var(--text-main)';
        p.style.borderColor = 'var(--border-color)';
    });

    if (cancelBtn) cancelBtn.style.display = 'none';
    if (submitBtn) {
        submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        submitBtn.innerHTML = `<span>${isAr ? '➕ إضافة مهمة للدورة' : '➕ Add Task to Cycle'}</span>`;
    }
}
window.resetCycleTaskForm = resetCycleTaskForm;

function editCycleItemDraft(itemId) {
    const item = currentCycleItemsDraft.find(i => String(i.id) === String(itemId));
    if (!item) return;

    currentEditingCycleItemId = itemId;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    const titleInput = document.getElementById('cycle-item-title');
    const timeInput = document.getElementById('cycle-item-time');
    const recSel = document.getElementById('cycle-recurrence-select');
    const submitBtn = document.getElementById('btn-add-cycle-item-submit');
    const cancelBtn = document.getElementById('btn-cancel-cycle-edit');

    if (titleInput) titleInput.value = item.title || '';
    if (timeInput) timeInput.value = item.time || '14:20';

    const daysArr = Array.isArray(item.days) ? item.days : ['every'];
    if (recSel) {
        if (daysArr.includes('every') || daysArr.length === 0) {
            recSel.value = 'every';
        } else {
            recSel.value = 'specific';
        }
        toggleCycleDaysPillsVisibility();
    }

    const pills = document.querySelectorAll('.cycle-day-pill');
    pills.forEach(p => {
        const dayAttr = p.getAttribute('data-day');
        if (daysArr.includes(dayAttr)) {
            p.classList.add('active-day-pill');
            p.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            p.style.color = 'white';
            p.style.borderColor = '#10b981';
        } else {
            p.classList.remove('active-day-pill');
            p.style.background = 'var(--input-bg)';
            p.style.color = 'var(--text-main)';
            p.style.borderColor = 'var(--border-color)';
        }
    });

    if (cancelBtn) cancelBtn.style.display = 'inline-block';
    if (submitBtn) {
        submitBtn.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
        submitBtn.innerHTML = `<span>${isAr ? '✏️ تعديل المهمة' : '✏️ Update Task'}</span>`;
    }

    const formContainer = document.getElementById('cycle-item-title');
    if (formContainer && typeof formContainer.focus === 'function') formContainer.focus();
}
window.editCycleItemDraft = editCycleItemDraft;

function addCycleItemToDraft() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const sel = document.getElementById('cycle-worker-select');
    const titleInput = document.getElementById('cycle-item-title');
    const timeInput = document.getElementById('cycle-item-time');

    if (!sel || !sel.value) {
        if (typeof showInAppNotification === 'function') showInAppNotification(isAr ? '⚠️ يرجى اختيار الموظف أولاً' : '⚠️ Please select a worker first.');
        return;
    }

    const title = titleInput ? titleInput.value.trim() : '';
    const time = timeInput ? timeInput.value.trim() : '';
    const days = getSelectedCycleDays();

    if (!title || !time) {
        if (typeof showInAppNotification === 'function') showInAppNotification(isAr ? '⚠️ يرجى كتابة وصف المهمة وتحديد الوقت' : '⚠️ Please enter task description and scheduled time.');
        return;
    }

    if (currentEditingCycleItemId) {
        // Update existing item
        const existingIdx = currentCycleItemsDraft.findIndex(i => String(i.id) === String(currentEditingCycleItemId));
        if (existingIdx !== -1) {
            currentCycleItemsDraft[existingIdx].title = title;
            currentCycleItemsDraft[existingIdx].time = time;
            currentCycleItemsDraft[existingIdx].days = days;
            currentCycleItemsDraft[existingIdx].updatedAt = Date.now();
        }
        resetCycleTaskForm();
    } else {
        // Add new item
        const newItem = {
            id: 'tc_' + Date.now(),
            title,
            time,
            days,
            createdAt: Date.now()
        };
        currentCycleItemsDraft.push(newItem);
        if (titleInput) titleInput.value = '';
    }

    currentCycleItemsDraft.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    autoSaveWorkerTaskCycle();
}
window.addCycleItemToDraft = addCycleItemToDraft;

function removeCycleItemDraft(itemId) {
    if (String(currentEditingCycleItemId) === String(itemId)) {
        resetCycleTaskForm();
    }
    currentCycleItemsDraft = currentCycleItemsDraft.filter(i => String(i.id) !== String(itemId));
    autoSaveWorkerTaskCycle();
}
window.removeCycleItemDraft = removeCycleItemDraft;

function renderCycleItemsDraft() {
    const container = document.getElementById('cycle-items-list');
    const countBadge = document.getElementById('cycle-count-badge');
    if (!container) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    if (countBadge) {
        countBadge.textContent = isAr ? `${currentCycleItemsDraft.length} مهام مضافة` : `${currentCycleItemsDraft.length} Tasks in Cycle`;
    }

    if (currentCycleItemsDraft.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px; font-size:0.88rem; background:var(--input-bg); border-radius:10px; border:1px dashed var(--border-color);">${isAr ? 'لا توجد مهام مجدولة لهذا الموظف بعد. قم بإضافة مهمة ووقت أعلاه.' : 'No tasks scheduled in this worker cycle yet. Add a task and time above.'}</div>`;
        return;
    }

    const dayLabels = {
        sun: isAr ? 'أحد' : 'Sun',
        mon: isAr ? 'إثنين' : 'Mon',
        tue: isAr ? 'ثلاثاء' : 'Tue',
        wed: isAr ? 'أربعاء' : 'Wed',
        thu: isAr ? 'خميس' : 'Thu',
        fri: isAr ? 'جمعة' : 'Fri',
        sat: isAr ? 'سبت' : 'Sat'
    };

    container.innerHTML = currentCycleItemsDraft.map(item => {
        const safeTitle = typeof escapeHtml === 'function' ? escapeHtml(item.title) : item.title;
        let formattedTime = item.time;
        try {
            const [h, m] = item.time.split(':');
            const dateObj = new Date();
            dateObj.setHours(parseInt(h, 10), parseInt(m, 10));
            formattedTime = dateObj.toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
        } catch(e){}

        const daysArr = Array.isArray(item.days) ? item.days : ['every'];
        let daysBadgeText = isAr ? 'كل يوم' : 'Every Day';
        if (!daysArr.includes('every') && daysArr.length > 0) {
            daysBadgeText = daysArr.map(d => dayLabels[d] || d).join(', ');
        }

        const isEditingThis = String(currentEditingCycleItemId) === String(item.id);
        const activeBorder = isEditingThis ? 'border:2px solid var(--primary); background:rgba(79, 70, 229, 0.06);' : 'border:1px solid var(--border-color); background:var(--card-bg);';

        return `
            <div ondblclick="if (!event.target.closest('button')) editCycleItemDraft('${item.id}')" style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border-radius:10px; ${activeBorder} flex-wrap:wrap; gap:8px; cursor:pointer;" title="${isAr ? 'انقر مرتين للتعديل' : 'Double-click to edit'}">
                <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                    <span style="background:rgba(79, 70, 229, 0.12); color:var(--primary); font-weight:800; font-size:0.82rem; padding:4px 10px; border-radius:8px; border:1px solid rgba(79, 70, 229, 0.25);">🕒 ${formattedTime} (GMT+3)</span>
                    <span style="background:rgba(16, 185, 129, 0.12); color:#10b981; font-weight:800; font-size:0.78rem; padding:4px 10px; border-radius:8px; border:1px solid rgba(16, 185, 129, 0.25);">📅 ${daysBadgeText}</span>
                    <span style="font-size:0.9rem; font-weight:700; color:var(--text-main);">${safeTitle}</span>
                </div>
                <div style="display:flex; align-items:center; gap:4px;">
                    <button type="button" onclick="editCycleItemDraft('${item.id}')" style="background:none; border:none; color:var(--primary); cursor:pointer; font-size:1.1rem; padding:2px 6px;" title="${isAr ? 'تعديل المهمة' : 'Edit Task'}">✏️</button>
                    <button type="button" onclick="removeCycleItemDraft('${item.id}')" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:1.1rem; padding:2px 6px;" title="${isAr ? 'حذف من الدورة' : 'Remove from Cycle'}">✖</button>
                </div>
            </div>
        `;
    }).join('');
}
window.renderCycleItemsDraft = renderCycleItemsDraft;

function autoSaveWorkerTaskCycle() {
    const sel = document.getElementById('cycle-worker-select');
    if (!sel || !sel.value) return;

    const workerId = sel.value;
    const workerName = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : 'Worker';

    const payload = {
        workerId,
        workerName,
        items: currentCycleItemsDraft,
        updatedAt: Date.now()
    };

    // Save directly to Firebase RTDB
    db.ref(`companies/${currentCompany}/taskCycles/${workerId}`).set(payload)
        .then(() => {
            const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
            if (!data.taskCycles) data.taskCycles = {};
            data.taskCycles[workerId] = payload;
            renderCycleItemsDraft();
        })
        .catch(err => {
            console.error("Failed to auto-save task cycle:", err);
        });
}
window.autoSaveWorkerTaskCycle = autoSaveWorkerTaskCycle;
window.saveWorkerTaskCycle = autoSaveWorkerTaskCycle;

// =============================================
// AUTOMATED TASK CYCLE DISPATCHER (GMT+3 TIME CHECKER)
// =============================================
function getGMT3Time() {
    const now = new Date();
    const options = { timeZone: 'Asia/Riyadh', hour12: false, hour: '2-digit', minute: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(now);
    let year, month, day, hour, minute, weekdayStr;
    parts.forEach(p => {
        if (p.type === 'year') year = p.value;
        if (p.type === 'month') month = p.value;
        if (p.type === 'day') day = p.value;
        if (p.type === 'hour') hour = p.value;
        if (p.type === 'minute') minute = p.value;
        if (p.type === 'weekday') weekdayStr = p.value;
    });
    const dayCode = (weekdayStr || '').toLowerCase().substring(0, 3);
    return { dateStr: `${year}-${month}-${day}`, timeStr: `${hour}:${minute}`, dayCode };
}

function checkScheduledTaskCycles() {
    if (typeof currentCompany === 'undefined' || !currentCompany) return;
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const taskCycles = data.taskCycles || {};
    if (Object.keys(taskCycles).length === 0) return;

    const { dateStr, timeStr, dayCode } = getGMT3Time();

    Object.keys(taskCycles).forEach(workerId => {
        const cycleObj = taskCycles[workerId];
        if (!cycleObj || !cycleObj.items) return;
        const items = Array.isArray(cycleObj.items) ? cycleObj.items : Object.values(cycleObj.items);

        items.forEach((item, itemIdx) => {
            if (!item || !item.time || !item.title) return;

            // Check day recurrence
            const daysArr = Array.isArray(item.days) ? item.days : ['every'];
            const isTodayScheduled = daysArr.includes('every') || daysArr.length === 0 || daysArr.includes(dayCode);

            if (isTodayScheduled && item.time === timeStr && item.lastDispatchedDate !== dateStr) {
                console.log(`⏰ [Task Cycle GMT+3 Trigger] Dispatching scheduled task for worker ${workerId} on ${dayCode} at ${timeStr}: "${item.title}"`);

                // Mark dispatched to prevent duplicate triggers today
                item.lastDispatchedDate = dateStr;
                db.ref(`companies/${currentCompany}/taskCycles/${workerId}/items/${itemIdx}/lastDispatchedDate`).set(dateStr);

                // Assign task to worker's jobs list
                const workers = data.workers || [];
                let targetWorkerIndex = -1;
                workers.forEach((w, idx) => {
                    if (w && String(w.id) === String(workerId)) targetWorkerIndex = idx;
                });

                if (targetWorkerIndex !== -1) {
                    const existingJobs = Array.isArray(workers[targetWorkerIndex].jobs) ? workers[targetWorkerIndex].jobs : [];
                    const newJob = {
                        id: Date.now(),
                        title: `🔁 [Daily Cycle ${timeStr}] ${item.title}`,
                        status: 'pending',
                        createdAt: Date.now(),
                        assignedBy: 'Task Cycle System'
                    };
                    existingJobs.push(newJob);
                    db.ref(`companies/${currentCompany}/workers/${targetWorkerIndex}/jobs`).set(existingJobs);
                }
            }
        });
    });
}

setInterval(checkScheduledTaskCycles, 30000);

// Initial run
applyTranslations();
if (typeof currentCustomerSession !== 'undefined' && currentCustomerSession) {
    if (typeof applyCustomerModeUI === 'function') {
        applyCustomerModeUI();
    } else if (typeof window.applyCustomerModeUI === 'function') {
        window.applyCustomerModeUI();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSearchInputClearButtons);
} else {
    setTimeout(setupSearchInputClearButtons, 100);
}





// --- AUTOMATIC IN-SCOPE WINDOW EXPORTS ---
if (typeof _getSecureFallbackAIKey === 'function') window._getSecureFallbackAIKey = _getSecureFallbackAIKey;
if (typeof getBestGeminiModelName === 'function') window.getBestGeminiModelName = getBestGeminiModelName;
if (typeof sendTestMessagingAlert === 'function') window.sendTestMessagingAlert = sendTestMessagingAlert;
if (typeof recalculateAdRecipientGroups === 'function') window.recalculateAdRecipientGroups = recalculateAdRecipientGroups;
if (typeof sendNext === 'function') window.sendNext = sendNext;
if (typeof getGMT3Time === 'function') window.getGMT3Time = getGMT3Time;
if (typeof checkScheduledTaskCycles === 'function') window.checkScheduledTaskCycles = checkScheduledTaskCycles;



// =====================================================================
// VAULT / INFORMATIONS CATEGORY EDIT & DELETE ENGINE
// =====================================================================

function openVaultFolderModal(catId) {
    const modal = document.getElementById('modal-edit-vault-folder');
    const editIdEl = document.getElementById('vault-folder-editing-id');
    const arEl = document.getElementById('vault-folder-name-ar');
    const enEl = document.getElementById('vault-folder-name-en');
    const iconEl = document.getElementById('vault-folder-icon');
    const colorEl = document.getElementById('vault-folder-color');
    const titleEl = document.getElementById('vault-folder-modal-title');
    const submitBtn = document.getElementById('vault-folder-submit-btn');

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    if (editIdEl) editIdEl.value = catId || '';
    if (arEl) arEl.value = '';
    if (enEl) enEl.value = '';
    if (iconEl) iconEl.value = '📁';
    if (colorEl) colorEl.value = '#6366f1';

    if (catId) {
        const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
        const customFoldersObj = data.vaultFolders || {};
        const custom = customFoldersObj[catId] || Object.values(customFoldersObj).find(f => f && (f.id === catId || f.name === catId));

        if (custom) {
            if (arEl) arEl.value = custom.nameAr || custom.name || '';
            if (enEl) enEl.value = custom.nameEn || custom.name || '';
            if (iconEl) iconEl.value = custom.icon || '📁';
            if (colorEl) colorEl.value = custom.color || '#6366f1';
        } else {
            // Built-in standard filter meta
            const stdMeta = {
                'Vehicle': { ar: 'مركبات ورخص', en: 'Vehicles & Licenses', icon: '🚗' },
                'Contracts': { ar: 'عقود ووثائق', en: 'Contracts & Documents', icon: '📜' },
                'Passwords': { ar: 'كلمات سر', en: 'Passwords & Logins', icon: '🔑' },
                'Documents': { ar: 'ثبوتيات ورخص', en: 'IDs & Papers', icon: '🆔' },
                'General': { ar: 'معلومات عامة', en: 'General Info', icon: '📌' }
            }[catId];

            if (stdMeta) {
                if (arEl) arEl.value = stdMeta.ar;
                if (enEl) enEl.value = stdMeta.en;
                if (iconEl) iconEl.value = stdMeta.icon;
            }
        }
        if (titleEl) titleEl.textContent = isAr ? '✏️ تعديل قسم المعلومات' : '✏️ Edit Vault Category / Folder';
        if (submitBtn) submitBtn.textContent = isAr ? '💾 حفظ التعديلات' : '💾 Save Changes';
    } else {
        if (titleEl) titleEl.textContent = isAr ? '📁 إنشاء مجلد معلومات جديد' : '📁 Create Vault Category / Folder';
        if (submitBtn) submitBtn.textContent = isAr ? '💾 حفظ المجلد' : '💾 Save Folder';
    }

    if (modal) modal.style.display = 'flex';
}
window.openVaultFolderModal = openVaultFolderModal;

function closeVaultFolderModal() {
    const modal = document.getElementById('modal-edit-vault-folder');
    if (modal) modal.style.display = 'none';
}
window.closeVaultFolderModal = closeVaultFolderModal;

function saveVaultCategoryModal() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const editIdEl = document.getElementById('vault-folder-editing-id');
    const arEl = document.getElementById('vault-folder-name-ar');
    const enEl = document.getElementById('vault-folder-name-en');
    const iconEl = document.getElementById('vault-folder-icon');
    const colorEl = document.getElementById('vault-folder-color');

    const editingId = editIdEl ? editIdEl.value.trim() : '';
    const nameAr = arEl ? arEl.value.trim() : '';
    const nameEn = enEl ? enEl.value.trim() : '';
    const icon = iconEl && iconEl.value.trim() ? iconEl.value.trim() : '📁';
    const color = colorEl ? colorEl.value : '#6366f1';

    if (!nameAr || !nameEn) {
        alert(isAr ? 'الرجاء إدخال اسم القسم بالعربي وبالإنجليزي.' : 'Please enter folder name in both Arabic and English.');
        return;
    }

    const folderId = editingId || ('vfolder_' + Date.now());
    const folderObj = {
        id: folderId,
        name: isAr ? nameAr : nameEn,
        nameAr: nameAr,
        nameEn: nameEn,
        icon: icon,
        color: color,
        updatedAt: Date.now()
    };

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    if (!data.vaultFolders) data.vaultFolders = {};
    data.vaultFolders[folderId] = folderObj;

    if (typeof appData !== 'undefined' && currentCompany && appData[currentCompany]) {
        if (!appData[currentCompany].vaultFolders) appData[currentCompany].vaultFolders = {};
        appData[currentCompany].vaultFolders[folderId] = folderObj;
    }

    closeVaultFolderModal();
    vaultActiveCategoryFilter = folderId;
    renderVaultCategoryFilters();
    populateVaultCategoryDropdowns();
    renderVaultNotes();

    if (typeof db !== 'undefined' && currentCompany) {
        db.ref(`companies/${currentCompany}/vaultFolders/${folderId}`).set(folderObj).then(() => {
            if (typeof showInAppNotification === 'function') {
                showInAppNotification(isAr ? '📁 تم حفظ قسم المعلومات بنجاح!' : '📁 Vault folder saved successfully!');
            }
        }).catch(err => console.error("Error saving vault folder:", err));
    }
}
window.saveVaultCategoryModal = saveVaultCategoryModal;

function editVaultCategory(catId) {
    openVaultFolderModal(catId);
}
window.editVaultCategory = editVaultCategory;

function deleteVaultCategory(catId, catName) {
    deleteCustomVaultFolder(catId, catName);
}
window.deleteVaultCategory = deleteVaultCategory;
