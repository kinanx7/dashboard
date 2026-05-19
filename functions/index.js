/**
 * Burgeroov Portal — Firebase Cloud Functions
 * ============================================
 * Sends FCM push notifications to workers when:
 *   1. 📋 A new task is assigned
 *   2. 🛵 A new delivery order is dispatched
 *   3. ⚠️  A new violation is recorded
 *   4. 🎉 A new reward is added
 *
 * Triggers on any write to a worker's RTDB node.
 * Region: europe-west1 (matches your RTDB location)
 */

const functions = require('firebase-functions');
const admin     = require('firebase-admin');

admin.initializeApp();

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: count all violations / rewards across every month in monthlyStats
// ─────────────────────────────────────────────────────────────────────────────
function countAcrossMonths(monthlyStats, field) {
    if (!monthlyStats) return 0;
    return Object.values(monthlyStats)
        .reduce((sum, m) => sum + (Array.isArray(m[field]) ? m[field].length : 0), 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: safely send one FCM message, handles stale / invalid tokens gracefully
// ─────────────────────────────────────────────────────────────────────────────
async function safeSend(message, label) {
    try {
        const id = await admin.messaging().send(message);
        console.log(`✅ [${label}] sent — messageId: ${id}`);
    } catch (err) {
        // Token expired / unregistered → clean up automatically (optional)
        if (err.code === 'messaging/registration-token-not-registered' ||
            err.code === 'messaging/invalid-registration-token') {
            console.warn(`⚠️  [${label}] stale token — consider removing it from the worker record.`);
        } else {
            console.error(`❌ [${label}] failed:`, err.message);
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN TRIGGER — fires on ANY write to a worker node
// ─────────────────────────────────────────────────────────────────────────────
exports.notifyWorkerOnUpdate = functions
    .region('europe-west1')
    .database.ref('companies/burgeroov/workers/{workerIndex}')
    .onWrite(async (change, context) => {

        const before = change.before.val();
        const after  = change.after.val();

        // Worker was deleted — nothing to notify
        if (!after) return null;

        const fcmToken = after.fcmToken;
        if (!fcmToken) {
            console.log(`[FCM] Worker "${after.name || 'unknown'}" has no FCM token — skip.`);
            return null;
        }

        const workerName = after.name || 'Worker';
        const sends      = [];   // collect all promises

        // ── 1. NEW TASK ASSIGNED ──────────────────────────────────────────────
        const beforeJobs = Array.isArray(before?.jobs) ? before.jobs : [];
        const afterJobs  = Array.isArray(after.jobs)   ? after.jobs  : [];

        if (afterJobs.length > beforeJobs.length) {
            // Find the job(s) that are new (by id)
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

        // ── 2. NEW DELIVERY ORDER ─────────────────────────────────────────────
        const hadOrder = before?.activeOrder?.startTime;
        const hasOrder = after?.activeOrder?.startTime;

        if (!hadOrder && hasOrder) {
            const order   = after.activeOrder;
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

        // ── 3. NEW VIOLATION ──────────────────────────────────────────────────
        const beforeViolations = countAcrossMonths(before?.monthlyStats, 'violationsList');
        const afterViolations  = countAcrossMonths(after?.monthlyStats,  'violationsList');

        if (afterViolations > beforeViolations) {
            // Try to get the latest violation reason from the current month
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
                notification: {
                    title: '⚠️ Violation Recorded',
                    body:  reason
                },
                data: { type: 'violation', tab: 'finance', workerName },
                android: { priority: 'high', notification: { channelId: 'burgeroov_alerts' } },
                apns:    { payload: { aps: { sound: 'default', badge: 1 } } }
            }, `VIOLATION → ${workerName}`));
        }

        // ── 4. NEW REWARD ─────────────────────────────────────────────────────
        const beforeRewards = countAcrossMonths(before?.monthlyStats, 'rewardsList');
        const afterRewards  = countAcrossMonths(after?.monthlyStats,  'rewardsList');

        if (afterRewards > beforeRewards) {
            let rewardNote = 'Your manager gave you a reward — great job!';
            if (after.monthlyStats) {
                const months = Object.keys(after.monthlyStats).sort().reverse();
                for (const m of months) {
                    const list = after.monthlyStats[m]?.rewardsList;
                    if (Array.isArray(list) && list.length > 0) {
                        const r = list[0];
                        rewardNote = r.reason ? `${r.reason} (+SAR ${r.amount})` : `+SAR ${r.amount} reward added!`;
                        break;
                    }
                }
            }
            sends.push(safeSend({
                token: fcmToken,
                notification: {
                    title: '🎉 Reward Added!',
                    body:  rewardNote
                },
                data: { type: 'reward', tab: 'finance', workerName },
                android: { priority: 'normal', notification: { channelId: 'burgeroov_rewards' } },
                apns:    { payload: { aps: { sound: 'default', badge: 1 } } }
            }, `REWARD → ${workerName}`));
        }

        // Fire all notifications in parallel
        if (sends.length === 0) {
            console.log(`[FCM] No notification-worthy change for "${workerName}".`);
            return null;
        }

        await Promise.all(sends);
        return null;
    });


// ─────────────────────────────────────────────────────────────────────────────
// ADMIN TOKEN TRIGGER — notify admin devices (e.g. owner's phone)
// when ANY worker data changes (optional — can be disabled)
// ─────────────────────────────────────────────────────────────────────────────
// Uncomment if you want the manager to receive a summary ping:
//
// exports.notifyAdminOnWorkerChange = functions
//     .region('europe-west1')
//     .database.ref('companies/burgeroov/workers/{workerIndex}')
//     .onWrite(async (change, context) => { ... });
