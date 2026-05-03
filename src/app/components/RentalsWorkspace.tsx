import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { RentalBook, RentalExpense, RentalProperty, RentRecord, VehicleTrip } from "../types";
import { formatMoney } from "../utils";
import { getExpensesByCategory, getRentalBookSummary, getRentalPropertySummary } from "../selectors";

export type RentDraft = Pick<RentRecord, "amount_due" | "amount_received" | "due_date" | "payment_date" | "payment_method" | "rent_period_end" | "rent_period_start" | "status"> & {
  notes: string;
};

export type ExpenseDraft = Pick<RentalExpense, "amount" | "category" | "expense_date" | "paid_date" | "payment_method" | "recurring" | "tax_bucket"> & {
  notes: string;
};

export type TripDraft = Pick<VehicleTrip, "category" | "date" | "destination" | "end_odometer" | "miles" | "origin" | "purpose" | "start_odometer"> & {
  notes: string;
};

type RentalsWorkspaceProps = {
  expenseDraft: ExpenseDraft;
  onAddExpense: (event: FormEvent<HTMLFormElement>) => void;
  onAddRent: (event: FormEvent<HTMLFormElement>) => void;
  onAddTrip: (event: FormEvent<HTMLFormElement>) => void;
  onExpenseDraftChange: Dispatch<SetStateAction<ExpenseDraft>>;
  onRentDraftChange: Dispatch<SetStateAction<RentDraft>>;
  rentalBook: RentalBook;
  rentDraft: RentDraft;
  selectedPropertyIndex: number;
  selectedTaxYear: number;
  onSelectedPropertyIndexChange: (propertyIndex: number) => void;
  onSelectedTaxYearChange: (taxYear: number) => void;
  onTripDraftChange: Dispatch<SetStateAction<TripDraft>>;
  tripDraft: TripDraft;
};

export function RentalsWorkspace({
  expenseDraft,
  onAddExpense,
  onAddRent,
  onAddTrip,
  onExpenseDraftChange,
  onRentDraftChange,
  rentalBook,
  rentDraft,
  selectedPropertyIndex,
  selectedTaxYear,
  onSelectedPropertyIndexChange,
  onSelectedTaxYearChange,
  onTripDraftChange,
  tripDraft,
}: RentalsWorkspaceProps) {
  const selectedProperty = rentalBook.properties[Math.min(selectedPropertyIndex, rentalBook.properties.length - 1)] ?? rentalBook.properties[0];
  const bookSummary = getRentalBookSummary(rentalBook, selectedTaxYear);

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
        <select aria-label="Rental tax year" onChange={(event) => onSelectedTaxYearChange(Number(event.target.value))} value={selectedTaxYear}>
          {rentalBook.mileageRates.map((rate) => (
            <option key={rate.tax_year} value={rate.tax_year}>{rate.tax_year}</option>
          ))}
        </select>
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

          <div className="rental-intake-grid">
            <form className="rental-intake-form" onSubmit={onAddRent}>
              <strong>Rent</strong>
              <input aria-label="Rent period start" onChange={(event) => onRentDraftChange((draft) => ({ ...draft, rent_period_start: event.target.value }))} placeholder="Period start" value={rentDraft.rent_period_start} />
              <input aria-label="Rent period end" onChange={(event) => onRentDraftChange((draft) => ({ ...draft, rent_period_end: event.target.value }))} placeholder="Period end" value={rentDraft.rent_period_end} />
              <input aria-label="Rent due date" onChange={(event) => onRentDraftChange((draft) => ({ ...draft, due_date: event.target.value }))} placeholder="Due date" value={rentDraft.due_date} />
              <input aria-label="Rent amount due" onChange={(event) => onRentDraftChange((draft) => ({ ...draft, amount_due: Number(event.target.value) || 0 }))} placeholder="Amount due" value={rentDraft.amount_due || ""} />
              <input aria-label="Rent amount received" onChange={(event) => onRentDraftChange((draft) => ({ ...draft, amount_received: Number(event.target.value) || 0 }))} placeholder="Received" value={rentDraft.amount_received || ""} />
              <select aria-label="Rent status" onChange={(event) => onRentDraftChange((draft) => ({ ...draft, status: event.target.value as RentRecord["status"] }))} value={rentDraft.status}>
                <option>due</option>
                <option>partial</option>
                <option>paid</option>
                <option>late</option>
                <option>waived</option>
              </select>
              <button type="submit">Add</button>
            </form>

            <form className="rental-intake-form" onSubmit={onAddExpense}>
              <strong>Expense</strong>
              <input aria-label="Expense date" onChange={(event) => onExpenseDraftChange((draft) => ({ ...draft, expense_date: event.target.value }))} placeholder="Expense date" value={expenseDraft.expense_date} />
              <select aria-label="Expense category" onChange={(event) => onExpenseDraftChange((draft) => ({ ...draft, category: event.target.value as RentalExpense["category"], tax_bucket: event.target.value }))} value={expenseDraft.category}>
                <option>mortgage</option>
                <option>utilities</option>
                <option>insurance</option>
                <option>taxes</option>
                <option>supplies</option>
                <option>repairs</option>
                <option>lawn</option>
                <option>legal</option>
                <option>accounting</option>
                <option>other</option>
              </select>
              <input aria-label="Expense amount" onChange={(event) => onExpenseDraftChange((draft) => ({ ...draft, amount: Number(event.target.value) || 0 }))} placeholder="Amount" value={expenseDraft.amount || ""} />
              <input aria-label="Expense paid date" onChange={(event) => onExpenseDraftChange((draft) => ({ ...draft, paid_date: event.target.value }))} placeholder="Paid date" value={expenseDraft.paid_date} />
              <input aria-label="Expense payment method" onChange={(event) => onExpenseDraftChange((draft) => ({ ...draft, payment_method: event.target.value }))} placeholder="Method" value={expenseDraft.payment_method} />
              <button type="submit">Add</button>
            </form>

            <form className="rental-intake-form" onSubmit={onAddTrip}>
              <strong>Trip</strong>
              <input aria-label="Trip date" onChange={(event) => onTripDraftChange((draft) => ({ ...draft, date: event.target.value }))} placeholder="Date" value={tripDraft.date} />
              <select aria-label="Trip category" onChange={(event) => onTripDraftChange((draft) => ({ ...draft, category: event.target.value as VehicleTrip["category"] }))} value={tripDraft.category}>
                <option>inspection</option>
                <option>repair</option>
                <option>materials</option>
                <option>lawn</option>
                <option>admin</option>
                <option>other</option>
              </select>
              <input aria-label="Trip miles" onChange={(event) => onTripDraftChange((draft) => ({ ...draft, miles: Number(event.target.value) || 0 }))} placeholder="Miles" value={tripDraft.miles || ""} />
              <input aria-label="Trip origin" onChange={(event) => onTripDraftChange((draft) => ({ ...draft, origin: event.target.value }))} placeholder="Origin" value={tripDraft.origin} />
              <input aria-label="Trip destination" onChange={(event) => onTripDraftChange((draft) => ({ ...draft, destination: event.target.value }))} placeholder="Destination" value={tripDraft.destination} />
              <input aria-label="Trip purpose" onChange={(event) => onTripDraftChange((draft) => ({ ...draft, purpose: event.target.value }))} placeholder="Purpose" value={tripDraft.purpose} />
              <button type="submit">Add</button>
            </form>
          </div>

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
                <span>Standard mileage @ {formatMileageRate(bookSummary.mileageRate.business_rate)}</span>
                <strong>{formatMoney(bookSummary.standardMileageEstimate)}</strong>
              </div>
              <div className="rental-row">
                <span>{bookSummary.mileageRate.source}</span>
                <strong>{bookSummary.mileageRate.tax_year}</strong>
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

function formatMileageRate(rate: number) {
  return `${(rate * 100).toFixed(1)}c/mi`;
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
