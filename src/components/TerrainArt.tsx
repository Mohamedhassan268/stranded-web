import world from "@/data/hero-world.json";
export function TerrainArt({ compact = false }: { compact?: boolean }) {
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < 40; y += 2)
    for (let x = 0; x < 40; x += 2) {
      const tile = world.tiles[y][x];
      if (!tile) continue;
      const e = world.elevation[y][x];
      const px = 340 + (x - y) * 7.1,
        py = 125 + (x + y) * 3.5 - Math.min(e, 1500) * 0.065;
      const color = tile === 3 ? "#64738a" : tile === 2 ? "#294f4e" : "#456861";
      cells.push(
        <g key={`${x}-${y}`}>
          <path
            d={`M${px},${py}l14.2,7-14.2,7-14.2-7Z`}
            fill={color}
            stroke="#9bd5c3"
            strokeOpacity=".14"
            strokeWidth=".5"
          />
          {tile === 2 && (x + y) % 6 === 0 && (
            <path
              d={`M${px},${py + 2}v-10m-4,5 4-8 4 8Z`}
              fill="#56917d"
              stroke="#56917d"
              strokeWidth="1"
            />
          )}
        </g>,
      );
    }
  return (
    <svg
      viewBox="0 0 680 510"
      className={compact ? "terrain-art compact" : "terrain-art"}
      role="img"
      aria-label="Stylized isometric illustration of the recorded generated volcano terrain"
    >
      <defs>
        <radialGradient id="oceanGlow">
          <stop stopColor="#235d69" stopOpacity=".45" />
          <stop offset="1" stopColor="#080b14" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bedrock" x2="0" y2="1">
          <stop stopColor="#2a4352" />
          <stop offset="1" stopColor="#111727" />
        </linearGradient>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <ellipse cx="340" cy="340" rx="320" ry="155" fill="url(#oceanGlow)" />
      <g className="map-orbit" fill="none" stroke="#63dee9" strokeOpacity=".16">
        <ellipse cx="340" cy="325" rx="300" ry="120" />
        <ellipse cx="340" cy="325" rx="270" ry="105" strokeDasharray="3 10" />
        <path d="M30 325h620M340 185v280" />
      </g>
      <path
        d="m69 270 270-133 271 133v55L339 459 69 325Z"
        fill="url(#bedrock)"
        opacity=".7"
      />
      <g>{cells}</g>
      <g transform="translate(340 243)">
        <ellipse
          cy="27"
          rx="19"
          ry="8"
          fill="#987bff"
          opacity=".25"
          filter="url(#softGlow)"
        />
        <ellipse cy="26" rx="11" ry="4" fill="none" stroke="#63dee9" />
        <g className="terrain-human">
          <circle cy="-4" r="4" fill="#f6f8ff" />
          <path
            d="M0 1v12m0-10-6 8m6-8 6 8M0 13l-4 11m4-11 4 11"
            stroke="#f6f8ff"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </g>
      </g>
      <path
        d="M462 202h54l22-22h75"
        fill="none"
        stroke="#63dee9"
        strokeOpacity=".5"
      />
      <circle cx="462" cy="202" r="3" fill="#63dee9" />
      <text x="545" y="171" fill="#a8b4ce" fontSize="10" fontFamily="monospace">
        40 × 40 WORLD
      </text>
      <path
        d="M194 292h-45l-26 28H42"
        fill="none"
        stroke="#987bff"
        strokeOpacity=".6"
      />
      <circle cx="194" cy="292" r="3" fill="#987bff" />
      <text x="44" y="337" fill="#a8b4ce" fontSize="10" fontFamily="monospace">
        CHANGING CONDITIONS
      </text>
      <text
        x="340"
        y="494"
        textAnchor="middle"
        fill="#a8b4ce"
        fontSize="9"
        letterSpacing="2"
        fontFamily="monospace"
      >
        STYLIZED VIEW · GENERATED TERRAIN
      </text>
    </svg>
  );
}
