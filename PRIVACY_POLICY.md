# Privacy Policy

**Effective Date**: April 25, 2026  
**Last Updated**: April 25, 2026

---

## 1. Introduction

Shipstack Inc. ("**we**," "**us**," "**Company**," or "**Shipstack**") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and otherwise process personal data in connection with our websites, mobile applications, and services (collectively, the "**Services**").

This policy applies to:
- **Users** (delivery operators, dispatchers, managers)
- **Drivers** (using the Shipstack driver app)
- **Customers** (senders/recipients receiving delivery updates)

---

## 2. What Personal Data We Collect

### A. Data You Provide Directly

**Account Registration:**
- Name, email address, phone number
- Company name, business registration number
- Password (hashed, never stored in plaintext)

**Driver Management:**
- Driver full name, phone, email
- National ID number, KRA PIN, driver's license number
- Vehicle plate number, vehicle type
- Emergency contact information
- Bank account details (for M-Pesa payouts)

**Delivery Operations:**
- Customer names and phone numbers
- Delivery addresses
- Item descriptions, weights, dimensions
- Special handling instructions
- Proof of Delivery: photos, signatures, timestamps

**Billing & Payments:**
- Invoice details, transaction history
- M-Pesa transaction records (phone number, amount, timestamp)
- Bank account information (for payouts)

### B. Data Collected Automatically

**Location Data (GPS):**
- Real-time GPS coordinates from driver devices during active deliveries
- Route history (last 90 days, then anonymized)
- Speed, heading, timestamp

**Device Information:**
- Device type, OS version, app version
- IP address, user agent
- Device identifiers (for offline sync)

**Usage Analytics:**
- Features accessed, time spent, interactions
- Crashes and performance metrics
- Browser/app version information

**Cookies & Tracking:**
- Session cookies (authentication)
- Analytics cookies (GA4, Mixpanel)
- Optional: Remember-me functionality

---

## 3. How We Use Your Data

### Legitimate Business Purposes

| Purpose | Data Used | Legal Basis |
|---------|-----------|-------------|
| **Delivery Dispatch & Tracking** | Location, driver info, delivery details | Contract performance |
| **Payment Processing** | Bank details, transaction history | Contract performance |
| **Customer Communication** | Phone, email, delivery updates | Contract performance + legitimate interest |
| **Compliance & Reporting** | All data | Legal obligation (tax, audits) |
| **Service Improvement** | Usage analytics, crash reports | Legitimate interest |
| **Security & Fraud Prevention** | IP, location, transaction patterns | Legitimate interest + legal obligation |
| **Marketing (opt-in only)** | Email, phone (consented) | Explicit consent |

### Automated Decision-Making
- **Driver Assignment**: Algorithm may assign deliveries based on location/capacity (not profiling)
- **User explicitly controls**: Can manually reassign drivers anytime
- **No adverse effects**: Algorithm improves efficiency, never denies service based on automated decisions alone

---

## 4. Who We Share Data With

### Internal Sharing (Within Shipstack)
- Dispatch team: Driver location, delivery status
- Finance team: Transaction data (no location or personal ID numbers)
- Support team: Account info, ticket history (only when helping you)
- Security team: Access logs, breach investigation (only when needed)

### External Sharing (Third Parties)

**Required by Law:**
- Tax authorities (Kenya Revenue Authority): Transaction records
- Law enforcement: Upon valid legal process
- Regulatory bodies: Data protection authorities (breach notification)

**Service Providers (Data Processors):**
| Provider | Data Shared | Purpose | Safeguards |
|----------|------------|---------|-----------|
| Supabase | All personal data (encrypted) | Database hosting | AES-256 encryption, DPA signed |
| Stripe | Tokenized payment info (never plaintext) | Payment processing | PCI-DSS Level 1, DPA signed |
| AWS | Encryption keys, audit logs | Infrastructure | HSM-backed secrets, encryption |
| Twilio/SendGrid | Phone/email, delivery message content | SMS/email delivery | SOC 2 Type II, DPA signed |

**Sharing to Customers (Opt-in):**
- If you enable customer updates: Recipient gets name, location, ETA (not personal ID or bank details)

**No Sale of Data:**
- ✅ We **never** sell personal data to marketers, brokers, or advertisers
- ✅ We **never** share data for commercial purposes outside service delivery
- ✅ We **never** build profiles for sale

---

## 5. Data Retention

### Deletion Timeline
| Data | Retention | How to Delete |
|------|-----------|---------------|
| **Active Account Data** | Duration of account | Settings → Delete Account |
| **Delivery Records** | 7 years (tax requirement) | Automatic after 7 years |
| **Location History** | 90 days (then anonymized) | Automatic |
| **Audit Logs** | 2 years | Automatic (no manual option) |
| **Payment Data** | 1 year | Automatic after final settlement |
| **Marketing Emails** | Until opt-out | Email unsubscribe link or settings |
| **Deleted Account Data** | 30-day grace, then 90-day hard delete | Automatic (2-year legal hold) |

### Account Deletion Process
1. Request in-app or email `dpo@shipstack.io`
2. Account marked for deletion (30-day recovery window)
3. After 30 days: All personal data deleted (except mandated 7-year tax records)
4. Confirmation email sent
5. Confirmation: Data export available during 30-day grace period

---

## 6. Your Data Subject Rights

### Right to Access (GDPR Art. 15 / KDPA Sec. 48)
Download all data we hold about you in machine-readable format:
- **How**: Settings → Data & Privacy → Download My Data (or email `dpo@shipstack.io`)
- **Timeline**: 30 days (max 60 for complex requests)
- **Cost**: Free
- **Format**: JSON/CSV, portable to other platforms

### Right to Rectification (GDPR Art. 16)
Correct inaccurate data:
- **How**: In-app settings or email `dpo@shipstack.io`
- **Timeline**: 30 days
- **Scope**: Name, contact info, driver license, vehicle details, etc.

### Right to Erasure / "Right to Be Forgotten" (GDPR Art. 17)
Request deletion of personal data:
- **Exceptions**: Data required by law (tax, regulatory), contractual obligations, legitimate business interests
- **Example Allowed**: Marketing email list, location history after 90 days
- **Example Not Allowed**: Tax records (7-year legal hold), active delivery in progress
- **Timeline**: 30 days

### Right to Restrict Processing (GDPR Art. 18)
Prevent processing while you dispute accuracy or lawfulness:
- **Effect**: Data retained but not used for new operations
- **How**: Email `dpo@shipstack.io`
- **Timeline**: Immediate

### Right to Object (GDPR Art. 21)
Opt-out of specific processing:
- **Marketing emails**: Click unsubscribe or in-app settings
- **Analytics**: Disable cookies in browser settings
- **Legitimate interests**: Email `dpo@shipstack.io` (will be honored unless legal exception applies)
- **Timeline**: Immediate

### Right to Data Portability (GDPR Art. 20)
Export data to switch platforms:
- **Included**: Delivery records, customer data, performance metrics, photos/signatures
- **Format**: JSON/CSV, machine-readable
- **Timeline**: 30 days
- **Cost**: Free
- **How**: Settings → Data & Privacy → Request Data Export

---

## 7. Children's Privacy

Shipstack Services are **not intended for children under 13**. We do not knowingly collect data from children under 13. If we learn a child under 13 has used our service, we will delete their account and data immediately. Contact `dpo@shipstack.io` if you believe a child has used our service.

---

## 8. Data Security

### Encryption
- **In Transit**: TLS 1.3 (all connections)
- **At Rest**: AES-256 encryption (database, backups, sensitive fields)
- **Fields Encrypted**: ID numbers, KRA PIN, license plate, bank account

### Access Controls
- **Authentication**: Strong passwords (12+ characters) + optional MFA
- **Authorization**: Role-based access control (RBAC)
- **Audit Logging**: Every access logged, stored 2 years

### Infrastructure Security
- **Firewalls**: AWS WAF, rate limiting, DDoS protection
- **Key Management**: AWS Secrets Manager (HSM-backed), 30-day rotation
- **Intrusion Detection**: Real-time monitoring + alerts
- **Backup Security**: Encrypted backups, tested recovery annually

### Limitations
While we implement industry-standard security, **no system is 100% secure**. We maintain cyber liability insurance and incident response procedures.

---

## 9. International Data Transfers

### Data Residency
- **Primary**: Supabase hosted in US (Virginia region)
- **Regional Caches**: Kenya, Nigeria (for performance)
- **Backups**: AWS multi-region replication

### GDPR Transfers
For users in the EU, data transfers to the US are permitted under:
- **Standard Contractual Clauses (SCCs)** with Supabase
- **Adequacy Determination** (if applicable by regulation)
- We monitor EU legal developments and adjust compliance posture accordingly

### Kenya/African Jurisdictions
Transfers comply with Kenya Data Protection Act, which permits transfers with appropriate safeguards (encryption, data processing agreements).

---

## 10. Cookies & Tracking Technologies

### Types of Cookies We Use
| Cookie | Purpose | Duration | Control |
|--------|---------|----------|---------|
| **Session** | Authentication, CSRF protection | Browser session | Auto-cleared |
| **Analytics** (GA4) | Usage patterns, improvements | 2 years | Disable in browser settings |
| **Preference** | Language, theme | 1 year | Settings menu |
| **Remember-Me** (optional) | Auto-login on return visits | 30 days | Settings → forget this device |

### Third-Party Cookies
We embed:
- **Google Analytics**: Metrics on traffic patterns
- **Stripe**: Payment processing iframe
- You can opt-out via browser cookie settings or [Google Analytics opt-out](https://tools.google.com/dlpage/gaoptout)

### Do Not Track (DNT)
If your browser sends DNT signals, we respect them (analytics disabled). This is a browser-level setting, not account-specific.

---

## 11. California Privacy Rights (CCPA/CPRA)

If you are a California resident:
- **Right to Know**: You can request what personal data we collect, use, and share
- **Right to Delete**: You can request deletion (with legal exceptions)
- **Right to Opt-Out of Sale**: We do not sell data, so this does not apply
- **Right to Non-Discrimination**: We will not discriminate against you for exercising privacy rights
- **How to Submit**: Email `privacy@shipstack.io` with "CCPA Request" in subject

We will verify your identity and respond within 45 days.

---

## 12. Brazil (LGPD) Privacy Rights

If you are in Brazil and your data is processed under LGPD:
- **Data Processing**: Transparent and limited to stated purposes
- **Right to Access, Correction, Deletion**: Same as GDPR (see Section 6)
- **Data Authority**: Shipstack acts as Data Controller; third parties are Processors
- **Contact**: `dpo@shipstack.io` for LGPD requests (45-day response time)

---

## 13. Retention of Marketing Lists

We only send marketing emails to users who **opt-in**. You can opt-out anytime:
- **In-app**: Settings → Communications → Uncheck "Marketing Emails"
- **Email Link**: Every marketing email includes unsubscribe link
- **Direct Request**: Email `support@shipstack.io` with your email address

Once unsubscribed, we will **not** send marketing emails within 10 business days. We retain your email on a suppression list to prevent re-enrollment (unless you specifically re-opt-in).

---

## 14. Incident Response & Data Breaches

### If We Suspect a Breach
1. **Immediate**: Isolate affected systems, preserve evidence
2. **Investigation**: Security team assesses scope and impact
3. **Notification** (if personal data at risk):
   - Affected users: Email within 24 hours
   - Regulatory authorities: Within 72 hours (GDPR) or 30 days (Kenya)
   - Notification includes: What happened, what data, remediation steps, contact person

### No Breach Notification Will Include
- Your password (reset it independently)
- Your full payment card number (we don't store it)

---

## 15. Policy Changes

We may update this Privacy Policy when:
- Legal requirements change
- Our data practices evolve
- We add new features

**We will**:
- Post the updated policy with a "Last Updated" date
- Notify you via email (for material changes)
- Request re-acceptance if required by law

You can view change history by requesting it at `dpo@shipstack.io`.

---

## 16. Contact & Complaints

### Questions About This Policy
Email: `dpo@shipstack.io`  
Phone: +254 (0) 700 000 000  
Mailing Address: [Company Address]  
Response Time: 48 hours (business days)

### Data Protection Authority Complaints
If you believe we violated your privacy rights, you can file a complaint with:
- **Kenya**: [Kenya Information and Communications Commission - ICTA]
  - Website: icta.go.ke
- **EU (GDPR)**: Your national Data Protection Authority (supervisory authority)
  - Find yours: https://edpb.ec.europa.eu/about-edpb/board/members_en

### Dispute Resolution
- First: Try to resolve with us directly (email DPO)
- Second: File complaint with relevant data authority
- Third: If needed, pursue legal action in your jurisdiction

---

## 17. Glossary

- **Personal Data**: Any information relating to an identified or identifiable individual
- **Processing**: Collection, use, retention, deletion, or any operation on personal data
- **Data Controller**: Entity deciding how and why personal data is processed (you, mostly)
- **Data Processor**: Entity processing data on behalf of controller (Shipstack in many cases)
- **Legitimate Interest**: Legal reason to process data without explicit consent (efficiency, security)
- **Explicit Consent**: Clear, affirmative opt-in (e.g., checkboxes)
- **Anonymization**: Removing identifiers so data can no longer be linked to an individual

---

**Signed and Certified**

Shipstack Inc. Data Protection Officer  
Date: April 25, 2026  
Version: 1.0

---

*This Privacy Policy is binding on Shipstack and its subsidiaries. If there is a conflict between this policy and a Data Processing Agreement or Terms of Service, the most protective document shall apply.*
