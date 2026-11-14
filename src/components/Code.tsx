// Comments and the few keywords our snippets use; the capture group makes
// String.split return matches at odd indices.
const TOKEN = /(\/\*.*?\*\/|\/\/.*$|\b(?:import|from|const|await)\b)/gm;

/** A dark code block with minimal syntax colouring for the TypeScript snippets on the page. */
export function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-ink-100">
      <code>
        {children.split(TOKEN).map((part, index) =>
          index % 2 === 0 ? (
            part
          ) : (
            <span key={index} className={part.startsWith("/") ? "text-ink-500" : "text-forge-400"}>
              {part}
            </span>
          ),
        )}
      </code>
    </pre>
  );
}
