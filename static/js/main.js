/* ===================================================================
   AFRINOVA — Interactions
   =================================================================== */
(function () {
  'use strict';

  /* ---- Header au scroll ---- */
  const header = document.querySelector('.site-header');
  const toTop = document.getElementById('toTop');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 10);
    toTop.classList.toggle('show', y > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Remonter en haut (défilement fiable, indépendant de l'ancre) ---- */
  if (toTop) {
    toTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---- Menu mobile ---- */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const closeNav = () => { nav.classList.remove('open'); burger.classList.remove('open'); };
  burger.addEventListener('click', () => {
    nav.classList.toggle('open');
    burger.classList.toggle('open');
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));

  /* ---- Reveal au scroll ---- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el, i) => {
      el.style.transitionDelay = (i % 4) * 80 + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  /* ---- Compteurs animés ---- */
  const counters = document.querySelectorAll('.stat-num');
  const animateCount = (el) => {
    const target = +el.dataset.target;
    const dur = 1600;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target).toLocaleString('fr-FR');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && counters.length) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => co.observe(c));
  }

  /* ---- Filtre des réalisations ---- */
  const filters = document.getElementById('filters');
  const workCards = document.querySelectorAll('.work-card');
  if (filters) {
    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      filters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      workCards.forEach((card) => {
        const show = f === 'all' || card.dataset.cat === f;
        card.classList.toggle('hide', !show);
      });
    });
  }

  /* ---- Formulaire de contact ---- */
  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const el = form.elements;
      const val = (n) => (el[n] && el[n].value || '').trim();
      const btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; }
      try {
        // Envoie le devis au backend (visible dans l'espace admin)
        await AfrinovaAPI.post('/devis/', {
          name: val('name'), email: val('email'), phone: val('phone'),
          service: val('service'), message: val('message')
        });
        note.hidden = false;
        form.reset();
        note.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => { note.hidden = true; }, 6000);
      } catch (err) {
        alert("Échec de l'envoi : " + err.message + "\nLe serveur AFRINOVA est-il démarré ?");
      } finally {
        if (btn) { btn.disabled = false; }
      }
    });
  }

  /* ---- Année du footer ---- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
