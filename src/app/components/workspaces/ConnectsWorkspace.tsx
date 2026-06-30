"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";

/* ─── Contact display type ──────────────────── */
type Contact = {
  id: string;
  name: string;
  contactType: string;
  phone: string;
  relation: string;
  note: string;
  category: string;
  subcategory: string;
  barColor: string;
  details: Record<string, string>;
};

const CATEGORY_COLORS: Record<string, string> = {
  contractors: "green",
  fam: "blue",
  work: "orange",
  general: "green",
};

function mapContact(c: any): Contact {
  return {
    id: String(c.id),
    name: c.name || "—",
    contactType: c.contact_type || "cell",
    phone: c.phone || "—",
    relation: c.relation || "",
    note: c.note || "",
    category: c.category || "general",
    subcategory: c.subcategory || "",
    barColor: c.bar_color || CATEGORY_COLORS[c.category] || "green",
    details: c.details || {},
  };
}

/* ─── Component ──────────────────────────────── */
export function ConnectsWorkspace({ onBack }: { onBack: () => void }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"alpha" | "category">("alpha");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", relation: "", note: "",
    category: "contractors", subcategory: "", contact_type: "cell",
  });

  useEffect(() => { loadContacts(); }, []);

  async function loadContacts() {
    try {
      const data = await api.getContacts();
      setContacts(data.map(mapContact));
    } catch (e) { console.error("Failed to load contacts:", e); }
    finally { setLoading(false); }
  }

  async function handleAdd() {
    if (!form.name) return;
    const barColor = CATEGORY_COLORS[form.category] || "green";
    try {
      await api.addContact({ ...form, bar_color: barColor });
      setForm({ name: "", phone: "", relation: "", note: "", category: "contractors", subcategory: "", contact_type: "cell" });
      setShowForm(false);
      setLoading(true);
      await loadContacts();
    } catch (e) { console.error("Failed to add contact:", e); }
  }

  // Group contacts
  const grouped: Record<string, Record<string, Contact[]>> = {};
  contacts.forEach((c) => {
    if (!grouped[c.category]) grouped[c.category] = {};
    if (!grouped[c.category][c.subcategory]) grouped[c.category][c.subcategory] = [];
    grouped[c.category][c.subcategory].push(c);
  });

  const sorted = sortBy === "alpha"
    ? [...contacts].sort((a, b) => a.name.localeCompare(b.name))
    : contacts;

  const categoryOrder = ["contractors", "fam", "work", "general"];

  // Count by category
  const catCounts: Record<string, number> = {};
  contacts.forEach(c => { catCounts[c.category] = (catCounts[c.category] || 0) + 1; });

  return (
    <div className="workspace-page">
      <div className="workspace-header">
        <button className="workspace-back" onClick={onBack} type="button">«</button>
        <div className="workspace-title-row">
          <span className="workspace-title">◆ connects .focus</span>
        </div>
      </div>

      <div className="workspace-scoreboard">
        <div className="scoreboard-main">
          <span className="scoreboard-label">contacts</span>
          <span className="scoreboard-value">{contacts.length}</span>
        </div>
        <div className="scoreboard-stats">
          {Object.entries(catCounts).map(([cat, count]) => (
            <span key={cat} className="scoreboard-stat">
              <span className="ws-dot" style={{ background: CATEGORY_COLORS[cat] || "#888" }} />{count} {cat}
            </span>
          ))}
        </div>
      </div>

      <div className="action-bar">
        <button className="csv-btn" onClick={() => setShowForm(!showForm)} type="button">
          {showForm ? "✕ Cancel" : "+ Add Contact"}
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#111", borderRadius: 10, padding: 14, marginTop: 8, border: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                style={{ flex: 1, background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
              <input placeholder="Role / Relation" value={form.relation} onChange={e => setForm({ ...form, relation: e.target.value })}
                style={{ flex: 1, background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                style={{ flex: 1, background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                <option value="contractors">contractors</option>
                <option value="fam">fam</option>
                <option value="work">work</option>
                <option value="general">general</option>
              </select>
              <input placeholder="Subcategory" value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })}
                style={{ flex: 1, background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
            </div>
            <input placeholder="Note" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
              style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
            <button className="filter-apply-btn" onClick={handleAdd} type="button">Save Contact</button>
          </div>
        </div>
      )}

      <div className="sort-bar">
        <span className={`sort-chip${sortBy === "alpha" ? " active" : ""}`} onClick={() => setSortBy("alpha")}>A → Z</span>
        <span className={`sort-chip${sortBy === "category" ? " active" : ""}`} onClick={() => setSortBy("category")}>by category</span>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#555" }}>loading...</div>
      ) : contacts.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#555" }}>no contacts yet — add one above</div>
      ) : sortBy === "alpha" ? (
        sorted.map((c) => (
          <ContactCard key={c.id} contact={c} expanded={expanded} onToggle={setExpanded} />
        ))
      ) : (
        categoryOrder.filter(cat => grouped[cat]).map((cat) => (
          <div key={cat} className="connect-category">
            <div className="connect-category-header">
              <span className="connect-category-title">▸ {cat}</span>
              <span className="connect-category-count">{contacts.filter(c => c.category === cat).length}</span>
            </div>
            {Object.entries(grouped[cat]).map(([sub, contacts]) => (
              <div key={sub}>
                {sub && <div className="connect-subcategory">// {sub}</div>}
                {contacts.map((c) => (
                  <ContactCard key={c.id} contact={c} expanded={expanded} onToggle={setExpanded} />
                ))}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

function ContactCard({ contact: c, expanded, onToggle }: { contact: Contact; expanded: string | null; onToggle: (id: string | null) => void }) {
  const isOpen = expanded === c.id;

  return (
    <div className={`contact-card${isOpen ? " expanded" : ""}`} onClick={() => onToggle(isOpen ? null : c.id)}>
      <div className={`contact-bar ${c.barColor}`} />
      <div className="contact-header-row">
        <span className="contact-name">{c.name}</span>
        <span className="contact-type">{c.contactType}</span>
        <span className="contact-phone">{c.phone}</span>
      </div>
      <div className="contact-sub-row">
        <span className="contact-relation">{c.relation}</span>
        <span className="contact-note">{c.note}</span>
      </div>
      {isOpen && Object.keys(c.details).length > 0 && (
        <div className="contact-details">
          {Object.entries(c.details).map(([k, v]) => v && (
            <div key={k} className="contact-detail-row">
              <span className="detail-key">{k}</span>
              <span className="detail-val">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
