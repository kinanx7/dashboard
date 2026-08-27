// =====================================================================
// TRACKING & GEOFENCING MODULE (SAUDI ARABIA LIVE RADAR, PLACES & WORK ZONES)
// =====================================================================

var trackingMap = null;
var trackingStreetLayer = null;
var trackingSatelliteLayer = null;
var trackingCurrentLayerType = 'satellite'; // default to high-res satellite
var trackingWorkZoneLayer = null;
var trackingPlacesLayerGroup = null; // Custom Pinned Places
var trackingPlacesMarkersMap = {}; // Map of placeId -> L.marker
var trackingAimMarker = null;
var trackingAimCircle = null;
var trackingWorkersLayerGroup = null;
var trackingWorkerMarkersMap = {}; // Map of workerId -> L.marker
var isAimingWorkZone = false;
var isAddingCustomPlace = false; // Mode to click on map and drop a saved place pin
var tempWorkZoneData = null; // { lat, lng, radius, branch }

// GPS Broadcaster state
var workerGpsWatcherId = null;
var workerGpsHeartbeatTimer = null;
var lastGpsBroadcastTime = 0;
var lastBroadcastCoords = null;

// Saudi Arabia Major Cities Coordinates for Quick Jump
const SAUDI_CITIES = {
    riyadh: { name: 'الرياض (Riyadh)', lat: 24.7136, lng: 46.6753, zoom: 13 },
    jeddah: { name: 'جدة (Jeddah)', lat: 21.4858, lng: 39.1925, zoom: 13 },
    mecca: { name: 'مكة المكرمة (Mecca)', lat: 21.3891, lng: 39.8579, zoom: 13 },
    medina: { name: 'المدينة المنورة (Medina)', lat: 24.5247, lng: 39.5692, zoom: 13 },
    dammam: { name: 'الدمام (Dammam)', lat: 26.4207, lng: 50.0888, zoom: 13 },
    khobar: { name: 'الخبر (Al Khobar)', lat: 26.2144, lng: 50.1971, zoom: 13 },
    dhahran: { name: 'الظهران (Dhahran)', lat: 26.2361, lng: 50.1119, zoom: 13 },
    tabuk: { name: 'تبوك (Tabuk)', lat: 28.3835, lng: 36.5662, zoom: 13 },
    abha: { name: 'أبها (Abha)', lat: 18.2164, lng: 42.5053, zoom: 13 },
    buraidah: { name: 'بريدة (Buraidah)', lat: 26.3260, lng: 43.9750, zoom: 13 },
    jazan: { name: 'جازان (Jazan)', lat: 16.8894, lng: 42.5511, zoom: 13 },
    taif: { name: 'الطائف (Taif)', lat: 21.2854, lng: 40.4244, zoom: 13 }
};

// 1. Initialize Tracking Map (Leaflet)
function initTrackingMap() {
    const mapContainer = document.getElementById('tracking-map');
    if (!mapContainer) return;

    if (trackingMap) {
        setTimeout(() => {
            trackingMap.invalidateSize();
        }, 150);
        return;
    }

    // Default center: Current branch work zone or company default city
    const companyData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const defaultZone = getActiveWorkZone();
    
    let initialLat = 24.7136;
    let initialLng = 46.6753;
    let initialZoom = 13;

    if (defaultZone && defaultZone.lat && defaultZone.lng) {
        initialLat = defaultZone.lat;
        initialLng = defaultZone.lng;
        initialZoom = 16;
    } else {
        if (typeof currentCompany !== 'undefined' && currentCompany === 'mvc') {
            initialLat = 26.4207; initialLng = 50.0888; initialZoom = 13; // Dammam
        } else if (typeof currentCompany !== 'undefined' && currentCompany === 'mvcfresh') {
            initialLat = 21.4858; initialLng = 39.1925; initialZoom = 13; // Jeddah
        } else {
            initialLat = 24.7136; initialLng = 46.6753; initialZoom = 13; // Riyadh
        }
    }

    trackingMap = L.map('tracking-map', {
        center: [initialLat, initialLng],
        zoom: initialZoom,
        zoomControl: true,
        attributionControl: false
    });

    // Layer 1: OpenStreetMap (Street View)
    trackingStreetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    });

    // Layer 2: Esri World Imagery (High-Resolution Satellite)
    trackingSatelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: '© Esri Satellite'
    });

    // Default to Satellite view
    if (trackingCurrentLayerType === 'satellite') {
        trackingSatelliteLayer.addTo(trackingMap);
    } else {
        trackingStreetLayer.addTo(trackingMap);
    }

    // Layer Groups
    trackingWorkZoneLayer = L.layerGroup().addTo(trackingMap);
    trackingPlacesLayerGroup = L.layerGroup().addTo(trackingMap);
    trackingWorkersLayerGroup = L.layerGroup().addTo(trackingMap);

    // Map Click Listener
    trackingMap.on('click', function (e) {
        if (isAimingWorkZone) {
            setAimWorkZoneCenter(e.latlng.lat, e.latlng.lng);
            return;
        }
        if (isAddingCustomPlace) {
            openAddTrackingPlaceModal(e.latlng.lat, e.latlng.lng);
            return;
        }
    });

    // Populate City Select
    populateSaudiCitySelect();

    // Render Saved Work Zones, Custom Saved Places & Workers
    renderMapWorkZones();
    renderSavedTrackingPlaces();
    renderMapWorkerPins();

    // Attach real-time cloud listener for live GPS locations
    initGlobalLiveLocationListener();

    setTimeout(() => {
        if (trackingMap) trackingMap.invalidateSize();
    }, 250);
}
window.initTrackingMap = initTrackingMap;

// 2. Zoom to Company Work Zone / Headquarters Automatically
function zoomToActiveCompanyWorkZone() {
    const defaultZone = getActiveWorkZone();
    let targetLat = 24.7136;
    let targetLng = 46.6753;
    let targetZoom = 13;

    if (defaultZone && defaultZone.lat && defaultZone.lng) {
        targetLat = defaultZone.lat;
        targetLng = defaultZone.lng;
        targetZoom = 16;
    } else {
        if (typeof currentCompany !== 'undefined' && currentCompany === 'mvc') {
            targetLat = 26.4207; targetLng = 50.0888; targetZoom = 13; // Dammam
        } else if (typeof currentCompany !== 'undefined' && currentCompany === 'mvcfresh') {
            targetLat = 21.4858; targetLng = 39.1925; targetZoom = 13; // Jeddah
        } else {
            targetLat = 24.7136; targetLng = 46.6753; targetZoom = 13; // Riyadh
        }
    }

    if (trackingMap) {
        setTimeout(() => {
            if (trackingMap) {
                trackingMap.invalidateSize();
                trackingMap.flyTo([targetLat, targetLng], targetZoom, { duration: 1.5 });
            }
        }, 150);
    }
}
window.zoomToActiveCompanyWorkZone = zoomToActiveCompanyWorkZone;

// 3. Real-Time Cloud Listener for Worker Live Locations
function initGlobalLiveLocationListener() {
    if (typeof db === 'undefined' || !db || typeof currentCompany === 'undefined' || !currentCompany) return;

    if (window._currentLiveLocationRef) {
        window._currentLiveLocationRef.off();
    }

    window._currentLiveLocationRef = db.ref(`companies/${currentCompany}/liveLocations`);
    window._currentLiveLocationRef.on('value', snapshot => {
        const companyData = typeof getCompanyData === 'function' ? getCompanyData() : {};
        companyData.liveLocations = snapshot.val() || {};
        
        // Re-render pins & stats if tracking tab is visible
        const trackingView = document.getElementById('view-tracking');
        if (trackingView && trackingView.classList.contains('active-view')) {
            renderMapWorkerPins();
            renderTrackingSection();
        }
    });
}
window.initGlobalLiveLocationListener = initGlobalLiveLocationListener;

// 4. Toggle Map Layer: Satellite vs Street
function setTrackingMapLayer(type) {
    if (!trackingMap) return;
    trackingCurrentLayerType = type;

    if (type === 'satellite') {
        if (trackingMap.hasLayer(trackingStreetLayer)) trackingMap.removeLayer(trackingStreetLayer);
        trackingSatelliteLayer.addTo(trackingMap);
    } else {
        if (trackingMap.hasLayer(trackingSatelliteLayer)) trackingMap.removeLayer(trackingSatelliteLayer);
        trackingStreetLayer.addTo(trackingMap);
    }

    const btnSat = document.getElementById('tracking-btn-layer-sat');
    const btnStreet = document.getElementById('tracking-btn-layer-street');
    if (btnSat && btnStreet) {
        if (type === 'satellite') {
            btnSat.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            btnSat.style.color = 'white';
            btnStreet.style.background = 'var(--input-bg)';
            btnStreet.style.color = 'var(--text-main)';
        } else {
            btnStreet.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
            btnStreet.style.color = 'white';
            btnSat.style.background = 'var(--input-bg)';
            btnSat.style.color = 'var(--text-main)';
        }
    }
}
window.setTrackingMapLayer = setTrackingMapLayer;

// 5. Quick Saudi City Navigator
function populateSaudiCitySelect() {
    const sel = document.getElementById('tracking-city-select');
    if (!sel) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    let opts = `<option value="">📍 ${isAr ? 'الانتقال السريع لمدينة سعودية...' : 'Jump to Saudi City...'}</option>`;
    Object.keys(SAUDI_CITIES).forEach(k => {
        const c = SAUDI_CITIES[k];
        opts += `<option value="${k}">${c.name}</option>`;
    });
    sel.innerHTML = opts;
}
window.populateSaudiCitySelect = populateSaudiCitySelect;

function jumpToSaudiCity(cityKey) {
    if (!cityKey || !SAUDI_CITIES[cityKey] || !trackingMap) return;
    const c = SAUDI_CITIES[cityKey];
    trackingMap.flyTo([c.lat, c.lng], c.zoom, { duration: 1.5 });
}
window.jumpToSaudiCity = jumpToSaudiCity;

// 6. Geocode Search for Saudi Locations (Nominatim API)
async function searchTrackingMapLocation() {
    const input = document.getElementById('tracking-search-input');
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (!input || !input.value.trim() || !trackingMap) return;

    const query = input.value.trim() + ', Saudi Arabia';
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
            const loc = data[0];
            const lat = parseFloat(loc.lat);
            const lng = parseFloat(loc.lon);
            trackingMap.flyTo([lat, lng], 16, { duration: 1.5 });

            if (isAimingWorkZone) {
                setAimWorkZoneCenter(lat, lng);
            }
        } else {
            alert(isAr ? 'لم يتم العثور على نتائج للموقع المدخل في السعودية.' : 'Location not found in Saudi Arabia.');
        }
    } catch (e) {
        console.error("Geocoding error:", e);
        alert(isAr ? 'حدث خطأ أثناء البحث عن الموقع.' : 'Error searching location.');
    }
}
window.searchTrackingMapLocation = searchTrackingMapLocation;

// =====================================================================
// 7. CUSTOM SAVED PLACES & PINS MANAGEMENT (NO RE-SEARCHING NEEDED)
// =====================================================================

function toggleAddCustomPlaceMode() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    isAddingCustomPlace = !isAddingCustomPlace;
    if (isAimingWorkZone) cancelAimWorkZone();

    const btn = document.getElementById('tracking-btn-add-place');
    const mapEl = document.getElementById('tracking-map');

    if (isAddingCustomPlace) {
        if (btn) {
            btn.classList.add('btn-danger');
            btn.classList.remove('btn-primary');
            btn.innerHTML = `<span>❌</span> <span>${isAr ? 'إلغاء وضع التثبيت' : 'Cancel Pin Mode'}</span>`;
        }
        if (mapEl) {
            mapEl.style.cursor = 'crosshair';
            mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (typeof showInAppNotification === 'function') {
            showInAppNotification(isAr ? '📍 انقر على أي موقع في الخريطة لتثبيته وحفظه بالأماكن الدائمة.' : '📍 Click anywhere on the map to pin and save this place.');
        }
    } else {
        cancelAddCustomPlaceMode();
    }
}
window.toggleAddCustomPlaceMode = toggleAddCustomPlaceMode;

function cancelAddCustomPlaceMode() {
    isAddingCustomPlace = false;
    const btn = document.getElementById('tracking-btn-add-place');
    const mapEl = document.getElementById('tracking-map');
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    if (btn) {
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-primary');
        btn.innerHTML = `<span>➕</span> <span data-i18n="btn-add-place-pin">${isAr ? 'تثبيت موقع دائم' : 'Pin Place'}</span>`;
    }
    if (mapEl) mapEl.style.cursor = '';
}
window.cancelAddCustomPlaceMode = cancelAddCustomPlaceMode;

function openAddTrackingPlaceModal(optLat, optLng) {
    const modal = document.getElementById('modal-add-tracking-place');
    if (!modal) return;
    cancelAddCustomPlaceMode();

    let lat = optLat;
    let lng = optLng;
    if (!lat || !lng) {
        if (trackingMap) {
            const center = trackingMap.getCenter();
            lat = center.lat;
            lng = center.lng;
        } else {
            lat = 24.7136;
            lng = 46.6753;
        }
    }

    document.getElementById('place-pin-lat').value = lat;
    document.getElementById('place-pin-lng').value = lng;
    document.getElementById('place-pin-coords-text').textContent = `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    document.getElementById('place-pin-name').value = '';
    document.getElementById('place-pin-note').value = '';
    document.getElementById('place-pin-category').value = 'branch';
    document.getElementById('place-pin-icon').value = '🏢';
    document.getElementById('place-pin-color').value = '#10b981';

    modal.style.display = 'flex';
}
window.openAddTrackingPlaceModal = openAddTrackingPlaceModal;

function closeAddTrackingPlaceModal() {
    const modal = document.getElementById('modal-add-tracking-place');
    if (modal) modal.style.display = 'none';
}
window.closeAddTrackingPlaceModal = closeAddTrackingPlaceModal;

function saveTrackingPlaceModal() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const name = document.getElementById('place-pin-name').value.trim();
    const lat = parseFloat(document.getElementById('place-pin-lat').value);
    const lng = parseFloat(document.getElementById('place-pin-lng').value);
    const category = document.getElementById('place-pin-category').value || 'branch';
    const icon = document.getElementById('place-pin-icon').value || '📍';
    const color = document.getElementById('place-pin-color').value || '#10b981';
    const note = document.getElementById('place-pin-note').value.trim();

    if (!name || isNaN(lat) || isNaN(lng)) {
        alert(isAr ? 'الرجاء إدخال اسم الموقع وتحديد الإحداثيات.' : 'Please enter place name and coordinates.');
        return;
    }

    const placeId = 'place_' + Date.now();
    const placeData = {
        id: placeId,
        name: name,
        category: category,
        icon: icon,
        color: color,
        lat: lat,
        lng: lng,
        note: note,
        createdAt: Date.now(),
        createdBy: (typeof currentUser !== 'undefined' && currentUser && currentUser.email) ? currentUser.email : 'Admin'
    };

    const companyData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    if (!companyData.trackingPlaces) companyData.trackingPlaces = {};
    companyData.trackingPlaces[placeId] = placeData;

    db.ref(`companies/${currentCompany}/trackingPlaces/${placeId}`).set(placeData).then(() => {
        closeAddTrackingPlaceModal();
        if (typeof showInAppNotification === 'function') {
            showInAppNotification(isAr ? `📍 تم حفظ وتثبيت موقع (${name}) بنجاح!` : `📍 Saved place pin (${name}) successfully!`);
        }
        renderSavedTrackingPlaces();
        jumpToTrackingPlace(placeId);
    }).catch(err => {
        console.error("Error saving tracking place:", err);
        alert("Error saving place: " + err.message);
    });
}
window.saveTrackingPlaceModal = saveTrackingPlaceModal;

function deleteTrackingPlace(placeId) {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا الموقع المثبت من الخريطة؟' : 'Are you sure you want to delete this pinned place?')) return;

    const companyData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    if (companyData.trackingPlaces && companyData.trackingPlaces[placeId]) {
        delete companyData.trackingPlaces[placeId];
    }

    db.ref(`companies/${currentCompany}/trackingPlaces/${placeId}`).remove().then(() => {
        if (typeof showInAppNotification === 'function') {
            showInAppNotification(isAr ? '🗑️ تم حذف الموقع المثبت.' : '🗑️ Pinned place deleted.');
        }
        renderSavedTrackingPlaces();
    }).catch(err => {
        console.error("Error deleting tracking place:", err);
    });
}
window.deleteTrackingPlace = deleteTrackingPlace;

// Instant Aim & High-Zoom to Saved Place
function jumpToTrackingPlace(placeId) {
    if (!placeId || !trackingMap) return;
    const companyData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const places = companyData.trackingPlaces || {};
    const place = places[placeId];
    if (!place || !place.lat || !place.lng) return;

    // Smooth camera flight at zoom 18
    trackingMap.flyTo([place.lat, place.lng], 18, { duration: 1.5 });

    const mapContainer = document.getElementById('tracking-map');
    if (mapContainer) {
        mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Open popup after flight
    setTimeout(() => {
        const marker = trackingPlacesMarkersMap[placeId];
        if (marker) {
            marker.openPopup();
        }
    }, 1200);
}
window.jumpToTrackingPlace = jumpToTrackingPlace;

function renderSavedTrackingPlaces() {
    if (!trackingMap || !trackingPlacesLayerGroup) return;
    trackingPlacesLayerGroup.clearLayers();
    trackingPlacesMarkersMap = {};

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const companyData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const rawPlaces = companyData.trackingPlaces || {};
    const places = Array.isArray(rawPlaces) ? rawPlaces : Object.values(rawPlaces);
    const activeZone = getActiveWorkZone();

    // 1. Update Saved Places Dropdown Selector in toolbar
    const sel = document.getElementById('tracking-saved-places-select');
    if (sel) {
        let opts = `<option value="">📍 ${isAr ? 'المواقع المثبتة والمحفوظة (' + places.length + ')...' : 'Saved Pinned Places (' + places.length + ')...'}</option>`;
        places.forEach(p => {
            if (!p || !p.name) return;
            opts += `<option value="${p.id}">${p.icon || '📍'} ${p.name}</option>`;
        });
        sel.innerHTML = opts;
    }

    // 2. Render Interactive Saved Places Cards Grid
    const cardsGrid = document.getElementById('tracking-saved-places-cards-grid');
    if (cardsGrid) {
        if (places.length === 0) {
            cardsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; background: var(--input-bg); border: 1.5px dashed var(--border-color); border-radius: 12px; padding: 20px; text-align: center; color: var(--text-muted);">
                    <div style="font-size: 1.8rem; margin-bottom: 4px;">📌</div>
                    <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-main);">
                        ${isAr ? 'لا توجد مواقع مثبتة بعد' : 'No pinned places saved yet'}
                    </div>
                    <div style="font-size: 0.8rem; margin-top: 4px;">
                        ${isAr ? 'انقر على "تثبيت موقع دائم" في الأعلى لإضافة فروعك، المطابخ، ومستودعات التوزيع لتسهيل الوصول إليها.' : 'Click "Pin Place" above to pin and bookmark your branches, prep kitchens, warehouses, or supplier points.'}
                    </div>
                </div>
            `;
        } else {
            cardsGrid.innerHTML = places.map(p => {
                if (!p || !p.lat || !p.lng) return '';
                const iconEmoji = p.icon || '📍';
                const color = p.color || '#10b981';
                const safeName = typeof escapeHtml === 'function' ? escapeHtml(p.name) : p.name;
                const safeNote = typeof escapeHtml === 'function' ? escapeHtml(p.note || '') : (p.note || '');

                let distText = '';
                if (activeZone && activeZone.lat && activeZone.lng) {
                    const d = calculateDistanceMeters(activeZone.lat, activeZone.lng, p.lat, p.lng);
                    if (d !== null) {
                        distText = isAr ? `📏 ${d}م عن الفرع` : `📏 ${d}m from store`;
                    }
                }

                return `
                    <div class="card" style="margin-bottom:0; padding:12px 14px; border-radius:12px; border-left:4px solid ${color}; display:flex; flex-direction:column; justify-content:space-between; gap:8px; background:var(--input-bg);">
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <span style="font-size:1.4rem;">${iconEmoji}</span>
                                    <div>
                                        <h4 style="margin:0; font-size:0.92rem; font-weight:900; color:var(--text-main); line-height:1.2;">
                                            ${safeName}
                                        </h4>
                                        <span style="font-size:0.72rem; font-weight:700; color:${color};">
                                            ${p.category ? p.category.toUpperCase() : 'PLACE'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            ${safeNote ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px; line-height:1.3;">${safeNote}</div>` : ''}
                            <div style="font-size:0.72rem; color:var(--text-muted); margin-top:4px; font-family:monospace;">
                                📍 ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)} ${distText ? `• ${distText}` : ''}
                            </div>
                        </div>

                        <div style="display:flex; gap:6px; margin-top:4px; border-top:1px solid var(--border-color); padding-top:8px;">
                            <button type="button" onclick="jumpToTrackingPlace('${p.id}')" class="btn-primary" style="flex:1; padding:6px 10px; font-size:0.75rem; font-weight:800; border-radius:6px; display:flex; align-items:center; justify-content:center; gap:4px; background:${color}; border:none;">
                                <span>🎯</span> <span>${isAr ? 'توجيه وتقريب' : 'Aim & Zoom'}</span>
                            </button>
                            <button type="button" onclick="deleteTrackingPlace('${p.id}')" style="background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.3); color:#ef4444; border-radius:6px; padding:6px 8px; font-size:0.72rem; font-weight:800; cursor:pointer;" title="${isAr ? 'حذف الموقع' : 'Delete Pin'}">
                                🗑️
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // 3. Render Markers on Leaflet Map
    places.forEach(p => {
        if (!p || !p.lat || !p.lng) return;
        const iconEmoji = p.icon || '📍';
        const color = p.color || '#10b981';

        const marker = L.marker([p.lat, p.lng], {
            icon: L.divIcon({
                className: 'custom-saved-place-pin',
                html: `
                    <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%);">
                        <div style="background: ${color}; color: white; padding: 4px 8px; border-radius: 8px; font-weight: 800; font-size: 0.75rem; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 1.5px solid #ffffff; margin-bottom: 2px;">
                            ${iconEmoji} ${typeof escapeHtml === 'function' ? escapeHtml(p.name) : p.name}
                        </div>
                        <div style="width: 14px; height: 14px; background: ${color}; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>
                    </div>
                `,
                iconSize: [24, 24],
                iconAnchor: [12, 24]
            })
        }).addTo(trackingPlacesLayerGroup);

        trackingPlacesMarkersMap[p.id] = marker;

        marker.bindPopup(`
            <div style="font-family:'Inter', sans-serif; padding: 6px; min-width: 190px; color: #0f172a;">
                <div style="display:flex; align-items:center; gap:6px; font-weight:900; font-size:1rem; color:${color}; margin-bottom:4px;">
                    <span style="font-size:1.2rem;">${iconEmoji}</span> <span>${typeof escapeHtml === 'function' ? escapeHtml(p.name) : p.name}</span>
                </div>
                ${p.note ? `<div style="font-size:0.8rem; color:#475569; margin-bottom:6px; line-height:1.4;">${typeof escapeHtml === 'function' ? escapeHtml(p.note) : p.note}</div>` : ''}
                <div style="font-size:0.75rem; color:#64748b; margin-bottom:8px;">
                    📍 ${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:6px;">
                    <button type="button" onclick="jumpToTrackingPlace('${p.id}')" style="background:#10b981; color:white; border:none; border-radius:6px; padding:4px 8px; font-size:0.72rem; font-weight:800; cursor:pointer;">
                        🎯 ${isAr ? 'تقريب' : 'Zoom'}
                    </button>
                    <button type="button" onclick="deleteTrackingPlace('${p.id}')" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#ef4444; border-radius:6px; padding:4px 8px; font-size:0.72rem; font-weight:800; cursor:pointer;">
                        🗑️ ${isAr ? 'حذف' : 'Delete'}
                    </button>
                </div>
            </div>
        `);
    });
}
window.renderSavedTrackingPlaces = renderSavedTrackingPlaces;

// =====================================================================
// 8. ULTRA HIGH-PRECISION WORKER GPS BROADCASTER & SYNC ENGINE
// =====================================================================

function startWorkerLocationBroadcaster() {
    console.log("[GPS] Initializing ultra high-precision silent GPS broadcaster...");

    // 1. Check Android Native Bridge first if available
    const androidBridge = window.AndroidInterface || window.Android || window.AndroidShare;
    if (androidBridge) {
        try {
            if (typeof androidBridge.getGPSLocation === 'function') {
                const locStr = androidBridge.getGPSLocation();
                if (locStr) {
                    const parsed = JSON.parse(locStr);
                    if (parsed && parsed.latitude && parsed.longitude) {
                        handleGpsPositionUpdate({ coords: parsed });
                    }
                }
            }
        } catch (e) {
            console.warn("[GPS] AndroidInterface location bridge check:", e);
        }
    }

    // 2. Standard HTML5 Geolocation with MAXIMAL High-Accuracy Options
    if (navigator.geolocation) {
        const highAccuracyOptions = {
            enableHighAccuracy: true,
            maximumAge: 0, // Force fresh calculation from GPS satellite constellation
            timeout: 10000
        };

        // Immediate silent fix
        try {
            navigator.geolocation.getCurrentPosition(
                pos => handleGpsPositionUpdate(pos, true),
                err => handleGpsError(err),
                highAccuracyOptions
            );
        } catch (e) { }

        // Continuous hardware watcher
        if (workerGpsWatcherId === null) {
            try {
                workerGpsWatcherId = navigator.geolocation.watchPosition(
                    handleGpsPositionUpdate,
                    handleGpsError,
                    highAccuracyOptions
                );
            } catch (e) { }
        }

        // Background Heartbeat Interval (every 15 seconds)
        if (!workerGpsHeartbeatTimer) {
            workerGpsHeartbeatTimer = setInterval(() => {
                broadcastWorkerGpsHeartbeat();
            }, 15000);
        }
    }
}
window.startWorkerLocationBroadcaster = startWorkerLocationBroadcaster;

function broadcastWorkerGpsHeartbeat(force) {
    if (!navigator.geolocation) return;
    try {
        navigator.geolocation.getCurrentPosition(
            pos => handleGpsPositionUpdate(pos, force || false),
            err => handleGpsError(err),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );
    } catch (e) { }
}
window.broadcastWorkerGpsHeartbeat = broadcastWorkerGpsHeartbeat;

// Attach window focus & visibility listeners for instant ping when app is opened
if (typeof window !== 'undefined') {
    window.addEventListener('focus', () => {
        broadcastWorkerGpsHeartbeat(true);
    });
    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                broadcastWorkerGpsHeartbeat(true);
            }
        });
    }
}

function requestWorkerGpsBroadcast() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (!navigator.geolocation) {
        alert(isAr ? '⚠️ جهازك لا يدعم خاصية تحديد الموقع الجغرافي GPS.' : '⚠️ Geolocation is not supported on this device.');
        return;
    }

    updateGpsStatusBadge('acquiring', isAr ? '📡 جاري جلب إحداثيات GPS الدقيقة...' : '📡 Acquiring high-precision GPS...');

    navigator.geolocation.getCurrentPosition(
        pos => {
            handleGpsPositionUpdate(pos, true);
            alert(isAr ? `✅ تم تحديد وبث موقعك بدقة (±${Math.round(pos.coords.accuracy || 0)} متر)!` : `✅ Live high-accuracy GPS broadcasted (±${Math.round(pos.coords.accuracy || 0)}m)!`);
        },
        err => {
            handleGpsError(err);
            if (err.code === 1) { // PERMISSION_DENIED
                alert(isAr ? '⚠️ تم رفض إذن الوصول للموقع. يرجى تفعيل إذن الموقع GPS في إعدادات التطبيق أو المتصفح.' : '⚠️ GPS permission denied. Please allow location access in your device settings.');
            } else {
                alert(isAr ? '⚠️ تعذر جلب الموقع. يرجى التأكد من تشغيل الـ GPS في الهاتف.' : '⚠️ Unable to fetch location. Please ensure device GPS is turned on.');
            }
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
}
window.requestWorkerGpsBroadcast = requestWorkerGpsBroadcast;

function handleGpsPositionUpdate(position, forceWrite) {
    if (!position || !position.coords) return;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const { latitude, longitude, accuracy, speed, heading, altitude } = position.coords;
    const now = Date.now();

    // High precision: broadcast immediately if moved even slightly (> 0.5m)
    if (!forceWrite && lastBroadcastCoords) {
        const movedMeters = calculateDistanceMeters(lastBroadcastCoords.lat, lastBroadcastCoords.lng, latitude, longitude);
        if (movedMeters < 0.5 && (now - lastGpsBroadcastTime) < 10000) {
            return; // unchanged position within 10 seconds
        }
    }

    lastBroadcastCoords = { lat: latitude, lng: longitude };
    lastGpsBroadcastTime = now;

    updateGpsStatusBadge('active', `${isAr ? '🟢 GPS نشط' : '🟢 GPS Active'} (±${Math.round(accuracy)}m)`);

    // Determine target worker identity
    const companyData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const workers = companyData.workers || [];
    let myWorker = null;

    if (typeof currentUser !== 'undefined' && currentUser) {
        if (currentUser.email) {
            myWorker = workers.find(w => w && w.email && w.email.toLowerCase() === currentUser.email.toLowerCase());
        }
        if (!myWorker && currentUser.name) {
            myWorker = workers.find(w => w && w.name && String(w.name).trim().toLowerCase() === String(currentUser.name).trim().toLowerCase());
        }
    }

    const workerId = myWorker ? String(myWorker.id) : (currentUser ? (currentUser.workerId || currentUser.uid || 'current_user') : 'user');
    const workerName = myWorker ? myWorker.name : (currentUser ? (currentUser.displayName || currentUser.email || 'Worker') : 'Worker');

    const liveLocData = {
        workerId: workerId,
        name: workerName,
        role: myWorker ? (myWorker.role || 'Staff') : 'Staff',
        branch: myWorker ? (myWorker.branch || 'Main Branch') : 'Main Branch',
        lat: latitude,
        lng: longitude,
        accuracy: accuracy || 0,
        speed: speed || 0,
        heading: heading || 0,
        altitude: altitude || null,
        timestamp: now
    };

    if (typeof db !== 'undefined' && db) {
        // Broadcast to all 3 companies so manager can see worker regardless of selected company
        const allCompanies = ['burgeroov', 'mvc', 'mvcfresh'];
        allCompanies.forEach(cKey => {
            db.ref(`companies/${cKey}/liveLocations/${workerId}`).set(liveLocData)
                .catch(e => console.warn(`[GPS] LiveLocation write error for ${cKey}:`, e));
        });

        // Also update worker object node if found in current company
        if (myWorker && typeof currentCompany !== 'undefined' && currentCompany) {
            const wIdx = workers.findIndex(w => String(w.id) === String(myWorker.id));
            if (wIdx !== -1) {
                db.ref(`companies/${currentCompany}/workers/${wIdx}`).update({
                    liveLat: latitude,
                    liveLng: longitude,
                    lastGpsTimestamp: now,
                    gpsAccuracy: accuracy || 0
                }).catch(e => console.warn("[GPS] Worker GPS update error:", e));
            }
        }
    }
}

function handleGpsError(err) {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    console.warn("[GPS] Geolocation status:", err.code, err.message);
    if (err.code === 1) { // PERMISSION_DENIED
        updateGpsStatusBadge('denied', isAr ? '🔴 إذن الـ GPS معطل' : '🔴 GPS Permission Denied');
    } else {
        updateGpsStatusBadge('error', isAr ? '⚠️ بانتظار إشارة GPS' : '⚠️ No GPS Signal');
    }
}

function updateGpsStatusBadge(status, text) {
    const chips = document.querySelectorAll('.worker-gps-status-badge');
    chips.forEach(c => {
        c.textContent = text;
        if (status === 'active') {
            c.style.background = 'rgba(16,185,129,0.15)';
            c.style.color = '#10b981';
            c.style.border = '1px solid rgba(16,185,129,0.3)';
        } else if (status === 'denied') {
            c.style.background = 'rgba(239,68,68,0.15)';
            c.style.color = '#ef4444';
            c.style.border = '1px solid rgba(239,68,68,0.3)';
        } else {
            c.style.background = 'rgba(245,158,11,0.15)';
            c.style.color = '#f59e0b';
            c.style.border = '1px solid rgba(245,158,11,0.3)';
        }
    });
}
window.updateGpsStatusBadge = updateGpsStatusBadge;

// Start broadcaster immediately when script loads
if (typeof navigator !== 'undefined' && navigator.geolocation) {
    startWorkerLocationBroadcaster();
}

// =====================================================================
// 9. WORK ZONE RETRIEVAL, AIMING & PERSISTENCE
// =====================================================================

function getActiveWorkZone(optBranch) {
    const companyData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const branch = optBranch || (companyData.branches && companyData.branches[0]) || 'Main Branch';
    const zones = companyData.workZones || {};

    if (zones[branch]) return zones[branch];
    if (companyData.workZone) return companyData.workZone; // fallback generic

    return null;
}
window.getActiveWorkZone = getActiveWorkZone;

function toggleAimWorkZoneMode() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const isAdmin = (typeof currentUser !== 'undefined' && currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.isAdmin));
    if (!isAdmin) {
        alert(isAr ? '⚠️ هذه الخاصية متاحة فقط لمديري النظام لتحديد نطاق عمل الفرع.' : '⚠️ Only managers can define work zones.');
        return;
    }

    isAimingWorkZone = !isAimingWorkZone;
    if (isAddingCustomPlace) cancelAddCustomPlaceMode();

    const aimPanel = document.getElementById('tracking-aim-panel');
    const btnAim = document.getElementById('tracking-btn-aim-mode');
    const mapEl = document.getElementById('tracking-map');

    if (isAimingWorkZone) {
        if (aimPanel) aimPanel.style.display = 'block';
        if (btnAim) {
            btnAim.classList.add('btn-danger');
            btnAim.classList.remove('btn-primary');
            btnAim.innerHTML = `<span>❌</span> <span>${isAr ? 'إلغاء وضع التوجيه' : 'Cancel Aiming'}</span>`;
        }
        if (mapEl) {
            mapEl.style.cursor = 'crosshair';
            mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Load existing active zone or center of map
        const existing = getActiveWorkZone();
        const center = existing ? { lat: existing.lat, lng: existing.lng } : trackingMap.getCenter();
        const radius = existing ? (existing.radiusMeters || 100) : 100;
        setAimWorkZoneCenter(center.lat, center.lng, radius);

        if (typeof showInAppNotification === 'function') {
            showInAppNotification(isAr ? '🎯 انقر على الخريطة لتحديد مركز مقر العمل، ثم اضبط قطر النطاق.' : '🎯 Click on map to place work zone center, then adjust radius.');
        }
    } else {
        cancelAimWorkZone();
    }
}
window.toggleAimWorkZoneMode = toggleAimWorkZoneMode;

function setAimWorkZoneCenter(lat, lng, optRadius) {
    if (!trackingMap) return;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const radiusInput = document.getElementById('tracking-aim-radius-input');
    const radius = optRadius || (radiusInput ? parseInt(radiusInput.value) || 100 : 100);

    const branchSelect = document.getElementById('tracking-aim-branch-select');
    const branch = branchSelect ? branchSelect.value : 'Main Branch';

    tempWorkZoneData = {
        lat: lat,
        lng: lng,
        radiusMeters: radius,
        branch: branch,
        updatedAt: Date.now()
    };

    // Update UI coordinates text
    const coordsEl = document.getElementById('tracking-aim-coords-text');
    if (coordsEl) {
        coordsEl.innerHTML = `📍 <strong>${lat.toFixed(6)}, ${lng.toFixed(6)}</strong> (±${radius}m)`;
    }

    // Render Preview Markers on Map
    if (trackingAimMarker) trackingMap.removeLayer(trackingAimMarker);
    if (trackingAimCircle) trackingMap.removeLayer(trackingAimCircle);

    // Center pin (Store Icon)
    const storeIcon = L.divIcon({
        className: 'custom-aim-store-pin',
        html: `<div style="width:36px; height:36px; border-radius:50%; background: linear-gradient(135deg, #10b981, #059669); border: 3px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; animation: pulse 1.5s infinite;">🏢</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
    });

    trackingAimMarker = L.marker([lat, lng], { icon: storeIcon, draggable: true }).addTo(trackingMap);
    trackingAimMarker.on('dragend', function (e) {
        const pos = e.target.getLatLng();
        setAimWorkZoneCenter(pos.lat, pos.lng, tempWorkZoneData.radiusMeters);
    });

    // Glowing Geofence Circle
    trackingAimCircle = L.circle([lat, lng], {
        radius: radius,
        color: '#10b981',
        weight: 3,
        dashArray: '6, 6',
        fillColor: '#10b981',
        fillOpacity: 0.25
    }).addTo(trackingMap);
}
window.setAimWorkZoneCenter = setAimWorkZoneCenter;

function onAimRadiusSliderChange(val) {
    const num = parseInt(val);
    const label = document.getElementById('tracking-aim-radius-label');
    if (label) label.textContent = `${num} m / متر`;

    if (tempWorkZoneData) {
        tempWorkZoneData.radiusMeters = num;
        if (trackingAimCircle) {
            trackingAimCircle.setRadius(num);
        }
        const coordsEl = document.getElementById('tracking-aim-coords-text');
        if (coordsEl) {
            coordsEl.innerHTML = `📍 <strong>${tempWorkZoneData.lat.toFixed(6)}, ${tempWorkZoneData.lng.toFixed(6)}</strong> (±${num}m)`;
        }
    }
}
window.onAimRadiusSliderChange = onAimRadiusSliderChange;

function saveWorkZone() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (!tempWorkZoneData) {
        alert(isAr ? '⚠️ الرجاء تحديد مركز نطاق العمل على الخريطة أولاً.' : '⚠️ Please select work zone location on map.');
        return;
    }

    const branchSelect = document.getElementById('tracking-aim-branch-select');
    const branch = branchSelect ? branchSelect.value : (tempWorkZoneData.branch || 'Main Branch');
    tempWorkZoneData.branch = branch;

    const companyData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    if (!companyData.workZones) companyData.workZones = {};
    companyData.workZones[branch] = tempWorkZoneData;

    const updates = {};
    updates[`companies/${currentCompany}/workZones/${branch}`] = tempWorkZoneData;

    db.ref().update(updates).then(() => {
        if (typeof logActivity === 'function') {
            logActivity('workzone_saved', '', '', `Updated Work Zone Geofence for branch "${branch}" (Radius: ${tempWorkZoneData.radiusMeters}m)`);
        }
        if (typeof showInAppNotification === 'function') {
            showInAppNotification(isAr ? `✅ تم حفظ وتثبيت نطاق العمل بنجاح لفرع (${branch})!` : `✅ Work zone saved for branch (${branch})!`);
        }
        cancelAimWorkZone();
        renderMapWorkZones();
        renderTrackingSection();
    }).catch(err => {
        console.error("Error saving work zone:", err);
        alert("Error saving work zone: " + err.message);
    });
}
window.saveWorkZone = saveWorkZone;

function cancelAimWorkZone() {
    isAimingWorkZone = false;
    tempWorkZoneData = null;

    if (trackingAimMarker && trackingMap) trackingMap.removeLayer(trackingAimMarker);
    if (trackingAimCircle && trackingMap) trackingMap.removeLayer(trackingAimCircle);
    trackingAimMarker = null;
    trackingAimCircle = null;

    const aimPanel = document.getElementById('tracking-aim-panel');
    const btnAim = document.getElementById('tracking-btn-aim-mode');
    const mapEl = document.getElementById('tracking-map');
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    if (aimPanel) aimPanel.style.display = 'none';
    if (btnAim) {
        btnAim.classList.remove('btn-danger');
        btnAim.classList.add('btn-primary');
        btnAim.innerHTML = `<span>🎯</span> <span>${isAr ? 'توجيه / تحديد نطاق العمل' : 'Aim Work Area'}</span>`;
    }
    if (mapEl) mapEl.style.cursor = '';
}
window.cancelAimWorkZone = cancelAimWorkZone;

function renderMapWorkZones() {
    if (!trackingMap || !trackingWorkZoneLayer) return;
    trackingWorkZoneLayer.clearLayers();

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const companyData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const zones = companyData.workZones || {};

    const allZones = Object.keys(zones).length > 0 ? Object.values(zones) : (companyData.workZone ? [companyData.workZone] : []);

    allZones.forEach(z => {
        if (!z || !z.lat || !z.lng) return;
        const radius = z.radiusMeters || 100;

        // Store center marker
        const marker = L.marker([z.lat, z.lng], {
            icon: L.divIcon({
                className: 'custom-store-pin',
                html: `<div style="width:34px; height:34px; border-radius:50%; background: linear-gradient(135deg, #10b981, #059669); border: 2.5px solid #ffffff; box-shadow: 0 3px 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">🏢</div>`,
                iconSize: [34, 34],
                iconAnchor: [17, 17]
            })
        }).addTo(trackingWorkZoneLayer);

        marker.bindPopup(`
            <div style="font-family:'Inter', sans-serif; padding: 4px; color: #0f172a;">
                <div style="font-weight:900; font-size:0.95rem; color:#10b981; display:flex; align-items:center; gap:6px;">
                    <span>🏢</span> <span>${typeof escapeHtml === 'function' ? escapeHtml(z.branch || 'Main Branch') : (z.branch || 'Main Branch')}</span>
                </div>
                <div style="font-size:0.8rem; margin-top:4px; color:#475569;">
                    🎯 ${isAr ? 'قطر نطاق العمل المعتمد:' : 'Approved Work Zone Radius:'} <strong>${radius}m</strong>
                </div>
                <div style="font-size:0.75rem; margin-top:2px; color:#64748b;">
                    📍 ${z.lat.toFixed(6)}, ${z.lng.toFixed(6)}
                </div>
            </div>
        `);

        // Zone Perimeter Circle
        L.circle([z.lat, z.lng], {
            radius: radius,
            color: '#10b981',
            weight: 2,
            fillColor: '#10b981',
            fillOpacity: 0.18
        }).addTo(trackingWorkZoneLayer);
    });
}
window.renderMapWorkZones = renderMapWorkZones;

// =====================================================================
// 10. DISTANCE & GEOFENCE MATH (HAVERSINE FORMULA & LIVE RESOLUTION)
// =====================================================================

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371000; // Radius of Earth in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}
window.calculateDistanceMeters = calculateDistanceMeters;

function checkWorkerGeofence(worker, optZone) {
    const companyData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const zone = optZone || getActiveWorkZone(worker.branch);
    if (!zone || !zone.lat || !zone.lng) {
        return { hasGeofence: false, inside: true, distance: null };
    }

    // Resolve latest GPS coordinates across all possible live locations & worker nodes
    let wLat = null;
    let wLng = null;
    let accuracy = null;
    let speed = null;
    let lastPing = null;

    // 1. Check liveLocations map
    const liveLocs = companyData.liveLocations || {};
    let loc = liveLocs[worker.id] || liveLocs[String(worker.id)];
    if (!loc && worker.name) {
        loc = Object.values(liveLocs).find(l => l && l.name && String(l.name).trim().toLowerCase() === String(worker.name).trim().toLowerCase());
    }
    if (!loc && worker.email) {
        loc = Object.values(liveLocs).find(l => l && l.email && String(l.email).trim().toLowerCase() === String(worker.email).trim().toLowerCase());
    }

    if (loc && loc.lat && loc.lng) {
        wLat = parseFloat(loc.lat);
        wLng = parseFloat(loc.lng);
        accuracy = loc.accuracy;
        speed = loc.speed;
        lastPing = loc.timestamp;
    } else {
        // 2. Fallback to worker object fields
        wLat = worker.liveLat || (worker.lastLocation && worker.lastLocation.lat) || (worker.location && worker.location.lat);
        wLng = worker.liveLng || (worker.lastLocation && worker.lastLocation.lng) || (worker.location && worker.location.lng);
        lastPing = worker.lastGpsTimestamp || (worker.lastLocation && worker.lastLocation.timestamp);
        accuracy = worker.gpsAccuracy;
    }

    if (!wLat || !wLng || isNaN(wLat) || isNaN(wLng)) {
        return { hasGeofence: true, hasGPS: false, inside: null, distance: null };
    }

    const dist = calculateDistanceMeters(zone.lat, zone.lng, wLat, wLng);
    const maxRadius = zone.radiusMeters || 100;
    const isInside = dist <= maxRadius;

    return {
        hasGeofence: true,
        hasGPS: true,
        inside: isInside,
        distance: dist,
        maxRadius: maxRadius,
        workerLat: wLat,
        workerLng: wLng,
        accuracy: accuracy,
        speed: speed,
        lastPing: lastPing,
        zoneLat: zone.lat,
        zoneLng: zone.lng
    };
}
window.checkWorkerGeofence = checkWorkerGeofence;

// 11. Exit Permission Toggle
function toggleWorkerExitPermission(workerId) {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const companyData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const workers = companyData.workers || [];
    const wIndex = workers.findIndex(w => String(w.id) === String(workerId));
    if (wIndex === -1) return;

    const worker = workers[wIndex];
    const currentPerm = worker.hasExitPermission || false;
    const newPerm = !currentPerm;

    worker.hasExitPermission = newPerm;
    worker.exitPermissionAt = newPerm ? Date.now() : null;

    const updates = {};
    updates[`companies/${currentCompany}/workers/${wIndex}/hasExitPermission`] = newPerm;
    updates[`companies/${currentCompany}/workers/${wIndex}/exitPermissionAt`] = worker.exitPermissionAt;

    db.ref().update(updates).then(() => {
        if (typeof showInAppNotification === 'function') {
            showInAppNotification(newPerm ? 
                (isAr ? `🚗 تم منح إذن خروج مؤقت للموظف (${worker.name})` : `🚗 Exit permission granted to (${worker.name})`) : 
                (isAr ? `🛑 تم إلغاء إذن الخروج للموظف (${worker.name})` : `🛑 Exit permission revoked for (${worker.name})`)
            );
        }
        renderTrackingSection();
    });
}
window.toggleWorkerExitPermission = toggleWorkerExitPermission;

// 12. Render Worker Pins on Map with Accuracy Auras
function renderMapWorkerPins() {
    if (!trackingMap || !trackingWorkersLayerGroup) return;
    trackingWorkersLayerGroup.clearLayers();
    trackingWorkerMarkersMap = {};

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const companyData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const workers = companyData.workers || [];

    workers.forEach(w => {
        const geo = checkWorkerGeofence(w);
        if (!geo.hasGPS || !geo.workerLat || !geo.workerLng) return;

        const isDriver = (w.role && w.role.toLowerCase().includes('driver')) || (w.isDriver);
        const hasPermission = w.hasExitPermission;
        const isInside = geo.inside;

        let pinColor = '#10b981'; // Green inside
        let pinIcon = '👤';

        if (isDriver) {
            pinColor = '#6366f1';
            pinIcon = '🛵';
        } else if (!isInside && !hasPermission) {
            pinColor = '#ef4444'; // Red out of bounds warning
            pinIcon = '🚨';
        } else if (!isInside && hasPermission) {
            pinColor = '#f59e0b'; // Amber with permit
            pinIcon = '🚗';
        }

        // Draw glowing accuracy circle aura (shows meter-level confidence)
        if (geo.accuracy) {
            L.circle([geo.workerLat, geo.workerLng], {
                radius: Math.max(geo.accuracy, 5),
                color: pinColor,
                fillColor: pinColor,
                fillOpacity: 0.14,
                weight: 1.5,
                dashArray: '4, 4'
            }).addTo(trackingWorkersLayerGroup);
        }

        const marker = L.marker([geo.workerLat, geo.workerLng], {
            icon: L.divIcon({
                className: 'custom-worker-live-pin',
                html: `<div style="width:36px; height:36px; border-radius:50%; background: ${pinColor}; border: 2.5px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; font-size:1.15rem; color:white; animation: pulse 2s infinite;">${pinIcon}</div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 18]
            })
        }).addTo(trackingWorkersLayerGroup);

        trackingWorkerMarkersMap[w.id] = marker;

        const distText = geo.distance !== null ? `${geo.distance}m` : '-';
        const speedText = geo.speed ? `${(geo.speed * 3.6).toFixed(1)} km/h` : '0 km/h';

        marker.bindPopup(`
            <div style="font-family:'Inter', sans-serif; padding:6px; min-width:190px; color:#0f172a;">
                <div style="font-weight:900; font-size:0.98rem; display:flex; align-items:center; gap:6px;">
                    <span>👤</span> <span>${typeof escapeHtml === 'function' ? escapeHtml(w.name) : w.name}</span>
                </div>
                <div style="font-size:0.8rem; color:#475569; margin-top:4px;">
                    💼 ${w.role || 'Staff'} • 🏢 ${w.branch || 'Main Branch'}
                </div>
                <div style="font-size:0.82rem; margin-top:4px; font-weight:800; color:${isInside ? '#10b981' : (hasPermission ? '#f59e0b' : '#ef4444')};">
                    ${isInside ? (isAr ? '🟢 داخل نطاق العمل' : '🟢 Inside Work Zone') : (hasPermission ? (isAr ? '🚗 خارج النطاق (بإذن خروج)' : '🚗 Out of bounds (With permit)') : (isAr ? '🚨 خارج النطاق بدون إذن!' : '🚨 Out of Bounds without permit!'))}
                </div>
                <div style="font-size:0.75rem; color:#64748b; margin-top:4px;">
                    📏 ${isAr ? 'المسافة عن المركز:' : 'Distance from store:'} <strong>${distText}</strong>
                </div>
                <div style="font-size:0.72rem; color:#059669; margin-top:2px; font-weight:700;">
                    🎯 ${isAr ? 'الدقة الفعلية:' : 'Live Precision:'} ±${Math.round(geo.accuracy || 5)}m • 🚀 ${speedText}
                </div>
                <div style="font-size:0.70rem; color:#94a3b8; margin-top:2px; font-family:monospace;">
                    📍 ${geo.workerLat.toFixed(6)}, ${geo.workerLng.toFixed(6)}
                </div>
            </div>
        `);
    });
}
window.renderMapWorkerPins = renderMapWorkerPins;

// 13. Fly to Worker on Map
function locateWorkerOnMap(workerId) {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const companyData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const workers = companyData.workers || [];
    const worker = workers.find(w => String(w.id) === String(workerId));

    if (!worker || !trackingMap) return;
    const geo = checkWorkerGeofence(worker);

    if (geo.hasGPS && geo.workerLat && geo.workerLng) {
        trackingMap.flyTo([geo.workerLat, geo.workerLng], 18, { duration: 1.5 });
        const mapContainer = document.getElementById('tracking-map');
        if (mapContainer) mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            const marker = trackingWorkerMarkersMap[workerId];
            if (marker) marker.openPopup();
        }, 1200);
    } else {
        // Fallback fly to branch zone
        const zone = getActiveWorkZone(worker.branch);
        if (zone) {
            trackingMap.flyTo([zone.lat, zone.lng], 16, { duration: 1.5 });
        }
        alert(isAr ? `📍 لم يتم استلام إحداثيات GPS حديثة من جهاز (${worker.name}) بعد.` : `📍 No recent GPS ping received from (${worker.name}) yet.`);
    }
}
window.locateWorkerOnMap = locateWorkerOnMap;

// 14. Main View Renderer: Tracking Tab HUD & Radar Cards
function renderTrackingSection() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const companyData = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const workers = companyData.workers || [];
    const branches = companyData.branches || ['Main Branch'];

    // Initialize Map if not yet ready
    if (!trackingMap) {
        initTrackingMap();
    } else {
        setTimeout(() => { if (trackingMap) trackingMap.invalidateSize(); }, 150);
    }

    renderMapWorkZones();
    renderSavedTrackingPlaces();
    renderMapWorkerPins();

    // Populate branch select in Aim panel
    const aimBranchSelect = document.getElementById('tracking-aim-branch-select');
    if (aimBranchSelect) {
        let bOpts = '';
        branches.forEach(b => {
            bOpts += `<option value="${b}">${b}</option>`;
        });
        aimBranchSelect.innerHTML = bOpts;
    }

    // Populate filter branch select in HUD toolbar
    const filterBranch = document.getElementById('tracking-filter-branch');
    if (filterBranch && filterBranch.options.length <= 1) {
        let fOpts = `<option value="all">${isAr ? '🏢 جميع الفروع' : '🏢 All Branches'}</option>`;
        branches.forEach(b => {
            fOpts += `<option value="${b}">${b}</option>`;
        });
        filterBranch.innerHTML = fOpts;
    }

    // Counters
    let totalDutyWorkers = 0;
    let totalInsideZone = 0;
    let totalOutOfBoundsAlerts = 0;
    let totalExitPermits = 0;

    const filterBranchVal = filterBranch ? filterBranch.value : 'all';
    const filterStatusEl = document.getElementById('tracking-filter-status');
    const filterStatusVal = filterStatusEl ? filterStatusEl.value : 'all';
    const searchInput = document.getElementById('tracking-worker-search');
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

    workers.forEach(w => {
        const isDriver = (w.role && w.role.toLowerCase().includes('driver')) || w.isDriver;
        const geo = checkWorkerGeofence(w);
        const hasPerm = w.hasExitPermission || false;

        totalDutyWorkers++;
        if (geo.inside) {
            totalInsideZone++;
        } else if (!isDriver && !hasPerm) {
            totalOutOfBoundsAlerts++;
        }
        if (hasPerm) totalExitPermits++;
    });

    // Update HUD Metrics
    const hudTotal = document.getElementById('tracking-hud-total');
    const hudInside = document.getElementById('tracking-hud-inside');
    const hudAlerts = document.getElementById('tracking-hud-alerts');
    const hudPermits = document.getElementById('tracking-hud-permits');

    if (hudTotal) hudTotal.textContent = totalDutyWorkers;
    if (hudInside) hudInside.textContent = totalInsideZone;
    if (hudAlerts) hudAlerts.textContent = totalOutOfBoundsAlerts;
    if (hudPermits) hudPermits.textContent = totalExitPermits;

    // Filter workers for the list
    const filteredWorkers = workers.filter(w => {
        if (filterBranchVal !== 'all' && w.branch !== filterBranchVal) return false;
        const isDriver = (w.role && w.role.toLowerCase().includes('driver')) || w.isDriver;
        const geo = checkWorkerGeofence(w);
        const hasPerm = w.hasExitPermission || false;

        if (filterStatusVal === 'inside' && !geo.inside) return false;
        if (filterStatusVal === 'outside' && (geo.inside || hasPerm || isDriver)) return false;
        if (filterStatusVal === 'permits' && !hasPerm) return false;
        if (filterStatusVal === 'drivers' && !isDriver) return false;

        if (searchQuery) {
            const matchName = w.name && w.name.toLowerCase().includes(searchQuery);
            const matchRole = w.role && w.role.toLowerCase().includes(searchQuery);
            const matchBranch = w.branch && w.branch.toLowerCase().includes(searchQuery);
            if (!matchName && !matchRole && !matchBranch) return false;
        }

        return true;
    });

    // Render Workers Radar Grid
    const listContainer = document.getElementById('tracking-workers-grid');
    if (!listContainer) return;

    if (filteredWorkers.length === 0) {
        listContainer.innerHTML = `
            <div style="grid-column: 1 / -1; background: var(--input-bg); border: 1px dashed var(--border-color); border-radius: 14px; padding: 28px; text-align: center; color: var(--text-muted);">
                <div style="font-size: 2rem; margin-bottom: 6px;">📍</div>
                <div style="font-weight: 800; font-size: 1rem; color: var(--text-main);">
                    ${isAr ? 'لا يوجد موظفون مطابقون لخيارات التصفية' : 'No matching employees found'}
                </div>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = filteredWorkers.map(w => {
        const safeName = typeof escapeHtml === 'function' ? escapeHtml(w.name) : w.name;
        const safeRole = typeof escapeHtml === 'function' ? escapeHtml(w.role || 'Staff') : (w.role || 'Staff');
        const safeBranch = typeof escapeHtml === 'function' ? escapeHtml(w.branch || 'Main Branch') : (w.branch || 'Main Branch');
        const isDriver = (w.role && w.role.toLowerCase().includes('driver')) || w.isDriver;
        const hasPerm = w.hasExitPermission || false;
        const geo = checkWorkerGeofence(w);

        let badgeBg = 'rgba(16,185,129,0.15)';
        let badgeColor = '#10b981';
        let badgeText = isAr ? '🟢 داخل نطاق العمل' : '🟢 Inside Work Zone';

        if (isDriver) {
            badgeBg = 'rgba(99,102,241,0.15)';
            badgeColor = '#818cf8';
            badgeText = isAr ? '🛵 سائق توصيل نشط' : '🛵 Active Driver';
        } else if (!geo.hasGPS) {
            badgeBg = 'rgba(107,114,128,0.15)';
            badgeColor = 'var(--text-muted)';
            badgeText = isAr ? '⏳ بانتظار إحداثيات GPS' : '⏳ Awaiting GPS Ping';
        } else if (!geo.inside && !hasPerm) {
            badgeBg = 'rgba(239,68,68,0.15)';
            badgeColor = '#ef4444';
            badgeText = isAr ? '🚨 خارج النطاق بدون إذن!' : '🚨 Out of Bounds!';
        } else if (!geo.inside && hasPerm) {
            badgeBg = 'rgba(245,158,11,0.15)';
            badgeColor = '#f59e0b';
            badgeText = isAr ? '🚗 خارج النطاق (بإذن مؤقت)' : '🚗 Outside (With Permit)';
        }

        const distText = geo.distance !== null ? `${geo.distance}m` : (isAr ? 'غير محدد' : 'N/A');
        const accuracyText = geo.accuracy ? `±${Math.round(geo.accuracy)}m` : '-';

        return `
            <div class="card" style="margin-bottom:0; border-radius:14px; padding:16px; display:flex; flex-direction:column; justify-content:space-between; gap:12px; border-top: 3px solid ${badgeColor};">
                <div>
                    <!-- Header -->
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:40px; height:40px; border-radius:12px; background:linear-gradient(135deg, #6366f1, #4f46e5); color:white; display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:900;">
                                ${isDriver ? '🛵' : '👤'}
                            </div>
                            <div>
                                <h3 style="margin:0; font-size:0.98rem; font-weight:900; color:var(--text-main); line-height:1.2;">
                                    ${safeName}
                                </h3>
                                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                                    💼 ${safeRole} • 🏢 ${safeBranch}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Geofence Status Badge -->
                    <div style="margin-top:10px;">
                        <span class="badge" style="background:${badgeBg}; color:${badgeColor}; font-size:0.78rem; font-weight:800; padding:4px 8px; border-radius:6px; display:inline-flex; align-items:center; gap:4px;">
                            ${badgeText}
                        </span>
                    </div>

                    <!-- Distance & Live Coordinates -->
                    <div style="font-size:0.78rem; color:var(--text-muted); margin-top:8px; display:flex; flex-direction:column; gap:4px; background:var(--input-bg); padding:8px 10px; border-radius:8px; border:1px solid var(--border-color);">
                        <div style="display:flex; justify-content:space-between;">
                            <span>📏 ${isAr ? 'المسافة عن المتجر:' : 'Distance from Store:'}</span>
                            <strong style="color:var(--text-main);">${distText}</strong>
                        </div>
                        ${geo.hasGPS ? `
                            <div style="display:flex; justify-content:space-between; font-size:0.72rem;">
                                <span>🎯 ${isAr ? 'الدقة:' : 'Precision:'} <strong>${accuracyText}</strong></span>
                                <span style="font-family:monospace;">${geo.workerLat.toFixed(5)}, ${geo.workerLng.toFixed(5)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Actions -->
                <div style="display:flex; gap:8px; flex-wrap:wrap; border-top:1px solid var(--border-color); padding-top:10px; margin-top:4px;">
                    <button type="button" onclick="locateWorkerOnMap('${w.id}')" class="btn-primary" style="flex:1; padding:7px 10px; font-size:0.78rem; font-weight:800; border-radius:8px; display:flex; align-items:center; justify-content:center; gap:4px;">
                        <span>🔍</span> <span>${isAr ? 'تحديد على الخريطة' : 'Locate on Map'}</span>
                    </button>
                    ${!isDriver ? `
                        <button type="button" onclick="toggleWorkerExitPermission('${w.id}')" class="${hasPerm ? 'btn-outline' : 'btn-neutral'}" style="padding:7px 10px; font-size:0.78rem; font-weight:800; border-radius:8px; display:flex; align-items:center; gap:4px;" title="${isAr ? 'إذن خروج مؤقت لتفادي اعتباره خارج النطاق' : 'Grant temporary exit permit'}">
                            <span>${hasPerm ? '🛑' : '🚗'}</span> <span>${hasPerm ? (isAr ? 'إلغاء الإذن' : 'Revoke Permit') : (isAr ? 'إذن خروج' : 'Exit Permit')}</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}
window.renderTrackingSection = renderTrackingSection;
