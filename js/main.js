import { initAccordion } from './accordion.js?v=20260825-4';
import { initCarousels } from './slider.js?v=20260829-15';

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.screenshots-section img, .guides-section img, .app-section img').forEach((image) => {
    image.loading = 'lazy';
    image.decoding = 'async';
  });

  // 1. Initialize Components
  initAccordion();
  initCarousels();

  // 1.5. Count-up statistic: start when the 73% block enters the viewport.
  const countUpElements = document.querySelectorAll('[data-count-to]');
  const animateCountUp = (element) => {
    const target = Number(element.dataset.countTo);
    if (!Number.isFinite(target)) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.textContent = String(target);
      return;
    }

    const start = 1;
    const duration = 1400;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      element.textContent = String(Math.round(start + (target - start) * easedProgress));

      if (progress < 1) requestAnimationFrame(tick);
    };

    element.textContent = String(start);
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const countUpObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCountUp(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.35 });

    countUpElements.forEach((element) => countUpObserver.observe(element));
  } else {
    countUpElements.forEach(animateCountUp);
  }

  // 2. Mobile Navigation Toggle
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const headerNav = document.getElementById('header-nav');

  if (menuToggle && headerNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = headerNav.classList.toggle('mobile-active');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    });

    // Close menu when clicking a link
    headerNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        headerNav.classList.remove('mobile-active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Открыть меню');
      });
    });
  }

  // 3. Smart Header: Hide on Scroll Down, Reveal Smoothly on Scroll Up
  const siteHeader = document.querySelector('.site-header');
  let lastScrollY = window.scrollY;
  let headerDirection = 0;
  let headerDirectionStartY = lastScrollY;
  let headerFrame = 0;

  const syncHeader = (currentScrollY) => {
    const scrollDelta = currentScrollY - lastScrollY;
    const nextDirection = Math.sign(scrollDelta);

    if (currentScrollY <= 60) {
      siteHeader.classList.remove('header-hidden');
      headerDirection = 0;
      headerDirectionStartY = currentScrollY;
      lastScrollY = currentScrollY;
      return;
    }

    // Track one continuous gesture instead of reacting to every wheel/trackpad
    // event. This prevents the fixed header from flickering on micro-bounces.
    if (nextDirection && nextDirection !== headerDirection) {
      headerDirection = nextDirection;
      headerDirectionStartY = lastScrollY;
    }

    const gestureDistance = Math.abs(currentScrollY - headerDirectionStartY);
    if (headerDirection > 0 && currentScrollY > 120 && gestureDistance >= 24) {
      siteHeader.classList.add('header-hidden');
      headerDirectionStartY = currentScrollY;
    } else if (headerDirection < 0 && gestureDistance >= 16) {
      siteHeader.classList.remove('header-hidden');
      headerDirectionStartY = currentScrollY;
    }

    lastScrollY = currentScrollY;
  };

  window.addEventListener('scroll', () => {
    if (headerFrame) return;
    headerFrame = requestAnimationFrame(() => {
      headerFrame = 0;
      syncHeader(window.scrollY);
    });
  }, { passive: true });

  // Apply the initial mobile state before the first scroll event.
  syncHeader(lastScrollY);

  // 4. Smooth Anchor Scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // 4.5. Payment widgets: one accessible modal for the three tariff options.
  const paymentModal = document.getElementById('payment-modal');
  const paymentDialog = paymentModal?.querySelector('.payment-modal__dialog');
  const paymentCloseButton = paymentModal?.querySelector('.payment-modal__close');
  const paymentSlots = document.querySelectorAll('[data-payment-widget]');
  const paymentTriggers = document.querySelectorAll('[data-widget-trigger="payment"]');
  const paymentLabels = {
    offline: 'Оплата программы OFFline',
    online: 'Оплата программы ONline',
    bundle: 'Оплата комплекта OFFline + ONline'
  };
  let lastPaymentTrigger = null;

  const closePaymentModal = () => {
    if (!paymentModal || paymentModal.hidden) return;
    paymentModal.hidden = true;
    paymentModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastPaymentTrigger?.focus();
  };

  const openPaymentModal = (tariff, trigger) => {
    if (!paymentModal || !paymentLabels[tariff]) return;

    lastPaymentTrigger = trigger;
    paymentDialog?.setAttribute('aria-label', paymentLabels[tariff]);
    paymentSlots.forEach(slot => {
      slot.hidden = slot.dataset.paymentWidget !== tariff;
    });
    paymentModal.hidden = false;
    paymentModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    paymentCloseButton?.focus();
  };

  paymentTriggers.forEach(trigger => {
    trigger.addEventListener('click', event => {
      event.preventDefault();
      openPaymentModal(trigger.dataset.tariff, trigger);
    });
  });

  paymentCloseButton?.addEventListener('click', closePaymentModal);
  paymentModal?.addEventListener('click', event => {
    if (event.target === paymentModal) closePaymentModal();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closePaymentModal();
  });

  // 5. Intelligent Viewport-Triggered Background Video Loader & Player
  const lazyKinescopeFrames = document.querySelectorAll('.lazy-kinescope');

  if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const iframe = entry.target;
        const targetSrc = iframe.dataset.src;

        if (entry.isIntersecting) {
          // Mount and play video as soon as user is approaching/entering the section
          if (!iframe.getAttribute('src') && targetSrc) {
            iframe.src = targetSrc;
            iframe.addEventListener('load', () => {
              iframe.classList.add('is-loaded');
            }, { once: true });
          }
        }
      });
    }, {
      root: null,
      rootMargin: '200px 0px 200px 0px', // Buffer 200px before viewport for instantaneous start
      threshold: 0.05
    });

    lazyKinescopeFrames.forEach(frame => videoObserver.observe(frame));
  } else {
    // Fallback for non-supporting browsers
    lazyKinescopeFrames.forEach(frame => {
      if (frame.dataset.src) {
        frame.src = frame.dataset.src;
        frame.classList.add('is-loaded');
      }
    });
  }

  // 6. Video Player Modal / Lightbox (Kinescope Fullscreen Player)
  const videoTriggers = document.querySelectorAll('.video-preview-card, .trailer-video-box');
  videoTriggers.forEach(trigger => {
    const handleOpenVideo = (e) => {
      e.stopPropagation();
      const videoSrc = trigger.dataset.videoSrc || 'https://kinescope.io/embed/qnkaYphFo5uZ7E4rgvUBkc';

      const modal = document.createElement('div');
      modal.className = 'video-modal-overlay';
      modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0, 0, 0, 0.92); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px; opacity: 0; transition: opacity 0.3s ease; box-sizing: border-box;';

      modal.innerHTML = `
        <div class="video-modal-container" style="position: relative; width: 1000px; max-width: 100%; aspect-ratio: 16/9; background: #0C0D0E; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 30px 80px rgba(0,0,0,0.95);">
          <button class="video-modal-close" aria-label="Закрыть видео" style="position: absolute; top: 16px; right: 16px; width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); color: #FFFFFF; font-size: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); transition: background 0.2s, transform 0.2s;">×</button>
          <iframe width="100%" height="100%" src="${videoSrc}?autoplay=1" title="Kinescope Video Player" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer" allowfullscreen style="display: block; width: 100%; height: 100%; border: none;"></iframe>
        </div>
      `;

      document.body.appendChild(modal);
      document.body.style.overflow = 'hidden';

      requestAnimationFrame(() => {
        modal.style.opacity = '1';
      });

      const closeModal = () => {
        modal.style.opacity = '0';
        document.body.style.overflow = '';
        setTimeout(() => {
          if (modal.parentNode) modal.parentNode.removeChild(modal);
        }, 300);
        document.removeEventListener('keydown', onEsc);
      };

      const onEsc = (ev) => {
        if (ev.key === 'Escape') closeModal();
      };
      document.addEventListener('keydown', onEsc);

      const closeBtn = modal.querySelector('.video-modal-close');
      closeBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) closeModal();
      });
    };

    trigger.addEventListener('click', handleOpenVideo);
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleOpenVideo(event);
      }
    });
  });

  // 6. Screenshot Zoom / Lightbox (intentional click/tap only)
  const screenshotItems = document.querySelectorAll('.screenshot-item');
  let activeScreenshotOverlay = null;

  const openScreenshotModal = (src) => {
    if (activeScreenshotOverlay) {
      if (activeScreenshotOverlay.dataset.src === src) return;
      activeScreenshotOverlay.remove();
      activeScreenshotOverlay = null;
    }
    const overlay = document.createElement('div');
    overlay.className = 'screenshot-modal-overlay';
    overlay.dataset.src = src;
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0, 0, 0, 0.88)';
    overlay.style.backdropFilter = 'blur(12px)';
    overlay.style.webkitBackdropFilter = 'blur(12px)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '24px';
    overlay.style.cursor = 'zoom-out';
    overlay.style.pointerEvents = 'auto';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.25s ease';

    const bigImg = document.createElement('img');
    bigImg.src = src;
    bigImg.style.maxHeight = '90vh';
    bigImg.style.maxWidth = '90vw';
    bigImg.style.borderRadius = '16px';
    bigImg.style.boxShadow = '0 25px 60px rgba(0, 0, 0, 0.85)';
    bigImg.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
    bigImg.style.transform = 'scale(0.96)';

    overlay.appendChild(bigImg);
    document.body.appendChild(overlay);
    activeScreenshotOverlay = overlay;

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      bigImg.style.transform = 'scale(1)';
    });

    const close = () => {
      overlay.style.opacity = '0';
      bigImg.style.transform = 'scale(0.96)';
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (activeScreenshotOverlay === overlay) activeScreenshotOverlay = null;
      }, 250);
    };

    overlay.addEventListener('click', close);
  };

  screenshotItems.forEach(item => {
    const image = item.querySelector('img');
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Открыть изображение: ${image?.alt || 'отзыв'}`);

    // Open only after an intentional click/tap (or keyboard activation).
    item.addEventListener('click', () => {
      if (image) openScreenshotModal(image.src);
    });

    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (image) openScreenshotModal(image.src);
      }
    });
  });

  // 7. Sticky Scenarios Headings (desktop only)
  // The titles are position:absolute inside a tall .scenarios-inner.
  // On scroll we update their `top` so they stay visible — like CSS sticky,
  // but compatible with the absolute layout.
  const scenariosSection   = document.querySelector('.scenarios-section');
  const scenariosInner     = document.querySelector('.scenarios-inner');
  const scenariosLeftTitle = document.querySelector('.scenarios-left-title');
  const scenariosRightWrap = document.querySelector('.scenarios-right-title-wrap');
  const scenariosRightBottom = document.querySelector('.scenarios-right-bottom');

  if (scenariosSection && scenariosInner && scenariosLeftTitle && scenariosRightWrap && scenariosRightBottom) {
    const STICKY_TOP = 80; // px below viewport top (below header)
    let stickyFrame = 0;

    const updateScenariosSticky = () => {
      if (stickyFrame) return;

      stickyFrame = requestAnimationFrame(() => {
        stickyFrame = 0;

      // Only on desktop
      if (window.innerWidth < 1024) {
        scenariosLeftTitle.style.transform = '';
        scenariosRightWrap.style.transform = '';
        return;
      }

      const innerRect = scenariosInner.getBoundingClientRect();
      const innerHeight = scenariosInner.offsetHeight;
      const leftH = scenariosLeftTitle.offsetHeight;
      const rightH = scenariosRightWrap.offsetHeight;
      const rightBottomTop = scenariosRightBottom.offsetTop;
      const rightBottomGap = parseFloat(getComputedStyle(scenariosRightBottom).gap) || 0;
      // At the 1024px tablet breakpoint the inner spacing of the lower-right
      // content is intentionally reset to zero, but the sticky heading still
      // needs the Figma's 40px breathing room before that subtitle block.
      const stickyReleaseGap = window.innerWidth === 1024 ? 40 : rightBottomGap;

      // How far the actual scenarios canvas has scrolled above STICKY_TOP.
      // Using the inner canvas keeps the clamp aligned with the exact desktop
      // height at every breakpoint (the section itself may be visually clipped).
      const scrolled = STICKY_TOP - innerRect.top;
      const maxLeft = Math.max(0, innerHeight - leftH);
      // The lower right block is in the same visual column. Release the
      // sticky heading before that block reaches it, otherwise the CTA can
      // cover the heading at the end of the section.
      const maxRight = Math.max(
        0,
        Math.min(innerHeight - rightH, rightBottomTop - rightH - stickyReleaseGap)
      );

      if (scrolled <= 0) {
        // Section not yet reached the sticky threshold — reset.
        scenariosLeftTitle.style.transform = 'translate3d(0, 0, 0)';
        scenariosRightWrap.style.transform = 'translate3d(0, 0, 0)';
      } else {
        // Transforming avoids layout recalculation on every scroll frame and
        // removes the visible jump produced by repeatedly changing `top`.
        scenariosLeftTitle.style.transform = `translate3d(0, ${Math.min(scrolled, maxLeft)}px, 0)`;
        scenariosRightWrap.style.transform = `translate3d(0, ${Math.min(scrolled, maxRight)}px, 0)`;
      }
      });
    };

    window.addEventListener('scroll',  updateScenariosSticky, { passive: true });
    window.addEventListener('resize',  updateScenariosSticky, { passive: true });
    updateScenariosSticky();
  }
});
