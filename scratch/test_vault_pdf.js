const fs = require('fs');
const assert = require('assert');
const path = require('path');

console.log('=== VERIFYING INFORMATIONS SECTION PDF UPLOAD CAPABILITY ===');

const indexHtml = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
const prepareJs = fs.readFileSync(path.resolve(__dirname, '../js/prepare.js'), 'utf8');
const translationsJs = fs.readFileSync(path.resolve(__dirname, '../translations.js'), 'utf8');
const appJs = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');

// 1. Verify index.html file input accepts PDFs
assert.ok(indexHtml.includes('accept="image/*,application/pdf,.pdf"'), 'Input must accept images and PDF files');
console.log('✔ vault-note-image-file input accept attribute verified for PDFs.');

// 2. Verify vault-pdf-modal exists in index.html
assert.ok(indexHtml.includes('id="vault-pdf-modal"'), 'index.html must have vault-pdf-modal');
assert.ok(indexHtml.includes('id="vault-pdf-modal-frame"'), 'vault-pdf-modal must contain iframe');
assert.ok(indexHtml.includes('id="vault-pdf-modal-download-btn"'), 'vault-pdf-modal must have download button');
console.log('✔ vault-pdf-modal element and controls verified in index.html.');

// 3. Verify prepare.js has PDF handler functions
assert.ok(prepareJs.includes('viewVaultPdf'), 'prepare.js must have viewVaultPdf');
assert.ok(prepareJs.includes('downloadVaultPdf'), 'prepare.js must have downloadVaultPdf');
assert.ok(prepareJs.includes('openVaultPdfModal'), 'prepare.js must have openVaultPdfModal');
assert.ok(prepareJs.includes('getVaultAttachmentType'), 'prepare.js must have getVaultAttachmentType');
assert.ok(prepareJs.includes('getVaultAttachmentName'), 'prepare.js must have getVaultAttachmentName');
console.log('✔ prepare.js vault PDF helper and modal functions verified.');

// 4. Verify app.js bundle contains the new functions
assert.ok(appJs.includes('viewVaultPdf'), 'app.js bundle must have viewVaultPdf');
assert.ok(appJs.includes('downloadVaultPdf'), 'app.js bundle must have downloadVaultPdf');
assert.ok(appJs.includes('openVaultPdfModal'), 'app.js bundle must have openVaultPdfModal');
console.log('✔ app.js bundle contains all PDF functions.');

// 5. Verify translation keys in translations.js
assert.ok(translationsJs.includes('📎 Upload Images or PDF Documents (Optional)'), 'English PDF label verified');
assert.ok(translationsJs.includes('📎 تحميل صور أو مستندات PDF (اختياري)'), 'Arabic PDF label verified');
assert.ok(translationsJs.includes('📎 ছবি বা PDF ডকুমেন্ট আপলোড করুন (ঐচ্ছিক)'), 'Bengali PDF label verified');
console.log('✔ translations.js updated for Arabic, English, and Bengali.');

console.log('=== ALL INFORMATIONS PDF VERIFICATIONS PASSED! ===');
