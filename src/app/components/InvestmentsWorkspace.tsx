import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Asset, InvestmentSnapshot } from "../types";
import { formatMoney } from "../utils";

export type InvestmentSnapshotDraft = Omit<InvestmentSnapshot, "snapshot_id">;

type InvestmentsWorkspaceProps = {
  investmentAssets: Asset[];
  investmentSnapshotDraft: InvestmentSnapshotDraft;
  investmentSnapshots: InvestmentSnapshot[];
  onAddInvestmentSnapshot: (event: FormEvent<HTMLFormElement>) => void;
  onInvestmentSnapshotDraftChange: Dispatch<SetStateAction<InvestmentSnapshotDraft>>;
};

export function getSnapshotMovement(snapshot: InvestmentSnapshot, investmentSnapshots: InvestmentSnapshot[]) {
  const previousSnapshot = [...investmentSnapshots]
    .filter((candidate) => candidate.asset_name === snapshot.asset_name && candidate.snapshot_id !== snapshot.snapshot_id && candidate.snapshot_date <= snapshot.snapshot_date)
    .sort((left, right) => right.snapshot_date.localeCompare(left.snapshot_date))[0];
  if (!previousSnapshot) return null;

  const valueChange = snapshot.current_value - previousSnapshot.current_value;
  const contributionChange = snapshot.contributions_to_date - previousSnapshot.contributions_to_date;
  return {
    contributionChange,
    estimatedMarketMove: valueChange - contributionChange,
    valueChange,
  };
}

export function SnapshotRows({ investmentSnapshots, limit }: { investmentSnapshots: InvestmentSnapshot[]; limit?: number }) {
  const visibleSnapshots = [...investmentSnapshots].sort((left, right) => right.snapshot_date.localeCompare(left.snapshot_date)).slice(0, limit);

  return (
    <div className="snapshot-list">
      {visibleSnapshots.map((snapshot) => {
        const movement = getSnapshotMovement(snapshot, investmentSnapshots);
        return (
          <article className="snapshot-row" key={snapshot.snapshot_id}>
            <div>
              <span>{snapshot.account_name} / {snapshot.snapshot_date}</span>
              <strong>{snapshot.asset_name}</strong>
              <em>{snapshot.holding_name}{snapshot.ticker ? ` / ${snapshot.ticker}` : ""}</em>
            </div>
            <div>
              <span>Value</span>
              <strong>{formatMoney(snapshot.current_value)}</strong>
            </div>
            <div>
              <span>Contrib.</span>
              <strong>{formatMoney(snapshot.contributions_to_date)}</strong>
            </div>
            <div>
              <span>Est. move</span>
              <strong data-tone={(movement?.estimatedMarketMove ?? 0) >= 0 ? "good" : "warn"}>{movement ? formatMoney(movement.estimatedMarketMove) : "Baseline"}</strong>
            </div>
          </article>
        );
      })}
      {visibleSnapshots.length === 0 ? <p>No investment snapshots saved yet.</p> : null}
    </div>
  );
}

export function InvestmentsWorkspace({
  investmentAssets,
  investmentSnapshotDraft,
  investmentSnapshots,
  onAddInvestmentSnapshot,
  onInvestmentSnapshotDraftChange,
}: InvestmentsWorkspaceProps) {
  return (
    <section className="investments-workspace">
      <div className="snapshot-panel-head">
        <div>
          <h3>Investment Snapshots</h3>
          <span>Manual-only view for 401k and other positions. No portal access, no transactions.</span>
        </div>
        <strong>{investmentSnapshots.length} saved</strong>
      </div>

      <form className="snapshot-form" onSubmit={onAddInvestmentSnapshot}>
        <select
          aria-label="Snapshot asset"
          onChange={(event) => onInvestmentSnapshotDraftChange((draft) => ({ ...draft, asset_name: event.target.value }))}
          value={investmentSnapshotDraft.asset_name}
        >
          {investmentAssets.map((asset) => <option key={asset.name}>{asset.name}</option>)}
          {investmentAssets.length === 0 ? <option>{investmentSnapshotDraft.asset_name || "Investment"}</option> : null}
        </select>
        <input aria-label="Snapshot account" onChange={(event) => onInvestmentSnapshotDraftChange((draft) => ({ ...draft, account_name: event.target.value }))} placeholder="Account" value={investmentSnapshotDraft.account_name} />
        <input aria-label="Snapshot holding" onChange={(event) => onInvestmentSnapshotDraftChange((draft) => ({ ...draft, holding_name: event.target.value }))} placeholder="Holding / fund" value={investmentSnapshotDraft.holding_name} />
        <input aria-label="Snapshot ticker" onChange={(event) => onInvestmentSnapshotDraftChange((draft) => ({ ...draft, ticker: event.target.value }))} placeholder="Ticker optional" value={investmentSnapshotDraft.ticker} />
        <input aria-label="Snapshot date" onChange={(event) => onInvestmentSnapshotDraftChange((draft) => ({ ...draft, snapshot_date: event.target.value }))} type="date" value={investmentSnapshotDraft.snapshot_date} />
        <input aria-label="Snapshot current value" onChange={(event) => onInvestmentSnapshotDraftChange((draft) => ({ ...draft, current_value: Number(event.target.value) }))} placeholder="Current value" type="number" value={investmentSnapshotDraft.current_value || ""} />
        <input aria-label="Snapshot contributions to date" onChange={(event) => onInvestmentSnapshotDraftChange((draft) => ({ ...draft, contributions_to_date: Number(event.target.value) }))} placeholder="Contributions total" type="number" value={investmentSnapshotDraft.contributions_to_date || ""} />
        <input aria-label="Snapshot notes" onChange={(event) => onInvestmentSnapshotDraftChange((draft) => ({ ...draft, notes: event.target.value }))} placeholder="Note" value={investmentSnapshotDraft.notes} />
        <button type="submit">Add</button>
      </form>

      <SnapshotRows investmentSnapshots={investmentSnapshots} />
    </section>
  );
}
