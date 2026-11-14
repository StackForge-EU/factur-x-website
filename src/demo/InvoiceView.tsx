import type { ReactNode } from "react";
import type { CiiInvoice, CiiParty } from "../lib/cii";
import { documentTypeLabel, money, unitLabel } from "../lib/labels";

function Party({ title, party }: { title: string; party: CiiParty | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">{title}</p>
      {party ? (
        <address className="mt-1 text-sm not-italic leading-relaxed">
          <span className="font-semibold">{party.name ?? "—"}</span>
          {[...party.addressLines, party.country].filter(Boolean).map((value, index) => (
            <span key={index} className="block">
              {value}
            </span>
          ))}
          {party.taxIds.map((id) => (
            <span key={id} className="block text-ink-500">
              Tax ID {id}
            </span>
          ))}
          {party.contact.map((value) => (
            <span key={value} className="block text-ink-500">
              {value}
            </span>
          ))}
        </address>
      ) : (
        <p className="mt-1 text-sm text-ink-500">Not provided</p>
      )}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return children ? (
    <div>
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="text-sm font-medium break-words">{children}</dd>
    </div>
  ) : null;
}

/** The structured invoice data, laid out the way a person reads an invoice. */
export function InvoiceView({ invoice }: { invoice: CiiInvoice }) {
  const { totals, payment, currency } = invoice;
  const totalRows: [string, number | undefined][] = [
    ["Line total", totals.lineTotal],
    ["Allowances", totals.allowanceTotal && -totals.allowanceTotal],
    ["Charges", totals.chargeTotal],
    ["Net (tax basis)", totals.taxBasisTotal],
    ...invoice.vat.map((vat): [string, number | undefined] => [
      `VAT ${vat.ratePercent ?? 0}% (${vat.category ?? "?"}) on ${money(vat.taxableAmount, currency)}`,
      vat.taxAmount,
    ]),
    ["Grand total", totals.grandTotal],
    ["Prepaid", totals.prepaidAmount && -totals.prepaidAmount],
  ];

  return (
    <article className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-100 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forge-700">
            {documentTypeLabel(invoice.typeCode)}
          </p>
          <h4 className="mt-1 text-2xl font-bold break-all">{invoice.id ?? "No invoice number"}</h4>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:text-right">
          <Fact label="Issued">{invoice.issueDate}</Fact>
          <Fact label="Due">{invoice.dueDate}</Fact>
          <Fact label="Delivered">{invoice.deliveryDate}</Fact>
          <Fact label="Buyer reference">{invoice.buyerReference}</Fact>
          <Fact label="Order">{invoice.orderReference}</Fact>
        </dl>
      </header>

      <div className="grid gap-6 py-5 sm:grid-cols-2">
        <Party title="Seller" party={invoice.seller} />
        <Party title="Buyer" party={invoice.buyer} />
      </div>

      {invoice.lines.length > 0 ? (
        <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
                <th className="py-2 pr-3 font-semibold">#</th>
                <th className="py-2 pr-3 font-semibold">Description</th>
                <th className="py-2 pr-3 text-right font-semibold">Quantity</th>
                <th className="py-2 pr-3 text-right font-semibold">Unit price</th>
                <th className="py-2 pr-3 text-right font-semibold">VAT</th>
                <th className="py-2 text-right font-semibold">Net</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {invoice.lines.map((line, index) => (
                <tr key={index} className="border-b border-ink-100 align-top">
                  <td className="py-2 pr-3 text-ink-500">{line.id ?? index + 1}</td>
                  <td className="py-2 pr-3">
                    <span className="font-medium">{line.name ?? "—"}</span>
                    {line.description && <span className="block text-ink-500">{line.description}</span>}
                  </td>
                  <td className="py-2 pr-3 text-right whitespace-nowrap">
                    {line.quantity ?? "—"} {unitLabel(line.unitCode)}
                  </td>
                  <td className="py-2 pr-3 text-right whitespace-nowrap">{money(line.unitPrice)}</td>
                  <td className="py-2 pr-3 text-right whitespace-nowrap">
                    {line.vatRatePercent === undefined ? (line.vatCategory ?? "—") : `${line.vatRatePercent}%`}
                  </td>
                  <td className="py-2 text-right whitespace-nowrap">{money(line.netAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-lg bg-ink-50 p-3 text-sm text-ink-500">
          This profile carries no line items — only document-level totals.
        </p>
      )}

      <dl className="mt-5 ml-auto max-w-sm space-y-1.5 text-sm tabular-nums">
        {totalRows
          .filter(([, amount]) => amount !== undefined && amount !== 0)
          .map(([label, amount]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-ink-500">{label}</dt>
              <dd className="whitespace-nowrap">{money(amount, currency)}</dd>
            </div>
          ))}
        <div className="flex justify-between gap-4 border-t border-ink-900 pt-2 text-base font-bold">
          <dt>Amount due</dt>
          <dd className="whitespace-nowrap">{money(totals.duePayableAmount, currency)}</dd>
        </div>
      </dl>

      {(payment.iban || payment.terms || payment.reference || invoice.notes.length > 0) && (
        <footer className="mt-6 space-y-4 border-t border-ink-100 pt-5">
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-3">
            <Fact label="IBAN">{payment.iban}</Fact>
            <Fact label="BIC">{payment.bic}</Fact>
            <Fact label="Payment reference">{payment.reference}</Fact>
            <Fact label="Payment terms">{payment.terms}</Fact>
          </dl>
          {invoice.notes.map((note, index) => (
            <p key={index} className="text-sm whitespace-pre-line text-ink-500">
              {note}
            </p>
          ))}
        </footer>
      )}
    </article>
  );
}
