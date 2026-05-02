import type { FormEvent } from "react";
import type { AppView, PaperItem, Quest, Reminder } from "../types";
import { Icon } from "./Icon";

type MoneyRow = {
  label: string;
  value: string;
  trend: string;
  trendTone: "up" | "down" | "neutral";
  icon: Parameters<typeof Icon>[0]["name"];
};

type PulseItem = {
  label: string;
  value: string;
  detail: string;
  view: AppView;
};

type CommandWorkspaceProps = {
  activeReminders: Reminder[];
  commandPulse: PulseItem[];
  moneyRows: MoneyRow[];
  onAddReminder: (event: FormEvent<HTMLFormElement>) => void;
  onReminderChange: (draft: { label: string; due: string; priority: Reminder["priority"] }) => void;
  onToggleReminder: (label: string, quest: string) => void;
  paperQueue: PaperItem[];
  reminderDraft: { label: string; due: string; priority: Reminder["priority"] };
  selectedQuest: Quest;
  setActiveView: (view: AppView) => void;
};

export function CommandWorkspace({
  activeReminders,
  commandPulse,
  moneyRows,
  onAddReminder,
  onReminderChange,
  onToggleReminder,
  paperQueue,
  reminderDraft,
  selectedQuest,
  setActiveView,
}: CommandWorkspaceProps) {
  return (
    <>
      <section className="summary-strip" aria-label="Money summary">
        {moneyRows.map((metric) => (
          <div className="metric" key={metric.label}>
            <span><Icon name={metric.icon} />{metric.label}</span>
            <strong>{metric.value}</strong>
            <small data-trend={metric.trendTone}>{metric.trend}</small>
          </div>
        ))}
      </section>

      <section className="dashboard-grid" id="command">
        <div className="panel panel-large">
          <div className="panel-header">
            <h2>Needs Attention</h2>
            <span>{activeReminders.length} active</span>
          </div>
          <form className="reminder-form" onSubmit={onAddReminder}>
            <input
              aria-label="Reminder label"
              onChange={(event) => onReminderChange({ ...reminderDraft, label: event.target.value })}
              placeholder={`Remind me for ${selectedQuest.name}`}
              value={reminderDraft.label}
            />
            <input
              aria-label="Reminder due"
              onChange={(event) => onReminderChange({ ...reminderDraft, due: event.target.value })}
              placeholder="Due"
              value={reminderDraft.due}
            />
            <select
              aria-label="Reminder priority"
              onChange={(event) => onReminderChange({ ...reminderDraft, priority: event.target.value as Reminder["priority"] })}
              value={reminderDraft.priority}
            >
              <option>Quiet</option>
              <option>Normal</option>
              <option>Important</option>
            </select>
            <button aria-label="Add reminder" type="submit">+</button>
          </form>
          <div className="attention-list">
            {activeReminders.map((reminder) => (
              <article className="attention-item" key={reminder.label}>
                <button className="task-check" onClick={() => onToggleReminder(reminder.label, reminder.quest)} type="button" aria-label={`Complete ${reminder.label}`} />
                <div>
                  <strong>{reminder.label}</strong>
                  <span>{reminder.quest}</span>
                </div>
                <div className="attention-meta">
                  <span>{reminder.due}</span>
                  <b data-priority={reminder.priority}>{reminder.priority}</b>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel" id="paper-trail">
          <div className="panel-header">
            <h2>Paper Trail</h2>
            <span>AI review queue</span>
          </div>
          <div className="paper-list">
            {paperQueue.map((item) => (
              <article className="paper-item" key={item.title}>
                <span className="paper-icon"><Icon name={item.kind === "image" ? "image" : "file"} /></span>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.source}</span>
                </div>
                <div>
                  <b>{item.amount}</b>
                  <span>{item.state}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="command-pulse" aria-label="Workspace pulse">
        {commandPulse.map((item) => (
          <button className="pulse-card" key={item.label} onClick={() => setActiveView(item.view)} type="button">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </button>
        ))}
      </section>
    </>
  );
}
