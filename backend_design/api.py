import frappe
import json
import hmac
import hashlib
from frappe import _

@frappe.whitelist(allow_guest=False)
def create_inbound_shipment():
    """
    Endpoint: /api/method/logistics_core.api.create_inbound_shipment
    Purpose: Standardized entry point for Client ERPs to push shipment requests.
    """
    if frappe.request.method != "POST":
        frappe.throw(_("Only POST requests are allowed"), frappe.PermissionError)

    # 1. Identity & Security
    # Frappe handles API Key/Secret auth via headers automatically if configured.
    # We verify the client is active.
    client_id = frappe.get_value("User", frappe.session.user, "user_type") # Simplified logic
    client = frappe.get_doc("Logistics Client", {"api_key": frappe.get_request_header("X-API-Key")})
    
    if not client.is_active:
        frappe.throw(_("Client account is inactive"), frappe.PermissionError)

    try:
        data = frappe.request.get_json()
    except Exception:
        frappe.throw(_("Invalid JSON payload"))

    # 2. Normalization (Mapping Client Data to Internal Model)
    # This is where the 'Translation' happens.
    try:
        normalized_data = normalize_payload(data, client.erp_type)
        
        # 3. Create Internal Doc
        shipment = frappe.get_doc({
            "doctype": "Shipment Request",
            "client": client.name,
            **normalized_data
        })
        
        shipment.insert(ignore_permissions=True)
        frappe.db.commit()

        # 4. Audit Logging
        log_integration_event(
            client=client.name,
            direction="Inbound",
            event="Shipment Created",
            payload=data,
            status="Success",
            reference=shipment.name
        )

        # 5. Trigger Background Processing (Async)
        # e.g., Route optimization or automated dispatch checks
        frappe.enqueue(
            "logistics_core.tasks.process_new_shipment",
            shipment_id=shipment.name,
            queue="default"
        )

        return {
            "status": "success",
            "message": _("Shipment Request {0} created").format(shipment.name),
            "internal_id": shipment.name,
            "external_id": shipment.external_id
        }

    except Exception as e:
        # Log failure
        log_integration_event(
            client=client.name,
            direction="Inbound",
            event="Shipment Creation Failed",
            payload=data,
            status="Error",
            error_message=str(e)
        )
        frappe.log_error(frappe.get_traceback(), _("Inbound Integration Error"))
        return {"status": "error", "message": str(e)}

def normalize_payload(data, erp_type):
    """
    Translates various ERP structures into the Shipment Request model.
    """
    if erp_type == "SAP":
        return {
            "external_id": data.get("VBELN"), # SAP Sales Document
            "customer_name": data.get("KUNNR_NAME"),
            "origin_address": data.get("SOURCE_ADDR"),
            "destination_address": data.get("DEST_ADDR"),
            "priority": "High" if data.get("PRIO") == "01" else "Medium"
        }
    elif erp_type == "Odoo":
        return {
            "external_id": data.get("name"),
            "customer_name": data.get("partner_id", {}).get("display_name"),
            "origin_address": data.get("warehouse_id", {}).get("address"),
            "destination_address": data.get("delivery_address"),
            "priority": data.get("priority_level", "Medium")
        }
    # Default / Standard mapping
    return {
        "external_id": data.get("order_id"),
        "customer_name": data.get("customer"),
        "origin_address": data.get("origin"),
        "destination_address": data.get("destination"),
        "priority": data.get("priority", "Medium")
    }

def log_integration_event(client, direction, event, payload, status, reference=None, error_message=None):
    """
    Saves an entry to the Integration Log DocType for debugging and audit.
    """
    frappe.get_doc({
        "doctype": "Integration Log",
        "client": client,
        "direction": direction,
        "event": event,
        "payload": json.dumps(payload, indent=2),
        "status": status,
        "reference_doctype": "Shipment Request" if reference else None,
        "reference_name": reference,
        "error_message": error_message,
        "timestamp": frappe.utils.now_datetime()
    }).insert(ignore_permissions=True)
