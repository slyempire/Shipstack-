import json

import frappe
from frappe import _


@frappe.whitelist()
def reconcile_trip(trip_id, cod_collected=0, returned_items_count=0):
	"""Reconcile COD collected against a completed trip.

	Moves the trip to RECONCILED and records the collected amount so
	Finance can audit discrepancies later.
	"""
	if not frappe.db.exists("Shipstack Trip", trip_id):
		frappe.throw(_("Trip {0} not found").format(trip_id))

	frappe.db.set_value(
		"Shipstack Trip",
		trip_id,
		{
			"status": "RECONCILED",
			"cod_collected": float(cod_collected or 0),
		},
		update_modified=True,
	)
	frappe.db.commit()

	frappe.publish_realtime(
		event="shipstack_trip_update",
		message={"id": trip_id, "status": "RECONCILED", "codCollected": float(cod_collected or 0)},
		room=f"shipstack_trip_{trip_id}",
	)

	return {
		"success": True,
		"tripId": trip_id,
		"status": "RECONCILED",
		"codCollected": float(cod_collected or 0),
		"returnedItemsCount": int(returned_items_count or 0),
	}


@frappe.whitelist()
def batch_disburse_commission(trip_ids):
	"""Mark driver commissions as DISBURSED for a batch of trips."""
	if isinstance(trip_ids, str):
		try:
			trip_ids = json.loads(trip_ids)
		except Exception:
			trip_ids = [trip_ids]

	disbursed = []
	skipped = []
	for trip_id in trip_ids:
		if frappe.db.exists("Shipstack Trip", trip_id):
			frappe.db.set_value(
				"Shipstack Trip",
				trip_id,
				{"commission_status": "DISBURSED"},
				update_modified=True,
			)
			disbursed.append(trip_id)
		else:
			skipped.append(trip_id)

	frappe.db.commit()
	return {"success": True, "disbursed": disbursed, "skipped": skipped}
