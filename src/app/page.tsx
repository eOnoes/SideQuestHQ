"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

type LedgerState = "Paid" | "Open" | "Draft";
type StepState = "Done" | "Now" | "Next";

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

const STORAGE_KEY = "sidequest-hq:quests:v1";
const PEOPLE_STORAGE_KEY = "sidequest-hq:people:v1";

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

const reminders: Reminder[] = [
  { label: "Send Friday customer update", quest: "AI Estimate Builder", due: "Today 4:00 PM", priority: "Important" },
  { label: "Check rent payment", quest: "Maple Street Rental", due: "Tomorrow", priority: "Normal" },
  { label: "Review material costs", quest: "Shop Cabinet Run", due: "This week", priority: "Quiet" },
];

const seedPeople: Person[] = [
  { name: "Tenant", role: "Maple Street Rental", quest: "Maple Street Rental", nextTouch: "Confirm May receipt", status: "Waiting" },
  { name: "Estimate customer", role: "Decision maker", quest: "AI Estimate Builder", nextTouch: "Friday update", status: "Active" },
  { name: "Lumber desk", role: "Vendor", quest: "Shop Cabinet Run", nextTouch: "Quote match", status: "Quiet" },
];

type IconName = "grid" | "clipboard" | "dollar" | "file" | "bell" | "people" | "scan" | "receipt" | "card" | "edit" | "image" | "plus";

function parseMoney(value: string) {
  const amount = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0, style: "currency", currency: "USD" }).format(value);
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
  const [questDraft, setQuestDraft] = useState({ name: "", type: "Build Project", value: "", due: "" });
  const [ledgerDraft, setLedgerDraft] = useState<{ label: string; amount: string; state: LedgerState }>({ label: "", amount: "", state: "Draft" });
  const [paperDraft, setPaperDraft] = useState({ label: "", meta: "", state: "Review" });
  const [peopleList, setPeopleList] = useState<Person[]>(seedPeople);
  const [personDraft, setPersonDraft] = useState({ name: "", role: "", nextTouch: "" });
  const [noteDraft, setNoteDraft] = useState("");
  const selectedQuest = questList[Math.min(selectedQuestIndex, questList.length - 1)] ?? seedQuests[0];
  const moneyRows = useMemo(() => getMoneyRows(questList), [questList]);
  const selectedPeople = useMemo(() => peopleList.filter((person) => person.quest === selectedQuest.name), [peopleList, selectedQuest.name]);
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
    } catch {
      setQuestList(seedQuests);
      setPeopleList(seedPeople);
    } finally {
      setHasLoadedStoredData(true);
    }
  }, []);

  useEffect(() => {
    if (hasLoadedStoredData) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(questList));
      window.localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(peopleList));
    }
  }, [hasLoadedStoredData, peopleList, questList]);

  function updateSelectedQuest(updater: (quest: Quest) => Quest) {
    setQuestList((current) => current.map((quest, index) => (index === selectedQuestIndex ? updater(quest) : quest)));
  }

  function addQuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = questDraft.name.trim();
    if (!name) return;

    const nextQuest: Quest = {
      name,
      type: questDraft.type.trim() || "Side Quest",
      status: "Discovery",
      nextMove: "Capture the first move and attach the first ledger item.",
      value: questDraft.value.trim() || "$0 tracked",
      progress: 10,
      tone: "discovery",
      owner: "New quest",
      target: "Get it organized",
      due: questDraft.due.trim() || "Next check: Soon",
      summary: "Fresh quest. Add ledger rows, paper trail items, and next steps as the work gets clearer.",
      ledger: [],
      papers: [],
      steps: [
        { label: "Quest created", state: "Done" },
        { label: "First ledger item", state: "Now" },
        { label: "Paper trail", state: "Next" },
      ],
      notes: ["Use this as the command card until we build the full edit screen."],
    };

    setQuestList((current) => [...current, nextQuest]);
    setSelectedQuestIndex(questList.length);
    setQuestDraft({ name: "", type: "Build Project", value: "", due: "" });
    setShowQuestComposer(false);
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

  function cycleLedgerState(entryIndex: number) {
    const order: LedgerState[] = ["Draft", "Open", "Paid"];
    updateSelectedQuest((quest) => ({
      ...quest,
      ledger: quest.ledger.map((entry, index) => {
        if (index !== entryIndex) return entry;
        const nextState = order[(order.indexOf(entry.state) + 1) % order.length];
        return { ...entry, state: nextState };
      }),
    }));
  }

  function cyclePaperState(paperIndex: number) {
    const order = ["Review", "Ready", "Filed"];
    updateSelectedQuest((quest) => ({
      ...quest,
      papers: quest.papers.map((paper, index) => {
        if (index !== paperIndex) return paper;
        const currentIndex = order.findIndex((state) => state.toLowerCase() === paper.state.toLowerCase());
        return { ...paper, state: order[((currentIndex === -1 ? 0 : currentIndex) + 1) % order.length] };
      }),
    }));
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
    const order: Person["status"][] = ["Active", "Waiting", "Quiet"];
    const selectedIndexes = peopleList
      .map((person, index) => ({ person, index }))
      .filter(({ person }) => person.quest === selectedQuest.name)
      .map(({ index }) => index);
    const targetIndex = selectedIndexes[personIndex];
    if (targetIndex === undefined) return;

    setPeopleList((current) =>
      current.map((person, index) => {
        if (index !== targetIndex) return person;
        return { ...person, status: order[(order.indexOf(person.status) + 1) % order.length] };
      }),
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
          <a className="nav-item nav-item-active" href="#command"><Icon name="grid" /><span>Command</span></a>
          <a className="nav-item" href="#quests"><Icon name="clipboard" /><span>Quests</span></a>
          <a className="nav-item" href="#ledger"><Icon name="dollar" /><span>Ledger</span></a>
          <a className="nav-item" href="#paper-trail"><Icon name="file" /><span>Paper Trail</span></a>
          <a className="nav-item" href="#reminders"><Icon name="bell" /><span>Reminders</span></a>
          <a className="nav-item" href="#people"><Icon name="people" /><span>People</span></a>
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" />
          <span>Local prototype</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Command</p>
            <h1>Today&apos;s side quests</h1>
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
            <input
              aria-label="Quest type"
              onChange={(event) => setQuestDraft((draft) => ({ ...draft, type: event.target.value }))}
              placeholder="Rental, build, investment..."
              value={questDraft.type}
            />
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
              <span>{reminders.length} items</span>
            </div>
            <div className="attention-list">
              {reminders.map((reminder) => (
                <article className="attention-item" key={reminder.label}>
                  <span className="task-check" aria-hidden="true" />
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

        <section className="quest-section" id="quests">
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
                      <strong>{person.role}</strong>
                      <em>{person.nextTouch}</em>
                      <button data-status={person.status} onClick={() => cyclePersonStatus(index)} type="button">{person.status}</button>
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
      </section>
      <button className="fab" type="button" aria-label="Quick add"><Icon name="plus" /></button>
    </main>
  );
}
