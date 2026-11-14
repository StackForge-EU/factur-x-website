import { DocumentTypeCode, UnitCode } from "@stackforge-eu/factur-x";

/** `{ HOUR: "HUR" }` → `{ HUR: "hour" }`: readable labels straight from the package enums. */
const invert = (codes: Record<string, string>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(codes).map(([name, code]) => [code, name.toLowerCase().replaceAll("_", " ")]),
  );

const unitLabels = invert(UnitCode);
const documentTypeLabels = invert(DocumentTypeCode);

export const unitOptions = Object.entries(unitLabels).map(([code, label]) => ({ code, label }));

export const unitLabel = (code: string | undefined) => (code ? (unitLabels[code] ?? code) : "");

export const documentTypeLabel = (code: string | undefined) => {
  const label = code ? documentTypeLabels[code] : undefined;
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : "Invoice";
};

/** Formats an amount as `1,234.50 EUR`; avoids currency symbols a PDF font may lack. */
export const money = (amount: number | undefined, currency = "") =>
  amount === undefined
    ? "—"
    : `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`.trim();
