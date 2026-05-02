import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { LedgerState, Person, Quest } from "../types";

type LedgerDraft = {
  label: string;
  amount: string;
  state: LedgerState;
};

type PaperDraft = {
  label: string;
  meta: string;
  state: string;
};

type PersonDraft = {
  name: string;
  role: string;
  nextTouch: string;
};

type QuestWorkspaceProps = {
  ledgerDraft: LedgerDraft;
  noteDraft: string;
  onAddLedgerEntry: (event: FormEvent<HTMLFormElement>) => void;
  onAddNote: (event: FormEvent<HTMLFormElement>) => void;
  onAddPaperItem: (event: FormEvent<HTMLFormElement>) => void;
  onAddPerson: (event: FormEvent<HTMLFormElement>) => void;
  onAdvanceStep: (stepIndex: number) => void;
  onCycleLedgerState: (entryIndex: number) => void;
  onCyclePaperState: (paperIndex: number) => void;
  onCyclePersonStatus: (personIndex: number) => void;
  onLedgerDraftChange: Dispatch<SetStateAction<LedgerDraft>>;
  onNoteDraftChange: Dispatch<SetStateAction<string>>;
  onPaperDraftChange: Dispatch<SetStateAction<PaperDraft>>;
  onPersonDraftChange: Dispatch<SetStateAction<PersonDraft>>;
  onRemovePaperItem: (paperIndex: number) => void;
  onRemovePerson: (personIndex: number) => void;
  onSelectedQuestIndexChange: (questIndex: number) => void;
  paperDraft: PaperDraft;
  personDraft: PersonDraft;
  questList: Quest[];
  selectedPeople: Person[];
  selectedQuest: Quest;
  selectedQuestIndex: number;
};

export function QuestWorkspace({
  ledgerDraft,
  noteDraft,
  onAddLedgerEntry,
  onAddNote,
  onAddPaperItem,
  onAddPerson,
  onAdvanceStep,
  onCycleLedgerState,
  onCyclePaperState,
  onCyclePersonStatus,
  onLedgerDraftChange,
  onNoteDraftChange,
  onPaperDraftChange,
  onPersonDraftChange,
  onRemovePaperItem,
  onRemovePerson,
  onSelectedQuestIndexChange,
  paperDraft,
  personDraft,
  questList,
  selectedPeople,
  selectedQuest,
  selectedQuestIndex,
}: QuestWorkspaceProps) {
  return (
    <section className="quest-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Active Quests</p>
          <h2>Work, rentals, builds, investments</h2>
        </div>
        <button type="button" className="ghost-button">View All</button>
      </div>

      <div className="quest-focus-grid">
        <div className="quest-picker" aria-label="Quest selector">
          {questList.map((quest, index) => (
            <button
              className="quest-card"
              data-selected={index === selectedQuestIndex}
              key={quest.name}
              onClick={() => onSelectedQuestIndexChange(index)}
              type="button"
            >
              <div className="quest-card-top">
                <span>{quest.type}</span>
                <b data-status={quest.tone}>{quest.status}</b>
              </div>
              <h3>{quest.name}</h3>
              <p>{quest.nextMove}</p>
              <div className="progress-bar" aria-label={`${quest.name} progress`}>
                <span style={{ width: `${quest.progress}%` }} />
              </div>
              <div className="quest-card-bottom">
                <span>{quest.due}</span>
                <strong>{quest.value}</strong>
              </div>
            </button>
          ))}
        </div>

        <article className="quest-detail" aria-live="polite">
          <div className="quest-detail-main">
            <div>
              <span className="detail-kicker">{selectedQuest.owner}</span>
              <h3>{selectedQuest.name}</h3>
              <p>{selectedQuest.summary}</p>
              <form className="inline-note-form" onSubmit={onAddNote}>
                <input
                  aria-label="Quest note"
                  onChange={(event) => onNoteDraftChange(event.target.value)}
                  placeholder="Add quick note"
                  value={noteDraft}
                />
                <button type="submit">Add</button>
              </form>
            </div>
            <div className="detail-value">
              <span>{selectedQuest.target}</span>
              <strong>{selectedQuest.progress}%</strong>
            </div>
          </div>

          <div className="detail-columns">
            <section className="detail-column">
              <div className="detail-column-head">
                <h4>Ledger</h4>
                <span>{selectedQuest.ledger.length}</span>
              </div>
              <form className="mini-form" onSubmit={onAddLedgerEntry}>
                <input
                  aria-label="Ledger label"
                  onChange={(event) => onLedgerDraftChange((draft) => ({ ...draft, label: event.target.value }))}
                  placeholder="Label"
                  value={ledgerDraft.label}
                />
                <input
                  aria-label="Ledger amount"
                  onChange={(event) => onLedgerDraftChange((draft) => ({ ...draft, amount: event.target.value }))}
                  placeholder="$0"
                  value={ledgerDraft.amount}
                />
                <select
                  aria-label="Ledger state"
                  onChange={(event) => onLedgerDraftChange((draft) => ({ ...draft, state: event.target.value as LedgerState }))}
                  value={ledgerDraft.state}
                >
                  <option>Draft</option>
                  <option>Open</option>
                  <option>Paid</option>
                </select>
                <button aria-label="Add ledger entry" type="submit">+</button>
              </form>
              {selectedQuest.ledger.map((entry, index) => (
                <div className="mini-row" key={entry.label}>
                  <span>{entry.label}</span>
                  <strong>{entry.amount}</strong>
                  <button data-state={entry.state} onClick={() => onCycleLedgerState(index)} type="button">{entry.state}</button>
                </div>
              ))}
            </section>

            <section className="detail-column">
              <div className="detail-column-head">
                <h4>Paper Trail</h4>
                <span>{selectedQuest.papers.length}</span>
              </div>
              <form className="mini-form" onSubmit={onAddPaperItem}>
                <input
                  aria-label="Paper trail label"
                  onChange={(event) => onPaperDraftChange((draft) => ({ ...draft, label: event.target.value }))}
                  placeholder="Receipt/photo"
                  value={paperDraft.label}
                />
                <input
                  aria-label="Paper trail meta"
                  onChange={(event) => onPaperDraftChange((draft) => ({ ...draft, meta: event.target.value }))}
                  placeholder="Photo, PDF..."
                  value={paperDraft.meta}
                />
                <input
                  aria-label="Paper trail state"
                  onChange={(event) => onPaperDraftChange((draft) => ({ ...draft, state: event.target.value }))}
                  placeholder="Review"
                  value={paperDraft.state}
                />
                <button aria-label="Add paper trail item" type="submit">+</button>
              </form>
              {selectedQuest.papers.map((paper, index) => (
                <div className="mini-row paper-mini-row" key={paper.label}>
                  <span>{paper.label}</span>
                  <strong>{paper.meta}</strong>
                  <button data-state={paper.state} onClick={() => onCyclePaperState(index)} type="button">{paper.state}</button>
                  <button className="remove-mini-button" onClick={() => onRemovePaperItem(index)} type="button" aria-label={`Remove ${paper.label}`}>x</button>
                </div>
              ))}
            </section>

            <section className="detail-column" id="people">
              <div className="detail-column-head">
                <h4>People</h4>
                <span>{selectedPeople.length}</span>
              </div>
              <form className="people-form" onSubmit={onAddPerson}>
                <input
                  aria-label="Person name"
                  onChange={(event) => onPersonDraftChange((draft) => ({ ...draft, name: event.target.value }))}
                  placeholder="Name"
                  value={personDraft.name}
                />
                <input
                  aria-label="Person role"
                  onChange={(event) => onPersonDraftChange((draft) => ({ ...draft, role: event.target.value }))}
                  placeholder="Role"
                  value={personDraft.role}
                />
                <input
                  aria-label="Next touch"
                  onChange={(event) => onPersonDraftChange((draft) => ({ ...draft, nextTouch: event.target.value }))}
                  placeholder="Next touch"
                  value={personDraft.nextTouch}
                />
                <button aria-label="Add person" type="submit">+</button>
              </form>
              {selectedPeople.length > 0 ? selectedPeople.map((person, index) => (
                <div className="person-row" key={`${person.name}-${person.role}`}>
                  <span>{person.name}</span>
                  <div className="person-actions">
                    <strong>{person.role}</strong>
                    <button data-status={person.status} onClick={() => onCyclePersonStatus(index)} type="button">{person.status}</button>
                    <button className="remove-person" onClick={() => onRemovePerson(index)} type="button" aria-label={`Remove ${person.name}`}>x</button>
                  </div>
                  <em>{person.nextTouch}</em>
                </div>
              )) : (
                <p className="empty-detail">No people linked yet.</p>
              )}
            </section>

            <section className="detail-column">
              <div className="detail-column-head">
                <h4>Next Steps</h4>
                <span>{selectedQuest.steps.length}</span>
              </div>
              {selectedQuest.steps.map((step, index) => (
                <div className="step-row" data-step={step.state} key={step.label}>
                  <span />
                  <strong>{step.label}</strong>
                  <button onClick={() => onAdvanceStep(index)} type="button">{step.state}</button>
                </div>
              ))}
            </section>
          </div>

          <div className="note-strip">
            <form className="note-form" onSubmit={onAddNote}>
              <input
                aria-label="Quest note"
                onChange={(event) => onNoteDraftChange(event.target.value)}
                placeholder="Add quick note"
                value={noteDraft}
              />
              <button type="submit">Add</button>
            </form>
            {selectedQuest.notes.map((note) => (
              <span key={note}>{note}</span>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
