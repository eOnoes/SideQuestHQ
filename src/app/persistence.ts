import {
  ASSETS_STORAGE_KEY,
  INVESTMENT_SNAPSHOTS_STORAGE_KEY,
  PEOPLE_STORAGE_KEY,
  RENTAL_BOOK_STORAGE_KEY,
  REMINDERS_STORAGE_KEY,
  seedAssets,
  seedInvestmentSnapshots,
  seedPeople,
  seedRentalBook,
  seedQuests,
  seedReminders,
  STORAGE_KEY,
} from "./data";
import type { Asset, InvestmentSnapshot, Person, Quest, Reminder, RentalBook } from "./types";

export type StoredAppData = {
  assets: Asset[];
  investmentSnapshots: InvestmentSnapshot[];
  people: Person[];
  quests: Quest[];
  reminders: Reminder[];
  rentalBook: RentalBook;
};

function readArray<T>(key: string, fallback: T[]) {
  const storedValue = window.localStorage.getItem(key);
  if (!storedValue) return fallback;

  const parsedValue = JSON.parse(storedValue) as unknown;
  return Array.isArray(parsedValue) ? (parsedValue as T[]) : fallback;
}

export function loadStoredAppData(): StoredAppData {
  try {
    return {
      assets: readArray(ASSETS_STORAGE_KEY, seedAssets),
      investmentSnapshots: readArray(INVESTMENT_SNAPSHOTS_STORAGE_KEY, seedInvestmentSnapshots),
      people: readArray(PEOPLE_STORAGE_KEY, seedPeople),
      quests: readArray(STORAGE_KEY, seedQuests),
      reminders: readArray(REMINDERS_STORAGE_KEY, seedReminders),
      rentalBook: normalizeRentalBook(JSON.parse(window.localStorage.getItem(RENTAL_BOOK_STORAGE_KEY) || "null") ?? seedRentalBook),
    };
  } catch {
    return {
      assets: seedAssets,
      investmentSnapshots: seedInvestmentSnapshots,
      people: seedPeople,
      quests: seedQuests,
      reminders: seedReminders,
      rentalBook: seedRentalBook,
    };
  }
}

function normalizeRentalBook(rentalBook: RentalBook): RentalBook {
  return {
    ...rentalBook,
    mileageRates: rentalBook.mileageRates?.length ? rentalBook.mileageRates : seedRentalBook.mileageRates,
    properties: rentalBook.properties.map((property) => ({
      ...property,
      pet_allowed: property.pet_allowed ?? false,
      rent_type: property.rent_type ?? "House",
      rental_status: normalizeRentalStatus(property.rental_status),
      rooms: property.rooms ?? 0,
    })),
    vehicles: rentalBook.vehicles.map((vehicle) => ({
      ...vehicle,
      availability_status: vehicle.availability_status ?? "available",
      make: vehicle.make ?? "",
      model: vehicle.model ?? "",
      model_year: vehicle.model_year ?? "",
      vehicle_type: vehicle.vehicle_type ?? "Car",
    })),
  };
}

function normalizeRentalStatus(status: RentalBook["properties"][number]["rental_status"] | "active" | "vacant" | "maintenance" | "planned" | "inactive") {
  if (status === "active") return "full";
  if (status === "vacant" || status === "planned" || status === "inactive") return "empty";
  if (status === "maintenance") return "under_maintenance";
  return status;
}

export function saveStoredAppData(data: StoredAppData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.quests));
  window.localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(data.people));
  window.localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(data.reminders));
  window.localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(data.assets));
  window.localStorage.setItem(INVESTMENT_SNAPSHOTS_STORAGE_KEY, JSON.stringify(data.investmentSnapshots));
  window.localStorage.setItem(RENTAL_BOOK_STORAGE_KEY, JSON.stringify(normalizeRentalBook(data.rentalBook)));
}
