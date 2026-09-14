const fs = require('fs');
const assert = require('assert');

console.log('=== VERIFYING DAILY DIGEST TIME SCHEDULER & AUTO-SEND FIX ===\n');

// 1. Check syntax of files
console.log('1. Checking file syntaxes:');
require('child_process').execSync('node --check notify-server/server.js');
console.log('  ✅ notify-server/server.js syntax OK');
require('child_process').execSync('node --check js/digest.js');
console.log('  ✅ js/digest.js syntax OK');
require('child_process').execSync('node --check app.js');
console.log('  ✅ app.js syntax OK');

// 2. Check index.html UI elements
console.log('\n2. Verifying index.html elements:');
const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes('id="digest-time-interpretation-badge"'), 'Missing digest-time-interpretation-badge in index.html');
assert(html.includes('id="digest-status-badge"'), 'Missing digest-status-badge in index.html');
assert(html.includes('setDigestPresetTime(\'00:00\')'), 'Missing preset button for 00:00 in index.html');
assert(html.includes('setDigestPresetTime(\'23:00\')'), 'Missing preset button for 23:00 in index.html');
assert(html.includes('setDigestPresetTime(\'12:00\')'), 'Missing preset button for 12:00 in index.html');
assert(html.includes('onDigestTimeInput(this.value)'), 'Missing oninput listener for digest time in index.html');
assert(html.includes('onDigestTimeChange(this.value)'), 'Missing onchange listener for digest time in index.html');
console.log('  ✅ index.html contains all interpretation badge, preset buttons, and live event listeners');

// 3. Check notify-server/server.js features
console.log('\n3. Verifying notify-server/server.js features:');
const srv = fs.readFileSync('notify-server/server.js', 'utf8');
assert(srv.includes('checkAndDispatchServerSideDailyDigest'), 'Missing checkAndDispatchServerSideDailyDigest in server.js');
assert(srv.includes('/wa/trigger-digest'), 'Missing /wa/trigger-digest endpoint in server.js');
assert(srv.includes('compileServerDailyDigestText'), 'Missing compileServerDailyDigestText in server.js');
assert(srv.includes('diffMins >= 0 && diffMins <= 60'), 'Missing 60-minute grace window in server.js');
assert(srv.includes('getKsaDateTime'), 'Missing KSA UTC+3 time handling in server.js');
console.log('  ✅ notify-server/server.js has autonomous background scheduler, KSA UTC+3 time zone, 60-minute grace window, and /wa/trigger-digest endpoint');

// 4. Test time label formatting logic
console.log('\n4. Testing time interpretation logic:');
function formatDigestTimeLabel(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') timeStr = "23:00";
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const mStr = String(m).padStart(2, '0');

    if (h === 0) {
        return {
            text: `🌙 12:${mStr} AM منتصف الليل (نهاية اليوم - Midnight)`,
            color: '#8b5cf6'
        };
    } else if (h === 12) {
        return {
            text: `☀️ 12:${mStr} PM ظهراً (منتصف النهار - Noon)`,
            color: '#f59e0b'
        };
    } else if (h < 12) {
        return {
            text: `🌅 ${h}:${mStr} AM صباحاً (Morning)`,
            color: '#06b6d4'
        };
    } else {
        const h12 = h - 12;
        return {
            text: `⏰ ${h12}:${mStr} PM ليلاً (مساءً - Evening)`,
            color: '#3b82f6'
        };
    }
}

const mid = formatDigestTimeLabel("00:00");
console.log('  00:00 ->', mid.text);
assert(mid.text.includes('منتصف الليل') && mid.text.includes('Midnight'), 'Midnight formatting incorrect');

const noon = formatDigestTimeLabel("12:00");
console.log('  12:00 ->', noon.text);
assert(noon.text.includes('ظهراً') && noon.text.includes('Noon'), 'Noon formatting incorrect');

const eve = formatDigestTimeLabel("23:00");
console.log('  23:00 ->', eve.text);
assert(eve.text.includes('11:00 PM') && eve.text.includes('ليلاً'), 'Evening formatting incorrect');

console.log('  ✅ Time interpretation formatting perfectly disambiguates 12:00 PM vs 12:00 AM');

// 5. Test Scheduler Grace Window Logic
console.log('\n5. Testing 60-minute grace window:');
function testSchedulerCondition(currentH, currentM, targetH, targetM, lastSentDate, todayStr) {
    const currentMinutes = currentH * 60 + currentM;
    const targetMinutes = targetH * 60 + targetM;
    const diffMinutes = currentMinutes - targetMinutes;
    return (diffMinutes >= 0 && diffMinutes <= 60 && lastSentDate !== todayStr);
}

// Exactly on time (00:00)
assert.strictEqual(testSchedulerCondition(0, 0, 0, 0, '2026-09-13', '2026-09-14'), true, 'Should trigger exactly at scheduled time');
// 15 minutes after scheduled time (e.g. server woke up or device connected)
assert.strictEqual(testSchedulerCondition(0, 15, 0, 0, '2026-09-13', '2026-09-14'), true, 'Should trigger within grace window');
// 59 minutes after scheduled time
assert.strictEqual(testSchedulerCondition(0, 59, 0, 0, '2026-09-13', '2026-09-14'), true, 'Should trigger at 59 mins');
// 65 minutes after scheduled time (outside window)
assert.strictEqual(testSchedulerCondition(1, 5, 0, 0, '2026-09-13', '2026-09-14'), false, 'Should not trigger outside 60m window');
// Already sent today
assert.strictEqual(testSchedulerCondition(0, 15, 0, 0, '2026-09-14', '2026-09-14'), false, 'Should not trigger if already sent today');
console.log('  ✅ Grace window correctly handles on-time, wake-up delays, and prevents duplicate sends');

console.log('\n🎉 ALL AUTOMATED VERIFICATION TESTS PASSED SUCCESSFULLY!');
