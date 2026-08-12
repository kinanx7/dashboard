/**
 * Burgeroov Push Notification & Self-Hosted WhatsApp Gateway Server
 * ===================================================================
 * Free alternative to Firebase Cloud Functions & paid WhatsApp gateways.
 * Deploy this on Render.com (free tier) — no credit card needed.
 *
 * What it does:
 *   - Connects to Firebase RTDB using the Admin SDK
 *   - Watches every worker node in real-time and sends FCM push notifications
 *   - Hosts a 100% FREE self-hosted WhatsApp Web Gateway powered by Baileys
 *   - Serves real-time WhatsApp pairing QR codes directly to your dashboard!
 */

const admin   = require('firebase-admin');
const express = require('express');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// ─── Init Firebase Admin ───────────────────────────────────────────────────
admin.initializeApp({
    credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db        = admin.database();
const messaging = admin.messaging();

// ─── Express App Setup ───────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Enable CORS for dashboard requests
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Health Check & Keep-Alive endpoints for Render Cron Pings
app.get(['/ping', '/health'], (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.status(200).json({ 
        status: 'ok', 
        server: 'Burgeroov Notify & WhatsApp Gateway Server', 
        whatsappConnected: waConnectionState.connected,
        timestamp: Date.now() 
    });
});

app.get('/', (_req, res) => res.send('Burgeroov Notification & WhatsApp Gateway Server is running ✅'));

// ─── Self-Hosted WhatsApp Web Engine (Baileys) ─────────────────────────────
let waSocket = null;
let waQrDataUrl = null;
let waConnectionState = { connected: false, user: null, status: 'initializing' };

async function initWhatsAppEngine() {
    console.log('[WhatsApp Engine] Initializing self-hosted WhatsApp Web Gateway...');
    try {
        const authDir = path.join(__dirname, 'auth_info_baileys');
        if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

        const { state, saveCreds } = await useMultiFileAuthState(authDir);

        waSocket = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            browser: ['Mac OS', 'Chrome', '121.0.6167.85']
        });

        waSocket.ev.on('creds.update', saveCreds);

        waSocket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('[WhatsApp Engine] New Pairing QR Code generated!');
                try {
                    waQrDataUrl = await QRCode.toDataURL(qr);
                    waConnectionState = { connected: false, user: null, status: 'qr_ready' };
                } catch (err) {
                    console.error('[WhatsApp Engine] Failed to generate QR data URL:', err.message);
                }
            }

            if (connection === 'open') {
                console.log('[WhatsApp Engine] ✅ WhatsApp Connection ACTIVE & LINKED!');
                waQrDataUrl = null;
                const userJid = waSocket.user ? waSocket.user.id : 'WhatsApp User';
                waConnectionState = { connected: true, user: userJid, status: 'connected' };
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
                console.log('[WhatsApp Engine] Connection closed. Reconnecting:', shouldReconnect);
                waConnectionState = { connected: false, user: null, status: 'disconnected' };
                if (shouldReconnect) {
                    setTimeout(() => initWhatsAppEngine(), 3000);
                }
            }
        });
    } catch (err) {
        console.error('[WhatsApp Engine] Initialization error:', err.message);
    }
}

// ─── WhatsApp Web HTTP API Endpoints ─────────────────────────────────────────
app.get('/wa/status', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({
        ...waConnectionState,
        qrAvailable: Boolean(waQrDataUrl)
    });
});

app.post('/wa/pair-code', async (req, res) => {
    try {
        const { phone } = req.body || {};
        if (!phone) {
            return res.status(400).json({ error: 'Please provide a valid phone number with country code (e.g. 966501234567).' });
        }
        if (waConnectionState.connected) {
            return res.json({ connected: true, message: 'WhatsApp is already connected & linked!' });
        }
        if (!waSocket) {
            return res.status(531).json({ error: 'WhatsApp engine is initializing. Try again in 5 seconds.' });
        }

        let cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length < 8) {
            return res.status(400).json({ error: 'Invalid phone number format. Include country code (e.g. 966501234567).' });
        }

        const code = await waSocket.requestPairingCode(cleanPhone);
        console.log(`[WhatsApp Pairing Code] Generated for ${cleanPhone}: ${code}`);
        return res.json({ success: true, pairingCode: code, phone: cleanPhone });
    } catch (err) {
        console.error('[WhatsApp Pairing Code Error]:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

app.get('/wa/qr', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    if (waConnectionState.connected) {
        return res.status(200).send('<h3 style="color:#10b981; text-align:center; font-family:sans-serif;">🟢 WhatsApp is Connected & Linked!</h3>');
    }
    if (waQrDataUrl) {
        if (req.query.format === 'json') {
            return res.json({ qr: waQrDataUrl });
        }
        const imgBuffer = Buffer.from(waQrDataUrl.split(',')[1], 'base64');
        res.setHeader('Content-Type', 'image/png');
        return res.send(imgBuffer);
    }
    return res.status(200).send('<h3 style="color:#6366f1; text-align:center; font-family:sans-serif;">⏳ Generating WhatsApp QR Code... Please refresh in 5 seconds.</h3>');
});

app.post('/wa/logout', async (_req, res) => {
    try {
        if (waSocket) {
            try { await waSocket.logout(); } catch(e){}
        }
        const authDir = path.join(__dirname, 'auth_info_baileys');
        if (fs.existsSync(authDir)) {
            fs.rmSync(authDir, { recursive: true, force: true });
        }
        waConnectionState = { connected: false, user: null, status: 'logged_out' };
        setTimeout(() => initWhatsAppEngine(), 2000);
        return res.json({ success: true, message: 'Logged out successfully. Re-generating QR code.' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.post('/wa/send', async (req, res) => {
    try {
        const { phone, text } = req.body || {};
        if (!phone || !text) {
            return res.status(400).json({ error: 'Missing phone or text parameter.' });
        }
        if (!waConnectionState.connected || !waSocket) {
            return res.status(531).json({ error: 'WhatsApp engine is not connected. Scan QR code in dashboard.' });
        }

        let cleanPhone = phone.replace(/[^0-9]/g, '');
        if (!cleanPhone.endsWith('@s.whatsapp.net')) {
            cleanPhone = `${cleanPhone}@s.whatsapp.net`;
        }

        const sentMsg = await waSocket.sendMessage(cleanPhone, { text });
        console.log(`[WhatsApp Sent] → ${phone}: "${text.substring(0, 40)}..."`);
        return res.json({ success: true, messageId: sentMsg.key.id, recipient: cleanPhone });
    } catch (err) {
        console.error('[WhatsApp Send Error]:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`[Server] Listening on port ${PORT}`));

// Initialize WhatsApp Engine
initWhatsAppEngine();

// ─── FCM Push Notification Helpers ──────────────────────────────────────────
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

async function sendWhatsAppDirect(phone, text) {
    if (!phone || !text) return;
    if (!waConnectionState.connected || !waSocket) {
        console.log(`[WhatsApp Skip] Engine not linked — skip automated alert to ${phone}`);
        return;
    }
    try {
        let cleanPhone = phone.replace(/[^0-9]/g, '');
        if (!cleanPhone.endsWith('@s.whatsapp.net')) {
            cleanPhone = `${cleanPhone}@s.whatsapp.net`;
        }
        await waSocket.sendMessage(cleanPhone, { text });
        console.log(`💬 [WhatsApp Auto-Sent] → ${phone}: "${text.substring(0, 40)}..."`);
    } catch (err) {
        console.error(`❌ [WhatsApp Auto-Send Failed] → ${phone}:`, err.message);
    }
}

// ─── Notification Listeners ──────────────────────────────────────────────────
const prevState = {};
const notifiedGeneralTasks = {};
const isFirstGeneralTasksLoad = {};
const companyTemplates = {};

function startNotificationListeners(companyId) {
    console.log(`[Server] Starting listeners for company: ${companyId}...`);
    isFirstGeneralTasksLoad[companyId] = true;

    // Real-Time Listener for Custom Notification Templates
    db.ref(`companies/${companyId}/messagingTemplates`).on('value', (snap) => {
        companyTemplates[companyId] = snap.val() || {};
        console.log(`[Server] [${companyId}] Real-Time Custom Notification Templates Updated.`);
    });

    db.ref(`companies/${companyId}/workers`).on('value', async (snapshot) => {
        const workers = snapshot.val();
        if (!workers) return;

        const sends = [];
        const companyLabel = companyId === 'mvcfresh' ? 'MVC Fresh' : (companyId === 'mvc' ? 'MVC' : 'Burgeroov');
        const tpls = companyTemplates[companyId] || {};

        workers.forEach((after, index) => {
            if (!after) return;

            const fcmToken   = after.fcmToken;
            const phone      = after.phone;
            const waEnabled  = after.waAlertsEnabled !== false;
            const workerName = after.name || `Worker #${index}`;
            const cacheKey   = `${companyId}_${index}`;
            const before     = prevState[cacheKey] || null;

            prevState[cacheKey] = JSON.parse(JSON.stringify(after));

            if (!before) return;

            // 1. NEW TASK
            const beforeJobs = Array.isArray(before.jobs) ? before.jobs : [];
            const afterJobs  = Array.isArray(after.jobs)  ? after.jobs  : [];

            if (afterJobs.length > beforeJobs.length) {
                const beforeIds = new Set(beforeJobs.map(j => j.id));
                const newJobs   = afterJobs.filter(j => !beforeIds.has(j.id));

                for (const job of newJobs) {
                    const title = job.title || job.name || 'New task';
                    
                    if (fcmToken) {
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

                    if (phone && waEnabled) {
                        const rawTpl = tpls.task || '📋 *مهمة جديدة أسندت إليك [{company_name}]*\n\nالموظف: {worker_name}\nالمهمة: {task_title}\n\nيرجى فتح لوحة المهام للإنجاز.';
                        const waMsg = rawTpl
                            .replace(/{worker_name}/g, workerName)
                            .replace(/{task_title}/g, title)
                            .replace(/{company_name}/g, companyLabel);
                        sendWhatsAppDirect(phone, waMsg);
                    }
                }
            }

            // 2. NEW DELIVERY ORDER
            const hadOrder = before?.activeOrder?.startTime;
            const hasOrder = after?.activeOrder?.startTime;

            if (!hadOrder && hasOrder) {
                const order    = after.activeOrder;
                const customer = order.customerName || order.address || 'عميل';

                if (fcmToken) {
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

                if (phone && waEnabled) {
                    const rawTpl = tpls.delivery || '🛵 *طلب توصيل جديد [{company_name}]*\n\nالموظف: {worker_name}\nالعميل: {customer_name}\n\nيرجى بدء التوصيل فوراً!';
                    const waMsg = rawTpl
                        .replace(/{worker_name}/g, workerName)
                        .replace(/{customer_name}/g, customer)
                        .replace(/{order_id}/g, order.orderId || '101')
                        .replace(/{company_name}/g, companyLabel);
                    sendWhatsAppDirect(phone, waMsg);
                }
            }

            // 3. NEW VIOLATION
            const beforeViol = countAcrossMonths(before?.monthlyStats, 'violationsList');
            const afterViol  = countAcrossMonths(after?.monthlyStats,  'violationsList');

            if (afterViol > beforeViol) {
                let reason = 'تسجيل مخالفة جديدة على ملفك.';
                let violAmount = '0';
                if (after.monthlyStats) {
                    const months = Object.keys(after.monthlyStats).sort().reverse();
                    for (const m of months) {
                        const list = after.monthlyStats[m]?.violationsList;
                        if (Array.isArray(list) && list.length > 0) {
                            reason = list[0].reason || reason;
                            violAmount = list[0].amount || '0';
                            break;
                        }
                    }
                }

                if (fcmToken) {
                    sends.push(safeSend({
                        token: fcmToken,
                        notification: { title: `⚠️ Violation Recorded [${companyLabel}]`, body: reason },
                        data: { type: 'violation', tab: 'finance', workerName, companyId },
                        android: { priority: 'high', notification: { channelId: 'burgeroov_alerts' } },
                        apns:    { payload: { aps: { sound: 'default', badge: 1 } } }
                    }, `[${companyId}] VIOLATION → ${workerName}`));
                }

                if (phone && waEnabled) {
                    const rawTpl = tpls.violation || '⚠️ *تنبيه مخالفة [{company_name}]*\n\nالموظف: {worker_name}\nالسبب: {reason}\nالمبلغ: {amount} ر.س';
                    const waMsg = rawTpl
                        .replace(/{worker_name}/g, workerName)
                        .replace(/{reason}/g, reason)
                        .replace(/{amount}/g, violAmount)
                        .replace(/{company_name}/g, companyLabel);
                    sendWhatsAppDirect(phone, waMsg);
                }
            }

            // 4. NEW REWARD
            const beforeRew = countAcrossMonths(before?.monthlyStats, 'rewardsList');
            const afterRew  = countAcrossMonths(after?.monthlyStats,  'rewardsList');

            if (afterRew > beforeRew) {
                let rewardNote = 'مكافأة جديدة من الإدارة!';
                let rewardAmount = '0';
                if (after.monthlyStats) {
                    const months = Object.keys(after.monthlyStats).sort().reverse();
                    for (const m of months) {
                        const list = after.monthlyStats[m]?.rewardsList;
                        if (Array.isArray(list) && list.length > 0) {
                            const r = list[0];
                            rewardNote = r.reason || 'مكافأة ممتازة';
                            rewardAmount = r.amount || '0';
                            break;
                        }
                    }
                }

                if (fcmToken) {
                    sends.push(safeSend({
                        token: fcmToken,
                        notification: { title: `🎉 Reward Added [${companyLabel}]`, body: rewardNote },
                        data: { type: 'reward', tab: 'finance', workerName, companyId },
                        android: { priority: 'normal', notification: { channelId: 'burgeroov_rewards' } },
                        apns:    { payload: { aps: { sound: 'default', badge: 1 } } }
                    }, `[${companyId}] REWARD → ${workerName}`));
                }

                if (phone && waEnabled) {
                    const rawTpl = tpls.reward || '🎉 *مكافأة جديدة [{company_name}]*\n\nالموظف: {worker_name}\nالبيان: {reason}\nالمبلغ: {amount} ر.س';
                    const waMsg = rawTpl
                        .replace(/{worker_name}/g, workerName)
                        .replace(/{reason}/g, rewardNote)
                        .replace(/{amount}/g, rewardAmount)
                        .replace(/{company_name}/g, companyLabel);
                    sendWhatsAppDirect(phone, waMsg);
                }
            }
        });

        if (sends.length > 0) await Promise.all(sends);
    }, (err) => {
        console.error(`[RTDB] [${companyId}] Workers Listener error:`, err.message);
    });

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
        const companyLabel = companyId === 'mvcfresh' ? 'MVC Fresh' : (companyId === 'mvc' ? 'MVC' : 'Burgeroov');

        const [workersSnapshot, groupsSnapshot] = await Promise.all([
            db.ref(`companies/${companyId}/workers`).once('value'),
            db.ref(`companies/${companyId}/taskGroups`).once('value')
        ]);
        const workers = workersSnapshot.val() || [];
        const groups = groupsSnapshot.val() || [];

        Object.keys(tasksObj).forEach(taskId => {
            const task = tasksObj[taskId];
            const cacheKey = `${companyId}_${taskId}`;
            if (task && task.status === 'pending' && !notifiedGeneralTasks[cacheKey]) {
                notifiedGeneralTasks[cacheKey] = true;

                const title = task.title || 'New General Task';
                const group = task.targetGroupId ? (groups || []).find(g => g && g.id === task.targetGroupId) : null;

                workers.forEach((w, index) => {
                    if (!w) return;
                    if (group && group.members && !group.members.includes(w.id)) {
                        return;
                    }

                    if (w.fcmToken) {
                        const notifTitle = group 
                            ? `👥 New Group Task Available [${group.name}]` 
                            : `🌍 New General Task Available [${companyLabel}]`;

                        sends.push(safeSend({
                            token: w.fcmToken,
                            notification: {
                                title: notifTitle,
                                body: `${title} — open your task board to accept it.`
                            },
                            data: { type: 'generalTask', tab: 'tasks', workerName: w.name || `Worker #${index}`, companyId },
                            android: { priority: 'high', notification: { channelId: 'burgeroov_tasks' } },
                            apns:    { payload: { aps: { sound: 'default', badge: 1 } } }
                        }, `[${companyId}] GROUP/GENERAL TASK → ${w.name || `Worker #${index}`}: "${title}"`));
                    }

                    if (w.phone && w.waAlertsEnabled !== false) {
                        const waMsg = group 
                            ? `👥 *مهمة جديدة للمجموعة [${group.name}]*\n\nالمهمة: ${title}\n\nيرجى الاطلاع والإنجاز.`
                            : `🌍 *مهمة عامة جديدة [${companyLabel}]*\n\nالمهمة: ${title}\n\nيرجى قبول المهمة في لوحة المهام.`;
                        sendWhatsAppDirect(w.phone, waMsg);
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

    // Listener 3: NEW MARKET / KITCHEN PREPARE ORDERS → PREPARING WORKER
    const notifiedPrepareOrders = {};
    let isFirstPrepareLoad = true;

    db.ref(`companies/${companyId}/marketOrders`).on('value', async (snapshot) => {
        const ordersObj = snapshot.val();

        if (isFirstPrepareLoad) {
            isFirstPrepareLoad = false;
            if (ordersObj) {
                Object.keys(ordersObj).forEach(id => {
                    notifiedPrepareOrders[`${companyId}_${id}`] = true;
                });
            }
            return;
        }

        if (!ordersObj) return;

        const sends = [];
        const companyLabel = companyId === 'mvcfresh' ? 'MVC Fresh' : (companyId === 'mvc' ? 'MVC' : 'Burgeroov');
        const tpls = companyTemplates[companyId] || {};

        const [workersSnap, assignedSnap, assignedOldSnap] = await Promise.all([
            db.ref(`companies/${companyId}/workers`).once('value'),
            db.ref(`companies/${companyId}/assignedPreparingWorkerIds`).once('value'),
            db.ref(`companies/${companyId}/assignedPreparingWorkerId`).once('value')
        ]);

        const workers = workersSnap.val() || [];
        let assignedIds = assignedSnap.val() || [];
        if (!Array.isArray(assignedIds)) {
            const oldId = assignedOldSnap.val();
            assignedIds = oldId ? [String(oldId)] : [];
        }
        const assignedStrs = assignedIds.map(id => String(id));

        // Find ALL assigned preparing workers
        let prepWorkers = workers.filter(w => w && (assignedStrs.includes(String(w.id)) || assignedStrs.includes(String(w.phone)) || w.role === 'prepare' || w.role === 'kitchen' || w.isPreparingWorker));

        Object.keys(ordersObj).forEach(id => {
            const order = ordersObj[id];
            const cacheKey = `${companyId}_${id}`;

            if (order && (order.status === 'pending' || !order.status) && !notifiedPrepareOrders[cacheKey]) {
                notifiedPrepareOrders[cacheKey] = true;

                const customerName = order.workerName || order.customerName || 'Customer';
                const itemsCount = Array.isArray(order.items) ? order.items.length : 1;
                const orderNum = order.orderNum || id;

                prepWorkers.forEach(prepWorker => {
                    if (prepWorker.fcmToken) {
                        sends.push(safeSend({
                            token: prepWorker.fcmToken,
                            notification: {
                                title: `👨‍🍳 New Kitchen Prepare Order #${orderNum} [${companyLabel}]`,
                                body: `Order for ${customerName} (${itemsCount} items) needs preparation.`
                            },
                            data: { type: 'prepare', tab: 'prepare', companyId },
                            android: { priority: 'high', notification: { channelId: 'burgeroov_orders' } },
                            apns:    { payload: { aps: { sound: 'default', badge: 1 } } }
                        }, `[${companyId}] PREPARE ORDER → ${prepWorker.name || 'Prep Worker'}`));
                    }

                    if (prepWorker.phone && prepWorker.waAlertsEnabled !== false) {
                        const rawTpl = tpls.prepare || '👨‍🍳 *تنبيه تحضير طلب جديد #{order_id} [{company_name}]*\n\nالعميل: {customer_name}\nعدد الأصناف: {items_count}\n\nيرجى فتح الشاشة والبدء بالتحضير!';
                        const waMsg = rawTpl
                            .replace(/{worker_name}/g, prepWorker.name || 'موظف التحضير')
                            .replace(/{customer_name}/g, customerName)
                            .replace(/{order_id}/g, orderNum)
                            .replace(/{items_count}/g, itemsCount)
                            .replace(/{company_name}/g, companyLabel);
                        sendWhatsAppDirect(prepWorker.phone, waMsg);
                    }
                });
            }
        });

        if (sends.length > 0) {
            await Promise.all(sends);
        }
    }, (err) => {
        console.error(`[RTDB] [${companyId}] Market Orders Listener error:`, err.message);
    });
}

// Start listeners
startNotificationListeners('burgeroov');
startNotificationListeners('mvc');
startNotificationListeners('mvcfresh');
