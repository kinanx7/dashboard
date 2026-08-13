const http = require('https');

function checkServerStatus() {
    console.log('Checking Render Server status (https://burgeroov-notify.onrender.com/wa/status)...');
    
    const req = http.get('https://burgeroov-notify.onrender.com/wa/status', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`HTTP Status Code: ${res.statusCode}`);
            console.log(`Server Response: ${data}`);
        });
    });

    req.on('error', (err) => {
        console.error('HTTP Request Error:', err.message);
    });

    req.setTimeout(15000, () => {
        console.error('Request timed out after 15 seconds!');
        req.destroy();
    });
}

checkServerStatus();
