import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const TAU = Math.PI * 2;
const LANDING_X = 12;
const LANDING_Z = 17;
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

function hash(x: number, z: number): number {
  let n = Math.imul(x, 374761393) ^ Math.imul(z, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function noise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);
  return mix(
    mix(hash(ix, iz), hash(ix + 1, iz), sx),
    mix(hash(ix, iz + 1), hash(ix + 1, iz + 1), sx),
    sz,
  );
}

function fbm(x: number, z: number): number {
  return (
    noise(x, z) * 0.55 +
    noise(x * 2.07 + 19.3, z * 2.07 - 7.1) * 0.28 +
    noise(x * 4.19 - 3.2, z * 4.19 + 29.8) * 0.12 +
    noise(x * 8.31 + 44.2, z * 8.31) * 0.05
  );
}

function rawHeight(x: number, z: number): number {
  const angle = Math.atan2(z / 26, x / 30);
  const radius = Math.hypot(x / 30, z / 26);
  const coast =
    1 +
    Math.sin(angle * 3 + 0.5) * 0.064 +
    Math.sin(angle * 7 - 1.1) * 0.033 +
    Math.sin(angle * 11 + 0.2) * 0.019 +
    (noise(x * 0.16, z * 0.16) - 0.5) * 0.052;
  const inland = coast - radius;
  let height =
    inland < 0
      ? inland * 15
      : Math.min(inland, 0.26) * 6 + Math.max(0, inland - 0.26) * 0.85;
  const interior = smooth(0.035, 0.3, inland);
  const peak = Math.exp(-(((x + 6.5) / 7.3) ** 2 + ((z + 9) / 6.5) ** 2));
  const ridge = Math.exp(-(((x + 11) / 10) ** 2 + ((z + 4) / 4.6) ** 2));
  const hill = Math.exp(-(((x - 9) / 9) ** 2 + ((z + 4) / 9) ** 2));
  height +=
    interior *
    (peak * 9.5 +
      ridge * 1.7 +
      hill * 1.1 +
      (fbm(x * 0.26, z * 0.26) - 0.5) * (0.65 + peak * 1.6));
  height += interior * (noise(x * 1.55, z * 1.55) - 0.5) * 0.1;
  const oceanFloor = -3.6 - Math.max(0, Math.hypot(x, z) - 35) * 0.32;
  return mix(
    height,
    Math.min(height, oceanFloor),
    smooth(31.5, 35, Math.hypot(x, z)),
  );
}

function inStoryCorridor(x: number, z: number) {
  const t = clamp(((x - 9) * 10 + (z - 14.3) * 2.4) / 105.76, 0, 1);
  return Math.hypot(x - (9 + 10 * t), z - (14.3 + 2.4 * t)) < 3.1;
}
const landingLevel = rawHeight(LANDING_X, LANDING_Z);

export function terrainHeight(x: number, z: number): number {
  const clearing =
    1 - smooth(2.8, 6.1, Math.hypot(x - LANDING_X, z - LANDING_Z));
  return mix(
    rawHeight(x, z),
    landingLevel + (x - LANDING_X) * 0.014 - (z - LANDING_Z) * 0.009,
    clearing,
  );
}

function randomSource(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let n = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    n = (n + Math.imul(n ^ (n >>> 7), 61 | n)) ^ n;
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

function groundSlope(x: number, z: number) {
  return (
    Math.hypot(
      terrainHeight(x + 0.2, z) - terrainHeight(x - 0.2, z),
      terrainHeight(x, z + 0.2) - terrainHeight(x, z - 0.2),
    ) / 0.4
  );
}

function grainTexture() {
  const size = 256;
  const pixels = new Uint8Array(size * size * 4);
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const value = Math.round(
        124 + (hash(x, z) - 0.5) * 94 + (noise(x * 0.15, z * 0.15) - 0.5) * 32,
      );
      const offset = (z * size + x) * 4;
      pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = value;
      pixels[offset + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(34, 34);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function buildTerrain(texture: THREE.DataTexture) {
  const segments = 160;
  const width = 82;
  const positions: number[] = [];
  const colors: number[] = [];
  const uv: number[] = [];
  const indices: number[] = [];
  const wetSand = new THREE.Color("#867a58");
  const drySand = new THREE.Color("#d0bf91");
  const grass = new THREE.Color("#3d5630");
  const deepGrass = new THREE.Color("#223b26");
  const basalt = new THREE.Color("#66635c");
  const lightRock = new THREE.Color("#8c887a");
  const color = new THREE.Color();
  const turf = new THREE.Color();
  const rock = new THREE.Color();
  for (let iz = 0; iz <= segments; iz++) {
    for (let ix = 0; ix <= segments; ix++) {
      const x = (ix / segments - 0.5) * width;
      const z = (iz / segments - 0.5) * width;
      const y = terrainHeight(x, z);
      const slope = groundSlope(x, z);
      const detail = fbm(x * 0.85 + 32, z * 0.85 - 11);
      color.copy(wetSand).lerp(drySand, smooth(-0.04, 0.72, y));
      turf.copy(deepGrass).lerp(grass, detail);
      const clearing =
        1 - smooth(3.7, 6.4, Math.hypot(x - LANDING_X, z - LANDING_Z));
      const vegetation =
        smooth(0.78 + detail * 0.5, 1.8 + detail * 0.45, y) * (1 - clearing);
      color.lerp(turf, vegetation);
      rock.copy(basalt).lerp(lightRock, detail * 0.8);
      const exposed = clamp(
        smooth(0.65, 1.3, slope) * smooth(1.8, 4, y) +
          smooth(7.4, 10.8, y) * 0.58,
        0,
        0.94,
      );
      color.lerp(rock, exposed * (1 - clearing));
      color.multiplyScalar(0.91 + detail * 0.17);
      positions.push(x, y, z);
      colors.push(color.r, color.g, color.b);
      uv.push(ix / segments, iz / segments);
      if (ix < segments && iz < segments) {
        const a = iz * (segments + 1) + ix;
        const b = a + segments + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.96,
    bumpMap: texture,
    bumpScale: 0.065,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "continuous-sand-forest-and-basalt-terrain";
  mesh.receiveShadow = mesh.castShadow = true;
  return mesh;
}

class LeafBuilder {
  positions: number[] = [];
  colors: number[] = [];
  wind: number[] = [];

  triangle(
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
    color: THREE.Color,
    wind: number,
  ) {
    for (const point of [a, b, c]) {
      this.positions.push(point.x, point.y, point.z);
      this.colors.push(color.r, color.g, color.b);
      this.wind.push(wind);
    }
  }

  ribbon(
    start: THREE.Vector3,
    end: THREE.Vector3,
    width: number,
    droop: number,
    color: THREE.Color,
    wind: number,
    sections = 4,
  ) {
    const axis = end.clone().sub(start);
    const side = new THREE.Vector3(-axis.z, 0, axis.x).normalize();
    if (side.lengthSq() < 0.1) side.set(1, 0, 0);
    const points: THREE.Vector3[][] = [];
    for (let i = 0; i <= sections; i++) {
      const t = i / sections;
      const center = start.clone().lerp(end, t);
      center.y += Math.sin(t * Math.PI) * droop;
      const halfWidth = Math.pow(Math.sin(t * Math.PI), 0.72) * width + 0.002;
      const left = center.clone().addScaledVector(side, halfWidth);
      const right = center.clone().addScaledVector(side, -halfWidth);
      center.y += halfWidth * 0.18;
      points.push([left, center, right]);
    }
    for (let i = 0; i < sections; i++) {
      const shade = color.clone().multiplyScalar(1 - (i / sections) * 0.13);
      for (let j = 0; j < 2; j++) {
        this.triangle(
          points[i][j],
          points[i + 1][j],
          points[i][j + 1],
          shade,
          wind,
        );
        this.triangle(
          points[i][j + 1],
          points[i + 1][j],
          points[i + 1][j + 1],
          shade,
          wind,
        );
      }
    }
  }

  geometry() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(this.positions, 3),
    );
    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(this.colors, 3),
    );
    geometry.setAttribute(
      "aWind",
      new THREE.Float32BufferAttribute(this.wind, 1),
    );
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }
}

function trunkGeometry(
  curve: THREE.CatmullRomCurve3,
  radius: number,
  color: THREE.Color,
  segments = 14,
) {
  const geometry = new THREE.TubeGeometry(curve, segments, radius, 8, false);
  const uv = geometry.getAttribute("uv");
  const colors: number[] = [];
  const positions = geometry.getAttribute("position");
  for (let i = 0; i < positions.count; i++) {
    const t = uv.getX(i);
    const ring = (t * 35) % 1;
    const shade =
      ring < 0.13 ? 0.68 : 0.92 + noise(t * 45, uv.getY(i) * 15) * 0.18;
    const c = color.clone().multiplyScalar(shade);
    colors.push(c.r, c.g, c.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

function addPalm(
  x: number,
  z: number,
  height: number,
  random: () => number,
  trunks: THREE.BufferGeometry[],
  leaves: LeafBuilder,
  coconuts: THREE.Vector3[],
) {
  const y = terrainHeight(x, z) - 0.07;
  const bendAngle = random() * TAU;
  const bend = 0.6 + random() * 1.2;
  const direction = new THREE.Vector3(
    Math.cos(bendAngle),
    0,
    Math.sin(bendAngle),
  );
  const base = new THREE.Vector3(x, y, z);
  const crown = base
    .clone()
    .addScaledVector(direction, bend)
    .add(new THREE.Vector3(0, height, 0));
  const curve = new THREE.CatmullRomCurve3([
    base,
    base
      .clone()
      .addScaledVector(direction, -0.12)
      .add(new THREE.Vector3(0, height * 0.25, 0)),
    base
      .clone()
      .addScaledVector(direction, bend * 0.38)
      .add(new THREE.Vector3(0, height * 0.62, 0)),
    crown,
  ]);
  trunks.push(trunkGeometry(curve, height * 0.028, new THREE.Color("#8e7f62")));
  for (let i = 0; i < 3; i++) {
    const angle = bendAngle + (i * TAU) / 3;
    const foot = base
      .clone()
      .add(
        new THREE.Vector3(Math.cos(angle) * 0.42, 0.13, Math.sin(angle) * 0.42),
      );
    foot.y = terrainHeight(foot.x, foot.z) + 0.025;
    trunks.push(
      trunkGeometry(
        new THREE.CatmullRomCurve3([
          foot,
          base.clone().add(new THREE.Vector3(0, 0.15, 0)),
          base.clone().add(new THREE.Vector3(0, 0.48, 0)),
        ]),
        0.07,
        new THREE.Color("#74644d"),
        4,
      ),
    );
  }
  const count = 10 + Math.floor(random() * 3);
  for (let i = 0; i < count; i++) {
    const angle = (i * TAU) / count + random() * 0.24;
    const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const lateral = new THREE.Vector3(-direction.z, 0, direction.x);
    const length = height * (0.42 + random() * 0.13);
    const frondColor = new THREE.Color().setHSL(
      0.235 + random() * 0.035,
      0.38 + random() * 0.16,
      0.205 + random() * 0.075,
    );
    const stemPoint = (t: number) =>
      crown
        .clone()
        .addScaledVector(direction, length * Math.sin(t * Math.PI * 0.5))
        .add(
          new THREE.Vector3(
            0,
            0.22 +
              Math.sin(t * Math.PI) * 0.65 -
              t * t * (1.35 + length * 0.13),
            0,
          ),
        );
    for (let j = 1; j <= 14; j++) {
      const t = j / 15;
      const stem = stemPoint(t);
      const leafletLength =
        length * 0.28 * Math.pow(Math.sin(t * Math.PI), 0.65) * (1 - t * 0.22);
      for (const side of [-1, 1]) {
        const tip = stem
          .clone()
          .addScaledVector(lateral, side * leafletLength)
          .addScaledVector(direction, length * 0.105);
        tip.y -= leafletLength * (0.3 + t * 0.25) + random() * 0.045;
        leaves.ribbon(
          stem,
          tip,
          0.043 + leafletLength * 0.035,
          leafletLength * 0.16,
          frondColor,
          0.5 + t * 0.5,
          2,
        );
      }
      if (j < 14)
        leaves.ribbon(
          stem,
          stemPoint((j + 1) / 15),
          0.014,
          0,
          frondColor.clone().multiplyScalar(1.14),
          0.5 + t * 0.5,
          1,
        );
    }
  }
  for (let i = 0; i < 3; i++) {
    const angle = random() * TAU;
    const tip = crown
      .clone()
      .add(
        new THREE.Vector3(Math.cos(angle) * 0.8, 1.4, Math.sin(angle) * 0.8),
      );
    leaves.ribbon(crown, tip, 0.065, 0.1, new THREE.Color("#637a35"), 0.48, 5);
    if (i < 2)
      coconuts.push(
        crown
          .clone()
          .add(
            new THREE.Vector3(
              Math.cos(angle) * 0.23,
              -0.1 - random() * 0.12,
              Math.sin(angle) * 0.23,
            ),
          ),
      );
  }
}

function foliageMaterial(time: { value: number }) {
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.82,
    side: THREE.DoubleSide,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uIslandTime = time;
    shader.vertexShader = `attribute float aWind;\nuniform float uIslandTime;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>\ntransformed.x += sin(uIslandTime * 0.72 + position.x * 0.31 + position.z * 0.23) * 0.12 * aWind;\ntransformed.z += cos(uIslandTime * 0.53 + position.z * 0.34) * 0.075 * aWind;`,
    );
  };
  material.customProgramCacheKey = () => "island-foliage-wind-v1";
  return material;
}

function makeRocks(random: () => number, texture: THREE.DataTexture) {
  const geometry = new THREE.IcosahedronGeometry(1, 2);
  const positions = geometry.getAttribute("position");
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    const rough = 0.83 + fbm(x * 3 + 10, z * 3 + y * 2) * 0.32;
    positions.setXYZ(
      i,
      x * rough,
      y * rough * (1 + noise(x * 4, z * 4) * 0.15),
      z * rough,
    );
  }
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color: "#8b877a",
    roughness: 0.98,
    bumpMap: texture,
    bumpScale: 0.045,
  });
  const matrices: THREE.Matrix4[] = [];
  const shades: THREE.Color[] = [];
  const rotation = new THREE.Quaternion();
  for (let i = 0; i < 145; i++) {
    const shore = i < 69;
    const angle = random() * TAU;
    const radius = shore ? 0.92 + random() * 0.13 : 0.18 + random() * 0.65;
    const x = Math.cos(angle) * 29.5 * radius;
    const z = Math.sin(angle) * 26 * radius;
    const y = terrainHeight(x, z);
    if (
      inStoryCorridor(x, z) ||
      Math.hypot(x - LANDING_X, z - LANDING_Z) < 6 ||
      y < -0.75 ||
      y > 10.2
    )
      continue;
    const size = shore
      ? 0.24 + random() ** 2 * 1.3
      : 0.2 + random() ** 1.6 * 1.05;
    rotation.setFromEuler(
      new THREE.Euler(random() * 0.8, random() * TAU, random() * 0.6),
    );
    matrices.push(
      new THREE.Matrix4().compose(
        new THREE.Vector3(x, y + size * 0.23, z),
        rotation,
        new THREE.Vector3(
          size * (0.9 + random() * 0.65),
          size * (0.5 + random() * 0.5),
          size,
        ),
      ),
    );
    shades.push(
      new THREE.Color().setHSL(
        0.1,
        0.07 + random() * 0.06,
        (shore && y < 0.3 ? 0.29 : 0.4) + random() * 0.12,
      ),
    );
  }
  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
  matrices.forEach((matrix, i) => {
    mesh.setMatrixAt(i, matrix);
    mesh.setColorAt(i, shades[i]);
  });
  mesh.name = "weathered-shore-and-hillside-boulders";
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.computeBoundingSphere();
  return mesh;
}

export function createIsland(): {
  root: THREE.Group;
  update: (time: number) => void;
  landing: THREE.Vector3;
  mindPosition: THREE.Vector3;
} {
  const root = new THREE.Group();
  root.name = "cinematic-tropical-island";
  const random = randomSource(4257);
  const texture = grainTexture();
  root.add(buildTerrain(texture));
  const trunks: THREE.BufferGeometry[] = [];
  const leaves = new LeafBuilder();
  const coconuts: THREE.Vector3[] = [];
  let palms = 0;
  let attempts = 0;
  while (palms < 40 && attempts++ < 600) {
    const angle = random() * TAU;
    const radius = 0.39 + random() * 0.52;
    const x = Math.cos(angle) * 29 * radius;
    const z = Math.sin(angle) * 25 * radius;
    const y = terrainHeight(x, z);
    if (
      y < 0.55 ||
      y > 4.5 ||
      groundSlope(x, z) > 0.65 ||
      inStoryCorridor(x, z) ||
      Math.hypot(x - LANDING_X, z - LANDING_Z) < 7
    )
      continue;
    addPalm(x, z, 4.9 + random() * 3.4, random, trunks, leaves, coconuts);
    palms++;
  }
  // A few close silhouettes frame the clearing without obstructing its landing radius.
  for (const [x, z, height] of [
    [22.5, 13, 7.2],
    [7, 22, 6.4],
    [19, 7.4, 7.9],
  ]) {
    addPalm(x, z, height, random, trunks, leaves, coconuts);
  }
  for (let i = 0; i < 145; i++) {
    const x = (random() - 0.5) * 46;
    const z = (random() - 0.5) * 41;
    const y = terrainHeight(x, z);
    if (
      y < 1.2 ||
      y > 6.1 ||
      groundSlope(x, z) > 0.9 ||
      inStoryCorridor(x, z) ||
      Math.hypot(x - LANDING_X, z - LANDING_Z) < 6.2
    )
      continue;
    const tall = i < 34;
    const height = tall ? 1.9 + random() * 2.3 : 0.25 + random() * 0.65;
    const base = new THREE.Vector3(x, y, z);
    const crown = base
      .clone()
      .add(
        new THREE.Vector3(
          (random() - 0.5) * 0.55,
          height,
          (random() - 0.5) * 0.55,
        ),
      );
    if (tall)
      trunks.push(
        trunkGeometry(
          new THREE.CatmullRomCurve3([
            base,
            base.clone().lerp(crown, 0.6),
            crown,
          ]),
          0.065 + height * 0.018,
          new THREE.Color("#635b42"),
          7,
        ),
      );
    const leafCount = tall ? 24 : 9;
    for (let j = 0; j < leafCount; j++) {
      const angle = j * 2.39996;
      const length = tall ? 0.9 + random() * 1.1 : 0.5 + random() * 0.65;
      const start = crown
        .clone()
        .add(new THREE.Vector3(0, (random() - 0.5) * height * 0.48, 0));
      const end = start
        .clone()
        .add(
          new THREE.Vector3(
            Math.cos(angle) * length,
            0.12 - length * (0.3 + random() * 0.23),
            Math.sin(angle) * length,
          ),
        );
      const color = new THREE.Color().setHSL(
        0.24 + random() * 0.06,
        0.3 + random() * 0.18,
        0.15 + random() * 0.075,
      );
      leaves.ribbon(
        start,
        end,
        length * (tall ? 0.24 : 0.14),
        length * 0.29,
        color,
        tall ? 0.55 : 0.28,
        5,
      );
    }
  }
  for (let i = 0; i < 480; i++) {
    const x = (random() - 0.5) * 51;
    const z = (random() - 0.5) * 45;
    const y = terrainHeight(x, z);
    if (
      y < 1.1 ||
      y > 5.9 ||
      groundSlope(x, z) > 0.85 ||
      inStoryCorridor(x, z) ||
      Math.hypot(x - LANDING_X, z - LANDING_Z) < 5.1
    )
      continue;
    for (let j = 0; j < 4; j++) {
      const angle = random() * TAU;
      const height = 0.13 + random() * 0.28;
      const start = new THREE.Vector3(
        x + random() * 0.16,
        y,
        z + random() * 0.16,
      );
      const end = start
        .clone()
        .add(
          new THREE.Vector3(
            Math.cos(angle) * height * 0.65,
            height,
            Math.sin(angle) * height * 0.65,
          ),
        );
      leaves.ribbon(
        start,
        end,
        0.018,
        height * 0.08,
        new THREE.Color("#596a36").multiplyScalar(0.72 + random() * 0.5),
        0.18,
        2,
      );
    }
  }
  const trunkMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    bumpMap: texture,
    bumpScale: 0.025,
  });
  const trunkMesh = new THREE.Mesh(
    mergeGeometries(trunks, false),
    trunkMaterial,
  );
  trunks.forEach((geometry) => geometry.dispose());
  trunkMesh.name = "curved-ringed-palm-and-thicket-trunks";
  trunkMesh.castShadow = trunkMesh.receiveShadow = true;
  root.add(trunkMesh);
  const time = { value: 0 };
  const leafMesh = new THREE.Mesh(leaves.geometry(), foliageMaterial(time));
  leafMesh.name = "feathered-palm-fronds-and-tropical-understory";
  leafMesh.castShadow = leafMesh.receiveShadow = true;
  root.add(leafMesh, makeRocks(random, texture));
  const coconutMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.135, 7, 5),
    new THREE.MeshStandardMaterial({ color: "#675139", roughness: 0.96 }),
    coconuts.length,
  );
  coconuts.forEach((position, i) =>
    coconutMesh.setMatrixAt(
      i,
      new THREE.Matrix4().makeTranslation(position.x, position.y, position.z),
    ),
  );
  coconutMesh.name = "coconuts-under-palm-crowns";
  coconutMesh.castShadow = true;
  root.add(coconutMesh);
  const landing = new THREE.Vector3(
    LANDING_X,
    terrainHeight(LANDING_X, LANDING_Z),
    LANDING_Z,
  );
  const mindPosition = new THREE.Vector3(
    LANDING_X - 4,
    terrainHeight(LANDING_X - 4, LANDING_Z - 3) + 0.7,
    LANDING_Z - 3,
  );
  const glowGeometry = new THREE.SphereGeometry(0.035, 6, 4);
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: "#61bbad",
    emissive: "#228f89",
    emissiveIntensity: 0.65,
    roughness: 0.65,
  });
  const glow = new THREE.InstancedMesh(glowGeometry, glowMaterial, 19);
  for (let i = 0; i < 19; i++) {
    const angle = random() * TAU;
    const radius = 0.65 + random() * 0.85;
    const x = mindPosition.x + Math.cos(angle) * radius;
    const z = mindPosition.z + Math.sin(angle) * radius;
    const scale = new THREE.Vector3(1, 1.2 + random() * 1.8, 1);
    glow.setMatrixAt(
      i,
      new THREE.Matrix4().compose(
        new THREE.Vector3(x, terrainHeight(x, z) + 0.055, z),
        new THREE.Quaternion(),
        scale,
      ),
    );
  }
  glow.name = "quiet-mind-clearing-flora";
  root.add(glow);
  root.userData.island = {
    palms: palms + 3,
    terrainTriangles: 160 * 160 * 2,
    foliageTriangles: leaves.positions.length / 9,
    drawCalls: 6,
  };
  return {
    root,
    landing,
    mindPosition,
    update: (elapsed: number) => {
      time.value = elapsed;
    },
  };
}
