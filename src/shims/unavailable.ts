/**
 * Stand-in for `node:fs`, `node:path` and `node:url`. Only the package's own
 * `validateXsd` touches them, and the demo never calls it (see src/lib/xsd.ts).
 * Every name that function imports is exported so the bundler can link it.
 */
const unavailable = (): never => {
  throw new Error("Node filesystem APIs are not available in the browser.");
};

export {
  unavailable as dirname,
  unavailable as existsSync,
  unavailable as fileURLToPath,
  unavailable as join,
  unavailable as pathToFileURL,
  unavailable as readdirSync,
  unavailable as readFileSync,
  unavailable as statSync,
};
