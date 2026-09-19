/**
 * ==============================================================================
 * JOBS APPLIED & RECRUITMENT QR PORTAL MODULE (js/jobs_applied.js)
 * ==============================================================================
 * Enables companies to:
 * 1. Post job vacancies with customizable screening questions.
 * 2. Generate high-resolution street QR codes & printable A4 recruitment flyers.
 * 3. Provide a standalone mobile application experience for street scanners (?apply_job=...).
 * 4. Review candidate applications, inspect answers, change status, and contact via WhatsApp.
 * 5. Automatically hire qualified applicants directly into company workers roster.
 */

var jobOpeningsCache = {};
var jobApplicationsCache = {};
var currentJobsAppliedSubTab = 'applicants'; // 'applicants' | 'openings'
var currentApplicantFilterStatus = 'all';    // 'all' | 'new' | 'contacted' | 'interviewed' | 'hired' | 'rejected'
var currentApplicantFilterJob = 'all';
var jobsAppliedSearchQuery = '';
var _jobsAppliedListenersAttached = false;
var _activeViewingAppId = null;

// Preset screening question templates for fast setup
const JOB_QUESTION_PRESETS = {
    chef: [
        { id: 'q_exp', text: 'كم سنة خبرة لديك في مجال المطابخ والشوي؟', type: 'text', required: true },
        { id: 'q_iqama', text: 'هل الإقامة سارية المفعول وقابلة لنقل الكفالة؟', type: 'select', options: ['نعم / Yes', 'لا / No'], required: true },
        { id: 'q_health', text: 'هل لديك شهادة صحية سارية؟', type: 'select', options: ['نعم / Yes', 'لا / No', 'قيد الاستخراج'], required: true },
        { id: 'q_start', text: 'متى تستطيع مباشرة العمل؟', type: 'text', required: true },
        { id: 'q_salary', text: 'الراتب المتوقع شهرياً (بالريال السعودي)', type: 'number', required: false }
    ],
    driver: [
        { id: 'q_license', text: 'هل لديك رخصة قيادة سارية؟', type: 'select', options: ['نعم / Yes', 'لا / No'], required: true },
        { id: 'q_vehicle', text: 'هل تملك سيارة أو دباب خاص للتوصيل؟', type: 'select', options: ['سيارة خاصة', 'دباب خاص', 'لا أملك مركبة'], required: true },
        { id: 'q_riyadh', text: 'هل تعرف أحياء وشوارع المدينة جيداً وتستخدم خرائط قوقل؟', type: 'select', options: ['نعم ممتاز', 'متوسط', 'مبتدئ'], required: true },
        { id: 'q_iqama', text: 'هل الإقامة سارية وقابلة للنقل؟', type: 'select', options: ['نعم / Yes', 'لا / No'], required: true },
        { id: 'q_start', text: 'متى تستطيع مباشرة العمل؟', type: 'text', required: true }
    ],
    cashier: [
        { id: 'q_pos_exp', text: 'هل لديك خبرة سابقة في أنظمة الكاشير ونقاط البيع؟', type: 'select', options: ['نعم / Yes', 'لا / No'], required: true },
        { id: 'q_lang', text: 'مستوى إتقان اللغة الإنجليزية والتعامل مع العملاء؟', type: 'select', options: ['ممتاز', 'جيد جداً', 'متوسط'], required: true },
        { id: 'q_shifts', text: 'هل تستطيع العمل بنظام الشفت المسائي وعطلات الأسبوع؟', type: 'select', options: ['نعم بدون مانع', 'أفضل الشفت الصباحي'], required: true },
        { id: 'q_iqama', text: 'هل الإقامة سارية وقابلة للنقل؟', type: 'select', options: ['نعم / Yes', 'لا / No'], required: true },
        { id: 'q_salary', text: 'الراتب المتوقع (ريال)', type: 'number', required: false }
    ],
    general: [
        { id: 'q_exp', text: 'ما هي خبراتك السابقة في العمل؟', type: 'text', required: true },
        { id: 'q_iqama', text: 'نوع الإقامة وصلاحيتها؟', type: 'text', required: true },
        { id: 'q_health', text: 'هل لديك كرت صحي ساري؟', type: 'select', options: ['نعم / Yes', 'لا / No'], required: true },
        { id: 'q_start', text: 'متى تستطيع مباشرة العمل؟', type: 'text', required: true }
    ]
};

var _jobsAppliedListenersAttached = false;
var _currentJobsAppliedCompKey = null;

function hasJobsAppliedAccess() {
    if (typeof document === 'undefined' || !document.body) return false;
    return document.body.classList.contains('role-admin') || document.body.classList.contains('perm-jobs-applied');
}

/**
 * Initialize Realtime Firebase RTDB Listeners for Job Openings & Applications
 */
function initJobsAppliedListeners() {
    if (!hasJobsAppliedAccess()) return;
    if (typeof db === 'undefined' || !db) return;
    const compKey = currentCompany || 'burgeroov';

    // Guard against attaching duplicate listeners
    if (_jobsAppliedListenersAttached && _currentJobsAppliedCompKey === compKey) {
        return;
    }

    // If company changed, detach old listeners
    if (_currentJobsAppliedCompKey && _currentJobsAppliedCompKey !== compKey) {
        try {
            db.ref(`companies/${_currentJobsAppliedCompKey}/jobOpenings`).off();
            db.ref(`companies/${_currentJobsAppliedCompKey}/jobApplications`).off();
        } catch (e) {}
        _jobsAppliedListenersAttached = false;
    }

    _jobsAppliedListenersAttached = true;
    _currentJobsAppliedCompKey = compKey;

    try {
        db.ref(`companies/${compKey}/jobOpenings`).on('value', snap => {
            jobOpeningsCache = snap.val() || {};
            if (currentTab === 'jobs-applied') {
                updateJobsAppliedUI();
            }
        });

        db.ref(`companies/${compKey}/jobApplications`).on('value', snap => {
            jobApplicationsCache = snap.val() || {};
            if (currentTab === 'jobs-applied') {
                updateJobsAppliedUI();
            }
        });
    } catch (e) {
        console.warn('[Jobs Applied] Listener init warning:', e.message);
    }
}

/**
 * Switch sub-view inside Jobs Applied tab (Applicants vs Job Openings)
 */
function setJobsAppliedSubTab(tab) {
    currentJobsAppliedSubTab = tab;
    const btnApp = document.getElementById('jobs-subtab-applicants');
    const btnJobs = document.getElementById('jobs-subtab-openings');
    const viewApp = document.getElementById('jobs-applied-applicants-view');
    const viewJobs = document.getElementById('jobs-applied-openings-view');

    if (btnApp) btnApp.classList.toggle('active-subtab', tab === 'applicants');
    if (btnJobs) btnJobs.classList.toggle('active-subtab', tab === 'openings');

    if (viewApp) viewApp.style.display = (tab === 'applicants') ? 'block' : 'none';
    if (viewJobs) viewJobs.style.display = (tab === 'openings') ? 'block' : 'none';

    updateJobsAppliedUI();
}
window.setJobsAppliedSubTab = setJobsAppliedSubTab;

/**
 * Update HUD statistics, filter dropdown, and both view grids
 */
function updateJobsAppliedUI() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const appsList = Object.values(jobApplicationsCache || {}).filter(Boolean);
    const jobsList = Object.values(jobOpeningsCache || {}).filter(Boolean);

    // 1. Calculate HUD Statistics
    const totalApps = appsList.length;
    const newApps = appsList.filter(a => !a.status || a.status === 'new').length;
    const contactedApps = appsList.filter(a => a.status === 'contacted').length;
    const interviewedApps = appsList.filter(a => a.status === 'interviewed').length;
    const hiredApps = appsList.filter(a => a.status === 'hired').length;

    const hudTotalEl = document.getElementById('jobs-stat-total');
    const hudNewEl = document.getElementById('jobs-stat-new');
    const hudContactedEl = document.getElementById('jobs-stat-contacted');
    const hudInterviewedEl = document.getElementById('jobs-stat-interviewed');
    const hudHiredEl = document.getElementById('jobs-stat-hired');

    if (hudTotalEl) hudTotalEl.textContent = totalApps;
    if (hudNewEl) hudNewEl.textContent = newApps;
    if (hudContactedEl) hudContactedEl.textContent = contactedApps;
    if (hudInterviewedEl) hudInterviewedEl.textContent = interviewedApps;
    if (hudHiredEl) hudHiredEl.textContent = hiredApps;

    // 2. Populate Job Openings Filter Dropdown
    const jobFilterSelect = document.getElementById('jobs-filter-position');
    if (jobFilterSelect) {
        const selectedVal = jobFilterSelect.value || currentApplicantFilterJob || 'all';
        let optHtml = `<option value="all">${isAr ? 'جميع الوظائف المعروضة' : 'All Job Positions'}</option>`;
        jobsList.forEach(j => {
            if (j && j.id) {
                optHtml += `<option value="${j.id}" ${selectedVal === j.id ? 'selected' : ''}>${escapeHtml(j.title || j.id)}</option>`;
            }
        });
        jobFilterSelect.innerHTML = optHtml;
    }

    // 3. Render Applicants Grid
    renderApplicantsGrid();

    // 4. Render Job Openings Cards
    renderJobOpeningsList();
}

/**
 * Main Entry function when switching to Jobs Applied tab
 */
function renderJobsAppliedSection() {
    if (!hasJobsAppliedAccess()) return;
    initJobsAppliedListeners();
    updateJobsAppliedUI();
}
window.renderJobsAppliedSection = renderJobsAppliedSection;

/**
 * Filter & Render Job Applicants List
 */
function renderApplicantsGrid() {
    const grid = document.getElementById('jobs-applicants-grid');
    if (!grid) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    let apps = Object.values(jobApplicationsCache || {}).filter(Boolean);

    // Sort newest first
    apps.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));

    // Filter by Status
    if (currentApplicantFilterStatus !== 'all') {
        apps = apps.filter(a => (a.status || 'new') === currentApplicantFilterStatus);
    }

    // Filter by Job Opening ID
    if (currentApplicantFilterJob !== 'all') {
        apps = apps.filter(a => a.jobId === currentApplicantFilterJob);
    }

    // Filter by Search Query (Name, Phone, Nationality)
    if (jobsAppliedSearchQuery) {
        const q = jobsAppliedSearchQuery.toLowerCase();
        apps = apps.filter(a => {
            const name = (a.applicantName || '').toLowerCase();
            const phone = (a.phone || '').toLowerCase();
            const nat = (a.nationality || '').toLowerCase();
            const city = (a.currentCity || '').toLowerCase();
            const title = (a.jobTitle || '').toLowerCase();
            return name.includes(q) || phone.includes(q) || nat.includes(q) || city.includes(q) || title.includes(q);
        });
    }

    if (apps.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 48px 20px; background: rgba(255,255,255,0.02); border: 1px dashed var(--border-color); border-radius: 16px;">
                <div style="font-size: 2.8rem; margin-bottom: 12px;">📭</div>
                <h3 style="color: var(--text-main); font-size: 1.15rem; margin-bottom: 6px;">${isAr ? 'لا توجد طلبات توظيف تطابق هذا الفلتر' : 'No Job Applications Found'}</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; max-width: 440px; margin: 0 auto;">
                    ${isAr ? 'قم بمشاركة أو طباعة كود الـ QR للوظائف ليتمكن المتقدمون من المسح والتقديم من الشارع مباشرة.' : 'Generate and print a Street QR code so candidates can scan and submit their applications.'}
                </p>
            </div>
        `;
        return;
    }

    grid.innerHTML = apps.map(app => {
        const statusConfig = getApplicantStatusBadge(app.status || 'new', isAr);
        const submitDate = app.submittedAt ? new Date(app.submittedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently';
        const phone = (app.phone || '').replace(/[^0-9]/g, '');
        const waLink = phone ? `https://wa.me/${phone.startsWith('0') ? '966' + phone.substring(1) : phone}` : '#';
        const job = (jobOpeningsCache && app.jobId) ? jobOpeningsCache[app.jobId] : null;
        let displayJobTitle = app.jobTitle;
        if ((!displayJobTitle || displayJobTitle === 'General Position') && job && job.title) {
            displayJobTitle = job.title;
        }
        if (!displayJobTitle && jobOpeningsCache) {
            const firstJob = Object.values(jobOpeningsCache).find(Boolean);
            if (firstJob && firstJob.title) displayJobTitle = firstJob.title;
        }
        if (!displayJobTitle) displayJobTitle = 'General Position';

        let answeredCount = 0;
        if (Array.isArray(app.answersDetailed) && app.answersDetailed.length > 0) {
            answeredCount = app.answersDetailed.filter(a => a && a.answer && a.answer.trim() && a.answer.trim() !== '—').length;
        } else if (app.answers && typeof app.answers === 'object') {
            answeredCount = Object.values(app.answers).filter(v => v && String(v).trim() && String(v).trim() !== '—').length;
        }
        const totalJobQuestions = (job && Array.isArray(job.questions)) ? job.questions.length : 0;
        const questionsPillText = answeredCount > 0 
            ? `📝 ${answeredCount} ${isAr ? 'إجابات أسئلة' : 'answers'}`
            : (totalJobQuestions > 0 ? `📝 ${totalJobQuestions} ${isAr ? 'أسئلة' : 'questions'}` : `📝 0 ${isAr ? 'إجابات' : 'answers'}`);

        return `
            <div class="job-app-card" onclick="openApplicantDetailsModal('${app.id}')" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s ease; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,0.15); position: relative; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: ${statusConfig.color};"></div>
                
                <div>
                    <!-- Top row: Status & Date & Delete Button -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="font-size: 0.75rem; font-weight: 800; padding: 4px 10px; border-radius: 100px; background: ${statusConfig.bg}; color: ${statusConfig.color}; border: 1px solid ${statusConfig.color}40;">
                            ${statusConfig.label}
                        </span>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">
                                🕒 ${submitDate}
                            </span>
                            <button type="button" onclick="deleteJobApplicant('${app.id}', event)"
                                title="${isAr ? 'حذف طلب التقديم' : 'Delete Application'}"
                                style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.28); color: #ef4444; width: 28px; height: 28px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.82rem; cursor: pointer; transition: all 0.2s ease; padding: 0;"
                                onmouseover="this.style.background='rgba(239, 68, 68, 0.28)'; this.style.transform='scale(1.08)';"
                                onmouseout="this.style.background='rgba(239, 68, 68, 0.12)'; this.style.transform='scale(1)';">
                                🗑️
                            </button>
                        </div>
                    </div>

                    <!-- Applicant Name & Title -->
                    <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px;">
                        <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(212,175,55,0.12); border: 1px solid var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0;">
                            👤
                        </div>
                        <div style="min-width: 0; flex: 1;">
                            <h4 style="margin: 0 0 4px 0; color: var(--text-main); font-size: 1.05rem; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${escapeHtml(app.applicantName || 'Applicant')}
                            </h4>
                            <div style="font-size: 0.8rem; color: var(--primary); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                💼 ${escapeHtml(displayJobTitle)}
                            </div>
                        </div>
                    </div>

                    <!-- Details pills -->
                    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;">
                        <span style="font-size: 0.74rem; background: var(--input-bg); border: 1px solid var(--border-color); color: var(--text-muted); padding: 3px 8px; border-radius: 6px;">
                            🌍 ${escapeHtml(app.nationality || 'Unspecified')}
                        </span>
                        ${app.age ? `<span style="font-size: 0.74rem; background: var(--input-bg); border: 1px solid var(--border-color); color: var(--text-muted); padding: 3px 8px; border-radius: 6px;">🎂 ${app.age} ${isAr ? 'سنة' : 'yrs'}</span>` : ''}
                        ${app.experienceYears ? `<span style="font-size: 0.74rem; background: var(--input-bg); border: 1px solid var(--border-color); color: var(--text-muted); padding: 3px 8px; border-radius: 6px;">⭐ ${app.experienceYears} ${isAr ? 'سنوات خبرة' : 'yrs exp'}</span>` : ''}
                        ${app.currentCity ? `<span style="font-size: 0.74rem; background: var(--input-bg); border: 1px solid var(--border-color); color: var(--text-muted); padding: 3px 8px; border-radius: 6px;">📍 ${escapeHtml(app.currentCity)}</span>` : ''}
                        <span style="font-size: 0.74rem; background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.3); color: #38bdf8; padding: 3px 8px; border-radius: 6px; font-weight: 700;">
                            ${questionsPillText}
                        </span>
                    </div>
                </div>

                <!-- Footer Quick Actions -->
                <div style="display: flex; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 12px; align-items: center;" onclick="event.stopPropagation()">
                    <button type="button" onclick="openApplicantDetailsModal('${app.id}')"
                        style="flex: 1; padding: 8px 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-main); font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;">
                        👁️ <span>${isAr ? 'عرض الإجابات' : 'View Answers'}</span>
                    </button>
                    ${phone ? `
                        <a href="${waLink}" target="_blank"
                            style="padding: 8px 12px; background: #25D366; color: white; border-radius: 8px; text-decoration: none; font-size: 0.8rem; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;"
                            title="${isAr ? 'مراسلة عبر الواتساب' : 'Chat on WhatsApp'}">
                            💬 <span>واتساب</span>
                        </a>
                        <a href="tel:${phone}"
                            style="padding: 8px 10px; background: var(--input-bg); border: 1px solid var(--border-color); color: var(--text-main); border-radius: 8px; text-decoration: none; font-size: 0.82rem;"
                            title="${isAr ? 'اتصال هاتف' : 'Call Phone'}">
                            📞
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Status Badge Helper
 */
function getApplicantStatusBadge(status, isAr) {
    switch (status) {
        case 'contacted':
            return { label: isAr ? '📞 تم التواصل' : 'Contacted', color: '#38bdf8', bg: 'rgba(56,189,248,0.15)' };
        case 'interviewed':
            return { label: isAr ? '🤝 تمت المقابلة' : 'Interviewed', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
        case 'hired':
            return { label: isAr ? '🎉 تم التوظيف' : 'Hired', color: '#10b981', bg: 'rgba(16,185,129,0.15)' };
        case 'rejected':
            return { label: isAr ? '❌ مرفوض' : 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
        case 'new':
        default:
            return { label: isAr ? '✨ جديد' : 'New', color: '#a855f7', bg: 'rgba(168,85,247,0.15)' };
    }
}

/**
 * Render Job Openings Cards
 */
function renderJobOpeningsList() {
    const listContainer = document.getElementById('jobs-openings-container');
    if (!listContainer) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const jobs = Object.values(jobOpeningsCache || {}).filter(Boolean);

    if (jobs.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align:center; padding: 40px; background: rgba(255,255,255,0.02); border: 1px dashed var(--border-color); border-radius: 16px;">
                <h4 style="color: var(--text-main);">${isAr ? 'لا توجد وظائف معروضة حالياً' : 'No Active Job Openings'}</h4>
                <button type="button" onclick="openCreateJobModal()" class="btn-primary" style="margin-top: 12px; padding: 10px 20px;">
                    ➕ ${isAr ? 'إضافة أول وظيفة' : 'Post First Job'}
                </button>
            </div>
        `;
        return;
    }

    const compKey = currentCompany || 'burgeroov';
    const origin = window.location.origin;
    const path = window.location.pathname;

    listContainer.innerHTML = jobs.map(job => {
        const isActive = job.status !== 'paused';
        const questionsCount = (job.questions || []).length;
        const appCount = Object.values(jobApplicationsCache || {}).filter(a => a.jobId === job.id).length;
        const applyUrl = `${origin}${path}?apply_job=${encodeURIComponent(job.id)}&company=${encodeURIComponent(compKey)}`;

        return `
            <div class="job-opening-item-card" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; margin-bottom: 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.15); display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px;">
                <div style="flex: 1; min-width: 260px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                        <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-main);">
                            ${escapeHtml(job.title)}
                        </h3>
                        <span style="font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 100px; background: ${isActive ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.15)'}; color: ${isActive ? '#10b981' : '#94a3b8'}; border: 1px solid ${isActive ? '#10b98140' : '#94a3b840'};">
                            ${isActive ? (isAr ? 'نشطة للتقديم' : 'Active') : (isAr ? 'متوقفة مؤقتاً' : 'Paused')}
                        </span>
                    </div>

                    <div style="display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 10px;">
                        <span>🏢 ${escapeHtml(job.branch || 'Main Branch')}</span>
                        <span>•</span>
                        <span>📂 ${escapeHtml(job.department || 'General')}</span>
                        ${job.salaryRange ? `<span>•</span><span style="color:var(--primary); font-weight:700;">💵 ${escapeHtml(job.salaryRange)}</span>` : ''}
                    </div>

                    <p style="margin: 0 0 10px 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">
                        ${escapeHtml(job.description || '')}
                    </p>

                    <div style="display: flex; gap: 14px; align-items: center;">
                        <span style="font-size: 0.82rem; font-weight: 800; color: #38bdf8; background: rgba(56,189,248,0.1); padding: 4px 10px; border-radius: 8px;">
                            👥 ${appCount} ${isAr ? 'متقدمين' : 'applicants'}
                        </span>
                        <span style="font-size: 0.82rem; color: var(--text-muted);">
                            ❓ ${questionsCount} ${isAr ? 'أسئلة مخصصة' : 'custom questions'}
                        </span>
                    </div>
                </div>

                <!-- Action buttons -->
                <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                    <!-- QR Code Button -->
                    <button type="button" onclick="openJobQrModal('${job.id}')" class="btn-primary"
                        style="padding: 10px 16px; font-size: 0.84rem; font-weight: 800; background: linear-gradient(135deg, var(--primary), #b38914); color: #000; border: none; border-radius: 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                        📱 <span>${isAr ? 'كود QR وملصق الشارع' : 'Street QR & Poster'}</span>
                    </button>

                    <!-- Copy link -->
                    <button type="button" onclick="copyJobApplyLink('${job.id}')" class="btn-outline"
                        style="padding: 10px 14px; font-size: 0.84rem; font-weight: 700; border-radius: 10px; cursor: pointer;"
                        title="${isAr ? 'نسخ رابط التقديم' : 'Copy Apply URL'}">
                        🔗 <span>${isAr ? 'نسخ الرابط' : 'Copy Link'}</span>
                    </button>

                    <!-- Edit Questions -->
                    <button type="button" onclick="openCreateJobModal('${job.id}')" class="btn-outline"
                        style="padding: 10px 14px; font-size: 0.84rem; font-weight: 700; border-radius: 10px; cursor: pointer;">
                        ✏️ <span>${isAr ? 'تعديل الأسئلة' : 'Edit Questions'}</span>
                    </button>

                    <!-- Toggle Status -->
                    <button type="button" onclick="toggleJobStatus('${job.id}')" class="btn-outline"
                        style="padding: 10px 12px; font-size: 0.84rem; border-radius: 10px;"
                        title="${isActive ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'تنشيط' : 'Activate')}">
                        ${isActive ? '⏸️' : '▶️'}
                    </button>

                    <!-- Delete -->
                    <button type="button" onclick="deleteJobOpening('${job.id}')" class="btn-outline-danger"
                        style="padding: 10px 12px; font-size: 0.84rem; border-radius: 10px;">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Filter change events
 */
function onApplicantStatusFilterChange(status) {
    currentApplicantFilterStatus = status;
    document.querySelectorAll('.app-status-chip').forEach(el => {
        el.classList.toggle('active-chip', el.getAttribute('data-status') === status);
    });
    renderApplicantsGrid();
}
window.onApplicantStatusFilterChange = onApplicantStatusFilterChange;

function onApplicantJobFilterChange(jobId) {
    currentApplicantFilterJob = jobId;
    renderApplicantsGrid();
}
window.onApplicantJobFilterChange = onApplicantJobFilterChange;

function onJobsAppliedSearch(val) {
    jobsAppliedSearchQuery = val ? val.trim() : '';
    renderApplicantsGrid();
}
window.onJobsAppliedSearch = onJobsAppliedSearch;

// ==============================================================================
// MODAL: CREATE / EDIT JOB VACANCY & CUSTOM QUESTIONS BUILDER
// ==============================================================================
var _currentEditingJobQuestions = [];
var _editingJobId = null;

function openCreateJobModal(jobId = null) {
    if (!hasJobsAppliedAccess()) return;
    _editingJobId = jobId;
    const modal = document.getElementById('modal-create-job-opening');
    if (!modal) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const titleEl = document.getElementById('create-job-modal-title');
    const titleInput = document.getElementById('create-job-title');
    const deptInput = document.getElementById('create-job-dept');
    const branchInput = document.getElementById('create-job-branch');
    const salaryInput = document.getElementById('create-job-salary');
    const descInput = document.getElementById('create-job-desc');

    if (jobId && jobOpeningsCache[jobId]) {
        const j = jobOpeningsCache[jobId];
        if (titleEl) titleEl.textContent = isAr ? '✏️ تعديل الوظيفة والأسئلة' : '✏️ Edit Job & Screening Questions';
        if (titleInput) titleInput.value = j.title || '';
        if (deptInput) deptInput.value = j.department || '';
        if (branchInput) branchInput.value = j.branch || 'Main Branch';
        if (salaryInput) salaryInput.value = j.salaryRange || '';
        if (descInput) descInput.value = j.description || '';
        _currentEditingJobQuestions = JSON.parse(JSON.stringify(j.questions || []));
    } else {
        if (titleEl) titleEl.textContent = isAr ? '➕ إضافة وظيفة جديدة وإعداد الأسئلة' : '➕ Post New Job & Setup Questions';
        if (titleInput) titleInput.value = '';
        if (deptInput) deptInput.value = 'Kitchen';
        if (branchInput) branchInput.value = 'Main Branch';
        if (salaryInput) salaryInput.value = '3500 - 4500 SAR';
        if (descInput) descInput.value = '';
        _currentEditingJobQuestions = JSON.parse(JSON.stringify(JOB_QUESTION_PRESETS.chef));
    }

    renderQuestionBuilderList();
    modal.style.display = 'flex';
}
window.openCreateJobModal = openCreateJobModal;

function closeCreateJobModal() {
    _editingJobId = null;
    _currentEditingJobQuestions = [];
    const modal = document.getElementById('modal-create-job-opening');
    if (modal) modal.style.display = 'none';
}
window.closeCreateJobModal = closeCreateJobModal;

function loadPresetQuestions(presetKey) {
    if (JOB_QUESTION_PRESETS[presetKey]) {
        _currentEditingJobQuestions = JSON.parse(JSON.stringify(JOB_QUESTION_PRESETS[presetKey]));
        renderQuestionBuilderList();
    }
}
window.loadPresetQuestions = loadPresetQuestions;

function addQuestionToBuilder() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    _currentEditingJobQuestions.push({
        id: 'q_' + Date.now().toString(36),
        text: isAr ? 'سؤال جديد للمتقدم...' : 'New screening question...',
        type: 'text',
        required: true,
        options: []
    });
    renderQuestionBuilderList();
}
window.addQuestionToBuilder = addQuestionToBuilder;

function removeQuestionFromBuilder(index) {
    _currentEditingJobQuestions.splice(index, 1);
    renderQuestionBuilderList();
}
window.removeQuestionFromBuilder = removeQuestionFromBuilder;

function renderQuestionBuilderList() {
    const container = document.getElementById('create-job-questions-list');
    if (!container) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    if (_currentEditingJobQuestions.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; text-align:center;">${isAr ? 'لم تتم إضافة أسئلة بعد. انقر على إضافة سؤال أدناه.' : 'No custom questions added yet.'}</p>`;
        return;
    }

    container.innerHTML = _currentEditingJobQuestions.map((q, idx) => {
        const isSelect = q.type === 'select';
        const optsStr = Array.isArray(q.options) ? q.options.join(', ') : '';

        return `
            <div style="background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; margin-bottom: 10px;">
                <div style="display: flex; gap: 10px; align-items: flex-start;">
                    <span style="font-weight: 800; color: var(--primary); font-size: 0.9rem; margin-top: 6px;">#${idx + 1}</span>
                    
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                        <input type="text" class="builder-q-text" data-qidx="${idx}" value="${escapeHtml(q.text)}"
                            oninput="_currentEditingJobQuestions[${idx}].text = this.value"
                            placeholder="${isAr ? 'نص السؤال (مثال: هل لديك رخصة قيادة؟)' : 'Question text (e.g. Do you have a driver license?)'}"
                            style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-main); font-weight: 700; font-size: 0.9rem; box-sizing: border-box;">

                        <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                            <label style="font-size: 0.78rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                                <span>${isAr ? 'نوع الإجابة:' : 'Type:'}</span>
                                <select onchange="_currentEditingJobQuestions[${idx}].type = this.value; renderQuestionBuilderList();"
                                    style="padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-main); font-size: 0.78rem;">
                                    <option value="text" ${q.type === 'text' ? 'selected' : ''}>${isAr ? 'نص حر (Text)' : 'Text Answer'}</option>
                                    <option value="number" ${q.type === 'number' ? 'selected' : ''}>${isAr ? 'رقمي (Number)' : 'Numeric'}</option>
                                    <option value="select" ${q.type === 'select' ? 'selected' : ''}>${isAr ? 'خيارات محددة (Options)' : 'Multiple Choice'}</option>
                                </select>
                            </label>

                            <label style="font-size: 0.78rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" ${q.required ? 'checked' : ''}
                                    onchange="_currentEditingJobQuestions[${idx}].required = this.checked"
                                    style="width: auto;">
                                <span>${isAr ? 'إجباري' : 'Required'}</span>
                            </label>
                        </div>

                        ${isSelect ? `
                            <div>
                                <input type="text" class="builder-q-options" data-qidx="${idx}" value="${escapeHtml(optsStr)}"
                                    oninput="_currentEditingJobQuestions[${idx}].options = this.value.split(',').map(s => s.trim()).filter(Boolean)"
                                    placeholder="${isAr ? 'أدخل الخيارات مفصولة بفاصلة (مثال: نعم, لا, قيد الاستخراج)' : 'Comma-separated options (e.g. Yes, No, In-Progress)'}"
                                    style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px dashed var(--border-color); background: var(--card-bg); color: var(--text-main); font-size: 0.8rem; box-sizing: border-box;">
                            </div>
                        ` : ''}
                    </div>

                    <button type="button" onclick="removeQuestionFromBuilder(${idx})"
                        style="background: none; border: none; color: var(--danger); font-size: 1.1rem; cursor: pointer; padding: 4px;"
                        title="${isAr ? 'حذف السؤال' : 'Remove Question'}">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function saveJobOpening() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const titleInput = document.getElementById('create-job-title');
    const deptInput = document.getElementById('create-job-dept');
    const branchInput = document.getElementById('create-job-branch');
    const salaryInput = document.getElementById('create-job-salary');
    const descInput = document.getElementById('create-job-desc');

    const title = titleInput ? titleInput.value.trim() : '';
    if (!title) {
        alert(isAr ? 'يرجى إدخال مسمى الوظيفة' : 'Please enter job title');
        return;
    }

    const compKey = currentCompany || 'burgeroov';
    // PERMANENT STABLE ID: When editing, preserves existing ID. When new, generates unique permanent ID.
    const jobId = _editingJobId || ('job_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6));

    // Ensure all question inputs are synced from DOM
    const qListContainer = document.getElementById('create-job-questions-list');
    if (qListContainer) {
        const textInputs = qListContainer.querySelectorAll('input.builder-q-text');
        textInputs.forEach(input => {
            const idx = parseInt(input.getAttribute('data-qidx'), 10);
            if (!isNaN(idx) && _currentEditingJobQuestions[idx]) {
                _currentEditingJobQuestions[idx].text = input.value.trim();
            }
        });
        const optInputs = qListContainer.querySelectorAll('input.builder-q-options');
        optInputs.forEach(input => {
            const idx = parseInt(input.getAttribute('data-qidx'), 10);
            if (!isNaN(idx) && _currentEditingJobQuestions[idx]) {
                _currentEditingJobQuestions[idx].options = input.value.split(',').map(s => s.trim()).filter(Boolean);
            }
        });
    }

    const validQuestions = _currentEditingJobQuestions.filter(q => q && q.text && q.text.trim().length > 0);
    const jobData = {
        id: jobId,
        title: title,
        department: deptInput ? deptInput.value.trim() : 'General',
        branch: branchInput ? branchInput.value.trim() : 'Main Branch',
        salaryRange: salaryInput ? salaryInput.value.trim() : '',
        description: descInput ? descInput.value.trim() : '',
        status: (_editingJobId && jobOpeningsCache[_editingJobId]) ? (jobOpeningsCache[_editingJobId].status || 'active') : 'active',
        createdAt: (_editingJobId && jobOpeningsCache[_editingJobId]) ? (jobOpeningsCache[_editingJobId].createdAt || Date.now()) : Date.now(),
        updatedAt: Date.now(),
        questions: validQuestions
    };

    // Update local cache immediately
    jobOpeningsCache[jobId] = jobData;

    // Save simultaneously to company and public mirror so candidates can always scan even if anonymous
    const updates = {};
    updates[`companies/${compKey}/jobOpenings/${jobId}`] = jobData;
    updates[`publicJobOpenings/${compKey}/${jobId}`] = jobData;

    db.ref().update(updates).then(() => {
        closeCreateJobModal();
        if (typeof showInAppNotification === 'function') {
            showInAppNotification(isAr ? '✅ تم حفظ الوظيفة والأسئلة بنجاح!' : '✅ Job opening saved successfully!');
        } else {
            alert(isAr ? 'تم حفظ الوظيفة بنجاح!' : 'Job opening saved successfully!');
        }
    }).catch(err => {
        console.error('Error saving job opening:', err);
        alert(isAr ? 'فشل حفظ الوظيفة' : 'Failed to save job opening');
    });
}
window.saveJobOpening = saveJobOpening;

function toggleJobStatus(jobId) {
    if (!jobId || !jobOpeningsCache[jobId]) return;
    const compKey = currentCompany || 'burgeroov';
    const current = jobOpeningsCache[jobId].status || 'active';
    const next = current === 'active' ? 'paused' : 'active';

    const updates = {};
    updates[`companies/${compKey}/jobOpenings/${jobId}/status`] = next;
    updates[`publicJobOpenings/${compKey}/${jobId}/status`] = next;
    db.ref().update(updates);
}
window.toggleJobStatus = toggleJobStatus;

function deleteJobOpening(jobId) {
    if (!jobId) return;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذه الوظيفة نهائياً؟' : 'Are you sure you want to delete this job opening?')) return;

    const compKey = currentCompany || 'burgeroov';
    const updates = {};
    updates[`companies/${compKey}/jobOpenings/${jobId}`] = null;
    updates[`publicJobOpenings/${compKey}/${jobId}`] = null;
    db.ref().update(updates);
}
window.deleteJobOpening = deleteJobOpening;

// ==============================================================================
// QR CODE GENERATOR & PRINTABLE RECRUITMENT FLYER POSTER
// ==============================================================================
var _activeQrJobId = null;

/**
 * Returns the permanent, fixed candidate application URL for a job opening
 */
function getJobApplicationUrl(jobId, compKey) {
    const origin = window.location.origin || (window.location.protocol + '//' + window.location.host);
    let path = window.location.pathname || '';
    if (!path.endsWith('/') && !path.endsWith('.html')) {
        path = path + '/';
    }
    return `${origin}${path}?apply_job=${encodeURIComponent(jobId)}&company=${encodeURIComponent(compKey)}`;
}
window.getJobApplicationUrl = getJobApplicationUrl;

function openJobQrModal(jobId) {
    _activeQrJobId = jobId;
    const modal = document.getElementById('modal-job-qr-poster');
    if (!modal) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const job = jobOpeningsCache[jobId] || { title: 'Recruitment' };
    const compKey = currentCompany || 'burgeroov';
    const cMeta = (portalCompanies && portalCompanies[compKey]) || { name: 'MVC', logo: 'burgeroov.png' };

    const applyUrl = getJobApplicationUrl(jobId, compKey);
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(applyUrl)}`;

    const titleEl = document.getElementById('job-qr-modal-title');
    const linkInput = document.getElementById('job-qr-url-input');
    const qrImgEl = document.getElementById('job-qr-image-display');
    const subtitleEl = document.getElementById('job-qr-subtitle');

    if (titleEl) titleEl.textContent = `${isAr ? '📱 كود الـ QR وملصق الشارع:' : 'Street QR Code & Poster:'} ${job.title}`;
    if (subtitleEl) subtitleEl.textContent = `${cMeta.name || compKey} • ${job.branch || 'Main Branch'}`;
    if (linkInput) linkInput.value = applyUrl;
    if (qrImgEl) qrImgEl.src = qrImageUrl;

    modal.style.display = 'flex';
}
window.openJobQrModal = openJobQrModal;

function closeJobQrModal() {
    _activeQrJobId = null;
    const modal = document.getElementById('modal-job-qr-poster');
    if (modal) modal.style.display = 'none';
}
window.closeJobQrModal = closeJobQrModal;

function copyJobApplyLink(jobId) {
    const compKey = currentCompany || 'burgeroov';
    const applyUrl = getJobApplicationUrl(jobId, compKey);
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    navigator.clipboard.writeText(applyUrl).then(() => {
        if (typeof showInAppNotification === 'function') {
            showInAppNotification(isAr ? '📋 تم نسخ رابط التقديم بنجاح!' : '📋 Job application link copied!');
        } else {
            alert(isAr ? 'تم نسخ الرابط بنجاح!' : 'Link copied to clipboard!');
        }
    });
}
window.copyJobApplyLink = copyJobApplyLink;

/**
 * Print A4 Recruitment Flyer / Street Poster
 * Engineered with strict centering and high contrast for street and window posting
 */
function printJobRecruitmentPoster() {
    if (!_activeQrJobId || !jobOpeningsCache[_activeQrJobId]) return;
    const job = jobOpeningsCache[_activeQrJobId];
    const compKey = currentCompany || 'burgeroov';
    const cMeta = (portalCompanies && portalCompanies[compKey]) || { name: 'MVC Operations', logo: 'burgeroov.png', color: '#c5832b' };

    const applyUrl = getJobApplicationUrl(job.id, compKey);
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(applyUrl)}`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Please allow popups to print the recruitment flyer.');
        return;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>إعلان توظيف - ${escapeHtml(job.title)}</title>
            <style>
                @page { size: A4 portrait; margin: 12mm; }
                * { box-sizing: border-box; }
                body {
                    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
                    background: #ffffff;
                    color: #0f172a;
                    margin: 0;
                    padding: 0;
                    text-align: center;
                    box-sizing: border-box;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .poster-card {
                    border: 4px solid #0f172a;
                    border-radius: 28px;
                    padding: 32px 24px;
                    height: calc(100vh - 28mm);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    align-items: center;
                    text-align: center;
                    box-sizing: border-box;
                    margin: 0 auto;
                }
                .header-section {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                .company-logo {
                    max-height: 80px;
                    max-width: 240px;
                    object-fit: contain;
                    margin: 0 auto 10px auto;
                    display: block;
                }
                .hiring-badge {
                    display: inline-block;
                    background: #c5832b;
                    color: white;
                    font-size: 24px;
                    font-weight: 900;
                    padding: 8px 36px;
                    border-radius: 100px;
                    letter-spacing: 0.5px;
                    margin: 0 auto 14px auto;
                    text-align: center;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .job-title {
                    font-size: 36px;
                    font-weight: 900;
                    color: #0f172a;
                    margin: 4px auto 8px auto;
                    line-height: 1.25;
                    text-align: center;
                    width: 100%;
                }
                .job-subtitle {
                    font-size: 20px;
                    color: #475569;
                    font-weight: 700;
                    margin: 0 auto 10px auto;
                    text-align: center;
                }
                .salary-badge {
                    font-size: 20px;
                    font-weight: 800;
                    color: #15803d;
                    background: #ecfdf5;
                    border: 1.5px solid #86efac;
                    padding: 6px 22px;
                    border-radius: 100px;
                    display: inline-block;
                    margin: 0 auto 10px auto;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .qr-container {
                    background: #f8fafc;
                    border: 3.5px dashed #94a3b8;
                    border-radius: 28px;
                    padding: 24px 36px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    margin-left: auto;
                    margin-right: auto;
                    margin-top: 0;
                    margin-bottom: 0;
                    width: 100%;
                    max-width: 480px;
                    text-align: center;
                    box-sizing: border-box;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .qr-img {
                    width: 260px;
                    height: 260px;
                    display: block;
                    margin-left: auto !important;
                    margin-right: auto !important;
                    margin-top: 0 !important;
                    margin-bottom: 14px !important;
                    border-radius: 14px;
                    box-shadow: 0 4px 14px rgba(0,0,0,0.06);
                }
                .scan-callout {
                    font-size: 22px;
                    font-weight: 900;
                    color: #0f172a;
                    margin: 0 auto 4px auto;
                    text-align: center;
                    width: 100%;
                }
                .scan-sub {
                    font-size: 15px;
                    color: #64748b;
                    font-weight: 600;
                    margin: 0 auto;
                    text-align: center;
                    width: 100%;
                }
                .footer-notice {
                    width: 100%;
                    font-size: 14px;
                    font-weight: 600;
                    color: #64748b;
                    border-top: 2px solid #e2e8f0;
                    padding-top: 14px;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="poster-card">
                <div class="header-section">
                    <img src="${cMeta.logo || 'burgeroov.png'}" class="company-logo" onerror="this.style.display='none'">
                    <div class="hiring-badge">مطلوب موظفين للعمل فوراً 📣</div>
                    <div class="job-title">${escapeHtml(job.title)}</div>
                    <div class="job-subtitle">${escapeHtml(cMeta.name || 'الشركة')} • فرع: ${escapeHtml(job.branch || 'الرئيسي')}</div>
                    ${job.salaryRange ? `<div class="salary-badge">💰 الراتب: ${escapeHtml(job.salaryRange)}</div>` : ''}
                </div>

                <div class="qr-container">
                    <img id="poster-qr-img" src="${qrImageUrl}" class="qr-img" alt="Scan QR Code">
                    <div class="scan-callout">📱 امسح الكود بكاميرا الجوال للتقديم الآن</div>
                    <div class="scan-sub">Scan QR code with your mobile camera to submit application</div>
                </div>

                <div class="footer-notice">
                    التقديم متاح لجميع الجنسيات • يتم الرد والمراسلة عبر الواتساب فور مراجعة الطلب.
                </div>
            </div>
            <script>
                function doPrint() {
                    window.print();
                }
                const img = document.getElementById('poster-qr-img');
                if (img && !img.complete) {
                    img.onload = function() { setTimeout(doPrint, 350); };
                    setTimeout(doPrint, 1500);
                } else {
                    setTimeout(doPrint, 400);
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
}
window.printJobRecruitmentPoster = printJobRecruitmentPoster;

// ==============================================================================
// CANDIDATE PROFILE & ANSWERS REVIEW MODAL
// ==============================================================================
function openApplicantDetailsModal(appId) {
    if (!hasJobsAppliedAccess()) return;
    if (!appId || !jobApplicationsCache[appId]) return;
    _activeViewingAppId = appId;
    const app = jobApplicationsCache[appId];
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    const modal = document.getElementById('modal-job-applicant-details');
    if (!modal) return;

    const nameEl = document.getElementById('applicant-modal-name');
    const jobTitleEl = document.getElementById('applicant-modal-job');
    const phoneEl = document.getElementById('applicant-modal-phone');
    const natEl = document.getElementById('applicant-modal-nat');
    const ageEl = document.getElementById('applicant-modal-age');
    const cityEl = document.getElementById('applicant-modal-city');
    const dateEl = document.getElementById('applicant-modal-date');
    const statusSelect = document.getElementById('applicant-modal-status-select');
    const notesInput = document.getElementById('applicant-modal-notes');
    const answersContainer = document.getElementById('applicant-modal-answers-list');
    const waBtn = document.getElementById('applicant-modal-wa-btn');
    const callBtn = document.getElementById('applicant-modal-call-btn');

    // Dynamic position title lookup
    let job = (jobOpeningsCache && app.jobId) ? jobOpeningsCache[app.jobId] : null;
    if (!job && jobOpeningsCache) {
        const allJobs = Object.values(jobOpeningsCache).filter(Boolean);
        if (allJobs.length === 1) {
            job = allJobs[0];
        } else if (app.jobTitle) {
            job = allJobs.find(j => j && j.title && j.title.toLowerCase() === app.jobTitle.toLowerCase()) || allJobs[0] || null;
        }
    }
    const displayJobTitle = (job && job.title) ? job.title : (app.jobTitle || 'General Position');
    if (jobTitleEl) jobTitleEl.textContent = `💼 ${displayJobTitle}`;

    if (nameEl) nameEl.textContent = app.applicantName || 'Applicant';
    if (phoneEl) phoneEl.textContent = app.phone || 'N/A';
    if (natEl) natEl.textContent = app.nationality || 'Unspecified';
    if (ageEl) ageEl.textContent = app.age ? `${app.age} ${isAr ? 'سنة' : 'yrs'}` : 'N/A';
    if (cityEl) cityEl.textContent = app.currentCity || 'N/A';
    if (dateEl) dateEl.textContent = app.submittedAt ? new Date(app.submittedAt).toLocaleString(isAr ? 'ar-SA' : 'en-US') : '';
    if (statusSelect) statusSelect.value = app.status || 'new';
    if (notesInput) notesInput.value = app.managerNotes || '';

    const cleanPhone = (app.phone || '').replace(/[^0-9]/g, '');
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '966' + cleanPhone.substring(1) : cleanPhone}` : '#';
    if (waBtn) waBtn.href = waUrl;
    if (callBtn) callBtn.href = cleanPhone ? `tel:${cleanPhone}` : '#';

    // Populate dynamic questionnaire answers
    if (answersContainer) {
        const answers = app.answers || {};
        const answersDetailed = Array.isArray(app.answersDetailed) ? app.answersDetailed : [];
        const jobQuestions = (job && Array.isArray(job.questions)) ? job.questions : [];

        // Build unified list of questions & answers to display
        const displayList = [];
        const handledQIds = new Set();

        // 1. If we have detailed answers with questions stored on the application
        if (answersDetailed.length > 0) {
            answersDetailed.forEach(item => {
                if (item && item.id) {
                    handledQIds.add(item.id);
                    displayList.push({
                        id: item.id,
                        question: item.question || item.id,
                        answer: item.answer || '—',
                        hasAnswer: !!(item.answer && item.answer.trim() && item.answer.trim() !== '—')
                    });
                }
            });
        } else if (Object.keys(answers).length > 0) {
            // Build a question text lookup map from job questions and presets
            const qMap = {};
            jobQuestions.forEach(q => { if (q && q.id) qMap[q.id] = q.text; });
            Object.values(JOB_QUESTION_PRESETS).forEach(preset => {
                preset.forEach(pq => { if (pq && pq.id && !qMap[pq.id]) qMap[pq.id] = pq.text; });
            });

            Object.entries(answers).forEach(([qid, ans]) => {
                handledQIds.add(qid);
                const qText = qMap[qid] || (typeof ans === 'object' && ans.question ? ans.question : `Question (${qid})`);
                const ansText = (typeof ans === 'object' && ans.answer !== undefined) ? ans.answer : ans;
                displayList.push({
                    id: qid,
                    question: qText,
                    answer: ansText || '—',
                    hasAnswer: !!(ansText && String(ansText).trim() && String(ansText).trim() !== '—')
                });
            });
        }

        // 2. Also include any questions from the job opening that haven't been listed yet
        if (jobQuestions.length > 0) {
            jobQuestions.forEach(jq => {
                if (jq && jq.id && !handledQIds.has(jq.id)) {
                    handledQIds.add(jq.id);
                    const ans = answers[jq.id];
                    displayList.push({
                        id: jq.id,
                        question: jq.text,
                        answer: ans || (isAr ? 'لم تتم الإجابة بعد' : 'Not answered'),
                        hasAnswer: !!(ans && String(ans).trim() && String(ans).trim() !== '—')
                    });
                }
            });
        }

        if (displayList.length === 0) {
            answersContainer.innerHTML = `
                <div style="background: var(--input-bg); border: 1px dashed var(--border-color); border-radius: 12px; padding: 18px; text-align: center;">
                    <span style="font-size: 1.4rem; display: block; margin-bottom: 6px;">📝</span>
                    <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0;">
                        ${isAr ? 'لا توجد أسئلة تقييم إضافية مسجلة لهذه الوظيفة.' : 'No screening questions configured for this position.'}
                    </p>
                </div>
            `;
        } else {
            answersContainer.innerHTML = displayList.map((item, idx) => {
                const isAnswered = item.hasAnswer;
                const statusBadge = isAnswered
                    ? `<span style="font-size:0.72rem; font-weight:800; padding:2px 8px; border-radius:100px; background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.3);">${isAr ? 'تمت الإجابة' : 'Answered'}</span>`
                    : `<span style="font-size:0.72rem; font-weight:700; padding:2px 8px; border-radius:100px; background:rgba(239,68,68,0.1); color:#f87171; border:1px solid rgba(239,68,68,0.25);">${isAr ? 'غير مجاب' : 'Not answered'}</span>`;

                return `
                    <div style="background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; transition: all 0.2s ease;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:8px;">
                            <div style="font-size: 0.88rem; font-weight: 800; color: var(--primary); line-height: 1.4;">
                                #${idx + 1} ❓ ${escapeHtml(item.question)}
                            </div>
                            ${statusBadge}
                        </div>
                        <div style="font-size: 0.95rem; font-weight: 700; color: ${isAnswered ? 'var(--text-main)' : 'var(--text-muted)'}; background: var(--card-bg); padding: 10px 14px; border-radius: 8px; border: 1px solid ${isAnswered ? 'rgba(212,175,55,0.3)' : 'var(--border-color)'};">
                            ${escapeHtml(String(item.answer))}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    modal.style.display = 'flex';
}
window.openApplicantDetailsModal = openApplicantDetailsModal;

function closeApplicantDetailsModal() {
    _activeViewingAppId = null;
    const modal = document.getElementById('modal-job-applicant-details');
    if (modal) modal.style.display = 'none';
}
window.closeApplicantDetailsModal = closeApplicantDetailsModal;

function saveApplicantReviewChanges() {
    if (!_activeViewingAppId) return;
    const compKey = currentCompany || 'burgeroov';
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const statusSelect = document.getElementById('applicant-modal-status-select');
    const notesInput = document.getElementById('applicant-modal-notes');

    const newStatus = statusSelect ? statusSelect.value : 'new';
    const newNotes = notesInput ? notesInput.value.trim() : '';

    db.ref(`companies/${compKey}/jobApplications/${_activeViewingAppId}`).update({
        status: newStatus,
        managerNotes: newNotes
    }).then(() => {
        closeApplicantDetailsModal();
        if (typeof showInAppNotification === 'function') {
            showInAppNotification(isAr ? '✅ تم تحديث حالة وملاحظات الطلب!' : '✅ Applicant status updated!');
        }
    });
}
window.saveApplicantReviewChanges = saveApplicantReviewChanges;

/**
 * Delete a job application request permanently from RTDB and public mirror
 */
function deleteJobApplicant(appId, event) {
    if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
    }
    if (!hasJobsAppliedAccess()) return;
    if (!appId) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const app = jobApplicationsCache ? jobApplicationsCache[appId] : null;
    const applicantName = (app && app.applicantName) ? app.applicantName : '';

    const confirmMsg = isAr 
        ? `هل أنت متأكد من حذف طلب التوظيف المقدم من "${applicantName || 'المتقدم'}" نهائياً؟`
        : `Are you sure you want to permanently delete the job application from "${applicantName || 'this applicant'}"?`;

    if (!confirm(confirmMsg)) return;

    const compKey = currentCompany || 'burgeroov';
    const updates = {};
    updates[`companies/${compKey}/jobApplications/${appId}`] = null;
    updates[`publicJobApplications/${compKey}/${appId}`] = null;

    if (typeof db !== 'undefined' && db) {
        db.ref().update(updates).then(() => {
            if (jobApplicationsCache && jobApplicationsCache[appId]) {
                delete jobApplicationsCache[appId];
            }
            if (_activeViewingAppId === appId) {
                closeApplicantDetailsModal();
            }
            updateJobsAppliedUI();
            if (typeof showInAppNotification === 'function') {
                showInAppNotification(isAr ? '🗑️ تم حذف طلب التقديم بنجاح' : '🗑️ Job application deleted successfully');
            }
        }).catch(err => {
            console.error('Error deleting job application:', err);
            alert(isAr ? 'حدث خطأ أثناء حذف الطلب' : 'Error deleting application');
        });
    } else {
        if (jobApplicationsCache && jobApplicationsCache[appId]) {
            delete jobApplicationsCache[appId];
        }
        if (_activeViewingAppId === appId) {
            closeApplicantDetailsModal();
        }
        updateJobsAppliedUI();
    }
}
window.deleteJobApplicant = deleteJobApplicant;

/**
 * Automatically hire applicant and create active company worker profile
 */
function hireApplicantDirectly() {
    if (!_activeViewingAppId || !jobApplicationsCache[_activeViewingAppId]) return;
    const app = jobApplicationsCache[_activeViewingAppId];
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const compKey = currentCompany || 'burgeroov';

    const promptSalary = prompt(isAr ? `أدخل الراتب الأساسي الشهري للموظف (${app.applicantName}):` : `Enter monthly base salary for ${app.applicantName}:`, "3500");
    if (promptSalary === null) return;
    const baseSalary = parseFloat(promptSalary) || 3500;

    const workers = (getCompanyData() && getCompanyData().workers) || [];
    const newWorkerId = 'worker_' + Date.now().toString(36);
    const newWorker = {
        id: newWorkerId,
        name: app.applicantName || 'New Hire',
        role: app.jobTitle || 'Staff',
        branch: 'Main Branch',
        email: `${app.phone ? app.phone.replace(/[^0-9]/g, '') : newWorkerId}@company.local`,
        phone: app.phone || '',
        income: baseSalary,
        initialBalance: 0,
        monthlyStats: {},
        jobs: [],
        logs: [],
        rank: 'Level 1',
        createdAt: Date.now()
    };

    const nextIndex = workers.length;

    db.ref(`companies/${compKey}/workers/${nextIndex}`).set(newWorker).then(() => {
        // Update application status to hired
        db.ref(`companies/${compKey}/jobApplications/${app.id}/status`).set('hired');
        logActivity('ops', newWorkerId, newWorker.name, `Hired applicant ${newWorker.name} as ${newWorker.role} with base salary SAR ${baseSalary}`);
        closeApplicantDetailsModal();
        alert(isAr ? `🎉 تهانينا! تم توظيف ${newWorker.name} وإضافته رسمياً إلى قائمة موظفي الشركة بنجاح.` : `🎉 Successfully hired ${newWorker.name} and added to workers!`);
        if (typeof renderAll === 'function') renderAll();
    }).catch(err => {
        console.error('Error hiring worker:', err);
        alert(isAr ? 'فشل إضافة الموظف' : 'Failed to create worker profile');
    });
}
window.hireApplicantDirectly = hireApplicantDirectly;

// ==============================================================================
// PUBLIC STREET CANDIDATE APPLICATION FORM (?apply_job=JOB_ID&company=COMP_ID)
// ==============================================================================
var _publicActiveJob = null;
var _publicActiveCompany = null;

function checkUrlForPublicJobApplication() {
    if (typeof window === 'undefined' || !window.location) return;
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('apply_job');
    const compKey = urlParams.get('company') || 'burgeroov';

    if (jobId) {
        setTimeout(() => {
            initPublicJobApplyPortal(jobId, compKey);
        }, 300);
    }
}

function initPublicJobApplyPortal(jobId, compKey) {
    _publicActiveJob = jobId;
    _publicActiveCompany = compKey;

    const overlay = document.getElementById('job-apply-public-overlay');
    if (!overlay) return;

    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Fetch Job Details from Firebase (try public mirror first, fallback to company node)
    db.ref(`publicJobOpenings/${compKey}/${jobId}`).once('value').then(snap => {
        const job = snap.val();
        if (job) {
            _publicActiveJobData = job;
            if (typeof jobOpeningsCache !== 'undefined') jobOpeningsCache[jobId] = job;
            renderPublicApplicationForm(job, compKey);
        } else {
            db.ref(`companies/${compKey}/jobOpenings/${jobId}`).once('value').then(s2 => {
                const j2 = s2.val();
                _publicActiveJobData = j2;
                if (typeof jobOpeningsCache !== 'undefined' && j2) jobOpeningsCache[jobId] = j2;
                renderPublicApplicationForm(j2, compKey);
            }).catch(() => {
                renderPublicApplicationForm(null, compKey);
            });
        }
    }).catch(() => {
        db.ref(`companies/${compKey}/jobOpenings/${jobId}`).once('value').then(s2 => {
            const j2 = s2.val();
            _publicActiveJobData = j2;
            if (typeof jobOpeningsCache !== 'undefined' && j2) jobOpeningsCache[jobId] = j2;
            renderPublicApplicationForm(j2, compKey);
        }).catch(() => {
            renderPublicApplicationForm(null, compKey);
        });
    });
}
window.initPublicJobApplyPortal = initPublicJobApplyPortal;

function renderPublicApplicationForm(job, compKey) {
    const container = document.getElementById('job-apply-public-container');
    if (!container) return;

    _publicActiveJobData = job;
    if (job && job.id && typeof jobOpeningsCache !== 'undefined') {
        jobOpeningsCache[job.id] = job;
    }

    if (!job) {
        container.innerHTML = `
            <div style="text-align:center; padding:50px 20px; color:#fff;">
                <div style="font-size:3rem; margin-bottom:14px;">⚠️</div>
                <h2>الوظيفة غير متاحة حالياً</h2>
                <p style="color:#94a3b8;">ربما تم إغلاق هذه الوظيفة أو انتهى التقديم عليها. شكراً لاهتمامك!</p>
            </div>
        `;
        return;
    }

    const cMeta = (portalCompanies && portalCompanies[compKey]) || { name: 'MVC Operations', logo: 'burgeroov.png' };
    const questions = job.questions || [];

    let questionsHtml = '';
    if (questions.length > 0) {
        questionsHtml = `
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <h4 style="color: #f5d77f; font-size: 1.05rem; margin-bottom: 14px;">📝 أسئلة التقييم المبدئي للوظيفة:</h4>
                ${questions.map((q, idx) => {
                    const isRequired = q.required !== false;
                    const reqStar = isRequired ? '<span style="color:#ef4444;">*</span>' : '';
                    let inputEl = '';

                    if (q.type === 'select' && Array.isArray(q.options) && q.options.length > 0) {
                        inputEl = `
                            <select id="pub-q-${q.id}" ${isRequired ? 'required' : ''}
                                style="width:100%; padding:12px 14px; border-radius:10px; border:1px solid #475569; background:#0f172a; color:#fff; font-size:0.95rem; box-sizing:border-box;">
                                <option value="">-- اختر الإجابة --</option>
                                ${q.options.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('')}
                            </select>
                        `;
                    } else if (q.type === 'number') {
                        inputEl = `
                            <input type="number" id="pub-q-${q.id}" ${isRequired ? 'required' : ''}
                                style="width:100%; padding:12px 14px; border-radius:10px; border:1px solid #475569; background:#0f172a; color:#fff; font-size:0.95rem; box-sizing:border-box;"
                                placeholder="أدخل رقماً...">
                        `;
                    } else {
                        inputEl = `
                            <input type="text" id="pub-q-${q.id}" ${isRequired ? 'required' : ''}
                                style="width:100%; padding:12px 14px; border-radius:10px; border:1px solid #475569; background:#0f172a; color:#fff; font-size:0.95rem; box-sizing:border-box;"
                                placeholder="إجابتك هنا...">
                        `;
                    }

                    return `
                        <div class="public-question-item" data-qid="${q.id}" data-qtext="${escapeHtml(q.text)}" style="margin-bottom: 16px;">
                            <label style="display:block; color:#f8fafc; font-size:0.88rem; font-weight:700; margin-bottom:6px;">
                                ${idx + 1}. ${escapeHtml(q.text)} ${reqStar}
                            </label>
                            ${inputEl}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    container.innerHTML = `
        <div style="max-width: 580px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 24px; padding: 26px; box-shadow: 0 20px 60px rgba(0,0,0,0.6); color: #f8fafc; direction: rtl;">
            <!-- Header Banner -->
            <div style="text-align: center; margin-bottom: 22px; border-bottom: 1px solid #334155; padding-bottom: 18px;">
                <img src="${cMeta.logo || 'burgeroov.png'}" style="max-height: 64px; margin-bottom: 10px;" onerror="this.style.display='none'">
                <div style="font-size: 0.85rem; color: #94a3b8; font-weight: 700;">${escapeHtml(cMeta.name || 'شبكة التوظيف')}</div>
                <h2 style="color: #f5d77f; margin: 6px 0; font-size: 1.45rem; font-weight: 900;">
                    ${escapeHtml(job.title)}
                </h2>
                <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; font-size: 0.82rem; color: #cbd5e1; margin-top: 8px;">
                    <span style="background: #0f172a; padding: 4px 10px; border-radius: 6px; border: 1px solid #334155;">📍 فرع: ${escapeHtml(job.branch || 'الرئيسي')}</span>
                    ${job.salaryRange ? `<span style="background: rgba(16,185,129,0.15); color: #34d399; padding: 4px 10px; border-radius: 6px; font-weight: 800;">💰 الراتب: ${escapeHtml(job.salaryRange)}</span>` : ''}
                </div>
                ${job.description ? `<p style="font-size: 0.84rem; color: #94a3b8; margin: 10px 0 0 0; line-height: 1.4;">${escapeHtml(job.description)}</p>` : ''}
            </div>

            <!-- Candidate Application Form -->
            <form id="public-candidate-apply-form" onsubmit="event.preventDefault(); submitPublicJobApplication();">
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="display:block; font-size:0.88rem; font-weight:700; color:#f8fafc; margin-bottom:6px;">
                            👤 الاسم الكامل <span style="color:#ef4444;">*</span>
                        </label>
                        <input type="text" id="pub-cand-name" required placeholder="مثال: أحمد محمد علي"
                            style="width:100%; padding:12px 14px; border-radius:10px; border:1px solid #475569; background:#0f172a; color:#fff; font-size:0.95rem; box-sizing:border-box;">
                    </div>

                    <div>
                        <label style="display:block; font-size:0.88rem; font-weight:700; color:#f8fafc; margin-bottom:6px;">
                            📱 رقم الجوال / الواتساب <span style="color:#ef4444;">*</span>
                        </label>
                        <input type="tel" id="pub-cand-phone" required placeholder="05XXXXXXXX أو 966XXXXXXXXX"
                            style="width:100%; padding:12px 14px; border-radius:10px; border:1px solid #475569; background:#0f172a; color:#fff; font-size:0.95rem; box-sizing:border-box; direction:ltr; text-align:right;">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="display:block; font-size:0.84rem; font-weight:700; color:#f8fafc; margin-bottom:6px;">
                                🌍 الجنسية <span style="color:#ef4444;">*</span>
                            </label>
                            <input type="text" id="pub-cand-nat" required placeholder="مثال: سعودي، يمني..."
                                style="width:100%; padding:12px 14px; border-radius:10px; border:1px solid #475569; background:#0f172a; color:#fff; font-size:0.95rem; box-sizing:border-box;">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.84rem; font-weight:700; color:#f8fafc; margin-bottom:6px;">
                                🎂 العمر <span style="color:#ef4444;">*</span>
                            </label>
                            <input type="number" id="pub-cand-age" required min="18" max="70" placeholder="مثال: 25"
                                style="width:100%; padding:12px 14px; border-radius:10px; border:1px solid #475569; background:#0f172a; color:#fff; font-size:0.95rem; box-sizing:border-box;">
                        </div>
                    </div>

                    <div>
                        <label style="display:block; font-size:0.84rem; font-weight:700; color:#f8fafc; margin-bottom:6px;">
                            📍 المدينة والحي الحالي
                        </label>
                        <input type="text" id="pub-cand-city" placeholder="مثال: الرياض - حي الملز"
                            style="width:100%; padding:12px 14px; border-radius:10px; border:1px solid #475569; background:#0f172a; color:#fff; font-size:0.95rem; box-sizing:border-box;">
                    </div>
                </div>

                <!-- Custom Questions Injected -->
                ${questionsHtml}

                <div style="margin-top: 24px;">
                    <button type="submit" id="pub-submit-btn"
                        style="width: 100%; padding: 16px; border-radius: 12px; font-weight: 900; font-size: 1.1rem; background: linear-gradient(135deg, #10b981, #047857); color: #ffffff; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(16,185,129,0.4); display: flex; align-items: center; justify-content: center; gap: 8px;">
                        📤 <span>إرسال طلب التوظيف الآن</span>
                    </button>
                    <p style="font-size: 0.76rem; color: #94a3b8; text-align: center; margin-top: 10px;">
                        بالنقر على إرسال، فإنك تؤكد صحة البيانات المدخلة وسيتم التواصل معك مباشرة عبر الواتساب.
                    </p>
                </div>
            </form>
        </div>
    `;
}

function submitPublicJobApplication() {
    const compKey = _publicActiveCompany || 'burgeroov';
    const jobId = _publicActiveJob;
    if (!jobId) return;

    const nameInput = document.getElementById('pub-cand-name');
    const phoneInput = document.getElementById('pub-cand-phone');
    const natInput = document.getElementById('pub-cand-nat');
    const ageInput = document.getElementById('pub-cand-age');
    const cityInput = document.getElementById('pub-cand-city');
    const submitBtn = document.getElementById('pub-submit-btn');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const nationality = natInput ? natInput.value.trim() : '';
    const age = ageInput ? parseInt(ageInput.value, 10) || null : null;
    const city = cityInput ? cityInput.value.trim() : '';

    if (!name || !phone || !nationality) {
        alert('يرجى ملء جميع الحقول الإلزامية المطلوبة.');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ جاري إرسال الطلب...';
    }

    // Collect Answers
    const answers = {};
    const answersDetailed = [];
    const job = _publicActiveJobData || (jobOpeningsCache && jobOpeningsCache[jobId]) || {};

    // Method 1: Scan all rendered question items from DOM
    const qItems = document.querySelectorAll('.public-question-item');
    if (qItems && qItems.length > 0) {
        qItems.forEach(item => {
            const qid = item.getAttribute('data-qid');
            const qtext = item.getAttribute('data-qtext') || qid;
            const input = item.querySelector(`[id="pub-q-${qid}"]`) || item.querySelector('input, select, textarea');
            if (qid && input) {
                const val = input.value ? input.value.trim() : '';
                answers[qid] = val;
                answersDetailed.push({
                    id: qid,
                    question: qtext,
                    answer: val
                });
            }
        });
    }

    // Method 2: Ensure any question in job.questions is captured
    const questions = job.questions || [];
    questions.forEach(q => {
        if (!answers[q.id]) {
            const input = document.getElementById(`pub-q-${q.id}`);
            if (input) {
                const val = input.value ? input.value.trim() : '';
                answers[q.id] = val;
                answersDetailed.push({
                    id: q.id,
                    question: q.text || q.id,
                    answer: val
                });
            }
        }
    });

    const appId = 'app_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1000);
    const applicationPayload = {
        id: appId,
        jobId: jobId,
        jobTitle: job.title || 'General Position',
        department: job.department || 'General',
        companyId: compKey,
        applicantName: name,
        phone: phone,
        nationality: nationality,
        age: age,
        currentCity: city,
        answers: answers,
        answersDetailed: answersDetailed,
        status: 'new',
        managerNotes: '',
        submittedAt: Date.now()
    };

    // Save to company node and global public mirror
    const updates = {};
    updates[`companies/${compKey}/jobApplications/${appId}`] = applicationPayload;
    updates[`publicJobApplications/${compKey}/${appId}`] = applicationPayload;

    db.ref().update(updates).then(() => {
        const container = document.getElementById('job-apply-public-container');
        if (container) {
            container.innerHTML = `
                <div style="max-width: 500px; margin: 60px auto; background: #1e293b; border: 2px solid #10b981; border-radius: 24px; padding: 40px 24px; text-align: center; color: #fff; direction: rtl; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                    <div style="font-size: 4rem; margin-bottom: 16px;">🎉</div>
                    <h2 style="color: #34d399; font-size: 1.6rem; margin-bottom: 8px;">تم استلام طلبك بنجاح!</h2>
                    <p style="color: #cbd5e1; font-size: 1rem; line-height: 1.6; margin-bottom: 24px;">
                        شكراً لك يا <strong>${escapeHtml(name)}</strong> على تقديمك للعمل معنا.<br>
                        تم حفظ طلبك وسيتم مراجعته والتواصل معك عبر الواتساب على الرقم (<strong>${escapeHtml(phone)}</strong>).
                    </p>
                    <div style="display:inline-block; padding: 10px 20px; background: #0f172a; border-radius: 12px; border: 1px solid #334155; font-size: 0.85rem; color: #94a3b8;">
                        رقم مرجع الطلب: <span style="color:#f5d77f; font-family:monospace;">#${appId.toUpperCase()}</span>
                    </div>
                </div>
            `;
        }
    }).catch(err => {
        console.error('Error submitting application:', err);
        alert('حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '📤 إرسال طلب التوظيف الآن';
        }
    });
}
window.submitPublicJobApplication = submitPublicJobApplication;

// Auto-check URL on load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', checkUrlForPublicJobApplication);
}
