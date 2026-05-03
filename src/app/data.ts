import type { AppView, Asset, IconName, Person, Quest, QuestType, Reminder, RentalBook, StepState } from "./types";

export const STORAGE_KEY = "sidequest-hq:quests:v1";
export const PEOPLE_STORAGE_KEY = "sidequest-hq:people:v1";
export const REMINDERS_STORAGE_KEY = "sidequest-hq:reminders:v1";
export const ASSETS_STORAGE_KEY = "sidequest-hq:assets:v1";
export const RENTAL_BOOK_STORAGE_KEY = "sidequest-hq:rental-book:v1";

export const questTypePresets: Array<{
  type: QuestType;
  owner: string;
  target: string;
  summary: string;
  steps: Array<{ label: string; state: StepState }>;
}> = [
  {
    type: "Rental Property",
    owner: "Rental property",
    target: "Property health",
    summary: "Track rent, repairs, lease docs, reminders, and the people tied to this property.",
    steps: [
      { label: "Property profile", state: "Now" },
      { label: "Rent ledger", state: "Next" },
      { label: "Paper trail", state: "Next" },
    ],
  },
  {
    type: "Customer Build",
    owner: "Customer build",
    target: "Scope and payment lock",
    summary: "Track quote, deposits, customer updates, files, build costs, and delivery steps.",
    steps: [
      { label: "Scope captured", state: "Now" },
      { label: "Quote drafted", state: "Next" },
      { label: "Customer update", state: "Next" },
    ],
  },
  {
    type: "Build Project",
    owner: "Build project",
    target: "Materials and delivery",
    summary: "Track materials, labor, receipts, open balances, and next build actions.",
    steps: [
      { label: "Project created", state: "Done" },
      { label: "Materials tracked", state: "Now" },
      { label: "Final balance", state: "Next" },
    ],
  },
  {
    type: "Investment",
    owner: "Investment",
    target: "Track position notes",
    summary: "Track expected gains, contribution notes, check-ins, and paper trail without finance portal links.",
    steps: [
      { label: "Position noted", state: "Now" },
      { label: "Check-in reminder", state: "Next" },
      { label: "Paper trail", state: "Next" },
    ],
  },
  {
    type: "Personal Plan",
    owner: "Personal plan",
    target: "Keep the plan moving",
    summary: "Track tasks, reminders, notes, and supporting files for a personal goal.",
    steps: [
      { label: "Plan captured", state: "Now" },
      { label: "Next move", state: "Next" },
      { label: "Review date", state: "Next" },
    ],
  },
  {
    type: "Side Quest",
    owner: "Side quest",
    target: "Get it organized",
    summary: "Fresh quest. Add ledger rows, paper trail items, people, reminders, and next steps as the work gets clearer.",
    steps: [
      { label: "Quest created", state: "Done" },
      { label: "First ledger item", state: "Now" },
      { label: "Paper trail", state: "Next" },
    ],
  },
];

export function getQuestTypePreset(type: QuestType) {
  return questTypePresets.find((preset) => preset.type === type) ?? questTypePresets[questTypePresets.length - 1];
}

export const seedQuests: Quest[] = [
  {
    name: "Maple Street Rental",
    type: "Rental Property",
    status: "Active",
    nextMove: "Check rent receipt and schedule gutter inspection.",
    value: "$1,450 expected",
    progress: 75,
    tone: "active",
    owner: "Thomas",
    target: "Monthly rental health",
    due: "Next check: Tomorrow",
    summary: "Rent is expected, inspection is the next move, and this property needs a clean paper trail for maintenance spend.",
    ledger: [
      { label: "May rent", amount: "$1,450", state: "Open" },
      { label: "Gutter quote", amount: "$225", state: "Draft" },
      { label: "April rent", amount: "$1,450", state: "Paid" },
    ],
    papers: [
      { label: "Lease packet", meta: "PDF linked", state: "Filed" },
      { label: "Gutter photos", meta: "3 images", state: "Review" },
    ],
    steps: [
      { label: "Lease stored", state: "Done" },
      { label: "Rent receipt", state: "Now" },
      { label: "Inspection", state: "Next" },
    ],
    notes: ["Ask tenant for receipt screenshot if ACH clears late.", "Bundle gutter photos with quote before approving work."],
  },
  {
    name: "AI Estimate Builder",
    type: "Customer Build",
    status: "Discovery",
    nextMove: "Turn rough notes into milestone quote.",
    value: "$3,200 quoted",
    progress: 30,
    tone: "discovery",
    owner: "Customer build",
    target: "Quote and scope lock",
    due: "Next check: Today 4:00 PM",
    summary: "Needs a clean milestone quote from rough notes, then a customer update before the day closes.",
    ledger: [
      { label: "Discovery deposit", amount: "$500", state: "Paid" },
      { label: "Milestone 1", amount: "$1,200", state: "Draft" },
      { label: "Final delivery", amount: "$1,500", state: "Draft" },
    ],
    papers: [
      { label: "Deposit screenshot", meta: "Image upload", state: "Ready" },
      { label: "Scope notes", meta: "Manual notes", state: "Draft" },
    ],
    steps: [
      { label: "Discovery call", state: "Done" },
      { label: "Milestone quote", state: "Now" },
      { label: "Customer approval", state: "Next" },
    ],
    notes: ["Convert build notes into three clear phases.", "Keep quote friendly but exact: scope, payment points, delivery window."],
  },
  {
    name: "Shop Cabinet Run",
    type: "Build Project",
    status: "In Progress",
    nextMove: "Upload material receipts and confirm final balance.",
    value: "$780 open",
    progress: 60,
    tone: "progress",
    owner: "Personal build",
    target: "Close materials and balance",
    due: "Next check: This week",
    summary: "Materials are mostly known; this needs receipt cleanup and final balance confirmation before calling it done.",
    ledger: [
      { label: "Materials paid", amount: "$826", state: "Paid" },
      { label: "Customer balance", amount: "$780", state: "Open" },
      { label: "Hardware run", amount: "$92", state: "Draft" },
    ],
    papers: [
      { label: "Home Depot receipt", meta: "Photo upload", state: "Review" },
      { label: "Lumber quote", meta: "PDF linked", state: "Filed" },
    ],
    steps: [
      { label: "Design approved", state: "Done" },
      { label: "Receipt review", state: "Now" },
      { label: "Final invoice", state: "Next" },
    ],
    notes: ["Confirm whether hardware is included in current material total.", "Photo scan should create ledger draft, not auto-approve."],
  },
];

export const seedReminders: Reminder[] = [
  { label: "Send Friday customer update", quest: "AI Estimate Builder", due: "Today 4:00 PM", priority: "Important", done: false },
  { label: "Check rent payment", quest: "Maple Street Rental", due: "Tomorrow", priority: "Normal", done: false },
  { label: "Review material costs", quest: "Shop Cabinet Run", due: "This week", priority: "Quiet", done: false },
];

export const seedPeople: Person[] = [
  { name: "Tenant", role: "Maple Street Rental", quest: "Maple Street Rental", nextTouch: "Confirm May receipt", status: "Waiting" },
  { name: "Estimate customer", role: "Decision maker", quest: "AI Estimate Builder", nextTouch: "Friday update", status: "Active" },
  { name: "Lumber desk", role: "Vendor", quest: "Shop Cabinet Run", nextTouch: "Quote match", status: "Quiet" },
];

export const seedAssets: Asset[] = [
  { name: "Maple Street Rental", type: "Rental", value: "$185,000 est.", projected: "$1,450", frequency: "Monthly", status: "Producing" },
  { name: "401k Growth Bucket", type: "Retirement", value: "$0 tracked", projected: "$4,800", frequency: "Annual", status: "Watching" },
  { name: "Friend Business Stake", type: "Business", value: "$2,500 in", projected: "$300", frequency: "Monthly", status: "Planning" },
];

export const seedRentalBook: RentalBook = {
  properties: [
    {
      property_id: "prop-maple-street",
      property_name: "Maple Street Rental",
      street_address: "124 Maple Street",
      city: "Hometown",
      state: "MO",
      zip: "64000",
      acquisition_date: "2022-08-15",
      ownership_status: "owned",
      rental_status: "active",
      notes: "Primary rental profile. Replace seed address with real records before export.",
    },
  ],
  tenants: [
    {
      tenant_id: "tenant-maple-current",
      tenant_name: "Current Tenant",
      phone: "",
      email: "",
      property_id: "prop-maple-street",
      lease_start: "2026-01-01",
      lease_end: "2026-12-31",
      monthly_rent: 1450,
      deposit_amount: 1450,
      status: "active",
      notes: "Seed tenant profile; keep contact data private until ready.",
    },
  ],
  vendors: [
    {
      vendor_id: "vendor-gutter-pro",
      vendor_name: "Gutter Pro",
      company_name: "Gutter Pro",
      phone: "",
      email: "",
      address: "",
      service_type: "repairs",
      tax_form_required: false,
      notes: "Used for gutter inspection quote.",
    },
    {
      vendor_id: "vendor-home-supply",
      vendor_name: "Home Supply Desk",
      company_name: "Home Supply",
      phone: "",
      email: "",
      address: "",
      service_type: "supplies",
      tax_form_required: false,
      notes: "Materials and maintenance supply purchases.",
    },
  ],
  rents: [
    {
      rent_id: "rent-maple-2026-04",
      property_id: "prop-maple-street",
      tenant_id: "tenant-maple-current",
      rent_period_start: "2026-04-01",
      rent_period_end: "2026-04-30",
      due_date: "2026-04-01",
      amount_due: 1450,
      amount_received: 1450,
      payment_date: "2026-04-02",
      payment_method: "ACH",
      late_fee_amount: 0,
      status: "paid",
      notes: "Seed paid rent record.",
    },
    {
      rent_id: "rent-maple-2026-05",
      property_id: "prop-maple-street",
      tenant_id: "tenant-maple-current",
      rent_period_start: "2026-05-01",
      rent_period_end: "2026-05-31",
      due_date: "2026-05-01",
      amount_due: 1450,
      amount_received: 0,
      payment_date: "",
      payment_method: "",
      late_fee_amount: 0,
      status: "due",
      notes: "Current month rent waiting to clear.",
    },
  ],
  expenses: [
    {
      expense_id: "exp-maple-gutter-quote",
      property_id: "prop-maple-street",
      vendor_id: "vendor-gutter-pro",
      expense_date: "2026-05-02",
      due_date: "2026-05-15",
      paid_date: "",
      category: "repairs",
      amount: 225,
      payment_method: "",
      receipt_url: "",
      recurring: false,
      tax_bucket: "Repairs and maintenance",
      notes: "Gutter inspection quote draft.",
    },
    {
      expense_id: "exp-maple-supplies-apr",
      property_id: "prop-maple-street",
      vendor_id: "vendor-home-supply",
      expense_date: "2026-04-22",
      due_date: "2026-04-22",
      paid_date: "2026-04-22",
      category: "supplies",
      amount: 92,
      payment_method: "Card",
      receipt_url: "doc-maple-supply-receipt",
      recurring: false,
      tax_bucket: "Supplies",
      notes: "Small hardware and maintenance supply run.",
    },
  ],
  workOrders: [
    {
      work_order_id: "wo-maple-gutters",
      property_id: "prop-maple-street",
      unit_or_area: "Exterior",
      issue_type: "Gutters",
      description: "Inspect gutters and quote repair or cleaning.",
      reported_date: "2026-05-01",
      started_date: "",
      completed_date: "",
      status: "pending",
      priority: "normal",
      labor_cost: 0,
      material_cost: 0,
      total_cost: 225,
      vendor_id: "vendor-gutter-pro",
      warranty_related: false,
      before_photo_urls: ["doc-maple-gutter-photo"],
      after_photo_urls: [],
      receipt_urls: [],
      expense_id: "exp-maple-gutter-quote",
      notes: "Link quote expense if approved.",
    },
  ],
  vehicles: [
    {
      vehicle_id: "veh-personal-truck",
      vehicle_name: "Personal Truck",
      owned_or_leased: "owned",
      in_service_date: "2026-01-01",
      lease_monthly_amount: 0,
      start_odometer_year: 42000,
      end_odometer_year: 43120,
      notes: "Track rental-business trips separately from personal use.",
    },
  ],
  vehicleTrips: [
    {
      trip_id: "trip-maple-inspection",
      vehicle_id: "veh-personal-truck",
      date: "2026-05-02",
      start_odometer: 43010,
      end_odometer: 43028,
      miles: 18,
      origin: "Home",
      destination: "Maple Street Rental",
      purpose: "Gutter inspection and photos",
      property_id: "prop-maple-street",
      category: "inspection",
      business_use: true,
      notes: "Seed mileage record for property visit.",
    },
  ],
  vehicleExpenses: [
    {
      vehicle_expense_id: "vexp-truck-fuel-may",
      vehicle_id: "veh-personal-truck",
      date: "2026-05-01",
      type: "fuel",
      amount: 55,
      receipt_url: "",
      notes: "Actual expense estimate uses business-use percentage.",
    },
  ],
  documents: [
    {
      document_id: "doc-maple-lease",
      linked_record_type: "tenant",
      linked_record_id: "tenant-maple-current",
      property_id: "prop-maple-street",
      document_type: "lease",
      file_url: "",
      upload_date: "2026-01-01",
      notes: "Lease placeholder.",
    },
    {
      document_id: "doc-maple-gutter-photo",
      linked_record_type: "work_order",
      linked_record_id: "wo-maple-gutters",
      property_id: "prop-maple-street",
      document_type: "photo",
      file_url: "",
      upload_date: "2026-05-02",
      notes: "Before photo placeholder.",
    },
    {
      document_id: "doc-maple-supply-receipt",
      linked_record_type: "expense",
      linked_record_id: "exp-maple-supplies-apr",
      property_id: "prop-maple-street",
      document_type: "receipt",
      file_url: "",
      upload_date: "2026-04-22",
      notes: "Supply receipt placeholder.",
    },
  ],
  mileageRates: [
    {
      tax_year: 2026,
      business_rate: 0.725,
      source: "IRS Notice 2026-10",
      source_url: "https://www.irs.gov/newsroom/irs-sets-2026-business-standard-mileage-rate-at-725-cents-per-mile-up-25-cents",
      notes: "Business standard mileage rate for 2026; keep configurable by tax year.",
    },
    {
      tax_year: 2025,
      business_rate: 0.7,
      source: "IRS standard mileage rates",
      source_url: "https://www.irs.gov/tax-professionals/standard-mileage-rates",
      notes: "Business standard mileage rate for 2025.",
    },
  ],
};

export const appViews: Array<{ label: AppView; icon: IconName }> = [
  { label: "Command", icon: "grid" },
  { label: "Quests", icon: "clipboard" },
  { label: "Assets", icon: "briefcase" },
  { label: "Ledger", icon: "dollar" },
  { label: "Paper Trail", icon: "file" },
  { label: "Reminders", icon: "bell" },
  { label: "People", icon: "people" },
];
