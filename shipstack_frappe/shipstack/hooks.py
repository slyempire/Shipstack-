app_name = "shipstack"
app_title = "Shipstack Logistics"
app_publisher = "Shipstack"
app_description = "Multi-portal logistics platform"
app_version = "1.0.0"
app_icon = "octicon octicon-package"
app_color = "#0EA5E9"
app_license = "Proprietary"

# Frappe Apps screen registration
add_to_apps_screen = [
    {
        "name": "shipstack",
        "logo": "/assets/shipstack/images/logo.svg",
        "title": "Shipstack",
        "route": "/shipstack",
        "has_permission": "shipstack.api.permissions.has_app_permission",
    }
]

# Scheduler jobs
scheduler_events = {
    "daily": [
        "shipstack.tasks.daily.daily_sync"
    ],
    "every_15_minutes": [
        "shipstack.tasks.telemetry.sync_telemetry"
    ],
}

# Document lifecycle hooks
doc_events = {
    "Shipstack Delivery Note": {
        "on_submit": "shipstack.events.on_delivery_note_submit",
        "on_cancel": "shipstack.events.on_delivery_note_cancel",
        "after_save": "shipstack.events.after_delivery_note_save",
    },
    "Shipstack Trip": {
        "on_update": "shipstack.events.on_trip_update",
    },
}

# Setup and install hooks
after_install = "shipstack.install.after_install"
