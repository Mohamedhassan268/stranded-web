import type { Metadata } from "next";
import Link from "next/link";
import { ReplayViewer } from "@/components/ReplayViewer";
export const metadata: Metadata = {
  title: "Replay lab",
  description:
    "Play, pause and inspect authentic Stranded recordings. Compare quantum cognition with a classical-mixture control on matched seeds.",
};
export default function Demo() {
  return (
    <div className="section-wrap demo-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE REPLAY LAB / RECORDED SIMULATION</p>
          <h1>
            Every move.
            <br />
            <span className="violet-text">Open to inspection.</span>
          </h1>
        </div>
        <p>
          Follow the world, the warning, and the decision.
          <br />
          All values come from exported engine recordings.
          <br />
          <Link href="/science/">Read the method and its limits ↗</Link>
        </p>
      </div>
      <noscript>
        <p>
          Interactive playback requires JavaScript. The{" "}
          <a href="/runs/manifest.json">recording manifest</a> and{" "}
          <a href="/runs/volcano-42-quantum.json">default recording</a> can be
          downloaded directly.
        </p>
      </noscript>
      <ReplayViewer />
    </div>
  );
}
