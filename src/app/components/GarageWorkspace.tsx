import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { RentalBook, VehicleProfile } from "../types";
import { getVehicleSummaries } from "../selectors";
import { formatMoney } from "../utils";

export type VehicleDraft = Omit<VehicleProfile, "vehicle_id">;

type GarageWorkspaceProps = {
  onAddVehicle: (event: FormEvent<HTMLFormElement>) => void;
  onVehicleDraftChange: Dispatch<SetStateAction<VehicleDraft>>;
  rentalBook: RentalBook;
  selectedTaxYear: number;
  vehicleDraft: VehicleDraft;
};

export function GarageWorkspace({ onAddVehicle, onVehicleDraftChange, rentalBook, selectedTaxYear, vehicleDraft }: GarageWorkspaceProps) {
  const vehicleSummaries = getVehicleSummaries(rentalBook, selectedTaxYear);

  return (
    <div className="garage-workspace">
      <form className="garage-form" onSubmit={onAddVehicle}>
        <input aria-label="Vehicle name" onChange={(event) => onVehicleDraftChange((draft) => ({ ...draft, vehicle_name: event.target.value }))} placeholder="Vehicle name" value={vehicleDraft.vehicle_name} />
        <select aria-label="Owned or leased" onChange={(event) => onVehicleDraftChange((draft) => ({ ...draft, owned_or_leased: event.target.value as VehicleProfile["owned_or_leased"] }))} value={vehicleDraft.owned_or_leased}>
          <option>owned</option>
          <option>leased</option>
        </select>
        <input aria-label="In service date" onChange={(event) => onVehicleDraftChange((draft) => ({ ...draft, in_service_date: event.target.value }))} placeholder="In service date" value={vehicleDraft.in_service_date} />
        <input aria-label="Lease monthly amount" onChange={(event) => onVehicleDraftChange((draft) => ({ ...draft, lease_monthly_amount: Number(event.target.value) || 0 }))} placeholder="Lease/mo" value={vehicleDraft.lease_monthly_amount || ""} />
        <input aria-label="Start odometer year" onChange={(event) => onVehicleDraftChange((draft) => ({ ...draft, start_odometer_year: Number(event.target.value) || 0 }))} placeholder="Start odometer" value={vehicleDraft.start_odometer_year || ""} />
        <input aria-label="End odometer year" onChange={(event) => onVehicleDraftChange((draft) => ({ ...draft, end_odometer_year: Number(event.target.value) || 0 }))} placeholder="End odometer" value={vehicleDraft.end_odometer_year || ""} />
        <button type="submit">Add</button>
      </form>

      <div className="garage-list">
        {vehicleSummaries.map((summary) => (
          <article className="garage-row" key={summary.vehicle.vehicle_id}>
            <div>
              <span>{summary.vehicle.owned_or_leased}</span>
              <strong>{summary.vehicle.vehicle_name}</strong>
            </div>
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
          </article>
        ))}
      </div>
    </div>
  );
}
