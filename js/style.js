/**
 * VICard 12-Inch Tablet Responsive Layout & Style Controller (js/style.js)
 * Optimized for iPad Pro 12.9" / 11", Samsung Galaxy Tab S8+/S9+ 12.4", Surface Pro
 * Viewports: 769px - 1280px (Landscape & Portrait)
 */

(function () {
    'use strict';

    const VICARD_TABLET_CONFIG = {
        minWidth: 769,
        maxWidth: 1280,
        breakpoints: {
            tabletPortraitMax: 960,
            tabletLandscapeMax: 1280
        },
        banner: {
            portraitHeight: 260,
            landscapeHeight: 320
        },
        touchTargetMinSize: 44
    };

    /**
     * Checks if current viewport matches tablet specifications
     */
    function isVicardTabletViewport() {
        const width = window.innerWidth;
        return width >= VICARD_TABLET_CONFIG.minWidth && width <= VICARD_TABLET_CONFIG.maxWidth;
    }

    /**
     * Applies dynamic layout adjustments for 12-inch tablet devices
     * Eliminates horizontal scrolling, side empty areas, and improper grids.
     */
    function applyVicardTabletLayout() {
        const isTablet = isVicardTabletViewport();
        const isPortrait = window.innerWidth <= VICARD_TABLET_CONFIG.breakpoints.tabletPortraitMax;

        // Prevent body and document sideways scrolling on tablet
        if (isTablet) {
            document.documentElement.style.overflowX = 'hidden';
            document.body.style.overflowX = 'hidden';
            document.documentElement.style.maxWidth = '100%';
            document.body.style.maxWidth = '100%';
        }

        // 1. Enforce Full-Width Single Column on #view-nfc
        const viewNfc = document.getElementById('view-nfc');
        if (viewNfc) {
            if (isTablet) {
                viewNfc.style.display = 'block';
                viewNfc.style.gridTemplateColumns = '1fr';
                viewNfc.style.maxWidth = '100%';
                viewNfc.style.width = '100%';
                viewNfc.style.padding = '0 16px 40px 16px';
                viewNfc.style.margin = '0 auto';
                viewNfc.style.boxSizing = 'border-box';
                viewNfc.style.overflowX = 'hidden';
            } else if (window.innerWidth <= 768) {
                viewNfc.style.display = 'block';
                viewNfc.style.maxWidth = '100%';
                viewNfc.style.padding = '0 10px 40px 10px';
            } else {
                viewNfc.style.maxWidth = '1550px';
            }
        }

        // 2. Adjust NFC Manager Grid (.nfc-grid-responsive)
        const nfcGrid = document.querySelector('.nfc-grid-responsive');
        if (nfcGrid) {
            if (isTablet) {
                nfcGrid.style.width = '100%';
                nfcGrid.style.maxWidth = '100%';
                nfcGrid.style.boxSizing = 'border-box';
                if (isPortrait) {
                    nfcGrid.style.display = 'flex';
                    nfcGrid.style.flexDirection = 'column';
                    nfcGrid.style.gap = '20px';
                } else {
                    nfcGrid.style.display = 'grid';
                    nfcGrid.style.gridTemplateColumns = '310px minmax(0, 1fr)';
                    nfcGrid.style.gap = '18px';
                }
            } else if (window.innerWidth <= 768) {
                nfcGrid.style.display = 'flex';
                nfcGrid.style.flexDirection = 'column';
            } else {
                nfcGrid.style.display = 'grid';
                nfcGrid.style.gridTemplateColumns = '360px 1fr';
                nfcGrid.style.gap = '24px';
            }
        }

        // 3. Prevent Table Container Side Blowout in Manager Hub
        const custTableWrap = document.querySelector('#vicard-customers-table-body');
        if (custTableWrap) {
            const tableCard = custTableWrap.closest('.card');
            if (tableCard) {
                tableCard.style.maxWidth = '100%';
                tableCard.style.boxSizing = 'border-box';
                tableCard.style.overflow = 'hidden';
            }
        }

        // 4. Standalone Customer Portal Overlay Sizing
        const portalOverlay = document.getElementById('vicard-customer-portal-overlay');
        if (portalOverlay) {
            portalOverlay.style.width = '100%';
            portalOverlay.style.maxWidth = '100%';
            portalOverlay.style.overflowX = 'hidden';
            portalOverlay.style.boxSizing = 'border-box';

            const innerWrap = portalOverlay.querySelector('div');
            if (innerWrap) {
                if (isTablet) {
                    innerWrap.style.maxWidth = '1060px';
                    innerWrap.style.width = '100%';
                    innerWrap.style.margin = '0 auto';
                    innerWrap.style.padding = '0 12px 60px 12px';
                    innerWrap.style.boxSizing = 'border-box';
                } else if (window.innerWidth <= 768) {
                    innerWrap.style.maxWidth = '540px';
                    innerWrap.style.padding = '0 0 50px 0';
                } else {
                    innerWrap.style.maxWidth = '1180px';
                }
            }
        }

        // 5. Cashier Overlay Container Sizing
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

        // 6. Smooth centering of active category tab
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
                if (tab === 'nfc') {
                    setTimeout(applyVicardTabletLayout, 10);
                    setTimeout(applyVicardTabletLayout, 100);
                }
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
