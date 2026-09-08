const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== RUNNING VERIFICATION FOR MOBILE QR POSITION, ADVANCED MENU VIEW & REALTIME CELEBRATION ===\n');

// 1. Check style.css
console.log('[1] Verifying style.css responsive rules...');
const styleCss = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');

// Check elevated QR modal
assert(styleCss.includes('#vicard-redeem-modal {'), 'Must have #vicard-redeem-modal styling');
assert(styleCss.includes('align-items: flex-start !important;'), 'Must have align-items: flex-start for elevated QR modal on mobile');
assert(styleCss.includes('padding: 24px 16px 20px 16px !important;'), 'Must have elevated padding for QR modal on mobile');

// Check 1-column mobile grids
assert(styleCss.includes('.keeta-restaurants-grid,\n    .keeta-dishes-grid {') || styleCss.includes('.keeta-restaurants-grid,\r\n    .keeta-dishes-grid {'), 'Must group restaurant and dishes grid for mobile');
assert(styleCss.includes('grid-template-columns: 1fr !important;'), 'Must enforce 1-column grid on mobile phones');

// Check dish card layout
assert(styleCss.includes('.keeta-dish-main {'), 'Must style .keeta-dish-main');
assert(styleCss.includes('flex-direction: row !important;'), 'Dish main must be flex-row on mobile');
assert(styleCss.includes('.keeta-dish-name {'), 'Must style .keeta-dish-name');
assert(styleCss.includes('.keeta-dish-desc {'), 'Must style .keeta-dish-desc');
assert(styleCss.includes('.keeta-dish-price-row {'), 'Must style .keeta-dish-price-row');
assert(styleCss.includes('.keeta-dish-visual {'), 'Must style .keeta-dish-visual');

// Check card golden border & hide MEMBER DINING NETWORK
assert(styleCss.includes('.keeta-brand-card-img {'), 'Must style .keeta-brand-card-img');
assert(styleCss.includes('border: 1.5px solid #d4af37;'), 'Must have golden border on front_card.png');
assert(styleCss.includes('background: transparent !important;'), 'Must have transparent background on card img');
assert(styleCss.includes('.keeta-brand-sub {\n    display: none !important;\n}') || styleCss.includes('.keeta-brand-sub {\r\n    display: none !important;\r\n}'), 'Must hide .keeta-brand-sub');

// Check keyframes
assert(styleCss.includes('@keyframes vicardPopIn'), 'Must define @keyframes vicardPopIn');
assert(styleCss.includes('@keyframes vicardBounce'), 'Must define @keyframes vicardBounce');

console.log('✔ style.css verified with elevated QR, 1-column mobile grids, golden border and celebration animations.');

// 2. Check index.html
console.log('\n[2] Verifying index.html...');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert(indexHtml.includes('style.css?v=310'), 'index.html must reference style.css?v=310');
assert(indexHtml.includes('app.js?v=310'), 'index.html must reference app.js?v=310');
assert(indexHtml.includes('front_card.png?v=310'), 'index.html must reference front_card.png?v=310');
assert(!indexHtml.includes('MEMBER DINING NETWORK'), 'index.html must NOT contain MEMBER DINING NETWORK');
assert(indexHtml.includes('vicard-redeem-customer-tier'), 'index.html must include vicard-redeem-customer-tier in QR modal');

console.log('✔ index.html verified with clean front_card.png, customer tier badge, and v=310 cache busters.');

// 3. Check js/nfc.js & app.js
console.log('\n[3] Verifying js/nfc.js & bundled app.js...');
const nfcJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'nfc.js'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

for (const [name, code] of [['js/nfc.js', nfcJs], ['app.js', appJs]]) {
    assert(!code.includes('MEMBER DINING NETWORK'), `${name} must NOT contain MEMBER DINING NETWORK`);
    assert(code.includes('front_card.png?v=310'), `${name} must reference front_card.png?v=310`);
    assert(code.includes('showVicardDiscountSuccessMessage'), `${name} must define showVicardDiscountSuccessMessage`);
    assert(code.includes('Enjoy your discount!'), `${name} must contain celebration message "Enjoy your discount!"`);
    assert(code.includes('lastRedemption'), `${name} must manage lastRedemption in Firebase`);
    assert(code.includes('_vicardRedeemListener'), `${name} must attach/detach _vicardRedeemListener`);
    assert(code.includes('_vicardRedeemModalOriginalHtml'), `${name} must cache and restore modal HTML for replayability`);
}

console.log('✔ js/nfc.js and bundled app.js verified with realtime discount celebration and clean headers.');

console.log('\n======================================================');
console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY! 🎉');
console.log('======================================================');
