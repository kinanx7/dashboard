/**
 * Warehouse inventory management, categories, stock levels & PDF exports
 */

function renderWarehouse() {
    if (typeof checkStockAlerts === 'function') {
        checkStockAlerts();
    }
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

function closeRestockPDFViewer() {
    const modal = document.getElementById('modal-warehouse-restock-pdf-viewer');
    if (modal) modal.style.display = 'none';
}
window.closeRestockPDFViewer = closeRestockPDFViewer;

function exportWarehousePDF() {
    const data = getCompanyData().warehouse;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (!data || data.length === 0) {
        if (typeof showInAppNotification === 'function') {
            showInAppNotification(isAr ? "⚠️ المستودع فارغ حالياً." : "⚠️ Warehouse is empty.");
        } else {
            alert(isAr ? "المستودع فارغ حالياً." : "Warehouse is empty.");
        }
        return;
    }

    const modal = document.getElementById('modal-warehouse-restock-pdf-viewer');
    const container = document.getElementById('restock-pdf-paper-container');
    if (!modal || !container) return;

    const compName = (typeof currentCompany !== 'undefined' && currentCompany) ? currentCompany.toUpperCase() : 'BURGEROOV';
    let compLogo = 'burgeroov.png';
    if (currentCompany === 'mvc') compLogo = 'mvc.png';
    else if (currentCompany === 'mvcfresh') compLogo = 'mvcfresh.png';

    // Gather all folders dynamically
    let folders = [...(getCompanyData().whCategories || [])];
    data.forEach(i => {
        const cat = i.category || 'Uncategorized';
        if (!folders.includes(cat)) folders.push(cat);
    });

    let rowsHtml = '';
    let criticalList = [];
    let totalItems = data.length;
    let totalCritical = 0;
    let totalUnitsToOrder = 0;

    // Group by folders for PDF
    folders.forEach(folder => {
        const itemsInFolder = data.filter(i => (i.category || 'Uncategorized') === folder);
        if (itemsInFolder.length > 0) {
            rowsHtml += `
                <tr style="background:#f1f5f9; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;">
                    <td colspan="3" style="padding:10px 14px; font-weight:800; font-size:14px; color:#1e293b;">
                        📁 ${folder} <span style="font-size:12px; font-weight:600; color:#64748b; margin-inline-start:8px;">(${itemsInFolder.length} ${isAr ? 'صنف' : 'items'})</span>
                    </td>
                </tr>
            `;

            itemsInFolder.forEach(i => {
                const isLow = i.currentStock <= i.riskAmount;
                const toOrder = Math.max(0, i.maxStock - i.currentStock);
                totalUnitsToOrder += toOrder;

                if (isLow) {
                    totalCritical++;
                    criticalList.push(`
                        <li style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed #fca5a5; padding-bottom:6px;">
                            <span>🚨 <strong>${i.name}</strong> <span style="color:#64748b; font-size:12px;">(${folder})</span></span>
                            <span style="background:#ef4444; color:#ffffff; font-weight:800; padding:2px 10px; border-radius:12px; font-size:12px;">
                                ${isAr ? 'مطلوب:' : 'Need:'} ${toOrder}
                            </span>
                        </li>
                    `);
                }

                const rowBg = isLow ? 'background-color:#fff1f2;' : 'background-color:#ffffff;';
                const nameStyle = isLow ? 'color:#b91c1c; font-weight:800;' : 'color:#0f172a; font-weight:600;';

                let orderBadge = `<span style="color:#94a3b8; font-weight:600;">-</span>`;
                if (toOrder > 0) {
                    if (isLow) {
                        orderBadge = `<span style="background:#dc2626; color:#ffffff; font-weight:800; padding:4px 12px; border-radius:12px; font-size:13px; display:inline-block;">${toOrder}</span>`;
                    } else {
                        orderBadge = `<span style="background:#2563eb; color:#ffffff; font-weight:800; padding:4px 12px; border-radius:12px; font-size:13px; display:inline-block;">${toOrder}</span>`;
                    }
                }

                rowsHtml += `
                    <tr style="${rowBg} border-bottom: 1px solid #e2e8f0;">
                        <td style="padding:10px 14px; font-size:13px; ${nameStyle}">
                            ${isLow ? '🚨 ' : ''}${i.name}
                        </td>
                        <td style="padding:10px 14px; text-align:center; font-size:13px;">
                            <span style="display:inline-block; padding:3px 10px; border-radius:8px; background:${isLow ? '#fee2e2' : '#f1f5f9'}; color:${isLow ? '#991b1b' : '#334155'}; font-weight:700; font-size:12px;">
                                ${i.currentStock} / ${i.maxStock}
                            </span>
                        </td>
                        <td style="padding:10px 14px; text-align:center; font-size:13px;">
                            ${orderBadge}
                        </td>
                    </tr>
                `;
            });
        }
    });

    let criticalHtml = '';
    if (criticalList.length > 0) {
        criticalHtml = `
            <div style="margin-top:24px; border:2px solid #ef4444; border-radius:12px; background-color:#fef2f2; padding:18px; box-shadow:0 2px 8px rgba(239,68,68,0.1);">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px; color:#b91c1c; font-weight:900; font-size:15px;">
                    <span style="font-size:20px;">🚨</span>
                    <span>${isAr ? 'قائمة النواقص والأصناف الحرجة العاجلة للطلب فوراً' : 'CRITICAL RESTOCK ORDERS - IMMEDIATE ACTION REQUIRED'}</span>
                </div>
                <ul style="margin:0; padding:0; list-style:none; color:#7f1d1d; font-size:13px; line-height:1.6;">
                    ${criticalList.join('')}
                </ul>
            </div>
        `;
    }

    const reportDate = new Date().toLocaleString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    container.innerHTML = `
        <div id="restock-pdf-paper-content" class="a4-restock-page" style="background:#ffffff; color:#0f172a; max-width:820px; margin:0 auto; padding:32px 28px; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.1); box-sizing:border-box; font-family:'Segoe UI', 'Cairo', Tahoma, Arial, sans-serif; direction:${isAr ? 'rtl' : 'ltr'}; text-align:${isAr ? 'right' : 'left'};">
            
            <!-- Document Header -->
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #c5832b; padding-bottom:18px; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
                <div style="display:flex; align-items:center; gap:14px;">
                    <img src="${compLogo}" alt="Logo" style="height:52px; max-width:130px; object-fit:contain;" onerror="this.style.display='none';" />
                    <div>
                        <h1 style="margin:0; font-size:22px; font-weight:900; color:#0f172a;">${compName}</h1>
                        <span style="font-size:13px; font-weight:700; color:#64748b;">${isAr ? 'إدارة العمليات والمستودع المركزي' : 'Operations & Central Warehouse'}</span>
                    </div>
                </div>
                <div style="text-align:${isAr ? 'left' : 'right'}; font-size:13px; color:#475569;">
                    <div style="font-weight:900; color:#0f172a; font-size:16px;">${isAr ? '📋 تقرير طلب نواقص وبضاعة' : '📋 Warehouse Restock Order'}</div>
                    <div style="margin-top:4px; font-size:12px; color:#64748b;">📅 ${reportDate}</div>
                </div>
            </div>

            <!-- Summary HUD KPI Cards -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:20px;">
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px 14px; text-align:center;">
                    <div style="font-size:11px; font-weight:700; color:#64748b;">${isAr ? 'إجمالي الأصناف' : 'Total Items'}</div>
                    <div style="font-size:20px; font-weight:900; color:#0f172a; margin-top:2px;">${totalItems}</div>
                </div>
                <div style="background:${totalCritical > 0 ? '#fef2f2' : '#f8fafc'}; border:1px solid ${totalCritical > 0 ? '#fecaca' : '#e2e8f0'}; border-radius:10px; padding:12px 14px; text-align:center;">
                    <div style="font-size:11px; font-weight:700; color:${totalCritical > 0 ? '#dc2626' : '#64748b'};">${isAr ? 'أصناف حرجة للطلب' : 'Critical Items'}</div>
                    <div style="font-size:20px; font-weight:900; color:${totalCritical > 0 ? '#dc2626' : '#0f172a'}; margin-top:2px;">${totalCritical}</div>
                </div>
                <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; padding:12px 14px; text-align:center;">
                    <div style="font-size:11px; font-weight:700; color:#0369a1;">${isAr ? 'إجمالي الكميات المطلوبة' : 'Total Units to Order'}</div>
                    <div style="font-size:20px; font-weight:900; color:#0284c7; margin-top:2px;">${totalUnitsToOrder}</div>
                </div>
            </div>

            <!-- Table of Items -->
            <table style="width:100%; border-collapse:collapse; margin-top:10px; font-size:13px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                <thead>
                    <tr style="background:#1e293b; color:#ffffff;">
                        <th style="padding:12px 14px; text-align:${isAr ? 'right' : 'left'}; font-size:13px; font-weight:800;">${isAr ? 'اسم الصنف / المنتج' : 'Product Name'}</th>
                        <th style="padding:12px 14px; text-align:center; font-size:13px; font-weight:800; width:160px;">${isAr ? 'المتوفر / الأقصى' : 'Current / Max'}</th>
                        <th style="padding:12px 14px; text-align:center; font-size:13px; font-weight:800; width:140px;">${isAr ? 'الكمية للطلب' : 'Order Qty'}</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <!-- Critical List Alert Callout -->
            ${criticalHtml}

            <!-- Document Footer -->
            <div style="margin-top:35px; padding-top:14px; border-top:1px dashed #cbd5e1; display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#64748b; flex-wrap:wrap; gap:8px;">
                <div>🏢 ${compName} Operations Management System</div>
                <div>✅ Automated Restock Document</div>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
}

function printRestockPDF() {
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    const container = document.getElementById('restock-pdf-paper-content');
    if (!container) return;

    // Check Native Android Print Bridge
    const androidBridge = window.AndroidInterface || window.Android || window.AndroidShare;
    if (androidBridge && typeof androidBridge.printDocument === 'function') {
        try {
            androidBridge.printDocument();
            return;
        } catch (e) {
            console.warn("androidBridge.printDocument error:", e);
        }
    }

    // High quality native browser / mobile vector print (Crisp Arabic with NO canvas corruptions)
    const printHTML = `
        <!DOCTYPE html>
        <html dir="${isAr ? 'rtl' : 'ltr'}" lang="${isAr ? 'ar' : 'en'}">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${isAr ? 'تقرير_طلب_بضاعة' : 'Restock_Order_Report'}</title>
            <style>
                @page {
                    size: A4 portrait;
                    margin: 10mm;
                }
                @media print {
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                    }
                    .a4-restock-page {
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        max-width: 100% !important;
                    }
                }
                body {
                    font-family: 'Segoe UI', 'Cairo', Tahoma, Arial, sans-serif;
                    background: #ffffff;
                    color: #0f172a;
                    margin: 0;
                    padding: 10mm;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
            </style>
        </head>
        <body>
            ${container.outerHTML}
        </body>
        </html>
    `;

    const blob = new Blob([printHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.onload = function() {
        setTimeout(function() {
            try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } catch (e) {
                console.warn("Iframe print error:", e);
                window.print();
            }
            setTimeout(() => {
                try {
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(url);
                } catch (e) {}
            }, 3000);
        }, 300);
    };
}
window.printRestockPDF = printRestockPDF;

function shareRestockTextReport() {
    const data = getCompanyData().warehouse;
    const isAr = (typeof currentAppLang !== 'undefined' && currentAppLang === 'ar');
    if (!data || data.length === 0) return;

    const compName = (typeof currentCompany !== 'undefined' && currentCompany) ? currentCompany.toUpperCase() : 'BURGEROOV';
    const reportDate = new Date().toLocaleString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    let criticalLines = [];
    let regularLines = [];
    let totalUnits = 0;

    data.forEach(i => {
        const isLow = i.currentStock <= i.riskAmount;
        const toOrder = Math.max(0, i.maxStock - i.currentStock);
        if (toOrder > 0) {
            totalUnits += toOrder;
            const line = `• ${i.name} [${i.category || 'عام'}]: مطلوب (${toOrder}) - متوفر حالياً (${i.currentStock}/${i.maxStock})`;
            if (isLow) {
                criticalLines.push(`🚨 ` + line);
            } else {
                regularLines.push(`▫️ ` + line);
            }
        }
    });

    let msg = `📦 *${isAr ? 'طلب بضاعة ونواقص المستودع' : 'Warehouse Restock Order'} - ${compName}*\n`;
    msg += `📅 ${reportDate}\n\n`;

    if (criticalLines.length > 0) {
        msg += `🔥 *${isAr ? 'النواقص الحرجة العاجلة:' : 'CRITICAL DEFICITS:'}*\n`;
        msg += criticalLines.join('\n') + '\n\n';
    }

    if (regularLines.length > 0) {
        msg += `📋 *${isAr ? 'باقي النواقص للطلب:' : 'Other Restock Items:'}*\n`;
        msg += regularLines.join('\n') + '\n\n';
    }

    if (criticalLines.length === 0 && regularLines.length === 0) {
        msg += isAr ? `✅ المستودع مكتمل ولا توجد نواقص حالياً.` : `✅ All items are in stock.`;
    } else {
        msg += `🛒 *${isAr ? 'إجمالي الكميات المطلوبة:' : 'Total Units to Order:'}* ${totalUnits}\n`;
    }

    // Share via Web Share or WhatsApp
    if (navigator.share) {
        navigator.share({
            title: isAr ? 'طلب نواقص المستودع' : 'Warehouse Restock Order',
            text: msg
        }).catch(() => {
            openWhatsAppFallback(msg);
        });
    } else {
        openWhatsAppFallback(msg);
    }

    function openWhatsAppFallback(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text);
            }
        } catch (e) {}
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
    }
}
window.shareRestockTextReport = shareRestockTextReport;

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
if (typeof printRestockPDF === 'function') window.printRestockPDF = printRestockPDF;
if (typeof closeRestockPDFViewer === 'function') window.closeRestockPDFViewer = closeRestockPDFViewer;
if (typeof downloadBackup === 'function') window.downloadBackup = downloadBackup;
if (typeof triggerRestore === 'function') window.triggerRestore = triggerRestore;
if (typeof processRestoreFile === 'function') window.processRestoreFile = processRestoreFile;
