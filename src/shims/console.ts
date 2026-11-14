/**
 * Browser stand-in for `node:console`. factur-x reports PDF/A problems (missing
 * output intent, unembedded fonts) via `console.warn`; we collect them so the
 * demo can show them next to the result instead of hiding them in devtools.
 */
let warnings: string[] = [];

/** Returns the warnings logged since the last call and clears the buffer. */
export function takeWarnings(): string[] {
  const taken = warnings;
  warnings = [];
  return taken;
}

export default {
  ...globalThis.console,
  warn(...args: unknown[]) {
    warnings.push(args.map(String).join(" ").replace(/^\[factur-x\]\s*/, ""));
    globalThis.console.warn(...args);
  },
};
