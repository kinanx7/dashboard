const fs = require('fs');

const appContent = fs.readFileSync('app.js', 'utf8');

// Check that openEditTaskModal checks canEditTask
if (appContent.includes('function openEditTaskModal') && appContent.includes('!canEditTask')) {
    console.log('✅ PASS: openEditTaskModal verifies canEditTask permission!');
} else {
    console.error('❌ FAIL: openEditTaskModal missing permission check');
}

// Check that saveEditedTask checks canEditTask
if (appContent.includes('function saveEditedTask') && appContent.includes('!canEditTask')) {
    console.log('✅ PASS: saveEditedTask verifies canEditTask permission!');
} else {
    console.error('❌ FAIL: saveEditedTask missing permission check');
}

// Check UI double click attributes
if (appContent.includes('genDblClickAttr = canEditTask') && appContent.includes('workerDblClickAttr = canEditTask')) {
    console.log('✅ PASS: Double-click event attributes are strictly restricted to canEditTask!');
} else {
    console.error('❌ FAIL: UI double click attributes missing condition');
}
