"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

type LedgerState = "Paid" | "Open" | "Draft";
type StepState = "Done" | "Now" | "Next";
type QuestType = "Rental Property" | "Customer Build" | "Build Project" | "Investment" | "Personal Plan" | "Side Quest";
type AppView = "Command" | "Quests" | "Assets" | "Ledger" | "Paper Trail" | "Reminders" | "People";

type Quest = {
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

type Reminder = {
  label: string;
  quest: string;
  due: string;
  priority: "Quiet" | "Normal" | "Important";
  done: boolean;
};

type PaperItem = {
  title: string;
  source: string;
  state: string;
  amount: string;
  kind: "image" | "file";
};

type Person = {
  name: string;
  role: string;
  quest: string;
  nextTouch: string;
  status: "Active" | "Waiting" | "Quiet";
};

type Asset = {
  name: string;
  type: "Rental" | "Business" | "Retirement" | "Build" | "Other";
  value: string;
  projected: string;
  frequency: "Monthly" | "Annual" | "One-time";
  status: "Producing" | "Watching" | "Planning";
};

const STORAGE_KEY = "sidequest-hq:quests:v1";
const PEOPLE_STORAGE_KEY = "sidequest-hq:people:v1";
const REMINDERS_STORAGE_KEY = "sidequest-hq:reminders:v1";
const ASSETS_STORAGE_KEY = "sidequest-hq:assets:v1";

const questTypePresets: Array<{
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

function getQuestTypePreset(type: QuestType) {
  return questTypePresets.find((preset) => preset.type === type) ?? questTypePresets[questTypePresets.length - 1];
}

const seedQuests: Quest[] = [
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

const seedReminders: Reminder[] = [
  { label: "Send Friday customer update", quest: "AI Estimate Builder", due: "Today 4:00 PM", priority: "Important", done: false },
  { label: "Check rent payment", quest: "Maple Street Rental", due: "Tomorrow", priority: "Normal", done: false },
  { label: "Review material costs", quest: "Shop Cabinet Run", due: "This week", priority: "Quiet", done: false },
];

const seedPeople: Person[] = [
  { name: "Tenant", role: "Maple Street Rental", quest: "Maple Street Rental", nextTouch: "Confirm May receipt", status: "Waiting" },
  { name: "Estimate customer", role: "Decision maker", quest: "AI Estimate Builder", nextTouch: "Friday update", status: "Active" },
  { name: "Lumber desk", role: "Vendor", quest: "Shop Cabinet Run", nextTouch: "Quote match", status: "Quiet" },
];

const seedAssets: Asset[] = [
  { name: "Maple Street Rental", type: "Rental", value: "$185,000 est.", projected: "$1,450", frequency: "Monthly", status: "Producing" },
  { name: "401k Growth Bucket", type: "Retirement", value: "$0 tracked", projected: "$4,800", frequency: "Annual", status: "Watching" },
  { name: "Friend Business Stake", type: "Business", value: "$2,500 in", projected: "$300", frequency: "Monthly", status: "Planning" },
];

type IconName = "grid" | "clipboard" | "dollar" | "file" | "bell" | "people" | "scan" | "receipt" | "card" | "edit" | "image" | "plus" | "briefcase";

const appViews: Array<{ label: AppView; icon: IconName }> = [
  { label: "Command", icon: "grid" },
  { label: "Quests", icon: "clipboard" },
  { label: "Assets", icon: "briefcase" },
  { label: "Ledger", icon: "dollar" },
  { label: "Paper Trail", icon: "file" },
  { label: "Reminders", icon: "bell" },
  { label: "People", icon: "people" },
];

function parseMoney(value: string) {
  const amount = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0, style: "currency", currency: "USD" }).format(value);
}

function getMonthlyProjection(asset: Asset) {
  const amount = parseMoney(asset.projected);
  if (asset.frequency === "Annual") return amount / 12;
  if (asset.frequency === "One-time") return 0;
  return amount;
}

function getMoneyRows(questList: Quest[]): Array<{
  label: string;
  value: string;
  trend: string;
  trendTone: "up" | "down" | "neutral";
  icon: IconName;
}> {
  const openEntries = questList.flatMap((quest) => quest.ledger.filter((entry) => entry.state === "Open"));
  const paidEntries = questList.flatMap((quest) => quest.ledger.filter((entry) => entry.state === "Paid"));
  const draftEntries = questList.flatMap((quest) => quest.ledger.filter((entry) => entry.state === "Draft"));
  const reviewPapers = questList.flatMap((quest) => quest.papers.filter((paper) => paper.state.toLowerCase().includes("review") || paper.state.toLowerCase().includes("draft")));

  return [
    { label: "Expected In", value: formatMoney(openEntries.reduce((total, entry) => total + parseMoney(entry.amount), 0)), trend: `${openEntries.length} open`, trendTone: "up", icon: "dollar" },
    { label: "Open Balances", value: formatMoney(draftEntries.reduce((total, entry) => total + parseMoney(entry.amount), 0)), trend: `${draftEntries.length} drafts`, trendTone: "down", icon: "receipt" },
    { label: "Recent Paid", value: formatMoney(paidEntries.reduce((total, entry) => total + parseMoney(entry.amount), 0)), trend: `${paidEntries.length} logged`, trendTone: "neutral", icon: "card" },
    { label: "Paper Trail Drafts", value: String(reviewPapers.length), trend: "Needs review", trendTone: "neutral", icon: "edit" },
  ];
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    grid: (
      <>
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h3A1.5 1.5 0 0 1 10 5.5v3A1.5 1.5 0 0 1 8.5 10h-3A1.5 1.5 0 0 1 4 8.5z" />
        <path d="M14 5.5A1.5 1.5 0 0 1 15.5 4h3A1.5 1.5 0 0 1 20 5.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 14 8.5z" />
        <path d="M4 15.5A1.5 1.5 0 0 1 5.5 14h3a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 8.5 20h-3A1.5 1.5 0 0 1 4 18.5z" />
        <path d="M14 15.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5z" />
      </>
    ),
    clipboard: (
      <>
        <path d="M9 5h6" />
        <path d="M9 4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6H9z" />
        <path d="M7 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </>
    ),
    dollar: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v10" />
        <path d="M15 9.5C14.2 8.7 13.2 8.3 12 8.3c-1.8 0-3 .8-3 2 0 1.4 1.4 1.8 3 2.1s3 .7 3 2.1c0 1.2-1.2 2-3 2-1.3 0-2.4-.4-3.2-1.3" />
      </>
    ),
    file: (
      <>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h6" />
      </>
    ),
    bell: (
      <>
        <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </>
    ),
    people: (
      <>
        <path d="M16 11a4 4 0 1 0-8 0" />
        <path d="M4 20a8 8 0 0 1 16 0" />
        <path d="M19 11.5a3 3 0 0 1 3 3" />
        <path d="M2 14.5a3 3 0 0 1 3-3" />
      </>
    ),
    scan: (
      <>
        <path d="M4 7V4h3" />
        <path d="M17 4h3v3" />
        <path d="M20 17v3h-3" />
        <path d="M7 20H4v-3" />
        <path d="M8 12h8" />
      </>
    ),
    receipt: (
      <>
        <path d="M7 3h10v18l-2-1-2 1-2-1-2 1-2-1z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </>
    ),
    card: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h2" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" />
      </>
    ),
    image: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M8 13l2.5-2.5L15 15" />
        <path d="M14 13l1.5-1.5L20 16" />
        <circle cx="9" cy="9" r="1" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    briefcase: (
      <>
        <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        <path d="M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
        <path d="M4 12h16" />
      </>
    ),
  };

  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

export default function Home() {
  const [questList, setQuestList] = useState<Quest[]>(seedQuests);
  const [selectedQuestIndex, setSelectedQuestIndex] = useState(0);
  const [hasLoadedStoredData, setHasLoadedStoredData] = useState(false);
  const [showQuestComposer, setShowQuestComposer] = useState(false);
  const [activeView, setActiveView] = useState<AppView>("Command");
  const [questDraft, setQuestDraft] = useState<{ name: string; type: QuestType; value: string; due: string }>({ name: "", type: "Rental Property", value: "", due: "" });
  const [ledgerDraft, setLedgerDraft] = useState<{ label: string; amount: string; state: LedgerState }>({ label: "", amount: "", state: "Draft" });
  const [paperDraft, setPaperDraft] = useState({ label: "", meta: "", state: "Review" });
  const [peopleList, setPeopleList] = useState<Person[]>(seedPeople);
  const [personDraft, setPersonDraft] = useState({ name: "", role: "", nextTouch: "" });
  const [reminderList, setReminderList] = useState<Reminder[]>(seedReminders);
  const [reminderDraft, setReminderDraft] = useState({ label: "", due: "", priority: "Normal" as Reminder["priority"] });
  const [assetList, setAssetList] = useState<Asset[]>(seedAssets);
  const [assetDraft, setAssetDraft] = useState<Asset>({ name: "", type: "Rental", value: "", projected: "", frequency: "Monthly", status: "Producing" });
  const [noteDraft, setNoteDraft] = useState("");
  const selectedQuest = questList[Math.min(selectedQuestIndex, questList.length - 1)] ?? seedQuests[0];
  const moneyRows = useMemo(() => getMoneyRows(questList), [questList]);
  const selectedPeople = useMemo(() => peopleList.filter((person) => person.quest === selectedQuest.name), [peopleList, selectedQuest.name]);
  const peopleRows = useMemo(
    () =>
      peopleList.map((person, personIndex) => ({
        ...person,
        personIndex,
        questIndex: questList.findIndex((quest) => quest.name === person.quest),
      })),
    [peopleList, questList],
  );
  const peopleSummary = useMemo(
    () => ({
      active: peopleRows.filter((person) => person.status === "Active").length,
      quiet: peopleRows.filter((person) => person.status === "Quiet").length,
      waiting: peopleRows.filter((person) => person.status === "Waiting").length,
    }),
    [peopleRows],
  );
  const activeReminders = useMemo(() => reminderList.filter((reminder) => !reminder.done).slice(0, 4), [reminderList]);
  const reminderRows = useMemo(
    () =>
      reminderList.map((reminder, reminderIndex) => ({
        ...reminder,
        reminderIndex,
        questIndex: questList.findIndex((quest) => quest.name === reminder.quest),
      })),
    [questList, reminderList],
  );
  const reminderSummary = useMemo(
    () => ({
      active: reminderRows.filter((reminder) => !reminder.done).length,
      done: reminderRows.filter((reminder) => reminder.done).length,
      important: reminderRows.filter((reminder) => !reminder.done && reminder.priority === "Important").length,
    }),
    [reminderRows],
  );
  const ledgerRows = useMemo(
    () =>
      questList.flatMap((quest, questIndex) =>
        quest.ledger.map((entry, entryIndex) => ({
          ...entry,
          entryIndex,
          questIndex,
          questName: quest.name,
          questType: quest.type,
        })),
      ),
    [questList],
  );
  const ledgerSummary = useMemo(() => {
    const totalByState = (state: LedgerState) =>
      ledgerRows.filter((entry) => entry.state === state).reduce((total, entry) => total + parseMoney(entry.amount), 0);
    return {
      draft: totalByState("Draft"),
      open: totalByState("Open"),
      paid: totalByState("Paid"),
    };
  }, [ledgerRows]);
  const paperRows = useMemo(
    () =>
      questList.flatMap((quest, questIndex) =>
        quest.papers.map((paper, paperIndex) => ({
          ...paper,
          kind: paper.meta.toLowerCase().includes("image") || paper.meta.toLowerCase().includes("photo") ? "image" as const : "file" as const,
          paperIndex,
          questIndex,
          questName: quest.name,
          questType: quest.type,
        })),
      ),
    [questList],
  );
  const paperSummary = useMemo(() => {
    const reviewCount = paperRows.filter((paper) => paper.state.toLowerCase().includes("review") || paper.state.toLowerCase().includes("draft")).length;
    const filedCount = paperRows.filter((paper) => paper.state.toLowerCase().includes("filed")).length;
    const readyCount = paperRows.filter((paper) => paper.state.toLowerCase().includes("ready")).length;
    return { filedCount, readyCount, reviewCount };
  }, [paperRows]);
  const assetSummary = useMemo(() => {
    const monthlyProjected = assetList.reduce((total, asset) => total + getMonthlyProjection(asset), 0);
    return {
      activeCount: assetList.filter((asset) => asset.status === "Producing").length,
      monthlyProjected,
      annualProjected: monthlyProjected * 12,
    };
  }, [assetList]);
  const paperQueue = useMemo<PaperItem[]>(() => {
    const items = questList.flatMap((quest) =>
      quest.papers.map((paper) => ({
        title: paper.label,
        source: quest.name,
        state: paper.state,
        amount: quest.ledger[0]?.amount ?? "$0",
        kind: paper.meta.toLowerCase().includes("image") || paper.meta.toLowerCase().includes("photo") ? "image" as const : "file" as const,
      })),
    );

    return items.slice(0, 3);
  }, [questList]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Quest[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuestList(parsed);
        }
      }

      const storedPeople = window.localStorage.getItem(PEOPLE_STORAGE_KEY);
      if (storedPeople) {
        const parsedPeople = JSON.parse(storedPeople) as Person[];
        if (Array.isArray(parsedPeople)) {
          setPeopleList(parsedPeople);
        }
      }

      const storedReminders = window.localStorage.getItem(REMINDERS_STORAGE_KEY);
      if (storedReminders) {
        const parsedReminders = JSON.parse(storedReminders) as Reminder[];
        if (Array.isArray(parsedReminders)) {
          setReminderList(parsedReminders);
        }
      }

      const storedAssets = window.localStorage.getItem(ASSETS_STORAGE_KEY);
      if (storedAssets) {
        const parsedAssets = JSON.parse(storedAssets) as Asset[];
        if (Array.isArray(parsedAssets)) {
          setAssetList(parsedAssets);
        }
      }
    } catch {
      setQuestList(seedQuests);
      setPeopleList(seedPeople);
      setReminderList(seedReminders);
      setAssetList(seedAssets);
    } finally {
      setHasLoadedStoredData(true);
    }
  }, []);

  useEffect(() => {
    if (hasLoadedStoredData) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(questList));
      window.localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(peopleList));
      window.localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminderList));
      window.localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(assetList));
    }
  }, [assetList, hasLoadedStoredData, peopleList, questList, reminderList]);

  function updateSelectedQuest(updater: (quest: Quest) => Quest) {
    setQuestList((current) => current.map((quest, index) => (index === selectedQuestIndex ? updater(quest) : quest)));
  }

  function addQuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = questDraft.name.trim();
    if (!name) return;
    const preset = getQuestTypePreset(questDraft.type);

    const nextQuest: Quest = {
      name,
      type: preset.type,
      status: "Discovery",
      nextMove: preset.steps.find((step) => step.state === "Now")?.label ?? "Capture the first move.",
      value: questDraft.value.trim() || "$0 tracked",
      progress: 10,
      tone: "discovery",
      owner: preset.owner,
      target: preset.target,
      due: questDraft.due.trim() || "Next check: Soon",
      summary: preset.summary,
      ledger: [],
      papers: [],
      steps: preset.steps,
      notes: ["Fresh quest created. Add the first note when the next move is clear."],
    };

    setQuestList((current) => [...current, nextQuest]);
    setSelectedQuestIndex(questList.length);
    setQuestDraft({ name: "", type: "Rental Property", value: "", due: "" });
    setShowQuestComposer(false);
    setActiveView("Quests");
  }

  function addLedgerEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = ledgerDraft.label.trim();
    if (!label) return;

    updateSelectedQuest((quest) => ({
      ...quest,
      ledger: [...quest.ledger, { label, amount: ledgerDraft.amount.trim() || "$0", state: ledgerDraft.state }],
    }));
    setLedgerDraft({ label: "", amount: "", state: "Draft" });
  }

  function addPaperItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = paperDraft.label.trim();
    if (!label) return;

    updateSelectedQuest((quest) => ({
      ...quest,
      papers: [...quest.papers, { label, meta: paperDraft.meta.trim() || "Manual entry", state: paperDraft.state.trim() || "Review" }],
    }));
    setPaperDraft({ label: "", meta: "", state: "Review" });
  }

  function addAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = assetDraft.name.trim();
    if (!name) return;

    setAssetList((current) => [
      {
        ...assetDraft,
        name,
        value: assetDraft.value.trim() || "$0 tracked",
        projected: assetDraft.projected.trim() || "$0",
      },
      ...current,
    ]);
    setAssetDraft({ name: "", type: "Rental", value: "", projected: "", frequency: "Monthly", status: "Producing" });
  }

  function cycleAssetStatus(assetIndex: number) {
    const order: Asset["status"][] = ["Producing", "Watching", "Planning"];
    setAssetList((current) =>
      current.map((asset, index) => (index === assetIndex ? { ...asset, status: order[(order.indexOf(asset.status) + 1) % order.length] } : asset)),
    );
  }

  function cycleLedgerState(entryIndex: number) {
    cycleLedgerStateAt(selectedQuestIndex, entryIndex);
  }

  function cycleLedgerStateAt(questIndex: number, entryIndex: number) {
    const order: LedgerState[] = ["Draft", "Open", "Paid"];
    setQuestList((current) =>
      current.map((quest, index) => {
        if (index !== questIndex) return quest;
        return {
          ...quest,
          ledger: quest.ledger.map((entry, ledgerIndex) => {
            if (ledgerIndex !== entryIndex) return entry;
            const nextState = order[(order.indexOf(entry.state) + 1) % order.length];
            return { ...entry, state: nextState };
          }),
        };
      }),
    );
  }

  function cyclePaperState(paperIndex: number) {
    cyclePaperStateAt(selectedQuestIndex, paperIndex);
  }

  function cyclePaperStateAt(questIndex: number, paperIndex: number) {
    const order = ["Review", "Ready", "Filed"];
    setQuestList((current) =>
      current.map((quest, index) => {
        if (index !== questIndex) return quest;
        return {
          ...quest,
          papers: quest.papers.map((paper, currentPaperIndex) => {
            if (currentPaperIndex !== paperIndex) return paper;
            const currentIndex = order.findIndex((state) => state.toLowerCase() === paper.state.toLowerCase());
            return { ...paper, state: order[((currentIndex === -1 ? 0 : currentIndex) + 1) % order.length] };
          }),
        };
      }),
    );
  }

  function advanceStep(stepIndex: number) {
    const order: StepState[] = ["Next", "Now", "Done"];
    updateSelectedQuest((quest) => ({
      ...quest,
      steps: quest.steps.map((step, index) => {
        if (index !== stepIndex) return step;
        const nextState = order[(order.indexOf(step.state) + 1) % order.length];
        return { ...step, state: nextState };
      }),
      progress: Math.round((quest.steps.filter((step, index) => (index === stepIndex ? order[(order.indexOf(step.state) + 1) % order.length] === "Done" : step.state === "Done")).length / Math.max(quest.steps.length, 1)) * 100),
    }));
  }

  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const note = noteDraft.trim();
    if (!note) return;

    updateSelectedQuest((quest) => ({ ...quest, notes: [note, ...quest.notes].slice(0, 4) }));
    setNoteDraft("");
  }

  function addPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = personDraft.name.trim();
    if (!name) return;

    setPeopleList((current) => [
      ...current,
      {
        name,
        role: personDraft.role.trim() || "Contact",
        quest: selectedQuest.name,
        nextTouch: personDraft.nextTouch.trim() || "No next touch set",
        status: "Active",
      },
    ]);
    setPersonDraft({ name: "", role: "", nextTouch: "" });
  }

  function cyclePersonStatus(personIndex: number) {
    const selectedIndexes = peopleList
      .map((person, index) => ({ person, index }))
      .filter(({ person }) => person.quest === selectedQuest.name)
      .map(({ index }) => index);
    const targetIndex = selectedIndexes[personIndex];
    if (targetIndex === undefined) return;

    cyclePersonStatusAt(targetIndex);
  }

  function cyclePersonStatusAt(personIndex: number) {
    const order: Person["status"][] = ["Active", "Waiting", "Quiet"];
    setPeopleList((current) =>
      current.map((person, index) => (index === personIndex ? { ...person, status: order[(order.indexOf(person.status) + 1) % order.length] } : person)),
    );
  }

  function removePerson(personIndex: number) {
    const selectedIndexes = peopleList
      .map((person, index) => ({ person, index }))
      .filter(({ person }) => person.quest === selectedQuest.name)
      .map(({ index }) => index);
    const targetIndex = selectedIndexes[personIndex];
    if (targetIndex === undefined) return;

    setPeopleList((current) => current.filter((_, index) => index !== targetIndex));
  }

  function removePersonAt(personIndex: number) {
    setPeopleList((current) => current.filter((_, index) => index !== personIndex));
  }

  function addReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = reminderDraft.label.trim();
    if (!label) return;

    setReminderList((current) => [
      {
        label,
        quest: selectedQuest.name,
        due: reminderDraft.due.trim() || "Soon",
        priority: reminderDraft.priority,
        done: false,
      },
      ...current,
    ]);
    setReminderDraft({ label: "", due: "", priority: "Normal" });
  }

  function toggleReminderDone(reminderLabel: string, questName: string) {
    const reminderIndex = reminderList.findIndex((reminder) => reminder.label === reminderLabel && reminder.quest === questName);
    if (reminderIndex !== -1) toggleReminderDoneAt(reminderIndex);
  }

  function toggleReminderDoneAt(reminderIndex: number) {
    setReminderList((current) =>
      current.map((reminder, index) => (index === reminderIndex ? { ...reminder, done: !reminder.done } : reminder)),
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary">
        <div className="brand">
          <span className="brand-mark">SQ</span>
          <div>
            <strong>SideQuest HQ</strong>
            <span>Private command center</span>
          </div>
        </div>

        <nav className="nav-list">
          {appViews.map((view) => (
            <button
              className={`nav-item${activeView === view.label ? " nav-item-active" : ""}`}
              key={view.label}
              onClick={() => setActiveView(view.label)}
              type="button"
            >
              <Icon name={view.icon} />
              <span>{view.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" />
          <span>Local prototype</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{activeView}</p>
            <h1>{activeView === "Command" ? "Today's side quests" : `${activeView} workspace`}</h1>
          </div>
          <div className="topbar-actions">
            <button type="button" className="icon-button" aria-label="Scan paper trail"><Icon name="scan" />Scan</button>
            <button type="button" className="primary-button" onClick={() => setShowQuestComposer((isOpen) => !isOpen)}>New Quest</button>
          </div>
        </header>

        {showQuestComposer ? (
          <form className="quest-composer" onSubmit={addQuest}>
            <input
              aria-label="Quest name"
              onChange={(event) => setQuestDraft((draft) => ({ ...draft, name: event.target.value }))}
              placeholder="Quest name"
              value={questDraft.name}
            />
            <select
              aria-label="Quest type"
              onChange={(event) => setQuestDraft((draft) => ({ ...draft, type: event.target.value as QuestType }))}
              value={questDraft.type}
            >
              {questTypePresets.map((preset) => (
                <option key={preset.type}>{preset.type}</option>
              ))}
            </select>
            <input
              aria-label="Tracked value"
              onChange={(event) => setQuestDraft((draft) => ({ ...draft, value: event.target.value }))}
              placeholder="$0 tracked"
              value={questDraft.value}
            />
            <input
              aria-label="Next check"
              onChange={(event) => setQuestDraft((draft) => ({ ...draft, due: event.target.value }))}
              placeholder="Next check"
              value={questDraft.due}
            />
            <button type="submit">Add</button>
          </form>
        ) : null}

        {activeView === "Command" ? (
          <>
        <section className="summary-strip" aria-label="Money summary">
          {moneyRows.map((metric) => (
            <div className="metric" key={metric.label}>
              <span><Icon name={metric.icon} />{metric.label}</span>
              <strong>{metric.value}</strong>
              <small data-trend={metric.trendTone}>{metric.trend}</small>
            </div>
          ))}
        </section>

        <section className="dashboard-grid" id="command">
          <div className="panel panel-large">
            <div className="panel-header">
              <h2>Needs Attention</h2>
              <span>{activeReminders.length} active</span>
            </div>
            <form className="reminder-form" onSubmit={addReminder}>
              <input
                aria-label="Reminder label"
                onChange={(event) => setReminderDraft((draft) => ({ ...draft, label: event.target.value }))}
                placeholder={`Remind me for ${selectedQuest.name}`}
                value={reminderDraft.label}
              />
              <input
                aria-label="Reminder due"
                onChange={(event) => setReminderDraft((draft) => ({ ...draft, due: event.target.value }))}
                placeholder="Due"
                value={reminderDraft.due}
              />
              <select
                aria-label="Reminder priority"
                onChange={(event) => setReminderDraft((draft) => ({ ...draft, priority: event.target.value as Reminder["priority"] }))}
                value={reminderDraft.priority}
              >
                <option>Quiet</option>
                <option>Normal</option>
                <option>Important</option>
              </select>
              <button aria-label="Add reminder" type="submit">+</button>
            </form>
            <div className="attention-list">
              {activeReminders.map((reminder) => (
                <article className="attention-item" key={reminder.label}>
                  <button className="task-check" onClick={() => toggleReminderDone(reminder.label, reminder.quest)} type="button" aria-label={`Complete ${reminder.label}`} />
                  <div>
                    <strong>{reminder.label}</strong>
                    <span>{reminder.quest}</span>
                  </div>
                  <div className="attention-meta">
                    <span>{reminder.due}</span>
                    <b data-priority={reminder.priority}>{reminder.priority}</b>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="panel" id="paper-trail">
            <div className="panel-header">
              <h2>Paper Trail</h2>
              <span>AI review queue</span>
            </div>
            <div className="paper-list">
              {paperQueue.map((item) => (
                <article className="paper-item" key={item.title}>
                  <span className="paper-icon"><Icon name={item.kind === "image" ? "image" : "file"} /></span>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.source}</span>
                  </div>
                  <div>
                    <b>{item.amount}</b>
                    <span>{item.state}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

          </>
        ) : null}

        {activeView === "Ledger" ? (
        <section className="ledger-section panel">
          <div className="panel-header">
            <h2>Ledger</h2>
            <span>{ledgerRows.length} entries</span>
          </div>

          <div className="ledger-board">
            <form className="ledger-form" onSubmit={addLedgerEntry}>
              <select
                aria-label="Ledger quest"
                onChange={(event) => setSelectedQuestIndex(Number(event.target.value))}
                value={selectedQuestIndex}
              >
                {questList.map((quest, index) => (
                  <option key={quest.name} value={index}>{quest.name}</option>
                ))}
              </select>
              <input
                aria-label="Ledger label"
                onChange={(event) => setLedgerDraft((draft) => ({ ...draft, label: event.target.value }))}
                placeholder="Ledger label"
                value={ledgerDraft.label}
              />
              <input
                aria-label="Ledger amount"
                onChange={(event) => setLedgerDraft((draft) => ({ ...draft, amount: event.target.value }))}
                placeholder="$0"
                value={ledgerDraft.amount}
              />
              <select
                aria-label="Ledger state"
                onChange={(event) => setLedgerDraft((draft) => ({ ...draft, state: event.target.value as LedgerState }))}
                value={ledgerDraft.state}
              >
                <option>Draft</option>
                <option>Open</option>
                <option>Paid</option>
              </select>
              <button type="submit">Add</button>
            </form>

            <div className="ledger-total-strip">
              <div>
                <span>Open</span>
                <strong>{formatMoney(ledgerSummary.open)}</strong>
              </div>
              <div>
                <span>Draft</span>
                <strong>{formatMoney(ledgerSummary.draft)}</strong>
              </div>
              <div>
                <span>Paid</span>
                <strong>{formatMoney(ledgerSummary.paid)}</strong>
              </div>
            </div>

            <div className="ledger-list">
              {ledgerRows.map((entry) => (
                <article className="ledger-row" data-state={entry.state} key={`${entry.questName}-${entry.label}-${entry.entryIndex}`}>
                  <div>
                    <span>{entry.questType}</span>
                    <strong>{entry.questName}</strong>
                  </div>
                  <div>
                    <span>{entry.label}</span>
                    <strong>{entry.amount}</strong>
                  </div>
                  <button data-state={entry.state} onClick={() => cycleLedgerStateAt(entry.questIndex, entry.entryIndex)} type="button">{entry.state}</button>
                  <button className="open-quest-button" onClick={() => { setSelectedQuestIndex(entry.questIndex); setActiveView("Quests"); }} type="button">Open Quest</button>
                </article>
              ))}
            </div>
          </div>
        </section>
        ) : null}

        {activeView === "Paper Trail" ? (
        <section className="paper-workspace panel">
          <div className="panel-header">
            <h2>Paper Trail</h2>
            <span>{paperRows.length} items</span>
          </div>

          <div className="paper-board">
            <form className="paper-form" onSubmit={addPaperItem}>
              <select
                aria-label="Paper trail quest"
                onChange={(event) => setSelectedQuestIndex(Number(event.target.value))}
                value={selectedQuestIndex}
              >
                {questList.map((quest, index) => (
                  <option key={quest.name} value={index}>{quest.name}</option>
                ))}
              </select>
              <input
                aria-label="Paper trail label"
                onChange={(event) => setPaperDraft((draft) => ({ ...draft, label: event.target.value }))}
                placeholder="Receipt, photo, PDF..."
                value={paperDraft.label}
              />
              <input
                aria-label="Paper trail meta"
                onChange={(event) => setPaperDraft((draft) => ({ ...draft, meta: event.target.value }))}
                placeholder="Photo, PDF, screenshot..."
                value={paperDraft.meta}
              />
              <select
                aria-label="Paper trail state"
                onChange={(event) => setPaperDraft((draft) => ({ ...draft, state: event.target.value }))}
                value={paperDraft.state}
              >
                <option>Review</option>
                <option>Ready</option>
                <option>Filed</option>
                <option>Draft</option>
              </select>
              <button type="submit">Add</button>
            </form>

            <div className="paper-total-strip">
              <div>
                <span>Needs review</span>
                <strong>{paperSummary.reviewCount}</strong>
              </div>
              <div>
                <span>Ready</span>
                <strong>{paperSummary.readyCount}</strong>
              </div>
              <div>
                <span>Filed</span>
                <strong>{paperSummary.filedCount}</strong>
              </div>
            </div>

            <div className="paper-workspace-list">
              {paperRows.map((paper) => (
                <article className="paper-workspace-row" key={`${paper.questName}-${paper.label}-${paper.paperIndex}`}>
                  <span className="paper-icon"><Icon name={paper.kind === "image" ? "image" : "file"} /></span>
                  <div>
                    <span>{paper.questType}</span>
                    <strong>{paper.questName}</strong>
                  </div>
                  <div>
                    <span>{paper.label}</span>
                    <strong>{paper.meta}</strong>
                  </div>
                  <button data-state={paper.state} onClick={() => cyclePaperStateAt(paper.questIndex, paper.paperIndex)} type="button">{paper.state}</button>
                  <button className="open-quest-button" onClick={() => { setSelectedQuestIndex(paper.questIndex); setActiveView("Quests"); }} type="button">Open Quest</button>
                </article>
              ))}
            </div>
          </div>
        </section>
        ) : null}

        {activeView === "Reminders" ? (
        <section className="reminders-workspace panel">
          <div className="panel-header">
            <h2>Reminders</h2>
            <span>{reminderSummary.active} active</span>
          </div>

          <div className="reminders-board">
            <form className="reminders-workspace-form" onSubmit={addReminder}>
              <select
                aria-label="Reminder quest"
                onChange={(event) => setSelectedQuestIndex(Number(event.target.value))}
                value={selectedQuestIndex}
              >
                {questList.map((quest, index) => (
                  <option key={quest.name} value={index}>{quest.name}</option>
                ))}
              </select>
              <input
                aria-label="Reminder label"
                onChange={(event) => setReminderDraft((draft) => ({ ...draft, label: event.target.value }))}
                placeholder="Reminder"
                value={reminderDraft.label}
              />
              <input
                aria-label="Reminder due"
                onChange={(event) => setReminderDraft((draft) => ({ ...draft, due: event.target.value }))}
                placeholder="Due"
                value={reminderDraft.due}
              />
              <select
                aria-label="Reminder priority"
                onChange={(event) => setReminderDraft((draft) => ({ ...draft, priority: event.target.value as Reminder["priority"] }))}
                value={reminderDraft.priority}
              >
                <option>Quiet</option>
                <option>Normal</option>
                <option>Important</option>
              </select>
              <button type="submit">Add</button>
            </form>

            <div className="reminder-total-strip">
              <div>
                <span>Important</span>
                <strong>{reminderSummary.important}</strong>
              </div>
              <div>
                <span>Active</span>
                <strong>{reminderSummary.active}</strong>
              </div>
              <div>
                <span>Done</span>
                <strong>{reminderSummary.done}</strong>
              </div>
            </div>

            <div className="reminder-workspace-list">
              {reminderRows.map((reminder) => (
                <article className="reminder-workspace-row" data-done={reminder.done} key={`${reminder.quest}-${reminder.label}-${reminder.reminderIndex}`}>
                  <button className="task-check" onClick={() => toggleReminderDoneAt(reminder.reminderIndex)} type="button" aria-label={`${reminder.done ? "Reopen" : "Complete"} ${reminder.label}`} />
                  <div>
                    <span>{reminder.quest}</span>
                    <strong>{reminder.label}</strong>
                  </div>
                  <div>
                    <span>{reminder.due}</span>
                    <strong data-priority={reminder.priority}>{reminder.priority}</strong>
                  </div>
                  <button data-state={reminder.done ? "Done" : "Open"} onClick={() => toggleReminderDoneAt(reminder.reminderIndex)} type="button">{reminder.done ? "Done" : "Open"}</button>
                  <button className="open-quest-button" onClick={() => { if (reminder.questIndex >= 0) setSelectedQuestIndex(reminder.questIndex); setActiveView("Quests"); }} type="button">Open Quest</button>
                </article>
              ))}
            </div>
          </div>
        </section>
        ) : null}

        {activeView === "People" ? (
        <section className="people-workspace panel">
          <div className="panel-header">
            <h2>People</h2>
            <span>{peopleRows.length} contacts</span>
          </div>

          <div className="people-board">
            <form className="people-workspace-form" onSubmit={addPerson}>
              <select
                aria-label="Person quest"
                onChange={(event) => setSelectedQuestIndex(Number(event.target.value))}
                value={selectedQuestIndex}
              >
                {questList.map((quest, index) => (
                  <option key={quest.name} value={index}>{quest.name}</option>
                ))}
              </select>
              <input
                aria-label="Person name"
                onChange={(event) => setPersonDraft((draft) => ({ ...draft, name: event.target.value }))}
                placeholder="Name"
                value={personDraft.name}
              />
              <input
                aria-label="Person role"
                onChange={(event) => setPersonDraft((draft) => ({ ...draft, role: event.target.value }))}
                placeholder="Role"
                value={personDraft.role}
              />
              <input
                aria-label="Next touch"
                onChange={(event) => setPersonDraft((draft) => ({ ...draft, nextTouch: event.target.value }))}
                placeholder="Next touch"
                value={personDraft.nextTouch}
              />
              <button type="submit">Add</button>
            </form>

            <div className="people-total-strip">
              <div>
                <span>Active</span>
                <strong>{peopleSummary.active}</strong>
              </div>
              <div>
                <span>Waiting</span>
                <strong>{peopleSummary.waiting}</strong>
              </div>
              <div>
                <span>Quiet</span>
                <strong>{peopleSummary.quiet}</strong>
              </div>
            </div>

            <div className="people-workspace-list">
              {peopleRows.map((person) => (
                <article className="people-workspace-row" key={`${person.name}-${person.role}-${person.personIndex}`}>
                  <div>
                    <span>{person.quest}</span>
                    <strong>{person.name}</strong>
                  </div>
                  <div>
                    <span>{person.role}</span>
                    <strong>{person.nextTouch}</strong>
                  </div>
                  <button data-status={person.status} onClick={() => cyclePersonStatusAt(person.personIndex)} type="button">{person.status}</button>
                  <button className="open-quest-button" onClick={() => { if (person.questIndex >= 0) setSelectedQuestIndex(person.questIndex); setActiveView("Quests"); }} type="button">Open Quest</button>
                  <button className="remove-person-workspace" onClick={() => removePersonAt(person.personIndex)} type="button" aria-label={`Remove ${person.name}`}>Remove</button>
                </article>
              ))}
            </div>
          </div>
        </section>
        ) : null}

        {activeView !== "Command" && activeView !== "Assets" && activeView !== "Ledger" && activeView !== "Paper Trail" && activeView !== "Reminders" && activeView !== "People" ? (
        <section className="quest-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Active Quests</p>
              <h2>Work, rentals, builds, investments</h2>
            </div>
            <button type="button" className="ghost-button">View All</button>
          </div>

          <div className="quest-focus-grid">
            <div className="quest-picker" aria-label="Quest selector">
              {questList.map((quest, index) => (
                <button
                  className="quest-card"
                  data-selected={index === selectedQuestIndex}
                  key={quest.name}
                  onClick={() => setSelectedQuestIndex(index)}
                  type="button"
                >
                  <div className="quest-card-top">
                    <span>{quest.type}</span>
                    <b data-status={quest.tone}>{quest.status}</b>
                  </div>
                  <h3>{quest.name}</h3>
                  <p>{quest.nextMove}</p>
                  <div className="progress-bar" aria-label={`${quest.name} progress`}>
                    <span style={{ width: `${quest.progress}%` }} />
                  </div>
                  <div className="quest-card-bottom">
                    <span>{quest.due}</span>
                    <strong>{quest.value}</strong>
                  </div>
                </button>
              ))}
            </div>

            <article className="quest-detail" aria-live="polite">
              <div className="quest-detail-main">
                <div>
                  <span className="detail-kicker">{selectedQuest.owner}</span>
                  <h3>{selectedQuest.name}</h3>
                  <p>{selectedQuest.summary}</p>
                  <form className="inline-note-form" onSubmit={addNote}>
                    <input
                      aria-label="Quest note"
                      onChange={(event) => setNoteDraft(event.target.value)}
                      placeholder="Add quick note"
                      value={noteDraft}
                    />
                    <button type="submit">Add</button>
                  </form>
                </div>
                <div className="detail-value">
                  <span>{selectedQuest.target}</span>
                  <strong>{selectedQuest.progress}%</strong>
                </div>
              </div>

              <div className="detail-columns">
                <section className="detail-column">
                  <div className="detail-column-head">
                    <h4>Ledger</h4>
                    <span>{selectedQuest.ledger.length}</span>
                  </div>
                  <form className="mini-form" onSubmit={addLedgerEntry}>
                    <input
                      aria-label="Ledger label"
                      onChange={(event) => setLedgerDraft((draft) => ({ ...draft, label: event.target.value }))}
                      placeholder="Label"
                      value={ledgerDraft.label}
                    />
                    <input
                      aria-label="Ledger amount"
                      onChange={(event) => setLedgerDraft((draft) => ({ ...draft, amount: event.target.value }))}
                      placeholder="$0"
                      value={ledgerDraft.amount}
                    />
                    <select
                      aria-label="Ledger state"
                      onChange={(event) => setLedgerDraft((draft) => ({ ...draft, state: event.target.value as LedgerState }))}
                      value={ledgerDraft.state}
                    >
                      <option>Draft</option>
                      <option>Open</option>
                      <option>Paid</option>
                    </select>
                    <button aria-label="Add ledger entry" type="submit">+</button>
                  </form>
                  {selectedQuest.ledger.map((entry, index) => (
                    <div className="mini-row" key={entry.label}>
                      <span>{entry.label}</span>
                      <strong>{entry.amount}</strong>
                      <button data-state={entry.state} onClick={() => cycleLedgerState(index)} type="button">{entry.state}</button>
                    </div>
                  ))}
                </section>

                <section className="detail-column">
                  <div className="detail-column-head">
                    <h4>Paper Trail</h4>
                    <span>{selectedQuest.papers.length}</span>
                  </div>
                  <form className="mini-form" onSubmit={addPaperItem}>
                    <input
                      aria-label="Paper trail label"
                      onChange={(event) => setPaperDraft((draft) => ({ ...draft, label: event.target.value }))}
                      placeholder="Receipt/photo"
                      value={paperDraft.label}
                    />
                    <input
                      aria-label="Paper trail meta"
                      onChange={(event) => setPaperDraft((draft) => ({ ...draft, meta: event.target.value }))}
                      placeholder="Photo, PDF..."
                      value={paperDraft.meta}
                    />
                    <input
                      aria-label="Paper trail state"
                      onChange={(event) => setPaperDraft((draft) => ({ ...draft, state: event.target.value }))}
                      placeholder="Review"
                      value={paperDraft.state}
                    />
                    <button aria-label="Add paper trail item" type="submit">+</button>
                  </form>
                  {selectedQuest.papers.map((paper, index) => (
                    <div className="mini-row" key={paper.label}>
                      <span>{paper.label}</span>
                      <strong>{paper.meta}</strong>
                      <button data-state={paper.state} onClick={() => cyclePaperState(index)} type="button">{paper.state}</button>
                    </div>
                  ))}
                </section>

                <section className="detail-column" id="people">
                  <div className="detail-column-head">
                    <h4>People</h4>
                    <span>{selectedPeople.length}</span>
                  </div>
                  <form className="people-form" onSubmit={addPerson}>
                    <input
                      aria-label="Person name"
                      onChange={(event) => setPersonDraft((draft) => ({ ...draft, name: event.target.value }))}
                      placeholder="Name"
                      value={personDraft.name}
                    />
                    <input
                      aria-label="Person role"
                      onChange={(event) => setPersonDraft((draft) => ({ ...draft, role: event.target.value }))}
                      placeholder="Role"
                      value={personDraft.role}
                    />
                    <input
                      aria-label="Next touch"
                      onChange={(event) => setPersonDraft((draft) => ({ ...draft, nextTouch: event.target.value }))}
                      placeholder="Next touch"
                      value={personDraft.nextTouch}
                    />
                    <button aria-label="Add person" type="submit">+</button>
                  </form>
                  {selectedPeople.length > 0 ? selectedPeople.map((person, index) => (
                    <div className="person-row" key={`${person.name}-${person.role}`}>
                      <span>{person.name}</span>
                      <div className="person-actions">
                        <strong>{person.role}</strong>
                        <button data-status={person.status} onClick={() => cyclePersonStatus(index)} type="button">{person.status}</button>
                        <button className="remove-person" onClick={() => removePerson(index)} type="button" aria-label={`Remove ${person.name}`}>x</button>
                      </div>
                      <em>{person.nextTouch}</em>
                    </div>
                  )) : (
                    <p className="empty-detail">No people linked yet.</p>
                  )}
                </section>

                <section className="detail-column">
                  <div className="detail-column-head">
                    <h4>Next Steps</h4>
                    <span>{selectedQuest.steps.length}</span>
                  </div>
                  {selectedQuest.steps.map((step, index) => (
                    <div className="step-row" data-step={step.state} key={step.label}>
                      <span />
                      <strong>{step.label}</strong>
                      <button onClick={() => advanceStep(index)} type="button">{step.state}</button>
                    </div>
                  ))}
                </section>
              </div>

              <div className="note-strip">
                <form className="note-form" onSubmit={addNote}>
                  <input
                    aria-label="Quest note"
                    onChange={(event) => setNoteDraft(event.target.value)}
                    placeholder="Add quick note"
                    value={noteDraft}
                  />
                  <button type="submit">Add</button>
                </form>
                {selectedQuest.notes.map((note) => (
                  <span key={note}>{note}</span>
                ))}
              </div>
            </article>
          </div>
        </section>

        ) : null}

        {activeView === "Assets" ? (
        <section className="asset-section panel">
          <div className="panel-header">
            <h2>Assets</h2>
            <span>{formatMoney(assetSummary.monthlyProjected)} projected/mo</span>
          </div>
          <div className="asset-body">
            <form className="asset-form" onSubmit={addAsset}>
              <input
                aria-label="Asset name"
                onChange={(event) => setAssetDraft((draft) => ({ ...draft, name: event.target.value }))}
                placeholder="Asset name"
                value={assetDraft.name}
              />
              <select
                aria-label="Asset type"
                onChange={(event) => setAssetDraft((draft) => ({ ...draft, type: event.target.value as Asset["type"] }))}
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
                onChange={(event) => setAssetDraft((draft) => ({ ...draft, value: event.target.value }))}
                placeholder="Value / basis"
                value={assetDraft.value}
              />
              <input
                aria-label="Projected earnings"
                onChange={(event) => setAssetDraft((draft) => ({ ...draft, projected: event.target.value }))}
                placeholder="Projected"
                value={assetDraft.projected}
              />
              <select
                aria-label="Projection frequency"
                onChange={(event) => setAssetDraft((draft) => ({ ...draft, frequency: event.target.value as Asset["frequency"] }))}
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
                <span>Projected yearly</span>
                <strong>{formatMoney(assetSummary.annualProjected)}</strong>
              </div>
            </div>

            <div className="asset-list">
              {assetList.slice(0, 4).map((asset, index) => (
                <article className="asset-row" key={`${asset.name}-${asset.type}`}>
                  <div>
                    <span>{asset.type}</span>
                    <strong>{asset.name}</strong>
                  </div>
                  <div>
                    <span>{asset.value}</span>
                    <strong>{asset.projected} {asset.frequency.toLowerCase()}</strong>
                  </div>
                  <button data-status={asset.status} onClick={() => cycleAssetStatus(index)} type="button">{asset.status}</button>
                </article>
              ))}
            </div>
          </div>
        </section>
        ) : null}
      </section>
      <button className="fab" type="button" aria-label="Quick add"><Icon name="plus" /></button>
    </main>
  );
}
