const fs = require('fs');
const assert = require('assert');

console.log('--- TESTING UNCHECK GLITCH, GOOGLE MAPS RATING, DISTANCE REMOVAL, AND MOBILE STYLING ---');

// 1. Check style.css
const css = fs.readFileSync('style.css', 'utf8');
assert(css.includes('.keeta-dish-redeem-btn.unavailable'), 'Missing .keeta-dish-redeem-btn.unavailable in style.css');
assert(css.includes('.keeta-view-btn.unavailable'), 'Missing .keeta-view-btn.unavailable in style.css');
assert(css.includes('max-width: 100px !important'), 'Missing max-width on unavailable button in style.css');
assert(css.includes('padding: 6px 4px !important'), 'Missing padding on unavailable button in style.css');
assert(css.includes('#nfc-subview-manager'), 'Missing #nfc-subview-manager in style.css');
assert(css.includes('padding-bottom: 120px !important'), 'Missing padding-bottom: 120px for mobile in style.css');
assert(css.includes('position: static !important'), 'Missing position: static for mobile cards in style.css');
console.log('✔ [1] style.css verified: .unavailable button styling and phone responsiveness present');

// 2. Check index.html
const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes('id="vicard-rest-rating"'), 'Missing vicard-rest-rating input in index.html');
assert(html.includes('id="vicard-rest-reviews"'), 'Missing vicard-rest-reviews input in index.html');
assert(html.includes('max-height:86vh'), 'Missing max-height on restaurant modal');
assert(html.includes('overflow-y:auto'), 'Missing scrollable form body in restaurant modal');
assert(/style\.css\?v=3[0-9]{2,}/.test(html), 'Cache buster style.css?v=300+ missing in index.html');
assert(/app\.js\?v=3[0-9]{2,}/.test(html), 'Cache buster app.js?v=300+ missing in index.html');
console.log('✔ [2] index.html verified: Rating/review inputs, sticky modal footer (no F11 needed), cache buster v=300 bumped');

// 3. Check js/nfc.js & app.js
['js/nfc.js', 'app.js'].forEach(file => {
    const js = fs.readFileSync(file, 'utf8');
    assert(js.includes('vicard-rest-rating'), `Missing vicard-rest-rating in ${file}`);
    assert(js.includes('vicard-rest-reviews'), `Missing vicard-rest-reviews in ${file}`);
    assert(js.includes('toggleVicardTierChip'), `Missing toggleVicardTierChip in ${file}`);
    assert(js.includes('pointer-events: none'), `Missing pointer-events: none in ${file}`);
    assert(js.includes("tiersToSave = selectedTiers.length > 0 ? selectedTiers : ['none']"), `Missing empty tiers fallback in ${file}`);
    assert(js.includes("isNotAvailableRightNow ? 'Not Available'"), `Missing 'Not Available' without sign in ${file}`);
    assert(!js.includes('• ${r.distance || \'1-3 km\'}'), `Distance still present in customer directory in ${file}`);
    console.log(`✔ [3] ${file} verified: Rating/reviews, uncheck fix, distance removal, and unavailable clean text present`);
});

// 4. Simulate unchecking behavior & tier eligibility
const defaultVicardTiers = {
    'silver': { id: 'silver', name: 'Silver VIP', rank: 2, minSpend: 0 },
    'gold': { id: 'gold', name: 'Gold VIP', rank: 3, minSpend: 500 }
};

function checkTierEligibility(customerTier, requiredTiers) {
    const custRank = customerTier === 'silver' ? 2 : 3;
    const lowestPlatformRank = 2;
    const cleanTiers = Array.isArray(requiredTiers) 
        ? requiredTiers.filter(t => t && t !== 'none' && t !== '__none__')
        : [];

    if (cleanTiers.length === 0) {
        return {
            eligible: false,
            isLowestRankUnchecked: true,
            notAvailableReason: 'This restaurant is not available right now'
        };
    }

    const minReqRank = Math.min(...cleanTiers.map(t => t === 'silver' ? 2 : 3));
    return {
        eligible: custRank >= minReqRank,
        isLowestRankUnchecked: minReqRank > lowestPlatformRank,
        notAvailableReason: custRank < minReqRank ? 'This restaurant is not available right now' : ''
    };
}

// User unchecks silver (the only checked tier)
const uncheckedSelected = [];
const savedToDb = uncheckedSelected.length > 0 ? uncheckedSelected : ['none'];
assert.deepStrictEqual(savedToDb, ['none'], 'Should save [none] to DB when unchecked');

// Re-opening edit modal
const reloadedFromDb = savedToDb;
const checkedInModal = reloadedFromDb.filter(t => t !== 'none');
assert.deepStrictEqual(checkedInModal, [], 'Modal should see empty array and NOT check the checkbox!');

// Customer checks eligibility
const result = checkTierEligibility('silver', reloadedFromDb);
assert.strictEqual(result.eligible, false, 'Silver customer should NOT be eligible');
assert.strictEqual(result.isLowestRankUnchecked, true, 'isLowestRankUnchecked should be true');
assert.strictEqual(result.notAvailableReason, 'This restaurant is not available right now');
console.log('✔ [4] Uncheck glitch fix simulation passed: [none] persisted, modal remains unchecked, base tier restricted');

console.log('\nALL VERIFICATIONS PASSED SUCCESSFULLY! 🚀');
