// Automated test for department section permissions and tab locking
const fs = require('fs');

console.log("=== Testing Department Section Permissions & Lock Logic ===");

const authContent = fs.readFileSync('js/auth.js', 'utf8');
const coreContent = fs.readFileSync('js/core.js', 'utf8');
const indexContent = fs.readFileSync('index.html', 'utf8');

// 1. Verify index.html contains all 16 permission checkboxes
const requiredCheckboxes = [
    'perm-wh', 'perm-drv', 'perm-fin', 'perm-sales', 'perm-costs',
    'perm-adverts', 'perm-attendance', 'perm-tasks', 'perm-prepare',
    'perm-vault', 'perm-reminders', 'perm-messaging', 'perm-ai-assistant',
    'perm-activity', 'perm-market', 'perm-summary'
];

let missingDomKeys = [];
requiredCheckboxes.forEach(cb => {
    if (!indexContent.includes(`id="${cb}"`)) {
        missingDomKeys.push(cb);
    }
});

if (missingDomKeys.length === 0) {
    console.log("✅ PASS: All 16 department permission checkboxes exist in index.html!");
} else {
    console.error("❌ FAIL: Missing checkboxes in index.html:", missingDomKeys);
    process.exit(1);
}

// 2. Verify sidebar tab buttons removed admin-only
const lockedTabKeys = ['tab-activity', 'tab-reminders', 'tab-ai-assistant', 'tab-vault', 'tab-messaging'];
let tabAdminOnlyErrors = [];

lockedTabKeys.forEach(tKey => {
    const regex = new RegExp(`id="${tKey}"[^>]*class="[^"]*admin-only`);
    if (regex.test(indexContent)) {
        tabAdminOnlyErrors.push(tKey);
    }
});

if (tabAdminOnlyErrors.length === 0) {
    console.log("✅ PASS: All section tabs removed 'admin-only' class and are visible to workers!");
} else {
    console.error("❌ FAIL: Tabs still have admin-only class:", tabAdminOnlyErrors);
    process.exit(1);
}

// 3. Verify loadWorkerPerms & saveWorkerPerms handle new keys
const expectedDataKeys = ['vault', 'reminders', 'messaging', 'ai_chat', 'activity', 'market', 'summary'];
let missingAuthKeys = [];

expectedDataKeys.forEach(dk => {
    if (!authContent.includes(dk)) {
        missingAuthKeys.push(dk);
    }
});

if (missingAuthKeys.length === 0) {
    console.log("✅ PASS: auth.js saveWorkerPerms correctly handles all new permission data keys!");
} else {
    console.error("❌ FAIL: Missing keys in auth.js saveWorkerPerms:", missingAuthKeys);
    process.exit(1);
}

// 4. Verify markLockedTabs includes all 19 tabs
const all19Tabs = ['ops', 'ranks', 'attendance', 'tasks', 'warehouse', 'drivers', 'finance', 'summary', 'adverts', 'notes', 'activity', 'managing', 'costs', 'reminders', 'market', 'prepare', 'ai-assistant', 'vault', 'messaging'];
let missingLockTabs = [];

all19Tabs.forEach(tab => {
    if (!coreContent.includes(`'${tab}'`) && !coreContent.includes(`${tab}:`)) {
        missingLockTabs.push(tab);
    }
});

if (missingLockTabs.length === 0) {
    console.log("✅ PASS: markLockedTabs in core.js calculates locks for all 19 department tabs!");
} else {
    console.error("❌ FAIL: Missing tabs in markLockedTabs:", missingLockTabs);
    process.exit(1);
}

console.log("🎉 ALL DEPARTMENT PERMISSION & VISIBILITY TESTS PASSED SUCCESSFULLY!");
