/**
 * Reads UN/CEFACT Cross Industry Invoice XML (the format inside every
 * Factur-X / ZUGFeRD PDF) into a flat view model for display, and runs the
 * EN 16931 arithmetic rules that an XSD cannot express.
 */

export interface CiiParty {
  name?: string;
  addressLines: string[];
  country?: string;
  taxIds: string[];
  contact: string[];
}

export interface CiiLine {
  id?: string;
  name?: string;
  description?: string;
  quantity?: number;
  unitCode?: string;
  unitPrice?: number;
  netAmount?: number;
  vatRatePercent?: number;
  vatCategory?: string;
}

export interface CiiVat {
  category?: string;
  ratePercent?: number;
  taxableAmount?: number;
  taxAmount?: number;
  exemptionReason?: string;
}

export interface CiiTotals {
  lineTotal?: number;
  allowanceTotal?: number;
  chargeTotal?: number;
  taxBasisTotal?: number;
  taxTotal?: number;
  grandTotal?: number;
  prepaidAmount?: number;
  roundingAmount?: number;
  duePayableAmount?: number;
}

export interface CiiInvoice {
  guideline?: string;
  businessProcess?: string;
  id?: string;
  typeCode?: string;
  issueDate?: string;
  deliveryDate?: string;
  dueDate?: string;
  currency?: string;
  buyerReference?: string;
  orderReference?: string;
  notes: string[];
  seller?: CiiParty;
  buyer?: CiiParty;
  lines: CiiLine[];
  vat: CiiVat[];
  totals: CiiTotals;
  payment: {
    meansCode?: string;
    iban?: string;
    bic?: string;
    reference?: string;
    terms?: string;
  };
}

export interface ArithmeticCheck {
  /** EN 16931 business rule id, e.g. `BR-CO-15`. */
  rule: string;
  description: string;
  expected: number;
  actual: number;
  passed: boolean;
}

/** Child elements by local name — CII prefixes (rsm/ram/udt) vary between producers. */
const children = (el: Element | undefined, name: string): Element[] =>
  el ? Array.from(el.children).filter((child) => child.localName === name) : [];

const at = (el: Element | undefined, ...path: string[]): Element | undefined =>
  path.reduce<Element | undefined>((current, name) => children(current, name)[0], el);

const text = (el: Element | undefined, ...path: string[]): string | undefined =>
  at(el, ...path)?.textContent?.trim() || undefined;

const number = (el: Element | undefined, ...path: string[]): number | undefined => {
  const value = text(el, ...path);
  return value === undefined || Number.isNaN(Number(value)) ? undefined : Number(value);
};

/** CII dates are `YYYYMMDD` (format 102); returned as ISO `YYYY-MM-DD`. */
const date = (el: Element | undefined, ...path: string[]): string | undefined => {
  const value = text(el, ...path, "DateTimeString");
  return value && /^\d{8}$/.test(value)
    ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}`
    : value;
};

const defined = <T>(values: (T | undefined)[]): T[] => values.filter((v) => v !== undefined);

function party(el: Element | undefined): CiiParty | undefined {
  if (!el) return undefined;
  const address = at(el, "PostalTradeAddress");
  const contact = at(el, "DefinedTradeContact");
  return {
    name: text(el, "Name"),
    addressLines: defined([
      text(address, "LineOne"),
      text(address, "LineTwo"),
      text(address, "LineThree"),
      [text(address, "PostcodeCode"), text(address, "CityName")].filter(Boolean).join(" ") || undefined,
    ]),
    country: text(address, "CountryID"),
    taxIds: defined(children(el, "SpecifiedTaxRegistration").map((reg) => text(reg, "ID"))),
    contact: defined([
      text(contact, "PersonName"),
      text(contact, "TelephoneUniversalCommunication", "CompleteNumber"),
      text(contact, "EmailURIUniversalCommunication", "URIID"),
    ]),
  };
}

function line(el: Element): CiiLine {
  const tax = at(el, "SpecifiedLineTradeSettlement", "ApplicableTradeTax");
  return {
    id: text(el, "AssociatedDocumentLineDocument", "LineID"),
    name: text(el, "SpecifiedTradeProduct", "Name"),
    description: text(el, "SpecifiedTradeProduct", "Description"),
    quantity: number(el, "SpecifiedLineTradeDelivery", "BilledQuantity"),
    unitCode: at(el, "SpecifiedLineTradeDelivery", "BilledQuantity")?.getAttribute("unitCode") ?? undefined,
    unitPrice: number(el, "SpecifiedLineTradeAgreement", "NetPriceProductTradePrice", "ChargeAmount"),
    netAmount: number(
      el,
      "SpecifiedLineTradeSettlement",
      "SpecifiedTradeSettlementLineMonetarySummation",
      "LineTotalAmount",
    ),
    vatRatePercent: number(tax, "RateApplicablePercent"),
    vatCategory: text(tax, "CategoryCode"),
  };
}

/**
 * Parses CII XML into a {@link CiiInvoice}.
 * @throws Error if the string is not well-formed XML or not a CrossIndustryInvoice.
 */
export function parseCii(xml: string): CiiInvoice {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("The embedded file is not well-formed XML.");
  const root = doc.documentElement;
  if (root.localName !== "CrossIndustryInvoice") {
    throw new Error(`Expected a CrossIndustryInvoice document, found <${root.localName}>.`);
  }

  const context = at(root, "ExchangedDocumentContext");
  const header = at(root, "ExchangedDocument");
  const transaction = at(root, "SupplyChainTradeTransaction");
  const agreement = at(transaction, "ApplicableHeaderTradeAgreement");
  const settlement = at(transaction, "ApplicableHeaderTradeSettlement");
  const summation = at(settlement, "SpecifiedTradeSettlementHeaderMonetarySummation");
  const means = at(settlement, "SpecifiedTradeSettlementPaymentMeans");
  const terms = at(settlement, "SpecifiedTradePaymentTerms");
  const currency = text(settlement, "InvoiceCurrencyCode");

  // TaxTotalAmount may appear twice (invoice currency + tax accounting currency).
  const taxTotals = children(summation, "TaxTotalAmount");
  const taxTotal = taxTotals.find((el) => el.getAttribute("currencyID") === currency) ?? taxTotals[0];

  return {
    guideline: text(context, "GuidelineSpecifiedDocumentContextParameter", "ID"),
    businessProcess: text(context, "BusinessProcessSpecifiedDocumentContextParameter", "ID"),
    id: text(header, "ID"),
    typeCode: text(header, "TypeCode"),
    issueDate: date(header, "IssueDateTime"),
    deliveryDate: date(
      transaction,
      "ApplicableHeaderTradeDelivery",
      "ActualDeliverySupplyChainEvent",
      "OccurrenceDateTime",
    ),
    dueDate: date(terms, "DueDateDateTime"),
    currency,
    buyerReference: text(agreement, "BuyerReference"),
    orderReference: text(agreement, "BuyerOrderReferencedDocument", "IssuerAssignedID"),
    notes: defined(children(header, "IncludedNote").map((note) => text(note, "Content"))),
    seller: party(at(agreement, "SellerTradeParty")),
    buyer: party(at(agreement, "BuyerTradeParty")),
    lines: children(transaction, "IncludedSupplyChainTradeLineItem").map(line),
    vat: children(settlement, "ApplicableTradeTax").map((tax) => ({
      category: text(tax, "CategoryCode"),
      ratePercent: number(tax, "RateApplicablePercent"),
      taxableAmount: number(tax, "BasisAmount"),
      taxAmount: number(tax, "CalculatedAmount"),
      exemptionReason: text(tax, "ExemptionReason"),
    })),
    totals: {
      lineTotal: number(summation, "LineTotalAmount"),
      allowanceTotal: number(summation, "AllowanceTotalAmount"),
      chargeTotal: number(summation, "ChargeTotalAmount"),
      taxBasisTotal: number(summation, "TaxBasisTotalAmount"),
      taxTotal: taxTotal?.textContent ? Number(taxTotal.textContent) : undefined,
      grandTotal: number(summation, "GrandTotalAmount"),
      prepaidAmount: number(summation, "TotalPrepaidAmount"),
      roundingAmount: number(summation, "RoundingAmount"),
      duePayableAmount: number(summation, "DuePayableAmount"),
    },
    payment: {
      meansCode: text(means, "TypeCode"),
      iban: text(means, "PayeePartyCreditorFinancialAccount", "IBANID"),
      bic: text(means, "PayeeSpecifiedCreditorFinancialInstitution", "BICID"),
      reference: text(settlement, "PaymentReference"),
      terms: text(terms, "Description"),
    },
  };
}

const sum = (values: (number | undefined)[]) => values.reduce<number>((total, v) => total + (v ?? 0), 0);

/**
 * Checks the EN 16931 calculation rules (BR-CO-10/13/14/15/16). A rule is
 * skipped when the profile omits one of its operands — MINIMUM, for example,
 * carries neither lines nor a line total.
 */
export function checkArithmetic(invoice: CiiInvoice): ArithmeticCheck[] {
  const { totals, lines, vat } = invoice;
  const checks: ArithmeticCheck[] = [];
  const add = (rule: string, description: string, actual: number | undefined, expected: number) => {
    if (actual === undefined) return;
    checks.push({ rule, description, expected, actual, passed: Math.abs(actual - expected) < 0.005 });
  };

  if (lines.length > 0 && lines.every((l) => l.netAmount !== undefined)) {
    add("BR-CO-10", "Line total = sum of line net amounts", totals.lineTotal, sum(lines.map((l) => l.netAmount)));
  }
  if (totals.lineTotal !== undefined) {
    add(
      "BR-CO-13",
      "Tax basis = line total − allowances + charges",
      totals.taxBasisTotal,
      totals.lineTotal - (totals.allowanceTotal ?? 0) + (totals.chargeTotal ?? 0),
    );
  }
  if (vat.length > 0) {
    add("BR-CO-14", "Tax total = sum of VAT breakdown amounts", totals.taxTotal, sum(vat.map((v) => v.taxAmount)));
  }
  if (totals.taxBasisTotal !== undefined) {
    add(
      "BR-CO-15",
      "Grand total = tax basis + tax total",
      totals.grandTotal,
      totals.taxBasisTotal + (totals.taxTotal ?? 0),
    );
  }
  if (totals.grandTotal !== undefined) {
    add(
      "BR-CO-16",
      "Amount due = grand total − prepaid + rounding",
      totals.duePayableAmount,
      totals.grandTotal - (totals.prepaidAmount ?? 0) + (totals.roundingAmount ?? 0),
    );
  }
  return checks;
}
