/**
 * Ops dashboard, worker tables, shift check-in/clock-out details
 */

function renderWorkerViolationPanel() {
    const panel = document.getElementById('worker-violation-panel');
    const list = document.getElementById('worker-violations-list');
    if (!panel || !list) return;

    // Only for non-admin workers, and only on the Finance tab
    if (!currentUser || currentUser.role === 'admin') {
        panel.style.display = 'none';
        return;
    }
    if (currentTab !== 'finance') {
        panel.style.display = 'none';
        return;
    }
    panel.style.display = 'block';

    // Find this worker's profile
    const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
    if (!myWorker) {
        list.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:20px;">Your account is not linked to any worker profile yet.</p>`;
        return;
    }

    const stats = getMonthlyStats(myWorker, currentGlobalMonth);
    const violList = stats.violationsList || [];

    list.innerHTML = '';

    if (violList.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:30px; color:var(--success);"><div style="font-size:2rem;">✅</div><strong>No violations recorded this month.</strong><p style="color:var(--text-muted); margin-top:8px; font-size:0.9rem;">Keep up the great work!</p></div>`;
        return;
    }

    violList.forEach(v => {
        const div = document.createElement('div');
        div.className = 'ledger-card';

        let statusHtml = '';
        let borderColor = 'var(--danger)';

        if (v.status === 'waived') {
            borderColor = 'var(--success)';
            statusHtml = `<div style="margin-top:10px; padding:10px 14px; background:var(--success-bg); border:1px solid var(--success-border); border-radius:8px; font-size:0.9rem; color:var(--success); font-weight:600;">✅ Fixed &amp; Waived — No penalty applied</div>`;
        } else if (v.status === 'active' || !v.status) {
            borderColor = 'var(--danger)';
            statusHtml = `<div style="margin-top:10px; padding:10px 14px; background:var(--danger-bg); border:1px solid var(--danger-border); border-radius:8px; font-size:0.9rem; color:var(--danger); font-weight:600;">🚨 Penalty Applied — SAR ${parseFloat(v.amount).toLocaleString()} deducted</div>`;
        } else if (v.status === 'pending') {
            const deadline = v.timestamp + (v.graceDays * 86400000);
            const timeLeft = deadline - Date.now();
            if (timeLeft <= 0) {
                borderColor = 'var(--danger)';
                statusHtml = `<div style="margin-top:10px; padding:10px 14px; background:var(--danger-bg); border:1px solid var(--danger-border); border-radius:8px; font-size:0.9rem; color:var(--danger); font-weight:600;">🚨 Time Expired — Penalty of SAR ${parseFloat(v.amount).toLocaleString()} applied</div>`;
            } else {
                borderColor = 'var(--warning)';
                const totalHours = Math.floor(timeLeft / 3600000);
                const daysLeft = Math.floor(totalHours / 24);
                const hoursLeft = totalHours % 24;
                const minsLeft = Math.floor((timeLeft % 3600000) / 60000);
                let timeStr = '';
                if (daysLeft > 0) timeStr = `${daysLeft} day${daysLeft > 1 ? 's' : ''} and ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`;
                else if (hoursLeft > 0) timeStr = `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} and ${minsLeft} minute${minsLeft !== 1 ? 's' : ''}`;
                else timeStr = `${minsLeft} minute${minsLeft !== 1 ? 's' : ''}`;

                statusHtml = `
                            <div style="margin-top:10px; padding:12px 14px; background:var(--warning-bg); border:1px solid var(--warning-border); border-radius:8px;">
                                <div style="font-size:1rem; color:var(--warning); font-weight:700; margin-bottom:6px;">⏳ Fix This Before Penalty Is Applied</div>
                                <div style="font-size:0.85rem; color:var(--text-main); margin-bottom:4px;">Manager gave you <strong>${v.graceDays} day${v.graceDays > 1 ? 's' : ''}</strong> to fix this violation.</div>
                                <div style="font-size:0.85rem; color:var(--warning); font-weight:600;">Time remaining: <strong>${timeStr}</strong></div>
                                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">Penalty if not fixed: SAR ${parseFloat(v.amount).toLocaleString()}</div>
                            </div>`;
            }
        }

        let imgHtml = v.image ? `<img src="${v.image}" onclick="showImage('${v.image}')" class="proof-img" style="max-height: 100px; margin-top: 12px;">` : '';

        div.style.borderLeft = `4px solid ${borderColor}`;
        div.innerHTML = `
                    <div class="flex-between" style="margin-bottom:6px;">
                        <span style="font-size:0.8rem; color:var(--text-muted);">🕒 ${v.date}</span>
                        <span style="font-size:0.8rem; color:var(--text-muted);">Amount: <strong style="color:var(--danger);">- SAR ${parseFloat(v.amount).toLocaleString()}</strong></span>
                    </div>
                    <div style="font-weight:700; font-size:1rem; color:var(--text-main);">${v.reason}</div>
                    ${statusHtml}
                    ${imgHtml}
                `;
        list.appendChild(div);
    });
}

function renderBranches() {
    const list = document.getElementById('branches-list');
    const select = document.getElementById('w-branch');
    const editSelect = document.getElementById('ops-edit-branch');
    list.innerHTML = '';
    select.innerHTML = '';
    if (editSelect) editSelect.innerHTML = '';
    getCompanyData().branches.forEach(branch => {
        const li = document.createElement('li'); li.className = 'flex-between list-item';
        li.innerHTML = `<span style="font-weight: 500; color: var(--text-main);">${branch}</span> <button class="btn-outline-danger admin-only" style="padding: 4px 10px; font-size: 0.75rem;" onclick="deleteBranch('${branch}')">Remove</button>`;
        list.appendChild(li);
        const option = document.createElement('option'); option.value = branch; option.textContent = branch; select.appendChild(option);

        if (editSelect) {
            const editOption = document.createElement('option');
            editOption.value = branch;
            editOption.textContent = branch;
            editSelect.appendChild(editOption);
        }
    });
}

function populateWorkerDropdowns() {
    const opsSelect = document.getElementById('ops-worker-select'); const opsVal = opsSelect.value;
    const finSelect = document.getElementById('fin-worker-select'); const finVal = finSelect.value;
    const taskSelect = document.getElementById('task-worker-select'); const taskVal = taskSelect ? taskSelect.value : '';
    const permSelect = document.getElementById('perm-worker-select'); const permVal = permSelect ? permSelect.value : '';
    const sysSelect = document.getElementById('sys-viol-worker-select'); const sysVal = sysSelect ? sysSelect.value : '';
    const attSelect = document.getElementById('attendance-overtime-worker-select'); const attVal = attSelect ? attSelect.value : '';
    const vacSelect = document.getElementById('vacation-worker-select'); const vacVal = vacSelect ? vacSelect.value : '';

    if (opsSelect) opsSelect.innerHTML = `<option value="">${t('opt-choose-employee')}</option>`;
    if (finSelect) finSelect.innerHTML = `<option value="">${t('opt-choose-employee')}</option>`;
    if (taskSelect) taskSelect.innerHTML = `<option value="">${t('opt-choose-employee')}</option>`;
    if (permSelect) permSelect.innerHTML = `<option value="">${t('opt-choose-employee')}</option>`;
    if (sysSelect) sysSelect.innerHTML = `<option value="">-- Choose Worker --</option>`;
    if (attSelect) attSelect.innerHTML = `<option value="">${t('opt-choose-employee')}</option>`;
    if (vacSelect) vacSelect.innerHTML = `<option value="">${t('opt-choose-employee')}</option>`;

    getCompanyData().workers.forEach(worker => {
        if (opsSelect) opsSelect.appendChild(new Option(worker.name, worker.id));
        if (finSelect) finSelect.appendChild(new Option(worker.name, worker.id));
        if (taskSelect) taskSelect.appendChild(new Option(worker.name, worker.id));
        if (permSelect) permSelect.appendChild(new Option(worker.name, worker.id));
        if (sysSelect) sysSelect.appendChild(new Option(worker.name, worker.id));
        if (attSelect) attSelect.appendChild(new Option(worker.name, worker.id));
        if (vacSelect) vacSelect.appendChild(new Option(worker.name, worker.id));
    });

    if (opsSelect) opsSelect.value = opsVal;
    if (finSelect) finSelect.value = finVal;
    if (taskSelect) taskSelect.value = taskVal;
    if (permSelect) permSelect.value = permVal;
    if (sysSelect) sysSelect.value = sysVal;
    if (attSelect) attSelect.value = attVal;
    if (vacSelect) vacSelect.value = vacVal;
}

// OPERATIONS TAB RENDERING
function renderOpsWorkersTable() {
    const tbody = document.querySelector('#ops-workers-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const isAdmin = currentUser && currentUser.role === 'admin';

    const workersToRender = getVisibleWorkers();

    if (workersToRender.length === 0 && !isAdmin) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">${t('msg-account-not-linked')}</td></tr>`;
        return;
    }

    workersToRender.forEach(worker => {
        const avg = getAveragePerfection(getLogsForMonth(worker, currentGlobalMonth));

        const isAr = currentAppLang === 'ar';
        const shiftLabel = isAr ? 'المناوبة' : 'Shift';
        const shiftStr = (worker.startTime && worker.endTime) ? `🕒 ${shiftLabel}: ${worker.startTime} - ${worker.endTime}` : '';
        const shiftSpan = shiftStr ? `<br><span style="font-size:0.75rem; color:var(--text-muted); display:inline-block; margin-top:4px;">${shiftStr}</span>` : '';

        const tr = document.createElement('tr');
        let html = `
                    <td>
                        <strong style="color:var(--text-main);">${worker.name}</strong><br>
                        <span class="badge" style="margin-left:0;margin-top:6px;">${worker.role || t('label-staff')}</span>
                        ${shiftSpan}
                    </td>
                    <td><span class="badge" style="background: var(--primary); margin:0;">${avg}</span></td>`;
        if (isAdmin) {
            html += `
                    <td class="admin-only">
                        <button class="btn-outline-danger" style="padding:6px 12px;font-size:0.8rem;" onclick="deleteWorker('${worker.id}')">${t('btn-delete-worker')}</button>
                    </td>`;
        }
        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
}

function renderOpsDetails() {
    const isAr = currentAppLang === 'ar';
    const workerId = document.getElementById('ops-worker-select').value;
    const area = document.getElementById('ops-management-area'); const hist = document.getElementById('worker-logs-history');
    const isAdmin = currentUser && currentUser.role === 'admin';

    if (!workerId) { if (area) area.style.display = 'none'; return; }
    if (area) area.style.display = 'block';
    if (hist) hist.innerHTML = '';

    const worker = getCompanyData().workers.find(w => w.id === workerId);
    if (!worker) return;

    // Populate profile inputs
    const editName = document.getElementById('ops-edit-name');
    const editRole = document.getElementById('ops-edit-role');
    const editSalary = document.getElementById('ops-edit-salary');
    const editBranch = document.getElementById('ops-edit-branch');
    if (editName) editName.value = worker.name || '';
    if (editRole) editRole.value = worker.role || '';
    if (editSalary) editSalary.value = worker.income || 0;
    if (editBranch) editBranch.value = worker.branch || '';

    // Render shifts list
    const shiftsList = document.getElementById('ops-worker-shifts-list');
    if (shiftsList) {
        shiftsList.innerHTML = '';
        const shifts = worker.shifts || [];
        if (shifts.length === 0) {
            shiftsList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">No shifts added. Add a shift below.</p>`;
        } else {
            shifts.forEach(s => {
                const div = document.createElement('div');
                div.className = 'flex-between list-item';
                div.style.cssText = 'background:var(--input-bg); padding:10px; border-radius:8px; border:1px solid var(--border-color);';

                let statusText = '';
                if (s.dayOfWeek) {
                    statusText = `<span class="badge" style="background:#f59e0b; color:white; margin:0;">${isAr ? translateDynamicTerm(s.dayOfWeek) : 'Override: ' + s.dayOfWeek}</span>`;
                } else if (s.specificDate) {
                    statusText = `<span class="badge" style="background:#f59e0b; color:white; margin:0;">${isAr ? s.specificDate : 'Override: ' + s.specificDate}</span>`;
                } else {
                    statusText = s.active ? `<span class="badge badge-good" style="margin:0;">Active</span>` : `<button onclick="activateWorkerShift('${s.id}')" class="btn-outline-info" style="padding:4px 8px; font-size:0.75rem;">Activate</button>`;
                }
                let delBtn = `<button onclick="deleteWorkerShift('${s.id}')" class="btn-outline-danger" style="padding:4px 8px; font-size:0.75rem; border:none; text-decoration:underline;">Delete</button>`;

                div.innerHTML = `
                    <div>
                        <strong style="color:var(--text-main);">🕒 ${s.startTime} - ${s.endTime}</strong>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        ${statusText}
                        ${delBtn}
                    </div>
                `;
                shiftsList.appendChild(div);
            });
        }
    }

    // Calculate duration & hourly rate
    const durationEl = document.getElementById('ops-ov-shift-duration');
    const hourlyRateEl = document.getElementById('ops-ov-hourly-rate');
    const duration = getShiftDurationHours(worker.startTime, worker.endTime);
    const baseIncome = parseFloat(worker.income) || 0;
    const hourlyRate = baseIncome / (30 * duration);

    if (durationEl) durationEl.textContent = `${duration.toFixed(1)} hrs`;
    if (hourlyRateEl) hourlyRateEl.textContent = `SAR ${hourlyRate.toFixed(2)}/hr`;

    // Render overtime log history
    const overtimeHistList = document.getElementById('ops-worker-overtime-history');
    if (overtimeHistList) {
        overtimeHistList.innerHTML = '';
        const stats = getMonthlyStats(worker, currentGlobalMonth);
        const overtimeList = stats.overtimeList || [];
        if (overtimeList.length === 0) {
            overtimeHistList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">No overtime hours logged this month.</p>`;
        } else {
            overtimeList.forEach(o => {
                const div = document.createElement('div');
                div.className = 'flex-between list-item';
                div.style.cssText = 'background:var(--input-bg); padding:10px; border-radius:8px; border:1px solid var(--border-color);';

                div.innerHTML = `
                    <div>
                        <strong style="color:var(--text-main);">🕒 ${o.hours} hr (x${o.multiplier})</strong><br>
                        <span style="font-size:0.75rem; color:var(--text-muted);">Rate: SAR ${o.rate}/hr • Date: ${o.date}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-weight:700; color:#f59e0b;">+ SAR ${o.amount}</span>
                        <button onclick="deleteOvertimeHour('${o.id}')" class="btn-outline-danger" style="padding:4px 8px; font-size:0.75rem; border:none; text-decoration:underline;">Undo</button>
                    </div>
                `;
                overtimeHistList.appendChild(div);
            });
        }
    }

    let displayLogs = getLogsForMonth(worker, currentGlobalMonth);

    if (displayLogs.length === 0) { if (hist) hist.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:24px;background:var(--input-bg);border-radius:var(--radius-md);">${t('msg-no-logs-month')}</p>`; return; }

    displayLogs.forEach(log => {
        const div = document.createElement('div'); div.className = 'log-entry';

        let typeBadge = '';
        if (log.noteType === 'vacation' || log.score === 'vacation') {
            typeBadge = `<span class="badge" style="background:var(--warning); color:var(--text-main);">${t('badge-vacation')}</span>`;
        } else if (log.noteType === 'good' || log.score == 100) {
            typeBadge = `<span class="badge badge-good">${t('badge-good-note')}</span>`;
        } else {
            typeBadge = `<span class="badge badge-bad">${t('badge-bad-note')}</span>`;
        }

        let delBtn = isAdmin ? `<button class="btn-outline-danger admin-only" style="padding:4px 8px;font-size:0.75rem;border:none;text-decoration:underline;" onclick="deleteLog('${worker.id}', '${log.date}')">${t('btn-delete')}</button>` : '';
        div.innerHTML = `
                    <div class="flex-between log-date"><strong style="color:var(--text-main);">📅 ${log.date}</strong><div style="display:flex;align-items:center;gap:8px;">${typeBadge} ${delBtn}</div></div>
                    <div class="log-note-text">${log.note ? log.note : `<em style="color:var(--text-muted);">${t('msg-no-manual-notes')}</em>`}</div>`;
        if (hist) hist.appendChild(div);
    });
}

// FINANCIAL TAB RENDERING

// --- AUTOMATIC IN-SCOPE WINDOW EXPORTS ---
if (typeof renderWorkerViolationPanel === 'function') window.renderWorkerViolationPanel = renderWorkerViolationPanel;
if (typeof renderBranches === 'function') window.renderBranches = renderBranches;
if (typeof populateWorkerDropdowns === 'function') window.populateWorkerDropdowns = populateWorkerDropdowns;
if (typeof renderOpsWorkersTable === 'function') window.renderOpsWorkersTable = renderOpsWorkersTable;
if (typeof renderOpsDetails === 'function') window.renderOpsDetails = renderOpsDetails;
