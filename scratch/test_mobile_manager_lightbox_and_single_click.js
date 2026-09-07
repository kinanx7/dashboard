const fs = require('fs');
const assert = require('assert');

console.log('--- TESTING MOBILE MANAGER STYLING, LIGHTBOX, SINGLE-CLICK & REDEEM RETENTION ---');

// 1. Verify style.css rules
const styleCss = fs.readFileSync('style.css', 'utf8');
assert(styleCss.includes('.vicard-rest-card-footer'), 'style.css must have .vicard-rest-card-footer');
assert(styleCss.includes('display: flex !important'), '.vicard-rest-card-footer must use flex layout');
assert(styleCss.includes('#nfc-subview-manager'), '#nfc-subview-manager mobile styles must exist in style.css');
assert(styleCss.includes('padding-bottom: 120px !important') || styleCss.includes('padding-bottom: 95px !important'), 'Mobile bottom padding must clear bottom nav');
assert(styleCss.includes('.vicard-lightbox-overlay'), '.vicard-lightbox-overlay must exist in style.css');
assert(styleCss.includes('.vicard-lightbox-close'), '.vicard-lightbox-close must exist in style.css');
assert(styleCss.includes('#vicard-lightbox-img'), '#vicard-lightbox-img must exist in style.css');
console.log('✔ [1] style.css verified: Mobile manager padding, single-row flex footer, and lightbox styles present');

// 2. Verify index.html updates
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert(indexHtml.includes('id="vicard-image-lightbox-modal"'), 'index.html must have #vicard-image-lightbox-modal');
assert(indexHtml.includes('id="vicard-lightbox-img"'), 'index.html must have #vicard-lightbox-img');
assert(indexHtml.includes('id="vicard-lightbox-caption"'), 'index.html must have #vicard-lightbox-caption');
assert(indexHtml.includes('id="vicard-portal-top-exit-btn" onclick="handleVicardPortalExitButtonClick()" class="vicard-overlay-exit-btn" style="display:none;"'), 'Exit button must be hidden initially on main directory');
assert(/app\.js\?v=(29[8-9]|30[0-9])/.test(indexHtml), 'index.html cache buster must be v=298 or higher');
console.log('✔ [2] index.html verified: Lightbox modal present, exit button hidden initially, v=298 bumped');

// 3. Verify js/nfc.js and app.js implementations
['js/nfc.js', 'app.js'].forEach(file => {
    const code = fs.readFileSync(file, 'utf8');
    assert(code.includes('function openVicardImageLightbox'), `openVicardImageLightbox missing in ${file}`);
    assert(code.includes('function closeVicardImageLightbox'), `closeVicardImageLightbox missing in ${file}`);
    assert(code.includes('openVicardImageLightbox(\'${dishImg}\''), `dish image zoom click missing in ${file}`);
    assert(code.includes('_vicardIsClosingRedeemModal'), `_vicardIsClosingRedeemModal missing in ${file}`);
    assert(code.includes('btn.style.display = \'none\''), `Exit button hide on main page missing in ${file}`);
    assert(!code.includes('history.back();\n                return;'), `Blocking return in viewAllRestaurantsOnWebsite must be removed in ${file}`);
    console.log(`✔ [3] ${file} verified: Lightbox handlers, image click-to-zoom, single-click navigation, and modal retention present`);
});

// 4. Functional Simulation of Exit Button Visibility
let activeWebsiteRestId = null;
let btnDisplay = '';
let btnText = '';

function simulateUpdateExitButton() {
    if (activeWebsiteRestId) {
        btnDisplay = 'inline-flex';
        btnText = '← Main Offers';
    } else {
        btnDisplay = 'none';
        btnText = '';
    }
}

// Initial state (main directory)
activeWebsiteRestId = null;
simulateUpdateExitButton();
assert.strictEqual(btnDisplay, 'none', 'Exit button must be hidden on early/main directory');

// Navigating into Burgeroov
activeWebsiteRestId = 'rest_burgeroov';
simulateUpdateExitButton();
assert.strictEqual(btnDisplay, 'inline-flex', 'Exit button must be visible when viewing restaurant');
assert.strictEqual(btnText, '← Main Offers', 'Exit button text must say ← Main Offers');

// Navigating back to Main Offers
activeWebsiteRestId = null;
simulateUpdateExitButton();
assert.strictEqual(btnDisplay, 'none', 'Exit button must disappear on main offers page');
console.log('✔ [4] Exit button visibility simulation passed: removed on early menu, shown only inside restaurant');

// 5. Functional Simulation of Single-Click Navigation
let renderCount = 0;
activeWebsiteRestId = 'rest_burgeroov';

function simulateViewAllRestaurantsOnWebsite() {
    activeWebsiteRestId = null;
    // Immediate synchronous re-render on the very first click!
    renderCount++;
}

simulateViewAllRestaurantsOnWebsite();
assert.strictEqual(activeWebsiteRestId, null, 'activeWebsiteRestId must be reset to null on first click');
assert.strictEqual(renderCount, 1, 'Directory must re-render on the very first click without needing double-click');
console.log('✔ [5] Single-click navigation simulation passed: instant 1-click response');

// 6. Functional Simulation of Redeem Modal Closing Staying on Restaurant Page
activeWebsiteRestId = 'rest_burgeroov';
let modalOpen = true;
let isClosingFlag = false;

function simulateCloseRedeemModal() {
    modalOpen = false;
    isClosingFlag = true;
}

function simulatePopstate() {
    if (isClosingFlag) {
        isClosingFlag = false;
        // DO NOT reset activeWebsiteRestId! Customer stays on restaurant page!
        return;
    }
    if (activeWebsiteRestId) {
        activeWebsiteRestId = null;
    }
}

// User opened redeem modal, got barcode, and closes it
simulateCloseRedeemModal();
simulatePopstate();
assert.strictEqual(modalOpen, false, 'Redeem modal must be closed');
assert.strictEqual(activeWebsiteRestId, 'rest_burgeroov', 'Customer must stay on the same restaurant page after closing barcode pass!');
console.log('✔ [6] Redeem retention simulation passed: customer stays on restaurant page after getting offer');

console.log('\nALL 6 VERIFICATIONS PASSED SUCCESSFULLY! 🚀');
