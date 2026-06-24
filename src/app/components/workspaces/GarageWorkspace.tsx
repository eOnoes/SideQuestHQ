"use client";

import { useState } from "react";

/* ─── Vehicle accordion workspace ───────────────── */

type Vehicle = {
  year: string;
  name: string;
  tag: string;
  briefTag: string;
  color: string;
  statusPills: Array<{ label: string; color: string }>;
  data: Array<{ key: string; val: string; color?: string }>;
};

const VEHICLES: Vehicle[] = [
  {
    year: "19", name: "Porsche Cayman", tag: "SQHQ-911", briefTag: "SQHQ-911",
    color: "#f1c40f",
    statusPills: [{ label: "PAID OFF", color: "green" }, { label: "AVAILABLE", color: "green" }],
    data: [
      { key: "tag", val: "SQHQ-911" },
      { key: "est_value", val: "$58,000", color: "green" },
      { key: "monthly_payment", val: "$0", color: "green" },
      { key: "insurance", val: "Mar 2026 · $1,480" },
      { key: "renewal_date", val: "Mar 2027" },
    ],
  },
  {
    year: "21", name: "Ford F-150", tag: "TBD", briefTag: "TBD",
    color: "#2ecc71",
    statusPills: [{ label: "FINANCED", color: "yellow" }, { label: "AVAILABLE", color: "green" }],
    data: [
      { key: "tag", val: "TBD" },
      { key: "est_value", val: "$38,000", color: "green" },
      { key: "monthly_payment", val: "$485" },
      { key: "insurance", val: "Jun 2026 · $1,200" },
      { key: "renewal_date", val: "Jun 2027" },
    ],
  },
  {
    year: "60", name: "VW Baja Bug", tag: "TBD", briefTag: "K20 swap",
    color: "#3498db",
    statusPills: [{ label: "PROJECT", color: "gray" }, { label: "IN PROGRESS", color: "blue" }],
    data: [
      { key: "tag", val: "TBD" },
      { key: "est_value", val: "$16,400", color: "green" },
      { key: "engine", val: "Honda K20", color: "yellow" },
      { key: "donor_year", val: "1960" },
      { key: "conversion", val: "Beetle → Baja" },
      { key: "status", val: "Fabrication", color: "blue" },
    ],
  },
];

export function GarageWorkspace({ onBack }: { onBack: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(0);
  const totalValue = "$112,400";

  return (
    <div className="workspace-page">
      <div className="workspace-header">
        <button className="workspace-back" onClick={onBack} type="button">←</button>
        <div className="workspace-title-row">
          <span className="workspace-title">◆ garage .focus</span>
          <span className="workspace-count">{VEHICLES.length} vehicles</span>
        </div>
        <div className="workspace-stats">
          <span><span className="ws-dot" style={{ background: "#9b59b6" }} />{VEHICLES.length} vehicles</span>
          <span><span className="ws-dot" style={{ background: "#2ecc71" }} />{totalValue}</span>
        </div>
      </div>

      <div className="accordion-stack">
        {VEHICLES.map((v, i) => {
          const isOpen = expanded === i;
          return (
            <div
              key={v.tag + i}
              className={`accordion-card${isOpen ? " expanded" : ""}`}
              onClick={() => setExpanded(isOpen ? null : i)}
            >
              <div className="accordion-line" style={{ background: v.color }} />
              <div className="accordion-header">
                <span className="accordion-year">{v.year}</span>
                <div className="accordion-info">
                  <div className="accordion-name">{v.name}</div>
                  <div className="accordion-brief">tag: {v.briefTag}</div>
                </div>
                <span className="accordion-arrow">{isOpen ? "▲" : "▼"}</span>
              </div>
              {isOpen && (
                <div className="accordion-details">
                  <div className="accordion-pills">
                    {v.statusPills.map((p) => (
                      <span key={p.label} className={`pill ${p.color}`}>{p.label}</span>
                    ))}
                  </div>
                  <div className="accordion-rows">
                    {v.data.map((d) => (
                      <div key={d.key} className="accordion-row">
                        <span className="row-key">{d.key}</span>
                        <span className={`row-val${d.color ? ` ${d.color}` : ""}`}>{d.val}</span>
                      </div>
                    ))}
                  </div>
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
