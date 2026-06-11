/* ============================================================
   NEXUS — script.js
   1. Navbar scroll effect
   2. Hero particle animation (Three.js + GSAP)
   3. Lizard interactive animation (canvas)
   4. Work card particle canvas
   5. Product canvas particle
   6. Logo canvas (mini particle dot)
   7. Scroll reveal
   8. Stat counter animation
   9. FAQ + hamburger interactions
   ============================================================ */

// ─── 1. NAVBAR ───────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

// Hamburger
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('mobile-menu').classList.toggle('open');
});

// ─── 2. HERO PARTICLE SYSTEM (Three.js + GSAP) ───────────────
(function initHeroParticles() {
  const canvas = document.getElementById('hero-canvas');
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width = W; canvas.height = H;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 2000);
  camera.position.set(0, 0, 600);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Pull points from hidden SVG heart path
  const svgNS = 'http://www.w3.org/2000/svg';
  const svgEl = document.createElementNS(svgNS, 'svg');
  svgEl.setAttribute('width', '600'); svgEl.setAttribute('height', '552');
  svgEl.style.cssText = 'position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;width:0;height:0;overflow:hidden;';
  const pathEl = document.createElementNS(svgNS, 'path');
  pathEl.setAttribute('d', 'M300,450 C120,330 30,220 30,140 C30,65 95,20 165,20 C215,20 258,50 300,95 C342,50 385,20 435,20 C505,20 570,65 570,140 C570,220 480,330 300,450 Z');
  svgEl.appendChild(pathEl);
  document.body.appendChild(svgEl);

  const totalLen = pathEl.getTotalLength();
  const vertices = [];
  const COUNT = 3000;

  for (let i = 0; i < COUNT; i++) {
    const t = (i / COUNT) * totalLen;
    const p = pathEl.getPointAtLength(t);
    const v = new THREE.Vector3(p.x - 300, -(p.y - 276), 0);
    v.x += (Math.random() - 0.5) * 18;
    v.y += (Math.random() - 0.5) * 18;
    v.z += (Math.random() - 0.5) * 60;
    vertices.push(v);
  }

  const geo = new THREE.BufferGeometry().setFromPoints(vertices);
  const mat = new THREE.PointsMaterial({ color: 0xa855f7, size: 2.2, transparent: true, opacity: 0.85 });
  const points = new THREE.Points(geo, mat);
  // Scale up to fill hero nicely
  points.scale.set(1.8, 1.8, 1.8);
  points.position.x = 380;
  scene.add(points);

  // Animate in with GSAP
  const tl = gsap.timeline({ repeat: -1, yoyo: false });
  vertices.forEach((v, i) => {
    const startX = (Math.random() - 0.5) * 1200;
    const startY = (Math.random() - 0.5) * 1200;
    const startZ = (Math.random() - 0.5) * 600;
    gsap.fromTo(v,
      { x: startX, y: startY, z: startZ },
      {
        x: v.x, y: v.y, z: v.z,
        duration: gsap.utils.random(2, 5),
        ease: 'power2.out',
        delay: i * 0.0004,
        repeat: -1,
        repeatDelay: gsap.utils.random(3, 7),
        yoyo: true,
      }
    );
  });

  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 0.3;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 0.3;
  });

  function render() {
    requestAnimationFrame(render);
    points.rotation.y += (mouseX - points.rotation.y) * 0.05;
    points.rotation.x += (-mouseY - points.rotation.x) * 0.05;
    points.rotation.z += 0.0008;
    geo.setFromPoints(vertices);
    geo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  }
  render();

  window.addEventListener('resize', () => {
    const W2 = window.innerWidth, H2 = window.innerHeight;
    camera.aspect = W2 / H2;
    camera.updateProjectionMatrix();
    renderer.setSize(W2, H2);
  });
})();

// ─── 3. LIZARD (Lab section) ──────────────────────────────────
(function initLizard() {
  const canvas = document.getElementById('lizard-canvas');
  const ctx = canvas.getContext('2d');

  function resize() {
    const section = document.getElementById('lab');
    canvas.width = section.offsetWidth;
    canvas.height = section.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  let mouse = { x: -9999, y: -9999, on: false };
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    mouse.on = true;
  });
  canvas.addEventListener('mouseleave', () => mouse.on = false);

  const SEGS = 22, SEG_LEN = 13;
  const body = [];
  for (let i = 0; i < SEGS; i++) body.push({ x: canvas.width / 2 - i * SEG_LEN, y: canvas.height / 2 });

  function updateChain(tx, ty) {
    const dx = tx - body[0].x, dy = ty - body[0].y;
    const d = Math.hypot(dx, dy);
    const step = Math.min(d, 4.5);
    if (d > 1) { body[0].x += dx / d * step; body[0].y += dy / d * step; }
    for (let i = 1; i < body.length; i++) {
      const bx = body[i].x - body[i-1].x, by = body[i].y - body[i-1].y;
      const bd = Math.hypot(bx, by) || 0.001;
      body[i].x = body[i-1].x + bx / bd * SEG_LEN;
      body[i].y = body[i-1].y + by / bd * SEG_LEN;
    }
  }

  function solveIK(joints, ax, ay, fx, fy, l1, l2, side) {
    const dx = fx - ax, dy = fy - ay;
    let dist = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.5);
    if (dist < 0.01) dist = 0.01;
    const a = (l1*l1 - l2*l2 + dist*dist) / (2*dist);
    const h = Math.sqrt(Math.max(0, l1*l1 - a*a));
    const mx = ax + dx/dist*a, my = ay + dy/dist*a;
    const px = -dy/dist*h*side, py = dx/dist*h*side;
    joints[0] = {x:ax,y:ay}; joints[1] = {x:mx+px,y:my+py}; joints[2] = {x:fx,y:fy};
  }

  const legDefs = [{s:3,sd:-1},{s:3,sd:1},{s:7,sd:-1},{s:7,sd:1},{s:11,sd:-1},{s:11,sd:1}];
  const legs = legDefs.map(d => ({
    seg: d.s, side: d.sd,
    joints: [{x:0,y:0},{x:0,y:0},{x:0,y:0}],
    fx: body[d.s].x + d.sd*35, fy: body[d.s].y + 25,
    tx: 0, ty: 0, stepping: false
  }));

  function spineAngle(i) {
    const a = body[Math.max(0,i-1)], b = body[Math.min(body.length-1,i+1)];
    return Math.atan2(a.y-b.y, a.x-b.x);
  }

  function updateLegs() {
    legs.forEach((leg, i) => {
      const anc = body[leg.seg];
      const ang = spineAngle(leg.seg);
      const perp = ang + leg.side * Math.PI/2;
      const ix = anc.x + Math.cos(perp)*38 + Math.cos(ang)*8;
      const iy = anc.y + Math.sin(perp)*38 + Math.sin(ang)*8;
      if (!leg.stepping && Math.hypot(leg.fx-ix, leg.fy-iy) > 32) {
        const partner = i%2===0 ? legs[i+1] : legs[i-1];
        if (!partner.stepping) {
          leg.stepping = true; leg.tx = ix + Math.cos(ang)*12; leg.ty = iy + Math.sin(ang)*12;
        }
      }
      if (leg.stepping) {
        leg.fx += (leg.tx - leg.fx)*0.25; leg.fy += (leg.ty - leg.fy)*0.25;
        if (Math.hypot(leg.fx-leg.tx, leg.fy-leg.ty) < 1.5) leg.stepping = false;
      }
      solveIK(leg.joints, anc.x, anc.y, leg.fx, leg.fy, 22, 20, leg.side);
    });
  }

  let wAngle = Math.random()*Math.PI*2, wTimer = 0;
  let wTarget = { x: canvas.width/2, y: canvas.height/2 };

  function wander() {
    wTimer++;
    if (wTimer > 80 + Math.random()*80) { wAngle += (Math.random()-0.5)*2; wTimer = 0; }
    wTarget.x += Math.cos(wAngle)*3.5; wTarget.y += Math.sin(wAngle)*3.5;
    const m = 100;
    if (wTarget.x < m) { wAngle = Math.abs(wAngle); wTarget.x = m; }
    if (wTarget.x > canvas.width-m) { wAngle = Math.PI - Math.abs(wAngle); wTarget.x = canvas.width-m; }
    if (wTarget.y < m) { wAngle = Math.abs(wAngle); wTarget.y = m; }
    if (wTarget.y > canvas.height-m) { wAngle = -Math.abs(wAngle); wTarget.y = canvas.height-m; }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw body
    for (let i = 0; i < body.length-1; i++) {
      const t = i/body.length;
      ctx.beginPath();
      ctx.moveTo(body[i].x, body[i].y);
      ctx.lineTo(body[i+1].x, body[i+1].y);
      ctx.strokeStyle = `rgba(215,215,215,${0.9-t*0.3})`;
      ctx.lineWidth = (1-t)*6+1.2;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Ribs
    for (let i = 3; i < 14; i+=2) {
      const seg = body[i], ang = spineAngle(i) + Math.PI/2;
      const len = 8 - i*0.3;
      for (let s of [-1,1]) {
        ctx.beginPath();
        ctx.moveTo(seg.x, seg.y);
        ctx.lineTo(seg.x + Math.cos(ang)*len*s, seg.y + Math.sin(ang)*len*s);
        ctx.strokeStyle = 'rgba(160,160,160,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Legs
    legs.forEach(leg => {
      const j = leg.joints;
      ctx.beginPath();
      ctx.moveTo(j[0].x,j[0].y); ctx.lineTo(j[1].x,j[1].y); ctx.lineTo(j[2].x,j[2].y);
      ctx.strokeStyle = 'rgba(200,200,200,0.85)';
      ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.stroke();
      const ta = Math.atan2(j[2].y-j[1].y, j[2].x-j[1].x);
      for (let t=-1;t<=1;t++) {
        ctx.beginPath();
        ctx.moveTo(j[2].x,j[2].y);
        ctx.lineTo(j[2].x+Math.cos(ta+t*0.45)*7, j[2].y+Math.sin(ta+t*0.45)*7);
        ctx.lineWidth = 1; ctx.stroke();
      }
    });

    // Head
    const h = body[0], n = body[2];
    const ang = Math.atan2(h.y-n.y, h.x-n.x);
    ctx.beginPath();
    ctx.ellipse(h.x,h.y,13,7,ang,0,Math.PI*2);
    ctx.fillStyle='rgb(215,215,215)'; ctx.fill();
    for (let s of [-1,1]) {
      const ex = h.x+Math.cos(ang+s*0.65)*7, ey = h.y+Math.sin(ang+s*0.65)*7;
      ctx.beginPath(); ctx.arc(ex,ey,2.5,0,Math.PI*2);
      ctx.fillStyle='#fff'; ctx.fill();
      ctx.beginPath(); ctx.arc(ex+Math.cos(ang),ey+Math.sin(ang),1.2,0,Math.PI*2);
      ctx.fillStyle='#111'; ctx.fill();
    }
    // Tongue
    const tx2 = h.x+Math.cos(ang)*14, ty2 = h.y+Math.sin(ang)*14;
    ctx.beginPath();
    ctx.moveTo(h.x+Math.cos(ang)*10, h.y+Math.sin(ang)*10);
    ctx.lineTo(tx2,ty2);
    ctx.strokeStyle='#ef4444'; ctx.lineWidth=1.2; ctx.stroke();
    for (let s of [-1,1]) {
      ctx.beginPath(); ctx.moveTo(tx2,ty2);
      ctx.lineTo(tx2+Math.cos(ang+s*0.4)*5, ty2+Math.sin(ang+s*0.4)*5);
      ctx.stroke();
    }
  }

  function loop() {
    let tx, ty;
    if (mouse.on) { tx = mouse.x; ty = mouse.y; }
    else { wander(); tx = wTarget.x; ty = wTarget.y; }
    updateChain(tx, ty);
    updateLegs();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();

// ─── 4. WORK CARD PARTICLE CANVAS ────────────────────────────
(function initWorkCanvas() {
  const canvas = document.getElementById('wc1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const particles = Array.from({length: 800}, () => ({
    x: Math.random()*W, y: Math.random()*H,
    vx: (Math.random()-0.5)*0.4, vy: (Math.random()-0.5)*0.4,
    size: Math.random()*2+0.5,
    opacity: Math.random()*0.6+0.2,
    hue: Math.random()*60 + 260
  }));

  function drawWork() {
    ctx.clearRect(0,0,W,H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fillStyle = `hsla(${p.hue},80%,70%,${p.opacity})`;
      ctx.fill();
    });
    requestAnimationFrame(drawWork);
  }
  drawWork();
})();

// ─── 5. PRODUCT CANVAS PARTICLE ──────────────────────────────
(function initProductCanvas() {
  const canvas = document.getElementById('product-canvas-1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const svgNS = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(svgNS, 'svg');
  s.setAttribute('width','320'); s.setAttribute('height','180');
  s.style.cssText = 'position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;width:0;height:0;overflow:hidden;';
  const p = document.createElementNS(svgNS, 'path');
  p.setAttribute('d', 'M160,160 C60,120 20,80 20,50 C20,25 45,10 70,10 C95,10 115,22 160,45 C205,22 225,10 250,10 C275,10 300,25 300,50 C300,80 260,120 160,160 Z');
  s.appendChild(p); document.body.appendChild(s);

  const len = p.getTotalLength();
  const verts = [];
  for (let i = 0; i < len; i += 0.5) {
    const pt = p.getPointAtLength(i);
    verts.push({
      x: pt.x, y: pt.y,
      ox: pt.x + (Math.random()-0.5)*10,
      oy: pt.y + (Math.random()-0.5)*10,
      vx: 0, vy: 0
    });
  }

  function drawProd() {
    ctx.clearRect(0,0,W,H);
    verts.forEach((v,i) => {
      const hue = (i/verts.length)*60 + 270;
      ctx.beginPath();
      ctx.arc(v.ox, v.oy, 1.5, 0, Math.PI*2);
      ctx.fillStyle = `hsla(${hue},80%,70%,0.7)`;
      ctx.fill();
      v.ox += (v.x - v.ox)*0.03 + (Math.random()-0.5)*0.5;
      v.oy += (v.y - v.oy)*0.03 + (Math.random()-0.5)*0.5;
    });
    requestAnimationFrame(drawProd);
  }
  drawProd();
})();

// ─── 6. LOGO CANVAS (mini animated dot) ──────────────────────
function initLogoCanvas(id) {
  const c = document.getElementById(id);
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  let t = 0;
  function draw() {
    ctx.clearRect(0,0,W,H);
    const pts = 6, r1=16, r2=8;
    ctx.beginPath();
    for (let i=0;i<pts*2+1;i++) {
      const angle = (i/pts)*Math.PI + t;
      const r = i%2===0 ? r1 : r2;
      const x = W/2 + Math.cos(angle)*r;
      const y = H/2 + Math.sin(angle)*r;
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.fillStyle = '#7c3aed';
    ctx.fill();
    t += 0.01;
    requestAnimationFrame(draw);
  }
  draw();
}
initLogoCanvas('logo-canvas');
initLogoCanvas('footer-logo');

// ─── 7. SCROLL REVEAL ────────────────────────────────────────
const reveals = document.querySelectorAll('.reveal, .reveal-light');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
reveals.forEach(el => revealObserver.observe(el));

// ─── 8. STAT COUNTER ─────────────────────────────────────────
const statNums = document.querySelectorAll('.stat-num');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = +el.dataset.target;
      let current = 0;
      const inc = target / 60;
      const timer = setInterval(() => {
        current += inc;
        if (current >= target) { el.textContent = target; clearInterval(timer); }
        else el.textContent = Math.floor(current);
      }, 25);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });
statNums.forEach(el => counterObserver.observe(el));

// ─── 9. FORM SUBMIT ──────────────────────────────────────────
function handleSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Sending…';
  btn.disabled = true;
  setTimeout(() => {
    document.getElementById('form-success').style.display = 'block';
    btn.style.display = 'none';
  }, 1200);
}

// ─── SCROLL TO TOP ────────────────────────────────────────────
const scrollTopBtn = document.getElementById('scroll-top');
window.addEventListener('scroll', () => {
  scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
});
scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});