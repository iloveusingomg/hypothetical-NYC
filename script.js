(function spawnParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  function createParticle() {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 3 + 1;
    const dur  = Math.random() * 12 + 8;
    const del  = Math.random() * 6;
    p.style.cssText = [
      `width:${size}px`,
      `height:${size}px`,
      `left:${Math.random() * 100}%`,
      `bottom:-10px`,
      `animation-duration:${dur}s`,
      `animation-delay:${del}s`
    ].join(';');
    container.appendChild(p);
    setTimeout(() => p.remove(), (dur + del) * 1000 + 500);
  }

  for (let i = 0; i < 32; i++) createParticle();
  setInterval(() => { if (container.children.length < 48) createParticle(); }, 520);
})();

const cursorGlow = document.createElement('div');
cursorGlow.style.cssText = [
  'position:fixed', 'pointer-events:none', 'z-index:50',
  'width:340px', 'height:340px', 'border-radius:50%',
  'background:radial-gradient(circle,rgba(200,151,58,.07) 0%,transparent 70%)',
  'transform:translate(-50%,-50%)',
  'transition:opacity .4s',
  'opacity:0',
  'top:-400px', 'left:-400px'
].join(';');
document.body.appendChild(cursorGlow);

const pageGate = document.getElementById('page-gate');
document.addEventListener('mousemove', e => {
  if (!pageGate.classList.contains('active')) return;
  cursorGlow.style.left = e.clientX + 'px';
  cursorGlow.style.top  = e.clientY + 'px';
});
pageGate.addEventListener('mouseenter', () => cursorGlow.style.opacity = '1');
pageGate.addEventListener('mouseleave', () => cursorGlow.style.opacity = '0');

const PASSWORD   = 'OMG';
const input      = document.getElementById('password-input');
const btn        = document.getElementById('gate-btn');
const errorEl    = document.getElementById('gate-error');
const pageLetter = document.getElementById('page-letter');

function showError() {
  const wrapper = input.closest('.password-wrapper');
  wrapper.classList.remove('shake');
  void wrapper.offsetWidth; // force reflow so animation restarts
  wrapper.classList.add('shake');
  input.style.borderBottomColor = '#c4788a';
  errorEl.classList.add('show');
  setTimeout(() => { input.style.borderBottomColor = ''; }, 800);
  setTimeout(() => errorEl.classList.remove('show'), 3000);
}

function tryUnlock() {
  if (input.value.trim().toUpperCase() === PASSWORD) {
    btn.disabled   = true;
    input.disabled = true;
    runTransition();
  } else {
    showError();
    input.value = '';
    input.focus();
  }
}

btn.addEventListener('click', tryUnlock);
input.addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });
input.addEventListener('input',   () => errorEl.classList.remove('show'));

function runTransition() {
  const canvas = document.getElementById('transition-canvas');
  const ctx    = canvas.getContext('2d');

  // Size canvas to viewport
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const maxR = Math.hypot(cx, cy) + 10; // radius to fully cover screen

  canvas.style.display  = 'block';
  canvas.style.pointerEvents = 'all';

  // ── Burst particles spawned at unlock moment ──────────────
  const SYMS   = ['✿', '❀', '✾', '✦', '✧', '❋', '♡'];
  const COLORS = ['#c8973a', '#e8c06a', '#c4788a', '#8a3e50', '#f5e9d3'];
  const particles = [];
  const PARTICLE_COUNT = 70;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.2;
    const speed = Math.random() * 5 + 2.5;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      size: Math.random() * 18 + 10,
      sym: SYMS[Math.floor(Math.random() * SYMS.length)],
      col: COLORS[Math.floor(Math.random() * COLORS.length)],
      spin: (Math.random() - .5) * .15,
      angle: Math.random() * Math.PI * 2,
      gravity: Math.random() * .08 + .02
    });
  }

  // ── Quote text lines ───────────────────────────────────────
  const quoteLines = ['a letter', 'just for you', '✦'];
  let quoteAlpha = 0;

  // ── Timing helpers ─────────────────────────────────────────
  const start = performance.now();

  // Ease functions
  function easeInOutQuart(t) {
    return t < .5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }
  function easeInExpo(t) {
    return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
  }
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  // Timeline milestones (ms)
  const T = {
    inkFillEnd:    700,
    burstEnd:     1800,
    quoteIn:      1900,
    quoteHold:    2600,
    quoteOut:     2900,
    pageSwitch:   2700,
    openStart:    3000,
    openEnd:      4400
  };

  let pageSwitched = false;

  // ── Main render loop ───────────────────────────────────────
  function frame(now) {
    const elapsed = now - start;

    ctx.clearRect(0, 0, W, H);

    // ── 1. Dark ink flood (circle expands from center) ──────
    let inkAlpha = 1;
    let inkRadius = maxR;

    if (elapsed < T.inkFillEnd) {
      // Expanding in
      const t = easeInOutQuart(clamp01(elapsed / T.inkFillEnd));
      inkRadius = t * maxR;
      inkAlpha  = 1;
    } else if (elapsed >= T.openStart && elapsed <= T.openEnd) {
      // Iris-wipe opening (circle shrinks back)
      const t = easeOutExpo(clamp01((elapsed - T.openStart) / (T.openEnd - T.openStart)));
      inkRadius = (1 - t) * maxR;
      inkAlpha  = 1;
    } else if (elapsed > T.openEnd) {
      inkRadius = 0;
      inkAlpha  = 0;
    }

    if (inkAlpha > 0 && inkRadius > 0) {
      // Draw dark parchment disc
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, inkRadius);
      grad.addColorStop(0,   '#1a0f07');
      grad.addColorStop(.6,  '#120a04');
      grad.addColorStop(.92, '#0d0804');
      grad.addColorStop(1,   'rgba(13,8,4,0)');

      ctx.save();
      ctx.globalAlpha = inkAlpha;
      ctx.beginPath();
      ctx.arc(cx, cy, inkRadius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // Subtle gold ring at edge of disc
      if (inkRadius > 10 && inkRadius < maxR * .98) {
        ctx.save();
        ctx.globalAlpha = inkAlpha * .55;
        ctx.beginPath();
        ctx.arc(cx, cy, inkRadius - 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#c8973a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
    }

    // ── 2. Burst particles ──────────────────────────────────
    if (elapsed > T.inkFillEnd * .5 && elapsed < T.burstEnd) {
      const age = elapsed - T.inkFillEnd * .5;
      const life = T.burstEnd - T.inkFillEnd * .5;

      particles.forEach(p => {
        // Update position proportional to elapsed
        const dt = 1; // treat as fixed step for simplicity
        p.x     += p.vx * dt;
        p.y     += p.vy * dt;
        p.vy    += p.gravity * dt;
        p.angle += p.spin;
        p.alpha  = clamp01(1 - (age / life) * 1.3);

        if (p.alpha <= 0) return;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = p.col;
        ctx.font        = `${p.size}px serif`;
        ctx.textAlign   = 'center';
        ctx.textBaseline= 'middle';
        ctx.fillText(p.sym, 0, 0);
        ctx.restore();
      });
    }

    // ── 3. Quote text ───────────────────────────────────────
    if (elapsed >= T.quoteIn && elapsed < T.openStart) {
      if (elapsed < T.quoteHold) {
        quoteAlpha = clamp01((elapsed - T.quoteIn) / 400);
      } else {
        quoteAlpha = clamp01(1 - (elapsed - T.quoteHold) / (T.quoteOut - T.quoteHold));
      }

      ctx.save();
      ctx.globalAlpha = quoteAlpha;
      ctx.textAlign   = 'center';
      ctx.textBaseline= 'middle';

      // Line 1 — "a letter"
      ctx.font        = 'italic 400 2.8rem "Playfair Display", serif';
      ctx.fillStyle   = '#f5e9d3';
      ctx.fillText(quoteLines[0], cx, cy - 44);

      // Line 2 — "just for you"
      ctx.font        = 'italic 400 2.2rem "Cormorant Garamond", serif';
      ctx.fillStyle   = '#e8c06a';
      ctx.fillText(quoteLines[1], cx, cy + 4);

      // Line 3 — star
      ctx.font        = '1.1rem serif';
      ctx.fillStyle   = '#c8973a';
      ctx.fillText(quoteLines[2], cx, cy + 44);

      ctx.restore();
    }

    // ── 4. Page switch (hidden under full ink) ──────────────
    if (!pageSwitched && elapsed >= T.pageSwitch) {
      pageSwitched = true;
      pageGate.classList.remove('active');
      pageLetter.classList.add('visible');
      initLetterPage();
    }

    // ── 5. Done — hide canvas ───────────────────────────────
    if (elapsed > T.openEnd + 200) {
      canvas.style.display       = 'none';
      canvas.style.pointerEvents = 'none';
      return; // stop RAF loop
    }

    requestAnimationFrame(frame);
  }

  // Fade gate page out first, then kick off loop
  pageGate.style.transition = 'opacity .35s ease';
  pageGate.style.opacity    = '0';
  setTimeout(() => requestAnimationFrame(frame), 100);
}

function initLetterPage() {
  // Small delay so the page is visible before animating
  setTimeout(() => {
    enterLetterPaper();
    startPetalCanvas();
    startSparkles();
    drawVines();
    initScrollReveal();
    showMusicPlayer();
  }, 200);
}

// Paper slides up into view
function enterLetterPaper() {
  const paper = document.getElementById('letter-paper');
  if (!paper) return;
  setTimeout(() => paper.classList.add('enter'), 100);
}

function startPetalCanvas() {
  const canvas = document.getElementById('petals-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const SYMBOLS = ['✿', '❀', '✾', '❋', '✦', '✧', '♡'];
  const COLORS  = ['#c4788a', '#8a3e50', '#c8973a', '#e8c06a', '#7a9e8a'];

  class Petal {
    constructor(init = false) { this.reset(init); }
    reset(init = false) {
      this.x        = Math.random() * canvas.width;
      this.y        = init ? Math.random() * canvas.height * -1 : -30;
      this.vy       = Math.random() * 1.1 + 0.35;
      this.vx       = (Math.random() - .5) * .55;
      this.size     = Math.random() * 13 + 8;
      this.rot      = Math.random() * Math.PI * 2;
      this.vr       = (Math.random() - .5) * .025;
      this.alpha    = Math.random() * .32 + .07;
      this.sym      = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      this.col      = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.wave     = Math.random() * Math.PI * 2;
      this.waveAmp  = Math.random() * .75 + .2;
      this.waveFreq = Math.random() * .02 + .008;
    }
    update() {
      this.wave += this.waveFreq;
      this.x    += this.vx + Math.sin(this.wave) * this.waveAmp;
      this.y    += this.vy;
      this.rot  += this.vr;
      if (this.y > canvas.height + 30) this.reset();
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.globalAlpha  = this.alpha;
      ctx.fillStyle    = this.col;
      ctx.font         = `${this.size}px serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.sym, 0, 0);
      ctx.restore();
    }
  }

  const petals = Array.from({ length: 40 }, () => new Petal(true));

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    petals.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
}

function startSparkles() {
  const layer = document.getElementById('sparkle-layer');
  if (!layer) return;
  const SYMS = ['✦', '✧', '★', '✶', '✸', '❋', '✿'];

  function spawn() {
    const s   = document.createElement('div');
    s.className = 'sparkle';
    const dur   = Math.random() * 3 + 2;
    s.textContent = SYMS[Math.floor(Math.random() * SYMS.length)];
    s.style.cssText = [
      `left:${Math.random() * 100}%`,
      `top:${Math.random() * 100}%`,
      `font-size:${Math.random() * 10 + 5}px`,
      `animation-duration:${dur}s`,
      `animation-delay:${Math.random() * 2}s`
    ].join(';');
    layer.appendChild(s);
    setTimeout(() => s.remove(), (dur + 2.5) * 1000);
  }

  for (let i = 0; i < 18; i++) spawn();
  setInterval(() => { if (layer.children.length < 28) spawn(); }, 650);
}

function drawVines() {
  document.querySelectorAll('.vine-path').forEach((path, i) => {
    setTimeout(() => path.classList.add('drawn'), i * 180 + 400);
  });
}

function initScrollReveal() {
  const paras = document.querySelectorAll('.reveal-p');
  if (!paras.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  paras.forEach((p, i) => {
    // Stagger initial paragraphs that are already in view
    setTimeout(() => {
      const rect = p.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        p.classList.add('visible');
      } else {
        io.observe(p);
      }
    }, 500 + i * 130);
  });
}

function showMusicPlayer() {
  const player    = document.getElementById('music-player');
  const audio     = document.getElementById('bg-audio');
  const toggleBtn = document.getElementById('music-toggle');
  const iconPlay  = toggleBtn.querySelector('.icon-play');
  const iconPause = toggleBtn.querySelector('.icon-pause');
  const disc      = document.getElementById('music-disc');
  const bars      = player.querySelector('.music-bars');

  // Slide in after a beat
  setTimeout(() => player.classList.add('show'), 1000);

  let playing = false;

  function setPlaying(state) {
    playing = state;
    if (state) {
      iconPlay.style.display  = 'none';
      iconPause.style.display = 'block';
      disc.classList.add('spinning');
      bars.classList.add('active');
      audio.play().catch(() => {}); // silently ignore autoplay block
    } else {
      iconPlay.style.display  = 'block';
      iconPause.style.display = 'none';
      disc.classList.remove('spinning');
      bars.classList.remove('active');
      audio.pause();
    }
  }

  toggleBtn.addEventListener('click', () => setPlaying(!playing));

  // Attempt autoplay when audio is ready
  audio.addEventListener('canplay', () => {
    if (!playing) setPlaying(true);
  }, { once: true });

  audio.load();
}