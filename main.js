/* ===== TECTO MARK — MAIN SCRIPT ===== */
'use strict';

// ── Utility ────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const isMobile = () => window.innerWidth <= 768;

// ── Preloader ──────────────────────────────────────────────────
(function initPreloader() {
  const preloader = $('#preloader');
  const progress = $('#preloaderProgress');
  const count = $('#preloaderCount');
  if (!preloader) {
    document.body.classList.add('loaded');
    return;
  }

  // Safety timer: Never leave screen dark or blocked for more than 900ms
  const safetyTimer = setTimeout(() => {
    preloader.classList.add('hidden');
    document.body.classList.add('loaded');
  }, 900);

  // If user arrives with #contact, immediately dismiss preloader
  if (window.location.hash.includes('contact')) {
    clearTimeout(safetyTimer);
    preloader.classList.add('hidden');
    document.body.classList.add('loaded');
    return;
  }

  let current = 0;
  const target = 100;
  const duration = 1200;
  const startTime = performance.now();

  function updateProgress(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - t, 3);
    current = Math.round(eased * target);
    if (progress) progress.style.width = current + '%';
    if (count) count.textContent = current;

    if (t < 1) {
      requestAnimationFrame(updateProgress);
    } else {
      clearTimeout(safetyTimer);
      // Minimum visible time then hide
      setTimeout(() => {
        preloader.classList.add('hidden');
        document.body.classList.add('loaded');
        // Show FAB after preloader
        setTimeout(() => {
          const fab = $('#fabGroup');
          if (fab) fab.classList.add('visible');
        }, 300);
      }, 100);
    }
  }

  requestAnimationFrame(updateProgress);
})();

// ── Scroll Progress Bar ────────────────────────────────────────
(function initScrollProgress() {
  const bar = $('#scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${total > 0 ? scrolled / total : 0})`;
  }, { passive: true });
})();

// ── FAB Show/Hide on scroll ────────────────────────────────────
(function initFABScroll() {
  const fab = $('#fabGroup');
  if (!fab) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      fab.classList.add('visible');
    } else {
      fab.classList.remove('visible');
    }
  }, { passive: true });
})();

// ── Custom Cursor with Contextual States ─────────────────────
(function initCursor() {
  if (window.matchMedia('(hover: none)').matches || isMobile()) return;
  const cursor = $('#cursor');
  const follower = $('#cursorFollower');
  const cursorText = $('#cursorText');
  if (!cursor || !follower) return;

  let mouseX = -100, mouseY = -100;
  let followerX = -100, followerY = -100;
  let isVisible = false;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!isVisible) {
      isVisible = true;
      followerX = mouseX;
      followerY = mouseY;
    }
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
  });

  function animateFollower() {
    followerX += (mouseX - followerX) * 0.15;
    followerY += (mouseY - followerY) * 0.15;
    follower.style.left = followerX + 'px';
    follower.style.top = followerY + 'px';
    requestAnimationFrame(animateFollower);
  }
  animateFollower();

  function updateCursorState(e) {
    const target = e.target;
    if (!target) return;

    // Inside modals or when any modal is open, completely suppress custom cursor so native OS cursor works flawlessly
    if (document.body.classList.contains('modal-open') || target.closest('.popup-modal, .project-modal, [role="dialog"]')) {
      cursor.className = 'cursor cursor--hidden';
      follower.className = 'cursor-follower cursor--hidden';
      if (cursorText) cursorText.textContent = '';
      return;
    }

    // Check for explicit data-cursor on element or ancestor
    const cursorElem = target.closest('[data-cursor]');
    const isInput = target.closest('input, textarea, select, label');

    if (isInput || (cursorElem && cursorElem.dataset.cursor === 'none')) {
      cursor.className = 'cursor cursor--hidden';
      follower.className = 'cursor-follower cursor--hidden';
      if (cursorText) cursorText.textContent = '';
      return;
    }

    if (cursorElem) {
      const mode = cursorElem.dataset.cursor;
      if (mode === 'view') {
        follower.className = 'cursor-follower hover cursor--view';
        cursor.className = 'cursor hover cursor--view-active';
        if (cursorText) cursorText.textContent = 'VIEW';
        return;
      }
      if (mode === 'drag') {
        follower.className = 'cursor-follower hover cursor--drag';
        cursor.className = 'cursor hover cursor--drag-active';
        if (cursorText) cursorText.textContent = '⟵ DRAG ⟶';
        return;
      }
      if (mode === 'expand') {
        follower.className = 'cursor-follower hover cursor--expand';
        cursor.className = 'cursor hover';
        if (cursorText) cursorText.textContent = '+';
        return;
      }
    }

    // Default interactive links and buttons
    const interactive = target.closest('a, button, .insight-item, .industry-tag, .fab, .tdot');
    if (interactive) {
      cursor.className = 'cursor hover';
      follower.className = 'cursor-follower hover';
      if (cursorText) cursorText.textContent = '';
    } else {
      cursor.className = 'cursor';
      follower.className = 'cursor-follower';
      if (cursorText) cursorText.textContent = '';
    }
  }

  document.addEventListener('mouseover', updateCursorState);
  document.addEventListener('mouseleave', () => {
    cursor.className = 'cursor cursor--hidden';
    follower.className = 'cursor-follower cursor--hidden';
  });
  document.addEventListener('mouseenter', () => {
    cursor.className = 'cursor';
    follower.className = 'cursor-follower';
  });
})();

// ── Navigation ─────────────────────────────────────────────────
(function initNav() {
  const nav = $('#nav');
  if (!nav) return;

  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    // Compact shrink: nav height reduces after 80px
    if (scrollY > 80) {
      nav.classList.add('nav-compact');
    } else {
      nav.classList.remove('nav-compact');
    }
    lastScroll = scrollY;
  }, { passive: true });

  // Active nav link based on section
  const sections = $$('.hero-scene[id], footer[id]');
  const navLinks = $$('.nav-link');

  function updateActiveLink() {
    const scrollY = window.scrollY + 120;
    let currentId = '';
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        currentId = section.id;
      }
    });
    navLinks.forEach(link => {
      const href = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', href === currentId);
    });
  }
  window.addEventListener('scroll', updateActiveLink, { passive: true });

  // Smooth scroll for all anchor links (handling both #section and #section?param=value)
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const rawHref = link.getAttribute('href');
    if (!rawHref || rawHref === '#') return;
    const targetId = rawHref.split('?')[0].replace(/^#/, '');
    if (!targetId) return;

    // Direct Start-A-Project & modal action mappings
    if (targetId === 'contact' || link.classList.contains('nav-cta') || link.classList.contains('mobile-menu-cta') || link.classList.contains('fab-cta') || link.id === 'ctaMagnetic' || link.id === 'btnBuildWebsite' || link.id === 'btnScaleBrand') {
      e.preventDefault();
      let serviceKeyword = link.getAttribute('data-preset-project-type') || link.getAttribute('data-service') || '';
      if (!serviceKeyword && rawHref.includes('service=')) {
        serviceKeyword = rawHref.split('service=')[1].split('&')[0];
      }
      if (typeof window.openProjectModal === 'function') {
        window.openProjectModal({ presetProjectType: serviceKeyword });
      }
      return;
    }

    if (targetId === 'work') {
      e.preventDefault();
      const inScene2 = link.closest('#hero-scene-2') || link.textContent.toLowerCase().includes('video');
      if (typeof window.openModal === 'function') {
        window.openModal(inScene2 ? 'videoWorkModal' : 'workModal');
      }
      return;
    }

    if (targetId === 'services') {
      e.preventDefault();
      const inScene3 = link.closest('#hero-scene-3') || link.textContent.toLowerCase().includes('tech');
      if (typeof window.openModal === 'function') {
        window.openModal(inScene3 ? 'techStackModal' : 'contentCapabilitiesModal');
      }
      return;
    }

    if (targetId === 'approach') {
      e.preventDefault();
      if (typeof window.openModal === 'function') {
        window.openModal('growthProcessModal');
      }
      return;
    }

    if (targetId === 'whatsapp') {
      e.preventDefault();
      if (typeof window.openModal === 'function') {
        window.openModal('whatsappModal');
      }
      return;
    }

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 72;
    const isHeroScene = target.classList.contains('hero-scene') || target.id.startsWith('hero-scene');
    const top = isHeroScene ? target.offsetTop : (target.getBoundingClientRect().top + window.scrollY - navH);
    window.scrollTo({ top, behavior: 'smooth' });

    if (rawHref.includes('service=')) {
      const serviceVal = rawHref.split('service=')[1].split('&')[0];
      if (typeof window.preselectServiceByKeyword === 'function') {
        window.preselectServiceByKeyword(serviceVal);
      }
      try {
        history.pushState(null, '', rawHref);
      } catch (_) {}
    }
  });
})();

// ── Mobile Menu ────────────────────────────────────────────────
(function initMobileMenu() {
  const toggle = $('#navToggle');
  const menu = $('#mobileMenu');
  const close = $('#mobileMenuClose');
  if (!toggle || !menu || !close) return;

  const closeMenuLinks = $$('[data-close-menu]');
  let isOpen = false;

  function openMenu() {
    isOpen = true;
    menu.classList.add('open');
    document.body.style.overflow = 'hidden';
    toggle.setAttribute('aria-expanded', 'true');
    const bars = $$('span', toggle);
    if (bars[0]) bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    if (bars[1]) bars[1].style.opacity = '0';
  }

  function closeMenu() {
    isOpen = false;
    menu.classList.remove('open');
    document.body.style.overflow = '';
    toggle.setAttribute('aria-expanded', 'false');
    const bars = $$('span', toggle);
    if (bars[0]) bars[0].style.transform = '';
    if (bars[1]) bars[1].style.opacity = '';
  }

  toggle.addEventListener('click', () => { isOpen ? closeMenu() : openMenu(); });
  close.addEventListener('click', closeMenu);
  closeMenuLinks.forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) closeMenu(); });
})();

// ── Intersection Observer — Reveal Animations ──────────────────
(function initReveal() {
  const elements = $$('.reveal-up');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );

  elements.forEach(el => observer.observe(el));
})();

// ── Service Row — Accordion on tablet/mobile, hover on desktop ────
(function initServiceRows() {
  const rows = $$('.service-row');
  if (!rows.length) return;

  const ACCORDION_BREAKPOINT = 1023; // px – matches CSS tablet breakpoint

  // Close all rows
  function closeAll() {
    rows.forEach(r => {
      r.classList.remove('active');
      r.setAttribute('aria-expanded', 'false');
    });
  }

  // Toggle a single row (single-open accordion)
  function toggleRow(row) {
    const isActive = row.classList.contains('active');
    closeAll();
    if (!isActive) {
      row.classList.add('active');
      row.setAttribute('aria-expanded', 'true');
    }
  }

  // Bind accordion interactions
  function bindAccordion() {
    rows.forEach(row => {
      // Mark as accordion-enabled for ARIA
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
      if (!row.getAttribute('aria-expanded')) {
        row.setAttribute('aria-expanded', 'false');
      }

      row.addEventListener('click', (e) => {
        if (e.target.closest('a, button, .service-inquire-btn')) return;
        toggleRow(row);
      });

      // Keyboard: Enter / Space to toggle
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleRow(row);
        }
      });
    });
  }

  // Unbind accordion (desktop: remove role/tabindex overrides)
  function unbindAccordion() {
    rows.forEach(row => {
      row.removeAttribute('role');
      row.removeAttribute('tabindex');
      row.removeAttribute('aria-expanded');
      row.classList.remove('active');
    });
  }

  let accordionActive = false;

  function syncMode() {
    const isAccordionMode = window.innerWidth <= ACCORDION_BREAKPOINT;
    if (isAccordionMode && !accordionActive) {
      accordionActive = true;
      bindAccordion();
    } else if (!isAccordionMode && accordionActive) {
      accordionActive = false;
      unbindAccordion();
    }
  }

  syncMode();
  window.addEventListener('resize', syncMode, { passive: true });
})();



// ── Start A Project Modal System ───────────────────────────────
(function initStartProjectModal() {
  const modal = $('#projectModal');
  const form = $('#startProjectForm');
  const contentView = $('#spContentView');
  const successView = $('#spSuccessView');
  const successSummary = $('#spSuccessSummary');
  const submitBtn = $('#spSubmitBtn');
  const alertError = $('#spAlertError');
  const alertMsg = $('#spAlertMsg');
  const alertRetry = $('#spAlertRetry');
  const successCloseBtn = $('#spSuccessCloseBtn');

  if (!modal || !form) return;

  const nameInput = $('#sp_name');
  const emailInput = $('#sp_email');
  const phoneInput = $('#sp_phone');
  const companyInput = $('#sp_company');
  const projectTypeSelect = $('#sp_projectType');
  const budgetSelect = $('#sp_budget');
  const messageInput = $('#sp_message');
  const honeypotInput = $('#sp_hp_field');

  const DEFAULT_MESSAGE_PLACEHOLDER = "Tell us about your project or goals";
  const contextualPlaceholders = {
    'Website': 'Tell us about the website you want to build (e.g. goals, design preferences, reference sites, key features)...',
    'Instagram Growth': 'Tell us about your brand and Instagram growth objectives (e.g. current handle, target audience)...',
    'Content & Reels': 'Tell us about your content vision (e.g. monthly reels, script writing, video formats)...',
    'Meta/Google Ads': 'Tell us about your advertising goals, monthly ad spend, and current ROAS...',
    'Full Growth Package': 'Tell us about your brand and growth goals (social, paid ads, content, etc.)...',
    'Other': 'Tell us about your project or goals'
  };

  // Pre-select helper for Project Type
  function preselectProjectType(keyword) {
    if (!projectTypeSelect) return;
    if (!keyword) {
      projectTypeSelect.value = '';
      Array.from(projectTypeSelect.options).forEach((opt, idx) => {
        opt.selected = (idx === 0);
      });
      projectTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      if (messageInput) messageInput.placeholder = DEFAULT_MESSAGE_PLACEHOLDER;
      validateField(projectTypeSelect, false);
      checkOverallValidity();
      return;
    }
    const k = String(keyword).toLowerCase();
    let matchedOption = '';
    if (k.includes('web') || k.includes('site') || k.includes('dev')) {
      matchedOption = 'Website';
    } else if (k.includes('insta') || k.includes('social') || k.includes('ig')) {
      matchedOption = 'Instagram Growth';
    } else if (k.includes('reel') || k.includes('video') || k.includes('content')) {
      matchedOption = 'Content & Reels';
    } else if (k.includes('ad') || k.includes('meta') || k.includes('google') || k.includes('paid')) {
      matchedOption = 'Meta/Google Ads';
    } else if (k.includes('growth') || k.includes('scale') || k.includes('full') || k.includes('package')) {
      matchedOption = 'Full Growth Package';
    } else if (k.includes('other')) {
      matchedOption = 'Other';
    }

    if (matchedOption) {
      projectTypeSelect.value = matchedOption;
      Array.from(projectTypeSelect.options).forEach(opt => {
        opt.selected = (opt.value === matchedOption);
      });
      projectTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      if (messageInput && contextualPlaceholders[matchedOption]) {
        messageInput.placeholder = contextualPlaceholders[matchedOption];
      }
      validateField(projectTypeSelect, false);
      checkOverallValidity();
    }
  }
  window.preselectServiceByKeyword = preselectProjectType;
  window.preselectProjectType = preselectProjectType;
  window.setProjectMessagePreset = function(msg) {
    if (messageInput) {
      messageInput.value = msg || '';
      validateField(messageInput, false);
      checkOverallValidity();
    }
  };

  // Validation helpers
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
  }

  function isValidPhone(phone) {
    const digits = String(phone).replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  }

  function validateField(field, showInline = true) {
    if (!field) return true;
    let valid = true;
    const val = field.value.trim();

    if (field === nameInput) {
      valid = val.length >= 2;
    } else if (field === emailInput) {
      valid = isValidEmail(val);
    } else if (field === phoneInput) {
      valid = isValidPhone(val);
    } else if (field === projectTypeSelect) {
      valid = Boolean(val && val !== '');
    } else if (field === messageInput) {
      valid = val.length >= 5;
    }

    if (showInline) {
      if (!valid) {
        field.classList.add('is-invalid');
      } else {
        field.classList.remove('is-invalid');
      }
    }
    return valid;
  }

  function checkOverallValidity() {
    const isNameOk = validateField(nameInput, false);
    const isEmailOk = validateField(emailInput, false);
    const isPhoneOk = validateField(phoneInput, false);
    const isTypeOk = validateField(projectTypeSelect, false);
    const isMsgOk = validateField(messageInput, false);

    const isFormValid = isNameOk && isEmailOk && isPhoneOk && isTypeOk && isMsgOk;
    // Keep button active and clickable so user can submit or trigger instant inline guidance
    if (submitBtn) {
      submitBtn.disabled = false;
    }
    return isFormValid;
  }

  // Real-time & on-blur event validation
  [nameInput, emailInput, phoneInput, messageInput].forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => {
      if (input.classList.contains('is-invalid')) {
        validateField(input, true);
      }
      checkOverallValidity();
    });
    input.addEventListener('blur', () => {
      if (input.value.trim() !== '') {
        validateField(input, true);
      }
      checkOverallValidity();
    });
  });

  if (projectTypeSelect) {
    projectTypeSelect.addEventListener('change', () => {
      validateField(projectTypeSelect, true);
      checkOverallValidity();
    });
  }

  if (budgetSelect) {
    budgetSelect.addEventListener('change', checkOverallValidity);
  }

  // Retry action on error banner
  if (alertRetry) {
    alertRetry.addEventListener('click', () => {
      if (alertError) alertError.style.display = 'none';
      if (submitBtn) submitBtn.focus();
    });
  }

  // Form submission handler
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (alertError) alertError.style.display = 'none';

    // Validate all required fields
    const isNameOk = validateField(nameInput, true);
    const isEmailOk = validateField(emailInput, true);
    const isPhoneOk = validateField(phoneInput, true);
    const isTypeOk = validateField(projectTypeSelect, true);
    const isMsgOk = validateField(messageInput, true);

    if (!isNameOk || !isEmailOk || !isPhoneOk || !isTypeOk || !isMsgOk) {
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim(),
      company: companyInput ? companyInput.value.trim() : '',
      projectType: projectTypeSelect.value,
      budget: budgetSelect ? budgetSelect.value : '',
      message: messageInput.value.trim(),
      hp_field: honeypotInput ? honeypotInput.value : ''
    };

    // UI Loading state
    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;

    try {
      const response = await fetch('/api/start-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Success: Transition to Success View inside modal
        if (successSummary) {
          successSummary.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:6px;">
              <span><strong>Prospect:</strong></span>
              <span style="color:#FFFFFF;">${payload.name}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:6px;">
              <span><strong>Project Type:</strong></span>
              <span style="color:#2D5BFF; font-weight:700;">${payload.projectType}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:6px;">
              <span><strong>Email:</strong></span>
              <span style="color:#FFFFFF;">${payload.email}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:6px;">
              <span><strong>Phone:</strong></span>
              <span style="color:#FFFFFF;">${payload.phone}</span>
            </div>
            ${payload.budget ? `
            <div style="display:flex; justify-content:space-between;">
              <span><strong>Budget:</strong></span>
              <span style="color:#FFFFFF;">${payload.budget}</span>
            </div>` : ''}
          `;
        }

        contentView.style.display = 'none';
        successView.style.display = 'block';

        if (typeof window.dataLayer !== 'undefined') {
          window.dataLayer.push({
            event: 'start_project_submission',
            project_type: payload.projectType,
            budget: payload.budget
          });
        }
      } else {
        throw new Error(result.error || 'Server could not process your submission.');
      }
    } catch (err) {
      console.warn('Submission error, retaining form data:', err);
      if (alertError && alertMsg) {
        alertMsg.textContent = err.message || 'Something went wrong. Please check your details and try again.';
        alertError.style.display = 'flex';
      }
      submitBtn.disabled = false;
    } finally {
      submitBtn.classList.remove('is-loading');
    }
  });

  // Reset modal state helper
  window.resetStartProjectModal = function() {
    form.reset();
    if (projectTypeSelect) projectTypeSelect.value = '';
    if (messageInput) messageInput.placeholder = DEFAULT_MESSAGE_PLACEHOLDER;
    $$('.is-invalid', form).forEach(el => el.classList.remove('is-invalid'));
    if (alertError) alertError.style.display = 'none';
    if (contentView) contentView.style.display = 'block';
    if (successView) successView.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.remove('is-loading');
    }
  };

  if (successCloseBtn) {
    successCloseBtn.addEventListener('click', () => {
      if (typeof window.closeModal === 'function') {
        window.closeModal('projectModal');
      }
    });
  }
})();

// ── Universal Modal Controller System ───────────────────────────
(function initUniversalModals() {
  let lastFocusedTrigger = null;
  let projectResetTimer = null;

  function getFocusableElements(container) {
    return Array.from(container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement);
  }

  function handleFocusTrap(e) {
    const activeModal = document.querySelector('.popup-modal.is-open, .project-modal.is-open');
    if (!activeModal || e.key !== 'Tab') return;

    const focusables = getFocusableElements(activeModal);
    if (focusables.length === 0) return;

    const firstFocusable = focusables[0];
    const lastFocusable = focusables[focusables.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable || !activeModal.contains(document.activeElement)) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable || !activeModal.contains(document.activeElement)) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  window.addEventListener('keydown', handleFocusTrap);

  function openModal(modalId, options = {}) {
    if (!modalId) return;
    const targetModal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
    if (!targetModal) return;

    // Cancel any pending reset from a previous modal close
    if (projectResetTimer) {
      clearTimeout(projectResetTimer);
      projectResetTimer = null;
    }

    // Force preloader hidden & ensure page is 100% visible
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.classList.add('hidden');
    document.body.classList.add('loaded');

    // Save triggering element for returning focus on close
    lastFocusedTrigger = document.activeElement;

    // Close any currently open modal smoothly
    document.querySelectorAll('.popup-modal.is-open, .project-modal.is-open').forEach(m => {
      if (m !== targetModal) {
        m.classList.remove('is-open');
        m.setAttribute('aria-hidden', 'true');
      }
    });

    targetModal.classList.add('is-open');
    targetModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    // Immediately hide custom cursor so it does not linger or get caught on modal contents
    const curEl = $('#cursor');
    const folEl = $('#cursorFollower');
    if (curEl) curEl.className = 'cursor cursor--hidden';
    if (folEl) folEl.className = 'cursor-follower cursor--hidden';

    // Pre-select project type & preset message if opening projectModal (handles preset or resets to default)
    if (modalId === 'projectModal' || (targetModal && targetModal.id === 'projectModal')) {
      const preset = options.presetProjectType || options.service || '';
      if (typeof window.preselectProjectType === 'function') {
        window.preselectProjectType(preset);
      }
      if (typeof options.presetMessage === 'string' && typeof window.setProjectMessagePreset === 'function') {
        window.setProjectMessagePreset(options.presetMessage);
      }
    }

    // Reset Tech Stack modal view state to 4-tier overview on open
    if (modalId === 'techStackModal' || (targetModal && targetModal.id === 'techStackModal')) {
      if (typeof window.resetTechStackModalView === 'function') {
        window.resetTechStackModalView();
      }
    }

    // Auto-focus accessibility into the modal
    setTimeout(() => {
      const focusables = getFocusableElements(targetModal);
      if (focusables.length > 0) {
        // Prefer first text input or first actionable button
        const firstInput = targetModal.querySelector('input:not([type="hidden"]), select, textarea');
        if (firstInput) {
          firstInput.focus({ preventScroll: true });
        } else {
          focusables[0].focus({ preventScroll: true });
        }
      }
    }, 200);
  }
  window.openModal = openModal;

  function closeModal(modalId) {
    let closedAny = false;
    if (modalId) {
      const targetModal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
      if (targetModal) {
        targetModal.classList.remove('is-open');
        targetModal.setAttribute('aria-hidden', 'true');
        closedAny = true;
      }
    } else {
      document.querySelectorAll('.popup-modal.is-open, .project-modal.is-open').forEach(m => {
        m.classList.remove('is-open');
        m.setAttribute('aria-hidden', 'true');
        closedAny = true;
      });
    }

    // Reset Tech Stack view to overview on close
    const tsModal = $('#techStackModal');
    if (tsModal && !tsModal.classList.contains('is-open')) {
      if (typeof window.resetTechStackModalView === 'function') {
        window.resetTechStackModalView();
      }
    }

    // Check if any modal remains open
    const anyStillOpen = document.querySelector('.popup-modal.is-open, .project-modal.is-open');
    if (!anyStillOpen) {
      document.body.classList.remove('modal-open');
    }

    // Return focus to triggering button for accessibility
    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function') {
      try {
        lastFocusedTrigger.focus({ preventScroll: true });
      } catch (_) {}
    }

    // If projectModal was closed, reset form state after transition completes
    const projectModal = $('#projectModal');
    if (projectModal && !projectModal.classList.contains('is-open')) {
      if (projectResetTimer) clearTimeout(projectResetTimer);
      projectResetTimer = setTimeout(() => {
        if (projectModal && !projectModal.classList.contains('is-open')) {
          if (typeof window.resetStartProjectModal === 'function') {
            window.resetStartProjectModal();
          }
        }
        projectResetTimer = null;
      }, 250);
    }
  }
  window.closeModal = closeModal;

  // Open inquiry / project modal supporting string or object props: openInquiryModal({ presetProjectType: 'Website', presetMessage: '...' })
  function openProjectModal(arg = '') {
    let preset = '';
    let presetMessage = '';
    if (typeof arg === 'string') {
      preset = arg;
    } else if (arg && typeof arg === 'object') {
      preset = arg.presetProjectType || arg.service || '';
      presetMessage = arg.presetMessage || '';
    }
    openModal('projectModal', { presetProjectType: preset, service: preset, presetMessage });
  }
  window.openProjectModal = openProjectModal;
  window.openInquiryModal = openProjectModal;
  window.closeProjectModal = () => closeModal('projectModal');
  window.closeInquiryModal = () => closeModal('projectModal');

  // Close buttons and backdrops for projectModal
  const projectCloseBtn = $('#projectModalClose');
  const projectBackdrop = $('#projectModalBackdrop');
  if (projectCloseBtn) projectCloseBtn.addEventListener('click', () => closeModal('projectModal'));
  if (projectBackdrop) projectBackdrop.addEventListener('click', () => closeModal('projectModal'));

  // Dedicated CTAs for Section-specific Inquiry Presets
  const btnBuildWebsite = $('#btnBuildWebsite');
  if (btnBuildWebsite) {
    btnBuildWebsite.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openProjectModal({ presetProjectType: 'Website' });
    });
  }

    const btnScaleBrand = $('#btnScaleBrand');
  if (btnScaleBrand) {
    btnScaleBrand.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openProjectModal({ presetProjectType: 'Full Growth Package' });
    });
  }

  const btnGrowthProcess = $('#btnGrowthProcess');
  if (btnGrowthProcess) {
    btnGrowthProcess.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openModal('growthProcessModal');
    });
  }

  const btnGrowthProcessStartGrowing = $('#btnGrowthProcessStartGrowing');
  if (btnGrowthProcessStartGrowing) {
    btnGrowthProcessStartGrowing.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openProjectModal({ presetProjectType: 'Full Growth Package' });
    });
  }

  const btnContentCapabilities = $('#btnContentCapabilities');
  if (btnContentCapabilities) {
    btnContentCapabilities.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openModal('contentCapabilitiesModal');
    });
  }

  const btnCcSeeVideoWork = $('#btnCcSeeVideoWork');
  if (btnCcSeeVideoWork) {
    btnCcSeeVideoWork.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openModal('videoWorkModal');
    });
  }

  const btnCcStartProject = $('#btnCcStartProject');
  if (btnCcStartProject) {
    btnCcStartProject.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openProjectModal({ presetProjectType: 'Content & Reels' });
    });
  }

  // Global delegated listener for modal triggers and closers (Capture Phase)
  document.addEventListener('click', e => {
    // 1. Close triggers
    const closeTrigger = e.target.closest('[data-close-modal], .popup-modal-close, .project-modal-close, .popup-modal-backdrop, .project-modal-backdrop');
    if (closeTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const parentModal = closeTrigger.closest('.popup-modal, .project-modal');
      closeModal(parentModal);
      return;
    }

    // 2. Open triggers with data-open-modal
    const openTrigger = e.target.closest('[data-open-modal]');
    if (openTrigger) {
      e.preventDefault();
      e.stopPropagation();

      const modalId = openTrigger.dataset.openModal;
      const presetProjectType = openTrigger.getAttribute('data-preset-project-type') || openTrigger.dataset.presetProjectType || openTrigger.getAttribute('data-service') || openTrigger.dataset.service || '';

      // If mobile menu is open, close it first
      const navMenu = $('#mobileMenu');
      const navToggle = $('#navToggle');
      if (navMenu && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        if (navToggle) navToggle.classList.remove('open');
      }

      openModal(modalId, { presetProjectType, service: presetProjectType });
      return;
    }

    // 3. Fallback for every "Start a Project" CTA across the site
    const genericTrigger = e.target.closest('a[href^="#contact"], .nav-cta, .mobile-menu-cta, .fab-cta, #ctaMagnetic');
    if (genericTrigger) {
      e.preventDefault();
      e.stopPropagation();

      const href = genericTrigger.getAttribute('href') || '';
      let serviceKeyword = '';
      if (href.includes('service=')) {
        serviceKeyword = href.split('service=')[1].split('&')[0];
      } else if (genericTrigger.textContent.toLowerCase().includes('website')) {
        serviceKeyword = 'web';
      } else if (genericTrigger.textContent.toLowerCase().includes('scale') || genericTrigger.textContent.toLowerCase().includes('growth')) {
        serviceKeyword = 'growth';
      } else if (genericTrigger.textContent.toLowerCase().includes('video') || genericTrigger.textContent.toLowerCase().includes('reel')) {
        serviceKeyword = 'reels';
      }

      openModal('projectModal', { service: serviceKeyword });
    }
  }, true);

  // Close modals on Escape key
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.popup-modal.is-open, .project-modal.is-open');
      if (activeModal) {
        closeModal(activeModal);
      }
    }
  });

  // Filter Bar Controller for Portfolio Modal (#workModal)
  const workFilterBar = $('#workFilterBar');
  const workGrid = $('#workGrid');
  if (workFilterBar && workGrid) {
    const filterBtns = $$('.popup-filter-btn', workFilterBar);
    const workCards = $$('.popup-card', workGrid);

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter || 'all';
        workCards.forEach(card => {
          const category = card.dataset.category || '';
          if (filter === 'all' || category.includes(filter)) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // Check URL on load & hashchange: open modal immediately if #contact or #work etc. is present
  function handleUrlHash() {
    if (!window.location.hash) return;
    const rawHash = window.location.hash.replace(/^#/, '');
    const cleanHash = rawHash.split('?')[0];

    let serviceKeyword = '';
    if (window.location.hash.includes('service=')) {
      serviceKeyword = window.location.hash.split('service=')[1].split('&')[0];
    }

    if (cleanHash === 'contact') {
      const currentModal = document.getElementById('projectModal');
      if (currentModal && currentModal.classList.contains('is-open')) {
        return;
      }
      openModal('projectModal', { service: serviceKeyword });
      try {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (_) {}
    } else if (cleanHash === 'work') {
      openModal('workModal');
    } else if (cleanHash === 'video' || cleanHash === 'videos') {
      openModal('videoWorkModal');
    } else if (cleanHash === 'capabilities' || cleanHash === 'services') {
      openModal('contentCapabilitiesModal');
    } else if (cleanHash === 'tech') {
      openModal('techStackModal');
    } else if (cleanHash === 'growth' || cleanHash === 'approach') {
      openModal('growthProcessModal');
    } else if (cleanHash === 'whatsapp') {
      openModal('whatsappModal');
    }
  }

  // Trigger on script run and after brief DOM settle
  handleUrlHash();
  setTimeout(handleUrlHash, 250);

  // Listen to hash changes (browser back/forward or external triggers)
  window.addEventListener('hashchange', handleUrlHash);
})();

// ── Parallax: Hero subtle movement ────────────────────────────
(function initParallax() {
  if (isMobile()) return;
  const hero = $('#hero');
  if (!hero) return;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const heroH = hero.offsetHeight;
    if (scrollY > heroH) return;
    const overlay = hero.querySelector('.hero-grid-overlay');
    if (overlay) overlay.style.transform = `translateY(${scrollY * 0.3}px)`;
  }, { passive: true });
})();

// ── Number Counter Animation ───────────────────────────────────
(function initCounters() {
  const stats = $$('.stat-num');
  if (!stats.length) return;

  function animateCount(el) {
    const text = el.textContent;
    const suffix = text.replace(/[0-9]/g, '');
    const end = parseInt(text.replace(/[^0-9]/g, ''), 10);
    if (isNaN(end)) return;

    const duration = 1500;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * end);
      el.innerHTML = current + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  stats.forEach(el => {
    const num = parseInt(el.textContent.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) observer.observe(el);
  });
})();

// ── Marquee pause on hover ─────────────────────────────────────
(function initMarqueePause() {
  const marquees = $$('.marquee-content, .industries-inner');
  marquees.forEach(m => {
    m.addEventListener('mouseenter', () => m.style.animationPlayState = 'paused');
    m.addEventListener('mouseleave', () => m.style.animationPlayState = 'running');
  });
})();

// ── Keyboard Accessibility ─────────────────────────────────────
(function initKeyboardAccess() {
  document.addEventListener('keydown', e => {
    if (e.key === 'Tab') document.body.classList.add('keyboard-nav');
  });
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
  });
})();

// ── Selected Work Card 3D Tilt ─────────────────────────────────
(function initWorkTilt() {
  if (window.matchMedia('(hover: none)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches || isMobile()) return;
  const cards = $$('.work-item');
  if (!cards.length) return;

  cards.forEach(card => {
    let ticking = false;

    card.addEventListener('mousemove', e => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        // Subtle tilt: max ±5deg
        const tiltX = -y * 8;
        const tiltY = x * 8;
        card.style.setProperty('--tiltX', tiltX.toFixed(2) + 'deg');
        card.style.setProperty('--tiltY', tiltY.toFixed(2) + 'deg');
        ticking = false;
      });
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--tiltX', '0deg');
      card.style.setProperty('--tiltY', '0deg');
    });
  });
})();

// ── Hero CTA Magnetic Pull (Sole Magnetic Moment) ──────────────
(function initMagneticCTA() {
  if (window.matchMedia('(hover: none)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches || isMobile()) return;
  const btn = $('#ctaMagnetic');
  if (!btn) return;

  const pullRadius = 90; // Active influence distance in px
  const maxShift = 12;   // Max translation in px

  window.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    const btnX = rect.left + rect.width / 2;
    const btnY = rect.top + rect.height / 2;
    const distX = e.clientX - btnX;
    const distY = e.clientY - btnY;
    const dist = Math.hypot(distX, distY);

    if (dist < pullRadius) {
      const strength = (1 - dist / pullRadius);
      const moveX = (distX / pullRadius) * maxShift * strength;
      const moveY = (distY / pullRadius) * maxShift * strength;
      btn.style.transform = `translate(${moveX.toFixed(1)}px, ${moveY.toFixed(1)}px)`;
    } else if (btn.style.transform) {
      btn.style.transform = '';
    }
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
})();

// ── Founders & Team Grid ───────────────────────────────────────
(function initTeamGrid() {
  const container = $('#teamGrid');
  if (!container) return;

  const founders = [
    {
      id: '01',
      name: 'Anoop Shukla',
      title: 'FOUNDER, CEO & CTO',
      bio: 'Student at IIT Madras & full-stack developer.',
      photoSrc: 'assets/team/anoop-shukla.png',
      fallbackSrc: 'assets/team/anoop-shukla.svg',
      links: [
        { label: 'IG', url: 'https://www.instagram.com/tf_anooppp', type: 'instagram' },
        { label: 'LI', url: 'https://www.linkedin.com/in/anoop-shukla-429028367', type: 'linkedin' }
      ]
    },
    {
      id: '02',
      name: 'Rishabh Maurya',
      title: 'CO-FOUNDER, COO & CSO',
      bio: 'MBA, NMIMS.',
      photoSrc: 'assets/team/rishabh-maurya.png',
      fallbackSrc: 'assets/team/rishabh-maurya.svg',
      links: []
    },
    {
      id: '03',
      name: 'Sachin Maurya',
      title: 'CO-FOUNDER, CFO & CRO',
      bio: null,
      photoSrc: 'assets/team/sachin-maurya.png',
      fallbackSrc: 'assets/team/sachin-maurya.svg',
      links: []
    },
    {
      id: '04',
      name: 'Amit Chaudhary',
      title: 'CO-FOUNDER, CMO & CCO',
      bio: null,
      photoSrc: 'assets/team/amit-chaudhary.png',
      fallbackSrc: 'assets/team/amit-chaudhary.svg',
      links: []
    }
  ];

  const svgIcons = {
    instagram: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>',
    linkedin: '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v7.6h2.79v-7.6H6.46M7.86 6.3a1.62 1.62 0 1 0 1.62 1.62A1.62 1.62 0 0 0 7.86 6.3z"/></svg>'
  };

  const cardsHtml = founders.map((founder, index) => {
    // Bio row: conditionally rendered (collapses with 0 margin if absent)
    const bioHtml = founder.bio
      ? `<p class="founder-bio">${founder.bio}</p>`
      : '';

    // Links row: conditionally rendered
    let linksHtml = '';
    if (founder.links && founder.links.length > 0) {
      const linkItems = founder.links.map(l => `
        <a href="${l.url}" class="founder-social-link" target="_blank" rel="noopener noreferrer" aria-label="${founder.name} on ${l.label}">
          ${svgIcons[l.type] || ''}
          <span>${l.label}</span>
        </a>
      `).join('<span class="founder-link-sep">·</span>');
      linksHtml = `<div class="founder-links">${linkItems}</div>`;
    }

    return `
      <article class="founder-card reveal-up" style="--card-index: ${index};">
        <div class="founder-avatar-wrap">
          <span class="founder-badge">${founder.id}</span>
          <div class="founder-photo-box">
            <div class="founder-photo-inner">
              <img 
                src="${founder.photoSrc}" 
                alt="${founder.name} — ${founder.title}" 
                class="founder-photo" 
                width="400" 
                height="400" 
                loading="lazy"
                onerror="this.onerror=null; this.src='${founder.fallbackSrc}';"
              >
              <div class="founder-photo-tint"></div>
            </div>
            <div class="founder-photo-border"></div>
          </div>
        </div>
        <div class="founder-content">
          <div class="founder-meta">
            <h3 class="founder-name">${founder.name}</h3>
            <span class="founder-title">${founder.title}</span>
          </div>
          ${bioHtml}
          ${linksHtml}
        </div>
      </article>
    `;
  }).join('');

  container.innerHTML = cardsHtml;

  // Observe dynamically generated .reveal-up elements
  const newCards = container.querySelectorAll('.reveal-up');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
  } else {
    newCards.forEach(c => c.classList.add('visible'));
  }
})();

// ── Tech Stack & Pricing Modal Controller ────────────────────────
(function initTechStackPricingModal() {
  const modal = $('#techStackModal');
  if (!modal) return;

  const overviewView = $('#tsPricingOverviewView');
  const samplesView = $('#tsSamplesDetailView');
  const samplesGrid = $('#tsSamplesGrid');
  const backBtn = $('#tsBtnBackToOverview');
  const activeTierName = $('#tsActiveTierName');
  const activeTierPrice = $('#tsActiveTierPrice');
  const activeTierHeading = $('#tsActiveTierHeading');
  const activeTierDesc = $('#tsActiveTierDesc');
  const sampleCtaTitle = $('#tsSampleCtaTitle');

  // Data-driven pricing tiers and sample website collections
  // NOTE: Anoop can easily add or swap real sample links, screenshots, and descriptions here.
  const TECH_STACK_PRICING = [
    {
      id: 'simple',
      name: 'Simple Website',
      price: '₹6,999',
      badge: 'Tier 01',
      desc: 'Clean, responsive multi-page site, ideal for small businesses, founders, and personal portfolios.',
      samples: [
        {
          name: 'Aura Studio Portfolio',
          category: 'Creative Portfolio',
          desc: 'Minimalist typography-forward showcase with sub-second page transitions and WhatsApp direct contact hook.',
          tags: ['Responsive', 'Fast Paint', 'SEO Ready'],
          liveUrl: 'https://example.com/aura-studio',
          gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          accent: '#38BDF8',
          mockupBadge: 'Portfolio Template'
        },
        {
          name: 'Kavya Law Chambers',
          category: 'Professional Services',
          desc: 'Multi-page firm presence with consultation scheduling, client trust validation, and local search structure.',
          tags: ['Multi-page', 'WhatsApp Direct', 'Lead Capture'],
          liveUrl: 'https://example.com/kavya-law',
          gradient: 'linear-gradient(135deg, #131c2e 0%, #0a0e17 100%)',
          accent: '#60A5FA',
          mockupBadge: 'Law & Advisory'
        },
        {
          name: 'Zenith Architecture Studio',
          category: 'Architecture & Design',
          desc: 'High-contrast spatial gallery displaying blueprints, architectural project logs, and firm milestones.',
          tags: ['Gallery Grid', 'Mobile First', 'Inquiry Hook'],
          liveUrl: 'https://example.com/zenith-arch',
          gradient: 'linear-gradient(135deg, #1a1e28 0%, #0d1017 100%)',
          accent: '#818CF8',
          mockupBadge: 'Design Studio'
        }
      ]
    },
    {
      id: 'animated-3d',
      name: '3D Animated Website',
      price: '₹12,999',
      badge: 'Most Popular',
      desc: 'Immersive scroll-driven 3D visuals and animations designed to captivate visitors and elevate brand status.',
      samples: [
        {
          name: 'Nova Spatial OS',
          category: 'Tech Hardware & Vision',
          desc: 'Scroll-driven 3D device breakdown with dynamic camera paths, exploded view sequences, and WebGL glow.',
          tags: ['Three.js', 'ScrollTrigger', 'WebGL Shaders'],
          liveUrl: 'https://example.com/nova-spatial',
          gradient: 'linear-gradient(135deg, #111a33 0%, #090e1d 100%)',
          accent: '#2D5BFF',
          mockupBadge: '3D Hardware Demo'
        },
        {
          name: 'Lumina Luxury Timepieces',
          category: 'Luxury Consumer',
          desc: '360° interactive watch renderer with micro-physics, metallic reflections, and precision craftsmanship details.',
          tags: ['3D Canvas', 'GSAP Motion', '60fps Physics'],
          liveUrl: 'https://example.com/lumina-watch',
          gradient: 'linear-gradient(135deg, #1f1a2e 0%, #0e0b17 100%)',
          accent: '#C084FC',
          mockupBadge: 'Interactive 3D'
        },
        {
          name: 'Solaria Planetary Energy',
          category: 'Clean Energy & SaaS',
          desc: 'Interactive 3D particle globe visualizing renewable power generation and distribution nodes in real-time.',
          tags: ['Interactive Globe', 'GPU Optimized', 'Data Mesh'],
          liveUrl: 'https://example.com/solaria-energy',
          gradient: 'linear-gradient(135deg, #0e2229 0%, #071217 100%)',
          accent: '#34D399',
          mockupBadge: 'WebGL Visualization'
        }
      ]
    },
    {
      id: 'extra-features',
      name: '3D Animated Website + Extra Features',
      price: '₹16,999',
      badge: 'Tier 03',
      desc: 'Everything above plus ambient audio soundscapes, custom interactive cursor, and interactive touches.',
      samples: [
        {
          name: 'Vortex Sonic Audio Labs',
          category: 'Creative Audio Agency',
          desc: 'Ambient soundscape toggles with procedural audio reactivity, magnetic physics cursor, and dark neon aesthetics.',
          tags: ['Spatial Audio', 'Magnetic Cursor', 'Audio Reactive'],
          liveUrl: 'https://example.com/vortex-audio',
          gradient: 'linear-gradient(135deg, #1e1333 0%, #0e071c 100%)',
          accent: '#F43F5E',
          mockupBadge: 'Audio Experience'
        },
        {
          name: 'Nebula Gaming Metaverse',
          category: 'Gaming & Interactive Studio',
          desc: 'Dynamic particle physics engine responding to mouse momentum with subtle SFX cues on key interactions.',
          tags: ['Particle Physics', 'Sound Effects', 'Interactive Canvas'],
          liveUrl: 'https://example.com/nebula-gaming',
          gradient: 'linear-gradient(135deg, #171b38 0%, #0a0d20 100%)',
          accent: '#38BDF8',
          mockupBadge: 'Particle Physics'
        },
        {
          name: 'Hyperion Hypercar Flagship',
          category: 'Automotive Innovation',
          desc: 'Acoustic throttle simulation, interactive light trails, and contextual cursor physics on aerodynamic contours.',
          tags: ['Engine Acoustics', 'Fluid Shaders', 'Bespoke Motion'],
          liveUrl: 'https://example.com/hyperion-car',
          gradient: 'linear-gradient(135deg, #24141e 0%, #12090e 100%)',
          accent: '#FB923C',
          mockupBadge: 'Automotive 3D + Audio'
        }
      ]
    },
    {
      id: 'customised',
      name: 'Fully Customised & Personalised Website',
      price: '₹21,999',
      badge: 'Full Bespoke',
      desc: 'Bespoke design and development tailored entirely to your brand, unlimited revisions and headless CMS.',
      samples: [
        {
          name: 'Apex Capital Partners',
          category: 'Fintech Enterprise',
          desc: 'High-security headless web platform with dynamic deal flow showcase, client portal preview, and custom CMS.',
          tags: ['Headless CMS', 'Next.js 14', 'Custom Analytics'],
          liveUrl: 'https://example.com/apex-capital',
          gradient: 'linear-gradient(135deg, #0e2038 0%, #07111e 100%)',
          accent: '#60A5FA',
          mockupBadge: 'Enterprise Platform'
        },
        {
          name: 'Velox Global Logistics',
          category: 'Enterprise Infrastructure',
          desc: 'Complete bespoke design system featuring interactive supply network maps, live quote API, and VIP routing.',
          tags: ['Custom Backend', 'API Integrations', 'Bespoke UI'],
          liveUrl: 'https://example.com/velox-global',
          gradient: 'linear-gradient(135deg, #142220 0%, #081210 100%)',
          accent: '#2DD4BF',
          mockupBadge: 'Logistics SaaS'
        },
        {
          name: 'Elysium Haute Horlogerie',
          category: 'Bespoke Luxury Commerce',
          desc: 'VIP private client digital salon with concierge booking, encrypted inquiries, and custom visual storytelling.',
          tags: ['VIP Experience', 'Bespoke Checkout', 'Unlimited Polish'],
          liveUrl: 'https://example.com/elysium-luxury',
          gradient: 'linear-gradient(135deg, #261922 0%, #130a10 100%)',
          accent: '#E879F9',
          mockupBadge: 'Luxury Flagship'
        }
      ]
    }
  ];

  let currentTier = TECH_STACK_PRICING[1]; // Default to Most Popular (3D Animated)

  function renderTierSamples(tier) {
    if (!tier || !samplesGrid) return;
    currentTier = tier;

    if (activeTierName) activeTierName.textContent = tier.name;
    if (activeTierPrice) activeTierPrice.textContent = tier.price;
    if (activeTierHeading) activeTierHeading.textContent = `${tier.name} — Live Showcases`;
    if (activeTierDesc) activeTierDesc.textContent = tier.desc;
    if (sampleCtaTitle) sampleCtaTitle.textContent = `Ready to launch your ${tier.name}?`;

    samplesGrid.innerHTML = tier.samples.map(sample => {
      const tagsHtml = sample.tags.map(t => `<span class="ts-sample-tag">${t}</span>`).join('');
      const cleanUrl = sample.liveUrl.replace(/^https?:\/\//, '');

      return `
        <article class="ts-sample-card" role="listitem" tabindex="0" aria-label="${sample.name} — ${sample.category}">
          <div class="ts-sample-browser-bar">
            <div class="ts-browser-dots">
              <span class="ts-browser-dot red"></span>
              <span class="ts-browser-dot yellow"></span>
              <span class="ts-browser-dot green"></span>
            </div>
            <div class="ts-browser-url">${cleanUrl}</div>
          </div>
          <div class="ts-sample-canvas" style="background: ${sample.gradient};">
            <div class="ts-sample-canvas-overlay"></div>
            <div class="ts-sample-canvas-content">
              <span class="ts-sample-mockup-badge" style="border-color: ${sample.accent}; color: ${sample.accent};">
                ${sample.mockupBadge}
              </span>
              <div class="ts-sample-wireframe-lines">
                <div class="ts-wire-line l1" style="background: ${sample.accent}; opacity: 0.4;"></div>
                <div class="ts-wire-line l2"></div>
              </div>
            </div>
          </div>
          <div class="ts-sample-body">
            <span class="ts-sample-category">${sample.category}</span>
            <h4 class="ts-sample-title">${sample.name}</h4>
            <p class="ts-sample-desc">${sample.desc}</p>
            <div class="ts-sample-tags">${tagsHtml}</div>
            <div class="ts-sample-action-row">
              <a href="${sample.liveUrl}" target="_blank" rel="noopener noreferrer" class="ts-sample-visit-link" aria-label="Visit ${sample.name}">
                <span>Visit Live Demo</span> <span class="arrow">↗</span>
              </a>
              <span class="ts-sample-status-pill">Interactive Demo</span>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function showSamplesView(tierId) {
    const tier = TECH_STACK_PRICING.find(t => t.id === tierId) || TECH_STACK_PRICING[1];
    renderTierSamples(tier);

    if (overviewView) overviewView.style.display = 'none';
    if (samplesView) {
      samplesView.style.display = 'block';
      setTimeout(() => {
        if (backBtn) backBtn.focus({ preventScroll: true });
      }, 100);
    }
  }

  function showOverviewView() {
    if (samplesView) samplesView.style.display = 'none';
    if (overviewView) {
      overviewView.style.display = 'block';
      setTimeout(() => {
        const firstCard = overviewView.querySelector('.ts-pricing-card');
        if (firstCard) firstCard.focus({ preventScroll: true });
      }, 100);
    }
  }

  function selectPackageAndOpenInquiry(tierName, tierPrice) {
    const name = tierName || currentTier.name;
    const price = tierPrice || currentTier.price;

    closeModal('techStackModal');

    setTimeout(() => {
      openProjectModal({
        presetProjectType: 'Website',
        presetMessage: `Interested in: ${name} — ${price}. Requirements: `
      });
    }, 120);
  }

  // Delegated event listener for cards, view samples, back, and package selection
  modal.addEventListener('click', e => {
    // 1. "Select This Package" inside card
    const selectBtn = e.target.closest('.ts-btn-select-tier');
    if (selectBtn) {
      e.preventDefault();
      e.stopPropagation();
      const tierName = selectBtn.dataset.tier;
      const tierPrice = selectBtn.dataset.price;
      selectPackageAndOpenInquiry(tierName, tierPrice);
      return;
    }

    // 2. "View Samples" button
    const viewSamplesBtn = e.target.closest('.ts-btn-view-samples');
    if (viewSamplesBtn) {
      e.preventDefault();
      e.stopPropagation();
      const tierId = viewSamplesBtn.dataset.tierId;
      showSamplesView(tierId);
      return;
    }

    // 3. Card click (when not clicking select button)
    const card = e.target.closest('.ts-pricing-card');
    if (card && overviewView && overviewView.contains(card)) {
      const tierId = card.dataset.tierId;
      showSamplesView(tierId);
      return;
    }

    // 4. Back button to return to 4-tier overview
    const backTrigger = e.target.closest('#tsBtnBackToOverview, .ts-back-btn');
    if (backTrigger) {
      e.preventDefault();
      e.stopPropagation();
      showOverviewView();
      return;
    }

    // 5. "Select This Package" button in sample view footer
    const activeSelectBtn = e.target.closest('#tsBtnSelectActiveTier');
    if (activeSelectBtn) {
      e.preventDefault();
      e.stopPropagation();
      selectPackageAndOpenInquiry(currentTier.name, currentTier.price);
      return;
    }
  });

  // Keyboard accessibility (Enter / Space on card)
  modal.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const focusedCard = document.activeElement ? document.activeElement.closest('.ts-pricing-card') : null;
      if (focusedCard && document.activeElement === focusedCard) {
        e.preventDefault();
        const tierId = focusedCard.dataset.tierId;
        showSamplesView(tierId);
      }
    }
  });

  window.resetTechStackModalView = showOverviewView;
})();

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log(
    '%cTECTO MARK%c\nBuild. Promote. Grow.\ntectomarksupport@gmail.com',
    'font-size:20px;font-weight:900;color:#3B82F6;letter-spacing:0.1em;',
    'font-size:12px;color:#888;'
  );
});



