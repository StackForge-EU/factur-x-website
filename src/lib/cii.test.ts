import { buildXml, Profile } from "@stackforge-eu/factur-x";
import { describe, expect, it } from "vitest";
import { checkArithmetic, parseCii } from "./cii";
import { draftToInput, sampleDraft } from "./invoice-draft";

describe("draft → package XML → parsed view", () => {
  const input = draftToInput(sampleDraft());
  const invoice = parseCii(buildXml(input, Profile.EN16931));

  it("derives totals and VAT from the lines", () => {
    // 12 × 120.00 + 1 × 49.90 = 1489.90, 19 % VAT = 283.08
    expect(input.totals).toMatchObject({ lineTotal: 1489.9, taxTotal: 283.08, grandTotal: 1772.98 });
    expect(input.vatBreakdown).toEqual([
      { categoryCode: "S", ratePercent: 19, taxableAmount: 1489.9, taxAmount: 283.08 },
    ]);
  });

  it("reads back what the package wrote", () => {
    expect(invoice).toMatchObject({
      id: "INV-2026-0042",
      typeCode: "380",
      issueDate: input.document.issueDate,
      dueDate: input.payment?.dueDate,
      currency: "EUR",
      seller: { name: "Musterfirma GmbH", country: "DE", taxIds: ["DE123456789"] },
      buyer: { name: "Beispiel AG", addressLines: ["Rue de l'Exemple 7", "75001 Paris"] },
      payment: { meansCode: "58", iban: "DE89370400440532013000" },
      totals: { lineTotal: 1489.9, taxTotal: 283.08, grandTotal: 1772.98, duePayableAmount: 1772.98 },
    });
    expect(invoice.lines).toHaveLength(2);
    expect(invoice.lines[0]).toMatchObject({ name: "Software development", quantity: 12, unitCode: "HUR", netAmount: 1440 });
  });

  it("passes every arithmetic rule for a consistent invoice", () => {
    const checks = checkArithmetic(invoice);
    expect(checks.map((c) => c.rule)).toEqual(["BR-CO-10", "BR-CO-13", "BR-CO-14", "BR-CO-15", "BR-CO-16"]);
    expect(checks.every((c) => c.passed)).toBe(true);
  });

  it("flags a grand total that does not add up", () => {
    const broken = { ...invoice, totals: { ...invoice.totals, grandTotal: 1800 } };
    const failed = checkArithmetic(broken).filter((c) => !c.passed);
    expect(failed.map((c) => c.rule)).toEqual(["BR-CO-15", "BR-CO-16"]);
  });

  it("rejects XML that is not a CII invoice", () => {
    expect(() => parseCii("<Invoice/>")).toThrow(/CrossIndustryInvoice/);
  });
});
