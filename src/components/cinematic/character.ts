import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

type Material = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
type Ring = { y: number; x: number; z: number; cx?: number; cz?: number };
type Point = [number, number, number];

/** An articulated, front-facing character. Scene placement stays on the root. */
export function createCharacter(): {
  root: THREE.Group;
  pose: (phase: number, time: number) => void;
  eyeOpen: (amount: number) => void;
  head: THREE.Group;
  perform: (
    kind: "walk" | "touch" | "duck",
    amount: number,
    time: number,
  ) => void;
  hand: THREE.Group;
} {
  const root = new THREE.Group();
  root.name = "David — cinematic character";
  const pelvis = new THREE.Group();
  root.add(pelvis);
  const torso = new THREE.Group();
  pelvis.add(torso);
  const head = new THREE.Group();
  head.position.set(0, 1.425, 0.01);
  head.scale.set(0.86, 0.88, 0.88);
  torso.add(head);

  const standard = (color: string, roughness = 0.65, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const skin = standard("#b97f62", 0.72);
  const skinLight = standard("#ca9676", 0.72);
  const skinShadow = standard("#915d50", 0.78);
  const lip = standard("#87584d", 0.75);
  const hair = standard("#19171b", 0.9);
  const hairLight = standard("#282329", 0.83);
  const undercut = standard("#453a47", 0.94);
  const yellow = standard("#dce516", 0.58);
  const yellowLight = standard("#eef535", 0.6);
  const yellowShadow = standard("#9ba619", 0.72);
  const yellowSeam = standard("#7d8618", 0.8);
  const lining = standard("#17282e", 0.8);
  const cyan = new THREE.MeshStandardMaterial({
    color: "#59ced5",
    roughness: 0.46,
    metalness: 0.12,
    emissive: "#1a6068",
    emissiveIntensity: 0.12,
  });
  const reflective = new THREE.MeshPhysicalMaterial({
    color: "#c4f7ed",
    roughness: 0.24,
    metalness: 0.32,
    clearcoat: 0.25,
  });
  const charcoal = standard("#181d24", 0.93);
  const trousers = standard("#344c5b", 0.88);
  const clothLight = standard("#425e6c", 0.87);
  const clothDark = standard("#243441", 0.96);
  const graphite = standard("#3d464e", 0.59, 0.15);
  const silver = standard("#899b9d", 0.38, 0.5);
  const rubber = standard("#172127", 0.93);
  const gold = standard("#bcac58", 0.32, 0.72);
  const eyeWhite = standard("#d9d9bd", 0.38);
  const irisMaterial = standard("#7e8e71", 0.35);
  const pupilMaterial = standard("#11171a", 0.28);
  const sphere = new THREE.SphereGeometry(1, 24, 18);
  const rounded = new Map<string, THREE.BufferGeometry>();

  function mesh(
    geometry: THREE.BufferGeometry,
    material: Material,
    parent: THREE.Object3D,
    position: Point = [0, 0, 0],
  ) {
    const result = new THREE.Mesh(geometry, material);
    result.position.set(...position);
    result.castShadow = true;
    result.receiveShadow = true;
    parent.add(result);
    return result;
  }
  function ellipsoid(
    parent: THREE.Object3D,
    material: Material,
    position: Point,
    scale: Point,
  ) {
    const result = mesh(sphere, material, parent, position);
    result.scale.set(...scale);
    return result;
  }
  function box(
    parent: THREE.Object3D,
    material: Material,
    position: Point,
    size: Point,
    radius = 0.025,
  ) {
    const key = `${size.join(",")}:${radius}`;
    if (!rounded.has(key))
      rounded.set(key, new RoundedBoxGeometry(...size, 3, radius));
    return mesh(rounded.get(key)!, material, parent, position);
  }
  function tube(
    parent: THREE.Object3D,
    material: Material,
    points: Point[],
    radius = 0.008,
    segments = 24,
  ) {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
    );
    return mesh(
      new THREE.TubeGeometry(curve, segments, radius, 6, false),
      material,
      parent,
    );
  }
  function panel(
    parent: THREE.Object3D,
    material: Material,
    points: [number, number][],
    depth: number,
    z: number,
    bevel = 0.008,
  ) {
    const shape = new THREE.Shape(points.map((p) => new THREE.Vector2(...p)));
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
      steps: 1,
      curveSegments: 8,
    });
    return mesh(geometry, material, parent, [0, 0, z]);
  }
  function ringGeometry(
    rings: Ring[],
    sides = 32,
    start = 0,
    end = Math.PI * 2,
    square = 1,
  ) {
    const vertices: number[] = [];
    const indices: number[] = [];
    const closed = end - start > Math.PI * 2 - 0.001;
    const ascending = rings[rings.length - 1].y > rings[0].y;
    for (const r of rings) {
      for (let j = 0; j <= sides; j++) {
        const angle = start + (j / sides) * (end - start);
        const sx = Math.sin(angle),
          sz = Math.cos(angle);
        vertices.push(
          (r.cx ?? 0) + r.x * Math.sign(sx) * Math.pow(Math.abs(sx), square),
          r.y,
          (r.cz ?? 0) + r.z * Math.sign(sz) * Math.pow(Math.abs(sz), square),
        );
      }
    }
    for (let i = 0; i < rings.length - 1; i++)
      for (let j = 0; j < sides; j++) {
        const a = i * (sides + 1) + j,
          b = a + sides + 1;
        if (ascending) indices.push(a, a + 1, b, a + 1, b + 1, b);
        else indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    if (closed) {
      for (const row of [0, rings.length - 1]) {
        const r = rings[row],
          center = vertices.length / 3;
        vertices.push(r.cx ?? 0, r.y, r.cz ?? 0);
        for (let j = 0; j < sides; j++) {
          const a = row * (sides + 1) + j;
          if ((row === 0) === ascending) indices.push(center, a + 1, a);
          else indices.push(center, a, a + 1);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }
  function body(
    parent: THREE.Object3D,
    material: Material,
    rings: Ring[],
    sides = 32,
    square = 1,
  ) {
    return mesh(
      ringGeometry(rings, sides, 0, Math.PI * 2, square),
      material,
      parent,
    );
  }
  function frontRibbon(
    parent: THREE.Object3D,
    material: Material,
    points: [number, number][],
    width: number,
    z: number,
  ) {
    const left: [number, number][] = [],
      right: [number, number][] = [];
    points.forEach((p, i) => {
      const a = points[Math.max(0, i - 1)],
        b = points[Math.min(points.length - 1, i + 1)];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const nx = ((-(b[1] - a[1]) / length) * width) / 2,
        ny = (((b[0] - a[0]) / length) * width) / 2;
      left.push([p[0] + nx, p[1] + ny]);
      right.push([p[0] - nx, p[1] - ny]);
    });
    return panel(
      parent,
      material,
      [...left, ...right.reverse()],
      0.008,
      z,
      0.002,
    );
  }

  // A continuous jaw and cranium keep the face readable from the side, too.
  body(
    head,
    skin,
    [
      { y: -0.29, x: 0.055, z: 0.075, cz: 0.045 },
      { y: -0.25, x: 0.105, z: 0.102, cz: 0.028 },
      { y: -0.18, x: 0.166, z: 0.135, cz: 0.005 },
      { y: -0.07, x: 0.218, z: 0.164 },
      { y: 0.06, x: 0.241, z: 0.181 },
      { y: 0.19, x: 0.24, z: 0.176, cz: -0.009 },
      { y: 0.29, x: 0.213, z: 0.151, cz: -0.012 },
      { y: 0.35, x: 0.147, z: 0.109, cz: -0.017 },
      { y: 0.375, x: 0.035, z: 0.035, cz: -0.025 },
    ],
    48,
  );
  body(torso, skin, [
    { y: 0.96, x: 0.12, z: 0.108 },
    { y: 1.1, x: 0.102, z: 0.105 },
    { y: 1.18, x: 0.12, z: 0.11 },
  ]);
  for (const side of [-1, 1]) {
    ellipsoid(
      head,
      skin,
      [side * 0.239, -0.018, -0.005],
      [0.048, 0.099, 0.039],
    );
    ellipsoid(
      head,
      skinShadow,
      [side * 0.257, -0.012, 0.023],
      [0.022, 0.058, 0.012],
    );
    tube(
      head,
      skinLight,
      [
        [side * 0.251, 0.05, 0.031],
        [side * 0.274, 0.026, 0.032],
        [side * 0.271, -0.047, 0.027],
        [side * 0.251, -0.07, 0.024],
      ],
      0.007,
      12,
    );
    tube(
      head,
      skinShadow,
      [
        [side * 0.175, -0.12, 0.119],
        [side * 0.13, -0.21, 0.125],
        [side * 0.045, -0.27, 0.12],
      ],
      0.0035,
      12,
    );
  }
  const noseVertices = new Float32Array([
    -0.025, 0.115, 0.172, 0.025, 0.115, 0.172, -0.027, -0.035, 0.235, 0.027,
    -0.035, 0.235, 0, -0.044, 0.265, -0.039, -0.066, 0.207, 0.039, -0.066,
    0.207, 0, -0.074, 0.229,
  ]);
  const nose = new THREE.BufferGeometry();
  nose.setAttribute("position", new THREE.BufferAttribute(noseVertices, 3));
  nose.setIndex([
    0, 2, 4, 0, 4, 1, 1, 4, 3, 2, 5, 7, 2, 7, 4, 4, 7, 6, 4, 6, 3, 5, 6, 7,
  ]);
  nose.computeVertexNormals();
  mesh(nose, skinLight, head);
  ellipsoid(head, skinShadow, [-0.026, -0.061, 0.227], [0.011, 0.005, 0.007]);
  ellipsoid(head, skinShadow, [0.026, -0.061, 0.227], [0.011, 0.005, 0.007]);
  tube(
    head,
    lip,
    [
      [-0.063, -0.157, 0.168],
      [-0.031, -0.146, 0.183],
      [0, -0.148, 0.188],
      [0.032, -0.146, 0.183],
      [0.063, -0.157, 0.168],
    ],
    0.005,
    20,
  );
  tube(
    head,
    skinLight,
    [
      [-0.038, -0.173, 0.173],
      [0, -0.177, 0.181],
      [0.038, -0.173, 0.173],
    ],
    0.007,
    14,
  );
  const eyes: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(side * 0.107, 0.075, 0.169);
    eye.rotation.y = side * 0.13;
    head.add(eye);
    eyes.push(eye);
    const almond = new THREE.Shape();
    almond.moveTo(-0.073, 0);
    almond.quadraticCurveTo(-0.033, 0.037, 0.009, 0.031);
    almond.quadraticCurveTo(0.048, 0.025, 0.073, 0.003);
    almond.quadraticCurveTo(0.023, -0.031, -0.02, -0.024);
    almond.quadraticCurveTo(-0.052, -0.02, -0.073, 0);
    mesh(new THREE.ShapeGeometry(almond, 16), eyeWhite, eye, [0, 0, 0.007]);
    ellipsoid(
      eye,
      irisMaterial,
      [side * -0.005, 0.002, 0.013],
      [0.029, 0.029, 0.008],
    );
    ellipsoid(
      eye,
      pupilMaterial,
      [side * -0.005, 0.002, 0.019],
      [0.013, 0.022, 0.005],
    );
    ellipsoid(eye, eyeWhite, [-0.012, 0.012, 0.023], [0.006, 0.006, 0.002]);
    tube(
      eye,
      hair,
      [
        [-0.074, 0, 0.01],
        [-0.036, 0.029, 0.014],
        [0.012, 0.031, 0.015],
        [0.072, 0.005, 0.01],
      ],
      0.006,
      18,
    );
    tube(
      eye,
      skinShadow,
      [
        [-0.066, -0.004, 0.01],
        [-0.026, -0.025, 0.012],
        [0.025, -0.023, 0.011],
        [0.069, 0, 0.009],
      ],
      0.003,
      18,
    );
    const brow = panel(
      head,
      hair,
      [
        [-0.078, 0.012],
        [-0.039, 0.031],
        [0.024, 0.024],
        [0.073, 0.003],
        [0.067, -0.011],
        [0.015, 0.007],
        [-0.038, 0.014],
        [-0.077, -0.001],
      ],
      0.009,
      0.174,
    );
    brow.position.x = side * 0.108;
    brow.position.y = 0.142;
    brow.rotation.z = side * -0.07;
  }

  body(
    head,
    undercut,
    [
      { y: 0.1, x: 0.239, z: 0.174, cz: -0.01 },
      { y: 0.22, x: 0.246, z: 0.177, cz: -0.011 },
      { y: 0.3, x: 0.218, z: 0.16, cz: -0.018 },
    ],
    40,
  );
  body(
    head,
    hair,
    [
      { y: 0.205, x: 0.243, z: 0.186, cz: -0.025 },
      { y: 0.29, x: 0.252, z: 0.186, cz: -0.03 },
      { y: 0.37, x: 0.216, z: 0.151, cz: -0.035 },
      { y: 0.42, x: 0.13, z: 0.092, cz: -0.04 },
    ],
    36,
  );
  const locks: { root: Point; tip: Point; width: number; depth: number }[] = [
    {
      root: [-0.18, 0.235, 0.103],
      tip: [-0.306, 0.42, 0.055],
      width: 0.09,
      depth: 0.105,
    },
    {
      root: [-0.12, 0.255, 0.101],
      tip: [-0.217, 0.555, -0.023],
      width: 0.112,
      depth: 0.126,
    },
    {
      root: [-0.015, 0.263, 0.113],
      tip: [-0.104, 0.525, -0.056],
      width: 0.105,
      depth: 0.13,
    },
    {
      root: [0.09, 0.271, 0.087],
      tip: [0.015, 0.496, -0.079],
      width: 0.113,
      depth: 0.119,
    },
    {
      root: [0.177, 0.269, 0.042],
      tip: [0.137, 0.435, -0.091],
      width: 0.089,
      depth: 0.1,
    },
    {
      root: [-0.06, 0.29, -0.1],
      tip: [-0.149, 0.549, -0.15],
      width: 0.13,
      depth: 0.09,
    },
  ];
  locks.forEach((lock, i) => {
    const [x, y, z] = lock.root,
      [tx, ty, tz] = lock.tip;
    body(
      head,
      i % 3 === 0 ? hairLight : hair,
      [
        { y, x: lock.width, z: lock.depth, cx: x, cz: z },
        {
          y: y + (ty - y) * 0.5,
          x: lock.width * 0.69,
          z: lock.depth * 0.62,
          cx: THREE.MathUtils.lerp(x, tx, 0.42),
          cz: THREE.MathUtils.lerp(z, tz, 0.5),
        },
        { y: ty, x: 0.003, z: 0.003, cx: tx, cz: tz },
      ],
      7,
    );
  });
  // The shaved temple and inset plates are asymmetric in the reference.
  const temple = panel(
    head,
    silver,
    [
      [-0.092, -0.032],
      [-0.098, 0.103],
      [-0.035, 0.146],
      [0.035, 0.084],
      [0.046, -0.054],
      [0.012, -0.083],
    ],
    0.012,
    0,
  );
  temple.position.set(0.238, 0.158, 0.008);
  temple.rotation.y = Math.PI / 2;
  for (let i = 0; i < 4; i++)
    tube(
      head,
      graphite,
      [
        [0.25, 0.104 + i * 0.033, 0.063],
        [0.255, 0.122 + i * 0.033, 0.027],
        [0.253, 0.128 + i * 0.033, -0.014],
      ],
      0.005,
      8,
    );
  ellipsoid(head, graphite, [0.257, 0.082, 0.053], [0.009, 0.012, 0.008]);

  body(
    torso,
    charcoal,
    [
      { y: -0.09, x: 0.325, z: 0.181 },
      { y: 0.27, x: 0.32, z: 0.181 },
      { y: 0.66, x: 0.35, z: 0.183 },
      { y: 0.87, x: 0.37, z: 0.18 },
      { y: 0.94, x: 0.2, z: 0.132 },
    ],
    40,
    0.8,
  );
  tube(
    torso,
    graphite,
    [
      [-0.18, 0.927, 0.118],
      [-0.1, 0.89, 0.182],
      [0, 0.875, 0.19],
      [0.1, 0.89, 0.182],
      [0.18, 0.927, 0.118],
    ],
    0.013,
    28,
  );
  body(
    torso,
    yellow,
    [
      { y: -0.17, x: 0.455, z: 0.23 },
      { y: -0.1, x: 0.485, z: 0.245 },
      { y: 0.32, x: 0.463, z: 0.24 },
      { y: 0.68, x: 0.49, z: 0.246 },
      { y: 0.88, x: 0.407, z: 0.209 },
    ],
    48,
    0.63,
  );
  // The open padded fronts cover the center of the shell with a dark inset shirt.
  panel(
    torso,
    charcoal,
    [
      [-0.151, -0.2],
      [0.151, -0.2],
      [0.165, 0.8],
      [0.217, 0.92],
      [-0.217, 0.92],
      [-0.165, 0.8],
    ],
    0.015,
    0.246,
    0.003,
  );
  for (const side of [-1, 1]) {
    const mirror = (points: [number, number][]): [number, number][] =>
      points.map(([x, y]) => [x * side, y]);
    panel(
      torso,
      yellowLight,
      mirror([
        [0.16, -0.18],
        [0.456, -0.13],
        [0.476, 0.13],
        [0.443, 0.4],
        [0.484, 0.693],
        [0.378, 0.864],
        [0.19, 0.78],
        [0.164, 0.4],
      ]),
      0.046,
      0.216,
      0.02,
    );
    tube(
      torso,
      lining,
      [
        [side * 0.162, -0.173, 0.287],
        [side * 0.168, 0.2, 0.287],
        [side * 0.172, 0.56, 0.283],
        [side * 0.192, 0.779, 0.266],
      ],
      0.011,
      32,
    );
    tube(
      torso,
      yellowSeam,
      [
        [side * 0.448, -0.098, 0.265],
        [side * 0.43, 0.26, 0.281],
        [side * 0.454, 0.66, 0.269],
      ],
      0.005,
      28,
    );
    frontRibbon(
      torso,
      reflective,
      mirror([
        [0.281, 0.819],
        [0.359, 0.618],
        [0.228, 0.445],
      ]),
      0.063,
      0.286,
    );
    frontRibbon(
      torso,
      cyan,
      mirror([
        [0.281, 0.819],
        [0.359, 0.618],
        [0.228, 0.445],
      ]),
      0.012,
      0.298,
    );
    panel(
      torso,
      reflective,
      mirror([
        [0.177, 0.244],
        [0.449, 0.244],
        [0.447, 0.335],
        [0.178, 0.335],
      ]),
      0.01,
      0.285,
      0.002,
    );
    frontRibbon(
      torso,
      reflective,
      mirror([
        [0.177, -0.065],
        [0.284, -0.067],
        [0.416, 0.071],
      ]),
      0.065,
      0.291,
    );
    frontRibbon(
      torso,
      cyan,
      mirror([
        [0.177, -0.065],
        [0.284, -0.067],
        [0.416, 0.071],
      ]),
      0.01,
      0.303,
    );
    panel(
      torso,
      yellowShadow,
      mirror([
        [0.211, 0.031],
        [0.381, 0.047],
        [0.419, 0.167],
        [0.23, 0.173],
      ]),
      0.025,
      0.282,
      0.01,
    );
    tube(
      torso,
      yellowSeam,
      [
        [side * 0.23, 0.157, 0.323],
        [side * 0.391, 0.158, 0.318],
      ],
      0.005,
      12,
    );
    box(
      torso,
      silver,
      [side * 0.232, 0.151, 0.33],
      [0.025, 0.021, 0.012],
      0.003,
    );
    panel(
      torso,
      lining,
      mirror([
        [0.17, 0.793],
        [0.218, 1.099],
        [0.475, 1.212],
        [0.588, 1.087],
        [0.36, 0.79],
      ]),
      0.044,
      0.061,
      0.014,
    );
    panel(
      torso,
      cyan,
      mirror([
        [0.202, 0.824],
        [0.241, 1.071],
        [0.476, 1.177],
        [0.538, 1.084],
        [0.343, 0.842],
      ]),
      0.014,
      0.11,
      0.009,
    );
    tube(
      torso,
      silver,
      [
        [side * 0.211, 1.098, 0.112],
        [side * 0.475, 1.216, 0.103],
        [side * 0.582, 1.087, 0.103],
      ],
      0.012,
      18,
    );
    tube(
      torso,
      yellowShadow,
      [
        [side * 0.181, 0.803, 0.154],
        [side * 0.247, 0.927, 0.161],
        [side * 0.231, 1.063, 0.145],
      ],
      0.012,
      18,
    );
  }
  mesh(
    ringGeometry(
      [
        { y: 0.89, x: 0.31, z: 0.21 },
        { y: 1.08, x: 0.408, z: 0.269 },
        { y: 1.13, x: 0.43, z: 0.282 },
      ],
      32,
      0.94,
      Math.PI * 2 - 0.94,
    ),
    lining,
    torso,
  );
  tube(
    torso,
    gold,
    [
      [-0.181, 0.851, 0.224],
      [-0.128, 0.72, 0.273],
      [0.012, 0.65, 0.279],
      [0.131, 0.703, 0.27],
      [0.184, 0.849, 0.224],
    ],
    0.006,
    36,
  );
  tube(
    torso,
    gold,
    [
      [-0.182, 0.839, 0.22],
      [-0.122, 0.57, 0.278],
      [0.015, 0.417, 0.283],
      [0.126, 0.566, 0.274],
      [0.184, 0.839, 0.22],
    ],
    0.006,
    36,
  );
  panel(
    torso,
    gold,
    [
      [-0.006, 0.414],
      [0.031, 0.387],
      [0.019, 0.36],
      [0.028, 0.319],
      [0.012, 0.294],
      [0.002, 0.356],
      [-0.018, 0.372],
    ],
    0.011,
    0.283,
    0.002,
  );
  body(
    pelvis,
    clothDark,
    [
      { y: -0.16, x: 0.337, z: 0.188 },
      { y: -0.04, x: 0.36, z: 0.206 },
      { y: 0.025, x: 0.331, z: 0.183 },
    ],
    36,
    0.7,
  );
  box(pelvis, graphite, [0, -0.026, 0.218], [0.11, 0.071, 0.026], 0.008);
  box(pelvis, silver, [0, -0.026, 0.235], [0.061, 0.039, 0.009], 0.004);

  const shoulders: THREE.Group[] = [],
    elbows: THREE.Group[] = [],
    wrists: THREE.Group[] = [];
  const hips: THREE.Group[] = [],
    knees: THREE.Group[] = [],
    ankles: THREE.Group[] = [];
  function hand(parent: THREE.Object3D, side: number) {
    const palm = new THREE.Group();
    parent.add(palm);
    body(
      palm,
      skin,
      [
        { y: 0.025, x: 0.071, z: 0.049 },
        { y: -0.031, x: 0.088, z: 0.052 },
        { y: -0.122, x: 0.081, z: 0.045 },
        { y: -0.15, x: 0.059, z: 0.036 },
      ],
      24,
    );
    for (let f = 0; f < 4; f++) {
      const x = (f - 1.5) * 0.041;
      const length = [0.105, 0.143, 0.151, 0.119][f];
      tube(
        palm,
        skin,
        [
          [x, -0.119, 0.005],
          [x + side * 0.006, -0.163, 0.018],
          [x + side * 0.008, -0.119 - length * 0.75, 0.041],
          [x, -0.119 - length, 0.06],
        ],
        0.0195,
        12,
      );
      ellipsoid(
        palm,
        skinLight,
        [x, -0.12 - length * 0.88, 0.071],
        [0.012, 0.019, 0.004],
      );
    }
    tube(
      palm,
      skin,
      [
        [side * 0.071, -0.025, 0.012],
        [side * 0.112, -0.071, 0.042],
        [side * 0.115, -0.124, 0.065],
        [side * 0.092, -0.159, 0.072],
      ],
      0.025,
      14,
    );
    tube(
      palm,
      skinShadow,
      [
        [-0.044, -0.067, 0.049],
        [0, -0.075, 0.054],
        [0.041, -0.067, 0.048],
      ],
      0.0024,
      10,
    );
    return palm;
  }
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.452, 0.805, -0.001);
    torso.add(shoulder);
    shoulders.push(shoulder);
    body(
      shoulder,
      yellow,
      [
        { y: 0.068, x: 0.142, z: 0.14 },
        { y: 0.012, x: 0.204, z: 0.205 },
        { y: -0.13, x: 0.235, z: 0.221 },
        { y: -0.36, x: 0.215, z: 0.209 },
        { y: -0.556, x: 0.202, z: 0.187 },
      ],
      36,
      0.87,
    );
    tube(
      shoulder,
      yellowSeam,
      [
        [side * 0.106, 0.028, 0.166],
        [side * 0.199, -0.144, 0.164],
        [side * 0.177, -0.352, 0.161],
      ],
      0.005,
      20,
    );
    body(
      shoulder,
      reflective,
      [
        { y: -0.236, x: 0.226, z: 0.216 },
        { y: -0.333, x: 0.222, z: 0.215 },
      ],
      36,
      0.87,
    );
    body(
      shoulder,
      cyan,
      [
        { y: -0.276, x: 0.228, z: 0.219 },
        { y: -0.289, x: 0.228, z: 0.219 },
      ],
      36,
      0.87,
    );
    const patch = ellipsoid(
      shoulder,
      yellowShadow,
      [side * 0.182, -0.106, 0.098],
      [0.055, 0.09, 0.025],
    );
    patch.rotation.z = side * 0.25;
    const elbow = new THREE.Group();
    elbow.position.y = -0.548;
    shoulder.add(elbow);
    elbows.push(elbow);
    body(
      elbow,
      yellow,
      [
        { y: 0.035, x: 0.2, z: 0.187 },
        { y: -0.053, x: 0.232, z: 0.217 },
        { y: -0.17, x: 0.245, z: 0.213 },
        { y: -0.305, x: 0.212, z: 0.18 },
        { y: -0.414, x: 0.132, z: 0.124 },
      ],
      36,
      0.84,
    );
    tube(
      elbow,
      yellowShadow,
      [
        [-0.169, -0.132, 0.143],
        [-0.04, -0.15, 0.218],
        [0.12, -0.104, 0.183],
      ],
      0.012,
      20,
    );
    tube(
      elbow,
      yellowSeam,
      [
        [-0.14, -0.3, 0.128],
        [0.02, -0.32, 0.18],
        [0.149, -0.274, 0.145],
      ],
      0.005,
      20,
    );
    body(
      elbow,
      yellowShadow,
      [
        { y: -0.394, x: 0.133, z: 0.125 },
        { y: -0.462, x: 0.119, z: 0.113 },
      ],
      32,
    );
    for (let rib = -2; rib <= 2; rib++)
      tube(
        elbow,
        yellowSeam,
        [
          [rib * 0.031, -0.401, 0.119 - Math.abs(rib) * 0.007],
          [rib * 0.028, -0.451, 0.11 - Math.abs(rib) * 0.006],
        ],
        0.0025,
        6,
      );
    const wrist = new THREE.Group();
    wrist.position.set(0, -0.469, 0.002);
    elbow.add(wrist);
    wrists.push(wrist);
    hand(wrist, side);
    if (side > 0) {
      body(
        wrist,
        graphite,
        [
          { y: -0.014, x: 0.077, z: 0.054 },
          { y: -0.052, x: 0.085, z: 0.057 },
        ],
        24,
      );
      box(wrist, silver, [0, -0.034, 0.06], [0.07, 0.036, 0.017], 0.005);
    }

    const hip = new THREE.Group();
    hip.position.set(side * 0.207, -0.02, -0.004);
    pelvis.add(hip);
    hips.push(hip);
    body(
      hip,
      trousers,
      [
        { y: 0.02, x: 0.205, z: 0.186 },
        { y: -0.095, x: 0.231, z: 0.213 },
        { y: -0.3, x: 0.226, z: 0.207, cx: side * 0.011 },
        { y: -0.493, x: 0.205, z: 0.18 },
        { y: -0.616, x: 0.181, z: 0.169 },
        { y: -0.714, x: 0.168, z: 0.16 },
      ],
      36,
      0.88,
    );
    tube(
      hip,
      clothLight,
      [
        [side * 0.19, -0.041, 0.08],
        [side * 0.223, -0.23, 0.055],
        [side * 0.188, -0.49, 0.05],
      ],
      0.006,
      22,
    );
    tube(
      hip,
      clothDark,
      [
        [-0.106, -0.407, 0.15],
        [-0.025, -0.457, 0.188],
        [0.122, -0.47, 0.142],
      ],
      0.008,
      20,
    );
    panel(
      hip,
      clothDark,
      [
        [-0.157, -0.55],
        [-0.095, -0.606],
        [0.105, -0.577],
        [0.156, -0.533],
        [0.041, -0.555],
      ],
      0.006,
      0.143,
      0.002,
    );
    const knee = new THREE.Group();
    knee.position.y = -0.69;
    hip.add(knee);
    knees.push(knee);
    body(
      knee,
      trousers,
      [
        { y: 0.032, x: 0.169, z: 0.159 },
        { y: -0.064, x: 0.188, z: 0.186, cz: 0.007 },
        { y: -0.172, x: 0.203, z: 0.171 },
        { y: -0.27, x: 0.174, z: 0.152 },
        { y: -0.343, x: 0.188, z: 0.16 },
        { y: -0.443, x: 0.162, z: 0.144 },
        { y: -0.539, x: 0.173, z: 0.147 },
        { y: -0.585, x: 0.114, z: 0.112 },
      ],
      36,
      0.88,
    );
    panel(
      knee,
      clothDark,
      [
        [-0.152, -0.129],
        [-0.041, -0.191],
        [0.107, -0.2],
        [0.157, -0.167],
        [0.032, -0.175],
      ],
      0.006,
      0.151,
      0.002,
    );
    panel(
      knee,
      clothLight,
      [
        [-0.14, -0.334],
        [-0.031, -0.37],
        [0.153, -0.309],
        [0.069, -0.365],
        [-0.051, -0.386],
      ],
      0.008,
      0.131,
      0.002,
    );
    tube(
      knee,
      clothDark,
      [
        [-0.118, -0.472, 0.1],
        [-0.02, -0.502, 0.149],
        [0.132, -0.465, 0.105],
      ],
      0.008,
      18,
    );
    body(
      knee,
      clothDark,
      [
        { y: -0.57, x: 0.121, z: 0.115 },
        { y: -0.646, x: 0.109, z: 0.106 },
      ],
      32,
    );
    const ankle = new THREE.Group();
    ankle.position.y = -0.64;
    knee.add(ankle);
    ankles.push(ankle);
    const sole = box(
      ankle,
      rubber,
      [0, -0.151, 0.095],
      [0.333, 0.129, 0.585],
      0.065,
    );
    sole.name = "shaped rubber outsole";
    box(ankle, silver, [0, -0.096, 0.098], [0.327, 0.059, 0.567], 0.039);
    const upper = new THREE.Group();
    upper.position.set(0, -0.043, 0.08);
    upper.rotation.x = Math.PI / 2;
    ankle.add(upper);
    body(
      upper,
      graphite,
      [
        { y: -0.257, x: 0.12, z: 0.07 },
        { y: -0.23, x: 0.153, z: 0.078 },
        { y: -0.08, x: 0.153, z: 0.109 },
        { y: 0.08, x: 0.139, z: 0.124 },
        { y: 0.225, x: 0.112, z: 0.091 },
      ],
      32,
      0.82,
    );
    box(ankle, silver, [0, -0.021, 0.28], [0.261, 0.08, 0.147], 0.037);
    box(ankle, lining, [0, 0.082, -0.015], [0.199, 0.212, 0.219], 0.045);
    const tongue = box(
      ankle,
      silver,
      [0, 0.087, 0.071],
      [0.131, 0.229, 0.041],
      0.024,
    );
    tongue.rotation.x = -0.2;
    box(ankle, cyan, [0, 0.134, 0.097], [0.083, 0.024, 0.014], 0.005);
    for (const z of [0.097, 0.199]) {
      const strap = box(
        ankle,
        cyan,
        [0, 0.033 - z * 0.12, z],
        [0.279, 0.044, 0.053],
        0.014,
      );
      strap.rotation.x = -0.2;
      tube(
        ankle,
        lining,
        [
          [-0.127, 0.032 - z * 0.12, z + 0.03],
          [0, 0.054 - z * 0.12, z + 0.029],
          [0.127, 0.032 - z * 0.12, z + 0.03],
        ],
        0.004,
        12,
      );
    }
    for (let lace = 0; lace < 3; lace++)
      tube(
        ankle,
        reflective,
        [
          [-0.062, 0.107 - lace * 0.028, 0.087 + lace * 0.026],
          [0.063, 0.081 - lace * 0.027, 0.11 + lace * 0.027],
        ],
        0.0045,
        8,
      );
    box(ankle, rubber, [0, -0.142, 0.381], [0.205, 0.073, 0.026], 0.01);
    for (let tread = 0; tread < 4; tread++)
      box(
        ankle,
        graphite,
        [side * 0.165, -0.169, -0.08 + tread * 0.119],
        [0.011, 0.029, 0.036],
        0.003,
      );
  }

  type Key = {
    p: number;
    y: number;
    lean: number;
    tilt: number;
    neck: number;
    arm: number;
    armX: number;
    elbow: number;
    hipL: number;
    hipR: number;
    spread: number;
    kneeL: number;
    kneeR: number;
  };
  const keys: Key[] = [
    {
      p: 0,
      y: 1.57,
      lean: -0.08,
      tilt: 0.03,
      neck: -0.12,
      arm: 1.34,
      armX: 0.24,
      elbow: 0.42,
      hipL: -0.4,
      hipR: 0.12,
      spread: 0.36,
      kneeL: 1.03,
      kneeR: 0.47,
    },
    {
      p: 0.24,
      y: 1.5,
      lean: 0.12,
      tilt: -0.03,
      neck: 0.05,
      arm: 1.08,
      armX: -0.12,
      elbow: 0.08,
      hipL: -0.42,
      hipR: -0.29,
      spread: 0.16,
      kneeL: 0.89,
      kneeR: 0.67,
    },
    {
      p: 0.29,
      y: 1.11,
      lean: 0.34,
      tilt: -0.04,
      neck: -0.08,
      arm: 0.6,
      armX: -0.75,
      elbow: -0.91,
      hipL: -1.05,
      hipR: -1.08,
      spread: 0.16,
      kneeL: 1.71,
      kneeR: 1.78,
    },
    {
      p: 0.35,
      y: 0.91,
      lean: 0.65,
      tilt: 0.08,
      neck: 0.16,
      arm: 0.45,
      armX: -0.9,
      elbow: -0.46,
      hipL: -1.22,
      hipR: -1.15,
      spread: 0.19,
      kneeL: 1.91,
      kneeR: 1.91,
    },
    {
      p: 0.4,
      y: 0.73,
      lean: 1.05,
      tilt: 0.08,
      neck: 0.18,
      arm: 0.36,
      armX: -0.45,
      elbow: -0.48,
      hipL: -1.46,
      hipR: -0.75,
      spread: 0.13,
      kneeL: 2.12,
      kneeR: 2.26,
    },
    {
      p: 0.46,
      y: 0.81,
      lean: 0.69,
      tilt: 0.04,
      neck: -0.08,
      arm: 0.35,
      armX: -0.69,
      elbow: -0.71,
      hipL: -1.4,
      hipR: -0.79,
      spread: 0.11,
      kneeL: 2.01,
      kneeR: 1.99,
    },
    {
      p: 0.52,
      y: 1.17,
      lean: 0.3,
      tilt: -0.03,
      neck: -0.16,
      arm: 0.25,
      armX: -0.31,
      elbow: -0.66,
      hipL: -0.87,
      hipR: -0.71,
      spread: 0.1,
      kneeL: 1.33,
      kneeR: 1.11,
    },
    {
      p: 0.58,
      y: 1.57,
      lean: 0,
      tilt: 0,
      neck: 0,
      arm: 0.145,
      armX: -0.025,
      elbow: -0.14,
      hipL: -0.015,
      hipR: 0.018,
      spread: 0.025,
      kneeL: 0.025,
      kneeR: 0.02,
    },
    {
      p: 1,
      y: 1.57,
      lean: 0,
      tilt: 0,
      neck: 0,
      arm: 0.145,
      armX: -0.025,
      elbow: -0.14,
      hipL: -0.015,
      hipR: 0.018,
      spread: 0.025,
      kneeL: 0.025,
      kneeR: 0.02,
    },
  ];
  const footMatrix = new THREE.Matrix4();
  const footCorner = new THREE.Vector3();
  function pose(phase: number, time: number) {
    const p = THREE.MathUtils.clamp(phase, 0, 1);
    let i = 0;
    while (i < keys.length - 2 && p > keys[i + 1].p) i++;
    const a = keys[i],
      b = keys[i + 1];
    const t = THREE.MathUtils.smoothstep(p, a.p, b.p);
    const value = (key: Exclude<keyof Key, "p">) =>
      THREE.MathUtils.lerp(a[key], b[key], t);
    const idle = THREE.MathUtils.smoothstep(p, 0.58, 0.72);
    const breath = Math.sin(time * 1.6) * 0.006 * idle;
    pelvis.position.set(0, value("y"), 0);
    const airborne = 1 - THREE.MathUtils.smoothstep(p, 0.18, 0.29);
    pelvis.rotation.set(
      -0.82 * airborne,
      0.04 * Math.sin(time * 0.45) * airborne,
      0.06 * airborne,
    );
    torso.position.y = breath;
    torso.rotation.set(value("lean"), 0, value("tilt"));
    head.rotation.set(
      value("neck") - breath * 1.1,
      Math.sin(time * 0.37) * 0.025 * idle,
      value("tilt") * -0.2,
    );
    for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
      const side = sideIndex === 0 ? -1 : 1;
      shoulders[sideIndex].rotation.set(
        value("armX") + Math.sin(time * 1.2 + sideIndex) * 0.014 * idle,
        side * -0.06,
        side * value("arm"),
      );
      elbows[sideIndex].rotation.set(value("elbow"), 0, side * -0.035);
      wrists[sideIndex].rotation.set(0.13, side * -0.12, side * -0.075);
      const hipX = value(sideIndex === 0 ? "hipL" : "hipR");
      const kneeX = value(sideIndex === 0 ? "kneeL" : "kneeR");
      hips[sideIndex].rotation.set(hipX, side * -0.045, side * value("spread"));
      knees[sideIndex].rotation.set(kneeX, 0, 0);
      ankles[sideIndex].rotation.set(
        -(hipX + kneeX) * THREE.MathUtils.smoothstep(p, 0.24, 0.29),
        0,
        -side * value("spread"),
      );
    }
    // Contact is measured in character space so parent camera/scene transforms are independent.
    let lowestSole = Infinity;
    for (let leg = 0; leg < 2; leg++) {
      hips[leg].updateMatrix();
      knees[leg].updateMatrix();
      ankles[leg].updateMatrix();
      footMatrix
        .multiplyMatrices(hips[leg].matrix, knees[leg].matrix)
        .multiply(ankles[leg].matrix);
      for (const x of [-0.167, 0.167])
        for (const z of [-0.198, 0.389]) {
          footCorner.set(x, -0.216, z).applyMatrix4(footMatrix);
          lowestSole = Math.min(lowestSole, footCorner.y);
        }
    }
    pelvis.position.y = THREE.MathUtils.lerp(
      value("y"),
      -lowestSole,
      THREE.MathUtils.smoothstep(p, 0.25, 0.29),
    );
  }
  function eyeOpen(amount: number) {
    const openness = THREE.MathUtils.clamp(amount, 0, 1);
    for (const eye of eyes) eye.scale.y = 0.035 + openness * 0.965;
  }
  const sourceGeometries = new Set<THREE.BufferGeometry>();
  let originalMeshes = 0;
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      sourceGeometries.add(o.geometry);
      originalMeshes++;
    }
  });
  // Merge only siblings on the same articulated joint; eye and bone transforms stay independent.
  const joints: THREE.Object3D[] = [];
  root.traverse((o) => {
    if (o instanceof THREE.Group) joints.push(o);
  });
  for (const joint of joints) {
    const batches = new Map<THREE.Material, THREE.Mesh[]>();
    for (const child of joint.children) {
      if (
        !(child instanceof THREE.Mesh) ||
        Array.isArray(child.material) ||
        child.children.length
      )
        continue;
      const list = batches.get(child.material) || [];
      list.push(child);
      batches.set(child.material, list);
    }
    for (const [material, meshes] of batches) {
      if (meshes.length < 2) continue;
      const parts = meshes.map((mesh) => {
        mesh.updateMatrix();
        let geometry = mesh.geometry.clone();
        if (geometry.index) {
          const expanded = geometry.toNonIndexed();
          geometry.dispose();
          geometry = expanded;
        }
        for (const name of Object.keys(geometry.attributes))
          if (name !== "position" && name !== "normal")
            geometry.deleteAttribute(name);
        if (!geometry.attributes.normal) geometry.computeVertexNormals();
        return geometry.applyMatrix4(mesh.matrix);
      });
      const merged = mergeGeometries(parts);
      parts.forEach((g) => g.dispose());
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      meshes.forEach((m) => joint.remove(m));
      joint.add(mesh);
    }
  }
  const retained = new Set<THREE.BufferGeometry>();
  let batchedMeshes = 0;
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      retained.add(o.geometry);
      batchedMeshes++;
    }
  });
  sourceGeometries.forEach((g) => {
    if (!retained.has(g)) g.dispose();
  });
  root.userData.meshes = { before: originalMeshes, after: batchedMeshes };
  pose(1, 0);
  eyeOpen(1);
  function perform(
    kind: "walk" | "touch" | "duck",
    amount: number,
    time: number,
  ) {
    if (kind === "walk") {
      const swing = Math.sin(time * 7.5) * amount;
      hips[0].rotation.x = swing * 0.42;
      hips[1].rotation.x = -swing * 0.42;
      knees[0].rotation.x = Math.max(0, -swing) * 0.65;
      knees[1].rotation.x = Math.max(0, swing) * 0.65;
      shoulders[0].rotation.x = -swing * 0.28;
      shoulders[1].rotation.x = swing * 0.28;
      pelvis.position.y += Math.abs(swing) * 0.045;
    } else if (kind === "touch") {
      shoulders[1].rotation.set(-1.29 * amount, -0.02, 0.045);
      elbows[1].rotation.set(-0.12 * amount, 0, 0);
      wrists[1].rotation.set(0.05, 0, 0);
      head.rotation.y = -0.12 * amount;
    } else {
      pelvis.position.y -= 0.65 * amount;
      torso.rotation.x = 0.45 * amount;
      hips[0].rotation.x = hips[1].rotation.x = -0.9 * amount;
      knees[0].rotation.x = knees[1].rotation.x = 1.6 * amount;
      shoulders[0].rotation.x = shoulders[1].rotation.x = -0.6 * amount;
      elbows[0].rotation.x = elbows[1].rotation.x = -0.6 * amount;
      head.rotation.x = -0.25 * amount;
    }
    let lowest = Infinity;
    for (let leg = 0; leg < 2; leg++) {
      hips[leg].updateMatrix();
      knees[leg].updateMatrix();
      ankles[leg].updateMatrix();
      footMatrix
        .multiplyMatrices(hips[leg].matrix, knees[leg].matrix)
        .multiply(ankles[leg].matrix);
      for (const x of [-0.167, 0.167])
        for (const z of [-0.198, 0.389]) {
          footCorner.set(x, -0.216, z).applyMatrix4(footMatrix);
          lowest = Math.min(lowest, footCorner.y);
        }
    }
    pelvis.position.y = -lowest;
  }
  return { root, pose, eyeOpen, head, perform, hand: wrists[1] };
}
