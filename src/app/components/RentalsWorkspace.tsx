import type { RentalBook, RentalProperty } from "../types";
import { formatMoney } from "../utils";
import { getExpensesByCategory, getRentalBookSummary, getRentalPropertySummary } from "../selectors";

type RentalsWorkspaceProps = {
  rentalBook: RentalBook;
  selectedPropertyIndex: number;
  onSelectedPropertyIndexChange: (propertyIndex: number) => void;
};

export function RentalsWorkspace({ rentalBook, selectedPropertyIndex, onSelectedPropertyIndexChange }: RentalsWorkspaceProps) {
  const selectedProperty = rentalBook.properties[Math.min(selectedPropertyIndex, rentalBook.properties.length - 1)] ?? rentalBook.properties[0];
  const bookSummary = getRentalBookSummary(rentalBook);

  if (!selectedProperty) {
    return (
      <section className="rentals-workspace panel">
        <div className="panel-header">
          <h2>Rentals</h2>
          <span>No properties</span>
        </div>
      </section>
    );
  }

  const propertySummary = getRentalPropertySummary(rentalBook, selectedProperty.property_id);
  const expenseRows = getExpensesByCategory(propertySummary.expenses, selectedProperty.property_id);

  return (
    <section className="rentals-workspace panel">
      <div className="panel-header">
        <h2>Rental Business</h2>
        <span>{bookSummary.propertyCount} properties</span>
      </div>

      <div className="rental-board">
        <aside className="rental-property-list" aria-label="Rental properties">
          {rentalBook.properties.map((property, index) => (
            <button
              data-selected={property.property_id === selectedProperty.property_id}
              key={property.property_id}
              onClick={() => onSelectedPropertyIndexChange(index)}
              type="button"
            >
              <span>{property.rental_status}</span>
              <strong>{property.property_name}</strong>
              <em>{property.city}, {property.state}</em>
            </button>
          ))}
        </aside>

        <div className="rental-main">
          <PropertyHeader property={selectedProperty} />

          <div className="rental-summary-strip">
            <SummaryTile label="Rent received" value={formatMoney(propertySummary.rentReceived)} />
            <SummaryTile label="Unpaid rent" value={formatMoney(propertySummary.rentDue)} tone={propertySummary.rentDue > 0 ? "warn" : "good"} />
            <SummaryTile label="Bills paid" value={formatMoney(propertySummary.expenseTotal)} />
            <SummaryTile label="Year P/L" value={formatMoney(propertySummary.netIncome)} tone={propertySummary.netIncome >= 0 ? "good" : "warn"} />
            <SummaryTile label="Business miles" value={String(propertySummary.businessMiles)} />
            <SummaryTile label="Docs indexed" value={String(propertySummary.documents.length)} />
          </div>

          <div className="rental-grid">
            <section className="rental-panel">
              <h3>Rent Ledger</h3>
              {propertySummary.rents.map((rent) => (
                <div className="rental-row" key={rent.rent_id}>
                  <span>{rent.rent_period_start} to {rent.rent_period_end}</span>
                  <strong>{formatMoney(rent.amount_received)} / {formatMoney(rent.amount_due)}</strong>
                  <b data-state={rent.status}>{rent.status}</b>
                </div>
              ))}
            </section>

            <section className="rental-panel">
              <h3>Expenses by Category</h3>
              {expenseRows.map((expense) => (
                <div className="rental-row" key={expense.category}>
                  <span>{expense.category}</span>
                  <strong>{formatMoney(expense.amount)}</strong>
                </div>
              ))}
            </section>

            <section className="rental-panel">
              <h3>Repair History</h3>
              {propertySummary.workOrders.map((workOrder) => (
                <div className="rental-row" key={workOrder.work_order_id}>
                  <span>{workOrder.unit_or_area} / {workOrder.issue_type}</span>
                  <strong>{formatMoney(workOrder.total_cost)}</strong>
                  <b data-state={workOrder.status}>{workOrder.status}</b>
                </div>
              ))}
            </section>

            <section className="rental-panel">
              <h3>Vehicle Trips</h3>
              {propertySummary.trips.map((trip) => (
                <div className="rental-row" key={trip.trip_id}>
                  <span>{trip.date} / {trip.category}</span>
                  <strong>{trip.miles} miles</strong>
                  <b data-state={trip.business_use ? "business" : "personal"}>{trip.business_use ? "business" : "personal"}</b>
                </div>
              ))}
            </section>

            <section className="rental-panel">
              <h3>Documents</h3>
              {propertySummary.documents.map((document) => (
                <div className="rental-row" key={document.document_id}>
                  <span>{document.document_type}</span>
                  <strong>{document.linked_record_type}</strong>
                  <b data-state="filed">{document.upload_date}</b>
                </div>
              ))}
            </section>

            <section className="rental-panel">
              <h3>Vehicle Estimate</h3>
              <div className="rental-row">
                <span>Total miles</span>
                <strong>{bookSummary.totalMiles}</strong>
              </div>
              <div className="rental-row">
                <span>Business use</span>
                <strong>{Math.round(bookSummary.businessUsePercentage * 100)}%</strong>
              </div>
              <div className="rental-row">
                <span>Standard mileage</span>
                <strong>{formatMoney(bookSummary.standardMileageEstimate)}</strong>
              </div>
              <div className="rental-row">
                <span>Actual expense allocation</span>
                <strong>{formatMoney(bookSummary.actualVehicleExpenseEstimate)}</strong>
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}

function PropertyHeader({ property }: { property: RentalProperty }) {
  return (
    <header className="rental-property-header">
      <div>
        <span>{property.ownership_status} / {property.rental_status}</span>
        <h3>{property.property_name}</h3>
        <p>{property.street_address}, {property.city}, {property.state} {property.zip}</p>
      </div>
      <strong>Acquired {property.acquisition_date}</strong>
    </header>
  );
}

function SummaryTile({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "good" | "neutral" | "warn" }) {
  return (
    <div data-tone={tone}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
