import {
  ASSETS_STORAGE_KEY,
  PEOPLE_STORAGE_KEY,
  RENTAL_BOOK_STORAGE_KEY,
  REMINDERS_STORAGE_KEY,
  seedAssets,
  seedPeople,
  seedRentalBook,
  seedQuests,
  seedReminders,
  STORAGE_KEY,
} from "./data";
import type { Asset, Person, Quest, Reminder, RentalBook } from "./types";

export type StoredAppData = {
  assets: Asset[];
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
      people: readArray(PEOPLE_STORAGE_KEY, seedPeople),
      quests: readArray(STORAGE_KEY, seedQuests),
      reminders: readArray(REMINDERS_STORAGE_KEY, seedReminders),
      rentalBook: normalizeRentalBook(JSON.parse(window.localStorage.getItem(RENTAL_BOOK_STORAGE_KEY) || "null") ?? seedRentalBook),
    };
  } catch {
    return {
      assets: seedAssets,
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
  };
}

export function saveStoredAppData(data: StoredAppData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.quests));
  window.localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(data.people));
  window.localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(data.reminders));
  window.localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(data.assets));
  window.localStorage.setItem(RENTAL_BOOK_STORAGE_KEY, JSON.stringify(normalizeRentalBook(data.rentalBook)));
}
