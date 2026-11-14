import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { GITHUB_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Imprint",
  description: "Provider and contact details for the factur-x website and library: StackForge UG (haftungsbeschränkt).",
  alternates: { canonical: "/imprint" },
};

export default function ImprintPage() {
  return (
    <LegalPage title="Imprint">
      <p className="mt-4 text-ink-500">
        Who provides this website and publishes the factur-x library. This is also the information about the licensor
        that the EUPL asks for (Art. 11).
      </p>

      <dl className="legal-facts">
        <dt>Provider</dt>
        <dd>
          <a href="https://www.stack-forge.eu">StackForge UG (haftungsbeschränkt)</a>
        </dd>
        <dt>Address</dt>
        <dd>
          Bergstraße 4<br />
          84107 Weihmichl
          <br />
          Germany
        </dd>
        <dt>Represented by</dt>
        <dd>Tobias Sittenauer and Manuel Stingl, managing directors</dd>
        <dt>Email</dt>
        <dd>
          <a href="mailto:hallo@stack-forge.eu">hallo@stack-forge.eu</a>
        </dd>
        <dt>Phone</dt>
        <dd>+49 (0) 156 797 670 00</dd>
        <dt>Commercial register</dt>
        <dd>Amtsgericht Landshut, HRB 15051</dd>
        <dt>VAT ID</dt>
        <dd>DE458158604</dd>
      </dl>

      <div className="legal-prose">
        <h2>Security issues</h2>
        <p>
          To report a vulnerability, follow the <a href={`${GITHUB_URL}/blob/main/SECURITY.md`}>security policy</a>.
        </p>

        <h2>No legal or tax advice</h2>
        <p>
          The demo and its validation results are a technical aid. They check XML structure and calculation rules, not
          whether a document meets every legal requirement for an invoice in your country.
        </p>

        <h2>Names of other products</h2>
        <p>
          Factur-X, ZUGFeRD and XRechnung are standards published by FNFE-MPE, FeRD and KoSIT. This project implements
          them independently and is not affiliated with or endorsed by these organisations.
        </p>
      </div>
    </LegalPage>
  );
}
