import frappe

def on_delivery_note_submit(doc, method):
    frappe.publish_realtime(
        event="shipstack_dn_submit",
        message={"id": doc.name, "status": doc.status},
        room=f"shipstack_dn_{doc.name}"
    )

def on_delivery_note_cancel(doc, method):
    frappe.publish_realtime(
        event="shipstack_dn_cancel",
        message={"id": doc.name, "status": doc.status},
        room=f"shipstack_dn_{doc.name}"
    )

def after_delivery_note_save(doc, method):
    frappe.publish_realtime(
        event="shipstack_dn_update",
        message={"id": doc.name, "status": doc.status, "driver_id": doc.driver_id, "vehicle_id": doc.vehicle_id},
        room=f"shipstack_dn_{doc.name}"
    )

def on_trip_update(doc, method):
    frappe.publish_realtime(
        event="shipstack_trip_update",
        message={"id": doc.name, "status": doc.status, "driver_id": doc.driver_id, "vehicle_id": doc.vehicle_id},
        room=f"shipstack_trip_{doc.name}"
    )
