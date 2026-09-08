const assert = require('assert');
const fs = require('fs');

const nfcCode = fs.readFileSync('js/nfc.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');

console.log('--- Testing Cashier Automated Discount & Customer Stats Tracking ---');

// 1. Verify manual input fields (vicard-cashier-bill and vicard-cashier-pct) are removed from cashier overlay
assert(!nfcCode.includes('id="vicard-cashier-bill"'), 'Manual bill input must be removed from cashier verification');
assert(!nfcCode.includes('id="vicard-cashier-pct"'), 'Manual discount percentage input must be removed from cashier verification');

// 2. Verify pre-listed offer details and automatic pricing calculations are in renderVicardCashierScreen
assert(nfcCode.includes('Customer Pays (المصروف)'), 'Cashier screen must show customer pays amount spent');
assert(nfcCode.includes('Amount Saved (التوفير)'), 'Cashier screen must show amount saved');
assert(nfcCode.includes('Pre-Listed Offer (مدرج مسبقاً)'), 'Cashier screen must display pre-listed offer header');

// 3. Verify confirmVicardCashierVisit computes amountSpent, amountSaved, and updates totalSpend & totalSavings
assert(nfcCode.includes('card.totalSpend = nextSpend;'), 'confirmVicardCashierVisit must track totalSpend');
assert(nfcCode.includes('card.totalSavings = nextSavings;'), 'confirmVicardCashierVisit must track totalSavings');
assert(nfcCode.includes('amountSpent: amountSpent,'), 'discountRecord must store amountSpent');
assert(nfcCode.includes('amountSaved: amountSaved,'), 'discountRecord must store amountSaved');

// 4. Verify customer profile modal in index.html has lifetime stats elements
assert(indexHtml.includes('id="vicard-profile-total-saved"'), 'Customer profile must have total saved stat element');
assert(indexHtml.includes('id="vicard-profile-total-spent"'), 'Customer profile must have total spent stat element');
assert(indexHtml.includes('id="vicard-profile-total-visits"'), 'Customer profile must have total visits stat element');
assert(indexHtml.includes('id="vicard-profile-history-btn"'), 'Customer profile must have history button');

// 5. Verify customer visit history modal in js/nfc.js calculates and displays Total Spent and individual visit paid amounts
assert(nfcCode.includes('const totalSpentAmount = Math.max(activeCard.totalSpend'), 'Visit history must calculate totalSpentAmount');
assert(nfcCode.includes('Paid SAR ${spent}'), 'Visit history items must show Paid SAR amount');

console.log('✅ ALL 5 AUTOMATED VERIFICATION CHECKS PASSED SUCCESSFULLY!');
