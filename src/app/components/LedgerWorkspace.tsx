import type { FormEvent } from "react";
import type { LedgerState, Quest } from "../types";
import { formatMoney } from "../utils";

export type LedgerRow = {
  amount: string;
  entryIndex: number;
  label: string;
  questIndex: number;
  questName: string;
  questType: string;
  state: LedgerState;
};

type LedgerWorkspaceProps = {
  draft: { label: string; amount: string; state: LedgerState };
  ledgerRows: LedgerRow[];
  ledgerSummary: { draft: number; open: number; paid: number };
  onAddLedgerEntry: (event: FormEvent<HTMLFormElement>) => void;
  onCycleLedgerState: (questIndex: number, entryIndex: number) => void;
  onDraftChange: (draft: { label: string; amount: string; state: LedgerState }) => void;
  onOpenQuest: (questIndex: number) => void;
  questList: Quest[];
  selectedQuestIndex: number;
  setSelectedQuestIndex: (index: number) => void;
};

export function LedgerWorkspace({
  draft,
  ledgerRows,
  ledgerSummary,
  onAddLedgerEntry,
  onCycleLedgerState,
  onDraftChange,
  onOpenQuest,
  questList,
  selectedQuestIndex,
  setSelectedQuestIndex,
}: LedgerWorkspaceProps) {
  return (
    <section className="ledger-section panel">
      <div className="panel-header">
        <h2>Ledger</h2>
        <span>{ledgerRows.length} entries</span>
      </div>

      <div className="ledger-board">
        <form className="ledger-form" onSubmit={onAddLedgerEntry}>
          <select
            aria-label="Ledger quest"
            onChange={(event) => setSelectedQuestIndex(Number(event.target.value))}
            value={selectedQuestIndex}
          >
            {questList.map((quest, index) => (
              <option key={quest.name} value={index}>{quest.name}</option>
            ))}
          </select>
          <input
            aria-label="Ledger label"
            onChange={(event) => onDraftChange({ ...draft, label: event.target.value })}
            placeholder="Ledger label"
            value={draft.label}
          />
          <input
            aria-label="Ledger amount"
            onChange={(event) => onDraftChange({ ...draft, amount: event.target.value })}
            placeholder="$0"
            value={draft.amount}
          />
          <select
            aria-label="Ledger state"
            onChange={(event) => onDraftChange({ ...draft, state: event.target.value as LedgerState })}
            value={draft.state}
          >
            <option>Draft</option>
            <option>Open</option>
            <option>Paid</option>
          </select>
          <button type="submit">Add</button>
        </form>

        <div className="ledger-total-strip">
          <div>
            <span>Open</span>
            <strong>{formatMoney(ledgerSummary.open)}</strong>
          </div>
          <div>
            <span>Draft</span>
            <strong>{formatMoney(ledgerSummary.draft)}</strong>
          </div>
          <div>
            <span>Paid</span>
            <strong>{formatMoney(ledgerSummary.paid)}</strong>
          </div>
        </div>

        <div className="ledger-list">
          {ledgerRows.map((entry) => (
            <article className="ledger-row" data-state={entry.state} key={`${entry.questName}-${entry.label}-${entry.entryIndex}`}>
              <div>
                <span>{entry.questType}</span>
                <strong>{entry.questName}</strong>
              </div>
              <div>
                <span>{entry.label}</span>
                <strong>{entry.amount}</strong>
              </div>
              <button data-state={entry.state} onClick={() => onCycleLedgerState(entry.questIndex, entry.entryIndex)} type="button">{entry.state}</button>
              <button className="open-quest-button" onClick={() => onOpenQuest(entry.questIndex)} type="button">Open Quest</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
