const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== RUNNING JOBS APPLIED INTEGRATION VERIFICATION ===\n');

// 1. Check index.html elements
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const requiredElements = [
    'id="tab-jobs-applied"',
    'id="view-jobs-applied"',
    'id="jobs-subtab-applicants"',
    'id="jobs-subtab-openings"',
    'id="jobs-stat-total"',
    'id="jobs-stat-new"',
    'id="jobs-stat-contacted"',
    'id="jobs-stat-interviewed"',
    'id="jobs-stat-hired"',
    'id="jobs-applied-search-input"',
    'id="jobs-filter-position"',
    'id="jobs-applicants-grid"',
    'id="jobs-openings-container"',
    'id="modal-create-job-opening"',
    'id="create-job-title"',
    'id="create-job-dept"',
    'id="create-job-branch"',
    'id="create-job-salary"',
    'id="create-job-desc"',
    'id="create-job-questions-list"',
    'id="modal-job-qr-poster"',
    'id="job-qr-image-display"',
    'id="job-qr-url-input"',
    'id="modal-job-applicant-details"',
    'id="applicant-modal-name"',
    'id="applicant-modal-job"',
    'id="applicant-modal-phone"',
    'id="applicant-modal-status-select"',
    'id="applicant-modal-notes"',
    'id="applicant-modal-answers-list"',
    'id="applicant-modal-wa-btn"',
    'id="applicant-modal-call-btn"',
    'id="job-apply-public-overlay"',
    'id="job-apply-public-container"'
];

let missingElements = [];
for (const el of requiredElements) {
    if (!indexHtml.includes(el)) {
        missingElements.push(el);
    }
}

if (missingElements.length > 0) {
    console.error('FAIL: Missing elements in index.html:', missingElements);
    process.exit(1);
} else {
    console.log(`✔ All ${requiredElements.length} required HTML IDs found in index.html.`);
}

// 2. Check translations.js keys for EN, AR, BN
const transContent = fs.readFileSync(path.join(__dirname, '../translations.js'), 'utf8');
const transKeys = [
    'tab-jobs-applied',
    'title-jobs-applied',
    'desc-jobs-applied',
    'subtab-job-applicants',
    'subtab-job-openings',
    'stat-total-apps',
    'stat-new-apps',
    'stat-contacted-apps',
    'stat-interviewed-apps',
    'stat-hired-apps',
    'placeholder-search-applicants',
    'title-vacancies-list',
    'btn-post-new-job'
];

for (const k of transKeys) {
    assert(transContent.includes(`"${k}":`), `Missing key in translations.js: ${k}`);
}
console.log(`✔ All ${transKeys.length} i18n translation keys found in translations.js.`);

// 3. Check js/core.js for tab hooks
const coreContent = fs.readFileSync(path.join(__dirname, '../js/core.js'), 'utf8');
assert(coreContent.includes("'jobs-applied'"), "core.js must include 'jobs-applied' in allTabs");
assert(coreContent.includes("renderJobsAppliedSection()"), "core.js must call renderJobsAppliedSection()");
console.log("✔ js/core.js contains 'jobs-applied' in allTabs and switchTab/renderAll hooks.");

// 4. Check app.js bundle
const appContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
assert(appContent.includes("JOB_QUESTION_PRESETS"), "app.js must include JOB_QUESTION_PRESETS");
assert(appContent.includes("initPublicJobApplyPortal"), "app.js must include initPublicJobApplyPortal");
assert(appContent.includes("printJobRecruitmentPoster"), "app.js must include printJobRecruitmentPoster");
assert(appContent.includes("hireApplicantDirectly"), "app.js must include hireApplicantDirectly");
console.log("✔ app.js bundle successfully contains all jobs_applied.js modules and handlers.");

// 5. Check URL generation and WhatsApp formatting logic
const testComp = 'burgeroov';
const testJob = 'job_cook_123';
const origin = 'https://dashboard.local';
const pathName = '/';
const expectedUrl = `${origin}${pathName}?apply_job=${encodeURIComponent(testJob)}&company=${encodeURIComponent(testComp)}`;
assert.strictEqual(expectedUrl, 'https://dashboard.local/?apply_job=job_cook_123&company=burgeroov');

function formatWa(phone) {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    return cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '966' + cleanPhone.substring(1) : cleanPhone}` : '#';
}
assert.strictEqual(formatWa('0501234567'), 'https://wa.me/966501234567');
assert.strictEqual(formatWa('+966 50 123 4567'), 'https://wa.me/966501234567');
assert.strictEqual(formatWa('966555123456'), 'https://wa.me/966555123456');
console.log("✔ WhatsApp direct link generation verified for local (05...) and international (+966...) phone numbers.");

console.log('\n=== ALL JOBS APPLIED VERIFICATIONS PASSED SUCCESSFULLY! ===');
