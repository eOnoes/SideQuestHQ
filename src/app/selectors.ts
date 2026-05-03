import type { AppView, Asset, LedgerState, PaperItem, Person, Quest, Reminder, RentalBook, RentalExpense } from "./types";
import { formatMoney, getMonthlyProjection, parseMoney } from "./utils";

export type PersonRow = Person & {
  personIndex: number;
  questIndex: number;
};

export type ReminderRow = Reminder & {
  reminderIndex: number;
  questIndex: number;
};

export type LedgerRow = Quest["ledger"][number] & {
  entryIndex: number;
  questIndex: number;
  questName: string;
  questType: string;
};

export type PaperRow = Quest["papers"][number] & {
  kind: "image" | "file";
  paperIndex: number;
  questIndex: number;
  questName: string;
  questType: string;
};

export function getSelectedQuest(questList: Quest[], selectedQuestIndex: number, fallbackQuest: Quest) {
  return questList[Math.min(selectedQuestIndex, questList.length - 1)] ?? fallbackQuest;
}

export function getSelectedPeople(peopleList: Person[], selectedQuestName: string) {
  return peopleList.filter((person) => person.quest === selectedQuestName);
}

export function getPeopleRows(peopleList: Person[], questList: Quest[]): PersonRow[] {
  return peopleList.map((person, personIndex) => ({
    ...person,
    personIndex,
    questIndex: questList.findIndex((quest) => quest.name === person.quest),
  }));
}

export function getPeopleSummary(peopleRows: PersonRow[]) {
  return {
    active: peopleRows.filter((person) => person.status === "Active").length,
    quiet: peopleRows.filter((person) => person.status === "Quiet").length,
    waiting: peopleRows.filter((person) => person.status === "Waiting").length,
  };
}

export function getActiveReminders(reminderList: Reminder[]) {
  return reminderList.filter((reminder) => !reminder.done).slice(0, 4);
}

export function getReminderRows(reminderList: Reminder[], questList: Quest[]): ReminderRow[] {
  return reminderList.map((reminder, reminderIndex) => ({
    ...reminder,
    reminderIndex,
    questIndex: questList.findIndex((quest) => quest.name === reminder.quest),
  }));
}

export function getReminderSummary(reminderRows: ReminderRow[]) {
  return {
    active: reminderRows.filter((reminder) => !reminder.done).length,
    done: reminderRows.filter((reminder) => reminder.done).length,
    important: reminderRows.filter((reminder) => !reminder.done && reminder.priority === "Important").length,
  };
}

export function getLedgerRows(questList: Quest[]): LedgerRow[] {
  return questList.flatMap((quest, questIndex) =>
    quest.ledger.map((entry, entryIndex) => ({
      ...entry,
      entryIndex,
      questIndex,
      questName: quest.name,
      questType: quest.type,
    })),
  );
}

export function getLedgerSummary(ledgerRows: LedgerRow[]) {
  const totalByState = (state: LedgerState) =>
    ledgerRows.filter((entry) => entry.state === state).reduce((total, entry) => total + parseMoney(entry.amount), 0);

  return {
    draft: totalByState("Draft"),
    open: totalByState("Open"),
    paid: totalByState("Paid"),
  };
}

export function getPaperKind(meta: string): "image" | "file" {
  const normalizedMeta = meta.toLowerCase();
  return normalizedMeta.includes("image") || normalizedMeta.includes("photo") ? "image" : "file";
}

export function getPaperRows(questList: Quest[]): PaperRow[] {
  return questList.flatMap((quest, questIndex) =>
    quest.papers.map((paper, paperIndex) => ({
      ...paper,
      kind: getPaperKind(paper.meta),
      paperIndex,
      questIndex,
      questName: quest.name,
      questType: quest.type,
    })),
  );
}

export function getPaperSummary(paperRows: PaperRow[]) {
  const reviewCount = paperRows.filter((paper) => paper.state.toLowerCase().includes("review") || paper.state.toLowerCase().includes("draft")).length;
  const filedCount = paperRows.filter((paper) => paper.state.toLowerCase().includes("filed")).length;
  const readyCount = paperRows.filter((paper) => paper.state.toLowerCase().includes("ready")).length;
  return { filedCount, readyCount, reviewCount };
}

export function getAssetSummary(assetList: Asset[]) {
  const monthlyProjected = assetList.reduce((total, asset) => total + getMonthlyProjection(asset), 0);
  return {
    activeCount: assetList.filter((asset) => asset.status === "Producing").length,
    monthlyProjected,
    planningCount: assetList.filter((asset) => asset.status === "Planning").length,
    watchingCount: assetList.filter((asset) => asset.status === "Watching").length,
    annualProjected: monthlyProjected * 12,
  };
}

export function getCommandPulse(input: {
  assetMonthlyProjected: number;
  ledgerOpen: number;
  paperReviewCount: number;
  peopleWaiting: number;
}): Array<{ label: string; value: string; detail: string; view: AppView }> {
  return [
    { label: "Assets", value: formatMoney(input.assetMonthlyProjected), detail: "Projected / mo", view: "Assets" },
    { label: "Ledger", value: formatMoney(input.ledgerOpen), detail: "Open money", view: "Ledger" },
    { label: "Paper", value: String(input.paperReviewCount), detail: "Need review", view: "Paper Trail" },
    { label: "People", value: String(input.peopleWaiting), detail: "Waiting touches", view: "People" },
  ];
}

export function getPaperQueue(questList: Quest[]): PaperItem[] {
  const items = questList.flatMap((quest) =>
    quest.papers.map((paper) => ({
      title: paper.label,
      source: quest.name,
      state: paper.state,
      amount: quest.ledger[0]?.amount ?? "$0",
      kind: getPaperKind(paper.meta),
    })),
  );

  return items.slice(0, 3);
}

export function getRentalPropertySummary(rentalBook: RentalBook, propertyId: string) {
  const rents = rentalBook.rents.filter((rent) => rent.property_id === propertyId);
  const expenses = rentalBook.expenses.filter((expense) => expense.property_id === propertyId || expense.allocation_property_ids?.includes(propertyId));
  const workOrders = rentalBook.workOrders.filter((workOrder) => workOrder.property_id === propertyId);
  const trips = rentalBook.vehicleTrips.filter((trip) => trip.property_id === propertyId);
  const documents = rentalBook.documents.filter((document) => document.property_id === propertyId);
  const tenants = rentalBook.tenants.filter((tenant) => tenant.property_id === propertyId);

  const rentReceived = rents.reduce((total, rent) => total + rent.amount_received + rent.late_fee_amount, 0);
  const rentDue = rents.reduce((total, rent) => total + Math.max(rent.amount_due + rent.late_fee_amount - rent.amount_received, 0), 0);
  const expenseTotal = expenses.reduce((total, expense) => total + getAllocatedExpenseAmount(expense, propertyId), 0);
  const completedRepairs = workOrders.filter((workOrder) => workOrder.status === "completed").length;
  const openRepairs = workOrders.filter((workOrder) => workOrder.status !== "completed" && workOrder.status !== "cancelled").length;
  const businessMiles = trips.filter((trip) => trip.business_use).reduce((total, trip) => total + trip.miles, 0);

  return {
    businessMiles,
    completedRepairs,
    documents,
    expenses,
    expenseTotal,
    netIncome: rentReceived - expenseTotal,
    openRepairs,
    rentDue,
    rentReceived,
    rents,
    tenants,
    trips,
    workOrders,
  };
}

export function getRentalBookSummary(rentalBook: RentalBook, taxYear = new Date().getFullYear()) {
  const rentReceived = rentalBook.rents.reduce((total, rent) => total + rent.amount_received + rent.late_fee_amount, 0);
  const rentDue = rentalBook.rents.reduce((total, rent) => total + Math.max(rent.amount_due + rent.late_fee_amount - rent.amount_received, 0), 0);
  const expenses = rentalBook.expenses.reduce((total, expense) => total + expense.amount, 0);
  const businessMiles = rentalBook.vehicleTrips.filter((trip) => trip.business_use).reduce((total, trip) => total + trip.miles, 0);
  const totalMiles = rentalBook.vehicleTrips.reduce((total, trip) => total + trip.miles, 0);
  const actualVehicleExpenses = rentalBook.vehicleExpenses.reduce((total, expense) => total + expense.amount, 0);
  const businessUsePercentage = totalMiles > 0 ? businessMiles / totalMiles : 0;
  const mileageRate = getMileageRateForYear(rentalBook, taxYear);

  return {
    actualVehicleExpenseEstimate: actualVehicleExpenses * businessUsePercentage,
    businessMiles,
    businessUsePercentage,
    expenses,
    netIncome: rentReceived - expenses,
    personalMiles: totalMiles - businessMiles,
    propertyCount: rentalBook.properties.length,
    rentDue,
    rentReceived,
    mileageRate,
    standardMileageEstimate: businessMiles * mileageRate.business_rate,
    totalMiles,
  };
}

export function getMileageRateForYear(rentalBook: RentalBook, taxYear: number) {
  return rentalBook.mileageRates.find((rate) => rate.tax_year === taxYear) ?? rentalBook.mileageRates[0] ?? {
    business_rate: 0,
    notes: "No mileage rate configured.",
    source: "Not configured",
    source_url: "",
    tax_year: taxYear,
  };
}

export function getExpensesByCategory(expenses: RentalExpense[], propertyId: string) {
  return expenses.reduce<Array<{ category: RentalExpense["category"]; amount: number }>>((rows, expense) => {
    const amount = getAllocatedExpenseAmount(expense, propertyId);
    const existing = rows.find((row) => row.category === expense.category);
    if (existing) existing.amount += amount;
    else rows.push({ category: expense.category, amount });
    return rows;
  }, []);
}

export function getRentalReportIndex(rentalBook: RentalBook, propertyId: string, taxYear: number) {
  const propertySummary = getRentalPropertySummary(rentalBook, propertyId);
  const bookSummary = getRentalBookSummary(rentalBook, taxYear);
  const expenseRows = getExpensesByCategory(propertySummary.expenses, propertyId);
  const vendorPayments = propertySummary.expenses.reduce<Array<{ vendorId: string; amount: number }>>((rows, expense) => {
    const existing = rows.find((row) => row.vendorId === expense.vendor_id);
    if (existing) existing.amount += expense.amount;
    else rows.push({ vendorId: expense.vendor_id || "unassigned", amount: expense.amount });
    return rows;
  }, []);

  return [
    { label: "Property P/L", value: formatMoney(propertySummary.netIncome), detail: `${formatMoney(propertySummary.rentReceived)} rent - ${formatMoney(propertySummary.expenseTotal)} expenses` },
    { label: "Rent Received", value: formatMoney(propertySummary.rentReceived), detail: `${propertySummary.rents.length} rent records` },
    { label: "Expense Categories", value: String(expenseRows.length), detail: expenseRows.map((row) => `${row.category}: ${formatMoney(row.amount)}`).join(" / ") || "No expenses" },
    { label: "Repairs", value: String(propertySummary.workOrders.length), detail: `${propertySummary.openRepairs} open / ${propertySummary.completedRepairs} completed` },
    { label: "Vehicle Mileage", value: `${propertySummary.businessMiles} mi`, detail: `${formatMoney(bookSummary.standardMileageEstimate)} standard mileage estimate` },
    { label: "Vehicle Actual", value: formatMoney(bookSummary.actualVehicleExpenseEstimate), detail: `${Math.round(bookSummary.businessUsePercentage * 100)}% business use allocation` },
    { label: "Vendor Payments", value: String(vendorPayments.length), detail: vendorPayments.map((row) => `${row.vendorId}: ${formatMoney(row.amount)}`).join(" / ") || "No vendor payments" },
    { label: "Tax Summary", value: formatMoney(propertySummary.netIncome - bookSummary.standardMileageEstimate), detail: "P/L less standard mileage estimate, review before filing" },
    { label: "Receipt Index", value: String(propertySummary.documents.length), detail: `${propertySummary.documents.filter((document) => document.document_type === "receipt").length} receipts indexed` },
  ];
}

export function getVehicleSummaries(rentalBook: RentalBook, taxYear: number) {
  const mileageRate = getMileageRateForYear(rentalBook, taxYear);
  return rentalBook.vehicles.map((vehicle) => {
    const trips = rentalBook.vehicleTrips.filter((trip) => trip.vehicle_id === vehicle.vehicle_id);
    const expenses = rentalBook.vehicleExpenses.filter((expense) => expense.vehicle_id === vehicle.vehicle_id);
    const totalMiles = trips.reduce((total, trip) => total + trip.miles, 0);
    const businessMiles = trips.filter((trip) => trip.business_use).reduce((total, trip) => total + trip.miles, 0);
    const businessUsePercentage = totalMiles > 0 ? businessMiles / totalMiles : 0;
    const actualExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);
    const leaseAnnualAmount = vehicle.owned_or_leased === "leased" ? vehicle.lease_monthly_amount * 12 : 0;

    return {
      actualExpenseEstimate: actualExpenses * businessUsePercentage,
      businessMiles,
      businessUsePercentage,
      leaseAllocation: leaseAnnualAmount * businessUsePercentage,
      personalMiles: totalMiles - businessMiles,
      standardMileageEstimate: businessMiles * mileageRate.business_rate,
      totalMiles,
      tripCount: trips.length,
      vehicle,
    };
  });
}

function getAllocatedExpenseAmount(expense: RentalExpense, propertyId: string) {
  if (!expense.allocation_property_ids?.length) return expense.amount;
  return expense.allocation_property_ids.includes(propertyId) ? expense.amount / expense.allocation_property_ids.length : 0;
}
