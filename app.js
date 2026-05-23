// =============================================
        // FEATURE 1: IN-APP NOTIFICATION SYSTEM
        // =============================================

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
            const toggleBtn = document.querySelector('.password-toggle');
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

        // --- CORE STATE & DATA ---
        let appData = { burgeroov: { branches: ['Main Branch'], workers: [], violationRules: [], jobCatalog: [], warehouse: [], admins: ['kinan.rahal@hotmail.com'] } };
        const today = new Date();
        let currentGlobalMonth = today.toISOString().slice(0, 7);
        let currentTab = 'ops';
        let globalInterval = null;
        let activeDriverId = null;
        let currentUser = null;
        let isInitialLoad = true;

        // FEATURE 1: Task tracking state — tracks previously seen task IDs for the current worker
        let previousTaskIds = [];

        const translations = {
            en: { empName: "Employee Name", role: "Role", branch: "Branch", shift: "Shift Schedule", baseIncome: "Base Salary (SAR)", rewards: "Rewards (+)", violations: "Violations (-)", netPay: "Net Payable (SAR)", paid: "Paid This Month (SAR)", remaining: "Remaining To Pay (SAR)", costs: "Company Costs", custody: "Custody (SAR)", avgPerf: "Avg Perf (%)", goodNotes: "Good Notes", badNotes: "Bad Notes", deliveries: "Deliveries", initialBalance: "Initial Debt Carryover", unassigned: "Unassigned", na: "N/A", generatedOn: "Generated on:", reportTitle: "Financial & Payroll Report" },
            ar: { empName: "اسم الموظف", role: "المسمى الوظيفي", branch: "الفرع", shift: "أوقات العمل", baseIncome: "الراتب الأساسي (ريال)", rewards: "المكافآت (+)", violations: "الخصومات (-)", netPay: "صافي الراتب المستحق (ريال)", paid: "المدفوع هذا الشهر (ريال)", remaining: "المتبقي للدفع (ريال)", costs: "تكاليف الشركة", custody: "رصيد العهدة (ريال)", avgPerf: "متوسط الأداء (%)", goodNotes: "ملاحظات جيدة", badNotes: "ملاحظات سيئة", deliveries: "التوصيلات", initialBalance: "رصيد متبقي سابق", unassigned: "غير محدد", na: "غير متوفر", generatedOn: "تاريخ إنشاء التقرير:", reportTitle: "تقرير مسير الرواتب والمالية" }
        };

        function getCompanyData() { return appData.burgeroov; }

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
                overlay.style.display = 'none';
                appWrapper.style.display = 'block';

                setTodayDisplay();
                document.getElementById('global-month').value = currentGlobalMonth;
                setDatePickerLimits();

                document.getElementById('auth-loader').style.display = 'none';
                document.getElementById('auth-btn').style.display = 'block';

                listenToCloudData();
                startGlobalTick();

                // Register Firebase Messaging service worker
                // This is stored globally so initFCMToken() can reuse the registration
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('./firebase-messaging-sw.js')
                        .then(reg => {
                            console.log('[SW] Service worker registered:', reg.scope);
                            window.__swRegistration = reg;
                        })
                        .catch(err => console.warn('[SW] Service worker registration failed:', err));
                }
            } else {
                currentUser = null;
                document.getElementById('auth-loader').style.display = 'none';
                document.getElementById('auth-btn').style.display = 'block';
                overlay.style.display = 'flex';
                appWrapper.style.display = 'none';
            }
        });

        function toggleAuthMode() {
            authMode = authMode === 'login' ? 'signup' : 'login';
            document.getElementById('auth-title').textContent = authMode === 'login' ? 'Login to Dashboard' : 'Create Viewer Account';
            document.getElementById('auth-btn').textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
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
                errorMsg.textContent = "Please enter email and password.";
                errorMsg.style.display = 'block'; return;
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

        function logout() { auth.signOut(); }

        // --- ROLE BASED ACCESS CONTROL (RBAC) ---
        function applyUserRoles() {
            if (!currentUser) return;
            const email = currentUser.email.toLowerCase();
            const admins = appData.burgeroov.admins || ['kinan.rahal@hotmail.com'];

            let isKinan = email === 'kinan.rahal@hotmail.com';
            let isAdmin = isKinan || admins.map(e => e.toLowerCase()).includes(email);

            let wPerms = { warehouse: false, drivers: false, finance: false, sales: false, costs: false, adverts: false };

            // Global Privacy Config
            const deptPrivacy = appData.burgeroov.deptPrivacy || {
                warehouse: 'restricted', drivers: 'restricted', finance: 'restricted', sales: 'restricted', costs: 'restricted', adverts: 'restricted'
            };
            if (!deptPrivacy.adverts) deptPrivacy.adverts = 'restricted';
            if (!deptPrivacy.costs) deptPrivacy.costs = 'restricted';

            const worker = appData.burgeroov.workers.find(w => w.email && w.email.toLowerCase() === email);
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

            document.body.className = 'theme-burgeroov';
            if (isDarkMode) document.body.classList.add('dark-mode');

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
                if (isDriver) document.body.classList.add('is-driver');
            }

            const roleBadge = document.getElementById('display-user-role');
            roleBadge.textContent = isAdmin ? 'Manager' : 'Worker';
            roleBadge.style.backgroundColor = isAdmin ? 'var(--secondary)' : 'rgba(255,255,255,0.15)';

            // Always run after body classes are set
            markLockedTabs();
        }

        /**
         * Marks tabs as visually locked (⛓️) for workers who lack access.
         * Called every time applyUserRoles() runs (i.e. on every Firebase sync).
         */
        function markLockedTabs() {
            const isAdmin = document.body.classList.contains('role-admin');

            // Map: tabId → does current user have access?
            const access = {
                warehouse : isAdmin || document.body.classList.contains('perm-warehouse'),
                drivers   : isAdmin || document.body.classList.contains('perm-drivers') || document.body.classList.contains('is-driver'),
                finance   : isAdmin || document.body.classList.contains('perm-finance'),
                managing  : isAdmin || document.body.classList.contains('perm-sales'),
                costs     : isAdmin || document.body.classList.contains('perm-costs'),
                adverts   : isAdmin || document.body.classList.contains('perm-adverts'),
            };

            Object.entries(access).forEach(([tabId, hasAccess]) => {
                const btn    = document.getElementById(`tab-${tabId}`);
                const mobBtn = document.getElementById(`mob-tab-${tabId}`);
                if (btn)    btn.classList.toggle('tab-locked', !hasAccess);
                if (mobBtn) mobBtn.classList.toggle('tab-locked', !hasAccess);
                // Also lock dept sheet items (use data-tab)
                document.querySelectorAll(`.mob-sheet-tab[data-tab="${tabId}"]`).forEach(el => {
                    el.classList.toggle('tab-locked', !hasAccess);
                });
            });
        }

        // --- REAL-TIME DATABASE SYNC ---
        function ensureArraysExist(data) {
            if (!data.admins) data.admins = ['kinan.rahal@hotmail.com'];
            if (!data.branches) data.branches = [];
            if (!data.workers) data.workers = [];
            if (!data.violationRules) data.violationRules = [];
            if (!data.jobCatalog) data.jobCatalog = [];
            if (!data.warehouse) data.warehouse = [];
            if (!data.adverts) data.adverts = [];
            if (!data.whCategories) data.whCategories = [];

            // Privacy & Management Data
            if (!data.deptPrivacy) data.deptPrivacy = { warehouse: 'restricted', drivers: 'restricted', finance: 'restricted', sales: 'restricted', costs: 'restricted', adverts: 'restricted' };
            if (!data.deptPrivacy.adverts) data.deptPrivacy.adverts = 'restricted';
            if (!data.deptPrivacy.costs) data.deptPrivacy.costs = 'restricted';
            if (!data.managerNotes) data.managerNotes = [];
            data.managerNotes.forEach(n => { if (!n.replies) n.replies = []; });
            if (!data.incomeSources) data.incomeSources = ['Cash', 'Credit Card'];
            if (!data.salesLogs) data.salesLogs = [];
            if (!data.disabledSalesMethods) data.disabledSalesMethods = [];

            // New Costs Data
            if (!data.costCategories) data.costCategories = ['Electric Bill', 'Meat Supplier', 'Packaging'];
            if (!data.costLogs) data.costLogs = []; // Daily costs ledger

            data.warehouse.forEach(item => {
                if (!item.logs) item.logs = [];
                if (!item.category) item.category = 'Uncategorized';
            });

            data.workers.forEach(w => {
                if (!w.jobs) w.jobs = [];
                if (!w.logs) w.logs = [];
                if (!w.email) w.email = "";
                if (!w.permissions) w.permissions = { warehouse: false, drivers: false, finance: false, sales: false };
                if (!w.monthlyStats) w.monthlyStats = {};
                Object.keys(w.monthlyStats).forEach(month => {
                    let ms = w.monthlyStats[month];
                    if (!ms.custodyList) ms.custodyList = [];
                    if (!ms.violationsList) ms.violationsList = [];
                    if (!ms.rewardsList) ms.rewardsList = [];
                    if (!ms.paymentsList) ms.paymentsList = [];
                    if (!ms.deliveriesList) ms.deliveriesList = [];
                });
            });

            data.warehouse.forEach(item => {
                if (!item.logs) item.logs = [];
            });
        }

        function listenToCloudData() {
            db.ref('companies/burgeroov').on('value', (snapshot) => {
                if (snapshot.exists()) {
                    appData.burgeroov = snapshot.val();
                    ensureArraysExist(appData.burgeroov);
                } else {
                    appData.burgeroov = { admins: ['kinan.rahal@hotmail.com'], branches: ['Main Branch'], workers: [], violationRules: [], jobCatalog: [], warehouse: [] };
                    saveData();
                }

                applyUserRoles();

                if (isInitialLoad) {
                    migrateMonthlyData();
                    runAutoLogger();
                    initFCMToken(); // ← Capture & save device token on first load

                    if (currentUser && currentUser.role === 'worker') {
                        const myWorker = appData.burgeroov.workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
                        if (myWorker) {
                            if (myWorker.jobs) previousTaskIds = myWorker.jobs.map(j => j.id);
                            // Track initial active order time to avoid false notification on login
                            window.previousOrderStartTime = myWorker.activeOrder ? myWorker.activeOrder.startTime : null;
                        }
                    }
                    isInitialLoad = false;
                } else {
                    if (currentUser && currentUser.role === 'worker') {
                        const myWorker = appData.burgeroov.workers.find(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
                        if (myWorker) {
                            // 1. Task Check
                            if (myWorker.jobs) {
                                const currentTaskIds = myWorker.jobs.map(j => j.id);
                                const newTasks = currentTaskIds.filter(id => !previousTaskIds.includes(id));
                                if (newTasks.length > 0) {
                                    showInAppNotification('📋 ' + (t('title-tasks-board') || 'You have a new task!'));
                                }
                                previousTaskIds = currentTaskIds;
                            }

                            // 2. Delivery Order Check
                            const currentOrderStart = myWorker.activeOrder ? myWorker.activeOrder.startTime : null;
                            if (currentOrderStart && currentOrderStart !== window.previousOrderStartTime) {
                                showInAppNotification('🛵 ' + (t('title-current-order') || 'You have a new delivery order!'));
                            }
                            window.previousOrderStartTime = currentOrderStart;
                        }
                    }
                }

                renderAll();
                checkStockAlerts();
            }, (error) => {
                console.error("Error listening to database:", error);
                alert("Database connection error. Ensure your Firebase Rules are set to true.");
            });
        }

        function saveData() {
            db.ref('companies/burgeroov').set(appData.burgeroov)
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
            const workers = appData.burgeroov.workers || [];
            const workerIndex = workers.findIndex(
                w => w.email && w.email.toLowerCase() === email
            );

            if (workerIndex === -1) {
                // Admin or un-matched email: store token in a separate lookup node
                db.ref('companies/burgeroov/adminTokens/' + btoa(email).replace(/=/g, ''))
                    .set({ email, fcmToken: token, updatedAt: Date.now() })
                    .then(() => console.log('[FCM] Admin token stored.'))
                    .catch(err => console.error('[FCM] Failed to store admin token:', err));
                return;
            }

            const workerRef = db.ref(`companies/burgeroov/workers/${workerIndex}`);

            // Only write if the token actually changed (avoids noisy RTDB writes)
            const currentToken = workers[workerIndex].fcmToken;
            if (currentToken === token) {
                console.log('[FCM] Token unchanged — no write needed.');
                return;
            }

            workerRef.update({ fcmToken: token, fcmUpdatedAt: Date.now() })
                .then(() => {
                    console.log('[FCM] Token saved for worker:', workers[workerIndex].name);
                    // Mirror into local appData so the next save() includes it
                    workers[workerIndex].fcmToken = token;
                    workers[workerIndex].fcmUpdatedAt = Date.now();
                })
                .catch(err => console.error('[FCM] Failed to save token:', err));
        }


        function migrateMonthlyData() {
            let migrated = false;
            let company = appData.burgeroov;

            company.workers.forEach(w => {
                if (!w.email) { w.email = ""; migrated = true; }
                if (!w.permissions) { w.permissions = { warehouse: false, drivers: false, finance: false }; migrated = true; }
                if (!w.monthlyStats) { w.monthlyStats = {}; migrated = true; }
                if (!w.monthlyStats[currentGlobalMonth]) {
                    w.monthlyStats[currentGlobalMonth] = { custodyList: [], rewardsList: [], costs: 0, paymentsList: [], violationsList: [], deliveriesList: [], legacyDeliveries: 0 };
                    migrated = true;
                }
                if (!w.role) { w.role = "General Staff"; migrated = true; }
                if (!w.initialBalance) { w.initialBalance = 0; migrated = true; }
                if (!w.jobs) { w.jobs = []; migrated = true; }
                if (!w.rank) { w.rank = "Unranked"; migrated = true; }
                if (w.lastEvalDate === undefined) { w.lastEvalDate = Date.now(); migrated = true; }
            });

            if (migrated) saveData();
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

            getCompanyData().workers.forEach(w => {
                if (!isFuture) {
                    const originalCount = w.logs.length;
                    w.logs = w.logs.filter(l => l.date <= todayStr || l.note !== 'Auto-logged ✅');
                    if (w.logs.length !== originalCount) updated = true;
                }

                for (let i = 1; i <= targetDayLimit; i++) {
                    let dStr = `${selYear}-${monthStrPad}-${i.toString().padStart(2, '0')}`;
                    let existing = w.logs.find(l => l.date === dStr);
                    if (!existing) {
                        w.logs.push({ date: dStr, score: 100, note: 'Auto-logged ✅', noteType: 'good' });
                        updated = true;
                    }
                }
                w.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
            });
            if (updated) saveData();
        }

        // --- PERMISSION FILTERING ---
        function getVisibleWorkers() {
            const workers = getCompanyData().workers;
            if (currentUser && currentUser.role === 'admin') {
                return workers;
            } else {
                return workers.filter(w => w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
            }
        }

        // --- ADMIN / MANAGER ACCESS SYSTEM ---
        function renderManagersList() {
            const list = document.getElementById('managers-list');
            if (!list) return;
            list.innerHTML = '';
            getCompanyData().admins.forEach(email => {
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
            if (!appData.burgeroov.admins.includes(email)) {
                appData.burgeroov.admins.push(email);
                document.getElementById('new-manager-email').value = '';
                saveData();
            }
        }

        function deleteManager(email) {
            if (!currentUser.isKinan) return alert("Only the ultimate admin can demote managers.");
            if (email === 'kinan.rahal@hotmail.com') return alert("Cannot demote master admin.");
            if (confirm(`${t('btn-remove')} ${email}?`)) {
                appData.burgeroov.admins = appData.burgeroov.admins.filter(e => e !== email);
                saveData();
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
                return;
            }
            const worker = getCompanyData().workers.find(w => w.id === wId);
            const p = worker.permissions || { warehouse: false, drivers: false, finance: false, sales: false, costs: false, adverts: false };
            document.getElementById('perm-wh').checked = !!p.warehouse;
            document.getElementById('perm-drv').checked = !!p.drivers;
            document.getElementById('perm-fin').checked = !!p.finance;
            document.getElementById('perm-sales').checked = !!p.sales;
            document.getElementById('perm-costs').checked = !!p.costs;
            document.getElementById('perm-adverts').checked = !!p.adverts;
        }

        function saveWorkerPerms() {
            const wId = document.getElementById('perm-worker-select').value;
            if (!wId) return alert("Select a worker first.");
            const worker = getCompanyData().workers.find(w => w.id === wId);
            worker.permissions = {
                warehouse: document.getElementById('perm-wh').checked,
                drivers: document.getElementById('perm-drv').checked,
                finance: document.getElementById('perm-fin').checked,
                sales: document.getElementById('perm-sales').checked,
                costs: document.getElementById('perm-costs').checked,
                adverts: document.getElementById('perm-adverts').checked
            };
            saveData();
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
            saveData();
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

        function triggerNoteImageUpload() {
            if (noteMediaRecorder && noteMediaRecorder.state === 'recording') {
                stopVoiceRecording(false);
            }
            document.getElementById('note-image-input').click();
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
                    alert("Could not access microphone. Please verify site permissions in your browser/settings.");
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

        function triggerReplyImageUpload(noteId) {
            if (replyMediaRecorders[noteId] && replyMediaRecorders[noteId].state === 'recording') {
                stopReplyVoiceRecording(noteId, false);
            }
            
            let fileInput = document.getElementById('reply-image-input-global');
            if (!fileInput) {
                fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.id = 'reply-image-input-global';
                fileInput.accept = 'image/*';
                fileInput.style.display = 'none';
                document.body.appendChild(fileInput);
            }
            
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
                    alert("Could not access microphone. Please verify site permissions in your browser/settings.");
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

            const newNote = {
                id: Date.now().toString(),
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
            saveData();
        }

        function deleteManagerNote(id) {
            if (!confirm("Delete this note entirely?")) return;
            getCompanyData().managerNotes = getCompanyData().managerNotes.filter(n => n.id !== id);
            saveData();
        }

        function addNoteReply(noteId) {
            const input = document.getElementById(`reply-input-${noteId}`);
            const text = input.value.trim();
            const type = replyAttachmentTypes[noteId] || null;
            const data = replyAttachmentDatas[noteId] || null;

            if (!text && !data) return;

            const note = getCompanyData().managerNotes.find(n => n.id === noteId);
            if (note) {
                if (!note.replies) note.replies = [];
                note.replies.push({
                    author: currentUser.email,
                    text: text,
                    date: formatTimestamp(),
                    attachmentType: type,
                    attachmentData: data
                });
                
                input.value = '';
                clearReplyAttachment(noteId);
                saveData();
            }
        }

        function renderNotes() {
            if (currentTab !== 'notes') return;

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

                let delBtn = (currentUser.role === 'admin') ? `<button onclick="deleteManagerNote('${n.id}')" class="btn-outline-danger" style="padding:4px 10px; font-size:0.8rem; border:none; text-decoration:underline;">Delete Thread</button>` : '';
                let lockIcon = n.isPrivate ? `<span class="badge" style="background:var(--danger); font-size:0.85rem;">🔒 Private Note</span>` : `<span class="badge" style="background:var(--info); font-size:0.85rem;">📢 Public Announcement</span>`;

                let repliesHtml = '';
                if (n.replies && n.replies.length > 0) {
                    repliesHtml = n.replies.map(r => {
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

                        return `
                            <div style="background: var(--bg-color); padding: 12px 16px; border-radius: 8px; margin-top: 10px; border-left: 3px solid var(--border-color);">
                                <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-muted); margin-bottom:6px;">
                                    <strong>${r.author}</strong> <span>🕒 ${r.date}</span>
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
                                <button type="button" class="btn-outline" style="padding: 8px 10px; min-height:36px; height:36px; font-size: 0.8rem; border-radius: 6px; display:flex; align-items:center; gap:4px; border:1px solid var(--border-color); background:var(--card-bg); color:var(--text-main); cursor:pointer;" onclick="triggerReplyImageUpload('${n.id}')" title="Attach Image">
                                    📷 Image
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
                        <div style="display:flex; gap:10px; align-items:center;">
                            ${lockIcon} <span style="font-size:0.85rem; color:var(--text-muted);">🕒 ${n.date}</span>
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

        function addIncomeSource() {
            const source = document.getElementById('new-income-source').value.trim();
            if (source) {
                if (!getCompanyData().incomeSources) getCompanyData().incomeSources = [];
                if (!getCompanyData().incomeSources.includes(source)) {
                    getCompanyData().incomeSources.push(source);
                    document.getElementById('new-income-source').value = '';
                    saveData();
                } else {
                    alert("This income source already exists.");
                }
            }
        }

        function deleteIncomeSource(sourceName) {
            if (!confirm(`Delete the income source '${sourceName}'?`)) return;
            getCompanyData().incomeSources = getCompanyData().incomeSources.filter(s => s !== sourceName);
            saveData();
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

            const now = new Date();
            const newLog = {
                id: Date.now().toString(),
                amount: amount,
                method: method,
                date: formatTimestamp(),
                timestamp: now.getTime(),
                month: currentGlobalMonth,
                cashier: currentUser.email
            };

            if (!getCompanyData().salesLogs) getCompanyData().salesLogs = [];
            getCompanyData().salesLogs.unshift(newLog);

            amountInput.value = '';
            saveData();
        }

        function deleteSaleTransaction(id) {
            if (!confirm("Delete this transaction record?")) return;
            getCompanyData().salesLogs = getCompanyData().salesLogs.filter(l => l.id !== id);
            saveData();
        }

        function toggleSalesMethod(methodName) {
            let disabled = getCompanyData().disabledSalesMethods || [];
            if (disabled.includes(methodName)) {
                disabled = disabled.filter(m => m !== methodName);
            } else {
                disabled.push(methodName);
            }
            getCompanyData().disabledSalesMethods = disabled;
            saveData();
        }

        function renderManaging() {
            if (currentTab !== 'managing') return;

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
            const now = new Date();
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
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
                    const startTs = new Date(fParts[0], fParts[1]-1, fParts[2]).getTime();
                    const endTs = new Date(tParts[0], tParts[1]-1, tParts[2]).getTime() + 86400000;
                    filteredLogs = allLogs.filter(l => l.timestamp >= startTs && l.timestamp < endTs);
                    filteredLogs.forEach(l => {
                        if (disabledMethods.includes(l.method)) return;
                        const d = new Date(l.timestamp);
                        const key = String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
                        histoData[key] = (histoData[key] || 0) + l.amount;
                    });
                }
            }

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
                if (!disabledMethods.includes(l.method)) {
                    grandTotal += l.amount;
                }
            });

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

                    return `
                        <div onclick="toggleSalesMethod('${methodName}')" style="cursor: pointer; background: ${bg}; border: 2px solid ${border}; color: ${color}; padding: 12px 20px; border-radius: 12px; text-align: left; min-width: 140px; transition: transform 0.1s; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; margin-bottom: 6px;">${icon} ${methodName}</div>
                            <div style="font-size: 1.25rem; font-weight: 800;">SAR ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                    `;
                }).join('');
            }

            // Draw Histogram (upgraded quality)
            const histoDiv = document.getElementById('sales-histogram');
            if (histoDiv) {
                histoDiv.innerHTML = '';
                const labels = Object.keys(histoData);
                if (labels.length === 0) {
                    histoDiv.innerHTML = '<div style="width:100%; text-align:center; color:var(--text-muted); margin-top:80px; font-size:0.9rem;">No data for this timeframe.</div>';
                } else {
                    const maxVal = Math.max(...Object.values(histoData), 1);
                    labels.forEach(label => {
                        const val = histoData[label];
                        const pct = Math.max(2, (val / maxVal) * 100);
                        const display = val >= 1000 ? (val/1000).toFixed(1)+'k' : val.toFixed(0);
                        histoDiv.innerHTML += `
                            <div class="histogram-bar-wrapper" title="${label}: SAR ${val.toLocaleString(undefined,{minimumFractionDigits:2})}" style="cursor:default;">
                                <div style="font-size:0.6rem; color:var(--primary); font-weight:800; text-align:center; margin-bottom:3px; white-space:nowrap;">${display}</div>
                                <div class="histogram-bar" style="height:${pct}%; background: linear-gradient(180deg, var(--primary) 0%, var(--secondary) 100%); border-radius:4px 4px 0 0; box-shadow: 0 -2px 8px rgba(99,102,241,0.3);"></div>
                                <div class="histogram-label" style="font-size:0.6rem; margin-top:4px;">${label}</div>
                            </div>
                        `;
                    });
                }
            }

            // Draw Recent Transactions Log
            const logDiv = document.getElementById('sales-transaction-log');
            if (logDiv) {
                logDiv.innerHTML = '';
                if (filteredLogs.length === 0) {
                    logDiv.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.95rem; padding: 20px;">No transactions logged for this timeframe.</p>`;
                } else {
                    filteredLogs.forEach(l => {
                        const isCounted = !disabledMethods.includes(l.method);
                        const opacity = isCounted ? '1' : '0.5';
                        const strike = isCounted ? 'none' : 'line-through';
                        let delBtn = isAdmin ? `<button onclick="deleteSaleTransaction('${l.id}')" style="background: var(--danger-bg); border: 1px solid var(--danger-border); border-radius:6px; color: var(--danger); font-size: 0.9rem; cursor: pointer; padding: 6px 12px; font-weight:bold;" title="Delete">Undo</button>` : '';

                        logDiv.innerHTML += `
                            <div class="ledger-card" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; opacity: ${opacity}; margin-bottom: 0;">
                                <div>
                                    <div style="font-weight: 800; font-size: 1.25rem; color: var(--text-main); text-decoration: ${strike};">SAR ${l.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 6px; display:flex; gap:8px; align-items:center;">
                                        <span class="badge" style="background: ${isCounted ? 'var(--primary)' : 'var(--text-muted)'}; color: white; padding:2px 8px;">${l.method}</span> 
                                        <span>🕒 ${l.date}</span>
                                        <span style="font-style:italic; opacity:0.7;">by ${l.cashier.split('@')[0]}</span>
                                    </div>
                                </div>
                                <div>${delBtn}</div>
                            </div>
                        `;
                    });
                }
            }
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
                saveData();
                renderCosts();
            } else {
                alert("This cost category already exists.");
            }
        }

        function deleteCostCategory(name) {
            if (!confirm(`Delete cost category '${name}'?\n\n(This hides it from the dropdown but doesn't delete old logs).`)) return;
            getCompanyData().costCategories = getCompanyData().costCategories.filter(c => c !== name);
            saveData();
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

            const now = new Date();
            const newLog = {
                id: Date.now().toString(),
                amount: amount,
                method: method,
                date: formatTimestamp(),
                timestamp: now.getTime(),
                month: currentGlobalMonth,
                cashier: currentUser.email
            };

            if (!getCompanyData().costLogs) getCompanyData().costLogs = [];
            getCompanyData().costLogs.unshift(newLog);

            amountInput.value = '';
            saveData();
            renderCosts();
        }

        function deleteCostTransaction(id) {
            if (!confirm("Delete this cost record?")) return;
            getCompanyData().costLogs = getCompanyData().costLogs.filter(l => l.id !== id);
            saveData();
            renderCosts();
        }

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
            if (password !== 'N1231') {
                alert('❌ Incorrect password. Access denied.');
                document.getElementById('past-cost-password').value = '';
                return;
            }

            const parts = dateStr.split('-');
            const d = new Date(parts[0], parts[1]-1, parts[2]);
            const today = new Date(); today.setHours(0,0,0,0);
            if (d >= today) { alert('Please select a date in the past (not today or future).'); return; }

            const timestamp = d.getTime() + (12 * 3600000); // noon of that day
            const newLog = {
                id: Date.now().toString(),
                amount: amount,
                method: category,
                date: dateStr + ' (past entry)',
                timestamp: timestamp,
                month: dateStr.slice(0,7),
                cashier: currentUser.email,
                isPastEntry: true
            };

            if (!getCompanyData().costLogs) getCompanyData().costLogs = [];
            getCompanyData().costLogs.unshift(newLog);

            document.getElementById('past-cost-amount').value = '';
            document.getElementById('past-cost-password').value = '';
            document.getElementById('past-cost-date').value = '';
            saveData();
            renderCosts();
            alert(`✅ Past cost of SAR ${amount} for '${category}' on ${dateStr} has been logged!`);
        }

        function renderCosts() {
            if (currentTab !== 'costs') return;
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

            const now = new Date();
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
                labelText = 'Past 7 Days';
            }
            else if (currentCostsTimeframe === 'month') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
                filteredSales = allSales.filter(l => l.timestamp >= startOfMonth);
                filteredCosts = allCosts.filter(l => l.timestamp >= startOfMonth);
                labelText = 'This Month';
            }
            else if (currentCostsTimeframe === 'year') {
                const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
                filteredSales = allSales.filter(l => l.timestamp >= startOfYear);
                filteredCosts = allCosts.filter(l => l.timestamp >= startOfYear);
                labelText = 'This Year';
            }
            else if (currentCostsTimeframe === 'custom') {
                const fromPicker = document.getElementById('costs-from-date');
                const toPicker = document.getElementById('costs-to-date');
                if (fromPicker.value && toPicker.value) {
                    const fParts = fromPicker.value.split('-');
                    const tParts = toPicker.value.split('-');
                    const startTs = new Date(fParts[0], fParts[1]-1, fParts[2]).getTime();
                    const endTs = new Date(tParts[0], tParts[1]-1, tParts[2]).getTime() + 86400000;
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
                if (netProfit > 0) { statusDiv.textContent = '📈 Healthy Profit Margin'; statusDiv.style.color = 'var(--success)'; }
                else if (netProfit < 0) { statusDiv.textContent = '⚠️ Operating at a Loss'; statusDiv.style.color = 'var(--danger)'; }
                else { statusDiv.textContent = '➖ Breaking Even'; statusDiv.style.color = 'var(--text-muted)'; }
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
                if (mode === 'hour') return String(d.getHours()).padStart(2,'0') + ':00';
                if (mode === 'month') return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
                return String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
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
                    histoDiv.innerHTML = '<div style="width:100%; text-align:center; color:var(--text-muted); padding-top:100px; font-size:0.95rem;">No data for this timeframe.</div>';
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
                        const fmt = v => v >= 1000 ? (v/1000).toFixed(1)+'k' : v.toFixed(0);

                        // Structure: outer column (flex col, align-items:flex-end, height=CHART_H px)
                        // label row floats above; bars sit at the bottom baseline
                        histoDiv.innerHTML += `
                            <div title="${label}&#10;Sales: SAR ${sVal.toLocaleString()}&#10;Costs: SAR ${cVal.toLocaleString()}"
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
                    logDiv.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.95rem; padding: 20px;">No costs logged for this timeframe.</p>`;
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
                            <div style="font-size:0.8rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:10px;">📊 Summary by Source</div>
                            <div style="display:flex; flex-direction:column; gap:6px;">${sourcesHtml}</div>
                            <div style="border-top:1px dashed var(--border-color); margin-top:12px; padding-top:10px; display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:0.9rem; font-weight:700; color:var(--text-muted);">Total Costs</span>
                                <span style="font-size:1.2rem; font-weight:800; color:var(--danger);">SAR ${totalCosts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                        <div style="font-size:0.8rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; padding-left:4px;">📋 All Transactions</div>
                    `;

                    // Render individual transaction entries
                    filteredCosts.forEach(l => {
                        let delBtn = isAdmin ? `<button onclick="deleteCostTransaction('${l.id}')" style="background: var(--danger-bg); border: 1px solid var(--danger-border); border-radius:6px; color: var(--danger); font-size: 0.9rem; cursor: pointer; padding: 6px 12px; font-weight:bold;" title="Delete">Undo</button>` : '';

                        logDiv.innerHTML += `
                            <div class="ledger-card" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; margin-bottom: 0;">
                                <div>
                                    <div style="font-weight: 800; font-size: 1.15rem; color: var(--danger);">SAR ${l.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 6px; display:flex; gap:8px; align-items:center;">
                                        <span class="badge" style="background: var(--danger); color: white; padding:2px 8px;">${l.method}</span> 
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
                const parts = (dp && dp.value ? dp.value : now.toISOString().slice(0,10)).split('-');
                const s = new Date(parts[0], parts[1]-1, parts[2]).getTime();
                filteredSales = allSales.filter(l => l.timestamp >= s && l.timestamp < s + 86400000);
                filteredCosts = allCosts.filter(l => l.timestamp >= s && l.timestamp < s + 86400000);
                labelText = dp ? dp.value : now.toISOString().slice(0,10);
            } else if (currentCostsTimeframe === 'week') {
                const s = new Date(now.getFullYear(), now.getMonth(), now.getDate()-7).getTime();
                filteredSales = allSales.filter(l => l.timestamp >= s);
                filteredCosts = allCosts.filter(l => l.timestamp >= s);
                labelText = 'Past 7 Days';
            } else if (currentCostsTimeframe === 'month') {
                const s = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
                filteredSales = allSales.filter(l => l.timestamp >= s);
                filteredCosts = allCosts.filter(l => l.timestamp >= s);
                labelText = 'This Month';
            } else if (currentCostsTimeframe === 'year') {
                const s = new Date(now.getFullYear(), 0, 1).getTime();
                filteredSales = allSales.filter(l => l.timestamp >= s);
                filteredCosts = allCosts.filter(l => l.timestamp >= s);
                labelText = 'This Year';
            } else if (currentCostsTimeframe === 'custom') {
                const fp = document.getElementById('costs-from-date');
                const tp = document.getElementById('costs-to-date');
                if (fp && tp && fp.value && tp.value) {
                    const fP = fp.value.split('-'), tP = tp.value.split('-');
                    const s = new Date(fP[0],fP[1]-1,fP[2]).getTime();
                    const e = new Date(tP[0],tP[1]-1,tP[2]).getTime() + 86400000;
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
            const sourceRows = Object.entries(sourceMap)
                .sort((a,b) => b[1]-a[1])
                .map(([src, total]) => `<tr><td>${src}</td><td style="text-align:right; font-weight:700;">SAR ${total.toLocaleString(undefined,{minimumFractionDigits:2})}</td><td style="text-align:right;">${totalCosts > 0 ? ((total/totalCosts)*100).toFixed(1)+'%' : '—'}</td></tr>`).join('');

            // Transaction rows
            const txRows = filteredCosts.map(l => `
                <tr>
                    <td>${l.date || '—'}</td>
                    <td>${l.method}</td>
                    <td style="text-align:right; font-weight:700; color:#dc2626;">SAR ${l.amount.toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                    <td>${l.cashier ? l.cashier.split('@')[0] : 'System'}${l.isPastEntry ? ' <em style="color:#f59e0b;">(past)</em>' : ''}</td>
                </tr>`).join('');

            const printHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8">
            <title>Costs Report — ${labelText}</title>
            <style>
                @page { margin: 16mm 12mm; size: A4; }
                * { box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; margin: 0; }
                h1 { font-size: 20px; margin: 0 0 4px; color: #0f172a; }
                .sub { font-size: 11px; color: #64748b; margin-bottom: 18px; }
                .hud { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
                .hud-box { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
                .hud-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
                .hud-val { font-size: 17px; font-weight: 900; margin-top: 6px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
                td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
                tr:last-child td { border-bottom: none; }
                .section-title { font-size: 13px; font-weight: 800; color: #0f172a; margin: 18px 0 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; }
                .profit { color: #16a34a; } .loss { color: #dc2626; } .neutral { color: #475569; }
                .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            </style></head><body>
            <h1>🧾 Burgeroov — Cost & P&L Report</h1>
            <div class="sub">Period: <strong>${labelText}</strong> &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()}</div>

            <div class="hud">
                <div class="hud-box">
                    <div class="hud-label">Net Profit</div>
                    <div class="hud-val ${netProfit > 0 ? 'profit' : netProfit < 0 ? 'loss' : 'neutral'}">${profitSign}SAR ${Math.abs(netProfit).toLocaleString(undefined,{minimumFractionDigits:2})}</div>
                </div>
                <div class="hud-box">
                    <div class="hud-label">Gross Sales</div>
                    <div class="hud-val profit">SAR ${totalSales.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
                </div>
                <div class="hud-box">
                    <div class="hud-label">Gross Costs</div>
                    <div class="hud-val loss">SAR ${totalCosts.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
                </div>
                <div class="hud-box">
                    <div class="hud-label">Transactions</div>
                    <div class="hud-val neutral">${filteredSales.length + filteredCosts.length}</div>
                </div>
            </div>

            <div class="section-title">📊 Cost Breakdown by Source</div>
            <table>
                <thead><tr><th>Source / Category</th><th style="text-align:right;">Total (SAR)</th><th style="text-align:right;">% of Total Costs</th></tr></thead>
                <tbody>${sourceRows || '<tr><td colspan="3" style="text-align:center;color:#94a3b8;">No cost records.</td></tr>'}</tbody>
                <tfoot><tr style="background:#fef2f2;"><td><strong>Total</strong></td><td style="text-align:right;font-weight:900;color:#dc2626;">SAR ${totalCosts.toLocaleString(undefined,{minimumFractionDigits:2})}</td><td style="text-align:right;font-weight:700;">100%</td></tr></tfoot>
            </table>

            <div class="section-title">🧾 Individual Cost Transactions</div>
            <table>
                <thead><tr><th>Date</th><th>Category</th><th style="text-align:right;">Amount</th><th>Logged By</th></tr></thead>
                <tbody>${txRows || '<tr><td colspan="4" style="text-align:center;color:#94a3b8;">No transactions in this period.</td></tr>'}</tbody>
            </table>

            <div class="footer">Burgeroov Operations Portal — Confidential &nbsp;|&nbsp; Costs Report for ${labelText}</div>
            </body></html>`;

            const blob = new Blob([printHTML], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
            document.body.appendChild(iframe);
            iframe.onload = function() { setTimeout(() => iframe.contentWindow.print(), 300); };
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
                saveData();
            } else {
                alert("Folder already exists.");
            }
        }

        function deleteWhFolder(folderName) {
            if (!confirm(`Delete folder '${folderName}'? Products inside will be moved to 'Uncategorized'.`)) return;

            getCompanyData().whCategories = getCompanyData().whCategories.filter(f => f !== folderName);

            // Move items in this folder to Uncategorized
            getCompanyData().warehouse.forEach(item => {
                if (item.category === folderName || !item.category) item.category = 'Uncategorized';
            });
            saveData();
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

            const newItem = {
                id: 'wh-' + Date.now().toString(),
                name: name,
                category: category,
                maxStock: stock,
                currentStock: stock,
                riskAmount: risk,
                logs: [{ date: formatTimestamp(), amount: stock, difference: stock, note: 'Initial Stock Setup' }]
            };

            getCompanyData().warehouse.push(newItem);
            document.getElementById('wh-name').value = ''; document.getElementById('wh-stock').value = ''; document.getElementById('wh-risk').value = '';
            saveData();
        }

        function updateWarehouseStock(itemId) {
            const inputEl = document.getElementById(`wh-update-${itemId}`);
            const newStock = parseFloat(inputEl.value);

            if (isNaN(newStock) || newStock < 0) return;

            const item = getCompanyData().warehouse.find(i => i.id === itemId);
            if (!item) return;

            const diff = newStock - item.currentStock;
            if (diff === 0) { inputEl.value = ''; return; }

            item.currentStock = newStock;
            // Max stock cap stays strictly original. It no longer auto-increases!

            item.logs.unshift({ date: formatTimestamp(), amount: newStock, difference: diff, note: diff > 0 ? 'Refill' : 'Consumption' });
            inputEl.value = ''; saveData();
        }

        function editMaxStock(itemId) {
            const item = getCompanyData().warehouse.find(i => i.id === itemId);
            if (!item) return;
            const newMax = prompt(t('desc-edit-max') || `Enter new Max / Full Stock for ${item.name}:`, item.maxStock);
            const parsed = parseFloat(newMax);
            if (!isNaN(parsed) && parsed > 0) {
                item.maxStock = parsed;
                saveData();
            }
        }

        function deleteWarehouseItem(itemId) {
            if (!confirm(t('confirm-delete-product'))) return;
            getCompanyData().warehouse = getCompanyData().warehouse.filter(i => i.id !== itemId);
            saveData();
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
            const item = getCompanyData().warehouse.find(i => i.id === itemId);
            if (item) {
                item.category = folderName;
                saveData(); // Auto-refreshes the UI instantly
            }
        }

        function checkStockAlerts() {
            const data = getCompanyData();
            const alertBox = document.getElementById('global-stock-alerts');
            if (!data.warehouse) return;

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

                    // Create Interactive Folder Card
                    const header = document.createElement('div');
                    header.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: var(--card-bg); color: var(--text-main); padding: 16px 20px; border: 1px solid var(--border-color); border-radius: 12px; cursor: pointer; margin-top: 12px; transition: var(--transition); box-shadow: var(--shadow-sm);";

                    // Hover effects
                    header.onmouseover = () => header.style.borderColor = 'var(--primary)';
                    header.onmouseout = () => header.style.borderColor = 'var(--border-color)';

                    header.innerHTML = `
                        <div style="display:flex; align-items:center; gap:12px; font-weight: 700; font-size: 1.15rem;">
                            <span style="font-size:1.8rem;" id="icon-${folderId}">${isSearchActive ? '📂' : '📁'}</span> 
                            ${folder}
                        </div>
                        <span style="font-size: 0.85rem; font-weight:600; color: var(--text-muted); background: var(--input-bg); padding: 4px 10px; border-radius: 20px;">${itemsInFolder.length} Items</span>
                    `;

                    // Content Container (Hidden by default unless searching)
                    const contentDiv = document.createElement('div');
                    contentDiv.id = folderId;
                    contentDiv.style.cssText = `display: ${isSearchActive ? 'flex' : 'none'}; flex-direction: column; gap: 12px; margin-top: 12px; margin-bottom: 24px; padding-left: 10px; border-left: 3px solid var(--primary); margin-left: 10px;`;

                    // Click to toggle folder open/closed
                    header.onclick = () => {
                        const isOpen = contentDiv.style.display === 'flex';
                        contentDiv.style.display = isOpen ? 'none' : 'flex';
                        document.getElementById(`icon-${folderId}`).textContent = isOpen ? '📁' : '📂';
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

                        let logsHtml = item.logs.map(l => `
                            <div class="flex-between" style="border-bottom: 1px solid var(--border-color); padding: 6px 0;">
                                <span>🕒 ${l.date}</span>
                                <span>Total: <strong>${l.amount}</strong> <span style="color:${l.difference > 0 ? 'var(--success)' : 'var(--danger)'}">(${l.difference > 0 ? '+' : ''}${l.difference})</span></span>
                            </div>`).join('');

                        div.innerHTML = `
                            <div class="flex-between">
                                <h3 style="margin:0; color:var(--text-main); font-size:1.15rem;">${item.name}</h3>
                                <div style="text-align:right;"><span style="font-size:1.4rem; font-weight:800; color:${isLow ? 'var(--danger)' : 'var(--primary)'}">${item.currentStock}</span> <span style="color:var(--text-muted); font-weight:600;">/ ${item.maxStock}</span></div>
                            </div>
                            ${isLow ? `<div class="text-danger" style="font-size:0.8rem; margin-top:4px; font-weight:600;">⚠️ ${t('label-currently-left')} (${item.riskAmount})</div>` : ''}
                            <div class="wh-progress"><div class="wh-fill ${isLow ? 'low' : ''}" style="width: ${pct}%"></div></div>
                            
                            <div class="flex-between" style="margin-top: 20px; flex-wrap:wrap; gap:10px;">
                                <div style="display:flex; gap:8px; flex:1; min-width: 200px;">
                                    <input type="number" id="wh-update-${item.id}" placeholder="${t('placeholder-product-name')}" style="flex:1;" min="0">
                                    <button onclick="updateWarehouseStock('${item.id}')" class="btn-success">${t('btn-log-payment') || 'Update'}</button>
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
                                    ${isWHAdmin ? `<button onclick="deleteWarehouseItem('${item.id}')" class="btn-outline-danger">✖</button>` : ''}
                                </div>
                            </div>

                            <div id="wh-logs-${item.id}" class="wh-logs" style="display:none;">${logsHtml || 'No logs yet.'}</div>`;
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
            if (el.style.display === 'none' || el.style.display === '') { el.style.display = 'block'; }
            else { el.style.display = 'none'; }
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
            const tabBtn  = document.getElementById(`tab-${tab}`);
            const isLocked = tabBtn ? tabBtn.classList.contains('tab-locked') : false;

            // Update the locked view label with the department name
            if (isLocked) {
                const label = document.getElementById('locked-dept-label');
                if (label && tabBtn) {
                    // Strip the ⛓️ emoji appended by CSS ::after (it's not in textContent)
                    label.textContent = tabBtn.textContent.trim();
                }
            }

            const allTabs = ['ops', 'ranks', 'tasks', 'warehouse', 'drivers', 'finance', 'summary', 'adverts', 'notes', 'managing', 'costs'];

            allTabs.forEach(t => {
                const btn    = document.getElementById(`tab-${t}`);
                const view   = document.getElementById(`view-${t}`);
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
                ops:       { icon: '⚙️', label: 'Operations' },
                ranks:     { icon: '🏆', label: 'Ranks' },
                tasks:     { icon: '📋', label: 'Tasks' },
                warehouse: { icon: '📦', label: 'Warehouse' },
                drivers:   { icon: '🚚', label: 'Drivers' },
                finance:   { icon: '💰', label: 'Finance' },
                summary:   { icon: '📊', label: 'Summary' },
                managing:  { icon: '💵', label: 'Sales' },
                costs:     { icon: '📉', label: 'Costs' },
                adverts:   { icon: '📢', label: 'Ads' },
                notes:     { icon: '📝', label: 'Notes' },
            };
            const meta = tabMeta[tab] || { icon: '⚙️', label: tab };
            const iconEl  = document.getElementById('mob-active-icon');
            const labelEl = document.getElementById('mob-active-label');
            if (iconEl)  iconEl.textContent  = meta.icon;
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
        window.openMobDeptMenu = function() {
            const backdrop = document.getElementById('mob-dept-backdrop');
            const sheet    = document.getElementById('mob-dept-sheet');
            if (backdrop) backdrop.classList.add('open');
            if (sheet)    sheet.classList.add('open');
            document.body.style.overflow = 'hidden';
        };

        window.closeMobDeptMenu = function() {
            const backdrop = document.getElementById('mob-dept-backdrop');
            const sheet    = document.getElementById('mob-dept-sheet');
            if (backdrop) backdrop.classList.remove('open');
            if (sheet) {
                sheet.classList.remove('open');
            }
            document.body.style.overflow = '';
        };

        // Close menu on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeMobDeptMenu();
        });


        function getMonthlyStats(worker, monthStr) {
            if (!worker.monthlyStats) worker.monthlyStats = {};
            if (!worker.monthlyStats[monthStr]) worker.monthlyStats[monthStr] = { custodyList: [], violationsList: [], rewardsList: [], costs: 0, paymentsList: [], deliveriesList: [], legacyDeliveries: 0 };
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

                const netThisMonth = base + rew - viol;
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
                const rewards = calculateRewardsTotal(stats.rewardsList);
                const violations = calculateViolationsTotal(stats.violationsList);
                const paid = calculatePaymentsTotal(stats.paymentsList);

                const netIncome = baseIncome + rewards - violations - paid;
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
            const net = base + rewards - violations - paid;
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
            saveData();
        }

        function deleteViolationRule(id) { getCompanyData().violationRules = getCompanyData().violationRules.filter(r => r.id !== id); saveData(); }

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
                compressImage(fileInput.files[0], (base64Img) => { newViolation.image = base64Img; saveViolationRecord(stats, newViolation); });
            } else { saveViolationRecord(stats, newViolation); }
        }

        function saveViolationRecord(stats, record) {
            stats.violationsList.unshift(record);
            document.getElementById('v-amount').value = ''; document.getElementById('v-reason').value = '';
            document.getElementById('v-rule-select').value = ''; document.getElementById('v-image').value = '';
            saveData();
        }

        function deleteDetailedViolation(workerId, violationId) {
            if (!confirm("Are you sure you want to remove this violation?")) return;
            const worker = getCompanyData().workers.find(w => w.id === workerId);
            const stats = getMonthlyStats(worker, currentGlobalMonth);
            stats.violationsList = stats.violationsList.filter(v => v.id !== violationId);
            saveData();
        }

        function resolveViolation(workerId, violationId, action) {
            const worker = getCompanyData().workers.find(w => w.id === workerId);
            const stats = getMonthlyStats(worker, currentGlobalMonth);
            const v = stats.violationsList.find(v => v.id === violationId);
            if (v) {
                if (action === 'waive') v.status = 'waived';
                if (action === 'apply') v.status = 'active';
                saveData();
            }
        }

        // --- RANKS SYSTEM ---
        function manuallyUpdateRank(workerId, newRank) {
            if (!newRank) return;
            if (!confirm(`Change rank to ${newRank}?`)) return;
            const worker = getCompanyData().workers.find(w => w.id === workerId);
            worker.rank = newRank;
            worker.lastEvalDate = Date.now();
            saveData();
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


        // --- TASKS (FORMERLY JOBS) SYSTEM ---
        function addTaskTemplate() {
            const input = document.getElementById('task-template-input').value.trim();
            if (!input) return alert("Enter a task template name.");
            if (!getCompanyData().jobCatalog.includes(input)) {
                getCompanyData().jobCatalog.push(input);
                document.getElementById('task-template-input').value = '';
                saveData();
            }
        }

        function deleteTaskTemplate(templateName) {
            getCompanyData().jobCatalog = getCompanyData().jobCatalog.filter(t => t !== templateName);
            saveData();
        }

        function assignTask() {
            const workerId = document.getElementById('task-worker-select').value;
            const text = document.getElementById('task-assign-input').value.trim();
            const urgency = document.getElementById('task-urgency') ? document.getElementById('task-urgency').value : 'normal';
            const deadlineMins = document.getElementById('task-deadline') ? parseInt(document.getElementById('task-deadline').value) || 0 : 0;

            if (!workerId || !text) { alert("Select an employee and describe a task."); return; }

            const worker = getCompanyData().workers.find(w => w.id === workerId);
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
            saveData();
        }

        function seeTask(workerId, taskId) {
            const worker = getCompanyData().workers.find(w => w.id === workerId);
            const t = worker.jobs.find(j => j.id === taskId);
            if (t) {
                t.status = 'seen';
                t.seenAt = Date.now();
                saveData();
            }
        }

        function completeTask(workerId, taskId) {
            const worker = getCompanyData().workers.find(w => w.id === workerId);
            const t = worker.jobs.find(j => j.id === taskId);
            if (t) {
                t.status = 'completed';
                t.done = true;
                t.completedAt = Date.now();
                saveData();
            }
        }

        function toggleTaskDone(workerId, taskId) {
            const worker = getCompanyData().workers.find(w => w.id === workerId);
            const t = worker.jobs.find(j => j.id === taskId);
            if (t) {
                t.done = !t.done;
                if (!t.done) {
                    t.status = 'seen'; // revert back to seen
                } else {
                    t.status = 'completed';
                    t.completedAt = Date.now();
                }
                saveData();
            }
        }

        function deleteTask(workerId, taskId) {
            if (!confirm("Delete this task?")) return;
            const worker = getCompanyData().workers.find(w => w.id === workerId);
            worker.jobs = worker.jobs.filter(j => j.id !== taskId);
            saveData();
        }

        function renderTasks() {
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
                assignSel.innerHTML = `<option value="">-- ${t('label-select-emp')} --</option>`;
                getCompanyData().workers.forEach(w => {
                    const opt = document.createElement('option'); opt.value = w.id; opt.textContent = w.name; assignSel.appendChild(opt);
                });
                assignSel.value = oldVal;
            }

            // Render Board (Filtered for user)
            const board = document.getElementById('tasks-board-list');
            if (!board) return;
            board.innerHTML = '';

            const isAdmin = currentUser && currentUser.role === 'admin';
            const workers = getVisibleWorkers();

            if (workers.length === 0 && !isAdmin) {
                board.innerHTML = `<p style="text-align:center; color:var(--text-muted);">${t('not-linked-worker')}</p>`;
                return;
            }

            workers.forEach(worker => {
                if (!worker.jobs || worker.jobs.length === 0) return;

                let jobsHtml = worker.jobs.map(j => {
                    const delBtn = isAdmin ? `<button onclick="deleteTask('${worker.id}', '${j.id}')" style="background:none; border:none; color: var(--danger); cursor:pointer; font-size:1.1rem; padding:0 6px;" title="Delete">✖</button>` : '';

                    const status = j.status || (j.done ? 'completed' : 'assigned');
                    const isAssignedToMe = (currentUser && worker.email && worker.email.toLowerCase() === currentUser.email.toLowerCase());

                    let statusBadge = '';
                    let actionHtml = '';
                    let urgencyBadge = j.urgency === 'urgent' ? `<span class="badge" style="background:var(--danger); margin-left:8px;">🔴 ${t('opt-urgency-high').replace('🔴 ', '')}</span>` : '';
                    let timeInfoHtml = '';

                    if (status === 'completed') {
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

                    const doneColor = status === 'completed' ? 'var(--success)' : (j.urgency === 'urgent' ? 'var(--danger)' : 'var(--primary)');
                    const doneText = status === 'completed' ? 'line-through' : 'none';

                    return `
                        <div class="mission-item" style="border-left: 4px solid ${doneColor}; display:flex; flex-direction:column; align-items:stretch;">
                            <div class="flex-between" style="margin-bottom:8px; align-items:flex-start;">
                                <div>
                                    <div style="font-size: 0.75rem; color:var(--text-muted); margin-bottom:4px;">Assigned: ${j.date}</div>
                                    <div style="display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
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
                                <div>${delBtn}</div>
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
                board.innerHTML = `<p style="text-align:center; color:var(--text-muted);">No active tasks.</p>`;
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

            const worker = getCompanyData().workers.find(w => w.id === activeDriverId);
            worker.activeOrder = {
                startTime: Date.now(),
                allocatedMs: mins * 60 * 1000,
                details: details,
                status: status,
                prepStartTime: Date.now(),
                prepTimeMs: prepMins * 60 * 1000
            };

            document.getElementById('driver-order-time').value = '';
            document.getElementById('driver-order-details').value = '';
            if (document.getElementById('driver-prep-time')) document.getElementById('driver-prep-time').value = '';
            document.getElementById('driver-order-status').value = 'ready';
            toggleDriverPrepTime();
            saveData();
        }

        function pickupDriverOrder(workerId) {
            if (!workerId) workerId = activeDriverId;
            if (!workerId) return;
            const worker = getCompanyData().workers.find(w => w.id === workerId);
            if (worker && worker.activeOrder) {
                if (worker.activeOrder.status === 'preparing') {
                    worker.activeOrder.prepEndTime = Date.now();
                }
                worker.activeOrder.status = 'picked_up';
                worker.activeOrder.startTime = Date.now(); // Restart timer exactly when picked up
                saveData();
            }
        }

        function forceOrderReady(workerId) {
            if (!confirm("Force this order to Ready status immediately?")) return;
            if (!workerId) workerId = activeDriverId;
            if (!workerId) return;
            const worker = getCompanyData().workers.find(w => w.id === workerId);
            if (worker && worker.activeOrder && worker.activeOrder.status === 'preparing') {
                worker.activeOrder.status = 'ready';
                worker.activeOrder.prepEndTime = Date.now(); // Log exactly when kitchen finished
                saveData();
            }
        }

        function finishDriverOrder(isSuccess, workerId) {
            if (!workerId) workerId = activeDriverId;
            if (!workerId) return;

            // Ask for confirmation before cancelling an order
            if (!isSuccess && !confirm("Are you sure you want to completely cancel this order?")) {
                return;
            }

            const worker = getCompanyData().workers.find(w => w.id === workerId);
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
                    prepEndTime: prepEnd || null
                });
            }
            worker.activeOrder = null;
            saveData();
        }

        function deleteDeliveryRecord(workerId, deliveryId) {
            if (!confirm(t('confirm-delete-delivery') || "Delete delivery record?")) return;
            const worker = getCompanyData().workers.find(w => w.id === workerId);
            const stats = getMonthlyStats(worker, currentGlobalMonth);
            stats.deliveriesList = stats.deliveriesList.filter(d => d.id !== deliveryId);
            saveData();
        }

        function deleteLegacyDelivery(workerId) {
            if (!confirm(t('confirm-remove-legacy') || "Remove legacy record?")) return;
            const worker = getCompanyData().workers.find(w => w.id === workerId);
            const stats = getMonthlyStats(worker, currentGlobalMonth);
            if (stats.legacyDeliveries > 0) {
                stats.legacyDeliveries--;
                saveData();
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
                    statusText = isLate ? '🚨 Late (Kitchen Prep)' : '🟡 Kitchen is Preparing...';
                    boxColor = isLate ? 'var(--danger)' : 'var(--warning)';
                } else if (order.status === 'not_ready') {
                    statusText = '🔴 Kitchen Not Ready';
                } else if (order.status === 'ready') {
                    statusText = '🟢 Ready for Pickup!';
                    boxColor = 'var(--success)';
                } else if (order.status === 'picked_up') {
                    const diff = (order.startTime + order.allocatedMs) - now;
                    isLate = diff <= 0;
                    const absDiff = Math.abs(diff);
                    const h = Math.floor(absDiff / 3600000).toString().padStart(2, '0');
                    const m = Math.floor((absDiff % 3600000) / 60000).toString().padStart(2, '0');
                    const s = Math.floor((absDiff % 60000) / 1000).toString().padStart(2, '0');
                    displayTime = isLate ? `-${h !== '00' ? h + ':' : ''}${m}:${s}` : `${h !== '00' ? h + ':' : ''}${m}:${s}`;
                    statusText = isLate ? '🚨 LATE (Delivering)' : '🛵 Delivering to Customer...';
                    boxColor = isLate ? 'var(--danger)' : 'var(--info)';
                }
                return { displayTime, statusText, boxColor, isLate };
            }

            // 1. Update Manager Panel
            if (activeDriverId) {
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
                        actionDiv.innerHTML = `<button onclick="pickupDriverOrder('${myWorker.id}')" class="btn-warning" style="padding:10px 16px; font-size:0.9rem; border-radius:8px;">📦 Receive Order</button>`;
                    } else {
                        actionDiv.innerHTML = `<button onclick="finishDriverOrder(true, '${myWorker.id}')" class="btn-success" style="padding:10px 16px; font-size:0.9rem; border-radius:8px;">✅ Delivered</button>`;
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
            if (currentUser && (currentUser.role === 'admin' || document.body.classList.contains('perm-drivers'))) {
                workers = getCompanyData().workers;
            } else {
                workers = getVisibleWorkers();
            }

            const drivers = workers.filter(w => {
                const r = (w.role || "").toLowerCase();
                return r.includes('driver') || r.includes('سائق') || r.includes('delivery');
            });

            if (drivers.length === 0) {
                list.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem;">No drivers found.</p>`;
                return;
            }

            drivers.forEach(d => {
                const div = document.createElement('div');
                const isSelected = d.id === activeDriverId;
                const isBusy = !!d.activeOrder;

                div.className = 'driver-card';
                div.style.cursor = 'pointer';
                div.style.borderColor = isSelected ? 'var(--primary)' : 'var(--border-color)';
                div.style.borderWidth = isSelected ? '2px' : '1px';

                let statusBadge = isBusy ? `<span class="badge" style="background:var(--warning);">In Transit</span>` : `<span class="badge" style="background:var(--success);">Available</span>`;

                div.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center;"><strong style="color:var(--text-main);">${d.name}</strong>${statusBadge}</div>`;
                div.onclick = () => selectDriver(d.id);
                list.appendChild(div);
            });
        }

        function renderDriverPanel() {
            const mngArea = document.getElementById('driver-management-area');
            if (!activeDriverId) { mngArea.style.display = 'none'; document.getElementById('active-driver-name').textContent = t('span-select-driver'); return; }

            mngArea.style.display = 'block';
            const worker = getCompanyData().workers.find(w => w.id === activeDriverId);
            document.getElementById('active-driver-name').textContent = `${t('label-managing') || 'Managing: '}${worker.name}`;

            const stats = getMonthlyStats(worker, currentGlobalMonth);
            const totalDels = (stats.deliveriesList ? stats.deliveriesList.length : 0) + (stats.legacyDeliveries || 0);
            document.getElementById('driver-total-orders').textContent = totalDels;

            const formArea = document.querySelector('#view-drivers .management-form-area');
            const activeArea = document.getElementById('driver-active-order');

            if (worker.activeOrder) {
                formArea.style.display = 'none';
                activeArea.style.display = 'block';
                document.getElementById('panel-order-details').textContent = worker.activeOrder.details;

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

                // 3. Cancel Button (Managers Only, ALWAYS available at any stage)
                if (isManager) {
                    html += `<button onclick="finishDriverOrder(false, '${worker.id}')" class="btn-danger" style="padding: 12px 24px;">❌ Cancel Order</button>`;
                }

                panelActions.innerHTML = html;

                updateActiveDriverTimer();
            }
            else { formArea.style.display = 'block'; activeArea.style.display = 'none'; }

            const isAdmin = currentUser && currentUser.role === 'admin';

            // Render Orders History
            const ordersList = document.getElementById('driver-orders-list');
            ordersList.innerHTML = '';
            if (stats.deliveriesList && stats.deliveriesList.length > 0) {
                stats.deliveriesList.forEach((order, index) => {
                    const actualOrderNum = totalDels - index;
                    const durationMs = order.endTime - order.startTime;
                    const diff = durationMs - order.allocatedMs;
                    const timeTaken = formatDuration(durationMs);
                    let statusHtml = '';
                    if (diff > 0) statusHtml = `<span style="color:var(--danger)">Late by ${formatDuration(diff)} ❌</span>`;
                    else statusHtml = `<span style="color:var(--success)">On time ✅</span>`;

                    let prepHtml = '';
                    if (order.prepTimeMs > 0 && order.prepStartTime && order.prepEndTime) {
                        const prepDuration = order.prepEndTime - order.prepStartTime;
                        const prepDiff = prepDuration - order.prepTimeMs;
                        const prepTimeTaken = formatDuration(prepDuration);

                        if (prepDiff > 0) {
                            prepHtml = `<div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">Kitchen Prep: <strong>${prepTimeTaken}</strong> <span style="color:var(--danger)">(Late by ${formatDuration(prepDiff)}) ❌</span></div>`;
                        } else {
                            prepHtml = `<div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">Kitchen Prep: <strong>${prepTimeTaken}</strong> <span style="color:var(--success)">(On time) ✅</span></div>`;
                        }
                    }

                    let delBtn = isAdmin ? `<button onclick="deleteDeliveryRecord('${worker.id}', '${order.id}')" class="btn-outline-danger admin-only" style="padding: 2px 6px; font-size: 0.7rem; border:none; text-decoration:underline;">Undo/Delete</button>` : '';

                    const div = document.createElement('div');
                    div.className = 'ledger-card';
                    div.innerHTML = `
                        <div class="flex-between" style="margin-bottom: 4px;">
                            <strong style="color:var(--primary);">Order #${actualOrderNum}</strong>
                            <div style="display:flex; gap:8px; align-items:center;">
                                <span style="font-size:0.75rem; color:var(--text-muted);">${order.date}</span>
                                ${delBtn}
                            </div>
                        </div>
                        <div style="font-size:0.95rem; color:var(--text-main);">Delivery Time: <strong>${timeTaken}</strong></div>
                        ${prepHtml}
                        <div style="font-size:0.85rem; margin-top:4px;">Delivery Status: ${statusHtml}</div>
                    `;
                    ordersList.appendChild(div);
                });
            } else if (stats.legacyDeliveries > 0) {
                let delLegacyBtn = isAdmin ? `<button onclick="deleteLegacyDelivery('${worker.id}')" class="btn-outline-danger admin-only" style="margin-left: 10px; padding: 2px 6px; font-size: 0.7rem; border:none; text-decoration:underline;">-1 Undo</button>` : '';
                ordersList.innerHTML = `<div class="ledger-card" style="text-align:center; color:var(--text-muted);">${stats.legacyDeliveries} legacy deliveries recorded (no timing data). ${delLegacyBtn}</div>`;
            } else {
                ordersList.innerHTML = `<div class="ledger-card" style="text-align:center; color:var(--text-muted);">No deliveries completed yet.</div>`;
            }
        }

        // --- MANAGEMENT ACTIONS ---
        function addPaymentRecord() {
            const workerId = document.getElementById('fin-worker-select').value;
            const amount = parseFloat(document.getElementById('payment-amount').value);
            if (!workerId || isNaN(amount) || amount <= 0) return;

            const worker = getCompanyData().workers.find(w => w.id === workerId);
            const stats = getMonthlyStats(worker, currentGlobalMonth);

            stats.paymentsList.unshift({ id: Date.now().toString(), date: formatTimestamp(), amount: amount });
            document.getElementById('payment-amount').value = '';
            saveData();
        }

        function deletePaymentRecord(workerId, paymentId) {
            if (!confirm("Remove this payment log?")) return;
            const worker = getCompanyData().workers.find(w => w.id === workerId);
            const stats = getMonthlyStats(worker, currentGlobalMonth);
            stats.paymentsList = stats.paymentsList.filter(p => p.id !== paymentId);
            saveData();
        }

        function addRewardRecord() {
            const workerId = document.getElementById('fin-worker-select').value;
            const amount = parseFloat(document.getElementById('reward-amount').value);
            if (!workerId || isNaN(amount) || amount <= 0) return;

            const worker = getCompanyData().workers.find(w => w.id === workerId);
            const stats = getMonthlyStats(worker, currentGlobalMonth);

            stats.rewardsList.unshift({ id: Date.now().toString(), date: formatTimestamp(), amount: amount });
            document.getElementById('reward-amount').value = '';
            saveData();
        }

        function deleteRewardRecord(workerId, rewardId) {
            if (!confirm("Remove this reward log?")) return;
            const worker = getCompanyData().workers.find(w => w.id === workerId);
            const stats = getMonthlyStats(worker, currentGlobalMonth);
            stats.rewardsList = stats.rewardsList.filter(r => r.id !== rewardId);
            saveData();
        }

        function addCustodyRecord(type) {
            const workerId = document.getElementById('fin-worker-select').value;
            const amount = parseFloat(document.getElementById('custody-amount').value);
            if (!workerId || isNaN(amount) || amount <= 0) return;

            const worker = getCompanyData().workers.find(w => w.id === workerId);
            const stats = getMonthlyStats(worker, currentGlobalMonth);

            stats.custodyList.unshift({ id: Date.now().toString(), date: formatTimestamp(), amount: amount, type: type });
            document.getElementById('custody-amount').value = '';
            saveData();
        }

        function deleteCustodyRecord(workerId, custodyId) {
            if (!confirm("Remove this custody log?")) return;
            const worker = getCompanyData().workers.find(w => w.id === workerId);
            const stats = getMonthlyStats(worker, currentGlobalMonth);
            stats.custodyList = stats.custodyList.filter(c => c.id !== custodyId);
            saveData();
        }

        function addBranch() {
            const nameInput = document.getElementById('new-branch-name'); const name = nameInput.value.trim();
            if (name && !getCompanyData().branches.includes(name)) { getCompanyData().branches.push(name); nameInput.value = ''; saveData(); }
            else { alert("Invalid or existing branch."); }
        }
        function deleteBranch(branchName) { if (confirm(`Remove branch: ${branchName}?`)) { getCompanyData().branches = getCompanyData().branches.filter(b => b !== branchName); saveData(); } }

        function addWorker() {
            const name = document.getElementById('w-name').value.trim();
            const email = document.getElementById('w-email').value.trim();
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
            getCompanyData().workers.push(newWorker);

            ['w-name', 'w-email', 'w-role', 'w-start-time', 'w-end-time', 'w-income'].forEach(id => document.getElementById(id).value = '');
            saveData();
        }

        function deleteWorker(workerId) {
            if (confirm('Permanently delete this employee?')) { getCompanyData().workers = getCompanyData().workers.filter(w => w.id !== workerId); document.getElementById('ops-worker-select').value = ""; document.getElementById('fin-worker-select').value = ""; document.getElementById('task-worker-select').value = ""; activeDriverId = null; saveData(); }
        }

        function setInitialBalance() {
            const workerId = document.getElementById('fin-worker-select').value;
            if (!workerId) { alert("Select an employee first."); return; }
            const worker = getCompanyData().workers.find(w => w.id === workerId);
            let amountText = document.getElementById('initial-balance-amount').value;
            const amount = parseFloat(amountText);
            if (isNaN(amount)) return;
            worker.initialBalance = amount;
            saveData();
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
            const worker = getCompanyData().workers.find(w => w.id === workerId);
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
            saveData();
        }

        function handleOpsWorkerChange() { renderOpsDetails(); }
        function handleFinWorkerChange() { renderFinDetails(); }

        function addDailyLog() {
            const workerId = document.getElementById('ops-worker-select').value;
            const startDateStr = document.getElementById('log-date').value;
            const noteType = document.getElementById('log-type').value;
            const note = document.getElementById('log-note').value.trim();

            if (!workerId || !startDateStr) { alert("Select an employee and date."); return; }

            const worker = getCompanyData().workers.find(w => w.id === workerId);

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
            saveData();
        }

        function deleteLog(workerId, logDate) {
            if (confirm(`Delete record for ${logDate}?`)) {
                const worker = getCompanyData().workers.find(w => w.id === workerId);
                if (worker) {
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

                    saveData();
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

            getCompanyData().adverts.push(newItem);
            document.getElementById('map-item-modal').style.display = 'none';
            pendingMapItem = null;
            setAdvertTool('pin'); // Reset back to default
            saveData(); // Triggers renderAll via Firebase sync
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
            saveData();
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

            if (currentTab === 'ops') { renderOpsWorkersTable(); renderOpsDetails(); }
            else if (currentTab === 'ranks') { renderRanksTable(); }
            else if (currentTab === 'tasks') { renderTasks(); }
            else if (currentTab === 'finance') { renderFinanceTable(); renderFinDetails(); }
            else if (currentTab === 'summary') { renderSummaryTable(); }
            else if (currentTab === 'drivers') { renderDriversList(); renderDriverPanel(); }
            else if (currentTab === 'adverts') { renderAdverts(); }
            else if (currentTab === 'notes') { renderNotes(); }
            else if (currentTab === 'managing') { renderManaging(); }
            else if (currentTab === 'costs') { renderCosts(); }
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
            const list = document.getElementById('branches-list'); const select = document.getElementById('w-branch');
            list.innerHTML = ''; select.innerHTML = '';
            getCompanyData().branches.forEach(branch => {
                const li = document.createElement('li'); li.className = 'flex-between list-item';
                li.innerHTML = `<span style="font-weight: 500; color: var(--text-main);">${branch}</span> <button class="btn-outline-danger admin-only" style="padding: 4px 10px; font-size: 0.75rem;" onclick="deleteBranch('${branch}')">Remove</button>`;
                list.appendChild(li);
                const option = document.createElement('option'); option.value = branch; option.textContent = branch; select.appendChild(option);
            });
        }

        function populateWorkerDropdowns() {
            const opsSelect = document.getElementById('ops-worker-select'); const opsVal = opsSelect.value;
            const finSelect = document.getElementById('fin-worker-select'); const finVal = finSelect.value;
            const taskSelect = document.getElementById('task-worker-select'); const taskVal = taskSelect ? taskSelect.value : '';
            const permSelect = document.getElementById('perm-worker-select'); const permVal = permSelect ? permSelect.value : '';

            if (opsSelect) opsSelect.innerHTML = '<option value="">-- Choose Employee --</option>';
            if (finSelect) finSelect.innerHTML = '<option value="">-- Choose Employee --</option>';
            if (taskSelect) taskSelect.innerHTML = '<option value="">-- Choose Employee --</option>';
            if (permSelect) permSelect.innerHTML = '<option value="">-- Choose Employee --</option>';

            getCompanyData().workers.forEach(worker => {
                if (opsSelect) opsSelect.appendChild(new Option(worker.name, worker.id));
                if (finSelect) finSelect.appendChild(new Option(worker.name, worker.id));
                if (taskSelect) taskSelect.appendChild(new Option(worker.name, worker.id));
                if (permSelect) permSelect.appendChild(new Option(worker.name, worker.id));
            });

            if (opsSelect) opsSelect.value = opsVal;
            if (finSelect) finSelect.value = finVal;
            if (taskSelect) taskSelect.value = taskVal;
            if (permSelect) permSelect.value = permVal;
        }

        // OPERATIONS TAB RENDERING
        function renderOpsWorkersTable() {
            const tbody = document.querySelector('#ops-workers-table tbody');
            if (!tbody) return;
            tbody.innerHTML = '';
            const isAdmin = currentUser && currentUser.role === 'admin';

            const workersToRender = getVisibleWorkers();

            if (workersToRender.length === 0 && !isAdmin) {
                tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Your account is not linked to any worker profile yet.</td></tr>`;
                return;
            }

            workersToRender.forEach(worker => {
                const avg = getAveragePerfection(getLogsForMonth(worker, currentGlobalMonth));

                const tr = document.createElement('tr');
                let html = `
                    <td><strong style="color:var(--text-main);">${worker.name}</strong><br><span class="badge" style="margin-left:0;margin-top:6px;">${worker.role || 'Staff'}</span></td>
                    <td><span class="badge" style="background: var(--primary); margin:0;">${avg}</span></td>`;
                if (isAdmin) {
                    html += `
                    <td class="admin-only">
                        <button class="btn-outline-danger" style="padding:6px 12px;font-size:0.8rem;" onclick="deleteWorker('${worker.id}')">Delete Worker</button>
                    </td>`;
                }
                tr.innerHTML = html;
                tbody.appendChild(tr);
            });
        }

        function renderOpsDetails() {
            const workerId = document.getElementById('ops-worker-select').value;
            const area = document.getElementById('ops-management-area'); const hist = document.getElementById('worker-logs-history');
            const isAdmin = currentUser && currentUser.role === 'admin';

            if (!workerId) { if (area) area.style.display = 'none'; return; }
            if (area) area.style.display = 'block';
            if (hist) hist.innerHTML = '';

            const worker = getCompanyData().workers.find(w => w.id === workerId);
            if (!worker) return;
            let displayLogs = getLogsForMonth(worker, currentGlobalMonth);

            if (displayLogs.length === 0) { if (hist) hist.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:24px;background:var(--input-bg);border-radius:var(--radius-md);">No logs found for this month.</p>`; return; }

            displayLogs.forEach(log => {
                const div = document.createElement('div'); div.className = 'log-entry';

                let typeBadge = '';
                if (log.noteType === 'vacation' || log.score === 'vacation') {
                    typeBadge = `<span class="badge" style="background:var(--warning); color:var(--text-main);">Vacation 🌴</span>`;
                } else if (log.noteType === 'good' || log.score == 100) {
                    typeBadge = `<span class="badge badge-good">Good Note ✅</span>`;
                } else {
                    typeBadge = `<span class="badge badge-bad">Bad Note ❌</span>`;
                }

                let delBtn = isAdmin ? `<button class="btn-outline-danger admin-only" style="padding:4px 8px;font-size:0.75rem;border:none;text-decoration:underline;" onclick="deleteLog('${worker.id}', '${log.date}')">Delete</button>` : '';
                div.innerHTML = `
                    <div class="flex-between log-date"><strong style="color:var(--text-main);">📅 ${log.date}</strong><div style="display:flex;align-items:center;gap:8px;">${typeBadge} ${delBtn}</div></div>
                    <div class="log-note-text">${log.note ? log.note : '<em style="color:var(--text-muted);">No manual notes.</em>'}</div>`;
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

                // UI display for Net reflects the subtraction of the advance payment
                const net = base + rew - viol - paidThisMonth;

                const remainingAllTime = getCumulativeBalance(worker, currentGlobalMonth);
                const detailsId = `net-details-${worker.id}`;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong style="color:var(--text-main);">${worker.name}</strong><br><span class="text-muted-heavy">${worker.branch}</span></td>
                    <td>SAR ${base.toLocaleString()}</td>
                    <td style="font-weight:600; color:var(--text-main);">
                        <div style="display:flex; align-items:center; gap:8px; cursor:pointer;" onclick="toggleDetails('${detailsId}')">
                            SAR ${net.toLocaleString()}
                            <span style="font-size:0.7rem; color:var(--primary);">▼</span>
                        </div>
                        <div class="breakdown-details" id="${detailsId}">
                            <div class="breakdown-row" style="color:var(--text-main);"><span>Base:</span> <span>SAR ${base.toLocaleString()}</span></div>
                            <div class="breakdown-row" style="color:var(--success);"><span>Rewards:</span> <span>+ SAR ${rew.toLocaleString()}</span></div>
                            <div class="breakdown-row" style="color:var(--danger);"><span>Violations:</span> <span>- SAR ${viol.toLocaleString()}</span></div>
                            <div class="breakdown-row" style="color:var(--info);"><span>Paid Advance:</span> <span>- SAR ${paidThisMonth.toLocaleString()}</span></div>
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

            // UI display for Net reflects the subtraction of the advance payment
            const net = base + totalRewards - totalViolations - paidThisMonth;

            const allTimeRemaining = getCumulativeBalance(worker, currentGlobalMonth);

            document.getElementById('fin-display-total-due').textContent = allTimeRemaining.toLocaleString();
            document.getElementById('fin-display-base').textContent = base.toLocaleString();
            document.getElementById('fin-display-net').textContent = net.toLocaleString();
            document.getElementById('fin-display-summary-custody').textContent = totalCustody.toLocaleString();
            document.getElementById('fin-display-custody').textContent = totalCustody.toLocaleString();
            document.getElementById('fin-display-total-viol').textContent = totalViolations.toLocaleString();

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
            if (!stats.rewardsList || stats.rewardsList.length === 0) {
                if (rHistList) rHistList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">No rewards recorded this month.</p>`;
            } else {
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
            if (!stats.violationsList || stats.violationsList.length === 0) {
                if (vHistList) vHistList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center;">No violations recorded this month.</p>`;
            } else {
                stats.violationsList.forEach(v => {
                    const vDiv = document.createElement('div');
                    vDiv.className = 'ledger-card';
                    vDiv.style.borderLeft = '4px solid var(--danger)';

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

        // SUMMARY TAB RENDERING
        function renderSummaryTable() {
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

                const card = document.createElement('div');
                card.className = 'summary-worker-card';
                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:20px; border-bottom:1px solid var(--border-color); padding-bottom:15px;">
                        <div>
                            <div style="font-size:1.3rem; font-weight:700; color:var(--text-main); margin-bottom:6px;">${worker.name}</div>
                            <div style="font-size:0.9rem; color:var(--text-muted); display:flex; align-items:center; gap:8px;">
                                ${worker.branch} <span class="rank-badge rank-${worker.rank}" style="margin:0;">${worker.rank}</span>
                            </div>
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
                    </div>

                    <div style="display:flex; gap:16px; flex-wrap:wrap;">
                        <div style="flex:2; min-width:300px; background:var(--input-bg); padding:16px; border-radius:8px; border:1px solid var(--border-color);">
                            <div style="font-size:0.95rem; font-weight:600; color:var(--text-main); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                                ${t('title-my-violations')}
                            </div>
                            <div style="max-height:200px; overflow-y:auto; padding-right:4px;">
                                ${violCellHtml}
                            </div>
                        </div>
                        <div style="flex:1; min-width:200px; background:var(--input-bg); padding:20px 16px; border-radius:8px; border:1px solid var(--border-color); display:flex; flex-direction:column; justify-content:center; text-align:center;">
                            <div style="font-size:0.9rem; font-weight:600; color:var(--text-main); margin-bottom:8px;">${t('label-company-costs-sm')}</div>
                            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:16px; line-height:1.4;">${t('desc-costs')}</div>
                            <div style="font-size:1.4rem; font-weight:700; color:var(--danger); background:var(--danger-bg); padding:10px; border-radius:6px; border:1px solid var(--danger-border);">SAR ${costs.toLocaleString()}</div>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        // =============================================
        // نظام الترجمة الشامل (Comprehensive Translation System)
        // =============================================
        const uiTranslations = {
            en: {
                // Auth Screen
                "auth-title-login": "Login to Dashboard",
                "auth-title-signup": "Create Viewer Account",
                "placeholder-email": "Email Address",
                "placeholder-password": "Password",
                "btn-signin": "Sign In",
                "btn-signup": "Sign Up",
                "link-signup": "Sign Up",
                "link-login": "Sign In",
                "link-forgot": "Forgot Password?",

                // Header & Settings
                "app-title": "Burgeroov Operations Portal",
                "btn-dark-mode": "🌙 Dark Mode",
                "btn-light-mode": "☀️ Light Mode",
                "btn-logout": "Logout",
                "operating-month": "📅 Operating Month",

                // Main Tabs
                "tab-ops": "⚙️ Operations",
                "tab-ranks": "🏆 Ranks",
                "tab-tasks": "📋 Tasks",
                "tab-warehouse": "📦 Warehouse",
                "tab-drivers": "🚚 Drivers",
                "tab-finance": "💰 Financial",
                "tab-summary": "📊 Summary",

                // Operations Section
                "title-manager-access": "Manager Access Control",
                "title-worker-access": "Worker Department Access",
                "title-branches": "Facility / Branches",
                "title-violation-rules": "Violation Rules System",
                "title-register-emp": "Register Employee",
                "title-ops-tracking": "Daily Operations Tracking",
                "title-ops-directory": "Ops Directory",
                "label-full-name": "Full Name",
                "label-role": "Role / Position",

                // Financial Section
                "title-fin-adj": "Financial Adjustments",
                "title-payroll-ledger": "Payroll & Finance Ledger",
                "stat-total-due": "Total Due (All-Time)",
                "box-advances": "Paid This Month (Advances)",
                "box-rewards": "Rewards & Bonuses",
                "box-violations": "Violations (Deductions)",
                "box-custody": "Custody Management",
                "box-costs": "Company Costs (Tracking)",
                "box-initial-bal": "Initial Carried Balance",
                "btn-export-pdf": "📄 Download PDF",

                // Warehouse & Drivers
                "title-inventory": "Inventory Tracking",
                "btn-restock-pdf": "📄 Restock PDF",
                "placeholder-search": "🔍 Search items...",
                "title-active-drivers": "Active Drivers",
                "title-driver-ctrl": "Driver Delivery Control",

                // Summary
                "title-summary-main": "Monthly Summary & Continuous Balance",

                // Ranks
                "title-ranks-eval": "Employee Ranking & Evaluation (90-Day View)",
                "desc-ranks-eval": "Click the arrow next to a worker's name to view their complete 3-month performance ledger. Based on their 90-Day average, you can manually promote or demote them. (Vacation days do not affect the average).",
                "th-emp-branch": "Employee & Branch",
                "th-current-rank": "Current Rank",
                "th-90day-avg": "90-Day Average",
                "th-action": "Action",

                // Tasks
                "title-task-shortcuts": "Task Shortcuts",
                "desc-task-shortcuts": "Create quick task templates.",
                "placeholder-task-shortcut": "e.g. Clean Fryers...",
                "btn-save-shortcut": "Save Shortcut",
                "title-assign-tasks": "Assign Tasks",
                "label-assign-to": "Assign To",
                "opt-choose-emp": "-- Choose Employee --",
                "label-task-detail": "Task Detail (Or pick shortcut)",
                "placeholder-desc-task": "Describe task...",
                "label-urgency-level": "Urgency Level",
                "opt-urgency-normal": "🔵 Normal Priority",
                "opt-urgency-high": "🔴 Urgent / High Priority",
                "label-time-to-complete": "Time to Complete (Minutes)",
                "placeholder-task-mins": "e.g. 30 (Optional)",
                "btn-assign-task": "Assign Task to Worker",
                "title-tasks-board": "Tasks Board",

                // Warehouse Extra
                "title-add-product": "Add New Product",
                "desc-add-product": "Register items to track their consumption.",
                "label-product-name": "Product Name",
                "placeholder-product-name": "e.g. Pepsi, Burger Patties...",
                "label-max-stock": "Max / Full Stock",
                "placeholder-stock-amt": "e.g. 40",
                "label-risk-alert": "Risk Alert (Min)",
                "placeholder-risk-amt": "e.g. 5",
                "btn-add-warehouse": "Add to Warehouse",
                "desc-inventory": "Type the exact number currently left in stock and press Update.",

                // Drivers Extra
                "desc-active-drivers": "Only employees with the role \"Driver\" or \"سائق\" appear here.",
                "span-select-driver": "Select a driver to manage",
                "title-assign-order": "Assign New Order Delivery",
                "label-time-deliver": "Time to Deliver (Minutes)",
                "placeholder-driver-mins": "e.g. 45",
                "btn-start-delivery": "🚀 Start Delivery",
                "title-current-order": "Currently Delivering Order",
                "desc-time-remaining": "Time remaining",
                "btn-order-success": "✅ Order Delivered Successfully",
                "btn-order-cancel": "❌ Cancel Order",
                "title-delivery-history": "Delivery History",
                "span-total": "Total:",

                // Finance Extra
                "label-select-emp": "Select Employee",
                "span-base": "Base:",
                "span-net-month": "Net This Month:",
                "span-custody": "Custody:",
                "desc-advances": "Log cash or transfers handed to the worker this month (deducts from current Net Payable).",
                "placeholder-amount": "Amount (SAR)",
                "btn-log-payment": "Log Payment",
                "desc-rewards": "Increases their net payable for this month.",
                "btn-add-reward": "Add Reward",
                "opt-select-rule": "-- Select Rule --",
                "placeholder-reason": "Reason / Notes",
                "label-fixing-time": "Fixing Time (Grace Period)",
                "opt-grace-0": "No Fixing Time (Apply Immediately)",
                "opt-grace-1": "1 Day to Fix",
                "opt-grace-2": "2 Days to Fix",
                "opt-grace-3": "3 Days to Fix",
                "opt-grace-7": "7 Days to Fix",
                "btn-apply-penalty": "Apply Penalty",
                "span-outstanding": "Outstanding:",
                "desc-custody": "Log equipment or cash advances given and returned.",
                "btn-give-custody": "Give Custody",
                "btn-return-custody": "Return",
                "desc-costs": "Expenses paid by company (visas, uniforms). Does NOT affect Net Payable.",
                "btn-add-cost": "Add Cost",
                "btn-undo-action": "Undo",
                "desc-initial-bal": "Set an old unpaid debt owed to this worker from before this system was used.",
                "btn-set-balance": "Set Balance",
                "btn-excel": "Excel",
                "btn-pdf": "PDF",
                "th-employee": "Employee",
                "th-base-salary": "Base Salary",
                "th-net-payable": "Net Payable (Current Month)",
                "th-paid-this-month": "Paid This Month",
                "th-total-remaining": "Total Remaining (All Time)",
                "title-export-fin": "📄 Export Financial Report",
                "desc-export-fin": "Download a PDF copy of this financial record.",

                // Summary Extra
                "title-my-violations": "⚠️ My Violations & Fix Deadlines",
                "span-current-month": "Current Month:",
                "desc-my-violations": "These are violations recorded against you by the manager this month. Violations marked <strong>⏳ Pending</strong> still have time to be fixed — fix them before the deadline to avoid the penalty.",
                "desc-summary": "This report shows operations performance strictly for the selected month. <strong class=\"text-primary\">All-Time Continuous Remaining Balance</strong> carries over dynamically based on your logged payments. Ranks update automatically every 90 days.",

                // Extra Translations
                "status-late": "🚨 LATE! Time expired.",
                "status-time-remaining": "⏳ Time remaining:",
                "btn-mark-completed": "✅ Mark as Completed",
                "btn-i-saw-this": "👁️ I Saw This Task",
                "task-must-complete": "Must complete within mins of seeing it.",
                "label-assigned": "Assigned:",
                "label-finished": "Finished:",
                "label-started": "Started:",
                "no-active-tasks": "No active tasks.",
                "not-linked-worker": "Your account is not linked to any worker profile yet.",
                "msg-task-timer-worker": "Active Task Deadline",
                "btn-remove": "Remove",
                "label-base-sm": "Base:",
                "label-rewards-sm": "Rewards:",
                "label-violations-sm": "Violations:",
                "label-paid-advance-sm": "Paid Advance:",
                "label-good-notes": "Good Notes",
                "label-bad-notes": "Bad Notes",
                "label-deliveries-sm": "Deliveries",
                "label-tasks-done": "Tasks Done",
                "label-avg-perf": "Avg Perf",
                "label-company-costs-sm": "Company Costs",
                "label-fix-violation": "Manager gave you day(s) to fix this violation.",
                "status-waived": "✅ Waived (Fixed)",
                "status-penalty-applied": "🚨 Penalty Applied",
                "status-pending-sm": "⏳ Pending",
                "btn-fixed-waive": "Fixed (Waive)",
                "btn-not-fixed-apply": "Not Fixed (Apply)",
                "label-master": "Master",
                "msg-critical-stock": "CRITICAL STOCK WARNING",
                "label-currently-left": "Currently Left",
                "label-amount-to-order": "Amount to Order",
                "label-finished-at": "Finished: ",
                "label-started-at": "Started: ",
                "btn-delete-worker": "Delete Worker",
                "label-promote-to-a": "Promote to A",
                "label-set-to-b": "Set to B",
                "label-set-to-c": "Set to C",
                "label-demote-unranked": "Demote to Unranked",
                "label-remaining-to-pay": "Remaining To Pay (All-Time)",
                "label-no-violations": "✅ No violations recorded this month.",
                "label-fixed-waived": "Fixed – Waived ✔",
                "label-penalty-applied": "Penalty Applied – SAR ",
                "label-time-expired": "Time Expired – Penalty Applied (SAR ",
                "label-fix-within": "⏳ Fix within: ",
                "label-penalty-not-fixed": "Penalty if not fixed: SAR "
            },
            ar: {
                // شاشة الدخول
                "auth-title-login": "تسجيل الدخول للوحة التحكم",
                "auth-title-signup": "إنشاء حساب مشاهد",
                "placeholder-email": "البريد الإلكتروني",
                "placeholder-password": "كلمة المرور",
                "btn-signin": "تسجيل الدخول",
                "btn-signup": "إنشاء حساب",
                "link-signup": "إنشاء حساب جديد",
                "link-login": "تسجيل الدخول",
                "link-forgot": "نسيت كلمة المرور؟",

                // الرأس والإعدادات
                "app-title": "بوابة عمليات برجروف",
                "btn-dark-mode": "🌙 الوضع الليلي",
                "btn-light-mode": "☀️ الوضع النهاري",
                "btn-logout": "خروج",
                "operating-month": "📅 شهر التشغيل",

                // التبويبات الرئيسية
                "tab-ops": "⚙️ العمليات",
                "tab-ranks": "🏆 التقييمات",
                "tab-tasks": "📋 المهام",
                "tab-warehouse": "📦 المستودع",
                "tab-drivers": "🚚 السائقين",
                "tab-finance": "💰 المالية",
                "tab-summary": "📊 الملخص",

                // قسم العمليات
                "title-manager-access": "التحكم في وصول المديرين",
                "title-worker-access": "صلاحيات الوصول للأقسام",
                "title-branches": "الفروع والمرافق",
                "title-violation-rules": "نظام قواعد المخالفات",
                "title-register-emp": "تسجيل موظف جديد",
                "title-ops-tracking": "تتبع العمليات اليومية",
                "title-ops-directory": "دليل الموظفين",
                "label-full-name": "الاسم الكامل",
                "label-role": "الوظيفة / المسمى الوظيفي",

                // القسم المالي
                "title-fin-adj": "التسويات المالية",
                "title-payroll-ledger": "دفتر الرواتب والمالية",
                "stat-total-due": "إجمالي المستحق (كلي)",
                "box-advances": "سلف مدفوعة هذا الشهر",
                "box-rewards": "المكافآت والحوافز",
                "box-violations": "الجزاءات والمخالفات",
                "box-custody": "إدارة العهدة",
                "box-costs": "تكاليف الشركة (تتبع)",
                "box-initial-bal": "الرصيد المرحل الأولي",
                "btn-export-pdf": "📄 تحميل تقرير PDF",

                "title-inventory": "تتبع المخزون",
                "btn-restock-pdf": "📄 طلب بضاعة PDF",
                "placeholder-search": "🔍 ابحث عن صنف...",
                "title-active-drivers": "السائقون النشطون",
                "title-driver-ctrl": "التحكم في توصيلات السائق",
                "title-summary-main": "الملخص الشهري والرصيد المستمر",
                "title-ranks-eval": "تقييم وترتيب الموظفين (عرض 90 يوم)",
                "desc-ranks-eval": "انقر على السهم بجوار اسم الموظف لعرض سجل أدائه الكامل لمدة 3 أشهر.",
                "th-emp-branch": "الموظف والفرع",
                "th-current-rank": "الرتبة الحالية",
                "th-90day-avg": "متوسط 90 يوم",
                "th-action": "إجراء",
                "title-task-shortcuts": "اختصارات المهام",
                "desc-task-shortcuts": "قم بإنشاء قوالب مهام سريعة.",
                "placeholder-task-shortcut": "مثال: تنظيف المقالي...",
                "btn-save-shortcut": "حفظ الاختصار",
                "title-assign-tasks": "تعيين المهام",
                "opt-urgency-high": "🔴 عاجل / أولوية عالية",
                "label-time-to-complete": "وقت الإنجاز (بالدقائق)",
                "placeholder-task-mins": "مثال: 30 (اختياري)",
                "btn-assign-task": "تعيين المهمة للموظف",
                "title-tasks-board": "لوحة المهام",
                "title-add-product": "إضافة منتج جديد",
                "desc-add-product": "سجل الأصناف لتتبع استهلاكها.",
                "label-product-name": "اسم المنتج",
                "placeholder-product-name": "مثال: بيبسي، برجر، لحم...",
                "label-max-stock": "الحد الأقصى للمخزون",
                "placeholder-stock-amt": "مثال: 40",
                "label-risk-alert": "تنبيه الخطر (الحد الأدنى)",
                "placeholder-risk-amt": "مثال: 5",
                "btn-add-warehouse": "إضافة للمستودع",
                "desc-inventory": "اكتب العدد الدقيق المتبقي حالياً في المخزون واضغط تحديث.",
                "desc-active-drivers": "يظهر هنا فقط الموظفون الذين لديهم المسمى \"سائق\".",
                "span-select-driver": "اختر سائق لإدارته",
                "title-assign-order": "تعيين طلب توصيل جديد",
                "label-time-deliver": "وقت التوصيل (بالدقائق)",
                "placeholder-driver-mins": "مثال: 45",
                "btn-start-delivery": "🚀 بدء التوصيل",
                "title-current-order": "الطلب الحالي قيد التوصيل",
                "desc-time-remaining": "الوقت المتبقي",
                "btn-order-success": "✅ تم توصيل الطلب بنجاح",
                "btn-order-cancel": "❌ إلغاء الطلب",
                "title-delivery-history": "سجل التوصيلات",
                "span-total": "الإجمالي:",
                "label-select-emp": "اختر الموظف",
                "span-base": "الأساسي:",
                "span-net-month": "الصافي هذا الشهر:",
                "span-custody": "العهدة:",
                "desc-advances": "سجل المبالغ النقدية أو الحوالات المدفوعة للموظف هذا الشهر.",
                "placeholder-amount": "المبلغ (ريال)",
                "btn-log-payment": "تسجيل الدفعة",
                "desc-rewards": "تزيد من صافي الراتب المستحق لهذا الشهر.",
                "btn-add-reward": "إضافة مكافأة",
                "opt-select-rule": "-- اختر المخالفة --",
                "placeholder-reason": "السبب / ملاحظات",
                "label-fixing-time": "وقت الإصلاح (فترة السماح)",
                "opt-grace-0": "لا يوجد وقت للإصلاح",
                "opt-grace-1": "1 يوم للإصلاح",
                "opt-grace-2": "يومان للإصلاح",
                "opt-grace-3": "3 أيام للإصلاح",
                "opt-grace-7": "7 أيام للإصلاح",
                "btn-apply-penalty": "تطبيق الخصم",
                "span-outstanding": "العهدة المتبقية:",
                "desc-custody": "سجل المعدات أو السلف النقدية المعطاة والمستردة.",
                "btn-give-custody": "إعطاء عهدة",
                "btn-return-custody": "استرجاع",
                "desc-costs": "نفقات الشركة.",
                "btn-add-cost": "إضافة تكلفة",
                "btn-undo-action": "تراجع",
                "desc-initial-bal": "ضع أي ديون قديمة مستحقة للموظف.",
                "btn-set-balance": "تعيين الرصيد",
                "btn-excel": "إكسيل",
                "btn-pdf": "PDF",
                "th-employee": "الموظف",
                "th-base-salary": "الراتب الأساسي",
                "th-net-payable": "صافي المستحق (هذا الشهر)",
                "th-paid-this-month": "المدفوع هذا الشهر",
                "th-total-remaining": "إجمالي المتبقي (كلي)",
                "title-export-fin": "📄 تصدير التقرير المالي",
                "desc-export-fin": "تنزيل نسخة PDF من هذا السجل المالي.",
                "title-my-violations": "⚠️ مخالفاتي والمواعيد النهائية للإصلاح",
                "span-current-month": "الشهر الحالي:",
                "desc-my-violations": "هذه هي المخالفات المسجلة عليك.",
                "desc-summary": "يعرض هذا التقرير أداء العمليات للشهر المحدد فقط.",
                "status-late": "🚨 متأخر! انتهى الوقت.",
                "status-time-remaining": "⏳ الوقت المتبقي:",
                "btn-mark-completed": "✅ تم الإنجاز",
                "btn-i-saw-this": "👁️ قرأت المهمة",
                "task-must-complete": "يجب الإنجاز خلال دقائق من رؤيتها",
                "label-assigned": "تم التكليف:",
                "label-finished": "انتهى:",
                "label-started": "بدأ:",
                "no-active-tasks": "لا توجد مهام نشطة.",
                "not-linked-worker": "هذا الحساب غير مرتبط بأي موظف حالياً.",
                "msg-task-timer-worker": "الموعد النهائي للمهمة النشطة",
                "btn-remove": "حذف",
                "btn-undo-action": "تراجع",
                "label-base-sm": "الأساسي:",
                "label-rewards-sm": "المكافآت:",
                "label-violations-sm": "المخالفات:",
                "label-paid-advance-sm": "سلف مدفوعة:",
                "label-good-notes": "ملاحظات إيجابية",
                "label-bad-notes": "ملاحظات سلبية",
                "label-deliveries-sm": "التوصيلات",
                "label-tasks-done": "مهام منجزة",
                "label-avg-perf": "متوسط الأداء",
                "label-company-costs-sm": "تكاليف الشركة",
                "label-fix-violation": "منحك المدير أياماً لإصلاح هذه المخالفة.",
                "status-waived": "✅ تم الإعفاء (تم الإصلاح)",
                "status-penalty-applied": "🚨 تم تطبيق الخصم",
                "status-pending-sm": "⏳ قيد الانتظار",
                "btn-fixed-waive": "تم الإصلاح (إعفاء)",
                "btn-not-fixed-apply": "لم يتم الإصلاح (خصم)",
                "label-master": "المسؤول الأول",
                "msg-critical-stock": "تحذير: نقص حاد في المخزون",
                "label-currently-left": "المتبقي حالياً",
                "label-amount-to-order": "الكمية المطلوبة",
                "label-finished-at": "انتهى: ",
                "label-started-at": "بدأ: ",
                "btn-delete-worker": "حذف الموظف",
                "label-promote-to-a": "ترقية إلى A",
                "label-set-to-b": "تعيين B",
                "label-set-to-c": "تعيين C",
                "label-demote-unranked": "تنزيل إلى غير مصنف",
                "label-remaining-to-pay": "المتبقي للدفع (كلي)",
                "label-no-violations": "✅ لا توجد مخالفات مسجلة هذا الشهر.",
                "label-fixed-waived": "تم الإصلاح – إعفاء ✔",
                "label-penalty-applied": "تم تطبيق الخصم – ريال ",
                "label-time-expired": "انتهى الوقت – تم الخصم (ريال ",
                "label-fix-within": "⏳ الإصلاح خلال: ",
                "label-penalty-not-fixed": "الخصم في حال عدم الإصلاح: ريال "
            }
        };

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

            const langDict = uiTranslations[currentAppLang] || uiTranslations["en"] || {};

            document.querySelectorAll("[data-i18n]").forEach(el => {
                const key = el.getAttribute("data-i18n");
                const translation = langDict[key];

                if (translation) {
                    if (el.tagName === "INPUT" && el.hasAttribute("placeholder")) {
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

        // --- MOBILE USER DROPDOWN TRIGGER ---
        window.toggleUserDropdown = function(event) {
            if (event) event.stopPropagation();
            const dropdown = document.getElementById('user-dropdown-menu');
            if (dropdown) {
                dropdown.classList.toggle('show-dropdown');
            }
        };

        document.addEventListener('click', function(e) {
            const container = document.querySelector('.user-menu-container');
            const dropdown = document.getElementById('user-dropdown-menu');
            if (container && dropdown && !container.contains(e.target)) {
                dropdown.classList.remove('show-dropdown');
            }
        });

        // Initial run
        applyTranslations();
