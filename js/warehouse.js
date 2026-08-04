/**
 * Warehouse inventory management, categories, stock levels & PDF exports
 */

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

// --- AUTOMATIC IN-SCOPE WINDOW EXPORTS ---
if (typeof renderWarehouse === 'function') window.renderWarehouse = renderWarehouse;
if (typeof exportWarehousePDF === 'function') window.exportWarehousePDF = exportWarehousePDF;
if (typeof downloadBackup === 'function') window.downloadBackup = downloadBackup;
if (typeof triggerRestore === 'function') window.triggerRestore = triggerRestore;
if (typeof processRestoreFile === 'function') window.processRestoreFile = processRestoreFile;
