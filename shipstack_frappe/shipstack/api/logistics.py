import frappe
from frappe import _

@frappe.whitelist()
def create_trip(driver_id, vehicle_id, priority, status="PENDING", dn_ids=None, **kwargs):
    if not dn_ids:
        dn_ids = []
    elif isinstance(dn_ids, str):
        import json
        try:
            dn_ids = json.loads(dn_ids)
        except Exception:
            dn_ids = [dn_ids]
            
    doc = frappe.new_doc("Shipstack Trip")
    doc.driver_id = driver_id
    doc.vehicle_id = vehicle_id
    doc.status = status
    doc.priority = priority
    
    # Copy other optional fields from kwargs
    for field in ["route_title", "commission_status", "commission_amount", "cod_collected", "allowance_amount", "allowance_status", "route_risk_level", "route_geometry"]:
        if field in kwargs:
            setattr(doc, field, kwargs[field])
            
    # Append child table rows
    for dn_id in dn_ids:
        doc.append("dn_ids", {
            "dn_id": dn_id
        })
        
    doc.insert(ignore_permissions=True)
    
    # Update Delivery Note status and details
    for dn_id in dn_ids:
        if frappe.db.exists("Shipstack Delivery Note", dn_id):
            frappe.db.set_value("Shipstack Delivery Note", dn_id, {
                "status": "DISPATCHED",
                "driver_id": driver_id,
                "vehicle_id": vehicle_id
            }, update_modified=True)
            
    frappe.db.commit()
    
    # Return document as dict
    return doc.as_dict()

@frappe.whitelist()
def update_dn_status(dn_id, status, driver_id=None, vehicle_id=None, exception_notes=None):
    if not frappe.db.exists("Shipstack Delivery Note", dn_id):
        frappe.throw(_("Delivery Note {0} not found").format(dn_id))
        
    values = {"status": status}
    if driver_id:
        values["driver_id"] = driver_id
    if vehicle_id:
        values["vehicle_id"] = vehicle_id
    if exception_notes:
        values["exception_reason"] = exception_notes
        
    frappe.db.set_value("Shipstack Delivery Note", dn_id, values, update_modified=True)
    
    # Add a log entry to the Delivery Note logs child table
    dn_doc = frappe.get_doc("Shipstack Delivery Note", dn_id)
    dn_doc.append("logs", {
        "timestamp": frappe.utils.now_datetime(),
        "action": f"Status changed to {status}",
        "user": frappe.session.user,
        "notes": exception_notes or ""
    })
    dn_doc.save(ignore_permissions=True)
    frappe.db.commit()
    
    # Trigger after_save hook manually if needed, or save() will trigger it
    return dn_doc.as_dict()

@frappe.whitelist()
def delete_trip(id):
    if not frappe.db.exists("Shipstack Trip", id):
        frappe.throw(_("Trip {0} not found").format(id))
        
    trip_doc = frappe.get_doc("Shipstack Trip", id)
    dn_ids = [d.dn_id for d in trip_doc.dn_ids]
    
    # Delete the trip
    frappe.delete_doc("Shipstack Trip", id, ignore_permissions=True)
    
    # Revert Delivery Notes status
    for dn_id in dn_ids:
        if frappe.db.exists("Shipstack Delivery Note", dn_id):
            frappe.db.set_value("Shipstack Delivery Note", dn_id, {
                "status": "RECEIVED",
                "driver_id": None,
                "vehicle_id": None
            }, update_modified=True)
            
    frappe.db.commit()
    return {"success": True}
