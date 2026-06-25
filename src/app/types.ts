export type LedgerState = "Paid" | "Open" | "Draft";
export type StepState = "Done" | "Now" | "Next";
export type QuestType = "Rental Property" | "Customer Build" | "Build Project" | "Investment" | "Personal Plan" | "Side Quest";
export type AppView = "Command" | "Quests" | "Assets" | "Garage" | "Ledger" | "Paper Trail" | "Reminders" | "People" | "Agent";
export type AssetTab = "Portfolio" | "Rentals" | "Garage" | "Investments" | "Crypto";

export type Quest = {
  name: string;
  type: string;
  status: string;
  nextMove: string;
  value: string;
  progress: number;
  tone: "active" | "discovery" | "progress";
  owner: string;
  target: string;
  due: string;
  summary: string;
  ledger: Array<{ label: string; amount: string; state: LedgerState }>;
  papers: Array<{ label: string; meta: string; state: string }>;
  steps: Array<{ label: string; state: StepState }>;
  notes: string[];
};

export type Reminder = {
  label: string;
  quest: string;
  due: string;
  priority: "Quiet" | "Normal" | "Important";
  done: boolean;
};

export type PaperItem = {
  title: string;
  source: string;
  state: string;
  amount: string;
  kind: "image" | "file";
};

export type Person = {
  name: string;
  role: string;
  quest: string;
  nextTouch: string;
  status: "Active" | "Waiting" | "Quiet";
};

export type Asset = {
  name: string;
  type: "Rental" | "Business" | "Retirement" | "Build" | "Other";
  value: string;
  projected: string;
  frequency: "Monthly" | "Annual" | "One-time";
  status: "Producing" | "Watching" | "Planning";
};

export type InvestmentSnapshot = {
  snapshot_id: string;
  asset_name: string;
  account_name: string;
  holding_name: string;
  ticker: string;
  snapshot_date: string;
  current_value: number;
  contributions_to_date: number;
  notes: string;
};

export type CryptoSnapshot = {
  snapshot_id: string;
  wallet_label: string;
  token_name: string;
  token_symbol: string;
  token_count: number;
  current_value: number;
  snapshot_date: string;
  notes: string;
};

export type RentalProperty = {
  property_id: string;
  property_name: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
  rent_type: "House" | "Room";
  rooms: 0 | 1 | 2 | 3 | 4 | 5;
  pet_allowed: boolean;
  acquisition_date: string;
  ownership_status: "owned" | "leased" | "sold" | "inactive";
  rental_status: "available" | "full" | "empty" | "under_maintenance" | "archived";
  notes: string;
};

export type RentRecord = {
  rent_id: string;
  property_id: string;
  tenant_id: string;
  rent_period_start: string;
  rent_period_end: string;
  due_date: string;
  amount_due: number;
  amount_received: number;
  payment_date: string;
  payment_method: string;
  late_fee_amount: number;
  status: "due" | "partial" | "paid" | "late" | "waived";
  notes: string;
};

export type RentalExpense = {
  expense_id: string;
  property_id: string;
  vendor_id: string;
  expense_date: string;
  due_date: string;
  paid_date: string;
  category: "mortgage" | "utilities" | "insurance" | "taxes" | "supplies" | "repairs" | "lawn" | "legal" | "accounting" | "other";
  amount: number;
  payment_method: string;
  receipt_url: string;
  recurring: boolean;
  tax_bucket: string;
  notes: string;
  allocation_property_ids?: string[];
};

export type WorkOrder = {
  work_order_id: string;
  property_id: string;
  unit_or_area: string;
  issue_type: string;
  description: string;
  reported_date: string;
  started_date: string;
  completed_date: string;
  status: "planned" | "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  labor_cost: number;
  material_cost: number;
  total_cost: number;
  vendor_id: string;
  warranty_related: boolean;
  before_photo_urls: string[];
  after_photo_urls: string[];
  receipt_urls: string[];
  expense_id?: string;
  notes: string;
};

export type VehicleProfile = {
  vehicle_id: string;
  vehicle_name: string;
  vehicle_type: "Van" | "Truck" | "Car" | "Motorcycle";
  make: string;
  model: string;
  model_year: string;
  owned_or_leased: "owned" | "leased";
  availability_status: "available" | "unavailable" | "archived";
  in_service_date: string;
  lease_monthly_amount: number;
  start_odometer_year: number;
  end_odometer_year: number;
  notes: string;
};

export type VehicleTrip = {
  trip_id: string;
  vehicle_id: string;
  date: string;
  start_odometer: number;
  end_odometer: number;
  miles: number;
  origin: string;
  destination: string;
  purpose: string;
  property_id: string;
  category: "inspection" | "repair" | "materials" | "lawn" | "admin" | "other";
  business_use: boolean;
  notes: string;
};

export type VehicleExpense = {
  vehicle_expense_id: string;
  vehicle_id: string;
  date: string;
  type: "lease" | "fuel" | "maintenance" | "insurance" | "registration" | "repairs" | "other";
  amount: number;
  receipt_url: string;
  notes: string;
};

export type Vendor = {
  vendor_id: string;
  vendor_name: string;
  company_name: string;
  phone: string;
  email: string;
  address: string;
  service_type: string;
  tax_form_required: boolean;
  notes: string;
};

export type Tenant = {
  tenant_id: string;
  tenant_name: string;
  phone: string;
  email: string;
  property_id: string;
  lease_start: string;
  lease_end: string;
  monthly_rent: number;
  deposit_amount: number;
  status: "active" | "former" | "applicant";
  notes: string;
};

export type RentalDocument = {
  document_id: string;
  linked_record_type: "property" | "rent" | "expense" | "work_order" | "vehicle_trip" | "vehicle_expense" | "vendor" | "tenant";
  linked_record_id: string;
  property_id: string;
  document_type: string;
  file_url: string;
  upload_date: string;
  notes: string;
};

export type MileageRate = {
  tax_year: number;
  business_rate: number;
  source: string;
  source_url: string;
  notes: string;
};

export type RentalBook = {
  properties: RentalProperty[];
  rents: RentRecord[];
  expenses: RentalExpense[];
  workOrders: WorkOrder[];
  vehicles: VehicleProfile[];
  vehicleTrips: VehicleTrip[];
  vehicleExpenses: VehicleExpense[];
  vendors: Vendor[];
  tenants: Tenant[];
  documents: RentalDocument[];
  mileageRates: MileageRate[];
};

export type IconName = "grid" | "clipboard" | "dollar" | "file" | "bell" | "people" | "scan" | "receipt" | "card" | "edit" | "image" | "plus" | "briefcase" | "home";

export type CardCategory = "all" | "rental" | "garage" | "investment" | "customer" | "general";

export type CardAction = "dismiss" | "complete" | "mark-paid" | "view-details" | "silence-month";
