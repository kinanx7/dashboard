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
// Key = companyId_workerIndex, Value = last-known worker object
const prevState = {};

// ─── Cache of previous general tasks ─────────────────────────────────────────
// Key = companyId_taskId, Value = true
const notifiedGeneralTasks = {};
const isFirstGeneralTasksLoad = {};

function startNotificationListeners(companyId) {
    console.log(`[Server] Starting listeners for company: ${companyId}...`);
    isFirstGeneralTasksLoad[companyId] = true;

    // ─── Workers Listener ────────────────────────────────────────────────────
    db.ref(`companies/${companyId}/workers`).on('value', async (snapshot) => {
        const workers = snapshot.val();
        if (!workers) return;

        const sends = [];
        const companyLabel = companyId === 'mvc' ? 'MVC' : 'Burgeroov';

        workers.forEach((after, index) => {
            if (!after) return;

            const fcmToken   = after.fcmToken;
            const workerName = after.name || `Worker #${index}`;
            const cacheKey   = `${companyId}_${index}`;
            const before     = prevState[cacheKey] || null;

            // Update cache
            prevState[cacheKey] = JSON.parse(JSON.stringify(after));

            // Skip on first load
            if (!before) return;
            if (!fcmToken)  {
                console.log(`[FCM] [${companyId}] "${workerName}" has no token — skip.`);
                return;
            }

            // ── 1. NEW TASK ──────────────────────────────────────────────────
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
                            title: `📋 New Task Assigned [${companyLabel}]`,
                            body:  `${title} — tap to open your task board.`
                        },
                        data: { type: 'task', tab: 'tasks', workerName, companyId },
                        android: { priority: 'high', notification: { channelId: 'burgeroov_tasks' } },
                        apns:    { payload: { aps: { sound: 'default', badge: 1 } } }
                    }, `[${companyId}] TASK → ${workerName}: "${title}"`));
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
                        title: `🛵 New Delivery Order [${companyLabel}]`,
                        body:  `Order for ${customer} — open the app to start.`
                    },
                    data: { type: 'delivery', tab: 'drivers', workerName, companyId },
                    android: { priority: 'high', notification: { channelId: 'burgeroov_orders' } },
                    apns:    { payload: { aps: { sound: 'default', badge: 1 } } }
                }, `[${companyId}] ORDER → ${workerName}`));
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
                    notification: { title: `⚠️ Violation Recorded [${companyLabel}]`, body: reason },
                    data: { type: 'violation', tab: 'finance', workerName, companyId },
                    android: { priority: 'high', notification: { channelId: 'burgeroov_alerts' } },
                    apns:    { payload: { aps: { sound: 'default', badge: 1 } } }
                }, `[${companyId}] VIOLATION → ${workerName}`));
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
                    notification: { title: `🎉 Reward Added [${companyLabel}]`, body: rewardNote },
                    data: { type: 'reward', tab: 'finance', workerName, companyId },
                    android: { priority: 'normal', notification: { channelId: 'burgeroov_rewards' } },
                    apns:    { payload: { aps: { sound: 'default', badge: 1 } } }
                }, `[${companyId}] REWARD → ${workerName}`));
            }
        });

        if (sends.length > 0) await Promise.all(sends);

    }, (err) => {
        console.error(`[RTDB] [${companyId}] Workers Listener error:`, err.message);
    });

    // ─── General Tasks Listener ──────────────────────────────────────────────
    db.ref(`companies/${companyId}/generalTasks`).on('value', async (snapshot) => {
        const tasksObj = snapshot.val();

        if (isFirstGeneralTasksLoad[companyId]) {
            isFirstGeneralTasksLoad[companyId] = false;
            if (tasksObj) {
                Object.keys(tasksObj).forEach(taskId => {
                    const cacheKey = `${companyId}_${taskId}`;
                    notifiedGeneralTasks[cacheKey] = true;
                });
            }
            return;
        }

        if (!tasksObj) return;

        const sends = [];
        const companyLabel = companyId === 'mvc' ? 'MVC' : 'Burgeroov';

        // Fetch workers to retrieve tokens
        const workersSnapshot = await db.ref(`companies/${companyId}/workers`).once('value');
        const workers = workersSnapshot.val() || [];

        Object.keys(tasksObj).forEach(taskId => {
            const task = tasksObj[taskId];
            const cacheKey = `${companyId}_${taskId}`;
            if (task && task.status === 'pending' && !notifiedGeneralTasks[cacheKey]) {
                notifiedGeneralTasks[cacheKey] = true;

                const title = task.title || 'New General Task';
                workers.forEach((w, index) => {
                    if (w && w.fcmToken) {
                        sends.push(safeSend({
                            token: w.fcmToken,
                            notification: {
                                title: `🌍 New General Task Available [${companyLabel}]`,
                                body: `${title} — open your task board to accept it.`
                            },
                            data: { type: 'generalTask', tab: 'tasks', workerName: w.name || `Worker #${index}`, companyId },
                            android: { priority: 'high', notification: { channelId: 'burgeroov_tasks' } },
                            apns:    { payload: { aps: { sound: 'default', badge: 1 } } }
                        }, `[${companyId}] GENERAL TASK → ${w.name || `Worker #${index}`}: "${title}"`));
                    }
                });
            }
        });

        if (sends.length > 0) {
            await Promise.all(sends);
        }
    }, (err) => {
        console.error(`[RTDB] [${companyId}] General Tasks Listener error:`, err.message);
    });
}

// Start notification listeners for both Burgeroov and MVC companies
startNotificationListeners('burgeroov');
startNotificationListeners('mvc');
