import type { FormEvent } from "react";
import type { AppView, QuestType } from "../types";
import { questTypePresets } from "../data";
import { Icon } from "./Icon";

type TopbarProps = {
  activeView: AppView;
  onToggleQuestComposer: () => void;
};

export function Topbar({ activeView, onToggleQuestComposer }: TopbarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{activeView}</p>
        <h1>{activeView === "Command" ? "Today's side quests" : `${activeView} workspace`}</h1>
      </div>
      <div className="topbar-actions">
        <button type="button" className="icon-button" aria-label="Scan paper trail"><Icon name="scan" />Scan</button>
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
