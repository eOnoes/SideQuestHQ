"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { Reminder } from "@/app/types";

type ReminderDisplay = Reminder & {
  id: number;
  title: string;
  recurrence: "one-time" | "weekly" | "monthly" | "annually";
  barColor: "green" | "yellow" | "red";
};

function parseDue(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDue(value: string) {
  const date = parseDue(value);
  if (!date) return value || "--";
  return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" });
}

function mapReminder(reminder: Reminder, index: number): ReminderDisplay {
  const due = parseDue(reminder.due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const barColor = reminder.done ? "green" : due && due < today ? "red" : "yellow";
  return {
    ...reminder,
    id: reminder.id ?? index,
    title: reminder.label || "Untitled reminder",
    recurrence: reminder.recurrence || "one-time",
    barColor,
  };
}

export function RemindersWorkspace({ onBack }: { onBack: () => void }) {
  const [reminders, setReminders] = useState<ReminderDisplay[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    due: "",
    recurrence: "one-time" as ReminderDisplay["recurrence"],
    priority: "Normal" as Reminder["priority"],
  });

  useEffect(() => { loadReminders(); }, []);

  async function loadReminders() {
    try {
      const data = await api.getReminders();
      const mapped = data.map(mapReminder).sort((a, b) => (a.due || "").localeCompare(b.due || ""));
      setReminders(mapped);
    } catch (e) {
      console.error("Failed to load reminders:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!form.title) return;
    try {
      await api.addReminder({
        label: form.title,
        quest: "",
        due: form.due,
        recurrence: form.recurrence,
        priority: form.priority,
        done: false,
      });
      setForm({ title: "", due: "", recurrence: "one-time", priority: "Normal" });
      setShowForm(false);
      setLoading(true);
      await loadReminders();
    } catch (e) {
      console.error("Failed to add reminder:", e);
    }
  }

  async function markComplete(id: number) {
    try {
      await api.toggleReminder(id);
      setLoading(true);
      await loadReminders();
    } catch (e) {
      console.error("Failed to update reminder:", e);
    }
  }

  return (
    <div className="workspace-page single-header">
      <div className="workspace-header">
        <div className="workspace-header-row">
          <button className="workspace-back" onClick={onBack} type="button">«</button>
          <div className="workspace-title-row">
            <span className="workspace-title">Reminders</span>
          </div>
          <button className="workspace-add-btn" onClick={() => setShowForm((open) => !open)} type="button">
            {showForm ? "✕ Close" : "+ Add"}
          </button>
        </div>
      </div>

      <div className="workspace-scroll">
        {showForm && (
          <div className="add-form">
            <input className="form-input" placeholder="Title / description" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="form-input" type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
            <div className="form-row-split">
              <select className="form-input" value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value as ReminderDisplay["recurrence"] })}>
                <option value="one-time">One-time</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="annually">Annually</option>
              </select>
              <select className="form-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Reminder["priority"] })}>
                <option value="Quiet">Quiet</option>
                <option value="Normal">Normal</option>
                <option value="Important">Important</option>
              </select>
            </div>
            <button className="form-submit" onClick={handleAdd} type="button">Save Reminder</button>
          </div>
        )}

        {loading ? (
          <div className="workspace-loading">loading...</div>
        ) : reminders.length === 0 ? (
          <div className="workspace-empty">no reminders yet</div>
        ) : (
          <div className="reminder-stack">
            {reminders.map((reminder) => {
              const cardId = String(reminder.id);
              const isOpen = expanded === cardId;
              return (
                <div key={cardId} className={`reminder-card card-cut${isOpen ? " expanded" : ""}`} onClick={() => setExpanded(isOpen ? null : cardId)}>
                  <div className={`reminder-bar ${reminder.barColor}`} />
                  <div className="reminder-header-row">
                    <div className="reminder-info">
                      <div className="reminder-title">{reminder.title}</div>
                      <div className="reminder-detail">{reminder.priority}</div>
                    </div>
                    <div className="reminder-right">
                      <span className="reminder-date">{formatDue(reminder.due)}</span>
                      <span className={`pill ${reminder.done ? "green" : reminder.barColor}`}>{reminder.recurrence.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="reminder-details">
                    {[
                      ["title", reminder.title],
                      ["due", formatDue(reminder.due)],
                      ["recurrence", reminder.recurrence],
                      ["priority", reminder.priority],
                      ["linked asset", reminder.quest || "—"],
                      ["status", reminder.done ? "completed" : "open"],
                    ].map(([key, val]) => (
                      <div key={key} className="reminder-detail-row">
                        <span className="detail-key">{key}</span>
                        <span className="detail-val">{val}</span>
                      </div>
                    ))}
                    <div className="reminder-actions">
                      <button className="reminder-action-btn" onClick={(e) => { e.stopPropagation(); markComplete(reminder.id); }} type="button">
                        {reminder.done ? "Reopen" : "Mark Complete"}
                      </button>
                      <button className="reminder-action-btn" onClick={(e) => e.stopPropagation()} type="button">Snooze</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
