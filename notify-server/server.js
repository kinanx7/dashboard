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
const pino = require('pino');
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

// Helper to safely send Firebase Cloud Messaging (FCM) notifications
async function safeSend(payload, logLabel = 'FCM Notification') {
    if (!payload || !payload.token) return null;
    try {
        const response = await messaging.send(payload);
        console.log(`✅ [FCM Sent] ${logLabel} -> ID: ${response}`);
        return response;
    } catch (err) {
        console.error(`❌ [FCM Error] ${logLabel} -> ${err.message}`);
        if (err.code === 'messaging/registration-token-not-registered' || err.code === 'messaging/invalid-registration-token') {
            console.warn(`[FCM Clean] Token for ${logLabel} is expired or invalid.`);
        }
        return null;
    }
}

// ─── Express App Setup ───────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// Helper functions to sanitize/unsanitize Firebase RTDB keys (Firebase disallows . # $ / [ ])
const encodeKey = (str) => String(str || '').replace(/\./g, '%2E').replace(/#/g, '%23').replace(/\$/g, '%24').replace(/\//g, '%2F').replace(/\[/g, '%5B').replace(/\]/g, '%5D');
const decodeKey = (str) => String(str || '').replace(/%2E/g, '.').replace(/%23/g, '#').replace(/%24/g, '$').replace(/%2F/g, '/').replace(/%5B/g, '[').replace(/%5D/g, ']');

// Firebase RTDB Auth State for WhatsApp (Persistent across Render restarts & redeploys)
const useFirebaseAuthState = async (dbRef) => {
    let creds;
    try {
        const credsSnap = await dbRef.child('creds').once('value');
        const credsVal = credsSnap.val();
        if (credsVal) {
            const rawStr = typeof credsVal === 'string' ? credsVal : JSON.stringify(credsVal);
            creds = JSON.parse(rawStr, BufferJSON.reviver);
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
                                const safeKey = `${encodeKey(type)}_${encodeKey(id)}`;
                                const snap = await dbRef.child(`keys/${safeKey}`).once('value');
                                let value = snap.val();
                                if (value !== null && value !== undefined) {
                                    let parsed;
                                    if (typeof value === 'string') {
                                        parsed = JSON.parse(value, BufferJSON.reviver);
                                    } else {
                                        parsed = JSON.parse(JSON.stringify(value), BufferJSON.reviver);
                                    }
                                    if (type === 'app-state-sync-key' && parsed && typeof parsed === 'object') {
                                        parsed = proto.Message.AppStateSyncKeyData.fromObject(parsed);
                                    }
                                    data[id] = parsed;
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
                            const safeKey = `${encodeKey(category)}_${encodeKey(id)}`;
                            const keyPath = `keys/${safeKey}`;
                            if (value !== undefined && value !== null) {
                                updates[keyPath] = JSON.stringify(value, BufferJSON.replacer);
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
                const serialized = JSON.stringify(creds, BufferJSON.replacer);
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
            logger: pino({ level: 'silent' }),
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

function queueWhatsAppMessage(phone, text, image = null) {
    if (!phone || !text) return;
    waQueue.push({ phone, text, image });
    console.log(`📥 [WhatsApp Anti-Spam Queue] Queued message for ${phone} (Batch Position: #${waQueue.length})`);
    processWaQueue();
}

async function processWaQueue() {
    if (isProcessingWaQueue) return;
    isProcessingWaQueue = true;

    while (waQueue.length > 0) {
        const item = waQueue.shift();
        if (item && item.phone && item.text) {
            await executeWhatsAppDispatch(item.phone, item.text, item.image);
            if (waQueue.length > 0) {
                console.log(`⏳ [WhatsApp Anti-Spam Safety Queue] Waiting 3 seconds before notifying next recipient (${waQueue.length} remaining in queue)...`);
                await new Promise(resolve => setTimeout(resolve, WA_STAGGER_INTERVAL_MS));
            }
        }
    }

    isProcessingWaQueue = false;
}

async function executeWhatsAppDispatch(phone, text, image = null) {
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
        
        if (image) {
            if (typeof image === 'string' && image.startsWith('data:image/')) {
                const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
                const imgBuffer = Buffer.from(base64Data, 'base64');
                await waSocket.sendMessage(cleanPhone, { image: imgBuffer, caption: text });
            } else if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'))) {
                await waSocket.sendMessage(cleanPhone, { image: { url: image }, caption: text });
            } else {
                await waSocket.sendMessage(cleanPhone, { text });
            }
        } else {
            await waSocket.sendMessage(cleanPhone, { text });
        }
        console.log(`💬 [WhatsApp Sent (Staggered Queue)] → ${phone}: "${text.substring(0, 40)}..." ${image ? '🖼️ (With Image)' : ''}`);
    } catch (err) {
        console.error(`❌ [WhatsApp Send Failed] → ${phone}:`, err.message);
    }
}

async function sendWhatsAppDirect(phone, text, image = null) {
    queueWhatsAppMessage(phone, text, image);
}

app.post('/wa/send', async (req, res) => {
    try {
        const { phone, text, image } = req.body || {};
        if (!phone || !text) {
            return res.status(400).json({ error: 'Missing phone or text parameter.' });
        }
        if (!waConnectionState.connected || !waSocket) {
            return res.status(531).json({ error: 'WhatsApp engine is not connected. Scan QR code in dashboard.' });
        }

        queueWhatsAppMessage(phone, text, image);
        return res.json({ success: true, message: 'Message queued safely for dispatch with anti-spam interval.' });
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

// Helper function to count violations or rewards across monthly stats
function countAcrossMonths(monthlyStats, listName) {
    if (!monthlyStats || typeof monthlyStats !== 'object') return 0;
    let total = 0;
    Object.values(monthlyStats).forEach(monthObj => {
        if (monthObj && monthObj[listName]) {
            if (Array.isArray(monthObj[listName])) {
                total += monthObj[listName].length;
            } else if (typeof monthObj[listName] === 'object') {
                total += Object.keys(monthObj[listName]).length;
            }
        }
    });
    return total;
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
            const normalizeArray = (val) => Array.isArray(val) ? val.filter(Boolean) : (val && typeof val === 'object' ? Object.values(val).filter(Boolean) : []);
            const beforeJobs = normalizeArray(before.jobs);
            const afterJobs  = normalizeArray(after.jobs);

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
            const cyclesSnap = await db.ref(`companies/${cKey}/taskCycles`).once('value');
            const cyclesObj = cyclesSnap.val();
            if (!cyclesObj) continue;

            const dueTasks = [];
            Object.keys(cyclesObj).forEach(workerId => {
                const cycle = cyclesObj[workerId];
                if (!cycle || !cycle.items) return;
                const items = Array.isArray(cycle.items) ? cycle.items : Object.values(cycle.items);

                items.forEach((item, itemIdx) => {
                    if (!item || !item.time || !item.title) return;

                    const daysArr = Array.isArray(item.days) ? item.days : ['every'];
                    const isTodayScheduled = daysArr.includes('every') || daysArr.length === 0 || daysArr.includes(dayCode);

                    if (isTodayScheduled && item.time === timeStr && item.lastDispatchedDate !== dateStr) {
                        dueTasks.push({ workerId, itemIdx, item });
                    }
                });
            });

            if (dueTasks.length === 0) continue;

            const workersSnap = await db.ref(`companies/${cKey}/workers`).once('value');
            const rawWorkers = workersSnap.val();
            let workers = [];
            if (Array.isArray(rawWorkers)) {
                workers = rawWorkers;
            } else if (rawWorkers && typeof rawWorkers === 'object') {
                workers = Object.values(rawWorkers);
            }

            for (const { workerId, itemIdx, item } of dueTasks) {
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
        } catch (e) {
            console.error(`[Server Task Cycle Error] ${cKey}:`, e.message);
        }
    }
}

setInterval(runServerTaskCycleCheck, 60000);

// ─── SALLA AUTOMATED 60-SECOND BACKGROUND POLLING & AUTO-REFRESH ─────────
async function refreshSallaToken(refreshToken) {
    if (!refreshToken) return null;
    return new Promise((resolve) => {
        const postBody = new URLSearchParams({
            client_id: SALLA_CLIENT_ID,
            client_secret: SALLA_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        }).toString();

        console.log('🔄 [Salla Refresh Token Requesting New Access Token]');
        const https = require('https');
        const req = https.request('https://accounts.salla.sa/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postBody)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', async () => {
                try {
                    const json = JSON.parse(data);
                    if (json && json.access_token) {
                        const companyKeys = ['burgeroov', 'mvc', 'mvcfresh', 'salla_shared'];
                        for (const c of companyKeys) {
                            await db.ref(`companies/${c}/sallaAuth`).update({
                                access_token: json.access_token,
                                refresh_token: json.refresh_token || refreshToken,
                                expires_in: json.expires_in,
                                refreshedAt: Date.now()
                            });
                        }
                        console.log('🎉 [Salla Token Auto-Refreshed & Stored to Firebase Successfully!]');
                    }
                    resolve(json);
                } catch(e) {
                    resolve(null);
                }
            });
        });
        req.on('error', () => resolve(null));
        req.write(postBody);
        req.end();
    });
}

async function runAutoSallaSync() {
    try {
        let auth = null;
        for (const c of ['burgeroov', 'mvcfresh', 'mvc', 'salla_shared']) {
            const snap = await db.ref(`companies/${c}/sallaAuth`).once('value');
            if (snap.val() && (snap.val().access_token || snap.val().refresh_token)) {
                auth = snap.val();
                break;
            }
        }
        if (!auth) return;

        const https = require('https');
        const companyKeys = ['burgeroov', 'mvc', 'mvcfresh', 'salla_shared'];

        const fetchPage = (token, page) => new Promise((resolve) => {
            const req = https.request(`https://api.salla.dev/admin/v2/orders?page=${page}&per_page=40`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            }, (apiRes) => {
                let d = '';
                apiRes.on('data', c => d += c);
                apiRes.on('end', () => {
                    try { resolve({ statusCode: apiRes.statusCode, data: JSON.parse(d) }); }
                    catch (e) { resolve({ statusCode: apiRes.statusCode, raw: d }); }
                });
            });
            req.on('error', () => resolve(null));
            req.setTimeout(8000, () => { req.destroy(); resolve(null); });
            req.end();
        });

        let currentToken = auth.access_token;
        let firstPageRes = await fetchPage(currentToken, 1);

        // If token is expired (401), automatically refresh it using refresh_token and retry!
        if ((!firstPageRes || firstPageRes.statusCode === 401) && auth.refresh_token) {
            console.warn('⚠️ [Salla Access Token Expired 401] Auto-refreshing via refresh_token...');
            const refreshRes = await refreshSallaToken(auth.refresh_token);
            if (refreshRes && refreshRes.access_token) {
                currentToken = refreshRes.access_token;
                firstPageRes = await fetchPage(currentToken, 1);
            }
        }

        if (firstPageRes && firstPageRes.data && Array.isArray(firstPageRes.data.data)) {
            for (const item of firstPageRes.data.data) {
                const isDemo = String(item.urls?.customer || '').includes('demostore.salla.sa') || 
                               item.customer?.first_name === 'abc' || 
                               (item.items && item.items.some(i => i.name === 'فستان'));
                if (isDemo) continue;

                const formattedOrder = formatSallaOrderHelper(item);
                if (!formattedOrder || !formattedOrder.id) continue;

                for (const c of companyKeys) {
                    await db.ref(`companies/${c}/sallaOrders/${formattedOrder.id}`).set(formattedOrder);
                }
            }
        }
    } catch (e) {
        console.warn('[Auto Salla Sync Error]:', e.message);
    }
}

// Background auto-sync every 60 seconds (1 min) so orders appear immediately without delay
setInterval(runAutoSallaSync, 60000);
setTimeout(runAutoSallaSync, 10000);

// Keep-alive ping every 3 minutes so Render never sleeps or cold-boots
setInterval(() => {
    try {
        const https = require('https');
        https.get('https://burgeroov-notify.onrender.com/ping', () => {}).on('error', () => {});
    } catch(e) {}
}, 3 * 60 * 1000);

// ─── SALLA STORE REAL-TIME WEBHOOK & OAUTH CALLBACK ───────────────────────
const SALLA_CLIENT_ID = process.env.SALLA_CLIENT_ID || '12683e56-fcb1-4c9d-bac4-e537d213d779';
const SALLA_CLIENT_SECRET = process.env.SALLA_CLIENT_SECRET || 'a9c8efe0a97f043f704becb568941cc055e020204577c93a4e4eb23c77f0ef47';
const SALLA_REDIRECT_URI = 'https://burgeroov-notify.onrender.com/salla/callback';

let lastSallaAuthAttempt = null;

async function exchangeSallaCodeForToken(code) {
    if (!code) return null;
    return new Promise((resolve) => {
        const postBody = new URLSearchParams({
            client_id: SALLA_CLIENT_ID,
            client_secret: SALLA_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: SALLA_REDIRECT_URI
        }).toString();

        console.log('📤 [Salla Token Exchange Request Payload]', postBody);

        const https = require('https');
        const req = https.request('https://accounts.salla.sa/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postBody)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log('🎉 [Salla OAuth Token Exchange Response]', json);
                    lastSallaAuthAttempt = {
                        timestamp: new Date().toISOString(),
                        statusCode: res.statusCode,
                        response: json
                    };
                    resolve(json);
                } catch (e) {
                    console.error('❌ [Salla Token Parse Error]', data);
                    lastSallaAuthAttempt = {
                        timestamp: new Date().toISOString(),
                        statusCode: res.statusCode,
                        rawResponse: data
                    };
                    resolve({ raw: data });
                }
            });
        });

        req.on('error', (err) => {
            console.error('❌ [Salla Token Request Error]', err.message);
            lastSallaAuthAttempt = {
                timestamp: new Date().toISOString(),
                error: err.message
            };
            resolve(null);
        });

        req.write(postBody);
        req.end();
    });
}

app.get('/salla/auth-debug', async (_req, res) => {
    try {
        const snap = await db.ref('companies/burgeroov/sallaAuth').once('value');
        res.json({
            databaseAuthSaved: !!snap.val(),
            databaseAuth: snap.val(),
            lastAuthAttempt: lastSallaAuthAttempt
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

async function subscribeSallaWebhooks(token) {
    if (!token) return { status: 'error', reason: 'No token provided' };
    const events = ['order.created', 'order.updated', 'order.status.updated', 'order.cancelled', 'order.shipment.created'];
    const results = [];
    const https = require('https');

    for (const ev of events) {
        const payload = JSON.stringify({
            name: `MVC Dashboard - ${ev}`,
            event: ev,
            url: 'https://burgeroov-notify.onrender.com/salla/webhook',
            version: '2',
            rule: 'ALL'
        });

        const res = await new Promise((resolve) => {
            const req = https.request('https://api.salla.dev/admin/v2/webhooks/subscribe', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                }
            }, (apiRes) => {
                let d = '';
                apiRes.on('data', c => d += c);
                apiRes.on('end', () => {
                    try { resolve({ event: ev, status: apiRes.statusCode, data: JSON.parse(d) }); }
                    catch (e) { resolve({ event: ev, status: apiRes.statusCode, raw: d }); }
                });
            });
            req.on('error', (err) => resolve({ event: ev, error: err.message }));
            req.write(payload);
            req.end();
        });
        results.push(res);
    }
    console.log('📡 [Salla Webhook Auto-Subscription Results]:', results);
    return results;
}

app.post('/salla/save-token', async (req, res) => {
    try {
        const token = (req.body && req.body.token) || req.query.token;
        if (!token) return res.status(400).json({ status: 'error', message: 'Token is required' });

        const companyKeys = ['burgeroov', 'mvc', 'mvcfresh'];
        for (const c of companyKeys) {
            await db.ref(`companies/${c}/sallaAuth`).set({
                access_token: token.trim(),
                token_type: 'bearer',
                installedAt: Date.now()
            });
        }

        // Try subscribing webhooks automatically using this token
        const webhookResults = await subscribeSallaWebhooks(token.trim());

        return res.json({
            status: 'success',
            message: 'Token saved and webhooks registered successfully! ✅',
            webhooks: webhookResults
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get(['/salla/webhook', '/salla', '/salla/'], (_req, res) => {
    res.status(200).json({ status: 'ok', message: 'Salla Webhook Endpoint is active and listening for orders ✅' });
});

function formatSallaOrderHelper(item, extraBody) {
    if (!item) return null;
    const body = extraBody || {};
    const baseOrder = item.order || item.data || item;
    
    // 1. Order ID & Reference Resolution (Prioritize official Salla merchant Reference ID)
    const rawRefId = baseOrder.order_reference_id || baseOrder.reference_id || (baseOrder.order && (baseOrder.order.reference_id || baseOrder.order.order_reference_id || baseOrder.order.id)) || baseOrder.order_id || baseOrder.invoice_number || baseOrder.id || body.orderId || body.order_id;
    if (!rawRefId) return null;
    const orderId = String(rawRefId);
    const orderNumber = String(rawRefId);
    const invoiceNum = baseOrder.invoice_number ? String(baseOrder.invoice_number) : '';

    // 2. Customer details (Support standard customer, shipping receiver, ship_to, and root objects)
    const cust = baseOrder.customer || item.customer || body.customer || {};
    const ship = baseOrder.shipping || item.shipping || body.shipping || {};
    const receiver = ship.receiver || baseOrder.receiver || {};
    const shipTo = baseOrder.ship_to || item.ship_to || body.ship_to || {};
    const address = ship.address || baseOrder.address || item.address || cust.address || body.address || {};

    let custName = (
        shipTo.name || 
        `${shipTo.first_name || ''} ${shipTo.last_name || ''}`.trim() ||
        `${cust.first_name || ''} ${cust.last_name || ''}`.trim() || 
        cust.full_name || 
        cust.name || 
        receiver.name || 
        `${receiver.first_name || ''} ${receiver.last_name || ''}`.trim() ||
        baseOrder.customer_name ||
        baseOrder.customer_first_name ||
        body.customerName || 
        ''
    ).trim();

    // 3. Phone
    let rawPhone = String(
        shipTo.phone || 
        shipTo.mobile || 
        cust.mobile || 
        cust.phone || 
        receiver.phone || 
        receiver.mobile || 
        baseOrder.customer_mobile || 
        baseOrder.customer_phone || 
        body.customerPhone || 
        ''
    );
    let cleanMobile = rawPhone.replace(/[^0-9]/g, '');
    if (cleanMobile) {
        if (cleanMobile.startsWith('05')) cleanMobile = '966' + cleanMobile.substring(1);
        else if (cleanMobile.startsWith('5') && cleanMobile.length === 9) cleanMobile = '966' + cleanMobile;
        else if (!cleanMobile.startsWith('966') && !cleanMobile.startsWith('971') && !cleanMobile.startsWith('965')) cleanMobile = '966' + cleanMobile;
    }

    if (!custName || custName === 'عميل متجر سلة' || custName === 'عميل المتجر' || custName === 'Store Customer' || custName === 'Salla Customer') {
        if (cust.first_name || cust.last_name) {
            custName = `${cust.first_name || ''} ${cust.last_name || ''}`.trim();
        } else if (cleanMobile) {
            custName = `عميل (${cleanMobile})`;
        } else {
            custName = 'عميل المتجر';
        }
    }

    // 4. Address & Pinpoint Location
    const city = shipTo.city || (shipTo.region && shipTo.region.name) || address.city || cust.address?.city || 'الرياض';
    const district = (shipTo.district && (shipTo.district.name || shipTo.district)) || address.district || cust.address?.district || '';
    const street = shipTo.address_line_two || shipTo.address_line || address.street_name || address.street || address.shipping_address || cust.address?.street_name || '';
    const desc = address.description || address.details || cust.address?.description || '';
    const fullAddressParts = [city, district, street, desc].filter(Boolean);
    const addressLine = fullAddressParts.length > 0 ? fullAddressParts.join(' - ') : (body.addressLine || 'العنوان المسجل في سلة');
    
    let coords = null;
    if (shipTo.latitude && shipTo.longitude) {
        coords = { lat: parseFloat(shipTo.latitude), lng: parseFloat(shipTo.longitude) };
    } else if (address.location || cust.address?.location || baseOrder.coords) {
        coords = address.location || cust.address?.location || baseOrder.coords;
    }

    // 5. Total Amount (Handling nested objects, amounts.total, 15% VAT, packages sum)
    let rawTotal = 0;
    if (baseOrder.amounts && baseOrder.amounts.total) {
        rawTotal = (typeof baseOrder.amounts.total === 'object') ? (baseOrder.amounts.total.amount || baseOrder.amounts.total.total || 0) : baseOrder.amounts.total;
    } else if (baseOrder.total !== undefined && baseOrder.total !== null) {
        rawTotal = (typeof baseOrder.total === 'object') ? (baseOrder.total.amount || baseOrder.total.total || 0) : baseOrder.total;
    } else if (item.total !== undefined && item.total !== null) {
        rawTotal = (typeof item.total === 'object') ? (item.total.amount || item.total.total || 0) : item.total;
    } else if (baseOrder.amounts && baseOrder.amounts.sub_total && baseOrder.amounts.tax) {
        const sub = (typeof baseOrder.amounts.sub_total === 'object') ? (baseOrder.amounts.sub_total.amount || 0) : parseFloat(baseOrder.amounts.sub_total || 0);
        const tax = (typeof baseOrder.amounts.tax === 'object') ? (baseOrder.amounts.tax.amount ? (baseOrder.amounts.tax.amount.amount || baseOrder.amounts.tax.amount) : 0) : parseFloat(baseOrder.amounts.tax || 0);
        const shipCost = (baseOrder.amounts.shipping_cost && typeof baseOrder.amounts.shipping_cost === 'object') ? (baseOrder.amounts.shipping_cost.amount || 0) : parseFloat(baseOrder.amounts.shipping_cost || 0);
        rawTotal = sub + tax + shipCost;
    } else if (baseOrder.sub_total !== undefined && baseOrder.sub_total !== null) {
        const sub = (typeof baseOrder.sub_total === 'object') ? baseOrder.sub_total.amount : parseFloat(baseOrder.sub_total || 0);
        rawTotal = sub * 1.15;
    } else if (body.total || body.amount) {
        rawTotal = body.total || body.amount;
    }
    const parsedTotal = isNaN(parseFloat(rawTotal)) ? '0.00' : parseFloat(rawTotal).toFixed(2);

    const paymentMethod = baseOrder.payment_method || item.payment_method || body.paymentMethod || (baseOrder.cash_on_delivery ? 'Cash On Delivery' : 'Mada');
    const rawStatus = (baseOrder.status && (baseOrder.status.slug || baseOrder.status.name)) || (item.status && (item.status.slug || item.status.name)) || 'in_progress';
    
    // Robust date parsing for all Salla date formats (including MySQL datetime, { date, timezone }, and ISO strings)
    function parseSallaDateHelper(rawDate) {
        if (!rawDate) return null;
        try {
            if (typeof rawDate === 'number') {
                return rawDate < 10000000000 ? rawDate * 1000 : rawDate;
            }
            if (typeof rawDate === 'object') {
                if (rawDate.date) rawDate = rawDate.date;
                else if (rawDate.created_at) rawDate = rawDate.created_at;
            }
            if (typeof rawDate === 'string') {
                rawDate = rawDate.trim();
                if (rawDate.includes('T') || rawDate.includes('Z') || /[+-]\d{2}:\d{2}$/.test(rawDate) || rawDate.includes('GMT')) {
                    const t = new Date(rawDate).getTime();
                    if (!isNaN(t)) return t;
                }
                if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(rawDate)) {
                    const isoStr = rawDate.split('.')[0].replace(' ', 'T') + '+03:00';
                    const t = new Date(isoStr).getTime();
                    if (!isNaN(t)) return t;
                }
                const t = new Date(rawDate).getTime();
                if (!isNaN(t)) return t;
            }
        } catch(e) {}
        return null;
    }

    const rawDateCandidate = baseOrder.date || baseOrder.created_at || item.date || item.created_at || body.created_at || body.date;
    const parsedTime = parseSallaDateHelper(rawDateCandidate);
    const createdAt = (parsedTime && !isNaN(parsedTime) && parsedTime > 1000000000000) ? parsedTime : Date.now();

    // 6. Notes & Clean Items (Supporting both standard items and packages)
    let extractedNotes = [];
    if (baseOrder.notes) extractedNotes.push(baseOrder.notes);
    if (baseOrder.customer_note) extractedNotes.push(baseOrder.customer_note);
    if (item.notes) extractedNotes.push(item.notes);
    if (body.notes) extractedNotes.push(body.notes);

    const rawItems = baseOrder.items || item.items || baseOrder.packages || item.packages || (Array.isArray(body.items) ? body.items : []) || (Array.isArray(body.packages) ? body.packages : []);
    const items = [];

    rawItems.forEach(i => {
        if (!i) return;
        const iname = String(i.name || i.product_name || i.title || '').trim();
        const itype = String(i.type || '').toLowerCase();

        // Separate customer notes
        if (iname.includes('ملاحظات العميل') || iname.includes('ملاحظة') || iname.includes('ملاحظات') || iname.includes('customer note')) {
            const noteVal = i.description || i.notes || i.value || '';
            if (noteVal) extractedNotes.push(`${iname}: ${noteVal}`);
            return;
        }
        // Exclude shipping and delivery fees
        if (itype === 'service' || iname.includes('رسوم الشحن') || iname.includes('توصيل') || iname.includes('شحن')) {
            return;
        }

        let optionsStr = '';
        if (i.options && Array.isArray(i.options)) {
            optionsStr = i.options.map(o => `${o.name ? o.name + ': ' : ''}${o.value || ''}`).join(', ');
        } else if (typeof i.options === 'string') {
            optionsStr = i.options;
        }

        const itemPrice = (i.price && typeof i.price === 'object' ? (i.price.amount || i.price.value) : i.price) || 0;

        items.push({
            name: iname || 'منتج',
            quantity: parseInt(i.quantity || i.qty || 1) || 1,
            options: optionsStr,
            price: isNaN(parseFloat(itemPrice)) ? 0 : parseFloat(itemPrice)
        });
    });

    return {
        id: orderId,
        orderNumber: orderNumber,
        order_reference_id: baseOrder.order_reference_id || baseOrder.reference_id || (baseOrder.order_id ? String(baseOrder.order_id) : null),
        invoice_number: invoiceNum,
        customerName: custName,
        customerPhone: cleanMobile,
        city: city,
        addressLine: addressLine,
        coords: coords,
        total: parsedTotal,
        paymentMethod: paymentMethod,
        status: rawStatus,
        createdAt: createdAt,
        notes: extractedNotes.filter(Boolean).join(' | '),
        items: items,
        checklist: {}
    };
}

app.get('/salla/reparse-orders', async (_req, res) => {
    try {
        const companyKeys = ['burgeroov', 'mvc', 'mvcfresh', 'salla_shared'];
        let allLogs = [...(lastSallaWebhooks || [])];

        // Pull persistent webhook history from Firebase RTDB
        try {
            const historySnap = await db.ref('sallaWebhookHistory').once('value');
            const historyVal = historySnap.val() || {};
            Object.values(historyVal).forEach(h => {
                if (h && h.raw) {
                    allLogs.push(h);
                }
            });
        } catch(e) {}

        if (!allLogs || allLogs.length === 0) {
            return res.json({ status: 'ok', message: 'No stored webhook logs to reparse' });
        }

        let updatedCount = 0;
        const seenIds = new Set();

        for (const log of allLogs) {
            const rawData = (log.raw && log.raw.data) || log.raw;
            if (!rawData) continue;

            const formatted = formatSallaOrderHelper(rawData, log.raw);
            if (!formatted || !formatted.id || seenIds.has(formatted.id)) continue;
            seenIds.add(formatted.id);

            for (const c of companyKeys) {
                await db.ref(`companies/${c}/sallaOrders/${formatted.id}`).set(formatted);
            }
            updatedCount++;
        }

        return res.json({ status: 'success', message: `Reparsed and restored ${updatedCount} orders! ✅` });
    } catch (e) {
        console.error('❌ [Reparse Error]:', e.message);
        res.status(500).json({ error: e.message });
    }
});

app.all('/salla/clear-orders', async (_req, res) => {
    try {
        const companyKeys = ['burgeroov', 'mvc', 'mvcfresh', 'salla_shared'];
        for (const c of companyKeys) {
            await db.ref(`companies/${c}/sallaOrders`).remove().catch(() => {});
            await db.ref(`companies/${c}/sallaBatchCustomerChecks`).remove().catch(() => {});
            await db.ref(`companies/${c}/sallaBatchPurchases`).remove().catch(() => {});
        }
        return res.json({ status: 'success', message: 'All Salla orders and batch items cleared from Firebase RTDB ✅' });
    } catch (e) {
        console.error('❌ [Clear Orders Error]:', e.message);
        res.status(500).json({ error: e.message });
    }
});

app.get('/salla/sync-orders', async (_req, res) => {
    try {
        let auth = null;
        for (const c of ['burgeroov', 'mvcfresh', 'mvc', 'salla_shared']) {
            const snap = await db.ref(`companies/${c}/sallaAuth`).once('value');
            if (snap.val() && snap.val().access_token) {
                auth = snap.val();
                break;
            }
        }
        
        let syncedCount = 0;
        const companyKeys = ['burgeroov', 'mvc', 'mvcfresh', 'salla_shared'];

        // 1. If OAuth token exists, fetch up to 4 pages (200 orders) from Salla Orders API
        if (auth && auth.access_token) {
            const https = require('https');
            const fetchPage = (page) => new Promise((resolve) => {
                const req = https.request(`https://api.salla.dev/admin/v2/orders?page=${page}&per_page=50`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${auth.access_token}`,
                        'Accept': 'application/json'
                    }
                }, (apiRes) => {
                    let d = '';
                    apiRes.on('data', c => d += c);
                    apiRes.on('end', () => {
                        try { resolve(JSON.parse(d)); }
                        catch (e) { resolve({ raw: d }); }
                    });
                });
                req.on('error', () => resolve(null));
                req.setTimeout(8000, () => { req.destroy(); resolve(null); });
                req.end();
            });

            for (let page = 1; page <= 4; page++) {
                const pageRes = await fetchPage(page);
                if (pageRes && pageRes.data && Array.isArray(pageRes.data) && pageRes.data.length > 0) {
                    for (const item of pageRes.data) {
                        const isDemo = String(item.urls?.customer || '').includes('demostore.salla.sa') || 
                                       item.customer?.first_name === 'abc' || 
                                       (item.items && item.items.some(i => i.name === 'فستان'));
                        if (isDemo) continue;

                        const formattedOrder = formatSallaOrderHelper(item);
                        if (!formattedOrder || !formattedOrder.id) continue;

                        for (const c of companyKeys) {
                            await db.ref(`companies/${c}/sallaOrders/${formattedOrder.id}`).set(formattedOrder);
                        }
                        syncedCount++;
                    }
                } else {
                    break;
                }
            }
        }

        // 2. Also reparse persistent webhook history
        try {
            const historySnap = await db.ref('sallaWebhookHistory').once('value');
            const historyVal = historySnap.val() || {};
            for (const h of Object.values(historyVal)) {
                if (h && h.raw) {
                    const rawData = (h.raw && h.raw.data) || h.raw;
                    const formattedOrder = formatSallaOrderHelper(rawData, h.raw);
                    if (formattedOrder && formattedOrder.id) {
                        for (const c of companyKeys) {
                            await db.ref(`companies/${c}/sallaOrders/${formattedOrder.id}`).set(formattedOrder);
                        }
                        syncedCount++;
                    }
                }
            }
        } catch(e) {}

        return res.json({ 
            status: 'success', 
            syncedCount: syncedCount, 
            message: `Synced and updated ${syncedCount} orders from Salla! ✅` 
        });
    } catch (e) {
        console.error('❌ [Sync Orders Error]:', e.message);
        res.status(500).json({ error: e.message });
    }
});

app.get('/salla/callback', async (req, res) => {
    const code = req.query.code;
    let tokenData = null;
    let isInstalled = false;
    let errorMsg = null;

    if (code) {
        try {
            console.log('🔄 [Salla Callback] Exchanging authorization code with Salla OAuth token endpoint...');
            tokenData = await exchangeSallaCodeForToken(code);
            if (tokenData && (tokenData.access_token || tokenData.token_type)) {
                isInstalled = true;
                const companyKeys = ['burgeroov', 'mvc', 'mvcfresh', 'salla_shared'];
                for (const c of companyKeys) {
                    await db.ref(`companies/${c}/sallaAuth`).set({
                        ...tokenData,
                        installedAt: Date.now()
                    });
                }
                if (tokenData.access_token) {
                    await subscribeSallaWebhooks(tokenData.access_token).catch(() => {});
                }
                console.log('🎉 [Salla App Installed Successfully] Token stored to Firebase RTDB!');
            } else if (tokenData && (tokenData.error || tokenData.message)) {
                errorMsg = JSON.stringify(tokenData);
            }
        } catch (err) {
            console.error('❌ [Salla Callback Error]:', err.message);
            errorMsg = err.message;
        }
    }

    if (isInstalled) {
        res.send(`
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>تم تثبيت وتفعيل تطبيق متجر سلة بنجاح</title>
                <style>
                    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                    .card { background: #1e293b; border: 2px solid #10b981; border-radius: 20px; padding: 40px 30px; max-width: 480px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
                    h1 { color: #10b981; margin: 0 0 10px 0; font-size: 1.6rem; }
                    p { color: #94a3b8; line-height: 1.6; font-size: 0.95rem; }
                    .badge { display: inline-block; background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 6px 16px; border-radius: 100px; font-weight: 800; font-size: 0.85rem; margin-top: 15px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div style="font-size: 3.5rem; margin-bottom: 12px;">🛍️</div>
                    <h1>تم تثبيت وتفعيل تطبيق متجر سلة بنجاح!</h1>
                    <p>تم إتمام المصادقة وتبادل المفاتيح رسمياً وحفظ توكن الربط في قاعدة البيانات. التطبيق الآن مثبت بنجاح ومستعد لاستقبال ومزامنة طلباتك.</p>
                    <div class="badge">✅ تم التثبيت وتفعيل الربط بنجاح</div>
                </div>
            </body>
            </html>
        `);
    } else {
        res.send(`
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>تنبيه ربط سلة</title>
                <style>
                    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                    .card { background: #1e293b; border: 2px solid #f59e0b; border-radius: 20px; padding: 40px 30px; max-width: 480px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
                    h1 { color: #f59e0b; margin: 0 0 10px 0; font-size: 1.6rem; }
                    p { color: #94a3b8; line-height: 1.6; font-size: 0.95rem; }
                    pre { background: #0f172a; padding: 10px; border-radius: 8px; color: #ef4444; font-size: 0.8rem; text-align: left; direction: ltr; overflow-x: auto; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div style="font-size: 3.5rem; margin-bottom: 12px;">⚠️</div>
                    <h1>تنبيه ربط سلة</h1>
                    <p>${errorMsg ? 'استجابة سلة أثناء محاولة التثبيت:' : 'لم يتم استلام كود التثبيت من سلة.'}</p>
                    ${errorMsg ? `<pre>${errorMsg}</pre>` : ''}
                    <p style="margin-top: 15px; font-size: 0.85rem;">يرجى إعادة المحاولة من رابط التثبيت بالمتجر.</p>
                </div>
            </body>
            </html>
        `);
    }
});

let lastSallaWebhooks = [];

app.get('/salla/logs', (_req, res) => {
    res.json({
        totalReceived: lastSallaWebhooks.length,
        logs: lastSallaWebhooks.slice(-10).reverse()
    });
});

app.get('/salla/current-orders', async (_req, res) => {
    try {
        const snap = await db.ref('companies').once('value');
        const companies = snap.val() || {};
        const resData = {};
        for (const [k, v] of Object.entries(companies)) {
            if (v && v.sallaOrders) {
                resData[k] = v.sallaOrders;
            }
        }
        res.json(resData);
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post(['/salla*', '/salla/webhook', '/salla/webhcook', '/salla/webhcoo', '/salla', '/salla/'], async (req, res) => {
    try {
        console.log('🛍️ [Salla Webhook Received]', JSON.stringify(req.body, null, 2));

        const body = req.body || {};
        const rawOrderId = (body.data && (body.data.reference_id || body.data.order_reference_id || body.data.id)) || body.id || Date.now();
        lastSallaWebhooks.push({
            timestamp: new Date().toISOString(),
            event: body.event,
            orderId: rawOrderId,
            raw: body
        });

        try {
            const cleanKey = String(rawOrderId).replace(/[.#$[\]/]/g, '_');
            await db.ref(`sallaWebhookHistory/${cleanKey}`).set({
                timestamp: Date.now(),
                event: body.event || 'order.created',
                orderId: String(rawOrderId),
                raw: body
            });
        } catch(hErr) {
            console.warn('Webhook history save error:', hErr.message);
        }

        const event = body.event || 'order.created';
        const orderData = body.data || body;

        // Handle Easy Mode Automatic Authorization
        if (event === 'app.store.authorize' || event === 'app.installed' || event === 'app.trial.started') {
            const authData = body.data || body;
            const companyKeys = ['burgeroov', 'mvc', 'mvcfresh', 'salla_shared'];
            for (const c of companyKeys) {
                await db.ref(`companies/${c}/sallaAuth`).set({
                    ...authData,
                    installedAt: Date.now()
                });
            }
            console.log('🎉 [Salla Easy Mode Auth Received & Stored!]', authData);
            return res.status(200).json({ status: 'success', message: 'App authorized successfully via Easy Mode' });
        }

        // Ignore draft cart events that lack finalized order data (real orders arrive via order.created / order.updated / abandoned.cart.purchased)
        if (event !== 'abandoned.cart.purchased' && (event.startsWith('abandoned.cart') || event.startsWith('cart.') || event.startsWith('checkout.'))) {
            return res.status(200).json({ status: 'ignored', reason: 'Cart draft event is not a finalized order' });
        }

        const formattedOrder = formatSallaOrderHelper(orderData, body);
        if (!formattedOrder || !formattedOrder.id) {
            return res.status(200).json({ status: 'ignored', reason: 'No order id in payload' });
        }

        const orderId = formattedOrder.id;

        // Save to all active companies so it appears in any company view (MVC FRESH, Burgeroov, etc.)
        const companyKeys = ['burgeroov', 'mvc', 'mvcfresh', 'salla_shared'];
        for (const c of companyKeys) {
            await db.ref(`companies/${c}/sallaOrders/${orderId}`).set(formattedOrder);
        }
        console.log(`✅ [Salla Order Saved] Order #${orderId} saved to companies/sallaOrders across all companies`);

        // Send WhatsApp alert to kitchen / managers if connected
        try {
            const itemsSummary = (formattedOrder.items || []).map(i => `• ${i.quantity}x ${i.name}`).join('\n');
            const alertMsg = `🛍️ *طلب جديد من متجر سلة #${orderId}*\n\n` +
                `👤 *العميل:* ${formattedOrder.customerName}\n` +
                `📞 *الجوال:* ${formattedOrder.customerPhone}\n` +
                `📍 *المدينة:* ${formattedOrder.city} - ${formattedOrder.addressLine}\n` +
                `💰 *المبلغ:* ${formattedOrder.total} ريال\n\n` +
                `📋 *الأصناف:*\n${itemsSummary}\n\n` +
                `يرجى فتح لوحة التحكم لتجهيز وتعبئة الطلب!`;

            // Notify admin/kitchen
            console.log(`📢 [Salla Alert] Notification ready for order #${orderId}`);
        } catch (waErr) {
            console.warn('[Salla WhatsApp Alert Error]', waErr.message);
        }

        return res.status(200).json({ status: 'success', orderId: orderId });
    } catch (err) {
        console.error('❌ [Salla Webhook Handler Error]:', err.message);
        return res.status(500).json({ status: 'error', message: err.message });
    }
});

// ─── Start HTTP Server & Initialize WhatsApp Engine ────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Burgeroov Notify & WhatsApp Gateway Server is active and listening on port ${PORT}`);
    initWhatsAppEngine();
});

