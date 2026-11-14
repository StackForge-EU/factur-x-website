import type { Dispatch, SetStateAction } from "react";
import { emptyLine, round2, type DraftLine, type DraftParty, type InvoiceDraft } from "../lib/invoice-draft";
import { money, unitOptions } from "../lib/labels";
import { Field, Icon } from "./ui";

type SetDraft = Dispatch<SetStateAction<InvoiceDraft>>;

const toNumber = (value: number) => (Number.isNaN(value) ? 0 : value);

function PartyFields({
  title,
  party,
  onChange,
}: {
  title: string;
  party: DraftParty;
  onChange: (patch: Partial<DraftParty>) => void;
}) {
  const input = (key: keyof DraftParty, label: string, className = "") => (
    <Field label={label} className={className}>
      {(id) => (
        <input
          id={id}
          className="field-input"
          value={party[key]}
          onChange={(event) => onChange({ [key]: event.target.value })}
        />
      )}
    </Field>
  );

  return (
    <fieldset className="grid grid-cols-6 gap-3">
      <legend className="mb-2 text-sm font-semibold">{title}</legend>
      {input("name", "Name", "col-span-6")}
      {input("street", "Street", "col-span-6")}
      {input("postalCode", "Postal code", "col-span-2")}
      {input("city", "City", "col-span-3")}
      {input("country", "Country", "col-span-1")}
      {input("vatId", "VAT ID", "col-span-6 sm:col-span-3")}
      {input("email", "Email", "col-span-6 sm:col-span-3")}
    </fieldset>
  );
}

function LineRow({
  line,
  index,
  currency,
  onChange,
  onRemove,
}: {
  line: DraftLine;
  index: number;
  currency: string;
  onChange: (patch: Partial<DraftLine>) => void;
  onRemove?: () => void;
}) {
  const n = index + 1;
  return (
    // From `lg` up the number columns are fixed and the total sizes to its content,
    // so amounts like 99,999.99 EUR never collide with the inputs.
    <li className="grid grid-cols-12 items-end gap-2 rounded-lg bg-ink-50 p-3 lg:grid-cols-[minmax(0,1fr)_5.5rem_6.5rem_7rem_4.5rem_auto]">
      <Field label="Description" className="col-span-12 lg:col-auto">
        {(id) => (
          <input
            id={id}
            className="field-input"
            value={line.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        )}
      </Field>
      <Field label="Qty" className="col-span-3 lg:col-auto">
        {(id) => (
          <input
            id={id}
            type="number"
            min={0}
            step="any"
            className="field-input"
            value={line.quantity}
            onChange={(event) => onChange({ quantity: toNumber(event.target.valueAsNumber) })}
          />
        )}
      </Field>
      <Field label="Unit" className="col-span-4 lg:col-auto">
        {(id) => (
          <select
            id={id}
            className="field-input"
            value={line.unitCode}
            onChange={(event) => onChange({ unitCode: event.target.value })}
          >
            {unitOptions.map((unit) => (
              <option key={unit.code} value={unit.code}>
                {unit.label}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Unit price" className="col-span-5 lg:col-auto">
        {(id) => (
          <input
            id={id}
            type="number"
            min={0}
            step="any"
            className="field-input"
            value={line.unitPrice}
            onChange={(event) => onChange({ unitPrice: toNumber(event.target.valueAsNumber) })}
          />
        )}
      </Field>
      <Field label="VAT %" className="col-span-3 lg:col-auto">
        {(id) => (
          <input
            id={id}
            type="number"
            min={0}
            step="any"
            className="field-input"
            value={line.vatRatePercent}
            onChange={(event) => onChange({ vatRatePercent: toNumber(event.target.valueAsNumber) })}
          />
        )}
      </Field>
      <div className="col-span-9 flex min-h-[38px] items-center justify-end gap-1 lg:col-auto lg:min-w-[9.5rem]">
        <span className="text-sm font-semibold whitespace-nowrap tabular-nums">
          {money(round2(line.quantity * line.unitPrice), currency)}
        </span>
        <button
          type="button"
          className="rounded-md p-2 text-ink-500 hover:bg-ink-100 hover:text-bad-700 disabled:opacity-30"
          onClick={onRemove}
          disabled={!onRemove}
          aria-label={`Remove line ${n}`}
        >
          <Icon name="trash" />
        </button>
      </div>
    </li>
  );
}

/** The short invoice form; totals and VAT are derived in `draftToInput`. */
export function InvoiceForm({ draft, setDraft }: { draft: InvoiceDraft; setDraft: SetDraft }) {
  const set = (patch: Partial<InvoiceDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const setLine = (index: number, patch: Partial<DraftLine>) =>
    set({ lines: draft.lines.map((line, i) => (i === index ? { ...line, ...patch } : line)) });

  const text = (key: "number" | "issueDate" | "deliveryDate" | "dueDate" | "currency" | "buyerReference" | "iban", label: string, type = "text", className = "") => (
    <Field label={label} className={className}>
      {(id) => (
        <input
          id={id}
          type={type}
          className="field-input"
          value={draft[key]}
          onChange={(event) => set({ [key]: event.target.value })}
        />
      )}
    </Field>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {text("number", "Invoice number", "text", "col-span-2 sm:col-span-1")}
        {text("issueDate", "Issue date", "date")}
        {text("deliveryDate", "Delivery date", "date")}
        {text("dueDate", "Due date", "date")}
        {text("currency", "Currency")}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <PartyFields
          title="Seller"
          party={draft.seller}
          onChange={(patch) => set({ seller: { ...draft.seller, ...patch } })}
        />
        <PartyFields
          title="Buyer"
          party={draft.buyer}
          onChange={(patch) => set({ buyer: { ...draft.buyer, ...patch } })}
        />
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold">Line items</h4>
        <ul className="space-y-2">
          {draft.lines.map((line, index) => (
            <LineRow
              key={index}
              line={line}
              index={index}
              currency={draft.currency}
              onChange={(patch) => setLine(index, patch)}
              onRemove={
                draft.lines.length > 1
                  ? () => set({ lines: draft.lines.filter((_, i) => i !== index) })
                  : undefined
              }
            />
          ))}
        </ul>
        <button
          type="button"
          className="btn btn-secondary mt-3"
          onClick={() => set({ lines: [...draft.lines, emptyLine()] })}
        >
          <Icon name="plus" />
          Add line
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {text("iban", "IBAN (SEPA credit transfer)")}
        {text("buyerReference", "Buyer reference / Leitweg-ID (optional)")}
      </div>
    </div>
  );
}
