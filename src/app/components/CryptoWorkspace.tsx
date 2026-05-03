import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { CryptoSnapshot } from "../types";
import { formatMoney } from "../utils";

export type CryptoSnapshotDraft = Omit<CryptoSnapshot, "snapshot_id">;

type CryptoWorkspaceProps = {
  cryptoSnapshotDraft: CryptoSnapshotDraft;
  cryptoSnapshots: CryptoSnapshot[];
  onAddCryptoSnapshot: (event: FormEvent<HTMLFormElement>) => void;
  onCryptoSnapshotDraftChange: Dispatch<SetStateAction<CryptoSnapshotDraft>>;
};

function getCryptoMovement(snapshot: CryptoSnapshot, cryptoSnapshots: CryptoSnapshot[]) {
  const previousSnapshot = [...cryptoSnapshots]
    .filter((candidate) => candidate.token_symbol === snapshot.token_symbol && candidate.snapshot_id !== snapshot.snapshot_id && candidate.snapshot_date <= snapshot.snapshot_date)
    .sort((left, right) => right.snapshot_date.localeCompare(left.snapshot_date))[0];
  if (!previousSnapshot) return null;

  return snapshot.current_value - previousSnapshot.current_value;
}

export function CryptoRows({ cryptoSnapshots, limit }: { cryptoSnapshots: CryptoSnapshot[]; limit?: number }) {
  const visibleSnapshots = [...cryptoSnapshots].sort((left, right) => right.snapshot_date.localeCompare(left.snapshot_date)).slice(0, limit);

  return (
    <div className="snapshot-list">
      {visibleSnapshots.map((snapshot) => {
        const movement = getCryptoMovement(snapshot, cryptoSnapshots);
        const valuePerToken = snapshot.token_count > 0 ? snapshot.current_value / snapshot.token_count : 0;

        return (
          <article className="crypto-row" key={snapshot.snapshot_id}>
            <div>
              <span>{snapshot.wallet_label} / {snapshot.snapshot_date}</span>
              <strong>{snapshot.token_name}</strong>
              <em>{snapshot.token_symbol}</em>
            </div>
            <div>
              <span>Tokens</span>
              <strong>{snapshot.token_count.toLocaleString("en-US", { maximumFractionDigits: 8 })}</strong>
            </div>
            <div>
              <span>Value</span>
              <strong>{formatMoney(snapshot.current_value)}</strong>
            </div>
            <div>
              <span>Per token</span>
              <strong>{formatMoney(valuePerToken)}</strong>
            </div>
            <div>
              <span>Move</span>
              <strong data-tone={(movement ?? 0) >= 0 ? "good" : "warn"}>{movement === null ? "Baseline" : formatMoney(movement)}</strong>
            </div>
          </article>
        );
      })}
      {visibleSnapshots.length === 0 ? <p>No crypto snapshots saved yet.</p> : null}
    </div>
  );
}

export function CryptoWorkspace({ cryptoSnapshotDraft, cryptoSnapshots, onAddCryptoSnapshot, onCryptoSnapshotDraftChange }: CryptoWorkspaceProps) {
  return (
    <section className="crypto-workspace">
      <div className="snapshot-panel-head">
        <div>
          <h3>Crypto Snapshots</h3>
          <span>Manual token-count/value tracking. No exchange access, no wallet access, no transactions.</span>
        </div>
        <strong>{cryptoSnapshots.length} saved</strong>
      </div>

      <form className="crypto-form" onSubmit={onAddCryptoSnapshot}>
        <input aria-label="Crypto wallet label" onChange={(event) => onCryptoSnapshotDraftChange((draft) => ({ ...draft, wallet_label: event.target.value }))} placeholder="Wallet / exchange label" value={cryptoSnapshotDraft.wallet_label} />
        <input aria-label="Crypto token name" onChange={(event) => onCryptoSnapshotDraftChange((draft) => ({ ...draft, token_name: event.target.value }))} placeholder="Token name" value={cryptoSnapshotDraft.token_name} />
        <input aria-label="Crypto token symbol" onChange={(event) => onCryptoSnapshotDraftChange((draft) => ({ ...draft, token_symbol: event.target.value }))} placeholder="Symbol" value={cryptoSnapshotDraft.token_symbol} />
        <input aria-label="Crypto token count" onChange={(event) => onCryptoSnapshotDraftChange((draft) => ({ ...draft, token_count: Number(event.target.value) }))} placeholder="Token count" step="any" type="number" value={cryptoSnapshotDraft.token_count || ""} />
        <input aria-label="Crypto current value" onChange={(event) => onCryptoSnapshotDraftChange((draft) => ({ ...draft, current_value: Number(event.target.value) }))} placeholder="Current value" type="number" value={cryptoSnapshotDraft.current_value || ""} />
        <input aria-label="Crypto snapshot date" onChange={(event) => onCryptoSnapshotDraftChange((draft) => ({ ...draft, snapshot_date: event.target.value }))} type="date" value={cryptoSnapshotDraft.snapshot_date} />
        <input aria-label="Crypto notes" onChange={(event) => onCryptoSnapshotDraftChange((draft) => ({ ...draft, notes: event.target.value }))} placeholder="Note" value={cryptoSnapshotDraft.notes} />
        <button type="submit">Add</button>
      </form>

      <CryptoRows cryptoSnapshots={cryptoSnapshots} />
    </section>
  );
}
