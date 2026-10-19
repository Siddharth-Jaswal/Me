interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  color: string;
  glowColor: string;
  pulsePhase: number;
  pulseSpeed: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  opacity: number;
}

export class NeuralBackground {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private shockwaves: Shockwave[] = [];
  private animId: number | null = null;
  private dpr = 1;
  private width = 0;
  private height = 0;

  // Mouse tracking with smooth lerp
  private mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false, radius: 180 };

  // Audio beat reactivity
  private beatIntensity = 0;

  public setBeatIntensity(intensity: number) {
    this.beatIntensity = Math.min(1, Math.max(0, intensity));
  }

  // Color palette: deep futuristic neons against void
  private colors = [
    { fill: '#38bdf8', glow: 'rgba(56, 189, 248, 0.8)' },   // Cyber Cyan
    { fill: '#818cf8', glow: 'rgba(129, 140, 248, 0.8)' },  // Neon Indigo
    { fill: '#c084fc', glow: 'rgba(192, 132, 252, 0.8)' },  // Electric Violet
    { fill: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.8)' },   // Hyper Mint
  ];

  // Performance metrics
  private lastTime = performance.now();
  private frameCount = 0;
  private fps = 60;
  private onFpsUpdate?: (fps: number, particleCount: number) => void;

  constructor(canvas: HTMLCanvasElement, onFpsUpdate?: (fps: number, particleCount: number) => void) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;
    this.onFpsUpdate = onFpsUpdate;

    this.init();
  }

  private init() {
    this.handleResize();
    this.bindEvents();
    this.start();
  }

  private bindEvents() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseleave', this.onMouseLeave);
    window.addEventListener('touchstart', this.onTouchStart, { passive: true });
    window.addEventListener('touchmove', this.onTouchMove, { passive: true });
    window.addEventListener('touchend', this.onTouchEnd);
    window.addEventListener('click', this.onClick);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  public destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseleave', this.onMouseLeave);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('click', this.onClick);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private onResize = () => {
    this.handleResize();
  };

  private handleResize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for performance
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(this.dpr, this.dpr);

    // Responsive particle count: balanced density for any display
    const area = this.width * this.height;
    // ~1 particle per 10,000 px^2, clamped between 55 and 140 for guaranteed 60-120fps
    const targetCount = Math.min(140, Math.max(55, Math.floor(area / 10500)));

    this.spawnParticles(targetCount);
  }

  private spawnParticles(count: number) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      const colorScheme = this.colors[Math.floor(Math.random() * this.colors.length)];
      const speed = 0.25 + Math.random() * 0.45;
      const angle = Math.random() * Math.PI * 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx,
        vy,
        baseVx: vx,
        baseVy: vy,
        radius: 1.4 + Math.random() * 1.8,
        baseAlpha: 0.3 + Math.random() * 0.45,
        alpha: 0.4,
        color: colorScheme.fill,
        glowColor: colorScheme.glow,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.02,
      });
    }
  }

  private onMouseMove = (e: MouseEvent) => {
    this.mouse.targetX = e.clientX;
    this.mouse.targetY = e.clientY;
    this.mouse.active = true;
  };

  private onMouseLeave = () => {
    this.mouse.active = false;
  };

  private onTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      this.mouse.targetX = e.touches[0].clientX;
      this.mouse.targetY = e.touches[0].clientY;
      this.mouse.active = true;
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      this.mouse.targetX = e.touches[0].clientX;
      this.mouse.targetY = e.touches[0].clientY;
      this.mouse.active = true;
    }
  };

  private onTouchEnd = () => {
    this.mouse.active = false;
  };

  private onClick = (e: MouseEvent) => {
    this.triggerShockwave(e.clientX, e.clientY);
  };

  public triggerShockwave(x = this.width / 2, y = this.height / 2) {
    this.shockwaves.push({
      x,
      y,
      radius: 10,
      maxRadius: Math.max(350, Math.min(this.width, this.height) * 0.45),
      speed: 8.5,
      opacity: 0.85,
    });
  }

  private onVisibilityChange = () => {
    if (document.hidden) {
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
    } else {
      this.lastTime = performance.now();
      this.start();
    }
  };

  private start() {
    if (!this.animId) {
      this.animId = requestAnimationFrame(this.loop);
    }
  }

  private loop = (now: number) => {
    this.animId = requestAnimationFrame(this.loop);

    // Calculate FPS
    this.frameCount++;
    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;
      if (this.onFpsUpdate) {
        this.onFpsUpdate(this.fps, this.particles.length);
      }
    }

    this.update();
    this.render();
  };

  private update() {
    // Smooth lerp mouse coordinates
    if (this.mouse.active) {
      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.12;
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.12;
    } else {
      // Return mouse to far coordinates smoothly
      this.mouse.x += (-1000 - this.mouse.x) * 0.05;
      this.mouse.y += (-1000 - this.mouse.y) * 0.05;
    }

    // Update shockwaves
    for (let s = this.shockwaves.length - 1; s >= 0; s--) {
      const sw = this.shockwaves[s];
      sw.radius += sw.speed;
      sw.opacity = Math.max(0, 1 - sw.radius / sw.maxRadius);

      // Push particles at shockwave wave-front
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        const dx = p.x - sw.x;
        const dy = p.y - sw.y;
        const dist = Math.hypot(dx, dy);
        const waveDist = Math.abs(dist - sw.radius);

        if (waveDist < 35 && dist > 0) {
          const force = (1 - waveDist / 35) * sw.opacity * 6.5;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      if (sw.radius >= sw.maxRadius || sw.opacity <= 0) {
        this.shockwaves.splice(s, 1);
      }
    }

    // 1. Inter-node mutual repulsion (prevents clumping, self-balances into organic lattice)
    const repulsionRadius = 85; // Natural comfort zone between nodes
    const pCount = this.particles.length;

    for (let i = 0; i < pCount; i++) {
      const p1 = this.particles[i];
      for (let j = i + 1; j < pCount; j++) {
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < repulsionRadius * repulsionRadius && distSq > 0.01) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;

          // Soft quadratic repulsion curve: gentle at distance, firm up close
          const proximity = 1 - dist / repulsionRadius;
          const repulseForce = proximity * proximity * 0.42;

          p1.vx += nx * repulseForce;
          p1.vy += ny * repulseForce;
          p2.vx -= nx * repulseForce;
          p2.vy -= ny * repulseForce;
        }
      }
    }

    // 2. Individual particle update (mouse gravity, breathing, velocity integration)
    const mouseRadius = this.mouse.radius;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Subtle breathing pulse for organic life
      p.pulsePhase += p.pulseSpeed;
      const breathing = Math.sin(p.pulsePhase) * 0.2;

      // Mouse influence: dominant attraction near cursor overcomes natural repulsion
      let mouseGlowBoost = 0;
      if (this.mouse.active) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < mouseRadius && dist > 0) {
          const factor = 1 - dist / mouseRadius;
          mouseGlowBoost = factor * 0.65;

          // Magnetic pull toward cursor
          const pull = factor * 0.6;
          p.vx += (dx / dist) * pull;
          p.vy += (dy / dist) * pull;

          // Subtle vortex spin
          p.vx += (-dy / dist) * pull * 0.15;
          p.vy += (dx / dist) * pull * 0.15;
        }
      }

      // Smooth velocity decay toward base velocity
      p.vx = p.vx * 0.93 + p.baseVx * 0.07;
      p.vy = p.vy * 0.93 + p.baseVy * 0.07;

      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges with slight padding for seamlessness
      const pad = 20;
      if (p.x < -pad) p.x = this.width + pad;
      if (p.x > this.width + pad) p.x = -pad;
      if (p.y < -pad) p.y = this.height + pad;
      if (p.y > this.height + pad) p.y = -pad;

      p.alpha = Math.min(1, Math.max(0.1, p.baseAlpha + breathing + mouseGlowBoost));
    }
  }

  private render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // 1. Deep OLED Void Base
    ctx.fillStyle = '#030712'; // Deepest midnight obsidian
    ctx.fillRect(0, 0, w, h);

    // 2. Dynamic Ambient Cursor Spotlight (Subtle Futuristic Backlight)
    if (this.mouse.active) {
      const glowGrad = ctx.createRadialGradient(
        this.mouse.x,
        this.mouse.y,
        0,
        this.mouse.x,
        this.mouse.y,
        this.mouse.radius * 2.2
      );
      glowGrad.addColorStop(0, 'rgba(30, 58, 138, 0.22)'); // Deep futuristic indigo
      glowGrad.addColorStop(0.4, 'rgba(6, 182, 212, 0.09)'); // Electric cyan
      glowGrad.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // 3. Shockwave rings
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(56, 189, 248, ${sw.opacity * 0.7})`;
      ctx.lineWidth = 2.5 * sw.opacity;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12 * sw.opacity;
      ctx.stroke();
      ctx.restore();
    }

    // 4. Synaptic Connection Lines
    const maxDist = Math.min(145, Math.max(95, w * 0.11));
    const maxDistSq = maxDist * maxDist;
    const pLen = this.particles.length;

    for (let i = 0; i < pLen; i++) {
      const p1 = this.particles[i];
      for (let j = i + 1; j < pLen; j++) {
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < maxDistSq) {
          const dist = Math.sqrt(distSq);
          const proximity = 1 - dist / maxDist;
          
          // Check if connection is energized by cursor proximity
          let mouseEnergize = 0;
          if (this.mouse.active) {
            const midX = (p1.x + p2.x) * 0.5;
            const midY = (p1.y + p2.y) * 0.5;
            const mDist = Math.hypot(this.mouse.x - midX, this.mouse.y - midY);
            if (mDist < this.mouse.radius * 1.3) {
              mouseEnergize = (1 - mDist / (this.mouse.radius * 1.3)) * 0.65;
            }
          }

          const lineAlpha = (proximity * 0.22 + mouseEnergize + this.beatIntensity * 0.18) * Math.min(p1.alpha, p2.alpha);
          
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          
          if (mouseEnergize > 0.2 || this.beatIntensity > 0.4) {
            // Energized line glow
            ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
            ctx.lineWidth = 1.0 + mouseEnergize * 0.8 + this.beatIntensity * 0.8;
          } else {
            // Calm subtle line
            ctx.strokeStyle = `rgba(148, 163, 184, ${lineAlpha})`;
            ctx.lineWidth = 0.65;
          }
          ctx.stroke();
        }
      }
    }

    // 5. Render Particle Nodes
    const pulseRadiusScale = 1 + this.beatIntensity * 0.35;
    for (let i = 0; i < pLen; i++) {
      const p = this.particles[i];
      const isEnergized = p.alpha > 0.75 || this.beatIntensity > 0.45;

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * pulseRadiusScale, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1, p.alpha + this.beatIntensity * 0.3);

      if (isEnergized) {
        ctx.shadowColor = p.glowColor;
        ctx.shadowBlur = 10 + this.beatIntensity * 12;
      }

      ctx.fill();
      ctx.restore();
    }
  }
}
