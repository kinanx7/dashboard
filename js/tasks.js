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
    stats.violationsList.unshift(record);
    document.getElementById('v-amount').value = ''; document.getElementById('v-reason').value = '';
    document.getElementById('v-rule-select').value = ''; document.getElementById('v-image').value = '';

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex !== -1) {
        const worker = getCompanyData().workers[workerIndex];
        db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/violationsList`).set(stats.violationsList)
            .then(() => {
                if (typeof logActivity === 'function') {
                    logActivity('violation', worker.id, worker.name, `Added violation to ${worker.name}: "${record.reason}" (SAR ${record.amount})`);
                }
            })
            .catch(err => console.error("Error saving violation record:", err));
    }
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
    const workerId = document.getElementById('task-worker-select').value;
    const text = document.getElementById('task-assign-input').value.trim();
    const urgency = document.getElementById('task-urgency') ? document.getElementById('task-urgency').value : 'normal';
    const deadlineMins = document.getElementById('task-deadline') ? parseInt(document.getElementById('task-deadline').value) || 0 : 0;

    if (!workerId || !text) { alert("Select an employee and describe a task."); return; }

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
            })
            .catch(err => console.error("Error creating general task:", err));
        return;
    }

    const activeWorker = getActiveWorker();
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
        })
        .catch(err => console.error("Error assigning task:", err));
}

function seeTask(workerId, taskId) {
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const t = worker.jobs.find(j => j.id === taskId);
    if (t) {
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
    if (j.timestamp) return j.timestamp;
    if (j.createdAt) return j.createdAt;
    const parsedId = parseInt(j.id);
    if (!isNaN(parsedId) && parsedId > 1000000000000) return parsedId;
    if (j.date) {
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

    // Ensure all existing & new tasks have assigned task numbers
    ensureTaskNumbers();

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
        const activeWorker = getActiveWorker();
        const hasTaskAccess = isAdmin || document.body.classList.contains('perm-tasks') || (activeWorker && activeWorker.perms && (activeWorker.perms.tasks === true || activeWorker.perms.tasks === 'true'));
        let pendingGeneralTasks = generalTasks.filter(gt => {
            if (!gt || gt.status !== 'pending') return false;
            if (!passesDateFilter(getJobTimestamp(gt))) return false;
            if (!passesSearchFilter(gt)) return false;
            if (hasTaskAccess) return true; // Admin and workers with task access see ALL general tasks!
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

                genHtml += `
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:16px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
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
        let jobs = worker.jobs ? [...worker.jobs] : [];
        if (jobs.length === 0) return;

        // Apply Status Filter
        if (statusFilter === 'completed') {
            jobs = jobs.filter(j => j.status === 'completed' || j.done);
        } else if (statusFilter === 'incomplete') {
            jobs = jobs.filter(j => j.status !== 'completed' && !j.done);
        }

        // Apply Date Filter & Search Query Filter
        jobs = jobs.filter(j => passesDateFilter(getJobTimestamp(j)) && passesSearchFilter(j));

        if (jobs.length === 0) return;

        // Sort Newest Tasks to the Top
        jobs.sort((a, b) => getJobTimestamp(b) - getJobTimestamp(a));

        let jobsHtml = jobs.map(j => {
            const editBtn = isAdmin ? `<button onclick="openEditTaskModal('${worker.id}', '${j.id}')" style="background:none; border:none; color: var(--secondary); cursor:pointer; font-size:1rem; padding:0 4px;" title="${isAr ? 'تعديل المهمة' : 'Edit Task'}">✏️</button>` : '';
            const delBtn = isAdmin ? `<button onclick="deleteTask('${worker.id}', '${j.id}')" style="background:none; border:none; color: var(--danger); cursor:pointer; font-size:1.1rem; padding:0 4px;" title="Delete">✖</button>` : '';

            const status = j.status || (j.done ? 'completed' : 'assigned');
            const isAssignedToMe = (currentUser && worker.email && worker.email.toLowerCase() === currentUser.email.toLowerCase());

            let statusBadge = '';
            let actionHtml = '';
            let urgencyBadge = j.urgency === 'urgent' ? `<span class="badge" style="background:var(--danger); margin-left:8px;">🔴 ${t('opt-urgency-high').replace('🔴 ', '')}</span>` : '';
            let timeInfoHtml = '';

            if (status === 'completed' || j.done) {
                statusBadge = `<span class="badge badge-good">${t('btn-mark-completed').replace('✅ ', '')} ✅</span>`;
                actionHtml = isAdmin ? `<button onclick="toggleTaskDone('${worker.id}', '${j.id}')" class="btn-outline" style="font-size:0.75rem; padding:4px 8px;">${t('btn-undo-action')}</button>` : '';
                if (j.completedAt) {
                    timeInfoHtml = `<div style="font-size:0.75rem; color:var(--success); margin-top:4px;">${t('label-finished')} ${new Date(j.completedAt).toLocaleTimeString()}</div>`;
                }
            } else if (status === 'seen') {
                statusBadge = `<span class="badge" style="background:var(--warning); color:#000;">👀 ${t('status-pending-sm').replace('⏳ ', '')}</span>`;
                if (isAssignedToMe) {
                    actionHtml = `<button onclick="completeTask('${worker.id}', '${j.id}')" class="btn-success" style="font-size:0.8rem; padding:6px 12px; width:100%;">${t('btn-mark-completed')}</button>`;
                }

                if (j.deadlineMins > 0 && j.seenAt) {
                    const deadlineMs = j.seenAt + (j.deadlineMins * 60000);
                    timeInfoHtml = `<div class="task-timer-display" data-deadline="${deadlineMs}" style="font-size:0.85rem; font-weight:600; margin-top:4px;"></div>`;
                } else if (j.seenAt) {
                    timeInfoHtml = `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">${t('label-started')} ${new Date(j.seenAt).toLocaleTimeString()}</div>`;
                }
            } else {
                statusBadge = `<span class="badge" style="background:var(--text-muted);">🆕</span>`;
                if (isAssignedToMe) {
                    actionHtml = `<button onclick="seeTask('${worker.id}', '${j.id}')" class="btn-warning" style="font-size:0.8rem; padding:6px 12px; width:100%;">${t('btn-i-saw-this')}</button>`;
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

            return `
                        <div class="mission-item" style="border-left: 4px solid ${doneColor}; display:flex; flex-direction:column; align-items:stretch;">
                            <div class="flex-between" style="margin-bottom:8px; align-items:flex-start;">
                                <div>
                                    <div style="font-size: 0.75rem; color:var(--text-muted); margin-bottom:4px;">Assigned: ${j.date || new Date(getJobTimestamp(j)).toLocaleString()}</div>
                                    <div style="display:flex; align-items:center; flex-wrap:wrap; gap:6px;">
                                        ${taskNumBadge}
                                        ${isGeneralBadge}
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
            }).catch(err => console.error("Error moving task to general pool:", err));
        } else {
            // Reassigned to another worker
            const newWorkerIndex = (companyData.workers || []).findIndex(w => w.id === newAssignee);
            if (newWorkerIndex === -1) return;
            const newWorker = companyData.workers[newWorkerIndex];
            if (!newWorker.jobs) newWorker.jobs = [];

            origWorker.jobs.splice(jobIndex, 1);

            const reassignedJob = {
                ...job,
                title: newTitle,
                urgency: newUrgency,
                deadlineMins: newDeadline
            };

            newWorker.jobs.push(reassignedJob);

            const updates = {};
            updates[`companies/${currentCompany}/workers/${origWorkerIndex}/jobs`] = origWorker.jobs;
            updates[`companies/${currentCompany}/workers/${newWorkerIndex}/jobs`] = newWorker.jobs;

            db.ref().update(updates).then(() => {
                logActivity('task', newWorker.id, newWorker.name, `Reassigned task from ${origWorker.name} to ${newWorker.name}: "${newTitle}"`);
                closeEditTaskModal();
                renderAll();
            }).catch(err => console.error("Error reassigning task to another worker:", err));
        }
    }
}


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
