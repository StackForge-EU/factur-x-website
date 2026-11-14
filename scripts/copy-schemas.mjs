// Copies the official Factur-X XSDs out of the npm package into public/schema,
// where the in-browser validator (src/lib/xsd.ts) fetches them on demand.
import { cpSync, rmSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const packageRoot = dirname(dirname(createRequire(import.meta.url).resolve("@stackforge-eu/factur-x")));
const target = join(import.meta.dirname, "..", "public", "schema");

rmSync(target, { recursive: true, force: true });
cpSync(join(packageRoot, "schema"), target, {
  recursive: true,
  filter: (source) => source.endsWith(".xsd") || statSync(source).isDirectory(),
});
