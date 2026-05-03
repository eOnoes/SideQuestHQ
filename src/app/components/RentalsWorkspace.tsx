import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { RentalBook, RentalProperty } from "../types";

export type RentalPropertyDraft = Pick<RentalProperty, "pet_allowed" | "property_name" | "rent_type" | "rooms" | "street_address">;

type RentalsWorkspaceProps = {
  onAddProperty: (event: FormEvent<HTMLFormElement>) => void;
  onArchiveProperty: (propertyId: string) => void;
  onCyclePropertyStatus: (propertyId: string) => void;
  onPropertyDraftChange: Dispatch<SetStateAction<RentalPropertyDraft>>;
  propertyDraft: RentalPropertyDraft;
  rentalBook: RentalBook;
};

const statusLabels: Record<RentalProperty["rental_status"], string> = {
  archived: "archived",
  available: "available",
  empty: "empty",
  full: "full",
  under_maintenance: "under maint",
};

export function RentalsWorkspace({ onAddProperty, onArchiveProperty, onCyclePropertyStatus, onPropertyDraftChange, propertyDraft, rentalBook }: RentalsWorkspaceProps) {
  const visibleProperties = rentalBook.properties.filter((property) => property.rental_status !== "archived");

  return (
    <section className="rentals-workspace">
      <div className="rental-asset-head">
        <div>
          <h3>Rental Assets</h3>
          <span>List the properties first; tracking happens from these records later.</span>
        </div>
        <strong>{visibleProperties.length} listed</strong>
      </div>

      <form className="rental-asset-form" onSubmit={onAddProperty}>
        <input aria-label="Rental property name" onChange={(event) => onPropertyDraftChange((draft) => ({ ...draft, property_name: event.target.value }))} placeholder="Name" value={propertyDraft.property_name} />
        <input aria-label="Rental property address" onChange={(event) => onPropertyDraftChange((draft) => ({ ...draft, street_address: event.target.value }))} placeholder="Address" value={propertyDraft.street_address} />
        <select aria-label="Rent type" onChange={(event) => onPropertyDraftChange((draft) => ({ ...draft, rent_type: event.target.value as RentalProperty["rent_type"] }))} value={propertyDraft.rent_type}>
          <option>House</option>
          <option>Room</option>
        </select>
        <select aria-label="Rooms" onChange={(event) => onPropertyDraftChange((draft) => ({ ...draft, rooms: Number(event.target.value) as RentalProperty["rooms"] }))} value={propertyDraft.rooms}>
          <option value={0}>0 rooms</option>
          <option value={1}>1 room</option>
          <option value={2}>2 rooms</option>
          <option value={3}>3 rooms</option>
          <option value={4}>4 rooms</option>
          <option value={5}>5 rooms</option>
        </select>
        <select aria-label="Pet allowed" onChange={(event) => onPropertyDraftChange((draft) => ({ ...draft, pet_allowed: event.target.value === "Yes" }))} value={propertyDraft.pet_allowed ? "Yes" : "No"}>
          <option>Yes</option>
          <option>No</option>
        </select>
        <button type="submit">Add</button>
      </form>

      <div className="rental-asset-list">
        {visibleProperties.map((property) => (
          <article className="rental-asset-row" key={property.property_id}>
            <div>
              <span>{property.rent_type} / {property.rooms} rooms</span>
              <strong>{property.property_name}</strong>
              <em>{property.street_address || "No address set"}</em>
            </div>
            <div>
              <span>Pets</span>
              <strong>{property.pet_allowed ? "Allowed" : "No"}</strong>
            </div>
            <button data-status={property.rental_status} onClick={() => onCyclePropertyStatus(property.property_id)} type="button">{statusLabels[property.rental_status]}</button>
            <button className="archive-property-button" onClick={() => onArchiveProperty(property.property_id)} type="button" aria-label={`Archive ${property.property_name}`}>Archive</button>
          </article>
        ))}
      </div>
    </section>
  );
}
