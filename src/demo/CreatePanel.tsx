import {
  embedFacturX,
  Flavor,
  FLAVOR_CONFIGS,
  Profile,
  resolveBusinessProcessUrn,
  toXRechnung,
  validateInput,
  type FacturXInvoiceInput,
  type ValidationError,
} from "@stackforge-eu/factur-x";
import { useMemo, useState, type ReactNode } from "react";
import { draftToInput, sampleDraft } from "../lib/invoice-draft";
import { money } from "../lib/labels";
import { PROFILE_LABELS } from "../lib/profiles";
import { validateXsd, type XsdResult } from "../lib/xsd";
import { takeWarnings } from "../shims/console";
import { InvoiceForm } from "./InvoiceForm";
import { Badge, Dropzone, DownloadButton, Field, Icon, Notice, XmlSource, type NamedFile } from "./ui";

interface Outcome {
  /** The finished PDF; absent for XML-only flavors (XRechnung). */
  pdf?: NamedFile;
  xml: string;
  xmlName: string;
  xsd: XsdResult;
  /** PDF/A problems the package reported about the source PDF. */
  warnings: string[];
}

type ParsedInput = { input: FacturXInvoiceInput } | { error: string };

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

const fileStem = (input: FacturXInvoiceInput) =>
  (input.document?.id || "invoice").replace(/[^\w.-]+/g, "_");

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-3 text-base font-semibold">
        <span className="grid size-6 place-items-center rounded-full bg-ink-900 text-xs text-white">{n}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Toggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-ink-100 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            option.value === value ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Build a Factur-X / ZUGFeRD PDF (or XRechnung XML) from a PDF plus form or JSON data. */
export function CreatePanel({ onInspect }: { onInspect: (file: NamedFile) => void }) {
  const [pdfSource, setPdfSource] = useState<"sample" | "upload">("sample");
  const [upload, setUpload] = useState<NamedFile | null>(null);
  // The sample invoice works as-is, so the long form stays folded until someone wants to change it.
  const [editing, setEditing] = useState(false);
  const [dataMode, setDataMode] = useState<"form" | "json">("form");
  const [draft, setDraft] = useState(sampleDraft);
  // `null` means "not edited": the JSON tab then mirrors the form.
  const [jsonEdit, setJsonEdit] = useState<string | null>(null);
  const [profile, setProfile] = useState(Profile.EN16931);
  const [flavor, setFlavor] = useState(Flavor.ZUGFERD);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | { error: string } | null>(null);

  const flavorConfig = FLAVOR_CONFIGS[flavor];
  const formJson = useMemo(() => JSON.stringify(draftToInput(draft), null, 2), [draft]);
  const jsonText = jsonEdit ?? formJson;

  const parsed = useMemo((): ParsedInput => {
    if (dataMode === "form") return { input: draftToInput(draft) };
    try {
      const value: unknown = JSON.parse(jsonText);
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return { error: "The JSON must be an invoice object." };
      }
      // Shape is checked by validateInput below, exactly as for any package user.
      return { input: value as FacturXInvoiceInput };
    } catch (err) {
      return { error: errorMessage(err) };
    }
  }, [dataMode, draft, jsonText]);

  const problems = useMemo((): ValidationError[] => {
    if ("error" in parsed) return [];
    try {
      // toXRechnung() fills in the default business process before validating; mirror that here.
      const input = flavorConfig.embedInPdf
        ? parsed.input
        : {
            ...parsed.input,
            document: { ...parsed.input.document, businessProcessId: resolveBusinessProcessUrn(parsed.input, flavor) },
          };
      return validateInput(input, profile, flavor).errors;
    } catch (err) {
      return [{ field: "input", message: errorMessage(err), profile }];
    }
  }, [parsed, profile, flavor, flavorConfig]);

  const selectFlavor = (next: Flavor) => {
    setFlavor(next);
    const supported = FLAVOR_CONFIGS[next].supportedProfiles;
    if (!supported.includes(profile)) setProfile(supported.at(-1) ?? Profile.EN16931);
  };

  const needsPdf = flavorConfig.embedInPdf && pdfSource === "upload" && !upload;
  const canCreate = "input" in parsed && problems.length === 0 && !needsPdf && !busy;

  async function create(input: FacturXInvoiceInput) {
    setBusy(true);
    setOutcome(null);
    try {
      const stem = fileStem(input);
      if (!flavorConfig.embedInPdf) {
        const { xml } = toXRechnung(input, { profile });
        const xsd = await validateXsd(xml, profile);
        setOutcome({ xml, xmlName: `${stem}-xrechnung.xml`, xsd, warnings: [] });
        return;
      }

      const [source, rgbIccProfile] = await Promise.all([
        pdfSource === "upload" && upload
          ? upload.bytes
          : import("../lib/sample-pdf").then((m) => m.generateSamplePdf(input)),
        fetch("/sRGB-v2-micro.icc").then(async (res) => new Uint8Array(await res.arrayBuffer())),
      ]);
      takeWarnings();
      const result = await embedFacturX({ pdf: source, input, profile, flavor, rgbIccProfile });
      const warnings = takeWarnings();
      const xsd = await validateXsd(result.xml, profile);
      setOutcome({
        pdf: { name: `${stem}-${flavor}.pdf`, bytes: result.pdf },
        xml: result.xml,
        xmlName: flavorConfig.attachmentFilename,
        xsd,
        warnings,
      });
    } catch (err) {
      setOutcome({ error: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <Step n={1} title="Invoice data">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-ink-50 px-4 py-3">
          <InputSummary parsed={parsed} />
          <button type="button" className="btn btn-secondary" aria-expanded={editing} onClick={() => setEditing(!editing)}>
            {editing ? "Done" : "Edit invoice data"}
          </button>
        </div>
        {editing && (
          <div className="mt-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <Toggle
                label="Invoice data input"
                value={dataMode}
                onChange={setDataMode}
                options={[
                  { value: "form", label: "Form" },
                  { value: "json", label: "JSON" },
                ]}
              />
              {dataMode === "json" && jsonEdit !== null && (
                <button type="button" className="text-sm font-medium text-forge-700 underline" onClick={() => setJsonEdit(null)}>
                  Reset to form data
                </button>
              )}
            </div>
            {dataMode === "form" ? (
              <InvoiceForm draft={draft} setDraft={setDraft} />
            ) : (
              <Field label="FacturXInvoiceInput — the object you pass to embedFacturX()">
                {(id) => (
                  <textarea
                    id={id}
                    spellCheck={false}
                    className="field-input h-96 resize-y font-mono text-xs leading-relaxed"
                    value={jsonText}
                    onChange={(event) => setJsonEdit(event.target.value)}
                  />
                )}
              </Field>
            )}
          </div>
        )}
      </Step>

      <Step n={2} title="Format">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Flavor">
            {(id) => (
              <select
                id={id}
                className="field-input"
                value={flavor}
                onChange={(event) => selectFlavor(event.target.value as Flavor)}
              >
                {Object.values(Flavor).map((value) => (
                  <option key={value} value={value}>
                    {FLAVOR_CONFIGS[value].name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Profile">
            {(id) => (
              <select
                id={id}
                className="field-input"
                value={profile}
                onChange={(event) => setProfile(event.target.value as Profile)}
              >
                {flavorConfig.supportedProfiles.map((value) => (
                  <option key={value} value={value}>
                    {PROFILE_LABELS[value]}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <p className="mt-2 text-sm text-ink-500">{flavorConfig.description}</p>
      </Step>

      <Step n={3} title="PDF">
        {flavorConfig.embedInPdf ? (
          <div className="space-y-3">
            <Toggle
              label="PDF source"
              value={pdfSource}
              onChange={setPdfSource}
              options={[
                { value: "sample", label: "Generate a sample PDF" },
                { value: "upload", label: "Use my own PDF" },
              ]}
            />
            {pdfSource === "upload" ? (
              <Dropzone accept="application/pdf,.pdf" hint="Your existing invoice PDF" file={upload} onFile={setUpload} />
            ) : (
              <p className="text-sm text-ink-500">
                A plain A4 invoice is rendered from the data above, so the visible page and the embedded XML match.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink-500">{flavorConfig.name} is an XML-only format, so no PDF is involved.</p>
        )}
      </Step>

      <div className="space-y-4 border-t border-ink-100 pt-6">
        {"error" in parsed && <Notice tone="bad" title="Invalid JSON">{parsed.error}</Notice>}
        {problems.length > 0 && (
          <Notice tone="warn" title={`${problems.length} field${problems.length > 1 ? "s" : ""} missing or invalid for ${PROFILE_LABELS[profile]}`}>
            <ul className="space-y-1">
              {problems.map((problem, index) => (
                <li key={index}>
                  <code className="font-mono text-xs font-semibold">{problem.field}</code> — {problem.message}
                </li>
              ))}
            </ul>
          </Notice>
        )}

        <button
          type="button"
          className="btn btn-primary w-full sm:w-auto"
          disabled={!canCreate}
          onClick={() => "input" in parsed && void create(parsed.input)}
        >
          {busy ? "Working…" : flavorConfig.embedInPdf ? `Create ${flavorConfig.name} PDF` : `Create ${flavorConfig.name} XML`}
        </button>

        {outcome && "error" in outcome && <Notice tone="bad" title="Could not create the invoice">{outcome.error}</Notice>}
        {outcome && "xml" in outcome && <Result outcome={outcome} profile={profile} onInspect={onInspect} />}
      </div>
    </div>
  );
}

/** One-line recap of the invoice that will be embedded, shown while the form is folded. */
function InputSummary({ parsed }: { parsed: ParsedInput }) {
  if ("error" in parsed) return <p className="text-sm text-bad-700">The JSON cannot be read.</p>;
  const { document, seller, buyer, lines, totals } = parsed.input;
  return (
    <p className="min-w-0 text-sm">
      <span className="font-semibold">{document?.id || "Untitled invoice"}</span>
      <span className="text-ink-500">
        {" · "}
        {seller?.name || "?"} → {buyer?.name || "?"}
        {" · "}
        {lines?.length ?? 0} line items{" · "}
      </span>
      <span className="font-semibold whitespace-nowrap">{money(totals?.grandTotal, totals?.currency)}</span>
    </p>
  );
}

function Result({
  outcome,
  profile,
  onInspect,
}: {
  outcome: Outcome;
  profile: Profile;
  onInspect: (file: NamedFile) => void;
}) {
  const { pdf, xml, xmlName, xsd, warnings } = outcome;
  return (
    <div className="space-y-4" aria-live="polite">
      <Notice
        tone={xsd.valid ? "ok" : "warn"}
        title={`${pdf?.name ?? xmlName} ${xsd.valid ? "is ready" : "was created, but its XML fails schema validation"}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={xsd.valid ? "ok" : "bad"}>
            <Icon name={xsd.valid ? "check" : "x"} className="size-3" />
            XSD {xsd.valid ? "valid" : "invalid"} · {PROFILE_LABELS[profile]}
          </Badge>
          {pdf && <Badge>{(pdf.bytes.length / 1024).toFixed(0)} KB</Badge>}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {pdf ? (
            <>
              <DownloadButton bytes={pdf.bytes} type="application/pdf" filename={pdf.name}>
                Download PDF
              </DownloadButton>
              <button type="button" className="btn btn-secondary" onClick={() => onInspect(pdf)}>
                <Icon name="search" />
                Inspect this PDF
              </button>
            </>
          ) : (
            <DownloadButton bytes={xml} type="application/xml" filename={xmlName}>
              Download XML
            </DownloadButton>
          )}
        </div>
      </Notice>

      {!xsd.valid && (
        <Notice tone="bad" title="The generated XML does not pass the XSD">
          <ul className="space-y-1">
            {xsd.errors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </Notice>
      )}
      {warnings.length > 0 && (
        <Notice tone="warn" title="PDF/A-3 conformance of your source PDF">
          <ul className="space-y-1">
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </Notice>
      )}
      <XmlSource xml={xml} filename={xmlName} />
    </div>
  );
}
