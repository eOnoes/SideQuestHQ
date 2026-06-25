"use client";

/**
 * Store — thin client-side cache backed by SQLite API routes.
 * 
 * On app load, fetches data from /api/* and caches it locally.
 * Mutations hit the API first, then update the local cache.
 * Components read from cache (synchronous) and subscribe to changes.
 */

import type {
  Quest,
  Reminder,
  Person,
  Asset,
  InvestmentSnapshot,
  CryptoSnapshot,
  LedgerState,
} from "../app/types";
import * as api from "./api";

/* ─── ChatMessage type (shared with VoiceAgent) ─── */

export type ChatMessage = {
  id: string;
  session_id?: string;
  role: "user" | "scout";
  text: string;
  timestamp: number;
};

export type ChatSession = {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  message_count: number;
  last_message: string | null;
};

/* ─── Cache ────────────────────────────────────── */

let _quests: Quest[] = [];
let _reminders: Reminder[] = [];
let _people: Person[] = [];
let _assets: Asset[] = [];
let _investmentSnapshots: InvestmentSnapshot[] = [];
let _cryptoSnapshots: CryptoSnapshot[] = [];
let _chatMessages: ChatMessage[] = [];
let _loaded = false;

// Listeners for re-render triggers
type Listener = () => void;
const _listeners = new Set<Listener>();

export function subscribe(fn: Listener) {
  _listeners.add(fn);
  return () => { _listeners.delete(fn); };
}

function notify() {
  _listeners.forEach((fn) => fn());
}

/* ─── Initial load ─────────────────────────────── */

export async function loadAll(): Promise<void> {
  try {
    const [q, r, p, a, inv, cry, chat] = await Promise.all([
      api.getQuests(),
      api.getReminders(),
      api.getPeople(),
      api.getAssets(),
      api.getInvestmentSnapshots(),
      api.getCryptoSnapshots(),
      api.getChatMessages(),
    ]);
    _quests = q;
    _reminders = r;
    _people = p;
    _assets = a;
    _investmentSnapshots = inv;
    _cryptoSnapshots = cry;
    _chatMessages = chat;
    _loaded = true;
    notify();
  } catch (e) {
    console.error("Failed to load data from API:", e);
  }
}

export function isLoaded(): boolean {
  return _loaded;
}

/* ─── Quest store ──────────────────────────────── */

export function getQuests(): Quest[] {
  return _quests;
}

export async function addQuest(quest: Omit<Quest, "ledger" | "papers" | "notes" | "steps">): Promise<Quest> {
  const created = await api.addQuest(quest);
  _quests = [created, ..._quests];
  notify();
  return created;
}

export async function updateQuest(name: string, patch: Partial<Quest>): Promise<Quest | null> {
  const updated = await api.updateQuest(name, patch);
  _quests = _quests.map((q) => (q.name === name ? updated : q));
  notify();
  return updated;
}

export async function removeQuest(name: string): Promise<void> {
  await api.removeQuest(name);
  _quests = _quests.filter((q) => q.name !== name);
  notify();
}

/* ─── Quest sub-items ──────────────────────────── */

export async function addLedgerEntry(name: string, entry: { label: string; amount: string; state: LedgerState }): Promise<Quest | null> {
  const res = await api.addLedgerEntry(name, entry);
  const idx = _quests.findIndex((q) => q.name === name);
  if (idx !== -1) {
    _quests = [..._quests.slice(0, idx), { ..._quests[idx], ledger: res.ledger as Quest["ledger"] }, ..._quests.slice(idx + 1)];
    notify();
    return _quests[idx];
  }
  return null;
}

export async function cycleLedgerState(name: string, entryIndex: number): Promise<Quest | null> {
  const res = await api.cycleLedgerState(name, entryIndex);
  const idx = _quests.findIndex((q) => q.name === name);
  if (idx !== -1) {
    _quests = [..._quests.slice(0, idx), { ..._quests[idx], ledger: res.ledger as Quest["ledger"] }, ..._quests.slice(idx + 1)];
    notify();
    return _quests[idx];
  }
  return null;
}

export async function removeLedgerEntry(name: string, entryIndex: number): Promise<Quest | null> {
  const res = await api.removeLedgerEntry(name, entryIndex);
  const idx = _quests.findIndex((q) => q.name === name);
  if (idx !== -1) {
    _quests = [..._quests.slice(0, idx), { ..._quests[idx], ledger: res.ledger as Quest["ledger"] }, ..._quests.slice(idx + 1)];
    notify();
    return _quests[idx];
  }
  return null;
}

export async function addPaperItem(name: string, item: { label: string; meta: string; state: string }): Promise<Quest | null> {
  const res = await api.addPaperItem(name, item);
  const idx = _quests.findIndex((q) => q.name === name);
  if (idx !== -1) {
    _quests = [..._quests.slice(0, idx), { ..._quests[idx], papers: res.papers as Quest["papers"] }, ..._quests.slice(idx + 1)];
    notify();
    return _quests[idx];
  }
  return null;
}

export async function cyclePaperState(name: string, paperIndex: number): Promise<Quest | null> {
  const res = await api.cyclePaperState(name, paperIndex);
  const idx = _quests.findIndex((q) => q.name === name);
  if (idx !== -1) {
    _quests = [..._quests.slice(0, idx), { ..._quests[idx], papers: res.papers as Quest["papers"] }, ..._quests.slice(idx + 1)];
    notify();
    return _quests[idx];
  }
  return null;
}

export async function removePaperItem(name: string, paperIndex: number): Promise<Quest | null> {
  const res = await api.removePaperItem(name, paperIndex);
  const idx = _quests.findIndex((q) => q.name === name);
  if (idx !== -1) {
    _quests = [..._quests.slice(0, idx), { ..._quests[idx], papers: res.papers as Quest["papers"] }, ..._quests.slice(idx + 1)];
    notify();
    return _quests[idx];
  }
  return null;
}

export async function addNote(name: string, note: string): Promise<Quest | null> {
  const res = await api.addNote(name, note);
  const idx = _quests.findIndex((q) => q.name === name);
  if (idx !== -1) {
    _quests = [..._quests.slice(0, idx), { ..._quests[idx], notes: res.notes as string[] }, ..._quests.slice(idx + 1)];
    notify();
    return _quests[idx];
  }
  return null;
}

export async function removeNote(name: string, noteIndex: number): Promise<Quest | null> {
  const res = await api.removeNote(name, noteIndex);
  const idx = _quests.findIndex((q) => q.name === name);
  if (idx !== -1) {
    _quests = [..._quests.slice(0, idx), { ..._quests[idx], notes: res.notes as string[] }, ..._quests.slice(idx + 1)];
    notify();
    return _quests[idx];
  }
  return null;
}

export async function advanceStep(name: string, stepIndex: number): Promise<Quest | null> {
  const res = await api.advanceStep(name, stepIndex);
  const idx = _quests.findIndex((q) => q.name === name);
  if (idx !== -1) {
    _quests = [..._quests.slice(0, idx), { ..._quests[idx], steps: res.steps as Quest["steps"] }, ..._quests.slice(idx + 1)];
    notify();
    return _quests[idx];
  }
  return null;
}

/* ─── Reminder store ───────────────────────────── */

export function getReminders(): Reminder[] {
  return _reminders;
}

export async function addReminder(reminder: Reminder): Promise<void> {
  const created = await api.addReminder(reminder);
  _reminders = [..._reminders, { ...reminder, ...created }];
  notify();
}

export async function toggleReminder(index: number): Promise<void> {
  // Find the reminder by index position — API uses DB id
  const reminder = _reminders[index];
  if (!reminder) return;
  // We need the DB id, but reminders are stored by position
  // For now, use the index as a proxy — the API route handles toggling by id
  // This is a known limitation — will need DB ids exposed
  const updated = [..._reminders];
  updated[index] = { ...updated[index], done: !updated[index].done };
  _reminders = updated;
  notify();
  // Fire and forget API call
  try { await api.toggleReminder(index); } catch { /* revert on error */ }
}

export async function removeReminder(index: number): Promise<void> {
  const old = _reminders;
  _reminders = _reminders.filter((_, i) => i !== index);
  notify();
  try { await api.removeReminder(index); } catch { _reminders = old; notify(); }
}

export function getReminderRows() {
  return _reminders.map((r, i) => {
    const questIndex = _quests.findIndex((q) => q.name === r.quest);
    return { ...r, reminderIndex: i, questIndex };
  });
}

export function getReminderSummary() {
  const active = _reminders.filter((r) => !r.done).length;
  const done = _reminders.filter((r) => r.done).length;
  const important = _reminders.filter((r) => r.priority === "Important" && !r.done).length;
  return { active, done, important };
}

/* ─── People store ─────────────────────────────── */

export function getPeople(): Person[] {
  return _people;
}

export async function addPerson(person: Person): Promise<void> {
  const created = await api.addPerson(person);
  _people = [..._people, { ...person, ...created }];
  notify();
}

export async function cyclePersonStatus(index: number): Promise<void> {
  const old = _people;
  const states: Person["status"][] = ["Active", "Waiting", "Quiet"];
  const current = _people[index];
  if (!current) return;
  const next = states[(states.indexOf(current.status) + 1) % states.length];
  _people = _people.map((p, i) => i === index ? { ...p, status: next } : p);
  notify();
  try { await api.cyclePersonStatus(index); } catch { _people = old; notify(); }
}

export async function removePerson(index: number): Promise<void> {
  const old = _people;
  _people = _people.filter((_, i) => i !== index);
  notify();
  try { await api.removePerson(index); } catch { _people = old; notify(); }
}

export function getPeopleForQuest(questName: string): Person[] {
  return _people.filter((p) => p.quest === questName);
}

/* ─── Asset store ──────────────────────────────── */

export function getAssets(): Asset[] {
  return _assets;
}

export async function addAsset(asset: Asset): Promise<void> {
  const created = await api.addAsset(asset);
  _assets = [..._assets, { ...asset, ...created }];
  notify();
}

/* ─── Investment / Crypto store ────────────────── */

export function getInvestmentSnapshots(): InvestmentSnapshot[] {
  return _investmentSnapshots;
}

export function getCryptoSnapshots(): CryptoSnapshot[] {
  return _cryptoSnapshots;
}

/* ─── Paper trail (global queue) ───────────────── */

export function getPaperTrailQueue() {
  const items: Array<{ title: string; source: string; state: string; amount: string; kind: "image" | "file" }> = [];
  for (const quest of _quests) {
    for (const paper of quest.papers) {
      items.push({
        title: paper.label,
        source: quest.name,
        state: paper.state,
        amount: "",
        kind: paper.meta.toLowerCase().includes("photo") || paper.meta.toLowerCase().includes("image") ? "image" : "file",
      });
    }
  }
  return items;
}

/* ─── Chat history ─────────────────────────────── */

export function getChatMessages(): ChatMessage[] {
  return _chatMessages;
}

export async function addChatMessage(role: ChatMessage["role"], text: string, sessionId?: string): Promise<ChatMessage> {
  const msg = await api.addChatMessage(role, text, sessionId);
  _chatMessages = [..._chatMessages, msg];
  notify();
  return msg;
}

export async function clearChatHistory(): Promise<void> {
  await api.clearChatHistory();
  _chatMessages = [];
  notify();
}

/* ─── Chat sessions ────────────────────────────── */

export async function getChatSessions(): Promise<ChatSession[]> {
  return api.getChatSessions();
}

export async function createChatSession(title?: string): Promise<ChatSession> {
  return api.createChatSession(title);
}

export async function getChatMessagesForSession(sessionId: string): Promise<ChatMessage[]> {
  return api.getChatMessagesForSession(sessionId);
}

export async function searchChatMessages(query: string): Promise<Array<ChatMessage & { session_title: string }>> {
  return api.searchChatMessages(query);
}
