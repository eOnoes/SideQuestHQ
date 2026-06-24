"use client";

type TxItem = { name: string; detail: string; amount: string; date: string; type: "in" | "out" | "neutral" };

type Section = { title: string; total: string; totalColor: string; items: TxItem[] };

const SECTIONS: Section[] = [
  {
    title: "rental income", total: "$2,900", totalColor: "green",
    items: [
      { name: "J. Williams — W. Lee Ave", detail: "tenant · auto-pay", amount: "+$1,450", date: "Jun 1", type: "in" },
      { name: "M. Davis — Poplar Ave", detail: "tenant · zelle", amount: "+$1,450", date: "Jun 3", type: "in" },
    ],
  },
  {
    title: "retirement / investments", total: "$1,950", totalColor: "blue",
    items: [
      { name: "401k — Employer Match", detail: "locked · auto-contribution", amount: "+$1,200", date: "Jun 15", type: "neutral" },
      { name: "Roth IRA — Dividend", detail: "locked · quarterly", amount: "+$750", date: "Jun 15", type: "neutral" },
    ],
  },
  {
    title: "property expenses", total: "−$1,780", totalColor: "red",
    items: [
      { name: "Plumbing repair — W. Lee Ave", detail: "repair · kitchen sink", amount: "−$480", date: "Jun 8", type: "out" },
      { name: "Lawn service — Poplar Ave", detail: "maintenance · monthly", amount: "−$150", date: "Jun 10", type: "out" },
      { name: "Mortgage — Poplar Ave", detail: "mortgage · monthly", amount: "−$1,150", date: "Jun 1", type: "out" },
    ],
  },
  {
    title: "personal expenses", total: "−$850", totalColor: "red",
    items: [
      { name: "Auto insurance — Cayman", detail: "insurance · 6-month", amount: "−$740", date: "Jun 5", type: "out" },
      { name: "Temu — \"Parts\"", detail: "shopping · questionable", amount: "−$110", date: "Jun 12", type: "out" },
    ],
  },
];

const BAR_COLORS: Record<string, string> = { in: "#2ecc71", out: "#e74c3c", neutral: "#3498db" };

export function LedgerWorkspace({ onBack }: { onBack: () => void }) {
  return (
    <div className="workspace-page">
      <div className="workspace-header">
        <button className="workspace-back" onClick={onBack} type="button">←</button>
        <div className="workspace-title-row">
          <span className="workspace-title">◆ ledger .focus</span>
          <span className="workspace-count">June 2026</span>
        </div>
        <div className="workspace-stats">
          <span><span className="ws-dot" style={{ background: "#2ecc71" }} />$4,850 in</span>
          <span><span className="ws-dot" style={{ background: "#e74c3c" }} />$2,630 out</span>
          <span><span className="ws-dot" style={{ background: "#3498db" }} />+$2,220 net</span>
        </div>
      </div>

      <div className="net-banner">
        <div>
          <div className="net-label">net this month</div>
          <div className="net-sub">rental + retirement − expenses</div>
        </div>
        <div className="net-amount">+$2,220</div>
      </div>

      {SECTIONS.map((s) => (
        <div key={s.title} className="ledger-section">
          <div className="ledger-section-header">
            <span className="ledger-section-title">▸ {s.title}</span>
            <span className={`ledger-section-total ${s.totalColor}`}>{s.total}</span>
          </div>
          <div className="tx-list">
            {s.items.map((tx) => (
              <div key={tx.name} className="tx-row">
                <div className="tx-bar" style={{ background: BAR_COLORS[tx.type] }} />
                <div className="tx-info">
                  <div className="tx-name">{tx.name}</div>
                  <div className="tx-detail">{tx.detail}</div>
                </div>
                <div className={`tx-amount ${tx.type}`}>{tx.amount}</div>
                <div className="tx-date">{tx.date}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="running-total">
        <span className="running-label">running balance (rental only)</span>
        <span className="running-amount">+$1,120</span>
      </div>
    </div>
  );
}
