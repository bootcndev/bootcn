(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.confetti) return; // already loaded: idempotent

  let listening = false;

  function themeColors() {
    const style = getComputedStyle(document.documentElement);
    const colors = [1, 2, 3, 4, 5]
      .map(function (i) {
        return style.getPropertyValue('--bootcn-chart-' + i).trim();
      })
      .filter(Boolean);
    return colors.length ? colors : ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'];
  }

  // Returns false when nothing is drawn (reduced motion).
  function confetti(options) {
    const o = Object.assign(
      {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        particles: 120,
        spread: 70,
        colors: null,
      },
      options || {},
    );
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    const canvas = document.createElement('canvas');
    canvas.className = 'bootcn-confetti';
    canvas.setAttribute('aria-hidden', 'true');
    const ratio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      canvas.remove();
      return false;
    }
    ctx.scale(ratio, ratio);
    const colors = o.colors || themeColors();
    const spread = (o.spread * Math.PI) / 180;
    const pieces = [];
    for (let i = 0; i < o.particles; i += 1) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
      const speed = 6 + Math.random() * 7;
      pieces.push({
        x: o.x,
        y: o.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 5,
        color: colors[i % colors.length],
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        shape: i % 3,
      });
    }
    const start = performance.now();
    const life = 2600;
    function frame(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const fade = Math.max(0, 1 - Math.max(0, elapsed - life * 0.6) / (life * 0.4));
      pieces.forEach(function (p) {
        p.vx *= 0.985;
        p.vy = p.vy * 0.985 + 0.28;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        if (p.shape === 0) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / (p.shape === 1 ? 2 : 1.2));
        }
        ctx.restore();
      });
      if (elapsed < life) requestAnimationFrame(frame);
      else canvas.remove();
    }
    requestAnimationFrame(frame);
    document.dispatchEvent(new CustomEvent('bootcn:confetti', { detail: { x: o.x, y: o.y } }));
    return true;
  }

  // data-bootcn-confetti on a button: a burst from its centre.
  function onClick(event) {
    const trigger = event.target.closest && event.target.closest('[data-bootcn-confetti]');
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const drawn = confetti({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      particles: Number(trigger.getAttribute('data-particles')) || undefined,
      spread: Number(trigger.getAttribute('data-spread')) || undefined,
    });
    const status = document.querySelector('[data-bootcn-confetti-status]');
    if (status)
      status.textContent = drawn ? 'Celebrating!' : 'Celebrating! (no animation: reduced motion)';
  }

  function init() {
    if (listening) return;
    document.addEventListener('click', onClick);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    listening = false;
  }

  confetti.init = init;
  confetti.destroy = destroy;
  ns.confetti = confetti;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
