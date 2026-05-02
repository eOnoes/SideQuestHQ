import type { FormEvent } from "react";
import type { Asset } from "../types";
import { formatMoney } from "../utils";

type AssetsWorkspaceProps = {
  assetDraft: Asset;
  assetList: Asset[];
  assetSummary: {
    activeCount: number;
    annualProjected: number;
    monthlyProjected: number;
    planningCount: number;
    watchingCount: number;
  };
  onAddAsset: (event: FormEvent<HTMLFormElement>) => void;
  onAssetDraftChange: (draft: Asset) => void;
  onCycleAssetStatus: (assetIndex: number) => void;
  onOpenAssetQuest: (assetIndex: number) => void;
  onRemoveAsset: (assetIndex: number) => void;
};

export function AssetsWorkspace({
  assetDraft,
  assetList,
  assetSummary,
  onAddAsset,
  onAssetDraftChange,
  onCycleAssetStatus,
  onOpenAssetQuest,
  onRemoveAsset,
}: AssetsWorkspaceProps) {
  return (
    <section className="asset-section panel">
      <div className="panel-header">
        <h2>Assets</h2>
        <span>{formatMoney(assetSummary.monthlyProjected)} projected/mo</span>
      </div>
      <div className="asset-body">
        <form className="asset-form" onSubmit={onAddAsset}>
          <input
            aria-label="Asset name"
            onChange={(event) => onAssetDraftChange({ ...assetDraft, name: event.target.value })}
            placeholder="Asset name"
            value={assetDraft.name}
          />
          <select
            aria-label="Asset type"
            onChange={(event) => onAssetDraftChange({ ...assetDraft, type: event.target.value as Asset["type"] })}
            value={assetDraft.type}
          >
            <option>Rental</option>
            <option>Business</option>
            <option>Retirement</option>
            <option>Build</option>
            <option>Other</option>
          </select>
          <input
            aria-label="Asset value"
            onChange={(event) => onAssetDraftChange({ ...assetDraft, value: event.target.value })}
            placeholder="Value / basis"
            value={assetDraft.value}
          />
          <input
            aria-label="Projected earnings"
            onChange={(event) => onAssetDraftChange({ ...assetDraft, projected: event.target.value })}
            placeholder="Projected"
            value={assetDraft.projected}
          />
          <select
            aria-label="Projection frequency"
            onChange={(event) => onAssetDraftChange({ ...assetDraft, frequency: event.target.value as Asset["frequency"] })}
            value={assetDraft.frequency}
          >
            <option>Monthly</option>
            <option>Annual</option>
            <option>One-time</option>
          </select>
          <button type="submit">Add</button>
        </form>

        <div className="asset-summary">
          <div>
            <span>Producing</span>
            <strong>{assetSummary.activeCount}</strong>
          </div>
          <div>
            <span>Watching</span>
            <strong>{assetSummary.watchingCount}</strong>
          </div>
          <div>
            <span>Planning</span>
            <strong>{assetSummary.planningCount}</strong>
          </div>
          <div>
            <span>Projected yearly</span>
            <strong>{formatMoney(assetSummary.annualProjected)}</strong>
          </div>
        </div>

        <div className="asset-list">
          {assetList.map((asset, index) => (
            <article className="asset-row" key={`${asset.name}-${asset.type}`}>
              <div>
                <span>{asset.type}</span>
                <strong>{asset.name}</strong>
              </div>
              <div>
                <span>{asset.value}</span>
                <strong>{asset.projected} {asset.frequency.toLowerCase()}</strong>
              </div>
              <button data-status={asset.status} onClick={() => onCycleAssetStatus(index)} type="button">{asset.status}</button>
              <button className="open-quest-button" onClick={() => onOpenAssetQuest(index)} type="button">Quest</button>
              <button className="remove-asset-button" onClick={() => onRemoveAsset(index)} type="button" aria-label={`Remove ${asset.name}`}>Remove</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
