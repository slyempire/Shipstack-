# Shipstack Test Plan

This document provides a set of structured test cases to verify the functionality of the Shipstack application. These tests cover the critical paths identified in the [User Stories](./USER_STORIES.md).

## Test Environment Setup
- **App URL**: [Preview URL]
- **Default Accounts**:
  - Admin: `admin@shipstack.com` (pw: `password`)
  - Driver: `pilot@shipstack.com` (pw: `password`)
  - Hub: `hub@shipstack.com` (pw: `password`)

---

## 1. Authentication & Security
| Test ID | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-01** | Role-Based Access | Login as `pilot@shipstack.com`. Try to access `/admin/dashboard`. | System redirects or shows "Insufficient Permissions" error. |
| **TC-02** | Secure Logout | Click "Logout" from any portal. Press the "Back" button in the browser. | User is redirected to login; session-protected data is not visible. |
| **TC-03** | Audit Trail | As Admin, create a new User. Go to "Settings > Audit Logs". | An entry showing "CREATE_USER" with the admin's email and timestamp exists. |

## 2. Dispatch Operations
| Test ID | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-04** | Manifest Import | Go to "Dispatch > Import". Upload a CSV with 10 delivery notes. | 10 records are created; status is "READY_FOR_DISPATCH". |
| **TC-05** | Trip Creation | Select 3 delivery notes in the list. Click "Create Trip". Assign a driver. | A new Trip ID is generated; the 3 DNs are linked to this trip. |
| **TC-06** | Real-time Map | Open the "Control Tower". Locate an active trip. | Marker is visible and updates position (simulated via telemetry). |

## 3. Driver Workflow (Mobile)
| Test ID | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-07** | Safety Inspection | Click "Safety Checklist". Mark "Tires" as "Fail". | System displays a warning; inspection status is logged as "FAIL". |
| **TC-08** | Order Delivery | Open an active trip. Click "Navigate". Mark order as "Delivered". | Status changes to "DELIVERED" in both Driver Portal and Admin Dashboard. |
| **TC-09** | POD Signature | On the delivery screen, use the signature pad to sign. Save. | Signature image is saved and visible in the Delivery Note details. |

## 4. Warehouse & Hub
| Test ID | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-10** | Low Stock Alert | Reduce the quantity of an item below its threshold in inventory. | Item is highlighted in "Low Stock" section or triggers a notification. |
| **TC-11** | Bin Transfer | Select an item in Bin A. Move it to Bin B via the UI. | Inventory reflects the new bin location; Audit log captures the move. |

## 5. Finance & Reconciliation
| Test ID | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-12** | Trip Reconciliation | Complete a trip with COD. As Finance, click "Reconcile Trip". | Finances match expected COD; Trip status moves to "RECONCILED". |
| **TC-13** | M-Pesa Integration | Click "Request Payment" on a delivery. | M-Pesa STK Push is simulated (or real if configured); status updates to "PAID". |

---

## Bug Reporting Template
When a test fails, please include:
- **ID**: TC-xx
- **Severity**: (Low/Medium/High/Blocker)
- **Environment**: (Mobile Chrome, Desktop Safari, etc.)
- **Expected**: What should have happened.
- **Actual**: What actually happened.
- **Screenshots**: [Attach image]
