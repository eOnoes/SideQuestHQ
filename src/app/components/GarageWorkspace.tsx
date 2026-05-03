import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { RentalBook, VehicleProfile } from "../types";
import { getVehicleSummaries } from "../selectors";
import { formatMoney } from "../utils";

export type VehicleDraft = Omit<VehicleProfile, "vehicle_id">;

type GarageWorkspaceProps = {
  onAddVehicle: (event: FormEvent<HTMLFormElement>) => void;
  onArchiveVehicle: (vehicleId: string) => void;
  onCycleVehicleAvailability: (vehicleId: string) => void;
  onVehicleDraftChange: Dispatch<SetStateAction<VehicleDraft>>;
  rentalBook: RentalBook;
  selectedTaxYear: number;
  vehicleDraft: VehicleDraft;
};

export function GarageWorkspace({ onAddVehicle, onArchiveVehicle, onCycleVehicleAvailability, onVehicleDraftChange, rentalBook, selectedTaxYear, vehicleDraft }: GarageWorkspaceProps) {
  const vehicleSummaries = getVehicleSummaries(rentalBook, selectedTaxYear).filter((summary) => summary.vehicle.availability_status !== "archived");

  return (
    <div className="garage-workspace">
      <form className="garage-form" onSubmit={onAddVehicle}>
        <input aria-label="Vehicle name" onChange={(event) => onVehicleDraftChange((draft) => ({ ...draft, vehicle_name: event.target.value }))} placeholder="Vehicle name" value={vehicleDraft.vehicle_name} />
        <select aria-label="Vehicle type" onChange={(event) => onVehicleDraftChange((draft) => ({ ...draft, vehicle_type: event.target.value as VehicleProfile["vehicle_type"] }))} value={vehicleDraft.vehicle_type}>
          <option>Van</option>
          <option>Truck</option>
          <option>Car</option>
          <option>Motorcycle</option>
        </select>
        <input aria-label="Vehicle make" onChange={(event) => onVehicleDraftChange((draft) => ({ ...draft, make: event.target.value }))} placeholder="Make" value={vehicleDraft.make} />
        <input aria-label="Vehicle model" onChange={(event) => onVehicleDraftChange((draft) => ({ ...draft, model: event.target.value }))} placeholder="Model" value={vehicleDraft.model} />
        <input aria-label="Vehicle year" onChange={(event) => onVehicleDraftChange((draft) => ({ ...draft, model_year: event.target.value }))} placeholder="Year" value={vehicleDraft.model_year} />
        <select aria-label="Owned or leased" onChange={(event) => onVehicleDraftChange((draft) => ({ ...draft, owned_or_leased: event.target.value as VehicleProfile["owned_or_leased"] }))} value={vehicleDraft.owned_or_leased}>
          <option>owned</option>
          <option>leased</option>
        </select>
        <input aria-label="Lease monthly amount" disabled={vehicleDraft.owned_or_leased !== "leased"} onChange={(event) => onVehicleDraftChange((draft) => ({ ...draft, lease_monthly_amount: Number(event.target.value) || 0 }))} placeholder="Lease/mo" value={vehicleDraft.owned_or_leased === "leased" ? vehicleDraft.lease_monthly_amount || "" : ""} />
        <input aria-label="In service date" onChange={(event) => onVehicleDraftChange((draft) => ({ ...draft, in_service_date: event.target.value }))} placeholder="In service" value={vehicleDraft.in_service_date} />
        <input aria-label="Start odometer year" onChange={(event) => onVehicleDraftChange((draft) => ({ ...draft, start_odometer_year: Number(event.target.value) || 0 }))} placeholder="Start odometer" value={vehicleDraft.start_odometer_year || ""} />
        <button type="submit">Add</button>
      </form>

      <div className="garage-list">
        {vehicleSummaries.map((summary) => (
          <article className="garage-row" key={summary.vehicle.vehicle_id}>
            <div>
              <span>{summary.vehicle.vehicle_type} / {summary.vehicle.owned_or_leased}</span>
              <strong>{summary.vehicle.vehicle_name}</strong>
              <em>{[summary.vehicle.model_year, summary.vehicle.make, summary.vehicle.model].filter(Boolean).join(" ") || "Make/model not set"}</em>
            </div>
            <button data-status={summary.vehicle.availability_status} onClick={() => onCycleVehicleAvailability(summary.vehicle.vehicle_id)} type="button">
              {summary.vehicle.availability_status}
            </button>
            <div>
              <span>Total / business miles</span>
              <strong>{summary.totalMiles} / {summary.businessMiles}</strong>
            </div>
            <div>
              <span>Business use</span>
              <strong>{Math.round(summary.businessUsePercentage * 100)}%</strong>
            </div>
            <div>
              <span>Standard mileage</span>
              <strong>{formatMoney(summary.standardMileageEstimate)}</strong>
            </div>
            <div>
              <span>Actual estimate</span>
              <strong>{formatMoney(summary.actualExpenseEstimate)}</strong>
            </div>
            <div>
              <span>Lease allocation</span>
              <strong>{formatMoney(summary.leaseAllocation)}</strong>
            </div>
            <button className="archive-vehicle-button" onClick={() => onArchiveVehicle(summary.vehicle.vehicle_id)} type="button" aria-label={`Archive ${summary.vehicle.vehicle_name}`}>Archive</button>
          </article>
        ))}
      </div>
    </div>
  );
}
