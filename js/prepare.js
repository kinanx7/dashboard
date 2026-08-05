/**
 * Kitchen prepare view, status updates & A4 printable receipt modal
 */

function renderPrepareSection() {
    const grid = document.getElementById('prepare-orders-grid');
    if (!grid) return;

    const isAr = currentAppLang === 'ar';
    const filterStatus = document.getElementById('prepare-status-filter')?.value || 'all';

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

    grid.innerHTML = allOrders.map(order => {
        const orderNum = formatMarketOrderNum(order);
        const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString() : '';
        const companyName = (order.companyKey || 'MVC').toUpperCase();
        const statusInfo = getMarketOrderStatusInfo(order.status);
        const orderJsonStr = JSON.stringify(order).replace(/'/g, "&#39;").replace(/"/g, "&quot;");

        const itemsHTML = (order.items || []).map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--input-bg); border-radius: 12px; font-size: 0.92rem; border: 1px solid var(--border-color);">
                <span style="font-weight: 900; color: var(--text-main); font-size: 0.95rem;">${sanitizeMarketText(item.name)}</span>
                <span style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; font-weight: 900; font-size: 0.85rem; padding: 4px 12px; border-radius: 100px; box-shadow: 0 2px 6px rgba(37,99,235,0.3);">x${item.qty || 1}</span>
            </div>
        `).join('');

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

                <!-- Footer Status Selector & A4 Printable Receipt Button -->
                <div style="border-top: 1px dashed var(--border-color); padding-top: 14px; display: flex; flex-direction: column; gap: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                        <select onchange="updatePrepareOrderStatus('${order.companyKey}', '${order.id}', this.value)" style="flex: 1; padding: 10px 14px; border-radius: 10px; border: 1.5px solid var(--border-color); font-weight: 900; font-size: 0.9rem; background: var(--input-bg); color: var(--text-main); cursor: pointer;">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ Pending / قيد الانتظار</option>
                            <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>👨‍🍳 Preparing / قيد التحضير</option>
                            <option value="delivery" ${order.status === 'delivery' ? 'selected' : ''}>🚚 Out for Delivery / خرج للتوصيل</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>✅ Delivered / تم التوصيل</option>
                        </select>
                        <button type="button" onclick='openMarketOrderReceiptModal(${orderJsonStr})' class="btn-outline" style="padding: 10px 16px; font-weight: 900; font-size: 0.88rem; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 6px; white-space: nowrap; background: var(--input-bg);">
                            🧾 ${isAr ? 'الفاتورة' : 'Receipt'}
                        </button>
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

function getGeminiApiKey() {
    if (typeof getCompanyData === 'function') {
        const data = getCompanyData();
        if (data && data.geminiApiKey) {
            return data.geminiApiKey;
        }
    }
    return localStorage.getItem('mvc_gemini_api_key') || 'AQ.Ab8RN6I17mwWApqVlhaZFmWHn1BBMrYpfQU0iXCRcYPtPCvqOw';
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
            let dateKey = '';
            if (l.date && typeof l.date === 'string') {
                dateKey = l.date.split(' ')[0];
            } else if (l.timestamp) {
                const d = new Date(l.timestamp);
                dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            }
            if (!dateKey) dateKey = today;

            const amt = parseFloat(l.amount) || 0;
            posSalesByDate[dateKey] = (posSalesByDate[dateKey] || 0) + amt;
        });

        const marketOrders = typeof getAllMarketOrders === 'function' ? getAllMarketOrders() : [];
        let marketSalesByDate = {};

        marketOrders.forEach(o => {
            let dateKey = o.date;
            if (!dateKey && o.createdAt) {
                const d = new Date(o.createdAt);
                dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            }
            if (!dateKey) dateKey = today;
            const cost = parseFloat(o.totalCost || o.price || 0);
            marketSalesByDate[dateKey] = (marketSalesByDate[dateKey] || 0) + cost;
        });

        const allDates = Array.from(new Set([...Object.keys(posSalesByDate), ...Object.keys(marketSalesByDate)])).sort().reverse();

        let salesSummary = `💰 **EXACT SALES SECTION & POS METRICS**:\n`;
        salesSummary += `• **TODAY'S TOTAL SALES (${todaySalesInfo.todayStr || today})**: ${activeSalesToday.toFixed(2)} SR\n`;
        salesSummary += `  - Sales Section Today (POS Logs): ${posTodayTotal.toFixed(2)} SR (Payment Methods Breakdown: ${Object.entries(posMethodsToday).map(([m, a]) => `${m}: ${a} SR`).join(', ') || 'No entries'})\n`;
        salesSummary += `  - Online Marketplace Orders Today: ${marketTodayTotal.toFixed(2)} SR\n\n`;

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
    } catch(e) {
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
        } catch (e) {}
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
        timeframeLabel = `Last 7 Days / Week (${new Date(startOfWeek).toISOString().slice(0,10)} to ${localTodayStr})`;
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
        if (matchSpecificDate) {
            if (l.date && l.date.includes(matchSpecificDate)) isMatch = true;
            if (!isMatch && l.timestamp && l.timestamp >= startTs && l.timestamp < endTs) isMatch = true;
        } else {
            if (l.timestamp && l.timestamp >= startTs && l.timestamp < endTs) isMatch = true;
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
        if (matchSpecificDate) {
            if (o.date && o.date.includes(matchSpecificDate)) isMatch = true;
            if (!isMatch && o.createdAt && o.createdAt >= startTs && o.createdAt < endTs) isMatch = true;
        } else {
            if (o.createdAt && o.createdAt >= startTs && o.createdAt < endTs) isMatch = true;
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
    if (!query || query.length < 3) return null;
    const lower = query.toLowerCase();

    // Skip dashboard action triggers
    if (/(sales|mbe3at|مبيعات|منتج|مهمة|رصيد|مطبخ|تذكير|راتب|خصم)/i.test(lower)) return null;

    // 1. Try Free AI API (Pollinations.ai Endpoint)
    try {
        const sysMsg = isAr 
            ? "أنت مساعد ذكي يعطي إجابات قصيرة ودقيقة ومباشرة لجميع الأسئلة." 
            : "You are a smart executive AI manager. Give a concise, accurate, direct answer to the question.";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(query)}?system=${encodeURIComponent(sysMsg)}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.status === 200) {
            const text = await res.text();
            if (text && text.length > 5 && !text.includes('Error') && !text.includes('html')) {
                return text.trim();
            }
        }
    } catch(e) {}

    // 2. Try Wikipedia Knowledge Summary API
    try {
        let topic = query.replace(/what|how|tall|high|big|is|the|of|a|an|where|who|when|tell|me|about/gi, '').trim();
        if (/khalifa|خليفة/i.test(query)) topic = 'Burj_Khalifa';
        if (/sudan|سودان/i.test(query)) topic = 'Khartoum';
        
        if (topic && topic.length >= 2) {
            const lang = isAr ? 'ar' : 'en';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.status === 200) {
                const data = await res.json();
                if (data.extract) {
                    return data.extract;
                }
            }
        }
    } catch(e) {}

    return null;
}
window.fetchGeneralKnowledge = fetchGeneralKnowledge;

async function handleAIChatSubmit() {
    const input = document.getElementById('ai-chat-input');
    const userText = input?.value?.trim() || '';
    if (!userText) return;

    input.value = '';
    renderAIChatMessage('user', userText);

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
            const systemPrompt = `You are MVC Smart AI Executive Manager powered by Gemini. You possess full intelligence and neural reasoning. You must answer ANY question in the world (science, philosophy, history, riddles like 'who came first egg or chicken', recipes, math, business advice, chit-chat) warmly, accurately, and naturally in Arabic or English.

GUIDELINES FOR DASHBOARD DATA:
1. DAILY SALES & DATE QUERIES: When the user asks for sales, revenue, or earnings (even with typos like 'sles', 'sls', 'saales', 'مبعات', 'جم المبيعات', 'كم دخل اليوم'), consult the TODAY'S TOTAL SALES or DAILY SALES BREAKDOWN BY SPECIFIC DATE section in the LIVE DATA below and output the exact SR revenue in this exact 1-line format:
"Your sales today - (YYYY-MM-DD) - is ( AMOUNT SR )" (or in Arabic: "مبيعاتك اليوم - (YYYY-MM-DD) - هي ( AMOUNT ر.س )")
2. ATTENDANCE, LATENESS & VACATION QUERIES: When the user asks who was late today, who is absent, or who is on vacation (e.g. 'من المتأخر اليوم؟', 'من في إجازة؟', 'who was late today?', 'who is on vacation?'), check the ATTENDANCE, LATENESS & VACATION TRACKER section below and give exact names, check-in times, and lateness details.
3. WORKER MONEY & PAYROLL REPORTS: When the user asks for a money/financial report for a SPECIFIC worker (e.g. 'money history of Ahmed'), search for that worker's name and extract base salary, current balance, custody, rewards, violations, and payments.
4. ACTIONS & TOOL CALLS: When the user asks to add market products, assign worker tasks, refill balances, or navigate tabs, invoke the appropriate tool functions.

=== LIVE REAL-TIME SYSTEM DATA ===
${liveContext}`;
            const toolsDeclaration = [
                {
                    functionDeclarations: [
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
                                    tab_name: { type: "STRING", description: "Tab name: 'market', 'prepare', 'tasks', 'finance'" }
                                },
                                required: ["tab_name"]
                            }
                        }
                    ]
                }
            ];

            const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-flash-latest', 'gemini-pro'];
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
                } catch (e) {}
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
                    } catch (e) {}
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
                    } catch (e) {}
                }
            }

            if (data && !data.error && data.candidates?.[0]) {
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
        if (generalAns) {
            renderAIChatMessage('bot', generalAns);
            if (!window._aiChatHistory) window._aiChatHistory = [];
            window._aiChatHistory.push({ role: 'model', parts: [{ text: generalAns }] });
            return;
        }
    } catch(e) {}

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
        } catch(e) {}
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
if (typeof getBestGeminiModelName === 'function') window.getBestGeminiModelName = getBestGeminiModelName;
