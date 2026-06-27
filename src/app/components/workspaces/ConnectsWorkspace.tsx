"use client";

import { useState, useEffect } from "react";
import * as api from "@/lib/api";

type Contact = {
  id: number;
  name: string;
  contact_type: string;
  phone: string;
  relation: string;
  note: string;
  category: string;
  subcategory: string;
  bar_color: string;
  details: Record<string, string>;
};

export function ConnectsWorkspace({ onBack }: { onBack: () => void }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"alpha" | "category">("alpha");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    contact_type: "cell",
    phone: "",
    relation: "",
    note: "",
    category: "general",
    subcategory: "",
    bar_color: "green",
    details: {} as Record<string, string>,
  });

  useEffect(() => {
    api.getContacts().then((data) => {
      setContacts(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

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

  const categoryOrder = [...new Set(contacts.map(c => c.category))];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await api.addContact(form);
    setForm({ name: "", contact_type: "cell", phone: "", relation: "", note: "", category: "general", subcategory: "", bar_color: "green", details: {} });
    setShowForm(false);
    const data = await api.getContacts();
    setContacts(data);
  }

  const contractors = contacts.filter(c => c.category === "contractors").length;
  const fam = contacts.filter(c => c.category === "fam").length;
  const work = contacts.filter(c => c.category === "work").length;

  return (
    <div className="workspace-page">
      <div className="workspace-header">
        <button className="workspace-back" onClick={onBack} type="button">←</button>
        <div className="workspace-title-row">
          <span className="workspace-title">◆ connects .focus</span>
          <button className="workspace-add-btn" onClick={() => setShowForm(!showForm)} type="button">
            {showForm ? "✕" : "+"}
          </button>
        </div>
      </div>

      <div className="workspace-scoreboard">
        <div className="scoreboard-main">
          <span className="scoreboard-label">contacts</span>
          <span className="scoreboard-value">{contacts.length}</span>
        </div>
        <div className="scoreboard-stats">
          <span className="scoreboard-stat"><span className="ws-dot" style={{ background: "#2ecc71" }} />{contractors} contractors</span>
          <span className="scoreboard-stat"><span className="ws-dot" style={{ background: "#3498db" }} />{fam} fam</span>
          <span className="scoreboard-stat"><span className="ws-dot" style={{ background: "#e67e22" }} />{work} work</span>
        </div>
      </div>

      {showForm && (
        <form className="add-form" onSubmit={handleAdd}>
          <div className="form-row">
            <input
              className="form-input"
              placeholder="Name (e.g. Martinez, Carlos)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-row form-row-split">
            <input
              className="form-input"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <select
              className="form-input"
              value={form.contact_type}
              onChange={(e) => setForm({ ...form, contact_type: e.target.value })}
            >
              <option value="cell">cell</option>
              <option value="office">office</option>
              <option value="email">email</option>
              <option value="app">app</option>
            </select>
          </div>
          <div className="form-row">
            <input
              className="form-input"
              placeholder="Relation (e.g. mechanic · cayman specialist)"
              value={form.relation}
              onChange={(e) => setForm({ ...form, relation: e.target.value })}
            />
          </div>
          <div className="form-row form-row-split">
            <select
              className="form-input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="contractors">contractors</option>
              <option value="fam">fam</option>
              <option value="work">work</option>
              <option value="general">general</option>
            </select>
            <input
              className="form-input"
              placeholder="Subcategory"
              value={form.subcategory}
              onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
            />
          </div>
          <div className="form-row">
            <input
              className="form-input"
              placeholder="Note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
          <div className="form-row">
            <select
              className="form-input"
              value={form.bar_color}
              onChange={(e) => setForm({ ...form, bar_color: e.target.value })}
            >
              <option value="green">green</option>
              <option value="blue">blue</option>
              <option value="orange">orange</option>
            </select>
          </div>
          <button className="form-submit" type="submit">Add Contact</button>
        </form>
      )}

      <div className="sort-bar">
        <span className={`sort-chip${sortBy === "alpha" ? " active" : ""}`} onClick={() => setSortBy("alpha")}>A → Z</span>
        <span className={`sort-chip${sortBy === "category" ? " active" : ""}`} onClick={() => setSortBy("category")}>by category</span>
      </div>

      {loading ? (
        <div className="workspace-loading">Loading contacts...</div>
      ) : contacts.length === 0 ? (
        <div className="workspace-empty">
          <p>No contacts yet</p>
          <button className="workspace-empty-btn" onClick={() => setShowForm(true)} type="button">+ Add your first contact</button>
        </div>
      ) : sortBy === "alpha" ? (
        sorted.map((c) => (
          <ContactCard key={c.id} contact={c} expanded={expanded} onToggle={setExpanded} />
        ))
      ) : (
        categoryOrder.map((cat) => (
          <div key={cat} className="connect-category">
            <div className="connect-category-header">
              <span className="connect-category-title">▸ {cat}</span>
              <span className="connect-category-count">{contacts.filter(c => c.category === cat).length}</span>
            </div>
            {grouped[cat] && Object.entries(grouped[cat]).map(([sub, items]) => (
              <div key={sub}>
                <div className="connect-subcategory">// {sub}</div>
                {items.map((c) => (
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
  const id = String(c.id);
  const isOpen = expanded === id;

  return (
    <div className={`contact-card${isOpen ? " expanded" : ""}`} onClick={() => onToggle(isOpen ? null : id)}>
      <div className={`contact-bar ${c.bar_color}`} />
      <div className="contact-header-row">
        <span className="contact-name">{c.name}</span>
        <span className="contact-type">{c.contact_type}</span>
        <span className="contact-phone">{c.phone}</span>
      </div>
      <div className="contact-sub-row">
        <span className="contact-relation">{c.relation}</span>
        <span className="contact-note">{c.note}</span>
      </div>
      {isOpen && c.details && Object.keys(c.details).length > 0 && (
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
