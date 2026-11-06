import * as THREE from "three";
import { terrainHeight } from "./island";
const smooth = THREE.MathUtils.smoothstep;
export function createStoryEffects(scene: THREE.Scene, land: THREE.Vector3) {
  const wood = new THREE.MeshStandardMaterial({
      color: 0x65523b,
      roughness: 1,
    }),
    leaf = new THREE.MeshStandardMaterial({
      color: 0x405b35,
      roughness: 1,
      side: THREE.DoubleSide,
    });
  const tree = new THREE.Group();
  tree.position.set(
    land.x + 2.3,
    terrainHeight(land.x + 2.3, land.z - 1.7),
    land.z - 1.7,
  );
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.25, 5.2, 9),
    wood,
  );
  trunk.position.y = 2.6;
  tree.add(trunk);
  for (let i = 0; i < 8; i++) {
    const frond = new THREE.Mesh(
      new THREE.ConeGeometry(0.65, 3.2, 5, 1, true),
      leaf,
    );
    frond.position.set(Math.sin(i) * 0.7, 5, Math.cos(i) * 0.7);
    frond.rotation.set(Math.PI * 0.43, (i * Math.PI) / 4, 0.3);
    tree.add(frond);
  }
  scene.add(tree);
  const shelter = new THREE.Group();
  const shelterPosition = new THREE.Vector3(
    land.x + 7,
    terrainHeight(land.x + 7, land.z - 0.5),
    land.z - 0.5,
  );
  shelter.position.copy(shelterPosition);
  const rock = new THREE.MeshStandardMaterial({
    color: 0x626d5c,
    roughness: 1,
  });
  for (const x of [-1.85, 1.85]) {
    const support = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.27, 2.3, 7),
      wood,
    );
    support.position.set(x, 1.12, -0.35);
    support.rotation.z = x < 0 ? -0.13 : 0.13;
    shelter.add(support);
  }
  const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), rock);
  canopy.scale.set(2.8, 0.55, 1.9);
  canopy.position.set(0, 2.8, -0.3);
  shelter.add(canopy);
  const back = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), rock);
  back.scale.set(2.4, 1.8, 0.65);
  back.position.set(0, 1.2, -1.4);
  shelter.add(back);
  scene.add(shelter);
  const dome = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(
      3.0,
      36,
      18,
      0.35,
      Math.PI * 1.42,
      0.12,
      Math.PI * 0.79,
    ),
    new THREE.MeshBasicMaterial({
      color: 0x7fffd7,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  dome.add(shell);
  for (const radius of [2.7, 3.0, 3.3]) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.012, 5, 100, Math.PI * 1.35),
      new THREE.MeshBasicMaterial({
        color: 0xeaff44,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      }),
    );
    ring.rotation.set(Math.PI / 2.5, 0.2, radius * 0.4);
    dome.add(ring);
  }
  dome.visible = false;
  scene.add(dome);
  const starts: number[] = [],
    positions: number[] = [];
  for (let i = 0; i < 600; i++) {
    const x = Math.sin(i * 17.2) * 17,
      z = Math.cos(i * 63.9) * 16,
      y = (i * 1.719) % 21;
    for (const end of [0, 1]) {
      starts.push(x, y, z);
      positions.push(end * -0.17, end * -0.65, end * 0.08);
    }
  }
  const rainTime = { value: 0 },
    rainAlpha = { value: 0 };
  const rain = new THREE.LineSegments(
    new THREE.BufferGeometry()
      .setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
      .setAttribute("start", new THREE.Float32BufferAttribute(starts, 3)),
    new THREE.ShaderMaterial({
      uniforms: { time: rainTime, alpha: rainAlpha },
      transparent: true,
      depthWrite: false,
      vertexShader: `attribute vec3 start;uniform float time;varying float sheltered;void main(){vec3 p=position+vec3(start.x,mod(start.y-time*12.,21.),start.z);sheltered=step(abs(p.x),2.6)*step(abs(p.z+.3),1.7)*step(p.y,2.9);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      fragmentShader: `uniform float alpha;varying float sheltered;void main(){gl_FragColor=vec4(.65,.86,.87,alpha*(1.-sheltered));}`,
    }),
  );
  rain.position.copy(shelterPosition);
  rain.frustumCulled = false;
  scene.add(rain);
  return {
    tree,
    shelterPosition,
    dome,
    update(
      phase: number,
      time: number,
      actor: THREE.Vector3,
      expansion: number,
    ) {
      const t = THREE.MathUtils.clamp((phase - 1) / 0.3, 0, 1);
      tree.rotation.z = smooth(t, 0.18, 0.68) * 1.52;
      const storm = smooth(phase, 1.27, 1.43);
      rain.visible = storm > 0;
      rainTime.value = time;
      rainAlpha.value = storm * 0.37;
      dome.visible = expansion > 0.005;
      dome.position.copy(actor).add(new THREE.Vector3(0, 1.4, 0));
      dome.scale.setScalar(Math.max(0.001, expansion));
      dome.rotation.y = -0.4;
      return storm;
    },
  };
}
