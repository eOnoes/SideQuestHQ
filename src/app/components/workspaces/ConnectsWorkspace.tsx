"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";

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
  const category = c.category || "general";
  return {
    id: String(c.id || c.name),
    name: c.name || "—",
    contactType: c.contact_type || "cell",
    phone: c.phone || "—",
    relation: c.relation || "",
    note: c.note || "",
    category,
    subcategory: c.subcategory || "",
    barColor: c.bar_color || CATEGORY_COLORS[category] || "green",
    details: c.details || {},
  };
}

export function ConnectsWorkspace({ onBack }: { onBack: () => void }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"alpha" | "category">("alpha");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    relation: "",
    note: "",
    category: "contractors",
    subcategory: "",
    contact_type: "cell",
  });

  useEffect(() => { loadContacts(); }, []);

  async function loadContacts() {
    try {
      const data = await api.getContacts();
      setContacts(data.map(mapContact));
    } catch (e) {
      console.error("Failed to load contacts:", e);
    } finally {
      setLoading(false);
    }
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
    } catch (e) {
      console.error("Failed to add contact:", e);
    }
  }

  const grouped: Record<string, Record<string, Contact[]>> = {};
  contacts.forEach((c) => {
    if (!grouped[c.category]) grouped[c.category] = {};
    const sub = c.subcategory || "";
    if (!grouped[c.category][sub]) grouped[c.category][sub] = [];
    grouped[c.category][sub].push(c);
  });

  const sorted = [...contacts].sort((a, b) => a.name.localeCompare(b.name));
  const categoryOrder = ["contractors", "fam", "work", "general"];

  return (
    <div className="workspace-page single-header">
      <div className="workspace-header">
        <div className="workspace-header-row">
          <button className="workspace-back" onClick={onBack} type="button">«</button>
          <div className="workspace-title-row">
            <span className="workspace-title">Connects</span>
          </div>
          <button className="workspace-add-btn" onClick={() => setShowForm((open) => !open)} type="button">
            {showForm ? "✕ Close" : "+ Add"}
          </button>
        </div>
      </div>

      <div className="workspace-scroll">
        {showForm && (
          <div className="add-form">
            <input className="form-input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="form-row-split">
              <input className="form-input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="form-input" placeholder="Role / Relation" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} />
            </div>
            <div className="form-row-split">
              <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="contractors">contractors</option>
                <option value="fam">fam</option>
                <option value="work">work</option>
                <option value="general">general</option>
              </select>
              <input className="form-input" placeholder="Subcategory" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} />
            </div>
            <input className="form-input" placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            <button className="form-submit" onClick={handleAdd} type="button">Save Contact</button>
          </div>
        )}

        <div className="sort-bar">
          <button className={`sort-chip${sortBy === "alpha" ? " active" : ""}`} onClick={() => setSortBy("alpha")} type="button">A → Z</button>
          <button className={`sort-chip${sortBy === "category" ? " active" : ""}`} onClick={() => setSortBy("category")} type="button">by category</button>
        </div>

        {loading ? (
          <div className="workspace-loading">loading...</div>
        ) : contacts.length === 0 ? (
          <div className="workspace-empty">no contacts yet</div>
        ) : sortBy === "alpha" ? (
          <div className="tx-list">
            {sorted.map((c) => (
              <ContactCard key={c.id} contact={c} expanded={expanded} onToggle={setExpanded} />
            ))}
          </div>
        ) : (
          categoryOrder.filter((cat) => grouped[cat]).map((cat) => (
            <div key={cat} className="connect-category">
              <div className="connect-category-header">
                <span className="connect-category-title">{cat}</span>
                <span className="connect-category-count">{contacts.filter((c) => c.category === cat).length}</span>
              </div>
              {Object.entries(grouped[cat]).map(([sub, group]) => (
                <div key={sub || cat}>
                  {sub && <div className="connect-subcategory">// {sub}</div>}
                  <div className="tx-list">
                    {group.map((c) => (
                      <ContactCard key={c.id} contact={c} expanded={expanded} onToggle={setExpanded} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ContactCard({ contact: c, expanded, onToggle }: { contact: Contact; expanded: string | null; onToggle: (id: string | null) => void }) {
  const isOpen = expanded === c.id;
  const details = {
    name: c.name,
    phone: c.phone,
    relation: c.relation || "—",
    note: c.note || "—",
    category: c.category,
    subcategory: c.subcategory || "—",
    contact_type: c.contactType,
    ...c.details,
  };

  return (
    <div className={`contact-card card-cut${isOpen ? " expanded" : ""}`} onClick={() => onToggle(isOpen ? null : c.id)}>
      <div className={`contact-bar ${c.barColor}`} />
      <div className="contact-header-row">
        <div className="contact-info">
          <div className="contact-name">{c.name}</div>
          <div className="contact-relation">{c.relation || c.note || "contact"}</div>
        </div>
        <div className="contact-right">
          <span className="contact-phone">{c.phone}</span>
          <span className={`pill ${c.barColor}`}>{c.category}</span>
        </div>
      </div>
      <div className="contact-details">
        {Object.entries(details).map(([k, v]) => v && (
          <div key={k} className="contact-detail-row">
            <span className="detail-key">{k}</span>
            <span className="detail-val">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
