const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Testing VIP Table HUD & Restored 3D Floating/Rotating Card Loading Screen ---');

// 1. Verify Card Asset Files
console.log('\n[1] Verifying Physical Card Assets...');
const frontCardPng = path.join(__dirname, '..', 'front_card.png');
const backCardPng = path.join(__dirname, '..', 'back_card.png');

assert(fs.existsSync(frontCardPng), 'front_card.png must exist');
assert(fs.existsSync(backCardPng), 'back_card.png must exist');
console.log('✔ Assets verified: front_card.png and back_card.png both exist.');

// 2. Verify CSS Rules in style.css
console.log('\n[2] Verifying CSS Rules in style.css...');
const styleCss = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');

assert(styleCss.includes('.vicard-3d-scene'), '.vicard-3d-scene must be defined');
assert(styleCss.includes('.vicard-3d-card-rotator'), '.vicard-3d-card-rotator must be defined');
assert(styleCss.includes('vicard3DSpin'), 'vicard3DSpin keyframes must be defined');
assert(styleCss.includes('vicard3DFloat'), 'vicard3DFloat keyframes must be defined');
assert(styleCss.includes('.vicard-3d-face.front'), '.vicard-3d-face.front must be defined');
assert(styleCss.includes('.vicard-3d-face.back'), '.vicard-3d-face.back must be defined');
assert(styleCss.includes('front_card.png'), 'CSS must reference front_card.png');
assert(styleCss.includes('back_card.png'), 'CSS must reference back_card.png');
assert(styleCss.includes('.vicard-3d-shadow'), '.vicard-3d-shadow must be defined');
assert(styleCss.includes('.vicard-loading-laser-track'), '.vicard-loading-laser-track must be defined');
assert(styleCss.includes('.vicard-hud-cell'), '.vicard-hud-cell must be defined');
assert(styleCss.includes('white-space: nowrap'), 'HUD cell must prevent awkward wrapping');
console.log('✔ All 3D floating, spinning, laser loading with front_card.png & back_card.png, and HUD CSS rules are present.');

// 3. Verify HTML Updates in index.html
console.log('\n[3] Verifying index.html Updates...');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert(indexHtml.includes('Card ID & VIP Tier'), 'Table header must say Card ID & VIP Tier');
assert(indexHtml.includes('vicard-overlay-exit-btn'), 'Exit buttons must have modern styling class');
assert(/app\.js\?v=(30[0-9])/.test(indexHtml), 'Cache buster must be bumped to v=302 or higher');
console.log('✔ index.html contains updated table header, exit button styling, and cache busters.');

// 4. Verify Translations in translations.js
console.log('\n[4] Verifying Translations...');
const translationsJs = fs.readFileSync(path.join(__dirname, '..', 'translations.js'), 'utf8');

assert(translationsJs.includes('"nfc-th-card-id": "Card ID & VIP Tier"'), 'English translation must be Card ID & VIP Tier');
assert(translationsJs.includes('"nfc-th-card-id": "كود وفئة البطاقة"'), 'Arabic translation must be كود وفئة البطاقة');
console.log('✔ Translations verified for English and Arabic.');

// 5. Verify js/nfc.js and app.js
console.log('\n[5] Verifying nfc.js & app.js Implementation...');
const nfcJs = fs.readFileSync(path.join(__dirname, '..', 'js/nfc.js'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

assert(nfcJs.includes('function getVicard3DCardLoadingHtml'), 'getVicard3DCardLoadingHtml must exist in js/nfc.js');
assert(appJs.includes('function getVicard3DCardLoadingHtml'), 'getVicard3DCardLoadingHtml must exist in app.js');
assert(nfcJs.includes('vicard-3d-scene'), 'vicard-3d-scene must be generated in nfc.js');
assert(appJs.includes('vicard-3d-scene'), 'vicard-3d-scene must be generated in app.js');
assert(nfcJs.includes('vicard-hud-cell'), 'vicard-hud-cell must be used in nfc.js');
assert(appJs.includes('vicard-hud-cell'), 'vicard-hud-cell must be used in app.js');
assert(nfcJs.includes('getDefaultVicardRestaurants'), 'getDefaultVicardRestaurants must be present for instant load');
assert(appJs.includes('getDefaultVicardRestaurants'), 'getDefaultVicardRestaurants must be present in app.js');

console.log('✔ Both nfc.js and bundled app.js contain the restored 3D card loading scene and HUD features!');
console.log('\nALL TESTS PASSED SUCCESSFULLY! 🚀');
