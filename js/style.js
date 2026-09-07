/**
 * VICard 12-Inch Tablet Responsive Layout & Style Controller
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
            portraitHeight: 250,
            landscapeHeight: 310
        },
        touchTargetMinSize: 44
    };

    /**
     * Checks if current viewport matches 12-inch tablet specifications
     */
    function isVicardTabletViewport() {
        const width = window.innerWidth;
        return width >= VICARD_TABLET_CONFIG.minWidth && width <= VICARD_TABLET_CONFIG.maxWidth;
    }

    /**
     * Applies dynamic layout adjustments for 12-inch tablet devices
     */
    function applyVicardTabletLayout() {
        const isTablet = isVicardTabletViewport();
        const isPortrait = window.innerWidth <= VICARD_TABLET_CONFIG.breakpoints.tabletPortraitMax;

        // 1. Standalone Customer Portal & Cashier Overlay Container Sizing
        const portalOverlay = document.getElementById('vicard-customer-portal-overlay');
        if (portalOverlay) {
            const innerWrap = portalOverlay.querySelector('div');
            if (innerWrap) {
                if (isTablet) {
                    innerWrap.style.maxWidth = '1060px';
                    innerWrap.style.width = '100%';
                    innerWrap.style.margin = '0 auto';
                    innerWrap.style.paddingBottom = '60px';
                } else if (window.innerWidth <= 768) {
                    innerWrap.style.maxWidth = '540px';
                } else {
                    innerWrap.style.maxWidth = '1180px';
                }
            }
        }

        const cashierOverlay = document.getElementById('vicard-cashier-overlay');
        if (cashierOverlay) {
            const cashierWrap = cashierOverlay.querySelector('div');
            if (cashierWrap) {
                if (isTablet) {
                    cashierWrap.style.maxWidth = '540px';
                    cashierWrap.style.width = '100%';
                    cashierWrap.style.margin = '24px auto';
                } else {
                    cashierWrap.style.maxWidth = '500px';
                }
            }
        }

        // 2. Auto-scroll active category tab into view on tablet
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

    // Initialize layout on DOM load and resize/orientationchange
    if (typeof window !== 'undefined') {
        window.vicardTabletLayout = {
            config: VICARD_TABLET_CONFIG,
            isTablet: isVicardTabletViewport,
            applyLayout: applyVicardTabletLayout
        };

        window.addEventListener('resize', debounce(applyVicardTabletLayout, 100));
        window.addEventListener('orientationchange', function () {
            setTimeout(applyVicardTabletLayout, 200);
        });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyVicardTabletLayout);
        } else {
            applyVicardTabletLayout();
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
})();
