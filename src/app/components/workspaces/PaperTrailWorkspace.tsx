"use client";

import { useEffect, useMemo, useState } from "react";
import * as api from "@/lib/api";

type Receipt = {
  id: string;
  vendor: string;
  detail: string;
  amount: string;
  date: string;
  category: string;
  badge: string;
  badgeColor: string;
};
type ReceiptGroup = { title: string; count: string; total: string; items: Receipt[] };

const FILTER_CHIPS = ["all", "property", "vehicle", "personal", "uncategorized"];
const CATEGORY_COLORS: Record<string, string> = {
  property: "#2ecc71",
  vehicle: "#f1c40f",
  personal: "#3498db",
  uncategorized: "#888",
  digital: "#9b59b6",
  receipts: "#e67e22",
  manual: "#e67e22",
};

function mapDocument(d: any, index: number): Receipt {
  return {
    id: String(d.id || d.document_id || index),
    vendor: d.vendor || "—",
    detail: d.detail || "",
    amount: d.amount || "$0",
    date: d.date || "",
    category: d.category || "uncategorized",
    badge: d.badge || "manual",
    badgeColor: d.badge_color || d.badge || "manual",
  };
}

function amountNumber(amount: string) {
  return parseFloat(amount.replace(/[^0-9.\-]/g, "")) || 0;
}

function yearFromDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getFullYear();
}

export function PaperTrailWorkspace({ onBack }: { onBack: () => void }) {
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
  const [documents, setDocuments] = useState<Receipt[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [addMode, setAddMode] = useState<"closed" | "options" | "manual">("closed");
  const [form, setForm] = useState({
    vendor: "",
    detail: "",
    amount: "$0",
    date: "",
    category: "uncategorized",
  });

  useEffect(() => { loadDocuments(); }, []);

  async function loadDocuments() {
    try {
      const data = await api.getGlobalDocuments();
      setDocuments(data.map(mapDocument));
    } catch (e) {
      console.error("Failed to load documents:", e);
    } finally {
      setLoading(false);
    }
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
      setAddMode("closed");
      setLoading(true);
      await loadDocuments();
    } catch (e) {
      console.error("Failed to add document:", e);
    }
  }

  const yearsWithData = useMemo(() => new Set(documents.map((doc) => yearFromDate(doc.date)).filter((year): year is number => year !== null)), [documents]);
  const filteredDocuments = documents.filter((doc) => {
    const matchesFilter = activeFilter === "all" || doc.category === activeFilter || doc.badgeColor === activeFilter;
    const matchesYear = yearFromDate(doc.date) === selectedYear;
    return matchesFilter && matchesYear;
  });

  const groups = useMemo<ReceiptGroup[]>(() => {
    const grouped: Record<string, Receipt[]> = {};
    for (const item of filteredDocuments) {
      const cat = item.category || (item.badgeColor === "digital" ? "digital" : item.badgeColor === "receipt" ? "receipts" : "manual");
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }

    return Object.entries(grouped).map(([title, items]) => {
      const total = items.reduce((sum, item) => sum + amountNumber(item.amount), 0);
      return {
        title,
        count: `${items.length} receipt${items.length !== 1 ? "s" : ""}`,
        total: `-$${Math.abs(total).toLocaleString()}`,
        items: items.sort((a, b) => (b.date || "").localeCompare(a.date || "")),
      };
    });
  }, [filteredDocuments]);

  const totalExpenses = filteredDocuments.reduce((sum, doc) => sum + amountNumber(doc.amount), 0);
  const addOpen = addMode !== "closed";

  return (
    <div className="workspace-page has-summary paper-trail-page">
      <div className="workspace-header">
        <div className="workspace-header-row">
          <button className="workspace-back" onClick={onBack} type="button">«</button>
          <div className="workspace-title-row">
            <span className="workspace-title">Paper Trail</span>
          </div>
          <button className="workspace-add-btn" onClick={() => setAddMode(addOpen ? "closed" : "options")} type="button">
            {addOpen ? "✕ Close" : "+ Add"}
          </button>
        </div>
      </div>

      <div className="workspace-summary-bar paper-summary-bar">
        <button className="workspace-summary-toggle" onClick={() => setShowYearSelector((open) => !open)} type="button">
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Year to date expenses</span>
              <span className="summary-value red">-${Math.abs(totalExpenses).toLocaleString()}</span>
            </div>
            <div className="summary-item right">
              <span className="summary-label">Year</span>
              <span className="summary-value">{selectedYear}</span>
            </div>
          </div>
        </button>
      </div>

      <div className="workspace-scroll">
        <div className="filter-bar">
          <button className={`filter-icon-btn${showFilter ? " active" : ""}`} onClick={() => setShowFilter(!showFilter)} type="button">⚙</button>
          <div className="filter-chips">
            {FILTER_CHIPS.map((chip) => (
              <button key={chip} className={`filter-chip${activeFilter === chip ? " selected" : ""}`} onClick={() => setActiveFilter(chip)} type="button">
                {chip}
              </button>
            ))}
          </div>
        </div>

        {showYearSelector && (
          <div className="add-form">
            <div className="year-selector">
              {yearOptions.map((year) => {
                const enabled = yearsWithData.has(year) || year === currentYear;
                return (
                  <button
                    key={year}
                    className={`year-chip${selectedYear === year ? " active" : ""}${enabled ? "" : " disabled"}`}
                    disabled={!enabled}
                    onClick={() => { setSelectedYear(year); setShowYearSelector(false); }}
                    type="button"
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          </div>
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
                  <button key={chip} className={`filter-chip${activeFilter === chip ? " selected" : ""}`} onClick={() => setActiveFilter(chip)} type="button">
                    {chip}
                  </button>
                ))}
              </div>
              <button className="filter-apply-btn" onClick={() => setShowFilter(false)} type="button">apply filters</button>
            </div>
          </div>
        )}

        {addMode === "options" && (
          <div className="add-options">
            <button className="option-btn" onClick={() => setAddMode("manual")} type="button">Manual</button>
            <button className="option-btn" onClick={() => setAddMode("closed")} type="button">Picture</button>
            <button className="option-btn" onClick={() => setAddMode("closed")} type="button">CSV</button>
          </div>
        )}

        {addMode === "manual" && (
          <div className="add-form">
            <input className="form-input" placeholder="Vendor / Source" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
            <input className="form-input" placeholder="Detail" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
            <div className="form-row-split">
              <input className="form-input" placeholder="Amount ($)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="property">property</option>
              <option value="vehicle">vehicle</option>
              <option value="personal">personal</option>
              <option value="uncategorized">uncategorized</option>
            </select>
            <button className="form-submit" onClick={handleAdd} type="button">Save Receipt</button>
          </div>
        )}

        {loading ? (
          <div className="workspace-loading">loading...</div>
        ) : groups.length === 0 ? (
          <div className="workspace-empty">no receipts for {selectedYear}</div>
        ) : (
          groups.map((g) => (
            <div key={g.title} className="receipt-group">
              <div className="receipt-group-header">
                <span className="receipt-group-title">{g.title}</span>
                <span className="receipt-group-count">{g.count}</span>
                <span className="receipt-group-total">{g.total}</span>
              </div>
              <div className="tx-list">
                {g.items.map((r) => {
                  const isOpen = expanded === r.id;
                  return (
                    <div key={r.id} className={`receipt-card card-cut${isOpen ? " expanded" : ""}`} onClick={() => setExpanded(isOpen ? null : r.id)}>
                      <div className="receipt-bar" style={{ background: CATEGORY_COLORS[r.category] || CATEGORY_COLORS[r.badgeColor] || "#888" }} />
                      <div className="receipt-header-row">
                        <div className="receipt-info">
                          <div className="receipt-vendor">{r.vendor}</div>
                          <div className="receipt-detail">{r.detail || r.category}</div>
                        </div>
                        <div className="receipt-right">
                          <span className="receipt-amount">{r.amount}</span>
                          <span className="receipt-date">{r.date || "--"}</span>
                          <span className={`receipt-badge ${r.badgeColor}`}>{r.badge}</span>
                        </div>
                      </div>
                      <div className="receipt-details">
                        {[
                          ["vendor", r.vendor],
                          ["detail", r.detail || "—"],
                          ["amount", r.amount],
                          ["date", r.date || "—"],
                          ["category", r.category],
                          ["type", r.badge],
                        ].map(([key, val]) => (
                          <div key={key} className="receipt-detail-row">
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
