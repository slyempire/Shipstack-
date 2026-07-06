import frappe
import json

@frappe.whitelist()
def log_audit(action, details=None, timestamp=None):
    if not details:
        details = {}
    if isinstance(details, str):
        try:
            details = json.loads(details)
        except Exception:
            details = {"info": details}
            
    doc = frappe.new_doc("Shipstack Audit Log")
    doc.user_id = frappe.session.user
    doc.user_email = frappe.db.get_value("User", frappe.session.user, "email") or frappe.session.user
    doc.action = action
    doc.resource = details.get("resource", "System")
    doc.resource_id = details.get("id", details.get("resource_id", ""))
    doc.severity = details.get("severity", "info")
    doc.timestamp = timestamp or frappe.utils.now_datetime()
    doc.metadata = json.dumps(details)
    doc.ip_address = frappe.local.ip
    doc.user_agent = frappe.local.request.headers.get("User-Agent") if frappe.local.request else ""
    
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"success": True}
