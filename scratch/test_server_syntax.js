const fs = require('fs');

const serverContent = fs.readFileSync('notify-server/server.js', 'utf8');

// Check basic syntax first
try {
    new Function(serverContent);
    console.log('✅ server.js is valid JavaScript syntax!');
} catch (e) {
    console.error('❌ Syntax Error in server.js:', e.message);
}

// Find any undeclared variable calls in server.js
const regex = /([a-zA-Z0-9_$]+)\s*\(/g;
const matches = new Set();
let match;
while ((match = regex.exec(serverContent)) !== null) {
    matches.add(match[1]);
}

console.log('Function calls found in server.js:', Array.from(matches).sort());
