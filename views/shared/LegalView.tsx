import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import MarketingLayout from '../../components/marketing/MarketingLayout';
import {
  ShieldCheck, FileText, Cookie, Scale, Activity,
  ChevronRight, ChevronDown, ChevronUp, Download,
  CheckCircle, AlertCircle, Lock, Globe, Server,
  Trash2, Eye, RefreshCw, Ban, Share2
} from 'lucide-react';

/* ─── helpers ──────────────────────────────────────────────────────────── */

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-10">
    <h3 className="text-lg font-black uppercase tracking-tight text-white mb-4 border-b border-white/10 pb-3">{title}</h3>
    <div className="text-slate-400 leading-relaxed space-y-3 text-sm font-medium">{children}</div>
  </div>
);

const InfoBox: React.FC<{ type?: 'info' | 'warn'; children: React.ReactNode }> = ({ type = 'info', children }) => (
  <div className={`flex gap-3 p-4 rounded-xl border text-sm font-medium ${
    type === 'warn'
      ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
      : 'bg-brand/10 border-brand/20 text-slate-300'
  }`}>
    <AlertCircle size={16} className={`shrink-0 mt-0.5 ${type === 'warn' ? 'text-amber-400' : 'text-brand'}`} />
    <span>{children}</span>
  </div>
);

const Table: React.FC<{ headers: string[]; rows: (string | React.ReactNode)[][] }> = ({ headers, rows }) => (
  <div className="overflow-x-auto rounded-xl border border-white/10 mt-4">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-white/10 bg-white/5">
          {headers.map((h, i) => (
            <th key={i} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
            {row.map((cell, j) => (
              <td key={j} className="px-4 py-3 text-slate-300 font-medium">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const RightCard: React.FC<{ icon: React.ElementType; title: string; desc: string; how: string }> = ({ icon: Icon, title, desc, how }) => (
  <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
    <div className="flex items-center gap-3 mb-3">
      <div className="h-8 w-8 bg-brand/10 rounded-lg flex items-center justify-center">
        <Icon size={16} className="text-brand" />
      </div>
      <h4 className="font-black uppercase text-white text-sm tracking-tight">{title}</h4>
    </div>
    <p className="text-slate-400 text-xs font-medium leading-relaxed mb-2">{desc}</p>
    <p className="text-brand text-xs font-bold">{how}</p>
  </div>
);

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/5">
      <button onClick={() => setOpen(!open)} className="w-full flex justify-between items-center py-4 text-left text-white font-bold text-sm hover:text-brand transition-colors">
        {q}
        {open ? <ChevronUp size={16} className="text-brand shrink-0" /> : <ChevronDown size={16} className="text-slate-500 shrink-0" />}
      </button>
      {open && <p className="pb-4 text-slate-400 text-sm font-medium leading-relaxed">{a}</p>}
    </div>
  );
};

/* ─── tab content ──────────────────────────────────────────────────────── */

const PrivacyContent = () => (
  <div>
    <p className="text-slate-400 text-sm leading-relaxed mb-8">
      Effective: April 25, 2026 · Version 1.0 · <a href="mailto:dpo@shipstack.io" className="text-brand hover:underline">dpo@shipstack.io</a>
    </p>

    <Section title="Who We Are">
      <p>Shipstack Inc. is the <strong className="text-white">Data Controller</strong> for personal data collected through our platform. When you use Shipstack to manage your operations, you are the Data Controller of your customers' and drivers' data, and Shipstack acts as your <strong className="text-white">Data Processor</strong>.</p>
      <InfoBox>We never sell personal data to third parties. We never use your data for advertising.</InfoBox>
    </Section>

    <Section title="Data We Collect">
      <Table
        headers={['Data Type', 'What', 'Why']}
        rows={[
          ['Account', 'Name, email, phone, company', 'Authentication & communication'],
          ['Driver PII', 'ID number, KRA PIN, license no.', 'Compliance & verification'],
          ['Location (GPS)', 'Real-time coordinates during deliveries', 'Dispatch & tracking'],
          ['Payments', 'M-Pesa transactions (tokenised)', 'Settlement & reconciliation'],
          ['Usage', 'Features used, crash reports', 'Service improvement'],
        ]}
      />
    </Section>

    <Section title="Your Rights (GDPR / Kenya DPA)">
      <div className="grid sm:grid-cols-2 gap-4 mt-2">
        <RightCard icon={Eye}       title="Right to Access"       desc="Download all data we hold about you."                    how="Settings → Data & Privacy → Download My Data" />
        <RightCard icon={RefreshCw} title="Right to Rectification" desc="Correct inaccurate personal data."                      how="In-app settings or email dpo@shipstack.io" />
        <RightCard icon={Trash2}    title="Right to Erasure"       desc="Delete your account and personal data."                  how="Settings → Delete Account (30-day grace period)" />
        <RightCard icon={Ban}       title="Right to Object"        desc="Opt out of marketing or analytics processing."           how="Settings → Communications or unsubscribe link" />
        <RightCard icon={Share2}    title="Data Portability"       desc="Export your data as JSON/CSV to move platforms."         how="Settings → Export Data (available for 30 days)" />
        <RightCard icon={Lock}      title="Right to Restrict"      desc="Pause processing while you dispute accuracy."            how="Email dpo@shipstack.io" />
      </div>
    </Section>

    <Section title="Data Retention">
      <Table
        headers={['Data', 'Kept For', 'Reason']}
        rows={[
          ['Active delivery records', '7 years', 'Kenya tax law requirement'],
          ['Location history', '90 days → anonymised', 'GDPR data minimisation'],
          ['Audit logs', '2 years', 'Security & compliance'],
          ['Deleted account data', '30-day grace, 90-day hard delete', 'Legal hold period'],
          ['Marketing email list', 'Until opt-out', 'Consent-based'],
        ]}
      />
    </Section>

    <Section title="Encryption & Security">
      <div className="grid sm:grid-cols-3 gap-4 mt-2">
        {[
          { icon: Lock,   title: 'At Rest',    desc: 'AES-256 encryption on all database fields' },
          { icon: Globe,  title: 'In Transit', desc: 'TLS 1.3 enforced on every connection' },
          { icon: Server, title: 'Keys',       desc: 'AWS Secrets Manager, HSM-backed, 30-day rotation' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
            <Icon size={24} className="text-brand mx-auto mb-2" />
            <p className="font-black text-white text-xs uppercase tracking-wide mb-1">{title}</p>
            <p className="text-slate-400 text-xs font-medium">{desc}</p>
          </div>
        ))}
      </div>
    </Section>

    <Section title="Contact & Complaints">
      <p>Data Protection Officer: <a href="mailto:dpo@shipstack.io" className="text-brand hover:underline">dpo@shipstack.io</a> · Response within 48 hours.</p>
      <p>To file a complaint: Kenya ICTA (<a href="https://www.icta.go.ke" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">icta.go.ke</a>) or your national data protection authority.</p>
    </Section>
  </div>
);

const TermsContent = () => (
  <div>
    <p className="text-slate-400 text-sm leading-relaxed mb-8">
      Effective: April 25, 2026 · Version 1.0 · Governed by the laws of Kenya
    </p>

    <Section title="Acceptance">
      <p>By creating a Shipstack account or using our services you agree to these Terms. If you do not agree, do not use the platform.</p>
    </Section>

    <Section title="Service Description">
      <p>Shipstack provides a cloud-based logistics management platform including dispatch automation, real-time GPS tracking, proof-of-delivery capture, payment processing, and analytics. Features vary by plan.</p>
    </Section>

    <Section title="Your Responsibilities">
      <ul className="space-y-2">
        {[
          'You must obtain driver and customer consent before tracking their location.',
          'You are responsible for the accuracy of delivery data you enter.',
          'You must not use Shipstack for illegal shipments or to circumvent tax obligations.',
          'You must keep your API keys and passwords confidential.',
          'You must notify us immediately of any suspected unauthorised account access.',
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <CheckCircle size={14} className="text-brand shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Section>

    <Section title="Acceptable Use">
      <InfoBox type="warn">The following are strictly prohibited and may result in immediate account termination without refund.</InfoBox>
      <ul className="space-y-2 mt-3">
        {[
          'Transporting illegal goods, controlled substances, or unmanifested cargo.',
          'Attempting to reverse-engineer, scrape, or exfiltrate platform data.',
          'Sharing account credentials across multiple organisations.',
          'Submitting false proof-of-delivery documentation.',
          'Using the platform to facilitate fraud or money laundering.',
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="text-red-400 shrink-0 mt-0.5">✕</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Section>

    <Section title="Billing & Refunds">
      <p>Subscriptions are billed monthly in advance. There are no refunds for partial months. Downgrading mid-cycle takes effect at the next billing date. We reserve the right to change pricing with 30 days' written notice.</p>
      <Table
        headers={['Scenario', 'Policy']}
        rows={[
          ['Cancel before billing date', 'No charge for next period'],
          ['Downgrade plan', 'Effective next billing cycle'],
          ['Upgrade plan', 'Pro-rated immediately'],
          ['Service outage (< 99.9% SLA)', 'Service credit applied (see SLA tab)'],
          ['Disputed charge', 'Email billing@shipstack.io within 30 days'],
        ]}
      />
    </Section>

    <Section title="Intellectual Property">
      <p>Shipstack owns all platform software, trademarks, and documentation. You retain ownership of all your data (delivery records, customer data, routes). We may use anonymised, aggregated data to improve the service.</p>
    </Section>

    <Section title="Limitation of Liability">
      <p>Shipstack's total liability to you shall not exceed the fees you paid in the 12 months preceding the claim. We are not liable for indirect, consequential, or incidental damages. We are not liable for physical cargo loss or damage — that remains between you and your drivers.</p>
      <InfoBox type="warn">Shipstack is a software platform, not a logistics carrier. Cargo liability stays with the operator.</InfoBox>
    </Section>

    <Section title="Governing Law">
      <p>These Terms are governed by the laws of Kenya. Disputes shall first be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be referred to arbitration in Nairobi under the Nairobi Centre for International Arbitration (NCIA) rules.</p>
    </Section>
  </div>
);

const SLAContent = () => (
  <div>
    <p className="text-slate-400 text-sm leading-relaxed mb-8">
      Effective: April 25, 2026 · Applies to all paid plans
    </p>

    <Section title="Uptime Guarantee">
      <div className="grid sm:grid-cols-3 gap-4 mt-2 mb-4">
        {[
          { label: 'Guaranteed Uptime', value: '99.9%', sub: 'Per calendar month' },
          { label: 'Max Downtime / Month', value: '43.8 min', sub: 'Calculated automatically' },
          { label: 'Maintenance Windows', value: '≤ 4 hrs/mo', sub: '48-hour advance notice' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center">
            <p className="text-3xl font-black text-white mb-1">{value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-1">{label}</p>
            <p className="text-xs text-slate-500">{sub}</p>
          </div>
        ))}
      </div>
      <InfoBox>Uptime is measured via HTTP endpoint checks from 3 global regions every 60 seconds. Measurement excludes scheduled maintenance windows.</InfoBox>
    </Section>

    <Section title="Service Credits">
      <Table
        headers={['Monthly Uptime', 'Service Credit']}
        rows={[
          ['≥ 99.9%', 'None — SLA met'],
          ['99.0% – 99.9%', '10% of that month\'s fee'],
          ['95.0% – 99.0%', '25% of that month\'s fee'],
          ['< 95.0%', '100% of that month\'s fee + $500'],
        ]}
      />
      <p className="mt-4">To claim a credit, email <a href="mailto:support@shipstack.io" className="text-brand hover:underline">support@shipstack.io</a> with evidence within 30 days of the incident.</p>
    </Section>

    <Section title="Performance SLA">
      <Table
        headers={['Metric', 'Target', 'Measurement']}
        rows={[
          ['API response time (p95)', '< 500 ms', 'Continuous monitoring'],
          ['Real-time tracking latency', '< 5 seconds', 'GPS → dashboard'],
          ['SMS delivery (95th pct)', 'Within 2 minutes', 'After shipment update'],
          ['Data export generation', '< 30 minutes', 'After request submitted'],
        ]}
      />
    </Section>

    <Section title="Support Response Times">
      <Table
        headers={['Severity', 'Definition', 'First Response', 'Resolution Target']}
        rows={[
          ['🔴 Critical', 'Platform down, data loss risk', '1 hour', '4 hours'],
          ['🟠 High', 'Core feature broken, workaround unavailable', '4 hours', '24 hours'],
          ['🟡 Medium', 'Feature impaired, workaround exists', '8 hours', '5 business days'],
          ['🟢 Low', 'Enhancement or question', '24 hours', '30 business days'],
        ]}
      />
      <p className="mt-4">Support channels: WhatsApp, email, in-app chat. Available in English, Swahili, and French. 24/7 for Critical and High severity.</p>
    </Section>

    <Section title="Exclusions">
      <ul className="space-y-2">
        {[
          'Scheduled maintenance (announced ≥ 48 hours in advance)',
          'Issues caused by your own code, integrations, or misconfigurations',
          'Force majeure events (natural disasters, government actions, internet backbone failures)',
          'Third-party service outages outside our control (e.g. M-Pesa downtime, Safaricom network)',
          'Free plan usage (SLA applies to paid plans only)',
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="text-slate-500 shrink-0">–</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Section>
  </div>
);

const CookieContent = () => (
  <div>
    <p className="text-slate-400 text-sm leading-relaxed mb-8">
      Effective: April 25, 2026 · Last reviewed: April 25, 2026
    </p>

    <Section title="What Are Cookies">
      <p>Cookies are small text files placed on your device when you visit Shipstack. We use them to keep you logged in, remember preferences, and understand how you use the platform.</p>
    </Section>

    <Section title="Cookies We Use">
      <Table
        headers={['Cookie', 'Purpose', 'Duration', 'Can Opt Out']}
        rows={[
          ['session_token', 'Keeps you logged in (required)', 'Browser session', 'No — required'],
          ['csrf_token', 'Prevents cross-site request forgery (required)', 'Browser session', 'No — required'],
          ['remember_me', 'Auto-login on return (optional)', '30 days', 'Yes — in settings'],
          ['_ga (Google Analytics)', 'Usage patterns & improvements (optional)', '2 years', 'Yes — browser or settings'],
          ['theme_pref', 'Saves your light/dark preference', '1 year', 'Yes — settings'],
        ]}
      />
    </Section>

    <Section title="Third-Party Cookies">
      <p>We embed the following third-party scripts that may set their own cookies:</p>
      <ul className="space-y-2 mt-2">
        <li className="flex items-start gap-3"><ChevronRight size={14} className="text-brand shrink-0 mt-0.5" /><span><strong className="text-white">Google Analytics (GA4)</strong> — aggregated usage stats. Opt out via <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Google's opt-out tool</a>.</span></li>
        <li className="flex items-start gap-3"><ChevronRight size={14} className="text-brand shrink-0 mt-0.5" /><span><strong className="text-white">Stripe</strong> — payment processing iframe. Required for payment flows only.</span></li>
      </ul>
    </Section>

    <Section title="Managing Your Preferences">
      <div className="grid sm:grid-cols-2 gap-4 mt-2">
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <p className="font-black text-white text-xs uppercase tracking-wide mb-2">In-App</p>
          <p className="text-slate-400 text-xs">Settings → Privacy → Cookie Preferences</p>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <p className="font-black text-white text-xs uppercase tracking-wide mb-2">Browser</p>
          <p className="text-slate-400 text-xs">Your browser's privacy settings allow you to block or delete all cookies at any time.</p>
        </div>
      </div>
      <InfoBox type="warn">Disabling required cookies (session, CSRF) will prevent you from logging in to the platform.</InfoBox>
    </Section>
  </div>
);

const ComplianceContent = () => (
  <div>
    <p className="text-slate-400 text-sm leading-relaxed mb-8">
      Shipstack's compliance posture against international data protection and security standards.
    </p>

    <Section title="Certifications & Standards">
      <div className="grid sm:grid-cols-2 gap-4 mt-2">
        {[
          { label: 'GDPR (EU 2016/679)', status: 'Compliant', color: 'emerald' },
          { label: 'Kenya Data Protection Act 2019', status: 'Compliant', color: 'emerald' },
          { label: 'PCI-DSS (via Stripe)', status: 'Level 1', color: 'emerald' },
          { label: 'SOC 2 Type II', status: 'In Progress — Q4 2026', color: 'amber' },
          { label: 'ISO 27001', status: 'Gap Assessment Done', color: 'amber' },
          { label: 'Nigeria NDPA 2023', status: 'Compliant', color: 'emerald' },
        ].map(({ label, status, color }) => (
          <div key={label} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-sm font-bold text-white">{label}</span>
            <span className={`text-xs font-black px-2 py-1 rounded-full ${
              color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
            }`}>{status}</span>
          </div>
        ))}
      </div>
    </Section>

    <Section title="Encryption Standards">
      <Table
        headers={['Layer', 'Standard', 'Scope']}
        rows={[
          ['Data at rest', 'AES-256-GCM', 'Database, backups, sensitive fields'],
          ['Data in transit', 'TLS 1.3', 'All API, WebSocket, and web connections'],
          ['Field-level encryption', 'AES-256-GCM + PBKDF2', 'ID numbers, KRA PIN, license plates'],
          ['Key management', 'AWS KMS (HSM-backed)', '30-day automated rotation'],
          ['API auth', 'HMAC-SHA256', 'Telemetry signature verification'],
          ['Password storage', 'bcrypt (cost factor 12)', 'Never stored in plaintext'],
        ]}
      />
    </Section>

    <Section title="Third-Party Processors">
      <Table
        headers={['Processor', 'Data Shared', 'Safeguard']}
        rows={[
          ['Supabase (DB hosting)', 'All personal data (encrypted)', 'AES-256 + DPA signed + SOC 2'],
          ['Stripe (Payments)', 'Tokenised payment info only', 'PCI-DSS Level 1 + DPA signed'],
          ['AWS (Infrastructure)', 'Encryption keys, audit logs', 'ISO 27001 + HSM + DPA signed'],
          ['Twilio (SMS)', 'Phone number, delivery message', 'SOC 2 Type II + DPA signed'],
        ]}
      />
      <p className="mt-3">A Data Processing Agreement (DPA) is executed with every processor. None may use your data for their own purposes.</p>
    </Section>

    <Section title="Incident Response">
      <Table
        headers={['Timeline', 'Action']}
        rows={[
          ['Immediate', 'Isolate affected systems, preserve evidence'],
          ['Within 12 hours', 'Notify security team, assess scope and impact'],
          ['Within 24 hours', 'Notify affected users by email'],
          ['Within 72 hours', 'Report to GDPR supervisory authority (if required)'],
          ['Within 30 days', 'Report to Kenya Data Commissioner (if required)'],
        ]}
      />
    </Section>

    <Section title="Frequently Asked Questions">
      <div className="space-y-0">
        <FAQItem q="Where exactly is my data stored?" a="Primary database: Supabase (US-East, Virginia). Regional performance caches in Kenya and Nigeria. Backups replicated to AWS S3 multi-region. All storage encrypted with AES-256." />
        <FAQItem q="What happens if Shipstack is acquired?" a="Any acquisition requires the acquirer to honour this Privacy Policy or provide 90 days' notice to migrate your data. You always retain the right to export and delete your data." />
        <FAQItem q="How do I request a Data Processing Agreement (DPA)?" a="Enterprise customers receive a DPA automatically at sign-up. Others can request one via dpo@shipstack.io. We respond within 5 business days." />
        <FAQItem q="Is driver location data shared with anyone?" a="No. GPS data is shared only within your tenant (dispatch team and the assigned driver). It is never shared with third parties, advertising networks, or other Shipstack customers." />
      </div>
    </Section>
  </div>
);

/* ─── main view ────────────────────────────────────────────────────────── */

const TABS = [
  { id: 'privacy',    label: 'Privacy Policy',  icon: ShieldCheck, component: PrivacyContent },
  { id: 'terms',      label: 'Terms of Service', icon: Scale,       component: TermsContent },
  { id: 'sla',        label: 'SLA',              icon: Activity,    component: SLAContent },
  { id: 'cookie',     label: 'Cookie Policy',    icon: Cookie,      component: CookieContent },
  { id: 'compliance', label: 'Compliance',       icon: FileText,    component: ComplianceContent },
] as const;

type TabId = typeof TABS[number]['id'];

const LegalView: React.FC = () => {
  const params = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const active: TabId = (TABS.find(t => t.id === params.section)?.id) ?? 'privacy';
  const ActiveComponent = TABS.find(t => t.id === active)!.component;

  return (
    <MarketingLayout>
      <div className="min-h-screen bg-[#1A2B4D] pt-28 pb-20">
        <div className="container-responsive max-w-5xl mx-auto px-4">

          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-full mb-4">
              <Lock size={12} className="text-brand" />
              <span className="text-[10px] font-black uppercase tracking-widest text-brand">Legal & Compliance</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4">
              Your Rights.<br /><span className="text-brand">Our Obligations.</span>
            </h1>
            <p className="text-slate-400 font-medium max-w-xl">
              Plain-language legal documents. If anything is unclear, email us at <a href="mailto:dpo@shipstack.io" className="text-brand hover:underline">dpo@shipstack.io</a>.
            </p>
          </div>

          {/* Tab nav */}
          <div className="flex flex-wrap gap-2 mb-10">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => navigate(`/legal/${id}`)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${
                  active === id
                    ? 'bg-brand text-white shadow-lg shadow-brand/20'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Content card */}
          <div className="bg-[#121E36] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
            <ActiveComponent />
          </div>

          {/* Download + contact bar */}
          <div className="mt-8 flex flex-wrap gap-4 items-center justify-between">
            <p className="text-slate-500 text-xs font-medium">
              Last updated: April 25, 2026 · <Link to="/legal/compliance" className="text-brand hover:underline">View compliance checklist →</Link>
            </p>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-wide text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <Download size={14} />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
};

export default LegalView;
