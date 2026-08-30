/**
 * Generic Slider / Carousel Controller
 */
export function initCarousels() {
  initGenericCarousel('feedbacks-carousel', 'feedbacks-track', 'feedbacks-prev', 'feedbacks-next');
  initGenericCarousel('guides-carousel', 'guides-track', 'guides-prev', 'guides-next');
  initSystemSlider();
  initEcosystemTabs();
}

function initGenericCarousel(containerId, trackId, prevBtnId, nextBtnId) {
  const container = document.getElementById(containerId);
  const track = document.getElementById(trackId);
  const prevBtn = document.getElementById(prevBtnId);
  const nextBtn = document.getElementById(nextBtnId);

  if (!container || !track || !prevBtn || !nextBtn) return;

  const cards = track.children;
  if (!cards.length) return;

  const centerLastPage = container.dataset.centerLastPage === 'true';
  let currentIndex = 0;

  function update() {
    // Measure the regular (Figma) state first: three cards plus a fourth peek.
    container.classList.remove('carousel-at-end');
    const regularGap = parseFloat(getComputedStyle(track).gap) || 24;
    const regularStride = cards[0].offsetWidth + regularGap;
    const regularWidth = container.clientWidth;
    const regularMaxOffset = Math.max(0, track.scrollWidth - regularWidth);
    const visibleCards = Math.max(1, Math.floor((regularWidth + regularGap) / regularStride));
    const lastPageIndex = Math.max(0, cards.length - visibleCards);
    // Guides intentionally reveal the next card in the idle state, but every
    // navigated state must remain aligned to the left edge of the container.
    const isEdgeAlignedCarousel = containerId === 'guides-carousel' || containerId === 'feedbacks-carousel';
    const isTabletCarousel = (containerId === 'feedbacks-carousel' || containerId === 'guides-carousel')
      && window.matchMedia('(min-width: 768px) and (max-width: 1024px)').matches;
    const isTabletGuidesCarousel = containerId === 'guides-carousel' && isTabletCarousel;
    const isMobileGuidesCarousel = containerId === 'guides-carousel'
      && window.matchMedia('(max-width: 640px)').matches;
    const useEdgeAlignedPaging = isEdgeAlignedCarousel
      && (window.matchMedia('(min-width: 1025px)').matches || isTabletCarousel || isMobileGuidesCarousel);
    const maxIndex = useEdgeAlignedPaging
      ? isMobileGuidesCarousel
        ? Math.max(0, cards.length - 1)
        : Math.max(0, cards.length - 3)
      : (centerLastPage ? lastPageIndex : Math.ceil(regularMaxOffset / regularStride));

    currentIndex = Math.max(0, Math.min(currentIndex, maxIndex));
    const isLastPage = useEdgeAlignedPaging
      ? currentIndex === maxIndex
      : centerLastPage && currentIndex === lastPageIndex;
    container.classList.toggle('carousel-at-end', isLastPage);
    container.classList.toggle('carousel-has-offset', useEdgeAlignedPaging && currentIndex > 0);

    // The final page has its own geometry: exactly three full cards in the
    // primary 1120px container, with no exposed card on either side.
    // `gap` and the viewport width animate on the final step. Reading their
    // interpolated values here made the target transform drift by a few pixels
    // and cropped the first card. Use the final desktop geometry instead.
    const isDesktopFinalPage = !useEdgeAlignedPaging && isLastPage && window.matchMedia('(min-width: 1025px)').matches;
    const activeGap = isDesktopFinalPage ? 20 : regularGap;
    const desktopContainerWidth = parseFloat(getComputedStyle(document.documentElement)
      .getPropertyValue('--container-max-width')) || 1120;
    const activeWidth = isDesktopFinalPage
      ? Math.min(desktopContainerWidth, window.innerWidth - 40)
      : regularWidth;
    const activeStride = cards[0].offsetWidth + activeGap;
    const activeVisibleCards = Math.max(1, Math.floor((activeWidth + activeGap) / activeStride));
    const finalPageIndex = Math.max(0, cards.length - activeVisibleCards);
    const endInset = Math.max(0, (activeWidth - (activeVisibleCards * cards[0].offsetWidth + (activeVisibleCards - 1) * activeGap)) / 2);
    const offset = useEdgeAlignedPaging
      ? isTabletGuidesCarousel && isLastPage
        ? -regularMaxOffset
        : -(currentIndex * regularStride)
      : isLastPage
      ? -(finalPageIndex * activeStride - endInset)
      : -Math.min(currentIndex * regularStride, regularMaxOffset);
    track.style.transform = `translateX(${offset}px)`;

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= maxIndex;
    
    // Visual states are owned by CSS: arrows stay transparent by default and
    // receive a circular background only on hover/focus, as in the component.
    prevBtn.style.removeProperty('background');
    nextBtn.style.removeProperty('background');
    prevBtn.style.removeProperty('opacity');
    nextBtn.style.removeProperty('opacity');
  }

  prevBtn.addEventListener('click', () => {
    currentIndex--;
    update();
  });

  nextBtn.addEventListener('click', () => {
    currentIndex++;
    update();
  });

  // Touch / Drag Support
  let startX = 0;
  let isDragging = false;

  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (diff > 50) {
      currentIndex++;
      update();
    } else if (diff < -50) {
      currentIndex--;
      update();
    }
  });

  window.addEventListener('resize', update, { passive: true });
  update();
}

function initSystemSlider() {
  const track = document.getElementById('system-slider-scroll-track');
  const bar1 = document.getElementById('system-bar-fill-1');
  const bar2 = document.getElementById('system-bar-fill-2');
  const numEl = document.getElementById('system-slide-num');
  
  const imgLayer1 = document.getElementById('system-img-layer-1');
  const imgLayer2 = document.getElementById('system-img-layer-2');
  const img1 = imgLayer1 ? imgLayer1.querySelector('img') : null;
  const img2 = imgLayer2 ? imgLayer2.querySelector('img') : null;
  const textLayer1 = document.getElementById('system-text-layer-1');
  const textLayer2 = document.getElementById('system-text-layer-2');
  const box = document.getElementById('system-slider-box');

  if (!track || !box) return;

  const barItems = box.querySelectorAll('.system-bar-item');
  let activeIndex = 0;
  let rafId = null;

  function updateSlideState(index) {
    if (activeIndex === index) return;
    activeIndex = index;
    barItems.forEach((item, itemIndex) => item.setAttribute('aria-current', String(itemIndex === index)));

    if (numEl) {
      numEl.style.opacity = '0';
      numEl.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        numEl.textContent = (index + 1).toString();
        numEl.style.opacity = '1';
        numEl.style.transform = 'translateY(0)';
      }, 100);
    }

    if (index === 0) {
      textLayer1?.classList.add('active');
      textLayer2?.classList.remove('active');
    } else {
      textLayer1?.classList.remove('active');
      textLayer2?.classList.add('active');
    }
  }

  function handleScroll() {
    const rect = track.getBoundingClientRect();
    const scrollDist = track.offsetHeight - window.innerHeight;
    if (scrollDist <= 0) return;

    const scrolled = -rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / scrollDist));

    if (progress <= 0.5) {
      const p1 = progress / 0.5; // 0 to 1
      if (bar1) bar1.style.width = (p1 * 100) + '%';
      if (bar2) bar2.style.width = '0%';
      
      // Curtain fully closed
      if (imgLayer2) imgLayer2.style.clipPath = 'inset(100% 0 0 0)';
      if (img1) img1.style.transform = `scale(${1.0 + p1 * 0.04})`;
      if (img2) img2.style.transform = 'scale(1.04)';

      updateSlideState(0);
    } else {
      const p2 = (progress - 0.5) / 0.5; // 0 to 1
      if (bar1) bar1.style.width = '100%';
      if (bar2) bar2.style.width = (p2 * 100) + '%';

      // Curtain revealing smoothly from bottom to top
      const insetBottom = (1.0 - p2) * 100;
      if (imgLayer2) imgLayer2.style.clipPath = `inset(${insetBottom}% 0 0 0)`;
      if (img1) img1.style.transform = 'scale(1.04)';
      if (img2) img2.style.transform = `scale(${1.04 - p2 * 0.04})`;

      updateSlideState(1);
    }
  }

  function onScroll() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(handleScroll);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  handleScroll();

  barItems.forEach((item, idx) => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const trackTop = track.getBoundingClientRect().top + window.scrollY;
      const scrollDist = track.offsetHeight - window.innerHeight;
      if (scrollDist > 0) {
        const targetScroll = idx === 0 ? trackTop : trackTop + scrollDist;
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      } else {
        updateSlideState(idx);
        if (idx === 0) {
          if (bar1) bar1.style.width = '100%';
          if (bar2) bar2.style.width = '0%';
          if (imgLayer2) imgLayer2.style.clipPath = 'inset(100% 0 0 0)';
        } else {
          if (bar1) bar1.style.width = '100%';
          if (bar2) bar2.style.width = '100%';
          if (imgLayer2) imgLayer2.style.clipPath = 'inset(0% 0 0 0)';
        }
      }
    });
  });


}


function initEcosystemTabs() {
  const box = document.getElementById('ecosystem-box');
  const tabs = document.querySelectorAll('.ecosystem-tab-item');
  const descEl = document.getElementById('ecosystem-desc');
  const progressEl = document.getElementById('ecosystem-progress');
  const visualLayers = document.querySelectorAll('.ecosystem-visual-layer');

  if (!tabs.length) return;

  const descriptions = {
    chat: "Обмен опытом и обратная связь каждый день",
    streams: "Прямые эфиры каждую неделю: разборы ваших подходов, переписок, диалогов и ответы на вопросы.",
    platform: "Единая образовательная платформа с доступом ко всей базе знаний, урокам и материалам 24/7.",
    ai: "Персональный ассистент для генерации контекстных тем для диалога и проверки анкеты."
  };

  const wideDescriptions = {
    streams: "Прямые эфиры каждую неделю: разборы ваших подходов,\nпереписок, диалогов и ответы на вопросы.",
    platform: "Единая образовательная платформа с доступом ко всей базе\nзнаний, урокам и материалам 24/7.",
    ai: "Персональный ассистент для генерации контекстных тем для\nдиалога и проверки анкеты."
  };

  const getDescription = (key) => (
    window.matchMedia('(min-width: 1500px)').matches && wideDescriptions[key]
      ? wideDescriptions[key]
      : descriptions[key]
  );

  let currentTab = 0;
  const duration = 5500; // 5.5 seconds per tab
  let startTime = null;
  let paused = false;

  function setTab(index) {
    currentTab = index;
    const tab = tabs[index];
    const key = tab.getAttribute('data-tab');

    // Active tab text highlight
    tabs.forEach((tabItem, tabIndex) => {
      tabItem.classList.toggle('active', tabIndex === index);
      tabItem.setAttribute('aria-pressed', String(tabIndex === index));
    });

    // Description text fade transition
    const description = getDescription(key);
    if (descEl && description) {
      descEl.style.opacity = '0';
      setTimeout(() => {
        descEl.textContent = description;
        descEl.style.opacity = '1';
      }, 150);
    }

    // Visual layer cross-fade & scale
    visualLayers.forEach(layer => {
      if (layer.getAttribute('data-visual') === key) {
        layer.classList.add('active');
      } else {
        layer.classList.remove('active');
      }
    });

    // Reset progress bar to 0 immediately on tab change
    if (progressEl) progressEl.style.width = '0%';
    startTime = performance.now();
  }

  function loop(now) {
    if (!startTime) startTime = now;

    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);

    if (progressEl) {
      progressEl.style.width = `${progress * 100}%`;
    }

    if (progress >= 1) {
      const next = (currentTab + 1) % tabs.length;
      setTab(next);
    }

    requestAnimationFrame(loop);
  }

  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'button');
    tab.setAttribute('tabindex', '0');
    tab.setAttribute('aria-pressed', String(index === currentTab));
    tab.addEventListener('click', () => {
      setTab(index);
    });
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setTab(index);
      }
    });
  });

  setTab(0);
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    requestAnimationFrame(loop);
  }
}
