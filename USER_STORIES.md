# Shipstack User Stories

This document outlines the user stories and acceptance criteria for testing the Shipstack platform. The stories are categorized by persona to reflect different user journeys within the system.

## Personas
- **Tenant Admin**: Business owner or top-level manager responsible for system configuration and high-level oversight.
- **Operations Manager / Dispatcher**: Personnel responsible for daily trip planning, driver assignment, and real-time tracking.
- **Driver**: Personnel on the ground executing deliveries and reporting updates.
- **Facility Operator**: Staff managing warehouse inventory, loading, and manifests at hubs.
- **Finance Manager**: Responsible for COD collection, driver payouts, and financial reconciliation.

---

## 1. Onboarding & Administration
### Story: Organization Setup
**As a** Tenant Admin,  
**I want to** register my organization and configure basic settings (currency, timezone, modules),  
**So that** the platform is tailored to my local business operations.

**Acceptance Criteria:**
- User can successfully register for a new account.
- User can select and enable specific modules (e.g., Fleet, Finance, Facility).
- Organization settings like currency (KES) and timezone (Africa/Nairobi) are persisted.
- The system confirms onboarding completion and redirects to the main dashboard.

### Story: Team Management
**As a** Tenant Admin,  
**I want to** invite team members and assign them specific roles (Driver, Finance, Dispatcher),  
**So that** they can access the tools relevant to their job functions.

**Acceptance Criteria:**
- Admin can view a list of all team members.
- Admin can create a new user with a specified role (e.g., `DRIVER`, `FINANCE_MANAGER`).
- Permissions are strictly enforced based on the assigned role.
- Admin can deactivate or delete user accounts.

---

## 2. Logistics & Dispatch
### Story: Delivery Note Ingress
**As a** Dispatcher,  
**I want to** import delivery notes via CSV or ERP integration,  
**So that** I don't have to manually enter hundreds of delivery records.

**Acceptance Criteria:**
- System supports bulk CSV import of delivery notes.
- Import logs show success/failure counts and specific error messages.
- Imported delivery notes appear in the "Ready for Dispatch" queue.
- Duplicates are handled or flagged during import.

### Story: Trip Planning & Assignment
**As a** Dispatcher,  
**I want to** group delivery notes into a "Trip" and assign a driver and vehicle,  
**So that** I can optimize delivery routes and manage fleet utilization.

**Acceptance Criteria:**
- Dispatcher can select multiple delivery notes to create a trip.
- System allows selection of an active driver and verified vehicle.
- Trip status changes from `PENDING` to `ACTIVE` once dispatched.
- Associated delivery notes transition to `IN_TRANSIT` status.

---

## 3. Driver Terminal
### Story: Shift Start & Safety
**As a** Driver,  
**I want to** clock in and perform a pre-trip vehicle inspection,  
**So that** I am compliant with safety standards and officially on duty.

**Acceptance Criteria:**
- Driver can "Clock In" via the mobile interface.
- Driver must complete a safety checklist before starting a trip.
- Inspection results (Pass/Fail) are logged and visible to the Fleet Manager.

### Story: Delivery Execution
**As a** Driver,  
**I want to** view my assigned trip, use navigation, and update delivery statuses,  
**So that** I can efficiently reach customers and keep the central office informed.

**Acceptance Criteria:**
- Driver can see a list of stops in the current trip.
- Tapping a stop opens Google Maps navigation to the destination.
- Driver can mark an item as `DELIVERED`, `EXCEPTION` (e.g., customer refused), or `LATE`.
- Proof of Delivery (POD) can be captured via signature or photo.

---

## 4. Facility & Warehouse
### Story: Inventory Management
**As a** Facility Operator,  
**I want to** track stock levels across different warehouse zones and bins,  
**So that** I can prevent stockouts and manage perishable goods efficiently.

**Acceptance Criteria:**
- Operator can view current stock levels by SKU and bin location.
- Low stock items are highlighted for reordering.
- System tracks batch numbers and expiry dates for perishable items.
- Warehouse movements (Stock In / Stock Out) are logged with timestamps.

### Story: Loading & Manifesting
**As a** Facility Operator,  
**I want to** verify items being loaded onto a truck against the digital manifest,  
**So that** I can ensure the correct items are leaving the hub.

**Acceptance Criteria:**
- Operator can scan or check off items as they are loaded.
- Discrepancies between physical count and digital manifest are flagged immediately.
- Final loading authority is granted only when the checklist is complete.

---

## 5. Finance & Compliance
### Story: COD Reconciliation
**As a** Finance Manager,  
**I want to** reconcile Cash on Delivery (COD) collected by drivers against the trip manifest,  
**So that** all company funds are accounted for daily.

**Acceptance Criteria:**
- Finance can view total COD expected for a completed trip.
- Driver "submits" collected cash during trip close-out.
- Finance "approves" the reconciliation, moving the trip status to `RECONCILED`.
- Discrepancies are logged as financial exceptions.

### Story: Driver Payouts
**As a** Finance Manager,  
**I want to** approve driver commissions and allowances based on trip completion,  
**So that** drivers are paid accurately and on time.

**Acceptance Criteria:**
- System calculates commission based on trip parameters (distance, weight, or base rate).
- Finance can review and batch-approve payouts.
- Payout status is updated to `DISBURSED` after the payment process.

---

## 6. Safety & Analytics
### Story: Real-Time Tracking
**As a** Dispatcher,  
**I want to** see the real-time location and speed of all active vehicles on a map,  
**So that** I can provide accurate ETAs to customers and monitor driver safety.

**Acceptance Criteria:**
- Active trips are shown as moving markers on the Control Tower map.
- Telemetry updates (Lat/Lng/Speed) occur at regular intervals.
- Harsh braking or overspeeding events trigger system alerts.

### Story: Compliance Monitoring
**As a** Tenant Admin,  
**I want to** view an audit trail of all critical actions in the system,  
**So that** I can meet ISO 27001 requirements and maintain operational integrity.

**Acceptance Criteria:**
- Audit logs capture "Who", "What", and "When" for all data modifications.
- Logs can be filtered by user, action type, or date range.
- Security events (failed logins, role changes) are highlighted.
