const assert = require('assert');

console.log('--- Testing Membership Tier Hierarchy & Eligibility ---');

// Mock data & environment
var defaultVicardTiers = {
    'silver': { id: 'silver', name: 'Silver VIP', icon: '🥈', rank: 1, minSpend: 0, perks: '10% Base Cashback', gradient: 'linear-gradient(135deg, #9ca3af, #4b5563)' },
    'gold': { id: 'gold', name: 'Gold VIP', icon: '👑', rank: 2, minSpend: 500, perks: '15% Discount + Free Soft Drink', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    'platinum': { id: 'platinum', name: 'Platinum Elite', icon: '💎', rank: 3, minSpend: 1500, perks: '25% Discount + Priority Seating', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
    'black': { id: 'black', name: 'Black VIP Founder', icon: '✨', rank: 4, minSpend: 3000, perks: '35% Discount + Chef Welcome Plate', gradient: 'linear-gradient(135deg, #18181b, #000000)' }
};

var vicardData = {
    tiers: { ...defaultVicardTiers },
    cards: {
        'VIC-1001': { id: 'VIC-1001', name: 'Ahmad Silver', tier: 'Silver VIP', status: 'active', phone: '0501111111' },
        'VIC-1002': { id: 'VIC-1002', name: 'Sara Gold', tier: 'Gold VIP', status: 'active', phone: '0502222222' },
        'VIC-1003': { id: 'VIC-1003', name: 'Khaled Platinum', tier: 'Platinum Elite', status: 'active', phone: '0503333333' },
        'VIC-1004': { id: 'VIC-1004', name: 'Kinan Black', tier: 'Black VIP Founder', status: 'active', phone: '0504444444' }
    },
    restaurants: {
        'rest_burgeroov': {
            id: 'rest_burgeroov',
            name: 'Burgeroov',
            eligibleTiers: ['gold'], // Requires Gold VIP or higher
            units: [{ id: 'u1', name: 'Double Truffle Smash Burger' }]
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
            if (t.minSpend !== undefined) {
                return t.minSpend >= 3000 ? 4 : (t.minSpend >= 1500 ? 3 : (t.minSpend >= 500 ? 2 : 1));
            }
        }
    }
    if (norm.includes('black') || norm.includes('founder')) return 4;
    if (norm.includes('platinum') || norm.includes('elite')) return 3;
    if (norm.includes('gold')) return 2;
    if (norm.includes('silver')) return 1;
    return 1;
}

function checkTierEligibility(customerTier, requiredTiers) {
    if (!requiredTiers || !Array.isArray(requiredTiers) || requiredTiers.length === 0) {
        return { eligible: true, customerRank: getTierRank(customerTier), minRequiredRank: 0, requiredTierNames: ['All Tiers'] };
    }
    const custRank = getTierRank(customerTier);
    const tiers = getVicardTiers();
    const reqRanks = requiredTiers.map(tId => getTierRank(tId));
    const minReqRank = Math.min(...reqRanks);

    const requiredTierNames = requiredTiers.map(tId => {
        const found = tiers[tId] || Object.values(tiers).find(t => t.id === tId || t.name === tId);
        return found ? `${found.icon || '🏅'} ${found.name}` : tId;
    });

    return {
        eligible: custRank >= minReqRank,
        customerRank: custRank,
        minRequiredRank: minReqRank,
        requiredTierNames: requiredTierNames
    };
}

// TEST 1: Tier rank resolution
assert.strictEqual(getTierRank('silver'), 1, 'Silver rank should be 1');
assert.strictEqual(getTierRank('Silver VIP'), 1, 'Silver VIP rank should be 1');
assert.strictEqual(getTierRank('gold'), 2, 'Gold rank should be 2');
assert.strictEqual(getTierRank('Gold VIP'), 2, 'Gold VIP rank should be 2');
assert.strictEqual(getTierRank('platinum'), 3, 'Platinum rank should be 3');
assert.strictEqual(getTierRank('Platinum Elite'), 3, 'Platinum Elite rank should be 3');
assert.strictEqual(getTierRank('black'), 4, 'Black rank should be 4');
assert.strictEqual(getTierRank('Black VIP Founder'), 4, 'Black VIP Founder rank should be 4');
console.log('✔ Test 1 passed: Default tier ranks resolved correctly (Silver=1, Gold=2, Platinum=3, Black=4).');

// TEST 2: Hierarchical Access (Higher tier gets lower tier offers)
// Scenario: Restaurant requires Gold (Rank 2)
const reqGold = ['gold'];
assert.strictEqual(checkTierEligibility('Silver VIP', reqGold).eligible, false, 'Silver (Rank 1) should NOT be eligible for Gold+');
assert.strictEqual(checkTierEligibility('Gold VIP', reqGold).eligible, true, 'Gold (Rank 2) should be eligible for Gold+');
assert.strictEqual(checkTierEligibility('Platinum Elite', reqGold).eligible, true, 'Platinum (Rank 3) MUST be eligible for Gold+ (higher tier inherits lower tier)');
assert.strictEqual(checkTierEligibility('Black VIP Founder', reqGold).eligible, true, 'Black VIP (Rank 4) MUST be eligible for Gold+ (highest tier inherits all)');
console.log('✔ Test 2 passed: Higher tiers inherit lower tier offers (Platinum & Black get Gold offers, Silver blocked).');

// TEST 3: Unrestricted offers (empty requiredTiers)
assert.strictEqual(checkTierEligibility('Silver VIP', []).eligible, true, 'All tiers can access unrestricted restaurants');
assert.strictEqual(checkTierEligibility('Black VIP Founder', []).eligible, true, 'All tiers can access unrestricted restaurants');
console.log('✔ Test 3 passed: Empty tier restrictions allow all tiers.');

// TEST 4: Customer Tier Adjustment
const customer = vicardData.cards['VIC-1001'];
assert.strictEqual(checkTierEligibility(customer.tier, ['gold']).eligible, false, 'Customer Ahmad originally Silver VIP cannot access Burgeroov');

// Manager upgrades Ahmad's tier from Silver to Platinum
customer.tier = 'Platinum Elite';
assert.strictEqual(checkTierEligibility(customer.tier, ['gold']).eligible, true, 'After upgrading to Platinum, customer Ahmad can now access Burgeroov!');
console.log('✔ Test 4 passed: Adjusting customer tier immediately grants access to eligible partner offers.');

// TEST 5: Custom Tier with custom rank
vicardData.tiers['diamond_founder'] = {
    id: 'diamond_founder',
    name: 'Diamond Founder VIP',
    icon: '💎👑',
    rank: 5,
    minSpend: 5000
};
assert.strictEqual(getTierRank('diamond_founder'), 5, 'Diamond Founder rank should be 5');
assert.strictEqual(checkTierEligibility('Diamond Founder VIP', ['black']).eligible, true, 'Rank 5 can access Rank 4 Black offers!');
assert.strictEqual(checkTierEligibility('Black VIP Founder', ['diamond_founder']).eligible, false, 'Rank 4 cannot access Rank 5 Diamond offers!');
console.log('✔ Test 5 passed: Custom tier rank (Rank 5) works and properly enforces hierarchy.');

console.log('\n======================================================');
console.log('🎉 ALL TIER HIERARCHY & ADJUSTMENT TESTS PASSED!');
console.log('======================================================');
