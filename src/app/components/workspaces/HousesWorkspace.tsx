"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";

/* ─── Property display type ─────────────────── */
type PropertyDisplay = {
  id: string;
  number: string;
  state: string;
  city: string;
  street: string;
  color: string;
  briefTag: string;
  occupied: boolean;
  paidOff: boolean;
  data: Array<{ key: string; val: string; color?: string }>;
};

function mapProperty(p: any): PropertyDisplay {
  const occupied = p.rental_status === "full";
  const paidOff = p.ownership_status === "owned";
  const color = occupied ? "#2ecc71" : "#e74c3c";
  const streetNum = p.street_address ? p.street_address.split(" ")[0] : "—";

  const briefParts: string[] = [];
  briefParts.push(occupied ? "occupied" : "vacant");
  briefParts.push(paidOff ? "paid off" : "financed");

  const data = [
    { key: "address", val: [p.street_address, p.city, p.state].filter(Boolean).join(", ") || "—" },
    { key: "rent_type", val: p.rent_type || "House" },
    { key: "status", val: p.rental_status || "available", color: occupied ? "green" : "red" },
    { key: "ownership", val: p.ownership_status || "owned", color: paidOff ? "green" : "orange" },
  ];

  if (p.notes) data.push({ key: "notes", val: p.notes });

  return {
    id: p.property_id,
    number: streetNum,
    state: p.state || "—",
    city: p.city || "—",
    street: p.street_address || "—",
    color,
    briefTag: briefParts.join(" | "),
    occupied,
    paidOff,
    data,
  };
}

/* ─── Component ──────────────────────────────── */
export function HousesWorkspace({ onBack }: { onBack: () => void }) {
  const [properties, setProperties] = useState<PropertyDisplay[]>([]);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    property_name: "", street_address: "", city: "", state: "",
    ownership_status: "owned", rental_status: "available", notes: "",
  });

  useEffect(() => { loadProperties(); }, []);

  async function loadProperties() {
    try {
      const data = await api.getProperties();
      setProperties(data.map(mapProperty));
    } catch (e) { console.error("Failed to load properties:", e); }
    finally { setLoading(false); }
  }

  async function handleAdd() {
    if (!form.street_address && !form.property_name) return;
    try {
      await api.addProperty(form);
      setForm({ property_name: "", street_address: "", city: "", state: "", ownership_status: "owned", rental_status: "available", notes: "" });
      setShowForm(false);
      setLoading(true);
      await loadProperties();
    } catch (e) { console.error("Failed to add property:", e); }
  }

  const occupied = properties.filter(p => p.occupied).length;
  const vacant = properties.filter(p => !p.occupied).length;

  return (
    <div className="workspace-page">
      <div className="workspace-header">
        <button className="workspace-back" onClick={onBack} type="button">←</button>
        <div className="workspace-title-row">
          <span className="workspace-title">◆ assets .houses</span>
        </div>
      </div>

      <div className="workspace-scoreboard">
        <div className="scoreboard-main">
          <span className="scoreboard-label">portfolio</span>
          <span className="scoreboard-value green">{properties.length} properties</span>
        </div>
        <div className="scoreboard-stats">
          <span className="scoreboard-stat"><span className="ws-dot" style={{ background: "#2ecc71" }} />{occupied} occupied</span>
          <span className="scoreboard-stat"><span className="ws-dot" style={{ background: "#e74c3c" }} />{vacant} vacant</span>
        </div>
      </div>

      <div className="action-bar">
        <button className="csv-btn" onClick={() => setShowForm(!showForm)} type="button">
          {showForm ? "✕ Cancel" : "+ Add Property"}
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#111", borderRadius: 10, padding: 14, marginTop: 8, border: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input placeholder="Property name" value={form.property_name} onChange={e => setForm({ ...form, property_name: e.target.value })}
              style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
            <input placeholder="Street address" value={form.street_address} onChange={e => setForm({ ...form, street_address: e.target.value })}
              style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                style={{ flex: 1, background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
              <input placeholder="State" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
                style={{ width: 80, background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select value={form.ownership_status} onChange={e => setForm({ ...form, ownership_status: e.target.value })}
                style={{ flex: 1, background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                <option value="owned">Owned</option>
                <option value="leased">Leased</option>
              </select>
              <select value={form.rental_status} onChange={e => setForm({ ...form, rental_status: e.target.value })}
                style={{ flex: 1, background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                <option value="available">Vacant</option>
                <option value="full">Occupied</option>
              </select>
            </div>
            <button className="filter-apply-btn" onClick={handleAdd} type="button">Save Property</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#555" }}>loading...</div>
      ) : properties.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#555" }}>no properties yet — add one above</div>
      ) : (
        <div className="accordion-stack">
          {properties.map((p, i) => {
            const isOpen = expanded === i;
            return (
              <div key={p.id + i} className={`accordion-card${isOpen ? " expanded" : ""}`}
                onClick={() => setExpanded(isOpen ? null : i)}>
                <div className="accordion-line" style={{ background: p.color }} />
                <div className="accordion-header">
                  <span className="accordion-year">{p.number}</span>
                  <div className="accordion-info">
                    <div className="address-stack">
                      <div className="address-loc">{p.state} · {p.city}</div>
                      <div className="accordion-name">{p.street}</div>
                    </div>
                    <div className="accordion-brief">{p.briefTag}</div>
                  </div>
                  <span className="accordion-arrow">{isOpen ? "▲" : "▼"}</span>
                </div>
                {isOpen && (
                  <div className="accordion-details">
                    <div className="accordion-pills">
                      <span className={`pill ${p.occupied ? "green" : "red"}`}>
                        {p.occupied ? "OCCUPIED" : "VACANT"}
                      </span>
                      <span className={`pill ${p.paidOff ? "green" : "orange"}`}>
                        {p.paidOff ? "PAID OFF" : "FINANCED"}
                      </span>
                    </div>
                    <div className="accordion-rows">
                      {p.data.map((d) => (
                        <div key={d.key} className="accordion-row">
                          <span className="row-key">{d.key}</span>
                          <span className={`row-val${d.color ? ` ${d.color}` : ""}`}>{d.val}</span>
                        </div>
                      ))}
                    </div>
                    {!p.occupied && (
                      <div className="vacancy-alert">
                        <span>⚠</span> UNOCCUPIED — reminder active on main page
                      </div>
                    )}
                  </div>
                )}
                <span className="accordion-index">{String(i + 1).padStart(3, "0")}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
