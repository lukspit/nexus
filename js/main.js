/* ============================================
   NEXUS V2 — MAIN JAVASCRIPT
   Neural animations, counters, calculator,
   FAQ, form, scroll reveals
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ============================================
  // 1. NEURAL NETWORK BACKGROUND (Canvas)
  // ============================================
  const canvas = document.getElementById('heroCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    let mouse = { x: null, y: null };
    let animationId;

    function resizeCanvas() {
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    }

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 2.5 + 0.5;
        this.baseAlpha = Math.random() * 0.5 + 0.3;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6, 182, 212, ${this.baseAlpha})`;
        ctx.fill();
      }
    }

    function initParticles() {
      particles = [];
      const count = window.innerWidth < 768 ? 35 : 65;
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const alpha = (1 - dist / 160) * 0.4;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
        // Mouse interaction
        if (mouse.x !== null) {
          const dx = particles[i].x - mouse.x;
          const dy = particles[i].y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            const alpha = (1 - dist / 200) * 0.6;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }
    }

    function animateCanvas() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => { p.update(); p.draw(); });
      drawConnections();
      animationId = requestAnimationFrame(animateCanvas);
    }

    window.addEventListener('resize', () => {
      resizeCanvas();
      initParticles();
    });

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    resizeCanvas();
    initParticles();
    animateCanvas();
  }

  // ============================================
  // 2. REAL-TIME LOSS COUNTER
  // ============================================
  const lossCounterEl = document.getElementById('lossCounter');
  if (lossCounterEl) {
    const lossPerSecond = 300000 / (365 * 24 * 3600); // R$300k/year in seconds
    let lossAccumulated = 0;
    let lastTime = performance.now();

    function updateLossCounter(now) {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      lossAccumulated += delta * lossPerSecond;
      lossCounterEl.textContent = 'R$ ' + lossAccumulated.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      requestAnimationFrame(updateLossCounter);
    }
    requestAnimationFrame(updateLossCounter);
  }

  // ============================================
  // 3. ANIMATED NUMBER COUNTERS
  // ============================================
  function animateCounter(el, target, duration, prefix, suffix, decimals) {
    let start = 0;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * eased;

      let formatted;
      if (decimals > 0) {
        formatted = current.toLocaleString('pt-BR', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
      } else {
        formatted = Math.round(current).toLocaleString('pt-BR');
      }

      el.textContent = (prefix || '') + formatted + (suffix || '');

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  // ============================================
  // 4. SCROLL REVEAL + COUNTER TRIGGER
  // ============================================
  const revealElements = document.querySelectorAll('.reveal');
  const counterElements = document.querySelectorAll('[data-target]');
  const animatedCounters = new Set();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');

        // Check if this element or its children have data-target
        const counters = entry.target.querySelectorAll('[data-target]');
        if (entry.target.hasAttribute('data-target')) {
          triggerCounter(entry.target);
        }
        counters.forEach(c => triggerCounter(c));
      }
    });
  }, { threshold: 0.15 });

  function triggerCounter(el) {
    if (animatedCounters.has(el)) return;
    animatedCounters.add(el);

    const target = parseFloat(el.dataset.target);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const decimals = parseInt(el.dataset.decimals) || 0;
    animateCounter(el, target, 2000, prefix, suffix, decimals);
  }

  revealElements.forEach(el => observer.observe(el));
  counterElements.forEach(el => {
    if (!el.closest('.reveal')) observer.observe(el);
  });

  // ============================================
  // 5. NAVBAR SCROLL EFFECT
  // ============================================
  const navbar = document.getElementById('navbar');
  let lastScrollY = 0;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScrollY = scrollY;
  }, { passive: true });

  // ============================================
  // 6. MOBILE HAMBURGER MENU
  // ============================================
  const hamburger = document.getElementById('navHamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
      });
    });
  }

  // ============================================
  // 7. SMOOTH SCROLL FOR NAV LINKS
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = navbar.offsetHeight;
        const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
      }
    });
  });

  // ============================================
  // 8. ROI CALCULATOR
  // ============================================
  const calcInputs = ['calcDoctors', 'calcTicket', 'calcNoShows', 'calcLeads'];
  const NEXUS_PRICE = 1497;

  function formatBRL(value) {
    return 'R$ ' + Math.round(value).toLocaleString('pt-BR');
  }

  function updateCalculator() {
    const doctors = parseFloat(document.getElementById('calcDoctors').value) || 0;
    const ticket = parseFloat(document.getElementById('calcTicket').value) || 0;
    const noShows = parseFloat(document.getElementById('calcNoShows').value) || 0;
    const leads = parseFloat(document.getElementById('calcLeads').value) || 0;

    // Loss calculations
    const lossNoShowsMonth = noShows * ticket * 4.3;
    const lossLeadsMonth = leads * 0.30 * 30 * ticket * 0.15;
    const lossTotalMonth = lossNoShowsMonth + lossLeadsMonth;
    const lossTotalYear = lossTotalMonth * 12;

    // Recovery calculations
    const recoveryMonth = lossTotalMonth * 0.73;
    const netReturnMonth = recoveryMonth - NEXUS_PRICE;
    const recoveryYear = netReturnMonth * 12;
    const roiPercent = NEXUS_PRICE > 0 ? Math.round((recoveryMonth / NEXUS_PRICE - 1) * 100) : 0;
    const paybackDays = recoveryMonth > 0 ? Math.round(NEXUS_PRICE / (recoveryMonth / 30)) : 0;

    // Update DOM
    document.getElementById('lossNoShows').textContent = formatBRL(lossNoShowsMonth);
    document.getElementById('lossLeads').textContent = formatBRL(lossLeadsMonth);
    document.getElementById('lossTotalMonth').textContent = formatBRL(lossTotalMonth);
    document.getElementById('lossTotalYear').textContent = formatBRL(lossTotalYear);
    document.getElementById('recoveryMonth').textContent = formatBRL(recoveryMonth);
    // Net return removed from UI for simplicity
    document.getElementById('recoveryYear').textContent = formatBRL(Math.max(0, recoveryYear));
    document.getElementById('roiPercent').textContent = Math.max(0, roiPercent) + '%';
    document.getElementById('paybackDays').textContent = paybackDays + ' dias';

    // Update CTA with dynamic value
    const calcCta = document.getElementById('calcCta');
    if (calcCta && recoveryYear > 0) {
      calcCta.textContent = `Quero Recuperar ${formatBRL(recoveryYear)}/ano - Solicitar Diagnostico`;
    }
  }

  calcInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateCalculator);
    }
  });

  // Initial calculation
  updateCalculator();

  // ============================================
  // 9. FAQ ACCORDION
  // ============================================
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all
      faqItems.forEach(i => {
        i.classList.remove('active');
        i.querySelector('.faq-answer').style.maxHeight = '0';
      });

      // Open clicked (if wasn't already open)
      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // ============================================
  // 10. MULTI-STEP FORM
  // ============================================
  const form = document.getElementById('diagnosticForm');
  const steps = form ? form.querySelectorAll('.form-step') : [];
  const stepDots = document.querySelectorAll('.form-step-dot');
  const stepLines = document.querySelectorAll('.form-step-line');
  let currentStep = 1;

  function showStep(stepNum) {
    steps.forEach(s => s.classList.remove('active'));
    const target = form.querySelector(`.form-step[data-step="${stepNum}"]`);
    if (target) target.classList.add('active');

    // Update step indicators
    stepDots.forEach(dot => {
      const dotStep = parseInt(dot.dataset.step);
      dot.classList.remove('active', 'completed');
      if (dotStep === stepNum) dot.classList.add('active');
      if (dotStep < stepNum) dot.classList.add('completed');
    });

    stepLines.forEach((line, idx) => {
      line.classList.remove('completed');
      if (idx + 1 < stepNum) line.classList.add('completed');
    });

    currentStep = stepNum;
  }

  // Next buttons
  document.querySelectorAll('.form-btn-next').forEach(btn => {
    btn.addEventListener('click', () => {
      const nextStep = parseInt(btn.dataset.next);
      // Basic validation for current step
      const currentStepEl = form.querySelector(`.form-step[data-step="${currentStep}"]`);
      const requiredInputs = currentStepEl.querySelectorAll('[required]');
      let valid = true;

      requiredInputs.forEach(inp => {
        if (!inp.value || inp.value.trim() === '') {
          valid = false;
          inp.style.borderColor = '#EF4444';
          setTimeout(() => { inp.style.borderColor = ''; }, 2000);
        }
      });

      if (valid) showStep(nextStep);
    });
  });

  // Back buttons
  document.querySelectorAll('.form-btn-back').forEach(btn => {
    btn.addEventListener('click', () => {
      const prevStep = parseInt(btn.dataset.back);
      showStep(prevStep);
    });
  });

  // Submit
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Collect form data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      // Simple success feedback
      form.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <div style="width: 80px; height: 80px; margin: 0 auto 24px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); display: flex; align-items: center; justify-content: center;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h3 style="font-family: 'Space Grotesk', sans-serif; margin-bottom: 12px;">Diagnostico Solicitado com Sucesso!</h3>
          <p style="color: #94A3B8; line-height: 1.7; max-width: 400px; margin: 0 auto;">
            Obrigado, <strong style="color: #F8F9FA;">${data.fullName || 'Doutor(a)'}</strong>!
            Seu diagnostico personalizado esta sendo gerado. Voce recebera uma mensagem no WhatsApp em ate 2 horas.
          </p>
          <div style="margin-top: 32px; display: flex; flex-direction: column; gap: 12px; max-width: 300px; margin-left: auto; margin-right: auto;">
            <div style="display: flex; align-items: center; gap: 12px; font-size: 0.9rem; color: #94A3B8;">
              <span style="color: #10B981; font-weight: 700;">01</span>
              <span>Confirmacao no WhatsApp (agora)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; font-size: 0.9rem; color: #94A3B8;">
              <span style="color: #10B981; font-weight: 700;">02</span>
              <span>Analise dos dados (ate 2 horas)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; font-size: 0.9rem; color: #94A3B8;">
              <span style="color: #10B981; font-weight: 700;">03</span>
              <span>Relatorio personalizado (ate 24 horas)</span>
            </div>
          </div>
        </div>
      `;
    });
  }

  // ============================================
  // 6. MAGNETIC BUTTONS (Desktop Only)
  // ============================================
  const magneticButtons = document.querySelectorAll('.magnetic-btn');

  if (window.matchMedia("(min-width: 1024px)").matches) {
    magneticButtons.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const strength = btn.dataset.strength || 30;

        // Subtle magnetic pull
        btn.style.transform = `translate(${x / 5}px, ${y / 5}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
      });
    });
  }

  // ============================================
  // 7. TEXT ROLL EFFECT (Hero Numbers)
  // ============================================
  const rollElements = document.querySelectorAll('.hero-stat-value');

  if (rollElements.length > 0) {
    // Only roll once when in view
    const rollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const targetVal = el.getAttribute('data-target');
          const suffix = el.getAttribute('data-suffix') || '';

          // Create roll structure
          el.innerHTML = `
            <span class="text-roll-wrapper">
              <span class="text-roll-item">0${suffix}</span>
              <span class="text-roll-item">${targetVal}${suffix}</span>
            </span>
          `;

          // Add animation class to the second item via CSS (already defined)
          // Just let the CSS animation run naturally

          rollObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    rollElements.forEach(el => rollObserver.observe(el));
  }

  // ============================================
  // 8. BENTO GLOW EFFECT (Mouse Tracking)
  // ============================================
  const bentoCards = document.querySelectorAll('.bento-card');

  bentoCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--x', `${x}px`);
      card.style.setProperty('--y', `${y}px`);
    });
  });

});
