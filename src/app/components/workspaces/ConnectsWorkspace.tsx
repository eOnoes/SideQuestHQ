"use client";

import { useState } from "react";

type Contact = {
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

const CONTACTS: Contact[] = [
  {
    name: "Martinez, Carlos", contactType: "cell", phone: "901-555-0142",
    relation: "mechanic · cayman specialist", note: "prefers texts, not calls",
    category: "contractors", subcategory: "mechanical", barColor: "green",
    details: { address: "1247 Elvis Presley Blvd, Memphis TN", email: "carlos.m@mechanical.com", company: "Martinez Auto Works", note: "Prefers texts over calls. $85/hr shop rate." },
  },
  {
    name: "Thompson, Derek", contactType: "cell", phone: "901-555-0198",
    relation: "builder · IRL Cyony", note: "Baja Bug lead · son Logan prints 3D",
    category: "contractors", subcategory: "builder", barColor: "green",
    details: { email: "dthompson.build@gmail.com", company: "Thompson Custom Builds", note: "IRL Cyony. Baja Bug lead builder. 3 years together." },
  },
  {
    name: "Patel, Raj", contactType: "cell", phone: "901-555-0267",
    relation: "electrician · licensed", note: "did W. Lee Ave rewire",
    category: "contractors", subcategory: "electrical", barColor: "green",
    details: { email: "raj.patel@memphiselectric.com", company: "Memphis Electric LLC", note: "Licensed. $95/hr. Available weekdays after 3PM." },
  },
  {
    name: "GreenScape LLC", contactType: "office", phone: "901-555-0310",
    relation: "lawn · monthly service", note: "auto-bill 10th",
    category: "contractors", subcategory: "lawn", barColor: "green",
    details: { address: "4500 Summer Ave, Memphis TN", email: "info@greenscapellc.com", company: "GreenScape Lawn LLC", note: "$75/property/month. Leaf cleanup fall +$50." },
  },
  {
    name: "Mom", contactType: "cell", phone: "901-555-0001",
    relation: "mother", note: "call every Sunday",
    category: "fam", subcategory: "important", barColor: "blue",
    details: { "phone (home)": "901-555-0002", note: "Birthday: March 14. Favorite food: anything you cook for her." },
  },
  {
    name: "Scout & Cyony", contactType: "app", phone: "always on",
    relation: "AI copilots", note: "the empire builders",
    category: "fam", subcategory: "the twins", barColor: "blue",
    details: { company: "SideQuestHQ", note: "Scout=voice+vibes. Cyony=builds+code. Always on." },
  },
  {
    name: "Savage", contactType: "cell", phone: "901-555-0420",
    relation: "coworker · crew", note: "night shift partner",
    category: "fam", subcategory: "crew", barColor: "blue",
    details: { note: "Night shift partner. Has your back. Don't let him pick the music." },
  },
  {
    name: "Operations Manager", contactType: "office", phone: "901-555-0500",
    relation: "management", note: "schedule changes go here",
    category: "work", subcategory: "management", barColor: "orange",
    details: { email: "ops@company.com", note: "PTO, shift swaps. They track everything." },
  },
  {
    name: "Day Shift Lead", contactType: "cell", phone: "901-555-0515",
    relation: "day shift relay", note: "handoff notes",
    category: "work", subcategory: "day shift", barColor: "orange",
    details: { note: "Handoff notes on anything that broke. Read the logbook." },
  },
];

export function ConnectsWorkspace({ onBack }: { onBack: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"alpha" | "category">("alpha");

  // Group contacts
  const grouped: Record<string, Record<string, Contact[]>> = {};
  CONTACTS.forEach((c) => {
    if (!grouped[c.category]) grouped[c.category] = {};
    if (!grouped[c.category][c.subcategory]) grouped[c.category][c.subcategory] = [];
    grouped[c.category][c.subcategory].push(c);
  });

  const sorted = sortBy === "alpha"
    ? [...CONTACTS].sort((a, b) => a.name.localeCompare(b.name))
    : CONTACTS;

  const categoryOrder = ["contractors", "fam", "work"];

  return (
    <div className="workspace-page">
      <div className="workspace-header">
        <button className="workspace-back" onClick={onBack} type="button">←</button>
        <div className="workspace-title-row">
          <span className="workspace-title">◆ connects .focus</span>
          <span className="workspace-count">{CONTACTS.length} contacts</span>
        </div>
        <div className="workspace-stats">
          <span><span className="ws-dot" style={{ background: "#2ecc71" }} />5 contractors</span>
          <span><span className="ws-dot" style={{ background: "#3498db" }} />4 fam</span>
          <span><span className="ws-dot" style={{ background: "#e67e22" }} />5 work</span>
        </div>
      </div>

      <div className="sort-bar">
        <span className={`sort-chip${sortBy === "alpha" ? " active" : ""}`} onClick={() => setSortBy("alpha")}>A → Z</span>
        <span className={`sort-chip${sortBy === "category" ? " active" : ""}`} onClick={() => setSortBy("category")}>by category</span>
      </div>

      {sortBy === "alpha" ? (
        sorted.map((c) => (
          <ContactCard key={c.name + c.category} contact={c} expanded={expanded} onToggle={setExpanded} />
        ))
      ) : (
        categoryOrder.map((cat) => (
          <div key={cat} className="connect-category">
            <div className="connect-category-header">
              <span className="connect-category-title">▸ {cat}</span>
              <span className="connect-category-count">{CONTACTS.filter(c => c.category === cat).length}</span>
            </div>
            {grouped[cat] && Object.entries(grouped[cat]).map(([sub, contacts]) => (
              <div key={sub}>
                <div className="connect-subcategory">// {sub}</div>
                {contacts.map((c) => (
                  <ContactCard key={c.name + sub} contact={c} expanded={expanded} onToggle={setExpanded} />
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
  const id = c.name + c.category;
  const isOpen = expanded === id;

  return (
    <div className={`contact-card${isOpen ? " expanded" : ""}`} onClick={() => onToggle(isOpen ? null : id)}>
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
