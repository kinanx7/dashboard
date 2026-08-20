/**
 * Market product grid, shopping cart, checkout, coin transactions & admin product editor
 */

let currentMarketCategoryFilter = 'all';
let currentMarketPage = 1;
let marketPageSize = 12;
let marketWishlist = new Set();
try {
    const savedWishlist = localStorage.getItem('mvc_market_wishlist');
    if (savedWishlist) marketWishlist = new Set(JSON.parse(savedWishlist));
} catch (e) {
    marketWishlist = new Set();
}

const MARKET_CATEGORY_DEFS = {
    'all': {
        key: 'all',
        labelEn: '🌟 All Products',
        labelAr: '🌟 جميع المنتجات',
        icon: '🌟',
        gradient: 'linear-gradient(135deg, #10b981, #059669)'
    },
    'hidden': {
        key: 'hidden',
        labelEn: '🙈 Hidden Products',
        labelAr: '🙈 المنتجات المخفية',
        icon: '🙈',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)'
    },
    'meat': {
        key: 'meat',
        labelEn: '🥩 Meat Products',
        labelAr: '🥩 قسم اللحوم الفاخرة',
        icon: '🥩',
        gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%)'
    },
    'veg_fruit': {
        key: 'veg_fruit',
        labelEn: '🥦 Vegetables & Fruits',
        labelAr: '🥦 قسم الخضار والفواكه',
        icon: '🥦',
        gradient: 'linear-gradient(135deg, #065f46 0%, #10b981 50%, #34d399 100%)'
    },
    'fish': {
        key: 'fish',
        labelEn: '🐟 Fish & Seafood',
        labelAr: '🐟 قسم الأسماك والبحريات',
        icon: '🐟',
        gradient: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 50%, #38bdf8 100%)'
    }
};

function getNormalizedProductCategory(p) {
    if (!p) return 'meat';
    let cat = (p.category || '').toString().trim().toLowerCase();
    if (cat && cat !== 'undefined' && cat !== 'null') {
        if (cat === 'veg' || cat === 'fruits' || cat === 'fruit' || cat === 'vegetables' || cat === 'veg_fruits' || cat === 'veg_fruit') return 'veg_fruit';
        if (cat === 'meats' || cat === 'meat') return 'meat';
        if (cat === 'fishes' || cat === 'seafood' || cat === 'fish') return 'fish';
        return cat;
    }
    const name = (p.name || '').toLowerCase();
    if (name.includes('سمك') || name.includes('جمبري') || name.includes('روبيان') || name.includes('فيليه') || name.includes('هامور') || name.includes('سالمون') || name.includes('سي باس') || name.includes('fish') || name.includes('shrimp') || name.includes('salmon') || name.includes('seafood')) {
        return 'fish';
    }
    if (name.includes('خضار') || name.includes('فواكه') || name.includes('طماطم') || name.includes('خيار') || name.includes('تفاح') || name.includes('موز') || name.includes('ليمون') || name.includes('جزر') || name.includes('بطاطس') || name.includes('بصل') || name.includes('veg') || name.includes('fruit') || name.includes('apple') || name.includes('banana')) {
        return 'veg_fruit';
    }
    return 'meat';
}
window.getNormalizedProductCategory = getNormalizedProductCategory;

function getMarketCategoryMeta(catKey) {
    if (MARKET_CATEGORY_DEFS[catKey]) {
        return MARKET_CATEGORY_DEFS[catKey];
    }
    const cleanTitle = catKey.charAt(0).toUpperCase() + catKey.slice(1).replace(/_/g, ' ');
    return {
        key: catKey,
        labelEn: `📦 ${cleanTitle}`,
        labelAr: `📦 قسم ${cleanTitle}`,
        icon: '📦',
        gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)'
    };
}
window.getMarketCategoryMeta = getMarketCategoryMeta;

function handleMarketCategorySelectChange(selectEl, mode) {
    if (!selectEl) return;
    const customInputId = mode === 'edit' ? 'market-product-custom-category-edit' : 'market-product-custom-category-add';
    const customInput = document.getElementById(customInputId);
    if (!customInput) return;
    if (selectEl.value === 'custom') {
        customInput.style.display = 'block';
        customInput.focus();
    } else {
        customInput.style.display = 'none';
        customInput.value = '';
    }
}
window.handleMarketCategorySelectChange = handleMarketCategorySelectChange;

function renderMarketCategoryTabs(allProducts) {
    const container = document.getElementById('market-category-tabs-container');
    if (!container) return;

    const isAr = currentAppLang === 'ar';
    const isAdmin = typeof isMarketAdmin === 'function' ? isMarketAdmin() : false;
    const categoriesFound = new Set(['all', 'meat', 'veg_fruit', 'fish']);

    if (isAdmin) {
        categoriesFound.add('hidden');
    }

    (allProducts || []).forEach(p => {
        const cat = getNormalizedProductCategory(p);
        if (cat) categoriesFound.add(cat);
    });

    const categoryList = Array.from(categoriesFound);

    container.innerHTML = categoryList.map(catKey => {
        const meta = getMarketCategoryMeta(catKey);
        const isActive = (currentMarketCategoryFilter === catKey);

        let count = 0;
        if (catKey === 'all') {
            count = (allProducts || []).length;
        } else if (catKey === 'hidden') {
            count = (allProducts || []).filter(p => isProductHidden(p)).length;
        } else {
            count = (allProducts || []).filter(p => getNormalizedProductCategory(p) === catKey).length;
        }

        const rawLabel = isAr ? meta.labelAr : meta.labelEn;
        const cleanLabel = rawLabel.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u, '');

        const activeCardStyle = isActive
            ? `background: ${meta.gradient}; color: #ffffff; border: 2px solid rgba(255,255,255,0.85); box-shadow: 0 6px 18px rgba(0,0,0,0.25); transform: translateY(-2px);`
            : `background: var(--card-bg, #1a1d24); color: var(--text-main); border: 1px solid var(--border-color); box-shadow: 0 2px 8px rgba(0,0,0,0.12);`;

        return `
            <div onclick="setMarketCategoryFilter('${catKey}')" class="category-section-card ${isActive ? 'active' : ''}" style="flex: 0 0 auto; min-width: 120px; padding: 8px 12px; border-radius: 14px; cursor: pointer; transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; gap: 8px; position: relative; overflow: hidden; user-select: none; ${activeCardStyle}">
                <div style="font-size: 1.5rem; line-height: 1; flex-shrink: 0; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));">${meta.icon}</div>
                <div style="display: flex; flex-direction: column; gap: 1px; min-width: 0;">
                    <span style="font-size: 0.8rem; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;">${cleanLabel}</span>
                    <span style="font-size: 0.7rem; opacity: ${isActive ? '0.95' : '0.75'}; font-weight: 700;">${count} ${isAr ? 'منتج' : 'products'}</span>
                </div>
            </div>
        `;
    }).join('');
}
window.renderMarketCategoryTabs = renderMarketCategoryTabs;

function sanitizeMarketText(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
window.sanitizeMarketText = sanitizeMarketText;

function setMarketCategoryFilter(cat) {
    currentMarketCategoryFilter = cat;
    window.currentMarketRenderLimit = 24;
    currentMarketPage = 1;
    renderMarket();
}
window.setMarketCategoryFilter = setMarketCategoryFilter;
window.filterMarketCategory = setMarketCategoryFilter;

function changeMarketPage(page) {
    currentMarketPage = page;
    renderMarket();
}
window.changeMarketPage = changeMarketPage;

function toggleMarketWishlist(productId) {
    if (marketWishlist.has(productId)) {
        marketWishlist.delete(productId);
    } else {
        marketWishlist.add(productId);
    }
    try {
        localStorage.setItem('mvc_market_wishlist', JSON.stringify(Array.from(marketWishlist)));
    } catch (e) { }
    renderMarket();
}
window.toggleMarketWishlist = toggleMarketWishlist;

function getMarketCartKey() {
    if (typeof currentCustomerSession !== 'undefined' && currentCustomerSession && (currentCustomerSession.code || currentCustomerSession.id)) {
        return 'mvc_market_cart_cust_' + (currentCustomerSession.code || currentCustomerSession.id);
    }
    if (typeof currentUser !== 'undefined' && currentUser && (currentUser.uid || currentUser.email)) {
        const cleanEmail = String(currentUser.email || currentUser.uid).replace(/[^a-zA-Z0-9_-]/g, '_');
        return 'mvc_market_cart_user_' + cleanEmail;
    }
    const workerId = typeof getCurrentWorkerId === 'function' ? getCurrentWorkerId() : null;
    if (workerId) return 'mvc_market_cart_worker_' + workerId;
    return 'mvc_market_cart_guest';
}
window.getMarketCartKey = getMarketCartKey;

function loadMarketCart() {
    try {
        const key = getMarketCartKey();
        const saved = localStorage.getItem(key);
        if (saved) {
            marketCart = JSON.parse(saved);
        } else {
            marketCart = [];
        }
    } catch (e) {
        marketCart = [];
    }
    return marketCart;
}
window.loadMarketCart = loadMarketCart;

function saveMarketCart() {
    try {
        const key = getMarketCartKey();
        localStorage.setItem(key, JSON.stringify(marketCart));
    } catch (e) { }
    updateMarketCartBadges();
}
window.saveMarketCart = saveMarketCart;

function isCartItemAvailable(item) {
    if (!item || !item.productId) return false;
    const allProds = getAllMarketProducts();
    const prod = allProds.find(p => p && p.id === item.productId);
    if (!prod) return false;
    if (typeof isProductHidden === 'function' && isProductHidden(prod)) return false;
    return true;
}
window.isCartItemAvailable = isCartItemAvailable;

function updateMarketCartBadges() {
    loadMarketCart();
    const totalQty = marketCart.reduce((sum, item) => sum + (item.qty || 0), 0);
    const unavailableCount = marketCart.filter(item => !isCartItemAvailable(item)).length;
    const cartCountEl = document.getElementById('market-cart-count');
    if (cartCountEl) {
        cartCountEl.textContent = totalQty;
        if (unavailableCount > 0) {
            cartCountEl.style.background = '#ef4444';
            cartCountEl.title = currentAppLang === 'ar' ? `${unavailableCount} منتج غير متوفر بالسلة` : `${unavailableCount} unavailable items`;
        } else {
            cartCountEl.style.background = '';
            cartCountEl.title = '';
        }
    }
}
window.updateMarketCartBadges = updateMarketCartBadges;

function getCurrentWorkerId() {
    if (typeof currentWorkerProfile !== 'undefined' && currentWorkerProfile && currentWorkerProfile.id) return currentWorkerProfile.id;
    if (typeof currentUser !== 'undefined' && currentUser && (currentUser.uid || currentUser.id)) return currentUser.uid || currentUser.id;
    if (window.currentUser && (window.currentUser.uid || window.currentUser.id)) return window.currentUser.uid || window.currentUser.id;
    return 'admin_user';
}

function getUserCoins() {
    if (typeof currentCustomerSession !== 'undefined' && currentCustomerSession && typeof currentCustomerSession.coins !== 'undefined') {
        return parseFloat(currentCustomerSession.coins) || 0;
    }
    const workerId = getCurrentWorkerId();
    const data = getCompanyData();
    if (data.workers && data.workers[workerId] && typeof data.workers[workerId].coins !== 'undefined') {
        return parseFloat(data.workers[workerId].coins) || 0;
    }
    if (data.userCoins && typeof data.userCoins[workerId] !== 'undefined') {
        return parseFloat(data.userCoins[workerId]) || 0;
    }
    const localCoins = localStorage.getItem('mvc_admin_coins_' + workerId) || localStorage.getItem('mvc_admin_coins');
    if (localCoins !== null && !isNaN(parseFloat(localCoins))) {
        return parseFloat(localCoins);
    }
    return 1000; // Default balance for Admin testing
}

function refillMonthlyCoinsForAllCustomers() {
    const isAr = currentAppLang === 'ar';
    const amountInput = document.getElementById('admin-monthly-coins-input');
    const amount = parseFloat(amountInput?.value || 500);

    if (isNaN(amount) || amount <= 0) {
        alert(isAr ? 'الرجاء إدخال كمية من العملات صحيحة.' : 'Please enter a valid coin amount.');
        return;
    }

    if (!confirm(isAr
        ? `هل تريد إعادة تعبئة ${amount.toLocaleString()} من العملات لجميع العملاء المسجلين؟`
        : `Refill ${amount.toLocaleString()} coins for all registered customers?`)) {
        return;
    }

    // Collect all customer codes from local appData & Firebase
    const customerMap = {};

    ['mvc', 'mvcfresh', 'burgeroov'].forEach(cKey => {
        if (appData[cKey] && appData[cKey].customers) {
            Object.entries(appData[cKey].customers).forEach(([code, cust]) => {
                if (code && cust) customerMap[code] = cust;
            });
        }
    });

    if (window.globalCustomerCodes) {
        Object.entries(window.globalCustomerCodes).forEach(([code, cust]) => {
            if (code && cust) customerMap[code] = cust;
        });
    }

    const performRefill = (valMap) => {
        const codes = Object.keys(valMap);
        if (codes.length === 0) {
            alert(isAr ? 'لا يوجد عملاء مسجلون حالياً لتعبئة أرصدتهم.' : 'No registered customers found to refill.');
            return;
        }

        const updates = {};
        codes.forEach(code => {
            const cust = valMap[code] || {};
            const currentCoins = parseFloat((cust && cust.coins) || 0);
            const newCoins = currentCoins + amount;
            if (cust) cust.coins = newCoins;

            updates[`publicCustomerCodes/${code}/coins`] = newCoins;
            updates[`customerCodes/${code}/coins`] = newCoins;
            updates[`customers/${code}/coins`] = newCoins;
            ['mvc', 'mvcfresh', 'burgeroov'].forEach(c => {
                updates[`companies/${c}/customers/${code}/coins`] = newCoins;
            });
        });

        db.ref().update(updates).then(() => {
            alert(isAr ? `تمت إعادة تعبئة ${amount.toLocaleString()} ر.س بنجاح لجميع العملاء! 💵` : `Refilled ${amount.toLocaleString()} SR for all customers successfully! 💵`);
            renderMarket();
            renderAdminCustomersList();
        }).catch(err => {
            console.error("Error refilling customer SR:", err);
            alert(isAr ? 'حدث خطأ أثناء تعبئة الرصيد.' : 'Error refilling SR balance.');
        });
    };

    if (Object.keys(customerMap).length === 0 && typeof db !== 'undefined') {
        db.ref('publicCustomerCodes').once('value').then(snap => {
            const val = snap.exists() ? snap.val() : {};
            performRefill(val);
        }).catch(() => performRefill(customerMap));
    } else {
        performRefill(customerMap);
    }
}
window.refillMonthlyCoinsForAllCustomers = refillMonthlyCoinsForAllCustomers;
window.refillMonthlyCoinsForAllWorkers = refillMonthlyCoinsForAllCustomers;

function addTestCoins(amount = 500) {
    const isAr = currentAppLang === 'ar';
    const currentCoins = getUserCoins();
    const newCoins = currentCoins + amount;
    const updates = {};

    if (typeof currentCustomerSession !== 'undefined' && currentCustomerSession && currentCustomerSession.code) {
        const custCode = currentCustomerSession.code;
        updates[`publicCustomerCodes/${custCode}/coins`] = newCoins;
        updates[`customerCodes/${custCode}/coins`] = newCoins;
        updates[`customers/${custCode}/coins`] = newCoins;
        ['mvc', 'mvcfresh', 'burgeroov'].forEach(c => {
            updates[`companies/${c}/customers/${custCode}/coins`] = newCoins;
        });
        currentCustomerSession.coins = newCoins;
        try {
            localStorage.setItem('mvc_customer_session', JSON.stringify(currentCustomerSession));
        } catch (e) { }
    } else {
        const workerId = getCurrentWorkerId();
        const data = getCompanyData();
        if (data.workers && data.workers[workerId]) {
            data.workers[workerId].coins = newCoins;
        }
        if (!data.userCoins) data.userCoins = {};
        data.userCoins[workerId] = newCoins;

        try {
            localStorage.setItem('mvc_admin_coins_' + workerId, newCoins);
            localStorage.setItem('mvc_admin_coins', newCoins);
        } catch (e) { }

        updates[`companies/${currentCompany}/workers/${workerId}/coins`] = newCoins;
        updates[`companies/${currentCompany}/userCoins/${workerId}`] = newCoins;
    }

    renderMarket();

    if (typeof db !== 'undefined') {
        db.ref().update(updates).then(() => {
            renderMarket();
        }).catch(err => {
            console.error("Error adding test coins:", err);
            renderMarket();
        });
    }
}
window.addTestCoins = addTestCoins;

function updateWorkerCoinsIndividual() {
    const isAr = currentAppLang === 'ar';
    const workerSelect = document.getElementById('admin-coin-worker-select');
    const adjustInput = document.getElementById('admin-coin-adjust-input');

    const workerId = workerSelect?.value;
    const amount = parseFloat(adjustInput?.value);

    if (!workerId) {
        alert(isAr ? 'الرجاء اختيار موظف.' : 'Please select a worker.');
        return;
    }
    if (isNaN(amount) || amount < 0) {
        alert(isAr ? 'الرجاء إدخال رصيد صحيح.' : 'Please enter a valid balance.');
        return;
    }

    db.ref(`companies/${currentCompany}/workers/${workerId}/coins`).set(amount).then(() => {
        alert(isAr ? 'تم تحديث رصيد ر.س بنجاح! 💵' : 'Worker SR balance updated successfully! 💵');
        if (adjustInput) adjustInput.value = '';
        renderMarket();
    }).catch(err => {
        console.error("Error updating worker coins:", err);
        alert(isAr ? 'حدث خطأ أثناء تحديث الرصيد.' : 'Error updating worker coins.');
    });
}
window.updateWorkerCoinsIndividual = updateWorkerCoinsIndividual;

function handleMarketImageUpload(event, mode) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const maxDim = 400;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxDim) {
                    height *= maxDim / width;
                    width = maxDim;
                }
            } else {
                if (height > maxDim) {
                    width *= maxDim / height;
                    height = maxDim;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

            if (mode === 'add') {
                document.getElementById('market-product-image-input').value = compressedBase64;
                const previewContainer = document.getElementById('market-img-preview-add');
                const previewImg = document.getElementById('market-img-preview-add-src');
                if (previewImg) previewImg.src = compressedBase64;
                if (previewContainer) previewContainer.style.display = 'block';
            } else if (mode === 'edit') {
                document.getElementById('edit-market-product-image').value = compressedBase64;
                const previewContainer = document.getElementById('market-img-preview-edit');
                const previewImg = document.getElementById('market-img-preview-edit-src');
                if (previewImg) previewImg.src = compressedBase64;
                if (previewContainer) previewContainer.style.display = 'block';
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}
window.handleMarketImageUpload = handleMarketImageUpload;

window.globalMarketProductsCache = {};
try {
    const savedMarketCache = localStorage.getItem('mvc_cached_market_products');
    if (savedMarketCache) {
        window.globalMarketProductsCache = JSON.parse(savedMarketCache) || {};
    }
} catch (e) { }

window.hasInitializedGlobalMarketListener = false;

function initGlobalMarketProductsListener() {
    if (typeof db === 'undefined' || window.hasInitializedGlobalMarketListener) return;
    window.hasInitializedGlobalMarketListener = true;

    if (!window.globalMarketProductsCache) window.globalMarketProductsCache = {};
    if (!window._marketPathSnapshots) window._marketPathSnapshots = {};

    const paths = [
        'marketProducts',
        'companies/mvc/marketProducts',
        'companies/mvcfresh/marketProducts',
        'companies/burgeroov/marketProducts'
    ];

    paths.forEach(path => {
        db.ref(path).on('value', snapshot => {
            const currentKeysInSnap = new Set();
            const val = snapshot.exists() ? snapshot.val() : null;

            if (val && typeof val === 'object') {
                Object.entries(val).forEach(([key, p]) => {
                    if (p && typeof p === 'object') {
                        const pId = p.id || key;
                        p.id = pId;
                        currentKeysInSnap.add(pId);
                        window.globalMarketProductsCache[pId] = p;
                    }
                });
            }

            window._marketPathSnapshots[path] = currentKeysInSnap;

            let cKey = null;
            if (path.includes('companies/mvc/')) cKey = 'mvc';
            else if (path.includes('companies/mvcfresh/')) cKey = 'mvcfresh';
            else if (path.includes('companies/burgeroov/')) cKey = 'burgeroov';

            if (cKey && typeof appData !== 'undefined' && appData[cKey]) {
                if (val && typeof val === 'object') {
                    appData[cKey].marketProducts = val;
                } else {
                    appData[cKey].marketProducts = {};
                }
            }

            // Union of all active product keys across all monitored paths
            const allActiveKeys = new Set();
            Object.values(window._marketPathSnapshots).forEach(keySet => {
                keySet.forEach(k => allActiveKeys.add(k));
            });

            // Purge deleted products from globalMarketProductsCache & appData across all companies
            Object.keys(window.globalMarketProductsCache).forEach(pId => {
                if (!allActiveKeys.has(pId)) {
                    delete window.globalMarketProductsCache[pId];
                    if (typeof appData !== 'undefined') {
                        ['mvc', 'mvcfresh', 'burgeroov'].forEach(c => {
                            if (appData[c] && appData[c].marketProducts) {
                                delete appData[c].marketProducts[pId];
                            }
                        });
                    }
                }
            });

            try {
                localStorage.setItem('mvc_cached_market_products', JSON.stringify(window.globalMarketProductsCache));
            } catch (e) { }

            if (typeof renderMarket === 'function') {
                if (window._isTogglingVisibility) return;
                renderMarket();
            }
        });
    });
}
window.initGlobalMarketProductsListener = initGlobalMarketProductsListener;

function isProductHidden(p) {
    if (!p) return false;
    return (p.isHidden === true || p.isHidden === 'true' || p.hidden === true || p.hidden === 'true');
}
window.isProductHidden = isProductHidden;

function getAllMarketProducts() {
    initGlobalMarketProductsListener();

    const map = {};

    const mergeProduct = (p) => {
        if (!p || typeof p !== 'object') return;
        const pId = p.id || p.key || p._id;
        if (!pId) return;
        p.id = pId;

        const h = isProductHidden(p);

        if (!map[pId]) {
            map[pId] = { ...p, id: pId, isHidden: h, hidden: h };
        } else {
            const existingTs = map[pId].updatedAt || 0;
            const newTs = p.updatedAt || 0;

            if (newTs >= existingTs) {
                map[pId] = { ...map[pId], ...p, id: pId, isHidden: h, hidden: h };
            } else {
                map[pId].id = pId;
            }
        }
    };

    if (window.globalMarketProductsCache) {
        Object.values(window.globalMarketProductsCache).forEach(mergeProduct);
    }

    const data = getCompanyData();
    const rawProds = data.marketProducts || {};
    if (rawProds && typeof rawProds === 'object') {
        Object.entries(rawProds).forEach(([key, p]) => {
            if (p && typeof p === 'object') {
                mergeProduct({ ...p, id: p.id || key });
            }
        });
    }

    if (typeof appData !== 'undefined') {
        const companyKeys = ['mvc', 'mvcfresh', 'burgeroov', ...Object.keys(appData)];
        companyKeys.forEach(cKey => {
            if (appData[cKey] && appData[cKey].marketProducts) {
                const cMap = appData[cKey].marketProducts;
                if (cMap && typeof cMap === 'object') {
                    Object.entries(cMap).forEach(([key, p]) => {
                        if (p && typeof p === 'object') {
                            mergeProduct({ ...p, id: p.id || key });
                        }
                    });
                }
            }
        });
    }

    // Force one-time deep Firebase fetch across explicit market paths if map is empty
    if (Object.keys(map).length === 0 && typeof db !== 'undefined' && !window.hasDeepFetchedMarketProducts) {
        window.hasDeepFetchedMarketProducts = true;
        const marketPaths = [
            'marketProducts',
            'companies/mvc/marketProducts',
            'companies/mvcfresh/marketProducts',
            'companies/burgeroov/marketProducts'
        ];
        const fetchPromises = marketPaths.map(p =>
            db.ref(p).once('value')
                .then(snap => snap.exists() ? snap.val() : null)
                .catch(() => null)
        );
        Promise.all(fetchPromises).then(results => {
            let foundAny = false;
            results.forEach(res => {
                if (res) {
                    const list = Array.isArray(res) ? res : Object.values(res);
                    list.forEach(p => {
                        if (p && p.id) {
                            mergeProduct(p);
                            window.globalMarketProductsCache[p.id] = map[p.id];
                            foundAny = true;
                        }
                    });
                }
            });
            if (foundAny) {
                try {
                    localStorage.setItem('mvc_cached_market_products', JSON.stringify(window.globalMarketProductsCache));
                } catch (e) { }
                if (typeof renderMarket === 'function') renderMarket();
            }
        }).catch(err => console.error("Error deep fetching market products:", err));
    }

    return Object.values(map);
}
window.getAllMarketProducts = getAllMarketProducts;

function triggerPlusOneEffect(clickX, clickY) {
    // 1. Create floating +1 badge over the clicked button coordinates
    const badge = document.createElement('div');
    badge.className = 'cart-plus-one-badge';
    badge.innerHTML = '+1 🛒';

    if (clickX && clickY && clickX > 0 && clickY > 0) {
        badge.style.left = `${clickX - 24}px`;
        badge.style.top = `${clickY - 12}px`;
    } else {
        const cartBtn = document.getElementById('market-cart-btn');
        if (cartBtn) {
            const r = cartBtn.getBoundingClientRect();
            badge.style.left = `${r.left + (r.width / 2) - 24}px`;
            badge.style.top = `${r.top + r.height}px`;
        } else {
            badge.style.left = '50%';
            badge.style.top = '50%';
        }
    }

    document.body.appendChild(badge);
    setTimeout(() => badge.remove(), 850);

    // 2. Trigger bounce pop on top right Cart button
    const cartBtn = document.getElementById('market-cart-btn');
    if (cartBtn) {
        cartBtn.classList.remove('cart-btn-pop');
        void cartBtn.offsetWidth; // Force reflow
        cartBtn.classList.add('cart-btn-pop');
        setTimeout(() => cartBtn.classList.remove('cart-btn-pop'), 450);
    }
}
window.triggerPlusOneEffect = triggerPlusOneEffect;

function addToMarketCart(productId, evt) {
    // CAPTURE CLICK COORDINATES BEFORE DOM RE-RENDER DESTROYS ELEMENT
    let clickX = null;
    let clickY = null;

    if (evt) {
        if (typeof evt.clientX === 'number' && typeof evt.clientY === 'number' && (evt.clientX > 0 || evt.clientY > 0)) {
            clickX = evt.clientX;
            clickY = evt.clientY;
        } else {
            const el = evt.currentTarget || evt.target;
            if (el && typeof el.getBoundingClientRect === 'function') {
                const r = el.getBoundingClientRect();
                if (r.width > 0 && r.height > 0) {
                    clickX = r.left + (r.width / 2);
                    clickY = r.top;
                }
            }
        }
    }

    if ((!clickX || clickX <= 0) && productId) {
        const btn = document.querySelector(`button[onclick*="${productId}"]`);
        if (btn) {
            const r = btn.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) {
                clickX = r.left + (r.width / 2);
                clickY = r.top;
            }
        }
    }

    const prods = getAllMarketProducts();
    const prod = prods.find(p => p.id === productId);

    if (!prod) return;

    const isCustomer = !!(typeof currentCustomerSession !== 'undefined' && currentCustomerSession);
    const isAdmin = isMarketAdmin();
    if (isProductHidden(prod) && !isAdmin) {
        const isAr = currentAppLang === 'ar';
        alert(isAr ? 'عذراً، هذا المنتج غير متوفر حالياً (تم إخفاؤه من قبل الأدمن).' : 'Sorry, this product is currently unavailable (hidden by admin).');
        return;
    }

    loadMarketCart();

    const existingIndex = marketCart.findIndex(item => item.productId === productId);
    if (existingIndex > -1) {
        marketCart[existingIndex].qty += 1;
    } else {
        marketCart.push({
            productId: prod.id,
            name: prod.name,
            price: prod.price,
            imageUrl: prod.imageUrl || '',
            weightTag: prod.weightTag || '',
            qty: 1
        });
    }

    saveMarketCart();
    updateMarketCartBadges();

    // Fast local button badge update without destructive full grid re-render
    const btn = (evt && (evt.currentTarget || evt.target)) ? (evt.currentTarget || evt.target).closest('button') : document.querySelector(`button[onclick*="${productId}"]`);
    if (btn) {
        const cartItem = marketCart.find(item => item.productId === productId);
        const qty = cartItem ? cartItem.qty : 0;
        let badgeEl = btn.querySelector('.cart-btn-qty-badge');
        if (qty > 0) {
            if (!badgeEl) {
                badgeEl = document.createElement('span');
                badgeEl.className = 'cart-btn-qty-badge';
                badgeEl.style.cssText = "background: #ffffff; color: #2563eb; font-size: 0.75rem; font-weight: 900; padding: 2px 8px; border-radius: 100px; line-height: 1; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;";
                btn.appendChild(badgeEl);
            }
            badgeEl.textContent = qty;
        } else if (badgeEl) {
            badgeEl.remove();
        }
    }

    triggerPlusOneEffect(clickX, clickY);
}
window.addToMarketCart = addToMarketCart;

function openMarketCartModal() {
    renderMarketCartItems();
    const modal = document.getElementById('market-cart-modal');
    if (modal) modal.style.display = 'flex';
}
window.openMarketCartModal = openMarketCartModal;

function closeMarketCartModal() {
    const modal = document.getElementById('market-cart-modal');
    if (modal) modal.style.display = 'none';
}
window.closeMarketCartModal = closeMarketCartModal;

function updateCartItemQty(productId, delta) {
    loadMarketCart();
    const index = marketCart.findIndex(item => item.productId === productId);
    if (index === -1) return;

    marketCart[index].qty += delta;
    if (marketCart[index].qty <= 0) {
        marketCart.splice(index, 1);
    }
    saveMarketCart();
    updateMarketCartBadges();
    renderMarketCartItems();

    const btn = document.querySelector(`button[onclick*="${productId}"]`);
    if (btn) {
        const cartItem = marketCart.find(item => item.productId === productId);
        const qty = cartItem ? cartItem.qty : 0;
        let badgeEl = btn.querySelector('.cart-btn-qty-badge');
        if (qty > 0) {
            if (!badgeEl) {
                badgeEl = document.createElement('span');
                badgeEl.className = 'cart-btn-qty-badge';
                badgeEl.style.cssText = "background: #ffffff; color: #2563eb; font-size: 0.75rem; font-weight: 900; padding: 2px 8px; border-radius: 100px; line-height: 1; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;";
                btn.appendChild(badgeEl);
            }
            badgeEl.textContent = qty;
        } else if (badgeEl) {
            badgeEl.remove();
        }
    }
}
window.updateCartItemQty = updateCartItemQty;

function removeCartItem(productId) {
    loadMarketCart();
    marketCart = marketCart.filter(item => item.productId !== productId);
    saveMarketCart();
    updateMarketCartBadges();
    renderMarketCartItems();

    const btn = document.querySelector(`button[onclick*="${productId}"]`);
    if (btn) {
        const badgeEl = btn.querySelector('.cart-btn-qty-badge');
        if (badgeEl) badgeEl.remove();
    }
}
window.removeCartItem = removeCartItem;

function renderMarketCartItems() {
    loadMarketCart();
    const listContainer = document.getElementById('market-cart-items-list');
    const userBalanceEl = document.getElementById('market-cart-user-balance');
    const totalCostEl = document.getElementById('market-cart-total-cost');
    const warningEl = document.getElementById('market-cart-balance-warning');
    const submitBtn = document.getElementById('market-cart-submit-btn');
    const isAr = currentAppLang === 'ar';

    const userCoins = getUserCoins();
    if (userBalanceEl) userBalanceEl.textContent = `${userCoins.toLocaleString()} ${isAr ? 'ر.س' : 'SR'} 💵`;

    if (!listContainer) return;

    if (marketCart.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 10px; color: var(--text-muted);">
                <div style="font-size: 3rem; margin-bottom: 8px;">🛒</div>
                <h4 style="margin: 0 0 4px 0; font-size: 1.1rem; color: var(--text-main); font-weight: 800;">${isAr ? 'سلة التسوق فارغة' : 'Your Cart is Empty'}</h4>
                <p style="margin: 0; font-size: 0.85rem;">${isAr ? 'تصفح منتجات السوق وأضف المنتجات لسلتك!' : 'Browse market products and add items to your cart!'}</p>
            </div>
        `;
        if (totalCostEl) totalCostEl.textContent = `0 ${isAr ? 'ر.س' : 'SR'} 💵`;
        if (warningEl) warningEl.style.display = 'none';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            submitBtn.style.cursor = 'not-allowed';
        }
        return;
    }

    let totalCost = 0;
    let hasUnavailableItems = false;

    const itemsHTML = marketCart.map(item => {
        const available = isCartItemAvailable(item);
        if (!available) {
            hasUnavailableItems = true;
        }

        const itemTotal = (item.price || 0) * (item.qty || 1);
        if (available) {
            totalCost += itemTotal;
        }

        const imgTag = item.imageUrl
            ? `<img src="${item.imageUrl}" style="width: 54px; height: 54px; border-radius: 10px; object-fit: cover; ${!available ? 'filter: grayscale(80%) opacity(0.5);' : ''}" />`
            : `<div style="width: 54px; height: 54px; border-radius: 10px; background: var(--input-bg); display: flex; align-items: center; justify-content: center; font-size: 1.6rem; ${!available ? 'opacity: 0.5;' : ''}">🥩</div>`;

        const rowBg = !available
            ? 'background: rgba(239, 68, 68, 0.08); border-radius: 12px; margin-bottom: 8px; padding: 10px 12px; border: 1px dashed rgba(239, 68, 68, 0.4);'
            : 'padding: 12px 0; border-bottom: 1px dashed var(--border-color);';

        return `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; ${rowBg}">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                    ${imgTag}
                    <div>
                        <div style="font-weight: 800; font-size: 0.95rem; color: ${!available ? '#ef4444' : 'var(--text-main)'};">
                            ${sanitizeMarketText(item.name)}
                        </div>
                        ${!available ? `
                            <div style="display: inline-flex; align-items: center; gap: 4px; background: #ef4444; color: #ffffff; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 900; margin-top: 4px;">
                                ⚠️ ${isAr ? 'غير متوفر حالياً (تم إخفاؤه من الأدمن)' : 'Not Available (Hidden by Admin)'}
                            </div>
                        ` : `
                            <div style="font-size: 0.8rem; color: #ef4444; font-weight: 700; margin-top: 2px;">
                                ${item.price} ${isAr ? 'ر.س' : 'SR'} 💵 ${isAr ? 'للقطعة' : 'each'}
                            </div>
                        `}
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 12px;">
                    <!-- Qty Controls -->
                    <div style="display: flex; align-items: center; background: var(--input-bg); border-radius: 100px; border: 1px solid var(--border-color); padding: 3px 8px; gap: 8px; ${!available ? 'opacity: 0.3; pointer-events: none;' : ''}">
                        <button type="button" onclick="updateCartItemQty('${item.productId}', -1)" style="border: none; background: transparent; color: var(--text-main); font-weight: 800; cursor: pointer; font-size: 1rem;">-</button>
                        <span style="font-weight: 900; font-size: 0.9rem; min-width: 18px; text-align: center;">${item.qty}</span>
                        <button type="button" onclick="updateCartItemQty('${item.productId}', 1)" style="border: none; background: transparent; color: var(--text-main); font-weight: 800; cursor: pointer; font-size: 1rem;">+</button>
                    </div>

                    <!-- Item Total Price -->
                    <div style="font-weight: 900; font-size: 1rem; color: #ef4444; min-width: 65px; text-align: right; ${!available ? 'text-decoration: line-through; opacity: 0.5;' : ''}">
                        ${itemTotal} ${isAr ? 'ر.س' : 'SR'} 💵
                    </div>

                    <!-- Remove Button (Always enabled so customer can remove hidden items) -->
                    <button type="button" onclick="removeCartItem('${item.productId}')" title="${isAr ? 'إزالة المنتج' : 'Remove'}" style="border: none; background: #ef4444; color: #ffffff; width: 32px; height: 32px; border-radius: 8px; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);">🗑️</button>
                </div>
            </div>
        `;
    }).join('');

    let noticeBanner = '';
    if (hasUnavailableItems) {
        noticeBanner = `
            <div style="background: rgba(239, 68, 68, 0.12); border: 1.5px solid #ef4444; border-radius: 12px; padding: 12px 14px; margin-bottom: 14px; color: #ef4444; font-weight: 800; font-size: 0.86rem; display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.12);">
                <span style="font-size: 1.4rem;">⚠️</span>
                <div style="line-height: 1.4;">
                    ${isAr ? 'تنبيه هام: توجد منتجات غير متوفرة بالسلة (قام الأدمن بإخفائها من المتجر). يجب عليك حذفها من السلة (🗑️) لإتمام عملية الشراء.' : 'Important Notice: Cart contains items hidden by Admin. You must remove them (🗑️) to complete checkout.'}
                </div>
            </div>
        `;
    }

    listContainer.innerHTML = noticeBanner + itemsHTML;

    if (totalCostEl) totalCostEl.textContent = `${totalCost.toLocaleString()} ${isAr ? 'ر.س' : 'SR'} 💵`;

    const isInsufficient = userCoins < totalCost;
    if (warningEl) {
        if (hasUnavailableItems) {
            warningEl.style.display = 'block';
            warningEl.style.color = '#ef4444';
            warningEl.textContent = isAr
                ? `❌ لا يمكنك إتمام الطلب بحضور منتجات غير متوفرة بالسلة. يرجى حذفها أولاً.`
                : `❌ Cannot checkout with unavailable items. Please remove them first.`;
        } else {
            warningEl.style.display = isInsufficient ? 'block' : 'none';
            if (isInsufficient) {
                warningEl.textContent = isAr
                    ? `⚠️ رصيد ر.س لديك غير كافٍ! تحتاج إلى ${totalCost - userCoins} ر.س إضافية.`
                    : `⚠️ Insufficient SR Balance! You need ${totalCost - userCoins} more SR.`;
            }
        }
    }

    if (submitBtn) {
        const canSubmit = !hasUnavailableItems && !isInsufficient;
        submitBtn.disabled = !canSubmit;
        submitBtn.style.opacity = canSubmit ? '1' : '0.5';
        submitBtn.style.cursor = canSubmit ? 'pointer' : 'not-allowed';
    }
}

function submitMarketOrder() {
    loadMarketCart();
    const isAr = currentAppLang === 'ar';
    if (marketCart.length === 0) return;

    const unavailable = marketCart.filter(item => !isCartItemAvailable(item));
    if (unavailable.length > 0) {
        alert(isAr
            ? 'عذراً، تحتوي السلة على منتجات غير متوفرة حالياً (قام الأدمن بإخفائها). يرجى إزالتها من السلة أولاً لإكتمال الطلب!'
            : 'Sorry, your cart contains unavailable products (hidden by admin). Please remove them first to complete your order!');
        openMarketCartModal();
        return;
    }

    const userCoins = getUserCoins();
    const totalCost = marketCart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    if (userCoins < totalCost) {
        alert(isAr ? 'رصيد العملات لديك غير كافٍ لإتمام هذا الطلب!' : 'Insufficient coins to complete this order!');
        return;
    }

    const isCustomer = !!(typeof currentCustomerSession !== 'undefined' && currentCustomerSession);
    const workerId = isCustomer ? String(currentCustomerSession.code || currentCustomerSession.id).trim() : getCurrentWorkerId();
    const workerName = isCustomer
        ? (currentCustomerSession.name || 'Customer (' + currentCustomerSession.code + ')')
        : ((typeof currentWorkerProfile !== 'undefined' && currentWorkerProfile)
            ? (currentWorkerProfile.name || currentWorkerProfile.email)
            : ((typeof currentUser !== 'undefined' && currentUser && currentUser.email) ? currentUser.email : 'Worker'));

    const now = Date.now();
    const randDigits = Math.floor(100000 + Math.random() * 900000);
    const orderNum = `#${randDigits}`;
    const orderId = 'ord_' + now;

    const custCode = isCustomer ? String(currentCustomerSession.code || currentCustomerSession.id).trim() : '';

    const orderObj = {
        id: orderId,
        orderNum: orderNum,
        companyKey: currentCompany,
        isCustomer: isCustomer,
        customerCode: custCode,
        workerId: workerId,
        workerName: workerName,
        items: [...marketCart],
        totalCost: totalCost,
        status: 'pending',
        createdAt: now
    };

    // Deduct coins & save order
    const newCoins = userCoins - totalCost;
    const updates = {};
    if (isCustomer) {
        const custCode = String(currentCustomerSession.code).trim();
        currentCustomerSession.coins = newCoins;
        updates[`publicCustomerCodes/${custCode}/coins`] = newCoins;
        updates[`customerCodes/${custCode}/coins`] = newCoins;
        updates[`customers/${custCode}/coins`] = newCoins;
        ['mvc', 'mvcfresh', 'burgeroov'].forEach(c => {
            updates[`companies/${c}/customers/${custCode}/coins`] = newCoins;
        });
        try {
            localStorage.setItem('mvc_customer_session', JSON.stringify(currentCustomerSession));
        } catch (e) { }
    } else {
        const data = getCompanyData();
        if (data && data.workers && data.workers[workerId]) {
            data.workers[workerId].coins = newCoins;
        }
        if (data) {
            if (!data.userCoins) data.userCoins = {};
            data.userCoins[workerId] = newCoins;
        }
        try {
            localStorage.setItem('mvc_admin_coins_' + workerId, newCoins);
            localStorage.setItem('mvc_admin_coins', newCoins);
        } catch (e) { }

        updates[`companies/${currentCompany}/workers/${workerId}/coins`] = newCoins;
        updates[`companies/${currentCompany}/userCoins/${workerId}`] = newCoins;
    }
    updates[`companies/${currentCompany}/marketOrders/${orderId}`] = orderObj;

    db.ref().update(updates).then(() => {
        const purchasedOrder = { ...orderObj };
        marketCart = [];
        saveMarketCart();
        closeMarketCartModal();
        renderMarket();
        openMarketOrderReceiptModal(purchasedOrder);

        // Dispatch instant alert to notify-server for assigned preparing workers
        try {
            const serverUrl = document.getElementById('wa-server-url')?.value?.trim() || 'https://burgeroov-notify.onrender.com';
            fetch(`${serverUrl}/notify/prepare`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId: currentCompany, order: purchasedOrder })
            }).then(r => r.json()).then(res => {
                console.log("Prepare order notification response:", res);
            }).catch(err => console.warn("Prepare order notify HTTP dispatch error:", err));
        } catch(e) {}
    }).catch(err => {
        console.error("Error submitting order:", err);
        alert(isAr ? 'حدث خطأ أثناء إرسال الطلب.' : 'Error submitting order.');
    });
}
window.submitMarketOrder = submitMarketOrder;

function formatMarketOrderNum(order) {
    if (!order) return '#000000';
    const raw = order.orderNum || order.id || '';
    const str = String(raw).trim();
    if (!str) return '#000000';

    if (/^#?\d{3,6}$/.test(str)) {
        return str.startsWith('#') ? str : `#${str}`;
    }

    if (str.includes('-')) {
        const parts = str.split('-').map(p => p.replace(/\D/g, '')).filter(Boolean);
        const joined = parts.join('');
        if (joined.length >= 6) {
            return `#${joined.slice(-6)}`;
        }
    }

    const digits = str.replace(/\D/g, '');
    if (digits.length >= 6) {
        return `#${digits.slice(-6)}`;
    } else if (digits.length >= 3) {
        return `#${digits}`;
    }

    return `#${str.replace(/^#?ORD-?/i, '').replace('ord_', '').slice(-6)}`;
}
window.formatMarketOrderNum = formatMarketOrderNum;

function getMarketOrderStatusInfo(status) {
    switch (status) {
        case 'preparing':
            return { labelEn: '👨‍🍳 Preparing Order', labelAr: '👨‍🍳 قيد التحضير', bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
        case 'delivery':
            return { labelEn: '🚚 Out for Delivery', labelAr: '🚚 خرج للتوصيل', bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' };
        case 'delivered':
            return { labelEn: '✅ Delivered', labelAr: '✅ تم التوصيل', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
        case 'cancelled':
        case 'canceled':
            return { labelEn: '❌ Cancelled', labelAr: '❌ ملغى', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
        case 'pending':
        default:
            return { labelEn: '⏳ Pending', labelAr: '⏳ قيد الانتظار', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' };
    }
}
window.getMarketOrderStatusInfo = getMarketOrderStatusInfo;

function openMarketOrderReceiptModal(order) {
    if (!order) return;
    const isAr = currentAppLang === 'ar';

    const modal = document.getElementById('market-order-receipt-modal');
    const orderNumEl = document.getElementById('receipt-order-num');
    const custNameEl = document.getElementById('receipt-customer-name');
    const dateEl = document.getElementById('receipt-order-date');
    const statusBadgeEl = document.getElementById('receipt-order-status-badge');
    const companyTagEl = document.getElementById('receipt-company-tag');
    const itemsListEl = document.getElementById('receipt-items-list');
    const totalCostEl = document.getElementById('receipt-total-cost');

    if (orderNumEl) orderNumEl.textContent = formatMarketOrderNum(order);
    if (custNameEl) custNameEl.textContent = order.workerName || 'Customer';
    if (dateEl) dateEl.textContent = order.createdAt ? new Date(order.createdAt).toLocaleString() : new Date().toLocaleString();
    if (companyTagEl) companyTagEl.textContent = (order.companyKey || currentCompany || 'MVC').toUpperCase();
    if (totalCostEl) totalCostEl.textContent = `${(order.totalCost || 0).toLocaleString()} ${isAr ? 'ر.س' : 'SR'} 💵`;

    if (statusBadgeEl) {
        const statusInfo = getMarketOrderStatusInfo(order.status);
        statusBadgeEl.textContent = isAr ? statusInfo.labelAr : statusInfo.labelEn;
        statusBadgeEl.style.background = statusInfo.bg;
        statusBadgeEl.style.color = statusInfo.color;
    }

    if (itemsListEl) {
        const items = order.items || [];
        itemsListEl.innerHTML = items.map((item, idx) => `
            <tr style="background-color: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'} !important; border-bottom: 1px solid #cbd5e1 !important;">
                <td style="padding: 12px 10px; text-align: center; font-weight: 800; color: #475569 !important; background-color: inherit !important;">${idx + 1}</td>
                <td style="padding: 12px 10px; font-weight: 900; color: #000000 !important; font-size: 1rem !important; background-color: inherit !important;">${sanitizeMarketText(item.name)}</td>
                <td style="padding: 12px 10px; text-align: center; font-weight: 900; color: #0f172a !important; background-color: inherit !important; font-size: 0.95rem !important;">${item.qty || 1}</td>
                <td style="padding: 12px 10px; text-align: right; font-weight: 800; color: #334155 !important; background-color: inherit !important; font-size: 0.95rem !important;">${(item.price || 0).toLocaleString()}</td>
                <td style="padding: 12px 10px; text-align: right; font-weight: 900; color: #059669 !important; background-color: inherit !important; font-size: 1rem !important;">${((item.price || 0) * (item.qty || 1)).toLocaleString()} ${isAr ? 'ر.س' : 'SR'} 💵</td>
            </tr>
        `).join('');
    }

    if (modal) modal.style.display = 'flex';
}
window.openMarketOrderReceiptModal = openMarketOrderReceiptModal;

function closeMarketOrderReceiptModal() {
    const modal = document.getElementById('market-order-receipt-modal');
    if (modal) modal.style.display = 'none';
}
window.closeMarketOrderReceiptModal = closeMarketOrderReceiptModal;

function openCustomerOrdersModal() {
    renderCustomerOrders();
    const modal = document.getElementById('customer-orders-modal');
    if (modal) modal.style.display = 'flex';
}
window.openCustomerOrdersModal = openCustomerOrdersModal;

function closeCustomerOrdersModal() {
    const modal = document.getElementById('customer-orders-modal');
    if (modal) modal.style.display = 'none';
}
window.closeCustomerOrdersModal = closeCustomerOrdersModal;

function findMarketOrderById(orderId) {
    if (!orderId) return { order: null, companyKey: currentCompany };
    const companies = ['mvc', 'mvcfresh', 'burgeroov'];
    for (const cKey of companies) {
        if (appData[cKey] && appData[cKey].marketOrders && appData[cKey].marketOrders[orderId]) {
            return { order: appData[cKey].marketOrders[orderId], companyKey: cKey };
        }
    }
    const currentData = getCompanyData();
    if (currentData.marketOrders && currentData.marketOrders[orderId]) {
        return { order: currentData.marketOrders[orderId], companyKey: currentCompany };
    }
    return { order: null, companyKey: currentCompany };
}
window.findMarketOrderById = findMarketOrderById;

function getAllMarketOrders() {
    const companies = ['mvc', 'mvcfresh', 'burgeroov'];
    const map = new Map();
    companies.forEach(cKey => {
        const companyOrders = (appData[cKey] && appData[cKey].marketOrders) ? appData[cKey].marketOrders : {};
        Object.values(companyOrders).forEach(o => {
            if (o && o.id) {
                if (!map.has(o.id)) {
                    map.set(o.id, { ...o, companyKey: o.companyKey || cKey });
                }
            }
        });
    });
    const curData = getCompanyData();
    if (curData && curData.marketOrders) {
        Object.values(curData.marketOrders).forEach(o => {
            if (o && o.id && !map.has(o.id)) {
                map.set(o.id, { ...o, companyKey: o.companyKey || currentCompany });
            }
        });
    }
    const list = Array.from(map.values());
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return list;
}
window.getAllMarketOrders = getAllMarketOrders;

function renderCustomerOrders() {
    const container = document.getElementById('customer-orders-list');
    if (!container) return;
    const isAr = currentAppLang === 'ar';

    const isCustomer = !!(typeof currentCustomerSession !== 'undefined' && currentCustomerSession);
    const myId = isCustomer ? String(currentCustomerSession.code || currentCustomerSession.id).trim() : getCurrentWorkerId();

    const allOrders = getAllMarketOrders();

    // Filter to current customer/worker orders across all companies
    let ordersList = allOrders.filter(o => {
        if (!o) return false;
        const code = String(o.customerCode || o.workerId || '').trim();
        const wId = String(o.workerId || '').trim();
        return code === myId || wId === myId;
    });

    if (ordersList.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 10px; color: var(--text-muted);">
                <div style="font-size: 3rem; margin-bottom: 8px;">📦</div>
                <h4 style="margin: 0 0 4px 0; font-size: 1.1rem; color: var(--text-main); font-weight: 800;">${isAr ? 'لا توجد طلبات سابقة' : 'No Previous Orders'}</h4>
                <p style="margin: 0; font-size: 0.85rem;">${isAr ? 'ستظهر جميع طلباتك وحالتها فور طلبها من السوق.' : 'All your orders and live delivery statuses will appear here.'}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = ordersList.map(order => {
        const orderNum = formatMarketOrderNum(order);
        const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString() : '';
        const statusInfo = getMarketOrderStatusInfo(order.status);
        const itemsSummary = (order.items || []).map(i => `${sanitizeMarketText(i.name)} (x${i.qty})`).join(', ');

        const orderJsonStr = JSON.stringify(order).replace(/'/g, "&#39;").replace(/"/g, "&quot;");

        return `
            <div class="card" style="margin: 0; padding: 16px; border-radius: 14px; border: 1px solid var(--border-color); background: var(--card-bg); display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <div>
                        <span style="font-weight: 900; font-size: 1.05rem; color: #10b981; font-family: monospace, system-ui, sans-serif;">${orderNum}</span>
                        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">${dateStr}</div>
                    </div>
                    <span class="badge" style="background: ${statusInfo.bg}; color: ${statusInfo.color}; font-weight: 900; font-size: 0.82rem; padding: 5px 12px; border-radius: 100px;">
                        ${isAr ? statusInfo.labelAr : statusInfo.labelEn}
                    </span>
                </div>

                <div style="font-size: 0.85rem; color: var(--text-main); background: var(--input-bg); padding: 8px 12px; border-radius: 8px;">
                    🛒 <b>${isAr ? 'المنتجات:' : 'Items:'}</b> ${itemsSummary}
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                    <div style="font-weight: 900; font-size: 1rem; color: #ef4444;">
                        ${(order.totalCost || 0).toLocaleString()} ${isAr ? 'ر.س' : 'SR'} 💵
                    </div>
                    <button type="button" onclick='openMarketOrderReceiptModal(${orderJsonStr})' class="btn-outline" style="padding: 5px 12px; font-weight: 800; font-size: 0.8rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        🧾 ${isAr ? 'عرض الفاتورة' : 'View Receipt'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}
window.renderCustomerOrders = renderCustomerOrders;

function openAdminMarketOrdersModal() {
    renderAdminMarketOrders();
    const modal = document.getElementById('admin-market-orders-modal');
    if (modal) modal.style.display = 'flex';
}
window.openAdminMarketOrdersModal = openAdminMarketOrdersModal;

function closeAdminMarketOrdersModal() {
    const modal = document.getElementById('admin-market-orders-modal');
    if (modal) modal.style.display = 'none';
}
window.closeAdminMarketOrdersModal = closeAdminMarketOrdersModal;

function renderAdminMarketOrders() {
    const listEl = document.getElementById('admin-market-orders-list');
    const modalListEl = document.getElementById('admin-market-orders-modal-list');
    if (!listEl && !modalListEl) return;

    const isAr = currentAppLang === 'ar';
    const filterStatusModal = document.getElementById('admin-modal-orders-status-filter')?.value;
    const filterStatusCard = document.getElementById('admin-orders-status-filter')?.value;
    const filterStatus = filterStatusModal || filterStatusCard || 'all';

    let allOrders = getAllMarketOrders();

    // Calculate Stats for HUD Banner
    const totalOrdersCount = allOrders.length;
    const pendingCount = allOrders.filter(o => o && o.status === 'pending').length;
    const preparingCount = allOrders.filter(o => o && o.status === 'preparing').length;
    const deliveryCount = allOrders.filter(o => o && o.status === 'delivery').length;
    const deliveredCount = allOrders.filter(o => o && o.status === 'delivered').length;
    const cancelledCount = allOrders.filter(o => o && o.status === 'cancelled').length;
    const totalRevenueCoins = allOrders.reduce((sum, o) => sum + (o && o.status !== 'cancelled' ? (parseFloat(o.totalCost) || 0) : 0), 0);

    const statsHudEl = document.getElementById('admin-orders-stats-hud');
    if (statsHudEl) {
        statsHudEl.innerHTML = `
            <div style="padding: 14px 20px; background: var(--card-bg); border-bottom: 1px solid var(--border-color); display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; text-align: center;">
                <div style="background: var(--input-bg); padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border-color);">
                    <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">📦 ${isAr ? 'إجمالي الطلبات' : 'Total Orders'}</div>
                    <div style="font-size: 1.15rem; font-weight: 900; color: var(--text-main);">${totalOrdersCount}</div>
                </div>
                <div style="background: var(--input-bg); padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border-color);">
                    <div style="font-size: 0.72rem; color: #f59e0b; font-weight: 700;">⏳ ${isAr ? 'قيد الانتظار' : 'Pending'}</div>
                    <div style="font-size: 1.15rem; font-weight: 900; color: #f59e0b;">${pendingCount}</div>
                </div>
                <div style="background: var(--input-bg); padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border-color);">
                    <div style="font-size: 0.72rem; color: #3b82f6; font-weight: 700;">👨‍🍳 ${isAr ? 'قيد التحضير' : 'Preparing'}</div>
                    <div style="font-size: 1.15rem; font-weight: 900; color: #3b82f6;">${preparingCount}</div>
                </div>
                <div style="background: var(--input-bg); padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border-color);">
                    <div style="font-size: 0.72rem; color: #8b5cf6; font-weight: 700;">🚚 ${isAr ? 'خرج للتوصيل' : 'Delivery'}</div>
                    <div style="font-size: 1.15rem; font-weight: 900; color: #8b5cf6;">${deliveryCount}</div>
                </div>
                <div style="background: var(--input-bg); padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border-color);">
                    <div style="font-size: 0.72rem; color: #10b981; font-weight: 700;">✅ ${isAr ? 'تم التوصيل' : 'Delivered'}</div>
                    <div style="font-size: 1.15rem; font-weight: 900; color: #10b981;">${deliveredCount}</div>
                </div>
                <div style="background: var(--input-bg); padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border-color);">
                    <div style="font-size: 0.72rem; color: #ef4444; font-weight: 700;">❌ ${isAr ? 'ملغاة' : 'Cancelled'}</div>
                    <div style="font-size: 1.15rem; font-weight: 900; color: #ef4444;">${cancelledCount}</div>
                </div>
                <div style="background: var(--input-bg); padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border-color);">
                    <div style="font-size: 0.72rem; color: #10b981; font-weight: 700;">💵 ${isAr ? 'قيمة المبيعات' : 'SR Revenue'}</div>
                    <div style="font-size: 1.15rem; font-weight: 900; color: #10b981;">${totalRevenueCoins.toLocaleString()} SR</div>
                </div>
            </div>
        `;
    }

    let orders = allOrders;
    if (filterStatus !== 'all') {
        orders = orders.filter(o => o && o.status === filterStatus);
    }

    const emptyHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.9rem;">
            ${isAr ? 'لا توجد طلبات سوق مطابقة.' : 'No matching market orders.'}
        </div>
    `;

    if (orders.length === 0) {
        if (listEl) listEl.innerHTML = emptyHTML;
        if (modalListEl) modalListEl.innerHTML = emptyHTML;
        return;
    }

    const renderedHTML = orders.map(order => {
        const orderNum = formatMarketOrderNum(order);
        const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString() : '';
        const itemsSummary = (order.items || []).map(i => `${sanitizeMarketText(i.name)} (x${i.qty})`).join(', ');
        const orderJsonStr = JSON.stringify(order).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        const orderCompanyKey = order.companyKey || currentCompany;

        return `
            <div class="card" style="margin: 0; padding: 14px; border-radius: 14px; border: 1px solid var(--border-color); background: var(--input-bg); display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <div>
                        <span style="font-weight: 900; font-size: 0.98rem; color: #10b981; font-family: monospace, system-ui, sans-serif;">${orderNum}</span>
                        <span style="font-size: 0.84rem; font-weight: 800; color: var(--text-main); margin-left: 8px;">👤 ${sanitizeMarketText(order.workerName || 'Customer')}</span>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${dateStr}</div>
                    </div>

                    <!-- Status Selector Dropdown -->
                    <select onchange="updateMarketOrderStatus('${order.id}', this.value, '${orderCompanyKey}')" style="padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border-color); font-weight: 800; font-size: 0.82rem; background: var(--card-bg); color: var(--text-main); cursor: pointer;">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ Pending / قيد الانتظار</option>
                        <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>👨‍🍳 Preparing / قيد التحضير</option>
                        <option value="delivery" ${order.status === 'delivery' ? 'selected' : ''}>🚚 Out for Delivery / خرج للتوصيل</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>✅ Delivered / تم التوصيل</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>❌ Cancelled / ملغاة</option>
                    </select>
                </div>

                <div style="font-size: 0.85rem; color: var(--text-main);">
                    <b>${isAr ? 'المنتجات:' : 'Items:'}</b> ${itemsSummary}
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; border-top: 1px dashed var(--border-color); padding-top: 8px;">
                    <span style="font-weight: 900; color: #ef4444; font-size: 0.95rem;">${(order.totalCost || 0).toLocaleString()} ${isAr ? 'ر.س' : 'SR'} 💵</span>
                    
                    <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                        <button type="button" onclick='openMarketOrderReceiptModal(${orderJsonStr})' class="btn-outline" style="padding: 5px 10px; font-weight: 700; font-size: 0.78rem; border-radius: 8px; cursor: pointer;">
                            🧾 ${isAr ? 'الفاتورة' : 'Receipt'}
                        </button>
                        ${order.status !== 'cancelled' ? `
                            <button type="button" onclick="cancelMarketOrder('${order.id}', '${orderCompanyKey}')" class="btn-outline" style="padding: 5px 10px; font-weight: 700; font-size: 0.78rem; border-radius: 8px; color: #ef4444; border-color: #ef4444; cursor: pointer;">
                                ❌ ${isAr ? 'إلغاء الطلب' : 'Cancel'}
                            </button>
                        ` : ''}
                        <button type="button" onclick="deleteMarketOrder('${order.id}', '${orderCompanyKey}')" class="btn-danger" style="padding: 5px 10px; font-weight: 700; font-size: 0.78rem; border-radius: 8px; cursor: pointer;">
                            🗑️ ${isAr ? 'حذف' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (listEl) listEl.innerHTML = renderedHTML;
    if (modalListEl) modalListEl.innerHTML = renderedHTML;
}
window.renderAdminMarketOrders = renderAdminMarketOrders;

function updateMarketOrderStatus(orderId, newStatus, optCompanyKey) {
    const isAr = currentAppLang === 'ar';
    if (!orderId || !newStatus) return;

    let targetComp = optCompanyKey;
    if (!targetComp) {
        const found = findMarketOrderById(orderId);
        targetComp = found.companyKey || currentCompany;
    }

    if (newStatus === 'cancelled') {
        cancelMarketOrder(orderId, targetComp);
        return;
    }

    // Mutate in memory across all company objects immediately
    ['mvc', 'mvcfresh', 'burgeroov'].forEach(cKey => {
        if (appData[cKey] && appData[cKey].marketOrders && appData[cKey].marketOrders[orderId]) {
            appData[cKey].marketOrders[orderId].status = newStatus;
        }
    });

    db.ref(`companies/${targetComp}/marketOrders/${orderId}/status`).set(newStatus).then(() => {
        renderAdminMarketOrders();
        renderCustomerOrders();
        renderPrepareSection();
        showInAppNotification(isAr ? `تم تحديث حالة الطلب إلى: ${newStatus}` : `Order status updated to: ${newStatus}`);
    }).catch(err => {
        console.error("Error updating order status:", err);
        alert(isAr ? 'حدث خطأ أثناء تحديث حالة الطلب.' : 'Error updating order status.');
    });
}
window.updateMarketOrderStatus = updateMarketOrderStatus;

function cancelMarketOrder(orderId, optCompanyKey) {
    const isAr = currentAppLang === 'ar';
    if (!orderId) return;

    let targetComp = optCompanyKey;
    let order = null;

    if (targetComp && appData[targetComp] && appData[targetComp].marketOrders && appData[targetComp].marketOrders[orderId]) {
        order = appData[targetComp].marketOrders[orderId];
    } else {
        const foundInfo = findMarketOrderById(orderId);
        order = foundInfo.order;
        targetComp = foundInfo.companyKey || currentCompany;
    }

    if (!order) {
        alert(isAr ? 'لم يتم العثور على الطلب.' : 'Order not found.');
        return;
    }

    if (order.status === 'cancelled') {
        alert(isAr ? 'هذا الطلب ملغى بالفعل.' : 'This order is already cancelled.');
        return;
    }

    if (!confirm(isAr ? 'هل أنت تأكد من إلغاء هذا الطلب وإعادة العملات للزبون؟' : 'Are you sure you want to cancel this order and refund coins to customer?')) {
        return;
    }

    const totalCost = parseFloat(order.totalCost) || 0;
    const custCode = String(order.customerCode || order.workerId || '').trim();
    const isCustomerOrder = order.isCustomer || !!(custCode && (window.localCustomerRegistry?.[custCode] || (typeof currentCustomerSession !== 'undefined' && currentCustomerSession && String(currentCustomerSession.code || currentCustomerSession.id).trim() === custCode)));

    // Mutate status in memory IMMEDIATELY across all companies
    ['mvc', 'mvcfresh', 'burgeroov'].forEach(cKey => {
        if (appData[cKey] && appData[cKey].marketOrders && appData[cKey].marketOrders[orderId]) {
            appData[cKey].marketOrders[orderId].status = 'cancelled';
            appData[cKey].marketOrders[orderId].cancelledAt = Date.now();
        }
    });

    const updates = {};
    updates[`companies/${targetComp}/marketOrders/${orderId}/status`] = 'cancelled';
    updates[`companies/${targetComp}/marketOrders/${orderId}/cancelledAt`] = Date.now();

    if (totalCost > 0) {
        // 1. REFUND CUSTOMER COINS (If order is associated with a customer code or customer order)
        if (custCode) {
            let maxFoundCoins = 0;
            ['mvc', 'mvcfresh', 'burgeroov'].forEach(c => {
                if (appData[c] && appData[c].customers && appData[c].customers[custCode] && typeof appData[c].customers[custCode].coins !== 'undefined') {
                    const val = parseFloat(appData[c].customers[custCode].coins) || 0;
                    if (val > maxFoundCoins) maxFoundCoins = val;
                }
            });
            if (window.localCustomerRegistry && window.localCustomerRegistry[custCode] && typeof window.localCustomerRegistry[custCode].coins !== 'undefined') {
                const val = parseFloat(window.localCustomerRegistry[custCode].coins) || 0;
                if (val > maxFoundCoins) maxFoundCoins = val;
            }
            if (typeof currentCustomerSession !== 'undefined' && currentCustomerSession && String(currentCustomerSession.code || currentCustomerSession.id).trim() === custCode && typeof currentCustomerSession.coins !== 'undefined') {
                const val = parseFloat(currentCustomerSession.coins) || 0;
                if (val > maxFoundCoins) maxFoundCoins = val;
            }

            const newCustCoins = maxFoundCoins + totalCost;

            updates[`publicCustomerCodes/${custCode}/coins`] = newCustCoins;
            updates[`customerCodes/${custCode}/coins`] = newCustCoins;
            updates[`customers/${custCode}/coins`] = newCustCoins;
            ['mvc', 'mvcfresh', 'burgeroov'].forEach(c => {
                updates[`companies/${c}/customers/${custCode}/coins`] = newCustCoins;
                if (appData[c] && appData[c].customers && appData[c].customers[custCode]) {
                    appData[c].customers[custCode].coins = newCustCoins;
                }
            });

            if (typeof currentCustomerSession !== 'undefined' && currentCustomerSession && String(currentCustomerSession.code || currentCustomerSession.id).trim() === custCode) {
                currentCustomerSession.coins = newCustCoins;
                try { localStorage.setItem('mvc_customer_session', JSON.stringify(currentCustomerSession)); } catch (e) { }
            }
        }

        // 2. REFUND ADMIN / WORKER COINS
        const currentWId = getCurrentWorkerId();
        const targetWorkerId = (order.workerId ? String(order.workerId).trim() : '') || currentWId;

        let currentWorkerCoins = getUserCoins();
        ['mvc', 'mvcfresh', 'burgeroov'].forEach(cKey => {
            if (appData[cKey] && appData[cKey].workers && appData[cKey].workers[targetWorkerId] && typeof appData[cKey].workers[targetWorkerId].coins !== 'undefined') {
                const val = parseFloat(appData[cKey].workers[targetWorkerId].coins) || 0;
                if (val > currentWorkerCoins) currentWorkerCoins = val;
            }
            if (appData[cKey] && appData[cKey].userCoins && typeof appData[cKey].userCoins[targetWorkerId] !== 'undefined') {
                const val = parseFloat(appData[cKey].userCoins[targetWorkerId]) || 0;
                if (val > currentWorkerCoins) currentWorkerCoins = val;
            }
        });

        const newWorkerCoins = currentWorkerCoins + totalCost;

        ['mvc', 'mvcfresh', 'burgeroov'].forEach(cKey => {
            updates[`companies/${cKey}/workers/${targetWorkerId}/coins`] = newWorkerCoins;
            updates[`companies/${cKey}/userCoins/${targetWorkerId}`] = newWorkerCoins;
            if (currentWId && currentWId !== targetWorkerId) {
                updates[`companies/${cKey}/workers/${currentWId}/coins`] = newWorkerCoins;
                updates[`companies/${cKey}/userCoins/${currentWId}`] = newWorkerCoins;
            }

            if (appData[cKey]) {
                if (!appData[cKey].userCoins) appData[cKey].userCoins = {};
                appData[cKey].userCoins[targetWorkerId] = newWorkerCoins;
                appData[cKey].userCoins[currentWId] = newWorkerCoins;
                if (appData[cKey].workers && appData[cKey].workers[targetWorkerId]) {
                    appData[cKey].workers[targetWorkerId].coins = newWorkerCoins;
                }
                if (appData[cKey].workers && appData[cKey].workers[currentWId]) {
                    appData[cKey].workers[currentWId].coins = newWorkerCoins;
                }
            }
        });

        try {
            localStorage.setItem('mvc_admin_coins_' + targetWorkerId, newWorkerCoins);
            localStorage.setItem('mvc_admin_coins_' + currentWId, newWorkerCoins);
            localStorage.setItem('mvc_admin_coins', newWorkerCoins);
        } catch (e) { }

        const refId = 'rf_' + Date.now();
        updates[`companies/${targetComp}/coinTransactions/${refId}`] = {
            id: refId,
            customerCode: custCode,
            amount: totalCost,
            type: 'refund',
            reason: `Order Cancelled: ${order.orderNum || orderId}`,
            timestamp: Date.now(),
            createdBy: (currentUser && currentUser.email) ? currentUser.email : 'Admin'
        };
    }

    db.ref().update(updates).then(() => {
        ['mvc', 'mvcfresh', 'burgeroov'].forEach(cKey => {
            if (appData[cKey] && appData[cKey].marketOrders && appData[cKey].marketOrders[orderId]) {
                appData[cKey].marketOrders[orderId].status = 'cancelled';
            }
        });
        renderMarket();
        renderAdminMarketOrders();
        renderCustomerOrders();
        renderPrepareSection();
        showInAppNotification(isAr
            ? `تم إلغاء الطلب وإعادة ${totalCost} من العملات للزبون بنجاح!`
            : `Order cancelled and ${totalCost} coins refunded to customer successfully!`
        );
    }).catch(err => {
        console.error("Error cancelling order:", err);
        alert(isAr ? 'حدث خطأ أثناء إلغاء الطلب.' : 'Error cancelling order.');
    });
}
window.cancelMarketOrder = cancelMarketOrder;

function deleteMarketOrder(orderId, optCompanyKey) {
    const isAr = currentAppLang === 'ar';
    if (!orderId) return;

    let targetComp = optCompanyKey;
    if (!targetComp) {
        const found = findMarketOrderById(orderId);
        targetComp = found.companyKey || currentCompany;
    }

    if (!confirm(isAr ? 'هل أنت تأكد من حذف هذا الطلب نهائياً من النظام؟' : 'Are you sure you want to permanently delete this order?')) {
        return;
    }

    db.ref(`companies/${targetComp}/marketOrders/${orderId}`).remove().then(() => {
        renderAdminMarketOrders();
        renderCustomerOrders();
        renderPrepareSection();
        showInAppNotification(isAr ? 'تم حذف الطلب بنجاح.' : 'Order deleted successfully.');
    }).catch(err => {
        console.error("Error deleting market order:", err);
        alert(isAr ? 'حدث خطأ أثناء حذف الطلب.' : 'Error deleting market order.');
    });
}
window.deleteMarketOrder = deleteMarketOrder;

function toggleMarketProductVisibility(productId) {
    const isAr = currentAppLang === 'ar';
    const prods = getAllMarketProducts();
    const prod = prods.find(p => p && p.id === productId);

    if (!prod) return;

    window._isTogglingVisibility = true;

    const isCurrentlyHidden = isProductHidden(prod);
    const newHiddenState = !isCurrentlyHidden;
    const now = Date.now();

    prod.isHidden = newHiddenState;
    prod.hidden = newHiddenState;
    prod.updatedAt = now;

    if (!window.globalMarketProductsCache) window.globalMarketProductsCache = {};
    window.globalMarketProductsCache[productId] = {
        ...(window.globalMarketProductsCache[productId] || prod),
        id: productId,
        isHidden: newHiddenState,
        hidden: newHiddenState,
        updatedAt: now
    };

    if (typeof appData !== 'undefined') {
        ['mvc', 'mvcfresh', 'burgeroov'].forEach(cKey => {
            if (appData[cKey]) {
                if (!appData[cKey].marketProducts) appData[cKey].marketProducts = {};
                appData[cKey].marketProducts[productId] = {
                    ...(appData[cKey].marketProducts[productId] || prod),
                    id: productId,
                    isHidden: newHiddenState,
                    hidden: newHiddenState,
                    updatedAt: now
                };
            }
        });
    }

    try {
        localStorage.setItem('mvc_cached_market_products', JSON.stringify(window.globalMarketProductsCache));
    } catch (e) { }

    const scrollY = window.scrollY || document.documentElement.scrollTop;
    renderMarket();
    window.scrollTo({ top: scrollY, behavior: 'instant' });

    if (typeof showInAppNotification === 'function') {
        showInAppNotification(newHiddenState
            ? (isAr ? '🙈 تم إخفاء المنتج من المتجر (تم نقله للأسفل)' : '🙈 Product hidden from market (moved to bottom)')
            : (isAr ? '👁️ تم إظهار المنتج للزبائن' : '👁️ Product is now visible to customers')
        );
    }

    saveMarketProductToFirebase(productId, window.globalMarketProductsCache[productId] || prod)
        .then(() => {
            setTimeout(() => { window._isTogglingVisibility = false; }, 1500);
        })
        .catch(err => {
            console.error("Error toggling product visibility:", err);
            window._isTogglingVisibility = false;
        });
}
window.toggleMarketProductVisibility = toggleMarketProductVisibility;

function toggleAdminMarketCustomerPreview() {
    window.adminMarketCustomerPreview = !window.adminMarketCustomerPreview;
    renderMarket();
}
window.toggleAdminMarketCustomerPreview = toggleAdminMarketCustomerPreview;

function openAddMarketProductModal() {
    const modal = document.getElementById('add-market-product-modal');
    if (modal) modal.style.display = 'flex';
}
window.openAddMarketProductModal = openAddMarketProductModal;

function closeAddMarketProductModal() {
    const modal = document.getElementById('add-market-product-modal');
    if (modal) modal.style.display = 'none';
}
window.closeAddMarketProductModal = closeAddMarketProductModal;

function openCustomerManagementModal() {
    const modal = document.getElementById('customer-management-modal');
    if (modal) modal.style.display = 'flex';
    if (typeof renderAdminCustomersList === 'function') renderAdminCustomersList();
}
window.openCustomerManagementModal = openCustomerManagementModal;

function closeCustomerManagementModal() {
    const modal = document.getElementById('customer-management-modal');
    if (modal) modal.style.display = 'none';
}
function renderMarketProductCard(p) {
    const isCustomer = !!(typeof currentCustomerSession !== 'undefined' && currentCustomerSession);
    const isAdmin = isMarketAdmin();
    const isAr = currentAppLang === 'ar';
    const catKey = getNormalizedProductCategory(p);
    const weightText = p.weightTag || '';
    const cartItem = marketCart.find(item => item.productId === p.id);
    const itemInCartQty = cartItem ? cartItem.qty : 0;
    const isHidden = isProductHidden(p);

    let imageContent = '';
    if (p.imageUrl) {
        imageContent = `<img src="${p.imageUrl}" alt="${sanitizeMarketText(p.name)}" loading="lazy" decoding="async" onclick="showImage('${p.imageUrl}')" title="${isAr ? 'اضغط لتكبير الصورة' : 'Click to enlarge'}" style="width:100%; height:100%; object-fit:cover; display:block; cursor:pointer; transition: transform 0.3s ease; ${isHidden ? 'filter: opacity(0.6) grayscale(40%);' : ''}" class="market-prod-img" />`;
    } else {
        const meta = getMarketCategoryMeta(catKey);
        const bannerTitle = isAr ? meta.labelAr : meta.labelEn;
        const catIcon = meta.icon;
        const bannerGradient = meta.gradient;

        imageContent = `
            <div style="width:100%; height:100%; background: ${bannerGradient}; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#ffffff; text-align:center; padding:12px; box-sizing:border-box; position:relative; ${isHidden ? 'filter: opacity(0.6);' : ''}">
                <div style="font-size: 3.2rem; margin-bottom:4px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">${catIcon}</div>
                <div style="font-size: 1.05rem; font-weight:900; letter-spacing:-0.5px; text-shadow:0 2px 4px rgba(0,0,0,0.4);">${bannerTitle}</div>
            </div>
        `;
    }

    let adminActions = '';
    if (isAdmin) {
        const hideBtnText = isHidden ? (isAr ? '👁️ إظهار المنتج' : '👁️ Show Product') : (isAr ? '🙈 إخفاء المنتج' : '🙈 Hide Product');
        const hideBtnStyle = isHidden
            ? 'background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid #10b981;'
            : 'background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid #f59e0b;';

        adminActions = `
            <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 10px; border-top: 1px dashed var(--border-color); padding-top: 10px; width: 100%; box-sizing: border-box;">
                <button type="button" onclick="toggleMarketProductVisibility('${p.id}')" title="${isHidden ? (isAr ? 'إظهار المنتج للزبائن' : 'Show product to customers') : (isAr ? 'إخفاء المنتج من السوق' : 'Hide product from market')}" style="width: 100%; padding: 7px 10px; font-size: 0.8rem; font-weight: 800; border-radius: 9px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s ease; ${hideBtnStyle}">
                    ${hideBtnText}
                </button>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; width: 100%;">
                    <button type="button" onclick="openEditMarketProductModal('${p.id}')" class="btn-outline" style="width: 100%; padding: 7px 8px; font-size: 0.8rem; font-weight: 800; border-radius: 9px; display: flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer;">
                        ✏️ ${isAr ? 'تعديل' : 'Edit'}
                    </button>
                    <button type="button" onclick="deleteMarketProduct('${p.id}')" class="btn-danger" style="width: 100%; padding: 7px 8px; font-size: 0.8rem; font-weight: 800; border-radius: 9px; display: flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer;">
                        ✖ ${isAr ? 'حذف' : 'Delete'}
                    </button>
                </div>
            </div>
        `;
    }

    return `
        <div class="card market-store-card" ${isAdmin ? `ondblclick="if (!event.target.closest('button') && !event.target.closest('input')) openEditMarketProductModal('${p.id}')"` : ''} style="margin: 0; border: 1px solid ${isHidden ? '#f59e0b' : 'var(--border-color)'}; border-radius: 16px; background: var(--card-bg, #ffffff); overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s ease, box-shadow 0.2s ease; box-shadow: 0 4px 14px rgba(0,0,0,0.05); position: relative; ${isHidden ? 'opacity: 0.88;' : ''} ${isAdmin ? 'cursor: pointer;' : ''}" title="${isAdmin ? (isAr ? 'انقر مرتين للتعديل' : 'Double-click to edit') : ''}">
            <div>
                <div style="width: 100%; aspect-ratio: 1 / 1; position: relative; overflow: hidden; background: #f8fafc; border-bottom: 1px solid var(--border-color);">
                    ${imageContent}

                    ${isHidden ? `
                        <div style="position: absolute; top: 10px; right: 10px; background: rgba(239, 68, 68, 0.95); color: #ffffff; font-weight: 900; font-size: 0.72rem; padding: 4px 10px; border-radius: 100px; backdrop-filter: blur(4px); box-shadow: 0 2px 8px rgba(0,0,0,0.25); z-index: 3; display: flex; align-items: center; gap: 4px;">
                            🙈 ${isAr ? 'مخفي' : 'Hidden'}
                        </div>
                    ` : ''}

                    ${weightText ? `
                        <div style="position: absolute; bottom: 10px; left: 10px; background: rgba(0, 0, 0, 0.65); color: #ffffff; font-weight: 800; font-size: 0.8rem; padding: 4px 10px; border-radius: 8px; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.25); z-index: 2;">
                            ${sanitizeMarketText(weightText)}
                        </div>
                    ` : ''}
                </div>

                <!-- Product Details -->
                <div style="padding: 14px 14px 6px 14px; text-align: center;">
                    <h3 style="margin: 0 0 4px 0; color: var(--text-main); font-size: 1.05rem; font-weight: 800; line-height: 1.35; height: 2.7rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${sanitizeMarketText(p.name || '')}
                    </h3>
                </div>
            </div>

            <div style="padding: 0 14px 14px 14px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 4px; color: #ef4444; font-size: 1.3rem; font-weight: 900;">
                    <span>${p.price || 0}</span>
                    <span style="font-size: 0.95rem; font-weight: 800; color: #ef4444;">SR</span>
                    <span style="font-size: 1.05rem;">💵</span>
                </div>

                <button onclick="addToMarketCart('${p.id}', event)" title="${isAr ? 'أضف للسلة' : 'Add to Cart'}" style="width: 100%; box-sizing: border-box; padding: 9px 12px; border-radius: 10px; border: none; background: #2563eb; color: #ffffff; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.28); transition: all 0.2s ease;">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                    <span style="white-space: nowrap;">${isAr ? 'أضف للسلة' : 'Add to Cart'}</span>
                    ${itemInCartQty > 0 ? `
                        <span style="background: #ffffff; color: #2563eb; font-size: 0.75rem; font-weight: 900; padding: 2px 8px; border-radius: 100px; line-height: 1; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;">
                            ${itemInCartQty}
                        </span>
                    ` : ''}
                </button>
                ${adminActions}
            </div>
        </div>
    `;
}
window.renderMarketProductCard = renderMarketProductCard;

let isMarketLoadingMore = false;

function loadMoreMarketProducts() {
    if (isMarketLoadingMore) return;
    if (!window.currentMarketFilteredProducts || window.currentMarketRenderLimit >= window.currentMarketFilteredProducts.length) return;

    const grid = document.getElementById('market-products-grid');
    if (!grid) return;

    isMarketLoadingMore = true;

    let triggerEl = document.getElementById('market-infinite-scroll-trigger');
    if (!triggerEl) {
        appendInfiniteScrollTrigger(grid);
        triggerEl = document.getElementById('market-infinite-scroll-trigger');
    }

    if (triggerEl) {
        const isAr = currentAppLang === 'ar';
        triggerEl.style.opacity = '1';
        triggerEl.style.display = 'flex';
        triggerEl.innerHTML = `
            <span class="spinner" style="display:inline-block; width:18px; height:18px; border:2.5px solid var(--primary, #3b82f6); border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite;"></span>
            <span>${isAr ? 'جاري تحميل 24 منتج إضافية...' : 'Loading 24 more products...'}</span>
        `;
    }

    setTimeout(() => {
        if (triggerEl) triggerEl.remove();

        const previousLimit = window.currentMarketRenderLimit;
        window.currentMarketRenderLimit += 24;
        const nextBatch = window.currentMarketFilteredProducts.slice(previousLimit, window.currentMarketRenderLimit);

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = nextBatch.map(renderMarketProductCard).join('');
        while (tempDiv.firstChild) {
            grid.appendChild(tempDiv.firstChild);
        }

        isMarketLoadingMore = false;

        if (window.currentMarketRenderLimit < window.currentMarketFilteredProducts.length) {
            appendInfiniteScrollTrigger(grid);
        }
    }, 200);
}
window.loadMoreMarketProducts = loadMoreMarketProducts;

function appendInfiniteScrollTrigger(container) {
    if (!container) return;
    const existing = document.getElementById('market-infinite-scroll-trigger');
    if (existing) existing.remove();

    const isAr = currentAppLang === 'ar';
    const trigger = document.createElement('div');
    trigger.id = 'market-infinite-scroll-trigger';
    trigger.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 16px 24px; margin: 20px 0; background: var(--input-bg, #1e293b); border: 1px dashed var(--border-color, rgba(255,255,255,0.15)); border-radius: 16px; color: var(--primary, #3b82f6); font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); transition: opacity 0.2s ease;';
    trigger.innerHTML = `
        <span class="spinner" style="display:inline-block; width:18px; height:18px; border:2.5px solid var(--primary, #3b82f6); border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite;"></span>
        <span>${isAr ? 'جاري تحميل 24 منتج إضافية...' : 'Loading 24 more products...'}</span>
    `;
    container.appendChild(trigger);

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0] && entries[0].isIntersecting && !isMarketLoadingMore) {
                observer.disconnect();
                loadMoreMarketProducts();
            }
        }, { rootMargin: '100px' });
        observer.observe(trigger);
    }
}
window.appendInfiniteScrollTrigger = appendInfiniteScrollTrigger;

function expandCategorySection(catKey) {
    if (!window.currentGroupedCategoryItems || !window.currentGroupedCategoryItems[catKey]) return;
    const catContainer = document.getElementById(`cat-grid-container-${catKey}`);
    const sentinel = document.getElementById(`auto-load-cat-sec-${catKey}`);
    if (!catContainer) return;

    const catItems = window.currentGroupedCategoryItems[catKey];
    const remainingItems = catItems.slice(12);

    if (typeof window.renderProductCardInstance === 'function') {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = remainingItems.map(window.renderProductCardInstance).join('');
        while (tempDiv.firstChild) {
            catContainer.appendChild(tempDiv.firstChild);
        }
    }
    if (sentinel) sentinel.remove();
}
window.expandCategorySection = expandCategorySection;

function renderMarket() {
    window.currentMarketRenderLimit = 24;
    const grid = document.getElementById('market-products-grid');
    if (!grid) return;

    if (typeof setupSearchInputClearButtons === 'function') {
        setupSearchInputClearButtons();
    }

    const isCustomer = !!(typeof currentCustomerSession !== 'undefined' && currentCustomerSession);
    const prods = getAllMarketProducts();
    const search = (document.getElementById('market-search-input')?.value || '').trim().toLowerCase();
    const isAdmin = isMarketAdmin();
    const isAr = currentAppLang === 'ar';

    renderMarketCategoryTabs(prods);

    const pagContainer = document.getElementById('market-pagination-container');
    if (pagContainer) pagContainer.innerHTML = '';

    const userCoins = getUserCoins();
    const userCoinsValEl = document.getElementById('market-user-coins-val');
    if (userCoinsValEl) userCoinsValEl.textContent = userCoins.toLocaleString();
    updateMarketCartBadges();

    const adminOrdersBtn = document.getElementById('market-admin-orders-btn');
    if (adminOrdersBtn) {
        adminOrdersBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    }
    const adminFeedbackBtn = document.getElementById('market-admin-feedback-btn');
    if (adminFeedbackBtn) {
        adminFeedbackBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    }
    if (isAdmin && typeof initAdminMarketFeedbackListener === 'function') {
        initAdminMarketFeedbackListener();
    }
    const addProdBtn = document.getElementById('market-add-prod-btn');
    if (addProdBtn) {
        addProdBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    }
    const manageCustBtn = document.getElementById('market-manage-cust-btn');
    if (manageCustBtn) {
        manageCustBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    }
    const testCoinsBtn = document.querySelector('.adv-btn-coins-add');
    if (testCoinsBtn) {
        testCoinsBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    }

    let filtered = prods.filter(p => {
        if (!p) return false;
        const hidden = isProductHidden(p);

        if (currentMarketCategoryFilter === 'hidden') {
            if (!isAdmin) return false;
            return hidden;
        }

        if (!isAdmin && hidden) return false;
        if (window.adminMarketCustomerPreview && hidden) return false;

        const pCat = getNormalizedProductCategory(p);
        if (currentMarketCategoryFilter !== 'all' && pCat !== currentMarketCategoryFilter) return false;
        if (search && !(p.name || '').toLowerCase().includes(search)) return false;
        return true;
    });

    // SORTING: Push hidden products (hidden = 1) to the VERY BOTTOM!
    filtered.sort((a, b) => {
        const aHidden = isProductHidden(a) ? 1 : 0;
        const bHidden = isProductHidden(b) ? 1 : 0;

        if (aHidden !== bHidden) {
            return aHidden - bHidden; // Non-hidden (0) first, Hidden (1) last!
        }
        return (b.createdAt || 0) - (a.createdAt || 0);
    });

    const totalCount = filtered.length;
    const badge = document.getElementById('market-count-badge');
    if (badge) {
        badge.textContent = `${totalCount} ${isAr ? 'منتج' : 'Products'}`;
    }

    if (totalCount === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; background: var(--input-bg); border-radius: 18px; border: 1px dashed var(--border-color); max-width: 600px; margin: 0 auto; width: 100%;">
                <div style="font-size: 3.5rem; margin-bottom: 12px;">🏪</div>
                <h3 style="margin: 0 0 8px 0; color: var(--text-main); font-size: 1.2rem; font-weight: 800;">${isAr ? 'لا توجد منتجات بهذا القسم' : 'No Products Found in This Category'}</h3>
                <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">${isAr ? 'قم بإضافة منتجات لحوم، أسماك، أو خضار وفواكه جديدة لكتالوج المتجر.' : 'Add new meat, fish, or vegetable products to the store catalog.'}</p>
            </div>
        `;
        return;
    }

    function renderMarketProductCard(p) {
        const isCustomer = !!(typeof currentCustomerSession !== 'undefined' && currentCustomerSession);
        const isAdmin = isMarketAdmin();
        const isAr = currentAppLang === 'ar';
        const catKey = getNormalizedProductCategory(p);
        const weightText = p.weightTag || '';
        const cartItem = marketCart.find(item => item.productId === p.id);
        const itemInCartQty = cartItem ? cartItem.qty : 0;
        const isHidden = isProductHidden(p);

        let imageContent = '';
        if (p.imageUrl) {
            imageContent = `<img src="${p.imageUrl}" alt="${sanitizeMarketText(p.name)}" loading="lazy" decoding="async" onclick="showImage('${p.imageUrl}')" title="${isAr ? 'اضغط لتكبير الصورة' : 'Click to enlarge'}" style="width:100%; height:100%; object-fit:cover; display:block; cursor:pointer; transition: transform 0.3s ease; ${isHidden ? 'filter: opacity(0.6) grayscale(40%);' : ''}" class="market-prod-img" />`;
        } else {
            const meta = getMarketCategoryMeta(catKey);
            const bannerTitle = isAr ? meta.labelAr : meta.labelEn;
            const catIcon = meta.icon;
            const bannerGradient = meta.gradient;

            imageContent = `
            <div style="width:100%; height:100%; background: ${bannerGradient}; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#ffffff; text-align:center; padding:12px; box-sizing:border-box; position:relative; ${isHidden ? 'filter: opacity(0.6);' : ''}">
                <div style="font-size: 3.2rem; margin-bottom:4px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">${catIcon}</div>
                <div style="font-size: 1.05rem; font-weight:900; letter-spacing:-0.5px; text-shadow:0 2px 4px rgba(0,0,0,0.4);">${bannerTitle}</div>
            </div>
        `;
        }

        let adminActions = '';
        if (isAdmin) {
            const hideBtnText = isHidden ? (isAr ? '👁️ إظهار المنتج' : '👁️ Show Product') : (isAr ? '🙈 إخفاء المنتج' : '🙈 Hide Product');
            const hideBtnStyle = isHidden
                ? 'background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid #10b981;'
                : 'background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid #f59e0b;';

            adminActions = `
            <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 10px; border-top: 1px dashed var(--border-color); padding-top: 10px; width: 100%; box-sizing: border-box;">
                <button type="button" onclick="toggleMarketProductVisibility('${p.id}')" title="${isHidden ? (isAr ? 'إظهار المنتج للزبائن' : 'Show product to customers') : (isAr ? 'إخفاء المنتج من السوق' : 'Hide product from market')}" style="width: 100%; padding: 7px 10px; font-size: 0.8rem; font-weight: 800; border-radius: 9px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s ease; ${hideBtnStyle}">
                    ${hideBtnText}
                </button>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; width: 100%;">
                    <button type="button" onclick="openEditMarketProductModal('${p.id}')" class="btn-outline" style="width: 100%; padding: 7px 8px; font-size: 0.8rem; font-weight: 800; border-radius: 9px; display: flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer;">
                        ✏️ ${isAr ? 'تعديل' : 'Edit'}
                    </button>
                    <button type="button" onclick="deleteMarketProduct('${p.id}')" class="btn-danger" style="width: 100%; padding: 7px 8px; font-size: 0.8rem; font-weight: 800; border-radius: 9px; display: flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer;">
                        ✖ ${isAr ? 'حذف' : 'Delete'}
                    </button>
                </div>
            </div>
        `;
        }

        return `
        <div class="card market-store-card" style="margin: 0; border: 1px solid ${isHidden ? '#f59e0b' : 'var(--border-color)'}; border-radius: 16px; background: var(--card-bg, #ffffff); overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s ease, box-shadow 0.2s ease; box-shadow: 0 4px 14px rgba(0,0,0,0.05); position: relative; ${isHidden ? 'opacity: 0.88;' : ''}">
            <div>
                <div style="width: 100%; aspect-ratio: 1 / 1; position: relative; overflow: hidden; background: #f8fafc; border-bottom: 1px solid var(--border-color);">
                    ${imageContent}

                    ${isHidden ? `
                        <div style="position: absolute; top: 10px; right: 10px; background: rgba(239, 68, 68, 0.95); color: #ffffff; font-weight: 900; font-size: 0.72rem; padding: 4px 10px; border-radius: 100px; backdrop-filter: blur(4px); box-shadow: 0 2px 8px rgba(0,0,0,0.25); z-index: 3; display: flex; align-items: center; gap: 4px;">
                            🙈 ${isAr ? 'مخفي' : 'Hidden'}
                        </div>
                    ` : ''}

                    ${weightText ? `
                        <div style="position: absolute; bottom: 10px; left: 10px; background: rgba(0, 0, 0, 0.65); color: #ffffff; font-weight: 800; font-size: 0.8rem; padding: 4px 10px; border-radius: 8px; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.25); z-index: 2;">
                            ${sanitizeMarketText(weightText)}
                        </div>
                    ` : ''}
                </div>

                <!-- Product Details -->
                <div style="padding: 14px 14px 6px 14px; text-align: center;">
                    <h3 style="margin: 0 0 4px 0; color: var(--text-main); font-size: 1.05rem; font-weight: 800; line-height: 1.35; height: 2.7rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${sanitizeMarketText(p.name || '')}
                    </h3>
                </div>
            </div>

            <div style="padding: 0 14px 14px 14px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 4px; color: #ef4444; font-size: 1.3rem; font-weight: 900;">
                    <span>${p.price || 0}</span>
                    <span style="font-size: 0.95rem; font-weight: 800; color: #ef4444;">SR</span>
                    <span style="font-size: 1.05rem;">💵</span>
                </div>

                <button onclick="addToMarketCart('${p.id}', event)" title="${isAr ? 'أضف للسلة' : 'Add to Cart'}" style="width: 100%; box-sizing: border-box; padding: 9px 12px; border-radius: 10px; border: none; background: #2563eb; color: #ffffff; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.28); transition: all 0.2s ease;">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                    <span style="white-space: nowrap;">${isAr ? 'أضف للسلة' : 'Add to Cart'}</span>
                    ${itemInCartQty > 0 ? `
                        <span class="cart-btn-qty-badge" style="background: #ffffff; color: #2563eb; font-size: 0.75rem; font-weight: 900; padding: 2px 8px; border-radius: 100px; line-height: 1; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;">
                            ${itemInCartQty}
                        </span>
                    ` : ''}
                </button>
                ${adminActions}
            </div>
        </div>
    `;
    }
    window.renderMarketProductCard = renderMarketProductCard;



    // Single Category Filter View (e.g. Vegetables & Fruits, Fish & Seafood, Meat, or Search)
    // Render Category Banner at top and Products in smooth 12-item batching on scroll
    let sectionHeaderHTML = '';
    if (currentMarketCategoryFilter !== 'all') {
        const meta = getMarketCategoryMeta(currentMarketCategoryFilter);
        const sectionTitle = isAr ? meta.labelAr : meta.labelEn;
        sectionHeaderHTML = `
            <div class="market-section-group" style="grid-column: 1 / -1; margin-bottom: 16px;">
                <div style="background: ${meta.gradient}; color: #ffffff; padding: 16px 22px; border-radius: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; box-shadow: 0 6px 18px rgba(0,0,0,0.12);">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 2.2rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${meta.icon}</span>
                        <div>
                            <h2 style="margin: 0; font-size: 1.35rem; font-weight: 900; color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${sectionTitle}</h2>
                            <span style="font-size: 0.85rem; opacity: 0.92; font-weight: 700;">${filtered.length} ${isAr ? 'منتجات متوفرة بهذا القسم' : 'products available'}</span>
                        </div>
                    </div>
                    <button onclick="setMarketCategoryFilter('all')" style="background: rgba(255,255,255,0.22); color: #ffffff; border: 1px solid rgba(255,255,255,0.4); border-radius: 100px; padding: 7px 18px; font-weight: 800; font-size: 0.85rem; cursor: pointer; backdrop-filter: blur(4px); transition: all 0.2s ease;">
                        ${isAr ? '🌟 عرض جميع الأقسام' : '🌟 View All Sections'}
                    </button>
                </div>
            </div>
        `;
    }

    window.currentMarketFilteredProducts = filtered;
    const initialBatch = filtered.slice(0, window.currentMarketRenderLimit);

    grid.innerHTML = sectionHeaderHTML + initialBatch.map(renderMarketProductCard).join('');

    if (filtered.length > window.currentMarketRenderLimit) {
        appendInfiniteScrollTrigger(grid);
    }

    renderAdminCustomersList();
    renderAdminMarketOrders();
    renderCustomerOrders();
}
window.renderMarket = renderMarket;

function addMarketProduct() {
    const nameEl = document.getElementById('market-product-name-input');
    const catEl = document.getElementById('market-product-category-select');
    const priceEl = document.getElementById('market-product-price-input');
    const weightEl = document.getElementById('market-product-weight-input');
    const imageEl = document.getElementById('market-product-image-input');
    const isAr = currentAppLang === 'ar';

    if (!nameEl || !catEl || !priceEl) return;

    const name = nameEl.value.trim();
    const category = catEl.value;
    const price = parseFloat(priceEl.value);
    const weightTag = weightEl ? weightEl.value.trim() : '';
    const imageUrl = imageEl ? imageEl.value.trim() : '';
    const hiddenEl = document.getElementById('market-product-hidden-add');
    const isHidden = hiddenEl ? hiddenEl.checked : false;

    if (!name) {
        alert(isAr ? 'الرجاء إدخال اسم المنتج.' : 'Please enter product name.');
        return;
    }

    if (isNaN(price) || price < 0) {
        alert(isAr ? 'الرجاء إدخال سعر صحيح بالقطع النقدية.' : 'Please enter a valid coin price.');
        return;
    }

    const productId = 'mkt_' + Date.now();
    const productObj = {
        id: productId,
        name: name,
        category: category,
        price: price,
        weightTag: weightTag,
        imageUrl: imageUrl,
        isHidden: isHidden,
        createdAt: Date.now(),
        createdBy: (typeof currentUser !== 'undefined' && currentUser && currentUser.email) ? currentUser.email : 'Admin'
    };

    saveMarketProductToFirebase(productId, productObj)
        .then(() => {
            nameEl.value = '';
            priceEl.value = '';
            if (weightEl) weightEl.value = '';
            if (imageEl) imageEl.value = '';
            const previewContainer = document.getElementById('market-img-preview-add');
            if (previewContainer) previewContainer.style.display = 'none';
            if (!window.globalMarketProductsCache) window.globalMarketProductsCache = {};
            window.globalMarketProductsCache[productId] = productObj;
            renderMarket();
            closeAddMarketProductModal();
            showInAppNotification(isAr ? 'تم نشر المنتج بنجاح!' : 'Market product published successfully!');
        })
        .catch(err => {
            console.error("Error adding market product:", err);
            alert(isAr ? 'حدث خطأ أثناء إضافة المنتج.' : 'Error adding market product.');
        });
}
window.addMarketProduct = addMarketProduct;

function openEditMarketProductModal(productId) {
    const prods = getAllMarketProducts();
    const prod = prods.find(p => p.id === productId);

    if (!prod) {
        alert(currentAppLang === 'ar' ? 'لم يتم العثور على المنتج.' : 'Product not found.');
        return;
    }

    const catSelect = document.getElementById('edit-market-product-category');
    if (catSelect) {
        const isAr = currentAppLang === 'ar';
        const knownCategories = new Set(['meat', 'veg_fruit', 'fish']);

        prods.forEach(p => {
            const cat = getNormalizedProductCategory(p);
            if (cat) knownCategories.add(cat);
        });

        const prodCat = getNormalizedProductCategory(prod);
        if (prodCat) knownCategories.add(prodCat);

        let optionsHTML = '';
        knownCategories.forEach(catKey => {
            const meta = getMarketCategoryMeta(catKey);
            const label = isAr ? meta.labelAr : meta.labelEn;
            optionsHTML += `<option value="${catKey}">${label}</option>`;
        });
        optionsHTML += `<option value="custom">${isAr ? '➕ إضافة قسم جديد...' : '➕ Add New Category...'}</option>`;
        catSelect.innerHTML = optionsHTML;
        catSelect.value = prodCat || 'meat';
    }

    const customInput = document.getElementById('market-product-custom-category-edit');
    if (customInput) {
        customInput.style.display = 'none';
        customInput.value = '';
    }

    document.getElementById('edit-market-product-id').value = prod.id;
    document.getElementById('edit-market-product-name').value = prod.name || '';
    document.getElementById('edit-market-product-price').value = prod.price || 0;

    const weightEl = document.getElementById('edit-market-product-weight');
    const imageEl = document.getElementById('edit-market-product-image');
    const hiddenEl = document.getElementById('edit-market-product-hidden');

    if (weightEl) weightEl.value = prod.weightTag || '';
    if (imageEl) imageEl.value = prod.imageUrl || '';
    if (hiddenEl) hiddenEl.checked = !!prod.isHidden;

    const previewContainer = document.getElementById('market-img-preview-edit');
    const previewImg = document.getElementById('market-img-preview-edit-src');
    if (prod.imageUrl) {
        if (previewImg) previewImg.src = prod.imageUrl;
        if (previewContainer) previewContainer.style.display = 'block';
    } else {
        if (previewContainer) previewContainer.style.display = 'none';
    }

    const modal = document.getElementById('edit-market-product-modal');
    if (modal) modal.style.display = 'flex';
}
window.openEditMarketProductModal = openEditMarketProductModal;

function closeEditMarketProductModal() {
    const modal = document.getElementById('edit-market-product-modal');
    if (modal) modal.style.display = 'none';
}
window.closeEditMarketProductModal = closeEditMarketProductModal;

function saveEditedMarketProduct() {
    const id = document.getElementById('edit-market-product-id').value;
    const name = document.getElementById('edit-market-product-name').value.trim();
    let category = document.getElementById('edit-market-product-category').value;
    const isAr = currentAppLang === 'ar';

    if (category === 'custom') {
        const customInput = document.getElementById('market-product-custom-category-edit');
        if (customInput && customInput.value.trim()) {
            category = customInput.value.trim().toLowerCase().replace(/\s+/g, '_');
        } else {
            alert(isAr ? 'الرجاء إدخال اسم القسم الجديد.' : 'Please enter new category name.');
            return;
        }
    }

    const price = parseFloat(document.getElementById('edit-market-product-price').value);
    const weightTag = document.getElementById('edit-market-product-weight')?.value.trim() || '';
    const imageUrl = document.getElementById('edit-market-product-image')?.value.trim() || '';
    const isHidden = document.getElementById('edit-market-product-hidden')?.checked || false;

    if (!name || isNaN(price) || price < 0) {
        alert(isAr ? 'الرجاء إدخال بيانات صحيحة.' : 'Please enter valid details.');
        return;
    }

    const now = Date.now();
    const updateObj = {
        id: id,
        name: name,
        category: category,
        price: price,
        weightTag: weightTag,
        imageUrl: imageUrl,
        isHidden: isHidden,
        hidden: isHidden,
        updatedAt: now
    };

    // 1. Mutate cache immediately
    if (!window.globalMarketProductsCache) window.globalMarketProductsCache = {};
    window.globalMarketProductsCache[id] = { ...updateObj };

    // 2. Mutate appData across all companies immediately
    if (typeof appData !== 'undefined') {
        ['mvc', 'mvcfresh', 'burgeroov'].forEach(cKey => {
            if (appData[cKey]) {
                if (!appData[cKey].marketProducts) appData[cKey].marketProducts = {};
                appData[cKey].marketProducts[id] = { ...updateObj };
            }
        });
    }

    try {
        localStorage.setItem('mvc_cached_market_products', JSON.stringify(window.globalMarketProductsCache));
    } catch (e) { }

    renderMarket();
    closeEditMarketProductModal();

    saveMarketProductToFirebase(id, updateObj)
        .then(() => {
            renderMarket();
            showInAppNotification(isAr ? 'تم تحديث المنتج بنجاح!' : 'Product updated successfully!');
        })
        .catch(err => {
            console.error("Error saving edited product:", err);
            alert(isAr ? 'حدث خطأ أثناء حفظ التعديلات.' : 'Error saving product updates.');
        });
}
window.saveEditedMarketProduct = saveEditedMarketProduct;

function deleteMarketProduct(productId) {
    const isAr = currentAppLang === 'ar';
    if (!confirm(isAr ? 'هل أنت تأكد من حذف هذا المنتج من السوق؟' : 'Are you sure you want to delete this product from the market?')) {
        return;
    }

    const updates = {};
    updates[`marketProducts/${productId}`] = null;
    ['mvc', 'mvcfresh', 'burgeroov'].forEach(c => {
        updates[`companies/${c}/marketProducts/${productId}`] = null;
        if (typeof appData !== 'undefined' && appData[c] && appData[c].marketProducts) {
            delete appData[c].marketProducts[productId];
        }
    });

    if (window.globalMarketProductsCache) {
        delete window.globalMarketProductsCache[productId];
        try {
            localStorage.setItem('mvc_cached_market_products', JSON.stringify(window.globalMarketProductsCache));
        } catch (e) { }
    }

    if (window.currentMarketFilteredProducts) {
        window.currentMarketFilteredProducts = window.currentMarketFilteredProducts.filter(p => p && p.id !== productId);
    }

    saveMarketProductToFirebase(productId, null)
        .then(() => {
            if (typeof renderMarket === 'function') renderMarket();
            if (typeof showInAppNotification === 'function') {
                showInAppNotification(isAr ? 'تم حذف المنتج بنجاح!' : 'Product deleted successfully!');
            }
        })
        .catch(err => {
            console.error("Error deleting market product:", err);
            alert(isAr ? 'حدث خطأ أثناء الحذف.' : 'Error deleting product.');
        });
}
window.deleteMarketProduct = deleteMarketProduct;

// ==========================================
// CUSTOMER CODE AUTHENTICATION & MANAGEMENT
// ==========================================

function handleCustomerCodeLogin() {
    const isAr = currentAppLang === 'ar';
    const codeInput = document.getElementById('auth-customer-code');
    if (!codeInput) return;

    const rawCode = codeInput.value.trim();
    if (!rawCode) {
        alert(isAr ? 'الرجاء إدخال رمز العميل الخاص بك.' : 'Please enter your customer code.');
        return;
    }

    const cleanCode = rawCode.replace(/\s+/g, '');

    function processCustomerLogin(foundCust) {
        currentCustomerSession = foundCust;
        if (foundCust.company) currentCompany = foundCust.company;

        try {
            localStorage.setItem('mvc_customer_session', JSON.stringify(foundCust));
            localStorage.setItem('mvc_customer_code', cleanCode);
        } catch (e) { }

        const authOverlay = document.getElementById('auth-overlay');
        if (authOverlay) authOverlay.style.display = 'none';

        const appWrapper = document.getElementById('app-wrapper');
        if (appWrapper) appWrapper.style.display = 'block';

        window.hasDeepFetchedMarketProducts = false;
        applyCustomerModeUI();
        switchTab('market');
        renderMarket();
    }

    // 1. Check local customer registry cache
    if (window.localCustomerRegistry) {
        if (window.localCustomerRegistry[cleanCode]) {
            processCustomerLogin(window.localCustomerRegistry[cleanCode]);
            return;
        }
        const match = Object.values(window.localCustomerRegistry).find(c => c && (String(c.code).trim() === cleanCode || c.code == cleanCode));
        if (match) {
            processCustomerLogin(match);
            return;
        }
    }

    // 2. Check local appData state across all companies
    if (typeof appData !== 'undefined') {
        const cKeys = ['mvc', 'mvcfresh', 'burgeroov', ...Object.keys(appData)];
        for (const cKey of cKeys) {
            if (appData[cKey] && appData[cKey].customers) {
                const cMap = appData[cKey].customers;
                if (cMap[cleanCode]) {
                    processCustomerLogin(cMap[cleanCode]);
                    return;
                }
                const match = Object.values(cMap).find(c => c && (String(c.code).trim() === cleanCode || c.code == cleanCode));
                if (match) {
                    processCustomerLogin(match);
                    return;
                }
            }
        }
    }

    // 3. Query Firebase public & company paths
    const executeQuery = () => {
        const fetchPromises = [
            db.ref(`publicCustomerCodes/${cleanCode}`).once('value').then(s => s.val()).catch(() => null),
            db.ref(`customerCodes/${cleanCode}`).once('value').then(s => s.val()).catch(() => null),
            db.ref(`customers/${cleanCode}`).once('value').then(s => s.val()).catch(() => null),
            db.ref(`companies/mvc/customers/${cleanCode}`).once('value').then(s => s.val()).catch(() => null),
            db.ref(`companies/mvcfresh/customers/${cleanCode}`).once('value').then(s => s.val()).catch(() => null),
            db.ref(`companies/burgeroov/customers/${cleanCode}`).once('value').then(s => s.val()).catch(() => null),
            db.ref(`publicCustomerCodes`).once('value').then(s => s.val()).catch(() => null),
            db.ref(`customerCodes`).once('value').then(s => s.val()).catch(() => null),
            db.ref(`customers`).once('value').then(s => s.val()).catch(() => null)
        ];

        Promise.all(fetchPromises).then(results => {
            let foundCust = null;
            for (const res of results) {
                if (!res) continue;
                if (res.code && (String(res.code).trim() === cleanCode || res.code == cleanCode)) {
                    foundCust = res;
                    break;
                }
                if (typeof res === 'object') {
                    if (res[cleanCode]) {
                        foundCust = res[cleanCode];
                        break;
                    }
                    const match = Object.values(res).find(c => c && (String(c.code).trim() === cleanCode || c.code == cleanCode));
                    if (match) {
                        foundCust = match;
                        break;
                    }
                }
            }

            if (!foundCust) {
                alert(isAr ? 'رمز العميل غير صحيح أو غير موجود.' : 'Invalid or non-existent Customer Code.');
                return;
            }

            if (!window.localCustomerRegistry) window.localCustomerRegistry = {};
            window.localCustomerRegistry[cleanCode] = foundCust;
            try {
                localStorage.setItem('mvc_global_customer_registry', JSON.stringify(window.localCustomerRegistry));
            } catch (e) { }

            processCustomerLogin(foundCust);
        }).catch(err => {
            console.error("Error logging in with customer code:", err);
            alert(isAr ? 'حدث خطأ أثناء تسجيل الدخول برمز العميل.' : 'Error signing in with Customer Code.');
        });
    };

    if (typeof firebase !== 'undefined' && firebase.auth && !firebase.auth().currentUser) {
        firebase.auth().signInAnonymously().then(() => {
            executeQuery();
        }).catch(err => {
            executeQuery();
        });
    } else {
        executeQuery();
    }
}
window.handleCustomerCodeLogin = handleCustomerCodeLogin;

function logoutCustomerSession() {
    currentCustomerSession = null;
    window.currentCustomerSession = null;
    try {
        localStorage.removeItem('mvc_customer_session');
        localStorage.removeItem('mvc_customer_code');
    } catch (e) { }
    window.location.reload();
}
window.logoutCustomerSession = logoutCustomerSession;

function applyCustomerModeUI() {
    if (!currentCustomerSession) return;

    const overlay = document.getElementById('auth-overlay');
    const appWrapper = document.getElementById('app-wrapper');
    const companyOverlay = document.getElementById('company-selection-overlay');
    const unassignedOverlay = document.getElementById('unassigned-company-overlay');

    if (overlay) overlay.style.display = 'none';
    if (companyOverlay) companyOverlay.style.display = 'none';
    if (unassignedOverlay) unassignedOverlay.style.display = 'none';
    if (appWrapper) appWrapper.style.display = 'block';

    const appHeader = document.getElementById('app-header');
    if (appHeader) appHeader.style.display = 'flex';

    // Hide top department tab navigation bar completely for customer so no other sections are visible!
    const deptTabsContainer = document.getElementById('department-tabs-container');
    if (deptTabsContainer) deptTabsContainer.style.display = 'none';

    // Hide month selector bar & stock alert banners
    const monthBar = document.querySelector('.month-bar');
    if (monthBar) monthBar.style.display = 'none';

    const globalAlerts = document.getElementById('global-stock-alerts');
    if (globalAlerts) globalAlerts.style.display = 'none';

    const workerTimerBanner = document.getElementById('worker-task-timer-banner');
    if (workerTimerBanner) workerTimerBanner.style.display = 'none';

    const driverTimerBanner = document.getElementById('driver-order-timer-banner');
    if (driverTimerBanner) driverTimerBanner.style.display = 'none';

    // Hide mobile navigation bars / sheets
    const mobCompactBar = document.querySelector('.mob-compact-bar');
    if (mobCompactBar) mobCompactBar.style.display = 'none';

    const mobQuickBar = document.getElementById('mobile-quick-bar');
    if (mobQuickBar) mobQuickBar.style.display = 'none';

    const companySwapBtn = document.getElementById('company-swap-btn');
    if (companySwapBtn) companySwapBtn.style.display = 'none';

    const companySwapBtnMob = document.getElementById('company-swap-btn-mob');
    if (companySwapBtnMob) companySwapBtnMob.style.display = 'none';

    // Hide Reorder Tabs button for customer view
    const tabReorderBtn = document.getElementById('tab-reorder-btn');
    if (tabReorderBtn) tabReorderBtn.style.display = 'none';

    // Unlock Market Tab
    const marketTabBtn = document.getElementById('tab-market');
    if (marketTabBtn) {
        marketTabBtn.classList.remove('tab-locked');
    }

    // Hide standard navbar tabs except Market
    document.querySelectorAll('.nav-tabs .tab-btn').forEach(btn => {
        if (btn.id === 'tab-market') {
            btn.style.display = 'inline-flex';
            btn.classList.remove('tab-locked');
        } else {
            btn.style.display = 'none';
        }
    });

    // Hide mobile sheet tab buttons except Market
    document.querySelectorAll('#mobile-tabs-sheet .mob-sheet-tab').forEach(btn => {
        if (btn.getAttribute('onclick')?.includes("'market'")) {
            btn.style.display = 'flex';
        } else {
            btn.style.display = 'none';
        }
    });

    // Hide admin elements & cards
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    const adminProdCard = document.getElementById('admin-add-market-product-card');
    if (adminProdCard) adminProdCard.style.display = 'none';

    // Update Header Profile Badge with Customer name
    const customerBadgeHtml = `👤 <strong>${currentCustomerSession.name || 'Customer'}</strong>`;

    const emailDisplay = document.getElementById('user-email-display');
    if (emailDisplay) emailDisplay.innerHTML = customerBadgeHtml;

    const displayUserEmail = document.getElementById('display-user-email');
    if (displayUserEmail) displayUserEmail.innerHTML = customerBadgeHtml;

    const displayUserRole = document.getElementById('display-user-role');
    if (displayUserRole) {
        displayUserRole.style.display = 'none';
    }

    // Update Header Logo & Title for Customer View
    const headerLogo = document.getElementById('header-logo');
    if (headerLogo) {
        headerLogo.src = 'mvc.png';
        headerLogo.style.display = 'inline-block';
    }

    const headerTitle = document.getElementById('header-title');
    if (headerTitle) {
        headerTitle.textContent = (currentAppLang === 'ar') ? 'سوق عملاء MVC' : 'MVC Customer Market';
    }

    // Ensure company target matches customer session
    if (currentCustomerSession.company) {
        currentCompany = currentCustomerSession.company;
    }

    // Fetch and listen to market data & market orders across ALL companies
    if (typeof db !== 'undefined') {
        const companyList = ['mvc', 'mvcfresh', 'burgeroov'];
        companyList.forEach(cKey => {
            db.ref(`companies/${cKey}/marketProducts`).on('value', snapshot => {
                if (!appData[cKey]) appData[cKey] = {};
                appData[cKey].marketProducts = snapshot.val() || {};
                renderMarket();
            });
            db.ref(`companies/${cKey}/marketOrders`).on('value', snapshot => {
                if (!appData[cKey]) appData[cKey] = {};
                appData[cKey].marketOrders = snapshot.val() || {};
                renderAdminMarketOrders();
                renderCustomerOrders();
                renderPrepareSection();
            });
        });
    }

    switchTab('market');
    renderMarket();
}
window.applyCustomerModeUI = applyCustomerModeUI;

function createCustomerCode() {
    const isAr = currentAppLang === 'ar';
    const nameInput = document.getElementById('admin-customer-name-input');
    const coinsInput = document.getElementById('admin-customer-coins-input');

    if (!nameInput) return;
    const name = nameInput.value.trim();
    const coins = parseFloat(coinsInput?.value || 1000);

    if (!name) {
        alert(isAr ? 'الرجاء إدخال اسم العميل.' : 'Please enter customer name.');
        return;
    }

    let code = Math.floor(100000 + Math.random() * 900000).toString();
    const data = getCompanyData();
    const customersMap = data.customers || {};
    while (customersMap[code]) {
        code = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const customerObj = {
        id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        code: code,
        name: name,
        coins: isNaN(coins) ? 1000 : coins,
        company: currentCompany,
        createdAt: Date.now()
    };

    const updates = {};
    updates[`publicCustomerCodes/${code}`] = customerObj;
    updates[`customerCodes/${code}`] = customerObj;
    updates[`customers/${code}`] = customerObj;
    ['mvc', 'mvcfresh', 'burgeroov'].forEach(c => {
        updates[`companies/${c}/customers/${code}`] = customerObj;
    });

    if (!appData[currentCompany]) appData[currentCompany] = {};
    if (!appData[currentCompany].customers) appData[currentCompany].customers = {};
    appData[currentCompany].customers[code] = customerObj;

    if (!window.localCustomerRegistry) window.localCustomerRegistry = {};
    window.localCustomerRegistry[code] = customerObj;
    try {
        localStorage.setItem('mvc_global_customer_registry', JSON.stringify(window.localCustomerRegistry));
    } catch (e) { }

    db.ref().update(updates).then(() => {
        nameInput.value = '';
        if (coinsInput) coinsInput.value = '1000';
        alert(isAr
            ? `🎉 تم إنشاء حساب العميل بنجاح!\nالاسم: ${name}\nرمز الدخول الخاص به: ${code}`
            : `🎉 Customer code generated successfully!\nName: ${name}\nAccess Code: ${code}`);
        renderMarket();
        renderAdminCustomersList();
    }).catch(err => {
        console.error("Error creating customer code:", err);
        alert(isAr ? 'حدث خطأ أثناء إنشاء كود العميل.' : 'Error generating customer code.');
    });
}
window.createCustomerCode = createCustomerCode;

function renderAdminCustomersList() {
    const listContainer = document.getElementById('admin-customers-list');
    if (!listContainer) return;

    const isAr = currentAppLang === 'ar';
    const data = getCompanyData();
    let customersMap = {};

    ['mvc', 'mvcfresh', 'burgeroov'].forEach(cKey => {
        if (appData[cKey] && appData[cKey].customers) {
            Object.assign(customersMap, appData[cKey].customers);
        }
    });

    if (window.localCustomerRegistry) {
        Object.assign(customersMap, window.localCustomerRegistry);
    }
    if (data.customers) {
        Object.assign(customersMap, data.customers);
    }

    const customers = Object.entries(customersMap).map(([codeKey, custObj]) => {
        const cleanCode = (custObj && (custObj.code || custObj.accessCode || custObj.id)) ? String(custObj.code || custObj.accessCode || custObj.id).trim() : String(codeKey).trim();
        return {
            ...(custObj || {}),
            code: cleanCode
        };
    }).filter(c => c && c.code && c.code !== 'undefined' && c.code !== 'null');

    if (customers.length === 0) {
        if (typeof db !== 'undefined' && !window.hasFetchedAdminCustomers) {
            window.hasFetchedAdminCustomers = true;
            db.ref('publicCustomerCodes').once('value').then(snap => {
                if (snap.exists()) {
                    if (!appData[currentCompany]) appData[currentCompany] = {};
                    appData[currentCompany].customers = snap.val();
                    renderAdminCustomersList();
                }
            }).catch(() => null);
        }

        listContainer.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 12px 0;">
                ${isAr ? 'لا يوجد عملاء مسجلون حالياً.' : 'No registered customers yet.'}
            </div>
        `;
        return;
    }

    listContainer.innerHTML = customers.map(cust => `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; background: var(--input-bg); border-radius: 10px; border: 1px solid var(--border-color); margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <span style="font-family: monospace; font-weight: 900; background: rgba(59,130,246,0.15); color: #3b82f6; border: 1px solid #3b82f6; padding: 3px 8px; border-radius: 6px; font-size: 0.9rem;">
                    🔑 ${cust.code}
                </span>
                <div>
                    <div style="font-weight: 800; font-size: 0.9rem; color: var(--text-main);">${sanitizeMarketText(cust.name || 'Customer')}</div>
                    <div style="font-size: 0.78rem; color: #10b981; font-weight: 700;">💵 ${(cust.coins || 0).toLocaleString()} SR</div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
                <button type="button" onclick="addCustomerCoins('${cust.code}', 100)" class="btn-outline" style="padding: 4px 8px; font-size: 0.75rem; font-weight: 800; border-radius: 6px;">+100 SR 💵</button>
                <button type="button" onclick="addCustomerCoins('${cust.code}', 500)" class="btn-outline" style="padding: 4px 8px; font-size: 0.75rem; font-weight: 800; border-radius: 6px;">+500 SR 💵</button>
                <button type="button" onclick="deleteCustomerCode('${cust.code}')" style="border: none; background: transparent; color: #ef4444; cursor: pointer; font-size: 0.95rem; padding: 4px;" title="Delete Customer">🗑️</button>
            </div>
        </div>
    `).join('');
}
window.renderAdminCustomersList = renderAdminCustomersList;

function addCustomerCoins(code, amount) {
    const isAr = currentAppLang === 'ar';
    const cleanCode = String(code).trim();
    const data = getCompanyData();
    let cust = (data.customers || {})[cleanCode];

    if (!cust && typeof appData !== 'undefined') {
        ['mvc', 'mvcfresh', 'burgeroov'].forEach(cKey => {
            if (!cust && appData[cKey] && appData[cKey].customers && appData[cKey].customers[cleanCode]) {
                cust = appData[cKey].customers[cleanCode];
            }
        });
    }

    const currentCoins = parseFloat((cust && cust.coins) || 0);
    const newCoins = currentCoins + amount;

    if (cust) cust.coins = newCoins;

    const updates = {};
    updates[`publicCustomerCodes/${cleanCode}/coins`] = newCoins;
    updates[`customerCodes/${cleanCode}/coins`] = newCoins;
    updates[`customers/${cleanCode}/coins`] = newCoins;
    ['mvc', 'mvcfresh', 'burgeroov'].forEach(c => {
        updates[`companies/${c}/customers/${cleanCode}/coins`] = newCoins;
    });

    db.ref().update(updates).then(() => {
        renderMarket();
        renderAdminCustomersList();
    }).catch(err => console.error("Error adding customer coins:", err));
}
window.addCustomerCoins = addCustomerCoins;

function deleteCustomerCode(code) {
    const isAr = currentAppLang === 'ar';
    const cleanCode = String(code).trim();
    if (!cleanCode || cleanCode === 'undefined' || cleanCode === 'null') {
        alert(isAr ? 'كود العميل غير صالح للحذف.' : 'Invalid customer code to delete.');
        return;
    }
    if (!confirm(isAr ? `هل أنت تأكد من حذف العميل صاحب الكود (${cleanCode})؟` : `Are you sure you want to delete customer (${cleanCode})?`)) return;

    const updates = {};
    updates[`publicCustomerCodes/${cleanCode}`] = null;
    updates[`customerCodes/${cleanCode}`] = null;
    updates[`customers/${cleanCode}`] = null;
    ['mvc', 'mvcfresh', 'burgeroov'].forEach(c => {
        updates[`companies/${c}/customers/${cleanCode}`] = null;
    });

    ['mvc', 'mvcfresh', 'burgeroov'].forEach(cKey => {
        if (appData[cKey] && appData[cKey].customers) {
            delete appData[cKey].customers[cleanCode];
        }
    });
    if (window.localCustomerRegistry) {
        delete window.localCustomerRegistry[cleanCode];
    }
    if (window.globalCustomerCodes) {
        delete window.globalCustomerCodes[cleanCode];
    }

    db.ref().update(updates).then(() => {
        renderMarket();
        renderAdminCustomersList();
    }).catch(err => console.error("Error deleting customer code:", err));
}
window.deleteCustomerCode = deleteCustomerCode;

function togglePreparingWorkerAssignment(workerId) {
    const isAr = currentAppLang === 'ar';
    const isAdmin = document.body.classList.contains('role-admin');
    if (!isAdmin) {
        alert(isAr 
            ? '⛔ ليس لديك صلاحية إسناد أو إزالة طاقم التحضير. فقط المدير يمكنه ذلك!' 
            : '⛔ You do not have permission to assign or remove preparing staff. Only Managers can edit staff.');
        return;
    }
    if (!workerId || typeof db === 'undefined' || typeof currentCompany === 'undefined') return;

    const companyData = getCompanyData();
    let assigned = companyData.assignedPreparingWorkerIds || [];

    // Support legacy single string assignedPreparingWorkerId if migrating
    if (!Array.isArray(assigned)) {
        assigned = companyData.assignedPreparingWorkerId ? [String(companyData.assignedPreparingWorkerId)] : [];
    }

    const wIdStr = String(workerId);
    if (assigned.includes(wIdStr)) {
        assigned = assigned.filter(id => String(id) !== wIdStr);
    } else {
        assigned.push(wIdStr);
    }

    db.ref(`companies/${currentCompany}/assignedPreparingWorkerIds`).set(assigned)
        .then(() => {
            db.ref(`companies/${currentCompany}/assignedPreparingWorkerId`).set(assigned[0] || null);
            renderPrepareSection();
        })
        .catch(err => console.error("Error updating preparing workers:", err));
}
window.togglePreparingWorkerAssignment = togglePreparingWorkerAssignment;
window.assignPreparingWorker = togglePreparingWorkerAssignment;

function deletePrepareOrderAndRefund(companyKey, orderId) {
    const isAr = currentAppLang === 'ar';
    const canDelete = document.body.classList.contains('role-admin');

    if (!canDelete) {
        alert(isAr 
            ? '⛔ ليس لديك صلاحية حذف الطلبات وإعادة الرصيد. فقط المدير يمكنه ذلك!' 
            : '⛔ You do not have permission to delete orders and refund SR balance. Only Managers can delete orders.');
        return;
    }

    const found = findMarketOrderById(orderId);
    const order = found.order;
    const targetComp = companyKey || found.companyKey || currentCompany;

    if (!order) {
        alert(isAr ? 'الطلب غير موجود.' : 'Order not found.');
        return;
    }

    const orderNum = formatMarketOrderNum(order);
    if (!confirm(isAr 
        ? `هل أنت تأكد من حذف الطلب #${orderNum} نهائياً وإعادة مبلغ (SAR ${order.totalCost || 0}) لحساب الزبون؟` 
        : `Are you sure you want to permanently delete order #${orderNum} and refund SAR ${order.totalCost || 0} to customer balance?`)) {
        return;
    }

    const totalCost = parseFloat(order.totalCost) || 0;
    const custCode = String(order.customerCode || order.workerId || '').trim();
    const customerName = order.workerName || order.customerName || 'Customer';
    const actorLabel = (typeof currentUser !== 'undefined' && currentUser && (currentUser.name || currentUser.email)) ? (currentUser.name || currentUser.email) : 'Operations Manager';

    const updates = {};
    updates[`companies/${targetComp}/marketOrders/${orderId}`] = null;

    if (totalCost > 0 && custCode) {
        let currentCoins = 0;
        if (window.localCustomerRegistry && window.localCustomerRegistry[custCode] && typeof window.localCustomerRegistry[custCode].coins !== 'undefined') {
            currentCoins = parseFloat(window.localCustomerRegistry[custCode].coins) || 0;
        }
        const newCoins = currentCoins + totalCost;
        updates[`publicCustomerCodes/${custCode}/coins`] = newCoins;
        updates[`customerCodes/${custCode}/coins`] = newCoins;
        updates[`companies/${targetComp}/customers/${custCode}/coins`] = newCoins;
    }

    // Log event in Activity Log
    const actId = 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const logObj = {
        id: actId,
        type: 'warehouse_delete',
        actorName: actorLabel,
        details: `🗑️ Order #${orderNum} (${customerName}) deleted by ${actorLabel}. SAR ${totalCost} refunded to customer wallet.`,
        timestamp: Date.now()
    };
    updates[`companies/${targetComp}/activityLogs/${actId}`] = logObj;

    db.ref().update(updates).then(() => {
        ['mvc', 'mvcfresh', 'burgeroov'].forEach(cKey => {
            if (appData[cKey] && appData[cKey].marketOrders) {
                delete appData[cKey].marketOrders[orderId];
            }
        });
        renderPrepareSection();
        renderActivityLog();
        if (typeof showInAppNotification === 'function') {
            showInAppNotification(isAr 
                ? `🗑️ تم حذف الطلب وإعادة (SAR ${totalCost}) لحساب ${customerName} وتسجيل العملية بالسجل بنجاح!` 
                : `🗑️ Order deleted, SAR ${totalCost} refunded to ${customerName}, and logged in Activity Log successfully!`);
        }
    }).catch(err => {
        console.error("Error deleting prepare order:", err);
        alert(isAr ? 'حدث خطأ أثناء حذف الطلب.' : 'Error deleting prepare order.');
    });
}
window.deletePrepareOrderAndRefund = deletePrepareOrderAndRefund;


// --- AUTOMATIC IN-SCOPE WINDOW EXPORTS ---
if (typeof getCurrentWorkerId === 'function') window.getCurrentWorkerId = getCurrentWorkerId;
if (typeof getUserCoins === 'function') window.getUserCoins = getUserCoins;
if (typeof renderMarketCartItems === 'function') window.renderMarketCartItems = renderMarketCartItems;
if (typeof closeCustomerManagementModal === 'function') window.closeCustomerManagementModal = closeCustomerManagementModal;
if (typeof processCustomerLogin === 'function') window.processCustomerLogin = processCustomerLogin;


function isMarketAdmin() {
    if (typeof currentCustomerSession !== 'undefined' && currentCustomerSession) return false;
    if (typeof currentUser === 'undefined' || !currentUser) {
        if (typeof document !== 'undefined' && document.body && document.body.classList.contains('role-admin')) return true;
        return false;
    }
    const role = (currentUser.role || '').toLowerCase();
    const isRoleAdmin = role === 'admin' || role === 'manager' || role === 'superadmin' || currentUser.isAdmin === true || currentUser.isManager === true;
    const hasBodyClass = document.body && (document.body.classList.contains('role-admin') || document.body.classList.contains('perm-market') || document.body.classList.contains('admin-only'));
    const hasPerm = currentUser.perms && (currentUser.perms.market === true || currentUser.perms.market === 'true' || currentUser.perms.admin === true);
    return isRoleAdmin || hasBodyClass || hasPerm;
}
window.isMarketAdmin = isMarketAdmin;



// =====================================================================
// RESILIENT FIREBASE MARKET PERSISTENCE HELPER (PRIMARY + BACKGROUND SYNC)
// =====================================================================
function saveMarketProductToFirebase(productId, dataObjOrNull) {
    if (typeof db === 'undefined' || !productId) return Promise.resolve();

    const isDelete = (dataObjOrNull === null);
    const primaryComp = currentCompany || 'mvc';
    const targetPath = `companies/${primaryComp}/marketProducts/${productId}`;

    const primaryPromise = isDelete
        ? db.ref(targetPath).remove()
        : db.ref(targetPath).set(dataObjOrNull);

    return primaryPromise.then(() => {
        const secondaryUpdates = {};
        if (isDelete) {
            secondaryUpdates[`marketProducts/${productId}`] = null;
            ['mvc', 'mvcfresh', 'burgeroov'].forEach(c => {
                if (c !== primaryComp) secondaryUpdates[`companies/${c}/marketProducts/${productId}`] = null;
            });
        } else {
            secondaryUpdates[`marketProducts/${productId}`] = dataObjOrNull;
            ['mvc', 'mvcfresh', 'burgeroov'].forEach(c => {
                if (c !== primaryComp) secondaryUpdates[`companies/${c}/marketProducts/${productId}`] = dataObjOrNull;
            });
        }

        db.ref().update(secondaryUpdates).catch(err => {
            console.log("Secondary market sync notice (handled gracefully):", err.message);
        });
    });
}
window.saveMarketProductToFirebase = saveMarketProductToFirebase;

