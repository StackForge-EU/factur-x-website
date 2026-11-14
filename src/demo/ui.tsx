import { useEffect, useId, useMemo, useState, type ReactNode } from "react";

/** A file held in memory — nothing in the demo is ever uploaded. */
export interface NamedFile {
  name: string;
  bytes: Uint8Array;
}

export const readFile = async (file: File): Promise<NamedFile> => ({
  name: file.name,
  bytes: new Uint8Array(await file.arrayBuffer()),
});

const ICONS = {
  check: "M20 6 9 17l-5-5",
  x: "M18 6 6 18M6 6l12 12",
  alert: "M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  upload: "M12 16V4m0 0L7 9m5-5 5 5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
  download: "M12 4v12m0 0 5-5m-5 5-5-5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5",
  plus: "M12 5v14M5 12h14",
  trash: "M4 7h16M10 11v6m4-6v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3",
  search: "m21 21-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z",
} as const;

export function Icon({ name, className = "size-4" }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

type Tone = "ok" | "bad" | "warn" | "neutral";

const TONES: Record<Tone, string> = {
  ok: "bg-ok-50 text-ok-700",
  bad: "bg-bad-50 text-bad-700",
  warn: "bg-warn-50 text-warn-700",
  neutral: "bg-ink-100 text-ink-700",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}>
      {children}
    </span>
  );
}

/** A coloured message box for results, warnings and errors. */
export function Notice({ tone, title, children }: { tone: Tone; title: string; children?: ReactNode }) {
  const icon = tone === "ok" ? "check" : tone === "bad" ? "x" : "alert";
  return (
    <div role={tone === "bad" ? "alert" : "status"} className={`rounded-lg p-4 text-sm ${TONES[tone]}`}>
      <p className="flex items-center gap-2 font-semibold">
        <Icon name={icon} />
        {title}
      </p>
      {children && <div className="mt-2 text-ink-900">{children}</div>}
    </div>
  );
}

export function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children(id)}
    </div>
  );
}

/** Click-or-drop file picker. Reads the file into memory and hands it to `onFile`. */
export function Dropzone({
  accept,
  hint,
  file,
  onFile,
}: {
  accept: string;
  hint: string;
  file: NamedFile | null;
  onFile: (file: NamedFile) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const take = (picked: File | undefined) => picked && void readFile(picked).then(onFile);

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        take(event.dataTransfer.files[0]);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors focus-within:border-forge-500 ${
        dragging ? "border-forge-500 bg-forge-50" : "border-ink-200 bg-ink-50 hover:border-ink-300"
      }`}
    >
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          take(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <Icon name={file ? "file" : "upload"} className="size-6 text-ink-500" />
      {file ? (
        <>
          <span className="max-w-full truncate text-sm font-semibold">{file.name}</span>
          <span className="text-xs text-ink-500">
            {(file.bytes.length / 1024).toFixed(0)} KB · click or drop to replace
          </span>
        </>
      ) : (
        <>
          <span className="text-sm font-semibold">Drop a file here or click to choose</span>
          <span className="text-xs text-ink-500">{hint}</span>
        </>
      )}
    </label>
  );
}

/** Object URL for in-memory bytes, revoked when the bytes change or the component unmounts. */
function useObjectUrl(bytes: Uint8Array | string, type: string): string {
  const url = useMemo(() => URL.createObjectURL(new Blob([bytes as BlobPart], { type })), [bytes, type]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return url;
}

export function DownloadButton({
  bytes,
  type,
  filename,
  variant = "btn-primary",
  children,
}: {
  bytes: Uint8Array | string;
  type: string;
  filename: string;
  variant?: "btn-primary" | "btn-secondary";
  children: ReactNode;
}) {
  const url = useObjectUrl(bytes, type);
  return (
    <a href={url} download={filename} className={`btn ${variant}`}>
      <Icon name="download" />
      {children}
    </a>
  );
}

/** Collapsible raw XML with a download link. */
export function XmlSource({ xml, filename }: { xml: string; filename: string }) {
  return (
    <details className="group rounded-lg border border-ink-100">
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-semibold">
        <span>
          Raw XML <span className="font-normal text-ink-500">· {filename}</span>
        </span>
        <span className="text-xs font-normal text-ink-500 group-open:hidden">Show</span>
        <span className="hidden text-xs font-normal text-ink-500 group-open:inline">Hide</span>
      </summary>
      <div className="border-t border-ink-100">
        <pre className="max-h-96 overflow-auto bg-ink-950 p-4 font-mono text-xs leading-relaxed text-ink-100">
          {xml}
        </pre>
        <div className="p-3">
          <DownloadButton bytes={xml} type="application/xml" filename={filename} variant="btn-secondary">
            Download XML
          </DownloadButton>
        </div>
      </div>
    </details>
  );
}
