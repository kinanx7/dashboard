// Simulation test for listener and render cycle safety
const fs = require('fs');
const assert = require('assert');

// Mock DOM
global.document = {
    getElementById: (id) => {
        return {
            textContent: '',
            value: '',
            style: {},
            classList: {
                toggle: () => {},
                add: () => {},
                remove: () => {}
            },
            innerHTML: ''
        };
    },
    querySelectorAll: () => []
};

global.window = {
    location: { origin: 'http://localhost', pathname: '/' },
    addEventListener: () => {}
};
global.currentAppLang = 'en';
global.currentCompany = 'burgeroov';
global.currentTab = 'jobs-applied';

// Mock DB with call counters
let listenersAttachedCount = 0;
let writeCount = 0;

global.db = {
    ref: (path) => ({
        on: (event, cb) => {
            listenersAttachedCount++;
            // Simulate immediate snapshot trigger
            cb({ val: () => ({}) });
        },
        off: () => {
            listenersAttachedCount--;
        },
        set: () => {
            writeCount++;
            return Promise.resolve();
        }
    })
};

// Load jobs_applied.js
const code = fs.readFileSync('js/jobs_applied.js', 'utf8');
eval(code);

console.log('Testing renderJobsAppliedSection execution...');
// Call renderJobsAppliedSection 5 times consecutively
for (let i = 0; i < 5; i++) {
    renderJobsAppliedSection();
}

console.log(`Listeners attached: ${listenersAttachedCount} (expected: 2 - one for openings, one for applications)`);
assert.strictEqual(listenersAttachedCount, 2, 'Must only attach 2 listeners regardless of render calls');

console.log(`Database writes during render: ${writeCount} (expected: 0 - no automatic writes in listeners)`);
assert.strictEqual(writeCount, 0, 'Must NOT write to DB on load');

// Test switching subtabs
setJobsAppliedSubTab('openings');
setJobsAppliedSubTab('applicants');

console.log('✅ Simulation test passed! No infinite loops, no recursive listener bombing.');
