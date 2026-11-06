"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Icon } from "@/components/Icons";
import { MAX_BYTES, readSim, type ParsedSim } from "@/lib/qsim";
import { SimContents } from "./SimContents";

export function UploadDialog({ close }: { close: () => void }) {
  const router = useRouter();
  const dialog = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);
  const [raw, setRaw] = useState("");
  const [sim, setSim] = useState<ParsedSim | null>(null);
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector("button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      before?.focus();
    };
  }, [close]);

  async function choose(file: File | undefined) {
    if (!file) return;
    setSim(null);
    setError("");
    if (!file.name.toLowerCase().endsWith(".qsim")) return setError(`Only .qsim files can be posted here, not ${file.name}`);
    if (file.size > MAX_BYTES) return setError("That file is too big to be a sim file.");
    try {
      const text = await file.text();
      setSim(await readSim(text));
      setRaw(text);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "That file can't be read.");
    }
  }

  async function post() {
    setPosting(true);
    setError("");
    try {
      const response = await fetch("/api/sims/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file: raw }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      router.push(`/repo/${body.id}/`);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "That sim couldn't be posted.");
      setPosting(false);
    }
  }

  return (
    <div className="q-veil" onClick={(event) => event.target === event.currentTarget && close()}>
      <div ref={dialog} className="q-card q-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title">
        <button className="q-btn q-close" onClick={close} aria-label="Close">
          X
        </button>
        <h2 id="upload-title">Post a sim</h2>
        <p className="q-modal-sub">Save a .qsim from the builder, then drop it here</p>
        <label
          className={over ? "upload-drop is-over" : "upload-drop"}
          onDragOver={(event: DragEvent) => {
            event.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(event: DragEvent) => {
            event.preventDefault();
            setOver(false);
            choose(event.dataTransfer.files[0]);
          }}
        >
          <Icon name="upload" width="28" height="28" />
          <span>Drop a .qsim file, or choose one</span>
          <input className="visually-hidden" type="file" accept=".qsim" aria-label="Choose a .qsim file" onChange={(event: ChangeEvent<HTMLInputElement>) => choose(event.target.files?.[0])} />
          <span className="q-notice">256 KB, 64 entities, 500 people and 240 hours at most</span>
        </label>
        {error && (
          <p className="q-error" role="alert" style={{ marginTop: 12 }}>
            {error}
          </p>
        )}
        {sim && (
          <div className="upload-form">
            <div>
              <h3 className="q-title">{sim.title}</h3>
              <p className="q-muted">
                By {sim.author || "Anonymous"} &nbsp;•&nbsp; Seed {sim.seed} &nbsp;•&nbsp; {sim.hours} hours
              </p>
              {sim.description && <p style={{ marginTop: 4 }}>{sim.description}</p>}
            </div>
            <div>
              <SimContents entities={sim.entities} />
            </div>
            <p className="q-notice">
              {sim.needsDataPack ? "This sim needs the 230 MB data pack to run. " : "This sim runs on any copy of the app. "}
              Posting makes the file, its author name and its description public under CC BY 4.0. It can't be edited afterwards.
            </p>
            <button className="q-btn q-btn--vivid q-btn--green q-btn--wide" onClick={post} disabled={posting}>
              <span>{posting ? "Posting..." : "Post to the Public Repo"}</span>
            </button>
          </div>
        )}
        <p className="debrief-foot">
          New to this? <Link href="/docs/sim-files/">How to make a sim file</Link>. A model, not a prediction.
        </p>
      </div>
    </div>
  );
}
