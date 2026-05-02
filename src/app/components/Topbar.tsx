import type { FormEvent } from "react";
import type { AppView, Quest, QuestType } from "../types";
import { questTypePresets } from "../data";
import { Icon } from "./Icon";

type TopbarProps = {
  activeView: AppView;
  onToggleScanIntake: () => void;
  onToggleQuestComposer: () => void;
};

export function Topbar({ activeView, onToggleQuestComposer, onToggleScanIntake }: TopbarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{activeView}</p>
        <h1>{activeView === "Command" ? "Today's side quests" : `${activeView} workspace`}</h1>
      </div>
      <div className="topbar-actions">
        <button type="button" className="icon-button" aria-label="Scan paper trail" onClick={onToggleScanIntake}><Icon name="scan" />Scan</button>
        <button type="button" className="primary-button" onClick={onToggleQuestComposer}>New Quest</button>
      </div>
    </header>
  );
}

type QuestComposerProps = {
  draft: { name: string; type: QuestType; value: string; due: string };
  onChange: (draft: { name: string; type: QuestType; value: string; due: string }) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function QuestComposer({ draft, onChange, onSubmit }: QuestComposerProps) {
  return (
    <form className="quest-composer" onSubmit={onSubmit}>
      <input
        aria-label="Quest name"
        onChange={(event) => onChange({ ...draft, name: event.target.value })}
        placeholder="Quest name"
        value={draft.name}
      />
      <select
        aria-label="Quest type"
        onChange={(event) => onChange({ ...draft, type: event.target.value as QuestType })}
        value={draft.type}
      >
        {questTypePresets.map((preset) => (
          <option key={preset.type}>{preset.type}</option>
        ))}
      </select>
      <input
        aria-label="Tracked value"
        onChange={(event) => onChange({ ...draft, value: event.target.value })}
        placeholder="$0 tracked"
        value={draft.value}
      />
      <input
        aria-label="Next check"
        onChange={(event) => onChange({ ...draft, due: event.target.value })}
        placeholder="Next check"
        value={draft.due}
      />
      <button type="submit">Add</button>
    </form>
  );
}

export type ScanDraft = {
  amount: string;
  fileName: string;
  label: string;
  notes: string;
  questIndex: number;
  source: "Receipt" | "Photo" | "PDF" | "Screenshot";
  state: "Review" | "Ready" | "Filed" | "Draft";
};

type ScanIntakeProps = {
  draft: ScanDraft;
  onChange: (draft: ScanDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  questList: Quest[];
};

export function ScanIntake({ draft, onChange, onSubmit, questList }: ScanIntakeProps) {
  return (
    <form className="scan-intake" onSubmit={onSubmit}>
      <div className="scan-intake-head">
        <span><Icon name="scan" />Paper intake</span>
        <strong>{draft.amount.trim() || "No amount"}</strong>
      </div>
      <select
        aria-label="Scan quest"
        onChange={(event) => onChange({ ...draft, questIndex: Number(event.target.value) })}
        value={draft.questIndex}
      >
        {questList.map((quest, index) => (
          <option key={quest.name} value={index}>{quest.name}</option>
        ))}
      </select>
      <input
        aria-label="Scan label"
        onChange={(event) => onChange({ ...draft, label: event.target.value })}
        placeholder="Receipt/photo label"
        value={draft.label}
      />
      <select
        aria-label="Scan source"
        onChange={(event) => onChange({ ...draft, source: event.target.value as ScanDraft["source"] })}
        value={draft.source}
      >
        <option>Receipt</option>
        <option>Photo</option>
        <option>PDF</option>
        <option>Screenshot</option>
      </select>
      <input
        aria-label="Scan amount"
        onChange={(event) => onChange({ ...draft, amount: event.target.value })}
        placeholder="$0 optional"
        value={draft.amount}
      />
      <select
        aria-label="Scan state"
        onChange={(event) => onChange({ ...draft, state: event.target.value as ScanDraft["state"] })}
        value={draft.state}
      >
        <option>Review</option>
        <option>Ready</option>
        <option>Filed</option>
        <option>Draft</option>
      </select>
      <input
        aria-label="Scan file name"
        onChange={(event) => onChange({ ...draft, fileName: event.target.value })}
        placeholder="File name optional"
        value={draft.fileName}
      />
      <input
        aria-label="Scan notes"
        onChange={(event) => onChange({ ...draft, notes: event.target.value })}
        placeholder="Notes optional"
        value={draft.notes}
      />
      <button type="submit">File</button>
    </form>
  );
}
