import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
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
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
  } catch {
    callback.error();
    return () => {};
  }
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, window.innerWidth < 700 ? 1.25 : 1.6),
  );
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
      vertexShader: `varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec3 vWorld;void main(){vec3 d=normalize(vWorld);float h=clamp(d.y,0.,1.);vec3 c=mix(vec3(.85,.63,.43),vec3(.10,.27,.32),pow(h,.35));c=mix(c,vec3(.035,.10,.16),smoothstep(.15,.95,h));float sun=pow(max(dot(d,normalize(vec3(-.65,.22,-.75))),0.),170.);c+=vec3(1.,.65,.29)*sun*.9;gl_FragColor=vec4(c,1.);}`,
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
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.28,
    0.6,
    1.5,
  );
  composer.addPass(bloom);
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
  const fxaa=new ShaderPass(FXAAShader);
  fxaa.uniforms.resolution.value.set(1/(window.innerWidth*renderer.getPixelRatio()),1/(window.innerHeight*renderer.getPixelRatio()));
  composer.addPass(fxaa);

  const shots = [
    { from: 0, to: 0.3, ms: 4600 },
    { from: 0.3, to: 0.4, ms: 1700 },
    { from: 0.4, to: 0.63, ms: 4300 },
    { from: 0.63, to: 0.85, ms: 3900 },
    { from: 0.85, to: 1, ms: 4000 },
  ];
  let replayRequested = false;
  let desired = 0,
    current = 0,
    phase = 0,
    started = false,
    playing = false,
    clipStart = 0,
    clipFrom = 0,
    clipTo = 0,
    clipDuration = 0,
    raf = 0,
    alive = true,
    lastNow = 0,
    visibility = true;
  const pixel = new THREE.Vector2();
  const targetCam = new THREE.Vector3(),
    targetLook = new THREE.Vector3(),
    look = new THREE.Vector3();
  function begin(index: number, now: number) {
    current = index;
    const shot = shots[index];
    phase = shot.from;
    clipFrom = shot.from;
    clipTo = shot.to;
    clipDuration = callback.reduced ? 1 : shot.ms;
    clipStart = now;
    playing = true;
    callback.shot(index, true);
  }
  function scroll() {
    const top = shell.getBoundingClientRect().top + window.scrollY;
    const y = window.scrollY - top;
    desired = clamp(Math.floor(y / window.innerHeight), 0, 4);
    if (y > 18) started = true;
  }
  const pointer = { x: 0, y: 0 };
  const mouse = (e: PointerEvent) => {
    pointer.x = e.clientX / window.innerWidth - 0.5;
    pointer.y = e.clientY / window.innerHeight - 0.5;
  };
  const resize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    fxaa.uniforms.resolution.value.set(1/(window.innerWidth*renderer.getPixelRatio()),1/(window.innerHeight*renderer.getPixelRatio()));
    scroll();
  };
  const visible = () => {
    visibility = !document.hidden;
    lastNow = 0;
  };
  const choose=(e:Event)=>{const value=(e as CustomEvent<number>).detail;if(Number.isInteger(value)&&value>=0&&value<shots.length){desired=value;started=true;replayRequested=true;}};
  shell.addEventListener("cinematic-shot",choose);
  window.addEventListener("scroll", scroll, { passive: true });
  window.addEventListener("pointermove", mouse, { passive: true });
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", visible);
  renderer.domElement.addEventListener("webglcontextlost", lost);
  function lost(e: Event) {
    e.preventDefault();
    callback.error();
    alive = false;
    cancelAnimationFrame(raf);
  }
  function cameraAt(p: number) {
    const keys = [
      {
        p: 0,
        cam: [land.x + 8, land.y + 51, land.z + 13],
        look: [land.x, land.y + 41, land.z],
      },
      {
        p: 0.16,
        cam: [land.x - 8, land.y + 29, land.z + 10],
        look: [land.x, land.y + 24, land.z],
      },
      {
        p: 0.3,
        cam: [land.x + 6, land.y + 3, land.z + 9],
        look: [land.x, land.y + 1, land.z],
      },
      {
        p: 0.4,
        cam: [land.x - 3.4, land.y + 1.5, land.z + 5.0],
        look: [land.x, land.y + 1.1, land.z],
      },
      {
        p: 0.52,
        cam: [land.x + 0.25, land.y + 2.25, land.z + 2.5],
        look: [land.x, land.y + 2.0, land.z + 0.15],
      },
      {
        p: 0.6,
        cam: [land.x + 0.1, land.y + 2.6, land.z + 0.25],
        look: [mind.position.x, mind.position.y, mind.position.z],
      },
      {
        p: 0.65,
        cam: [land.x - 1, land.y + 3.2, land.z + 3],
        look: [mind.position.x, mind.position.y, mind.position.z],
      },
      {
        p: 0.85,
        cam: [
          mind.position.x - 2.2,
          mind.position.y + 1.2,
          mind.position.z + 3.8,
        ],
        look: [mind.position.x, mind.position.y, mind.position.z],
      },
      {
        p: 1,
        cam: [land.x + 8, land.y + 7.4, land.z + 10],
        look: [land.x - 5, land.y + 1.3, land.z - 5],
      },
    ];
    let a = keys[0],
      b = keys[1];
    for (let i = 0; i < keys.length - 1; i++)
      if (p >= keys[i].p) {
        a = keys[i];
        b = keys[i + 1];
      }
    const t = smooth(a.p, b.p, p);
    targetCam.fromArray(a.cam).lerp(new THREE.Vector3().fromArray(b.cam), t);
    targetLook.fromArray(a.look).lerp(new THREE.Vector3().fromArray(b.look), t);
  }
  function frame(now: number) {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    if (!visibility) return;
    const time = callback.reduced ? 0 : now * 0.001;
    if (!playing && started && (desired !== current || phase === 0 || replayRequested)) {
      const index=phase===0&&!replayRequested?0:desired;
      replayRequested=false;
      begin(index,now);
    }
    if (playing) {
      const t = clamp((now - clipStart) / clipDuration, 0, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      phase = lerp(clipFrom, clipTo, eased);
      if (t >= 1) {
        playing = false;
        callback.shot(current, false);
      }
    }
    actor.pose(phase, time);
    const height =
      phase <= 0.3 ? 41 * Math.pow(1 - clamp(phase / 0.3, 0, 1), 1.3) : 0;
    actor.root.position.copy(land);
    actor.root.position.y += height;
    actor.root.rotation.set(
      0,
      phase < 0.3
        ? lerp(-0.5, 0.35, phase / 0.3)
        : lerp(0.35, -1.2, smooth(0.4, 0.86, phase)),
      0,
    );
    if (phase < 0.3) {
      actor.root.rotation.z =
        0.22 * Math.sin(phase * 8) + 0.06 * Math.sin(time);
      actor.root.rotation.x = -0.12;
    }
    const walking = smooth(0.85, 1, phase);
    actor.root.position.x -= walking * 3;
    actor.root.position.z -= walking * 2;
    actor.root.position.y =
      height +
      terrainHeight(actor.root.position.x, actor.root.position.z) +
      0.03;
    const eyeClose = smooth(0.53, 0.555, phase) - smooth(0.58, 0.62, phase);
    actor.eyeOpen(1 - eyeClose);
    shell.style.setProperty("--eye-close", String(eyeClose));
    actor.root.visible = !(phase > 0.565 && phase < 0.625);
    const reveal = smooth(0.56, 0.72, phase);
    mind.visible = phase > 0.52;
    mind.scale.setScalar(0.4 + reveal * 0.6);
    mind.position.y =
      island.mindPosition.y + 1.15 + Math.sin(time * 1.25) * 0.12;
    quantumWire.rotation.set(time * 0.18, time * 0.14, 0);
    mindCore.rotation.set(time * 0.3, time * 0.22, 0);
    rings.forEach((r, i) => {
      r.rotation.y = time * (0.22 + i * 0.06) + i;
      r.rotation.z = time * 0.14 + i * 0.7;
    });
    motes.rotation.y = -time * 0.07;
    mindLight.intensity = reveal * 12;
    routeMaterial.opacity = smooth(0.79, 0.95, phase) * 0.85;
    nodes.forEach(
      (n) =>
        ((n.material as THREE.MeshBasicMaterial).opacity =
          routeMaterial.opacity * (0.6 + 0.3 * Math.sin(time * 2))),
    );
    waterUniforms.time.value = time;
    waterUniforms.eye.value.copy(camera.position);
    dust.rotation.y = time * 0.003;
    island.update(time);
    cameraAt(phase);
    if(!callback.reduced){targetCam.x += pointer.x * 0.13;
    targetCam.y += pointer.y * 0.08;}
    camera.position.copy(targetCam);
    look.copy(targetLook);
    if (phase > 0.3 && phase < 0.34) {
      const shake = (1 - smooth(0.3, 0.34, phase)) * 0.12;
      camera.position.x += Math.sin(time * 41) * shake;
      camera.position.y += Math.cos(time * 53) * shake;
    }
    camera.lookAt(look);
    film.uniforms.time.value = time;
    film.uniforms.eyeClose.value=eyeClose;
    film.uniforms.amount.value =
      0.0006 + (phase > 0.3 && phase < 0.34 ? 0.004 : 0);
    shell.style.setProperty(
      "--shot-progress",
      String(playing ? clamp((now - clipStart) / clipDuration, 0, 1) : 1),
    );
    shell.dataset.phase = phase.toFixed(4);
    shell.dataset.shot = String(current);
    shell.dataset.animating = String(playing);
    composer.render();
    lastNow = now;
  }
  scroll();
  callback.ready();
  callback.shot(0, false);
  raf = requestAnimationFrame(frame);
  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    shell.removeEventListener("cinematic-shot",choose);
    window.removeEventListener("scroll", scroll);
    window.removeEventListener("pointermove", mouse);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", visible);
    renderer.domElement.removeEventListener("webglcontextlost", lost);
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        for (const m of Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material]) {
          for (const value of Object.values(m))
            if (value instanceof THREE.Texture) value.dispose();
          m.dispose();
        }
      }
    });
    for(const pass of composer.passes)pass.dispose();
    composer.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
