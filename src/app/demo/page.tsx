import type { Metadata } from "next";
import Link from "next/link";
import { ReplayViewer } from "@/components/ReplayViewer";

export const metadata: Metadata = {
  title: "Replay",
  description: "Step through recorded Qognition runs, and compare quantum cognition with a classical-mixture control on matched seeds.",
};

export default function Demo() {
  return (
    <div className="q-page demo-page">
      <header className="page-heading">
        <p className="q-kicker">Replay</p>
        <h1>Every decision, step by step</h1>
        <p>
          Follow one person through a recorded run and see what the model believed at each decision. All values come from exported recordings, and nothing runs live.{" "}
          <Link href="/science/">Read the method and its limits</Link>.
        </p>
      </header>
      <noscript>
        <p className="q-card" style={{ marginBottom: 16 }}>
          Playback needs JavaScript. The <a href="/runs/manifest.json">recording manifest</a> and <a href="/runs/volcano-42-quantum.json">default recording</a> can be
          downloaded directly.
        </p>
      </noscript>
      <ReplayViewer />
    </div>
  );
}
