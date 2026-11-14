"use client";

import { useState } from "react";

/** Copies `text` to the clipboard and briefly confirms it. */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="shrink-0 cursor-pointer rounded-md bg-ink-800 px-3 py-1.5 text-xs font-semibold text-ink-100 hover:bg-ink-700"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
