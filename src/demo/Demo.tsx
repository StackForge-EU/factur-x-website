"use client";

import { useState } from "react";
import { CreatePanel } from "./CreatePanel";
import { InspectPanel } from "./InspectPanel";
import type { NamedFile } from "./ui";

const TABS = [
  { id: "create", label: "Create", hint: "PDF + data → e-invoice" },
  { id: "inspect", label: "Inspect & validate", hint: "Read an existing e-invoice" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** The interactive demo. Both panels stay mounted so switching tabs keeps their state. */
export function Demo() {
  const [tab, setTab] = useState<TabId>("create");
  const [inspectFile, setInspectFile] = useState<NamedFile | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-xl shadow-ink-900/5">
      <div role="tablist" aria-label="Demo mode" className="grid grid-cols-2 border-b border-ink-100 bg-ink-50">
        {TABS.map(({ id, label, hint }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={`cursor-pointer border-b-2 px-4 py-4 text-left transition-colors sm:px-6 ${
              tab === id ? "border-forge-600 bg-white" : "border-transparent text-ink-500 hover:text-ink-900"
            }`}
          >
            <span className="block text-sm font-semibold sm:text-base">{label}</span>
            <span className="hidden text-xs text-ink-500 sm:block">{hint}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id="panel-create" aria-labelledby="tab-create" hidden={tab !== "create"} className="p-4 sm:p-8">
        <CreatePanel
          onInspect={(file) => {
            setInspectFile(file);
            setTab("inspect");
          }}
        />
      </div>
      <div role="tabpanel" id="panel-inspect" aria-labelledby="tab-inspect" hidden={tab !== "inspect"} className="p-4 sm:p-8">
        <InspectPanel file={inspectFile} onFile={setInspectFile} />
      </div>
    </div>
  );
}
