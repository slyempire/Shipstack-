import frappe

# Canonical Shipstack roles. Names MUST round-trip through the mapping in
# shipstack.api.auth: "Shipstack Tenant Admin" <-> frontend role "tenant_admin"
# (strip prefix, lowercase, spaces to underscores). The frontend RoleGuard
# checks: super_admin, tenant_admin, dispatcher, driver, finance_manager,
# facility_operator, client, fleet_manager, recruiter, analyst.
SHIPSTACK_ROLES = [
    "Shipstack Super Admin",
    "Shipstack Tenant Admin",
    "Shipstack Dispatcher",
    "Shipstack Driver",
    "Shipstack Finance Manager",
    "Shipstack Facility Operator",
    "Shipstack Client",
    "Shipstack Fleet Manager",
    "Shipstack Recruiter",
    "Shipstack Analyst",
]


def after_install():
    """Setup roles after app installation."""
    for role_name in SHIPSTACK_ROLES:
        if not frappe.db.exists("Role", role_name):
            role_doc = frappe.new_doc("Role")
            role_doc.role_name = role_name
            role_doc.insert(ignore_permissions=True)

    frappe.db.commit()
