// =========================================================
// SALLA STORE REAL-TIME ORDERS, CHECKLIST & DISPATCH MODULE
// =========================================================

let sallaActiveStatusFilter = 'ALL';
let sallaOrdersListenerAttached = false;
let currentSallaListenerCompany = null;
let sallaOrdersCache = {};
let sallaSearchQuery = '';

/**
 * Get all Salla orders combining cache and Firebase appData
 */
function getSallaOrdersMap() {
    const comp = (typeof currentCompany !== 'undefined' && currentCompany) ? currentCompany : 'burgeroov';
    const compData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const fromComp = compData.sallaOrders || {};
    const fromAppData = (typeof appData !== 'undefined' && appData[comp] && appData[comp].sallaOrders) || {};
    return { ...fromAppData, ...fromComp, ...(sallaOrdersCache || {}) };
}

/**
 * Initialize Salla Section and attach real-time Firebase listener
 */
function renderSallaSection() {
    // 1. Attach Firebase real-time listener if needed
    attachSallaOrdersListener();

    // 2. Render HUD Statistics
    updateSallaHUDStats();

    // 3. Render Orders List with Filters
    renderSallaOrdersGrid();
}
window.renderSallaSection = renderSallaSection;

/**
 * Attach real-time listener to companies/{companyId}/sallaOrders
 */
function attachSallaOrdersListener() {
    const comp = (typeof currentCompany !== 'undefined' && currentCompany) ? currentCompany : 'burgeroov';
    if (typeof db === 'undefined' || !db) return;

    if (currentSallaListenerCompany === comp && sallaOrdersListenerAttached) {
        return;
    }

    if (window.sallaOrdersFirebaseRef) {
        try { window.sallaOrdersFirebaseRef.off(); } catch (e) { }
    }

    currentSallaListenerCompany = comp;
    window.sallaOrdersFirebaseRef = db.ref(`companies/${comp}/sallaOrders`);
    window.sallaOrdersFirebaseRef.on('value', snapshot => {
        sallaOrdersCache = snapshot.val() || {};
        if (typeof appData !== 'undefined' && appData[comp]) {
            appData[comp].sallaOrders = sallaOrdersCache;
        }
        updateSallaHUDStats();
        renderSallaOrdersGrid();
    });

    sallaOrdersListenerAttached = true;
}

/**
 * Update the 5 HUD Statistic Badges
 */
function updateSallaHUDStats() {
    const ordersMap = getSallaOrdersMap();
    const orders = Object.values(ordersMap || {});
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    const totalOrders = orders.length;
    let prepCount = 0;
    let outCount = 0;
    let deliveredCount = 0;
    let totalRevenue = 0;

    orders.forEach(o => {
        if (!o) return;
        const st = String(o.status || 'in_progress').toLowerCase();
        if (st === 'delivered' || st === 'completed' || st === 'done') {
            deliveredCount++;
        } else if (st === 'delivering' || st === 'out_for_delivery' || st === 'dispatched') {
            outCount++;
        } else if (st !== 'canceled' && st !== 'cancelled') {
            prepCount++;
        }

        const amt = parseFloat(o.total || o.amount || 0);
        if (!isNaN(amt)) totalRevenue += amt;
    });

    const elTotal = document.getElementById('salla-hud-total');
    const elPrep = document.getElementById('salla-hud-prep');
    const elOut = document.getElementById('salla-hud-out');
    const elDelivered = document.getElementById('salla-hud-delivered');
    const elRevenue = document.getElementById('salla-hud-revenue');

    if (elTotal) elTotal.textContent = totalOrders;
    if (elPrep) elPrep.textContent = prepCount;
    if (elOut) elOut.textContent = outCount;
    if (elDelivered) elDelivered.textContent = deliveredCount;
    if (elRevenue) elRevenue.textContent = totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + (isAr ? 'ر.س' : 'SAR');
}

/**
 * Filter orders by status tab
 */
function setSallaStatusFilter(status, btn) {
    sallaActiveStatusFilter = status;
    document.querySelectorAll('.btn-filter-salla').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderSallaOrdersGrid();
}
window.setSallaStatusFilter = setSallaStatusFilter;

/**
 * Search filter for Salla orders
 */
function filterSallaOrders(query) {
    sallaSearchQuery = String(query || '').trim().toLowerCase();
    renderSallaOrdersGrid();
}
window.filterSallaOrders = filterSallaOrders;

/**
 * Render Salla Orders Grid
 */
function renderSallaOrdersGrid() {
    const grid = document.getElementById('salla-orders-grid');
    if (!grid) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const workers = data.workers || [];

    const ordersMap = getSallaOrdersMap();
    let orders = Object.entries(ordersMap || {}).map(([id, o]) => ({ id, ...o }));

    // 1. Auto-clean ghost / empty abandoned cart stubs
    orders = orders.filter(o => {
        if (!o) return false;
        // Filter out dummy abandoned cart records that have no items or only the fake 'طلب متجر سلة'
        const isAbandonedDummy = (!o.customerName || o.customerName.includes('Abandoned Cart') || o.customerName === '🛒 سلة متروكة (مكتملة)') && 
                                 (!o.items || o.items.length === 0 || (o.items.length === 1 && o.items[0].name === 'طلب متجر سلة'));
        if (isAbandonedDummy) return false;

        // Filter out records that have only fake 'طلب متجر سلة' with no real customer info
        if (o.items && o.items.length === 1 && o.items[0].name === 'طلب متجر سلة' && (!o.customerPhone || o.customerPhone === '')) {
            return false;
        }

        return true;
    });

    // Apply Status Filter
    if (sallaActiveStatusFilter !== 'ALL') {
        orders = orders.filter(o => {
            const st = String(o.status || 'in_progress').toLowerCase();
            if (sallaActiveStatusFilter === 'prep') return (st === 'in_progress' || st === 'pending' || st === 'under_preparing' || st === 'new' || st === 'created');
            if (sallaActiveStatusFilter === 'out') return (st === 'delivering' || st === 'out_for_delivery' || st === 'dispatched');
            if (sallaActiveStatusFilter === 'delivered') return (st === 'delivered' || st === 'completed' || st === 'done');
            if (sallaActiveStatusFilter === 'canceled') return (st === 'canceled' || st === 'cancelled');
            return true;
        });
    }

    // Apply Search Filter
    if (sallaSearchQuery) {
        orders = orders.filter(o => {
            const num = String(o.orderNumber || o.order_reference_id || o.reference_id || o.order_id || o.id || '').toLowerCase();
            const cust = String(o.customerName || (o.customer && o.customer.name) || '').toLowerCase();
            const phone = String(o.customerPhone || (o.customer && o.customer.mobile) || '').toLowerCase();
            const city = String(o.city || (o.address && o.address.city) || '').toLowerCase();
            const itemsStr = (o.items || []).map(i => String(i.name || i.title || '').toLowerCase()).join(' ');
            return num.includes(sallaSearchQuery) || cust.includes(sallaSearchQuery) || phone.includes(sallaSearchQuery) || city.includes(sallaSearchQuery) || itemsStr.includes(sallaSearchQuery);
        });
    }

    // Sort newest first
    orders.sort((a, b) => (b.createdAt || b.date || 0) - (a.createdAt || a.date || 0));

    if (orders.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--input-bg); border-radius: 20px; border: 2px dashed var(--border-color);">
                <div style="font-size: 3.8rem; margin-bottom: 14px;">🛍️</div>
                <h3 style="font-size: 1.25rem; color: var(--text-main); margin-bottom: 8px; font-weight: 900;">
                    ${isAr ? 'لا توجد طلبات سلة حالياً' : 'No Salla Orders Found'}
                </h3>
                <p style="color: var(--text-muted); font-size: 0.92rem; max-width: 480px; margin: 0 auto 20px auto; line-height: 1.6;">
                    ${isAr 
                        ? 'عندما يقوم عميل بالطلب من متجرك في سلة، سيظهر الطلب هنا فورا مع قائمة التحقق وتفاصيل التوصيل للمستودع والسائق.' 
                        : 'When a customer places an order on your Salla store, it will appear here in real-time with an interactive item packaging checklist and delivery details.'}
                </p>
                <button type="button" onclick="generateTestSallaOrder()" class="btn-primary" style="padding: 10px 20px; border-radius: 12px; font-weight: 800; font-size: 0.88rem; background: linear-gradient(135deg, #10b981, #059669); border: none; color: white; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">
                    <span>🧪</span> <span>${isAr ? 'إنشاء طلب تجريبي للتجربة' : 'Generate Test Order to Simulate'}</span>
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = orders.map(o => {
        const orderId = o.id || o.order_id || 'SALLA-ORD';
        
        // 1. Order Number & Reference ID Resolution (Official Salla Store Reference)
        let orderNum = o.order_reference_id || o.reference_id || o.order_id;
        if (!orderNum || String(orderNum).length > 14) {
            if (o.orderNumber && String(o.orderNumber).length <= 14) orderNum = o.orderNumber;
            else if (o.invoice_number) orderNum = isAr ? `فاتورة #${o.invoice_number}` : `INV-#${o.invoice_number}`;
            else if (o.order_id) orderNum = o.order_id;
            else orderNum = String(orderId).slice(-8);
        }
        
        // 2. Customer Name Extraction
        let custName = o.customerName;
        if (!custName && o.customer) {
            const fn = o.customer.first_name || '';
            const ln = o.customer.last_name || '';
            custName = `${fn} ${ln}`.trim() || o.customer.full_name || o.customer.name;
        }
        if (!custName || custName === 'عميل متجر سلة' || custName === 'Salla Customer') {
            if (o.customer && o.customer.first_name === 'عميل' && o.customer.last_name === 'زائر') {
                custName = isAr ? 'عميل زائر' : 'Guest Customer';
            } else {
                custName = isAr ? 'عميل المتجر' : 'Store Customer';
            }
        }

        // 3. Customer Phone & WhatsApp Link
        let rawPhone = o.customerPhone;
        if (!rawPhone && o.customer) {
            rawPhone = o.customer.mobile || o.customer.phone || '';
        }
        rawPhone = String(rawPhone || '').replace(/[^0-9]/g, '');
        let waPhone = rawPhone;
        if (waPhone) {
            if (waPhone.startsWith('05')) waPhone = '966' + waPhone.substring(1);
            else if (waPhone.startsWith('5') && waPhone.length === 9) waPhone = '966' + waPhone;
            else if (!waPhone.startsWith('966') && !waPhone.startsWith('971') && !waPhone.startsWith('965')) waPhone = '966' + waPhone;
        }
        const waLink = waPhone ? `https://wa.me/${waPhone}` : '#';

        // 4. Customer Address & Smart Google Maps Link
        let custCity = o.city;
        let custAddress = o.addressLine;
        const custAddrObj = (o.customer && o.customer.address) || o.address || (o.shipping && o.shipping.address);
        let gmapsQuery = '';

        if (custAddrObj) {
            custCity = custAddrObj.city || custCity;
            const district = custAddrObj.district || '';
            const cleanStreet = String(custAddrObj.street_name || custAddrObj.street || '').replace(/,/g, ' ');
            const desc = custAddrObj.description || custAddrObj.details || '';

            const addrParts = [custCity, district, cleanStreet, desc].filter(Boolean);
            if (addrParts.length > 0) {
                custAddress = addrParts.join(' - ');
            }

            // Pinpoint National Address short code if available (e.g. JEJA8767 or EAMA3296)
            const shortCodeMatch = desc.match(/[A-Za-z]{4}\d{4}/i);
            if (shortCodeMatch) {
                gmapsQuery = shortCodeMatch[0] + ' ' + (custCity || 'السعودية');
            } else {
                const queryParts = [custCity, district, cleanStreet].filter(Boolean);
                gmapsQuery = queryParts.join(' ');
            }
        }

        custCity = custCity || (isAr ? 'الرياض' : 'Riyadh');
        if (!custAddress || custAddress === 'العنوان المسجل في سلة') {
            custAddress = custCity;
        }
        if (!gmapsQuery) {
            gmapsQuery = (custAddress && !custAddress.includes('العنوان المسجل في سلة')) ? `${custCity} ${custAddress}` : custCity;
        }

        // Final Google Maps Link
        const mapCoords = o.coords || (o.address && o.address.location) || (o.customer && o.customer.address && o.customer.address.location);
        let gmapsLink = '#';
        if (mapCoords && mapCoords.lat && mapCoords.lng) {
            gmapsLink = `https://www.google.com/maps/search/?api=1&query=${mapCoords.lat},${mapCoords.lng}`;
        } else {
            gmapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gmapsQuery)}`;
        }

        // 5. Total Amount Parsing & Auto-Sum from Items if 0
        let rawAmt = o.total;
        if (rawAmt && typeof rawAmt === 'object') rawAmt = rawAmt.amount;
        if ((rawAmt === undefined || rawAmt === null || rawAmt === 'NaN' || rawAmt === 0 || rawAmt === '0.00') && o.amount) {
            rawAmt = (typeof o.amount === 'object') ? o.amount.amount : o.amount;
        }
        let parsedTotalVal = parseFloat(rawAmt);
        
        // If stored as 0.00 from past bug, calculate sum from valid items
        if ((isNaN(parsedTotalVal) || parsedTotalVal === 0) && o.items && Array.isArray(o.items) && o.items.length > 0) {
            const itemsSum = o.items.reduce((acc, i) => {
                const p = (i.price && typeof i.price === 'object') ? i.price.amount : i.price;
                return acc + ((parseFloat(p) || 0) * (parseInt(i.quantity || i.qty) || 1));
            }, 0);
            if (itemsSum > 0) parsedTotalVal = itemsSum;
        }

        const totalAmt = isNaN(parsedTotalVal) ? '0.00' : parsedTotalVal.toFixed(2);

        const paymentMethod = o.paymentMethod || o.payment_method || (isAr ? 'مدى / فيزا' : 'Card / Mada');
        const orderDate = o.createdAt ? new Date(o.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : '';
        
        // 6. Notes & Item Separation
        let notes = o.notes || o.customer_note || '';
        const rawItems = o.items || [];
        const checklist = o.checklist || {};

        // Filter out customer notes & shipping services from checklist
        const items = [];
        rawItems.forEach(item => {
            if (!item) return;
            const iname = String(item.name || item.product_name || item.title || '').trim();
            const itype = String(item.type || '').toLowerCase();

            // Filter out fake dummy items
            if (iname === 'طلب متجر سلة') return;

            if (iname.includes('ملاحظات العميل') || iname.includes('ملاحظة') || iname.includes('ملاحظات')) {
                const noteVal = item.description || item.notes || item.value || '';
                if (noteVal && !notes.includes(noteVal)) {
                    notes = notes ? `${notes} | ${noteVal}` : noteVal;
                }
                return;
            }
            if (itype === 'service' || iname.includes('رسوم الشحن') || iname.includes('شحن')) {
                return;
            }

            items.push(item);
        });

        let checkedCount = 0;
        items.forEach((item, idx) => {
            if (checklist[idx] === true) checkedCount++;
        });

        const totalItemsCount = items.length;
        const isFullyPacked = totalItemsCount > 0 && checkedCount === totalItemsCount;
        const progressPct = totalItemsCount > 0 ? Math.round((checkedCount / totalItemsCount) * 100) : 0;

        const st = String(o.status || 'in_progress').toLowerCase();
        let statusBadge = '';
        let cardBorder = 'border-left: 6px solid #f59e0b;';

        if (st === 'delivered' || st === 'completed' || st === 'done') {
            statusBadge = `<span style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 4px 10px; font-size: 0.76rem; font-weight: 800;">✅ ${isAr ? 'تم التوصيل' : 'Delivered'}</span>`;
            cardBorder = 'border-left: 6px solid #10b981;';
        } else if (st === 'delivering' || st === 'out_for_delivery' || st === 'dispatched') {
            statusBadge = `<span style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 4px 10px; font-size: 0.76rem; font-weight: 800;">🛵 ${isAr ? 'مع السائق للتوصيل' : 'Out for Delivery'}</span>`;
            cardBorder = 'border-left: 6px solid #3b82f6;';
        } else if (st === 'canceled' || st === 'cancelled') {
            statusBadge = `<span style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 4px 10px; font-size: 0.76rem; font-weight: 800;">❌ ${isAr ? 'ملغي' : 'Cancelled'}</span>`;
            cardBorder = 'border-left: 6px solid #ef4444;';
        } else {
            statusBadge = `<span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 4px 10px; font-size: 0.76rem; font-weight: 800;">👨‍🍳 ${isAr ? 'قيد التجهيز' : 'In Preparation'}</span>`;
        }

        // Safe driver check helper
        const isWorkerDriver = (w) => {
            if (!w) return false;
            const role = String(w.role || '').toLowerCase();
            if (role === 'driver') return true;
            if (!w.permissions) return false;
            if (Array.isArray(w.permissions)) return w.permissions.includes('drivers');
            if (typeof w.permissions === 'object') return !!w.permissions.drivers;
            if (typeof w.permissions === 'string') return w.permissions.includes('drivers');
            return false;
        };

        // Drivers dropdown options
        const driverOptions = workers
            .filter(w => isWorkerDriver(w))
            .map(w => `<option value="${w.id || w.email}" ${o.assignedDriverId === (w.id || w.email) ? 'selected' : ''}>🛵 ${w.name || w.email}</option>`)
            .join('');

        return `
            <div class="card salla-order-card" id="salla-order-card-${orderId}" style="background: var(--card-bg); border-radius: 16px; border: 1px solid var(--border-color); ${cardBorder} padding: 18px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--shadow-sm); transition: all 0.2s ease;">
                
                <div>
                    <!-- Card Top Header -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.15rem; font-weight: 900; color: var(--text-main); font-family: monospace;">#${orderNum}</span>
                                ${statusBadge}
                            </div>
                            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 3px;">
                                🕒 ${orderDate} • 💳 ${paymentMethod}
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="font-size: 1.25rem; font-weight: 900; color: #10b981; line-height: 1.2;">
                                ${totalAmt} <span style="font-size: 0.8rem;">${isAr ? 'ر.س' : 'SAR'}</span>
                            </div>
                            <button type="button" onclick="deleteSallaOrder('${orderId}')" title="${isAr ? 'حذف الطلب نهائياً' : 'Delete Order'}" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 4px 7px; font-size: 0.82rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.15s ease;" onmouseenter="this.style.background='rgba(239,68,68,0.2)'" onmouseleave="this.style.background='rgba(239,68,68,0.1)'">
                                <span>🗑️</span>
                            </button>
                        </div>
                    </div>

                    <!-- Customer Information Block -->
                    <div style="background: var(--input-bg); border-radius: 12px; border: 1px solid var(--border-color); padding: 12px; margin-bottom: 14px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
                            <div style="font-weight: 800; font-size: 0.9rem; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                                <span>👤</span> <span>${custName}</span>
                                ${rawPhone ? `<span style="font-size: 0.76rem; color: var(--text-muted); font-weight: 700; font-family: monospace;">(${rawPhone})</span>` : ''}
                            </div>
                            ${waPhone ? `
                                <a href="${waLink}" target="_blank" style="background: rgba(37, 211, 102, 0.15); color: #25d366; border: 1px solid rgba(37, 211, 102, 0.3); border-radius: 8px; padding: 4px 10px; font-size: 0.75rem; font-weight: 800; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                                    <span>💬 WhatsApp</span>
                                </a>
                            ` : ''}
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
                            <div style="display: flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px;" title="${custCity} - ${custAddress}">
                                <span>📍</span> <span>${custCity} • ${custAddress}</span>
                            </div>
                            <a href="${gmapsLink}" target="_blank" style="color: var(--primary); font-weight: 800; text-decoration: none; font-size: 0.76rem; display: inline-flex; align-items: center; gap: 3px;">
                                <span>🗺️ ${isAr ? 'الخريطة' : 'Maps'}</span>
                            </a>
                        </div>

                        ${notes ? `
                            <div style="margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); font-size: 0.78rem; color: #f59e0b; font-weight: 700; line-height: 1.4;">
                                📝 <b>${isAr ? 'ملاحظة العميل:' : 'Customer Note:'}</b> ${notes}
                            </div>
                        ` : ''}
                    </div>

                    <!-- Interactive Packaging Item Checklist with Storage Status -->
                    <div style="margin-bottom: 14px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="font-weight: 900; font-size: 0.84rem; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                                <span>📋</span> <span>${isAr ? 'قائمة تجهيز وتعبئة الأصناف من المستودع:' : 'Storage & Packaging Checklist:'}</span>
                            </div>
                            <span style="font-size: 0.78rem; font-weight: 800; color: ${isFullyPacked ? '#10b981' : '#f59e0b'};">
                                ${checkedCount}/${totalItemsCount} ${isAr ? 'تم تجهيزه' : 'Ready'} (${progressPct}%)
                            </span>
                        </div>

                        <!-- Progress Bar -->
                        <div style="width: 100%; height: 6px; background: var(--input-bg); border-radius: 10px; overflow: hidden; margin-bottom: 10px; border: 1px solid var(--border-color);">
                            <div style="width: ${progressPct}%; height: 100%; background: ${isFullyPacked ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)'}; transition: width 0.3s ease;"></div>
                        </div>

                        <!-- Checklist Items List -->
                        <div style="display: flex; flex-direction: column; gap: 6px; max-height: 240px; overflow-y: auto;">
                            ${items.map((item, idx) => {
                                const isChecked = checklist[idx] === true;
                                const itemQty = item.quantity || item.qty || 1;
                                const itemName = item.name || item.title || (isAr ? 'صنف' : 'Item');
                                const itemOptions = item.options ? (Array.isArray(item.options) ? item.options.map(o => o.value || o.name).join(', ') : String(item.options)) : '';

                                return `
                                    <div onclick="toggleSallaItemCheck('${orderId}', ${idx})" style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 10px; background: ${isChecked ? 'rgba(16, 185, 129, 0.08)' : 'var(--input-bg)'}; border: 1px solid ${isChecked ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-color)'}; transition: all 0.15s ease;">
                                        <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                                            <input type="checkbox" ${isChecked ? 'checked' : ''} onclick="event.stopPropagation(); toggleSallaItemCheck('${orderId}', ${idx})" style="width: 20px; height: 20px; cursor: pointer; accent-color: #10b981; flex-shrink: 0;">
                                            <div>
                                                <div style="font-weight: 800; font-size: 0.86rem; color: ${isChecked ? '#10b981' : 'var(--text-main)'}; text-decoration: ${isChecked ? 'line-through' : 'none'};">
                                                    <span style="background: var(--card-bg); padding: 1px 7px; border-radius: 6px; font-weight: 900; margin-right: 4px; border: 1px solid var(--border-color);">${itemQty}x</span> ${itemName}
                                                </div>
                                                ${itemOptions ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">${itemOptions}</div>` : ''}
                                                <div style="margin-top: 4px;">
                                                    ${isChecked ? `
                                                        <span style="display: inline-block; font-size: 0.72rem; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.12); padding: 2px 6px; border-radius: 4px;">
                                                            ✅ ${isAr ? 'جاهز للتسليم ومعبأ' : 'Packed & Ready'}
                                                        </span>
                                                    ` : `
                                                        <span style="display: inline-block; font-size: 0.72rem; font-weight: 800; color: #f59e0b; background: rgba(245, 158, 11, 0.12); padding: 2px 6px; border-radius: 4px;">
                                                            📦 ${isAr ? 'يحتاج إحضار وتجهيز من المستودع' : 'Bring from storage / prepare'}
                                                        </span>
                                                    `}
                                                </div>
                                            </div>
                                        </div>
                                        <span style="font-size: 1.1rem; flex-shrink: 0;">${isChecked ? '✅' : '⬜'}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- Card Actions & Dispatch Station Footer -->
                <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-color);">
                    <div style="display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                        <!-- Driver Selector -->
                        <select onchange="assignSallaOrderDriver('${orderId}', this.value)" style="flex: 1; min-width: 140px; padding: 7px 10px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main); font-weight: 700; font-size: 0.8rem; cursor: pointer;">
                            <option value="">${isAr ? '🛵 تعيين سائق...' : '🛵 Assign Driver...'}</option>
                            ${driverOptions}
                        </select>

                        <!-- WhatsApp Dispatch Button to Driver -->
                        <button type="button" onclick="sendSallaOrderToDriverWhatsApp('${orderId}')" title="${isAr ? 'إرسال تفاصيل الطلب والخريطة للسائق عبر واتساب' : 'Dispatch order details to driver via WhatsApp'}" style="background: rgba(37, 211, 102, 0.12); color: #25d366; border: 1px solid rgba(37, 211, 102, 0.3); border-radius: 10px; padding: 7px 12px; font-size: 0.78rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                            <span>📲 ${isAr ? 'إرسال للسائق' : 'Dispatch'}</span>
                        </button>
                    </div>

                    <!-- Quick Status Buttons -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
                        <button type="button" onclick="updateSallaOrderStatus('${orderId}', 'in_progress')" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 6px 4px; font-size: 0.74rem; font-weight: 800; cursor: pointer;">
                            👨‍🍳 ${isAr ? 'تجهيز' : 'Prep'}
                        </button>
                        <button type="button" onclick="updateSallaOrderStatus('${orderId}', 'out_for_delivery')" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 6px 4px; font-size: 0.74rem; font-weight: 800; cursor: pointer;">
                            🛵 ${isAr ? 'مع السائق' : 'Out'}
                        </button>
                        <button type="button" onclick="updateSallaOrderStatus('${orderId}', 'delivered')" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 6px 4px; font-size: 0.74rem; font-weight: 800; cursor: pointer;">
                            ✅ ${isAr ? 'تم التسليم' : 'Done'}
                        </button>
                    </div>
                </div>

            </div>
        `;
    }).join('');
}

/**
 * Toggle Item Checkbox in Salla Order Packaging Checklist
 */
function toggleSallaItemCheck(orderId, itemIndex) {
    const comp = (typeof currentCompany !== 'undefined' && currentCompany) ? currentCompany : 'burgeroov';
    const ordersMap = getSallaOrdersMap();
    const order = ordersMap[orderId] || {};
    const checklist = { ...(order.checklist || {}) };
    checklist[itemIndex] = !checklist[itemIndex];

    // Update locally in cache and appData immediately
    if (!sallaOrdersCache[orderId]) sallaOrdersCache[orderId] = order;
    sallaOrdersCache[orderId].checklist = checklist;

    if (typeof appData !== 'undefined' && appData[comp] && appData[comp].sallaOrders && appData[comp].sallaOrders[orderId]) {
        appData[comp].sallaOrders[orderId].checklist = checklist;
    }

    renderSallaOrdersGrid();

    if (typeof db !== 'undefined' && db) {
        db.ref(`companies/${comp}/sallaOrders/${orderId}/checklist`).set(checklist).catch(() => {});
    }

    if (typeof showInAppNotification === 'function') {
        const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
        showInAppNotification(checklist[itemIndex] ? (isAr ? '✅ تم تعبئة وتجهيز الصنف بنجاح' : 'Item packed & ready!') : (isAr ? 'تم إعادة الصنف للمستودع' : 'Item marked as needed from storage'));
    }
}
window.toggleSallaItemCheck = toggleSallaItemCheck;

/**
 * Update Salla Order Status
 */
function updateSallaOrderStatus(orderId, newStatus) {
    const comp = (typeof currentCompany !== 'undefined' && currentCompany) ? currentCompany : 'burgeroov';
    const ordersMap = getSallaOrdersMap();
    const order = ordersMap[orderId] || {};
    order.status = newStatus;

    if (!sallaOrdersCache[orderId]) sallaOrdersCache[orderId] = order;
    sallaOrdersCache[orderId].status = newStatus;

    if (typeof appData !== 'undefined' && appData[comp] && appData[comp].sallaOrders && appData[comp].sallaOrders[orderId]) {
        appData[comp].sallaOrders[orderId].status = newStatus;
    }

    updateSallaHUDStats();
    renderSallaOrdersGrid();

    if (typeof db !== 'undefined' && db) {
        db.ref(`companies/${comp}/sallaOrders/${orderId}/status`).set(newStatus).catch(() => {});
    }

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (typeof showInAppNotification === 'function') {
        showInAppNotification(isAr ? `✅ تم تحديث حالة الطلب إلى: ${newStatus}` : `Order status updated to: ${newStatus}`);
    }
}
window.updateSallaOrderStatus = updateSallaOrderStatus;

/**
 * Delete a Salla Order with confirmation
 */
function deleteSallaOrder(orderId) {
    if (!orderId) return;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const comp = (typeof currentCompany !== 'undefined' && currentCompany) ? currentCompany : 'burgeroov';

    const confirmMsg = isAr 
        ? `هل أنت متأكد من حذف هذا الطلب #${orderId} نهائياً؟` 
        : `Are you sure you want to permanently delete order #${orderId}?`;

    if (!confirm(confirmMsg)) return;

    // 1. Remove from local memory immediately
    if (sallaOrdersCache && sallaOrdersCache[orderId]) {
        delete sallaOrdersCache[orderId];
    }

    if (typeof appData !== 'undefined' && appData[comp] && appData[comp].sallaOrders) {
        delete appData[comp].sallaOrders[orderId];
    }

    const compData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    if (compData.sallaOrders && compData.sallaOrders[orderId]) {
        delete compData.sallaOrders[orderId];
    }

    // 2. Re-render instantly
    updateSallaHUDStats();
    renderSallaOrdersGrid();

    // 3. Delete from Firebase
    if (typeof db !== 'undefined' && db) {
        db.ref(`companies/${comp}/sallaOrders/${orderId}`).remove()
            .catch(err => console.error("Error deleting salla order from Firebase:", err));
    }

    if (typeof showInAppNotification === 'function') {
        showInAppNotification(isAr ? '🗑️ تم حذف الطلب بنجاح!' : 'Order deleted successfully!');
    }
}
window.deleteSallaOrder = deleteSallaOrder;

/**
 * Assign a driver to Salla order
 */
function assignSallaOrderDriver(orderId, driverId) {
    const comp = (typeof currentCompany !== 'undefined' && currentCompany) ? currentCompany : 'burgeroov';
    const ordersMap = getSallaOrdersMap();
    const order = ordersMap[orderId] || {};
    order.assignedDriverId = driverId;
    order.status = driverId ? 'out_for_delivery' : 'in_progress';
    order.assignedAt = Date.now();

    if (!sallaOrdersCache[orderId]) sallaOrdersCache[orderId] = order;
    sallaOrdersCache[orderId].assignedDriverId = driverId;
    sallaOrdersCache[orderId].status = order.status;

    if (typeof appData !== 'undefined' && appData[comp] && appData[comp].sallaOrders && appData[comp].sallaOrders[orderId]) {
        appData[comp].sallaOrders[orderId].assignedDriverId = driverId;
        appData[comp].sallaOrders[orderId].status = order.status;
    }

    updateSallaHUDStats();
    renderSallaOrdersGrid();

    if (typeof db !== 'undefined' && db) {
        db.ref(`companies/${comp}/sallaOrders/${orderId}`).update({
            assignedDriverId: driverId,
            status: order.status,
            assignedAt: order.assignedAt
        }).catch(() => {});
    }

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (typeof showInAppNotification === 'function') {
        showInAppNotification(isAr ? '🛵 تم إسناد الطلب للسائق بنجاح!' : 'Order assigned to driver!');
    }
}
window.assignSallaOrderDriver = assignSallaOrderDriver;

/**
 * Send WhatsApp Dispatch Message to Assigned Driver
 */
function sendSallaOrderToDriverWhatsApp(orderId) {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const ordersMap = getSallaOrdersMap();
    const order = ordersMap[orderId];
    if (!order) return;

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const workers = data.workers || [];

    let driver = workers.find(w => w && (w.id === order.assignedDriverId || w.email === order.assignedDriverId));
    if (!driver && workers.length > 0) {
        driver = workers.find(w => w && (w.role === 'Driver' || w.role === 'driver'));
    }

    const driverPhone = driver ? String(driver.phone || '').replace(/[^0-9]/g, '') : '';
    const custName = order.customerName || (order.customer && order.customer.name) || 'Customer';
    const custPhone = order.customerPhone || (order.customer && order.customer.mobile) || '';
    const custCity = order.city || (order.address && order.address.city) || 'Riyadh';
    const custAddress = order.addressLine || (order.address && (order.address.street || order.address.details)) || 'Al-Malqa';
    const totalAmt = parseFloat(order.total || 0).toFixed(2);
    const orderNum = order.orderNumber || orderId;

    const checklist = order.checklist || {};
    const itemsText = (order.items || []).map((i, idx) => {
        const isReady = checklist[idx] === true;
        return `${isReady ? '✅ [جاهز]' : '📦 [إحضار من المستودع]'} ${i.quantity || 1}x ${i.name || i.title}`;
    }).join('\n');

    let gmapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(custCity + ', ' + custAddress)}`;
    if (order.coords && order.coords.lat) {
        gmapsLink = `https://www.google.com/maps/search/?api=1&query=${order.coords.lat},${order.coords.lng}`;
    }

    const message = `🍔 *طلب توصيل متجر سلة جديد #${orderNum}* 🛵\n\n` +
        `👤 *العميل:* ${custName}\n` +
        `📞 *رقم العميل:* ${custPhone}\n` +
        `📍 *العنوان:* ${custCity} - ${custAddress}\n` +
        `💰 *المبلغ:* ${totalAmt} ريال\n\n` +
        `📋 *الأصناف المطلوب إحضارها وتوصيلها:*\n${itemsText}\n\n` +
        `🗺️ *موقع التوصيل على خرائط جوجل:*\n${gmapsLink}\n\n` +
        `يرجى تأكيد الاستلام والتوصيل فور الوصول!`;

    const targetPhone = driverPhone ? (driverPhone.startsWith('966') ? driverPhone : '966' + driverPhone.replace(/^0+/, '')) : '';
    const waUrl = targetPhone ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank');
}
window.sendSallaOrderToDriverWhatsApp = sendSallaOrderToDriverWhatsApp;

/**
 * Open Salla Statistics Modal
 */
function openSallaStatsModal() {
    const modal = document.getElementById('modal-salla-stats');
    if (!modal) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const ordersMap = getSallaOrdersMap();
    const orders = Object.values(ordersMap || {});

    let totalOrders = orders.length;
    let totalRevenue = 0;
    let deliveredCount = 0;
    let outCount = 0;
    let prepCount = 0;

    const productSalesMap = {};

    orders.forEach(o => {
        if (!o) return;
        const st = String(o.status || 'in_progress').toLowerCase();
        if (st === 'delivered' || st === 'completed' || st === 'done') deliveredCount++;
        else if (st === 'delivering' || st === 'out_for_delivery' || st === 'dispatched') outCount++;
        else if (st !== 'canceled' && st !== 'cancelled') prepCount++;

        const amt = parseFloat(o.total || 0);
        if (!isNaN(amt)) totalRevenue += amt;

        (o.items || []).forEach(item => {
            const name = item.name || item.title || 'Product';
            const qty = parseInt(item.quantity || 1);
            productSalesMap[name] = (productSalesMap[name] || 0) + qty;
        });
    });

    const aov = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00';
    const fulfillmentRate = totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 0;

    // Top Products
    const topProducts = Object.entries(productSalesMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const maxQty = topProducts.length > 0 ? Math.max(...topProducts.map(p => p[1])) : 1;

    const topProductsHtml = topProducts.length > 0 ? topProducts.map(([name, qty]) => {
        const pct = Math.round((qty / maxQty) * 100);
        return `
            <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 0.85rem; color: var(--text-main); margin-bottom: 4px;">
                    <span>🍔 ${name}</span>
                    <span style="color: #10b981;">${qty} ${isAr ? 'طلب' : 'Sold'}</span>
                </div>
                <div style="width: 100%; height: 8px; background: var(--input-bg); border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color);">
                    <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, #10b981, #059669); border-radius: 6px;"></div>
                </div>
            </div>
        `;
    }).join('') : `<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center;">${isAr ? 'لا توجد بيانات مبيعات بعد' : 'No sales data yet'}</p>`;

    const contentEl = document.getElementById('salla-stats-modal-body');
    if (contentEl) {
        contentEl.innerHTML = `
            <!-- Top Metric Cards -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px;">
                <div style="background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; text-align: center;">
                    <div style="font-size: 0.78rem; font-weight: 800; color: var(--text-muted);">${isAr ? 'إجمالي الطلبات' : 'Total Orders'}</div>
                    <div style="font-size: 1.5rem; font-weight: 900; color: var(--text-main); margin-top: 4px;">${totalOrders}</div>
                </div>

                <div style="background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; text-align: center;">
                    <div style="font-size: 0.78rem; font-weight: 800; color: var(--text-muted);">${isAr ? 'إجمالي المبيعات' : 'Total Sales'}</div>
                    <div style="font-size: 1.5rem; font-weight: 900; color: #10b981; margin-top: 4px;">${totalRevenue.toFixed(2)} <span style="font-size: 0.75rem;">${isAr ? 'ر.س' : 'SAR'}</span></div>
                </div>

                <div style="background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; text-align: center;">
                    <div style="font-size: 0.78rem; font-weight: 800; color: var(--text-muted);">${isAr ? 'متوسط قيمة الطلب' : 'Average Order'}</div>
                    <div style="font-size: 1.5rem; font-weight: 900; color: #3b82f6; margin-top: 4px;">${aov} <span style="font-size: 0.75rem;">${isAr ? 'ر.س' : 'SAR'}</span></div>
                </div>

                <div style="background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; text-align: center;">
                    <div style="font-size: 0.78rem; font-weight: 800; color: var(--text-muted);">${isAr ? 'نسبة اكتمال التوصيل' : 'Delivery Rate'}</div>
                    <div style="font-size: 1.5rem; font-weight: 900; color: #8b5cf6; margin-top: 4px;">${fulfillmentRate}%</div>
                </div>
            </div>

            <!-- Status Distribution -->
            <div style="background: var(--input-bg); border-radius: 14px; border: 1px solid var(--border-color); padding: 16px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 12px 0; font-size: 0.92rem; font-weight: 900; color: var(--text-main);">
                    📊 ${isAr ? 'توزيع حالات طلبات سلة' : 'Salla Orders Status Breakdown'}
                </h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
                    <div style="padding: 10px; border-radius: 10px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25);">
                        <div style="font-size: 0.76rem; font-weight: 800; color: #f59e0b;">👨‍🍳 ${isAr ? 'قيد التجهيز' : 'In Kitchen'}</div>
                        <div style="font-size: 1.25rem; font-weight: 900; color: #f59e0b; margin-top: 2px;">${prepCount}</div>
                    </div>
                    <div style="padding: 10px; border-radius: 10px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.25);">
                        <div style="font-size: 0.76rem; font-weight: 800; color: #3b82f6;">🛵 ${isAr ? 'مع السائق' : 'Out for Delivery'}</div>
                        <div style="font-size: 1.25rem; font-weight: 900; color: #3b82f6; margin-top: 2px;">${outCount}</div>
                    </div>
                    <div style="padding: 10px; border-radius: 10px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25);">
                        <div style="font-size: 0.76rem; font-weight: 800; color: #10b981;">✅ ${isAr ? 'تم التوصيل' : 'Delivered'}</div>
                        <div style="font-size: 1.25rem; font-weight: 900; color: #10b981; margin-top: 2px;">${deliveredCount}</div>
                    </div>
                </div>
            </div>

            <!-- Top Selling Salla Products -->
            <div style="background: var(--input-bg); border-radius: 14px; border: 1px solid var(--border-color); padding: 16px;">
                <h4 style="margin: 0 0 14px 0; font-size: 0.92rem; font-weight: 900; color: var(--text-main);">
                    🔥 ${isAr ? 'الأصناف الأكثر طلباً من سلة' : 'Top Selling Salla Products'}
                </h4>
                ${topProductsHtml}
            </div>
        `;
    }

    modal.style.display = 'flex';
}
window.openSallaStatsModal = openSallaStatsModal;

/**
 * Close Salla Stats Modal
 */
function closeSallaStatsModal() {
    const modal = document.getElementById('modal-salla-stats');
    if (modal) modal.style.display = 'none';
}
window.closeSallaStatsModal = closeSallaStatsModal;

/**
 * Toggle Salla Connection & Webhook Settings Drawer
 */
function toggleSallaSettingsPanel() {
    const panel = document.getElementById('salla-settings-panel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}
window.toggleSallaSettingsPanel = toggleSallaSettingsPanel;

/**
 * Copy Webhook URL to Clipboard
 */
function copySallaWebhookUrl() {
    const url = 'https://burgeroov-notify.onrender.com/salla/webhook';
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
            if (typeof showInAppNotification === 'function') {
                showInAppNotification(isAr ? '📋 تم نسخ رابط الويب هوك بنجاح!' : 'Webhook URL copied to clipboard!');
            }
        });
    }
}
window.copySallaWebhookUrl = copySallaWebhookUrl;

/**
 * Manually Trigger Salla API Sync from Dashboard
 */
async function syncSallaOrdersDirect() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (typeof showInAppNotification === 'function') {
        showInAppNotification(isAr ? '🔄 جاري مزامنة وتحديث الطلبات من متجر سلة...' : 'Syncing and updating orders from Salla...');
    }

    try {
        // 1. Reparse & heal all stored raw webhook logs to fix order numbers and prices
        try {
            await fetch('https://burgeroov-notify.onrender.com/salla/reparse-orders');
        } catch (reparseErr) {
            console.warn("Reparse logs error:", reparseErr);
        }

        // 2. Fetch fresh live orders from Salla API
        const res = await fetch('https://burgeroov-notify.onrender.com/salla/sync-orders');
        const data = await res.json();
        
        if (typeof showInAppNotification === 'function') {
            showInAppNotification(isAr ? '✅ تمت مزامنة وتحديث طلبات متجر سلة بنجاح!' : 'Salla store orders updated successfully!');
        }
        updateSallaHUDStats();
        renderSallaOrdersGrid();
    } catch (e) {
        console.error("Sync error:", e);
        if (typeof showInAppNotification === 'function') {
            showInAppNotification(isAr ? '❌ تعذر الاتصال بخادم سلة' : 'Server connection error');
        }
    }
}
window.syncSallaOrdersDirect = syncSallaOrdersDirect;

/**
 * Generate a realistic simulated Test Salla Order
 */
function generateTestSallaOrder() {
    const comp = (typeof currentCompany !== 'undefined' && currentCompany) ? currentCompany : 'burgeroov';
    const testId = 'SALLA-' + Math.floor(100000 + Math.random() * 900000);
    const mockCustomers = [
        { name: 'محمد القحطاني', phone: '0551234567', city: 'الرياض', street: 'حي الملقا - شارع أنس بن مالك' },
        { name: 'سارة العتيبي', phone: '0509876543', city: 'الرياض', street: 'حي النرجس - طريق أبي بكر الصديق' },
        { name: 'عبدالله الشهري', phone: '0543322110', city: 'الرياض', street: 'حي الياسمين - شارع الخيالة' },
        { name: 'فاطمة الدوسري', phone: '0567788990', city: 'الرياض', street: 'حي حطين - بالقرب من بوليفارد' }
    ];

    const randomCust = mockCustomers[Math.floor(Math.random() * mockCustomers.length)];

    const menuItems = [
        { name: 'برجرووف كلاسيك دبل تشيز', qty: 2, options: 'بدون بصل، جبنة إضافية' },
        { name: 'بطاطس متبلة حجم كبير', qty: 1, options: 'بهارات حارة' },
        { name: 'صوص برجرووف الخاص', qty: 2, options: '' },
        { name: 'كولا بارد 330 مل', qty: 2, options: 'مع ثلج' },
        { name: 'ستريبس دجاج مقرمش 4 قطع', qty: 1, options: 'صوص باربكيو' }
    ];

    const selectedItems = menuItems.slice(0, 2 + Math.floor(Math.random() * 3));
    let calculatedTotal = 0;
    selectedItems.forEach(i => calculatedTotal += (i.qty * 28.50));

    const newOrder = {
        orderNumber: testId,
        customerName: randomCust.name,
        customerPhone: randomCust.phone,
        city: randomCust.city,
        addressLine: randomCust.street,
        total: calculatedTotal.toFixed(2),
        paymentMethod: 'مدى (Mada Online)',
        status: 'in_progress',
        createdAt: Date.now(),
        notes: 'الرجاء رن الجرس والتسليم عند الباب',
        items: selectedItems.map(i => ({
            name: i.name,
            quantity: i.qty,
            options: i.options
        })),
        checklist: {}
    };

    // 1. Immediately store in local state for instant rendering
    if (!sallaOrdersCache) sallaOrdersCache = {};
    sallaOrdersCache[testId] = newOrder;

    if (typeof appData !== 'undefined' && appData[comp]) {
        if (!appData[comp].sallaOrders) appData[comp].sallaOrders = {};
        appData[comp].sallaOrders[testId] = newOrder;
    }

    // 2. Instantly update HUD & Grid
    updateSallaHUDStats();
    renderSallaOrdersGrid();

    // 3. Save to Firebase
    if (typeof db !== 'undefined' && db) {
        db.ref(`companies/${comp}/sallaOrders/${testId}`).set(newOrder)
            .catch(err => console.error("Firebase sallaOrders set error:", err));
    }

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (typeof showInAppNotification === 'function') {
        showInAppNotification(isAr ? `🎉 تم إنشاء طلب سلة #${testId}` : `Test Salla order #${testId} generated!`);
    }
}
window.generateTestSallaOrder = generateTestSallaOrder;

// ─── SALLA DIRECT API TOKEN MODAL & MANAGEMENT ─────────────────────────────
function openSallaApiKeyModal() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    
    // Remove existing modal if any
    const existing = document.getElementById('salla-api-key-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'salla-api-key-modal';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px); z-index:99999; display:flex; align-items:center; justify-content:center; padding:15px;';
    
    modal.innerHTML = `
        <div style="background:#1e293b; border:2px solid #3b82f6; border-radius:20px; max-width:540px; width:100%; padding:28px; box-shadow:0 25px 60px rgba(0,0,0,0.6); color:#f8fafc; text-align:${isAr ? 'right' : 'left'}; direction:${isAr ? 'rtl' : 'ltr'}; position:relative;">
            <button onclick="document.getElementById('salla-api-key-modal').remove()" style="position:absolute; top:16px; ${isAr ? 'left:16px;' : 'right:16px;'} background:rgba(255,255,255,0.1); border:none; color:#94a3b8; font-size:1.2rem; border-radius:50%; width:34px; height:34px; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
            
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                <div style="font-size:2rem; background:rgba(59,130,246,0.15); width:50px; height:50px; border-radius:14px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(59,130,246,0.3);">🔑</div>
                <div>
                    <h3 style="margin:0; font-size:1.25rem; color:#60a5fa; font-weight:800;">${isAr ? 'ربط متجر سلة عبر مفتاح API' : 'Direct Salla API Token Connection'}</h3>
                    <p style="margin:4px 0 0 0; font-size:0.82rem; color:#94a3b8;">${isAr ? 'الربط المباشر الرسمي لجلب وتحديث الطلبات لحظياً' : 'Official direct connection to sync live store orders in real-time'}</p>
                </div>
            </div>

            <div style="background:rgba(15,23,42,0.6); border:1px solid #334155; border-radius:12px; padding:14px; margin-bottom:18px;">
                <label style="display:block; font-size:0.85rem; font-weight:700; margin-bottom:8px; color:#e2e8f0;">
                    ${isAr ? 'ألصق توكن / مفتاح الربط (Access Token / API Key):' : 'Paste Salla Access Token / API Key:'}
                </label>
                <input id="input-salla-direct-token" type="password" placeholder="${isAr ? 'ألصق التوكن هنا (يبدأ بـ ...)' : 'Paste your token here...'}" style="width:100%; box-sizing:border-box; background:#0f172a; border:1px solid #475569; border-radius:8px; padding:12px; color:#38bdf8; font-family:monospace; font-size:0.9rem;" />
            </div>

            <div style="font-size:0.8rem; color:#94a3b8; line-height:1.6; margin-bottom:20px; background:rgba(59,130,246,0.06); border-right:4px solid #3b82f6; padding:10px 14px; border-radius:6px;">
                💡 <b>${isAr ? 'أين أجد التوكن؟' : 'Where to find the token?'}</b><br>
                ${isAr ? '1. من منصة شركاء سلة (partners.salla.com) ➔ أدوات الدعم (Support Tools) ➔ Tokens.<br>2. أو من إعدادات متجرك ➔ مفاتيح API.' : '1. From Salla Partners ➔ Support Tools ➔ Tokens.<br>2. Or from your Store Settings ➔ API Keys.'}
            </div>

            <div style="display:flex; gap:10px; justify-content:flex-end;">
                <button onclick="document.getElementById('salla-api-key-modal').remove()" style="padding:10px 18px; background:#334155; color:#f1f5f9; border:none; border-radius:10px; font-weight:700; cursor:pointer;">${isAr ? 'إلغاء' : 'Cancel'}</button>
                <button id="btn-save-salla-token-action" onclick="saveSallaDirectToken()" style="padding:10px 22px; background:linear-gradient(135deg, #2563eb, #1d4ed8); color:#fff; border:none; border-radius:10px; font-weight:800; cursor:pointer; box-shadow:0 4px 14px rgba(37,99,235,0.4);">${isAr ? '💾 حفظ وتفعيل الربط الفوري' : '💾 Save & Connect'}</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}
window.openSallaApiKeyModal = openSallaApiKeyModal;

async function saveSallaDirectToken() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const tokenInput = document.getElementById('input-salla-direct-token');
    const saveBtn = document.getElementById('btn-save-salla-token-action');
    const token = tokenInput ? tokenInput.value.trim() : '';

    if (!token) {
        alert(isAr ? '⚠️ الرجاء إدخال التوكن أولاً!' : 'Please enter the token first!');
        return;
    }

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerText = isAr ? '⏳ جاري الحفظ وتفعيل الربط...' : '⏳ Saving & Connecting...';
    }

    try {
        const response = await fetch('https://burgeroov-notify.onrender.com/salla/save-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token })
        });
        const result = await response.json();
        
        // Also trigger sync orders right away
        await syncSallaOrdersDirect();

        const modal = document.getElementById('salla-api-key-modal');
        if (modal) modal.remove();

        alert(isAr ? '🎉 تم حفظ المفتاح بنجاح وتفعيل مزامنة متجر سلة مع لوحة التحكم!' : '🎉 Salla API Token saved successfully! Live store sync is active!');
    } catch (e) {
        console.error('Error saving Salla token:', e);
        alert(isAr ? '❌ حدث خطأ أثناء الاتصال بالخادم: ' + e.message : 'Error connecting to server: ' + e.message);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerText = isAr ? '💾 حفظ وتفعيل الربط الفوري' : '💾 Save & Connect';
        }
    }
}
window.saveSallaDirectToken = saveSallaDirectToken;
