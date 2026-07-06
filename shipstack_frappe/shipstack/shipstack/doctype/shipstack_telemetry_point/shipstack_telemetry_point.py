import frappe
from frappe.model.document import Document

class ShipstackTelemetryPoint(Document):
	def after_insert(self):
		frappe.publish_realtime(
			event="telemetry:update",
			message={
				"dnId": self.trip_id,
				"lat": self.lat,
				"lng": self.lng,
				"speed": self.speed,
				"heading": self.heading,
				"timestamp": self.timestamp
			},
			room="shipstack_telemetry"
		)
