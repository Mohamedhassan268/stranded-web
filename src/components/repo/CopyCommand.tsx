"use client";
import { useState } from "react";
import { Icon } from "@/components/Icons";

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="command-row" style={{ marginTop: 8 }}>
      <code tabIndex={0}>{command}</code>
      <button
        className="q-btn q-btn--small"
        onClick={async () => {
          await navigator.clipboard.writeText(command);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
      >
        <Icon name={copied ? "check" : "copy"} width="15" height="15" />
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}
