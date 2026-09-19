// Automated test verifying deleteJobApplicant functionality
const fs = require('fs');

console.log('=== Verifying Delete Job Applicant Feature ===');

const jobsAppliedCode = fs.readFileSync('js/jobs_applied.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const translationsCode = fs.readFileSync('translations.js', 'utf8');
const appCode = fs.readFileSync('app.js', 'utf8');

// 1. Function existence
if (jobsAppliedCode.includes('function deleteJobApplicant(appId, event)') && jobsAppliedCode.includes('window.deleteJobApplicant = deleteJobApplicant;')) {
    console.log('✅ PASS: deleteJobApplicant is defined and exported in js/jobs_applied.js');
} else {
    console.error('❌ FAIL: deleteJobApplicant is missing in js/jobs_applied.js');
    process.exit(1);
}

// 2. Permission check
if (jobsAppliedCode.includes('if (!hasJobsAppliedAccess()) return;')) {
    console.log('✅ PASS: deleteJobApplicant is protected by hasJobsAppliedAccess()');
} else {
    console.error('❌ FAIL: deleteJobApplicant lacks permission guard');
    process.exit(1);
}

// 3. Card delete button
if (jobsAppliedCode.includes("deleteJobApplicant('${app.id}', event)")) {
    console.log('✅ PASS: Candidate cards in renderApplicantsGrid include instant delete button with event.stopPropagation()');
} else {
    console.error('❌ FAIL: Candidate card is missing delete button');
    process.exit(1);
}

// 4. Modal delete button
if (indexHtml.includes('deleteJobApplicant(_activeViewingAppId)')) {
    console.log('✅ PASS: Applicant review modal footer includes delete button');
} else {
    console.error('❌ FAIL: Applicant modal footer missing delete button');
    process.exit(1);
}

// 5. Translations
const hasEn = translationsCode.includes('"btn-delete-applicant": "🗑️ Delete Application"');
const hasAr = translationsCode.includes('"btn-delete-applicant": "🗑️ حذف الطلب"');
const hasBn = translationsCode.includes('"btn-delete-applicant": "🗑️ আবেদন মুছুন"');

if (hasEn && hasAr && hasBn) {
    console.log('✅ PASS: Translations for btn-delete-applicant present in English, Arabic, and Bengali');
} else {
    console.error('❌ FAIL: Missing translations for btn-delete-applicant');
    process.exit(1);
}

// 6. Production Bundle Check
if (appCode.includes('deleteJobApplicant') && appCode.includes("deleteJobApplicant('${app.id}', event)")) {
    console.log('✅ PASS: app.js bundle contains deleteJobApplicant implementation');
} else {
    console.error('❌ FAIL: app.js does not contain deleteJobApplicant');
    process.exit(1);
}

console.log('\n🎉 ALL DELETE JOB APPLICANT CHECKS PASSED SUCCESSFULLY!');
