import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import type { Asset, AssetTab, InvestmentSnapshot, RentalBook, RentalProperty, VehicleProfile } from "../types";
import { formatMoney } from "../utils";

type AssetsWorkspaceProps = {
  activeAssetTab: AssetTab;
  assetDraft: Asset;
  assetList: Asset[];
  assetSummary: {
    activeCount: number;
    annualProjected: number;
    monthlyProjected: number;
    planningCount: number;
    watchingCount: number;
  };
  investmentSnapshotDraft: Omit<InvestmentSnapshot, "snapshot_id">;
  investmentSnapshots: InvestmentSnapshot[];
  onAddAsset: (event: FormEvent<HTMLFormElement>) => void;
  onAddInvestmentSnapshot: (event: FormEvent<HTMLFormElement>) => void;
  onAssetDraftChange: (draft: Asset) => void;
  onCycleAssetStatus: (assetIndex: number) => void;
  onInvestmentSnapshotDraftChange: Dispatch<SetStateAction<Omit<InvestmentSnapshot, "snapshot_id">>>;
  onOpenAssetQuest: (assetIndex: number) => void;
  onRemoveAsset: (assetIndex: number) => void;
  onAssetTabChange: (assetTab: AssetTab) => void;
  rentalBook: RentalBook;
  children?: ReactNode;
};

const rentalStatusLabels: Record<RentalProperty["rental_status"], string> = {
  archived: "archived",
  available: "available",
  empty: "empty",
  full: "full",
  under_maintenance: "under maint",
};

const vehicleStatusLabels: Record<VehicleProfile["availability_status"], string> = {
  archived: "archived",
  available: "available",
  unavailable: "unavailable",
};

export function AssetsWorkspace({
  activeAssetTab,
  assetDraft,
  assetList,
  assetSummary,
  children,
  investmentSnapshotDraft,
  investmentSnapshots,
  onAddAsset,
  onAddInvestmentSnapshot,
  onAssetDraftChange,
  onAssetTabChange,
  onCycleAssetStatus,
  onInvestmentSnapshotDraftChange,
  onOpenAssetQuest,
  onRemoveAsset,
  rentalBook,
}: AssetsWorkspaceProps) {
  const tabs: AssetTab[] = ["Portfolio", "Rentals", "Garage"];
  const rentalProperties = rentalBook.properties.filter((property) => property.rental_status !== "archived");
  const garageVehicles = rentalBook.vehicles.filter((vehicle) => vehicle.availability_status !== "archived");
  const investmentAssets = assetList.filter((asset) => asset.type !== "Rental");
  const recentSnapshots = [...investmentSnapshots].sort((left, right) => right.snapshot_date.localeCompare(left.snapshot_date)).slice(0, 6);

  function getSnapshotMovement(snapshot: InvestmentSnapshot) {
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

  return (
    <section className="asset-section panel">
      <div className="panel-header">
        <h2>Assets</h2>
        <span>{formatMoney(assetSummary.monthlyProjected)} projected/mo</span>
      </div>
      <div className="asset-tabs" role="tablist" aria-label="Asset sections">
        {tabs.map((tab) => (
          <button data-selected={activeAssetTab === tab} key={tab} onClick={() => onAssetTabChange(tab)} role="tab" type="button">{tab}</button>
        ))}
      </div>
      {activeAssetTab !== "Portfolio" ? children : (
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

        <div className="portfolio-columns">
          <section className="portfolio-column">
            <div className="portfolio-column-head">
              <h3>Rentals</h3>
              <span>{rentalProperties.length}</span>
            </div>
            <div className="portfolio-stack">
              {rentalProperties.map((property) => (
                <article className="portfolio-item" key={property.property_id}>
                  <div>
                    <span>{property.rent_type} / {property.rooms} rooms</span>
                    <strong>{property.property_name}</strong>
                    <em>{property.street_address || "No address set"}</em>
                  </div>
                  <b data-state={property.rental_status}>{rentalStatusLabels[property.rental_status]}</b>
                </article>
              ))}
              {rentalProperties.length === 0 ? <p>No rental assets listed.</p> : null}
            </div>
          </section>

          <section className="portfolio-column">
            <div className="portfolio-column-head">
              <h3>Garage</h3>
              <span>{garageVehicles.length}</span>
            </div>
            <div className="portfolio-stack">
              {garageVehicles.map((vehicle) => (
                <article className="portfolio-item" key={vehicle.vehicle_id}>
                  <div>
                    <span>{vehicle.vehicle_type} / {vehicle.owned_or_leased}</span>
                    <strong>{vehicle.vehicle_name}</strong>
                    <em>{[vehicle.model_year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Vehicle details open"}</em>
                  </div>
                  <b data-state={vehicle.availability_status}>{vehicleStatusLabels[vehicle.availability_status]}</b>
                </article>
              ))}
              {garageVehicles.length === 0 ? <p>No garage assets listed.</p> : null}
            </div>
          </section>

          <section className="portfolio-column">
            <div className="portfolio-column-head">
              <h3>Investments</h3>
              <span>{investmentAssets.length}</span>
            </div>
            <div className="portfolio-stack">
              {investmentAssets.map((asset) => {
                const assetIndex = assetList.indexOf(asset);
                return (
                  <article className="portfolio-item portfolio-item-actions" key={`${asset.name}-${asset.type}`}>
                    <div>
                      <span>{asset.type}</span>
                      <strong>{asset.name}</strong>
                      <em>{asset.value} / {asset.projected} {asset.frequency.toLowerCase()}</em>
                    </div>
                    <button data-status={asset.status} onClick={() => onCycleAssetStatus(assetIndex)} type="button">{asset.status}</button>
                    <button className="open-quest-button" onClick={() => onOpenAssetQuest(assetIndex)} type="button">Quest</button>
                    <button className="remove-asset-button" onClick={() => onRemoveAsset(assetIndex)} type="button" aria-label={`Remove ${asset.name}`}>Remove</button>
                  </article>
                );
              })}
              {investmentAssets.length === 0 ? <p>No investments listed.</p> : null}
            </div>
          </section>
        </div>

        <section className="snapshot-panel">
          <div className="snapshot-panel-head">
            <div>
              <h3>Investment snapshots</h3>
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

          <div className="snapshot-list">
            {recentSnapshots.map((snapshot) => {
              const movement = getSnapshotMovement(snapshot);
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
            {recentSnapshots.length === 0 ? <p>No investment snapshots saved yet.</p> : null}
          </div>
        </section>
      </div>
      )}
    </section>
  );
}
