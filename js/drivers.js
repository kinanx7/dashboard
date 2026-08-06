/**
 * Driver dispatch board, active status, delivery provisions & pool orders
 */

// --- DRIVERS SYSTEM ---
function selectDriver(driverId) {
    activeDriverId = driverId;
    renderDriverPanel();
    renderDriversList();
}

function toggleDriverPrepTime() {
    const status = document.getElementById('driver-order-status').value;
    document.getElementById('driver-prep-time-group').style.display = (status === 'preparing') ? 'block' : 'none';
}

function startDriverOrder() {
    if (!activeDriverId) return;
    const mins = parseInt(document.getElementById('driver-order-time').value);
    const details = document.getElementById('driver-order-details').value.trim();
    const status = document.getElementById('driver-order-status').value;
    let prepMins = 0;

    if (isNaN(mins) || mins <= 0) { alert("Enter valid delivery time in minutes."); return; }
    if (!details) { alert("Please enter the order details/items."); return; }
    if (status === 'preparing') {
        prepMins = parseInt(document.getElementById('driver-prep-time').value);
        if (isNaN(prepMins) || prepMins <= 0) { alert("Enter valid prep time in minutes."); return; }
    }

    const orderData = {
        startTime: Date.now(),
        allocatedMs: mins * 60 * 1000,
        details: details,
        status: status,
        prepStartTime: Date.now(),
        prepTimeMs: prepMins * 60 * 1000,
        isGeneralPool: activeDriverId === 'general'
    };

    if (activeDriverId === 'general') {
        const poolRef = db.ref(`companies/${currentCompany}/generalDeliveries`).push();
        orderData.id = poolRef.key;

        const companyData = getCompanyData();
        const existingCount = companyData.generalDeliveries ? Object.keys(companyData.generalDeliveries).length : 0;
        orderData.orderNum = existingCount + 1;

        poolRef.set(orderData)
            .then(() => {
                document.getElementById('driver-order-time').value = '';
                document.getElementById('driver-order-details').value = '';
                if (document.getElementById('driver-prep-time')) document.getElementById('driver-prep-time').value = '';
                document.getElementById('driver-order-status').value = 'ready';
                toggleDriverPrepTime();

                logActivity('delivery', 'general', 'General Pool', `Added order #${orderData.orderNum} to the general deliveries pool.`);
            })
            .catch(err => console.error("Error creating general pool order:", err));
        return;
    }

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === activeDriverId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    orderData.id = `direct_${Date.now()}`;
    worker.activeOrder = orderData;

    document.getElementById('driver-order-time').value = '';
    document.getElementById('driver-order-details').value = '';
    if (document.getElementById('driver-prep-time')) document.getElementById('driver-prep-time').value = '';
    document.getElementById('driver-order-status').value = 'ready';
    toggleDriverPrepTime();

    // Targeted write to activeOrder
    db.ref(`companies/${currentCompany}/workers/${workerIndex}/activeOrder`).set(worker.activeOrder)
        .catch(err => console.error("Error starting driver order:", err));
}

function pickupDriverOrder(workerId) {
    if (!workerId) workerId = activeDriverId;
    if (!workerId) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    if (worker && worker.activeOrder) {
        if (worker.activeOrder.status === 'preparing') {
            worker.activeOrder.prepEndTime = Date.now();
        }
        worker.activeOrder.status = 'picked_up';
        worker.activeOrder.startTime = Date.now(); // Restart timer exactly when picked up

        // Targeted write to activeOrder
        db.ref(`companies/${currentCompany}/workers/${workerIndex}/activeOrder`).set(worker.activeOrder)
            .catch(err => console.error("Error picking up order:", err));
    }
}

function forceOrderReady(workerId) {
    if (!confirm("Force this order to Ready status immediately?")) return;
    if (!workerId) workerId = activeDriverId;
    if (!workerId) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    if (worker && worker.activeOrder && worker.activeOrder.status === 'preparing') {
        worker.activeOrder.status = 'ready';
        worker.activeOrder.prepEndTime = Date.now(); // Log exactly when kitchen finished

        // Targeted write to activeOrder
        db.ref(`companies/${currentCompany}/workers/${workerIndex}/activeOrder`).set(worker.activeOrder)
            .catch(err => console.error("Error forcing order ready:", err));
    }
}

function finishDriverOrder(isSuccess, workerId) {
    if (!workerId) workerId = activeDriverId;
    if (!workerId) return;

    // Ask for confirmation before cancelling an order
    const isAr = currentAppLang === 'ar';
    const confirmMsg = isAr
        ? "هل أنت متأكد من إلغاء/إرجاع هذا الطلب؟"
        : "Are you sure you want to cancel/return this order?";
    if (!isSuccess && !confirm(confirmMsg)) {
        return;
    }

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];

    if (isSuccess && worker.activeOrder) {
        const stats = getMonthlyStats(worker, currentGlobalMonth);

        // Fallback if driver picks up directly without manager marking it ready
        let prepEnd = worker.activeOrder.prepEndTime;
        if (!prepEnd && worker.activeOrder.prepTimeMs > 0) {
            prepEnd = worker.activeOrder.startTime;
        }

        stats.deliveriesList.unshift({
            id: Date.now().toString(),
            date: formatTimestamp(),
            startTime: worker.activeOrder.startTime,
            endTime: Date.now(),
            allocatedMs: worker.activeOrder.allocatedMs,
            prepStartTime: worker.activeOrder.prepStartTime || null,
            prepTimeMs: worker.activeOrder.prepTimeMs || 0,
            prepEndTime: prepEnd || null,
            orderNum: worker.activeOrder.orderNum || null
        });

        // Write the deliveriesList
        db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/deliveriesList`).set(stats.deliveriesList)
            .catch(err => console.error("Error logging delivery record:", err));

        // Log activity
        if (typeof logActivity === 'function') {
            logActivity('delivery', worker.id, worker.name, `${worker.name} delivered: "${worker.activeOrder.details || 'No details'}"`);
        }
    } else if (!isSuccess && worker.activeOrder && worker.activeOrder.isGeneralPool) {
        // Return it to the general pool!
        const returnedOrder = {
            ...worker.activeOrder,
            assignedToWorkerId: null,
            assignedToWorkerName: null
        };
        const orderId = returnedOrder.id || `gen_${Date.now()}`;
        db.ref(`companies/${currentCompany}/generalDeliveries/${orderId}`).set(returnedOrder)
            .then(() => {
                logActivity('delivery', worker.id, worker.name, `${worker.name} returned order #${returnedOrder.orderNum || ''} to the general pool`);
            })
            .catch(err => console.error("Error returning order to general pool:", err));
    }

    worker.activeOrder = null;

    // Clear active order
    db.ref(`companies/${currentCompany}/workers/${workerIndex}/activeOrder`).set(null)
        .catch(err => console.error("Error clearing active order:", err));
}

function deleteDeliveryRecord(workerId, deliveryId) {
    if (!confirm(t('confirm-delete-delivery') || "Delete delivery record?")) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);
    stats.deliveriesList = stats.deliveriesList.filter(d => d.id !== deliveryId);

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/deliveriesList`).set(stats.deliveriesList)
        .catch(err => console.error("Error deleting delivery record:", err));
}

function deleteLegacyDelivery(workerId) {
    if (!confirm(t('confirm-remove-legacy') || "Remove legacy record?")) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);
    if (stats.legacyDeliveries > 0) {
        stats.legacyDeliveries--;

        db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/legacyDeliveries`).set(stats.legacyDeliveries)
            .catch(err => console.error("Error deleting legacy delivery:", err));
    }
}

function updateActiveDriverTimer() {
    const now = Date.now();

    function calcTime(order) {
        let displayTime = '--:--';
        let isLate = false;
        let statusText = '';
        let boxColor = 'var(--text-main)';

        if (order.status === 'preparing') {
            const diff = (order.prepStartTime + order.prepTimeMs) - now;
            isLate = diff <= 0;
            const absDiff = Math.abs(diff);
            const h = Math.floor(absDiff / 3600000).toString().padStart(2, '0');
            const m = Math.floor((absDiff % 3600000) / 60000).toString().padStart(2, '0');
            const s = Math.floor((absDiff % 60000) / 1000).toString().padStart(2, '0');
            displayTime = isLate ? `-${h !== '00' ? h + ':' : ''}${m}:${s}` : `${h !== '00' ? h + ':' : ''}${m}:${s}`;
            statusText = isLate ? '🚨 ' + t('status-late-prep') : '🟡 ' + t('status-preparing');
            boxColor = isLate ? 'var(--danger)' : 'var(--warning)';
        } else if (order.status === 'not_ready') {
            statusText = '🔴 ' + t('status-kitchen-not-ready');
        } else if (order.status === 'ready') {
            statusText = '🟢 ' + t('status-ready-pickup');
            boxColor = 'var(--success)';
        } else if (order.status === 'picked_up') {
            const diff = (order.startTime + order.allocatedMs) - now;
            isLate = diff <= 0;
            const absDiff = Math.abs(diff);
            const h = Math.floor(absDiff / 3600000).toString().padStart(2, '0');
            const m = Math.floor((absDiff % 3600000) / 60000).toString().padStart(2, '0');
            const s = Math.floor((absDiff % 60000) / 1000).toString().padStart(2, '0');
            displayTime = isLate ? `-${h !== '00' ? h + ':' : ''}${m}:${s}` : `${h !== '00' ? h + ':' : ''}${m}:${s}`;
            statusText = isLate ? '🚨 ' + t('status-late-delivering') : '🛵 ' + t('status-delivering');
            boxColor = isLate ? 'var(--danger)' : 'var(--info)';
        }
        return { displayTime, statusText, boxColor, isLate };
    }

    // 1. Update Manager Panel
    if (activeDriverId) {
        if (activeDriverId === 'general') {
            const timers = document.querySelectorAll('.general-pool-timer');
            timers.forEach(el => {
                const startTime = parseInt(el.getAttribute('data-start'));
                const timeMs = parseInt(el.getAttribute('data-time'));
                const diff = (startTime + timeMs) - now;
                const isLate = diff <= 0;
                const absDiff = Math.abs(diff);
                const h = Math.floor(absDiff / 3600000).toString().padStart(2, '0');
                const m = Math.floor((absDiff % 3600000) / 60000).toString().padStart(2, '0');
                const s = Math.floor((absDiff % 60000) / 1000).toString().padStart(2, '0');
                el.textContent = isLate ? `-${h !== '00' ? h + ':' : ''}${m}:${s}` : `${h !== '00' ? h + ':' : ''}${m}:${s}`;
                el.style.color = isLate ? 'var(--danger)' : 'var(--warning)';
            });
        } else {
            const worker = getCompanyData().workers.find(w => w.id === activeDriverId);
            if (worker && worker.activeOrder) {
                const res = calcTime(worker.activeOrder);
                document.getElementById('driver-timer-display').textContent = res.displayTime;
                document.getElementById('driver-timer-status').textContent = res.statusText;
                document.getElementById('driver-timer-status').style.color = res.boxColor;
                document.getElementById('driver-timer-box').style.borderColor = res.boxColor;
                document.getElementById('driver-timer-display').style.color = res.boxColor;
            }
        }
    }

    // 2. Update Persistent Driver Banner
    const driverBanner = document.getElementById('driver-order-timer-banner');
    if (currentUser && currentUser.role === 'worker') {
        const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
        if (myWorker && myWorker.activeOrder) {
            const order = myWorker.activeOrder;
            const res = calcTime(order);

            document.getElementById('driver-order-banner-details').textContent = order.details;
            document.getElementById('driver-order-banner-status').textContent = res.statusText;
            document.getElementById('driver-order-banner-status').style.color = res.boxColor;

            const bannerTime = document.getElementById('driver-order-banner-time');
            bannerTime.textContent = res.displayTime;
            bannerTime.style.color = res.boxColor;
            driverBanner.style.borderLeftColor = res.boxColor;

            // Inject Action Buttons into the Banner based on state
            const actionDiv = document.getElementById('driver-banner-actions');
            if (order.status !== 'picked_up') {
                actionDiv.innerHTML = `<button onclick="pickupDriverOrder('${myWorker.id}')" class="btn-warning" style="padding:10px 16px; font-size:0.9rem; border-radius:8px;">${t('btn-receive-order')}</button>`;
            } else {
                actionDiv.innerHTML = `<button onclick="finishDriverOrder(true, '${myWorker.id}')" class="btn-success" style="padding:10px 16px; font-size:0.9rem; border-radius:8px;">${t('btn-delivered')}</button>`;
            }
            driverBanner.style.display = 'block';
        } else {
            if (driverBanner) driverBanner.style.display = 'none';
        }
    } else {
        if (driverBanner) driverBanner.style.display = 'none';
    }
}

function renderDriversList() {
    const list = document.getElementById('driver-list-sidebar'); list.innerHTML = '';

    let workers;
    const isDriversAdmin = currentUser && (currentUser.role === 'admin' || document.body.classList.contains('perm-drivers'));
    if (isDriversAdmin) {
        workers = getCompanyData().workers || [];
    } else {
        workers = getVisibleWorkers();
    }

    const drivers = workers.filter(w => {
        const r = (w.role || "").toLowerCase();
        return r.includes('driver') || r.includes('سائق') || r.includes('delivery');
    });

    if (!isDriversAdmin && drivers.length > 0 && !activeDriverId) {
        activeDriverId = drivers[0].id;
    }

    // Prepend General Pool Card for Admin
    if (isDriversAdmin) {
        const pool = getCompanyData().generalDeliveries || {};
        const poolCount = Object.keys(pool).length;
        const poolDiv = document.createElement('div');
        const isPoolSelected = activeDriverId === 'general';
        poolDiv.className = 'driver-card general-pool-card';
        poolDiv.style.cursor = 'pointer';
        poolDiv.style.borderColor = isPoolSelected ? 'var(--primary)' : 'var(--border-color)';
        poolDiv.style.borderWidth = isPoolSelected ? '2px' : '1px';
        poolDiv.style.marginBottom = '12px';
        poolDiv.style.background = isPoolSelected ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(255,255,255,0.02)';

        const isAr = currentAppLang === 'ar';
        const badgeHtml = poolCount > 0
            ? `<span class="driver-status-badge status-busy" style="background:var(--warning-bg); color:var(--warning);"><span class="pulse-dot" style="background-color:var(--warning);"></span>${poolCount} ${isAr ? 'معلق' : 'Pending'}</span>`
            : `<span class="driver-status-badge status-available" style="background:var(--success-bg); color:var(--success);"><span class="pulse-dot" style="background-color:var(--success);"></span>${isAr ? 'فارغ' : 'Empty'}</span>`;

        poolDiv.innerHTML = `
            <div class="driver-card-header">
                <div class="driver-info">
                    <strong class="driver-name" style="color: var(--secondary); font-size:0.95rem;">📦 ${isAr ? 'خانة الطلبات العامة' : 'General Deliveries Pool'}</strong>
                </div>
                <div class="driver-actions">
                    ${badgeHtml}
                </div>
            </div>
        `;
        poolDiv.onclick = () => selectDriver('general');
        list.appendChild(poolDiv);
    }

    if (drivers.length === 0 && !isDriversAdmin) {
        list.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem;">No drivers found.</p>`;
    } else {
        drivers.forEach(d => {
            const div = document.createElement('div');
            const isSelected = d.id === activeDriverId;
            const isBusy = !!d.activeOrder;

            div.className = 'driver-card';
            div.style.cursor = 'pointer';
            div.style.borderColor = isSelected ? 'var(--primary)' : 'var(--border-color)';
            div.style.borderWidth = isSelected ? '2px' : '1px';

            let statusBadge = isBusy
                ? `<span class="driver-status-badge status-busy"><span class="pulse-dot"></span>${t('status-in-transit')}</span>`
                : `<span class="driver-status-badge status-available"><span class="pulse-dot"></span>${t('status-available')}</span>`;

            let removeBtn = isDriversAdmin ? `<button onclick="demoteFromDriver(event, '${d.id}')" style="background:var(--danger-bg); color:var(--danger); border:1px solid var(--danger-border); border-radius:6px; padding:2px 8px; font-size:0.75rem; cursor:pointer;" title="${t('btn-remove')}">${t('btn-remove')}</button>` : '';

            let provisionsHtml = '';
            const isAr = currentAppLang === 'ar';
            if (d.companyCar) provisionsHtml += `<span class="driver-prov-icon" title="${isAr ? 'سيارة من الشركة' : 'Company Car'}">🚗</span>`;
            if (d.companyFuel) provisionsHtml += `<span class="driver-prov-icon" title="${isAr ? 'بنزين من الشركة' : 'Company Fuel'}">⛽</span>`;

            let provWrapper = provisionsHtml ? `<div class="driver-prov-wrapper">${provisionsHtml}</div>` : '';

            div.innerHTML = `
                <div class="driver-card-header">
                    <div class="driver-info">
                        <strong class="driver-name">${d.name}</strong>
                        ${provWrapper}
                    </div>
                    <div class="driver-actions">
                        ${statusBadge}
                        ${removeBtn}
                    </div>
                </div>
            `;
            div.onclick = () => selectDriver(d.id);
            list.appendChild(div);
        });
    }

    // Populate Promote selector
    const selectEl = document.getElementById('assign-driver-select');
    if (selectEl) {
        const prevVal = selectEl.value;
        selectEl.innerHTML = '<option value="">-- Choose Employee --</option>';

        const nonDrivers = workers.filter(w => {
            const r = (w.role || "").toLowerCase();
            return !(r.includes('driver') || r.includes('سائق') || r.includes('delivery'));
        });

        nonDrivers.forEach(w => {
            const opt = document.createElement('option');
            opt.value = w.id;
            opt.textContent = `${w.name} (${w.role})`;
            selectEl.appendChild(opt);
        });

        if (nonDrivers.some(w => w.id === prevVal)) {
            selectEl.value = prevVal;
        }
    }
}

function promoteToDriver() {
    const wId = document.getElementById('assign-driver-select').value;
    if (!wId) return alert("Select an employee first.");
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === wId);
    if (workerIndex === -1) return;

    const worker = getCompanyData().workers[workerIndex];
    worker.role = "Driver";

    const carVal = document.getElementById('assign-driver-car')?.checked || false;
    const fuelVal = document.getElementById('assign-driver-fuel')?.checked || false;

    worker.companyCar = carVal;
    worker.companyFuel = fuelVal;

    // Save updated role and provision details to Firebase
    db.ref(`companies/${currentCompany}/workers/${workerIndex}`).update({
        role: worker.role,
        companyCar: carVal,
        companyFuel: fuelVal
    }).then(() => {
        alert(`${worker.name} is now assigned as a Driver!`);
        document.getElementById('assign-driver-select').value = "";
        if (document.getElementById('assign-driver-car')) document.getElementById('assign-driver-car').checked = false;
        if (document.getElementById('assign-driver-fuel')) document.getElementById('assign-driver-fuel').checked = false;
        renderAll();
    }).catch(err => console.error("Error promoting to driver:", err));
}

function demoteFromDriver(event, dId) {
    if (event) event.stopPropagation();
    if (!confirm("Remove this employee from Driver role?")) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === dId);
    if (workerIndex === -1) return;

    const worker = getCompanyData().workers[workerIndex];
    worker.role = "General Staff";

    // Targeted write to update worker role
    db.ref(`companies/${currentCompany}/workers/${workerIndex}/role`).set(worker.role)
        .then(() => {
            alert(`${worker.name} is now assigned as General Staff!`);
            if (activeDriverId === dId) {
                activeDriverId = null;
            }
        })
        .catch(err => console.error("Error demoting driver:", err));
}

function updateSelectedDriverProvisions() {
    if (!activeDriverId) return;
    const companyData = getCompanyData();
    const workerIndex = companyData.workers.findIndex(w => w.id === activeDriverId);
    if (workerIndex === -1) return;

    const carCheck = document.getElementById('edit-driver-car');
    const fuelCheck = document.getElementById('edit-driver-fuel');
    if (!carCheck || !fuelCheck) return;

    const carVal = carCheck.checked;
    const fuelVal = fuelCheck.checked;

    db.ref(`companies/${currentCompany}/workers/${workerIndex}`).update({
        companyCar: carVal,
        companyFuel: fuelVal
    }).then(() => {
        // Silently update cache and refresh views
        companyData.workers[workerIndex].companyCar = carVal;
        companyData.workers[workerIndex].companyFuel = fuelVal;
        renderDriversList();
    }).catch(err => console.error("Error updating driver provisions:", err));
}

function renderDriverVolumeRewards() {
    const listDiv = document.getElementById('driver-rewards-rules-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';
    const isAr = currentAppLang === 'ar';
    const companyData = getCompanyData();
    const rewards = companyData.driverVolumeRewards || [];
    if (rewards.length === 0) {
        listDiv.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); text-align:center;">${isAr ? 'لا توجد قواعد مكافآت معينة.' : 'No reward rules configured yet.'}</p>`;
        return;
    }
    rewards.forEach((r, idx) => {
        const row = document.createElement('div');
        row.className = 'flex-between';
        row.style.background = 'var(--input-bg)';
        row.style.padding = '8px 12px';
        row.style.borderRadius = '6px';
        row.style.fontSize = '0.85rem';
        row.style.border = '1px solid var(--border-color)';
        row.innerHTML = `
            <span>🎯 <strong>${r.ordersCount}</strong> ${isAr ? 'طلب' : 'orders'} ➔ <strong style="color:var(--success);">SAR ${parseFloat(r.rewardAmount).toLocaleString()}</strong></span>
            <button onclick="deleteDriverVolumeReward(${idx})" class="btn-outline-danger" style="padding:2px 6px; font-size:0.7rem; line-height:1; border:none; background:transparent; cursor:pointer;" title="${isAr ? 'حذف القاعدة' : 'Delete Rule'}">🗑️</button>
        `;
        listDiv.appendChild(row);
    });
}

function addDriverVolumeReward() {
    const ordersInput = document.getElementById('reward-orders-input');
    const sarInput = document.getElementById('reward-sar-input');
    if (!ordersInput || !sarInput) return;

    const ordersCount = parseInt(ordersInput.value);
    const rewardAmount = parseFloat(sarInput.value);

    if (isNaN(ordersCount) || ordersCount <= 0) {
        alert("Enter valid daily orders count.");
        return;
    }
    if (isNaN(rewardAmount) || rewardAmount <= 0) {
        alert("Enter valid reward amount.");
        return;
    }

    const companyData = getCompanyData();
    if (!companyData.driverVolumeRewards) companyData.driverVolumeRewards = [];

    // Check if a rule for this ordersCount already exists
    const existingIdx = companyData.driverVolumeRewards.findIndex(r => r.ordersCount === ordersCount);
    if (existingIdx !== -1) {
        if (!confirm("A rule for this number of orders already exists. Overwrite it?")) return;
        companyData.driverVolumeRewards[existingIdx].rewardAmount = rewardAmount;
    } else {
        companyData.driverVolumeRewards.push({ ordersCount, rewardAmount });
    }

    // Sort by ordersCount ascending
    companyData.driverVolumeRewards.sort((a, b) => a.ordersCount - b.ordersCount);

    db.ref(`companies/${currentCompany}/driverVolumeRewards`).set(companyData.driverVolumeRewards)
        .then(() => {
            ordersInput.value = '';
            sarInput.value = '';
            renderDriverVolumeRewards();
            renderAll(); // Refresh finance table calculations
        })
        .catch(err => console.error("Error saving driver rewards rule:", err));
}

function deleteDriverVolumeReward(idx) {
    const companyData = getCompanyData();
    const rewards = companyData.driverVolumeRewards || [];
    if (!rewards[idx]) return;

    if (!confirm("Are you sure you want to delete this reward rule?")) return;

    rewards.splice(idx, 1);
    db.ref(`companies/${currentCompany}/driverVolumeRewards`).set(rewards)
        .then(() => {
            renderDriverVolumeRewards();
            renderAll(); // Refresh finance table calculations
        })
        .catch(err => console.error("Error deleting driver rewards rule:", err));
}

function renderDriverPanel() {
    const mngArea = document.getElementById('driver-management-area');
    if (!activeDriverId) { mngArea.style.display = 'none'; document.getElementById('active-driver-name').textContent = t('span-select-driver'); return; }

    mngArea.style.display = 'block';
    const isAr = currentAppLang === 'ar';
    const companyData = getCompanyData();

    // Show provisions configuration, timer, and action elements by default (might be hidden for General Pool)
    const provSection = document.getElementById('driver-provisions-section');
    if (provSection) provSection.style.display = 'block';
    document.getElementById('driver-timer-box').style.display = 'flex';
    document.getElementById('driver-timer-status').style.display = 'block';
    document.getElementById('panel-driver-actions').style.display = 'flex';

    if (activeDriverId === 'general') {
        document.getElementById('active-driver-name').textContent = isAr ? 'مسبح التوصيلات العامة' : 'General Deliveries Pool';

        if (provSection) provSection.style.display = 'none';

        const totalHud = document.getElementById('driver-total-orders');
        if (totalHud) totalHud.textContent = 'N/A';

        const formArea = document.querySelector('#view-drivers .management-form-area');
        const activeArea = document.getElementById('driver-active-order');

        formArea.style.display = 'block';
        activeArea.style.display = 'block';

        document.getElementById('driver-timer-box').style.display = 'none';
        document.getElementById('driver-timer-status').style.display = 'none';
        document.getElementById('panel-driver-actions').style.display = 'none';

        const pool = companyData.generalDeliveries || {};
        const poolKeys = Object.keys(pool);
        let detailsHtml = '';
        if (poolKeys.length === 0) {
            detailsHtml = `<p style="color:var(--text-muted); text-align:center; padding: 20px;">${isAr ? 'لا توجد طلبات معلقة في التوصيل العام.' : 'No pending orders in the general pool.'}</p>`;
        } else {
            detailsHtml = `<div style="display:flex; flex-direction:column; gap:16px; text-align:left; width: 100%;">`;
            const now = Date.now();
            poolKeys.forEach(orderId => {
                const order = pool[orderId];
                let timeText = '--:--';
                let orderStatusText = '';
                let statusColor = 'var(--text-muted)';
                let isLate = false;

                if (order.status === 'preparing') {
                    const diff = (order.prepStartTime + order.prepTimeMs) - now;
                    isLate = diff <= 0;
                    const absDiff = Math.abs(diff);
                    const h = Math.floor(absDiff / 3600000).toString().padStart(2, '0');
                    const m = Math.floor((absDiff % 3600000) / 60000).toString().padStart(2, '0');
                    const s = Math.floor((absDiff % 60000) / 1000).toString().padStart(2, '0');
                    timeText = isLate ? `-${h !== '00' ? h + ':' : ''}${m}:${s}` : `${h !== '00' ? h + ':' : ''}${m}:${s}`;
                    orderStatusText = isLate ? t('status-late-prep') : t('status-preparing');
                    statusColor = isLate ? 'var(--danger)' : 'var(--warning)';
                } else if (order.status === 'not_ready') {
                    orderStatusText = t('status-kitchen-not-ready');
                    statusColor = 'var(--danger)';
                } else if (order.status === 'ready') {
                    orderStatusText = t('status-ready-pickup');
                    statusColor = 'var(--success)';
                }

                const cancelBtn = `<button onclick="cancelGeneralPoolOrder('${orderId}')" class="btn-danger" style="padding: 6px 12px; font-size: 0.8rem; border-radius: 6px; cursor: pointer; border: none;">${isAr ? '❌ إلغاء الطلب' : '❌ Cancel'}</button>`;

                detailsHtml += `
                    <div class="ledger-card" style="border-left: 4px solid ${statusColor}; padding: 16px; display: flex; flex-direction: column; gap: 8px; background: rgba(255,255,255,0.02); border-radius: 8px;">
                        <div class="flex-between">
                            <strong style="color:var(--secondary); font-size:1.05rem;">${isAr ? 'طلب' : 'Order'} #${order.orderNum || ''}</strong>
                            ${cancelBtn}
                        </div>
                        <div style="font-size:0.95rem; color:var(--text-main); font-family:var(--font-mono); margin: 6px 0; background: rgba(0,0,0,0.15); padding: 8px 12px; border-radius: 6px; white-space: pre-wrap;">${order.details}</div>
                        <div class="flex-between" style="font-size:0.85rem; color:var(--text-muted);">
                            <div>${isAr ? 'حالة المطبخ' : 'Kitchen Status'}: <span style="color:${statusColor}; font-weight:600;">${orderStatusText}</span></div>
                            ${order.status === 'preparing' ? `<div class="general-pool-timer" data-start="${order.prepStartTime}" data-time="${order.prepTimeMs}" style="font-family:var(--font-mono); font-weight:700; color:${statusColor};">${timeText}</div>` : ''}
                        </div>
                    </div>
                `;
            });
            detailsHtml += `</div>`;
        }
        document.getElementById('panel-order-details').innerHTML = detailsHtml;
        document.getElementById('driver-orders-list').innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:20px;">${isAr ? 'مسبح التوصيل العام لا يحتوي على سجل مالي أو تاريخ توصيل خاص به.' : 'The general pool does not have individual history logs.'}</p>`;

        const driverPoolContainer = document.getElementById('driver-general-pool-container');
        if (driverPoolContainer) driverPoolContainer.style.display = 'none';
        return;
    }

    const worker = companyData.workers.find(w => w.id === activeDriverId);
    if (!worker) {
        activeDriverId = null;
        mngArea.style.display = 'none';
        document.getElementById('active-driver-name').textContent = t('span-select-driver');
        return;
    }
    document.getElementById('active-driver-name').textContent = `${t('label-managing') || 'Managing: '}${worker.name}`;

    // Set Driver provisions checkbox states
    const carCheck = document.getElementById('edit-driver-car');
    const fuelCheck = document.getElementById('edit-driver-fuel');
    if (carCheck) carCheck.checked = !!worker.companyCar;
    if (fuelCheck) fuelCheck.checked = !!worker.companyFuel;

    const stats = getMonthlyStats(worker, currentGlobalMonth);
    const totalDels = (stats.deliveriesList ? stats.deliveriesList.length : 0) + (stats.legacyDeliveries || 0);
    document.getElementById('driver-total-orders').textContent = totalDels;

    const formArea = document.querySelector('#view-drivers .management-form-area');
    const activeArea = document.getElementById('driver-active-order');

    if (worker.activeOrder) {
        formArea.style.display = 'none';
        activeArea.style.display = 'block';
        document.getElementById('panel-order-details').textContent = worker.activeOrder.details;

        // Hide general pool container for this driver while they have an active order
        const driverPoolContainer = document.getElementById('driver-general-pool-container');
        if (driverPoolContainer) driverPoolContainer.style.display = 'none';

        // Inject Panel Action Buttons
        const panelActions = document.getElementById('panel-driver-actions');
        let html = '';

        // Check if user is a Master Admin OR has the 'Drivers Admin' permission
        const isManager = currentUser && (currentUser.role === 'admin' || document.body.classList.contains('perm-drivers'));

        // 1. Force Ready Button (Managers Only, when preparing)
        if (isManager && worker.activeOrder.status === 'preparing') {
            html += `<div style="width: 100%; text-align: center; margin-bottom: 12px;">
                                <button onclick="forceOrderReady('${worker.id}')" class="btn-info" style="padding: 12px 24px; width: 100%;">🟢 Force Kitchen Ready</button>
                             </div>`;
        }

        // 2. Pickup / Deliver Buttons (Visible to Driver & Managers)
        if (worker.activeOrder.status !== 'picked_up') {
            html += `<button onclick="pickupDriverOrder('${worker.id}')" class="btn-warning" style="padding: 12px 24px;">📦 Mark as Received/Picked Up</button>`;
        } else {
            html += `<button onclick="finishDriverOrder(true, '${worker.id}')" class="btn-success" style="padding: 12px 24px;">✅ Order Delivered</button>`;
        }

        // 3. Cancel Button (Managers can always cancel, Driver can cancel if it's a general pool order)
        if (isManager || worker.activeOrder.isGeneralPool) {
            const btnText = worker.activeOrder.isGeneralPool
                ? t('btn-return-pool')
                : (isAr ? '❌ إلغاء الطلب' : '❌ Cancel Order');
            html += `<button onclick="finishDriverOrder(false, '${worker.id}')" class="btn-danger" style="padding: 12px 24px;">${btnText}</button>`;
        }

        panelActions.innerHTML = html;

        updateActiveDriverTimer();
    }
    else {
        formArea.style.display = 'block';
        activeArea.style.display = 'none';

        // If the logged in user is a driver (worker) and is managing themselves
        const isSelfDriver = currentUser && currentUser.email && worker.email && (currentUser.email.toLowerCase() === worker.email.toLowerCase());
        const isDriverRole = (worker.role || "").toLowerCase().includes('driver') || (worker.role || "").toLowerCase().includes('سائق') || (worker.role || "").toLowerCase().includes('delivery');

        if (isSelfDriver && isDriverRole) {
            // Render the Available General Deliveries Pool for this driver to claim!
            const pool = companyData.generalDeliveries || {};
            const poolKeys = Object.keys(pool);
            const driverPoolContainer = document.getElementById('driver-general-pool-container');
            const driverPoolList = document.getElementById('driver-general-pool-list');

            if (driverPoolContainer && driverPoolList) {
                if (poolKeys.length === 0) {
                    driverPoolContainer.style.display = 'none';
                } else {
                    driverPoolContainer.style.display = 'block';
                    let poolHtml = '';
                    poolKeys.forEach(orderId => {
                        const order = pool[orderId];
                        let statusText = '';
                        let statusColor = 'var(--text-muted)';
                        if (order.status === 'preparing') {
                            statusText = t('status-preparing');
                            statusColor = 'var(--warning)';
                        } else if (order.status === 'not_ready') {
                            statusText = t('status-kitchen-not-ready');
                            statusColor = 'var(--danger)';
                        } else if (order.status === 'ready') {
                            statusText = t('status-ready-pickup');
                            statusColor = 'var(--success)';
                        }

                        poolHtml += `
                            <div class="ledger-card" style="border-left: 4px solid ${statusColor}; padding: 16px; border-radius: 8px; display: flex; flex-direction: column; gap: 8px; background: rgba(255,255,255,0.02); text-align: left;">
                                <div class="flex-between">
                                    <strong style="color:var(--secondary); font-size:1.02rem;">${isAr ? 'طلب عام' : 'General Order'} #${order.orderNum || ''}</strong>
                                    <button onclick="claimGeneralDelivery('${orderId}')" class="btn-success" style="padding: 6px 14px; font-size: 0.85rem; border-radius: 6px; cursor: pointer; border: none; font-weight:700;">${t('btn-accept-delivery')}</button>
                                </div>
                                <div style="font-size:0.92rem; color:var(--text-main); font-family:var(--font-mono); background: rgba(0,0,0,0.15); padding: 8px 12px; border-radius: 6px; white-space: pre-wrap;">${order.details}</div>
                                <div style="font-size:0.82rem; color:var(--text-muted);">
                                    ${isAr ? 'المطبخ' : 'Kitchen'}: <span style="color:${statusColor}; font-weight:600;">${statusText}</span>
                                </div>
                            </div>
                        `;
                    });
                    driverPoolList.innerHTML = poolHtml;
                }
            }
        } else {
            const driverPoolContainer = document.getElementById('driver-general-pool-container');
            if (driverPoolContainer) driverPoolContainer.style.display = 'none';
        }
    }

    const isAdmin = currentUser && currentUser.role === 'admin';

    // Render Orders History
    const ordersList = document.getElementById('driver-orders-list');
    ordersList.innerHTML = '';
    if (stats.deliveriesList && stats.deliveriesList.length > 0) {
        stats.deliveriesList.forEach((order, index) => {
            const actualOrderNum = order.orderNum || (totalDels - index);
            const durationMs = order.endTime - order.startTime;
            const diff = durationMs - order.allocatedMs;
            const timeTaken = formatDuration(durationMs);
            let statusHtml = '';
            if (diff > 0) statusHtml = `<span style="color:var(--danger)">${t('late-by')} ${formatDuration(diff)} ❌</span>`;
            else statusHtml = `<span style="color:var(--success)">${t('on-time')} ✅</span>`;

            let prepHtml = '';
            if (order.prepTimeMs > 0 && order.prepStartTime && order.prepEndTime) {
                const prepDuration = order.prepEndTime - order.prepStartTime;
                const prepDiff = prepDuration - order.prepTimeMs;
                const prepTimeTaken = formatDuration(prepDuration);

                if (prepDiff > 0) {
                    prepHtml = `<div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">${t('kitchen-prep-time')} <strong>${prepTimeTaken}</strong> <span style="color:var(--danger)">(${t('late-by')} ${formatDuration(prepDiff)}) ❌</span></div>`;
                } else {
                    prepHtml = `<div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">${t('kitchen-prep-time')} <strong>${prepTimeTaken}</strong> <span style="color:var(--success)">(${t('on-time')}) ✅</span></div>`;
                }
            }

            let delBtn = isAdmin ? `<button onclick="deleteDeliveryRecord('${worker.id}', '${order.id}')" class="btn-outline-danger admin-only" style="padding: 2px 6px; font-size: 0.7rem; border:none; text-decoration:underline;">Undo/Delete</button>` : '';

            const div = document.createElement('div');
            const isLate = diff > 0;
            div.className = `ledger-card driver-history-card ${isLate ? 'status-late' : 'status-ontime'}`;
            div.innerHTML = `
                        <div class="flex-between" style="margin-bottom: 4px;">
                            <strong style="color:var(--primary);">${isAr ? 'طلب' : 'Order'} #${actualOrderNum}</strong>
                            <div style="display:flex; gap:8px; align-items:center;">
                                <span style="font-size:0.75rem; color:var(--text-muted);">${order.date}</span>
                                ${delBtn}
                            </div>
                        </div>
                        <div style="font-size:0.95rem; color:var(--text-main);">${t('delivery-time')} <strong>${timeTaken}</strong></div>
                        ${prepHtml}
                        <div style="font-size:0.85rem; margin-top:4px;">${t('delivery-status')} ${statusHtml}</div>
                    `;
            ordersList.appendChild(div);
        });
    } else if (stats.legacyDeliveries > 0) {
        let delLegacyBtn = isAdmin ? `<button onclick="deleteLegacyDelivery('${worker.id}')" class="btn-outline-danger admin-only" style="margin-left: 10px; padding: 2px 6px; font-size: 0.7rem; border:none; text-decoration:underline;">-1 Undo</button>` : '';
        ordersList.innerHTML = `<div class="ledger-card" style="text-align:center; color:var(--text-muted);">${stats.legacyDeliveries} ${isAr ? 'توصيلة سابقة مسجلة (لا تتوفر بيانات توقيت).' : 'legacy deliveries recorded (no timing data).'} ${delLegacyBtn}</div>`;
    } else {
        ordersList.innerHTML = `<div class="ledger-card" style="text-align:center; color:var(--text-muted);">${isAr ? 'لم يتم إكمال أي عمليات توصيل بعد.' : 'No deliveries completed yet.'}</div>`;
    }
}

// --- MANAGEMENT ACTIONS ---
function addPaymentRecord() {
    const workerId = document.getElementById('fin-worker-select').value;
    const amount = parseFloat(document.getElementById('payment-amount').value);
    if (!workerId || isNaN(amount) || amount <= 0) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);

    stats.paymentsList.unshift({ id: Date.now().toString(), date: formatTimestamp(), amount: amount });
    document.getElementById('payment-amount').value = '';

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/paymentsList`).set(stats.paymentsList)
        .then(() => {
            logActivity('finance', worker.id, worker.name, `Logged advance payment of SAR ${amount} for ${worker.name}`);
        })
        .catch(err => console.error("Error adding payment:", err));
}

function deletePaymentRecord(workerId, paymentId) {
    if (!confirm("Remove this payment log?")) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);
    stats.paymentsList = stats.paymentsList.filter(p => p.id !== paymentId);

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/paymentsList`).set(stats.paymentsList)
        .then(() => {
            logActivity('finance_delete', workerId, worker.name, `Deleted advance payment record for ${worker.name}`);
        })
        .catch(err => console.error("Error deleting payment:", err));
}

function addRewardRecord() {
    const workerId = document.getElementById('fin-worker-select').value;
    const amount = parseFloat(document.getElementById('reward-amount').value);
    if (!workerId || isNaN(amount) || amount <= 0) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);

    stats.rewardsList.unshift({ id: Date.now().toString(), date: formatTimestamp(), amount: amount });
    document.getElementById('reward-amount').value = '';

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/rewardsList`).set(stats.rewardsList)
        .then(() => {
            logActivity('finance', worker.id, worker.name, `Logged reward/bonus of SAR ${amount} for ${worker.name}`);
        })
        .catch(err => console.error("Error adding reward:", err));
}

function deleteRewardRecord(workerId, rewardId) {
    if (!confirm("Remove this reward log?")) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);
    stats.rewardsList = stats.rewardsList.filter(r => r.id !== rewardId);

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/rewardsList`).set(stats.rewardsList)
        .then(() => {
            logActivity('finance_delete', workerId, worker.name, `Deleted reward/bonus record for ${worker.name}`);
        })
        .catch(err => console.error("Error deleting reward:", err));
}

function addCustodyRecord(type) {
    const workerId = document.getElementById('fin-worker-select').value;
    const amount = parseFloat(document.getElementById('custody-amount').value);
    if (!workerId || isNaN(amount) || amount <= 0) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);

    stats.custodyList.unshift({ id: Date.now().toString(), date: formatTimestamp(), amount: amount, type: type });
    document.getElementById('custody-amount').value = '';

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/custodyList`).set(stats.custodyList)
        .then(() => {
            logActivity('finance', worker.id, worker.name, `Logged custody item "${type}" (SAR ${amount}) for ${worker.name}`);
        })
        .catch(err => console.error("Error adding custody:", err));
}

function deleteCustodyRecord(workerId, custodyId) {
    if (!confirm("Remove this custody log?")) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);
    stats.custodyList = stats.custodyList.filter(c => c.id !== custodyId);

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/custodyList`).set(stats.custodyList)
        .then(() => {
            logActivity('finance_delete', workerId, worker.name, `Deleted custody record for ${worker.name}`);
        })
        .catch(err => console.error("Error deleting custody:", err));
}

function addBranch() {
    const nameInput = document.getElementById('new-branch-name'); const name = nameInput.value.trim();
    if (name && !getCompanyData().branches.includes(name)) {
        getCompanyData().branches.push(name);
        nameInput.value = '';
        db.ref('companies/' + currentCompany + '/branches').set(getCompanyData().branches)
            .catch(err => console.error("Error adding branch:", err));
    }
    else { alert("Invalid or existing branch."); }
}
function deleteBranch(branchName) {
    if (confirm(`Remove branch: ${branchName}?`)) {
        getCompanyData().branches = getCompanyData().branches.filter(b => b !== branchName);
        db.ref('companies/' + currentCompany + '/branches').set(getCompanyData().branches)
            .catch(err => console.error("Error deleting branch:", err));
    }
}

function addWorker() {
    const name = document.getElementById('w-name').value.trim();
    const email = document.getElementById('w-email').value.trim().toLowerCase();
    let role = document.getElementById('w-role').value.trim() || "General Staff";
    const startTime = document.getElementById('w-start-time').value;
    const endTime = document.getElementById('w-end-time').value;
    const income = document.getElementById('w-income').value;
    const branch = document.getElementById('w-branch').value;

    if (!name || !email || !startTime || !endTime || !income || !branch) { alert("Complete all required fields, including email."); return; }

    const newWorker = {
        id: Date.now().toString(),
        name, email, role, income, startTime, endTime, branch,
        initialBalance: 0, jobs: [], monthlyStats: {}, logs: [], rank: "Unranked", lastEvalDate: Date.now(),
        permissions: { warehouse: false, drivers: false, finance: false }
    };

    newWorker.monthlyStats[currentGlobalMonth] = { custodyList: [], violationsList: [], rewardsList: [], costs: 0, paymentsList: [], deliveriesList: [], legacyDeliveries: 0 };
    if (!getCompanyData().workers) getCompanyData().workers = [];
    getCompanyData().workers.push(newWorker);

    ['w-name', 'w-email', 'w-role', 'w-start-time', 'w-end-time', 'w-income'].forEach(id => document.getElementById(id).value = '');

    // Targeted write to workers list
    db.ref('companies/' + currentCompany + '/workers').set(getCompanyData().workers)
        .then(() => {
            const key = email.replace(/\./g, ',');
            db.ref(`companies/${currentCompany}/users/${key}`).set(newWorker.id)
                .catch(err => console.error("Error writing worker flat email mapping:", err));
            db.ref(`companies/${currentCompany}/userPermissions/${newWorker.id}`).set({
                email: newWorker.email.toLowerCase(),
                ...newWorker.permissions
            }).catch(err => console.error("Error writing worker flat permission:", err));
        })
        .catch(err => console.error("Error adding worker:", err));
}

function deleteWorker(workerId) {
    const worker = getCompanyData().workers.find(w => w.id === workerId);
    if (confirm('Permanently delete this employee?')) {
        getCompanyData().workers = getCompanyData().workers.filter(w => w.id !== workerId);
        document.getElementById('ops-worker-select').value = "";
        document.getElementById('fin-worker-select').value = "";
        document.getElementById('task-worker-select').value = "";
        activeDriverId = null;

        // Targeted write to workers list
        db.ref('companies/' + currentCompany + '/workers').set(getCompanyData().workers)
            .then(() => {
                if (worker && worker.email) {
                    const key = worker.email.toLowerCase().replace(/\./g, ',');
                    db.ref(`companies/${currentCompany}/users/${key}`).remove()
                        .catch(err => console.error("Error deleting worker flat email mapping:", err));
                    db.ref(`companies/${currentCompany}/userPermissions/${workerId}`).remove()
                        .catch(err => console.error("Error deleting worker flat permission:", err));
                }
            })
            .catch(err => console.error("Error deleting worker:", err));
    }
}

function setInitialBalance() {
    const workerId = document.getElementById('fin-worker-select').value;
    if (!workerId) { alert("Select an employee first."); return; }

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    let amountText = document.getElementById('initial-balance-amount').value;
    const amount = parseFloat(amountText);
    if (isNaN(amount)) return;

    worker.initialBalance = amount;

    // Targeted write to initialBalance
    db.ref(`companies/${currentCompany}/workers/${workerIndex}/initialBalance`).set(amount)
        .then(() => {
            logActivity('finance', worker.id, worker.name, `Set initial carryover balance of SAR ${amount} for ${worker.name}`);
        })
        .catch(err => console.error("Error setting initial balance:", err));
    alert("Initial Carryover Balance Updated.");
}

function getAveragePerfection(logs) {
    const graded = logs.filter(l => l.noteType !== 'vacation' && l.score !== 'vacation');
    if (graded.length === 0) return 'N/A';
    return Math.round(graded.reduce((sum, log) => sum + parseFloat(log.score), 0) / graded.length) + '%';
}

function updateFinancialRecord(type, action) {
    const workerId = document.getElementById('fin-worker-select').value;
    if (!workerId) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);

    const idMap = { 'costs': 'cost-amount' };
    const inputEl = document.getElementById(idMap[type]);

    if (action === 'add' || action === 'remove') {
        const amount = parseFloat(inputEl.value);
        if (isNaN(amount) || amount <= 0) return;
        if (action === 'add') stats[type] += amount;
        else { stats[type] -= amount; if (stats[type] < 0) stats[type] = 0; }
        inputEl.value = '';
    } else if (action === 'clear' && confirm(`Clear all ${type} for ${worker.name}?`)) { stats[type] = 0; }

    // Targeted write to worker's specific monthly finance record
    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/${type}`).set(stats[type])
        .catch(err => console.error(`Error updating financial record ${type}:`, err));
}

function handleOpsWorkerChange() { renderOpsDetails(); }
function handleFinWorkerChange() { renderFinDetails(); }

function addDailyLog() {
    const workerId = document.getElementById('ops-worker-select').value;
    const startDateStr = document.getElementById('log-date').value;
    const noteType = document.getElementById('log-type').value;
    const note = document.getElementById('log-note').value.trim();

    if (!workerId || !startDateStr) { alert("Select an employee and date."); return; }

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];

    if (noteType === 'vacation') {
        const numDays = parseInt(document.getElementById('vacation-days').value) || 1;
        let startD = new Date(startDateStr);
        for (let i = 0; i < numDays; i++) {
            let d = new Date(startD);
            d.setDate(d.getDate() + i);

            let y = d.getFullYear();
            let m = (d.getMonth() + 1).toString().padStart(2, '0');
            let day = d.getDate().toString().padStart(2, '0');
            let dStr = `${y}-${m}-${day}`;

            let existingLogIndex = worker.logs.findIndex(l => l.date === dStr);
            if (existingLogIndex >= 0) worker.logs[existingLogIndex] = { date: dStr, score: 'vacation', note: note || 'Vacation', noteType: 'vacation' };
            else worker.logs.push({ date: dStr, score: 'vacation', note: note || 'Vacation', noteType: 'vacation' });
        }
    } else {
        const score = noteType === 'good' ? 100 : 2.5;
        let existingLogIndex = worker.logs.findIndex(l => l.date === startDateStr);
        if (existingLogIndex >= 0) worker.logs[existingLogIndex] = { date: startDateStr, score, note, noteType };
        else worker.logs.push({ date: startDateStr, score, note, noteType });
    }

    worker.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    document.getElementById('log-note').value = '';
    document.getElementById('vacation-days').value = '1';

    // Targeted write to worker's logs
    db.ref(`companies/${currentCompany}/workers/${workerIndex}/logs`).set(worker.logs)
        .catch(err => console.error("Error saving daily log:", err));
}

function deleteLog(workerId, logDate) {
    if (confirm(`Delete record for ${logDate}?`)) {
        const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
        if (workerIndex !== -1) {
            const worker = getCompanyData().workers[workerIndex];
            worker.logs = worker.logs.filter(l => l.date !== logDate);

            // Auto-revert logic
            const todayStr = new Date().toISOString().slice(0, 10);
            if (logDate <= todayStr) {
                worker.logs.push({
                    date: logDate,
                    score: 100,
                    note: 'Auto-logged ✅',
                    noteType: 'good'
                });
                worker.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
            }

            // Targeted write to worker's logs
            db.ref(`companies/${currentCompany}/workers/${workerIndex}/logs`).set(worker.logs)
                .catch(err => console.error("Error deleting daily log:", err));
        }
    }
}

// --- ADVERTISEMENT MAP SYSTEM ---
let promoMap = null;
let mapLayerGroup = null;

// Drawing & UI State
let activeAdvertTool = 'pin';
let drawPoints = [];
let tempDrawLayer = null;
let pendingMapItem = null; // Temporarily holds the location data until the modal is saved

function setAdvertTool(tool) {
    activeAdvertTool = tool;
    document.getElementById('tool-pin').className = tool === 'pin' ? 'btn-success' : 'btn-outline';
    document.getElementById('tool-poly').className = tool === 'polygon' ? 'btn-success' : 'btn-outline';

    if (tempDrawLayer && promoMap) promoMap.removeLayer(tempDrawLayer);
    drawPoints = [];
    tempDrawLayer = null;
    document.getElementById('tool-finish').style.display = 'none';
}

// Triggered when user clicks "Finish Area"
function finishPolygonDraw() {
    if (drawPoints.length < 3) return;

    // Store points and open Modal
    pendingMapItem = { type: 'polygon', points: [...drawPoints] };
    document.getElementById('map-item-note').value = '';
    document.getElementById('map-item-modal').style.display = 'flex';
}

// Close Modal without saving
function cancelMapItem() {
    document.getElementById('map-item-modal').style.display = 'none';
    pendingMapItem = null;
    if (activeAdvertTool === 'polygon') {
        setAdvertTool('pin'); // Reset tool state
    }
}

// Triggered when user clicks "Save Marker" inside the custom modal
function saveMapItem() {
    if (!pendingMapItem) return;

    const color = document.querySelector('input[name="pin-color"]:checked').value;
    const note = document.getElementById('map-item-note').value.trim() || "No details provided";

    const newItem = {
        id: Date.now().toString(),
        type: pendingMapItem.type,
        lat: pendingMapItem.lat || null,
        lng: pendingMapItem.lng || null,
        points: pendingMapItem.points || null,
        color: color,
        note: note,
        date: formatTimestamp()
    };

    if (!getCompanyData().adverts) getCompanyData().adverts = [];
    getCompanyData().adverts.push(newItem);
    document.getElementById('map-item-modal').style.display = 'none';
    pendingMapItem = null;
    setAdvertTool('pin'); // Reset back to default

    // Targeted write to adverts
    db.ref('companies/' + currentCompany + '/adverts/' + newItem.id).set(newItem)
        .catch(err => console.error("Error saving map item:", err));
}

function initPromoMap() {
    if (promoMap) return;

    promoMap = L.map('promo-map').setView([26.2144, 50.1971], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(promoMap);

    mapLayerGroup = L.layerGroup().addTo(promoMap);

    promoMap.on('click', function (e) {
        if (!currentUser || currentUser.role !== 'admin') {
            alert("Only administrators can edit the map.");
            return;
        }

        if (activeAdvertTool === 'pin') {
            // Store location and open Modal
            pendingMapItem = { type: 'pin', lat: e.latlng.lat, lng: e.latlng.lng };
            document.getElementById('map-item-note').value = '';
            document.getElementById('map-item-modal').style.display = 'flex';

        } else if (activeAdvertTool === 'polygon') {
            drawPoints.push([e.latlng.lat, e.latlng.lng]);

            if (tempDrawLayer) promoMap.removeLayer(tempDrawLayer);

            if (drawPoints.length < 3) {
                tempDrawLayer = L.polyline(drawPoints, { color: 'var(--primary)', dashArray: '5, 5', weight: 3 }).addTo(promoMap);
            } else {
                tempDrawLayer = L.polygon(drawPoints, { color: 'var(--primary)', fillOpacity: 0.2, weight: 3 }).addTo(promoMap);
                document.getElementById('tool-finish').style.display = 'inline-block';
            }
        }
    });
}

function deleteAdvertPin(id) {
    if (!confirm("Delete this item from the map?")) return;
    getCompanyData().adverts = getCompanyData().adverts.filter(p => p.id !== id);

    // Targeted delete from adverts
    db.ref('companies/' + currentCompany + '/adverts/' + id).remove()
        .catch(err => console.error("Error deleting map item:", err));
}

function renderAdverts() {
    if (currentTab !== 'adverts') return;
    initPromoMap();

    const pins = getCompanyData().adverts || [];
    mapLayerGroup.clearLayers();
    const logList = document.getElementById('adverts-log-list');
    logList.innerHTML = '';

    const colorCodes = {
        'green': '#16a34a',
        'yellow': '#d97706',
        'red': '#dc2626'
    };

    const isAdmin = currentUser && currentUser.role === 'admin';

    if (pins.length === 0) {
        logList.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.9rem; padding: 20px;">No pins or areas dropped yet.</p>`;
    }

    [...pins].reverse().forEach(pin => {
        const hexColor = colorCodes[pin.color] || '#333';
        let mapElement;
        let centerLat, centerLng;

        // Render Polygon Area
        if (pin.type === 'polygon' && pin.points) {
            mapElement = L.polygon(pin.points, {
                color: hexColor,
                fillColor: hexColor,
                fillOpacity: 0.3,
                weight: 2
            }).addTo(mapLayerGroup);

            // Calculate center to place the text
            const bounds = mapElement.getBounds();
            const center = bounds.getCenter();
            centerLat = center.lat;
            centerLng = center.lng;

            // Overlay the note text directly in the middle of the drawn area
            L.marker(center, {
                icon: L.divIcon({
                    className: 'dummy',
                    html: `<div style="color: ${hexColor}; font-weight: 900; font-size: 1rem; text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff; text-align: center; min-width:150px; transform: translate(-50%, -50%); pointer-events:none;">${pin.note}</div>`,
                    iconSize: [0, 0]
                }),
                interactive: false
            }).addTo(mapLayerGroup);

        } else {
            // Render Standard Pin
            mapElement = L.circleMarker([pin.lat, pin.lng], {
                color: hexColor,
                fillColor: hexColor,
                fillOpacity: 0.7,
                radius: 12,
                weight: 2
            }).addTo(mapLayerGroup);
            centerLat = pin.lat;
            centerLng = pin.lng;
        }

        mapElement.bindPopup(`<div style="font-family:'Inter', sans-serif;">
                                    <strong style="color:var(--text-main); font-size:0.9rem;">${pin.date}</strong><br>
                                    <span style="color:var(--text-muted);">${pin.note}</span>
                                  </div>`);

        // Add to Log List
        const div = document.createElement('div');
        div.className = 'ledger-card';
        div.style.borderLeft = `4px solid ${hexColor}`;
        div.style.cursor = 'pointer';
        div.style.marginBottom = '8px';

        let delBtn = isAdmin ? `<button onclick="deleteAdvertPin('${pin.id}'); event.stopPropagation();" class="btn-outline-danger" style="padding:2px 6px; font-size:0.7rem; border:none; text-decoration:underline;">Delete</button>` : '';
        let iconType = pin.type === 'polygon' ? '🖍️ Area' : '📍 Pin';

        div.innerHTML = `
                    <div class="flex-between" style="align-items:start;">
                        <div>
                            <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">${pin.date} <span style="background:var(--bg-color); padding:2px 6px; border-radius:4px; margin-left:6px;">${iconType}</span></div>
                            <div style="font-weight:600; color:var(--text-main); font-size:0.95rem; line-height:1.4;">${pin.note}</div>
                        </div>
                        <div>${delBtn}</div>
                    </div>
                `;

        div.onclick = () => {
            promoMap.flyTo([centerLat, centerLng], 15, { duration: 1.5 });
            setTimeout(() => { mapElement.openPopup(); }, 1500);
        };

        logList.appendChild(div);
    });
}



async function searchMapLocation() {
    const input = document.getElementById('map-search-input');
    const query = input.value.trim();
    if (!query) return;
    try {
        const response = await fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query) + '&limit=1');
        const data = await response.json();
        if (data && data.length > 0) {
            const res = data[0];
            promoMap.flyTo([res.lat, res.lon], 16, { duration: 2 });
        } else {
            alert('Location not found.');
        }
    } catch (err) {
        alert('Search failed.');
    }
}


// --- RENDERING ---
function renderAll() {
    renderBranches();
    renderViolationRules();
    populateWorkerDropdowns();
    renderWarehouse();
    renderManagersList();
    renderWorkerViolationPanel();

    if (currentTab === 'ops') {
        renderOpsWorkersTable();
        renderOpsDetails();
        if (typeof renderSelectedWorkerSysViolations === 'function') {
            renderSelectedWorkerSysViolations();
        }
    }
    else if (currentTab === 'ranks') { renderRanksTable(); }
    else if (currentTab === 'attendance') { renderAttendance(); }
    else if (currentTab === 'tasks') { renderTasks(); }
    else if (currentTab === 'finance') { renderFinanceTable(); renderFinDetails(); renderFinanceSpendArea(); }
    else if (currentTab === 'summary') { renderSummaryTable(); renderLeaderboard(); }
    else if (currentTab === 'drivers') { renderDriversList(); renderDriverPanel(); renderDriverVolumeRewards(); }
    else if (currentTab === 'adverts') { renderAdverts(); }
    else if (currentTab === 'notes') { renderNotes(); }
    else if (currentTab === 'activity') { renderActivityLog(); }
    else if (currentTab === 'managing') { renderManaging(); }
    else if (currentTab === 'costs') { renderCosts(); }
    else if (currentTab === 'reminders') { if (typeof renderReminders === 'function') renderReminders(); }
    else if (currentTab === 'market') { if (typeof renderMarket === 'function') renderMarket(); }

    renderPaymentRequests();
    renderWorkerCustodyRequests();
    renderPendingCustodyRequests();
    renderAcceptedCustodyReleases();
    if (typeof applyUserTabOrder === 'function') {
        applyUserTabOrder();
    }
}


// --- AUTOMATIC IN-SCOPE WINDOW EXPORTS ---
if (typeof selectDriver === 'function') window.selectDriver = selectDriver;
if (typeof toggleDriverPrepTime === 'function') window.toggleDriverPrepTime = toggleDriverPrepTime;
if (typeof startDriverOrder === 'function') window.startDriverOrder = startDriverOrder;
if (typeof pickupDriverOrder === 'function') window.pickupDriverOrder = pickupDriverOrder;
if (typeof forceOrderReady === 'function') window.forceOrderReady = forceOrderReady;
if (typeof finishDriverOrder === 'function') window.finishDriverOrder = finishDriverOrder;
if (typeof deleteDeliveryRecord === 'function') window.deleteDeliveryRecord = deleteDeliveryRecord;
if (typeof deleteLegacyDelivery === 'function') window.deleteLegacyDelivery = deleteLegacyDelivery;
if (typeof updateActiveDriverTimer === 'function') window.updateActiveDriverTimer = updateActiveDriverTimer;
if (typeof calcTime === 'function') window.calcTime = calcTime;
if (typeof renderDriversList === 'function') window.renderDriversList = renderDriversList;
if (typeof promoteToDriver === 'function') window.promoteToDriver = promoteToDriver;
if (typeof demoteFromDriver === 'function') window.demoteFromDriver = demoteFromDriver;
if (typeof updateSelectedDriverProvisions === 'function') window.updateSelectedDriverProvisions = updateSelectedDriverProvisions;
if (typeof renderDriverVolumeRewards === 'function') window.renderDriverVolumeRewards = renderDriverVolumeRewards;
if (typeof addDriverVolumeReward === 'function') window.addDriverVolumeReward = addDriverVolumeReward;
if (typeof deleteDriverVolumeReward === 'function') window.deleteDriverVolumeReward = deleteDriverVolumeReward;
if (typeof renderDriverPanel === 'function') window.renderDriverPanel = renderDriverPanel;
if (typeof addPaymentRecord === 'function') window.addPaymentRecord = addPaymentRecord;
if (typeof deletePaymentRecord === 'function') window.deletePaymentRecord = deletePaymentRecord;
if (typeof addRewardRecord === 'function') window.addRewardRecord = addRewardRecord;
if (typeof deleteRewardRecord === 'function') window.deleteRewardRecord = deleteRewardRecord;
if (typeof addCustodyRecord === 'function') window.addCustodyRecord = addCustodyRecord;
if (typeof deleteCustodyRecord === 'function') window.deleteCustodyRecord = deleteCustodyRecord;
if (typeof addBranch === 'function') window.addBranch = addBranch;
if (typeof deleteBranch === 'function') window.deleteBranch = deleteBranch;
if (typeof addWorker === 'function') window.addWorker = addWorker;
if (typeof deleteWorker === 'function') window.deleteWorker = deleteWorker;
if (typeof setInitialBalance === 'function') window.setInitialBalance = setInitialBalance;
if (typeof getAveragePerfection === 'function') window.getAveragePerfection = getAveragePerfection;
if (typeof updateFinancialRecord === 'function') window.updateFinancialRecord = updateFinancialRecord;
if (typeof handleOpsWorkerChange === 'function') window.handleOpsWorkerChange = handleOpsWorkerChange;
if (typeof handleFinWorkerChange === 'function') window.handleFinWorkerChange = handleFinWorkerChange;
if (typeof addDailyLog === 'function') window.addDailyLog = addDailyLog;
if (typeof deleteLog === 'function') window.deleteLog = deleteLog;
if (typeof setAdvertTool === 'function') window.setAdvertTool = setAdvertTool;
if (typeof finishPolygonDraw === 'function') window.finishPolygonDraw = finishPolygonDraw;
if (typeof cancelMapItem === 'function') window.cancelMapItem = cancelMapItem;
if (typeof saveMapItem === 'function') window.saveMapItem = saveMapItem;
if (typeof initPromoMap === 'function') window.initPromoMap = initPromoMap;
if (typeof deleteAdvertPin === 'function') window.deleteAdvertPin = deleteAdvertPin;
if (typeof renderAdverts === 'function') window.renderAdverts = renderAdverts;
if (typeof searchMapLocation === 'function') window.searchMapLocation = searchMapLocation;
if (typeof renderAll === 'function') window.renderAll = renderAll;
