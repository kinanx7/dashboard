const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('marketorders')) {
        console.log(`${idx + 1}: ${line.trim()}`);
    }
});
