const fs = require('fs');

console.log("--- UNDOING IDEA 2: RESTORING ORIGINAL LAYOUT ---");

if (fs.existsSync('scratch/index_backup_before_idea2.html')) {
    fs.copyFileSync('scratch/index_backup_before_idea2.html', 'index.html');
    console.log("Restored index.html!");
}
if (fs.existsSync('scratch/style_backup_before_idea2.css')) {
    fs.copyFileSync('scratch/style_backup_before_idea2.css', 'style.css');
    console.log("Restored style.css!");
}
if (fs.existsSync('scratch/core_js_backup_before_idea2.js')) {
    fs.copyFileSync('scratch/core_js_backup_before_idea2.js', 'js/core.js');
    console.log("Restored js/core.js!");
}

console.log("Re-bundling app.js...");
const files = ['js/core.js', 'js/auth.js', 'js/adverts_notes.js', 'js/sales_costs.js', 'js/warehouse.js', 'js/tasks.js', 'js/drivers.js', 'js/ops.js', 'js/finance.js', 'js/market.js', 'js/prepare.js', 'js/learning.js'];
const bundle = files.map(f => fs.readFileSync(f, 'utf8')).join('\n\n');
fs.writeFileSync('app.js', bundle);

console.log("Undo complete! Original layout fully restored.");
