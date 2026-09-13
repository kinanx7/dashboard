const fs = require('fs');
const assert = require('assert');

console.log("=== Testing Daily Executive Operations Digest Module ===");

// 1. Check index.html for UI elements
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert(indexHtml.includes('id="btn-msg-mode-digest"'), "Missing #btn-msg-mode-digest in index.html");
assert(indexHtml.includes('id="msg-mode-digest-container"'), "Missing #msg-mode-digest-container in index.html");
assert(indexHtml.includes('id="digest-status-badge"'), "Missing #digest-status-badge in index.html");
assert(indexHtml.includes('id="digest-scheduled-time"'), "Missing #digest-scheduled-time in index.html");
assert(indexHtml.includes('id="digest-managers-list"'), "Missing #digest-managers-list in index.html");
assert(indexHtml.includes('id="digest-companies-grid"'), "Missing #digest-companies-grid in index.html");
assert(indexHtml.includes('id="digest-live-preview-box"'), "Missing #digest-live-preview-box in index.html");
assert(indexHtml.includes('onclick="sendDailyDigestNow()"'), "Missing sendDailyDigestNow button in index.html");
assert(indexHtml.includes('onclick="copyDigestReportText()"'), "Missing copyDigestReportText button in index.html");
console.log("✅ All required DOM elements verified in index.html");

// 2. Mock browser environment to test js/digest.js
const mockLocalStorage = {};
global.localStorage = {
    getItem: k => mockLocalStorage[k] || null,
    setItem: (k, v) => { mockLocalStorage[k] = String(v); },
    removeItem: k => { delete mockLocalStorage[k]; }
};

global.window = global;
global.currentAppLang = 'ar';
global.currentCompany = 'burgeroov';

global.portalCompanies = {
    burgeroov: { id: 'burgeroov', name: 'Burgeroov Restaurant', logo: 'burgeroov.png' },
    mvc: { id: 'mvc', name: 'MVC Meat Shop', logo: 'mvc.png' },
    mvcfresh: { id: 'mvcfresh', name: 'MVC Fresh Fruits & Veg', logo: 'mvcfresh.png' }
};

// Mock normalizeDateStr
global.normalizeDateStr = function(dInput) {
    if (!dInput) return '';
    if (typeof dInput === 'number') {
        const d = new Date(dInput);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    if (typeof dInput === 'string') {
        const clean = dInput.trim().split(' ')[0];
        const parts = clean.split(/[\/\-\.]/);
        if (parts.length === 3 && parts[0].length === 4) {
            return `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
        }
        const d = new Date(dInput);
        if (!isNaN(d.getTime())) {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
    }
    return '';
};

// Mock document
global.document = {
    getElementById: (id) => {
        return {
            id,
            value: id === 'digest-scheduled-time' ? '23:00' : (id === 'digest-new-manager-phone' ? '0501234567' : ''),
            checked: true,
            style: {},
            innerHTML: '',
            textContent: ''
        };
    }
};

global.alert = (msg) => { console.log("   [ALERT]", msg); };
global.confirm = (msg) => true;

// Mock Firebase db
const now = new Date();
const ksaOffset = 3 * 60;
const localOffset = now.getTimezoneOffset();
const ksaTime = new Date(now.getTime() + (localOffset + ksaOffset) * 60000);
const todayStr = `${ksaTime.getFullYear()}-${String(ksaTime.getMonth() + 1).padStart(2, '0')}-${String(ksaTime.getDate()).padStart(2, '0')}`;
const currentMonth = todayStr.slice(0, 7);

const mockCompanyData = {
    burgeroov: {
        salesLogs: [
            { amount: 1500, date: todayStr, method: 'mada' },
            { amount: 350, date: todayStr, method: 'cash' },
            { amount: 999, date: '2020-01-01', method: 'old' }
        ],
        marketOrders: [
            { totalCost: 420, date: todayStr }
        ],
        workers: [
            {
                id: 'w1',
                name: 'Kinan Chef',
                role: 'Head Chef',
                jobs: [
                    { id: 'j1', title: 'Prepare Brioche Buns', done: true, status: 'completed', completedAt: todayStr },
                    { id: 'j2', title: 'Clean Grill Area', done: true, status: 'completed', completedAt: todayStr },
                    { id: 'j3', title: 'Inventory count', done: false, status: 'pending' }
                ],
                monthlyStats: {
                    [currentMonth]: {
                        violationsList: [],
                        rewardsList: [
                            { amount: 100, date: todayStr, reason: 'Excellence in kitchen hygiene' }
                        ]
                    }
                }
            },
            {
                id: 'w2',
                name: 'Tariq Cashier',
                role: 'Cashier',
                jobs: [
                    { id: 'j4', title: 'Reconcile POS Drawer', done: true, status: 'completed', completedAt: todayStr }
                ],
                monthlyStats: {
                    [currentMonth]: {
                        violationsList: [
                            { amount: 50, date: todayStr, reason: 'Short cash in drawer' }
                        ],
                        rewardsList: []
                    }
                }
            },
            {
                id: 'w3',
                name: 'Saeed Driver',
                role: 'Delivery Driver',
                jobs: [],
                monthlyStats: {}
            }
        ],
        attendance: {
            [todayStr]: {
                'w1': { status: 'present', checkTime: '10:00' },
                'w2': { status: 'present', checkTime: '10:15' },
                'w3': { status: 'absent' }
            }
        },
        paymentRequests: {
            'req1': { workerName: 'Tariq Cashier', amount: 200, status: 'accepted', date: todayStr }
        },
        custodyRequests: {
            'cust1': { workerName: 'Kinan Chef', amount: 500, status: 'accepted', date: todayStr }
        }
    },
    mvc: {
        salesLogs: [
            { amount: 3200, date: todayStr, method: 'visa' }
        ],
        workers: [
            {
                id: 'w_mvc1',
                name: 'Ali Butcher',
                role: 'Master Butcher',
                jobs: [
                    { id: 'j_m1', title: 'Debone Ribeye Prime', done: true, status: 'completed', completedAt: todayStr }
                ]
            }
        ],
        attendance: {
            [todayStr]: {
                'w_mvc1': { status: 'present' }
            }
        }
    }
};

global.getCompanyData = () => mockCompanyData.burgeroov;

global.db = {
    ref: (path) => {
        return {
            on: () => {},
            once: (evt) => {
                const parts = path.split('/');
                if (parts[0] === 'companies') {
                    const slug = parts[1];
                    const val = mockCompanyData[slug] || {};
                    return Promise.resolve({
                        exists: () => !!mockCompanyData[slug],
                        val: () => val
                    });
                }
                return Promise.resolve({ exists: () => false, val: () => null });
            },
            set: (val) => Promise.resolve(),
            update: (val) => Promise.resolve()
        };
    }
};

// Load digest script
eval(fs.readFileSync('js/digest.js', 'utf8'));

// Test compileDailyDigest
async function runTests() {
    console.log("Testing compileDailyDigest in Arabic...");
    const arabicReport = await global.compileDailyDigest();
    console.log("-----------------------------------------");
    console.log(arabicReport);
    console.log("-----------------------------------------");

    assert(arabicReport.includes("تقرير وسجل العمليات اليومي للمدراء"), "Missing Arabic title");
    assert(arabicReport.includes("Burgeroov Restaurant"), "Missing Burgeroov company name");
    assert(arabicReport.includes("المبيعات"), "Missing Sales in Arabic report");
    // Burgeroov sales: 1500 + 350 POS + 420 Market = 2270
    assert(arabicReport.includes("2,270.00"), `Expected 2,270.00 in report`);
    assert(arabicReport.includes("المهام المنجزة اليوم"), "Missing Tasks in Arabic report");
    assert(arabicReport.includes("3 مهمة"), "Expected 3 completed tasks for Burgeroov");
    assert(arabicReport.includes("الموظفون الغائبون (1)"), "Missing absent count");
    assert(arabicReport.includes("Saeed Driver"), "Expected Saeed Driver in absent list");
    assert(arabicReport.includes("Tariq Cashier: 50.00"), "Expected Tariq violation");
    assert(arabicReport.includes("Kinan Chef: 100.00"), "Expected Kinan reward");
    assert(arabicReport.includes("طلبات الصرف المقبولة"), "Missing accepted payment requests");
    assert(arabicReport.includes("Tariq Cashier: 200.00"), "Expected accepted payment of 200");
    assert(arabicReport.includes("طلبات العهدة المقبولة"), "Missing accepted custody requests");
    assert(arabicReport.includes("Kinan Chef: 500.00"), "Expected accepted custody of 500");
    assert(arabicReport.includes("الملخص العام لجميع الشركات"), "Missing grand totals section");

    console.log("✅ Arabic report compiled and verified with 100% data accuracy!");

    // Test English Report
    global.currentAppLang = 'en';
    const englishReport = await global.compileDailyDigest();
    assert(englishReport.includes("Daily Executive Operations Log for Managers"), "Missing English title");
    assert(englishReport.includes("Grand Totals Across All Companies"), "Missing English grand totals");
    console.log("✅ English report compiled and verified!");

    // Test Manager Phone adding and normalization
    console.log("Testing addDigestManagerPhone with local 05... number");
    global.addDigestManagerPhone();
    assert(global.dailyDigestConfig.managers.includes('966501234567'), "Phone was not properly converted to 966501234567");
    console.log("✅ Manager phone added and normalized:", global.dailyDigestConfig.managers);

    // Test Company Exclusion
    console.log("Testing company exclusion toggle...");
    global.toggleDigestCompany('mvcfresh');
    assert(global.dailyDigestConfig.excludedCompanies.includes('mvcfresh'), "mvcfresh should be in excluded list");
    global.toggleDigestCompany('mvcfresh');
    assert(!global.dailyDigestConfig.excludedCompanies.includes('mvcfresh'), "mvcfresh should be un-excluded");
    console.log("✅ Company exclusion toggles verified!");

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉\n");
}

runTests().catch(err => {
    console.error("❌ TEST FAILED:", err);
    process.exit(1);
});
