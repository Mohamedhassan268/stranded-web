import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { createStoryEffects } from "./story-effects";
import { createCharacter } from "./character";
import { createIsland, terrainHeight } from "./island";

const clamp = THREE.MathUtils.clamp,
  lerp = THREE.MathUtils.lerp;
function smooth(a: number, b: number, x: number) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
type Callbacks = {
  ready: () => void;
  shot: (index: number, moving: boolean) => void;
  error: () => void;
  reduced: boolean;
};

export function mountScene(
  host: HTMLDivElement,
  shell: HTMLElement,
  callback: Callbacks,
) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
  } catch {
    callback.error();
    return () => {};
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x839d96, 0.0045);
  const camera = new THREE.PerspectiveCamera(
    48,
    window.innerWidth / window.innerHeight,
    0.06,
    1300,
  );
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(600, 32, 20),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { storm: { value: 0 } },
      vertexShader: `varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform float storm;varying vec3 vWorld;void main(){vec3 d=normalize(vWorld);float h=clamp(d.y,0.,1.);vec3 c=mix(vec3(.85,.63,.43),vec3(.10,.27,.32),pow(h,.35));c=mix(c,vec3(.035,.10,.16),smoothstep(.15,.95,h));float sun=pow(max(dot(d,normalize(vec3(-.65,.22,-.75))),0.),170.);c+=vec3(1.,.65,.29)*sun*.9;c=mix(c,vec3(.055,.12,.14)+c*.24,storm);gl_FragColor=vec4(c,1.);}`,
    }),
  );
  scene.add(sky);
  scene.add(new THREE.HemisphereLight(0xb2dfdf, 0x453c23, 2.4));
  const sun = new THREE.DirectionalLight(0xffd2a0, 4);
  sun.position.set(-35, 55, -25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -45,
    right: 45,
    top: 45,
    bottom: -45,
    near: 1,
    far: 150,
  });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x6dcbd0, 1.5);
  rim.position.set(15, 15, 30);
  scene.add(rim);
  const waterUniforms = {
    time: { value: 0 },
    eye: { value: new THREE.Vector3() },
  };
  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(1800, 1800, 1, 1),
    new THREE.ShaderMaterial({
      uniforms: waterUniforms,
      side: THREE.DoubleSide,
      vertexShader: `varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform float time;uniform vec3 eye;varying vec3 vP;void main(){vec2 p=vP.xy;float r=length(p*vec2(1.,1.12));float small=sin(p.x*3.+p.y*1.9+time*1.2)*sin(p.y*3.2-time*.9);float waves=sin(p.x*.7+p.y*.4+time*.6)+sin(p.y*.85+time*.8);float shallow=1.-smoothstep(22.,65.,r);vec3 col=mix(vec3(.026,.10,.14),vec3(.065,.39,.40),shallow);col+=vec3(.10,.21,.19)*small*.035;float band=pow(max(sin(r*2.1-time*1.1+waves*.15),0.),16.)*(1.-smoothstep(29.,38.,r))*smoothstep(24.,28.,r);col+=vec3(.31,.50,.43)*band*.5;float glint=pow(max(sin(p.x*1.3+p.y*2.2+time*.7)*sin(p.y*3.9-time*.9),0.),28.);col+=vec3(.65,.46,.22)*glint*.06;float haze=smoothstep(90.,520.,r);col=mix(col,vec3(.58,.58,.48),haze);gl_FragColor=vec4(col,1.);}`,
    }),
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -0.02;
  scene.add(ocean);
  const island = createIsland();
  scene.add(island.root);
  const actor = createCharacter();
  scene.add(actor.root);
  actor.root.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = false;
  });
  const land = island.landing.clone();
  const mind = new THREE.Group();
  mind.position.copy(island.mindPosition).add(new THREE.Vector3(0, 1.15, 0));
  const mindCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.28, 2),
    new THREE.MeshStandardMaterial({
      color: 0xe9ff70,
      emissive: 0xd8ff3e,
      emissiveIntensity: 3,
      metalness: 0.5,
      roughness: 0.25,
    }),
  );
  mind.add(mindCore);
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 128;
  const ctx = glowCanvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(238,255,153,.85)");
  gradient.addColorStop(0.16, "rgba(214,255,87,.45)");
  gradient.addColorStop(0.5, "rgba(127,255,210,.10)");
  gradient.addColorStop(1, "rgba(127,255,210,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(glowCanvas),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  glow.scale.set(3, 3, 1);
  mind.add(glow);
  const quantumWire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.62, 1),
    new THREE.MeshBasicMaterial({
      color: 0x42e7e8,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    }),
  );
  mind.add(quantumWire);
  const rings: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(
      new THREE.TorusGeometry(0.81 + i * 0.1, 0.008, 6, 110),
      new THREE.MeshBasicMaterial({
        color: i === 1 ? 0xe9ff61 : 0x74f5ee,
        transparent: true,
        opacity: 0.8,
      }),
    );
    r.rotation.set(0.3 + i * 0.7, i * 0.8, 0.2);
    rings.push(r);
    mind.add(r);
  }
  const points = [];
  for (let i = 0; i < 95; i++) {
    const a = i * 2.399,
      rad = 0.55 + (i % 7) * 0.12;
    points.push(Math.cos(a) * rad, Math.sin(i * 1.9) * rad, Math.sin(a) * rad);
  }
  const motes = new THREE.Points(
    new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3),
    ),
    new THREE.PointsMaterial({
      color: 0x9affdf,
      size: 0.035,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    }),
  );
  mind.add(motes);
  scene.add(mind);
  const mindLight = new THREE.PointLight(0x6affde, 0, 13, 1.5);
  mindLight.position.copy(mind.position);
  scene.add(mindLight);
  const routePoints = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30,
      x = land.x - 4 - t * 12,
      z = land.z - 3 - t * 7 + Math.sin(t * 4) * 2;
    routePoints.push(new THREE.Vector3(x, terrainHeight(x, z) + 0.12, z));
  }
  const routeGeo = new THREE.BufferGeometry().setFromPoints(routePoints);
  const routeMaterial = new THREE.LineDashedMaterial({
    color: 0x8dfdea,
    dashSize: 0.3,
    gapSize: 0.16,
    transparent: true,
    opacity: 0,
  });
  const route = new THREE.Line(routeGeo, routeMaterial);
  route.computeLineDistances();
  scene.add(route);
  const nodes: THREE.Mesh[] = [];
  for (const i of [8, 18, 28]) {
    const node = new THREE.Mesh(
      new THREE.RingGeometry(0.32, 0.35, 40),
      new THREE.MeshBasicMaterial({
        color: i === 18 ? 0xff5d49 : 0x82ffda,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
      }),
    );
    node.rotation.x = -Math.PI / 2;
    node.position.copy(routePoints[i]);
    scene.add(node);
    nodes.push(node);
  }
  const dustData = [];
  for (let i = 0; i < 230; i++) {
    dustData.push(
      Math.sin(i * 46.67) * 38,
      1 + ((i * 7.123) % 45),
      Math.cos(i * 12.34) * 35,
    );
  }
  const dust = new THREE.Points(
    new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.Float32BufferAttribute(dustData, 3),
    ),
    new THREE.PointsMaterial({
      color: 0xd4e1c0,
      size: 0.035,
      transparent: true,
      opacity: 0.36,
    }),
  );
  scene.add(dust);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const film = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      time: { value: 0 },
      amount: { value: 0.0006 },
      eyeClose: { value: 0 },
    },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform sampler2D tDiffuse;uniform float time;uniform float amount;uniform float eyeClose;varying vec2 vUv;void main(){vec2 uv=vUv;vec2 delta=(uv-.5)*amount;vec3 c=vec3(texture2D(tDiffuse,uv+delta).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv-delta).b);float grain=fract(sin(dot(uv*vec2(1387.,933.)+time,vec2(12.9898,78.233)))*43758.5453)-.5;c+=grain*.017;float vig=1.-smoothstep(.18,.78,length(uv-.5));c*=.75+.25*vig;float lid=step(uv.y,eyeClose*.505)+step(1.-eyeClose*.505,uv.y);c=mix(c,vec3(0.),clamp(lid,0.,1.));gl_FragColor=vec4(c,1.);}`,
  });
  composer.addPass(film);
  composer.addPass(new OutputPass());
  const fxaa = new ShaderPass(FXAAShader);
  fxaa.uniforms.resolution.value.set(
    1 / (window.innerWidth * renderer.getPixelRatio()),
    1 / (window.innerHeight * renderer.getPixelRatio()),
  );
  composer.addPass(fxaa);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 1.5),
    new THREE.MeshBasicMaterial({
      map: (glow.material as THREE.SpriteMaterial).map,
      color: 0x000000,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);
  const effects = createStoryEffects(scene, land);
  const shots = [
    { from: 0, to: 0.3, ms: 4600 },
    { from: 0.3, to: 0.4, ms: 1700 },
    { from: 0.4, to: 0.63, ms: 4300 },
    { from: 0.63, to: 0.85, ms: 3900 },
    { from: 0.85, to: 1, ms: 4400 },
    { from: 1, to: 1.3, ms: 5500 },
    { from: 1.3, to: 1.65, ms: 6000 },
  ];
  let desired = 0,
    current = 0,
    phase = 0,
    started = false,
    playing = false,
    replayRequested = false;
  let elapsed = 0,
    raf = 0,
    alive = true,
    lastNow = 0,
    visibility = !document.hidden,
    inspect = false,
    expansion = 0,
    uiAt = 0,
    time = 0;
  let frameAverage = 16.7,
    qualitySamples = 0,
    qualityAt = 0;
  let viewportHeight = window.innerHeight,
    shellTop = 0;
  const pointer = { x: 0, y: 0 },
    targetCam = new THREE.Vector3(),
    targetLook = new THREE.Vector3();
  const center = new THREE.Vector3(),
    projected = new THREE.Vector3(),
    hand = new THREE.Vector3(),
    touchPoint = new THREE.Vector3();
  const direction = mind.position.clone().sub(land).setY(0).normalize();
  const side = new THREE.Vector3(direction.z, 0, -direction.x);
  const contact = mind.position
    .clone()
    .addScaledVector(direction, -1.08)
    .addScaledVector(side, -0.45);
  contact.y = terrainHeight(contact.x, contact.z) + 0.03;
  const evadeEnd = new THREE.Vector3(land.x + 3.3, 0, land.z - 0.4);
  evadeEnd.y = terrainHeight(evadeEnd.x, evadeEnd.z) + 0.03;
  const shelterEnd = effects.shelterPosition
    .clone()
    .add(new THREE.Vector3(0, 0.03, 0.2));
  const fallCenters: THREE.Vector3[] = [];
  const box = new THREE.Box3();
  for (let i = 0; i <= 30; i++) {
    actor.pose(i * 0.01, 0);
    actor.root.updateMatrixWorld(true);
    fallCenters.push(
      box.setFromObject(actor.root).getCenter(new THREE.Vector3()),
    );
  }
  const keys = [
    { p: 0.3, c: [6, 3, 9], l: [0, 1, 0] },
    { p: 0.4, c: [-3.4, 1.5, 5], l: [0, 1.1, 0] },
    { p: 0.52, c: [0.25, 2.25, 2.5], l: [0, 2, 0.15] },
    { p: 0.6, c: [0.1, 2.6, 0.25], l: [-4, 2.15, -3] },
    { p: 0.65, c: [-1, 3.2, 3], l: [-4, 2.15, -3] },
    { p: 0.85, c: [-7, 4, 4], l: [-2, 1.9, -1.5] },
    {
      p: 1,
      c: [
        contact.x - land.x - 5,
        contact.y - land.y + 4.6,
        contact.z - land.z + 8,
      ],
      l: [contact.x - land.x, contact.y - land.y + 1.6, contact.z - land.z],
    },
  ];
  function begin(index: number) {
    current = index;
    phase = shots[index].from;
    elapsed = 0;
    playing = true;
    callback.shot(index, true);
  }
  function scroll() {
    const y = window.scrollY - shellTop;
    desired = clamp(Math.floor(y / viewportHeight), 0, 6);
    if (y > 18) started = true;
  }
  function resize() {
    viewportHeight = window.innerHeight;
    shellTop = shell.getBoundingClientRect().top + window.scrollY;
    camera.aspect = window.innerWidth / viewportHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, viewportHeight);
    composer.setSize(window.innerWidth, viewportHeight);
    fxaa.uniforms.resolution.value.set(
      1 / (window.innerWidth * renderer.getPixelRatio()),
      1 / (viewportHeight * renderer.getPixelRatio()),
    );
    scroll();
  }
  function mouse(e: PointerEvent) {
    pointer.x = e.clientX / window.innerWidth - 0.5;
    pointer.y = e.clientY / viewportHeight - 0.5;
  }
  function visible() {
    visibility = !document.hidden;
    lastNow = 0;
  }
  function choose(e: Event) {
    const value = (e as CustomEvent<number>).detail;
    if (Number.isInteger(value) && value >= 0 && value < shots.length) {
      desired = value;
      started = true;
      replayRequested = true;
    }
  }
  function inspecting(e: Event) {
    inspect = Boolean((e as CustomEvent<boolean>).detail);
  }
  function lost(e: Event) {
    e.preventDefault();
    callback.error();
    alive = false;
    cancelAnimationFrame(raf);
  }
  shell.addEventListener("cinematic-shot", choose);
  shell.addEventListener("quantum-inspect", inspecting);
  window.addEventListener("scroll", scroll, { passive: true });
  window.addEventListener("pointermove", mouse, { passive: true });
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", visible);
  renderer.domElement.addEventListener("webglcontextlost", lost);
  function cameraAt(p: number) {
    if (p <= 0.3) {
      const sample = clamp(p * 100, 0, 30),
        i = Math.min(29, Math.floor(sample));
      center
        .copy(fallCenters[i])
        .lerp(fallCenters[i + 1], sample - i)
        .applyMatrix4(actor.root.matrixWorld);
      const t = smooth(0, 0.3, p),
        angle = lerp(0.57, -0.53, smooth(0, 0.19, p));
      targetLook.copy(center);
      targetCam
        .set(
          Math.sin(angle) * lerp(14, 11, t),
          lerp(4.2, 2.5, t),
          Math.cos(angle) * lerp(14, 11, t),
        )
        .add(center);
    } else if (p <= 1) {
      let i = 0;
      while (i < keys.length - 2 && p > keys[i + 1].p) i++;
      const a = keys[i],
        b = keys[i + 1],
        t = smooth(a.p, b.p, p);
      targetCam
        .set(
          lerp(a.c[0], b.c[0], t),
          lerp(a.c[1], b.c[1], t),
          lerp(a.c[2], b.c[2], t),
        )
        .add(land);
      targetLook
        .set(
          lerp(a.l[0], b.l[0], t),
          lerp(a.l[1], b.l[1], t),
          lerp(a.l[2], b.l[2], t),
        )
        .add(land);
    } else {
      const t = smooth(1, 1.3, p),
        storm = smooth(1.3, 1.65, p);
      targetLook
        .copy(actor.root.position)
        .add(new THREE.Vector3(0, 1.6 - storm * 0.3, 0));
      targetCam.copy(targetLook);
      targetCam.x += lerp(-5, 4.8, t);
      targetCam.y += lerp(3, 1.2, storm);
      targetCam.z += lerp(8, 7, storm);
    }
    if (expansion > 0.001) {
      center.copy(actor.root.position);
      center.y += 1.5;
      if (window.innerWidth >= 700) {
        center.x += 1.9;
        center.z += 0.4;
      }
      targetLook.lerp(center, expansion);
      center.copy(actor.root.position).add(new THREE.Vector3(-5, 3.8, 9));
      targetCam.lerp(center, expansion);
    }
  }
  function frame(now: number) {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    if (!visibility) return;
    const dt = lastNow ? Math.min(now - lastNow, 80) : 0;
    lastNow = now;
    if (!callback.reduced) time += dt * 0.001;
    if (
      !inspect &&
      !playing &&
      started &&
      (desired !== current || phase === 0 || replayRequested)
    ) {
      const index = phase === 0 && !replayRequested ? 0 : desired;
      replayRequested = false;
      begin(index);
    }
    if (playing && !inspect) {
      elapsed += callback.reduced ? shots[current].ms : dt;
      const t = clamp(elapsed / shots[current].ms, 0, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      phase = lerp(shots[current].from, shots[current].to, eased);
      if (t === 1) {
        playing = false;
        callback.shot(current, false);
      }
    }
    expansion = callback.reduced
      ? Number(inspect)
      : THREE.MathUtils.damp(expansion, Number(inspect), 6, dt * 0.001);
    actor.pose(phase, time);
    actor.root.position.copy(land);
    actor.root.rotation.set(
      0,
      phase < 0.3
        ? lerp(-0.5, 0.35, phase / 0.3)
        : lerp(
            0.35,
            Math.atan2(direction.x, direction.z),
            smooth(0.4, 0.85, phase),
          ),
      0,
    );
    const height =
      phase <= 0.3 ? 41 * Math.pow(1 - clamp(phase / 0.3, 0, 1), 1.3) : 0;
    if (phase < 0.3) {
      actor.root.rotation.z =
        0.22 * Math.sin(phase * 8) + 0.06 * Math.sin(time);
      actor.root.rotation.x = -0.12;
    }
    if (phase >= 0.85 && phase <= 1) {
      const walk = smooth(0.85, 0.95, phase);
      actor.root.position.lerp(contact, walk);
      actor.perform("walk", Math.sin(Math.PI * walk), time);
      actor.perform("touch", smooth(0.94, 0.99, phase), time);
    }
    if (phase > 1 && phase <= 1.3) {
      const t = clamp((phase - 1) / 0.3, 0, 1);
      actor.root.position.copy(contact).lerp(evadeEnd, t);
      actor.root.position.z += Math.sin(Math.PI * t) * 2.2;
      actor.root.rotation.y = Math.atan2(
        evadeEnd.x - contact.x,
        evadeEnd.z - contact.z + Math.cos(Math.PI * t) * 6.9,
      );
      actor.perform("walk", Math.sin(Math.PI * t) * 0.9, time);
    }
    if (phase > 1.3) {
      const t = smooth(1.3, 1.56, phase);
      actor.root.position.copy(evadeEnd).lerp(shelterEnd, t);
      actor.root.rotation.y = lerp(Math.PI / 2, 0, smooth(1.5, 1.65, phase));
      actor.perform("walk", Math.sin(Math.PI * t), time);
      actor.perform("duck", smooth(1.47, 1.6, phase), time);
    }
    actor.root.position.y =
      terrainHeight(actor.root.position.x, actor.root.position.z) +
      0.03 +
      height;
    shadow.position.copy(actor.root.position);
    shadow.position.y -= height - 0.006;
    shadow.visible = phase >= 0.29;
    const eyeClose = smooth(0.53, 0.555, phase) - smooth(0.58, 0.62, phase);
    actor.eyeOpen(1 - eyeClose);
    actor.root.visible = !(phase > 0.565 && phase < 0.625);
    actor.root.updateMatrixWorld(true);
    const reveal = smooth(0.56, 0.72, phase);
    mind.visible = phase > 0.52;
    mind.scale.setScalar(0.4 + reveal * 0.6);
    mind.position.copy(island.mindPosition);
    mind.position.y +=
      1.15 + Math.sin(time * 1.25) * 0.08 * (1 - smooth(0.92, 0.99, phase));
    // Settle the signal into his palm at contact; its free hover resumes after release.
    if (phase >= 0.94 && phase <= 1) {
      actor.hand.getWorldPosition(hand);
      touchPoint.set(0, -0.17, 0).applyMatrix4(actor.hand.matrixWorld);
      mind.position.lerp(touchPoint, smooth(0.94, 0.99, phase));
    }
    if (phase > 1) {
      touchPoint.copy(contact).add(new THREE.Vector3(-0.7, 2.2, -0.6));
      hand.copy(actor.root.position).addScaledVector(side, -1.6);
      hand.y += 2.7;
      mind.position.copy(touchPoint).lerp(hand, smooth(1, 1.055, phase));
    }
    mindLight.position.copy(mind.position);
    mindLight.intensity = reveal * 12;
    quantumWire.rotation.set(time * 0.18, time * 0.14, 0);
    mindCore.rotation.set(time * 0.3, time * 0.22, 0);
    rings.forEach((r, i) => {
      r.rotation.y = time * (0.22 + i * 0.06) + i;
      r.rotation.z = time * 0.14 + i * 0.7;
    });
    motes.rotation.y = -time * 0.07;
    const storm = effects.update(phase, time, actor.root.position, expansion);
    sun.intensity = 4 - storm * 2.6;
    (sky.material as THREE.ShaderMaterial).uniforms.storm.value = storm;
    (scene.fog as THREE.FogExp2).density = 0.0045 + storm * 0.013;
    routeMaterial.opacity = 0;
    nodes.forEach((n) => {
      (n.material as THREE.MeshBasicMaterial).opacity = 0;
    });
    waterUniforms.time.value = time;
    dust.rotation.y = time * 0.003;
    island.update(time);
    cameraAt(phase);
    if (!callback.reduced && phase > 0.3) {
      targetCam.x += pointer.x * 0.1;
      targetCam.y += pointer.y * 0.06;
    }
    camera.position.copy(targetCam);
    camera.lookAt(targetLook);
    camera.updateMatrixWorld();
    waterUniforms.eye.value.copy(camera.position);
    film.uniforms.time.value = time;
    film.uniforms.eyeClose.value = eyeClose;
    film.uniforms.amount.value = 0.0006;
    if (now - uiAt > 80) {
      uiAt = now;
      shell.style.setProperty("--eye-close", String(eyeClose));
      shell.style.setProperty(
        "--shot-progress",
        String(playing ? clamp(elapsed / shots[current].ms, 0, 1) : 1),
      );
      shell.dataset.phase = phase.toFixed(4);
      shell.dataset.shot = String(current);
      shell.dataset.animating = String(playing);
      shell.dataset.dome = expansion.toFixed(3);
      shell.dataset.mindVisible = String(phase >= 0.78 && !playing && !inspect);
      projected.copy(mind.position).project(camera);
      shell.style.setProperty(
        "--mind-x",
        `${(projected.x * 0.5 + 0.5) * 100}%`,
      );
      shell.style.setProperty(
        "--mind-y",
        `${(-projected.y * 0.5 + 0.5) * 100}%`,
      );
      if (phase <= 0.3) {
        projected.copy(center).project(camera);
        shell.dataset.centerX = projected.x.toFixed(4);
        shell.dataset.centerY = projected.y.toFixed(4);
      }
      shell.dataset.actorX = actor.root.position.x.toFixed(3);
      shell.dataset.actorZ = actor.root.position.z.toFixed(3);
      shell.dataset.tree = effects.tree.rotation.z.toFixed(3);
      shell.dataset.storm = storm.toFixed(3);
    }
    const renderStart = performance.now();
    composer.render();
    if (now - uiAt < 2) {
      shell.dataset.renderMs = (performance.now() - renderStart).toFixed(2);
      shell.dataset.meshes = String(actor.root.userData.meshes.after);
    }
    if (!callback.reduced && dt > 0 && qualitySamples < 120) {
      frameAverage = frameAverage * 0.95 + dt * 0.05;
      qualitySamples++;
      if (
        qualitySamples === 120 &&
        frameAverage > 27 &&
        now - qualityAt > 2000 &&
        renderer.getPixelRatio() > 1
      ) {
        qualityAt = now;
        renderer.setPixelRatio(1);
        resize();
      }
    }
  }
  resize();
  callback.ready();
  callback.shot(0, false);
  raf = requestAnimationFrame(frame);
  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    shell.removeEventListener("cinematic-shot", choose);
    shell.removeEventListener("quantum-inspect", inspecting);
    window.removeEventListener("scroll", scroll);
    window.removeEventListener("pointermove", mouse);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", visible);
    renderer.domElement.removeEventListener("webglcontextlost", lost);
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material)
        for (const m of Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material]) {
          for (const value of Object.values(m))
            if (value instanceof THREE.Texture) value.dispose();
          m.dispose();
        }
    });
    for (const pass of composer.passes) pass.dispose();
    composer.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
