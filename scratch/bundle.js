const fs = require('fs');

const files = [
    'js/core.js',
    'js/auth.js',
    'js/adverts_notes.js',
    'js/sales_costs.js',
    'js/warehouse.js',
    'js/tasks.js',
    'js/drivers.js',
    'js/ops.js',
    'js/finance.js',
    'js/market.js',
    'js/prepare.js',
    'js/contracts.js',
    'js/tracking.js',
    'js/learning.js',
    'js/salla.js',
    'js/nfc.js'
];

console.log('Bundling app.js from ' + files.length + ' source files...');
const bundle = files.map(f => {
    if (!fs.existsSync(f)) {
        throw new Error('Missing file: ' + f);
    }
    return fs.readFileSync(f, 'utf8');
}).join('\n\n');

fs.writeFileSync('app.js', bundle, 'utf8');
console.log('Successfully bundled app.js (' + bundle.length + ' bytes)');
