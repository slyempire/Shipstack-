import os
import json
import frappe

def get_context(context):
    # Disable caching for index page to ensure new SPA versions load
    context.no_cache = 1
    
    # Default fallbacks
    js_file = "/assets/shipstack/dist/assets/index.js"
    css_file = "/assets/shipstack/dist/assets/index.css"
    
    # Find manifest
    manifest_paths = [
        frappe.get_app_path("shipstack", "public", "dist", ".vite", "manifest.json"),
        frappe.get_app_path("shipstack", "public", "dist", "manifest.json")
    ]
    
    for path in manifest_paths:
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    manifest = json.load(f)
                    
                # Look for main entry
                # Try common keys
                entry_key = None
                for key in manifest.keys():
                    if key.endswith("index.html") or key.endswith("index.tsx") or manifest[key].get("isEntry"):
                        entry_key = key
                        break
                        
                if entry_key:
                    entry = manifest[entry_key]
                    js_file = f"/assets/shipstack/dist/{entry.get('file')}"
                    css_list = entry.get("css", [])
                    if css_list:
                        css_file = f"/assets/shipstack/dist/{css_list[0]}"
                    break
            except Exception:
                pass
                
    context.js_file = js_file
    context.css_file = css_file
