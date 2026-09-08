/**
 * VICard Tablet Responsive Layout & Style Controller (js/style.js)
 * Optimized for Samsung Galaxy Tab S9+ / S8+ (12.4"), iPad Pro 12.9" / 11", Surface Pro
 * Viewports: up to 1400px (Landscape & Portrait)
 */

(function () {
    'use strict';

    const VICARD_TABLET_CONFIG = {
        minWidth: 320,
        maxWidth: 1400,
        breakpoints: {
            mobileMax: 768,
            tabletPortraitMax: 960,
            tabletLandscapeMax: 1400
        },
        banner: {
            portraitHeight: 260,
            landscapeHeight: 320
        },
        touchTargetMinSize: 44
    };

    /**
     * Checks if current viewport matches tablet/touch specifications (<= 1400px)
     */
    function isVicardTabletViewport() {
        return window.innerWidth <= VICARD_TABLET_CONFIG.maxWidth;
    }

    /**
     * Applies dynamic layout adjustments for tablet devices
     * Eliminates horizontal scrolling, side empty areas, and improper grids.
     */
    function applyVicardTabletLayout() {
        const isTablet = isVicardTabletViewport();

        // 1. Prevent body and document sideways scrolling on tablet & mobile
        if (isTablet) {
            document.documentElement.style.overflowX = 'hidden';
            document.body.style.overflowX = 'hidden';
            document.documentElement.style.maxWidth = '100%';
            document.body.style.maxWidth = '100%';

            const appWrapper = document.getElementById('app-wrapper');
            if (appWrapper) {
                appWrapper.style.width = '100%';
                appWrapper.style.maxWidth = '100%';
                appWrapper.style.overflowX = 'hidden';
                appWrapper.style.boxSizing = 'border-box';
            }
        }

        // 2. Department Tabs Bar: Natural Multi-Line Wrapping (No horizontal cutoff)
        const tabsContainer = document.getElementById('department-tabs-container');
        if (tabsContainer) {
            tabsContainer.style.display = 'flex';
            tabsContainer.style.flexWrap = 'wrap';
            tabsContainer.style.overflowX = 'visible';
            tabsContainer.style.overflowY = 'visible';
            tabsContainer.style.width = '100%';
            tabsContainer.style.boxSizing = 'border-box';
            tabsContainer.style.justifyContent = 'center';
            tabsContainer.style.gap = '8px';
        }

        // 3. View Section Width Container
        const viewNfc = document.getElementById('view-nfc');
        if (viewNfc) {
            if (window.innerWidth <= 768) {
                viewNfc.style.maxWidth = '100%';
                viewNfc.style.width = '100%';
                viewNfc.style.padding = '0 10px 40px 10px';
                viewNfc.style.boxSizing = 'border-box';
                viewNfc.style.overflowX = 'hidden';
            } else {
                viewNfc.style.maxWidth = '1550px';
                viewNfc.style.width = '100%';
                viewNfc.style.padding = '0 20px 40px 20px';
                viewNfc.style.display = '';
                viewNfc.style.gridTemplateColumns = '1fr';
            }
        }

        // 4. NFC Manager Grid: 2 Columns on PC (360px 1fr), Stacked on Mobile
        const nfcGrid = document.querySelector('.nfc-grid-responsive');
        if (nfcGrid) {
            if (window.innerWidth <= 768) {
                nfcGrid.style.display = 'flex';
                nfcGrid.style.flexDirection = 'column';
                nfcGrid.style.gap = '16px';
                nfcGrid.style.width = '100%';
                nfcGrid.style.maxWidth = '100%';
                nfcGrid.style.boxSizing = 'border-box';

                const firstCard = nfcGrid.querySelector('.card:first-child');
                if (firstCard) {
                    firstCard.style.position = 'relative';
                    firstCard.style.top = 'auto';
                    firstCard.style.width = '100%';
                    firstCard.style.boxSizing = 'border-box';
                }
            } else {
                nfcGrid.style.display = 'grid';
                nfcGrid.style.gridTemplateColumns = '360px 1fr';
                nfcGrid.style.gap = '24px';
                nfcGrid.style.width = '100%';
                nfcGrid.style.boxSizing = 'border-box';
            }
        }

        // 5. Partner Restaurants Grid: Generous Card Width
        const restsGrid = document.getElementById('vicard-restaurants-grid');
        if (restsGrid && isTablet) {
            restsGrid.style.display = 'grid';
            restsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
            restsGrid.style.gap = '20px';
            restsGrid.style.width = '100%';
            restsGrid.style.boxSizing = 'border-box';
        }

        // 6. Prevent Table Container Side Blowout in Manager Hub
        const custTableWrap = document.querySelector('#vicard-customers-table-body');
        if (custTableWrap) {
            const tableCard = custTableWrap.closest('.card');
            if (tableCard) {
                tableCard.style.width = '100%';
                tableCard.style.maxWidth = '100%';
                tableCard.style.boxSizing = 'border-box';
                tableCard.style.overflow = 'hidden';
            }
            const tableScrollWrap = custTableWrap.closest('div[style*="overflow-x"]');
            if (tableScrollWrap) {
                tableScrollWrap.style.width = '100%';
                tableScrollWrap.style.maxWidth = '100%';
                tableScrollWrap.style.boxSizing = 'border-box';
                tableScrollWrap.style.webkitOverflowScrolling = 'touch';
            }
        }

        // 7. Standalone Customer Portal Overlay Sizing
        const portalOverlay = document.getElementById('vicard-customer-portal-overlay');
        if (portalOverlay) {
            portalOverlay.style.width = '100%';
            portalOverlay.style.maxWidth = '100%';
            portalOverlay.style.overflowX = 'hidden';
            portalOverlay.style.boxSizing = 'border-box';

            const innerWrap = portalOverlay.querySelector('div');
            if (innerWrap) {
                if (isTablet) {
                    innerWrap.style.maxWidth = '1080px';
                    innerWrap.style.width = '100%';
                    innerWrap.style.margin = '0 auto';
                    innerWrap.style.padding = '0 12px 60px 12px';
                    innerWrap.style.boxSizing = 'border-box';
                } else {
                    innerWrap.style.maxWidth = '1180px';
                }
            }
        }

        // 8. Cashier Overlay Container Sizing
        const cashierOverlay = document.getElementById('vicard-cashier-overlay');
        if (cashierOverlay) {
            cashierOverlay.style.width = '100%';
            cashierOverlay.style.maxWidth = '100%';
            cashierOverlay.style.overflowX = 'hidden';
            cashierOverlay.style.boxSizing = 'border-box';

            const cashierWrap = cashierOverlay.querySelector('div');
            if (cashierWrap) {
                if (isTablet) {
                    cashierWrap.style.maxWidth = '540px';
                    cashierWrap.style.width = '100%';
                    cashierWrap.style.margin = '24px auto';
                    cashierWrap.style.boxSizing = 'border-box';
                } else {
                    cashierWrap.style.maxWidth = '500px';
                }
            }
        }

        // 9. Smooth centering of active category tab in customer portal
        const activeTab = document.querySelector('.keeta-cat-pill.active, .keeta-category-pill.active');
        if (activeTab && activeTab.parentElement) {
            const carousel = activeTab.parentElement;
            const tabLeft = activeTab.offsetLeft;
            const tabWidth = activeTab.offsetWidth;
            const carouselWidth = carousel.offsetWidth;
            const targetScroll = tabLeft - (carouselWidth / 2) + (tabWidth / 2);
            carousel.scrollTo({
                left: Math.max(0, targetScroll),
                behavior: 'smooth'
            });
        }
    }

    // Wrap tab switcher functions to automatically trigger layout optimization
    function hookTabSwitchers() {
        if (typeof window.switchTab === 'function' && !window.switchTab.__vicardTabletHooked) {
            const originalSwitchTab = window.switchTab;
            window.switchTab = function (tab) {
                const result = originalSwitchTab.apply(this, arguments);
                setTimeout(applyVicardTabletLayout, 10);
                setTimeout(applyVicardTabletLayout, 100);
                return result;
            };
            window.switchTab.__vicardTabletHooked = true;
        }

        if (typeof window.switchNfcSubTab === 'function' && !window.switchNfcSubTab.__vicardTabletHooked) {
            const originalSwitchNfcSubTab = window.switchNfcSubTab;
            window.switchNfcSubTab = function (subTab) {
                const result = originalSwitchNfcSubTab.apply(this, arguments);
                setTimeout(applyVicardTabletLayout, 10);
                setTimeout(applyVicardTabletLayout, 100);
                return result;
            };
            window.switchNfcSubTab.__vicardTabletHooked = true;
        }
    }

    // Initialize layout controller
    if (typeof window !== 'undefined') {
        window.vicardTabletLayout = {
            config: VICARD_TABLET_CONFIG,
            isTablet: isVicardTabletViewport,
            applyLayout: applyVicardTabletLayout
        };

        window.addEventListener('resize', debounce(applyVicardTabletLayout, 100));
        window.addEventListener('orientationchange', function () {
            setTimeout(applyVicardTabletLayout, 150);
        });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                hookTabSwitchers();
                applyVicardTabletLayout();
            });
        } else {
            hookTabSwitchers();
            applyVicardTabletLayout();
        }

        // Retry hook after brief delay to catch late-initialized scripts
        setTimeout(hookTabSwitchers, 500);
        setTimeout(hookTabSwitchers, 1500);
    }

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
})();
