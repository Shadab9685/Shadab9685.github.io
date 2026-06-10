/* ================================================================
   HERO.JS — Three.js 3D scene + GSAP entrance + interactions
   ================================================================ */

/* ── 0. PAGE LOADER + SCROLL RESTORE ──────────────────────────── */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

window.addEventListener('load', () => {
  window.scrollTo(0, 0);
  setTimeout(() => {
    const loader = document.getElementById('pageLoader');
    if (loader) loader.classList.add('hidden');
  }, 300);
});

/* ── 1. Typewriter ─────────────────────────────────────────────── */
const ROLES = [
  'Software Developer',
];

let roleIndex = 0;
let charIndex  = 0;
let isDeleting = false;
const typeEl = document.getElementById('typewriter');

function typeRole() {
  const current = ROLES[roleIndex];

  typeEl.textContent = current.slice(0, charIndex + 1);
  charIndex++;
  if (charIndex <= current.length) {
    setTimeout(typeRole, 85);
  }
}

/* ── 2. Three.js particle + geometry scene ─────────────────────── */
try { (function initThreeScene() {
  const canvas   = document.getElementById('heroCanvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 28);

  /* Ambient + directional lights */
  scene.add(new THREE.AmbientLight(0x6366f1, 0.4));
  const dirLight = new THREE.DirectionalLight(0x8b5cf6, 1.2);
  dirLight.position.set(10, 10, 5);
  scene.add(dirLight);
  const pLight1 = new THREE.PointLight(0x06b6d4, 1.5, 40);
  pLight1.position.set(-12, 6, 10);
  scene.add(pLight1);
  const pLight2 = new THREE.PointLight(0xa855f7, 1, 35);
  pLight2.position.set(12, -4, 8);
  scene.add(pLight2);

  /* ── Central rotating geometric object ── */
  const torusGeo  = new THREE.TorusKnotGeometry(4, 1.1, 180, 20, 2, 3);
  const torusMat  = new THREE.MeshPhongMaterial({
    color: 0x6366f1,
    emissive: 0x1e1b4b,
    specular: 0xa5b4fc,
    shininess: 80,
    wireframe: false,
    transparent: true,
    opacity: 0.75,
  });
  const torusMesh = new THREE.Mesh(torusGeo, torusMat);
  torusMesh.position.set(6, 0, 0);
  scene.add(torusMesh);

  /* Wireframe overlay */
  const torusWireMat = new THREE.MeshBasicMaterial({
    color: 0x8b5cf6,
    wireframe: true,
    transparent: true,
    opacity: 0.15,
  });
  const torusWire = new THREE.Mesh(torusGeo, torusWireMat);
  torusWire.position.copy(torusMesh.position);
  scene.add(torusWire);

  /* ── Floating icosahedra ── */
  const floaters = [];
  const icoColors = [0x6366f1, 0x8b5cf6, 0x06b6d4, 0xa855f7, 0xec4899];

  for (let i = 0; i < 18; i++) {
    const geo = new THREE.IcosahedronGeometry(Math.random() * 0.6 + 0.2, 0);
    const mat = new THREE.MeshPhongMaterial({
      color: icoColors[i % icoColors.length],
      emissive: icoColors[i % icoColors.length],
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: Math.random() * 0.4 + 0.3,
      wireframe: Math.random() > 0.5,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 25,
      (Math.random() - 0.5) * 12 - 4
    );
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    scene.add(mesh);
    floaters.push({
      mesh,
      speed: Math.random() * 0.004 + 0.001,
      amp:   Math.random() * 2 + 0.5,
      phase: Math.random() * Math.PI * 2,
    });
  }

  /* ── Particle field ── */
  const PARTICLE_COUNT = 1200;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors    = new Float32Array(PARTICLE_COUNT * 3);
  const sizes     = new Float32Array(PARTICLE_COUNT);

  const palette = [
    new THREE.Color(0x6366f1),
    new THREE.Color(0x8b5cf6),
    new THREE.Color(0x06b6d4),
    new THREE.Color(0xa855f7),
  ];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 80;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;

    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    sizes[i] = Math.random() * 1.5 + 0.3;
  }

  const partGeo = new THREE.BufferGeometry();
  partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  partGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  partGeo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  const partMat = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(partGeo, partMat);
  scene.add(particles);

  /* ── Ring decorations ── */
  const rings = [];
  [[8, 0.06, 0x6366f1], [11, 0.04, 0x8b5cf6], [14, 0.03, 0x06b6d4]].forEach(([r, t, c]) => {
    const geo  = new THREE.TorusGeometry(r, t, 2, 80);
    const mat  = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.12 });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.set(6, 0, 0);
    ring.rotation.x = Math.PI / 2.5;
    scene.add(ring);
    rings.push(ring);
  });

  /* ── Mouse reactive offset ── */
  const mouse3D = { x: 0, y: 0 };
  let particleTargetX = 0, particleTargetY = 0;
  let ringTiltX = Math.PI / 2.5, ringTiltY = 0;
  let ringTargetX = Math.PI / 2.5, ringTargetY = 0;

  window.addEventListener('mousemove', (e) => {
    mouse3D.x = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse3D.y = (e.clientY / window.innerHeight - 0.5) * 2;
    particleTargetX = (e.clientX / window.innerWidth  - 0.5) * 5;
    particleTargetY = -(e.clientY / window.innerHeight - 0.5) * 3;
    ringTargetX = Math.PI / 2.5 + mouse3D.y * 0.12;
    ringTargetY = mouse3D.x * 0.08;
  });

  /* ── Resize handler ── */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ── Render loop ── */
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.008;

    /* Torus knot */
    torusMesh.rotation.x += 0.004;
    torusMesh.rotation.y += 0.006;
    torusWire.rotation.copy(torusMesh.rotation);
    torusMesh.position.y = Math.sin(t * 0.7) * 0.8;
    torusWire.position.y = torusMesh.position.y;

    /* Camera mouse drift */
    camera.position.x += (mouse3D.x * 3 - camera.position.x) * 0.04;
    camera.position.y += (-mouse3D.y * 2 - camera.position.y) * 0.04;
    camera.lookAt(scene.position);

    /* Lights drift */
    pLight1.position.x = Math.sin(t * 0.5) * 14;
    pLight1.position.y = Math.cos(t * 0.3) * 8;
    pLight2.position.x = Math.cos(t * 0.4) * 12;
    pLight2.position.y = Math.sin(t * 0.6) * 6;

    /* Floaters */
    floaters.forEach(({ mesh, speed, amp, phase }) => {
      mesh.rotation.x += speed;
      mesh.rotation.y += speed * 1.3;
      mesh.position.y += Math.sin(t + phase) * 0.008 * amp;
    });

    /* Particles slow spin + mouse parallax */
    particles.rotation.y += 0.0005;
    particles.rotation.x += 0.0002;
    particles.position.x += (particleTargetX - particles.position.x) * 0.025;
    particles.position.y += (particleTargetY - particles.position.y) * 0.025;

    /* Rings – slow orbit + mouse tilt */
    ringTiltX += (ringTargetX - ringTiltX) * 0.04;
    ringTiltY += (ringTargetY - ringTiltY) * 0.04;
    rings.forEach((ring, i) => {
      ring.rotation.z += 0.003 * (i % 2 === 0 ? 1 : -1) * (0.7 + i * 0.15);
      ring.rotation.x = ringTiltX;
      ring.rotation.y = ringTiltY;
    });

    renderer.render(scene, camera);
  }

  animate();
})();
} catch (e) { console.warn('Three.js scene unavailable:', e.message); }

/* ── 3. Spotlight follow cursor ────────────────────────────────── */
const spotlight = document.getElementById('spotlight');
const cursor    = document.getElementById('cursor');
const follower  = document.getElementById('cursorFollower');

let mouseX = 0, mouseY = 0;
let follX  = 0, follY  = 0;

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';

  spotlight.style.left = mouseX + 'px';
  spotlight.style.top  = mouseY + 'px';
});

/* Smooth follower */
(function trackFollower() {
  follX += (mouseX - follX) * 0.1;
  follY += (mouseY - follY) * 0.1;
  follower.style.left = follX + 'px';
  follower.style.top  = follY + 'px';
  requestAnimationFrame(trackFollower);
})();

/* ── 4. Magnetic buttons ───────────────────────────────────────── */
document.querySelectorAll('.magnetic').forEach((btn) => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const dx   = (e.clientX - cx) * 0.3;
    const dy   = (e.clientY - cy) * 0.3;
    btn.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
  btn.addEventListener('mousedown', () => {
    btn.style.transform = '';
  });
});

/* ── 5. Navbar scroll effect ───────────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

/* ── 6. Counter animation ──────────────────────────────────────── */
function animateCounter(el, target, duration) {
  const start = performance.now();
  (function step(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(p * target);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target + (target === 99 ? '%' : '+');
  })(start);
}

/* ── 7. GSAP Entrance Sequence ─────────────────────────────────── */
window.addEventListener('load', () => {
  if (typeof gsap === 'undefined') return;

  /* Show navbar */
  navbar.classList.add('visible');

  /* Timeline */
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  /* Status badge */
  tl.to('#statusBadge', { opacity: 1, y: 0, duration: 0.6, delay: 0.3 })
    /* "Hi, I'm" label */
    .to('.hero-headline .line:first-child', { opacity: 1, y: 0, duration: 0.5 }, '-=0.2')
    /* Name */
    .to('.name-text', {
      opacity: 1, y: 0, scale: 1, duration: 0.85,
      ease: 'back.out(1.3)',
      onComplete: () => {
        typeRole();
        const nameEl = document.querySelector('.name-text');
        nameEl.classList.add('name-shimmer');
        setTimeout(() => nameEl.classList.remove('name-shimmer'), 1300);
      },
    }, '-=0.1')
    /* Role */
    .to('h2.hero-role', { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
    /* Description */
    .to('#heroDesc', { opacity: 1, y: 0, duration: 0.5 }, '-=0.2')
    /* Tech pills */
    .to('#techStack', { opacity: 1, y: 0, duration: 0.5 }, '-=0.2')
    .to('.tech-pill', {
      opacity: 1, y: 0, stagger: 0.08, duration: 0.4,
    }, '-=0.3')
    /* CTA buttons */
    .to('#heroCtas', { opacity: 1, y: 0, duration: 0.5 }, '-=0.2')
    .to('.btn', {
      opacity: 1, y: 0, stagger: 0.1, duration: 0.4,
    }, '-=0.3')
    /* Socials */
    .to('#heroSocials', { opacity: 1, y: 0, duration: 0.5 }, '-=0.2')
    /* Visual panel */
    .to('#heroVisual', { opacity: 1, x: 0, duration: 0.9, ease: 'power2.out' }, '-=0.8')
    /* Stat cards */
    .to('#stat1, #stat2, #stat3', {
      opacity: 1, x: 0, stagger: 0.15, duration: 0.6,
    }, '-=0.4');

  /* Set initial hidden states */
  gsap.set('#statusBadge', { y: 24 });
  gsap.set('.hero-headline .line:first-child', { y: 20 });
  gsap.set('.name-text', { y: 40, scale: 0.94 });
  gsap.set('h2.hero-role', { y: 20 });
  gsap.set('#heroDesc', { y: 20 });
  gsap.set('#techStack', { y: 20 });
  gsap.set('.tech-pill', { opacity: 0, y: 15 });
  gsap.set('#heroCtas', { y: 20 });
  gsap.set('.btn', { opacity: 0, y: 15 });
  gsap.set('#heroSocials', { y: 20 });
  gsap.set('#heroVisual', { x: 50 });
  gsap.set('#stat1, #stat2, #stat3', { opacity: 0, x: 30 });

  /* Counters start after stat cards appear */
  setTimeout(() => {
    document.querySelectorAll('.stat-number').forEach((el) => {
      animateCounter(el, parseInt(el.dataset.target), 1500);
    });
  }, 2800);

  /* Scroll indicator */
  document.getElementById('scrollIndicator').style.animation =
    'fadeInUp 0.8s ease 3.6s forwards';
});

/* ── 8. Panel parallax on mouse move ──────────────────────────── */
const panels = [
  { el: document.getElementById('panel1'), factor: 0.018 },
  { el: document.getElementById('panel2'), factor: -0.012 },
  { el: document.getElementById('panel3'), factor: 0.008 },
];

let panelMouseX = 0, panelMouseY = 0;

window.addEventListener('mousemove', (e) => {
  panelMouseX = e.clientX - window.innerWidth  / 2;
  panelMouseY = e.clientY - window.innerHeight / 2;
});

(function panelTick() {
  panels.forEach(({ el, factor }) => {
    if (!el || el.classList.contains('panel-top')) return;
    el.style.transform = `translateX(${panelMouseX * factor}px) translateY(${panelMouseY * factor}px)`;
  });
  requestAnimationFrame(panelTick);
})();

/* ── 9. Navbar active link on scroll ──────────────────────────── */
const sections  = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY + 120;
  sections.forEach((sec) => {
    if (scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight) {
      navLinks.forEach((l) => l.classList.remove('active'));
      const match = document.querySelector(`.nav-link[href="#${sec.id}"]`);
      if (match) match.classList.add('active');
    }
  });
});

/* ── 10. Mobile nav toggle ─────────────────────────────────────── */
const navToggle = document.getElementById('navToggle');
const navLinksList = document.querySelector('.nav-links');

const MOBILE_MENU_OPEN = 'display:flex;flex-direction:column;position:absolute;top:70px;left:0;right:0;background:rgba(3,7,18,0.96);padding:1.5rem;gap:1.5rem;backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.08);';

function closeMobileMenu() {
  navLinksList.style.cssText = '';
}

navToggle.addEventListener('click', () => {
  const open = navLinksList.style.display === 'flex';
  navLinksList.style.cssText = open ? '' : MOBILE_MENU_OPEN;
});

navLinksList.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMobileMenu);
});

/* ── 11. Scroll reveal (sections) ──────────────────────────────── */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

/* ── 12. Skill bar animation ───────────────────────────────────── */
const skillObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.skill-fill').forEach((bar) => {
          bar.style.width = bar.dataset.level + '%';
        });
        skillObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll('.skill-group').forEach((g) => skillObserver.observe(g));

/* ── 13. Contact form ──────────────────────────────────────────── */
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

const formError  = document.getElementById('formError');
const submitBtn  = document.getElementById('submitBtn');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').textContent = 'Sending...';

    try {
      const response = await fetch('https://formspree.io/f/xpqepjov', {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        contactForm.reset();
        formSuccess.style.display = 'block';
        setTimeout(() => { formSuccess.style.display = 'none'; }, 5000);
      } else {
        formError.style.display = 'block';
        setTimeout(() => { formError.style.display = 'none'; }, 5000);
      }
    } catch {
      formError.style.display = 'block';
      setTimeout(() => { formError.style.display = 'none'; }, 5000);
    }

    submitBtn.disabled = false;
    submitBtn.querySelector('.btn-text').textContent = 'Send Message';
  });
}

/* ── 14. ───────────────────────────────────────────────────────── */

/* ── 15. Scroll progress bar ───────────────────────────────────── */
const scrollProgress = document.getElementById('scrollProgress');

window.addEventListener('scroll', () => {
  const scrollTop    = window.scrollY;
  const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
  const pct          = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  scrollProgress.style.width = pct + '%';
});

/* ── 16. Back to top ───────────────────────────────────────────── */
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
  backToTop.classList.toggle('visible', window.scrollY > 400);
});

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ── 17. Card deck — auto-cycle + click to front ───────────────── */
const codePanels = document.querySelectorAll('.code-panel');
let deckIndex = 0;
let deckTimer;

function activatePanel(index) {
  codePanels.forEach(p => {
    p.classList.remove('panel-top');
    p.style.transform = '';
  });
  if (codePanels[index]) codePanels[index].classList.add('panel-top');
  deckIndex = index;
}

function startDeckCycle() {
  deckTimer = setInterval(() => {
    activatePanel((deckIndex + 1) % codePanels.length);
  }, 2800);
}

activatePanel(0);
startDeckCycle();

codePanels.forEach((panel, i) => {
  panel.addEventListener('click', () => {
    clearInterval(deckTimer);
    activatePanel(i);
    startDeckCycle();
  });
});
