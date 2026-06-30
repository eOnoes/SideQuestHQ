/**
 * Client-side API wrapper — replaces localStorage store calls.
 * All functions hit the Next.js API routes which talk to SQLite.
 */

import type {
  Quest,
  Reminder,
  Person,
  Asset,
  InvestmentSnapshot,
  CryptoSnapshot,
} from "../app/types";
import type { ChatMessage, ChatSession } from "./store";

const BASE = "";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

/* ─── Auth ─────────────────────────────────────── */

export async function checkAuth(): Promise<{ loggedIn: boolean; userId?: string }> {
  return api("/api/auth/check");
}

export async function signIn(password: string): Promise<{ success: boolean; name?: string; error?: string }> {
  return api("/api/auth/login", { method: "POST", body: JSON.stringify({ password }) });
}

export async function signOut(): Promise<void> {
  await api("/api/auth/logout", { method: "POST" });
}

/* ─── Quests ───────────────────────────────────── */

export async function getQuests(): Promise<Quest[]> {
  return api("/api/quests");
}

export async function addQuest(quest: Partial<Quest>): Promise<Quest> {
  return api("/api/quests", { method: "POST", body: JSON.stringify(quest) });
}

export async function updateQuest(name: string, patch: Partial<Quest>): Promise<Quest> {
  return api(`/api/quests/${encodeURIComponent(name)}`, { method: "PUT", body: JSON.stringify(patch) });
}

export async function removeQuest(name: string): Promise<void> {
  await api(`/api/quests/${encodeURIComponent(name)}`, { method: "DELETE" });
}

/* ─── Quest Sub-items ──────────────────────────── */

export async function addLedgerEntry(name: string, entry: { label: string; amount: string; state: string }): Promise<{ ledger: Array<{ label: string; amount: string; state: string }> }> {
  return api(`/api/quests/${encodeURIComponent(name)}/ledger`, { method: "POST", body: JSON.stringify(entry) });
}

export async function cycleLedgerState(name: string, index: number): Promise<{ ledger: Array<{ label: string; amount: string; state: string }> }> {
  return api(`/api/quests/${encodeURIComponent(name)}/ledger/${index}`, { method: "PUT" });
}

export async function removeLedgerEntry(name: string, index: number): Promise<{ ledger: Array<{ label: string; amount: string; state: string }> }> {
  return api(`/api/quests/${encodeURIComponent(name)}/ledger/${index}`, { method: "DELETE" });
}

export async function addPaperItem(name: string, item: { label: string; meta: string; state: string }): Promise<{ papers: Array<{ label: string; meta: string; state: string }> }> {
  return api(`/api/quests/${encodeURIComponent(name)}/papers`, { method: "POST", body: JSON.stringify(item) });
}

export async function cyclePaperState(name: string, index: number): Promise<{ papers: Array<{ label: string; meta: string; state: string }> }> {
  return api(`/api/quests/${encodeURIComponent(name)}/papers/${index}`, { method: "PUT" });
}

export async function removePaperItem(name: string, index: number): Promise<{ papers: Array<{ label: string; meta: string; state: string }> }> {
  return api(`/api/quests/${encodeURIComponent(name)}/papers/${index}`, { method: "DELETE" });
}

export async function addNote(name: string, note: string): Promise<{ notes: string[] }> {
  return api(`/api/quests/${encodeURIComponent(name)}/notes`, { method: "POST", body: JSON.stringify({ note }) });
}

export async function removeNote(name: string, index: number): Promise<{ notes: string[] }> {
  return api(`/api/quests/${encodeURIComponent(name)}/notes/${index}`, { method: "DELETE" });
}

export async function advanceStep(name: string, index: number): Promise<{ steps: Array<{ label: string; state: string }> }> {
  return api(`/api/quests/${encodeURIComponent(name)}/steps/${index}`, { method: "PUT" });
}

/* ─── Reminders ────────────────────────────────── */

export async function getReminders(): Promise<Reminder[]> {
  return api("/api/reminders");
}

export async function addReminder(reminder: Reminder): Promise<{ id: number }> {
  return api("/api/reminders", { method: "POST", body: JSON.stringify(reminder) });
}

export async function toggleReminder(id: number): Promise<any> {
  return api(`/api/reminders/${id}`, { method: "PUT" });
}

export async function removeReminder(id: number) {
  return api(`/api/reminders/${id}`, { method: "DELETE" });
}

/* ─── People ───────────────────────────────────── */

export async function getPeople(): Promise<Person[]> {
  return api("/api/people");
}

export async function addPerson(person: Person): Promise<{ id: number }> {
  return api("/api/people", { method: "POST", body: JSON.stringify(person) });
}

export async function cyclePersonStatus(id: number): Promise<any> {
  return api(`/api/people/${id}`, { method: "PUT" });
}

export async function removePerson(id: number) {
  return api(`/api/people/${id}`, { method: "DELETE" });
}

/* ─── Assets ───────────────────────────────────── */

export async function getAssets(): Promise<Asset[]> {
  return api("/api/assets");
}

export async function addAsset(asset: Asset): Promise<{ id: number }> {
  return api("/api/assets", { method: "POST", body: JSON.stringify(asset) });
}

/* ─── Investments & Crypto ─────────────────────── */

export async function getInvestmentSnapshots(): Promise<InvestmentSnapshot[]> {
  return api("/api/investments");
}

export async function getCryptoSnapshots(): Promise<CryptoSnapshot[]> {
  return api("/api/crypto");
}

/* ─── Chat ─────────────────────────────────────── */

export async function getChatMessages(sessionId?: string): Promise<ChatMessage[]> {
  const qs = sessionId ? `?session_id=${sessionId}` : "";
  return api(`/api/chat${qs}`);
}

export async function addChatMessage(role: "user" | "cyony", text: string, sessionId?: string): Promise<ChatMessage> {
  return api("/api/chat", { method: "POST", body: JSON.stringify({ role, text, session_id: sessionId }) });
}

export async function clearChatHistory(sessionId?: string): Promise<void> {
  const qs = sessionId ? `?session_id=${sessionId}` : "";
  await api(`/api/chat${qs}`, { method: "DELETE" });
}

/* ─── Chat Sessions ────────────────────────────── */
/* ─── Vehicles ────────────────────────────────── */

export async function getVehicles(): Promise<any[]> {
  return api("/api/vehicles");
}

export async function addVehicle(vehicle: any): Promise<any> {
  return api("/api/vehicles", { method: "POST", body: JSON.stringify(vehicle) });
}

/* ─── Contacts ────────────────────────────────── */

export async function getContacts(): Promise<any[]> {
  return api("/api/contacts");
}

export async function addContact(contact: any): Promise<any> {
  return api("/api/contacts", { method: "POST", body: JSON.stringify(contact) });
}

/* ─── Properties ──────────────────────────────── */

export async function getProperties(): Promise<any[]> {
  return api("/api/properties");
}

export async function addProperty(property: any): Promise<any> {
  return api("/api/properties", { method: "POST", body: JSON.stringify(property) });
}

/* ─── Global Ledger ────────────────────────────── */

export async function getGlobalLedger(): Promise<any[]> {
  return api("/api/ledger");
}

export async function addLedgerItem(item: any): Promise<any> {
  return api("/api/ledger", { method: "POST", body: JSON.stringify(item) });
}
export async function addGlobalEntry(item: any): Promise<any> {
  return addLedgerItem(item);
}

/* ─── Global Documents ─────────────────────────── */

export async function getGlobalDocuments(): Promise<any[]> {
  return api("/api/documents");
}

export async function addDocument(doc: any): Promise<any> {
  return api("/api/documents", { method: "POST", body: JSON.stringify(doc) });
}
export async function addGlobalDocument(doc: any): Promise<any> {
  return addDocument(doc);
}


export async function getChatSessions(): Promise<ChatSession[]> {
  return api("/api/chat/sessions");
}

export async function createChatSession(title?: string): Promise<ChatSession> {
  return api("/api/chat/sessions", { method: "POST", body: JSON.stringify({ title }) });
}

export async function archiveChatSession(sessionId: string): Promise<void> {
  await api(`/api/chat/sessions/${sessionId}`, { method: "PUT", body: JSON.stringify({ archived: true }) });
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  await api(`/api/chat/sessions/${sessionId}`, { method: "DELETE" });
}

export async function getChatMessagesForSession(sessionId: string): Promise<ChatMessage[]> {
  return api(`/api/chat?session_id=${sessionId}`);
}

export async function searchChatMessages(query: string): Promise<Array<ChatMessage & { session_title: string }>> {
  return api(`/api/chat/search?q=${encodeURIComponent(query)}`);
}

