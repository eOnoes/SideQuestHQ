import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Quest, Reminder } from "../types";

type ReminderRow = Reminder & {
  reminderIndex: number;
  questIndex: number;
};

type ReminderDraft = {
  label: string;
  due: string;
  priority: Reminder["priority"];
};

type RemindersWorkspaceProps = {
  draft: ReminderDraft;
  onAddReminder: (event: FormEvent<HTMLFormElement>) => void;
  onDraftChange: Dispatch<SetStateAction<ReminderDraft>>;
  onOpenQuest: (questIndex: number) => void;
  onRemoveReminder: (reminderIndex: number) => void;
  onSelectedQuestIndexChange: (questIndex: number) => void;
  onToggleReminder: (reminderIndex: number) => void;
  questList: Quest[];
  reminderRows: ReminderRow[];
  reminderSummary: {
    active: number;
    done: number;
    important: number;
  };
  selectedQuestIndex: number;
};

export function RemindersWorkspace({
  draft,
  onAddReminder,
  onDraftChange,
  onOpenQuest,
  onRemoveReminder,
  onSelectedQuestIndexChange,
  onToggleReminder,
  questList,
  reminderRows,
  reminderSummary,
  selectedQuestIndex,
}: RemindersWorkspaceProps) {
  return (
    <section className="reminders-workspace panel">
      <div className="panel-header">
        <h2>Reminders</h2>
        <span>{reminderSummary.active} active</span>
      </div>

      <div className="reminders-board">
        <form className="reminders-workspace-form" onSubmit={onAddReminder}>
          <select
            aria-label="Reminder quest"
            onChange={(event) => onSelectedQuestIndexChange(Number(event.target.value))}
            value={selectedQuestIndex}
          >
            {questList.map((quest, index) => (
              <option key={quest.name} value={index}>{quest.name}</option>
            ))}
          </select>
          <input
            aria-label="Reminder label"
            onChange={(event) => onDraftChange((currentDraft) => ({ ...currentDraft, label: event.target.value }))}
            placeholder="Reminder"
            value={draft.label}
          />
          <input
            aria-label="Reminder due"
            onChange={(event) => onDraftChange((currentDraft) => ({ ...currentDraft, due: event.target.value }))}
            placeholder="Due"
            value={draft.due}
          />
          <select
            aria-label="Reminder priority"
            onChange={(event) => onDraftChange((currentDraft) => ({ ...currentDraft, priority: event.target.value as Reminder["priority"] }))}
            value={draft.priority}
          >
            <option>Quiet</option>
            <option>Normal</option>
            <option>Important</option>
          </select>
          <button type="submit">Add</button>
        </form>

        <div className="reminder-total-strip">
          <div>
            <span>Important</span>
            <strong>{reminderSummary.important}</strong>
          </div>
          <div>
            <span>Active</span>
            <strong>{reminderSummary.active}</strong>
          </div>
          <div>
            <span>Done</span>
            <strong>{reminderSummary.done}</strong>
          </div>
        </div>

        <div className="reminder-workspace-list">
          {reminderRows.map((reminder) => (
            <article className="reminder-workspace-row" data-done={reminder.done} key={`${reminder.quest}-${reminder.label}-${reminder.reminderIndex}`}>
              <button className="task-check" onClick={() => onToggleReminder(reminder.reminderIndex)} type="button" aria-label={`${reminder.done ? "Reopen" : "Complete"} ${reminder.label}`} />
              <div>
                <span>{reminder.quest}</span>
                <strong>{reminder.label}</strong>
              </div>
              <div>
                <span>{reminder.due}</span>
                <strong data-priority={reminder.priority}>{reminder.priority}</strong>
              </div>
              <button data-state={reminder.done ? "Done" : "Open"} onClick={() => onToggleReminder(reminder.reminderIndex)} type="button">{reminder.done ? "Done" : "Open"}</button>
              <button className="open-quest-button" onClick={() => onOpenQuest(reminder.questIndex)} type="button">Open Quest</button>
              <button className="remove-reminder-button" onClick={() => onRemoveReminder(reminder.reminderIndex)} type="button" aria-label={`Remove ${reminder.label}`}>Remove</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
