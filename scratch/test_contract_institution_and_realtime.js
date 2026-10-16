/**
 * Verification Test Suite: Contract Institution Selection & Real-time Digital Signature Sync
 */
const fs = require('fs');
const assert = require('assert');

// Setup mock browser/DOM environment
class MockElement {
    constructor(id = '', tagName = 'div') {
        this.id = id;
        this.tagName = tagName.toUpperCase();
        this.innerHTML = '';
        this.value = '';
        this.textContent = '';
        this.style = {};
        this.classList = {
            _classes: new Set(),
            add(c) { this._classes.add(c); },
            remove(c) { this._classes.delete(c); },
            contains(c) { return this._classes.has(c); },
            toggle(c, force) { if (force) this._classes.add(c); else this._classes.delete(c); }
        };
        this.children = [];
    }
    focus() {}
    setAttribute() {}
    getAttribute() { return ''; }
}

const elements = {};
function getEl(id, tag = 'div') {
    if (!elements[id]) {
        elements[id] = new MockElement(id, tag);
    }
    return elements[id];
}

global.document = {
    getElementById(id) {
        if (!elements[id]) elements[id] = new MockElement(id);
        return elements[id];
    },
    querySelectorAll() { return []; },
    createElement(tag) { return new MockElement('', tag); },
    body: new MockElement('body'),
    readyState: 'complete',
    addEventListener() {}
};

global.window = global;
global.currentAppLang = 'ar';
global.currentCompany = 'mvc';
global.currentUser = { email: 'admin@mvc.com', role: 'admin', isAdmin: true };
global.escapeHtml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let mockDbData = {};
global.db = {
    ref(path) {
        return {
            set(val) {
                mockDbData[path] = val;
                return Promise.resolve();
            },
            update(updates) {
                Object.assign(mockDbData, updates);
                return Promise.resolve();
            },
            on(evt, cb) {
                // listener mock
            },
            off() {}
        };
    }
};

global.appData = {
    mvc: {
        contracts: {},
        contractInstitutions: ['مؤسسة سمك بيتنا'],
        workers: [
            { id: 'w1', name: 'سنان / Sinan', email: 'sinan@mvc.com' }
        ]
    }
};

global.getCompanyData = function() {
    return global.appData[global.currentCompany];
};

let notifications = [];
global.showInAppNotification = function(msg) {
    notifications.push(msg);
};

// Load contracts module
const contractsCode = fs.readFileSync('js/contracts.js', 'utf8');
eval(contractsCode);

console.log('--- 1. TESTING INSTITUTION TEMPLATES ---');
const instTemplates = getContractInstitutions();
console.log('Available institutions:', instTemplates);
assert(instTemplates.includes('مؤسسة إم في سي (MVC)'), 'Should have default MVC');
assert(instTemplates.includes('مؤسسة سمك بيتنا'), 'Should have custom saved مؤسسة سمك بيتنا');
assert(instTemplates.includes('مؤسسة برجروف (Burgeroov)'), 'Should have default Burgeroov');

console.log('--- 2. TESTING POPULATE INSTITUTION DROPDOWN ---');
populateContractInstitutionsDropdown('مؤسسة سمك بيتنا');
const selectEl = document.getElementById('contract-institution-select');
const inputEl = document.getElementById('contract-institution-input');
assert(selectEl.innerHTML.includes('مؤسسة سمك بيتنا'), 'Dropdown must include template');
assert.strictEqual(selectEl.value, 'مؤسسة سمك بيتنا');
assert.strictEqual(inputEl.value, 'مؤسسة سمك بيتنا');

console.log('--- 3. TESTING CUSTOM TEMPLATE SAVING ---');
inputEl.value = 'مؤسسة المأكولات البحرية الحديثة';
saveCurrentInstitutionAsTemplate();
assert(getContractInstitutions().includes('مؤسسة المأكولات البحرية الحديثة'), 'New institution should be saved');
assert(mockDbData['companies/mvc/contractInstitutions'].includes('مؤسسة المأكولات البحرية الحديثة'), 'Should be persisted to Firebase RTDB');

console.log('--- 4. TESTING CONTRACT CREATION & INSTITUTION BINDING ---');
getEl('contract-input-title').value = 'عقد عمل وتعهد إداري';
getEl('contract-input-text').value = 'بنود العقد والشروط الرسمية...';
getEl('contract-mode-select').value = 'text';
getEl('contract-institution-input').value = 'مؤسسة سمك بيتنا';
getEl('contract-worker-select').value = 'w1';

saveContract();

const contractsObj = getCompanyData().contracts;
const contractIds = Object.keys(contractsObj);
assert.strictEqual(contractIds.length, 1, 'Contract should be saved');
const createdContract = contractsObj[contractIds[0]];
console.log('Created Contract:', { id: createdContract.id, title: createdContract.title, institution: createdContract.institution, status: createdContract.status });
assert.strictEqual(createdContract.institution, 'مؤسسة سمك بيتنا', 'Contract must store institution');
assert.strictEqual(createdContract.status, 'pending_signature', 'Contract for worker should be pending signature');

console.log('--- 5. TESTING PDF PREVIEW WITH INSTITUTION HEADER ---');
viewContractAsPDF(createdContract.id);
const paperContainer = getEl('contract-pdf-paper-container');
assert(paperContainer.innerHTML.includes('مؤسسة سمك بيتنا'), 'PDF Header must contain institution name');

// Also test when signed:
createdContract.status = 'signed';
createdContract.signedAt = Date.now();
createdContract.signatureDataUrl = 'data:image/png;base64,MOCK_SIG';
viewContractAsPDF(createdContract.id);
assert(paperContainer.innerHTML.includes('طرف أول (المنشأة / الشركة)'), 'Must have first party block when signed');
assert(paperContainer.innerHTML.includes('مؤسسة سمك بيتنا'), 'First party block must show institution name');
createdContract.status = 'pending_signature'; // Reset for step 6

console.log('--- 6. TESTING REAL-TIME CONTRACT STATUS SYNC WITHOUT REFRESH ---');
// Prime initial status when contract is in pending state
onContractsRealtimeUpdate();

const badgeTotal = getEl('contract-stat-total').textContent;
const badgePending = getEl('contract-stat-pending').textContent;
const badgeSigned = getEl('contract-stat-signed').textContent;
console.log('Initial stats:', { badgeTotal, badgePending, badgeSigned });
assert(badgePending.includes('1'), 'Pending should be 1');
assert(badgeSigned.includes('0'), 'Signed should be 0');

// Now simulate worker signing from their mobile device/session:
createdContract.status = 'signed';
createdContract.signedAt = Date.now();
createdContract.signatureDataUrl = 'data:image/png;base64,MOCK_SIGNATURE';

// Firebase triggers real-time update
onContractsRealtimeUpdate();

const updatedPending = getEl('contract-stat-pending').textContent;
const updatedSigned = getEl('contract-stat-signed').textContent;
console.log('Updated stats after signing (WITHOUT PAGE REFRESH):', { updatedPending, updatedSigned });
assert(updatedPending.includes('0'), 'Pending must immediately drop to 0 without refresh');
assert(updatedSigned.includes('1'), 'Signed must immediately increase to 1 without refresh');

const contractsGrid = getEl('contracts-grid');
assert(contractsGrid.innerHTML.includes('موقع ومكتمل'), 'Card badge must immediately flip to Signed');
assert(contractsGrid.innerHTML.includes('مؤسسة سمك بيتنا'), 'Card must show institution badge');

console.log('Notifications triggered:', notifications);
assert(notifications.some(n => n.includes('سنان') || n.includes('توقيع')), 'Should trigger real-time signing celebration notification');

console.log('\n=========================================');
console.log('✅ ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
console.log('=========================================');
