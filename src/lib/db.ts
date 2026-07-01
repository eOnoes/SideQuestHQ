import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "sqhq.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  const defaultPasswordHash = bcrypt.hashSync("hualslx", 12);

  db.exec(`
    -- Users (single-user app, but future-proof)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT 'Eddie',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Sessions (iron-session handles cookies, but we track active sessions)
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );

    -- Quests
    CREATE TABLE IF NOT EXISTS quests (
      name TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT '',
      next_move TEXT NOT NULL DEFAULT '',
      value TEXT NOT NULL DEFAULT '$0',
      progress INTEGER NOT NULL DEFAULT 0,
      tone TEXT NOT NULL DEFAULT 'discovery',
      owner TEXT NOT NULL DEFAULT '',
      target TEXT NOT NULL DEFAULT '',
      due TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      ledger_json TEXT NOT NULL DEFAULT '[]',
      papers_json TEXT NOT NULL DEFAULT '[]',
      steps_json TEXT NOT NULL DEFAULT '[]',
      notes_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Reminders
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      quest TEXT NOT NULL DEFAULT '',
      due TEXT NOT NULL DEFAULT '',
      priority TEXT NOT NULL DEFAULT 'Normal',
      done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- People
    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT '',
      quest TEXT NOT NULL DEFAULT '',
      next_touch TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Assets
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'Other',
      value TEXT NOT NULL DEFAULT '$0',
      projected TEXT NOT NULL DEFAULT '',
      frequency TEXT NOT NULL DEFAULT 'One-time',
      status TEXT NOT NULL DEFAULT 'Planning',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Investment snapshots
    CREATE TABLE IF NOT EXISTS investment_snapshots (
      snapshot_id TEXT PRIMARY KEY,
      asset_name TEXT NOT NULL DEFAULT '',
      account_name TEXT NOT NULL DEFAULT '',
      holding_name TEXT NOT NULL DEFAULT '',
      ticker TEXT NOT NULL DEFAULT '',
      snapshot_date TEXT NOT NULL DEFAULT '',
      current_value REAL NOT NULL DEFAULT 0,
      contributions_to_date REAL NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT ''
    );

    -- Crypto snapshots
    CREATE TABLE IF NOT EXISTS crypto_snapshots (
      snapshot_id TEXT PRIMARY KEY,
      wallet_label TEXT NOT NULL DEFAULT '',
      token_name TEXT NOT NULL DEFAULT '',
      token_symbol TEXT NOT NULL DEFAULT '',
      token_count REAL NOT NULL DEFAULT 0,
      current_value REAL NOT NULL DEFAULT 0,
      snapshot_date TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT ''
    );

    -- Chat sessions
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'New Chat',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      archived INTEGER NOT NULL DEFAULT 0
    );

    -- Chat messages (now session-aware)
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL DEFAULT 'default',
      role TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Rental properties
    CREATE TABLE IF NOT EXISTS rental_properties (
      property_id TEXT PRIMARY KEY,
      property_name TEXT NOT NULL DEFAULT '',
      street_address TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      state TEXT NOT NULL DEFAULT '',
      zip TEXT NOT NULL DEFAULT '',
      rent_type TEXT NOT NULL DEFAULT 'House',
      rooms INTEGER NOT NULL DEFAULT 0,
      pet_allowed INTEGER NOT NULL DEFAULT 0,
      acquisition_date TEXT NOT NULL DEFAULT '',
      ownership_status TEXT NOT NULL DEFAULT 'owned',
      rental_status TEXT NOT NULL DEFAULT 'available',
      notes TEXT NOT NULL DEFAULT ''
    );

    -- Tenants
    CREATE TABLE IF NOT EXISTS tenants (
      tenant_id TEXT PRIMARY KEY,
      tenant_name TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      property_id TEXT NOT NULL DEFAULT '',
      lease_start TEXT NOT NULL DEFAULT '',
      lease_end TEXT NOT NULL DEFAULT '',
      monthly_rent REAL NOT NULL DEFAULT 0,
      deposit_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT NOT NULL DEFAULT ''
    );

    -- Rent records
    CREATE TABLE IF NOT EXISTS rent_records (
      rent_id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL DEFAULT '',
      tenant_id TEXT NOT NULL DEFAULT '',
      rent_period_start TEXT NOT NULL DEFAULT '',
      rent_period_end TEXT NOT NULL DEFAULT '',
      due_date TEXT NOT NULL DEFAULT '',
      amount_due REAL NOT NULL DEFAULT 0,
      amount_received REAL NOT NULL DEFAULT 0,
      payment_date TEXT NOT NULL DEFAULT '',
      payment_method TEXT NOT NULL DEFAULT '',
      late_fee_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'due',
      notes TEXT NOT NULL DEFAULT ''
    );

    -- Rental expenses
    CREATE TABLE IF NOT EXISTS rental_expenses (
      expense_id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL DEFAULT '',
      vendor_id TEXT NOT NULL DEFAULT '',
      expense_date TEXT NOT NULL DEFAULT '',
      due_date TEXT NOT NULL DEFAULT '',
      paid_date TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'other',
      amount REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT '',
      receipt_url TEXT NOT NULL DEFAULT '',
      recurring INTEGER NOT NULL DEFAULT 0,
      tax_bucket TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      allocation_property_ids_json TEXT NOT NULL DEFAULT '[]'
    );

    -- Work orders
    CREATE TABLE IF NOT EXISTS work_orders (
      work_order_id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL DEFAULT '',
      unit_or_area TEXT NOT NULL DEFAULT '',
      issue_type TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      reported_date TEXT NOT NULL DEFAULT '',
      started_date TEXT NOT NULL DEFAULT '',
      completed_date TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'planned',
      priority TEXT NOT NULL DEFAULT 'normal',
      labor_cost REAL NOT NULL DEFAULT 0,
      material_cost REAL NOT NULL DEFAULT 0,
      total_cost REAL NOT NULL DEFAULT 0,
      vendor_id TEXT NOT NULL DEFAULT '',
      warranty_related INTEGER NOT NULL DEFAULT 0,
      before_photo_urls_json TEXT NOT NULL DEFAULT '[]',
      after_photo_urls_json TEXT NOT NULL DEFAULT '[]',
      receipt_urls_json TEXT NOT NULL DEFAULT '[]',
      expense_id TEXT,
      notes TEXT NOT NULL DEFAULT ''
    );

    -- Vehicles
    CREATE TABLE IF NOT EXISTS vehicles (
      vehicle_id TEXT PRIMARY KEY,
      vehicle_name TEXT NOT NULL DEFAULT '',
      vehicle_type TEXT NOT NULL DEFAULT 'Car',
      make TEXT NOT NULL DEFAULT '',
      model TEXT NOT NULL DEFAULT '',
      model_year TEXT NOT NULL DEFAULT '',
      owned_or_leased TEXT NOT NULL DEFAULT 'owned',
      availability_status TEXT NOT NULL DEFAULT 'available',
      in_service_date TEXT NOT NULL DEFAULT '',
      lease_monthly_amount REAL NOT NULL DEFAULT 0,
      start_odometer_year INTEGER NOT NULL DEFAULT 0,
      end_odometer_year INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT ''
    );

    -- Vehicle trips
    CREATE TABLE IF NOT EXISTS vehicle_trips (
      trip_id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL DEFAULT '',
      start_odometer INTEGER NOT NULL DEFAULT 0,
      end_odometer INTEGER NOT NULL DEFAULT 0,
      miles INTEGER NOT NULL DEFAULT 0,
      origin TEXT NOT NULL DEFAULT '',
      destination TEXT NOT NULL DEFAULT '',
      purpose TEXT NOT NULL DEFAULT '',
      property_id TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'other',
      business_use INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT ''
    );

    -- Vehicle expenses
    CREATE TABLE IF NOT EXISTS vehicle_expenses (
      vehicle_expense_id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'other',
      amount REAL NOT NULL DEFAULT 0,
      receipt_url TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT ''
    );

    -- Vendors
    CREATE TABLE IF NOT EXISTS vendors (
      vendor_id TEXT PRIMARY KEY,
      vendor_name TEXT NOT NULL DEFAULT '',
      company_name TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      service_type TEXT NOT NULL DEFAULT '',
      tax_form_required INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT ''
    );

    -- Rental documents
    CREATE TABLE IF NOT EXISTS rental_documents (
      document_id TEXT PRIMARY KEY,
      linked_record_type TEXT NOT NULL DEFAULT '',
      linked_record_id TEXT NOT NULL DEFAULT '',
      property_id TEXT NOT NULL DEFAULT '',
      document_type TEXT NOT NULL DEFAULT '',
      file_url TEXT NOT NULL DEFAULT '',
      upload_date TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT ''
    );

    -- Mileage rates
    CREATE TABLE IF NOT EXISTS mileage_rates (
      tax_year INTEGER PRIMARY KEY,
      business_rate REAL NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT '',
      source_url TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT ''
    );

    -- Snooze log (Cyony accountability)
    CREATE TABLE IF NOT EXISTS snooze_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reminder_label TEXT NOT NULL,
      reminder_quest TEXT NOT NULL DEFAULT '',
      snoozed_at TEXT NOT NULL DEFAULT (datetime('now')),
      acknowledged INTEGER NOT NULL DEFAULT 0
    );

    -- Contacts (Connects workspace)
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_type TEXT NOT NULL DEFAULT 'cell',
      phone TEXT NOT NULL DEFAULT '',
      relation TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'general',
      subcategory TEXT NOT NULL DEFAULT '',
      bar_color TEXT NOT NULL DEFAULT 'green',
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Global Ledger (Ledger workspace)
    CREATE TABLE IF NOT EXISTS global_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      amount TEXT NOT NULL DEFAULT '$0',
      date TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'neutral',
      section TEXT NOT NULL DEFAULT 'uncategorized',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Global Documents (Paper Trail workspace)
    CREATE TABLE IF NOT EXISTS global_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      amount TEXT NOT NULL DEFAULT '$0',
      date TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'uncategorized',
      badge TEXT NOT NULL DEFAULT 'manual',
      badge_color TEXT NOT NULL DEFAULT 'manual',
      receipt_url TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Seed default user if not exists
    -- bcrypt hash of 'hualslx' (cost 12)
    INSERT INTO users (id, password_hash, name)
    VALUES ('eddie', '${defaultPasswordHash}', 'Eddie')
    ON CONFLICT(id) DO UPDATE SET password_hash = excluded.password_hash;
  `);
}

// Helper: JSON parse with fallback
export function jsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// Helper: generate IDs
let _counter = Date.now();
export function uid(prefix = "sq"): string {
  return `${prefix}-${++_counter}-${Math.random().toString(36).slice(2, 7)}`;
}
