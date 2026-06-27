"use client";

import { useState, useEffect } from "react";
import * as api from "@/lib/api";

type Receipt = {
  id: number;
  vendor: string;
  detail: string;
  amount: string;
  date: string;
  category: string;
  badge: string;
  badge_color: string;
  receipt_url: string;
  notes: string;
};

export function PaperTrailWorkspace({ onBack }: { onBack: () => void }) {
  const [documents, setDocuments] = useState<Receipt[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    vendor: "",
    detail: "",
    amount: "",
    date: "",
    category: "uncategorized",
    badge: "manual",
    badge_color: "manual",
    receipt_url: "",
    notes: "",
  });

  useEffect(() => {
    api.getGlobalDocuments().then((data) => {
      setDocuments(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Build filter chips from categories
  const categories = [...new Set(documents.map(d => d.category))];
  const FILTER_CHIPS = ["all", ...categories];

  // Filter documents
  const filteredDocs = activeFilter === "all"
    ? documents
    : documents.filter(d => d.category === activeFilter);

  // Group by category
  const groups: Record<string, Receipt[]> = {};
  filteredDocs.forEach((d) => {
    const cat = d.category || "uncategorized";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(d);
  });

  // Calculate total
  const totalYTD = filteredDocs.reduce((sum, d) => {
    const num = parseFloat(d.amount.replace(/[^0-9.-]/g, "")) || 0;
    return sum + num;
  }, 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vendor.trim()) return;
    await api.addDocument(form);
    setForm({ vendor: "", detail: "", amount: "", date: "", category: "uncategorized", badge: "manual", badge_color: "manual", receipt_url: "", notes: "" });
    setShowForm(false);
    const data = await api.getGlobalDocuments();
    setDocuments(data);
  }

  return (
    <div className="workspace-page">
      <div className="workspace-header">
        <button className="workspace-back" onClick={onBack} type="button">←</button>
        <div className="workspace-title-row">
          <span className="workspace-title">◆ paper trail .focus</span>
          <button className="workspace-add-btn" onClick={() => setShowForm(!showForm)} type="button">
            {showForm ? "✕" : "+"}
          </button>
        </div>
      </div>

      <div className="workspace-scoreboard">
        <div className="scoreboard-main">
          <span className="scoreboard-label">expenses YTD</span>
          <span className="scoreboard-value red">{totalYTD < 0 ? "−" : ""}${Math.abs(totalYTD).toFixed(0)}</span>
        </div>
        <div className="scoreboard-stats">
          <span className="scoreboard-stat"><span className="ws-dot" style={{ background: "#2ecc71" }} />{categories.length} categories</span>
          <span className="scoreboard-stat"><span className="ws-dot" style={{ background: "#e67e22" }} />{documents.length} receipts</span>
        </div>
      </div>

      <div className="action-bar">
        <button className={`filter-icon-btn${showFilter ? " active" : ""}`} onClick={() => setShowFilter(!showFilter)} type="button">⚙</button>
        <button className="csv-btn" type="button">📊 Export</button>
      </div>

      {showForm && (
        <form className="add-form" onSubmit={handleAdd}>
          <div className="form-row">
            <input
              className="form-input"
              placeholder="Vendor (e.g. Home Depot)"
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              required
            />
          </div>
          <div className="form-row form-row-split">
            <input
              className="form-input"
              placeholder="Amount (e.g. −$60)"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <input
              className="form-input"
              placeholder="Date (e.g. Jun 14)"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="form-row">
            <input
              className="form-input"
              placeholder="Detail (e.g. upgrade · bathroom tile)"
              value={form.detail}
              onChange={(e) => setForm({ ...form, detail: e.target.value })}
            />
          </div>
          <div className="form-row form-row-split">
            <select
              className="form-input"
              value={form.badge}
              onChange={(e) => setForm({ ...form, badge: e.target.value, badge_color: e.target.value === "scan" ? "receipt" : e.target.value === "auto" ? "digital" : "manual" })}
            >
              <option value="manual">manual</option>
              <option value="scan">scan</option>
              <option value="auto">auto</option>
            </select>
            <input
              className="form-input"
              placeholder="Category (e.g. vehicles)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <button className="form-submit" type="submit">Add Receipt</button>
        </form>
      )}

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

      {loading ? (
        <div className="workspace-loading">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="workspace-empty">
          <p>No receipts yet</p>
          <button className="workspace-empty-btn" onClick={() => setShowForm(true)} type="button">+ Add your first receipt</button>
        </div>
      ) : (
        Object.entries(groups).map(([title, items]) => {
          const groupTotal = items.reduce((sum, d) => {
            const num = parseFloat(d.amount.replace(/[^0-9.-]/g, "")) || 0;
            return sum + num;
          }, 0);
          return (
            <div key={title} className="receipt-group">
              <div className="receipt-group-header">
                <span className="receipt-group-title">▸ {title}</span>
                <span className="receipt-group-count">{items.length} receipts</span>
                <span className="receipt-group-total">{groupTotal < 0 ? "−" : ""}${Math.abs(groupTotal).toFixed(0)}</span>
              </div>
              {items.map((r) => (
                <div key={r.id} className="receipt-card">
                  <span className={`receipt-badge ${r.badge_color}`}>{r.badge}</span>
                  <div className="receipt-info">
                    <div className="receipt-vendor">{r.vendor}</div>
                    <div className="receipt-detail">{r.detail}</div>
                  </div>
                  <div className="receipt-amount">{r.amount}</div>
                  <div className="receipt-date">{r.date}</div>
                </div>
              ))}
            </div>
          );
        })
      )}

      <div className="running-total sticky">
        <span className="running-label">total expenses (YTD)</span>
        <span className="running-amount red">{totalYTD < 0 ? "−" : ""}${Math.abs(totalYTD).toFixed(0)}</span>
      </div>
    </div>
  );
}
