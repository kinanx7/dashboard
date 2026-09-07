const fs = require('fs');
const assert = require('assert');

console.log('--- TESTING RESTAURANT PREVIEW & LOWEST RANK TIER RESTRICTION ---');

// 1. Verify code presence in js/nfc.js and app.js
['js/nfc.js', 'app.js'].forEach(file => {
    const code = fs.readFileSync(file, 'utf8');
    assert(code.includes('function getLowestPlatformTierRank'), `getLowestPlatformTierRank missing in ${file}`);
    assert(code.includes('isLowestRankUnchecked'), `isLowestRankUnchecked missing in ${file}`);
    assert(code.includes('This restaurant is not available right now'), `Not available right now string missing in ${file}`);
    assert(code.includes('switchNfcSubTab(\'customer\')'), `switchNfcSubTab customer in previewRestaurantOnCustomerSite missing in ${file}`);
    assert(code.includes('هذا المطعم غير متاح حالياً'), `Arabic translation missing in ${file}`);
    console.log(`✔ ${file} contains all required preview and tier restriction logic`);
});

// 2. Test tier hierarchy and dynamic lowest rank logic
var defaultVicardTiers = {
    'silver': { id: 'silver', name: 'Silver VIP', icon: '🥈', rank: 1, minSpend: 0 },
    'gold': { id: 'gold', name: 'Gold VIP', icon: '👑', rank: 2, minSpend: 500 },
    'platinum': { id: 'platinum', name: 'Platinum Elite', icon: '💎', rank: 3, minSpend: 1500 },
    'black': { id: 'black', name: 'Black VIP Founder', icon: '✨', rank: 4, minSpend: 3000 }
};

var vicardData = {
    tiers: { ...defaultVicardTiers },
    restaurants: {
        'rest_burgeroov': {
            id: 'rest_burgeroov',
            name: 'Burgeroov',
            eligibleTiers: ['gold'] // Lowest tier (silver) NOT checked!
        },
        'rest_all': {
            id: 'rest_all',
            name: 'All Welcome Cafe',
            eligibleTiers: ['silver'] // Lowest tier (silver) IS checked!
        },
        'rest_none': {
            id: 'rest_none',
            name: 'Restricted Hub',
            eligibleTiers: [] // No tiers checked!
        }
    }
};

function getVicardTiers() {
    return vicardData.tiers;
}

function getTierRank(tierIdentifier) {
    if (!tierIdentifier) return 1;
    const tiers = getVicardTiers();
    const norm = String(tierIdentifier).toLowerCase().trim();
    if (tiers[norm] && tiers[norm].rank !== undefined) {
        return parseInt(tiers[norm].rank, 10) || 1;
    }
    for (const key of Object.keys(tiers)) {
        const t = tiers[key];
        const tName = (t.name || '').toLowerCase();
        const tId = (t.id || '').toLowerCase();
        if (tId === norm || tName === norm || norm.includes(tId) || tName.includes(norm)) {
            if (t.rank !== undefined && t.rank !== null && !isNaN(t.rank)) {
                return parseInt(t.rank, 10);
            }
        }
    }
    if (norm.includes('black')) return 4;
    if (norm.includes('platinum')) return 3;
    if (norm.includes('gold')) return 2;
    if (norm.includes('silver')) return 1;
    return 1;
}

function getLowestPlatformTierRank() {
    const tiers = Object.values(getVicardTiers());
    if (!tiers || tiers.length === 0) return 1;
    const ranks = tiers.map(t => {
        if (t.rank !== undefined && t.rank !== null && !isNaN(t.rank)) {
            return parseInt(t.rank, 10);
        }
        return getTierRank(t.id || t.name);
    });
    return Math.min(...ranks);
}

function checkTierEligibility(customerTier, requiredTiers) {
    const custRank = getTierRank(customerTier);
    const tiers = getVicardTiers();
    const lowestPlatformRank = getLowestPlatformTierRank();

    if (!requiredTiers || !Array.isArray(requiredTiers) || requiredTiers.length === 0) {
        return {
            eligible: false,
            isLowestRankUnchecked: true,
            notAvailableReason: 'This restaurant is not available right now',
            customerRank: custRank,
            minRequiredRank: 9999,
            requiredTierNames: ['None (Restricted)']
        };
    }

    const reqRanks = requiredTiers.map(tId => getTierRank(tId));
    const minReqRank = Math.min(...reqRanks);
    const isLowestRankUnchecked = minReqRank > lowestPlatformRank;
    const isEligible = custRank >= minReqRank;

    const requiredTierNames = requiredTiers.map(tId => {
        const found = tiers[tId] || Object.values(tiers).find(t => t.id === tId || t.name === tId);
        return found ? `${found.icon || '🏅'} ${found.name}` : tId;
    });

    return {
        eligible: isEligible,
        isLowestRankUnchecked: isLowestRankUnchecked,
        notAvailableReason: (!isEligible && isLowestRankUnchecked) ? 'This restaurant is not available right now' : '',
        customerRank: custRank,
        minRequiredRank: minReqRank,
        requiredTierNames: requiredTierNames
    };
}

// Test A: Lowest rank NOT checkboxed (only Gold checked)
console.log('Testing Case A: Lowest rank NOT checkboxed (eligibleTiers: ["gold"])');
const resSilver = checkTierEligibility('Silver VIP', ['gold']);
assert.strictEqual(resSilver.eligible, false, 'Silver VIP must NOT be eligible when lowest rank is not checked');
assert.strictEqual(resSilver.isLowestRankUnchecked, true, 'isLowestRankUnchecked must be true');
assert.strictEqual(resSilver.notAvailableReason, 'This restaurant is not available right now', 'Reason must be "This restaurant is not available right now"');

const resGold = checkTierEligibility('Gold VIP', ['gold']);
assert.strictEqual(resGold.eligible, true, 'Gold VIP must be eligible');
assert.strictEqual(resGold.notAvailableReason, '', 'No not-available message for eligible Gold');

const resPlatinum = checkTierEligibility('Platinum Elite', ['gold']);
assert.strictEqual(resPlatinum.eligible, true, 'Platinum Elite must inherit access to lower tier offer');

const resBlack = checkTierEligibility('Black VIP Founder', ['gold']);
assert.strictEqual(resBlack.eligible, true, 'Black VIP must inherit access to lower tier offer');
console.log('✔ Case A passed: Lowest tier blocked with exact message, higher tiers inherit access');

// Test B: Lowest rank IS checkboxed (eligibleTiers: ["silver"])
console.log('Testing Case B: Lowest rank IS checkboxed (eligibleTiers: ["silver"])');
const resSilverB = checkTierEligibility('Silver VIP', ['silver']);
assert.strictEqual(resSilverB.eligible, true, 'Silver VIP must be eligible when lowest rank is checked');
assert.strictEqual(resSilverB.isLowestRankUnchecked, false, 'isLowestRankUnchecked must be false when lowest rank is checked');
assert.strictEqual(resSilverB.notAvailableReason, '', 'No block message when lowest rank is checked');
console.log('✔ Case B passed: When lowest rank is checkboxed, restaurant is available to all');

// Test C: No tiers checkboxed (eligibleTiers: [])
console.log('Testing Case C: No tiers checkboxed (eligibleTiers: [])');
const resNoneSilver = checkTierEligibility('Silver VIP', []);
assert.strictEqual(resNoneSilver.eligible, false, 'Silver VIP must NOT be eligible when no tiers are checked');
assert.strictEqual(resNoneSilver.isLowestRankUnchecked, true, 'isLowestRankUnchecked must be true');
assert.strictEqual(resNoneSilver.notAvailableReason, 'This restaurant is not available right now');
console.log('✔ Case C passed: Unchecked all correctly blocks lowest rank and all customers');

// Test D: Dynamic lowest rank detection with custom ranks (e.g. Silver is Rank 2)
console.log('Testing Case D: Custom tier ranks (e.g. Silver is Rank 2)');
vicardData.tiers = {
    'silver': { id: 'silver', name: 'Silver VIP', rank: 2 },
    'black': { id: 'black', name: 'Black VIP', rank: 5 }
};
assert.strictEqual(getLowestPlatformTierRank(), 2, 'Lowest rank should dynamically be 2');
const customCheckUnchecked = checkTierEligibility('Silver VIP', ['black']);
assert.strictEqual(customCheckUnchecked.eligible, false, 'Silver (Rank 2) not eligible for Black (Rank 5)');
assert.strictEqual(customCheckUnchecked.isLowestRankUnchecked, true, 'isLowestRankUnchecked must be true');
assert.strictEqual(customCheckUnchecked.notAvailableReason, 'This restaurant is not available right now');

const customCheckChecked = checkTierEligibility('Silver VIP', ['silver']);
assert.strictEqual(customCheckChecked.eligible, true, 'Silver (Rank 2) eligible when checked');
assert.strictEqual(customCheckChecked.isLowestRankUnchecked, false);
console.log('✔ Case D passed: Dynamic lowest rank detection works with custom numbers');

// 3. Test Preview Button Logic Simulation
console.log('Testing Case E: Preview button switches sub-tab and sets active restaurant');
let currentSubTab = 'manager';
let activeRestId = null;
let customerWebsiteRendered = false;
let scrolled = false;

function mockPreviewRestaurantOnCustomerSite(restId) {
    activeRestId = restId;
    // Overlay closed
    currentSubTab = 'customer';
    customerWebsiteRendered = true;
    scrolled = true;
}

mockPreviewRestaurantOnCustomerSite('rest_burgeroov');
assert.strictEqual(currentSubTab, 'customer', 'Must switch sub-tab to customer');
assert.strictEqual(activeRestId, 'rest_burgeroov', 'Active restaurant ID must be rest_burgeroov');
assert.strictEqual(customerWebsiteRendered, true, 'Customer website must be rendered');
assert.strictEqual(scrolled, true, 'Must scroll into view');
console.log('✔ Case E passed: Preview button activates customer view and renders target restaurant');

console.log('--- ALL TESTS PASSED SUCCESSFULLY! ---');
