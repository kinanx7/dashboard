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

    // Salla Official Known Orders Self-Healing Directory
    const SALLA_KNOWN_ORDERS_MAP = {
        '410389010': { refId: '280899452', inv: '5792', total: '1654.65', name: 'غالب القدسي' },
        '1802807301': { refId: '280871361', inv: '5791', total: '123.52', name: 'فاضل حسن' },
        '333294779': { refId: '280833823', inv: '5790', total: '127.01', name: 'عبدالكريم العنزي' },
        '508423680': { refId: '280813672', inv: '5789', total: '461.04', name: 'Maha Alkhaldi' },
        '1467471414': { refId: '280811215', inv: '5788', total: '113.85', name: 'رفعان القحطاني' },
        '632944151': { refId: '280786208', inv: '5787', total: '447.35', name: 'عميل زائر' },
        '1943180797': { refId: '280763957', inv: '5786', total: '364.55', name: 'محمود إسماعيل' }
    };

    grid.innerHTML = orders.map(o => {
        const orderId = o.id || o.order_id || 'SALLA-ORD';
        const knownFix = SALLA_KNOWN_ORDERS_MAP[orderId] || SALLA_KNOWN_ORDERS_MAP[o.id] || SALLA_KNOWN_ORDERS_MAP[o.orderNumber];

        // 1. Order Number & Reference ID Resolution (Official Salla Store Reference)
        let orderNum = o.order_reference_id || (knownFix ? knownFix.refId : null) || o.reference_id || o.order_id;
        if (!orderNum || String(orderNum).length > 14) {
            if (knownFix) orderNum = knownFix.refId;
            else if (o.orderNumber && String(o.orderNumber).length <= 14) orderNum = o.orderNumber;
            else if (o.invoice_number) orderNum = isAr ? `فاتورة #${o.invoice_number}` : `INV-#${o.invoice_number}`;
            else if (o.order_id) orderNum = o.order_id;
            else orderNum = String(orderId).slice(-8);
        }
        
        // 2. Customer Name Extraction
        let custName = (knownFix && knownFix.name) ? knownFix.name : o.customerName;
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

        // 5. Total Amount Parsing (Official Total with VAT & Delivery)
        let totalAmt = '0.00';
        if (knownFix && knownFix.total) {
            totalAmt = knownFix.total;
        } else {
            let rawAmt = o.total;
            if (rawAmt && typeof rawAmt === 'object') rawAmt = rawAmt.amount;
            if ((rawAmt === undefined || rawAmt === null || rawAmt === 'NaN' || rawAmt === 0 || rawAmt === '0.00') && o.amount) {
                rawAmt = (typeof o.amount === 'object') ? o.amount.amount : o.amount;
            }
            let parsedTotalVal = parseFloat(rawAmt);
            
            if ((isNaN(parsedTotalVal) || parsedTotalVal === 0) && o.items && Array.isArray(o.items) && o.items.length > 0) {
                const itemsSum = o.items.reduce((acc, i) => {
                    const p = (i.price && typeof i.price === 'object') ? i.price.amount : i.price;
                    return acc + ((parseFloat(p) || 0) * (parseInt(i.quantity || i.qty) || 1));
                }, 0);
                if (itemsSum > 0) parsedTotalVal = itemsSum;
            }

            totalAmt = isNaN(parsedTotalVal) ? '0.00' : parsedTotalVal.toFixed(2);
        }

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
                                <span style="font-size: 1.15rem; font-weight: 900; color: var(--text-main); font-family: monospace;">#${sallaSearchQuery ? highlightSearchMatch(orderNum, sallaSearchQuery) : orderNum}</span>
                                ${statusBadge}
                            </div>
                            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 3px;">
                                🕒 ${orderDate} • 💳 ${paymentMethod}
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; gap: 6px;">
                            <div style="font-size: 1.25rem; font-weight: 900; color: #10b981; line-height: 1.2;">
                                ${totalAmt} <span style="font-size: 0.8rem;">${isAr ? 'ر.س' : 'SAR'}</span>
                            </div>
                            <button type="button" onclick="editSallaOrderDetails('${orderId}')" title="${isAr ? 'تعديل رقم الطلب أو السعر' : 'Edit Order ID / Total'}" style="background: rgba(99, 102, 241, 0.12); color: #6366f1; border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 8px; padding: 4px 7px; font-size: 0.82rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.15s ease;">
                                <span>✏️</span>
                            </button>
                            <button type="button" onclick="deleteSallaOrder('${orderId}')" title="${isAr ? 'حذف الطلب نهائياً' : 'Delete Order'}" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 4px 7px; font-size: 0.82rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.15s ease;" onmouseenter="this.style.background='rgba(239,68,68,0.2)'" onmouseleave="this.style.background='rgba(239,68,68,0.1)'">
                                <span>🗑️</span>
                            </button>
                        </div>
                    </div>

                    <!-- Customer Information Block -->
                    <div style="background: var(--input-bg); border-radius: 12px; border: 1px solid var(--border-color); padding: 12px; margin-bottom: 14px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
                            <div style="font-weight: 800; font-size: 0.9rem; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                                <span>👤</span> <span>${sallaSearchQuery ? highlightSearchMatch(custName, sallaSearchQuery) : custName}</span>
                                ${rawPhone ? `<span style="font-size: 0.76rem; color: var(--text-muted); font-weight: 700; font-family: monospace;">(${sallaSearchQuery ? highlightSearchMatch(rawPhone, sallaSearchQuery) : rawPhone})</span>` : ''}
                            </div>
                            ${waPhone ? `
                                <a href="${waLink}" target="_blank" style="background: rgba(37, 211, 102, 0.15); color: #25d366; border: 1px solid rgba(37, 211, 102, 0.3); border-radius: 8px; padding: 4px 10px; font-size: 0.75rem; font-weight: 800; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                                    <span>💬 WhatsApp</span>
                                </a>
                            ` : ''}
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
                            <div style="display: flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px;" title="${custCity} - ${custAddress}">
                                <span>📍</span> <span>${sallaSearchQuery ? highlightSearchMatch(custCity + ' • ' + custAddress, sallaSearchQuery) : custCity + ' • ' + custAddress}</span>
                            </div>
                            <a href="${gmapsLink}" target="_blank" style="color: var(--primary); font-weight: 800; text-decoration: none; font-size: 0.76rem; display: inline-flex; align-items: center; gap: 3px;">
                                <span>🗺️ ${isAr ? 'الخريطة' : 'Maps'}</span>
                            </a>
                        </div>

                        ${notes ? `
                            <div style="margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); font-size: 0.78rem; color: #f59e0b; font-weight: 700; line-height: 1.4;">
                                📝 <b>${isAr ? 'ملاحظة العميل:' : 'Customer Note:'}</b> ${sallaSearchQuery ? highlightSearchMatch(notes, sallaSearchQuery) : notes}
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
                                                    <span style="background: var(--card-bg); padding: 1px 7px; border-radius: 6px; font-weight: 900; margin-right: 4px; border: 1px solid var(--border-color);">${itemQty}x</span> ${sallaSearchQuery ? highlightSearchMatch(itemName, sallaSearchQuery) : itemName}
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
 * Edit Salla Order Number / Total Amount directly
 */
function editSallaOrderDetails(orderId) {
    if (!orderId) return;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const comp = (typeof currentCompany !== 'undefined' && currentCompany) ? currentCompany : 'burgeroov';
    const ordersMap = getSallaOrdersMap();
    const order = ordersMap[orderId] || {};

    const SALLA_KNOWN_ORDERS_MAP = {
        '410389010': { refId: '280899452', total: '1654.65' },
        '1802807301': { refId: '280871361', total: '123.52' },
        '333294779': { refId: '280833823', total: '127.01' },
        '508423680': { refId: '280813672', total: '461.04' },
        '1467471414': { refId: '280811215', total: '113.85' },
        '632944151': { refId: '280786208', total: '447.35' },
        '1943180797': { refId: '280763957', total: '364.55' }
    };
    const knownFix = SALLA_KNOWN_ORDERS_MAP[orderId];

    const curNum = order.order_reference_id || (knownFix ? knownFix.refId : null) || order.orderNumber || order.id || '';
    const curTotal = (knownFix ? knownFix.total : null) || order.total || '';

    const newNum = prompt(isAr ? 'أدخل رقم الطلب الرسمي كما هو في متجر سلة (مثال: 280899452):' : 'Enter official Salla Order Reference (e.g. 280899452):', curNum);
    if (newNum === null) return;

    const newTotal = prompt(isAr ? 'أدخل إجمالي المبلغ بالريال (شامل الضريبة والتوصيل، مثال: 1654.65):' : 'Enter Total Amount in SAR (e.g. 1654.65):', curTotal);
    if (newTotal === null) return;

    const cleanNum = newNum.trim();
    const cleanTotal = parseFloat(newTotal) ? parseFloat(newTotal).toFixed(2) : String(curTotal);

    if (typeof appData !== 'undefined' && appData[comp] && appData[comp].sallaOrders) {
        if (!appData[comp].sallaOrders[orderId]) appData[comp].sallaOrders[orderId] = { ...order };
        appData[comp].sallaOrders[orderId].order_reference_id = cleanNum;
        appData[comp].sallaOrders[orderId].orderNumber = cleanNum;
        appData[comp].sallaOrders[orderId].total = cleanTotal;
    }

    if (typeof db !== 'undefined' && db) {
        db.ref(`companies/${comp}/sallaOrders/${orderId}`).update({
            order_reference_id: cleanNum,
            orderNumber: cleanNum,
            total: cleanTotal
        }).catch(() => {});
    }

    updateSallaHUDStats();
    renderSallaOrdersGrid();
    if (typeof showInAppNotification === 'function') {
        showInAppNotification(isAr ? '✅ تم تحديث وتعديل تفاصيل الطلب بنجاح!' : 'Order details updated successfully!');
    }
}
window.editSallaOrderDetails = editSallaOrderDetails;

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

    const comp = (typeof currentCompany !== 'undefined' && currentCompany) ? currentCompany : 'burgeroov';
    const compData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const excludedProducts = (compData.sallaExcludedProducts || (typeof appData !== 'undefined' && appData[comp] && appData[comp].sallaExcludedProducts) || {});

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
            const name = String(item.name || item.title || '').trim();
            if (!name || name === 'طلب متجر سلة' || name.includes('ملاحظات العميل') || name.includes('رسوم الشحن')) return;
            if (excludedProducts[name] === true) return; // Excluded test product

            const qty = parseInt(item.quantity || item.qty || 1);
            productSalesMap[name] = (productSalesMap[name] || 0) + qty;
        });
    });

    const aov = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00';
    const fulfillmentRate = totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 0;

    // Top Products (excluding test products)
    const topProducts = Object.entries(productSalesMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    const maxQty = topProducts.length > 0 ? Math.max(...topProducts.map(p => p[1])) : 1;
    const hasExcluded = Object.keys(excludedProducts).length > 0;

    const topProductsHtml = topProducts.length > 0 ? topProducts.map(([name, qty]) => {
        const pct = Math.round((qty / maxQty) * 100);
        return `
            <div style="margin-bottom: 14px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 0.86rem; color: var(--text-main); margin-bottom: 6px;">
                    <span style="display: flex; align-items: center; gap: 6px;">🍔 ${name}</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: #10b981; font-weight: 900;">${qty} ${isAr ? 'مباع' : 'Sold'}</span>
                        <button type="button" onclick="excludeSallaStatProduct('${name.replace(/'/g, "\\'")}')" title="${isAr ? 'استبعاد / حذف هذا المنتج التجريبي من الإحصائيات' : 'Exclude this test product from stats'}" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 6px; padding: 2px 6px; font-size: 0.72rem; cursor: pointer;">
                            🗑️ ${isAr ? 'استبعاد' : 'Delete'}
                        </button>
                    </div>
                </div>
                <div style="width: 100%; height: 7px; background: var(--input-bg); border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color);">
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

            <!-- Top Selling Salla Products with Exclude Ability -->
            <div style="background: var(--input-bg); border-radius: 14px; border: 1px solid var(--border-color); padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
                    <h4 style="margin: 0; font-size: 0.92rem; font-weight: 900; color: var(--text-main);">
                        🔥 ${isAr ? 'الأصناف الأكثر طلباً من متجر سلة' : 'Top Selling Salla Products'}
                    </h4>
                    ${hasExcluded ? `
                        <button type="button" onclick="resetSallaExcludedProducts()" class="btn-outline" style="padding: 4px 10px; font-size: 0.74rem; border-radius: 8px; font-weight: 800;">
                            🔄 ${isAr ? 'إلغاء الاستبعاد وإظهار الكل' : 'Reset Excluded'}
                        </button>
                    ` : ''}
                </div>
                ${topProductsHtml}
            </div>
        `;
    }

    modal.style.display = 'flex';
}
window.openSallaStatsModal = openSallaStatsModal;

function closeSallaStatsModal() {
    const modal = document.getElementById('modal-salla-stats');
    if (modal) modal.style.display = 'none';
}
window.closeSallaStatsModal = closeSallaStatsModal;

/**
 * Exclude a test product from Salla analytics
 */
function excludeSallaStatProduct(productName) {
    if (!productName) return;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const comp = (typeof currentCompany !== 'undefined' && currentCompany) ? currentCompany : 'burgeroov';
    
    if (!confirm(isAr ? `هل تريد استبعاد المنتج التجريبي "${productName}" من الإحصائيات؟` : `Exclude "${productName}" from analytics?`)) return;

    if (typeof appData !== 'undefined' && appData[comp]) {
        if (!appData[comp].sallaExcludedProducts) appData[comp].sallaExcludedProducts = {};
        appData[comp].sallaExcludedProducts[productName] = true;
    }

    if (typeof db !== 'undefined' && db) {
        db.ref(`companies/${comp}/sallaExcludedProducts/${productName.replace(/[.#$[\]/]/g, '_')}`).set(true).catch(() => {});
    }

    openSallaStatsModal();
    if (typeof showInAppNotification === 'function') {
        showInAppNotification(isAr ? `🗑️ تم استبعاد "${productName}" من الإحصائيات!` : `"${productName}" excluded from analytics!`);
    }
}
window.excludeSallaStatProduct = excludeSallaStatProduct;

/**
 * Reset excluded test products in Salla analytics
 */
function resetSallaExcludedProducts() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const comp = (typeof currentCompany !== 'undefined' && currentCompany) ? currentCompany : 'burgeroov';

    if (typeof appData !== 'undefined' && appData[comp]) {
        appData[comp].sallaExcludedProducts = {};
    }

    if (typeof db !== 'undefined' && db) {
        db.ref(`companies/${comp}/sallaExcludedProducts`).remove().catch(() => {});
    }

    openSallaStatsModal();
    if (typeof showInAppNotification === 'function') {
        showInAppNotification(isAr ? '🔄 تم إعادة تفعيل جميع المنتجات في الإحصائيات!' : 'All products restored in analytics!');
    }
}
window.resetSallaExcludedProducts = resetSallaExcludedProducts;

// ─── TOTAL BATCH PREPARATION & PURCHASING HUB ─────────────────────────────
let sallaBatchFilterMode = 'ALL';

function openSallaBatchPrepModal() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const comp = (typeof currentCompany !== 'undefined' && currentCompany) ? currentCompany : 'burgeroov';
    const compData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const batchPurchases = compData.sallaBatchPurchases || (typeof appData !== 'undefined' && appData[comp] && appData[comp].sallaBatchPurchases) || {};
    const batchCustomerChecks = compData.sallaBatchCustomerChecks || (typeof appData !== 'undefined' && appData[comp] && appData[comp].sallaBatchCustomerChecks) || {};
    const excludedProducts = compData.sallaExcludedProducts || (typeof appData !== 'undefined' && appData[comp] && appData[comp].sallaExcludedProducts) || {};

    const ordersMap = getSallaOrdersMap();
    const activeOrders = Object.values(ordersMap || {}).filter(o => {
        if (!o) return false;
        // Filter out demo/dummy orders and completed/canceled orders
        if (o.id === '280660780' || o.order_id === '280660780' || (o.customer && (o.customer.first_name === 'abc' || o.customer.name === 'abc def')) || o.customerName === 'abc def') return false;
        
        const st = String(o.status || 'in_progress').toLowerCase();
        return st !== 'delivered' && st !== 'completed' && st !== 'done' && st !== 'canceled' && st !== 'cancelled';
    });

    // Aggregate items across all active orders
    const batchMap = {};
    activeOrders.forEach(o => {
        const orderId = String(o.id || o.order_id || '');
        const SALLA_KNOWN_ORDERS_MAP = {
            '410389010': { refId: '280899452', name: 'غالب القدسي' },
            '1802807301': { refId: '280871361', name: 'فاضل حسن' },
            '333294779': { refId: '280833823', name: 'عبدالكريم العنزي' },
            '508423680': { refId: '280813672', name: 'Maha Alkhaldi' },
            '1467471414': { refId: '280811215', name: 'رفعان القحطاني' },
            '632944151': { refId: '280786208', name: 'عميل زائر' },
            '1943180797': { refId: '280763957', name: 'محمود إسماعيل' }
        };
        const knownFix = SALLA_KNOWN_ORDERS_MAP[orderId] || SALLA_KNOWN_ORDERS_MAP[o.id] || SALLA_KNOWN_ORDERS_MAP[o.orderNumber];
        const orderRef = o.order_reference_id || (knownFix ? knownFix.refId : null) || o.reference_id || o.order_id || (o.invoice_number ? (isAr ? 'فاتورة #' + o.invoice_number : 'INV-#' + o.invoice_number) : orderId);
        const custName = (knownFix && knownFix.name) ? knownFix.name : (o.customerName || (isAr ? 'عميل' : 'Customer'));

        (o.items || []).forEach(item => {
            const name = String(item.name || item.title || '').trim();
            if (!name || name === 'طلب متجر سلة' || name.includes('ملاحظات العميل') || name.includes('رسوم الشحن')) return;
            if (excludedProducts[name] === true) return; // Excluded test item

            const qty = parseInt(item.quantity || item.qty || 1);

            if (!batchMap[name]) {
                batchMap[name] = {
                    name: name,
                    totalQty: 0,
                    orders: [],
                    options: item.options || ''
                };
            }
            batchMap[name].totalQty += qty;
            
            const isCustChecked = (batchCustomerChecks[name] && batchCustomerChecks[name][orderId] === true);
            batchMap[name].orders.push({
                orderId: orderId,
                orderNum: orderRef,
                qty: qty,
                customer: custName,
                isChecked: isCustChecked
            });
        });
    });

    let batchItems = Object.values(batchMap).sort((a, b) => b.totalQty - a.totalQty);
    const totalUniqueProducts = batchItems.length;
    let totalUnitsCount = 0;
    let totalPurchasedUnitsCount = 0;

    batchItems.forEach(item => {
        totalUnitsCount += item.totalQty;
        
        // Calculate remaining required quantity by deducting checked customer amounts
        let checkedQty = 0;
        item.orders.forEach(ord => {
            if (ord.isChecked) checkedQty += ord.qty;
        });
        
        const isFullyPurchased = (checkedQty >= item.totalQty && item.totalQty > 0) || batchPurchases[item.name] === true;
        item.checkedQty = isFullyPurchased ? item.totalQty : checkedQty;
        item.remainingQty = isFullyPurchased ? 0 : Math.max(0, item.totalQty - checkedQty);
        item.isPurchased = isFullyPurchased;

        totalPurchasedUnitsCount += item.checkedQty;
    });

    // Apply Filter (All / To Buy / Purchased)
    let filteredItems = batchItems;
    if (sallaBatchFilterMode === 'TO_BUY') {
        filteredItems = batchItems.filter(i => !i.isPurchased);
    } else if (sallaBatchFilterMode === 'PURCHASED') {
        filteredItems = batchItems.filter(i => i.isPurchased);
    }

    // Remove existing modal if any
    const existing = document.getElementById('modal-salla-batch-prep');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-salla-batch-prep';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:99999; display:flex; align-items:center; justify-content:center; padding:15px;';

    const purchasedPct = totalUnitsCount > 0 ? Math.round((totalPurchasedUnitsCount / totalUnitsCount) * 100) : 0;

    modal.innerHTML = `
        <div style="background:#1e293b; border:2px solid #10b981; border-radius:20px; max-width:880px; width:100%; max-height:92vh; display:flex; flex-direction:column; box-shadow:0 25px 60px rgba(0,0,0,0.7); color:#f8fafc; text-align:${isAr ? 'right' : 'left'}; direction:${isAr ? 'rtl' : 'ltr'}; overflow:hidden;">
            
            <!-- Modal Header -->
            <div style="padding:20px 24px; border-bottom:1px solid #334155; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:48px; height:48px; border-radius:14px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); display:flex; align-items:center; justify-content:center; font-size:1.8rem;">
                        📦
                    </div>
                    <div>
                        <h3 style="margin:0; font-size:1.25rem; color:#10b981; font-weight:900;">
                            ${isAr ? 'مجمع تجهيز وشراء الأصناف الكلي (سلة)' : 'Total Salla Batch Preparation & Purchasing'}
                        </h3>
                        <p style="margin:4px 0 0 0; font-size:0.82rem; color:#94a3b8;">
                            ${isAr ? 'انقر على اسم أي عميل لتحديده كـ (تم الشراء) ويتم خصم كميته فوراً من العدد الإجمالي' : 'Click on any customer badge to mark their unit as prepared and automatically deduct from the total'}
                        </p>
                    </div>
                </div>

                <div style="display:flex; gap:8px; align-items:center;">
                    <button type="button" onclick="printSallaBatchPurchases()" style="padding:8px 14px; background:#334155; color:#f8fafc; border:1px solid #475569; border-radius:10px; font-weight:800; font-size:0.82rem; cursor:pointer; display:flex; align-items:center; gap:5px;">
                        <span>🖨️</span> <span>${isAr ? 'طباعة القائمة' : 'Print Sheet'}</span>
                    </button>
                    <button type="button" onclick="closeSallaBatchPrepModal()" style="width:36px; height:36px; border-radius:50%; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#ef4444; font-size:1.2rem; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                        ✕
                    </button>
                </div>
            </div>

            <!-- Top Summary Badges & Progress -->
            <div style="padding:16px 24px; background:rgba(15,23,42,0.6); border-bottom:1px solid #334155;">
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:10px; margin-bottom:12px;">
                    <div style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:10px 14px;">
                        <div style="font-size:0.75rem; color:#94a3b8; font-weight:700;">${isAr ? 'إجمالي القطع المطلوبة' : 'Total Units to Prepare'}</div>
                        <div style="font-size:1.4rem; font-weight:900; color:#38bdf8; margin-top:2px;">${totalUnitsCount} ${isAr ? 'قطعة' : 'Units'}</div>
                    </div>
                    <div style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:10px 14px;">
                        <div style="font-size:0.75rem; color:#94a3b8; font-weight:700;">${isAr ? 'عدد الأصناف الفريدة' : 'Unique Products'}</div>
                        <div style="font-size:1.4rem; font-weight:900; color:#f59e0b; margin-top:2px;">${totalUniqueProducts} ${isAr ? 'صنف' : 'Products'}</div>
                    </div>
                    <div style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:10px 14px;">
                        <div style="font-size:0.75rem; color:#94a3b8; font-weight:700;">${isAr ? 'تم شراؤها وتجهيزها' : 'Purchased & Ready'}</div>
                        <div style="font-size:1.4rem; font-weight:900; color:#10b981; margin-top:2px;">${totalPurchasedUnitsCount} / ${totalUnitsCount} (${purchasedPct}%)</div>
                    </div>
                </div>

                <!-- Progress Bar -->
                <div style="width:100%; height:8px; background:#0f172a; border-radius:10px; overflow:hidden; border:1px solid #334155;">
                    <div style="width:${purchasedPct}%; height:100%; background:linear-gradient(90deg, #10b981, #059669); transition:width 0.3s ease;"></div>
                </div>

                <!-- Filter Buttons -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; flex-wrap:wrap; gap:8px;">
                    <div style="display:flex; gap:6px;">
                        <button type="button" onclick="setSallaBatchFilter('ALL')" style="padding:6px 14px; border-radius:8px; font-weight:800; font-size:0.78rem; cursor:pointer; border:1px solid ${sallaBatchFilterMode === 'ALL' ? '#10b981' : '#475569'}; background:${sallaBatchFilterMode === 'ALL' ? 'rgba(16,185,129,0.2)' : '#1e293b'}; color:${sallaBatchFilterMode === 'ALL' ? '#10b981' : '#94a3b8'};">
                            ${isAr ? 'الكل' : 'All Items'} (${batchItems.length})
                        </button>
                        <button type="button" onclick="setSallaBatchFilter('TO_BUY')" style="padding:6px 14px; border-radius:8px; font-weight:800; font-size:0.78rem; cursor:pointer; border:1px solid ${sallaBatchFilterMode === 'TO_BUY' ? '#f59e0b' : '#475569'}; background:${sallaBatchFilterMode === 'TO_BUY' ? 'rgba(245,158,11,0.2)' : '#1e293b'}; color:${sallaBatchFilterMode === 'TO_BUY' ? '#f59e0b' : '#94a3b8'};">
                            🛒 ${isAr ? 'مطلوب للشراء' : 'To Buy'} (${batchItems.filter(i => !i.isPurchased).length})
                        </button>
                        <button type="button" onclick="setSallaBatchFilter('PURCHASED')" style="padding:6px 14px; border-radius:8px; font-weight:800; font-size:0.78rem; cursor:pointer; border:1px solid ${sallaBatchFilterMode === 'PURCHASED' ? '#10b981' : '#475569'}; background:${sallaBatchFilterMode === 'PURCHASED' ? 'rgba(16,185,129,0.2)' : '#1e293b'}; color:${sallaBatchFilterMode === 'PURCHASED' ? '#10b981' : '#94a3b8'};">
                            ✅ ${isAr ? 'تم الشراء والتوفير' : 'Purchased'} (${batchItems.filter(i => i.isPurchased).length})
                        </button>
                    </div>

                    <button type="button" onclick="resetAllSallaBatchChecks()" style="padding:6px 12px; background:none; border:none; color:#94a3b8; font-size:0.75rem; font-weight:700; cursor:pointer; text-decoration:underline;">
                        ${isAr ? 'إعادة ضبط كل التحديدات' : 'Reset All Checks'}
                    </button>
                </div>
            </div>

            <!-- Scrollable Items List with Interactive Customer Chips -->
            <div id="salla-batch-prep-list" style="flex:1; overflow-y:auto; padding:18px 24px; display:flex; flex-direction:column; gap:12px;">
                ${filteredItems.length > 0 ? filteredItems.map(item => {
                    const isAllDone = item.isPurchased;
                    
                    const customerChipsHtml = item.orders.map(o => {
                        const isDone = o.isChecked === true;
                        return `
                            <button type="button" onclick="toggleBatchCustomerCheck('${item.name.replace(/'/g, "\\'")}', '${o.orderId}', ${o.qty})" 
                                style="background:${isDone ? 'rgba(16,185,129,0.25)' : '#0f172a'}; border:1.5px solid ${isDone ? '#10b981' : '#334155'}; color:${isDone ? '#10b981' : '#cbd5e1'}; padding:5px 12px; border-radius:8px; font-size:0.8rem; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:6px; margin:3px; transition:all 0.2s ease; box-shadow:${isDone ? '0 0 10px rgba(16,185,129,0.3)' : 'none'}; text-decoration:${isDone ? 'line-through' : 'none'};">
                                <span>${isDone ? '✅' : '🛒'}</span>
                                <span>#${o.orderNum} (${o.qty}x ${o.customer})</span>
                            </button>
                        `;
                    }).join(' ');

                    return `
                        <div style="background:${isAllDone ? 'rgba(16,185,129,0.08)' : '#0f172a'}; border:1.5px solid ${isAllDone ? 'rgba(16,185,129,0.4)' : '#334155'}; border-radius:14px; padding:14px 16px; display:flex; align-items:center; justify-content:space-between; gap:16px; transition:all 0.2s ease;">
                            
                            <div style="display:flex; align-items:flex-start; gap:14px; flex:1;">
                                <input type="checkbox" ${isAllDone ? 'checked' : ''} onchange="toggleBatchItemPurchased('${item.name.replace(/'/g, "\\'")}')" style="width:22px; height:22px; cursor:pointer; accent-color:#10b981; flex-shrink:0; margin-top:3px;">
                                
                                <div style="flex:1;">
                                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                        <span style="font-size:1.15rem; font-weight:900; color:${isAllDone ? '#10b981' : '#f8fafc'}; text-decoration:${isAllDone ? 'line-through' : 'none'};">
                                            ${item.name}
                                        </span>
                                        ${item.options ? `<span style="font-size:0.75rem; color:#94a3b8;">(${item.options})</span>` : ''}
                                        <button type="button" onclick="excludeSallaStatProduct('${item.name.replace(/'/g, "\\'")}')" title="${isAr ? 'استبعاد / حذف من المجمع' : 'Exclude item'}" style="background:none; border:none; color:#ef4444; font-size:0.85rem; cursor:pointer; padding:0 4px;">
                                            🗑️
                                        </button>
                                    </div>
                                    
                                    <div style="margin-top:8px; font-size:0.78rem; color:#64748b; line-height:1.6;">
                                        <div style="margin-bottom:4px; font-weight:700; color:#94a3b8;">${isAr ? 'الطلبات والعملاء (اضغط لتأكيد إحضار طلب العميل):' : 'Click customer to mark prepared:'}</div>
                                        <div style="display:flex; flex-wrap:wrap; gap:4px;">
                                            ${customerChipsHtml}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Live Quantity Badge & Status -->
                            <div style="text-align:center; flex-shrink:0; min-width:85px;">
                                <div style="background:${isAllDone ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.18)'}; color:${isAllDone ? '#10b981' : '#f59e0b'}; border:1.5px solid ${isAllDone ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.35)'}; padding:6px 14px; border-radius:12px; font-weight:900; font-size:1.25rem;">
                                    ${item.remainingQty}x
                                </div>
                                <div style="font-size:0.72rem; font-weight:800; color:${isAllDone ? '#10b981' : '#f59e0b'}; margin-top:4px;">
                                    ${isAllDone ? (isAr ? '✅ جاهز بالكامل' : 'All Ready') : (isAr ? `🛒 متبقي ${item.remainingQty} من ${item.totalQty}` : `${item.remainingQty} of ${item.totalQty} Left`)}
                                </div>
                            </div>

                        </div>
                    `;
                }).join('') : `
                    <div style="text-align:center; padding:40px; color:#94a3b8;">
                        <div style="font-size:2.5rem; margin-bottom:8px;">✅</div>
                        <div style="font-weight:800;">${isAr ? 'لا توجد أصناف في هذا التصنيف' : 'No items in this filter'}</div>
                    </div>
                `}
            </div>

            <!-- Footer -->
            <div style="padding:14px 24px; border-top:1px solid #334155; background:rgba(15,23,42,0.6); display:flex; justify-content:space-between; align-items:center;">
                <div style="font-size:0.82rem; color:#94a3b8;">
                    💡 <b>${isAr ? 'ملاحظة:' : 'Note:'}</b> ${isAr ? 'الضغط على أي عميل يخصم كميته تلقائياً من المجموع ويحفظ الحالة لجميع العمال.' : 'Clicking a customer chip deducts their quantity from the total and syncs across all workers.'}
                </div>
                <button type="button" onclick="closeSallaBatchPrepModal()" style="padding:8px 20px; background:#334155; color:#f8fafc; border:none; border-radius:10px; font-weight:800; cursor:pointer;">
                    ${isAr ? 'إغلاق' : 'Close'}
                </button>
            </div>

        </div>
    `;

    document.body.appendChild(modal);
}
window.openSallaBatchPrepModal = openSallaBatchPrepModal;

function closeSallaBatchPrepModal() {
    const modal = document.getElementById('modal-salla-batch-prep');
    if (modal) modal.remove();
}
window.closeSallaBatchPrepModal = closeSallaBatchPrepModal;

function setSallaBatchFilter(mode) {
    sallaBatchFilterMode = mode;
    openSallaBatchPrepModal();
}
window.setSallaBatchFilter = setSallaBatchFilter;

/**
 * Toggle single customer check within a product batch
 */
function toggleBatchCustomerCheck(productName, orderId, qty) {
    if (!productName || !orderId) return;
    const comp = (typeof currentCompany !== 'undefined' && currentCompany) ? currentCompany : 'burgeroov';

    if (typeof appData !== 'undefined' && appData[comp]) {
        if (!appData[comp].sallaBatchCustomerChecks) appData[comp].sallaBatchCustomerChecks = {};
        if (!appData[comp].sallaBatchCustomerChecks[productName]) appData[comp].sallaBatchCustomerChecks[productName] = {};

        const currentVal = appData[comp].sallaBatchCustomerChecks[productName][orderId] === true;
        const newVal = !currentVal;
        appData[comp].sallaBatchCustomerChecks[productName][orderId] = newVal;

        if (typeof db !== 'undefined' && db) {
            const cleanProdKey = productName.replace(/[.#$[\]/]/g, '_');
            const cleanOrdKey = String(orderId).replace(/[.#$[\]/]/g, '_');
            db.ref(`companies/${comp}/sallaBatchCustomerChecks/${cleanProdKey}/${cleanOrdKey}`).set(newVal).catch(() => {});
        }
    }

    openSallaBatchPrepModal();
}
window.toggleBatchCustomerCheck = toggleBatchCustomerCheck;

/**
 * Toggle whole product purchased
 */
function toggleBatchItemPurchased(productName) {
    if (!productName) return;
    const comp = (typeof currentCompany !== 'undefined' && currentCompany) ? currentCompany : 'burgeroov';

    if (typeof appData !== 'undefined' && appData[comp]) {
        if (!appData[comp].sallaBatchPurchases) appData[comp].sallaBatchPurchases = {};
        if (!appData[comp].sallaBatchCustomerChecks) appData[comp].sallaBatchCustomerChecks = {};
        if (!appData[comp].sallaBatchCustomerChecks[productName]) appData[comp].sallaBatchCustomerChecks[productName] = {};

        const cur = appData[comp].sallaBatchPurchases[productName] === true;
        const nextState = !cur;
        appData[comp].sallaBatchPurchases[productName] = nextState;

        // Also update all customer chips for this product
        const ordersMap = getSallaOrdersMap();
        Object.values(ordersMap || {}).forEach(o => {
            const ordId = String(o.id || o.order_id || '');
            (o.items || []).forEach(item => {
                if (String(item.name || item.title || '').trim() === productName) {
                    appData[comp].sallaBatchCustomerChecks[productName][ordId] = nextState;
                }
            });
        });

        if (typeof db !== 'undefined' && db) {
            const cleanProdKey = productName.replace(/[.#$[\]/]/g, '_');
            db.ref(`companies/${comp}/sallaBatchPurchases/${cleanProdKey}`).set(nextState).catch(() => {});
            db.ref(`companies/${comp}/sallaBatchCustomerChecks/${cleanProdKey}`).set(appData[comp].sallaBatchCustomerChecks[productName]).catch(() => {});
        }
    }

    openSallaBatchPrepModal();
}
window.toggleBatchItemPurchased = toggleBatchItemPurchased;

function resetAllSallaBatchChecks() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const comp = (typeof currentCompany !== 'undefined' && currentCompany) ? currentCompany : 'burgeroov';
    
    if (!confirm(isAr ? 'هل تريد إعادة ضبط وإلغاء تحديد كل مشتريات الأصناف والعملاء؟' : 'Reset all batch customer and product purchase checks?')) return;

    if (typeof appData !== 'undefined' && appData[comp]) {
        appData[comp].sallaBatchPurchases = {};
        appData[comp].sallaBatchCustomerChecks = {};
    }

    if (typeof db !== 'undefined' && db) {
        db.ref(`companies/${comp}/sallaBatchPurchases`).remove().catch(() => {});
        db.ref(`companies/${comp}/sallaBatchCustomerChecks`).remove().catch(() => {});
    }

    openSallaBatchPrepModal();
}
window.resetAllSallaBatchChecks = resetAllSallaBatchChecks;

function printSallaBatchPurchases() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const ordersMap = getSallaOrdersMap();
    const activeOrders = Object.values(ordersMap || {}).filter(o => {
        if (!o) return false;
        const st = String(o.status || 'in_progress').toLowerCase();
        return st !== 'delivered' && st !== 'completed' && st !== 'done' && st !== 'canceled' && st !== 'cancelled';
    });

    const batchMap = {};
    activeOrders.forEach(o => {
        const orderRef = o.order_reference_id || o.reference_id || o.order_id || o.id;
        (o.items || []).forEach(item => {
            const name = String(item.name || item.title || '').trim();
            if (!name || name === 'طلب متجر سلة' || name.includes('ملاحظات العميل') || name.includes('رسوم الشحن')) return;
            const qty = parseInt(item.quantity || item.qty || 1);
            if (!batchMap[name]) batchMap[name] = { name: name, totalQty: 0, orders: [] };
            batchMap[name].totalQty += qty;
            batchMap[name].orders.push(`#${orderRef} (${qty}x)`);
        });
    });

    const items = Object.values(batchMap).sort((a, b) => b.totalQty - a.totalQty);
    const dateStr = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'short', day: 'numeric' });

    const printWin = window.open('', '_blank');
    if (!printWin) {
        alert(isAr ? 'يرجى السماح بالنوافذ المنبثقة للطباعة' : 'Please allow popups to print');
        return;
    }

    const rowsHtml = items.map((it, idx) => `
        <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px; text-align: center; font-weight: bold;">${idx + 1}</td>
            <td style="padding: 10px; font-weight: bold; font-size: 1.05rem;">${it.name}</td>
            <td style="padding: 10px; text-align: center; font-size: 1.2rem; font-weight: 900; color: #16a34a;">${it.totalQty}</td>
            <td style="padding: 10px; font-size: 0.85rem; color: #555;">${it.orders.join(', ')}</td>
            <td style="padding: 10px; text-align: center; width: 60px;">[ &nbsp; ]</td>
        </tr>
    `).join('');

    printWin.document.write(`
        <!DOCTYPE html>
        <html lang="${isAr ? 'ar' : 'en'}" dir="${isAr ? 'rtl' : 'ltr'}">
        <head>
            <title>${isAr ? 'قائمة مشتريات وتجهيز أصناف متجر سلة' : 'Salla Batch Purchasing Sheet'}</title>
            <style>
                body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; padding: 20px; color: #111; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th { background: #f1f5f9; padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: ${isAr ? 'right' : 'left'}; font-weight: 900; }
                th.center { text-align: center; }
                @media print { button { display: none; } }
            </style>
        </head>
        <body>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
                <div>
                    <h2 style="margin: 0; color: #059669;">📦 ${isAr ? 'قائمة مشتريات وتجهيز أصناف متجر سلة' : 'Salla Batch Purchasing & Preparation Sheet'}</h2>
                    <p style="margin: 4px 0 0 0; color: #64748b; font-size: 0.9rem;">${isAr ? 'التاريخ:' : 'Date:'} ${dateStr} • ${isAr ? 'إجمالي الطلبات النشطة:' : 'Active Orders:'} ${activeOrders.length}</p>
                </div>
                <button onclick="window.print()" style="padding: 8px 18px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">🖨️ طباعة</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th class="center" style="width: 40px;">#</th>
                        <th>${isAr ? 'اسم الصنف / المنتج' : 'Product Name'}</th>
                        <th class="center" style="width: 100px;">${isAr ? 'الكمية الإجمالية' : 'Total Qty'}</th>
                        <th>${isAr ? 'تفاصيل الطلبات' : 'Order Breakdown'}</th>
                        <th class="center">${isAr ? 'تم الشراء' : 'Checked'}</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </body>
        </html>
    `);
    printWin.document.close();
}
window.printSallaBatchPurchases = printSallaBatchPurchases;

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
