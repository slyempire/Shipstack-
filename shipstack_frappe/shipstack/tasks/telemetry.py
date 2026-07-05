import frappe

def sync_telemetry():
    """
    Background telemetry aggregator running every 15 minutes.
    """
    frappe.logger().info("Running Shipstack Telemetry Sync Task")
    # Add any telemetry sync/processing logic here
    pass
