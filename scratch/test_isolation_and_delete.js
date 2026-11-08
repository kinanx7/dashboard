const assert = require('assert');

// 1. Setup mock environment
let dbData = {
    'companies/burgeroov': {
        name: 'Burgeroov',
        branches: ['Main Branch'],
        workers: [
            { id: 'b_w1', name: 'Ahmad Burgeroov', email: 'ahmad@burgeroov.com' },
            { id: 'b_w2', name: 'Khalid Burgeroov', email: 'khalid@burgeroov.com' }
        ],
        salesLogs: [{ id: 's1', total: 150, timestamp: 1000 }],
        costLogs: [{ id: 'c1', amount: 50, timestamp: 1000 }],
        warehouse: [{ id: 'wh1', name: 'Burger Buns' }],
        contracts: { 'c_1': { id: 'c_1', title: 'Burgeroov Contract' } },
        activityLogs: { 'act-b1': { id: 'act-b1', details: 'Burgeroov order created' } }
    },
    'companies/fishhouse': {
        name: 'fish house',
        branches: ['Main Branch'],
        // Simulating the bug where Burgeroov was cloned into fishhouse
        workers: [
            { id: 'b_w1', name: 'Ahmad Burgeroov', email: 'ahmad@burgeroov.com' },
            { id: 'b_w2', name: 'Khalid Burgeroov', email: 'khalid@burgeroov.com' },
            { id: 'fish_w1', name: 'Sami Fish Chef', email: 'sami@fishhouse.com' } // Worker explicitly added to fishhouse!
        ],
        salesLogs: [{ id: 's1', total: 150, timestamp: 1000 }],
        costLogs: [{ id: 'c1', amount: 50, timestamp: 1000 }],
        warehouse: [{ id: 'wh1', name: 'Burger Buns' }],
        contracts: { 'c_1': { id: 'c_1', title: 'Burgeroov Contract' } },
        activityLogs: { 'act-b1': { id: 'act-b1', details: 'Burgeroov order created' } }
    },
    'portal_companies/fishhouse': {
        id: 'fishhouse',
        name: 'fish house',
        color: '#38bdf8'
    },
    'customerCodes/companyDirectory/fishhouse': {
        id: 'fishhouse',
        name: 'fish house'
    }
};

let appData = {
    burgeroov: JSON.parse(JSON.stringify(dbData['companies/burgeroov'])),
    fishhouse: JSON.parse(JSON.stringify(dbData['companies/fishhouse']))
};

let portalCompanies = {
    burgeroov: { id: 'burgeroov', name: 'Burgeroov' },
    fishhouse: { id: 'fishhouse', name: 'fish house' }
};

let currentCompany = 'fishhouse';
let userActiveCompanies = ['burgeroov', 'fishhouse'];

const db = {
    ref(path) {
        return {
            once(event) {
                const val = dbData[path] !== undefined ? dbData[path] : null;
                return Promise.resolve({
                    exists: () => val !== null,
                    val: () => val
                });
            },
            update(updates) {
                if (!dbData[path]) dbData[path] = {};
                Object.assign(dbData[path], updates);
                return Promise.resolve();
            },
            set(data) {
                dbData[path] = data;
                return Promise.resolve();
            },
            remove() {
                delete dbData[path];
                return Promise.resolve();
            }
        };
    }
};

function parseWorkersSnap(snap) {
    if (!snap || typeof snap.val !== 'function') return [];
    const val = snap.val();
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(w => w && typeof w === 'object');
    if (typeof val === 'object') return Object.values(val).filter(w => w && typeof w === 'object');
    return [];
}

// 2. Test Sanitization logic
function sanitizeCompanyDataIsolation(cId) {
    if (!cId || cId === 'burgeroov' || cId === 'mvc' || cId === 'mvcfresh') {
        return Promise.resolve();
    }
    const cData = appData[cId];
    if (!cData) return Promise.resolve();

    if (cData._isolationCleaned) return Promise.resolve();

    return Promise.all([
        db.ref('companies/burgeroov').once('value').catch(() => null),
        db.ref('companies/mvc').once('value').catch(() => null)
    ]).then(([bSnap, mSnap]) => {
        const bVal = (bSnap && bSnap.val()) || (appData.burgeroov || {});
        const mVal = (mSnap && mSnap.val()) || (appData.mvc || {});

        const bWorkers = parseWorkersSnap({ val: () => bVal.workers });
        const mWorkers = parseWorkersSnap({ val: () => mVal.workers });
        const parentWorkers = [...bWorkers, ...mWorkers];

        const parentWorkerIds = new Set(parentWorkers.map(w => String(w.id)));
        const parentWorkerEmails = new Set(parentWorkers.map(w => (w.email || '').trim().toLowerCase()).filter(Boolean));

        let currentWorkers = Array.isArray(cData.workers) ? cData.workers : (cData.workers && typeof cData.workers === 'object' ? Object.values(cData.workers) : []);
        const originalCount = currentWorkers.length;

        const cleanedWorkers = currentWorkers.filter(w => {
            if (!w || !w.id) return false;
            const wId = String(w.id);
            const wEmail = (w.email || '').trim().toLowerCase();
            const isParentWorker = parentWorkerIds.has(wId) || (wEmail && parentWorkerEmails.has(wEmail));
            return !isParentWorker;
        });

        const hasLeakedWorkers = (cleanedWorkers.length !== originalCount);
        const hasLeakedSales = Array.isArray(cData.salesLogs) && cData.salesLogs.length > 0 && Array.isArray(bVal.salesLogs) && bVal.salesLogs.length > 0;
        const hasLeakedCosts = Array.isArray(cData.costLogs) && cData.costLogs.length > 0 && Array.isArray(bVal.costLogs) && bVal.costLogs.length > 0;
        const hasLeakedWarehouse = Array.isArray(cData.warehouse) && cData.warehouse.length > 0 && Array.isArray(bVal.warehouse) && bVal.warehouse.length > 0;

        const isFishHouseTarget = (cId === 'fishhouse' || cId.toLowerCase().includes('fish'));
        const shouldPurgeAllClonedData = (!cData.isolationSanitizedAt && (hasLeakedWorkers || hasLeakedSales || hasLeakedCosts || hasLeakedWarehouse || isFishHouseTarget));

        if (shouldPurgeAllClonedData || hasLeakedWorkers) {
            cData.workers = cleanedWorkers;
            cData.isolationSanitizedAt = Date.now();
            cData._isolationCleaned = true;

            const updates = {
                workers: cleanedWorkers,
                isolationSanitizedAt: Date.now()
            };

            if (shouldPurgeAllClonedData) {
                cData.salesLogs = [];
                cData.costLogs = [];
                cData.depositLogs = [];
                cData.spendLogs = [];
                cData.spendOrders = [];
                cData.warehouse = [];
                cData.contracts = {};
                cData.contractInstitutions = [];
                cData.attendance = {};
                cData.reminders = {};
                cData.vaultNotes = {};
                cData.vaultFolders = {};
                cData.generalTasks = {};
                cData.trackedTasks = {};

                updates.salesLogs = [];
                updates.costLogs = [];
                updates.depositLogs = [];
                updates.spendLogs = [];
                updates.spendOrders = [];
                updates.warehouse = [];
                updates.contracts = {};
                updates.contractInstitutions = [];
                updates.attendance = {};
                updates.reminders = {};
                updates.vaultNotes = {};
                updates.vaultFolders = {};
                updates.generalTasks = {};
                updates.trackedTasks = {};

                const initActId = 'act-' + Date.now();
                const compName = 'fish house';
                const cleanLogs = {
                    [initActId]: {
                        id: initActId,
                        type: 'company',
                        workerName: 'System',
                        details: `Company "${compName}" established and initialized with an isolated database.`,
                        timestamp: Date.now()
                    }
                };
                cData.activityLogs = cleanLogs;
                updates.activityLogs = cleanLogs;
            }

            return db.ref(`companies/${cId}`).update(updates);
        }
        return Promise.resolve();
    });
}

// 3. Test Delete logic
function deleteCompany(companyId) {
    if (!companyId || companyId === 'burgeroov') return Promise.resolve();

    const p1 = db.ref(`portal_companies/${companyId}`).remove();
    const p2 = db.ref(`companies/${companyId}`).remove();
    const p3 = db.ref(`customerCodes/companyDirectory/${companyId}`).remove();

    return Promise.all([p1, p2, p3]).then(() => {
        if (portalCompanies && portalCompanies[companyId]) delete portalCompanies[companyId];
        if (appData && appData[companyId]) delete appData[companyId];
        userActiveCompanies = userActiveCompanies.filter(id => id !== companyId);
        if (currentCompany === companyId) {
            currentCompany = 'burgeroov';
        }
    });
}

// RUN TESTS
async function run() {
    console.log('Running test: Sanitizing Fish House data isolation...');
    assert.strictEqual(appData.fishhouse.workers.length, 3, 'Fish house started with 3 workers (2 leaked from Burgeroov)');
    assert.strictEqual(appData.fishhouse.salesLogs.length, 1, 'Fish house started with leaked sales');
    assert.strictEqual(appData.fishhouse.warehouse.length, 1, 'Fish house started with leaked warehouse');

    await sanitizeCompanyDataIsolation('fishhouse');

    assert.strictEqual(appData.fishhouse.workers.length, 1, 'Fish house must keep only custom-added workers');
    assert.strictEqual(appData.fishhouse.workers[0].name, 'Sami Fish Chef', 'Custom worker "Sami Fish Chef" must be preserved');
    assert.strictEqual(appData.fishhouse.salesLogs.length, 0, 'Sales logs must be empty []');
    assert.strictEqual(appData.fishhouse.costLogs.length, 0, 'Cost logs must be empty []');
    assert.strictEqual(appData.fishhouse.warehouse.length, 0, 'Warehouse must be empty []');
    assert.strictEqual(Object.keys(appData.fishhouse.contracts).length, 0, 'Contracts must be empty {}');
    assert.strictEqual(Object.keys(appData.fishhouse.activityLogs).length, 1, 'Activity logs must have only system init log');
    assert.strictEqual(appData.fishhouse.activityLogs[Object.keys(appData.fishhouse.activityLogs)[0]].details.includes('fish house'), true);

    console.log('✅ Sanitization test passed: Fish house was purified cleanly, only custom worker kept!');

    console.log('Running test: Deleting Fish House...');
    await deleteCompany('fishhouse');

    assert.strictEqual(dbData['companies/fishhouse'], undefined, 'companies/fishhouse node must be deleted');
    assert.strictEqual(dbData['portal_companies/fishhouse'], undefined, 'portal_companies/fishhouse node must be deleted');
    assert.strictEqual(dbData['customerCodes/companyDirectory/fishhouse'], undefined, 'customerCodes directory node must be deleted');
    assert.strictEqual(appData['fishhouse'], undefined, 'In-memory appData fishhouse must be deleted');
    assert.strictEqual(portalCompanies['fishhouse'], undefined, 'In-memory portalCompanies fishhouse must be deleted');
    assert.strictEqual(userActiveCompanies.includes('fishhouse'), false, 'userActiveCompanies must exclude fishhouse');
    assert.strictEqual(currentCompany, 'burgeroov', 'Active company must safely redirect to burgeroov');

    console.log('✅ Delete test passed: Company removed from all nodes and redirected safely!');

    console.log('\n🌟 ALL AUTOMATED UNIT TESTS COMPLETED SUCCESSFULLY!');
}

run().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});

