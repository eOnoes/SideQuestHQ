type Quest = {
  name: string;
  type: string;
  status: string;
  nextMove: string;
  value: string;
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
};

const quests: Quest[] = [
  {
    name: "Maple Street Rental",
    type: "Rental Property",
    status: "Active",
    nextMove: "Check rent receipt and schedule gutter inspection.",
    value: "$1,450 expected",
  },
  {
    name: "AI Estimate Builder",
    type: "Customer Build",
    status: "Discovery",
    nextMove: "Turn rough notes into milestone quote.",
    value: "$3,200 quoted",
  },
  {
    name: "Shop Cabinet Run",
    type: "Build Project",
    status: "In Progress",
    nextMove: "Upload material receipts and confirm final balance.",
    value: "$780 open",
  },
];

const reminders: Reminder[] = [
  { label: "Send Friday customer update", quest: "AI Estimate Builder", due: "Today 4:00 PM", priority: "Important" },
  { label: "Check rent payment", quest: "Maple Street Rental", due: "Tomorrow", priority: "Normal" },
  { label: "Review material costs", quest: "Shop Cabinet Run", due: "This week", priority: "Quiet" },
];

const paperTrail: PaperItem[] = [
  { title: "Home Depot receipt", source: "Photo upload", state: "Needs review", amount: "$184.72" },
  { title: "Customer deposit screenshot", source: "Manual upload", state: "Ready to approve", amount: "$500.00" },
  { title: "Lumber yard quote", source: "PDF", state: "Linked", amount: "$642.18" },
];

const moneyRows = [
  ["Expected In", "$5,430"],
  ["Open Balances", "$1,280"],
  ["Recent Expenses", "$826"],
  ["Paper Trail Drafts", "2"],
];

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
          <a className="nav-item nav-item-active" href="#command">Command</a>
          <a className="nav-item" href="#quests">Quests</a>
          <a className="nav-item" href="#ledger">Ledger</a>
          <a className="nav-item" href="#paper-trail">Paper Trail</a>
          <a className="nav-item" href="#reminders">Reminders</a>
          <a className="nav-item" href="#people">People</a>
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
            <button type="button" className="icon-button" aria-label="Scan paper trail">Scan</button>
            <button type="button" className="primary-button">New Quest</button>
          </div>
        </header>

        <section className="summary-strip" aria-label="Money summary">
          {moneyRows.map(([label, value]) => (
            <div className="metric" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
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
                  <b>{quest.status}</b>
                </div>
                <h3>{quest.name}</h3>
                <p>{quest.nextMove}</p>
                <div className="quest-card-bottom">
                  <span>Tracked value</span>
                  <strong>{quest.value}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
