const fs = require('fs');
const assert = require('assert');

console.log('--- RUNNING VIOLATION ACTIONS & QUIET BANNER TESTS ---');

// 1. Verify Alert Removal in nfc.js & app.js
console.log('\n[1] Verifying removal of intrusive Hero Banner alert...');
const nfcJs = fs.readFileSync('js/nfc.js', 'utf8');
const appJs = fs.readFileSync('app.js', 'utf8');

assert(!nfcJs.includes('Hero Banner updated successfully'), 'nfc.js must NOT contain alert for Hero Banner updated successfully');
assert(!appJs.includes('Hero Banner updated successfully'), 'app.js must NOT contain alert for Hero Banner updated successfully');
console.log('✔ Hero Banner alert popup successfully removed from both nfc.js and bundled app.js.');

// 2. Verify index.html cache busters
console.log('\n[2] Verifying cache busters in index.html...');
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert(indexHtml.includes('app.js?v=321'), 'index.html must reference app.js?v=321');
assert(indexHtml.includes('translations.js?v=321'), 'index.html must reference translations.js?v=321');
console.log('✔ Cache busters updated to ?v=321.');

// 3. Verify resolveViolation and deleteDetailedViolation in tasks.js & app.js
console.log('\n[3] Verifying resolveViolation & deleteDetailedViolation implementations...');
const tasksJs = fs.readFileSync('js/tasks.js', 'utf8');

assert(tasksJs.includes('window.resolveViolation = resolveViolation;'), 'tasks.js must export window.resolveViolation');
assert(tasksJs.includes('window.deleteDetailedViolation = deleteDetailedViolation;'), 'tasks.js must export window.deleteDetailedViolation');
assert(appJs.includes('window.resolveViolation = resolveViolation;'), 'app.js must export window.resolveViolation');
assert(appJs.includes('window.deleteDetailedViolation = deleteDetailedViolation;'), 'app.js must export window.deleteDetailedViolation');

// 4. Test logic simulation for resolveViolation ('waive' & 'apply')
console.log('\n[4] Simulating resolveViolation action execution...');

let finDetailsRendered = 0;
let financeTableRendered = 0;
let summaryTableRendered = 0;
let firebaseSetCalled = false;
let firebaseSetData = null;

global.currentGlobalMonth = '2026-09';
global.currentCompany = 'burgeroov';
global.renderFinDetails = () => { finDetailsRendered++; };
global.renderFinanceTable = () => { financeTableRendered++; };
global.renderSummaryTable = () => { summaryTableRendered++; };
global.logActivity = () => {};

const mockWorker = {
    id: 'w_test_101',
    name: 'Ahmed Test',
    monthlyStats: {
        '2026-09': {
            violationsList: [
                {
                    id: 'viol_999',
                    amount: 22,
                    reason: 'bb',
                    status: 'pending',
                    graceDays: 1,
                    timestamp: Date.now()
                }
            ]
        }
    }
};

global.getCompanyData = () => ({
    workers: [mockWorker]
});
global.getMonthlyStats = (worker, month) => worker.monthlyStats[month];
global.db = {
    ref: (path) => ({
        set: (data) => {
            firebaseSetCalled = true;
            firebaseSetData = data;
            return Promise.resolve();
        }
    })
};

// Evaluate resolveViolation from tasks.js in isolation
eval(tasksJs.substring(tasksJs.indexOf('function resolveViolation('), tasksJs.indexOf('window.resolveViolation = resolveViolation;')));

// Test 'waive' action
resolveViolation('w_test_101', 'viol_999', 'waive');
assert.strictEqual(mockWorker.monthlyStats['2026-09'].violationsList[0].status, 'waived', 'Violation status must be updated to waived');
assert(finDetailsRendered >= 1, 'renderFinDetails must be called immediately');
assert(financeTableRendered >= 1, 'renderFinanceTable must be called immediately');
assert(summaryTableRendered >= 1, 'renderSummaryTable must be called immediately');
assert(firebaseSetCalled, 'Firebase set must be called');
console.log('✔ "waive" action properly changed status to "waived" and immediately triggered UI updates.');

// Test 'apply' action
firebaseSetCalled = false;
resolveViolation('w_test_101', 'viol_999', 'apply');
assert.strictEqual(mockWorker.monthlyStats['2026-09'].violationsList[0].status, 'active', 'Violation status must be updated to active');
assert(finDetailsRendered >= 2, 'renderFinDetails must be called on apply');
assert(firebaseSetCalled, 'Firebase set must be called on apply');
console.log('✔ "apply" action properly changed status to "active" and immediately triggered UI updates.');

console.log('\n========================================');
console.log('ALL TESTS PASSED SUCCESSFULLY!');
console.log('========================================\n');
