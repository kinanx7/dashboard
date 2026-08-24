
function populateLearningCategoryDropdown() {
    const select = document.getElementById('learning-video-category');
    if (!select) return;

    const currentVal = select.value;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const customCats = data.learningCategories || {};
    const hidden = data.hiddenLearningCategories || {};

    const builtInOptions = [
        { id: 'warehouse', label: isAr ? '📦 المستودع والمخزون' : '📦 Warehouse & Stock Control' },
        { id: 'sales', label: isAr ? '💰 المبيعات والكاشير' : '💰 Sales & Cashier' },
        { id: 'ops', label: isAr ? '⚙️ العمليات والتكاليف' : '⚙️ Operations & Costs' },
        { id: 'drivers', label: isAr ? '🚚 السائقين والتوصيل' : '🚚 Drivers & Deliveries' },
        { id: 'prepare', label: isAr ? '👨‍🍳 المطبخ والتحضير' : '👨‍🍳 Kitchen & Prepare' },
        { id: 'tasks', label: isAr ? '📋 المهام والنظام' : '📋 Tasks & System' },
        { id: 'general', label: isAr ? '🎓 تدريب عام' : '🎓 General Training' }
    ];

    const filteredBuiltIn = builtInOptions.filter(opt => !hidden[opt.id]);
    let html = filteredBuiltIn.map(opt => `<option value="${opt.id}">${opt.label}</option>`).join('');

    Object.values(customCats).forEach(cat => {
        if (!cat || !cat.id || hidden[cat.id]) return;
        const icon = cat.icon || '📁';
        const name = isAr ? (cat.nameAr || cat.nameEn) : (cat.nameEn || cat.nameAr);
        html += `<option value="${cat.id}">${icon} ${name}</option>`;
    });

    select.innerHTML = html;
    if (currentVal) select.value = currentVal;
}
window.populateLearningCategoryDropdown = populateLearningCategoryDropdown;



function openAddLearningCategoryModal() {
    const isAdmin = (typeof currentUser !== 'undefined' && currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.isAdmin));
    if (!isAdmin) {
        const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
        alert(isAr ? 'عذراً، إضافة وتعديل الأقسام متاح للإدارة فقط.' : 'Access Denied: Only administrators can add or edit categories.');
        return;
    }
    const modal = document.getElementById('modal-add-learning-category');
    const editIdEl = document.getElementById('custom-cat-editing-id');
    const nameArEl = document.getElementById('custom-cat-name-ar');
    const nameEnEl = document.getElementById('custom-cat-name-en');
    const iconEl = document.getElementById('custom-cat-icon');
    const colorEl = document.getElementById('custom-cat-color');
    const titleEl = document.getElementById('custom-cat-modal-title');
    const submitBtn = document.getElementById('custom-cat-submit-btn');

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');

    if (editIdEl) editIdEl.value = '';
    if (nameArEl) nameArEl.value = '';
    if (nameEnEl) nameEnEl.value = '';
    if (iconEl) iconEl.value = '📁';
    if (colorEl) colorEl.value = '#8b5cf6';

    if (titleEl) titleEl.textContent = isAr ? '📁 إضافة قسم تعليمي جديد' : '📁 Add Custom Job Category';
    if (submitBtn) submitBtn.textContent = isAr ? '💾 حفظ القسم' : '💾 Save Category';

    if (modal) modal.style.display = 'flex';
}
window.openAddLearningCategoryModal = openAddLearningCategoryModal;

function editLearningCategory(catKey) {
    const isAdmin = (typeof currentUser !== 'undefined' && currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.isAdmin));
    if (!isAdmin) return;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const modal = document.getElementById('modal-add-learning-category');
    const editIdEl = document.getElementById('custom-cat-editing-id');
    const nameArEl = document.getElementById('custom-cat-name-ar');
    const nameEnEl = document.getElementById('custom-cat-name-en');
    const iconEl = document.getElementById('custom-cat-icon');
    const colorEl = document.getElementById('custom-cat-color');
    const titleEl = document.getElementById('custom-cat-modal-title');
    const submitBtn = document.getElementById('custom-cat-submit-btn');

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const customCats = data.learningCategories || {};
    const custom = customCats[catKey];
    const meta = getLearningCategoryMeta(catKey);

    if (editIdEl) editIdEl.value = catKey;
    if (nameArEl) nameArEl.value = custom ? (custom.nameAr || custom.nameEn || '') : (meta.labelAr || meta.label || catKey);
    if (nameEnEl) nameEnEl.value = custom ? (custom.nameEn || custom.nameAr || '') : (meta.labelEn || meta.label || catKey);
    if (iconEl) iconEl.value = (custom ? custom.icon : meta.icon) || '📁';
    if (colorEl) colorEl.value = (custom ? custom.color : meta.color) || '#8b5cf6';

    if (titleEl) titleEl.textContent = isAr ? '✏️ تعديل القسم التعليمي' : '✏️ Edit Job Category';
    if (submitBtn) submitBtn.textContent = isAr ? '💾 حفظ التعديلات' : '💾 Save Changes';

    if (modal) modal.style.display = 'flex';
}
window.editLearningCategory = editLearningCategory;

function closeAddLearningCategoryModal() {
    const modal = document.getElementById('modal-add-learning-category');
    if (modal) modal.style.display = 'none';
}
window.closeAddLearningCategoryModal = closeAddLearningCategoryModal;

function saveCustomLearningCategory() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const editIdEl = document.getElementById('custom-cat-editing-id');
    const nameArEl = document.getElementById('custom-cat-name-ar');
    const nameEnEl = document.getElementById('custom-cat-name-en');
    const iconEl = document.getElementById('custom-cat-icon');
    const colorEl = document.getElementById('custom-cat-color');

    const editingId = editIdEl ? editIdEl.value.trim() : '';
    const nameAr = nameArEl ? nameArEl.value.trim() : '';
    const nameEn = nameEnEl ? nameEnEl.value.trim() : '';
    const icon = iconEl && iconEl.value.trim() ? iconEl.value.trim() : '📁';
    const color = colorEl ? colorEl.value : '#8b5cf6';

    if (!nameAr || !nameEn) {
        alert(isAr ? 'الرجاء إدخال اسم القسم بالعربي وبالإنجليزي.' : 'Please enter category name in both Arabic and English.');
        return;
    }

    const catId = editingId || ('cat_' + Date.now());
    const catObj = {
        id: catId,
        nameAr: nameAr,
        nameEn: nameEn,
        icon: icon,
        color: color,
        createdAt: editingId ? (getCompanyData().learningCategories?.[editingId]?.createdAt || Date.now()) : Date.now(),
        updatedAt: Date.now()
    };

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    if (!data.learningCategories) data.learningCategories = {};
    data.learningCategories[catId] = catObj;

    if (typeof appData !== 'undefined' && currentCompany && appData[currentCompany]) {
        if (!appData[currentCompany].learningCategories) appData[currentCompany].learningCategories = {};
        appData[currentCompany].learningCategories[catId] = catObj;
    }

    populateLearningCategoryDropdown();
    renderLearningProgram();
    closeAddLearningCategoryModal();

    if (typeof db !== 'undefined' && currentCompany) {
        db.ref(`companies/${currentCompany}/learningCategories/${catId}`).set(catObj).then(() => {
            if (typeof showInAppNotification === 'function') {
                showInAppNotification(isAr ? '📁 تم حفظ القسم التعليمي بنجاح!' : '📁 Category saved successfully!');
            }
        }).catch(err => {
            console.error("Error saving custom learning category:", err);
        });
    }
}
window.saveCustomLearningCategory = saveCustomLearningCategory;

function deleteLearningCategory(catKey) {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (catKey === 'all') return;

    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا القسم؟ سيتم نقل جميع الفيديوهات الموجودة بداخله إلى قسم "تدريب عام".' : 'Are you sure you want to delete this category? Videos inside it will be moved to General Training.')) {
        return;
    }

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    if (!data.hiddenLearningCategories) data.hiddenLearningCategories = {};
    data.hiddenLearningCategories[catKey] = true;

    if (data.learningCategories && data.learningCategories[catKey]) {
        delete data.learningCategories[catKey];
    }

    if (typeof appData !== 'undefined' && currentCompany && appData[currentCompany]) {
        if (!appData[currentCompany].hiddenLearningCategories) appData[currentCompany].hiddenLearningCategories = {};
        appData[currentCompany].hiddenLearningCategories[catKey] = true;
        if (appData[currentCompany].learningCategories) delete appData[currentCompany].learningCategories[catKey];
    }

    // Reassign videos in deleted category to general
    const videosObj = data.learningVideos || {};
    const updates = {};
    updates[`companies/${currentCompany}/hiddenLearningCategories/${catKey}`] = true;
    updates[`companies/${currentCompany}/learningCategories/${catKey}`] = null;

    Object.values(videosObj).forEach(v => {
        if (v && v.category === catKey) {
            v.category = 'general';
            updates[`companies/${currentCompany}/learningVideos/${v.id}/category`] = 'general';
        }
    });

    if (currentLearningCategoryFilter === catKey) {
        currentLearningCategoryFilter = 'all';
    }

    renderLearningProgram();

    if (typeof db !== 'undefined' && currentCompany) {
        db.ref().update(updates).then(() => {
            if (typeof showInAppNotification === 'function') {
                showInAppNotification(isAr ? '🗑️ تم حذف القسم بنجاح ونقل الفيديوهات إلى تدريب عام.' : '🗑️ Category deleted successfully and videos moved to General.');
            }
        }).catch(err => console.error("Error deleting learning category:", err));
    }
}
window.deleteLearningCategory = deleteLearningCategory;





/**
 * Learning Program & Video Training Module
 * Allows workers to watch training subjects & videos for each department/job
 * Allows admins to add, edit, delete training videos with YouTube embeds
 */

var currentLearningCategoryFilter = currentLearningCategoryFilter || 'all';

function getYouTubeEmbedUrl(url) {
    if (!url) return '';
    const str = String(url).trim();
    let videoId = '';

    const match = str.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) {
        videoId = match[1];
    }

    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0`;
    }
    return '';
}
window.getYouTubeEmbedUrl = getYouTubeEmbedUrl;

function toggleAddLearningVideoForm() {
    const container = document.getElementById('learning-video-form-container');
    if (!container) return;

    if (container.style.display === 'none' || !container.style.display) {
        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        container.style.display = 'none';
        resetLearningVideoForm();
    }
}
window.toggleAddLearningVideoForm = toggleAddLearningVideoForm;

function resetLearningVideoForm() {
    const editId = document.getElementById('learning-editing-id');
    const titleEl = document.getElementById('learning-video-title');
    const catEl = document.getElementById('learning-video-category');
    const urlEl = document.getElementById('learning-video-url');
    const descEl = document.getElementById('learning-video-desc');
    const headerTitle = document.getElementById('learning-form-header-title');
    const submitBtn = document.getElementById('learning-video-submit-btn');

    if (editId) editId.value = '';
    if (titleEl) titleEl.value = '';
    if (catEl) catEl.value = 'warehouse';
    if (urlEl) urlEl.value = '';
    if (descEl) descEl.value = '';

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (headerTitle) headerTitle.textContent = isAr ? '📹 إضافة موضوع تدريبي ورابط فيديو' : '📹 Add Training Subject & Video Link';
    if (submitBtn) submitBtn.textContent = isAr ? '💾 حفظ الموضوع التدريبي' : '💾 Save Video Subject';
}
window.resetLearningVideoForm = resetLearningVideoForm;

function editLearningVideo(id) {
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const videosObj = data.learningVideos || {};
    const video = videosObj[id];

    if (!video) return;

    const editId = document.getElementById('learning-editing-id');
    const titleEl = document.getElementById('learning-video-title');
    const catEl = document.getElementById('learning-video-category');
    const urlEl = document.getElementById('learning-video-url');
    const descEl = document.getElementById('learning-video-desc');
    const headerTitle = document.getElementById('learning-form-header-title');
    const submitBtn = document.getElementById('learning-video-submit-btn');

    if (editId) editId.value = id;
    if (titleEl) titleEl.value = video.title || '';
    if (catEl) catEl.value = video.category || 'warehouse';
    if (urlEl) urlEl.value = video.youtubeUrl || '';
    if (descEl) descEl.value = video.description || '';

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (headerTitle) headerTitle.textContent = isAr ? '✏️ تعديل الموضوع التدريبي' : '✏️ Edit Training Subject';
    if (submitBtn) submitBtn.textContent = isAr ? '💾 حفظ التعديلات' : '💾 Save Changes';

    const container = document.getElementById('learning-video-form-container');
    if (container) {
        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}
window.editLearningVideo = editLearningVideo;

function saveLearningVideo() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const editIdEl = document.getElementById('learning-editing-id');
    const titleEl = document.getElementById('learning-video-title');
    const catEl = document.getElementById('learning-video-category');
    const urlEl = document.getElementById('learning-video-url');
    const descEl = document.getElementById('learning-video-desc');

    const title = titleEl ? titleEl.value.trim() : '';
    const category = catEl ? catEl.value : 'warehouse';
    const youtubeUrl = urlEl ? urlEl.value.trim() : '';
    const description = descEl ? descEl.value.trim() : '';
    const editingId = editIdEl ? editIdEl.value.trim() : '';

    if (!title || !youtubeUrl) {
        alert(isAr ? 'الرجاء إدخال عنوان الموضوع ورابط الفيديو على يوتيوب.' : 'Please enter subject title and YouTube URL.');
        return;
    }

    const videoId = editingId || ('learn_' + Date.now());
    const now = Date.now();
    const createdBy = (typeof currentUser !== 'undefined' && currentUser && currentUser.email) ? currentUser.email : 'Admin';

    const videoObj = {
        id: videoId,
        title: title,
        category: category,
        youtubeUrl: youtubeUrl,
        description: description,
        createdAt: editingId ? (getCompanyData().learningVideos?.[editingId]?.createdAt || now) : now,
        createdBy: createdBy,
        updatedAt: now
    };

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    if (!data.learningVideos) data.learningVideos = {};
    data.learningVideos[videoId] = videoObj;

    if (typeof appData !== 'undefined' && currentCompany && appData[currentCompany]) {
        if (!appData[currentCompany].learningVideos) appData[currentCompany].learningVideos = {};
        appData[currentCompany].learningVideos[videoId] = videoObj;
    }

    renderLearningProgram();
    toggleAddLearningVideoForm();

    if (typeof db !== 'undefined' && currentCompany) {
        db.ref(`companies/${currentCompany}/learningVideos/${videoId}`).set(videoObj).then(() => {
            if (typeof showInAppNotification === 'function') {
                showInAppNotification(isAr ? '🎓 تم حفظ الفيديو التدريبي بنجاح!' : '🎓 Training video saved successfully!');
            }
        }).catch(err => {
            console.error("Error saving learning video to Firebase:", err);
        });
    }
}
window.saveLearningVideo = saveLearningVideo;

function deleteLearningVideo(id) {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (!confirm(isAr ? 'هل أنت تأكد من حذف هذا الفيديو التدريبي؟' : 'Are you sure you want to delete this training video?')) {
        return;
    }

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    if (data.learningVideos && data.learningVideos[id]) {
        delete data.learningVideos[id];
    }
    if (typeof appData !== 'undefined' && currentCompany && appData[currentCompany] && appData[currentCompany].learningVideos) {
        delete appData[currentCompany].learningVideos[id];
    }

    renderLearningProgram();

    if (typeof db !== 'undefined' && currentCompany) {
        db.ref(`companies/${currentCompany}/learningVideos/${id}`).remove().then(() => {
            if (typeof showInAppNotification === 'function') {
                showInAppNotification(isAr ? '🗑️ تم حذف الفيديو التدريبي.' : '🗑️ Training video deleted.');
            }
        }).catch(err => {
            console.error("Error deleting learning video:", err);
        });
    }
}
window.deleteLearningVideo = deleteLearningVideo;

function setLearningCategoryFilter(cat) {
    currentLearningCategoryFilter = cat;
    renderLearningProgram();
}
window.setLearningCategoryFilter = setLearningCategoryFilter;

function getLearningCategoryMeta(catKey) {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const defs = {
        'all': { label: isAr ? '🌟 جميع الفيديوهات' : '🌟 All Videos', icon: '🌟', color: '#8b5cf6' },
        'warehouse': { label: isAr ? '📦 المستودع والمخزون' : '📦 Warehouse & Stock', icon: '📦', color: '#0284c7' },
        'sales': { label: isAr ? '💰 المبيعات والكاشير' : '💰 Sales & Cashier', icon: '💰', color: '#10b981' },
        'ops': { icon: '⚙️', label: isAr ? '⚙️ العمليات والتكاليف' : '⚙️ Operations & Costs', color: '#f59e0b' },
        'drivers': { icon: '🚚', label: isAr ? '🚚 السائقين والتوصيل' : '🚚 Drivers & Delivery', color: '#ec4899' },
        'prepare': { icon: '👨‍🍳', label: isAr ? '👨‍🍳 المطبخ والتحضير' : '👨‍🍳 Kitchen & Prepare', color: '#3b82f6' },
        'tasks': { icon: '📋', label: isAr ? '📋 المهام والنظام' : '📋 Tasks & System', color: '#6366f1' },
        'general': { icon: '🎓', label: isAr ? '🎓 تدريب عام' : '🎓 General Training', color: '#8b5cf6' }
    };

    if (defs[catKey]) return defs[catKey];

    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const customCats = data.learningCategories || {};
    const custom = customCats[catKey];

    if (custom) {
        const icon = custom.icon || '📁';
        const name = isAr ? (custom.nameAr || custom.nameEn) : (custom.nameEn || custom.nameAr);
        return {
            label: `${icon} ${name}`,
            icon: icon,
            color: custom.color || '#8b5cf6'
        };
    }

    return { label: catKey, icon: '📹', color: '#8b5cf6' };
}
window.getLearningCategoryMeta = getLearningCategoryMeta;

function renderLearningProgram() {
    const grid = document.getElementById('learning-videos-grid');
    if (!grid) return;

    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const isAdmin = (typeof currentUser !== 'undefined' && currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.isAdmin));
    const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
    const videosObj = data.learningVideos || {};
    let videos = Object.values(videosObj);

    // Search query & category filter
    const searchInput = document.getElementById('learning-search-input');
    const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';

    if (currentLearningCategoryFilter !== 'all') {
        videos = videos.filter(v => (v.category || 'general') === currentLearningCategoryFilter);
    }

    if (searchQuery) {
        videos = videos.filter(v =>
            (v.title && v.title.toLowerCase().includes(searchQuery)) ||
            (v.description && v.description.toLowerCase().includes(searchQuery))
        );
    }

    // Sort newest first
    videos.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // Update count badge
    const countBadge = document.getElementById('learning-count-badge');
    if (countBadge) {
        countBadge.textContent = `${videos.length} ${isAr ? 'فيديو تدريبي' : 'Videos'}`;
    }

    // Render Category Tabs
    const tabsContainer = document.getElementById('learning-category-tabs');
    if (tabsContainer) {
        populateLearningCategoryDropdown();
        const builtInCatKeys = ['all', 'warehouse', 'sales', 'ops', 'drivers', 'prepare', 'tasks', 'general'];
        const data = typeof getCompanyData === 'function' ? getCompanyData() : {};
        const hiddenCats = data.hiddenLearningCategories || {};
        const customCats = data.learningCategories || {};
        const customCatKeys = Object.keys(customCats);
        const catKeys = [...builtInCatKeys, ...customCatKeys].filter(k => k === 'all' || !hiddenCats[k]);
        tabsContainer.innerHTML = catKeys.map(catKey => {
            const meta = getLearningCategoryMeta(catKey);
            const isActive = currentLearningCategoryFilter === catKey;
            const canManage = isAdmin && catKey !== 'all';

            return `
                <div style="display: inline-flex; align-items: center; background: ${isActive ? meta.color : 'var(--card-bg)'}; border: 1px solid ${isActive ? meta.color : 'var(--border-color)'}; border-radius: 100px; padding: 2px 4px 2px 12px; gap: 4px; transition: all 0.2s ease;">
                    <button type="button" onclick="setLearningCategoryFilter('${catKey}')" style="padding: 5px 4px; border: none; background: transparent; color: ${isActive ? '#ffffff' : 'var(--text-main)'}; font-weight: 800; font-size: 0.82rem; cursor: pointer; white-space: nowrap;">
                        ${meta.label}
                    </button>
                    ${canManage ? `
                        <button type="button" onclick="editLearningCategory('${catKey}')" style="background: transparent; border: none; color: ${isActive ? '#ffffff' : 'var(--primary)'}; cursor: pointer; font-size: 0.75rem; font-weight: 800; padding: 2px 4px;" title="${isAr ? 'تعديل القسم' : 'Edit category'}">✏️</button>
                        <button type="button" onclick="deleteLearningCategory('${catKey}')" style="background: transparent; border: none; color: ${isActive ? '#ffffff' : 'var(--danger)'}; cursor: pointer; font-size: 0.75rem; font-weight: 800; padding: 2px 4px;" title="${isAr ? 'حذف القسم' : 'Delete category'}">🗑️</button>
                    ` : ''}
                </div>
            `;
        }).join('') + (isAdmin ? `
            <button type="button" onclick="openAddLearningCategoryModal()" class="admin-only" style="padding: 7px 14px; border-radius: 100px; font-weight: 800; font-size: 0.82rem; border: 2px dashed #8b5cf6; background: rgba(139,92,246,0.12); color: #8b5cf6; cursor: pointer; white-space: nowrap;">
                ➕ ${isAr ? 'قسم جديد' : 'New Category'}
            </button>
        ` : '');
    }

    if (videos.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; background: var(--input-bg); border-radius: 18px; border: 1px dashed var(--border-color); max-width: 600px; margin: 0 auto; width: 100%;">
                <div style="font-size: 3.5rem; margin-bottom: 12px;">📹</div>
                <h3 style="margin: 0 0 8px 0; color: var(--text-main); font-size: 1.2rem; font-weight: 800;">${isAr ? 'لا توجد فيديوهات تدريبية في هذا القسم' : 'No Training Videos Found'}</h3>
                <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">${isAr ? 'استخدم زر إضافة فيديو تدريبي جديد لنشر شروحات يوتيوب للموظفين الجدد.' : 'Use the Add Training Video button to publish YouTube tutorials for new workers.'}</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = videos.map(v => {
        const embedUrl = getYouTubeEmbedUrl(v.youtubeUrl);
        const meta = getLearningCategoryMeta(v.category || 'general');

        let videoPlayerHTML = '';
        if (embedUrl) {
            videoPlayerHTML = `
                <div style="width: 100%; aspect-ratio: 16 / 9; background: #000000; position: relative; overflow: hidden; border-radius: 12px 12px 0 0;">
                    <iframe src="${embedUrl}" title="${v.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen="true" webkitallowfullscreen mozallowfullscreen style="width: 100%; height: 100%; border: none;"></iframe>
                </div>
            `;
        } else {
            videoPlayerHTML = `
                <div style="width: 100%; aspect-ratio: 16 / 9; background: linear-gradient(135deg, #1e1b4b, #312e81); display: flex; flex-direction: column; align-items: center; justify-content: center; color: #ffffff; padding: 16px; box-sizing: border-box; border-radius: 12px 12px 0 0;">
                    <div style="font-size: 2.8rem; margin-bottom: 8px;">▶️</div>
                    <a href="${v.youtubeUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="padding: 8px 16px; font-weight: 800; font-size: 0.85rem; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                        <span>▶️ Watch on YouTube</span>
                    </a>
                </div>
            `;
        }

        const adminActions = isAdmin ? `
            <div style="display: flex; gap: 6px; align-items: center;">
                <button type="button" onclick="editLearningVideo('${v.id}')" class="btn-outline" style="padding: 4px 10px; font-size: 0.78rem; font-weight: 800; border-radius: 8px; cursor: pointer;">✏️ ${isAr ? 'تعديل' : 'Edit'}</button>
                <button type="button" onclick="deleteLearningVideo('${v.id}')" class="btn-danger" style="padding: 4px 10px; font-size: 0.78rem; font-weight: 800; border-radius: 8px; cursor: pointer;">🗑️</button>
            </div>
        ` : '';

        return `
            <div class="card" style="margin: 0; padding: 0; border-radius: 16px; border: 1px solid var(--border-color); background: var(--card-bg); overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--shadow-sm); transition: transform 0.2s ease, box-shadow 0.2s ease;">
                <div>
                    ${videoPlayerHTML}

                    <div style="padding: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
                            <span class="badge" style="background: rgba(139,92,246,0.15); color: ${meta.color}; border: 1px solid rgba(139,92,246,0.3); padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 0.75rem;">
                                ${meta.label}
                            </span>
                            ${adminActions}
                        </div>

                        <h3 style="margin: 0 0 8px 0; color: var(--text-main); font-size: 1.1rem; font-weight: 800; line-height: 1.35;">
                            ${v.title}
                        </h3>

                        ${v.description ? `
                            <p style="margin: 0; color: var(--text-muted); font-size: 0.86rem; line-height: 1.5; white-space: pre-wrap; background: var(--input-bg); padding: 10px 12px; border-radius: 10px; border: 1px dashed var(--border-color);">
                                📝 ${v.description}
                            </p>
                        ` : ''}
                    </div>
                </div>

                <div style="padding: 10px 16px 14px 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: var(--text-muted);">
                    <span>🕒 ${v.createdAt ? new Date(v.createdAt).toLocaleDateString() : ''}</span>
                    <a href="${v.youtubeUrl}" target="_blank" rel="noopener noreferrer" style="color: #8b5cf6; font-weight: 800; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                        <span>🔗 YouTube Link</span> ↗
                    </a>
                </div>
            </div>
        `;
    }).join('');
}
window.renderLearningProgram = renderLearningProgram;
