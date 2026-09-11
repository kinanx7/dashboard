const fs = require('fs');
const assert = require('assert');

console.log('--- TESTING 1.5S LOADING, SPIN SPEED, MONTHLY OFFERS CALCULATION & MANAGER DISPLAY ---');

// 1. Check style.css animation speeds
console.log('\n[1] Verifying style.css 3D spin & animation speed enhancements...');
const styleCss = fs.readFileSync('style.css', 'utf8');

assert(styleCss.includes('vicard3DSpin 2.5s'), 'vicard3DSpin must be 2.5s for faster spin speed');
assert(styleCss.includes('vicard3DFloat 2s'), 'vicard3DFloat must be 2s for snappier float');
assert(styleCss.includes('vicardHoloSweep 2.0s'), 'vicardHoloSweep must be 2.0s');
assert(styleCss.includes('vicardLaserMove 1.0s'), 'vicardLaserMove must be 1.0s for rapid progress feedback');
console.log('✔ style.css spin speed and 3D card animation timings successfully increased!');

// 2. Check loading duration in js/nfc.js and app.js
console.log('\n[2] Verifying 1.5s loading time in nfc.js & app.js...');
const nfcJs = fs.readFileSync('js/nfc.js', 'utf8');
const appJs = fs.readFileSync('app.js', 'utf8');

assert(!nfcJs.includes('renderAuthorizedCustomerPortal(finalCard);\n        }, 3000);'), '3000ms timeout in openVicardCustomerPortal must be replaced');
assert(nfcJs.includes('renderAuthorizedCustomerPortal(finalCard);\n        }, 1500);'), 'openVicardCustomerPortal must use 1500ms (1.5s)');
assert(nfcJs.includes('renderAuthorizedCustomerPortal(card);\n        }, 1500);'), 'unlockVicardWithPhone must use 1500ms (1.5s)');
assert(appJs.includes('renderAuthorizedCustomerPortal(finalCard);\n        }, 1500);'), 'bundled app.js must have 1500ms for openVicardCustomerPortal');
assert(appJs.includes('renderAuthorizedCustomerPortal(card);\n        }, 1500);'), 'bundled app.js must have 1500ms for unlockVicardWithPhone');
console.log('✔ Loading durations in both nfc.js and app.js verified at 1.5s (1500ms).');

// 3. Test monthly visits calculation logic
console.log('\n[3] Testing getCustomerMonthlyVisits calculation logic...');
// Extract getCustomerMonthlyVisits function from nfc.js and evaluate it in test scope
const funcMatch = nfcJs.match(/function getCustomerMonthlyVisits\(card\) {[\s\S]*?window\.getCustomerMonthlyVisits/);
assert(funcMatch, 'getCustomerMonthlyVisits must be found in nfc.js');

const evalCode = funcMatch[0].replace('window.getCustomerMonthlyVisits', 'return getCustomerMonthlyVisits;');
const getCustomerMonthlyVisits = new Function(evalCode)();

const now = new Date();
const currentTimestamp = Date.now();
const pastMonthTimestamp = new Date(now.getFullYear(), now.getMonth() - 1, 15).getTime();

// Test Card with 1 visit today
const cardWith1Visit = {
    id: 'VIC-TEST-1',
    tier: 'Gold VIP',
    subscriptionEndDate: currentTimestamp + 365 * 86400000, // 1 year future subscription!
    visitHistory: [
        {
            timestamp: currentTimestamp,
            restName: 'Burgeroov',
            unitName: 'Double Truffle Smash Burger Combo',
            amountSpent: 42,
            amountSaved: 16
        },
        {
            timestamp: pastMonthTimestamp, // Last month
            restName: 'Burgeroov',
            unitName: 'Double Truffle Smash Burger Combo',
            amountSpent: 42,
            amountSaved: 16
        }
    ]
};

const monthlyVisits1 = getCustomerMonthlyVisits(cardWith1Visit);
console.log('Calculated monthly visits for customer with 1 visit this month & 1 visit last month:', monthlyVisits1);
assert.strictEqual(monthlyVisits1, 1, 'Should count exactly 1 visit in current calendar month');

// Test remaining offers calculation
const goldLimit = 10;
const remainingOffers = Math.max(0, goldLimit - monthlyVisits1);
console.log(`Offers display: ${monthlyVisits1} / ${goldLimit} used (${remainingOffers} remaining this month)`);
assert.strictEqual(remainingOffers, 9, 'Remaining offers should be 9 when 1 is used out of 10');

// Test Card with monthlyVisitsUsed field (e.g. from cashier update)
const cardWithField = {
    id: 'VIC-TEST-2',
    tier: 'Silver VIP',
    monthlyCycleKey: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    monthlyVisitsUsed: 3
};
const monthlyVisits2 = getCustomerMonthlyVisits(cardWithField);
assert.strictEqual(monthlyVisits2, 3, 'Should read monthlyVisitsUsed when matching current cycle key');
console.log('✔ getCustomerMonthlyVisits correctly isolates current calendar month visits and synchronizes usage.');

// 4. Verify manager customer table offers left display in nfc.js & app.js
console.log('\n[4] Verifying Manager Area customer table display...');
assert(nfcJs.includes('${offersBadge}'), 'offersBadge must be rendered in filterVicardCustomers in nfc.js');
assert(appJs.includes('${offersBadge}'), 'offersBadge must be rendered in filterVicardCustomers in app.js');
assert(nfcJs.includes('left</b> this month') || nfcJs.includes('left</strong> this month'), 'Remaining offers badge text must say "left this month"');
assert(appJs.includes('left</b> this month') || appJs.includes('left</strong> this month'), 'app.js must contain "left this month"');
console.log('✔ Manager table includes monthly offers left badge for every customer.');

// 5. Verify index.html & translations.js
console.log('\n[5] Verifying index.html table header & cache busters...');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const translationsJs = fs.readFileSync('translations.js', 'utf8');

assert(indexHtml.includes('Visits, Offers Left & Stats'), 'index.html th must be updated to Visits, Offers Left & Stats');
assert(indexHtml.includes('style.css?v=319'), 'style.css must have v=319');
assert(indexHtml.includes('translations.js?v=319'), 'translations.js must have v=319');
assert(indexHtml.includes('app.js?v=319'), 'app.js must have v=319');
assert(translationsJs.includes('"nfc-th-visits": "Visits, Offers Left & Stats"'), 'English translation must match');
assert(translationsJs.includes('"nfc-th-visits": "الزيارات والعروض المتبقية والإحصائيات"'), 'Arabic translation must match');
console.log('✔ Table header, translations, and cache busters verified.');

console.log('\n=========================================');
console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! 100% VERIFIED.');
console.log('=========================================');
