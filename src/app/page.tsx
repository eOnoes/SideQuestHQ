import type { ReactNode } from "react";

type Quest = {
  name: string;
  type: string;
  status: string;
  nextMove: string;
  value: string;
  progress: number;
  tone: "active" | "discovery" | "progress";
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

const quests: Quest[] = [
  {
    name: "Maple Street Rental",
    type: "Rental Property",
    status: "Active",
    nextMove: "Check rent receipt and schedule gutter inspection.",
    value: "$1,450 expected",
    progress: 75,
    tone: "active",
  },
  {
    name: "AI Estimate Builder",
    type: "Customer Build",
    status: "Discovery",
    nextMove: "Turn rough notes into milestone quote.",
    value: "$3,200 quoted",
    progress: 30,
    tone: "discovery",
  },
  {
    name: "Shop Cabinet Run",
    type: "Build Project",
    status: "In Progress",
    nextMove: "Upload material receipts and confirm final balance.",
    value: "$780 open",
    progress: 60,
    tone: "progress",
  },
];

const reminders: Reminder[] = [
  { label: "Send Friday customer update", quest: "AI Estimate Builder", due: "Today 4:00 PM", priority: "Important" },
  { label: "Check rent payment", quest: "Maple Street Rental", due: "Tomorrow", priority: "Normal" },
  { label: "Review material costs", quest: "Shop Cabinet Run", due: "This week", priority: "Quiet" },
];

const paperTrail: PaperItem[] = [
  { title: "Home Depot receipt", source: "Photo upload", state: "Needs review", amount: "$184.72", kind: "image" },
  { title: "Customer deposit screenshot", source: "Manual upload", state: "Ready to approve", amount: "$500.00", kind: "image" },
  { title: "Lumber yard quote", source: "PDF - Linked", state: "Linked", amount: "$642.18", kind: "file" },
];

const moneyRows: Array<{
  label: string;
  value: string;
  trend: string;
  trendTone: "up" | "down" | "neutral";
  icon: IconName;
}> = [
  { label: "Expected In", value: "$5,430", trend: "+12% this week", trendTone: "up", icon: "dollar" },
  { label: "Open Balances", value: "$1,280", trend: "3 pending", trendTone: "down", icon: "receipt" },
  { label: "Recent Expenses", value: "$826", trend: "-5% vs last week", trendTone: "down", icon: "card" },
  { label: "Paper Trail Drafts", value: "2", trend: "Needs review", trendTone: "neutral", icon: "edit" },
];

type IconName = "grid" | "clipboard" | "dollar" | "file" | "bell" | "people" | "scan" | "receipt" | "card" | "edit" | "image" | "plus";

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
            <button type="button" className="primary-button">New Quest</button>
          </div>
        </header>

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
              <span>3 items</span>
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
              {paperTrail.map((item) => (
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

          <div className="quest-grid">
            {quests.map((quest) => (
              <article className="quest-card" key={quest.name}>
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
                  <span>Tracked value</span>
                  <strong>{quest.value}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
      <button className="fab" type="button" aria-label="Quick add"><Icon name="plus" /></button>
    </main>
  );
}
