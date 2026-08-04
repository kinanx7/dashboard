/**
 * Sales tracker, past day sales, deposits, spend orders & Costs tracker
 */

// --- SALES & POS SYSTEM ---
let currentSalesTimeframe = 'day';
let currentSalesChartType = 'bar'; // 'bar' | 'line' | 'doughnut'
let _salesChartInstance = null;  // Chart.js instance handle

function setSalesTimeframe(tf) {
    currentSalesTimeframe = tf;
    ['day', 'week', 'month', 'year', 'custom'].forEach(id => {
        const btn = document.getElementById('tf-' + id);
        if (btn) {
            btn.style.background = (id === tf) ? 'var(--primary)' : 'transparent';
            btn.style.color = (id === tf) ? 'white' : 'var(--text-muted)';
        }
    });

    const datePicker = document.getElementById('sales-date-picker');
    if (datePicker) datePicker.style.display = tf === 'day' ? 'inline-block' : 'none';

    const customRange = document.getElementById('sales-custom-range');
    if (customRange) customRange.style.display = tf === 'custom' ? 'flex' : 'none';

    renderManaging();
}

function setSalesChartType(type) {
    currentSalesChartType = type;
    ['bar', 'line', 'doughnut'].forEach(t => {
        const btn = document.getElementById('sct-' + t);
        if (btn) {
            const active = t === type;
            btn.style.background = active ? 'var(--primary)' : 'transparent';
            btn.style.color = active ? '#fff' : 'var(--text-muted)';
            btn.style.border = active ? 'none' : '1px solid var(--border-color)';
        }
    });
    renderManaging();
}

function addIncomeSource() {
    const source = document.getElementById('new-income-source').value.trim();
    if (source) {
        if (!getCompanyData().incomeSources) getCompanyData().incomeSources = [];
        if (!getCompanyData().incomeSources.includes(source)) {
            getCompanyData().incomeSources.push(source);
            document.getElementById('new-income-source').value = '';

            // Targeted write to incomeSources
            db.ref('companies/' + currentCompany + '/incomeSources').set(getCompanyData().incomeSources)
                .catch(err => console.error("Error adding income source:", err));
        } else {
            alert("This income source already exists.");
        }
    }
}

function deleteIncomeSource(sourceName) {
    if (!confirm(`Delete the income source '${sourceName}'?`)) return;
    getCompanyData().incomeSources = getCompanyData().incomeSources.filter(s => s !== sourceName);

    // Targeted write to incomeSources
    db.ref('companies/' + currentCompany + '/incomeSources').set(getCompanyData().incomeSources)
        .catch(err => console.error("Error deleting income source:", err));
}

function logSaleTransaction() {
    const amountInput = document.getElementById('new-sale-amount');
    const methodInput = document.getElementById('new-sale-method');

    const amount = parseFloat(amountInput.value);
    const method = methodInput.value;

    if (isNaN(amount) || amount <= 0 || !method) {
        alert("Please enter a valid amount and select a payment method.");
        return;
    }

    const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
    const workerId = myWorker ? myWorker.id : "";

    const now = new Date();
    const newLog = {
        id: Date.now().toString(),
        amount: amount,
        method: method,
        date: formatTimestamp(),
        timestamp: now.getTime(),
        month: currentGlobalMonth,
        cashier: currentUser.email,
        workerId: workerId
    };

    if (!getCompanyData().salesLogs) getCompanyData().salesLogs = [];
    getCompanyData().salesLogs.unshift(newLog);

    amountInput.value = '';

    // Targeted write for sales transactions
    db.ref('companies/' + currentCompany + '/salesLogs/' + newLog.id).set(newLog)
        .then(() => {
            logActivity('sales', workerId, myWorker ? myWorker.name : 'System', `Entered sale transaction of SAR ${amount} via ${method}`);
        })
        .catch(error => {
            console.error("Error saving sale:", error);
            alert("Failed to save transaction.");
        });
}

function deleteSaleTransaction(id) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? "هل أنت تأكد من حذف هذا السجل؟" : "Delete this transaction record?")) return;
    const companyData = getCompanyData();
    if (!companyData.salesLogs) companyData.salesLogs = [];
    const oldLog = companyData.salesLogs.find(l => l && l.id === id);
    companyData.salesLogs = companyData.salesLogs.filter(l => l && l.id !== id);

    // Render immediately to update local UI
    renderAll();

    // 1. Remove individual child key if stored as object map
    const p1 = db.ref('companies/' + currentCompany + '/salesLogs/' + id).remove();
    // 2. Overwrite salesLogs array in Firebase to handle array storage format
    const p2 = db.ref('companies/' + currentCompany + '/salesLogs').set(companyData.salesLogs);

    Promise.all([p1, p2])
        .then(() => {
            if (oldLog) {
                logActivity('sales_delete', oldLog.workerId || '', oldLog.cashier || 'System', `Deleted/Undid sale transaction of SAR ${oldLog.amount} via ${oldLog.method}`);
            }
            renderAll();
        })
        .catch(error => {
            console.error("Error deleting sale:", error);
            alert(isAr ? "فشل حذف المعاملة." : "Failed to delete transaction.");
            renderAll();
        });
}

function logPastSaleTransaction() {
    const amount = parseFloat(document.getElementById('past-sale-amount').value);
    const method = document.getElementById('past-sale-method').value;
    const dateStr = document.getElementById('past-sale-date').value;
    const password = document.getElementById('past-sale-password').value;

    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount.'); return;
    }
    if (!method) { alert('Please select a payment method.'); return; }
    if (!dateStr) { alert('Please select a past date.'); return; }
    if (password !== 'N123456') {
        alert('❌ Incorrect password. Access denied.');
        document.getElementById('past-sale-password').value = '';
        return;
    }

    const parts = dateStr.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (d >= today) { alert('Please select a date in the past (not today or future).'); return; }

    const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
    const workerId = myWorker ? myWorker.id : "";

    const targetMonthStr = `${parts[0]}-${parts[1]}`;

    const newLog = {
        id: Date.now().toString(),
        amount: amount,
        method: method,
        date: dateStr + ' ' + '12:00:00',
        timestamp: d.getTime(),
        month: targetMonthStr,
        cashier: currentUser.email,
        isPastEntry: true,
        workerId: workerId
    };

    if (!getCompanyData().salesLogs) getCompanyData().salesLogs = [];
    getCompanyData().salesLogs.unshift(newLog);

    document.getElementById('past-sale-amount').value = '';
    document.getElementById('past-sale-password').value = '';
    document.getElementById('past-sale-date').value = '';

    db.ref('companies/' + currentCompany + '/salesLogs/' + newLog.id).set(newLog)
        .then(() => {
            logActivity('sales', workerId, myWorker ? myWorker.name : 'System', `Entered past sale transaction of SAR ${amount} via ${method} on date ${dateStr}`);
            renderAll();
        })
        .catch(error => {
            console.error("Error saving past sale:", error);
            alert("Failed to save transaction.");
        });
}

function logDepositTransaction() {
    const amountInput = document.getElementById('new-deposit-amount');
    const dateInput = document.getElementById('new-deposit-date');
    if (!amountInput) return;

    const amount = parseFloat(amountInput.value);
    let dateStr = dateInput ? dateInput.value : '';

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid deposit amount.");
        return;
    }

    const now = new Date();
    let timestamp = now.getTime();
    let dateLabel = "";

    const tzOffset = now.getTimezoneOffset() * 60000;
    const todayLocalStr = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);

    if (dateStr && dateStr !== todayLocalStr) {
        const parts = dateStr.split('-');
        const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
        timestamp = d.getTime();
        dateLabel = dateStr + ' 12:00:00';
    } else {
        timestamp = Date.now();
        dateStr = todayLocalStr;
        dateLabel = formatTimestamp();
    }

    const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
    const workerId = myWorker ? myWorker.id : "";

    const newDeposit = {
        id: Date.now().toString(),
        amount: amount,
        date: dateLabel,
        timestamp: timestamp,
        month: currentGlobalMonth,
        cashier: currentUser.email,
        workerId: workerId
    };

    if (!getCompanyData().depositLogs) getCompanyData().depositLogs = [];
    if (getCompanyData().depositLogs && typeof getCompanyData().depositLogs === 'object' && !Array.isArray(getCompanyData().depositLogs)) {
        getCompanyData().depositLogs = Object.values(getCompanyData().depositLogs);
    }
    getCompanyData().depositLogs.unshift(newDeposit);

    amountInput.value = '';
    if (dateInput) dateInput.value = '';

    db.ref('companies/' + currentCompany + '/depositLogs/' + newDeposit.id).set(newDeposit)
        .then(() => {
            logActivity('deposit', workerId, myWorker ? myWorker.name : 'System', `Logged cashier box deposit of SAR ${amount}`);
            renderAll();
        })
        .catch(error => {
            console.error("Error logging deposit:", error);
            alert("Failed to save deposit.");
        });
}

function deleteDepositTransaction(id) {
    if (!confirm("Delete this deposit record?")) return;
    let logs = getCompanyData().depositLogs || [];
    if (logs && typeof logs === 'object' && !Array.isArray(logs)) {
        logs = Object.values(logs);
    }
    const oldLog = logs.find(l => l.id === id);
    getCompanyData().depositLogs = logs.filter(l => l.id !== id);

    db.ref('companies/' + currentCompany + '/depositLogs/' + id).remove()
        .then(() => {
            if (oldLog) {
                logActivity('deposit_delete', oldLog.workerId, oldLog.cashier, `Deleted deposit of SAR ${oldLog.amount}`);
            }
            renderAll();
        })
        .catch(error => {
            console.error("Error deleting deposit:", error);
            alert("Failed to delete deposit.");
        });
}

function showSwapSelect(id) {
    const btn = document.getElementById(`swap-btn-${id}`);
    const select = document.getElementById(`swap-select-${id}`);
    if (btn && select) {
        btn.style.display = 'none';
        select.style.display = 'inline-block';
        select.focus();
    }
}

function cancelSwapSelect(id) {
    const btn = document.getElementById(`swap-btn-${id}`);
    const select = document.getElementById(`swap-select-${id}`);
    if (btn && select) {
        btn.style.display = 'inline-block';
        select.style.display = 'none';
    }
}

function swapSaleMethod(id, newMethod) {
    if (!newMethod) return;
    const companyData = getCompanyData();
    const salesLogs = companyData.salesLogs || [];
    const logVal = salesLogs.find(l => l.id === id);
    if (!logVal) return;

    const oldMethod = logVal.method;
    if (oldMethod === newMethod) {
        cancelSwapSelect(id);
        return;
    }

    db.ref('companies/' + currentCompany + '/salesLogs/' + id).update({
        method: newMethod
    }).then(() => {
        logActivity('sales', logVal.workerId, logVal.cashier, `Swapped payment method of sale transaction (SAR ${logVal.amount}) from ${oldMethod} to ${newMethod}`);
    }).catch(error => {
        console.error("Error swapping sale method:", error);
        alert("Failed to swap method.");
        cancelSwapSelect(id);
    });
}

function toggleSalesMethod(methodName) {
    let disabled = getCompanyData().disabledSalesMethods || [];
    if (disabled.includes(methodName)) {
        disabled = disabled.filter(m => m !== methodName);
    } else {
        disabled.push(methodName);
    }
    getCompanyData().disabledSalesMethods = disabled;

    // Targeted write to disabledSalesMethods
    db.ref('companies/' + currentCompany + '/disabledSalesMethods').set(disabled)
        .catch(err => console.error("Error toggling sales method:", err));
}

function renderManaging() {
    if (currentTab !== 'managing') return;
    populateWorkerDropdowns();

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const todayLocalStr = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);

    const pastSaleDateInput = document.getElementById('past-sale-date');
    if (pastSaleDateInput && !pastSaleDateInput.value) {
        pastSaleDateInput.value = todayLocalStr;
    }
    const newDepositDateInput = document.getElementById('new-deposit-date');
    if (newDepositDateInput && !newDepositDateInput.value) {
        newDepositDateInput.value = todayLocalStr;
    }

    const isAr = currentAppLang === 'ar';
    const isAdmin = currentUser && currentUser.role === 'admin';
    const sources = getCompanyData().incomeSources || ['Cash', 'Credit Card'];
    const allLogs = getCompanyData().salesLogs || [];
    const disabledMethods = getCompanyData().disabledSalesMethods || [];

    // Update Method Dropdown in the form
    const methodSelect = document.getElementById('new-sale-method');
    if (methodSelect) {
        const prevVal = methodSelect.value;
        methodSelect.innerHTML = sources.map(s => `<option value="${s}">${s}</option>`).join('');
        if (sources.includes(prevVal)) methodSelect.value = prevVal;
    }
    const pastMethodSelect = document.getElementById('past-sale-method');
    if (pastMethodSelect) {
        const prevVal = pastMethodSelect.value;
        pastMethodSelect.innerHTML = sources.map(s => `<option value="${s}">${s}</option>`).join('');
        if (sources.includes(prevVal)) pastMethodSelect.value = prevVal;
    }
    const salesSpendMethodSelect = document.getElementById('sales-spend-method');
    if (salesSpendMethodSelect) {
        const prevVal = salesSpendMethodSelect.value;
        salesSpendMethodSelect.innerHTML = sources.map(s => `<option value="${s}">${s}</option>`).join('');
        if (sources.includes(prevVal)) salesSpendMethodSelect.value = prevVal;
    }

    // Update Admin Sources List
    const sourcesListDiv = document.getElementById('admin-income-sources-list');
    if (sourcesListDiv) {
        sourcesListDiv.innerHTML = sources.map(s => `
                    <div style="background: var(--bg-color); border: 1px solid var(--border-color); padding: 6px 14px; border-radius: 20px; font-size: 0.95rem; font-weight:600; display: flex; align-items: center; gap: 10px;">
                        ${s} <button onclick="deleteIncomeSource('${s}')" style="background: var(--danger-bg); border: 1px solid var(--danger-border); border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; color: var(--danger); cursor: pointer; padding: 0;">✖</button>
                    </div>
                `).join('');
    }

    // --- FILTER LOGS BY TIMEFRAME ---
    let filteredLogs = [];
    let histoData = {}; // Key: Label (e.g., "10 AM", "Mon"), Value: Sum

    if (currentSalesTimeframe === 'day') {
        const datePicker = document.getElementById('sales-date-picker');
        if (!datePicker.value) {
            const tzOffset = now.getTimezoneOffset() * 60000;
            datePicker.value = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);
        }
        const parts = datePicker.value.split('-');
        const startOfDay = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
        const endOfDay = startOfDay + 86400000;
        filteredLogs = allLogs.filter(l => l.timestamp >= startOfDay && l.timestamp < endOfDay);
        filteredLogs.forEach(l => {
            if (disabledMethods.includes(l.method)) return;
            const h = new Date(l.timestamp).getHours();
            histoData[h + ':00'] = (histoData[h + ':00'] || 0) + l.amount;
        });
    }
    else if (currentSalesTimeframe === 'week') {
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
        filteredLogs = allLogs.filter(l => l.timestamp >= startOfWeek);
        const days = currentAppLang === 'ar' ?
            ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] :
            ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        filteredLogs.forEach(l => {
            if (disabledMethods.includes(l.method)) return;
            histoData[days[new Date(l.timestamp).getDay()]] = (histoData[days[new Date(l.timestamp).getDay()]] || 0) + l.amount;
        });
    }
    else if (currentSalesTimeframe === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        filteredLogs = allLogs.filter(l => l.timestamp >= startOfMonth);
        filteredLogs.forEach(l => {
            if (disabledMethods.includes(l.method)) return;
            const d = new Date(l.timestamp).getDate().toString();
            histoData[d] = (histoData[d] || 0) + l.amount;
        });
    }
    else if (currentSalesTimeframe === 'year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
        filteredLogs = allLogs.filter(l => l.timestamp >= startOfYear);
        const months = currentAppLang === 'ar' ?
            ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'] :
            ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        filteredLogs.forEach(l => {
            if (disabledMethods.includes(l.method)) return;
            histoData[months[new Date(l.timestamp).getMonth()]] = (histoData[months[new Date(l.timestamp).getMonth()]] || 0) + l.amount;
        });
    }
    else if (currentSalesTimeframe === 'custom') {
        const fromPicker = document.getElementById('sales-from-date');
        const toPicker = document.getElementById('sales-to-date');
        if (!fromPicker.value || !toPicker.value) {
            // Don't render until both dates are set
        } else {
            const fParts = fromPicker.value.split('-');
            const tParts = toPicker.value.split('-');
            const startTs = new Date(fParts[0], fParts[1] - 1, fParts[2]).getTime();
            const endTs = new Date(tParts[0], tParts[1] - 1, tParts[2]).getTime() + 86400000;
            filteredLogs = allLogs.filter(l => l.timestamp >= startTs && l.timestamp < endTs);
            filteredLogs.forEach(l => {
                if (disabledMethods.includes(l.method)) return;
                const d = new Date(l.timestamp);
                const key = String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                histoData[key] = (histoData[key] || 0) + l.amount;
            });
        }
    }

    // Filter Deposits by Timeframe
    let allDeposits = getCompanyData().depositLogs || [];
    if (allDeposits && typeof allDeposits === 'object' && !Array.isArray(allDeposits)) {
        allDeposits = Object.values(allDeposits);
    }
    let filteredDeposits = [];

    if (currentSalesTimeframe === 'day') {
        const datePicker = document.getElementById('sales-date-picker');
        const parts = datePicker.value.split('-');
        const startOfDay = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
        const endOfDay = startOfDay + 86400000;
        filteredDeposits = allDeposits.filter(l => l.timestamp >= startOfDay && l.timestamp < endOfDay);
    }
    else if (currentSalesTimeframe === 'week') {
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
        filteredDeposits = allDeposits.filter(l => l.timestamp >= startOfWeek);
    }
    else if (currentSalesTimeframe === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        filteredDeposits = allDeposits.filter(l => l.timestamp >= startOfMonth);
    }
    else if (currentSalesTimeframe === 'year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
        filteredDeposits = allDeposits.filter(l => l.timestamp >= startOfYear);
    }
    else if (currentSalesTimeframe === 'custom') {
        const fromPicker = document.getElementById('sales-from-date');
        const toPicker = document.getElementById('sales-to-date');
        if (fromPicker.value && toPicker.value) {
            const fParts = fromPicker.value.split('-');
            const tParts = toPicker.value.split('-');
            const startTs = new Date(fParts[0], fParts[1] - 1, fParts[2]).getTime();
            const endTs = new Date(tParts[0], tParts[1] - 1, tParts[2]).getTime() + 86400000;
            filteredDeposits = allDeposits.filter(l => l.timestamp >= startTs && l.timestamp < endTs);
        }
    }

    let totalDeposits = 0;
    filteredDeposits.forEach(d => {
        totalDeposits += d.amount;
    });

    // Filter Spend Logs by Timeframe
    let allSpendLogs = getCompanyData().spendLogs || [];
    let filteredSpends = [];
    if (currentSalesTimeframe === 'day') {
        const datePicker = document.getElementById('sales-date-picker');
        const parts = datePicker.value.split('-');
        const startOfDay = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
        const endOfDay = startOfDay + 86400000;
        filteredSpends = allSpendLogs.filter(l => l && l.timestamp >= startOfDay && l.timestamp < endOfDay);
    }
    else if (currentSalesTimeframe === 'week') {
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
        filteredSpends = allSpendLogs.filter(l => l && l.timestamp >= startOfWeek);
    }
    else if (currentSalesTimeframe === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        filteredSpends = allSpendLogs.filter(l => l && l.timestamp >= startOfMonth);
    }
    else if (currentSalesTimeframe === 'year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
        filteredSpends = allSpendLogs.filter(l => l && l.timestamp >= startOfYear);
    }
    else if (currentSalesTimeframe === 'custom') {
        const fromPicker = document.getElementById('sales-from-date');
        const toPicker = document.getElementById('sales-to-date');
        if (fromPicker && toPicker && fromPicker.value && toPicker.value) {
            const fParts = fromPicker.value.split('-');
            const tParts = toPicker.value.split('-');
            const startTs = new Date(fParts[0], fParts[1] - 1, fParts[2]).getTime();
            const endTs = new Date(tParts[0], tParts[1] - 1, tParts[2]).getTime() + 86400000;
            filteredSpends = allSpendLogs.filter(l => l && l.timestamp >= startTs && l.timestamp < endTs);
        }
    }

    let spendByMethod = {};
    let totalCashSpends = 0;
    filteredSpends.forEach(s => {
        const m = s.method || '';
        spendByMethod[m] = (spendByMethod[m] || 0) + s.amount;
    });

    // Calculate Totals for Toggles
    let grandTotal = 0;
    let methodTotals = {};
    sources.forEach(s => methodTotals[s] = 0);

    filteredLogs.forEach(l => {
        if (methodTotals[l.method] !== undefined) {
            methodTotals[l.method] += l.amount;
        } else {
            methodTotals[l.method] = l.amount;
        }
    });

    const cashKey = Object.keys(methodTotals).find(k => k.toLowerCase() === 'cash' || k === 'نقدي' || k === 'كاش');
    const rawCashSales = cashKey ? methodTotals[cashKey] : 0;
    if (cashKey && spendByMethod[cashKey]) {
        totalCashSpends = spendByMethod[cashKey];
    }

    if (cashKey) {
        methodTotals[cashKey] = rawCashSales - totalDeposits - totalCashSpends;
    }

    // Subtract other method spends
    Object.keys(spendByMethod).forEach(m => {
        if (m !== cashKey && methodTotals[m] !== undefined) {
            methodTotals[m] = methodTotals[m] - spendByMethod[m];
        }
    });

    // Sum up active methods to get grand total
    sources.forEach(s => {
        if (!disabledMethods.includes(s) && methodTotals[s] !== undefined) {
            grandTotal += methodTotals[s];
        }
    });

    // Calculate gross sales (Total Salary)
    let totalSalary = 0;
    filteredLogs.forEach(l => {
        totalSalary += l.amount;
    });

    const totalSalaryEl = document.getElementById('sales-total-salary');
    if (totalSalaryEl) {
        totalSalaryEl.textContent = totalSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    document.getElementById('sales-grand-total').textContent = grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Draw Toggles
    const togglesDiv = document.getElementById('sales-method-toggles');
    if (togglesDiv) {
        togglesDiv.innerHTML = Object.keys(methodTotals).map(methodName => {
            const total = methodTotals[methodName];
            const isCounted = !disabledMethods.includes(methodName);

            const bg = isCounted ? 'var(--success-bg)' : 'var(--danger-bg)';
            const border = isCounted ? 'var(--success-border)' : 'var(--danger-border)';
            const color = isCounted ? 'var(--success)' : 'var(--danger)';
            const icon = isCounted ? '✅' : '❌';

            const isCash = methodName.toLowerCase() === 'cash' || methodName === 'نقدي' || methodName === 'كاش';
            let extraHtml = '';
            if (isCash) {
                extraHtml = `
                    <div style="font-size: 0.78rem; border-top: 1px dashed rgba(255,255,255,0.25); margin-top: 8px; padding-top: 8px; display:flex; flex-direction:column; gap:4px; color:inherit;">
                        <div class="flex-between"><span>${isAr ? 'المبيعات النقدية:' : 'Cash Sales:'}</span> <span>SAR ${rawCashSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div class="flex-between"><span>${isAr ? 'الإيداعات:' : 'Deposited:'}</span> <span>SAR ${totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div class="flex-between"><span>${isAr ? 'المصروفات النقدية:' : 'Spent Out:'}</span> <span style="color:#f87171;">SAR ${totalCashSpends.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div class="flex-between" style="font-weight:800; border-top: 1px solid rgba(255,255,255,0.15); margin-top:2px; padding-top:2px;"><span>${isAr ? 'المتبقي بالصندوق:' : 'Left in Box:'}</span> <span>SAR ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                    </div>
                `;
            }

            return `
                        <div onclick="toggleSalesMethod('${methodName}')" style="cursor: pointer; background: ${bg}; border: 2px solid ${border}; color: ${color}; padding: 12px 20px; border-radius: 12px; text-align: left; min-width: 180px; transition: transform 0.1s; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; margin-bottom: 6px;">${icon} ${methodName}</div>
                            <div style="font-size: 1.25rem; font-weight: 800;">SAR ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            ${extraHtml}
                        </div>
                    `;
        }).join('');
    }

    // === Advanced Chart.js Histogram ===
    (function drawSalesChart() {
        const canvas = document.getElementById('sales-main-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Destroy previous instance to avoid canvas reuse errors
        if (_salesChartInstance) {
            _salesChartInstance.destroy();
            _salesChartInstance = null;
        }

        // Resolve CSS var colours for Chart.js (which can't read CSS vars natively)
        const rootStyle = getComputedStyle(document.documentElement);
        const primaryColor = rootStyle.getPropertyValue('--primary').trim() || '#6366f1';
        const secondaryColor = rootStyle.getPropertyValue('--secondary').trim() || '#f59e0b';
        const textMuted = rootStyle.getPropertyValue('--text-muted').trim() || '#94a3b8';
        const borderColor = rootStyle.getPropertyValue('--border-color').trim() || '#e2e8f0';
        const cardBg = rootStyle.getPropertyValue('--card-bg').trim() || '#ffffff';

        const PALETTE = [
            '#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899',
            '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
        ];

        const summaryDiv = document.getElementById('sales-chart-summary');

        if (currentSalesChartType === 'doughnut') {
            // --- DOUGHNUT: breakdown by payment method ---
            const dLabels = Object.keys(methodTotals).filter(m => methodTotals[m] > 0);
            const dData = dLabels.map(m => methodTotals[m]);
            const dColors = dLabels.map((_, i) => PALETTE[i % PALETTE.length]);

            if (dData.length === 0) {
                canvas.style.display = 'none';
                let overlay = document.getElementById('sales-chart-empty');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'sales-chart-empty';
                    overlay.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:0.9rem;color:' + textMuted + ';';
                    canvas.parentElement.appendChild(overlay);
                }
                overlay.textContent = 'No data for this timeframe.';
                overlay.style.display = 'flex';
                if (summaryDiv) summaryDiv.innerHTML = '';
                return;
            }
            canvas.style.display = '';
            const oldOverlay = document.getElementById('sales-chart-empty');
            if (oldOverlay) oldOverlay.style.display = 'none';

            _salesChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: dLabels,
                    datasets: [{
                        data: dData,
                        backgroundColor: dColors,
                        borderColor: cardBg,
                        borderWidth: 3,
                        hoverOffset: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '62%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: ctx => ` ${ctx.label}: SAR ${ctx.parsed.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            }
                        }
                    }
                }
            });

            // Pill legend
            if (summaryDiv) {
                summaryDiv.innerHTML = dLabels.map((lbl, i) => `
                            <span style="display:inline-flex;align-items:center;gap:5px;font-size:0.78rem;font-weight:700;color:${dColors[i]};background:${dColors[i]}18;padding:3px 10px;border-radius:20px;">
                                <span style="width:8px;height:8px;border-radius:50%;background:${dColors[i]};display:inline-block;"></span>
                                ${lbl}: SAR ${methodTotals[lbl].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>`).join('');
            }

        } else {
            // --- BAR / LINE: time-series ---
            const labels = Object.keys(histoData);
            const values = Object.values(histoData);

            if (labels.length === 0) {
                canvas.style.display = 'none';
                let overlay = document.getElementById('sales-chart-empty');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'sales-chart-empty';
                    overlay.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:0.9rem;color:' + textMuted + ';';
                    canvas.parentElement.appendChild(overlay);
                }
                overlay.textContent = 'No data for this timeframe.';
                overlay.style.display = 'flex';
                if (summaryDiv) summaryDiv.innerHTML = '';
                return;
            }
            canvas.style.display = '';
            const oldOverlay = document.getElementById('sales-chart-empty');
            if (oldOverlay) oldOverlay.style.display = 'none';

            // Gradient fill for bar/line
            const grad = ctx.createLinearGradient(0, 0, 0, 280);
            grad.addColorStop(0, primaryColor + 'cc');
            grad.addColorStop(1, primaryColor + '18');

            const isLine = currentSalesChartType === 'line';
            _salesChartInstance = new Chart(ctx, {
                type: currentSalesChartType,
                data: {
                    labels,
                    datasets: [{
                        label: t('label-sales') + ' (SAR)',
                        data: values,
                        backgroundColor: isLine ? grad : values.map((v, i) => {
                            const max = Math.max(...values, 1);
                            const alpha = Math.round(80 + (v / max) * 130).toString(16).padStart(2, '0');
                            return primaryColor + alpha;
                        }),
                        borderColor: primaryColor,
                        borderWidth: isLine ? 3 : 1.5,
                        borderRadius: isLine ? 0 : 8,
                        borderSkipped: false,
                        fill: isLine,
                        tension: 0.42,
                        pointRadius: isLine ? 5 : 0,
                        pointHoverRadius: isLine ? 8 : 0,
                        pointBackgroundColor: isLine ? primaryColor : undefined,
                        pointBorderColor: isLine ? cardBg : undefined,
                        pointBorderWidth: isLine ? 2 : 0,
                        hoverBackgroundColor: isLine ? primaryColor + 'dd' : secondaryColor + 'cc'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 600, easing: 'easeOutQuart' },
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: {
                                color: textMuted,
                                font: { size: 11, weight: '600', family: 'Inter, sans-serif' },
                                maxRotation: 45
                            },
                            border: { color: borderColor }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: borderColor + '80', drawBorder: false },
                            ticks: {
                                color: textMuted,
                                font: { size: 11, family: 'Inter, sans-serif' },
                                callback: v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v
                            },
                            border: { display: false }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: cardBg,
                            titleColor: textMuted,
                            bodyColor: primaryColor,
                            borderColor: borderColor,
                            borderWidth: 1,
                            padding: 12,
                            cornerRadius: 10,
                            callbacks: {
                                label: ctx => ` SAR ${ctx.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            }
                        }
                    }
                }
            });

            // Quick stats pill row
            if (summaryDiv && values.length > 0) {
                const total = values.reduce((a, b) => a + b, 0);
                const avg = total / values.length;
                const peak = Math.max(...values);
                const peakLabel = labels[values.indexOf(peak)];
                summaryDiv.innerHTML = [
                    { icon: '💰', label: t('label-total'), val: 'SAR ' + total.toLocaleString(undefined, { minimumFractionDigits: 2 }) },
                    { icon: '📈', label: t('label-avg'), val: 'SAR ' + avg.toFixed(2) },
                    { icon: '🏆', label: t('label-peak'), val: `${peakLabel} · SAR ${peak.toLocaleString(undefined, { minimumFractionDigits: 2 })}` }
                ].map(s => `
                            <div style="flex:1; min-width:100px; text-align:center; background:var(--bg-color); border:1px solid var(--border-color); border-radius:10px; padding:8px 12px;">
                                <div style="font-size:1.1rem;">${s.icon}</div>
                                <div style="font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">${s.label}</div>
                                <div style="font-size:0.82rem; font-weight:800; color:var(--primary); margin-top:2px;">${s.val}</div>
                            </div>`).join('');
            }
        }
    })();

    // Draw Recent Transactions Log
    const logDiv = document.getElementById('sales-transaction-log');
    if (logDiv) {
        logDiv.innerHTML = '';
        const combined = [
            ...filteredLogs.map(l => ({ ...l, type: 'sale' })),
            ...filteredDeposits.map(d => ({ ...d, type: 'deposit' })),
            ...filteredSpends.map(s => ({ ...s, type: 'spend' }))
        ].sort((a, b) => b.timestamp - a.timestamp);

        if (combined.length === 0) {
            logDiv.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.95rem; padding: 20px;">${t('msg-no-transactions')}</p>`;
        } else {
            const sources = getCompanyData().incomeSources || ['Cash', 'Credit Card'];
            combined.forEach(item => {
                let isSalesAdmin = isAdmin || document.body.classList.contains('perm-finance') || document.body.classList.contains('perm-sales') || (currentUser && item.cashier && currentUser.email.toLowerCase() === item.cashier.toLowerCase());
                let actionArea = '';

                if (item.type === 'sale') {
                    const isCounted = !disabledMethods.includes(item.method);
                    const opacity = isCounted ? '1' : '0.5';
                    const strike = isCounted ? 'none' : 'line-through';

                    if (isSalesAdmin) {
                        actionArea = `
                            <div style="display:flex; gap:8px; align-items:center;">
                                <button id="swap-btn-${item.id}" onclick="showSwapSelect('${item.id}')" style="background: var(--input-bg); border: 1px solid var(--border-color); border-radius:6px; color: var(--text-main); font-size: 0.9rem; cursor: pointer; padding: 6px 12px; font-weight:bold;" title="${isAr ? 'تبديل طريقة الدفع' : 'Swap payment method'}">
                                    🔄 ${t('btn-swap') || 'Swap'}
                                </button>
                                <select id="swap-select-${item.id}" onchange="swapSaleMethod('${item.id}', this.value)" onblur="cancelSwapSelect('${item.id}')" style="display:none; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main); font-size: 0.9rem; font-weight: bold; cursor: pointer;">
                                    <option value="">${isAr ? 'اختر...' : 'Choose...'}</option>
                                    ${sources.map(s => `<option value="${s}" ${s === item.method ? 'disabled selected' : ''}>${translateDynamicTerm(s)}</option>`).join('')}
                                </select>
                                <button onclick="deleteSaleTransaction('${item.id}')" style="background: var(--danger-bg); border: 1px solid var(--danger-border); border-radius:6px; color: var(--danger); font-size: 0.9rem; cursor: pointer; padding: 6px 12px; font-weight:bold;" title="${t('btn-remove')}">${t('btn-undo-action')}</button>
                            </div>
                        `;
                    }

                    logDiv.innerHTML += `
                        <div class="ledger-card" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; opacity: ${opacity}; margin-bottom: 0;">
                            <div>
                                <div style="font-weight: 800; font-size: 1.25rem; color: var(--text-main); text-decoration: ${strike};">SAR ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 6px; display:flex; gap:8px; align-items:center;">
                                    <span class="badge" style="background: ${isCounted ? 'var(--primary)' : 'var(--text-muted)'}; color: white; padding:2px 8px;">${translateDynamicTerm(item.method)}</span> 
                                    <span>🕒 ${item.date}</span>
                                    <span style="font-style:italic; opacity:0.7;">by ${item.cashier ? item.cashier.split('@')[0] : 'System'}</span>
                                    ${item.isPastEntry ? `<span class="badge" style="background:var(--warning); color:white; padding:2px 8px;">${isAr ? 'سابق' : 'Past'}</span>` : ''}
                                </div>
                            </div>
                            <div>${actionArea}</div>
                        </div>
                    `;
                } else if (item.type === 'deposit') {
                    if (isSalesAdmin) {
                        actionArea = `
                            <button onclick="deleteDepositTransaction('${item.id}')" style="background: var(--danger-bg); border: 1px solid var(--danger-border); border-radius:6px; color: var(--danger); font-size: 0.9rem; cursor: pointer; padding: 6px 12px; font-weight:bold;" title="${t('btn-remove')}">${t('btn-undo-action')}</button>
                        `;
                    }

                    logDiv.innerHTML += `
                        <div class="ledger-card" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; margin-bottom: 0; border-left: 4px solid #f59e0b;">
                            <div>
                                <div style="font-weight: 800; font-size: 1.25rem; color: #f59e0b;">SAR -${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 6px; display:flex; gap:8px; align-items:center;">
                                    <span class="badge" style="background: #f59e0b; color: white; padding:2px 8px;">${isAr ? 'إيداع صندوق الكاش' : 'Cashier Deposit'}</span> 
                                    <span>🕒 ${item.date}</span>
                                    <span style="font-style:italic; opacity:0.7;">by ${item.cashier ? item.cashier.split('@')[0] : 'System'}</span>
                                </div>
                            </div>
                            <div>${actionArea}</div>
                        </div>
                    `;
                } else if (item.type === 'spend') {
                    if (isSalesAdmin) {
                        actionArea = `
                            <button onclick="deleteSpendLog('${item.id}')" style="background: var(--danger-bg); border: 1px solid var(--danger-border); border-radius:6px; color: var(--danger); font-size: 0.9rem; cursor: pointer; padding: 6px 12px; font-weight:bold;" title="${t('btn-remove')}">${t('btn-undo-action')}</button>
                        `;
                    }

                    logDiv.innerHTML += `
                        <div class="ledger-card" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; margin-bottom: 0; border-left: 4px solid var(--danger);">
                            <div>
                                <div style="font-weight: 800; font-size: 1.25rem; color: var(--danger);">SAR -${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 6px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                                    <span class="badge" style="background: var(--danger); color: white; padding:2px 8px;">${isAr ? 'مصروف مباشر' : 'Direct Spend'}</span>
                                    <span class="badge" style="background: var(--input-bg); color: var(--text-main); border: 1px solid var(--border-color); padding:2px 8px;">${translateDynamicTerm(item.method)}</span>
                                    <span>🕒 ${item.date}</span>
                                    <span style="font-style:italic; opacity:0.7;">by ${item.cashier ? item.cashier.split('@')[0] : 'System'}</span>
                                    ${item.note ? `<span style="color:var(--text-main); font-weight:600;">📝 ${item.note}</span>` : ''}
                                </div>
                            </div>
                            <div>${actionArea}</div>
                        </div>
                    `;
                }
            });
        }
    }
    // Refresh pending spend orders panel
    renderSpendOrders();

}

// ============================================================
// --- SPEND ORDER SYSTEM ---
// ============================================================

function logDirectSpendGeneric(amountId, methodId, noteId) {
    const isAr = currentAppLang === 'ar';
    const amount = parseFloat(document.getElementById(amountId).value);
    const method = document.getElementById(methodId).value;
    const note = (document.getElementById(noteId).value || '').trim();

    if (isNaN(amount) || amount <= 0) {
        alert(isAr ? 'الرجاء إدخال مبلغ صحيح.' : 'Please enter a valid amount.');
        return;
    }
    if (!method) {
        alert(isAr ? 'الرجاء اختيار طريقة الدفع.' : 'Please select a payment method.');
        return;
    }
    if (!note) {
        alert(isAr ? 'الرجاء كتابة ملاحظة (سبب الصرف).' : 'Please enter a note (reason for the spend).');
        return;
    }

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localDateStr = new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
    const displayDate = now.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const spendLogId = 'spendlog-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const spendLogObj = {
        id: spendLogId,
        amount: amount,
        method: method,
        note: note,
        date: displayDate,
        timestamp: Date.now(),
        cashier: currentUser ? currentUser.email : 'unknown',
        orderId: 'direct',
        dateStr: localDateStr
    };

    const companyData = getCompanyData();
    if (!companyData.spendLogs) companyData.spendLogs = [];
    companyData.spendLogs.unshift(spendLogObj);

    db.ref(`companies/${currentCompany}/spendLogs`).set(companyData.spendLogs)
        .then(() => {
            logActivity('sales', 'system', 'Direct Spend', `Logged direct spend: SAR ${amount} via ${method} — ${note}`);
            document.getElementById(amountId).value = '';
            document.getElementById(noteId).value = '';
            alert(isAr ? `✅ تم تسجيل المصروف مباشرة بقيمة SAR ${amount} من ${method}.` : `✅ Direct spend logged successfully! SAR ${amount} deducted from ${method}.`);
        })
        .catch(err => {
            console.error('Error logging direct spend:', err);
            alert(isAr ? 'حدث خطأ أثناء تسجيل المصروف.' : 'Error logging direct spend.');
        });
}

function logDirectSpend() {
    logDirectSpendGeneric('finance-spend-amount', 'finance-spend-method', 'finance-spend-note');
}

function logDirectSpendFromSales() {
    logDirectSpendGeneric('sales-spend-amount', 'sales-spend-method', 'sales-spend-note');
}

function renderFinanceSpendArea() {
    const methodSelect = document.getElementById('finance-spend-method');
    if (!methodSelect) return;
    const sources = getCompanyData().incomeSources || ['Cash', 'Credit Card'];
    const prevVal = methodSelect.value;
    methodSelect.innerHTML = sources.map(s => `<option value="${s}">${s}</option>`).join('');
    if (sources.includes(prevVal)) methodSelect.value = prevVal;
}

function submitSpendOrder() {
    const isAr = currentAppLang === 'ar';
    const amount = parseFloat(document.getElementById('finance-spend-amount').value);
    const method = document.getElementById('finance-spend-method').value;
    const note = (document.getElementById('finance-spend-note').value || '').trim();

    if (isNaN(amount) || amount <= 0) {
        alert(isAr ? 'الرجاء إدخال مبلغ صحيح.' : 'Please enter a valid amount.');
        return;
    }
    if (!method) {
        alert(isAr ? 'الرجاء اختيار طريقة الدفع.' : 'Please select a payment method.');
        return;
    }
    if (!note) {
        alert(isAr ? 'الرجاء كتابة ملاحظة (سبب الصرف).' : 'Please enter a note (reason for the spend).');
        return;
    }

    const orderId = 'spend-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localDate = new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const orderObj = {
        id: orderId,
        amount: amount,
        suggestedMethod: method,
        note: note,
        status: 'pending',
        createdBy: currentUser ? currentUser.email : 'unknown',
        createdAt: Date.now(),
        timestamp: Date.now(),
        dateStr: localDate,
        timeStr: timeStr
    };

    const companyData = getCompanyData();
    if (!companyData.spendOrders) companyData.spendOrders = [];
    companyData.spendOrders.unshift(orderObj);

    db.ref(`companies/${currentCompany}/spendOrders`).set(companyData.spendOrders)
        .then(() => {
            logActivity('sales', 'system', 'Spend Requested', `Requested spend order: SAR ${amount} via ${method} — ${note}`);
            document.getElementById('finance-spend-amount').value = '';
            document.getElementById('finance-spend-note').value = '';
            alert(isAr ? `✅ تم إرسال أمر الصرف للكاشير بنجاح بقيمة SAR ${amount}.` : `✅ Spend order submitted! Pending cashier approval.`);
        })
        .catch(err => {
            console.error('Error submitting spend order:', err);
            alert(isAr ? 'حدث خطأ أثناء إرسال أمر الصرف.' : 'Error submitting spend order.');
        });
}

function cancelSpendOrder(orderId) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? 'هل تريد إلغاء أمر الصرف هذا؟' : 'Are you sure you want to cancel this spend order?')) return;

    const companyData = getCompanyData();
    const orders = companyData.spendOrders || [];
    companyData.spendOrders = orders.filter(o => o && o.id !== orderId);

    db.ref(`companies/${currentCompany}/spendOrders`).set(companyData.spendOrders)
        .then(() => {
            logActivity('sales_delete', 'system', 'Spend Cancelled', `Cancelled spend order (ID: ${orderId})`);
        })
        .catch(err => {
            console.error('Error cancelling spend order:', err);
            alert(isAr ? 'حدث خطأ أثناء إلغاء أمر الصرف.' : 'Error cancelling spend order.');
        });
}

function rejectSpendOrder(orderId) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? 'هل تريد رفض أمر الصرف هذا؟' : 'Reject this spend order?')) return;

    const companyData = getCompanyData();
    const orders = companyData.spendOrders || [];
    const orderIndex = orders.findIndex(o => o && o.id === orderId);
    if (orderIndex === -1) return;

    orders[orderIndex].status = 'rejected';

    db.ref(`companies/${currentCompany}/spendOrders`).set(orders)
        .then(() => {
            logActivity('sales_delete', 'system', 'Spend Rejected', `Rejected spend order (ID: ${orderId})`);
        })
        .catch(err => {
            console.error('Error rejecting spend order:', err);
            alert(isAr ? 'حدث خطأ أثناء رفض أمر الصرف.' : 'Error rejecting spend order.');
        });
}

function acceptSpendOrder(orderId) {
    const isAr = currentAppLang === 'ar';
    const methodSelect = document.getElementById('accept-spend-method-' + orderId);
    const paidMethod = methodSelect ? methodSelect.value : null;

    if (!paidMethod) {
        alert(isAr ? 'الرجاء اختيار طريقة الدفع المستخدمة.' : 'Please select the payment method used.');
        return;
    }

    const companyData = getCompanyData();
    const orders = companyData.spendOrders || [];
    const orderIndex = orders.findIndex(o => o && o.id === orderId);
    if (orderIndex === -1) { alert('Order not found.'); return; }

    const order = orders[orderIndex];

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localDateStr = new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
    const displayDate = now.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const spendLogId = 'spendlog-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const spendLogObj = {
        id: spendLogId,
        amount: order.amount,
        method: paidMethod,
        note: order.note,
        date: displayDate,
        timestamp: Date.now(),
        cashier: currentUser ? currentUser.email : 'unknown',
        orderId: orderId,
        dateStr: localDateStr
    };

    order.status = 'accepted';
    order.acceptedBy = currentUser ? currentUser.email : 'unknown';
    order.acceptedAt = Date.now();
    order.paidMethod = paidMethod;

    if (!companyData.spendLogs) companyData.spendLogs = [];
    companyData.spendLogs.unshift(spendLogObj);

    const updates = {};
    updates[`companies/${currentCompany}/spendLogs`] = companyData.spendLogs;
    updates[`companies/${currentCompany}/spendOrders`] = companyData.spendOrders;

    db.ref().update(updates)
        .then(() => {
            logActivity('sales', 'system', 'Spend Accepted', `Spend order accepted: SAR ${order.amount} via ${paidMethod} — ${order.note}`);
            alert(isAr ? `✅ تم قبول أمر الصرف وتسجيل مصروف SAR ${order.amount} من ${paidMethod}.` : `✅ Spend accepted! SAR ${order.amount} deducted from ${paidMethod}.`);
        })
        .catch(err => {
            console.error('Error accepting spend order:', err);
            alert(isAr ? 'حدث خطأ أثناء قبول أمر الصرف.' : 'Error accepting spend order.');
        });
}

function deleteSpendLog(logId) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? 'هل تريد حذف هذا المصروف من السجل؟' : 'Delete this spend entry from the log?')) return;

    const companyData = getCompanyData();
    const logs = companyData.spendLogs || [];
    const oldLog = logs.find(l => l.id === logId);
    if (!oldLog) return;

    companyData.spendLogs = logs.filter(l => l.id !== logId);

    db.ref(`companies/${currentCompany}/spendLogs`).set(companyData.spendLogs)
        .then(() => {
            logActivity('sales_delete', 'system', 'Spend Log', `Deleted direct spend of SAR ${oldLog.amount} via ${oldLog.method} — ${oldLog.note}`);
        })
        .catch(err => {
            console.error('Error deleting spend log:', err);
            alert(isAr ? 'حدث خطأ أثناء حذف المصروف.' : 'Error deleting spend log.');
        });
}


function renderSpendOrders() {
    const isAr = currentAppLang === 'ar';
    const container = document.getElementById('pending-spend-orders-list');
    if (!container) return;

    const isAdmin = currentUser && currentUser.role === 'admin';
    const isSalesUser = isAdmin || document.body.classList.contains('perm-sales');
    const isFinUser = isAdmin || document.body.classList.contains('perm-finance');
    const sources = getCompanyData().incomeSources || ['Cash', 'Credit Card'];
    const allOrders = getCompanyData().spendOrders || {};

    const pendingOrders = Object.values(allOrders)
        .filter(o => o && o.status === 'pending')
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (pendingOrders.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.9rem; padding:16px;">${isAr ? 'لا توجد أوامر صرف معلقة.' : 'No pending spend orders.'}</p>`;
        return;
    }

    container.innerHTML = pendingOrders.map(order => {
        const methodOptions = sources.map(s => `<option value="${s}"${s === order.suggestedMethod ? ' selected' : ''}>${s}</option>`).join('');
        const canCancel = isFinUser && order.createdBy && currentUser && (isAdmin || order.createdBy.toLowerCase() === currentUser.email.toLowerCase());

        return `
            <div style="background:var(--card-bg); border:1px solid var(--border-color); border-left: 4px solid var(--danger); border-radius:10px; padding:14px 16px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;">
                    <div>
                        <div style="font-size:1.15rem; font-weight:800; color:var(--danger);">SAR ${order.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div style="font-size:0.82rem; color:var(--text-muted); margin-top:4px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                            <span class="badge" style="background:var(--input-bg); color:var(--text-main); border: 1px solid var(--border-color);">${translateDynamicTerm(order.suggestedMethod)}</span>
                            <span>📝 ${order.note}</span>
                        </div>
                        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
                            ${isAr ? 'طلب بواسطة:' : 'By:'} ${order.createdBy ? order.createdBy.split('@')[0] : '?'} · ${order.timeStr || ''} ${order.dateStr || ''}
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
                        ${isSalesUser ? `
                            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                                <select id="accept-spend-method-${order.id}" style="padding:6px 10px; border-radius:6px; border:1px solid var(--border-color); background:var(--input-bg); color:var(--text-main); font-size:0.85rem; font-weight:600;">${methodOptions}</select>
                                <button onclick="acceptSpendOrder('${order.id}')" style="background:var(--success-bg); border:1px solid var(--success-border); color:var(--success); border-radius:6px; padding:7px 14px; font-weight:800; font-size:0.85rem; cursor:pointer;">✅ ${isAr ? 'قبول' : 'Accept'}</button>
                                <button onclick="rejectSpendOrder('${order.id}')" style="background:var(--danger-bg); border:1px solid var(--danger-border); color:var(--danger); border-radius:6px; padding:7px 14px; font-weight:800; font-size:0.85rem; cursor:pointer;">❌ ${isAr ? 'رفض' : 'Reject'}</button>
                            </div>
                        ` : ''}
                        ${canCancel ? `<button onclick="cancelSpendOrder('${order.id}')" style="background:transparent; border:none; color:var(--text-muted); font-size:0.75rem; cursor:pointer; text-decoration:underline;">${isAr ? 'إلغاء الأمر' : 'Cancel Order'}</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- COSTS DEPARTMENT SYSTEM ---

let currentCostsTimeframe = 'day';

function setCostsTimeframe(tf) {
    currentCostsTimeframe = tf;
    ['day', 'week', 'month', 'year', 'custom'].forEach(id => {
        const btn = document.getElementById('cost-tf-' + id);
        if (btn) {
            if (id === tf) {
                btn.style.background = 'var(--primary)';
                btn.style.color = 'white';
            } else {
                btn.style.background = 'transparent';
                btn.style.color = 'var(--text-muted)';
            }
        }
    });

    const datePicker = document.getElementById('costs-date-picker');
    if (datePicker) datePicker.style.display = tf === 'day' ? 'inline-block' : 'none';

    const customRange = document.getElementById('costs-custom-range');
    if (customRange) customRange.style.display = tf === 'custom' ? 'flex' : 'none';

    renderCosts();
}

function addCostCategory() {
    const nameInput = document.getElementById('new-cost-category');
    const name = nameInput.value.trim();
    if (!name) return;
    if (!getCompanyData().costCategories) getCompanyData().costCategories = [];
    if (!getCompanyData().costCategories.includes(name)) {
        getCompanyData().costCategories.push(name);
        nameInput.value = '';

        // Targeted write to costCategories
        db.ref('companies/' + currentCompany + '/costCategories').set(getCompanyData().costCategories)
            .catch(err => console.error("Error adding cost category:", err));
        renderCosts();
    } else {
        alert("This cost category already exists.");
    }
}

function deleteCostCategory(name) {
    if (!confirm(`Delete cost category '${name}'?\n\n(This hides it from the dropdown but doesn't delete old logs).`)) return;
    getCompanyData().costCategories = getCompanyData().costCategories.filter(c => c !== name);

    // Targeted write to costCategories
    db.ref('companies/' + currentCompany + '/costCategories').set(getCompanyData().costCategories)
        .catch(err => console.error("Error deleting cost category:", err));
    renderCosts();
}

function logCostTransaction() {
    const amountInput = document.getElementById('new-cost-amount');
    const methodInput = document.getElementById('new-cost-category-select');

    const amount = parseFloat(amountInput.value);
    const method = methodInput.value;

    if (isNaN(amount) || amount <= 0 || !method) {
        alert("Please enter a valid amount and select a cost category.");
        return;
    }

    const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
    const workerId = myWorker ? myWorker.id : "";

    const now = new Date();
    const newLog = {
        id: Date.now().toString(),
        amount: amount,
        method: method,
        date: formatTimestamp(),
        timestamp: now.getTime(),
        month: currentGlobalMonth,
        cashier: currentUser.email,
        workerId: workerId
    };

    if (!getCompanyData().costLogs) getCompanyData().costLogs = [];
    getCompanyData().costLogs.unshift(newLog);

    amountInput.value = '';

    // Targeted write to costLogs
    db.ref('companies/' + currentCompany + '/costLogs/' + newLog.id).set(newLog)
        .then(() => {
            logActivity('costs', workerId, myWorker ? myWorker.name : 'System', `Entered cost transaction of SAR ${amount} for category "${method}"`);
        })
        .catch(error => {
            console.error("Error saving cost:", error);
            alert("Failed to save cost transaction.");
        });
    renderCosts();
}

function deleteCostTransaction(id) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? "هل أنت تأكد من حذف هذا السجل؟" : "Delete this cost record?")) return;
    const companyData = getCompanyData();
    if (!companyData.costLogs) companyData.costLogs = [];
    const oldLog = companyData.costLogs.find(l => l && l.id === id);
    companyData.costLogs = companyData.costLogs.filter(l => l && l.id !== id);

    renderAll();

    const p1 = db.ref('companies/' + currentCompany + '/costLogs/' + id).remove();
    const p2 = db.ref('companies/' + currentCompany + '/costLogs').set(companyData.costLogs);

    Promise.all([p1, p2])
        .then(() => {
            if (oldLog) {
                logActivity('costs_delete', oldLog.workerId || '', oldLog.cashier || 'System', `Deleted/Undid cost transaction of SAR ${oldLog.amount} for category "${oldLog.method}"`);
            }
            renderAll();
        })
        .catch(error => {
            console.error("Error deleting cost:", error);
            alert(isAr ? "فشل حذف التكلفة." : "Failed to delete cost transaction.");
            renderAll();
        });
}

// Log past costs
function logPastCostTransaction() {
    const amount = parseFloat(document.getElementById('past-cost-amount').value);
    const category = document.getElementById('past-cost-category').value;
    const dateStr = document.getElementById('past-cost-date').value;
    const password = document.getElementById('past-cost-password').value;

    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount.'); return;
    }
    if (!category) { alert('Please select a category.'); return; }
    if (!dateStr) { alert('Please select a past date.'); return; }
    if (password !== 'N123456') {
        alert('❌ Incorrect password. Access denied.');
        document.getElementById('past-cost-password').value = '';
        return;
    }

    const parts = dateStr.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (d >= today) { alert('Please select a date in the past (not today or future).'); return; }

    const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
    const workerId = myWorker ? myWorker.id : "";

    const timestamp = d.getTime() + (12 * 3600000); // noon of that day
    const newLog = {
        id: Date.now().toString(),
        amount: amount,
        method: category,
        date: dateStr + ' (past entry)',
        timestamp: timestamp,
        month: dateStr.slice(0, 7),
        cashier: currentUser.email,
        isPastEntry: true,
        workerId: workerId
    };

    if (!getCompanyData().costLogs) getCompanyData().costLogs = [];
    getCompanyData().costLogs.unshift(newLog);

    document.getElementById('past-cost-amount').value = '';
    document.getElementById('past-cost-password').value = '';
    document.getElementById('past-cost-date').value = '';

    // Targeted write to costLogs
    db.ref('companies/' + currentCompany + '/costLogs/' + newLog.id).set(newLog)
        .then(() => {
            logActivity('costs', workerId, myWorker ? myWorker.name : 'System', `Entered past cost transaction of SAR ${amount} for category "${category}" on date ${dateStr}`);
        })
        .catch(error => {
            console.error("Error saving past cost:", error);
            alert("Failed to save past cost transaction.");
        });
    renderCosts();
    alert(`✅ Past cost of SAR ${amount} for '${category}' on ${dateStr} has been logged!`);
}

function renderCosts() {
    if (currentTab !== 'costs') return;

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const todayLocalStr = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);

    const pastCostDateInput = document.getElementById('past-cost-date');
    if (pastCostDateInput && !pastCostDateInput.value) {
        pastCostDateInput.value = todayLocalStr;
    }

    const isAdmin = currentUser && currentUser.role === 'admin';

    // Setup categories dropdowns (both current and past entry)
    const categories = getCompanyData().costCategories || ['Electric Bill', 'Meat Supplier', 'Packaging'];
    const methodSelect = document.getElementById('new-cost-category-select');
    if (methodSelect) {
        const prevVal = methodSelect.value;
        methodSelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
        if (categories.includes(prevVal)) methodSelect.value = prevVal;
    }
    const pastCatSelect = document.getElementById('past-cost-category');
    if (pastCatSelect) {
        const pv = pastCatSelect.value;
        pastCatSelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
        if (categories.includes(pv)) pastCatSelect.value = pv;
    }

    // Render Admin categories list
    const adminListDiv = document.getElementById('admin-cost-categories-list');
    if (adminListDiv) {
        adminListDiv.innerHTML = categories.map(c => `
                    <div style="background: var(--bg-color); border: 1px solid var(--border-color); padding: 6px 14px; border-radius: 20px; font-size: 0.95rem; font-weight:600; display: flex; align-items: center; gap: 10px;">
                        ${c} <button onclick="deleteCostCategory('${c}')" style="background: var(--danger-bg); border: 1px solid var(--danger-border); border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; color: var(--danger); cursor: pointer; padding: 0;">✖</button>
                    </div>
                `).join('');
    }

    // Fetch and Filter Both Data Streams
    const allSales = getCompanyData().salesLogs || [];
    const allCosts = getCompanyData().costLogs || [];
    const disabledSalesMethods = getCompanyData().disabledSalesMethods || [];

    let filteredSales = [];
    let filteredCosts = [];
    let labelText = '';

    if (currentCostsTimeframe === 'day') {
        const datePicker = document.getElementById('costs-date-picker');
        if (!datePicker.value) {
            const tzOffset = now.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);
            datePicker.value = localISOTime;
        }
        const parts = datePicker.value.split('-');
        const startOfDay = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
        const endOfDay = startOfDay + 86400000;
        filteredSales = allSales.filter(l => l.timestamp >= startOfDay && l.timestamp < endOfDay);
        filteredCosts = allCosts.filter(l => l.timestamp >= startOfDay && l.timestamp < endOfDay);
        labelText = datePicker.value;
    }
    else if (currentCostsTimeframe === 'week') {
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
        filteredSales = allSales.filter(l => l.timestamp >= startOfWeek);
        filteredCosts = allCosts.filter(l => l.timestamp >= startOfWeek);
        labelText = t('label-past-7-days');
    }
    else if (currentCostsTimeframe === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        filteredSales = allSales.filter(l => l.timestamp >= startOfMonth);
        filteredCosts = allCosts.filter(l => l.timestamp >= startOfMonth);
        labelText = t('label-this-month');
    }
    else if (currentCostsTimeframe === 'year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
        filteredSales = allSales.filter(l => l.timestamp >= startOfYear);
        filteredCosts = allCosts.filter(l => l.timestamp >= startOfYear);
        labelText = t('label-this-year');
    }
    else if (currentCostsTimeframe === 'custom') {
        const fromPicker = document.getElementById('costs-from-date');
        const toPicker = document.getElementById('costs-to-date');
        if (fromPicker.value && toPicker.value) {
            const fParts = fromPicker.value.split('-');
            const tParts = toPicker.value.split('-');
            const startTs = new Date(fParts[0], fParts[1] - 1, fParts[2]).getTime();
            const endTs = new Date(tParts[0], tParts[1] - 1, tParts[2]).getTime() + 86400000;
            filteredSales = allSales.filter(l => l.timestamp >= startTs && l.timestamp < endTs);
            filteredCosts = allCosts.filter(l => l.timestamp >= startTs && l.timestamp < endTs);
            labelText = fromPicker.value + ' → ' + toPicker.value;
        }
    }

    document.getElementById('pl-timeframe-label').textContent = labelText;

    // Calculate Totals
    let totalSales = 0;
    filteredSales.forEach(l => {
        if (!disabledSalesMethods.includes(l.method)) totalSales += l.amount;
    });

    let totalCosts = 0;
    filteredCosts.forEach(l => { totalCosts += l.amount; });

    const netProfit = totalSales - totalCosts;
    const isProfit = netProfit >= 0;
    const profitSign = netProfit > 0 ? '+' : netProfit < 0 ? '-' : '';

    // Update P&L HUD
    const netProfitDiv = document.getElementById('pl-net-profit');
    if (netProfitDiv) {
        netProfitDiv.textContent = profitSign + 'SAR ' + Math.abs(netProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        netProfitDiv.style.color = isProfit ? 'var(--success)' : (netProfit < 0 ? 'var(--danger)' : 'var(--text-muted)');
    }

    const statusDiv = document.getElementById('pl-status-message');
    if (statusDiv) {
        if (netProfit > 0) { statusDiv.textContent = t('status-healthy-profit'); statusDiv.style.color = 'var(--success)'; }
        else if (netProfit < 0) { statusDiv.textContent = t('status-operating-loss'); statusDiv.style.color = 'var(--danger)'; }
        else { statusDiv.textContent = t('status-breaking-even'); statusDiv.style.color = 'var(--text-muted)'; }
    }

    const grossSalesEl = document.getElementById('pl-gross-sales');
    const grossCostsEl = document.getElementById('pl-gross-costs');
    if (grossSalesEl) grossSalesEl.textContent = 'SAR ' + totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 });
    if (grossCostsEl) grossCostsEl.textContent = 'SAR ' + totalCosts.toLocaleString(undefined, { minimumFractionDigits: 2 });


    // Update tx count HUD
    const txCountEl = document.getElementById('pl-tx-count');
    if (txCountEl) txCountEl.textContent = (filteredSales.length + filteredCosts.length).toString();

    // Build grouped comparative histogram data
    const histoMap = {}; // key → { sales: 0, costs: 0 }
    function getLocalKey(ts, mode) {
        const d = new Date(ts);
        if (mode === 'hour') return String(d.getHours()).padStart(2, '0') + ':00';
        if (mode === 'month') {
            const months = currentAppLang === 'ar' ?
                ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'] :
                ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return months[d.getMonth()];
        }
        return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    const groupMode = currentCostsTimeframe === 'day' ? 'hour' : currentCostsTimeframe === 'year' ? 'month' : 'date';

    filteredSales.forEach(l => {
        if (disabledSalesMethods.includes(l.method)) return;
        const k = getLocalKey(l.timestamp, groupMode);
        if (!histoMap[k]) histoMap[k] = { sales: 0, costs: 0 };
        histoMap[k].sales += l.amount;
    });
    filteredCosts.forEach(l => {
        const k = getLocalKey(l.timestamp, groupMode);
        if (!histoMap[k]) histoMap[k] = { sales: 0, costs: 0 };
        histoMap[k].costs += l.amount;
    });

    const histoDiv = document.getElementById('pl-comparative-histogram');
    const labelsDiv = document.getElementById('pl-histogram-labels');
    if (histoDiv) {
        histoDiv.innerHTML = '';
        if (labelsDiv) labelsDiv.innerHTML = '';
        const labels = Object.keys(histoMap).sort();

        if (labels.length === 0) {
            histoDiv.innerHTML = `<div style="width:100%; text-align:center; color:var(--text-muted); padding-top:100px; font-size:0.95rem;">${t('msg-no-data-timeframe')}</div>`;
        } else {
            const allVals = labels.flatMap(k => [histoMap[k].sales, histoMap[k].costs]).filter(v => v > 0);
            const maxV = allVals.length > 0 ? Math.max(...allVals) : 1;
            const CHART_H = 240; // usable bar area in px

            labels.forEach(label => {
                const sVal = histoMap[label].sales || 0;
                const cVal = histoMap[label].costs || 0;
                // Strictly proportional — a bar of maxV fills CHART_H, zero = 0px
                const sPx = sVal > 0 ? Math.max(1, Math.round((sVal / maxV) * CHART_H)) : 0;
                const cPx = cVal > 0 ? Math.max(1, Math.round((cVal / maxV) * CHART_H)) : 0;
                const fmt = v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0);

                // Structure: outer column (flex col, align-items:flex-end, height=CHART_H px)
                // label row floats above; bars sit at the bottom baseline
                histoDiv.innerHTML += `
                            <div title="${label}&#10;${t('label-sales')}: SAR ${sVal.toLocaleString()}&#10;${t('label-costs')}: SAR ${cVal.toLocaleString()}"
                                 style="flex:1; min-width:24px; max-width:55px; display:flex; flex-direction:column; align-items:center; height:${CHART_H}px; justify-content:flex-end; cursor:default; position:relative;">
                                <!-- value labels pinned at top of each bar -->
                                <div style="position:absolute; bottom:${sPx}px; left:0; right:50%; text-align:center; font-size:0.5rem; color:#059669; font-weight:800; white-space:nowrap; line-height:1; padding-bottom:1px;">${sVal > 0 ? fmt(sVal) : ''}</div>
                                <div style="position:absolute; bottom:${cPx}px; left:50%; right:0; text-align:center; font-size:0.5rem; color:#dc2626; font-weight:800; white-space:nowrap; line-height:1; padding-bottom:1px;">${cVal > 0 ? fmt(cVal) : ''}</div>
                                <!-- bars side by side, growing from baseline -->
                                <div style="display:flex; align-items:flex-end; gap:2px; width:100%; height:${CHART_H}px;">
                                    <div style="flex:1; height:${sPx}px; background:linear-gradient(180deg,#34d399,#059669); border-radius:3px 3px 0 0; box-shadow:0 -2px 6px rgba(16,185,129,0.35); transition:height 0.5s ease;"></div>
                                    <div style="flex:1; height:${cPx}px; background:linear-gradient(180deg,#f87171,#dc2626); border-radius:3px 3px 0 0; box-shadow:0 -2px 6px rgba(239,68,68,0.35); transition:height 0.5s ease;"></div>
                                </div>
                            </div>
                        `;
                if (labelsDiv) {
                    labelsDiv.innerHTML += `<div style="flex:1; min-width:24px; max-width:55px; text-align:center; font-size:0.6rem; color:var(--text-muted); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${label}</div>`;
                }
            });
        }
    }


    // Build source summary (grouped by category for comparison)
    const logDiv = document.getElementById('costs-transaction-log');
    if (logDiv) {
        logDiv.innerHTML = '';
        if (filteredCosts.length === 0) {
            logDiv.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.95rem; padding: 20px;">${t('msg-no-costs')}</p>`;
        } else {
            // Group totals by source/category for the summary table
            const sourceMap = {};
            filteredCosts.forEach(l => {
                if (!sourceMap[l.method]) sourceMap[l.method] = 0;
                sourceMap[l.method] += l.amount;
            });

            // Render grouped summary at the top
            const sourcesHtml = Object.entries(sourceMap).map(([src, total]) => `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px 16px; background: var(--bg-color); border-radius: 10px; border: 1px solid var(--border-color);">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div style="width:8px; height:8px; background:var(--danger); border-radius:50%;"></div>
                                <span style="font-weight:700; font-size:0.95rem; color:var(--text-main);">${src}</span>
                            </div>
                            <span style="font-weight:800; font-size:1.05rem; color:var(--danger);">SAR ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    `).join('');

            logDiv.innerHTML = `
                        <div style="background:var(--input-bg); border:1px solid var(--border-color); border-radius:12px; padding:14px; margin-bottom:16px;">
                            <div style="font-size:0.8rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:10px;">📊 ${t('title-summary-source')}</div>
                            <div style="display:flex; flex-direction:column; gap:6px;">${sourcesHtml}</div>
                            <div style="border-top:1px dashed var(--border-color); margin-top:12px; padding-top:10px; display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:0.9rem; font-weight:700; color:var(--text-muted);">${t('label-gross-costs')}</span>
                                <span style="font-size:1.2rem; font-weight:800; color:var(--danger);">SAR ${totalCosts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                        <div style="font-size:0.8rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; padding-left:4px;">📋 ${t('title-all-transactions')}</div>
                    `;

            // Render individual transaction entries
            filteredCosts.forEach(l => {
                let isCostsAdmin = isAdmin || document.body.classList.contains('perm-finance') || document.body.classList.contains('perm-costs');
                let delBtn = isCostsAdmin ? `<button onclick="deleteCostTransaction('${l.id}')" style="background: var(--danger-bg); border: 1px solid var(--danger-border); border-radius:6px; color: var(--danger); font-size: 0.9rem; cursor: pointer; padding: 6px 12px; font-weight:bold;" title="${t('btn-remove')}">${t('btn-undo-action')}</button>` : '';

                logDiv.innerHTML += `
                            <div class="ledger-card" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; margin-bottom: 0;">
                                <div>
                                    <div style="font-weight: 800; font-size: 1.15rem; color: var(--danger);">SAR ${l.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 6px; display:flex; gap:8px; align-items:center;">
                                        <span class="badge" style="background: var(--danger); color: white; padding:2px 8px;">${translateDynamicTerm(l.method)}</span> 
                                        <span>🕒 ${l.date}</span>
                                        <span style="font-style:italic; opacity:0.7;">by ${l.cashier ? l.cashier.split('@')[0] : 'System'}</span>
                                    </div>
                                </div>
                                <div>${delBtn}</div>
                            </div>
                        `;
            });
        }
    }
}

function exportCostsPDF() {
    const cd = getCompanyData();
    const allSales = cd.salesLogs || [];
    const allCosts = cd.costLogs || [];
    const disabledSalesMethods = cd.disabledSalesMethods || [];
    const now = new Date();

    // Re-compute filtered data using current timeframe state
    let filteredSales = [], filteredCosts = [], labelText = '';
    if (currentCostsTimeframe === 'day') {
        const dp = document.getElementById('costs-date-picker');
        const parts = (dp && dp.value ? dp.value : now.toISOString().slice(0, 10)).split('-');
        const s = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
        filteredSales = allSales.filter(l => l.timestamp >= s && l.timestamp < s + 86400000);
        filteredCosts = allCosts.filter(l => l.timestamp >= s && l.timestamp < s + 86400000);
        labelText = dp ? dp.value : now.toISOString().slice(0, 10);
    } else if (currentCostsTimeframe === 'week') {
        const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
        filteredSales = allSales.filter(l => l.timestamp >= s);
        filteredCosts = allCosts.filter(l => l.timestamp >= s);
        labelText = t('label-past-7-days');
    } else if (currentCostsTimeframe === 'month') {
        const s = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        filteredSales = allSales.filter(l => l.timestamp >= s);
        filteredCosts = allCosts.filter(l => l.timestamp >= s);
        labelText = t('label-this-month');
    } else if (currentCostsTimeframe === 'year') {
        const s = new Date(now.getFullYear(), 0, 1).getTime();
        filteredSales = allSales.filter(l => l.timestamp >= s);
        filteredCosts = allCosts.filter(l => l.timestamp >= s);
        labelText = t('label-this-year');
    } else if (currentCostsTimeframe === 'custom') {
        const fp = document.getElementById('costs-from-date');
        const tp = document.getElementById('costs-to-date');
        if (fp && tp && fp.value && tp.value) {
            const fP = fp.value.split('-'), tP = tp.value.split('-');
            const s = new Date(fP[0], fP[1] - 1, fP[2]).getTime();
            const e = new Date(tP[0], tP[1] - 1, tP[2]).getTime() + 86400000;
            filteredSales = allSales.filter(l => l.timestamp >= s && l.timestamp < e);
            filteredCosts = allCosts.filter(l => l.timestamp >= s && l.timestamp < e);
            labelText = fp.value + ' → ' + tp.value;
        }
    }

    let totalSales = 0;
    filteredSales.forEach(l => { if (!disabledSalesMethods.includes(l.method)) totalSales += l.amount; });
    let totalCosts = 0;
    filteredCosts.forEach(l => { totalCosts += l.amount; });
    const netProfit = totalSales - totalCosts;
    const profitSign = netProfit > 0 ? '+' : '';

    // Source breakdown
    const sourceMap = {};
    filteredCosts.forEach(l => { sourceMap[l.method] = (sourceMap[l.method] || 0) + l.amount; });
    const isAr = currentAppLang === 'ar';
    const sourceRows = Object.entries(sourceMap)
        .sort((a, b) => b[1] - a[1])
        .map(([src, total]) => `<tr><td>${src}</td><td style="text-align:${isAr ? 'left' : 'right'}; font-weight:700;">SAR ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td style="text-align:${isAr ? 'left' : 'right'};">${totalCosts > 0 ? ((total / totalCosts) * 100).toFixed(1) + '%' : '—'}</td></tr>`).join('');

    // Transaction rows
    const txRows = filteredCosts.map(l => `
                <tr>
                    <td>${l.date || '—'}</td>
                    <td>${l.method}</td>
                    <td style="text-align:${isAr ? 'left' : 'right'}; font-weight:700; color:#dc2626;">SAR ${l.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>${l.cashier ? l.cashier.split('@')[0] : 'System'}${l.isPastEntry ? ' <em style="color:#f59e0b;">(past)</em>' : ''}</td>
                </tr>`).join('');

    const reportTitle = isAr ? 'تقرير التكاليف والأرباح والخسائر' : 'Cost & P&L Report';
    let companyLabel = 'Burgeroov';
    if (currentCompany === 'mvc') companyLabel = 'MVC FRESH';
    else if (currentCompany === 'mvcfresh') companyLabel = 'MVC Fresh';
    const periodLabel = isAr ? 'الفترة' : 'Period';
    const generatedLabel = isAr ? 'تاريخ الإنشاء' : 'Generated';
    const netProfitLabel = t('label-net-profit');
    const grossSalesLabel = t('label-gross-sales');
    const grossCostsLabel = t('label-gross-costs');
    const transactionsLabel = t('label-transactions');
    const sourceBreakdownLabel = isAr ? 'تحليل التكاليف حسب الفئة' : 'Cost Breakdown by Source';
    const colSourceCategory = isAr ? 'الفئة / المصدر' : 'Source / Category';
    const colTotalSar = isAr ? 'الإجمالي (ريال)' : 'Total (SAR)';
    const colPctTotal = isAr ? '٪ من إجمالي التكاليف' : '% of Total Costs';
    const labelTotal = t('label-total');
    const titleAllTx = t('title-all-transactions');
    const colDate = isAr ? 'التاريخ' : 'Date';
    const colCategory = isAr ? 'الفئة' : 'Category';
    const colAmount = isAr ? 'المبلغ' : 'Amount';
    const colLoggedBy = isAr ? 'بواسطة' : 'Logged By';
    const noCostRecordsMsg = t('msg-no-costs');
    const noTxMsg = t('msg-no-transactions');
    const footerMsg = isAr ?
        `بوابة عمليات ${companyLabel} — سري للغاية | تقرير التكاليف لـ ${labelText}` :
        `${companyLabel} Operations Portal — Confidential | Costs Report for ${labelText}`;

    const printHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8">
            <title>${reportTitle} — ${labelText}</title>
            <style>
                @page { margin: 16mm 12mm; size: A4; }
                * { box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; margin: 0; direction: ${isAr ? 'rtl' : 'ltr'}; }
                h1 { font-size: 20px; margin: 0 0 4px; color: #0f172a; }
                .sub { font-size: 11px; color: #64748b; margin-bottom: 18px; }
                .hud { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
                .hud-box { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
                .hud-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
                .hud-val { font-size: 17px; font-weight: 900; margin-top: 6px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th { background: #f1f5f9; padding: 8px 10px; text-align: ${isAr ? 'right' : 'left'}; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
                td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: ${isAr ? 'right' : 'left'}; }
                tr:last-child td { border-bottom: none; }
                .section-title { font-size: 13px; font-weight: 800; color: #0f172a; margin: 18px 0 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; }
                .profit { color: #16a34a; } .loss { color: #dc2626; } .neutral { color: #475569; }
                .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            </style></head><body>
            <h1>🧾 ${companyLabel} — ${reportTitle}</h1>
            <div class="sub">${periodLabel}: <strong>${labelText}</strong> &nbsp;|&nbsp; ${generatedLabel}: ${new Date().toLocaleString()}</div>

            <div class="hud">
                <div class="hud-box">
                    <div class="hud-label">${netProfitLabel}</div>
                    <div class="hud-val ${netProfit > 0 ? 'profit' : netProfit < 0 ? 'loss' : 'neutral'}">${profitSign}SAR ${Math.abs(netProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div class="hud-box">
                    <div class="hud-label">${grossSalesLabel}</div>
                    <div class="hud-val profit">SAR ${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div class="hud-box">
                    <div class="hud-label">${grossCostsLabel}</div>
                    <div class="hud-val loss">SAR ${totalCosts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div class="hud-box">
                    <div class="hud-label">${transactionsLabel}</div>
                    <div class="hud-val neutral">${filteredSales.length + filteredCosts.length}</div>
                </div>
            </div>

            <div class="section-title">📊 ${sourceBreakdownLabel}</div>
            <table>
                <thead><tr><th>${colSourceCategory}</th><th style="text-align:${isAr ? 'left' : 'right'};">${colTotalSar}</th><th style="text-align:${isAr ? 'left' : 'right'};">${colPctTotal}</th></tr></thead>
                <tbody>${sourceRows || `<tr><td colspan="3" style="text-align:center;color:#94a3b8;">${noCostRecordsMsg}</td></tr>`}</tbody>
                <tfoot><tr style="background:#fef2f2;"><td><strong>${labelTotal}</strong></td><td style="text-align:${isAr ? 'left' : 'right'};font-weight:900;color:#dc2626;">SAR ${totalCosts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td style="text-align:${isAr ? 'left' : 'right'};font-weight:700;">100%</td></tr></tfoot>
            </table>

            <div class="section-title">🧾 ${titleAllTx}</div>
            <table>
                <thead><tr><th>${colDate}</th><th>${colCategory}</th><th style="text-align:${isAr ? 'left' : 'right'};">${colAmount}</th><th>${colLoggedBy}</th></tr></thead>
                <tbody>${txRows || `<tr><td colspan="4" style="text-align:center;color:#94a3b8;">${noTxMsg}</td></tr>`}</tbody>
            </table>

            <div class="footer">${footerMsg}</div>
            </body></html>`;

    const blob = new Blob([printHTML], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    iframe.onload = function () { setTimeout(() => iframe.contentWindow.print(), 300); };
    iframe.src = blobUrl;
    setTimeout(() => { URL.revokeObjectURL(blobUrl); document.body.removeChild(iframe); }, 15000);
}

// --- WAREHOUSE SYSTEM ---

function addWhFolder() {
    const folderName = document.getElementById('new-wh-folder').value.trim();
    if (!folderName) return;
    if (!getCompanyData().whCategories.includes(folderName)) {
        getCompanyData().whCategories.push(folderName);
        document.getElementById('new-wh-folder').value = '';

        // Targeted write to categories list
        db.ref('companies/' + currentCompany + '/whCategories').set(getCompanyData().whCategories)
            .catch(err => console.error("Error adding warehouse category:", err));
    } else {
        alert("Folder already exists.");
    }
}

function deleteWhFolder(folderName) {
    if (!currentUser || (currentUser.role !== 'admin' && !document.body.classList.contains('perm-warehouse'))) {
        alert("You do not have permission to delete folders.");
        return;
    }
    if (!confirm(`Delete folder '${folderName}'? Products inside will be moved to 'Uncategorized'.`)) return;

    getCompanyData().whCategories = getCompanyData().whCategories.filter(f => f !== folderName);

    // Move items in this folder to Uncategorized
    getCompanyData().warehouse.forEach(item => {
        if (item.category === folderName || !item.category) item.category = 'Uncategorized';
    });

    // Targeted write to categories and warehouse list
    db.ref('companies/' + currentCompany + '/whCategories').set(getCompanyData().whCategories)
        .catch(err => console.error("Error deleting category list:", err));
    db.ref('companies/' + currentCompany + '/warehouse').set(getCompanyData().warehouse)
        .catch(err => console.error("Error updating warehouse products categories:", err));
}

function renderWhFolders() {
    const list = document.getElementById('wh-folder-list');
    const select = document.getElementById('wh-folder-select');
    if (!list || !select) return;

    list.innerHTML = '';
    select.innerHTML = '';

    const folders = getCompanyData().whCategories || [];

    folders.forEach(f => {
        // Add to list
        const div = document.createElement('div');
        div.className = "flex-between list-item";
        // Now EVERY folder has a delete button!
        let delBtn = `<button class="btn-outline-danger admin-only" style="padding: 2px 6px; font-size: 0.75rem; border:none;" onclick="deleteWhFolder('${f}')">✖</button>`;
        div.innerHTML = `<span style="font-size:0.9rem; font-weight:600;">📂 ${f}</span> ${delBtn}`;
        list.appendChild(div);

        // Add to dropdown
        const opt = document.createElement('option');
        opt.value = f;
        opt.textContent = `📂 ${f}`;
        select.appendChild(opt);
    });

    // Add a fallback option if you deleted all folders
    if (folders.length === 0) {
        const opt = document.createElement('option');
        opt.value = 'Uncategorized';
        opt.textContent = `📂 Uncategorized`;
        select.appendChild(opt);
    }
}

function addWarehouseItem() {
    const name = document.getElementById('wh-name').value.trim();
    const stock = parseFloat(document.getElementById('wh-stock').value);
    const risk = parseFloat(document.getElementById('wh-risk').value);
    const category = document.getElementById('wh-folder-select').value || 'Uncategorized';

    if (!name || isNaN(stock) || isNaN(risk) || stock < 0 || risk < 0) { alert("Please fill out all product details correctly."); return; }

    let workerId = "";
    let workerName = "Admin";
    if (currentUser && currentUser.role === 'admin') {
        workerId = "admin";
        workerName = currentUser.email ? currentUser.email.split('@')[0] : "Admin";
    } else {
        const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
        workerId = myWorker ? myWorker.id : "";
        workerName = myWorker ? myWorker.name : "Staff";
    }

    const newItem = {
        id: 'wh-' + Date.now().toString(),
        name: name,
        category: category,
        maxStock: stock,
        currentStock: stock,
        riskAmount: risk,
        workerId: workerId,
        logs: [{ date: formatTimestamp(), amount: stock, difference: stock, note: 'Initial Stock Setup', workerId: workerId, workerName: workerName }]
    };

    if (!getCompanyData().warehouse) getCompanyData().warehouse = [];
    getCompanyData().warehouse.push(newItem);
    const itemIndex = getCompanyData().warehouse.length - 1;

    document.getElementById('wh-name').value = ''; document.getElementById('wh-stock').value = ''; document.getElementById('wh-risk').value = '';

    // Targeted write to item index in warehouse
    db.ref('companies/' + currentCompany + '/warehouse/' + itemIndex).set(newItem)
        .then(() => {
            logActivity('warehouse', workerId, workerName, `Added new warehouse item "${name}" with initial stock ${stock}`);
        })
        .catch(err => console.error("Error adding warehouse item:", err));
}

function updateWarehouseStock(itemId) {
    const inputEl = document.getElementById(`wh-update-${itemId}`);
    const newStock = parseFloat(inputEl.value);

    if (isNaN(newStock) || newStock < 0) return;

    const itemIndex = getCompanyData().warehouse.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const item = getCompanyData().warehouse[itemIndex];
    const diff = Math.round((newStock - item.currentStock) * 1000) / 1000;
    if (diff === 0) { inputEl.value = ''; return; }

    let workerId = "";
    let workerName = "Admin";
    if (currentUser && currentUser.role === 'admin') {
        workerId = "admin";
        workerName = currentUser.email ? currentUser.email.split('@')[0] : "Admin";
    } else {
        const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
        workerId = myWorker ? myWorker.id : "";
        workerName = myWorker ? myWorker.name : "Staff";
    }

    item.currentStock = newStock;
    item.logs.unshift({ date: formatTimestamp(), amount: newStock, difference: diff, note: diff > 0 ? 'Refill' : 'Consumption', workerId: workerId, workerName: workerName });
    inputEl.value = '';
    item.workerId = workerId;

    // Targeted write to item index in warehouse
    db.ref('companies/' + currentCompany + '/warehouse/' + itemIndex).set(item)
        .then(() => {
            logActivity('warehouse', workerId, workerName, `Updated stock of "${item.name}" to ${newStock} (Difference: ${diff > 0 ? '+' : ''}${diff})`);
        })
        .catch(err => console.error("Error updating warehouse stock:", err));
}

function editMaxStock(itemId) {
    const itemIndex = getCompanyData().warehouse.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const item = getCompanyData().warehouse[itemIndex];
    const newMax = prompt(t('desc-edit-max') || `Enter new Max / Full Stock for ${item.name}:`, item.maxStock);
    const parsed = parseFloat(newMax);
    if (!isNaN(parsed) && parsed > 0) {
        item.maxStock = parsed;

        let workerId = "";
        let workerName = "Admin";
        if (currentUser && currentUser.role === 'admin') {
            workerId = "admin";
            workerName = currentUser.email ? currentUser.email.split('@')[0] : "Admin";
        } else {
            const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
            workerId = myWorker ? myWorker.id : "";
            workerName = myWorker ? myWorker.name : "Staff";
        }
        item.workerId = workerId;
        if (!item.logs) item.logs = [];
        item.logs.unshift({ date: formatTimestamp(), amount: item.currentStock, difference: 0, note: `Max Stock changed to ${parsed}`, workerId: workerId, workerName: workerName });

        // Targeted write to item index in warehouse using .set()
        db.ref('companies/' + currentCompany + '/warehouse/' + itemIndex).set(item)
            .then(() => {
                logActivity('warehouse', workerId, workerName, `Changed Max/Full Stock of "${item.name}" to ${parsed}`);
            })
            .catch(err => console.error("Error editing max stock:", err));
    }
}

function editRiskAmount(itemId) {
    const itemIndex = getCompanyData().warehouse.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const item = getCompanyData().warehouse[itemIndex];
    const isAr = currentAppLang === 'ar';
    const newRisk = prompt(isAr ? `أدخل حد تنبيه الخطر الجديد للمنتج (${item.name}):` : `Enter new Risk Alert threshold for ${item.name}:`, item.riskAmount);
    const parsed = parseFloat(newRisk);
    if (!isNaN(parsed) && parsed >= 0) {
        item.riskAmount = parsed;

        let workerId = "";
        let workerName = "Admin";
        if (currentUser && currentUser.role === 'admin') {
            workerId = "admin";
            workerName = currentUser.email ? currentUser.email.split('@')[0] : "Admin";
        } else {
            const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
            workerId = myWorker ? myWorker.id : "";
            workerName = myWorker ? myWorker.name : "Staff";
        }
        item.workerId = workerId;
        if (!item.logs) item.logs = [];
        item.logs.unshift({ date: formatTimestamp(), amount: item.currentStock, difference: 0, note: `Risk Alert Limit changed to ${parsed}`, workerId: workerId, workerName: workerName });

        db.ref('companies/' + currentCompany + '/warehouse/' + itemIndex).set(item)
            .then(() => {
                logActivity('warehouse', workerId, workerName, `Changed Risk Alert limit of "${item.name}" to ${parsed}`);
                renderAll();
                checkStockAlerts();
            })
            .catch(err => console.error("Error editing risk amount:", err));
    }
}


function deleteWarehouseItem(itemId) {
    if (!currentUser || (currentUser.role !== 'admin' && !document.body.classList.contains('perm-warehouse'))) {
        alert("You do not have permission to delete products.");
        return;
    }
    if (!confirm(t('confirm-delete-product'))) return;
    const item = getCompanyData().warehouse.find(i => i.id === itemId);
    const name = item ? item.name : 'Unknown';
    getCompanyData().warehouse = getCompanyData().warehouse.filter(i => i.id !== itemId);

    let workerId = "";
    let workerName = "Admin";
    if (currentUser && currentUser.role === 'admin') {
        workerId = "admin";
        workerName = currentUser.email ? currentUser.email.split('@')[0] : "Admin";
    } else {
        const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
        workerId = myWorker ? myWorker.id : "";
        workerName = myWorker ? myWorker.name : "Staff";
    }

    // Targeted write of modified list
    db.ref('companies/' + currentCompany + '/warehouse').set(getCompanyData().warehouse)
        .then(() => {
            logActivity('warehouse_delete', workerId, workerName, `Deleted warehouse item "${name}"`);
        })
        .catch(err => console.error("Error deleting warehouse item:", err));
}

function showMoveSelect(itemId) {
    document.getElementById(`move-btn-${itemId}`).style.display = 'none';
    const sel = document.getElementById(`move-select-${itemId}`);
    sel.style.display = 'inline-block';
    sel.focus();
}

function cancelMoveSelect(itemId) {
    const sel = document.getElementById(`move-select-${itemId}`);
    if (sel) {
        sel.style.display = 'none';
        sel.value = '';
    }
    const btn = document.getElementById(`move-btn-${itemId}`);
    if (btn) btn.style.display = 'inline-block';
}

function executeMove(itemId, folderName) {
    if (!folderName) {
        cancelMoveSelect(itemId);
        return;
    }
    const itemIndex = getCompanyData().warehouse.findIndex(i => i.id === itemId);
    if (itemIndex !== -1) {
        const item = getCompanyData().warehouse[itemIndex];
        const oldCat = item.category || 'Uncategorized';
        item.category = folderName;

        let workerId = "";
        let workerName = "Admin";
        if (currentUser && currentUser.role === 'admin') {
            workerId = "admin";
            workerName = currentUser.email ? currentUser.email.split('@')[0] : "Admin";
        } else {
            const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
            workerId = myWorker ? myWorker.id : "";
            workerName = myWorker ? myWorker.name : "Staff";
        }
        item.workerId = workerId;

        // Targeted write to item index in warehouse using .set()
        db.ref('companies/' + currentCompany + '/warehouse/' + itemIndex).set(item)
            .then(() => {
                logActivity('warehouse', workerId, workerName, `Moved item "${item.name}" from category "${oldCat}" to "${folderName}"`);
            })
            .catch(err => console.error("Error moving warehouse item:", err));
    }
}

function checkStockAlerts() {
    const data = getCompanyData();
    const alertBox = document.getElementById('global-stock-alerts');
    if (!alertBox) return;
    if (!data.warehouse) {
        alertBox.style.display = 'none';
        return;
    }

    const isAdmin = currentUser && currentUser.role === 'admin';
    const hasWhAccess = isAdmin || document.body.classList.contains('perm-warehouse');
    if (!hasWhAccess) {
        alertBox.style.display = 'none';
        return;
    }

    const lowItems = data.warehouse.filter(i => i.currentStock <= i.riskAmount);

    if (lowItems.length > 0) {
        const names = lowItems.map(i => `${i.name} (${i.currentStock} ${t('label-currently-left')})`).join(', ');
        alertBox.innerHTML = `<span style="font-size: 1.2rem; margin-right: 10px;">🚨</span> <strong>${t('msg-critical-stock')}:</strong> ${names}.`;
        alertBox.style.display = 'block';
    } else { alertBox.style.display = 'none'; }
}


// --- AUTOMATIC IN-SCOPE WINDOW EXPORTS ---
if (typeof setSalesTimeframe === 'function') window.setSalesTimeframe = setSalesTimeframe;
if (typeof setSalesChartType === 'function') window.setSalesChartType = setSalesChartType;
if (typeof addIncomeSource === 'function') window.addIncomeSource = addIncomeSource;
if (typeof deleteIncomeSource === 'function') window.deleteIncomeSource = deleteIncomeSource;
if (typeof logSaleTransaction === 'function') window.logSaleTransaction = logSaleTransaction;
if (typeof deleteSaleTransaction === 'function') window.deleteSaleTransaction = deleteSaleTransaction;
if (typeof logPastSaleTransaction === 'function') window.logPastSaleTransaction = logPastSaleTransaction;
if (typeof logDepositTransaction === 'function') window.logDepositTransaction = logDepositTransaction;
if (typeof deleteDepositTransaction === 'function') window.deleteDepositTransaction = deleteDepositTransaction;
if (typeof showSwapSelect === 'function') window.showSwapSelect = showSwapSelect;
if (typeof cancelSwapSelect === 'function') window.cancelSwapSelect = cancelSwapSelect;
if (typeof swapSaleMethod === 'function') window.swapSaleMethod = swapSaleMethod;
if (typeof toggleSalesMethod === 'function') window.toggleSalesMethod = toggleSalesMethod;
if (typeof renderManaging === 'function') window.renderManaging = renderManaging;
if (typeof logDirectSpendGeneric === 'function') window.logDirectSpendGeneric = logDirectSpendGeneric;
if (typeof logDirectSpend === 'function') window.logDirectSpend = logDirectSpend;
if (typeof logDirectSpendFromSales === 'function') window.logDirectSpendFromSales = logDirectSpendFromSales;
if (typeof renderFinanceSpendArea === 'function') window.renderFinanceSpendArea = renderFinanceSpendArea;
if (typeof submitSpendOrder === 'function') window.submitSpendOrder = submitSpendOrder;
if (typeof cancelSpendOrder === 'function') window.cancelSpendOrder = cancelSpendOrder;
if (typeof rejectSpendOrder === 'function') window.rejectSpendOrder = rejectSpendOrder;
if (typeof acceptSpendOrder === 'function') window.acceptSpendOrder = acceptSpendOrder;
if (typeof deleteSpendLog === 'function') window.deleteSpendLog = deleteSpendLog;
if (typeof renderSpendOrders === 'function') window.renderSpendOrders = renderSpendOrders;
if (typeof setCostsTimeframe === 'function') window.setCostsTimeframe = setCostsTimeframe;
if (typeof addCostCategory === 'function') window.addCostCategory = addCostCategory;
if (typeof deleteCostCategory === 'function') window.deleteCostCategory = deleteCostCategory;
if (typeof logCostTransaction === 'function') window.logCostTransaction = logCostTransaction;
if (typeof deleteCostTransaction === 'function') window.deleteCostTransaction = deleteCostTransaction;
if (typeof logPastCostTransaction === 'function') window.logPastCostTransaction = logPastCostTransaction;
if (typeof renderCosts === 'function') window.renderCosts = renderCosts;
if (typeof getLocalKey === 'function') window.getLocalKey = getLocalKey;
if (typeof exportCostsPDF === 'function') window.exportCostsPDF = exportCostsPDF;
if (typeof addWhFolder === 'function') window.addWhFolder = addWhFolder;
if (typeof deleteWhFolder === 'function') window.deleteWhFolder = deleteWhFolder;
if (typeof renderWhFolders === 'function') window.renderWhFolders = renderWhFolders;
if (typeof addWarehouseItem === 'function') window.addWarehouseItem = addWarehouseItem;
if (typeof updateWarehouseStock === 'function') window.updateWarehouseStock = updateWarehouseStock;
if (typeof editMaxStock === 'function') window.editMaxStock = editMaxStock;
if (typeof editRiskAmount === 'function') window.editRiskAmount = editRiskAmount;
if (typeof deleteWarehouseItem === 'function') window.deleteWarehouseItem = deleteWarehouseItem;
if (typeof showMoveSelect === 'function') window.showMoveSelect = showMoveSelect;
if (typeof cancelMoveSelect === 'function') window.cancelMoveSelect = cancelMoveSelect;
if (typeof executeMove === 'function') window.executeMove = executeMove;
if (typeof checkStockAlerts === 'function') window.checkStockAlerts = checkStockAlerts;
