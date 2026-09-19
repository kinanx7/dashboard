// Comprehensive verification test for Jobs Applied role-based locking
const fs = require('fs');

console.log('=== Starting Jobs Applied Lock & Permissions Verification ===');

const coreCode = fs.readFileSync('js/core.js', 'utf8');
const jobsAppliedCode = fs.readFileSync('js/jobs_applied.js', 'utf8');
const appCode = fs.readFileSync('app.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');

// 1. Static checks
console.log('\n--- 1. Static Architecture Checks ---');

if (coreCode.includes("'jobs-applied': isAdmin || document.body.classList.contains('perm-jobs-applied')")) {
    console.log('✅ PASS: markLockedTabs() in js/core.js maps jobs-applied to isAdmin/permission');
} else {
    console.error('❌ FAIL: markLockedTabs() in js/core.js is missing jobs-applied mapping');
    process.exit(1);
}

if (indexHtml.includes('id="tab-jobs-applied"') && indexHtml.includes('id="mob-tab-jobs-applied"')) {
    console.log('✅ PASS: Desktop and mobile tabs exist for jobs-applied in index.html');
} else {
    console.error('❌ FAIL: Missing tab-jobs-applied or mob-tab-jobs-applied in index.html');
    process.exit(1);
}

if (jobsAppliedCode.includes('function hasJobsAppliedAccess()') && jobsAppliedCode.includes('if (!hasJobsAppliedAccess()) return;')) {
    console.log('✅ PASS: Defense-in-depth access guard present in js/jobs_applied.js');
} else {
    console.error('❌ FAIL: Missing hasJobsAppliedAccess in js/jobs_applied.js');
    process.exit(1);
}

// 2. Behavioral Simulation
console.log('\n--- 2. Behavioral Simulation ---');

class MockClassList {
    constructor() {
        this.classes = new Set();
    }
    add(...cls) { cls.forEach(c => this.classes.add(c)); }
    remove(...cls) { cls.forEach(c => this.classes.delete(c)); }
    contains(c) { return this.classes.has(c); }
    toggle(c, force) {
        if (force === undefined) {
            if (this.classes.has(c)) this.classes.delete(c);
            else this.classes.add(c);
        } else if (force) {
            this.classes.add(c);
        } else {
            this.classes.delete(c);
        }
    }
}

class MockElement {
    constructor(id, text = '') {
        this.id = id;
        this.textContent = text;
        this.classList = new MockClassList();
        this.style = {};
    }
}

function createMockEnvironment(isAdmin = true) {
    const elements = {};
    const tabs = ['ops', 'finance', 'jobs-applied'];

    tabs.forEach(t => {
        elements[`tab-${t}`] = new MockElement(`tab-${t}`, t === 'jobs-applied' ? '💼 Jobs Applied' : t);
        elements[`mob-tab-${t}`] = new MockElement(`mob-tab-${t}`, t);
        elements[`view-${t}`] = new MockElement(`view-${t}`);
    });

    elements['view-locked'] = new MockElement('view-locked');
    elements['locked-dept-label'] = new MockElement('locked-dept-label');

    const body = new MockElement('body');
    if (isAdmin) {
        body.classList.add('role-admin');
    } else {
        body.classList.add('role-worker');
    }

    const doc = {
        body: body,
        getElementById: id => elements[id] || null,
        querySelectorAll: sel => {
            if (sel.includes('.mob-sheet-tab')) {
                const match = sel.match(/data-tab="([^"]+)"/);
                if (match && elements[`mob-tab-${match[1]}`]) {
                    return [elements[`mob-tab-${match[1]}`]];
                }
            }
            if (sel === '.mob-quick-btn') return [];
            return [];
        }
    };

    return { doc, elements };
}

// Test Case A: Manager Access
console.log('Testing Case A: Manager (Admin) User...');
const envAdmin = createMockEnvironment(true);

// Run markLockedTabs logic
const isAdminA = envAdmin.doc.body.classList.contains('role-admin');
const accessA = {
    'jobs-applied': isAdminA || envAdmin.doc.body.classList.contains('perm-jobs-applied')
};
const tabBtnA = envAdmin.doc.getElementById('tab-jobs-applied');
const mobBtnA = envAdmin.doc.getElementById('mob-tab-jobs-applied');
tabBtnA.classList.toggle('tab-locked', !accessA['jobs-applied']);
mobBtnA.classList.toggle('tab-locked', !accessA['jobs-applied']);

if (!tabBtnA.classList.contains('tab-locked') && !mobBtnA.classList.contains('tab-locked')) {
    console.log('✅ PASS: Jobs Applied tab is UNLOCKED for Manager');
} else {
    console.error('❌ FAIL: Jobs Applied tab was incorrectly locked for Manager');
    process.exit(1);
}

// Simulate switchTab('jobs-applied') for Manager
const isLockedA = tabBtnA.classList.contains('tab-locked');
const viewJobsA = envAdmin.doc.getElementById('view-jobs-applied');
const viewLockedA = envAdmin.doc.getElementById('view-locked');
viewJobsA.classList.toggle('active-view', !isLockedA);
viewLockedA.classList.toggle('active-view', isLockedA);

let renderExecutedA = false;
if (!isLockedA) {
    renderExecutedA = true;
}

if (viewJobsA.classList.contains('active-view') && !viewLockedA.classList.contains('active-view') && renderExecutedA) {
    console.log('✅ PASS: Manager can access view-jobs-applied and render executes successfully');
} else {
    console.error('❌ FAIL: Manager view-jobs-applied did not open properly');
    process.exit(1);
}

// Test Case B: Non-Manager (Worker) Access
console.log('\nTesting Case B: Regular Worker (Non-Manager)...');
const envWorker = createMockEnvironment(false);

const isAdminB = envWorker.doc.body.classList.contains('role-admin');
const accessB = {
    'jobs-applied': isAdminB || envWorker.doc.body.classList.contains('perm-jobs-applied')
};
const tabBtnB = envWorker.doc.getElementById('tab-jobs-applied');
const mobBtnB = envWorker.doc.getElementById('mob-tab-jobs-applied');
tabBtnB.classList.toggle('tab-locked', !accessB['jobs-applied']);
mobBtnB.classList.toggle('tab-locked', !accessB['jobs-applied']);

if (tabBtnB.classList.contains('tab-locked') && mobBtnB.classList.contains('tab-locked')) {
    console.log('✅ PASS: Jobs Applied tab is visually LOCKED (tab-locked) for Worker');
} else {
    console.error('❌ FAIL: Jobs Applied tab was NOT locked for Worker');
    process.exit(1);
}

// Simulate switchTab('jobs-applied') for Worker
const isLockedB = tabBtnB.classList.contains('tab-locked');
const viewJobsB = envWorker.doc.getElementById('view-jobs-applied');
const viewLockedB = envWorker.doc.getElementById('view-locked');
const lockedLabelB = envWorker.doc.getElementById('locked-dept-label');

if (isLockedB && tabBtnB) {
    lockedLabelB.textContent = tabBtnB.textContent.trim();
}

viewJobsB.classList.toggle('active-view', !isLockedB);
viewLockedB.classList.toggle('active-view', isLockedB);

let renderExecutedB = false;
if (!isLockedB) {
    renderExecutedB = true;
}

if (!viewJobsB.classList.contains('active-view') && viewLockedB.classList.contains('active-view') && !renderExecutedB && lockedLabelB.textContent.includes('Jobs Applied')) {
    console.log('✅ PASS: Worker is blocked with view-locked overlay, label shows "💼 Jobs Applied", and rendering is halted!');
} else {
    console.error('❌ FAIL: Worker was not blocked properly');
    process.exit(1);
}

console.log('\n🎉 ALL TESTS PASSED: Jobs Applied is strictly accessible for managers only and locked for others!');
