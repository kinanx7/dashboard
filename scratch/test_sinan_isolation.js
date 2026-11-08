const assert = require('assert');

// 1. Setup mock environment
let dbData = {
    'companies/burgeroov': {
        name: 'Burgeroov',
        admins: { 'kinan,rahal@hotmail,com': true },
        workers: [
            { id: 'w_sinan', name: 'Sinan Worker', email: 'sinan.rahal@hotmail.com' }
        ]
    },
    'companies/fishhouse': {
        name: 'fish house',
        admins: { 'kinan,rahal@hotmail,com': true },
        workers: [
            { id: 'w_sami', name: 'Sami Fish Chef', email: 'sami@fishhouse.com' }
        ]
    },
    'customerCodes/workerAccess/sinan,rahal@hotmail,com': {
        burgeroov: true,
        fishhouse: true // Stale leaked key from previous sync
    },
    'portal_companies': {
        burgeroov: { id: 'burgeroov', name: 'Burgeroov', color: '#c5832b' },
        fishhouse: { id: 'fishhouse', name: 'fish house', color: '#38bdf8' }
    }
};

let portalCompanies = JSON.parse(JSON.stringify(dbData['portal_companies']));
let currentUser = { email: 'sinan.rahal@hotmail.com', uid: 'uid_sinan' };
let userActiveCompanies = [];
let currentCompany = 'burgeroov';

const db = {
    ref(path) {
        return {
            once(event) {
                const parts = path.split('/');
                let val = dbData;
                for (const p of parts) {
                    if (val && typeof val === 'object' && p in val) {
                        val = val[p];
                    } else {
                        val = undefined;
                        break;
                    }
                }
                return Promise.resolve({
                    exists: () => val !== undefined && val !== null,
                    val: () => val !== undefined ? val : null
                });
            },
            remove() {
                const parts = path.split('/');
                let target = dbData;
                for (let i = 0; i < parts.length - 1; i++) {
                    if (target && target[parts[i]]) target = target[parts[i]];
                }
                if (target && parts.length > 0) {
                    delete target[parts[parts.length - 1]];
                }
                return Promise.resolve();
            }
        };
    }
};

dbData = {
    companies: {
        burgeroov: {
            name: 'Burgeroov',
            admins: { 'kinan,rahal@hotmail,com': true },
            workers: [
                { id: 'w_sinan', name: 'Sinan Worker', email: 'sinan.rahal@hotmail.com' }
            ]
        },
        fishhouse: {
            name: 'fish house',
            admins: { 'kinan,rahal@hotmail,com': true },
            workers: [
                { id: 'w_sami', name: 'Sami Fish Chef', email: 'sami@fishhouse.com' }
            ]
        }
    },
    customerCodes: {
        workerAccess: {
            'sinan,rahal@hotmail,com': {
                burgeroov: true,
                fishhouse: true
            }
        }
    },
    portal_companies: {
        burgeroov: { id: 'burgeroov', name: 'Burgeroov', color: '#c5832b' },
        fishhouse: { id: 'fishhouse', name: 'fish house', color: '#38bdf8' }
    }
};

function parseAdminsSnap(snap) {
    if (!snap || typeof snap.val !== 'function') return {};
    const val = snap.val();
    if (val && typeof val === 'object') return val;
    return {};
}

function parseWorkersSnap(snap) {
    if (!snap || typeof snap.val !== 'function') return [];
    const val = snap.val();
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(w => w && typeof w === 'object');
    if (typeof val === 'object') return Object.values(val).filter(w => w && typeof w === 'object');
    return [];
}

// 2. Test resolveUserActiveCompanies
async function resolveUserActiveCompanies(email) {
    if (!email || typeof db === 'undefined') return [];
    const cleanEmail = email.trim().toLowerCase();
    const sanitizedEmail = cleanEmail.replace(/\./g, ',');

    if (cleanEmail === 'kinan.rahal@hotmail.com') {
        return Object.keys(portalCompanies || {});
    }

    const compKeys = Object.keys(portalCompanies || {});
    const adminPromises = compKeys.map(cId => db.ref(`companies/${cId}/admins`).once('value').catch(() => null));
    const workerPromises = compKeys.map(cId => db.ref(`companies/${cId}/workers`).once('value').catch(() => null));

    const [adminSnaps, workerSnaps] = await Promise.all([
        Promise.all(adminPromises),
        Promise.all(workerPromises)
    ]);

    const activeCompanies = [];

    compKeys.forEach((cId, i) => {
        const adminsList = parseAdminsSnap(adminSnaps[i]);
        const workersList = parseWorkersSnap(workerSnaps[i]);

        const isAdmin = (adminsList[sanitizedEmail] === true);
        const isWorker = workersList.some(w => w && w.email && w.email.trim().toLowerCase() === cleanEmail);

        if (isAdmin || isWorker) {
            activeCompanies.push(cId);
        } else {
            // Proactively purge stale access
            db.ref(`customerCodes/workerAccess/${sanitizedEmail}/${cId}`).remove();
        }
    });

    return activeCompanies;
}

// 3. Test selectCompany protection
function selectCompany(companyId) {
    if (!companyId) return;

    const email = currentUser ? (currentUser.email || '').toLowerCase() : '';
    const isKinan = email === 'kinan.rahal@hotmail.com';

    if (!isKinan && Array.isArray(userActiveCompanies)) {
        if (!userActiveCompanies.includes(companyId)) {
            const fallback = userActiveCompanies.length > 0 ? userActiveCompanies[0] : 'burgeroov';
            currentCompany = fallback;
            return { allowed: false, redirectedTo: fallback };
        }
    }

    currentCompany = companyId;
    return { allowed: true, currentCompany };
}

// 4. Test renderCompanySelectionHUD logic
function renderCompanySelectionHUD() {
    const companies = Object.values(portalCompanies || {});
    const email = currentUser ? (currentUser.email || '').toLowerCase() : '';
    const isKinan = email === 'kinan.rahal@hotmail.com';

    let renderedCards = [];
    companies.forEach(c => {
        const canAccess = isKinan || (Array.isArray(userActiveCompanies) && userActiveCompanies.includes(c.id));
        if (!canAccess) return;

        const comp = dbData.companies[c.id];
        const isCompanyAdmin = isKinan || (comp && comp.admins && comp.admins[email.replace(/\./g, ',')] === true);

        renderedCards.push({
            id: c.id,
            name: c.name,
            hasAdminButtons: isCompanyAdmin
        });
    });

    return {
        renderedCards,
        hasAddCompanyCard: isKinan
    };
}

async function run() {
    console.log('Testing: Sinan active companies resolution...');
    userActiveCompanies = await resolveUserActiveCompanies('sinan.rahal@hotmail.com');

    assert.strictEqual(userActiveCompanies.length, 1, 'Sinan must only have access to 1 company');
    assert.strictEqual(userActiveCompanies[0], 'burgeroov', 'Sinan must only have access to Burgeroov');
    assert.strictEqual(userActiveCompanies.includes('fishhouse'), false, 'Sinan must NOT have access to Fish House');

    console.log('✅ Passed: Sinan resolved companies:', userActiveCompanies);

    console.log('Testing: Company selection HUD for Sinan...');
    const hud = renderCompanySelectionHUD();
    assert.strictEqual(hud.renderedCards.length, 1, 'Only 1 card must be rendered for Sinan');
    assert.strictEqual(hud.renderedCards[0].id, 'burgeroov', 'The rendered card must be Burgeroov');
    assert.strictEqual(hud.renderedCards[0].hasAdminButtons, false, 'Sinan must NOT see admin buttons on Burgeroov');
    assert.strictEqual(hud.hasAddCompanyCard, false, 'Sinan must NOT see "Add New Company" card');

    console.log('✅ Passed: HUD renders only Burgeroov, no admin controls, no fishhouse card.');

    console.log('Testing: Unauthorized selectCompany access block...');
    const accessAttempt = selectCompany('fishhouse');
    assert.strictEqual(accessAttempt.allowed, false, 'Direct access to fishhouse must be blocked');
    assert.strictEqual(accessAttempt.redirectedTo, 'burgeroov', 'Must safely redirect to burgeroov');
    assert.strictEqual(currentCompany, 'burgeroov', 'currentCompany must remain burgeroov');

    console.log('✅ Passed: Access to unassigned company was blocked and redirected safely.');
    console.log('\n🌟 ALL SINAN ISOLATION & ACCESS CONTROL TESTS PASSED PERFECTLY!');
}

run().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
