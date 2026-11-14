import { extractXml, Profile } from "@stackforge-eu/factur-x";
import { useEffect, useState, type ReactNode } from "react";
import { checkArithmetic, parseCii, type CiiInvoice } from "../lib/cii";
import { money } from "../lib/labels";
import { PROFILE_LABELS, profileFromGuideline } from "../lib/profiles";
import { validateXsd, type XsdResult } from "../lib/xsd";
import { InvoiceView } from "./InvoiceView";
import { Dropzone, Field, Icon, Notice, XmlSource, type NamedFile } from "./ui";

interface Inspection {
  /** `true` when the XML came out of a PDF attachment rather than a bare XML file. */
  fromPdf: boolean;
  xml: string;
  xmlName: string;
  detectedProfile?: Profile;
  /** Either the parsed invoice or the reason it could not be read. */
  invoice: CiiInvoice | { error: string };
}

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

const isPdf = (bytes: Uint8Array) => new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";

async function inspect(file: NamedFile): Promise<Inspection> {
  const fromPdf = isPdf(file.bytes);
  const extracted = fromPdf
    ? await extractXml(file.bytes)
    : { xml: new TextDecoder().decode(file.bytes), filename: file.name, profile: undefined };

  let invoice: Inspection["invoice"];
  try {
    invoice = parseCii(extracted.xml);
  } catch (err) {
    invoice = { error: errorMessage(err) };
  }
  return {
    fromPdf,
    xml: extracted.xml,
    xmlName: extracted.filename,
    detectedProfile:
      extracted.profile ?? ("error" in invoice ? undefined : profileFromGuideline(invoice.guideline)),
    invoice,
  };
}

function Check({ passed, title, children }: { passed: boolean; title: string; children?: ReactNode }) {
  return (
    <li className="flex gap-3 py-3">
      <span
        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${
          passed ? "bg-ok-50 text-ok-700" : "bg-bad-50 text-bad-700"
        }`}
      >
        <Icon name={passed ? "check" : "x"} className="size-3" />
        <span className="sr-only">{passed ? "Passed" : "Failed"}:</span>
      </span>
      <div className="min-w-0 text-sm">
        <p className="font-medium">{title}</p>
        {children && <div className="mt-1 text-ink-500">{children}</div>}
      </div>
    </li>
  );
}

/** Extract the XML from a Factur-X / ZUGFeRD PDF, show it readably and validate it. */
export function InspectPanel({ file, onFile }: { file: NamedFile | null; onFile: (file: NamedFile) => void }) {
  const [inspection, setInspection] = useState<Inspection | { error: string } | null>(null);
  const [profile, setProfile] = useState(Profile.EN16931);
  const [xsd, setXsd] = useState<XsdResult | { error: string } | null>(null);

  useEffect(() => {
    if (!file) return;
    let stale = false;
    setInspection(null);
    inspect(file)
      .then((result) => {
        if (stale) return;
        setInspection(result);
        if (result.detectedProfile) setProfile(result.detectedProfile);
      })
      .catch((err: unknown) => !stale && setInspection({ error: errorMessage(err) }));
    return () => {
      stale = true;
    };
  }, [file]);

  const xml = inspection && "xml" in inspection ? inspection.xml : undefined;
  useEffect(() => {
    if (xml === undefined) return;
    let stale = false;
    setXsd(null);
    validateXsd(xml, profile)
      .then((result) => !stale && setXsd(result))
      .catch((err: unknown) => !stale && setXsd({ error: errorMessage(err) }));
    return () => {
      stale = true;
    };
  }, [xml, profile]);

  return (
    <div className="space-y-6">
      <Dropzone
        accept="application/pdf,.pdf,text/xml,application/xml,.xml"
        hint="A Factur-X / ZUGFeRD PDF, or a CII / XRechnung XML file"
        file={file}
        onFile={onFile}
      />

      {file && !inspection && <p className="text-sm text-ink-500">Reading {file.name}…</p>}

      {inspection && "error" in inspection && (
        <Notice tone="bad" title="No e-invoice data found">
          <p>{inspection.error}</p>
          <p className="mt-2 text-ink-500">
            This looks like a plain PDF. Switch to “Create” to add the structured XML to it.
          </p>
        </Notice>
      )}

      {inspection && "xml" in inspection && (
        <>
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h3 className="text-base font-semibold">Validation</h3>
              <Field label="Validate against profile" className="w-44">
                {(id) => (
                  <select
                    id={id}
                    className="field-input"
                    value={profile}
                    onChange={(event) => setProfile(event.target.value as Profile)}
                  >
                    {Object.values(Profile).map((value) => (
                      <option key={value} value={value}>
                        {PROFILE_LABELS[value]}
                        {value === inspection.detectedProfile ? " (detected)" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>

            <ul className="mt-2 divide-y divide-ink-100 rounded-xl border border-ink-100 px-4">
              {inspection.fromPdf && (
                <Check passed title="Embedded XML attachment found">
                  <code className="font-mono text-xs">{inspection.xmlName}</code>
                </Check>
              )}
              <Check
                passed={inspection.detectedProfile !== undefined}
                title={
                  inspection.detectedProfile
                    ? `Profile detected: ${PROFILE_LABELS[inspection.detectedProfile]}`
                    : "Profile could not be detected"
                }
              >
                {"guideline" in inspection.invoice && inspection.invoice.guideline && (
                  <code className="font-mono text-xs break-all">{inspection.invoice.guideline}</code>
                )}
              </Check>

              {xsd === null && <li className="py-3 text-sm text-ink-500">Validating against the XSD…</li>}
              {xsd && "error" in xsd && <Check passed={false} title="XSD validation could not run">{xsd.error}</Check>}
              {xsd && "valid" in xsd && (
                <>
                  <Check passed={xsd.wellFormed} title={xsd.wellFormed ? "Well-formed XML" : "XML is not well-formed"} />
                  {xsd.wellFormed && (
                    <Check
                      passed={xsd.valid}
                      title={
                        xsd.valid
                          ? `Valid against the Factur-X ${PROFILE_LABELS[profile]} XSD`
                          : `${xsd.errors.length} XSD error${xsd.errors.length > 1 ? "s" : ""} for ${PROFILE_LABELS[profile]}`
                      }
                    />
                  )}
                  {xsd.errors.length > 0 && (
                    <li className="py-3">
                      <ul className="space-y-2 text-sm">
                        {xsd.errors.map((error, index) => (
                          <li key={index} className="rounded-md bg-bad-50 px-3 py-2 break-words">
                            {error.line ? <span className="font-mono text-xs font-semibold">Line {error.line} · </span> : null}
                            {error.message}
                          </li>
                        ))}
                      </ul>
                    </li>
                  )}
                </>
              )}

              {"error" in inspection.invoice ? (
                <Check passed={false} title="Not a Cross Industry Invoice">{inspection.invoice.error}</Check>
              ) : (
                checkArithmetic(inspection.invoice).map((check) => (
                  <Check key={check.rule} passed={check.passed} title={`${check.rule} · ${check.description}`}>
                    {!check.passed && `Expected ${money(check.expected)}, document says ${money(check.actual)}.`}
                  </Check>
                ))
              )}
            </ul>
            <p className="mt-2 text-xs text-ink-500">
              Checks XML structure (official XSD) and the EN 16931 calculation rules. The full Schematron rule set and
              PDF/A conformance are not evaluated here.
            </p>
          </section>

          {"error" in inspection.invoice ? null : (
            <section>
              <h3 className="mb-2 text-base font-semibold">Invoice</h3>
              <InvoiceView invoice={inspection.invoice} />
            </section>
          )}

          <XmlSource xml={inspection.xml} filename={inspection.xmlName} />
        </>
      )}
    </div>
  );
}
