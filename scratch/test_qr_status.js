const http = require('https');

function checkWaDetails() {
    http.get('https://burgeroov-notify.onrender.com/wa/status', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('WA STATUS:', data);
        });
    });
}

checkWaDetails();
