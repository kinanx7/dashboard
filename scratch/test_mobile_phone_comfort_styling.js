const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TESTING MOBILE PHONE COMFORT & AESTHETIC STYLING (STATS & BARS) ---');

// 1. Check index.html
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(indexHtml.includes('vicard-preview-toolbar'), 'index.html must include vicard-preview-toolbar class');
assert(indexHtml.includes('vicard-preview-select-wrap'), 'index.html must include vicard-preview-select-wrap class');
assert(indexHtml.includes('vicard-preview-label'), 'index.html must include vicard-preview-label class');
assert(indexHtml.includes('vicard-preview-return-btn'), 'index.html must include vicard-preview-return-btn class');
assert(indexHtml.includes('style.css?v=308'), 'style.css cache buster must be v=308');
assert(indexHtml.includes('translations.js?v=308'), 'translations.js cache buster must be v=308');
assert(indexHtml.includes('app.js?v=308'), 'app.js cache buster must be v=308');
console.log('✔ index.html verified with all toolbar classes and v=308 cache-busters.');

// 2. Check style.css
const styleCss = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
assert(styleCss.includes('.vicard-preview-toolbar'), 'style.css must style .vicard-preview-toolbar');
assert(styleCss.includes('#vicard-website-card-select'), 'style.css must style #vicard-website-card-select');
assert(styleCss.includes('.keeta-menu-nav-title'), 'style.css must handle .keeta-menu-nav-title');
assert(styleCss.includes('.vicard-tier-banner-msg'), 'style.css must style .vicard-tier-banner-msg');
assert(styleCss.includes('.keeta-storefront-hero'), 'style.css must style .keeta-storefront-hero');
console.log('✔ style.css verified with all responsive mobile styling rules.');

// 3. Check js/nfc.js and bundled app.js
const nfcJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'nfc.js'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
assert(nfcJs.includes('vicard-tier-banner-msg'), 'js/nfc.js must apply vicard-tier-banner-msg class');
assert(appJs.includes('vicard-tier-banner-msg'), 'app.js must contain bundled vicard-tier-banner-msg class');
console.log('✔ js/nfc.js and app.js verified with tier banner classes in bundle.');

console.log('\n--- ALL MOBILE COMFORT TESTS PASSED SUCCESSFULLY! 🚀 ---');
