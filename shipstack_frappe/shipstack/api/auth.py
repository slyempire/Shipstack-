import frappe
from frappe import _

def map_frappe_user_to_shipstack(user_doc):
    # Map roles from Frappe list of User Roles
    roles = [r.role for r in user_doc.roles]
    # Pick the first matching Shipstack role or default to 'driver'
    role = 'driver'
    for r in roles:
        if r.startswith("Shipstack "):
            role = r.replace("Shipstack ", "").lower().replace(" ", "_")
            break
            
    return {
        "id": user_doc.name,
        "name": user_doc.full_name,
        "email": user_doc.email,
        "role": role,
        "isOnboarded": True,
        "verificationStatus": "VERIFIED" if user_doc.enabled else "PENDING",
        "phone": user_doc.mobile_no,
        "avatar": user_doc.user_image
    }

def generate_api_token(user_name):
    # Generates API key/secret if not exists
    user_doc = frappe.get_doc("User", user_name)
    if not user_doc.api_key:
        user_doc.api_key = frappe.generate_hash(length=15)
    
    api_secret = None
    # Generate secret
    from frappe.utils.password import create_auth_hash
    if not frappe.db.get_value("User", user_name, "api_secret"):
        api_secret = frappe.generate_hash(length=15)
        hashed_secret = create_auth_hash(api_secret)
        frappe.db.set_value("User", user_name, "api_secret", hashed_secret, update_modified=False)
        
    user_doc.save(ignore_permissions=True)
    frappe.db.commit()
    
    return {
        "api_key": user_doc.api_key,
        "api_secret": api_secret or "********"
    }

@frappe.whitelist(allow_guest=True)
def login(email, password):
    from frappe.auth import LoginManager
    try:
        login_manager = LoginManager()
        login_manager.authenticate(user=email, pwd=password)
        login_manager.post_login()
    except Exception as e:
        frappe.local.response["http_status_code"] = 401
        return {"error": "Invalid login credentials", "message": str(e)}

    user_doc = frappe.get_doc("User", frappe.session.user)
    tokens = generate_api_token(user_doc.name)
    
    # Return formatted session details
    return {
        "user": map_frappe_user_to_shipstack(user_doc),
        "token": f"{tokens['api_key']}:{tokens['api_secret']}"
    }

@frappe.whitelist()
def get_logged_user():
    if frappe.session.user == "Guest":
        return None
    user_doc = frappe.get_doc("User", frappe.session.user)
    return map_frappe_user_to_shipstack(user_doc)

@frappe.whitelist(allow_guest=True)
def reset_password(email):
    from frappe.core.doctype.user.user import reset_password as frappe_reset
    try:
        frappe_reset(user=email)
        return {"success": True, "message": "Password reset email sent."}
    except Exception as e:
        return {"success": False, "message": str(e)}

@frappe.whitelist()
def logout():
    frappe.local.login_manager.logout()
    return {"message": "Logged out successfully"}

@frappe.whitelist(allow_guest=True)
def register(email, name, password, role="driver"):
    # Map role name to Frappe Roles
    frappe_role = f"Shipstack {role.replace('_', ' ').title()}"
    if not frappe.db.exists("Role", frappe_role):
        # Create role if doesn't exist
        r = frappe.new_doc("Role")
        r.role_name = frappe_role
        r.insert(ignore_permissions=True)
        
    if frappe.db.exists("User", email):
        frappe.local.response["http_status_code"] = 400
        return {"error": "User already exists", "message": f"User with email {email} already registered."}
        
    user_doc = frappe.new_doc("User")
    user_doc.email = email
    user_doc.first_name = name
    user_doc.new_password = password
    user_doc.enabled = 1
    user_doc.send_welcome_email = 0
    
    # Add role
    user_doc.append("roles", {
        "role": frappe_role
    })
    
    user_doc.insert(ignore_permissions=True)
    frappe.db.commit()
    
    tokens = generate_api_token(user_doc.name)
    return {
        "user": map_frappe_user_to_shipstack(user_doc),
        "token": f"{tokens['api_key']}:{tokens['api_secret']}"
    }
