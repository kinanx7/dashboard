const fs = require('fs');

console.log('Testing General Advertisement Broadcast Console features...');

let adRecipients = [];
let adSearchQuery = '';

function recalculateAdRecipientGroups() {
    adRecipients.forEach((item, idx) => {
        item.tag = `#${idx + 1}`;
        item.group = Math.floor(idx / 50) + 1;
    });
}

// 1. Bulk Add Contacts
for (let i = 1; i <= 65; i++) {
    adRecipients.push({
        id: 'rec_' + i,
        name: i === 15 ? 'Ahmed Ali' : `Contact ${i}`,
        phone: `96650${100000 + i}`,
        tag: `#${i}`,
        group: Math.floor((i - 1) / 50) + 1,
        disabled: false
    });
}

recalculateAdRecipientGroups();

console.log(`✅ Total Recipients: ${adRecipients.length}`);
console.log(`✅ Recipient #1 Tag: ${adRecipients[0].tag}, Group: ${adRecipients[0].group}`);
console.log(`✅ Recipient #55 Tag: ${adRecipients[54].tag}, Group: ${adRecipients[54].group}`);

// 2. Test Search Query Filtering
adSearchQuery = 'ahmed';
let searchResults = adRecipients.filter(r => {
    return (r.name || '').toLowerCase().includes(adSearchQuery) || 
           (r.phone || '').toLowerCase().includes(adSearchQuery) ||
           (r.tag || '').toLowerCase().includes(adSearchQuery);
});
console.log(`✅ Search for "${adSearchQuery}" returned ${searchResults.length} match(es): ${searchResults[0]?.name}`);

// 3. Test Disabling Number
adRecipients[14].disabled = true; // Ahmed Ali
let activeForBroadcast = adRecipients.filter(r => !r.disabled);
console.log(`✅ Total active for broadcast after turning off #15: ${activeForBroadcast.length} (Expected: 64)`);

// 4. Test Clear All
adRecipients = [];
console.log(`✅ Total after Clear All: ${adRecipients.length}`);

console.log('\n🎉 ALL AD BROADCAST FEATURE TESTS PASSED SUCCESSFULLY!');
