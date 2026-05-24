# Supabase Database Setup

To use Supabase with Shipstack, you need to create the required tables in your Supabase project. 
Run the following SQL in your Supabase SQL Editor.

## 1. Enable Required Extensions
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## 2. Create Core Tables

### Tenants (Optional but recommended)
```sql
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT,
  plan TEXT DEFAULT 'STARTER',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Profiles
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  name TEXT,
  email TEXT,
  role TEXT,
  company TEXT,
  phone TEXT,
  id_number TEXT,
  kra_pin TEXT,
  license_number TEXT,
  on_duty BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'PENDING',
  is_onboarded BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Health Check
```sql
CREATE TABLE IF NOT EXISTS health_check (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  status TEXT DEFAULT 'ok',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO health_check (status) VALUES ('ok') ON CONFLICT DO NOTHING;
```

### Tasks
```sql
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  priority TEXT CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  status TEXT DEFAULT 'TODO',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Delivery Notes (Shipments)
```sql
CREATE TABLE IF NOT EXISTS delivery_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL,
  dn_number TEXT UNIQUE NOT NULL,
  customer_name TEXT,
  delivery_address TEXT,
  status TEXT DEFAULT 'PENDING',
  priority TEXT,
  items JSONB,
  loading_point TEXT,
  destination TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  lat FLOAT,
  lng FLOAT,
  last_lat FLOAT,
  last_lng FLOAT,
  last_telemetry_at TIMESTAMP WITH TIME ZONE,
  route_geometry JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Vehicles
```sql
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  type TEXT,
  capacity TEXT,
  status TEXT DEFAULT 'AVAILABLE',
  driver_id UUID,
  last_maintenance TIMESTAMP WITH TIME ZONE,
  location_lat FLOAT,
  location_lng FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Orders
```sql
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL,
  order_number TEXT NOT NULL,
  customer_id TEXT,
  status TEXT,
  total_amount FLOAT,
  items JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Exceptions
```sql
CREATE TABLE IF NOT EXISTS exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL,
  dn_id TEXT, -- Reference to delivery_notes table
  type TEXT NOT NULL, -- 'LATE', 'DAMAGE', 'MISSING_DOCS', 'VEHICLE_BREAKDOWN'
  severity TEXT DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED')),
  description TEXT,
  reported_by UUID,
  resolved_by UUID,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Bays (Loading-Dock State)
Persistent state for the Facility Portal's dock-bay grid. Apply the
self-contained migration in
[`backend_design/supabase-bays-migration.sql`](backend_design/supabase-bays-migration.sql) —
it creates the table, the RLS policies, registers the table for Realtime,
and seeds 8 demo bays for `facility_id='f-1'` / `tenant_id='tenant-1'` so
the demo accounts have data out of the box. Idempotent; safe to re-run.

The migration is FK-free on purpose: `facility_id` and `dn_id` are tracked
as plain text columns. The application enforces those relationships in code,
which keeps the migration runnable in projects that haven't yet created the
optional `facilities` / `delivery_notes` tables above.

## 3. RLS (Row Level Security) - HARDENED
Enable RLS on all tables and create strict tenant-aware policies.

```sql
-- 1. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE exceptions ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Policies (Critical for Auth state)
CREATE POLICY "Users can see their own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

-- 3. Tenant Isolation Pattern (Using profiles as source of truth)
CREATE POLICY "Tenant isolation for tasks" ON tasks 
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant isolation for delivery_notes" ON delivery_notes 
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant isolation for exceptions" ON exceptions 
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant isolation for vehicles" ON vehicles 
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
```

## 4. Performance & High Concurrency
To scale to 10,000+ users:

1. **PgBouncer**: Always connect via the Connection Pooler (Port 6543) in `Transaction` mode. This prevents "Too Many Connections" errors on Cloud Run.
2. **Redis Layer**: Driver telemetry and "Hot" metadata (e.g. active trip stats) should be cached in Redis with a 5-minute TTL to reduce DB load.
3. **Read Replicas**: Configure a `VITE_SUPABASE_READ_REPLICA_URL` in production to offload expensive analytic queries from the primary instance.
4. **Auto-Scaling**: Use Cloud Run's concurrency settings (e.g. 80 requests/instance) to handle bursts automatically.
