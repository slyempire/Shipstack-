import frappe

@frappe.whitelist()
def has_app_permission():
    # Allow any logged-in user who has a Shipstack-related role
    if frappe.session.user == "Guest":
        return False
        
    user_roles = frappe.get_roles(frappe.session.user)
    if "System Manager" in user_roles or "Administrator" in user_roles:
        return True
        
    for role in user_roles:
        if role.startswith("Shipstack "):
            return True
            
    return False
