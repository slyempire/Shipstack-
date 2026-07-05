import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ShieldCheck, FileText, Cookie, Scale } from 'lucide-react';
import MarketingLayout from '../../components/marketing/MarketingLayout';

/**
 * Public legal pages: /legal/privacy, /legal/terms, /legal/cookie,
 * /legal/compliance. Content is drafted for the Kenya market (Data
 * Protection Act, 2019) — have counsel review before launch.
 */

const LAST_UPDATED = 'July 5, 2026';
const CONTACT_EMAIL = 'privacy@shipstack.co';

type SectionKey = 'privacy' | 'terms' | 'cookie' | 'compliance';

const Prose: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="space-y-6 text-[15px] leading-relaxed text-slate-600 [&_h2]:text-xl [&_h2]:font-black [&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:text-slate-900 [&_h2]:pt-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_strong]:text-slate-900">
    {children}
  </div>
);

const PrivacyContent = () => (
  <Prose>
    <p>
      Shipstack (operated by Murzak Technologies) provides logistics software for shippers,
      transporters, facilities and drivers. This policy explains what personal data we collect,
      why, and the choices you have. It is written to comply with the <strong>Kenya Data
      Protection Act, 2019</strong> and, where applicable, the GDPR.
    </p>
    <h2>1. Data we collect</h2>
    <ul>
      <li><strong>Account data</strong> — name, email, phone number, role, company, and verification documents you submit during onboarding.</li>
      <li><strong>Operational data</strong> — delivery notes, trips, orders, facility activity and documents created while using the platform. This data belongs to the tenant (your employer or client) that operates your workspace.</li>
      <li><strong>Location and telemetry</strong> — for drivers on active trips, GPS position, speed and odometer readings are logged continuously for dispatch, safety and SLA verification. Tracking is tied to on-duty status.</li>
      <li><strong>Payment data</strong> — M-Pesa transaction references (phone number, amount, receipt number). We never store M-Pesa PINs; payments are processed by Safaricom.</li>
      <li><strong>Technical data</strong> — IP address, device and browser information, and server logs used for security and troubleshooting.</li>
    </ul>
    <h2>2. Why we process it</h2>
    <ul>
      <li>To provide the service: dispatching, tracking, proof of delivery, invoicing and payments.</li>
      <li>To meet legal obligations, including KRA eTIMS tax invoicing.</li>
      <li>To secure the platform: fraud detection, audit trails and access control.</li>
      <li>With your consent, to send product updates. You can withdraw consent at any time.</li>
    </ul>
    <h2>3. Sharing</h2>
    <p>
      We share data only with: (a) the tenant whose workspace you operate in; (b) service
      providers under contract (hosting, error monitoring, payments — Safaricom M-Pesa; tax —
      KRA eTIMS); and (c) authorities where the law requires it. We do not sell personal data.
    </p>
    <h2>4. Retention</h2>
    <p>
      Operational and financial records are retained for as long as the tenant account is active
      and thereafter as required by Kenyan tax and commercial law (typically 5&ndash;7 years).
      Telemetry is retained for a shorter operational window before aggregation.
    </p>
    <h2>5. Your rights</h2>
    <p>
      Under the Data Protection Act you may request access to, correction of, or deletion of
      your personal data, object to processing, and lodge a complaint with the Office of the
      Data Protection Commissioner (ODPC). Contact us at <strong>{CONTACT_EMAIL}</strong> —
      we respond within 30 days.
    </p>
    <h2>6. Security</h2>
    <p>
      Data is encrypted in transit (TLS), access is role-restricted and audit-logged, and
      production systems are isolated. See our <Link to="/legal/compliance" className="text-brand font-bold underline underline-offset-4">compliance overview</Link> for details.
    </p>
  </Prose>
);

const TermsContent = () => (
  <Prose>
    <p>
      These Terms of Service govern access to and use of the Shipstack platform. By creating an
      account or using the platform you agree to these terms on behalf of yourself and, where
      applicable, the organisation you represent.
    </p>
    <h2>1. The service</h2>
    <p>
      Shipstack provides multi-tenant logistics software: dispatch, fleet and driver management,
      warehouse operations, order management, payments integration (M-Pesa) and tax invoicing
      (KRA eTIMS). The platform is provided on a subscription basis per tenant.
    </p>
    <h2>2. Accounts and acceptable use</h2>
    <ul>
      <li>You must provide accurate registration information and keep credentials confidential.</li>
      <li>You may not probe, disrupt or reverse-engineer the platform, or use it to violate any law.</li>
      <li>Tenant administrators are responsible for the users they invite and the data they upload.</li>
    </ul>
    <h2>3. Cargo and operations</h2>
    <p>
      Shipstack is a software provider. Contracts of carriage are between shippers and
      transporters. Custody and liability for cargo transfer upon verified loading authority and
      are documented through the platform (digital signatures, photographic evidence), but
      Shipstack is not a party to, and accepts no liability under, the contract of carriage.
    </p>
    <h2>4. Payments and taxes</h2>
    <p>
      M-Pesa payments are executed by Safaricom under their terms. Tax invoices are generated
      through KRA eTIMS using details supplied by the tenant; the tenant remains responsible for
      the accuracy of its tax information.
    </p>
    <h2>5. Data</h2>
    <p>
      Operational data belongs to the tenant that created it. Our use of personal data is
      described in the <Link to="/legal/privacy" className="text-brand font-bold underline underline-offset-4">Privacy Policy</Link>.
      On termination, tenants may export their data for 30 days, after which it is scheduled for deletion subject to legal retention duties.
    </p>
    <h2>6. Availability and changes</h2>
    <p>
      We target high availability but the service is provided &ldquo;as is&rdquo; without
      warranty of uninterrupted operation. We may update these terms; material changes will be
      notified to tenant administrators at least 14 days in advance.
    </p>
    <h2>7. Liability</h2>
    <p>
      To the maximum extent permitted by law, Shipstack&rsquo;s aggregate liability arising out
      of the service is limited to the fees paid by the tenant in the 12 months preceding the
      claim. Nothing in these terms excludes liability that cannot be excluded under Kenyan law.
    </p>
    <h2>8. Governing law</h2>
    <p>
      These terms are governed by the laws of Kenya. Disputes are subject to the exclusive
      jurisdiction of the courts of Nairobi.
    </p>
  </Prose>
);

const CookieContent = () => (
  <Prose>
    <p>
      This policy explains how Shipstack uses cookies and similar browser storage.
    </p>
    <h2>1. Strictly necessary storage</h2>
    <p>
      We use browser localStorage to keep you signed in, remember your workspace and language,
      and queue offline actions (for drivers working without connectivity). These are essential
      to the service and cannot be switched off.
    </p>
    <h2>2. Analytics</h2>
    <p>
      On our public marketing pages we use analytics to understand which pages are useful.
      Analytics only loads <strong>after you accept</strong> the cookie banner — declining it
      keeps your visit analytics-free, and the app itself never loads marketing analytics.
    </p>
    <h2>3. Third parties</h2>
    <p>
      Payment (Safaricom M-Pesa) and tax (KRA eTIMS) integrations run server-side and do not set
      cookies in your browser through Shipstack.
    </p>
    <h2>4. Managing preferences</h2>
    <p>
      You can change your choice at any time by clearing site data in your browser, which resets
      the consent banner. Questions: <strong>{CONTACT_EMAIL}</strong>.
    </p>
  </Prose>
);

const ComplianceContent = () => (
  <Prose>
    <p>
      An overview of the controls that protect data on the Shipstack platform.
    </p>
    <h2>1. Access control</h2>
    <p>
      Every user acts under a role (dispatcher, driver, finance, facility operator, and others)
      with least-privilege permissions enforced server-side. Tenant data is isolated per
      workspace.
    </p>
    <h2>2. Audit trails</h2>
    <p>
      Security-relevant actions — logins, payment events, document changes, dispatch decisions —
      are written to an append-only audit log available to tenant administrators.
    </p>
    <h2>3. Encryption and infrastructure</h2>
    <p>
      All traffic is encrypted with TLS. Production databases run in isolated networks with
      nightly encrypted backups and a 14-day retention window.
    </p>
    <h2>4. Custody and evidence</h2>
    <p>
      Cargo handovers are verified with digital signatures and photographic evidence, giving all
      parties an immutable record for SLA and exception resolution.
    </p>
    <h2>5. Regulatory alignment</h2>
    <p>
      Shipstack is designed around the Kenya Data Protection Act, 2019, KRA eTIMS invoicing
      requirements, and GDPR principles for cross-border clients. Compliance questions:
      <strong> {CONTACT_EMAIL}</strong>.
    </p>
  </Prose>
);

const SECTIONS: Record<SectionKey, { title: string; icon: React.ReactNode; body: React.FC }> = {
  privacy: { title: 'Privacy Policy', icon: <ShieldCheck size={20} />, body: PrivacyContent },
  terms: { title: 'Terms of Service', icon: <FileText size={20} />, body: TermsContent },
  cookie: { title: 'Cookie Policy', icon: <Cookie size={20} />, body: CookieContent },
  compliance: { title: 'Compliance Overview', icon: <Scale size={20} />, body: ComplianceContent },
};

const LegalPage: React.FC = () => {
  const { section } = useParams<{ section: string }>();
  const key = (section ?? 'privacy') as SectionKey;
  const entry = SECTIONS[key];
  if (!entry) return <Navigate to="/legal/privacy" replace />;
  const Body = entry.body;

  return (
    <MarketingLayout>
      <div className="bg-[#0B0E16] pt-36 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-white/80 mb-8">
            {entry.icon}
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Legal</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase mb-4">{entry.title}</h1>
          <p className="text-white/50 text-sm font-bold uppercase tracking-widest">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="bg-white px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <nav className="flex flex-wrap gap-3 mb-12">
            {(Object.keys(SECTIONS) as SectionKey[]).map(k => (
              <Link
                key={k}
                to={`/legal/${k}`}
                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-colors ${
                  k === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {SECTIONS[k].title}
              </Link>
            ))}
          </nav>
          <Body />
        </div>
      </div>
    </MarketingLayout>
  );
};

export default LegalPage;
