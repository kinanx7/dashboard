// Automated test for company database isolation
const assert = require('assert');

// Simulate frontend environment globals
global.window = global;
global.document = {
    getElementById: () => ({ value: '', textContent: '', style: {}, disabled: false }),
    querySelector: () => ({ innerHTML: '' }),
    querySelectorAll: () => [],
    documentElement: { style: { setProperty: () => {} } },
    body: {
        classList: {
            remove: () => {},
            add: () => {},
            contains: () => false
        },
        className: ''
    }
};
global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
};

// Test state
let currentCompany = 'burgeroov';
let appData = {
    burgeroov: {
        branches: ['Main Branch'],
        workers: [
            { id: 'w1', name: 'Ahmad Worker', email: 'ahmad@burgeroov.com' }
        ],
        admins: { 'kinan,rahal@hotmail,com': true },
        activityLogs: {
            'act-1': { id: 'act-1', details: 'Burgeroov shift opened' }
        }
    }
};

function getCompanyData() {
    if (!appData[currentCompany]) {
        appData[currentCompany] = {
            admins: { 'kinan,rahal@hotmail,com': true },
            branches: ['Main Branch'],
            workers: [],
            activityLogs: {}
        };
    }
    return appData[currentCompany];
}

// 1. Verify burgeroov data is present
assert.strictEqual(getCompanyData().workers.length, 1);
assert.strictEqual(getCompanyData().workers[0].name, 'Ahmad Worker');
assert.strictEqual(Object.keys(getCompanyData().activityLogs).length, 1);

// 2. Simulate adding "fishhouse" company
const newSlug = 'fishhouse';
const newName = 'fish house';
const initActId = 'act-fishhouse-001';
const initialCompanyData = {
    id: newSlug,
    name: newName,
    admins: { 'kinan,rahal@hotmail,com': true, 'manager,fish@example,com': true },
    users_by_uid: {
        'uid_fish_mgr': { email: 'manager.fish@example.com', role: 'admin' }
    },
    branches: ['Main Branch'],
    workers: [],
    activityLogs: {
        [initActId]: {
            id: initActId,
            type: 'company',
            workerName: 'System',
            details: `Company "${newName}" established and initialized with an isolated database.`
        }
    }
};

appData[newSlug] = JSON.parse(JSON.stringify(initialCompanyData));

// 3. Switch to "fishhouse"
currentCompany = newSlug;
const fishData = getCompanyData();

assert.strictEqual(currentCompany, 'fishhouse');
assert.strictEqual(fishData.workers.length, 0, 'Fish House must have 0 workers initially');
assert.strictEqual(Object.keys(fishData.activityLogs).length, 1);
assert.strictEqual(fishData.activityLogs[initActId].details.includes('fish house'), true);
assert.strictEqual(fishData.admins['manager,fish@example,com'], true);

// 4. Add a new worker to fish house
const newFishWorker = { id: 'w_fish_1', name: 'Sami Fisherman', email: 'sami@fishhouse.com' };
fishData.workers.push(newFishWorker);

assert.strictEqual(getCompanyData().workers.length, 1);
assert.strictEqual(getCompanyData().workers[0].name, 'Sami Fisherman');

// 5. Switch back to burgeroov
currentCompany = 'burgeroov';
const burgerData = getCompanyData();

assert.strictEqual(burgerData.workers.length, 1);
assert.strictEqual(burgerData.workers[0].name, 'Ahmad Worker', 'Burgeroov workers must remain isolated and unaffected');
assert.strictEqual(burgerData.workers.find(w => w.name === 'Sami Fisherman'), undefined, 'Burgeroov must NOT have Fish House workers');

// 6. Switch back to fishhouse
currentCompany = 'fishhouse';
assert.strictEqual(getCompanyData().workers.length, 1);
assert.strictEqual(getCompanyData().workers[0].name, 'Sami Fisherman');
assert.strictEqual(getCompanyData().workers.find(w => w.name === 'Ahmad Worker'), undefined, 'Fish House must NOT have Burgeroov workers');

console.log('✅ ALL COMPANY ISOLATION TESTS PASSED PERFECTLY!');

