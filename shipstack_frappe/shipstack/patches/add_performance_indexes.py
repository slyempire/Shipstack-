import frappe

# High-traffic query paths that need composite indexes:
# - DN lists are always filtered by (tenant_id, status)
# - Driver portal loads trips by (driver_id, status)
# - Live tracking reads telemetry by (trip_id, timestamp)
INDEXES = [
	("Shipstack Delivery Note", ["tenant_id", "status"]),
	("Shipstack Trip", ["driver_id", "status"]),
	("Shipstack Telemetry Point", ["trip_id", "timestamp"]),
	("Shipstack Order", ["tenant_id", "status"]),
	("Shipstack Task", ["tenant_id", "status"]),
	("Shipstack Payment", ["checkout_request_id"]),
]


def execute():
	for doctype, fields in INDEXES:
		if not frappe.db.table_exists(f"tab{doctype}"):
			continue
		try:
			frappe.db.add_index(doctype, fields)
		except Exception:
			# Index may already exist or a column may be missing on older
			# sites; skip rather than fail the whole migration.
			frappe.log_error(
				title="add_performance_indexes skipped",
				message=f"{doctype}: {fields}",
			)
