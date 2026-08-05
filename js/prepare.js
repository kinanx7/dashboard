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

// Initial run
applyTranslations();
if (typeof currentCustomerSession !== 'undefined' && currentCustomerSession) {
    if (typeof applyCustomerModeUI === 'function') {
        applyCustomerModeUI();
    } else if (typeof window.applyCustomerModeUI === 'function') {
        window.applyCustomerModeUI();
    }
}


