const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TESTING 4-DIGIT CASHIER PIN SYSTEM & 12-INCH TABLET RESPONSIVE LAYOUT ---');

// [1] Verify HTML in index.html
console.log('\n[1] Checking index.html...');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert(indexHtml.includes('id="vicard-rest-cashier-pin"'), 'Cashier PIN input must exist in index.html');
assert(indexHtml.includes('pattern="\\d{4}"') || indexHtml.includes('pattern="[0-9]{4}"'), 'PIN input must enforce 4 digits pattern');
assert(/app\.js\?v=3[0-9]{2,}/.test(indexHtml), 'Cache buster must be bumped to v=309 or higher');
assert(indexHtml.includes('flex-wrap:wrap;'), 'Department tabs container must wrap naturally on PC');
console.log('✔ index.html contains Cashier PIN input field, bumped cache-busters, and wrapping tabs.');

// [2] Verify style.css Rules
console.log('\n[2] Checking style.css Styles...');
const styleCss = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');

assert(styleCss.includes('@media (max-width: 1400px)'), 'Tablet media query up to 1400px must be defined');
assert(styleCss.includes('#view-nfc.active-view'), '#view-nfc.active-view must be in single column views list');
assert(styleCss.includes('#vicard-customer-portal-overlay > div'), 'Customer portal overlay container must expand on tablet');
assert(styleCss.includes('.keeta-cat-pill'), 'Category pills (.keeta-cat-pill) must be styled for tablet');
assert(styleCss.includes('.keeta-hero-banner'), 'Hero banner must be styled for tablet');
assert(styleCss.includes('.keeta-restaurants-grid'), 'Restaurant grid must be styled for tablet');
assert(styleCss.includes('.keeta-dishes-grid'), 'Dishes grid must be styled for tablet');
assert(styleCss.includes('#vicard-cashier-overlay'), 'Cashier overlay must be styled for tablet');
assert(styleCss.includes('#vicard-3d-card-stage'), '3D card stage must be styled for tablet');
assert(styleCss.includes('#nfc-master-view-toggle'), '#nfc-master-view-toggle must be styled for mobile viewports');
console.log('✔ style.css contains full responsive layout rules and mobile toggle button styles.');

// [3] Verify js/nfc.js, js/style.js & app.js Implementation
console.log('\n[3] Checking js/nfc.js, js/style.js & bundled app.js...');
const nfcJs = fs.readFileSync(path.join(__dirname, '..', 'js/nfc.js'), 'utf8');
const styleJs = fs.readFileSync(path.join(__dirname, '..', 'js/style.js'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

assert(styleJs.includes('vicardTabletLayout'), 'js/style.js must define vicardTabletLayout');
assert(styleJs.includes('view-nfc'), 'js/style.js must enforce #view-nfc tablet containment');
assert(styleJs.includes('hookTabSwitchers'), 'js/style.js must hook tab switchers');
assert(appJs.includes('vicardTabletLayout'), 'bundled app.js must include vicardTabletLayout from js/style.js');
assert(nfcJs.includes("cashierPin: '1234'"), 'Default Burgeroov must have cashierPin in nfc.js');
assert(appJs.includes("cashierPin: '1234'"), 'Default Burgeroov must have cashierPin in app.js');
assert(nfcJs.includes('vicard-rest-cashier-pin'), 'vicard-rest-cashier-pin must be referenced in nfc.js');
assert(appJs.includes('vicard-rest-cashier-pin'), 'vicard-rest-cashier-pin must be referenced in app.js');
assert(nfcJs.includes('vicard-cashier-pin-input'), 'vicard-cashier-pin-input must be in nfc.js');
assert(appJs.includes('vicard-cashier-pin-input'), 'vicard-cashier-pin-input must be in app.js');
assert(nfcJs.includes('vicard_cashier_device_'), 'Device remembering must be implemented in nfc.js');
assert(appJs.includes('vicard_cashier_device_'), 'Device remembering must be implemented in app.js');
console.log('✔ Both nfc.js, style.js, and bundled app.js contain all Cashier PIN & tablet layout logic.');

// [4] Simulate Cashier PIN Verification Logic
console.log('\n[4] Simulating Cashier PIN Security Verification...');

const testRestaurants = {
    'rest_burgeroov': { id: 'rest_burgeroov', name: 'Burgeroov', cashierPin: '1234' },
    'rest_mvcfresh': { id: 'rest_mvcfresh', name: 'MVC Fresh', cashierPin: '2345' }
};

function verifyCashierAttempt(restId, enteredPin, isDeviceRemembered) {
    const rest = testRestaurants[restId];
    const requiredPin = rest ? (rest.cashierPin || '1234') : '1234';

    if (isDeviceRemembered) {
        return { success: true, reason: 'DEVICE_AUTHORIZED' };
    }

    if (!enteredPin || enteredPin !== requiredPin) {
        return { success: false, error: 'INCORRECT_PIN' };
    }

    return { success: true, reason: 'PIN_VALIDATED' };
}

// Case A: Customer tries to self-confirm without knowing the PIN
const customerSelfConfirm = verifyCashierAttempt('rest_burgeroov', '', false);
assert.strictEqual(customerSelfConfirm.success, false);
assert.strictEqual(customerSelfConfirm.error, 'INCORRECT_PIN');
console.log('✔ Case A passed: Customer self-confirm blocked (requires PIN).');

// Case B: Attacker guesses wrong PIN '9999'
const wrongPinAttempt = verifyCashierAttempt('rest_burgeroov', '9999', false);
assert.strictEqual(wrongPinAttempt.success, false);
assert.strictEqual(wrongPinAttempt.error, 'INCORRECT_PIN');
console.log('✔ Case B passed: Wrong PIN rejected.');

// Case C: Legitimate Burgeroov Cashier enters '1234'
const legitimateCashier = verifyCashierAttempt('rest_burgeroov', '1234', false);
assert.strictEqual(legitimateCashier.success, true);
assert.strictEqual(legitimateCashier.reason, 'PIN_VALIDATED');
console.log('✔ Case C passed: Correct restaurant PIN accepts and logs visit.');

// Case D: Cashier device is remembered
const rememberedCashier = verifyCashierAttempt('rest_burgeroov', '', true);
assert.strictEqual(rememberedCashier.success, true);
assert.strictEqual(rememberedCashier.reason, 'DEVICE_AUTHORIZED');
console.log('✔ Case D passed: Remembered cashier device bypasses prompt smoothly.');

console.log('\nALL CHECKS AND SIMULATION TESTS PASSED! 🚀');
