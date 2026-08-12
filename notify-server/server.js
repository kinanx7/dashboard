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
const { makeWASocket, useMultiFileAuthState, DisconnectReason, BufferJSON, initAuthCreds, proto } = require('@whiskeysockets/baileys');
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

// ─── Self-Hosted WhatsApp Web Engine (Baileys + Firebase Persistent Auth) ───
let waSocket = null;
let waQrDataUrl = null;
let waConnectionState = { connected: false, user: null, status: 'initializing' };

// Firebase RTDB Auth State for WhatsApp (Persistent across Render restarts & redeploys)
const useFirebaseAuthState = async (dbRef) => {
    let creds;
    try {
        const credsSnap = await dbRef.child('creds').once('value');
        const credsVal = credsSnap.val();
        if (credsVal) {
            creds = JSON.parse(JSON.stringify(credsVal), BufferJSON.reviver);
        } else {
            creds = initAuthCreds();
        }
    } catch (e) {
        console.warn('[Firebase Auth State] Failed to load creds from Firebase, initializing fresh:', e.message);
        creds = initAuthCreds();
    }

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            try {
                                const snap = await dbRef.child(`keys/${type}_${id}`).once('value');
                                let value = snap.val();
                                if (value) {
                                    if (type === 'app-state-sync-key' && typeof value === 'object') {
                                        value = proto.Message.AppStateSyncKeyData.fromObject(value);
                                    }
                                    data[id] = JSON.parse(JSON.stringify(value), BufferJSON.reviver);
                                }
                            } catch (err) {
                                console.warn(`[Firebase Auth State] Error reading key ${type}_${id}:`, err.message);
                            }
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const updates = {};
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const keyPath = `keys/${category}_${id}`;
                            if (value) {
                                updates[keyPath] = JSON.parse(JSON.stringify(value, BufferJSON.replacer));
                            } else {
                                updates[keyPath] = null;
                            }
                        }
                    }
                    if (Object.keys(updates).length > 0) {
                        try {
                            await dbRef.update(updates);
                        } catch (err) {
                            console.error('[Firebase Auth State] Error saving key updates:', err.message);
                        }
                    }
                }
            }
        },
        saveCreds: async () => {
            try {
                const serialized = JSON.parse(JSON.stringify(creds, BufferJSON.replacer));
                await dbRef.child('creds').set(serialized);
            } catch (err) {
                console.error('[Firebase Auth State] Error saving creds:', err.message);
            }
        }
    };
};

async function initWhatsAppEngine() {
    console.log('[WhatsApp Engine] Initializing self-hosted WhatsApp Web Gateway with Firebase Auth Persistence...');
    try {
        const authRef = db.ref('whatsapp_auth_baileys');
        const { state, saveCreds } = await useFirebaseAuthState(authRef);

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
                console.log('[WhatsApp Engine] ✅ WhatsApp Connection ACTIVE & LINKED (Persisted in Firebase)!');
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
                } else {
                    console.log('[WhatsApp Engine] Logged out from WhatsApp. Wiping Firebase auth state...');
                    try { await authRef.remove(); } catch(e){}
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
        try {
            await db.ref('whatsapp_auth_baileys').remove();
        } catch(e){}
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

// ─── WhatsApp Anti-Spam Queue System (3-Second Staggered Interval) ───────────
const waQueue = [];
let isProcessingWaQueue = false;
const WA_STAGGER_INTERVAL_MS = 3000; // 3 seconds interval between recipients

function queueWhatsAppMessage(phone, text) {
    if (!phone || !text) return;
    waQueue.push({ phone, text });
    console.log(`📥 [WhatsApp Anti-Spam Queue] Queued message for ${phone} (Batch Position: #${waQueue.length})`);
    processWaQueue();
}

async function processWaQueue() {
    if (isProcessingWaQueue) return;
    isProcessingWaQueue = true;

    while (waQueue.length > 0) {
        const item = waQueue.shift();
        if (item && item.phone && item.text) {
            await executeWhatsAppDispatch(item.phone, item.text);
            if (waQueue.length > 0) {
                console.log(`⏳ [WhatsApp Anti-Spam Safety Queue] Waiting 3 seconds before notifying next recipient (${waQueue.length} remaining in queue)...`);
                await new Promise(resolve => setTimeout(resolve, WA_STAGGER_INTERVAL_MS));
            }
        }
    }

    isProcessingWaQueue = false;
}

async function executeWhatsAppDispatch(phone, text) {
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
        console.log(`💬 [WhatsApp Sent (3s Staggered Queue)] → ${phone}: "${text.substring(0, 40)}..."`);
    } catch (err) {
        console.error(`❌ [WhatsApp Send Failed] → ${phone}:`, err.message);
    }
}

async function sendWhatsAppDirect(phone, text) {
    queueWhatsAppMessage(phone, text);
}

app.post('/wa/send', async (req, res) => {
    try {
        const { phone, text } = req.body || {};
        if (!phone || !text) {
            return res.status(400).json({ error: 'Missing phone or text parameter.' });
        }
        if (!waConnectionState.connected || !waSocket) {
            return res.status(531).json({ error: 'WhatsApp engine is not connected. Scan QR code in dashboard.' });
        }

        queueWhatsAppMessage(phone, text);
        return res.json({ success: true, message: 'Message queued safely for dispatch with 3-second anti-spam interval.' });
    } catch (err) {
        console.error('[WhatsApp Send Error]:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// ─── Notification Listeners Global State ─────────────────────────────────────
const prevState = {};
const notifiedGeneralTasks = {};
const isFirstGeneralTasksLoad = {};
const companyTemplates = {};

// Helper to safely get preparing workers across all company nodes & formats
async function getPreparingWorkersForCompany(companyId) {
    const companyList = [companyId, 'mvc', 'mvcfresh', 'burgeroov'];
    const uniqueList = [...new Set(companyList.filter(Boolean))];
    const foundWorkers = [];

    for (const cKey of uniqueList) {
        try {
            const [workersSnap, assignedSnap, assignedOldSnap] = await Promise.all([
                db.ref(`companies/${cKey}/workers`).once('value'),
                db.ref(`companies/${cKey}/assignedPreparingWorkerIds`).once('value'),
                db.ref(`companies/${cKey}/assignedPreparingWorkerId`).once('value')
            ]);

            const rawWorkers = workersSnap.val();
            let wList = [];
            if (Array.isArray(rawWorkers)) {
                wList = rawWorkers;
            } else if (rawWorkers && typeof rawWorkers === 'object') {
                wList = Object.values(rawWorkers);
            }

            let aIds = [];
            const rawAssigned = assignedSnap.val();
            if (Array.isArray(rawAssigned)) {
                aIds = rawAssigned;
            } else if (rawAssigned && typeof rawAssigned === 'object') {
                aIds = Object.values(rawAssigned);
            } else {
                const oldId = assignedOldSnap.val();
                if (oldId) aIds = [oldId];
            }

            const aStrs = aIds.map(id => String(id).trim());

            wList.forEach((w, idx) => {
                if (!w) return;
                const wId = String(w.id || idx).trim();
                const wPhone = String(w.phone || '').trim();
                if (aStrs.includes(wId) || aStrs.includes(wPhone) || w.role === 'prepare' || w.role === 'kitchen' || w.isPreparingWorker) {
                    foundWorkers.push(w);
                }
            });
        } catch (e) {
            console.error(`[getPreparingWorkersForCompany] Error for ${cKey}:`, e.message);
        }
    }

    // De-duplicate workers by phone or id
    const map = {};
    foundWorkers.forEach(w => {
        const key = w.phone || w.id || w.name;
        if (key) map[key] = w;
    });

    return Object.values(map);
}

// Universal helper to replace template tags across all event types
function formatCustomTemplate(rawTpl, data = {}) {
    if (!rawTpl) return '';
    let text = rawTpl;

    const workerName = data.workerName || data.worker_name || 'الموظف';
    const taskTitle = data.taskTitle || data.task_title || data.title || 'المهمة';
    const orderId = data.orderId || data.order_id || data.orderNum || '#000000';
    const customerName = data.customerName || data.customer_name || 'العميل';
    const amount = data.amount || '0';
    const reason = data.reason || 'تنبيه إداري';
    const companyName = data.companyName || data.company_name || 'شبكة إم في سي';
    const itemsCount = data.itemsCount || data.items_count || '1';

    text = text.replace(/{worker_name}/g, workerName)
               .replace(/{task_title}/g, taskTitle)
               .replace(/{order_id}/g, orderId)
               .replace(/{customer_name}/g, customerName)
               .replace(/{amount}/g, amount)
               .replace(/{reason}/g, reason)
               .replace(/{company_name}/g, companyName)
               .replace(/{items_count}/g, itemsCount);

    return text;
}

const notifiedPrepareOrders = {};

// Function to send FCM & WhatsApp alerts for new prepare orders
async function sendPrepareOrderAlert(companyId, order) {
    if (!order) return;
    const orderId = order.id || order.orderNum;
    if (!orderId) return;

    const cacheKey = `${companyId}_${orderId}`;
    if (notifiedPrepareOrders[cacheKey]) {
        console.log(`[Prepare Order Alert] Already sent for order ${cacheKey} — skipping duplicate alert.`);
        return;
    }
    notifiedPrepareOrders[cacheKey] = true;

    const companyLabel = companyId === 'mvcfresh' ? 'MVC Fresh' : (companyId === 'mvc' ? 'MVC' : 'Burgeroov');
    const tpls = companyTemplates[companyId] || {};

    const prepWorkers = await getPreparingWorkersForCompany(companyId);
    console.log(`[Prepare Order Alert] Found ${prepWorkers.length} assigned preparing workers for company ${companyId}`);

    if (prepWorkers.length === 0) {
        console.warn(`[Prepare Order Alert] ⚠️ No assigned preparing workers found for ${companyId}!`);
        return;
    }

    const customerName = order.workerName || order.customerName || 'Customer';
    const itemsCount = Array.isArray(order.items) ? order.items.length : 1;
    const orderNum = order.orderNum || order.id || '#000000';
    const sends = [];

    prepWorkers.forEach(prepWorker => {
        const workerName = prepWorker.name || 'Prep Worker';
        const fcmToken = prepWorker.fcmToken;
        const phone = prepWorker.phone;
        const waEnabled = prepWorker.waAlertsEnabled !== false;

        if (fcmToken) {
            sends.push(safeSend({
                token: fcmToken,
                notification: {
                    title: `👨‍🍳 New Kitchen Prepare Order ${orderNum} [${companyLabel}]`,
                    body: `Order for ${customerName} (${itemsCount} items) needs preparation.`
                },
                data: { type: 'prepare', tab: 'prepare', companyId },
                android: { priority: 'high', notification: { channelId: 'burgeroov_orders' } },
                apns:    { payload: { aps: { sound: 'default', badge: 1 } } }
            }, `[${companyId}] PREPARE ORDER → ${workerName}`));
        }

        if (phone && waEnabled) {
            const rawTpl = tpls.prepare || '👨‍🍳 *تنبيه تحضير طلب جديد {order_id} [{company_name}]*\n\nالعميل: {customer_name}\nعدد الأصناف: {items_count}\n\nيرجى فتح الشاشة والبدء بالتحضير!';
            const waMsg = formatCustomTemplate(rawTpl, {
                workerName,
                customerName,
                orderId: orderNum,
                itemsCount,
                companyName: companyLabel
            });
            sendWhatsAppDirect(phone, waMsg);
        }
    });

    if (sends.length > 0) {
        await Promise.all(sends);
    }
}

// Dedicated HTTP API endpoint to trigger prepare order notifications
app.post('/notify/prepare', async (req, res) => {
    try {
        const { companyId, order } = req.body || {};
        if (!order) {
            return res.status(400).json({ error: 'Missing order parameter' });
        }
        const cKey = companyId || order.companyKey || 'mvc';
        await sendPrepareOrderAlert(cKey, order);
        return res.json({ success: true, message: 'Prepare order notifications dispatched successfully.' });
    } catch (err) {
        console.error('[Notify Prepare Error]:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// Listener 3: NEW MARKET / KITCHEN PREPARE ORDERS → PREPARING WORKER
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

        let workerList = [];
        if (Array.isArray(workers)) {
            workerList = workers;
        } else if (workers && typeof workers === 'object') {
            workerList = Object.values(workers);
        }

        workerList.forEach((after, index) => {
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
                        const waMsg = formatCustomTemplate(rawTpl, {
                            workerName,
                            taskTitle: title,
                            companyName: companyLabel
                        });
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
                    const waMsg = formatCustomTemplate(rawTpl, {
                        workerName,
                        customerName: customer,
                        orderId: order.orderId || '101',
                        companyName: companyLabel
                    });
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
                    const waMsg = formatCustomTemplate(rawTpl, {
                        workerName,
                        reason,
                        amount: violAmount,
                        companyName: companyLabel
                    });
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
                    const waMsg = formatCustomTemplate(rawTpl, {
                        workerName,
                        reason: rewardNote,
                        amount: rewardAmount,
                        companyName: companyLabel
                    });
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
        const rawWorkers = workersSnapshot.val();
        let workers = [];
        if (Array.isArray(rawWorkers)) {
            workers = rawWorkers;
        } else if (rawWorkers && typeof rawWorkers === 'object') {
            workers = Object.values(rawWorkers);
        }

        const rawGroups = groupsSnapshot.val();
        let groups = [];
        if (Array.isArray(rawGroups)) {
            groups = rawGroups;
        } else if (rawGroups && typeof rawGroups === 'object') {
            groups = Object.values(rawGroups);
        }

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

        Object.keys(ordersObj).forEach(id => {
            const order = ordersObj[id];
            const cacheKey = `${companyId}_${id}`;

            if (order && (order.status === 'pending' || !order.status) && !notifiedPrepareOrders[cacheKey]) {
                notifiedPrepareOrders[cacheKey] = true;
                sendPrepareOrderAlert(companyId, order);
            }
        });
    }, (err) => {
        console.error(`[RTDB] [${companyId}] Market Orders Listener error:`, err.message);
    });
}

// Start listeners
startNotificationListeners('burgeroov');
startNotificationListeners('mvc');
startNotificationListeners('mvcfresh');

// ─── Automated GMT+3 Task Cycle Server Dispatcher ────────────────────────────────
function getGMT3ServerTime() {
    const now = new Date();
    const options = { timeZone: 'Asia/Riyadh', hour12: false, hour: '2-digit', minute: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(now);
    let year, month, day, hour, minute, weekdayStr;
    parts.forEach(p => {
        if (p.type === 'year') year = p.value;
        if (p.type === 'month') month = p.value;
        if (p.type === 'day') day = p.value;
        if (p.type === 'hour') hour = p.value;
        if (p.type === 'minute') minute = p.value;
        if (p.type === 'weekday') weekdayStr = p.value;
    });
    const dayCode = (weekdayStr || '').toLowerCase().substring(0, 3);
    return { dateStr: `${year}-${month}-${day}`, timeStr: `${hour}:${minute}`, dayCode };
}

async function runServerTaskCycleCheck() {
    const companyKeys = ['burgeroov', 'mvc', 'mvcfresh'];
    const { dateStr, timeStr, dayCode } = getGMT3ServerTime();

    for (const cKey of companyKeys) {
        try {
            const [cyclesSnap, workersSnap] = await Promise.all([
                db.ref(`companies/${cKey}/taskCycles`).once('value'),
                db.ref(`companies/${cKey}/workers`).once('value')
            ]);

            const cyclesObj = cyclesSnap.val();
            if (!cyclesObj) continue;

            const rawWorkers = workersSnap.val();
            let workers = [];
            if (Array.isArray(rawWorkers)) {
                workers = rawWorkers;
            } else if (rawWorkers && typeof rawWorkers === 'object') {
                workers = Object.values(rawWorkers);
            }

            Object.keys(cyclesObj).forEach(workerId => {
                const cycle = cyclesObj[workerId];
                if (!cycle || !cycle.items) return;
                const items = Array.isArray(cycle.items) ? cycle.items : Object.values(cycle.items);

                items.forEach(async (item, itemIdx) => {
                    if (!item || !item.time || !item.title) return;

                    // Check day recurrence
                    const daysArr = Array.isArray(item.days) ? item.days : ['every'];
                    const isTodayScheduled = daysArr.includes('every') || daysArr.length === 0 || daysArr.includes(dayCode);

                    if (isTodayScheduled && item.time === timeStr && item.lastDispatchedDate !== dateStr) {
                        console.log(`⏰ [Server Task Cycle GMT+3] Dispatching scheduled task for worker ${workerId} on ${dayCode} at ${timeStr}: "${item.title}"`);

                        await db.ref(`companies/${cKey}/taskCycles/${workerId}/items/${itemIdx}/lastDispatchedDate`).set(dateStr);

                        const wIndex = workers.findIndex(w => w && String(w.id) === String(workerId));
                        if (wIndex !== -1) {
                            const worker = workers[wIndex];
                            const existingJobs = Array.isArray(worker.jobs) ? worker.jobs : [];
                            const newJob = {
                                id: Date.now(),
                                title: `🔁 [Daily Cycle ${timeStr}] ${item.title}`,
                                status: 'pending',
                                createdAt: Date.now(),
                                assignedBy: 'Task Cycle System'
                            };
                            existingJobs.push(newJob);
                            await db.ref(`companies/${cKey}/workers/${wIndex}/jobs`).set(existingJobs);

                            if (worker.phone && worker.waAlertsEnabled !== false) {
                                const companyLabel = cKey === 'mvcfresh' ? 'MVC Fresh' : (cKey === 'mvc' ? 'MVC' : 'Burgeroov');
                                const tpls = companyTemplates[cKey] || {};
                                const rawTpl = tpls.cycle || '🔁 *تنبيه مهمة دورية مجدولة [{company_name}]*\n\nالمهمة: {task_title}\nالموظف: {worker_name}\n\nيرجى فتح اللوحة والمتابعة!';
                                const waMsg = formatCustomTemplate(rawTpl, {
                                    workerName: worker.name || 'الموظف',
                                    taskTitle: item.title,
                                    orderId: timeStr,
                                    companyName: companyLabel
                                });
                                sendWhatsAppDirect(worker.phone, waMsg);
                            }
                        }
                    }
                });
            });
        } catch (e) {
            console.error(`[Server Task Cycle Error] ${cKey}:`, e.message);
        }
    }
}

setInterval(runServerTaskCycleCheck, 30000);

