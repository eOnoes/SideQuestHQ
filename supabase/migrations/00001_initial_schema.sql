-- SideQuest HQ - Initial Schema
-- Generated from the app's types.ts definitions

-- Users are handled by Supabase Auth; we use auth.users as the user source.

-- QUESTS
create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('Rental Property', 'Customer Build', 'Build Project', 'Investment', 'Personal Plan', 'Side Quest')),
  status text not null default 'Discovery',
  next_move text not null default 'Capture the first move.',
  value text not null default '$0 tracked',
  progress integer not null default 10 check (progress >= 0 and progress <= 100),
  tone text not null default 'discovery' check (tone in ('active', 'discovery', 'progress')),
  owner text not null default '',
  target text not null default '',
  due text not null default 'Soon',
  summary text not null default '',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_quests_user_id on public.quests(user_id);

-- LEDGER ENTRIES (within quests)
create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  label text not null,
  amount text not null default '$0',
  state text not null default 'Draft' check (state in ('Draft', 'Open', 'Paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ledger_quest_id on public.ledger_entries(quest_id);

-- PAPER TRAIL ITEMS (documents/receipts attached to quests)
create table if not exists public.paper_trail_items (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  label text not null,
  meta text not null default '',
  state text not null default 'Review' check (state in ('Review', 'Ready', 'Filed', 'Draft')),
  file_url text,
  file_type text,
  extracted_text text,
  ai_extracted_data jsonb,
  confidence_score float,
  approved_ledger_entry_id uuid references public.ledger_entries(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_paper_quest_id on public.paper_trail_items(quest_id);

-- REMINDERS
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid references public.quests(id) on delete set null,
  label text not null,
  notes text not null default '',
  due_date timestamptz,
  recurrence_rule text,
  priority text not null default 'Normal' check (priority in ('Quiet', 'Normal', 'Important')),
  done boolean not null default false,
  snoozed_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reminders_user_id on public.reminders(user_id);
create index if not exists idx_reminders_due_date on public.reminders(due_date) where not done;

-- PEOPLE (contacts)
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'Contact',
  email text,
  phone text,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_people_user_id on public.people(user_id);

-- PEOPLE-QUEST LINKS
create table if not exists public.quest_people (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  relationship text not null default '',
  unique(quest_id, person_id)
);

-- ASSETS
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('Rental', 'Business', 'Retirement', 'Build', 'Other')),
  value text not null default '$0 tracked',
  projected text not null default '$0',
  frequency text not null default 'Monthly' check (frequency in ('Monthly', 'Annual', 'One-time')),
  status text not null default 'Producing' check (status in ('Producing', 'Watching', 'Planning')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assets_user_id on public.assets(user_id);

-- INVESTMENT SNAPSHOTS
create table if not exists public.investment_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_name text not null,
  account_name text not null,
  holding_name text not null,
  ticker text not null default '',
  snapshot_date date not null,
  current_value numeric(12,2) not null default 0,
  contributions_to_date numeric(12,2) not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- CRYPTO SNAPSHOTS
create table if not exists public.crypto_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_label text not null,
  token_name text not null,
  token_symbol text not null,
  token_count numeric(20,8) not null default 0,
  current_value numeric(12,2) not null default 0,
  snapshot_date date not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- RENTAL PROPERTIES
create table if not exists public.rental_properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_name text not null,
  street_address text not null default '',
  city text not null default '',
  state text not null default '',
  zip text not null default '',
  rent_type text not null default 'House' check (rent_type in ('House', 'Room')),
  rooms integer not null default 0,
  pet_allowed boolean not null default false,
  acquisition_date date,
  ownership_status text not null default 'owned' check (ownership_status in ('owned', 'leased', 'sold', 'inactive')),
  rental_status text not null default 'empty' check (rental_status in ('available', 'full', 'empty', 'under_maintenance', 'archived')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RENTAL TENANTS
create table if not exists public.rental_tenants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.rental_properties(id) on delete cascade,
  tenant_name text not null,
  phone text not null default '',
  email text not null default '',
  lease_start date,
  lease_end date,
  monthly_rent numeric(10,2) not null default 0,
  deposit_amount numeric(10,2) not null default 0,
  status text not null default 'active' check (status in ('active', 'former', 'applicant')),
  notes text not null default ''
);

-- RENTAL RENT RECORDS
create table if not exists public.rental_rents (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.rental_properties(id) on delete cascade,
  tenant_id uuid references public.rental_tenants(id) on delete set null,
  rent_period_start date not null,
  rent_period_end date not null,
  due_date date not null,
  amount_due numeric(10,2) not null default 0,
  amount_received numeric(10,2) not null default 0,
  payment_date date,
  payment_method text not null default '',
  late_fee_amount numeric(10,2) not null default 0,
  status text not null default 'due' check (status in ('due', 'partial', 'paid', 'late', 'waived')),
  notes text not null default ''
);

-- RENTAL EXPENSES
create table if not exists public.rental_expenses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.rental_properties(id) on delete cascade,
  vendor_id uuid,
  expense_date date not null,
  due_date date,
  paid_date date,
  category text not null check (category in ('mortgage', 'utilities', 'insurance', 'taxes', 'supplies', 'repairs', 'lawn', 'legal', 'accounting', 'other')),
  amount numeric(10,2) not null default 0,
  payment_method text not null default '',
  receipt_url text not null default '',
  recurring boolean not null default false,
  tax_bucket text not null default '',
  notes text not null default ''
);

-- VEHICLES
create table if not exists public.rental_vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_name text not null,
  vehicle_type text not null default 'Car' check (vehicle_type in ('Van', 'Truck', 'Car', 'Motorcycle')),
  make text not null default '',
  model text not null default '',
  model_year text not null default '',
  owned_or_leased text not null default 'owned' check (owned_or_leased in ('owned', 'leased')),
  availability_status text not null default 'available' check (availability_status in ('available', 'unavailable', 'archived')),
  in_service_date date,
  lease_monthly_amount numeric(10,2) not null default 0,
  start_odometer_year integer not null default 0,
  end_odometer_year integer not null default 0,
  notes text not null default ''
);

-- VEHICLE TRIPS
create table if not exists public.rental_vehicle_trips (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.rental_vehicles(id) on delete cascade,
  property_id uuid references public.rental_properties(id) on delete set null,
  date date not null,
  start_odometer integer not null default 0,
  end_odometer integer not null default 0,
  miles integer not null default 0,
  origin text not null default '',
  destination text not null default '',
  purpose text not null default '',
  category text not null default 'other' check (category in ('inspection', 'repair', 'materials', 'lawn', 'admin', 'other')),
  business_use boolean not null default false,
  notes text not null default ''
);

-- VEHICLE EXPENSES
create table if not exists public.rental_vehicle_expenses (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.rental_vehicles(id) on delete cascade,
  date date not null,
  type text not null check (type in ('lease', 'fuel', 'maintenance', 'insurance', 'registration', 'repairs', 'other')),
  amount numeric(10,2) not null default 0,
  receipt_url text not null default '',
  notes text not null default ''
);

-- VENDORS
create table if not exists public.rental_vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vendor_name text not null,
  company_name text not null default '',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  service_type text not null default '',
  tax_form_required boolean not null default false,
  notes text not null default ''
);

-- MILEAGE RATES
create table if not exists public.rental_mileage_rates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tax_year integer not null,
  business_rate numeric(5,3) not null,
  source text not null default '',
  source_url text not null default '',
  notes text not null default '',
  unique(user_id, tax_year)
);

-- WORK ORDERS
create table if not exists public.rental_work_orders (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.rental_properties(id) on delete cascade,
  vendor_id uuid references public.rental_vendors(id) on delete set null,
  unit_or_area text not null default '',
  issue_type text not null default '',
  description text not null default '',
  reported_date date not null,
  started_date date,
  completed_date date,
  status text not null default 'planned' check (status in ('planned', 'pending', 'in_progress', 'completed', 'cancelled')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  labor_cost numeric(10,2) not null default 0,
  material_cost numeric(10,2) not null default 0,
  total_cost numeric(10,2) not null default 0,
  warranty_related boolean not null default false,
  expense_id uuid references public.rental_expenses(id) on delete set null,
  notes text not null default ''
);

-- DOCUMENTS (for rental records)
create table if not exists public.rental_documents (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.rental_properties(id) on delete cascade,
  linked_record_type text not null,
  linked_record_id text not null,
  document_type text not null default '',
  file_url text not null default '',
  upload_date date not null default current_date,
  notes text not null default ''
);

-- Enable Row Level Security on all tables
alter table if exists public.quests enable row level security;
alter table if exists public.ledger_entries enable row level security;
alter table if exists public.paper_trail_items enable row level security;
alter table if exists public.reminders enable row level security;
alter table if exists public.people enable row level security;
alter table if exists public.quest_people enable row level security;
alter table if exists public.assets enable row level security;
alter table if exists public.investment_snapshots enable row level security;
alter table if exists public.crypto_snapshots enable row level security;
alter table if exists public.rental_properties enable row level security;
alter table if exists public.rental_tenants enable row level security;
alter table if exists public.rental_rents enable row level security;
alter table if exists public.rental_expenses enable row level security;
alter table if exists public.rental_vehicles enable row level security;
alter table if exists public.rental_vehicle_trips enable row level security;
alter table if exists public.rental_vehicle_expenses enable row level security;
alter table if exists public.rental_vendors enable row level security;
alter table if exists public.rental_mileage_rates enable row level security;
alter table if exists public.rental_work_orders enable row level security;
alter table if exists public.rental_documents enable row level security;

-- RLS: Users only see their own data
create policy user_isolation on public.quests for all using (user_id = auth.uid());
create policy user_isolation on public.reminders for all using (user_id = auth.uid());
create policy user_isolation on public.people for all using (user_id = auth.uid());
create policy user_isolation on public.assets for all using (user_id = auth.uid());
create policy user_isolation on public.investment_snapshots for all using (user_id = auth.uid());
create policy user_isolation on public.crypto_snapshots for all using (user_id = auth.uid());
create policy user_isolation on public.rental_properties for all using (user_id = auth.uid());
create policy user_isolation on public.rental_tenants for all using (user_id = auth.uid());
create policy user_isolation on public.rental_vehicles for all using (user_id = auth.uid());
create policy user_isolation on public.rental_vendors for all using (user_id = auth.uid());
create policy user_isolation on public.rental_mileage_rates for all using (user_id = auth.uid());

-- RLS: Children of quests use quest ownership
create policy quest_child_isolation on public.ledger_entries for all using (
  quest_id in (select id from public.quests where user_id = auth.uid())
);
create policy quest_child_isolation on public.paper_trail_items for all using (
  quest_id in (select id from public.quests where user_id = auth.uid())
);
create policy quest_child_isolation on public.quest_people for all using (
  quest_id in (select id from public.quests where user_id = auth.uid())
);
create policy property_child_isolation on public.rental_tenants for all using (
  property_id in (select id from public.rental_properties where user_id = auth.uid())
);
create policy property_child_isolation on public.rental_rents for all using (
  property_id in (select id from public.rental_properties where user_id = auth.uid())
);
create policy property_child_isolation on public.rental_expenses for all using (
  property_id in (select id from public.rental_properties where user_id = auth.uid())
);
create policy property_child_isolation on public.rental_work_orders for all using (
  property_id in (select id from public.rental_properties where user_id = auth.uid())
);
create policy property_child_isolation on public.rental_documents for all using (
  property_id in (select id from public.rental_properties where user_id = auth.uid())
);
create policy vehicle_child_isolation on public.rental_vehicle_trips for all using (
  vehicle_id in (select id from public.rental_vehicles where user_id = auth.uid())
);
create policy vehicle_child_isolation on public.rental_vehicle_expenses for all using (
  vehicle_id in (select id from public.rental_vehicles where user_id = auth.uid())
);

-- Auto-update updated_at on relevant tables
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.quests
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.ledger_entries
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.paper_trail_items
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.reminders
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.people
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.assets
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.rental_properties
  for each row execute function public.set_updated_at();
