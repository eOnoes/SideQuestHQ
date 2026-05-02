import type { AppView, Asset, IconName, Person, Quest, QuestType, Reminder, StepState } from "./types";

export const STORAGE_KEY = "sidequest-hq:quests:v1";
export const PEOPLE_STORAGE_KEY = "sidequest-hq:people:v1";
export const REMINDERS_STORAGE_KEY = "sidequest-hq:reminders:v1";
export const ASSETS_STORAGE_KEY = "sidequest-hq:assets:v1";

export const questTypePresets: Array<{
  type: QuestType;
  owner: string;
  target: string;
  summary: string;
  steps: Array<{ label: string; state: StepState }>;
}> = [
  {
    type: "Rental Property",
    owner: "Rental property",
    target: "Property health",
    summary: "Track rent, repairs, lease docs, reminders, and the people tied to this property.",
    steps: [
      { label: "Property profile", state: "Now" },
      { label: "Rent ledger", state: "Next" },
      { label: "Paper trail", state: "Next" },
    ],
  },
  {
    type: "Customer Build",
    owner: "Customer build",
    target: "Scope and payment lock",
    summary: "Track quote, deposits, customer updates, files, build costs, and delivery steps.",
    steps: [
      { label: "Scope captured", state: "Now" },
      { label: "Quote drafted", state: "Next" },
      { label: "Customer update", state: "Next" },
    ],
  },
  {
    type: "Build Project",
    owner: "Build project",
    target: "Materials and delivery",
    summary: "Track materials, labor, receipts, open balances, and next build actions.",
    steps: [
      { label: "Project created", state: "Done" },
      { label: "Materials tracked", state: "Now" },
      { label: "Final balance", state: "Next" },
    ],
  },
  {
    type: "Investment",
    owner: "Investment",
    target: "Track position notes",
    summary: "Track expected gains, contribution notes, check-ins, and paper trail without finance portal links.",
    steps: [
      { label: "Position noted", state: "Now" },
      { label: "Check-in reminder", state: "Next" },
      { label: "Paper trail", state: "Next" },
    ],
  },
  {
    type: "Personal Plan",
    owner: "Personal plan",
    target: "Keep the plan moving",
    summary: "Track tasks, reminders, notes, and supporting files for a personal goal.",
    steps: [
      { label: "Plan captured", state: "Now" },
      { label: "Next move", state: "Next" },
      { label: "Review date", state: "Next" },
    ],
  },
  {
    type: "Side Quest",
    owner: "Side quest",
    target: "Get it organized",
    summary: "Fresh quest. Add ledger rows, paper trail items, people, reminders, and next steps as the work gets clearer.",
    steps: [
      { label: "Quest created", state: "Done" },
      { label: "First ledger item", state: "Now" },
      { label: "Paper trail", state: "Next" },
    ],
  },
];

export function getQuestTypePreset(type: QuestType) {
  return questTypePresets.find((preset) => preset.type === type) ?? questTypePresets[questTypePresets.length - 1];
}

export const seedQuests: Quest[] = [
  {
    name: "Maple Street Rental",
    type: "Rental Property",
    status: "Active",
    nextMove: "Check rent receipt and schedule gutter inspection.",
    value: "$1,450 expected",
    progress: 75,
    tone: "active",
    owner: "Thomas",
    target: "Monthly rental health",
    due: "Next check: Tomorrow",
    summary: "Rent is expected, inspection is the next move, and this property needs a clean paper trail for maintenance spend.",
    ledger: [
      { label: "May rent", amount: "$1,450", state: "Open" },
      { label: "Gutter quote", amount: "$225", state: "Draft" },
      { label: "April rent", amount: "$1,450", state: "Paid" },
    ],
    papers: [
      { label: "Lease packet", meta: "PDF linked", state: "Filed" },
      { label: "Gutter photos", meta: "3 images", state: "Review" },
    ],
    steps: [
      { label: "Lease stored", state: "Done" },
      { label: "Rent receipt", state: "Now" },
      { label: "Inspection", state: "Next" },
    ],
    notes: ["Ask tenant for receipt screenshot if ACH clears late.", "Bundle gutter photos with quote before approving work."],
  },
  {
    name: "AI Estimate Builder",
    type: "Customer Build",
    status: "Discovery",
    nextMove: "Turn rough notes into milestone quote.",
    value: "$3,200 quoted",
    progress: 30,
    tone: "discovery",
    owner: "Customer build",
    target: "Quote and scope lock",
    due: "Next check: Today 4:00 PM",
    summary: "Needs a clean milestone quote from rough notes, then a customer update before the day closes.",
    ledger: [
      { label: "Discovery deposit", amount: "$500", state: "Paid" },
      { label: "Milestone 1", amount: "$1,200", state: "Draft" },
      { label: "Final delivery", amount: "$1,500", state: "Draft" },
    ],
    papers: [
      { label: "Deposit screenshot", meta: "Image upload", state: "Ready" },
      { label: "Scope notes", meta: "Manual notes", state: "Draft" },
    ],
    steps: [
      { label: "Discovery call", state: "Done" },
      { label: "Milestone quote", state: "Now" },
      { label: "Customer approval", state: "Next" },
    ],
    notes: ["Convert build notes into three clear phases.", "Keep quote friendly but exact: scope, payment points, delivery window."],
  },
  {
    name: "Shop Cabinet Run",
    type: "Build Project",
    status: "In Progress",
    nextMove: "Upload material receipts and confirm final balance.",
    value: "$780 open",
    progress: 60,
    tone: "progress",
    owner: "Personal build",
    target: "Close materials and balance",
    due: "Next check: This week",
    summary: "Materials are mostly known; this needs receipt cleanup and final balance confirmation before calling it done.",
    ledger: [
      { label: "Materials paid", amount: "$826", state: "Paid" },
      { label: "Customer balance", amount: "$780", state: "Open" },
      { label: "Hardware run", amount: "$92", state: "Draft" },
    ],
    papers: [
      { label: "Home Depot receipt", meta: "Photo upload", state: "Review" },
      { label: "Lumber quote", meta: "PDF linked", state: "Filed" },
    ],
    steps: [
      { label: "Design approved", state: "Done" },
      { label: "Receipt review", state: "Now" },
      { label: "Final invoice", state: "Next" },
    ],
    notes: ["Confirm whether hardware is included in current material total.", "Photo scan should create ledger draft, not auto-approve."],
  },
];

export const seedReminders: Reminder[] = [
  { label: "Send Friday customer update", quest: "AI Estimate Builder", due: "Today 4:00 PM", priority: "Important", done: false },
  { label: "Check rent payment", quest: "Maple Street Rental", due: "Tomorrow", priority: "Normal", done: false },
  { label: "Review material costs", quest: "Shop Cabinet Run", due: "This week", priority: "Quiet", done: false },
];

export const seedPeople: Person[] = [
  { name: "Tenant", role: "Maple Street Rental", quest: "Maple Street Rental", nextTouch: "Confirm May receipt", status: "Waiting" },
  { name: "Estimate customer", role: "Decision maker", quest: "AI Estimate Builder", nextTouch: "Friday update", status: "Active" },
  { name: "Lumber desk", role: "Vendor", quest: "Shop Cabinet Run", nextTouch: "Quote match", status: "Quiet" },
];

export const seedAssets: Asset[] = [
  { name: "Maple Street Rental", type: "Rental", value: "$185,000 est.", projected: "$1,450", frequency: "Monthly", status: "Producing" },
  { name: "401k Growth Bucket", type: "Retirement", value: "$0 tracked", projected: "$4,800", frequency: "Annual", status: "Watching" },
  { name: "Friend Business Stake", type: "Business", value: "$2,500 in", projected: "$300", frequency: "Monthly", status: "Planning" },
];

export const appViews: Array<{ label: AppView; icon: IconName }> = [
  { label: "Command", icon: "grid" },
  { label: "Quests", icon: "clipboard" },
  { label: "Assets", icon: "briefcase" },
  { label: "Ledger", icon: "dollar" },
  { label: "Paper Trail", icon: "file" },
  { label: "Reminders", icon: "bell" },
  { label: "People", icon: "people" },
];
