"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";

/* ─── Types ──────────────────────────────────── */
type TxItem = { name: string; detail: string; amount: string; date: string; type: "in" | "out" | "neutral" };
type Section = { title: string; total: string; totalColor: string; items: TxItem[] };

const BAR_COLORS: Record<string, string> = { in: "#2ecc71", out: "#e74c3c", neutral: "#3498db" };

/* ─── Component ──────────────────────────────── */
export function LedgerWorkspace({ onBack }: { onBack: () => void }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", detail: "", amount: "$0", date: "", type: "neutral" as "in" | "out" | "neutral", section: "uncategorized",
  });

  useEffect(() => { loadLedger(); }, []);

  async function loadLedger() {
    try {
      const data = await api.getGlobalLedger();
      // Group by section
      const grouped: Record<string, TxItem[]> = {};
      for (const entry of data) {
        const sec = entry.section || "uncategorized";
        if (!grouped[sec]) grouped[sec] = [];
        grouped[sec].push({
          name: entry.name || "—",
          detail: entry.detail || "",
          amount: entry.amount || "$0",
          date: entry.date || "",
          type: entry.type || "neutral",
        });
      }

      // Build sections with totals
      const sectionOrder = ["rental income", "retirement / investments", "property expenses", "personal expenses", "uncategorized"];
      const colorMap: Record<string, string> = {
        "rental income": "green",
        "retirement / investments": "blue",
        "property expenses": "red",
        "personal expenses": "red",
        "uncategorized": "red",
      };

      const result: Section[] = [];
      const allKeys = [...sectionOrder, ...Object.keys(grouped).filter(k => !sectionOrder.includes(k))];
      const seen = new Set<string>();

      for (const key of allKeys) {
        if (seen.has(key) || !grouped[key]) continue;
        seen.add(key);
        const items = grouped[key];
        let totalVal = 0;
        for (const item of items) {
          const num = parseFloat(item.amount.replace(/[^0-9.\-]/g, "")) || 0;
          totalVal += item.type === "out" ? -num : num;
        }
        const prefix = totalVal >= 0 ? "+" : "";
        const totalStr = `${prefix}$${Math.abs(totalVal).toLocaleString()}`;
        result.push({
          title: key,
          total: totalStr,
          totalColor: colorMap[key] || "red",
          items,
        });
      }

      setSections(result);
    } catch (e) { console.error("Failed to load ledger:", e); }
    finally { setLoading(false); }
  }

  async function handleAdd() {
    if (!form.name) return;
    try {
      await api.addGlobalEntry(form);
      setForm({ name: "", detail: "", amount: "$0", date: "", type: "neutral", section: "uncategorized" });
      setShowForm(false);
      setLoading(true);
      await loadLedger();
    } catch (e) { console.error("Failed to add entry:", e); }
  }

  // Compute net
  let totalIn = 0;
  let totalOut = 0;
  for (const s of sections) {
    for (const item of s.items) {
      const num = parseFloat(item.amount.replace(/[^0-9.\-]/g, "")) || 0;
      if (item.type === "in") totalIn += num;
      else if (item.type === "out") totalOut += num;
    }
  }
  const net = totalIn - totalOut;
  const netColor = net >= 0 ? "green" : "red";
  const netPrefix = net >= 0 ? "+" : "";

  return (
    <div className="workspace-page">
      <div className="workspace-header">
        <button className="workspace-back" onClick={onBack} type="button">«</button>
        <div className="workspace-title-row">
          <span className="workspace-title">◆ ledger .focus</span>
        </div>
      </div>

      <div className="workspace-scoreboard">
        <div className="scoreboard-main">
          <span className="scoreboard-label">net this month</span>
          <span className={`scoreboard-value ${netColor}`}>{netPrefix}${Math.abs(net).toLocaleString()}</span>
        </div>
        <div className="scoreboard-stats">
          <span className="scoreboard-stat"><span className="ws-dot" style={{ background: "#2ecc71" }} />${totalIn.toLocaleString()} in</span>
          <span className="scoreboard-stat"><span className="ws-dot" style={{ background: "#e74c3c" }} />${totalOut.toLocaleString()} out</span>
        </div>
      </div>

      <div className="action-bar">
        <button className="csv-btn" onClick={() => setShowForm(!showForm)} type="button">
          {showForm ? "✕ Cancel" : "+ Add Entry"}
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#111", borderRadius: 10, padding: 14, marginTop: 8, border: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input placeholder="Description" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
            <input placeholder="Detail" value={form.detail} onChange={e => setForm({ ...form, detail: e.target.value })}
              style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="Amount ($)" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                style={{ flex: 1, background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                style={{ flex: 1, background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as "in" | "out" | "neutral" })}
                style={{ flex: 1, background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                <option value="in">Income (in)</option>
                <option value="out">Expense (out)</option>
                <option value="neutral">Neutral</option>
              </select>
              <select value={form.section} onChange={e => setForm({ ...form, section: e.target.value })}
                style={{ flex: 1, background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                <option value="rental income">rental income</option>
                <option value="retirement / investments">retirement / investments</option>
                <option value="property expenses">property expenses</option>
                <option value="personal expenses">personal expenses</option>
                <option value="uncategorized">uncategorized</option>
              </select>
            </div>
            <button className="filter-apply-btn" onClick={handleAdd} type="button">Save Entry</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#555" }}>loading...</div>
      ) : sections.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#555" }}>no entries yet — add one above</div>
      ) : (
        sections.map((s) => (
          <div key={s.title} className="ledger-section">
            <div className="ledger-section-header">
              <span className="ledger-section-title">▸ {s.title}</span>
              <span className={`ledger-section-total ${s.totalColor}`}>{s.total}</span>
            </div>
            <div className="tx-list">
              {s.items.map((tx, i) => (
                <div key={`${tx.name}-${i}`} className="tx-row">
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
        ))
      )}

      <div className="running-total">
        <span className="running-label">running balance</span>
        <span className={`running-amount ${netColor}`}>{netPrefix}${Math.abs(net).toLocaleString()}</span>
      </div>
    </div>
  );
}
