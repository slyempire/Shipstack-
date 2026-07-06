import json

import frappe

# Events the Node proxy is allowed to broadcast. Keeps this endpoint from
# becoming a generic message-injection vector.
ALLOWED_EVENTS = {
    "ingest:new",
    "payment:update",
    "telemetry:update",
}


@frappe.whitelist()
def publish_event(event, message=None, room=None):
    """Broadcast a realtime event to connected SPA clients.

    Called by the Node proxy (authenticated with server API keys) for events
    that originate outside Frappe's document lifecycle, e.g. external ERP
    ingestion or M-Pesa payment callbacks.
    """
    if event not in ALLOWED_EVENTS:
        frappe.throw(f"Event '{event}' is not allowed")

    if isinstance(message, str):
        try:
            message = json.loads(message)
        except Exception:
            message = {"info": message}

    frappe.publish_realtime(event=event, message=message, room=room)
    return {"success": True}
