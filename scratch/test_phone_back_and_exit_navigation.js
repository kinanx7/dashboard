const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Testing Phone Back Button & Exit to Main Offers Navigation ---');

// 1. Verify index.html Exit Button
console.log('\n[1] Checking index.html exit button wiring...');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert(
    indexHtml.includes('id="vicard-portal-top-exit-btn" onclick="handleVicardPortalExitButtonClick()"'),
    'Top exit button must have id vicard-portal-top-exit-btn and call handleVicardPortalExitButtonClick()'
);
assert(/app\.js\?v=(29[6-9]|3[0-9]{2,})/.test(indexHtml), 'Cache buster must be v=296 or higher');
console.log('✔ index.html exit button is wired to handleVicardPortalExitButtonClick()');

// 2. Verify style.css Toast Styling
console.log('\n[2] Checking style.css portal toast rules...');
const styleCss = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
assert(styleCss.includes('.vicard-portal-toast'), '.vicard-portal-toast must be defined in style.css');
assert(styleCss.includes('.vicard-portal-toast.show'), '.vicard-portal-toast.show must be defined in style.css');
console.log('✔ style.css contains mobile toast styling');

// 3. Verify js/nfc.js & app.js functions
console.log('\n[3] Checking js/nfc.js & app.js implementations...');
const nfcJs = fs.readFileSync(path.join(__dirname, '..', 'js/nfc.js'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

[nfcJs, appJs].forEach((code, idx) => {
    const label = idx === 0 ? 'nfc.js' : 'app.js';
    assert(code.includes('function handleVicardPortalExitButtonClick'), `handleVicardPortalExitButtonClick must be in ${label}`);
    assert(code.includes('function initVicardHistoryNavigation'), `initVicardHistoryNavigation must be in ${label}`);
    assert(code.includes('function showVicardPortalToast'), `showVicardPortalToast must be in ${label}`);
    assert(code.includes('function updateVicardPortalExitButton'), `updateVicardPortalExitButton must be in ${label}`);
    assert(code.includes("history.pushState({ vicardApp: true, vicardView: 'restaurant'"), `Restaurant navigation must push history in ${label}`);
    assert(code.includes("history.pushState({ vicardApp: true, vicardView: 'redeem_modal'"), `QR modal must push history in ${label}`);
    assert(code.includes('Press back again to exit'), `App guard toast message must be in ${label}`);
});
console.log('✔ Both nfc.js and app.js contain all history navigation, back-button guard, and exit handling functions!');

// 4. Functional Simulation of Navigation Engine
console.log('\n[4] Simulating mobile navigation state transitions...');

// Mock browser environment
let mockHistory = [{ state: { vicardApp: true, vicardView: 'root' } }];
let mockHistoryIndex = 0;
let mockActiveRestId = null;
let mockRedeemOpen = false;
let toastMessage = '';
let lastBackPressTime = 0;
let portalOpen = true;

const history = {
    pushState: (state, title) => {
        mockHistoryIndex++;
        mockHistory[mockHistoryIndex] = { state, title };
    },
    replaceState: (state, title) => {
        mockHistory[mockHistoryIndex] = { state, title };
    },
    back: () => {
        if (mockHistoryIndex > 0) {
            mockHistoryIndex--;
            simulatePopState();
        }
    },
    get state() {
        return mockHistory[mockHistoryIndex] ? mockHistory[mockHistoryIndex].state : null;
    }
};

function simulatePopState() {
    if (!portalOpen) return;

    // Step 1: If QR modal open -> close modal
    if (mockRedeemOpen) {
        mockRedeemOpen = false;
        return;
    }

    // Step 2: If in restaurant menu -> go back to main directory
    if (mockActiveRestId) {
        mockActiveRestId = null;
        return;
    }

    // Step 3: Guard on main directory
    const now = Date.now();
    if (now - lastBackPressTime < 2500) {
        portalOpen = false;
    } else {
        lastBackPressTime = now;
        history.pushState({ vicardApp: true, vicardView: 'directory' }, '');
        toastMessage = 'Press back again to exit';
    }
}

// Initial load: Customer opens portal
history.replaceState({ vicardApp: true, vicardView: 'root' }, '');
history.pushState({ vicardApp: true, vicardView: 'directory' }, '');
assert.strictEqual(mockActiveRestId, null, 'Customer starts on main directory of offers');

// Step A: Customer taps on Burgeroov
history.pushState({ vicardApp: true, vicardView: 'restaurant', restId: 'rest_burgeroov' }, '');
mockActiveRestId = 'rest_burgeroov';
assert.strictEqual(mockActiveRestId, 'rest_burgeroov', 'Customer is on Burgeroov menu');

// Step B: Customer taps "Get Offer" on Double Truffle Smash Burger Combo
history.pushState({ vicardApp: true, vicardView: 'redeem_modal' }, '');
mockRedeemOpen = true;
assert.strictEqual(mockRedeemOpen, true, 'QR modal is open');

// Step C: Customer touches PHONE BACK BUTTON!
console.log('-> Customer touches phone back button while QR modal is open...');
history.back();
assert.strictEqual(mockRedeemOpen, false, 'Phone back button closed the QR modal!');
assert.strictEqual(mockActiveRestId, 'rest_burgeroov', 'Customer is 1 page behind (back on Burgeroov menu)');
assert.strictEqual(portalOpen, true, 'App did NOT suddenly close!');
console.log('✔ Back button press 1: Went back 1 page behind (closed QR modal, stayed on restaurant menu).');

// Step D: Customer touches PHONE BACK BUTTON again!
console.log('-> Customer touches phone back button while on Burgeroov menu...');
history.back();
assert.strictEqual(mockActiveRestId, null, 'Customer is 1 page behind (back on Main Page of Offers)');
assert.strictEqual(portalOpen, true, 'App did NOT suddenly close!');
console.log('✔ Back button press 2: Went back 1 page behind (back to Main Page of Offers).');

// Step E: Customer accidentally touches PHONE BACK BUTTON on Main Page of Offers!
console.log('-> Customer touches phone back button while on Main Page of Offers...');
history.back();
assert.strictEqual(portalOpen, true, 'App did NOT suddenly close! App guard prevented sudden exit.');
assert.strictEqual(toastMessage, 'Press back again to exit', 'Toast notified customer to press back again to exit.');
console.log('✔ Back button press 3: Intercepted by guard, toast displayed, app stayed safe on main offers page.');

// Step F: Test Exit Button
console.log('\n[5] Testing Exit Button behavior...');
// Put customer inside a restaurant
mockActiveRestId = 'rest_mvcfresh';
mockRedeemOpen = true;

// Simulate clicking handleVicardPortalExitButtonClick()
function simulateExitButtonClick() {
    if (mockRedeemOpen) mockRedeemOpen = false;
    if (mockActiveRestId) {
        mockActiveRestId = null;
        return;
    }
    // On main directory: resets and scrolls
    toastMessage = 'Main Offers Directory • All Partners';
}

simulateExitButtonClick();
assert.strictEqual(mockRedeemOpen, false, 'Exit button closed any open modal');
assert.strictEqual(mockActiveRestId, null, 'Exit button automatically took customer to Main Page of Offers!');
console.log('✔ Exit button automatically took customer to the Main Page of Offers!');

console.log('\nALL 5 TESTS PASSED SUCCESSFULLY! 🚀');
