export type LedgerState = "Paid" | "Open" | "Draft";
export type StepState = "Done" | "Now" | "Next";
export type QuestType = "Rental Property" | "Customer Build" | "Build Project" | "Investment" | "Personal Plan" | "Side Quest";
export type AppView = "Command" | "Quests" | "Assets" | "Ledger" | "Paper Trail" | "Reminders" | "People";

export type Quest = {
  name: string;
  type: string;
  status: string;
  nextMove: string;
  value: string;
  progress: number;
  tone: "active" | "discovery" | "progress";
  owner: string;
  target: string;
  due: string;
  summary: string;
  ledger: Array<{ label: string; amount: string; state: LedgerState }>;
  papers: Array<{ label: string; meta: string; state: string }>;
  steps: Array<{ label: string; state: StepState }>;
  notes: string[];
};

export type Reminder = {
  label: string;
  quest: string;
  due: string;
  priority: "Quiet" | "Normal" | "Important";
  done: boolean;
};

export type PaperItem = {
  title: string;
  source: string;
  state: string;
  amount: string;
  kind: "image" | "file";
};

export type Person = {
  name: string;
  role: string;
  quest: string;
  nextTouch: string;
  status: "Active" | "Waiting" | "Quiet";
};

export type Asset = {
  name: string;
  type: "Rental" | "Business" | "Retirement" | "Build" | "Other";
  value: string;
  projected: string;
  frequency: "Monthly" | "Annual" | "One-time";
  status: "Producing" | "Watching" | "Planning";
};

export type IconName = "grid" | "clipboard" | "dollar" | "file" | "bell" | "people" | "scan" | "receipt" | "card" | "edit" | "image" | "plus" | "briefcase";
