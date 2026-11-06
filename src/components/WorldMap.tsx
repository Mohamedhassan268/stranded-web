"use client";
import { useEffect, useRef } from "react";
import { frameLayers, type Replay } from "@/lib/replay";

// A plain map figure in the simulator's terrain colours.
const SIZE = 800;
const TILES = ["#30a8d6", "#7ac440", "#3a9826", "#928474", "#d4522a"];
const BEACH = "#f0d48e";

export function WorldMap({ run, index, showEvac }: { run: Replay; index: number; showEvac: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const step = run.steps[index];

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const world = run.world;
    const unit = SIZE / world.width;
    const center = (value: number) => (value + 0.5) * unit;
    const layers = frameLayers(run, index);
    const fill = (cells: Set<string>, color: string) => {
      ctx.fillStyle = color;
      for (const cell of cells) {
        const [x, y] = cell.split(",").map(Number);
        ctx.fillRect(Math.floor(x * unit), Math.floor(y * unit), Math.ceil(unit), Math.ceil(unit));
      }
    };

    for (let y = 0; y < world.height; y++) {
      for (let x = 0; x < world.width; x++) {
        const tile = layers.shelter.has(`${x},${y}`) ? 4 : world.initial_tiles[y][x];
        const shore = tile === 1 && [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dy]) => world.initial_tiles[y + dy]?.[x + dx] === 0);
        ctx.fillStyle = shore ? BEACH : TILES[tile];
        ctx.fillRect(Math.floor(x * unit), Math.floor(y * unit), Math.ceil(unit), Math.ceil(unit));
      }
    }

    const evacuation = world.evacuation_map;
    if (showEvac && evacuation) {
      const tones = ["rgba(62,168,32,.14)", "rgba(228,152,24,.24)", "rgba(218,52,38,.32)"];
      evacuation.zones?.forEach((row, y) =>
        row.forEach((zone, x) => {
          if (!world.initial_tiles[y][x]) return;
          ctx.fillStyle = tones[zone];
          ctx.fillRect(Math.floor(x * unit), Math.floor(y * unit), Math.ceil(unit), Math.ceil(unit));
        }),
      );
      const route = evacuation.route_from_spawn ?? [];
      if (route.length > 1) {
        ctx.strokeStyle = "rgba(255,238,120,.95)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        route.forEach(([x, y], i) => (i ? ctx.lineTo(center(x), center(y)) : ctx.moveTo(center(x), center(y))));
        ctx.stroke();
      }
    }

    fill(layers.pdc, "rgba(92,78,74,.75)");
    fill(layers.lahar, "rgba(118,82,48,.75)");
    fill(layers.surge, "rgba(186,141,95,.7)");
    fill(layers.active, "rgba(232,110,60,.85)");
    fill(layers.lava, "rgba(238,105,24,.9)");

    if (world.scenario === "volcano" && world.volcano.vent) {
      const [vx, vy] = world.volcano.vent;
      ctx.fillStyle = "#523628";
      ctx.beginPath();
      ctx.arc(center(vx), center(vy), unit * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#da3e20";
      ctx.beginPath();
      ctx.arc(center(vx), center(vy), unit * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const [x, y] of evacuation?.assembly_points ?? []) {
      if (!showEvac) break;
      ctx.fillStyle = "#1e6010";
      ctx.strokeStyle = "#fffaee";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(center(x), center(y), 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    const [fromX, fromY] = step.state.pos;
    const [toX, toY] = step.pos_after;
    ctx.strokeStyle = "#fffaee";
    ctx.lineWidth = 2;
    if (fromX !== toX || fromY !== toY) {
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(center(fromX), center(fromY));
      ctx.lineTo(center(toX), center(toY));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(center(toX), center(toY), 7, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#2c6cb8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(center(fromX), center(fromY), 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }, [run, index, showEvac, step]);

  return (
    <figure className="world-map">
      <canvas
        ref={ref}
        width={SIZE}
        height={SIZE}
        role="img"
        aria-label={`Recorded ${run.world.scenario} map, decision ${index + 1}. Person before action at ${step.state.pos.join(", ")}; position after step ${step.pos_after.join(", ")}.`}
      />
    </figure>
  );
}
