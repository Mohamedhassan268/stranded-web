"use client";
import { useEffect, useRef } from "react";
import { frameLayers, type Replay } from "@/lib/replay";
export function WorldMap({ run, index }: { run: Replay; index: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const s = run.steps[index];
  useEffect(() => {
    const c = ref.current,
      ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const w = run.world,
      unit = 600 / w.width;
    const layers = frameLayers(run, index);
    ctx.clearRect(0, 0, 600, 600);
    ctx.fillStyle = "#0b1c2b";
    ctx.fillRect(0, 0, 600, 600);
    const colors = ["#102b3b", "#47675c", "#244d43", "#65727d", "#c9aa6f"];
    for (let y = 0; y < w.height; y++)
      for (let x = 0; x < w.width; x++) {
        const key = `${x},${y}`;
        let color = colors[w.initial_tiles[y][x]];
        if (layers.shelter.has(key)) color = colors[4];
        if (layers.pdc.has(key)) color = "#786c81";
        if (layers.lahar.has(key)) color = "#77614c";
        if (layers.lava.has(key)) color = "#db704d";
        if (layers.surge.has(key)) color = "#ba8d5f";
        if (layers.active.has(key)) color = "#e8a073";
        ctx.fillStyle = color;
        ctx.fillRect(x * unit, y * unit, unit + 0.2, unit + 0.2);
        ctx.strokeStyle = "rgba(8,11,20,.12)";
        ctx.strokeRect(x * unit, y * unit, unit, unit);
      }
    ctx.strokeStyle = "#63dee9";
    ctx.lineWidth = 2;
    for (const p of w.evacuation_map?.assembly_points ?? []) {
      ctx.strokeRect(p[0] * unit + 3, p[1] * unit + 3, unit - 6, unit - 6);
    }
    const before = s.state.pos,
      after = s.pos_after;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#f6f8ff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo((before[0] + 0.5) * unit, (before[1] + 0.5) * unit);
    ctx.lineTo((after[0] + 0.5) * unit, (after[1] + 0.5) * unit);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(
      (after[0] + 0.5) * unit,
      (after[1] + 0.5) * unit,
      6,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    ctx.shadowColor = "#987bff";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#c1aeff";
    ctx.beginPath();
    ctx.arc(
      (before[0] + 0.5) * unit,
      (before[1] + 0.5) * unit,
      5,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#f6f8ff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [run, index, s]);
  return (
    <figure className="world-map">
      <canvas
        ref={ref}
        width="600"
        height="600"
        role="img"
        aria-label={`Recorded ${run.world.scenario} map, decision ${index + 1}. Agent before action at ${s.state.pos.join(", ")}; position after step ${s.pos_after.join(", ")}.`}
      />
      <figcaption>
        <span>
          <i className="legend-dot agent-dot" />
          Before action [{s.state.pos.join(", ")}]
        </span>
        <span>
          <i className="legend-dot after-dot" />
          After step [{s.pos_after.join(", ")}]
        </span>
        <span>
          <i className="legend-dot hazard-dot" />
          Active flow
        </span>
        <span>
          <i className="legend-dot shelter-dot" />
          Shelter
        </span>
      </figcaption>
    </figure>
  );
}
