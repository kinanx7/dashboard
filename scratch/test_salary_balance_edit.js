// Standalone verification script for Worker Salary & All-Time Remaining calibration
const assert = require('assert');

// Mock worker data
const worker = {
    id: 'worker_1',
    name: 'Sinan',
    branch: 'Main Branch',
    role: 'Chef',
    income: 4500,
    initialBalance: 8427,
    monthlyStats: {
        '2026-08': {
            rewardsList: [{ amount: 200 }],
            violationsList: [{ amount: 100 }],
            paymentsList: [{ amount: 4600 }],
            overtimeList: []
        },
        '2026-09': {
            rewardsList: [],
            violationsList: [],
            paymentsList: [],
            overtimeList: []
        }
    }
};

function calculateRewardsTotal(list) {
    return (list || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);
}
function calculateViolationsTotal(list) {
    return (list || []).reduce((s, v) => s + parseFloat(v.amount || 0), 0);
}
function calculatePaymentsTotal(list) {
    return (list || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0);
}
function calculateOvertimeTotal(list) {
    return (list || []).reduce((s, o) => s + parseFloat(o.amount || 0), 0);
}

function getCumulativeBalance(w, maxMonthStr) {
    const allMonths = Object.keys(w.monthlyStats || {}).sort();
    let balance = parseFloat(w.initialBalance || 0);
    for (const m of allMonths) {
        const stats = w.monthlyStats[m];
        const base = parseFloat(w.income || 0);
        const rew = calculateRewardsTotal(stats.rewardsList);
        const viol = calculateViolationsTotal(stats.violationsList);
        const ov = calculateOvertimeTotal(stats.overtimeList);
        const netThisMonth = base + rew + ov - viol;
        const paidThisMonth = calculatePaymentsTotal(stats.paymentsList);
        balance += (netThisMonth - paidThisMonth);
        if (m === maxMonthStr) break;
    }
    return balance;
}

// 1. Check initial state
const initialComputed = getCumulativeBalance(worker, '2026-09');
console.log('Initial all-time balance:', initialComputed);
assert.strictEqual(initialComputed, 12927, 'Initial balance should be 12,927');

// 2. Simulate User Action 1:
// User changes salary to 5,000 and target all-time remaining to 15,000
function calibrateBalance(w, newSalary, newTargetRemaining, currentMonth) {
    const oldInitialBalance = parseFloat(w.initialBalance || 0);
    w.income = newSalary;
    const currentBalanceWithNewSalary = getCumulativeBalance(w, currentMonth);
    const monthlyAccumulation = currentBalanceWithNewSalary - oldInitialBalance;
    const newInitialBalance = Math.round((newTargetRemaining - monthlyAccumulation) * 100) / 100;
    w.initialBalance = newInitialBalance;
    return newInitialBalance;
}

const newInitial = calibrateBalance(worker, 5000, 15000, '2026-09');
const verifiedBalance = getCumulativeBalance(worker, '2026-09');
console.log('Case 1: Salary = 5000, Target = 15000');
console.log('Calibrated Initial Balance:', newInitial);
console.log('Verified Cumulative Balance:', verifiedBalance);
assert.strictEqual(worker.income, 5000, 'Income must be 5000');
assert.strictEqual(verifiedBalance, 15000, 'Cumulative balance must exactly match 15,000');

// 3. Simulate User Action 2:
// User keeps salary at 5,000 but sets all-time remaining to 10,000
calibrateBalance(worker, 5000, 10000, '2026-09');
const verifiedBalance2 = getCumulativeBalance(worker, '2026-09');
console.log('Case 2: Salary = 5000, Target = 10000');
console.log('Verified Cumulative Balance:', verifiedBalance2);
assert.strictEqual(verifiedBalance2, 10000, 'Cumulative balance must exactly match 10,000');

// 4. Simulate User Action 3:
// Set all-time remaining to 0 (fully settled debt/balance)
calibrateBalance(worker, 4500, 0, '2026-09');
const verifiedBalance3 = getCumulativeBalance(worker, '2026-09');
console.log('Case 3: Salary = 4500, Target = 0');
console.log('Verified Cumulative Balance:', verifiedBalance3);
assert.strictEqual(verifiedBalance3, 0, 'Cumulative balance must exactly match 0');

console.log('✅ ALL TEST CASES PASSED SUCCESSFULLY!');
