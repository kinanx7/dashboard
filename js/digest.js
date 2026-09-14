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
    language: "ar", // 'ar' (Arabic), 'en' (English), 'both' (Bilingual)
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
            if (!dailyDigestConfig.language) dailyDigestConfig.language = 'ar';
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
                    if (!dailyDigestConfig.language) dailyDigestConfig.language = 'ar';
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

// Master Enable / Disable Toggle Switch Handler
function toggleDigestMasterSwitch(checked) {
    dailyDigestConfig.enabled = !!checked;
    const enableEl = document.getElementById('digest-enable-toggle');
    if (enableEl) enableEl.checked = dailyDigestConfig.enabled;
    updateDigestStatusBadges();
    saveDailyDigestSettings(true);
}
window.toggleDigestMasterSwitch = toggleDigestMasterSwitch;

// Language Selector Handler ('ar', 'en', 'both')
function setDigestLanguage(lang) {
    if (!['ar', 'en', 'both'].includes(lang)) lang = 'ar';
    dailyDigestConfig.language = lang;
    updateDigestLanguageButtonsUI();
    saveDailyDigestSettings(true);
    updateDigestPreview();
}
window.setDigestLanguage = setDigestLanguage;

// Update Language Buttons UI state
function updateDigestLanguageButtonsUI() {
    const currentLang = dailyDigestConfig.language || 'ar';
    const btnAr = document.getElementById('btn-digest-lang-ar');
    const btnEn = document.getElementById('btn-digest-lang-en');
    const btnBoth = document.getElementById('btn-digest-lang-both');
    const tag = document.getElementById('digest-selected-lang-tag');

    if (btnAr) btnAr.classList.toggle('active', currentLang === 'ar');
    if (btnEn) btnEn.classList.toggle('active', currentLang === 'en');
    if (btnBoth) btnBoth.classList.toggle('active', currentLang === 'both');

    if (tag) {
        if (currentLang === 'ar') tag.textContent = '🇸🇦 العربية فقط';
        else if (currentLang === 'en') tag.textContent = '🇬🇧 English Only';
        else tag.textContent = '🌐 كلا اللغتين (Arabic & English)';
    }
}

// Update Status Badges in top header & toggle area
function updateDigestStatusBadges() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const badge = document.getElementById('digest-status-badge');
    const toggleBadge = document.getElementById('digest-toggle-status-badge');

    if (dailyDigestConfig.enabled) {
        if (badge) {
            badge.style.background = 'rgba(16,185,129,0.15)';
            badge.style.color = '#10b981';
            badge.style.borderColor = 'rgba(16,185,129,0.3)';
            badge.textContent = isAr 
                ? `⏰ مفعّل يومياً (${dailyDigestConfig.scheduledTime || '23:00'} بتوقيت الرياض)` 
                : `⏰ Scheduled Daily (${dailyDigestConfig.scheduledTime || '23:00'} KSA)`;
        }
        if (toggleBadge) {
            toggleBadge.style.background = 'rgba(16,185,129,0.15)';
            toggleBadge.style.color = '#10b981';
            toggleBadge.style.borderColor = 'rgba(16,185,129,0.3)';
            toggleBadge.textContent = '🟢 ACTIVE (مفعّل)';
        }
    } else {
        if (badge) {
            badge.style.background = 'rgba(239,68,68,0.15)';
            badge.style.color = '#ef4444';
            badge.style.borderColor = 'rgba(239,68,68,0.3)';
            badge.textContent = isAr ? '⛔ متوقف مؤقتاً' : '⛔ Paused';
        }
        if (toggleBadge) {
            toggleBadge.style.background = 'rgba(239,68,68,0.15)';
            toggleBadge.style.color = '#ef4444';
            toggleBadge.style.borderColor = 'rgba(239,68,68,0.3)';
            toggleBadge.textContent = '⛔ PAUSED (متوقف)';
        }
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

// Time interpretation and preset utilities
function formatDigestTimeLabel(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') timeStr = "23:00";
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const mStr = String(m).padStart(2, '0');

    if (h === 0) {
        return {
            text: `🌙 12:${mStr} AM منتصف الليل (نهاية اليوم - Midnight)`,
            color: '#8b5cf6',
            bg: 'rgba(139,92,246,0.15)',
            border: 'rgba(139,92,246,0.35)'
        };
    } else if (h === 12) {
        return {
            text: `☀️ 12:${mStr} PM ظهراً (منتصف النهار - Noon)`,
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.15)',
            border: 'rgba(245,158,11,0.35)'
        };
    } else if (h < 12) {
        return {
            text: `🌅 ${h}:${mStr} AM صباحاً (Morning)`,
            color: '#06b6d4',
            bg: 'rgba(6,182,212,0.15)',
            border: 'rgba(6,182,212,0.35)'
        };
    } else {
        const h12 = h - 12;
        return {
            text: `⏰ ${h12}:${mStr} PM ليلاً (مساءً - Evening)`,
            color: '#3b82f6',
            bg: 'rgba(59,130,246,0.15)',
            border: 'rgba(59,130,246,0.35)'
        };
    }
}

function updateDigestTimeInterpretationBadge(timeVal) {
    const badge = document.getElementById('digest-time-interpretation-badge');
    if (!badge) return;
    const info = formatDigestTimeLabel(timeVal || dailyDigestConfig.scheduledTime || "23:00");
    badge.textContent = info.text;
    badge.style.color = info.color;
    badge.style.background = info.bg;
    badge.style.borderColor = info.border;
}
window.updateDigestTimeInterpretationBadge = updateDigestTimeInterpretationBadge;

function onDigestTimeInput(val) {
    if (!val) return;
    updateDigestTimeInterpretationBadge(val);
}
window.onDigestTimeInput = onDigestTimeInput;

function onDigestTimeChange(val) {
    if (!val) return;
    dailyDigestConfig.scheduledTime = val;
    updateDigestTimeInterpretationBadge(val);
    saveDailyDigestSettings(true);
}
window.onDigestTimeChange = onDigestTimeChange;

function setDigestPresetTime(val) {
    const input = document.getElementById('digest-scheduled-time');
    if (input) input.value = val;
    onDigestTimeChange(val);
}
window.setDigestPresetTime = setDigestPresetTime;

// Render UI Components
function renderDailyDigestSection() {
    // 1. Status Badges
    updateDigestStatusBadges();

    // 2. Master Enable Toggle
    const enableEl = document.getElementById('digest-enable-toggle');
    if (enableEl) enableEl.checked = dailyDigestConfig.enabled !== false;

    // 3. Language Selector Buttons
    updateDigestLanguageButtonsUI();

    // 4. Scheduled Time & Interpretation Badge
    const timeEl = document.getElementById('digest-scheduled-time');
    if (timeEl && dailyDigestConfig.scheduledTime) timeEl.value = dailyDigestConfig.scheduledTime;
    updateDigestTimeInterpretationBadge(dailyDigestConfig.scheduledTime || (timeEl ? timeEl.value : "23:00"));

    // 5. Content Options Checkboxes
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

    // 6. Managers List
    renderDigestManagersList();

    // 7. Companies Grid
    renderDigestCompaniesGrid();

    // 8. Update Live Preview
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

// --- BULLETPROOF DATE MATCHER FOR DAILY DIGEST ---
// Accurately matches epoch timestamps, ISO date strings, YYYY-MM-DD, and "Mmm DD, HH:MM" from formatTimestamp()
function isItemForDate(item, targetDateStr, localDateStr = '') {
    if (!item) return false;
    if (!targetDateStr) return false;

    const checkDates = [targetDateStr];
    if (localDateStr && localDateStr !== targetDateStr) {
        checkDates.push(localDateStr);
    }

    for (const dStr of checkDates) {
        const [tY, tM, tD] = dStr.split('-').map(Number);
        const startOfDay = new Date(tY, tM - 1, tD, 0, 0, 0, 0).getTime();
        const endOfDay = new Date(tY, tM - 1, tD, 23, 59, 59, 999).getTime();

        // 1. Check numeric timestamps (timestamp, createdAt, completedAt, approvedAt, confirmedAt)
        let ts = Number(item.timestamp || item.createdAt || item.completedAt || item.approvedAt || item.confirmedAt);
        if (!ts && item.id && /^\d{13,}$/.test(String(item.id))) {
            ts = Number(item.id);
        }
        if (ts > 0 && ts < 10000000000) ts *= 1000;
        if (ts > 0) {
            // Direct range check
            if (ts >= startOfDay && ts <= endOfDay) return true;
            // Date ISO check
            const d = new Date(ts);
            if (!isNaN(d.getTime())) {
                const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                if (iso === dStr) return true;
            }
        }

        // 2. Date string properties (dateStr, assignedDate, targetDate)
        const dProp = item.dateStr || item.assignedDate || item.targetDate;
        if (dProp && typeof dProp === 'string' && dProp.trim().startsWith(dStr)) return true;

        // 3. String date field (could be ISO, YYYY-MM-DD, or "Sep 13, 21:05")
        if (item.date && typeof item.date === 'string') {
            const clean = item.date.trim();
            if (clean.startsWith(dStr)) return true;

            // Check for 4-digit year format YYYY-MM-DD or YYYY/MM/DD
            const matchIso = clean.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
            if (matchIso) {
                const iso = matchIso[1] + '-' + String(matchIso[2]).padStart(2, '0') + '-' + String(matchIso[3]).padStart(2, '0');
                if (iso === dStr) return true;
            }

            // Check for format "Mmm DD, HH:MM" generated by formatTimestamp() (e.g. "Sep 13, 21:05")
            const matchMonth = clean.match(/([a-zA-Z]{3})\s+(\d{1,2})/);
            if (matchMonth) {
                const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                const mIdx = months.indexOf(matchMonth[1].toLowerCase());
                const dNum = parseInt(matchMonth[2], 10);
                if (mIdx === (tM - 1) && dNum === tD) return true;
            }
        }

        // 4. Fallback to parseLogDate if available in global scope
        if (typeof parseLogDate === 'function') {
            try {
                const d = parseLogDate(item);
                if (d && d.getFullYear() === tY && (d.getMonth() + 1) === tM && d.getDate() === tD) return true;
            } catch (e) {}
        }
    }

    return false;
}
window.isItemForDate = isItemForDate;

// --- DAILY DIGEST DATA COMPILER ---
// Asynchronously collects data for all included companies and builds the message in selected language
async function compileDailyDigest(targetDateStr = null, targetLang = null) {
    // Determine target language: 'ar', 'en', or 'both'
    const lang = targetLang || dailyDigestConfig.language || 'ar';
    
    // Determine KSA date (GMT+3)
    const now = new Date();
    const ksaOffset = 3 * 60; // UTC+3 in minutes
    const localOffset = now.getTimezoneOffset(); // in minutes
    const ksaTime = new Date(now.getTime() + (localOffset + ksaOffset) * 60000);

    const year = ksaTime.getFullYear();
    const monthStr = String(ksaTime.getMonth() + 1).padStart(2, '0');
    const dayStr = String(ksaTime.getDate()).padStart(2, '0');
    const today = targetDateStr || `${year}-${monthStr}-${dayStr}`;

    const localTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const companies = window.portalCompanies || {
        burgeroov: { id: 'burgeroov', name: 'BURGEROOV' },
        mvc: { id: 'mvc', name: 'MVC' },
        mvcfresh: { id: 'mvcfresh', name: 'MVC Fresh' }
    };

    const excluded = dailyDigestConfig.excludedCompanies || [];
    const opts = dailyDigestConfig.options || { sales: true, tasks: true, absent: true, violations: true, rewards: true, payments: true, custody: true };

    const includedSlugs = Object.keys(companies).filter(s => !excluded.includes(s));
    
    // Overall Grand Totals
    let grandTotals = {
        sales: 0,
        tasks: 0,
        absent: 0,
        violationsCount: 0,
        violationsAmt: 0,
        rewardsCount: 0,
        rewardsAmt: 0,
        paymentsCount: 0,
        paymentsAmt: 0,
        custodyCount: 0,
        custodyAmt: 0
    };

    let companyDataList = [];

    for (const slug of includedSlugs) {
        const compMeta = companies[slug] || { id: slug, name: slug.toUpperCase() };
        const compName = compMeta.name || slug.toUpperCase();

        let compData = {};
        if (slug === window.currentCompany && typeof getCompanyData === 'function') {
            compData = getCompanyData();
        } else if (window.appData && window.appData[slug] && Object.keys(window.appData[slug]).length > 0) {
            compData = window.appData[slug];
        }

        // Fetch fresh company snapshot from Firebase if missing
        if ((!compData || !compData.workers) && typeof db !== 'undefined' && db) {
            try {
                const snap = await db.ref(`companies/${slug}`).once('value');
                if (snap.exists()) {
                    const val = snap.val() || {};
                    compData = Object.assign({}, val, compData);
                }
            } catch (e) {
                console.warn(`Could not fetch data for ${slug}:`, e);
            }
        }

        const workers = compData.workers ? (Array.isArray(compData.workers) ? compData.workers : Object.values(compData.workers)) : [];
        const attendance = compData.attendance || {};

        // 1. Sales Calculation (Accurately read POS sales + Marketplace orders)
        let compSalesTotal = 0;
        let posSalesToday = 0;
        let marketSalesToday = 0;

        if (opts.sales) {
            const disabledMethods = compData.disabledSalesMethods || [];

            // A. Check POS salesLogs in company data
            const salesLogs = compData.salesLogs ? (Array.isArray(compData.salesLogs) ? compData.salesLogs : Object.values(compData.salesLogs)) : [];
            salesLogs.forEach(l => {
                if (!l) return;
                if (disabledMethods.includes(l.method)) return;
                if (isItemForDate(l, today, localTodayStr)) {
                    posSalesToday += parseFloat(l.amount || 0);
                }
            });

            // B. Check Marketplace / Online Orders
            const marketOrders = compData.marketOrders ? (Array.isArray(compData.marketOrders) ? compData.marketOrders : Object.values(compData.marketOrders)) : [];
            marketOrders.forEach(o => {
                if (!o) return;
                if (isItemForDate(o, today, localTodayStr)) {
                    marketSalesToday += parseFloat(o.totalCost || o.price || 0);
                }
            });

            // C. If active company on screen has rendered sales totals, reconcile with Sales Section DOM / summary
            if (slug === window.currentCompany) {
                // If posSalesToday is 0, attempt getTodaySalesSummary()
                if (posSalesToday === 0 && typeof getTodaySalesSummary === 'function') {
                    try {
                        const sumObj = getTodaySalesSummary();
                        if (sumObj && sumObj.total > 0) {
                            posSalesToday = sumObj.posTotal || sumObj.total;
                            if (marketSalesToday === 0 && sumObj.marketTotal) marketSalesToday = sumObj.marketTotal;
                        }
                    } catch (e) {}
                }

                // If still 0, check DOM elements of the Sales Section directly
                if (posSalesToday === 0) {
                    const grandEl = document.getElementById('sales-grand-total');
                    const salaryEl = document.getElementById('sales-total-salary');
                    let domNum = 0;
                    if (salaryEl && salaryEl.textContent) {
                        const n = parseFloat(salaryEl.textContent.replace(/[^0-9.]/g, ''));
                        if (!isNaN(n) && n > 0) domNum = n;
                    }
                    if (domNum === 0 && grandEl && grandEl.textContent) {
                        const n = parseFloat(grandEl.textContent.replace(/[^0-9.]/g, ''));
                        if (!isNaN(n) && n > 0) domNum = n;
                    }
                    if (domNum > 0) {
                        posSalesToday = domNum;
                    }
                }
            }

            compSalesTotal = posSalesToday + marketSalesToday;
            grandTotals.sales += compSalesTotal;
        }

        // 2. Tasks Done Today
        let compTasksDone = 0;
        if (opts.tasks) {
            // A. Worker assigned jobs
            workers.forEach(w => {
                if (!w || !w.jobs) return;
                const jobs = Array.isArray(w.jobs) ? w.jobs : Object.values(w.jobs);
                jobs.forEach(j => {
                    if (!j) return;
                    const isDone = (j.done === true || j.status === 'completed');
                    if (isDone) {
                        if (isItemForDate(j, today, localTodayStr) || (!j.completedAt && !j.assignedDate)) {
                            compTasksDone++;
                        }
                    }
                });
            });

            // B. General Tasks
            const genTasks = compData.generalTasks ? (Array.isArray(compData.generalTasks) ? compData.generalTasks : Object.values(compData.generalTasks)) : [];
            genTasks.forEach(gt => {
                if (gt && (gt.done || gt.status === 'completed')) {
                    if (isItemForDate(gt, today, localTodayStr) || (!gt.completedAt && !gt.date)) compTasksDone++;
                }
            });

            // C. Tracked Tasks system
            const trTasks = compData.trackedTasks ? (Array.isArray(compData.trackedTasks) ? compData.trackedTasks : Object.values(compData.trackedTasks)) : [];
            trTasks.forEach(tt => {
                if (tt && (tt.status === 'completed' || tt.done)) {
                    if (isItemForDate(tt, today, localTodayStr)) compTasksDone++;
                }
            });

            grandTotals.tasks += compTasksDone;
        }

        // 3. Absent Workers
        let absentWorkers = [];
        if (opts.absent) {
            const todayAtt = attendance[today] || attendance[localTodayStr] || {};
            workers.forEach(w => {
                if (!w) return;
                const rec = todayAtt[w.id];
                if (rec && (rec.status === 'absent' || rec.status === 'غياب' || rec.isAbsent === true || rec.type === 'absent')) {
                    absentWorkers.push(`${w.name}${w.role ? ` (${w.role})` : ''}`);
                }
            });
            grandTotals.absent += absentWorkers.length;
        }

        // 4. Violations Today
        let violationsToday = [];
        let compViolationsAmt = 0;
        if (opts.violations) {
            workers.forEach(w => {
                if (!w || !w.monthlyStats) return;
                const allMonths = Object.keys(w.monthlyStats);
                allMonths.forEach(mKey => {
                    const mStats = w.monthlyStats[mKey] || {};
                    const vList = mStats.violationsList || [];
                    const vArray = Array.isArray(vList) ? vList : Object.values(vList);
                    vArray.forEach(v => {
                        if (!v || v.status === 'waived') return;
                        if (isItemForDate(v, today, localTodayStr)) {
                            const amt = parseFloat(v.amount || 0);
                            compViolationsAmt += amt;
                            violationsToday.push({
                                workerName: w.name,
                                amt,
                                reason: v.reason || (v.ruleTitle ? v.ruleTitle : (lang === 'ar' ? 'مخالفة' : 'Violation'))
                            });
                        }
                    });
                });
            });
            grandTotals.violationsAmt += compViolationsAmt;
            grandTotals.violationsCount += violationsToday.length;
        }

        // 5. Rewards Today
        let rewardsToday = [];
        let compRewardsAmt = 0;
        if (opts.rewards) {
            workers.forEach(w => {
                if (!w || !w.monthlyStats) return;
                const allMonths = Object.keys(w.monthlyStats);
                allMonths.forEach(mKey => {
                    const mStats = w.monthlyStats[mKey] || {};
                    const rList = mStats.rewardsList || [];
                    const rArray = Array.isArray(rList) ? rList : Object.values(rList);
                    rArray.forEach(r => {
                        if (!r) return;
                        if (isItemForDate(r, today, localTodayStr)) {
                            const amt = parseFloat(r.amount || 0);
                            compRewardsAmt += amt;
                            rewardsToday.push({
                                workerName: w.name,
                                amt,
                                reason: r.reason || (lang === 'ar' ? 'مكافأة' : 'Reward')
                            });
                        }
                    });
                });
            });
            grandTotals.rewardsAmt += compRewardsAmt;
            grandTotals.rewardsCount += rewardsToday.length;
        }

        // 6. Accepted Payment Requests Today
        let acceptedPayments = [];
        let compPaymentsAmt = 0;
        if (opts.payments) {
            const pReqs = compData.paymentRequests ? (Array.isArray(compData.paymentRequests) ? compData.paymentRequests : Object.values(compData.paymentRequests)) : [];
            pReqs.forEach(p => {
                if (!p) return;
                const isAccepted = ['accepted', 'approved', 'transferred', 'paid', 'approved_paid'].includes(String(p.status || '').toLowerCase());
                if (isAccepted) {
                    if (isItemForDate(p, today, localTodayStr) || (!p.date && !p.timestamp && !p.approvedAt)) {
                        const amt = parseFloat(p.amount || 0);
                        compPaymentsAmt += amt;
                        acceptedPayments.push({
                            workerName: p.workerName || (lang === 'ar' ? 'موظف' : 'Worker'),
                            amt
                        });
                    }
                }
            });
            grandTotals.paymentsAmt += compPaymentsAmt;
            grandTotals.paymentsCount += acceptedPayments.length;
        }

        // 7. Accepted Custody Requests Today
        let acceptedCustody = [];
        let compCustodyAmt = 0;
        if (opts.custody) {
            const cReqs = compData.custodyRequests ? (Array.isArray(compData.custodyRequests) ? compData.custodyRequests : Object.values(compData.custodyRequests)) : [];
            cReqs.forEach(c => {
                if (!c) return;
                const isAccepted = ['accepted', 'approved'].includes(String(c.status || '').toLowerCase());
                if (isAccepted) {
                    if (isItemForDate(c, today, localTodayStr) || (!c.date && !c.timestamp && !c.approvedAt)) {
                        const amt = parseFloat(c.amount || 0);
                        compCustodyAmt += amt;
                        acceptedCustody.push({
                            workerName: c.workerName || (lang === 'ar' ? 'موظف' : 'Worker'),
                            amt
                        });
                    }
                }
            });
            grandTotals.custodyAmt += compCustodyAmt;
            grandTotals.custodyCount += acceptedCustody.length;
        }

        companyDataList.push({
            slug,
            compName,
            salesTotal: compSalesTotal,
            posSales: posSalesToday,
            marketSales: marketSalesToday,
            tasksDone: compTasksDone,
            absentWorkers,
            violationsList: violationsToday,
            violationsAmt: compViolationsAmt,
            rewardsList: rewardsToday,
            rewardsAmt: compRewardsAmt,
            paymentsList: acceptedPayments,
            paymentsAmt: compPaymentsAmt,
            custodyList: acceptedCustody,
            custodyAmt: compCustodyAmt
        });
    }

    const timeFormatted = `${String(ksaTime.getHours()).padStart(2, '0')}:${String(ksaTime.getMinutes()).padStart(2, '0')}`;
    let finalMessage = "";

    if (lang === 'en') {
        finalMessage = formatDigestEnglish(today, timeFormatted, companyDataList, grandTotals, opts);
    } else if (lang === 'both') {
        finalMessage = formatDigestBoth(today, timeFormatted, companyDataList, grandTotals, opts);
    } else {
        finalMessage = formatDigestArabic(today, timeFormatted, companyDataList, grandTotals, opts);
    }

    _compiledDigestCache = finalMessage;
    return finalMessage;
}
window.compileDailyDigest = compileDailyDigest;

// --- ARABIC FORMATTER ---
function formatDigestArabic(today, timeFormatted, companyDataList, grandTotals, opts) {
    let companyBlocks = [];
    for (const comp of companyDataList) {
        let block = `🏢 *${comp.compName}*\n`;

        if (opts.sales) {
            if (comp.marketSales > 0) {
                block += `💰 *المبيعات:* ${comp.salesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س (نقاط البيع: ${comp.posSales.toFixed(2)} | المتجر: ${comp.marketSales.toFixed(2)})\n`;
            } else {
                block += `💰 *المبيعات:* ${comp.salesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س\n`;
            }
        }

        if (opts.tasks) {
            block += `📋 *المهام المنجزة اليوم:* ${comp.tasksDone} مهمة\n`;
        }

        if (opts.absent) {
            if (comp.absentWorkers.length > 0) {
                block += `🚫 *الموظفون الغائبون (${comp.absentWorkers.length}):*\n  • ${comp.absentWorkers.join('\n  • ')}\n`;
            } else {
                block += `🚫 *الموظفون الغائبون:* لا يوجد غياب اليوم ✅\n`;
            }
        }

        if (opts.violations) {
            if (comp.violationsList.length > 0) {
                const formatted = comp.violationsList.map(v => typeof v === 'string' ? v : `${v.workerName}: ${v.amt.toFixed(2)} ر.س (${v.reason})`);
                block += `⚠️ *المخالفات المسجلة اليوم (${comp.violationsList.length} - ${comp.violationsAmt.toFixed(2)} ر.س):*\n  • ${formatted.join('\n  • ')}\n`;
            } else {
                block += `⚠️ *المخالفات المسجلة اليوم:* لا يوجد مخالفات\n`;
            }
        }

        if (opts.rewards) {
            if (comp.rewardsList.length > 0) {
                const formatted = comp.rewardsList.map(r => typeof r === 'string' ? r : `${r.workerName}: ${r.amt.toFixed(2)} ر.س (${r.reason})`);
                block += `🎁 *المكافآت المسجلة اليوم (${comp.rewardsList.length} - ${comp.rewardsAmt.toFixed(2)} ر.س):*\n  • ${formatted.join('\n  • ')}\n`;
            } else {
                block += `🎁 *المكافآت المسجلة اليوم:* لا يوجد مكافآت\n`;
            }
        }

        if (opts.payments) {
            if (comp.paymentsList.length > 0) {
                const formatted = comp.paymentsList.map(p => typeof p === 'string' ? p : `${p.workerName}: ${p.amt.toFixed(2)} ر.س`);
                block += `💵 *طلبات الصرف المقبولة (${comp.paymentsList.length} - ${comp.paymentsAmt.toFixed(2)} ر.س):*\n  • ${formatted.join('\n  • ')}\n`;
            } else {
                block += `💵 *طلبات الصرف المقبولة:* لا يوجد\n`;
            }
        }

        if (opts.custody) {
            if (comp.custodyList.length > 0) {
                const formatted = comp.custodyList.map(c => typeof c === 'string' ? c : `${c.workerName}: ${c.amt.toFixed(2)} ر.س`);
                block += `📦 *طلبات العهدة المقبولة (${comp.custodyList.length} - ${comp.custodyAmt.toFixed(2)} ر.س):*\n  • ${formatted.join('\n  • ')}\n`;
            } else {
                block += `📦 *طلبات العهدة المقبولة:* لا يوجد\n`;
            }
        }

        companyBlocks.push(block.trim());
    }

    let msg = `📊 *تقرير وسجل العمليات اليومي للمدراء*\n`;
    msg += `📅 *التاريخ:* ${today}\n`;
    msg += `⏰ *وقت الإرسال:* ${timeFormatted} بتوقيت الرياض (KSA)\n`;
    msg += `━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += companyBlocks.join('\n\n━━━━━━━━━━━━━━━━━━━\n\n') + '\n\n';

    msg += `━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📈 *الملخص العام لجميع الشركات:*\n`;
    if (opts.sales) msg += `💰 *إجمالي المبيعات:* ${grandTotals.sales.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س\n`;
    if (opts.tasks) msg += `📋 *إجمالي المهام المنجزة:* ${grandTotals.tasks} مهمة\n`;
    if (opts.absent) msg += `🚫 *إجمالي الغياب:* ${grandTotals.absent} موظف\n`;
    if (opts.violations) msg += `⚠️ *إجمالي المخالفات:* ${grandTotals.violationsCount} (${grandTotals.violationsAmt.toFixed(2)} ر.س)\n`;
    if (opts.rewards) msg += `🎁 *إجمالي المكافآت:* ${grandTotals.rewardsCount} (${grandTotals.rewardsAmt.toFixed(2)} ر.س)\n`;
    if (opts.payments) msg += `💵 *إجمالي طلبات الصرف المقبولة:* ${grandTotals.paymentsCount} (${grandTotals.paymentsAmt.toFixed(2)} ر.س)\n`;
    if (opts.custody) msg += `📦 *إجمالي طلبات العهدة المقبولة:* ${grandTotals.custodyCount} (${grandTotals.custodyAmt.toFixed(2)} ر.س)\n`;
    msg += `━━━━━━━━━━━━━━━━━━━\n`;
    msg += `_تم توليد التقرير تلقائياً عبر لوحة التحكم_`;

    return msg;
}

// --- ENGLISH FORMATTER ---
function formatDigestEnglish(today, timeFormatted, companyDataList, grandTotals, opts) {
    let companyBlocks = [];
    for (const comp of companyDataList) {
        let block = `🏢 *${comp.compName}*\n`;

        if (opts.sales) {
            if (comp.marketSales > 0) {
                block += `💰 *Sales:* ${comp.salesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} SR (POS: ${comp.posSales.toFixed(2)} | Store: ${comp.marketSales.toFixed(2)})\n`;
            } else {
                block += `💰 *Sales:* ${comp.salesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} SR\n`;
            }
        }

        if (opts.tasks) {
            block += `📋 *Tasks Completed Today:* ${comp.tasksDone} tasks\n`;
        }

        if (opts.absent) {
            if (comp.absentWorkers.length > 0) {
                block += `🚫 *Absent Workers (${comp.absentWorkers.length}):*\n  • ${comp.absentWorkers.join('\n  • ')}\n`;
            } else {
                block += `🚫 *Absent Workers:* None (All present) ✅\n`;
            }
        }

        if (opts.violations) {
            if (comp.violationsList.length > 0) {
                const formatted = comp.violationsList.map(v => typeof v === 'string' ? v : `${v.workerName}: ${v.amt.toFixed(2)} SR (${v.reason})`);
                block += `⚠️ *Violations Today (${comp.violationsList.length} - ${comp.violationsAmt.toFixed(2)} SR):*\n  • ${formatted.join('\n  • ')}\n`;
            } else {
                block += `⚠️ *Violations Today:* None\n`;
            }
        }

        if (opts.rewards) {
            if (comp.rewardsList.length > 0) {
                const formatted = comp.rewardsList.map(r => typeof r === 'string' ? r : `${r.workerName}: ${r.amt.toFixed(2)} SR (${r.reason})`);
                block += `🎁 *Rewards Today (${comp.rewardsList.length} - ${comp.rewardsAmt.toFixed(2)} SR):*\n  • ${formatted.join('\n  • ')}\n`;
            } else {
                block += `🎁 *Rewards Today:* None\n`;
            }
        }

        if (opts.payments) {
            if (comp.paymentsList.length > 0) {
                const formatted = comp.paymentsList.map(p => typeof p === 'string' ? p : `${p.workerName}: ${p.amt.toFixed(2)} SR`);
                block += `💵 *Accepted Payment Requests (${comp.paymentsList.length} - ${comp.paymentsAmt.toFixed(2)} SR):*\n  • ${formatted.join('\n  • ')}\n`;
            } else {
                block += `💵 *Accepted Payment Requests:* None\n`;
            }
        }

        if (opts.custody) {
            if (comp.custodyList.length > 0) {
                const formatted = comp.custodyList.map(c => typeof c === 'string' ? c : `${c.workerName}: ${c.amt.toFixed(2)} SR`);
                block += `📦 *Accepted Custody Requests (${comp.custodyList.length} - ${comp.custodyAmt.toFixed(2)} SR):*\n  • ${formatted.join('\n  • ')}\n`;
            } else {
                block += `📦 *Accepted Custody Requests:* None\n`;
            }
        }

        companyBlocks.push(block.trim());
    }

    let msg = `📊 *Daily Executive Operations Log for Managers*\n`;
    msg += `📅 *Date:* ${today}\n`;
    msg += `⏰ *Dispatched:* ${timeFormatted} KSA (Riyadh Time)\n`;
    msg += `━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += companyBlocks.join('\n\n━━━━━━━━━━━━━━━━━━━\n\n') + '\n\n';

    msg += `━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📈 *Grand Totals Across All Companies:*\n`;
    if (opts.sales) msg += `💰 *Total Sales:* ${grandTotals.sales.toLocaleString('en-US', { minimumFractionDigits: 2 })} SR\n`;
    if (opts.tasks) msg += `📋 *Total Tasks Done:* ${grandTotals.tasks} tasks\n`;
    if (opts.absent) msg += `🚫 *Total Absent Workers:* ${grandTotals.absent}\n`;
    if (opts.violations) msg += `⚠️ *Total Violations:* ${grandTotals.violationsCount} (${grandTotals.violationsAmt.toFixed(2)} SR)\n`;
    if (opts.rewards) msg += `🎁 *Total Rewards:* ${grandTotals.rewardsCount} (${grandTotals.rewardsAmt.toFixed(2)} SR)\n`;
    if (opts.payments) msg += `💵 *Total Accepted Payments:* ${grandTotals.paymentsCount} (${grandTotals.paymentsAmt.toFixed(2)} SR)\n`;
    if (opts.custody) msg += `📦 *Total Accepted Custody:* ${grandTotals.custodyCount} (${grandTotals.custodyAmt.toFixed(2)} SR)\n`;
    msg += `━━━━━━━━━━━━━━━━━━━\n`;
    msg += `_Automated Executive Operations Summary_`;

    return msg;
}

// --- BILINGUAL (BOTH) FORMATTER ---
function formatDigestBoth(today, timeFormatted, companyDataList, grandTotals, opts) {
    const ar = formatDigestArabic(today, timeFormatted, companyDataList, grandTotals, opts);
    const en = formatDigestEnglish(today, timeFormatted, companyDataList, grandTotals, opts);
    return `${ar}\n\n═══════════════════════════════════\n🇬🇧 *ENGLISH REPORT / التقرير بالإنجليزية*\n═══════════════════════════════════\n\n${en}`;
}

// Update Real-Time Preview
async function updateDigestPreview() {
    const previewBox = document.getElementById('digest-live-preview-box');
    const charCountEl = document.getElementById('digest-preview-char-count');
    if (!previewBox) return;

    previewBox.textContent = "⏳ Generating live preview in selected language from all active company databases...";
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

// Copy Report Text to Clipboard (Current active selection)
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

// Copy Report Text specifically in Arabic
async function copyDigestReportArabic() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    try {
        const text = await compileDailyDigest(null, 'ar');
        await navigator.clipboard.writeText(text);
        alert(isAr ? "📋 تم نسخ التقرير اليومي باللغة العربية بنجاح!" : "📋 Arabic daily digest copied to clipboard!");
    } catch (e) {
        console.error("Copy Arabic error:", e);
    }
}
window.copyDigestReportArabic = copyDigestReportArabic;

// Copy Report Text specifically in English
async function copyDigestReportEnglish() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    try {
        const text = await compileDailyDigest(null, 'en');
        await navigator.clipboard.writeText(text);
        alert(isAr ? "📋 تم نسخ التقرير اليومي باللغة الإنجليزية بنجاح!" : "📋 English daily digest copied to clipboard!");
    } catch (e) {
        console.error("Copy English error:", e);
    }
}
window.copyDigestReportEnglish = copyDigestReportEnglish;

// Copy Report Text specifically in Both (Bilingual)
async function copyDigestReportBoth() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    try {
        const text = await compileDailyDigest(null, 'both');
        await navigator.clipboard.writeText(text);
        alert(isAr ? "📋 تم نسخ التقرير المدمج باللغتين (العربية والإنجليزية) بنجاح!" : "📋 Combined bilingual daily digest copied to clipboard!");
    } catch (e) {
        console.error("Copy Both error:", e);
    }
}
window.copyDigestReportBoth = copyDigestReportBoth;

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

    const currentLang = dailyDigestConfig.language || 'ar';
    const langLabel = currentLang === 'ar' ? 'العربية' : (currentLang === 'en' ? 'English' : 'العربية والإنجليزية (Bilingual)');

    const confirmMsg = isAr
        ? `هل أنت متأكد من إرسال سجل العمليات اليومي الآن بصيغة (${langLabel}) عبر الواتساب إلى [${managers.length}] من المدراء؟`
        : `Are you sure you want to send today's operations log in (${langLabel}) via WhatsApp to [${managers.length}] managers?`;

    if (!confirm(confirmMsg)) return;

    const serverUrlInput = document.getElementById('wa-server-url');
    let rawBaseUrl = (serverUrlInput ? serverUrlInput.value.trim() : '') || 'https://burgeroov-notify.onrender.com';
    let baseUrl = rawBaseUrl.replace(/\/+$/, '');

    // 1. Try triggering via cloud server Baileys engine first
    let serverHandled = false;
    try {
        const srvRes = await fetch(`${baseUrl}/wa/trigger-digest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ force: true, triggerSource: 'dashboard_manual_button' })
        });
        if (srvRes.ok) {
            const srvData = await srvRes.json();
            if (srvData.success) {
                serverHandled = true;
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                dailyDigestConfig.lastSentDate = todayStr;
                saveDailyDigestSettings(true);
                alert(isAr 
                    ? `✅ تم إرسال التقرير اليومي بنجاح عبر خادم الإشعارات السحابي إلى [${managers.length}] من المدراء!` 
                    : `✅ Daily operations log dispatched successfully via cloud server to [${managers.length}] managers!`);
                return;
            }
        }
    } catch (srvErr) {
        console.warn("Cloud server trigger-digest unavailable, falling back to direct client send:", srvErr.message);
    }

    // 2. Direct client fallback loop if cloud endpoint was unreachable
    const messageText = await compileDailyDigest(null, dailyDigestConfig.language || 'ar');
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
            ? `⚠️ تم إرسال (${successCount}) وفشل (${failedCount}) عبر بوابة الخادم.\n\nهل تريد فتح الواتساب مباشرة لإرساله يدوياً؟` 
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

    // Get KSA Time (UTC+3)
    const now = new Date();
    const ksaOffset = 3 * 60; // UTC+3 in minutes
    const localOffset = now.getTimezoneOffset(); // in minutes
    const ksaTime = new Date(now.getTime() + (localOffset + ksaOffset) * 60000);

    const year = ksaTime.getFullYear();
    const monthStr = String(ksaTime.getMonth() + 1).padStart(2, '0');
    const dayStr = String(ksaTime.getDate()).padStart(2, '0');
    const todayStr = `${year}-${monthStr}-${dayStr}`;

    const currentHour = ksaTime.getHours();
    const currentMin = ksaTime.getMinutes();
    const currentMinutes = currentHour * 60 + currentMin;

    const targetTime = dailyDigestConfig.scheduledTime || "23:00";
    const [targetH, targetM] = targetTime.split(':').map(n => parseInt(n, 10) || 0);
    const targetMinutes = targetH * 60 + targetM;
    const diffMinutes = currentMinutes - targetMinutes;

    // Trigger within 60-minute window if not already sent today
    if (diffMinutes >= 0 && diffMinutes <= 60 && dailyDigestConfig.lastSentDate !== todayStr) {
        console.log(`⏰ [Daily Digest Scheduler] Triggering scheduled dispatch for ${todayStr} at KSA ${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')} (Scheduled: ${targetTime})...`);
        
        dailyDigestConfig.lastSentDate = todayStr;
        saveDailyDigestSettings(true);

        const serverUrlInput = document.getElementById('wa-server-url');
        let rawBaseUrl = (serverUrlInput ? serverUrlInput.value.trim() : '') || 'https://burgeroov-notify.onrender.com';
        let baseUrl = rawBaseUrl.replace(/\/+$/, '');

        // Try triggering via backend server first (runs autonomous Baileys queue)
        let serverHandled = false;
        try {
            const srvRes = await fetch(`${baseUrl}/wa/trigger-digest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ force: true, triggerSource: 'client_scheduler' })
            });
            if (srvRes.ok) {
                const srvData = await srvRes.json();
                if (srvData.success) {
                    console.log(`✅ [Daily Digest Scheduler] Successfully dispatched via cloud server:`, srvData);
                    serverHandled = true;
                }
            }
        } catch (srvErr) {
            console.warn(`[Daily Digest Scheduler] Cloud server trigger skipped or unreachable:`, srvErr.message);
        }

        // Fallback to client-side dispatch if server was unreachable
        if (!serverHandled) {
            let reportDateStr = todayStr;
            if (targetH < 5) {
                const prevKsa = new Date(ksaTime.getTime() - (24 * 3600000));
                const py = prevKsa.getFullYear();
                const pm = String(prevKsa.getMonth() + 1).padStart(2, '0');
                const pd = String(prevKsa.getDate()).padStart(2, '0');
                reportDateStr = `${py}-${pm}-${pd}`;
            }

            const messageText = await compileDailyDigest(reportDateStr, dailyDigestConfig.language || 'ar');

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
                    console.warn(`Scheduled fallback send error for ${phone}:`, err);
                }
            }
        }
    }
}

window.dailyDigestConfig = dailyDigestConfig;
