// The home page's opening: a pixel island that shakes, leaks gas and erupts while its villagers run
// for the boat. Colours, trees, huts and the villager are redrawn from the simulator's engine/gui.py.
// It's an illustration of the idea that cues arrive one at a time, not model output.
//
// Everything is drawn small and scaled up by the browser, which gives the pixels and keeps it cheap.

export const TREMOR_AT = 0.8;
export const GAS_AT = 1.8;
export const ERUPT_AT = 2.8;
const TICK = 1 / 30;
const MAX_PARTICLES = 700;

type RGB = [number, number, number];
type Particle = { kind: "lava" | "ash" | "gas" | "bomb" | "fleck" | "steam" | "bird"; x: number; y: number; vx: number; vy: number; age: number; life: number };
type Villager = { x: number; home: number; tunic: RGB; state: "idle" | "alert" | "run" | "aboard"; seat: number; facing: 1 | -1; step: number; leaveAt: number };
type Stream = { dir: 1 | -1; start: number; reach: number; grown: number };
export type Bubble = { id: "quantum" | "control"; text: string; x: number; y: number };
export type Phase = "calm" | "tremor" | "gas" | "eruption" | "settled";

const hash = (x: number, y = 0) => {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
};
const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));
const mix = (a: RGB, b: RGB, amount: number): RGB => [a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount, a[2] + (b[2] - a[2]) * amount];
const css = ([r, g, b]: RGB, alpha = 1) => `rgba(${r | 0},${g | 0},${b | 0},${alpha})`;

export class EruptionScene {
  phase: Phase = "calm";
  eruptions = 0;
  private readonly ctx: CanvasRenderingContext2D;
  private land: HTMLCanvasElement | null = null;
  private w = 0;
  private h = 0;
  private seaY = 0;
  private ventX = 0;
  private ventY = 0;
  private radius = 0;
  private crater = 0;
  private beach = 0;
  private boatX = 0;
  private ground: number[] = [];
  private t = 0;
  private spare = 0;
  private heat = 0;
  private dark = 0;
  private flash = 0;
  private shake = 0;
  private particles: Particle[] = [];
  private streams: Stream[] = [];
  private villagers: Villager[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  }

  /** Sizes the world in art pixels. `left` is where the text card ends, so the island stays clear of it. */
  layout(w: number, h: number, left: number) {
    const fresh = !this.w;
    const ctx = this.ctx;
    ctx.canvas.width = this.w = w;
    ctx.canvas.height = this.h = h;
    ctx.imageSmoothingEnabled = false;
    this.seaY = Math.round(h * 0.8);
    this.beach = left + (left ? 62 : 50);
    this.ventX = Math.round(left + (w - left) * (left ? 0.62 : 0.68));
    this.radius = Math.round(Math.min((w - this.ventX) * 1.0, (this.ventX - this.beach) * 0.72, h * 0.72));
    this.crater = Math.max(7, Math.round(this.radius * 0.12));
    this.boatX = this.beach - 16;
    this.buildLand();
    if (fresh) this.cast();
    else for (const villager of this.villagers) villager.home = clamp(villager.home, this.beach + 24, this.ventX - this.radius);
  }

  private cast() {
    const left = this.beach + 34;
    const span = Math.max(40, this.ventX - this.radius * 0.85 - left);
    const tunics: RGB[] = [[48, 136, 214], [62, 168, 32], [224, 96, 24], [146, 58, 196], [212, 118, 34]];
    this.villagers = tunics.map((tunic, index) => {
      const home = left + span * [0.72, 0.42, 0.18, 0.58, 0.9][index];
      return { x: home, home, tunic, state: "idle", seat: index, facing: 1, step: 0, leaveAt: index === 0 ? ERUPT_AT + 1 : index === 1 ? GAS_AT + 0.3 : ERUPT_AT + 0.1 + index * 0.1 };
    });
    this.streams = [
      { dir: -1, start: 0, reach: 0.62, grown: 0 },
      { dir: 1, start: 0.1, reach: 1.02, grown: 0 },
      { dir: 1, start: 0.4, reach: 0.5, grown: 0 },
    ];
  }

  private height(x: number) {
    const beach = clamp((x - this.beach) / 44);
    const end = clamp((this.w - x) / 30);
    const swell = 4 + Math.sin(x * 0.03) * 2;
    let top = this.seaY + 3 - Math.min(beach, end) * (10 + swell);
    const away = Math.abs(x - this.ventX);
    if (away < this.radius) {
      const slope = 1 - away / this.radius;
      const cone = Math.pow(slope, 1.25) * Math.min(this.h * 0.56, this.radius * 1.2);
      top = Math.min(top, this.seaY - 8 - cone);
    }
    if (away < this.crater) top += (1 - away / this.crater) * 4;
    return Math.round(top / 2 + hash(Math.floor(x / 5)) * 0.8) * 2;
  }

  private buildLand() {
    const { w, h, seaY, ventX, radius } = this;
    this.ground = Array.from({ length: w }, (_, x) => this.height(x));
    this.ventY = this.ground[Math.min(w - 1, ventX + this.crater)];
    const layer = document.createElement("canvas");
    layer.width = w;
    layer.height = h;
    const ctx = layer.getContext("2d") as CanvasRenderingContext2D;
    const image = ctx.createImageData(w, h);
    const tile = 7;
    for (let x = 0; x < w; x++) {
      const top = this.ground[x];
      for (let y = top; y < Math.min(h, seaY + 5); y++) {
        const even = (Math.floor(x / tile) + Math.floor(y / tile)) % 2 === 0;
        const rise = seaY - y;
        const onCone = Math.abs(x - ventX) < radius;
        let color: RGB;
        if (x < this.beach + 30 && rise < 12) color = even ? [244, 214, 142] : [236, 204, 132];
        else if (y - top < 2 && !onCone) color = [150, 222, 92];
        else if (!onCone || rise + hash(x, y >> 2) * 14 < 26) color = even ? [126, 202, 68] : [114, 190, 58];
        else color = this.rock(x, y, rise);
        const at = (y * w + x) * 4;
        image.data[at] = color[0];
        image.data[at + 1] = color[1];
        image.data[at + 2] = color[2];
        image.data[at + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    for (let x = this.beach + 40; x < w - 8; x += 13) {
      const near = Math.abs(x - ventX);
      if (hash(x, 7) > 0.68 || near < radius * 0.42) continue;
      this.tree(ctx, x + Math.round(hash(x) * 6), this.ground[Math.min(w - 1, x)] + 1);
    }
    for (const x of [this.beach + 62, this.beach + 96]) if (x < ventX - radius * 0.6) this.hut(ctx, x);
    this.land = layer;
  }

  /** Layered rock, offset row by row like stonework, and darker towards the top. */
  private rock(x: number, y: number, rise: number): RGB {
    const row = Math.floor(y / 5);
    const block = Math.floor((x + (row % 2) * 6) / 12);
    const tone = hash(block, row);
    const base = mix([146, 132, 116], [78, 64, 60], clamp((rise - this.h * 0.22) / (this.h * 0.3)));
    if (y % 5 === 0) return mix(base, [54, 42, 38], 0.28);
    return mix(base, tone > 0.5 ? [168, 152, 134] : [96, 82, 72], Math.abs(tone - 0.5) * 0.5);
  }

  private tree(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = css([124, 76, 36]);
    ctx.fillRect(x - 1, y - 6, 3, 6);
    const puff = (dx: number, dy: number, r: number, color: RGB) => {
      ctx.fillStyle = css(color);
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
      ctx.fill();
    };
    puff(0, -11, 7, [44, 136, 32]);
    puff(-1, -12, 5, [72, 174, 46]);
    puff(-2, -14, 3, [112, 208, 72]);
  }

  private hut(ctx: CanvasRenderingContext2D, x: number) {
    const y = this.ground[Math.min(this.w - 1, x)] + 1;
    ctx.fillStyle = css([198, 146, 84]);
    ctx.fillRect(x - 7, y - 10, 15, 10);
    ctx.fillStyle = css([255, 220, 92]);
    ctx.fillRect(x - 1, y - 8, 3, 3);
    ctx.fillStyle = css([218, 68, 38]);
    ctx.beginPath();
    ctx.moveTo(x + 0.5, y - 19);
    ctx.lineTo(x - 10, y - 10);
    ctx.lineTo(x + 11, y - 10);
    ctx.fill();
  }

  private add(particle: Omit<Particle, "age">) {
    if (this.particles.length < MAX_PARTICLES) this.particles.push({ ...particle, age: 0 });
  }

  /** Sets the volcano off, skipping ahead if the opening hasn't got there yet. */
  erupt() {
    if (this.t < ERUPT_AT) this.t = ERUPT_AT;
    this.eruptions += 1;
    this.heat = 1;
    this.flash = 0.75;
    this.shake = 4;
    this.phase = "eruption";
    for (let index = 0; index < 70; index++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.1;
      const speed = 60 + Math.random() * 130;
      this.add({ kind: "lava", x: this.ventX, y: this.ventY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1 + Math.random() });
    }
  }

  private tick() {
    this.t += TICK;
    const t = this.t;
    const { ventX, ventY, crater } = this;
    if (this.phase === "calm" && t >= TREMOR_AT) {
      this.phase = "tremor";
      this.shake = 1.4;
      for (let index = 0; index < 8; index++) {
        this.add({ kind: "bird", x: this.beach + 60 + index * 26, y: this.seaY - 30 - index * 3, vx: -40 - index * 3, vy: -16, life: 6 });
      }
    }
    if (this.phase === "tremor" && t >= GAS_AT) this.phase = "gas";
    if (this.phase === "gas" && t >= ERUPT_AT) this.erupt();
    if (this.phase === "eruption" && this.heat < 0.3) this.phase = "settled";

    this.heat += ((this.eruptions ? 0.16 : 0) - this.heat) * TICK * 0.42;
    this.dark += (Math.min(0.92, this.eruptions ? 0.42 + this.heat * 0.7 : 0) - this.dark) * TICK * 0.9;
    this.flash = Math.max(0, this.flash - TICK * 1.6);
    this.shake = Math.max(this.phase === "tremor" ? 1.4 : this.phase === "gas" ? 0.8 : 0, this.shake - TICK * 1.2);

    if (Math.random() < 0.25 + this.heat * 1.6) {
      this.add({ kind: "ash", x: ventX + (Math.random() - 0.5) * crater, y: ventY - 2, vx: 3 + Math.random() * 10 + this.heat * 8, vy: -(12 + this.heat * 46) * (0.6 + Math.random() * 0.6), life: 3 + this.heat * 4 + Math.random() * 2 });
    }
    if (this.phase === "gas" && Math.random() < 0.8) {
      this.add({ kind: "gas", x: ventX + (Math.random() - 0.5) * crater * 2, y: ventY, vx: 6 + Math.random() * 8, vy: -14 - Math.random() * 12, life: 2 });
    }
    for (let count = Math.round(this.heat * this.heat * 7); count > 0; count--) {
      this.add({ kind: "lava", x: ventX + (Math.random() - 0.5) * crater, y: ventY, vx: (Math.random() - 0.5) * 70, vy: -(70 + Math.random() * 110) * (0.5 + this.heat * 0.7), life: 1.1 + Math.random() });
    }
    if (this.heat > 0.45 && Math.random() < 0.09) {
      this.add({ kind: "bomb", x: ventX, y: ventY, vx: (Math.random() - 0.5) * 150, vy: -120 - Math.random() * 70, life: 5 });
    }
    if (this.dark > 0.3 && Math.random() < 0.9) {
      this.add({ kind: "fleck", x: Math.random() * this.w, y: -2, vx: 5, vy: 12 + Math.random() * 12, life: this.h / 14 });
    }

    for (const stream of this.streams) {
      if (this.heat > 0.3) stream.grown = Math.min(stream.reach, stream.grown + TICK * 0.3);
      if (stream.reach > 1 && stream.grown >= 0.98 && Math.random() < 0.5) {
        this.add({ kind: "steam", x: ventX + this.radius * (0.92 + Math.random() * 0.1), y: this.seaY - 2, vx: 4, vy: -16, life: 1.5 });
      }
    }

    this.particles = this.particles.filter((particle) => {
      particle.age += TICK;
      particle.x += particle.vx * TICK;
      particle.y += particle.vy * TICK;
      if (particle.kind === "lava" || particle.kind === "bomb") particle.vy += 150 * TICK;
      if (particle.kind === "ash") particle.vx += 2 * TICK;
      if (particle.kind === "bomb") {
        const ground = this.ground[Math.round(particle.x)];
        if (ground !== undefined && particle.y >= ground) {
          for (let index = 0; index < 6; index++) {
            this.add({ kind: "lava", x: particle.x, y: ground - 1, vx: (Math.random() - 0.5) * 60, vy: -30 - Math.random() * 50, life: 0.6 });
          }
          return false;
        }
      }
      return particle.age < particle.life && particle.y < this.h && particle.y > -40;
    });

    this.villagers.forEach((villager) => {
      villager.step += TICK;
      if (villager.state === "aboard") return;
      if (villager.state !== "run" && t >= villager.leaveAt) villager.state = "run";
      else if (villager.state === "idle" && t >= TREMOR_AT) villager.state = "alert";
      if (villager.state === "idle") {
        villager.x = villager.home + Math.sin(t * 1.2 + villager.seat) * 6;
        villager.facing = Math.cos(t * 1.2 + villager.seat) > 0 ? 1 : -1;
      } else if (villager.state === "alert") {
        villager.facing = 1;
      } else {
        villager.facing = -1;
        villager.x -= (46 + villager.seat * 3) * TICK;
        if (villager.x <= this.boatX + 8) villager.state = "aboard";
      }
    });
  }

  /** Moves the world on by real time, in fixed steps so it runs the same at any frame rate. */
  advance(seconds: number) {
    this.spare += Math.min(seconds, 0.25);
    while (this.spare >= TICK) {
      this.spare -= TICK;
      this.tick();
    }
  }

  /** Jumps to the calm after the eruption, for people who prefer no motion. */
  settle() {
    for (let index = 0; index < 900; index++) this.tick();
  }

  private drawSky() {
    const { ctx, w, h, seaY, dark, t } = this;
    const bands = 14;
    for (let band = 0; band < bands; band++) {
      const amount = band / (bands - 1);
      const day = mix([88, 192, 242], [206, 236, 244], amount);
      const dusk = mix([62, 40, 22], [214, 110, 48], amount);
      ctx.fillStyle = css(mix(day, dusk, dark));
      ctx.fillRect(0, Math.floor((band * seaY) / bands), w, Math.ceil(seaY / bands) + 1);
    }
    ctx.fillStyle = css([255, 238, 150], 1 - dark);
    ctx.beginPath();
    ctx.arc(w * 0.9, h * 0.17, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = css([255, 255, 255], 0.85 * (1 - dark));
    for (let cloud = 0; cloud < 4; cloud++) {
      const x = ((cloud * 173 + t * (3 + cloud)) % (w + 80)) - 40;
      const y = 14 + cloud * 13;
      ctx.fillRect(Math.round(x), y, 34, 5);
      ctx.fillRect(Math.round(x) + 7, y - 4, 18, 5);
    }
  }

  private drawSea() {
    const { ctx, w, h, seaY, dark, t } = this;
    ctx.fillStyle = css(mix([38, 162, 212], [40, 62, 78], dark * 0.8));
    ctx.fillRect(0, seaY, w, h - seaY);
    ctx.fillStyle = css(mix([145, 222, 248], [214, 110, 48], dark), 0.8);
    for (let row = seaY + 3; row < h; row += 5) {
      for (let x = 0; x < w + 30; x += 34) {
        ctx.fillRect(Math.round(x + (hash(row) * 30 + t * 5) % 34) - 17, row, 8, 1);
      }
    }
  }

  private drawLava() {
    const { ctx, ventX, radius, crater, ventY, t, heat } = this;
    if (!this.eruptions) return;
    const glow = 0.45 + heat * 0.55;
    ctx.fillStyle = css([255, 196, 48], glow);
    ctx.fillRect(ventX - crater + 1, ventY - 1, crater * 2 - 1, 4);
    for (const stream of this.streams) {
      const from = crater + stream.start * radius * 0.3;
      const to = crater + (radius - crater) * stream.grown;
      for (let away = from; away < to; away += 1) {
        const x = Math.round(ventX + stream.dir * away);
        const y = this.ground[x];
        if (y === undefined) continue;
        const flicker = Math.sin(away * 0.4 - t * 5) > 0.2;
        ctx.fillStyle = css(mix(flicker ? [255, 196, 48] : [238, 105, 24], [150, 44, 22], clamp(1 - heat * 2.4) * 0.6));
        ctx.fillRect(x, y - 1 + (hash(Math.floor(away / 6)) > 0.5 ? 1 : 0), 2, 3);
      }
    }
  }

  private drawParticles() {
    const { ctx } = this;
    for (const particle of this.particles) {
      const age = particle.age / particle.life;
      const x = Math.round(particle.x);
      const y = Math.round(particle.y);
      if (particle.kind === "lava") {
        ctx.fillStyle = css(age < 0.4 ? mix([255, 240, 130], [255, 150, 40], age / 0.4) : mix([255, 150, 40], [150, 44, 22], (age - 0.4) / 0.6));
        ctx.fillRect(x, y, 2, 2);
      } else if (particle.kind === "ash") {
        const size = Math.round(3 + age * 12);
        ctx.fillStyle = css(mix([150, 138, 126], [62, 52, 48], age), clamp(1.3 - age * 1.2));
        ctx.fillRect(x - (size >> 1), y - (size >> 1), size, size);
      } else if (particle.kind === "gas") {
        const size = Math.round(3 + age * 6);
        ctx.fillStyle = css([214, 216, 110], 0.7 - age * 0.6);
        ctx.fillRect(x, y, size, size);
      } else if (particle.kind === "steam") {
        const size = Math.round(2 + age * 6);
        ctx.fillStyle = css([236, 236, 230], 0.8 - age * 0.7);
        ctx.fillRect(x, y, size, size);
      } else if (particle.kind === "bomb") {
        ctx.fillStyle = css([54, 32, 14]);
        ctx.fillRect(x - 2, y - 2, 5, 5);
        ctx.fillStyle = css([255, 150, 40]);
        ctx.fillRect(x - 1, y - 1, 3, 3);
      } else if (particle.kind === "fleck") {
        ctx.fillStyle = css([70, 60, 54], 0.8);
        ctx.fillRect(x, y, 1, 1);
      } else {
        const up = Math.sin(this.t * 14 + particle.x) > 0 ? 1 : 0;
        ctx.fillStyle = css([54, 32, 14]);
        ctx.fillRect(x - 2, y + up, 2, 1);
        ctx.fillRect(x + 1, y + up, 2, 1);
        ctx.fillRect(x, y + 1 - up, 1, 1);
      }
    }
  }

  private person(x: number, y: number, villager: Villager, seated = false) {
    const { ctx } = this;
    const px = Math.round(x);
    const running = villager.state === "run";
    const stride = running ? Math.round(Math.sin(villager.step * 22) * 2) : 0;
    const hop = running ? Math.abs(Math.round(Math.sin(villager.step * 22))) : 0;
    const top = Math.round(y) - hop;
    const outline = css([62, 36, 16]);
    if (!seated) {
      ctx.fillStyle = css([92, 52, 22]);
      ctx.fillRect(px - 3 + stride, top - 3, 3, 3);
      ctx.fillRect(px + 1 - stride, top - 3, 3, 3);
    }
    ctx.fillStyle = outline;
    ctx.fillRect(px - 5, top - 13, 11, 11);
    ctx.fillStyle = css(villager.tunic);
    ctx.fillRect(px - 4, top - 12, 9, 9);
    ctx.fillStyle = css([244, 192, 52]);
    ctx.fillRect(px - 4, top - 7, 9, 2);
    ctx.fillStyle = outline;
    ctx.fillRect(px - 4, top - 21, 9, 9);
    ctx.fillStyle = css([252, 214, 174]);
    ctx.fillRect(px - 3, top - 20, 7, 7);
    ctx.fillStyle = css([52, 32, 16]);
    ctx.fillRect(px - 1 + villager.facing, top - 17, 1, 2);
    ctx.fillRect(px + 2 + villager.facing, top - 17, 1, 2);
    ctx.fillStyle = css([112, 68, 24]);
    ctx.fillRect(px - 7, top - 22, 15, 3);
    ctx.fillStyle = css([238, 188, 72]);
    ctx.fillRect(px - 6, top - 22, 13, 2);
    ctx.fillRect(px - 3, top - 25, 7, 3);
  }

  private boatDeck() {
    return this.seaY + Math.round(Math.sin(this.t * 2) * 1) - 3;
  }

  private drawBoat() {
    const { ctx, boatX } = this;
    const deck = this.boatDeck();
    ctx.fillStyle = css([124, 76, 36]);
    ctx.fillRect(boatX - 1, deck - 34, 2, 34);
    ctx.fillStyle = css([244, 188, 58]);
    ctx.fillRect(boatX + 1, deck - 34, 12, 7);
    this.villagers
      .filter((villager) => villager.state === "aboard")
      .forEach((villager) => this.person(boatX - 22 + villager.seat * 11, deck + 2, villager, true));
    ctx.fillStyle = css([92, 52, 22]);
    ctx.fillRect(boatX - 30, deck, 62, 5);
    ctx.fillStyle = css([124, 76, 36]);
    ctx.fillRect(boatX - 27, deck + 5, 56, 4);
  }

  draw() {
    const { ctx, w, h, shake } = this;
    if (!this.land) return;
    const dx = shake ? Math.round((Math.random() - 0.5) * shake * 2) : 0;
    const dy = shake ? Math.round((Math.random() - 0.5) * shake * 2) : 0;
    this.drawSky();
    ctx.save();
    ctx.translate(dx, dy);
    ctx.drawImage(this.land, 0, 0);
    this.drawLava();
    for (const villager of this.villagers) {
      if (villager.state !== "aboard") this.person(villager.x, this.ground[Math.round(villager.x)] ?? this.seaY, villager);
    }
    ctx.restore();
    this.drawSea();
    ctx.fillStyle = css([40, 20, 10], this.dark * 0.22);
    ctx.fillRect(0, 0, w, h);
    this.drawBoat();
    this.drawParticles();
    if (this.flash > 0) {
      ctx.fillStyle = css([255, 240, 200], this.flash);
      ctx.fillRect(0, 0, w, h);
    }
  }

  /** Speech bubbles are page text, so they stay sharp. These say where each one goes, in art pixels. */
  bubbles(): Bubble[] {
    const { t, phase, villagers, eruptions } = this;
    const [quantum, control] = villagers;
    if (!quantum) return [];
    const list: Bubble[] = [];
    const place = (villager: Villager) => ({
      x: villager.state === "aboard" ? this.boatX - 22 + villager.seat * 11 : villager.x,
      y: (villager.state === "aboard" ? this.boatDeck() : (this.ground[Math.round(villager.x)] ?? this.seaY)) - 29,
    });
    let text = "";
    if (phase === "tremor") text = "Tremor?";
    else if (phase === "gas") text = "Gas?";
    else if (quantum.state === "alert" && t >= ERUPT_AT) text = "Hide?";
    else if (quantum.state === "run") text = "Run!";
    else if (quantum.state === "aboard" && eruptions > 1 && this.heat > 0.5) text = "Phew!";
    if (text) list.push({ id: "quantum", text, ...place(quantum) });
    if (control.state === "run") list.push({ id: "control", text: "Leaving!", ...place(control) });
    return list;
  }
}
