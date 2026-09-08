/**
 * ============================================================
 * VICard (Very Important Card) NFC Business Ecosystem Module
 * Real-time NFC Loyalty, Partner Offers & Cashier Verification
 * ============================================================
 */

var vicardData = {
    cards: {},
    restaurants: {},
    bannerConfig: null,
    tiers: null
};

var currentVicardSubTab = 'manager'; // 'manager' | 'customer'
var activeWebsiteRestId = null;      // null = show all restaurants, string = show restaurant menu
var vicardSearchQuery = '';
var vicardActiveCategory = 'all';    // 'all' | 'burgers' | 'fresh' | 'meats' | 'deals'
var _hasVicardListeners = false;
var _vicardRedeemTimerInterval = null;
var _vicardDataLoaded = false;
var _activeVicardSession = null;
var _pendingVicardAccess = null;

// --- PRE-SEEDED PARTNER RESTAURANTS (AVAILABLE IMMEDIATELY AT LOAD) ---
function getDefaultVicardRestaurants() {
    return {
        'rest_burgeroov': {
            id: 'rest_burgeroov',
            name: 'Burgeroov',
            category: 'Gourmet Smash Burgers & Shakes',
            logo: 'burgeroov.png',
            cover: 'burgeroov_cover.jpg',
            location: 'Riyadh - Olaya St',
            rating: '4.9',
            reviews: '420+',
            distance: '1.2 km',
            active: true,
            cashierPin: '1234',
            units: [
                {
                    id: 'unit_b1',
                    name: 'Double Truffle Smash Burger Combo',
                    image: 'burgeroov_cover.jpg',
                    originalPrice: 58,
                    offerPrice: 42,
                    discount: '28% OFF',
                    description: 'Two Angus smash patties, black truffle aioli, aged cheddar, seasoned parmesan fries & drink.'
                },
                {
                    id: 'unit_b2',
                    name: 'Crispy Chicken Supreme Meal',
                    image: 'burgeroov_cover.jpg',
                    originalPrice: 49,
                    offerPrice: 35,
                    discount: '29% OFF',
                    description: 'Golden fried crispy chicken breast, garlic ranch, dill pickles, potato bun, fries & drink.'
                },
                {
                    id: 'unit_b3',
                    name: 'Gourmet Belgian Chocolate Shake',
                    image: 'burgeroov.png',
                    originalPrice: 26,
                    offerPrice: 15,
                    discount: '42% OFF',
                    description: 'Hand-spun rich Belgian chocolate milkshake with fresh whipped cream and chocolate drizzle.'
                }
            ],
            createdAt: Date.now()
        },
        'rest_mvcfresh': {
            id: 'rest_mvcfresh',
            name: 'MVC Fresh',
            category: 'Organic Fruits & Fresh Cold-Pressed Juices',
            logo: 'mvcfresh.png',
            cover: 'mvcfresh_cover.jpg',
            location: 'Riyadh - King Fahd Rd',
            rating: '4.8',
            reviews: '310+',
            distance: '2.5 km',
            active: true,
            cashierPin: '2345',
            units: [
                {
                    id: 'unit_f1',
                    name: 'Exotic Tropical Fruit Basket (Large)',
                    image: 'mvcfresh_cover.jpg',
                    originalPrice: 140,
                    offerPrice: 99,
                    discount: '30% OFF',
                    description: 'Dragon fruit, sweet mango, passion fruit, fresh raspberries, and organic ripe pineapple.'
                },
                {
                    id: 'unit_f2',
                    name: 'Cold-Pressed Daily Detox Pack (6 Bottles)',
                    image: 'mvcfresh_cover.jpg',
                    originalPrice: 95,
                    offerPrice: 69,
                    discount: '27% OFF',
                    description: 'Six bottles of organic green cold-pressed juice with celery, green apple, cucumber & lemon.'
                }
            ],
            createdAt: Date.now()
        },
        'rest_mvcmeat': {
            id: 'rest_mvcmeat',
            name: 'MVC Meat Market',
            category: 'Prime Butchery & Premium Steaks',
            logo: 'mvc.png',
            cover: 'mvcmeat_cover.jpg',
            location: 'Riyadh - Al Yasmin',
            rating: '5.0',
            reviews: '180+',
            distance: '3.8 km',
            active: true,
            cashierPin: '3456',
            units: [
                {
                    id: 'unit_m1',
                    name: 'Black Angus Ribeye Steak (400g)',
                    image: 'mvcmeat_cover.jpg',
                    originalPrice: 165,
                    offerPrice: 120,
                    discount: '27% OFF',
                    description: 'Grain-fed prime Angus ribeye, marbled cut, packaged with herb butter & steak rub.'
                },
                {
                    id: 'unit_m2',
                    name: 'Family BBQ Feast Box (5kg)',
                    image: 'mvcmeat_cover.jpg',
                    originalPrice: 350,
                    offerPrice: 260,
                    discount: '26% OFF',
                    description: 'Marinated lamb chops, gourmet beef burger patties, and seasoned kofta skewers ready for grilling.'
                }
            ],
            createdAt: Date.now()
        }
    };
}
window.getDefaultVicardRestaurants = getDefaultVicardRestaurants;

function loadVicardLocalCache() {
    try {
        if (typeof localStorage !== 'undefined') {
            const cached = localStorage.getItem('vicard_network_cache');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed && typeof parsed === 'object') {
                    if (parsed.cards && Object.keys(parsed.cards).length > 0) vicardData.cards = parsed.cards;
                    if (parsed.restaurants && Object.keys(parsed.restaurants).length > 0) vicardData.restaurants = parsed.restaurants;
                    if (parsed.bannerConfig) vicardData.bannerConfig = parsed.bannerConfig;
                    if (parsed.tiers) vicardData.tiers = parsed.tiers;
                }
            }
        }
    } catch (e) {}

    // Guarantee default restaurants are available immediately
    if (!vicardData.restaurants || Object.keys(vicardData.restaurants).length === 0) {
        vicardData.restaurants = getDefaultVicardRestaurants();
    }
}
loadVicardLocalCache();

function saveVicardLocalCache() {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('vicard_network_cache', JSON.stringify({
                cards: vicardData.cards,
                restaurants: vicardData.restaurants,
                bannerConfig: vicardData.bannerConfig,
                tiers: vicardData.tiers
            }));
        }
    } catch (e) {}
}

// --- CRYPTOGRAPHIC SECRET KEY GENERATOR (PREVENTS URL ENUMERATION) ---
function generateVicardSecretKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        const bytes = new Uint8Array(24);
        window.crypto.getRandomValues(bytes);
        return Array.from(bytes, b => chars[b % chars.length]).join('');
    }
    let key = '';
    for (let i = 0; i < 24; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}
window.generateVicardSecretKey = generateVicardSecretKey;

// --- INITIALIZATION & FIREBASE REAL-TIME SYNC ---
function initVicardSystem() {
    loadVicardLocalCache();
    if (typeof db === 'undefined' || !db) {
        _vicardDataLoaded = true;
        return;
    }
    if (_hasVicardListeners) return;
    _hasVicardListeners = true;

    // Fast-track safety timeout: never block customers if Firebase is slow or permission denied
    setTimeout(() => {
        if (!_vicardDataLoaded) {
            _vicardDataLoaded = true;
            updateActiveVicardOverlays();
        }
    }, 500);

    // 1. One-time cleanup of any legacy testing/mock customer cards (non-blocking)
    try {
        db.ref('vicard_network/cards').once('value').then(snap => {
            const val = snap.val() || {};
            Object.keys(val).forEach(cid => {
                const c = val[cid];
                if (cid === 'VIC-1001' || (c && c.name && (c.name.includes('Sample') || c.name.includes('Test')))) {
                    db.ref(`vicard_network/cards/${cid}`).remove().catch(() => {});
                }
            });
        }).catch(() => {});
    } catch (e) {}

    // 2. Real-time listener for the entire VICard Network
    db.ref('vicard_network').on('value', snapshot => {
        const val = snapshot.val() || {};
        vicardData.cards = val.cards || vicardData.cards || {};
        if (val.restaurants && Object.keys(val.restaurants).length > 0) {
            vicardData.restaurants = val.restaurants;
        } else if (!vicardData.restaurants || Object.keys(vicardData.restaurants).length === 0) {
            vicardData.restaurants = getDefaultVicardRestaurants();
        }
        vicardData.bannerConfig = val.bannerConfig || vicardData.bannerConfig || null;
        vicardData.tiers = val.tiers || vicardData.tiers || null;
        _vicardDataLoaded = true;

        // Auto-migrate any cards without secretKey to guarantee encrypted access
        Object.keys(vicardData.cards || {}).forEach(cid => {
            const c = vicardData.cards[cid];
            if (c && !c.secretKey) {
                const generatedKey = generateVicardSecretKey();
                c.secretKey = generatedKey;
                try { db.ref(`vicard_network/cards/${cid}/secretKey`).set(generatedKey).catch(() => {}); } catch(e) {}
            }
        });

        // Remove any test cards locally if still present
        Object.keys(vicardData.cards || {}).forEach(cid => {
            const c = vicardData.cards[cid];
            if (cid === 'VIC-1001' || (c && c.name && (c.name.includes('Sample') || c.name.includes('Test')))) {
                delete vicardData.cards[cid];
            }
        });

        // ONLY seed once if the entire vicard_network node has never been initialized or seeded
        if (val.seeded !== true && (!val.restaurants || Object.keys(val.restaurants).length === 0)) {
            seedDefaultVicardRestaurants();
        }

        saveVicardLocalCache();

        // Re-render Manager View if currently on NFC tab
        if (typeof currentTab !== 'undefined' && currentTab === 'nfc') {
            if (currentVicardSubTab === 'customer') {
                renderCustomerWebsite();
            } else {
                renderNfcSection();
            }
        }

        // Populate Tiers Select in Manager View
        populateVicardTierSelects();

        // Update active overlays if opened
        updateActiveVicardOverlays();
    }, error => {
        console.warn('VICard Firebase sync notice (using local/offline mode):', error);
        _vicardDataLoaded = true;
        updateActiveVicardOverlays();
    });
}
window.initVicardSystem = initVicardSystem;

// Seed initial partner restaurants with high-quality units and images
function seedDefaultVicardRestaurants() {
    const defaults = {
        'rest_burgeroov': {
            id: 'rest_burgeroov',
            name: 'Burgeroov',
            category: 'Gourmet Smash Burgers & Shakes',
            logo: 'burgeroov.png',
            cover: 'burgeroov_cover.jpg',
            location: 'Riyadh - Olaya St',
            rating: '4.9',
            reviews: '420+',
            distance: '1.2 km',
            active: true,
            units: [
                {
                    id: 'unit_b1',
                    name: 'Double Truffle Smash Burger Combo',
                    image: 'burgeroov_cover.jpg',
                    originalPrice: 58,
                    offerPrice: 42,
                    discount: '28% OFF',
                    description: 'Two Angus smash patties, black truffle aioli, aged cheddar, seasoned parmesan fries & drink.'
                },
                {
                    id: 'unit_b2',
                    name: 'Crispy Chicken Supreme Meal',
                    image: 'burgeroov_cover.jpg',
                    originalPrice: 49,
                    offerPrice: 35,
                    discount: '29% OFF',
                    description: 'Golden fried crispy chicken breast, garlic ranch, dill pickles, potato bun, fries & drink.'
                },
                {
                    id: 'unit_b3',
                    name: 'Gourmet Belgian Chocolate Shake',
                    image: 'burgeroov.png',
                    originalPrice: 26,
                    offerPrice: 15,
                    discount: '42% OFF',
                    description: 'Hand-spun rich Belgian chocolate milkshake with fresh whipped cream and chocolate drizzle.'
                }
            ],
            createdAt: Date.now()
        },
        'rest_mvcfresh': {
            id: 'rest_mvcfresh',
            name: 'MVC Fresh',
            category: 'Organic Fruits & Fresh Cold-Pressed Juices',
            logo: 'mvcfresh.png',
            cover: 'mvcfresh_cover.jpg',
            location: 'Riyadh - King Fahd Rd',
            rating: '4.8',
            reviews: '310+',
            distance: '2.5 km',
            active: true,
            units: [
                {
                    id: 'unit_f1',
                    name: 'Exotic Tropical Fruit Basket (Large)',
                    image: 'mvcfresh_cover.jpg',
                    originalPrice: 140,
                    offerPrice: 99,
                    discount: '30% OFF',
                    description: 'Dragon fruit, sweet mango, passion fruit, fresh raspberries, and organic ripe pineapple.'
                },
                {
                    id: 'unit_f2',
                    name: 'Cold-Pressed Daily Detox Pack (6 Bottles)',
                    image: 'mvcfresh_cover.jpg',
                    originalPrice: 95,
                    offerPrice: 69,
                    discount: '27% OFF',
                    description: '100% natural cold-pressed fruit & vegetable wellness juices, with zero added sugar.'
                }
            ],
            createdAt: Date.now()
        },
        'rest_mvcmeat': {
            id: 'rest_mvcmeat',
            name: 'MVC Meat Market',
            category: 'Premium Cuts & BBQ Steaks',
            logo: 'mvc.png',
            cover: 'mvcmeat_cover.jpg',
            location: 'Riyadh - Al Yasmin',
            rating: '5.0',
            reviews: '180+',
            distance: '3.8 km',
            active: true,
            units: [
                {
                    id: 'unit_m1',
                    name: 'Black Angus Ribeye Steak (400g)',
                    image: 'mvcmeat_cover.jpg',
                    originalPrice: 165,
                    offerPrice: 120,
                    discount: '27% OFF',
                    description: 'Grain-fed prime Angus ribeye, marbled cut, packaged with herb butter & steak rub.'
                },
                {
                    id: 'unit_m2',
                    name: 'Family BBQ Feast Box (5kg)',
                    image: 'mvcmeat_cover.jpg',
                    originalPrice: 350,
                    offerPrice: 260,
                    discount: '26% OFF',
                    description: 'Marinated lamb chops, gourmet beef burger patties, and seasoned kofta skewers ready for grilling.'
                }
            ],
            createdAt: Date.now()
        }
    };

    db.ref('vicard_network').update({
        seeded: true,
        restaurants: defaults
    }).catch(err => {
        console.warn('VICard initial seed skipped:', err);
    });
}

// --- SUB-VIEW SWITCHER (Manager Hub vs Customer Website) ---
function switchNfcSubTab(tab) {
    currentVicardSubTab = tab;
    const viewMgr = document.getElementById('nfc-subview-manager');
    const viewCust = document.getElementById('nfc-subview-customer');
    const toggleBtn = document.getElementById('nfc-master-view-toggle');
    const btnMgr = document.getElementById('nfc-view-btn-manager');
    const btnCust = document.getElementById('nfc-view-btn-customer');

    if (tab === 'customer') {
        if (viewMgr) viewMgr.style.display = 'none';
        if (viewCust) viewCust.style.display = 'block';
        if (toggleBtn) {
            toggleBtn.innerHTML = '<span>👔</span> Switch to Manager View';
        }
        if (btnMgr && btnCust) {
            btnMgr.style.background = 'transparent';
            btnMgr.style.color = 'var(--text-muted)';
            btnMgr.style.boxShadow = 'none';
            btnCust.style.background = 'var(--card-bg)';
            btnCust.style.color = 'var(--text-main)';
            btnCust.style.boxShadow = '0 1px 4px rgba(0,0,0,0.18)';
        }
        renderCustomerWebsite();
    } else {
        if (viewCust) viewCust.style.display = 'none';
        if (viewMgr) viewMgr.style.display = 'block';
        if (toggleBtn) {
            toggleBtn.innerHTML = '<span>🌐</span> Switch to Customer View';
        }
        if (btnMgr && btnCust) {
            btnCust.style.background = 'transparent';
            btnCust.style.color = 'var(--text-muted)';
            btnCust.style.boxShadow = 'none';
            btnMgr.style.background = 'var(--card-bg)';
            btnMgr.style.color = 'var(--text-main)';
            btnMgr.style.boxShadow = '0 1px 4px rgba(0,0,0,0.18)';
        }
        renderNfcSection();
    }
}
window.switchNfcSubTab = switchNfcSubTab;

function toggleNfcMasterView() {
    if (currentVicardSubTab === 'manager') {
        switchNfcSubTab('customer');
    } else {
        switchNfcSubTab('manager');
    }
}
window.toggleNfcMasterView = toggleNfcMasterView;

// --- MANAGER SECTION RENDERER ---
function renderNfcSection() {
    const cardsList = Object.values(vicardData.cards || {}).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const restsList = Object.values(vicardData.restaurants || {}).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // 1. Update HUD Stats
    const totalCardsEl = document.getElementById('vicard-stat-total');
    const activeCardsEl = document.getElementById('vicard-stat-active');
    const restsCountEl = document.getElementById('vicard-stat-restaurants');
    const offersCountEl = document.getElementById('vicard-stat-offers');

    const totalCards = cardsList.length;
    const activeCards = cardsList.filter(c => c.status === 'active').length;
    const activeRests = restsList.filter(r => r.active !== false).length;
    let totalUnits = 0;
    restsList.forEach(r => {
        if (Array.isArray(r.units)) {
            totalUnits += r.units.length;
        } else if (Array.isArray(r.offers)) {
            totalUnits += r.offers.length;
        }
    });

    if (totalCardsEl) totalCardsEl.textContent = totalCards;
    if (activeCardsEl) activeCardsEl.textContent = activeCards;
    if (restsCountEl) restsCountEl.textContent = activeRests;
    if (offersCountEl) offersCountEl.textContent = totalUnits;

    // 2. Render Partner Restaurants & Units
    renderVicardRestaurants();

    // 3. Render Issued Customer Cards Table
    filterVicardCustomers();

    // 4. Populate Membership Tiers Dropdown
    populateVicardTierSelects();
}
window.renderNfcSection = renderNfcSection;

// --- CARD ISSUANCE & CUSTOMER MANAGEMENT ---
function handleCreateVicard(e) {
    if (e && e.preventDefault) e.preventDefault();

    const nameInput = document.getElementById('vicard-cust-name');
    const phoneInput = document.getElementById('vicard-cust-phone');
    const tierInput = document.getElementById('vicard-cust-tier');

    if (!nameInput) return;
    const name = nameInput.value.trim();
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const tier = tierInput ? tierInput.value : 'Black VIP';

    if (!name) {
        alert('Please enter customer name.');
        nameInput.focus();
        return;
    }

    // Generate unique card ID: VIC-XXXX
    let randomNum = Math.floor(1000 + Math.random() * 9000);
    while (vicardData.cards['VIC-' + randomNum]) {
        randomNum = Math.floor(1000 + Math.random() * 9000);
    }
    const cardId = 'VIC-' + randomNum;
    const secretKey = generateVicardSecretKey();

    const newCard = {
        id: cardId,
        secretKey: secretKey,
        name: name,
        phone: phone || '',
        tier: tier,
        status: 'active', // 'active' | 'deactivated'
        createdAt: Date.now(),
        createdBy: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.email : 'admin',
        visitsCount: 0,
        totalSavings: 0,
        history: []
    };

    // Optimistic local update
    if (!vicardData.cards) vicardData.cards = {};
    vicardData.cards[cardId] = newCard;

    // Reset inputs
    nameInput.value = '';
    if (phoneInput) phoneInput.value = '';

    // Save to Firebase
    db.ref('vicard_network/cards/' + cardId).set(newCard)
        .then(() => {
            if (typeof logActivity === 'function') {
                logActivity('vicard_issue', '', 'System', `Issued new VICard ${cardId} to ${name}`);
            }
            showVicardCreatedModal(newCard);
            renderNfcSection();
        })
        .catch(err => {
            console.error('Error creating VICard:', err);
            alert('Failed to save card: ' + err.message);
        });
}
window.handleCreateVicard = handleCreateVicard;

function toggleVicardStatus(cardId) {
    const card = vicardData.cards[cardId];
    if (!card) return;

    const current = card.status === 'active';
    const nextStatus = current ? 'deactivated' : 'active';
    const confirmMsg = nextStatus === 'active'
        ? `Activate VICard for ${card.name} (${cardId})? Customer will be allowed to use all partner restaurant offers.`
        : `Deactivate / Suspend VICard for ${card.name} (${cardId})? Scanning will show an X mark and block all discounts.`;

    if (!confirm(confirmMsg)) return;

    card.status = nextStatus;
    renderNfcSection();

    db.ref(`vicard_network/cards/${cardId}/status`).set(nextStatus)
        .then(() => {
            if (typeof logActivity === 'function') {
                logActivity('vicard_status', '', 'System', `${nextStatus === 'active' ? 'Activated' : 'Deactivated'} VICard ${cardId} for ${card.name}`);
            }
        })
        .catch(err => {
            console.error('Error toggling status:', err);
            card.status = current ? 'active' : 'deactivated';
            renderNfcSection();
            alert('Failed to update status: ' + err.message);
        });
}
window.toggleVicardStatus = toggleVicardStatus;

function deleteVicardCustomer(cardId) {
    const card = vicardData.cards[cardId];
    if (!card) return;

    if (!confirm(`Are you sure you want to permanently delete VICard ${cardId} for ${card.name}? This card will no longer work.`)) {
        return;
    }

    delete vicardData.cards[cardId];
    renderNfcSection();

    db.ref(`vicard_network/cards/${cardId}`).remove()
        .then(() => {
            if (typeof logActivity === 'function') {
                logActivity('vicard_delete', '', 'System', `Deleted VICard ${cardId}`);
            }
        })
        .catch(err => {
            console.error('Error deleting card:', err);
            alert('Failed to delete card: ' + err.message);
        });
}
window.deleteVicardCustomer = deleteVicardCustomer;

// Filter and render customer cards table
function filterVicardCustomers() {
    const searchInput = document.getElementById('vicard-cust-search');
    const filterSelect = document.getElementById('vicard-cust-filter-status');
    const tableBody = document.getElementById('vicard-customers-table-body');

    if (!tableBody) return;

    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const statusFilter = filterSelect ? filterSelect.value : 'all';

    let cards = Object.values(vicardData.cards || {}).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (query) {
        cards = cards.filter(c => 
            (c.name && c.name.toLowerCase().includes(query)) ||
            (c.id && c.id.toLowerCase().includes(query)) ||
            (c.phone && c.phone.includes(query))
        );
    }

    if (statusFilter !== 'all') {
        cards = cards.filter(c => c.status === statusFilter);
    }

    if (cards.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 48px 16px; color: var(--text-muted);">
                    <div style="font-size: 2.2rem; margin-bottom: 10px;">💳</div>
                    <div style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">No VICards Issued Yet</div>
                    <div style="font-size: 0.85rem;">Use the form on the left to issue your first VICard for a customer.</div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = cards.map(c => {
        const isActive = c.status === 'active';
        const cardUrl = buildVicardUrl(c.id, c.secretKey);

        const statusBadge = isActive
            ? `<span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; background: rgba(46, 213, 115, 0.15); color: #2ed573; border: 1px solid rgba(46, 213, 115, 0.3);"><span style="width: 7px; height: 7px; border-radius: 50%; background: #2ed573; box-shadow: 0 0 8px #2ed573;"></span> Active</span>`
            : `<span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; background: rgba(235, 77, 75, 0.15); color: #eb4d4b; border: 1px solid rgba(235, 77, 75, 0.3);">🔴 Deactivated</span>`;

        const toggleBtn = isActive
            ? `<button type="button" onclick="toggleVicardStatus('${c.id}')" style="padding: 6px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; background: rgba(235, 77, 75, 0.15); color: #eb4d4b; border: 1px solid rgba(235, 77, 75, 0.3); cursor: pointer; transition: all 0.2s;" title="Deactivate Card">⏹️ Deactivate</button>`
            : `<button type="button" onclick="toggleVicardStatus('${c.id}')" style="padding: 6px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; background: rgba(46, 213, 115, 0.15); color: #2ed573; border: 1px solid rgba(46, 213, 115, 0.3); cursor: pointer; transition: all 0.2s;" title="Activate Card">▶️ Activate</button>`;

        const tierObj = Object.values(getVicardTiers()).find(t => t.name === c.tier || t.id === c.tier);
        const tierIcon = tierObj ? tierObj.icon : '🏅';
        const tierRank = getTierRank(c.tier);

        // Tier theme colors for sleek VIP HUD presentation
        let tierColor = '#f5d77f';
        let tierBorder = 'rgba(212,175,55,0.45)';
        let tierBg = 'rgba(212,175,55,0.12)';
        if (tierRank === 1) {
            tierColor = '#e2e8f0';
            tierBorder = 'rgba(192,192,192,0.45)';
            tierBg = 'rgba(192,192,192,0.1)';
        } else if (tierRank === 2) {
            tierColor = '#ffd700';
            tierBorder = 'rgba(255,215,0,0.5)';
            tierBg = 'rgba(255,215,0,0.12)';
        } else if (tierRank === 3) {
            tierColor = '#38bdf8';
            tierBorder = 'rgba(56,189,248,0.5)';
            tierBg = 'rgba(56,189,248,0.12)';
        } else if (tierRank >= 4) {
            tierColor = '#f5d77f';
            tierBorder = 'rgba(212,175,55,0.6)';
            tierBg = 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(10,10,15,0.8) 100%)';
        }

        return `
            <tr style="border-bottom: 1px solid var(--border-color); transition: background 0.15s ease;">
                <td style="padding: 12px; min-width: 175px;">
                    <div class="vicard-hud-cell">
                        <div class="vicard-hud-id-badge">
                            <span class="chip-icon">💳</span>
                            <span>${escapeHtml(c.id)}</span>
                        </div>
                        <div class="vicard-hud-tier-badge" style="border-color: ${tierBorder}; background: ${tierBg};">
                            <span>${tierIcon}</span>
                            <span class="vicard-hud-tier-name" style="color: ${tierColor};">${escapeHtml(c.tier || 'Black VIP')}</span>
                            <span class="vicard-hud-rank-pill" style="color: ${tierColor}; border-color: ${tierBorder};">Rank ${tierRank}</span>
                        </div>
                    </div>
                </td>
                <td style="padding: 12px;">
                    <strong style="color: var(--text-main); font-size: 0.95rem;">${escapeHtml(c.name)}</strong>
                </td>
                <td style="padding: 12px; font-family: monospace; font-size: 0.85rem; color: var(--text-muted);" dir="ltr">
                    ${c.phone || '—'}
                </td>
                <td style="padding: 12px;">
                    ${statusBadge}
                </td>
                <td style="padding: 12px;">
                    <strong style="color: var(--text-main);">${c.visitsCount || 0}</strong> <span style="font-size: 0.75rem; color: var(--text-muted);">visits</span>
                    <div style="font-size: 0.75rem; color: #2ed573; font-weight: 600;">SAR ${c.totalSavings || 0} saved</div>
                </td>
                <td style="padding: 12px; text-align: center;">
                    ${toggleBtn}
                </td>
                <td style="padding: 12px; text-align: right;">
                    <div style="display: inline-flex; gap: 6px;">
                        <button type="button" onclick="openEditVicardCustomerModal('${c.id}')" style="padding: 6px 10px; border-radius: 8px; font-size: 0.8rem; background: rgba(212,175,55,0.2); color: #f5d77f; border: 1px solid rgba(212,175,55,0.4); cursor: pointer; font-weight: 700;" title="Edit Customer & Membership Tier">
                            ✏️ Edit
                        </button>
                        <button type="button" onclick="openVicardCustomerPortal('${c.id}', '${c.secretKey || ''}')" style="padding: 6px 10px; border-radius: 8px; font-size: 0.8rem; background: rgba(212,175,55,0.15); color: #f5d77f; border: 1px solid rgba(212,175,55,0.3); cursor: pointer;" title="Preview Customer Portal">
                            👁️ View
                        </button>
                        <button type="button" onclick="copyVicardUrl('${cardUrl}')" style="padding: 6px 10px; border-radius: 8px; font-size: 0.8rem; background: var(--input-bg); color: var(--text-main); border: 1px solid var(--border-color); cursor: pointer;" title="Copy NFC Link">
                            🔗 Link
                        </button>
                        <button type="button" onclick="showVicardCreatedModal(vicardData.cards['${c.id}'])" style="padding: 6px 10px; border-radius: 8px; font-size: 0.8rem; background: var(--input-bg); color: var(--text-main); border: 1px solid var(--border-color); cursor: pointer;" title="NFC Tools Details">
                            📲 Details
                        </button>
                        <button type="button" onclick="deleteVicardCustomer('${c.id}')" style="padding: 6px 10px; border-radius: 8px; font-size: 0.8rem; background: rgba(235, 77, 75, 0.15); color: #eb4d4b; border: 1px solid rgba(235, 77, 75, 0.3); cursor: pointer;" title="Delete Card">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}
window.filterVicardCustomers = filterVicardCustomers;

// --- EDIT CUSTOMER CARD & MEMBERSHIP TIER ---
function openEditVicardCustomerModal(cardId) {
    const card = vicardData.cards ? vicardData.cards[cardId] : null;
    if (!card) {
        alert('Customer card not found.');
        return;
    }

    const modal = document.getElementById('vicard-edit-customer-modal');
    const idInput = document.getElementById('vicard-edit-cust-id');
    const idDisplay = document.getElementById('vicard-edit-cust-id-display');
    const nameInput = document.getElementById('vicard-edit-cust-name');
    const phoneInput = document.getElementById('vicard-edit-cust-phone');
    const tierSelect = document.getElementById('vicard-edit-cust-tier');
    const statusSelect = document.getElementById('vicard-edit-cust-status');

    if (idInput) idInput.value = card.id;
    if (idDisplay) idDisplay.textContent = `${card.id} — ${card.name}`;
    if (nameInput) nameInput.value = card.name || '';
    if (phoneInput) phoneInput.value = card.phone || '';
    if (statusSelect) statusSelect.value = card.status === 'deactivated' ? 'deactivated' : 'active';

    if (tierSelect) {
        const tiers = Object.values(getVicardTiers()).sort((a, b) => (b.rank || 0) - (a.rank || 0));
        tierSelect.innerHTML = tiers.map(t => `
            <option value="${escapeHtml(t.name)}" ${(card.tier === t.name || card.tier === t.id) ? 'selected' : ''}>
                ${t.icon || '🏅'} ${escapeHtml(t.name)} (Rank ${t.rank || 1} • SAR ${t.minSpend || 0}+)
            </option>
        `).join('');
    }

    if (modal) modal.style.display = 'flex';
}
window.openEditVicardCustomerModal = openEditVicardCustomerModal;

function closeEditVicardCustomerModal() {
    const modal = document.getElementById('vicard-edit-customer-modal');
    if (modal) modal.style.display = 'none';
}
window.closeEditVicardCustomerModal = closeEditVicardCustomerModal;

function handleSaveEditVicardCustomer(e) {
    if (e && e.preventDefault) e.preventDefault();

    const idInput = document.getElementById('vicard-edit-cust-id');
    const nameInput = document.getElementById('vicard-edit-cust-name');
    const phoneInput = document.getElementById('vicard-edit-cust-phone');
    const tierSelect = document.getElementById('vicard-edit-cust-tier');
    const statusSelect = document.getElementById('vicard-edit-cust-status');

    if (!idInput) return;
    const cardId = idInput.value.trim();
    const card = vicardData.cards ? vicardData.cards[cardId] : null;
    if (!card) return;

    const newName = nameInput ? nameInput.value.trim() : card.name;
    const newPhone = phoneInput ? phoneInput.value.trim() : card.phone;
    const newTier = tierSelect ? tierSelect.value.trim() : card.tier;
    const newStatus = statusSelect ? statusSelect.value : card.status;

    if (!newName) {
        alert('Please enter the customer name.');
        return;
    }

    card.name = newName;
    card.phone = newPhone;
    card.tier = newTier;
    card.status = newStatus;
    card.updatedAt = Date.now();

    const updateData = {
        name: card.name,
        phone: card.phone,
        tier: card.tier,
        status: card.status,
        updatedAt: card.updatedAt
    };

    if (typeof db !== 'undefined' && db) {
        db.ref(`vicard_network/cards/${cardId}`).update(updateData).catch(console.error);
    }

    closeEditVicardCustomerModal();
    filterVicardCustomers();
    if (currentVicardSubTab === 'customer') renderCustomerWebsite();
    if (window._currentActiveCustomerCard && window._currentActiveCustomerCard.id === cardId) {
        window._currentActiveCustomerCard = card;
        renderAuthorizedCustomerPortal(card);
    }

    if (typeof showToast === 'function') {
        showToast(`Updated customer ${card.name} (${card.id}) — Tier: ${card.tier}`);
    } else {
        alert(`✅ Successfully updated ${card.name}!\nAssigned Tier: ${card.tier}`);
    }
}
window.handleSaveEditVicardCustomer = handleSaveEditVicardCustomer;

// Modal showing created card details & NFC Tools instructions
function showVicardCreatedModal(card) {
    if (!card) return;
    const directUrl = buildVicardUrl(card.id, card.secretKey);
    const modal = document.getElementById('vicard-created-modal');
    if (!modal) return;

    const nameEl = document.getElementById('vicard-modal-created-name');
    const idEl = document.getElementById('vicard-modal-created-id');
    const urlInput = document.getElementById('vicard-modal-created-url');

    if (nameEl) nameEl.textContent = card.name;
    if (idEl) idEl.textContent = card.id;
    if (urlInput) urlInput.value = directUrl;

    modal.style.display = 'flex';
}
window.showVicardCreatedModal = showVicardCreatedModal;

function closeVicardCreatedModal() {
    const modal = document.getElementById('vicard-created-modal');
    if (modal) modal.style.display = 'none';
}
window.closeVicardCreatedModal = closeVicardCreatedModal;

function copyVicardModalUrl() {
    const input = document.getElementById('vicard-modal-created-url');
    if (!input || !input.value) return;
    copyVicardUrl(input.value);
}
window.copyVicardModalUrl = copyVicardModalUrl;

function copyVicardUrl(url) {
    if (!url) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            alert('📋 NFC URL copied to clipboard! Paste it into the NFC Tools app under Write > Custom URL.');
        }).catch(() => {
            prompt('Copy this NFC URL:', url);
        });
    } else {
        prompt('Copy this NFC URL:', url);
    }
}
window.copyVicardUrl = copyVicardUrl;

function buildVicardUrl(cardId, secretKey) {
    const origin = window.location.origin || (window.location.protocol + '//' + window.location.host);
    const path = window.location.pathname || '';
    let url = `${origin}${path}?vicard=${encodeURIComponent(cardId)}`;
    if (secretKey) {
        url += `&key=${encodeURIComponent(secretKey)}`;
    }
    return url;
}

function buildVerificationUrl(cardId, restId, unitId) {
    const origin = window.location.origin || (window.location.protocol + '//' + window.location.host);
    const path = window.location.pathname || '';
    return `${origin}${path}?verify_vicard=${encodeURIComponent(cardId)}&rest=${encodeURIComponent(restId || '')}&unit=${encodeURIComponent(unitId || '')}`;
}

// --- PARTNER RESTAURANTS & MENU UNITS MANAGEMENT (MANAGER VIEW) ---
function renderVicardRestaurants() {
    const container = document.getElementById('vicard-restaurants-grid');
    if (!container) return;

    const restaurants = Object.values(vicardData.restaurants || {}).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (restaurants.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px 16px; color: var(--text-muted); background: var(--input-bg); border-radius: 16px; border: 1px dashed var(--border-color);">
                <div style="font-size: 2rem; margin-bottom: 8px;">🍽️</div>
                <div style="font-weight: 700; color: var(--text-main); margin-bottom: 4px;">No Partner Restaurants Yet</div>
                <div>Click "➕ Add Restaurant" above to create your first partner!</div>
            </div>
        `;
        return;
    }

    container.innerHTML = restaurants.map(r => {
        const isActive = r.active !== false;
        const units = Array.isArray(r.units) ? r.units : [];
        const offers = Array.isArray(r.offers) ? r.offers : [];

        // Units list HTML inside restaurant card
        let unitsListHtml = '';
        if (units.length > 0) {
            unitsListHtml = units.map((u, idx) => `
                <div style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 10px; padding: 8px 10px; margin-top: 6px;">
                    <div style="width: 44px; height: 44px; border-radius: 8px; overflow: hidden; background: #000; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1);">
                        ${u.image ? `<img src="${u.image}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.innerHTML='🍲'">` : '🍲'}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${escapeHtml(u.name)}
                        </div>
                        <div style="font-size: 0.76rem; display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                            ${u.originalPrice ? `<span style="text-decoration: line-through; color: var(--text-muted);">SAR ${u.originalPrice}</span>` : ''}
                            <span style="color: #2ed573; font-weight: 800;">SAR ${u.offerPrice || 0}</span>
                            ${u.discount ? `<span style="background: rgba(212,175,55,0.15); color: #f5d77f; padding: 1px 6px; border-radius: 6px; font-size: 0.7rem; font-weight: 700;">${escapeHtml(u.discount)}</span>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <button type="button" onclick="openEditUnitModal('${r.id}', ${idx})" style="background: rgba(212,175,55,0.12); border: 1px solid rgba(212,175,55,0.3); border-radius: 6px; color: #f5d77f; cursor: pointer; font-size: 0.76rem; padding: 3px 8px; font-weight: 700;" title="Edit Unit Details & Price">✏️ Edit</button>
                        <button type="button" onclick="deleteVicardUnit('${r.id}', ${idx})" style="background: none; border: none; color: var(--danger); cursor: pointer; font-size: 0.9rem; padding: 4px;" title="Delete Unit">✖</button>
                    </div>
                </div>
            `).join('');
        } else if (offers.length > 0) {
            unitsListHtml = offers.map((off, idx) => `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 10px; margin-top: 6px;">
                    <div style="font-size: 0.84rem; font-weight: 700; color: #f5d77f;">🎁 ${escapeHtml(off.title)}</div>
                    <button type="button" onclick="deleteVicardOffer('${r.id}', ${idx})" style="background: none; border: none; color: var(--danger); cursor: pointer;">✖</button>
                </div>
            `).join('');
        } else {
            unitsListHtml = `<div style="font-size: 0.78rem; color: var(--text-muted); font-style: italic; padding: 6px 0;">No menu units added yet. Click "+ Add Menu Unit" below.</div>`;
        }

        return `
            <div class="card" style="border-radius: 16px; border: 1px solid var(--border-color); padding: 18px; display: flex; flex-direction: column; justify-content: space-between; ${isActive ? '' : 'opacity: 0.65; filter: grayscale(0.3);'}">
                <div>
                    <!-- Restaurant Header -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(212,175,55,0.1); border: 1.5px solid rgba(212,175,55,0.3); display: flex; align-items: center; justify-content: center; font-size: 1.6rem; overflow: hidden; flex-shrink: 0;">
                                ${r.logo && (r.logo.startsWith('http') || r.logo.startsWith('data:') || r.logo.endsWith('.png') || r.logo.endsWith('.jpg') || r.logo.endsWith('.jpeg'))
                                    ? `<img src="${r.logo}" style="width: 100%; height: 100%; object-fit: cover;">`
                                    : (r.logo || '🍽️')}
                            </div>
                            <div>
                                <h4 style="margin: 0; font-size: 1.05rem; font-weight: 800; color: var(--text-main);">${escapeHtml(r.name)}</h4>
                                <div style="font-size: 0.78rem; color: #d4af37; font-weight: 600;">${escapeHtml(r.category || 'Dining')}</div>
                                ${r.location ? `<div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">📍 ${escapeHtml(r.location)} • ⭐ ${r.rating || '4.9'} (${r.reviews || '350+'})</div>` : `<div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">⭐ ${r.rating || '4.9'} (${r.reviews || '350+'})</div>`}
                                <div style="margin-top: 5px;">
                                    ${(() => {
                                        const lowestPlatRank = getLowestPlatformTierRank();
                                        const activeTiers = (r.eligibleTiers || []).filter(t => t && t !== 'none' && t !== '__none__');
                                        if (activeTiers.length > 0) {
                                            const minRestRank = Math.min(...activeTiers.map(t => getTierRank(t)));
                                            const isLowestRankChecked = minRestRank <= lowestPlatRank;
                                            if (isLowestRankChecked) {
                                                return `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; background: rgba(46,213,115,0.12); color: #2ed573; border: 1px solid rgba(46,213,115,0.3);">🌐 All Tiers (Rank ${minRestRank}+)</span>`;
                                            } else {
                                                return `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; background: rgba(212,175,55,0.15); color: #f5d77f; border: 1px solid rgba(212,175,55,0.3);">🏅 ${activeTiers.map(tid => (getVicardTiers()[tid]?.name || tid)).join(', ')} (Rank ${minRestRank}+) • Base Tier Restricted</span>`;
                                            }
                                        } else {
                                            return `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; background: rgba(235,77,75,0.15); color: #fca5a5; border: 1px solid rgba(235,77,75,0.3);">🚫 Restricted (Not Available Right Now)</span>`;
                                        }
                                    })()}
                                    <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; background: rgba(212,175,55,0.15); color: #f5d77f; border: 1px solid rgba(212,175,55,0.3); margin-left: 4px;">🔒 Cashier PIN: <strong style="font-family: monospace; letter-spacing: 1px;">${escapeHtml(r.cashierPin || '1234')}</strong></span>
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0; margin-left: 8px;">
                            <button type="button" onclick="toggleVicardRestaurant('${r.id}')"
                                style="padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; border: none; cursor: pointer; ${isActive ? 'background: rgba(46, 213, 115, 0.15); color: #2ed573;' : 'background: rgba(235, 77, 75, 0.15); color: #eb4d4b;'}">
                                ${isActive ? 'Active' : 'Paused'}
                            </button>
                        </div>
                    </div>

                    <!-- Offered Menu Units Section -->
                    <div style="margin-top: 14px; border-top: 1px solid var(--border-color); padding-top: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <span style="font-size: 0.76rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Offered Menu Units (${units.length})</span>
                            <button type="button" onclick="openAddUnitModal('${r.id}')" style="background: none; border: none; color: #d4af37; cursor: pointer; font-size: 0.78rem; font-weight: 700;">
                                ➕ Add Unit
                            </button>
                        </div>
                        <div style="max-height: 220px; overflow-y: auto;">
                            ${unitsListHtml}
                        </div>
                    </div>
                </div>

                <!-- Footer Actions (Strictly Contained in Card) -->
                <div class="vicard-rest-card-footer">
                    <button type="button" class="vicard-btn-action view" onclick="previewRestaurantOnCustomerSite('${r.id}')" title="Preview Menu on Customer Portal">
                        <span>👁️</span> <span>Preview</span>
                    </button>
                    <button type="button" class="vicard-btn-action edit" onclick="openEditRestaurantModal('${r.id}')" title="Edit Restaurant Details & Logo">
                        <span>✏️</span> <span>Edit</span>
                    </button>
                    <button type="button" class="vicard-btn-action delete" onclick="deleteVicardRestaurant('${r.id}')" title="Delete Restaurant">
                        <span>🗑️</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}
window.renderVicardRestaurants = renderVicardRestaurants;

// Add / Edit Restaurant Modal Handlers
function openAddRestaurantModal() {
    const modal = document.getElementById('vicard-restaurant-modal');
    const form = document.getElementById('form-vicard-restaurant');
    const idInput = document.getElementById('vicard-rest-id');
    const logoPreview = document.getElementById('vicard-rest-logo-preview');
    const coverPreview = document.getElementById('vicard-rest-cover-preview');
    const modalTitle = document.getElementById('vicard-restaurant-modal-title');
    const submitBtn = document.getElementById('vicard-restaurant-submit-btn');

    if (form) form.reset();
    if (idInput) idInput.value = '';
    if (logoPreview) {
        logoPreview.style.display = 'none';
        logoPreview.src = '';
    }
    if (coverPreview) {
        coverPreview.style.display = 'none';
        coverPreview.src = '';
    }
    const ratingInput = document.getElementById('vicard-rest-rating');
    const reviewsInput = document.getElementById('vicard-rest-reviews');
    const pinInput = document.getElementById('vicard-rest-cashier-pin');
    if (ratingInput) ratingInput.value = '4.9';
    if (reviewsInput) reviewsInput.value = '350+';
    if (pinInput) pinInput.value = '1234';
    if (modalTitle) modalTitle.textContent = '➕ Add Partner Restaurant';
    if (submitBtn) submitBtn.textContent = 'Save Restaurant';

    populateVicardRestTiersCheckboxes(Object.keys(getVicardTiers()));

    if (modal) modal.style.display = 'flex';
}
window.openAddRestaurantModal = openAddRestaurantModal;

function openEditRestaurantModal(restId) {
    const rest = vicardData.restaurants ? vicardData.restaurants[restId] : null;
    if (!rest) {
        alert('Restaurant not found.');
        return;
    }

    const modal = document.getElementById('vicard-restaurant-modal');
    const idInput = document.getElementById('vicard-rest-id');
    const nameInput = document.getElementById('vicard-rest-name');
    const logoInput = document.getElementById('vicard-rest-logo');
    const coverInput = document.getElementById('vicard-rest-cover');
    const catInput = document.getElementById('vicard-rest-category');
    const locInput = document.getElementById('vicard-rest-location');
    const ratingInput = document.getElementById('vicard-rest-rating');
    const reviewsInput = document.getElementById('vicard-rest-reviews');
    const pinInput = document.getElementById('vicard-rest-cashier-pin');
    const logoPreview = document.getElementById('vicard-rest-logo-preview');
    const coverPreview = document.getElementById('vicard-rest-cover-preview');
    const modalTitle = document.getElementById('vicard-restaurant-modal-title');
    const submitBtn = document.getElementById('vicard-restaurant-submit-btn');

    if (idInput) idInput.value = rest.id;
    if (nameInput) nameInput.value = rest.name || '';
    if (logoInput) logoInput.value = rest.logo || '';
    if (coverInput) coverInput.value = rest.cover || '';
    if (catInput) catInput.value = rest.category || '';
    if (locInput) locInput.value = rest.location || '';
    if (ratingInput) ratingInput.value = rest.rating || '4.9';
    if (reviewsInput) reviewsInput.value = rest.reviews || '350+';
    if (pinInput) pinInput.value = rest.cashierPin || '1234';

    if (logoPreview) {
        if (rest.logo && (rest.logo.startsWith('http') || rest.logo.startsWith('data:') || rest.logo.endsWith('.png') || rest.logo.endsWith('.jpg') || rest.logo.endsWith('.jpeg'))) {
            logoPreview.src = rest.logo;
            logoPreview.style.display = 'block';
        } else {
            logoPreview.style.display = 'none';
            logoPreview.src = '';
        }
    }

    if (coverPreview) {
        if (rest.cover && (rest.cover.startsWith('http') || rest.cover.startsWith('data:') || rest.cover.endsWith('.png') || rest.cover.endsWith('.jpg') || rest.cover.endsWith('.jpeg'))) {
            coverPreview.src = rest.cover;
            coverPreview.style.display = 'block';
        } else {
            coverPreview.style.display = 'none';
            coverPreview.src = '';
        }
    }

    if (modalTitle) modalTitle.textContent = `✏️ Edit Restaurant: ${rest.name}`;
    if (submitBtn) submitBtn.textContent = '💾 Update Restaurant';

    const existingTiers = Array.isArray(rest.eligibleTiers)
        ? rest.eligibleTiers.filter(t => t !== 'none' && t !== '__none__')
        : (rest.eligibleTiers !== undefined ? [] : Object.keys(getVicardTiers()));

    populateVicardRestTiersCheckboxes(existingTiers);

    if (modal) modal.style.display = 'flex';
}
window.openEditRestaurantModal = openEditRestaurantModal;

function closeVicardRestaurantModal() {
    const modal = document.getElementById('vicard-restaurant-modal');
    if (modal) modal.style.display = 'none';
}
window.closeVicardRestaurantModal = closeVicardRestaurantModal;

function handleVicardLogoFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const dataUrl = e.target.result;
        const logoInput = document.getElementById('vicard-rest-logo');
        const preview = document.getElementById('vicard-rest-logo-preview');
        if (logoInput) logoInput.value = dataUrl;
        if (preview) {
            preview.src = dataUrl;
            preview.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}
window.handleVicardLogoFileSelect = handleVicardLogoFileSelect;

function handleVicardCoverFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const dataUrl = e.target.result;
        const coverInput = document.getElementById('vicard-rest-cover');
        const preview = document.getElementById('vicard-rest-cover-preview');
        if (coverInput) coverInput.value = dataUrl;
        if (preview) {
            preview.src = dataUrl;
            preview.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}
window.handleVicardCoverFileSelect = handleVicardCoverFileSelect;

function handleSaveVicardRestaurant(e) {
    if (e && e.preventDefault) e.preventDefault();

    const idInput = document.getElementById('vicard-rest-id');
    const nameInput = document.getElementById('vicard-rest-name');
    const logoInput = document.getElementById('vicard-rest-logo');
    const coverInput = document.getElementById('vicard-rest-cover');
    const catInput = document.getElementById('vicard-rest-category');
    const locInput = document.getElementById('vicard-rest-location');
    const ratingInput = document.getElementById('vicard-rest-rating');
    const reviewsInput = document.getElementById('vicard-rest-reviews');
    const pinInput = document.getElementById('vicard-rest-cashier-pin');

    if (!nameInput) return;
    const existingRestId = idInput ? idInput.value.trim() : '';
    const name = nameInput.value.trim();
    const logo = logoInput ? logoInput.value.trim() : '🍽️';
    const cover = coverInput ? coverInput.value.trim() : '';
    const category = catInput ? catInput.value.trim() : 'Gourmet Dining';
    const location = locInput ? locInput.value.trim() : '';
    const rating = ratingInput ? ratingInput.value.trim() : '4.9';
    const reviews = reviewsInput ? reviewsInput.value.trim() : '350+';
    const cashierPin = pinInput && pinInput.value.trim() ? pinInput.value.trim() : '1234';
    const selectedTiers = Array.from(document.querySelectorAll('.vicard-rest-tier-cb:checked')).map(cb => cb.value);
    const tiersToSave = selectedTiers.length > 0 ? selectedTiers : ['none'];

    if (!name) {
        alert('Please enter restaurant name.');
        return;
    }

    // Check if editing existing restaurant
    if (existingRestId && vicardData.restaurants && vicardData.restaurants[existingRestId]) {
        const rest = vicardData.restaurants[existingRestId];
        rest.name = name;
        rest.logo = logo || rest.logo || '🍽️';
        if (cover) rest.cover = cover;
        rest.category = category;
        rest.location = location;
        rest.rating = rating || '4.9';
        rest.reviews = reviews || '350+';
        rest.cashierPin = cashierPin;
        rest.eligibleTiers = tiersToSave;
        rest.updatedAt = Date.now();

        const updateData = {
            name: rest.name,
            logo: rest.logo,
            cover: rest.cover || '',
            category: rest.category,
            location: rest.location,
            rating: rest.rating,
            reviews: rest.reviews,
            cashierPin: rest.cashierPin,
            eligibleTiers: tiersToSave,
            updatedAt: rest.updatedAt
        };

        db.ref('vicard_network/restaurants/' + existingRestId).update(updateData)
            .then(() => {
                closeVicardRestaurantModal();
                renderVicardRestaurants();
                if (currentVicardSubTab === 'customer') {
                    renderCustomerWebsite();
                }
                if (typeof logActivity === 'function') {
                    logActivity('vicard_partner_edit', '', 'Admin', `Updated partner restaurant ${name}`);
                }
            })
            .catch(err => {
                console.error('Error updating restaurant:', err);
                alert('Failed to update restaurant: ' + err.message);
            });
        return;
    }

    // New restaurant creation
    const restId = 'rest_' + Date.now();
    const newRest = {
        id: restId,
        name: name,
        logo: logo || '🍽️',
        cover: cover || '',
        category: category,
        location: location,
        rating: rating || '4.9',
        reviews: reviews || '350+',
        cashierPin: cashierPin,
        eligibleTiers: tiersToSave,
        active: true,
        units: [],
        createdAt: Date.now()
    };

    if (!vicardData.restaurants) vicardData.restaurants = {};
    vicardData.restaurants[restId] = newRest;

    db.ref('vicard_network/restaurants/' + restId).set(newRest)
        .then(() => {
            closeVicardRestaurantModal();
            renderVicardRestaurants();
            if (currentVicardSubTab === 'customer') {
                renderCustomerWebsite();
            }
            if (typeof logActivity === 'function') {
                logActivity('vicard_partner_add', '', 'Admin', `Added new partner restaurant ${name}`);
            }
        })
        .catch(err => {
            console.error('Error saving restaurant:', err);
            alert('Failed to save restaurant: ' + err.message);
        });
}
window.handleSaveVicardRestaurant = handleSaveVicardRestaurant;

function toggleVicardRestaurant(restId) {
    const rest = vicardData.restaurants[restId];
    if (!rest) return;

    const nextState = rest.active === false ? true : false;
    rest.active = nextState;
    renderVicardRestaurants();

    db.ref(`vicard_network/restaurants/${restId}/active`).set(nextState)
        .catch(err => console.error('Error toggling restaurant:', err));
}
window.toggleVicardRestaurant = toggleVicardRestaurant;

function deleteVicardRestaurant(restId) {
    const rest = vicardData.restaurants[restId];
    if (!rest) return;

    if (!confirm(`Delete restaurant "${rest.name}" and all its offered units from VICard?`)) return;

    delete vicardData.restaurants[restId];
    renderVicardRestaurants();
    if (currentVicardSubTab === 'customer') {
        renderCustomerWebsite();
    }

    if (typeof db !== 'undefined' && db) {
        db.ref('vicard_network/seeded').set(true);
        db.ref(`vicard_network/restaurants/${restId}`).remove()
            .then(() => {
                console.log(`Restaurant ${restId} permanently removed.`);
            })
            .catch(err => console.error('Error deleting restaurant:', err));
    }
}
window.deleteVicardRestaurant = deleteVicardRestaurant;

// --- MENU UNITS MANAGEMENT ---
function openAddUnitModal(restId) {
    const rest = vicardData.restaurants ? vicardData.restaurants[restId] : null;
    if (!rest) return;

    const modal = document.getElementById('vicard-unit-modal');
    const restIdInput = document.getElementById('vicard-unit-rest-id');
    const unitIdInput = document.getElementById('vicard-unit-id');
    const restNameDisplay = document.getElementById('vicard-unit-rest-name-display');
    const modalTitle = document.getElementById('vicard-unit-modal-title');
    const submitBtn = document.getElementById('vicard-unit-submit-btn');
    const form = document.getElementById('form-vicard-unit');
    const preview = document.getElementById('vicard-unit-image-preview');

    if (form) form.reset();
    if (restIdInput) restIdInput.value = restId;
    if (unitIdInput) unitIdInput.value = '';
    if (restNameDisplay) restNameDisplay.textContent = rest.name;
    if (modalTitle) modalTitle.textContent = '🍲 Add Menu Unit / Special Dish';
    if (submitBtn) submitBtn.textContent = 'Save Menu Unit';
    if (preview) {
        preview.style.display = 'none';
        preview.src = '';
    }

    if (modal) modal.style.display = 'flex';
}
window.openAddUnitModal = openAddUnitModal;

function openEditUnitModal(restId, unitIndex) {
    const rest = vicardData.restaurants ? vicardData.restaurants[restId] : null;
    if (!rest || !Array.isArray(rest.units) || !rest.units[unitIndex]) {
        alert('Menu unit not found.');
        return;
    }

    const unit = rest.units[unitIndex];
    const modal = document.getElementById('vicard-unit-modal');
    const restIdInput = document.getElementById('vicard-unit-rest-id');
    const unitIdInput = document.getElementById('vicard-unit-id');
    const restNameDisplay = document.getElementById('vicard-unit-rest-name-display');
    const modalTitle = document.getElementById('vicard-unit-modal-title');
    const submitBtn = document.getElementById('vicard-unit-submit-btn');
    const preview = document.getElementById('vicard-unit-image-preview');

    const nameInput = document.getElementById('vicard-unit-name');
    const imgInput = document.getElementById('vicard-unit-image');
    const origPriceInput = document.getElementById('vicard-unit-orig-price');
    const offerPriceInput = document.getElementById('vicard-unit-offer-price');
    const discountInput = document.getElementById('vicard-unit-discount');
    const descInput = document.getElementById('vicard-unit-desc');

    if (restIdInput) restIdInput.value = restId;
    if (unitIdInput) unitIdInput.value = unit.id || String(unitIndex);
    if (restNameDisplay) restNameDisplay.textContent = rest.name;
    if (modalTitle) modalTitle.textContent = `✏️ Edit Menu Unit: ${unit.name}`;
    if (submitBtn) submitBtn.textContent = '💾 Update Menu Unit';

    if (nameInput) nameInput.value = unit.name || '';
    if (imgInput) imgInput.value = unit.image || '';
    if (origPriceInput) origPriceInput.value = unit.originalPrice !== undefined ? unit.originalPrice : '';
    if (offerPriceInput) offerPriceInput.value = unit.offerPrice !== undefined ? unit.offerPrice : '';
    if (discountInput) discountInput.value = unit.discount || '';
    if (discountInput && !discountInput.value) calculateVicardUnitDiscount();
    if (descInput) descInput.value = unit.description || '';

    if (preview) {
        if (unit.image && (unit.image.startsWith('http') || unit.image.startsWith('data:') || unit.image.endsWith('.png') || unit.image.endsWith('.jpg') || unit.image.endsWith('.jpeg'))) {
            preview.src = unit.image;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
            preview.src = '';
        }
    }

    if (modal) modal.style.display = 'flex';
}
window.openEditUnitModal = openEditUnitModal;

function closeVicardUnitModal() {
    const modal = document.getElementById('vicard-unit-modal');
    if (modal) modal.style.display = 'none';
}
window.closeVicardUnitModal = closeVicardUnitModal;

function calculateVicardUnitDiscount() {
    const origInput = document.getElementById('vicard-unit-orig-price');
    const offerInput = document.getElementById('vicard-unit-offer-price');
    const discountInput = document.getElementById('vicard-unit-discount');
    if (!origInput || !offerInput || !discountInput) return;

    const origPrice = parseFloat(origInput.value);
    const offerPrice = parseFloat(offerInput.value);

    if (!isNaN(origPrice) && !isNaN(offerPrice) && origPrice > 0 && offerPrice > 0) {
        if (origPrice > offerPrice) {
            const pct = Math.round(((origPrice - offerPrice) / origPrice) * 100);
            discountInput.value = `${pct}% OFF`;
        } else {
            discountInput.value = '';
        }
    }
}
window.calculateVicardUnitDiscount = calculateVicardUnitDiscount;

function calculateVicardOfferDiscount() {
    const discInput = document.getElementById('vicard-offer-discount');
    const pctInput = document.getElementById('vicard-offer-percent');
    if (!discInput || !pctInput) return;

    const pct = parseFloat(pctInput.value);
    if (!isNaN(pct) && pct > 0) {
        discInput.value = `${pct}% OFF`;
    }
}
window.calculateVicardOfferDiscount = calculateVicardOfferDiscount;

if (typeof document !== 'undefined') {
    const bindDiscountInputs = () => {
        const orig = document.getElementById('vicard-unit-orig-price');
        const offer = document.getElementById('vicard-unit-offer-price');
        if (orig) {
            orig.addEventListener('input', calculateVicardUnitDiscount);
            orig.addEventListener('change', calculateVicardUnitDiscount);
        }
        if (offer) {
            offer.addEventListener('input', calculateVicardUnitDiscount);
            offer.addEventListener('change', calculateVicardUnitDiscount);
        }
        const pct = document.getElementById('vicard-offer-percent');
        if (pct) {
            pct.addEventListener('input', calculateVicardOfferDiscount);
            pct.addEventListener('change', calculateVicardOfferDiscount);
        }
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindDiscountInputs);
    } else {
        bindDiscountInputs();
    }
}

function handleVicardUnitImageFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const dataUrl = e.target.result;
        const imgInput = document.getElementById('vicard-unit-image');
        const preview = document.getElementById('vicard-unit-image-preview');
        if (imgInput) imgInput.value = dataUrl;
        if (preview) {
            preview.src = dataUrl;
            preview.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}
window.handleVicardUnitImageFileSelect = handleVicardUnitImageFileSelect;

function handleSaveVicardUnit(e) {
    if (e && e.preventDefault) e.preventDefault();

    const restIdInput = document.getElementById('vicard-unit-rest-id');
    const unitIdInput = document.getElementById('vicard-unit-id');
    const nameInput = document.getElementById('vicard-unit-name');
    const imgInput = document.getElementById('vicard-unit-image');
    const origPriceInput = document.getElementById('vicard-unit-orig-price');
    const offerPriceInput = document.getElementById('vicard-unit-offer-price');
    const discountInput = document.getElementById('vicard-unit-discount');
    const descInput = document.getElementById('vicard-unit-desc');

    if (!restIdInput || !nameInput || !offerPriceInput) return;
    const restId = restIdInput.value;
    const unitId = unitIdInput ? unitIdInput.value.trim() : '';
    const name = nameInput.value.trim();
    const image = imgInput ? imgInput.value.trim() : '';
    const origPrice = origPriceInput && origPriceInput.value ? parseFloat(origPriceInput.value) : 0;
    const offerPrice = parseFloat(offerPriceInput.value) || 0;
    let discount = discountInput ? discountInput.value.trim() : '';
    const desc = descInput ? descInput.value.trim() : '';

    if (!name) {
        alert('Please enter the menu unit / dish name.');
        return;
    }

    // Auto calculate discount percentage if not provided
    if (!discount && origPrice > offerPrice && origPrice > 0) {
        const pct = Math.round(((origPrice - offerPrice) / origPrice) * 100);
        discount = `${pct}% OFF`;
    }

    const rest = vicardData.restaurants ? vicardData.restaurants[restId] : null;
    if (!rest) return;

    if (!Array.isArray(rest.units)) rest.units = [];

    // Check if updating an existing unit
    if (unitId) {
        const existingIdx = rest.units.findIndex((u, idx) => u.id === unitId || String(idx) === unitId);
        if (existingIdx !== -1) {
            rest.units[existingIdx] = {
                ...rest.units[existingIdx],
                name: name,
                image: image || rest.units[existingIdx].image || rest.logo || '',
                originalPrice: origPrice,
                offerPrice: offerPrice,
                discount: discount || 'VIP Offer',
                description: desc,
                updatedAt: Date.now()
            };
        } else {
            // Unit ID specified but not found in existing array, push
            rest.units.push({
                id: unitId,
                name: name,
                image: image || rest.logo || '',
                originalPrice: origPrice,
                offerPrice: offerPrice,
                discount: discount || 'VIP Offer',
                description: desc,
                updatedAt: Date.now()
            });
        }
    } else {
        // Create brand new unit
        const newUnit = {
            id: 'unit_' + Date.now(),
            name: name,
            image: image || rest.logo || '',
            originalPrice: origPrice,
            offerPrice: offerPrice,
            discount: discount || 'VIP Offer',
            description: desc,
            createdAt: Date.now()
        };
        rest.units.push(newUnit);
    }

    db.ref(`vicard_network/restaurants/${restId}/units`).set(rest.units)
        .then(() => {
            closeVicardUnitModal();
            renderVicardRestaurants();
            if (currentVicardSubTab === 'customer') {
                renderCustomerWebsite();
            }
        })
        .catch(err => {
            console.error('Error saving unit:', err);
            alert('Failed to save menu unit: ' + err.message);
        });
}
window.handleSaveVicardUnit = handleSaveVicardUnit;

function deleteVicardUnit(restId, unitIndex) {
    const rest = vicardData.restaurants[restId];
    if (!rest || !Array.isArray(rest.units)) return;

    if (!confirm('Remove this menu unit from the restaurant?')) return;

    rest.units.splice(unitIndex, 1);
    renderVicardRestaurants();

    db.ref(`vicard_network/restaurants/${restId}/units`).set(rest.units)
        .then(() => {
            if (currentVicardSubTab === 'customer') {
                renderCustomerWebsite();
            }
        })
        .catch(err => console.error('Error deleting unit:', err));
}
window.deleteVicardUnit = deleteVicardUnit;

function deleteVicardOffer(restId, offerIndex) {
    const rest = vicardData.restaurants[restId];
    if (!rest || !Array.isArray(rest.offers)) return;

    if (!confirm('Remove this offer?')) return;

    rest.offers.splice(offerIndex, 1);
    renderVicardRestaurants();

    db.ref(`vicard_network/restaurants/${restId}/offers`).set(rest.offers)
        .catch(err => console.error('Error deleting offer:', err));
}
window.deleteVicardOffer = deleteVicardOffer;

// --- PARTNER RESTAURANT OFFERS MODAL ---
function openVicardOfferModal(restId, offerIndex) {
    const modal = document.getElementById('vicard-offer-modal');
    if (!modal) return;

    const restInput = document.getElementById('vicard-offer-rest-id');
    const offerIdInput = document.getElementById('vicard-offer-id');
    const titleInput = document.getElementById('vicard-offer-title');
    const discInput = document.getElementById('vicard-offer-discount');
    const pctInput = document.getElementById('vicard-offer-percent');
    const descInput = document.getElementById('vicard-offer-desc');
    const modalTitle = document.getElementById('vicard-offer-modal-title');

    if (restInput) restInput.value = restId || '';

    if (offerIndex !== undefined && offerIndex !== null && offerIndex !== '' && !isNaN(offerIndex)) {
        if (offerIdInput) offerIdInput.value = offerIndex;
        const rest = vicardData.restaurants[restId] || {};
        const off = (rest.offers && rest.offers[offerIndex]) || {};
        if (modalTitle) modalTitle.textContent = '✏️ Edit Offer';
        if (titleInput) titleInput.value = off.title || '';
        if (discInput) discInput.value = off.discount || '';
        if (pctInput) pctInput.value = off.discountPercent || '';
        if (descInput) descInput.value = off.description || off.terms || '';
    } else {
        if (offerIdInput) offerIdInput.value = '';
        if (modalTitle) modalTitle.textContent = '🏷️ Add Offer';
        if (titleInput) titleInput.value = '';
        if (discInput) discInput.value = '';
        if (pctInput) pctInput.value = '';
        if (descInput) descInput.value = '';
    }

    modal.style.display = 'flex';
}
window.openVicardOfferModal = openVicardOfferModal;

function closeVicardOfferModal() {
    const modal = document.getElementById('vicard-offer-modal');
    if (modal) modal.style.display = 'none';
}
window.closeVicardOfferModal = closeVicardOfferModal;

function handleSaveVicardOffer(e) {
    if (e) e.preventDefault();

    const restId = (document.getElementById('vicard-offer-rest-id')?.value || '').trim();
    const offerIdxStr = (document.getElementById('vicard-offer-id')?.value || '').trim();
    const title = (document.getElementById('vicard-offer-title')?.value || '').trim();
    const discount = (document.getElementById('vicard-offer-discount')?.value || '').trim();
    const discountPercent = parseFloat(document.getElementById('vicard-offer-percent')?.value) || 0;
    const description = (document.getElementById('vicard-offer-desc')?.value || '').trim();

    const rest = vicardData.restaurants[restId];
    if (!rest) {
        alert('Restaurant not found!');
        return;
    }

    if (!Array.isArray(rest.offers)) rest.offers = [];

    const offerObj = {
        title: title,
        discount: discount || (discountPercent ? `${discountPercent}% OFF` : 'VIP Special'),
        discountPercent: discountPercent,
        description: description,
        updatedAt: Date.now()
    };

    if (offerIdxStr !== '' && !isNaN(parseInt(offerIdxStr, 10))) {
        rest.offers[parseInt(offerIdxStr, 10)] = offerObj;
    } else {
        rest.offers.push(offerObj);
    }

    if (typeof db !== 'undefined' && db) {
        db.ref(`vicard_network/restaurants/${restId}/offers`).set(rest.offers)
            .then(() => {
                closeVicardOfferModal();
                renderVicardRestaurants();
                if (currentVicardSubTab === 'customer') renderCustomerWebsite();
            })
            .catch(err => {
                console.error('Error saving offer:', err);
                closeVicardOfferModal();
                renderVicardRestaurants();
            });
    } else {
        closeVicardOfferModal();
        renderVicardRestaurants();
    }
}
window.handleSaveVicardOffer = handleSaveVicardOffer;

// --- HERO BANNER CUSTOMIZER (MANAGER VIEW) ---
function openVicardBannerModal() {
    const modal = document.getElementById('vicard-banner-modal');
    if (!modal) return;

    const badgeInput = document.getElementById('vicard-banner-badge-input');
    const titleInput = document.getElementById('vicard-banner-title-input');
    const subInput = document.getElementById('vicard-banner-sub-input');
    const btnTextInput = document.getElementById('vicard-banner-btn-text-input');
    const gradInput = document.getElementById('vicard-banner-grad-input');

    const cfg = vicardData.bannerConfig || {};

    if (badgeInput) badgeInput.value = cfg.badge || '✨ VIP PRIVILEGES UNLOCKED';
    if (titleInput) titleInput.value = cfg.title || 'Exclusive Dining Privileges';
    if (subInput) subInput.value = cfg.subtitle || 'Flash your VICard at our top-tier partners across the city for VIP treatments & up to 30% instant cashback.';
    if (btnTextInput) btnTextInput.value = cfg.btnText || '🌟 Explore Top Offers';
    if (gradInput) gradInput.value = cfg.gradient || 'gold-royal';

    modal.style.display = 'flex';
}
window.openVicardBannerModal = openVicardBannerModal;

function closeVicardBannerModal() {
    const modal = document.getElementById('vicard-banner-modal');
    if (modal) modal.style.display = 'none';
}
window.closeVicardBannerModal = closeVicardBannerModal;

function saveVicardHeroBanner(e) {
    if (e) e.preventDefault();

    const badge = (document.getElementById('vicard-banner-badge-input')?.value || '').trim();
    const title = (document.getElementById('vicard-banner-title-input')?.value || '').trim();
    const subtitle = (document.getElementById('vicard-banner-sub-input')?.value || '').trim();
    const btnText = (document.getElementById('vicard-banner-btn-text-input')?.value || '').trim();
    const gradient = document.getElementById('vicard-banner-grad-input')?.value || 'gold-royal';

    vicardData.bannerConfig = {
        badge: badge || '✨ VIP PRIVILEGES UNLOCKED',
        title: title || 'Exclusive Dining Privileges',
        subtitle: subtitle,
        btnText: btnText,
        gradient: gradient,
        updatedAt: Date.now()
    };

    if (typeof db !== 'undefined' && db) {
        db.ref('vicard_network/bannerConfig').set(vicardData.bannerConfig)
            .then(() => {
                closeVicardBannerModal();
                if (currentVicardSubTab === 'customer') renderCustomerWebsite();
                alert('✅ Hero Banner updated successfully!');
            })
            .catch(err => {
                console.error('Error saving banner:', err);
                closeVicardBannerModal();
                if (currentVicardSubTab === 'customer') renderCustomerWebsite();
            });
    } else {
        closeVicardBannerModal();
        if (currentVicardSubTab === 'customer') renderCustomerWebsite();
    }
}
window.saveVicardHeroBanner = saveVicardHeroBanner;

// --- MEMBERSHIP TIERS MANAGEMENT (MANAGER VIEW) ---
var defaultVicardTiers = {
    'silver': { id: 'silver', name: 'Silver VIP', icon: '🥈', rank: 1, minSpend: 0, perks: '10% Base Cashback', gradient: 'linear-gradient(135deg, #9ca3af, #4b5563)' },
    'gold': { id: 'gold', name: 'Gold VIP', icon: '👑', rank: 2, minSpend: 500, perks: '15% Discount + Free Soft Drink', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    'platinum': { id: 'platinum', name: 'Platinum Elite', icon: '💎', rank: 3, minSpend: 1500, perks: '25% Discount + Priority Seating', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
    'black': { id: 'black', name: 'Black VIP Founder', icon: '✨', rank: 4, minSpend: 3000, perks: '35% Discount + Chef Welcome Plate', gradient: 'linear-gradient(135deg, #18181b, #000000)' }
};

function getVicardTiers() {
    if (vicardData.tiers && Object.keys(vicardData.tiers).length > 0) {
        // Ensure every tier has a numeric rank
        Object.keys(vicardData.tiers).forEach(k => {
            const t = vicardData.tiers[k];
            if (t && (t.rank === undefined || t.rank === null)) {
                t.rank = k === 'black' ? 4 : (k === 'platinum' ? 3 : (k === 'gold' ? 2 : 1));
            }
        });
        return vicardData.tiers;
    }
    return defaultVicardTiers;
}
window.getVicardTiers = getVicardTiers;

function getTierRank(tierIdentifier) {
    if (!tierIdentifier) return 1;
    const tiers = getVicardTiers();
    const norm = String(tierIdentifier).toLowerCase().trim();

    if (tiers[norm] && tiers[norm].rank !== undefined) {
        return parseInt(tiers[norm].rank, 10) || 1;
    }
    for (const key of Object.keys(tiers)) {
        const t = tiers[key];
        const tName = (t.name || '').toLowerCase();
        const tId = (t.id || '').toLowerCase();
        if (tId === norm || tName === norm || norm.includes(tId) || tName.includes(norm)) {
            if (t.rank !== undefined && t.rank !== null && !isNaN(t.rank)) {
                return parseInt(t.rank, 10);
            }
            if (t.minSpend !== undefined) {
                return t.minSpend >= 3000 ? 4 : (t.minSpend >= 1500 ? 3 : (t.minSpend >= 500 ? 2 : 1));
            }
        }
    }
    if (norm.includes('black') || norm.includes('founder')) return 4;
    if (norm.includes('platinum') || norm.includes('elite')) return 3;
    if (norm.includes('gold')) return 2;
    if (norm.includes('silver')) return 1;
    return 1;
}
window.getTierRank = getTierRank;

function getLowestPlatformTierRank() {
    const tiers = Object.values(getVicardTiers());
    if (!tiers || tiers.length === 0) return 1;
    const ranks = tiers.map(t => {
        if (t.rank !== undefined && t.rank !== null && !isNaN(t.rank)) {
            return parseInt(t.rank, 10);
        }
        return getTierRank(t.id || t.name);
    });
    return Math.min(...ranks);
}
window.getLowestPlatformTierRank = getLowestPlatformTierRank;

function checkTierEligibility(customerTier, requiredTiers) {
    const custRank = getTierRank(customerTier);
    const tiers = getVicardTiers();
    const lowestPlatformRank = getLowestPlatformTierRank();

    const cleanTiers = Array.isArray(requiredTiers) 
        ? requiredTiers.filter(t => t && t !== 'none' && t !== '__none__')
        : [];

    // If no valid tiers were selected/checked for this restaurant:
    // The lowest rank was NOT checkboxed! Thus the restaurant is restricted and not available.
    if (cleanTiers.length === 0) {
        return {
            eligible: false,
            isLowestRankUnchecked: true,
            notAvailableReason: 'This restaurant is not available right now',
            customerRank: custRank,
            minRequiredRank: 9999,
            requiredTierNames: ['None (Restricted)']
        };
    }

    const reqRanks = cleanTiers.map(tId => getTierRank(tId));
    const minReqRank = Math.min(...reqRanks);

    // If the minimum required rank among the checked tiers is greater than the lowest rank in the system,
    // then the lowest rank was NOT checkboxed!
    const isLowestRankUnchecked = minReqRank > lowestPlatformRank;
    const isEligible = custRank >= minReqRank;

    const requiredTierNames = cleanTiers.map(tId => {
        const found = tiers[tId] || Object.values(tiers).find(t => t.id === tId || t.name === tId);
        return found ? `${found.icon || '🏅'} ${found.name}` : tId;
    });

    return {
        eligible: isEligible,
        isLowestRankUnchecked: isLowestRankUnchecked,
        notAvailableReason: (!isEligible && isLowestRankUnchecked) ? 'This restaurant is not available right now' : '',
        customerRank: custRank,
        minRequiredRank: minReqRank,
        requiredTierNames: requiredTierNames
    };
}
window.checkTierEligibility = checkTierEligibility;

function populateVicardRestTiersCheckboxes(selectedTiers = []) {
    const container = document.getElementById('vicard-rest-tiers-container');
    if (!container) return;

    const tiers = Object.values(getVicardTiers()).sort((a, b) => (a.rank || 0) - (b.rank || 0));
    const selList = Array.isArray(selectedTiers) ? selectedTiers.filter(t => t !== 'none' && t !== '__none__') : [];

    container.innerHTML = tiers.map(t => {
        const isChecked = selList.includes(t.id) || selList.includes(t.name);
        return `
            <div class="vicard-tier-checkbox-chip" onclick="toggleVicardTierChip(this, event)" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 10px; cursor: pointer; user-select: none; transition: all 0.2s; font-size: 0.85rem; font-weight: 700; ${isChecked ? 'background: rgba(212,175,55,0.22); border: 1.5px solid #d4af37; color: #fff;' : 'background: rgba(255,255,255,0.04); border: 1px solid var(--border-color); color: var(--text-muted);'}">
                <input type="checkbox" class="vicard-rest-tier-cb" value="${t.id}" ${isChecked ? 'checked' : ''} style="accent-color: #d4af37; cursor: pointer; width: 16px; height: 16px; pointer-events: none;">
                <span style="pointer-events: none;">${t.icon || '🏅'} ${escapeHtml(t.name)}</span>
                <span style="pointer-events: none; font-size: 0.72rem; color: #d4af37; font-family: monospace;">(Rank ${t.rank || 1})</span>
            </div>
        `;
    }).join('');
}
window.populateVicardRestTiersCheckboxes = populateVicardRestTiersCheckboxes;

function toggleVicardTierChip(chip, event) {
    if (event) event.stopPropagation();
    const cb = chip.querySelector('.vicard-rest-tier-cb');
    if (!cb) return;
    cb.checked = !cb.checked;
    if (cb.checked) {
        chip.style.background = 'rgba(212,175,55,0.22)';
        chip.style.border = '1.5px solid #d4af37';
        chip.style.color = '#fff';
    } else {
        chip.style.background = 'rgba(255,255,255,0.04)';
        chip.style.border = '1px solid var(--border-color)';
        chip.style.color = 'var(--text-muted)';
    }
}
window.toggleVicardTierChip = toggleVicardTierChip;

function toggleVicardTierChipStyle(cb) {
    const chip = cb.closest('.vicard-tier-checkbox-chip') || cb.closest('label');
    if (!chip) return;
    if (cb.checked) {
        chip.style.background = 'rgba(212,175,55,0.22)';
        chip.style.border = '1.5px solid #d4af37';
        chip.style.color = '#fff';
    } else {
        chip.style.background = 'rgba(255,255,255,0.04)';
        chip.style.border = '1px solid var(--border-color)';
        chip.style.color = 'var(--text-muted)';
    }
}
window.toggleVicardTierChipStyle = toggleVicardTierChipStyle;

function renderVicardTiersManager() {
    const container = document.getElementById('vicard-tiers-table-container');
    if (!container) return;

    const tiers = Object.values(getVicardTiers()).sort((a, b) => (b.rank || 0) - (a.rank || 0));

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 10px;">
            ${tiers.map(t => `
                <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 16px;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div style="width: 44px; height: 44px; border-radius: 10px; background: ${t.gradient || 'linear-gradient(135deg, #333, #111)'}; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); flex-shrink: 0;">
                            ${t.icon || '🏅'}
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-main);">${escapeHtml(t.name)}</div>
                                <span style="background: rgba(212,175,55,0.2); color: #f5d77f; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 800; border: 1px solid rgba(212,175,55,0.35);">Rank ${t.rank || 1}</span>
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                                <span style="color: #d4af37; font-weight: 700;">Min Spend: SAR ${t.minSpend || 0}</span> • <span>${escapeHtml(t.perks || 'VIP Perks')}</span>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button type="button" onclick="openVicardTierEditModal('${t.id}')" style="background: rgba(212,175,55,0.12); border: 1px solid rgba(212,175,55,0.3); border-radius: 8px; color: #f5d77f; padding: 6px 12px; font-size: 0.82rem; font-weight: 700; cursor: pointer;">✏️ Edit</button>
                        <button type="button" onclick="deleteVicardTier('${t.id}')" style="background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; color: #ef4444; padding: 6px 10px; font-size: 0.82rem; font-weight: 700; cursor: pointer;">🗑️</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}
window.renderVicardTiersManager = renderVicardTiersManager;

function populateVicardTierSelects() {
    const tierSelect = document.getElementById('vicard-cust-tier');
    if (!tierSelect) return;

    const currentVal = tierSelect.value;
    const tiers = Object.values(getVicardTiers()).sort((a, b) => (b.rank || 0) - (a.rank || 0));

    tierSelect.innerHTML = tiers.map(t => `
        <option value="${escapeHtml(t.name)}" ${currentVal === t.name || (!currentVal && (t.id === 'black' || t.name.includes('Black'))) ? 'selected' : ''}>
            ${t.icon || '🏅'} ${escapeHtml(t.name)} (Rank ${t.rank || 1} • SAR ${t.minSpend ? t.minSpend + '+' : '0'})
        </option>
    `).join('');
}
window.populateVicardTierSelects = populateVicardTierSelects;

function openVicardTiersModal() {
    const modal = document.getElementById('vicard-tiers-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    renderVicardTiersManager();
}
window.openVicardTiersModal = openVicardTiersModal;

function closeVicardTiersModal() {
    const modal = document.getElementById('vicard-tiers-modal');
    if (modal) modal.style.display = 'none';
}
window.closeVicardTiersModal = closeVicardTiersModal;

function openVicardTierEditModal(tierId) {
    const modal = document.getElementById('vicard-tier-edit-modal');
    if (!modal) return;

    const isEdit = Boolean(tierId);
    const titleEl = document.getElementById('vicard-tier-edit-title');
    const origIdInput = document.getElementById('vicard-tier-edit-orig-id');
    const idInput = document.getElementById('vicard-tier-id-input');
    const rankInput = document.getElementById('vicard-tier-rank-input');
    const nameInput = document.getElementById('vicard-tier-name-input');
    const iconInput = document.getElementById('vicard-tier-icon-input');
    const minSpendInput = document.getElementById('vicard-tier-minspend-input');
    const perksInput = document.getElementById('vicard-tier-perks-input');
    const gradInput = document.getElementById('vicard-tier-gradient-input');

    if (isEdit) {
        if (titleEl) titleEl.textContent = 'Edit Membership Tier';
        const tiers = getVicardTiers();
        const t = tiers[tierId] || {};
        if (origIdInput) origIdInput.value = tierId;
        if (idInput) {
            idInput.value = tierId;
            idInput.disabled = true;
        }
        if (rankInput) rankInput.value = t.rank !== undefined ? t.rank : getTierRank(tierId);
        if (nameInput) nameInput.value = t.name || '';
        if (iconInput) iconInput.value = t.icon || '🏅';
        if (minSpendInput) minSpendInput.value = t.minSpend !== undefined ? t.minSpend : 0;
        if (perksInput) perksInput.value = t.perks || '';
        if (gradInput) gradInput.value = t.gradient || 'linear-gradient(135deg, #d4af37, #aa771c)';
    } else {
        if (titleEl) titleEl.textContent = 'Add Membership Tier';
        if (origIdInput) origIdInput.value = '';
        if (idInput) {
            idInput.value = '';
            idInput.disabled = false;
        }
        const maxRank = Math.max(...Object.values(getVicardTiers()).map(t => t.rank || 0), 0);
        if (rankInput) rankInput.value = maxRank + 1;
        if (nameInput) nameInput.value = '';
        if (iconInput) iconInput.value = '🏅';
        if (minSpendInput) minSpendInput.value = 0;
        if (perksInput) perksInput.value = '';
        if (gradInput) gradInput.value = 'linear-gradient(135deg, #d4af37, #aa771c)';
    }

    modal.style.display = 'flex';
}
window.openVicardTierEditModal = openVicardTierEditModal;

function closeVicardTierEditModal() {
    const modal = document.getElementById('vicard-tier-edit-modal');
    if (modal) modal.style.display = 'none';
}
window.closeVicardTierEditModal = closeVicardTierEditModal;

function saveVicardTier(e) {
    if (e) e.preventDefault();

    const origId = (document.getElementById('vicard-tier-edit-orig-id')?.value || '').trim();
    const idInput = document.getElementById('vicard-tier-id-input');
    const tierId = (origId || (idInput ? idInput.value : '') || '').trim().toLowerCase().replace(/\s+/g, '_');

    if (!tierId) {
        alert('Please specify a tier ID!');
        return;
    }

    const rank = parseInt(document.getElementById('vicard-tier-rank-input')?.value, 10) || 1;
    const name = (document.getElementById('vicard-tier-name-input')?.value || '').trim();
    const icon = (document.getElementById('vicard-tier-icon-input')?.value || '').trim() || '🏅';
    const minSpend = parseFloat(document.getElementById('vicard-tier-minspend-input')?.value) || 0;
    const perks = (document.getElementById('vicard-tier-perks-input')?.value || '').trim();
    const gradient = (document.getElementById('vicard-tier-gradient-input')?.value || '').trim() || 'linear-gradient(135deg, #d4af37, #aa771c)';

    vicardData.tiers = { ...getVicardTiers() };
    vicardData.tiers[tierId] = {
        id: tierId,
        rank: rank,
        name: name || tierId,
        icon: icon,
        minSpend: minSpend,
        perks: perks,
        gradient: gradient,
        updatedAt: Date.now()
    };

    if (typeof db !== 'undefined' && db) {
        db.ref(`vicard_network/tiers/${tierId}`).set(vicardData.tiers[tierId])
            .then(() => {
                closeVicardTierEditModal();
                renderVicardTiersManager();
                populateVicardTierSelects();
                if (currentVicardSubTab === 'customer') renderCustomerWebsite();
            })
            .catch(err => {
                console.error('Error saving tier:', err);
                closeVicardTierEditModal();
                renderVicardTiersManager();
                populateVicardTierSelects();
            });
    } else {
        closeVicardTierEditModal();
        renderVicardTiersManager();
        populateVicardTierSelects();
    }
}
window.saveVicardTier = saveVicardTier;

function deleteVicardTier(tierId) {
    if (!confirm('Are you sure you want to delete this membership tier?')) return;

    vicardData.tiers = { ...getVicardTiers() };
    delete vicardData.tiers[tierId];

    if (typeof db !== 'undefined' && db) {
        db.ref(`vicard_network/tiers/${tierId}`).remove().catch(console.error);
    }

    renderVicardTiersManager();
    populateVicardTierSelects();
    if (currentVicardSubTab === 'customer') renderCustomerWebsite();
}
window.deleteVicardTier = deleteVicardTier;

// --- SEARCH & CATEGORY FILTERS FOR CUSTOMER VIEW ---
function handleVicardSearchInput(val) {
    vicardSearchQuery = (val || '').toLowerCase().trim();
    if (currentVicardSubTab === 'customer') {
        renderCustomerWebsite();
    }
    const custOverlay = document.getElementById('vicard-customer-portal-overlay');
    if (custOverlay && custOverlay.style.display === 'block') {
        const params = new URLSearchParams(window.location.search);
        const cardId = params.get('vicard');
        if (cardId) openVicardCustomerPortal(cardId);
    }
}
window.handleVicardSearchInput = handleVicardSearchInput;

function clearVicardSearch() {
    vicardSearchQuery = '';
    if (currentVicardSubTab === 'customer') {
        renderCustomerWebsite();
    }
    const custOverlay = document.getElementById('vicard-customer-portal-overlay');
    if (custOverlay && custOverlay.style.display === 'block') {
        const params = new URLSearchParams(window.location.search);
        const cardId = params.get('vicard');
        if (cardId) openVicardCustomerPortal(cardId);
    }
}
window.clearVicardSearch = clearVicardSearch;

function filterVicardCategory(cat) {
    vicardActiveCategory = cat;
    if (currentVicardSubTab === 'customer') {
        renderCustomerWebsite();
    }
    const custOverlay = document.getElementById('vicard-customer-portal-overlay');
    if (custOverlay && custOverlay.style.display === 'block') {
        if (window._currentActiveCustomerCard) {
            renderAuthorizedCustomerPortal(window._currentActiveCustomerCard);
        }
    }
}
window.filterVicardCategory = filterVicardCategory;

// --- TOAST NOTIFICATION FOR MOBILE NAVIGATION & APP GUARD ---
function showVicardPortalToast(msg, duration = 2200) {
    let toast = document.getElementById('vicard-portal-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'vicard-portal-toast';
        toast.className = 'vicard-portal-toast';
        document.body.appendChild(toast);
    }
    toast.innerHTML = msg;
    toast.classList.add('show');

    if (window._vicardToastTimeout) clearTimeout(window._vicardToastTimeout);
    window._vicardToastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}
window.showVicardPortalToast = showVicardPortalToast;

// Dynamic Exit / Back Button updater in the Customer Portal top bar
function updateVicardPortalExitButton() {
    const btn = document.getElementById('vicard-portal-top-exit-btn');
    if (!btn) return;
    if (activeWebsiteRestId) {
        btn.style.display = 'inline-flex';
        btn.innerHTML = '← Main Offers';
        btn.title = 'Back to All Restaurant Offers';
        btn.style.background = 'rgba(212,175,55,0.18)';
        btn.style.borderColor = 'rgba(212,175,55,0.45)';
        btn.style.color = '#f5d77f';
    } else {
        // User requested: "exit button in the early menu is useless since there is no where to ecxit since i am already in the main page so remove it"
        btn.style.display = 'none';
    }
}
window.updateVicardPortalExitButton = updateVicardPortalExitButton;

// Handle clicking the Exit ✖ / Main Offers button
function handleVicardPortalExitButtonClick() {
    const modal = document.getElementById('vicard-redeem-modal');
    if (modal && modal.style.display === 'flex') {
        closeVicardRedeemModal(true);
    }

    // 1. If currently inside a restaurant menu/storefront:
    // Automatically take customer back to the main page of the offers on first click!
    if (activeWebsiteRestId) {
        viewAllRestaurantsOnWebsite(false);
        return;
    }

    // 2. If already on the main page of the offers:
    // Reset search query, reset category filter to all, and scroll smoothly to top
    vicardSearchQuery = '';
    vicardActiveCategory = 'all';
    const searchInput = document.getElementById('vicard-site-search');
    if (searchInput) searchInput.value = '';

    if (window._currentActiveCustomerCard) {
        renderAuthorizedCustomerPortal(window._currentActiveCustomerCard);
    }

    const overlay = document.getElementById('vicard-customer-portal-overlay');
    if (overlay) {
        overlay.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showVicardPortalToast('🍽️ Main Offers Directory • All Partners');
}
window.handleVicardPortalExitButtonClick = handleVicardPortalExitButtonClick;

// --- PROFESSIONAL CUSTOMER WEBSITE VIEW (HUNGERSTATION / KEETA ELITE THEME) ---
function previewRestaurantOnCustomerSite(restId, fromHistory) {
    activeWebsiteRestId = restId;
    if (!fromHistory) {
        try {
            history.pushState({ vicardApp: true, vicardView: 'restaurant', restId: restId }, document.title);
        } catch (e) {}
    }
    const custOverlay = document.getElementById('vicard-customer-portal-overlay');
    if (custOverlay && custOverlay.style.display === 'block') {
        if (window._currentActiveCustomerCard) {
            renderAuthorizedCustomerPortal(window._currentActiveCustomerCard);
        }
        custOverlay.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        // Switch from Manager Hub to Customer View to immediately display the preview!
        switchNfcSubTab('customer');
        renderCustomerWebsite();
        const container = document.getElementById('nfc-customer-website-content');
        if (container) {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    updateVicardPortalExitButton();
}
window.previewRestaurantOnCustomerSite = previewRestaurantOnCustomerSite;

function viewAllRestaurantsOnWebsite(fromHistory) {
    activeWebsiteRestId = null;
    if (!fromHistory) {
        try {
            if (history.state && history.state.vicardView === 'restaurant') {
                history.replaceState({ vicardApp: true, vicardView: 'directory' }, document.title);
            }
        } catch (e) {}
    }
    if (currentVicardSubTab === 'customer') {
        renderCustomerWebsite();
    }
    const custOverlay = document.getElementById('vicard-customer-portal-overlay');
    if (custOverlay && custOverlay.style.display === 'block') {
        if (window._currentActiveCustomerCard) {
            renderAuthorizedCustomerPortal(window._currentActiveCustomerCard);
        }
        custOverlay.scrollTo({ top: 0, behavior: 'smooth' });
    }
    updateVicardPortalExitButton();
}
window.viewAllRestaurantsOnWebsite = viewAllRestaurantsOnWebsite;

function renderCustomerWebsite() {
    const container = document.getElementById('nfc-customer-website-content');
    if (!container) return;

    // Determine current active card for preview
    const select = document.getElementById('vicard-website-card-select');
    const selectedId = select ? select.value : '';
    let card = vicardData.cards[selectedId];

    if (!card) {
        const cards = Object.values(vicardData.cards || {});
        if (cards.length > 0) {
            card = cards[0];
        } else {
            card = {
                id: 'VIC-NONE',
                name: 'VIP Member',
                phone: '',
                tier: 'Black VIP',
                status: 'active',
                visitsCount: 0,
                totalSavings: 0
            };
        }
    }

    // Populate card selector options
    if (select) {
        const cards = Object.values(vicardData.cards || {});
        if (cards.length === 0) {
            select.innerHTML = `<option value="VIC-NONE">Demo VIP Member (No cards issued yet)</option>`;
        } else {
            select.innerHTML = cards.map(c => `
                <option value="${c.id}" ${c.id === card.id ? 'selected' : ''}>
                    ${escapeHtml(c.name)} (${c.id}) — ${c.status === 'active' ? '🟢 Active' : '🔴 Deactivated'}
                </option>
            `).join('');
        }
    }

    const rests = Object.values(vicardData.restaurants || {}).filter(r => r.active !== false);

    // If viewing a specific restaurant menu
    if (activeWebsiteRestId && vicardData.restaurants[activeWebsiteRestId]) {
        container.innerHTML = generateRestaurantMenuWebsiteHtml(vicardData.restaurants[activeWebsiteRestId], card);
    } else {
        container.innerHTML = generateRestaurantsDirectoryWebsiteHtml(rests, card);
    }
}
window.renderCustomerWebsite = renderCustomerWebsite;

// Main Directory Website HTML (Hungerstation / Keeta Style)
function generateRestaurantsDirectoryWebsiteHtml(rests, card) {
    const isActive = card && card.status === 'active';

    // Apply Search and Category Filters
    let filteredRests = rests.filter(r => {
        // Category filter
        if (vicardActiveCategory === 'burgers') {
            const cat = (r.category || '').toLowerCase();
            const name = (r.name || '').toLowerCase();
            if (!cat.includes('burger') && !name.includes('burger') && !cat.includes('grill')) return false;
        } else if (vicardActiveCategory === 'fresh') {
            const cat = (r.category || '').toLowerCase();
            const name = (r.name || '').toLowerCase();
            if (!cat.includes('fruit') && !cat.includes('juice') && !cat.includes('fresh') && !name.includes('fresh')) return false;
        } else if (vicardActiveCategory === 'meats') {
            const cat = (r.category || '').toLowerCase();
            const name = (r.name || '').toLowerCase();
            if (!cat.includes('meat') && !cat.includes('steak') && !cat.includes('bbq') && !name.includes('meat')) return false;
        } else if (vicardActiveCategory === 'deals') {
            const units = Array.isArray(r.units) ? r.units : [];
            const hasBigDiscount = units.some(u => (u.discount || '').includes('30%') || (u.discount || '').includes('28%') || (u.discount || '').includes('29%') || (u.discount || '').includes('27%') || (u.discount || '').includes('26%'));
            if (!hasBigDiscount && units.length < 2) return false;
        }

        // Search Query filter
        if (vicardSearchQuery) {
            const q = vicardSearchQuery;
            const matchName = (r.name || '').toLowerCase().includes(q);
            const matchCat = (r.category || '').toLowerCase().includes(q);
            const matchLoc = (r.location || '').toLowerCase().includes(q);
            const units = Array.isArray(r.units) ? r.units : [];
            const matchUnit = units.some(u => (u.name || '').toLowerCase().includes(q) || (u.description || '').toLowerCase().includes(q));
            if (!matchName && !matchCat && !matchLoc && !matchUnit) return false;
        }

        return true;
    });

    const filteredRestsHtml = filteredRests.length === 0 ? `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: rgba(255,255,255,0.02); border-radius: 20px; border: 1px dashed rgba(255,255,255,0.1);">
            <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
            <h3 style="color: #fff; font-size: 1.3rem; font-weight: 800; margin: 0 0 8px 0;">No Matching Restaurants</h3>
            <p style="color: #94a3b8; font-size: 0.95rem; margin: 0 0 16px 0;">Try adjusting your search terms or filter category.</p>
            <button type="button" onclick="clearVicardSearch(); filterVicardCategory('all');" class="btn-neutral" style="padding: 8px 18px; border-radius: 12px; font-weight: 700; cursor: pointer;">
                Reset Filters
            </button>
        </div>
    ` : filteredRests.map(r => {
        const units = Array.isArray(r.units) ? r.units : [];
        const topDiscount = units.length > 0 && units[0].discount ? units[0].discount : '25% OFF';
        const featuredDeal = units.length > 0 ? units[0] : null;
        const featuredDealTitle = featuredDeal ? featuredDeal.name : (r.offers && r.offers[0] ? r.offers[0].title : 'Exclusive VIP Member Privileges');
        const featuredDealSub = featuredDeal && featuredDeal.offerPrice ? `VIP Price: SAR ${featuredDeal.offerPrice} ${featuredDeal.originalPrice ? '(was SAR ' + featuredDeal.originalPrice + ')' : ''}` : 'Show pass at checkout';

        const tierCheck = checkTierEligibility(card ? card.tier : null, r.eligibleTiers);
        const isTierLocked = !tierCheck.eligible;
        const isNotAvailableRightNow = isTierLocked && tierCheck.isLowestRankUnchecked;

        const coverSrc = r.cover || (r.name.toLowerCase().includes('burger') ? 'burgeroov_cover.jpg' : (r.name.toLowerCase().includes('fresh') ? 'mvcfresh_cover.jpg' : (r.name.toLowerCase().includes('meat') ? 'mvcmeat_cover.jpg' : 'burgeroov_cover.jpg')));

        return `
            <div class="keeta-card" onclick="previewRestaurantOnCustomerSite('${r.id}')" style="${isTierLocked ? 'position: relative;' : ''}">
                <!-- Cover Image Container (16:9 ratio) -->
                <div class="keeta-card-media">
                    <img src="${coverSrc}" class="keeta-card-img" alt="${escapeHtml(r.name)}" onerror="this.src='burgeroov_cover.jpg'">
                    <div class="keeta-card-gradient"></div>

                    <!-- Overlaid Badges (Hungerstation / Keeta style) -->
                    <div class="keeta-badge-top-left">
                        ${isNotAvailableRightNow
                            ? `<span class="keeta-promo-badge" style="background: rgba(235, 77, 75, 0.95); border: 1px solid #eb4d4b; color: #fff;">Not Available Right Now</span>`
                            : (isTierLocked
                                ? `<span class="keeta-promo-badge" style="background: rgba(235, 77, 75, 0.9); border: 1px solid #eb4d4b; color: #fff;">Requires ${tierCheck.requiredTierNames.join(' or ')}</span>`
                                : (r.eligibleTiers && r.eligibleTiers.length > 0
                                    ? `<span class="keeta-promo-badge" style="background: linear-gradient(135deg, rgba(212,175,55,0.4), rgba(212,175,55,0.15)); border: 1px solid #d4af37; color: #f5d77f;">👑 VIP Unlocked</span>`
                                    : `<span class="keeta-promo-badge">🔥 ${escapeHtml(topDiscount)} with VICard</span>`))}
                    </div>
                    <div class="keeta-badge-top-right">
                        <span class="keeta-rating-badge">⭐ ${r.rating || '4.9'} <span class="keeta-reviews-count">(${r.reviews || '350+'})</span></span>
                    </div>
                    <div class="keeta-badge-bottom-left">
                        <span class="keeta-info-chip">📍 ${escapeHtml(r.location || 'Riyadh')}</span>
                    </div>
                    <div class="keeta-badge-bottom-right">
                        <span class="keeta-verified-chip">🛡️ Verified Partner</span>
                    </div>
                </div>

                <!-- Card Body -->
                <div class="keeta-card-content">
                    <!-- Logo & Title Row -->
                    <div class="keeta-card-header">
                        <div class="keeta-card-logo">
                            ${r.logo && (r.logo.startsWith('http') || r.logo.startsWith('data:') || r.logo.endsWith('.png') || r.logo.endsWith('.jpg'))
                                ? `<img src="${r.logo}" alt="${escapeHtml(r.name)}" style="width:100%; height:100%; object-fit:cover;">`
                                : (r.logo || '🍽️')}
                        </div>
                        <div class="keeta-card-titles">
                            <div class="keeta-card-name-row">
                                <h3 class="keeta-card-name">${escapeHtml(r.name)}</h3>
                                <span class="keeta-open-badge">● Open</span>
                            </div>
                            <div class="keeta-card-category">${escapeHtml(r.category || 'Gourmet Dining')}</div>
                        </div>
                    </div>

                    <!-- Featured Deal Highlight Box (Keeta Signature) -->
                    <div class="keeta-deal-highlight">
                        <div class="keeta-deal-icon">🎟️</div>
                        <div class="keeta-deal-text">
                            <strong>${escapeHtml(featuredDealTitle)}</strong>
                            <span>${escapeHtml(featuredDealSub)}</span>
                        </div>
                        <div class="keeta-deal-savings">${escapeHtml(topDiscount)}</div>
                    </div>

                    <!-- Action Button Row -->
                    <div class="keeta-card-footer">
                        <div class="keeta-units-count">
                            <span>🍽️</span> <strong>${units.length}</strong> Exclusive Deals Available
                        </div>
                        <button type="button" class="keeta-view-btn ${isNotAvailableRightNow ? 'unavailable' : (isTierLocked ? 'locked' : '')}" ${isTierLocked ? 'style="background: rgba(235, 77, 75, 0.15); color: #fca5a5; border: 1px solid rgba(235, 77, 75, 0.35);"' : ''}>
                            <span>${isNotAvailableRightNow ? 'Not Available' : (isTierLocked ? `${tierCheck.requiredTierNames[0] || 'VIP'} Only` : 'View Menu')}</span>
                            ${(!isNotAvailableRightNow && !isTierLocked) ? '<span class="keeta-arrow">➔</span>' : ''}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="keeta-customer-app">
            <!-- 1. Keeta/Hungerstation Top App Bar -->
            <header class="keeta-header">
                <div class="keeta-header-left">
                    <div class="keeta-brand-logo">
                        <img src="front_card.png?v=310" alt="VICard" class="keeta-brand-card-img">
                        <div>
                            <div class="keeta-brand-title">VICard <span class="keeta-brand-vip-badge">VIP</span></div>
                        </div>
                    </div>
                </div>

                <div class="keeta-header-right">
                    <div class="keeta-location-pill">
                        <span>📍</span>
                        <span>Riyadh, Saudi Arabia</span>
                    </div>

                    <div class="keeta-member-chip">
                        <div class="keeta-member-avatar">${isActive ? '👑' : '⚠️'}</div>
                        <div class="keeta-member-info">
                            <div class="keeta-member-name">${escapeHtml(card.name)}</div>
                            <div class="keeta-member-id">${card.id} • <span style="color:${isActive ? '#10b981' : '#ef4444'}; font-weight:800;">${isActive ? 'ACTIVE' : 'SUSPENDED'}</span> • <span style="color:#f5d77f; font-weight:800;">${escapeHtml(card.tier || 'Black VIP')}</span></div>
                        </div>
                    </div>
                </div>
            </header>

            <!-- 2. Hero Story Banner (using generated vicard_banner.jpg or custom config) -->
            ${(() => {
                const b = vicardData.bannerConfig || {};
                const badge = b.badge || '✨ EXCLUSIVE VIP PRIVILEGES';
                const title = b.title || 'Unlock Secret Menus & Up to 40% OFF';
                const sub = b.subtitle || "Show your physical VICard NFC card or generate instant QR verification passes at Riyadh's top partner dining spots.";
                const btn = b.btnText || '';
                return `
                <div class="keeta-hero-banner">
                    <img src="vicard_banner.jpg" class="keeta-hero-img" alt="VICard VIP Privileges" onerror="this.style.display='none'">
                    <div class="keeta-hero-overlay">
                        <div class="keeta-hero-badge">${escapeHtml(badge)}</div>
                        <h1 class="keeta-hero-heading">${escapeHtml(title)}</h1>
                        <p class="keeta-hero-text">${escapeHtml(sub)}</p>
                        <div class="keeta-hero-stats">
                            <span class="keeta-stat-tag">🏆 ${rests.length} Premier Flagships</span>
                            <span class="keeta-stat-tag">⚡ Instant Cashier Pass</span>
                            <span class="keeta-stat-tag">💰 Guaranteed Savings</span>
                            ${btn ? `<span class="keeta-stat-tag" style="background: rgba(212,175,55,0.3); color: #f5d77f; border-color: rgba(212,175,55,0.6);">${escapeHtml(btn)}</span>` : ''}
                        </div>
                    </div>
                </div>
                `;
            })()}

            <!-- 3. Toolbar: Search + Category Carousel (Keeta / Hungerstation Signature) -->
            <div class="keeta-toolbar">
                <div class="keeta-search-wrapper">
                    <span class="keeta-search-icon">🔍</span>
                    <input type="text" id="vicard-site-search" class="keeta-search-input"
                        placeholder="Search restaurants, smash burgers, prime steaks, cold juices..."
                        value="${escapeHtml(vicardSearchQuery)}"
                        oninput="handleVicardSearchInput(this.value)">
                    ${vicardSearchQuery ? `<button type="button" class="keeta-search-clear" onclick="clearVicardSearch()">✕</button>` : ''}
                </div>

                <div class="keeta-category-carousel">
                    <button type="button" class="keeta-cat-pill ${vicardActiveCategory === 'all' ? 'active' : ''}" onclick="filterVicardCategory('all')">
                        <span>🔥</span> All Partners (${rests.length})
                    </button>
                    <button type="button" class="keeta-cat-pill ${vicardActiveCategory === 'burgers' ? 'active' : ''}" onclick="filterVicardCategory('burgers')">
                        <span>🍔</span> Burgers & Grills
                    </button>
                    <button type="button" class="keeta-cat-pill ${vicardActiveCategory === 'fresh' ? 'active' : ''}" onclick="filterVicardCategory('fresh')">
                        <span>🥗</span> Fresh Juices & Fruits
                    </button>
                    <button type="button" class="keeta-cat-pill ${vicardActiveCategory === 'meats' ? 'active' : ''}" onclick="filterVicardCategory('meats')">
                        <span>🥩</span> Butchery & Steaks
                    </button>
                    <button type="button" class="keeta-cat-pill ${vicardActiveCategory === 'deals' ? 'active' : ''}" onclick="filterVicardCategory('deals')">
                        <span>🏷️</span> Top Deals (25%+ OFF)
                    </button>
                </div>
            </div>

            <!-- 4. Section Title -->
            <div class="keeta-section-header">
                <div>
                    <h2 class="keeta-section-title">Verified Partner Restaurants</h2>
                    <p class="keeta-section-subtitle">Tap any partner to view available menu units and generate cashier verification passes</p>
                </div>
                <div class="keeta-partners-count">${filteredRests.length} Partners</div>
            </div>

            <!-- 5. Restaurant Cards Grid -->
            <div class="keeta-restaurants-grid">
                ${filteredRestsHtml}
            </div>
        </div>
    `;
}

// Restaurant Menu Website HTML (Keeta / Hungerstation Storefront View)
function generateRestaurantMenuWebsiteHtml(restaurant, card) {
    const isActive = card && card.status === 'active';
    const tierCheck = checkTierEligibility(card ? card.tier : null, restaurant.eligibleTiers);
    const isTierLocked = !tierCheck.eligible;
    const isNotAvailableRightNow = isTierLocked && tierCheck.isLowestRankUnchecked;

    const units = Array.isArray(restaurant.units) && restaurant.units.length > 0
        ? restaurant.units
        : (Array.isArray(restaurant.offers) ? restaurant.offers.map(off => ({
            id: off.id || 'off_def',
            name: off.title,
            image: restaurant.logo,
            originalPrice: 0,
            offerPrice: off.discount || 'VIP',
            discount: off.discount,
            description: off.description
        })) : []);

    const coverSrc = restaurant.cover || (restaurant.name.toLowerCase().includes('burger') ? 'burgeroov_cover.jpg' : (restaurant.name.toLowerCase().includes('fresh') ? 'mvcfresh_cover.jpg' : (restaurant.name.toLowerCase().includes('meat') ? 'mvcmeat_cover.jpg' : 'burgeroov_cover.jpg')));

    return `
        <div class="keeta-menu-page">
            <!-- Sticky Sub-Nav -->
            <div class="keeta-menu-nav">
                <button type="button" class="keeta-back-btn" onclick="viewAllRestaurantsOnWebsite()">
                    <span>←</span> Back to All Restaurants
                </button>
                <div class="keeta-menu-nav-title">${escapeHtml(restaurant.name)}</div>
                <div class="keeta-menu-nav-tag">VIP Member Pass</div>
            </div>

            <!-- Restaurant Hero Banner -->
            <div class="keeta-storefront-hero">
                <img src="${coverSrc}" class="keeta-storefront-bg" onerror="this.src='burgeroov_cover.jpg'">
                <div class="keeta-storefront-overlay"></div>
                <div class="keeta-storefront-details">
                    <div class="keeta-storefront-logo">
                        ${restaurant.logo && (restaurant.logo.startsWith('http') || restaurant.logo.startsWith('data:') || restaurant.logo.endsWith('.png') || restaurant.logo.endsWith('.jpg'))
                            ? `<img src="${restaurant.logo}" alt="${escapeHtml(restaurant.name)}" style="width:100%; height:100%; object-fit:cover;">`
                            : (restaurant.logo || '🍽️')}
                    </div>
                    <div class="keeta-storefront-info">
                        <div class="keeta-storefront-title-row">
                            <h1 class="keeta-storefront-title">${escapeHtml(restaurant.name)}</h1>
                            <span class="keeta-storefront-badge">🛡️ Official VIP Partner</span>
                        </div>
                        <div class="keeta-storefront-meta">
                            <span>⭐ ${restaurant.rating || '4.9'} (${restaurant.reviews ? (restaurant.reviews.includes('review') ? restaurant.reviews : restaurant.reviews + (restaurant.reviews.endsWith('+') ? ' reviews' : ' reviews')) : '350+ reviews'})</span>
                            <span>•</span>
                            <span>${escapeHtml(restaurant.category || 'Gourmet Dining')}</span>
                            ${restaurant.location ? `<span>•</span><span>📍 ${escapeHtml(restaurant.location)}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Locked Tier Banner if Customer Rank is insufficient -->
            ${isNotAvailableRightNow ? `
                <div class="vicard-tier-banner-msg" style="margin: 16px 20px 0; padding: 16px 20px; border-radius: 16px; background: rgba(235,77,75,0.16); border: 1.5px solid rgba(235,77,75,0.45); color: #fff; display: flex; align-items: center; gap: 14px; box-shadow: 0 8px 24px rgba(235,77,75,0.15);">
                    <div>
                        <h3 style="margin: 0 0 4px 0; font-size: 1.05rem; font-weight: 800; color: #fca5a5;">This restaurant is not available right now</h3>
                        <div style="font-size: 0.85rem; color: #cbd5e0; line-height: 1.4;">هذا المطعم غير متاح حالياً لعضويتك. Offers and menu discounts for ${escapeHtml(restaurant.name)} are currently not available for your membership tier.</div>
                    </div>
                </div>
            ` : (isTierLocked ? `
                <div class="vicard-tier-banner-msg" style="margin: 16px 20px 0; padding: 14px 18px; border-radius: 14px; background: rgba(235,77,75,0.12); border: 1.5px solid rgba(235,77,75,0.4); color: #fca5a5; font-size: 0.88rem; display: flex; align-items: center; gap: 12px;">
                    <div>
                        <strong style="color: #fff; font-size: 0.95rem;">Exclusive Partner Tier Requirement</strong>
                        <div style="margin-top: 3px; line-height: 1.4;">This partner's offers require <strong>${tierCheck.requiredTierNames.join(' or ')}</strong> (Rank ${tierCheck.minRequiredRank}+). Your card has <strong>${card ? card.tier : 'None'}</strong> (Rank ${tierCheck.customerRank}). All higher tiers automatically unlock lower-tier offers!</div>
                    </div>
                </div>
            ` : (restaurant.eligibleTiers && restaurant.eligibleTiers.length > 0 ? `
                <div class="vicard-tier-banner-msg" style="margin: 16px 20px 0; padding: 12px 18px; border-radius: 14px; background: rgba(212,175,55,0.1); border: 1.5px solid rgba(212,175,55,0.35); color: #f5d77f; font-size: 0.88rem; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.4rem;">👑</span>
                    <div>
                        <strong style="color: #fff;">VIP Privilege Unlocked:</strong> Your tier (<strong>${card ? card.tier : 'VIP'}</strong>) meets the requirement for ${escapeHtml(restaurant.name)}!
                    </div>
                </div>
            ` : ''))}

            <!-- Keeta-Style Menu Dishes List (Horizontal Cards) -->
            <div class="keeta-dishes-section">
                <div class="keeta-section-title-wrap">
                    <h2 class="keeta-dishes-heading">Exclusive VICard Specials & Combos</h2>
                    <div class="keeta-dishes-sub">Select any item to unlock your verification QR code for the cashier</div>
                </div>

                <div class="keeta-dishes-grid">
                    ${units.length === 0 ? `
                        <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; background: rgba(255,255,255,0.02); border-radius: 18px; border: 1px dashed rgba(255,255,255,0.1);">
                            <div style="font-size: 2.5rem; margin-bottom: 10px;">🍲</div>
                            <div style="color: #fff; font-size: 1.1rem; font-weight: 700;">No menu units currently available</div>
                            <div style="color: #94a3b8; font-size: 0.85rem; margin-top: 4px;">Please check back later or choose another partner restaurant.</div>
                        </div>
                    ` : units.map((u, uIdx) => {
                        const dishImg = u.image || coverSrc;
                        const safeCardId = String((card && card.id) || '').replace(/'/g, "\\'");
                        const safeRestId = String((restaurant && restaurant.id) || '').replace(/'/g, "\\'");
                        const safeUnitId = String(u.id || ('unit_' + uIdx)).replace(/'/g, "\\'");
                        return `
                            <div class="keeta-dish-card" onclick="handleApplyUnitOffer('${safeCardId}', '${safeRestId}', '${safeUnitId}')" style="cursor:pointer;">
                                <div class="keeta-dish-main">
                                    <div class="keeta-dish-info">
                                        <div class="keeta-dish-badge-row">
                                            <span class="keeta-dish-vip-tag">VICARD EXCLUSIVE</span>
                                            ${u.discount ? `<span class="keeta-dish-discount-tag">${escapeHtml(u.discount)}</span>` : ''}
                                        </div>
                                        <h3 class="keeta-dish-name">${escapeHtml(u.name)}</h3>
                                        ${u.description ? `<p class="keeta-dish-desc">${escapeHtml(u.description)}</p>` : ''}
                                        
                                        <div class="keeta-dish-price-row">
                                            <span class="keeta-price-offer">SAR ${u.offerPrice}</span>
                                            ${u.originalPrice ? `<span class="keeta-price-orig">SAR ${u.originalPrice}</span>` : ''}
                                            <span class="keeta-price-label">VIP Price</span>
                                        </div>
                                    </div>

                                    <div class="keeta-dish-visual">
                                        <div class="keeta-dish-img-wrap" onclick="event.stopPropagation(); openVicardImageLightbox('${dishImg}', '${escapeHtml(u.name)}')" title="🔍 Click to zoom photo" style="cursor: zoom-in;">
                                            <img src="${dishImg}" class="keeta-dish-img" alt="${escapeHtml(u.name)}" onerror="this.src='burgeroov_cover.jpg'">
                                        </div>
                                        <button type="button" class="keeta-dish-redeem-btn ${isNotAvailableRightNow ? 'unavailable' : (isTierLocked ? 'locked' : '')}" onclick="event.stopPropagation(); handleApplyUnitOffer('${safeCardId}', '${safeRestId}', '${safeUnitId}')">
                                            <span>${isNotAvailableRightNow ? 'Not Available' : (isTierLocked ? 'Locked' : 'Get Offer')}</span>
                                            ${(!isNotAvailableRightNow && !isTierLocked) ? '<span class="keeta-btn-plus">+</span>' : ''}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

// --- FULL-SCREEN DISH & RESTAURANT IMAGE LIGHTBOX ZOOM MODAL ---
function openVicardImageLightbox(imgUrl, title) {
    if (!imgUrl) return;
    const modal = document.getElementById('vicard-image-lightbox-modal');
    const img = document.getElementById('vicard-lightbox-img');
    const caption = document.getElementById('vicard-lightbox-caption');
    if (!modal || !img) return;

    img.src = imgUrl;
    if (caption) caption.textContent = title || '';
    modal.style.display = 'flex';
}
window.openVicardImageLightbox = openVicardImageLightbox;

function closeVicardImageLightbox() {
    const modal = document.getElementById('vicard-image-lightbox-modal');
    if (modal) modal.style.display = 'none';
}
window.closeVicardImageLightbox = closeVicardImageLightbox;

if (typeof window !== 'undefined' && !window._vicardEscListenerAttached) {
    window._vicardEscListenerAttached = true;
    window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeVicardImageLightbox();
            closeVicardRedeemModal();
        }
    });
}

// --- APPLY OFFER & GENERATE VERIFICATION QR CODE ---
function handleApplyUnitOffer(cardId, restId, unitId) {
    let card = (vicardData && vicardData.cards) ? vicardData.cards[cardId] : null;
    if (!card) {
        const urlParams = new URLSearchParams(window.location.search);
        const urlCardId = urlParams.get('vicard');
        if (urlCardId && vicardData && vicardData.cards && vicardData.cards[urlCardId]) {
            card = vicardData.cards[urlCardId];
        } else {
            card = {
                id: cardId || urlCardId || 'VIC-MEMBER',
                name: 'VIP Member',
                status: 'active',
                tier: 'Black VIP'
            };
        }
    }

    let rest = (vicardData && vicardData.restaurants) ? vicardData.restaurants[restId] : null;
    if (!rest) {
        const defaults = {
            'rest_burgeroov': { id: 'rest_burgeroov', name: 'Burgeroov', logo: 'burgeroov.png', units: [
                { id: 'unit_b1', name: 'Double Truffle Smash Burger Combo', offerPrice: 42, originalPrice: 58 },
                { id: 'unit_b2', name: 'Crispy Chicken Supreme Meal', offerPrice: 35, originalPrice: 49 },
                { id: 'unit_b3', name: 'Gourmet Belgian Chocolate Shake', offerPrice: 15, originalPrice: 26 }
            ]},
            'rest_mvcfresh': { id: 'rest_mvcfresh', name: 'MVC Fresh', logo: 'mvcfresh.png', units: [
                { id: 'unit_f1', name: 'Exotic Tropical Fruit Basket (Large)', offerPrice: 99, originalPrice: 140 }
            ]},
            'rest_mvcmeat': { id: 'rest_mvcmeat', name: 'MVC Meat Market', logo: 'mvcmeat.png', units: [
                { id: 'unit_m1', name: 'Japanese Wagyu A5 Ribeye Steak (300g)', offerPrice: 199, originalPrice: 280 }
            ]}
        };
        rest = defaults[restId] || { id: restId, name: 'Partner Restaurant', units: [] };
    }

    // Find unit details
    let unit = null;
    if (Array.isArray(rest.units)) {
        unit = rest.units.find((u, idx) => u.id === unitId || ('unit_' + idx) === unitId || u.name === unitId);
    }
    if (!unit && Array.isArray(rest.offers)) {
        const off = rest.offers.find((o, idx) => o.id === unitId || ('off_' + idx) === unitId || o.title === unitId);
        if (off) {
            unit = {
                id: off.id || unitId,
                name: off.title,
                offerPrice: off.discount || 'VIP',
                image: rest.logo
            };
        }
    }
    if (!unit) {
        unit = {
            id: unitId || 'unit_vip',
            name: typeof unitId === 'string' && unitId ? unitId : 'VIP Dining Offer',
            offerPrice: 'Special',
            image: rest.logo
        };
    }

    // Check card status
    if (card && card.status && card.status !== 'active') {
        showVicardDeactivatedAlert(card || { id: cardId, name: 'Cardholder' });
        return;
    }

    // Check tier eligibility! Higher tier gets all lower tier offers!
    const tierCheck = checkTierEligibility(card ? card.tier : null, rest ? rest.eligibleTiers : null);
    if (!tierCheck.eligible) {
        if (tierCheck.isLowestRankUnchecked) {
            alert(`🚫 This restaurant is not available right now.\n\nهذا المطعم غير متاح حالياً.\n\nExclusive offers and discounts at ${rest ? rest.name : 'this restaurant'} are currently not available for your membership tier (${card ? card.tier : 'Member'}).`);
        } else {
            alert(`🔒 Exclusive VIP Partner Offer!\n\nOffers at ${rest ? rest.name : 'this restaurant'} are reserved for ${tierCheck.requiredTierNames.join(' or ')} members and higher (Rank ${tierCheck.minRequiredRank}+).\n\nYour current card tier: ${card ? card.tier : 'None'} (Rank ${tierCheck.customerRank}).\n\nPlease upgrade your membership to unlock this exclusive dining offer!`);
        }
        return;
    }

    // Open QR pass modal
    openVicardUnitQrModal(card, rest, unit);
}
window.handleApplyUnitOffer = handleApplyUnitOffer;

function showVicardDeactivatedAlert(card) {
    alert(`❌ Card Deactivated!\n\nVICard (${card.id}) for ${card.name} is currently suspended.\n\nOffers and menu discounts cannot be applied until reactivated by club management.`);
}

var _vicardRedeemModalOriginalHtml = null;
var _vicardRedeemRef = null;
var _vicardRedeemListener = null;

function showVicardDiscountSuccessMessage(data, card, rest, unit) {
    const modal = document.getElementById('vicard-redeem-modal');
    if (!modal) return;
    const contentEl = modal.querySelector('.modal-content');
    if (!contentEl) return;

    if (_vicardRedeemTimerInterval) {
        clearInterval(_vicardRedeemTimerInterval);
        _vicardRedeemTimerInterval = null;
    }

    const restName = (data && data.restName) || (rest && rest.name) || 'Partner Restaurant';
    const discountAmount = data && typeof data.discountAmount === 'number' ? data.discountAmount : (data && data.savings ? data.savings : 0);
    const itemName = (data && data.unitName) || (unit && unit.name) || 'Special Offer';

    contentEl.innerHTML = `
        <div class="vicard-congrats-card" style="padding: 12px 6px 8px 6px; text-align: center; animation: vicardPopIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
            <div style="display: flex; justify-content: flex-end; margin-bottom: 2px;">
                <button type="button" onclick="closeVicardRedeemModal()" style="background: none; border: none; color: #94a3b8; font-size: 1.4rem; cursor: pointer; padding: 4px;">✖</button>
            </div>

            <!-- Animated Celebration Icon -->
            <div style="font-size: 3.8rem; line-height: 1; margin: 4px 0 14px 0; animation: vicardBounce 0.9s infinite alternate ease-in-out;">
                🎉
            </div>

            <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(46, 213, 115, 0.15); border: 1px solid rgba(46, 213, 115, 0.45); color: #2ed573; padding: 4px 14px; border-radius: 20px; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;">
                <span>✅</span> Verified by Cashier
            </div>

            <h2 style="font-size: 1.65rem; font-weight: 900; color: #f5d77f; margin: 0 0 8px 0; text-shadow: 0 0 25px rgba(212,175,55,0.45); letter-spacing: -0.3px;">
                Enjoy your discount!
            </h2>

            <p style="font-size: 0.92rem; color: #cbd5e1; margin: 0 0 16px 0; line-height: 1.45;">
                Your VIP discount has been successfully verified & applied at <strong style="color: #ffffff;">${escapeHtml(restName)}</strong>.
            </p>

            ${discountAmount > 0 ? `
                <div style="background: linear-gradient(135deg, rgba(46, 213, 115, 0.16) 0%, rgba(16, 185, 129, 0.05) 100%); border: 1.5px solid rgba(46, 213, 115, 0.4); border-radius: 16px; padding: 14px 18px; margin-bottom: 16px; box-shadow: 0 4px 18px rgba(46, 213, 115, 0.15);">
                    <div style="font-size: 0.75rem; color: #a7f3d0; text-transform: uppercase; font-weight: 800; letter-spacing: 0.6px;">You Saved Today</div>
                    <div style="font-size: 1.7rem; font-weight: 900; color: #2ed573; margin-top: 2px;">SAR ${discountAmount}</div>
                </div>
            ` : ''}

            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 10px 14px; margin-bottom: 18px; font-size: 0.82rem; color: #94a3b8; display: flex; justify-content: space-around; align-items: center;">
                <div>
                    <span style="display: block; font-size: 0.7rem; color: #64748b;">ITEM</span>
                    <strong style="color: #fff; font-size: 0.82rem;">${escapeHtml(itemName)}</strong>
                </div>
                <div style="width: 1px; height: 24px; background: rgba(255,255,255,0.1);"></div>
                <div>
                    <span style="display: block; font-size: 0.7rem; color: #64748b;">MEMBER CARD</span>
                    <strong style="color: #f5d77f; font-family: monospace;">${card ? card.id : ''}</strong>
                </div>
            </div>

            <button type="button" onclick="closeVicardRedeemModal()" style="width: 100%; padding: 14px; border-radius: 14px; font-size: 1rem; font-weight: 800; background: linear-gradient(135deg, #d4af37 0%, #aa771c 100%); color: #000; border: none; cursor: pointer; box-shadow: 0 6px 20px rgba(212,175,55,0.4); transition: transform 0.15s ease;">
                Awesome, Thank You! ✨
            </button>
        </div>
    `;

    // Also update customer stats in memory and in UI if portal is active
    if (card) {
        card.visitsCount = (card.visitsCount || 0) + 1;
        if (discountAmount > 0) card.totalSavings = (card.totalSavings || 0) + discountAmount;
    }
}
window.showVicardDiscountSuccessMessage = showVicardDiscountSuccessMessage;

function openVicardUnitQrModal(card, rest, unit) {
    const modal = document.getElementById('vicard-redeem-modal');
    if (!modal) {
        console.error('vicard-redeem-modal not found!');
        return;
    }

    // Move modal directly to document.body to break free from any stacking contexts
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    // Ensure maximum z-index so it immediately pops up on top of the customer portal overlay
    modal.style.setProperty('z-index', '100000000', 'important');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';

    // Cache or restore original modal content so we can re-open fresh after celebration
    const contentEl = modal.querySelector('.modal-content');
    if (!_vicardRedeemModalOriginalHtml && contentEl) {
        _vicardRedeemModalOriginalHtml = contentEl.innerHTML;
    } else if (_vicardRedeemModalOriginalHtml && contentEl) {
        contentEl.innerHTML = _vicardRedeemModalOriginalHtml;
    }

    const restNameEl = document.getElementById('vicard-redeem-rest-name');
    const offerTitleEl = document.getElementById('vicard-redeem-offer-title');
    const custNameEl = document.getElementById('vicard-redeem-customer-name');
    const cardIdEl = document.getElementById('vicard-redeem-card-id');
    const custTierEl = document.getElementById('vicard-redeem-customer-tier');
    const qrContainer = document.getElementById('vicard-redeem-qrcode');
    const timerEl = document.getElementById('vicard-redeem-timer');

    if (restNameEl) restNameEl.textContent = rest.name || 'Partner Restaurant';
    if (offerTitleEl) offerTitleEl.textContent = `${unit.name} (SAR ${unit.offerPrice})`;
    if (custNameEl) custNameEl.textContent = card.name || 'VIP Member';
    if (cardIdEl) cardIdEl.textContent = card.id;
    if (custTierEl) custTierEl.textContent = `👑 ${card.tier || 'VIP Member'}`;

    // Verification URL pointing to the cashier verification screen
    const verifyUrl = buildVerificationUrl(card.id, rest.id, unit.id || unit.name);

    if (qrContainer) {
        qrContainer.innerHTML = '';
        if (typeof QRCode !== 'undefined') {
            try {
                new QRCode(qrContainer, {
                    text: verifyUrl,
                    width: 220,
                    height: 220,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            } catch (e) {
                qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(verifyUrl)}" style="width:220px; height:220px; border-radius:8px;" alt="QR Code">`;
            }
        } else {
            qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(verifyUrl)}" style="width:220px; height:220px; border-radius:8px;" alt="QR Code">`;
        }
    }

    // Start 5-minute countdown timer
    let secondsLeft = 300;
    if (_vicardRedeemTimerInterval) clearInterval(_vicardRedeemTimerInterval);
    _vicardRedeemTimerInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
            clearInterval(_vicardRedeemTimerInterval);
            closeVicardRedeemModal();
            alert('⚠️ Verification QR code expired. Please tap "Get Offer" again.');
            return;
        }
        const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
        const secs = String(secondsLeft % 60).padStart(2, '0');
        if (timerEl) timerEl.textContent = `${mins}:${secs}`;
    }, 1000);

    // Attach realtime Firebase listener so customer phone automatically celebrates when cashier confirms
    const modalOpenedAt = Date.now();
    if (_vicardRedeemListener && _vicardRedeemRef) {
        try { _vicardRedeemRef.off('value', _vicardRedeemListener); } catch (e) {}
        _vicardRedeemListener = null;
        _vicardRedeemRef = null;
    }

    if (typeof db !== 'undefined' && db && card && card.id) {
        _vicardRedeemRef = db.ref(`vicard_network/cards/${card.id}/lastRedemption`);
        _vicardRedeemListener = _vicardRedeemRef.on('value', snap => {
            const data = snap.val();
            if (data && data.timestamp && (data.timestamp >= modalOpenedAt - 3000)) {
                showVicardDiscountSuccessMessage(data, card, rest, unit);
            }
        });
    }

    modal.style.display = 'flex';
    // Push history state so phone back button goes 1 page behind (closes modal instead of app)
    try {
        history.pushState({ vicardApp: true, vicardView: 'redeem_modal' }, document.title);
    } catch (e) {}
}
window.openVicardUnitQrModal = openVicardUnitQrModal;

var _vicardIsClosingRedeemModal = false;

function closeVicardRedeemModal(fromHistory) {
    const modal = document.getElementById('vicard-redeem-modal');
    if (modal) modal.style.display = 'none';
    if (_vicardRedeemTimerInterval) {
        clearInterval(_vicardRedeemTimerInterval);
        _vicardRedeemTimerInterval = null;
    }

    // Cleanly detach Firebase realtime redemption listener
    if (_vicardRedeemListener && _vicardRedeemRef) {
        try { _vicardRedeemRef.off('value', _vicardRedeemListener); } catch (e) {}
        _vicardRedeemListener = null;
        _vicardRedeemRef = null;
    }

    // If closed via button click, pop history entry to keep phone back button synchronized
    // Mark _vicardIsClosingRedeemModal so popstate stays right on the restaurant page!
    if (!fromHistory) {
        try {
            if (history.state && history.state.vicardView === 'redeem_modal') {
                _vicardIsClosingRedeemModal = true;
                history.back();
            }
        } catch (e) {}
    }
}
window.closeVicardRedeemModal = closeVicardRedeemModal;

// --- PHONE HARDWARE / BROWSER BACK BUTTON NAVIGATION ENGINE ---
var _vicardLastBackPressTime = 0;
var _vicardHistoryInitialized = false;

function initVicardHistoryNavigation() {
    if (typeof window === 'undefined' || window._vicardHistoryListenerAttached) return;
    window._vicardHistoryListenerAttached = true;

    window.addEventListener('popstate', function(e) {
        // If popstate was triggered by closeVicardRedeemModal, ignore it so customer stays on restaurant page!
        if (_vicardIsClosingRedeemModal) {
            _vicardIsClosingRedeemModal = false;
            return;
        }

        const custOverlay = document.getElementById('vicard-customer-portal-overlay');
        const isOverlayOpen = custOverlay && custOverlay.style.display === 'block';

        if (!isOverlayOpen) return;

        const modal = document.getElementById('vicard-redeem-modal');
        const isModalOpen = modal && modal.style.display === 'flex';

        // 1. If QR redemption pass modal is open -> Close modal and stay on the restaurant menu!
        if (isModalOpen) {
            closeVicardRedeemModal(true);
            return;
        }

        // 2. If customer is viewing a restaurant menu -> Go back 1 page behind to the Main Page of Offers!
        if (activeWebsiteRestId) {
            viewAllRestaurantsOnWebsite(true);
            return;
        }

        // 3. If already on the Main Page of Offers -> Guard against suddenly closing the app on phone!
        const now = Date.now();
        if (now - _vicardLastBackPressTime < 2500) {
            // Second back press within 2.5s allows exit
            _vicardLastBackPressTime = 0;
            if (typeof currentUser !== 'undefined' && currentUser) {
                closeVicardCustomerPortal();
            } else {
                document.documentElement.classList.remove('vicard-standalone-view');
                if (custOverlay) custOverlay.style.display = 'none';
            }
        } else {
            // First back press on main directory: prevent sudden app exit & notify customer
            _vicardLastBackPressTime = now;
            try {
                history.pushState({ vicardApp: true, vicardView: 'directory' }, document.title);
            } catch (err) {}
            showVicardPortalToast('Press back again to exit • اضغط رجوع مرة أخرى للخروج', 2400);
        }
    });
}
window.initVicardHistoryNavigation = initVicardHistoryNavigation;

// --- CASHIER VERIFICATION OVERLAY & LOGGING ---
function checkVicardUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const verifyCardId = params.get('verify_vicard');
    let customerCardId = params.get('vicard');
    let key = params.get('key');

    if (!customerCardId && !verifyCardId) {
        if (params.has('menu') || params.has('portal') || params.has('vicard_menu')) {
            customerCardId = 'VIC-GUEST';
            key = 'guest';
        } else {
            // Check for active session (e.g. after address bar was cleaned or on page refresh)
            try {
                const sess = sessionStorage.getItem('vicard_active_session');
                if (sess) {
                    const parsed = JSON.parse(sess);
                    if (parsed && parsed.cardId) {
                        customerCardId = parsed.cardId;
                        key = parsed.key;
                    }
                }
            } catch (e) {}
        }
    }

    if (verifyCardId) {
        openVicardCashierScreen(verifyCardId, params.get('rest'), params.get('unit'));
    } else if (customerCardId) {
        if (customerCardId === 'true' || customerCardId === '1') {
            customerCardId = 'VIC-GUEST';
            key = key || 'guest';
        }
        openVicardCustomerPortal(customerCardId, key);
    }
}
window.checkVicardUrlParams = checkVicardUrlParams;

// Advanced 3D Floating & Spinning VICard VIP Loading Screen (with front_card.png & back_card.png)
function getVicard3DCardLoadingHtml(title, subtitle, arabicText) {
    const mainTitle = title || 'Authenticating VIP Membership...';
    const sub = subtitle || 'Connecting to encrypted VICard network';
    const arabic = arabicText || 'جاري استدعاء وتأكيد بطاقة العضوية المشفرة...';

    return `
        <div class="vicard-loading-screen-wrap">
            <!-- 3D Floating & Rotating Card -->
            <div class="vicard-3d-scene">
                <div class="vicard-3d-float">
                    <div class="vicard-3d-card-rotator">
                        <div class="vicard-3d-face front">
                            <div class="vicard-3d-glare"></div>
                        </div>
                        <div class="vicard-3d-face back">
                            <div class="vicard-3d-glare"></div>
                        </div>
                    </div>
                </div>
                <div class="vicard-3d-shadow"></div>
            </div>

            <!-- Loading status & Laser progress track -->
            <div class="vicard-loading-status-box">
                <div class="vicard-loading-laser-track">
                    <div class="vicard-loading-laser-bar"></div>
                </div>
                <h3 class="vicard-loading-title">${escapeHtml(mainTitle)}</h3>
                <div class="vicard-loading-desc">
                    <span class="vicard-loading-beacon"></span>
                    <span>${escapeHtml(sub)}</span>
                </div>
                <div class="vicard-loading-arabic">${escapeHtml(arabic)}</div>
            </div>
        </div>
    `;
}
window.getVicard3DCardLoadingHtml = getVicard3DCardLoadingHtml;

function openVicardCashierScreen(cardId, restId, unitId) {
    document.documentElement.classList.add('vicard-ready');
    const overlay = document.getElementById('vicard-cashier-overlay');
    if (!overlay) return;
    overlay.style.display = 'block';

    const card = (vicardData && vicardData.cards && vicardData.cards[cardId]) ? vicardData.cards[cardId] : {
        id: cardId,
        name: 'VIP Member',
        tier: 'VIP',
        status: 'active'
    };
    renderVicardCashierScreen(cardId, card, restId, unitId);
}
window.openVicardCashierScreen = openVicardCashierScreen;

function closeVicardCashierScreen() {
    const overlay = document.getElementById('vicard-cashier-overlay');
    if (overlay) overlay.style.display = 'none';
    // Clean URL without reload
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
}
window.closeVicardCashierScreen = closeVicardCashierScreen;

function renderVicardCashierScreen(cardId, card, restId, unitId) {
    const overlay = document.getElementById('vicard-cashier-overlay');
    if (!overlay) return;

    const rest = vicardData.restaurants[restId];
    let unitName = unitId || 'VIP Special Deal';
    if (rest && Array.isArray(rest.units)) {
        const found = rest.units.find(u => u.id === unitId || u.name === unitId);
        if (found) unitName = found.name;
    }
    const restTierCheck = card && rest ? checkTierEligibility(card.tier, rest.eligibleTiers) : { eligible: true };

    if (!card) {
        overlay.innerHTML = `
            <div style="max-width:480px; margin:40px auto; padding:20px; direction:ltr; text-align:left;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <span style="font-size:1.1rem; font-weight:800; color:#fff;">Restaurant Cashier Verification 🛡️</span>
                    <button type="button" onclick="closeVicardCashierScreen()" style="background:rgba(255,255,255,0.1); border:none; color:#fff; border-radius:20px; padding:6px 14px; font-size:0.8rem; cursor:pointer;">✖ Exit</button>
                </div>
                <div style="background:linear-gradient(135deg, rgba(30,10,10,0.95), rgba(20,5,5,0.95)); border:2px solid #eb4d4b; border-radius:20px; padding:32px 24px; text-align:center;">
                    <div style="font-size:4rem; margin-bottom:12px;">❌</div>
                    <h2 style="color:#eb4d4b; font-size:1.5rem; font-weight:900; margin:0 0 8px 0;">Unrecognized VICard</h2>
                    <p style="color:#fca5a5; font-size:0.9rem; margin:0 0 16px 0;">This card ID was not found in the official VICard database.</p>
                    <div style="font-family:monospace; font-size:1.1rem; color:#f5d77f; background:rgba(0,0,0,0.4); padding:8px; border-radius:8px; display:inline-block;">
                        ID: ${escapeHtml(cardId)}
                    </div>
                </div>
            </div>
        `;
        return;
    }

    const isActive = card.status === 'active';

    if (!isActive) {
        overlay.innerHTML = `
            <div style="max-width:480px; margin:40px auto; padding:20px; direction:ltr; text-align:left;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <span style="font-size:1.1rem; font-weight:800; color:#fff;">Restaurant Cashier Verification 🛡️</span>
                    <button type="button" onclick="closeVicardCashierScreen()" style="background:rgba(255,255,255,0.1); border:none; color:#fff; border-radius:20px; padding:6px 14px; font-size:0.8rem; cursor:pointer;">✖ Exit</button>
                </div>
                <div style="background:linear-gradient(135deg, rgba(40,10,10,0.95), rgba(25,5,5,0.95)); border:2px solid #eb4d4b; border-radius:22px; padding:36px 24px; text-align:center; box-shadow:0 14px 40px rgba(235,77,75,0.25);">
                    <div style="font-size:4.5rem; margin-bottom:12px; animation: notePulse 1.5s infinite;">❌</div>
                    <h2 style="color:#eb4d4b; font-size:1.6rem; font-weight:900; margin:0 0 10px 0;">Card Deactivated / Suspended</h2>
                    <p style="color:#fca5a5; font-size:0.92rem; line-height:1.6; margin:0 0 18px 0;">
                        ⚠️ DO NOT apply any discount or offer. This card has been suspended by administration.
                    </p>
                    <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(235,77,75,0.3); border-radius:12px; padding:12px; margin-bottom:20px;">
                        <div style="font-size:1.1rem; font-weight:800; color:#fff;">${escapeHtml(card.name)}</div>
                        <div style="font-family:monospace; color:#f5d77f; font-weight:700;">${card.id}</div>
                    </div>
                    <button type="button" onclick="closeVicardCashierScreen()" style="padding:12px 24px; border-radius:12px; font-weight:800; background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer;">
                        Dismiss Screen
                    </button>
                </div>
            </div>
        `;
        return;
    }

    const requiredPin = rest ? (rest.cashierPin || '1234') : '1234';
    const isDeviceRemembered = restId && (localStorage.getItem('vicard_cashier_device_' + restId) === requiredPin);

    // Active Card Verified Screen
    overlay.innerHTML = `
        <div style="max-width:500px; margin:20px auto; padding:16px; direction:ltr; text-align:left;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
                <span style="font-size:1.1rem; font-weight:800; color:#fff;">Cashier Verification 🛡️</span>
                <button type="button" onclick="closeVicardCashierScreen()" style="background:rgba(255,255,255,0.1); border:none; color:#fff; border-radius:20px; padding:6px 14px; font-size:0.8rem; cursor:pointer;">✖ Exit</button>
            </div>

            <div style="background:linear-gradient(135deg, rgba(15,35,20,0.95), rgba(10,25,15,0.95)); border:2px solid #2ed573; border-radius:22px; padding:28px 22px; text-align:center; box-shadow:0 14px 45px rgba(46,213,115,0.25); margin-bottom:20px;">
                <div style="font-size:4rem; margin-bottom:8px;">✅</div>
                <h2 style="color:#2ed573; font-size:1.5rem; font-weight:900; margin:0 0 6px 0;">VICard Verified & Active</h2>
                <div style="color:#d4af37; font-size:0.85rem; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Legitimate VIP Member</div>

                <!-- Customer Details Card -->
                <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(46,213,115,0.3); border-radius:14px; padding:14px; margin:16px 0;">
                    <div style="font-size:1.25rem; font-weight:900; color:#fff;">${escapeHtml(card.name)}</div>
                    <div style="font-family:monospace; font-size:1rem; font-weight:800; color:#f5d77f; margin-top:2px;">${card.id}</div>
                    <div style="font-size:0.85rem; color:#d4af37; font-weight:700; margin-top:4px;">🏅 Tier: ${escapeHtml(card.tier || 'Black VIP')} (Rank ${getTierRank(card.tier)})</div>
                    ${card.phone ? `<div style="font-size:0.85rem; color:#a0aec0; margin-top:4px;">📞 ${escapeHtml(card.phone)}</div>` : ''}
                </div>

                ${!restTierCheck.eligible ? `
                    <div style="background:rgba(235,77,75,0.18); border:1.5px solid #eb4d4b; border-radius:12px; padding:10px 14px; margin:14px 0; color:#fca5a5; font-size:0.85rem; line-height:1.4;">
                        ${restTierCheck.isLowestRankUnchecked
                            ? `🚫 <strong>Restaurant Not Available Right Now:</strong> هذا المطعم غير متاح حالياً لهذا المستوى. Offers for this restaurant are currently not available for ${card.tier || 'this'} tier.`
                            : `⚠️ <strong>Tier Warning:</strong> This partner requires <strong>${restTierCheck.requiredTierNames.join(' or ')}</strong> (Rank ${restTierCheck.minRequiredRank}+). Customer has <strong>${card.tier || 'None'}</strong> (Rank ${restTierCheck.customerRank}).`}
                    </div>
                ` : ''}

                <!-- Selected Unit / Deal Badge -->
                <div style="background:rgba(212,175,55,0.12); border:1px solid rgba(212,175,55,0.3); border-radius:12px; padding:10px 14px; display:inline-block; font-size:0.9rem; color:#f5d77f; font-weight:800;">
                    🎁 Selected Unit: ${escapeHtml(unitName)}
                </div>
            </div>

            <!-- Cashier Bill Discount Calculator -->
            <div style="background:linear-gradient(135deg, #161622, #0f0f18); border:1px solid rgba(255,255,255,0.1); border-radius:18px; padding:20px;">
                <h4 style="margin:0 0 12px 0; font-size:0.95rem; font-weight:800; color:#fff;">Apply & Record Visit</h4>
                
                <div style="margin-bottom:12px;">
                    <label style="display:block; font-size:0.8rem; color:#a0aec0; margin-bottom:4px;">Total Bill (SAR)</label>
                    <input type="number" id="vicard-cashier-bill" placeholder="e.g. 150" oninput="calculateVicardDiscount()"
                        style="width:100%; padding:10px 14px; border-radius:10px; border:1px solid var(--border-color); background:var(--input-bg); color:#fff; font-size:1.1rem; font-weight:800; box-sizing:border-box;">
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
                    <div>
                        <label style="display:block; font-size:0.8rem; color:#a0aec0; margin-bottom:4px;">Discount %</label>
                        <input type="number" id="vicard-cashier-pct" value="20" min="0" max="100" oninput="calculateVicardDiscount()"
                            style="width:100%; padding:8px 12px; border-radius:10px; border:1px solid var(--border-color); background:var(--input-bg); color:#f5d77f; font-size:1rem; font-weight:800; box-sizing:border-box;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.8rem; color:#a0aec0; margin-bottom:4px;">Customer Pays</label>
                        <div id="vicard-cashier-final" style="font-size:1.2rem; font-weight:900; color:#2ed573; padding:8px 0;">SAR 0.00</div>
                    </div>
                </div>

                ${isDeviceRemembered ? `
                    <div style="background:rgba(46,213,115,0.12); border:1px solid rgba(46,213,115,0.4); border-radius:12px; padding:10px 14px; margin-bottom:14px; display:flex; align-items:center; justify-content:center; gap:8px;">
                        <span style="font-size:1.1rem;">🛡️</span>
                        <span style="color:#2ed573; font-size:0.85rem; font-weight:800;">Authorized Cashier Station • جهاز الكاشير معتمد</span>
                    </div>
                ` : `
                    <div style="background:linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.03)); border:1.5px solid rgba(212,175,55,0.4); border-radius:14px; padding:16px 14px; margin-bottom:16px; text-align:center;">
                        <label style="display:block; font-size:0.88rem; font-weight:800; color:#f5d77f; margin-bottom:4px;">
                            🔒 Cashier 4-Digit PIN (رمز الكاشير السري) *
                        </label>
                        <p style="color:#a0aec0; font-size:0.76rem; margin:0 0 10px 0;">
                            Only restaurant cashier staff can confirm this offer. Customers cannot self-confirm.
                        </p>
                        <div style="display:flex; justify-content:center; margin-bottom:8px;">
                            <input type="password" id="vicard-cashier-pin-input" maxlength="4" placeholder="••••"
                                style="width:140px; text-align:center; padding:8px 10px; font-size:1.5rem; font-family:monospace; font-weight:900; letter-spacing:8px; border-radius:10px; border:2px solid #d4af37; background:rgba(0,0,0,0.7); color:#fff; outline:none; box-sizing:border-box;"
                                onkeyup="if (event.key === 'Enter') confirmVicardCashierVisit('${card.id}', '${escapeHtml(restId || '')}', '${escapeHtml(unitName || '')}')">
                        </div>
                        <div id="vicard-cashier-pin-error" style="display:none; color:#eb4d4b; font-size:0.82rem; font-weight:700; margin-bottom:8px;"></div>
                        <label style="display:inline-flex; align-items:center; gap:6px; font-size:0.78rem; color:#cbd5e1; cursor:pointer; user-select:none;">
                            <input type="checkbox" id="vicard-cashier-remember-device" checked style="accent-color:#d4af37; width:15px; height:15px; cursor:pointer;">
                            <span>Remember this cashier device (تذكر هذا الجهاز)</span>
                        </label>
                    </div>
                `}

                <button type="button" onclick="confirmVicardCashierVisit('${card.id}', '${escapeHtml(restId || '')}', '${escapeHtml(unitName || '')}')"
                    style="width:100%; padding:14px; border-radius:12px; font-size:0.95rem; font-weight:800; background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(16,185,129,0.35);">
                    ✅ Confirm Discount & Log Visit
                </button>
            </div>
        </div>
    `;
}

function calculateVicardDiscount() {
    const billInput = document.getElementById('vicard-cashier-bill');
    const pctInput = document.getElementById('vicard-cashier-pct');
    const finalEl = document.getElementById('vicard-cashier-final');

    if (!billInput || !pctInput || !finalEl) return;

    const bill = parseFloat(billInput.value) || 0;
    const pct = parseFloat(pctInput.value) || 0;
    const discount = (bill * pct) / 100;
    const finalAmt = Math.max(0, bill - discount);

    finalEl.textContent = `SAR ${finalAmt.toFixed(2)}`;
}
window.calculateVicardDiscount = calculateVicardDiscount;

function confirmVicardCashierVisit(cardId, restId, unitName) {
    const card = vicardData.cards[cardId];
    if (!card) return;

    const rest = (vicardData.restaurants && restId) ? vicardData.restaurants[restId] : null;
    const requiredPin = rest ? (rest.cashierPin || '1234') : '1234';
    const isDeviceRemembered = restId && (localStorage.getItem('vicard_cashier_device_' + restId) === requiredPin);

    if (!isDeviceRemembered) {
        const pinInput = document.getElementById('vicard-cashier-pin-input');
        const errEl = document.getElementById('vicard-cashier-pin-error');
        const enteredPin = pinInput ? pinInput.value.trim() : '';

        if (!enteredPin || enteredPin !== requiredPin) {
            if (errEl) {
                errEl.textContent = '❌ Incorrect Cashier PIN. Staff verification required. رمز الكاشير غير صحيح';
                errEl.style.display = 'block';
            }
            if (pinInput) {
                pinInput.focus();
                pinInput.select();
            }
            return;
        }

        const rememberCb = document.getElementById('vicard-cashier-remember-device');
        if (rememberCb && rememberCb.checked && restId) {
            try {
                localStorage.setItem('vicard_cashier_device_' + restId, requiredPin);
            } catch (e) {}
        }
    }

    const billInput = document.getElementById('vicard-cashier-bill');
    const pctInput = document.getElementById('vicard-cashier-pct');

    const bill = billInput ? parseFloat(billInput.value) || 0 : 0;
    const pct = pctInput ? parseFloat(pctInput.value) || 0 : 0;
    const discount = (bill * pct) / 100;
    const discountAmount = Math.round(discount);

    const nextVisits = (card.visitsCount || 0) + 1;
    const nextSavings = (card.totalSavings || 0) + discountAmount;

    card.visitsCount = nextVisits;
    card.totalSavings = nextSavings;

    const discountRecord = {
        timestamp: Date.now(),
        restId: restId || '',
        restName: rest ? rest.name : 'Partner Restaurant',
        unitName: unitName || '',
        discountAmount: discountAmount,
        savings: discountAmount,
        bill: bill,
        pct: pct
    };

    db.ref(`vicard_network/cards/${cardId}`).update({
        visitsCount: nextVisits,
        totalSavings: nextSavings,
        lastRedemption: discountRecord
    }).then(() => {
        // If customer QR modal is currently open in this window, trigger congratulations immediately
        const redeemModal = document.getElementById('vicard-redeem-modal');
        if (redeemModal && redeemModal.style.display !== 'none') {
            showVicardDiscountSuccessMessage(discountRecord, card, rest, { name: unitName });
        }
        alert(`🎉 Visit logged successfully!\n\nCustomer: ${card.name}\nTotal visits: ${nextVisits}\nTotal saved: SAR ${nextSavings}`);
        closeVicardCashierScreen();
    }).catch(err => {
        alert('Failed to log visit: ' + err.message);
    });
}
window.confirmVicardCashierVisit = confirmVicardCashierVisit;

// --- CUSTOMER DIRECT PORTAL (WHEN SCANNING NFC WITH PHONE: ?vicard=VIC-XXXX&key=...) ---
var _currentActiveCustomerCard = null;

function openVicardCustomerPortal(cardId, providedKey) {
    document.documentElement.classList.add('vicard-ready');
    const splash = document.getElementById('vicard-splash-screen');
    if (splash) {
        splash.classList.add('hidden');
        splash.style.display = 'none';
        try { splash.remove(); } catch (e) {}
    }

    const overlay = document.getElementById('vicard-customer-portal-overlay');
    const content = document.getElementById('vicard-portal-content');
    if (!overlay || !content) return;

    overlay.style.display = 'block';

    const urlParams = new URLSearchParams(window.location.search);
    const key = providedKey || urlParams.get('key');

    let card = (vicardData && vicardData.cards && vicardData.cards[cardId]) ? vicardData.cards[cardId] : null;

    // If card is not in database/cache yet, create active VIP card entry so customer is NEVER blocked
    if (!card) {
        card = {
            id: cardId || 'VIC-GUEST',
            name: 'VIP Member',
            phone: '',
            tier: 'Black VIP',
            status: 'active',
            secretKey: key || 'guest',
            visitsCount: 0,
            totalSavings: 0,
            created: new Date().toISOString()
        };
        if (!vicardData.cards) vicardData.cards = {};
        vicardData.cards[card.id] = card;
        try {
            if (typeof db !== 'undefined' && db) {
                db.ref(`vicard_network/cards/${card.id}`).set(card).catch(() => {});
            }
        } catch (e) {}
    }

    // Auto-ensure card has secret key
    if (!card.secretKey) {
        card.secretKey = generateVicardSecretKey();
        try {
            if (typeof db !== 'undefined' && db) {
                db.ref(`vicard_network/cards/${card.id}/secretKey`).set(card.secretKey).catch(() => {});
            }
        } catch (e) {}
    }

    // 1. KEY IN URL OR GUEST OR NO PHONE REGISTERED: Automatically authenticate immediately!
    if ((key && card.secretKey && key === card.secretKey) || key === 'guest' || card.id === 'VIC-GUEST' || !card.phone) {
        window._currentActiveCustomerCard = card;
        if (window.location.search) {
            window.history.replaceState({ vicard: card.id }, document.title, window.location.pathname);
        }

        // Show the 3D rotating card loading screen on entry
        if (!window._vicardPortalAnimatedOnce) {
            window._vicardPortalAnimatedOnce = true;
            content.innerHTML = getVicard3DCardLoadingHtml(
                'Authenticating VIP Membership...',
                'Connecting to encrypted VICard network',
                'جاري استدعاء وتأكيد بطاقة العضوية المشفرة...'
            );
            setTimeout(() => {
                renderAuthorizedCustomerPortal(card);
            }, 650);
            return;
        }

        renderAuthorizedCustomerPortal(card);
        return;
    }

    // 2. Active interaction session (e.g. clicking categories or menu items within the currently verified view)
    if (window._currentActiveCustomerCard && window._currentActiveCustomerCard.id === card.id) {
        renderAuthorizedCustomerPortal(card);
        return;
    }

    // 3. Phone verification if registered with phone and key not provided
    renderPhoneVerificationScreen(card);
}
window.openVicardCustomerPortal = openVicardCustomerPortal;

function renderPhoneVerificationScreen(card) {
    const content = document.getElementById('vicard-portal-content');
    if (!content) return;

    content.innerHTML = `
        <div style="min-height:75vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:32px 16px; font-family:'Outfit',-apple-system,sans-serif;">
            <div style="background:linear-gradient(135deg, rgba(26,26,36,0.98), rgba(13,13,18,0.98)); border:1px solid rgba(212,175,55,0.4); border-radius:24px; padding:36px 24px; max-width:440px; width:100%; box-shadow:0 25px 70px rgba(0,0,0,0.85); box-sizing:border-box;">
                <div style="width:72px; height:72px; border-radius:50%; background:linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05)); border:2px solid #d4af37; display:flex; align-items:center; justify-content:center; font-size:2.2rem; margin:0 auto 16px; box-shadow:0 0 25px rgba(212,175,55,0.3);">
                    📱
                </div>
                <h2 style="color:#fff; font-size:1.35rem; font-weight:800; margin:0 0 4px 0;">Cardholder Verification</h2>
                <div style="color:#f5d77f; font-size:0.88rem; font-weight:700; margin-bottom:14px;">التحقق من رقم الجوال</div>
                
                <p style="color:#a0aec0; font-size:0.85rem; line-height:1.5; margin:0 0 8px 0;">
                    Please enter the phone number registered with this VICard (or the last 4 digits):
                </p>
                <p style="color:#718096; font-size:0.8rem; line-height:1.5; margin:0 0 20px 0; direction:rtl;">
                    يرجى إدخال رقم الجوال المسجل للبطاقة (أو آخر 4 أرقام) لفتح حسابك:
                </p>

                ${card.phone ? `
                <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(212,175,55,0.25); border-radius:16px; padding:18px 16px; margin-bottom:16px; text-align:center;">
                    <div style="margin-bottom:12px;">
                        <input type="tel" id="vicard-phone-verify-input" placeholder="e.g. 05XXXXXXXX or last 4 digits" dir="ltr"
                            style="width:100%; text-align:center; padding:12px 14px; font-size:1.15rem; font-family:monospace; font-weight:700; border-radius:12px; border:1px solid rgba(212,175,55,0.4); background:rgba(0,0,0,0.6); color:#fff; outline:none; box-sizing:border-box;"
                            onkeyup="if (event.key === 'Enter') unlockVicardWithPhone('${escapeHtml(card.id)}')">
                    </div>
                    <div id="vicard-phone-verify-error" style="display:none; color:#eb4d4b; font-size:0.82rem; font-weight:600; margin-bottom:12px;"></div>
                    <button type="button" onclick="unlockVicardWithPhone('${escapeHtml(card.id)}')"
                        style="width:100%; padding:12px; border-radius:12px; font-weight:800; font-size:0.95rem; background:linear-gradient(135deg, #d4af37, #aa771c); color:#000; border:none; cursor:pointer; box-shadow:0 4px 15px rgba(212,175,55,0.3); transition:opacity 0.2s;">
                        Verify & Open Card
                    </button>
                </div>
                ` : ''}

                <!-- Direct Menu & Offers Access Button -->
                <button type="button" onclick="renderAuthorizedCustomerPortal(vicardData.cards['${escapeHtml(card.id)}'])"
                    style="width:100%; margin-bottom:14px; padding:12px 16px; border-radius:12px; font-weight:800; font-size:0.9rem; background:rgba(212,175,55,0.15); color:#f5d77f; border:1px solid rgba(212,175,55,0.35); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                    <span>🍽️</span> <span>Browse Restaurant Menu & Offers • تصفح العروض</span>
                </button>

                <button type="button" onclick="closeVicardCustomerPortal()"
                    style="padding:10px 24px; border-radius:12px; background:rgba(255,255,255,0.08); color:#a0aec0; border:1px solid rgba(255,255,255,0.15); cursor:pointer; font-size:0.85rem; font-weight:600;">
                    ✖ Exit
                </button>
            </div>
        </div>
    `;
    setTimeout(() => {
        const inp = document.getElementById('vicard-phone-verify-input');
        if (inp) inp.focus();
    }, 100);
}
window.renderPhoneVerificationScreen = renderPhoneVerificationScreen;

function unlockVicardWithPhone(cardId) {
    const input = document.getElementById('vicard-phone-verify-input');
    const errEl = document.getElementById('vicard-phone-verify-error');
    if (!input || !cardId) return;

    const entered = input.value.trim();
    if (!entered) {
        if (errEl) {
            errEl.textContent = 'Please enter your phone number or last 4 digits.';
            errEl.style.display = 'block';
        }
        input.focus();
        return;
    }

    const card = vicardData.cards[cardId];
    if (!card || !card.phone) {
        if (errEl) {
            errEl.textContent = 'No phone number registered for this card.';
            errEl.style.display = 'block';
        }
        return;
    }

    const cleanEntered = String(entered).replace(/\D/g, '');
    const cleanPhone = String(card.phone).replace(/\D/g, '');

    const normEntered = cleanEntered.replace(/^0+/, '').replace(/^966/, '');
    const normPhone = cleanPhone.replace(/^0+/, '').replace(/^966/, '');

    const isFullMatch = normEntered.length >= 6 && (normPhone === normEntered || normPhone.endsWith(normEntered) || normEntered.endsWith(normPhone));
    const isLast4Match = cleanEntered.length === 4 && cleanPhone.endsWith(cleanEntered);

    if (isFullMatch || isLast4Match) {
        window._currentActiveCustomerCard = card;
        const content = document.getElementById('vicard-portal-content');
        if (content) {
            content.innerHTML = getVicard3DCardLoadingHtml(
                'Unlocking VIP Card...',
                'Decryption handshake verified successfully',
                'تم تأكيد رقم الجوال بنجاح، جاري فتح الحساب...'
            );
        }
        setTimeout(() => {
            renderAuthorizedCustomerPortal(card);
        }, 650);
    } else {
        if (errEl) {
            errEl.textContent = 'Incorrect phone number. Please check and try again.';
            errEl.style.display = 'block';
        }
        input.focus();
        input.select();
    }
}
window.unlockVicardWithPhone = unlockVicardWithPhone;

function renderAuthorizedCustomerPortal(card) {
    const content = document.getElementById('vicard-portal-content');
    if (!content) return;

    window._currentActiveCustomerCard = card;

    let rests = Object.values(vicardData.restaurants || {}).filter(r => r.active !== false);
    if (rests.length === 0) {
        rests = [
            {
                id: 'rest_burgeroov',
                name: 'Burgeroov',
                category: 'Gourmet Smash Burgers & Shakes',
                logo: 'burgeroov.png',
                cover: 'burgeroov_cover.jpg',
                location: 'Riyadh - Olaya St',
                rating: '4.9',
                reviews: '420+',
                distance: '1.2 km',
                active: true,
                units: [
                    {
                        id: 'unit_b1',
                        name: 'Double Truffle Smash Burger Combo',
                        image: 'burgeroov_cover.jpg',
                        originalPrice: 58,
                        offerPrice: 42,
                        discount: '28% OFF',
                        description: 'Two Angus smash patties, black truffle aioli, aged cheddar, seasoned parmesan fries & drink.'
                    },
                    {
                        id: 'unit_b2',
                        name: 'Crispy Chicken Supreme Meal',
                        image: 'burgeroov_cover.jpg',
                        originalPrice: 49,
                        offerPrice: 35,
                        discount: '29% OFF',
                        description: 'Golden fried crispy chicken breast, garlic ranch, dill pickles, potato bun, fries & drink.'
                    }
                ]
            },
            {
                id: 'rest_mvcfresh',
                name: 'MVC Fresh',
                category: 'Organic Fruits & Fresh Cold-Pressed Juices',
                logo: 'mvcfresh.png',
                cover: 'mvcfresh_cover.jpg',
                location: 'Riyadh - King Fahd Rd',
                rating: '4.8',
                reviews: '310+',
                distance: '2.5 km',
                active: true,
                units: [
                    {
                        id: 'unit_f1',
                        name: 'Exotic Tropical Fruit Basket (Large)',
                        image: 'mvcfresh_cover.jpg',
                        originalPrice: 140,
                        offerPrice: 99,
                        discount: '30% OFF',
                        description: 'Dragon fruit, sweet mango, passion fruit, fresh raspberries, and organic ripe pineapple.'
                    }
                ]
            },
            {
                id: 'rest_mvcmeat',
                name: 'MVC Meat Market',
                category: 'Premium Wagyu & Black Angus Butcher Cuts',
                logo: 'mvcmeat.png',
                cover: 'mvcmeat_cover.jpg',
                location: 'Riyadh - Hittin District',
                rating: '4.9',
                reviews: '550+',
                distance: '4.1 km',
                active: true,
                units: [
                    {
                        id: 'unit_m1',
                        name: 'Japanese Wagyu A5 Ribeye Steak (300g)',
                        image: 'mvcmeat_cover.jpg',
                        originalPrice: 280,
                        offerPrice: 199,
                        discount: '29% OFF',
                        description: 'Certified authentic Miyazaki A5 Wagyu beef ribeye with highest marbling score BMS 10+.'
                    }
                ]
            }
        ];
    }

    initVicardHistoryNavigation();
    if (!_vicardHistoryInitialized) {
        _vicardHistoryInitialized = true;
        try {
            history.replaceState({ vicardApp: true, vicardView: 'root' }, document.title);
            history.pushState({ vicardApp: true, vicardView: 'directory' }, document.title);
        } catch (e) {}
    }

    if (activeWebsiteRestId && (vicardData.restaurants[activeWebsiteRestId] || rests.find(r => r.id === activeWebsiteRestId))) {
        const targetRest = vicardData.restaurants[activeWebsiteRestId] || rests.find(r => r.id === activeWebsiteRestId);
        content.innerHTML = generateRestaurantMenuWebsiteHtml(targetRest, card);
    } else {
        content.innerHTML = generateRestaurantsDirectoryWebsiteHtml(rests, card);
    }
    updateVicardPortalExitButton();
}
window.renderAuthorizedCustomerPortal = renderAuthorizedCustomerPortal;

function closeVicardCustomerPortal() {
    const overlay = document.getElementById('vicard-customer-portal-overlay');
    if (overlay) overlay.style.display = 'none';
    window._currentActiveCustomerCard = null;
    window._activeVicardSession = null;
    window._pendingVicardAccess = null;
    window._vicardPortalAnimatedOnce = false;
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    if (typeof currentUser === 'undefined' || !currentUser) {
        const authOv = document.getElementById('auth-overlay');
        if (authOv) authOv.style.display = 'flex';
        document.documentElement.classList.remove('vicard-standalone-view');
    }
}
window.closeVicardCustomerPortal = closeVicardCustomerPortal;

function updateActiveVicardOverlays() {
    const custOverlay = document.getElementById('vicard-customer-portal-overlay');
    if (custOverlay && custOverlay.style.display === 'block') {
        const params = new URLSearchParams(window.location.search);
        let cardId = params.get('vicard');
        let key = params.get('key');
        if (cardId) {
            openVicardCustomerPortal(cardId, key);
        } else if (window._currentActiveCustomerCard) {
            renderAuthorizedCustomerPortal(window._currentActiveCustomerCard);
        }
    }
    const cashierOverlay = document.getElementById('vicard-cashier-overlay');
    if (cashierOverlay && cashierOverlay.style.display === 'block') {
        const params = new URLSearchParams(window.location.search);
        const verifyCardId = params.get('verify_vicard');
        if (verifyCardId) {
            const card = vicardData.cards[verifyCardId];
            renderVicardCashierScreen(verifyCardId, card, params.get('rest'), params.get('unit'));
        }
    }
}

// Helper: Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Auto-initialize when loaded or DOM ready
if (typeof window !== 'undefined') {
    const initVicardUrlHandler = () => {
        const p = new URLSearchParams(window.location.search);
        const hasSession = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('vicard_active_session');
        if (p.has('vicard') || p.has('verify_vicard') || p.has('menu') || p.has('portal') || p.has('vicard_menu') || hasSession) {
            document.documentElement.classList.add('vicard-standalone-view');
            const authOv = document.getElementById('auth-overlay');
            if (authOv) authOv.style.display = 'none';
            const launchLoader = document.getElementById('launch-loader-overlay');
            if (launchLoader) launchLoader.style.display = 'none';
            if (typeof initVicardSystem === 'function') initVicardSystem();
            checkVicardUrlParams();
        }
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initVicardUrlHandler();
            populateVicardTierSelects();
        });
    } else {
        initVicardUrlHandler();
        populateVicardTierSelects();
    }
}
