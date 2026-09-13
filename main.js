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
  if (!preloader) return;

  let current = 0;
  const target = 100;
  const duration = 1600;
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
      // Minimum visible time then hide
      setTimeout(() => {
        preloader.classList.add('hidden');
        document.body.classList.add('loaded');
        // Show FAB after preloader
        setTimeout(() => {
          const fab = $('#fabGroup');
          if (fab) fab.classList.add('visible');
        }, 600);
      }, 200);
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
  const sections = $$('section[id], div[id]');
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
    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 72;
    const top = target.getBoundingClientRect().top + window.scrollY - navH;
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



// ── Service Inquiry System (Agency Tier) ───────────────────────
(function initServiceInquirySystem() {
  const form = $('#inquiryForm');
  const confirmationView = $('#inquiryConfirmation');
  const confirmName = $('#confirmName');
  const confirmEmail = $('#confirmEmail');
  const confirmRecap = $('#confirmRecap');
  const resetBtn = $('#resetInquiryBtn');
  const submitBtn = $('#formSubmit');
  const generalError = $('#formGeneralError');

  if (!form) return;

  // Selected State Collections
  const selectedServices = new Set();
  let selectedBudget = '';
  let selectedTimeline = '';

  // 1. Multi-Select Services Chips
  const chipItems = $$('.chip-item', form);
  const otherServiceWrap = $('#otherServiceWrap');
  const otherServiceInput = $('#otherService');
  const servicesError = $('#servicesError');

  chipItems.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.value;
      if (chip.classList.contains('active')) {
        chip.classList.remove('active');
        selectedServices.delete(val);
        if (chip.classList.contains('chip-other') && otherServiceWrap) {
          otherServiceWrap.style.display = 'none';
        }
      } else {
        chip.classList.add('active');
        selectedServices.add(val);
        if (chip.classList.contains('chip-other') && otherServiceWrap) {
          otherServiceWrap.style.display = 'flex';
          if (otherServiceInput) otherServiceInput.focus();
        }
      }

      if (selectedServices.size > 0 && servicesError) {
        servicesError.textContent = '';
      }
    });
  });

  // 2. Single-Select Pills (Budget & Timeline)
  function setupPillGroup(containerId, onSelect) {
    const group = $(containerId);
    if (!group) return;
    const pills = $$('.pill-option', group);
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        const isAlreadyActive = pill.classList.contains('active');
        pills.forEach(p => p.classList.remove('active'));
        if (!isAlreadyActive) {
          pill.classList.add('active');
          onSelect(pill.dataset.value);
        } else {
          onSelect('');
        }
      });
    });
  }

  setupPillGroup('#budgetPills', val => { selectedBudget = val; });
  setupPillGroup('#timelinePills', val => { selectedTimeline = val; });

  // 3. Deep-Linking: Pre-select Service via Query Param or Click
  function preselectServiceByKeyword(keyword, shouldScroll = false) {
    if (!keyword) return;
    const key = keyword.toLowerCase();
    
    // Clear previously selected chips so the chosen one is cleanly highlighted
    chipItems.forEach(c => c.classList.remove('active'));
    selectedServices.clear();

    chipItems.forEach(chip => {
      const val = chip.dataset.value.toLowerCase();
      if (
        (key.includes('web') && val.includes('website design')) ||
        (key.includes('social') && val.includes('social media')) ||
        (key.includes('growth') && val.includes('growth strategy')) ||
        (key.includes('insta') && val.includes('instagram')) ||
        (key.includes('content') && val.includes('creative content')) ||
        (key.includes('video') && val.includes('reels')) ||
        (key.includes('ad') && val.includes('advertising')) ||
        (key.includes('meta') && val.includes('meta'))
      ) {
        chip.classList.add('active');
        selectedServices.add(chip.dataset.value);

        // Flash pulse glow animation on the selected chip
        chip.style.animation = 'none';
        void chip.offsetWidth;
        chip.style.animation = 'pulseGlow 1.2s ease-out';
      }
    });

    if (shouldScroll) {
      const contactTarget = document.getElementById('contact');
      if (contactTarget) {
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 72;
        const top = contactTarget.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top, behavior: 'smooth' });

        setTimeout(() => {
          const fullName = document.getElementById('fullName');
          if (fullName) fullName.focus({ preventScroll: true });
        }, 650);
      }
    }
  }
  window.preselectServiceByKeyword = preselectServiceByKeyword;

  // Check URL params on load
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get('service');
    if (serviceParam) {
      preselectServiceByKeyword(serviceParam, false);
    }
    // Also check hash like #contact?service=social
    if (window.location.hash.includes('service=')) {
      const hashParam = window.location.hash.split('service=')[1];
      if (hashParam) preselectServiceByKeyword(hashParam.split('&')[0], false);
    }
  } catch (e) {
    // Ignore URL parse errors
  }

  // Intercept service buttons and direct scroll to inquiry form
  $$('.service-inquire-btn, a[href*="service="]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const href = link.getAttribute('href') || '';
      let serviceVal = '';
      if (href.includes('service=')) {
        serviceVal = href.split('service=')[1].split('&')[0];
      }
      preselectServiceByKeyword(serviceVal, true);
      try {
        history.pushState(null, '', href);
      } catch (_) {}
    });
  });

  // 4. Validation Helpers
  function setFieldError(field, message) {
    const group = field.closest('.form-group');
    if (!group) return;
    group.classList.add('has-error');
    const errSpan = group.querySelector('.field-error');
    if (errSpan) errSpan.textContent = message;
  }

  function clearFieldError(field) {
    const group = field.closest('.form-group');
    if (!group) return;
    group.classList.remove('has-error');
    const errSpan = group.querySelector('.field-error');
    if (errSpan) errSpan.textContent = '';
  }

  function validateField(field) {
    if (field.required && !field.value.trim()) {
      const label = form.querySelector(`label[for="${field.id}"]`);
      const name = label ? label.textContent.replace('*', '').trim() : 'This field';
      setFieldError(field, `${name} is required`);
      return false;
    }
    if (field.type === 'email' && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())) {
      setFieldError(field, 'Please enter a valid work email');
      return false;
    }
    if (field.id === 'phone' && field.value) {
      const digits = field.value.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) {
        setFieldError(field, 'Please enter a valid phone number with country code');
        return false;
      }
    }
    clearFieldError(field);
    return true;
  }

  // Real-time blur validation
  $$('input[required], textarea[required], select[required]', form).forEach(field => {
    field.addEventListener('blur', () => {
      if (field.value.trim() || field.required) validateField(field);
    });
    field.addEventListener('input', () => {
      if (field.closest('.form-group').classList.contains('has-error')) {
        validateField(field);
      }
    });
  });

  // 5. Submit Handler & API Dispatch
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (generalError) {
      generalError.style.display = 'none';
      generalError.textContent = '';
    }

    // Validate fields
    const requiredFields = $$('input[required], select[required], textarea[required]', form);
    let isValid = true;
    requiredFields.forEach(f => {
      if (!validateField(f)) isValid = false;
    });

    // Validate services selection
    if (selectedServices.size === 0) {
      if (servicesError) servicesError.textContent = 'Please select at least one service you need.';
      isValid = false;
    } else {
      if (servicesError) servicesError.textContent = '';
    }

    if (!isValid) {
      const firstInvalid = form.querySelector('.form-group.has-error input, .form-group.has-error select, .form-group.has-error textarea');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Extract values
    const nameVal = ($('#name') || {}).value || '';
    const companyVal = ($('#company') || {}).value || '';
    const companyTypeVal = ($('#companyType') || {}).value || '';
    const emailVal = ($('#email') || {}).value || '';
    const phoneVal = ($('#phone') || {}).value || '';
    const detailsVal = ($('#projectDetails') || {}).value || '';
    const otherServiceVal = ($('#otherService') || {}).value || '';
    const honeypotVal = ($('#hp_field') || {}).value || '';

    const payload = {
      name: nameVal.trim(),
      company: companyVal.trim(),
      companyType: companyTypeVal,
      email: emailVal.trim(),
      phone: phoneVal.trim(),
      services: Array.from(selectedServices),
      otherService: otherServiceVal.trim() || null,
      projectDetails: detailsVal.trim(),
      budgetRange: selectedBudget || null,
      timeline: selectedTimeline || null,
      source: 'Website Contact Page',
      honeypot: honeypotVal
    };

    // UI Loading State
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    const btnText = submitBtn.querySelector('.btn-text');
    if (btnText) btnText.textContent = 'Sending Inquiry…';

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success: Show In-Site Confirmation State
        const firstName = payload.name.split(' ')[0] || payload.name;
        if (confirmName) confirmName.textContent = firstName.toUpperCase();
        if (confirmEmail) confirmEmail.textContent = payload.email;

        if (confirmRecap) {
          const servicesListStr = payload.services.join(', ');
          confirmRecap.innerHTML = `
            <div style="margin-bottom: 6px;"><strong>Company:</strong> ${payload.company} (${payload.companyType || 'General'})</div>
            <div style="margin-bottom: 6px;"><strong>Selected Services:</strong> ${servicesListStr}</div>
            <div><strong>Inquiry Reference:</strong> <span style="font-family:monospace; color:var(--accent); font-weight:700;">${data.inquiryId}</span></div>
          `;
        }

        form.style.display = 'none';
        if (confirmationView) {
          confirmationView.style.display = 'block';
          confirmationView.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // GA4 / Pixel custom event support
        if (typeof window.dataLayer !== 'undefined') {
          window.dataLayer.push({
            event: 'generate_lead',
            lead_company: payload.company,
            lead_services: payload.services
          });
        }
      } else {
        throw new Error(data.error || 'Server rejected the inquiry.');
      }
    } catch (err) {
      console.warn('Backend endpoint unavailable or returned error, providing user fallback:', err);
      if (generalError) {
        generalError.innerHTML = `
          <strong>Notice:</strong> We could not connect to the automated pipeline right now.
          Please <a href="https://wa.me/919555013580?text=Hi%20Tecto%20Mark%2C%20I%20would%20like%20to%20inquire%20about%20${encodeURIComponent(Array.from(selectedServices).join(', '))}" target="_blank" rel="noopener" style="color:#25D366; text-decoration:underline; font-weight:700;">click here to chat directly on WhatsApp</a>
          or email us at <a href="mailto:tectomarksupport@gmail.com?subject=Project%20Inquiry%20from%20${encodeURIComponent(payload.company)}" style="color:#FFFFFF; text-decoration:underline;">tectomarksupport@gmail.com</a>.
        `;
        generalError.style.display = 'block';
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      if (btnText) btnText.textContent = 'Send Inquiry →';
    }
  });

  // 6. Reset Form Button inside Confirmation State
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      selectedServices.clear();
      chipItems.forEach(c => c.classList.remove('active'));
      $$('.pill-option').forEach(p => p.classList.remove('active'));
      selectedBudget = '';
      selectedTimeline = '';
      if (otherServiceWrap) otherServiceWrap.style.display = 'none';
      if (confirmationView) confirmationView.style.display = 'none';
      form.style.display = 'flex';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
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
      photoSrc: 'assets/team/anoop-shukla.svg',
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
      photoSrc: 'assets/team/rishabh-maurya.svg',
      fallbackSrc: 'assets/team/rishabh-maurya.svg',
      links: []
    },
    {
      id: '03',
      name: 'Sachin Maurya',
      title: 'CO-FOUNDER, CFO & CRO',
      bio: null,
      photoSrc: 'assets/team/sachin-maurya.svg',
      fallbackSrc: 'assets/team/sachin-maurya.svg',
      links: []
    },
    {
      id: '04',
      name: 'Amit Chaudhary',
      title: 'CO-FOUNDER, CMO & CCO',
      bio: null,
      photoSrc: 'assets/team/amit-chaudhary.svg',
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
        <div class="founder-photo-box">
          <span class="founder-badge">${founder.id}</span>
          <div class="founder-photo-inner">
            <img 
              src="${founder.photoSrc}" 
              alt="${founder.name} — ${founder.title}" 
              class="founder-photo" 
              width="400" 
              height="500" 
              loading="lazy"
              onerror="this.onerror=null; this.src='${founder.fallbackSrc}';"
            >
            <div class="founder-photo-tint"></div>
          </div>
          <div class="founder-photo-border"></div>
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
    newCards.forEach(c => observer.observe(c));
  } else {
    newCards.forEach(c => c.classList.add('visible'));
  }
})();

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log(
    '%cTECTO MARK%c\nBuild. Promote. Grow.\ntectomarksupport@gmail.com',
    'font-size:20px;font-weight:900;color:#3B82F6;letter-spacing:0.1em;',
    'font-size:12px;color:#888;'
  );
});



