"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";

/* ─── Types ──────────────────────────────────── */
type Receipt = { id: string; vendor: string; detail: string; amount: string; date: string; badge: string; badgeColor: string };
type ReceiptGroup = { title: string; count: string; total: string; items: Receipt[] };

function mapDocument(d: any): Receipt {
  return {
    id: String(d.id),
    vendor: d.vendor || "—",
    detail: d.detail || "",
    amount: d.amount || "$0",
    date: d.date || "",
    badge: d.badge || "manual",
    badgeColor: d.badge_color || "manual",
  };
}

const FILTER_CHIPS = ["all", "property", "vehicle", "personal", "uncategorized"];

/* ─── Component ──────────────────────────────── */
export function PaperTrailWorkspace({ onBack }: { onBack: () => void }) {
  const [documents, setDocuments] = useState<Receipt[]>([]);
  const [groups, setGroups] = useState<ReceiptGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    vendor: "", detail: "", amount: "$0", date: "", category: "uncategorized",
  });

  useEffect(() => { loadDocuments(); }, []);

  async function loadDocuments() {
    try {
      const data = await api.getGlobalDocuments();
      const mapped = data.map(mapDocument);
      setDocuments(mapped);
      buildGroups(mapped);
    } catch (e) { console.error("Failed to load documents:", e); }
    finally { setLoading(false); }
  }

  function buildGroups(items: Receipt[]) {
    const grouped: Record<string, Receipt[]> = {};
    for (const item of items) {
      const cat = item.badgeColor === "digital" ? "digital" : item.badgeColor === "receipt" ? "receipts" : "manual";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }

    const result: ReceiptGroup[] = [];
    for (const [title, items] of Object.entries(grouped)) {
      let total = 0;
      for (const item of items) {
        total += parseFloat(item.amount.replace(/[^0-9.\-]/g, "")) || 0;
      }
      result.push({
        title,
        count: `${items.length} receipt${items.length !== 1 ? "s" : ""}`,
        total: `−$${Math.abs(total).toLocaleString()}`,
        items,
      });
    }
    setGroups(result);
  }

  async function handleAdd() {
    if (!form.vendor) return;
    try {
      await api.addGlobalDocument({
        vendor: form.vendor,
        detail: form.detail,
        amount: form.amount,
        date: form.date,
        category: form.category,
        badge: "manual",
        badge_color: "manual",
      });
      setForm({ vendor: "", detail: "", amount: "$0", date: "", category: "uncategorized" });
      setShowForm(false);
      setLoading(true);
      await loadDocuments();
    } catch (e) { console.error("Failed to add document:", e); }
  }

  // Compute total
  let totalExpenses = 0;
  for (const doc of documents) {
    totalExpenses += parseFloat(doc.amount.replace(/[^0-9.\-]/g, "")) || 0;
  }

  return (
    <div className="workspace-page">
      <div className="workspace-header">
        <button className="workspace-back" onClick={onBack} type="button">«</button>
        <div className="workspace-title-row">
          <span className="workspace-title">◆ paper trail .focus</span>
        </div>
      </div>

      <div className="workspace-scoreboard">
        <div className="scoreboard-main">
          <span className="scoreboard-label">expenses YTD</span>
          <span className="scoreboard-value red">−${Math.abs(totalExpenses).toLocaleString()}</span>
        </div>
        <div className="scoreboard-stats">
          <span className="scoreboard-stat"><span className="ws-dot" style={{ background: "#e67e22" }} />{documents.length} receipts</span>
        </div>
      </div>

      <div className="action-bar">
        <button className={`filter-icon-btn${showFilter ? " active" : ""}`} onClick={() => setShowFilter(!showFilter)} type="button">⚙</button>
        <button className="csv-btn" onClick={() => setShowForm(!showForm)} type="button">
          {showForm ? "✕ Cancel" : "+ Add Receipt"}
        </button>
      </div>

      {showFilter && (
        <div className="filter-overlay open" onClick={() => setShowFilter(false)}>
          <div className="filter-panel" onClick={(e) => e.stopPropagation()}>
            <div className="filter-panel-header">
              <span className="filter-panel-title">filter</span>
              <button className="filter-panel-close" onClick={() => setShowFilter(false)} type="button">✕</button>
            </div>
            <div className="filter-section-label">by category</div>
            <div className="filter-chips">
              {FILTER_CHIPS.map((chip) => (
                <span key={chip} className={`filter-chip${activeFilter === chip ? " selected" : ""}`}
                  onClick={() => setActiveFilter(chip)}>
                  {chip}
                </span>
              ))}
            </div>
            <button className="filter-apply-btn" onClick={() => setShowFilter(false)} type="button">apply filters</button>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ background: "#111", borderRadius: 10, padding: 14, marginTop: 8, border: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input placeholder="Vendor / Source" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })}
              style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
            <input placeholder="Detail" value={form.detail} onChange={e => setForm({ ...form, detail: e.target.value })}
              style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="Amount ($)" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                style={{ flex: 1, background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                style={{ flex: 1, background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
            </div>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
              <option value="property">property</option>
              <option value="vehicle">vehicle</option>
              <option value="personal">personal</option>
              <option value="uncategorized">uncategorized</option>
            </select>
            <button className="filter-apply-btn" onClick={handleAdd} type="button">Save Receipt</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#555" }}>loading...</div>
      ) : groups.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#555" }}>no receipts yet — add one above</div>
      ) : (
        groups.map((g) => (
          <div key={g.title} className="receipt-group">
            <div className="receipt-group-header">
              <span className="receipt-group-title">▸ {g.title}</span>
              <span className="receipt-group-count">{g.count}</span>
              <span className="receipt-group-total">{g.total}</span>
            </div>
            {g.items.map((r) => (
              <div key={r.id} className="receipt-card">
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
        ))
      )}

      <div className="running-total sticky">
        <span className="running-label">total expenses (YTD)</span>
        <span className="running-amount red">−${Math.abs(totalExpenses).toLocaleString()}</span>
      </div>
    </div>
  );
}
