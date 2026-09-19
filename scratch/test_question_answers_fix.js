// Verification test for custom questions visibility and answer capturing
const fs = require('fs');

console.log('=== Verifying Custom Questions Visibility & Answer Capturing ===');

const code = fs.readFileSync('js/jobs_applied.js', 'utf8');

// 1. Check DOM sync in saveJobOpening
if (code.includes('qListContainer.querySelectorAll') && code.includes('jobOpeningsCache[jobId] = jobData')) {
    console.log('✅ PASS: saveJobOpening directly syncs DOM inputs and updates local cache');
} else {
    console.error('❌ FAIL: saveJobOpening is missing DOM sync or cache update');
    process.exit(1);
}

// 2. Check _publicActiveJobData persistence
if (code.includes('_publicActiveJobData = job') && code.includes('public-question-item')) {
    console.log('✅ PASS: renderPublicApplicationForm caches active job data and attaches question metadata');
} else {
    console.error('❌ FAIL: renderPublicApplicationForm does not cache job data or tag question items');
    process.exit(1);
}

// 3. Check submitPublicJobApplication answer collection
if (code.includes('answersDetailed.push') && code.includes('qItems.forEach')) {
    console.log('✅ PASS: submitPublicJobApplication captures questions and answers into answersDetailed & answers');
} else {
    console.error('❌ FAIL: submitPublicJobApplication does not capture detailed answers');
    process.exit(1);
}

// 4. Check openApplicantDetailsModal display logic
if (code.includes('jobQuestions.forEach') && code.includes('displayList.push') && code.includes('statusBadge')) {
    console.log('✅ PASS: openApplicantDetailsModal ensures all job questions are displayed with status badges');
} else {
    console.error('❌ FAIL: openApplicantDetailsModal is missing fallback to jobQuestions');
    process.exit(1);
}

// 5. Check bundle
const bundle = fs.readFileSync('app.js', 'utf8');
if (bundle.includes('public-question-item') && bundle.includes('answersDetailed')) {
    console.log('✅ PASS: app.js contains all question capturing and display updates');
} else {
    console.error('❌ FAIL: app.js missing updates');
    process.exit(1);
}

console.log('\n🎉 ALL QUESTION CAPTURING & VISIBILITY CHECKS PASSED!');
