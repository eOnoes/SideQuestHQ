"use client";

import { useState } from "react";

type Receipt = { vendor: string; detail: string; amount: string; date: string; badge: string; badgeColor: string };
type ReceiptGroup = { title: string; count: string; total: string; items: Receipt[] };

const GROUPS: ReceiptGroup[] = [
  {
    title: "W. Lee Ave", count: "8 receipts", total: "−$2,340",
    items: [
      { vendor: "Memphis Plumbing Co.", detail: "repair · kitchen sink", amount: "−$480", date: "Jun 8", badge: "scan", badgeColor: "receipt" },
      { vendor: "State Farm Insurance", detail: "insurance · annual premium", amount: "−$1,800", date: "Jun 1", badge: "auto", badgeColor: "digital" },
      { vendor: "Home Depot", detail: "upgrade · bathroom tile", amount: "−$60", date: "Jun 14", badge: "manual", badgeColor: "manual" },
    ],
  },
  {
    title: "Poplar Ave", count: "5 receipts", total: "−$1,520",
    items: [
      { vendor: "Allstate Insurance", detail: "insurance · annual premium", amount: "−$2,200", date: "Jun 1", badge: "auto", badgeColor: "digital" },
      { vendor: "GreenScape Lawn", detail: "maintenance · monthly", amount: "−$150", date: "Jun 10", badge: "scan", badgeColor: "receipt" },
    ],
  },
  {
    title: "vehicles", count: "4 receipts", total: "−$1,150",
    items: [
      { vendor: "Progressive Auto", detail: "Cayman · 6-month premium", amount: "−$740", date: "Jun 5", badge: "auto", badgeColor: "digital" },
      { vendor: "Shell Gas Station", detail: "fuel · F-150", amount: "−$85", date: "Jun 11", badge: "manual", badgeColor: "manual" },
    ],
  },
  {
    title: "uncategorized", count: "2 receipts", total: "−$195",
    items: [
      { vendor: "Temu — \"Parts\"", detail: "uncategorized · needs review", amount: "−$110", date: "Jun 12", badge: "scan", badgeColor: "receipt" },
    ],
  },
];

const FILTER_CHIPS = ["all", "W. Lee Ave", "Poplar Ave", "Cayman", "F-150", "Baja Bug", "fuel", "insurance", "mortgage"];

export function PaperTrailWorkspace({ onBack }: { onBack: () => void }) {
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  return (
    <div className="workspace-page">
      <div className="workspace-header">
        <button className="workspace-back" onClick={onBack} type="button">←</button>
        <div className="workspace-title-row">
          <span className="workspace-title">◆ paper trail .focus</span>
          <span className="workspace-count">23 receipts</span>
        </div>
        <div className="workspace-stats">
          <span><span className="ws-dot" style={{ background: "#2ecc71" }} />3 assets</span>
          <span><span className="ws-dot" style={{ background: "#e67e22" }} />6 categories</span>
          <span><span className="ws-dot" style={{ background: "#9b59b6" }} />YTD: $18,420</span>
        </div>
      </div>

      <div className="action-bar">
        <button className={`filter-icon-btn${showFilter ? " active" : ""}`} onClick={() => setShowFilter(!showFilter)} type="button">⚙</button>
        <button className="csv-btn" type="button">📊 Export</button>
      </div>

      {showFilter && (
        <div className="filter-overlay open" onClick={() => setShowFilter(false)}>
          <div className="filter-panel" onClick={(e) => e.stopPropagation()}>
            <div className="filter-panel-header">
              <span className="filter-panel-title">filter</span>
              <button className="filter-panel-close" onClick={() => setShowFilter(false)} type="button">✕</button>
            </div>
            <div className="filter-section-label">by asset / category</div>
            <div className="filter-chips">
              {FILTER_CHIPS.map((chip) => (
                <span
                  key={chip}
                  className={`filter-chip${activeFilter === chip ? " selected" : ""}`}
                  onClick={() => setActiveFilter(chip)}
                >
                  {chip}
                </span>
              ))}
            </div>
            <button className="filter-apply-btn" onClick={() => setShowFilter(false)} type="button">apply filters</button>
          </div>
        </div>
      )}

      {GROUPS.map((g) => (
        <div key={g.title} className="receipt-group">
          <div className="receipt-group-header">
            <span className="receipt-group-title">▸ {g.title}</span>
            <span className="receipt-group-count">{g.count}</span>
            <span className="receipt-group-total">{g.total}</span>
          </div>
          {g.items.map((r) => (
            <div key={r.vendor} className="receipt-card">
              <span className={`receipt-badge ${r.badgeColor}`}>{r.badge}</span>
              <div className="receipt-info">
                <div className="receipt-vendor">{r.vendor}</div>
                <div className="receipt-detail">{r.detail}</div>
              </div>
              <div className="receipt-amount">{r.amount}</div>
              <div className="receipt-date">{r.date}</div>
            </div>
          ))}
        </div>
      ))}

      <div className="running-total sticky">
        <span className="running-label">total expenses (YTD)</span>
        <span className="running-amount red">−$18,420</span>
      </div>
    </div>
  );
}
