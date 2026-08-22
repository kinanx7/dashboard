/**
 * Department tab switcher, task catalog, task assignment & timers
 */

function getMonthlyStats(worker, monthStr) {
    if (!worker.monthlyStats) worker.monthlyStats = {};
    if (!worker.monthlyStats[monthStr]) {
        worker.monthlyStats[monthStr] = {
            custodyList: [],
            violationsList: [],
            rewardsList: [],
            costs: 0,
            paymentsList: [],
            deliveriesList: [],
            legacyDeliveries: 0,
            overtimeList: []
        };
    } else if (!worker.monthlyStats[monthStr].overtimeList) {
        worker.monthlyStats[monthStr].overtimeList = [];
    }
    return worker.monthlyStats[monthStr];
}

function getLogsForMonth(worker, monthStr) { return worker.logs.filter(l => l.date.startsWith(monthStr)); }

function calculateViolationsTotal(violationsList) {
    if (!violationsList) return 0;
    return violationsList.reduce((sum, v) => {
        if (v.status === 'waived') return sum;
        if (v.status === 'active' || !v.status) return sum + parseFloat(v.amount);
        if (v.status === 'pending') {
            const deadline = v.timestamp + (v.graceDays * 86400000);
            if (Date.now() >= deadline) return sum + parseFloat(v.amount);
        }
        return sum;
    }, 0);
}

function calculatePaymentsTotal(paymentsList) {
    if (!paymentsList) return 0;
    return paymentsList.reduce((sum, p) => sum + parseFloat(p.amount), 0);
}

function calculateRewardsTotal(rewardsList) {
    if (!rewardsList) return 0;
    return rewardsList.reduce((sum, r) => sum + parseFloat(r.amount), 0);
}

function calculateOvertimeTotal(overtimeList) {
    if (!overtimeList) return 0;
    return overtimeList.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
}

function calculateCustodyTotal(custodyList) {
    if (!custodyList) return 0;
    return custodyList.reduce((sum, c) => {
        if (c.type === 'given') return sum + parseFloat(c.amount);
        if (c.type === 'returned') return sum - parseFloat(c.amount);
        return sum;
    }, 0);
}

function getCumulativeBalance(worker, maxMonthStr) {
    const allMonths = Object.keys(worker.monthlyStats || {}).sort();
    let balance = parseFloat(worker.initialBalance || 0);
    for (const m of allMonths) {
        const stats = worker.monthlyStats[m];
        const base = parseFloat(worker.income || 0);
        const rew = calculateRewardsTotal(stats.rewardsList);
        const viol = calculateViolationsTotal(stats.violationsList);

        const sysViolDeduction = typeof getSystemViolationDeductionsForMonth === 'function' ? getSystemViolationDeductionsForMonth(worker, m) : 0;
        const lateDeduction = typeof getLateDeductionsForMonth === 'function' ? getLateDeductionsForMonth(worker, m) : 0;
        const volumeReward = typeof getDriverVolumeRewardsForMonth === 'function' ? getDriverVolumeRewardsForMonth(worker, m) : 0;
        const ov = calculateOvertimeTotal(stats.overtimeList);
        const netThisMonth = base + rew + volumeReward + ov - viol - sysViolDeduction - lateDeduction;
        const paidThisMonth = calculatePaymentsTotal(stats.paymentsList);
        balance += (netThisMonth - paidThisMonth);
        if (m === maxMonthStr) break;
    }
    return balance;
}

function handleMonthChange() {
    const input = document.getElementById('global-month').value;
    if (input) {
        currentGlobalMonth = input;
        showingAllHistory = false;
        setDatePickerLimits();
        runAutoLogger();
        renderAll();
        checkStockAlerts();
    }
}

function setDatePickerLimits() {
    const dateInput = document.getElementById('log-date');
    const [year, month] = currentGlobalMonth.split('-');
    const lastDay = new Date(year, month, 0).getDate();
    dateInput.min = `${currentGlobalMonth}-01`; dateInput.max = `${currentGlobalMonth}-${lastDay}`;
    dateInput.value = '';
}

function toggleVacationDays() {
    const type = document.getElementById('log-type').value;
    document.getElementById('vacation-days-group').style.display = type === 'vacation' ? 'block' : 'none';
}

// --- DATA EXPORT LOGIC ---
function getExportData(lang) {
    const workers = getVisibleWorkers();
    const data = []; const t = translations[lang];
    workers.forEach(w => {
        const stats = getMonthlyStats(w, currentGlobalMonth);
        const monthlyLogs = getLogsForMonth(w, currentGlobalMonth);
        const baseIncome = parseFloat(w.income || 0);
        const volumeReward = typeof getDriverVolumeRewardsForMonth === 'function' ? getDriverVolumeRewardsForMonth(w, currentGlobalMonth) : 0;
        const rewards = calculateRewardsTotal(stats.rewardsList) + volumeReward;
        const violations = calculateViolationsTotal(stats.violationsList);
        const paid = calculatePaymentsTotal(stats.paymentsList);

        const sysViolDeduction = typeof getSystemViolationDeductionsForMonth === 'function' ? getSystemViolationDeductionsForMonth(w, currentGlobalMonth) : 0;
        const lateDeduction = typeof getLateDeductionsForMonth === 'function' ? getLateDeductionsForMonth(w, currentGlobalMonth) : 0;
        const netIncome = baseIncome + rewards - violations - sysViolDeduction - lateDeduction - paid;
        const remaining = getCumulativeBalance(w, currentGlobalMonth);
        const custodyTotal = calculateCustodyTotal(stats.custodyList);

        const goodNotes = monthlyLogs.filter(l => (l.noteType === 'good' || l.score == 100) && l.noteType !== 'vacation').length;
        const badNotes = monthlyLogs.filter(l => (l.noteType === 'bad' || l.score == 2.5) && l.noteType !== 'vacation').length;
        const deliveries = (stats.deliveriesList ? stats.deliveriesList.length : 0) + (stats.legacyDeliveries || 0);

        data.push({
            [t.empName]: w.name, [t.role]: w.role || t.unassigned, [t.branch]: w.branch || t.na, [t.shift]: `${w.startTime || '??:??'} - ${w.endTime || '??:??'}`,
            [t.initialBalance]: parseFloat(w.initialBalance || 0),
            [t.baseIncome]: baseIncome, [t.rewards]: rewards, [t.violations]: violations, [t.netPay]: netIncome,
            [t.paid]: paid, [t.remaining]: remaining,
            [t.costs]: parseFloat(stats.costs || 0), [t.custody]: custodyTotal,
            [t.avgPerf]: getAveragePerfection(monthlyLogs), [t.goodNotes]: goodNotes, [t.badNotes]: badNotes, [t.deliveries]: deliveries
        });
    });
    return data;
}

function exportToExcel() {
    const lang = document.getElementById('export-lang').value;
    const data = getExportData(lang);
    if (data.length === 0) { alert(lang === 'ar' ? "لا توجد سجلات." : "No records to export."); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    if (lang === 'ar') ws['!dir'] = 'rtl';
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Financial_Payroll");
    XLSX.writeFile(wb, `Burgeroov_Finance_${currentGlobalMonth}.xlsx`);
}

function exportToPDF() {
    const lang = document.getElementById('export-lang').value;
    const data = getExportData(lang);
    const t = translations[lang];
    if (data.length === 0) { alert(lang === 'ar' ? "لا توجد سجلات." : "No records to export."); return; }

    const headerColor = '#452b1b';
    const printTitle = lang === 'ar' ? `تقرير BURGEROOV المالي (${currentGlobalMonth})` : `BURGEROOV Financial Report (${currentGlobalMonth})`;
    const direction = lang === 'ar' ? 'rtl' : 'ltr'; const textAlign = lang === 'ar' ? 'right' : 'left';

    const printHTML = `
                <!DOCTYPE html><html dir="${direction}" lang="${lang}"><head><meta charset="UTF-8"><title>${printTitle}</title>
                <style>
                    @page { size: landscape; margin: 0 !important; }
                    @media print {
                        html, body { margin: 0 !important; padding: 0 !important; }
                    }
                    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #1e293b; padding: 15mm; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    h2 { color: ${headerColor}; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; text-align: ${textAlign}; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; text-align: ${textAlign}; }
                    th { background-color: ${headerColor}; color: white; padding: 10px; border: 1px solid #cbd5e1; }
                    td { padding: 8px 10px; border: 1px solid #e2e8f0; }
                    tr:nth-child(even) td { background-color: #f8fafc; }
                    .footer { margin-top: 30px; font-size: 10px; color: #64748b; text-align: ${lang === 'ar' ? 'left' : 'right'}; }
                </style></head><body>
                <h2>${printTitle}</h2><table><thead><tr>${Object.keys(data[0]).map(key => `<th>${key}</th>`).join('')}</tr></thead>
                <tbody>${data.map(row => `<tr>${Object.values(row).map(val => `<td>${val}</td>`).join('')}</tr>`).join('')}</tbody></table>
                <div class="footer">${t.generatedOn} ${new Date().toLocaleString()}</div>
                </body></html>
            `;

    const blob = new Blob([printHTML], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe'); iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    iframe.onload = function () { setTimeout(function () { iframe.contentWindow.print(); }, 250); };
    iframe.src = blobUrl;
    setTimeout(() => { URL.revokeObjectURL(blobUrl); document.body.removeChild(iframe); }, 10000);
}

// --- WORKER FINANCE PDF EXPORT ---
function exportWorkerFinancePDF() {
    let worker = null;

    // For admin: use the selected worker in the dropdown
    if (currentUser && currentUser.role === 'admin') {
        const workerId = document.getElementById('fin-worker-select').value;
        if (!workerId) {
            // No worker selected — export all workers using the existing exportToPDF
            exportToPDF();
            return;
        }
        worker = getCompanyData().workers.find(w => w.id === workerId);
    } else {
        // For worker: auto-find their own profile
        worker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
    }

    if (!worker) { alert('No worker profile found to export.'); return; }

    const stats = getMonthlyStats(worker, currentGlobalMonth);
    const base = parseFloat(worker.income || 0);
    const rewards = calculateRewardsTotal(stats.rewardsList);
    const violations = calculateViolationsTotal(stats.violationsList);
    const paid = calculatePaymentsTotal(stats.paymentsList);
    const sysViolDeduction = typeof getSystemViolationDeductionsForMonth === 'function' ? getSystemViolationDeductionsForMonth(worker, currentGlobalMonth) : 0;
    const lateDeduction = typeof getLateDeductionsForMonth === 'function' ? getLateDeductionsForMonth(worker, currentGlobalMonth) : 0;
    const volumeReward = typeof getDriverVolumeRewardsForMonth === 'function' ? getDriverVolumeRewardsForMonth(worker, currentGlobalMonth) : 0;
    const overtime = calculateOvertimeTotal(stats.overtimeList);
    const net = base + rewards + volumeReward + overtime - violations - paid - sysViolDeduction - lateDeduction;
    const allTimeRemaining = getCumulativeBalance(worker, currentGlobalMonth);
    const custodyTotal = calculateCustodyTotal(stats.custodyList);

    // Build violations rows
    let violRows = '';
    (stats.violationsList || []).forEach(v => {
        let statusText = '';
        let statusColor = '#dc2626';
        if (v.status === 'waived') {
            statusText = '✅ Fixed & Waived'; statusColor = '#16a34a';
        } else if (v.status === 'active' || !v.status) {
            statusText = '🚨 Penalty Applied'; statusColor = '#dc2626';
        } else if (v.status === 'pending') {
            const deadline = v.timestamp + (v.graceDays * 86400000);
            const timeLeft = deadline - Date.now();
            if (timeLeft <= 0) { statusText = '🚨 Time Expired — Applied'; statusColor = '#dc2626'; }
            else {
                const daysLeft = Math.floor(timeLeft / 86400000);
                const hoursLeft = Math.floor((timeLeft % 86400000) / 3600000);
                statusText = `⏳ Fix within: ${daysLeft > 0 ? daysLeft + 'd ' : ''}${hoursLeft}h (${v.graceDays} day grace)`;
                statusColor = '#d97706';
            }
        }
        const strikethrough = v.status === 'waived' ? 'text-decoration:line-through;' : '';
        violRows += `<tr>
                    <td style="padding:8px 10px; border:1px solid #e2e8f0;">${v.date}</td>
                    <td style="padding:8px 10px; border:1px solid #e2e8f0;">${v.reason}</td>
                    <td style="padding:8px 10px; border:1px solid #e2e8f0; ${strikethrough}">- SAR ${parseFloat(v.amount).toLocaleString()}</td>
                    <td style="padding:8px 10px; border:1px solid #e2e8f0; color:${statusColor}; font-weight:600;">${statusText}</td>
                </tr>`;
    });
    if (!violRows) violRows = `<tr><td colspan="4" style="text-align:center; color:#64748b; padding:10px; border:1px solid #e2e8f0;">No violations this month ✅</td></tr>`;

    // Build payments rows
    let payRows = '';
    (stats.paymentsList || []).forEach(p => {
        payRows += `<tr><td style="padding:8px 10px; border:1px solid #e2e8f0;">${p.date}</td><td style="padding:8px 10px; border:1px solid #e2e8f0; color:#0284c7; font-weight:600;">SAR ${parseFloat(p.amount).toLocaleString()}</td></tr>`;
    });
    if (!payRows) payRows = `<tr><td colspan="2" style="text-align:center; color:#64748b; padding:10px; border:1px solid #e2e8f0;">No payments recorded this month</td></tr>`;

    // Build overtime rows
    let overtimeRows = '';
    (stats.overtimeList || []).forEach(o => {
        overtimeRows += `<tr><td style="padding:8px 10px; border:1px solid #e2e8f0;">${o.date}</td><td style="padding:8px 10px; border:1px solid #e2e8f0;">x${o.multiplier || '1.00'} (${o.hours || '1'} hr)</td><td style="padding:8px 10px; border:1px solid #e2e8f0; color:#f59e0b; font-weight:600;">SAR ${parseFloat(o.amount || 0).toLocaleString()}</td></tr>`;
    });
    if (!overtimeRows) overtimeRows = `<tr><td colspan="3" style="text-align:center; color:#64748b; padding:10px; border:1px solid #e2e8f0;">No overtime recorded this month</td></tr>`;

    const headerColor = '#452b1b';
    const printHTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
            <title>Financial Report — ${worker.name} (${currentGlobalMonth})</title>
            <style>
                @page { size: portrait; margin: 0mm !important; }
                @media print { html, body { margin: 0 !important; padding: 0 !important; } }
                body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 12mm; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 13px; }
                .header { background: ${headerColor}; color: white; padding: 20px 24px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
                .header h1 { margin: 0; font-size: 18px; }
                .header .meta { font-size: 12px; opacity: 0.85; text-align: right; }
                .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
                .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; }
                .summary-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
                .summary-card .value { font-size: 18px; font-weight: 800; margin-top: 4px; }
                .section-title { font-size: 13px; font-weight: 700; color: ${headerColor}; border-bottom: 2px solid ${headerColor}; padding-bottom: 6px; margin: 18px 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
                th { background: ${headerColor}; color: white; padding: 10px; text-align: left; border: 1px solid #cbd5e1; font-size: 11px; }
                .highlight-row td { background: #fffbeb; font-weight: 700; }
                .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; }
            </style></head><body>
                <div class="header">
                    <div>
                        <h1>💰 Financial Report</h1>
                        <div style="font-size:13px; margin-top:4px; opacity:0.9;">${worker.name} &nbsp;•&nbsp; ${worker.role || 'Staff'} &nbsp;•&nbsp; ${worker.branch || ''}</div>
                    </div>
                    <div class="meta">
                        <div>Month: <strong>${currentGlobalMonth}</strong></div>
                        <div>Shift: ${worker.startTime || '--'} – ${worker.endTime || '--'}</div>
                    </div>
                </div>

                <div class="summary-grid">
                    <div class="summary-card">
                        <div class="label">Base Salary</div>
                        <div class="value" style="color:${headerColor};">SAR ${base.toLocaleString()}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Net This Month</div>
                        <div class="value" style="color:${net >= 0 ? '#16a34a' : '#dc2626'};">SAR ${net.toLocaleString()}</div>
                    </div>
                    <div class="summary-card" style="border-color:#b45309; background:#fffbeb;">
                        <div class="label">Total Remaining (All-Time)</div>
                        <div class="value" style="color:#b45309;">SAR ${allTimeRemaining.toLocaleString()}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Rewards</div>
                        <div class="value" style="color:#16a34a;">+ SAR ${rewards.toLocaleString()}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Violations</div>
                        <div class="value" style="color:#dc2626;">- SAR ${violations.toLocaleString()}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Custody</div>
                        <div class="value" style="color:#d97706;">SAR ${custodyTotal.toLocaleString()}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Overtime</div>
                        <div class="value" style="color:#f59e0b;">+ SAR ${overtime.toLocaleString()}</div>
                    </div>
                </div>

                <div class="section-title">⚠️ Violations & Fix Status</div>
                <table>
                    <thead><tr><th>Date</th><th>Reason</th><th>Amount</th><th>Status / Fix Time</th></tr></thead>
                    <tbody>${violRows}</tbody>
                </table>

                <div class="section-title">💵 Advance Payments This Month</div>
                <table>
                    <thead><tr><th>Date</th><th>Amount Paid</th></tr></thead>
                    <tbody>${payRows}</tbody>
                    <tfoot><tr class="highlight-row"><td style="padding:8px 10px; border:1px solid #e2e8f0;">Total Paid</td><td style="padding:8px 10px; border:1px solid #e2e8f0; color:#0284c7;">SAR ${paid.toLocaleString()}</td></tr></tfoot>
                </table>

                <div class="section-title">🕒 Overtime Logs This Month</div>
                <table>
                    <thead><tr><th>Date</th><th>Multiplier / Hours</th><th>Amount</th></tr></thead>
                    <tbody>${overtimeRows}</tbody>
                    <tfoot><tr class="highlight-row"><td style="padding:8px 10px; border:1px solid #e2e8f0;" colspan="2">Total Overtime</td><td style="padding:8px 10px; border:1px solid #e2e8f0; color:#f59e0b;">SAR ${overtime.toLocaleString()}</td></tr></tfoot>
                </table>

                <div class="footer">
                    <span>Burgeroov Management Portal</span>
                    <span>Generated: ${new Date().toLocaleString()}</span>
                </div>
            </body></html>`;

    const blob = new Blob([printHTML], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    iframe.onload = function () { setTimeout(function () { iframe.contentWindow.print(); }, 300); };
    iframe.src = blobUrl;
    setTimeout(() => { URL.revokeObjectURL(blobUrl); document.body.removeChild(iframe); }, 15000);
}

// --- VIOLATION RULES SYSTEM ---
function addViolationRule() {
    const name = document.getElementById('new-vrule-name').value.trim();
    const amount = parseFloat(document.getElementById('new-vrule-amount').value);
    if (!name || isNaN(amount) || amount <= 0) { alert("Please provide a valid name and amount."); return; }
    getCompanyData().violationRules.push({ id: Date.now().toString(), name, amount });
    document.getElementById('new-vrule-name').value = ''; document.getElementById('new-vrule-amount').value = '';

    // Targeted write to global violationRules list
    db.ref('companies/' + currentCompany + '/violationRules').set(getCompanyData().violationRules)
        .catch(err => console.error("Error adding violation rule:", err));
}

function deleteViolationRule(id) {
    getCompanyData().violationRules = getCompanyData().violationRules.filter(r => r.id !== id);

    // Targeted write to global violationRules list
    db.ref('companies/' + currentCompany + '/violationRules').set(getCompanyData().violationRules)
        .catch(err => console.error("Error deleting violation rule:", err));
}

function renderViolationRules() {
    const list = document.getElementById('vrule-list'); list.innerHTML = '';
    const select = document.getElementById('v-rule-select');
    if (select) select.innerHTML = '<option value="">-- Custom / Select Rule --</option>';

    getCompanyData().violationRules.forEach(rule => {
        const li = document.createElement('li'); li.className = 'flex-between list-item';
        li.innerHTML = `<div><span style="font-weight: 600; color:var(--text-main);">${rule.name}</span><br><span style="font-size:0.8rem; color:var(--danger); font-weight: 500;">- SAR ${rule.amount}</span></div> <button class="btn-outline-danger" style="padding: 4px 10px; font-size: 0.75rem;" onclick="deleteViolationRule('${rule.id}')">Del</button>`;
        list.appendChild(li);
        if (select) {
            const option = document.createElement('option'); option.value = rule.amount; option.dataset.name = rule.name; option.textContent = `${rule.name} (-${rule.amount} SAR)`;
            select.appendChild(option);
        }
    });
}

function autoFillViolation() {
    const select = document.getElementById('v-rule-select');
    const amountInput = document.getElementById('v-amount');
    const reasonInput = document.getElementById('v-reason');
    if (select.value) { amountInput.value = select.value; reasonInput.value = select.options[select.selectedIndex].dataset.name; }
    else { amountInput.value = ''; reasonInput.value = ''; }
}

function applyDetailedViolation() {
    const workerId = document.getElementById('fin-worker-select').value;
    if (!workerId) { alert("Select an employee first."); return; }
    const amount = parseFloat(document.getElementById('v-amount').value);
    const reason = document.getElementById('v-reason').value.trim();
    const gracePeriod = parseInt(document.getElementById('v-grace-period').value);
    const fileInput = document.getElementById('v-image');

    if (isNaN(amount) || amount <= 0) { alert("Please enter a valid violation amount."); return; }
    if (!reason) { alert("Please provide a reason or note for this violation."); return; }

    const worker = getCompanyData().workers.find(w => w.id === workerId);
    const stats = getMonthlyStats(worker, currentGlobalMonth);

    const newViolation = {
        id: Date.now().toString(), date: formatTimestamp(), timestamp: Date.now(),
        amount: amount, reason: reason, graceDays: gracePeriod, status: gracePeriod > 0 ? 'pending' : 'active', image: null
    };

    if (fileInput.files && fileInput.files[0]) {
        compressImage(fileInput.files[0], (base64Img) => {
            newViolation.image = base64Img;
            saveViolationRecord(workerId, stats, newViolation);
        });
    } else {
        saveViolationRecord(workerId, stats, newViolation);
    }
}

function saveViolationRecord(workerId, stats, record) {
    const companyData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const workers = companyData.workers || [];
    const workerIndex = workers.findIndex(w => String(w.id) === String(workerId));

    if (workerIndex === -1) {
        console.error("Worker not found for violation:", workerId);
        return;
    }

    const worker = workers[workerIndex];
    const monthKey = (typeof currentGlobalMonth !== 'undefined' && currentGlobalMonth) ? currentGlobalMonth : new Date().toISOString().slice(0, 7);

    if (!stats || typeof stats !== 'object') {
        stats = typeof getMonthlyStats === 'function' ? getMonthlyStats(worker, monthKey) : { violationsList: [] };
    }
    if (!stats.violationsList || !Array.isArray(stats.violationsList)) {
        stats.violationsList = [];
    }

    stats.violationsList.unshift(record);

    const vAmt = document.getElementById('v-amount'); if (vAmt) vAmt.value = '';
    const vReason = document.getElementById('v-reason'); if (vReason) vReason.value = '';
    const vRule = document.getElementById('v-rule-select'); if (vRule) vRule.value = '';
    const vImg = document.getElementById('v-image'); if (vImg) vImg.value = '';

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${monthKey}/violationsList`).set(stats.violationsList)
        .then(() => {
            if (typeof logActivity === 'function') {
                logActivity('violation', worker.id, worker.name, `Added violation to ${worker.name}: "${record.reason || record.type}" (SAR ${record.amount})`);
            }
        })
        .catch(err => console.error("Error saving violation record:", err));
}

function deleteDetailedViolation(workerId, violationId) {
    if (!confirm("Are you sure you want to remove this violation?")) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex !== -1) {
        const worker = getCompanyData().workers[workerIndex];
        const stats = getMonthlyStats(worker, currentGlobalMonth);
        stats.violationsList = stats.violationsList.filter(v => v.id !== violationId);

        db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/violationsList`).set(stats.violationsList)
            .then(() => {
                if (typeof logActivity === 'function') {
                    logActivity('violation', worker.id, worker.name, `Deleted violation record from ${worker.name}`);
                }
            })
            .catch(err => console.error("Error deleting violation record:", err));
    }
}

function resolveViolation(workerId, violationId, action) {
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex !== -1) {
        const worker = getCompanyData().workers[workerIndex];
        const stats = getMonthlyStats(worker, currentGlobalMonth);
        const v = stats.violationsList.find(v => v.id === violationId);
        if (v) {
            if (action === 'waive') v.status = 'waived';
            if (action === 'apply') v.status = 'active';

            db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/violationsList`).set(stats.violationsList)
                .catch(err => console.error("Error resolving violation:", err));
        }
    }
}

// --- RANKS SYSTEM ---
function manuallyUpdateRank(workerId, newRank) {
    if (!newRank) return;
    if (!confirm(`Change rank to ${newRank}?`)) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    worker.rank = newRank;
    worker.lastEvalDate = Date.now();

    // Targeted update to worker rank and evaluation date attributes
    db.ref(`companies/${currentCompany}/workers/${workerIndex}`).update({
        rank: newRank,
        lastEvalDate: worker.lastEvalDate
    }).catch(err => console.error("Error manually updating rank:", err));
}

function renderRanksTable() {
    const tbody = document.querySelector('#ranks-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const now = Date.now();
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;

    const workers = getVisibleWorkers();

    if (workers.length === 0 && (!currentUser || currentUser.role !== 'admin')) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Your account is not linked to any worker profile yet.</td></tr>`;
        return;
    }

    workers.forEach(worker => {
        let relevantLogs = worker.logs.filter(l => (now - new Date(l.date).getTime()) <= ninetyDays);
        let gradedLogs = relevantLogs.filter(l => l.noteType !== 'vacation' && l.score !== 'vacation');

        let avgDisplay = 'N/A';
        if (gradedLogs.length > 0) {
            let sum = gradedLogs.reduce((acc, l) => acc + parseFloat(l.score), 0);
            avgDisplay = Math.round(sum / gradedLogs.length) + '%';
        }

        const detailsId = `rank-details-${worker.id}`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
                    <td>
                        <strong style="color:var(--text-main);">${worker.name}</strong><br>
                        <span class="text-muted-heavy">${worker.branch}</span>
                    </td>
                    <td><span class="rank-badge rank-${worker.rank}">${worker.rank}</span></td>
                    <td>
                        <div style="display:flex; align-items:center; gap:8px; cursor:pointer;" onclick="toggleDetails('${detailsId}')">
                            <span class="badge" style="background: var(--primary); margin:0;">${avgDisplay}</span>
                            <span style="font-size:0.7rem; color:var(--primary);">▼ Log</span>
                        </div>
                        <div class="breakdown-details" id="${detailsId}" style="max-height: 200px; overflow-y:auto; margin-top: 10px;">
                            <strong style="display:block; border-bottom:1px solid var(--border-color); margin-bottom:8px; padding-bottom:4px; color:var(--text-main);">Last 90 Days Log</strong>
                            ${relevantLogs.length === 0 ? '<em style="color:var(--text-muted)">No logs found.</em>' : relevantLogs.map(l => `
                                <div class="breakdown-row" style="padding:4px 0; border-bottom:1px solid rgba(0,0,0,0.05);">
                                    <span style="color:var(--text-muted); font-size:0.75rem;">${l.date}</span> 
                                    <span style="${l.noteType === 'vacation' ? 'color:var(--warning)' : (l.score == 100 ? 'color:var(--success)' : 'color:var(--danger)')}">
                                        ${l.noteType === 'vacation' ? '🌴 Vacation' : (l.score == 100 ? '✅ 100%' : '❌ 2.5%')}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </td>
                    <td class="admin-only">
                        <select onchange="manuallyUpdateRank('${worker.id}', this.value)" style="padding: 8px; width: auto; font-size: 0.85rem;">
                            <option value="">Change...</option>
                            <option value="A">Promote to A</option>
                            <option value="B">Set to B</option>
                            <option value="C">Set to C</option>
                            <option value="Unranked">Demote to Unranked</option>
                        </select>
                    </td>
                `;
        tbody.appendChild(tr);
    });
}


function fillTaskShortcut(text) {
    const input = document.getElementById('task-assign-input');
    if (input) {
        input.value = text;
        input.focus();
    }
}
window.fillTaskShortcut = fillTaskShortcut;

function addTaskTemplate() {
    const input = document.getElementById('task-template-input');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return alert("Enter a task template name.");
    const companyData = getCompanyData();
    if (!companyData.jobCatalog) companyData.jobCatalog = [];
    if (!companyData.jobCatalog.includes(val)) {
        companyData.jobCatalog.push(val);
        input.value = '';
        db.ref('companies/' + currentCompany + '/jobCatalog').set(companyData.jobCatalog)
            .then(() => { if (typeof renderTasks === 'function') renderTasks(); })
            .catch(err => console.error("Error adding task template:", err));
    }
}
window.addTaskTemplate = addTaskTemplate;

function deleteTaskTemplate(templateName) {
    const companyData = getCompanyData();
    if (!companyData.jobCatalog) return;
    companyData.jobCatalog = companyData.jobCatalog.filter(t => t !== templateName);
    db.ref('companies/' + currentCompany + '/jobCatalog').set(companyData.jobCatalog)
        .then(() => { if (typeof renderTasks === 'function') renderTasks(); })
        .catch(err => console.error("Error deleting task template:", err));
}
window.deleteTaskTemplate = deleteTaskTemplate;

function getNextTaskNum() {
    const data = getCompanyData();
    let maxNum = 0;
    if (!data) return 1;

    const rawGenTasks = data.generalTasks || {};
    const genArray = Array.isArray(rawGenTasks) ? rawGenTasks : Object.values(rawGenTasks);
    genArray.forEach(gt => {
        if (gt && typeof gt.taskNum === 'number' && gt.taskNum > maxNum) {
            maxNum = gt.taskNum;
        }
    });

    (data.workers || []).forEach(w => {
        (w.jobs || []).forEach(j => {
            if (j && typeof j.taskNum === 'number' && j.taskNum > maxNum) {
                maxNum = j.taskNum;
            }
        });
    });

    return maxNum + 1;
}
window.getNextTaskNum = getNextTaskNum;

function ensureTaskNumbers() {
    const data = getCompanyData();
    if (!data) return;

    let allTasks = [];

    const rawGenTasks = data.generalTasks || {};
    const genArray = Array.isArray(rawGenTasks) ? rawGenTasks : Object.values(rawGenTasks);
    genArray.forEach(gt => {
        if (gt && gt.id) allTasks.push(gt);
    });

    (data.workers || []).forEach(w => {
        (w.jobs || []).forEach(j => {
            if (j && j.id) allTasks.push(j);
        });
    });

    if (allTasks.length === 0) return;

    allTasks.sort((a, b) => getJobTimestamp(a) - getJobTimestamp(b));

    const takenNums = new Set();
    allTasks.forEach(t => {
        if (typeof t.taskNum === 'number' && t.taskNum > 0) {
            takenNums.add(t.taskNum);
        }
    });

    let currentCounter = 1;
    allTasks.forEach(t => {
        if (typeof t.taskNum !== 'number' || t.taskNum <= 0) {
            while (takenNums.has(currentCounter)) {
                currentCounter++;
            }
            t.taskNum = currentCounter;
            takenNums.add(currentCounter);
            currentCounter++;
        }
    });
}
window.ensureTaskNumbers = ensureTaskNumbers;

function assignTask() {
    const isAr = currentAppLang === 'ar';
    const isAdmin = currentUser && currentUser.role === 'admin';
    const activeWorker = typeof getActiveWorker === 'function' ? getActiveWorker() : null;
    const canGiveTasks = isAdmin || document.body.classList.contains('perm-tasks') || (activeWorker && activeWorker.perms && (activeWorker.perms.tasks === true || activeWorker.perms.tasks === 'true'));
    if (!canGiveTasks) {
        alert(isAr ? '⛔ ليس لديك صلاحية إنشاء أو إسناد المهام. فقط المدير أو من يملك صلاحية المهام يمكنه ذلك!' : '⛔ You do not have permission to assign or create tasks.');
        return;
    }

    const workerId = document.getElementById('task-worker-select').value;
    const text = document.getElementById('task-assign-input').value.trim();
    const urgency = document.getElementById('task-urgency') ? document.getElementById('task-urgency').value : 'normal';
    const deadlineMins = document.getElementById('task-deadline') ? parseInt(document.getElementById('task-deadline').value) || 0 : 0;

    if (!workerId || !text) { alert(isAr ? "الرجاء اختيار الموظف وكتابة تفاصيل المهمة." : "Select an employee and describe a task."); return; }

    const assignedTaskNum = getNextTaskNum();

    if (workerId.startsWith('group_')) {
        const groupId = workerId.replace('group_', '');
        const companyData = getCompanyData();
        const groups = companyData.taskGroups || [];
        const group = groups.find(g => g.id === groupId);
        if (!group) { alert("Selected group not found."); return; }

        const newGroupTask = {
            id: 'gt-' + Date.now().toString(),
            taskNum: assignedTaskNum,
            title: text,
            date: formatTimestamp(),
            timestamp: Date.now(),
            urgency: urgency,
            deadlineMins: deadlineMins,
            status: 'pending',
            targetGroupId: groupId,
            targetGroupName: group.name,
            acceptedBy: null,
            acceptedById: null,
            acceptedAt: null
        };

        db.ref(`companies/${currentCompany}/generalTasks/${newGroupTask.id}`).set(newGroupTask)
            .then(() => {
                logActivity('task', `group_${groupId}`, group.name, `Created group task ${assignedTaskNum} for "${group.name}": "${text}"`);
                alert(currentAppLang === 'ar' ? `تم إسناد المهمة ${assignedTaskNum} للمجموعة ${group.name} بنجاح!` : `Group task ${assignedTaskNum} assigned to ${group.name} successfully!`);
                document.getElementById('task-assign-input').value = '';
                if (document.getElementById('task-deadline')) document.getElementById('task-deadline').value = '';
                if (document.getElementById('task-urgency')) document.getElementById('task-urgency').value = 'normal';
                document.getElementById('task-worker-select').value = '';
                
                // Send WhatsApp to group members
                if (typeof sendWhatsAppDirect === 'function' && Array.isArray(group.members)) {
                    const allWorkers = (companyData.workers || []);
                    const companyLabel = (typeof currentCompany !== 'undefined' ? currentCompany : '').toUpperCase();
                    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
                    group.members.forEach(memberId => {
                        const w = allWorkers.find(wItem => wItem && (wItem.id === memberId || String(wItem.id) === String(memberId)));
                        if (w && w.phone && w.waAlertsEnabled !== false) {
                            const waMsg = isAr
                                ? `👥 *مهمة جديدة للمجموعة [${group.name}]*\n\nالمهمة: ${text}\n\nيرجى فتح لوحة المهام للإنجاز.`
                                : `👥 *New Group Task [${group.name}]*\n\nTask: ${text}\n\nPlease check your task board.`;
                            sendWhatsAppDirect(w.phone, waMsg);
                        }
                    });
                }
                renderAll();
            })
            .catch(err => console.error("Error creating group task:", err));
        return;
    }

    if (workerId === 'general') {
        const newGeneralTask = {
            id: 'gt-' + Date.now().toString(),
            taskNum: assignedTaskNum,
            title: text,
            date: formatTimestamp(),
            timestamp: Date.now(),
            urgency: urgency,
            deadlineMins: deadlineMins,
            status: 'pending',
            acceptedBy: null,
            acceptedById: null,
            acceptedAt: null
        };

        db.ref(`companies/${currentCompany}/generalTasks/${newGeneralTask.id}`).set(newGeneralTask)
            .then(() => {
                logActivity('task', 'general', 'General Pool', `Created general task ${assignedTaskNum}: "${text}"`);
                alert(currentAppLang === 'ar' ? `تم إنشاء المهمة العامة ${assignedTaskNum} بنجاح!` : `General task ${assignedTaskNum} created successfully!`);
                document.getElementById('task-assign-input').value = '';
                if (document.getElementById('task-deadline')) document.getElementById('task-deadline').value = '';
                if (document.getElementById('task-urgency')) document.getElementById('task-urgency').value = 'normal';
                document.getElementById('task-worker-select').value = '';

                // Send WhatsApp to all company workers
                if (typeof sendWhatsAppDirect === 'function') {
                    const allWorkers = (getCompanyData().workers || []);
                    const companyLabel = (typeof currentCompany !== 'undefined' ? currentCompany : '').toUpperCase();
                    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
                    allWorkers.forEach(w => {
                        if (w && w.phone && w.waAlertsEnabled !== false) {
                            const waMsg = isAr
                                ? `🌍 *مهمة عامة جديدة [${companyLabel}]*\n\nالمهمة: ${text}\n\nيرجى الاطلاع والقبول في لوحة المهام.`
                                : `🌍 *New General Task [${companyLabel}]*\n\nTask: ${text}\n\nPlease open task board to accept.`;
                            sendWhatsAppDirect(w.phone, waMsg);
                        }
                    });
                }
            })
            .catch(err => console.error("Error creating general task:", err));
        return;
    }

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    if (!worker.jobs) worker.jobs = [];
    worker.jobs.push({
        id: Date.now().toString(),
        taskNum: assignedTaskNum,
        title: text,
        date: formatTimestamp(),
        timestamp: Date.now(),
        urgency: urgency,
        deadlineMins: deadlineMins,
        status: 'assigned', // new states: assigned, seen, completed
        done: false, // legacy flag
        assignedByEmail: currentUser ? (currentUser.email || '') : '',
        assignedByName: currentUser ? (currentUser.displayName || currentUser.email || 'Manager') : 'Manager',
        assignedById: activeWorker ? activeWorker.id : ''
    });

    document.getElementById('task-assign-input').value = '';
    if (document.getElementById('task-deadline')) document.getElementById('task-deadline').value = '';
    if (document.getElementById('task-urgency')) document.getElementById('task-urgency').value = 'normal';

    // Targeted write to worker jobs path
    db.ref(`companies/${currentCompany}/workers/${workerIndex}/jobs`).set(worker.jobs)
        .then(() => {
            logActivity('task', worker.id, worker.name, `Assigned task ${assignedTaskNum} to ${worker.name}: "${text}"`);
            
            const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

            // 1. Check if worker has phone number
            if (!worker.phone) {
                alert(isAr 
                    ? `⚠️ تنبيه: تم حفظ المهمة بنجاح، لكن الموظف (${worker.name}) ليس لديه رقم هاتف مسجل في ملفه! يرجى إضافة رقم الهاتف لإرسال وتساب.`
                    : `⚠️ Notice: Task saved, but worker (${worker.name}) does not have a phone number in their profile! Please add a phone number to send WhatsApp.`);
                return;
            }

            // 2. Check if WhatsApp alerts are disabled for this worker
            if (worker.waAlertsEnabled === false) {
                console.warn(`WhatsApp alerts disabled for worker ${worker.name}`);
                return;
            }

            // 3. Dispatch WhatsApp message and check response feedback
            if (typeof sendWhatsAppDirect === 'function') {
                const companyLabel = (typeof currentCompany !== 'undefined' ? currentCompany : '').toUpperCase();
                const waMsg = isAr 
                    ? `📋 *مهمة جديدة أسندت إليك [${companyLabel}]*\n\nالموظف: ${worker.name}\nالمهمة: ${text}\n\nيرجى فتح لوحة المهام للإنجاز.`
                    : `📋 *New Task Assigned [${companyLabel}]*\n\nWorker: ${worker.name}\nTask: ${text}\n\nPlease open your task board to complete it.`;
                
                sendWhatsAppDirect(worker.phone, waMsg).then(res => {
                    if (res && res.error) {
                        alert(isAr 
                            ? `⚠️ تم حفظ المهمة في اللوحة، ولكن فشل إرسال الوتساب:\n"${res.error}"\n\nيرجى التأكد من ربط الوتساب في قسم (💬 المراسلة).`
                            : `⚠️ Task saved in app, but WhatsApp delivery failed:\n"${res.error}"\n\nPlease check WhatsApp connection in 💬 Messaging.`);
                    } else if (res && res.success) {
                        console.log(`✅ WhatsApp task notification delivered directly to ${worker.name} (${worker.phone})`);
                    }
                });
            }
        })
        .catch(err => console.error("Error assigning task:", err));
}

function seeTask(workerId, taskId) {
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const t = worker.jobs.find(j => j.id === taskId);
    if (t) {
        if (t.isTracked || t.trackedTaskId) {
            if (typeof seeTrackedTask === 'function') seeTrackedTask(t.trackedTaskId || t.id);
            return;
        }
        t.status = 'seen';
        t.seenAt = Date.now();

        // Targeted write to worker jobs path
        db.ref(`companies/${currentCompany}/workers/${workerIndex}/jobs`).set(worker.jobs)
            .catch(err => console.error("Error seeing task:", err));
    }
}

function completeTask(workerId, taskId) {
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const t = worker.jobs.find(j => j.id === taskId);
    if (t) {
        if (t.isTracked || t.trackedTaskId) {
            if (typeof finishTrackedTask === 'function') finishTrackedTask(t.trackedTaskId || t.id);
            return;
        }
        t.status = 'completed';
        t.done = true;
        t.completedAt = Date.now();

        // Targeted write to worker jobs path
        db.ref(`companies/${currentCompany}/workers/${workerIndex}/jobs`).set(worker.jobs)
            .then(() => {
                logActivity('task', worker.id, worker.name, `${worker.name} completed task: "${t.title}"`);
            })
            .catch(err => console.error("Error completing task:", err));
    }
}

function toggleTaskDone(workerId, taskId) {
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const t = worker.jobs.find(j => j.id === taskId);
    if (t) {
        t.done = !t.done;
        if (!t.done) {
            t.status = 'seen'; // revert back to seen
        } else {
            t.status = 'completed';
            t.completedAt = Date.now();
        }

        // Targeted write to worker jobs path
        db.ref(`companies/${currentCompany}/workers/${workerIndex}/jobs`).set(worker.jobs)
            .then(() => {
                logActivity('task', worker.id, worker.name, `${worker.name} toggled task: "${t.title}" (Status: ${t.status})`);
            })
            .catch(err => console.error("Error toggling task done:", err));
    }
}

function deleteTask(workerId, taskId) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? "هل أنت تأكد من حذف هذه المهمة؟" : "Delete this task?")) return;

    const workers = getCompanyData().workers || [];
    const workerIndex = workers.findIndex(w => String(w.id) === String(workerId));
    if (workerIndex === -1) return;
    const worker = workers[workerIndex];
    if (!worker.jobs) worker.jobs = [];

    const targetStr = String(taskId);
    const oldTask = worker.jobs.find(j => j && String(j.id) === targetStr);
    worker.jobs = worker.jobs.filter(j => j && String(j.id) !== targetStr);

    // Re-render UI immediately to prevent freezing
    renderAll();

    // Targeted write to worker jobs path
    db.ref(`companies/${currentCompany}/workers/${workerIndex}/jobs`).set(worker.jobs)
        .then(() => {
            if (oldTask) {
                logActivity('task_delete', worker.id, worker.name, `Deleted task for ${worker.name}: "${oldTask.title}"`);
            }
            renderAll();
        })
        .catch(err => {
            console.error("Error deleting task:", err);
            renderAll();
        });
}

function toggleTasksCustomRange() {
    const tf = document.getElementById('tasks-filter-timeframe') ? document.getElementById('tasks-filter-timeframe').value : 'all';
    const div = document.getElementById('tasks-custom-range');
    if (div) {
        div.style.display = tf === 'custom' ? 'flex' : 'none';
    }
}
window.toggleTasksCustomRange = toggleTasksCustomRange;

function getJobTimestamp(j) {
    if (!j) return 0;
    if (typeof j.timestamp === 'number' && j.timestamp > 0) return j.timestamp;
    if (typeof j.createdAt === 'number' && j.createdAt > 0) return j.createdAt;
    if (typeof j.id === 'string' && j.id.startsWith('tt-')) {
        const ts = parseInt(j.id.replace('tt-', ''));
        if (!isNaN(ts) && ts > 1000000000000) return ts;
    }
    const parsedId = parseInt(j.id);
    if (!isNaN(parsedId) && parsedId > 1000000000000) return parsedId;
    if (j.date) {
        if (typeof j.date === 'string' && j.date.includes('/')) {
            const parts = j.date.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                const year = parseInt(parts[2]);
                const d = new Date(year, month, day);
                if (!isNaN(d.getTime())) return d.getTime();
            }
        }
        const parsedDate = Date.parse(j.date);
        if (!isNaN(parsedDate)) return parsedDate;
    }
    return 0;
}

function getVisibleWorkers() {
    const companyData = getCompanyData();
    const allWorkers = companyData.workers || [];
    if (!currentUser) return allWorkers;
    if (currentUser.role === 'admin') return allWorkers;

    const activeWorker = getActiveWorker();

    // Check if worker has task access (perm-tasks class on body or perms object or currentUser perms)
    const hasTaskAccess = document.body.classList.contains('perm-tasks') ||
        (activeWorker && activeWorker.perms && (activeWorker.perms.tasks === true || activeWorker.perms.tasks === 'true')) ||
        (currentUser && currentUser.perms && (currentUser.perms.tasks === true || currentUser.perms.tasks === 'true'));

    if (hasTaskAccess || !activeWorker) {
        return allWorkers;
    }
    return [activeWorker];
}
window.getVisibleWorkers = getVisibleWorkers;

function renderTasks() {
    const isAr = currentAppLang === 'ar';
    // Render Templates & Shortcut Pills
    const tList = document.getElementById('task-template-list');
    const dList = document.getElementById('task-datalist');
    const pList = document.getElementById('task-shortcuts-pills');
    if (tList || dList || pList) {
        if (tList) tList.innerHTML = '';
        if (dList) dList.innerHTML = '';
        if (pList) pList.innerHTML = '';
        const catalog = getCompanyData().jobCatalog || [];
        catalog.forEach(m => {
            if (dList) {
                const opt = document.createElement('option'); opt.value = m; dList.appendChild(opt);
            }
            if (tList) {
                const div = document.createElement('div'); div.className = "flex-between list-item";
                div.innerHTML = `<span style="font-size:0.9rem; font-weight:600;">${m}</span> <button type="button" class="btn-outline-danger" style="padding: 2px 6px; font-size: 0.75rem; border:none;" onclick="deleteTaskTemplate('${m}')">✖</button>`;
                tList.appendChild(div);
            }
            if (pList) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'badge';
                btn.style.cssText = 'background:var(--input-bg); color:var(--primary); border:1px solid var(--border-color); padding:4px 10px; font-size:0.8rem; font-weight:600; cursor:pointer; border-radius:20px; transition:var(--transition);';
                btn.innerHTML = `⚡ ${m}`;
                btn.onclick = () => fillTaskShortcut(m);
                pList.appendChild(btn);
            }
        });
    }

    // Populate Assign Dropdown
    const assignSel = document.getElementById('task-worker-select');
    if (assignSel) {
        const oldVal = assignSel.value;
        const companyData = getCompanyData();

        assignSel.innerHTML = `
            <option value="">-- ${t('opt-choose-emp')} --</option>
            <option value="general">🌍 ${t('opt-general-task')}</option>
        `;

        const groups = companyData.taskGroups || [];
        if (groups.length > 0) {
            const groupOptGroup = document.createElement('optgroup');
            groupOptGroup.label = isAr ? 'المجموعات' : 'Groups';
            groups.forEach(g => {
                const opt = document.createElement('option');
                opt.value = `group_${g.id}`;
                opt.textContent = `👥 ${g.name}`;
                groupOptGroup.appendChild(opt);
            });
            assignSel.appendChild(groupOptGroup);
        }

        const workerOptGroup = document.createElement('optgroup');
        workerOptGroup.label = isAr ? 'الموظفين' : 'Employees';
        companyData.workers.forEach(w => {
            const opt = document.createElement('option');
            opt.value = w.id;
            opt.textContent = w.name;
            workerOptGroup.appendChild(opt);
        });
        assignSel.appendChild(workerOptGroup);
        assignSel.value = oldVal;
    }

    // Populate Worker Filter Dropdown
    const workerFilterSel = document.getElementById('tasks-filter-worker');
    if (workerFilterSel) {
        const oldFilterVal = workerFilterSel.value;
        const visibleWorkers = getVisibleWorkers();
        workerFilterSel.innerHTML = `<option value="all">${isAr ? '👥 جميع الموظفين' : '👥 All Workers'}</option>`;
        visibleWorkers.forEach(w => {
            const opt = document.createElement('option');
            opt.value = w.id;
            opt.textContent = w.name;
            workerFilterSel.appendChild(opt);
        });
        if (oldFilterVal && Array.from(workerFilterSel.options).some(o => o.value === oldFilterVal)) {
            workerFilterSel.value = oldFilterVal;
        }
    }

    renderTaskGroups();

    // Render Board (Filtered for user)
    const board = document.getElementById('tasks-board-list');
    if (!board) return;
    board.innerHTML = '';

    const isAdmin = currentUser && currentUser.role === 'admin';
    const data = getCompanyData();
    const activeWorker = typeof getActiveWorker === 'function' ? getActiveWorker() : null;
    const canEditTask = isAdmin || document.body.classList.contains('perm-tasks') || (activeWorker && activeWorker.perms && (activeWorker.perms.tasks === true || activeWorker.perms.tasks === 'true')) || (currentUser && currentUser.perms && (currentUser.perms.tasks === true || currentUser.perms.tasks === 'true'));

    // Gating filter controls bar and filter inputs for task managers only
    const filterControlsBar = document.getElementById('tasks-filter-controls-bar');
    if (filterControlsBar) {
        filterControlsBar.style.display = canEditTask ? 'flex' : 'none';
    }
    const searchContainer = document.getElementById('tasks-search-container');
    if (searchContainer) {
        searchContainer.style.display = canEditTask ? 'block' : 'none';
    }
    const statusFilterContainer = document.getElementById('tasks-status-filter-container');
    if (statusFilterContainer) {
        statusFilterContainer.style.display = canEditTask ? 'block' : 'none';
    }
    const workerFilterContainer = document.getElementById('tasks-worker-filter-container');
    if (workerFilterContainer) {
        workerFilterContainer.style.display = canEditTask ? 'block' : 'none';
    }
    const timeframeFilterContainer = document.getElementById('tasks-timeframe-filter-container');
    if (timeframeFilterContainer) {
        timeframeFilterContainer.style.display = canEditTask ? 'block' : 'none';
    }

    // Ensure all existing & new tasks have assigned task numbers
    ensureTaskNumbers();

    if (typeof setupSearchInputClearButtons === 'function') {
        setupSearchInputClearButtons();
    }

    // Gather Filter Values
    const statusFilter = document.getElementById('tasks-filter-status') ? document.getElementById('tasks-filter-status').value : 'all';
    const selectedWorkerId = document.getElementById('tasks-filter-worker') ? document.getElementById('tasks-filter-worker').value : 'all';
    const timeframeFilter = document.getElementById('tasks-filter-timeframe') ? document.getElementById('tasks-filter-timeframe').value : 'all';
    const fromInput = document.getElementById('tasks-from-date') ? document.getElementById('tasks-from-date').value : '';
    const toInput = document.getElementById('tasks-to-date') ? document.getElementById('tasks-to-date').value : '';
    const searchQuery = document.getElementById('tasks-search-input') ? document.getElementById('tasks-search-input').value.trim().toLowerCase() : '';

    const now = Date.now();
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const monthAgo = now - (30 * 24 * 60 * 60 * 1000);
    const fromMs = fromInput ? new Date(fromInput).setHours(0, 0, 0, 0) : 0;
    const toMs = toInput ? new Date(toInput).setHours(23, 59, 59, 999) : Infinity;

    // Helper: Date filter matching
    const passesDateFilter = (timestamp) => {
        if (timeframeFilter === 'today') return timestamp >= startOfToday;
        if (timeframeFilter === 'week') return timestamp >= weekAgo;
        if (timeframeFilter === 'month') return timestamp >= monthAgo;
        if (timeframeFilter === 'custom') return timestamp >= fromMs && timestamp <= toMs;
        return true;
    };

    // Helper: Search filter matching (task number 3 or title text)
    const passesSearchFilter = (task) => {
        if (!searchQuery) return true;
        const cleanQuery = searchQuery.replace(/^#/, '');
        const taskNumStr = String(task.taskNum || '');
        const titleStr = (task.title || '').toLowerCase();
        return taskNumStr === cleanQuery || titleStr.includes(searchQuery) || titleStr.includes(cleanQuery);
    };

    // Calculate Statistics across all visible tasks matching date & worker filters
    let totalAssigned = 0;
    let completedCount = 0;
    let pendingCount = 0;

    let visibleWorkers = getVisibleWorkers();
    if (selectedWorkerId !== 'all') {
        visibleWorkers = visibleWorkers.filter(w => w.id === selectedWorkerId);
    }

    visibleWorkers.forEach(w => {
        (w.jobs || []).forEach(j => {
            const jTs = getJobTimestamp(j);
            if (passesDateFilter(jTs) && passesSearchFilter(j)) {
                totalAssigned++;
                const isDone = j.status === 'completed' || j.done;
                if (isDone) completedCount++;
                else pendingCount++;
            }
        });
    });

    // Update Statistics Banner UI
    const statsTitleEl = document.getElementById('task-stats-title');
    const totalEl = document.getElementById('task-stats-total');
    const completedEl = document.getElementById('task-stats-completed');
    const pendingEl = document.getElementById('task-stats-pending');
    const badgeEl = document.getElementById('task-stats-completion-badge');

    if (statsTitleEl && totalEl && completedEl && pendingEl && badgeEl) {
        if (selectedWorkerId !== 'all') {
            const targetW = data.workers ? data.workers.find(w => w.id === selectedWorkerId) : null;
            const nameStr = targetW ? targetW.name : '';
            statsTitleEl.textContent = isAr ? `إحصائيات المهام للموظف: ${nameStr}` : `Task Statistics for ${nameStr}`;
        } else {
            statsTitleEl.textContent = isAr ? 'إحصائيات مهام الفريق' : 'Team Task Statistics';
        }

        totalEl.textContent = totalAssigned;
        completedEl.textContent = completedCount;
        pendingEl.textContent = pendingCount;
        const pct = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;
        badgeEl.textContent = `${isAr ? 'نسبة الإنجاز: ' : 'Completion Rate: '}${pct}%`;
    }

    // Render General Tasks at top of board (if not filtering for a specific worker)
    if (selectedWorkerId === 'all') {
        const rawGenTasks = data.generalTasks || {};
        const generalTasks = Array.isArray(rawGenTasks) ? rawGenTasks : Object.values(rawGenTasks);
        let pendingGeneralTasks = generalTasks.filter(gt => {
            if (!gt || gt.status !== 'pending') return false;
            if (!passesDateFilter(getJobTimestamp(gt))) return false;
            if (!passesSearchFilter(gt)) return false;
            if (canEditTask) return true; // Admin and managers with task access see ALL general tasks!
            if (!gt.targetGroupId) return true; // Available to everyone

            const groups = data.taskGroups || [];
            const group = groups.find(g => g.id === gt.targetGroupId);
            if (group && group.members && activeWorker) {
                return group.members.includes(activeWorker.id);
            }
            return false;
        });

        // Sort General tasks newest first
        pendingGeneralTasks.sort((a, b) => getJobTimestamp(b) - getJobTimestamp(a));

        // Render Pending Inquiries for Active Worker (if any)
        const rawInquiries = data.inquiries || {};
        const allInquiries = Object.values(rawInquiries);
        const workerPendingInquiries = allInquiries.filter(inq => {
            if (!inq || inq.status !== 'pending') return false;
            if (activeWorker) {
                return String(inq.workerId) === String(activeWorker.id) || inq.workerId === 'all';
            }
            return false;
        });

        // Render Pending Spy Inspections for Active Worker
        const rawTracked = data.trackedTasks || {};
        const allTracked = Object.values(rawTracked);

        const spyPendingTasks = allTracked.filter(tt => {
            if (!tt || tt.status !== 'pending_spy_verification') return false;
            if (activeWorker) {
                return String(tt.spyWorkerId) === String(activeWorker.id);
            }
            return false;
        });

        if (spyPendingTasks.length > 0) {
            const spyCard = document.createElement('div');
            spyCard.className = "card";
            spyCard.style.padding = "20px";
            spyCard.style.marginBottom = "16px";
            spyCard.style.border = "2px dashed #f59e0b";
            spyCard.style.background = "rgba(245, 158, 11, 0.08)";

            let spyHtml = `<h3 style="margin-top:0; color:#f59e0b; display:flex; align-items:center; gap:8px; font-size:1.15rem;">🕵️ ${isAr ? 'مهام تطلب التحقق والرقابة الميدانية منك (سباي)' : 'Spy Verifications & Inspections Required'}</h3>`;

            spyPendingTasks.forEach(tt => {
                const finishedTime = tt.finishedAt ? new Date(tt.finishedAt).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '';
                const rejCount = tt.rejectionCount || 0;
                const rejBadge = rejCount > 0 ? `<span class="badge" style="background:#ef4444; color:white; font-weight:800; font-size:0.8rem; margin-left:6px;">${'❌'.repeat(rejCount)} (${isAr ? 'تم رفضها سابقاً' : 'Rejected'} ${rejCount}x)</span>` : '';

                let actionButtons = '';
                if (rejCount < 2) {
                    actionButtons = `
                        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
                            <button type="button" onclick="spyConfirmTask('${tt.id}')" class="btn-success" style="padding:10px 18px; border-radius:8px; font-weight:800; font-size:0.85rem; background:linear-gradient(135deg, #10b981, #059669); color:white; border:none; cursor:pointer; flex:1; min-width:140px;">
                                ✅ ${isAr ? 'تأكيد الإنجاز الصحيح (Confirm Done)' : '✅ Confirm Task Done'}
                            </button>
                            <button type="button" onclick="spyRejectTask('${tt.id}')" class="btn-danger" style="padding:10px 18px; border-radius:8px; font-weight:800; font-size:0.85rem; background:linear-gradient(135deg, #ef4444, #dc2626); color:white; border:none; cursor:pointer; flex:1; min-width:140px;">
                                ❌ ${isAr ? 'رفض المهمة وإعادتها (Worker Lying)' : '❌ Reject Task (Worker Lying)'}
                            </button>
                        </div>
                    `;
                } else {
                    actionButtons = `
                        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 10px; padding: 12px; margin-top: 12px;">
                            <div style="font-weight: 800; color: #ef4444; font-size: 0.88rem; margin-bottom: 8px;">🚨 ${isAr ? 'تحذير: الموظف كرر الرفض مرتين! اختر الإجراء النهائي:' : 'Warning: Task rejected twice! Choose final escalation action:'}</div>
                            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                                <button type="button" onclick="spyReportWorkerToManager('${tt.id}')" class="btn-warning" style="padding:10px 16px; border-radius:8px; font-weight:800; font-size:0.85rem; background:linear-gradient(135deg, #f59e0b, #d97706); color:white; border:none; cursor:pointer; flex:1; min-width:160px;">
                                    📢 ${isAr ? 'إبلاغ الإدارة عن الموظف (Report Worker)' : '📢 Report Worker to Manager'}
                                </button>
                                <button type="button" onclick="spyApplyViolation('${tt.id}')" class="btn-danger" style="padding:10px 16px; border-radius:8px; font-weight:800; font-size:0.85rem; background:linear-gradient(135deg, #dc2626, #991b1b); color:white; border:none; cursor:pointer; flex:1; min-width:160px;">
                                    ⚖️ ${isAr ? 'تطبيق مخالفة على الموظف (Take Action)' : '⚖️ Take Action (Apply Violation)'}
                                </button>
                            </div>
                        </div>
                    `;
                }

                const finishedTimeMs = tt.finishedAt || Date.now();
                const spyDeadlineMs = finishedTimeMs + ((tt.spyWindowMins || 20) * 60000);

                spyHtml += `
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:16px; margin-bottom:12px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:6px;">
                            <span style="font-size:0.8rem; color:var(--text-muted);">🕒 Completed by worker at ${finishedTime}</span>
                            ${rejBadge}
                        </div>
                        <div style="font-size:1.05rem; font-weight:800; color:var(--text-main); margin-bottom:6px;">🕵️ ${tt.title}</div>
                        <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:8px;">👤 ${isAr ? 'الموظف المنفذ:' : 'Target Worker:'} <strong style="color:var(--text-main);">${tt.workerName}</strong></div>
                        <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); padding: 8px 12px; border-radius: 8px; margin-bottom: 10px; font-weight: 800; font-size: 0.85rem; color: #d97706; display: flex; align-items: center; justify-content: space-between;">
                            <span>⏳ ${isAr ? 'الوقت المتبقي للمراقب لاتخاذ إجراء:' : 'Time remaining for spy to act:'}</span>
                            <span class="task-timer-display" data-deadline="${spyDeadlineMs}" style="font-weight: 900; color: #ef4444;"></span>
                        </div>
                        ${actionButtons}
                    </div>
                `;
            });

            spyCard.innerHTML = spyHtml;
            board.appendChild(spyCard);
        }

        // Render Spy Inaction Alerts & Escalation Reports for Admins / Managers
        if (canEditTask) {
            const inactionTasks = allTracked.filter(tt => tt && !tt.alertDismissed && (tt.spyInactionAlertSent || tt.status === 'reported' || tt.status === 'violated' || tt.status === 'violated_system'));
            if (inactionTasks.length > 0) {
                const alertCard = document.createElement('div');
                alertCard.className = "card";
                alertCard.style.padding = "20px";
                alertCard.style.marginBottom = "16px";
                alertCard.style.border = "2px solid #ef4444";
                alertCard.style.background = "rgba(239, 68, 68, 0.08)";

                let alertHtml = `<h3 style="margin-top:0; color:#ef4444; display:flex; align-items:center; gap:8px; font-size:1.15rem;">🚨 ${isAr ? 'تنبيهات وتصعيدات المهام المتتبعة' : 'Tracked Tasks Inaction & Escalation Alerts'}</h3>`;

                inactionTasks.forEach(tt => {
                    let alertType = '';
                    let customReportMsg = '';
                    const vAmt = tt.violationAmount || 50;

                    const reportTs = tt.reportedAt || tt.inactionAlertAt || tt.violatedAt || tt.createdAt;
                    const reportDateStr = reportTs ? new Date(reportTs).toLocaleString(isAr ? 'ar-EG' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

                    if (tt.status === 'reported') {
                        alertType = `<span class="badge" style="background:#f59e0b; color:white;">📢 ${isAr ? 'بلاغ مراقب عن عدم التزام موظف' : 'Worker Reported by Spy'}</span>`;
                    } else if (tt.status === 'violated') {
                        alertType = `<span class="badge" style="background:#dc2626; color:white;">⚖️ ${isAr ? `مخالفة عادية (${vAmt} SAR)` : `${vAmt} SAR Violation Applied`}</span>`;
                    } else if (tt.status === 'violated_system') {
                        alertType = `<span class="badge" style="background:#7c3aed; color:white;">🚨 ${isAr ? 'مخالفة نظامية' : 'System Violation Applied'}</span>`;
                    } else if (tt.spyInactionAlertSent) {
                        alertType = `<span class="badge" style="background:#ef4444; color:white;">🚨 ${isAr ? 'بلاغ تقاعس المراقب' : 'Spy Inaction Report'}</span>`;
                        customReportMsg = `<div style="font-weight:800; color:#ef4444; font-size:0.9rem; margin-top:4px;">🚨 ${isAr ? `المراقب ${tt.spyWorkerName} لم يتخذ أي إجراء على مهمة "${tt.title}" للموظف ${tt.workerName}` : `Spy ${tt.spyWorkerName} didn't take any action on task "${tt.title}" assigned to worker ${tt.workerName}`}</div>`;
                    }

                    let managerActionButtons = '';
                    if (tt.status === 'reported' || (tt.spyInactionAlertSent && tt.status !== 'violated' && tt.status !== 'violated_system')) {
                        managerActionButtons = `
                            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px; padding-top:10px; border-top:1px dashed var(--border-color);" onclick="event.stopPropagation()">
                                <button type="button" onclick="managerApplyTrackedViolation('${tt.id}')" class="btn-danger" style="padding:8px 16px; border-radius:8px; font-weight:800; font-size:0.82rem; background:linear-gradient(135deg, #dc2626, #991b1b); color:white; border:none; cursor:pointer; flex:1; min-width:140px;">
                                    ⚖️ ${isAr ? `تطبيق المخالفة العادية (${vAmt} SAR)` : `Apply Violation (${vAmt} SAR)`}
                                </button>
                                <button type="button" onclick="managerApplyTrackedSystemViolation('${tt.id}')" class="btn-danger" style="padding:8px 16px; border-radius:8px; font-weight:800; font-size:0.82rem; background:linear-gradient(135deg, #7c3aed, #4c1d95); color:white; border:none; cursor:pointer; flex:1; min-width:160px;">
                                    🚨 ${isAr ? 'تطبيق مخالفة نظامية' : 'Apply System Violation'}
                                </button>
                            </div>
                        `;
                    }

                    alertHtml += `
                        <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:14px; margin-bottom:10px; cursor:pointer;" onclick="openTrackedTaskAuditModal('${tt.id}')" title="${isAr ? 'انقر لفتح التقرير الزمني والتفصيلي الشامل' : 'Click to open detailed audit HUD timeline'}">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                                <div style="flex:1;">
                                    <div style="margin-bottom:4px; display:flex; align-items:center; flex-wrap:wrap; gap:6px;">
                                        ${alertType}
                                        <strong style="font-size:0.95rem; color:var(--text-main);">${tt.title}</strong>
                                        <span style="font-size:0.78rem; color:var(--text-muted); font-weight:700; background:var(--input-bg); padding:2px 8px; border-radius:6px; border:1px solid var(--border-color);">🕒 ${reportDateStr}</span>
                                    </div>
                                    <div style="font-size:0.8rem; color:var(--text-muted);">👤 ${isAr ? 'المنفذ:' : 'Worker:'} <strong style="color:var(--text-main);">${tt.workerName}</strong> | 🕵️ ${isAr ? 'المراقب:' : 'Spy:'} <strong style="color:var(--text-main);">${tt.spyWorkerName}</strong></div>
                                    ${customReportMsg}
                                </div>
                                <div style="display:flex; align-items:center; gap:8px;" onclick="event.stopPropagation()">
                                    <button type="button" onclick="openTrackedTaskAuditModal('${tt.id}')" class="btn-outline" style="padding:6px 12px; border-radius:8px; font-weight:800; font-size:0.8rem; cursor:pointer; border:1px solid #3b82f6; color:#3b82f6; background:rgba(59,130,246,0.1);">📊 ${isAr ? 'الجدول الزمني' : 'Audit Timeline'}</button>
                                    <button type="button" onclick="dismissTrackedTaskAlert('${tt.id}')" style="background:rgba(239, 68, 68, 0.15); border:1px solid rgba(239, 68, 68, 0.4); color:#ef4444; cursor:pointer; font-size:1.1rem; padding:6px 12px; border-radius:8px; font-weight:800;" title="${isAr ? 'حذف / إخفاء التنبيه' : 'Dismiss Alert'}">✖</button>
                                </div>
                            </div>
                            ${managerActionButtons}
                        </div>
                    `;
                });

                alertCard.innerHTML = alertHtml;
                board.appendChild(alertCard);
            }
        }

        if (workerPendingInquiries.length > 0) {
            const inqCard = document.createElement('div');
            inqCard.className = "card";
            inqCard.style.padding = "20px";
            inqCard.style.marginBottom = "16px";
            inqCard.style.border = "2px dashed #8b5cf6";
            inqCard.style.background = "rgba(139, 92, 246, 0.08)";

            let inqHtml = `<h3 style="margin-top:0; color:#8b5cf6; display:flex; align-items:center; gap:8px; font-size:1.15rem;">❓ ${isAr ? 'استفسارات الإدارة الموجهة إليك' : 'Pending Manager Inquiries for You'}</h3>`;

            workerPendingInquiries.forEach(inq => {
                const dateStr = inq.createdAt ? new Date(inq.createdAt).toLocaleString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
                const safeQuestion = typeof escapeHtml === 'function' ? escapeHtml(inq.question) : (inq.question || '');

                inqHtml += `
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:16px; margin-bottom:12px;">
                        <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px;">🕒 ${dateStr}</div>
                        <div style="font-size:1.05rem; font-weight:700; color:var(--text-main); margin-bottom:12px; line-height:1.4;">❓ ${safeQuestion}</div>
                        
                        <div style="margin-bottom:12px;">
                            <textarea id="inquiry-reply-text-${inq.id}" rows="2" placeholder="${isAr ? 'اكتب تفاصيل الإجابة أو التوضيح هنا (اختياري)...' : 'Write reply details or explanation here (optional)...'}" style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid var(--border-color); background:var(--input-bg); color:var(--text-main); font-size:0.85rem; font-family:inherit;"></textarea>
                        </div>

                        <div style="display:flex; gap:10px; flex-wrap:wrap;">
                            <button type="button" onclick="replyToInquiry('${inq.id}', 'did_it')" class="btn-success" style="padding:10px 18px; border-radius:8px; font-weight:800; font-size:0.85rem; background:linear-gradient(135deg, #10b981, #059669); color:white; border:none; cursor:pointer; flex:1; min-width:140px; display:flex; align-items:center; justify-content:center; gap:6px;">
                                ${isAr ? '✅ تم الإنجاز (Did It)' : '✅ Did It'}
                            </button>
                            <button type="button" onclick="replyToInquiry('${inq.id}', 'did_not_do_it')" class="btn-danger" style="padding:10px 18px; border-radius:8px; font-weight:800; font-size:0.85rem; background:linear-gradient(135deg, #ef4444, #dc2626); color:white; border:none; cursor:pointer; flex:1; min-width:140px; display:flex; align-items:center; justify-content:center; gap:6px;">
                                ${isAr ? '❌ لم أقم به (Did Not Do It)' : '❌ Did Not Do It'}
                            </button>
                        </div>
                    </div>
                `;
            });

            inqCard.innerHTML = inqHtml;
            board.appendChild(inqCard);
        }

        if (pendingGeneralTasks.length > 0 && statusFilter !== 'completed') {
            const genCard = document.createElement('div');
            genCard.className = "card";
            genCard.style.padding = "20px";
            genCard.style.marginBottom = "16px";
            genCard.style.border = "2px dashed var(--warning)";
            genCard.style.background = "var(--warning-bg)";

            let genHtml = `<h3 style="margin-top:0; color:var(--warning); display:flex; align-items:center; gap:8px; font-size:1.15rem;">🌍 ${t('title-available-general-tasks')}</h3>`;

            pendingGeneralTasks.forEach(gt => {
                const urgencyBadge = gt.urgency === 'urgent' ? `<span class="badge" style="background:var(--danger); margin-left:8px;">🔴 ${t('opt-urgency-high').replace('🔴 ', '')}</span>` : '';
                const groupBadge = gt.targetGroupName ? `<span class="badge" style="background:var(--primary); margin-left:8px; color:white;">👥 ${gt.targetGroupName}</span>` : '';
                const deadlineText = gt.deadlineMins > 0 ? `<div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">⏱️ ${t('status-time-remaining').replace('⏳ ', '')} ${gt.deadlineMins} mins</div>` : '';
                const taskNumBadge = `<span class="badge" style="background:#2563eb; color:#ffffff; font-weight:700; font-size:0.85rem; padding:3px 9px; border-radius:6px; margin-right:6px; box-shadow:0 1px 3px rgba(37,99,235,0.25);" title="Task ${gt.taskNum || 1}">${gt.taskNum || 1}</span>`;

                let actionBtn = '';
                if (!isAdmin) {
                    actionBtn = `<button onclick="acceptGeneralTask('${gt.id}')" class="btn-warning" style="padding:8px 16px; font-size:0.85rem; min-height: unset; height: auto;">📥 ${t('btn-accept-task')}</button>`;
                } else {
                    const labelText = gt.targetGroupName ? `${t('label-available-all-workers')} (${gt.targetGroupName})` : t('label-available-all-workers');
                    actionBtn = `
                        <div style="display:flex; gap:8px; align-items:center;">
                            <span style="font-size:0.8rem; color:var(--text-muted); font-style:italic;">${labelText}</span>
                            <button onclick="openEditTaskModal('general', '${gt.id}', true)" style="background:none; border:none; color: var(--secondary); cursor:pointer; font-size:1.1rem; padding:0 4px;" title="${isAr ? 'تعديل المهمة' : 'Edit Task'}">✏️</button>
                            <button onclick="deleteGeneralTask('${gt.id}')" style="background:none; border:none; color: var(--danger); cursor:pointer; font-size:1.2rem; padding:0 4px;" title="${t('btn-remove')}">✖</button>
                        </div>`;
                }

                const genDblClickAttr = canEditTask ? `ondblclick="if (!event.target.closest('button') && !event.target.closest('input')) openEditTaskModal('general', '${gt.id}', true)" title="${isAr ? 'انقر مرتين للتعديل' : 'Double-click to edit'}"` : '';

                genHtml += `
                    <div class="general-task-item" ${genDblClickAttr} style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:16px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; ${canEditTask ? 'cursor:pointer;' : ''}">
                        <div>
                            <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">Created: ${gt.date || new Date(getJobTimestamp(gt)).toLocaleString()}</div>
                            <div style="font-size:1.05rem; font-weight:700; color:var(--text-main); display:flex; align-items:center; flex-wrap:wrap; gap:6px;">${taskNumBadge} <span>${gt.title}</span> ${urgencyBadge} ${groupBadge}</div>
                            ${deadlineText}
                        </div>
                        <div>
                            ${actionBtn}
                        </div>
                    </div>
                `;
            });

            genCard.innerHTML = genHtml;
            board.appendChild(genCard);
        }
    }

    if (visibleWorkers.length === 0 && !isAdmin) {
        if (board.innerHTML === '') {
            board.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:20px;">${t('not-linked-worker')}</p>`;
        }
        return;
    }

    visibleWorkers.forEach(worker => {
        let constantTasks = worker.constantTasks || [];
        if (!Array.isArray(constantTasks)) constantTasks = Object.values(constantTasks);
        constantTasks = constantTasks.filter(ct => ct && (ct.id || ct.title));

        let jobs = worker.jobs ? [...worker.jobs] : [];

        // For Manager/Admin view: Tracked tasks in progress show as Pending without revealing worker completion until spy confirms
        // Tracked tasks stay visible in Manager view as ⏳ Pending until completed.

        if (jobs.length === 0 && constantTasks.length === 0) return;

        // Apply Status Filter
        if (statusFilter === 'completed') {
            jobs = jobs.filter(j => j.status === 'completed' || j.done);
        } else if (statusFilter === 'incomplete') {
            jobs = jobs.filter(j => j.status !== 'completed' && !j.done);
        }

        // Apply Date Filter & Search Query Filter
        jobs = jobs.filter(j => passesDateFilter(getJobTimestamp(j)) && passesSearchFilter(j));

        // Sort Newest Tasks to the Top
        jobs.sort((a, b) => getJobTimestamp(b) - getJobTimestamp(a));

        // Render Constant Responsibilities & Tasks Banner for Worker
        let constantTasksHtml = '';
        if (constantTasks.length > 0) {
            constantTasksHtml = `
                <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), var(--input-bg)); border: 1px solid rgba(99, 102, 241, 0.25); border-left: 4px solid #6366f1; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px;">
                    <div style="font-weight: 800; font-size: 0.88rem; color: #6366f1; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
                        <span>📌 ${isAr ? 'المهام والمسؤوليات المستمرة المكلف بها:' : 'Assigned Responsibilities & Constant Tasks:'}</span>
                        <span class="badge" style="background: #6366f1; color: white; font-size: 0.75rem; font-weight: 800; padding: 2px 8px; border-radius: 10px;">${constantTasks.length} ${isAr ? 'مسؤوليات' : 'Responsibilities'}</span>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${constantTasks.map(ct => `
                            <div style="background: var(--card-bg); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; align-items: center; gap: 8px; min-width: 180px; flex: 1;">
                                <span style="font-size: 1.1rem;">📌</span>
                                <div>
                                    <div style="font-weight: 800; font-size: 0.85rem; color: var(--text-main);">${ct.title}</div>
                                    <div style="font-size: 0.73rem; color: var(--text-muted);">📋 ${isAr ? 'الكمية / التكرار:' : 'Amount:'} <strong style="color: #6366f1;">${ct.amount || (isAr ? 'يومي' : 'Daily')}</strong></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        let jobsHtml = jobs.map(j => {
            const editBtn = isAdmin ? `<button onclick="openEditTaskModal('${worker.id}', '${j.id}')" style="background:none; border:none; color: var(--secondary); cursor:pointer; font-size:1rem; padding:0 4px;" title="${isAr ? 'تعديل المهمة' : 'Edit Task'}">✏️</button>` : '';
            const delBtn = isAdmin ? `<button onclick="deleteTask('${worker.id}', '${j.id}')" style="background:none; border:none; color: var(--danger); cursor:pointer; font-size:1.1rem; padding:0 4px;" title="Delete">✖</button>` : '';

            const status = j.status || (j.done ? 'completed' : 'assigned');
            const isAssignedToMe = (currentUser && worker.email && worker.email.toLowerCase() === currentUser.email.toLowerCase());

            let statusBadge = '';
            let actionHtml = '';
            let urgencyBadge = j.urgency === 'urgent' ? `<span class="badge" style="background:var(--danger); margin-left:8px;">🔴 ${t('opt-urgency-high').replace('🔴 ', '')}</span>` : '';
            let timeInfoHtml = '';

            const tt = (data.trackedTasks && (j.trackedTaskId || j.id)) ? data.trackedTasks[j.trackedTaskId || j.id] : null;
            const effectiveStatus = tt ? tt.status : (j.status || (j.done ? 'completed' : 'assigned'));

            let rejBadgesHtml = '';
            if (tt && tt.rejectionCount > 0) {
                rejBadgesHtml = `<span class="badge" style="background:#ef4444; color:white; margin-left:6px;" title="${isAr ? `مرفوضة ${tt.rejectionCount} مرة من المراقب` : `Rejected ${tt.rejectionCount} time(s) by spy`}">${'❌'.repeat(tt.rejectionCount)}</span>`;
            }

            if (effectiveStatus === 'completed' || j.done) {
                statusBadge = `<span class="badge badge-good">${t('btn-mark-completed').replace('✅ ', '')} ✅</span>`;
                actionHtml = isAdmin ? `<button onclick="toggleTaskDone('${worker.id}', '${j.id}')" class="btn-outline" style="font-size:0.75rem; padding:4px 8px;">${t('btn-undo-action')}</button>` : '';
                if (j.completedAt || (tt && tt.confirmedAt)) {
                    timeInfoHtml = `<div style="font-size:0.75rem; color:var(--success); margin-top:4px;">${t('label-finished')} ${new Date(j.completedAt || tt.confirmedAt).toLocaleTimeString()}</div>`;
                }
            } else if (effectiveStatus === 'reported') {
                statusBadge = `<span class="badge" style="background:#f59e0b; color:white;">📢 ${isAr ? 'تم الإبلاغ للإدارة' : 'Reported to Manager'}</span>`;
                actionHtml = `<span style="font-size:0.8rem; color:#f59e0b; font-weight:700;">📢 ${isAr ? 'تم تصعيد البلاغ للإدارة من قبل المراقب' : 'Reported to manager by spy worker'}</span>`;
            } else if (effectiveStatus === 'violated' || effectiveStatus === 'violated_system') {
                const isSys = effectiveStatus === 'violated_system';
                statusBadge = `<span class="badge" style="background:${isSys ? '#7c3aed' : '#dc2626'}; color:white;">${isSys ? '🚨' : '⚖️'} ${isAr ? (isSys ? 'مخالفة نظامية' : 'تم تطبيق المخالفة') : (isSys ? 'System Violation' : 'Violation Applied')}</span>`;
                actionHtml = `<span style="font-size:0.8rem; color:${isSys ? '#7c3aed' : '#dc2626'}; font-weight:700;">${isSys ? '🚨' : '⚖️'} ${isAr ? (isSys ? 'تم تطبيق مخالفة نظامية على الموظف' : 'تم خصم المخالفة من إحصائيات الموظف') : 'Violation recorded for non-compliance'}</span>`;
            } else if (effectiveStatus === 'pending_spy_verification') {
                if (isAdmin) {
                    statusBadge = `<span class="badge" style="background:#f59e0b; color:white;">🕵️ ${isAr ? 'تم التسليم (بانتظار تأكيد السباي)' : 'Submitted (Awaiting Spy)'}</span>`;
                    actionHtml = `<span style="font-size:0.8rem; color:#f59e0b; font-weight:700;">🕵️ ${isAr ? 'بانتظار تحقق المراقب الميداني' : 'Awaiting spy verification'} (${tt ? tt.spyWorkerName : (j.spyWorkerName || '')})</span>`;
                } else {
                    statusBadge = `<span class="badge" style="background:#f59e0b; color:white;">🕵️ ${isAr ? 'قيد التحقق الميداني' : 'Pending Spy Verification'}</span>`;
                    actionHtml = `<span style="font-size:0.8rem; color:#f59e0b; font-weight:700;">🕵️ ${isAr ? 'تم الإرسال للمراقب' : 'Sent to Spy Worker'} (${j.spyWorkerName || ''})</span>`;
                }
            } else if (effectiveStatus === 'seen') {
                if (tt && tt.rejectionCount > 0) {
                    statusBadge = `<span class="badge" style="background:#ef4444; color:white;">❌ ${isAr ? 'مرفوضة من المراقب' : 'Rejected by Spy'}</span>`;
                } else {
                    statusBadge = `<span class="badge" style="background:var(--warning); color:#000;">👀 ${t('status-pending-sm').replace('⏳ ', '')}</span>`;
                }
                if (isAssignedToMe) {
                    if (j.isTracked || j.trackedTaskId) {
                        actionHtml = `<button onclick="finishTrackedTask('${j.trackedTaskId || j.id}')" class="btn-success" style="font-size:0.8rem; padding:6px 12px; width:100%; font-weight:800;">✅ ${isAr ? 'تم إنجاز المهمة (Done)' : 'Done'}</button>`;
                    } else {
                        actionHtml = `<button onclick="completeTask('${worker.id}', '${j.id}')" class="btn-success" style="font-size:0.8rem; padding:6px 12px; width:100%;">${t('btn-mark-completed')}</button>`;
                    }
                }

                if (j.deadlineMins > 0 && (j.seenAt || (tt && tt.seenAt))) {
                    const seenTime = j.seenAt || (tt ? tt.seenAt : Date.now());
                    const deadlineMs = seenTime + (j.deadlineMins * 60000);
                    timeInfoHtml = `<div class="task-timer-display" data-deadline="${deadlineMs}" style="font-size:0.85rem; font-weight:600; margin-top:4px;"></div>`;
                } else if (j.seenAt) {
                    timeInfoHtml = `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">${t('label-started')} ${new Date(j.seenAt).toLocaleTimeString()}</div>`;
                }
            } else {
                statusBadge = `<span class="badge" style="background:var(--text-muted);">🆕</span>`;
                if (isAssignedToMe) {
                    if (j.isTracked || j.trackedTaskId) {
                        actionHtml = `<button onclick="seeTrackedTask('${j.trackedTaskId || j.id}')" class="btn-warning" style="font-size:0.8rem; padding:6px 12px; width:100%; font-weight:800;">👀 ${isAr ? 'رأيت هذه المهمة (I Saw This)' : 'I Saw This Task'}</button>`;
                    } else {
                        actionHtml = `<button onclick="seeTask('${worker.id}', '${j.id}')" class="btn-warning" style="font-size:0.8rem; padding:6px 12px; width:100%;">${t('btn-i-saw-this')}</button>`;
                    }
                } else if (isAdmin) {
                    actionHtml = `<span style="font-size:0.8rem; color:var(--text-muted); font-style:italic;">Worker has not seen this yet.</span>`;
                }
                if (j.deadlineMins > 0) {
                    timeInfoHtml = `<div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">${t('task-must-complete').replace('mins', j.deadlineMins)}</div>`;
                }
            }

            const doneColor = (status === 'completed' || j.done) ? 'var(--success)' : (j.urgency === 'urgent' ? 'var(--danger)' : 'var(--primary)');
            const doneText = (status === 'completed' || j.done) ? 'line-through' : 'none';
            let isGeneralBadge = j.isGeneral ? `<span class="badge" style="background:var(--info); color:var(--text-light); margin-right:8px; font-size:0.75rem; vertical-align:middle;">🌍 General Task</span>` : '';
            const taskNumBadge = `<span class="badge" style="background:#2563eb; color:#ffffff; font-weight:700; font-size:0.85rem; padding:3px 9px; border-radius:6px; margin-right:6px; box-shadow:0 1px 3px rgba(37,99,235,0.25);" title="Task ${j.taskNum || 1}">${j.taskNum || 1}</span>`;

            const workerDblClickAttr = canEditTask ? `ondblclick="if (!event.target.closest('button') && !event.target.closest('input') && !event.target.closest('select')) openEditTaskModal('${worker.id}', '${j.id}')" title="${isAr ? 'انقر مرتين للتعديل' : 'Double-click to edit'}"` : '';

            return `
                        <div class="mission-item" ${workerDblClickAttr} style="border-left: 4px solid ${doneColor}; display:flex; flex-direction:column; align-items:stretch; ${canEditTask ? 'cursor:pointer;' : ''}">
                            <div class="flex-between" style="margin-bottom:8px; align-items:flex-start;">
                                <div>
                                    <div style="font-size: 0.75rem; color:var(--text-muted); margin-bottom:4px;">Assigned: ${j.date || new Date(getJobTimestamp(j)).toLocaleString()}</div>
                                    <div style="display:flex; align-items:center; flex-wrap:wrap; gap:6px;">
                                        ${taskNumBadge}
                                        ${isGeneralBadge}
                                        ${j.rejectionCount > 0 ? `<span class="badge" style="background:#ef4444; color:white; font-weight:800; padding:2px 6px; border-radius:6px; margin-right:4px;" title="Rejected ${j.rejectionCount}x">${'❌'.repeat(j.rejectionCount)}</span>` : ''}
                                        <span class="mission-text" style="text-decoration: ${doneText}; margin-right:4px;">${j.title}</span>
                                        ${urgencyBadge}
                                    </div>
                                    ${timeInfoHtml}
                                </div>
                                <div style="text-align:right;">
                                    ${statusBadge}
                                </div>
                            </div>
                            <div class="flex-between" style="border-top:1px dashed var(--border-color); padding-top:10px; margin-top:4px; gap: 10px;">
                                <div style="flex-grow:1;">${actionHtml}</div>
                                <div style="display:flex; align-items:center; gap:4px;">${editBtn}${delBtn}</div>
                            </div>
                        </div>
                    `;
        }).join('');

        const div = document.createElement('div');
        div.className = "card";
        div.style.padding = "16px"; div.style.marginBottom = "10px";
        div.innerHTML = `
                    <div style="margin-bottom:12px; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
                        <strong style="color:var(--text-main); font-size:1.1rem;">${worker.name}</strong> <span style="font-size:0.8rem; color:var(--text-muted); margin-left:8px;">${worker.role}</span>
                    </div>
                    ${constantTasksHtml}
                    ${jobsHtml}
                `;
        board.appendChild(div);
    });

    if (board.innerHTML === '') {
        board.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding: 20px;">${isAr ? 'لا توجد مهام تطابق التصفية المختارة.' : 'No tasks match the selected filters.'}</p>`;
    }
}

function acceptGeneralTask(taskId) {
    if (!currentUser) return;
    const isAr = currentAppLang === 'ar';
    const targetStr = String(taskId);

    const data = getCompanyData();
    const rawGenTasks = data.generalTasks || {};
    const generalTasks = Array.isArray(rawGenTasks) ? rawGenTasks : Object.values(rawGenTasks);

    // Find task in local or Firebase state with String matching
    const task = generalTasks.find(gt => gt && String(gt.id) === targetStr);

    if (!task) {
        return alert(isAr ? "لم يتم العثور على المهمة. قد تكون تم حذفها أو قبولها من موظف آخر." : "Task not found. It may have been deleted or accepted already.");
    }

    if (task.status !== 'pending') {
        alert(isAr ? `تم قبول هذه المهمة بالفعل بواسطة ${task.acceptedBy || 'موظف آخر'}.` : `This task was already accepted by ${task.acceptedBy || 'another worker'}.`);
        return;
    }

    // Find current worker
    const workers = data.workers || [];
    let myIndex = workers.findIndex(w => w.email && currentUser.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
    if (myIndex === -1 && typeof getActiveWorker === 'function') {
        const activeW = getActiveWorker();
        if (activeW) myIndex = workers.findIndex(w => String(w.id) === String(activeW.id));
    }
    if (myIndex === -1) {
        alert(isAr ? "حسابك غير مرتبط بملف موظف. يرجى التواصل مع الإدارة." : "Worker profile not found. Your account is not linked to an employee record.");
        return;
    }

    const myWorker = workers[myIndex];
    if (!myWorker.jobs) myWorker.jobs = [];

    // Construct new job
    const newJob = {
        id: task.id,
        title: `${task.title} (Accepted by ${myWorker.name})`,
        isGeneral: true,
        date: formatTimestamp(),
        timestamp: Date.now(),
        urgency: task.urgency,
        deadlineMins: task.deadlineMins,
        status: 'seen',
        seenAt: Date.now(),
        done: false
    };

    myWorker.jobs.push(newJob);
    task.status = 'accepted';
    task.acceptedBy = myWorker.name;
    task.acceptedById = myWorker.id;
    task.acceptedAt = Date.now();

    renderAll();

    const updates = {};
    updates[`companies/${currentCompany}/workers/${myIndex}/jobs`] = myWorker.jobs;
    updates[`companies/${currentCompany}/generalTasks`] = data.generalTasks;

    db.ref().update(updates)
        .then(() => {
            logActivity('task', myWorker.id, myWorker.name, `${myWorker.name} accepted general task: "${task.title}"`);
            alert(isAr ? `تم قبول المهمة بنجاح: "${task.title}"` : `Success! You have accepted: "${task.title}"`);
            renderAll();
        })
        .catch(err => {
            console.error("Error accepting task:", err);
            alert(isAr ? "فشل قبول المهمة. ربما تم أخذها بالفعل." : "Failed to accept task. It may have been taken already.");
            renderAll();
        });
}

function deleteGeneralTask(taskId) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? "هل أنت تأكد من حذف هذه المهمة العامة؟" : "Delete this general task?")) return;

    const data = getCompanyData();
    const rawGenTasks = data.generalTasks || {};
    const genArray = Array.isArray(rawGenTasks) ? rawGenTasks : Object.values(rawGenTasks);
    const targetStr = String(taskId);

    const task = genArray.find(gt => gt && String(gt.id) === targetStr);
    data.generalTasks = genArray.filter(gt => gt && String(gt.id) !== targetStr);

    // Re-render UI immediately
    renderAll();

    // Atomically set generalTasks node in Firebase so no stale items linger
    db.ref(`companies/${currentCompany}/generalTasks`).set(data.generalTasks)
        .then(() => {
            if (task) {
                logActivity('task_delete', 'general', 'General Pool', `Deleted general task: "${task.title}"`);
            }
            renderAll();
        })
        .catch(err => {
            console.error("Error deleting general task:", err);
            renderAll();
        });
}

function openEditTaskModal(workerId, taskId, isGeneral = false) {
    const isAdmin = currentUser && currentUser.role === 'admin';
    const activeWorker = typeof getActiveWorker === 'function' ? getActiveWorker() : null;
    const canEditTask = isAdmin || document.body.classList.contains('perm-tasks') || (activeWorker && activeWorker.perms && (activeWorker.perms.tasks === true || activeWorker.perms.tasks === 'true'));

    if (!canEditTask) {
        alert(currentAppLang === 'ar' ? '⚠️ ليس لديك صلاحية لتعديل المهام.' : '⚠️ You do not have permission to edit tasks.');
        return;
    }

    const modal = document.getElementById('edit-task-modal');
    if (!modal) return;

    const companyData = getCompanyData();
    const isAr = currentAppLang === 'ar';

    // Populate worker dropdown
    const select = document.getElementById('edit-task-worker-select');
    if (select) {
        select.innerHTML = `
            <option value="general">🌍 ${isAr ? 'مهمة عامة' : 'General Task'}</option>
        `;

        const groups = companyData.taskGroups || [];
        if (groups.length > 0) {
            const groupOptGroup = document.createElement('optgroup');
            groupOptGroup.label = isAr ? 'المجموعات' : 'Groups';
            groups.forEach(g => {
                const opt = document.createElement('option');
                opt.value = `group_${g.id}`;
                opt.textContent = `👥 ${g.name}`;
                groupOptGroup.appendChild(opt);
            });
            select.appendChild(groupOptGroup);
        }

        const workerOptGroup = document.createElement('optgroup');
        workerOptGroup.label = isAr ? 'الموظفين' : 'Employees';
        (companyData.workers || []).forEach(w => {
            const opt = document.createElement('option');
            opt.value = w.id;
            opt.textContent = w.name;
            workerOptGroup.appendChild(opt);
        });
        select.appendChild(workerOptGroup);
    }

    let taskObj = null;
    let currentAssignee = workerId;

    if (isGeneral || workerId === 'general' || workerId.startsWith('group_')) {
        const genTasks = companyData.generalTasks || [];
        taskObj = genTasks.find(gt => gt.id === taskId);
        if (taskObj && taskObj.targetGroupId) {
            currentAssignee = `group_${taskObj.targetGroupId}`;
        } else {
            currentAssignee = 'general';
        }
    } else {
        const workerIndex = (companyData.workers || []).findIndex(w => w.id === workerId);
        if (workerIndex !== -1) {
            const worker = companyData.workers[workerIndex];
            taskObj = (worker.jobs || []).find(j => j.id === taskId);
            currentAssignee = workerId;
        }
    }

    if (!taskObj) {
        alert(isAr ? 'لم يتم العثور على المهمة.' : 'Task not found.');
        return;
    }

    document.getElementById('edit-task-id-hidden').value = taskId;
    document.getElementById('edit-task-original-worker-hidden').value = workerId;
    document.getElementById('edit-task-worker-select').value = currentAssignee;
    document.getElementById('edit-task-title-input').value = taskObj.title || '';
    document.getElementById('edit-task-urgency-select').value = taskObj.urgency || 'normal';
    document.getElementById('edit-task-deadline-input').value = taskObj.deadlineMins || '';

    const titleEl = document.getElementById('edit-task-modal-title');
    if (titleEl) {
        const numStr = taskObj.taskNum ? ` ${taskObj.taskNum}` : '';
        titleEl.textContent = (isAr ? 'تعديل المهمة' : 'Edit Task') + numStr;
    }

    modal.style.display = 'flex';
}

function closeEditTaskModal() {
    const modal = document.getElementById('edit-task-modal');
    if (modal) modal.style.display = 'none';
}

function saveEditedTask() {
    const isAdmin = currentUser && currentUser.role === 'admin';
    const activeWorker = typeof getActiveWorker === 'function' ? getActiveWorker() : null;
    const canEditTask = isAdmin || document.body.classList.contains('perm-tasks') || (activeWorker && activeWorker.perms && (activeWorker.perms.tasks === true || activeWorker.perms.tasks === 'true'));

    if (!canEditTask) {
        alert(currentAppLang === 'ar' ? '⚠️ ليس لديك صلاحية لتعديل المهام.' : '⚠️ You do not have permission to edit tasks.');
        return;
    }

    const isAr = currentAppLang === 'ar';
    const taskId = document.getElementById('edit-task-id-hidden').value;
    const origWorkerId = document.getElementById('edit-task-original-worker-hidden').value;
    const newAssignee = document.getElementById('edit-task-worker-select').value;
    const newTitle = document.getElementById('edit-task-title-input').value.trim();
    const newUrgency = document.getElementById('edit-task-urgency-select').value;
    const newDeadline = parseInt(document.getElementById('edit-task-deadline-input').value) || 0;

    if (!newTitle) {
        alert(isAr ? 'الرجاء إدخال تفاصيل المهمة.' : 'Please enter task details.');
        return;
    }

    const companyData = getCompanyData();
    const isOrigGeneral = origWorkerId === 'general' || origWorkerId.startsWith('gt-') || origWorkerId.startsWith('group_');

    if (isOrigGeneral) {
        // Task was in generalTasks
        const genTasks = companyData.generalTasks || [];
        const taskIndex = genTasks.findIndex(gt => gt.id === taskId);
        if (taskIndex === -1) {
            alert(isAr ? 'تعذر العثور على المهمة.' : 'Could not find task.');
            return;
        }
        const task = genTasks[taskIndex];

        if (newAssignee === 'general' || newAssignee.startsWith('group_')) {
            // Still in general/group pool
            const targetGroupId = newAssignee.startsWith('group_') ? newAssignee.replace('group_', '') : null;
            let targetGroupName = null;
            if (targetGroupId) {
                const grp = (companyData.taskGroups || []).find(g => g.id === targetGroupId);
                if (grp) targetGroupName = grp.name;
            }

            db.ref(`companies/${currentCompany}/generalTasks/${taskId}`).update({
                title: newTitle,
                urgency: newUrgency,
                deadlineMins: newDeadline,
                targetGroupId: targetGroupId,
                targetGroupName: targetGroupName
            }).then(() => {
                logActivity('task', 'general', 'General Pool', `Updated task: "${newTitle}"`);
                closeEditTaskModal();
                renderAll();
            }).catch(err => console.error("Error updating general task:", err));
        } else {
            // Reassigned from general pool to a specific worker
            const newWorkerIndex = (companyData.workers || []).findIndex(w => w.id === newAssignee);
            if (newWorkerIndex === -1) return;
            const newWorker = companyData.workers[newWorkerIndex];
            if (!newWorker.jobs) newWorker.jobs = [];

            const movedJob = {
                id: Date.now().toString(),
                title: newTitle,
                date: task.date || formatTimestamp(),
                timestamp: task.timestamp || Date.now(),
                urgency: newUrgency,
                deadlineMins: newDeadline,
                status: 'assigned',
                done: false
            };

            newWorker.jobs.push(movedJob);

            const updates = {};
            updates[`companies/${currentCompany}/workers/${newWorkerIndex}/jobs`] = newWorker.jobs;
            updates[`companies/${currentCompany}/generalTasks/${taskId}`] = null;

            db.ref().update(updates).then(() => {
                logActivity('task', newWorker.id, newWorker.name, `Assigned task to ${newWorker.name}: "${newTitle}"`);
                closeEditTaskModal();
                renderAll();
            }).catch(err => console.error("Error reassigning general task to worker:", err));
        }
    } else {
        // Task was assigned to a specific worker
        const origWorkerIndex = (companyData.workers || []).findIndex(w => w.id === origWorkerId);
        if (origWorkerIndex === -1) return;
        const origWorker = companyData.workers[origWorkerIndex];
        const jobIndex = (origWorker.jobs || []).findIndex(j => j.id === taskId);
        if (jobIndex === -1) return;

        const job = origWorker.jobs[jobIndex];

        if (newAssignee === origWorkerId) {
            // Same worker: update fields
            job.title = newTitle;
            job.urgency = newUrgency;
            job.deadlineMins = newDeadline;

            db.ref(`companies/${currentCompany}/workers/${origWorkerIndex}/jobs/${jobIndex}`).update({
                title: newTitle,
                urgency: newUrgency,
                deadlineMins: newDeadline
            }).then(() => {
                logActivity('task', origWorker.id, origWorker.name, `Updated task for ${origWorker.name}: "${newTitle}"`);
                closeEditTaskModal();
                renderAll();
            }).catch(err => console.error("Error updating worker task:", err));
        } else if (newAssignee === 'general' || newAssignee.startsWith('group_')) {
            // Moved from worker to general/group task
            origWorker.jobs.splice(jobIndex, 1);

            const targetGroupId = newAssignee.startsWith('group_') ? newAssignee.replace('group_', '') : null;
            let targetGroupName = null;
            if (targetGroupId) {
                const grp = (companyData.taskGroups || []).find(g => g.id === targetGroupId);
                if (grp) targetGroupName = grp.name;
            }

            const newGenTask = {
                id: 'gt-' + Date.now().toString(),
                title: newTitle,
                date: job.date || formatTimestamp(),
                timestamp: job.timestamp || Date.now(),
                urgency: newUrgency,
                deadlineMins: newDeadline,
                status: 'pending',
                targetGroupId: targetGroupId,
                targetGroupName: targetGroupName,
                acceptedBy: null,
                acceptedById: null,
                acceptedAt: null
            };

            const updates = {};
            updates[`companies/${currentCompany}/workers/${origWorkerIndex}/jobs`] = origWorker.jobs;
            updates[`companies/${currentCompany}/generalTasks/${newGenTask.id}`] = newGenTask;

            db.ref().update(updates).then(() => {
                logActivity('task', 'general', 'General Pool', `Moved task from ${origWorker.name} to general pool: "${newTitle}"`);
                closeEditTaskModal();
                renderAll();
            }).catch(err => console.error("Error reassigning task to another worker:", err));
        }
    }
}

// =====================================================================
// CONSTANT TASKS & WORKER RESPONSIBILITIES SYSTEM
// =====================================================================

function fillConstantTaskPreset(title, amount, category) {
    const titleInput = document.getElementById('constant-task-title');
    const amountInput = document.getElementById('constant-task-amount');
    if (titleInput) titleInput.value = title;
    if (amountInput) amountInput.value = amount;
    if (titleInput) titleInput.focus();
}
window.fillConstantTaskPreset = fillConstantTaskPreset;

// =============================================
// CONSTANT TASKS PRESET SHORTCUTS SYSTEM
// =============================================
var editingPresetId = null;

function toggleConstantTaskPresetForm(optPresetId) {
    const container = document.getElementById('constant-preset-form-container');
    if (!container) return;

    if (optPresetId) {
        editingPresetId = optPresetId;
        const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
        const presetsObj = data.constantTaskPresets || {};
        let pObj = presetsObj[optPresetId];

        if (!pObj) {
            const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
            const defaultPresets = [
                { id: 'preset_clean', title: isAr ? '🧹 تنظيف ومسح الطاولات' : '🧹 Cleaning Tables', amount: 'daily', icon: '🧹' },
                { id: 'preset_upload', title: isAr ? '📦 تحميل وتنزيل العمالة/البضائع' : '📦 Uploading & Unloading Staff/Stock', amount: 'daily', icon: '📦' },
                { id: 'preset_cashier', title: isAr ? '💵 عمليات الكاشير والنظام' : '💵 Cashier & POS Operations', amount: 'shift', icon: '💵' },
                { id: 'preset_kitchen', title: isAr ? '👨‍🍳 تحضير وتعقيم المطبخ' : '👨‍🍳 Kitchen Prep & Sanitization', amount: 'daily', icon: '👨‍🍳' },
                { id: 'preset_waste', title: isAr ? '🗑️ تفريغ وتدبير النفايات' : '🗑️ Waste & Trash Management', amount: '2 times/shift', icon: '🗑️' },
                { id: 'preset_inv', title: isAr ? '📝 الجرد اليومي للمخزون' : '📝 Daily Inventory Check', amount: 'end of shift', icon: '📝' }
            ];
            pObj = defaultPresets.find(p => p.id === optPresetId);
        }

        if (pObj) {
            const tEl = document.getElementById('constant-preset-title-input');
            const aEl = document.getElementById('constant-preset-amount-input');
            const iEl = document.getElementById('constant-preset-icon-select');
            if (tEl) tEl.value = pObj.title || '';
            if (aEl) aEl.value = pObj.amount || '';
            if (iEl) iEl.value = pObj.icon || '📌';
        }
    } else {
        editingPresetId = null;
        const titleEl = document.getElementById('constant-preset-title-input');
        const amtEl = document.getElementById('constant-preset-amount-input');
        if (titleEl) titleEl.value = '';
        if (amtEl) amtEl.value = '';
    }

    if (container.style.display === 'none' || !container.style.display) {
        container.style.display = 'block';
        const titleEl = document.getElementById('constant-preset-title-input');
        if (titleEl) titleEl.focus();
    } else {
        container.style.display = 'none';
    }
}
window.toggleConstantTaskPresetForm = toggleConstantTaskPresetForm;

function saveConstantTaskPreset() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const titleInput = document.getElementById('constant-preset-title-input');
    const amtInput = document.getElementById('constant-preset-amount-input');
    const iconInput = document.getElementById('constant-preset-icon-select');

    const title = titleInput ? titleInput.value.trim() : '';
    const amount = amtInput ? amtInput.value.trim() : 'daily';
    const icon = iconInput ? iconInput.value : '📌';

    if (!title) {
        const msg = isAr ? '⚠️ يرجى كتابة عنوان الاختصار.' : '⚠️ Please enter a shortcut title.';
        if (typeof showInAppNotification === 'function') showInAppNotification(msg);
        else alert(msg);
        return;
    }

    const presetId = editingPresetId || ('preset_' + Date.now());
    const presetObj = {
        id: presetId,
        title: title,
        amount: amount || 'daily',
        icon: icon,
        createdAt: Date.now()
    };

    db.ref('companies/' + currentCompany + '/constantTaskPresets/' + presetId).set(presetObj)
        .then(() => {
            const successMsg = isAr ? '✅ تم حفظ الاختصار بنجاح!' : '✅ Preset shortcut saved!';
            if (typeof showInAppNotification === 'function') showInAppNotification(successMsg);

            toggleConstantTaskPresetForm();
            renderConstantTaskPresets();
        })
        .catch(err => {
            console.error("Failed to save preset:", err);
        });
}
window.saveConstantTaskPreset = saveConstantTaskPreset;

function deleteConstantTaskPreset(presetId, titleStr) {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (!confirm(isAr ? `هل أنت تأكد من حذف الاختصار "${titleStr}"؟` : `Are you sure you want to delete preset "${titleStr}"?`)) return;

    db.ref('companies/' + currentCompany + '/constantTaskPresets/' + presetId).set({
        id: presetId,
        deleted: true,
        deletedAt: Date.now()
    })
        .then(() => {
            if (typeof showInAppNotification === 'function') showInAppNotification(isAr ? '🗑️ تم حذف الاختصار.' : '🗑️ Preset deleted.');
            renderConstantTaskPresets();
        })
        .catch(err => {
            console.error("Failed to delete preset:", err);
        });
}
window.deleteConstantTaskPreset = deleteConstantTaskPreset;

function renderConstantTaskPresets() {
    const container = document.getElementById('constant-task-presets-container');
    if (!container) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const presetsObj = data.constantTaskPresets || {};
    const storedPresets = Object.values(presetsObj).filter(p => p && p.id);

    const defaultPresets = [
        { id: 'preset_clean', title: isAr ? '🧹 تنظيف ومسح الطاولات' : '🧹 Cleaning Tables', amount: 'daily', icon: '🧹' },
        { id: 'preset_upload', title: isAr ? '📦 تحميل وتنزيل العمالة/البضائع' : '📦 Uploading & Unloading Staff/Stock', amount: 'daily', icon: '📦' },
        { id: 'preset_cashier', title: isAr ? '💵 عمليات الكاشير والنظام' : '💵 Cashier & POS Operations', amount: 'shift', icon: '💵' },
        { id: 'preset_kitchen', title: isAr ? '👨‍🍳 تحضير وتعقيم المطبخ' : '👨‍🍳 Kitchen Prep & Sanitization', amount: 'daily', icon: '👨‍🍳' },
        { id: 'preset_waste', title: isAr ? '🗑️ تفريغ وتدبير النفايات' : '🗑️ Waste & Trash Management', amount: '2 times/shift', icon: '🗑️' },
        { id: 'preset_inv', title: isAr ? '📝 الجرد اليومي للمخزون' : '📝 Daily Inventory Check', amount: 'end of shift', icon: '📝' }
    ];

    const presetMap = {};
    defaultPresets.forEach(p => { presetMap[p.id] = p; });
    storedPresets.forEach(p => {
        if (p.deleted) {
            delete presetMap[p.id];
        } else {
            presetMap[p.id] = { ...presetMap[p.id], ...p };
        }
    });

    const allPresets = Object.values(presetMap);

    if (allPresets.length === 0) {
        container.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">${isAr ? 'لا توجد اختصارات حالياً. اضغط على "+ إضافة اختصار" لإضافة اختصاراتك الخاصة.' : 'No shortcuts currently. Click "+ Add Preset" to create shortcuts.'}</span>`;
        return;
    }

    container.innerHTML = allPresets.map(p => {
        const safeTitle = typeof escapeHtml === 'function' ? escapeHtml(p.title) : p.title;
        const displayTitle = safeTitle.replace(/'/g, "\\'");
        const amtStr = (p.amount || 'daily').replace(/'/g, "\\'");

        return `
            <div style="display: inline-flex; align-items: center; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 2px 4px 2px 8px; gap: 4px; box-shadow: var(--shadow-sm);">
                <button type="button" onclick="fillConstantTaskPreset('${displayTitle}', '${amtStr}')" style="background: none; border: none; font-size: 0.8rem; font-weight: 800; color: var(--text-main); cursor: pointer; padding: 4px 2px;" title="${isAr ? 'اضغط لتعبئة هذه المهمة' : 'Click to use shortcut'}">
                    ${safeTitle}
                </button>
                <button type="button" onclick="toggleConstantTaskPresetForm('${p.id}')" style="background: none; border: none; color: #6366f1; cursor: pointer; font-size: 0.78rem; padding: 2px 4px;" title="${isAr ? 'تعديل الاختصار' : 'Edit shortcut'}">✏️</button>
                <button type="button" onclick="deleteConstantTaskPreset('${p.id}', '${displayTitle}')" style="background: none; border: none; color: var(--danger); cursor: pointer; font-size: 0.78rem; padding: 2px 4px;" title="${isAr ? 'حذف الاختصار' : 'Delete shortcut'}">✖</button>
            </div>
        `;
    }).join('');
}
window.renderConstantTaskPresets = renderConstantTaskPresets;

function addConstantTask() {
    const isAr = currentAppLang === 'ar';
    const workerSelect = document.getElementById('constant-task-worker-select');
    const workerId = workerSelect ? workerSelect.value : '';
    const title = document.getElementById('constant-task-title') ? document.getElementById('constant-task-title').value.trim() : '';
    const amount = document.getElementById('constant-task-amount') ? document.getElementById('constant-task-amount').value.trim() : '';

    if (!workerId || !title) {
        alert(isAr ? 'الرجاء اختيار الموظف وكتابة عنوان المهمة المستمرة.' : 'Please select an employee and enter responsibility title.');
        return;
    }

    const companyData = getCompanyData();
    const workers = companyData.workers || [];
    const workerIndex = workers.findIndex(w => String(w.id) === String(workerId));
    if (workerIndex === -1) return;

    const worker = workers[workerIndex];
    if (!worker.constantTasks || !Array.isArray(worker.constantTasks)) {
        worker.constantTasks = Object.values(worker.constantTasks || {});
    }

    const newConstantTask = {
        id: 'ct-' + Date.now().toString(),
        title: title,
        amount: amount || (isAr ? 'يومي' : 'Daily'),
        assignedAt: Date.now(),
        assignedBy: currentUser ? currentUser.email : 'Admin'
    };

    worker.constantTasks.push(newConstantTask);

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/constantTasks`).set(worker.constantTasks)
        .then(() => {
            if (typeof logActivity === 'function') {
                logActivity('task_constant', worker.id, worker.name, `Assigned constant task to ${worker.name}: "${title}" (${amount})`);
            }
            alert(isAr ? `تمت إضافة المهمة المستمرة "${title}" لـ ${worker.name} بنجاح!` : `Constant task "${title}" assigned to ${worker.name} successfully!`);
            if (document.getElementById('constant-task-title')) document.getElementById('constant-task-title').value = '';
            if (document.getElementById('constant-task-amount')) document.getElementById('constant-task-amount').value = '';
            renderConstantTasks();
        })
        .catch(err => console.error("Error adding constant task:", err));
}
window.addConstantTask = addConstantTask;

function removeConstantTask(workerId, taskId) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? 'هل أنت تأكد من حذف هذه المهمة المستمرة؟' : 'Are you sure you want to delete this constant task responsibility?')) return;

    const companyData = getCompanyData();
    const workers = companyData.workers || [];
    const workerIndex = workers.findIndex(w => String(w.id) === String(workerId));
    if (workerIndex === -1) return;

    const worker = workers[workerIndex];
    if (!worker.constantTasks || !Array.isArray(worker.constantTasks)) {
        worker.constantTasks = Object.values(worker.constantTasks || {});
    }

    worker.constantTasks = worker.constantTasks.filter(ct => String(ct.id) !== String(taskId));

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/constantTasks`).set(worker.constantTasks)
        .then(() => {
            if (typeof logActivity === 'function') {
                logActivity('task_constant_delete', worker.id, worker.name, `Removed constant task from ${worker.name}`);
            }
            renderConstantTasks();
        })
        .catch(err => console.error("Error removing constant task:", err));
}
window.removeConstantTask = removeConstantTask;

function openTransferConstantTaskModal(fromWorkerId, taskId) {
    const modal = document.getElementById('transfer-constant-task-modal');
    if (!modal) return;

    const isAr = currentAppLang === 'ar';
    const companyData = getCompanyData();
    const workers = companyData.workers || [];
    const fromWorker = workers.find(w => String(w.id) === String(fromWorkerId));
    if (!fromWorker || !fromWorker.constantTasks) return;

    let fromTasks = fromWorker.constantTasks;
    if (!Array.isArray(fromTasks)) fromTasks = Object.values(fromTasks);

    const task = fromTasks.find(ct => String(ct.id) === String(taskId));
    if (!task) return;

    document.getElementById('transfer-constant-from-worker-id').value = fromWorkerId;
    document.getElementById('transfer-constant-task-id').value = taskId;
    document.getElementById('transfer-constant-task-title-display').textContent = `${task.title} (${task.amount || ''})`;

    const targetSelect = document.getElementById('transfer-constant-target-worker-select');
    if (targetSelect) {
        let html = `<option value="">-- ${isAr ? 'اختر الموظف البديل' : 'Choose Target Worker'} --</option>`;
        workers.forEach(w => {
            if (String(w.id) !== String(fromWorkerId)) {
                html += `<option value="${w.id}">👤 ${w.name}</option>`;
            }
        });
        targetSelect.innerHTML = html;
    }

    modal.style.display = 'flex';
}
window.openTransferConstantTaskModal = openTransferConstantTaskModal;

function closeTransferConstantTaskModal() {
    const modal = document.getElementById('transfer-constant-task-modal');
    if (modal) modal.style.display = 'none';
}
window.closeTransferConstantTaskModal = closeTransferConstantTaskModal;

function transferConstantTask() {
    const isAr = currentAppLang === 'ar';
    const fromWorkerId = document.getElementById('transfer-constant-from-worker-id').value;
    const taskId = document.getElementById('transfer-constant-task-id').value;
    const targetWorkerId = document.getElementById('transfer-constant-target-worker-select').value;

    if (!fromWorkerId || !taskId || !targetWorkerId) {
        alert(isAr ? 'يرجى اختيار الموظف المستهدف لنقل المهمة إليه.' : 'Please select the target worker to transfer the task to.');
        return;
    }

    const companyData = getCompanyData();
    const workers = companyData.workers || [];

    const fromWorkerIndex = workers.findIndex(w => String(w.id) === String(fromWorkerId));
    const targetWorkerIndex = workers.findIndex(w => String(w.id) === String(targetWorkerId));

    if (fromWorkerIndex === -1 || targetWorkerIndex === -1) return;

    const fromWorker = workers[fromWorkerIndex];
    const targetWorker = workers[targetWorkerIndex];

    if (!fromWorker.constantTasks || !Array.isArray(fromWorker.constantTasks)) {
        fromWorker.constantTasks = Object.values(fromWorker.constantTasks || {});
    }
    if (!targetWorker.constantTasks || !Array.isArray(targetWorker.constantTasks)) {
        targetWorker.constantTasks = Object.values(targetWorker.constantTasks || {});
    }

    const taskIndex = fromWorker.constantTasks.findIndex(ct => String(ct.id) === String(taskId));
    if (taskIndex === -1) return;

    const [transferredTask] = fromWorker.constantTasks.splice(taskIndex, 1);
    transferredTask.assignedAt = Date.now();
    transferredTask.transferredFrom = fromWorker.name;

    targetWorker.constantTasks.push(transferredTask);

    const updates = {};
    updates[`companies/${currentCompany}/workers/${fromWorkerIndex}/constantTasks`] = fromWorker.constantTasks;
    updates[`companies/${currentCompany}/workers/${targetWorkerIndex}/constantTasks`] = targetWorker.constantTasks;

    db.ref().update(updates)
        .then(() => {
            if (typeof logActivity === 'function') {
                logActivity('task_constant_transfer', targetWorker.id, targetWorker.name, `Transferred constant task "${transferredTask.title}" from ${fromWorker.name} to ${targetWorker.name}`);
            }
            alert(isAr ? `تم نقل المهمة المستمرة "${transferredTask.title}" إلى ${targetWorker.name} بنجاح!` : `Constant task "${transferredTask.title}" transferred to ${targetWorker.name} successfully!`);
            closeTransferConstantTaskModal();
            renderConstantTasks();
        })
        .catch(err => console.error("Error transferring constant task:", err));
}
window.transferConstantTask = transferConstantTask;

function renderConstantTasks() {
    const isAr = currentAppLang === 'ar';
    const companyData = getCompanyData();
    const workers = companyData.workers || [];

    // Automatically render preset shortcuts
    renderConstantTaskPresets();

    // 1. Populate Manager Worker Select dropdown
    const select = document.getElementById('constant-task-worker-select');
    if (select && select.options.length <= 1) {
        let html = `<option value="">-- ${isAr ? 'اختر الموظف' : 'Choose Employee'} --</option>`;
        workers.forEach(w => {
            html += `<option value="${w.id}">👤 ${w.name}</option>`;
        });
        select.innerHTML = html;
    }

    // 2. Render Manager Constant Tasks List
    const managerList = document.getElementById('constant-tasks-manager-list');
    if (managerList) {
        const selectedWorkerId = select ? select.value : '';
        let targetWorkers = workers;
        if (selectedWorkerId) {
            targetWorkers = workers.filter(w => String(w.id) === String(selectedWorkerId));
        }

        let html = '';
        let totalCount = 0;

        targetWorkers.forEach(w => {
            let tasks = w.constantTasks || [];
            if (!Array.isArray(tasks)) tasks = Object.values(tasks);
            tasks = tasks.filter(ct => ct && (ct.id || ct.title));

            if (tasks.length > 0) {
                totalCount += tasks.length;
                html += `
                    <div class="ledger-card" style="margin-bottom: 14px; background: var(--input-bg); border-radius: 12px; padding: 14px; border: 1px solid var(--border-color);">
                        <div class="flex-between" style="margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
                            <strong style="font-size: 1rem; color: var(--text-main);">👤 ${w.name}</strong>
                            <span class="badge" style="background: #6366f1; color: #fff; font-weight: 800;">${tasks.length} ${isAr ? 'مهام مستمرة' : 'Constant Tasks'}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
                            ${tasks.map(ct => `
                                <div style="background: var(--card-bg); padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                                    <div>
                                        <div style="font-weight: 800; color: var(--text-main); font-size: 0.92rem;">📌 ${ct.title}</div>
                                        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">🕒 ${isAr ? 'الكمية / التكرار:' : 'Target:'} <strong style="color:#6366f1;">${ct.amount || (isAr ? 'يومي' : 'Daily')}</strong></div>
                                    </div>
                                    <div style="display: flex; gap: 6px; flex-shrink: 0;">
                                        <button type="button" onclick="openTransferConstantTaskModal('${w.id}', '${ct.id}')" class="btn-outline" style="padding: 4px 8px; font-size: 0.75rem; border-radius: 6px; font-weight: 700; cursor: pointer; border: 1px solid #10b981; color: #10b981;" title="${isAr ? 'نقل المهمة لموظف آخر' : 'Transfer task'}">🔁 ${isAr ? 'نقل' : 'Transfer'}</button>
                                        <button type="button" onclick="removeConstantTask('${w.id}', '${ct.id}')" class="btn-outline-danger" style="padding: 4px 8px; font-size: 0.75rem; border-radius: 6px; font-weight: 700; cursor: pointer;" title="${isAr ? 'حذف المهمة' : 'Delete task'}">🗑️</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        });

        if (!html) {
            html = `<p style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.9rem;">${isAr ? 'لا توجد مهام مستمرة مخصصة حالياً.' : 'No constant tasks assigned yet.'}</p>`;
        }

        managerList.innerHTML = html;
    }

    // 3. Render Worker's Own Constant Tasks Card (#worker-constant-tasks-card)
    const workerCard = document.getElementById('worker-constant-tasks-card');
    const workerList = document.getElementById('worker-constant-tasks-list');
    const countBadge = document.getElementById('worker-constant-tasks-count');
    const cardTitle = document.getElementById('worker-constant-tasks-title');

    if (workerCard && workerList) {
        const isAdmin = currentUser && currentUser.role === 'admin';
        let myWorker = null;

        // Non-admin workers match via email or active worker profile
        const currentEmail = currentUser && currentUser.email ? currentUser.email.toLowerCase() : '';
        if (currentEmail) {
            myWorker = workers.find(w => w.email && w.email.toLowerCase() === currentEmail);
        }
        if (!myWorker && typeof getActiveWorker === 'function') {
            const activeW = getActiveWorker();
            if (activeW) {
                myWorker = workers.find(w => 
                    (w.id && activeW.id && String(w.id) === String(activeW.id)) ||
                    (w.email && activeW.email && w.email.toLowerCase() === activeW.email.toLowerCase()) ||
                    (w.name && activeW.name && String(w.name).trim().toLowerCase() === String(activeW.name).trim().toLowerCase())
                );
            }
        }

        // Admin accounts manage all constant tasks via the Constant Tasks Panel above and NEVER see a personal missions card.
        // Non-admin workers see their assigned constant tasks card.
        if (isAdmin) {
            workerCard.style.display = 'none';
        } else if (myWorker) {
            workerCard.style.display = 'block';
            let myTasks = myWorker.constantTasks || [];
            if (!Array.isArray(myTasks)) myTasks = Object.values(myTasks);
            myTasks = myTasks.filter(ct => ct && (ct.id || ct.title));

            if (cardTitle) {
                cardTitle.textContent = isAr ? `مسؤولياتي والمهام المستمرة (${myWorker.name})` : `My Responsibilities & Constant Tasks (${myWorker.name})`;
            }

            if (countBadge) {
                countBadge.textContent = `${myTasks.length} ${isAr ? 'مسؤوليات مستمرة' : 'Responsibilities'}`;
            }

            if (myTasks.length === 0) {
                workerList.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">${isAr ? 'لا توجد مسؤوليات مستمرة مسندة إليك حالياً.' : 'No constant responsibilities assigned to you currently.'}</p>`;
            } else {
                workerList.innerHTML = myTasks.map(ct => `
                    <div style="background: var(--card-bg); padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); display: flex; align-items: center; gap: 10px; min-width: 200px; flex: 1;">
                        <span style="font-size: 1.2rem;">📌</span>
                        <div>
                            <div style="font-weight: 800; font-size: 0.9rem; color: var(--text-main);">${ct.title}</div>
                            <div style="font-size: 0.76rem; color: var(--text-muted);">📋 ${isAr ? 'المطلوب / الكمية:' : 'Amount:'} <strong style="color: #6366f1;">${ct.amount || (isAr ? 'يومي' : 'Daily')}</strong></div>
                        </div>
                    </div>
                `).join('');
            }
        } else {
            // General fallback if no worker matches
            workerCard.style.display = 'none';
        }
    }
}
window.renderConstantTasks = renderConstantTasks;




// =====================================================================
// TRACKED TASK & SPY WORKER VERIFICATION SYSTEM
// =====================================================================

function addTrackedTask() {
    const isAr = currentAppLang === 'ar';
    const workerSelect = document.getElementById('tracked-task-worker-select');
    const spySelect = document.getElementById('tracked-task-spy-select');

    const workerId = workerSelect ? workerSelect.value : '';
    const spyId = spySelect ? spySelect.value : '';
    const title = document.getElementById('tracked-task-title') ? document.getElementById('tracked-task-title').value.trim() : '';
    const acceptMins = document.getElementById('tracked-task-accept-mins') ? parseInt(document.getElementById('tracked-task-accept-mins').value) : 15;
    const finishMins = document.getElementById('tracked-task-finish-mins') ? parseInt(document.getElementById('tracked-task-finish-mins').value) : 30;
    const spyMins = document.getElementById('tracked-task-spy-mins') ? parseInt(document.getElementById('tracked-task-spy-mins').value) : 20;

    if (!workerId || !spyId || !title) {
        alert(isAr ? 'الرجاء اختيار الموظف المنفذ والموظف المراقب وتحديد عنوان المهمة المتتبعة.' : 'Please select target worker, spy worker, and enter task title.');
        return;
    }

    if (String(workerId) === String(spyId)) {
        alert(isAr ? 'لا يمكن اختيار نفس الموظف كمنفذ ومراقب (سباي) لنفس المهمة.' : 'Target worker and spy worker cannot be the same person.');
        return;
    }

    const companyData = getCompanyData();
    const workers = companyData.workers || [];
    const workerIndex = workers.findIndex(w => String(w.id) === String(workerId));
    const spyWorker = workers.find(w => String(w.id) === String(spyId));

    if (workerIndex === -1 || !spyWorker) {
        alert(isAr ? 'عذراً، لم يتم العثور على بيانات الموظفين.' : 'Error: Selected worker profile not found.');
        return;
    }

    const worker = workers[workerIndex];
    if (!worker.jobs || !Array.isArray(worker.jobs)) {
        worker.jobs = Object.values(worker.jobs || {});
    }

    const vAmtInput = document.getElementById('tracked-task-violation-amount');
    const violationAmount = vAmtInput ? (parseFloat(vAmtInput.value) || 50) : 50;

    const taskId = 'tt-' + Date.now().toString();
    const trackedTask = {
        violationAmount: violationAmount,
        id: taskId,
        title: title,
        workerId: workerId,
        workerName: worker.name,
        spyWorkerId: spyId,
        spyWorkerName: spyWorker.name,
        acceptWindowMins: acceptMins || 15,
        finishWindowMins: finishMins || 30,
        spyWindowMins: spyMins || 20,
        createdAt: Date.now(),
        createdBy: currentUser ? currentUser.email : 'Admin',
        status: 'assigned', // 'assigned' | 'seen' | 'pending_spy_verification' | 'completed' | 'reported' | 'violated'
        seenAt: null,
        finishedAt: null,
        rejectionCount: 0,
        rejectionHistory: [],
        spyInactionAlertSent: false,
        finalAction: null
    };

    // Create job entry inside target worker's job list
    const newJob = {
        id: taskId,
        title: `[Tracked] ${title}`,
        status: 'assigned',
        date: new Date().toLocaleDateString('en-GB'),
        createdAt: Date.now(),
        deadlineMins: finishMins,
        acceptDeadlineMins: acceptMins,
        isTracked: true,
        trackedTaskId: taskId,
        spyWorkerId: spyId,
        spyWorkerName: spyWorker.name,
        rejectionCount: 0
    };

    worker.jobs.push(newJob);

    const updates = {};
    updates[`companies/${currentCompany}/trackedTasks/${taskId}`] = trackedTask;
    updates[`companies/${currentCompany}/workers/${workerIndex}/jobs`] = worker.jobs;

    db.ref().update(updates)
        .then(() => {
            if (typeof logActivity === 'function') {
                logActivity('task_tracked', worker.id, worker.name, `Assigned tracked task "${title}" to ${worker.name} (Spy: ${spyWorker.name})`);
            }
            alert(isAr ? `تم إسناد المهمة المتتبعة "${title}" لـ ${worker.name} وتعيين ${spyWorker.name} كمراقب بنجاح!` : `Tracked task "${title}" assigned to ${worker.name} (Spy: ${spyWorker.name}) successfully!`);
            const form = document.getElementById('tracked-task-form');
            if (form) form.reset();
            if (typeof populateTrackedWorkerDropdowns === 'function') populateTrackedWorkerDropdowns();
            renderTasks();
        })
        .catch(err => console.error("Error creating tracked task:", err));
}
window.addTrackedTask = addTrackedTask;

function seeTrackedTask(taskId) {
    const isAr = currentAppLang === 'ar';
    const companyData = getCompanyData();
    const trackedTasks = companyData.trackedTasks || {};
    const task = trackedTasks[taskId];
    if (!task) return;

    task.seenAt = Date.now();
    task.status = 'seen';

    // Update job in worker jobs
    const workers = companyData.workers || [];
    const workerIndex = workers.findIndex(w => String(w.id) === String(task.workerId));
    if (workerIndex !== -1 && workers[workerIndex].jobs) {
        let jobs = workers[workerIndex].jobs;
        if (!Array.isArray(jobs)) jobs = Object.values(jobs);
        const job = jobs.find(j => String(j.id) === String(taskId) || String(j.trackedTaskId) === String(taskId));
        if (job) {
            job.status = 'seen';
            job.seenAt = Date.now();
        }
    }

    const updates = {};
    updates[`companies/${currentCompany}/trackedTasks/${taskId}`] = task;
    if (workerIndex !== -1) {
        updates[`companies/${currentCompany}/workers/${workerIndex}/jobs`] = workers[workerIndex].jobs;
    }

    db.ref().update(updates)
        .then(() => {
            renderTasks();
        })
        .catch(err => console.error("Error seeing tracked task:", err));
}
window.seeTrackedTask = seeTrackedTask;

function finishTrackedTask(taskId) {
    const isAr = currentAppLang === 'ar';
    const companyData = getCompanyData();
    const trackedTasks = companyData.trackedTasks || {};
    const task = trackedTasks[taskId];
    if (!task) return;

    task.finishedAt = Date.now();
    task.status = 'pending_spy_verification';

    // Update job in worker jobs
    const workers = companyData.workers || [];
    const workerIndex = workers.findIndex(w => String(w.id) === String(task.workerId));
    if (workerIndex !== -1 && workers[workerIndex].jobs) {
        let jobs = workers[workerIndex].jobs;
        if (!Array.isArray(jobs)) jobs = Object.values(jobs);
        const job = jobs.find(j => String(j.id) === String(taskId) || String(j.trackedTaskId) === String(taskId));
        if (job) {
            job.status = 'pending_spy_verification';
            job.finishedAt = Date.now();
        }
    }

    const updates = {};
    updates[`companies/${currentCompany}/trackedTasks/${taskId}`] = task;
    if (workerIndex !== -1) {
        updates[`companies/${currentCompany}/workers/${workerIndex}/jobs`] = workers[workerIndex].jobs;
    }

    db.ref().update(updates)
        .then(() => {
            if (typeof logActivity === 'function') {
                logActivity('task_tracked_finish', task.workerId, task.workerName, `Worker ${task.workerName} marked tracked task "${task.title}" as Done. Waiting for spy verification (${task.spyWorkerName}).`);
            }
            alert(isAr ? 'تم إرسال تقرير الإنجاز للموظف المراقب (السباي) للتحقق الميداني.' : 'Done report submitted! Sent to Spy Worker for verification.');
            renderTasks();
        })
        .catch(err => console.error("Error finishing tracked task:", err));
}
window.finishTrackedTask = finishTrackedTask;

function spyConfirmTask(taskId) {
    const isAr = currentAppLang === 'ar';
    const companyData = getCompanyData();
    const trackedTasks = companyData.trackedTasks || {};
    const task = trackedTasks[taskId];
    if (!task) return;

    task.status = 'completed';
    task.confirmedAt = Date.now();

    // Update job in worker jobs
    const workers = companyData.workers || [];
    const workerIndex = workers.findIndex(w => String(w.id) === String(task.workerId));
    if (workerIndex !== -1 && workers[workerIndex].jobs) {
        let jobs = workers[workerIndex].jobs;
        if (!Array.isArray(jobs)) jobs = Object.values(jobs);
        const job = jobs.find(j => String(j.id) === String(taskId) || String(j.trackedTaskId) === String(taskId));
        if (job) {
            job.status = 'completed';
            job.done = true;
            job.completedAt = Date.now();
        }
    }

    const updates = {};
    updates[`companies/${currentCompany}/trackedTasks/${taskId}`] = task;
    if (workerIndex !== -1) {
        updates[`companies/${currentCompany}/workers/${workerIndex}/jobs`] = workers[workerIndex].jobs;
    }

    db.ref().update(updates)
        .then(() => {
            if (typeof logActivity === 'function') {
                logActivity('task_spy_confirm', task.spyWorkerId, task.spyWorkerName, `Spy ${task.spyWorkerName} CONFIRMED completion of tracked task "${task.title}" for ${task.workerName}.`);
            }
            alert(isAr ? `تم تأكيد إنجاز المهمة "${task.title}" بنجاح ونقل التقرير للإدارة.` : `Tracked task "${task.title}" confirmed successfully!`);
            renderTasks();
        })
        .catch(err => console.error("Error confirming tracked task:", err));
}
window.spyConfirmTask = spyConfirmTask;

function spyRejectTask(taskId) {
    const isAr = currentAppLang === 'ar';
    const companyData = getCompanyData();
    const trackedTasks = companyData.trackedTasks || {};
    const task = trackedTasks[taskId];
    if (!task) return;

    if (!confirm(isAr ? 'هل أنت تأكد من رفض إنجاز المهمة وإعادتها للموظف؟' : 'Are you sure you want to reject this task submission?')) return;

    task.rejectionCount = (task.rejectionCount || 0) + 1;
    if (!task.rejectionHistory) task.rejectionHistory = [];
    task.rejectionHistory.push({
        rejectedAt: Date.now(),
        spyWorkerId: task.spyWorkerId,
        spyWorkerName: task.spyWorkerName,
        count: task.rejectionCount
    });

    // Reset task timer for target worker
    task.status = 'seen';
    task.seenAt = Date.now();
    task.finishedAt = null;

    // Update job in worker jobs
    const workers = companyData.workers || [];
    const workerIndex = workers.findIndex(w => String(w.id) === String(task.workerId));
    if (workerIndex !== -1 && workers[workerIndex].jobs) {
        let jobs = workers[workerIndex].jobs;
        if (!Array.isArray(jobs)) jobs = Object.values(jobs);
        const job = jobs.find(j => String(j.id) === String(taskId) || String(j.trackedTaskId) === String(taskId));
        if (job) {
            job.status = 'seen';
            job.seenAt = Date.now();
            job.finishedAt = null;
            job.rejectionCount = task.rejectionCount;
        }
    }

    const updates = {};
    updates[`companies/${currentCompany}/trackedTasks/${taskId}`] = task;
    if (workerIndex !== -1) {
        updates[`companies/${currentCompany}/workers/${workerIndex}/jobs`] = workers[workerIndex].jobs;
    }

    db.ref().update(updates)
        .then(() => {
            if (typeof logActivity === 'function') {
                logActivity('task_spy_reject', task.spyWorkerId, task.spyWorkerName, `Spy ${task.spyWorkerName} REJECTED tracked task "${task.title}" (Rejection #${task.rejectionCount}). Sent back to ${task.workerName}.`);
            }
            alert(isAr ? `تم رفض المهمة وإعادتها للموظف ${task.workerName} مع تمديد العداد ورسم شارة الرفض (${'❌'.repeat(task.rejectionCount)}).` : `Task rejected and sent back to ${task.workerName} with timer restarted (${'❌'.repeat(task.rejectionCount)}).`);
            renderTasks();
        })
        .catch(err => console.error("Error rejecting tracked task:", err));
}
window.spyRejectTask = spyRejectTask;

function spyReportWorkerToManager(taskId) {
    const isAr = currentAppLang === 'ar';
    const companyData = getCompanyData();
    const trackedTasks = companyData.trackedTasks || {};
    const task = trackedTasks[taskId];
    if (!task) return;

    task.status = 'reported';
    task.finalAction = 'reported';
    task.reportedAt = Date.now();

    const updates = {};
    updates[`companies/${currentCompany}/trackedTasks/${taskId}`] = task;

    db.ref().update(updates)
        .then(() => {
            if (typeof logActivity === 'function') {
                logActivity('task_spy_report_admin', task.spyWorkerId, task.spyWorkerName, `CRITICAL REPORT: Spy ${task.spyWorkerName} reported worker ${task.workerName} to Manager for failing task "${task.title}" after ${task.rejectionCount} rejections.`);
            }
            alert(isAr ? `تم إرسال بلاغ عاجل للإدارة بأن الموظف ${task.workerName} لم يقم بإنجاز المهمة رغم التنبيهات المتكررة.` : `Escalation report sent to Manager regarding worker ${task.workerName}.`);
            renderTasks();
        })
        .catch(err => console.error("Error reporting worker to manager:", err));
}
window.spyReportWorkerToManager = spyReportWorkerToManager;

function spyApplyViolation(taskId) {
    const isAr = currentAppLang === 'ar';
    const companyData = getCompanyData();
    const trackedTasks = companyData.trackedTasks || {};
    const task = trackedTasks[taskId];
    if (!task) return;

    const penaltyAmount = task.violationAmount || 50;

    task.status = 'violated';
    task.finalAction = 'violation';
    task.violatedAt = Date.now();

    const workers = companyData.workers || [];
    const workerIndex = workers.findIndex(w => String(w.id) === String(task.workerId));
    if (workerIndex !== -1) {
        const worker = workers[workerIndex];
        const stats = typeof getMonthlyStats === 'function' ? getMonthlyStats(worker, currentGlobalMonth) : { violationsList: [] };
        if (!stats.violationsList) stats.violationsList = [];

        const violationRecord = {
            id: 'v-' + Date.now().toString(),
            date: typeof formatTimestamp === 'function' ? formatTimestamp() : new Date().toLocaleDateString('en-GB'),
            timestamp: Date.now(),
            amount: penaltyAmount,
            currency: 'SAR',
            reason: isAr ? `مخالفة عدم تنفيذ المهمة المتتبعة: "${task.title}" (${penaltyAmount} SAR)` : `Tracked Task Non-Compliance: "${task.title}" (${penaltyAmount} SAR)`,
            graceDays: 0,
            status: 'active',
            image: null
        };

        saveViolationRecord(task.workerId, stats, violationRecord);
    }

    const updates = {};
    updates[`companies/${currentCompany}/trackedTasks/${taskId}`] = task;

    db.ref().update(updates)
        .then(() => {
            if (typeof logActivity === 'function') {
                logActivity('task_spy_violation', task.spyWorkerId, task.spyWorkerName, `Spy ${task.spyWorkerName} applied automatic ${penaltyAmount} SAR violation on ${task.workerName} for task "${task.title}"`);
            }
            alert(isAr ? `تم تطبيق الخصم والمخالفة تلقائياً (${penaltyAmount} SAR) وإضافتها لإحصائيات الموظف ${task.workerName} بنجاح!` : `Automatic ${penaltyAmount} SAR violation applied & recorded to worker ${task.workerName} stats successfully!`);
            renderTasks();
        })
        .catch(err => console.error("Error applying violation to worker:", err));
}
window.spyApplyViolation = spyApplyViolation;

function dismissTrackedTaskAlert(taskId) {
    if (!currentCompany || !taskId) return;
    db.ref(`companies/${currentCompany}/trackedTasks/${taskId}/alertDismissed`).set(true)
        .then(() => {
            const companyData = typeof getCompanyData === 'function' ? getCompanyData() : {};
            if (companyData.trackedTasks && companyData.trackedTasks[taskId]) {
                companyData.trackedTasks[taskId].alertDismissed = true;
            }
            renderTasks();
        })
        .catch(err => console.error("Error dismissing tracked task alert:", err));
}
window.dismissTrackedTaskAlert = dismissTrackedTaskAlert;

function managerApplyTrackedViolation(taskId) {
    if (typeof spyApplyViolation === 'function') {
        spyApplyViolation(taskId);
    }
}
window.managerApplyTrackedViolation = managerApplyTrackedViolation;

function managerApplyTrackedSystemViolation(taskId) {
    const isAr = currentAppLang === 'ar';
    const companyData = getCompanyData();
    const trackedTasks = companyData.trackedTasks || {};
    const task = trackedTasks[taskId];
    if (!task) return;

    if (!confirm(isAr ? `هل أنت متأكد من تطبيق مخالفة نظامية على الموظف ${task.workerName} بسبب عدم الالتزام بالمهمة المتتبعة؟` : `Are you sure you want to apply a System Violation to worker ${task.workerName}?`)) return;

    const workers = companyData.workers || [];
    const workerIndex = workers.findIndex(w => String(w.id) === String(task.workerId));
    if (workerIndex === -1) {
        alert(isAr ? 'عذراً، لم يتم العثور على ملف الموظف' : 'Error: Worker profile not found');
        return;
    }

    const worker = workers[workerIndex];
    let sysViolList = worker.systemViolations || [];
    if (!Array.isArray(sysViolList)) sysViolList = Object.values(sysViolList);

    const newSysViol = {
        id: 'sv-' + Date.now().toString(),
        reason: isAr ? `مخالفة نظامية - تقاعس/عدم تنفيذ المهمة المتتبعة: "${task.title}"` : `System Violation - Tracked Task Non-Compliance: "${task.title}"`,
        timestamp: Date.now()
    };

    sysViolList.push(newSysViol);
    const newCount = sysViolList.length;

    let alertsAck = worker.alertsAcknowledged || {};
    if (newCount === 1) alertsAck.warning1 = false;
    if (newCount === 2) alertsAck.warning2 = false;

    task.status = 'violated_system';
    task.finalAction = 'system_violation';
    task.violatedAt = Date.now();

    const updates = {};
    updates[`companies/${currentCompany}/trackedTasks/${taskId}`] = task;
    updates[`companies/${currentCompany}/workers/${workerIndex}/systemViolations`] = sysViolList;
    updates[`companies/${currentCompany}/workers/${workerIndex}/alertsAcknowledged`] = alertsAck;
    if (newCount >= 6) {
        updates[`companies/${currentCompany}/workers/${workerIndex}/unlockedClose`] = false;
    }

    db.ref().update(updates)
        .then(() => {
            if (typeof logActivity === 'function') {
                logActivity('violation', worker.id, worker.name, `Manager applied SYSTEM VIOLATION (${newCount}/6) to ${worker.name} for tracked task "${task.title}"`);
            }
            if (typeof checkWorkerSystemViolationAlerts === 'function') {
                worker.systemViolations = sysViolList;
                checkWorkerSystemViolationAlerts(worker);
            }
            alert(isAr ? `تم تطبيق مخالفة نظامية (${newCount}/6) على الموظف ${worker.name} بنجاح!` : `System Violation (${newCount}/6) applied to worker ${worker.name} successfully!`);
            renderTasks();
        })
        .catch(err => console.error("Error applying system violation:", err));
}
window.managerApplyTrackedSystemViolation = managerApplyTrackedSystemViolation;

function openTrackedTaskAuditModal(taskId) {
    const isAr = currentAppLang === 'ar';
    const companyData = getCompanyData();
    const trackedTasks = companyData.trackedTasks || {};
    const task = trackedTasks[taskId];
    if (!task) {
        alert(isAr ? 'لم يتم العثور على سجل المهمة المتتبعة' : 'Tracked task log not found');
        return;
    }

    let existingModal = document.getElementById('tracked-task-audit-modal');
    if (existingModal) existingModal.remove();

    const formatFullDateTime = (ts) => {
        if (!ts) return null;
        return new Date(ts).toLocaleString(isAr ? 'ar-SA' : 'en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const createdTimeStr = formatFullDateTime(task.createdAt) || 'N/A';
    const seenTimeStr = formatFullDateTime(task.seenAt) || (isAr ? '⏳ لم يطلع عليها الموظف بعد' : '⏳ Worker has not viewed task yet');
    const finishedTimeStr = formatFullDateTime(task.finishedAt) || (isAr ? '⏳ لم يكملها الموظف بعد' : '⏳ Worker has not completed task yet');
    const reportedTimeStr = formatFullDateTime(task.reportedAt || task.inactionAlertAt) || (isAr ? 'لم يتم رفعه للإدارة' : 'Not reported to manager');
    const actionTimeStr = formatFullDateTime(task.violatedAt || task.confirmedAt) || (isAr ? 'بانتظار إجراء الإدارة' : 'Pending manager action');

    // Build rejection history HTML
    let rejHtml = '';
    if (task.rejectionHistory && task.rejectionHistory.length > 0) {
        rejHtml = task.rejectionHistory.map((rej, idx) => `
            <div style="background:rgba(239, 68, 68, 0.08); border:1px solid rgba(239, 68, 68, 0.3); border-radius:8px; padding:8px 12px; margin-bottom:6px; font-size:0.85rem;">
                <div style="font-weight:800; color:#ef4444;">❌ ${isAr ? `الرفض رقم #${rej.count || (idx + 1)} من المراقب:` : `Rejection #${rej.count || (idx + 1)} by Spy:`} ${rej.spyWorkerName || task.spyWorkerName}</div>
                <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">🕒 ${formatFullDateTime(rej.rejectedAt)}</div>
            </div>
        `).join('');
    } else {
        rejHtml = `<div style="font-size:0.85rem; color:var(--text-muted); font-style:italic;">${isAr ? 'لا توجد مرفوضات سابقة من المراقب.' : 'No rejections by spy worker.'}</div>`;
    }

    let finalActionBadge = '';
    if (task.status === 'completed') {
        finalActionBadge = `<span class="badge" style="background:#10b981; color:white;">✅ ${isAr ? 'تم تأكيد الإنجاز من المراقب' : 'Confirmed Done by Spy'}</span>`;
    } else if (task.status === 'violated') {
        finalActionBadge = `<span class="badge" style="background:#dc2626; color:white;">⚖️ ${isAr ? `تطبيق مخالفة عادية (${task.violationAmount || 50} SAR)` : `Monetary Violation (${task.violationAmount || 50} SAR)`}</span>`;
    } else if (task.status === 'violated_system') {
        finalActionBadge = `<span class="badge" style="background:#7c3aed; color:white;">🚨 ${isAr ? 'تطبيق مخالفة نظامية' : 'System Violation'}</span>`;
    } else {
        finalActionBadge = `<span class="badge" style="background:#f59e0b; color:white;">⏳ ${isAr ? 'بانتظار الإجراء' : 'Pending Action'}</span>`;
    }

    const modal = document.createElement('div');
    modal.id = 'tracked-task-audit-modal';
    modal.style = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;
        z-index: 99999; padding: 20px; backdrop-filter: blur(6px);
    `;

    modal.innerHTML = `
        <div class="card" style="max-width: 650px; width: 100%; max-height: 90vh; overflow-y: auto; background: var(--card-bg); border: 2px solid #f59e0b; border-radius: 16px; padding: 24px; box-shadow: var(--shadow-lg);">
            <div class="flex-between" style="align-items: center; margin-bottom: 16px; border-bottom: 1px dashed var(--border-color); padding-bottom: 12px;">
                <h3 style="margin: 0; color: #f59e0b; font-size: 1.2rem; display: flex; align-items: center; gap: 8px;">
                    📊 ${isAr ? 'تقرير تتبع المهمة الميدانية والجدول الزمني' : 'Tracked Task Audit Log & Timeline HUD'}
                </h3>
                <button type="button" onclick="document.getElementById('tracked-task-audit-modal').remove()" style="background: none; border: none; color: var(--text-muted); font-size: 1.5rem; cursor: pointer; font-weight: 800;">✕</button>
            </div>

            <!-- Task Meta -->
            <div style="background: var(--input-bg); border-radius: 10px; padding: 14px; margin-bottom: 16px; border: 1px solid var(--border-color);">
                <div style="font-size: 1.08rem; font-weight: 800; color: var(--text-main); margin-bottom: 6px;">📌 ${task.title}</div>
                <div style="display: flex; gap: 14px; flex-wrap: wrap; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">
                    <span>👤 ${isAr ? 'المنفذ:' : 'Target Worker:'} <strong style="color:var(--text-main);">${task.workerName}</strong></span>
                    <span>🕵️ ${isAr ? 'المراقب:' : 'Spy Worker:'} <strong style="color:var(--text-main);">${task.spyWorkerName}</strong></span>
                    <span>⚖️ ${isAr ? 'المبلغ المحدد:' : 'Penalty Rate:'} <strong style="color:#ef4444;">${task.violationAmount || 50} SAR</strong></span>
                </div>
                <div>${finalActionBadge}</div>
            </div>

            <!-- Timeline Stepper -->
            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
                <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <div style="background: #3b82f6; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0; font-size: 0.85rem;">1</div>
                    <div style="flex: 1; background: var(--input-bg); padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color);">
                        <div style="font-weight: 800; color: #3b82f6; font-size: 0.88rem;">📤 ${isAr ? 'وقت إرسال وإسناد المهمة' : 'Task Sent & Assigned'}</div>
                        <div style="font-size: 0.82rem; color: var(--text-main); margin-top: 2px;">🕒 ${createdTimeStr}</div>
                    </div>
                </div>

                <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <div style="background: #06b6d4; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0; font-size: 0.85rem;">2</div>
                    <div style="flex: 1; background: var(--input-bg); padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color);">
                        <div style="font-weight: 800; color: #06b6d4; font-size: 0.88rem;">👁️ ${isAr ? 'وقت الاطلاع والقبول من الموظف' : 'Task Viewed / Accepted by Worker'}</div>
                        <div style="font-size: 0.82rem; color: var(--text-main); margin-top: 2px;">🕒 ${seenTimeStr}</div>
                    </div>
                </div>

                <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <div style="background: #10b981; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0; font-size: 0.85rem;">3</div>
                    <div style="flex: 1; background: var(--input-bg); padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color);">
                        <div style="font-weight: 800; color: #10b981; font-size: 0.88rem;">🏁 ${isAr ? 'وقت إكمال المهمة ورفعها للمراقب' : 'Task Finished & Submitted to Spy'}</div>
                        <div style="font-size: 0.82rem; color: var(--text-main); margin-top: 2px;">🕒 ${finishedTimeStr}</div>
                    </div>
                </div>

                <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <div style="background: #f59e0b; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0; font-size: 0.85rem;">4</div>
                    <div style="flex: 1; background: var(--input-bg); padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color);">
                        <div style="font-weight: 800; color: #f59e0b; font-size: 0.88rem; margin-bottom: 6px;">🕵️ ${isAr ? 'سجل الرفض والتحقق الميداني من المراقب (Spy)' : 'Spy Rejection & Verification History'}</div>
                        ${rejHtml}
                    </div>
                </div>

                <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <div style="background: #ef4444; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0; font-size: 0.85rem;">5</div>
                    <div style="flex: 1; background: var(--input-bg); padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color);">
                        <div style="font-weight: 800; color: #ef4444; font-size: 0.88rem;">📢 ${isAr ? 'وقت رفع البلاغ/التصعيد للإدارة' : 'Report / Escalation Sent to Manager'}</div>
                        <div style="font-size: 0.82rem; color: var(--text-main); margin-top: 2px;">🕒 ${reportedTimeStr}</div>
                    </div>
                </div>

                <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <div style="background: #7c3aed; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0; font-size: 0.85rem;">6</div>
                    <div style="flex: 1; background: var(--input-bg); padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color);">
                        <div style="font-weight: 800; color: #7c3aed; font-size: 0.88rem;">⚖️ ${isAr ? 'وقت وإجراء القرار النهائي من الإدارة' : 'Final Manager Action & Status'}</div>
                        <div style="font-size: 0.82rem; color: var(--text-main); margin-top: 2px;">🕒 ${actionTimeStr}</div>
                    </div>
                </div>
            </div>

            <div style="text-align: right;">
                <button type="button" onclick="document.getElementById('tracked-task-audit-modal').remove()" class="btn-outline" style="padding: 8px 22px; font-weight: 800; border-radius: 8px; cursor: pointer; background: var(--input-bg);">
                    ${isAr ? 'إغلاق النافذة' : 'Close'}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}
window.openTrackedTaskAuditModal = openTrackedTaskAuditModal;

function updateTaskTimers() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    document.querySelectorAll('.task-timer-display').forEach(el => {
        const deadline = parseInt(el.getAttribute('data-deadline'));
        if (!deadline || isNaN(deadline)) return;

        const diff = deadline - Date.now();
        if (diff <= 0) {
            el.innerHTML = `<span style="color:var(--danger); font-weight:900;">🚨 ${isAr ? 'انتهى الوقت المحدد!' : 'Time Expired!'}</span>`;
            return;
        }

        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        el.innerHTML = `⏱️ ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    });
}
window.updateTaskTimers = updateTaskTimers;

function checkTrackedTaskInaction() {
    const companyData = getCompanyData();
    const trackedTasks = companyData.trackedTasks || {};
    const now = Date.now();
    let updated = false;
    const updates = {};

    Object.values(trackedTasks).forEach(task => {
        if (task && task.status === 'pending_spy_verification' && task.finishedAt && !task.spyInactionAlertSent) {
            const spyWindowMs = (task.spyWindowMins || 20) * 60000;
            if (now - task.finishedAt > spyWindowMs) {
                task.spyInactionAlertSent = true;
                task.inactionAlertAt = now;
                updates[`companies/${currentCompany}/trackedTasks/${task.id}/spyInactionAlertSent`] = true;
                updates[`companies/${currentCompany}/trackedTasks/${task.id}/inactionAlertAt`] = now;
                updated = true;

                if (typeof logActivity === 'function') {
                    logActivity('task_spy_inaction', task.spyWorkerId, task.spyWorkerName, `WARNING: Spy worker ${task.spyWorkerName} did NOT take action on task "${task.title}" (Worker: ${task.workerName}) within ${task.spyWindowMins} mins!`);
                }
            }
        }
    });

    if (updated) {
        db.ref().update(updates).then(() => {
            if (typeof renderTasks === 'function') renderTasks();
        }).catch(err => console.error("Error logging spy inaction alert:", err));
    }
}
window.checkTrackedTaskInaction = checkTrackedTaskInaction;

// Periodic check for spy inaction (runs every 15 seconds)
if (!window.trackedTaskInactionTimer) {
    window.trackedTaskInactionTimer = setInterval(checkTrackedTaskInaction, 15000);
}

// --- AUTOMATIC IN-SCOPE WINDOW EXPORTS FOR TRACKED TASKS ---
if (typeof addTrackedTask === 'function') window.addTrackedTask = addTrackedTask;
if (typeof seeTrackedTask === 'function') window.seeTrackedTask = seeTrackedTask;
if (typeof finishTrackedTask === 'function') window.finishTrackedTask = finishTrackedTask;
if (typeof spyConfirmTask === 'function') window.spyConfirmTask = spyConfirmTask;
if (typeof spyRejectTask === 'function') window.spyRejectTask = spyRejectTask;
if (typeof spyReportWorkerToManager === 'function') window.spyReportWorkerToManager = spyReportWorkerToManager;
if (typeof spyApplyViolation === 'function') window.spyApplyViolation = spyApplyViolation;
if (typeof managerApplyTrackedViolation === 'function') window.managerApplyTrackedViolation = managerApplyTrackedViolation;
if (typeof managerApplyTrackedSystemViolation === 'function') window.managerApplyTrackedSystemViolation = managerApplyTrackedSystemViolation;
if (typeof openTrackedTaskAuditModal === 'function') window.openTrackedTaskAuditModal = openTrackedTaskAuditModal;
if (typeof checkTrackedTaskInaction === 'function') window.checkTrackedTaskInaction = checkTrackedTaskInaction;


// --- AUTOMATIC IN-SCOPE WINDOW EXPORTS ---
if (typeof getMonthlyStats === 'function') window.getMonthlyStats = getMonthlyStats;
if (typeof getLogsForMonth === 'function') window.getLogsForMonth = getLogsForMonth;
if (typeof calculateViolationsTotal === 'function') window.calculateViolationsTotal = calculateViolationsTotal;
if (typeof calculatePaymentsTotal === 'function') window.calculatePaymentsTotal = calculatePaymentsTotal;
if (typeof calculateRewardsTotal === 'function') window.calculateRewardsTotal = calculateRewardsTotal;
if (typeof calculateOvertimeTotal === 'function') window.calculateOvertimeTotal = calculateOvertimeTotal;
if (typeof calculateCustodyTotal === 'function') window.calculateCustodyTotal = calculateCustodyTotal;
if (typeof getCumulativeBalance === 'function') window.getCumulativeBalance = getCumulativeBalance;
if (typeof handleMonthChange === 'function') window.handleMonthChange = handleMonthChange;
if (typeof setDatePickerLimits === 'function') window.setDatePickerLimits = setDatePickerLimits;
if (typeof toggleVacationDays === 'function') window.toggleVacationDays = toggleVacationDays;
if (typeof getExportData === 'function') window.getExportData = getExportData;
if (typeof exportToExcel === 'function') window.exportToExcel = exportToExcel;
if (typeof exportToPDF === 'function') window.exportToPDF = exportToPDF;
if (typeof exportWorkerFinancePDF === 'function') window.exportWorkerFinancePDF = exportWorkerFinancePDF;
if (typeof addViolationRule === 'function') window.addViolationRule = addViolationRule;
if (typeof deleteViolationRule === 'function') window.deleteViolationRule = deleteViolationRule;
if (typeof renderViolationRules === 'function') window.renderViolationRules = renderViolationRules;
if (typeof autoFillViolation === 'function') window.autoFillViolation = autoFillViolation;
if (typeof applyDetailedViolation === 'function') window.applyDetailedViolation = applyDetailedViolation;
if (typeof saveViolationRecord === 'function') window.saveViolationRecord = saveViolationRecord;
if (typeof deleteDetailedViolation === 'function') window.deleteDetailedViolation = deleteDetailedViolation;
if (typeof resolveViolation === 'function') window.resolveViolation = resolveViolation;
if (typeof manuallyUpdateRank === 'function') window.manuallyUpdateRank = manuallyUpdateRank;
if (typeof renderRanksTable === 'function') window.renderRanksTable = renderRanksTable;
if (typeof assignTask === 'function') window.assignTask = assignTask;
if (typeof seeTask === 'function') window.seeTask = seeTask;
if (typeof completeTask === 'function') window.completeTask = completeTask;
if (typeof toggleTaskDone === 'function') window.toggleTaskDone = toggleTaskDone;
if (typeof deleteTask === 'function') window.deleteTask = deleteTask;
if (typeof getJobTimestamp === 'function') window.getJobTimestamp = getJobTimestamp;
if (typeof renderTasks === 'function') window.renderTasks = renderTasks;
if (typeof acceptGeneralTask === 'function') window.acceptGeneralTask = acceptGeneralTask;
if (typeof deleteGeneralTask === 'function') window.deleteGeneralTask = deleteGeneralTask;
if (typeof openEditTaskModal === 'function') window.openEditTaskModal = openEditTaskModal;
if (typeof closeEditTaskModal === 'function') window.closeEditTaskModal = closeEditTaskModal;
if (typeof saveEditedTask === 'function') window.saveEditedTask = saveEditedTask;
if (typeof renderConstantTasks === 'function') window.renderConstantTasks = renderConstantTasks;