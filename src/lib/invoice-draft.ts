import {
  DocumentTypeCode,
  VatCategoryCode,
  type FacturXInvoiceInput,
  type TradePartyInput,
} from "@stackforge-eu/factur-x";

/** The handful of fields the demo form asks for; everything else is derived. */
export interface DraftParty {
  name: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  vatId: string;
  /** Used as contact and as electronic address (scheme `EM`), which XRechnung requires. */
  email: string;
}

export interface DraftLine {
  name: string;
  quantity: number;
  unitCode: string;
  unitPrice: number;
  vatRatePercent: number;
}

export interface InvoiceDraft {
  number: string;
  issueDate: string;
  /** Date of supply; EN 16931 profiles require it (or a billing period). */
  deliveryDate: string;
  dueDate: string;
  currency: string;
  buyerReference: string;
  seller: DraftParty;
  buyer: DraftParty;
  lines: DraftLine[];
  iban: string;
}

export const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const isoDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

export const emptyLine = (): DraftLine => ({
  name: "",
  quantity: 1,
  unitCode: "C62",
  unitPrice: 0,
  vatRatePercent: 19,
});

export const sampleDraft = (): InvoiceDraft => ({
  number: "INV-2026-0042",
  issueDate: isoDate(0),
  deliveryDate: isoDate(0),
  dueDate: isoDate(30),
  currency: "EUR",
  buyerReference: "",
  seller: {
    name: "Musterfirma GmbH",
    street: "Musterstraße 1",
    postalCode: "80331",
    city: "München",
    country: "DE",
    vatId: "DE123456789",
    email: "billing@musterfirma.example",
  },
  buyer: {
    name: "Beispiel AG",
    street: "Rue de l'Exemple 7",
    postalCode: "75001",
    city: "Paris",
    country: "FR",
    vatId: "FR12345678901",
    email: "accounting@beispiel.example",
  },
  lines: [
    { name: "Software development", quantity: 12, unitCode: "HUR", unitPrice: 120, vatRatePercent: 19 },
    { name: "Hosting (monthly)", quantity: 1, unitCode: "MON", unitPrice: 49.9, vatRatePercent: 19 },
  ],
  iban: "DE89370400440532013000",
});

function toParty(party: DraftParty): TradePartyInput {
  return {
    name: party.name,
    address: {
      line1: party.street,
      postalCode: party.postalCode,
      city: party.city,
      country: party.country.toUpperCase(),
    },
    ...(party.vatId && { taxRegistrations: [{ id: party.vatId, schemeId: "VA" as const }] }),
    ...(party.email && {
      contact: { email: party.email },
      electronicAddress: { value: party.email, schemeID: "EM" },
    }),
  };
}

/**
 * Turns the form draft into a full package input: line nets, the VAT breakdown
 * per rate and the document totals are calculated here so the form never asks
 * for a number that follows from the lines.
 */
export function draftToInput(draft: InvoiceDraft): FacturXInvoiceInput {
  const lines = draft.lines.map((line, index) => ({
    id: String(index + 1),
    name: line.name,
    quantity: line.quantity,
    unitCode: line.unitCode,
    unitPrice: line.unitPrice,
    lineTotal: round2(line.quantity * line.unitPrice),
    vatCategoryCode: line.vatRatePercent > 0 ? VatCategoryCode.STANDARD_RATE : VatCategoryCode.ZERO_RATED,
    vatRatePercent: line.vatRatePercent,
  }));

  const taxableByRate = new Map<number, number>();
  for (const line of lines) {
    taxableByRate.set(line.vatRatePercent, (taxableByRate.get(line.vatRatePercent) ?? 0) + line.lineTotal);
  }
  const vatBreakdown = [...taxableByRate].map(([ratePercent, taxable]) => ({
    categoryCode: ratePercent > 0 ? VatCategoryCode.STANDARD_RATE : VatCategoryCode.ZERO_RATED,
    ratePercent,
    taxableAmount: round2(taxable),
    taxAmount: round2((taxable * ratePercent) / 100),
  }));

  const lineTotal = round2(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  const taxTotal = round2(vatBreakdown.reduce((sum, vat) => sum + vat.taxAmount, 0));
  const grandTotal = round2(lineTotal + taxTotal);

  return {
    document: {
      id: draft.number,
      issueDate: draft.issueDate,
      typeCode: DocumentTypeCode.COMMERCIAL_INVOICE,
      ...(draft.buyerReference && { buyerReference: draft.buyerReference }),
    },
    seller: toParty(draft.seller),
    buyer: toParty(draft.buyer),
    lines,
    ...(draft.deliveryDate && { delivery: { date: draft.deliveryDate } }),
    totals: {
      lineTotal,
      taxBasisTotal: lineTotal,
      taxTotal,
      grandTotal,
      duePayableAmount: grandTotal,
      currency: draft.currency.toUpperCase(),
    },
    vatBreakdown,
    payment: {
      meansCode: "58",
      ...(draft.iban && { iban: draft.iban.replace(/\s+/g, "") }),
      ...(draft.dueDate && { dueDate: draft.dueDate }),
    },
  };
}
