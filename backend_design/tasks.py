import frappe
import requests
import hmac
import hashlib
import json

def process_new_shipment(shipment_id):
    """
    Background job to handle post-creation logic.
    """
    shipment = frappe.get_doc("Shipment Request", shipment_id)
    
    # Perform automated validation
    if not shipment.destination_address:
        shipment.add_comment("Assignment", "Missing destination address. Manual review required.")
        return

    # Example: Automated Dispatching logic
    # find_nearest_available_driver(shipment)
    
    shipment.status = "Validated"
    shipment.save(ignore_permissions=True)

def notify_client_erp(doc, method):
    """
    Hooked to 'on_submit' or 'on_update' of Delivery Note or Shipment Request.
    Sends a signed webhook back to the client.
    """
    client = frappe.get_doc("Logistics Client", doc.client)
    if not client.webhook_url:
        return

    payload = {
        "event": "status_update",
        "internal_id": doc.name,
        "external_id": doc.external_id,
        "new_status": doc.status,
        "timestamp": frappe.utils.now_datetime().isoformat()
    }

    # Sign the payload
    signature = hmac.new(
        key=client.webhook_secret.encode('utf-8'),
        msg=json.dumps(payload).encode('utf-8'),
        digestmod=hashlib.sha256
    ).hexdigest()

    # Enqueue the outbound request to avoid blocking the UI
    frappe.enqueue(
        "logistics_core.tasks.send_webhook_request",
        url=client.webhook_url,
        payload=payload,
        signature=signature,
        retry=5
    )

def send_webhook_request(url, payload, signature, retry=0):
    """
    Executes the actual HTTP POST to the client ERP.
    """
    headers = {
        "Content-Type": "application/json",
        "X-Frappe-Signature": signature
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
    except Exception as e:
        if retry > 0:
            # Exponential backoff could be added here
            frappe.enqueue(
                "logistics_core.tasks.send_webhook_request",
                url=url,
                payload=payload,
                signature=signature,
                retry=retry - 1,
                now=True # Run in background
            )
        else:
            frappe.log_error(f"Webhook failed for {url}: {str(e)}", "Outbound Integration Error")
