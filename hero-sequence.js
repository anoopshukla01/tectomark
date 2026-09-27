/**
 * TECTO MARK — Hero Character Frame-Sequence Controller
 * Production-ready scroll-driven canvas scrubber using GSAP + ScrollTrigger
 * with eager/lazy multi-scene frame preloader, fallback frame interpolation,
 * and high-DPI responsive canvas rendering.
 */

(function () {
  'use strict';

  // ── Configuration ──────────────────────────────────────────────────────────
  const TOTAL_SCENES = 5;
  const FRAMES_PER_SCENE = 240;

  // Frame folder directory mapping
  const SCENE_DIRS = {
    1: 'frames/scene-1-intro',
    2: 'frames/scene-2-content',
    3: 'frames/scene-3-build',
    4: 'frames/scene-4-growth',
    5: 'frames/scene-5-contact'
  };

  // Fallback raw folders in case symlinks aren't used
  const SCENE_RAW_DIRS = {
    1: 'frames_full_quality',
    2: 'frames_full_quality_2',
    3: 'frames_full_quality_3',
    4: 'frames_full_quality_4',
    5: 'frames_full_quality_5'
  };

  function getFrameUrl(sceneNum, frameIndex) {
    const padded = String(frameIndex + 1).padStart(4, '0');
    return `${SCENE_DIRS[sceneNum]}/frame_${padded}.jpg`;
  }

  // ── State Storage ──────────────────────────────────────────────────────────
  const frameCaches = {
    1: new Map(),
    2: new Map(),
    3: new Map(),
    4: new Map(),
    5: new Map()
  };

  const preloadStatus = {
    1: 'idle',
    2: 'idle',
    3: 'idle',
    4: 'idle',
    5: 'idle'
  };

  const currentFrameIndex = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const lastDrawnFrame = { 1: -1, 2: -1, 3: -1, 4: -1, 5: -1 };
  const scheduledDraws = { 1: null, 2: null, 3: null, 4: null, 5: null };

  let activeSceneNum = 1;

  // ── Frame Preloader Engine ────────────────────────────────────────────────
  function preloadScene(sceneNum, onProgress, onComplete) {
    if (sceneNum < 1 || sceneNum > TOTAL_SCENES) return;
    if (preloadStatus[sceneNum] === 'loading' || preloadStatus[sceneNum] === 'complete') {
      return;
    }

    preloadStatus[sceneNum] = 'loading';
    const cache = frameCaches[sceneNum];
    let loadedCount = 0;
    const total = FRAMES_PER_SCENE;

    // Load initial 12 key frames with highest priority, then load all remaining
    const loadOrder = [];
    // Prioritize frame 0 (poster)
    loadOrder.push(0);
    // Prioritize every 10th frame for immediate scrub responsiveness
    for (let i = 10; i < total; i += 10) {
      loadOrder.push(i);
    }
    // Fill the rest
    for (let i = 0; i < total; i++) {
      if (!loadOrder.includes(i)) {
        loadOrder.push(i);
      }
    }

    let currentIndex = 0;
    const CONCURRENCY = 16; // Fetch 16 images concurrently for optimal throughput

    function loadNext() {
      if (currentIndex >= loadOrder.length) return;
      const frameIdx = loadOrder[currentIndex++];
      const img = new Image();

      img.onload = () => {
        cache.set(frameIdx, img);
        loadedCount++;

        // If this is the initial frame for the scene, draw immediately!
        if (frameIdx === 0 && lastDrawnFrame[sceneNum] === -1) {
          drawFrame(sceneNum, 0, true);
        }

        // Progress callback
        if (typeof onProgress === 'function') {
          onProgress(loadedCount, total, sceneNum);
        }

        if (loadedCount >= total) {
          preloadStatus[sceneNum] = 'complete';
          if (typeof onComplete === 'function') onComplete(sceneNum);
        } else {
          loadNext();
        }
      };

      img.onerror = () => {
        // Try fallback to raw folder if symlink failed
        const padded = String(frameIdx + 1).padStart(4, '0');
        const fallbackUrl = `${SCENE_RAW_DIRS[sceneNum]}/frame_${padded}.jpg`;
        const retryImg = new Image();
        retryImg.onload = () => {
          cache.set(frameIdx, retryImg);
          loadedCount++;
          if (frameIdx === 0 && lastDrawnFrame[sceneNum] === -1) {
            drawFrame(sceneNum, 0, true);
          }
          if (loadedCount >= total) {
            preloadStatus[sceneNum] = 'complete';
            if (typeof onComplete === 'function') onComplete(sceneNum);
          } else {
            loadNext();
          }
        };
        retryImg.onerror = () => {
          loadedCount++;
          loadNext();
        };
        retryImg.src = fallbackUrl;
      };

      img.src = getFrameUrl(sceneNum, frameIdx);
    }

    // Launch initial concurrent workers
    for (let c = 0; c < CONCURRENCY; c++) {
      loadNext();
    }
  }

  // ── Frame Retrieval with Nearest Neighbor Fallback ────────────────────────
  function getFrameImage(sceneNum, frameIndex) {
    const cache = frameCaches[sceneNum];
    if (cache.has(frameIndex)) {
      const img = cache.get(frameIndex);
      if (img && img.complete && img.naturalWidth > 0) return img;
    }

    // Find nearest loaded frame within range
    for (let offset = 1; offset < FRAMES_PER_SCENE; offset++) {
      const prev = frameIndex - offset;
      if (prev >= 0 && cache.has(prev)) {
        const img = cache.get(prev);
        if (img && img.complete && img.naturalWidth > 0) return img;
      }
      const next = frameIndex + offset;
      if (next < FRAMES_PER_SCENE && cache.has(next)) {
        const img = cache.get(next);
        if (img && img.complete && img.naturalWidth > 0) return img;
      }
    }
    return null;
  }

  // ── Canvas Sizing & Drawing ───────────────────────────────────────────────
  function resizeSceneCanvas(sceneNum) {
    const canvas = document.getElementById(`canvas-scene-${sceneNum}`);
    if (!canvas) return;
    const parent = canvas.parentElement;
    const rect = parent ? parent.getBoundingClientRect() : canvas.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;
    // Cap DPR to 1.0 (max 1.2) for buttery smooth 60-120fps scrolling with zero GPU lag
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : 1.2);

    const targetW = Math.round((rect.width || window.innerWidth) * dpr);
    const targetH = Math.round((rect.height || window.innerHeight) * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      // Re-render frame immediately after resize
      drawFrame(sceneNum, currentFrameIndex[sceneNum] || 0, true);
    }
  }

  function drawCover(ctx, img, canvasW, canvasH) {
    const imgW = img.naturalWidth || 1920;
    const imgH = img.naturalHeight || 1080;
    const imgRatio = imgW / imgH;
    const canvasRatio = canvasW / canvasH;
    let renderW, renderH, offsetX, offsetY;

    const isMobile = window.innerWidth <= 768;

    if (canvasRatio > imgRatio) {
      // Screen is wider than 16:9
      renderW = canvasW;
      renderH = canvasW / imgRatio;
      offsetX = 0;
      offsetY = (canvasH - renderH) / 2;
    } else {
      // Screen is taller than 16:9 (standard laptops & mobile screens)
      renderH = canvasH;
      renderW = canvasH * imgRatio;
      const alignX = isMobile ? 0.5 : 0.62;
      offsetX = (canvasW - renderW) * alignX;
      offsetY = (canvasH - renderH) / 2;
    }

    // Direct hardware blit without clearRect overhead
    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
  }

  function drawFrame(sceneNum, frameIndex, force = false) {
    if (!force && lastDrawnFrame[sceneNum] === frameIndex) return;

    const canvas = document.getElementById(`canvas-scene-${sceneNum}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const img = getFrameImage(sceneNum, frameIndex);
    if (img) {
      drawCover(ctx, img, canvas.width, canvas.height);
      lastDrawnFrame[sceneNum] = frameIndex;
    }
  }

  function requestFrameDraw(sceneNum, frameIndex) {
    if (lastDrawnFrame[sceneNum] === frameIndex) return;
    currentFrameIndex[sceneNum] = frameIndex;
    if (!scheduledDraws[sceneNum]) {
      scheduledDraws[sceneNum] = requestAnimationFrame(() => {
        drawFrame(sceneNum, currentFrameIndex[sceneNum]);
        scheduledDraws[sceneNum] = null;
      });
    }
  }

  // ── HUD Timeline Controller ────────────────────────────────────────────────
  let cachedHudItems = null;
  function updateHUD(sceneNum, progress) {
    activeSceneNum = sceneNum;
    if (!cachedHudItems) {
      cachedHudItems = Array.from(document.querySelectorAll('.scene-hud-item')).map(item => ({
        item,
        itemScene: parseInt(item.getAttribute('data-goto'), 10),
        fill: item.querySelector('.scene-hud-fill')
      }));
    }
    const pct = Math.round(progress * 100);
    for (let i = 0; i < cachedHudItems.length; i++) {
      const entry = cachedHudItems[i];
      if (entry.itemScene === sceneNum) {
        if (!entry.item.classList.contains('active')) entry.item.classList.add('active');
        if (entry.fill) entry.fill.style.width = `${pct}%`;
      } else {
        if (entry.item.classList.contains('active')) entry.item.classList.remove('active');
        if (entry.fill) entry.fill.style.width = entry.itemScene < sceneNum ? '100%' : '0%';
      }
    }
  }

  function initHUD() {
    const hud = document.getElementById('sceneHud');
    if (!hud) return;

    hud.querySelectorAll('.scene-hud-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetScene = item.getAttribute('data-goto');
        const targetEl = document.getElementById(`hero-scene-${targetScene}`);
        if (targetEl) {
          const top = targetEl.offsetTop;
          window.scrollTo({ top, behavior: 'smooth' });
          const sceneInt = parseInt(targetScene, 10);
          updateHUD(sceneInt, 0);
          updateSceneTextOverlay(sceneInt, 0);
        }
      });
    });
  }

  // ── Scroll-Synced Text Overlay & Depth Experience ──────────────────────────
  function updateSceneTextOverlay(sceneNum, progress) {
    const sceneEl = document.getElementById(`hero-scene-${sceneNum}`);
    if (!sceneEl) return;

    const contentEl = sceneEl.querySelector('.scene-content');
    const eyebrowEl = sceneEl.querySelector('.scene-eyebrow');
    const lineTexts = sceneEl.querySelectorAll('.scene-line-text');
    const subEl = sceneEl.querySelector('.scene-sub');
    const actionsEl = sceneEl.querySelector('.scene-actions');
    const metaEl = sceneEl.querySelector('.scene-meta');

    if (!contentEl) return;

    // Content is active and visible
    contentEl.style.visibility = 'visible';
    contentEl.style.pointerEvents = 'auto';
    if (metaEl) {
      metaEl.style.visibility = 'visible';
      metaEl.style.opacity = '1';
    }

    // Subtle gentle exit fade only when next scene slides over at the very end (> 0.94)
    if (progress > 0.94) {
      const exitFade = Math.max(0, 1 - (progress - 0.94) / 0.05);
      contentEl.style.opacity = exitFade.toFixed(3);
    } else if (contentEl.style.opacity !== '1') {
      contentEl.style.opacity = '1';
    }
  }

  // ── Setup GSAP ScrollTrigger ──────────────────────────────────────────────
  function initScrollTriggers() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('[HeroSequence] GSAP or ScrollTrigger not found, initializing fallback scroll listener');
      initNativeScrollFallback();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    for (let s = 1; s <= TOTAL_SCENES; s++) {
      const sceneEl = document.getElementById(`hero-scene-${s}`);
      if (!sceneEl) continue;

      ScrollTrigger.create({
        trigger: sceneEl,
        start: 'top top',
        end: 'bottom top',
        scrub: true, // Direct 1:1 instant scrub with zero lag
        onUpdate: (self) => {
          const progress = self.progress; // 0.0 -> 1.0
          const frameIndex = Math.min(FRAMES_PER_SCENE - 1, Math.floor(progress * FRAMES_PER_SCENE));

          requestFrameDraw(s, frameIndex);
          updateSceneTextOverlay(s, progress);

          // Preload next scene at 35% progress
          if (progress >= 0.35 && s < TOTAL_SCENES) {
            preloadScene(s + 1);
          }

          updateHUD(s, progress);
        },
        onEnter: () => {
          updateHUD(s, 0);
          preloadScene(s);
          if (s < TOTAL_SCENES) preloadScene(s + 1);
          updateSceneTextOverlay(s, 0);
        },
        onLeave: () => {
          updateSceneTextOverlay(s, 1);
        },
        onEnterBack: () => {
          updateHUD(s, 1);
          preloadScene(s);
          updateSceneTextOverlay(s, 1);
        },
        onLeaveBack: () => {
          updateSceneTextOverlay(s, 0);
        }
      });
    }

    // Toggle HUD visibility when user scrolls into footer
    const footerEl = document.querySelector('footer');
    if (footerEl) {
      ScrollTrigger.create({
        trigger: footerEl,
        start: 'top 85%',
        onEnter: () => {
          const hud = document.getElementById('sceneHud');
          if (hud) hud.classList.add('hud-hidden');
        },
        onLeaveBack: () => {
          const hud = document.getElementById('sceneHud');
          if (hud) hud.classList.remove('hud-hidden');
        }
      });
    }
  }

  // ── Native Fallback if GSAP is blocked ────────────────────────────────────
  function initNativeScrollFallback() {
    function onScroll() {
      const vh = window.innerHeight;
      const hud = document.getElementById('sceneHud');
      const sequenceWrap = document.getElementById('hero-sequence');

      if (sequenceWrap && hud) {
        const seqRect = sequenceWrap.getBoundingClientRect();
        if (seqRect.bottom < 100) {
          hud.classList.add('hud-hidden');
        } else {
          hud.classList.remove('hud-hidden');
        }
      }

      for (let s = 1; s <= TOTAL_SCENES; s++) {
        const sceneEl = document.getElementById(`hero-scene-${s}`);
        if (!sceneEl) continue;
        const rect = sceneEl.getBoundingClientRect();
        const scrollDist = sceneEl.offsetHeight - vh;
        if (scrollDist <= 0) continue;

        const currentScroll = -rect.top;
        if (currentScroll >= 0 && currentScroll <= scrollDist) {
          const progress = Math.min(1, Math.max(0, currentScroll / scrollDist));
          const frameIndex = Math.min(FRAMES_PER_SCENE - 1, Math.floor(progress * FRAMES_PER_SCENE));
          requestFrameDraw(s, frameIndex);
          updateSceneTextOverlay(s, progress);

          if (progress >= 0.45 && s < TOTAL_SCENES) {
            preloadScene(s + 1);
          }
          updateHUD(s, progress);
          break;
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Eager Initialization ──────────────────────────────────────────────────
  function init() {
    // Size all 5 scene canvases and initialize text overlay states
    for (let s = 1; s <= TOTAL_SCENES; s++) {
      resizeSceneCanvas(s);
      updateSceneTextOverlay(s, 0);
    }

    window.addEventListener('resize', () => {
      for (let s = 1; s <= TOTAL_SCENES; s++) {
        resizeSceneCanvas(s);
      }
    }, { passive: true });

    initHUD();

    // Eagerly preload Scene 1 frames
    const preloadBadge = document.getElementById('scenePreloadHud');
    const badgeText = document.getElementById('scenePreloadText');

    preloadScene(
      1,
      // On progress
      (loaded, total) => {
        const pct = Math.round((loaded / total) * 100);
        if (badgeText) badgeText.textContent = `BUFFERING SCENE 01 • ${pct}%`;

        // Also integrate with page preloader if present
        const pCount = document.getElementById('preloaderCount');
        const pBar = document.getElementById('preloaderProgress');
        if (pCount && parseInt(pCount.textContent, 10) < pct) {
          pCount.textContent = pct;
        }
        if (pBar) {
          pBar.style.width = `${pct}%`;
        }
      },
      // On complete
      () => {
        if (preloadBadge) {
          preloadBadge.classList.add('loaded');
          setTimeout(() => preloadBadge.remove(), 600);
        }
        // Start preloading Scene 2 idle in background
        setTimeout(() => preloadScene(2), 500);
      }
    );

    // Initialize ScrollTriggers
    initScrollTriggers();


  }


  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
