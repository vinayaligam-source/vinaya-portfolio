/**
 * =============================================================================
 * script.js — Vinaya Personal Portfolio
 * =============================================================================
 * Pure vanilla JavaScript. No external libraries or frameworks.
 * Features:
 *  1.  Navbar scroll behaviour (scrolled class + sticky styling)
 *  2.  Mobile hamburger menu (open/close, overlay, body-scroll lock)
 *  3.  Smooth scrolling for all internal anchor links
 *  4.  Scroll-reveal animations via IntersectionObserver
 *  5.  Project category filters with fade transition
 *  6.  Contact-form validation (submit + real-time blur)
 *  7.  Back-to-top button (show/hide + smooth scroll)
 *  8.  Footer year auto-update
 *  9.  Code-editor cursor blink animation (respects prefers-reduced-motion)
 * 10.  Active nav-link detection on scroll (throttled with rAF)
 * =============================================================================
 */

'use strict';

/* ─────────────────────────────────────────────────────────────────────────────
   UTILITY: Check user's motion preference once, reuse throughout the file.
   MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
───────────────────────────────────────────────────────────────────────────── */
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;


/* =============================================================================
   1. NAVBAR SCROLL BEHAVIOUR
   — Adds/removes 'scrolled' class on #navbar when the page scrolls past 50 px.
   — Active-link detection is handled separately in section 10.
============================================================================= */
(function initNavbarScroll() {
  /** @type {HTMLElement|null} */
  const navbar = document.getElementById('navbar');

  if (!navbar) return; // guard: navbar must exist in DOM

  /**
   * Reads window.scrollY and toggles the 'scrolled' class accordingly.
   * Called both on 'scroll' and on page load so the class is correct from
   * the very first render (e.g. when the user refreshes mid-page).
   */
  function handleNavbarScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  // Run once immediately so the state is correct before first scroll.
  handleNavbarScroll();

  // Listen for subsequent scrolls.
  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
})();


/* =============================================================================
   2. MOBILE HAMBURGER MENU
   — Toggles 'open' class on:
       • .hamburger button (animates the icon to ✕)
       • .nav-mobile   (slides in / out the mobile menu)
       • .nav-overlay  (dims the page behind the menu)
   — Closes menu when any link inside .nav-mobile is clicked.
   — Closes menu when the overlay is clicked.
   — Locks / unlocks body scroll while menu is open.
============================================================================= */
(function initHamburgerMenu() {
  /** @type {HTMLElement|null} */
  const hamburger   = document.querySelector('.hamburger');
  /** @type {HTMLElement|null} */
  const navMobile   = document.querySelector('.nav-mobile');
  /** @type {HTMLElement|null} */
  const navOverlay  = document.querySelector('.nav-overlay');
  /** @type {NodeList} */
  const mobileLinks = document.querySelectorAll('.nav-mobile a');

  // All three elements must exist before wiring up events.
  if (!hamburger || !navMobile || !navOverlay) return;

  /**
   * Opens the mobile menu.
   * Adds 'open' class to all three targets and locks body scroll.
   */
  function openMenu() {
    hamburger.classList.add('open');
    navMobile.classList.add('open');
    navOverlay.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // prevent background scroll
  }

  /**
   * Closes the mobile menu.
   * Removes 'open' class from all three targets and restores body scroll.
   */
  function closeMenu() {
    hamburger.classList.remove('open');
    navMobile.classList.remove('open');
    navOverlay.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = ''; // restore normal scroll
  }

  /**
   * Toggles the menu between open and closed states.
   * Called when the hamburger button is clicked.
   */
  function toggleMenu() {
    const isOpen = hamburger.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  }

  // Wire up hamburger click.
  hamburger.addEventListener('click', toggleMenu);

  // Close menu when the dimmed overlay is clicked.
  navOverlay.addEventListener('click', closeMenu);

  // Close menu when any mobile nav link is clicked
  // (the smooth-scroll handler will then take the user to the right section).
  mobileLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Close menu on Escape key press for accessibility.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && hamburger.classList.contains('open')) {
      closeMenu();
      hamburger.focus(); // return focus to trigger element
    }
  });
})();


/* =============================================================================
   3. SMOOTH SCROLLING
   — Intercepts clicks on all anchor links whose href starts with '#'.
   — Scrolls to the target element, offsetting by 80 px to account for the
     fixed navbar height.
   — Falls back gracefully if the target element does not exist.
============================================================================= */
(function initSmoothScroll() {
  /**
   * Scrolls the page to the given element with an 80 px top offset for the
   * fixed navbar. Uses the native scrollTo API for precise control.
   *
   * @param {HTMLElement} target - The section element to scroll to.
   */
  function scrollToSection(target) {
    const top = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  // Select every anchor whose href attribute starts with '#'.
  const internalLinks = document.querySelectorAll('a[href^="#"]');

  internalLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      const href = link.getAttribute('href');

      // Skip if href is exactly '#' (no-op links / logo links to top).
      if (href === '#') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      /** @type {HTMLElement|null} */
      const target = document.querySelector(href);

      if (target) {
        e.preventDefault();
        scrollToSection(target);
      }
      // If no target found, let the browser handle it normally.
    });
  });
})();


/* =============================================================================
   4. SCROLL-REVEAL ANIMATIONS
   — Uses IntersectionObserver to watch every element with class 'reveal'.
   — When such an element becomes 15 % visible in the viewport, the class
     'revealed' is added, which CSS uses to transition the element in.
   — If the user prefers reduced motion, all elements are shown immediately
     without any animation.
============================================================================= */
(function initScrollReveal() {
  /** @type {NodeList} */
  const revealElements = document.querySelectorAll('.reveal');

  if (!revealElements.length) return;

  // Honour the user's OS-level accessibility preference.
  if (prefersReducedMotion) {
    // Show all elements instantly without any animation.
    revealElements.forEach(function (el) {
      el.classList.add('revealed');
    });
    return;
  }

  /**
   * IntersectionObserver callback.
   * Fires each time a watched element crosses the threshold.
   *
   * @param {IntersectionObserverEntry[]} entries
   * @param {IntersectionObserver}        observer
   */
  function onRevealIntersect(entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Stop watching once revealed — the animation only plays once.
        observer.unobserve(entry.target);
      }
    });
  }

  const revealObserver = new IntersectionObserver(onRevealIntersect, {
    root:      null,  // observe relative to the browser viewport
    rootMargin: '0px',
    threshold:  0.15  // trigger when 15 % of the element is visible
  });

  // Begin watching each reveal element.
  revealElements.forEach(function (el) {
    revealObserver.observe(el);
  });
})();


/* =============================================================================
   5. PROJECT FILTERS
   — Filter buttons carry data-filter="all|business|healthcare|legal|…"
   — Project cards carry data-category="business|healthcare|legal|…"
   — Clicking a filter button shows matching cards and hides others.
   — A subtle CSS-driven fade-out / fade-in is achieved by toggling 'hidden'.
============================================================================= */
(function initProjectFilters() {
  /** @type {NodeList} */
  const filterButtons = document.querySelectorAll('.filter-btn');
  /** @type {NodeList} */
  const projectCards  = document.querySelectorAll('.project-card');

  if (!filterButtons.length || !projectCards.length) return;

  /**
   * Filters the project grid based on a category string.
   *
   * @param {string} filter - The category to show, or 'all' to show everything.
   */
  function applyFilter(filter) {
    projectCards.forEach(function (card) {
      const categoryAttr = card.getAttribute('data-category') || '';
      const categories = categoryAttr.toLowerCase().split(/\s+/);

      if (filter === 'all' || categories.includes(filter.toLowerCase())) {
        // Show: remove 'hidden', restore visibility.
        card.classList.remove('hidden');
        // Small rAF delay lets the browser repaint before fading back in,
        // making the transition visible even if the card was never hidden.
        requestAnimationFrame(function () {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        });
      } else {
        // Hide: add 'hidden' class (CSS sets display:none or opacity:0).
        card.classList.add('hidden');
        card.style.opacity = '0';
        card.style.transform = 'translateY(16px)';
      }
    });
  }

  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      // 1. Update active state on buttons.
      filterButtons.forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      // 2. Apply the filter.
      const filter = btn.getAttribute('data-filter') || 'all';
      applyFilter(filter);
    });
  });

  // Ensure the 'all' filter (or whichever is marked active in HTML) is applied
  // on page load so card visibility matches the default button state.
  const defaultActiveBtn = document.querySelector('.filter-btn.active');
  if (defaultActiveBtn) {
    const defaultFilter = defaultActiveBtn.getAttribute('data-filter') || 'all';
    applyFilter(defaultFilter);
  } else {
    applyFilter('all');
  }
})();


/* =============================================================================
   6. CONTACT FORM VALIDATION
   — Form: #contactForm
   — Fields: name, email, projectType (select), message
   — On submit: validates all fields, shows success or error banner.
   — On blur (real-time): validates the individual field that lost focus.
   — Error state: adds 'error' class to the parent .form-group element.
     CSS then makes the sibling .error-msg visible.
============================================================================= */
(function initContactForm() {
  /** @type {HTMLFormElement|null} */
  const form = document.getElementById('contactForm');

  if (!form) return;

  // Cache references to individual form fields.
  /** @type {HTMLInputElement|null} */
  const nameField    = form.querySelector('[name="name"]');
  /** @type {HTMLInputElement|null} */
  const emailField   = form.querySelector('[name="email"]');
  /** @type {HTMLSelectElement|null} */
  const typeField    = form.querySelector('[name="project_type"]');
  /** @type {HTMLTextAreaElement|null} */
  const messageField = form.querySelector('[name="message"]');

  // Cache banner elements.
  /** @type {HTMLElement|null} */
  const successBanner = document.getElementById('formSuccess');
  /** @type {HTMLElement|null} */
  const errorBanner   = document.getElementById('formError');

  // Email validation regex — basic but practical.
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ── Helpers ─────────────────────────────────────────────────────────────── */

  /**
   * Returns the closest ancestor with class 'form-group' for a given field.
   *
   * @param {HTMLElement} field
   * @returns {HTMLElement|null}
   */
  function getFormGroup(field) {
    return field ? field.closest('.form-group') : null;
  }

  /**
   * Marks a form group as invalid by adding the 'error' class.
   * CSS reveals the .error-msg sibling element.
   *
   * @param {HTMLElement|null} group
   */
  function setError(group) {
    if (group) group.classList.add('error');
  }

  /**
   * Clears the invalid state from a form group.
   *
   * @param {HTMLElement|null} group
   */
  function clearError(group) {
    if (group) group.classList.remove('error');
  }

  /* ── Individual field validators ─────────────────────────────────────────── */

  /**
   * Validates the name field (must not be blank after trimming).
   *
   * @returns {boolean} true if valid
   */
  function validateName() {
    const group = getFormGroup(nameField);
    if (!nameField || nameField.value.trim() === '') {
      setError(group);
      return false;
    }
    clearError(group);
    return true;
  }

  /**
   * Validates the email field against the EMAIL_REGEX pattern.
   *
   * @returns {boolean} true if valid
   */
  function validateEmail() {
    const group = getFormGroup(emailField);
    if (!emailField || !EMAIL_REGEX.test(emailField.value.trim())) {
      setError(group);
      return false;
    }
    clearError(group);
    return true;
  }

  /**
   * Validates the project-type select (must have a non-empty value selected).
   *
   * @returns {boolean} true if valid
   */
  function validateProjectType() {
    const group = getFormGroup(typeField);
    if (!typeField || typeField.value === '' || typeField.value === null) {
      setError(group);
      return false;
    }
    clearError(group);
    return true;
  }

  /**
   * Validates the message textarea (must not be blank after trimming).
   *
   * @returns {boolean} true if valid
   */
  function validateMessage() {
    const group = getFormGroup(messageField);
    if (!messageField || messageField.value.trim() === '') {
      setError(group);
      return false;
    }
    clearError(group);
    return true;
  }

  /* ── Real-time blur validation ───────────────────────────────────────────── */

  // Each field validates itself when focus leaves it, giving instant feedback.
  if (nameField)    nameField.addEventListener('blur',    validateName);
  if (emailField)   emailField.addEventListener('blur',   validateEmail);
  if (typeField)    typeField.addEventListener('blur',    validateProjectType);
  if (messageField) messageField.addEventListener('blur', validateMessage);

  // Also clear errors as the user types (better UX than waiting for blur again).
  if (nameField)    nameField.addEventListener('input',    validateName);
  if (emailField)   emailField.addEventListener('input',   validateEmail);
  if (messageField) messageField.addEventListener('input', validateMessage);
  if (typeField)    typeField.addEventListener('change',   validateProjectType);

  /* ── Submit handler ──────────────────────────────────────────────────────── */

  form.addEventListener('submit', function (e) {
    e.preventDefault(); // prevent native form submission

    // Run all validators; collect results.
    const isNameValid    = validateName();
    const isEmailValid   = validateEmail();
    const isTypeValid    = validateProjectType();
    const isMessageValid = validateMessage();

    const allValid = isNameValid && isEmailValid && isTypeValid && isMessageValid;

    if (allValid) {
      // ── Success path ─────────────────────────────────────────────────────
      if (successBanner) successBanner.classList.remove('hidden');
      if (errorBanner)   errorBanner.classList.add('hidden');

      // Log a reminder for future backend integration.
      console.log(
        'Form ready for backend connection (Formspree/EmailJS). ' +
        'Collected data:',
        {
          name:        nameField    ? nameField.value.trim()    : '',
          email:       emailField   ? emailField.value.trim()   : '',
          projectType: typeField    ? typeField.value           : '',
          message:     messageField ? messageField.value.trim() : ''
        }
      );

      // Reset the form after 3 seconds so the user sees the success message.
      setTimeout(function () {
        form.reset();
        if (successBanner) successBanner.classList.add('hidden');
      }, 3000);

    } else {
      // ── Error path ───────────────────────────────────────────────────────
      if (errorBanner)   errorBanner.classList.remove('hidden');
      if (successBanner) successBanner.classList.add('hidden');

      // Scroll the first invalid field into view so the user can see it.
      const firstErrorGroup = form.querySelector('.form-group.error');
      if (firstErrorGroup) {
        firstErrorGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });
})();


/* =============================================================================
   7. BACK-TO-TOP BUTTON
   — Shows the .back-to-top button after the user scrolls down 300 px.
   — Smooth-scrolls to the very top of the page when clicked.
============================================================================= */
(function initBackToTop() {
  /** @type {HTMLElement|null} */
  const backToTopBtn = document.querySelector('.back-to-top');

  if (!backToTopBtn) return;

  /**
   * Adds or removes the 'visible' class based on the current scroll position.
   * CSS transitions handle the opacity / transform change.
   */
  function handleBackToTopVisibility() {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  }

  // Run once on load in case the page is already scrolled.
  handleBackToTopVisibility();

  window.addEventListener('scroll', handleBackToTopVisibility, { passive: true });

  // Scroll to top when the button is clicked.
  backToTopBtn.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();


/* =============================================================================
   8. FOOTER YEAR AUTO-UPDATE
   — Writes the current four-digit year into #currentYear so the footer
     copyright notice stays accurate without manual updates.
============================================================================= */
(function initFooterYear() {
  /** @type {HTMLElement|null} */
  const yearEl = document.getElementById('currentYear');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }
})();


/* =============================================================================
   9. CODE-EDITOR CURSOR BLINK ANIMATION
   — Toggles a 'blink' class on the last line of the code editor every 530 ms.
   — This creates a blinking caret effect purely via CSS.
   — Skipped entirely when the user prefers reduced motion.
============================================================================= */
(function initCodeEditorAnimation() {
  // Skip animation when the OS accessibility setting is active.
  if (prefersReducedMotion) return;

  /**
   * The code editor is expected to contain elements with class 'code-line'.
   * We target the last one to simulate a cursor at the end of typed code.
   * @type {NodeList}
   */
  const codeLines = document.querySelectorAll('.code-line');

  if (!codeLines.length) return;

  /** @type {HTMLElement} */
  const lastLine = codeLines[codeLines.length - 1];

  // Ensure the last line has a cursor span; add one if the HTML omits it.
  let cursor = lastLine.querySelector('.cursor');
  if (!cursor) {
    cursor = document.createElement('span');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true'); // decorative — hide from SR
    lastLine.appendChild(cursor);
  }

  /**
   * Interval that toggles the 'blink' class, causing the CSS animation
   * (opacity toggle) to fire repeatedly.
   */
  let blinkState = true;
  setInterval(function () {
    blinkState = !blinkState;
    cursor.classList.toggle('blink', blinkState);
  }, 530);
})();


/* =============================================================================
   10. ACTIVE NAV-LINK DETECTION ON SCROLL
   — Watches the scroll position and highlights the nav link that corresponds
     to the section currently nearest the top of the viewport.
   — Uses a requestAnimationFrame flag to throttle the scroll handler and keep
     the main thread from being blocked on every scroll event.
   — Sections to track: home, about, skills, experience, projects, education,
     contact.
============================================================================= */
(function initActiveSectionDetection() {
  /**
   * List of section IDs to track, in document order.
   * Must match the id attributes of the <section> elements in index.html.
   */
  const SECTION_IDS = [
    'home',
    'about',
    'skills',
    'experience',
    'projects',
    'education',
    'contact'
  ];

  // Build arrays of section elements and their matching nav links.
  /** @type {HTMLElement[]} */
  const sections = SECTION_IDS
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean); // drop any IDs not present in the DOM

  /** @type {HTMLElement[]} */
  const navLinks = SECTION_IDS
    .map(function (id) {
      return document.querySelector('a[href="#' + id + '"]');
    })
    .filter(Boolean);

  if (!sections.length || !navLinks.length) return;

  /**
   * rAF throttle flag.
   * Set to true while a requestAnimationFrame callback is pending.
   * Prevents queuing multiple rAF calls per scroll burst.
   * @type {boolean}
   */
  let rafPending = false;

  /**
   * Determines which section is currently "active" — i.e., whose top edge is
   * at or just above the midpoint of the viewport — and updates nav links.
   */
  function updateActiveLink() {
    rafPending = false; // reset flag so the next scroll can queue a new rAF

    // The threshold is 40 % down the viewport (slightly above centre).
    // This makes the active link change feel natural as the user scrolls.
    const viewportThreshold = window.scrollY + window.innerHeight * 0.4;

    /**
     * Walk sections in reverse order; the last one whose top is at or above
     * the threshold wins (= the section currently filling most of the screen).
     * @type {number}
     */
    let activeIndex = 0; // default to 'home'

    for (let i = 0; i < sections.length; i++) {
      const sectionTop = sections[i].getBoundingClientRect().top + window.scrollY;
      if (sectionTop <= viewportThreshold) {
        activeIndex = i;
      }
    }

    // Apply 'active' to the matching link, remove from all others.
    navLinks.forEach(function (link, index) {
      if (index === activeIndex) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'true');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  /**
   * Scroll event listener — schedules updateActiveLink via requestAnimationFrame
   * so it runs at the next paint rather than synchronously on every scroll tick.
   */
  function onScroll() {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(updateActiveLink);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Run once on load so the correct link is highlighted immediately.
  updateActiveLink();
})();


/* =============================================================================
   INITIALISATION COMPLETE
   All modules are self-invoking IIFEs, so they run as soon as the browser
   parses this file. Place the <script> tag just before </body> in index.html
   so that all DOM elements are available when this script executes.
============================================================================= */
