import type { FormEvent } from "react";
import type { Quest } from "../types";
import { Icon } from "./Icon";

export type PaperRow = {
  kind: "image" | "file";
  label: string;
  meta: string;
  paperIndex: number;
  questIndex: number;
  questName: string;
  questType: string;
  state: string;
};

type PaperTrailWorkspaceProps = {
  draft: { label: string; meta: string; state: string };
  onAddPaperItem: (event: FormEvent<HTMLFormElement>) => void;
  onCyclePaperState: (questIndex: number, paperIndex: number) => void;
  onDraftChange: (draft: { label: string; meta: string; state: string }) => void;
  onOpenQuest: (questIndex: number) => void;
  onRemovePaperItem: (questIndex: number, paperIndex: number) => void;
  paperRows: PaperRow[];
  paperSummary: { filedCount: number; readyCount: number; reviewCount: number };
  questList: Quest[];
  selectedQuestIndex: number;
  setSelectedQuestIndex: (index: number) => void;
};

export function PaperTrailWorkspace({
  draft,
  onAddPaperItem,
  onCyclePaperState,
  onDraftChange,
  onOpenQuest,
  onRemovePaperItem,
  paperRows,
  paperSummary,
  questList,
  selectedQuestIndex,
  setSelectedQuestIndex,
}: PaperTrailWorkspaceProps) {
  return (
    <section className="paper-workspace panel">
      <div className="panel-header">
        <h2>Paper Trail</h2>
        <span>{paperRows.length} items</span>
      </div>

      <div className="paper-board">
        <form className="paper-form" onSubmit={onAddPaperItem}>
          <select
            aria-label="Paper trail quest"
            onChange={(event) => setSelectedQuestIndex(Number(event.target.value))}
            value={selectedQuestIndex}
          >
            {questList.map((quest, index) => (
              <option key={quest.name} value={index}>{quest.name}</option>
            ))}
          </select>
          <input
            aria-label="Paper trail label"
            onChange={(event) => onDraftChange({ ...draft, label: event.target.value })}
            placeholder="Receipt, photo, PDF..."
            value={draft.label}
          />
          <input
            aria-label="Paper trail meta"
            onChange={(event) => onDraftChange({ ...draft, meta: event.target.value })}
            placeholder="Photo, PDF, screenshot..."
            value={draft.meta}
          />
          <select
            aria-label="Paper trail state"
            onChange={(event) => onDraftChange({ ...draft, state: event.target.value })}
            value={draft.state}
          >
            <option>Review</option>
            <option>Ready</option>
            <option>Filed</option>
            <option>Draft</option>
          </select>
          <button type="submit">Add</button>
        </form>

        <div className="paper-total-strip">
          <div>
            <span>Needs review</span>
            <strong>{paperSummary.reviewCount}</strong>
          </div>
          <div>
            <span>Ready</span>
            <strong>{paperSummary.readyCount}</strong>
          </div>
          <div>
            <span>Filed</span>
            <strong>{paperSummary.filedCount}</strong>
          </div>
        </div>

        <div className="paper-workspace-list">
          {paperRows.map((paper) => (
            <article className="paper-workspace-row" key={`${paper.questName}-${paper.label}-${paper.paperIndex}`}>
              <span className="paper-icon"><Icon name={paper.kind === "image" ? "image" : "file"} /></span>
              <div>
                <span>{paper.questType}</span>
                <strong>{paper.questName}</strong>
              </div>
              <div>
                <span>{paper.label}</span>
                <strong>{paper.meta}</strong>
              </div>
              <button data-state={paper.state} onClick={() => onCyclePaperState(paper.questIndex, paper.paperIndex)} type="button">{paper.state}</button>
              <button className="open-quest-button" onClick={() => onOpenQuest(paper.questIndex)} type="button">Open Quest</button>
              <button className="remove-paper-button" onClick={() => onRemovePaperItem(paper.questIndex, paper.paperIndex)} type="button" aria-label={`Remove ${paper.label}`}>Remove</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
