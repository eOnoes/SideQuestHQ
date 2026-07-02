"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";

type TxItem = {
  id: string;
  name: string;
  detail: string;
  amount: string;
  date: string;
  type: "in" | "out" | "neutral";
  section: string;
};
type Section = { title: string; total: string; totalColor: string; items: TxItem[] };

const BAR_COLORS: Record<TxItem["type"], string> = { in: "#2ecc71", out: "#e74c3c", neutral: "#3498db" };

function amountNumber(amount: string) {
  return parseFloat(amount.replace(/[^0-9.\-]/g, "")) || 0;
}

export function LedgerWorkspace({ onBack }: { onBack: () => void }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    detail: "",
    amount: "$0",
    date: "",
    type: "neutral" as "in" | "out" | "neutral",
    section: "uncategorized",
  });

  useEffect(() => { loadLedger(); }, []);

  async function loadLedger() {
    try {
      const data = await api.getGlobalLedger();
      const grouped: Record<string, TxItem[]> = {};
      for (const [index, entry] of data.entries()) {
        const sec = entry.section || "uncategorized";
        if (!grouped[sec]) grouped[sec] = [];
        grouped[sec].push({
          id: String(entry.id || `${sec}-${index}`),
          name: entry.name || "—",
          detail: entry.detail || "",
          amount: entry.amount || "$0",
          date: entry.date || "",
          type: entry.type || "neutral",
          section: sec,
        });
      }

      const sectionOrder = ["rental income", "retirement / investments", "property expenses", "personal expenses", "uncategorized"];
      const colorMap: Record<string, string> = {
        "rental income": "green",
        "retirement / investments": "blue",
        "property expenses": "red",
        "personal expenses": "red",
        "uncategorized": "red",
      };

      const result: Section[] = [];
      const allKeys = [...sectionOrder, ...Object.keys(grouped).filter((k) => !sectionOrder.includes(k))];
      const seen = new Set<string>();

      for (const key of allKeys) {
        if (seen.has(key) || !grouped[key]) continue;
        seen.add(key);
        const items = grouped[key].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        const totalVal = items.reduce((sum, item) => sum + (item.type === "out" ? -amountNumber(item.amount) : amountNumber(item.amount)), 0);
        const prefix = totalVal >= 0 ? "+" : "-";
        result.push({
          title: key,
          total: `${prefix}$${Math.abs(totalVal).toLocaleString()}`,
          totalColor: colorMap[key] || "red",
          items,
        });
      }

      setSections(result);
    } catch (e) {
      console.error("Failed to load ledger:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!form.name) return;
    try {
      await api.addGlobalEntry(form);
      setForm({ name: "", detail: "", amount: "$0", date: "", type: "neutral", section: "uncategorized" });
      setShowForm(false);
      setLoading(true);
      await loadLedger();
    } catch (e) {
      console.error("Failed to add entry:", e);
    }
  }

  let totalIn = 0;
  let totalOut = 0;
  for (const s of sections) {
    for (const item of s.items) {
      const num = amountNumber(item.amount);
      if (item.type === "in") totalIn += num;
      else if (item.type === "out") totalOut += num;
    }
  }
  const earned = totalOut > 0 ? Math.round((totalIn / totalOut) * 100) : totalIn > 0 ? 100 : 0;

  return (
    <div className="workspace-page has-summary">
      <div className="workspace-header">
        <div className="workspace-header-row">
          <button className="workspace-back" onClick={onBack} type="button">«</button>
          <div className="workspace-title-row">
            <span className="workspace-title">Ledger</span>
          </div>
          <button className="workspace-add-btn" onClick={() => setShowForm((open) => !open)} type="button">
            {showForm ? "✕ Close" : "+ Add"}
          </button>
        </div>
      </div>

      <div className="workspace-summary-bar">
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Total In</span>
            <span className="summary-value green">${totalIn.toLocaleString()}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Out</span>
            <span className="summary-value red">${totalOut.toLocaleString()}</span>
          </div>
          <div className="summary-item right">
            <span className="summary-label">Percent Earned</span>
            <span className="summary-value blue">{earned}%</span>
          </div>
        </div>
      </div>

      <div className="workspace-scroll">
        {showForm && (
          <div className="add-form">
            <input className="form-input" placeholder="Description" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="form-input" placeholder="Detail" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
            <div className="form-row-split">
              <input className="form-input" placeholder="Amount ($)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-row-split">
              <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "in" | "out" | "neutral" })}>
                <option value="in">Income (in)</option>
                <option value="out">Expense (out)</option>
                <option value="neutral">Neutral</option>
              </select>
              <select className="form-input" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
                <option value="rental income">rental income</option>
                <option value="retirement / investments">retirement / investments</option>
                <option value="property expenses">property expenses</option>
                <option value="personal expenses">personal expenses</option>
                <option value="uncategorized">uncategorized</option>
              </select>
            </div>
            <button className="form-submit" onClick={handleAdd} type="button">Save Entry</button>
          </div>
        )}

        {loading ? (
          <div className="workspace-loading">loading...</div>
        ) : sections.length === 0 ? (
          <div className="workspace-empty">no entries yet</div>
        ) : (
          sections.map((s) => (
            <div key={s.title} className="ledger-section">
              <div className="ledger-section-header">
                <span className="ledger-section-title">{s.title}</span>
                <span className={`ledger-section-total ${s.totalColor}`}>{s.total}</span>
              </div>
              <div className="tx-list">
                {s.items.map((tx) => {
                  const isOpen = expanded === tx.id;
                  return (
                    <div key={tx.id} className={`tx-card card-cut${isOpen ? " expanded" : ""}`} onClick={() => setExpanded(isOpen ? null : tx.id)}>
                      <div className="tx-bar" style={{ background: BAR_COLORS[tx.type] }} />
                      <div className="tx-header-row">
                        <div className="tx-info">
                          <div className="tx-name">{tx.name}</div>
                          <div className="tx-detail">{tx.detail || tx.section}</div>
                        </div>
                        <div className="tx-right">
                          <span className={`tx-amount ${tx.type}`}>{tx.amount}</span>
                          <span className="tx-date">{tx.date || "--"}</span>
                        </div>
                      </div>
                      <div className="tx-details">
                        {[
                          ["name", tx.name],
                          ["detail", tx.detail || "—"],
                          ["amount", tx.amount],
                          ["date", tx.date || "—"],
                          ["type", tx.type],
                          ["section", tx.section],
                        ].map(([key, val]) => (
                          <div key={key} className="tx-detail-row">
                            <span className="detail-key">{key}</span>
                            <span className="detail-val">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
