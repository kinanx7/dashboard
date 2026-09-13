/**
 * Daily Executive Operations Digest & Manager Log Automation
 * 
 * Aggregates daily metrics across all portal companies:
 * - Sales for this day (POS & Online marketplace)
 * - Total tasks completed today
 * - Absent workers (count & names)
 * - Violations recorded today (workers, amounts, reasons)
 * - Workers rewarded today (workers, amounts, reasons)
 * - Workers with accepted payment requests
 * - Workers with accepted custody requests
 * - Per-company inclusion toggles & automated daily scheduled dispatch to managers via WhatsApp.
 */

var dailyDigestConfig = {
    enabled: true,
    scheduledTime: "23:00",
    managers: [],
    options: {
        sales: true,
        tasks: true,
        absent: true,
        violations: true,
        rewards: true,
        payments: true,
        custody: true
    },
    excludedCompanies: [],
    lastSentDate: ""
};

var _digestSchedulerInterval = null;
var _compiledDigestCache = "";

// --- INITIALIZE DIGEST MODULE ---
function initDailyDigestModule() {
    loadDailyDigestConfig();
    setupDailyDigestFirebaseListener();
    renderDailyDigestSection();
    initDailyDigestScheduler();
}
window.initDailyDigestModule = initDailyDigestModule;

// Load config from localStorage
function loadDailyDigestConfig() {
    try {
        const saved = localStorage.getItem('mvc_daily_digest_config');
        if (saved) {
            const parsed = JSON.parse(saved);
            dailyDigestConfig = Object.assign({}, dailyDigestConfig, parsed);
            if (!dailyDigestConfig.options) {
                dailyDigestConfig.options = { sales: true, tasks: true, absent: true, violations: true, rewards: true, payments: true, custody: true };
            }
            if (!Array.isArray(dailyDigestConfig.managers)) dailyDigestConfig.managers = [];
            if (!Array.isArray(dailyDigestConfig.excludedCompanies)) dailyDigestConfig.excludedCompanies = [];
        }
    } catch (e) {
        console.warn("Error loading daily digest config from localStorage:", e);
    }
}

// Setup real-time Firebase synchronization
function setupDailyDigestFirebaseListener() {
    if (typeof db === 'undefined' || !db) return;
    try {
        db.ref('system_settings/daily_digest').on('value', snap => {
            if (snap.exists()) {
                const data = snap.val();
                if (data && typeof data === 'object') {
                    dailyDigestConfig = Object.assign({}, dailyDigestConfig, data);
                    if (!dailyDigestConfig.options) {
                        dailyDigestConfig.options = { sales: true, tasks: true, absent: true, violations: true, rewards: true, payments: true, custody: true };
                    }
                    if (!Array.isArray(dailyDigestConfig.managers)) dailyDigestConfig.managers = [];
                    if (!Array.isArray(dailyDigestConfig.excludedCompanies)) dailyDigestConfig.excludedCompanies = [];
                    try {
                        localStorage.setItem('mvc_daily_digest_config', JSON.stringify(dailyDigestConfig));
                    } catch (e) { }
                    renderDailyDigestSection();
                }
            }
        });
    } catch (e) {
        console.warn("Failed to attach Firebase listener for daily digest:", e);
    }
}

// Save config to Firebase and localStorage
function saveDailyDigestSettings(quiet = false) {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    
    // Read input values
    const enableEl = document.getElementById('digest-enable-toggle');
    if (enableEl) dailyDigestConfig.enabled = enableEl.checked;

    const timeEl = document.getElementById('digest-scheduled-time');
    if (timeEl && timeEl.value) dailyDigestConfig.scheduledTime = timeEl.value;

    const optSales = document.getElementById('digest-inc-sales');
    const optTasks = document.getElementById('digest-inc-tasks');
    const optAbsent = document.getElementById('digest-inc-absent');
    const optViolations = document.getElementById('digest-inc-violations');
    const optRewards = document.getElementById('digest-inc-rewards');
    const optPayments = document.getElementById('digest-inc-payments');
    const optCustody = document.getElementById('digest-inc-custody');

    dailyDigestConfig.options = {
        sales: optSales ? optSales.checked : true,
        tasks: optTasks ? optTasks.checked : true,
        absent: optAbsent ? optAbsent.checked : true,
        violations: optViolations ? optViolations.checked : true,
        rewards: optRewards ? optRewards.checked : true,
        payments: optPayments ? optPayments.checked : true,
        custody: optCustody ? optCustody.checked : true
    };

    try {
        localStorage.setItem('mvc_daily_digest_config', JSON.stringify(dailyDigestConfig));
    } catch (e) { }

    if (typeof db !== 'undefined' && db) {
        db.ref('system_settings/daily_digest').set(dailyDigestConfig).then(() => {
            if (!quiet) {
                alert(isAr ? "✅ تم حفظ إعدادات السجل والتقرير اليومي بنجاح!" : "✅ Daily digest settings saved successfully!");
            }
        }).catch(err => {
            console.error("Error saving daily digest settings:", err);
            if (!quiet) {
                alert(isAr ? "⚠️ تم الحفظ محلياً فقط." : "⚠️ Saved locally only.");
            }
        });
    } else if (!quiet) {
        alert(isAr ? "✅ تم حفظ الإعدادات محلياً!" : "✅ Settings saved locally!");
    }

    renderDailyDigestSection();
}
window.saveDailyDigestSettings = saveDailyDigestSettings;

// Render UI Components
function renderDailyDigestSection() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    // 1. Status Badge
    const badge = document.getElementById('digest-status-badge');
    if (badge) {
        if (dailyDigestConfig.enabled) {
            badge.style.background = 'rgba(16,185,129,0.15)';
            badge.style.color = '#10b981';
            badge.style.borderColor = 'rgba(16,185,129,0.3)';
            badge.textContent = isAr 
                ? `⏰ مفعّل يومياً (${dailyDigestConfig.scheduledTime || '23:00'} بتوقيت الرياض)` 
                : `⏰ Scheduled Daily (${dailyDigestConfig.scheduledTime || '23:00'} KSA)`;
        } else {
            badge.style.background = 'rgba(239,68,68,0.15)';
            badge.style.color = '#ef4444';
            badge.style.borderColor = 'rgba(239,68,68,0.3)';
            badge.textContent = isAr ? '⛔ متوقف مؤقتاً' : '⛔ Paused';
        }
    }

    // 2. Master Enable Toggle
    const enableEl = document.getElementById('digest-enable-toggle');
    if (enableEl) enableEl.checked = dailyDigestConfig.enabled !== false;

    // 3. Scheduled Time
    const timeEl = document.getElementById('digest-scheduled-time');
    if (timeEl && dailyDigestConfig.scheduledTime) timeEl.value = dailyDigestConfig.scheduledTime;

    // 4. Content Options Checkboxes
    const opts = dailyDigestConfig.options || {};
    const optSales = document.getElementById('digest-inc-sales');
    const optTasks = document.getElementById('digest-inc-tasks');
    const optAbsent = document.getElementById('digest-inc-absent');
    const optViolations = document.getElementById('digest-inc-violations');
    const optRewards = document.getElementById('digest-inc-rewards');
    const optPayments = document.getElementById('digest-inc-payments');
    const optCustody = document.getElementById('digest-inc-custody');

    if (optSales) optSales.checked = opts.sales !== false;
    if (optTasks) optTasks.checked = opts.tasks !== false;
    if (optAbsent) optAbsent.checked = opts.absent !== false;
    if (optViolations) optViolations.checked = opts.violations !== false;
    if (optRewards) optRewards.checked = opts.rewards !== false;
    if (optPayments) optPayments.checked = opts.payments !== false;
    if (optCustody) optCustody.checked = opts.custody !== false;

    // 5. Managers List
    renderDigestManagersList();

    // 6. Companies Grid
    renderDigestCompaniesGrid();

    // 7. Update Live Preview
    updateDigestPreview();
}
window.renderDailyDigestSection = renderDailyDigestSection;

// Render Managers List Pills
function renderDigestManagersList() {
    const listEl = document.getElementById('digest-managers-list');
    if (!listEl) return;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    const managers = dailyDigestConfig.managers || [];
    if (managers.length === 0) {
        listEl.innerHTML = `
            <div style="font-size:0.8rem; color:var(--text-muted); padding:4px; width:100%; text-align:center;">
                ${isAr ? '⚠️ لا توجد أرقام هواتف للمدراء مسجلة حتى الآن. أضف رقم مدير أعلاه لتلقي التقرير اليومي.' : '⚠️ No manager numbers registered yet. Add a manager phone number above to receive the daily log.'}
            </div>
        `;
        return;
    }

    listEl.innerHTML = managers.map(phone => {
        return `
            <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.3); border-radius:20px; padding:4px 12px; font-size:0.82rem; font-weight:800; color:#3b82f6;">
                <span>📱 ${phone}</span>
                <button type="button" onclick="removeDigestManagerPhone('${phone}')" title="${isAr ? 'حذف هذا الرقم' : 'Remove'}" style="background:none; border:none; color:#ef4444; font-size:0.85rem; font-weight:900; cursor:pointer; padding:0 2px; line-height:1;">✕</button>
            </div>
        `;
    }).join('');
}

// Add Manager Phone
function addDigestManagerPhone() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const input = document.getElementById('digest-new-manager-phone');
    if (!input) return;

    let phone = input.value.trim().replace(/[\s\-\+\(\)]/g, '');
    if (!phone) {
        alert(isAr ? "يرجى كتابة رقم هاتف المدير مع المفتاح الدولي (مثل: 966501234567)" : "Please enter the manager's phone with country code (e.g. 966501234567)");
        return;
    }

    // Auto prepend 966 if entered local Saudi 05...
    if (phone.startsWith('05') && phone.length === 10) {
        phone = '966' + phone.slice(1);
    }

    if (phone.length < 8) {
        alert(isAr ? "رقم الهاتف غير صالح!" : "Invalid phone number!");
        return;
    }

    if (!dailyDigestConfig.managers) dailyDigestConfig.managers = [];
    if (dailyDigestConfig.managers.includes(phone)) {
        alert(isAr ? "هذا الرقم مسجل بالفعل!" : "This number is already added!");
        return;
    }

    dailyDigestConfig.managers.push(phone);
    input.value = '';
    saveDailyDigestSettings(true);
}
window.addDigestManagerPhone = addDigestManagerPhone;

// Remove Manager Phone
function removeDigestManagerPhone(phone) {
    if (!dailyDigestConfig.managers) return;
    dailyDigestConfig.managers = dailyDigestConfig.managers.filter(p => p !== phone);
    saveDailyDigestSettings(true);
}
window.removeDigestManagerPhone = removeDigestManagerPhone;

// Render Companies Matrix Grid
function renderDigestCompaniesGrid() {
    const gridEl = document.getElementById('digest-companies-grid');
    if (!gridEl) return;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    const companies = window.portalCompanies || {
        burgeroov: { id: 'burgeroov', name: 'BURGEROOV', logo: 'burgeroov.png' },
        mvc: { id: 'mvc', name: 'MVC', logo: 'mvc.png' },
        mvcfresh: { id: 'mvcfresh', name: 'MVC Fresh', logo: 'mvcfresh.png' }
    };

    const excluded = dailyDigestConfig.excludedCompanies || [];

    const keys = Object.keys(companies);
    if (keys.length === 0) {
        gridEl.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem;">No companies available.</div>`;
        return;
    }

    gridEl.innerHTML = keys.map(slug => {
        const comp = companies[slug] || { id: slug, name: slug };
        const isExcluded = excluded.includes(slug);
        const isIncluded = !isExcluded;
        const logo = comp.logo || `${slug}.png`;
        const name = comp.name || slug.toUpperCase();

        return `
            <div style="background:var(--card-bg); border-radius:12px; border:1px solid ${isIncluded ? 'rgba(16,185,129,0.4)' : 'var(--border-color)'}; padding:14px 16px; display:flex; align-items:center; justify-content:space-between; transition:all 0.2s ease;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="${logo}" onerror="this.src='burgeroov.png'" style="width:38px; height:38px; border-radius:8px; object-fit:contain; background:rgba(0,0,0,0.05); padding:2px; border:1px solid var(--border-color);">
                    <div>
                        <div style="font-weight:800; font-size:0.95rem; color:var(--text-main);">${name}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">ID: ${slug}</div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:0.78rem; font-weight:800; color:${isIncluded ? '#10b981' : '#ef4444'};">
                        ${isIncluded ? (isAr ? 'مشمولة بالتقرير ✅' : 'Included ✅') : (isAr ? 'مستبعدة ⛔' : 'Excluded ⛔')}
                    </span>
                    <label class="switch" style="position:relative; display:inline-block; width:44px; height:24px;">
                        <input type="checkbox" ${isIncluded ? 'checked' : ''} onchange="toggleDigestCompany('${slug}')">
                        <span class="slider round" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#ccc; transition:.4s; border-radius:34px;"></span>
                    </label>
                </div>
            </div>
        `;
    }).join('');
}

// Toggle Company Inclusion
function toggleDigestCompany(slug) {
    if (!dailyDigestConfig.excludedCompanies) dailyDigestConfig.excludedCompanies = [];
    const idx = dailyDigestConfig.excludedCompanies.indexOf(slug);
    if (idx > -1) {
        dailyDigestConfig.excludedCompanies.splice(idx, 1);
    } else {
        dailyDigestConfig.excludedCompanies.push(slug);
    }
    saveDailyDigestSettings(true);
}
window.toggleDigestCompany = toggleDigestCompany;

// --- DAILY DIGEST DATA COMPILER ---
// Asynchronously collects data for all included companies and builds the message
async function compileDailyDigest(targetDateStr = null) {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    
    // Determine KSA date (GMT+3)
    const now = new Date();
    const ksaOffset = 3 * 60; // UTC+3 in minutes
    const localOffset = now.getTimezoneOffset(); // in minutes
    const ksaTime = new Date(now.getTime() + (localOffset + ksaOffset) * 60000);

    const year = ksaTime.getFullYear();
    const monthStr = String(ksaTime.getMonth() + 1).padStart(2, '0');
    const dayStr = String(ksaTime.getDate()).padStart(2, '0');
    const today = targetDateStr || `${year}-${monthStr}-${dayStr}`;
    const targetMonth = today.slice(0, 7);

    const companies = window.portalCompanies || {
        burgeroov: { id: 'burgeroov', name: 'BURGEROOV' },
        mvc: { id: 'mvc', name: 'MVC' },
        mvcfresh: { id: 'mvcfresh', name: 'MVC Fresh' }
    };

    const excluded = dailyDigestConfig.excludedCompanies || [];
    const opts = dailyDigestConfig.options || { sales: true, tasks: true, absent: true, violations: true, rewards: true, payments: true, custody: true };

    const includedSlugs = Object.keys(companies).filter(s => !excluded.includes(s));
    
    // Overall Grand Totals
    let grandTotalSales = 0;
    let grandTotalTasks = 0;
    let grandTotalAbsent = 0;
    let grandTotalViolationsAmt = 0;
    let grandTotalViolationsCount = 0;
    let grandTotalRewardsAmt = 0;
    let grandTotalRewardsCount = 0;
    let grandTotalPaymentsAmt = 0;
    let grandTotalPaymentsCount = 0;
    let grandTotalCustodyAmt = 0;
    let grandTotalCustodyCount = 0;

    let companyBlocks = [];

    for (const slug of includedSlugs) {
        const compMeta = companies[slug] || { id: slug, name: slug.toUpperCase() };
        const compName = compMeta.name || slug.toUpperCase();

        let compData = {};
        if (slug === window.currentCompany && typeof getCompanyData === 'function') {
            compData = getCompanyData();
        } else if (typeof db !== 'undefined' && db) {
            try {
                const snap = await db.ref(`companies/${slug}`).once('value');
                if (snap.exists()) compData = snap.val() || {};
            } catch (e) {
                console.warn(`Could not fetch data for ${slug}:`, e);
            }
        }

        const workers = compData.workers ? (Array.isArray(compData.workers) ? compData.workers : Object.values(compData.workers)) : [];
        const attendance = compData.attendance || {};
        const todayAtt = attendance[today] || {};

        // 1. Sales Calculation
        let compSalesTotal = 0;
        let posSalesToday = 0;
        let marketSalesToday = 0;

        if (opts.sales) {
            const salesLogs = compData.salesLogs ? (Array.isArray(compData.salesLogs) ? compData.salesLogs : Object.values(compData.salesLogs)) : [];
            salesLogs.forEach(l => {
                if (!l) return;
                const dKey = (typeof normalizeDateStr === 'function') ? normalizeDateStr(l.date || l.timestamp || l.createdAt) : (l.dateStr || l.date);
                if (dKey === today) {
                    posSalesToday += parseFloat(l.amount || 0);
                }
            });

            const marketOrders = compData.marketOrders ? (Array.isArray(compData.marketOrders) ? compData.marketOrders : Object.values(compData.marketOrders)) : [];
            marketOrders.forEach(o => {
                if (!o) return;
                const dKey = (typeof normalizeDateStr === 'function') ? normalizeDateStr(o.date || o.createdAt) : (o.dateStr || o.date);
                if (dKey === today) {
                    marketSalesToday += parseFloat(o.totalCost || o.price || 0);
                }
            });

            compSalesTotal = posSalesToday + marketSalesToday;
            grandTotalSales += compSalesTotal;
        }

        // 2. Tasks Done Today
        let compTasksDone = 0;
        let completedTaskTitles = [];
        if (opts.tasks) {
            workers.forEach(w => {
                if (!w || !w.jobs) return;
                const jobs = Array.isArray(w.jobs) ? w.jobs : Object.values(w.jobs);
                jobs.forEach(j => {
                    if (!j) return;
                    const isDone = (j.done === true || j.status === 'completed');
                    if (isDone) {
                        let isToday = false;
                        if (j.completedAt) {
                            const doneDate = (typeof normalizeDateStr === 'function') ? normalizeDateStr(j.completedAt) : '';
                            if (doneDate === today) isToday = true;
                        }
                        if (!isToday && j.assignedDate && j.assignedDate === today) isToday = true;
                        if (!isToday && !j.completedAt && !j.assignedDate) isToday = true; // General done today

                        if (isToday) {
                            compTasksDone++;
                            if (completedTaskTitles.length < 4) {
                                completedTaskTitles.push(`${w.name}: "${j.title || 'Task'}"`);
                            }
                        }
                    }
                });
            });

            // Also check generalTasks
            const genTasks = compData.generalTasks ? (Array.isArray(compData.generalTasks) ? compData.generalTasks : Object.values(compData.generalTasks)) : [];
            genTasks.forEach(gt => {
                if (gt && (gt.done || gt.status === 'completed')) {
                    const d = (typeof normalizeDateStr === 'function') ? normalizeDateStr(gt.completedAt || gt.date) : '';
                    if (d === today) compTasksDone++;
                }
            });

            grandTotalTasks += compTasksDone;
        }

        // 3. Absent Workers
        let absentWorkers = [];
        if (opts.absent) {
            workers.forEach(w => {
                if (!w) return;
                const rec = todayAtt[w.id];
                if (rec && rec.status === 'absent') {
                    absentWorkers.push(`${w.name}${w.role ? ` (${w.role})` : ''}`);
                }
            });
            grandTotalAbsent += absentWorkers.length;
        }

        // 4. Violations Today
        let violationsToday = [];
        let compViolationsAmt = 0;
        if (opts.violations) {
            workers.forEach(w => {
                if (!w || !w.monthlyStats) return;
                const mStats = w.monthlyStats[targetMonth] || {};
                const vList = mStats.violationsList || [];
                vList.forEach(v => {
                    if (!v || v.status === 'waived') return;
                    const vDate = (typeof normalizeDateStr === 'function') ? normalizeDateStr(v.date || v.timestamp) : '';
                    if (vDate === today) {
                        const amt = parseFloat(v.amount || 0);
                        compViolationsAmt += amt;
                        violationsToday.push(`${w.name}: ${amt.toFixed(2)} SR (${v.reason || 'Violation'})`);
                    }
                });
            });
            grandTotalViolationsAmt += compViolationsAmt;
            grandTotalViolationsCount += violationsToday.length;
        }

        // 5. Rewards Today
        let rewardsToday = [];
        let compRewardsAmt = 0;
        if (opts.rewards) {
            workers.forEach(w => {
                if (!w || !w.monthlyStats) return;
                const mStats = w.monthlyStats[targetMonth] || {};
                const rList = mStats.rewardsList || [];
                rList.forEach(r => {
                    if (!r) return;
                    const rDate = (typeof normalizeDateStr === 'function') ? normalizeDateStr(r.date || r.timestamp) : '';
                    if (rDate === today) {
                        const amt = parseFloat(r.amount || 0);
                        compRewardsAmt += amt;
                        rewardsToday.push(`${w.name}: ${amt.toFixed(2)} SR (${r.reason || 'Reward'})`);
                    }
                });
            });
            grandTotalRewardsAmt += compRewardsAmt;
            grandTotalRewardsCount += rewardsToday.length;
        }

        // 6. Accepted Payment Requests Today
        let acceptedPayments = [];
        let compPaymentsAmt = 0;
        if (opts.payments) {
            const pReqs = compData.paymentRequests ? Object.values(compData.paymentRequests) : [];
            pReqs.forEach(p => {
                if (!p) return;
                const isAccepted = ['accepted', 'approved', 'transferred', 'paid', 'approved_paid'].includes(String(p.status || '').toLowerCase());
                const pDate = (typeof normalizeDateStr === 'function') ? normalizeDateStr(p.date || p.timestamp || p.approvedAt) : '';
                if (isAccepted && (pDate === today || (!pDate && p.status === 'accepted'))) {
                    const amt = parseFloat(p.amount || 0);
                    compPaymentsAmt += amt;
                    acceptedPayments.push(`${p.workerName || 'Worker'}: ${amt.toFixed(2)} SR`);
                }
            });
            grandTotalPaymentsAmt += compPaymentsAmt;
            grandTotalPaymentsCount += acceptedPayments.length;
        }

        // 7. Accepted Custody Requests Today
        let acceptedCustody = [];
        let compCustodyAmt = 0;
        if (opts.custody) {
            const cReqs = compData.custodyRequests ? Object.values(compData.custodyRequests) : [];
            cReqs.forEach(c => {
                if (!c) return;
                const isAccepted = ['accepted', 'approved'].includes(String(c.status || '').toLowerCase());
                const cDate = (typeof normalizeDateStr === 'function') ? normalizeDateStr(c.date || c.timestamp || c.approvedAt) : '';
                if (isAccepted && (cDate === today || (!cDate && c.status === 'accepted'))) {
                    const amt = parseFloat(c.amount || 0);
                    compCustodyAmt += amt;
                    acceptedCustody.push(`${c.workerName || 'Worker'}: ${amt.toFixed(2)} SR`);
                }
            });
            grandTotalCustodyAmt += compCustodyAmt;
            grandTotalCustodyCount += acceptedCustody.length;
        }

        // Build Block for this company
        let block = `🏢 *${compName}*\n`;

        if (opts.sales) {
            if (marketSalesToday > 0) {
                block += isAr
                    ? `💰 *المبيعات:* ${compSalesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س (نقاط البيع: ${posSalesToday.toFixed(2)} | المتجر: ${marketSalesToday.toFixed(2)})\n`
                    : `💰 *Sales:* ${compSalesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} SR (POS: ${posSalesToday.toFixed(2)} | Store: ${marketSalesToday.toFixed(2)})\n`;
            } else {
                block += isAr
                    ? `💰 *المبيعات:* ${compSalesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س\n`
                    : `💰 *Sales:* ${compSalesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} SR\n`;
            }
        }

        if (opts.tasks) {
            block += isAr
                ? `📋 *المهام المنجزة اليوم:* ${compTasksDone} مهمة\n`
                : `📋 *Tasks Completed Today:* ${compTasksDone} tasks\n`;
        }

        if (opts.absent) {
            if (absentWorkers.length > 0) {
                block += isAr
                    ? `🚫 *الموظفون الغائبون (${absentWorkers.length}):*\n  • ${absentWorkers.join('\n  • ')}\n`
                    : `🚫 *Absent Workers (${absentWorkers.length}):*\n  • ${absentWorkers.join('\n  • ')}\n`;
            } else {
                block += isAr
                    ? `🚫 *الموظفون الغائبون:* لا يوجد غياب اليوم ✅\n`
                    : `🚫 *Absent Workers:* None (All present) ✅\n`;
            }
        }

        if (opts.violations) {
            if (violationsToday.length > 0) {
                block += isAr
                    ? `⚠️ *المخالفات المسجلة اليوم (${violationsToday.length} - ${compViolationsAmt.toFixed(2)} ر.س):*\n  • ${violationsToday.join('\n  • ')}\n`
                    : `⚠️ *Violations Today (${violationsToday.length} - ${compViolationsAmt.toFixed(2)} SR):*\n  • ${violationsToday.join('\n  • ')}\n`;
            } else {
                block += isAr
                    ? `⚠️ *المخالفات المسجلة اليوم:* لا يوجد مخالفات\n`
                    : `⚠️ *Violations Today:* None\n`;
            }
        }

        if (opts.rewards) {
            if (rewardsToday.length > 0) {
                block += isAr
                    ? `🎁 *المكافآت المسجلة اليوم (${rewardsToday.length} - ${compRewardsAmt.toFixed(2)} ر.س):*\n  • ${rewardsToday.join('\n  • ')}\n`
                    : `🎁 *Rewards Today (${rewardsToday.length} - ${compRewardsAmt.toFixed(2)} SR):*\n  • ${rewardsToday.join('\n  • ')}\n`;
            } else {
                block += isAr
                    ? `🎁 *المكافآت المسجلة اليوم:* لا يوجد مكافآت\n`
                    : `🎁 *Rewards Today:* None\n`;
            }
        }

        if (opts.payments) {
            if (acceptedPayments.length > 0) {
                block += isAr
                    ? `💵 *طلبات الصرف المقبولة (${acceptedPayments.length} - ${compPaymentsAmt.toFixed(2)} ر.س):*\n  • ${acceptedPayments.join('\n  • ')}\n`
                    : `💵 *Accepted Payment Requests (${acceptedPayments.length} - ${compPaymentsAmt.toFixed(2)} SR):*\n  • ${acceptedPayments.join('\n  • ')}\n`;
            } else {
                block += isAr
                    ? `💵 *طلبات الصرف المقبولة:* لا يوجد\n`
                    : `💵 *Accepted Payment Requests:* None\n`;
            }
        }

        if (opts.custody) {
            if (acceptedCustody.length > 0) {
                block += isAr
                    ? `📦 *طلبات العهدة المقبولة (${acceptedCustody.length} - ${compCustodyAmt.toFixed(2)} ر.س):*\n  • ${acceptedCustody.join('\n  • ')}\n`
                    : `📦 *Accepted Custody Requests (${acceptedCustody.length} - ${compCustodyAmt.toFixed(2)} SR):*\n  • ${acceptedCustody.join('\n  • ')}\n`;
            } else {
                block += isAr
                    ? `📦 *طلبات العهدة المقبولة:* لا يوجد\n`
                    : `📦 *Accepted Custody Requests:* None\n`;
            }
        }

        companyBlocks.push(block.trim());
    }

    // Header & Meta Info
    const timeFormatted = `${String(ksaTime.getHours()).padStart(2, '0')}:${String(ksaTime.getMinutes()).padStart(2, '0')}`;
    let finalMessage = "";

    if (isAr) {
        finalMessage += `📊 *تقرير وسجل العمليات اليومي للمدراء*\n`;
        finalMessage += `📅 *التاريخ:* ${today}\n`;
        finalMessage += `⏰ *وقت الإرسال:* ${timeFormatted} بتوقيت الرياض (KSA)\n`;
        finalMessage += `━━━━━━━━━━━━━━━━━━━\n\n`;

        finalMessage += companyBlocks.join('\n\n━━━━━━━━━━━━━━━━━━━\n\n') + '\n\n';

        finalMessage += `━━━━━━━━━━━━━━━━━━━\n`;
        finalMessage += `📈 *الملخص العام لجميع الشركات:*\n`;
        if (opts.sales) finalMessage += `💰 *إجمالي المبيعات:* ${grandTotalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س\n`;
        if (opts.tasks) finalMessage += `📋 *إجمالي المهام المنجزة:* ${grandTotalTasks} مهمة\n`;
        if (opts.absent) finalMessage += `🚫 *إجمالي الغياب:* ${grandTotalAbsent} موظف\n`;
        if (opts.violations) finalMessage += `⚠️ *إجمالي المخالفات:* ${grandTotalViolationsCount} (${grandTotalViolationsAmt.toFixed(2)} ر.س)\n`;
        if (opts.rewards) finalMessage += `🎁 *إجمالي المكافآت:* ${grandTotalRewardsCount} (${grandTotalRewardsAmt.toFixed(2)} ر.س)\n`;
        if (opts.payments) finalMessage += `💵 *إجمالي الصرف المقبول:* ${grandTotalPaymentsCount} (${grandTotalPaymentsAmt.toFixed(2)} ر.س)\n`;
        if (opts.custody) finalMessage += `📦 *إجمالي العهد المقبولة:* ${grandTotalCustodyCount} (${grandTotalCustodyAmt.toFixed(2)} ر.س)\n`;
        finalMessage += `━━━━━━━━━━━━━━━━━━━\n`;
        finalMessage += `_تم توليد التقرير تلقائياً عبر لوحة التحكم_`;
    } else {
        finalMessage += `📊 *Daily Executive Operations Log for Managers*\n`;
        finalMessage += `📅 *Date:* ${today}\n`;
        finalMessage += `⏰ *Dispatched:* ${timeFormatted} KSA (Riyadh Time)\n`;
        finalMessage += `━━━━━━━━━━━━━━━━━━━\n\n`;

        finalMessage += companyBlocks.join('\n\n━━━━━━━━━━━━━━━━━━━\n\n') + '\n\n';

        finalMessage += `━━━━━━━━━━━━━━━━━━━\n`;
        finalMessage += `📈 *Grand Totals Across All Companies:*\n`;
        if (opts.sales) finalMessage += `💰 *Total Sales:* ${grandTotalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })} SR\n`;
        if (opts.tasks) finalMessage += `📋 *Total Tasks Done:* ${grandTotalTasks} tasks\n`;
        if (opts.absent) finalMessage += `🚫 *Total Absent Workers:* ${grandTotalAbsent}\n`;
        if (opts.violations) finalMessage += `⚠️ *Total Violations:* ${grandTotalViolationsCount} (${grandTotalViolationsAmt.toFixed(2)} SR)\n`;
        if (opts.rewards) finalMessage += `🎁 *Total Rewards:* ${grandTotalRewardsCount} (${grandTotalRewardsAmt.toFixed(2)} SR)\n`;
        if (opts.payments) finalMessage += `💵 *Total Accepted Payments:* ${grandTotalPaymentsCount} (${grandTotalPaymentsAmt.toFixed(2)} SR)\n`;
        if (opts.custody) finalMessage += `📦 *Total Accepted Custody:* ${grandTotalCustodyCount} (${grandTotalCustodyAmt.toFixed(2)} SR)\n`;
        finalMessage += `━━━━━━━━━━━━━━━━━━━\n`;
        finalMessage += `_Automated Executive Operations Summary_`;
    }

    _compiledDigestCache = finalMessage;
    return finalMessage;
}
window.compileDailyDigest = compileDailyDigest;

// Update Real-Time Preview
async function updateDigestPreview() {
    const previewBox = document.getElementById('digest-live-preview-box');
    const charCountEl = document.getElementById('digest-preview-char-count');
    if (!previewBox) return;

    previewBox.textContent = "⏳ Generating live preview from all active company databases...";
    try {
        const text = await compileDailyDigest();
        previewBox.textContent = text;
        if (charCountEl) {
            charCountEl.textContent = `${text.length} characters`;
        }
    } catch (e) {
        console.error("Error updating digest preview:", e);
        previewBox.textContent = "⚠️ Error generating preview: " + e.message;
    }
}
window.updateDigestPreview = updateDigestPreview;

// Copy Report Text to Clipboard
function copyDigestReportText() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (!_compiledDigestCache) {
        compileDailyDigest().then(text => {
            navigator.clipboard.writeText(text);
            alert(isAr ? "📋 تم نسخ نص التقرير اليومي بنجاح!" : "📋 Daily digest text copied to clipboard!");
        });
    } else {
        navigator.clipboard.writeText(_compiledDigestCache);
        alert(isAr ? "📋 تم نسخ نص التقرير اليومي بنجاح!" : "📋 Daily digest text copied to clipboard!");
    }
}
window.copyDigestReportText = copyDigestReportText;

// Send Daily Digest Now
async function sendDailyDigestNow() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const managers = dailyDigestConfig.managers || [];

    if (managers.length === 0) {
        alert(isAr 
            ? "⚠️ يرجى إضافة رقم هاتف مدير واحد على الأقل في قسم 'أرقام هواتف المدراء' قبل الإرسال." 
            : "⚠️ Please add at least one manager phone number in the 'Managers Contacts' section before sending.");
        return;
    }

    const confirmMsg = isAr
        ? `هل أنت متأكد من إرسال سجل العمليات اليومي الآن عبر الواتساب إلى [${managers.length}] من المدراء؟`
        : `Are you sure you want to send today's operations log now via WhatsApp to [${managers.length}] managers?`;

    if (!confirm(confirmMsg)) return;

    const serverUrlInput = document.getElementById('wa-server-url');
    let rawBaseUrl = (serverUrlInput ? serverUrlInput.value.trim() : '') || 'https://burgeroov-notify.onrender.com';
    let baseUrl = rawBaseUrl.replace(/\/+$/, '');

    const messageText = await compileDailyDigest();

    let successCount = 0;
    let failedCount = 0;

    for (const phone of managers) {
        try {
            const res = await fetch(`${baseUrl}/wa/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: phone,
                    text: messageText
                })
            });

            if (res.ok) {
                successCount++;
            } else {
                failedCount++;
                // Fallback: open WhatsApp link in new tab if requested or failed
                console.warn(`Gateway returned status ${res.status} for ${phone}`);
            }
        } catch (e) {
            console.error(`Network error sending to ${phone}:`, e);
            failedCount++;
        }
    }

    // Update lastSentDate
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    dailyDigestConfig.lastSentDate = todayStr;
    saveDailyDigestSettings(true);

    if (failedCount === 0) {
        alert(isAr 
            ? `✅ تم إرسال التقرير اليومي بنجاح إلى جميع المدراء (${successCount})!` 
            : `✅ Daily operations log sent successfully to all (${successCount}) managers!`);
    } else {
        const directWaUrl = `https://wa.me/?text=${encodeURIComponent(messageText)}`;
        if (confirm(isAr 
            ? `⚠️ تم إرسال (${successCount}) وفشل (${failedCount}) عبر بوابة الخادم (ربما يكون الخادم في وضع الاستعداد).\n\nهل تريد فتح الواتساب مباشرة لإرساله يدوياً؟` 
            : `⚠️ Sent (${successCount}) and failed (${failedCount}) via server gateway.\n\nWould you like to open WhatsApp directly to forward manually?`)) {
            window.open(directWaUrl, '_blank');
        }
    }
}
window.sendDailyDigestNow = sendDailyDigestNow;

// --- AUTOMATED BACKGROUND SCHEDULER ---
function initDailyDigestScheduler() {
    if (_digestSchedulerInterval) clearInterval(_digestSchedulerInterval);

    _digestSchedulerInterval = setInterval(() => {
        checkAndTriggerScheduledDigest();
    }, 30000); // Check every 30 seconds
}

async function checkAndTriggerScheduledDigest() {
    if (!dailyDigestConfig.enabled) return;
    const managers = dailyDigestConfig.managers || [];
    if (managers.length === 0) return;

    // Get KSA Time
    const now = new Date();
    const ksaOffset = 3 * 60; // UTC+3 in minutes
    const localOffset = now.getTimezoneOffset(); // in minutes
    const ksaTime = new Date(now.getTime() + (localOffset + ksaOffset) * 60000);

    const year = ksaTime.getFullYear();
    const monthStr = String(ksaTime.getMonth() + 1).padStart(2, '0');
    const dayStr = String(ksaTime.getDate()).padStart(2, '0');
    const todayStr = `${year}-${monthStr}-${dayStr}`;

    const currentHourStr = String(ksaTime.getHours()).padStart(2, '0');
    const currentMinStr = String(ksaTime.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHourStr}:${currentMinStr}`;

    const targetTime = dailyDigestConfig.scheduledTime || "23:00";

    // Trigger if time matches and has not yet been sent today
    if (currentTimeStr === targetTime && dailyDigestConfig.lastSentDate !== todayStr) {
        console.log(`⏰ [Daily Digest Scheduler] Triggering automatic daily log dispatch for ${todayStr} at ${currentTimeStr} KSA...`);
        
        dailyDigestConfig.lastSentDate = todayStr;
        saveDailyDigestSettings(true);

        const serverUrlInput = document.getElementById('wa-server-url');
        let rawBaseUrl = (serverUrlInput ? serverUrlInput.value.trim() : '') || 'https://burgeroov-notify.onrender.com';
        let baseUrl = rawBaseUrl.replace(/\/+$/, '');

        const messageText = await compileDailyDigest(todayStr);

        for (const phone of managers) {
            try {
                await fetch(`${baseUrl}/wa/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: phone,
                        text: messageText
                    })
                });
            } catch (err) {
                console.warn(`Scheduled send error for ${phone}:`, err);
            }
        }
    }
}

window.dailyDigestConfig = dailyDigestConfig;
