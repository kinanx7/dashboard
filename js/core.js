/**
 * Core global variables, navigation (switchTab), translations, Firebase init, FCM token & tick helpers
 */

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
window.escapeHtml = escapeHtml;

/**
 * Universal Yellow Search Highlight Helper
 */
function highlightSearchMatch(text, query) {
    if (!text || !query) return text || '';
    const trimmed = String(query).trim();
    if (!trimmed) return text;
    try {
        const escapedQuery = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        return String(text).replace(regex, '<mark class="search-highlight" style="background:#fde047; color:#713f12; padding:1px 4px; border-radius:4px; font-weight:800; box-shadow:0 1px 3px rgba(0,0,0,0.15);">$1</mark>');
    } catch(e) {
        return text;
    }
}
window.highlightSearchMatch = highlightSearchMatch;

function openImageModal(src) {
    if (!src) return;
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('image-modal-content');
    if (modal && modalImg) {
        modalImg.src = src;
        modal.style.display = 'flex';
    }
}
window.openImageModal = openImageModal;

// =============================================
// AUTO TRANSLATE ALERTS & DYNAMIC TERMS
// =============================================
function translateDynamicTerm(term) {
    if (!term) return '';
    const lang = (typeof currentAppLang !== 'undefined' ? currentAppLang : localStorage.getItem("burgeroov_lang")) || 'en';
    if (lang !== 'ar') return term;

    const dict = {
        'Cash': 'نقدي',
        'Credit Card': 'بطاقة ائتمان',
        'Electric Bill': 'فاتورة الكهرباء',
        'Meat Supplier': 'مورد اللحوم',
        'Packaging': 'التعبئة والتغليف',
        'Uncategorized': 'غير مصنف',
        'Unpaid': 'غير مدفوع',
        'Paid': 'مدفوع',
        'Pending': 'معلق',
        'Accepted': 'مقبول',
        'Rejected': 'مرفوض',
        'Released': 'تم الصرف',
        'present': 'حاضر',
        'absent': 'غائب',
        'day-off': 'إجازة',
        'sick-leave': 'إجازة مرضية',
        'public': 'عام',
        'private': 'خاص',
        'normal': 'عادي',
        'urgent': 'عاجل',
        'active': 'نشط',
        'completed': 'مكتمل',
        'cancelled': 'ملغى',
        'ready': 'جاهز',
        'preparing': 'قيد التحضير',
        'delivered': 'تم التوصيل',
        'Database connection error. Ensure your Firebase Rules are set to true.': 'خطأ في الاتصال بقاعدة البيانات. تأكد من ضبط قواعد Firebase على true.',
        'Failed to save. You may not have Admin permissions.': 'فشل الحفظ. قد لا تمتلك صلاحيات مسؤول.',
        'Only the ultimate admin can demote managers.': 'يمكن للمسؤول الرئيسي فقط إلغاء صلاحيات المديرين.',
        'Cannot demote master admin.': 'لا يمكن إلغاء صلاحيات المسؤول الرئيسي.',
        'Select a worker first.': 'يرجى اختيار موظف أولاً.',
        'Permissions updated!': 'تم تحديث الصلاحيات بنجاح!',
        'Microphone recording is not supported in this browser or environment.': 'تسجيل الصوت غير مدعوم في هذا المتصفح أو البيئة.',
        'Write a note or add a media attachment first.': 'يرجى كتابة ملاحظة أو إضافة مرفق أولاً.',
        'Failed to save note.': 'فشل حفظ الملاحظة.',
        'Failed to delete note.': 'فشل حذف الملاحظة.',
        'Failed to save reply.': 'فشل حفظ الرد.',
        'You don\'t have permission to delete this reply.': 'لا تملك الصلاحية لحذف هذا الرد.',
        'Failed to delete reply.': 'فشل حذف الرد.',
        'This income source already exists.': 'مصدر الدخل هذا موجود بالفعل.',
        'Please enter a valid amount and select a payment method.': 'يرجى إدخال مبلغ صالح واختيار طريقة الدفع.',
        'Failed to save transaction.': 'فشل حفظ المعاملة.',
        'Failed to delete transaction.': 'فشل حذف المعاملة.',
        'This cost category already exists.': 'فئة التكاليف هذه موجودة بالفعل.',
        'Please enter a valid amount and select a cost category.': 'يرجى إدخال مبلغ صالح واختيار فئة التكاليف.',
        'Failed to save cost transaction.': 'فشل حفظ معاملة التكاليف.',
        'Failed to delete cost transaction.': 'فشل حذف معاملة التكاليف.',
        'Please enter a valid amount.': 'يرجى إدخال مبلغ صالح.',
        'Please select a category.': 'يرجى اختيار الفئة.',
        'Please select a past date.': 'يرجى اختيار تاريخ سابق.',
        '❌ Incorrect password. Access denied.': '❌ كلمة المرور غير صحيحة. تم رفض الوصول.',
        'Please select a date in the past (not today or future).': 'يرجى اختيار تاريخ في الماضي (ليس اليوم أو في المستقبل).',
        'Failed to save past cost transaction.': 'فشل حفظ معاملة التكاليف السابقة.',
        'Folder already exists.': 'المجلد موجود بالفعل.',
        'You do not have permission to delete folders.': 'لا تملك الصلاحية لحذف المجلدات.',
        'Please fill out all product details correctly.': 'يرجى ملء جميع تفاصيل المنتج بشكل صحيح.',
        'You do not have permission to delete products.': 'لا تملك الصلاحية لحذف المنتجات.',
        'Warehouse is empty.': 'المستودع فارغ.',
        'Backup restored and synced to cloud successfully!': 'تم استعادة النسخة الاحتياطية ومزامنتها بنجاح!',
        'Invalid backup file.': 'ملف نسخة احتياطية غير صالح.',
        'Could not read file.': 'تعذر قراءة الملف.',
        'No records to export.': 'لا توجد سجلات لتصديرها.',
        'No records to export': 'لا توجد سجلات لتصديرها',
        'No worker profile found to export.': 'لم يتم العثور على ملف تعريف الموظف لتصديره.',
        'Please provide a valid name and amount.': 'يرجى تقديم اسم ومبلغ صالحين.',
        'Select an employee first.': 'يرجى اختيار موظف أولاً.',
        'Please enter a valid violation amount.': 'يرجى إدخال مبلغ مخالفة صالح.',
        'Please provide a reason or note for this violation.': 'يرجى تقديم سبب أو ملاحظة لهذه المخالفة.',
        'Enter a task template name.': 'أدخل اسم قالب المهمة.',
        'Select an employee and describe a task.': 'اختر موظفاً واكتب تفاصيل المهمة.',
        'General task created successfully!': 'تم إنشاء المهمة العامة بنجاح!',
        'Task not found.': 'المهمة غير موجودة.',
        'Worker profile not found.': 'ملف تعريف الموظف غير موجود.',
        'Failed to accept task. It may have been taken already.': 'فشل قبول المهمة. ربما تم أخذها بالفعل.',
        'General task deleted.': 'تم حذف المهمة العامة.',
        'Enter valid delivery time in minutes.': 'أدخل وقت توصيل صالح بالدقائق.',
        'Please enter the order details/items.': 'يرجى إدخال تفاصيل أو عناصر الطلب.',
        'Enter valid prep time in minutes.': 'أدخل وقت تحضير صالح بالدقائق.',
        'Invalid or existing branch.': 'فرع غير صالح أو موجود بالفعل.',
        'Complete all required fields, including email.': 'يرجى إكمال جميع الحقول المطلوبة، بما في ذلك البريد الإلكتروني.',
        'Initial Carryover Balance Updated.': 'تم تحديث الرصيد المرحل الأولي.',
        'Select an employee and date.': 'اختر الموظف والتاريخ.',
        'Only administrators can edit the map.': 'يسمح فقط للمسؤولين بتعديل الخريطة.',
        'Location not found.': 'العنوان غير موجود.',
        'Search failed.': 'فشل البحث.',
        'Only registered workers can request payments.': 'يسمح فقط للموظفين المسجلين بطلب سلف مالية.',
        'Please enter a valid amount greater than 0.': 'يرجى إدخال مبلغ صالح أكبر من 0.',
        'Please enter a reason for the request.': 'يرجى إدخال سبب الطلب.',
        'Request submitted successfully and is pending review.': 'تم تقديم الطلب بنجاح وهو قيد المراجعة.',
        'Incorrect verification code!': 'رمز التحقق غير صحيح!',
        'Worker not found in database.': 'المظف غير موجود في قاعدة البيانات.',
        'Payment logged and released successfully!': 'تم تسجيل وصرف السلفة بنجاح!',
        'Please select a worker first.': 'يرجى اختيار موظف أولاً.',
        'Please enter a reason for the system violation.': 'يرجى إدخال سبب المخالفة النظامية.',
        'System violation added successfully!': 'تم إضافة المخالفة النظامية بنجاح!',
        'System violation removed successfully!': 'تم إزالة المخالفة النظامية بنجاح!',
        'Worker account unlocked successfully!': 'تم إلغاء قفل حساب الموظف بنجاح!',
        'Worker account locked successfully!': 'تم قفل حساب الموظف بنجاح!'
    };

    if (dict[term]) return dict[term];

    // Dynamic partial matches
    if (term.includes('Sales successfully saved for')) {
        const month = term.replace('Sales successfully saved for ', '').replace(' 💰', '');
        return `تم حفظ المبيعات بنجاح لشهر ${month} 💰`;
    }
    if (term.includes('Unable to access microphone')) {
        return 'تعذر الوصول إلى الميكروفون. يرجى التأكد من تمكين صلاحيات الميكروفون لمتصفحك أو لتطبيق برجروف في إعدادات الهاتف 🎙️';
    }
    if (term.includes('This task was already accepted by')) {
        const by = term.replace('This task was already accepted by ', '');
        return `تم قبول هذه المهمة بالفعل من قبل ${by}.`;
    }
    if (term.includes('Success! You have accepted:')) {
        const title = term.replace('Success! You have accepted: ', '');
        return `نجاح! لقد قبلت المهمة: ${title}`;
    }
    if (term.includes('is now assigned as a Driver!')) {
        const name = term.replace(' is now assigned as a Driver!', '');
        return `تم تعيين ${name} كسائق بنجاح!`;
    }
    if (term.includes('is now assigned as General Staff!')) {
        const name = term.replace(' is now assigned as General Staff!', '');
        return `تم تعيين ${name} كموظف عام بنجاح!`;
    }
    if (term.includes('Past cost of SAR') && term.includes('has been logged!')) {
        return term.replace('Past cost of SAR', 'تم تسجيل تكلفة سابقة بقيمة')
            .replace('for', 'لفئة')
            .replace('on', 'في تاريخ')
            .replace('has been logged!', '!');
    }

    return term;
}

if (!window.originalAlert) {
    window.originalAlert = (window.alert ? window.alert.bind(window) : function () {});
    window.alert = function (msg) {
        return window.originalAlert(typeof translateDynamicTerm === 'function' ? translateDynamicTerm(msg) : msg);
    };
}

if (!window.originalConfirm) {
    window.originalConfirm = window.confirm;
    window.confirm = function (msg) {
        return window.originalConfirm(typeof translateDynamicTerm === 'function' ? translateDynamicTerm(msg) : msg);
    };
}

// FEATURE 1: IN-APP NOTIFICATION SYSTEM
var notifTimeout = null;

/**
 * Plays a short notification chime sound.
 */
function playNotifSound() {
    try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.6;
        audio.play().catch(() => {
            // Autoplay may be blocked before user interaction; fail silently.
        });
    } catch (e) {
        // Fail silently if Audio API not available.
    }
}

/**
 * Shows the sliding in-app notification banner with a custom message.
 * Automatically hides after 5 seconds. Plays a chime sound.
 * @param {string} message - The text to display in the banner.
 */
function showInAppNotification(message) {
    const banner = document.getElementById('in-app-notification');
    const textEl = document.getElementById('notif-text');
    if (!banner || !textEl) return;

    textEl.textContent = message;

    // Reset any pending auto-hide timer
    if (notifTimeout) {
        clearTimeout(notifTimeout);
        notifTimeout = null;
    }

    // Slide down
    banner.classList.add('notif-visible');

    // Play sound
    playNotifSound();

    // Auto-hide after 5 seconds
    notifTimeout = setTimeout(() => {
        hideInAppNotification();
    }, 5000);
}

/**
 * Hides the sliding in-app notification banner.
 */
function hideInAppNotification() {
    const banner = document.getElementById('in-app-notification');
    if (banner) banner.classList.remove('notif-visible');
    if (notifTimeout) {
        clearTimeout(notifTimeout);
        notifTimeout = null;
    }
}

var authMode = 'login';

var currentCustomerSession = null;
try {
    const savedCustomer = localStorage.getItem('mvc_customer_session');
    if (savedCustomer) currentCustomerSession = JSON.parse(savedCustomer);
} catch (e) {
    currentCustomerSession = null;
}

var localCustomerRegistry = {};
try {
    const cachedReg = localStorage.getItem('mvc_global_customer_registry');
    if (cachedReg) localCustomerRegistry = JSON.parse(cachedReg);
} catch (e) { }

function initPublicCustomerSync() {
    if (typeof window !== 'undefined' && window.db) {
        try {
            window.db.ref('publicCustomerCodes').on('value', snapshot => {
                if (snapshot.exists()) {
                    const val = snapshot.val() || {};
                    window.localCustomerRegistry = Object.assign({}, window.localCustomerRegistry, val);
                    try {
                        localStorage.setItem('mvc_global_customer_registry', JSON.stringify(window.localCustomerRegistry));
                    } catch (e) { }

                    // Real-time sync for active customer session
                    if (typeof currentCustomerSession !== 'undefined' && currentCustomerSession && (currentCustomerSession.code || currentCustomerSession.id)) {
                        const codeKey = String(currentCustomerSession.code || currentCustomerSession.id).trim();
                        if (val[codeKey] && typeof val[codeKey].coins !== 'undefined') {
                            const freshCoins = parseFloat(val[codeKey].coins) || 0;
                            if (currentCustomerSession.coins !== freshCoins) {
                                currentCustomerSession.coins = freshCoins;
                                try {
                                    localStorage.setItem('mvc_customer_session', JSON.stringify(currentCustomerSession));
                                } catch (e) { }
                                const coinsValEl = document.getElementById('market-user-coins-val');
                                if (coinsValEl) coinsValEl.textContent = freshCoins.toLocaleString();
                                if (typeof renderMarket === 'function') renderMarket();
                                if (typeof renderMarketCartItems === 'function') renderMarketCartItems();
                                if (typeof renderCustomerOrders === 'function') renderCustomerOrders();
                            }
                        }
                    }
                }
            });
        } catch (e) { }
    }
}

var notificationListeners = {};

function startGlobalNotificationListeners(email) {
    if (!email) return;
    const sanitizedEmail = email.toLowerCase().replace(/\./g, ',');
    const isSuperAdmin = email.toLowerCase() === 'kinan.rahal@hotmail.com';

    // Clear any existing listeners first
    Object.keys(notificationListeners).forEach(companyId => {
        if (notificationListeners[companyId]) {
            notificationListeners[companyId].off();
        }
    });
    notificationListeners = {};

    const companiesToListen = ['burgeroov', 'mvc', 'mvcfresh'];

    companiesToListen.forEach(companyId => {
        const adminsRef = db.ref(`companies/${companyId}/admins`);
        const workersRef = db.ref(`companies/${companyId}/workers`);

        Promise.all([
            adminsRef.once('value').catch(() => null),
            workersRef.once('value').catch(() => null)
        ]).then(([adminsSnap, workersSnap]) => {
            let isAdmin = isSuperAdmin;
            let myWorkerData = null;
            let workerIndex = -1;

            if (!isAdmin && adminsSnap && adminsSnap.exists()) {
                let adminsVal = adminsSnap.val() || {};
                if (Array.isArray(adminsVal)) {
                    adminsVal.forEach(e => {
                        if (e && e.toLowerCase().replace(/\./g, ',') === sanitizedEmail) isAdmin = true;
                    });
                } else {
                    if (adminsVal[sanitizedEmail] === true) isAdmin = true;
                }
            }

            if (workersSnap && workersSnap.exists()) {
                const workersVal = parseWorkersSnap(workersSnap);
                workerIndex = workersVal.findIndex(w => w && w.email && w.email.toLowerCase() === email.toLowerCase());
                if (workerIndex !== -1) {
                    myWorkerData = workersVal[workerIndex];
                }
            }

            // Only listen if user is admin or worker in this company
            if (isAdmin || myWorkerData) {
                let prevTaskIds = myWorkerData && myWorkerData.jobs ? myWorkerData.jobs.map(j => j.id) : [];
                let prevOrderStartTime = myWorkerData && myWorkerData.activeOrder ? myWorkerData.activeOrder.startTime : null;
                let prevViolationsCount = myWorkerData && myWorkerData.systemViolations ? myWorkerData.systemViolations.length : 0;
                let prevPaymentReqStatuses = {};
                let prevCustodyReqStatuses = {};
                let prevGeneralDeliveries = {};

                // Get initial general deliveries
                db.ref(`companies/${companyId}/generalDeliveries`).once('value').then(snap => {
                    if (snap.exists()) {
                        prevGeneralDeliveries = snap.val() || {};
                    }
                }).catch(() => { });

                // Get initial payment requests
                db.ref(`companies/${companyId}/paymentRequests`).once('value').then(snap => {
                    if (snap.exists()) {
                        const reqs = snap.val() || {};
                        Object.keys(reqs).forEach(id => {
                            prevPaymentReqStatuses[id] = reqs[id].status;
                        });
                    }
                }).catch(() => { });

                // Get initial custody requests
                db.ref(`companies/${companyId}/custodyRequests`).once('value').then(snap => {
                    if (snap.exists()) {
                        const reqs = snap.val() || {};
                        Object.keys(reqs).forEach(id => {
                            prevCustodyReqStatuses[id] = reqs[id].status;
                        });
                    }
                }).catch(() => { });

                const listener = db.ref(`companies/${companyId}`);
                notificationListeners[companyId] = listener;

                let isFirstTrigger = true;

                listener.on('value', snapshot => {
                    if (!snapshot.exists()) return;
                    const companyData = snapshot.val();
                    const isAr = currentAppLang === 'ar';
                    const compName = companyId === 'burgeroov' ? 'Burgeroov' : (companyId === 'mvc' ? 'MVC FRESH' : 'MVC Fresh');

                    let updatedWorker = null;
                    if (companyData.workers) {
                        const workersArr = Array.isArray(companyData.workers) ? companyData.workers : Object.values(companyData.workers);
                        updatedWorker = workersArr.find(w => w && w.email && w.email.toLowerCase() === email.toLowerCase());
                    }

                    if (isFirstTrigger) {
                        isFirstTrigger = false;
                        if (updatedWorker) {
                            prevTaskIds = updatedWorker.jobs ? updatedWorker.jobs.map(j => j.id) : [];
                            prevOrderStartTime = updatedWorker.activeOrder ? updatedWorker.activeOrder.startTime : null;
                            prevViolationsCount = updatedWorker.systemViolations ? updatedWorker.systemViolations.length : 0;
                        }
                        const pRequests = companyData.paymentRequests || {};
                        Object.keys(pRequests).forEach(id => {
                            prevPaymentReqStatuses[id] = pRequests[id].status;
                        });
                        const cRequests = companyData.custodyRequests || {};
                        Object.keys(cRequests).forEach(id => {
                            prevCustodyReqStatuses[id] = cRequests[id].status;
                        });
                        prevGeneralDeliveries = companyData.generalDeliveries || {};
                        return;
                    }

                    // --- WORKER NOTIFICATIONS ---
                    if (updatedWorker) {
                        // 1. Task Check
                        if (updatedWorker.jobs) {
                            const currentTaskIds = updatedWorker.jobs.map(j => j.id);
                            const newTasks = currentTaskIds.filter(id => !prevTaskIds.includes(id));
                            if (newTasks.length > 0) {
                                const msg = isAr
                                    ? `📋 مهمة جديدة مسندة إليك في ${compName}`
                                    : `📋 New task assigned to you in ${compName}!`;
                                showInAppNotification(msg);
                            }
                            prevTaskIds = currentTaskIds;
                        }

                        // 2. Direct Delivery Order Check
                        const currentOrderStart = updatedWorker.activeOrder ? updatedWorker.activeOrder.startTime : null;
                        if (currentOrderStart && currentOrderStart !== prevOrderStartTime) {
                            const msg = isAr
                                ? `🛵 طلب توصيل جديد مسند إليك في ${compName}`
                                : `🛵 New delivery order assigned to you in ${compName}!`;
                            showInAppNotification(msg);
                        }
                        prevOrderStartTime = currentOrderStart;

                        // 3. System Violations Check
                        const currentViolCount = updatedWorker.systemViolations ? updatedWorker.systemViolations.length : 0;
                        if (currentViolCount > prevViolationsCount) {
                            const latestViol = updatedWorker.systemViolations[updatedWorker.systemViolations.length - 1];
                            const msg = isAr
                                ? `⚠️ مخالفة جديدة مسجلة ضدك في ${compName}: ${latestViol.reason || ''}`
                                : `⚠️ New violation recorded in ${compName}: ${latestViol.reason || ''}`;
                            showInAppNotification(msg);
                        }
                        prevViolationsCount = currentViolCount;

                        // 4. Payment Request Status Check for Worker
                        const pRequests = companyData.paymentRequests || {};
                        Object.values(pRequests).forEach(req => {
                            if (req.workerId === updatedWorker.id) {
                                const prevStatus = prevPaymentReqStatuses[req.id];
                                if (prevStatus && req.status !== prevStatus) {
                                    let msg = '';
                                    if (req.status === 'accepted') {
                                        msg = isAr
                                            ? `✅ تم قبول طلب الدفع في ${compName}! الكود: ${req.code}`
                                            : `✅ Payment request approved in ${compName}! Code: ${req.code}`;
                                    } else if (req.status === 'rejected') {
                                        msg = isAr
                                            ? `❌ تم رفض طلب الدفع في ${compName}`
                                            : `❌ Payment request rejected in ${compName}`;
                                    } else if (req.status === 'given') {
                                        msg = isAr
                                            ? `💰 تم تسليم الدفعة بقيمة ${req.amount} ريال بنجاح في ${compName}`
                                            : `💰 Payment of SAR ${req.amount} given successfully in ${compName}!`;
                                    }
                                    if (msg) showInAppNotification(msg);
                                }
                                prevPaymentReqStatuses[req.id] = req.status;
                            }
                        });

                        // 5. Custody Request Status Check for Worker
                        const cRequests = companyData.custodyRequests || {};
                        Object.values(cRequests).forEach(req => {
                            if (req.workerId === updatedWorker.id) {
                                const prevStatus = prevCustodyReqStatuses[req.id];
                                if (prevStatus && req.status !== prevStatus) {
                                    let msg = '';
                                    if (req.status === 'accepted') {
                                        msg = isAr
                                            ? `📦 تم قبول طلب العهدة في ${compName}! الكود: ${req.code}`
                                            : `📦 Custody request approved in ${compName}! Code: ${req.code}`;
                                    } else if (req.status === 'rejected') {
                                        msg = isAr
                                            ? `❌ تم رفض طلب العهدة في ${compName}`
                                            : `❌ Custody request rejected in ${compName}`;
                                    } else if (req.status === 'given') {
                                        msg = isAr
                                            ? `📦 تم تسليم العهدة بقيمة ${req.amount} ريال بنجاح في ${compName}`
                                            : `📦 Custody of SAR ${req.amount} given successfully in ${compName}!`;
                                    }
                                    if (msg) showInAppNotification(msg);
                                }
                                prevCustodyReqStatuses[req.id] = req.status;
                            }
                        });
                    }

                    // --- DRIVER POOL NOTIFICATIONS (For any worker who is a Driver) ---
                    const isDriver = updatedWorker && ((updatedWorker.role || '').toLowerCase().includes('driver') || (updatedWorker.role || '').toLowerCase().includes('سائق') || (updatedWorker.role || '').toLowerCase().includes('delivery'));
                    if (isDriver) {
                        const pool = companyData.generalDeliveries || {};
                        Object.keys(pool).forEach(orderId => {
                            const order = pool[orderId];
                            if (!prevGeneralDeliveries[orderId]) {
                                const msg = isAr
                                    ? `📦 طلب عام جديد #${order.orderNum || ''} متاح في ${compName}!`
                                    : `📦 New general order #${order.orderNum || ''} available in ${compName}!`;
                                showInAppNotification(msg);
                            } else {
                                const prevOrder = prevGeneralDeliveries[orderId];
                                if (order.status !== prevOrder.status) {
                                    if (order.status === 'ready') {
                                        const msg = isAr
                                            ? `🟢 طلب عام #${order.orderNum || ''} جاهز للاستلام في ${compName}!`
                                            : `🟢 General order #${order.orderNum || ''} is ready in ${compName}!`;
                                        showInAppNotification(msg);
                                    }
                                }
                            }
                        });
                        prevGeneralDeliveries = pool;
                    }

                    // --- ADMIN NOTIFICATIONS ---
                    if (isAdmin) {
                        const pRequests = companyData.paymentRequests || {};
                        Object.values(pRequests).forEach(req => {
                            const prevStatus = prevPaymentReqStatuses[req.id];
                            if (!prevStatus && req.status === 'pending') {
                                const wName = req.workerName || 'Employee';
                                const msg = isAr
                                    ? `💰 طلب دفع جديد معلق من ${wName} في ${compName}`
                                    : `💰 New pending payment request from ${wName} in ${compName}!`;
                                showInAppNotification(msg);
                            }
                            prevPaymentReqStatuses[req.id] = req.status;
                        });
                    }
                });
            }
        });
    });
}

// =============================================
// END FEATURE 1 HELPERS
// =============================================

function _cfgSecret(str) {
    try {
        return atob(str);
    } catch (e) {
        return '';
    }
}

// --- 1. FIREBASE CONFIGURATION ---
var firebaseConfig = {
    apiKey: _cfgSecret("QUl6YVN5QlVKSGVTT0N2RGVKYXVEdWZIaU52bG1sRjlkd1poYmF3"),
    authDomain: "burgeroov-portal.firebaseapp.com",
    databaseURL: "https://burgeroov-portal-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "burgeroov-portal",
    storageBucket: "burgeroov-portal.firebasestorage.app",
    messagingSenderId: "488288106586",
    appId: "1:488288106586:web:7337244c0b046409330063"
};

firebase.initializeApp(firebaseConfig);
var auth = firebase.auth();
var db = firebase.database();
initPublicCustomerSync();

// =============================================
// AUTOMATIC APK VERSION CHECKER & FORCED UPDATE
// =============================================
window.LATEST_RELEASE_APK_VERSION = 'v1.0.1'; // The newly uploaded APK version

function getNativeBridgeVersion() {
    const bridge = window.AndroidInterface || window.Android || window.AndroidShare;
    if (bridge) {
        if (typeof bridge.getAppVersion === 'function') {
            try { const v = bridge.getAppVersion(); if (v) return v; } catch (e) { }
        }
        if (typeof bridge.getVersionCode === 'function') {
            try { const v = bridge.getVersionCode(); if (v) return 'v' + v; } catch (e) { }
        }
        if (typeof bridge.getVersion === 'function') {
            try { const v = bridge.getVersion(); if (v) return v; } catch (e) { }
        }
    }
    return null;
}

function getStoredApkVersion() {
    try {
        return localStorage.getItem('burgeroov_installed_apk_version');
    } catch (e) {
        return null;
    }
}

function onDownloadApkClicked() {
    const latestVer = window.LATEST_RELEASE_APK_VERSION || 'v1.0.1';
    try {
        localStorage.setItem('burgeroov_installed_apk_version', latestVer);
    } catch (e) { }

    const modal = document.getElementById('modal-force-update-apk');
    if (modal) {
        setTimeout(() => {
            modal.style.display = 'none';
        }, 1500);
    }
}
window.onDownloadApkClicked = onDownloadApkClicked;

function dismissForceUpdateModal() {
    const latestVer = window.LATEST_RELEASE_APK_VERSION || 'v1.0.1';
    try {
        localStorage.setItem('burgeroov_installed_apk_version', latestVer);
    } catch (e) { }

    const modal = document.getElementById('modal-force-update-apk');
    if (modal) {
        modal.style.display = 'none';
    }
}
window.dismissForceUpdateModal = dismissForceUpdateModal;

function initAppVersionChecker() {
    if (typeof firebase === 'undefined' || !firebase.database) return;
    const isMobileOrAndroid = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || 
                              window.AndroidInterface || window.Android || window.AndroidShare;
    
    const updateRef = firebase.database().ref('system_config/app_update');
    updateRef.on('value', (snap) => {
        const data = snap.val();
        const targetNotesBilingual = [
            { ar: 'إصلاح الأخطاء البرمجية', en: 'Fix bugs & stability' },
            { ar: 'تحسين وتطوير طباعة PDF وفواتير الطلبات', en: 'Improve the PDF printing and receipt printing' },
            { ar: 'إضافة أقسام وميزات جديدة والمزيد', en: 'Add new sections and more' }
        ];
        const targetNotesAr = '• إصلاح الأخطاء البرمجية (Fix bugs & stability)\n• تحسين وتطوير طباعة PDF وفواتير الطلبات (Improve PDF & receipt printing)\n• إضافة أقسام وميزات جديدة والمزيد (Add new sections and more)';

        if (!data) {
            // Seed initial update config in Firebase
            updateRef.set({
                latest_version: window.LATEST_RELEASE_APK_VERSION || 'v1.0.1',
                is_forced: true,
                apk_url: './app-release.apk',
                notes_ar: targetNotesAr,
                notes_bilingual: targetNotesBilingual,
                updated_at: new Date().toISOString()
            });
            return;
        }

        // If Firebase has old notes or missing bilingual notes, sync the new notes automatically
        if (!data.notes_bilingual || data.notes_ar !== targetNotesAr) {
            updateRef.update({
                notes_ar: targetNotesAr,
                notes_bilingual: targetNotesBilingual,
                latest_version: window.LATEST_RELEASE_APK_VERSION || 'v1.0.1',
                apk_url: './app-release.apk'
            }).catch(() => {});
        }

        const latestVer = data.latest_version || window.LATEST_RELEASE_APK_VERSION || 'v1.0.1';
        const isForced = data.is_forced !== false;

        const nativeVer = getNativeBridgeVersion();
        const storedVer = getStoredApkVersion();
        const currentVer = nativeVer || storedVer || 'v1.0.0';

        // If mobile / APK user has an older version than latest_version
        if (isMobileOrAndroid && isForced && compareAppVersions(currentVer, latestVer) < 0) {
            triggerForceUpdatePopup(data);
        } else {
            const modal = document.getElementById('modal-force-update-apk');
            if (modal) modal.style.display = 'none';
        }
    });
}

function syncAppUpdateNotesToFirebase() {
    if (typeof firebase === 'undefined' || !firebase.database) return;
    const updateRef = firebase.database().ref('system_config/app_update');
    const targetNotesBilingual = [
        { ar: 'إصلاح الأخطاء البرمجية', en: 'Fix bugs & stability' },
        { ar: 'تحسين وتطوير طباعة PDF وفواتير الطلبات', en: 'Improve the PDF printing and receipt printing' },
        { ar: 'إضافة أقسام وميزات جديدة والمزيد', en: 'Add new sections and more' }
    ];
    const targetNotesAr = '• إصلاح الأخطاء البرمجية (Fix bugs & stability)\n• تحسين وتطوير طباعة PDF وفواتير الطلبات (Improve PDF & receipt printing)\n• إضافة أقسام وميزات جديدة والمزيد (Add new sections and more)';

    updateRef.update({
        notes_ar: targetNotesAr,
        notes_bilingual: targetNotesBilingual,
        latest_version: window.LATEST_RELEASE_APK_VERSION || 'v1.0.1',
        is_forced: true,
        apk_url: './app-release.apk',
        updated_at: new Date().toISOString()
    }).catch(e => console.warn('syncAppUpdateNotesToFirebase notice:', e));
}
window.syncAppUpdateNotesToFirebase = syncAppUpdateNotesToFirebase;

function compareAppVersions(v1, v2) {
    if (!v1) return -1;
    if (!v2) return 0;
    const clean1 = v1.replace(/^v/i, '').split('.').map(n => parseInt(n) || 0);
    const clean2 = v2.replace(/^v/i, '').split('.').map(n => parseInt(n) || 0);
    for (let i = 0; i < Math.max(clean1.length, clean2.length); i++) {
        const a = clean1[i] || 0;
        const b = clean2[i] || 0;
        if (a < b) return -1;
        if (a > b) return 1;
    }
    return 0;
}

function triggerForceUpdatePopup(config) {
    const modal = document.getElementById('modal-force-update-apk');
    const verTag = document.getElementById('force-update-ver-tag');
    const notesText = document.getElementById('force-update-notes-text');
    const dlBtn = document.getElementById('force-update-download-btn');
    if (!modal) return;

    if (verTag && config.latest_version) verTag.textContent = config.latest_version;
    if (notesText) {
        if (config.notes_bilingual && Array.isArray(config.notes_bilingual)) {
            notesText.innerHTML = config.notes_bilingual.map(item => `
                <div style="margin-bottom: 6px;">
                    🔹 <strong>${item.ar}</strong><br>
                    <span style="color: #94a3b8; font-size: 0.8rem; padding-inline-start: 16px; display: inline-block;">• ${item.en}</span>
                </div>
            `).join('');
        } else if (config.notes_ar) {
            notesText.innerHTML = config.notes_ar.split('\n').map(l => `<div>${l}</div>`).join('');
        }
    }
    if (dlBtn && config.apk_url) {
        dlBtn.href = config.apk_url;
    }

    modal.style.display = 'flex';
}
window.initAppVersionChecker = initAppVersionChecker;
window.triggerForceUpdatePopup = triggerForceUpdatePopup;
initAppVersionChecker();

// --- Auth UI Helpers ---
function togglePassword() {
    const pwdInput = document.getElementById('auth-password');
    const toggleBtn = document.getElementById('auth-password-toggle');
    if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        if (toggleBtn) toggleBtn.textContent = '🙈';
    } else {
        pwdInput.type = 'password';
        if (toggleBtn) toggleBtn.textContent = '👁️';
    }
}

function toggleConfirmPassword() {
    const pwdInput = document.getElementById('auth-confirm-password');
    const toggleBtn = document.getElementById('auth-confirm-password-toggle');
    if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        if (toggleBtn) toggleBtn.textContent = '🙈';
    } else {
        pwdInput.type = 'password';
        if (toggleBtn) toggleBtn.textContent = '👁️';
    }
}

function resetPassword() {
    const email = document.getElementById('auth-email').value.trim();
    const errorMsg = document.getElementById('auth-error-msg');
    if (!email) {
        errorMsg.textContent = "Please type your email address first to reset password.";
        errorMsg.style.display = 'block';
        return;
    }
    auth.sendPasswordResetEmail(email)
        .then(() => {
            errorMsg.style.color = "var(--success)";
            errorMsg.textContent = "Password reset email sent! Check your inbox.";
            errorMsg.style.display = 'block';
        })
        .catch(error => {
            errorMsg.style.color = "var(--danger)";
            errorMsg.textContent = error.message;
            errorMsg.style.display = 'block';
        });
}

// --- DISPLAY TODAY'S DATE ---
function setTodayDisplay() {
    const todayDateDisplay = document.getElementById('today-date-display');
    if (todayDateDisplay) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        todayDateDisplay.textContent = "(Today: " + new Date().toLocaleDateString('en-US', options) + ")";
    }
}

// --- DARK MODE LOGIC ---
var isDarkMode = localStorage.getItem('darkMode') === 'true';
function applyDarkMode() {
    const btn = document.getElementById('dark-mode-btn');
    const btnMob = document.getElementById('dark-mode-btn-mob');

    let lightText = '☀️ Light Mode';
    let darkText = '🌙 Dark Mode';

    // Read directly from localStorage to avoid TDZ ReferenceErrors on late-declared variables
    const currentLang = localStorage.getItem("burgeroov_lang") || "en";
    if (currentLang === 'ar') {
        lightText = '☀️ الوضع النهاري';
        darkText = '🌙 الوضع الليلي';
    }

    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        if (btn) btn.textContent = lightText;
        if (btnMob) btnMob.textContent = lightText;
    } else {
        document.body.classList.remove('dark-mode');
        if (btn) btn.textContent = darkText;
        if (btnMob) btnMob.textContent = darkText;
    }
}
function toggleDarkMode(event) {
    if (event) event.stopPropagation();
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    applyDarkMode();
}
applyDarkMode();

function parseAdminsSnap(snap) {
    if (!snap || typeof snap.val !== 'function') return {};
    const val = snap.val();
    if (!val) return {};
    if (Array.isArray(val)) {
        const map = {};
        val.forEach(e => { if (e) map[String(e).toLowerCase().replace(/\./g, ',')] = true; });
        return map;
    }
    if (typeof val === 'object') return val;
    return {};
}

function parseWorkersSnap(snap) {
    if (!snap || typeof snap.val !== 'function') return [];
    const val = snap.val();
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(w => w && typeof w === 'object');
    if (typeof val === 'object') return Object.values(val).filter(w => w && typeof w === 'object');
    return [];
}

// --- CORE STATE & DATA ---
var currentCompany = 'burgeroov';
var appData = {
    burgeroov: { branches: ['Main Branch'], workers: [], violationRules: [], jobCatalog: [], warehouse: [], admins: { "kinan,rahal@hotmail,com": true } },
    mvc: { branches: ['Main Branch'], workers: [], violationRules: [], jobCatalog: [], warehouse: [], admins: { "kinan,rahal@hotmail,com": true } },
    mvcfresh: { branches: ['Main Branch'], workers: [], violationRules: [], jobCatalog: [], warehouse: [], admins: { "kinan,rahal@hotmail,com": true } }
};
var today = new Date();
var currentGlobalMonth = today.toISOString().slice(0, 7);
var currentTab = 'ops';
var globalInterval = null;
var activeDriverId = null;
var currentUser = null;
var isInitialLoad = true;

try {
    const savedCust = localStorage.getItem('mvc_customer_session');
    if (savedCust) {
        currentCustomerSession = JSON.parse(savedCust);
        if (currentCustomerSession && currentCustomerSession.company) {
            currentCompany = currentCustomerSession.company;
        }
    }
} catch (e) { }

// FEATURE 1: Task tracking state — tracks previously seen task IDs for the current worker
var previousTaskIds = [];

function getCompanyData() {
    if (typeof currentCustomerSession !== 'undefined' && currentCustomerSession && currentCustomerSession.company) {
        currentCompany = currentCustomerSession.company;
    }
    if (!appData[currentCompany]) {
        appData[currentCompany] = { admins: { "kinan,rahal@hotmail,com": true }, branches: ['Main Branch'], workers: [], violationRules: [], jobCatalog: [], warehouse: [] };
    }
    return appData[currentCompany];
}

function showCompanySelectionHUD(event) {
    if (event) event.stopPropagation();
    const launchLoader = document.getElementById('launch-loader-overlay');
    if (launchLoader) launchLoader.style.display = 'none';
    if (typeof hideUnassignedOverlay === 'function') hideUnassignedOverlay();

    const cardBurgeroov = document.querySelector('.burgeroov-card');
    const cardMvc = document.querySelector('.mvc-card');
    const cardMvcFresh = document.querySelector('.mvcfresh-card');

    if (currentUser && currentUser.email === 'kinan.rahal@hotmail.com') {
        if (cardBurgeroov) cardBurgeroov.style.display = 'block';
        if (cardMvc) cardMvc.style.display = 'block';
        if (cardMvcFresh) cardMvcFresh.style.display = 'block';
    } else if (window.userActiveCompanies && Array.isArray(window.userActiveCompanies)) {
        if (cardBurgeroov) cardBurgeroov.style.display = window.userActiveCompanies.includes('burgeroov') ? 'block' : 'none';
        if (cardMvc) cardMvc.style.display = window.userActiveCompanies.includes('mvc') ? 'block' : 'none';
        if (cardMvcFresh) cardMvcFresh.style.display = window.userActiveCompanies.includes('mvcfresh') ? 'block' : 'none';
    }

    document.getElementById('company-selection-overlay').style.display = 'flex';
    document.getElementById('app-wrapper').style.display = 'none';
}

function findMatchingWorker(workersList, userEmail, targetWorkerId) {
    if (!workersList || !Array.isArray(workersList) || workersList.length === 0) return null;
    if (!userEmail) return null;

    const cleanEmail = String(userEmail).trim().toLowerCase();
    const emailKey = cleanEmail.replace(/\./g, ',');

    // 0. Match by explicit targetWorkerId or cached worker ID
    let knownId = targetWorkerId || (typeof localStorage !== 'undefined' ? localStorage.getItem('mvc_worker_id_' + emailKey) : null);
    if (knownId) {
        let matched = workersList.find(w => w && String(w.id) === String(knownId));
        if (matched) {
            matched.email = cleanEmail;
            matched.email_key = emailKey;
            return matched;
        }
    }

    // 1. Direct email match (trimmed, case-insensitive)
    let matched = workersList.find(w => w && w.email && String(w.email).trim().toLowerCase() === cleanEmail);
    if (matched) {
        if (!matched.email_key) matched.email_key = emailKey;
        return matched;
    }

    // 2. Email key match
    matched = workersList.find(w => w && (
        (w.email_key && w.email_key === emailKey) ||
        (w.email && String(w.email).trim().toLowerCase().replace(/\./g, ',') === emailKey)
    ));
    if (matched) {
        matched.email = cleanEmail;
        return matched;
    }

    // 3. Worker Credentials / Password mapping check
    if (typeof appData !== 'undefined') {
        const companyKeys = ['burgeroov', 'mvc', 'mvcfresh', (typeof currentCompany !== 'undefined' ? currentCompany : '')].filter(Boolean);
        for (const cKey of companyKeys) {
            const data = appData[cKey];
            if (data && data.workerPasswords && data.workerPasswords[emailKey]) {
                const mappedId = data.workerPasswords[emailKey].workerId;
                if (mappedId) {
                    matched = workersList.find(w => w && String(w.id) === String(mappedId));
                    if (matched) {
                        matched.email = cleanEmail;
                        matched.email_key = emailKey;
                        return matched;
                    }
                }
            }
        }
    }

    // 4. Fallback match by password if available
    if (typeof window !== 'undefined' && window.lastAttemptedLoginPassword) {
        matched = workersList.find(w => w && (w.password === window.lastAttemptedLoginPassword || w.oldPassword === window.lastAttemptedLoginPassword));
        if (matched) {
            matched.email = cleanEmail;
            matched.email_key = emailKey;
            return matched;
        }
    }

    // 5. Fallback match if user email username matches worker name (e.g., sinan.rahal -> Sinan)
    const namePart = cleanEmail.split('@')[0].split('.')[0];
    if (namePart && namePart.length > 2) {
        matched = workersList.find(w => w && w.name && w.name.toLowerCase().includes(namePart));
        if (matched) {
            matched.email = cleanEmail;
            matched.email_key = emailKey;
            return matched;
        }
    }

    return null;
}
window.findMatchingWorker = findMatchingWorker;

function selectCompany(companyId) {
    currentCompany = companyId;
    localStorage.setItem('selected_company', companyId);

    const launchLoader = document.getElementById('launch-loader-overlay');
    if (launchLoader) launchLoader.style.display = 'none';

    const hudOverlay = document.getElementById('company-selection-overlay');
    if (hudOverlay) hudOverlay.style.display = 'none';

    const authOverlay = document.getElementById('auth-overlay');
    if (authOverlay) authOverlay.style.display = 'none';

    if (typeof hideUnassignedOverlay === 'function') {
        hideUnassignedOverlay();
    }

    document.body.classList.remove('theme-burgeroov', 'theme-mvc', 'theme-mvcfresh');
    document.body.classList.add('theme-' + companyId);

    // Lock all tabs by default initially until database connection verifies permissions
    document.body.classList.remove('role-admin', 'role-worker', 'perm-warehouse', 'perm-drivers', 'perm-finance', 'perm-sales', 'perm-costs', 'perm-adverts', 'perm-attendance', 'perm-tasks', 'is-driver');
    if (typeof markLockedTabs === 'function') {
        markLockedTabs();
    }

    let logoSrc = 'burgeroov.png';
    if (typeof currentCustomerSession !== 'undefined' && currentCustomerSession) {
        logoSrc = 'mvc.png';
    } else if (companyId === 'mvc') logoSrc = 'mvc.png';
    else if (companyId === 'mvcfresh') logoSrc = 'mvcfresh.png';

    const headerLogo = document.getElementById('header-logo');
    if (headerLogo) headerLogo.src = logoSrc;
    const authLogo = document.getElementById('auth-logo');
    if (authLogo) authLogo.src = logoSrc;
    const loaderLogo = document.getElementById('launch-loader-logo');
    if (loaderLogo) loaderLogo.src = logoSrc;

    applyTranslations();

    document.getElementById('app-wrapper').style.display = 'block';

    isInitialLoad = true;

    setTodayDisplay();
    document.getElementById('global-month').value = currentGlobalMonth;
    setDatePickerLimits();

    // Fetch credentials to pre-register UID to prevent database connection error (permission denied)
    if (currentUser && currentUser.uid) {
        const email = currentUser.email.toLowerCase();

        Promise.all([
            db.ref(`companies/${companyId}/admins`).once('value').catch(() => null),
            db.ref(`companies/${companyId}/workers`).once('value').catch(() => null)
        ]).then(([adminsSnap, workersSnap]) => {
            const admins = parseAdminsSnap(adminsSnap);
            const workers = parseWorkersSnap(workersSnap);

            const sanitizedEmail = email.replace(/\./g, ',');
            const isCompanyAdmin = email === 'kinan.rahal@hotmail.com' || admins[sanitizedEmail] !== undefined;
            const worker = workers.find(w => w.email && w.email.toLowerCase() === email);

            if (email === 'kinan.rahal@hotmail.com') {
                return db.ref(`companies/${companyId}/users_by_uid/${currentUser.uid}`).set({
                    email: email,
                    role: 'super_admin'
                });
            } else if (isCompanyAdmin) {
                return db.ref(`companies/${companyId}/users_by_uid/${currentUser.uid}`).set({
                    email: email,
                    role: 'admin',
                    email_key: sanitizedEmail
                });
            } else if (worker) {
                const workerIndex = workers.findIndex(w => w.id === worker.id);
                if (workerIndex !== -1) {
                    return db.ref(`companies/${companyId}/users_by_uid/${currentUser.uid}`).set({
                        email: email,
                        email_key: sanitizedEmail,
                        role: 'worker',
                        workerId: worker.id,
                        index: workerIndex,
                        permissions: worker.permissions || null
                    });
                }
            }
        }).catch(err => {
            console.warn("UID pre-registration skipped or failed:", err);
        }).then(() => {
            // Once UID mapping is registered, we can safely attach listener without permission denied errors
            listenToCloudData();
            startGlobalTick();
            initFCMToken();
            if (typeof startWorkerLocationBroadcaster === 'function') startWorkerLocationBroadcaster();
            if (typeof initGlobalLiveLocationListener === 'function') initGlobalLiveLocationListener();
            if (typeof zoomToActiveCompanyWorkZone === 'function') zoomToActiveCompanyWorkZone();
        });
    } else {
        listenToCloudData();
        startGlobalTick();
        initFCMToken();
        if (typeof startWorkerLocationBroadcaster === 'function') startWorkerLocationBroadcaster();
        if (typeof initGlobalLiveLocationListener === 'function') initGlobalLiveLocationListener();
        if (typeof zoomToActiveCompanyWorkZone === 'function') zoomToActiveCompanyWorkZone();
    }
}

window.selectCompany = selectCompany;
window.showCompanySelectionHUD = showCompanySelectionHUD;

// --- AUTHENTICATION SYSTEM ---
authMode = authMode || 'login';

auth.onAuthStateChanged((user) => {
    const overlay = document.getElementById('auth-overlay');
    const appWrapper = document.getElementById('app-wrapper');
    const launchLoader = document.getElementById('launch-loader-overlay');

    if (launchLoader) launchLoader.style.display = 'none';

    if (user) {
        currentCustomerSession = null;
        try {
            localStorage.removeItem('mvc_customer_session');
            localStorage.removeItem('mvc_customer_code');
        } catch (e) { }
        currentUser = { email: user.email, uid: user.uid };
        document.getElementById('display-user-email').textContent = currentUser.email;
        startGlobalNotificationListeners(user.email);
        if (typeof startWorkerLocationBroadcaster === 'function') {
            startWorkerLocationBroadcaster();
        }
        try { syncAppUpdateNotesToFirebase(); } catch (e) { }

        document.getElementById('auth-loader').style.display = 'block';
        document.getElementById('auth-btn').style.display = 'none';

        const email = user.email.toLowerCase();

        if (email === 'kinan.rahal@hotmail.com') {
            document.getElementById('auth-loader').style.display = 'none';
            document.getElementById('auth-btn').style.display = 'block';
            overlay.style.display = 'none';

            // Show all cards in selection overlay for super admin
            const cardBurgeroov = document.querySelector('.burgeroov-card');
            const cardMvc = document.querySelector('.mvc-card');
            const cardMvcFresh = document.querySelector('.mvcfresh-card');
            if (cardBurgeroov) cardBurgeroov.style.display = 'block';
            if (cardMvc) cardMvc.style.display = 'block';
            if (cardMvcFresh) cardMvcFresh.style.display = 'block';

            const urlParams = new URLSearchParams(window.location.search);
            const queryCompany = urlParams.get('companyId');
            const queryTab = urlParams.get('tab');

            if (queryCompany && (queryCompany === 'burgeroov' || queryCompany === 'mvc' || queryCompany === 'mvcfresh')) {
                selectCompany(queryCompany);
                if (queryTab) {
                    setTimeout(() => {
                        switchTab(queryTab);
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }, 500);
                } else {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            } else {
                const savedCompany = localStorage.getItem('selected_company');
                if (savedCompany && (savedCompany === 'burgeroov' || savedCompany === 'mvc' || savedCompany === 'mvcfresh')) {
                    selectCompany(savedCompany);
                } else {
                    showCompanySelectionHUD();
                }
            }
        } else {
            // Check databases for worker membership
            const sanitizedEmail = email.replace(/\./g, ',');
            Promise.all([
                db.ref('companies/burgeroov/admins').once('value').catch(() => null),
                db.ref('companies/burgeroov/workers').once('value').catch(() => null),
                db.ref('companies/mvc/admins').once('value').catch(() => null),
                db.ref('companies/mvc/workers').once('value').catch(() => null),
                db.ref('companies/mvcfresh/admins').once('value').catch(() => null),
                db.ref('companies/mvcfresh/workers').once('value').catch(() => null),
                db.ref(`customerCodes/workerPasswords/${sanitizedEmail}`).once('value').catch(() => null),
                db.ref(`customerCodes/workerAccess/${sanitizedEmail}`).once('value').catch(() => null)
            ]).then(([bgAdmins, bgWorkers, mvcAdmins, mvcWorkers, freshAdmins, freshWorkers, pwdSnap, accessSnap]) => {
                document.getElementById('auth-loader').style.display = 'none';
                document.getElementById('auth-btn').style.display = 'block';

                const burgeroovAdmins = parseAdminsSnap(bgAdmins);
                const burgeroovWorkers = parseWorkersSnap(bgWorkers);

                const mvcAdminsList = parseAdminsSnap(mvcAdmins);
                const mvcWorkersList = parseWorkersSnap(mvcWorkers);

                const mvcfreshAdminsList = parseAdminsSnap(freshAdmins);
                const mvcfreshWorkersList = parseWorkersSnap(freshWorkers);

                let targetWorkerId = null;
                if (pwdSnap && pwdSnap.exists() && pwdSnap.val()) {
                    const pwdVal = pwdSnap.val();
                    if (pwdVal.workerId) {
                        targetWorkerId = pwdVal.workerId;
                        try { localStorage.setItem('mvc_worker_id_' + sanitizedEmail, targetWorkerId); } catch (e) { }
                    }
                }
                if (!targetWorkerId && typeof localStorage !== 'undefined') {
                    targetWorkerId = localStorage.getItem('mvc_worker_id_' + sanitizedEmail);
                }

                let inBurgeroov = burgeroovAdmins[sanitizedEmail] === true ||
                    (typeof findMatchingWorker === 'function' ? !!findMatchingWorker(burgeroovWorkers, email, targetWorkerId) : burgeroovWorkers.some(w => w && w.email && w.email.toLowerCase() === email));

                let inMvc = mvcAdminsList[sanitizedEmail] === true ||
                    (typeof findMatchingWorker === 'function' ? !!findMatchingWorker(mvcWorkersList, email, targetWorkerId) : mvcWorkersList.some(w => w && w.email && w.email.toLowerCase() === email));

                let inMvcFresh = mvcfreshAdminsList[sanitizedEmail] === true ||
                    (typeof findMatchingWorker === 'function' ? !!findMatchingWorker(mvcfreshWorkersList, email, targetWorkerId) : mvcfreshWorkersList.some(w => w && w.email && w.email.toLowerCase() === email));

                if (accessSnap && accessSnap.exists() && accessSnap.val()) {
                    const acc = accessSnap.val();
                    if (acc.burgeroov === true) inBurgeroov = true;
                    if (acc.mvc === true) inMvc = true;
                    if (acc.mvcfresh === true) inMvcFresh = true;
                }

                if (pwdSnap && pwdSnap.exists() && pwdSnap.val() && pwdSnap.val().company) {
                    const assignedComp = pwdSnap.val().company;
                    if (assignedComp === 'burgeroov') inBurgeroov = true;
                    if (assignedComp === 'mvc') inMvc = true;
                    if (assignedComp === 'mvcfresh') inMvcFresh = true;
                }

                // Update selector cards display based on assigned status
                const cardBurgeroov = document.querySelector('.burgeroov-card');
                const cardMvc = document.querySelector('.mvc-card');
                const cardMvcFresh = document.querySelector('.mvcfresh-card');

                if (cardBurgeroov) cardBurgeroov.style.display = inBurgeroov ? 'block' : 'none';
                if (cardMvc) cardMvc.style.display = inMvc ? 'block' : 'none';
                if (cardMvcFresh) cardMvcFresh.style.display = inMvcFresh ? 'block' : 'none';

                overlay.style.display = 'none';

                const activeCompanies = [];
                if (inBurgeroov) activeCompanies.push('burgeroov');
                if (inMvc) activeCompanies.push('mvc');
                if (inMvcFresh) activeCompanies.push('mvcfresh');

                window.userActiveCompanies = activeCompanies;
                window.isMultiCompany = activeCompanies.length > 1;

                const locationSearch = (typeof window !== 'undefined' && window.location && window.location.search) ? window.location.search : '';
                const urlParams = new URLSearchParams(locationSearch);
                const queryCompany = urlParams.get('companyId');
                const queryTab = urlParams.get('tab');

                let chosenCompany = null;
                if (queryCompany && (queryCompany === 'burgeroov' || queryCompany === 'mvc' || queryCompany === 'mvcfresh')) {
                    if ((queryCompany === 'mvc' && inMvc) ||
                        (queryCompany === 'burgeroov' && inBurgeroov) ||
                        (queryCompany === 'mvcfresh' && inMvcFresh)) {
                        chosenCompany = queryCompany;
                    }
                }

                if (chosenCompany) {
                    selectCompany(chosenCompany);
                    if (queryTab) {
                        setTimeout(() => {
                            switchTab(queryTab);
                            window.history.replaceState({}, document.title, window.location.pathname);
                        }, 500);
                    } else {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                } else {
                    const savedCompany = localStorage.getItem('selected_company');
                    if (savedCompany && activeCompanies.includes(savedCompany)) {
                        selectCompany(savedCompany);
                        return;
                    }
                    if (activeCompanies.length > 1) {
                        showCompanySelectionHUD();
                    } else if (activeCompanies.length === 1) {
                        selectCompany(activeCompanies[0]);
                    } else {
                        showUnassignedOverlay(user.email);
                    }
                }
            }).catch((error) => {
                console.error("Error checking company access:", error);
                document.getElementById('auth-loader').style.display = 'none';
                document.getElementById('auth-btn').style.display = 'block';

                overlay.style.display = 'none';
                const savedCompany = localStorage.getItem('selected_company');
                if (savedCompany && (savedCompany === 'burgeroov' || savedCompany === 'mvc' || savedCompany === 'mvcfresh')) {
                    selectCompany(savedCompany);
                } else {
                    showCompanySelectionHUD();
                }
            });
        }
    } else {
        currentUser = null;
        if (currentCustomerSession) {
            if (typeof applyCustomerModeUI === 'function') {
                applyCustomerModeUI();
            } else if (typeof window.applyCustomerModeUI === 'function') {
                window.applyCustomerModeUI();
            }
            return;
        }
        hideUnassignedOverlay();
        // Stop all notification listeners
        Object.keys(notificationListeners).forEach(companyId => {
            if (notificationListeners[companyId]) {
                notificationListeners[companyId].off();
            }
        });
        notificationListeners = {};

        document.getElementById('auth-loader').style.display = 'none';
        document.getElementById('auth-btn').style.display = 'block';
        overlay.style.display = 'flex';
        appWrapper.style.display = 'none';
        document.getElementById('company-selection-overlay').style.display = 'none';

        if (window.companyListenerRef) {
            window.companyListenerRef.off();
            window.companyListenerRef = null;
        }
    }
});

var unassignedCheckInterval = null;

function showUnassignedOverlay(userEmail) {
    const overlay = document.getElementById('auth-overlay');
    const appWrapper = document.getElementById('app-wrapper');
    const hudOverlay = document.getElementById('company-selection-overlay');
    const unassignedOverlay = document.getElementById('unassigned-company-overlay');

    if (overlay) overlay.style.display = 'none';
    if (appWrapper) appWrapper.style.display = 'none';
    if (hudOverlay) hudOverlay.style.display = 'none';

    if (unassignedOverlay) {
        unassignedOverlay.style.display = 'flex';
        const emailEl = document.getElementById('unassigned-user-email');
        if (emailEl) emailEl.textContent = userEmail || (currentUser ? currentUser.email : '');
    }

    if (!unassignedCheckInterval) {
        unassignedCheckInterval = setInterval(() => {
            checkUnassignedUserAccess(false);
        }, 5000);
    }
}

function hideUnassignedOverlay() {
    const unassignedOverlay = document.getElementById('unassigned-company-overlay');
    if (unassignedOverlay) {
        unassignedOverlay.style.display = 'none';
    }
    if (unassignedCheckInterval) {
        clearInterval(unassignedCheckInterval);
        unassignedCheckInterval = null;
    }
}

function checkUnassignedUserAccess(isManualTrigger = false) {
    if (!currentUser || !currentUser.email) return;

    const email = currentUser.email.toLowerCase();
    const sanitizedEmail = email.replace(/\./g, ',');

    Promise.all([
        db.ref('companies/burgeroov/admins').once('value').catch(() => null),
        db.ref('companies/burgeroov/workers').once('value').catch(() => null),
        db.ref('companies/mvc/admins').once('value').catch(() => null),
        db.ref('companies/mvc/workers').once('value').catch(() => null),
        db.ref('companies/mvcfresh/admins').once('value').catch(() => null),
        db.ref('companies/mvcfresh/workers').once('value').catch(() => null),
        db.ref(`customerCodes/workerPasswords/${sanitizedEmail}`).once('value').catch(() => null),
        db.ref(`customerCodes/workerAccess/${sanitizedEmail}`).once('value').catch(() => null)
    ]).then(([bgAdmins, bgWorkers, mvcAdmins, mvcWorkers, freshAdmins, freshWorkers, pwdSnap, accessSnap]) => {
        const burgeroovAdmins = parseAdminsSnap(bgAdmins);
        const burgeroovWorkers = parseWorkersSnap(bgWorkers);

        const mvcAdminsList = parseAdminsSnap(mvcAdmins);
        const mvcWorkersList = parseWorkersSnap(mvcWorkers);

        const mvcfreshAdminsList = parseAdminsSnap(freshAdmins);
        const mvcfreshWorkersList = parseWorkersSnap(freshWorkers);

        let targetWorkerId = null;
        if (pwdSnap && pwdSnap.exists() && pwdSnap.val()) {
            const pwdVal = pwdSnap.val();
            if (pwdVal.workerId) {
                targetWorkerId = pwdVal.workerId;
                try { localStorage.setItem('mvc_worker_id_' + sanitizedEmail, targetWorkerId); } catch (e) { }
            }
        }
        if (!targetWorkerId && typeof localStorage !== 'undefined') {
            targetWorkerId = localStorage.getItem('mvc_worker_id_' + sanitizedEmail);
        }

        let inBurgeroov = burgeroovAdmins[sanitizedEmail] === true ||
            (typeof findMatchingWorker === 'function' ? !!findMatchingWorker(burgeroovWorkers, email, targetWorkerId) : burgeroovWorkers.some(w => w && w.email && w.email.toLowerCase() === email));

        let inMvc = mvcAdminsList[sanitizedEmail] === true ||
            (typeof findMatchingWorker === 'function' ? !!findMatchingWorker(mvcWorkersList, email, targetWorkerId) : mvcWorkersList.some(w => w && w.email && w.email.toLowerCase() === email));

        let inMvcFresh = mvcfreshAdminsList[sanitizedEmail] === true ||
            (typeof findMatchingWorker === 'function' ? !!findMatchingWorker(mvcfreshWorkersList, email, targetWorkerId) : mvcfreshWorkersList.some(w => w && w.email && w.email.toLowerCase() === email));

        if (accessSnap && accessSnap.exists() && accessSnap.val()) {
            const acc = accessSnap.val();
            if (acc.burgeroov === true) inBurgeroov = true;
            if (acc.mvc === true) inMvc = true;
            if (acc.mvcfresh === true) inMvcFresh = true;
        }

        if (pwdSnap && pwdSnap.exists() && pwdSnap.val() && pwdSnap.val().company) {
            const assignedComp = pwdSnap.val().company;
            if (assignedComp === 'burgeroov') inBurgeroov = true;
            if (assignedComp === 'mvc') inMvc = true;
            if (assignedComp === 'mvcfresh') inMvcFresh = true;
        }

        const activeCompanies = [];
        if (inBurgeroov) activeCompanies.push('burgeroov');
        if (inMvc) activeCompanies.push('mvc');
        if (inMvcFresh) activeCompanies.push('mvcfresh');

        window.userActiveCompanies = activeCompanies;

        if (activeCompanies.length > 0) {
            hideUnassignedOverlay();

            const cardBurgeroov = document.querySelector('.burgeroov-card');
            const cardMvc = document.querySelector('.mvc-card');
            const cardMvcFresh = document.querySelector('.mvcfresh-card');

            if (cardBurgeroov) cardBurgeroov.style.display = inBurgeroov ? 'block' : 'none';
            if (cardMvc) cardMvc.style.display = inMvc ? 'block' : 'none';
            if (cardMvcFresh) cardMvcFresh.style.display = inMvcFresh ? 'block' : 'none';

            window.isMultiCompany = activeCompanies.length > 1;

            if (activeCompanies.length > 1) {
                showCompanySelectionHUD();
            } else {
                selectCompany(activeCompanies[0]);
            }
        } else if (isManualTrigger) {
            alert(t('unassigned-still-pending') || "Your account is still pending assignment by the admin.");
        }
    });
}


function toggleAuthMode() {
    window.authMode = (window.authMode === 'login' || authMode === 'login') ? 'signup' : 'login';
    authMode = window.authMode;
    const isAr = currentAppLang === 'ar';

    document.getElementById('auth-title').textContent = authMode === 'login'
        ? (t('auth-title-login') || 'Login to Dashboard')
        : (t('auth-title-signup') || 'Create Viewer Account');

    document.getElementById('auth-btn').textContent = authMode === 'login'
        ? (t('btn-signin') || 'Sign In')
        : (t('btn-signup') || 'Sign Up');

    document.getElementById('auth-toggle-text').textContent = authMode === 'login'
        ? (t('link-signup') || 'Sign Up')
        : (t('btn-signin') || 'Sign In');

    const confirmWrapper = document.getElementById('auth-confirm-password-wrapper');
    if (confirmWrapper) {
        confirmWrapper.style.display = authMode === 'login' ? 'none' : 'block';
    }
    document.getElementById('auth-error-msg').style.display = 'none';
}

function handleAuthSubmit() {
    const activeAuthMode = typeof authMode !== 'undefined' ? authMode : (window.authMode || 'login');
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();
    const errorMsg = document.getElementById('auth-error-msg');
    const btn = document.getElementById('auth-btn');
    const loader = document.getElementById('auth-loader');

    if (!email || !password) {
        errorMsg.style.color = "var(--danger)";
        errorMsg.textContent = currentAppLang === 'ar' ? "الرجاء إدخال البريد الإلكتروني وكلمة المرور." : "Please enter email and password.";
        errorMsg.style.display = 'block'; return;
    }

    if (activeAuthMode === 'signup') {
        const confirmPassword = document.getElementById('auth-confirm-password').value.trim();
        if (password !== confirmPassword) {
            errorMsg.style.color = "var(--danger)";
            errorMsg.textContent = currentAppLang === 'ar' ? "كلمتا المرور غير متطابقتين." : "Passwords do not match.";
            errorMsg.style.display = 'block';
            return;
        }
    }

    btn.style.display = 'none';
    loader.style.display = 'block';
    errorMsg.style.display = 'none';

    if (activeAuthMode === 'login') {
        auth.signInWithEmailAndPassword(email, password)
            .catch(error => {
                btn.style.display = 'block';
                loader.style.display = 'none';
                errorMsg.style.color = "var(--danger)";
                errorMsg.textContent = error.message;
                errorMsg.style.display = 'block';
            });
    } else {
        auth.createUserWithEmailAndPassword(email, password)
            .catch(error => {
                btn.style.display = 'block';
                loader.style.display = 'none';
                errorMsg.style.color = "var(--danger)";
                errorMsg.textContent = error.message;
                errorMsg.style.display = 'block';
            });
    }
}

function logout() {
    hideUnassignedOverlay();
    localStorage.removeItem('selected_company');
    if (typeof currentCustomerSession !== 'undefined' && currentCustomerSession) {
        logoutCustomerSession();
        return;
    }
    auth.signOut();
}

// --- ROLE BASED ACCESS CONTROL (RBAC) ---
function applyUserRoles() {
    if (!currentUser) return;
    const email = currentUser.email.toLowerCase();
    const admins = getCompanyData().admins || { "kinan,rahal@hotmail,com": true };

    let isKinan = email === 'kinan.rahal@hotmail.com';
    let isAdmin = isKinan || admins[email.replace(/\./g, ',')] === true;


    const swapBtn = document.getElementById('company-swap-btn');
    const swapBtnMob = document.getElementById('company-swap-btn-mob');
    const showSwap = isKinan || window.isMultiCompany;
    if (swapBtn) {
        swapBtn.style.display = showSwap ? 'inline-block' : 'none';
    }
    if (swapBtnMob) {
        swapBtnMob.style.display = showSwap ? 'block' : 'none';
    }

    let wPerms = { warehouse: false, drivers: false, finance: false, sales: false, costs: false, adverts: false, attendance: false };

    // Global Privacy Config
    const deptPrivacy = getCompanyData().deptPrivacy || {
        warehouse: 'restricted', drivers: 'restricted', finance: 'restricted', sales: 'restricted', costs: 'restricted', adverts: 'restricted'
    };
    if (!deptPrivacy.adverts) deptPrivacy.adverts = 'restricted';
    if (!deptPrivacy.costs) deptPrivacy.costs = 'restricted';

    const worker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === email);
    let isDriver = false;
    if (worker) {
        if (worker.permissions) wPerms = worker.permissions;
        const r = (worker.role || "").toLowerCase();
        if (r.includes('driver') || r.includes('سائق') || r.includes('delivery')) {
            isDriver = true;
        }
    }

    currentUser.role = isAdmin ? 'admin' : 'worker';
    currentUser.isKinan = isKinan;

    document.body.className = 'theme-' + currentCompany;
    if (isDarkMode) document.body.classList.add('dark-mode');
    if (isKinan) document.body.classList.add('user-is-kinan');

    if (isAdmin) {
        document.body.classList.add('role-admin');
    } else {
        document.body.classList.add('role-worker');
        if (wPerms.warehouse || deptPrivacy.warehouse === 'public') document.body.classList.add('perm-warehouse');
        if (wPerms.drivers || deptPrivacy.drivers === 'public') document.body.classList.add('perm-drivers');
        if (wPerms.finance || deptPrivacy.finance === 'public') document.body.classList.add('perm-finance');
        if (wPerms.sales || deptPrivacy.sales === 'public') document.body.classList.add('perm-sales');
        if (wPerms.costs || deptPrivacy.costs === 'public') document.body.classList.add('perm-costs');
        if (wPerms.adverts || deptPrivacy.adverts === 'public') document.body.classList.add('perm-adverts');
        if (wPerms.attendance) document.body.classList.add('perm-attendance');
        if (wPerms.tasks) document.body.classList.add('perm-tasks');
        
        let isAssignedPrep = false;
        if (worker && worker.id) {
            const compData = getCompanyData();
            let assigned = compData.assignedPreparingWorkerIds || [];
            if (!Array.isArray(assigned) && compData.assignedPreparingWorkerId) {
                assigned = [String(compData.assignedPreparingWorkerId)];
            }
            if (assigned.map(String).includes(String(worker.id))) {
                isAssignedPrep = true;
            }
        }
        if (wPerms.prepare || isAssignedPrep) document.body.classList.add('perm-prepare');
        if (wPerms.vault) document.body.classList.add('perm-vault');
        if (wPerms.reminders) document.body.classList.add('perm-reminders');
        if (wPerms.messaging) document.body.classList.add('perm-messaging');
        if (wPerms.ai_chat) document.body.classList.add('perm-ai-assistant');
        if (wPerms.activity) document.body.classList.add('perm-activity');
        if (wPerms.market) document.body.classList.add('perm-market');
        if (wPerms.summary) document.body.classList.add('perm-summary');
        if (wPerms.salla) document.body.classList.add('perm-salla');

        if (isDriver) document.body.classList.add('is-driver');
        if (typeof checkWorkerSystemViolationAlerts === 'function') {
            checkWorkerSystemViolationAlerts(worker);
        }
    }

    const roleBadge = document.getElementById('display-user-role');
    roleBadge.textContent = isAdmin ? 'Manager' : 'Worker';
    roleBadge.style.backgroundColor = isAdmin ? 'var(--secondary)' : 'rgba(255,255,255,0.15)';

    // Always run after body classes are set
    markLockedTabs();
    checkStockAlerts();
}

/**
 * Marks tabs as visually locked (⛓️) for workers who lack access.
 * Called every time applyUserRoles() runs (i.e. on every Firebase sync).
 */
function markLockedTabs() {
    const isAdmin = document.body.classList.contains('role-admin');
    const isCustomer = !!((typeof currentCustomerSession !== 'undefined' && currentCustomerSession) || (typeof window !== 'undefined' && window.currentCustomerSession));

    // Map: tabId → does current user have access?
    const access = {
        ops: true,
        ranks: true,
        notes: true,
        summary: true,
        attendance: true,
        tasks: true,
        warehouse: isAdmin || document.body.classList.contains('perm-warehouse'),
        drivers: isAdmin || document.body.classList.contains('perm-drivers') || document.body.classList.contains('is-driver'),
        finance: isAdmin || document.body.classList.contains('perm-finance'),
        adverts: isAdmin || document.body.classList.contains('perm-adverts'),
        activity: isAdmin || document.body.classList.contains('perm-activity'),
        managing: isAdmin || document.body.classList.contains('perm-sales'),
        costs: isAdmin || document.body.classList.contains('perm-costs'),
        reminders: isAdmin || document.body.classList.contains('perm-reminders'),
        market: isAdmin || isCustomer || document.body.classList.contains('perm-market'),
        prepare: isAdmin || document.body.classList.contains('perm-prepare'),
        'ai-assistant': isAdmin,
        vault: isAdmin || document.body.classList.contains('perm-vault'),
        messaging: isAdmin || document.body.classList.contains('perm-messaging'),
        learning: true,
        contracts: isAdmin,
        tracking: isAdmin,
        salla: isAdmin || document.body.classList.contains('perm-salla')
    };

    Object.entries(access).forEach(([tabId, hasAccess]) => {
        const btn = document.getElementById(`tab-${tabId}`);
        const mobBtn = document.getElementById(`mob-tab-${tabId}`);
        if (btn) btn.classList.toggle('tab-locked', !hasAccess);
        if (mobBtn) mobBtn.classList.toggle('tab-locked', !hasAccess);
        // Also lock dept sheet items (use data-tab)
        document.querySelectorAll(`.mob-sheet-tab[data-tab="${tabId}"]`).forEach(el => {
            el.classList.toggle('tab-locked', !hasAccess);
        });
    });
}

// --- REAL-TIME DATABASE SYNC ---
function ensureArraysExist(data) {
    if (data.admins && Array.isArray(data.admins)) {
        const map = {};
        data.admins.forEach(email => {
            if (email) {
                map[email.toLowerCase().replace(/\./g, ',')] = true;
            }
        });
        data.admins = map;
    }
    if (!data.admins) data.admins = { "kinan,rahal@hotmail,com": true };
    if (!data.branches) data.branches = [];
    data.branches = data.branches.filter(b => b);

    if (data.workers && !Array.isArray(data.workers)) {
        data.workers = Object.values(data.workers);
    }
    if (!data.workers) data.workers = [];
    data.workers = data.workers.filter(w => w && typeof w === 'object' && w.id && w.name && w.name !== 'undefined' && w.id !== 'undefined' && String(w.name).trim() !== '');
    data.workers.forEach(w => {
        if (!w.jobs) w.jobs = [];
        else if (!Array.isArray(w.jobs)) w.jobs = Object.values(w.jobs);
        w.jobs = w.jobs.filter(j => j && j.id);

        if (!w.constantTasks) w.constantTasks = [];
        else if (!Array.isArray(w.constantTasks)) w.constantTasks = Object.values(w.constantTasks);
        w.constantTasks = w.constantTasks.filter(ct => ct && (ct.id || ct.title));

        if (!w.pendingResponsibilities) w.pendingResponsibilities = [];
        else if (!Array.isArray(w.pendingResponsibilities)) w.pendingResponsibilities = Object.values(w.pendingResponsibilities);
        w.pendingResponsibilities = w.pendingResponsibilities.filter(pr => pr && (pr.subjectId || pr.id || pr.title));
    });

    if (data.generalTasks && !Array.isArray(data.generalTasks)) {
        data.generalTasks = Object.values(data.generalTasks);
    }
    if (!data.generalTasks) data.generalTasks = [];
    data.generalTasks = data.generalTasks.filter(gt => gt && gt.id);

    if (!data.violationRules) data.violationRules = [];
    data.violationRules = data.violationRules.filter(r => r);

    if (data.driverVolumeRewards) {
        if (!Array.isArray(data.driverVolumeRewards)) {
            data.driverVolumeRewards = Object.values(data.driverVolumeRewards);
        }
    } else {
        data.driverVolumeRewards = [];
    }

    if (!data.vaultNotes) data.vaultNotes = {};

    // Contracts dictionary sanitize and absolute null-purging
    if (data.contracts) {
        const cleanObj = {};
        if (Array.isArray(data.contracts)) {
            data.contracts.forEach((c, idx) => {
                if (c && typeof c === 'object' && c.title) {
                    const cId = String(c.id || ('contract_' + idx));
                    c.id = cId;
                    cleanObj[cId] = c;
                }
            });
        } else if (typeof data.contracts === 'object') {
            Object.entries(data.contracts).forEach(([key, val]) => {
                if (val && typeof val === 'object' && val.title) {
                    const cId = String(val.id || key);
                    val.id = cId;
                    cleanObj[cId] = val;
                }
            });
        }
        data.contracts = cleanObj;
    } else {
        data.contracts = {};
    }

    if (!data.jobCatalog) data.jobCatalog = [];
    data.jobCatalog = data.jobCatalog.filter(j => j);

    if (!data.warehouse) data.warehouse = [];
    data.warehouse = data.warehouse.filter(i => i);

    if (!data.whCategories) data.whCategories = [];
    data.whCategories = data.whCategories.filter(f => f);

    // Convert object structures to arrays if loaded as objects from Firebase
    if (data.salesLogs && !Array.isArray(data.salesLogs)) {
        data.salesLogs = Object.values(data.salesLogs);
    }
    if (!data.salesLogs) data.salesLogs = [];
    data.salesLogs = data.salesLogs.filter(s => s && s.id);
    data.salesLogs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (data.costLogs && !Array.isArray(data.costLogs)) {
        data.costLogs = Object.values(data.costLogs);
    }
    if (!data.costLogs) data.costLogs = [];
    data.costLogs = data.costLogs.filter(c => c && c.timestamp);
    data.costLogs.sort((a, b) => b.timestamp - a.timestamp);

    if (data.depositLogs && !Array.isArray(data.depositLogs)) {
        data.depositLogs = Object.values(data.depositLogs);
    }
    if (!data.depositLogs) data.depositLogs = [];
    data.depositLogs = data.depositLogs.filter(d => d && d.timestamp);
    data.depositLogs.sort((a, b) => b.timestamp - a.timestamp);

    if (data.spendLogs && !Array.isArray(data.spendLogs)) {
        data.spendLogs = Object.values(data.spendLogs);
    }
    if (!data.spendLogs) data.spendLogs = [];
    data.spendLogs = data.spendLogs.filter(s => s && s.timestamp);
    data.spendLogs.sort((a, b) => b.timestamp - a.timestamp);

    if (data.spendOrders && !Array.isArray(data.spendOrders)) {
        data.spendOrders = Object.values(data.spendOrders);
    }
    if (!data.spendOrders) data.spendOrders = [];

    if (data.managerNotes && !Array.isArray(data.managerNotes)) {
        data.managerNotes = Object.values(data.managerNotes);
    }
    if (!data.managerNotes) data.managerNotes = [];
    data.managerNotes = data.managerNotes.filter(n => n && n.id);
    data.managerNotes.sort((a, b) => {
        const idA = a && a.id ? String(a.id) : '';
        const idB = b && b.id ? String(b.id) : '';
        return idB.localeCompare(idA);
    });

    if (data.adverts && !Array.isArray(data.adverts)) {
        data.adverts = Object.values(data.adverts);
    }
    if (!data.adverts) data.adverts = [];
    data.adverts = data.adverts.filter(a => a && a.id);
    data.adverts.sort((a, b) => {
        const idA = a && a.id ? String(a.id) : '';
        const idB = b && b.id ? String(b.id) : '';
        return idB.localeCompare(idA);
    });

    if (data.generalTasks && !Array.isArray(data.generalTasks)) {
        data.generalTasks = Object.values(data.generalTasks);
    }
    if (!data.generalTasks) data.generalTasks = [];
    data.generalTasks = data.generalTasks.filter(t => t && t.id);

    // Privacy & Management Data
    if (!data.deptPrivacy) data.deptPrivacy = { warehouse: 'restricted', drivers: 'restricted', finance: 'restricted', sales: 'restricted', costs: 'restricted', adverts: 'restricted' };
    if (!data.deptPrivacy.adverts) data.deptPrivacy.adverts = 'restricted';
    if (!data.deptPrivacy.costs) data.deptPrivacy.costs = 'restricted';

    data.managerNotes.forEach(n => {
        if (!n.replies) n.replies = {};
        else if (Array.isArray(n.replies)) {
            const obj = {};
            n.replies.forEach((r, idx) => {
                if (r) obj[idx.toString()] = r;
            });
            n.replies = obj;
        }
        if (typeof n.replies === 'object') {
            Object.keys(n.replies).forEach(key => {
                if (!n.replies[key] || !n.replies[key].author) {
                    delete n.replies[key];
                }
            });
        }
    });

    if (!data.paymentRequests) data.paymentRequests = {};
    if (!data.custodyRequests) data.custodyRequests = {};
    if (!data.attendance) data.attendance = {};
    if (!data.activityLogs) data.activityLogs = {};
    if (!data.generalDeliveries) data.generalDeliveries = {};
    if (!data.marketProducts) data.marketProducts = {};
    if (!data.liveLocations) data.liveLocations = {};
    if (!data.trackingPlaces) data.trackingPlaces = {};
    if (!data.incomeSources) data.incomeSources = ['Cash', 'Credit Card'];
    if (!data.disabledSalesMethods) data.disabledSalesMethods = [];

    // New Costs Data
    if (!data.costCategories) data.costCategories = ['Electric Bill', 'Meat Supplier', 'Packaging'];

    data.warehouse.forEach(item => {
        if (!item.logs) item.logs = [];
        else if (!Array.isArray(item.logs)) item.logs = Object.values(item.logs);
        item.logs = item.logs.filter(l => l);
        if (!item.category) item.category = 'Uncategorized';
    });

    data.workers.forEach(w => {
        if (!w.jobs) w.jobs = [];
        else if (!Array.isArray(w.jobs)) w.jobs = Object.values(w.jobs);
        w.jobs = w.jobs.filter(j => j);

        if (!w.logs) w.logs = [];
        else if (!Array.isArray(w.logs)) w.logs = Object.values(w.logs);
        w.logs = w.logs.filter(l => l);

        if (!w.shifts) {
            w.shifts = [];
            if (w.startTime && w.endTime) {
                w.shifts.push({
                    id: 'shift_default',
                    startTime: w.startTime,
                    endTime: w.endTime,
                    active: true
                });
            }
        } else if (!Array.isArray(w.shifts)) {
            w.shifts = Object.values(w.shifts);
        }

        if (!w.email) w.email = "";
        if (!w.permissions) w.permissions = { warehouse: false, drivers: false, finance: false, sales: false, costs: false, adverts: false, attendance: false };
        if (!w.monthlyStats) w.monthlyStats = {};
        Object.keys(w.monthlyStats).forEach(month => {
            let ms = w.monthlyStats[month];
            if (ms) {
                if (!ms.custodyList) ms.custodyList = [];
                else if (!Array.isArray(ms.custodyList)) ms.custodyList = Object.values(ms.custodyList);
                ms.custodyList = ms.custodyList.filter(x => x);

                if (!ms.violationsList) ms.violationsList = [];
                else if (!Array.isArray(ms.violationsList)) ms.violationsList = Object.values(ms.violationsList);
                ms.violationsList = ms.violationsList.filter(x => x);

                if (!ms.rewardsList) ms.rewardsList = [];
                else if (!Array.isArray(ms.rewardsList)) ms.rewardsList = Object.values(ms.rewardsList);
                ms.rewardsList = ms.rewardsList.filter(x => x);

                if (!ms.paymentsList) ms.paymentsList = [];
                else if (!Array.isArray(ms.paymentsList)) ms.paymentsList = Object.values(ms.paymentsList);
                ms.paymentsList = ms.paymentsList.filter(x => x);

                if (!ms.deliveriesList) ms.deliveriesList = [];
                else if (!Array.isArray(ms.deliveriesList)) ms.deliveriesList = Object.values(ms.deliveriesList);
                ms.deliveriesList = ms.deliveriesList.filter(x => x);

                if (!ms.overtimeList) ms.overtimeList = [];
                else if (!Array.isArray(ms.overtimeList)) ms.overtimeList = Object.values(ms.overtimeList);
                ms.overtimeList = ms.overtimeList.filter(x => x);
            }
        });
    });
}

function initGlobalMarketListeners() {
    if (typeof db === 'undefined' || !db) return;
    if (window._hasGlobalMarketListeners) return;
    window._hasGlobalMarketListeners = true;

    const companyList = ['mvc', 'mvcfresh', 'burgeroov'];
    companyList.forEach(cKey => {
        db.ref(`companies/${cKey}/marketOrders`).on('value', snapshot => {
            if (!appData[cKey]) appData[cKey] = {};
            appData[cKey].marketOrders = snapshot.val() || {};
            renderAdminMarketOrders();
            renderCustomerOrders();
            renderPrepareSection();
        });
    });
}
window.initGlobalMarketListeners = initGlobalMarketListeners;

let activeGranularListeners = [];

function detachGranularListeners() {
    activeGranularListeners.forEach(ref => {
        try { ref.off(); } catch(e) {}
    });
    activeGranularListeners = [];
}

function listenToCloudData() {
    initGlobalMarketListeners();

    if (window.companyListenerRef) {
        try { window.companyListenerRef.off(); } catch(e) {}
    }
    detachGranularListeners();

    // 1. Initial snapshot load (Loads full company structure once on startup/switch)
    db.ref('companies/' + currentCompany).once('value').then((snapshot) => {
        if (snapshot.exists()) {
            appData[currentCompany] = snapshot.val();
            ensureArraysExist(appData[currentCompany]);
        } else {
            appData[currentCompany] = { admins: ['kinan.rahal@hotmail.com'], branches: ['Main Branch'], workers: [], violationRules: [], jobCatalog: [], warehouse: [] };
            saveData();
        }

        applyUserRoles();
        if (typeof renderWorkerOperationsContractBanner === 'function') {
            renderWorkerOperationsContractBanner();
        }
        if (typeof renderWorkerOperationsResponsibilitiesBanner === 'function') {
            renderWorkerOperationsResponsibilitiesBanner();
        }

        if (isInitialLoad) {
            migrateMonthlyData();
            runAutoLogger();
            initFCMToken(); // ← Capture & save device token on first load
            if (typeof startWorkerLocationBroadcaster === 'function') {
                startWorkerLocationBroadcaster();
            }

            if (currentUser && currentUser.role === 'worker') {
                const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
                if (myWorker) {
                    if (myWorker.jobs) previousTaskIds = myWorker.jobs.map(j => j.id);
                    window.previousOrderStartTime = myWorker.activeOrder ? myWorker.activeOrder.startTime : null;

                    window.prevPaymentReqStatuses = {};
                    const pRequests = getCompanyData().paymentRequests || {};
                    Object.values(pRequests).forEach(req => {
                        if (req.workerId === myWorker.id) {
                            window.prevPaymentReqStatuses[req.id] = req.status;
                        }
                    });
                }
            }
            isInitialLoad = false;
        }

        renderAll();
        checkStockAlerts();

        // 2. High-Efficiency Granular Sub-Node Listeners
        const subNodes = [
            { key: 'workers', render: () => { applyUserRoles(); renderWorkers(); renderTasks(); if (typeof renderConstantTasksSection === 'function') renderConstantTasksSection(); if (typeof renderInquiriesSection === 'function') renderInquiriesSection(); } },
            { key: 'warehouse', render: () => { renderWarehouse(); checkStockAlerts(); } },
            { key: 'paymentRequests', render: () => { if (typeof renderPaymentRequests === 'function') renderPaymentRequests(); } },
            { key: 'taskAlerts', render: () => { if (typeof renderTaskAlerts === 'function') renderTaskAlerts(); } },
            { key: 'trackedTasks', render: () => { if (typeof renderTrackedTasks === 'function') renderTrackedTasks(); } },
            { key: 'marketFeedback', render: () => { if (typeof renderMarketFeedback === 'function') renderMarketFeedback(); } },
            { key: 'jobCatalog', render: () => { if (typeof renderJobCatalog === 'function') renderJobCatalog(); } },
            { key: 'activeAnnouncement', render: () => { 
                if (typeof renderActiveAnnouncementHUD === 'function') renderActiveAnnouncementHUD(); 
                if (typeof checkAndShowWorkerAnnouncementPopup === 'function') checkAndShowWorkerAnnouncementPopup(); 
            } },
            { key: 'announcementTemplates', render: () => { 
                if (typeof renderAnnouncementTemplates === 'function') renderAnnouncementTemplates(); 
            } },
            { key: 'reminders', render: () => { if (typeof renderReminders === 'function') renderReminders(); } },
            { key: 'reminderContacts', render: () => { if (typeof renderReminderContactsDropdown === 'function') renderReminderContactsDropdown(); } },
            { key: 'attendance', render: () => { 
                if (typeof renderAttendance === 'function') renderAttendance(); 
                if (typeof renderSummaryTable === 'function') renderSummaryTable(); 
                if (typeof renderFinanceTable === 'function') renderFinanceTable(); 
            } },
            { key: 'sales', render: () => { 
                if (typeof renderSales === 'function') renderSales(); 
                if (typeof renderSalesHistoryTable === 'function') renderSalesHistoryTable(); 
                if (typeof renderSalesSummaryTable === 'function') renderSalesSummaryTable(); 
            } },
            { key: 'costs', render: () => { if (typeof renderCosts === 'function') renderCosts(); } },
            { key: 'generalTasks', render: () => { if (typeof renderTasks === 'function') renderTasks(); } },
            { key: 'constantResponsibilities', render: () => { if (typeof renderConstantTasksSection === 'function') renderConstantTasksSection(); } },
            { key: 'generalDeliveries', render: () => { if (typeof renderTasks === 'function') renderTasks(); } },
            { key: 'custodyRequests', render: () => { if (typeof renderCustodyRequests === 'function') renderCustodyRequests(); } },
            { key: 'salaryAdvances', render: () => { if (typeof renderSalaryAdvancesTable === 'function') renderSalaryAdvancesTable(); } },
            { key: 'customAllowances', render: () => { if (typeof renderFinanceTable === 'function') renderFinanceTable(); } },
            { key: 'customDeductions', render: () => { if (typeof renderFinanceTable === 'function') renderFinanceTable(); } },
            { key: 'dailyLedger', render: () => { if (typeof renderDailyLedger === 'function') renderDailyLedger(); } },
            { key: 'activityLog', render: () => { if (typeof renderActivityLog === 'function') renderActivityLog(); } },
            { key: 'lateRules', render: () => { if (typeof renderAttendance === 'function') renderAttendance(); } },
            { key: 'driverVolumeRewards', render: () => { if (typeof renderFinanceTable === 'function') renderFinanceTable(); } },
            { key: 'rankSettings', render: () => { if (typeof renderRanks === 'function') renderRanks(); } }
        ];

        const arrayNodeKeys = ['workers', 'warehouse', 'driverVolumeRewards', 'branches', 'violationRules', 'jobCatalog'];
        subNodes.forEach(node => {
            const nodeRef = db.ref(`companies/${currentCompany}/${node.key}`);
            nodeRef.on('value', snap => {
                if (appData[currentCompany]) {
                    let val = snap.val();
                    if (arrayNodeKeys.includes(node.key)) {
                        if (!val) val = [];
                        else if (!Array.isArray(val) && typeof val === 'object') val = Object.values(val);
                    } else {
                        if (!val) val = {};
                    }
                    appData[currentCompany][node.key] = val;
                    if (node.key === 'workers' || node.key === 'driverVolumeRewards') {
                        ensureArraysExist(appData[currentCompany]);
                    }
                }
                node.render();
            });
            activeGranularListeners.push(nodeRef);
        });

    }).catch((error) => {
        console.error("Error loading initial company snapshot:", error);
    });
}

function saveData() {
    if (appData[currentCompany]) {
        ensureArraysExist(appData[currentCompany]);
    }
    db.ref('companies/' + currentCompany).set(appData[currentCompany])
        .catch(error => {
            console.error("Error saving data:", error);
            alert("Failed to save. You may not have Admin permissions.");
        });
}


// =====================================================================
// FCM TOKEN INTEGRATION
// Works in two environments:
//   1. Android WebView  → AndroidInterface.getFCMToken() bridge
//   2. Browser          → Firebase Web Messaging SDK (if VAPID key set)
// The token is saved directly to the worker's node in RTDB so the
// admin can target the device for push notifications.
// =====================================================================

/**
 * Entry point — called once on first data load after authentication.
 * Tries the Android bridge first; falls back to Firebase Web Messaging.
 */
function initFCMToken() {
    if (!currentUser) return;

    // --- Path 1: Android WebView bridge ---
    if (typeof AndroidInterface !== 'undefined') {
        try {
            const token = AndroidInterface.getFCMToken();
            if (token) {
                console.log('[FCM] Token received from AndroidInterface.');
                saveWorkerFCMToken(token);
                return;   // Done — no need to try Web Messaging
            }
        } catch (e) {
            console.warn('[FCM] AndroidInterface.getFCMToken() threw:', e);
        }
    }

    // --- Path 2: Firebase Web Messaging (browser, PWA) ---
    // Requires firebase-messaging-sw.js and a VAPID key.
    // Leave BURGEROOV_VAPID_KEY as empty string to disable.
    const BURGEROOV_VAPID_KEY = _cfgSecret('QlBxS25ZTTJGdlptd3A2QmJxQU1jUGNrMmR5NTItczVDS1RGMkEwODlpeXlJSHBUZlUweU5Vak1MLU5GcG9malpBSXBUcEM5ckQ5OE5WTmszU0tMd1Jv');

    if (BURGEROOV_VAPID_KEY && typeof firebase !== 'undefined' && firebase.messaging) {
        try {
            const messaging = firebase.messaging();

            // Build the getToken options — include SW registration if available
            const getTokenOpts = { vapidKey: BURGEROOV_VAPID_KEY };
            if (window.__swRegistration) {
                getTokenOpts.serviceWorkerRegistration = window.__swRegistration;
            }

            messaging.getToken(getTokenOpts)
                .then(token => {
                    if (token) {
                        console.log('[FCM] Token received from Firebase Web Messaging.');
                        saveWorkerFCMToken(token);
                    } else {
                        console.info('[FCM] No registration token — permission may be denied.');
                    }
                })
                .catch(err => {
                    // If passing the SW registration failed, try without it
                    console.warn('[FCM] getToken() with SW failed, retrying without SW:', err.message);
                    messaging.getToken({ vapidKey: BURGEROOV_VAPID_KEY })
                        .then(token => { if (token) saveWorkerFCMToken(token); })
                        .catch(err2 => console.warn('[FCM] getToken() fallback failed:', err2));
                });

        } catch (e) {
            console.warn('[FCM] Firebase Web Messaging not available:', e);
        }
    }
}

/**
 * Writes the FCM token directly into the worker's node in Firebase RTDB.
 * Uses db.ref().update() targeting a specific worker — avoids overwriting
 * the entire dataset (unlike saveData()).
 *
 * @param {string} token  - The FCM registration token
 */
function saveWorkerFCMToken(token) {
    if (!currentUser || !token) return;

    const email = currentUser.email.toLowerCase();

    // Save token to all companies if worker is registered in them
    saveTokenForCompany('burgeroov', email, token);
    saveTokenForCompany('mvc', email, token);
    saveTokenForCompany('mvcfresh', email, token);
}

function saveTokenForCompany(companyId, email, token) {
    db.ref(`companies/${companyId}/workers`).once('value')
        .then(snapshot => {
            if (!snapshot.exists()) return;
            const workers = snapshot.val() || [];
            const workerIndex = workers.findIndex(w => w && w.email && w.email.toLowerCase() === email);

            if (workerIndex !== -1) {
                const workerRef = db.ref(`companies/${companyId}/workers/${workerIndex}`);
                const currentToken = workers[workerIndex].fcmToken;
                if (currentToken === token) {
                    console.log(`[FCM] Token unchanged in ${companyId} — no write needed.`);
                    return;
                }

                workerRef.update({ fcmToken: token, fcmUpdatedAt: Date.now() })
                    .then(() => {
                        console.log(`[FCM] Token saved for worker in ${companyId}:`, workers[workerIndex].name);
                        if (currentCompany === companyId && getCompanyData().workers && getCompanyData().workers[workerIndex]) {
                            getCompanyData().workers[workerIndex].fcmToken = token;
                        }
                    })
                    .catch(err => console.error(`[FCM] Failed to save token in ${companyId}:`, err));
            } else {
                if (currentCompany === companyId && currentUser && currentUser.role === 'admin') {
                    db.ref(`companies/${companyId}/adminTokens/${btoa(email).replace(/=/g, '')}`)
                        .set({ email, fcmToken: token, updatedAt: Date.now() })
                        .catch(err => console.error(`[FCM] Failed to store admin token in ${companyId}:`, err));
                }
            }
        })
        .catch(err => console.error(`[FCM] Error reading workers list for ${companyId}:`, err));
}



var currentAppLang = localStorage.getItem("burgeroov_lang") || "en";

function t(key) {
    return (uiTranslations[currentAppLang] && uiTranslations[currentAppLang][key]) || key;
}

function applyTranslations() {
    if (currentAppLang !== "en" && currentAppLang !== "ar") {
        currentAppLang = "en";
    }
    document.documentElement.dir = currentAppLang === "ar" ? "rtl" : "ltr";

    const langBtn = document.getElementById("lang-toggle-btn");
    if (langBtn) {
        langBtn.innerText = currentAppLang === "ar" ? "🌐 English" : "🌐 عربي";
    }
    const langBtnMob = document.getElementById("lang-toggle-btn-mob");
    if (langBtnMob) {
        langBtnMob.innerText = currentAppLang === "ar" ? "🌐 English" : "🌐 عربي";
    }

    const langDict = { ...(uiTranslations[currentAppLang] || uiTranslations["en"] || {}) };

    // Dynamic translations based on selected company
    if (typeof currentCustomerSession !== 'undefined' && currentCustomerSession) {
        langDict['app-title'] = currentAppLang === 'ar' ? 'سوق عملاء MVC' : 'MVC Customer Market';
        document.title = 'MVC Customer Market';
    } else if (currentCompany === 'mvc') {
        langDict['app-title'] = currentAppLang === 'ar' ? 'بوابة عمليات إم في سي فريش' : 'MVC Fresh Operations Portal';
        langDict['auth-title-login'] = currentAppLang === 'ar' ? 'تسجيل الدخول للوحة تحكم إم في سي فريش' : 'Login to MVC Fresh Dashboard';
        document.title = 'MVC Fresh Management Portal';
    } else if (currentCompany === 'mvcfresh') {
        langDict['app-title'] = currentAppLang === 'ar' ? 'بوابة عمليات إم في سي فريش' : 'MVC Fresh Operations Portal';
        langDict['auth-title-login'] = currentAppLang === 'ar' ? 'تسجيل الدخول للوحة تحكم إم في سي فريش' : 'Login to MVC Fresh Dashboard';
        document.title = 'MVC Fresh Management Portal';
    } else {
        langDict['app-title'] = currentAppLang === 'ar' ? 'بوابة عمليات برجروف' : 'Burgeroov Operations Portal';
        langDict['auth-title-login'] = currentAppLang === 'ar' ? 'تسجيل الدخول للوحة التحكم' : 'Login to Dashboard';
        document.title = 'Burgeroov Management Portal';
    }

    document.querySelectorAll("[data-i18n]").forEach(el => {
        let key = el.getAttribute("data-i18n");
        let isPlaceholder = false;
        if (key.startsWith("[placeholder]")) {
            isPlaceholder = true;
            key = key.replace("[placeholder]", "");
        }
        const translation = langDict[key];

        if (translation) {
            if (isPlaceholder || (el.tagName === "INPUT" && el.hasAttribute("placeholder")) || (el.tagName === "TEXTAREA" && el.hasAttribute("placeholder"))) {
                el.placeholder = translation;
            } else {
                el.innerHTML = translation;
            }
        }
    });

    if (typeof applyDarkMode === "function") {
        applyDarkMode();
    }
}

function toggleLanguage(event) {
    if (event) event.stopPropagation();
    currentAppLang = currentAppLang === "en" ? "ar" : "en";
    localStorage.setItem("burgeroov_lang", currentAppLang);

    if (typeof renderAll === "function") renderAll();
    applyTranslations();
    if (typeof applyDarkMode === "function") applyDarkMode();
}


function getVisibleWorkers() {
    const workers = getCompanyData().workers;
    if (!currentUser) return [];

    const email = currentUser.email.toLowerCase();
    const admins = getCompanyData().admins || { "kinan,rahal@hotmail,com": true };
    const isAdmin = email === 'kinan.rahal@hotmail.com' || admins[email.replace(/\./g, ',')] === true;

    const worker = workers.find(w => w.email && w.email.toLowerCase() === email);
    const hasFinancePerm = worker && worker.permissions && worker.permissions.finance;

    if (isAdmin || hasFinancePerm) {
        return workers;
    } else {
        return workers.filter(w => w.email && w.email.toLowerCase() === email);
    }
}

// --- ADMIN / MANAGER ACCESS SYSTEM ---

function setDatePickerLimits() {
    const dateInput = document.getElementById('log-date');
    const [year, month] = currentGlobalMonth.split('-');
    const lastDay = new Date(year, month, 0).getDate();
    dateInput.min = `${currentGlobalMonth}-01`; dateInput.max = `${currentGlobalMonth}-${lastDay}`;
    dateInput.value = '';
}


function formatTimestamp() {
    const d = new Date(); const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const m = d.getMinutes().toString().padStart(2, '0'); const h = d.getHours().toString().padStart(2, '0');
    return `${months[d.getMonth()]} ${d.getDate()}, ${h}:${m}`;
}

function formatDuration(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function compressImage(file, callback) {
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = event => {
        const img = new Image(); img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 500; let scaleSize = MAX_WIDTH / img.width; if (scaleSize > 1) scaleSize = 1;
            canvas.width = img.width * scaleSize; canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            callback(canvas.toDataURL('image/jpeg', 0.6));
        }
    };
}

let currentImageZoomScale = 1;

function showImage(src) {
    if (!src) return;
    const modal = document.getElementById('image-modal');
    const img = document.getElementById('image-modal-content');
    if (modal && img) {
        img.src = src;
        currentImageZoomScale = 1;
        img.style.transform = `scale(1)`;
        modal.style.display = 'flex';
    }
}
window.showImage = showImage;

function closeImageModal() {
    const modal = document.getElementById('image-modal');
    if (modal) modal.style.display = 'none';
    const img = document.getElementById('image-modal-content');
    if (img) {
        currentImageZoomScale = 1;
        img.style.transform = `scale(1)`;
    }
}
window.closeImageModal = closeImageModal;

function zoomImage(delta) {
    const img = document.getElementById('image-modal-content');
    if (!img) return;
    currentImageZoomScale += delta;
    if (currentImageZoomScale < 0.5) currentImageZoomScale = 0.5;
    if (currentImageZoomScale > 4.0) currentImageZoomScale = 4.0;
    img.style.transform = `scale(${currentImageZoomScale})`;
}
window.zoomImage = zoomImage;

function resetImageZoom() {
    const img = document.getElementById('image-modal-content');
    if (!img) return;
    currentImageZoomScale = 1;
    img.style.transform = `scale(1)`;
}
window.resetImageZoom = resetImageZoom;

function showAnnouncementFullImage() {
    const img = document.getElementById('worker-popup-img');
    if (img && img.src) {
        showImage(img.src);
    }
}
window.showAnnouncementFullImage = showAnnouncementFullImage;

function toggleDetails(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.style.display === 'none' || el.style.display === '') {
        el.style.display = 'block';
        if (id.startsWith('wh-logs-')) {
            window.expandedWhLogs = window.expandedWhLogs || {};
            window.expandedWhLogs[id] = true;
        }
    } else {
        el.style.display = 'none';
        if (id.startsWith('wh-logs-')) {
            window.expandedWhLogs = window.expandedWhLogs || {};
            delete window.expandedWhLogs[id];
        }
    }
}

function downloadBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ burgeroov: appData.burgeroov }));
    const a = document.createElement('a'); a.href = dataStr;
    a.download = `burgeroov_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); a.remove();
}
function triggerRestore() { document.getElementById('backup-file-input').click(); }
function processRestoreFile(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const parsedData = JSON.parse(e.target.result);
            if (parsedData.burgeroov) {
                appData.burgeroov = parsedData.burgeroov;
                saveData();
                alert("Backup restored and synced to cloud successfully!");
            } else { alert("Invalid backup file."); }
        } catch (err) { alert("Could not read file."); }
    };
    reader.readAsText(file); event.target.value = '';
}

// --- UI NAVIGATION & GLOBALS ---
function switchTab(tab) {
    if (typeof currentCustomerSession !== 'undefined' && currentCustomerSession && tab !== 'market') {
        tab = 'market';
    }
    currentTab = tab;

    // --- Check if this tab is locked for the current user ---
    const tabBtn = document.getElementById(`tab-${tab}`);
    const isLocked = tabBtn ? tabBtn.classList.contains('tab-locked') : false;

    // Update the locked view label with the department name
    if (isLocked) {
        const label = document.getElementById('locked-dept-label');
        if (label && tabBtn) {
            label.textContent = tabBtn.textContent.trim();
        }
    }

    const allTabs = ['ops', 'ranks', 'attendance', 'tasks', 'warehouse', 'drivers', 'finance', 'summary', 'adverts', 'notes', 'activity', 'managing', 'costs', 'reminders', 'market', 'prepare', 'ai-assistant', 'vault', 'messaging', 'learning', 'contracts', 'tracking', 'salla'];

    allTabs.forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        const view = document.getElementById(`view-${t}`);
        const isActive = tab === t;
        if (btn) btn.classList.toggle('active-tab', isActive);
        // Only show the real view if NOT locked
        if (view) view.classList.toggle('active-view', isActive && !isLocked);

        // Sync quick-bar buttons (by id)
        const qBtn = document.getElementById(`mob-tab-${t}`);
        if (qBtn) qBtn.classList.toggle('active-tab', isActive);

        // Sync dept-sheet buttons (by data-tab attribute)
        document.querySelectorAll(`.mob-sheet-tab[data-tab="${t}"]`).forEach(el => {
            el.classList.toggle('active-tab', isActive);
        });
    });

    if (tab === 'vault' && typeof renderVaultNotes === 'function') {
        renderVaultNotes();
    }
    if (tab === 'messaging' && typeof renderMessagingSection === 'function') {
        renderMessagingSection();
    }
    if (tab === 'learning' && typeof renderLearningProgram === 'function') {
        renderLearningProgram();
    }
    if (tab === 'contracts' && typeof renderContractsSection === 'function') {
        renderContractsSection();
    }
    if (tab === 'tracking') {
        if (typeof renderTrackingSection === 'function') renderTrackingSection();
        if (typeof zoomToActiveCompanyWorkZone === 'function') zoomToActiveCompanyWorkZone();
    }
    if (tab === 'salla') {
        if (typeof renderSallaSection === 'function') renderSallaSection();
    }
    if (tab === 'adverts') {
        if (typeof renderAnnouncementsSection === 'function') renderAnnouncementsSection();
    }
    if (tab === 'ops' && typeof renderWorkerOperationsContractBanner === 'function') {
        renderWorkerOperationsContractBanner();
    }
    if (tab === 'ops' && typeof renderWorkerOperationsResponsibilitiesBanner === 'function') {
        renderWorkerOperationsResponsibilitiesBanner();
    }
    if (tab === 'tasks' && typeof renderInquiries === 'function') {
        renderInquiries();
    }

    // Update the compact bar's active tab label and icon
    const tabMeta = {
        ops: { icon: '⚙️', label: 'Operations' },
        ranks: { icon: '🏆', label: 'Ranks' },
        tasks: { icon: '📋', label: 'Tasks' },
        warehouse: { icon: '📦', label: 'Warehouse' },
        drivers: { icon: '🚚', label: 'Drivers' },
        finance: { icon: '💰', label: 'Finance' },
        summary: { icon: '📊', label: 'Summary' },
        managing: { icon: '💵', label: 'Sales' },
        costs: { icon: '📉', label: 'Costs' },
        adverts: { icon: '📢', label: 'Ads' },
        notes: { icon: '📝', label: 'Notes' },
        reminders: { icon: '⏰', label: 'Reminders' },
        market: { icon: '🏪', label: 'Market' },
        prepare: { icon: '👨‍🍳', label: 'Prepare' },
        vault: { icon: '📁', label: 'Informations' },
        messaging: { icon: '💬', label: 'Messaging' },
        learning: { icon: '🎓', label: 'Learning' },
        contracts: { icon: '📜', label: 'Contracts' },
        tracking: { icon: '📍', label: 'Live Radar' },
        salla: { icon: '🛍️', label: 'Salla' }
    };
    const meta = tabMeta[tab] || { icon: '⚙️', label: tab };
    const iconEl = document.getElementById('mob-active-icon');
    const labelEl = document.getElementById('mob-active-label');
    if (iconEl) iconEl.textContent = meta.icon;
    if (labelEl) labelEl.textContent = meta.label;

    // Show or hide the locked overlay
    const lockedView = document.getElementById('view-locked');
    if (lockedView) lockedView.classList.toggle('active-view', isLocked);

    if (!isLocked) {
        renderAll();
        if (tab === 'reminders' && typeof renderReminders === 'function') {
            if (typeof currentRemindersLimit !== 'undefined') {
                currentRemindersLimit = 20;
            }
            renderReminders();
        }
        if (tab === 'market' && typeof renderMarket === 'function') {
            renderMarket();
        }
        if (tab === 'prepare' && typeof renderPrepareSection === 'function') {
            renderPrepareSection();
        }
        // Fixes Leaflet map rendering bug when switching tabs
        if (tab === 'adverts' && promoMap) {
            setTimeout(() => { promoMap.invalidateSize(); }, 500);
        }
    }
}

// --- MOBILE DEPARTMENT MENU ---
window.openMobDeptMenu = function () {
    const backdrop = document.getElementById('mob-dept-backdrop');
    const sheet = document.getElementById('mob-dept-sheet');
    if (backdrop) backdrop.classList.add('open');
    if (sheet) sheet.classList.add('open');
    document.body.style.overflow = 'hidden';
};

window.closeMobDeptMenu = function () {
    const backdrop = document.getElementById('mob-dept-backdrop');
    const sheet = document.getElementById('mob-dept-sheet');
    if (backdrop) backdrop.classList.remove('open');
    if (sheet) {
        sheet.classList.remove('open');
    }
    document.body.style.overflow = '';
};

// Close menu on Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMobDeptMenu();
});


function getMonthlyStats(worker, monthStr) {
    if (!worker.monthlyStats) worker.monthlyStats = {};
    if (!worker.monthlyStats[monthStr]) {
        worker.monthlyStats[monthStr] = {
            custodyList: [],
            violationsList: [],
            rewardsList: [],
            costs: 0,
            paymentsList: [],
            deliveriesList: [],
            legacyDeliveries: 0,
            overtimeList: []
        };
    } else if (!worker.monthlyStats[monthStr].overtimeList) {
        worker.monthlyStats[monthStr].overtimeList = [];
    }
    return worker.monthlyStats[monthStr];
}

function getLogsForMonth(worker, monthStr) { return worker.logs.filter(l => l.date.startsWith(monthStr)); }

function calculateViolationsTotal(violationsList) {
    if (!violationsList) return 0;
    return violationsList.reduce((sum, v) => {
        if (v.status === 'waived') return sum;
        if (v.status === 'active' || !v.status) return sum + parseFloat(v.amount);
        if (v.status === 'pending') {
            const deadline = v.timestamp + (v.graceDays * 86400000);
            if (Date.now() >= deadline) return sum + parseFloat(v.amount);
        }
        return sum;
    }, 0);
}

function calculatePaymentsTotal(paymentsList) {
    if (!paymentsList) return 0;
    return paymentsList.reduce((sum, p) => sum + parseFloat(p.amount), 0);
}

function calculateRewardsTotal(rewardsList) {
    if (!rewardsList) return 0;
    return rewardsList.reduce((sum, r) => sum + parseFloat(r.amount), 0);
}

function calculateOvertimeTotal(overtimeList) {
    if (!overtimeList) return 0;
    return overtimeList.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
}

function calculateCustodyTotal(custodyList) {
    if (!custodyList) return 0;
    return custodyList.reduce((sum, c) => {
        if (c.type === 'given') return sum + parseFloat(c.amount);
        if (c.type === 'returned') return sum - parseFloat(c.amount);
        return sum;
    }, 0);
}

function getCumulativeBalance(worker, maxMonthStr) {
    const allMonths = Object.keys(worker.monthlyStats || {}).sort();
    let balance = parseFloat(worker.initialBalance || 0);
    for (const m of allMonths) {
        const stats = worker.monthlyStats[m];
        const base = parseFloat(worker.income || 0);
        const rew = calculateRewardsTotal(stats.rewardsList);
        const viol = calculateViolationsTotal(stats.violationsList);

        const sysViolDeduction = typeof getSystemViolationDeductionsForMonth === 'function' ? getSystemViolationDeductionsForMonth(worker, m) : 0;
        const lateDeduction = typeof getLateDeductionsForMonth === 'function' ? getLateDeductionsForMonth(worker, m) : 0;
        const volumeReward = typeof getDriverVolumeRewardsForMonth === 'function' ? getDriverVolumeRewardsForMonth(worker, m) : 0;
        const ov = calculateOvertimeTotal(stats.overtimeList);
        const netThisMonth = base + rew + volumeReward + ov - viol - sysViolDeduction - lateDeduction;
        const paidThisMonth = calculatePaymentsTotal(stats.paymentsList);
        balance += (netThisMonth - paidThisMonth);
        if (m === maxMonthStr) break;
    }
    return balance;
}

function handleMonthChange() {
    const input = document.getElementById('global-month').value;
    if (input) {
        currentGlobalMonth = input;
        showingAllHistory = false;
        setDatePickerLimits();
        runAutoLogger();
        renderAll();
        checkStockAlerts();
    }
}

function setDatePickerLimits() {
    const dateInput = document.getElementById('log-date');
    const [year, month] = currentGlobalMonth.split('-');
    const lastDay = new Date(year, month, 0).getDate();
    dateInput.min = `${currentGlobalMonth}-01`; dateInput.max = `${currentGlobalMonth}-${lastDay}`;
    dateInput.value = '';
}

function toggleVacationDays() {
    const type = document.getElementById('log-type').value;
    document.getElementById('vacation-days-group').style.display = type === 'vacation' ? 'block' : 'none';
}

// --- DATA EXPORT LOGIC ---

// --- MOBILE DEPARTMENT MENU ---
window.openMobDeptMenu = function () {
    const backdrop = document.getElementById('mob-dept-backdrop');
    const sheet = document.getElementById('mob-dept-sheet');
    if (backdrop) backdrop.classList.add('open');
    if (sheet) sheet.classList.add('open');
    document.body.style.overflow = 'hidden';
};

window.closeMobDeptMenu = function () {
    const backdrop = document.getElementById('mob-dept-backdrop');
    const sheet = document.getElementById('mob-dept-sheet');
    if (backdrop) backdrop.classList.remove('open');
    if (sheet) {
        sheet.classList.remove('open');
    }
    document.body.style.overflow = '';
};

// Close menu on Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMobDeptMenu();
});


function getMonthlyStats(worker, monthStr) {
    if (!worker.monthlyStats) worker.monthlyStats = {};
    if (!worker.monthlyStats[monthStr]) {
        worker.monthlyStats[monthStr] = {
            custodyList: [],
            violationsList: [],
            rewardsList: [],
            costs: 0,
            paymentsList: [],
            deliveriesList: [],
            legacyDeliveries: 0,
            overtimeList: []
        };
    } else if (!worker.monthlyStats[monthStr].overtimeList) {
        worker.monthlyStats[monthStr].overtimeList = [];
    }
    return worker.monthlyStats[monthStr];
}

function getLogsForMonth(worker, monthStr) { return worker.logs.filter(l => l.date.startsWith(monthStr)); }

function calculateViolationsTotal(violationsList) {
    if (!violationsList) return 0;
    return violationsList.reduce((sum, v) => {
        if (v.status === 'waived') return sum;
        if (v.status === 'active' || !v.status) return sum + parseFloat(v.amount);
        if (v.status === 'pending') {
            const deadline = v.timestamp + (v.graceDays * 86400000);
            if (Date.now() >= deadline) return sum + parseFloat(v.amount);
        }
        return sum;
    }, 0);
}

function calculatePaymentsTotal(paymentsList) {
    if (!paymentsList) return 0;
    return paymentsList.reduce((sum, p) => sum + parseFloat(p.amount), 0);
}

function calculateRewardsTotal(rewardsList) {
    if (!rewardsList) return 0;
    return rewardsList.reduce((sum, r) => sum + parseFloat(r.amount), 0);
}

function calculateOvertimeTotal(overtimeList) {
    if (!overtimeList) return 0;
    return overtimeList.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
}

function calculateCustodyTotal(custodyList) {
    if (!custodyList) return 0;
    return custodyList.reduce((sum, c) => {
        if (c.type === 'given') return sum + parseFloat(c.amount);
        if (c.type === 'returned') return sum - parseFloat(c.amount);
        return sum;
    }, 0);
}

function getCumulativeBalance(worker, maxMonthStr) {
    const allMonths = Object.keys(worker.monthlyStats || {}).sort();
    let balance = parseFloat(worker.initialBalance || 0);
    for (const m of allMonths) {
        const stats = worker.monthlyStats[m];
        const base = parseFloat(worker.income || 0);
        const rew = calculateRewardsTotal(stats.rewardsList);
        const viol = calculateViolationsTotal(stats.violationsList);

        const sysViolDeduction = typeof getSystemViolationDeductionsForMonth === 'function' ? getSystemViolationDeductionsForMonth(worker, m) : 0;
        const lateDeduction = typeof getLateDeductionsForMonth === 'function' ? getLateDeductionsForMonth(worker, m) : 0;
        const volumeReward = typeof getDriverVolumeRewardsForMonth === 'function' ? getDriverVolumeRewardsForMonth(worker, m) : 0;
        const ov = calculateOvertimeTotal(stats.overtimeList);
        const netThisMonth = base + rew + volumeReward + ov - viol - sysViolDeduction - lateDeduction;
        const paidThisMonth = calculatePaymentsTotal(stats.paymentsList);
        balance += (netThisMonth - paidThisMonth);
        if (m === maxMonthStr) break;
    }
    return balance;
}

function handleMonthChange() {
    const input = document.getElementById('global-month').value;
    if (input) {
        currentGlobalMonth = input;
        showingAllHistory = false;
        setDatePickerLimits();
        runAutoLogger();
        renderAll();
        checkStockAlerts();
    }
}

function setDatePickerLimits() {
    const dateInput = document.getElementById('log-date');
    const [year, month] = currentGlobalMonth.split('-');
    const lastDay = new Date(year, month, 0).getDate();
    dateInput.min = `${currentGlobalMonth}-01`; dateInput.max = `${currentGlobalMonth}-${lastDay}`;
    dateInput.value = '';
}

function toggleVacationDays() {
    const type = document.getElementById('log-type').value;
    document.getElementById('vacation-days-group').style.display = type === 'vacation' ? 'block' : 'none';
}

// --- DATA EXPORT LOGIC ---



// --- MOBILE DEPARTMENT MENU ---
window.openMobDeptMenu = function () {
    const backdrop = document.getElementById('mob-dept-backdrop');
    const sheet = document.getElementById('mob-dept-sheet');
    if (backdrop) backdrop.classList.add('open');
    if (sheet) sheet.classList.add('open');
    document.body.style.overflow = 'hidden';
};

window.closeMobDeptMenu = function () {
    const backdrop = document.getElementById('mob-dept-backdrop');
    const sheet = document.getElementById('mob-dept-sheet');
    if (backdrop) backdrop.classList.remove('open');
    if (sheet) {
        sheet.classList.remove('open');
    }
    document.body.style.overflow = '';
};

// Close menu on Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMobDeptMenu();
});




function renderAll() {
    if (typeof renderBranches === 'function') renderBranches();
    if (typeof renderViolationRules === 'function') renderViolationRules();
    if (typeof populateWorkerDropdowns === 'function') populateWorkerDropdowns();
    if (typeof renderWarehouse === 'function') renderWarehouse();
    if (typeof renderManagersList === 'function') renderManagersList();
    if (typeof renderWorkerViolationPanel === 'function') renderWorkerViolationPanel();

    if (currentTab === 'ops') {
        if (typeof renderOpsWorkersTable === 'function') renderOpsWorkersTable();
        if (typeof renderOpsDetails === 'function') renderOpsDetails();
        if (typeof renderSelectedWorkerSysViolations === 'function') renderSelectedWorkerSysViolations();
        if (typeof renderWorkerOperationsContractBanner === 'function') renderWorkerOperationsContractBanner();
        if (typeof renderWorkerOperationsResponsibilitiesBanner === 'function') renderWorkerOperationsResponsibilitiesBanner();
    }
    else if (currentTab === 'ranks') { if (typeof renderRanksTable === 'function') renderRanksTable(); }
    else if (currentTab === 'attendance') { if (typeof renderAttendance === 'function') renderAttendance(); }
    else if (currentTab === 'tasks') {
        if (typeof renderTasks === 'function') renderTasks();
        if (typeof renderConstantTasks === 'function') renderConstantTasks();
        if (typeof currentConstantTasksViewMode !== 'undefined' && currentConstantTasksViewMode === 'workers' && typeof renderWorkerResponsibilitiesView === 'function') {
            renderWorkerResponsibilitiesView(typeof currentWorkloadSelectedWorkerId !== 'undefined' ? currentWorkloadSelectedWorkerId : null);
        }
    }
    else if (currentTab === 'finance') {
        if (typeof renderFinanceTable === 'function') renderFinanceTable();
        if (typeof renderFinDetails === 'function') renderFinDetails();
        if (typeof renderFinanceSpendArea === 'function') renderFinanceSpendArea();
    }
    else if (currentTab === 'summary') {
        if (typeof renderSummaryTable === 'function') renderSummaryTable();
        if (typeof renderLeaderboard === 'function') renderLeaderboard();
    }
    else if (currentTab === 'drivers') {
        if (typeof renderDriversList === 'function') renderDriversList();
        if (typeof renderDriverPanel === 'function') renderDriverPanel();
        if (typeof renderDriverVolumeRewards === 'function') renderDriverVolumeRewards();
    }
    else if (currentTab === 'adverts') { if (typeof renderAnnouncementsSection === 'function') renderAnnouncementsSection(); else if (typeof renderAdverts === 'function') renderAdverts(); }
    else if (currentTab === 'notes') { if (typeof renderNotes === 'function') renderNotes(); }
    else if (currentTab === 'activity') { if (typeof renderActivityLog === 'function') renderActivityLog(); }
    else if (currentTab === 'managing') { if (typeof renderManaging === 'function') renderManaging(); }
    else if (currentTab === 'costs') { if (typeof renderCosts === 'function') renderCosts(); }
    else if (currentTab === 'reminders') { if (typeof renderReminders === 'function') renderReminders(); }
    else if (currentTab === 'market') { if (typeof renderMarket === 'function') renderMarket(); }
    else if (currentTab === 'ai-assistant') { if (typeof renderAIAssistant === 'function') renderAIAssistant(); }
    else if (currentTab === 'learning') { if (typeof renderLearningProgram === 'function') renderLearningProgram(); }
    else if (currentTab === 'contracts') { if (typeof renderContractsSection === 'function') renderContractsSection(); }
    else if (currentTab === 'tracking') { if (typeof renderTrackingSection === 'function') renderTrackingSection(); }
    else if (currentTab === 'salla') { if (typeof renderSallaSection === 'function') renderSallaSection(); }

    if (typeof renderPaymentRequests === 'function') renderPaymentRequests();
    if (typeof renderWorkerCustodyRequests === 'function') renderWorkerCustodyRequests();
    if (typeof renderPendingCustodyRequests === 'function') renderPendingCustodyRequests();
    if (typeof renderAcceptedCustodyReleases === 'function') renderAcceptedCustodyReleases();
    if (typeof applyUserTabOrder === 'function') applyUserTabOrder();
    if (typeof checkAndShowWorkerAnnouncementPopup === 'function') checkAndShowWorkerAnnouncementPopup();
}


function startGlobalTick() {
    if (typeof globalInterval !== 'undefined' && globalInterval) clearInterval(globalInterval);
    globalInterval = setInterval(() => {
        if (typeof updateActiveDriverTimer === 'function') updateActiveDriverTimer();
        if (typeof updateViolationTimers === 'function') updateViolationTimers();
        if (typeof updateTaskTimers === 'function') updateTaskTimers();
    }, 1000);
}

window.getVisibleWorkers = getVisibleWorkers;
window.formatTimestamp = formatTimestamp;
window.formatDuration = formatDuration;
window.compressImage = compressImage;
window.showImage = showImage;
window.toggleDetails = toggleDetails;
window.switchTab = switchTab;
if (typeof openMobDeptMenu === 'function') window.openMobDeptMenu = openMobDeptMenu;
if (typeof closeMobDeptMenu === 'function') window.closeMobDeptMenu = closeMobDeptMenu;
window.renderAll = renderAll;
window.startGlobalTick = startGlobalTick;
window.setDatePickerLimits = setDatePickerLimits;
window.applyTranslations = applyTranslations;
window.toggleLanguage = toggleLanguage;
window.t = t;


// --- AUTOMATIC IN-SCOPE WINDOW EXPORTS ---
if (typeof translateDynamicTerm === 'function') window.translateDynamicTerm = translateDynamicTerm;
if (typeof playNotifSound === 'function') window.playNotifSound = playNotifSound;
if (typeof showInAppNotification === 'function') window.showInAppNotification = showInAppNotification;
if (typeof hideInAppNotification === 'function') window.hideInAppNotification = hideInAppNotification;
if (typeof initPublicCustomerSync === 'function') window.initPublicCustomerSync = initPublicCustomerSync;
if (typeof startGlobalNotificationListeners === 'function') window.startGlobalNotificationListeners = startGlobalNotificationListeners;
if (typeof _cfgSecret === 'function') window._cfgSecret = _cfgSecret;
if (typeof togglePassword === 'function') window.togglePassword = togglePassword;
if (typeof toggleConfirmPassword === 'function') window.toggleConfirmPassword = toggleConfirmPassword;
if (typeof resetPassword === 'function') window.resetPassword = resetPassword;
if (typeof setTodayDisplay === 'function') window.setTodayDisplay = setTodayDisplay;
if (typeof applyDarkMode === 'function') window.applyDarkMode = applyDarkMode;
if (typeof toggleDarkMode === 'function') window.toggleDarkMode = toggleDarkMode;
if (typeof parseAdminsSnap === 'function') window.parseAdminsSnap = parseAdminsSnap;
if (typeof parseWorkersSnap === 'function') window.parseWorkersSnap = parseWorkersSnap;
if (typeof getCompanyData === 'function') window.getCompanyData = getCompanyData;
if (typeof showUnassignedOverlay === 'function') window.showUnassignedOverlay = showUnassignedOverlay;
if (typeof hideUnassignedOverlay === 'function') window.hideUnassignedOverlay = hideUnassignedOverlay;
if (typeof checkUnassignedUserAccess === 'function') window.checkUnassignedUserAccess = checkUnassignedUserAccess;
if (typeof toggleAuthMode === 'function') window.toggleAuthMode = toggleAuthMode;
if (typeof handleAuthSubmit === 'function') window.handleAuthSubmit = handleAuthSubmit;
if (typeof logout === 'function') window.logout = logout;
if (typeof applyUserRoles === 'function') window.applyUserRoles = applyUserRoles;
if (typeof markLockedTabs === 'function') window.markLockedTabs = markLockedTabs;
if (typeof ensureArraysExist === 'function') window.ensureArraysExist = ensureArraysExist;
if (typeof listenToCloudData === 'function') window.listenToCloudData = listenToCloudData;
if (typeof saveData === 'function') window.saveData = saveData;
if (typeof initFCMToken === 'function') window.initFCMToken = initFCMToken;
if (typeof saveWorkerFCMToken === 'function') window.saveWorkerFCMToken = saveWorkerFCMToken;
if (typeof saveTokenForCompany === 'function') window.saveTokenForCompany = saveTokenForCompany;
if (typeof downloadBackup === 'function') window.downloadBackup = downloadBackup;
if (typeof triggerRestore === 'function') window.triggerRestore = triggerRestore;
if (typeof processRestoreFile === 'function') window.processRestoreFile = processRestoreFile;
if (typeof getMonthlyStats === 'function') window.getMonthlyStats = getMonthlyStats;
if (typeof getLogsForMonth === 'function') window.getLogsForMonth = getLogsForMonth;
if (typeof calculateViolationsTotal === 'function') window.calculateViolationsTotal = calculateViolationsTotal;
if (typeof calculatePaymentsTotal === 'function') window.calculatePaymentsTotal = calculatePaymentsTotal;
if (typeof calculateRewardsTotal === 'function') window.calculateRewardsTotal = calculateRewardsTotal;
if (typeof calculateOvertimeTotal === 'function') window.calculateOvertimeTotal = calculateOvertimeTotal;
if (typeof calculateCustodyTotal === 'function') window.calculateCustodyTotal = calculateCustodyTotal;
if (typeof getCumulativeBalance === 'function') window.getCumulativeBalance = getCumulativeBalance;
if (typeof handleMonthChange === 'function') window.handleMonthChange = handleMonthChange;
if (typeof toggleVacationDays === 'function') window.toggleVacationDays = toggleVacationDays;
