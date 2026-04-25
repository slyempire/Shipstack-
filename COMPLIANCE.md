# Shipstack Compliance & Data Protection Framework

## Overview
Shipstack is committed to protecting user data across African jurisdictions while maintaining operational transparency. This document outlines our compliance posture against GDPR, local data protection laws, and modern security standards.

---

## 1. DATA CONTROLLER & PROCESSOR DEFINITIONS

### Data Controller
**Shipstack Inc.** (Operating Entity: Shipstack Africa Ltd)
- **Headquarters**: Nairobi, Kenya
- **Data Protection Officer**: dpo@shipstack.io
- **Registered Address**: [To be filled based on company registration]
- **Jurisdiction**: Kenya Data Protection Act (KDPA), GDPR (for EU data subjects)

### Data Processors
- **Supabase** (Database hosting): PostgreSQL encryption at rest + TLS in transit
- **Stripe** (Payment processing): PCI-DSS Level 1
- **SendGrid/Twilio** (SMS/Email): SOC 2 Type II

### Your Role
When you use Shipstack to process delivery data, **you are the Data Controller** and **Shipstack is the Data Processor**. You remain responsible for:
- Obtaining driver/customer consent to collect location data
- Notifying drivers their location will be tracked in real-time
- Retaining data only as long as operationally necessary
- Providing data subjects access to their personal data on request

We execute a Data Processing Agreement (DPA) with all enterprise customers at sign-up.

---

## 2. ENCRYPTION STANDARDS

### Data at Rest
- **Database Encryption**: AES-256 (Supabase PostgreSQL native encryption)
- **Field-Level Encryption**: Sensitive fields (KRA PIN, ID numbers, license plates) encrypted with AES-256
- **Key Management**: Encryption keys stored in AWS Secrets Manager (HSM-backed)
- **Backup Encryption**: All daily snapshots encrypted with separate KMS keys

### Data in Transit
- **HTTPS/TLS 1.3**: All API endpoints enforce TLS 1.3 minimum
- **Certificate Pinning**: Driver app pins SSL certificates to prevent MITM attacks
- **Socket.io WebSocket**: WSS (WebSocket Secure) enforced for real-time updates
- **API Authentication**: HMAC-SHA256 signature validation for critical telemetry

### Encryption Scope
| Data Type | Encryption | Notes |
|-----------|-----------|-------|
| Location Data (GPS) | In transit: TLS 1.3; At rest: AES-256 | Real-time and historical |
| Driver PII (ID, KRA, License) | Field-level AES-256 | Encrypted before storage |
| Payment Data | Stripe tokenization (never stored in plaintext) | PCI-DSS compliant |
| Delivery Proof (Photos/Signatures) | TLS in transit, S3 server-side encryption at rest | Immutable audit trail |
| Audit Logs | AES-256 at rest, TLS in transit | Tamper-proof using cryptographic signing |

---

## 3. DATA RETENTION & DELETION

### Retention Periods by Data Type
| Data | Retention | Rationale |
|------|-----------|-----------|
| Active Deliveries | Until POD (Proof of Delivery) signed | Operational necessity |
| Completed Deliveries | 7 years | Tax/regulatory requirement (Kenya) |
| Location History | 90 days (then anonymized) | GDPR/KDPA minimization |
| Failed Transactions | 1 year | Dispute resolution |
| Audit Logs | 2 years | Security/compliance |
| Deleted Account Data | 30 days (soft delete) → 90 days (hard delete) | Legal hold period |

### User Right to Deletion
Users can request deletion of their account + all associated data via:
- In-app: **Settings → Data & Privacy → Request Deletion**
- Email: `dpo@shipstack.io` with proof of identity

**Process**:
1. Account marked for deletion (30-day grace period to recover)
2. All personal data anonymized/deleted after 30 days
3. Confirmation email sent upon completion
4. Export of data available during grace period

---

## 4. DATA SUBJECT RIGHTS (GDPR/KDPA)

### Right to Access
Request all data Shipstack holds about you:
- **How**: Send request to `dpo@shipstack.io` with ID proof
- **Timeline**: 30 days (extensible to 60 days for complex requests)
- **Format**: Portable JSON/CSV export in machine-readable format
- **Cost**: Free (no more than 2 requests/year)

### Right to Rectification
Correct inaccurate personal data:
- **How**: In-app settings or email `dpo@shipstack.io`
- **Timeline**: 30 days
- **Scope**: Name, phone, email, ID number, etc.

### Right to Erasure ("Right to Be Forgotten")
Delete personal data when no longer necessary:
- **Exceptions**: If data required by law, contractual obligations, or legitimate business interest
- **Example**: Location data after 90 days (unless actively delivery in progress)

### Right to Restrict Processing
Prevent use of your data while you dispute accuracy:
- **How**: Email `dpo@shipstack.io`
- **Effect**: Data retained but not used for new processing

### Right to Object
Opt-out of specific processing (e.g., marketing emails, analytics):
- **How**: In-app or email opt-out link
- **Timeline**: Immediate

### Data Portability
Export your data in machine-readable format to switch providers:
- **Included**: Delivery records, customer data, routes, performance metrics
- **Format**: JSON/CSV, available for 30 days download

---

## 5. SECURITY PRACTICES

### Authentication & Authorization
- **Session Management**: JWT tokens with 24-hour expiry (refresh token: 7 days)
- **Password Requirements**: Min 12 characters, complexity enforced
- **MFA**: TOTP-based (Time-based One-Time Password) optional
- **API Keys**: Rotated annually, revocable on-demand

### Access Control
- **Role-Based Access Control (RBAC)**: Admin, Manager, Driver, Client roles
- **Row-Level Security (RLS)**: Supabase RLS policies enforce tenant isolation
- **Principle of Least Privilege**: Users get minimum permissions needed

### Audit Logging
Every data access is logged:
```
User: admin@company.com
Action: Viewed delivery #DN-12345
Resource: Delivery record (customer data)
Timestamp: 2026-04-25T15:30:00Z
IP: 203.0.113.45
Result: Success
```
- **Retention**: 2 years
- **Immutability**: Cryptographically signed, tampering detectable
- **Access**: Only authorized personnel + compliance team

### Incident Response
**Data Breach Protocol**:
1. **Immediate**: Isolate affected systems, preserve evidence
2. **12 hours**: Notify security team, assess scope
3. **24 hours**: Notify affected users (per GDPR Article 33)
4. **72 hours**: Report to regulatory authorities (Kenya DPA, GDPR regulators)

---

## 6. SLA (SERVICE LEVEL AGREEMENT)

### Availability SLA
- **Guaranteed Uptime**: 99.9% per calendar month
- **Measurement**: HTTP endpoint availability checks from 3 global regions
- **Exclusions**: Scheduled maintenance (max 4 hours/month, 48h notice)
- **Penalty**: Service credits (see table below)

### Uptime Calculation
```
Uptime % = (Total Minutes - Downtime Minutes) / Total Minutes × 100
```

### Service Credits
| Uptime | Credit |
|--------|--------|
| 99.9% - 99.0% | 10% monthly fee |
| 99.0% - 95.0% | 25% monthly fee |
| < 95.0% | 100% monthly fee + $500 |

**How to Claim**: Email `support@shipstack.io` with evidence within 30 days of incident.

### Performance SLA
- **API Response Time**: 95th percentile < 500ms (p95 < 1s during peak)
- **Real-Time Tracking Latency**: < 5 seconds from GPS→dashboard
- **SMS Delivery**: 95% delivered within 2 minutes of shipment update
- **Measurement**: Tracked continuously, reported monthly

### Support SLA
| Severity | Response Time | Resolution |
|----------|---------------|-----------|
| **Critical** (System down) | 1 hour | 4 hours |
| **High** (Feature broken, data loss risk) | 4 hours | 24 hours |
| **Medium** (Workaround exists) | 8 hours | 5 days |
| **Low** (Enhancement request) | 24 hours | 30 days |

---

## 7. DATA PROTECTION IMPACT ASSESSMENT (DPIA)

### High-Risk Processing
- **Real-Time GPS Tracking**: Location data continuously collected from drivers
  - **Mitigations**: Data anonymized after 90 days, purpose-limited (dispatch only), user consent documented
  - **Risk Level**: Medium (transparent opt-in, granular controls)

- **Payment Processing**: M-Pesa/bank transactions tied to personal identity
  - **Mitigations**: Stripe tokenization (plaintext never stored), PCI-DSS compliance, encrypted audit trail
  - **Risk Level**: Low (third-party processing, industry standard)

---

## 8. THIRD-PARTY COMPLIANCE

### Supabase (Database Host)
- ✅ GDPR compliant (Privacy Shield)
- ✅ Data residency: US + regional caches
- ✅ Encryption: AES-256 at rest, TLS 1.3 in transit
- ✅ Audit: SOC 2 Type II certified
- ✅ Data Processing Agreement: Signed

### Stripe (Payments)
- ✅ PCI-DSS Level 1
- ✅ GDPR compliant
- ✅ Data Processing Agreement: Signed

### AWS Secrets Manager (Key Storage)
- ✅ FIPS 140-2 HSM-backed
- ✅ Automatic rotation: 30-day cycle
- ✅ Access logging: CloudTrail enabled

---

## 9. COMPLIANCE CHECKLIST

- [ ] **GDPR**: All data subject rights implemented (access, deletion, portability)
- [ ] **Kenya DPA**: Notification procedures for data breaches within 30 days
- [ ] **PCI-DSS**: Payment data never stored in plaintext; Stripe tokenization used
- [ ] **SOC 2 Type II**: Annual audit by Big 4 audit firm (target: Q4 2026)
- [ ] **Encryption**: AES-256 at rest, TLS 1.3 in transit, field-level sensitive data
- [ ] **Audit Logging**: Tamper-proof, cryptographically signed, 2-year retention
- [ ] **Data Deletion**: API endpoint for user-initiated data deletion + confirmation
- [ ] **SLA**: 99.9% uptime guarantee with service credits
- [ ] **Privacy Policy**: Published and versioned
- [ ] **Terms of Service**: Published and versioned
- [ ] **Data Processing Agreement**: Executed with customers
- [ ] **Incident Response**: Documented protocol with notification procedure

---

## 10. REFERENCES & STANDARDS

- **GDPR** (EU 2016/679): General Data Protection Regulation
- **Kenya DPA 2019**: Data Protection Act (Cap 32C)
- **ISO 27001**: Information Security Management System
- **ISO 27017**: Cloud security guidelines
- **NIST Cybersecurity Framework**: Risk management
- **CIS Controls**: Security best practices

---

## Contact
**Data Protection Officer (DPO)**  
Email: `dpo@shipstack.io`  
Phone: +254 (0) 700 000 000  
Response Time: 48 hours (business days)

**Last Updated**: 2026-04-25  
**Version**: 1.0  
**Next Review**: 2026-10-25 (6-month cycle)
