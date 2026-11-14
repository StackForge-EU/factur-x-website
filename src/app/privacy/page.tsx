import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "No cookies, self-hosted cookieless statistics, and a demo that never uploads your invoices: how the factur-x website handles data.",
  alternates: { canonical: "/privacy" },
};

const PRIVACY_EMAIL = <a href="mailto:privacy@stack-forge.eu">privacy@stack-forge.eu</a>;

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <p className="mt-4 text-sm text-ink-500">Last updated: 14 November 2026</p>

      <div className="legal-prose">
        <p className="legal-summary">
          <strong>In short:</strong> this website sets no cookies. It counts visits with Umami, an open-source tool we
          run on our own servers in Germany, without storing your IP address. The demo runs in your browser: the PDFs,
          XML files and invoice data you enter are never sent to us or anyone else. The details follow.
        </p>

        <h2>1. Who is responsible</h2>
        <p>
          Responsible for this website (the controller under the GDPR) is StackForge UG (haftungsbeschränkt),
          Bergstraße 4, 84107 Weihmichl, Germany. For anything about your data, write to {PRIVACY_EMAIL}. See also the{" "}
          <a href="/imprint">imprint</a>.
        </p>

        <h2>2. This website</h2>
        <h3>What it does not do</h3>
        <ul>
          <li>No cookies and no other storage in your browser.</li>
          <li>No advertising, no tracking pixels, no tracking across other websites.</li>
          <li>
            No content from other companies. Text, images, styles, scripts and the one web font come from this server;
            the one exception is the statistics script described below, which comes from our own statistics server.
            There are no embedded videos, maps or social media buttons.
          </li>
          <li>
            The GitHub star count shown on the page is fetched by our server, not by your browser; GitHub learns
            nothing about you.
          </li>
          <li>
            Links to other sites, such as GitHub and npm, are plain links: the other site is contacted only if you
            follow one, and our pages ask your browser not to tell it where you came from.
          </li>
        </ul>

        <h3>The demo</h3>
        <p>
          The demo is the factur-x library running inside your browser tab. Files you choose and data you type are
          read into the page’s memory, processed there and discarded when you close or reload the tab. Nothing is
          uploaded, and nothing is stored. A file you download is created on your device. The statistics below never
          include anything you enter into the demo.
        </p>

        <h3>Visitor statistics</h3>
        <p>
          To see how many people visit this site and which pages they read, we use Umami, an open-source analytics
          tool that we run ourselves on our own infrastructure in Germany.
        </p>
        <ul>
          <li>
            Umami records the page’s address and title, the referring page if your browser sends one, your screen size
            and your browser’s language.
          </li>
          <li>
            From the request it works out your browser, operating system and device type, and an approximate location
            looked up from your IP address (at most country, region and city).
          </li>
          <li>
            Your IP address is not stored. Umami sets no cookies and stores nothing in your browser. To count several
            page views of one visitor as one visit, it computes a hash that changes regularly and cannot be turned
            back into the data it was made from.
          </li>
        </ul>
        <p>
          Legal basis: Art. 6(1)(f) GDPR. Our legitimate interest is to learn which pages are useful and to improve
          the site. The data is processed and stored in Germany only; we do not combine it with other data and do not
          pass it on. You can object to this processing at any time (Art. 21 GDPR): write to {PRIVACY_EMAIL}. If a
          content blocker stops Umami’s script, the site works the same.
        </p>

        <h3>Hosting and server logs</h3>
        <p>
          The site and the statistics server run on our own infrastructure, on servers of a hosting provider in
          Germany that processes data on our behalf (Art. 28 GDPR). When you open a page, your browser sends the usual
          request data: your IP address, date and time, the address requested, the referring page if your browser
          sends one, and your browser’s user agent. We keep these in server logs to deliver the site and to keep it
          secure, and delete them after 14 days.
        </p>
        <p>
          Legal basis: Art. 6(1)(f) GDPR. Our legitimate interest is a website that works and stays secure. We do not
          combine this data with other data and do not use it to identify you.
        </p>

        <h2>3. The factur-x library</h2>
        <p>
          The library runs wherever you install it. It makes no network requests and sends no telemetry; we receive no
          data from it.
        </p>

        <h2>4. Your rights</h2>
        <p>
          Under the GDPR you have the right of access (Art. 15), rectification (Art. 16), erasure (Art. 17),
          restriction of processing (Art. 18), data portability (Art. 20) and to object (Art. 21). Write to{" "}
          {PRIVACY_EMAIL}. You also have the right to lodge a complaint with a data protection supervisory authority
          (Art. 77): the one responsible for us, the Bayerisches Landesamt für Datenschutzaufsicht, or the one in the
          EU Member State where you live or work.
        </p>

        <h2>5. Changes</h2>
        <p>
          We update this policy when the website changes. The current version is always on this page, and its history
          is public in the <a href="https://github.com/StackForge-EU/factur-x-website">website’s repository</a>.
        </p>
      </div>
    </LegalPage>
  );
}
