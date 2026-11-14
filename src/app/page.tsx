import { Code } from "@/components/Code";
import { CopyButton } from "@/components/CopyButton";
import { DemoLoader } from "@/components/DemoLoader";
import { StarButton } from "@/components/StarButton";
import { GITHUB_URL, INSTALL_COMMAND, JSR_URL, NPM_URL, PACKAGE_NAME, SITE_URL } from "@/lib/site";

const HERO_SNIPPET = `import { embedFacturX, Profile, Flavor } from "${PACKAGE_NAME}";

const { pdf } = await embedFacturX({
  pdf: await readFile("invoice.pdf"),
  input: {
    document: { id: "INV-2026-0042", issueDate: "2026-11-14" },
    seller: { name: "Musterfirma GmbH", /* … */ },
    buyer: { name: "Beispiel AG", /* … */ },
    lines: [{ id: "1", name: "Consulting", quantity: 10,
              unitPrice: 150, vatRatePercent: 19 }],
    totals: { taxBasisTotal: 1500, taxTotal: 285,
              grandTotal: 1785, currency: "EUR", /* … */ },
  },
  profile: Profile.EN16931,
  flavor: Flavor.ZUGFERD,
});

await writeFile("invoice-zugferd.pdf", pdf);`;

const QUICK_START = [
  {
    title: "Read an incoming invoice",
    code: `import { extractXml } from
  "${PACKAGE_NAME}";

const { xml, filename, profile } =
  await extractXml(pdfBytes);

// "factur-x.xml", "EN16931"`,
  },
  {
    title: "Validate before sending",
    code: `const check = validateInput(
  invoice, Profile.EN16931);

const xml = buildXml(
  invoice, Profile.EN16931);
const xsd = await validateXsd(
  xml, Profile.EN16931);`,
  },
  {
    title: "XRechnung without a PDF",
    code: `import { toXRechnung } from
  "${PACKAGE_NAME}";

const { xml } = toXRechnung({
  document: {
    id: "INV-2026-0042",
    buyerReference: "04011000-12345-67",
  }, /* … */
});`,
  },
];

const FEATURES = [
  {
    title: "Typed input, no XML by hand",
    text: "Describe the invoice as a plain TypeScript object. The library writes UN/CEFACT Cross Industry Invoice XML for Factur-X 1.09 / ZUGFeRD 2.5.",
  },
  {
    title: "Profile-aware validation",
    text: "Missing a field that EN 16931 requires? You get the exact path, such as seller.address.country, before any XML is written.",
  },
  {
    title: "Official XSD schemas included",
    text: "Validate generated or received XML against the Factur-X schemas with libxml2 compiled to WebAssembly. No Java, no native build.",
  },
  {
    title: "PDF/A-3 embedding",
    text: "Attaches the XML to your existing PDF with the required XMP metadata, AF relationship and sRGB output intent, and warns about fonts that are not embedded.",
  },
  {
    title: "Extraction",
    text: "Read the XML back out of any Factur-X or ZUGFeRD PDF, including the detected profile – the starting point for processing incoming invoices.",
  },
  {
    title: "XRechnung for German B2G",
    text: "The same input object produces standalone XRechnung XML with Leitweg-ID and PEPPOL business process, ready for ZRE or OZG-RE.",
  },
];

const PROFILES = [
  ["MINIMUM", "–", "Booking aid; totals only"],
  ["BASIC WL", "–", "Document level with VAT and payment"],
  ["BASIC", "Yes", "Standard commercial invoices"],
  ["EN 16931", "Yes", "The full European standard"],
  ["EXTENDED", "Yes", "Complex cross-industry scenarios"],
] as const;

const FLAVORS = [
  ["Factur-X", "France / EU", "PDF/A-3 with XML"],
  ["ZUGFeRD", "Germany", "PDF/A-3 with XML"],
  ["XRechnung", "Germany, public sector", "XML only"],
  ["Chrono Pro", "Belgium", "PDF/A-3 with XML"],
] as const;

// Rendered as the visible FAQ and as FAQPage structured data.
const FAQ = [
  {
    question: "What is the difference between Factur-X, ZUGFeRD and XRechnung?",
    answer:
      "Factur-X (France) and ZUGFeRD (Germany) are the same hybrid format: a PDF/A-3 that a person can read, with a UN/CEFACT CII XML file embedded for machines. XRechnung is the German public-sector format and consists of the XML alone, without a PDF. All three implement the European standard EN 16931.",
  },
  {
    question: "Is my invoice uploaded when I use the demo?",
    answer:
      "No. The demo runs the library inside your browser tab. PDFs, XML and form data are processed in memory and never sent to a server. The page sets no cookies and loads nothing from other companies; visits are counted with a self-hosted, cookieless Umami.",
  },
  {
    question: "Which validation does the library perform?",
    answer:
      "It checks your input against the requirements of the chosen profile before generating XML, and it can validate the generated XML against the official Factur-X XSD schemas using libxml2 compiled to WebAssembly. The demo additionally checks the EN 16931 calculation rules for totals.",
  },
  {
    question: "Does it produce PDF/A-3 files?",
    answer:
      "The library attaches the XML, writes the Factur-X XMP metadata and adds an sRGB output intent. The source PDF must itself be PDF/A-capable, for example with all fonts embedded. The library warns when it detects fonts that are not embedded.",
  },
  {
    question: "Does the library run in the browser?",
    answer:
      "It targets Node.js 18+ and Deno 2+. This page bundles it for the browser with a few small shims for Node built-ins; the source of this website is public and shows how.",
  },
  {
    question: "Under which licence is the library published?",
    answer: "EUPL-1.2, the European Union Public Licence. It is free to use, including in commercial products.",
  },
];

const STRUCTURED_DATA = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: PACKAGE_NAME,
    description:
      "TypeScript library to generate, embed, extract and validate Factur-X, ZUGFeRD and XRechnung invoices (EN 16931 CII XML in PDF/A-3).",
    url: `${SITE_URL}/`,
    codeRepository: GITHUB_URL,
    // The same package on its registries, so search engines connect site, repo and package.
    sameAs: [NPM_URL, JSR_URL],
    programmingLanguage: "TypeScript",
    runtimePlatform: ["Node.js", "Deno"],
    license: "https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12",
    author: { "@type": "Organization", name: "StackForge UG (haftungsbeschränkt)", url: "https://www.stack-forge.eu" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  },
];

function InstallCommand() {
  return (
    <div className="flex max-w-xl items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-900 py-2 pr-2 pl-4">
      <code className="min-w-0 overflow-x-auto font-mono text-sm whitespace-nowrap">
        <span className="text-ink-500 select-none">$ </span>
        {INSTALL_COMMAND}
      </code>
      <CopyButton text={INSTALL_COMMAND} />
    </div>
  );
}

function Table({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: readonly string[];
  rows: readonly (readonly string[])[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] text-left text-sm">
        <caption className="mb-3 text-left font-semibold">{caption}</caption>
        <thead>
          <tr className="border-b border-ink-200 text-xs tracking-wider text-ink-500 uppercase">
            {head.map((label) => (
              <th key={label} className="py-2 pr-4 font-semibold">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map(([name, ...cells]) => (
            <tr key={name}>
              <th className="py-2.5 pr-4 font-semibold">{name}</th>
              {cells.map((cell) => (
                <td key={cell} className="pr-4">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HomePage() {
  return (
    <main>
      {STRUCTURED_DATA.map((data) => (
        <script
          key={data["@type"]}
          type="application/ld+json"
          // Static data defined above; "<" is escaped so it can never close the script element.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll("<", "\\u003c") }}
        />
      ))}

      <section className="bg-ink-950 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-widest text-forge-400 uppercase">
              Open source · TypeScript · EUPL-1.2
            </p>
            <h1 className="mt-4 text-4xl leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl">
              Factur-X, ZUGFeRD and XRechnung invoices in TypeScript.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-300">
              Turn any PDF into a compliant e-invoice. Generate EN&nbsp;16931 XML from a typed object, validate it
              against the official schemas and embed it into PDF/A-3 – or read it back out. For Node.js and Deno.
            </p>

            <div className="mt-8">
              <InstallCommand />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="#demo" className="btn btn-primary">
                Try the live demo
              </a>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-300">
              <li>5 profiles, MINIMUM to EXTENDED</li>
              <li>XSD validation via WebAssembly</li>
              <li>2 runtime dependencies</li>
            </ul>
          </div>

          <div className="min-w-0 overflow-hidden rounded-xl border border-ink-700 bg-ink-900 shadow-2xl">
            <p className="border-b border-ink-700 px-4 py-2.5 font-mono text-xs text-ink-300">invoice.ts</p>
            <Code>{HERO_SNIPPET}</Code>
          </div>
        </div>
      </section>

      <section id="demo" className="bg-ink-50 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="section-eyebrow">Live demo</p>
          <h2 className="section-title">Create, read and validate an e-invoice right here.</h2>
          <p className="mt-4 max-w-2xl text-ink-500">
            The demo runs the npm package inside this browser tab.{" "}
            <strong className="font-semibold text-ink-900">Nothing is uploaded</strong> – your PDF and invoice data
            never leave your device.
          </p>
          <div className="mt-8">
            <DemoLoader />
          </div>
        </div>
      </section>

      <section id="features" className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="section-eyebrow">Features</p>
          <h2 className="section-title max-w-2xl">Everything between your invoice data and a compliant file.</h2>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ title, text }) => (
              <div key={title}>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="quickstart" className="bg-ink-950 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-semibold tracking-widest text-forge-400 uppercase">Quick start</p>
          <h2 className="section-title">Three calls cover most use cases.</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {QUICK_START.map(({ title, code }) => (
              <div key={title} className="min-w-0 rounded-xl border border-ink-700 bg-ink-900">
                <h3 className="border-b border-ink-700 px-4 py-3 text-sm font-semibold">{title}</h3>
                <Code>{code}</Code>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-ink-300">
            Available on{" "}
            <a className="text-white underline" href={NPM_URL}>
              npm
            </a>{" "}
            and{" "}
            <a className="text-white underline" href={JSR_URL}>
              JSR
            </a>{" "}
            (Deno: <code className="font-mono text-ink-100">{`import { embedFacturX } from "jsr:${PACKAGE_NAME}";`}</code>
            ). Full reference in the{" "}
            <a className="text-white underline" href={`${GITHUB_URL}#readme`}>
              README
            </a>{" "}
            and the{" "}
            <a className="text-white underline" href={`${GITHUB_URL}/blob/main/docs/INPUT_OBJECT_SPECIFICATION.md`}>
              input object specification
            </a>
            .
          </p>
        </div>
      </section>

      <section id="profiles" className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="section-eyebrow">Profiles and flavors</p>
          <h2 className="section-title max-w-2xl">One input object, every level of the standard.</h2>
          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <Table caption="Profiles" head={["Profile", "Line items", "Typical use"]} rows={PROFILES} />
            <Table caption="Flavors" head={["Flavor", "Region", "Output"]} rows={FLAVORS} />
          </div>
        </div>
      </section>

      <section id="faq" className="bg-ink-50 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="section-eyebrow">FAQ</p>
          <h2 className="section-title">Common questions</h2>
          <div className="mt-8 divide-y divide-ink-200 border-y border-ink-200">
            {FAQ.map(({ question, answer }) => (
              <details key={question} className="py-4">
                <summary className="cursor-pointer font-semibold">{question}</summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-500">{answer}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-sm text-ink-500">
            More in the{" "}
            <a className="text-ink-900 underline" href="/privacy">
              privacy policy
            </a>{" "}
            and the{" "}
            <a className="text-ink-900 underline" href="https://github.com/StackForge-EU/factur-x-website">
              source of this website
            </a>
            .
          </p>
        </div>
      </section>

      <section className="bg-ink-950 py-16 text-white">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-balance">Add e-invoicing to your app today.</h2>
          <p className="mt-3 text-ink-300">One install, no Java, no native build. A star helps others find it.</p>
          <div className="mt-8 w-full max-w-xl text-left">
            <InstallCommand />
          </div>
          <div className="mt-4">
            <StarButton label="Star on GitHub" />
          </div>
        </div>
      </section>
    </main>
  );
}
