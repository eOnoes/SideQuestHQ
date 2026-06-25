"use client";

import { useState } from "react";

type Property = {
  number: string;
  state: string;
  city: string;
  street: string;
  color: string;
  briefTag: string;
  occupied: boolean;
  paidOff: boolean;
  data: Array<{ key: string; val: string; color?: string }>;
  mortgagePct?: number;
};

const PROPERTIES: Property[] = [
  {
    number: "247", state: "TN", city: "Osceola", street: "W. Lee Ave",
    color: "#2ecc71", briefTag: "occupied | paid off", occupied: true, paidOff: true,
    data: [
      { key: "insurance_provider", val: "State Farm" },
      { key: "insurance_premium", val: "$1,800/yr" },
      { key: "insurance_due", val: "Aug 15", color: "orange" },
      { key: "monthly_rent", val: "$1,450", color: "green" },
      { key: "tenant", val: "J. Williams" },
      { key: "lease_end", val: "Mar 2027" },
    ],
  },
  {
    number: "512", state: "TN", city: "Memphis", street: "Poplar Ave",
    color: "#e74c3c", briefTag: "vacant | financed", occupied: false, paidOff: false,
    data: [
      { key: "insurance_provider", val: "Allstate" },
      { key: "insurance_premium", val: "$2,200/yr" },
      { key: "insurance_due", val: "Nov 1", color: "orange" },
      { key: "monthly_payment", val: "$1,150" },
      { key: "payment_due", val: "1st of month" },
      { key: "original_loan", val: "$185,000" },
      { key: "remaining_balance", val: "$142,300", color: "red" },
    ],
    mortgagePct: 23,
  },
];

export function HousesWorkspace({ onBack }: { onBack: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="workspace-page">
      <div className="workspace-header">
        <button className="workspace-back" onClick={onBack} type="button">←</button>
        <div className="workspace-title-row">
          <span className="workspace-title">◆ assets .houses</span>
        </div>
      </div>

      <div className="workspace-scoreboard">
        <div className="scoreboard-main">
          <span className="scoreboard-label">portfolio</span>
          <span className="scoreboard-value green">{PROPERTIES.length} properties</span>
        </div>
        <div className="scoreboard-stats">
          <span className="scoreboard-stat"><span className="ws-dot" style={{ background: "#2ecc71" }} />1 occupied</span>
          <span className="scoreboard-stat"><span className="ws-dot" style={{ background: "#e74c3c" }} />1 vacant</span>
        </div>
      </div>

      <div className="accordion-stack">
        {PROPERTIES.map((p, i) => {
          const isOpen = expanded === i;
          return (
            <div
              key={p.street + i}
              className={`accordion-card${isOpen ? " expanded" : ""}`}
              onClick={() => setExpanded(isOpen ? null : i)}
            >
              <div className="accordion-line" style={{ background: p.color }} />
              <div className="accordion-header">
                <span className="accordion-year">{p.number}</span>
                <div className="accordion-info">
                  <div className="address-stack">
                    <div className="address-loc">{p.state} · {p.city}</div>
                    <div className="accordion-name">{p.street}</div>
                  </div>
                  <div className="accordion-brief">{p.briefTag}</div>
                </div>
                <span className="accordion-arrow">{isOpen ? "▲" : "▼"}</span>
              </div>
              {isOpen && (
                <div className="accordion-details">
                  <div className="accordion-pills">
                    <span className={`pill ${p.occupied ? "green" : "red"}`}>
                      {p.occupied ? "OCCUPIED" : "VACANT"}
                    </span>
                    <span className={`pill ${p.paidOff ? "green" : "orange"}`}>
                      {p.paidOff ? "PAID OFF" : "FINANCED"}
                    </span>
                  </div>
                  <div className="accordion-rows">
                    {p.data.map((d) => (
                      <div key={d.key} className="accordion-row">
                        <span className="row-key">{d.key}</span>
                        <span className={`row-val${d.color ? ` ${d.color}` : ""}`}>{d.val}</span>
                      </div>
                    ))}
                  </div>
                  {p.mortgagePct !== undefined && (
                    <div className="mortgage-bar-wrap">
                      <div className="mortgage-label">
                        <span>paid down</span>
                        <span style={{ color: "#2ecc71" }}>{p.mortgagePct}%</span>
                      </div>
                      <div className="mortgage-bar">
                        <div className="mortgage-fill" style={{ width: `${p.mortgagePct}%` }} />
                      </div>
                    </div>
                  )}
                  {!p.occupied && (
                    <div className="vacancy-alert">
                      <span>⚠</span> UNOCCUPIED — reminder active on main page
                    </div>
                  )}
                </div>
              )}
              <span className="accordion-index">{String(i + 1).padStart(3, "0")}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
