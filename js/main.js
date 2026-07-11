import * as THREE from '../assets/vendor/three/three.module.js';

function initHeroParticles() {
  const container = document.getElementById('hero-canvas');
  if (!container || !window.WebGLRenderingContext) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const mouse = new THREE.Vector2(0, 0);
  const clock = new THREE.Clock();

  const particleCount = 10000;
  const positions = new Float32Array(particleCount * 3);
  const originalPositions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);

  const torusKnot = new THREE.TorusKnotGeometry(1.5, 0.5, 200, 32);
  const knotPositions = torusKnot.attributes.position;

  for (let i = 0; i < particleCount; i++) {
    const vertexIndex = i % knotPositions.count;
    const x = knotPositions.getX(vertexIndex);
    const y = knotPositions.getY(vertexIndex);
    const z = knotPositions.getZ(vertexIndex);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    originalPositions[i * 3] = x;
    originalPositions[i * 3 + 1] = y;
    originalPositions[i * 3 + 2] = z;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 0.02,
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  function onPointerMove(event) {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
  window.addEventListener('mousemove', onPointerMove);

  const posAttr = geometry.attributes.position;

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    const mouseWorldX = mouse.x * 3;
    const mouseWorldY = mouse.y * 3;

    for (let i = 0; i < particleCount; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      const dx = positions[ix] - mouseWorldX;
      const dy = positions[iy] - mouseWorldY;
      const dz = positions[iz];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 1.5 && dist > 0.0001) {
        const force = ((1.5 - dist) * 0.01) / dist;
        velocities[ix] += dx * force;
        velocities[iy] += dy * force;
        velocities[iz] += dz * force;
      }

      velocities[ix] += (originalPositions[ix] - positions[ix]) * 0.001;
      velocities[iy] += (originalPositions[iy] - positions[iy]) * 0.001;
      velocities[iz] += (originalPositions[iz] - positions[iz]) * 0.001;

      velocities[ix] *= 0.95;
      velocities[iy] *= 0.95;
      velocities[iz] *= 0.95;

      positions[ix] += velocities[ix];
      positions[iy] += velocities[iy];
      positions[iz] += velocities[iz];
    }

    posAttr.needsUpdate = true;
    points.rotation.y = elapsed * 0.05;
    renderer.render(scene, camera);
  }
  animate();

  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  window.addEventListener('resize', onResize);
}

function revealHero() {
  const words = document.querySelectorAll('.hero .reveal-word');
  words.forEach((el, i) => {
    el.style.transitionDelay = `${0.6 + i * 0.08}s`;
  });

  const fades = document.querySelectorAll('.hero .reveal-fade');
  fades.forEach((el, i) => {
    el.style.transitionDelay = `${0.6 + words.length * 0.08 + i * 0.15}s`;
  });

  requestAnimationFrame(() => {
    document.querySelectorAll('.hero .reveal-word, .hero .reveal-fade').forEach((el) => {
      el.classList.add('is-visible');
    });
  });
}

function initScratchReveal() {
  document.querySelectorAll('.dor-visual').forEach((container) => {
    const canvas = container.querySelector('.dor-visual__canvas');
    const hint = container.querySelector('.dor-visual__hint');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const topSrc = container.dataset.top;
    const topImg = new Image();
    let topLoaded = false;

    function drawImageCover(img, dWidth, dHeight) {
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const destRatio = dWidth / dHeight;
      let sx, sy, sWidth, sHeight;
      if (imgRatio > destRatio) {
        sHeight = img.naturalHeight;
        sWidth = sHeight * destRatio;
        sx = (img.naturalWidth - sWidth) / 2;
        sy = 0;
      } else {
        sWidth = img.naturalWidth;
        sHeight = sWidth / destRatio;
        sx = 0;
        sy = (img.naturalHeight - sHeight) / 2;
      }
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, dWidth, dHeight);
    }

    function drawTop() {
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (topLoaded) {
        drawImageCover(topImg, canvas.width, canvas.height);
        return;
      }
      ctx.fillStyle = '#3a3432';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.textAlign = 'center';
      ctx.font = '16px Montserrat, sans-serif';
      ctx.fillText('Sketch / rascunho aqui', canvas.width / 2, canvas.height / 2 - 10);
      ctx.font = '12px monospace';
      ctx.fillText(topSrc || 'assets/img/dor/sketch.jpg', canvas.width / 2, canvas.height / 2 + 14);
    }

    if (topSrc) {
      topImg.src = topSrc;
      topImg.onload = () => {
        topLoaded = true;
        drawTop();
      };
    }

    function resize() {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      drawTop();
    }
    window.addEventListener('resize', resize);
    resize();

    function scratchAt(x, y) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 45, 0, Math.PI * 2);
      ctx.fill();
    }

    function getPos(event) {
      const rect = canvas.getBoundingClientRect();
      const point = event.touches ? event.touches[0] : event;
      return { x: point.clientX - rect.left, y: point.clientY - rect.top };
    }

    function handleMove(event) {
      const { x, y } = getPos(event);
      scratchAt(x, y);
      if (hint) hint.classList.add('is-hidden');
    }

    canvas.addEventListener('pointerdown', handleMove);
    canvas.addEventListener('pointermove', handleMove);
    canvas.addEventListener('touchmove', handleMove, { passive: true });
  });
}

function initStepReveal() {
  const steps = document.querySelectorAll('.step');
  if (!steps.length) return;

  if (!('IntersectionObserver' in window)) {
    steps.forEach((step) => step.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3, rootMargin: '0px 0px -10% 0px' }
  );

  steps.forEach((step) => observer.observe(step));
}

function initCircularGallery() {
  const root = document.getElementById('portfolio-gallery');
  const ring = document.getElementById('portfolio-gallery-ring');
  if (!root || !ring) return;

  const cards = Array.from(ring.querySelectorAll('.circular-gallery__card'));
  if (!cards.length) return;

  const radius = 380;
  const angleStep = 360 / cards.length;

  cards.forEach((card, i) => {
    card.style.transform = `rotateY(${i * angleStep}deg) translateZ(${radius}px)`;
  });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let rotation = 0;
  let hovering = false;
  const autoSpeed = 0.06;

  function updateOpacity() {
    cards.forEach((card, i) => {
      const angle = (i * angleStep + rotation) % 360;
      const normalized = Math.abs(angle > 180 ? 360 - angle : angle);
      card.style.opacity = Math.max(0.35, 1 - normalized / 180);
    });
  }

  updateOpacity();

  if (prefersReducedMotion) {
    return;
  }

  function animate() {
    if (!hovering) {
      rotation += autoSpeed;
      ring.style.transform = `rotateY(${rotation}deg)`;
      updateOpacity();
    }
    requestAnimationFrame(animate);
  }

  root.addEventListener('mouseenter', () => {
    hovering = true;
  });
  root.addEventListener('mouseleave', () => {
    hovering = false;
  });

  requestAnimationFrame(animate);
}

function initIdeaForm() {
  const form = document.getElementById('idea-form');
  const done = document.getElementById('form-done');
  if (!form || !done) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    form.style.display = 'none';
    done.classList.add('is-visible');
    done.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initHeroParticles();
  revealHero();
  initScratchReveal();
  initStepReveal();
  initCircularGallery();
  initIdeaForm();
});
