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

const originalAlert = window.alert;
window.alert = function (msg) {
    return originalAlert(translateDynamicTerm(msg));
};

const originalConfirm = window.confirm;
window.confirm = function (msg) {
    return originalConfirm(translateDynamicTerm(msg));
};

// FEATURE 1: IN-APP NOTIFICATION SYSTEM
let notifTimeout = null;

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

let notificationListeners = {};

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

// --- 1. FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBUJHeSOCvDeJauDufHiNvlmlF9dwZhbaw",
    authDomain: "burgeroov-portal.firebaseapp.com",
    databaseURL: "https://burgeroov-portal-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "burgeroov-portal",
    storageBucket: "burgeroov-portal.firebasestorage.app",
    messagingSenderId: "488288106586",
    appId: "1:488288106586:web:7337244c0b046409330063"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

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
let isDarkMode = localStorage.getItem('darkMode') === 'true';
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
let currentCompany = 'burgeroov';
let appData = {
    burgeroov: { branches: ['Main Branch'], workers: [], violationRules: [], jobCatalog: [], warehouse: [], admins: { "kinan,rahal@hotmail,com": true } },
    mvc: { branches: ['Main Branch'], workers: [], violationRules: [], jobCatalog: [], warehouse: [], admins: { "kinan,rahal@hotmail,com": true } },
    mvcfresh: { branches: ['Main Branch'], workers: [], violationRules: [], jobCatalog: [], warehouse: [], admins: { "kinan,rahal@hotmail,com": true } }
};
const today = new Date();
let currentGlobalMonth = today.toISOString().slice(0, 7);
let currentTab = 'ops';
let globalInterval = null;
let activeDriverId = null;
let currentUser = null;
let isInitialLoad = true;

// FEATURE 1: Task tracking state — tracks previously seen task IDs for the current worker
let previousTaskIds = [];



function getCompanyData() {
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
    document.getElementById('company-selection-overlay').style.display = 'flex';
    document.getElementById('app-wrapper').style.display = 'none';
}

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
    if (companyId === 'mvc') logoSrc = 'mvc.png';
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
        });
    } else {
        listenToCloudData();
        startGlobalTick();
        initFCMToken();
    }
}

window.selectCompany = selectCompany;
window.showCompanySelectionHUD = showCompanySelectionHUD;

// --- AUTHENTICATION SYSTEM ---
let authMode = 'login';

auth.onAuthStateChanged((user) => {
    const overlay = document.getElementById('auth-overlay');
    const appWrapper = document.getElementById('app-wrapper');
    const launchLoader = document.getElementById('launch-loader-overlay');

    if (launchLoader) launchLoader.style.display = 'none';

    if (user) {
        currentUser = { email: user.email, uid: user.uid };
        document.getElementById('display-user-email').textContent = currentUser.email;
        startGlobalNotificationListeners(user.email);

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
            Promise.all([
                db.ref('companies/burgeroov/admins').once('value').catch(() => null),
                db.ref('companies/burgeroov/workers').once('value').catch(() => null),
                db.ref('companies/mvc/admins').once('value').catch(() => null),
                db.ref('companies/mvc/workers').once('value').catch(() => null),
                db.ref('companies/mvcfresh/admins').once('value').catch(() => null),
                db.ref('companies/mvcfresh/workers').once('value').catch(() => null)
            ]).then(([bgAdmins, bgWorkers, mvcAdmins, mvcWorkers, freshAdmins, freshWorkers]) => {
                document.getElementById('auth-loader').style.display = 'none';
                document.getElementById('auth-btn').style.display = 'block';

                const burgeroovAdmins = parseAdminsSnap(bgAdmins);
                const burgeroovWorkers = parseWorkersSnap(bgWorkers);

                const mvcAdminsList = parseAdminsSnap(mvcAdmins);
                const mvcWorkersList = parseWorkersSnap(mvcWorkers);

                const mvcfreshAdminsList = parseAdminsSnap(freshAdmins);
                const mvcfreshWorkersList = parseWorkersSnap(freshWorkers);

                const sanitizedEmail = email.replace(/\./g, ',');
                const inBurgeroov = burgeroovAdmins[sanitizedEmail] === true ||
                    burgeroovWorkers.some(w => w && w.email && w.email.toLowerCase() === email);

                const inMvc = mvcAdminsList[sanitizedEmail] === true ||
                    mvcWorkersList.some(w => w && w.email && w.email.toLowerCase() === email);

                const inMvcFresh = mvcfreshAdminsList[sanitizedEmail] === true ||
                    mvcfreshWorkersList.some(w => w && w.email && w.email.toLowerCase() === email);

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

                window.isMultiCompany = activeCompanies.length > 1;

                const urlParams = new URLSearchParams(window.location.search);
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
                    if (savedCompany && (savedCompany === 'burgeroov' || savedCompany === 'mvc' || savedCompany === 'mvcfresh')) {
                        if ((savedCompany === 'mvc' && inMvc) ||
                            (savedCompany === 'burgeroov' && inBurgeroov) ||
                            (savedCompany === 'mvcfresh' && inMvcFresh)) {
                            selectCompany(savedCompany);
                            return;
                        }
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

let unassignedCheckInterval = null;

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
        db.ref('companies/mvcfresh/workers').once('value').catch(() => null)
    ]).then(([bgAdmins, bgWorkers, mvcAdmins, mvcWorkers, freshAdmins, freshWorkers]) => {
        const burgeroovAdmins = parseAdminsSnap(bgAdmins);
        const burgeroovWorkers = parseWorkersSnap(bgWorkers);

        const mvcAdminsList = parseAdminsSnap(mvcAdmins);
        const mvcWorkersList = parseWorkersSnap(mvcWorkers);

        const mvcfreshAdminsList = parseAdminsSnap(freshAdmins);
        const mvcfreshWorkersList = parseWorkersSnap(freshWorkers);

        const inBurgeroov = burgeroovAdmins[sanitizedEmail] === true ||
            burgeroovWorkers.some(w => w && w.email && w.email.toLowerCase() === email);

        const inMvc = mvcAdminsList[sanitizedEmail] === true ||
            mvcWorkersList.some(w => w && w.email && w.email.toLowerCase() === email);

        const inMvcFresh = mvcfreshAdminsList[sanitizedEmail] === true ||
            mvcfreshWorkersList.some(w => w && w.email && w.email.toLowerCase() === email);

        const activeCompanies = [];
        if (inBurgeroov) activeCompanies.push('burgeroov');
        if (inMvc) activeCompanies.push('mvc');
        if (inMvcFresh) activeCompanies.push('mvcfresh');

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
    authMode = authMode === 'login' ? 'signup' : 'login';
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

    if (authMode === 'signup') {
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

    if (authMode === 'login') {
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

    // Map: tabId → does current user have access?
    const access = {
        warehouse: isAdmin || document.body.classList.contains('perm-warehouse'),
        drivers: isAdmin || document.body.classList.contains('perm-drivers') || document.body.classList.contains('is-driver'),
        finance: isAdmin || document.body.classList.contains('perm-finance'),
        managing: isAdmin || document.body.classList.contains('perm-sales'),
        costs: isAdmin || document.body.classList.contains('perm-costs'),
        adverts: isAdmin || document.body.classList.contains('perm-adverts'),
        activity: isAdmin,
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
    data.workers = data.workers.filter(w => w);
    data.workers.forEach(w => {
        if (!w.jobs) w.jobs = [];
        else if (!Array.isArray(w.jobs)) w.jobs = Object.values(w.jobs);
        w.jobs = w.jobs.filter(j => j && j.id);
    });

    if (data.generalTasks && !Array.isArray(data.generalTasks)) {
        data.generalTasks = Object.values(data.generalTasks);
    }
    if (!data.generalTasks) data.generalTasks = [];
    data.generalTasks = data.generalTasks.filter(gt => gt && gt.id);

    if (!data.violationRules) data.violationRules = [];
    data.violationRules = data.violationRules.filter(r => r);

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

function listenToCloudData() {
    if (window.companyListenerRef) {
        window.companyListenerRef.off();
    }

    window.companyListenerRef = db.ref('companies/' + currentCompany);
    window.companyListenerRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            appData[currentCompany] = snapshot.val();
            ensureArraysExist(appData[currentCompany]);
        } else {
            appData[currentCompany] = { admins: ['kinan.rahal@hotmail.com'], branches: ['Main Branch'], workers: [], violationRules: [], jobCatalog: [], warehouse: [] };
            saveData();
        }

        applyUserRoles();

        if (isInitialLoad) {
            migrateMonthlyData();
            runAutoLogger();
            initFCMToken(); // ← Capture & save device token on first load

            if (currentUser && currentUser.role === 'worker') {
                const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
                if (myWorker) {
                    if (myWorker.jobs) previousTaskIds = myWorker.jobs.map(j => j.id);
                    // Track initial active order time to avoid false notification on login
                    window.previousOrderStartTime = myWorker.activeOrder ? myWorker.activeOrder.startTime : null;

                    // Track initial payment request statuses
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
        } else {
            renderAll();
        }

        renderAll();
        checkStockAlerts();
    }, (error) => {
        console.error("Error listening to database:", error);
        alert("Database connection error. Ensure your Firebase Rules are set to true.");
    });
}

function saveData() {
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
    const BURGEROOV_VAPID_KEY = 'BPqKnYM2FvZmwp6BbqAMcPck2dy52-s5CKTF2A089iyyIHpTfU0yNUjML-NFpofjZAIpTpC9rD98NVNk3SKLwRo';

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


function migrateMonthlyData() {
    let migrated = false;
    let company = getCompanyData();
    const isAdmin = currentUser && currentUser.role === 'admin';
    const email = currentUser ? currentUser.email.toLowerCase() : "";

    company.workers.forEach((w, workerIndex) => {
        // If not admin, the worker can ONLY migrate their own record
        if (!isAdmin && (!w.email || w.email.toLowerCase() !== email)) {
            return;
        }

        let workerMigrated = false;
        if (!w.email) {
            w.email = "";
            workerMigrated = true;
        } else if (w.email !== w.email.toLowerCase()) {
            w.email = w.email.toLowerCase();
            workerMigrated = true;
        }
        if (!w.permissions) { w.permissions = { warehouse: false, drivers: false, finance: false }; workerMigrated = true; }
        if (!w.monthlyStats) { w.monthlyStats = {}; workerMigrated = true; }
        if (!w.monthlyStats[currentGlobalMonth]) {
            w.monthlyStats[currentGlobalMonth] = { custodyList: [], rewardsList: [], costs: 0, paymentsList: [], violationsList: [], deliveriesList: [], legacyDeliveries: 0 };
            workerMigrated = true;
        }
        if (!w.role) { w.role = "General Staff"; workerMigrated = true; }
        if (!w.initialBalance) { w.initialBalance = 0; workerMigrated = true; }
        if (!w.jobs) { w.jobs = []; workerMigrated = true; }
        if (!w.rank) { w.rank = "Unranked"; workerMigrated = true; }
        if (w.lastEvalDate === undefined) { w.lastEvalDate = Date.now(); workerMigrated = true; }

        if (workerMigrated) {
            migrated = true;
            if (!isAdmin) {
                // Targeted write to their own worker path
                db.ref(`companies/${currentCompany}/workers/${workerIndex}`).set(w)
                    .catch(err => console.error("Error migrating worker profile:", err));
            }
        }
    });

    if (isAdmin) {
        if (migrated) saveData();
        company.workers.forEach(w => {
            if (w.id && w.email) {
                const key = w.email.toLowerCase().replace(/\./g, ',');
                db.ref(`companies/${currentCompany}/users/${key}`).set(w.id)
                    .catch(err => console.error("Error syncing user email mapping:", err));
                db.ref(`companies/${currentCompany}/userPermissions/${w.id}`).set({
                    email: w.email.toLowerCase(),
                    warehouse: w.permissions ? !!w.permissions.warehouse : false,
                    drivers: w.permissions ? !!w.permissions.drivers : false,
                    finance: w.permissions ? !!w.permissions.finance : false,
                    sales: w.permissions ? !!w.permissions.sales : false,
                    costs: w.permissions ? !!w.permissions.costs : false,
                    adverts: w.permissions ? !!w.permissions.adverts : false
                }).catch(err => console.error("Error syncing user permissions:", err));
            }
        });
    }
}

function startGlobalTick() {
    if (globalInterval) clearInterval(globalInterval);
    globalInterval = setInterval(() => {
        updateActiveDriverTimer();
        updateViolationTimers();
        updateTaskTimers();
    }, 1000);
}

function updateTaskTimers() {
    const timers = document.querySelectorAll('.task-timer-display');
    let mostUrgentTask = null;
    let minDiff = Infinity;

    // FIX: Use 'timerEl' instead of 't' so it doesn't break the t() translation function
    timers.forEach(timerEl => {
        const deadline = parseInt(timerEl.getAttribute('data-deadline'));
        const diff = deadline - Date.now();
        if (diff <= 0) {
            timerEl.innerHTML = `🚨 ${t('status-late')}`;
            timerEl.style.color = 'var(--danger)';
        } else {
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
            timerEl.innerHTML = `⏳ ${t('status-time-remaining')} ${m}:${s}`;
            timerEl.style.color = 'var(--warning)';
        }
    });

    // Update persistent banner for the current worker
    const banner = document.getElementById('worker-task-timer-banner');
    const timerDisplay = document.getElementById('worker-timer-display');
    const taskNameDisplay = document.getElementById('worker-timer-task-name');

    if (currentUser && currentUser.role === 'worker') {
        const email = currentUser.email.toLowerCase();
        const worker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === email);
        if (worker && worker.jobs) {
            worker.jobs.forEach(j => {
                if ((j.status === 'seen' || (!j.status && j.done === false)) && j.deadlineMins > 0 && j.seenAt) {
                    const deadlineMs = j.seenAt + (j.deadlineMins * 60000);
                    const diff = deadlineMs - Date.now();
                    if (diff < minDiff) {
                        minDiff = diff;
                        mostUrgentTask = { title: j.title, diff: diff };
                    }
                }
            });
        }
    }

    // Ensure the banner elements actually exist before trying to update them
    if (banner && timerDisplay && taskNameDisplay) {
        if (mostUrgentTask) {
            banner.style.display = 'block';
            taskNameDisplay.textContent = mostUrgentTask.title;
            const diff = mostUrgentTask.diff;
            if (diff <= 0) {
                timerDisplay.textContent = t('status-late');
                timerDisplay.style.color = 'var(--danger)';
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
                timerDisplay.textContent = `${m}:${s}`;
                timerDisplay.style.color = 'var(--warning)';
            }
        } else {
            banner.style.display = 'none';
        }
    }
}

function updateViolationTimers() {
    let expiredSomething = false;
    const timers = document.querySelectorAll('.viol-timer');

    // FIX: Changed 't' to 'timerEl'
    timers.forEach(timerEl => {
        const deadline = parseInt(timerEl.getAttribute('data-deadline'));
        const diff = deadline - Date.now();
        if (diff <= 0) {
            timerEl.classList.remove('viol-timer');
            timerEl.innerHTML = '🚨 Applied (Time Expired)';
            timerEl.style.color = 'var(--danger)';
            const parent = timerEl.closest('.flex-between');
            if (parent && parent.children[1]) parent.children[1].innerHTML = '';
            expiredSomething = true;
        } else {
            const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
            const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
            const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
            timerEl.innerHTML = `⏳ Pending (${h}h ${m}m ${s}s left)`;
        }
    });

    if (expiredSomething) {
        if (currentTab === 'finance') { renderFinDetails(); renderFinanceTable(); }
        else if (currentTab === 'summary') { renderSummaryTable(); }
    }
}

// --- AUTO LOGGER ---
function getDaysInMonth(year, month) { return new Date(year, month, 0).getDate(); }

function runAutoLogger() {
    let updated = false;
    const selDate = new Date(currentGlobalMonth + "-01");
    const selYear = selDate.getFullYear();
    const selMonthNum = selDate.getMonth() + 1;

    const todayDate = new Date();
    const todayYear = todayDate.getFullYear();
    const todayMonthNum = todayDate.getMonth() + 1;
    const todayDay = todayDate.getDate();

    let targetDayLimit = 0;
    let isFuture = false;

    if (selYear < todayYear || (selYear === todayYear && selMonthNum < todayMonthNum)) {
        targetDayLimit = getDaysInMonth(selYear, selMonthNum);
    } else if (selYear === todayYear && selMonthNum === todayMonthNum) {
        targetDayLimit = todayDay;
    } else {
        targetDayLimit = getDaysInMonth(selYear, selMonthNum);
        isFuture = true;
    }

    const monthStrPad = selMonthNum.toString().padStart(2, '0');
    const todayStr = `${todayYear}-${todayMonthNum.toString().padStart(2, '0')}-${todayDay.toString().padStart(2, '0')}`;

    const isAdmin = currentUser && currentUser.role === 'admin';
    const email = currentUser ? currentUser.email.toLowerCase() : "";

    getCompanyData().workers.forEach((w, workerIndex) => {
        // If not admin, the worker can ONLY auto-log their own records
        if (!isAdmin && (!w.email || w.email.toLowerCase() !== email)) {
            return;
        }

        let workerUpdated = false;
        if (!isFuture) {
            const originalCount = w.logs.length;
            w.logs = w.logs.filter(l => l.date <= todayStr || l.note !== 'Auto-logged ✅');
            if (w.logs.length !== originalCount) workerUpdated = true;
        }

        for (let i = 1; i <= targetDayLimit; i++) {
            let dStr = `${selYear}-${monthStrPad}-${i.toString().padStart(2, '0')}`;
            let existing = w.logs.find(l => l.date === dStr);
            if (!existing) {
                w.logs.push({ date: dStr, score: 100, note: 'Auto-logged ✅', noteType: 'good' });
                workerUpdated = true;
            }
        }
        w.logs.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (workerUpdated) {
            updated = true;
            if (!isAdmin) {
                // Workers write specifically to their own logs path to satisfy security rules
                db.ref(`companies/${currentCompany}/workers/${workerIndex}/logs`).set(w.logs)
                    .catch(err => console.error("Error auto-logging for worker:", err));
            }
        }
    });

    if (updated && isAdmin) {
        saveData();
    }
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
function renderManagersList() {
    const list = document.getElementById('managers-list');
    if (!list) return;
    list.innerHTML = '';
    const admins = getCompanyData().admins || {};
    Object.keys(admins).forEach(key => {
        const email = key.replace(/,/g, '.');
        const li = document.createElement('li'); li.className = 'flex-between list-item';
        let delBtn = '';
        if (currentUser && currentUser.isKinan && email !== 'kinan.rahal@hotmail.com') {
            // Renamed to 'Demote' as requested
            delBtn = `<button class="btn-outline-danger admin-only" style="padding: 2px 8px; font-size: 0.7rem;" onclick="deleteManager('${email}')">${t('btn-remove')}</button>`;
        } else if (email === 'kinan.rahal@hotmail.com') {
            delBtn = `<span class="badge" style="background:var(--primary);">${t('label-master')}</span>`;
        }
        li.innerHTML = `<span style="font-weight: 500; font-size: 0.9rem; color: var(--text-main);">${email}</span> ${delBtn}`;
        list.appendChild(li);
    });
}

function addManager() {
    const email = document.getElementById('new-manager-email').value.trim().toLowerCase();
    if (!email) return;
    const key = email.replace(/\./g, ',');
    if (!getCompanyData().admins) getCompanyData().admins = {};
    if (!getCompanyData().admins[key]) {
        getCompanyData().admins[key] = true;
        document.getElementById('new-manager-email').value = '';

        // Targeted write to admins list
        db.ref('companies/' + currentCompany + '/admins/' + key).set(true)
            .catch(err => console.error("Error adding admin manager:", err));
    }
}

function deleteManager(email) {
    if (!currentUser.isKinan) return alert("Only the ultimate admin can demote managers.");
    if (email === 'kinan.rahal@hotmail.com') return alert("Cannot demote master admin.");
    if (confirm(`${t('btn-remove')} ${email}?`)) {
        const key = email.replace(/\./g, ',');
        if (getCompanyData().admins) {
            delete getCompanyData().admins[key];
        }

        // Targeted write to admins list
        db.ref('companies/' + currentCompany + '/admins/' + key).remove()
            .catch(err => console.error("Error deleting admin manager:", err));
        renderManagersList();
    }
}

function loadWorkerPerms() {
    const wId = document.getElementById('perm-worker-select').value;
    if (!wId) {
        document.getElementById('perm-wh').checked = false;
        document.getElementById('perm-drv').checked = false;
        document.getElementById('perm-fin').checked = false;
        document.getElementById('perm-sales').checked = false;
        document.getElementById('perm-costs').checked = false;
        document.getElementById('perm-adverts').checked = false;
        document.getElementById('perm-attendance').checked = false;
        if (document.getElementById('perm-tasks')) document.getElementById('perm-tasks').checked = false;
        return;
    }
    const worker = getCompanyData().workers.find(w => w.id === wId);
    if (!worker) return;
    const p = worker.permissions || { warehouse: false, drivers: false, finance: false, sales: false, costs: false, adverts: false, attendance: false, tasks: false };
    document.getElementById('perm-wh').checked = !!p.warehouse;
    document.getElementById('perm-drv').checked = !!p.drivers;
    document.getElementById('perm-fin').checked = !!p.finance;
    document.getElementById('perm-sales').checked = !!p.sales;
    document.getElementById('perm-costs').checked = !!p.costs;
    document.getElementById('perm-adverts').checked = !!p.adverts;
    document.getElementById('perm-attendance').checked = !!p.attendance;
    if (document.getElementById('perm-tasks')) document.getElementById('perm-tasks').checked = !!p.tasks;
}

function saveWorkerPerms() {
    const wId = document.getElementById('perm-worker-select').value;
    if (!wId) return alert("Select a worker first.");
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === wId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    worker.permissions = {
        warehouse: document.getElementById('perm-wh').checked,
        drivers: document.getElementById('perm-drv').checked,
        finance: document.getElementById('perm-fin').checked,
        sales: document.getElementById('perm-sales').checked,
        costs: document.getElementById('perm-costs').checked,
        adverts: document.getElementById('perm-adverts').checked,
        attendance: document.getElementById('perm-attendance').checked,
        tasks: document.getElementById('perm-tasks') ? document.getElementById('perm-tasks').checked : false
    };

    // Targeted write to worker permissions path
    db.ref(`companies/${currentCompany}/workers/${workerIndex}/permissions`).set(worker.permissions)
        .catch(err => console.error("Error saving worker perms:", err));

    // Flat lookup update for rules scalability
    if (worker.id && worker.email) {
        const key = worker.email.toLowerCase().replace(/\./g, ',');
        db.ref(`companies/${currentCompany}/users/${key}`).set(worker.id)
            .catch(err => console.error("Error updating user email mapping:", err));
        db.ref(`companies/${currentCompany}/userPermissions/${worker.id}`).set({
            email: worker.email.toLowerCase(),
            ...worker.permissions
        }).catch(err => console.error("Error updating flat user permissions:", err));
    }
    alert("Permissions updated!");
}


function saveMonthlySales() {
    const sources = getCompanyData().incomeSources || [];
    let salesForMonth = {};
    sources.forEach(s => {
        const inputId = 'sales-input-' + s.replace(/[^a-zA-Z0-9]/g, '');
        const el = document.getElementById(inputId);
        if (el) {
            salesForMonth[s] = parseFloat(el.value) || 0;
        }
    });
    if (!getCompanyData().monthlySales) getCompanyData().monthlySales = {};
    getCompanyData().monthlySales[currentGlobalMonth] = salesForMonth;

    // Targeted write to monthlySales for current month
    db.ref(`companies/${currentCompany}/monthlySales/${currentGlobalMonth}`).set(salesForMonth)
        .catch(err => console.error("Error saving monthly sales:", err));
    alert(`Sales successfully saved for ${currentGlobalMonth} 💰`);
}



// --- COMMUNICATION & NOTES SYSTEM ---
let noteAttachmentType = null; // 'image' or 'voice'
let noteAttachmentData = null; // base64 Data URL
let noteMediaRecorder = null;
let noteAudioChunks = [];
let noteRecordingTimer = null;
let noteRecordingDuration = 0;
let noteRecorderShouldSave = false;

function triggerNoteImageUpload(source) {
    if (noteMediaRecorder && noteMediaRecorder.state === 'recording') {
        stopVoiceRecording(false);
    }
    if (source === 'camera') {
        document.getElementById('note-camera-input').click();
    } else {
        document.getElementById('note-image-input').click();
    }
}

function handleNoteImageSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    compressImage(file, (base64Img) => {
        noteAttachmentType = 'image';
        noteAttachmentData = base64Img;
        updateNoteAttachmentPreview();
    });
}

function toggleVoiceRecording() {
    if (noteMediaRecorder && noteMediaRecorder.state === 'recording') {
        stopVoiceRecording(true);
        return;
    }

    clearNoteAttachment();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Microphone recording is not supported in this browser or environment.");
        return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            noteAudioChunks = [];
            let options = { mimeType: 'audio/webm' };
            if (!MediaRecorder.isTypeSupported('audio/webm')) {
                options = { mimeType: 'audio/ogg' };
            }
            if (!MediaRecorder.isTypeSupported('audio/ogg')) {
                options = {};
            }

            try {
                noteMediaRecorder = new MediaRecorder(stream, options);
            } catch (e) {
                noteMediaRecorder = new MediaRecorder(stream);
            }

            noteMediaRecorder.ondataavailable = e => {
                if (e.data && e.data.size > 0) {
                    noteAudioChunks.push(e.data);
                }
            };

            noteMediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());

                if (noteRecorderShouldSave && noteAudioChunks.length > 0) {
                    const audioBlob = new Blob(noteAudioChunks, { type: noteMediaRecorder.mimeType || 'audio/octet-stream' });
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = () => {
                        noteAttachmentType = 'voice';
                        noteAttachmentData = reader.result;
                        updateNoteAttachmentPreview();
                    };
                }
            };

            noteRecorderShouldSave = false;
            noteMediaRecorder.start();

            document.getElementById('note-voice-recording-ui').style.display = 'flex';
            const recordBtn = document.getElementById('note-btn-record-voice');
            recordBtn.innerHTML = '🛑 Stop Recording';
            recordBtn.style.borderColor = 'var(--danger)';
            recordBtn.style.color = 'var(--danger)';

            noteRecordingDuration = 0;
            document.getElementById('recording-timer').innerText = '0:00';
            clearInterval(noteRecordingTimer);
            noteRecordingTimer = setInterval(() => {
                noteRecordingDuration++;
                const mins = Math.floor(noteRecordingDuration / 60);
                const secs = noteRecordingDuration % 60;
                document.getElementById('recording-timer').innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

                if (noteRecordingDuration >= 120) {
                    stopVoiceRecording(true);
                }
            }, 1000);
        })
        .catch(err => {
            console.error("Microphone access error:", err);
            if (typeof AndroidInterface !== 'undefined') {
                document.getElementById('apk-permission-modal').style.display = 'flex';
            } else {
                alert("Unable to access microphone. Please make sure that your phone's browser or the Burgeroov App has Microphone permissions enabled in your phone's Settings 🎤");
            }
        });
}

function stopVoiceRecording(save) {
    if (!noteMediaRecorder || noteMediaRecorder.state !== 'recording') return;

    noteRecorderShouldSave = save;
    noteMediaRecorder.stop();

    clearInterval(noteRecordingTimer);
    noteRecordingTimer = null;

    document.getElementById('note-voice-recording-ui').style.display = 'none';
    const recordBtn = document.getElementById('note-btn-record-voice');
    recordBtn.innerHTML = '🎤 Record Voice Note';
    recordBtn.style.borderColor = 'var(--border-color)';
    recordBtn.style.color = 'var(--text-main)';
}

function updateNoteAttachmentPreview() {
    const previewEl = document.getElementById('note-attachment-preview');
    const contentEl = document.getElementById('note-preview-content');
    if (!previewEl || !contentEl) return;

    previewEl.style.display = 'block';
    contentEl.innerHTML = '';

    if (noteAttachmentType === 'image') {
        contentEl.innerHTML = `
                    <div style="position:relative; display:inline-block; max-width: 100%;">
                        <img src="${noteAttachmentData}" style="max-height:100px; max-width:100%; border-radius:6px; border:1px solid var(--border-color);" alt="Attachment preview">
                        <span style="display:block; font-size:0.75rem; color:var(--text-muted); margin-top:4px;">📷 Image Selected</span>
                    </div>
                `;
    } else if (noteAttachmentType === 'voice') {
        contentEl.innerHTML = `
                    <div style="display:flex; align-items:center; gap:8px; width: 100%; max-width: calc(100% - 30px); flex-wrap: wrap;">
                        <span style="font-size:1.25rem;">🎤</span>
                        <audio src="${noteAttachmentData}" controls style="height:36px; max-width:100%;"></audio>
                        <span style="font-size:0.75rem; color:var(--text-muted); white-space:nowrap;">Voice note attached</span>
                    </div>
                `;
    }
}

function clearNoteAttachment() {
    noteAttachmentType = null;
    noteAttachmentData = null;
    document.getElementById('note-attachment-preview').style.display = 'none';
    document.getElementById('note-preview-content').innerHTML = '';
    document.getElementById('note-image-input').value = '';

    const recordBtn = document.getElementById('note-btn-record-voice');
    if (recordBtn) {
        recordBtn.innerHTML = '🎤 Record Voice Note';
        recordBtn.style.borderColor = 'var(--border-color)';
        recordBtn.style.color = 'var(--text-main)';
    }
    const recordUI = document.getElementById('note-voice-recording-ui');
    if (recordUI) recordUI.style.display = 'none';

    if (noteRecordingTimer) {
        clearInterval(noteRecordingTimer);
        noteRecordingTimer = null;
    }
}

// Reply Attachments state
let replyAttachmentTypes = {}; // noteId -> 'image' | 'voice'
let replyAttachmentDatas = {}; // noteId -> base64
let replyMediaRecorders = {}; // noteId -> MediaRecorder
let replyAudioChunks = {}; // noteId -> array
let replyRecordingTimers = {}; // noteId -> intervalId
let replyRecordingDurations = {}; // noteId -> int
let replyRecordersShouldSave = {}; // noteId -> bool

function triggerReplyImageUpload(noteId, source) {
    if (replyMediaRecorders[noteId] && replyMediaRecorders[noteId].state === 'recording') {
        stopReplyVoiceRecording(noteId, false);
    }

    const inputId = source === 'camera' ? 'reply-camera-input-global' : 'reply-image-input-global';
    const fileInput = document.getElementById(inputId);
    if (!fileInput) return;

    fileInput.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        compressImage(file, (base64Img) => {
            replyAttachmentTypes[noteId] = 'image';
            replyAttachmentDatas[noteId] = base64Img;
            updateReplyAttachmentPreview(noteId);
        });
    };

    fileInput.click();
}

function toggleReplyVoiceRecording(noteId) {
    if (replyMediaRecorders[noteId] && replyMediaRecorders[noteId].state === 'recording') {
        stopReplyVoiceRecording(noteId, true);
        return;
    }

    clearReplyAttachment(noteId);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Microphone recording is not supported in this browser or environment.");
        return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            replyAudioChunks[noteId] = [];
            let options = { mimeType: 'audio/webm' };
            if (!MediaRecorder.isTypeSupported('audio/webm')) {
                options = { mimeType: 'audio/ogg' };
            }
            if (!MediaRecorder.isTypeSupported('audio/ogg')) {
                options = {};
            }

            try {
                replyMediaRecorders[noteId] = new MediaRecorder(stream, options);
            } catch (e) {
                replyMediaRecorders[noteId] = new MediaRecorder(stream);
            }

            replyMediaRecorders[noteId].ondataavailable = e => {
                if (e.data && e.data.size > 0) {
                    replyAudioChunks[noteId].push(e.data);
                }
            };

            replyMediaRecorders[noteId].onstop = () => {
                stream.getTracks().forEach(track => track.stop());

                if (replyRecordersShouldSave[noteId] && replyAudioChunks[noteId].length > 0) {
                    const audioBlob = new Blob(replyAudioChunks[noteId], { type: replyMediaRecorders[noteId].mimeType || 'audio/octet-stream' });
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = () => {
                        replyAttachmentTypes[noteId] = 'voice';
                        replyAttachmentDatas[noteId] = reader.result;
                        updateReplyAttachmentPreview(noteId);
                    };
                }
            };

            replyRecordersShouldSave[noteId] = false;
            replyMediaRecorders[noteId].start();

            document.getElementById(`reply-voice-ui-${noteId}`).style.display = 'flex';
            const recordBtn = document.getElementById(`reply-btn-voice-${noteId}`);
            if (recordBtn) {
                recordBtn.innerHTML = '🛑 Stop';
                recordBtn.style.borderColor = 'var(--danger)';
                recordBtn.style.color = 'var(--danger)';
            }

            replyRecordingDurations[noteId] = 0;
            document.getElementById(`reply-timer-${noteId}`).innerText = '0:00';
            clearInterval(replyRecordingTimers[noteId]);
            replyRecordingTimers[noteId] = setInterval(() => {
                replyRecordingDurations[noteId]++;
                const mins = Math.floor(replyRecordingDurations[noteId] / 60);
                const secs = replyRecordingDurations[noteId] % 60;
                document.getElementById(`reply-timer-${noteId}`).innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

                if (replyRecordingDurations[noteId] >= 120) {
                    stopReplyVoiceRecording(noteId, true);
                }
            }, 1000);
        })
        .catch(err => {
            console.error("Microphone access error:", err);
            if (typeof AndroidInterface !== 'undefined') {
                document.getElementById('apk-permission-modal').style.display = 'flex';
            } else {
                alert("Unable to access microphone. Please make sure that your phone's browser or the Burgeroov App has Microphone permissions enabled in your phone's Settings 🎤");
            }
        });
}

function stopReplyVoiceRecording(noteId, save) {
    if (!replyMediaRecorders[noteId] || replyMediaRecorders[noteId].state !== 'recording') return;

    replyRecordersShouldSave[noteId] = save;
    replyMediaRecorders[noteId].stop();

    clearInterval(replyRecordingTimers[noteId]);
    replyRecordingTimers[noteId] = null;

    document.getElementById(`reply-voice-ui-${noteId}`).style.display = 'none';
    const recordBtn = document.getElementById(`reply-btn-voice-${noteId}`);
    if (recordBtn) {
        recordBtn.innerHTML = '🎤 Voice';
        recordBtn.style.borderColor = 'var(--border-color)';
        recordBtn.style.color = 'var(--text-main)';
    }
}

function updateReplyAttachmentPreview(noteId) {
    const previewEl = document.getElementById(`reply-preview-${noteId}`);
    const contentEl = document.getElementById(`reply-preview-content-${noteId}`);
    if (!previewEl || !contentEl) return;

    previewEl.style.display = 'block';
    contentEl.innerHTML = '';

    const type = replyAttachmentTypes[noteId];
    const data = replyAttachmentDatas[noteId];

    if (type === 'image') {
        contentEl.innerHTML = `
                    <div style="position:relative; display:inline-block; max-width: 100%;">
                        <img src="${data}" style="max-height:80px; max-width:100%; border-radius:6px; border:1px solid var(--border-color);" alt="Reply preview">
                        <span style="display:block; font-size:0.7rem; color:var(--text-muted); margin-top:2px;">📷 Image Selected</span>
                    </div>
                `;
    } else if (type === 'voice') {
        contentEl.innerHTML = `
                    <div style="display:flex; align-items:center; gap:6px; width: 100%; max-width: calc(100% - 24px); flex-wrap: wrap;">
                        <span style="font-size:1.1rem;">🎤</span>
                        <audio src="${data}" controls style="height:32px; max-width:100%;"></audio>
                    </div>
                `;
    }
}

function clearReplyAttachment(noteId) {
    delete replyAttachmentTypes[noteId];
    delete replyAttachmentDatas[noteId];

    const previewEl = document.getElementById(`reply-preview-${noteId}`);
    if (previewEl) previewEl.style.display = 'none';
    const contentEl = document.getElementById(`reply-preview-content-${noteId}`);
    if (contentEl) contentEl.innerHTML = '';

    const recordBtn = document.getElementById(`reply-btn-voice-${noteId}`);
    if (recordBtn) {
        recordBtn.innerHTML = '🎤 Voice';
        recordBtn.style.borderColor = 'var(--border-color)';
        recordBtn.style.color = 'var(--text-main)';
    }
    const recordUI = document.getElementById(`reply-voice-ui-${noteId}`);
    if (recordUI) recordUI.style.display = 'none';

    if (replyRecordingTimers[noteId]) {
        clearInterval(replyRecordingTimers[noteId]);
        delete replyRecordingTimers[noteId];
    }
}

function postManagerNote() {
    const text = document.getElementById('manage-note-text').value.trim();
    if (!text && !noteAttachmentData) return alert("Write a note or add a media attachment first.");

    const privacy = document.querySelector('input[name="note-privacy"]:checked').value;
    let targets = [];

    if (privacy === 'private') {
        const checkboxes = document.querySelectorAll('.private-target-cb:checked');
        checkboxes.forEach(cb => targets.push(cb.value));
    }

    const nowMs = Date.now();
    const newNote = {
        id: nowMs.toString(),
        timestamp: nowMs,
        text: text,
        date: formatTimestamp(),
        author: currentUser.email,
        isPrivate: privacy === 'private',
        targetWorkers: targets,
        replies: [],
        attachmentType: noteAttachmentType || null,
        attachmentData: noteAttachmentData || null
    };

    if (!getCompanyData().managerNotes) getCompanyData().managerNotes = [];
    getCompanyData().managerNotes.unshift(newNote);
    document.getElementById('manage-note-text').value = '';

    document.querySelectorAll('.private-target-cb').forEach(cb => cb.checked = false);
    clearNoteAttachment();

    // Targeted write to managerNotes
    db.ref('companies/' + currentCompany + '/managerNotes/' + newNote.id).set(newNote)
        .then(() => {
            if (typeof logActivity === 'function') {
                const targetNames = targets.map(tid => {
                    const w = getCompanyData().workers.find(wk => wk.id === tid);
                    return w ? w.name : tid;
                }).join(', ');
                const detailsStr = privacy === 'private' ? `private note to ${targetNames || 'No targets'}` : 'public note';
                logActivity('perf_note', targets[0] || 'all', targetNames || 'All Workers', `Posted a performance note: "${text}" (${detailsStr})`);
            }
        })
        .catch(error => {
            console.error("Error saving note:", error);
            alert("Failed to save note.");
        });
}

function deleteManagerNote(id) {
    if (!confirm("Delete this note entirely?")) return;
    getCompanyData().managerNotes = getCompanyData().managerNotes.filter(n => n.id !== id);

    // Targeted delete from managerNotes
    db.ref('companies/' + currentCompany + '/managerNotes/' + id).remove()
        .then(() => {
            if (typeof logActivity === 'function') {
                logActivity('perf_note', 'multiple', 'Workers', `Deleted performance note (ID: ${id})`);
            }
        })
        .catch(error => {
            console.error("Error deleting note:", error);
            alert("Failed to delete note.");
        });
}

function editManagerNote(id) {
    const isAr = currentAppLang === 'ar';
    const notes = getCompanyData().managerNotes || [];
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const now = Date.now();
    const noteTime = note.timestamp || parseInt(note.id) || 0;
    const ageMs = now - noteTime;
    const TWO_MINS_MS = 2 * 60 * 1000;

    const isAuthor = currentUser && currentUser.email && note.author && (note.author.toLowerCase() === currentUser.email.toLowerCase());
    const isAdmin = currentUser && currentUser.role === 'admin';

    if (!isAuthor && !isAdmin) {
        alert(isAr ? 'لا يمكنك تعديل هذه الملاحظة.' : 'You do not have permission to edit this note.');
        return;
    }

    if (ageMs > TWO_MINS_MS) {
        alert(isAr ? 'عذراً، لا يمكن تعديل الملاحظة بعد مرور أكثر من دقيقتين من نشرها.' : 'Notes can only be edited within 2 minutes of publishing.');
        return;
    }

    const newText = prompt(isAr ? 'تعديل الملاحظة:' : 'Edit note text:', note.text || '');
    if (newText === null) return;
    const trimmed = newText.trim();
    if (!trimmed && !note.attachmentData) {
        alert(isAr ? 'لا يمكن ترك الملاحظة فارغة.' : 'Note content cannot be empty.');
        return;
    }

    note.text = trimmed;
    db.ref(`companies/${currentCompany}/managerNotes/${id}`).update({
        text: trimmed,
        editedAt: now
    }).then(() => {
        renderNotes();
    }).catch(err => {
        console.error("Error editing note:", err);
        alert(isAr ? 'حدث خطأ أثناء تعديل الملاحظة.' : 'Error editing note.');
    });
}

function addNoteReply(noteId) {
    const input = document.getElementById(`reply-input-${noteId}`);
    const text = input.value.trim();
    const type = replyAttachmentTypes[noteId] || null;
    const data = replyAttachmentDatas[noteId] || null;

    if (!text && !data) return;

    const note = getCompanyData().managerNotes.find(n => n.id === noteId);
    if (note) {
        if (!note.replies || Array.isArray(note.replies)) {
            const obj = {};
            if (note.replies && Array.isArray(note.replies)) {
                note.replies.forEach((r, idx) => {
                    obj[idx.toString()] = r;
                });
            }
            note.replies = obj;
        }

        const replyId = Date.now().toString();
        const newReply = {
            author: currentUser.email,
            text: text,
            date: formatTimestamp(),
            attachmentType: type,
            attachmentData: data
        };
        note.replies[replyId] = newReply;

        input.value = '';
        clearReplyAttachment(noteId);

        // Targeted write to replies subnode using the unique key
        db.ref('companies/' + currentCompany + '/managerNotes/' + noteId + '/replies/' + replyId).set(newReply)
            .catch(error => {
                console.error("Error saving reply:", error);
                alert("Failed to save reply.");
            });
    }
}

function deleteNoteReply(noteId, replyKey) {
    if (!confirm("Are you sure you want to delete this reply?")) return;
    const note = getCompanyData().managerNotes.find(n => n.id === noteId);
    if (note && note.replies && note.replies[replyKey]) {
        const r = note.replies[replyKey];
        const isAdmin = currentUser && currentUser.role === 'admin';
        const isAuthor = currentUser && r.author === currentUser.email;
        if (!isAdmin && !isAuthor) {
            alert("You don't have permission to delete this reply.");
            return;
        }

        delete note.replies[replyKey];

        // Targeted write to remove from Firebase
        db.ref(`companies/${currentCompany}/managerNotes/${noteId}/replies/${replyKey}`).remove()
            .then(() => {
                renderNotes();
            })
            .catch(err => {
                console.error("Error deleting reply:", err);
                alert("Failed to delete reply.");
            });
    }
}

function renderNotes() {
    if (currentTab !== 'notes') return;
    const isAr = currentAppLang === 'ar';

    const cbContainer = document.getElementById('private-worker-checkboxes');
    if (cbContainer) {
        cbContainer.innerHTML = '';
        getCompanyData().workers.forEach(w => {
            cbContainer.innerHTML += `
                        <label style="display:flex; align-items:center; gap:6px; cursor:pointer; text-transform:none; margin:0; font-size:0.9rem; background:var(--input-bg); padding:8px; border-radius:6px; border:1px solid var(--border-color);">
                            <input type="checkbox" class="private-target-cb" value="${w.id}"> ${w.name} <span style="font-size:0.75rem; color:var(--text-muted); padding-left:4px;">(${w.role})</span>
                        </label>
                    `;
        });
    }

    const feed = document.getElementById('manage-notes-feed');
    feed.innerHTML = '';
    const allNotes = getCompanyData().managerNotes || [];

    const visibleNotes = allNotes.filter(n => {
        if (currentUser.role === 'admin') return true;
        if (!n.isPrivate) return true;
        const myWorkerProfile = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
        return myWorkerProfile && n.targetWorkers && n.targetWorkers.includes(myWorkerProfile.id);
    });

    if (visibleNotes.length === 0) {
        feed.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding: 40px; font-size: 1.1rem;">No notes available.</p>';
    }

    visibleNotes.forEach(n => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.cssText = `border-left: ${n.isPrivate ? '6px solid var(--danger)' : '6px solid var(--info)'}; padding: 20px; margin-bottom:15px; border-radius: 12px;`;

        const now = Date.now();
        const noteTime = n.timestamp || parseInt(n.id) || 0;
        const ageMs = now - noteTime;
        const isWithin2Mins = ageMs <= 2 * 60 * 1000;
        const isAuthor = currentUser && currentUser.email && n.author && (n.author.toLowerCase() === currentUser.email.toLowerCase());
        const isAdmin = currentUser && currentUser.role === 'admin';

        let editBtn = '';
        if ((isAuthor || isAdmin) && isWithin2Mins) {
            editBtn = `<button onclick="editManagerNote('${n.id}')" class="btn-outline" style="padding:2px 8px; font-size:0.75rem; border-radius:4px; border:1px solid var(--primary); color:var(--primary); font-weight:600; cursor:pointer; margin-left:6px;" title="${isAr ? 'تعديل الملاحظة' : 'Edit note'}">✏️ ${isAr ? 'تعديل' : 'Edit'}</button>`;
        }

        let delBtn = (currentUser.role === 'admin') ? `<button onclick="deleteManagerNote('${n.id}')" class="btn-outline-danger" style="padding:4px 10px; font-size:0.8rem; border:none; text-decoration:underline;">Delete Thread</button>` : '';
        let lockIcon = n.isPrivate ? `<span class="badge" style="background:var(--danger); font-size:0.85rem;">🔒 Private Note</span>` : `<span class="badge" style="background:var(--info); font-size:0.85rem;">📢 Public Announcement</span>`;

        let repliesHtml = '';
        const replies = n.replies ? Object.entries(n.replies) : [];
        if (replies.length > 0) {
            repliesHtml = replies.map(([replyKey, r]) => {
                let replyTextHtml = r.text ? `<div style="color:var(--text-main); font-size:0.95rem;">${r.text}</div>` : '';
                let replyAttachmentHtml = '';
                if (r.attachmentType === 'image' && r.attachmentData) {
                    replyAttachmentHtml = `
                                <div style="margin-top: 8px; max-width: 150px; cursor: pointer; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color);" onclick="showImage('${r.attachmentData.replace(/'/g, "\\'")}')">
                                    <img src="${r.attachmentData}" alt="Reply attachment" style="width: 100%; display: block; height: auto;">
                                </div>
                            `;
                } else if (r.attachmentType === 'voice' && r.attachmentData) {
                    replyAttachmentHtml = `
                                <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px; background: var(--input-bg); padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border-color); max-width: 250px;">
                                    <span style="font-size: 1.1rem; line-height: 1;">🎤</span>
                                    <audio src="${r.attachmentData}" controls style="flex: 1; height: 28px; max-width: calc(100% - 20px);"></audio>
                                </div>
                            `;
                }

                let deleteReplyBtn = '';
                if (currentUser && (r.author === currentUser.email || currentUser.role === 'admin')) {
                    deleteReplyBtn = `<button onclick="deleteNoteReply('${n.id}', '${replyKey}')" class="btn-outline-danger" style="border:none; background:none; text-decoration:underline; font-size:0.75rem; padding:0 0 0 8px; cursor:pointer;">Delete</button>`;
                }

                return `
                            <div style="background: var(--bg-color); padding: 12px 16px; border-radius: 8px; margin-top: 10px; border-left: 3px solid var(--border-color);">
                                <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-muted); margin-bottom:6px;">
                                    <strong>${r.author}</strong> <span>🕒 ${r.date}${deleteReplyBtn}</span>
                                </div>
                                ${replyTextHtml}
                                ${replyAttachmentHtml}
                            </div>
                        `;
            }).join('');
        }

        let replyBox = !n.isPrivate ? `
                    <div style="margin-top:16px; border-top:1px dashed var(--border-color); padding-top:16px;">
                        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                            <input type="text" id="reply-input-${n.id}" placeholder="Write a reply..." style="flex:1; min-width: 150px; padding: 10px; font-size:0.9rem; margin: 0;">
                            
                            <div style="display:flex; gap:6px;">
                                <button type="button" class="btn-outline" style="padding: 8px 10px; min-height:36px; height:36px; font-size: 0.8rem; border-radius: 6px; display:flex; align-items:center; gap:4px; border:1px solid var(--border-color); background:var(--card-bg); color:var(--text-main); cursor:pointer;" onclick="triggerReplyImageUpload('${n.id}', 'camera')" title="Take Photo">
                                    📷 Camera
                                </button>
                                <button type="button" class="btn-outline" style="padding: 8px 10px; min-height:36px; height:36px; font-size: 0.8rem; border-radius: 6px; display:flex; align-items:center; gap:4px; border:1px solid var(--border-color); background:var(--card-bg); color:var(--text-main); cursor:pointer;" onclick="triggerReplyImageUpload('${n.id}', 'gallery')" title="Choose Photo">
                                    🖼️ Gallery
                                </button>
                                <button type="button" id="reply-btn-voice-${n.id}" class="btn-outline" style="padding: 8px 10px; min-height:36px; height:36px; font-size: 0.8rem; border-radius: 6px; display:flex; align-items:center; gap:4px; border:1px solid var(--border-color); background:var(--card-bg); color:var(--text-main); cursor:pointer;" onclick="toggleReplyVoiceRecording('${n.id}')" title="Record Voice">
                                    🎤 Voice
                                </button>
                            </div>
                            
                            <button onclick="addNoteReply('${n.id}')" class="btn-info" style="padding: 8px 14px; min-height:36px; height:36px; font-size: 0.85rem; border-radius: 6px;">Reply</button>
                        </div>
                        
                        <!-- Voice Recording UI (collapsible) -->
                        <div id="reply-voice-ui-${n.id}" style="display:none; align-items:center; gap:8px; margin-top:8px; background:var(--input-bg); padding:6px 10px; border-radius:6px; border:1px solid var(--border-color); font-size:0.85rem;">
                            <span class="recording-pulse" style="display:inline-block; width:8px; height:8px; background-color:#dc2626; border-radius:50%;"></span>
                            <span id="reply-timer-${n.id}" style="font-family:monospace; font-weight:600;">0:00</span>
                            <button type="button" class="btn-success" style="padding:3px 8px; font-size:0.75rem; min-height:24px; height:24px; line-height:1; cursor:pointer;" onclick="stopReplyVoiceRecording('${n.id}', true)">Done</button>
                            <button type="button" class="btn-outline-danger" style="padding:3px 8px; font-size:0.75rem; min-height:24px; height:24px; line-height:1; border:1px solid var(--danger); background:transparent; color:var(--danger); border-radius:4px; cursor:pointer;" onclick="stopReplyVoiceRecording('${n.id}', false)">Cancel</button>
                        </div>
                        
                        <!-- Attachment Preview -->
                        <div id="reply-preview-${n.id}" style="display:none; margin-top:8px; padding:8px; background:var(--input-bg); border-radius:6px; border:1px solid var(--border-color); position:relative;">
                            <div id="reply-preview-content-${n.id}"></div>
                            <button type="button" onclick="clearReplyAttachment('${n.id}')" style="position:absolute; top:6px; right:6px; background:var(--danger); color:white; border:none; border-radius:50%; width:18px; height:18px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; font-size:0.75rem; line-height:1;">✕</button>
                        </div>
                    </div>
                ` : '';

        let textHtml = n.text ? `<div style="font-size:1.1rem; color:var(--text-main); white-space: pre-wrap; line-height: 1.6; margin-bottom: 16px;">${n.text}</div>` : '';
        let attachmentHtml = '';
        if (n.attachmentType === 'image' && n.attachmentData) {
            attachmentHtml = `
                        <div style="margin-bottom: 16px; max-width: 320px; cursor: pointer; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);" onclick="showImage('${n.attachmentData.replace(/'/g, "\\'")}')">
                            <img src="${n.attachmentData}" alt="Attachment" style="width: 100%; display: block; height: auto; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                        </div>
                    `;
        } else if (n.attachmentType === 'voice' && n.attachmentData) {
            attachmentHtml = `
                        <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px; background: var(--input-bg); padding: 12px 16px; border-radius: 10px; border: 1px solid var(--border-color); max-width: 360px; box-sizing: border-box;">
                            <span style="font-size: 1.4rem; line-height: 1;">🎤</span>
                            <audio src="${n.attachmentData}" controls style="flex: 1; height: 36px; max-width: calc(100% - 30px);"></audio>
                        </div>
                    `;
        }

        div.innerHTML = `
                    <div class="flex-between" style="margin-bottom:12px;">
                        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                            ${lockIcon} <span style="font-size:0.85rem; color:var(--text-muted);">🕒 ${n.date}</span>
                            ${editBtn}
                        </div>
                        ${delBtn}
                    </div>
                    ${textHtml}
                    ${attachmentHtml}
                    ${repliesHtml}
                    ${replyBox}
                `;
        feed.appendChild(div);
    });
}

// --- SALES & POS SYSTEM ---
let currentSalesTimeframe = 'day';
let currentSalesChartType = 'bar'; // 'bar' | 'line' | 'doughnut'
let _salesChartInstance = null;  // Chart.js instance handle

function setSalesTimeframe(tf) {
    currentSalesTimeframe = tf;
    ['day', 'week', 'month', 'year', 'custom'].forEach(id => {
        const btn = document.getElementById('tf-' + id);
        if (btn) {
            btn.style.background = (id === tf) ? 'var(--primary)' : 'transparent';
            btn.style.color = (id === tf) ? 'white' : 'var(--text-muted)';
        }
    });

    const datePicker = document.getElementById('sales-date-picker');
    if (datePicker) datePicker.style.display = tf === 'day' ? 'inline-block' : 'none';

    const customRange = document.getElementById('sales-custom-range');
    if (customRange) customRange.style.display = tf === 'custom' ? 'flex' : 'none';

    renderManaging();
}

function setSalesChartType(type) {
    currentSalesChartType = type;
    ['bar', 'line', 'doughnut'].forEach(t => {
        const btn = document.getElementById('sct-' + t);
        if (btn) {
            const active = t === type;
            btn.style.background = active ? 'var(--primary)' : 'transparent';
            btn.style.color = active ? '#fff' : 'var(--text-muted)';
            btn.style.border = active ? 'none' : '1px solid var(--border-color)';
        }
    });
    renderManaging();
}

function addIncomeSource() {
    const source = document.getElementById('new-income-source').value.trim();
    if (source) {
        if (!getCompanyData().incomeSources) getCompanyData().incomeSources = [];
        if (!getCompanyData().incomeSources.includes(source)) {
            getCompanyData().incomeSources.push(source);
            document.getElementById('new-income-source').value = '';

            // Targeted write to incomeSources
            db.ref('companies/' + currentCompany + '/incomeSources').set(getCompanyData().incomeSources)
                .catch(err => console.error("Error adding income source:", err));
        } else {
            alert("This income source already exists.");
        }
    }
}

function deleteIncomeSource(sourceName) {
    if (!confirm(`Delete the income source '${sourceName}'?`)) return;
    getCompanyData().incomeSources = getCompanyData().incomeSources.filter(s => s !== sourceName);

    // Targeted write to incomeSources
    db.ref('companies/' + currentCompany + '/incomeSources').set(getCompanyData().incomeSources)
        .catch(err => console.error("Error deleting income source:", err));
}

function logSaleTransaction() {
    const amountInput = document.getElementById('new-sale-amount');
    const methodInput = document.getElementById('new-sale-method');

    const amount = parseFloat(amountInput.value);
    const method = methodInput.value;

    if (isNaN(amount) || amount <= 0 || !method) {
        alert("Please enter a valid amount and select a payment method.");
        return;
    }

    const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
    const workerId = myWorker ? myWorker.id : "";

    const now = new Date();
    const newLog = {
        id: Date.now().toString(),
        amount: amount,
        method: method,
        date: formatTimestamp(),
        timestamp: now.getTime(),
        month: currentGlobalMonth,
        cashier: currentUser.email,
        workerId: workerId
    };

    if (!getCompanyData().salesLogs) getCompanyData().salesLogs = [];
    getCompanyData().salesLogs.unshift(newLog);

    amountInput.value = '';

    // Targeted write for sales transactions
    db.ref('companies/' + currentCompany + '/salesLogs/' + newLog.id).set(newLog)
        .then(() => {
            logActivity('sales', workerId, myWorker ? myWorker.name : 'System', `Entered sale transaction of SAR ${amount} via ${method}`);
        })
        .catch(error => {
            console.error("Error saving sale:", error);
            alert("Failed to save transaction.");
        });
}

function deleteSaleTransaction(id) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? "هل أنت تأكد من حذف هذا السجل؟" : "Delete this transaction record?")) return;
    const companyData = getCompanyData();
    if (!companyData.salesLogs) companyData.salesLogs = [];
    const oldLog = companyData.salesLogs.find(l => l && l.id === id);
    companyData.salesLogs = companyData.salesLogs.filter(l => l && l.id !== id);

    // Render immediately to update local UI
    renderAll();

    // 1. Remove individual child key if stored as object map
    const p1 = db.ref('companies/' + currentCompany + '/salesLogs/' + id).remove();
    // 2. Overwrite salesLogs array in Firebase to handle array storage format
    const p2 = db.ref('companies/' + currentCompany + '/salesLogs').set(companyData.salesLogs);

    Promise.all([p1, p2])
        .then(() => {
            if (oldLog) {
                logActivity('sales_delete', oldLog.workerId || '', oldLog.cashier || 'System', `Deleted/Undid sale transaction of SAR ${oldLog.amount} via ${oldLog.method}`);
            }
            renderAll();
        })
        .catch(error => {
            console.error("Error deleting sale:", error);
            alert(isAr ? "فشل حذف المعاملة." : "Failed to delete transaction.");
            renderAll();
        });
}

function logPastSaleTransaction() {
    const amount = parseFloat(document.getElementById('past-sale-amount').value);
    const method = document.getElementById('past-sale-method').value;
    const dateStr = document.getElementById('past-sale-date').value;
    const password = document.getElementById('past-sale-password').value;

    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount.'); return;
    }
    if (!method) { alert('Please select a payment method.'); return; }
    if (!dateStr) { alert('Please select a past date.'); return; }
    if (password !== 'N123456') {
        alert('❌ Incorrect password. Access denied.');
        document.getElementById('past-sale-password').value = '';
        return;
    }

    const parts = dateStr.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (d >= today) { alert('Please select a date in the past (not today or future).'); return; }

    const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
    const workerId = myWorker ? myWorker.id : "";

    const targetMonthStr = `${parts[0]}-${parts[1]}`;

    const newLog = {
        id: Date.now().toString(),
        amount: amount,
        method: method,
        date: dateStr + ' ' + '12:00:00',
        timestamp: d.getTime(),
        month: targetMonthStr,
        cashier: currentUser.email,
        isPastEntry: true,
        workerId: workerId
    };

    if (!getCompanyData().salesLogs) getCompanyData().salesLogs = [];
    getCompanyData().salesLogs.unshift(newLog);

    document.getElementById('past-sale-amount').value = '';
    document.getElementById('past-sale-password').value = '';
    document.getElementById('past-sale-date').value = '';

    db.ref('companies/' + currentCompany + '/salesLogs/' + newLog.id).set(newLog)
        .then(() => {
            logActivity('sales', workerId, myWorker ? myWorker.name : 'System', `Entered past sale transaction of SAR ${amount} via ${method} on date ${dateStr}`);
            renderAll();
        })
        .catch(error => {
            console.error("Error saving past sale:", error);
            alert("Failed to save transaction.");
        });
}

function logDepositTransaction() {
    const amountInput = document.getElementById('new-deposit-amount');
    const dateInput = document.getElementById('new-deposit-date');
    if (!amountInput) return;

    const amount = parseFloat(amountInput.value);
    let dateStr = dateInput ? dateInput.value : '';

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid deposit amount.");
        return;
    }

    const now = new Date();
    let timestamp = now.getTime();
    let dateLabel = "";

    const tzOffset = now.getTimezoneOffset() * 60000;
    const todayLocalStr = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);

    if (dateStr && dateStr !== todayLocalStr) {
        const parts = dateStr.split('-');
        const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
        timestamp = d.getTime();
        dateLabel = dateStr + ' 12:00:00';
    } else {
        timestamp = Date.now();
        dateStr = todayLocalStr;
        dateLabel = formatTimestamp();
    }

    const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
    const workerId = myWorker ? myWorker.id : "";

    const newDeposit = {
        id: Date.now().toString(),
        amount: amount,
        date: dateLabel,
        timestamp: timestamp,
        month: currentGlobalMonth,
        cashier: currentUser.email,
        workerId: workerId
    };

    if (!getCompanyData().depositLogs) getCompanyData().depositLogs = [];
    if (getCompanyData().depositLogs && typeof getCompanyData().depositLogs === 'object' && !Array.isArray(getCompanyData().depositLogs)) {
        getCompanyData().depositLogs = Object.values(getCompanyData().depositLogs);
    }
    getCompanyData().depositLogs.unshift(newDeposit);

    amountInput.value = '';
    if (dateInput) dateInput.value = '';

    db.ref('companies/' + currentCompany + '/depositLogs/' + newDeposit.id).set(newDeposit)
        .then(() => {
            logActivity('deposit', workerId, myWorker ? myWorker.name : 'System', `Logged cashier box deposit of SAR ${amount}`);
            renderAll();
        })
        .catch(error => {
            console.error("Error logging deposit:", error);
            alert("Failed to save deposit.");
        });
}

function deleteDepositTransaction(id) {
    if (!confirm("Delete this deposit record?")) return;
    let logs = getCompanyData().depositLogs || [];
    if (logs && typeof logs === 'object' && !Array.isArray(logs)) {
        logs = Object.values(logs);
    }
    const oldLog = logs.find(l => l.id === id);
    getCompanyData().depositLogs = logs.filter(l => l.id !== id);

    db.ref('companies/' + currentCompany + '/depositLogs/' + id).remove()
        .then(() => {
            if (oldLog) {
                logActivity('deposit_delete', oldLog.workerId, oldLog.cashier, `Deleted deposit of SAR ${oldLog.amount}`);
            }
            renderAll();
        })
        .catch(error => {
            console.error("Error deleting deposit:", error);
            alert("Failed to delete deposit.");
        });
}

function showSwapSelect(id) {
    const btn = document.getElementById(`swap-btn-${id}`);
    const select = document.getElementById(`swap-select-${id}`);
    if (btn && select) {
        btn.style.display = 'none';
        select.style.display = 'inline-block';
        select.focus();
    }
}

function cancelSwapSelect(id) {
    const btn = document.getElementById(`swap-btn-${id}`);
    const select = document.getElementById(`swap-select-${id}`);
    if (btn && select) {
        btn.style.display = 'inline-block';
        select.style.display = 'none';
    }
}

function swapSaleMethod(id, newMethod) {
    if (!newMethod) return;
    const companyData = getCompanyData();
    const salesLogs = companyData.salesLogs || [];
    const logVal = salesLogs.find(l => l.id === id);
    if (!logVal) return;

    const oldMethod = logVal.method;
    if (oldMethod === newMethod) {
        cancelSwapSelect(id);
        return;
    }

    db.ref('companies/' + currentCompany + '/salesLogs/' + id).update({
        method: newMethod
    }).then(() => {
        logActivity('sales', logVal.workerId, logVal.cashier, `Swapped payment method of sale transaction (SAR ${logVal.amount}) from ${oldMethod} to ${newMethod}`);
    }).catch(error => {
        console.error("Error swapping sale method:", error);
        alert("Failed to swap method.");
        cancelSwapSelect(id);
    });
}

function toggleSalesMethod(methodName) {
    let disabled = getCompanyData().disabledSalesMethods || [];
    if (disabled.includes(methodName)) {
        disabled = disabled.filter(m => m !== methodName);
    } else {
        disabled.push(methodName);
    }
    getCompanyData().disabledSalesMethods = disabled;

    // Targeted write to disabledSalesMethods
    db.ref('companies/' + currentCompany + '/disabledSalesMethods').set(disabled)
        .catch(err => console.error("Error toggling sales method:", err));
}

function renderManaging() {
    if (currentTab !== 'managing') return;
    populateWorkerDropdowns();

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const todayLocalStr = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);

    const pastSaleDateInput = document.getElementById('past-sale-date');
    if (pastSaleDateInput && !pastSaleDateInput.value) {
        pastSaleDateInput.value = todayLocalStr;
    }
    const newDepositDateInput = document.getElementById('new-deposit-date');
    if (newDepositDateInput && !newDepositDateInput.value) {
        newDepositDateInput.value = todayLocalStr;
    }

    const isAr = currentAppLang === 'ar';
    const isAdmin = currentUser.role === 'admin';
    const sources = getCompanyData().incomeSources || ['Cash', 'Credit Card'];
    const allLogs = getCompanyData().salesLogs || [];
    const disabledMethods = getCompanyData().disabledSalesMethods || [];

    // Update Method Dropdown in the form
    const methodSelect = document.getElementById('new-sale-method');
    if (methodSelect) {
        const prevVal = methodSelect.value;
        methodSelect.innerHTML = sources.map(s => `<option value="${s}">${s}</option>`).join('');
        if (sources.includes(prevVal)) methodSelect.value = prevVal;
    }
    const pastMethodSelect = document.getElementById('past-sale-method');
    if (pastMethodSelect) {
        const prevVal = pastMethodSelect.value;
        pastMethodSelect.innerHTML = sources.map(s => `<option value="${s}">${s}</option>`).join('');
        if (sources.includes(prevVal)) pastMethodSelect.value = prevVal;
    }
    const salesSpendMethodSelect = document.getElementById('sales-spend-method');
    if (salesSpendMethodSelect) {
        const prevVal = salesSpendMethodSelect.value;
        salesSpendMethodSelect.innerHTML = sources.map(s => `<option value="${s}">${s}</option>`).join('');
        if (sources.includes(prevVal)) salesSpendMethodSelect.value = prevVal;
    }

    // Update Admin Sources List
    const sourcesListDiv = document.getElementById('admin-income-sources-list');
    if (sourcesListDiv) {
        sourcesListDiv.innerHTML = sources.map(s => `
                    <div style="background: var(--bg-color); border: 1px solid var(--border-color); padding: 6px 14px; border-radius: 20px; font-size: 0.95rem; font-weight:600; display: flex; align-items: center; gap: 10px;">
                        ${s} <button onclick="deleteIncomeSource('${s}')" style="background: var(--danger-bg); border: 1px solid var(--danger-border); border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; color: var(--danger); cursor: pointer; padding: 0;">✖</button>
                    </div>
                `).join('');
    }

    // --- FILTER LOGS BY TIMEFRAME ---
    let filteredLogs = [];
    let histoData = {}; // Key: Label (e.g., "10 AM", "Mon"), Value: Sum

    if (currentSalesTimeframe === 'day') {
        const datePicker = document.getElementById('sales-date-picker');
        if (!datePicker.value) {
            const tzOffset = now.getTimezoneOffset() * 60000;
            datePicker.value = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);
        }
        const parts = datePicker.value.split('-');
        const startOfDay = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
        const endOfDay = startOfDay + 86400000;
        filteredLogs = allLogs.filter(l => l.timestamp >= startOfDay && l.timestamp < endOfDay);
        filteredLogs.forEach(l => {
            if (disabledMethods.includes(l.method)) return;
            const h = new Date(l.timestamp).getHours();
            histoData[h + ':00'] = (histoData[h + ':00'] || 0) + l.amount;
        });
    }
    else if (currentSalesTimeframe === 'week') {
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
        filteredLogs = allLogs.filter(l => l.timestamp >= startOfWeek);
        const days = currentAppLang === 'ar' ?
            ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] :
            ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        filteredLogs.forEach(l => {
            if (disabledMethods.includes(l.method)) return;
            histoData[days[new Date(l.timestamp).getDay()]] = (histoData[days[new Date(l.timestamp).getDay()]] || 0) + l.amount;
        });
    }
    else if (currentSalesTimeframe === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        filteredLogs = allLogs.filter(l => l.timestamp >= startOfMonth);
        filteredLogs.forEach(l => {
            if (disabledMethods.includes(l.method)) return;
            const d = new Date(l.timestamp).getDate().toString();
            histoData[d] = (histoData[d] || 0) + l.amount;
        });
    }
    else if (currentSalesTimeframe === 'year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
        filteredLogs = allLogs.filter(l => l.timestamp >= startOfYear);
        const months = currentAppLang === 'ar' ?
            ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'] :
            ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        filteredLogs.forEach(l => {
            if (disabledMethods.includes(l.method)) return;
            histoData[months[new Date(l.timestamp).getMonth()]] = (histoData[months[new Date(l.timestamp).getMonth()]] || 0) + l.amount;
        });
    }
    else if (currentSalesTimeframe === 'custom') {
        const fromPicker = document.getElementById('sales-from-date');
        const toPicker = document.getElementById('sales-to-date');
        if (!fromPicker.value || !toPicker.value) {
            // Don't render until both dates are set
        } else {
            const fParts = fromPicker.value.split('-');
            const tParts = toPicker.value.split('-');
            const startTs = new Date(fParts[0], fParts[1] - 1, fParts[2]).getTime();
            const endTs = new Date(tParts[0], tParts[1] - 1, tParts[2]).getTime() + 86400000;
            filteredLogs = allLogs.filter(l => l.timestamp >= startTs && l.timestamp < endTs);
            filteredLogs.forEach(l => {
                if (disabledMethods.includes(l.method)) return;
                const d = new Date(l.timestamp);
                const key = String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                histoData[key] = (histoData[key] || 0) + l.amount;
            });
        }
    }

    // Filter Deposits by Timeframe
    let allDeposits = getCompanyData().depositLogs || [];
    if (allDeposits && typeof allDeposits === 'object' && !Array.isArray(allDeposits)) {
        allDeposits = Object.values(allDeposits);
    }
    let filteredDeposits = [];

    if (currentSalesTimeframe === 'day') {
        const datePicker = document.getElementById('sales-date-picker');
        const parts = datePicker.value.split('-');
        const startOfDay = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
        const endOfDay = startOfDay + 86400000;
        filteredDeposits = allDeposits.filter(l => l.timestamp >= startOfDay && l.timestamp < endOfDay);
    }
    else if (currentSalesTimeframe === 'week') {
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
        filteredDeposits = allDeposits.filter(l => l.timestamp >= startOfWeek);
    }
    else if (currentSalesTimeframe === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        filteredDeposits = allDeposits.filter(l => l.timestamp >= startOfMonth);
    }
    else if (currentSalesTimeframe === 'year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
        filteredDeposits = allDeposits.filter(l => l.timestamp >= startOfYear);
    }
    else if (currentSalesTimeframe === 'custom') {
        const fromPicker = document.getElementById('sales-from-date');
        const toPicker = document.getElementById('sales-to-date');
        if (fromPicker.value && toPicker.value) {
            const fParts = fromPicker.value.split('-');
            const tParts = toPicker.value.split('-');
            const startTs = new Date(fParts[0], fParts[1] - 1, fParts[2]).getTime();
            const endTs = new Date(tParts[0], tParts[1] - 1, tParts[2]).getTime() + 86400000;
            filteredDeposits = allDeposits.filter(l => l.timestamp >= startTs && l.timestamp < endTs);
        }
    }

    let totalDeposits = 0;
    filteredDeposits.forEach(d => {
        totalDeposits += d.amount;
    });

    // Filter Spend Logs by Timeframe
    let allSpendLogs = getCompanyData().spendLogs || [];
    let filteredSpends = [];
    if (currentSalesTimeframe === 'day') {
        const datePicker = document.getElementById('sales-date-picker');
        const parts = datePicker.value.split('-');
        const startOfDay = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
        const endOfDay = startOfDay + 86400000;
        filteredSpends = allSpendLogs.filter(l => l && l.timestamp >= startOfDay && l.timestamp < endOfDay);
    }
    else if (currentSalesTimeframe === 'week') {
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
        filteredSpends = allSpendLogs.filter(l => l && l.timestamp >= startOfWeek);
    }
    else if (currentSalesTimeframe === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        filteredSpends = allSpendLogs.filter(l => l && l.timestamp >= startOfMonth);
    }
    else if (currentSalesTimeframe === 'year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
        filteredSpends = allSpendLogs.filter(l => l && l.timestamp >= startOfYear);
    }
    else if (currentSalesTimeframe === 'custom') {
        const fromPicker = document.getElementById('sales-from-date');
        const toPicker = document.getElementById('sales-to-date');
        if (fromPicker && toPicker && fromPicker.value && toPicker.value) {
            const fParts = fromPicker.value.split('-');
            const tParts = toPicker.value.split('-');
            const startTs = new Date(fParts[0], fParts[1] - 1, fParts[2]).getTime();
            const endTs = new Date(tParts[0], tParts[1] - 1, tParts[2]).getTime() + 86400000;
            filteredSpends = allSpendLogs.filter(l => l && l.timestamp >= startTs && l.timestamp < endTs);
        }
    }

    let spendByMethod = {};
    let totalCashSpends = 0;
    filteredSpends.forEach(s => {
        const m = s.method || '';
        spendByMethod[m] = (spendByMethod[m] || 0) + s.amount;
    });

    // Calculate Totals for Toggles
    let grandTotal = 0;
    let methodTotals = {};
    sources.forEach(s => methodTotals[s] = 0);

    filteredLogs.forEach(l => {
        if (methodTotals[l.method] !== undefined) {
            methodTotals[l.method] += l.amount;
        } else {
            methodTotals[l.method] = l.amount;
        }
    });

    const cashKey = Object.keys(methodTotals).find(k => k.toLowerCase() === 'cash' || k === 'نقدي' || k === 'كاش');
    const rawCashSales = cashKey ? methodTotals[cashKey] : 0;
    if (cashKey && spendByMethod[cashKey]) {
        totalCashSpends = spendByMethod[cashKey];
    }

    if (cashKey) {
        methodTotals[cashKey] = rawCashSales - totalDeposits - totalCashSpends;
    }

    // Subtract other method spends
    Object.keys(spendByMethod).forEach(m => {
        if (m !== cashKey && methodTotals[m] !== undefined) {
            methodTotals[m] = methodTotals[m] - spendByMethod[m];
        }
    });

    // Sum up active methods to get grand total
    sources.forEach(s => {
        if (!disabledMethods.includes(s) && methodTotals[s] !== undefined) {
            grandTotal += methodTotals[s];
        }
    });

    // Calculate gross sales (Total Salary)
    let totalSalary = 0;
    filteredLogs.forEach(l => {
        totalSalary += l.amount;
    });

    const totalSalaryEl = document.getElementById('sales-total-salary');
    if (totalSalaryEl) {
        totalSalaryEl.textContent = totalSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    document.getElementById('sales-grand-total').textContent = grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Draw Toggles
    const togglesDiv = document.getElementById('sales-method-toggles');
    if (togglesDiv) {
        togglesDiv.innerHTML = Object.keys(methodTotals).map(methodName => {
            const total = methodTotals[methodName];
            const isCounted = !disabledMethods.includes(methodName);

            const bg = isCounted ? 'var(--success-bg)' : 'var(--danger-bg)';
            const border = isCounted ? 'var(--success-border)' : 'var(--danger-border)';
            const color = isCounted ? 'var(--success)' : 'var(--danger)';
            const icon = isCounted ? '✅' : '❌';

            const isCash = methodName.toLowerCase() === 'cash' || methodName === 'نقدي' || methodName === 'كاش';
            let extraHtml = '';
            if (isCash) {
                extraHtml = `
                    <div style="font-size: 0.78rem; border-top: 1px dashed rgba(255,255,255,0.25); margin-top: 8px; padding-top: 8px; display:flex; flex-direction:column; gap:4px; color:inherit;">
                        <div class="flex-between"><span>${isAr ? 'المبيعات النقدية:' : 'Cash Sales:'}</span> <span>SAR ${rawCashSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div class="flex-between"><span>${isAr ? 'الإيداعات:' : 'Deposited:'}</span> <span>SAR ${totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div class="flex-between"><span>${isAr ? 'المصروفات النقدية:' : 'Spent Out:'}</span> <span style="color:#f87171;">SAR ${totalCashSpends.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div class="flex-between" style="font-weight:800; border-top: 1px solid rgba(255,255,255,0.15); margin-top:2px; padding-top:2px;"><span>${isAr ? 'المتبقي بالصندوق:' : 'Left in Box:'}</span> <span>SAR ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                    </div>
                `;
            }

            return `
                        <div onclick="toggleSalesMethod('${methodName}')" style="cursor: pointer; background: ${bg}; border: 2px solid ${border}; color: ${color}; padding: 12px 20px; border-radius: 12px; text-align: left; min-width: 180px; transition: transform 0.1s; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; margin-bottom: 6px;">${icon} ${methodName}</div>
                            <div style="font-size: 1.25rem; font-weight: 800;">SAR ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            ${extraHtml}
                        </div>
                    `;
        }).join('');
    }

    // === Advanced Chart.js Histogram ===
    (function drawSalesChart() {
        const canvas = document.getElementById('sales-main-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Destroy previous instance to avoid canvas reuse errors
        if (_salesChartInstance) {
            _salesChartInstance.destroy();
            _salesChartInstance = null;
        }

        // Resolve CSS var colours for Chart.js (which can't read CSS vars natively)
        const rootStyle = getComputedStyle(document.documentElement);
        const primaryColor = rootStyle.getPropertyValue('--primary').trim() || '#6366f1';
        const secondaryColor = rootStyle.getPropertyValue('--secondary').trim() || '#f59e0b';
        const textMuted = rootStyle.getPropertyValue('--text-muted').trim() || '#94a3b8';
        const borderColor = rootStyle.getPropertyValue('--border-color').trim() || '#e2e8f0';
        const cardBg = rootStyle.getPropertyValue('--card-bg').trim() || '#ffffff';

        const PALETTE = [
            '#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899',
            '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
        ];

        const summaryDiv = document.getElementById('sales-chart-summary');

        if (currentSalesChartType === 'doughnut') {
            // --- DOUGHNUT: breakdown by payment method ---
            const dLabels = Object.keys(methodTotals).filter(m => methodTotals[m] > 0);
            const dData = dLabels.map(m => methodTotals[m]);
            const dColors = dLabels.map((_, i) => PALETTE[i % PALETTE.length]);

            if (dData.length === 0) {
                canvas.style.display = 'none';
                let overlay = document.getElementById('sales-chart-empty');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'sales-chart-empty';
                    overlay.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:0.9rem;color:' + textMuted + ';';
                    canvas.parentElement.appendChild(overlay);
                }
                overlay.textContent = 'No data for this timeframe.';
                overlay.style.display = 'flex';
                if (summaryDiv) summaryDiv.innerHTML = '';
                return;
            }
            canvas.style.display = '';
            const oldOverlay = document.getElementById('sales-chart-empty');
            if (oldOverlay) oldOverlay.style.display = 'none';

            _salesChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: dLabels,
                    datasets: [{
                        data: dData,
                        backgroundColor: dColors,
                        borderColor: cardBg,
                        borderWidth: 3,
                        hoverOffset: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '62%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: ctx => ` ${ctx.label}: SAR ${ctx.parsed.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            }
                        }
                    }
                }
            });

            // Pill legend
            if (summaryDiv) {
                summaryDiv.innerHTML = dLabels.map((lbl, i) => `
                            <span style="display:inline-flex;align-items:center;gap:5px;font-size:0.78rem;font-weight:700;color:${dColors[i]};background:${dColors[i]}18;padding:3px 10px;border-radius:20px;">
                                <span style="width:8px;height:8px;border-radius:50%;background:${dColors[i]};display:inline-block;"></span>
                                ${lbl}: SAR ${methodTotals[lbl].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>`).join('');
            }

        } else {
            // --- BAR / LINE: time-series ---
            const labels = Object.keys(histoData);
            const values = Object.values(histoData);

            if (labels.length === 0) {
                canvas.style.display = 'none';
                let overlay = document.getElementById('sales-chart-empty');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'sales-chart-empty';
                    overlay.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:0.9rem;color:' + textMuted + ';';
                    canvas.parentElement.appendChild(overlay);
                }
                overlay.textContent = 'No data for this timeframe.';
                overlay.style.display = 'flex';
                if (summaryDiv) summaryDiv.innerHTML = '';
                return;
            }
            canvas.style.display = '';
            const oldOverlay = document.getElementById('sales-chart-empty');
            if (oldOverlay) oldOverlay.style.display = 'none';

            // Gradient fill for bar/line
            const grad = ctx.createLinearGradient(0, 0, 0, 280);
            grad.addColorStop(0, primaryColor + 'cc');
            grad.addColorStop(1, primaryColor + '18');

            const isLine = currentSalesChartType === 'line';
            _salesChartInstance = new Chart(ctx, {
                type: currentSalesChartType,
                data: {
                    labels,
                    datasets: [{
                        label: t('label-sales') + ' (SAR)',
                        data: values,
                        backgroundColor: isLine ? grad : values.map((v, i) => {
                            const max = Math.max(...values, 1);
                            const alpha = Math.round(80 + (v / max) * 130).toString(16).padStart(2, '0');
                            return primaryColor + alpha;
                        }),
                        borderColor: primaryColor,
                        borderWidth: isLine ? 3 : 1.5,
                        borderRadius: isLine ? 0 : 8,
                        borderSkipped: false,
                        fill: isLine,
                        tension: 0.42,
                        pointRadius: isLine ? 5 : 0,
                        pointHoverRadius: isLine ? 8 : 0,
                        pointBackgroundColor: isLine ? primaryColor : undefined,
                        pointBorderColor: isLine ? cardBg : undefined,
                        pointBorderWidth: isLine ? 2 : 0,
                        hoverBackgroundColor: isLine ? primaryColor + 'dd' : secondaryColor + 'cc'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 600, easing: 'easeOutQuart' },
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: {
                                color: textMuted,
                                font: { size: 11, weight: '600', family: 'Inter, sans-serif' },
                                maxRotation: 45
                            },
                            border: { color: borderColor }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: borderColor + '80', drawBorder: false },
                            ticks: {
                                color: textMuted,
                                font: { size: 11, family: 'Inter, sans-serif' },
                                callback: v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v
                            },
                            border: { display: false }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: cardBg,
                            titleColor: textMuted,
                            bodyColor: primaryColor,
                            borderColor: borderColor,
                            borderWidth: 1,
                            padding: 12,
                            cornerRadius: 10,
                            callbacks: {
                                label: ctx => ` SAR ${ctx.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            }
                        }
                    }
                }
            });

            // Quick stats pill row
            if (summaryDiv && values.length > 0) {
                const total = values.reduce((a, b) => a + b, 0);
                const avg = total / values.length;
                const peak = Math.max(...values);
                const peakLabel = labels[values.indexOf(peak)];
                summaryDiv.innerHTML = [
                    { icon: '💰', label: t('label-total'), val: 'SAR ' + total.toLocaleString(undefined, { minimumFractionDigits: 2 }) },
                    { icon: '📈', label: t('label-avg'), val: 'SAR ' + avg.toFixed(2) },
                    { icon: '🏆', label: t('label-peak'), val: `${peakLabel} · SAR ${peak.toLocaleString(undefined, { minimumFractionDigits: 2 })}` }
                ].map(s => `
                            <div style="flex:1; min-width:100px; text-align:center; background:var(--bg-color); border:1px solid var(--border-color); border-radius:10px; padding:8px 12px;">
                                <div style="font-size:1.1rem;">${s.icon}</div>
                                <div style="font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">${s.label}</div>
                                <div style="font-size:0.82rem; font-weight:800; color:var(--primary); margin-top:2px;">${s.val}</div>
                            </div>`).join('');
            }
        }
    })();

    // Draw Recent Transactions Log
    const logDiv = document.getElementById('sales-transaction-log');
    if (logDiv) {
        logDiv.innerHTML = '';
        const combined = [
            ...filteredLogs.map(l => ({ ...l, type: 'sale' })),
            ...filteredDeposits.map(d => ({ ...d, type: 'deposit' })),
            ...filteredSpends.map(s => ({ ...s, type: 'spend' }))
        ].sort((a, b) => b.timestamp - a.timestamp);

        if (combined.length === 0) {
            logDiv.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.95rem; padding: 20px;">${t('msg-no-transactions')}</p>`;
        } else {
            const sources = getCompanyData().incomeSources || ['Cash', 'Credit Card'];
            combined.forEach(item => {
                let isSalesAdmin = isAdmin || document.body.classList.contains('perm-finance') || document.body.classList.contains('perm-sales') || (currentUser && item.cashier && currentUser.email.toLowerCase() === item.cashier.toLowerCase());
                let actionArea = '';

                if (item.type === 'sale') {
                    const isCounted = !disabledMethods.includes(item.method);
                    const opacity = isCounted ? '1' : '0.5';
                    const strike = isCounted ? 'none' : 'line-through';

                    if (isSalesAdmin) {
                        actionArea = `
                            <div style="display:flex; gap:8px; align-items:center;">
                                <button id="swap-btn-${item.id}" onclick="showSwapSelect('${item.id}')" style="background: var(--input-bg); border: 1px solid var(--border-color); border-radius:6px; color: var(--text-main); font-size: 0.9rem; cursor: pointer; padding: 6px 12px; font-weight:bold;" title="${isAr ? 'تبديل طريقة الدفع' : 'Swap payment method'}">
                                    🔄 ${t('btn-swap') || 'Swap'}
                                </button>
                                <select id="swap-select-${item.id}" onchange="swapSaleMethod('${item.id}', this.value)" onblur="cancelSwapSelect('${item.id}')" style="display:none; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main); font-size: 0.9rem; font-weight: bold; cursor: pointer;">
                                    <option value="">${isAr ? 'اختر...' : 'Choose...'}</option>
                                    ${sources.map(s => `<option value="${s}" ${s === item.method ? 'disabled selected' : ''}>${translateDynamicTerm(s)}</option>`).join('')}
                                </select>
                                <button onclick="deleteSaleTransaction('${item.id}')" style="background: var(--danger-bg); border: 1px solid var(--danger-border); border-radius:6px; color: var(--danger); font-size: 0.9rem; cursor: pointer; padding: 6px 12px; font-weight:bold;" title="${t('btn-remove')}">${t('btn-undo-action')}</button>
                            </div>
                        `;
                    }

                    logDiv.innerHTML += `
                        <div class="ledger-card" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; opacity: ${opacity}; margin-bottom: 0;">
                            <div>
                                <div style="font-weight: 800; font-size: 1.25rem; color: var(--text-main); text-decoration: ${strike};">SAR ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 6px; display:flex; gap:8px; align-items:center;">
                                    <span class="badge" style="background: ${isCounted ? 'var(--primary)' : 'var(--text-muted)'}; color: white; padding:2px 8px;">${translateDynamicTerm(item.method)}</span> 
                                    <span>🕒 ${item.date}</span>
                                    <span style="font-style:italic; opacity:0.7;">by ${item.cashier ? item.cashier.split('@')[0] : 'System'}</span>
                                    ${item.isPastEntry ? `<span class="badge" style="background:var(--warning); color:white; padding:2px 8px;">${isAr ? 'سابق' : 'Past'}</span>` : ''}
                                </div>
                            </div>
                            <div>${actionArea}</div>
                        </div>
                    `;
                } else if (item.type === 'deposit') {
                    if (isSalesAdmin) {
                        actionArea = `
                            <button onclick="deleteDepositTransaction('${item.id}')" style="background: var(--danger-bg); border: 1px solid var(--danger-border); border-radius:6px; color: var(--danger); font-size: 0.9rem; cursor: pointer; padding: 6px 12px; font-weight:bold;" title="${t('btn-remove')}">${t('btn-undo-action')}</button>
                        `;
                    }

                    logDiv.innerHTML += `
                        <div class="ledger-card" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; margin-bottom: 0; border-left: 4px solid #f59e0b;">
                            <div>
                                <div style="font-weight: 800; font-size: 1.25rem; color: #f59e0b;">SAR -${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 6px; display:flex; gap:8px; align-items:center;">
                                    <span class="badge" style="background: #f59e0b; color: white; padding:2px 8px;">${isAr ? 'إيداع صندوق الكاش' : 'Cashier Deposit'}</span> 
                                    <span>🕒 ${item.date}</span>
                                    <span style="font-style:italic; opacity:0.7;">by ${item.cashier ? item.cashier.split('@')[0] : 'System'}</span>
                                </div>
                            </div>
                            <div>${actionArea}</div>
                        </div>
                    `;
                } else if (item.type === 'spend') {
                    if (isSalesAdmin) {
                        actionArea = `
                            <button onclick="deleteSpendLog('${item.id}')" style="background: var(--danger-bg); border: 1px solid var(--danger-border); border-radius:6px; color: var(--danger); font-size: 0.9rem; cursor: pointer; padding: 6px 12px; font-weight:bold;" title="${t('btn-remove')}">${t('btn-undo-action')}</button>
                        `;
                    }

                    logDiv.innerHTML += `
                        <div class="ledger-card" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; margin-bottom: 0; border-left: 4px solid var(--danger);">
                            <div>
                                <div style="font-weight: 800; font-size: 1.25rem; color: var(--danger);">SAR -${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 6px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                                    <span class="badge" style="background: var(--danger); color: white; padding:2px 8px;">${isAr ? 'مصروف مباشر' : 'Direct Spend'}</span>
                                    <span class="badge" style="background: var(--input-bg); color: var(--text-main); border: 1px solid var(--border-color); padding:2px 8px;">${translateDynamicTerm(item.method)}</span>
                                    <span>🕒 ${item.date}</span>
                                    <span style="font-style:italic; opacity:0.7;">by ${item.cashier ? item.cashier.split('@')[0] : 'System'}</span>
                                    ${item.note ? `<span style="color:var(--text-main); font-weight:600;">📝 ${item.note}</span>` : ''}
                                </div>
                            </div>
                            <div>${actionArea}</div>
                        </div>
                    `;
                }
            });
        }
    }
    // Refresh pending spend orders panel
    renderSpendOrders();

}

// ============================================================
// --- SPEND ORDER SYSTEM ---
// ============================================================

function logDirectSpendGeneric(amountId, methodId, noteId) {
    const isAr = currentAppLang === 'ar';
    const amount = parseFloat(document.getElementById(amountId).value);
    const method = document.getElementById(methodId).value;
    const note = (document.getElementById(noteId).value || '').trim();

    if (isNaN(amount) || amount <= 0) {
        alert(isAr ? 'الرجاء إدخال مبلغ صحيح.' : 'Please enter a valid amount.');
        return;
    }
    if (!method) {
        alert(isAr ? 'الرجاء اختيار طريقة الدفع.' : 'Please select a payment method.');
        return;
    }
    if (!note) {
        alert(isAr ? 'الرجاء كتابة ملاحظة (سبب الصرف).' : 'Please enter a note (reason for the spend).');
        return;
    }

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localDateStr = new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
    const displayDate = now.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const spendLogId = 'spendlog-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const spendLogObj = {
        id: spendLogId,
        amount: amount,
        method: method,
        note: note,
        date: displayDate,
        timestamp: Date.now(),
        cashier: currentUser ? currentUser.email : 'unknown',
        orderId: 'direct',
        dateStr: localDateStr
    };

    const companyData = getCompanyData();
    if (!companyData.spendLogs) companyData.spendLogs = [];
    companyData.spendLogs.unshift(spendLogObj);

    db.ref(`companies/${currentCompany}/spendLogs`).set(companyData.spendLogs)
        .then(() => {
            logActivity('sales', 'system', 'Direct Spend', `Logged direct spend: SAR ${amount} via ${method} — ${note}`);
            document.getElementById(amountId).value = '';
            document.getElementById(noteId).value = '';
            alert(isAr ? `✅ تم تسجيل المصروف مباشرة بقيمة SAR ${amount} من ${method}.` : `✅ Direct spend logged successfully! SAR ${amount} deducted from ${method}.`);
        })
        .catch(err => {
            console.error('Error logging direct spend:', err);
            alert(isAr ? 'حدث خطأ أثناء تسجيل المصروف.' : 'Error logging direct spend.');
        });
}

function logDirectSpend() {
    logDirectSpendGeneric('finance-spend-amount', 'finance-spend-method', 'finance-spend-note');
}

function logDirectSpendFromSales() {
    logDirectSpendGeneric('sales-spend-amount', 'sales-spend-method', 'sales-spend-note');
}

function renderFinanceSpendArea() {
    const methodSelect = document.getElementById('finance-spend-method');
    if (!methodSelect) return;
    const sources = getCompanyData().incomeSources || ['Cash', 'Credit Card'];
    const prevVal = methodSelect.value;
    methodSelect.innerHTML = sources.map(s => `<option value="${s}">${s}</option>`).join('');
    if (sources.includes(prevVal)) methodSelect.value = prevVal;
}

function submitSpendOrder() {
    const isAr = currentAppLang === 'ar';
    const amount = parseFloat(document.getElementById('finance-spend-amount').value);
    const method = document.getElementById('finance-spend-method').value;
    const note = (document.getElementById('finance-spend-note').value || '').trim();

    if (isNaN(amount) || amount <= 0) {
        alert(isAr ? 'الرجاء إدخال مبلغ صحيح.' : 'Please enter a valid amount.');
        return;
    }
    if (!method) {
        alert(isAr ? 'الرجاء اختيار طريقة الدفع.' : 'Please select a payment method.');
        return;
    }
    if (!note) {
        alert(isAr ? 'الرجاء كتابة ملاحظة (سبب الصرف).' : 'Please enter a note (reason for the spend).');
        return;
    }

    const orderId = 'spend-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localDate = new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const orderObj = {
        id: orderId,
        amount: amount,
        suggestedMethod: method,
        note: note,
        status: 'pending',
        createdBy: currentUser ? currentUser.email : 'unknown',
        createdAt: Date.now(),
        timestamp: Date.now(),
        dateStr: localDate,
        timeStr: timeStr
    };

    const companyData = getCompanyData();
    if (!companyData.spendOrders) companyData.spendOrders = [];
    companyData.spendOrders.unshift(orderObj);

    db.ref(`companies/${currentCompany}/spendOrders`).set(companyData.spendOrders)
        .then(() => {
            logActivity('sales', 'system', 'Spend Requested', `Requested spend order: SAR ${amount} via ${method} — ${note}`);
            document.getElementById('finance-spend-amount').value = '';
            document.getElementById('finance-spend-note').value = '';
            alert(isAr ? `✅ تم إرسال أمر الصرف للكاشير بنجاح بقيمة SAR ${amount}.` : `✅ Spend order submitted! Pending cashier approval.`);
        })
        .catch(err => {
            console.error('Error submitting spend order:', err);
            alert(isAr ? 'حدث خطأ أثناء إرسال أمر الصرف.' : 'Error submitting spend order.');
        });
}

function cancelSpendOrder(orderId) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? 'هل تريد إلغاء أمر الصرف هذا؟' : 'Are you sure you want to cancel this spend order?')) return;

    const companyData = getCompanyData();
    const orders = companyData.spendOrders || [];
    companyData.spendOrders = orders.filter(o => o && o.id !== orderId);

    db.ref(`companies/${currentCompany}/spendOrders`).set(companyData.spendOrders)
        .then(() => {
            logActivity('sales_delete', 'system', 'Spend Cancelled', `Cancelled spend order (ID: ${orderId})`);
        })
        .catch(err => {
            console.error('Error cancelling spend order:', err);
            alert(isAr ? 'حدث خطأ أثناء إلغاء أمر الصرف.' : 'Error cancelling spend order.');
        });
}

function rejectSpendOrder(orderId) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? 'هل تريد رفض أمر الصرف هذا؟' : 'Reject this spend order?')) return;

    const companyData = getCompanyData();
    const orders = companyData.spendOrders || [];
    const orderIndex = orders.findIndex(o => o && o.id === orderId);
    if (orderIndex === -1) return;

    orders[orderIndex].status = 'rejected';

    db.ref(`companies/${currentCompany}/spendOrders`).set(orders)
        .then(() => {
            logActivity('sales_delete', 'system', 'Spend Rejected', `Rejected spend order (ID: ${orderId})`);
        })
        .catch(err => {
            console.error('Error rejecting spend order:', err);
            alert(isAr ? 'حدث خطأ أثناء رفض أمر الصرف.' : 'Error rejecting spend order.');
        });
}

function acceptSpendOrder(orderId) {
    const isAr = currentAppLang === 'ar';
    const methodSelect = document.getElementById('accept-spend-method-' + orderId);
    const paidMethod = methodSelect ? methodSelect.value : null;

    if (!paidMethod) {
        alert(isAr ? 'الرجاء اختيار طريقة الدفع المستخدمة.' : 'Please select the payment method used.');
        return;
    }

    const companyData = getCompanyData();
    const orders = companyData.spendOrders || [];
    const orderIndex = orders.findIndex(o => o && o.id === orderId);
    if (orderIndex === -1) { alert('Order not found.'); return; }

    const order = orders[orderIndex];

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localDateStr = new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
    const displayDate = now.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const spendLogId = 'spendlog-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const spendLogObj = {
        id: spendLogId,
        amount: order.amount,
        method: paidMethod,
        note: order.note,
        date: displayDate,
        timestamp: Date.now(),
        cashier: currentUser ? currentUser.email : 'unknown',
        orderId: orderId,
        dateStr: localDateStr
    };

    order.status = 'accepted';
    order.acceptedBy = currentUser ? currentUser.email : 'unknown';
    order.acceptedAt = Date.now();
    order.paidMethod = paidMethod;

    if (!companyData.spendLogs) companyData.spendLogs = [];
    companyData.spendLogs.unshift(spendLogObj);

    const updates = {};
    updates[`companies/${currentCompany}/spendLogs`] = companyData.spendLogs;
    updates[`companies/${currentCompany}/spendOrders`] = companyData.spendOrders;

    db.ref().update(updates)
        .then(() => {
            logActivity('sales', 'system', 'Spend Accepted', `Spend order accepted: SAR ${order.amount} via ${paidMethod} — ${order.note}`);
            alert(isAr ? `✅ تم قبول أمر الصرف وتسجيل مصروف SAR ${order.amount} من ${paidMethod}.` : `✅ Spend accepted! SAR ${order.amount} deducted from ${paidMethod}.`);
        })
        .catch(err => {
            console.error('Error accepting spend order:', err);
            alert(isAr ? 'حدث خطأ أثناء قبول أمر الصرف.' : 'Error accepting spend order.');
        });
}

function deleteSpendLog(logId) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? 'هل تريد حذف هذا المصروف من السجل؟' : 'Delete this spend entry from the log?')) return;

    const companyData = getCompanyData();
    const logs = companyData.spendLogs || [];
    const oldLog = logs.find(l => l.id === logId);
    if (!oldLog) return;

    companyData.spendLogs = logs.filter(l => l.id !== logId);

    db.ref(`companies/${currentCompany}/spendLogs`).set(companyData.spendLogs)
        .then(() => {
            logActivity('sales_delete', 'system', 'Spend Log', `Deleted direct spend of SAR ${oldLog.amount} via ${oldLog.method} — ${oldLog.note}`);
        })
        .catch(err => {
            console.error('Error deleting spend log:', err);
            alert(isAr ? 'حدث خطأ أثناء حذف المصروف.' : 'Error deleting spend log.');
        });
}


function renderSpendOrders() {
    const isAr = currentAppLang === 'ar';
    const container = document.getElementById('pending-spend-orders-list');
    if (!container) return;

    const isAdmin = currentUser && currentUser.role === 'admin';
    const isSalesUser = isAdmin || document.body.classList.contains('perm-sales');
    const isFinUser = isAdmin || document.body.classList.contains('perm-finance');
    const sources = getCompanyData().incomeSources || ['Cash', 'Credit Card'];
    const allOrders = getCompanyData().spendOrders || {};

    const pendingOrders = Object.values(allOrders)
        .filter(o => o && o.status === 'pending')
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (pendingOrders.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.9rem; padding:16px;">${isAr ? 'لا توجد أوامر صرف معلقة.' : 'No pending spend orders.'}</p>`;
        return;
    }

    container.innerHTML = pendingOrders.map(order => {
        const methodOptions = sources.map(s => `<option value="${s}"${s === order.suggestedMethod ? ' selected' : ''}>${s}</option>`).join('');
        const canCancel = isFinUser && order.createdBy && currentUser && (isAdmin || order.createdBy.toLowerCase() === currentUser.email.toLowerCase());

        return `
            <div style="background:var(--card-bg); border:1px solid var(--border-color); border-left: 4px solid var(--danger); border-radius:10px; padding:14px 16px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;">
                    <div>
                        <div style="font-size:1.15rem; font-weight:800; color:var(--danger);">SAR ${order.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div style="font-size:0.82rem; color:var(--text-muted); margin-top:4px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                            <span class="badge" style="background:var(--input-bg); color:var(--text-main); border: 1px solid var(--border-color);">${translateDynamicTerm(order.suggestedMethod)}</span>
                            <span>📝 ${order.note}</span>
                        </div>
                        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
                            ${isAr ? 'طلب بواسطة:' : 'By:'} ${order.createdBy ? order.createdBy.split('@')[0] : '?'} · ${order.timeStr || ''} ${order.dateStr || ''}
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
                        ${isSalesUser ? `
                            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                                <select id="accept-spend-method-${order.id}" style="padding:6px 10px; border-radius:6px; border:1px solid var(--border-color); background:var(--input-bg); color:var(--text-main); font-size:0.85rem; font-weight:600;">${methodOptions}</select>
                                <button onclick="acceptSpendOrder('${order.id}')" style="background:var(--success-bg); border:1px solid var(--success-border); color:var(--success); border-radius:6px; padding:7px 14px; font-weight:800; font-size:0.85rem; cursor:pointer;">✅ ${isAr ? 'قبول' : 'Accept'}</button>
                                <button onclick="rejectSpendOrder('${order.id}')" style="background:var(--danger-bg); border:1px solid var(--danger-border); color:var(--danger); border-radius:6px; padding:7px 14px; font-weight:800; font-size:0.85rem; cursor:pointer;">❌ ${isAr ? 'رفض' : 'Reject'}</button>
                            </div>
                        ` : ''}
                        ${canCancel ? `<button onclick="cancelSpendOrder('${order.id}')" style="background:transparent; border:none; color:var(--text-muted); font-size:0.75rem; cursor:pointer; text-decoration:underline;">${isAr ? 'إلغاء الأمر' : 'Cancel Order'}</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- COSTS DEPARTMENT SYSTEM ---

let currentCostsTimeframe = 'day';

function setCostsTimeframe(tf) {
    currentCostsTimeframe = tf;
    ['day', 'week', 'month', 'year', 'custom'].forEach(id => {
        const btn = document.getElementById('cost-tf-' + id);
        if (btn) {
            if (id === tf) {
                btn.style.background = 'var(--primary)';
                btn.style.color = 'white';
            } else {
                btn.style.background = 'transparent';
                btn.style.color = 'var(--text-muted)';
            }
        }
    });

    const datePicker = document.getElementById('costs-date-picker');
    if (datePicker) datePicker.style.display = tf === 'day' ? 'inline-block' : 'none';

    const customRange = document.getElementById('costs-custom-range');
    if (customRange) customRange.style.display = tf === 'custom' ? 'flex' : 'none';

    renderCosts();
}

function addCostCategory() {
    const nameInput = document.getElementById('new-cost-category');
    const name = nameInput.value.trim();
    if (!name) return;
    if (!getCompanyData().costCategories) getCompanyData().costCategories = [];
    if (!getCompanyData().costCategories.includes(name)) {
        getCompanyData().costCategories.push(name);
        nameInput.value = '';

        // Targeted write to costCategories
        db.ref('companies/' + currentCompany + '/costCategories').set(getCompanyData().costCategories)
            .catch(err => console.error("Error adding cost category:", err));
        renderCosts();
    } else {
        alert("This cost category already exists.");
    }
}

function deleteCostCategory(name) {
    if (!confirm(`Delete cost category '${name}'?\n\n(This hides it from the dropdown but doesn't delete old logs).`)) return;
    getCompanyData().costCategories = getCompanyData().costCategories.filter(c => c !== name);

    // Targeted write to costCategories
    db.ref('companies/' + currentCompany + '/costCategories').set(getCompanyData().costCategories)
        .catch(err => console.error("Error deleting cost category:", err));
    renderCosts();
}

function logCostTransaction() {
    const amountInput = document.getElementById('new-cost-amount');
    const methodInput = document.getElementById('new-cost-category-select');

    const amount = parseFloat(amountInput.value);
    const method = methodInput.value;

    if (isNaN(amount) || amount <= 0 || !method) {
        alert("Please enter a valid amount and select a cost category.");
        return;
    }

    const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
    const workerId = myWorker ? myWorker.id : "";

    const now = new Date();
    const newLog = {
        id: Date.now().toString(),
        amount: amount,
        method: method,
        date: formatTimestamp(),
        timestamp: now.getTime(),
        month: currentGlobalMonth,
        cashier: currentUser.email,
        workerId: workerId
    };

    if (!getCompanyData().costLogs) getCompanyData().costLogs = [];
    getCompanyData().costLogs.unshift(newLog);

    amountInput.value = '';

    // Targeted write to costLogs
    db.ref('companies/' + currentCompany + '/costLogs/' + newLog.id).set(newLog)
        .then(() => {
            logActivity('costs', workerId, myWorker ? myWorker.name : 'System', `Entered cost transaction of SAR ${amount} for category "${method}"`);
        })
        .catch(error => {
            console.error("Error saving cost:", error);
            alert("Failed to save cost transaction.");
        });
    renderCosts();
}

function deleteCostTransaction(id) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? "هل أنت تأكد من حذف هذا السجل؟" : "Delete this cost record?")) return;
    const companyData = getCompanyData();
    if (!companyData.costLogs) companyData.costLogs = [];
    const oldLog = companyData.costLogs.find(l => l && l.id === id);
    companyData.costLogs = companyData.costLogs.filter(l => l && l.id !== id);

    renderAll();

    const p1 = db.ref('companies/' + currentCompany + '/costLogs/' + id).remove();
    const p2 = db.ref('companies/' + currentCompany + '/costLogs').set(companyData.costLogs);

    Promise.all([p1, p2])
        .then(() => {
            if (oldLog) {
                logActivity('costs_delete', oldLog.workerId || '', oldLog.cashier || 'System', `Deleted/Undid cost transaction of SAR ${oldLog.amount} for category "${oldLog.method}"`);
            }
            renderAll();
        })
        .catch(error => {
            console.error("Error deleting cost:", error);
            alert(isAr ? "فشل حذف التكلفة." : "Failed to delete cost transaction.");
            renderAll();
        });
}

// Log past costs
function logPastCostTransaction() {
    const amount = parseFloat(document.getElementById('past-cost-amount').value);
    const category = document.getElementById('past-cost-category').value;
    const dateStr = document.getElementById('past-cost-date').value;
    const password = document.getElementById('past-cost-password').value;

    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount.'); return;
    }
    if (!category) { alert('Please select a category.'); return; }
    if (!dateStr) { alert('Please select a past date.'); return; }
    if (password !== 'N123456') {
        alert('❌ Incorrect password. Access denied.');
        document.getElementById('past-cost-password').value = '';
        return;
    }

    const parts = dateStr.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (d >= today) { alert('Please select a date in the past (not today or future).'); return; }

    const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
    const workerId = myWorker ? myWorker.id : "";

    const timestamp = d.getTime() + (12 * 3600000); // noon of that day
    const newLog = {
        id: Date.now().toString(),
        amount: amount,
        method: category,
        date: dateStr + ' (past entry)',
        timestamp: timestamp,
        month: dateStr.slice(0, 7),
        cashier: currentUser.email,
        isPastEntry: true,
        workerId: workerId
    };

    if (!getCompanyData().costLogs) getCompanyData().costLogs = [];
    getCompanyData().costLogs.unshift(newLog);

    document.getElementById('past-cost-amount').value = '';
    document.getElementById('past-cost-password').value = '';
    document.getElementById('past-cost-date').value = '';

    // Targeted write to costLogs
    db.ref('companies/' + currentCompany + '/costLogs/' + newLog.id).set(newLog)
        .then(() => {
            logActivity('costs', workerId, myWorker ? myWorker.name : 'System', `Entered past cost transaction of SAR ${amount} for category "${category}" on date ${dateStr}`);
        })
        .catch(error => {
            console.error("Error saving past cost:", error);
            alert("Failed to save past cost transaction.");
        });
    renderCosts();
    alert(`✅ Past cost of SAR ${amount} for '${category}' on ${dateStr} has been logged!`);
}

function renderCosts() {
    if (currentTab !== 'costs') return;

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const todayLocalStr = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);

    const pastCostDateInput = document.getElementById('past-cost-date');
    if (pastCostDateInput && !pastCostDateInput.value) {
        pastCostDateInput.value = todayLocalStr;
    }

    const isAdmin = currentUser.role === 'admin';

    // Setup categories dropdowns (both current and past entry)
    const categories = getCompanyData().costCategories || ['Electric Bill', 'Meat Supplier', 'Packaging'];
    const methodSelect = document.getElementById('new-cost-category-select');
    if (methodSelect) {
        const prevVal = methodSelect.value;
        methodSelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
        if (categories.includes(prevVal)) methodSelect.value = prevVal;
    }
    const pastCatSelect = document.getElementById('past-cost-category');
    if (pastCatSelect) {
        const pv = pastCatSelect.value;
        pastCatSelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
        if (categories.includes(pv)) pastCatSelect.value = pv;
    }

    // Render Admin categories list
    const adminListDiv = document.getElementById('admin-cost-categories-list');
    if (adminListDiv) {
        adminListDiv.innerHTML = categories.map(c => `
                    <div style="background: var(--bg-color); border: 1px solid var(--border-color); padding: 6px 14px; border-radius: 20px; font-size: 0.95rem; font-weight:600; display: flex; align-items: center; gap: 10px;">
                        ${c} <button onclick="deleteCostCategory('${c}')" style="background: var(--danger-bg); border: 1px solid var(--danger-border); border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; color: var(--danger); cursor: pointer; padding: 0;">✖</button>
                    </div>
                `).join('');
    }

    // Fetch and Filter Both Data Streams
    const allSales = getCompanyData().salesLogs || [];
    const allCosts = getCompanyData().costLogs || [];
    const disabledSalesMethods = getCompanyData().disabledSalesMethods || [];

    let filteredSales = [];
    let filteredCosts = [];
    let labelText = '';

    if (currentCostsTimeframe === 'day') {
        const datePicker = document.getElementById('costs-date-picker');
        if (!datePicker.value) {
            const tzOffset = now.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);
            datePicker.value = localISOTime;
        }
        const parts = datePicker.value.split('-');
        const startOfDay = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
        const endOfDay = startOfDay + 86400000;
        filteredSales = allSales.filter(l => l.timestamp >= startOfDay && l.timestamp < endOfDay);
        filteredCosts = allCosts.filter(l => l.timestamp >= startOfDay && l.timestamp < endOfDay);
        labelText = datePicker.value;
    }
    else if (currentCostsTimeframe === 'week') {
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
        filteredSales = allSales.filter(l => l.timestamp >= startOfWeek);
        filteredCosts = allCosts.filter(l => l.timestamp >= startOfWeek);
        labelText = t('label-past-7-days');
    }
    else if (currentCostsTimeframe === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        filteredSales = allSales.filter(l => l.timestamp >= startOfMonth);
        filteredCosts = allCosts.filter(l => l.timestamp >= startOfMonth);
        labelText = t('label-this-month');
    }
    else if (currentCostsTimeframe === 'year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
        filteredSales = allSales.filter(l => l.timestamp >= startOfYear);
        filteredCosts = allCosts.filter(l => l.timestamp >= startOfYear);
        labelText = t('label-this-year');
    }
    else if (currentCostsTimeframe === 'custom') {
        const fromPicker = document.getElementById('costs-from-date');
        const toPicker = document.getElementById('costs-to-date');
        if (fromPicker.value && toPicker.value) {
            const fParts = fromPicker.value.split('-');
            const tParts = toPicker.value.split('-');
            const startTs = new Date(fParts[0], fParts[1] - 1, fParts[2]).getTime();
            const endTs = new Date(tParts[0], tParts[1] - 1, tParts[2]).getTime() + 86400000;
            filteredSales = allSales.filter(l => l.timestamp >= startTs && l.timestamp < endTs);
            filteredCosts = allCosts.filter(l => l.timestamp >= startTs && l.timestamp < endTs);
            labelText = fromPicker.value + ' → ' + toPicker.value;
        }
    }

    document.getElementById('pl-timeframe-label').textContent = labelText;

    // Calculate Totals
    let totalSales = 0;
    filteredSales.forEach(l => {
        if (!disabledSalesMethods.includes(l.method)) totalSales += l.amount;
    });

    let totalCosts = 0;
    filteredCosts.forEach(l => { totalCosts += l.amount; });

    const netProfit = totalSales - totalCosts;
    const isProfit = netProfit >= 0;
    const profitSign = netProfit > 0 ? '+' : netProfit < 0 ? '-' : '';

    // Update P&L HUD
    const netProfitDiv = document.getElementById('pl-net-profit');
    if (netProfitDiv) {
        netProfitDiv.textContent = profitSign + 'SAR ' + Math.abs(netProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        netProfitDiv.style.color = isProfit ? 'var(--success)' : (netProfit < 0 ? 'var(--danger)' : 'var(--text-muted)');
    }

    const statusDiv = document.getElementById('pl-status-message');
    if (statusDiv) {
        if (netProfit > 0) { statusDiv.textContent = t('status-healthy-profit'); statusDiv.style.color = 'var(--success)'; }
        else if (netProfit < 0) { statusDiv.textContent = t('status-operating-loss'); statusDiv.style.color = 'var(--danger)'; }
        else { statusDiv.textContent = t('status-breaking-even'); statusDiv.style.color = 'var(--text-muted)'; }
    }

    const grossSalesEl = document.getElementById('pl-gross-sales');
    const grossCostsEl = document.getElementById('pl-gross-costs');
    if (grossSalesEl) grossSalesEl.textContent = 'SAR ' + totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 });
    if (grossCostsEl) grossCostsEl.textContent = 'SAR ' + totalCosts.toLocaleString(undefined, { minimumFractionDigits: 2 });


    // Update tx count HUD
    const txCountEl = document.getElementById('pl-tx-count');
    if (txCountEl) txCountEl.textContent = (filteredSales.length + filteredCosts.length).toString();

    // Build grouped comparative histogram data
    const histoMap = {}; // key → { sales: 0, costs: 0 }
    function getLocalKey(ts, mode) {
        const d = new Date(ts);
        if (mode === 'hour') return String(d.getHours()).padStart(2, '0') + ':00';
        if (mode === 'month') {
            const months = currentAppLang === 'ar' ?
                ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'] :
                ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return months[d.getMonth()];
        }
        return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    const groupMode = currentCostsTimeframe === 'day' ? 'hour' : currentCostsTimeframe === 'year' ? 'month' : 'date';

    filteredSales.forEach(l => {
        if (disabledSalesMethods.includes(l.method)) return;
        const k = getLocalKey(l.timestamp, groupMode);
        if (!histoMap[k]) histoMap[k] = { sales: 0, costs: 0 };
        histoMap[k].sales += l.amount;
    });
    filteredCosts.forEach(l => {
        const k = getLocalKey(l.timestamp, groupMode);
        if (!histoMap[k]) histoMap[k] = { sales: 0, costs: 0 };
        histoMap[k].costs += l.amount;
    });

    const histoDiv = document.getElementById('pl-comparative-histogram');
    const labelsDiv = document.getElementById('pl-histogram-labels');
    if (histoDiv) {
        histoDiv.innerHTML = '';
        if (labelsDiv) labelsDiv.innerHTML = '';
        const labels = Object.keys(histoMap).sort();

        if (labels.length === 0) {
            histoDiv.innerHTML = `<div style="width:100%; text-align:center; color:var(--text-muted); padding-top:100px; font-size:0.95rem;">${t('msg-no-data-timeframe')}</div>`;
        } else {
            const allVals = labels.flatMap(k => [histoMap[k].sales, histoMap[k].costs]).filter(v => v > 0);
            const maxV = allVals.length > 0 ? Math.max(...allVals) : 1;
            const CHART_H = 240; // usable bar area in px

            labels.forEach(label => {
                const sVal = histoMap[label].sales || 0;
                const cVal = histoMap[label].costs || 0;
                // Strictly proportional — a bar of maxV fills CHART_H, zero = 0px
                const sPx = sVal > 0 ? Math.max(1, Math.round((sVal / maxV) * CHART_H)) : 0;
                const cPx = cVal > 0 ? Math.max(1, Math.round((cVal / maxV) * CHART_H)) : 0;
                const fmt = v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0);

                // Structure: outer column (flex col, align-items:flex-end, height=CHART_H px)
                // label row floats above; bars sit at the bottom baseline
                histoDiv.innerHTML += `
                            <div title="${label}&#10;${t('label-sales')}: SAR ${sVal.toLocaleString()}&#10;${t('label-costs')}: SAR ${cVal.toLocaleString()}"
                                 style="flex:1; min-width:24px; max-width:55px; display:flex; flex-direction:column; align-items:center; height:${CHART_H}px; justify-content:flex-end; cursor:default; position:relative;">
                                <!-- value labels pinned at top of each bar -->
                                <div style="position:absolute; bottom:${sPx}px; left:0; right:50%; text-align:center; font-size:0.5rem; color:#059669; font-weight:800; white-space:nowrap; line-height:1; padding-bottom:1px;">${sVal > 0 ? fmt(sVal) : ''}</div>
                                <div style="position:absolute; bottom:${cPx}px; left:50%; right:0; text-align:center; font-size:0.5rem; color:#dc2626; font-weight:800; white-space:nowrap; line-height:1; padding-bottom:1px;">${cVal > 0 ? fmt(cVal) : ''}</div>
                                <!-- bars side by side, growing from baseline -->
                                <div style="display:flex; align-items:flex-end; gap:2px; width:100%; height:${CHART_H}px;">
                                    <div style="flex:1; height:${sPx}px; background:linear-gradient(180deg,#34d399,#059669); border-radius:3px 3px 0 0; box-shadow:0 -2px 6px rgba(16,185,129,0.35); transition:height 0.5s ease;"></div>
                                    <div style="flex:1; height:${cPx}px; background:linear-gradient(180deg,#f87171,#dc2626); border-radius:3px 3px 0 0; box-shadow:0 -2px 6px rgba(239,68,68,0.35); transition:height 0.5s ease;"></div>
                                </div>
                            </div>
                        `;
                if (labelsDiv) {
                    labelsDiv.innerHTML += `<div style="flex:1; min-width:24px; max-width:55px; text-align:center; font-size:0.6rem; color:var(--text-muted); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${label}</div>`;
                }
            });
        }
    }


    // Build source summary (grouped by category for comparison)
    const logDiv = document.getElementById('costs-transaction-log');
    if (logDiv) {
        logDiv.innerHTML = '';
        if (filteredCosts.length === 0) {
            logDiv.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.95rem; padding: 20px;">${t('msg-no-costs')}</p>`;
        } else {
            // Group totals by source/category for the summary table
            const sourceMap = {};
            filteredCosts.forEach(l => {
                if (!sourceMap[l.method]) sourceMap[l.method] = 0;
                sourceMap[l.method] += l.amount;
            });

            // Render grouped summary at the top
            const sourcesHtml = Object.entries(sourceMap).map(([src, total]) => `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px 16px; background: var(--bg-color); border-radius: 10px; border: 1px solid var(--border-color);">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div style="width:8px; height:8px; background:var(--danger); border-radius:50%;"></div>
                                <span style="font-weight:700; font-size:0.95rem; color:var(--text-main);">${src}</span>
                            </div>
                            <span style="font-weight:800; font-size:1.05rem; color:var(--danger);">SAR ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    `).join('');

            logDiv.innerHTML = `
                        <div style="background:var(--input-bg); border:1px solid var(--border-color); border-radius:12px; padding:14px; margin-bottom:16px;">
                            <div style="font-size:0.8rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:10px;">📊 ${t('title-summary-source')}</div>
                            <div style="display:flex; flex-direction:column; gap:6px;">${sourcesHtml}</div>
                            <div style="border-top:1px dashed var(--border-color); margin-top:12px; padding-top:10px; display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:0.9rem; font-weight:700; color:var(--text-muted);">${t('label-gross-costs')}</span>
                                <span style="font-size:1.2rem; font-weight:800; color:var(--danger);">SAR ${totalCosts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                        <div style="font-size:0.8rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; padding-left:4px;">📋 ${t('title-all-transactions')}</div>
                    `;

            // Render individual transaction entries
            filteredCosts.forEach(l => {
                let isCostsAdmin = isAdmin || document.body.classList.contains('perm-finance') || document.body.classList.contains('perm-costs');
                let delBtn = isCostsAdmin ? `<button onclick="deleteCostTransaction('${l.id}')" style="background: var(--danger-bg); border: 1px solid var(--danger-border); border-radius:6px; color: var(--danger); font-size: 0.9rem; cursor: pointer; padding: 6px 12px; font-weight:bold;" title="${t('btn-remove')}">${t('btn-undo-action')}</button>` : '';

                logDiv.innerHTML += `
                            <div class="ledger-card" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; margin-bottom: 0;">
                                <div>
                                    <div style="font-weight: 800; font-size: 1.15rem; color: var(--danger);">SAR ${l.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 6px; display:flex; gap:8px; align-items:center;">
                                        <span class="badge" style="background: var(--danger); color: white; padding:2px 8px;">${translateDynamicTerm(l.method)}</span> 
                                        <span>🕒 ${l.date}</span>
                                        <span style="font-style:italic; opacity:0.7;">by ${l.cashier ? l.cashier.split('@')[0] : 'System'}</span>
                                    </div>
                                </div>
                                <div>${delBtn}</div>
                            </div>
                        `;
            });
        }
    }
}

function exportCostsPDF() {
    const cd = getCompanyData();
    const allSales = cd.salesLogs || [];
    const allCosts = cd.costLogs || [];
    const disabledSalesMethods = cd.disabledSalesMethods || [];
    const now = new Date();

    // Re-compute filtered data using current timeframe state
    let filteredSales = [], filteredCosts = [], labelText = '';
    if (currentCostsTimeframe === 'day') {
        const dp = document.getElementById('costs-date-picker');
        const parts = (dp && dp.value ? dp.value : now.toISOString().slice(0, 10)).split('-');
        const s = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
        filteredSales = allSales.filter(l => l.timestamp >= s && l.timestamp < s + 86400000);
        filteredCosts = allCosts.filter(l => l.timestamp >= s && l.timestamp < s + 86400000);
        labelText = dp ? dp.value : now.toISOString().slice(0, 10);
    } else if (currentCostsTimeframe === 'week') {
        const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
        filteredSales = allSales.filter(l => l.timestamp >= s);
        filteredCosts = allCosts.filter(l => l.timestamp >= s);
        labelText = t('label-past-7-days');
    } else if (currentCostsTimeframe === 'month') {
        const s = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        filteredSales = allSales.filter(l => l.timestamp >= s);
        filteredCosts = allCosts.filter(l => l.timestamp >= s);
        labelText = t('label-this-month');
    } else if (currentCostsTimeframe === 'year') {
        const s = new Date(now.getFullYear(), 0, 1).getTime();
        filteredSales = allSales.filter(l => l.timestamp >= s);
        filteredCosts = allCosts.filter(l => l.timestamp >= s);
        labelText = t('label-this-year');
    } else if (currentCostsTimeframe === 'custom') {
        const fp = document.getElementById('costs-from-date');
        const tp = document.getElementById('costs-to-date');
        if (fp && tp && fp.value && tp.value) {
            const fP = fp.value.split('-'), tP = tp.value.split('-');
            const s = new Date(fP[0], fP[1] - 1, fP[2]).getTime();
            const e = new Date(tP[0], tP[1] - 1, tP[2]).getTime() + 86400000;
            filteredSales = allSales.filter(l => l.timestamp >= s && l.timestamp < e);
            filteredCosts = allCosts.filter(l => l.timestamp >= s && l.timestamp < e);
            labelText = fp.value + ' → ' + tp.value;
        }
    }

    let totalSales = 0;
    filteredSales.forEach(l => { if (!disabledSalesMethods.includes(l.method)) totalSales += l.amount; });
    let totalCosts = 0;
    filteredCosts.forEach(l => { totalCosts += l.amount; });
    const netProfit = totalSales - totalCosts;
    const profitSign = netProfit > 0 ? '+' : '';

    // Source breakdown
    const sourceMap = {};
    filteredCosts.forEach(l => { sourceMap[l.method] = (sourceMap[l.method] || 0) + l.amount; });
    const isAr = currentAppLang === 'ar';
    const sourceRows = Object.entries(sourceMap)
        .sort((a, b) => b[1] - a[1])
        .map(([src, total]) => `<tr><td>${src}</td><td style="text-align:${isAr ? 'left' : 'right'}; font-weight:700;">SAR ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td style="text-align:${isAr ? 'left' : 'right'};">${totalCosts > 0 ? ((total / totalCosts) * 100).toFixed(1) + '%' : '—'}</td></tr>`).join('');

    // Transaction rows
    const txRows = filteredCosts.map(l => `
                <tr>
                    <td>${l.date || '—'}</td>
                    <td>${l.method}</td>
                    <td style="text-align:${isAr ? 'left' : 'right'}; font-weight:700; color:#dc2626;">SAR ${l.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>${l.cashier ? l.cashier.split('@')[0] : 'System'}${l.isPastEntry ? ' <em style="color:#f59e0b;">(past)</em>' : ''}</td>
                </tr>`).join('');

    const reportTitle = isAr ? 'تقرير التكاليف والأرباح والخسائر' : 'Cost & P&L Report';
    let companyLabel = 'Burgeroov';
    if (currentCompany === 'mvc') companyLabel = 'MVC FRESH';
    else if (currentCompany === 'mvcfresh') companyLabel = 'MVC Fresh';
    const periodLabel = isAr ? 'الفترة' : 'Period';
    const generatedLabel = isAr ? 'تاريخ الإنشاء' : 'Generated';
    const netProfitLabel = t('label-net-profit');
    const grossSalesLabel = t('label-gross-sales');
    const grossCostsLabel = t('label-gross-costs');
    const transactionsLabel = t('label-transactions');
    const sourceBreakdownLabel = isAr ? 'تحليل التكاليف حسب الفئة' : 'Cost Breakdown by Source';
    const colSourceCategory = isAr ? 'الفئة / المصدر' : 'Source / Category';
    const colTotalSar = isAr ? 'الإجمالي (ريال)' : 'Total (SAR)';
    const colPctTotal = isAr ? '٪ من إجمالي التكاليف' : '% of Total Costs';
    const labelTotal = t('label-total');
    const titleAllTx = t('title-all-transactions');
    const colDate = isAr ? 'التاريخ' : 'Date';
    const colCategory = isAr ? 'الفئة' : 'Category';
    const colAmount = isAr ? 'المبلغ' : 'Amount';
    const colLoggedBy = isAr ? 'بواسطة' : 'Logged By';
    const noCostRecordsMsg = t('msg-no-costs');
    const noTxMsg = t('msg-no-transactions');
    const footerMsg = isAr ?
        `بوابة عمليات ${companyLabel} — سري للغاية | تقرير التكاليف لـ ${labelText}` :
        `${companyLabel} Operations Portal — Confidential | Costs Report for ${labelText}`;

    const printHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8">
            <title>${reportTitle} — ${labelText}</title>
            <style>
                @page { margin: 16mm 12mm; size: A4; }
                * { box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; margin: 0; direction: ${isAr ? 'rtl' : 'ltr'}; }
                h1 { font-size: 20px; margin: 0 0 4px; color: #0f172a; }
                .sub { font-size: 11px; color: #64748b; margin-bottom: 18px; }
                .hud { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
                .hud-box { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
                .hud-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
                .hud-val { font-size: 17px; font-weight: 900; margin-top: 6px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th { background: #f1f5f9; padding: 8px 10px; text-align: ${isAr ? 'right' : 'left'}; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
                td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: ${isAr ? 'right' : 'left'}; }
                tr:last-child td { border-bottom: none; }
                .section-title { font-size: 13px; font-weight: 800; color: #0f172a; margin: 18px 0 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; }
                .profit { color: #16a34a; } .loss { color: #dc2626; } .neutral { color: #475569; }
                .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            </style></head><body>
            <h1>🧾 ${companyLabel} — ${reportTitle}</h1>
            <div class="sub">${periodLabel}: <strong>${labelText}</strong> &nbsp;|&nbsp; ${generatedLabel}: ${new Date().toLocaleString()}</div>

            <div class="hud">
                <div class="hud-box">
                    <div class="hud-label">${netProfitLabel}</div>
                    <div class="hud-val ${netProfit > 0 ? 'profit' : netProfit < 0 ? 'loss' : 'neutral'}">${profitSign}SAR ${Math.abs(netProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div class="hud-box">
                    <div class="hud-label">${grossSalesLabel}</div>
                    <div class="hud-val profit">SAR ${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div class="hud-box">
                    <div class="hud-label">${grossCostsLabel}</div>
                    <div class="hud-val loss">SAR ${totalCosts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div class="hud-box">
                    <div class="hud-label">${transactionsLabel}</div>
                    <div class="hud-val neutral">${filteredSales.length + filteredCosts.length}</div>
                </div>
            </div>

            <div class="section-title">📊 ${sourceBreakdownLabel}</div>
            <table>
                <thead><tr><th>${colSourceCategory}</th><th style="text-align:${isAr ? 'left' : 'right'};">${colTotalSar}</th><th style="text-align:${isAr ? 'left' : 'right'};">${colPctTotal}</th></tr></thead>
                <tbody>${sourceRows || `<tr><td colspan="3" style="text-align:center;color:#94a3b8;">${noCostRecordsMsg}</td></tr>`}</tbody>
                <tfoot><tr style="background:#fef2f2;"><td><strong>${labelTotal}</strong></td><td style="text-align:${isAr ? 'left' : 'right'};font-weight:900;color:#dc2626;">SAR ${totalCosts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td style="text-align:${isAr ? 'left' : 'right'};font-weight:700;">100%</td></tr></tfoot>
            </table>

            <div class="section-title">🧾 ${titleAllTx}</div>
            <table>
                <thead><tr><th>${colDate}</th><th>${colCategory}</th><th style="text-align:${isAr ? 'left' : 'right'};">${colAmount}</th><th>${colLoggedBy}</th></tr></thead>
                <tbody>${txRows || `<tr><td colspan="4" style="text-align:center;color:#94a3b8;">${noTxMsg}</td></tr>`}</tbody>
            </table>

            <div class="footer">${footerMsg}</div>
            </body></html>`;

    const blob = new Blob([printHTML], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    iframe.onload = function () { setTimeout(() => iframe.contentWindow.print(), 300); };
    iframe.src = blobUrl;
    setTimeout(() => { URL.revokeObjectURL(blobUrl); document.body.removeChild(iframe); }, 15000);
}

// --- WAREHOUSE SYSTEM ---

function addWhFolder() {
    const folderName = document.getElementById('new-wh-folder').value.trim();
    if (!folderName) return;
    if (!getCompanyData().whCategories.includes(folderName)) {
        getCompanyData().whCategories.push(folderName);
        document.getElementById('new-wh-folder').value = '';

        // Targeted write to categories list
        db.ref('companies/' + currentCompany + '/whCategories').set(getCompanyData().whCategories)
            .catch(err => console.error("Error adding warehouse category:", err));
    } else {
        alert("Folder already exists.");
    }
}

function deleteWhFolder(folderName) {
    if (!currentUser || (currentUser.role !== 'admin' && !document.body.classList.contains('perm-warehouse'))) {
        alert("You do not have permission to delete folders.");
        return;
    }
    if (!confirm(`Delete folder '${folderName}'? Products inside will be moved to 'Uncategorized'.`)) return;

    getCompanyData().whCategories = getCompanyData().whCategories.filter(f => f !== folderName);

    // Move items in this folder to Uncategorized
    getCompanyData().warehouse.forEach(item => {
        if (item.category === folderName || !item.category) item.category = 'Uncategorized';
    });

    // Targeted write to categories and warehouse list
    db.ref('companies/' + currentCompany + '/whCategories').set(getCompanyData().whCategories)
        .catch(err => console.error("Error deleting category list:", err));
    db.ref('companies/' + currentCompany + '/warehouse').set(getCompanyData().warehouse)
        .catch(err => console.error("Error updating warehouse products categories:", err));
}

function renderWhFolders() {
    const list = document.getElementById('wh-folder-list');
    const select = document.getElementById('wh-folder-select');
    if (!list || !select) return;

    list.innerHTML = '';
    select.innerHTML = '';

    const folders = getCompanyData().whCategories || [];

    folders.forEach(f => {
        // Add to list
        const div = document.createElement('div');
        div.className = "flex-between list-item";
        // Now EVERY folder has a delete button!
        let delBtn = `<button class="btn-outline-danger admin-only" style="padding: 2px 6px; font-size: 0.75rem; border:none;" onclick="deleteWhFolder('${f}')">✖</button>`;
        div.innerHTML = `<span style="font-size:0.9rem; font-weight:600;">📂 ${f}</span> ${delBtn}`;
        list.appendChild(div);

        // Add to dropdown
        const opt = document.createElement('option');
        opt.value = f;
        opt.textContent = `📂 ${f}`;
        select.appendChild(opt);
    });

    // Add a fallback option if you deleted all folders
    if (folders.length === 0) {
        const opt = document.createElement('option');
        opt.value = 'Uncategorized';
        opt.textContent = `📂 Uncategorized`;
        select.appendChild(opt);
    }
}

function addWarehouseItem() {
    const name = document.getElementById('wh-name').value.trim();
    const stock = parseFloat(document.getElementById('wh-stock').value);
    const risk = parseFloat(document.getElementById('wh-risk').value);
    const category = document.getElementById('wh-folder-select').value || 'Uncategorized';

    if (!name || isNaN(stock) || isNaN(risk) || stock < 0 || risk < 0) { alert("Please fill out all product details correctly."); return; }

    let workerId = "";
    let workerName = "Admin";
    if (currentUser && currentUser.role === 'admin') {
        workerId = "admin";
        workerName = currentUser.email ? currentUser.email.split('@')[0] : "Admin";
    } else {
        const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
        workerId = myWorker ? myWorker.id : "";
        workerName = myWorker ? myWorker.name : "Staff";
    }

    const newItem = {
        id: 'wh-' + Date.now().toString(),
        name: name,
        category: category,
        maxStock: stock,
        currentStock: stock,
        riskAmount: risk,
        workerId: workerId,
        logs: [{ date: formatTimestamp(), amount: stock, difference: stock, note: 'Initial Stock Setup', workerId: workerId, workerName: workerName }]
    };

    if (!getCompanyData().warehouse) getCompanyData().warehouse = [];
    getCompanyData().warehouse.push(newItem);
    const itemIndex = getCompanyData().warehouse.length - 1;

    document.getElementById('wh-name').value = ''; document.getElementById('wh-stock').value = ''; document.getElementById('wh-risk').value = '';

    // Targeted write to item index in warehouse
    db.ref('companies/' + currentCompany + '/warehouse/' + itemIndex).set(newItem)
        .then(() => {
            logActivity('warehouse', workerId, workerName, `Added new warehouse item "${name}" with initial stock ${stock}`);
        })
        .catch(err => console.error("Error adding warehouse item:", err));
}

function updateWarehouseStock(itemId) {
    const inputEl = document.getElementById(`wh-update-${itemId}`);
    const newStock = parseFloat(inputEl.value);

    if (isNaN(newStock) || newStock < 0) return;

    const itemIndex = getCompanyData().warehouse.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const item = getCompanyData().warehouse[itemIndex];
    const diff = Math.round((newStock - item.currentStock) * 1000) / 1000;
    if (diff === 0) { inputEl.value = ''; return; }

    let workerId = "";
    let workerName = "Admin";
    if (currentUser && currentUser.role === 'admin') {
        workerId = "admin";
        workerName = currentUser.email ? currentUser.email.split('@')[0] : "Admin";
    } else {
        const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
        workerId = myWorker ? myWorker.id : "";
        workerName = myWorker ? myWorker.name : "Staff";
    }

    item.currentStock = newStock;
    item.logs.unshift({ date: formatTimestamp(), amount: newStock, difference: diff, note: diff > 0 ? 'Refill' : 'Consumption', workerId: workerId, workerName: workerName });
    inputEl.value = '';
    item.workerId = workerId;

    // Targeted write to item index in warehouse
    db.ref('companies/' + currentCompany + '/warehouse/' + itemIndex).set(item)
        .then(() => {
            logActivity('warehouse', workerId, workerName, `Updated stock of "${item.name}" to ${newStock} (Difference: ${diff > 0 ? '+' : ''}${diff})`);
        })
        .catch(err => console.error("Error updating warehouse stock:", err));
}

function editMaxStock(itemId) {
    const itemIndex = getCompanyData().warehouse.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const item = getCompanyData().warehouse[itemIndex];
    const newMax = prompt(t('desc-edit-max') || `Enter new Max / Full Stock for ${item.name}:`, item.maxStock);
    const parsed = parseFloat(newMax);
    if (!isNaN(parsed) && parsed > 0) {
        item.maxStock = parsed;

        let workerId = "";
        let workerName = "Admin";
        if (currentUser && currentUser.role === 'admin') {
            workerId = "admin";
            workerName = currentUser.email ? currentUser.email.split('@')[0] : "Admin";
        } else {
            const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
            workerId = myWorker ? myWorker.id : "";
            workerName = myWorker ? myWorker.name : "Staff";
        }
        item.workerId = workerId;
        if (!item.logs) item.logs = [];
        item.logs.unshift({ date: formatTimestamp(), amount: item.currentStock, difference: 0, note: `Max Stock changed to ${parsed}`, workerId: workerId, workerName: workerName });

        // Targeted write to item index in warehouse using .set()
        db.ref('companies/' + currentCompany + '/warehouse/' + itemIndex).set(item)
            .then(() => {
                logActivity('warehouse', workerId, workerName, `Changed Max/Full Stock of "${item.name}" to ${parsed}`);
            })
            .catch(err => console.error("Error editing max stock:", err));
    }
}

function editRiskAmount(itemId) {
    const itemIndex = getCompanyData().warehouse.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const item = getCompanyData().warehouse[itemIndex];
    const isAr = currentAppLang === 'ar';
    const newRisk = prompt(isAr ? `أدخل حد تنبيه الخطر الجديد للمنتج (${item.name}):` : `Enter new Risk Alert threshold for ${item.name}:`, item.riskAmount);
    const parsed = parseFloat(newRisk);
    if (!isNaN(parsed) && parsed >= 0) {
        item.riskAmount = parsed;

        let workerId = "";
        let workerName = "Admin";
        if (currentUser && currentUser.role === 'admin') {
            workerId = "admin";
            workerName = currentUser.email ? currentUser.email.split('@')[0] : "Admin";
        } else {
            const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
            workerId = myWorker ? myWorker.id : "";
            workerName = myWorker ? myWorker.name : "Staff";
        }
        item.workerId = workerId;
        if (!item.logs) item.logs = [];
        item.logs.unshift({ date: formatTimestamp(), amount: item.currentStock, difference: 0, note: `Risk Alert Limit changed to ${parsed}`, workerId: workerId, workerName: workerName });

        db.ref('companies/' + currentCompany + '/warehouse/' + itemIndex).set(item)
            .then(() => {
                logActivity('warehouse', workerId, workerName, `Changed Risk Alert limit of "${item.name}" to ${parsed}`);
                renderAll();
                checkStockAlerts();
            })
            .catch(err => console.error("Error editing risk amount:", err));
    }
}


function deleteWarehouseItem(itemId) {
    if (!currentUser || (currentUser.role !== 'admin' && !document.body.classList.contains('perm-warehouse'))) {
        alert("You do not have permission to delete products.");
        return;
    }
    if (!confirm(t('confirm-delete-product'))) return;
    const item = getCompanyData().warehouse.find(i => i.id === itemId);
    const name = item ? item.name : 'Unknown';
    getCompanyData().warehouse = getCompanyData().warehouse.filter(i => i.id !== itemId);

    let workerId = "";
    let workerName = "Admin";
    if (currentUser && currentUser.role === 'admin') {
        workerId = "admin";
        workerName = currentUser.email ? currentUser.email.split('@')[0] : "Admin";
    } else {
        const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
        workerId = myWorker ? myWorker.id : "";
        workerName = myWorker ? myWorker.name : "Staff";
    }

    // Targeted write of modified list
    db.ref('companies/' + currentCompany + '/warehouse').set(getCompanyData().warehouse)
        .then(() => {
            logActivity('warehouse_delete', workerId, workerName, `Deleted warehouse item "${name}"`);
        })
        .catch(err => console.error("Error deleting warehouse item:", err));
}

function showMoveSelect(itemId) {
    document.getElementById(`move-btn-${itemId}`).style.display = 'none';
    const sel = document.getElementById(`move-select-${itemId}`);
    sel.style.display = 'inline-block';
    sel.focus();
}

function cancelMoveSelect(itemId) {
    const sel = document.getElementById(`move-select-${itemId}`);
    if (sel) {
        sel.style.display = 'none';
        sel.value = '';
    }
    const btn = document.getElementById(`move-btn-${itemId}`);
    if (btn) btn.style.display = 'inline-block';
}

function executeMove(itemId, folderName) {
    if (!folderName) {
        cancelMoveSelect(itemId);
        return;
    }
    const itemIndex = getCompanyData().warehouse.findIndex(i => i.id === itemId);
    if (itemIndex !== -1) {
        const item = getCompanyData().warehouse[itemIndex];
        const oldCat = item.category || 'Uncategorized';
        item.category = folderName;

        let workerId = "";
        let workerName = "Admin";
        if (currentUser && currentUser.role === 'admin') {
            workerId = "admin";
            workerName = currentUser.email ? currentUser.email.split('@')[0] : "Admin";
        } else {
            const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
            workerId = myWorker ? myWorker.id : "";
            workerName = myWorker ? myWorker.name : "Staff";
        }
        item.workerId = workerId;

        // Targeted write to item index in warehouse using .set()
        db.ref('companies/' + currentCompany + '/warehouse/' + itemIndex).set(item)
            .then(() => {
                logActivity('warehouse', workerId, workerName, `Moved item "${item.name}" from category "${oldCat}" to "${folderName}"`);
            })
            .catch(err => console.error("Error moving warehouse item:", err));
    }
}

function checkStockAlerts() {
    const data = getCompanyData();
    const alertBox = document.getElementById('global-stock-alerts');
    if (!alertBox) return;
    if (!data.warehouse) {
        alertBox.style.display = 'none';
        return;
    }

    const isAdmin = currentUser && currentUser.role === 'admin';
    const hasWhAccess = isAdmin || document.body.classList.contains('perm-warehouse');
    if (!hasWhAccess) {
        alertBox.style.display = 'none';
        return;
    }

    const lowItems = data.warehouse.filter(i => i.currentStock <= i.riskAmount);

    if (lowItems.length > 0) {
        const names = lowItems.map(i => `${i.name} (${i.currentStock} ${t('label-currently-left')})`).join(', ');
        alertBox.innerHTML = `<span style="font-size: 1.2rem; margin-right: 10px;">🚨</span> <strong>${t('msg-critical-stock')}:</strong> ${names}.`;
        alertBox.style.display = 'block';
    } else { alertBox.style.display = 'none'; }
}

function renderWarehouse() {
    renderWhFolders(); // Render the folder manager UI first

    const list = document.getElementById('warehouse-list'); list.innerHTML = '';
    const data = getCompanyData();
    const isAr = currentAppLang === 'ar';

    let isWHAdmin = false;
    if (currentUser && (currentUser.role === 'admin' || document.body.classList.contains('perm-warehouse'))) {
        isWHAdmin = true;
    }

    const searchQuery = document.getElementById('wh-search').value.toLowerCase();

    if (!data.warehouse || data.warehouse.length === 0) {
        list.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:20px; background:var(--input-bg); border-radius:var(--radius-md);">Warehouse is empty.</p>`;
        return;
    }

    const filteredItems = data.warehouse.filter(i => i.name.toLowerCase().includes(searchQuery));

    if (filteredItems.length === 0) {
        list.innerHTML = `<p style="color:var(--text-muted); text-align:center;">No items match.</p>`;
        return;
    }

    // Gather official folders AND any rogue/uncategorized item categories dynamically
    let folders = [...(data.whCategories || [])];
    filteredItems.forEach(i => {
        const cat = i.category || 'Uncategorized';
        if (!folders.includes(cat)) {
            folders.push(cat);
        }
    });

    folders.forEach(folder => {
        const itemsInFolder = filteredItems.filter(i => (i.category || 'Uncategorized') === folder);

        // Show folder if it has items, OR if we are not searching
        if (itemsInFolder.length > 0 || !searchQuery) {

            const folderId = 'folder-content-' + folder.replace(/\s+/g, '-');
            const isSearchActive = searchQuery.length > 0; // If searching, keep folders open

            window.expandedWhFolders = window.expandedWhFolders || {};
            const isFolderExpanded = isSearchActive || window.expandedWhFolders[folderId] === true;
            const folderDisplay = isFolderExpanded ? 'flex' : 'none';
            const folderIcon = isFolderExpanded ? '📂' : '📁';

            // Create Interactive Folder Card
            const header = document.createElement('div');
            header.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: var(--card-bg); color: var(--text-main); padding: 16px 20px; border: 1px solid var(--border-color); border-radius: 12px; cursor: pointer; margin-top: 12px; transition: var(--transition); box-shadow: var(--shadow-sm);";

            // Hover effects
            header.onmouseover = () => header.style.borderColor = 'var(--primary)';
            header.onmouseout = () => header.style.borderColor = 'var(--border-color)';

            header.innerHTML = `
                        <div style="display:flex; align-items:center; gap:12px; font-weight: 700; font-size: 1.15rem;">
                            <span style="font-size:1.8rem;" id="icon-${folderId}">${folderIcon}</span> 
                            ${folder}
                        </div>
                        <span style="font-size: 0.85rem; font-weight:600; color: var(--text-muted); background: var(--input-bg); padding: 4px 10px; border-radius: 20px;">${itemsInFolder.length} Items</span>
                    `;

            // Content Container (Hidden by default unless searching)
            const contentDiv = document.createElement('div');
            contentDiv.id = folderId;
            contentDiv.style.cssText = `display: ${folderDisplay}; flex-direction: column; gap: 12px; margin-top: 12px; margin-bottom: 24px; padding-left: 10px; border-left: 3px solid var(--primary); margin-left: 10px;`;

            // Click to toggle folder open/closed
            header.onclick = () => {
                const isOpen = contentDiv.style.display === 'flex';
                contentDiv.style.display = isOpen ? 'none' : 'flex';
                document.getElementById(`icon-${folderId}`).textContent = isOpen ? '📁' : '📂';

                window.expandedWhFolders = window.expandedWhFolders || {};
                if (isOpen) {
                    delete window.expandedWhFolders[folderId];
                } else {
                    window.expandedWhFolders[folderId] = true;
                }
            };

            list.appendChild(header);
            list.appendChild(contentDiv);

            if (itemsInFolder.length === 0) {
                contentDiv.innerHTML = `<div style="color:var(--text-muted); font-size:0.9rem; padding:10px;">Empty folder.</div>`;
                return;
            }

            // Create items inside this folder
            itemsInFolder.forEach(item => {
                const pct = Math.min(100, Math.max(0, (item.currentStock / item.maxStock) * 100));
                const isLow = item.currentStock <= item.riskAmount;
                const div = document.createElement('div'); div.className = `wh-item ${isLow ? 'low-stock' : ''}`;

                let logsHtml = item.logs.map(l => {
                    let changerName = l.workerName;
                    if (!changerName) {
                        if (l.workerId === 'admin') {
                            changerName = 'Admin';
                        } else if (l.workerId) {
                            const wObj = data.workers ? data.workers.find(w => w.id === l.workerId) : null;
                            changerName = wObj ? wObj.name : 'Staff';
                        } else {
                            changerName = 'Staff';
                        }
                    }
                    const logDiff = (typeof l.difference === 'number') ? (Math.round(l.difference * 1000) / 1000) : l.difference;
                    return `
                             <div class="flex-between" style="border-bottom: 1px solid var(--border-color); padding: 6px 0; font-size: 0.85rem;">
                                 <span>🕒 ${l.date}</span>
                                 <span>${t('label-by')}: <strong style="color:var(--primary);">${changerName}</strong></span>
                                 <span>Total: <strong>${l.amount}</strong> <span style="color:${logDiff > 0 ? 'var(--success)' : 'var(--danger)'}">(${logDiff > 0 ? '+' : ''}${logDiff})</span></span>
                             </div>`;
                }).join('');

                const logId = `wh-logs-${item.id}`;
                window.expandedWhLogs = window.expandedWhLogs || {};
                const isLogExpanded = window.expandedWhLogs[logId] === true;
                const logDisplay = isLogExpanded ? 'block' : 'none';

                div.innerHTML = `
                            <div class="flex-between">
                                <h3 style="margin:0; color:var(--text-main); font-size:1.15rem;">${item.name}</h3>
                                <div style="text-align:right;"><span style="font-size:1.4rem; font-weight:800; color:${isLow ? 'var(--danger)' : 'var(--primary)'}">${item.currentStock}</span> <span style="color:var(--text-muted); font-weight:600;">/ ${item.maxStock}</span></div>
                            </div>
                            ${isLow ? `<div class="text-danger" style="font-size:0.8rem; margin-top:4px; font-weight:600;">⚠️ ${t('label-currently-left')}: ${item.currentStock} (${t('label-risk-alert')}: ${item.riskAmount})</div>` : ''}
                            <div class="wh-progress"><div class="wh-fill ${isLow ? 'low' : ''}" style="width: ${pct}%"></div></div>
                            
                            <div class="flex-between" style="margin-top: 20px; flex-wrap:wrap; gap:10px;">
                                <div style="display:flex; gap:8px; flex:1; min-width: 200px;">
                                    <input type="number" step="any" id="wh-update-${item.id}" placeholder="${isAr ? 'الكمية الجديدة (مثال: 0.5)' : 'New stock amount (e.g. 0.5)'}" style="flex:1;" min="0">
                                    <button onclick="updateWarehouseStock('${item.id}')" class="btn-success">${t('btn-change-stock') || 'Change'}</button>
                                </div>
                                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                    <button onclick="toggleDetails('wh-logs-${item.id}')" class="btn-neutral">History</button>
                                    ${isWHAdmin ? `
                                        <button id="move-btn-${item.id}" onclick="showMoveSelect('${item.id}')" class="btn-outline">📂 Move</button>
                                        <select id="move-select-${item.id}" onchange="executeMove('${item.id}', this.value)" onblur="cancelMoveSelect('${item.id}')" style="display:none; width:auto; padding: 4px 12px; font-size: 0.85rem;">
                                            <option value="">Choose...</option>
                                            <option value="Uncategorized">📂 Uncategorized</option>
                                            ${(data.whCategories || []).map(f => `<option value="${f}">📂 ${f}</option>`).join('')}
                                        </select>
                                    ` : ''}
                                    ${isWHAdmin ? `<button onclick="editMaxStock('${item.id}')" class="btn-outline">✏️ Max</button>` : ''}
                                    ${isWHAdmin ? `<button onclick="editRiskAmount('${item.id}')" class="btn-outline">⚠️ Risk</button>` : ''}
                                    ${isWHAdmin ? `<button onclick="deleteWarehouseItem('${item.id}')" class="btn-outline-danger">✖</button>` : ''}
                                </div>
                            </div>

                            <div id="${logId}" class="wh-logs" style="display:${logDisplay};">${logsHtml || 'No logs yet.'}</div>`;
                contentDiv.appendChild(div);
            });
        }
    });
}

function exportWarehousePDF() {
    const data = getCompanyData().warehouse;
    if (!data || data.length === 0) return alert("Warehouse is empty.");

    // Gather all folders dynamically
    let folders = [...(getCompanyData().whCategories || [])];
    data.forEach(i => {
        const cat = i.category || 'Uncategorized';
        if (!folders.includes(cat)) folders.push(cat);
    });

    let rowsHtml = '';
    let criticalList = [];

    // Group by folders for PDF too
    folders.forEach(folder => {
        const itemsInFolder = data.filter(i => (i.category || 'Uncategorized') === folder);
        if (itemsInFolder.length > 0) {
            rowsHtml += `<tr style="background-color: #f1f5f9;"><td colspan="3" style="padding:10px; font-weight:bold; color:#334155;">📂 ${folder}</td></tr>`;

            itemsInFolder.forEach(i => {
                const isLow = i.currentStock <= i.riskAmount;
                const toOrder = Math.max(0, i.maxStock - i.currentStock);

                if (isLow) {
                    criticalList.push(`<li style="margin-bottom:6px;"><strong>${i.name}</strong> (${folder}): Need to order <strong>${toOrder}</strong></li>`);
                }

                const rowBg = isLow ? 'background-color:#fef2f2; color:#dc2626; font-weight:bold;' : '';
                const nameDisplay = isLow ? `&#x1F6A8; ${i.name}` : i.name;

                rowsHtml += `
                            <tr style="${rowBg}">
                                <td style="padding:8px 8px 8px 24px; border:1px solid #e2e8f0;">${nameDisplay}</td>
                                <td style="padding:8px; border:1px solid #e2e8f0; text-align:center;">${i.currentStock} / ${i.maxStock}</td>
                                <td style="padding:8px; border:1px solid #e2e8f0; text-align:center;">${toOrder}</td>
                            </tr>
                        `;
            });
        }
    });

    let criticalHtml = '';
    if (criticalList.length > 0) {
        criticalHtml = `
                    <div style="margin-top:30px; border:2px solid #dc2626; padding:15px; border-radius:8px; background-color:#fef2f2;">
                        <h3 style="color:#dc2626; margin-top:0; font-size:16px;">&#x1F6A8; CRITICAL RESTOCK ORDERS</h3>
                        <ul style="color:#dc2626; margin-bottom:0; font-size:14px; list-style-type:square;">
                            ${criticalList.join('')}
                        </ul>
                    </div>
                `;
    }

    const printHTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
                <title>Burgeroov Restock Report</title>
                <style>
                    @page { size: portrait; margin: 0mm !important; }
                    body { font-family: Arial, sans-serif; color: #1e293b; padding: 15mm; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    h2 { color: #452b1b; border-bottom: 2px solid #452b1b; padding-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
                    th { background-color: #452b1b; color: #fff; padding: 10px; border: 1px solid #cbd5e1; text-align: left; }
                    td { border: 1px solid #e2e8f0; }
                </style></head><body>
                <h2>Burgeroov Restock Report</h2>
                <p style="color:#64748b; font-size:13px;">Generated: ${new Date().toLocaleString()}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Product Name</th>
                            <th style="text-align:center;">Currently Left</th>
                            <th style="text-align:center;">Amount to Order</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
                ${criticalHtml}
                </body></html>`;

    const blob = new Blob([printHTML], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    iframe.onload = function () { setTimeout(function () { iframe.contentWindow.print(); }, 300); };
    iframe.src = blobUrl;
    setTimeout(() => { URL.revokeObjectURL(blobUrl); document.body.removeChild(iframe); }, 10000);
}

// --- UTILITIES ---
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

function showImage(src) { document.getElementById('image-modal-content').src = src; document.getElementById('image-modal').style.display = 'flex'; }

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
    currentTab = tab;

    // --- Check if this tab is locked for the current user ---
    const tabBtn = document.getElementById(`tab-${tab}`);
    const isLocked = tabBtn ? tabBtn.classList.contains('tab-locked') : false;

    // Update the locked view label with the department name
    if (isLocked) {
        const label = document.getElementById('locked-dept-label');
        if (label && tabBtn) {
            // Strip the ⛓️ emoji appended by CSS ::after (it's not in textContent)
            label.textContent = tabBtn.textContent.trim();
        }
    }

    const allTabs = ['ops', 'ranks', 'attendance', 'tasks', 'warehouse', 'drivers', 'finance', 'summary', 'adverts', 'notes', 'activity', 'managing', 'costs'];

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
function getExportData(lang) {
    const workers = getVisibleWorkers();
    const data = []; const t = translations[lang];
    workers.forEach(w => {
        const stats = getMonthlyStats(w, currentGlobalMonth);
        const monthlyLogs = getLogsForMonth(w, currentGlobalMonth);
        const baseIncome = parseFloat(w.income || 0);
        const volumeReward = typeof getDriverVolumeRewardsForMonth === 'function' ? getDriverVolumeRewardsForMonth(w, currentGlobalMonth) : 0;
        const rewards = calculateRewardsTotal(stats.rewardsList) + volumeReward;
        const violations = calculateViolationsTotal(stats.violationsList);
        const paid = calculatePaymentsTotal(stats.paymentsList);

        const sysViolDeduction = typeof getSystemViolationDeductionsForMonth === 'function' ? getSystemViolationDeductionsForMonth(w, currentGlobalMonth) : 0;
        const lateDeduction = typeof getLateDeductionsForMonth === 'function' ? getLateDeductionsForMonth(w, currentGlobalMonth) : 0;
        const netIncome = baseIncome + rewards - violations - sysViolDeduction - lateDeduction - paid;
        const remaining = getCumulativeBalance(w, currentGlobalMonth);
        const custodyTotal = calculateCustodyTotal(stats.custodyList);

        const goodNotes = monthlyLogs.filter(l => (l.noteType === 'good' || l.score == 100) && l.noteType !== 'vacation').length;
        const badNotes = monthlyLogs.filter(l => (l.noteType === 'bad' || l.score == 2.5) && l.noteType !== 'vacation').length;
        const deliveries = (stats.deliveriesList ? stats.deliveriesList.length : 0) + (stats.legacyDeliveries || 0);

        data.push({
            [t.empName]: w.name, [t.role]: w.role || t.unassigned, [t.branch]: w.branch || t.na, [t.shift]: `${w.startTime || '??:??'} - ${w.endTime || '??:??'}`,
            [t.initialBalance]: parseFloat(w.initialBalance || 0),
            [t.baseIncome]: baseIncome, [t.rewards]: rewards, [t.violations]: violations, [t.netPay]: netIncome,
            [t.paid]: paid, [t.remaining]: remaining,
            [t.costs]: parseFloat(stats.costs || 0), [t.custody]: custodyTotal,
            [t.avgPerf]: getAveragePerfection(monthlyLogs), [t.goodNotes]: goodNotes, [t.badNotes]: badNotes, [t.deliveries]: deliveries
        });
    });
    return data;
}

function exportToExcel() {
    const lang = document.getElementById('export-lang').value;
    const data = getExportData(lang);
    if (data.length === 0) { alert(lang === 'ar' ? "لا توجد سجلات." : "No records to export."); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    if (lang === 'ar') ws['!dir'] = 'rtl';
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Financial_Payroll");
    XLSX.writeFile(wb, `Burgeroov_Finance_${currentGlobalMonth}.xlsx`);
}

function exportToPDF() {
    const lang = document.getElementById('export-lang').value;
    const data = getExportData(lang);
    const t = translations[lang];
    if (data.length === 0) { alert(lang === 'ar' ? "لا توجد سجلات." : "No records to export."); return; }

    const headerColor = '#452b1b';
    const printTitle = lang === 'ar' ? `تقرير BURGEROOV المالي (${currentGlobalMonth})` : `BURGEROOV Financial Report (${currentGlobalMonth})`;
    const direction = lang === 'ar' ? 'rtl' : 'ltr'; const textAlign = lang === 'ar' ? 'right' : 'left';

    const printHTML = `
                <!DOCTYPE html><html dir="${direction}" lang="${lang}"><head><meta charset="UTF-8"><title>${printTitle}</title>
                <style>
                    @page { size: landscape; margin: 0 !important; }
                    @media print {
                        html, body { margin: 0 !important; padding: 0 !important; }
                    }
                    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #1e293b; padding: 15mm; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    h2 { color: ${headerColor}; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; text-align: ${textAlign}; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; text-align: ${textAlign}; }
                    th { background-color: ${headerColor}; color: white; padding: 10px; border: 1px solid #cbd5e1; }
                    td { padding: 8px 10px; border: 1px solid #e2e8f0; }
                    tr:nth-child(even) td { background-color: #f8fafc; }
                    .footer { margin-top: 30px; font-size: 10px; color: #64748b; text-align: ${lang === 'ar' ? 'left' : 'right'}; }
                </style></head><body>
                <h2>${printTitle}</h2><table><thead><tr>${Object.keys(data[0]).map(key => `<th>${key}</th>`).join('')}</tr></thead>
                <tbody>${data.map(row => `<tr>${Object.values(row).map(val => `<td>${val}</td>`).join('')}</tr>`).join('')}</tbody></table>
                <div class="footer">${t.generatedOn} ${new Date().toLocaleString()}</div>
                </body></html>
            `;

    const blob = new Blob([printHTML], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe'); iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    iframe.onload = function () { setTimeout(function () { iframe.contentWindow.print(); }, 250); };
    iframe.src = blobUrl;
    setTimeout(() => { URL.revokeObjectURL(blobUrl); document.body.removeChild(iframe); }, 10000);
}

// --- WORKER FINANCE PDF EXPORT ---
function exportWorkerFinancePDF() {
    let worker = null;

    // For admin: use the selected worker in the dropdown
    if (currentUser && currentUser.role === 'admin') {
        const workerId = document.getElementById('fin-worker-select').value;
        if (!workerId) {
            // No worker selected — export all workers using the existing exportToPDF
            exportToPDF();
            return;
        }
        worker = getCompanyData().workers.find(w => w.id === workerId);
    } else {
        // For worker: auto-find their own profile
        worker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
    }

    if (!worker) { alert('No worker profile found to export.'); return; }

    const stats = getMonthlyStats(worker, currentGlobalMonth);
    const base = parseFloat(worker.income || 0);
    const rewards = calculateRewardsTotal(stats.rewardsList);
    const violations = calculateViolationsTotal(stats.violationsList);
    const paid = calculatePaymentsTotal(stats.paymentsList);
    const sysViolDeduction = typeof getSystemViolationDeductionsForMonth === 'function' ? getSystemViolationDeductionsForMonth(worker, currentGlobalMonth) : 0;
    const lateDeduction = typeof getLateDeductionsForMonth === 'function' ? getLateDeductionsForMonth(worker, currentGlobalMonth) : 0;
    const volumeReward = typeof getDriverVolumeRewardsForMonth === 'function' ? getDriverVolumeRewardsForMonth(worker, currentGlobalMonth) : 0;
    const overtime = calculateOvertimeTotal(stats.overtimeList);
    const net = base + rewards + volumeReward + overtime - violations - paid - sysViolDeduction - lateDeduction;
    const allTimeRemaining = getCumulativeBalance(worker, currentGlobalMonth);
    const custodyTotal = calculateCustodyTotal(stats.custodyList);

    // Build violations rows
    let violRows = '';
    (stats.violationsList || []).forEach(v => {
        let statusText = '';
        let statusColor = '#dc2626';
        if (v.status === 'waived') {
            statusText = '✅ Fixed & Waived'; statusColor = '#16a34a';
        } else if (v.status === 'active' || !v.status) {
            statusText = '🚨 Penalty Applied'; statusColor = '#dc2626';
        } else if (v.status === 'pending') {
            const deadline = v.timestamp + (v.graceDays * 86400000);
            const timeLeft = deadline - Date.now();
            if (timeLeft <= 0) { statusText = '🚨 Time Expired — Applied'; statusColor = '#dc2626'; }
            else {
                const daysLeft = Math.floor(timeLeft / 86400000);
                const hoursLeft = Math.floor((timeLeft % 86400000) / 3600000);
                statusText = `⏳ Fix within: ${daysLeft > 0 ? daysLeft + 'd ' : ''}${hoursLeft}h (${v.graceDays} day grace)`;
                statusColor = '#d97706';
            }
        }
        const strikethrough = v.status === 'waived' ? 'text-decoration:line-through;' : '';
        violRows += `<tr>
                    <td style="padding:8px 10px; border:1px solid #e2e8f0;">${v.date}</td>
                    <td style="padding:8px 10px; border:1px solid #e2e8f0;">${v.reason}</td>
                    <td style="padding:8px 10px; border:1px solid #e2e8f0; ${strikethrough}">- SAR ${parseFloat(v.amount).toLocaleString()}</td>
                    <td style="padding:8px 10px; border:1px solid #e2e8f0; color:${statusColor}; font-weight:600;">${statusText}</td>
                </tr>`;
    });
    if (!violRows) violRows = `<tr><td colspan="4" style="text-align:center; color:#64748b; padding:10px; border:1px solid #e2e8f0;">No violations this month ✅</td></tr>`;

    // Build payments rows
    let payRows = '';
    (stats.paymentsList || []).forEach(p => {
        payRows += `<tr><td style="padding:8px 10px; border:1px solid #e2e8f0;">${p.date}</td><td style="padding:8px 10px; border:1px solid #e2e8f0; color:#0284c7; font-weight:600;">SAR ${parseFloat(p.amount).toLocaleString()}</td></tr>`;
    });
    if (!payRows) payRows = `<tr><td colspan="2" style="text-align:center; color:#64748b; padding:10px; border:1px solid #e2e8f0;">No payments recorded this month</td></tr>`;

    // Build overtime rows
    let overtimeRows = '';
    (stats.overtimeList || []).forEach(o => {
        overtimeRows += `<tr><td style="padding:8px 10px; border:1px solid #e2e8f0;">${o.date}</td><td style="padding:8px 10px; border:1px solid #e2e8f0;">x${o.multiplier || '1.00'} (${o.hours || '1'} hr)</td><td style="padding:8px 10px; border:1px solid #e2e8f0; color:#f59e0b; font-weight:600;">SAR ${parseFloat(o.amount || 0).toLocaleString()}</td></tr>`;
    });
    if (!overtimeRows) overtimeRows = `<tr><td colspan="3" style="text-align:center; color:#64748b; padding:10px; border:1px solid #e2e8f0;">No overtime recorded this month</td></tr>`;

    const headerColor = '#452b1b';
    const printHTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
            <title>Financial Report — ${worker.name} (${currentGlobalMonth})</title>
            <style>
                @page { size: portrait; margin: 0mm !important; }
                @media print { html, body { margin: 0 !important; padding: 0 !important; } }
                body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 12mm; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 13px; }
                .header { background: ${headerColor}; color: white; padding: 20px 24px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
                .header h1 { margin: 0; font-size: 18px; }
                .header .meta { font-size: 12px; opacity: 0.85; text-align: right; }
                .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
                .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; }
                .summary-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
                .summary-card .value { font-size: 18px; font-weight: 800; margin-top: 4px; }
                .section-title { font-size: 13px; font-weight: 700; color: ${headerColor}; border-bottom: 2px solid ${headerColor}; padding-bottom: 6px; margin: 18px 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
                th { background: ${headerColor}; color: white; padding: 10px; text-align: left; border: 1px solid #cbd5e1; font-size: 11px; }
                .highlight-row td { background: #fffbeb; font-weight: 700; }
                .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; }
            </style></head><body>
                <div class="header">
                    <div>
                        <h1>💰 Financial Report</h1>
                        <div style="font-size:13px; margin-top:4px; opacity:0.9;">${worker.name} &nbsp;•&nbsp; ${worker.role || 'Staff'} &nbsp;•&nbsp; ${worker.branch || ''}</div>
                    </div>
                    <div class="meta">
                        <div>Month: <strong>${currentGlobalMonth}</strong></div>
                        <div>Shift: ${worker.startTime || '--'} – ${worker.endTime || '--'}</div>
                    </div>
                </div>

                <div class="summary-grid">
                    <div class="summary-card">
                        <div class="label">Base Salary</div>
                        <div class="value" style="color:${headerColor};">SAR ${base.toLocaleString()}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Net This Month</div>
                        <div class="value" style="color:${net >= 0 ? '#16a34a' : '#dc2626'};">SAR ${net.toLocaleString()}</div>
                    </div>
                    <div class="summary-card" style="border-color:#b45309; background:#fffbeb;">
                        <div class="label">Total Remaining (All-Time)</div>
                        <div class="value" style="color:#b45309;">SAR ${allTimeRemaining.toLocaleString()}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Rewards</div>
                        <div class="value" style="color:#16a34a;">+ SAR ${rewards.toLocaleString()}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Violations</div>
                        <div class="value" style="color:#dc2626;">- SAR ${violations.toLocaleString()}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Custody</div>
                        <div class="value" style="color:#d97706;">SAR ${custodyTotal.toLocaleString()}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Overtime</div>
                        <div class="value" style="color:#f59e0b;">+ SAR ${overtime.toLocaleString()}</div>
                    </div>
                </div>

                <div class="section-title">⚠️ Violations & Fix Status</div>
                <table>
                    <thead><tr><th>Date</th><th>Reason</th><th>Amount</th><th>Status / Fix Time</th></tr></thead>
                    <tbody>${violRows}</tbody>
                </table>

                <div class="section-title">💵 Advance Payments This Month</div>
                <table>
                    <thead><tr><th>Date</th><th>Amount Paid</th></tr></thead>
                    <tbody>${payRows}</tbody>
                    <tfoot><tr class="highlight-row"><td style="padding:8px 10px; border:1px solid #e2e8f0;">Total Paid</td><td style="padding:8px 10px; border:1px solid #e2e8f0; color:#0284c7;">SAR ${paid.toLocaleString()}</td></tr></tfoot>
                </table>

                <div class="section-title">🕒 Overtime Logs This Month</div>
                <table>
                    <thead><tr><th>Date</th><th>Multiplier / Hours</th><th>Amount</th></tr></thead>
                    <tbody>${overtimeRows}</tbody>
                    <tfoot><tr class="highlight-row"><td style="padding:8px 10px; border:1px solid #e2e8f0;" colspan="2">Total Overtime</td><td style="padding:8px 10px; border:1px solid #e2e8f0; color:#f59e0b;">SAR ${overtime.toLocaleString()}</td></tr></tfoot>
                </table>

                <div class="footer">
                    <span>Burgeroov Management Portal</span>
                    <span>Generated: ${new Date().toLocaleString()}</span>
                </div>
            </body></html>`;

    const blob = new Blob([printHTML], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    iframe.onload = function () { setTimeout(function () { iframe.contentWindow.print(); }, 300); };
    iframe.src = blobUrl;
    setTimeout(() => { URL.revokeObjectURL(blobUrl); document.body.removeChild(iframe); }, 15000);
}

// --- VIOLATION RULES SYSTEM ---
function addViolationRule() {
    const name = document.getElementById('new-vrule-name').value.trim();
    const amount = parseFloat(document.getElementById('new-vrule-amount').value);
    if (!name || isNaN(amount) || amount <= 0) { alert("Please provide a valid name and amount."); return; }
    getCompanyData().violationRules.push({ id: Date.now().toString(), name, amount });
    document.getElementById('new-vrule-name').value = ''; document.getElementById('new-vrule-amount').value = '';

    // Targeted write to global violationRules list
    db.ref('companies/' + currentCompany + '/violationRules').set(getCompanyData().violationRules)
        .catch(err => console.error("Error adding violation rule:", err));
}

function deleteViolationRule(id) {
    getCompanyData().violationRules = getCompanyData().violationRules.filter(r => r.id !== id);

    // Targeted write to global violationRules list
    db.ref('companies/' + currentCompany + '/violationRules').set(getCompanyData().violationRules)
        .catch(err => console.error("Error deleting violation rule:", err));
}

function renderViolationRules() {
    const list = document.getElementById('vrule-list'); list.innerHTML = '';
    const select = document.getElementById('v-rule-select');
    if (select) select.innerHTML = '<option value="">-- Custom / Select Rule --</option>';

    getCompanyData().violationRules.forEach(rule => {
        const li = document.createElement('li'); li.className = 'flex-between list-item';
        li.innerHTML = `<div><span style="font-weight: 600; color:var(--text-main);">${rule.name}</span><br><span style="font-size:0.8rem; color:var(--danger); font-weight: 500;">- SAR ${rule.amount}</span></div> <button class="btn-outline-danger" style="padding: 4px 10px; font-size: 0.75rem;" onclick="deleteViolationRule('${rule.id}')">Del</button>`;
        list.appendChild(li);
        if (select) {
            const option = document.createElement('option'); option.value = rule.amount; option.dataset.name = rule.name; option.textContent = `${rule.name} (-${rule.amount} SAR)`;
            select.appendChild(option);
        }
    });
}

function autoFillViolation() {
    const select = document.getElementById('v-rule-select');
    const amountInput = document.getElementById('v-amount');
    const reasonInput = document.getElementById('v-reason');
    if (select.value) { amountInput.value = select.value; reasonInput.value = select.options[select.selectedIndex].dataset.name; }
    else { amountInput.value = ''; reasonInput.value = ''; }
}

function applyDetailedViolation() {
    const workerId = document.getElementById('fin-worker-select').value;
    if (!workerId) { alert("Select an employee first."); return; }
    const amount = parseFloat(document.getElementById('v-amount').value);
    const reason = document.getElementById('v-reason').value.trim();
    const gracePeriod = parseInt(document.getElementById('v-grace-period').value);
    const fileInput = document.getElementById('v-image');

    if (isNaN(amount) || amount <= 0) { alert("Please enter a valid violation amount."); return; }
    if (!reason) { alert("Please provide a reason or note for this violation."); return; }

    const worker = getCompanyData().workers.find(w => w.id === workerId);
    const stats = getMonthlyStats(worker, currentGlobalMonth);

    const newViolation = {
        id: Date.now().toString(), date: formatTimestamp(), timestamp: Date.now(),
        amount: amount, reason: reason, graceDays: gracePeriod, status: gracePeriod > 0 ? 'pending' : 'active', image: null
    };

    if (fileInput.files && fileInput.files[0]) {
        compressImage(fileInput.files[0], (base64Img) => {
            newViolation.image = base64Img;
            saveViolationRecord(workerId, stats, newViolation);
        });
    } else {
        saveViolationRecord(workerId, stats, newViolation);
    }
}

function saveViolationRecord(workerId, stats, record) {
    stats.violationsList.unshift(record);
    document.getElementById('v-amount').value = ''; document.getElementById('v-reason').value = '';
    document.getElementById('v-rule-select').value = ''; document.getElementById('v-image').value = '';

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex !== -1) {
        const worker = getCompanyData().workers[workerIndex];
        db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/violationsList`).set(stats.violationsList)
            .then(() => {
                if (typeof logActivity === 'function') {
                    logActivity('violation', worker.id, worker.name, `Added violation to ${worker.name}: "${record.reason}" (SAR ${record.amount})`);
                }
            })
            .catch(err => console.error("Error saving violation record:", err));
    }
}

function deleteDetailedViolation(workerId, violationId) {
    if (!confirm("Are you sure you want to remove this violation?")) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex !== -1) {
        const worker = getCompanyData().workers[workerIndex];
        const stats = getMonthlyStats(worker, currentGlobalMonth);
        stats.violationsList = stats.violationsList.filter(v => v.id !== violationId);

        db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/violationsList`).set(stats.violationsList)
            .then(() => {
                if (typeof logActivity === 'function') {
                    logActivity('violation', worker.id, worker.name, `Deleted violation record from ${worker.name}`);
                }
            })
            .catch(err => console.error("Error deleting violation record:", err));
    }
}

function resolveViolation(workerId, violationId, action) {
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex !== -1) {
        const worker = getCompanyData().workers[workerIndex];
        const stats = getMonthlyStats(worker, currentGlobalMonth);
        const v = stats.violationsList.find(v => v.id === violationId);
        if (v) {
            if (action === 'waive') v.status = 'waived';
            if (action === 'apply') v.status = 'active';

            db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/violationsList`).set(stats.violationsList)
                .catch(err => console.error("Error resolving violation:", err));
        }
    }
}

// --- RANKS SYSTEM ---
function manuallyUpdateRank(workerId, newRank) {
    if (!newRank) return;
    if (!confirm(`Change rank to ${newRank}?`)) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    worker.rank = newRank;
    worker.lastEvalDate = Date.now();

    // Targeted update to worker rank and evaluation date attributes
    db.ref(`companies/${currentCompany}/workers/${workerIndex}`).update({
        rank: newRank,
        lastEvalDate: worker.lastEvalDate
    }).catch(err => console.error("Error manually updating rank:", err));
}

function renderRanksTable() {
    const tbody = document.querySelector('#ranks-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const now = Date.now();
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;

    const workers = getVisibleWorkers();

    if (workers.length === 0 && (!currentUser || currentUser.role !== 'admin')) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Your account is not linked to any worker profile yet.</td></tr>`;
        return;
    }

    workers.forEach(worker => {
        let relevantLogs = worker.logs.filter(l => (now - new Date(l.date).getTime()) <= ninetyDays);
        let gradedLogs = relevantLogs.filter(l => l.noteType !== 'vacation' && l.score !== 'vacation');

        let avgDisplay = 'N/A';
        if (gradedLogs.length > 0) {
            let sum = gradedLogs.reduce((acc, l) => acc + parseFloat(l.score), 0);
            avgDisplay = Math.round(sum / gradedLogs.length) + '%';
        }

        const detailsId = `rank-details-${worker.id}`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
                    <td>
                        <strong style="color:var(--text-main);">${worker.name}</strong><br>
                        <span class="text-muted-heavy">${worker.branch}</span>
                    </td>
                    <td><span class="rank-badge rank-${worker.rank}">${worker.rank}</span></td>
                    <td>
                        <div style="display:flex; align-items:center; gap:8px; cursor:pointer;" onclick="toggleDetails('${detailsId}')">
                            <span class="badge" style="background: var(--primary); margin:0;">${avgDisplay}</span>
                            <span style="font-size:0.7rem; color:var(--primary);">▼ Log</span>
                        </div>
                        <div class="breakdown-details" id="${detailsId}" style="max-height: 200px; overflow-y:auto; margin-top: 10px;">
                            <strong style="display:block; border-bottom:1px solid var(--border-color); margin-bottom:8px; padding-bottom:4px; color:var(--text-main);">Last 90 Days Log</strong>
                            ${relevantLogs.length === 0 ? '<em style="color:var(--text-muted)">No logs found.</em>' : relevantLogs.map(l => `
                                <div class="breakdown-row" style="padding:4px 0; border-bottom:1px solid rgba(0,0,0,0.05);">
                                    <span style="color:var(--text-muted); font-size:0.75rem;">${l.date}</span> 
                                    <span style="${l.noteType === 'vacation' ? 'color:var(--warning)' : (l.score == 100 ? 'color:var(--success)' : 'color:var(--danger)')}">
                                        ${l.noteType === 'vacation' ? '🌴 Vacation' : (l.score == 100 ? '✅ 100%' : '❌ 2.5%')}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </td>
                    <td class="admin-only">
                        <select onchange="manuallyUpdateRank('${worker.id}', this.value)" style="padding: 8px; width: auto; font-size: 0.85rem;">
                            <option value="">Change...</option>
                            <option value="A">Promote to A</option>
                            <option value="B">Set to B</option>
                            <option value="C">Set to C</option>
                            <option value="Unranked">Demote to Unranked</option>
                        </select>
                    </td>
                `;
        tbody.appendChild(tr);
    });
}


function addTaskTemplate() {
    const input = document.getElementById('task-template-input').value.trim();
    if (!input) return alert("Enter a task template name.");
    if (!getCompanyData().jobCatalog.includes(input)) {
        getCompanyData().jobCatalog.push(input);
        document.getElementById('task-template-input').value = '';

        // Targeted write to task templates list
        db.ref('companies/' + currentCompany + '/jobCatalog').set(getCompanyData().jobCatalog)
            .catch(err => console.error("Error adding task template:", err));
    }
}

function deleteTaskTemplate(templateName) {
    getCompanyData().jobCatalog = getCompanyData().jobCatalog.filter(t => t !== templateName);

    // Targeted write to task templates list
    db.ref('companies/' + currentCompany + '/jobCatalog').set(getCompanyData().jobCatalog)
        .catch(err => console.error("Error deleting task template:", err));
}

function assignTask() {
    const workerId = document.getElementById('task-worker-select').value;
    const text = document.getElementById('task-assign-input').value.trim();
    const urgency = document.getElementById('task-urgency') ? document.getElementById('task-urgency').value : 'normal';
    const deadlineMins = document.getElementById('task-deadline') ? parseInt(document.getElementById('task-deadline').value) || 0 : 0;

    if (!workerId || !text) { alert("Select an employee and describe a task."); return; }

    if (workerId.startsWith('group_')) {
        const groupId = workerId.replace('group_', '');
        const companyData = getCompanyData();
        const groups = companyData.taskGroups || [];
        const group = groups.find(g => g.id === groupId);
        if (!group) { alert("Selected group not found."); return; }

        const newGroupTask = {
            id: 'gt-' + Date.now().toString(),
            title: text,
            date: formatTimestamp(),
            timestamp: Date.now(),
            urgency: urgency,
            deadlineMins: deadlineMins,
            status: 'pending',
            targetGroupId: groupId,
            targetGroupName: group.name,
            acceptedBy: null,
            acceptedById: null,
            acceptedAt: null
        };

        db.ref(`companies/${currentCompany}/generalTasks/${newGroupTask.id}`).set(newGroupTask)
            .then(() => {
                logActivity('task', `group_${groupId}`, group.name, `Created group task for "${group.name}": "${text}"`);
                alert(currentAppLang === 'ar' ? `تم إسناد المهمة للمجموعة ${group.name} بنجاح!` : `Group task assigned to ${group.name} successfully!`);
                document.getElementById('task-assign-input').value = '';
                if (document.getElementById('task-deadline')) document.getElementById('task-deadline').value = '';
                if (document.getElementById('task-urgency')) document.getElementById('task-urgency').value = 'normal';
                document.getElementById('task-worker-select').value = '';
                renderAll();
            })
            .catch(err => console.error("Error creating group task:", err));
        return;
    }

    if (workerId === 'general') {
        const newGeneralTask = {
            id: 'gt-' + Date.now().toString(),
            title: text,
            date: formatTimestamp(),
            timestamp: Date.now(),
            urgency: urgency,
            deadlineMins: deadlineMins,
            status: 'pending',
            acceptedBy: null,
            acceptedById: null,
            acceptedAt: null
        };

        db.ref(`companies/${currentCompany}/generalTasks/${newGeneralTask.id}`).set(newGeneralTask)
            .then(() => {
                logActivity('task', 'general', 'General Pool', `Created general task: "${text}"`);
                alert("General task created successfully!");
                document.getElementById('task-assign-input').value = '';
                if (document.getElementById('task-deadline')) document.getElementById('task-deadline').value = '';
                if (document.getElementById('task-urgency')) document.getElementById('task-urgency').value = 'normal';
                document.getElementById('task-worker-select').value = '';
            })
            .catch(err => console.error("Error creating general task:", err));
        return;
    }

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    if (!worker.jobs) worker.jobs = [];
    worker.jobs.push({
        id: Date.now().toString(),
        title: text,
        date: formatTimestamp(),
        timestamp: Date.now(),
        urgency: urgency,
        deadlineMins: deadlineMins,
        status: 'assigned', // new states: assigned, seen, completed
        done: false // legacy flag
    });

    document.getElementById('task-assign-input').value = '';
    if (document.getElementById('task-deadline')) document.getElementById('task-deadline').value = '';
    if (document.getElementById('task-urgency')) document.getElementById('task-urgency').value = 'normal';

    // Targeted write to worker jobs path
    db.ref(`companies/${currentCompany}/workers/${workerIndex}/jobs`).set(worker.jobs)
        .then(() => {
            logActivity('task', worker.id, worker.name, `Assigned task to ${worker.name}: "${text}"`);
        })
        .catch(err => console.error("Error assigning task:", err));
}

function seeTask(workerId, taskId) {
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const t = worker.jobs.find(j => j.id === taskId);
    if (t) {
        t.status = 'seen';
        t.seenAt = Date.now();

        // Targeted write to worker jobs path
        db.ref(`companies/${currentCompany}/workers/${workerIndex}/jobs`).set(worker.jobs)
            .catch(err => console.error("Error seeing task:", err));
    }
}

function completeTask(workerId, taskId) {
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const t = worker.jobs.find(j => j.id === taskId);
    if (t) {
        t.status = 'completed';
        t.done = true;
        t.completedAt = Date.now();

        // Targeted write to worker jobs path
        db.ref(`companies/${currentCompany}/workers/${workerIndex}/jobs`).set(worker.jobs)
            .then(() => {
                logActivity('task', worker.id, worker.name, `${worker.name} completed task: "${t.title}"`);
            })
            .catch(err => console.error("Error completing task:", err));
    }
}

function toggleTaskDone(workerId, taskId) {
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const t = worker.jobs.find(j => j.id === taskId);
    if (t) {
        t.done = !t.done;
        if (!t.done) {
            t.status = 'seen'; // revert back to seen
        } else {
            t.status = 'completed';
            t.completedAt = Date.now();
        }

        // Targeted write to worker jobs path
        db.ref(`companies/${currentCompany}/workers/${workerIndex}/jobs`).set(worker.jobs)
            .then(() => {
                logActivity('task', worker.id, worker.name, `${worker.name} toggled task: "${t.title}" (Status: ${t.status})`);
            })
            .catch(err => console.error("Error toggling task done:", err));
    }
}

function deleteTask(workerId, taskId) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? "هل أنت تأكد من حذف هذه المهمة؟" : "Delete this task?")) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    if (!worker.jobs) worker.jobs = [];
    const oldTask = worker.jobs.find(j => j && j.id === taskId);
    worker.jobs = worker.jobs.filter(j => j && j.id !== taskId);

    // Re-render UI immediately to prevent freezing
    renderAll();

    // Targeted write to worker jobs path
    db.ref(`companies/${currentCompany}/workers/${workerIndex}/jobs`).set(worker.jobs)
        .then(() => {
            if (oldTask) {
                logActivity('task_delete', worker.id, worker.name, `Deleted task for ${worker.name}: "${oldTask.title}"`);
            }
            renderAll();
        })
        .catch(err => {
            console.error("Error deleting task:", err);
            renderAll();
        });
}

function toggleTasksCustomRange() {
    const tf = document.getElementById('tasks-filter-timeframe') ? document.getElementById('tasks-filter-timeframe').value : 'all';
    const div = document.getElementById('tasks-custom-range');
    if (div) {
        div.style.display = tf === 'custom' ? 'flex' : 'none';
    }
}
window.toggleTasksCustomRange = toggleTasksCustomRange;

function getJobTimestamp(j) {
    if (j.timestamp) return j.timestamp;
    if (j.createdAt) return j.createdAt;
    const parsedId = parseInt(j.id);
    if (!isNaN(parsedId) && parsedId > 1000000000000) return parsedId;
    if (j.date) {
        const parsedDate = Date.parse(j.date);
        if (!isNaN(parsedDate)) return parsedDate;
    }
    return 0;
}

function renderTasks() {
    const isAr = currentAppLang === 'ar';
    // Render Templates
    const tList = document.getElementById('task-template-list');
    const dList = document.getElementById('task-datalist');
    if (tList && dList) {
        tList.innerHTML = ''; dList.innerHTML = '';
        getCompanyData().jobCatalog.forEach(m => {
            const opt = document.createElement('option'); opt.value = m; dList.appendChild(opt);
            const div = document.createElement('div'); div.className = "flex-between list-item";
            div.innerHTML = `<span style="font-size:0.9rem;">${m}</span> <button class="btn-outline-danger" style="padding: 2px 6px; font-size: 0.75rem; border:none;" onclick="deleteTaskTemplate('${m}')">✖</button>`;
            tList.appendChild(div);
        });
    }

    // Populate Assign Dropdown
    const assignSel = document.getElementById('task-worker-select');
    if (assignSel) {
        const oldVal = assignSel.value;
        const companyData = getCompanyData();

        assignSel.innerHTML = `
            <option value="">-- ${t('opt-choose-emp')} --</option>
            <option value="general">🌍 ${t('opt-general-task')}</option>
        `;

        const groups = companyData.taskGroups || [];
        if (groups.length > 0) {
            const groupOptGroup = document.createElement('optgroup');
            groupOptGroup.label = isAr ? 'المجموعات' : 'Groups';
            groups.forEach(g => {
                const opt = document.createElement('option');
                opt.value = `group_${g.id}`;
                opt.textContent = `👥 ${g.name}`;
                groupOptGroup.appendChild(opt);
            });
            assignSel.appendChild(groupOptGroup);
        }

        const workerOptGroup = document.createElement('optgroup');
        workerOptGroup.label = isAr ? 'الموظفين' : 'Employees';
        companyData.workers.forEach(w => {
            const opt = document.createElement('option');
            opt.value = w.id;
            opt.textContent = w.name;
            workerOptGroup.appendChild(opt);
        });
        assignSel.appendChild(workerOptGroup);
        assignSel.value = oldVal;
    }

    // Populate Worker Filter Dropdown
    const workerFilterSel = document.getElementById('tasks-filter-worker');
    if (workerFilterSel) {
        const oldFilterVal = workerFilterSel.value;
        const visibleWorkers = getVisibleWorkers();
        workerFilterSel.innerHTML = `<option value="all">${isAr ? '👥 جميع الموظفين' : '👥 All Workers'}</option>`;
        visibleWorkers.forEach(w => {
            const opt = document.createElement('option');
            opt.value = w.id;
            opt.textContent = w.name;
            workerFilterSel.appendChild(opt);
        });
        if (oldFilterVal && Array.from(workerFilterSel.options).some(o => o.value === oldFilterVal)) {
            workerFilterSel.value = oldFilterVal;
        }
    }

    renderTaskGroups();

    // Render Board (Filtered for user)
    const board = document.getElementById('tasks-board-list');
    if (!board) return;
    board.innerHTML = '';

    const isAdmin = currentUser && currentUser.role === 'admin';
    const data = getCompanyData();

    // Gather Filter Values
    const statusFilter = document.getElementById('tasks-filter-status') ? document.getElementById('tasks-filter-status').value : 'all';
    const selectedWorkerId = document.getElementById('tasks-filter-worker') ? document.getElementById('tasks-filter-worker').value : 'all';
    const timeframeFilter = document.getElementById('tasks-filter-timeframe') ? document.getElementById('tasks-filter-timeframe').value : 'all';
    const fromInput = document.getElementById('tasks-from-date') ? document.getElementById('tasks-from-date').value : '';
    const toInput = document.getElementById('tasks-to-date') ? document.getElementById('tasks-to-date').value : '';

    const now = Date.now();
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const monthAgo = now - (30 * 24 * 60 * 60 * 1000);
    const fromMs = fromInput ? new Date(fromInput).setHours(0, 0, 0, 0) : 0;
    const toMs = toInput ? new Date(toInput).setHours(23, 59, 59, 999) : Infinity;

    // Helper: Date filter matching
    const passesDateFilter = (timestamp) => {
        if (timeframeFilter === 'today') return timestamp >= startOfToday;
        if (timeframeFilter === 'week') return timestamp >= weekAgo;
        if (timeframeFilter === 'month') return timestamp >= monthAgo;
        if (timeframeFilter === 'custom') return timestamp >= fromMs && timestamp <= toMs;
        return true;
    };

    // Calculate Statistics across all visible tasks matching date & worker filters
    let totalAssigned = 0;
    let completedCount = 0;
    let pendingCount = 0;

    let visibleWorkers = getVisibleWorkers();
    if (selectedWorkerId !== 'all') {
        visibleWorkers = visibleWorkers.filter(w => w.id === selectedWorkerId);
    }

    visibleWorkers.forEach(w => {
        (w.jobs || []).forEach(j => {
            const jTs = getJobTimestamp(j);
            if (passesDateFilter(jTs)) {
                totalAssigned++;
                const isDone = j.status === 'completed' || j.done;
                if (isDone) completedCount++;
                else pendingCount++;
            }
        });
    });

    // Update Statistics Banner UI
    const statsTitleEl = document.getElementById('task-stats-title');
    const totalEl = document.getElementById('task-stats-total');
    const completedEl = document.getElementById('task-stats-completed');
    const pendingEl = document.getElementById('task-stats-pending');
    const badgeEl = document.getElementById('task-stats-completion-badge');

    if (statsTitleEl && totalEl && completedEl && pendingEl && badgeEl) {
        if (selectedWorkerId !== 'all') {
            const targetW = data.workers ? data.workers.find(w => w.id === selectedWorkerId) : null;
            const nameStr = targetW ? targetW.name : '';
            statsTitleEl.textContent = isAr ? `إحصائيات المهام للموظف: ${nameStr}` : `Task Statistics for ${nameStr}`;
        } else {
            statsTitleEl.textContent = isAr ? 'إحصائيات مهام الفريق' : 'Team Task Statistics';
        }

        totalEl.textContent = totalAssigned;
        completedEl.textContent = completedCount;
        pendingEl.textContent = pendingCount;
        const pct = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;
        badgeEl.textContent = `${isAr ? 'نسبة الإنجاز: ' : 'Completion Rate: '}${pct}%`;
    }

    // Render General Tasks at top of board (if not filtering for a specific worker)
    if (selectedWorkerId === 'all') {
        const generalTasks = data.generalTasks || [];
        const activeWorker = getActiveWorker();
        let pendingGeneralTasks = generalTasks.filter(gt => {
            if (gt.status !== 'pending') return false;
            if (!passesDateFilter(getJobTimestamp(gt))) return false;
            if (isAdmin) return true; // Admin sees all
            if (!gt.targetGroupId) return true; // Available to everyone

            const groups = data.taskGroups || [];
            const group = groups.find(g => g.id === gt.targetGroupId);
            if (group && group.members && activeWorker) {
                return group.members.includes(activeWorker.id);
            }
            return false;
        });

        // Sort General tasks newest first
        pendingGeneralTasks.sort((a, b) => getJobTimestamp(b) - getJobTimestamp(a));

        if (pendingGeneralTasks.length > 0 && statusFilter !== 'completed') {
            const genCard = document.createElement('div');
            genCard.className = "card";
            genCard.style.padding = "20px";
            genCard.style.marginBottom = "16px";
            genCard.style.border = "2px dashed var(--warning)";
            genCard.style.background = "var(--warning-bg)";

            let genHtml = `<h3 style="margin-top:0; color:var(--warning); display:flex; align-items:center; gap:8px; font-size:1.15rem;">🌍 ${t('title-available-general-tasks')}</h3>`;

            pendingGeneralTasks.forEach(gt => {
                const urgencyBadge = gt.urgency === 'urgent' ? `<span class="badge" style="background:var(--danger); margin-left:8px;">🔴 ${t('opt-urgency-high').replace('🔴 ', '')}</span>` : '';
                const groupBadge = gt.targetGroupName ? `<span class="badge" style="background:var(--primary); margin-left:8px; color:white;">👥 ${gt.targetGroupName}</span>` : '';
                const deadlineText = gt.deadlineMins > 0 ? `<div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">⏱️ ${t('status-time-remaining').replace('⏳ ', '')} ${gt.deadlineMins} mins</div>` : '';

                const isWorker = currentUser && currentUser.role === 'worker';
                let actionBtn = '';
                if (isWorker) {
                    actionBtn = `<button onclick="acceptGeneralTask('${gt.id}')" class="btn-warning" style="padding:8px 16px; font-size:0.85rem; min-height: unset; height: auto;">📥 ${t('btn-accept-task')}</button>`;
                } else if (isAdmin) {
                    const labelText = gt.targetGroupName ? `${t('label-available-all-workers')} (${gt.targetGroupName})` : t('label-available-all-workers');
                    actionBtn = `
                        <div style="display:flex; gap:8px; align-items:center;">
                            <span style="font-size:0.8rem; color:var(--text-muted); font-style:italic;">${labelText}</span>
                            <button onclick="openEditTaskModal('general', '${gt.id}', true)" style="background:none; border:none; color: var(--secondary); cursor:pointer; font-size:1.1rem; padding:0 4px;" title="${isAr ? 'تعديل المهمة' : 'Edit Task'}">✏️</button>
                            <button onclick="deleteGeneralTask('${gt.id}')" style="background:none; border:none; color: var(--danger); cursor:pointer; font-size:1.2rem; padding:0 4px;" title="${t('btn-remove')}">✖</button>
                        </div>`;
                }

                genHtml += `
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:16px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                        <div>
                            <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">Created: ${gt.date || new Date(getJobTimestamp(gt)).toLocaleString()}</div>
                            <div style="font-size:1.05rem; font-weight:700; color:var(--text-main);">${gt.title} ${urgencyBadge} ${groupBadge}</div>
                            ${deadlineText}
                        </div>
                        <div>
                            ${actionBtn}
                        </div>
                    </div>
                `;
            });

            genCard.innerHTML = genHtml;
            board.appendChild(genCard);
        }
    }

    if (visibleWorkers.length === 0 && !isAdmin) {
        if (board.innerHTML === '') {
            board.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:20px;">${t('not-linked-worker')}</p>`;
        }
        return;
    }

    visibleWorkers.forEach(worker => {
        let jobs = worker.jobs ? [...worker.jobs] : [];
        if (jobs.length === 0) return;

        // Apply Status Filter
        if (statusFilter === 'completed') {
            jobs = jobs.filter(j => j.status === 'completed' || j.done);
        } else if (statusFilter === 'incomplete') {
            jobs = jobs.filter(j => j.status !== 'completed' && !j.done);
        }

        // Apply Date Filter
        jobs = jobs.filter(j => passesDateFilter(getJobTimestamp(j)));

        if (jobs.length === 0) return;

        // Sort Newest Tasks to the Top
        jobs.sort((a, b) => getJobTimestamp(b) - getJobTimestamp(a));

        let jobsHtml = jobs.map(j => {
            const editBtn = isAdmin ? `<button onclick="openEditTaskModal('${worker.id}', '${j.id}')" style="background:none; border:none; color: var(--secondary); cursor:pointer; font-size:1rem; padding:0 4px;" title="${isAr ? 'تعديل المهمة' : 'Edit Task'}">✏️</button>` : '';
            const delBtn = isAdmin ? `<button onclick="deleteTask('${worker.id}', '${j.id}')" style="background:none; border:none; color: var(--danger); cursor:pointer; font-size:1.1rem; padding:0 4px;" title="Delete">✖</button>` : '';

            const status = j.status || (j.done ? 'completed' : 'assigned');
            const isAssignedToMe = (currentUser && worker.email && worker.email.toLowerCase() === currentUser.email.toLowerCase());

            let statusBadge = '';
            let actionHtml = '';
            let urgencyBadge = j.urgency === 'urgent' ? `<span class="badge" style="background:var(--danger); margin-left:8px;">🔴 ${t('opt-urgency-high').replace('🔴 ', '')}</span>` : '';
            let timeInfoHtml = '';

            if (status === 'completed' || j.done) {
                statusBadge = `<span class="badge badge-good">${t('btn-mark-completed').replace('✅ ', '')} ✅</span>`;
                actionHtml = isAdmin ? `<button onclick="toggleTaskDone('${worker.id}', '${j.id}')" class="btn-outline" style="font-size:0.75rem; padding:4px 8px;">${t('btn-undo-action')}</button>` : '';
                if (j.completedAt) {
                    timeInfoHtml = `<div style="font-size:0.75rem; color:var(--success); margin-top:4px;">${t('label-finished')} ${new Date(j.completedAt).toLocaleTimeString()}</div>`;
                }
            } else if (status === 'seen') {
                statusBadge = `<span class="badge" style="background:var(--warning); color:#000;">👀 ${t('status-pending-sm').replace('⏳ ', '')}</span>`;
                if (isAssignedToMe) {
                    actionHtml = `<button onclick="completeTask('${worker.id}', '${j.id}')" class="btn-success" style="font-size:0.8rem; padding:6px 12px; width:100%;">${t('btn-mark-completed')}</button>`;
                }

                if (j.deadlineMins > 0 && j.seenAt) {
                    const deadlineMs = j.seenAt + (j.deadlineMins * 60000);
                    timeInfoHtml = `<div class="task-timer-display" data-deadline="${deadlineMs}" style="font-size:0.85rem; font-weight:600; margin-top:4px;"></div>`;
                } else if (j.seenAt) {
                    timeInfoHtml = `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">${t('label-started')} ${new Date(j.seenAt).toLocaleTimeString()}</div>`;
                }
            } else {
                statusBadge = `<span class="badge" style="background:var(--text-muted);">🆕</span>`;
                if (isAssignedToMe) {
                    actionHtml = `<button onclick="seeTask('${worker.id}', '${j.id}')" class="btn-warning" style="font-size:0.8rem; padding:6px 12px; width:100%;">${t('btn-i-saw-this')}</button>`;
                } else if (isAdmin) {
                    actionHtml = `<span style="font-size:0.8rem; color:var(--text-muted); font-style:italic;">Worker has not seen this yet.</span>`;
                }
                if (j.deadlineMins > 0) {
                    timeInfoHtml = `<div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">${t('task-must-complete').replace('mins', j.deadlineMins)}</div>`;
                }
            }

            const doneColor = (status === 'completed' || j.done) ? 'var(--success)' : (j.urgency === 'urgent' ? 'var(--danger)' : 'var(--primary)');
            const doneText = (status === 'completed' || j.done) ? 'line-through' : 'none';
            let isGeneralBadge = j.isGeneral ? `<span class="badge" style="background:var(--info); color:var(--text-light); margin-right:8px; font-size:0.75rem; vertical-align:middle;">🌍 General Task</span>` : '';

            return `
                        <div class="mission-item" style="border-left: 4px solid ${doneColor}; display:flex; flex-direction:column; align-items:stretch;">
                            <div class="flex-between" style="margin-bottom:8px; align-items:flex-start;">
                                <div>
                                    <div style="font-size: 0.75rem; color:var(--text-muted); margin-bottom:4px;">Assigned: ${j.date || new Date(getJobTimestamp(j)).toLocaleString()}</div>
                                    <div style="display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
                                        ${isGeneralBadge}
                                        <span class="mission-text" style="text-decoration: ${doneText}; margin-right:4px;">${j.title}</span>
                                        ${urgencyBadge}
                                    </div>
                                    ${timeInfoHtml}
                                </div>
                                <div style="text-align:right;">
                                    ${statusBadge}
                                </div>
                            </div>
                            <div class="flex-between" style="border-top:1px dashed var(--border-color); padding-top:10px; margin-top:4px; gap: 10px;">
                                <div style="flex-grow:1;">${actionHtml}</div>
                                <div style="display:flex; align-items:center; gap:4px;">${editBtn}${delBtn}</div>
                            </div>
                        </div>
                    `;
        }).join('');

        const div = document.createElement('div');
        div.className = "card";
        div.style.padding = "16px"; div.style.marginBottom = "10px";
        div.innerHTML = `
                    <div style="margin-bottom:12px; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
                        <strong style="color:var(--text-main); font-size:1.1rem;">${worker.name}</strong> <span style="font-size:0.8rem; color:var(--text-muted); margin-left:8px;">${worker.role}</span>
                    </div>
                    ${jobsHtml}
                `;
        board.appendChild(div);
    });

    if (board.innerHTML === '') {
        board.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding: 20px;">${isAr ? 'لا توجد مهام تطابق التصفية المختارة.' : 'No tasks match the selected filters.'}</p>`;
    }
}

function acceptGeneralTask(taskId) {
    if (!currentUser || currentUser.role !== 'worker') return;

    // Check if task is already taken/accepted by fetching it fresh from database
    db.ref(`companies/${currentCompany}/generalTasks/${taskId}`).once('value')
        .then(snapshot => {
            const task = snapshot.val();
            if (!task) return alert("Task not found.");
            if (task.status !== 'pending') {
                alert(`This task was already accepted by ${task.acceptedBy || 'another worker'}.`);
                return;
            }

            // Find current worker
            const workers = getCompanyData().workers || [];
            const myIndex = workers.findIndex(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
            if (myIndex === -1) {
                alert("Worker profile not found.");
                return;
            }

            const myWorker = workers[myIndex];
            if (!myWorker.jobs) myWorker.jobs = [];

            // Construct new job
            const newJob = {
                id: task.id,
                title: `${task.title} (Accepted by ${myWorker.name})`,
                isGeneral: true,
                date: formatTimestamp(),
                timestamp: Date.now(),
                urgency: task.urgency,
                deadlineMins: task.deadlineMins,
                status: 'seen',
                seenAt: Date.now(),
                done: false
            };

            myWorker.jobs.push(newJob);

            const updates = {};
            updates[`companies/${currentCompany}/workers/${myIndex}/jobs`] = myWorker.jobs;
            updates[`companies/${currentCompany}/generalTasks/${taskId}`] = {
                ...task,
                status: 'accepted',
                acceptedBy: myWorker.name,
                acceptedById: myWorker.id,
                acceptedAt: Date.now()
            };

            return db.ref().update(updates)
                .then(() => {
                    logActivity('task', myWorker.id, myWorker.name, `${myWorker.name} accepted general task: "${task.title}"`);
                    alert(`Success! You have accepted: "${task.title}"`);
                });
        })
        .catch(err => {
            console.error("Error accepting task:", err);
            alert("Failed to accept task. It may have been taken already.");
        });
}

function deleteGeneralTask(taskId) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? "هل أنت تأكد من حذف هذه المهمة العامة؟" : "Delete this general task?")) return;
    const companyData = getCompanyData();
    if (!companyData.generalTasks) companyData.generalTasks = [];
    const task = companyData.generalTasks.find(gt => gt && gt.id === taskId);
    companyData.generalTasks = companyData.generalTasks.filter(gt => gt && gt.id !== taskId);

    // Re-render UI immediately
    renderAll();

    db.ref(`companies/${currentCompany}/generalTasks/${taskId}`).remove()
        .then(() => {
            if (task) {
                logActivity('task_delete', 'general', 'General Pool', `Deleted general task: "${task.title}"`);
            }
            renderAll();
        })
        .catch(err => {
            console.error("Error deleting general task:", err);
            renderAll();
        });
}

function openEditTaskModal(workerId, taskId, isGeneral = false) {
    const modal = document.getElementById('edit-task-modal');
    if (!modal) return;

    const companyData = getCompanyData();
    const isAr = currentAppLang === 'ar';

    // Populate worker dropdown
    const select = document.getElementById('edit-task-worker-select');
    if (select) {
        select.innerHTML = `
            <option value="general">🌍 ${isAr ? 'مهمة عامة' : 'General Task'}</option>
        `;

        const groups = companyData.taskGroups || [];
        if (groups.length > 0) {
            const groupOptGroup = document.createElement('optgroup');
            groupOptGroup.label = isAr ? 'المجموعات' : 'Groups';
            groups.forEach(g => {
                const opt = document.createElement('option');
                opt.value = `group_${g.id}`;
                opt.textContent = `👥 ${g.name}`;
                groupOptGroup.appendChild(opt);
            });
            select.appendChild(groupOptGroup);
        }

        const workerOptGroup = document.createElement('optgroup');
        workerOptGroup.label = isAr ? 'الموظفين' : 'Employees';
        (companyData.workers || []).forEach(w => {
            const opt = document.createElement('option');
            opt.value = w.id;
            opt.textContent = w.name;
            workerOptGroup.appendChild(opt);
        });
        select.appendChild(workerOptGroup);
    }

    let taskObj = null;
    let currentAssignee = workerId;

    if (isGeneral || workerId === 'general' || workerId.startsWith('group_')) {
        const genTasks = companyData.generalTasks || [];
        taskObj = genTasks.find(gt => gt.id === taskId);
        if (taskObj && taskObj.targetGroupId) {
            currentAssignee = `group_${taskObj.targetGroupId}`;
        } else {
            currentAssignee = 'general';
        }
    } else {
        const workerIndex = (companyData.workers || []).findIndex(w => w.id === workerId);
        if (workerIndex !== -1) {
            const worker = companyData.workers[workerIndex];
            taskObj = (worker.jobs || []).find(j => j.id === taskId);
            currentAssignee = workerId;
        }
    }

    if (!taskObj) {
        alert(isAr ? 'لم يتم العثور على المهمة.' : 'Task not found.');
        return;
    }

    document.getElementById('edit-task-id-hidden').value = taskId;
    document.getElementById('edit-task-original-worker-hidden').value = workerId;
    document.getElementById('edit-task-worker-select').value = currentAssignee;
    document.getElementById('edit-task-title-input').value = taskObj.title || '';
    document.getElementById('edit-task-urgency-select').value = taskObj.urgency || 'normal';
    document.getElementById('edit-task-deadline-input').value = taskObj.deadlineMins || '';

    modal.style.display = 'flex';
}

function closeEditTaskModal() {
    const modal = document.getElementById('edit-task-modal');
    if (modal) modal.style.display = 'none';
}

function saveEditedTask() {
    const isAr = currentAppLang === 'ar';
    const taskId = document.getElementById('edit-task-id-hidden').value;
    const origWorkerId = document.getElementById('edit-task-original-worker-hidden').value;
    const newAssignee = document.getElementById('edit-task-worker-select').value;
    const newTitle = document.getElementById('edit-task-title-input').value.trim();
    const newUrgency = document.getElementById('edit-task-urgency-select').value;
    const newDeadline = parseInt(document.getElementById('edit-task-deadline-input').value) || 0;

    if (!newTitle) {
        alert(isAr ? 'الرجاء إدخال تفاصيل المهمة.' : 'Please enter task details.');
        return;
    }

    const companyData = getCompanyData();
    const isOrigGeneral = origWorkerId === 'general' || origWorkerId.startsWith('gt-') || origWorkerId.startsWith('group_');

    if (isOrigGeneral) {
        // Task was in generalTasks
        const genTasks = companyData.generalTasks || [];
        const taskIndex = genTasks.findIndex(gt => gt.id === taskId);
        if (taskIndex === -1) {
            alert(isAr ? 'تعذر العثور على المهمة.' : 'Could not find task.');
            return;
        }
        const task = genTasks[taskIndex];

        if (newAssignee === 'general' || newAssignee.startsWith('group_')) {
            // Still in general/group pool
            const targetGroupId = newAssignee.startsWith('group_') ? newAssignee.replace('group_', '') : null;
            let targetGroupName = null;
            if (targetGroupId) {
                const grp = (companyData.taskGroups || []).find(g => g.id === targetGroupId);
                if (grp) targetGroupName = grp.name;
            }

            db.ref(`companies/${currentCompany}/generalTasks/${taskId}`).update({
                title: newTitle,
                urgency: newUrgency,
                deadlineMins: newDeadline,
                targetGroupId: targetGroupId,
                targetGroupName: targetGroupName
            }).then(() => {
                logActivity('task', 'general', 'General Pool', `Updated task: "${newTitle}"`);
                closeEditTaskModal();
                renderAll();
            }).catch(err => console.error("Error updating general task:", err));
        } else {
            // Reassigned from general pool to a specific worker
            const newWorkerIndex = (companyData.workers || []).findIndex(w => w.id === newAssignee);
            if (newWorkerIndex === -1) return;
            const newWorker = companyData.workers[newWorkerIndex];
            if (!newWorker.jobs) newWorker.jobs = [];

            const movedJob = {
                id: Date.now().toString(),
                title: newTitle,
                date: task.date || formatTimestamp(),
                timestamp: task.timestamp || Date.now(),
                urgency: newUrgency,
                deadlineMins: newDeadline,
                status: 'assigned',
                done: false
            };

            newWorker.jobs.push(movedJob);

            const updates = {};
            updates[`companies/${currentCompany}/workers/${newWorkerIndex}/jobs`] = newWorker.jobs;
            updates[`companies/${currentCompany}/generalTasks/${taskId}`] = null;

            db.ref().update(updates).then(() => {
                logActivity('task', newWorker.id, newWorker.name, `Assigned task to ${newWorker.name}: "${newTitle}"`);
                closeEditTaskModal();
                renderAll();
            }).catch(err => console.error("Error reassigning general task to worker:", err));
        }
    } else {
        // Task was assigned to a specific worker
        const origWorkerIndex = (companyData.workers || []).findIndex(w => w.id === origWorkerId);
        if (origWorkerIndex === -1) return;
        const origWorker = companyData.workers[origWorkerIndex];
        const jobIndex = (origWorker.jobs || []).findIndex(j => j.id === taskId);
        if (jobIndex === -1) return;

        const job = origWorker.jobs[jobIndex];

        if (newAssignee === origWorkerId) {
            // Same worker: update fields
            job.title = newTitle;
            job.urgency = newUrgency;
            job.deadlineMins = newDeadline;

            db.ref(`companies/${currentCompany}/workers/${origWorkerIndex}/jobs/${jobIndex}`).update({
                title: newTitle,
                urgency: newUrgency,
                deadlineMins: newDeadline
            }).then(() => {
                logActivity('task', origWorker.id, origWorker.name, `Updated task for ${origWorker.name}: "${newTitle}"`);
                closeEditTaskModal();
                renderAll();
            }).catch(err => console.error("Error updating worker task:", err));
        } else if (newAssignee === 'general' || newAssignee.startsWith('group_')) {
            // Moved from worker to general/group task
            origWorker.jobs.splice(jobIndex, 1);

            const targetGroupId = newAssignee.startsWith('group_') ? newAssignee.replace('group_', '') : null;
            let targetGroupName = null;
            if (targetGroupId) {
                const grp = (companyData.taskGroups || []).find(g => g.id === targetGroupId);
                if (grp) targetGroupName = grp.name;
            }

            const newGenTask = {
                id: 'gt-' + Date.now().toString(),
                title: newTitle,
                date: job.date || formatTimestamp(),
                timestamp: job.timestamp || Date.now(),
                urgency: newUrgency,
                deadlineMins: newDeadline,
                status: 'pending',
                targetGroupId: targetGroupId,
                targetGroupName: targetGroupName,
                acceptedBy: null,
                acceptedById: null,
                acceptedAt: null
            };

            const updates = {};
            updates[`companies/${currentCompany}/workers/${origWorkerIndex}/jobs`] = origWorker.jobs;
            updates[`companies/${currentCompany}/generalTasks/${newGenTask.id}`] = newGenTask;

            db.ref().update(updates).then(() => {
                logActivity('task', 'general', 'General Pool', `Moved task from ${origWorker.name} to general pool: "${newTitle}"`);
                closeEditTaskModal();
                renderAll();
            }).catch(err => console.error("Error moving task to general pool:", err));
        } else {
            // Reassigned to another worker
            const newWorkerIndex = (companyData.workers || []).findIndex(w => w.id === newAssignee);
            if (newWorkerIndex === -1) return;
            const newWorker = companyData.workers[newWorkerIndex];
            if (!newWorker.jobs) newWorker.jobs = [];

            origWorker.jobs.splice(jobIndex, 1);

            const reassignedJob = {
                ...job,
                title: newTitle,
                urgency: newUrgency,
                deadlineMins: newDeadline
            };

            newWorker.jobs.push(reassignedJob);

            const updates = {};
            updates[`companies/${currentCompany}/workers/${origWorkerIndex}/jobs`] = origWorker.jobs;
            updates[`companies/${currentCompany}/workers/${newWorkerIndex}/jobs`] = newWorker.jobs;

            db.ref().update(updates).then(() => {
                logActivity('task', newWorker.id, newWorker.name, `Reassigned task from ${origWorker.name} to ${newWorker.name}: "${newTitle}"`);
                closeEditTaskModal();
                renderAll();
            }).catch(err => console.error("Error reassigning task to another worker:", err));
        }
    }
}

// --- DRIVERS SYSTEM ---
function selectDriver(driverId) {
    activeDriverId = driverId;
    renderDriverPanel();
    renderDriversList();
}

function toggleDriverPrepTime() {
    const status = document.getElementById('driver-order-status').value;
    document.getElementById('driver-prep-time-group').style.display = (status === 'preparing') ? 'block' : 'none';
}

function startDriverOrder() {
    if (!activeDriverId) return;
    const mins = parseInt(document.getElementById('driver-order-time').value);
    const details = document.getElementById('driver-order-details').value.trim();
    const status = document.getElementById('driver-order-status').value;
    let prepMins = 0;

    if (isNaN(mins) || mins <= 0) { alert("Enter valid delivery time in minutes."); return; }
    if (!details) { alert("Please enter the order details/items."); return; }
    if (status === 'preparing') {
        prepMins = parseInt(document.getElementById('driver-prep-time').value);
        if (isNaN(prepMins) || prepMins <= 0) { alert("Enter valid prep time in minutes."); return; }
    }

    const orderData = {
        startTime: Date.now(),
        allocatedMs: mins * 60 * 1000,
        details: details,
        status: status,
        prepStartTime: Date.now(),
        prepTimeMs: prepMins * 60 * 1000,
        isGeneralPool: activeDriverId === 'general'
    };

    if (activeDriverId === 'general') {
        const poolRef = db.ref(`companies/${currentCompany}/generalDeliveries`).push();
        orderData.id = poolRef.key;

        const companyData = getCompanyData();
        const existingCount = companyData.generalDeliveries ? Object.keys(companyData.generalDeliveries).length : 0;
        orderData.orderNum = existingCount + 1;

        poolRef.set(orderData)
            .then(() => {
                document.getElementById('driver-order-time').value = '';
                document.getElementById('driver-order-details').value = '';
                if (document.getElementById('driver-prep-time')) document.getElementById('driver-prep-time').value = '';
                document.getElementById('driver-order-status').value = 'ready';
                toggleDriverPrepTime();

                logActivity('delivery', 'general', 'General Pool', `Added order #${orderData.orderNum} to the general deliveries pool.`);
            })
            .catch(err => console.error("Error creating general pool order:", err));
        return;
    }

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === activeDriverId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    orderData.id = `direct_${Date.now()}`;
    worker.activeOrder = orderData;

    document.getElementById('driver-order-time').value = '';
    document.getElementById('driver-order-details').value = '';
    if (document.getElementById('driver-prep-time')) document.getElementById('driver-prep-time').value = '';
    document.getElementById('driver-order-status').value = 'ready';
    toggleDriverPrepTime();

    // Targeted write to activeOrder
    db.ref(`companies/${currentCompany}/workers/${workerIndex}/activeOrder`).set(worker.activeOrder)
        .catch(err => console.error("Error starting driver order:", err));
}

function pickupDriverOrder(workerId) {
    if (!workerId) workerId = activeDriverId;
    if (!workerId) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    if (worker && worker.activeOrder) {
        if (worker.activeOrder.status === 'preparing') {
            worker.activeOrder.prepEndTime = Date.now();
        }
        worker.activeOrder.status = 'picked_up';
        worker.activeOrder.startTime = Date.now(); // Restart timer exactly when picked up

        // Targeted write to activeOrder
        db.ref(`companies/${currentCompany}/workers/${workerIndex}/activeOrder`).set(worker.activeOrder)
            .catch(err => console.error("Error picking up order:", err));
    }
}

function forceOrderReady(workerId) {
    if (!confirm("Force this order to Ready status immediately?")) return;
    if (!workerId) workerId = activeDriverId;
    if (!workerId) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    if (worker && worker.activeOrder && worker.activeOrder.status === 'preparing') {
        worker.activeOrder.status = 'ready';
        worker.activeOrder.prepEndTime = Date.now(); // Log exactly when kitchen finished

        // Targeted write to activeOrder
        db.ref(`companies/${currentCompany}/workers/${workerIndex}/activeOrder`).set(worker.activeOrder)
            .catch(err => console.error("Error forcing order ready:", err));
    }
}

function finishDriverOrder(isSuccess, workerId) {
    if (!workerId) workerId = activeDriverId;
    if (!workerId) return;

    // Ask for confirmation before cancelling an order
    const isAr = currentAppLang === 'ar';
    const confirmMsg = isAr
        ? "هل أنت متأكد من إلغاء/إرجاع هذا الطلب؟"
        : "Are you sure you want to cancel/return this order?";
    if (!isSuccess && !confirm(confirmMsg)) {
        return;
    }

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];

    if (isSuccess && worker.activeOrder) {
        const stats = getMonthlyStats(worker, currentGlobalMonth);

        // Fallback if driver picks up directly without manager marking it ready
        let prepEnd = worker.activeOrder.prepEndTime;
        if (!prepEnd && worker.activeOrder.prepTimeMs > 0) {
            prepEnd = worker.activeOrder.startTime;
        }

        stats.deliveriesList.unshift({
            id: Date.now().toString(),
            date: formatTimestamp(),
            startTime: worker.activeOrder.startTime,
            endTime: Date.now(),
            allocatedMs: worker.activeOrder.allocatedMs,
            prepStartTime: worker.activeOrder.prepStartTime || null,
            prepTimeMs: worker.activeOrder.prepTimeMs || 0,
            prepEndTime: prepEnd || null,
            orderNum: worker.activeOrder.orderNum || null
        });

        // Write the deliveriesList
        db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/deliveriesList`).set(stats.deliveriesList)
            .catch(err => console.error("Error logging delivery record:", err));

        // Log activity
        if (typeof logActivity === 'function') {
            logActivity('delivery', worker.id, worker.name, `${worker.name} delivered: "${worker.activeOrder.details || 'No details'}"`);
        }
    } else if (!isSuccess && worker.activeOrder && worker.activeOrder.isGeneralPool) {
        // Return it to the general pool!
        const returnedOrder = {
            ...worker.activeOrder,
            assignedToWorkerId: null,
            assignedToWorkerName: null
        };
        const orderId = returnedOrder.id || `gen_${Date.now()}`;
        db.ref(`companies/${currentCompany}/generalDeliveries/${orderId}`).set(returnedOrder)
            .then(() => {
                logActivity('delivery', worker.id, worker.name, `${worker.name} returned order #${returnedOrder.orderNum || ''} to the general pool`);
            })
            .catch(err => console.error("Error returning order to general pool:", err));
    }

    worker.activeOrder = null;

    // Clear active order
    db.ref(`companies/${currentCompany}/workers/${workerIndex}/activeOrder`).set(null)
        .catch(err => console.error("Error clearing active order:", err));
}

function deleteDeliveryRecord(workerId, deliveryId) {
    if (!confirm(t('confirm-delete-delivery') || "Delete delivery record?")) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);
    stats.deliveriesList = stats.deliveriesList.filter(d => d.id !== deliveryId);

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/deliveriesList`).set(stats.deliveriesList)
        .catch(err => console.error("Error deleting delivery record:", err));
}

function deleteLegacyDelivery(workerId) {
    if (!confirm(t('confirm-remove-legacy') || "Remove legacy record?")) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);
    if (stats.legacyDeliveries > 0) {
        stats.legacyDeliveries--;

        db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/legacyDeliveries`).set(stats.legacyDeliveries)
            .catch(err => console.error("Error deleting legacy delivery:", err));
    }
}

function updateActiveDriverTimer() {
    const now = Date.now();

    function calcTime(order) {
        let displayTime = '--:--';
        let isLate = false;
        let statusText = '';
        let boxColor = 'var(--text-main)';

        if (order.status === 'preparing') {
            const diff = (order.prepStartTime + order.prepTimeMs) - now;
            isLate = diff <= 0;
            const absDiff = Math.abs(diff);
            const h = Math.floor(absDiff / 3600000).toString().padStart(2, '0');
            const m = Math.floor((absDiff % 3600000) / 60000).toString().padStart(2, '0');
            const s = Math.floor((absDiff % 60000) / 1000).toString().padStart(2, '0');
            displayTime = isLate ? `-${h !== '00' ? h + ':' : ''}${m}:${s}` : `${h !== '00' ? h + ':' : ''}${m}:${s}`;
            statusText = isLate ? '🚨 ' + t('status-late-prep') : '🟡 ' + t('status-preparing');
            boxColor = isLate ? 'var(--danger)' : 'var(--warning)';
        } else if (order.status === 'not_ready') {
            statusText = '🔴 ' + t('status-kitchen-not-ready');
        } else if (order.status === 'ready') {
            statusText = '🟢 ' + t('status-ready-pickup');
            boxColor = 'var(--success)';
        } else if (order.status === 'picked_up') {
            const diff = (order.startTime + order.allocatedMs) - now;
            isLate = diff <= 0;
            const absDiff = Math.abs(diff);
            const h = Math.floor(absDiff / 3600000).toString().padStart(2, '0');
            const m = Math.floor((absDiff % 3600000) / 60000).toString().padStart(2, '0');
            const s = Math.floor((absDiff % 60000) / 1000).toString().padStart(2, '0');
            displayTime = isLate ? `-${h !== '00' ? h + ':' : ''}${m}:${s}` : `${h !== '00' ? h + ':' : ''}${m}:${s}`;
            statusText = isLate ? '🚨 ' + t('status-late-delivering') : '🛵 ' + t('status-delivering');
            boxColor = isLate ? 'var(--danger)' : 'var(--info)';
        }
        return { displayTime, statusText, boxColor, isLate };
    }

    // 1. Update Manager Panel
    if (activeDriverId) {
        if (activeDriverId === 'general') {
            const timers = document.querySelectorAll('.general-pool-timer');
            timers.forEach(el => {
                const startTime = parseInt(el.getAttribute('data-start'));
                const timeMs = parseInt(el.getAttribute('data-time'));
                const diff = (startTime + timeMs) - now;
                const isLate = diff <= 0;
                const absDiff = Math.abs(diff);
                const h = Math.floor(absDiff / 3600000).toString().padStart(2, '0');
                const m = Math.floor((absDiff % 3600000) / 60000).toString().padStart(2, '0');
                const s = Math.floor((absDiff % 60000) / 1000).toString().padStart(2, '0');
                el.textContent = isLate ? `-${h !== '00' ? h + ':' : ''}${m}:${s}` : `${h !== '00' ? h + ':' : ''}${m}:${s}`;
                el.style.color = isLate ? 'var(--danger)' : 'var(--warning)';
            });
        } else {
            const worker = getCompanyData().workers.find(w => w.id === activeDriverId);
            if (worker && worker.activeOrder) {
                const res = calcTime(worker.activeOrder);
                document.getElementById('driver-timer-display').textContent = res.displayTime;
                document.getElementById('driver-timer-status').textContent = res.statusText;
                document.getElementById('driver-timer-status').style.color = res.boxColor;
                document.getElementById('driver-timer-box').style.borderColor = res.boxColor;
                document.getElementById('driver-timer-display').style.color = res.boxColor;
            }
        }
    }

    // 2. Update Persistent Driver Banner
    const driverBanner = document.getElementById('driver-order-timer-banner');
    if (currentUser && currentUser.role === 'worker') {
        const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
        if (myWorker && myWorker.activeOrder) {
            const order = myWorker.activeOrder;
            const res = calcTime(order);

            document.getElementById('driver-order-banner-details').textContent = order.details;
            document.getElementById('driver-order-banner-status').textContent = res.statusText;
            document.getElementById('driver-order-banner-status').style.color = res.boxColor;

            const bannerTime = document.getElementById('driver-order-banner-time');
            bannerTime.textContent = res.displayTime;
            bannerTime.style.color = res.boxColor;
            driverBanner.style.borderLeftColor = res.boxColor;

            // Inject Action Buttons into the Banner based on state
            const actionDiv = document.getElementById('driver-banner-actions');
            if (order.status !== 'picked_up') {
                actionDiv.innerHTML = `<button onclick="pickupDriverOrder('${myWorker.id}')" class="btn-warning" style="padding:10px 16px; font-size:0.9rem; border-radius:8px;">${t('btn-receive-order')}</button>`;
            } else {
                actionDiv.innerHTML = `<button onclick="finishDriverOrder(true, '${myWorker.id}')" class="btn-success" style="padding:10px 16px; font-size:0.9rem; border-radius:8px;">${t('btn-delivered')}</button>`;
            }
            driverBanner.style.display = 'block';
        } else {
            if (driverBanner) driverBanner.style.display = 'none';
        }
    } else {
        if (driverBanner) driverBanner.style.display = 'none';
    }
}

function renderDriversList() {
    const list = document.getElementById('driver-list-sidebar'); list.innerHTML = '';

    let workers;
    const isDriversAdmin = currentUser && (currentUser.role === 'admin' || document.body.classList.contains('perm-drivers'));
    if (isDriversAdmin) {
        workers = getCompanyData().workers || [];
    } else {
        workers = getVisibleWorkers();
    }

    const drivers = workers.filter(w => {
        const r = (w.role || "").toLowerCase();
        return r.includes('driver') || r.includes('سائق') || r.includes('delivery');
    });

    if (!isDriversAdmin && drivers.length > 0 && !activeDriverId) {
        activeDriverId = drivers[0].id;
    }

    // Prepend General Pool Card for Admin
    if (isDriversAdmin) {
        const pool = getCompanyData().generalDeliveries || {};
        const poolCount = Object.keys(pool).length;
        const poolDiv = document.createElement('div');
        const isPoolSelected = activeDriverId === 'general';
        poolDiv.className = 'driver-card general-pool-card';
        poolDiv.style.cursor = 'pointer';
        poolDiv.style.borderColor = isPoolSelected ? 'var(--primary)' : 'var(--border-color)';
        poolDiv.style.borderWidth = isPoolSelected ? '2px' : '1px';
        poolDiv.style.marginBottom = '12px';
        poolDiv.style.background = isPoolSelected ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(255,255,255,0.02)';

        const isAr = currentAppLang === 'ar';
        const badgeHtml = poolCount > 0
            ? `<span class="driver-status-badge status-busy" style="background:var(--warning-bg); color:var(--warning);"><span class="pulse-dot" style="background-color:var(--warning);"></span>${poolCount} ${isAr ? 'معلق' : 'Pending'}</span>`
            : `<span class="driver-status-badge status-available" style="background:var(--success-bg); color:var(--success);"><span class="pulse-dot" style="background-color:var(--success);"></span>${isAr ? 'فارغ' : 'Empty'}</span>`;

        poolDiv.innerHTML = `
            <div class="driver-card-header">
                <div class="driver-info">
                    <strong class="driver-name" style="color: var(--secondary); font-size:0.95rem;">📦 ${isAr ? 'خانة الطلبات العامة' : 'General Deliveries Pool'}</strong>
                </div>
                <div class="driver-actions">
                    ${badgeHtml}
                </div>
            </div>
        `;
        poolDiv.onclick = () => selectDriver('general');
        list.appendChild(poolDiv);
    }

    if (drivers.length === 0 && !isDriversAdmin) {
        list.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem;">No drivers found.</p>`;
    } else {
        drivers.forEach(d => {
            const div = document.createElement('div');
            const isSelected = d.id === activeDriverId;
            const isBusy = !!d.activeOrder;

            div.className = 'driver-card';
            div.style.cursor = 'pointer';
            div.style.borderColor = isSelected ? 'var(--primary)' : 'var(--border-color)';
            div.style.borderWidth = isSelected ? '2px' : '1px';

            let statusBadge = isBusy
                ? `<span class="driver-status-badge status-busy"><span class="pulse-dot"></span>${t('status-in-transit')}</span>`
                : `<span class="driver-status-badge status-available"><span class="pulse-dot"></span>${t('status-available')}</span>`;

            let removeBtn = isDriversAdmin ? `<button onclick="demoteFromDriver(event, '${d.id}')" style="background:var(--danger-bg); color:var(--danger); border:1px solid var(--danger-border); border-radius:6px; padding:2px 8px; font-size:0.75rem; cursor:pointer;" title="${t('btn-remove')}">${t('btn-remove')}</button>` : '';

            let provisionsHtml = '';
            const isAr = currentAppLang === 'ar';
            if (d.companyCar) provisionsHtml += `<span class="driver-prov-icon" title="${isAr ? 'سيارة من الشركة' : 'Company Car'}">🚗</span>`;
            if (d.companyFuel) provisionsHtml += `<span class="driver-prov-icon" title="${isAr ? 'بنزين من الشركة' : 'Company Fuel'}">⛽</span>`;

            let provWrapper = provisionsHtml ? `<div class="driver-prov-wrapper">${provisionsHtml}</div>` : '';

            div.innerHTML = `
                <div class="driver-card-header">
                    <div class="driver-info">
                        <strong class="driver-name">${d.name}</strong>
                        ${provWrapper}
                    </div>
                    <div class="driver-actions">
                        ${statusBadge}
                        ${removeBtn}
                    </div>
                </div>
            `;
            div.onclick = () => selectDriver(d.id);
            list.appendChild(div);
        });
    }

    // Populate Promote selector
    const selectEl = document.getElementById('assign-driver-select');
    if (selectEl) {
        const prevVal = selectEl.value;
        selectEl.innerHTML = '<option value="">-- Choose Employee --</option>';

        const nonDrivers = workers.filter(w => {
            const r = (w.role || "").toLowerCase();
            return !(r.includes('driver') || r.includes('سائق') || r.includes('delivery'));
        });

        nonDrivers.forEach(w => {
            const opt = document.createElement('option');
            opt.value = w.id;
            opt.textContent = `${w.name} (${w.role})`;
            selectEl.appendChild(opt);
        });

        if (nonDrivers.some(w => w.id === prevVal)) {
            selectEl.value = prevVal;
        }
    }
}

function promoteToDriver() {
    const wId = document.getElementById('assign-driver-select').value;
    if (!wId) return alert("Select an employee first.");
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === wId);
    if (workerIndex === -1) return;

    const worker = getCompanyData().workers[workerIndex];
    worker.role = "Driver";

    const carVal = document.getElementById('assign-driver-car')?.checked || false;
    const fuelVal = document.getElementById('assign-driver-fuel')?.checked || false;

    worker.companyCar = carVal;
    worker.companyFuel = fuelVal;

    // Save updated role and provision details to Firebase
    db.ref(`companies/${currentCompany}/workers/${workerIndex}`).update({
        role: worker.role,
        companyCar: carVal,
        companyFuel: fuelVal
    }).then(() => {
        alert(`${worker.name} is now assigned as a Driver!`);
        document.getElementById('assign-driver-select').value = "";
        if (document.getElementById('assign-driver-car')) document.getElementById('assign-driver-car').checked = false;
        if (document.getElementById('assign-driver-fuel')) document.getElementById('assign-driver-fuel').checked = false;
        renderAll();
    }).catch(err => console.error("Error promoting to driver:", err));
}

function demoteFromDriver(event, dId) {
    if (event) event.stopPropagation();
    if (!confirm("Remove this employee from Driver role?")) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === dId);
    if (workerIndex === -1) return;

    const worker = getCompanyData().workers[workerIndex];
    worker.role = "General Staff";

    // Targeted write to update worker role
    db.ref(`companies/${currentCompany}/workers/${workerIndex}/role`).set(worker.role)
        .then(() => {
            alert(`${worker.name} is now assigned as General Staff!`);
            if (activeDriverId === dId) {
                activeDriverId = null;
            }
        })
        .catch(err => console.error("Error demoting driver:", err));
}

function updateSelectedDriverProvisions() {
    if (!activeDriverId) return;
    const companyData = getCompanyData();
    const workerIndex = companyData.workers.findIndex(w => w.id === activeDriverId);
    if (workerIndex === -1) return;

    const carCheck = document.getElementById('edit-driver-car');
    const fuelCheck = document.getElementById('edit-driver-fuel');
    if (!carCheck || !fuelCheck) return;

    const carVal = carCheck.checked;
    const fuelVal = fuelCheck.checked;

    db.ref(`companies/${currentCompany}/workers/${workerIndex}`).update({
        companyCar: carVal,
        companyFuel: fuelVal
    }).then(() => {
        // Silently update cache and refresh views
        companyData.workers[workerIndex].companyCar = carVal;
        companyData.workers[workerIndex].companyFuel = fuelVal;
        renderDriversList();
    }).catch(err => console.error("Error updating driver provisions:", err));
}

function renderDriverVolumeRewards() {
    const listDiv = document.getElementById('driver-rewards-rules-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';
    const isAr = currentAppLang === 'ar';
    const companyData = getCompanyData();
    const rewards = companyData.driverVolumeRewards || [];
    if (rewards.length === 0) {
        listDiv.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); text-align:center;">${isAr ? 'لا توجد قواعد مكافآت معينة.' : 'No reward rules configured yet.'}</p>`;
        return;
    }
    rewards.forEach((r, idx) => {
        const row = document.createElement('div');
        row.className = 'flex-between';
        row.style.background = 'var(--input-bg)';
        row.style.padding = '8px 12px';
        row.style.borderRadius = '6px';
        row.style.fontSize = '0.85rem';
        row.style.border = '1px solid var(--border-color)';
        row.innerHTML = `
            <span>🎯 <strong>${r.ordersCount}</strong> ${isAr ? 'طلب' : 'orders'} ➔ <strong style="color:var(--success);">SAR ${parseFloat(r.rewardAmount).toLocaleString()}</strong></span>
            <button onclick="deleteDriverVolumeReward(${idx})" class="btn-outline-danger" style="padding:2px 6px; font-size:0.7rem; line-height:1; border:none; background:transparent; cursor:pointer;" title="${isAr ? 'حذف القاعدة' : 'Delete Rule'}">🗑️</button>
        `;
        listDiv.appendChild(row);
    });
}

function addDriverVolumeReward() {
    const ordersInput = document.getElementById('reward-orders-input');
    const sarInput = document.getElementById('reward-sar-input');
    if (!ordersInput || !sarInput) return;

    const ordersCount = parseInt(ordersInput.value);
    const rewardAmount = parseFloat(sarInput.value);

    if (isNaN(ordersCount) || ordersCount <= 0) {
        alert("Enter valid daily orders count.");
        return;
    }
    if (isNaN(rewardAmount) || rewardAmount <= 0) {
        alert("Enter valid reward amount.");
        return;
    }

    const companyData = getCompanyData();
    if (!companyData.driverVolumeRewards) companyData.driverVolumeRewards = [];

    // Check if a rule for this ordersCount already exists
    const existingIdx = companyData.driverVolumeRewards.findIndex(r => r.ordersCount === ordersCount);
    if (existingIdx !== -1) {
        if (!confirm("A rule for this number of orders already exists. Overwrite it?")) return;
        companyData.driverVolumeRewards[existingIdx].rewardAmount = rewardAmount;
    } else {
        companyData.driverVolumeRewards.push({ ordersCount, rewardAmount });
    }

    // Sort by ordersCount ascending
    companyData.driverVolumeRewards.sort((a, b) => a.ordersCount - b.ordersCount);

    db.ref(`companies/${currentCompany}/driverVolumeRewards`).set(companyData.driverVolumeRewards)
        .then(() => {
            ordersInput.value = '';
            sarInput.value = '';
            renderDriverVolumeRewards();
            renderAll(); // Refresh finance table calculations
        })
        .catch(err => console.error("Error saving driver rewards rule:", err));
}

function deleteDriverVolumeReward(idx) {
    const companyData = getCompanyData();
    const rewards = companyData.driverVolumeRewards || [];
    if (!rewards[idx]) return;

    if (!confirm("Are you sure you want to delete this reward rule?")) return;

    rewards.splice(idx, 1);
    db.ref(`companies/${currentCompany}/driverVolumeRewards`).set(rewards)
        .then(() => {
            renderDriverVolumeRewards();
            renderAll(); // Refresh finance table calculations
        })
        .catch(err => console.error("Error deleting driver rewards rule:", err));
}

function renderDriverPanel() {
    const mngArea = document.getElementById('driver-management-area');
    if (!activeDriverId) { mngArea.style.display = 'none'; document.getElementById('active-driver-name').textContent = t('span-select-driver'); return; }

    mngArea.style.display = 'block';
    const isAr = currentAppLang === 'ar';
    const companyData = getCompanyData();

    // Show provisions configuration, timer, and action elements by default (might be hidden for General Pool)
    const provSection = document.getElementById('driver-provisions-section');
    if (provSection) provSection.style.display = 'block';
    document.getElementById('driver-timer-box').style.display = 'flex';
    document.getElementById('driver-timer-status').style.display = 'block';
    document.getElementById('panel-driver-actions').style.display = 'flex';

    if (activeDriverId === 'general') {
        document.getElementById('active-driver-name').textContent = isAr ? 'مسبح التوصيلات العامة' : 'General Deliveries Pool';

        if (provSection) provSection.style.display = 'none';

        const totalHud = document.getElementById('driver-total-orders');
        if (totalHud) totalHud.textContent = 'N/A';

        const formArea = document.querySelector('#view-drivers .management-form-area');
        const activeArea = document.getElementById('driver-active-order');

        formArea.style.display = 'block';
        activeArea.style.display = 'block';

        document.getElementById('driver-timer-box').style.display = 'none';
        document.getElementById('driver-timer-status').style.display = 'none';
        document.getElementById('panel-driver-actions').style.display = 'none';

        const pool = companyData.generalDeliveries || {};
        const poolKeys = Object.keys(pool);
        let detailsHtml = '';
        if (poolKeys.length === 0) {
            detailsHtml = `<p style="color:var(--text-muted); text-align:center; padding: 20px;">${isAr ? 'لا توجد طلبات معلقة في التوصيل العام.' : 'No pending orders in the general pool.'}</p>`;
        } else {
            detailsHtml = `<div style="display:flex; flex-direction:column; gap:16px; text-align:left; width: 100%;">`;
            const now = Date.now();
            poolKeys.forEach(orderId => {
                const order = pool[orderId];
                let timeText = '--:--';
                let orderStatusText = '';
                let statusColor = 'var(--text-muted)';
                let isLate = false;

                if (order.status === 'preparing') {
                    const diff = (order.prepStartTime + order.prepTimeMs) - now;
                    isLate = diff <= 0;
                    const absDiff = Math.abs(diff);
                    const h = Math.floor(absDiff / 3600000).toString().padStart(2, '0');
                    const m = Math.floor((absDiff % 3600000) / 60000).toString().padStart(2, '0');
                    const s = Math.floor((absDiff % 60000) / 1000).toString().padStart(2, '0');
                    timeText = isLate ? `-${h !== '00' ? h + ':' : ''}${m}:${s}` : `${h !== '00' ? h + ':' : ''}${m}:${s}`;
                    orderStatusText = isLate ? t('status-late-prep') : t('status-preparing');
                    statusColor = isLate ? 'var(--danger)' : 'var(--warning)';
                } else if (order.status === 'not_ready') {
                    orderStatusText = t('status-kitchen-not-ready');
                    statusColor = 'var(--danger)';
                } else if (order.status === 'ready') {
                    orderStatusText = t('status-ready-pickup');
                    statusColor = 'var(--success)';
                }

                const cancelBtn = `<button onclick="cancelGeneralPoolOrder('${orderId}')" class="btn-danger" style="padding: 6px 12px; font-size: 0.8rem; border-radius: 6px; cursor: pointer; border: none;">${isAr ? '❌ إلغاء الطلب' : '❌ Cancel'}</button>`;

                detailsHtml += `
                    <div class="ledger-card" style="border-left: 4px solid ${statusColor}; padding: 16px; display: flex; flex-direction: column; gap: 8px; background: rgba(255,255,255,0.02); border-radius: 8px;">
                        <div class="flex-between">
                            <strong style="color:var(--secondary); font-size:1.05rem;">${isAr ? 'طلب' : 'Order'} #${order.orderNum || ''}</strong>
                            ${cancelBtn}
                        </div>
                        <div style="font-size:0.95rem; color:var(--text-main); font-family:var(--font-mono); margin: 6px 0; background: rgba(0,0,0,0.15); padding: 8px 12px; border-radius: 6px; white-space: pre-wrap;">${order.details}</div>
                        <div class="flex-between" style="font-size:0.85rem; color:var(--text-muted);">
                            <div>${isAr ? 'حالة المطبخ' : 'Kitchen Status'}: <span style="color:${statusColor}; font-weight:600;">${orderStatusText}</span></div>
                            ${order.status === 'preparing' ? `<div class="general-pool-timer" data-start="${order.prepStartTime}" data-time="${order.prepTimeMs}" style="font-family:var(--font-mono); font-weight:700; color:${statusColor};">${timeText}</div>` : ''}
                        </div>
                    </div>
                `;
            });
            detailsHtml += `</div>`;
        }
        document.getElementById('panel-order-details').innerHTML = detailsHtml;
        document.getElementById('driver-orders-list').innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:20px;">${isAr ? 'مسبح التوصيل العام لا يحتوي على سجل مالي أو تاريخ توصيل خاص به.' : 'The general pool does not have individual history logs.'}</p>`;

        const driverPoolContainer = document.getElementById('driver-general-pool-container');
        if (driverPoolContainer) driverPoolContainer.style.display = 'none';
        return;
    }

    const worker = companyData.workers.find(w => w.id === activeDriverId);
    if (!worker) {
        activeDriverId = null;
        mngArea.style.display = 'none';
        document.getElementById('active-driver-name').textContent = t('span-select-driver');
        return;
    }
    document.getElementById('active-driver-name').textContent = `${t('label-managing') || 'Managing: '}${worker.name}`;

    // Set Driver provisions checkbox states
    const carCheck = document.getElementById('edit-driver-car');
    const fuelCheck = document.getElementById('edit-driver-fuel');
    if (carCheck) carCheck.checked = !!worker.companyCar;
    if (fuelCheck) fuelCheck.checked = !!worker.companyFuel;

    const stats = getMonthlyStats(worker, currentGlobalMonth);
    const totalDels = (stats.deliveriesList ? stats.deliveriesList.length : 0) + (stats.legacyDeliveries || 0);
    document.getElementById('driver-total-orders').textContent = totalDels;

    const formArea = document.querySelector('#view-drivers .management-form-area');
    const activeArea = document.getElementById('driver-active-order');

    if (worker.activeOrder) {
        formArea.style.display = 'none';
        activeArea.style.display = 'block';
        document.getElementById('panel-order-details').textContent = worker.activeOrder.details;

        // Hide general pool container for this driver while they have an active order
        const driverPoolContainer = document.getElementById('driver-general-pool-container');
        if (driverPoolContainer) driverPoolContainer.style.display = 'none';

        // Inject Panel Action Buttons
        const panelActions = document.getElementById('panel-driver-actions');
        let html = '';

        // Check if user is a Master Admin OR has the 'Drivers Admin' permission
        const isManager = currentUser && (currentUser.role === 'admin' || document.body.classList.contains('perm-drivers'));

        // 1. Force Ready Button (Managers Only, when preparing)
        if (isManager && worker.activeOrder.status === 'preparing') {
            html += `<div style="width: 100%; text-align: center; margin-bottom: 12px;">
                                <button onclick="forceOrderReady('${worker.id}')" class="btn-info" style="padding: 12px 24px; width: 100%;">🟢 Force Kitchen Ready</button>
                             </div>`;
        }

        // 2. Pickup / Deliver Buttons (Visible to Driver & Managers)
        if (worker.activeOrder.status !== 'picked_up') {
            html += `<button onclick="pickupDriverOrder('${worker.id}')" class="btn-warning" style="padding: 12px 24px;">📦 Mark as Received/Picked Up</button>`;
        } else {
            html += `<button onclick="finishDriverOrder(true, '${worker.id}')" class="btn-success" style="padding: 12px 24px;">✅ Order Delivered</button>`;
        }

        // 3. Cancel Button (Managers can always cancel, Driver can cancel if it's a general pool order)
        if (isManager || worker.activeOrder.isGeneralPool) {
            const btnText = worker.activeOrder.isGeneralPool
                ? t('btn-return-pool')
                : (isAr ? '❌ إلغاء الطلب' : '❌ Cancel Order');
            html += `<button onclick="finishDriverOrder(false, '${worker.id}')" class="btn-danger" style="padding: 12px 24px;">${btnText}</button>`;
        }

        panelActions.innerHTML = html;

        updateActiveDriverTimer();
    }
    else {
        formArea.style.display = 'block';
        activeArea.style.display = 'none';

        // If the logged in user is a driver (worker) and is managing themselves
        const isSelfDriver = currentUser && currentUser.email && worker.email && (currentUser.email.toLowerCase() === worker.email.toLowerCase());
        const isDriverRole = (worker.role || "").toLowerCase().includes('driver') || (worker.role || "").toLowerCase().includes('سائق') || (worker.role || "").toLowerCase().includes('delivery');

        if (isSelfDriver && isDriverRole) {
            // Render the Available General Deliveries Pool for this driver to claim!
            const pool = companyData.generalDeliveries || {};
            const poolKeys = Object.keys(pool);
            const driverPoolContainer = document.getElementById('driver-general-pool-container');
            const driverPoolList = document.getElementById('driver-general-pool-list');

            if (driverPoolContainer && driverPoolList) {
                if (poolKeys.length === 0) {
                    driverPoolContainer.style.display = 'none';
                } else {
                    driverPoolContainer.style.display = 'block';
                    let poolHtml = '';
                    poolKeys.forEach(orderId => {
                        const order = pool[orderId];
                        let statusText = '';
                        let statusColor = 'var(--text-muted)';
                        if (order.status === 'preparing') {
                            statusText = t('status-preparing');
                            statusColor = 'var(--warning)';
                        } else if (order.status === 'not_ready') {
                            statusText = t('status-kitchen-not-ready');
                            statusColor = 'var(--danger)';
                        } else if (order.status === 'ready') {
                            statusText = t('status-ready-pickup');
                            statusColor = 'var(--success)';
                        }

                        poolHtml += `
                            <div class="ledger-card" style="border-left: 4px solid ${statusColor}; padding: 16px; border-radius: 8px; display: flex; flex-direction: column; gap: 8px; background: rgba(255,255,255,0.02); text-align: left;">
                                <div class="flex-between">
                                    <strong style="color:var(--secondary); font-size:1.02rem;">${isAr ? 'طلب عام' : 'General Order'} #${order.orderNum || ''}</strong>
                                    <button onclick="claimGeneralDelivery('${orderId}')" class="btn-success" style="padding: 6px 14px; font-size: 0.85rem; border-radius: 6px; cursor: pointer; border: none; font-weight:700;">${t('btn-accept-delivery')}</button>
                                </div>
                                <div style="font-size:0.92rem; color:var(--text-main); font-family:var(--font-mono); background: rgba(0,0,0,0.15); padding: 8px 12px; border-radius: 6px; white-space: pre-wrap;">${order.details}</div>
                                <div style="font-size:0.82rem; color:var(--text-muted);">
                                    ${isAr ? 'المطبخ' : 'Kitchen'}: <span style="color:${statusColor}; font-weight:600;">${statusText}</span>
                                </div>
                            </div>
                        `;
                    });
                    driverPoolList.innerHTML = poolHtml;
                }
            }
        } else {
            const driverPoolContainer = document.getElementById('driver-general-pool-container');
            if (driverPoolContainer) driverPoolContainer.style.display = 'none';
        }
    }

    const isAdmin = currentUser && currentUser.role === 'admin';

    // Render Orders History
    const ordersList = document.getElementById('driver-orders-list');
    ordersList.innerHTML = '';
    if (stats.deliveriesList && stats.deliveriesList.length > 0) {
        stats.deliveriesList.forEach((order, index) => {
            const actualOrderNum = order.orderNum || (totalDels - index);
            const durationMs = order.endTime - order.startTime;
            const diff = durationMs - order.allocatedMs;
            const timeTaken = formatDuration(durationMs);
            let statusHtml = '';
            if (diff > 0) statusHtml = `<span style="color:var(--danger)">${t('late-by')} ${formatDuration(diff)} ❌</span>`;
            else statusHtml = `<span style="color:var(--success)">${t('on-time')} ✅</span>`;

            let prepHtml = '';
            if (order.prepTimeMs > 0 && order.prepStartTime && order.prepEndTime) {
                const prepDuration = order.prepEndTime - order.prepStartTime;
                const prepDiff = prepDuration - order.prepTimeMs;
                const prepTimeTaken = formatDuration(prepDuration);

                if (prepDiff > 0) {
                    prepHtml = `<div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">${t('kitchen-prep-time')} <strong>${prepTimeTaken}</strong> <span style="color:var(--danger)">(${t('late-by')} ${formatDuration(prepDiff)}) ❌</span></div>`;
                } else {
                    prepHtml = `<div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">${t('kitchen-prep-time')} <strong>${prepTimeTaken}</strong> <span style="color:var(--success)">(${t('on-time')}) ✅</span></div>`;
                }
            }

            let delBtn = isAdmin ? `<button onclick="deleteDeliveryRecord('${worker.id}', '${order.id}')" class="btn-outline-danger admin-only" style="padding: 2px 6px; font-size: 0.7rem; border:none; text-decoration:underline;">Undo/Delete</button>` : '';

            const div = document.createElement('div');
            const isLate = diff > 0;
            div.className = `ledger-card driver-history-card ${isLate ? 'status-late' : 'status-ontime'}`;
            div.innerHTML = `
                        <div class="flex-between" style="margin-bottom: 4px;">
                            <strong style="color:var(--primary);">${isAr ? 'طلب' : 'Order'} #${actualOrderNum}</strong>
                            <div style="display:flex; gap:8px; align-items:center;">
                                <span style="font-size:0.75rem; color:var(--text-muted);">${order.date}</span>
                                ${delBtn}
                            </div>
                        </div>
                        <div style="font-size:0.95rem; color:var(--text-main);">${t('delivery-time')} <strong>${timeTaken}</strong></div>
                        ${prepHtml}
                        <div style="font-size:0.85rem; margin-top:4px;">${t('delivery-status')} ${statusHtml}</div>
                    `;
            ordersList.appendChild(div);
        });
    } else if (stats.legacyDeliveries > 0) {
        let delLegacyBtn = isAdmin ? `<button onclick="deleteLegacyDelivery('${worker.id}')" class="btn-outline-danger admin-only" style="margin-left: 10px; padding: 2px 6px; font-size: 0.7rem; border:none; text-decoration:underline;">-1 Undo</button>` : '';
        ordersList.innerHTML = `<div class="ledger-card" style="text-align:center; color:var(--text-muted);">${stats.legacyDeliveries} ${isAr ? 'توصيلة سابقة مسجلة (لا تتوفر بيانات توقيت).' : 'legacy deliveries recorded (no timing data).'} ${delLegacyBtn}</div>`;
    } else {
        ordersList.innerHTML = `<div class="ledger-card" style="text-align:center; color:var(--text-muted);">${isAr ? 'لم يتم إكمال أي عمليات توصيل بعد.' : 'No deliveries completed yet.'}</div>`;
    }
}

// --- MANAGEMENT ACTIONS ---
function addPaymentRecord() {
    const workerId = document.getElementById('fin-worker-select').value;
    const amount = parseFloat(document.getElementById('payment-amount').value);
    if (!workerId || isNaN(amount) || amount <= 0) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);

    stats.paymentsList.unshift({ id: Date.now().toString(), date: formatTimestamp(), amount: amount });
    document.getElementById('payment-amount').value = '';

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/paymentsList`).set(stats.paymentsList)
        .then(() => {
            logActivity('finance', worker.id, worker.name, `Logged advance payment of SAR ${amount} for ${worker.name}`);
        })
        .catch(err => console.error("Error adding payment:", err));
}

function deletePaymentRecord(workerId, paymentId) {
    if (!confirm("Remove this payment log?")) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);
    stats.paymentsList = stats.paymentsList.filter(p => p.id !== paymentId);

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/paymentsList`).set(stats.paymentsList)
        .then(() => {
            logActivity('finance_delete', workerId, worker.name, `Deleted advance payment record for ${worker.name}`);
        })
        .catch(err => console.error("Error deleting payment:", err));
}

function addRewardRecord() {
    const workerId = document.getElementById('fin-worker-select').value;
    const amount = parseFloat(document.getElementById('reward-amount').value);
    if (!workerId || isNaN(amount) || amount <= 0) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);

    stats.rewardsList.unshift({ id: Date.now().toString(), date: formatTimestamp(), amount: amount });
    document.getElementById('reward-amount').value = '';

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/rewardsList`).set(stats.rewardsList)
        .then(() => {
            logActivity('finance', worker.id, worker.name, `Logged reward/bonus of SAR ${amount} for ${worker.name}`);
        })
        .catch(err => console.error("Error adding reward:", err));
}

function deleteRewardRecord(workerId, rewardId) {
    if (!confirm("Remove this reward log?")) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);
    stats.rewardsList = stats.rewardsList.filter(r => r.id !== rewardId);

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/rewardsList`).set(stats.rewardsList)
        .then(() => {
            logActivity('finance_delete', workerId, worker.name, `Deleted reward/bonus record for ${worker.name}`);
        })
        .catch(err => console.error("Error deleting reward:", err));
}

function addCustodyRecord(type) {
    const workerId = document.getElementById('fin-worker-select').value;
    const amount = parseFloat(document.getElementById('custody-amount').value);
    if (!workerId || isNaN(amount) || amount <= 0) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);

    stats.custodyList.unshift({ id: Date.now().toString(), date: formatTimestamp(), amount: amount, type: type });
    document.getElementById('custody-amount').value = '';

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/custodyList`).set(stats.custodyList)
        .then(() => {
            logActivity('finance', worker.id, worker.name, `Logged custody item "${type}" (SAR ${amount}) for ${worker.name}`);
        })
        .catch(err => console.error("Error adding custody:", err));
}

function deleteCustodyRecord(workerId, custodyId) {
    if (!confirm("Remove this custody log?")) return;
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);
    stats.custodyList = stats.custodyList.filter(c => c.id !== custodyId);

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/custodyList`).set(stats.custodyList)
        .then(() => {
            logActivity('finance_delete', workerId, worker.name, `Deleted custody record for ${worker.name}`);
        })
        .catch(err => console.error("Error deleting custody:", err));
}

function addBranch() {
    const nameInput = document.getElementById('new-branch-name'); const name = nameInput.value.trim();
    if (name && !getCompanyData().branches.includes(name)) {
        getCompanyData().branches.push(name);
        nameInput.value = '';
        db.ref('companies/' + currentCompany + '/branches').set(getCompanyData().branches)
            .catch(err => console.error("Error adding branch:", err));
    }
    else { alert("Invalid or existing branch."); }
}
function deleteBranch(branchName) {
    if (confirm(`Remove branch: ${branchName}?`)) {
        getCompanyData().branches = getCompanyData().branches.filter(b => b !== branchName);
        db.ref('companies/' + currentCompany + '/branches').set(getCompanyData().branches)
            .catch(err => console.error("Error deleting branch:", err));
    }
}

function addWorker() {
    const name = document.getElementById('w-name').value.trim();
    const email = document.getElementById('w-email').value.trim().toLowerCase();
    let role = document.getElementById('w-role').value.trim() || "General Staff";
    const startTime = document.getElementById('w-start-time').value;
    const endTime = document.getElementById('w-end-time').value;
    const income = document.getElementById('w-income').value;
    const branch = document.getElementById('w-branch').value;

    if (!name || !email || !startTime || !endTime || !income || !branch) { alert("Complete all required fields, including email."); return; }

    const newWorker = {
        id: Date.now().toString(),
        name, email, role, income, startTime, endTime, branch,
        initialBalance: 0, jobs: [], monthlyStats: {}, logs: [], rank: "Unranked", lastEvalDate: Date.now(),
        permissions: { warehouse: false, drivers: false, finance: false }
    };

    newWorker.monthlyStats[currentGlobalMonth] = { custodyList: [], violationsList: [], rewardsList: [], costs: 0, paymentsList: [], deliveriesList: [], legacyDeliveries: 0 };
    if (!getCompanyData().workers) getCompanyData().workers = [];
    getCompanyData().workers.push(newWorker);

    ['w-name', 'w-email', 'w-role', 'w-start-time', 'w-end-time', 'w-income'].forEach(id => document.getElementById(id).value = '');

    // Targeted write to workers list
    db.ref('companies/' + currentCompany + '/workers').set(getCompanyData().workers)
        .then(() => {
            const key = email.replace(/\./g, ',');
            db.ref(`companies/${currentCompany}/users/${key}`).set(newWorker.id)
                .catch(err => console.error("Error writing worker flat email mapping:", err));
            db.ref(`companies/${currentCompany}/userPermissions/${newWorker.id}`).set({
                email: newWorker.email.toLowerCase(),
                ...newWorker.permissions
            }).catch(err => console.error("Error writing worker flat permission:", err));
        })
        .catch(err => console.error("Error adding worker:", err));
}

function deleteWorker(workerId) {
    const worker = getCompanyData().workers.find(w => w.id === workerId);
    if (confirm('Permanently delete this employee?')) {
        getCompanyData().workers = getCompanyData().workers.filter(w => w.id !== workerId);
        document.getElementById('ops-worker-select').value = "";
        document.getElementById('fin-worker-select').value = "";
        document.getElementById('task-worker-select').value = "";
        activeDriverId = null;

        // Targeted write to workers list
        db.ref('companies/' + currentCompany + '/workers').set(getCompanyData().workers)
            .then(() => {
                if (worker && worker.email) {
                    const key = worker.email.toLowerCase().replace(/\./g, ',');
                    db.ref(`companies/${currentCompany}/users/${key}`).remove()
                        .catch(err => console.error("Error deleting worker flat email mapping:", err));
                    db.ref(`companies/${currentCompany}/userPermissions/${workerId}`).remove()
                        .catch(err => console.error("Error deleting worker flat permission:", err));
                }
            })
            .catch(err => console.error("Error deleting worker:", err));
    }
}

function setInitialBalance() {
    const workerId = document.getElementById('fin-worker-select').value;
    if (!workerId) { alert("Select an employee first."); return; }

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    let amountText = document.getElementById('initial-balance-amount').value;
    const amount = parseFloat(amountText);
    if (isNaN(amount)) return;

    worker.initialBalance = amount;

    // Targeted write to initialBalance
    db.ref(`companies/${currentCompany}/workers/${workerIndex}/initialBalance`).set(amount)
        .then(() => {
            logActivity('finance', worker.id, worker.name, `Set initial carryover balance of SAR ${amount} for ${worker.name}`);
        })
        .catch(err => console.error("Error setting initial balance:", err));
    alert("Initial Carryover Balance Updated.");
}

function getAveragePerfection(logs) {
    const graded = logs.filter(l => l.noteType !== 'vacation' && l.score !== 'vacation');
    if (graded.length === 0) return 'N/A';
    return Math.round(graded.reduce((sum, log) => sum + parseFloat(log.score), 0) / graded.length) + '%';
}

function updateFinancialRecord(type, action) {
    const workerId = document.getElementById('fin-worker-select').value;
    if (!workerId) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);

    const idMap = { 'costs': 'cost-amount' };
    const inputEl = document.getElementById(idMap[type]);

    if (action === 'add' || action === 'remove') {
        const amount = parseFloat(inputEl.value);
        if (isNaN(amount) || amount <= 0) return;
        if (action === 'add') stats[type] += amount;
        else { stats[type] -= amount; if (stats[type] < 0) stats[type] = 0; }
        inputEl.value = '';
    } else if (action === 'clear' && confirm(`Clear all ${type} for ${worker.name}?`)) { stats[type] = 0; }

    // Targeted write to worker's specific monthly finance record
    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/${type}`).set(stats[type])
        .catch(err => console.error(`Error updating financial record ${type}:`, err));
}

function handleOpsWorkerChange() { renderOpsDetails(); }
function handleFinWorkerChange() { renderFinDetails(); }

function addDailyLog() {
    const workerId = document.getElementById('ops-worker-select').value;
    const startDateStr = document.getElementById('log-date').value;
    const noteType = document.getElementById('log-type').value;
    const note = document.getElementById('log-note').value.trim();

    if (!workerId || !startDateStr) { alert("Select an employee and date."); return; }

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;
    const worker = getCompanyData().workers[workerIndex];

    if (noteType === 'vacation') {
        const numDays = parseInt(document.getElementById('vacation-days').value) || 1;
        let startD = new Date(startDateStr);
        for (let i = 0; i < numDays; i++) {
            let d = new Date(startD);
            d.setDate(d.getDate() + i);

            let y = d.getFullYear();
            let m = (d.getMonth() + 1).toString().padStart(2, '0');
            let day = d.getDate().toString().padStart(2, '0');
            let dStr = `${y}-${m}-${day}`;

            let existingLogIndex = worker.logs.findIndex(l => l.date === dStr);
            if (existingLogIndex >= 0) worker.logs[existingLogIndex] = { date: dStr, score: 'vacation', note: note || 'Vacation', noteType: 'vacation' };
            else worker.logs.push({ date: dStr, score: 'vacation', note: note || 'Vacation', noteType: 'vacation' });
        }
    } else {
        const score = noteType === 'good' ? 100 : 2.5;
        let existingLogIndex = worker.logs.findIndex(l => l.date === startDateStr);
        if (existingLogIndex >= 0) worker.logs[existingLogIndex] = { date: startDateStr, score, note, noteType };
        else worker.logs.push({ date: startDateStr, score, note, noteType });
    }

    worker.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    document.getElementById('log-note').value = '';
    document.getElementById('vacation-days').value = '1';

    // Targeted write to worker's logs
    db.ref(`companies/${currentCompany}/workers/${workerIndex}/logs`).set(worker.logs)
        .catch(err => console.error("Error saving daily log:", err));
}

function deleteLog(workerId, logDate) {
    if (confirm(`Delete record for ${logDate}?`)) {
        const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
        if (workerIndex !== -1) {
            const worker = getCompanyData().workers[workerIndex];
            worker.logs = worker.logs.filter(l => l.date !== logDate);

            // Auto-revert logic
            const todayStr = new Date().toISOString().slice(0, 10);
            if (logDate <= todayStr) {
                worker.logs.push({
                    date: logDate,
                    score: 100,
                    note: 'Auto-logged ✅',
                    noteType: 'good'
                });
                worker.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
            }

            // Targeted write to worker's logs
            db.ref(`companies/${currentCompany}/workers/${workerIndex}/logs`).set(worker.logs)
                .catch(err => console.error("Error deleting daily log:", err));
        }
    }
}

// --- ADVERTISEMENT MAP SYSTEM ---
let promoMap = null;
let mapLayerGroup = null;

// Drawing & UI State
let activeAdvertTool = 'pin';
let drawPoints = [];
let tempDrawLayer = null;
let pendingMapItem = null; // Temporarily holds the location data until the modal is saved

function setAdvertTool(tool) {
    activeAdvertTool = tool;
    document.getElementById('tool-pin').className = tool === 'pin' ? 'btn-success' : 'btn-outline';
    document.getElementById('tool-poly').className = tool === 'polygon' ? 'btn-success' : 'btn-outline';

    if (tempDrawLayer && promoMap) promoMap.removeLayer(tempDrawLayer);
    drawPoints = [];
    tempDrawLayer = null;
    document.getElementById('tool-finish').style.display = 'none';
}

// Triggered when user clicks "Finish Area"
function finishPolygonDraw() {
    if (drawPoints.length < 3) return;

    // Store points and open Modal
    pendingMapItem = { type: 'polygon', points: [...drawPoints] };
    document.getElementById('map-item-note').value = '';
    document.getElementById('map-item-modal').style.display = 'flex';
}

// Close Modal without saving
function cancelMapItem() {
    document.getElementById('map-item-modal').style.display = 'none';
    pendingMapItem = null;
    if (activeAdvertTool === 'polygon') {
        setAdvertTool('pin'); // Reset tool state
    }
}

// Triggered when user clicks "Save Marker" inside the custom modal
function saveMapItem() {
    if (!pendingMapItem) return;

    const color = document.querySelector('input[name="pin-color"]:checked').value;
    const note = document.getElementById('map-item-note').value.trim() || "No details provided";

    const newItem = {
        id: Date.now().toString(),
        type: pendingMapItem.type,
        lat: pendingMapItem.lat || null,
        lng: pendingMapItem.lng || null,
        points: pendingMapItem.points || null,
        color: color,
        note: note,
        date: formatTimestamp()
    };

    if (!getCompanyData().adverts) getCompanyData().adverts = [];
    getCompanyData().adverts.push(newItem);
    document.getElementById('map-item-modal').style.display = 'none';
    pendingMapItem = null;
    setAdvertTool('pin'); // Reset back to default

    // Targeted write to adverts
    db.ref('companies/' + currentCompany + '/adverts/' + newItem.id).set(newItem)
        .catch(err => console.error("Error saving map item:", err));
}

function initPromoMap() {
    if (promoMap) return;

    promoMap = L.map('promo-map').setView([26.2144, 50.1971], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(promoMap);

    mapLayerGroup = L.layerGroup().addTo(promoMap);

    promoMap.on('click', function (e) {
        if (!currentUser || currentUser.role !== 'admin') {
            alert("Only administrators can edit the map.");
            return;
        }

        if (activeAdvertTool === 'pin') {
            // Store location and open Modal
            pendingMapItem = { type: 'pin', lat: e.latlng.lat, lng: e.latlng.lng };
            document.getElementById('map-item-note').value = '';
            document.getElementById('map-item-modal').style.display = 'flex';

        } else if (activeAdvertTool === 'polygon') {
            drawPoints.push([e.latlng.lat, e.latlng.lng]);

            if (tempDrawLayer) promoMap.removeLayer(tempDrawLayer);

            if (drawPoints.length < 3) {
                tempDrawLayer = L.polyline(drawPoints, { color: 'var(--primary)', dashArray: '5, 5', weight: 3 }).addTo(promoMap);
            } else {
                tempDrawLayer = L.polygon(drawPoints, { color: 'var(--primary)', fillOpacity: 0.2, weight: 3 }).addTo(promoMap);
                document.getElementById('tool-finish').style.display = 'inline-block';
            }
        }
    });
}

function deleteAdvertPin(id) {
    if (!confirm("Delete this item from the map?")) return;
    getCompanyData().adverts = getCompanyData().adverts.filter(p => p.id !== id);

    // Targeted delete from adverts
    db.ref('companies/' + currentCompany + '/adverts/' + id).remove()
        .catch(err => console.error("Error deleting map item:", err));
}

function renderAdverts() {
    if (currentTab !== 'adverts') return;
    initPromoMap();

    const pins = getCompanyData().adverts || [];
    mapLayerGroup.clearLayers();
    const logList = document.getElementById('adverts-log-list');
    logList.innerHTML = '';

    const colorCodes = {
        'green': '#16a34a',
        'yellow': '#d97706',
        'red': '#dc2626'
    };

    const isAdmin = currentUser && currentUser.role === 'admin';

    if (pins.length === 0) {
        logList.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.9rem; padding: 20px;">No pins or areas dropped yet.</p>`;
    }

    [...pins].reverse().forEach(pin => {
        const hexColor = colorCodes[pin.color] || '#333';
        let mapElement;
        let centerLat, centerLng;

        // Render Polygon Area
        if (pin.type === 'polygon' && pin.points) {
            mapElement = L.polygon(pin.points, {
                color: hexColor,
                fillColor: hexColor,
                fillOpacity: 0.3,
                weight: 2
            }).addTo(mapLayerGroup);

            // Calculate center to place the text
            const bounds = mapElement.getBounds();
            const center = bounds.getCenter();
            centerLat = center.lat;
            centerLng = center.lng;

            // Overlay the note text directly in the middle of the drawn area
            L.marker(center, {
                icon: L.divIcon({
                    className: 'dummy',
                    html: `<div style="color: ${hexColor}; font-weight: 900; font-size: 1rem; text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff; text-align: center; min-width:150px; transform: translate(-50%, -50%); pointer-events:none;">${pin.note}</div>`,
                    iconSize: [0, 0]
                }),
                interactive: false
            }).addTo(mapLayerGroup);

        } else {
            // Render Standard Pin
            mapElement = L.circleMarker([pin.lat, pin.lng], {
                color: hexColor,
                fillColor: hexColor,
                fillOpacity: 0.7,
                radius: 12,
                weight: 2
            }).addTo(mapLayerGroup);
            centerLat = pin.lat;
            centerLng = pin.lng;
        }

        mapElement.bindPopup(`<div style="font-family:'Inter', sans-serif;">
                                    <strong style="color:var(--text-main); font-size:0.9rem;">${pin.date}</strong><br>
                                    <span style="color:var(--text-muted);">${pin.note}</span>
                                  </div>`);

        // Add to Log List
        const div = document.createElement('div');
        div.className = 'ledger-card';
        div.style.borderLeft = `4px solid ${hexColor}`;
        div.style.cursor = 'pointer';
        div.style.marginBottom = '8px';

        let delBtn = isAdmin ? `<button onclick="deleteAdvertPin('${pin.id}'); event.stopPropagation();" class="btn-outline-danger" style="padding:2px 6px; font-size:0.7rem; border:none; text-decoration:underline;">Delete</button>` : '';
        let iconType = pin.type === 'polygon' ? '🖍️ Area' : '📍 Pin';

        div.innerHTML = `
                    <div class="flex-between" style="align-items:start;">
                        <div>
                            <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">${pin.date} <span style="background:var(--bg-color); padding:2px 6px; border-radius:4px; margin-left:6px;">${iconType}</span></div>
                            <div style="font-weight:600; color:var(--text-main); font-size:0.95rem; line-height:1.4;">${pin.note}</div>
                        </div>
                        <div>${delBtn}</div>
                    </div>
                `;

        div.onclick = () => {
            promoMap.flyTo([centerLat, centerLng], 15, { duration: 1.5 });
            setTimeout(() => { mapElement.openPopup(); }, 1500);
        };

        logList.appendChild(div);
    });
}



async function searchMapLocation() {
    const input = document.getElementById('map-search-input');
    const query = input.value.trim();
    if (!query) return;
    try {
        const response = await fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query) + '&limit=1');
        const data = await response.json();
        if (data && data.length > 0) {
            const res = data[0];
            promoMap.flyTo([res.lat, res.lon], 16, { duration: 2 });
        } else {
            alert('Location not found.');
        }
    } catch (err) {
        alert('Search failed.');
    }
}


// --- RENDERING ---
function renderAll() {
    renderBranches();
    renderViolationRules();
    populateWorkerDropdowns();
    renderWarehouse();
    renderManagersList();
    renderWorkerViolationPanel();

    if (currentTab === 'ops') {
        renderOpsWorkersTable();
        renderOpsDetails();
        if (typeof renderSelectedWorkerSysViolations === 'function') {
            renderSelectedWorkerSysViolations();
        }
    }
    else if (currentTab === 'ranks') { renderRanksTable(); }
    else if (currentTab === 'attendance') { renderAttendance(); }
    else if (currentTab === 'tasks') { renderTasks(); }
    else if (currentTab === 'finance') { renderFinanceTable(); renderFinDetails(); renderFinanceSpendArea(); }
    else if (currentTab === 'summary') { renderSummaryTable(); renderLeaderboard(); }
    else if (currentTab === 'drivers') { renderDriversList(); renderDriverPanel(); renderDriverVolumeRewards(); }
    else if (currentTab === 'adverts') { renderAdverts(); }
    else if (currentTab === 'notes') { renderNotes(); }
    else if (currentTab === 'activity') { renderActivityLog(); }
    else if (currentTab === 'managing') { renderManaging(); }
    else if (currentTab === 'costs') { renderCosts(); }

    renderPaymentRequests();
    renderWorkerCustodyRequests();
    renderPendingCustodyRequests();
    renderAcceptedCustodyReleases();
    if (typeof applyUserTabOrder === 'function') {
        applyUserTabOrder();
    }
}

function renderWorkerViolationPanel() {
    const panel = document.getElementById('worker-violation-panel');
    const list = document.getElementById('worker-violations-list');
    if (!panel || !list) return;

    // Only for non-admin workers, and only on the Finance tab
    if (!currentUser || currentUser.role === 'admin') {
        panel.style.display = 'none';
        return;
    }
    if (currentTab !== 'finance') {
        panel.style.display = 'none';
        return;
    }
    panel.style.display = 'block';

    // Find this worker's profile
    const myWorker = getCompanyData().workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
    if (!myWorker) {
        list.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:20px;">Your account is not linked to any worker profile yet.</p>`;
        return;
    }

    const stats = getMonthlyStats(myWorker, currentGlobalMonth);
    const violList = stats.violationsList || [];

    list.innerHTML = '';

    if (violList.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:30px; color:var(--success);"><div style="font-size:2rem;">✅</div><strong>No violations recorded this month.</strong><p style="color:var(--text-muted); margin-top:8px; font-size:0.9rem;">Keep up the great work!</p></div>`;
        return;
    }

    violList.forEach(v => {
        const div = document.createElement('div');
        div.className = 'ledger-card';

        let statusHtml = '';
        let borderColor = 'var(--danger)';

        if (v.status === 'waived') {
            borderColor = 'var(--success)';
            statusHtml = `<div style="margin-top:10px; padding:10px 14px; background:var(--success-bg); border:1px solid var(--success-border); border-radius:8px; font-size:0.9rem; color:var(--success); font-weight:600;">✅ Fixed &amp; Waived — No penalty applied</div>`;
        } else if (v.status === 'active' || !v.status) {
            borderColor = 'var(--danger)';
            statusHtml = `<div style="margin-top:10px; padding:10px 14px; background:var(--danger-bg); border:1px solid var(--danger-border); border-radius:8px; font-size:0.9rem; color:var(--danger); font-weight:600;">🚨 Penalty Applied — SAR ${parseFloat(v.amount).toLocaleString()} deducted</div>`;
        } else if (v.status === 'pending') {
            const deadline = v.timestamp + (v.graceDays * 86400000);
            const timeLeft = deadline - Date.now();
            if (timeLeft <= 0) {
                borderColor = 'var(--danger)';
                statusHtml = `<div style="margin-top:10px; padding:10px 14px; background:var(--danger-bg); border:1px solid var(--danger-border); border-radius:8px; font-size:0.9rem; color:var(--danger); font-weight:600;">🚨 Time Expired — Penalty of SAR ${parseFloat(v.amount).toLocaleString()} applied</div>`;
            } else {
                borderColor = 'var(--warning)';
                const totalHours = Math.floor(timeLeft / 3600000);
                const daysLeft = Math.floor(totalHours / 24);
                const hoursLeft = totalHours % 24;
                const minsLeft = Math.floor((timeLeft % 3600000) / 60000);
                let timeStr = '';
                if (daysLeft > 0) timeStr = `${daysLeft} day${daysLeft > 1 ? 's' : ''} and ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`;
                else if (hoursLeft > 0) timeStr = `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} and ${minsLeft} minute${minsLeft !== 1 ? 's' : ''}`;
                else timeStr = `${minsLeft} minute${minsLeft !== 1 ? 's' : ''}`;

                statusHtml = `
                            <div style="margin-top:10px; padding:12px 14px; background:var(--warning-bg); border:1px solid var(--warning-border); border-radius:8px;">
                                <div style="font-size:1rem; color:var(--warning); font-weight:700; margin-bottom:6px;">⏳ Fix This Before Penalty Is Applied</div>
                                <div style="font-size:0.85rem; color:var(--text-main); margin-bottom:4px;">Manager gave you <strong>${v.graceDays} day${v.graceDays > 1 ? 's' : ''}</strong> to fix this violation.</div>
                                <div style="font-size:0.85rem; color:var(--warning); font-weight:600;">Time remaining: <strong>${timeStr}</strong></div>
                                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">Penalty if not fixed: SAR ${parseFloat(v.amount).toLocaleString()}</div>
                            </div>`;
            }
        }

        let imgHtml = v.image ? `<img src="${v.image}" onclick="showImage('${v.image}')" class="proof-img" style="max-height: 100px; margin-top: 12px;">` : '';

        div.style.borderLeft = `4px solid ${borderColor}`;
        div.innerHTML = `
                    <div class="flex-between" style="margin-bottom:6px;">
                        <span style="font-size:0.8rem; color:var(--text-muted);">🕒 ${v.date}</span>
                        <span style="font-size:0.8rem; color:var(--text-muted);">Amount: <strong style="color:var(--danger);">- SAR ${parseFloat(v.amount).toLocaleString()}</strong></span>
                    </div>
                    <div style="font-weight:700; font-size:1rem; color:var(--text-main);">${v.reason}</div>
                    ${statusHtml}
                    ${imgHtml}
                `;
        list.appendChild(div);
    });
}

function renderBranches() {
    const list = document.getElementById('branches-list'); 
    const select = document.getElementById('w-branch');
    const editSelect = document.getElementById('ops-edit-branch');
    list.innerHTML = ''; 
    select.innerHTML = '';
    if (editSelect) editSelect.innerHTML = '';
    getCompanyData().branches.forEach(branch => {
        const li = document.createElement('li'); li.className = 'flex-between list-item';
        li.innerHTML = `<span style="font-weight: 500; color: var(--text-main);">${branch}</span> <button class="btn-outline-danger admin-only" style="padding: 4px 10px; font-size: 0.75rem;" onclick="deleteBranch('${branch}')">Remove</button>`;
        list.appendChild(li);
        const option = document.createElement('option'); option.value = branch; option.textContent = branch; select.appendChild(option);
        
        if (editSelect) {
            const editOption = document.createElement('option');
            editOption.value = branch;
            editOption.textContent = branch;
            editSelect.appendChild(editOption);
        }
    });
}

function populateWorkerDropdowns() {
    const opsSelect = document.getElementById('ops-worker-select'); const opsVal = opsSelect.value;
    const finSelect = document.getElementById('fin-worker-select'); const finVal = finSelect.value;
    const taskSelect = document.getElementById('task-worker-select'); const taskVal = taskSelect ? taskSelect.value : '';
    const permSelect = document.getElementById('perm-worker-select'); const permVal = permSelect ? permSelect.value : '';
    const sysSelect = document.getElementById('sys-viol-worker-select'); const sysVal = sysSelect ? sysSelect.value : '';
    const attSelect = document.getElementById('attendance-overtime-worker-select'); const attVal = attSelect ? attSelect.value : '';
    const vacSelect = document.getElementById('vacation-worker-select'); const vacVal = vacSelect ? vacSelect.value : '';

    if (opsSelect) opsSelect.innerHTML = `<option value="">${t('opt-choose-employee')}</option>`;
    if (finSelect) finSelect.innerHTML = `<option value="">${t('opt-choose-employee')}</option>`;
    if (taskSelect) taskSelect.innerHTML = `<option value="">${t('opt-choose-employee')}</option>`;
    if (permSelect) permSelect.innerHTML = `<option value="">${t('opt-choose-employee')}</option>`;
    if (sysSelect) sysSelect.innerHTML = `<option value="">-- Choose Worker --</option>`;
    if (attSelect) attSelect.innerHTML = `<option value="">${t('opt-choose-employee')}</option>`;
    if (vacSelect) vacSelect.innerHTML = `<option value="">${t('opt-choose-employee')}</option>`;

    getCompanyData().workers.forEach(worker => {
        if (opsSelect) opsSelect.appendChild(new Option(worker.name, worker.id));
        if (finSelect) finSelect.appendChild(new Option(worker.name, worker.id));
        if (taskSelect) taskSelect.appendChild(new Option(worker.name, worker.id));
        if (permSelect) permSelect.appendChild(new Option(worker.name, worker.id));
        if (sysSelect) sysSelect.appendChild(new Option(worker.name, worker.id));
        if (attSelect) attSelect.appendChild(new Option(worker.name, worker.id));
        if (vacSelect) vacSelect.appendChild(new Option(worker.name, worker.id));
    });

    if (opsSelect) opsSelect.value = opsVal;
    if (finSelect) finSelect.value = finVal;
    if (taskSelect) taskSelect.value = taskVal;
    if (permSelect) permSelect.value = permVal;
    if (sysSelect) sysSelect.value = sysVal;
    if (attSelect) attSelect.value = attVal;
    if (vacSelect) vacSelect.value = vacVal;
}

// OPERATIONS TAB RENDERING
function renderOpsWorkersTable() {
    const tbody = document.querySelector('#ops-workers-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const isAdmin = currentUser && currentUser.role === 'admin';

    const workersToRender = getVisibleWorkers();

    if (workersToRender.length === 0 && !isAdmin) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">${t('msg-account-not-linked')}</td></tr>`;
        return;
    }

    workersToRender.forEach(worker => {
        const avg = getAveragePerfection(getLogsForMonth(worker, currentGlobalMonth));

        const isAr = currentAppLang === 'ar';
        const shiftLabel = isAr ? 'المناوبة' : 'Shift';
        const shiftStr = (worker.startTime && worker.endTime) ? `🕒 ${shiftLabel}: ${worker.startTime} - ${worker.endTime}` : '';
        const shiftSpan = shiftStr ? `<br><span style="font-size:0.75rem; color:var(--text-muted); display:inline-block; margin-top:4px;">${shiftStr}</span>` : '';

        const tr = document.createElement('tr');
        let html = `
                    <td>
                        <strong style="color:var(--text-main);">${worker.name}</strong><br>
                        <span class="badge" style="margin-left:0;margin-top:6px;">${worker.role || t('label-staff')}</span>
                        ${shiftSpan}
                    </td>
                    <td><span class="badge" style="background: var(--primary); margin:0;">${avg}</span></td>`;
        if (isAdmin) {
            html += `
                    <td class="admin-only">
                        <button class="btn-outline-danger" style="padding:6px 12px;font-size:0.8rem;" onclick="deleteWorker('${worker.id}')">${t('btn-delete-worker')}</button>
                    </td>`;
        }
        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
}

function renderOpsDetails() {
    const isAr = currentAppLang === 'ar';
    const workerId = document.getElementById('ops-worker-select').value;
    const area = document.getElementById('ops-management-area'); const hist = document.getElementById('worker-logs-history');
    const isAdmin = currentUser && currentUser.role === 'admin';

    if (!workerId) { if (area) area.style.display = 'none'; return; }
    if (area) area.style.display = 'block';
    if (hist) hist.innerHTML = '';

    const worker = getCompanyData().workers.find(w => w.id === workerId);
    if (!worker) return;

    // Populate profile inputs
    const editName = document.getElementById('ops-edit-name');
    const editRole = document.getElementById('ops-edit-role');
    const editSalary = document.getElementById('ops-edit-salary');
    const editBranch = document.getElementById('ops-edit-branch');
    if (editName) editName.value = worker.name || '';
    if (editRole) editRole.value = worker.role || '';
    if (editSalary) editSalary.value = worker.income || 0;
    if (editBranch) editBranch.value = worker.branch || '';

    // Render shifts list
    const shiftsList = document.getElementById('ops-worker-shifts-list');
    if (shiftsList) {
        shiftsList.innerHTML = '';
        const shifts = worker.shifts || [];
        if (shifts.length === 0) {
            shiftsList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">No shifts added. Add a shift below.</p>`;
        } else {
            shifts.forEach(s => {
                const div = document.createElement('div');
                div.className = 'flex-between list-item';
                div.style.cssText = 'background:var(--input-bg); padding:10px; border-radius:8px; border:1px solid var(--border-color);';
                
                let statusText = '';
                if (s.dayOfWeek) {
                    statusText = `<span class="badge" style="background:#f59e0b; color:white; margin:0;">${isAr ? translateDynamicTerm(s.dayOfWeek) : 'Override: ' + s.dayOfWeek}</span>`;
                } else if (s.specificDate) {
                    statusText = `<span class="badge" style="background:#f59e0b; color:white; margin:0;">${isAr ? s.specificDate : 'Override: ' + s.specificDate}</span>`;
                } else {
                    statusText = s.active ? `<span class="badge badge-good" style="margin:0;">Active</span>` : `<button onclick="activateWorkerShift('${s.id}')" class="btn-outline-info" style="padding:4px 8px; font-size:0.75rem;">Activate</button>`;
                }
                let delBtn = `<button onclick="deleteWorkerShift('${s.id}')" class="btn-outline-danger" style="padding:4px 8px; font-size:0.75rem; border:none; text-decoration:underline;">Delete</button>`;
                
                div.innerHTML = `
                    <div>
                        <strong style="color:var(--text-main);">🕒 ${s.startTime} - ${s.endTime}</strong>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        ${statusText}
                        ${delBtn}
                    </div>
                `;
                shiftsList.appendChild(div);
            });
        }
    }

    // Calculate duration & hourly rate
    const durationEl = document.getElementById('ops-ov-shift-duration');
    const hourlyRateEl = document.getElementById('ops-ov-hourly-rate');
    const duration = getShiftDurationHours(worker.startTime, worker.endTime);
    const baseIncome = parseFloat(worker.income) || 0;
    const hourlyRate = baseIncome / (30 * duration);
    
    if (durationEl) durationEl.textContent = `${duration.toFixed(1)} hrs`;
    if (hourlyRateEl) hourlyRateEl.textContent = `SAR ${hourlyRate.toFixed(2)}/hr`;

    // Render overtime log history
    const overtimeHistList = document.getElementById('ops-worker-overtime-history');
    if (overtimeHistList) {
        overtimeHistList.innerHTML = '';
        const stats = getMonthlyStats(worker, currentGlobalMonth);
        const overtimeList = stats.overtimeList || [];
        if (overtimeList.length === 0) {
            overtimeHistList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">No overtime hours logged this month.</p>`;
        } else {
            overtimeList.forEach(o => {
                const div = document.createElement('div');
                div.className = 'flex-between list-item';
                div.style.cssText = 'background:var(--input-bg); padding:10px; border-radius:8px; border:1px solid var(--border-color);';
                
                div.innerHTML = `
                    <div>
                        <strong style="color:var(--text-main);">🕒 ${o.hours} hr (x${o.multiplier})</strong><br>
                        <span style="font-size:0.75rem; color:var(--text-muted);">Rate: SAR ${o.rate}/hr • Date: ${o.date}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-weight:700; color:#f59e0b;">+ SAR ${o.amount}</span>
                        <button onclick="deleteOvertimeHour('${o.id}')" class="btn-outline-danger" style="padding:4px 8px; font-size:0.75rem; border:none; text-decoration:underline;">Undo</button>
                    </div>
                `;
                overtimeHistList.appendChild(div);
            });
        }
    }

    let displayLogs = getLogsForMonth(worker, currentGlobalMonth);

    if (displayLogs.length === 0) { if (hist) hist.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:24px;background:var(--input-bg);border-radius:var(--radius-md);">${t('msg-no-logs-month')}</p>`; return; }

    displayLogs.forEach(log => {
        const div = document.createElement('div'); div.className = 'log-entry';

        let typeBadge = '';
        if (log.noteType === 'vacation' || log.score === 'vacation') {
            typeBadge = `<span class="badge" style="background:var(--warning); color:var(--text-main);">${t('badge-vacation')}</span>`;
        } else if (log.noteType === 'good' || log.score == 100) {
            typeBadge = `<span class="badge badge-good">${t('badge-good-note')}</span>`;
        } else {
            typeBadge = `<span class="badge badge-bad">${t('badge-bad-note')}</span>`;
        }

        let delBtn = isAdmin ? `<button class="btn-outline-danger admin-only" style="padding:4px 8px;font-size:0.75rem;border:none;text-decoration:underline;" onclick="deleteLog('${worker.id}', '${log.date}')">${t('btn-delete')}</button>` : '';
        div.innerHTML = `
                    <div class="flex-between log-date"><strong style="color:var(--text-main);">📅 ${log.date}</strong><div style="display:flex;align-items:center;gap:8px;">${typeBadge} ${delBtn}</div></div>
                    <div class="log-note-text">${log.note ? log.note : `<em style="color:var(--text-muted);">${t('msg-no-manual-notes')}</em>`}</div>`;
        if (hist) hist.appendChild(div);
    });
}

// FINANCIAL TAB RENDERING
function renderFinanceTable() {
    const tbody = document.querySelector('#finance-workers-table');
    if (!tbody) return;
    tbody.querySelector('tbody').innerHTML = '';

    const workersToRender = getVisibleWorkers();

    if (workersToRender.length === 0 && (!currentUser || currentUser.role !== 'admin')) {
        tbody.querySelector('tbody').innerHTML = `<tr><td colspan="5" style="text-align:center;">Your account is not linked to any worker profile yet.</td></tr>`;
        return;
    }

    workersToRender.forEach(worker => {
        const stats = getMonthlyStats(worker, currentGlobalMonth);
        const base = parseFloat(worker.income || 0);
        const rew = calculateRewardsTotal(stats.rewardsList);
        const viol = calculateViolationsTotal(stats.violationsList);
        const paidThisMonth = calculatePaymentsTotal(stats.paymentsList);

        // UI display for Net reflects the subtraction of the advance payment, system violations, and late deductions
        const sysViolDeduction = typeof getSystemViolationDeductionsForMonth === 'function' ? getSystemViolationDeductionsForMonth(worker, currentGlobalMonth) : 0;
        const lateDeduction = typeof getLateDeductionsForMonth === 'function' ? getLateDeductionsForMonth(worker, currentGlobalMonth) : 0;
        const volumeReward = typeof getDriverVolumeRewardsForMonth === 'function' ? getDriverVolumeRewardsForMonth(worker, currentGlobalMonth) : 0;
        const ov = calculateOvertimeTotal(stats.overtimeList);
        const net = base + rew + volumeReward + ov - viol - paidThisMonth - sysViolDeduction - lateDeduction;

        const remainingAllTime = getCumulativeBalance(worker, currentGlobalMonth);
        const detailsId = `net-details-${worker.id}`;

        const tr = document.createElement('tr');
        const isAr = currentAppLang === 'ar';
        let sysViolHtml = '';
        if (sysViolDeduction > 0) {
            sysViolHtml = `<div class="breakdown-row" style="color:var(--danger);"><span>${isAr ? 'المخالفات النظامية:' : 'System Violations:'}</span> <span>- SAR ${sysViolDeduction.toLocaleString()}</span></div>`;
        }
        let lateHtml = '';
        if (lateDeduction > 0) {
            lateHtml = `<div class="breakdown-row" style="color:var(--danger);"><span>${isAr ? 'خصومات التأخير:' : 'Late Penalties:'}</span> <span>- SAR ${lateDeduction.toLocaleString()}</span></div>`;
        }
        let volumeRewardHtml = '';
        if (volumeReward > 0) {
            volumeRewardHtml = `<div class="breakdown-row" style="color:var(--success);"><span>${isAr ? 'مكافآت التوصيل:' : 'Volume Rewards:'}</span> <span>+ SAR ${volumeReward.toLocaleString()}</span></div>`;
        }
        let overtimeHtml = '';
        if (ov > 0) {
            overtimeHtml = `<div class="breakdown-row" style="color:#f59e0b;"><span>${isAr ? 'العمل الإضافي:' : 'Overtime:'}</span> <span>+ SAR ${ov.toLocaleString()}</span></div>`;
        }
        tr.innerHTML = `
                    <td><strong style="color:var(--text-main);">${worker.name}</strong><br><span class="text-muted-heavy">${worker.branch}</span></td>
                    <td>SAR ${base.toLocaleString()}</td>
                    <td style="font-weight:600; color:var(--text-main);">
                        <div style="display:flex; align-items:center; gap:8px; cursor:pointer;" onclick="toggleDetails('${detailsId}')">
                            SAR ${net.toLocaleString()}
                            <span style="font-size:0.7rem; color:var(--primary);">▼</span>
                        </div>
                        <div class="breakdown-details" id="${detailsId}">
                            <div class="breakdown-row" style="color:var(--text-main);"><span>${isAr ? 'الأساسي:' : 'Base:'}</span> <span>SAR ${base.toLocaleString()}</span></div>
                            <div class="breakdown-row" style="color:var(--success);"><span>${isAr ? 'المكافآت:' : 'Rewards:'}</span> <span>+ SAR ${rew.toLocaleString()}</span></div>
                            ${volumeRewardHtml}
                            ${overtimeHtml}
                            <div class="breakdown-row" style="color:var(--danger);"><span>${isAr ? 'المخالفات:' : 'Violations:'}</span> <span>- SAR ${viol.toLocaleString()}</span></div>
                            ${sysViolHtml}
                            ${lateHtml}
                            <div class="breakdown-row" style="color:var(--info);"><span>${isAr ? 'سلف مدفوعة:' : 'Paid Advance:'}</span> <span>- SAR ${paidThisMonth.toLocaleString()}</span></div>
                        </div>
                    </td>
                    <td class="text-info">SAR ${paidThisMonth.toLocaleString()}</td>
                    <td style="font-weight:700; color:var(--primary); font-size:1.05rem;">SAR ${remainingAllTime.toLocaleString()}</td>
                `;
        tbody.querySelector('tbody').appendChild(tr);
    });
}

function renderFinDetails() {
    const workerId = document.getElementById('fin-worker-select').value;
    const area = document.getElementById('fin-management-area');
    const vHistList = document.getElementById('violations-history-list');
    const pHistList = document.getElementById('payments-history-list');
    const rHistList = document.getElementById('rewards-history-list');
    const cHistList = document.getElementById('custody-history-list');
    const isAdmin = currentUser && currentUser.role === 'admin';
    const isFinAdmin = currentUser && (currentUser.role === 'admin' || document.body.classList.contains('perm-finance'));
    const isAr = currentAppLang === 'ar';

    if (!workerId) { if (area) area.style.display = 'none'; return; }
    if (area) area.style.display = 'block';
    if (vHistList) vHistList.innerHTML = '';
    if (pHistList) pHistList.innerHTML = '';
    if (rHistList) rHistList.innerHTML = '';
    if (cHistList) cHistList.innerHTML = '';

    const worker = getCompanyData().workers.find(w => w.id === workerId);
    if (!worker) return;
    const stats = getMonthlyStats(worker, currentGlobalMonth);
    const base = parseFloat(worker.income || 0);
    const totalRewards = calculateRewardsTotal(stats.rewardsList);
    const totalViolations = calculateViolationsTotal(stats.violationsList);
    const totalCustody = calculateCustodyTotal(stats.custodyList);
    const paidThisMonth = calculatePaymentsTotal(stats.paymentsList);
    const totalOvertime = calculateOvertimeTotal(stats.overtimeList);

    // UI display for Net reflects the subtraction of the advance payment, system violations, and late penalties
    const sysViolDeduction = typeof getSystemViolationDeductionsForMonth === 'function' ? getSystemViolationDeductionsForMonth(worker, currentGlobalMonth) : 0;
    const lateDeduction = typeof getLateDeductionsForMonth === 'function' ? getLateDeductionsForMonth(worker, currentGlobalMonth) : 0;
    const volumeReward = typeof getDriverVolumeRewardsForMonth === 'function' ? getDriverVolumeRewardsForMonth(worker, currentGlobalMonth) : 0;
    const net = base + totalRewards + volumeReward + totalOvertime - totalViolations - paidThisMonth - sysViolDeduction - lateDeduction;

    const allTimeRemaining = getCumulativeBalance(worker, currentGlobalMonth);

    document.getElementById('fin-display-total-due').textContent = allTimeRemaining.toLocaleString();
    document.getElementById('fin-display-base').textContent = base.toLocaleString();
    document.getElementById('fin-display-net').textContent = net.toLocaleString();
    document.getElementById('fin-display-summary-custody').textContent = totalCustody.toLocaleString();
    document.getElementById('fin-display-custody').textContent = totalCustody.toLocaleString();
    document.getElementById('fin-display-total-viol').textContent = totalViolations.toLocaleString();
    
    const displayOvertime = document.getElementById('fin-display-overtime');
    if (displayOvertime) displayOvertime.textContent = totalOvertime.toLocaleString();

    const displayOvertimeEarned = document.getElementById('fin-display-overtime-earned');
    if (displayOvertimeEarned) displayOvertimeEarned.textContent = totalOvertime.toLocaleString();

    // Render Overtime History list
    const finOvertimeList = document.getElementById('fin-overtime-history-list');
    if (finOvertimeList) {
        finOvertimeList.innerHTML = '';
        const overtimeList = stats.overtimeList || [];
        if (overtimeList.length === 0) {
            finOvertimeList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">No overtime hours logged this month.</p>`;
        } else {
            overtimeList.forEach(o => {
                const oDiv = document.createElement('div');
                oDiv.className = 'ledger-card flex-between';
                let delBtn = isFinAdmin ? `<button onclick="deleteOvertimeHourFromFin('${worker.id}', '${o.id}')" class="btn-outline-danger" style="padding: 4px 10px; font-size: 0.75rem;">Undo</button>` : '';
                oDiv.innerHTML = `
                            <div>
                                <strong style="color:#f59e0b;">+ SAR ${o.amount}</strong><br>
                                <span style="font-size: 0.75rem; color: var(--text-muted);">${o.hours} hr (x${o.multiplier}) • ${o.date}</span>
                            </div>
                            ${delBtn}
                        `;
                finOvertimeList.appendChild(oDiv);
            });
        }
    }

    document.getElementById('initial-balance-amount').value = worker.initialBalance || 0;

    // Render Payment History
    if (!stats.paymentsList || stats.paymentsList.length === 0) {
        if (pHistList) pHistList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">No payments recorded this month.</p>`;
    } else {
        stats.paymentsList.forEach(p => {
            const pDiv = document.createElement('div');
            pDiv.className = 'ledger-card flex-between';
            let delBtn = isFinAdmin ? `<button onclick="deletePaymentRecord('${worker.id}', '${p.id}')" class="btn-outline-danger" style="padding: 4px 10px; font-size: 0.75rem;">Undo</button>` : '';
            pDiv.innerHTML = `
                        <div>
                            <strong class="text-info">+ SAR ${p.amount}</strong><br>
                            <span style="font-size: 0.75rem; color: var(--text-muted);">🕒 ${p.date}</span>
                        </div>
                        ${delBtn}
                    `;
            if (pHistList) pHistList.appendChild(pDiv);
        });
    }

    // Render Reward History
    const noRewards = (!stats.rewardsList || stats.rewardsList.length === 0);
    const volumeRewardVal = typeof getDriverVolumeRewardsForMonth === 'function' ? getDriverVolumeRewardsForMonth(worker, currentGlobalMonth) : 0;
    if (noRewards && volumeRewardVal === 0) {
        if (rHistList) rHistList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">No rewards recorded this month.</p>`;
    } else {
        if (rHistList) rHistList.innerHTML = '';
        if (volumeRewardVal > 0) {
            const rDiv = document.createElement('div');
            rDiv.className = 'ledger-card flex-between';
            rDiv.style.borderLeft = '4px solid var(--success)';
            rDiv.innerHTML = `
                <div>
                    <strong class="text-success">+ SAR ${volumeRewardVal.toLocaleString()}</strong><br>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${isAr ? 'مكافآت عدد التوصيلات اليومية' : 'Auto Daily Order Volume Rewards'}</span>
                </div>
            `;
            if (rHistList) rHistList.appendChild(rDiv);
        }
        if (!noRewards) {
            stats.rewardsList.forEach(r => {
                const rDiv = document.createElement('div');
                rDiv.className = 'ledger-card flex-between';
                let delBtn = isFinAdmin ? `<button onclick="deleteRewardRecord('${worker.id}', '${r.id}')" class="btn-outline-danger" style="padding: 4px 10px; font-size: 0.75rem;">Undo</button>` : '';
                rDiv.innerHTML = `
                            <div>
                                <strong class="text-success">+ SAR ${r.amount}</strong><br>
                                <span style="font-size: 0.75rem; color: var(--text-muted);">🕒 ${r.date}</span>
                            </div>
                            ${delBtn}
                        `;
                if (rHistList) rHistList.appendChild(rDiv);
            });
        }
    }

    // Render Custody History
    if (!stats.custodyList || stats.custodyList.length === 0) {
        if (cHistList) cHistList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">No custody recorded this month.</p>`;
    } else {
        stats.custodyList.forEach(c => {
            const cDiv = document.createElement('div');
            cDiv.className = 'ledger-card flex-between';
            let delBtn = isFinAdmin ? `<button onclick="deleteCustodyRecord('${worker.id}', '${c.id}')" class="btn-outline-danger" style="padding: 4px 10px; font-size: 0.75rem;">Undo</button>` : '';

            let textHtml = '';
            if (c.type === 'given') {
                textHtml = `<strong class="text-warning">Given: SAR ${c.amount}</strong>`;
            } else {
                textHtml = `<strong class="text-success">Returned: SAR ${c.amount}</strong>`;
            }

            cDiv.innerHTML = `
                        <div>
                            ${textHtml}<br>
                            <span style="font-size: 0.75rem; color: var(--text-muted);">🕒 ${c.date}</span>
                        </div>
                        ${delBtn}
                    `;
            if (cHistList) cHistList.appendChild(cDiv);
        });
    }

    // Render Detailed Violations
    const noViolations = (!stats.violationsList || stats.violationsList.length === 0);

    if (vHistList) {
        vHistList.innerHTML = '';

        // 1. Auto Late Penalties
        if (lateDeduction > 0) {
            const vDiv = document.createElement('div');
            vDiv.className = 'ledger-card';
            vDiv.style.borderLeft = '4px solid var(--danger)';
            vDiv.style.marginBottom = '8px';
            vDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong class="text-danger">${isAr ? 'خصم تأخير تلقائي' : 'Auto Late Penalties'}</strong><br>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${isAr ? 'مستقطع من سجلات حضور هذا الشهر' : 'Deducted from attendance records of this month'}</span>
                    </div>
                    <strong style="color:var(--danger); font-size:1rem;">- SAR ${lateDeduction.toLocaleString()}</strong>
                </div>
            `;
            vHistList.appendChild(vDiv);
        }

        // 2. System Violations Deduction
        if (sysViolDeduction > 0) {
            const vDiv = document.createElement('div');
            vDiv.className = 'ledger-card';
            vDiv.style.borderLeft = '4px solid var(--danger)';
            vDiv.style.marginBottom = '8px';
            vDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong class="text-danger">${isAr ? 'خصم المخالفات النظامية' : 'System Violations Deduction'}</strong><br>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${isAr ? 'خصم تلقائي حسب مستوى المخالفة' : 'Deducted automatically based on violation level'}</span>
                    </div>
                    <strong style="color:var(--danger); font-size:1rem;">- SAR ${sysViolDeduction.toLocaleString()}</strong>
                </div>
            `;
            vHistList.appendChild(vDiv);
        }

        // 3. Regular Violations
        if (noViolations) {
            if (lateDeduction === 0 && sysViolDeduction === 0) {
                vHistList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">No violations recorded this month.</p>`;
            }
        } else {
            stats.violationsList.forEach(v => {
                const vDiv = document.createElement('div');
                vDiv.className = 'ledger-card';
                vDiv.style.borderLeft = '4px solid var(--danger)';
                vDiv.style.marginBottom = '8px';

                let imgHtml = v.image ? `<img src="${v.image}" onclick="showImage('${v.image}')" class="proof-img" style="max-height: 80px; display: block; margin-top: 10px;">` : '';
                let statusHtml = ''; let actionBtns = ''; let isApplied = false;

                if (v.status === 'waived') {
                    statusHtml = `<span class="text-success" style="font-size: 0.8rem;">${t('label-fixed-waived')}</span>`;
                } else if (v.status === 'active' || !v.status) {
                    statusHtml = `<span class="text-danger" style="font-size: 0.8rem;">${t('label-penalty-applied')}${v.amount}</span>`;
                    isApplied = true;
                } else if (v.status === 'pending') {
                    const deadline = v.timestamp + (v.graceDays * 86400000);
                    const timeLeft = deadline - Date.now();
                    if (timeLeft <= 0) {
                        statusHtml = `<span class="text-danger" style="font-size: 0.8rem;">${t('label-time-expired')}${v.amount})</span>`;
                        isApplied = true;
                    } else {
                        const h = Math.floor(timeLeft / 3600000).toString().padStart(2, '0');
                        const m = Math.floor((timeLeft % 3600000) / 60000).toString().padStart(2, '0');
                        const s = Math.floor((timeLeft % 60000) / 1000).toString().padStart(2, '0');
                        statusHtml = `<span class="viol-timer text-warning" data-deadline="${deadline}" style="font-size: 0.8rem;">${t('label-fix-within')}${h}h ${m}m ${s}s</span>`;
                        if (isFinAdmin) {
                            actionBtns = `
                                    <button onclick="resolveViolation('${worker.id}', '${v.id}', 'waive')" class="btn-success" style="padding: 6px 12px; font-size: 0.75rem; margin-right: 4px;">${t('btn-fixed-waive')}</button>
                                    <button onclick="resolveViolation('${worker.id}', '${v.id}', 'apply')" class="btn-danger" style="padding: 6px 12px; font-size: 0.75rem;">${t('btn-not-fixed-apply')}</button>
                                `;
                        }
                    }
                }

                let delBtn = isFinAdmin ? `<button onclick="deleteDetailedViolation('${worker.id}', '${v.id}')" class="btn-outline-danger" style="padding: 4px 8px; font-size: 0.75rem;">${t('btn-remove')}</button>` : '';

                vDiv.innerHTML = `
                        <div class="flex-between" style="margin-bottom: 8px;"><span style="font-size: 0.8rem; color: var(--text-muted);">🕒 ${v.date}</span>${delBtn}</div>
                        <div style="font-weight: 600; color: var(--text-main); margin-bottom: 12px; font-size:1.05rem;">${v.reason} <span style="color: ${isApplied ? 'var(--danger)' : 'var(--text-muted)'}; float: right; text-decoration: ${v.status === 'waived' ? 'line-through' : 'none'};">- SAR ${v.amount}</span></div>
                        <div class="flex-between" style="align-items: center; border-top:1px solid var(--border-color); padding-top:8px; margin-top:8px;"><div>${statusHtml}</div><div>${actionBtns}</div></div>${imgHtml}`;
                if (vHistList) vHistList.appendChild(vDiv);
            });
        }
    }
}

// SUMMARY TAB RENDERING
function renderSummaryTable() {
    const isAr = currentAppLang === 'ar';
    const container = document.getElementById('summary-cards-container');
    if (!container) return;
    container.innerHTML = '';

    const workersToRender = getVisibleWorkers();

    if (workersToRender.length === 0 && (!currentUser || currentUser.role !== 'admin')) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:1rem; padding: 40px;">${t('msg-not-linked')}</p>`;
        return;
    }

    workersToRender.forEach(worker => {
        const monthlyLogs = getLogsForMonth(worker, currentGlobalMonth);
        const avg = getAveragePerfection(monthlyLogs);
        const goodCount = monthlyLogs.filter(l => l.noteType === 'good' || l.score == 100).length;
        const badCount = monthlyLogs.filter(l => l.noteType === 'bad' || l.score == 2.5).length;
        const remainingAllTime = getCumulativeBalance(worker, currentGlobalMonth);

        const stats = getMonthlyStats(worker, currentGlobalMonth);
        const deliveries = (stats.deliveriesList ? stats.deliveriesList.length : 0) + (stats.legacyDeliveries || 0);
        const costs = parseFloat(stats.costs || 0);

        const base = parseFloat(worker.income || 0);
        const rew = calculateRewardsTotal(stats.rewardsList);
        const viol = calculateViolationsTotal(stats.violationsList);
        const sysViolDeduction = typeof getSystemViolationDeductionsForMonth === 'function' ? getSystemViolationDeductionsForMonth(worker, currentGlobalMonth) : 0;
        const lateDeduction = typeof getLateDeductionsForMonth === 'function' ? getLateDeductionsForMonth(worker, currentGlobalMonth) : 0;
        const volumeReward = typeof getDriverVolumeRewardsForMonth === 'function' ? getDriverVolumeRewardsForMonth(worker, currentGlobalMonth) : 0;
        const ov = calculateOvertimeTotal(stats.overtimeList);
        const netThisMonth = base + rew + volumeReward + ov - viol - sysViolDeduction - lateDeduction;
        const paidThisMonth = calculatePaymentsTotal(stats.paymentsList);

        // Calculate Monthly Attendance Stats
        const companyData = getCompanyData();
        const attendance = companyData.attendance || {};
        const graceMins = parseInt(companyData.lateGraceMinutes || 0);

        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;

        Object.keys(attendance).forEach(dateStr => {
            if (dateStr.startsWith(currentGlobalMonth)) {
                const dayMap = attendance[dateStr] || {};
                const att = dayMap[worker.id];
                if (att) {
                    if (att.status === 'present') {
                        presentCount++;
                        let shiftStart = worker.startTime;
                        const dateParts = dateStr.split('-');
                        const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const dayOfWeekName = dayNames[dateObj.getDay()];
                        const dateOverrideShift = (worker.shifts || []).find(s => s.dayOfWeek === dayOfWeekName || s.specificDate === dateStr);
                        if (dateOverrideShift) {
                            shiftStart = dateOverrideShift.startTime;
                        }
                        if (att.time && shiftStart) {
                            const [sH, sM] = shiftStart.split(':').map(Number);
                            const [cH, cM] = att.time.split(':').map(Number);
                            if (!isNaN(sH) && !isNaN(cH)) {
                                const startMins = sH * 60 + (sM || 0);
                                const checkMins = cH * 60 + (cM || 0);
                                const diff = checkMins - startMins;
                                const rules = companyData.lateRules || [];
                                let isLate = false;
                                if (rules.length === 0) {
                                    if (diff > graceMins) isLate = true;
                                } else {
                                    const minMins = Math.min(...rules.map(r => r.mins));
                                    if (diff >= minMins) isLate = true;
                                }
                                if (isLate) {
                                    lateCount++;
                                }
                            }
                        }
                    } else if (att.status === 'absent') {
                        absentCount++;
                    }
                }
            }
        });

        // Count Tasks Done in Current Month
        const monthAbbr = new Date(currentGlobalMonth + '-01').toLocaleString('en-US', { month: 'short' });
        const tasksDoneThisMonth = (worker.jobs || []).filter(j => {
            if (!j.done && j.status !== 'completed') return false;
            if (j.completedAt) {
                const d = new Date(j.completedAt);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === currentGlobalMonth;
            }
            return j.date && j.date.startsWith(monthAbbr);
        }).length;

        // Build violations cell
        let violCellHtml = '';
        const violList = stats.violationsList || [];
        if (violList.length === 0) {
            violCellHtml = `<div style="color:var(--success); font-size:0.9rem; font-weight:600; padding: 12px; background:var(--success-bg); border-radius:8px; border:1px solid var(--success-border); text-align:center;">✅ No violations recorded this month.</div>`;
        } else {
            violList.forEach(v => {
                let badge = '';
                if (v.status === 'waived') {
                    badge = `<div style="margin-bottom:8px; padding:10px 12px; background:var(--success-bg); border:1px solid var(--success-border); border-radius:8px; font-size:0.85rem;">
                                <div style="font-weight:600; color:var(--text-main); margin-bottom:4px;">✅ ${v.reason}</div>
                                <div style="color:var(--success);">Fixed – Waived ✔</div>
                            </div>`;
                } else if (v.status === 'active' || !v.status) {
                    badge = `<div style="margin-bottom:8px; padding:10px 12px; background:var(--danger-bg); border:1px solid var(--danger-border); border-radius:8px; font-size:0.85rem;">
                                <div style="font-weight:600; color:var(--text-main); margin-bottom:4px;">🚨 ${v.reason}</div>
                                <div style="color:var(--danger); font-weight:500;">Penalty Applied – SAR ${parseFloat(v.amount).toLocaleString()}</div>
                            </div>`;
                } else if (v.status === 'pending') {
                    const deadline = v.timestamp + (v.graceDays * 86400000);
                    const timeLeft = deadline - Date.now();
                    if (timeLeft <= 0) {
                        badge = `<div style="margin-bottom:8px; padding:10px 12px; background:var(--danger-bg); border:1px solid var(--danger-border); border-radius:8px; font-size:0.85rem;">
                                    <div style="font-weight:600; color:var(--text-main); margin-bottom:4px;">🚨 ${v.reason}</div>
                                    <div style="color:var(--danger); font-weight:500;">Time Expired – Penalty Applied (SAR ${parseFloat(v.amount).toLocaleString()})</div>
                                </div>`;
                    } else {
                        const totalHours = Math.floor(timeLeft / 3600000);
                        const daysLeft = Math.floor(totalHours / 24);
                        const hoursLeft = totalHours % 24;
                        const minsLeft = Math.floor((timeLeft % 3600000) / 60000);
                        let timeStr = '';
                        if (daysLeft > 0) timeStr = `${daysLeft}d ${hoursLeft}h left`;
                        else if (hoursLeft > 0) timeStr = `${hoursLeft}h ${minsLeft}m left`;
                        else timeStr = `${minsLeft}m left`;
                        badge = `<div style="margin-bottom:8px; padding:10px 12px; background:var(--warning-bg); border:1px solid var(--warning-border); border-radius:8px; font-size:0.85rem;">
                                    <div style="font-weight:600; color:var(--text-main); margin-bottom:4px;">⚠️ ${v.reason}</div>
                                    <div style="color:var(--warning); font-weight:600;">⏳ Fix within: ${timeStr}</div>
                                    <div style="color:var(--text-muted); font-size:0.75rem; margin-top:2px;">Penalty if not fixed: SAR ${parseFloat(v.amount).toLocaleString()}</div>
                                </div>`;
                    }
                }
                violCellHtml += badge;
            });
        }

        // System violations block
        const sysViolList = worker.systemViolations || [];
        const sysViolLogs = typeof getSystemViolationLogsForMonth === 'function' ? getSystemViolationLogsForMonth(worker, currentGlobalMonth) : [];
        const sysViolCount = sysViolList.length;

        let sysViolHtml = '';
        if (sysViolCount > 0) {
            let logRows = '';
            sysViolLogs.forEach(l => {
                logRows += `<div style="font-size:0.8rem; color:var(--danger); margin-top:4px; font-weight:600;">
                    • ${l.text} ${l.amount > 0 ? `(- SAR ${l.amount})` : ''}
                </div>`;
            });
            sysViolHtml = `
                <div style="margin-top: 12px; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--input-bg);">
                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); display: flex; justify-content: space-between;">
                        <span>⚠️ System Violations</span>
                        <span class="badge badge-bad" style="margin: 0; font-size: 0.75rem; padding: 2px 6px;">${sysViolCount}/6</span>
                    </div>
                    ${logRows}
                </div>
            `;
        } else {
            sysViolHtml = `
                <div style="margin-top: 12px; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--input-bg);">
                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); display: flex; justify-content: space-between;">
                        <span>⚠️ System Violations</span>
                        <span class="badge" style="margin: 0; font-size: 0.75rem; padding: 2px 6px; background:var(--success); color:white;">0/6</span>
                    </div>
                </div>
            `;
        }

        // 1. Calculate Rewards List for Summary card
        const rewardsList = stats.rewardsList || [];
        let rewardsLogHtml = '';
        if (rewardsList.length === 0) {
            rewardsLogHtml = `<div style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:12px;">${isAr ? 'لا توجد مكافآت هذا الشهر.' : 'No rewards recorded this month.'}</div>`;
        } else {
            rewardsList.forEach(r => {
                const amt = parseFloat(r.amount || 0);
                rewardsLogHtml += `<div style="margin-bottom:8px; padding:10px 12px; background:var(--success-bg); border:1px solid var(--success-border); border-radius:8px; font-size:0.85rem;">
                    <div style="font-weight:600; color:var(--text-main); display:flex; justify-content:space-between;">
                        <span>🎁 ${r.reason || (isAr ? 'مكافأة' : 'Bonus')}</span>
                        <span style="color:var(--success);">+ SAR ${amt.toLocaleString()}</span>
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">📅 ${r.date}</div>
                </div>`;
            });
        }

        // 2. Calculate Custody Ledger for Summary card
        let custodyTaken = 0;
        let custodyReturned = 0;
        let custodyLogHtml = '';
        const custodyList = stats.custodyList || [];
        if (custodyList.length === 0) {
            custodyLogHtml = `<div style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:12px;">${isAr ? 'لا توجد عمليات عهدة.' : 'No custody transactions.'}</div>`;
        } else {
            custodyList.forEach(c => {
                const amt = parseFloat(c.amount || 0);
                if (c.type === 'given') {
                    custodyTaken += amt;
                    custodyLogHtml += `<div class="flex-between" style="font-size:0.85rem; margin-bottom:6px; border-bottom:1px dashed var(--border-color); padding-bottom:4px;">
                        <span>📥 ${isAr ? 'استلام عهدة:' : 'Taken:'} ${c.date}</span>
                        <span style="color:#f59e0b; font-weight:700;">+ SAR ${amt.toLocaleString()}</span>
                    </div>`;
                } else {
                    custodyReturned += amt;
                    custodyLogHtml += `<div class="flex-between" style="font-size:0.85rem; margin-bottom:6px; border-bottom:1px dashed var(--border-color); padding-bottom:4px;">
                        <span>📤 ${isAr ? 'إرجاع عهدة:' : 'Returned:'} ${c.date}</span>
                        <span style="color:var(--success); font-weight:700;">- SAR ${amt.toLocaleString()}</span>
                    </div>`;
                }
            });
        }
        const outstandingCustody = custodyTaken - custodyReturned;
        const custodyStatusHtml = outstandingCustody > 0 
            ? `<div style="color:#b45309; font-weight:700; font-size:0.85rem; text-align:center; background:#fffbeb; border:1px solid #fef3c7; padding:6px; border-radius:6px; margin-bottom:12px;">⏳ ${isAr ? 'مستحق الإرجاع:' : 'Outstanding to Return:'} SAR ${outstandingCustody.toLocaleString()}</div>`
            : `<div style="color:var(--success); font-weight:700; font-size:0.85rem; text-align:center; background:var(--success-bg); border:1px solid var(--success-border); padding:6px; border-radius:6px; margin-bottom:12px;">✅ ${isAr ? 'تمت إعادة الجميع' : 'All Returned'}</div>`;

        const card = document.createElement('div');
        card.className = 'summary-worker-card';
        card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:20px; border-bottom:1px solid var(--border-color); padding-bottom:15px;">
                        <div>
                            <div style="font-size:1.3rem; font-weight:700; color:var(--text-main); margin-bottom:6px;">${worker.name}</div>
                            <div style="font-size:0.9rem; color:var(--text-muted); display:flex; align-items:center; gap:8px;">
                                ${worker.branch} <span class="rank-badge rank-${worker.rank}" style="margin:0;">${worker.rank}</span>
                            </div>
                            ${sysViolHtml}
                        </div>
                        <div style="text-align:right; background:var(--input-bg); padding:12px 16px; border-radius:8px; border:1px solid var(--border-color);">
                            <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; font-weight:600; letter-spacing:0.5px; margin-bottom:4px;">${t('th-total-remaining')}</div>
                            <div style="font-size:1.4rem; font-weight:800; color:var(--primary);">SAR ${remainingAllTime.toLocaleString()}</div>
                        </div>
                    </div>

                    <div class="stats-grid" style="margin-bottom:20px;">
                        <div style="background:var(--input-bg); padding:16px 12px; border-radius:8px; text-align:center; border:1px solid var(--border-color);">
                            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px; font-weight:500;">${t('label-good-notes')}</div>
                            <div style="font-size:1.4rem; font-weight:700; color:var(--success); line-height:1;">${goodCount}</div>
                        </div>
                        <div style="background:var(--input-bg); padding:16px 12px; border-radius:8px; text-align:center; border:1px solid var(--border-color);">
                            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px; font-weight:500;">${t('label-bad-notes')}</div>
                            <div style="font-size:1.4rem; font-weight:700; color:var(--danger); line-height:1;">${badCount}</div>
                        </div>
                        <div style="background:var(--input-bg); padding:16px 12px; border-radius:8px; text-align:center; border:1px solid var(--border-color);">
                            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px; font-weight:500;">${t('label-deliveries-sm')}</div>
                            <div style="font-size:1.4rem; font-weight:700; color:var(--warning); line-height:1;">${deliveries}</div>
                        </div>
                        <div style="background:var(--input-bg); padding:16px 12px; border-radius:8px; text-align:center; border:1px solid var(--border-color);">
                            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px; font-weight:500;">${t('label-tasks-done')}</div>
                            <div style="font-size:1.4rem; font-weight:700; color:var(--primary); line-height:1;">${tasksDoneThisMonth}</div>
                        </div>
                        <div style="background:var(--input-bg); padding:16px 12px; border-radius:8px; text-align:center; border:1px solid var(--border-color);">
                            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px; font-weight:500;">${t('label-avg-perf')}</div>
                            <div style="font-size:1.4rem; font-weight:700; color:var(--text-main); line-height:1;">${avg}</div>
                        </div>
                        <div style="background:var(--input-bg); padding:12px 12px; border-radius:8px; text-align:center; border:1px solid var(--border-color); display:flex; flex-direction:column; justify-content:center;">
                            <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; font-weight:700;">${isAr ? 'الحضور والغياب' : 'Attendance Stats'}</div>
                            <div style="font-size:0.85rem; font-weight:700; color:var(--text-main); display:flex; flex-direction:column; gap:2px; text-align:inherit; padding:0 4px;">
                                <div style="color:var(--success); display:flex; justify-content:space-between; gap:6px;">
                                    <span>${isAr ? 'حاضر' : 'Present'}:</span>
                                    <span>${presentCount}</span>
                                </div>
                                <div style="color:var(--danger); display:flex; justify-content:space-between; gap:6px;">
                                    <span>${isAr ? 'غائب' : 'Absent'}:</span>
                                    <span>${absentCount}</span>
                                </div>
                                <div style="color:var(--warning); display:flex; justify-content:space-between; gap:6px;">
                                    <span>${isAr ? 'متأخر' : 'Late'}:</span>
                                    <span>${lateCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-top:16px;">
                        <!-- Salary Breakdown Panel -->
                        <div style="background:var(--input-bg); padding:16px; border-radius:8px; border:1px solid var(--border-color); display:flex; flex-direction:column; justify-content:space-between;">
                            <div style="font-size:0.95rem; font-weight:600; color:var(--text-main); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                                📊 ${isAr ? 'تفاصيل الراتب والخصومات' : 'Salary & Balance Breakdown'}
                            </div>
                            <div style="font-size:0.85rem; display:flex; flex-direction:column; gap:8px; flex:1; justify-content:center;">
                                <div class="flex-between" style="border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; margin-bottom: 2px;">
                                    <span style="color:var(--text-muted);">${isAr ? 'الراتب الأساسي:' : 'Base Salary:'}</span>
                                    <strong style="color:var(--text-main);">SAR ${base.toLocaleString()}</strong>
                                </div>
                                ${ov > 0 ? `
                                <div class="flex-between" style="border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; margin-bottom: 2px;">
                                    <span style="color:var(--text-muted);">${isAr ? 'ساعات إضافية:' : 'Overtime Earned:'}</span>
                                    <strong style="color:var(--success);">+ SAR ${ov.toLocaleString()}</strong>
                                </div>` : ''}
                                ${(rew + volumeReward) > 0 ? `
                                <div class="flex-between" style="border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; margin-bottom: 2px;">
                                    <span style="color:var(--text-muted);">${isAr ? 'المكافآت والحوافز:' : 'Rewards & Volume:'}</span>
                                    <strong style="color:var(--success);">+ SAR ${(rew + volumeReward).toLocaleString()}</strong>
                                </div>` : ''}
                                ${viol > 0 ? `
                                <div class="flex-between" style="border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; margin-bottom: 2px;">
                                    <span style="color:var(--text-muted);">${isAr ? 'المخالفات العادية:' : 'Normal Violations:'}</span>
                                    <strong style="color:var(--danger);">- SAR ${viol.toLocaleString()}</strong>
                                </div>` : ''}
                                ${sysViolDeduction > 0 ? `
                                <div class="flex-between" style="border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; margin-bottom: 2px;">
                                    <span style="color:var(--text-muted);">${isAr ? 'مخالفات النظام:' : 'System Violations:'}</span>
                                    <strong style="color:var(--danger);">- SAR ${sysViolDeduction.toLocaleString()}</strong>
                                </div>` : ''}
                                ${lateDeduction > 0 ? `
                                <div class="flex-between" style="border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; margin-bottom: 2px;">
                                    <span style="color:var(--text-muted);">${isAr ? 'خصم التأخير:' : 'Late Penalties:'}</span>
                                    <strong style="color:var(--danger);">- SAR ${lateDeduction.toLocaleString()}</strong>
                                </div>` : ''}
                                <div class="flex-between" style="border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; padding-top:4px; margin-top:2px;">
                                    <strong style="color:var(--text-main); font-weight:700;">${isAr ? 'صافي راتب الشهر:' : 'Net Monthly Salary:'}</strong>
                                    <strong style="color:var(--primary); font-weight:800;">SAR ${netThisMonth.toLocaleString()}</strong>
                                </div>
                                ${paidThisMonth > 0 ? `
                                <div class="flex-between" style="border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; margin-bottom: 2px;">
                                    <span style="color:var(--text-muted);">${isAr ? 'المسحوبات والسلف:' : 'Draws/Payments:'}</span>
                                    <strong style="color:var(--danger);">- SAR ${paidThisMonth.toLocaleString()}</strong>
                                </div>` : ''}
                                <div class="flex-between" style="padding-top:8px; margin-top:4px;">
                                    <strong style="color:var(--text-main); font-weight:800;">${isAr ? 'الرصيد التراكمي المتبقي:' : 'Cumulative Balance:'}</strong>
                                    <strong style="color:var(--success); font-size:1.05rem; font-weight:900;">SAR ${remainingAllTime.toLocaleString()}</strong>
                                </div>
                            </div>
                        </div>

                        <!-- Violations Panel -->
                        <div style="background:var(--input-bg); padding:16px; border-radius:8px; border:1px solid var(--border-color);">
                            <div style="font-size:0.95rem; font-weight:600; color:var(--text-main); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                                ⚠️ ${t('title-my-violations')}
                            </div>
                            <div style="max-height:200px; overflow-y:auto; padding-right:4px;">
                                ${violCellHtml}
                            </div>
                        </div>

                        <!-- Rewards Panel -->
                        <div style="background:var(--input-bg); padding:16px; border-radius:8px; border:1px solid var(--border-color);">
                            <div style="font-size:0.95rem; font-weight:600; color:var(--text-main); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                                🎁 ${isAr ? 'المكافآت والحوافز' : 'My Rewards & Bonuses'}
                            </div>
                            <div style="max-height:200px; overflow-y:auto; padding-right:4px;">
                                ${rewardsLogHtml}
                            </div>
                        </div>

                        <!-- Custody Statement Panel -->
                        <div style="background:var(--input-bg); padding:16px; border-radius:8px; border:1px solid var(--border-color);">
                            <div style="font-size:0.95rem; font-weight:600; color:var(--text-main); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                                💰 ${isAr ? 'كشف حساب العهدة' : 'My Custody Statement'}
                            </div>
                            ${custodyStatusHtml}
                            <div style="max-height:140px; overflow-y:auto; padding-right:4px;">
                                ${custodyLogHtml}
                            </div>
                        </div>

                        <!-- Company Costs Panel -->
                        <div style="background:var(--input-bg); padding:16px; border-radius:8px; border:1px solid var(--border-color); display:flex; flex-direction:column; justify-content:center; text-align:center;">
                            <div style="font-size:0.9rem; font-weight:600; color:var(--text-main); margin-bottom:8px;">${t('label-company-costs-sm')}</div>
                            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:16px; line-height:1.4;">${t('desc-costs')}</div>
                            <div style="font-size:1.4rem; font-weight:700; color:var(--danger); background:var(--danger-bg); padding:10px; border-radius:6px; border:1px solid var(--danger-border);">SAR ${costs.toLocaleString()}</div>
                        </div>
                    </div>
                `;
        container.appendChild(card);
    });
}


let currentAppLang = localStorage.getItem("burgeroov_lang") || "en";

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
    if (currentCompany === 'mvc') {
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

// --- GAMIFICATION LEADERBOARDS (EMPLOYEES & DRIVERS) ---
function renderLeaderboard() {
    const workers = getCompanyData().workers || [];
    if (workers.length === 0) return;

    const isAr = currentAppLang === 'ar';

    // 1. Calculate general leaderboard (All non-driver/regular tasks & perfection score)
    const generalRanked = workers.map(worker => {
        const avg = parseFloat(getAveragePerfection(getLogsForMonth(worker, currentGlobalMonth)) || 0);

        let taskPoints = 0;
        let taskHigh = 0;
        let taskNormal = 0;
        if (worker.jobs) {
            worker.jobs.forEach(job => {
                if (job.status === 'completed' || job.done) {
                    const urgency = (job.urgency || 'normal').toLowerCase();
                    if (urgency === 'high' || urgency === 'urgent') {
                        taskPoints += 30;
                        taskHigh++;
                    } else {
                        taskPoints += 15;
                        taskNormal++;
                    }
                }
            });
        }

        const totalScore = Math.round(avg + taskPoints);

        return {
            id: worker.id,
            name: worker.name,
            role: worker.role || (isAr ? 'موظف' : 'Staff'),
            avg: avg,
            taskPoints: taskPoints,
            taskHigh: taskHigh,
            taskNormal: taskNormal,
            score: totalScore
        };
    }).sort((a, b) => b.score - a.score);

    // Populate General Podium
    const p1Name = document.getElementById('podium-1-name');
    const p1Score = document.getElementById('podium-1-score');
    const p2Name = document.getElementById('podium-2-name');
    const p2Score = document.getElementById('podium-2-score');
    const p3Name = document.getElementById('podium-3-name');
    const p3Score = document.getElementById('podium-3-score');

    if (generalRanked[0]) {
        if (p1Name) p1Name.textContent = generalRanked[0].name;
        if (p1Score) p1Score.textContent = `${generalRanked[0].score} pts`;
    } else {
        if (p1Name) p1Name.textContent = '—';
        if (p1Score) p1Score.textContent = '—';
    }
    if (generalRanked[1]) {
        if (p2Name) p2Name.textContent = generalRanked[1].name;
        if (p2Score) p2Score.textContent = `${generalRanked[1].score} pts`;
    } else {
        if (p2Name) p2Name.textContent = '—';
        if (p2Score) p2Score.textContent = '—';
    }
    if (generalRanked[2]) {
        if (p3Name) p3Name.textContent = generalRanked[2].name;
        if (p3Score) p3Score.textContent = `${generalRanked[2].score} pts`;
    } else {
        if (p3Name) p3Name.textContent = '—';
        if (p3Score) p3Score.textContent = '—';
    }

    // Populate General List
    const genListDiv = document.getElementById('leaderboard-list');
    if (genListDiv) {
        genListDiv.innerHTML = '';
        generalRanked.forEach((worker, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

            let breakdownStr = '';
            if (isAr) {
                breakdownStr = `الأداء: ${worker.avg}% | نقاط المهام: ${worker.taskPoints} (عاجل: ${worker.taskHigh}، عادي: ${worker.taskNormal})`;
            } else {
                breakdownStr = `Perf: ${worker.avg}% | Task Pts: ${worker.taskPoints} (High: ${worker.taskHigh}, Normal: ${worker.taskNormal})`;
            }

            genListDiv.innerHTML += `
                <div class="flex-between" style="padding:10px 14px; background:var(--input-bg); border-radius:10px; border:1px solid var(--border-color); align-items:center;">
                    <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
                        <span style="font-weight:800; font-size:1.1rem; width:24px; text-align:center; color:var(--text-muted);">${medal}</span>
                        <div style="overflow:hidden;">
                            <strong style="color:var(--text-main); display:block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${worker.name}</strong>
                            <span style="font-size:0.7rem; color:var(--text-muted); display:block;">${breakdownStr}</span>
                        </div>
                    </div>
                    <div style="text-align:right; font-weight:800; color:var(--primary); font-size:1.05rem; white-space:nowrap; margin-left:10px;">
                        ${worker.score} pts
                    </div>
                </div>
            `;
        });
    }

    // 2. Calculate driver leaderboard (Strictly deliveries)
    const driversRanked = workers.filter(worker => {
        const isDriver = worker.role && (worker.role.toLowerCase().includes('driver') || worker.role.includes('سائق'));
        const stats = getMonthlyStats(worker, currentGlobalMonth);
        const deliveries = (stats.deliveriesList ? stats.deliveriesList.length : 0) + (stats.legacyDeliveries || 0);
        return isDriver || deliveries > 0;
    }).map(worker => {
        const stats = getMonthlyStats(worker, currentGlobalMonth);
        const deliveries = (stats.deliveriesList ? stats.deliveriesList.length : 0) + (stats.legacyDeliveries || 0);
        return {
            id: worker.id,
            name: worker.name,
            deliveries: deliveries
        };
    }).sort((a, b) => b.deliveries - a.deliveries);

    // Populate Driver Podium
    const pd1Name = document.getElementById('podium-drv-1-name');
    const pd1Score = document.getElementById('podium-drv-1-score');
    const pd2Name = document.getElementById('podium-drv-2-name');
    const pd2Score = document.getElementById('podium-drv-2-score');
    const pd3Name = document.getElementById('podium-drv-3-name');
    const pd3Score = document.getElementById('podium-drv-3-score');

    const labelDels = isAr ? 'توصيلة' : 'dels';

    if (driversRanked[0]) {
        if (pd1Name) pd1Name.textContent = driversRanked[0].name;
        if (pd1Score) pd1Score.textContent = `${driversRanked[0].deliveries} ${labelDels}`;
    } else {
        if (pd1Name) pd1Name.textContent = '—';
        if (pd1Score) pd1Score.textContent = '—';
    }
    if (driversRanked[1]) {
        if (pd2Name) pd2Name.textContent = driversRanked[1].name;
        if (pd2Score) pd2Score.textContent = `${driversRanked[1].deliveries} ${labelDels}`;
    } else {
        if (pd2Name) pd2Name.textContent = '—';
        if (pd2Score) pd2Score.textContent = '—';
    }
    if (driversRanked[2]) {
        if (pd3Name) pd3Name.textContent = driversRanked[2].name;
        if (pd3Score) pd3Score.textContent = `${driversRanked[2].deliveries} ${labelDels}`;
    } else {
        if (pd3Name) pd3Name.textContent = '—';
        if (pd3Score) pd3Score.textContent = '—';
    }

    // Populate Driver List
    const drvListDiv = document.getElementById('driver-leaderboard-list');
    if (drvListDiv) {
        drvListDiv.innerHTML = '';
        driversRanked.forEach((worker, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
            drvListDiv.innerHTML += `
                <div class="flex-between" style="padding:10px 14px; background:var(--input-bg); border-radius:10px; border:1px solid var(--border-color); align-items:center;">
                    <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
                        <span style="font-weight:800; font-size:1.1rem; width:24px; text-align:center; color:var(--text-muted);">${medal}</span>
                        <div style="overflow:hidden;">
                            <strong style="color:var(--text-main); display:block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${worker.name}</strong>
                        </div>
                    </div>
                    <div style="text-align:right; font-weight:800; color:var(--primary); font-size:1.05rem; white-space:nowrap; margin-left:10px;">
                        ${worker.deliveries} ${labelDels}
                    </div>
                </div>
            `;
        });
    }
}

// --- MOBILE USER DROPDOWN TRIGGER ---
window.toggleUserDropdown = function (event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('user-dropdown-menu');
    if (dropdown) {
        dropdown.classList.toggle('show-dropdown');
    }
};

document.addEventListener('click', function (e) {
    const container = document.querySelector('.user-menu-container');
    const dropdown = document.getElementById('user-dropdown-menu');
    if (container && dropdown && !container.contains(e.target)) {
        dropdown.classList.remove('show-dropdown');
    }
});

// --- WORKER PAYMENT REQUESTS ENGINE ---

// Helper: Get active worker record corresponding to logged-in user
function getActiveWorker() {
    if (!currentUser || !currentUser.email) return null;
    const workers = getCompanyData().workers || [];
    const activeW = workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
    if (activeW) {
        document.body.classList.add('has-worker-profile');
    } else {
        document.body.classList.remove('has-worker-profile');
    }
    return activeW;
}

// 1. Submit Payment Request (Worker)
function submitPaymentRequest() {
    const worker = getActiveWorker();
    if (!worker) {
        alert("Only registered workers can request payments.");
        return;
    }
    const isAr = currentAppLang === 'ar';
    const amountVal = parseFloat(document.getElementById('payment-req-amount').value);
    const reasonVal = document.getElementById('payment-req-reason').value.trim();

    if (isNaN(amountVal) || amountVal <= 0) {
        alert(isAr ? 'يرجى إدخال مبلغ صحيح أكبر من 0.' : 'Please enter a valid amount greater than 0.');
        return;
    }
    if (!reasonVal) {
        alert(isAr ? 'يرجى إدخال سبب الطلب.' : 'Please enter a reason for the request.');
        return;
    }

    // 1-Week (7 days) Cooldown Check between payment requests
    const allRequests = Object.values(getCompanyData().paymentRequests || {});
    const workerRequests = allRequests.filter(r => r.workerId === worker.id && r.timestamp);

    if (workerRequests.length > 0) {
        const lastTimestamp = Math.max(...workerRequests.map(r => r.timestamp || 0));
        const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 604,800,000 ms
        const timeElapsed = Date.now() - lastTimestamp;
        if (timeElapsed < ONE_WEEK_MS) {
            const remainingMs = ONE_WEEK_MS - timeElapsed;
            const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
            const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            const timeMsg = isAr ? `${remainingDays} يوم و ${remainingHours} ساعة` : `${remainingDays}d ${remainingHours}h`;
            alert(isAr 
                ? `عذراً، يجب الانتظار لمدة أسبوع واحد (7 أيام) بين كل طلب دفع وآخر. الوقت المتبقي: ${timeMsg}.` 
                : `Sorry, you must wait 1 week (7 days) between payment requests. Time remaining: ${timeMsg}.`);
            return;
        }
    }

    const reqId = 'req-' + Date.now();
    const requestObj = {
        id: reqId,
        workerId: worker.id,
        workerName: worker.name,
        amount: amountVal,
        requestedAmount: amountVal,
        reason: reasonVal,
        status: 'pending',
        timestamp: Date.now()
    };

    db.ref(`companies/${currentCompany}/paymentRequests/${reqId}`).set(requestObj)
        .then(() => {
            document.getElementById('payment-req-amount').value = '';
            document.getElementById('payment-req-reason').value = '';
            alert(isAr ? 'تم تقديم الطلب بنجاح وهو قيد المراجعة.' : 'Request submitted successfully and is pending review.');
        })
        .catch(err => {
            console.error("Error submitting payment request:", err);
            alert("Error: " + err.message);
        });
}

// 2. Accept Request (Finance / Admin Manager)
function acceptPaymentRequest(reqId) {
    const isAr = currentAppLang === 'ar';
    const pRequests = getCompanyData().paymentRequests || {};
    const req = pRequests[reqId];
    if (!req) return;

    // Get adjusted amount from input
    let approvedAmount = req.amount;
    const adjustInput = document.getElementById(`adjust-amount-${reqId}`);
    if (adjustInput) {
        const parsed = parseFloat(adjustInput.value);
        if (!isNaN(parsed) && parsed > 0) {
            approvedAmount = parsed;
        }
    }

    let note = '';
    const noteInput = document.getElementById(`admin-note-${reqId}`);
    if (noteInput && noteInput.value.trim() !== '') {
        note = noteInput.value.trim();
    }

    const threshold = parseFloat(getCompanyData().highMoneyThreshold) || 0;
    const isHighRequest = threshold > 0 && approvedAmount >= threshold;

    const updateData = {
        amount: approvedAmount,
        requestedAmount: req.requestedAmount !== undefined ? req.requestedAmount : req.amount,
        adminNote: note || (req.adminNote || null),
        handledAt: Date.now()
    };

    if (isHighRequest) {
        updateData.status = 'waiting_manager_approval';
        updateData.code = null;

        db.ref(`companies/${currentCompany}/paymentRequests/${reqId}`).update(updateData).then(() => {
            if (typeof logActivity === 'function') {
                logActivity('finance', req.workerId, req.workerName, `Financial department accepted high payment request of SAR ${approvedAmount} for ${req.workerName} (Awaiting Manager final approval)`);
            }
        }).catch(err => console.error("Error accepting request (high request):", err));
    } else {
        // Generate random 6 digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        updateData.status = 'accepted';
        updateData.code = code;

        db.ref(`companies/${currentCompany}/paymentRequests/${reqId}`).update(updateData).then(() => {
            if (typeof logActivity === 'function') {
                logActivity('finance', req.workerId, req.workerName, `Accepted payment request of SAR ${approvedAmount} for ${req.workerName}`);
            }
        }).catch(err => console.error("Error accepting request:", err));
    }
}

function undoAcceptPaymentRequest(reqId) {
    const pRequests = getCompanyData().paymentRequests || {};
    const req = pRequests[reqId];
    if (!req) return;

    const originalAmount = req.requestedAmount !== undefined ? req.requestedAmount : req.amount;

    db.ref(`companies/${currentCompany}/paymentRequests/${reqId}`).update({
        status: 'pending',
        amount: originalAmount,
        code: null,
        handledAt: null
    }).then(() => {
        if (typeof logActivity === 'function') {
            logActivity('finance_delete', req.workerId, req.workerName, `Undid acceptance of payment request of SAR ${req.amount} for ${req.workerName}`);
        }
    }).catch(err => console.error("Error undoing accepted request:", err));
}

// 3. Reject Request (Finance / Admin Manager)
function rejectPaymentRequest(reqId) {
    const isAr = currentAppLang === 'ar';
    const pRequests = getCompanyData().paymentRequests || {};
    const req = pRequests[reqId];
    if (!req) return;

    let note = '';
    const noteInput = document.getElementById(`admin-note-${reqId}`);
    if (noteInput && noteInput.value.trim() !== '') {
        note = noteInput.value.trim();
    } else {
        const prompted = prompt(isAr ? 'الرجاء كتابة سبب الرفض أو ملاحظة (اختياري):' : 'Enter rejection reason or note (optional):');
        if (prompted === null) return; // User canceled
        note = prompted.trim();
    }

    db.ref(`companies/${currentCompany}/paymentRequests/${reqId}`).update({
        status: 'rejected',
        adminNote: note || null,
        handledAt: Date.now()
    }).then(() => {
        if (typeof logActivity === 'function') {
            const detailMsg = note ? ` (Reason: ${note})` : '';
            logActivity('finance', req.workerId, req.workerName, `Rejected payment request of SAR ${req.amount} for ${req.workerName}${detailMsg}`);
        }
    }).catch(err => console.error("Error rejecting request:", err));
}

// 4. Confirm Payment Given (Sales / Salary Man)
function confirmPaymentGiven(reqId) {
    const pRequests = getCompanyData().paymentRequests || {};
    const req = pRequests[reqId];
    if (!req) return;

    // Verify verification code entered (or just standard confirmation)
    const enteredCode = document.getElementById(`verify-code-${reqId}`).value.trim();
    if (enteredCode !== req.code) {
        alert(currentAppLang === 'ar' ? 'الرمز المدخل غير صحيح!' : 'Incorrect verification code!');
        return;
    }

    // Find worker
    const workers = getCompanyData().workers || [];
    const workerIndex = workers.findIndex(w => w.id === req.workerId);
    if (workerIndex === -1) {
        alert("Worker not found in database.");
        return;
    }
    const worker = workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);

    // Save payment log in worker's monthlyStats
    if (!stats.paymentsList) stats.paymentsList = [];
    stats.paymentsList.unshift({
        id: Date.now().toString(),
        date: formatTimestamp(),
        amount: req.amount,
        reason: req.reason
    });

    // Write payment to worker stats, then change request status to 'given'
    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/paymentsList`).set(stats.paymentsList)
        .then(() => {
            return db.ref(`companies/${currentCompany}/paymentRequests/${reqId}`).update({
                status: 'given',
                givenAt: Date.now()
            });
        })
        .then(() => {
            if (typeof logActivity === 'function') {
                logActivity('finance', req.workerId, req.workerName, `Released payment request of SAR ${req.amount} to ${req.workerName}`);
            }
            alert(currentAppLang === 'ar' ? 'تم تسجيل الدفعة وتسليمها بنجاح!' : 'Payment logged and released successfully!');
        })
        .catch(err => {
            console.error("Error confirming payment release:", err);
            alert("Error: " + err.message);
        });
}

// 5. Render Worker requests lists
function renderPaymentRequests() {
    const isAr = currentAppLang === 'ar';
    const isFinAdmin = currentUser && (currentUser.role === 'admin' || document.body.classList.contains('perm-finance'));
    const companyData = getCompanyData();
    const pRequests = companyData.paymentRequests || {};
    const reqList = Object.values(pRequests).sort((a, b) => b.timestamp - a.timestamp);

    const thresholdInput = document.getElementById('high-money-threshold-input');
    if (thresholdInput) {
        const threshold = companyData.highMoneyThreshold;
        // Pre-fill input value from DB
        if (document.activeElement !== thresholdInput) {
            thresholdInput.value = threshold !== undefined ? threshold : '';
        }
    }

    renderHighMoneyApprovals();

    // Render for Worker (Self Request History)
    const worker = getActiveWorker();
    const workerRequestsDiv = document.getElementById('worker-requests-list');
    if (worker && workerRequestsDiv) {
        workerRequestsDiv.innerHTML = '';
        const myReqs = reqList.filter(r => r.workerId === worker.id);
        if (myReqs.length === 0) {
            workerRequestsDiv.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">${isAr ? 'لا يوجد طلبات سابقة.' : 'No previous requests.'}</p>`;
        } else {
            myReqs.forEach(req => {
                const dateStr = new Date(req.timestamp).toLocaleString();
                let statusBadge = '';
                let codeDisplay = '';

                let editBtn = '';
                if (req.status === 'pending') {
                    statusBadge = `<span class="badge" style="background:#d97706;">${isAr ? 'قيد الانتظار' : 'Pending'}</span>`;
                    editBtn = `<button onclick="editPaymentRequestAmount('${req.id}')" class="btn-outline" style="padding: 2px 8px; font-size: 0.75rem; font-weight: 600; margin-left: 6px; cursor:pointer;" title="${isAr ? 'تعديل المبلغ' : 'Edit Amount'}">✏️ ${isAr ? 'تعديل' : 'Edit'}</button>`;
                } else if (req.status === 'waiting_manager_approval') {
                    statusBadge = `<span class="badge" style="background:#f59e0b;">${isAr ? 'موافق مالياً (بانتظار موافقة المدير)' : 'Financial Approved (Waiting for Manager Approval)'}</span>`;
                } else if (req.status === 'accepted') {
                    statusBadge = `<span class="badge" style="background:#16a34a;">${isAr ? 'مقبول للتسليم' : 'Approved for Disbursal'}</span>`;
                    codeDisplay = `<div style="margin-top: 5px; font-weight: 800; font-size: 1rem; color: var(--success);">${isAr ? 'الرمز السري:' : 'Verification Code:'} <span style="background:var(--input-bg); padding: 2px 6px; border-radius: 4px; border: 1px dashed var(--success);">${req.code}</span></div>`;
                } else if (req.status === 'rejected') {
                    statusBadge = `<span class="badge" style="background:#dc2626;">${isAr ? 'مرفوض' : 'Rejected'}</span>`;
                } else if (req.status === 'given') {
                    statusBadge = `<span class="badge" style="background:#2563eb;">${isAr ? 'تم الاستلام' : 'Given'}</span>`;
                }

                let adminNoteDisplay = '';
                if (req.adminNote) {
                    if (req.status === 'rejected') {
                        adminNoteDisplay = `
                            <div style="font-size: 0.85rem; margin-top: 8px; padding: 8px 12px; background: rgba(220, 38, 38, 0.08); border-left: 4px solid var(--danger); border-radius: 6px; color: var(--danger); font-weight: 600;">
                                💬 ${isAr ? 'سبب الرفض / ملاحظة الإدارة:' : 'Rejection Reason / Admin Note:'} <span style="font-weight: 500; color: var(--text-main);">${req.adminNote}</span>
                            </div>`;
                    } else {
                        adminNoteDisplay = `
                            <div style="font-size: 0.85rem; margin-top: 8px; padding: 8px 12px; background: rgba(197, 131, 43, 0.08); border-left: 4px solid var(--secondary); border-radius: 6px; color: var(--text-main); font-weight: 500;">
                                💬 ${isAr ? 'ملاحظة الإدارة:' : 'Admin Note:'} <span>${req.adminNote}</span>
                            </div>`;
                    }
                }

                workerRequestsDiv.innerHTML += `
                    <div class="ledger-card" style="border-left: 4px solid var(--primary);">
                        <div class="flex-between">
                            <div>
                                <strong>SAR ${req.amount}</strong>
                                ${editBtn}
                            </div>
                            ${statusBadge}
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">🕒 ${dateStr}</div>
                        <div style="font-size: 0.85rem; margin-top: 6px; color: var(--text-main);">${isAr ? 'السبب:' : 'Reason:'} <em>${req.reason}</em></div>
                        ${adminNoteDisplay}
                        ${codeDisplay}
                    </div>
                `;
            });
        }
    }

    // Render for Finance Dept Manager (All Requests Log / Dashboard)
    const pendingListDiv = document.getElementById('pending-requests-list');
    if (pendingListDiv) {
        pendingListDiv.innerHTML = '';
        const managerReqs = reqList.filter(r => r.status === 'pending' || r.status === 'waiting_manager_approval' || r.status === 'accepted' || r.status === 'given' || r.status === 'rejected');
        if (managerReqs.length === 0) {
            pendingListDiv.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">${isAr ? 'لا توجد طلبات حالياً.' : 'No requests at the moment.'}</p>`;
        } else {
            managerReqs.forEach(req => {
                const dateStr = new Date(req.timestamp).toLocaleString();
                let cardStyle = '';
                let statusHeader = '';
                let actionArea = '';

                if (req.status === 'pending') {
                    cardStyle = 'border-left: 4px solid var(--warning);';
                    statusHeader = `<span class="badge" style="background:#d97706; font-size:0.75rem; font-weight:700; padding:4px 8px; border-radius:4px; color:white;">${isAr ? 'قيد الانتظار' : 'Pending'}</span>`;
                    actionArea = `
                        <div style="display:flex; flex-direction:column; gap:8px; margin-top: 12px;">
                            <div style="display:flex; gap:8px; justify-content: flex-end; align-items:center; flex-wrap:wrap;">
                                <label style="margin: 0; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">${isAr ? 'تعديل المبلغ (ريال):' : 'Adjust Amount (SAR):'}</label>
                                <input type="number" step="any" id="adjust-amount-${req.id}" value="${req.amount}" min="0.01" 
                                    style="max-width: 90px; padding: 6px 10px; font-size: 0.85rem; height: 34px;">
                            </div>
                            <div style="display:flex; gap:8px; justify-content: flex-end; align-items:center; flex-wrap:wrap;">
                                <input type="text" id="admin-note-${req.id}" placeholder="${isAr ? 'سبب الرفض / ملاحظة (اختياري)...' : 'Rejection reason / Note (optional)...'}" 
                                    style="flex: 1; min-width: 180px; padding: 6px 10px; font-size: 0.85rem; height: 34px;">
                                <button onclick="rejectPaymentRequest('${req.id}')" class="btn-outline-danger" style="padding: 6px 14px; font-size: 0.8rem; height: 34px; font-weight:700;">${isAr ? 'رفض' : 'Reject'}</button>
                                <button onclick="acceptPaymentRequest('${req.id}')" class="btn-success" style="padding: 6px 14px; font-size: 0.8rem; height: 34px; font-weight:700;">${isAr ? 'قبول واعتماد' : 'Accept & Approve'}</button>
                            </div>
                        </div>
                    `;
                } else if (req.status === 'waiting_manager_approval') {
                    cardStyle = 'border-left: 4px solid var(--secondary);';
                    statusHeader = `<span class="badge" style="background:#f59e0b; font-size:0.75rem; font-weight:700; padding:4px 8px; border-radius:4px; color:white;">${isAr ? 'موافق مالياً (بانتظار موافقة المدير)' : 'Financial Approved (Awaiting Manager Approval)'}</span>`;
                    actionArea = `
                        <div style="display:flex; gap:8px; margin-top: 12px; justify-content: flex-end; align-items:center;">
                            <button onclick="undoAcceptPaymentRequest('${req.id}')" class="btn-outline-danger" style="padding: 6px 14px; font-size: 0.8rem; height: 34px; font-weight:700;">
                                ${isAr ? 'تراجع عن القبول' : 'Undo Accept'}
                            </button>
                        </div>
                    `;
                } else if (req.status === 'accepted') {
                    cardStyle = 'border-left: 4px solid var(--success);';
                    statusHeader = `
                        <div style="display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
                            <span class="badge" style="background:#16a34a; font-size:0.75rem; font-weight:700; padding:4px 8px; border-radius:4px; color:white;">
                                ${isAr ? 'مقبول (بانتظار التسليم)' : 'Approved (Pending Disbursal)'}
                            </span>
                            <div style="font-size:0.8rem; color:var(--text-muted); font-weight:600; margin-top:4px;">
                                ${isAr ? 'الرمز السري:' : 'Code:'} <span style="background:var(--input-bg); padding:2px 6px; border-radius:4px; border:1px dashed var(--success); font-weight:800; color:var(--success);">${req.code}</span>
                            </div>
                        </div>
                    `;
                    actionArea = `
                        <div style="display:flex; gap:8px; margin-top: 12px; justify-content: flex-end; align-items:center;">
                            <button onclick="undoAcceptPaymentRequest('${req.id}')" class="btn-outline-danger" style="padding: 6px 14px; font-size: 0.8rem; height: 34px; font-weight:700;">
                                ${isAr ? 'تراجع عن القبول' : 'Undo Accept'}
                            </button>
                        </div>
                    `;
                } else if (req.status === 'rejected') {
                    cardStyle = 'border-left: 4px solid #ef4444; opacity: 0.85;';
                    statusHeader = `<span class="badge" style="background:#dc2626; font-size:0.75rem; font-weight:700; padding:4px 8px; border-radius:4px; color:white;">${isAr ? 'مرفوض' : 'Rejected'}</span>`;
                    actionArea = '';
                } else if (req.status === 'given') {
                    cardStyle = 'border-left: 4px solid var(--primary);';
                    statusHeader = `<span class="badge" style="background:#2563eb; font-size:0.75rem; font-weight:700; padding:4px 8px; border-radius:4px; color:white;">${isAr ? 'تم الاستلام ✅' : 'Given / Disbursed ✅'}</span>`;
                    actionArea = '';
                }

                let adminNoteText = '';
                if (req.adminNote) {
                    const noteColor = req.status === 'rejected' ? 'var(--danger)' : 'var(--secondary)';
                    adminNoteText = `<div style="font-size: 0.85rem; margin-top: 6px; color: ${noteColor}; font-weight: 600;">💬 ${isAr ? 'ملاحظة الإدارة / سبب الرفض:' : 'Admin Note / Rejection Reason:'} <span style="font-weight:400; color:var(--text-main);">${req.adminNote}</span></div>`;
                }

                pendingListDiv.innerHTML += `
                    <div class="ledger-card" style="${cardStyle}">
                        <div class="flex-between">
                            <div>
                                <strong style="font-size:1.05rem;">${req.workerName}</strong>
                                <span style="font-size:0.75rem; color:var(--text-muted); margin-left: 8px;">🕒 ${dateStr}</span>
                            </div>
                            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
                                <strong class="text-primary" style="font-size:1.1rem;">SAR ${req.amount}</strong>
                                ${statusHeader}
                            </div>
                        </div>
                        <div style="font-size: 0.85rem; margin-top: 8px; color:var(--text-main);">${isAr ? 'السبب:' : 'Reason:'} <em>${req.reason}</em></div>
                        ${adminNoteText}
                        ${actionArea}
                    </div>
                `;
            });
        }
    }

    // Render for Sales Dept Worker (Accepted Payment Releases List)
    const acceptedListDiv = document.getElementById('accepted-payments-list');
    if (acceptedListDiv) {
        acceptedListDiv.innerHTML = '';
        const acceptedReqs = reqList.filter(r => r.status === 'accepted');
        if (acceptedReqs.length === 0) {
            acceptedListDiv.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">${isAr ? 'لا توجد دفعات معتمدة بانتظار التسليم.' : 'No approved payments waiting for release.'}</p>`;
        } else {
            acceptedReqs.forEach(req => {
                acceptedListDiv.innerHTML += `
                    <div class="ledger-card" style="border-left: 4px solid var(--success);">
                        <div class="flex-between" style="align-items: flex-start; flex-wrap:wrap;">
                            <div>
                                <strong style="font-size:1.05rem; display:block;">${req.workerName}</strong>
                                <span style="font-size:0.85rem; color:var(--text-muted);">${isAr ? 'السبب:' : 'Reason:'} <em>${req.reason}</em></span>
                                <div style="margin-top: 4px; font-size:0.8rem; color:var(--text-muted);">${isAr ? 'الرمز:' : 'Code:'} <span style="font-weight:700; color:var(--success);">${req.code}</span></div>
                            </div>
                            <div style="text-align: right;">
                                <strong class="text-success" style="font-size:1.15rem; display:block;">SAR ${req.amount}</strong>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 14px; align-items: center; flex-wrap: wrap;">
                            <input type="text" id="verify-code-${req.id}" placeholder="${isAr ? 'أدخل الرمز للتأكيد...' : 'Enter verification code...'}" 
                                style="max-width: 200px; padding: 8px 12px; font-size: 0.85rem;">
                            <button onclick="confirmPaymentGiven('${req.id}')" class="btn-success" style="padding: 8px 16px; font-size: 0.85rem; font-weight:700;">
                                ${isAr ? 'تم تسليم المبلغ بنجاح ✅' : 'Payment Given Successfully ✅'}
                            </button>
                        </div>
                    </div>
                `;
            });
        }
    }

    renderDailyPayouts();
}

function renderDailyPayouts() {
    const isAr = currentAppLang === 'ar';
    const isFinAdmin = currentUser && (currentUser.role === 'admin' || document.body.classList.contains('perm-finance'));
    const companyData = getCompanyData();
    const workers = companyData.workers || [];
    let allPayouts = [];

    // Gather manual and request-based payouts from monthlyStats paymentsList of all workers
    workers.forEach(w => {
        const stats = getMonthlyStats(w, currentGlobalMonth);
        const list = stats.paymentsList || [];
        list.forEach(p => {
            allPayouts.push({
                id: p.id,
                workerName: w.name,
                workerId: w.id,
                amount: p.amount,
                reason: p.reason || (isAr ? 'دفعة مقدمة / سلفة' : 'Advance Payment / Payout'),
                date: p.date, // formatTimestamp() format: YYYY-MM-DD HH:MM:SS
                timestamp: parseInt(p.id) || Date.now()
            });
        });
    });

    // Sort descending by timestamp
    allPayouts.sort((a, b) => b.timestamp - a.timestamp);

    const logListDiv = document.getElementById('daily-payouts-log-list');
    if (logListDiv) {
        logListDiv.innerHTML = '';
        if (allPayouts.length === 0) {
            logListDiv.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:15px 0;">${isAr ? 'لا توجد سلف مصروفة هذا الشهر.' : 'No payouts logged this month.'}</p>`;
        } else {
            allPayouts.forEach(p => {
                const delBtn = isFinAdmin ? `<button onclick="deletePaymentRecord('${p.workerId}', '${p.id}')" class="btn-outline-danger" style="padding: 2px 6px; font-size: 0.7rem; line-height: 1; border: none; border-radius: 4px; margin-left: 8px; cursor:pointer;" title="${isAr ? 'حذف السجل' : 'Delete Log'}">🗑️</button>` : '';

                logListDiv.innerHTML += `
                    <div class="ledger-card" style="border-left: 4px solid var(--info); padding: 10px 14px; margin-bottom: 0; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                        <div>
                            <strong style="font-size: 0.95rem; color: var(--text-main); display: block;">${p.workerName}</strong>
                            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 2px;">📝 ${p.reason}</span>
                            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 2px;">🕒 ${p.date}</span>
                        </div>
                        <div style="text-align: right; display: flex; align-items: center; gap: 6px;">
                            <strong style="color: var(--info); font-size: 1.05rem;">SAR ${p.amount}</strong>
                            ${delBtn}
                        </div>
                    </div>
                `;
            });
        }
    }
}

function saveHighMoneyThreshold() {
    const isAr = currentAppLang === 'ar';
    const inputVal = parseFloat(document.getElementById('high-money-threshold-input').value);
    if (isNaN(inputVal) || inputVal < 0) {
        alert(isAr ? 'الرجاء إدخال مبلغ صحيح.' : 'Please enter a valid amount.');
        return;
    }
    db.ref(`companies/${currentCompany}/highMoneyThreshold`).set(inputVal)
        .then(() => {
            alert(isAr ? 'تم حفظ الحد المالي بنجاح!' : 'High money threshold saved successfully!');
        })
        .catch(err => {
            console.error("Error saving high money threshold:", err);
            alert("Error: " + err.message);
        });
}

function toggleOpsMoneyCustomRange() {
    const tf = document.getElementById('ops-money-timeframe-filter') ? document.getElementById('ops-money-timeframe-filter').value : 'all';
    const rangeDiv = document.getElementById('ops-money-custom-range');
    if (rangeDiv) {
        rangeDiv.style.display = tf === 'custom' ? 'flex' : 'none';
    }
}
window.toggleOpsMoneyCustomRange = toggleOpsMoneyCustomRange;

function renderHighMoneyApprovals() {
    const isAr = currentAppLang === 'ar';
    const companyData = getCompanyData();
    const pRequests = companyData.paymentRequests || {};
    let reqList = Object.values(pRequests).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const approvalsListDiv = document.getElementById('high-money-approvals-list');
    
    if (!approvalsListDiv) return;
    approvalsListDiv.innerHTML = '';

    const statusFilter = document.getElementById('ops-money-status-filter') ? document.getElementById('ops-money-status-filter').value : 'waiting_manager_approval';
    const timeframeFilter = document.getElementById('ops-money-timeframe-filter') ? document.getElementById('ops-money-timeframe-filter').value : 'all';

    // 1. Filter by Status
    if (statusFilter !== 'all') {
        reqList = reqList.filter(r => r.status === statusFilter);
    }

    // 2. Filter by Timeframe / Date
    const now = Date.now();
    if (timeframeFilter === 'today') {
        const startOfToday = new Date().setHours(0, 0, 0, 0);
        reqList = reqList.filter(r => (r.timestamp || 0) >= startOfToday);
    } else if (timeframeFilter === 'week') {
        const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
        reqList = reqList.filter(r => (r.timestamp || 0) >= weekAgo);
    } else if (timeframeFilter === 'month') {
        const monthAgo = now - (30 * 24 * 60 * 60 * 1000);
        reqList = reqList.filter(r => (r.timestamp || 0) >= monthAgo);
    } else if (timeframeFilter === 'custom') {
        const fromInput = document.getElementById('ops-money-from-date') ? document.getElementById('ops-money-from-date').value : '';
        const toInput = document.getElementById('ops-money-to-date') ? document.getElementById('ops-money-to-date').value : '';
        if (fromInput) {
            const fromMs = new Date(fromInput).setHours(0, 0, 0, 0);
            reqList = reqList.filter(r => (r.timestamp || 0) >= fromMs);
        }
        if (toInput) {
            const toMs = new Date(toInput).setHours(23, 59, 59, 999);
            reqList = reqList.filter(r => (r.timestamp || 0) <= toMs);
        }
    }

    if (reqList.length === 0) {
        approvalsListDiv.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding: 20px;">${isAr ? 'لا توجد طلبات سلف تطابق التصفية المختارة.' : 'No payment requests match the selected filters.'}</p>`;
        return;
    }

    reqList.forEach(req => {
        const dateStr = req.timestamp ? new Date(req.timestamp).toLocaleString() : (req.date || '');
        let adminNoteText = '';
        if (req.adminNote) {
            const noteColor = req.status === 'rejected' ? 'var(--danger)' : 'var(--secondary)';
            adminNoteText = `<div style="font-size: 0.85rem; margin-top: 6px; color: ${noteColor}; font-weight: 600;">💬 ${isAr ? 'ملاحظة الإدارة / سبب الرفض:' : 'Admin Note / Rejection Reason:'} <span style="font-weight:400; color:var(--text-main);">${req.adminNote}</span></div>`;
        }

        let statusBadge = '';
        let controlsArea = '';
        let borderCol = 'var(--info)';

        if (req.status === 'pending') {
            borderCol = 'var(--warning)';
            statusBadge = `<span class="badge" style="background:#d97706; color:#fff; font-weight:700;">🕒 ${isAr ? 'بانتظار موافقة المالية' : 'Pending Finance Approval'}</span>`;
            controlsArea = `
                <div style="display:flex; flex-direction:column; gap:8px; margin-top: 14px;">
                    <div style="display:flex; gap:8px; justify-content: flex-end; align-items:center; flex-wrap:wrap;">
                        <label style="margin: 0; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">${isAr ? 'تعديل المبلغ (ريال):' : 'Adjust Amount (SAR):'}</label>
                        <input type="number" step="any" id="adjust-amount-${req.id}" value="${req.amount}" min="0.01" 
                            style="max-width: 90px; padding: 6px 10px; font-size: 0.85rem; height: 34px;">
                    </div>
                    <div style="display:flex; gap:8px; justify-content: flex-end; align-items:center; flex-wrap:wrap;">
                        <input type="text" id="admin-note-${req.id}" placeholder="${isAr ? 'سبب الرفض / ملاحظة (اختياري)...' : 'Rejection reason / Note (optional)...'}" 
                            style="flex: 1; min-width: 180px; padding: 6px 10px; font-size: 0.85rem; height: 34px;">
                        <button onclick="rejectPaymentRequest('${req.id}')" class="btn-outline-danger" style="padding: 6px 14px; font-size: 0.8rem; height: 34px; font-weight:700;">${isAr ? 'رفض' : 'Reject'}</button>
                        <button onclick="acceptPaymentRequest('${req.id}')" class="btn-success" style="padding: 6px 14px; font-size: 0.8rem; height: 34px; font-weight:700;">${isAr ? 'قبول واعتماد' : 'Accept & Approve'}</button>
                    </div>
                </div>
            `;
        } else if (req.status === 'waiting_manager_approval') {
            borderCol = 'var(--warning)';
            statusBadge = `<span class="badge" style="background:#f59e0b; color:#fff; font-weight:700;">⏳ ${isAr ? 'بانتظار موافقة المدير' : 'Awaiting Manager Approval'}</span>`;
            controlsArea = `
                <div style="display:flex; flex-direction:column; gap:8px; margin-top: 14px;">
                    <div style="display:flex; gap:8px; justify-content: flex-end; align-items:center; flex-wrap:wrap;">
                        <label style="margin: 0; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">${isAr ? 'تعديل المبلغ (ريال):' : 'Adjust Amount (SAR):'}</label>
                        <input type="number" step="any" id="manager-adjust-amount-${req.id}" value="${req.amount}" min="0.01" 
                            style="max-width: 90px; padding: 6px 10px; font-size: 0.85rem; height: 34px;">
                    </div>
                    <div style="display:flex; gap:8px; justify-content: flex-end; align-items:center; flex-wrap:wrap;">
                        <input type="text" id="manager-note-${req.id}" placeholder="${isAr ? 'ملاحظة المدير / سبب الرفض (اختياري)...' : 'Manager note / Rejection reason (optional)...'}" 
                            style="flex: 1; min-width: 180px; padding: 6px 10px; font-size: 0.85rem; height: 34px;">
                        <button onclick="managerRejectPaymentRequest('${req.id}')" class="btn-outline-danger" style="padding: 6px 14px; font-size: 0.8rem; height: 34px; font-weight:700;">${isAr ? 'رفض' : 'Reject'}</button>
                        <button onclick="managerAcceptPaymentRequest('${req.id}')" class="btn-success" style="padding: 6px 14px; font-size: 0.8rem; height: 34px; font-weight:700;">${isAr ? 'قبول واعتماد نهائي' : 'Approve & Release Code'}</button>
                    </div>
                </div>
            `;
        } else if (req.status === 'accepted') {
            borderCol = 'var(--success)';
            statusBadge = `
                <div style="display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
                    <span class="badge" style="background:#16a34a; font-size:0.75rem; font-weight:700; padding:4px 8px; border-radius:4px; color:white;">
                        ${isAr ? 'مقبول (كود التسليم: ' + (req.code || '') + ')' : 'Accepted (Code: ' + (req.code || '') + ')'}
                    </span>
                </div>
            `;
            controlsArea = `
                <div style="display:flex; flex-direction:column; gap:8px; margin-top: 14px;">
                    <div style="display:flex; gap:8px; justify-content: flex-end; align-items:center; flex-wrap:wrap;">
                        <input type="text" id="verify-code-${req.id}" placeholder="${isAr ? 'إدخال رمز التحقق لتأكيد التسليم...' : 'Enter verification code to confirm disbursal...'}" 
                            style="max-width: 220px; padding: 6px 10px; font-size: 0.85rem; height: 34px;">
                        <button onclick="confirmPaymentGiven('${req.id}')" class="btn-success" style="padding: 6px 14px; font-size: 0.8rem; height: 34px; font-weight:700;">${isAr ? 'تأكيد التسليم' : 'Confirm Disbursal'}</button>
                        <button onclick="undoAcceptPaymentRequest('${req.id}')" class="btn-outline-danger" style="padding: 6px 14px; font-size: 0.8rem; height: 34px; font-weight:700;">${isAr ? 'تراجع' : 'Undo Accept'}</button>
                    </div>
                </div>
            `;
        } else if (req.status === 'given') {
            borderCol = '#0284c7';
            statusBadge = `<span class="badge" style="background:#0284c7; color:#fff; font-weight:700;">💸 ${isAr ? 'تم التسليم والمصادقة' : 'Get Paid / Disbursed'}</span>`;
        } else if (req.status === 'rejected') {
            borderCol = 'var(--danger)';
            statusBadge = `<span class="badge" style="background:#dc2626; color:#fff; font-weight:700;">❌ ${isAr ? 'مرفوض' : 'Rejected'}</span>`;
        }

        approvalsListDiv.innerHTML += `
            <div class="ledger-card" style="border-left: 4px solid ${borderCol}; padding: 14px;">
                <div class="flex-between" style="align-items: flex-start; flex-wrap: wrap; gap: 8px;">
                    <div>
                        <strong style="font-size:1.05rem; display:block;">${req.workerName}</strong>
                        <span style="font-size:0.75rem; color:var(--text-muted);">🕒 Requested: ${dateStr}</span>
                        <div style="font-size: 0.85rem; margin-top: 8px; color:var(--text-main);">${isAr ? 'السبب:' : 'Reason:'} <em>${req.reason}</em></div>
                        ${adminNoteText}
                    </div>
                    <div style="text-align: right;">
                        <div style="margin-bottom: 4px;">${statusBadge}</div>
                        <strong class="text-primary" style="font-size:1.15rem;">SAR ${req.amount}</strong>
                    </div>
                </div>
                ${controlsArea}
            </div>
        `;
    });
}

function managerAcceptPaymentRequest(reqId) {
    const isAr = currentAppLang === 'ar';
    const pRequests = getCompanyData().paymentRequests || {};
    const req = pRequests[reqId];
    if (!req) return;

    let approvedAmount = req.amount;
    const adjustInput = document.getElementById(`manager-adjust-amount-${reqId}`);
    if (adjustInput) {
        const parsed = parseFloat(adjustInput.value);
        if (!isNaN(parsed) && parsed > 0) {
            approvedAmount = parsed;
        }
    }

    let note = '';
    const noteInput = document.getElementById(`manager-note-${reqId}`);
    if (noteInput && noteInput.value.trim() !== '') {
        note = noteInput.value.trim();
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    db.ref(`companies/${currentCompany}/paymentRequests/${reqId}`).update({
        status: 'accepted',
        amount: approvedAmount,
        code: code,
        adminNote: note || (req.adminNote || null),
        managerApprovedAt: Date.now()
    }).then(() => {
        if (typeof logActivity === 'function') {
            logActivity('finance', req.workerId, req.workerName, `Manager final approved high payment request of SAR ${approvedAmount} for ${req.workerName}`);
        }
    }).catch(err => console.error("Error final approving request:", err));
}

function managerRejectPaymentRequest(reqId) {
    const isAr = currentAppLang === 'ar';
    const pRequests = getCompanyData().paymentRequests || {};
    const req = pRequests[reqId];
    if (!req) return;

    let note = '';
    const noteInput = document.getElementById(`manager-note-${reqId}`);
    if (noteInput && noteInput.value.trim() !== '') {
        note = noteInput.value.trim();
    } else {
        const prompted = prompt(isAr ? 'الرجاء كتابة سبب الرفض أو ملاحظة (اختياري):' : 'Enter rejection reason or note (optional):');
        if (prompted === null) return; // User canceled
        note = prompted.trim();
    }

    db.ref(`companies/${currentCompany}/paymentRequests/${reqId}`).update({
        status: 'rejected',
        adminNote: note || (req.adminNote || null),
        managerHandledAt: Date.now()
    }).then(() => {
        if (typeof logActivity === 'function') {
            const detailMsg = note ? ` (Reason: ${note})` : '';
            logActivity('finance', req.workerId, req.workerName, `Manager rejected high payment request of SAR ${req.amount} for ${req.workerName}${detailMsg}`);
        }
    }).catch(err => console.error("Error final rejecting request:", err));
}

// Bind to window
window.submitPaymentRequest = submitPaymentRequest;
window.acceptPaymentRequest = acceptPaymentRequest;
window.rejectPaymentRequest = rejectPaymentRequest;
window.undoAcceptPaymentRequest = undoAcceptPaymentRequest;
window.confirmPaymentGiven = confirmPaymentGiven;
window.deletePaymentRecord = deletePaymentRecord;
window.renderPaymentRequests = renderPaymentRequests;
window.renderDailyPayouts = renderDailyPayouts;
window.saveHighMoneyThreshold = saveHighMoneyThreshold;
window.renderHighMoneyApprovals = renderHighMoneyApprovals;
window.managerAcceptPaymentRequest = managerAcceptPaymentRequest;
window.managerRejectPaymentRequest = managerRejectPaymentRequest;
window.showSwapSelect = showSwapSelect;
window.cancelSwapSelect = cancelSwapSelect;
window.swapSaleMethod = swapSaleMethod;
window.togglePassword = togglePassword;
window.toggleConfirmPassword = toggleConfirmPassword;
window.toggleAuthMode = toggleAuthMode;
window.handleAuthSubmit = handleAuthSubmit;

// --- ATTENDANCE SYSTEM ---

function saveLateSettings() {
    const grace = parseInt(document.getElementById('late-grace-input').value) || 0;
    const penalty = parseFloat(document.getElementById('late-penalty-input').value) || 0;

    db.ref(`companies/${currentCompany}/lateGraceMinutes`).set(grace);
    db.ref(`companies/${currentCompany}/latePenaltySAR`).set(penalty)
        .then(() => {
            alert(currentAppLang === 'ar' ? 'تم حفظ إعدادات التأخير بنجاح!' : 'Late settings saved successfully!');
            renderAll();
        })
        .catch(err => console.error("Error saving late settings:", err));
}

function getLateDeductionsForMonth(worker, monthStr) {
    const companyData = getCompanyData();
    const attendance = companyData.attendance || {};
    const rules = companyData.lateRules || [];
    const graceMins = parseInt(companyData.lateGraceMinutes || 0);
    const legacyPenalty = parseFloat(companyData.latePenaltySAR || 0);

    let totalDeduction = 0;
    Object.keys(attendance).forEach(dateStr => {
        if (dateStr.startsWith(monthStr)) {
            const dayMap = attendance[dateStr] || {};
            const att = dayMap[worker.id];
            let shiftStart = worker.startTime;
            const dateParts = dateStr.split('-');
            const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayOfWeekName = dayNames[dateObj.getDay()];
            const dateOverrideShift = (worker.shifts || []).find(s => s.dayOfWeek === dayOfWeekName || s.specificDate === dateStr);
            if (dateOverrideShift) {
                shiftStart = dateOverrideShift.startTime;
            }
            if (att && att.status === 'present' && att.time && shiftStart) {
                const [sH, sM] = shiftStart.split(':').map(Number);
                const [cH, cM] = att.time.split(':').map(Number);
                if (!isNaN(sH) && !isNaN(cH)) {
                    const startMins = sH * 60 + (sM || 0);
                    const checkMins = cH * 60 + (cM || 0);
                    const diff = checkMins - startMins;
                    if (diff > 0) {
                        if (rules.length === 0) {
                            if (diff > graceMins && legacyPenalty > 0) {
                                totalDeduction += legacyPenalty;
                            }
                        } else {
                            // Find highest matching tier
                            const sortedRules = [...rules].sort((a, b) => b.mins - a.mins);
                            const matchedRule = sortedRules.find(r => diff >= r.mins);
                            if (matchedRule) {
                                totalDeduction += parseFloat(matchedRule.penalty || 0);
                            }
                        }
                    }
                }
            }
        }
    });
    return totalDeduction;
}

function getDriverVolumeRewardsForMonth(worker, monthStr) {
    const companyData = getCompanyData();
    const rules = companyData.driverVolumeRewards || [];
    if (rules.length === 0) return 0;

    const stats = worker.monthlyStats && worker.monthlyStats[monthStr];
    if (!stats || !stats.deliveriesList || stats.deliveriesList.length === 0) return 0;

    // Group deliveries by local date string
    const dailyCounts = {};
    stats.deliveriesList.forEach(del => {
        if (del.endTime) {
            const dateObj = new Date(del.endTime);
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const dateKey = `${yyyy}-${mm}-${dd}`;
            if (dateKey.startsWith(monthStr)) {
                dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
            }
        }
    });

    // Sort rules by ordersCount descending to find the highest milestone hit
    const sortedRules = [...rules].sort((a, b) => b.ordersCount - a.ordersCount);

    let totalReward = 0;
    Object.keys(dailyCounts).forEach(dateKey => {
        const count = dailyCounts[dateKey];
        const match = sortedRules.find(r => count >= r.ordersCount);
        if (match) {
            totalReward += parseFloat(match.rewardAmount || 0);
        }
    });

    return totalReward;
}

function calculateLateness(startTimeStr, checkTimeStr) {
    if (!startTimeStr || !checkTimeStr) return null;
    const [sH, sM] = startTimeStr.split(':').map(Number);
    const [cH, cM] = checkTimeStr.split(':').map(Number);
    if (isNaN(sH) || isNaN(cH)) return null;

    const startMins = sH * 60 + (sM || 0);
    const checkMins = cH * 60 + (cM || 0);

    const diff = checkMins - startMins;
    if (diff <= 0) return null; // Arrived before or on shift start time

    const hours = Math.floor(diff / 60);
    const mins = diff % 60;

    if (currentAppLang === 'ar') {
        if (hours > 0) {
            return `${hours} ساعة ${mins > 0 ? `و ${mins} دقيقة` : ''} تأخير`;
        } else {
            return `${mins} دقيقة تأخير`;
        }
    } else {
        if (hours > 0) {
            return `${hours}h${mins > 0 ? ` ${mins}m` : ''} late`;
        } else {
            return `${mins}m late`;
        }
    }
}

function markWorkerAttendance(workerId, status) {
    const isAttAdmin = currentUser && (currentUser.role === 'admin' || document.body.classList.contains('perm-attendance'));
    if (!isAttAdmin) {
        alert(currentAppLang === 'ar' ? 'فقط الإدارة يمكنها تعديل الحضور مباشرة.' : 'Only administrators can mark worker attendance directly.');
        return;
    }

    // Determine date string from date picker, default to today
    let dateStr = document.getElementById('attendance-date-picker')?.value;
    if (!dateStr) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateStr = `${yyyy}-${mm}-${dd}`;
    }

    const worker = getCompanyData().workers.find(w => w.id === workerId);
    if (!worker) return;

    if (status === 'present') {
        const timeInput = document.getElementById(`att-time-${workerId}`);
        let checkTime = "";
        if (timeInput && timeInput.value) {
            checkTime = timeInput.value;
        } else {
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            checkTime = `${hh}:${mm}`;
        }
        let shiftStart = worker.startTime;
        const dateParts = dateStr.split('-');
        const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeekName = dayNames[dateObj.getDay()];
        const dateOverrideShift = (worker.shifts || []).find(s => s.dayOfWeek === dayOfWeekName || s.specificDate === dateStr);
        if (dateOverrideShift) {
            shiftStart = dateOverrideShift.startTime;
        }
        const lateness = calculateLateness(shiftStart, checkTime);

        db.ref(`companies/${currentCompany}/attendance/${dateStr}/${workerId}`).set({
            status: 'present',
            time: checkTime,
            lateness: lateness || '',
            timestamp: Date.now()
        })
            .then(() => {
                logActivity('attendance', workerId, worker.name, `Marked attendance as PRESENT for ${worker.name} on ${dateStr} (Check-in: ${checkTime}, Lateness: ${lateness || 'None'})`);
            })
            .catch(err => console.error("Error setting attendance present:", err));
    } else if (status === 'absent') {
        db.ref(`companies/${currentCompany}/attendance/${dateStr}/${workerId}`).set({
            status: 'absent',
            time: '',
            lateness: '',
            timestamp: Date.now()
        })
            .then(() => {
                logActivity('attendance', workerId, worker.name, `Marked attendance as ABSENT for ${worker.name} on ${dateStr}`);
            })
            .catch(err => console.error("Error setting attendance absent:", err));
    } else if (status === 'vacation') {
        db.ref(`companies/${currentCompany}/attendance/${dateStr}/${workerId}`).set({
            status: 'vacation',
            time: '',
            lateness: '',
            timestamp: Date.now()
        })
            .then(() => {
                logActivity('attendance', workerId, worker.name, `Marked attendance as VACATION for ${worker.name} on ${dateStr}`);
            })
            .catch(err => console.error("Error setting attendance vacation:", err));
    }
}

function clearWorkerAttendance(workerId) {
    const isAttAdmin = currentUser && (currentUser.role === 'admin' || document.body.classList.contains('perm-attendance'));
    if (!isAttAdmin) {
        alert(currentAppLang === 'ar' ? 'فقط الإدارة يمكنها مسح سجل الحضور.' : 'Only administrators can clear attendance records.');
        return;
    }
    let dateStr = document.getElementById('attendance-date-picker')?.value;
    if (!dateStr) return;
    const worker = getCompanyData().workers.find(w => w.id === workerId);
    const wName = worker ? worker.name : 'Unknown';

    if (confirm(currentAppLang === 'ar' ? 'هل تريد مسح سجل الحضور لهذا اليوم؟' : 'Do you want to clear the attendance record for this day?')) {
        db.ref(`companies/${currentCompany}/attendance/${dateStr}/${workerId}`).remove()
            .then(() => {
                logActivity('attendance_clear', workerId, wName, `Cleared attendance record for ${wName} on ${dateStr}`);
            })
            .catch(err => console.error("Error clearing attendance:", err));
    }
}

function setWorkerVacationStatus(markActive) {
    const workerId = document.getElementById('vacation-worker-select').value;
    const dateStr = document.getElementById('vacation-date-input').value;

    if (!workerId || !dateStr) {
        alert(currentAppLang === 'ar' ? 'الرجاء اختيار الموظف والتاريخ.' : 'Please select employee and date.');
        return;
    }

    const worker = getCompanyData().workers.find(w => w.id === workerId);
    if (!worker) return;

    if (markActive) {
        db.ref(`companies/${currentCompany}/attendance/${dateStr}/${workerId}`).set({
            status: 'vacation',
            time: '',
            lateness: '',
            timestamp: Date.now()
        })
        .then(() => {
            logActivity('attendance', workerId, worker.name, `Marked attendance as VACATION for ${worker.name} on ${dateStr}`);
            const mainDatePicker = document.getElementById('attendance-date-picker');
            if (mainDatePicker && mainDatePicker.value === dateStr) {
                renderAttendance();
            }
            alert(currentAppLang === 'ar' ? `تم تسجيل ${worker.name} في إجازة بنجاح!` : `Successfully marked ${worker.name} as on vacation!`);
        })
        .catch(err => console.error("Error setting attendance vacation:", err));
    } else {
        if (confirm(currentAppLang === 'ar' ? `هل تريد إزالة حالة الإجازة لـ ${worker.name} في ${dateStr}؟` : `Do you want to remove vacation status for ${worker.name} on ${dateStr}?`)) {
            db.ref(`companies/${currentCompany}/attendance/${dateStr}/${workerId}`).remove()
            .then(() => {
                logActivity('attendance_clear', workerId, worker.name, `Cleared attendance/vacation record for ${worker.name} on ${dateStr}`);
                const mainDatePicker = document.getElementById('attendance-date-picker');
                if (mainDatePicker && mainDatePicker.value === dateStr) {
                    renderAttendance();
                }
                alert(currentAppLang === 'ar' ? 'تمت إزالة الإجازة بنجاح!' : 'Vacation status removed successfully!');
            })
            .catch(err => console.error("Error clearing attendance vacation:", err));
        }
    }
}

function renderAttendance() {
    const isAr = currentAppLang === 'ar';
    const datePicker = document.getElementById('attendance-date-picker');
    if (datePicker && !datePicker.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        datePicker.value = `${yyyy}-${mm}-${dd}`;
    }

    const vacDatePicker = document.getElementById('vacation-date-input');
    if (vacDatePicker && !vacDatePicker.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        vacDatePicker.value = `${yyyy}-${mm}-${dd}`;
    }

    const dateStr = datePicker ? datePicker.value : '';
    if (!dateStr) return;

    const tbody = document.getElementById('attendance-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    const companyData = getCompanyData();
    const isAttAdmin = currentUser && (currentUser.role === 'admin' || document.body.classList.contains('perm-attendance'));
    const currentEmail = currentUser && currentUser.email ? currentUser.email.toLowerCase() : '';
    const myWorker = companyData.workers.find(w => w.email && w.email.toLowerCase() === currentEmail);
    const workerOnlyCard = document.querySelector('.attendance-worker-only');
    if (workerOnlyCard) {
        if (myWorker) {
            workerOnlyCard.style.display = 'block';
            document.body.classList.add('has-worker-profile');
        } else {
            workerOnlyCard.style.display = 'none';
            document.body.classList.remove('has-worker-profile');
        }
    }

    // Populate Late Config Inputs
    const graceInput = document.getElementById('late-grace-input');
    const penaltyInput = document.getElementById('late-penalty-input');
    if (graceInput && !graceInput.matches(':focus')) {
        graceInput.value = companyData.lateGraceMinutes !== undefined ? companyData.lateGraceMinutes : '';
    }
    if (penaltyInput && !penaltyInput.matches(':focus')) {
        penaltyInput.value = companyData.latePenaltySAR !== undefined ? companyData.latePenaltySAR : '';
    }

    const workers = companyData.workers || [];
    const attendanceMap = (companyData.attendance || {})[dateStr] || {};

    if (workers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">${isAr ? 'لا يوجد موظفون مسجلون.' : 'No workers registered.'}</td></tr>`;
        return;
    }

    workers.forEach(w => {
        let shiftStart = w.startTime;
        let shiftEnd = w.endTime;
        const dateParts = dateStr.split('-');
        const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeekName = dayNames[dateObj.getDay()];
        const dateOverrideShift = (w.shifts || []).find(s => s.dayOfWeek === dayOfWeekName || s.specificDate === dateStr);
        if (dateOverrideShift) {
            shiftStart = dateOverrideShift.startTime;
            shiftEnd = dateOverrideShift.endTime;
        }
        const scheduled = (shiftStart && shiftEnd) ? `${shiftStart} - ${shiftEnd}` : (isAr ? 'لا يوجد' : 'None');
        const att = attendanceMap[w.id];

        let statusHtml = '';
        let checkinTimeHtml = '--';
        let latenessHtml = '--';

        if (!att) {
            statusHtml = `<span class="badge" style="background:var(--text-muted);">${isAr ? 'لم يُسجل' : 'Not Marked'}</span>`;
        } else if (att.status === 'present') {
            statusHtml = `<span class="badge badge-good" style="display:inline-flex; align-items:center; gap:4px; font-weight:700;">✔️ ${isAr ? 'حاضر' : 'Present'}</span>`;
            checkinTimeHtml = att.time || '--';
            if (att.lateness) {
                latenessHtml = `<span style="color:var(--danger); font-weight:700;">⚠️ ${att.lateness}</span>`;
            } else {
                latenessHtml = `<span style="color:var(--success); font-weight:700;">✅ ${isAr ? 'في الوقت' : 'On Time'}</span>`;
            }
        } else if (att.status === 'absent') {
            statusHtml = `<span class="badge badge-bad" style="display:inline-flex; align-items:center; gap:4px; font-weight:700;">❌ ${isAr ? 'غائب' : 'Absent'}</span>`;
        } else if (att.status === 'vacation') {
            statusHtml = `<span class="badge" style="display:inline-flex; align-items:center; gap:4px; font-weight:700; background:#0284c7; color:white;">🌴 ${isAr ? 'إجازة' : 'Vacation'}</span>`;
        }

        let exitHtml = '';
        let exitActionBtn = '';
        if (att && att.exitRequest) {
            const req = att.exitRequest;
            if (req.status === 'pending') {
                exitHtml = `<div style="font-size:0.75rem; color:#d97706; font-weight:600; margin-top:4px;">🚪 Exit Req: ${req.time} (${req.reason})</div>`;
                exitActionBtn = `
                    <button onclick="handleExitRequest('${w.id}', 'approve')" class="btn-success" style="padding: 4px 8px; font-size: 0.8rem; background:#16a34a; border-color:#16a34a;" title="${isAr ? 'موافقة خروج' : 'Approve Exit'}">🚪✔️</button>
                    <button onclick="handleExitRequest('${w.id}', 'reject')" class="btn-danger" style="padding: 4px 8px; font-size: 0.8rem;" title="${isAr ? 'رفض خروج' : 'Reject Exit'}">🚪❌</button>
                `;
            } else if (req.status === 'approved') {
                exitHtml = `<div style="font-size:0.75rem; color:#dc2626; font-weight:600; margin-top:4px;">🚪 OUT (since ${req.time})</div>`;
                exitActionBtn = `
                    <button onclick="handleExitRequest('${w.id}', 'returned')" class="btn-warning" style="padding: 4px 8px; font-size: 0.8rem; background:#d97706; border-color:#d97706;" title="${isAr ? 'تمت العودة' : 'Worker Returned'}">↩️ Returned</button>
                `;
            } else if (req.status === 'rejected') {
                exitHtml = `<div style="font-size:0.75rem; color:#dc2626; font-weight:600; margin-top:4px;">🚪 Exit Rejected</div>`;
            } else if (req.status === 'returned') {
                const retTimeStr = new Date(req.returnedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                exitHtml = `<div style="font-size:0.75rem; color:var(--info); font-weight:600; margin-top:4px;">🚪 Out: ${req.time} - Back: ${retTimeStr}</div>`;
            }
        }

        const todayNow = new Date();
        const hhNow = String(todayNow.getHours()).padStart(2, '0');
        const mmNow = String(todayNow.getMinutes()).padStart(2, '0');
        const currentTimeString = (att && att.status === 'present' && att.time) ? att.time : `${hhNow}:${mmNow}`;

        let actionsHtml = '';
        if (isAttAdmin) {
            actionsHtml = `
                <div style="display:inline-flex; align-items:center; gap:4px;">
                    ${exitActionBtn}
                    <input type="time" id="att-time-${w.id}" value="${currentTimeString}" style="padding: 4px; font-size: 0.8rem; width: 85px; background: var(--input-bg); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-main);" />
                    <button onclick="markWorkerAttendance('${w.id}', 'present')" class="btn-success" style="padding: 4px 8px; font-size: 0.8rem;" title="${isAr ? 'تسجيل حضور' : 'Mark Present'}">✔️</button>
                    <button onclick="markWorkerAttendance('${w.id}', 'absent')" class="btn-danger" style="padding: 4px 8px; font-size: 0.8rem;" title="${isAr ? 'تسجيل غياب' : 'Mark Absent'}">❌</button>
                    <button onclick="clearWorkerAttendance('${w.id}')" class="btn-outline" style="padding: 4px 8px; font-size: 0.8rem;" title="${isAr ? 'إعادة تعيين' : 'Reset'}">🔄</button>
                </div>
            `;
        } else if (myWorker && w.id === myWorker.id) {
            const todayDateStr = `${todayNow.getFullYear()}-${String(todayNow.getMonth() + 1).padStart(2, '0')}-${String(todayNow.getDate()).padStart(2, '0')}`;
            if (dateStr !== todayDateStr) {
                // Past or future date: non-admin worker cannot edit attendance
                if (att && att.status === 'present') {
                    actionsHtml = `<span style="color:var(--success); font-weight:700; font-size:0.85rem;">✅ ${isAr ? 'حاضر' : 'Present'}</span>`;
                } else if (att && att.status === 'absent') {
                    actionsHtml = `<span style="color:var(--danger); font-weight:700; font-size:0.85rem;">❌ ${isAr ? 'غائب' : 'Absent'}</span>`;
                } else if (att && att.status === 'vacation') {
                    actionsHtml = `<span style="color:#0284c7; font-weight:700; font-size:0.85rem;">🌴 ${isAr ? 'إجازة' : 'Vacation'}</span>`;
                } else {
                    actionsHtml = `<span style="color:var(--text-muted); font-size:0.85rem;">🔒 ${isAr ? 'انتهى التسجيل' : 'Locked'}</span>`;
                }
            } else if (att && att.status === 'vacation') {
                actionsHtml = `<span style="color:#0284c7; font-weight:700; font-size:0.85rem;">🌴 ${isAr ? 'إجازة' : 'Vacation'}</span>`;
            } else if (!att) {
                actionsHtml = `
                    <button onclick="markWorkerSelfAttendance()" class="btn-success" style="padding: 6px 12px; font-size: 0.8rem; font-weight:700;" title="${isAr ? 'تسجيل حضور' : 'Check-In'}">✔️ ${isAr ? 'حضور' : 'Check-In'}</button>
                `;
            } else if (att.status === 'present') {
                actionsHtml = `<span style="color:var(--success); font-weight:700; font-size:0.85rem;">✅ ${isAr ? 'تم تسجيل الحضور' : 'Checked In'}</span>`;
            } else {
                actionsHtml = `<span style="color:var(--danger); font-weight:700; font-size:0.85rem;">❌ ${isAr ? 'غائب' : 'Absent'}</span>`;
            }
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong style="color:var(--text-main); display:block;">${w.name}</strong>
                <span style="font-size:0.75rem; color:var(--text-muted);">${w.role || ''}</span>
                ${exitHtml}
            </td>
            <td>${statusHtml}</td>
            <td style="font-weight: 500;">${scheduled}</td>
            <td style="font-family: monospace; font-weight: 600;">${checkinTimeHtml}</td>
            <td>${latenessHtml}</td>
            <td>${actionsHtml}</td>
        `;
        tbody.appendChild(tr);
    });

    // Render worker self-view exit request status
    const workerExitRequestDiv = document.getElementById('worker-active-exit-request');
    if (workerExitRequestDiv) {
        workerExitRequestDiv.innerHTML = '';
        workerExitRequestDiv.style.display = 'none';
        if (myWorker) {
            const myAtt = attendanceMap[myWorker.id];
            if (myAtt && myAtt.exitRequest) {
                const req = myAtt.exitRequest;
                workerExitRequestDiv.style.display = 'block';
                let statusText = '';
                let statusColor = '';
                if (req.status === 'pending') {
                    statusText = isAr 
                        ? `⏳ قيد الانتظار: طلب الخروج في ${req.time} (السبب: ${req.reason})` 
                        : `⏳ Pending: Exit requested for ${req.time} (Reason: ${req.reason})`;
                    statusColor = '#d97706';
                } else if (req.status === 'approved') {
                    statusText = isAr 
                        ? `🟢 تمت الموافقة: يمكنك الخروج الآن. وقت الخروج المعتمد: ${req.time}` 
                        : `🟢 Approved: You may exit now. Out since ${req.time}`;
                    statusColor = 'var(--success)';
                } else if (req.status === 'rejected') {
                    statusText = isAr 
                        ? `❌ تم الرفض: تم رفض طلب الخروج` 
                        : `❌ Rejected: Exit request was rejected`;
                    statusColor = 'var(--danger)';
                } else if (req.status === 'returned') {
                    const retTimeStr = new Date(req.returnedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    statusText = isAr 
                        ? `✅ تمت العودة: عدت إلى العمل في ${retTimeStr}` 
                        : `✅ Returned: Checked back in at ${retTimeStr}`;
                    statusColor = 'var(--info)';
                }
                workerExitRequestDiv.innerHTML = `
                    <div style="padding: 12px; border-radius: var(--radius-md); background: var(--input-bg); border: 1px solid ${statusColor}; color: ${statusColor}; font-weight: 700; font-size: 0.9rem;">
                        ${statusText}
                    </div>
                `;
            }
        }
    }
    renderLateRules();
}

// --- ACTIVITY LOG SYSTEM ---

function logActivity(type, workerId, workerName, details) {
    if (!currentCompany) return;
    const activityId = 'act-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    let actorName = 'System';
    let actorId = 'system';
    if (currentUser) {
        actorId = currentUser.uid || currentUser.email;
        const email = currentUser.email.toLowerCase();
        if (email === 'kinan.rahal@hotmail.com') {
            actorName = currentAppLang === 'ar' ? 'كينان (المالك)' : 'Kinan (Owner)';
        } else {
            const companyData = getCompanyData();
            const workers = companyData.workers || [];
            const w = workers.find(wk => wk.email && wk.email.toLowerCase() === email);
            if (w) {
                actorName = w.name;
            } else {
                actorName = currentUser.email.split('@')[0];
            }
        }
    }

    const logObj = {
        id: activityId,
        type: type,
        workerId: workerId || 'general',
        workerName: workerName || 'General',
        actorId: actorId,
        actorName: actorName,
        details: details,
        timestamp: Date.now()
    };

    db.ref(`companies/${currentCompany}/activityLogs/${activityId}`).set(logObj)
        .catch(err => console.error("Error writing activity log:", err));
}

function translateActivityLogDetails(details) {
    if (!details) return '';
    const lang = (typeof currentAppLang !== 'undefined' ? currentAppLang : localStorage.getItem("burgeroov_lang")) || 'en';
    if (lang !== 'ar') return details;

    // Warehouse Operations
    if (details.startsWith('Added new warehouse item "')) {
        const rest = details.replace('Added new warehouse item "', '');
        const name = rest.split('" with initial stock ')[0];
        const stock = rest.split('" with initial stock ')[1];
        return `تم إضافة صنف مستودع جديد "${name}" بمخزون أولي ${stock}`;
    }
    if (details.startsWith('Updated stock of "')) {
        const rest = details.replace('Updated stock of "', '');
        const name = rest.split('" to ')[0];
        const rest2 = rest.split('" to ')[1];
        const newStock = rest2.split(' (Difference: ')[0];
        const diff = rest2.split(' (Difference: ')[1].slice(0, -1);
        return `تم تحديث مخزون "${name}" إلى ${newStock} (الفرق: ${diff})`;
    }
    if (details.startsWith('Changed Max/Full Stock of "')) {
        const rest = details.replace('Changed Max/Full Stock of "', '');
        const name = rest.split('" to ')[0];
        const parsed = rest.split('" to ')[1];
        return `تم تغيير الحد الأقصى لمخزون "${name}" إلى ${parsed}`;
    }
    if (details.startsWith('Deleted warehouse item "')) {
        const name = details.replace('Deleted warehouse item "', '').slice(0, -1);
        return `تم حذف صنف المستودع "${name}"`;
    }
    if (details.startsWith('Moved item "')) {
        const rest = details.replace('Moved item "', '');
        const name = rest.split('" from category "')[0];
        const rest2 = rest.split('" from category "')[1];
        const oldCat = rest2.split('" to "')[0];
        const folderName = rest2.split('" to "')[1].slice(0, -1);
        return `تم نقل الصنف "${name}" من الفئة "${oldCat}" إلى "${folderName}"`;
    }

    // Financial Operations
    if (details.startsWith('Logged advance payment of SAR')) {
        const rest = details.replace('Logged advance payment of SAR ', '');
        const amount = rest.split(' for ')[0];
        const wName = rest.split(' for ')[1];
        return `تم تسجيل دفعة مقدمة (سلفة) بقيمة ${amount} ريال للموظف ${wName}`;
    }
    if (details.startsWith('Deleted advance payment record for')) {
        const wName = details.replace('Deleted advance payment record for ', '');
        return `تم حذف سجل الدفعة المقدمة (السلفة) للموظف ${wName}`;
    }
    if (details.startsWith('Logged reward/bonus of SAR')) {
        const rest = details.replace('Logged reward/bonus of SAR ', '');
        const amount = rest.split(' for ')[0];
        const wName = rest.split(' for ')[1];
        return `تم تسجيل مكافأة بقيمة ${amount} ريال للموظف ${wName}`;
    }
    if (details.startsWith('Deleted reward/bonus record for')) {
        const wName = details.replace('Deleted reward/bonus record for ', '');
        return `تم حذف سجل المكافأة للموظف ${wName}`;
    }
    if (details.startsWith('Logged custody item "')) {
        const rest = details.replace('Logged custody item "', '');
        const type = rest.split('" (SAR ')[0];
        const rest2 = rest.split('" (SAR ')[1];
        const amount = rest2.split(') for ')[0];
        const wName = rest2.split(') for ')[1];
        return `تم تسجيل عهدة "${type}" (بقيمة ${amount} ريال) للموظف ${wName}`;
    }
    if (details.startsWith('Deleted custody record for')) {
        const wName = details.replace('Deleted custody record for ', '');
        return `تم حذف سجل العهدة للموظف ${wName}`;
    }
    if (details.startsWith('Set initial carryover balance of SAR')) {
        const rest = details.replace('Set initial carryover balance of SAR ', '');
        const amount = rest.split(' for ')[0];
        const wName = rest.split(' for ')[1];
        return `تم تعيين الرصيد الافتتاحي المرحل بقيمة ${amount} ريال للموظف ${wName}`;
    }

    // Sales and Costs Entries/Undos
    if (details.startsWith('Entered sale transaction of SAR')) {
        const rest = details.replace('Entered sale transaction of SAR ', '');
        const amount = rest.split(' via ')[0];
        const method = rest.split(' via ')[1];
        return `تم تسجيل عملية مبيعات بقيمة ${amount} ريال عبر ${method}`;
    }
    if (details.startsWith('Deleted/Undid sale transaction of SAR')) {
        const rest = details.replace('Deleted/Undid sale transaction of SAR ', '');
        const amount = rest.split(' via ')[0];
        const method = rest.split(' via ')[1];
        return `تم التراجع عن/حذف عملية مبيعات بقيمة ${amount} ريال عبر ${method}`;
    }
    if (details.startsWith('Entered cost transaction of SAR')) {
        const rest = details.replace('Entered cost transaction of SAR ', '');
        const amount = rest.split(' for category "')[0];
        const cat = rest.split(' for category "')[1].slice(0, -1);
        return `تم تسجيل مصاريف بقيمة ${amount} ريال للفئة "${cat}"`;
    }
    if (details.startsWith('Deleted/Undid cost transaction of SAR')) {
        const rest = details.replace('Deleted/Undid cost transaction of SAR ', '');
        const amount = rest.split(' for category "')[0];
        const cat = rest.split(' for category "')[1].slice(0, -1);
        return `تم التراجع عن/حذف مصاريف بقيمة ${amount} ريال للفئة "${cat}"`;
    }
    if (details.startsWith('Entered past cost transaction of SAR')) {
        const rest = details.replace('Entered past cost transaction of SAR ', '');
        const amount = rest.split(' for category "')[0];
        const rest2 = rest.split(' for category "')[1];
        const cat = rest2.split('" on date ')[0];
        const dateStr = rest2.split('" on date ')[1];
        return `تم تسجيل مصاريف سابقة بقيمة ${amount} ريال للفئة "${cat}" بتاريخ ${dateStr}`;
    }

    // Attendance
    if (details.startsWith('Marked attendance as PRESENT for')) {
        const rest = details.replace('Marked attendance as PRESENT for ', '');
        const wName = rest.split(' on ')[0];
        const rest2 = rest.split(' on ')[1];
        const dateStr = rest2.split(' (Check-in: ')[0];
        const checkinParts = rest2.split(' (Check-in: ')[1].slice(0, -1);
        const checkTime = checkinParts.split(', Lateness: ')[0];
        const lateness = checkinParts.split(', Lateness: ')[1];
        const latenessTranslated = lateness === 'None' ? 'لا يوجد' : lateness;
        return `تم تسجيل حضور الموظف ${wName} بتاريخ ${dateStr} (وقت الدخول: ${checkTime}، التأخير: ${latenessTranslated})`;
    }
    if (details.startsWith('Marked attendance as ABSENT for')) {
        const rest = details.replace('Marked attendance as ABSENT for ', '');
        const wName = rest.split(' on ')[0];
        const dateStr = rest.split(' on ')[1];
        return `تم تسجيل غياب الموظف ${wName} بتاريخ ${dateStr}`;
    }
    if (details.startsWith('Cleared attendance record for')) {
        const rest = details.replace('Cleared attendance record for ', '');
        const wName = rest.split(' on ')[0];
        const dateStr = rest.split(' on ')[1];
        return `تم مسح سجل حضور الموظف ${wName} بتاريخ ${dateStr}`;
    }

    // 1. Posted a performance note: "${text}" (${detailsStr})
    if (details.startsWith('Posted a performance note:')) {
        const quoteStart = details.indexOf('"');
        const quoteEnd = details.lastIndexOf('"');
        const text = details.slice(quoteStart + 1, quoteEnd);
        const detailsStr = details.includes('(Public)') ? 'عام' : 'خاص';
        return `قام بنشر ملاحظة تقييم: "${text}" (${detailsStr})`;
    }

    // 2. Deleted performance note (ID: ${id})
    if (details.startsWith('Deleted performance note')) {
        const id = details.replace('Deleted performance note (ID: ', '').replace(')', '');
        return `تم حذف ملاحظة التقييم (رقم التعريف: ${id})`;
    }

    // 3. Added violation to ${worker.name}: "${record.reason}" (SAR ${record.amount})
    if (details.startsWith('Added violation to')) {
        const parts = details.replace('Added violation to ', '').split(': "');
        const workerName = parts[0];
        const rest = parts[1] || '';
        const reason = rest.slice(0, rest.lastIndexOf('"'));
        const amount = rest.slice(rest.lastIndexOf('SAR ') + 4, rest.lastIndexOf(')'));
        return `تم إضافة مخالفة للموظف ${workerName}: "${reason}" (SAR ${amount})`;
    }

    // 4. Deleted violation record from ${worker.name}
    if (details.startsWith('Deleted violation record from')) {
        const workerName = details.replace('Deleted violation record from ', '');
        return `تم حذف سجل المخالفة للموظف ${workerName}`;
    }

    // 5. ${worker.name} delivered: "${details}"
    if (details.includes(' delivered: "')) {
        const workerName = details.split(' delivered: "')[0];
        const orderDetails = details.split(' delivered: "')[1].slice(0, -1);
        return `قام الموظف ${workerName} بتسليم: "${orderDetails}"`;
    }

    // Payment Requests Lifecycle
    if (details.startsWith('Accepted payment request of SAR')) {
        const rest = details.replace('Accepted payment request of SAR ', '');
        const amount = rest.split(' for ')[0];
        const workerName = rest.split(' for ')[1];
        return `تم قبول طلب سلفة بقيمة SAR ${amount} للموظف ${workerName}`;
    }
    if (details.startsWith('Undid acceptance of payment request of SAR')) {
        const rest = details.replace('Undid acceptance of payment request of SAR ', '');
        const amount = rest.split(' for ')[0];
        const workerName = rest.split(' for ')[1];
        return `تم التراجع عن قبول طلب سلفة بقيمة SAR ${amount} للموظف ${workerName}`;
    }
    if (details.startsWith('Rejected payment request of SAR')) {
        const rest = details.replace('Rejected payment request of SAR ', '');
        const amount = rest.split(' for ')[0];
        const workerName = rest.split(' for ')[1];
        return `تم رفض طلب سلفة بقيمة SAR ${amount} للموظف ${workerName}`;
    }
    if (details.startsWith('Released payment request of SAR')) {
        const rest = details.replace('Released payment request of SAR ', '');
        const amount = rest.split(' to ')[0];
        const workerName = rest.split(' to ')[1];
        return `تم تسليم سلفة بقيمة SAR ${amount} للموظف ${workerName}`;
    }



    // 9. Added system violation to ${worker.name}: "${reason}" (Violation Count: ${count}/6)
    if (details.startsWith('Added system violation to')) {
        const rest = details.replace('Added system violation to ', '');
        const workerName = rest.split(': "')[0];
        const reasonPart = rest.split(': "')[1] || '';
        const reason = reasonPart.slice(0, reasonPart.lastIndexOf('"'));
        const count = reasonPart.slice(reasonPart.lastIndexOf('Violation Count: ') + 17, reasonPart.lastIndexOf(')'));
        return `تم إضافة مخالفة نظامية للموظف ${workerName}: "${reason}" (عدد المخالفات: ${count})`;
    }

    // 10. Removed system violation from ${worker.name}: "${reason}"
    if (details.startsWith('Removed system violation from')) {
        const rest = details.replace('Removed system violation from ', '');
        const workerName = rest.split(': "')[0];
        const reasonPart = rest.split(': "')[1] || '';
        const reason = reasonPart.slice(0, -1);
        return `تم إزالة مخالفة نظامية من الموظف ${workerName}: "${reason}"`;
    }

    return details;
}

function renderActivityLog() {
    const isAr = currentAppLang === 'ar';
    const listDiv = document.getElementById('activity-log-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';

    const companyData = getCompanyData();
    const logsMap = companyData.activityLogs || {};
    const logsList = Object.values(logsMap);

    if (logsList.length === 0) {
        listDiv.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.9rem; padding: 20px 0;">${isAr ? 'لا توجد أنشطة مسجلة اليوم.' : 'No activities logged today.'}</p>`;
        return;
    }

    logsList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const filterVal = document.getElementById('activity-filter')?.value || 'all';
    const dateFromVal = document.getElementById('activity-date-from')?.value;
    const dateToVal = document.getElementById('activity-date-to')?.value;

    const startOfDayMs = dateFromVal ? new Date(dateFromVal + 'T00:00:00').getTime() : null;
    const endOfDayMs = dateToVal ? new Date(dateToVal + 'T23:59:59.999').getTime() : null;

    let filtered = logsList;
    if (filterVal !== 'all') {
        filtered = filtered.filter(log => {
            if (filterVal === 'sales') {
                return log.type === 'sales' || log.type === 'sales_delete';
            }
            if (filterVal === 'costs') {
                return log.type === 'costs' || log.type === 'costs_delete';
            }
            if (filterVal === 'finance') {
                return log.type === 'finance' || log.type === 'finance_delete';
            }
            if (filterVal === 'task') {
                return log.type === 'task' || log.type === 'task_delete';
            }
            if (filterVal === 'violation') {
                return log.type === 'violation';
            }
            if (filterVal === 'perf_note') {
                return log.type === 'perf_note';
            }
            if (filterVal === 'attendance') {
                return log.type === 'attendance' || log.type === 'attendance_clear';
            }
            if (filterVal === 'delivery') {
                return log.type === 'delivery';
            }
            if (filterVal === 'warehouse') {
                return log.type === 'warehouse' || log.type === 'warehouse_delete';
            }
            return log.type === filterVal;
        });
    }
    if (startOfDayMs) {
        filtered = filtered.filter(log => log.timestamp >= startOfDayMs);
    }
    if (endOfDayMs) {
        filtered = filtered.filter(log => log.timestamp <= endOfDayMs);
    }

    if (filtered.length === 0) {
        listDiv.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.9rem; padding: 20px 0;">${isAr ? 'لا توجد أنشطة تطابق هذا التصنيف أو التواريخ المحددة.' : 'No activities matching this category or date range.'}</p>`;
        return;
    }

    filtered.forEach(log => {
        const dateStr = new Date(log.timestamp).toLocaleString(isAr ? 'ar-EG' : 'en-US');

        let typeBadge = '';
        if (log.type === 'delivery') {
            typeBadge = `<span class="badge" style="background:#3b82f6; color:white; font-weight:700;">🚚 ${isAr ? 'توصيل' : 'Delivery'}</span>`;
        } else if (log.type === 'finance' || log.type === 'finance_delete') {
            typeBadge = `<span class="badge" style="background:#10b981; color:white; font-weight:700;">💰 ${isAr ? 'مالية' : 'Finance'}</span>`;
        } else if (log.type === 'violation') {
            typeBadge = `<span class="badge" style="background:#ef4444; color:white; font-weight:700;">⚠️ ${isAr ? 'مخالفة' : 'Violation'}</span>`;
        } else if (log.type === 'perf_note') {
            typeBadge = `<span class="badge" style="background:#f59e0b; color:white; font-weight:700;">📝 ${isAr ? 'ملاحظة تقييم' : 'Performance Note'}</span>`;
        } else if (log.type === 'sales' || log.type === 'sales_delete') {
            typeBadge = `<span class="badge" style="background:#ec4899; color:white; font-weight:700;">📈 ${isAr ? 'مبيعات' : 'Sales'}</span>`;
        } else if (log.type === 'costs' || log.type === 'costs_delete') {
            typeBadge = `<span class="badge" style="background:#f43f5e; color:white; font-weight:700;">📉 ${isAr ? 'مصاريف' : 'Costs'}</span>`;
        } else if (log.type === 'task' || log.type === 'task_delete') {
            typeBadge = `<span class="badge" style="background:#8b5cf6; color:white; font-weight:700;">📋 ${isAr ? 'مهام' : 'Tasks'}</span>`;
        } else if (log.type === 'attendance' || log.type === 'attendance_clear') {
            typeBadge = `<span class="badge" style="background:#06b6d4; color:white; font-weight:700;">📅 ${isAr ? 'حضور وغياب' : 'Attendance'}</span>`;
        } else if (log.type === 'warehouse' || log.type === 'warehouse_delete') {
            typeBadge = `<span class="badge" style="background:#0f766e; color:white; font-weight:700;">📦 ${isAr ? 'مستودع' : 'Warehouse'}</span>`;
        }

        const card = document.createElement('div');
        card.className = 'ledger-card';
        card.style.borderLeft = '4px solid var(--text-muted)';
        card.style.padding = '12px 16px';
        card.style.background = 'var(--card-bg)';
        card.style.borderRadius = '8px';
        card.style.marginBottom = '8px';
        card.style.boxShadow = 'var(--shadow-sm)';

        const deleteBtn = `<button onclick="deleteActivityLog('${log.id}')" class="btn-outline-danger" style="padding: 2px 6px; font-size: 0.7rem; line-height: 1; border: none; border-radius: 4px; margin-left: 8px;" title="${isAr ? 'حذف النشاط' : 'Delete Activity'}">🗑️</button>`;

        card.innerHTML = `
            <div class="flex-between" style="align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
                <div>
                    ${typeBadge}
                    <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 8px;">🕒 ${dateStr}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">${isAr ? 'بواسطة: ' : 'By: '} <strong style="color:var(--text-main);">${log.actorName || 'System'}</strong></span>
                    ${deleteBtn}
                </div>
            </div>
            <div style="font-size: 0.9rem; color: var(--text-main); font-weight: 500; line-height: 1.4;">
                ${translateActivityLogDetails(log.details)}
            </div>
        `;
        listDiv.appendChild(card);
    });
}

function deleteActivityLog(activityId) {
    const isAr = currentAppLang === 'ar';
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذا النشاط من السجل؟' : 'Are you sure you want to delete this activity log?')) {
        db.ref(`companies/${currentCompany}/activityLogs/${activityId}`).remove()
            .catch(err => console.error("Error deleting activity log:", err));
    }
}

// Bind to window
window.markWorkerAttendance = markWorkerAttendance;
window.clearWorkerAttendance = clearWorkerAttendance;
window.renderAttendance = renderAttendance;
window.addManager = addManager;
window.deleteManager = deleteManager;
window.logActivity = logActivity;
window.renderActivityLog = renderActivityLog;
window.deleteActivityLog = deleteActivityLog;

// --- SYSTEM VIOLATIONS SYSTEM ---

function getSystemViolationDeductionsForMonth(worker, monthStr) {
    const list = worker.systemViolations || [];
    const sorted = [...list].sort((a, b) => a.timestamp - b.timestamp);
    let totalDeduction = 0;
    const base = parseFloat(worker.income || 0);
    const dayRate = base / 30;

    sorted.forEach((viol, idx) => {
        const violDate = new Date(viol.timestamp);
        const violMonth = `${violDate.getFullYear()}-${String(violDate.getMonth() + 1).padStart(2, '0')}`;
        if (violMonth === monthStr) {
            if (idx === 2) {
                totalDeduction += Math.round(dayRate * 1);
            } else if (idx === 3) {
                totalDeduction += Math.round(dayRate * 3);
            } else if (idx === 4) {
                totalDeduction += Math.round(dayRate * 7);
            }
        }
    });
    return totalDeduction;
}

function getSystemViolationLogsForMonth(worker, monthStr) {
    const list = worker.systemViolations || [];
    const sorted = [...list].sort((a, b) => a.timestamp - b.timestamp);
    const base = parseFloat(worker.income || 0);
    const dayRate = base / 30;
    const logs = [];

    sorted.forEach((viol, idx) => {
        const violDate = new Date(viol.timestamp);
        const violMonth = `${violDate.getFullYear()}-${String(violDate.getMonth() + 1).padStart(2, '0')}`;
        if (violMonth === monthStr) {
            if (idx === 2) {
                logs.push({ text: `Violation #3: -1 Day Salary`, amount: Math.round(dayRate * 1) });
            } else if (idx === 3) {
                logs.push({ text: `Violation #4: -3 Days Salary`, amount: Math.round(dayRate * 3) });
            } else if (idx === 4) {
                logs.push({ text: `Violation #5: -7 Days Salary`, amount: Math.round(dayRate * 7) });
            } else {
                logs.push({ text: `Violation #${idx + 1}: warning`, amount: 0 });
            }
        }
    });
    return logs;
}

function checkWorkerSystemViolationAlerts(worker) {
    if (!worker) return;
    const count = (worker.systemViolations || []).length;
    const ack = worker.alertsAcknowledged || {};

    if (count === 1 && !ack.warning1) {
        showWorkerAlertOverlay(
            "Official Warning: First System Violation",
            "تنبيه رسمي: المخالفة النظامية الأولى",
            "You have received your first system violation. Please note that further violations will lead to salary deductions and potential termination. Ensure you follow all facility rules and regulations.",
            "لقد تم تسجيل المخالفة النظامية الأولى بحقك. يرجى العلم بأن تكرار المخالفات سيؤدي إلى خصومات مالية من الراتب وقد يصل إلى الفصل النهائي. يرجى الالتزام بكافة التعليمات والأنظمة.",
            "warning1",
            worker.id
        );
    } else if (count === 2 && !ack.warning2) {
        showWorkerAlertOverlay(
            "URGENT Warning: Salary Cut-off Impending",
            "تنبيه عاجل: خصم وشيك من الراتب",
            "This is your SECOND system violation. This is a final warning before salary deductions begin. Your next violation will result in an automatic deduction of one day's salary. Please review your conduct immediately.",
            "هذا هو التنبيه النظامي الثاني بحقك. هذا هو الإنذار النهائي قبل البدء بالخصومات المالية من راتبك. المخالفة القادمة ستؤدي إلى خصم تلقائي لقيمة يوم عمل كامل من راتبك الشهري. يرجى مراجعة سلوكك فوراً.",
            "warning2",
            worker.id
        );
    } else if (count >= 6 && !worker.unlockedClose) {
        const listStr = (worker.systemViolations || []).map((v, i) => `${i + 1}. ${v.reason}`).join('<br>');
        showWorkerAlertOverlay(
            "Your Account has been Terminated",
            "تم فصلك عن العمل نهائياً",
            `Your employment has been permanently terminated due to system violations. Details:<br>${listStr}`,
            `تم فصلك عن العمل نهائيا للاسباب التالية :<br>${listStr}<br><br>لن يتم احتساب اي ساعة عمل لك بعد هذه الرسالة يرجى مراجعة الادارة لتصفية حساباتك وسيتم اتخاذ اللازم.`,
            "block",
            worker.id
        );
    } else {
        const m = document.getElementById('worker-alert-modal');
        if (m && !m.classList.contains('permanent-block-modal')) {
            m.remove();
        }
    }
}

function showWorkerAlertOverlay(titleEn, titleAr, msgEn, msgAr, type, workerId) {
    if (document.getElementById('worker-alert-modal')) return;

    const isAr = currentAppLang === 'ar';
    const modal = document.createElement('div');
    modal.id = 'worker-alert-modal';
    if (type === 'block') {
        modal.classList.add('permanent-block-modal');
    }
    modal.style = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.85);
        display: flex; align-items: center; justify-content: center;
        z-index: 100000;
        padding: 20px;
        backdrop-filter: blur(8px);
    `;

    const content = document.createElement('div');
    content.className = 'card';
    content.style = `
        max-width: 600px;
        width: 100%;
        background: var(--card-bg);
        border: 2px solid var(--danger);
        border-radius: 16px;
        padding: 30px;
        box-shadow: var(--shadow-lg);
        text-align: center;
    `;

    const enHtml = `
        <div style="direction: ltr; margin-bottom: 20px; border-bottom: 1px dashed var(--border-color); padding-bottom: 20px;">
            <h2 style="color: var(--danger); margin-bottom: 12px; font-size: 1.5rem;">🚨 ${titleEn}</h2>
            <p style="font-size: 1rem; color: var(--text-main); line-height: 1.5; font-weight: 500; text-align: left;">${msgEn}</p>
        </div>
    `;

    const arHtml = `
        <div style="direction: rtl; margin-bottom: 25px;">
            <h2 style="color: var(--danger); margin-bottom: 12px; font-size: 1.5rem;">🚨 ${titleAr}</h2>
            <p style="font-size: 1rem; color: var(--text-main); line-height: 1.5; font-weight: 500; text-align: right;">${msgAr}</p>
        </div>
    `;

    let buttonHtml = '';
    if (type === 'block') {
        buttonHtml = `<p style="font-weight:700; color:var(--danger); font-size:1.1rem; border: 2px solid var(--danger); padding: 12px; border-radius: 8px; background:var(--danger-bg); margin-top:20px; direction:rtl;">
            الرجاء مراجعة الإدارة لتصفية حساباتك.
        </p>`;
    } else {
        buttonHtml = `
            <button onclick="confirmWorkerAlert('${workerId}', '${type}')" class="btn-danger" style="padding: 12px 30px; font-size: 1.05rem; font-weight: 800; border-radius: 8px; cursor: pointer; width: 100%; box-shadow: var(--shadow-md);">
                لقد قرأت الرسالة وأؤكد فهمي لها | Confirm & Close
            </button>
        `;
    }

    content.innerHTML = enHtml + arHtml + buttonHtml;
    modal.appendChild(content);
    document.body.appendChild(modal);
}

function confirmWorkerAlert(workerId, type) {
    const workers = getCompanyData().workers || [];
    const idx = workers.findIndex(w => w.id === workerId);
    if (idx === -1) return;

    db.ref(`companies/${currentCompany}/workers/${idx}/alertsAcknowledged/${type}`).set(true)
        .then(() => {
            const m = document.getElementById('worker-alert-modal');
            if (m) m.remove();
        })
        .catch(err => console.error("Error acknowledging alert:", err));
}

function renderSelectedWorkerSysViolations() {
    const workerId = document.getElementById('sys-viol-worker-select')?.value;
    const listUl = document.getElementById('sys-viol-list');
    const unlockedSection = document.getElementById('sys-viol-unlocked-section');
    const statusLabel = document.getElementById('sys-viol-status-label');
    const unlockBtn = document.getElementById('sys-viol-unlock-btn');

    if (!listUl) return;
    listUl.innerHTML = '';

    if (!workerId) {
        if (unlockedSection) unlockedSection.style.display = 'none';
        return;
    }

    const worker = getCompanyData().workers.find(w => w.id === workerId);
    if (!worker) return;

    const list = worker.systemViolations || [];
    const count = list.length;

    list.forEach((v, index) => {
        const li = document.createElement('li');
        li.style = "display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--input-bg); margin-bottom:8px; border-radius:6px; border:1px solid var(--border-color); font-size:0.9rem;";
        const dateStr = new Date(v.timestamp).toLocaleDateString();
        li.innerHTML = `
            <div>
                <strong style="color:var(--text-main);">${index + 1}. ${v.reason}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">📅 ${dateStr}</div>
            </div>
            <button onclick="deleteSystemViolation('${workerId}', ${index})" class="btn-outline-danger" style="padding:4px 8px; font-size:0.75rem; border:none; text-decoration:underline;">${t('btn-remove')}</button>
        `;
        listUl.appendChild(li);
    });

    if (unlockedSection) {
        unlockedSection.style.display = 'block';
        const isAr = currentAppLang === 'ar';
        if (count >= 6) {
            unlockBtn.style.display = 'block';
            if (worker.unlockedClose) {
                statusLabel.innerHTML = `<span style="color:var(--success); font-weight:700;">🔓 ${isAr ? 'تم إلغاء القفل (مسموح بالدخول)' : 'Unlocked (Allowed App Access)'}</span>`;
                unlockBtn.textContent = isAr ? 'قفل الحساب' : 'Lock Account';
                unlockBtn.className = 'btn-danger';
            } else {
                statusLabel.innerHTML = `<span style="color:var(--danger); font-weight:700;">🔒 ${isAr ? 'مقفل / مفصول (محظور)' : 'Locked / Terminated (Blocked)'}</span>`;
                unlockBtn.textContent = isAr ? 'إلغاء قفل الحساب' : 'Unlock Account';
                unlockBtn.className = 'btn-success';
            }
        } else {
            statusLabel.innerHTML = `<span style="color:var(--text-muted);">${isAr ? `الحالة: نشط (المخالفات: ${count}/6)` : `Status: Active (Violations: ${count}/6)`}</span>`;
            unlockBtn.style.display = 'none';
        }
    }
}

function addSystemViolation() {
    const workerId = document.getElementById('sys-viol-worker-select').value;
    const reason = document.getElementById('sys-viol-reason').value.trim();

    if (!workerId) {
        alert("Please select a worker first.");
        return;
    }
    if (!reason) {
        alert("Please enter a reason for the system violation.");
        return;
    }

    const workers = getCompanyData().workers || [];
    const idx = workers.findIndex(w => w.id === workerId);
    if (idx === -1) return;

    const worker = workers[idx];
    const list = worker.systemViolations || [];

    const newViol = {
        id: 'sv-' + Date.now(),
        reason: reason,
        timestamp: Date.now()
    };

    list.push(newViol);

    const count = list.length;
    let alertsAck = worker.alertsAcknowledged || {};
    if (count === 1) alertsAck.warning1 = false;
    if (count === 2) alertsAck.warning2 = false;

    const updates = {
        systemViolations: list,
        alertsAcknowledged: alertsAck
    };

    if (count === 6) {
        updates.unlockedClose = false;
    }

    db.ref(`companies/${currentCompany}/workers/${idx}`).update(updates)
        .then(() => {
            document.getElementById('sys-viol-reason').value = '';
            if (typeof logActivity === 'function') {
                logActivity('violation', worker.id, worker.name, `Added system violation to ${worker.name}: "${reason}" (Violation Count: ${count}/6)`);
            }
            alert("System violation added successfully!");
            renderSelectedWorkerSysViolations();
        })
        .catch(err => console.error("Error adding system violation:", err));
}

function deleteSystemViolation(workerId, index) {
    if (!confirm("Are you sure you want to remove this system violation?")) return;

    const workers = getCompanyData().workers || [];
    const idx = workers.findIndex(w => w.id === workerId);
    if (idx === -1) return;

    const worker = workers[idx];
    const list = [...(worker.systemViolations || [])];
    const removed = list.splice(index, 1)[0];

    db.ref(`companies/${currentCompany}/workers/${idx}/systemViolations`).set(list)
        .then(() => {
            if (typeof logActivity === 'function') {
                logActivity('violation', worker.id, worker.name, `Removed system violation from ${worker.name}: "${removed ? removed.reason : ''}"`);
            }
            alert("System violation removed successfully!");
            renderSelectedWorkerSysViolations();
        })
        .catch(err => console.error("Error deleting system violation:", err));
}

function toggleWorkerCloseStatus() {
    const workerId = document.getElementById('sys-viol-worker-select').value;
    if (!workerId) return;

    const workers = getCompanyData().workers || [];
    const idx = workers.findIndex(w => w.id === workerId);
    if (idx === -1) return;

    const worker = workers[idx];
    const newStatus = !worker.unlockedClose;

    db.ref(`companies/${currentCompany}/workers/${idx}/unlockedClose`).set(newStatus)
        .then(() => {
            alert(newStatus ? "Worker account unlocked successfully!" : "Worker account locked successfully!");
            renderSelectedWorkerSysViolations();
        })
        .catch(err => console.error("Error toggling close status:", err));
}

function claimGeneralDelivery(orderId) {
    if (!currentUser) return;
    const companyData = getCompanyData();
    const email = currentUser.email.toLowerCase();
    const workerIndex = companyData.workers.findIndex(w => w.email && w.email.toLowerCase() === email);
    if (workerIndex === -1) {
        alert(t('not-linked-worker') || "Your account is not linked to a worker profile.");
        return;
    }
    const worker = companyData.workers[workerIndex];
    if (worker.activeOrder) {
        alert(t('msg-already-has-active-order') || "You already have an active order!");
        return;
    }

    const pool = companyData.generalDeliveries || {};
    const orderData = pool[orderId];
    if (!orderData) {
        alert(t('msg-order-not-found') || "This order is no longer available.");
        return;
    }

    // Fire database transaction to prevent concurrent claims
    db.ref(`companies/${currentCompany}/generalDeliveries/${orderId}`).transaction(currentData => {
        if (currentData === null) {
            return undefined; // Already deleted/claimed
        }
        return null; // Delete it
    }, (error, committed, snapshot) => {
        if (error) {
            console.error("Transaction failed:", error);
            alert("An error occurred while claiming the order.");
        } else if (!committed) {
            alert(t('msg-already-claimed') || "This order was already claimed by another driver.");
        } else {
            // Success! Set the order as the driver's activeOrder
            orderData.assignedToWorkerId = worker.id;
            orderData.assignedToWorkerName = worker.name;
            db.ref(`companies/${currentCompany}/workers/${workerIndex}/activeOrder`).set(orderData)
                .then(() => {
                    logActivity('delivery', worker.id, worker.name, `${worker.name} accepted general delivery order #${orderData.orderNum || ''}`);
                    alert(t('msg-claimed-success') || "Order claimed successfully!");
                    renderAll();
                })
                .catch(err => console.error("Error setting driver active order:", err));
        }
    });
}

function cancelGeneralPoolOrder(orderId) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? "هل أنت متأكد من إلغاء هذا الطلب من التوصيل العام؟" : "Are you sure you want to cancel this order from the general pool?")) {
        return;
    }
    db.ref(`companies/${currentCompany}/generalDeliveries/${orderId}`).remove()
        .then(() => {
            logActivity('delivery', 'general', 'General Pool', `Cancelled/Removed order from the general deliveries pool.`);
            alert(isAr ? "تم إلغاء الطلب بنجاح." : "Order cancelled successfully.");
        })
        .catch(err => console.error("Error cancelling general pool order:", err));
}

window.claimGeneralDelivery = claimGeneralDelivery;
window.cancelGeneralPoolOrder = cancelGeneralPoolOrder;
window.getSystemViolationDeductionsForMonth = getSystemViolationDeductionsForMonth;
window.getSystemViolationLogsForMonth = getSystemViolationLogsForMonth;
window.checkWorkerSystemViolationAlerts = checkWorkerSystemViolationAlerts;
window.confirmWorkerAlert = confirmWorkerAlert;
window.renderSelectedWorkerSysViolations = renderSelectedWorkerSysViolations;
window.addSystemViolation = addSystemViolation;
window.deleteSystemViolation = deleteSystemViolation;
window.toggleWorkerCloseStatus = toggleWorkerCloseStatus;
window.saveLateSettings = saveLateSettings;
window.getLateDeductionsForMonth = getLateDeductionsForMonth;
window.updateSelectedDriverProvisions = updateSelectedDriverProvisions;
window.renderDriverVolumeRewards = renderDriverVolumeRewards;
window.addDriverVolumeReward = addDriverVolumeReward;
window.deleteDriverVolumeReward = deleteDriverVolumeReward;
window.getDriverVolumeRewardsForMonth = getDriverVolumeRewardsForMonth;

// ========================================================
// FEATURE 7: WORKER PROFILE, SHIFTS AND OVERTIME FUNCTIONS
// ========================================================

function getShiftDurationHours(startTime, endTime) {
    if (!startTime || !endTime) return 8; // default fallback
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let diffMins = (eh * 60 + em) - (sh * 60 + sm);
    if (diffMins < 0) {
        diffMins += 24 * 60; // shift crosses midnight
    }
    return diffMins / 60;
}

function saveWorkerProfileChanges() {
    const workerId = document.getElementById('ops-worker-select').value;
    if (!workerId) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;

    const newName = document.getElementById('ops-edit-name').value.trim();
    const newRole = document.getElementById('ops-edit-role').value.trim();
    const newSalary = parseFloat(document.getElementById('ops-edit-salary').value);
    const newBranch = document.getElementById('ops-edit-branch').value;

    if (!newName || !newRole || isNaN(newSalary) || newSalary <= 0 || !newBranch) {
        alert("Please ensure all profile fields are valid.");
        return;
    }

    const worker = getCompanyData().workers[workerIndex];

    worker.name = newName;
    worker.role = newRole;
    worker.income = newSalary;
    worker.branch = newBranch;

    db.ref(`companies/${currentCompany}/workers/${workerIndex}`).update({
        name: newName,
        role: newRole,
        income: newSalary,
        branch: newBranch
    }).then(() => {
        logActivity('ops', worker.id, worker.name, `Updated profile details for employee ${worker.name}`);
        alert("Worker profile updated successfully!");
        renderAll();
    }).catch(err => {
        console.error("Error updating worker profile:", err);
        alert("Failed to save profile changes.");
    });
}

function addNewWorkerShift() {
    const workerId = document.getElementById('ops-worker-select').value;
    if (!workerId) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;

    const startTime = document.getElementById('ops-new-shift-start').value;
    const endTime = document.getElementById('ops-new-shift-end').value;

    if (!startTime || !endTime) {
        alert("Please specify start and end times for the shift.");
        return;
    }

    const worker = getCompanyData().workers[workerIndex];
    if (!worker.shifts) worker.shifts = [];
    const dayOfWeek = document.getElementById('ops-new-shift-day') ? document.getElementById('ops-new-shift-day').value : '';

    const newShift = {
        id: Date.now().toString(),
        startTime: startTime,
        endTime: endTime,
        dayOfWeek: dayOfWeek || "",
        active: !dayOfWeek && worker.shifts.length === 0
    };

    worker.shifts.push(newShift);

    if (newShift.active) {
        worker.startTime = startTime;
        worker.endTime = endTime;
    }

    db.ref(`companies/${currentCompany}/workers/${workerIndex}`).update({
        shifts: worker.shifts,
        startTime: worker.startTime,
        endTime: worker.endTime
    }).then(() => {
        document.getElementById('ops-new-shift-start').value = '';
        document.getElementById('ops-new-shift-end').value = '';
        if (document.getElementById('ops-new-shift-day')) document.getElementById('ops-new-shift-day').value = '';
        const activityMsg = dayOfWeek 
            ? `Added new override shift for ${dayOfWeek} (${startTime} - ${endTime}) for ${worker.name}`
            : `Added new shift (${startTime} - ${endTime}) for ${worker.name}`;
        logActivity('ops', worker.id, worker.name, activityMsg);
        renderOpsDetails();
        renderOpsWorkersTable();
    }).catch(err => {
        console.error("Error adding shift:", err);
        alert("Failed to add shift.");
    });
}

function activateWorkerShift(shiftId) {
    const workerId = document.getElementById('ops-worker-select').value;
    if (!workerId) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;

    const worker = getCompanyData().workers[workerIndex];
    if (!worker.shifts) return;

    worker.shifts.forEach(s => {
        s.active = (s.id === shiftId);
    });

    const activeShift = worker.shifts.find(s => s.active);
    if (activeShift) {
        worker.startTime = activeShift.startTime;
        worker.endTime = activeShift.endTime;
    }

    db.ref(`companies/${currentCompany}/workers/${workerIndex}`).update({
        shifts: worker.shifts,
        startTime: worker.startTime,
        endTime: worker.endTime
    }).then(() => {
        logActivity('ops', worker.id, worker.name, `Activated shift (${worker.startTime} - ${worker.endTime}) for ${worker.name}`);
        renderOpsDetails();
        renderOpsWorkersTable();
    }).catch(err => {
        console.error("Error activating shift:", err);
        alert("Failed to activate shift.");
    });
}

function deleteWorkerShift(shiftId) {
    const workerId = document.getElementById('ops-worker-select').value;
    if (!workerId) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;

    const worker = getCompanyData().workers[workerIndex];
    if (!worker.shifts) return;

    const deletedShift = worker.shifts.find(s => s.id === shiftId);
    if (!deletedShift) return;

    if (deletedShift.active && worker.shifts.length > 1) {
        alert("Please activate a different shift before deleting the active one.");
        return;
    }

    worker.shifts = worker.shifts.filter(s => s.id !== shiftId);

    if (worker.shifts.length === 0) {
        worker.startTime = "";
        worker.endTime = "";
    }

    db.ref(`companies/${currentCompany}/workers/${workerIndex}`).update({
        shifts: worker.shifts,
        startTime: worker.startTime,
        endTime: worker.endTime
    }).then(() => {
        logActivity('ops', worker.id, worker.name, `Deleted shift (${deletedShift.startTime} - ${deletedShift.endTime}) for ${worker.name}`);
        renderOpsDetails();
        renderOpsWorkersTable();
    }).catch(err => {
        console.error("Error deleting shift:", err);
        alert("Failed to delete shift.");
    });
}

function addOvertimeHour() {
    const workerId = document.getElementById('ops-worker-select').value;
    if (!workerId) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;

    const worker = getCompanyData().workers[workerIndex];
    const baseIncome = parseFloat(worker.income) || 0;
    const duration = getShiftDurationHours(worker.startTime, worker.endTime);
    const hourlyRate = baseIncome / (30 * duration);

    const hours = parseFloat(document.getElementById('ops-ov-hours').value) || 1.0;
    const mult = parseFloat(document.getElementById('ops-ov-multiplier').value) || 1.0;
    const finalAmount = Math.round(hours * hourlyRate * mult * 100) / 100;

    const stats = getMonthlyStats(worker, currentGlobalMonth);
    if (!stats.overtimeList) stats.overtimeList = [];

    const newLog = {
        id: Date.now().toString(),
        date: formatTimestamp(),
        hours: hours,
        rate: Math.round(hourlyRate * 100) / 100,
        multiplier: mult,
        amount: finalAmount
    };

    stats.overtimeList.unshift(newLog);

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/overtimeList`).set(stats.overtimeList)
        .then(() => {
            logActivity('ops', worker.id, worker.name, `Logged ${hours} hr(s) overtime (x${mult}) for ${worker.name} (SAR ${finalAmount})`);
            renderOpsDetails();
        }).catch(err => {
            console.error("Error adding overtime:", err);
            alert("Failed to log overtime.");
        });
}

function deleteOvertimeHour(logId) {
    const workerId = document.getElementById('ops-worker-select').value;
    if (!workerId) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;

    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);
    if (!stats.overtimeList) return;

    const targetLog = stats.overtimeList.find(o => o.id === logId);
    if (!targetLog) return;

    stats.overtimeList = stats.overtimeList.filter(o => o.id !== logId);

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/overtimeList`).set(stats.overtimeList)
        .then(() => {
            logActivity('ops', worker.id, worker.name, `Removed overtime entry of ${targetLog.hours} hr (x${targetLog.multiplier}) for ${worker.name}`);
            renderOpsDetails();
        }).catch(err => {
            console.error("Error deleting overtime:", err);
            alert("Failed to delete overtime entry.");
        });
}

function deleteOvertimeHourFromFin(workerId, logId) {
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;

    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);
    if (!stats.overtimeList) return;

    const targetLog = stats.overtimeList.find(o => o.id === logId);
    if (!targetLog) return;

    stats.overtimeList = stats.overtimeList.filter(o => o.id !== logId);

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/overtimeList`).set(stats.overtimeList)
        .then(() => {
            logActivity('finance', worker.id, worker.name, `Removed overtime entry of ${targetLog.hours} hr (x${targetLog.multiplier}) for ${worker.name}`);
            renderFinDetails();
        }).catch(err => {
            console.error("Error deleting overtime:", err);
            alert("Failed to delete overtime entry.");
        });
}

// ========================================================
// CUSTODY REQUEST FUNCTIONS
// ========================================================

function submitCustodyRequest() {
    const worker = getActiveWorker();
    if (!worker) {
        alert(t('msg-account-not-linked') || "Your account is not linked to any worker profile.");
        return;
    }

    const amountInput = document.getElementById('custody-req-amount');
    const reasonInput = document.getElementById('custody-req-reason');
    if (!amountInput || !reasonInput) return;

    const amountVal = parseFloat(amountInput.value);
    const reasonVal = reasonInput.value.trim();

    if (isNaN(amountVal) || amountVal <= 0 || !reasonVal) {
        alert(currentAppLang === 'ar' ? 'يرجى إدخال مبلغ صحيح وسبب.' : 'Please enter a valid amount and reason.');
        return;
    }

    const reqId = 'custreq-' + Date.now();
    const requestObj = {
        id: reqId,
        workerId: worker.id,
        workerName: worker.name,
        amount: amountVal,
        reason: reasonVal,
        status: 'pending',
        timestamp: Date.now()
    };

    db.ref(`companies/${currentCompany}/custodyRequests/${reqId}`).set(requestObj)
        .then(() => {
            amountInput.value = '';
            reasonInput.value = '';
            alert(currentAppLang === 'ar' ? 'تم تقديم طلب العهدة بنجاح وهو قيد المراجعة.' : 'Custody request submitted successfully and is pending review.');
        })
        .catch(err => {
            console.error("Error submitting custody request:", err);
            alert("Error: " + err.message);
        });
}

function acceptCustodyRequest(reqId) {
    const custodyReqs = getCompanyData().custodyRequests || {};
    const req = custodyReqs[reqId];
    if (!req) return;

    // Generate random 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    db.ref(`companies/${currentCompany}/custodyRequests/${reqId}`).update({
        status: 'accepted',
        code: code,
        handledAt: Date.now()
    }).then(() => {
        logActivity('finance', req.workerId, req.workerName, `Accepted custody request of SAR ${req.amount} for ${req.workerName}`);
    }).catch(err => console.error("Error accepting custody request:", err));
}

function rejectCustodyRequest(reqId) {
    const custodyReqs = getCompanyData().custodyRequests || {};
    const req = custodyReqs[reqId];
    if (!req) return;

    db.ref(`companies/${currentCompany}/custodyRequests/${reqId}`).update({
        status: 'rejected',
        handledAt: Date.now()
    }).then(() => {
        logActivity('finance', req.workerId, req.workerName, `Rejected custody request of SAR ${req.amount} for ${req.workerName}`);
    }).catch(err => console.error("Error rejecting custody request:", err));
}

function releaseCustodyRequest(reqId) {
    const custodyReqs = getCompanyData().custodyRequests || {};
    const req = custodyReqs[reqId];
    if (!req) return;

    const enteredCodeInput = document.getElementById(`verify-custody-code-${reqId}`);
    if (!enteredCodeInput) return;
    const enteredCode = enteredCodeInput.value.trim();

    if (enteredCode !== req.code) {
        alert(currentAppLang === 'ar' ? 'الرمز غير صحيح!' : 'Incorrect verification code!');
        return;
    }

    // Move custody request status to 'given'
    db.ref(`companies/${currentCompany}/custodyRequests/${reqId}`).update({
        status: 'given',
        givenAt: Date.now()
    }).then(() => {
        // Automatically insert a 'given' custody log entry in the worker's ledger
        const workerIndex = getCompanyData().workers.findIndex(w => w.id === req.workerId);
        if (workerIndex !== -1) {
            const worker = getCompanyData().workers[workerIndex];
            const stats = getMonthlyStats(worker, currentGlobalMonth);
            if (!stats.custodyList) stats.custodyList = [];
            
            stats.custodyList.unshift({
                id: 'cust-' + Date.now(),
                date: formatTimestamp(),
                amount: req.amount,
                type: 'given'
            });

            return db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/custodyList`).set(stats.custodyList);
        }
    }).then(() => {
        logActivity('finance', req.workerId, req.workerName, `Released custody of SAR ${req.amount} to ${req.workerName} via code verification`);
        alert(currentAppLang === 'ar' ? 'تم تسليم العهدة بنجاح وتحديث الرصيد!' : 'Custody released successfully and ledger updated!');
    }).catch(err => {
        console.error("Error releasing custody:", err);
        alert("Error: " + err.message);
    });
}

function renderWorkerCustodyRequests() {
    const isAr = currentAppLang === 'ar';
    const worker = getActiveWorker();
    const listDiv = document.getElementById('worker-custody-requests-list');
    if (!worker || !listDiv) return;

    const custodyReqs = getCompanyData().custodyRequests || {};
    const myReqs = Object.values(custodyReqs)
        .filter(r => r.workerId === worker.id)
        .sort((a, b) => b.timestamp - a.timestamp);

    listDiv.innerHTML = '';
    if (myReqs.length === 0) {
        listDiv.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">${isAr ? 'لا يوجد طلبات سابقة.' : 'No previous requests.'}</p>`;
        return;
    }

    myReqs.forEach(req => {
        const dateStr = new Date(req.timestamp).toLocaleString();
        let statusBadge = '';
        let codeDisplay = '';
        let editBtn = '';

        if (req.status === 'pending') {
            statusBadge = `<span class="badge" style="background:#d97706;">${isAr ? 'قيد الانتظار' : 'Pending'}</span>`;
            editBtn = `<button onclick="editCustodyRequestAmount('${req.id}')" class="btn-outline" style="padding: 2px 8px; font-size: 0.75rem; font-weight: 600; margin-left: 6px; cursor:pointer;" title="${isAr ? 'تعديل المبلغ' : 'Edit Amount'}">✏️ ${isAr ? 'تعديل' : 'Edit'}</button>`;
        } else if (req.status === 'accepted') {
            statusBadge = `<span class="badge" style="background:#16a34a;">${isAr ? 'مقبول للتسليم' : 'Approved for Release'}</span>`;
            codeDisplay = `<div style="margin-top: 5px; font-weight: 800; font-size: 1rem; color: var(--success);">${isAr ? 'الرمز السري:' : 'Verification Code:'} <span style="background:var(--input-bg); padding: 2px 6px; border-radius: 4px; border: 1px dashed var(--success);">${req.code}</span></div>`;
        } else if (req.status === 'rejected') {
            statusBadge = `<span class="badge" style="background:#dc2626;">${isAr ? 'مرفوض' : 'Rejected'}</span>`;
        } else if (req.status === 'given') {
            statusBadge = `<span class="badge" style="background:#2563eb;">${isAr ? 'تم الاستلام' : 'Given'}</span>`;
        }

        listDiv.innerHTML += `
            <div class="ledger-card" style="border-left: 4px solid #f59e0b;">
                <div class="flex-between">
                    <div>
                        <strong>SAR ${req.amount}</strong>
                        ${editBtn}
                    </div>
                    ${statusBadge}
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
                    ${isAr ? 'السبب:' : 'Reason:'} ${req.reason}<br>
                    📅 ${dateStr}
                </div>
                ${codeDisplay}
            </div>
        `;
    });
}

function renderPendingCustodyRequests() {
    const isAr = currentAppLang === 'ar';
    const listDiv = document.getElementById('pending-custody-requests-list');
    if (!listDiv) return;

    const custodyReqs = getCompanyData().custodyRequests || {};
    const pendingReqs = Object.values(custodyReqs)
        .filter(r => r.status === 'pending')
        .sort((a, b) => b.timestamp - a.timestamp);

    listDiv.innerHTML = '';
    if (pendingReqs.length === 0) {
        listDiv.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:12px;">${isAr ? 'لا توجد طلبات معلقة.' : 'No pending requests.'}</p>`;
        return;
    }

    pendingReqs.forEach(req => {
        const dateStr = new Date(req.timestamp).toLocaleString();
        listDiv.innerHTML += `
            <div class="ledger-card" style="border-left:4px solid #f59e0b;">
                <div class="flex-between" style="align-items:start;">
                    <div>
                        <strong style="font-size:1.05rem; color:var(--text-main);">${req.workerName}</strong><br>
                        <span style="font-size:0.8rem; color:var(--text-muted);">${isAr ? 'السبب:' : 'Reason:'} ${req.reason}</span>
                    </div>
                    <strong style="color:#f59e0b; font-size:1.1rem;">SAR ${req.amount}</strong>
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:8px;">📅 ${dateStr}</div>
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
                    <button onclick="rejectCustodyRequest('${req.id}')" class="btn-outline-danger" style="padding:6px 12px; font-size:0.75rem;">${isAr ? 'رفض' : 'Reject'}</button>
                    <button onclick="acceptCustodyRequest('${req.id}')" class="btn-success" style="padding:6px 12px; font-size:0.75rem; background:#16a34a; border-color:#16a34a;">${isAr ? 'قبول' : 'Accept'}</button>
                </div>
            </div>
        `;
    });
}

function renderAcceptedCustodyReleases() {
    const isAr = currentAppLang === 'ar';
    const listDiv = document.getElementById('accepted-custodies-list');
    if (!listDiv) return;

    const custodyReqs = getCompanyData().custodyRequests || {};
    const acceptedReqs = Object.values(custodyReqs)
        .filter(r => r.status === 'accepted')
        .sort((a, b) => b.timestamp - a.timestamp);

    listDiv.innerHTML = '';
    if (acceptedReqs.length === 0) {
        listDiv.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:12px;">${isAr ? 'لا توجد طلبات جاهزة للتسليم.' : 'No custody releases pending verification.'}</p>`;
        return;
    }

    acceptedReqs.forEach(req => {
        listDiv.innerHTML += `
            <div class="ledger-card" style="border-left: 4px solid var(--success);">
                <div class="flex-between">
                    <div>
                        <strong>${req.workerName}</strong><br>
                        <span style="font-size:0.85rem; color:var(--text-muted);">${req.reason}</span>
                    </div>
                    <strong style="color:var(--success); font-size:1.1rem;">SAR ${req.amount}</strong>
                </div>
                <div style="display:flex; align-items:center; gap:8px; margin-top:12px; flex-wrap:wrap;">
                    <input type="text" id="verify-custody-code-${req.id}" placeholder="${isAr ? 'رمز التحقق المكون من 6 أرقام' : '6-digit verification code'}" style="padding:8px; font-size:0.85rem; flex:1; min-width:180px; height:34px; background:var(--input-bg); border:1px solid var(--border-color); border-radius:4px; color:var(--text-main);" />
                    <button onclick="releaseCustodyRequest('${req.id}')" class="btn-success" style="padding:0 12px; height:34px; font-size:0.8rem; font-weight:700; background:#16a34a; border-color:#16a34a;">${isAr ? 'تم تسليم العهدة' : 'Release Custody'}</button>
                </div>
            </div>
        `;
    });
}

function editPaymentRequestAmount(reqId) {
    const isAr = currentAppLang === 'ar';
    const pRequests = getCompanyData().paymentRequests || {};
    const req = pRequests[reqId];
    if (!req) return;

    const worker = getActiveWorker();
    if (!worker || req.workerId !== worker.id) {
        alert(isAr ? 'لا يمكنك تعديل هذا الطلب.' : 'You cannot edit this request.');
        return;
    }

    if (req.status !== 'pending') {
        alert(isAr ? 'لا يمكن تعديل الطلب بعد قبوله أو معالجته من قبل الإدارة.' : 'Cannot edit request once it has been processed by management.');
        return;
    }

    const newAmtStr = prompt(isAr ? 'أدخل المبلغ الجديد المطلوب (ريال):' : 'Enter new requested amount (SAR):', req.amount);
    if (newAmtStr === null) return;

    const newAmt = parseFloat(newAmtStr);
    if (isNaN(newAmt) || newAmt <= 0) {
        alert(isAr ? 'يرجى إدخال مبلغ صحيح أكبر من الصفر.' : 'Please enter a valid amount greater than 0.');
        return;
    }

    db.ref(`companies/${currentCompany}/paymentRequests/${reqId}`).update({
        amount: newAmt,
        requestedAmount: newAmt,
        updatedAt: Date.now()
    }).then(() => {
        if (typeof logActivity === 'function') {
            logActivity('sales', worker.id, worker.name, `Updated payment request amount to SAR ${newAmt}`);
        }
        renderPaymentRequests();
    }).catch(err => {
        console.error("Error editing payment request amount:", err);
        alert(isAr ? 'حدث خطأ أثناء تعديل المبلغ.' : 'Error updating requested amount.');
    });
}

function editCustodyRequestAmount(reqId) {
    const isAr = currentAppLang === 'ar';
    const custodyReqs = getCompanyData().custodyRequests || {};
    const req = custodyReqs[reqId];
    if (!req) return;

    const worker = getActiveWorker();
    if (!worker || req.workerId !== worker.id) {
        alert(isAr ? 'لا يمكنك تعديل هذا الطلب.' : 'You cannot edit this request.');
        return;
    }

    if (req.status !== 'pending') {
        alert(isAr ? 'لا يمكن تعديل الطلب بعد قبوله أو معالجته من قبل الإدارة.' : 'Cannot edit request once it has been processed by management.');
        return;
    }

    const newAmtStr = prompt(isAr ? 'أدخل المبلغ الجديد لطلب العهدة (ريال):' : 'Enter new requested custody amount (SAR):', req.amount);
    if (newAmtStr === null) return;

    const newAmt = parseFloat(newAmtStr);
    if (isNaN(newAmt) || newAmt <= 0) {
        alert(isAr ? 'يرجى إدخال مبلغ صحيح أكبر من الصفر.' : 'Please enter a valid amount greater than 0.');
        return;
    }

    db.ref(`companies/${currentCompany}/custodyRequests/${reqId}`).update({
        amount: newAmt,
        updatedAt: Date.now()
    }).then(() => {
        if (typeof logActivity === 'function') {
            logActivity('finance', worker.id, worker.name, `Updated custody request amount to SAR ${newAmt}`);
        }
        renderWorkerCustodyRequests();
        renderPendingCustodyRequests();
    }).catch(err => {
        console.error("Error editing custody request amount:", err);
        alert(isAr ? 'حدث خطأ أثناء تعديل المبلغ.' : 'Error updating requested custody amount.');
    });
}

// ========================================================
// EXIT REQUEST WORKFLOW FUNCTIONS
// ========================================================

function submitExitRequest() {
    const worker = getActiveWorker();
    if (!worker) {
        alert(t('msg-account-not-linked') || "Your account is not linked to any worker profile.");
        return;
    }

    const timeInput = document.getElementById('attendance-exit-time');
    const reasonInput = document.getElementById('attendance-exit-reason');
    if (!timeInput || !reasonInput) return;

    const timeVal = timeInput.value;
    const reasonVal = reasonInput.value.trim();

    if (!timeVal || !reasonVal) {
        alert(currentAppLang === 'ar' ? 'يرجى تحديد وقت الخروج والسبب.' : 'Please select exit time and enter a reason.');
        return;
    }

    const datePicker = document.getElementById('attendance-date-picker');
    const dateStr = datePicker ? datePicker.value : '';
    if (!dateStr) {
        alert("Please select a date first.");
        return;
    }

    const exitRequestObj = {
        time: timeVal,
        reason: reasonVal,
        status: 'pending',
        timestamp: Date.now()
    };

    db.ref(`companies/${currentCompany}/attendance/${dateStr}/${worker.id}/exitRequest`).set(exitRequestObj)
        .then(() => {
            timeInput.value = '';
            reasonInput.value = '';
            alert(currentAppLang === 'ar' ? 'تم تقديم طلب الخروج بنجاح.' : 'Exit request submitted successfully.');
        })
        .catch(err => {
            console.error("Error submitting exit request:", err);
            alert("Error: " + err.message);
        });
}

function handleExitRequest(workerId, action) {
    const datePicker = document.getElementById('attendance-date-picker');
    const dateStr = datePicker ? datePicker.value : '';
    if (!dateStr) return;

    const worker = getCompanyData().workers.find(w => w.id === workerId);
    const wName = worker ? worker.name : 'Worker';

    const exitRef = db.ref(`companies/${currentCompany}/attendance/${dateStr}/${workerId}/exitRequest`);

    if (action === 'approve') {
        exitRef.update({
            status: 'approved',
            approvedAt: Date.now()
        }).then(() => {
            logActivity('attendance', workerId, wName, `Approved exit request for ${wName} on ${dateStr}`);
        }).catch(err => console.error("Error approving exit request:", err));
    } else if (action === 'reject') {
        exitRef.update({
            status: 'rejected',
            rejectedAt: Date.now()
        }).then(() => {
            logActivity('attendance', workerId, wName, `Rejected exit request for ${wName} on ${dateStr}`);
        }).catch(err => console.error("Error rejecting exit request:", err));
    } else if (action === 'returned') {
        exitRef.update({
            status: 'returned',
            returnedAt: Date.now()
        }).then(() => {
            logActivity('attendance', workerId, wName, `${wName} returned to work area on ${dateStr}`);
        }).catch(err => console.error("Error logging worker return:", err));
    }
}

// ========================================================
// ATTENDANCE OVERTIME RELOCATION FUNCTIONS
// ========================================================

function renderAttendanceOvertimeDetails() {
    const isAr = currentAppLang === 'ar';
    const workerId = document.getElementById('attendance-overtime-worker-select').value;
    const detailsArea = document.getElementById('attendance-overtime-details-area');
    if (!detailsArea) return;

    if (!workerId) {
        detailsArea.style.display = 'none';
        return;
    }
    detailsArea.style.display = 'block';

    const worker = getCompanyData().workers.find(w => w.id === workerId);
    if (!worker) return;

    const baseIncome = parseFloat(worker.income) || 0;
    const duration = getShiftDurationHours(worker.startTime, worker.endTime);
    
    const durationEl = document.getElementById('att-ov-shift-duration');
    const hourlyRateEl = document.getElementById('att-ov-hourly-rate');
    
    const hourlyRate = baseIncome / (30 * duration);

    if (durationEl) durationEl.textContent = `${duration.toFixed(1)} hrs`;
    if (hourlyRateEl) {
        if (isNaN(hourlyRate) || !isFinite(hourlyRate)) {
            hourlyRateEl.textContent = `SAR 0.00/hr`;
        } else {
            hourlyRateEl.textContent = `SAR ${hourlyRate.toFixed(2)}/hr`;
        }
    }

    // Render Overtime logs inside attendance
    const stats = getMonthlyStats(worker, currentGlobalMonth);
    const ovHistory = document.getElementById('att-worker-overtime-history');
    if (ovHistory) {
        ovHistory.innerHTML = '';
        const list = stats.overtimeList || [];
        if (list.length === 0) {
            ovHistory.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">No overtime logs for this month.</p>`;
        } else {
            list.forEach(log => {
                const logCard = document.createElement('div');
                logCard.className = 'ledger-card flex-between';
                logCard.innerHTML = `
                    <div>
                        <strong>+ ${log.hours} hrs (x${log.multiplier})</strong>
                        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                            Rate: SAR ${log.rate}/hr • Earned: SAR ${log.amount}<br>
                            📅 ${log.date}
                        </div>
                    </div>
                    <button onclick="deleteOvertimeHourFromAtt('${worker.id}', '${log.id}')" class="btn-outline-danger" style="padding: 4px 10px; font-size: 0.75rem;">${isAr ? 'تراجع' : 'Undo'}</button>
                `;
                ovHistory.appendChild(logCard);
            });
        }
    }
}

function addOvertimeHourFromAtt() {
    const workerId = document.getElementById('attendance-overtime-worker-select').value;
    if (!workerId) return;

    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;

    const worker = getCompanyData().workers[workerIndex];
    const baseIncome = parseFloat(worker.income) || 0;
    const duration = getShiftDurationHours(worker.startTime, worker.endTime);
    const hourlyRate = baseIncome / (30 * duration);

    const hours = parseFloat(document.getElementById('att-ov-hours').value) || 1.0;
    const mult = parseFloat(document.getElementById('att-ov-multiplier').value) || 1.0;
    const finalAmount = Math.round(hours * hourlyRate * mult * 100) / 100;

    const stats = getMonthlyStats(worker, currentGlobalMonth);
    if (!stats.overtimeList) stats.overtimeList = [];

    const newLog = {
        id: Date.now().toString(),
        date: formatTimestamp(),
        hours: hours,
        rate: Math.round(hourlyRate * 100) / 100,
        multiplier: mult,
        amount: finalAmount
    };

    stats.overtimeList.unshift(newLog);

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/overtimeList`).set(stats.overtimeList)
        .then(() => {
            logActivity('attendance', worker.id, worker.name, `Logged ${hours} hr(s) overtime (x${mult}) for ${worker.name} (SAR ${finalAmount})`);
            renderAttendanceOvertimeDetails();
        }).catch(err => {
            console.error("Error adding overtime:", err);
            alert("Failed to add overtime.");
        });
}

function deleteOvertimeHourFromAtt(workerId, logId) {
    const workerIndex = getCompanyData().workers.findIndex(w => w.id === workerId);
    if (workerIndex === -1) return;

    const worker = getCompanyData().workers[workerIndex];
    const stats = getMonthlyStats(worker, currentGlobalMonth);
    if (!stats.overtimeList) return;

    const targetLog = stats.overtimeList.find(o => o.id === logId);
    if (!targetLog) return;

    stats.overtimeList = stats.overtimeList.filter(o => o.id !== logId);

    db.ref(`companies/${currentCompany}/workers/${workerIndex}/monthlyStats/${currentGlobalMonth}/overtimeList`).set(stats.overtimeList)
        .then(() => {
            logActivity('attendance', worker.id, worker.name, `Removed overtime entry of ${targetLog.hours} hr (x${targetLog.multiplier}) for ${worker.name}`);
            renderAttendanceOvertimeDetails();
        }).catch(err => {
            console.error("Error deleting overtime:", err);
            alert("Failed to delete overtime entry.");
        });
}

// ========================================================
// TIERED LATE PENALTY RULES FUNCTIONS
// ========================================================

function addLateRule() {
    const minsInput = document.getElementById('late-rule-mins');
    const penaltyInput = document.getElementById('late-rule-penalty');
    if (!minsInput || !penaltyInput) return;

    const mins = parseInt(minsInput.value);
    const penalty = parseFloat(penaltyInput.value);

    if (isNaN(mins) || mins <= 0 || isNaN(penalty) || penalty < 0) {
        alert("Please enter valid minutes and penalty.");
        return;
    }

    const companyData = getCompanyData();
    const rules = companyData.lateRules || [];
    
    // Add rule and sort ascending by minutes
    rules.push({ mins, penalty });
    rules.sort((a, b) => a.mins - b.mins);

    db.ref(`companies/${currentCompany}/lateRules`).set(rules)
        .then(() => {
            minsInput.value = '';
            penaltyInput.value = '';
            renderAttendance();
        })
        .catch(err => console.error("Error adding late rule:", err));
}

function deleteLateRule(idx) {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    const companyData = getCompanyData();
    const rules = companyData.lateRules || [];
    rules.splice(idx, 1);

    db.ref(`companies/${currentCompany}/lateRules`).set(rules)
        .then(() => {
            renderAttendance();
        })
        .catch(err => console.error("Error deleting late rule:", err));
}

function renderLateRules() {
    const isAr = currentAppLang === 'ar';
    const tbody = document.getElementById('late-rules-table-body');
    if (!tbody) return;

    const companyData = getCompanyData();
    const rules = companyData.lateRules || [];

    tbody.innerHTML = '';
    if (rules.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:12px;">${isAr ? 'لا توجد قوانين مدخلة. سيتم تطبيق القانون الافتراضي.' : 'No tiered rules defined. Default or no penalties will apply.'}</td></tr>`;
        return;
    }

    rules.forEach((rule, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600; font-size: 0.9rem; padding: 10px;">
                ${rule.mins} ${isAr ? 'دقائق تأخير' : 'mins late'}
            </td>
            <td style="font-weight: 700; color: var(--danger); font-size: 0.9rem; padding: 10px;">
                SAR ${parseFloat(rule.penalty).toFixed(2)}
            </td>
            <td style="text-align: center; padding: 10px;">
                <button onclick="deleteLateRule(${idx})" class="btn-outline-danger" style="padding: 4px 8px; font-size: 0.75rem;">${isAr ? 'حذف' : 'Delete'}</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function markWorkerSelfAttendance() {
    const worker = getActiveWorker();
    if (!worker) {
        alert(t('msg-account-not-linked') || "Your account is not linked to any worker profile.");
        return;
    }

    const datePicker = document.getElementById('attendance-date-picker');
    const dateStr = datePicker ? datePicker.value : '';
    if (!dateStr) return;

    // Get today's local date YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (dateStr !== todayStr) {
        alert(currentAppLang === 'ar' ? 'يمكنك تسجيل حضورك لليوم الحالي فقط ولا يمكنك تعديل الأيام السابقة!' : 'You can only check in for today\'s date and cannot edit past attendance!');
        return;
    }

    const attendanceMap = (getCompanyData().attendance || {})[todayStr] || {};
    const existingAtt = attendanceMap[worker.id];
    if (existingAtt && existingAtt.status === 'present') {
        alert(currentAppLang === 'ar' ? 'لقد قمت بتسجيل حضورك بالفعل اليوم!' : 'You have already checked in for today!');
        return;
    }

    // Time is current local time
    const hh = String(today.getHours()).padStart(2, '0');
    const mins = String(today.getMinutes()).padStart(2, '0');
    const checkTime = `${hh}:${mins}`;

    let shiftStart = worker.startTime;
    const dateParts = dateStr.split('-');
    const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekName = dayNames[dateObj.getDay()];
    const dateOverrideShift = (worker.shifts || []).find(s => s.dayOfWeek === dayOfWeekName || s.specificDate === dateStr);
    if (dateOverrideShift) {
        shiftStart = dateOverrideShift.startTime;
    }
    const lateness = calculateLateness(shiftStart, checkTime);

    db.ref(`companies/${currentCompany}/attendance/${dateStr}/${worker.id}`).set({
        status: 'present',
        time: checkTime,
        lateness: lateness || '',
        timestamp: Date.now()
    })
    .then(() => {
        logActivity('attendance', worker.id, worker.name, `Worker Self Checked-In as PRESENT on ${dateStr} at ${checkTime} (Lateness: ${lateness || 'None'})`);
        alert(currentAppLang === 'ar' ? 'تم تسجيل حضورك بنجاح!' : 'You have checked in successfully!');
        renderAll();
    })
    .catch(err => {
        console.error("Error during self check-in:", err);
        alert("Error: " + err.message);
    });
}

function renderTaskGroups() {
    const container = document.getElementById('groups-list-container');
    if (!container) return;
    container.innerHTML = '';

    const companyData = getCompanyData();
    const groups = companyData.taskGroups || [];
    const workers = companyData.workers || [];
    const isAr = currentAppLang === 'ar';

    if (groups.length === 0) {
        container.innerHTML = `<div style="text-align:center; font-size:0.85rem; color:var(--text-muted); padding:10px;">${isAr ? 'لا توجد مجموعات مضافة.' : 'No groups created yet.'}</div>`;
        return;
    }

    groups.forEach((group, idx) => {
        // Find current members of this group
        const groupMembers = (group.members || []).map(mId => workers.find(w => w.id === mId)).filter(Boolean);
        
        let membersHtml = '';
        if (groupMembers.length === 0) {
            membersHtml = `<div style="font-size:0.75rem; color:var(--text-muted); padding: 4px 0;">${isAr ? 'لا يوجد أعضاء' : 'No members'}</div>`;
        } else {
            groupMembers.forEach(m => {
                membersHtml += `
                    <div class="flex-between" style="font-size:0.8rem; background:var(--input-bg); padding:4px 8px; border-radius:4px; margin-bottom:4px; border:1px solid var(--border-color);">
                        <span>👤 ${m.name}</span>
                        <button onclick="removeMemberFromGroup('${group.id}', '${m.id}')" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:0.85rem; padding:0 2px;">❌</button>
                    </div>
                `;
            });
        }

        // Options for workers NOT in this group
        const nonMembers = workers.filter(w => !(group.members || []).includes(w.id));
        let selectOptions = `<option value="">${isAr ? '-- إضافة عضو --' : '-- Add Member --'}</option>`;
        nonMembers.forEach(w => {
            selectOptions += `<option value="${w.id}">${w.name}</option>`;
        });

        const selectId = `add-member-select-${group.id}`;

        const groupDiv = document.createElement('div');
        groupDiv.style.border = '1px solid var(--border-color)';
        groupDiv.style.borderRadius = '8px';
        groupDiv.style.padding = '12px';
        groupDiv.style.background = 'var(--input-bg)';
        groupDiv.innerHTML = `
            <div class="flex-between" style="border-bottom:1px solid var(--border-color); padding-bottom:6px; margin-bottom:8px;">
                <strong style="color:var(--text-main); font-size:0.9rem;">👥 ${group.name}</strong>
                <button onclick="deleteTaskGroup('${group.id}')" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:1.1rem; padding:0 4px;" title="Delete Group">🗑️</button>
            </div>
            <div style="margin-bottom:8px; max-height:120px; overflow-y:auto; padding-right:2px;">
                ${membersHtml}
            </div>
            ${nonMembers.length > 0 ? `
            <div class="flex-between" style="gap:6px; margin-top:8px;">
                <select id="${selectId}" style="flex:1; padding:4px; font-size:0.8rem; background:var(--card-bg); border-color:var(--border-color); color:var(--text-main); border-radius:4px;">
                    ${selectOptions}
                </select>
                <button onclick="addMemberToGroup('${group.id}', '${selectId}')" class="btn-success" style="padding:4px 8px; font-size:0.8rem; min-height:unset; height:auto;">＋</button>
            </div>
            ` : ''}
        `;
        container.appendChild(groupDiv);
    });
}

function createTaskGroup() {
    const input = document.getElementById('new-group-name-input');
    if (!input) return;
    const name = input.value.trim();
    if (!name) return;

    const companyData = getCompanyData();
    const groups = companyData.taskGroups || [];
    
    // Check if group already exists
    if (groups.some(g => g.name.toLowerCase() === name.toLowerCase())) {
        alert(currentAppLang === 'ar' ? 'هذه المجموعة موجودة بالفعل!' : 'Group already exists!');
        return;
    }

    const newGroup = {
        id: 'g-' + Date.now().toString(),
        name: name,
        members: []
    };

    groups.push(newGroup);

    db.ref(`companies/${currentCompany}/taskGroups`).set(groups)
        .then(() => {
            input.value = '';
            renderAll();
        })
        .catch(err => console.error("Error creating group:", err));
}

function deleteTaskGroup(groupId) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذه المجموعة؟' : 'Are you sure you want to delete this group?')) return;

    const companyData = getCompanyData();
    const groups = companyData.taskGroups || [];
    const filtered = groups.filter(g => g.id !== groupId);

    db.ref(`companies/${currentCompany}/taskGroups`).set(filtered)
        .then(() => renderAll())
        .catch(err => console.error("Error deleting group:", err));
}

function addMemberToGroup(groupId, selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const workerId = select.value;
    if (!workerId) return alert("Please select a worker first.");

    const companyData = getCompanyData();
    const groups = companyData.taskGroups || [];
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    if (!group.members) group.members = [];
    if (!group.members.includes(workerId)) {
        group.members.push(workerId);
    }

    db.ref(`companies/${currentCompany}/taskGroups`).set(groups)
        .then(() => renderAll())
        .catch(err => console.error("Error adding member:", err));
}

function removeMemberFromGroup(groupId, workerId) {
    const companyData = getCompanyData();
    const groups = companyData.taskGroups || [];
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    if (group.members) {
        group.members = group.members.filter(id => id !== workerId);
    }

    db.ref(`companies/${currentCompany}/taskGroups`).set(groups)
        .then(() => renderAll())
        .catch(err => console.error("Error removing member:", err));
}

window.getShiftDurationHours = getShiftDurationHours;
window.saveWorkerProfileChanges = saveWorkerProfileChanges;
window.addNewWorkerShift = addNewWorkerShift;
window.activateWorkerShift = activateWorkerShift;
window.deleteWorkerShift = deleteWorkerShift;
window.addOvertimeHour = addOvertimeHour;
window.deleteOvertimeHour = deleteOvertimeHour;
window.deleteOvertimeHourFromFin = deleteOvertimeHourFromFin;
window.submitCustodyRequest = submitCustodyRequest;
window.acceptCustodyRequest = acceptCustodyRequest;
window.rejectCustodyRequest = rejectCustodyRequest;
window.releaseCustodyRequest = releaseCustodyRequest;
window.renderWorkerCustodyRequests = renderWorkerCustodyRequests;
window.renderPendingCustodyRequests = renderPendingCustodyRequests;
window.renderAcceptedCustodyReleases = renderAcceptedCustodyReleases;
window.submitExitRequest = submitExitRequest;
window.handleExitRequest = handleExitRequest;
window.renderAttendanceOvertimeDetails = renderAttendanceOvertimeDetails;
window.addOvertimeHourFromAtt = addOvertimeHourFromAtt;
window.deleteOvertimeHourFromAtt = deleteOvertimeHourFromAtt;
window.addLateRule = addLateRule;
window.deleteLateRule = deleteLateRule;
window.renderLateRules = renderLateRules;
window.markWorkerSelfAttendance = markWorkerSelfAttendance;
window.createTaskGroup = createTaskGroup;
window.deleteTaskGroup = deleteTaskGroup;
window.addMemberToGroup = addMemberToGroup;
window.removeMemberFromGroup = removeMemberFromGroup;
window.renderTaskGroups = renderTaskGroups;

// Spend Order System
window.submitSpendOrder = submitSpendOrder;
window.cancelSpendOrder = cancelSpendOrder;
window.rejectSpendOrder = rejectSpendOrder;
window.acceptSpendOrder = acceptSpendOrder;
window.deleteSpendLog = deleteSpendLog;
window.renderSpendOrders = renderSpendOrders;
window.logDirectSpend = logDirectSpend;
window.logDirectSpendFromSales = logDirectSpendFromSales;
window.renderFinanceSpendArea = renderFinanceSpendArea;

// Form Toggling for Sales Section
function switchSalesForm(formId) {
    const containers = ['new-sale', 'past-sale', 'deposit', 'spend'];
    containers.forEach(id => {
        const el = document.getElementById(`form-${id}-container`);
        if (el) el.style.display = 'none';
        
        const btn = document.getElementById(`btn-sales-tab-${id}`);
        if (btn) {
            btn.classList.remove('active');
        }
    });

    const activeEl = document.getElementById(`form-${formId}-container`);
    if (activeEl) activeEl.style.display = 'block';

    const activeBtn = document.getElementById(`btn-sales-tab-${formId}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}
window.switchSalesForm = switchSalesForm;
window.editRiskAmount = editRiskAmount;
window.showUnassignedOverlay = showUnassignedOverlay;
window.hideUnassignedOverlay = hideUnassignedOverlay;
window.checkUnassignedUserAccess = checkUnassignedUserAccess;
window.openEditTaskModal = openEditTaskModal;
window.closeEditTaskModal = closeEditTaskModal;
window.saveEditedTask = saveEditedTask;
window.editPaymentRequestAmount = editPaymentRequestAmount;
window.editCustodyRequestAmount = editCustodyRequestAmount;
window.editManagerNote = editManagerNote;

// =========================================================================
// CUSTOM DEPARTMENT TAB BUTTON DRAG & DROP REORDERING ENGINE
// =========================================================================
let draggedTabElement = null;

function toggleTabReorderMode() {
    const isAr = currentAppLang === 'ar';
    const isEditing = document.body.classList.toggle('tabs-reorder-mode');
    const btn = document.getElementById('tab-reorder-btn');
    const container = document.getElementById('department-tabs-container');
    if (!container) return;

    const tabs = container.querySelectorAll('.dept-tab');

    if (isEditing) {
        if (btn) btn.innerHTML = `💾 ${isAr ? 'حفظ الترتيب' : 'Save Tab Order'}`;
        // Enable dragging on tabs
        tabs.forEach(tab => {
            tab.setAttribute('draggable', 'true');
            initTabDragEvents(tab, container);
        });
    } else {
        if (btn) btn.innerHTML = `✏️ ${isAr ? 'تعديل التبويبات' : 'Reorder Tabs'}`;
        // Disable dragging on tabs
        tabs.forEach(tab => {
            tab.removeAttribute('draggable');
            tab.classList.remove('is-dragging', 'drag-over');
        });
        saveUserTabOrder();
        alert(isAr ? 'تم حفظ ترتيب التبويبات بنجاح!' : 'Department tab order saved successfully!');
    }
}
window.toggleTabReorderMode = toggleTabReorderMode;

function initTabDragEvents(tab, container) {
    if (tab.dataset.dragInitialized) return;
    tab.dataset.dragInitialized = 'true';

    // --- MOUSE DRAG EVENTS ---
    tab.addEventListener('dragstart', (e) => {
        if (!document.body.classList.contains('tabs-reorder-mode')) return;
        draggedTabElement = tab;
        tab.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', tab.id);
    });

    tab.addEventListener('dragend', () => {
        tab.classList.remove('is-dragging');
        const allTabs = container.querySelectorAll('.dept-tab');
        allTabs.forEach(t => t.classList.remove('drag-over'));
        draggedTabElement = null;
        saveUserTabOrder();
    });

    tab.addEventListener('dragover', (e) => {
        if (!document.body.classList.contains('tabs-reorder-mode')) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedTabElement && draggedTabElement !== tab) {
            tab.classList.add('drag-over');
            const targetBounding = tab.getBoundingClientRect();
            const mouseX = e.clientX;
            const targetCenter = targetBounding.left + (targetBounding.width / 2);
            if (mouseX < targetCenter) {
                container.insertBefore(draggedTabElement, tab);
            } else {
                container.insertBefore(draggedTabElement, tab.nextElementSibling);
            }
        }
    });

    tab.addEventListener('dragleave', () => {
        tab.classList.remove('drag-over');
    });

    tab.addEventListener('drop', (e) => {
        if (!document.body.classList.contains('tabs-reorder-mode')) return;
        e.preventDefault();
        tab.classList.remove('drag-over');
        saveUserTabOrder();
    });

    // --- TOUCH / MOBILE DRAG & HOLD EVENTS ---
    let touchTimer = null;
    let isTouchDragging = false;

    tab.addEventListener('touchstart', (e) => {
        if (!document.body.classList.contains('tabs-reorder-mode')) return;
        touchTimer = setTimeout(() => {
            isTouchDragging = true;
            draggedTabElement = tab;
            tab.classList.add('is-dragging');
            if (navigator.vibrate) navigator.vibrate(50);
        }, 200);
    }, { passive: true });

    tab.addEventListener('touchmove', (e) => {
        if (!document.body.classList.contains('tabs-reorder-mode') || !isTouchDragging) {
            clearTimeout(touchTimer);
            return;
        }
        e.preventDefault();
        const touch = e.touches[0];
        const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
        if (targetEl) {
            const closestTab = targetEl.closest('.dept-tab');
            if (closestTab && closestTab !== draggedTabElement && closestTab.parentNode === container) {
                const targetBounding = closestTab.getBoundingClientRect();
                const touchX = touch.clientX;
                const targetCenter = targetBounding.left + (targetBounding.width / 2);
                if (touchX < targetCenter) {
                    container.insertBefore(draggedTabElement, closestTab);
                } else {
                    container.insertBefore(draggedTabElement, closestTab.nextElementSibling);
                }
            }
        }
    }, { passive: false });

    tab.addEventListener('touchend', () => {
        clearTimeout(touchTimer);
        if (isTouchDragging) {
            isTouchDragging = false;
            if (draggedTabElement) {
                draggedTabElement.classList.remove('is-dragging');
            }
            draggedTabElement = null;
            saveUserTabOrder();
        }
    });
}

function saveUserTabOrder() {
    if (!currentUser || !currentUser.email) return;
    const container = document.getElementById('department-tabs-container');
    if (!container) return;

    const tabIds = Array.from(container.children)
        .filter(el => el.classList && el.classList.contains('dept-tab'))
        .map(el => el.id);

    const emailKey = currentUser.email.toLowerCase();
    const storageKey = `user_tab_order_${emailKey}_${currentCompany}`;
    try {
        localStorage.setItem(storageKey, JSON.stringify(tabIds));
    } catch (e) { console.error(e); }

    if (db && currentCompany && emailKey) {
        const userKey = emailKey.replace(/\./g, ',');
        db.ref(`companies/${currentCompany}/userTabOrders/${userKey}`).set(tabIds)
            .catch(err => console.error("Error syncing tab order:", err));
    }
}
window.saveUserTabOrder = saveUserTabOrder;

function applyUserTabOrder() {
    if (!currentUser || !currentUser.email) return;
    const container = document.getElementById('department-tabs-container');
    if (!container) return;

    const emailKey = currentUser.email.toLowerCase();
    const storageKey = `user_tab_order_${emailKey}_${currentCompany}`;
    let tabIds = null;
    try {
        const stored = localStorage.getItem(storageKey);
        if (stored) tabIds = JSON.parse(stored);
    } catch (e) { console.error(e); }

    if (!tabIds && db && currentCompany) {
        const userKey = emailKey.replace(/\./g, ',');
        db.ref(`companies/${currentCompany}/userTabOrders/${userKey}`).once('value')
            .then(snapshot => {
                const val = snapshot.val();
                if (val && Array.isArray(val)) {
                    try { localStorage.setItem(storageKey, JSON.stringify(val)); } catch (e) {}
                    reorderTabContainer(container, val);
                }
            }).catch(e => console.error(e));
        return;
    }

    if (tabIds && Array.isArray(tabIds)) {
        reorderTabContainer(container, tabIds);
    }
}

function reorderTabContainer(container, tabIds) {
    tabIds.forEach(id => {
        const tabEl = document.getElementById(id);
        if (tabEl && tabEl.parentNode === container) {
            container.appendChild(tabEl);
        }
    });
}
window.applyUserTabOrder = applyUserTabOrder;

// Initial run
applyTranslations();


