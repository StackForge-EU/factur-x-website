import fontkit from "@pdf-lib/fontkit";
import type { FacturXInvoiceInput, TradePartyInput } from "@stackforge-eu/factur-x";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { documentTypeLabel, money, unitLabel } from "./labels";

const INK = rgb(0.07, 0.09, 0.12);
const MUTED = rgb(0.36, 0.4, 0.46);
const RULE = rgb(0.9, 0.91, 0.93);
const MARGIN = 56;

const fetchBytes = async (url: string) => new Uint8Array(await (await fetch(url)).arrayBuffer());

const partyLines = (party: TradePartyInput): string[] => [
  party.name,
  ...(party.address
    ? [party.address.line1, `${party.address.postalCode} ${party.address.city}`, party.address.country]
    : []),
  ...(party.taxRegistrations ?? []).map((reg) => `VAT ID ${reg.id}`),
];

/**
 * Renders a plain A4 invoice for the given input, for visitors who have no PDF
 * at hand. Fonts are embedded (not the PDF standard 14) because PDF/A forbids
 * unembedded fonts.
 */
export async function generateSamplePdf(input: FacturXInvoiceInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [regular, bold] = await Promise.all([
    fetchBytes("/fonts/SpaceGrotesk-Regular.ttf").then((bytes) => pdf.embedFont(bytes)),
    fetchBytes("/fonts/SpaceGrotesk-Bold.ttf").then((bytes) => pdf.embedFont(bytes)),
  ]);

  const page = pdf.addPage([595.28, 841.89]);
  const right = page.getWidth() - MARGIN;
  const currency = input.totals.currency;
  let y = page.getHeight() - MARGIN;

  const draw = (value: string, x: number, font: PDFFont = regular, size = 10, color = INK) =>
    page.drawText(value, { x, y, font, size, color });
  const drawRight = (value: string, x: number, font: PDFFont = regular, size = 10, color = INK) =>
    page.drawText(value, { x: x - font.widthOfTextAtSize(value, size), y, font, size, color });
  const rule = (p: PDFPage = page) =>
    p.drawLine({ start: { x: MARGIN, y }, end: { x: right, y }, thickness: 0.75, color: RULE });

  draw(documentTypeLabel(input.document.typeCode), MARGIN, bold, 22);
  drawRight(input.document.id, right, bold, 12);
  y -= 16;
  drawRight(`Issued ${input.document.issueDate}`, right, regular, 10, MUTED);
  y -= 40;

  const top = y;
  for (const [x, label, party] of [
    [MARGIN, "FROM", input.seller],
    [MARGIN + 260, "BILL TO", input.buyer],
  ] as const) {
    y = top;
    draw(label, x, bold, 8, MUTED);
    for (const [index, value] of partyLines(party).entries()) {
      y -= 14;
      draw(value, x, index === 0 ? bold : regular);
    }
  }
  y = top - 110;

  const columns = { qty: MARGIN + 290, price: MARGIN + 380, vat: MARGIN + 425 };
  draw("DESCRIPTION", MARGIN, bold, 8, MUTED);
  drawRight("QTY", columns.qty, bold, 8, MUTED);
  drawRight("UNIT PRICE", columns.price, bold, 8, MUTED);
  drawRight("VAT", columns.vat, bold, 8, MUTED);
  drawRight("NET", right, bold, 8, MUTED);
  y -= 8;
  rule();

  for (const line of input.lines ?? []) {
    y -= 18;
    draw(line.name, MARGIN);
    drawRight(`${line.quantity} ${unitLabel(line.unitCode)}`.trim(), columns.qty);
    drawRight(money(line.unitPrice), columns.price);
    drawRight(line.vatRatePercent === undefined ? "" : `${line.vatRatePercent}%`, columns.vat);
    drawRight(money(line.lineTotal ?? line.quantity * line.unitPrice), right);
    y -= 8;
    rule();
  }

  y -= 28;
  const totals: [string, number, PDFFont][] = [
    ["Net total", input.totals.taxBasisTotal, regular],
    ...(input.vatBreakdown ?? []).map(
      (vat): [string, number, PDFFont] => [`VAT ${vat.ratePercent}%`, vat.taxAmount, regular],
    ),
    ["Amount due", input.totals.duePayableAmount, bold],
  ];
  for (const [label, amount, font] of totals) {
    draw(label, columns.qty, font);
    drawRight(money(amount, currency), right, font);
    y -= 18;
  }

  y -= 24;
  const payment = [
    input.payment?.dueDate && `Payment due by ${input.payment.dueDate}`,
    input.payment?.iban && `IBAN ${input.payment.iban}`,
  ].filter((value): value is string => Boolean(value));
  for (const value of payment) {
    draw(value, MARGIN, regular, 10, MUTED);
    y -= 14;
  }

  return pdf.save();
}
