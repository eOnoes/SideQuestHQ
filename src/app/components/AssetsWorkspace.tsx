import type { FormEvent, ReactNode } from "react";
import type { Asset, AssetTab, InvestmentSnapshot, RentalBook, RentalProperty, VehicleProfile } from "../types";
import { SnapshotRows } from "./InvestmentsWorkspace";
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
  investmentSnapshots: InvestmentSnapshot[];
  onAddAsset: (event: FormEvent<HTMLFormElement>) => void;
  onAssetDraftChange: (draft: Asset) => void;
  onCycleAssetStatus: (assetIndex: number) => void;
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
  investmentSnapshots,
  onAddAsset,
  onAssetDraftChange,
  onAssetTabChange,
  onCycleAssetStatus,
  onOpenAssetQuest,
  onRemoveAsset,
  rentalBook,
}: AssetsWorkspaceProps) {
  const tabs: AssetTab[] = ["Portfolio", "Rentals", "Garage", "Investments"];
  const rentalProperties = rentalBook.properties.filter((property) => property.rental_status !== "archived");
  const garageVehicles = rentalBook.vehicles.filter((vehicle) => vehicle.availability_status !== "archived");
  const investmentAssets = assetList.filter((asset) => asset.type !== "Rental");

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
              <h3>Latest investment snapshots</h3>
              <span>Read-only overview from manual snapshot records.</span>
            </div>
            <strong>{investmentSnapshots.length} saved</strong>
          </div>

          <SnapshotRows investmentSnapshots={investmentSnapshots} limit={3} />
        </section>
      </div>
      )}
    </section>
  );
}
