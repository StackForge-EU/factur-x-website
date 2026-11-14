import { PROFILE_MAIN_XSD, PROFILE_SCHEMA_DIRS, type Profile } from "@stackforge-eu/factur-x";

export interface XmlIssue {
  message: string;
  line?: number;
  column?: number;
}

export interface XsdResult {
  valid: boolean;
  /** `false` when the document is not even parseable XML. */
  wellFormed: boolean;
  errors: XmlIssue[];
}

// Every profile's main XSD imports these three siblings.
const IMPORTED_SCHEMAS = ["QualifiedDataType_100", "ReusableAggregateBusinessInformationEntity_100", "UnqualifiedDataType_100"];

const basename = (url: string) => decodeURIComponent(url.slice(url.lastIndexOf("/") + 1));

/**
 * Fetches the four XSD files of a profile from /schema, where
 * scripts/copy-schemas.mjs puts the files shipped in the npm package.
 */
async function loadSchemas(profile: Profile): Promise<Map<string, Uint8Array>> {
  const main = PROFILE_MAIN_XSD[profile];
  const stem = main.replace(/\.xsd$/, "");
  const files = [main, ...IMPORTED_SCHEMAS.map((part) => `${stem}_${part}.xsd`)];
  const entries = await Promise.all(
    files.map(async (file) => {
      const response = await fetch(`/schema/${PROFILE_SCHEMA_DIRS[profile]}/${file}`);
      if (!response.ok) throw new Error(`Could not load schema ${file} (HTTP ${response.status}).`);
      return [file, new Uint8Array(await response.arrayBuffer())] as const;
    }),
  );
  return new Map(entries);
}

/**
 * Validates CII XML against the official Factur-X XSD of a profile, fully in
 * the browser. Mirrors `validateXsd` from the package, which needs `node:fs`.
 */
export async function validateXsd(xml: string, profile: Profile): Promise<XsdResult> {
  const [lib, schemas] = await Promise.all([import("libxml2-wasm"), loadSchemas(profile)]);
  const mainXsd = schemas.get(PROFILE_MAIN_XSD[profile]);
  if (!mainXsd) throw new Error(`No XSD bundled for profile ${profile}.`);

  const toIssues = (err: InstanceType<typeof lib.XmlLibError>): XmlIssue[] =>
    err.details.length > 0
      ? err.details.map((d) => ({ message: d.message.trim(), line: d.line, column: d.col }))
      : [{ message: err.message }];

  // libxml2 resolves the relative xsd:import of the main schema to absolute
  // URLs; all files of a profile are siblings, so the basename identifies them.
  lib.xmlCleanupInputProvider();
  lib.xmlRegisterInputProvider({
    match: (url) => schemas.has(basename(url)),
    open: (url) => lib.openBuffer(schemas.get(basename(url))!),
    read: lib.readBuffer,
    close: (fd) => {
      lib.closeBuffer(fd);
      return true;
    },
  });

  let xsdDoc, validator, xmlDoc;
  try {
    try {
      xmlDoc = lib.XmlDocument.fromString(xml);
    } catch (err) {
      if (err instanceof lib.XmlLibError) {
        return { valid: false, wellFormed: false, errors: toIssues(err) };
      }
      throw err;
    }
    xsdDoc = lib.XmlDocument.fromBuffer(mainXsd, { url: `file:///schema/${PROFILE_MAIN_XSD[profile]}` });
    validator = lib.XsdValidator.fromDoc(xsdDoc);
    validator.validate(xmlDoc);
    return { valid: true, wellFormed: true, errors: [] };
  } catch (err) {
    if (err instanceof lib.XmlValidateError) {
      return { valid: false, wellFormed: true, errors: toIssues(err) };
    }
    throw err;
  } finally {
    xmlDoc?.dispose();
    validator?.dispose();
    xsdDoc?.dispose();
    lib.xmlCleanupInputProvider();
  }
}
