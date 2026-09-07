const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const nfcJs = fs.readFileSync('js/nfc.js', 'utf8');

// Find all document.getElementById('...') in js/nfc.js
const regex = /getElementById\(['"]([^'"]+)['"]\)/g;
let match;
const ids = new Set();
while ((match = regex.exec(nfcJs)) !== null) {
    ids.add(match[1]);
}

console.log('Total unique IDs referenced in js/nfc.js:', ids.size);
const missing = [];
ids.forEach(id => {
    if (!html.includes('id="' + id + '"') && !html.includes("id='" + id + "'")) {
        missing.push(id);
    }
});

console.log('Missing IDs in index.html (' + missing.length + '):');
missing.forEach(id => console.log(' - ' + id));
