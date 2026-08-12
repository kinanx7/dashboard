/**
 * Finance summary, attendance logs, salary advances, shifts & activity log
 */

function renderFinanceTable() {
    const tbody = document.querySelector('#finance-workers-table');
    if (!tbody) return;
    tbody.querySelector('tbody').innerHTML = '';

    const workersToRender = getVisibleWorkers();

    if (workersToRender.length === 0 && (!currentUser || currentUser.role !== 'admin')) {
        tbody.querySelector('tbody').innerHTML = `<tr><td colspan="5" style="text-align:center;">Your account is not linked to any worker profile yet.</td></tr>`;
        return;
    }

    workersToRender.forEach(worker => {
        const stats = getMonthlyStats(worker, currentGlobalMonth);
        const base = parseFloat(worker.income || 0);
        const rew = calculateRewardsTotal(stats.rewardsList);
        const viol = calculateViolationsTotal(stats.violationsList);
        const paidThisMonth = calculatePaymentsTotal(stats.paymentsList);

        // UI display for Net reflects the subtraction of the advance payment, system violations, and late deductions
        const sysViolDeduction = typeof getSystemViolationDeductionsForMonth === 'function' ? getSystemViolationDeductionsForMonth(worker, currentGlobalMonth) : 0;
        const lateDeduction = typeof getLateDeductionsForMonth === 'function' ? getLateDeductionsForMonth(worker, currentGlobalMonth) : 0;
        const volumeReward = typeof getDriverVolumeRewardsForMonth === 'function' ? getDriverVolumeRewardsForMonth(worker, currentGlobalMonth) : 0;
        const ov = calculateOvertimeTotal(stats.overtimeList);
        const net = base + rew + volumeReward + ov - viol - paidThisMonth - sysViolDeduction - lateDeduction;

        const remainingAllTime = getCumulativeBalance(worker, currentGlobalMonth);
        const detailsId = `net-details-${worker.id}`;

        const tr = document.createElement('tr');
        const isAr = currentAppLang === 'ar';
        let sysViolHtml = '';
        if (sysViolDeduction > 0) {
            sysViolHtml = `<div class="breakdown-row" style="color:var(--danger);"><span>${isAr ? 'المخالفات النظامية:' : 'System Violations:'}</span> <span>- SAR ${sysViolDeduction.toLocaleString()}</span></div>`;
        }
        let lateHtml = '';
        if (lateDeduction > 0) {
            lateHtml = `<div class="breakdown-row" style="color:var(--danger);"><span>${isAr ? 'خصومات التأخير:' : 'Late Penalties:'}</span> <span>- SAR ${lateDeduction.toLocaleString()}</span></div>`;
        }
        let volumeRewardHtml = '';
        if (volumeReward > 0) {
            volumeRewardHtml = `<div class="breakdown-row" style="color:var(--success);"><span>${isAr ? 'مكافآت التوصيل:' : 'Volume Rewards:'}</span> <span>+ SAR ${volumeReward.toLocaleString()}</span></div>`;
        }
        let overtimeHtml = '';
        if (ov > 0) {
            overtimeHtml = `<div class="breakdown-row" style="color:#f59e0b;"><span>${isAr ? 'العمل الإضافي:' : 'Overtime:'}</span> <span>+ SAR ${ov.toLocaleString()}</span></div>`;
        }
        tr.innerHTML = `
                    <td><strong style="color:var(--text-main);">${worker.name}</strong><br><span class="text-muted-heavy">${worker.branch}</span></td>
                    <td>SAR ${base.toLocaleString()}</td>
                    <td style="font-weight:600; color:var(--text-main);">
                        <div style="display:flex; align-items:center; gap:8px; cursor:pointer;" onclick="toggleDetails('${detailsId}')">
                            SAR ${net.toLocaleString()}
                            <span style="font-size:0.7rem; color:var(--primary);">▼</span>
                        </div>
                        <div class="breakdown-details" id="${detailsId}">
                            <div class="breakdown-row" style="color:var(--text-main);"><span>${isAr ? 'الأساسي:' : 'Base:'}</span> <span>SAR ${base.toLocaleString()}</span></div>
                            <div class="breakdown-row" style="color:var(--success);"><span>${isAr ? 'المكافآت:' : 'Rewards:'}</span> <span>+ SAR ${rew.toLocaleString()}</span></div>
                            ${volumeRewardHtml}
                            ${overtimeHtml}
                            <div class="breakdown-row" style="color:var(--danger);"><span>${isAr ? 'المخالفات:' : 'Violations:'}</span> <span>- SAR ${viol.toLocaleString()}</span></div>
                            ${sysViolHtml}
                            ${lateHtml}
                            <div class="breakdown-row" style="color:var(--info);"><span>${isAr ? 'سلف مدفوعة:' : 'Paid Advance:'}</span> <span>- SAR ${paidThisMonth.toLocaleString()}</span></div>
                        </div>
                    </td>
                    <td class="text-info">SAR ${paidThisMonth.toLocaleString()}</td>
                    <td style="font-weight:700; color:var(--primary); font-size:1.05rem;">SAR ${remainingAllTime.toLocaleString()}</td>
                `;
        tbody.querySelector('tbody').appendChild(tr);
    });
}

function renderFinDetails() {
    const workerId = document.getElementById('fin-worker-select').value;
    const area = document.getElementById('fin-management-area');
    const vHistList = document.getElementById('violations-history-list');
    const pHistList = document.getElementById('payments-history-list');
    const rHistList = document.getElementById('rewards-history-list');
    const cHistList = document.getElementById('custody-history-list');
    const isAdmin = currentUser && currentUser.role === 'admin';
    const isFinAdmin = currentUser && (currentUser.role === 'admin' || document.body.classList.contains('perm-finance'));
    const isAr = currentAppLang === 'ar';

    if (!workerId) { if (area) area.style.display = 'none'; return; }
    if (area) area.style.display = 'block';
    if (vHistList) vHistList.innerHTML = '';
    if (pHistList) pHistList.innerHTML = '';
    if (rHistList) rHistList.innerHTML = '';
    if (cHistList) cHistList.innerHTML = '';

    const worker = getCompanyData().workers.find(w => w.id === workerId);
    if (!worker) return;
    const stats = getMonthlyStats(worker, currentGlobalMonth);
    const base = parseFloat(worker.income || 0);
    const totalRewards = calculateRewardsTotal(stats.rewardsList);
    const totalViolations = calculateViolationsTotal(stats.violationsList);
    const totalCustody = calculateCustodyTotal(stats.custodyList);
    const paidThisMonth = calculatePaymentsTotal(stats.paymentsList);
    const totalOvertime = calculateOvertimeTotal(stats.overtimeList);

    // UI display for Net reflects the subtraction of the advance payment, system violations, and late penalties
    const sysViolDeduction = typeof getSystemViolationDeductionsForMonth === 'function' ? getSystemViolationDeductionsForMonth(worker, currentGlobalMonth) : 0;
    const lateDeduction = typeof getLateDeductionsForMonth === 'function' ? getLateDeductionsForMonth(worker, currentGlobalMonth) : 0;
    const volumeReward = typeof getDriverVolumeRewardsForMonth === 'function' ? getDriverVolumeRewardsForMonth(worker, currentGlobalMonth) : 0;
    const net = base + totalRewards + volumeReward + totalOvertime - totalViolations - paidThisMonth - sysViolDeduction - lateDeduction;

    const allTimeRemaining = getCumulativeBalance(worker, currentGlobalMonth);

    document.getElementById('fin-display-total-due').textContent = allTimeRemaining.toLocaleString();
    document.getElementById('fin-display-base').textContent = base.toLocaleString();
    document.getElementById('fin-display-net').textContent = net.toLocaleString();
    document.getElementById('fin-display-summary-custody').textContent = totalCustody.toLocaleString();
    document.getElementById('fin-display-custody').textContent = totalCustody.toLocaleString();
    document.getElementById('fin-display-total-viol').textContent = totalViolations.toLocaleString();

    const displayOvertime = document.getElementById('fin-display-overtime');
    if (displayOvertime) displayOvertime.textContent = totalOvertime.toLocaleString();

    const displayOvertimeEarned = document.getElementById('fin-display-overtime-earned');
    if (displayOvertimeEarned) displayOvertimeEarned.textContent = totalOvertime.toLocaleString();

    // Render Overtime History list
    const finOvertimeList = document.getElementById('fin-overtime-history-list');
    if (finOvertimeList) {
        finOvertimeList.innerHTML = '';
        const overtimeList = stats.overtimeList || [];
        if (overtimeList.length === 0) {
            finOvertimeList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">No overtime hours logged this month.</p>`;
        } else {
            overtimeList.forEach(o => {
                const oDiv = document.createElement('div');
                oDiv.className = 'ledger-card flex-between';
                let delBtn = isFinAdmin ? `<button onclick="deleteOvertimeHourFromFin('${worker.id}', '${o.id}')" class="btn-outline-danger" style="padding: 4px 10px; font-size: 0.75rem;">Undo</button>` : '';
                oDiv.innerHTML = `
                            <div>
                                <strong style="color:#f59e0b;">+ SAR ${o.amount}</strong><br>
                                <span style="font-size: 0.75rem; color: var(--text-muted);">${o.hours} hr (x${o.multiplier}) • ${o.date}</span>
                            </div>
                            ${delBtn}
                        `;
                finOvertimeList.appendChild(oDiv);
            });
        }
    }

    document.getElementById('initial-balance-amount').value = worker.initialBalance || 0;

    // Render Payment History
    if (!stats.paymentsList || stats.paymentsList.length === 0) {
        if (pHistList) pHistList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">No payments recorded this month.</p>`;
    } else {
        stats.paymentsList.forEach(p => {
            const pDiv = document.createElement('div');
            pDiv.className = 'ledger-card flex-between';
            let delBtn = isFinAdmin ? `<button onclick="deletePaymentRecord('${worker.id}', '${p.id}')" class="btn-outline-danger" style="padding: 4px 10px; font-size: 0.75rem;">Undo</button>` : '';
            pDiv.innerHTML = `
                        <div>
                            <strong class="text-info">+ SAR ${p.amount}</strong><br>
                            <span style="font-size: 0.75rem; color: var(--text-muted);">🕒 ${p.date}</span>
                        </div>
                        ${delBtn}
                    `;
            if (pHistList) pHistList.appendChild(pDiv);
        });
    }

    // Render Reward History
    const noRewards = (!stats.rewardsList || stats.rewardsList.length === 0);
    const volumeRewardVal = typeof getDriverVolumeRewardsForMonth === 'function' ? getDriverVolumeRewardsForMonth(worker, currentGlobalMonth) : 0;
    if (noRewards && volumeRewardVal === 0) {
        if (rHistList) rHistList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">No rewards recorded this month.</p>`;
    } else {
        if (rHistList) rHistList.innerHTML = '';
        if (volumeRewardVal > 0) {
            const rDiv = document.createElement('div');
            rDiv.className = 'ledger-card flex-between';
            rDiv.style.borderLeft = '4px solid var(--success)';
            rDiv.innerHTML = `
                <div>
                    <strong class="text-success">+ SAR ${volumeRewardVal.toLocaleString()}</strong><br>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${isAr ? 'مكافآت عدد التوصيلات اليومية' : 'Auto Daily Order Volume Rewards'}</span>
                </div>
            `;
            if (rHistList) rHistList.appendChild(rDiv);
        }
        if (!noRewards) {
            stats.rewardsList.forEach(r => {
                const rDiv = document.createElement('div');
                rDiv.className = 'ledger-card flex-between';
                let delBtn = isFinAdmin ? `<button onclick="deleteRewardRecord('${worker.id}', '${r.id}')" class="btn-outline-danger" style="padding: 4px 10px; font-size: 0.75rem;">Undo</button>` : '';
                rDiv.innerHTML = `
                            <div>
                                <strong class="text-success">+ SAR ${r.amount}</strong><br>
                                <span style="font-size: 0.75rem; color: var(--text-muted);">🕒 ${r.date}</span>
                            </div>
                            ${delBtn}
                        `;
                if (rHistList) rHistList.appendChild(rDiv);
            });
        }
    }

    // Render Custody History
    if (!stats.custodyList || stats.custodyList.length === 0) {
        if (cHistList) cHistList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">No custody recorded this month.</p>`;
    } else {
        stats.custodyList.forEach(c => {
            const cDiv = document.createElement('div');
            cDiv.className = 'ledger-card flex-between';
            let delBtn = isFinAdmin ? `<button onclick="deleteCustodyRecord('${worker.id}', '${c.id}')" class="btn-outline-danger" style="padding: 4px 10px; font-size: 0.75rem;">Undo</button>` : '';

            let textHtml = '';
            if (c.type === 'given') {
                textHtml = `<strong class="text-warning">Given: SAR ${c.amount}</strong>`;
            } else {
                textHtml = `<strong class="text-success">Returned: SAR ${c.amount}</strong>`;
            }

            cDiv.innerHTML = `
                        <div>
                            ${textHtml}<br>
                            <span style="font-size: 0.75rem; color: var(--text-muted);">🕒 ${c.date}</span>
                        </div>
                        ${delBtn}
                    `;
            if (cHistList) cHistList.appendChild(cDiv);
        });
    }

    // Render Detailed Violations
    const noViolations = (!stats.violationsList || stats.violationsList.length === 0);

    if (vHistList) {
        vHistList.innerHTML = '';

        // 1. Auto Late Penalties
        if (lateDeduction > 0) {
            const vDiv = document.createElement('div');
            vDiv.className = 'ledger-card';
            vDiv.style.borderLeft = '4px solid var(--danger)';
            vDiv.style.marginBottom = '8px';
            vDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong class="text-danger">${isAr ? 'خصم تأخير تلقائي' : 'Auto Late Penalties'}</strong><br>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${isAr ? 'مستقطع من سجلات حضور هذا الشهر' : 'Deducted from attendance records of this month'}</span>
                    </div>
                    <strong style="color:var(--danger); font-size:1rem;">- SAR ${lateDeduction.toLocaleString()}</strong>
                </div>
            `;
            vHistList.appendChild(vDiv);
        }

        // 2. System Violations Deduction
        if (sysViolDeduction > 0) {
            const vDiv = document.createElement('div');
            vDiv.className = 'ledger-card';
            vDiv.style.borderLeft = '4px solid var(--danger)';
            vDiv.style.marginBottom = '8px';
            vDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong class="text-danger">${isAr ? 'خصم المخالفات النظامية' : 'System Violations Deduction'}</strong><br>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${isAr ? 'خصم تلقائي حسب مستوى المخالفة' : 'Deducted automatically based on violation level'}</span>
                    </div>
                    <strong style="color:var(--danger); font-size:1rem;">- SAR ${sysViolDeduction.toLocaleString()}</strong>
                </div>
            `;
            vHistList.appendChild(vDiv);
        }

        // 3. Regular Violations
        if (noViolations) {
            if (lateDeduction === 0 && sysViolDeduction === 0) {
                vHistList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">No violations recorded this month.</p>`;
            }
        } else {
            stats.violationsList.forEach(v => {
                const vDiv = document.createElement('div');
                vDiv.className = 'ledger-card';
                vDiv.style.borderLeft = '4px solid var(--danger)';
                vDiv.style.marginBottom = '8px';

                let imgHtml = v.image ? `<img src="${v.image}" onclick="showImage('${v.image}')" class="proof-img" style="max-height: 80px; display: block; margin-top: 10px;">` : '';
                let statusHtml = ''; let actionBtns = ''; let isApplied = false;

                if (v.status === 'waived') {
                    statusHtml = `<span class="text-success" style="font-size: 0.8rem;">${t('label-fixed-waived')}</span>`;
                } else if (v.status === 'active' || !v.status) {
                    statusHtml = `<span class="text-danger" style="font-size: 0.8rem;">${t('label-penalty-applied')}${v.amount}</span>`;
                    isApplied = true;
                } else if (v.status === 'pending') {
                    const deadline = v.timestamp + (v.graceDays * 86400000);
                    const timeLeft = deadline - Date.now();
                    if (timeLeft <= 0) {
                        statusHtml = `<span class="text-danger" style="font-size: 0.8rem;">${t('label-time-expired')}${v.amount})</span>`;
                        isApplied = true;
                    } else {
                        const h = Math.floor(timeLeft / 3600000).toString().padStart(2, '0');
                        const m = Math.floor((timeLeft % 3600000) / 60000).toString().padStart(2, '0');
                        const s = Math.floor((timeLeft % 60000) / 1000).toString().padStart(2, '0');
                        statusHtml = `<span class="viol-timer text-warning" data-deadline="${deadline}" style="font-size: 0.8rem;">${t('label-fix-within')}${h}h ${m}m ${s}s</span>`;
                        if (isFinAdmin) {
                            actionBtns = `
                                    <button onclick="resolveViolation('${worker.id}', '${v.id}', 'waive')" class="btn-success" style="padding: 6px 12px; font-size: 0.75rem; margin-right: 4px;">${t('btn-fixed-waive')}</button>
                                    <button onclick="resolveViolation('${worker.id}', '${v.id}', 'apply')" class="btn-danger" style="padding: 6px 12px; font-size: 0.75rem;">${t('btn-not-fixed-apply')}</button>
                                `;
                        }
                    }
                }

                let delBtn = isFinAdmin ? `<button onclick="deleteDetailedViolation('${worker.id}', '${v.id}')" class="btn-outline-danger" style="padding: 4px 8px; font-size: 0.75rem;">${t('btn-remove')}</button>` : '';

                vDiv.innerHTML = `
                        <div class="flex-between" style="margin-bottom: 8px;"><span style="font-size: 0.8rem; color: var(--text-muted);">🕒 ${v.date}</span>${delBtn}</div>
                        <div style="font-weight: 600; color: var(--text-main); margin-bottom: 12px; font-size:1.05rem;">${v.reason} <span style="color: ${isApplied ? 'var(--danger)' : 'var(--text-muted)'}; float: right; text-decoration: ${v.status === 'waived' ? 'line-through' : 'none'};">- SAR ${v.amount}</span></div>
                        <div class="flex-between" style="align-items: center; border-top:1px solid var(--border-color); padding-top:8px; margin-top:8px;"><div>${statusHtml}</div><div>${actionBtns}</div></div>${imgHtml}`;
                if (vHistList) vHistList.appendChild(vDiv);
            });
        }
    }
}

// SUMMARY TAB RENDERING
function renderSummaryTable() {
    const isAr = currentAppLang === 'ar';
    const container = document.getElementById('summary-cards-container');
    if (!container) return;
    container.innerHTML = '';

    const workersToRender = getVisibleWorkers();

    if (workersToRender.length === 0 && (!currentUser || currentUser.role !== 'admin')) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:1rem; padding: 40px;">${t('msg-not-linked')}</p>`;
        return;
    }

    workersToRender.forEach(worker => {
        const monthlyLogs = getLogsForMonth(worker, currentGlobalMonth);
        const avg = getAveragePerfection(monthlyLogs);
        const goodCount = monthlyLogs.filter(l => l.noteType === 'good' || l.score == 100).length;
        const badCount = monthlyLogs.filter(l => l.noteType === 'bad' || l.score == 2.5).length;
        const remainingAllTime = getCumulativeBalance(worker, currentGlobalMonth);

        const stats = getMonthlyStats(worker, currentGlobalMonth);
        const deliveries = (stats.deliveriesList ? stats.deliveriesList.length : 0) + (stats.legacyDeliveries || 0);
        const costs = parseFloat(stats.costs || 0);

        const base = parseFloat(worker.income || 0);
        const rew = calculateRewardsTotal(stats.rewardsList);
        const viol = calculateViolationsTotal(stats.violationsList);
        const sysViolDeduction = typeof getSystemViolationDeductionsForMonth === 'function' ? getSystemViolationDeductionsForMonth(worker, currentGlobalMonth) : 0;
        const lateDeduction = typeof getLateDeductionsForMonth === 'function' ? getLateDeductionsForMonth(worker, currentGlobalMonth) : 0;
        const volumeReward = typeof getDriverVolumeRewardsForMonth === 'function' ? getDriverVolumeRewardsForMonth(worker, currentGlobalMonth) : 0;
        const ov = calculateOvertimeTotal(stats.overtimeList);
        const netThisMonth = base + rew + volumeReward + ov - viol - sysViolDeduction - lateDeduction;
        const paidThisMonth = calculatePaymentsTotal(stats.paymentsList);

        // Calculate Monthly Attendance, Lateness & Vacation Stats
        const companyData = getCompanyData();
        const attendance = companyData.attendance || {};
        const graceMins = parseInt(companyData.lateGraceMinutes || 0);

        let presentCount = 0;
        let absentCount = 0;
        let vacationCount = 0;
        let lateCount = 0;

        Object.keys(attendance).forEach(dateStr => {
            if (dateStr.startsWith(currentGlobalMonth)) {
                const dayMap = attendance[dateStr] || {};
                const att = dayMap[worker.id];
                if (att) {
                    if (att.status === 'present') {
                        presentCount++;
                        const isLateStr = att.lateness && att.lateness !== '' && att.lateness !== 'None' && att.lateness !== '--';
                        if (isLateStr) {
                            lateCount++;
                        } else {
                            let shiftStart = worker.startTime || '09:00';
                            const dateParts = dateStr.split('-');
                            const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                            const dayOfWeekName = dayNames[dateObj.getDay()];
                            const dateOverrideShift = (worker.shifts || []).find(s => s.dayOfWeek === dayOfWeekName || s.specificDate === dateStr);
                            if (dateOverrideShift) {
                                shiftStart = dateOverrideShift.startTime;
                            }
                            if (att.time && shiftStart) {
                                const [sH, sM] = shiftStart.split(':').map(Number);
                                const [cH, cM] = att.time.split(':').map(Number);
                                if (!isNaN(sH) && !isNaN(cH)) {
                                    const startMins = sH * 60 + (sM || 0);
                                    const checkMins = cH * 60 + (cM || 0);
                                    const diff = checkMins - startMins;
                                    const rules = companyData.lateRules || [];
                                    let isLate = false;
                                    if (rules.length === 0) {
                                        if (diff > graceMins) isLate = true;
                                    } else {
                                        const minMins = Math.min(...rules.map(r => r.mins));
                                        if (diff >= minMins) isLate = true;
                                    }
                                    if (isLate) {
                                        lateCount++;
                                    }
                                }
                            }
                        }
                    } else if (att.status === 'absent') {
                        absentCount++;
                    } else if (att.status === 'vacation') {
                        vacationCount++;
                    }
                }
            }
        });

        // Add performance log vacations if logged via log daily performance
        const perfVacations = monthlyLogs.filter(l => l.noteType === 'vacation').length;
        if (vacationCount === 0 && perfVacations > 0) {
            vacationCount = perfVacations;
        }

        // Count Tasks Done in Current Month
        const monthAbbr = new Date(currentGlobalMonth + '-01').toLocaleString('en-US', { month: 'short' });
        const tasksDoneThisMonth = (worker.jobs || []).filter(j => {
            if (!j.done && j.status !== 'completed') return false;
            if (j.completedAt) {
                const d = new Date(j.completedAt);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === currentGlobalMonth;
            }
            return j.date && j.date.startsWith(monthAbbr);
        }).length;

        // Build violations cell
        let violCellHtml = '';
        const violList = stats.violationsList || [];
        if (violList.length === 0) {
            violCellHtml = `<div style="color:var(--success); font-size:0.9rem; font-weight:600; padding: 12px; background:var(--success-bg); border-radius:8px; border:1px solid var(--success-border); text-align:center;">✅ No violations recorded this month.</div>`;
        } else {
            violList.forEach(v => {
                let badge = '';
                if (v.status === 'waived') {
                    badge = `<div style="margin-bottom:8px; padding:10px 12px; background:var(--success-bg); border:1px solid var(--success-border); border-radius:8px; font-size:0.85rem;">
                                <div style="font-weight:600; color:var(--text-main); margin-bottom:4px;">✅ ${v.reason}</div>
                                <div style="color:var(--success);">Fixed – Waived ✔</div>
                            </div>`;
                } else if (v.status === 'active' || !v.status) {
                    badge = `<div style="margin-bottom:8px; padding:10px 12px; background:var(--danger-bg); border:1px solid var(--danger-border); border-radius:8px; font-size:0.85rem;">
                                <div style="font-weight:600; color:var(--text-main); margin-bottom:4px;">🚨 ${v.reason}</div>
                                <div style="color:var(--danger); font-weight:500;">Penalty Applied – SAR ${parseFloat(v.amount).toLocaleString()}</div>
                            </div>`;
                } else if (v.status === 'pending') {
                    const deadline = v.timestamp + (v.graceDays * 86400000);
                    const timeLeft = deadline - Date.now();
                    if (timeLeft <= 0) {
                        badge = `<div style="margin-bottom:8px; padding:10px 12px; background:var(--danger-bg); border:1px solid var(--danger-border); border-radius:8px; font-size:0.85rem;">
                                    <div style="font-weight:600; color:var(--text-main); margin-bottom:4px;">🚨 ${v.reason}</div>
                                    <div style="color:var(--danger); font-weight:500;">Time Expired – Penalty Applied (SAR ${parseFloat(v.amount).toLocaleString()})</div>
                                </div>`;
                    } else {
                        const totalHours = Math.floor(timeLeft / 3600000);
                        const daysLeft = Math.floor(totalHours / 24);
                        const hoursLeft = totalHours % 24;
                        const minsLeft = Math.floor((timeLeft % 3600000) / 60000);
                        let timeStr = '';
                        if (daysLeft > 0) timeStr = `${daysLeft}d ${hoursLeft}h left`;
                        else if (hoursLeft > 0) timeStr = `${hoursLeft}h ${minsLeft}m left`;
                        else timeStr = `${minsLeft}m left`;
                        badge = `<div style="margin-bottom:8px; padding:10px 12px; background:var(--warning-bg); border:1px solid var(--warning-border); border-radius:8px; font-size:0.85rem;">
                                    <div style="font-weight:600; color:var(--text-main); margin-bottom:4px;">⚠️ ${v.reason}</div>
                                    <div style="color:var(--warning); font-weight:600;">⏳ Fix within: ${timeStr}</div>
                                    <div style="color:var(--text-muted); font-size:0.75rem; margin-top:2px;">Penalty if not fixed: SAR ${parseFloat(v.amount).toLocaleString()}</div>
                                </div>`;
                    }
                }
                violCellHtml += badge;
            });
        }

        // System violations block
        const sysViolList = worker.systemViolations || [];
        const sysViolLogs = typeof getSystemViolationLogsForMonth === 'function' ? getSystemViolationLogsForMonth(worker, currentGlobalMonth) : [];
        const sysViolCount = sysViolList.length;

        let sysViolHtml = '';
        if (sysViolCount > 0) {
            let logRows = '';
            sysViolLogs.forEach(l => {
                logRows += `<div style="font-size:0.8rem; color:var(--danger); margin-top:4px; font-weight:600;">
                    • ${l.text} ${l.amount > 0 ? `(- SAR ${l.amount})` : ''}
                </div>`;
            });
            sysViolHtml = `
                <div style="margin-top: 12px; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--input-bg);">
                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); display: flex; justify-content: space-between;">
                        <span>⚠️ System Violations</span>
                        <span class="badge badge-bad" style="margin: 0; font-size: 0.75rem; padding: 2px 6px;">${sysViolCount}/6</span>
                    </div>
                    ${logRows}
                </div>
            `;
        } else {
            sysViolHtml = `
                <div style="margin-top: 12px; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--input-bg);">
                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); display: flex; justify-content: space-between;">
                        <span>⚠️ System Violations</span>
                        <span class="badge" style="margin: 0; font-size: 0.75rem; padding: 2px 6px; background:var(--success); color:white;">0/6</span>
                    </div>
                </div>
            `;
        }

        // 1. Calculate Rewards List for Summary card
        const rewardsList = stats.rewardsList || [];
        let rewardsLogHtml = '';
        if (rewardsList.length === 0) {
            rewardsLogHtml = `<div style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:12px;">${isAr ? 'لا توجد مكافآت هذا الشهر.' : 'No rewards recorded this month.'}</div>`;
        } else {
            rewardsList.forEach(r => {
                const amt = parseFloat(r.amount || 0);
                rewardsLogHtml += `<div style="margin-bottom:8px; padding:10px 12px; background:var(--success-bg); border:1px solid var(--success-border); border-radius:8px; font-size:0.85rem;">
                    <div style="font-weight:600; color:var(--text-main); display:flex; justify-content:space-between;">
                        <span>🎁 ${r.reason || (isAr ? 'مكافأة' : 'Bonus')}</span>
                        <span style="color:var(--success);">+ SAR ${amt.toLocaleString()}</span>
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">📅 ${r.date}</div>
                </div>`;
            });
        }

        // 2. Calculate Custody Ledger for Summary card
        let custodyTaken = 0;
        let custodyReturned = 0;
        let custodyLogHtml = '';
        const custodyList = stats.custodyList || [];
        if (custodyList.length === 0) {
            custodyLogHtml = `<div style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:12px;">${isAr ? 'لا توجد عمليات عهدة.' : 'No custody transactions.'}</div>`;
        } else {
            custodyList.forEach(c => {
                const amt = parseFloat(c.amount || 0);
                if (c.type === 'given') {
                    custodyTaken += amt;
                    custodyLogHtml += `<div class="flex-between" style="font-size:0.85rem; margin-bottom:6px; border-bottom:1px dashed var(--border-color); padding-bottom:4px;">
                        <span>📥 ${isAr ? 'استلام عهدة:' : 'Taken:'} ${c.date}</span>
                        <span style="color:#f59e0b; font-weight:700;">+ SAR ${amt.toLocaleString()}</span>
                    </div>`;
                } else {
                    custodyReturned += amt;
                    custodyLogHtml += `<div class="flex-between" style="font-size:0.85rem; margin-bottom:6px; border-bottom:1px dashed var(--border-color); padding-bottom:4px;">
                        <span>📤 ${isAr ? 'إرجاع عهدة:' : 'Returned:'} ${c.date}</span>
                        <span style="color:var(--success); font-weight:700;">- SAR ${amt.toLocaleString()}</span>
                    </div>`;
                }
            });
        }
        const outstandingCustody = custodyTaken - custodyReturned;
        const custodyStatusHtml = outstandingCustody > 0
            ? `<div style="color:#b45309; font-weight:700; font-size:0.85rem; text-align:center; background:#fffbeb; border:1px solid #fef3c7; padding:6px; border-radius:6px; margin-bottom:12px;">⏳ ${isAr ? 'مستحق الإرجاع:' : 'Outstanding to Return:'} SAR ${outstandingCustody.toLocaleString()}</div>`
            : `<div style="color:var(--success); font-weight:700; font-size:0.85rem; text-align:center; background:var(--success-bg); border:1px solid var(--success-border); padding:6px; border-radius:6px; margin-bottom:12px;">✅ ${isAr ? 'تمت إعادة الجميع' : 'All Returned'}</div>`;

        const card = document.createElement('div');
        card.className = 'summary-worker-card';
        card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:20px; border-bottom:1px solid var(--border-color); padding-bottom:15px;">
                        <div>
                            <div style="font-size:1.3rem; font-weight:700; color:var(--text-main); margin-bottom:6px;">${worker.name}</div>
                            <div style="font-size:0.9rem; color:var(--text-muted); display:flex; align-items:center; gap:8px;">
                                ${worker.branch} <span class="rank-badge rank-${worker.rank}" style="margin:0;">${worker.rank}</span>
                            </div>
                            ${sysViolHtml}
                        </div>
                        <div style="text-align:right; background:var(--input-bg); padding:12px 16px; border-radius:8px; border:1px solid var(--border-color);">
                            <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; font-weight:600; letter-spacing:0.5px; margin-bottom:4px;">${t('th-total-remaining')}</div>
                            <div style="font-size:1.4rem; font-weight:800; color:var(--primary);">SAR ${remainingAllTime.toLocaleString()}</div>
                        </div>
                    </div>

                    <div class="stats-grid" style="margin-bottom:20px;">
                        <div style="background:var(--input-bg); padding:16px 12px; border-radius:8px; text-align:center; border:1px solid var(--border-color);">
                            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px; font-weight:500;">${t('label-good-notes')}</div>
                            <div style="font-size:1.4rem; font-weight:700; color:var(--success); line-height:1;">${goodCount}</div>
                        </div>
                        <div style="background:var(--input-bg); padding:16px 12px; border-radius:8px; text-align:center; border:1px solid var(--border-color);">
                            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px; font-weight:500;">${t('label-bad-notes')}</div>
                            <div style="font-size:1.4rem; font-weight:700; color:var(--danger); line-height:1;">${badCount}</div>
                        </div>
                        <div style="background:var(--input-bg); padding:16px 12px; border-radius:8px; text-align:center; border:1px solid var(--border-color);">
                            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px; font-weight:500;">${t('label-deliveries-sm')}</div>
                            <div style="font-size:1.4rem; font-weight:700; color:var(--warning); line-height:1;">${deliveries}</div>
                        </div>
                        <div style="background:var(--input-bg); padding:16px 12px; border-radius:8px; text-align:center; border:1px solid var(--border-color);">
                            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px; font-weight:500;">${t('label-tasks-done')}</div>
                            <div style="font-size:1.4rem; font-weight:700; color:var(--primary); line-height:1;">${tasksDoneThisMonth}</div>
                        </div>
                        <div style="background:var(--input-bg); padding:16px 12px; border-radius:8px; text-align:center; border:1px solid var(--border-color);">
                            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px; font-weight:500;">${t('label-avg-perf')}</div>
                            <div style="font-size:1.4rem; font-weight:700; color:var(--text-main); line-height:1;">${avg}</div>
                        </div>
                        <div style="background:var(--input-bg); padding:12px 12px; border-radius:8px; text-align:center; border:1px solid var(--border-color); display:flex; flex-direction:column; justify-content:center;">
                            <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; font-weight:700;">${isAr ? 'الحضور والغياب' : 'Attendance Stats'}</div>
                            <div style="font-size:0.85rem; font-weight:700; color:var(--text-main); display:flex; flex-direction:column; gap:2px; text-align:inherit; padding:0 4px;">
                                <div style="color:var(--success); display:flex; justify-content:space-between; gap:6px;">
                                    <span>${isAr ? 'حاضر' : 'Present'}:</span>
                                    <span>${presentCount}</span>
                                </div>
                                <div style="color:#0284c7; display:flex; justify-content:space-between; gap:6px;">
                                    <span>${isAr ? 'إجازة' : 'Vacation'}:</span>
                                    <span>${vacationCount}</span>
                                </div>
                                <div style="color:var(--danger); display:flex; justify-content:space-between; gap:6px;">
                                    <span>${isAr ? 'غائب' : 'Absent'}:</span>
                                    <span>${absentCount}</span>
                                </div>
                                <div style="color:var(--warning); display:flex; justify-content:space-between; gap:6px;">
                                    <span>${isAr ? 'متأخر' : 'Late'}:</span>
                                    <span>${lateCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-top:16px;">
                        <!-- Salary Breakdown Panel -->
                        <div style="background:var(--input-bg); padding:16px; border-radius:8px; border:1px solid var(--border-color); display:flex; flex-direction:column; justify-content:space-between;">
                            <div style="font-size:0.95rem; font-weight:600; color:var(--text-main); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                                📊 ${isAr ? 'تفاصيل الراتب والخصومات' : 'Salary & Balance Breakdown'}
                            </div>
                            <div style="font-size:0.85rem; display:flex; flex-direction:column; gap:8px; flex:1; justify-content:center;">
                                <div class="flex-between" style="border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; margin-bottom: 2px;">
                                    <span style="color:var(--text-muted);">${isAr ? 'الراتب الأساسي:' : 'Base Salary:'}</span>
                                    <strong style="color:var(--text-main);">SAR ${base.toLocaleString()}</strong>
                                </div>
                                ${ov > 0 ? `
                                <div class="flex-between" style="border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; margin-bottom: 2px;">
                                    <span style="color:var(--text-muted);">${isAr ? 'ساعات إضافية:' : 'Overtime Earned:'}</span>
                                    <strong style="color:var(--success);">+ SAR ${ov.toLocaleString()}</strong>
                                </div>` : ''}
                                ${(rew + volumeReward) > 0 ? `
                                <div class="flex-between" style="border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; margin-bottom: 2px;">
                                    <span style="color:var(--text-muted);">${isAr ? 'المكافآت والحوافز:' : 'Rewards & Volume:'}</span>
                                    <strong style="color:var(--success);">+ SAR ${(rew + volumeReward).toLocaleString()}</strong>
                                </div>` : ''}
                                ${viol > 0 ? `
                                <div class="flex-between" style="border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; margin-bottom: 2px;">
                                    <span style="color:var(--text-muted);">${isAr ? 'المخالفات العادية:' : 'Normal Violations:'}</span>
                                    <strong style="color:var(--danger);">- SAR ${viol.toLocaleString()}</strong>
                                </div>` : ''}
                                ${sysViolDeduction > 0 ? `
                                <div class="flex-between" style="border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; margin-bottom: 2px;">
                                    <span style="color:var(--text-muted);">${isAr ? 'مخالفات النظام:' : 'System Violations:'}</span>
                                    <strong style="color:var(--danger);">- SAR ${sysViolDeduction.toLocaleString()}</strong>
                                </div>` : ''}
                                ${lateDeduction > 0 ? `
                                <div class="flex-between" style="border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; margin-bottom: 2px;">
                                    <span style="color:var(--text-muted);">${isAr ? 'خصم التأخير:' : 'Late Penalties:'}</span>
                                    <strong style="color:var(--danger);">- SAR ${lateDeduction.toLocaleString()}</strong>
                                </div>` : ''}
                                <div class="flex-between" style="border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; padding-top:4px; margin-top:2px;">
                                    <strong style="color:var(--text-main); font-weight:700;">${isAr ? 'صافي راتب الشهر:' : 'Net Monthly Salary:'}</strong>
                                    <strong style="color:var(--primary); font-weight:800;">SAR ${netThisMonth.toLocaleString()}</strong>
                                </div>
                                ${paidThisMonth > 0 ? `
                                <div class="flex-between" style="border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; margin-bottom: 2px;">
                                    <span style="color:var(--text-muted);">${isAr ? 'المسحوبات والسلف:' : 'Draws/Payments:'}</span>
                                    <strong style="color:var(--danger);">- SAR ${paidThisMonth.toLocaleString()}</strong>
                                </div>` : ''}
                                <div class="flex-between" style="padding-top:8px; margin-top:4px;">
                                    <strong style="color:var(--text-main); font-weight:800;">${isAr ? 'الرصيد التراكمي المتبقي:' : 'Cumulative Balance:'}</strong>
                                    <strong style="color:var(--success); font-size:1.05rem; font-weight:900;">SAR ${remainingAllTime.toLocaleString()}</strong>
                                </div>
                            </div>
                        </div>

                        <!-- Violations Panel -->
                        <div style="background:var(--input-bg); padding:16px; border-radius:8px; border:1px solid var(--border-color);">
                            <div style="font-size:0.95rem; font-weight:600; color:var(--text-main); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                                ⚠️ ${t('title-my-violations')}
                            </div>
                            <div style="max-height:200px; overflow-y:auto; padding-right:4px;">
                                ${violCellHtml}
                            </div>
                        </div>

                        <!-- Rewards Panel -->
                        <div style="background:var(--input-bg); padding:16px; border-radius:8px; border:1px solid var(--border-color);">
                            <div style="font-size:0.95rem; font-weight:600; color:var(--text-main); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                                🎁 ${isAr ? 'المكافآت والحوافز' : 'My Rewards & Bonuses'}
                            </div>
                            <div style="max-height:200px; overflow-y:auto; padding-right:4px;">
                                ${rewardsLogHtml}
                            </div>
                        </div>

                        <!-- Custody Statement Panel -->
                        <div style="background:var(--input-bg); padding:16px; border-radius:8px; border:1px solid var(--border-color);">
                            <div style="font-size:0.95rem; font-weight:600; color:var(--text-main); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                                💰 ${isAr ? 'كشف حساب العهدة' : 'My Custody Statement'}
                            </div>
                            ${custodyStatusHtml}
                            <div style="max-height:140px; overflow-y:auto; padding-right:4px;">
                                ${custodyLogHtml}
                            </div>
                        </div>

                        <!-- Company Costs Panel -->
                        <div style="background:var(--input-bg); padding:16px; border-radius:8px; border:1px solid var(--border-color); display:flex; flex-direction:column; justify-content:center; text-align:center;">
                            <div style="font-size:0.9rem; font-weight:600; color:var(--text-main); margin-bottom:8px;">${t('label-company-costs-sm')}</div>
                            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:16px; line-height:1.4;">${t('desc-costs')}</div>
                            <div style="font-size:1.4rem; font-weight:700; color:var(--danger); background:var(--danger-bg); padding:10px; border-radius:6px; border:1px solid var(--danger-border);">SAR ${costs.toLocaleString()}</div>
                        </div>
                    </div>
                `;
        container.appendChild(card);
    });
}



// --- GAMIFICATION LEADERBOARDS (EMPLOYEES & DRIVERS) ---
function saveRankingSettings() {
    const isAr = currentAppLang === 'ar';
    const attendPts = parseInt(document.getElementById('rank-pts-attendance')?.value || '5', 10);
    const onTimePts = parseInt(document.getElementById('rank-pts-ontime')?.value || '2', 10);
    const normalTaskPts = parseInt(document.getElementById('rank-pts-normal-task')?.value || '10', 10);
    const urgentTaskPts = parseInt(document.getElementById('rank-pts-urgent-task')?.value || '20', 10);
    const deliveryPts = parseInt(document.getElementById('rank-pts-delivery')?.value || '15', 10);

    const rankingSettings = {
        attendPts,
        onTimePts,
        normalTaskPts,
        urgentTaskPts,
        deliveryPts,
        updatedAt: Date.now()
    };

    db.ref(`companies/${currentCompany}/rankingSettings`).set(rankingSettings)
        .then(() => {
            if (typeof showInAppNotification === 'function') {
                showInAppNotification(isAr ? 'تم حفظ إعدادات نقاط التقييم بنجاح!' : 'Point rules saved successfully!');
            }
            renderLeaderboard();
        })
        .catch(err => console.error("Error saving ranking settings:", err));
}
window.saveRankingSettings = saveRankingSettings;

function renderRankingSettingsInputs() {
    const companyData = getCompanyData();
    const settings = companyData.rankingSettings || { attendPts: 5, onTimePts: 2, normalTaskPts: 10, urgentTaskPts: 20, deliveryPts: 15 };

    const elAtt = document.getElementById('rank-pts-attendance');
    const elOnTime = document.getElementById('rank-pts-ontime');
    const elNormal = document.getElementById('rank-pts-normal-task');
    const elUrgent = document.getElementById('rank-pts-urgent-task');
    const elDelivery = document.getElementById('rank-pts-delivery');

    if (elAtt && !elAtt.matches(':focus')) elAtt.value = settings.attendPts !== undefined ? settings.attendPts : 5;
    if (elOnTime && !elOnTime.matches(':focus')) elOnTime.value = settings.onTimePts !== undefined ? settings.onTimePts : 2;
    if (elNormal && !elNormal.matches(':focus')) elNormal.value = settings.normalTaskPts !== undefined ? settings.normalTaskPts : 10;
    if (elUrgent && !elUrgent.matches(':focus')) elUrgent.value = settings.urgentTaskPts !== undefined ? settings.urgentTaskPts : 20;
    if (elDelivery && !elDelivery.matches(':focus')) elDelivery.value = settings.deliveryPts !== undefined ? settings.deliveryPts : 15;
}
window.renderRankingSettingsInputs = renderRankingSettingsInputs;

function renderLeaderboard() {
    const companyData = getCompanyData();
    const workers = companyData.workers || [];
    if (workers.length === 0) return;

    if (typeof renderRankingSettingsInputs === 'function') {
        renderRankingSettingsInputs();
    }

    const isAr = currentAppLang === 'ar';
    const settings = companyData.rankingSettings || { attendPts: 5, onTimePts: 2, normalTaskPts: 10, urgentTaskPts: 20, deliveryPts: 15 };

    // 1. Calculate general leaderboard (All workers with custom points)
    const generalRanked = workers.map(worker => {
        const avg = parseFloat(getAveragePerfection(getLogsForMonth(worker, currentGlobalMonth)) || 0);

        let taskPoints = 0;
        let taskHigh = 0;
        let taskNormal = 0;
        if (worker.jobs) {
            worker.jobs.forEach(job => {
                if (job.status === 'completed' || job.done) {
                    const urgency = (job.urgency || 'normal').toLowerCase();
                    if (urgency === 'high' || urgency === 'urgent') {
                        taskPoints += (settings.urgentTaskPts !== undefined ? settings.urgentTaskPts : 20);
                        taskHigh++;
                    } else {
                        taskPoints += (settings.normalTaskPts !== undefined ? settings.normalTaskPts : 10);
                        taskNormal++;
                    }
                }
            });
        }

        // Attendance points for current month
        let attendancePoints = 0;
        const allAttendance = companyData.attendance || {};
        Object.keys(allAttendance).forEach(dateStr => {
            if (currentGlobalMonth && dateStr.startsWith(currentGlobalMonth)) {
                const dayAtt = (allAttendance[dateStr] || {})[worker.id];
                if (dayAtt && dayAtt.status === 'present') {
                    attendancePoints += (settings.attendPts !== undefined ? settings.attendPts : 5);
                    if (!dayAtt.lateness) {
                        attendancePoints += (settings.onTimePts !== undefined ? settings.onTimePts : 2);
                    }
                }
            }
        });

        // Driver delivery points
        const stats = getMonthlyStats(worker, currentGlobalMonth);
        const deliveries = (stats.deliveriesList ? stats.deliveriesList.length : 0) + (stats.legacyDeliveries || 0);
        const deliveryPoints = deliveries * (settings.deliveryPts !== undefined ? settings.deliveryPts : 15);

        const totalScore = Math.round(avg + taskPoints + attendancePoints + deliveryPoints);

        return {
            id: worker.id,
            name: worker.name,
            role: worker.role || (isAr ? 'موظف' : 'Staff'),
            avg: avg,
            taskPoints: taskPoints,
            taskHigh: taskHigh,
            taskNormal: taskNormal,
            attendancePoints: attendancePoints,
            deliveryPoints: deliveryPoints,
            score: totalScore
        };
    }).sort((a, b) => b.score - a.score);

    // Populate General Podium
    const p1Name = document.getElementById('podium-1-name');
    const p1Score = document.getElementById('podium-1-score');
    const p2Name = document.getElementById('podium-2-name');
    const p2Score = document.getElementById('podium-2-score');
    const p3Name = document.getElementById('podium-3-name');
    const p3Score = document.getElementById('podium-3-score');

    if (generalRanked[0]) {
        if (p1Name) p1Name.textContent = generalRanked[0].name;
        if (p1Score) p1Score.textContent = `${generalRanked[0].score} pts`;
    } else {
        if (p1Name) p1Name.textContent = '—';
        if (p1Score) p1Score.textContent = '—';
    }
    if (generalRanked[1]) {
        if (p2Name) p2Name.textContent = generalRanked[1].name;
        if (p2Score) p2Score.textContent = `${generalRanked[1].score} pts`;
    } else {
        if (p2Name) p2Name.textContent = '—';
        if (p2Score) p2Score.textContent = '—';
    }
    if (generalRanked[2]) {
        if (p3Name) p3Name.textContent = generalRanked[2].name;
        if (p3Score) p3Score.textContent = `${generalRanked[2].score} pts`;
    } else {
        if (p3Name) p3Name.textContent = '—';
        if (p3Score) p3Score.textContent = '—';
    }

    // Populate General List
    const genListDiv = document.getElementById('leaderboard-list');
    if (genListDiv) {
        genListDiv.innerHTML = '';
        generalRanked.forEach((worker, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

            let breakdownStr = '';
            if (isAr) {
                breakdownStr = `الأداء: ${worker.avg}% | الحضور: ${worker.attendancePoints}ن | المهام: ${worker.taskPoints}ن (عاجل: ${worker.taskHigh}، عادي: ${worker.taskNormal})${worker.deliveryPoints > 0 ? ` | التوصيل: ${worker.deliveryPoints}ن` : ''}`;
            } else {
                breakdownStr = `Perf: ${worker.avg}% | Att: ${worker.attendancePoints}p | Tasks: ${worker.taskPoints}p (Urgent: ${worker.taskHigh}, Normal: ${worker.taskNormal})${worker.deliveryPoints > 0 ? ` | Del: ${worker.deliveryPoints}p` : ''}`;
            }

            genListDiv.innerHTML += `
                <div class="flex-between" style="padding:10px 14px; background:var(--input-bg); border-radius:10px; border:1px solid var(--border-color); align-items:center;">
                    <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
                        <span style="font-weight:800; font-size:1.1rem; width:24px; text-align:center; color:var(--text-muted);">${medal}</span>
                        <div style="overflow:hidden;">
                            <strong style="color:var(--text-main); display:block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${worker.name}</strong>
                            <span style="font-size:0.7rem; color:var(--text-muted); display:block;">${breakdownStr}</span>
                        </div>
                    </div>
                    <div style="text-align:right; font-weight:800; color:var(--primary); font-size:1.05rem; white-space:nowrap; margin-left:10px;">
                        ${worker.score} pts
                    </div>
                </div>
            `;
        });
    }

    // 2. Calculate driver leaderboard (Strictly deliveries)
    const driversRanked = workers.filter(worker => {
        const isDriver = worker.role && (worker.role.toLowerCase().includes('driver') || worker.role.includes('سائق'));
        const stats = getMonthlyStats(worker, currentGlobalMonth);
        const deliveries = (stats.deliveriesList ? stats.deliveriesList.length : 0) + (stats.legacyDeliveries || 0);
        return isDriver || deliveries > 0;
    }).map(worker => {
        const stats = getMonthlyStats(worker, currentGlobalMonth);
        const deliveries = (stats.deliveriesList ? stats.deliveriesList.length : 0) + (stats.legacyDeliveries || 0);
        return {
            id: worker.id,
            name: worker.name,
            deliveries: deliveries
        };
    }).sort((a, b) => b.deliveries - a.deliveries);

    // Populate Driver Podium
    const pd1Name = document.getElementById('podium-drv-1-name');
    const pd1Score = document.getElementById('podium-drv-1-score');
    const pd2Name = document.getElementById('podium-drv-2-name');
    const pd2Score = document.getElementById('podium-drv-2-score');
    const pd3Name = document.getElementById('podium-drv-3-name');
    const pd3Score = document.getElementById('podium-drv-3-score');

    const labelDels = isAr ? 'توصيلة' : 'dels';

    if (driversRanked[0]) {
        if (pd1Name) pd1Name.textContent = driversRanked[0].name;
        if (pd1Score) pd1Score.textContent = `${driversRanked[0].deliveries} ${labelDels}`;
    } else {
        if (pd1Name) pd1Name.textContent = '—';
        if (pd1Score) pd1Score.textContent = '—';
    }
    if (driversRanked[1]) {
        if (pd2Name) pd2Name.textContent = driversRanked[1].name;
        if (pd2Score) pd2Score.textContent = `${driversRanked[1].deliveries} ${labelDels}`;
    } else {
        if (pd2Name) pd2Name.textContent = '—';
        if (pd2Score) pd2Score.textContent = '—';
    }
    if (driversRanked[2]) {
        if (pd3Name) pd3Name.textContent = driversRanked[2].name;
        if (pd3Score) pd3Score.textContent = `${driversRanked[2].deliveries} ${labelDels}`;
    } else {
        if (pd3Name) pd3Name.textContent = '—';
        if (pd3Score) pd3Score.textContent = '—';
    }

    // Populate Driver List
    const drvListDiv = document.getElementById('driver-leaderboard-list');
    if (drvListDiv) {
        drvListDiv.innerHTML = '';
        driversRanked.forEach((worker, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
            drvListDiv.innerHTML += `
                <div class="flex-between" style="padding:10px 14px; background:var(--input-bg); border-radius:10px; border:1px solid var(--border-color); align-items:center;">
                    <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
                        <span style="font-weight:800; font-size:1.1rem; width:24px; text-align:center; color:var(--text-muted);">${medal}</span>
                        <div style="overflow:hidden;">
                            <strong style="color:var(--text-main); display:block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${worker.name}</strong>
                        </div>
                    </div>
                    <div style="text-align:right; font-weight:800; color:var(--primary); font-size:1.05rem; white-space:nowrap; margin-left:10px;">
                        ${worker.deliveries} ${labelDels}
                    </div>
                </div>
            `;
        });
    }
}

// --- MOBILE USER DROPDOWN TRIGGER ---
window.toggleUserDropdown = function (event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('user-dropdown-menu');
    if (dropdown) {
        dropdown.classList.toggle('show-dropdown');
    }
};

document.addEventListener('click', function (e) {
    const container = document.querySelector('.user-menu-container');
    const dropdown = document.getElementById('user-dropdown-menu');
    if (container && dropdown && !container.contains(e.target)) {
        dropdown.classList.remove('show-dropdown');
    }
});

// --- WORKER PAYMENT REQUESTS ENGINE ---

// Helper: Get active worker record corresponding to logged-in user
function getActiveWorker() {
    if (!currentUser || !currentUser.email) return null;
    const workers = getCompanyData().workers || [];
    const activeW = workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
    if (activeW) {
        document.body.classList.add('has-worker-profile');
    } else {
        document.body.classList.remove('has-worker-profile');
    }
    return activeW;
}

// 1. Submit Payment Request (Worker)
function submitPaymentRequest() {
    const worker = getActiveWorker();
    if (!worker) {
        alert("Only registered workers can request payments.");
        return;
    }
    const isAr = currentAppLang === 'ar';
    const amountVal = parseFloat(document.getElementById('payment-req-amount').value);
    const reasonVal = document.getElementById('payment-req-reason').value.trim();

    if (isNaN(amountVal) || amountVal <= 0) {
        alert(isAr ? 'يرجى إدخال مبلغ صحيح أكبر من 0.' : 'Please enter a valid amount greater than 0.');
        return;
    }
    if (!reasonVal) {
        alert(isAr ? 'يرجى إدخال سبب الطلب.' : 'Please enter a reason for the request.');
        return;
    }

    // 1-Week (7 days) Cooldown Check between payment requests
    const allRequests = Object.values(getCompanyData().paymentRequests || {});
    const workerRequests = allRequests.filter(r => r.workerId === worker.id && r.timestamp);

    if (workerRequests.length > 0) {
        const lastTimestamp = Math.max(...workerRequests.map(r => r.timestamp || 0));
        const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 604,800,000 ms
        const timeElapsed = Date.now() - lastTimestamp;
        if (timeElapsed < ONE_WEEK_MS) {
            const remainingMs = ONE_WEEK_MS - timeElapsed;
            const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
            const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            const timeMsg = isAr ? `${remainingDays} يوم و ${remainingHours} ساعة` : `${remainingDays}d ${remainingHours}h`;
            alert(isAr
                ? `عذراً، يجب الانتظار لمدة أسبوع واحد (7 أيام) بين كل طلب دفع وآخر. الوقت المتبقي: ${timeMsg}.`
                : `Sorry, you must wait 1 week (7 days) between payment requests. Time remaining: ${timeMsg}.`);
            return;
        }
    }

    const reqId = 'req-' + Date.now();
    const requestObj = {
        id: reqId,
        workerId: worker.id,
        workerName: worker.name,
        amount: amountVal,
        requestedAmount: amountVal,
        reason: reasonVal,
        status: 'pending',
        timestamp: Date.now()
    };

    db.ref(`companies/${currentCompany}/paymentRequests/${reqId}`).set(requestObj)
        .then(() => {
            document.getElementById('payment-req-amount').value = '';
            document.getElementById('payment-req-reason').value = '';
            alert(isAr ? 'تم تقديم الطلب بنجاح وهو قيد المراجعة.' : 'Request submitted successfully and is pending review.');
        })
        .catch(err => {
            console.error("Error submitting payment request:", err);
            alert("Error: " + err.message);
        });
}

// 2. Accept Request (Finance / Admin Manager)
function acceptPaymentRequest(reqId) {
    const isAr = currentAppLang === 'ar';
    const pRequests = getCompanyData().paymentRequests || {};
    const req = pRequests[reqId];
    if (!req) return;

    // Get adjusted amount from input
    let approvedAmount = req.amount;
    const adjustInput = document.getElementById(`adjust-amount-${reqId}`);
    if (adjustInput) {
        const parsed = parseFloat(adjustInput.value);
        if (!isNaN(parsed) && parsed > 0) {
            approvedAmount = parsed;
        }
    }

    let note = '';
    const noteInput = document.getElementById(`admin-note-${reqId}`);
    if (noteInput && noteInput.value.trim() !== '') {
        note = noteInput.value.trim();
    }

    const threshold = parseFloat(getCompanyData().highMoneyThreshold) || 0;
    const isHighRequest = threshold > 0 && approvedAmount >= threshold;

    const updateData = {
        amount: approvedAmount,
        requestedAmount: req.requestedAmount !== undefined ? req.requestedAmount : req.amount,
        adminNote: note || (req.adminNote || null),
        handledAt: Date.now()
    };

    if (isHighRequest) {
        updateData.status = 'waiting_manager_approval';
        updateData.code = null;

        db.ref(`companies/${currentCompany}/paymentRequests/${reqId}`).update(updateData).then(() => {
            if (typeof logActivity === 'function') {
                logActivity('finance', req.workerId, req.workerName, `Financial department accepted high payment request of SAR ${approvedAmount} for ${req.workerName} (Awaiting Manager final approval)`);
            }
        }).catch(err => console.error("Error accepting request (high request):", err));
    } else {
        // Generate random 6 digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        updateData.status = 'accepted';
        updateData.code = code;

        db.ref(`companies/${currentCompany}/paymentRequests/${reqId}`).update(updateData).then(() => {
            if (typeof logActivity === 'function') {
                logActivity('finance', req.workerId, req.workerName, `Accepted payment request of SAR ${approvedAmount} for ${req.workerName}`);
            }
        }).catch(err => console.error("Error accepting request:", err));
    }
}

function undoAcceptPaymentRequest(reqId) {
    const pRequests = getCompanyData().paymentRequests || {};
    const req = pRequests[reqId];
    if (!req) return;

    const originalAmount = req.requestedAmount !== undefined ? req.requestedAmount : req.amount;

    db.ref(`companies/${currentCompany}/paymentRequests/${reqId}`).update({
        status: 'pending',
        amount: originalAmount,
        code: null,
        handledAt: null
    }).then(() => {
        if (typeof logActivity === 'function') {
            logActivity('finance_delete', req.workerId, req.workerName, `Undid acceptance of payment request of SAR ${req.amount} for ${req.workerName}`);
        }
    }).catch(err => console.error("Error undoing accepted request:", err));
}

// 3. Reject Request (Finance / Admin Manager)
function rejectPaymentRequest(reqId) {
    const isAr = currentAppLang === 'ar';
    const pRequests = getCompanyData().paymentRequests || {};
    const req = pRequests[reqId];
    if (!req) return;

    let note = '';
    const noteInput = document.getElementById(`admin-note-${reqId}`);
    if (noteInput && noteInput.value.trim() !== '') {
        note = noteInput.value.trim();
    } else {
        const prompted = prompt(isAr ? 'الرجاء كتابة سبب الرفض أو ملاحظة (اختياري):' : 'Enter rejection reason or note (optional):');
        if (prompted === null) return; // User canceled
        note = prompted.trim();
    }

    db.ref(`companies/${currentCompany}/paymentRequests/${reqId}`).update({
        status: 'rejected',
        adminNote: note || null,
        handledAt: Date.now()
    }).then(() => {
        if (typeof logActivity === 'function') {
            const detailMsg = note ? ` (Reason: ${note})` : '';
            logActivity('finance', req.workerId, req.workerName, `Rejected payment request of SAR ${req.amount} for ${req.workerName}${detailMsg}`);
        }
    }).catch(err => console.error("Error rejecting request:", err));
}

// 4. Confirm Payment Given (Sales / Salary Man)
function confirmPaymentGiven(reqId) {
    const pRequests = getCompanyData().paymentRequests || {};
    const req = pRequests[reqId];
    if (!req) return;

    // Verify verification code entered (or just standard confirmation)
    const enteredCode = document.getElementById(`verify-code-${reqId}`).value.trim();
    if (enteredCode !== req.code) {
        alert(currentAppLang === 'ar' ? 'الرمز المدخل غير صحيح!' : 'Incorrect verification code!');
        return;
    }

    // Find worker
    const workers = getCompanyData().workers || [];
    const workerIndex = workers.findIndex(w => w.id === req.workerId);
    if (workerIndex === -1) {
        alert("Worker not found in database.");
        return;
    }
    const worker = workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);

    // Save payment log in worker's monthlyStats
    if (!stats.paymentsList) stats.paymentsList = [];
    stats.paymentsList.unshift({
        id: Date.now().toString(),
        date: formatTimestamp(),
        amount: req.amount,
        reason: req.reason
    });

    // Write payment to worker stats, then change request status to 'given'
    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/paymentsList`).set(stats.paymentsList)
        .then(() => {
            return db.ref(`companies/${currentCompany}/paymentRequests/${reqId}`).update({
                status: 'given',
                givenAt: Date.now()
            });
        })
        .then(() => {
            if (typeof logActivity === 'function') {
                logActivity('finance', req.workerId, req.workerName, `Released payment request of SAR ${req.amount} to ${req.workerName}`);
            }
            alert(currentAppLang === 'ar' ? 'تم تسجيل الدفعة وتسليمها بنجاح!' : 'Payment logged and released successfully!');
        })
        .catch(err => {
            console.error("Error confirming payment release:", err);
            alert("Error: " + err.message);
        });
}

// 5. Render Worker requests lists
function renderPaymentRequests() {
    const isAr = currentAppLang === 'ar';
    const isFinAdmin = currentUser && (currentUser.role === 'admin' || document.body.classList.contains('perm-finance'));
    const companyData = getCompanyData();
    const pRequests = companyData.paymentRequests || {};
    const reqList = Object.values(pRequests).sort((a, b) => b.timestamp - a.timestamp);

    const pendingPayCount = reqList.filter(r => r.status === 'pending' || r.status === 'waiting_manager_approval').length;
    const payBadge = document.getElementById('pending-pay-count-badge');
    if (payBadge) payBadge.textContent = `${pendingPayCount} ${isAr ? 'قيد الانتظار' : 'Pending'}`;

    const thresholdInput = document.getElementById('high-money-threshold-input');
    if (thresholdInput) {
        const threshold = companyData.highMoneyThreshold;
        // Pre-fill input value from DB
        if (document.activeElement !== thresholdInput) {
            thresholdInput.value = threshold !== undefined ? threshold : '';
        }
    }

    renderHighMoneyApprovals();

    // Render for Worker (Self Request History)
    const worker = getActiveWorker();
    const workerRequestsDiv = document.getElementById('worker-requests-list');
    if (worker && workerRequestsDiv) {
        workerRequestsDiv.innerHTML = '';
        const myReqs = reqList.filter(r => r.workerId === worker.id);
        if (myReqs.length === 0) {
            workerRequestsDiv.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">${isAr ? 'لا يوجد طلبات سابقة.' : 'No previous requests.'}</p>`;
        } else {
            myReqs.forEach(req => {
                const dateStr = new Date(req.timestamp).toLocaleString();
                let statusBadge = '';
                let codeDisplay = '';

                let editBtn = '';
                if (req.status === 'pending') {
                    statusBadge = `<span class="badge" style="background:#d97706;">${isAr ? 'قيد الانتظار' : 'Pending'}</span>`;
                    editBtn = `<button onclick="editPaymentRequestAmount('${req.id}')" class="btn-outline" style="padding: 2px 8px; font-size: 0.75rem; font-weight: 600; margin-left: 6px; cursor:pointer;" title="${isAr ? 'تعديل المبلغ' : 'Edit Amount'}">✏️ ${isAr ? 'تعديل' : 'Edit'}</button>`;
                } else if (req.status === 'waiting_manager_approval') {
                    statusBadge = `<span class="badge" style="background:#f59e0b;">${isAr ? 'موافق مالياً (بانتظار موافقة المدير)' : 'Financial Approved (Waiting for Manager Approval)'}</span>`;
                } else if (req.status === 'accepted') {
                    statusBadge = `<span class="badge" style="background:#16a34a;">${isAr ? 'مقبول للتسليم' : 'Approved for Disbursal'}</span>`;
                    codeDisplay = `<div style="margin-top: 5px; font-weight: 800; font-size: 1rem; color: var(--success);">${isAr ? 'الرمز السري:' : 'Verification Code:'} <span style="background:var(--input-bg); padding: 2px 6px; border-radius: 4px; border: 1px dashed var(--success);">${req.code}</span></div>`;
                } else if (req.status === 'rejected') {
                    statusBadge = `<span class="badge" style="background:#dc2626;">${isAr ? 'مرفوض' : 'Rejected'}</span>`;
                } else if (req.status === 'given') {
                    statusBadge = `<span class="badge" style="background:#2563eb;">${isAr ? 'تم الاستلام' : 'Given'}</span>`;
                }

                let adminNoteDisplay = '';
                if (req.adminNote) {
                    if (req.status === 'rejected') {
                        adminNoteDisplay = `
                            <div style="font-size: 0.85rem; margin-top: 8px; padding: 8px 12px; background: rgba(220, 38, 38, 0.08); border-left: 4px solid var(--danger); border-radius: 6px; color: var(--danger); font-weight: 600;">
                                💬 ${isAr ? 'سبب الرفض / ملاحظة الإدارة:' : 'Rejection Reason / Admin Note:'} <span style="font-weight: 500; color: var(--text-main);">${req.adminNote}</span>
                            </div>`;
                    } else {
                        adminNoteDisplay = `
                            <div style="font-size: 0.85rem; margin-top: 8px; padding: 8px 12px; background: rgba(197, 131, 43, 0.08); border-left: 4px solid var(--secondary); border-radius: 6px; color: var(--text-main); font-weight: 500;">
                                💬 ${isAr ? 'ملاحظة الإدارة:' : 'Admin Note:'} <span>${req.adminNote}</span>
                            </div>`;
                    }
                }

                workerRequestsDiv.innerHTML += `
                    <div class="ledger-card" style="border-left: 4px solid var(--primary);">
                        <div class="flex-between">
                            <div>
                                <strong>SAR ${req.amount}</strong>
                                ${editBtn}
                            </div>
                            ${statusBadge}
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">🕒 ${dateStr}</div>
                        <div style="font-size: 0.85rem; margin-top: 6px; color: var(--text-main);">${isAr ? 'السبب:' : 'Reason:'} <em>${req.reason}</em></div>
                        ${adminNoteDisplay}
                        ${codeDisplay}
                    </div>
                `;
            });
        }
    }

    // Render for Finance Dept Manager (All Requests Log / Dashboard)
    const pendingListDiv = document.getElementById('pending-requests-list');
    if (pendingListDiv) {
        pendingListDiv.innerHTML = '';
        const managerReqs = reqList.filter(r => r.status === 'pending' || r.status === 'waiting_manager_approval' || r.status === 'accepted' || r.status === 'given' || r.status === 'rejected');
        if (managerReqs.length === 0) {
            pendingListDiv.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">${isAr ? 'لا توجد طلبات حالياً.' : 'No requests at the moment.'}</p>`;
        } else {
            managerReqs.forEach(req => {
                const dateStr = new Date(req.timestamp).toLocaleString();
                let cardStyle = '';
                let statusHeader = '';
                let actionArea = '';

                if (req.status === 'pending') {
                    cardStyle = 'border-left: 4px solid var(--warning);';
                    statusHeader = `<span class="badge" style="background:#d97706; font-size:0.75rem; font-weight:700; padding:4px 8px; border-radius:4px; color:white;">${isAr ? 'قيد الانتظار' : 'Pending'}</span>`;
                    actionArea = `
                        <div style="display:flex; flex-direction:column; gap:8px; margin-top: 12px;">
                            <div style="display:flex; gap:8px; justify-content: flex-end; align-items:center; flex-wrap:wrap;">
                                <label style="margin: 0; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">${isAr ? 'تعديل المبلغ (ريال):' : 'Adjust Amount (SAR):'}</label>
                                <input type="number" step="any" id="adjust-amount-${req.id}" value="${req.amount}" min="0.01" 
                                    style="max-width: 90px; padding: 6px 10px; font-size: 0.85rem; height: 34px;">
                            </div>
                            <div style="display:flex; gap:8px; justify-content: flex-end; align-items:center; flex-wrap:wrap;">
                                <input type="text" id="admin-note-${req.id}" placeholder="${isAr ? 'سبب الرفض / ملاحظة (اختياري)...' : 'Rejection reason / Note (optional)...'}" 
                                    style="flex: 1; min-width: 180px; padding: 6px 10px; font-size: 0.85rem; height: 34px;">
                                <button onclick="rejectPaymentRequest('${req.id}')" class="btn-outline-danger" style="padding: 6px 14px; font-size: 0.8rem; height: 34px; font-weight:700;">${isAr ? 'رفض' : 'Reject'}</button>
                                <button onclick="acceptPaymentRequest('${req.id}')" class="btn-success" style="padding: 6px 14px; font-size: 0.8rem; height: 34px; font-weight:700;">${isAr ? 'قبول واعتماد' : 'Accept & Approve'}</button>
                            </div>
                        </div>
                    `;
                } else if (req.status === 'waiting_manager_approval') {
                    cardStyle = 'border-left: 4px solid var(--secondary);';
                    statusHeader = `<span class="badge" style="background:#f59e0b; font-size:0.75rem; font-weight:700; padding:4px 8px; border-radius:4px; color:white;">${isAr ? 'موافق مالياً (بانتظار موافقة المدير)' : 'Financial Approved (Awaiting Manager Approval)'}</span>`;
                    actionArea = `
                        <div style="display:flex; gap:8px; margin-top: 12px; justify-content: flex-end; align-items:center;">
                            <button onclick="undoAcceptPaymentRequest('${req.id}')" class="btn-outline-danger" style="padding: 6px 14px; font-size: 0.8rem; height: 34px; font-weight:700;">
                                ${isAr ? 'تراجع عن القبول' : 'Undo Accept'}
                            </button>
                        </div>
                    `;
                } else if (req.status === 'accepted') {
                    cardStyle = 'border-left: 4px solid var(--success);';
                    statusHeader = `
                        <div style="display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
                            <span class="badge" style="background:#16a34a; font-size:0.75rem; font-weight:700; padding:4px 8px; border-radius:4px; color:white;">
                                ${isAr ? 'مقبول (بانتظار التسليم)' : 'Approved (Pending Disbursal)'}
                            </span>
                            <div style="font-size:0.8rem; color:var(--text-muted); font-weight:600; margin-top:4px;">
                                ${isAr ? 'الرمز السري:' : 'Code:'} <span style="background:var(--input-bg); padding:2px 6px; border-radius:4px; border:1px dashed var(--success); font-weight:800; color:var(--success);">${req.code}</span>
                            </div>
                        </div>
                    `;
                    actionArea = `
                        <div style="display:flex; gap:8px; margin-top: 12px; justify-content: flex-end; align-items:center;">
                            <button onclick="undoAcceptPaymentRequest('${req.id}')" class="btn-outline-danger" style="padding: 6px 14px; font-size: 0.8rem; height: 34px; font-weight:700;">
                                ${isAr ? 'تراجع عن القبول' : 'Undo Accept'}
                            </button>
                        </div>
                    `;
                } else if (req.status === 'rejected') {
                    cardStyle = 'border-left: 4px solid #ef4444; opacity: 0.85;';
                    statusHeader = `<span class="badge" style="background:#dc2626; font-size:0.75rem; font-weight:700; padding:4px 8px; border-radius:4px; color:white;">${isAr ? 'مرفوض' : 'Rejected'}</span>`;
                    actionArea = '';
                } else if (req.status === 'given') {
                    cardStyle = 'border-left: 4px solid var(--primary);';
                    statusHeader = `<span class="badge" style="background:#2563eb; font-size:0.75rem; font-weight:700; padding:4px 8px; border-radius:4px; color:white;">${isAr ? 'تم الاستلام ✅' : 'Given / Disbursed ✅'}</span>`;
                    actionArea = '';
                }

                let adminNoteText = '';
                if (req.adminNote) {
                    const noteColor = req.status === 'rejected' ? 'var(--danger)' : 'var(--secondary)';
                    adminNoteText = `<div style="font-size: 0.85rem; margin-top: 6px; color: ${noteColor}; font-weight: 600;">💬 ${isAr ? 'ملاحظة الإدارة / سبب الرفض:' : 'Admin Note / Rejection Reason:'} <span style="font-weight:400; color:var(--text-main);">${req.adminNote}</span></div>`;
                }

                pendingListDiv.innerHTML += `
                    <div class="ledger-card" style="${cardStyle}">
                        <div class="flex-between">
                            <div>
                                <strong style="font-size:1.05rem;">${req.workerName}</strong>
                                <button type="button" class="btn-outline" onclick="showWorkerPaymentHistory('${req.workerEmail || req.workerName}')" style="padding: 2px 8px; font-size: 0.75rem; border-radius: 12px; margin-left: 6px; font-weight: 600;">
                                    📜 ${isAr ? 'سجل الدفعات' : 'Payment Log'}
                                </button>
                                <span style="font-size:0.75rem; color:var(--text-muted); margin-left: 8px;">🕒 ${dateStr}</span>
                            </div>
                            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
                                <strong class="text-primary" style="font-size:1.1rem;">SAR ${req.amount}</strong>
                                ${statusHeader}
                            </div>
                        </div>
                        <div style="font-size: 0.85rem; margin-top: 8px; color:var(--text-main);">${isAr ? 'السبب:' : 'Reason:'} <em>${req.reason}</em></div>
                        ${adminNoteText}
                        ${actionArea}
                    </div>
                `;
            });
        }
    }

    // Render for Sales Dept Worker (Accepted Payment Releases List)
    const acceptedListDiv = document.getElementById('accepted-payments-list');
    if (acceptedListDiv) {
        acceptedListDiv.innerHTML = '';
        const acceptedReqs = reqList.filter(r => r.status === 'accepted');
        if (acceptedReqs.length === 0) {
            acceptedListDiv.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">${isAr ? 'لا توجد دفعات معتمدة بانتظار التسليم.' : 'No approved payments waiting for release.'}</p>`;
        } else {
            acceptedReqs.forEach(req => {
                acceptedListDiv.innerHTML += `
                    <div class="ledger-card" style="border-left: 4px solid var(--success);">
                        <div class="flex-between" style="align-items: flex-start; flex-wrap:wrap;">
                            <div>
                                <strong style="font-size:1.05rem; display:block;">${req.workerName}</strong>
                                <span style="font-size:0.85rem; color:var(--text-muted);">${isAr ? 'السبب:' : 'Reason:'} <em>${req.reason}</em></span>
                                <div style="margin-top: 4px; font-size:0.8rem; color:var(--text-muted);">${isAr ? 'الرمز:' : 'Code:'} <span style="font-weight:700; color:var(--success);">${req.code}</span></div>
                            </div>
                            <div style="text-align: right;">
                                <strong class="text-success" style="font-size:1.15rem; display:block;">SAR ${req.amount}</strong>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 14px; align-items: center; flex-wrap: wrap;">
                            <input type="text" id="verify-code-${req.id}" placeholder="${isAr ? 'أدخل الرمز للتأكيد...' : 'Enter verification code...'}" 
                                style="max-width: 200px; padding: 8px 12px; font-size: 0.85rem;">
                            <button onclick="confirmPaymentGiven('${req.id}')" class="btn-success" style="padding: 8px 16px; font-size: 0.85rem; font-weight:700;">
                                ${isAr ? 'تم تسليم المبلغ بنجاح ✅' : 'Payment Given Successfully ✅'}
                            </button>
                        </div>
                    </div>
                `;
            });
        }
    }

    renderDailyPayouts();
}

function renderDailyPayouts() {
    const isAr = currentAppLang === 'ar';
    const isFinAdmin = currentUser && (currentUser.role === 'admin' || document.body.classList.contains('perm-finance'));
    const companyData = getCompanyData();
    const workers = companyData.workers || [];
    let allPayouts = [];

    // Gather manual and request-based payouts from monthlyStats paymentsList of all workers
    workers.forEach(w => {
        const stats = getMonthlyStats(w, currentGlobalMonth);
        const list = stats.paymentsList || [];
        list.forEach(p => {
            allPayouts.push({
                id: p.id,
                workerName: w.name,
                workerId: w.id,
                amount: p.amount,
                reason: p.reason || (isAr ? 'دفعة مقدمة / سلفة' : 'Advance Payment / Payout'),
                date: p.date, // formatTimestamp() format: YYYY-MM-DD HH:MM:SS
                timestamp: parseInt(p.id) || Date.now()
            });
        });
    });

    // Sort descending by timestamp
    allPayouts.sort((a, b) => b.timestamp - a.timestamp);

    const logListDiv = document.getElementById('daily-payouts-log-list');
    if (logListDiv) {
        logListDiv.innerHTML = '';
        if (allPayouts.length === 0) {
            logListDiv.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:15px 0;">${isAr ? 'لا توجد سلف مصروفة هذا الشهر.' : 'No payouts logged this month.'}</p>`;
        } else {
            allPayouts.forEach(p => {
                const delBtn = isFinAdmin ? `<button onclick="deletePaymentRecord('${p.workerId}', '${p.id}')" class="btn-outline-danger" style="padding: 2px 6px; font-size: 0.7rem; line-height: 1; border: none; border-radius: 4px; margin-left: 8px; cursor:pointer;" title="${isAr ? 'حذف السجل' : 'Delete Log'}">🗑️</button>` : '';

                logListDiv.innerHTML += `
                    <div class="ledger-card" style="border-left: 4px solid var(--info); padding: 10px 14px; margin-bottom: 0; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                        <div>
                            <strong style="font-size: 0.95rem; color: var(--text-main); display: block;">${p.workerName}</strong>
                            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 2px;">📝 ${p.reason}</span>
                            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 2px;">🕒 ${p.date}</span>
                        </div>
                        <div style="text-align: right; display: flex; align-items: center; gap: 6px;">
                            <strong style="color: var(--info); font-size: 1.05rem;">SAR ${p.amount}</strong>
                            ${delBtn}
                        </div>
                    </div>
                `;
            });
        }
    }
}

function saveHighMoneyThreshold() {
    const isAr = currentAppLang === 'ar';
    const inputVal = parseFloat(document.getElementById('high-money-threshold-input').value);
    if (isNaN(inputVal) || inputVal < 0) {
        alert(isAr ? 'الرجاء إدخال مبلغ صحيح.' : 'Please enter a valid amount.');
        return;
    }
    db.ref(`companies/${currentCompany}/highMoneyThreshold`).set(inputVal)
        .then(() => {
            alert(isAr ? 'تم حفظ الحد المالي بنجاح!' : 'High money threshold saved successfully!');
        })
        .catch(err => {
            console.error("Error saving high money threshold:", err);
            alert("Error: " + err.message);
        });
}

function toggleOpsMoneyCustomRange() {
    const tf = document.getElementById('ops-money-timeframe-filter') ? document.getElementById('ops-money-timeframe-filter').value : 'all';
    const rangeDiv = document.getElementById('ops-money-custom-range');
    if (rangeDiv) {
        rangeDiv.style.display = tf === 'custom' ? 'flex' : 'none';
    }
}
window.toggleOpsMoneyCustomRange = toggleOpsMoneyCustomRange;

function renderHighMoneyApprovals() {
    const isAr = currentAppLang === 'ar';
    const companyData = getCompanyData();
    const pRequests = companyData.paymentRequests || {};
    let reqList = Object.values(pRequests).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const approvalsListDiv = document.getElementById('high-money-approvals-list');

    if (!approvalsListDiv) return;
    approvalsListDiv.innerHTML = '';

    // Populate Worker Filter Dropdown
    const workerFilterSel = document.getElementById('ops-money-worker-filter');
    if (workerFilterSel) {
        const oldWorkerVal = workerFilterSel.value;
        const visibleWorkers = getVisibleWorkers();
        workerFilterSel.innerHTML = `<option value="all">${isAr ? '👤 جميع الموظفين' : '👤 All Workers'}</option>`;
        visibleWorkers.forEach(w => {
            const opt = document.createElement('option');
            opt.value = w.id;
            opt.textContent = w.name;
            workerFilterSel.appendChild(opt);
        });
        if (oldWorkerVal && Array.from(workerFilterSel.options).some(o => o.value === oldWorkerVal)) {
            workerFilterSel.value = oldWorkerVal;
        }
    }

    const statusFilter = document.getElementById('ops-money-status-filter') ? document.getElementById('ops-money-status-filter').value : 'waiting_manager_approval';
    const timeframeFilter = document.getElementById('ops-money-timeframe-filter') ? document.getElementById('ops-money-timeframe-filter').value : 'all';
    const selectedWorkerId = document.getElementById('ops-money-worker-filter') ? document.getElementById('ops-money-worker-filter').value : 'all';

    // 1. Filter by Status
    if (statusFilter !== 'all') {
        reqList = reqList.filter(r => r.status === statusFilter);
    }

    // 2. Filter by Worker
    if (selectedWorkerId !== 'all') {
        reqList = reqList.filter(r => r.workerId === selectedWorkerId);
    }

    // 3. Filter by Timeframe / Date
    const now = Date.now();
    if (timeframeFilter === 'today') {
        const startOfToday = new Date().setHours(0, 0, 0, 0);
        reqList = reqList.filter(r => (r.timestamp || 0) >= startOfToday);
    } else if (timeframeFilter === 'week') {
        const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
        reqList = reqList.filter(r => (r.timestamp || 0) >= weekAgo);
    } else if (timeframeFilter === 'month') {
        const monthAgo = now - (30 * 24 * 60 * 60 * 1000);
        reqList = reqList.filter(r => (r.timestamp || 0) >= monthAgo);
    } else if (timeframeFilter === 'custom') {
        const fromInput = document.getElementById('ops-money-from-date') ? document.getElementById('ops-money-from-date').value : '';
        const toInput = document.getElementById('ops-money-to-date') ? document.getElementById('ops-money-to-date').value : '';
        if (fromInput) {
            const fromMs = new Date(fromInput).setHours(0, 0, 0, 0);
            reqList = reqList.filter(r => (r.timestamp || 0) >= fromMs);
        }
        if (toInput) {
            const toMs = new Date(toInput).setHours(23, 59, 59, 999);
            reqList = reqList.filter(r => (r.timestamp || 0) <= toMs);
        }
    }

    if (reqList.length === 0) {
        approvalsListDiv.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding: 20px;">${isAr ? 'لا توجد طلبات سلف تطابق التصفية المختارة.' : 'No payment requests match the selected filters.'}</p>`;
        return;
    }

    reqList.forEach(req => {
        const dateStr = req.timestamp ? new Date(req.timestamp).toLocaleString() : (req.date || '');
        let adminNoteText = '';
        if (req.adminNote) {
            const noteColor = req.status === 'rejected' ? 'var(--danger)' : 'var(--secondary)';
            adminNoteText = `<div style="font-size: 0.85rem; margin-top: 6px; color: ${noteColor}; font-weight: 600;">💬 ${isAr ? 'ملاحظة الإدارة / سبب الرفض:' : 'Admin Note / Rejection Reason:'} <span style="font-weight:400; color:var(--text-main);">${req.adminNote}</span></div>`;
        }

        let statusBadge = '';
        let controlsArea = '';
        let borderCol = 'var(--info)';

        if (req.status === 'pending') {
            borderCol = 'var(--warning)';
            statusBadge = `<span class="badge" style="background:#d97706; color:#fff; font-weight:700;">🕒 ${isAr ? 'بانتظار موافقة المالية' : 'Pending Finance Approval'}</span>`;
            controlsArea = `
                <div style="display:flex; flex-direction:column; gap:8px; margin-top: 14px;">
                    <div style="display:flex; gap:8px; justify-content: flex-end; align-items:center; flex-wrap:wrap;">
                        <label style="margin: 0; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">${isAr ? 'تعديل المبلغ (ريال):' : 'Adjust Amount (SAR):'}</label>
                        <input type="number" step="any" id="adjust-amount-${req.id}" value="${req.amount}" min="0.01" 
                            style="max-width: 90px; padding: 6px 10px; font-size: 0.85rem; height: 34px;">
                    </div>
                    <div style="display:flex; gap:8px; justify-content: flex-end; align-items:center; flex-wrap:wrap;">
                        <input type="text" id="admin-note-${req.id}" placeholder="${isAr ? 'سبب الرفض / ملاحظة (اختياري)...' : 'Rejection reason / Note (optional)...'}" 
                            style="flex: 1; min-width: 180px; padding: 6px 10px; font-size: 0.85rem; height: 34px;">
                        <button onclick="rejectPaymentRequest('${req.id}')" class="btn-outline-danger" style="padding: 6px 14px; font-size: 0.8rem; height: 34px; font-weight:700;">${isAr ? 'رفض' : 'Reject'}</button>
                        <button onclick="acceptPaymentRequest('${req.id}')" class="btn-success" style="padding: 6px 14px; font-size: 0.8rem; height: 34px; font-weight:700;">${isAr ? 'قبول واعتماد' : 'Accept & Approve'}</button>
                    </div>
                </div>
            `;
        } else if (req.status === 'waiting_manager_approval') {
            borderCol = 'var(--warning)';
            statusBadge = `<span class="badge" style="background:#f59e0b; color:#fff; font-weight:700;">⏳ ${isAr ? 'بانتظار موافقة المدير' : 'Awaiting Manager Approval'}</span>`;
            controlsArea = `
                <div style="display:flex; flex-direction:column; gap:8px; margin-top: 14px;">
                    <div style="display:flex; gap:8px; justify-content: flex-end; align-items:center; flex-wrap:wrap;">
                        <label style="margin: 0; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">${isAr ? 'تعديل المبلغ (ريال):' : 'Adjust Amount (SAR):'}</label>
                        <input type="number" step="any" id="manager-adjust-amount-${req.id}" value="${req.amount}" min="0.01" 
                            style="max-width: 90px; padding: 6px 10px; font-size: 0.85rem; height: 34px;">
                    </div>
                    <div style="display:flex; gap:8px; justify-content: flex-end; align-items:center; flex-wrap:wrap;">
                        <input type="text" id="manager-note-${req.id}" placeholder="${isAr ? 'ملاحظة المدير / سبب الرفض (اختياري)...' : 'Manager note / Rejection reason (optional)...'}" 
                            style="flex: 1; min-width: 180px; padding: 6px 10px; font-size: 0.85rem; height: 34px;">
                        <button onclick="managerRejectPaymentRequest('${req.id}')" class="btn-outline-danger" style="padding: 6px 14px; font-size: 0.8rem; height: 34px; font-weight:700;">${isAr ? 'رفض' : 'Reject'}</button>
                        <button onclick="managerAcceptPaymentRequest('${req.id}')" class="btn-success" style="padding: 6px 14px; font-size: 0.8rem; height: 34px; font-weight:700;">${isAr ? 'قبول واعتماد نهائي' : 'Approve & Release Code'}</button>
                    </div>
                </div>
            `;
        } else if (req.status === 'accepted') {
            borderCol = 'var(--success)';
            statusBadge = `
                <div style="display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
                    <span class="badge" style="background:#16a34a; font-size:0.75rem; font-weight:700; padding:4px 8px; border-radius:4px; color:white;">
                        ${isAr ? 'مقبول (كود التسليم: ' + (req.code || '') + ')' : 'Accepted (Code: ' + (req.code || '') + ')'}
                    </span>
                </div>
            `;
            controlsArea = `
                <div style="display:flex; flex-direction:column; gap:8px; margin-top: 14px;">
                    <div style="display:flex; gap:8px; justify-content: flex-end; align-items:center; flex-wrap:wrap;">
                        <input type="text" id="verify-code-${req.id}" placeholder="${isAr ? 'إدخال رمز التحقق لتأكيد التسليم...' : 'Enter verification code to confirm disbursal...'}" 
                            style="max-width: 220px; padding: 6px 10px; font-size: 0.85rem; height: 34px;">
                        <button onclick="confirmPaymentGiven('${req.id}')" class="btn-success" style="padding: 6px 14px; font-size: 0.8rem; height: 34px; font-weight:700;">${isAr ? 'تأكيد التسليم' : 'Confirm Disbursal'}</button>
                        <button onclick="undoAcceptPaymentRequest('${req.id}')" class="btn-outline-danger" style="padding: 6px 14px; font-size: 0.8rem; height: 34px; font-weight:700;">${isAr ? 'تراجع' : 'Undo Accept'}</button>
                    </div>
                </div>
            `;
        } else if (req.status === 'given') {
            borderCol = '#0284c7';
            statusBadge = `<span class="badge" style="background:#0284c7; color:#fff; font-weight:700;">💸 ${isAr ? 'تم التسليم والمصادقة' : 'Get Paid / Disbursed'}</span>`;
        } else if (req.status === 'rejected') {
            borderCol = 'var(--danger)';
            statusBadge = `<span class="badge" style="background:#dc2626; color:#fff; font-weight:700;">❌ ${isAr ? 'مرفوض' : 'Rejected'}</span>`;
        }

        approvalsListDiv.innerHTML += `
            <div class="ledger-card" style="border-left: 4px solid ${borderCol}; padding: 14px;">
                <div class="flex-between" style="align-items: flex-start; flex-wrap: wrap; gap: 8px;">
                    <div>
                        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                            <strong style="font-size:1.05rem;">${req.workerName}</strong>
                            <button type="button" class="btn-outline" onclick="showWorkerPaymentHistory('${req.workerEmail || req.workerName}')" style="padding: 2px 8px; font-size: 0.75rem; border-radius: 12px; font-weight: 600;">
                                📜 ${isAr ? 'سجل الدفعات' : 'Payment Log'}
                            </button>
                        </div>
                        <span style="font-size:0.75rem; color:var(--text-muted); display:block; margin-top:2px;">🕒 ${isAr ? 'تاريخ الطلب:' : 'Requested:'} ${dateStr}</span>
                        <div style="font-size: 0.85rem; margin-top: 8px; color:var(--text-main);">${isAr ? 'السبب:' : 'Reason:'} <em>${req.reason}</em></div>
                        ${adminNoteText}
                    </div>
                    <div style="text-align: right;">
                        <div style="margin-bottom: 4px;">${statusBadge}</div>
                        <strong class="text-primary" style="font-size:1.15rem;">SAR ${req.amount}</strong>
                    </div>
                </div>
                ${controlsArea}
            </div>
        `;
    });
}

function managerAcceptPaymentRequest(reqId) {
    const isAr = currentAppLang === 'ar';
    const pRequests = getCompanyData().paymentRequests || {};
    const req = pRequests[reqId];
    if (!req) return;

    let approvedAmount = req.amount;
    const adjustInput = document.getElementById(`manager-adjust-amount-${reqId}`);
    if (adjustInput) {
        const parsed = parseFloat(adjustInput.value);
        if (!isNaN(parsed) && parsed > 0) {
            approvedAmount = parsed;
        }
    }

    let note = '';
    const noteInput = document.getElementById(`manager-note-${reqId}`);
    if (noteInput && noteInput.value.trim() !== '') {
        note = noteInput.value.trim();
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    db.ref(`companies/${currentCompany}/paymentRequests/${reqId}`).update({
        status: 'accepted',
        amount: approvedAmount,
        code: code,
        adminNote: note || (req.adminNote || null),
        managerApprovedAt: Date.now()
    }).then(() => {
        if (typeof logActivity === 'function') {
            logActivity('finance', req.workerId, req.workerName, `Manager final approved high payment request of SAR ${approvedAmount} for ${req.workerName}`);
        }
    }).catch(err => console.error("Error final approving request:", err));
}

function managerRejectPaymentRequest(reqId) {
    const isAr = currentAppLang === 'ar';
    const pRequests = getCompanyData().paymentRequests || {};
    const req = pRequests[reqId];
    if (!req) return;

    let note = '';
    const noteInput = document.getElementById(`manager-note-${reqId}`);
    if (noteInput && noteInput.value.trim() !== '') {
        note = noteInput.value.trim();
    } else {
        const prompted = prompt(isAr ? 'الرجاء كتابة سبب الرفض أو ملاحظة (اختياري):' : 'Enter rejection reason or note (optional):');
        if (prompted === null) return; // User canceled
        note = prompted.trim();
    }

    db.ref(`companies/${currentCompany}/paymentRequests/${reqId}`).update({
        status: 'rejected',
        adminNote: note || (req.adminNote || null),
        managerHandledAt: Date.now()
    }).then(() => {
        if (typeof logActivity === 'function') {
            const detailMsg = note ? ` (Reason: ${note})` : '';
            logActivity('finance', req.workerId, req.workerName, `Manager rejected high payment request of SAR ${req.amount} for ${req.workerName}${detailMsg}`);
        }
    }).catch(err => console.error("Error final rejecting request:", err));
}

// Bind to window
window.submitPaymentRequest = submitPaymentRequest;
window.acceptPaymentRequest = acceptPaymentRequest;
window.rejectPaymentRequest = rejectPaymentRequest;
window.undoAcceptPaymentRequest = undoAcceptPaymentRequest;
window.confirmPaymentGiven = confirmPaymentGiven;
window.renderPaymentRequests = renderPaymentRequests;
window.renderDailyPayouts = renderDailyPayouts;
window.saveHighMoneyThreshold = saveHighMoneyThreshold;
window.renderHighMoneyApprovals = renderHighMoneyApprovals;
window.managerAcceptPaymentRequest = managerAcceptPaymentRequest;
window.managerRejectPaymentRequest = managerRejectPaymentRequest;

// --- ATTENDANCE SYSTEM ---

function saveLateSettings() {
    const grace = parseInt(document.getElementById('late-grace-input').value) || 0;
    const penalty = parseFloat(document.getElementById('late-penalty-input').value) || 0;

    db.ref(`companies/${currentCompany}/lateGraceMinutes`).set(grace);
    db.ref(`companies/${currentCompany}/latePenaltySAR`).set(penalty)
        .then(() => {
            alert(currentAppLang === 'ar' ? 'تم حفظ إعدادات التأخير بنجاح!' : 'Late settings saved successfully!');
            renderAll();
        })
        .catch(err => console.error("Error saving late settings:", err));
}

function getLateDeductionsForMonth(worker, monthStr) {
    const companyData = getCompanyData();
    const attendance = companyData.attendance || {};
    const rules = companyData.lateRules || [];
    const graceMins = parseInt(companyData.lateGraceMinutes || 0);
    const legacyPenalty = parseFloat(companyData.latePenaltySAR || 0);

    let totalDeduction = 0;
    Object.keys(attendance).forEach(dateStr => {
        if (dateStr.startsWith(monthStr)) {
            const dayMap = attendance[dateStr] || {};
            const att = dayMap[worker.id];
            if (att && att.status === 'present') {
                let diff = 0;
                let shiftStart = worker.startTime || '09:00';
                const dateParts = dateStr.split('-');
                const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const dayOfWeekName = dayNames[dateObj.getDay()];
                const dateOverrideShift = (worker.shifts || []).find(s => s.dayOfWeek === dayOfWeekName || s.specificDate === dateStr);
                if (dateOverrideShift) {
                    shiftStart = dateOverrideShift.startTime;
                }
                if (att.time && shiftStart) {
                    const [sH, sM] = shiftStart.split(':').map(Number);
                    const [cH, cM] = att.time.split(':').map(Number);
                    if (!isNaN(sH) && !isNaN(cH)) {
                        const startMins = sH * 60 + (sM || 0);
                        const checkMins = cH * 60 + (cM || 0);
                        diff = checkMins - startMins;
                    }
                } else if (att.lateness) {
                    const matchedMins = String(att.lateness).match(/\d+/);
                    if (matchedMins) diff = parseInt(matchedMins[0]);
                }

                if (diff > 0) {
                    if (rules.length === 0) {
                        if (diff > graceMins && legacyPenalty > 0) {
                            totalDeduction += legacyPenalty;
                        }
                    } else {
                        const sortedRules = [...rules].sort((a, b) => b.mins - a.mins);
                        const matchedRule = sortedRules.find(r => diff >= r.mins);
                        if (matchedRule) {
                            totalDeduction += parseFloat(matchedRule.penalty || 0);
                        }
                    }
                }
            }
        }
    });
    return totalDeduction;
}

function getDriverVolumeRewardsForMonth(worker, monthStr) {
    const companyData = getCompanyData();
    const rules = companyData.driverVolumeRewards || [];
    if (rules.length === 0) return 0;

    const stats = worker.monthlyStats && worker.monthlyStats[monthStr];
    if (!stats || !stats.deliveriesList || stats.deliveriesList.length === 0) return 0;

    // Group deliveries by local date string
    const dailyCounts = {};
    stats.deliveriesList.forEach(del => {
        if (del.endTime) {
            const dateObj = new Date(del.endTime);
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const dateKey = `${yyyy}-${mm}-${dd}`;
            if (dateKey.startsWith(monthStr)) {
                dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
            }
        }
    });

    // Sort rules by ordersCount descending to find the highest milestone hit
    const sortedRules = [...rules].sort((a, b) => b.ordersCount - a.ordersCount);

    let totalReward = 0;
    Object.keys(dailyCounts).forEach(dateKey => {
        const count = dailyCounts[dateKey];
        const match = sortedRules.find(r => count >= r.ordersCount);
        if (match) {
            totalReward += parseFloat(match.rewardAmount || 0);
        }
    });

    return totalReward;
}

function calculateLateness(startTimeStr, checkTimeStr) {
    if (!startTimeStr || !checkTimeStr) return null;
    const [sH, sM] = startTimeStr.split(':').map(Number);
    const [cH, cM] = checkTimeStr.split(':').map(Number);
    if (isNaN(sH) || isNaN(cH)) return null;

    const startMins = sH * 60 + (sM || 0);
    const checkMins = cH * 60 + (cM || 0);

    const diff = checkMins - startMins;
    if (diff <= 0) return null; // Arrived before or on shift start time

    const hours = Math.floor(diff / 60);
    const mins = diff % 60;

    if (currentAppLang === 'ar') {
        if (hours > 0) {
            return `${hours} ساعة ${mins > 0 ? `و ${mins} دقيقة` : ''} تأخير`;
        } else {
            return `${mins} دقيقة تأخير`;
        }
    } else {
        if (hours > 0) {
            return `${hours}h${mins > 0 ? ` ${mins}m` : ''} late`;
        } else {
            return `${mins}m late`;
        }
    }
}

function markWorkerAttendance(workerId, status) {
    const isAttAdmin = currentUser && (currentUser.role === 'admin' || document.body.classList.contains('perm-attendance'));
    if (!isAttAdmin) {
        alert(currentAppLang === 'ar' ? 'فقط الإدارة يمكنها تعديل الحضور مباشرة.' : 'Only administrators can mark worker attendance directly.');
        return;
    }

    // Determine date string from date picker, default to today
    let dateStr = document.getElementById('attendance-date-picker')?.value;
    if (!dateStr) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateStr = `${yyyy}-${mm}-${dd}`;
    }

    const worker = getCompanyData().workers.find(w => w.id === workerId);
    if (!worker) return;

    if (status === 'present') {
        const timeInput = document.getElementById(`att-time-${workerId}`);
        let checkTime = "";
        if (timeInput && timeInput.value) {
            checkTime = timeInput.value;
        } else {
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            checkTime = `${hh}:${mm}`;
        }
        let shiftStart = worker.startTime;
        const dateParts = dateStr.split('-');
        const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeekName = dayNames[dateObj.getDay()];
        const dateOverrideShift = (worker.shifts || []).find(s => s.dayOfWeek === dayOfWeekName || s.specificDate === dateStr);
        if (dateOverrideShift) {
            shiftStart = dateOverrideShift.startTime;
        }
        const lateness = calculateLateness(shiftStart, checkTime);

        db.ref(`companies/${currentCompany}/attendance/${dateStr}/${workerId}`).set({
            status: 'present',
            time: checkTime,
            lateness: lateness || '',
            timestamp: Date.now()
        })
            .then(() => {
                logActivity('attendance', workerId, worker.name, `Marked attendance as PRESENT for ${worker.name} on ${dateStr} (Check-in: ${checkTime}, Lateness: ${lateness || 'None'})`);
            })
            .catch(err => console.error("Error setting attendance present:", err));
    } else if (status === 'absent') {
        db.ref(`companies/${currentCompany}/attendance/${dateStr}/${workerId}`).set({
            status: 'absent',
            time: '',
            lateness: '',
            timestamp: Date.now()
        })
            .then(() => {
                logActivity('attendance', workerId, worker.name, `Marked attendance as ABSENT for ${worker.name} on ${dateStr}`);
            })
            .catch(err => console.error("Error setting attendance absent:", err));
    } else if (status === 'vacation') {
        db.ref(`companies/${currentCompany}/attendance/${dateStr}/${workerId}`).set({
            status: 'vacation',
            time: '',
            lateness: '',
            timestamp: Date.now()
        })
            .then(() => {
                logActivity('attendance', workerId, worker.name, `Marked attendance as VACATION for ${worker.name} on ${dateStr}`);
            })
            .catch(err => console.error("Error setting attendance vacation:", err));
    }
}

function clearWorkerAttendance(workerId) {
    const isAttAdmin = currentUser && (currentUser.role === 'admin' || document.body.classList.contains('perm-attendance'));
    if (!isAttAdmin) {
        alert(currentAppLang === 'ar' ? 'فقط الإدارة يمكنها مسح سجل الحضور.' : 'Only administrators can clear attendance records.');
        return;
    }
    let dateStr = document.getElementById('attendance-date-picker')?.value;
    if (!dateStr) return;
    const worker = getCompanyData().workers.find(w => w.id === workerId);
    const wName = worker ? worker.name : 'Unknown';

    if (confirm(currentAppLang === 'ar' ? 'هل تريد مسح سجل الحضور لهذا اليوم؟' : 'Do you want to clear the attendance record for this day?')) {
        db.ref(`companies/${currentCompany}/attendance/${dateStr}/${workerId}`).remove()
            .then(() => {
                logActivity('attendance_clear', workerId, wName, `Cleared attendance record for ${wName} on ${dateStr}`);
            })
            .catch(err => console.error("Error clearing attendance:", err));
    }
}

function setWorkerVacationStatus(markActive) {
    const workerId = document.getElementById('vacation-worker-select').value;
    const dateStr = document.getElementById('vacation-date-input').value;

    if (!workerId || !dateStr) {
        alert(currentAppLang === 'ar' ? 'الرجاء اختيار الموظف والتاريخ.' : 'Please select employee and date.');
        return;
    }

    const worker = getCompanyData().workers.find(w => w.id === workerId);
    if (!worker) return;

    if (markActive) {
        db.ref(`companies/${currentCompany}/attendance/${dateStr}/${workerId}`).set({
            status: 'vacation',
            time: '',
            lateness: '',
            timestamp: Date.now()
        })
            .then(() => {
                logActivity('attendance', workerId, worker.name, `Marked attendance as VACATION for ${worker.name} on ${dateStr}`);
                const mainDatePicker = document.getElementById('attendance-date-picker');
                if (mainDatePicker && mainDatePicker.value === dateStr) {
                    renderAttendance();
                }
                alert(currentAppLang === 'ar' ? `تم تسجيل ${worker.name} في إجازة بنجاح!` : `Successfully marked ${worker.name} as on vacation!`);
            })
            .catch(err => console.error("Error setting attendance vacation:", err));
    } else {
        if (confirm(currentAppLang === 'ar' ? `هل تريد إزالة حالة الإجازة لـ ${worker.name} في ${dateStr}؟` : `Do you want to remove vacation status for ${worker.name} on ${dateStr}?`)) {
            db.ref(`companies/${currentCompany}/attendance/${dateStr}/${workerId}`).remove()
                .then(() => {
                    logActivity('attendance_clear', workerId, worker.name, `Cleared attendance/vacation record for ${worker.name} on ${dateStr}`);
                    const mainDatePicker = document.getElementById('attendance-date-picker');
                    if (mainDatePicker && mainDatePicker.value === dateStr) {
                        renderAttendance();
                    }
                    alert(currentAppLang === 'ar' ? 'تمت إزالة الإجازة بنجاح!' : 'Vacation status removed successfully!');
                })
                .catch(err => console.error("Error clearing attendance vacation:", err));
        }
    }
}

function renderAttendance() {
    const isAr = currentAppLang === 'ar';
    const datePicker = document.getElementById('attendance-date-picker');
    if (datePicker && !datePicker.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        datePicker.value = `${yyyy}-${mm}-${dd}`;
    }

    const vacDatePicker = document.getElementById('vacation-date-input');
    if (vacDatePicker && !vacDatePicker.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        vacDatePicker.value = `${yyyy}-${mm}-${dd}`;
    }

    const dateStr = datePicker ? datePicker.value : '';
    if (!dateStr) return;

    const tbody = document.getElementById('attendance-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    const companyData = getCompanyData();
    const isAttAdmin = currentUser && (currentUser.role === 'admin' || document.body.classList.contains('perm-attendance'));
    const currentEmail = currentUser && currentUser.email ? currentUser.email.toLowerCase() : '';
    const myWorker = companyData.workers.find(w => w.email && w.email.toLowerCase() === currentEmail);
    const workerOnlyCard = document.querySelector('.attendance-worker-only');
    if (workerOnlyCard) {
        if (myWorker) {
            workerOnlyCard.style.display = 'block';
            document.body.classList.add('has-worker-profile');
        } else {
            workerOnlyCard.style.display = 'none';
            document.body.classList.remove('has-worker-profile');
        }
    }

    // Populate Late Config Inputs
    const graceInput = document.getElementById('late-grace-input');
    const penaltyInput = document.getElementById('late-penalty-input');
    if (graceInput && !graceInput.matches(':focus')) {
        graceInput.value = companyData.lateGraceMinutes !== undefined ? companyData.lateGraceMinutes : '';
    }
    if (penaltyInput && !penaltyInput.matches(':focus')) {
        penaltyInput.value = companyData.latePenaltySAR !== undefined ? companyData.latePenaltySAR : '';
    }

    const workers = companyData.workers || [];
    const attendanceMap = (companyData.attendance || {})[dateStr] || {};

    if (workers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">${isAr ? 'لا يوجد موظفون مسجلون.' : 'No workers registered.'}</td></tr>`;
        return;
    }

    workers.forEach(w => {
        let shiftStart = w.startTime;
        let shiftEnd = w.endTime;
        const dateParts = dateStr.split('-');
        const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeekName = dayNames[dateObj.getDay()];
        const dateOverrideShift = (w.shifts || []).find(s => s.dayOfWeek === dayOfWeekName || s.specificDate === dateStr);
        if (dateOverrideShift) {
            shiftStart = dateOverrideShift.startTime;
            shiftEnd = dateOverrideShift.endTime;
        }
        const scheduled = (shiftStart && shiftEnd) ? `${shiftStart} - ${shiftEnd}` : (isAr ? 'لا يوجد' : 'None');
        const att = attendanceMap[w.id];

        let statusHtml = '';
        let checkinTimeHtml = '--';
        let latenessHtml = '--';

        if (!att) {
            statusHtml = `<span class="badge" style="background:var(--text-muted);">${isAr ? 'لم يُسجل' : 'Not Marked'}</span>`;
        } else if (att.status === 'present') {
            statusHtml = `<span class="badge badge-good" style="display:inline-flex; align-items:center; gap:4px; font-weight:700;">✔️ ${isAr ? 'حاضر' : 'Present'}</span>`;
            checkinTimeHtml = att.time || '--';
            if (att.lateness) {
                latenessHtml = `<span style="color:var(--danger); font-weight:700;">⚠️ ${att.lateness}</span>`;
            } else {
                latenessHtml = `<span style="color:var(--success); font-weight:700;">✅ ${isAr ? 'في الوقت' : 'On Time'}</span>`;
            }
        } else if (att.status === 'absent') {
            statusHtml = `<span class="badge badge-bad" style="display:inline-flex; align-items:center; gap:4px; font-weight:700;">❌ ${isAr ? 'غائب' : 'Absent'}</span>`;
        } else if (att.status === 'vacation') {
            statusHtml = `<span class="badge" style="display:inline-flex; align-items:center; gap:4px; font-weight:700; background:#0284c7; color:white;">🌴 ${isAr ? 'إجازة' : 'Vacation'}</span>`;
        }

        let exitHtml = '';
        let exitActionBtn = '';
        if (att && att.exitRequest) {
            const req = att.exitRequest;
            if (req.status === 'pending') {
                exitHtml = `<div style="font-size:0.75rem; color:#d97706; font-weight:600; margin-top:4px;">🚪 Exit Req: ${req.time} (${req.reason})</div>`;
                exitActionBtn = `
                    <button onclick="handleExitRequest('${w.id}', 'approve')" class="btn-success" style="padding: 4px 8px; font-size: 0.8rem; background:#16a34a; border-color:#16a34a;" title="${isAr ? 'موافقة خروج' : 'Approve Exit'}">🚪✔️</button>
                    <button onclick="handleExitRequest('${w.id}', 'reject')" class="btn-danger" style="padding: 4px 8px; font-size: 0.8rem;" title="${isAr ? 'رفض خروج' : 'Reject Exit'}">🚪❌</button>
                `;
            } else if (req.status === 'approved') {
                exitHtml = `<div style="font-size:0.75rem; color:#dc2626; font-weight:600; margin-top:4px;">🚪 OUT (since ${req.time})</div>`;
                exitActionBtn = `
                    <button onclick="handleExitRequest('${w.id}', 'returned')" class="btn-warning" style="padding: 4px 8px; font-size: 0.8rem; background:#d97706; border-color:#d97706;" title="${isAr ? 'تمت العودة' : 'Worker Returned'}">↩️ Returned</button>
                `;
            } else if (req.status === 'rejected') {
                exitHtml = `<div style="font-size:0.75rem; color:#dc2626; font-weight:600; margin-top:4px;">🚪 Exit Rejected</div>`;
            } else if (req.status === 'returned') {
                const retTimeStr = new Date(req.returnedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                exitHtml = `<div style="font-size:0.75rem; color:var(--info); font-weight:600; margin-top:4px;">🚪 Out: ${req.time} - Back: ${retTimeStr}</div>`;
            }
        }

        const todayNow = new Date();
        const hhNow = String(todayNow.getHours()).padStart(2, '0');
        const mmNow = String(todayNow.getMinutes()).padStart(2, '0');
        const currentTimeString = (att && att.status === 'present' && att.time) ? att.time : `${hhNow}:${mmNow}`;

        let actionsHtml = '';
        if (isAttAdmin) {
            actionsHtml = `
                <div style="display:inline-flex; align-items:center; gap:4px;">
                    ${exitActionBtn}
                    <input type="time" id="att-time-${w.id}" value="${currentTimeString}" style="padding: 4px; font-size: 0.8rem; width: 85px; background: var(--input-bg); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-main);" />
                    <button onclick="markWorkerAttendance('${w.id}', 'present')" class="btn-success" style="padding: 4px 8px; font-size: 0.8rem;" title="${isAr ? 'تسجيل حضور' : 'Mark Present'}">✔️</button>
                    <button onclick="markWorkerAttendance('${w.id}', 'absent')" class="btn-danger" style="padding: 4px 8px; font-size: 0.8rem;" title="${isAr ? 'تسجيل غياب' : 'Mark Absent'}">❌</button>
                    <button onclick="clearWorkerAttendance('${w.id}')" class="btn-outline" style="padding: 4px 8px; font-size: 0.8rem;" title="${isAr ? 'إعادة تعيين' : 'Reset'}">🔄</button>
                </div>
            `;
        } else if (myWorker && w.id === myWorker.id) {
            const todayDateStr = `${todayNow.getFullYear()}-${String(todayNow.getMonth() + 1).padStart(2, '0')}-${String(todayNow.getDate()).padStart(2, '0')}`;
            if (dateStr !== todayDateStr) {
                // Past or future date: non-admin worker cannot edit attendance
                if (att && att.status === 'present') {
                    actionsHtml = `<span style="color:var(--success); font-weight:700; font-size:0.85rem;">✅ ${isAr ? 'حاضر' : 'Present'}</span>`;
                } else if (att && att.status === 'absent') {
                    actionsHtml = `<span style="color:var(--danger); font-weight:700; font-size:0.85rem;">❌ ${isAr ? 'غائب' : 'Absent'}</span>`;
                } else if (att && att.status === 'vacation') {
                    actionsHtml = `<span style="color:#0284c7; font-weight:700; font-size:0.85rem;">🌴 ${isAr ? 'إجازة' : 'Vacation'}</span>`;
                } else {
                    actionsHtml = `<span style="color:var(--text-muted); font-size:0.85rem;">🔒 ${isAr ? 'انتهى التسجيل' : 'Locked'}</span>`;
                }
            } else if (att && att.status === 'vacation') {
                actionsHtml = `<span style="color:#0284c7; font-weight:700; font-size:0.85rem;">🌴 ${isAr ? 'إجازة' : 'Vacation'}</span>`;
            } else if (!att) {
                actionsHtml = `
                    <button onclick="markWorkerSelfAttendance()" class="btn-success" style="padding: 6px 12px; font-size: 0.8rem; font-weight:700;" title="${isAr ? 'تسجيل حضور' : 'Check-In'}">✔️ ${isAr ? 'حضور' : 'Check-In'}</button>
                `;
            } else if (att.status === 'present') {
                actionsHtml = `<span style="color:var(--success); font-weight:700; font-size:0.85rem;">✅ ${isAr ? 'تم تسجيل الحضور' : 'Checked In'}</span>`;
            } else {
                actionsHtml = `<span style="color:var(--danger); font-weight:700; font-size:0.85rem;">❌ ${isAr ? 'غائب' : 'Absent'}</span>`;
            }
        }

        const reportBtn = `<button onclick="showWorker3MonthAttendanceReport('${w.id}')" class="btn-outline" style="padding: 2px 8px; font-size: 0.72rem; margin-top: 4px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; background: var(--input-bg);" title="${isAr ? 'تقرير الحضور لآخر 3 أشهر' : '3-Month Attendance Report'}">
            📊 <span>${isAr ? 'تقرير 3 أشهر' : '3-Mo Report'}</span>
        </button>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong style="color:var(--text-main); display:block;">${w.name}</strong>
                <span style="font-size:0.75rem; color:var(--text-muted);">${w.role || ''}</span>
                <div>${reportBtn}</div>
                ${exitHtml}
            </td>
            <td>${statusHtml}</td>
            <td style="font-weight: 500;">${scheduled}</td>
            <td style="font-family: monospace; font-weight: 600;">${checkinTimeHtml}</td>
            <td>${latenessHtml}</td>
            <td>${actionsHtml}</td>
        `;
        tbody.appendChild(tr);
    });

    // Render worker self-view exit request status
    const workerExitRequestDiv = document.getElementById('worker-active-exit-request');
    if (workerExitRequestDiv) {
        workerExitRequestDiv.innerHTML = '';
        workerExitRequestDiv.style.display = 'none';
        if (myWorker) {
            const myAtt = attendanceMap[myWorker.id];
            if (myAtt && myAtt.exitRequest) {
                const req = myAtt.exitRequest;
                workerExitRequestDiv.style.display = 'block';
                let statusText = '';
                let statusColor = '';
                if (req.status === 'pending') {
                    statusText = isAr
                        ? `⏳ قيد الانتظار: طلب الخروج في ${req.time} (السبب: ${req.reason})`
                        : `⏳ Pending: Exit requested for ${req.time} (Reason: ${req.reason})`;
                    statusColor = '#d97706';
                } else if (req.status === 'approved') {
                    statusText = isAr
                        ? `🟢 تمت الموافقة: يمكنك الخروج الآن. وقت الخروج المعتمد: ${req.time}`
                        : `🟢 Approved: You may exit now. Out since ${req.time}`;
                    statusColor = 'var(--success)';
                } else if (req.status === 'rejected') {
                    statusText = isAr
                        ? `❌ تم الرفض: تم رفض طلب الخروج`
                        : `❌ Rejected: Exit request was rejected`;
                    statusColor = 'var(--danger)';
                } else if (req.status === 'returned') {
                    const retTimeStr = new Date(req.returnedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    statusText = isAr
                        ? `✅ تمت العودة: عدت إلى العمل في ${retTimeStr}`
                        : `✅ Returned: Checked back in at ${retTimeStr}`;
                    statusColor = 'var(--info)';
                }
                workerExitRequestDiv.innerHTML = `
                    <div style="padding: 12px; border-radius: var(--radius-md); background: var(--input-bg); border: 1px solid ${statusColor}; color: ${statusColor}; font-weight: 700; font-size: 0.9rem;">
                        ${statusText}
                    </div>
                `;
            }
        }
    }
    renderLateRules();
}

function showWorker3MonthAttendanceReport(workerId) {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const companyData = getCompanyData();
    const workers = companyData.workers || [];
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;

    const modal = document.getElementById('modal-3month-attendance-report');
    if (!modal) return;

    const titleEl = document.getElementById('att-report-worker-name');
    const rangeEl = document.getElementById('att-report-date-range');
    const summaryEl = document.getElementById('att-report-summary-boxes');
    const detailsEl = document.getElementById('att-report-details-container');

    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 89); // 90 days inclusive

    const yyyyStart = startDate.getFullYear();
    const mmStart = String(startDate.getMonth() + 1).padStart(2, '0');
    const ddStart = String(startDate.getDate()).padStart(2, '0');

    const yyyyEnd = today.getFullYear();
    const mmEnd = String(today.getMonth() + 1).padStart(2, '0');
    const ddEnd = String(today.getDate()).padStart(2, '0');

    if (titleEl) titleEl.textContent = `📊 ${worker.name} — ${isAr ? 'تقرير الحضور (3 أشهر)' : '3-Month Attendance Report'}`;
    if (rangeEl) rangeEl.textContent = `${yyyyStart}-${mmStart}-${ddStart} ➔ ${yyyyEnd}-${mmEnd}-${ddEnd} (90 ${isAr ? 'يوم' : 'Days'})`;

    const allAttendance = companyData.attendance || {};
    let countPresent = 0;
    let countVacation = 0;
    let countAbsent = 0;
    let countLate = 0;

    const monthGroups = {}; // key: YYYY-MM

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getDate()).padStart(2, '0');
        const dateKey = `${y}-${m}-${dayStr}`;
        const monthKey = `${y}-${m}`;

        if (!monthGroups[monthKey]) {
            monthGroups[monthKey] = [];
        }

        const dayAtt = (allAttendance[dateKey] || {})[workerId];
        let status = 'not_marked';
        let checkin = '--';
        let lateness = '--';

        if (dayAtt) {
            status = dayAtt.status || 'not_marked';
            if (status === 'present') {
                countPresent++;
                checkin = dayAtt.time || '--';
                if (dayAtt.lateness) {
                    countLate++;
                    lateness = dayAtt.lateness;
                }
            } else if (status === 'vacation') {
                countVacation++;
            } else if (status === 'absent') {
                countAbsent++;
            }
        }

        const dayOfWeekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayOfWeekNames[d.getDay()];

        monthGroups[monthKey].push({
            date: dateKey,
            dayName: dayName,
            status: status,
            checkin: checkin,
            lateness: lateness
        });
    }

    const totalMarkedDays = countPresent + countVacation + countAbsent;
    const attRate = totalMarkedDays > 0 ? Math.round((countPresent / (countPresent + countAbsent)) * 100) : 100;

    if (summaryEl) {
        summaryEl.innerHTML = `
            <div class="stat-box" style="background:var(--card-bg); border:1px solid var(--border-color); padding:12px; border-radius:10px; text-align:center;">
                <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">✔️ ${isAr ? 'أيام الحضور' : 'Present Days'}</div>
                <div style="font-size:1.4rem; font-weight:800; color:var(--success);">${countPresent}</div>
            </div>
            <div class="stat-box" style="background:var(--card-bg); border:1px solid var(--border-color); padding:12px; border-radius:10px; text-align:center;">
                <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">🌴 ${isAr ? 'أيام الإجازة' : 'Vacation Days'}</div>
                <div style="font-size:1.4rem; font-weight:800; color:#0284c7;">${countVacation}</div>
            </div>
            <div class="stat-box" style="background:var(--card-bg); border:1px solid var(--border-color); padding:12px; border-radius:10px; text-align:center;">
                <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">❌ ${isAr ? 'أيام الغياب' : 'Absent Days'}</div>
                <div style="font-size:1.4rem; font-weight:800; color:var(--danger);">${countAbsent}</div>
            </div>
            <div class="stat-box" style="background:var(--card-bg); border:1px solid var(--border-color); padding:12px; border-radius:10px; text-align:center;">
                <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">⚠️ ${isAr ? 'مرات التأخر' : 'Late Times'}</div>
                <div style="font-size:1.4rem; font-weight:800; color:#d97706;">${countLate}</div>
            </div>
            <div class="stat-box" style="background:var(--card-bg); border:1px solid var(--border-color); padding:12px; border-radius:10px; text-align:center;">
                <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">📈 ${isAr ? 'نسبة الحضور' : 'Attendance Rate'}</div>
                <div style="font-size:1.4rem; font-weight:800; color:var(--primary);">${isNaN(attRate) ? 100 : attRate}%</div>
            </div>
        `;
    }

    if (detailsEl) {
        detailsEl.innerHTML = '';

        const monthKeysSorted = Object.keys(monthGroups).sort().reverse();
        monthKeysSorted.forEach(mKey => {
            const daysList = monthGroups[mKey].reverse();
            let rowsHtml = '';

            daysList.forEach(day => {
                let badge = `<span class="badge" style="background:var(--input-bg); color:var(--text-muted);">${isAr ? 'لم يُسجل' : 'Not Marked'}</span>`;
                if (day.status === 'present') {
                    badge = `<span class="badge badge-good">✔️ ${isAr ? 'حاضر' : 'Present'}</span>`;
                } else if (day.status === 'vacation') {
                    badge = `<span class="badge" style="background:#0284c7; color:white;">🌴 ${isAr ? 'إجازة' : 'Vacation'}</span>`;
                } else if (day.status === 'absent') {
                    badge = `<span class="badge badge-bad">❌ ${isAr ? 'غائب' : 'Absent'}</span>`;
                }

                let lateBadge = '--';
                if (day.lateness && day.lateness !== '--') {
                    lateBadge = `<span style="color:var(--danger); font-weight:700;">⚠️ ${day.lateness}</span>`;
                } else if (day.status === 'present') {
                    lateBadge = `<span style="color:var(--success); font-weight:600;">✅ ${isAr ? 'في الوقت' : 'On Time'}</span>`;
                }

                const editTimeBtn = `<button onclick="editWorkerPastAttendanceTime('${workerId}', '${day.date}', '${day.checkin}', '${day.status}')" class="btn-outline" style="padding:2px 8px; font-size:0.75rem; font-weight:600; cursor:pointer;" title="${isAr ? 'تعديل الوقت والحالة' : 'Manage Time & Status'}">✏️ ${isAr ? 'تعديل' : 'Edit'}</button>`;

                rowsHtml += `
                    <tr>
                        <td style="font-weight:600;">${day.date} (${(typeof t === 'function' && t(day.dayName)) || day.dayName})</td>
                        <td>${badge}</td>
                        <td style="font-family:monospace; text-align:center;">
                            <div style="display:inline-flex; align-items:center; gap:8px; justify-content:center;">
                                <span>${day.checkin}</span>
                                ${editTimeBtn}
                            </div>
                        </td>
                        <td>${lateBadge}</td>
                    </tr>
                `;
            });

            detailsEl.innerHTML += `
                <div class="card" style="margin-bottom:0; padding:16px; border:1px solid var(--border-color); border-radius:12px;">
                    <h3 style="margin-bottom:12px; font-size:1.05rem; color:var(--primary);">🗓️ ${mKey}</h3>
                    <div class="table-container" style="max-height:220px; overflow-y:auto;">
                        <table style="width:100%; font-size:0.85rem;">
                            <thead>
                                <tr>
                                    <th>${isAr ? 'التاريخ واليوم' : 'Date & Day'}</th>
                                    <th>${isAr ? 'الحالة' : 'Status'}</th>
                                    <th>${isAr ? 'وقت الدخول' : 'Check-In'}</th>
                                    <th>${isAr ? 'التأخر' : 'Lateness'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });
    }

    modal.style.display = 'flex';
}

function close3MonthAttendanceReport() {
    const modal = document.getElementById('modal-3month-attendance-report');
    if (modal) modal.style.display = 'none';
}
window.showWorker3MonthAttendanceReport = showWorker3MonthAttendanceReport;
window.close3MonthAttendanceReport = close3MonthAttendanceReport;

// --- ACTIVITY LOG SYSTEM ---

function logActivity(type, workerId, workerName, details) {
    if (!currentCompany) return;
    const activityId = 'act-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    let actorName = 'System';
    let actorId = 'system';
    if (currentUser) {
        actorId = currentUser.uid || currentUser.email;
        const email = currentUser.email.toLowerCase();
        if (email === 'kinan.rahal@hotmail.com') {
            actorName = currentAppLang === 'ar' ? 'كينان (المالك)' : 'Kinan (Owner)';
        } else {
            const companyData = getCompanyData();
            const workers = companyData.workers || [];
            const w = workers.find(wk => wk.email && wk.email.toLowerCase() === email);
            if (w) {
                actorName = w.name;
            } else {
                actorName = currentUser.email.split('@')[0];
            }
        }
    }

    const logObj = {
        id: activityId,
        type: type,
        workerId: workerId || 'general',
        workerName: workerName || 'General',
        actorId: actorId,
        actorName: actorName,
        details: details,
        timestamp: Date.now()
    };

    db.ref(`companies/${currentCompany}/activityLogs/${activityId}`).set(logObj)
        .catch(err => console.error("Error writing activity log:", err));
}

function translateActivityLogDetails(details) {
    if (!details) return '';
    const lang = (typeof currentAppLang !== 'undefined' ? currentAppLang : localStorage.getItem("burgeroov_lang")) || 'en';
    if (lang !== 'ar') return details;

    // Warehouse Operations
    if (details.startsWith('Added new warehouse item "')) {
        const rest = details.replace('Added new warehouse item "', '');
        const name = rest.split('" with initial stock ')[0];
        const stock = rest.split('" with initial stock ')[1];
        return `تم إضافة صنف مستودع جديد "${name}" بمخزون أولي ${stock}`;
    }
    if (details.startsWith('Updated stock of "')) {
        const rest = details.replace('Updated stock of "', '');
        const name = rest.split('" to ')[0];
        const rest2 = rest.split('" to ')[1];
        const newStock = rest2.split(' (Difference: ')[0];
        const diff = rest2.split(' (Difference: ')[1].slice(0, -1);
        return `تم تحديث مخزون "${name}" إلى ${newStock} (الفرق: ${diff})`;
    }
    if (details.startsWith('Changed Max/Full Stock of "')) {
        const rest = details.replace('Changed Max/Full Stock of "', '');
        const name = rest.split('" to ')[0];
        const parsed = rest.split('" to ')[1];
        return `تم تغيير الحد الأقصى لمخزون "${name}" إلى ${parsed}`;
    }
    if (details.startsWith('Deleted warehouse item "')) {
        const name = details.replace('Deleted warehouse item "', '').slice(0, -1);
        return `تم حذف صنف المستودع "${name}"`;
    }
    if (details.startsWith('Moved item "')) {
        const rest = details.replace('Moved item "', '');
        const name = rest.split('" from category "')[0];
        const rest2 = rest.split('" from category "')[1];
        const oldCat = rest2.split('" to "')[0];
        const folderName = rest2.split('" to "')[1].slice(0, -1);
        return `تم نقل الصنف "${name}" من الفئة "${oldCat}" إلى "${folderName}"`;
    }

    // Financial Operations
    if (details.startsWith('Logged advance payment of SAR')) {
        const rest = details.replace('Logged advance payment of SAR ', '');
        const amount = rest.split(' for ')[0];
        const wName = rest.split(' for ')[1];
        return `تم تسجيل دفعة مقدمة (سلفة) بقيمة ${amount} ريال للموظف ${wName}`;
    }
    if (details.startsWith('Deleted advance payment record for')) {
        const wName = details.replace('Deleted advance payment record for ', '');
        return `تم حذف سجل الدفعة المقدمة (السلفة) للموظف ${wName}`;
    }
    if (details.startsWith('Logged reward/bonus of SAR')) {
        const rest = details.replace('Logged reward/bonus of SAR ', '');
        const amount = rest.split(' for ')[0];
        const wName = rest.split(' for ')[1];
        return `تم تسجيل مكافأة بقيمة ${amount} ريال للموظف ${wName}`;
    }
    if (details.startsWith('Deleted reward/bonus record for')) {
        const wName = details.replace('Deleted reward/bonus record for ', '');
        return `تم حذف سجل المكافأة للموظف ${wName}`;
    }
    if (details.startsWith('Logged custody item "')) {
        const rest = details.replace('Logged custody item "', '');
        const type = rest.split('" (SAR ')[0];
        const rest2 = rest.split('" (SAR ')[1];
        const amount = rest2.split(') for ')[0];
        const wName = rest2.split(') for ')[1];
        return `تم تسجيل عهدة "${type}" (بقيمة ${amount} ريال) للموظف ${wName}`;
    }
    if (details.startsWith('Deleted custody record for')) {
        const wName = details.replace('Deleted custody record for ', '');
        return `تم حذف سجل العهدة للموظف ${wName}`;
    }
    if (details.startsWith('Set initial carryover balance of SAR')) {
        const rest = details.replace('Set initial carryover balance of SAR ', '');
        const amount = rest.split(' for ')[0];
        const wName = rest.split(' for ')[1];
        return `تم تعيين الرصيد الافتتاحي المرحل بقيمة ${amount} ريال للموظف ${wName}`;
    }

    // Sales and Costs Entries/Undos
    if (details.startsWith('Entered sale transaction of SAR')) {
        const rest = details.replace('Entered sale transaction of SAR ', '');
        const amount = rest.split(' via ')[0];
        const method = rest.split(' via ')[1];
        return `تم تسجيل عملية مبيعات بقيمة ${amount} ريال عبر ${method}`;
    }
    if (details.startsWith('Deleted/Undid sale transaction of SAR')) {
        const rest = details.replace('Deleted/Undid sale transaction of SAR ', '');
        const amount = rest.split(' via ')[0];
        const method = rest.split(' via ')[1];
        return `تم التراجع عن/حذف عملية مبيعات بقيمة ${amount} ريال عبر ${method}`;
    }
    if (details.startsWith('Entered cost transaction of SAR')) {
        const rest = details.replace('Entered cost transaction of SAR ', '');
        const amount = rest.split(' for category "')[0];
        const cat = rest.split(' for category "')[1].slice(0, -1);
        return `تم تسجيل مصاريف بقيمة ${amount} ريال للفئة "${cat}"`;
    }
    if (details.startsWith('Deleted/Undid cost transaction of SAR')) {
        const rest = details.replace('Deleted/Undid cost transaction of SAR ', '');
        const amount = rest.split(' for category "')[0];
        const cat = rest.split(' for category "')[1].slice(0, -1);
        return `تم التراجع عن/حذف مصاريف بقيمة ${amount} ريال للفئة "${cat}"`;
    }
    if (details.startsWith('Entered past cost transaction of SAR')) {
        const rest = details.replace('Entered past cost transaction of SAR ', '');
        const amount = rest.split(' for category "')[0];
        const rest2 = rest.split(' for category "')[1];
        const cat = rest2.split('" on date ')[0];
        const dateStr = rest2.split('" on date ')[1];
        return `تم تسجيل مصاريف سابقة بقيمة ${amount} ريال للفئة "${cat}" بتاريخ ${dateStr}`;
    }

    // Attendance
    if (details.startsWith('Marked attendance as PRESENT for')) {
        const rest = details.replace('Marked attendance as PRESENT for ', '');
        const wName = rest.split(' on ')[0];
        const rest2 = rest.split(' on ')[1];
        const dateStr = rest2.split(' (Check-in: ')[0];
        const checkinParts = rest2.split(' (Check-in: ')[1].slice(0, -1);
        const checkTime = checkinParts.split(', Lateness: ')[0];
        const lateness = checkinParts.split(', Lateness: ')[1];
        const latenessTranslated = lateness === 'None' ? 'لا يوجد' : lateness;
        return `تم تسجيل حضور الموظف ${wName} بتاريخ ${dateStr} (وقت الدخول: ${checkTime}، التأخير: ${latenessTranslated})`;
    }
    if (details.startsWith('Marked attendance as ABSENT for')) {
        const rest = details.replace('Marked attendance as ABSENT for ', '');
        const wName = rest.split(' on ')[0];
        const dateStr = rest.split(' on ')[1];
        return `تم تسجيل غياب الموظف ${wName} بتاريخ ${dateStr}`;
    }
    if (details.startsWith('Cleared attendance record for')) {
        const rest = details.replace('Cleared attendance record for ', '');
        const wName = rest.split(' on ')[0];
        const dateStr = rest.split(' on ')[1];
        return `تم مسح سجل حضور الموظف ${wName} بتاريخ ${dateStr}`;
    }

    // 1. Posted a performance note: "${text}" (${detailsStr})
    if (details.startsWith('Posted a performance note:')) {
        const quoteStart = details.indexOf('"');
        const quoteEnd = details.lastIndexOf('"');
        const text = details.slice(quoteStart + 1, quoteEnd);
        const detailsStr = details.includes('(Public)') ? 'عام' : 'خاص';
        return `قام بنشر ملاحظة تقييم: "${text}" (${detailsStr})`;
    }

    // 2. Deleted performance note (ID: ${id})
    if (details.startsWith('Deleted performance note')) {
        const id = details.replace('Deleted performance note (ID: ', '').replace(')', '');
        return `تم حذف ملاحظة التقييم (رقم التعريف: ${id})`;
    }

    // 3. Added violation to ${worker.name}: "${record.reason}" (SAR ${record.amount})
    if (details.startsWith('Added violation to')) {
        const parts = details.replace('Added violation to ', '').split(': "');
        const workerName = parts[0];
        const rest = parts[1] || '';
        const reason = rest.slice(0, rest.lastIndexOf('"'));
        const amount = rest.slice(rest.lastIndexOf('SAR ') + 4, rest.lastIndexOf(')'));
        return `تم إضافة مخالفة للموظف ${workerName}: "${reason}" (SAR ${amount})`;
    }

    // 4. Deleted violation record from ${worker.name}
    if (details.startsWith('Deleted violation record from')) {
        const workerName = details.replace('Deleted violation record from ', '');
        return `تم حذف سجل المخالفة للموظف ${workerName}`;
    }

    // 5. ${worker.name} delivered: "${details}"
    if (details.includes(' delivered: "')) {
        const workerName = details.split(' delivered: "')[0];
        const orderDetails = details.split(' delivered: "')[1].slice(0, -1);
        return `قام الموظف ${workerName} بتسليم: "${orderDetails}"`;
    }

    // Payment Requests Lifecycle
    if (details.startsWith('Accepted payment request of SAR')) {
        const rest = details.replace('Accepted payment request of SAR ', '');
        const amount = rest.split(' for ')[0];
        const workerName = rest.split(' for ')[1];
        return `تم قبول طلب سلفة بقيمة SAR ${amount} للموظف ${workerName}`;
    }
    if (details.startsWith('Undid acceptance of payment request of SAR')) {
        const rest = details.replace('Undid acceptance of payment request of SAR ', '');
        const amount = rest.split(' for ')[0];
        const workerName = rest.split(' for ')[1];
        return `تم التراجع عن قبول طلب سلفة بقيمة SAR ${amount} للموظف ${workerName}`;
    }
    if (details.startsWith('Rejected payment request of SAR')) {
        const rest = details.replace('Rejected payment request of SAR ', '');
        const amount = rest.split(' for ')[0];
        const workerName = rest.split(' for ')[1];
        return `تم رفض طلب سلفة بقيمة SAR ${amount} للموظف ${workerName}`;
    }
    if (details.startsWith('Released payment request of SAR')) {
        const rest = details.replace('Released payment request of SAR ', '');
        const amount = rest.split(' to ')[0];
        const workerName = rest.split(' to ')[1];
        return `تم تسليم سلفة بقيمة SAR ${amount} للموظف ${workerName}`;
    }



    // 9. Added system violation to ${worker.name}: "${reason}" (Violation Count: ${count}/6)
    if (details.startsWith('Added system violation to')) {
        const rest = details.replace('Added system violation to ', '');
        const workerName = rest.split(': "')[0];
        const reasonPart = rest.split(': "')[1] || '';
        const reason = reasonPart.slice(0, reasonPart.lastIndexOf('"'));
        const count = reasonPart.slice(reasonPart.lastIndexOf('Violation Count: ') + 17, reasonPart.lastIndexOf(')'));
        return `تم إضافة مخالفة نظامية للموظف ${workerName}: "${reason}" (عدد المخالفات: ${count})`;
    }

    // 10. Removed system violation from ${worker.name}: "${reason}"
    if (details.startsWith('Removed system violation from')) {
        const rest = details.replace('Removed system violation from ', '');
        const workerName = rest.split(': "')[0];
        const reasonPart = rest.split(': "')[1] || '';
        const reason = reasonPart.slice(0, -1);
        return `تم إزالة مخالفة نظامية من الموظف ${workerName}: "${reason}"`;
    }

    return details;
}

function renderActivityLog() {
    const isAr = currentAppLang === 'ar';
    const listDiv = document.getElementById('activity-log-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';

    const companyData = getCompanyData();
    const logsMap = companyData.activityLogs || {};
    const logsList = Object.values(logsMap);

    if (logsList.length === 0) {
        listDiv.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.9rem; padding: 20px 0;">${isAr ? 'لا توجد أنشطة مسجلة اليوم.' : 'No activities logged today.'}</p>`;
        return;
    }

    logsList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const filterVal = document.getElementById('activity-filter')?.value || 'all';
    const dateFromVal = document.getElementById('activity-date-from')?.value;
    const dateToVal = document.getElementById('activity-date-to')?.value;

    const startOfDayMs = dateFromVal ? new Date(dateFromVal + 'T00:00:00').getTime() : null;
    const endOfDayMs = dateToVal ? new Date(dateToVal + 'T23:59:59.999').getTime() : null;

    let filtered = logsList;
    if (filterVal !== 'all') {
        filtered = filtered.filter(log => {
            if (filterVal === 'sales') {
                return log.type === 'sales' || log.type === 'sales_delete';
            }
            if (filterVal === 'costs') {
                return log.type === 'costs' || log.type === 'costs_delete';
            }
            if (filterVal === 'finance') {
                return log.type === 'finance' || log.type === 'finance_delete';
            }
            if (filterVal === 'task') {
                return log.type === 'task' || log.type === 'task_delete';
            }
            if (filterVal === 'violation') {
                return log.type === 'violation';
            }
            if (filterVal === 'perf_note') {
                return log.type === 'perf_note';
            }
            if (filterVal === 'attendance') {
                return log.type === 'attendance' || log.type === 'attendance_clear';
            }
            if (filterVal === 'delivery') {
                return log.type === 'delivery';
            }
            if (filterVal === 'warehouse') {
                return log.type === 'warehouse' || log.type === 'warehouse_delete';
            }
            return log.type === filterVal;
        });
    }
    if (startOfDayMs) {
        filtered = filtered.filter(log => log.timestamp >= startOfDayMs);
    }
    if (endOfDayMs) {
        filtered = filtered.filter(log => log.timestamp <= endOfDayMs);
    }

    if (filtered.length === 0) {
        listDiv.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.9rem; padding: 20px 0;">${isAr ? 'لا توجد أنشطة تطابق هذا التصنيف أو التواريخ المحددة.' : 'No activities matching this category or date range.'}</p>`;
        return;
    }

    filtered.forEach(log => {
        const dateStr = new Date(log.timestamp).toLocaleString(isAr ? 'ar-EG' : 'en-US');

        let typeBadge = '';
        if (log.type === 'delivery') {
            typeBadge = `<span class="badge" style="background:#3b82f6; color:white; font-weight:700;">🚚 ${isAr ? 'توصيل' : 'Delivery'}</span>`;
        } else if (log.type === 'finance' || log.type === 'finance_delete') {
            typeBadge = `<span class="badge" style="background:#10b981; color:white; font-weight:700;">💰 ${isAr ? 'مالية' : 'Finance'}</span>`;
        } else if (log.type === 'violation') {
            typeBadge = `<span class="badge" style="background:#ef4444; color:white; font-weight:700;">⚠️ ${isAr ? 'مخالفة' : 'Violation'}</span>`;
        } else if (log.type === 'perf_note') {
            typeBadge = `<span class="badge" style="background:#f59e0b; color:white; font-weight:700;">📝 ${isAr ? 'ملاحظة تقييم' : 'Performance Note'}</span>`;
        } else if (log.type === 'sales' || log.type === 'sales_delete') {
            typeBadge = `<span class="badge" style="background:#ec4899; color:white; font-weight:700;">📈 ${isAr ? 'مبيعات' : 'Sales'}</span>`;
        } else if (log.type === 'costs' || log.type === 'costs_delete') {
            typeBadge = `<span class="badge" style="background:#f43f5e; color:white; font-weight:700;">📉 ${isAr ? 'مصاريف' : 'Costs'}</span>`;
        } else if (log.type === 'task' || log.type === 'task_delete') {
            typeBadge = `<span class="badge" style="background:#8b5cf6; color:white; font-weight:700;">📋 ${isAr ? 'مهام' : 'Tasks'}</span>`;
        } else if (log.type === 'attendance' || log.type === 'attendance_clear') {
            typeBadge = `<span class="badge" style="background:#06b6d4; color:white; font-weight:700;">📅 ${isAr ? 'حضور وغياب' : 'Attendance'}</span>`;
        } else if (log.type === 'warehouse' || log.type === 'warehouse_delete') {
            typeBadge = `<span class="badge" style="background:#0f766e; color:white; font-weight:700;">📦 ${isAr ? 'مستودع' : 'Warehouse'}</span>`;
        }

        const card = document.createElement('div');
        card.className = 'ledger-card';
        card.style.borderLeft = '4px solid var(--text-muted)';
        card.style.padding = '12px 16px';
        card.style.background = 'var(--card-bg)';
        card.style.borderRadius = '8px';
        card.style.marginBottom = '8px';
        card.style.boxShadow = 'var(--shadow-sm)';

        const deleteBtn = `<button onclick="deleteActivityLog('${log.id}')" class="btn-outline-danger" style="padding: 2px 6px; font-size: 0.7rem; line-height: 1; border: none; border-radius: 4px; margin-left: 8px;" title="${isAr ? 'حذف النشاط' : 'Delete Activity'}">🗑️</button>`;

        card.innerHTML = `
            <div class="flex-between" style="align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
                <div>
                    ${typeBadge}
                    <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 8px;">🕒 ${dateStr}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">${isAr ? 'بواسطة: ' : 'By: '} <strong style="color:var(--text-main);">${log.actorName || 'System'}</strong></span>
                    ${deleteBtn}
                </div>
            </div>
            <div style="font-size: 0.9rem; color: var(--text-main); font-weight: 500; line-height: 1.4;">
                ${translateActivityLogDetails(log.details)}
            </div>
        `;
        listDiv.appendChild(card);
    });
}

function deleteActivityLog(activityId) {
    const isAr = currentAppLang === 'ar';
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذا النشاط من السجل؟' : 'Are you sure you want to delete this activity log?')) {
        db.ref(`companies/${currentCompany}/activityLogs/${activityId}`).remove()
            .catch(err => console.error("Error deleting activity log:", err));
    }
}

function clearAllActivityLogs() {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr 
        ? '⚠️ هل أنت تأكد من تفريغ سجل الأنشطة بالكامل بضغطة واحدة لتوفير مساحة الذاكرة؟' 
        : '⚠️ Are you sure you want to empty the entire activity log with 1-click to save database space?')) {
        return;
    }
    db.ref(`companies/${currentCompany}/activityLogs`).remove()
        .then(() => {
            if (appData[currentCompany]) appData[currentCompany].activityLogs = {};
            renderActivityLog();
            if (typeof showInAppNotification === 'function') {
                showInAppNotification(isAr ? '🗑️ تم تفريغ سجل الأنشطة بالكامل بنجاح!' : '🗑️ Activity log emptied successfully!');
            }
        })
        .catch(err => {
            console.error("Error clearing activity log:", err);
            alert(isAr ? 'حدث خطأ أثناء تفريغ السجل.' : 'Error clearing activity log.');
        });
}
window.clearAllActivityLogs = clearAllActivityLogs;

// Bind to window
window.markWorkerAttendance = markWorkerAttendance;
window.clearWorkerAttendance = clearWorkerAttendance;
window.renderAttendance = renderAttendance;
window.logActivity = logActivity;
window.renderActivityLog = renderActivityLog;
window.deleteActivityLog = deleteActivityLog;

// --- SYSTEM VIOLATIONS SYSTEM ---

function getSystemViolationDeductionsForMonth(worker, monthStr) {
    const list = worker.systemViolations || [];
    const sorted = [...list].sort((a, b) => a.timestamp - b.timestamp);
    let totalDeduction = 0;
    const base = parseFloat(worker.income || 0);
    const dayRate = base / 30;

    sorted.forEach((viol, idx) => {
        const violDate = new Date(viol.timestamp);
        const violMonth = `${violDate.getFullYear()}-${String(violDate.getMonth() + 1).padStart(2, '0')}`;
        if (violMonth === monthStr) {
            if (idx === 2) {
                totalDeduction += Math.round(dayRate * 1);
            } else if (idx === 3) {
                totalDeduction += Math.round(dayRate * 3);
            } else if (idx === 4) {
                totalDeduction += Math.round(dayRate * 7);
            }
        }
    });
    return totalDeduction;
}

function getSystemViolationLogsForMonth(worker, monthStr) {
    const list = worker.systemViolations || [];
    const sorted = [...list].sort((a, b) => a.timestamp - b.timestamp);
    const base = parseFloat(worker.income || 0);
    const dayRate = base / 30;
    const logs = [];

    sorted.forEach((viol, idx) => {
        const violDate = new Date(viol.timestamp);
        const violMonth = `${violDate.getFullYear()}-${String(violDate.getMonth() + 1).padStart(2, '0')}`;
        if (violMonth === monthStr) {
            if (idx === 2) {
                logs.push({ text: `Violation #3: -1 Day Salary`, amount: Math.round(dayRate * 1) });
            } else if (idx === 3) {
                logs.push({ text: `Violation #4: -3 Days Salary`, amount: Math.round(dayRate * 3) });
            } else if (idx === 4) {
                logs.push({ text: `Violation #5: -7 Days Salary`, amount: Math.round(dayRate * 7) });
            } else {
                logs.push({ text: `Violation #${idx + 1}: warning`, amount: 0 });
            }
        }
    });
    return logs;
}

function checkWorkerSystemViolationAlerts(worker) {
    if (!worker) return;
    const count = (worker.systemViolations || []).length;
    const ack = worker.alertsAcknowledged || {};

    if (count === 1 && !ack.warning1) {
        showWorkerAlertOverlay(
            "Official Warning: First System Violation",
            "تنبيه رسمي: المخالفة النظامية الأولى",
            "You have received your first system violation. Please note that further violations will lead to salary deductions and potential termination. Ensure you follow all facility rules and regulations.",
            "لقد تم تسجيل المخالفة النظامية الأولى بحقك. يرجى العلم بأن تكرار المخالفات سيؤدي إلى خصومات مالية من الراتب وقد يصل إلى الفصل النهائي. يرجى الالتزام بكافة التعليمات والأنظمة.",
            "warning1",
            worker.id
        );
    } else if (count === 2 && !ack.warning2) {
        showWorkerAlertOverlay(
            "URGENT Warning: Salary Cut-off Impending",
            "تنبيه عاجل: خصم وشيك من الراتب",
            "This is your SECOND system violation. This is a final warning before salary deductions begin. Your next violation will result in an automatic deduction of one day's salary. Please review your conduct immediately.",
            "هذا هو التنبيه النظامي الثاني بحقك. هذا هو الإنذار النهائي قبل البدء بالخصومات المالية من راتبك. المخالفة القادمة ستؤدي إلى خصم تلقائي لقيمة يوم عمل كامل من راتبك الشهري. يرجى مراجعة سلوكك فوراً.",
            "warning2",
            worker.id
        );
    } else if (count >= 6 && !worker.unlockedClose) {
        const listStr = (worker.systemViolations || []).map((v, i) => `${i + 1}. ${v.reason}`).join('<br>');
        showWorkerAlertOverlay(
            "Your Account has been Terminated",
            "تم فصلك عن العمل نهائياً",
            `Your employment has been permanently terminated due to system violations. Details:<br>${listStr}`,
            `تم فصلك عن العمل نهائيا للاسباب التالية :<br>${listStr}<br><br>لن يتم احتساب اي ساعة عمل لك بعد هذه الرسالة يرجى مراجعة الادارة لتصفية حساباتك وسيتم اتخاذ اللازم.`,
            "block",
            worker.id
        );
    } else {
        const m = document.getElementById('worker-alert-modal');
        if (m && !m.classList.contains('permanent-block-modal')) {
            m.remove();
        }
    }
}

function showWorkerAlertOverlay(titleEn, titleAr, msgEn, msgAr, type, workerId) {
    if (document.getElementById('worker-alert-modal')) return;

    const isAr = currentAppLang === 'ar';
    const modal = document.createElement('div');
    modal.id = 'worker-alert-modal';
    if (type === 'block') {
        modal.classList.add('permanent-block-modal');
    }
    modal.style = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.85);
        display: flex; align-items: center; justify-content: center;
        z-index: 100000;
        padding: 20px;
        backdrop-filter: blur(8px);
    `;

    const content = document.createElement('div');
    content.className = 'card';
    content.style = `
        max-width: 600px;
        width: 100%;
        background: var(--card-bg);
        border: 2px solid var(--danger);
        border-radius: 16px;
        padding: 30px;
        box-shadow: var(--shadow-lg);
        text-align: center;
    `;

    const enHtml = `
        <div style="direction: ltr; margin-bottom: 20px; border-bottom: 1px dashed var(--border-color); padding-bottom: 20px;">
            <h2 style="color: var(--danger); margin-bottom: 12px; font-size: 1.5rem;">🚨 ${titleEn}</h2>
            <p style="font-size: 1rem; color: var(--text-main); line-height: 1.5; font-weight: 500; text-align: left;">${msgEn}</p>
        </div>
    `;

    const arHtml = `
        <div style="direction: rtl; margin-bottom: 25px;">
            <h2 style="color: var(--danger); margin-bottom: 12px; font-size: 1.5rem;">🚨 ${titleAr}</h2>
            <p style="font-size: 1rem; color: var(--text-main); line-height: 1.5; font-weight: 500; text-align: right;">${msgAr}</p>
        </div>
    `;

    let buttonHtml = '';
    if (type === 'block') {
        buttonHtml = `<p style="font-weight:700; color:var(--danger); font-size:1.1rem; border: 2px solid var(--danger); padding: 12px; border-radius: 8px; background:var(--danger-bg); margin-top:20px; direction:rtl;">
            الرجاء مراجعة الإدارة لتصفية حساباتك.
        </p>`;
    } else {
        buttonHtml = `
            <button onclick="confirmWorkerAlert('${workerId}', '${type}')" class="btn-danger" style="padding: 12px 30px; font-size: 1.05rem; font-weight: 800; border-radius: 8px; cursor: pointer; width: 100%; box-shadow: var(--shadow-md);">
                لقد قرأت الرسالة وأؤكد فهمي لها | Confirm & Close
            </button>
        `;
    }

    content.innerHTML = enHtml + arHtml + buttonHtml;
    modal.appendChild(content);
    document.body.appendChild(modal);
}

function confirmWorkerAlert(workerId, type) {
    const workers = getCompanyData().workers || [];
    const idx = workers.findIndex(w => w.id === workerId);
    if (idx === -1) return;

    db.ref(`companies/${currentCompany}/workers/${idx}/alertsAcknowledged/${type}`).set(true)
        .then(() => {
            const m = document.getElementById('worker-alert-modal');
            if (m) m.remove();
        })
        .catch(err => console.error("Error acknowledging alert:", err));
}

function renderSelectedWorkerSysViolations() {
    const workerId = document.getElementById('sys-viol-worker-select')?.value;
    const listUl = document.getElementById('sys-viol-list');
    const unlockedSection = document.getElementById('sys-viol-unlocked-section');
    const statusLabel = document.getElementById('sys-viol-status-label');
    const unlockBtn = document.getElementById('sys-viol-unlock-btn');

    if (!listUl) return;
    listUl.innerHTML = '';

    if (!workerId) {
        if (unlockedSection) unlockedSection.style.display = 'none';
        return;
    }

    const worker = getCompanyData().workers.find(w => w.id === workerId);
    if (!worker) return;

    const list = worker.systemViolations || [];
    const count = list.length;

    list.forEach((v, index) => {
        const li = document.createElement('li');
        li.style = "display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--input-bg); margin-bottom:8px; border-radius:6px; border:1px solid var(--border-color); font-size:0.9rem;";
        const dateStr = new Date(v.timestamp).toLocaleDateString();
        li.innerHTML = `
            <div>
                <strong style="color:var(--text-main);">${index + 1}. ${v.reason}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">📅 ${dateStr}</div>
            </div>
            <button onclick="deleteSystemViolation('${workerId}', ${index})" class="btn-outline-danger" style="padding:4px 8px; font-size:0.75rem; border:none; text-decoration:underline;">${t('btn-remove')}</button>
        `;
        listUl.appendChild(li);
    });

    if (unlockedSection) {
        unlockedSection.style.display = 'block';
        const isAr = currentAppLang === 'ar';
        if (count >= 6) {
            unlockBtn.style.display = 'block';
            if (worker.unlockedClose) {
                statusLabel.innerHTML = `<span style="color:var(--success); font-weight:700;">🔓 ${isAr ? 'تم إلغاء القفل (مسموح بالدخول)' : 'Unlocked (Allowed App Access)'}</span>`;
                unlockBtn.textContent = isAr ? 'قفل الحساب' : 'Lock Account';
                unlockBtn.className = 'btn-danger';
            } else {
                statusLabel.innerHTML = `<span style="color:var(--danger); font-weight:700;">🔒 ${isAr ? 'مقفل / مفصول (محظور)' : 'Locked / Terminated (Blocked)'}</span>`;
                unlockBtn.textContent = isAr ? 'إلغاء قفل الحساب' : 'Unlock Account';
                unlockBtn.className = 'btn-success';
            }
        } else {
            statusLabel.innerHTML = `<span style="color:var(--text-muted);">${isAr ? `الحالة: نشط (المخالفات: ${count}/6)` : `Status: Active (Violations: ${count}/6)`}</span>`;
            unlockBtn.style.display = 'none';
        }
    }
}

function addSystemViolation() {
    const workerId = document.getElementById('sys-viol-worker-select').value;
    const reason = document.getElementById('sys-viol-reason').value.trim();

    if (!workerId) {
        alert("Please select a worker first.");
        return;
    }
    if (!reason) {
        alert("Please enter a reason for the system violation.");
        return;
    }

    const workers = getCompanyData().workers || [];
    const idx = workers.findIndex(w => w.id === workerId);
    if (idx === -1) return;

    const worker = workers[idx];
    const list = worker.systemViolations || [];

    const newViol = {
        id: 'sv-' + Date.now(),
        reason: reason,
        timestamp: Date.now()
    };

    list.push(newViol);

    const count = list.length;
    let alertsAck = worker.alertsAcknowledged || {};
    if (count === 1) alertsAck.warning1 = false;
    if (count === 2) alertsAck.warning2 = false;

    const updates = {
        systemViolations: list,
        alertsAcknowledged: alertsAck
    };

    if (count === 6) {
        updates.unlockedClose = false;
    }

    db.ref(`companies/${currentCompany}/workers/${idx}`).update(updates)
        .then(() => {
            document.getElementById('sys-viol-reason').value = '';
            if (typeof logActivity === 'function') {
                logActivity('violation', worker.id, worker.name, `Added system violation to ${worker.name}: "${reason}" (Violation Count: ${count}/6)`);
            }
            alert("System violation added successfully!");
            renderSelectedWorkerSysViolations();
        })
        .catch(err => console.error("Error adding system violation:", err));
}

function deleteSystemViolation(workerId, index) {
    if (!confirm("Are you sure you want to remove this system violation?")) return;

    const workers = getCompanyData().workers || [];
    const idx = workers.findIndex(w => w.id === workerId);
    if (idx === -1) return;

    const worker = workers[idx];
    const list = [...(worker.systemViolations || [])];
    const removed = list.splice(index, 1)[0];

    db.ref(`companies/${currentCompany}/workers/${idx}/systemViolations`).set(list)
        .then(() => {
            if (typeof logActivity === 'function') {
                logActivity('violation', worker.id, worker.name, `Removed system violation from ${worker.name}: "${removed ? removed.reason : ''}"`);
            }
            alert("System violation removed successfully!");
            renderSelectedWorkerSysViolations();
        })
        .catch(err => console.error("Error deleting system violation:", err));
}

function toggleWorkerCloseStatus() {
    const workerId = document.getElementById('sys-viol-worker-select').value;
    if (!workerId) return;

    const workers = getCompanyData().workers || [];
    const idx = workers.findIndex(w => w.id === workerId);
    if (idx === -1) return;

    const worker = workers[idx];
    const newStatus = !worker.unlockedClose;

    db.ref(`companies/${currentCompany}/workers/${idx}/unlockedClose`).set(newStatus)
        .then(() => {
            alert(newStatus ? "Worker account unlocked successfully!" : "Worker account locked successfully!");
            renderSelectedWorkerSysViolations();
        })
        .catch(err => console.error("Error toggling close status:", err));
}

function claimGeneralDelivery(orderId) {
    if (!currentUser) return;
    const companyData = getCompanyData();
    const email = currentUser.email.toLowerCase();
    const workerIndex = companyData.workers.findIndex(w => w.email && w.email.toLowerCase() === email);
    if (workerIndex === -1) {
        alert(t('not-linked-worker') || "Your account is not linked to a worker profile.");
        return;
    }
    const worker = companyData.workers[workerIndex];
    if (worker.activeOrder) {
        alert(t('msg-already-has-active-order') || "You already have an active order!");
        return;
    }

    const pool = companyData.generalDeliveries || {};
    const orderData = pool[orderId];
    if (!orderData) {
        alert(t('msg-order-not-found') || "This order is no longer available.");
        return;
    }

    // Fire database transaction to prevent concurrent claims
    db.ref(`companies/${currentCompany}/generalDeliveries/${orderId}`).transaction(currentData => {
        if (currentData === null) {
            return undefined; // Already deleted/claimed
        }
        return null; // Delete it
    }, (error, committed, snapshot) => {
        if (error) {
            console.error("Transaction failed:", error);
            alert("An error occurred while claiming the order.");
        } else if (!committed) {
            alert(t('msg-already-claimed') || "This order was already claimed by another driver.");
        } else {
            // Success! Set the order as the driver's activeOrder
            orderData.assignedToWorkerId = worker.id;
            orderData.assignedToWorkerName = worker.name;
            db.ref(`companies/${currentCompany}/workers/${workerIndex}/activeOrder`).set(orderData)
                .then(() => {
                    logActivity('delivery', worker.id, worker.name, `${worker.name} accepted general delivery order #${orderData.orderNum || ''}`);
                    alert(t('msg-claimed-success') || "Order claimed successfully!");
                    renderAll();
                })
                .catch(err => console.error("Error setting driver active order:", err));
        }
    });
}

function cancelGeneralPoolOrder(orderId) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? "هل أنت متأكد من إلغاء هذا الطلب من التوصيل العام؟" : "Are you sure you want to cancel this order from the general pool?")) {
        return;
    }
    db.ref(`companies/${currentCompany}/generalDeliveries/${orderId}`).remove()
        .then(() => {
            logActivity('delivery', 'general', 'General Pool', `Cancelled/Removed order from the general deliveries pool.`);
            alert(isAr ? "تم إلغاء الطلب بنجاح." : "Order cancelled successfully.");
        })
        .catch(err => console.error("Error cancelling general pool order:", err));
}

window.claimGeneralDelivery = claimGeneralDelivery;
window.cancelGeneralPoolOrder = cancelGeneralPoolOrder;
window.getSystemViolationDeductionsForMonth = getSystemViolationDeductionsForMonth;
window.getSystemViolationLogsForMonth = getSystemViolationLogsForMonth;
window.checkWorkerSystemViolationAlerts = checkWorkerSystemViolationAlerts;
window.confirmWorkerAlert = confirmWorkerAlert;
window.renderSelectedWorkerSysViolations = renderSelectedWorkerSysViolations;
window.addSystemViolation = addSystemViolation;
window.deleteSystemViolation = deleteSystemViolation;
window.toggleWorkerCloseStatus = toggleWorkerCloseStatus;
window.saveLateSettings = saveLateSettings;
window.getLateDeductionsForMonth = getLateDeductionsForMonth;
window.getDriverVolumeRewardsForMonth = getDriverVolumeRewardsForMonth;

// ========================================================
// FEATURE 7: WORKER PROFILE, SHIFTS AND OVERTIME FUNCTIONS
// ========================================================

function getShiftDurationHours(startTime, endTime) {
    if (!startTime || !endTime) return 8; // default fallback
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let diffMins = (eh * 60 + em) - (sh * 60 + sm);
    if (diffMins < 0) {
        diffMins += 24 * 60; // shift crosses midnight
    }
    return diffMins / 60;
}

function saveWorkerProfileChanges() {
    const workerId = document.getElementById('ops-worker-select').value;
    if (!workerId) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;

    const newName = document.getElementById('ops-edit-name').value.trim();
    const newRole = document.getElementById('ops-edit-role').value.trim();
    const newSalary = parseFloat(document.getElementById('ops-edit-salary').value);
    const newBranch = document.getElementById('ops-edit-branch').value;

    if (!newName || !newRole || isNaN(newSalary) || newSalary <= 0 || !newBranch) {
        alert("Please ensure all profile fields are valid.");
        return;
    }

    const worker = getCompanyData().workers[workerIndex];

    worker.name = newName;
    worker.role = newRole;
    worker.income = newSalary;
    worker.branch = newBranch;

    db.ref(`companies/${currentCompany}/workers/${workerIndex}`).update({
        name: newName,
        role: newRole,
        income: newSalary,
        branch: newBranch
    }).then(() => {
        logActivity('ops', worker.id, worker.name, `Updated profile details for employee ${worker.name}`);
        alert("Worker profile updated successfully!");
        renderAll();
    }).catch(err => {
        console.error("Error updating worker profile:", err);
        alert("Failed to save profile changes.");
    });
}

function addNewWorkerShift() {
    const workerId = document.getElementById('ops-worker-select').value;
    if (!workerId) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;

    const startTime = document.getElementById('ops-new-shift-start').value;
    const endTime = document.getElementById('ops-new-shift-end').value;

    if (!startTime || !endTime) {
        alert("Please specify start and end times for the shift.");
        return;
    }

    const worker = getCompanyData().workers[workerIndex];
    if (!worker.shifts) worker.shifts = [];
    const dayOfWeek = document.getElementById('ops-new-shift-day') ? document.getElementById('ops-new-shift-day').value : '';

    const newShift = {
        id: Date.now().toString(),
        startTime: startTime,
        endTime: endTime,
        dayOfWeek: dayOfWeek || "",
        active: !dayOfWeek && worker.shifts.length === 0
    };

    worker.shifts.push(newShift);

    if (newShift.active) {
        worker.startTime = startTime;
        worker.endTime = endTime;
    }

    db.ref(`companies/${currentCompany}/workers/${workerIndex}`).update({
        shifts: worker.shifts,
        startTime: worker.startTime,
        endTime: worker.endTime
    }).then(() => {
        document.getElementById('ops-new-shift-start').value = '';
        document.getElementById('ops-new-shift-end').value = '';
        if (document.getElementById('ops-new-shift-day')) document.getElementById('ops-new-shift-day').value = '';
        const activityMsg = dayOfWeek
            ? `Added new override shift for ${dayOfWeek} (${startTime} - ${endTime}) for ${worker.name}`
            : `Added new shift (${startTime} - ${endTime}) for ${worker.name}`;
        logActivity('ops', worker.id, worker.name, activityMsg);
        renderOpsDetails();
        renderOpsWorkersTable();
    }).catch(err => {
        console.error("Error adding shift:", err);
        alert("Failed to add shift.");
    });
}

function activateWorkerShift(shiftId) {
    const workerId = document.getElementById('ops-worker-select').value;
    if (!workerId) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;

    const worker = getCompanyData().workers[workerIndex];
    if (!worker.shifts) return;

    worker.shifts.forEach(s => {
        s.active = (s.id === shiftId);
    });

    const activeShift = worker.shifts.find(s => s.active);
    if (activeShift) {
        worker.startTime = activeShift.startTime;
        worker.endTime = activeShift.endTime;
    }

    db.ref(`companies/${currentCompany}/workers/${workerIndex}`).update({
        shifts: worker.shifts,
        startTime: worker.startTime,
        endTime: worker.endTime
    }).then(() => {
        logActivity('ops', worker.id, worker.name, `Activated shift (${worker.startTime} - ${worker.endTime}) for ${worker.name}`);
        renderOpsDetails();
        renderOpsWorkersTable();
    }).catch(err => {
        console.error("Error activating shift:", err);
        alert("Failed to activate shift.");
    });
}

function deleteWorkerShift(shiftId) {
    const workerId = document.getElementById('ops-worker-select').value;
    if (!workerId) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;

    const worker = getCompanyData().workers[workerIndex];
    if (!worker.shifts) return;

    const deletedShift = worker.shifts.find(s => s.id === shiftId);
    if (!deletedShift) return;

    if (deletedShift.active && worker.shifts.length > 1) {
        alert("Please activate a different shift before deleting the active one.");
        return;
    }

    worker.shifts = worker.shifts.filter(s => s.id !== shiftId);

    if (worker.shifts.length === 0) {
        worker.startTime = "";
        worker.endTime = "";
    }

    db.ref(`companies/${currentCompany}/workers/${workerIndex}`).update({
        shifts: worker.shifts,
        startTime: worker.startTime,
        endTime: worker.endTime
    }).then(() => {
        logActivity('ops', worker.id, worker.name, `Deleted shift (${deletedShift.startTime} - ${deletedShift.endTime}) for ${worker.name}`);
        renderOpsDetails();
        renderOpsWorkersTable();
    }).catch(err => {
        console.error("Error deleting shift:", err);
        alert("Failed to delete shift.");
    });
}

function addOvertimeHour() {
    const workerId = document.getElementById('ops-worker-select').value;
    if (!workerId) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;

    const worker = getCompanyData().workers[workerIndex];
    const baseIncome = parseFloat(worker.income) || 0;
    const duration = getShiftDurationHours(worker.startTime, worker.endTime);
    const hourlyRate = baseIncome / (30 * duration);

    const hours = parseFloat(document.getElementById('ops-ov-hours').value) || 1.0;
    const mult = parseFloat(document.getElementById('ops-ov-multiplier').value) || 1.0;
    const finalAmount = Math.round(hours * hourlyRate * mult * 100) / 100;

    const stats = getMonthlyStats(worker, currentGlobalMonth);
    if (!stats.overtimeList) stats.overtimeList = [];

    const newLog = {
        id: Date.now().toString(),
        date: formatTimestamp(),
        hours: hours,
        rate: Math.round(hourlyRate * 100) / 100,
        multiplier: mult,
        amount: finalAmount
    };

    stats.overtimeList.unshift(newLog);

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/overtimeList`).set(stats.overtimeList)
        .then(() => {
            logActivity('ops', worker.id, worker.name, `Logged ${hours} hr(s) overtime (x${mult}) for ${worker.name} (SAR ${finalAmount})`);
            renderOpsDetails();
        }).catch(err => {
            console.error("Error adding overtime:", err);
            alert("Failed to log overtime.");
        });
}

function deleteOvertimeHour(logId) {
    const workerId = document.getElementById('ops-worker-select').value;
    if (!workerId) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;

    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);
    if (!stats.overtimeList) return;

    const targetLog = stats.overtimeList.find(o => o.id === logId);
    if (!targetLog) return;

    stats.overtimeList = stats.overtimeList.filter(o => o.id !== logId);

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/overtimeList`).set(stats.overtimeList)
        .then(() => {
            logActivity('ops', worker.id, worker.name, `Removed overtime entry of ${targetLog.hours} hr (x${targetLog.multiplier}) for ${worker.name}`);
            renderOpsDetails();
        }).catch(err => {
            console.error("Error deleting overtime:", err);
            alert("Failed to delete overtime entry.");
        });
}

function deleteOvertimeHourFromFin(workerId, logId) {
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;

    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);
    if (!stats.overtimeList) return;

    const targetLog = stats.overtimeList.find(o => o.id === logId);
    if (!targetLog) return;

    stats.overtimeList = stats.overtimeList.filter(o => o.id !== logId);

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/overtimeList`).set(stats.overtimeList)
        .then(() => {
            logActivity('finance', worker.id, worker.name, `Removed overtime entry of ${targetLog.hours} hr (x${targetLog.multiplier}) for ${worker.name}`);
            renderFinDetails();
        }).catch(err => {
            console.error("Error deleting overtime:", err);
            alert("Failed to delete overtime entry.");
        });
}

// ========================================================
// CUSTODY REQUEST FUNCTIONS
// ========================================================

function submitCustodyRequest() {
    const worker = getActiveWorker();
    if (!worker) {
        alert(t('msg-account-not-linked') || "Your account is not linked to any worker profile.");
        return;
    }

    const amountInput = document.getElementById('custody-req-amount');
    const reasonInput = document.getElementById('custody-req-reason');
    if (!amountInput || !reasonInput) return;

    const amountVal = parseFloat(amountInput.value);
    const reasonVal = reasonInput.value.trim();

    if (isNaN(amountVal) || amountVal <= 0 || !reasonVal) {
        alert(currentAppLang === 'ar' ? 'يرجى إدخال مبلغ صحيح وسبب.' : 'Please enter a valid amount and reason.');
        return;
    }

    const reqId = 'custreq-' + Date.now();
    const requestObj = {
        id: reqId,
        workerId: worker.id,
        workerName: worker.name,
        amount: amountVal,
        reason: reasonVal,
        status: 'pending',
        timestamp: Date.now()
    };

    db.ref(`companies/${currentCompany}/custodyRequests/${reqId}`).set(requestObj)
        .then(() => {
            amountInput.value = '';
            reasonInput.value = '';
            alert(currentAppLang === 'ar' ? 'تم تقديم طلب العهدة بنجاح وهو قيد المراجعة.' : 'Custody request submitted successfully and is pending review.');
        })
        .catch(err => {
            console.error("Error submitting custody request:", err);
            alert("Error: " + err.message);
        });
}

function acceptCustodyRequest(reqId) {
    const custodyReqs = getCompanyData().custodyRequests || {};
    const req = custodyReqs[reqId];
    if (!req) return;

    // Generate random 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    db.ref(`companies/${currentCompany}/custodyRequests/${reqId}`).update({
        status: 'accepted',
        code: code,
        handledAt: Date.now()
    }).then(() => {
        logActivity('finance', req.workerId, req.workerName, `Accepted custody request of SAR ${req.amount} for ${req.workerName}`);
    }).catch(err => console.error("Error accepting custody request:", err));
}

function rejectCustodyRequest(reqId) {
    const custodyReqs = getCompanyData().custodyRequests || {};
    const req = custodyReqs[reqId];
    if (!req) return;

    db.ref(`companies/${currentCompany}/custodyRequests/${reqId}`).update({
        status: 'rejected',
        handledAt: Date.now()
    }).then(() => {
        logActivity('finance', req.workerId, req.workerName, `Rejected custody request of SAR ${req.amount} for ${req.workerName}`);
    }).catch(err => console.error("Error rejecting custody request:", err));
}

function releaseCustodyRequest(reqId) {
    const custodyReqs = getCompanyData().custodyRequests || {};
    const req = custodyReqs[reqId];
    if (!req) return;

    const enteredCodeInput = document.getElementById(`verify-custody-code-${reqId}`);
    if (!enteredCodeInput) return;
    const enteredCode = enteredCodeInput.value.trim();

    if (enteredCode !== req.code) {
        alert(currentAppLang === 'ar' ? 'الرمز غير صحيح!' : 'Incorrect verification code!');
        return;
    }

    // Move custody request status to 'given'
    db.ref(`companies/${currentCompany}/custodyRequests/${reqId}`).update({
        status: 'given',
        givenAt: Date.now()
    }).then(() => {
        // Automatically insert a 'given' custody log entry in the worker's ledger
        const workerIndex = getCompanyData().workers.findIndex(w => w.id === req.workerId);
        if (workerIndex !== -1) {
            const worker = getCompanyData().workers[workerIndex];
            const stats = getMonthlyStats(worker, currentGlobalMonth);
            if (!stats.custodyList) stats.custodyList = [];

            stats.custodyList.unshift({
                id: 'cust-' + Date.now(),
                date: formatTimestamp(),
                amount: req.amount,
                type: 'given'
            });

            return db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/custodyList`).set(stats.custodyList);
        }
    }).then(() => {
        logActivity('finance', req.workerId, req.workerName, `Released custody of SAR ${req.amount} to ${req.workerName} via code verification`);
        alert(currentAppLang === 'ar' ? 'تم تسليم العهدة بنجاح وتحديث الرصيد!' : 'Custody released successfully and ledger updated!');
    }).catch(err => {
        console.error("Error releasing custody:", err);
        alert("Error: " + err.message);
    });
}

function renderWorkerCustodyRequests() {
    const isAr = currentAppLang === 'ar';
    const worker = getActiveWorker();
    const listDiv = document.getElementById('worker-custody-requests-list');
    if (!worker || !listDiv) return;

    const custodyReqs = getCompanyData().custodyRequests || {};
    const myReqs = Object.values(custodyReqs)
        .filter(r => r.workerId === worker.id)
        .sort((a, b) => b.timestamp - a.timestamp);

    listDiv.innerHTML = '';
    if (myReqs.length === 0) {
        listDiv.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">${isAr ? 'لا يوجد طلبات سابقة.' : 'No previous requests.'}</p>`;
        return;
    }

    myReqs.forEach(req => {
        const dateStr = new Date(req.timestamp).toLocaleString();
        let statusBadge = '';
        let codeDisplay = '';
        let editBtn = '';

        if (req.status === 'pending') {
            statusBadge = `<span class="badge" style="background:#d97706;">${isAr ? 'قيد الانتظار' : 'Pending'}</span>`;
            editBtn = `<button onclick="editCustodyRequestAmount('${req.id}')" class="btn-outline" style="padding: 2px 8px; font-size: 0.75rem; font-weight: 600; margin-left: 6px; cursor:pointer;" title="${isAr ? 'تعديل المبلغ' : 'Edit Amount'}">✏️ ${isAr ? 'تعديل' : 'Edit'}</button>`;
        } else if (req.status === 'accepted') {
            statusBadge = `<span class="badge" style="background:#16a34a;">${isAr ? 'مقبول للتسليم' : 'Approved for Release'}</span>`;
            codeDisplay = `<div style="margin-top: 5px; font-weight: 800; font-size: 1rem; color: var(--success);">${isAr ? 'الرمز السري:' : 'Verification Code:'} <span style="background:var(--input-bg); padding: 2px 6px; border-radius: 4px; border: 1px dashed var(--success);">${req.code}</span></div>`;
        } else if (req.status === 'rejected') {
            statusBadge = `<span class="badge" style="background:#dc2626;">${isAr ? 'مرفوض' : 'Rejected'}</span>`;
        } else if (req.status === 'given') {
            statusBadge = `<span class="badge" style="background:#2563eb;">${isAr ? 'تم الاستلام' : 'Given'}</span>`;
        }

        listDiv.innerHTML += `
            <div class="ledger-card" style="border-left: 4px solid #f59e0b;">
                <div class="flex-between">
                    <div>
                        <strong>SAR ${req.amount}</strong>
                        ${editBtn}
                    </div>
                    ${statusBadge}
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
                    ${isAr ? 'السبب:' : 'Reason:'} ${req.reason}<br>
                    📅 ${dateStr}
                </div>
                ${codeDisplay}
            </div>
        `;
    });
}

function renderPendingCustodyRequests() {
    const isAr = currentAppLang === 'ar';
    const listDiv = document.getElementById('pending-custody-requests-list');
    if (!listDiv) return;

    const custodyReqs = getCompanyData().custodyRequests || {};
    const pendingReqs = Object.values(custodyReqs)
        .filter(r => r.status === 'pending')
        .sort((a, b) => b.timestamp - a.timestamp);

    listDiv.innerHTML = '';
    if (pendingReqs.length === 0) {
        listDiv.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:12px;">${isAr ? 'لا توجد طلبات معلقة.' : 'No pending requests.'}</p>`;
        return;
    }

    pendingReqs.forEach(req => {
        const dateStr = new Date(req.timestamp).toLocaleString();
        listDiv.innerHTML += `
            <div class="ledger-card" style="border-left:4px solid #f59e0b;">
                <div class="flex-between" style="align-items:start;">
                    <div>
                        <strong style="font-size:1.05rem; color:var(--text-main);">${req.workerName}</strong><br>
                        <span style="font-size:0.8rem; color:var(--text-muted);">${isAr ? 'السبب:' : 'Reason:'} ${req.reason}</span>
                    </div>
                    <strong style="color:#f59e0b; font-size:1.1rem;">SAR ${req.amount}</strong>
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:8px;">📅 ${dateStr}</div>
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
                    <button onclick="rejectCustodyRequest('${req.id}')" class="btn-outline-danger" style="padding:6px 12px; font-size:0.75rem;">${isAr ? 'رفض' : 'Reject'}</button>
                    <button onclick="acceptCustodyRequest('${req.id}')" class="btn-success" style="padding:6px 12px; font-size:0.75rem; background:#16a34a; border-color:#16a34a;">${isAr ? 'قبول' : 'Accept'}</button>
                </div>
            </div>
        `;
    });
}

function renderAcceptedCustodyReleases() {
    const isAr = currentAppLang === 'ar';
    const listDiv = document.getElementById('accepted-custodies-list');
    if (!listDiv) return;

    const custodyReqs = getCompanyData().custodyRequests || {};
    const acceptedReqs = Object.values(custodyReqs)
        .filter(r => r.status === 'accepted')
        .sort((a, b) => b.timestamp - a.timestamp);

    listDiv.innerHTML = '';
    if (acceptedReqs.length === 0) {
        listDiv.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:12px;">${isAr ? 'لا توجد طلبات جاهزة للتسليم.' : 'No custody releases pending verification.'}</p>`;
        return;
    }

    acceptedReqs.forEach(req => {
        listDiv.innerHTML += `
            <div class="ledger-card" style="border-left: 4px solid var(--success);">
                <div class="flex-between">
                    <div>
                        <strong>${req.workerName}</strong><br>
                        <span style="font-size:0.85rem; color:var(--text-muted);">${req.reason}</span>
                    </div>
                    <strong style="color:var(--success); font-size:1.1rem;">SAR ${req.amount}</strong>
                </div>
                <div style="display:flex; align-items:center; gap:8px; margin-top:12px; flex-wrap:wrap;">
                    <input type="text" id="verify-custody-code-${req.id}" placeholder="${isAr ? 'رمز التحقق المكون من 6 أرقام' : '6-digit verification code'}" style="padding:8px; font-size:0.85rem; flex:1; min-width:180px; height:34px; background:var(--input-bg); border:1px solid var(--border-color); border-radius:4px; color:var(--text-main);" />
                    <button onclick="releaseCustodyRequest('${req.id}')" class="btn-success" style="padding:0 12px; height:34px; font-size:0.8rem; font-weight:700; background:#16a34a; border-color:#16a34a;">${isAr ? 'تم تسليم العهدة' : 'Release Custody'}</button>
                </div>
            </div>
        `;
    });
}

function editPaymentRequestAmount(reqId) {
    const isAr = currentAppLang === 'ar';
    const pRequests = getCompanyData().paymentRequests || {};
    const req = pRequests[reqId];
    if (!req) return;

    const worker = getActiveWorker();
    if (!worker || req.workerId !== worker.id) {
        alert(isAr ? 'لا يمكنك تعديل هذا الطلب.' : 'You cannot edit this request.');
        return;
    }

    if (req.status !== 'pending') {
        alert(isAr ? 'لا يمكن تعديل الطلب بعد قبوله أو معالجته من قبل الإدارة.' : 'Cannot edit request once it has been processed by management.');
        return;
    }

    const newAmtStr = prompt(isAr ? 'أدخل المبلغ الجديد المطلوب (ريال):' : 'Enter new requested amount (SAR):', req.amount);
    if (newAmtStr === null) return;

    const newAmt = parseFloat(newAmtStr);
    if (isNaN(newAmt) || newAmt <= 0) {
        alert(isAr ? 'يرجى إدخال مبلغ صحيح أكبر من الصفر.' : 'Please enter a valid amount greater than 0.');
        return;
    }

    db.ref(`companies/${currentCompany}/paymentRequests/${reqId}`).update({
        amount: newAmt,
        requestedAmount: newAmt,
        updatedAt: Date.now()
    }).then(() => {
        if (typeof logActivity === 'function') {
            logActivity('sales', worker.id, worker.name, `Updated payment request amount to SAR ${newAmt}`);
        }
        renderPaymentRequests();
    }).catch(err => {
        console.error("Error editing payment request amount:", err);
        alert(isAr ? 'حدث خطأ أثناء تعديل المبلغ.' : 'Error updating requested amount.');
    });
}

function editCustodyRequestAmount(reqId) {
    const isAr = currentAppLang === 'ar';
    const custodyReqs = getCompanyData().custodyRequests || {};
    const req = custodyReqs[reqId];
    if (!req) return;

    const worker = getActiveWorker();
    if (!worker || req.workerId !== worker.id) {
        alert(isAr ? 'لا يمكنك تعديل هذا الطلب.' : 'You cannot edit this request.');
        return;
    }

    if (req.status !== 'pending') {
        alert(isAr ? 'لا يمكن تعديل الطلب بعد قبوله أو معالجته من قبل الإدارة.' : 'Cannot edit request once it has been processed by management.');
        return;
    }

    const newAmtStr = prompt(isAr ? 'أدخل المبلغ الجديد لطلب العهدة (ريال):' : 'Enter new requested custody amount (SAR):', req.amount);
    if (newAmtStr === null) return;

    const newAmt = parseFloat(newAmtStr);
    if (isNaN(newAmt) || newAmt <= 0) {
        alert(isAr ? 'يرجى إدخال مبلغ صحيح أكبر من الصفر.' : 'Please enter a valid amount greater than 0.');
        return;
    }

    db.ref(`companies/${currentCompany}/custodyRequests/${reqId}`).update({
        amount: newAmt,
        updatedAt: Date.now()
    }).then(() => {
        if (typeof logActivity === 'function') {
            logActivity('finance', worker.id, worker.name, `Updated custody request amount to SAR ${newAmt}`);
        }
        renderWorkerCustodyRequests();
        renderPendingCustodyRequests();
    }).catch(err => {
        console.error("Error editing custody request amount:", err);
        alert(isAr ? 'حدث خطأ أثناء تعديل المبلغ.' : 'Error updating requested custody amount.');
    });
}

// ========================================================
// EXIT REQUEST WORKFLOW FUNCTIONS
// ========================================================

function submitExitRequest() {
    const worker = getActiveWorker();
    if (!worker) {
        alert(t('msg-account-not-linked') || "Your account is not linked to any worker profile.");
        return;
    }

    const timeInput = document.getElementById('attendance-exit-time');
    const reasonInput = document.getElementById('attendance-exit-reason');
    if (!timeInput || !reasonInput) return;

    const timeVal = timeInput.value;
    const reasonVal = reasonInput.value.trim();

    if (!timeVal || !reasonVal) {
        alert(currentAppLang === 'ar' ? 'يرجى تحديد وقت الخروج والسبب.' : 'Please select exit time and enter a reason.');
        return;
    }

    const datePicker = document.getElementById('attendance-date-picker');
    const dateStr = datePicker ? datePicker.value : '';
    if (!dateStr) {
        alert("Please select a date first.");
        return;
    }

    const exitRequestObj = {
        time: timeVal,
        reason: reasonVal,
        status: 'pending',
        timestamp: Date.now()
    };

    db.ref(`companies/${currentCompany}/attendance/${dateStr}/${worker.id}/exitRequest`).set(exitRequestObj)
        .then(() => {
            timeInput.value = '';
            reasonInput.value = '';
            alert(currentAppLang === 'ar' ? 'تم تقديم طلب الخروج بنجاح.' : 'Exit request submitted successfully.');
        })
        .catch(err => {
            console.error("Error submitting exit request:", err);
            alert("Error: " + err.message);
        });
}

function handleExitRequest(workerId, action) {
    const datePicker = document.getElementById('attendance-date-picker');
    const dateStr = datePicker ? datePicker.value : '';
    if (!dateStr) return;

    const worker = getCompanyData().workers.find(w => w.id === workerId);
    const wName = worker ? worker.name : 'Worker';

    const exitRef = db.ref(`companies/${currentCompany}/attendance/${dateStr}/${workerId}/exitRequest`);

    if (action === 'approve') {
        exitRef.update({
            status: 'approved',
            approvedAt: Date.now()
        }).then(() => {
            logActivity('attendance', workerId, wName, `Approved exit request for ${wName} on ${dateStr}`);
        }).catch(err => console.error("Error approving exit request:", err));
    } else if (action === 'reject') {
        exitRef.update({
            status: 'rejected',
            rejectedAt: Date.now()
        }).then(() => {
            logActivity('attendance', workerId, wName, `Rejected exit request for ${wName} on ${dateStr}`);
        }).catch(err => console.error("Error rejecting exit request:", err));
    } else if (action === 'returned') {
        exitRef.update({
            status: 'returned',
            returnedAt: Date.now()
        }).then(() => {
            logActivity('attendance', workerId, wName, `${wName} returned to work area on ${dateStr}`);
        }).catch(err => console.error("Error logging worker return:", err));
    }
}

// ========================================================
// ATTENDANCE OVERTIME RELOCATION FUNCTIONS
// ========================================================

function renderAttendanceOvertimeDetails() {
    const isAr = currentAppLang === 'ar';
    const workerId = document.getElementById('attendance-overtime-worker-select').value;
    const detailsArea = document.getElementById('attendance-overtime-details-area');
    if (!detailsArea) return;

    if (!workerId) {
        detailsArea.style.display = 'none';
        return;
    }
    detailsArea.style.display = 'block';

    const worker = getCompanyData().workers.find(w => w.id === workerId);
    if (!worker) return;

    const baseIncome = parseFloat(worker.income) || 0;
    const duration = getShiftDurationHours(worker.startTime, worker.endTime);

    const durationEl = document.getElementById('att-ov-shift-duration');
    const hourlyRateEl = document.getElementById('att-ov-hourly-rate');

    const hourlyRate = baseIncome / (30 * duration);

    if (durationEl) durationEl.textContent = `${duration.toFixed(1)} hrs`;
    if (hourlyRateEl) {
        if (isNaN(hourlyRate) || !isFinite(hourlyRate)) {
            hourlyRateEl.textContent = `SAR 0.00/hr`;
        } else {
            hourlyRateEl.textContent = `SAR ${hourlyRate.toFixed(2)}/hr`;
        }
    }

    // Render Overtime logs inside attendance
    const stats = getMonthlyStats(worker, currentGlobalMonth);
    const ovHistory = document.getElementById('att-worker-overtime-history');
    if (ovHistory) {
        ovHistory.innerHTML = '';
        const list = stats.overtimeList || [];
        if (list.length === 0) {
            ovHistory.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">No overtime logs for this month.</p>`;
        } else {
            list.forEach(log => {
                const logCard = document.createElement('div');
                logCard.className = 'ledger-card flex-between';
                logCard.innerHTML = `
                    <div>
                        <strong>+ ${log.hours} hrs (x${log.multiplier})</strong>
                        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                            Rate: SAR ${log.rate}/hr • Earned: SAR ${log.amount}<br>
                            📅 ${log.date}
                        </div>
                    </div>
                    <button onclick="deleteOvertimeHourFromAtt('${worker.id}', '${log.id}')" class="btn-outline-danger" style="padding: 4px 10px; font-size: 0.75rem;">${isAr ? 'تراجع' : 'Undo'}</button>
                `;
                ovHistory.appendChild(logCard);
            });
        }
    }
}

function addOvertimeHourFromAtt() {
    const workerId = document.getElementById('attendance-overtime-worker-select').value;
    if (!workerId) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;

    const worker = getCompanyData().workers[workerIndex];
    const baseIncome = parseFloat(worker.income) || 0;
    const duration = getShiftDurationHours(worker.startTime, worker.endTime);
    const hourlyRate = baseIncome / (30 * duration);

    const hours = parseFloat(document.getElementById('att-ov-hours').value) || 1.0;
    const mult = parseFloat(document.getElementById('att-ov-multiplier').value) || 1.0;
    const finalAmount = Math.round(hours * hourlyRate * mult * 100) / 100;

    const stats = getMonthlyStats(worker, currentGlobalMonth);
    if (!stats.overtimeList) stats.overtimeList = [];

    const newLog = {
        id: Date.now().toString(),
        date: formatTimestamp(),
        hours: hours,
        rate: Math.round(hourlyRate * 100) / 100,
        multiplier: mult,
        amount: finalAmount
    };

    stats.overtimeList.unshift(newLog);

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/overtimeList`).set(stats.overtimeList)
        .then(() => {
            logActivity('attendance', worker.id, worker.name, `Logged ${hours} hr(s) overtime (x${mult}) for ${worker.name} (SAR ${finalAmount})`);
            renderAttendanceOvertimeDetails();
        }).catch(err => {
            console.error("Error adding overtime:", err);
            alert("Failed to add overtime.");
        });
}

function deleteOvertimeHourFromAtt(workerId, logId) {
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;

    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);
    if (!stats.overtimeList) return;

    const targetLog = stats.overtimeList.find(o => o.id === logId);
    if (!targetLog) return;

    stats.overtimeList = stats.overtimeList.filter(o => o.id !== logId);

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/overtimeList`).set(stats.overtimeList)
        .then(() => {
            logActivity('attendance', worker.id, worker.name, `Removed overtime entry of ${targetLog.hours} hr (x${targetLog.multiplier}) for ${worker.name}`);
            renderAttendanceOvertimeDetails();
        }).catch(err => {
            console.error("Error deleting overtime:", err);
            alert("Failed to delete overtime entry.");
        });
}

// ========================================================
// TIERED LATE PENALTY RULES FUNCTIONS
// ========================================================

function addLateRule() {
    const minsInput = document.getElementById('late-rule-mins');
    const penaltyInput = document.getElementById('late-rule-penalty');
    if (!minsInput || !penaltyInput) return;

    const mins = parseInt(minsInput.value);
    const penalty = parseFloat(penaltyInput.value);

    if (isNaN(mins) || mins <= 0 || isNaN(penalty) || penalty < 0) {
        alert("Please enter valid minutes and penalty.");
        return;
    }

    const companyData = getCompanyData();
    const rules = companyData.lateRules || [];

    // Add rule and sort ascending by minutes
    rules.push({ mins, penalty });
    rules.sort((a, b) => a.mins - b.mins);

    db.ref(`companies/${currentCompany}/lateRules`).set(rules)
        .then(() => {
            minsInput.value = '';
            penaltyInput.value = '';
            renderAttendance();
        })
        .catch(err => console.error("Error adding late rule:", err));
}

function deleteLateRule(idx) {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    const companyData = getCompanyData();
    const rules = companyData.lateRules || [];
    rules.splice(idx, 1);

    db.ref(`companies/${currentCompany}/lateRules`).set(rules)
        .then(() => {
            renderAttendance();
        })
        .catch(err => console.error("Error deleting late rule:", err));
}

function renderLateRules() {
    const isAr = currentAppLang === 'ar';
    const tbody = document.getElementById('late-rules-table-body');
    if (!tbody) return;

    const companyData = getCompanyData();
    const rules = companyData.lateRules || [];

    tbody.innerHTML = '';
    if (rules.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:12px;">${isAr ? 'لا توجد قوانين مدخلة. سيتم تطبيق القانون الافتراضي.' : 'No tiered rules defined. Default or no penalties will apply.'}</td></tr>`;
        return;
    }

    rules.forEach((rule, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600; font-size: 0.9rem; padding: 10px;">
                ${rule.mins} ${isAr ? 'دقائق تأخير' : 'mins late'}
            </td>
            <td style="font-weight: 700; color: var(--danger); font-size: 0.9rem; padding: 10px;">
                SAR ${parseFloat(rule.penalty).toFixed(2)}
            </td>
            <td style="text-align: center; padding: 10px;">
                <button onclick="deleteLateRule(${idx})" class="btn-outline-danger" style="padding: 4px 8px; font-size: 0.75rem;">${isAr ? 'حذف' : 'Delete'}</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function markWorkerSelfAttendance() {
    const worker = getActiveWorker();
    if (!worker) {
        alert(t('msg-account-not-linked') || "Your account is not linked to any worker profile.");
        return;
    }

    const datePicker = document.getElementById('attendance-date-picker');
    const dateStr = datePicker ? datePicker.value : '';
    if (!dateStr) return;

    // Get today's local date YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (dateStr !== todayStr) {
        alert(currentAppLang === 'ar' ? 'يمكنك تسجيل حضورك لليوم الحالي فقط ولا يمكنك تعديل الأيام السابقة!' : 'You can only check in for today\'s date and cannot edit past attendance!');
        return;
    }

    const attendanceMap = (getCompanyData().attendance || {})[todayStr] || {};
    const existingAtt = attendanceMap[worker.id];
    if (existingAtt && existingAtt.status === 'present') {
        alert(currentAppLang === 'ar' ? 'لقد قمت بتسجيل حضورك بالفعل اليوم!' : 'You have already checked in for today!');
        return;
    }

    // Time is current local time
    const hh = String(today.getHours()).padStart(2, '0');
    const mins = String(today.getMinutes()).padStart(2, '0');
    const checkTime = `${hh}:${mins}`;

    let shiftStart = worker.startTime;
    const dateParts = dateStr.split('-');
    const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekName = dayNames[dateObj.getDay()];
    const dateOverrideShift = (worker.shifts || []).find(s => s.dayOfWeek === dayOfWeekName || s.specificDate === dateStr);
    if (dateOverrideShift) {
        shiftStart = dateOverrideShift.startTime;
    }
    const lateness = calculateLateness(shiftStart, checkTime);

    db.ref(`companies/${currentCompany}/attendance/${dateStr}/${worker.id}`).set({
        status: 'present',
        time: checkTime,
        lateness: lateness || '',
        timestamp: Date.now()
    })
        .then(() => {
            logActivity('attendance', worker.id, worker.name, `Worker Self Checked-In as PRESENT on ${dateStr} at ${checkTime} (Lateness: ${lateness || 'None'})`);
            alert(currentAppLang === 'ar' ? 'تم تسجيل حضورك بنجاح!' : 'You have checked in successfully!');
            renderAll();
        })
        .catch(err => {
            console.error("Error during self check-in:", err);
            alert("Error: " + err.message);
        });
}

function renderTaskGroups() {
    const container = document.getElementById('groups-list-container');
    if (!container) return;
    container.innerHTML = '';

    const companyData = getCompanyData();
    const groups = companyData.taskGroups || [];
    const workers = companyData.workers || [];
    const isAr = currentAppLang === 'ar';

    if (groups.length === 0) {
        container.innerHTML = `<div style="text-align:center; font-size:0.85rem; color:var(--text-muted); padding:10px;">${isAr ? 'لا توجد مجموعات مضافة.' : 'No groups created yet.'}</div>`;
        return;
    }

    groups.forEach((group, idx) => {
        // Find current members of this group
        const groupMembers = (group.members || []).map(mId => workers.find(w => w.id === mId)).filter(Boolean);

        let membersHtml = '';
        if (groupMembers.length === 0) {
            membersHtml = `<div style="font-size:0.75rem; color:var(--text-muted); padding: 4px 0;">${isAr ? 'لا يوجد أعضاء' : 'No members'}</div>`;
        } else {
            groupMembers.forEach(m => {
                membersHtml += `
                    <div class="flex-between" style="font-size:0.8rem; background:var(--input-bg); padding:4px 8px; border-radius:4px; margin-bottom:4px; border:1px solid var(--border-color);">
                        <span>👤 ${m.name}</span>
                        <button onclick="removeMemberFromGroup('${group.id}', '${m.id}')" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:0.85rem; padding:0 2px;">❌</button>
                    </div>
                `;
            });
        }

        // Options for workers NOT in this group
        const nonMembers = workers.filter(w => !(group.members || []).includes(w.id));
        let selectOptions = `<option value="">${isAr ? '-- إضافة عضو --' : '-- Add Member --'}</option>`;
        nonMembers.forEach(w => {
            selectOptions += `<option value="${w.id}">${w.name}</option>`;
        });

        const selectId = `add-member-select-${group.id}`;

        const groupDiv = document.createElement('div');
        groupDiv.style.border = '1px solid var(--border-color)';
        groupDiv.style.borderRadius = '8px';
        groupDiv.style.padding = '12px';
        groupDiv.style.background = 'var(--input-bg)';
        groupDiv.innerHTML = `
            <div class="flex-between" style="border-bottom:1px solid var(--border-color); padding-bottom:6px; margin-bottom:8px;">
                <strong style="color:var(--text-main); font-size:0.9rem;">👥 ${group.name}</strong>
                <button onclick="deleteTaskGroup('${group.id}')" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:1.1rem; padding:0 4px;" title="Delete Group">🗑️</button>
            </div>
            <div style="margin-bottom:8px; max-height:120px; overflow-y:auto; padding-right:2px;">
                ${membersHtml}
            </div>
            ${nonMembers.length > 0 ? `
            <div class="flex-between" style="gap:6px; margin-top:8px;">
                <select id="${selectId}" style="flex:1; padding:4px; font-size:0.8rem; background:var(--card-bg); border-color:var(--border-color); color:var(--text-main); border-radius:4px;">
                    ${selectOptions}
                </select>
                <button onclick="addMemberToGroup('${group.id}', '${selectId}')" class="btn-success" style="padding:4px 8px; font-size:0.8rem; min-height:unset; height:auto;">＋</button>
            </div>
            ` : ''}
        `;
        container.appendChild(groupDiv);
    });
}

function createTaskGroup() {
    const input = document.getElementById('new-group-name-input');
    if (!input) return;
    const name = input.value.trim();
    if (!name) return;

    const companyData = getCompanyData();
    const groups = companyData.taskGroups || [];

    // Check if group already exists
    if (groups.some(g => g.name.toLowerCase() === name.toLowerCase())) {
        alert(currentAppLang === 'ar' ? 'هذه المجموعة موجودة بالفعل!' : 'Group already exists!');
        return;
    }

    const newGroup = {
        id: 'g-' + Date.now().toString(),
        name: name,
        members: []
    };

    groups.push(newGroup);

    db.ref(`companies/${currentCompany}/taskGroups`).set(groups)
        .then(() => {
            input.value = '';
            renderAll();
        })
        .catch(err => console.error("Error creating group:", err));
}

function deleteTaskGroup(groupId) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذه المجموعة؟' : 'Are you sure you want to delete this group?')) return;

    const companyData = getCompanyData();
    const groups = companyData.taskGroups || [];
    const filtered = groups.filter(g => g.id !== groupId);

    db.ref(`companies/${currentCompany}/taskGroups`).set(filtered)
        .then(() => renderAll())
        .catch(err => console.error("Error deleting group:", err));
}

function addMemberToGroup(groupId, selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const workerId = select.value;
    if (!workerId) return alert("Please select a worker first.");

    const companyData = getCompanyData();
    const groups = companyData.taskGroups || [];
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    if (!group.members) group.members = [];
    if (!group.members.includes(workerId)) {
        group.members.push(workerId);
    }

    db.ref(`companies/${currentCompany}/taskGroups`).set(groups)
        .then(() => renderAll())
        .catch(err => console.error("Error adding member:", err));
}

function removeMemberFromGroup(groupId, workerId) {
    const companyData = getCompanyData();
    const groups = companyData.taskGroups || [];
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    if (group.members) {
        group.members = group.members.filter(id => id !== workerId);
    }

    db.ref(`companies/${currentCompany}/taskGroups`).set(groups)
        .then(() => renderAll())
        .catch(err => console.error("Error removing member:", err));
}

window.getShiftDurationHours = getShiftDurationHours;
window.saveWorkerProfileChanges = saveWorkerProfileChanges;
window.addNewWorkerShift = addNewWorkerShift;
window.activateWorkerShift = activateWorkerShift;
window.deleteWorkerShift = deleteWorkerShift;
window.addOvertimeHour = addOvertimeHour;
window.deleteOvertimeHour = deleteOvertimeHour;
window.deleteOvertimeHourFromFin = deleteOvertimeHourFromFin;
window.submitCustodyRequest = submitCustodyRequest;
window.acceptCustodyRequest = acceptCustodyRequest;
window.rejectCustodyRequest = rejectCustodyRequest;
window.releaseCustodyRequest = releaseCustodyRequest;
window.renderWorkerCustodyRequests = renderWorkerCustodyRequests;
window.renderPendingCustodyRequests = renderPendingCustodyRequests;
window.renderAcceptedCustodyReleases = renderAcceptedCustodyReleases;
window.submitExitRequest = submitExitRequest;
window.handleExitRequest = handleExitRequest;
window.renderAttendanceOvertimeDetails = renderAttendanceOvertimeDetails;
window.addOvertimeHourFromAtt = addOvertimeHourFromAtt;
window.deleteOvertimeHourFromAtt = deleteOvertimeHourFromAtt;
window.addLateRule = addLateRule;
window.deleteLateRule = deleteLateRule;
window.renderLateRules = renderLateRules;
window.markWorkerSelfAttendance = markWorkerSelfAttendance;
window.createTaskGroup = createTaskGroup;
window.deleteTaskGroup = deleteTaskGroup;
window.addMemberToGroup = addMemberToGroup;
window.removeMemberFromGroup = removeMemberFromGroup;
window.renderTaskGroups = renderTaskGroups;

// Spend Order System

// Form Toggling for Sales Section
function switchSalesForm(formId) {
    const containers = ['new-sale', 'past-sale', 'deposit', 'spend'];
    containers.forEach(id => {
        const el = document.getElementById(`form-${id}-container`);
        if (el) el.style.display = 'none';

        const btn = document.getElementById(`btn-sales-tab-${id}`);
        if (btn) {
            btn.classList.remove('active');
        }
    });

    const activeEl = document.getElementById(`form-${formId}-container`);
    if (activeEl) activeEl.style.display = 'block';

    const activeBtn = document.getElementById(`btn-sales-tab-${formId}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}
window.switchSalesForm = switchSalesForm;
window.editPaymentRequestAmount = editPaymentRequestAmount;
window.editCustodyRequestAmount = editCustodyRequestAmount;

// =========================================================================
// CUSTOM DEPARTMENT TAB BUTTON DRAG & DROP REORDERING ENGINE
// =========================================================================
let draggedTabElement = null;

function toggleTabReorderMode() {
    const isAr = currentAppLang === 'ar';
    const isEditing = document.body.classList.toggle('tabs-reorder-mode');
    const btn = document.getElementById('tab-reorder-btn');
    const container = document.getElementById('department-tabs-container');
    if (!container) return;

    const tabs = container.querySelectorAll('.dept-tab');

    if (isEditing) {
        if (btn) btn.innerHTML = `💾 ${isAr ? 'حفظ الترتيب' : 'Save Tab Order'}`;
        // Enable dragging on tabs
        tabs.forEach(tab => {
            tab.setAttribute('draggable', 'true');
            initTabDragEvents(tab, container);
        });
    } else {
        if (btn) btn.innerHTML = `✏️ ${isAr ? 'تعديل التبويبات' : 'Reorder Tabs'}`;
        // Disable dragging on tabs
        tabs.forEach(tab => {
            tab.removeAttribute('draggable');
            tab.classList.remove('is-dragging', 'drag-over');
        });
        saveUserTabOrder();
        alert(isAr ? 'تم حفظ ترتيب التبويبات بنجاح!' : 'Department tab order saved successfully!');
    }
}
window.toggleTabReorderMode = toggleTabReorderMode;

function initTabDragEvents(tab, container) {
    if (tab.dataset.dragInitialized) return;
    tab.dataset.dragInitialized = 'true';

    // --- MOUSE DRAG EVENTS ---
    tab.addEventListener('dragstart', (e) => {
        if (!document.body.classList.contains('tabs-reorder-mode')) return;
        draggedTabElement = tab;
        tab.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', tab.id);
    });

    tab.addEventListener('dragend', () => {
        tab.classList.remove('is-dragging');
        const allTabs = container.querySelectorAll('.dept-tab');
        allTabs.forEach(t => t.classList.remove('drag-over'));
        draggedTabElement = null;
        saveUserTabOrder();
    });

    tab.addEventListener('dragover', (e) => {
        if (!document.body.classList.contains('tabs-reorder-mode')) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedTabElement && draggedTabElement !== tab) {
            tab.classList.add('drag-over');
            const targetBounding = tab.getBoundingClientRect();
            const mouseX = e.clientX;
            const targetCenter = targetBounding.left + (targetBounding.width / 2);
            if (mouseX < targetCenter) {
                container.insertBefore(draggedTabElement, tab);
            } else {
                container.insertBefore(draggedTabElement, tab.nextElementSibling);
            }
        }
    });

    tab.addEventListener('dragleave', () => {
        tab.classList.remove('drag-over');
    });

    tab.addEventListener('drop', (e) => {
        if (!document.body.classList.contains('tabs-reorder-mode')) return;
        e.preventDefault();
        tab.classList.remove('drag-over');
        saveUserTabOrder();
    });

    // --- TOUCH / MOBILE DRAG & HOLD EVENTS ---
    let touchTimer = null;
    let isTouchDragging = false;

    tab.addEventListener('touchstart', (e) => {
        if (!document.body.classList.contains('tabs-reorder-mode')) return;
        touchTimer = setTimeout(() => {
            isTouchDragging = true;
            draggedTabElement = tab;
            tab.classList.add('is-dragging');
            if (navigator.vibrate) navigator.vibrate(50);
        }, 200);
    }, { passive: true });

    tab.addEventListener('touchmove', (e) => {
        if (!document.body.classList.contains('tabs-reorder-mode') || !isTouchDragging) {
            clearTimeout(touchTimer);
            return;
        }
        e.preventDefault();
        const touch = e.touches[0];
        const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
        if (targetEl) {
            const closestTab = targetEl.closest('.dept-tab');
            if (closestTab && closestTab !== draggedTabElement && closestTab.parentNode === container) {
                const targetBounding = closestTab.getBoundingClientRect();
                const touchX = touch.clientX;
                const targetCenter = targetBounding.left + (targetBounding.width / 2);
                if (touchX < targetCenter) {
                    container.insertBefore(draggedTabElement, closestTab);
                } else {
                    container.insertBefore(draggedTabElement, closestTab.nextElementSibling);
                }
            }
        }
    }, { passive: false });

    tab.addEventListener('touchend', () => {
        clearTimeout(touchTimer);
        if (isTouchDragging) {
            isTouchDragging = false;
            if (draggedTabElement) {
                draggedTabElement.classList.remove('is-dragging');
            }
            draggedTabElement = null;
            saveUserTabOrder();
        }
    });
}

function saveUserTabOrder() {
    if (!currentUser || !currentUser.email) return;
    const container = document.getElementById('department-tabs-container');
    if (!container) return;

    const tabIds = Array.from(container.children)
        .filter(el => el.classList && el.classList.contains('dept-tab'))
        .map(el => el.id);

    const emailKey = currentUser.email.toLowerCase();
    const storageKey = `user_tab_order_${emailKey}_${currentCompany}`;
    try {
        localStorage.setItem(storageKey, JSON.stringify(tabIds));
    } catch (e) { console.error(e); }

    if (db && currentCompany && emailKey) {
        const userKey = emailKey.replace(/\./g, ',');
        db.ref(`companies/${currentCompany}/userTabOrders/${userKey}`).set(tabIds)
            .catch(err => console.error("Error syncing tab order:", err));
    }
}
window.saveUserTabOrder = saveUserTabOrder;

function applyUserTabOrder() {
    if (!currentUser || !currentUser.email) return;
    const container = document.getElementById('department-tabs-container');
    if (!container) return;

    const emailKey = currentUser.email.toLowerCase();
    const storageKey = `user_tab_order_${emailKey}_${currentCompany}`;
    let tabIds = null;
    try {
        const stored = localStorage.getItem(storageKey);
        if (stored) tabIds = JSON.parse(stored);
    } catch (e) { console.error(e); }

    if (!tabIds && db && currentCompany) {
        const userKey = emailKey.replace(/\./g, ',');
        db.ref(`companies/${currentCompany}/userTabOrders/${userKey}`).once('value')
            .then(snapshot => {
                const val = snapshot.val();
                if (val && Array.isArray(val)) {
                    try { localStorage.setItem(storageKey, JSON.stringify(val)); } catch (e) { }
                    reorderTabContainer(container, val);
                }
            }).catch(e => console.error(e));
        return;
    }

    if (tabIds && Array.isArray(tabIds)) {
        reorderTabContainer(container, tabIds);
    }
}

function reorderTabContainer(container, tabIds) {
    tabIds.forEach(id => {
        const tabEl = document.getElementById(id);
        if (tabEl && tabEl.parentNode === container) {
            container.appendChild(tabEl);
        }
    });
}
// =========================================================================
// WORKER RECEIVED PAYMENT HISTORY LOG ENGINE
// =========================================================================
function showWorkerPaymentHistory(identifier) {
    if (!identifier) return;
    const isAr = currentAppLang === 'ar';
    const companyData = getCompanyData();
    const allRequests = companyData.paymentRequests || {};
    const reqList = Object.values(allRequests);

    // Filter for this worker's requests where money was received (status given or get_paid)
    const workerGivenReqs = reqList.filter(r => {
        const matchesWorker = (r.workerEmail && r.workerEmail.toLowerCase() === identifier.toLowerCase()) ||
            (r.workerName && r.workerName.toLowerCase() === identifier.toLowerCase());
        const isReceived = r.status === 'given' || r.status === 'get_paid';
        return matchesWorker && isReceived;
    }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Determine worker name for header
    let displayWorkerName = identifier;
    const matchedReq = reqList.find(r => (r.workerEmail && r.workerEmail.toLowerCase() === identifier.toLowerCase()) || (r.workerName && r.workerName.toLowerCase() === identifier.toLowerCase()));
    if (matchedReq && matchedReq.workerName) {
        displayWorkerName = matchedReq.workerName;
    }

    const modalTitle = document.getElementById('payment-log-modal-title');
    if (modalTitle) {
        modalTitle.textContent = `${displayWorkerName} - ${isAr ? 'سجل الأموال المستلمة سابقاً' : 'Received Payment History'}`;
    }

    const summaryBox = document.getElementById('payment-log-summary-box');
    const historyList = document.getElementById('payment-log-history-list');

    if (!summaryBox || !historyList) return;

    if (workerGivenReqs.length === 0) {
        summaryBox.innerHTML = `
            <div style="text-align:center; padding:12px; color:var(--text-muted); font-size:0.9rem;">
                ⚠️ ${isAr ? 'لم يستلم هذا الموظف أي مبالغ أو سلف سابقة بعد.' : 'This worker has not received any past payment requests yet.'}
            </div>
        `;
        historyList.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.85rem;">${isAr ? 'لا توجد سجلات مستلمة سابقة.' : 'No received records found.'}</p>`;
    } else {
        const lastReq = workerGivenReqs[0];
        const lastDateStr = lastReq.timestamp ? new Date(lastReq.timestamp).toLocaleString() : (lastReq.date || 'N/A');
        const totalAmount = workerGivenReqs.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

        summaryBox.innerHTML = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; text-align:center;">
                <div style="background:var(--card-bg); padding:12px; border-radius:10px; border:1px solid var(--border-color);">
                    <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;" data-i18n="label-last-received">⏰ ${isAr ? 'آخر دفعة مستلمة:' : 'Last Received Payment:'}</div>
                    <div style="font-size:1.1rem; font-weight:800; color:var(--success); margin-top:4px;">SAR ${lastReq.amount}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">🕒 ${lastDateStr}</div>
                </div>
                <div style="background:var(--card-bg); padding:12px; border-radius:10px; border:1px solid var(--border-color);">
                    <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;" data-i18n="label-total-received">💰 ${isAr ? 'إجمالي المبالغ المستلمة:' : 'Total Received Amount:'}</div>
                    <div style="font-size:1.1rem; font-weight:800; color:var(--primary); margin-top:4px;">SAR ${totalAmount.toFixed(2)}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">📊 ${workerGivenReqs.length} ${isAr ? 'دفعة مستلمة' : 'payments'}</div>
                </div>
            </div>
        `;

        historyList.innerHTML = '';
        workerGivenReqs.forEach(req => {
            const reqDateStr = req.timestamp ? new Date(req.timestamp).toLocaleString() : (req.date || 'N/A');
            historyList.innerHTML += `
                <div class="ledger-card" style="border-left:4px solid var(--success); padding:12px 16px; margin-bottom:0; background:var(--card-bg);">
                    <div class="flex-between">
                        <div>
                            <strong style="font-size:1.05rem; color:var(--text-main);">SAR ${req.amount}</strong>
                            <span class="badge" style="background:#16a34a; color:#fff; font-size:0.75rem; font-weight:700; margin-left:8px; padding:2px 8px; border-radius:4px;">✅ ${isAr ? 'تم الاستلام' : 'Received'}</span>
                        </div>
                        <span style="font-size:0.75rem; color:var(--text-muted);">🕒 ${reqDateStr}</span>
                    </div>
                    <div style="font-size:0.85rem; margin-top:6px; color:var(--text-main);">${isAr ? 'السبب:' : 'Reason:'} <em>${req.reason || '-'}</em></div>
                    ${req.adminNote ? `<div style="font-size:0.8rem; margin-top:4px; color:var(--secondary);">💬 ${req.adminNote}</div>` : ''}
                </div>
            `;
        });
    }

    const modal = document.getElementById('worker-payment-log-modal');
    if (modal) modal.style.display = 'flex';
}
window.showWorkerPaymentHistory = showWorkerPaymentHistory;

function closeWorkerPaymentLogModal() {
    const modal = document.getElementById('worker-payment-log-modal');
    if (modal) modal.style.display = 'none';
}
window.closeWorkerPaymentLogModal = closeWorkerPaymentLogModal;

// =========================================================================
// CONVERT PRIVATE NOTE TO TASK FUNCTION
// =========================================================================
function convertNoteToTask(rawText) {
    if (!rawText) return;
    const text = decodeURIComponent(rawText);
    const isAr = currentAppLang === 'ar';

    // Switch to tasks tab
    switchTab('tasks');

    // Pre-fill task assign input field
    setTimeout(() => {
        const input = document.getElementById('task-assign-input');
        if (input) {
            input.value = text;
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            input.focus();
        }
        const select = document.getElementById('task-worker-select');
        if (select) {
            select.focus();
        }
    }, 150);
}
window.convertNoteToTask = convertNoteToTask;

// =========================================================================
// ADMIN REMINDERS ENGINE & CYCLES
// =========================================================================
function addReminder() {
    const isAr = currentAppLang === 'ar';
    const titleVal = document.getElementById('reminder-title-input') ? document.getElementById('reminder-title-input').value.trim() : '';
    const deadlineVal = document.getElementById('reminder-deadline-input') ? document.getElementById('reminder-deadline-input').value : '';
    const noteVal = document.getElementById('reminder-note-input') ? document.getElementById('reminder-note-input').value.trim() : '';
    const leadTimes = Array.from(document.querySelectorAll('.rem-lead-cb:checked')).map(cb => cb.value);

    const cycleVal = document.getElementById('reminder-cycle-input') ? document.getElementById('reminder-cycle-input').value : 'none';

    if (!titleVal) {
        alert(isAr ? 'يرجى إدخال عنوان أو موضوع التذكير.' : 'Please enter a reminder title.');
        return;
    }
    if (!deadlineVal) {
        alert(isAr ? 'يرجى اختيار موعد التذكير والوقت المستهدف.' : 'Please select the deadline date and time.');
        return;
    }

    const deadlineMs = new Date(deadlineVal).getTime();
    if (isNaN(deadlineMs)) {
        alert(isAr ? 'تاريخ أو وقت غير صحيح.' : 'Invalid deadline date.');
        return;
    }

    const remId = 'rem-' + Date.now();
    const reminderObj = {
        id: remId,
        title: titleVal,
        deadlineMs: deadlineMs,
        deadlineISO: deadlineVal,
        cycle: cycleVal || 'none',
        note: noteVal,
        leadTimes: leadTimes.length > 0 ? leadTimes : ['1_2d', '5d', '10d', '15d', '1m'],
        createdAt: Date.now(),
        createdBy: currentUser ? (currentUser.email || 'Admin') : 'Admin',
        status: 'active'
    };

    db.ref(`companies/${currentCompany}/reminders/${remId}`).set(reminderObj)
        .then(() => {
            if (document.getElementById('reminder-title-input')) document.getElementById('reminder-title-input').value = '';
            if (document.getElementById('reminder-deadline-input')) document.getElementById('reminder-deadline-input').value = '';
            if (document.getElementById('reminder-note-input')) document.getElementById('reminder-note-input').value = '';
            if (document.getElementById('reminder-cycle-input')) document.getElementById('reminder-cycle-input').value = 'none';
            renderReminders();
        })
        .catch(err => {
            console.error("Error creating reminder:", err);
            alert("Error: " + err.message);
        });
}
window.addReminder = addReminder;

let currentRemindersLimit = 20;
let isRemindersInfiniteScrollAttached = false;

function setupRemindersInfiniteScroll() {
    if (isRemindersInfiniteScrollAttached) return;
    isRemindersInfiniteScrollAttached = true;

    window.addEventListener('scroll', () => {
        const remindersView = document.getElementById('view-reminders');
        if (!remindersView || remindersView.style.display === 'none') return;

        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;

        if (scrollTop + windowHeight >= docHeight - 350) {
            const companyData = getCompanyData();
            const remindersObj = companyData.reminders || {};
            const totalReminders = Object.keys(remindersObj).length;

            if (currentRemindersLimit < totalReminders) {
                currentRemindersLimit += 20;
                renderReminders();
            }
        }
    });
}

function loadMoreReminders() {
    currentRemindersLimit += 20;
    renderReminders();
}
window.loadMoreReminders = loadMoreReminders;
window.setupRemindersInfiniteScroll = setupRemindersInfiniteScroll;

function toggleLeadTimeChip(el) {
    const cb = el.querySelector('input[type="checkbox"]');
    if (cb) {
        cb.checked = !cb.checked;
        if (cb.checked) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    }
}
window.toggleLeadTimeChip = toggleLeadTimeChip;

function editWorkerPastAttendanceTime(workerId, dateStr, currentCheckin, currentStatus) {
    const modal = document.getElementById('modal-edit-past-attendance');
    if (!modal) return;

    document.getElementById('edit-past-att-worker-id').value = workerId;
    document.getElementById('edit-past-att-date-str').value = dateStr;
    document.getElementById('edit-past-att-date-display').textContent = `${dateStr}`;

    const statusSelect = document.getElementById('edit-past-att-status-select');
    if (statusSelect) {
        statusSelect.value = currentStatus && currentStatus !== 'not_marked' ? currentStatus : 'present';
    }

    const timePicker = document.getElementById('edit-past-att-time-picker');
    if (timePicker) {
        let defaultTime = '09:00';
        if (currentCheckin && currentCheckin !== '--') {
            const timeParts = currentCheckin.match(/\d{2}:\d{2}/);
            if (timeParts) defaultTime = timeParts[0];
        }
        timePicker.value = defaultTime;
    }

    onEditPastAttStatusChange();
    modal.style.display = 'flex';
}
window.editWorkerPastAttendanceTime = editWorkerPastAttendanceTime;

function closeEditPastAttendanceModal() {
    const modal = document.getElementById('modal-edit-past-attendance');
    if (modal) modal.style.display = 'none';
}
window.closeEditPastAttendanceModal = closeEditPastAttendanceModal;

function onEditPastAttStatusChange() {
    const statusSelect = document.getElementById('edit-past-att-status-select');
    const timeGroup = document.getElementById('edit-past-att-time-group');
    if (statusSelect && timeGroup) {
        timeGroup.style.display = statusSelect.value === 'present' ? 'block' : 'none';
    }
}
window.onEditPastAttStatusChange = onEditPastAttStatusChange;

function savePastAttendanceEdit() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const workerId = document.getElementById('edit-past-att-worker-id').value;
    const dateStr = document.getElementById('edit-past-att-date-str').value;
    const status = document.getElementById('edit-past-att-status-select').value;
    const timeVal = document.getElementById('edit-past-att-time-picker').value;

    if (!workerId || !dateStr) return;

    const companyData = getCompanyData();
    const workers = companyData.workers || [];
    const worker = workers.find(w => w.id === workerId);
    let lateness = '';

    if (status === 'present' && timeVal && worker) {
        let shiftStart = worker.startTime || '09:00';
        const dateParts = dateStr.split('-');
        const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeekName = dayNames[dateObj.getDay()];
        const dateOverrideShift = (worker.shifts || []).find(s => s.dayOfWeek === dayOfWeekName || s.specificDate === dateStr);
        if (dateOverrideShift) {
            shiftStart = dateOverrideShift.startTime;
        }
        if (typeof calculateLateness === 'function') {
            lateness = calculateLateness(shiftStart, timeVal) || '';
        }
    }

    const attObj = {
        status: status,
        time: status === 'present' ? timeVal : '',
        lateness: lateness,
        updatedAt: Date.now(),
        updatedBy: currentUser ? (currentUser.email || 'Admin') : 'Admin'
    };

    db.ref(`companies/${currentCompany}/attendance/${dateStr}/${workerId}`).set(attObj)
        .then(() => {
            closeEditPastAttendanceModal();
            if (typeof showInAppNotification === 'function') {
                showInAppNotification(isAr ? `تم تحديث الحضور ليوم ${dateStr} بنجاح!` : `Attendance updated for ${dateStr}!`);
            }
            showWorker3MonthAttendanceReport(workerId);
            if (typeof renderAttendance === 'function') renderAttendance();
            if (typeof renderSummaryTable === 'function') renderSummaryTable();
            if (typeof renderFinanceTable === 'function') renderFinanceTable();
        })
        .catch(err => alert("Error updating attendance: " + err.message));
}
window.savePastAttendanceEdit = savePastAttendanceEdit;

function togglePendingPaymentRequests() {
    const card = document.getElementById('pending-payment-requests-card');
    if (card) {
        card.style.display = card.style.display === 'none' ? 'block' : 'none';
    }
}
window.togglePendingPaymentRequests = togglePendingPaymentRequests;

function togglePendingCustodyRequests() {
    const card = document.getElementById('pending-custody-requests-card');
    if (card) {
        card.style.display = card.style.display === 'none' ? 'block' : 'none';
    }
}
window.togglePendingCustodyRequests = togglePendingCustodyRequests;

function toggleAddReminderForm() {
    const formCard = document.getElementById('card-add-reminder');
    if (formCard) {
        formCard.style.display = formCard.style.display === 'none' ? 'block' : 'none';
    }
}
window.toggleAddReminderForm = toggleAddReminderForm;

function getReminderCycleLabel(cycle, isAr) {
    if (!cycle || cycle === 'none') return isAr ? '📌 مرة واحدة' : '📌 One-time';
    switch (cycle) {
        case 'daily': return isAr ? '🔄 يومياً' : '🔄 Daily';
        case 'weekly': return isAr ? '🔄 أسبوعياً' : '🔄 Weekly';
        case 'monthly': return isAr ? '🔄 شهرياً' : '🔄 Monthly';
        case 'quarterly': return isAr ? '🔄 كل 3 أشهر' : '🔄 Every 3 Months';
        case 'half_yearly': return isAr ? '🔄 كل 6 أشهر' : '🔄 Every 6 Months';
        case 'yearly': case '1year': case '1years': return isAr ? '🔄 كل 1 سنة' : '🔄 Every 1 Year';
        case '2years': return isAr ? '🔄 كل سنتين' : '🔄 Every 2 Years';
        case '3years': return isAr ? '🔄 كل 3 سنوات' : '🔄 Every 3 Years';
        case '4years': return isAr ? '🔄 كل 4 سنوات' : '🔄 Every 4 Years';
        case '5years': return isAr ? '🔄 كل 5 سنوات' : '🔄 Every 5 Years';
        case '6years': return isAr ? '🔄 كل 6 سنوات' : '🔄 Every 6 Years';
        case '7years': return isAr ? '🔄 كل 7 سنوات' : '🔄 Every 7 Years';
        case '8years': return isAr ? '🔄 كل 8 سنوات' : '🔄 Every 8 Years';
        case '9years': return isAr ? '🔄 كل 9 سنوات' : '🔄 Every 9 Years';
        case '10years': return isAr ? '🔄 كل 10 سنوات' : '🔄 Every 10 Years';
        case '11years': return isAr ? '🔄 كل 11 سنة' : '🔄 Every 11 Years';
        case '12years': return isAr ? '🔄 كل 12 سنة' : '🔄 Every 12 Years';
        case '13years': return isAr ? '🔄 كل 13 سنة' : '🔄 Every 13 Years';
        case '14years': return isAr ? '🔄 كل 14 سنة' : '🔄 Every 14 Years';
        case '15years': return isAr ? '🔄 كل 15 سنة' : '🔄 Every 15 Years';
        default: return isAr ? '🔄 تكرار مخصص' : '🔄 Recurring';
    }
}
window.getReminderCycleLabel = getReminderCycleLabel;

function isReminderAlerting(r, now) {
    const diffMs = (r.deadlineMs || 0) - now;
    const daysLeft = diffMs / (1000 * 60 * 60 * 24);
    if (daysLeft <= 0) return true; // Overdue

    const leadTimes = r.leadTimes || ['1_2d', '5d', '10d', '15d', '1m'];
    if (leadTimes.includes('1_2d') && daysLeft <= 2) return true;
    if (leadTimes.includes('5d') && daysLeft <= 5) return true;
    if (leadTimes.includes('10d') && daysLeft <= 10) return true;
    if (leadTimes.includes('15d') && daysLeft <= 15) return true;
    if (leadTimes.includes('1m') && daysLeft <= 30) return true;
    return false;
}

function getReminderColorTheme(daysLeft, isDue, isAr) {
    if (daysLeft <= 2) {
        // Red: 0 - 2 days left
        return {
            border: '2px solid #dc2626',
            bg: 'rgba(220, 38, 38, 0.12)',
            badge: `<span class="badge" style="background:#dc2626; color:white; font-weight:800; animation:notif-bell 1s infinite alternate;">🔴 ${isDue ? (isAr ? 'مستحق الآن!' : 'DUE NOW!') : (isAr ? '0-2 يوم متبقي' : '0-2 Days Left')}</span>`
        };
    } else if (daysLeft > 2 && daysLeft <= 5) {
        // Yellow: 3 - 5 days left
        return {
            border: '2px solid #d97706',
            bg: 'rgba(217, 119, 6, 0.12)',
            badge: `<span class="badge" style="background:#d97706; color:white; font-weight:800;">🟡 ${isAr ? '3-5 أيام متبقية' : '3-5 Days Left'}</span>`
        };
    } else if (daysLeft > 5 && daysLeft <= 9) {
        // Orange: 6 - 9 days left
        return {
            border: '2px solid #ea580c',
            bg: 'rgba(234, 88, 12, 0.12)',
            badge: `<span class="badge" style="background:#ea580c; color:white; font-weight:800;">🟠 ${isAr ? '6-9 أيام متبقية' : '6-9 Days Left'}</span>`
        };
    } else if (daysLeft > 9 && daysLeft <= 30) {
        // Blue: 10 - 30 days (1 month) left
        return {
            border: '2px solid #0284c7',
            bg: 'rgba(2, 132, 199, 0.12)',
            badge: `<span class="badge" style="background:#0284c7; color:white; font-weight:800;">🔵 ${isAr ? '10 أيام - شهر متبقي' : '10 Days - 1 Month Left'}</span>`
        };
    } else {
        // > 30 days left (Upcoming)
        return {
            border: '1px solid var(--border-color)',
            bg: 'var(--card-bg)',
            badge: `<span class="badge badge-good">⏳ ${isAr ? 'قادم' : 'Upcoming'}</span>`
        };
    }
}

function formatReminderDate(ms, fallbackIso) {
    if (!ms && !fallbackIso) return 'N/A';
    const d = ms ? new Date(ms) : new Date(fallbackIso);
    if (isNaN(d.getTime())) return fallbackIso || 'N/A';
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}/${month}/${year}, ${hours}:${mins} ${ampm}`;
}

function renderReminders() {
    const container = document.getElementById('reminders-list-container');
    if (!container) return;

    if (typeof setupSearchInputClearButtons === 'function') {
        setupSearchInputClearButtons();
    }

    if (typeof setupRemindersInfiniteScroll === 'function') {
        setupRemindersInfiniteScroll();
    }

    const isAr = currentAppLang === 'ar';
    const companyData = getCompanyData();
    const remindersObj = companyData.reminders || {};
    const now = Date.now();

    const searchInput = document.getElementById('reminders-search-input');
    if (searchInput && !searchInput.dataset.bound) {
        searchInput.dataset.bound = 'true';
        searchInput.addEventListener('input', () => {
            currentRemindersLimit = 20;
            renderReminders();
        });
    }
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let remindersList = Object.values(remindersObj).sort((a, b) => (a.deadlineMs || 0) - (b.deadlineMs || 0));

    if (searchQuery) {
        remindersList = remindersList.filter(r =>
            (r.title && r.title.toLowerCase().includes(searchQuery)) ||
            (r.note && r.note.toLowerCase().includes(searchQuery))
        );
    }

    const countBadge = document.getElementById('reminders-count-badge');
    if (countBadge) {
        countBadge.textContent = `${remindersList.length} ${isAr ? 'تذكير نشط' : 'Active'}`;
    }

    // Check Due Reminders for Alert Banner
    const dueReminders = remindersList.filter(r => r.deadlineMs && isReminderAlerting(r, now));
    const banner = document.getElementById('reminders-due-banner');
    const bannerText = document.getElementById('reminders-due-text');

    if (dueReminders.length > 0 && banner && bannerText) {
        banner.style.display = 'block';
        const dueTitles = dueReminders.map(r => `• ${r.title}`).join(', ');
        bannerText.textContent = isAr
            ? `لديك (${dueReminders.length}) تذكيرات حان موعد التنبيه عليها: ${dueTitles}`
            : `You have (${dueReminders.length}) reminders with active lead alerts: ${dueTitles}`;
    } else if (banner) {
        banner.style.display = 'none';
    }

    if (remindersList.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:30px; font-size:0.9rem; width:100%;">${isAr ? 'لا توجد تذكيرات مضافة بعد. استخدم النموذج لإضافة تذكير جديد.' : 'No reminders found. Use the form to add a new reminder.'}</p>`;
        return;
    }

    container.innerHTML = '';
    const itemsToRender = remindersList.slice(0, currentRemindersLimit);

    itemsToRender.forEach(r => {
        const isDue = r.deadlineMs <= now;
        const diffMs = (r.deadlineMs || 0) - now;
        const daysLeft = diffMs / (1000 * 60 * 60 * 24);
        const theme = getReminderColorTheme(daysLeft, isDue, isAr);
        const deadlineStr = formatReminderDate(r.deadlineMs, r.deadlineISO);

        const leadTimes = r.leadTimes || ['1_2d', '5d', '10d', '15d', '1m'];
        const leadLabels = { '1_2d': '1-2d', '5d': '5d', '10d': '10d', '15d': '15d', '1m': '1m' };
        const activeLeadStr = leadTimes.map(lt => leadLabels[lt] || lt).join(', ');

        const cycleText = getReminderCycleLabel(r.cycle, isAr);
        const cycleBadge = r.cycle && r.cycle !== 'none'
            ? `<span class="badge" style="background: rgba(37,99,235,0.15); color: #2563eb; border: 1px solid rgba(37,99,235,0.3); font-size: 0.74rem; font-weight: 800;">${cycleText}${r.completedCycles ? ` (#${r.completedCycles})` : ''}</span>`
            : `<span class="badge" style="background: rgba(100,116,139,0.12); color: var(--text-muted); font-size: 0.74rem;">📌 ${isAr ? 'مرة واحدة' : 'One-time'}</span>`;

        const markDoneBtn = `<button onclick="markReminderDoneFinal('${r.id}')" class="btn-success" style="padding:6px 12px; font-size:0.8rem; border-radius:8px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:5px; box-shadow: 0 2px 8px rgba(16,185,129,0.3);" title="${isAr ? 'إنجاز وإنهاء التذكير بالكامل' : 'Mark Completed & Remove'}">
            ✅ ${isAr ? 'تم الإنجاز (Done)' : 'Done'}
        </button>`;

        const repeatCycleBtn = r.cycle && r.cycle !== 'none' ? `<button onclick="completeReminderCycle('${r.id}')" class="btn-primary" style="padding:6px 12px; font-size:0.8rem; border-radius:8px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:5px; background:linear-gradient(135deg, #2563eb, #1d4ed8);" title="${isAr ? 'إنجاز وتجديد الدورة التكرارية القادمة' : 'Done + Repeat Next Cycle'}">
            🔄 ${isAr ? 'إنجاز + تكرار الدورة' : 'Done + Repeat'}
        </button>` : '';

        const sendTaskBtn = `<button onclick="convertReminderToTask('${r.id}')" class="btn-outline" style="padding:5px 10px; font-size:0.75rem; border-radius:8px; border:1px solid var(--secondary); color:var(--secondary); font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px;" title="${isAr ? 'تحويل لمهمة' : 'As Task'}">📋 ${isAr ? 'مهمة' : 'Task'}</button>`;

        container.innerHTML += `
            <div class="reminder-leaderboard-row" ondblclick="if (!event.target.closest('button')) openEditReminderModal('${r.id}')" style="border:${theme.border}; background:${theme.bg}; cursor:pointer;" title="${isAr ? 'انقر مرتين لتعديل التذكير' : 'Double-click to edit reminder'}">
                <!-- Col 1: Title, Status Badge & Cycle -->
                <div style="min-width:0;">
                    <strong style="font-size:1.05rem; color:var(--text-main); display:block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${r.title}</strong>
                    <div style="display:flex; gap:6px; margin-top:4px; flex-wrap:wrap; align-items:center;">
                        ${theme.badge}
                        ${cycleBadge}
                    </div>
                </div>

                <!-- Col 2: Complete Description / Note -->
                <div style="min-width:0; color:var(--text-main); font-size:0.88rem; line-height:1.4; word-break:break-word;">
                    ${r.note ? `📝 <em>${r.note}</em>` : `<span style="color:var(--text-muted); font-size:0.8rem;">${isAr ? 'بدون وصف إضافي' : 'No extra description'}</span>`}
                </div>

                <!-- Col 3: Deadline & Alerts -->
                <div style="min-width:0; font-size:0.82rem; color:var(--text-muted);">
                    <div>🕒 <strong>${deadlineStr}</strong></div>
                    <div style="font-size:0.75rem; margin-top:2px;">🔔 ${isAr ? 'تنبيه:' : 'Alert:'} <strong>${activeLeadStr || 'None'}</strong></div>
                </div>

                <!-- Col 4: Action Buttons Cluster -->
                <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; justify-content:flex-end;">
                    ${markDoneBtn}
                    ${repeatCycleBtn}
                    ${sendTaskBtn}
                    <button onclick="openEditReminderModal('${r.id}')" class="btn-outline" style="padding:5px 8px; font-size:0.85rem;" title="${isAr ? 'تعديل' : 'Edit'}">✏️</button>
                    <button onclick="deleteReminder('${r.id}')" class="btn-danger" style="padding:5px 8px; font-size:0.85rem;" title="${isAr ? 'حذف' : 'Delete'}">✖</button>
                </div>
            </div>
        `;
    });

    if (remindersList.length > currentRemindersLimit) {
        const remainingCount = remindersList.length - currentRemindersLimit;
        const autoScrollIndicatorHtml = `
            <div id="reminders-auto-scroll-indicator" style="text-align:center; width:100%; padding:14px 0; margin-top:10px; color:var(--text-muted); font-size:0.85rem; font-weight:700;">
                ⌛ ${isAr ? `جاري تحميل المزيد من التذكيرات تلقائياً عند التمرير... (متبقي ${remainingCount})` : `Auto-loading more reminders on scroll... (${remainingCount} remaining)`}
            </div>
        `;
        container.innerHTML += autoScrollIndicatorHtml;
    }
}
window.renderReminders = renderReminders;

function markReminderDoneFinal(remId) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? 'هل أنت تأكد من إنجاز هذا التذكير بالكامل وإزالته؟' : 'Are you sure you want to mark this reminder completed and remove it?')) {
        return;
    }
    db.ref(`companies/${currentCompany}/reminders/${remId}`).remove()
        .then(() => {
            if (typeof showInAppNotification === 'function') {
                showInAppNotification(isAr ? 'تم إنجاز التذكير وإزالته بنجاح!' : 'Reminder completed & removed!');
            }
            renderReminders();
        })
        .catch(err => console.error("Error removing reminder:", err));
}
window.markReminderDoneFinal = markReminderDoneFinal;

function completeReminderCycle(remId) {
    const isAr = currentAppLang === 'ar';
    const companyData = getCompanyData();
    const remindersObj = companyData.reminders || {};
    const r = remindersObj[remId];
    if (!r) return;

    const cycle = r.cycle || 'none';

    if (cycle === 'none') {
        if (!confirm(isAr ? 'هل أنجزت هذا التذكير بالكامل؟ سيتم إزالته من القائمة.' : 'Have you finished this reminder? It will be completed and removed.')) {
            return;
        }
        db.ref(`companies/${currentCompany}/reminders/${remId}`).remove()
            .then(() => {
                if (typeof showInAppNotification === 'function') {
                    showInAppNotification(isAr ? 'تم إنجاز التذكير بنجاح!' : 'Reminder finished successfully!');
                }
                renderReminders();
            })
            .catch(err => console.error("Error completing reminder:", err));
        return;
    }

    // Advanced Recurring Cycle Logic
    const currentMs = r.deadlineMs || Date.now();
    const baseDate = new Date(currentMs > Date.now() ? currentMs : Date.now());

    switch (cycle) {
        case 'daily':
            baseDate.setDate(baseDate.getDate() + 1);
            break;
        case 'weekly':
            baseDate.setDate(baseDate.getDate() + 7);
            break;
        case 'monthly':
            baseDate.setMonth(baseDate.getMonth() + 1);
            break;
        case 'quarterly':
            baseDate.setMonth(baseDate.getMonth() + 3);
            break;
        case 'half_yearly':
            baseDate.setMonth(baseDate.getMonth() + 6);
            break;
        case 'yearly': case '1year': case '1years':
            baseDate.setFullYear(baseDate.getFullYear() + 1);
            break;
        case '2years': baseDate.setFullYear(baseDate.getFullYear() + 2); break;
        case '3years': baseDate.setFullYear(baseDate.getFullYear() + 3); break;
        case '4years': baseDate.setFullYear(baseDate.getFullYear() + 4); break;
        case '5years': baseDate.setFullYear(baseDate.getFullYear() + 5); break;
        case '6years': baseDate.setFullYear(baseDate.getFullYear() + 6); break;
        case '7years': baseDate.setFullYear(baseDate.getFullYear() + 7); break;
        case '8years': baseDate.setFullYear(baseDate.getFullYear() + 8); break;
        case '9years': baseDate.setFullYear(baseDate.getFullYear() + 9); break;
        case '10years': baseDate.setFullYear(baseDate.getFullYear() + 10); break;
        case '11years': baseDate.setFullYear(baseDate.getFullYear() + 11); break;
        case '12years': baseDate.setFullYear(baseDate.getFullYear() + 12); break;
        case '13years': baseDate.setFullYear(baseDate.getFullYear() + 13); break;
        case '14years': baseDate.setFullYear(baseDate.getFullYear() + 14); break;
        case '15years': baseDate.setFullYear(baseDate.getFullYear() + 15); break;
        default:
            baseDate.setDate(baseDate.getDate() + 1);
    }

    const nextDeadlineMs = baseDate.getTime();
    const nextDeadlineISO = baseDate.toISOString().slice(0, 16);
    const newCompletedCount = (r.completedCycles || 0) + 1;

    const updates = {
        deadlineMs: nextDeadlineMs,
        deadlineISO: nextDeadlineISO,
        completedCycles: newCompletedCount,
        lastFinishedAt: Date.now()
    };

    return db.ref(`companies/${currentCompany}/reminders/${remId}`).update(updates)
        .then(() => {
            const nextFormatted = formatReminderDate(nextDeadlineMs, nextDeadlineISO);
            const msg = isAr
                ? `🎉 تم إنجاز الدورة بنجاح! الموعد القادم: ${nextFormatted}`
                : `🎉 Cycle finished! Next reminder due: ${nextFormatted}`;
            if (typeof showInAppNotification === 'function') {
                showInAppNotification(msg);
            }
            renderReminders();
        })
        .catch(err => {
            console.error("Error advancing reminder cycle:", err);
            alert(isAr ? 'حدث خطأ أثناء تحديث التذكير.' : 'Error advancing reminder cycle.');
        });
}
window.completeReminderCycle = completeReminderCycle;

function convertReminderToTask(remId) {
    const companyData = getCompanyData();
    const remindersObj = companyData.reminders || {};
    const r = remindersObj[remId];
    if (!r) return;

    let fullText = r.title || '';
    if (r.note) {
        fullText += `: ${r.note}`;
    }

    if (typeof convertNoteToTask === 'function') {
        convertNoteToTask(encodeURIComponent(fullText));
    }
}
window.convertReminderToTask = convertReminderToTask;

function deleteReminder(remId) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? 'هل أنت تأكد من حذف هذا التذكير؟' : 'Are you sure you want to delete this reminder?')) return;

    db.ref(`companies/${currentCompany}/reminders/${remId}`).remove()
        .then(() => {
            renderReminders();
        })
        .catch(err => console.error("Error deleting reminder:", err));
}
window.deleteReminder = deleteReminder;

function openEditReminderModal(remId) {
    const companyData = getCompanyData();
    const remindersObj = companyData.reminders || {};
    const r = remindersObj[remId];
    if (!r) return;

    document.getElementById('edit-reminder-id').value = r.id;
    document.getElementById('edit-reminder-title').value = r.title || '';

    if (r.deadlineISO) {
        document.getElementById('edit-reminder-deadline').value = r.deadlineISO;
    } else if (r.deadlineMs) {
        document.getElementById('edit-reminder-deadline').value = new Date(r.deadlineMs).toISOString().slice(0, 16);
    }

    if (document.getElementById('edit-reminder-cycle')) {
        document.getElementById('edit-reminder-cycle').value = r.cycle || 'none';
    }

    document.getElementById('edit-reminder-note').value = r.note || '';

    const leadTimes = r.leadTimes || ['1_2d', '5d', '10d', '15d', '1m'];
    document.querySelectorAll('.edit-rem-lead-cb').forEach(cb => {
        cb.checked = leadTimes.includes(cb.value);
        const parentLabel = cb.closest('.lead-time-chip');
        if (parentLabel) {
            if (cb.checked) parentLabel.classList.add('active');
            else parentLabel.classList.remove('active');
        }
    });

    const modal = document.getElementById('edit-reminder-modal');
    if (modal) modal.style.display = 'flex';
}
window.openEditReminderModal = openEditReminderModal;

function closeEditReminderModal() {
    const modal = document.getElementById('edit-reminder-modal');
    if (modal) modal.style.display = 'none';
}
window.closeEditReminderModal = closeEditReminderModal;

function saveEditReminder() {
    const isAr = currentAppLang === 'ar';
    const remId = document.getElementById('edit-reminder-id').value;
    const titleVal = document.getElementById('edit-reminder-title').value.trim();
    const deadlineVal = document.getElementById('edit-reminder-deadline').value;
    const cycleVal = document.getElementById('edit-reminder-cycle') ? document.getElementById('edit-reminder-cycle').value : 'none';
    const noteVal = document.getElementById('edit-reminder-note').value.trim();
    const leadTimes = Array.from(document.querySelectorAll('.edit-rem-lead-cb:checked')).map(cb => cb.value);

    if (!remId || !titleVal || !deadlineVal) return;

    const deadlineMs = new Date(deadlineVal).getTime();
    if (isNaN(deadlineMs)) return;

    db.ref(`companies/${currentCompany}/reminders/${remId}`).update({
        title: titleVal,
        deadlineMs: deadlineMs,
        deadlineISO: deadlineVal,
        cycle: cycleVal || 'none',
        note: noteVal,
        leadTimes: leadTimes.length > 0 ? leadTimes : ['1_2d', '5d', '10d', '15d', '1m']
    }).then(() => {
        closeEditReminderModal();
        renderReminders();
    }).catch(err => console.error("Error updating reminder:", err));
}
window.saveEditReminder = saveEditReminder;

// ==========================================
// Market Cart & Coin System State
let marketCart = [];
try {
    const savedCart = localStorage.getItem('mvc_market_cart');
    if (savedCart) marketCart = JSON.parse(savedCart);
} catch (e) {
    marketCart = [];
}


// --- AUTOMATIC IN-SCOPE WINDOW EXPORTS ---
if (typeof renderFinanceTable === 'function') window.renderFinanceTable = renderFinanceTable;
if (typeof renderFinDetails === 'function') window.renderFinDetails = renderFinDetails;
if (typeof renderSummaryTable === 'function') window.renderSummaryTable = renderSummaryTable;
if (typeof renderLeaderboard === 'function') window.renderLeaderboard = renderLeaderboard;
if (typeof getActiveWorker === 'function') window.getActiveWorker = getActiveWorker;
if (typeof calculateLateness === 'function') window.calculateLateness = calculateLateness;
if (typeof setWorkerVacationStatus === 'function') window.setWorkerVacationStatus = setWorkerVacationStatus;
if (typeof translateActivityLogDetails === 'function') window.translateActivityLogDetails = translateActivityLogDetails;
if (typeof showWorkerAlertOverlay === 'function') window.showWorkerAlertOverlay = showWorkerAlertOverlay;
if (typeof initTabDragEvents === 'function') window.initTabDragEvents = initTabDragEvents;
if (typeof applyUserTabOrder === 'function') window.applyUserTabOrder = applyUserTabOrder;
if (typeof reorderTabContainer === 'function') window.reorderTabContainer = reorderTabContainer;
if (typeof isReminderAlerting === 'function') window.isReminderAlerting = isReminderAlerting;
if (typeof getReminderColorTheme === 'function') window.getReminderColorTheme = getReminderColorTheme;
if (typeof formatReminderDate === 'function') window.formatReminderDate = formatReminderDate;
