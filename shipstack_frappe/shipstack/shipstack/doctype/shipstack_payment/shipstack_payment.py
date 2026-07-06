import frappe
from frappe.model.document import Document


class ShipstackPayment(Document):
	def after_insert(self):
		# Mirror the payment result to connected SPA clients so invoicing
		# views update without polling.
		frappe.publish_realtime(
			event="payment:update",
			message={
				"provider": self.provider,
				"checkoutRequestId": self.checkout_request_id,
				"status": self.status,
				"amount": self.amount,
				"receipt": self.mpesa_receipt,
				"phone": self.phone,
				"reference": self.reference,
			},
			room="shipstack_payments",
		)
