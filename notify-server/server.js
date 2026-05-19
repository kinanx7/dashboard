/**
 * Burgeroov Push Notification Server
 * ====================================
 * Free alternative to Firebase Cloud Functions.
 * Deploy this on Render.com (free tier) — no credit card needed.
 *
 * What it does:
 *   - Connects to Firebase RTDB using the Admin SDK
 *   - Watches every worker node in real-time
 *   - Sends FCM push notifications when:
 *       📋 A new task is assigned
 *       🛵 A new delivery order arrives
 *       ⚠️  A new violation is recorded
 *       🎉 A new reward is added
 *
 * Environment variables needed (set in Render.com dashboard):
 *   FIREBASE_PROJECT_ID      = burgeroov-portal
 *   FIREBASE_DATABASE_URL    = https://burgeroov-portal-default-rtdb.europe-west1.firebasedatabase.app
 *   FIREBASE_CLIENT_EMAIL    = (from your service account JSON)
 *   FIREBASE_PRIVATE_KEY     = (from your service account JSON — include \n characters)
 */

const admin   = require('firebase-admin');
const express = require('express');

// ─── Init Firebase Admin ───────────────────────────────────────────────────
admin.initializeApp({
    credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Render stores env vars as single-line; restore newlines
        privateKey:  (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db        = admin.database();
const messaging = admin.messaging();

// ─── Express keeps the server alive on Render (free plan needs a web port) ──
const app  = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => res.send('Burgeroov Notification Server is running ✅'));
app.listen(PORT, () => console.log(`[Server] Listening on port ${PORT}`));

// ─── Helpers ─────────────────────────────────────────────────────────────────
function countAcrossMonths(monthlyStats, field) {
    if (!monthlyStats) return 0;
    return Object.values(monthlyStats)
        .reduce((sum, m) => sum + (Array.isArray(m[field]) ? m[field].length : 0), 0);
}

async function safeSend(message, label) {
    try {
        const id = await messaging.send(message);
        console.log(`✅ [${label}] sent — messageId: ${id}`);
    } catch (err) {
        if (err.code === 'messaging/registration-token-not-registered' ||
            err.code === 'messaging/invalid-registration-token') {
            console.warn(`⚠️  [${label}] stale token — worker needs to reopen app.`);
        } else {
            console.error(`❌ [${label}] failed:`, err.message);
        }
    }
}

// ─── Cache of previous worker states ─────────────────────────────────────────
// Key = workerIndex (string), Value = last-known worker object
const prevState = {};

// ─── Main RTDB listener ───────────────────────────────────────────────────────
console.log('[Server] Connecting to Firebase RTDB...');

db.ref('companies/burgeroov/workers').on('value', async (snapshot) => {
    const workers = snapshot.val();
    if (!workers) return;

    const sends = [];

    workers.forEach((after, index) => {
        if (!after) return;

        const fcmToken   = after.fcmToken;
        const workerName = after.name || `Worker #${index}`;
        const before     = prevState[index] || null;

        // Update cache
        prevState[index] = JSON.parse(JSON.stringify(after));

        // Skip on first load (no "before" = just initializing)
        if (!before) return;
        if (!fcmToken)  {
            console.log(`[FCM] "${workerName}" has no token — skip.`);
            return;
        }

        // ── 1. NEW TASK ──────────────────────────────────────────────────────
        const beforeJobs = Array.isArray(before.jobs) ? before.jobs : [];
        const afterJobs  = Array.isArray(after.jobs)  ? after.jobs  : [];

        if (afterJobs.length > beforeJobs.length) {
            const beforeIds = new Set(beforeJobs.map(j => j.id));
            const newJobs   = afterJobs.filter(j => !beforeIds.has(j.id));

            for (const job of newJobs) {
                const title = job.title || job.name || 'New task';
                sends.push(safeSend({
                    token: fcmToken,
                    notification: {
                        title: '📋 New Task Assigned',
                        body:  `${title} — tap to open your task board.`
                    },
                    data: { type: 'task', tab: 'tasks', workerName },
                    android: { priority: 'high', notification: { channelId: 'burgeroov_tasks' } },
                    apns:    { payload: { aps: { sound: 'default', badge: 1 } } }
                }, `TASK → ${workerName}: "${title}"`));
            }
        }

        // ── 2. NEW DELIVERY ORDER ────────────────────────────────────────────
        const hadOrder = before?.activeOrder?.startTime;
        const hasOrder = after?.activeOrder?.startTime;

        if (!hadOrder && hasOrder) {
            const order    = after.activeOrder;
            const customer = order.customerName || order.address || 'a customer';
            sends.push(safeSend({
                token: fcmToken,
                notification: {
                    title: '🛵 New Delivery Order',
                    body:  `Order for ${customer} — open the app to start.`
                },
                data: { type: 'delivery', tab: 'drivers', workerName },
                android: { priority: 'high', notification: { channelId: 'burgeroov_orders' } },
                apns:    { payload: { aps: { sound: 'default', badge: 1 } } }
            }, `ORDER → ${workerName}`));
        }

        // ── 3. NEW VIOLATION ─────────────────────────────────────────────────
        const beforeViol = countAcrossMonths(before?.monthlyStats, 'violationsList');
        const afterViol  = countAcrossMonths(after?.monthlyStats,  'violationsList');

        if (afterViol > beforeViol) {
            let reason = 'A new violation has been recorded on your profile.';
            if (after.monthlyStats) {
                const months = Object.keys(after.monthlyStats).sort().reverse();
                for (const m of months) {
                    const list = after.monthlyStats[m]?.violationsList;
                    if (Array.isArray(list) && list.length > 0) {
                        reason = list[0].reason || reason;
                        break;
                    }
                }
            }
            sends.push(safeSend({
                token: fcmToken,
                notification: { title: '⚠️ Violation Recorded', body: reason },
                data: { type: 'violation', tab: 'finance', workerName },
                android: { priority: 'high', notification: { channelId: 'burgeroov_alerts' } },
                apns:    { payload: { aps: { sound: 'default', badge: 1 } } }
            }, `VIOLATION → ${workerName}`));
        }

        // ── 4. NEW REWARD ────────────────────────────────────────────────────
        const beforeRew = countAcrossMonths(before?.monthlyStats, 'rewardsList');
        const afterRew  = countAcrossMonths(after?.monthlyStats,  'rewardsList');

        if (afterRew > beforeRew) {
            let rewardNote = 'Your manager gave you a reward — great job!';
            if (after.monthlyStats) {
                const months = Object.keys(after.monthlyStats).sort().reverse();
                for (const m of months) {
                    const list = after.monthlyStats[m]?.rewardsList;
                    if (Array.isArray(list) && list.length > 0) {
                        const r = list[0];
                        rewardNote = r.reason
                            ? `${r.reason} (+SAR ${r.amount})`
                            : `+SAR ${r.amount} reward added!`;
                        break;
                    }
                }
            }
            sends.push(safeSend({
                token: fcmToken,
                notification: { title: '🎉 Reward Added!', body: rewardNote },
                data: { type: 'reward', tab: 'finance', workerName },
                android: { priority: 'normal', notification: { channelId: 'burgeroov_rewards' } },
                apns:    { payload: { aps: { sound: 'default', badge: 1 } } }
            }, `REWARD → ${workerName}`));
        }
    });

    if (sends.length > 0) await Promise.all(sends);

}, (err) => {
    console.error('[RTDB] Listener error:', err.message);
});

console.log('[Server] Watching workers for changes — ready to push notifications.');
