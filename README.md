
# MEDS Logistics Platform

A modern, high-performance logistics suite built for the Frappe Framework backend. This platform manages the entire lifecycle of a **Delivery Note**, from ingestion to final invoicing.

## Architecture Overview

- **Admin Portal**: Enterprise-grade management dashboard for dispatchers and finance teams.
- **Driver PWA**: Offline-first, mobile-optimized experience with GPS tracking and proof-of-delivery (POD).
- **Facility Portal**: Streamlined interface for warehouse and facility managers to confirm loading.
- **Client Portal**: Transparent tracking for the end customer with document access.

## Tech Stack

- **React 18 + TypeScript + Vite**: Core framework and build tools.
- **Tailwind CSS**: Utility-first styling with custom theme.
- **Zustand**: Lightweight global state management for Auth and UI.
- **React Router**: Client-side routing with role-based guards.
- **Leaflet**: Real-time map tracking (optimized for performance).
- **Lucide React**: Iconography suite.
- **Recharts**: Data visualization for KPIs.

## Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Environment**:
   Create a `.env` file based on the template:
   ```env
   VITE_API_BASE_URL=https://your-frappe-instance.com/api/method
   VITE_MAPBOX_TOKEN=your_token_if_using_mapbox
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

## Deployment

The application is built as a static Single Page Application (SPA). For production, it should be deployed behind Nginx or similar, proxying API requests to the Frappe backend.

### Nginx Configuration Example
```nginx
server {
    listen 80;
    root /var/www/meds-logistics/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://frappe-backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Security Posture

- **Role-Based Guards**: Protected routes ensure users only access views relevant to their role.
- **Field Masking**: UI logic explicitly filters restricted fields (e.g., Drivers never see commercial rates).
- **In-Memory Tokens**: JWTs are managed in state to prevent XSS theft, with periodic refresh handled by the API client.
- **Audit Logs**: Client-side breadcrumb logging for operational visibility.

## PWA Capabilities

- **Offline Mode**: Drivers can view their active queue without connectivity.
- **Background Sync**: POD data is queued and sent automatically when a connection is restored.
- **Installability**: Can be added to the home screen on iOS and Android for a native app experience.
