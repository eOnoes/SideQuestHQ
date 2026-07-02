"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";

type PropertyDisplay = {
  id: string;
  number: string;
  street: string;
  location: string;
  status: string;
  color: string;
  occupied: boolean;
  paidOff: boolean;
  data: Array<{ key: string; val: string; color?: string }>;
};

function mapProperty(p: any): PropertyDisplay {
  const occupied = p.rental_status === "full";
  const paidOff = p.ownership_status === "owned";
  const color = occupied ? "#2ecc71" : "#e74c3c";
  const number = p.street_address ? p.street_address.split(" ")[0] : "—";
  const street = p.street_address ? p.street_address.split(" ").slice(1).join(" ") || p.street_address : "—";
  const location = [p.city, p.state].filter(Boolean).join(", ") || "—";
  const status = occupied ? "occupied" : "vacant";

  const data = [
    { key: "address", val: [p.street_address, p.city, p.state].filter(Boolean).join(", ") || "—" },
    { key: "property", val: p.property_name || "—" },
    { key: "rent_type", val: p.rent_type || "House" },
    { key: "rental", val: p.rental_status || "available", color: occupied ? "green" : "red" },
    { key: "ownership", val: p.ownership_status || "owned", color: paidOff ? "green" : "orange" },
  ];

  if (p.notes) data.push({ key: "notes", val: p.notes });

  return {
    id: p.property_id || p.street_address || location,
    number,
    street,
    location,
    status,
    color,
    occupied,
    paidOff,
    data,
  };
}

export function HousesWorkspace({ onBack }: { onBack: () => void }) {
  const [properties, setProperties] = useState<PropertyDisplay[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    property_name: "",
    street_address: "",
    city: "",
    state: "",
    ownership_status: "owned",
    rental_status: "available",
    notes: "",
  });

  useEffect(() => { loadProperties(); }, []);

  async function loadProperties() {
    try {
      const data = await api.getProperties();
      setProperties(data.map(mapProperty));
    } catch (e) {
      console.error("Failed to load properties:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!form.street_address && !form.property_name) return;
    try {
      await api.addProperty(form);
      setForm({ property_name: "", street_address: "", city: "", state: "", ownership_status: "owned", rental_status: "available", notes: "" });
      setShowForm(false);
      setLoading(true);
      await loadProperties();
    } catch (e) {
      console.error("Failed to add property:", e);
    }
  }

  return (
    <div className="workspace-page single-header">
      <div className="workspace-header">
        <div className="workspace-header-row">
          <button className="workspace-back" onClick={onBack} type="button">«</button>
          <div className="workspace-title-row">
            <span className="workspace-title">Assets</span>
          </div>
          <button className="workspace-add-btn" onClick={() => setShowForm((open) => !open)} type="button">
            {showForm ? "✕ Close" : "+ Add"}
          </button>
        </div>
      </div>

      <div className="workspace-scroll">
        {showForm && (
          <div className="add-form">
            <input className="form-input" placeholder="Property name" value={form.property_name} onChange={(e) => setForm({ ...form, property_name: e.target.value })} />
            <input className="form-input" placeholder="Street address" value={form.street_address} onChange={(e) => setForm({ ...form, street_address: e.target.value })} />
            <div className="form-row-split">
              <input className="form-input" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <input className="form-input" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div className="form-row-split">
              <select className="form-input" value={form.ownership_status} onChange={(e) => setForm({ ...form, ownership_status: e.target.value })}>
                <option value="owned">Owned</option>
                <option value="leased">Leased</option>
              </select>
              <select className="form-input" value={form.rental_status} onChange={(e) => setForm({ ...form, rental_status: e.target.value })}>
                <option value="available">Vacant</option>
                <option value="full">Occupied</option>
              </select>
            </div>
            <input className="form-input" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <button className="form-submit" onClick={handleAdd} type="button">Save Property</button>
          </div>
        )}

        {loading ? (
          <div className="workspace-loading">loading...</div>
        ) : properties.length === 0 ? (
          <div className="workspace-empty">no properties yet</div>
        ) : (
          <div className="accordion-stack">
            {properties.map((p, i) => {
              const cardId = `${p.id}-${i}`;
              const isOpen = expanded === cardId;
              return (
                <div key={cardId} className={`accordion-card card-cut${isOpen ? " expanded" : ""}`} onClick={() => setExpanded(isOpen ? null : cardId)}>
                  <div className="accordion-line" style={{ background: p.color }} />
                  <div className="accordion-header">
                    <span className="property-number">{p.number}</span>
                    <div className="accordion-info">
                      <div className="accordion-name">{p.street}</div>
                      <div className="accordion-brief">{p.location}</div>
                    </div>
                    <div className="card-right">
                      <span className="card-right-main">{p.location}</span>
                      <span className="card-right-sub">{p.status}</span>
                    </div>
                  </div>
                  <div className="accordion-details">
                    <div className="accordion-pills">
                      <span className={`pill ${p.occupied ? "green" : "red"}`}>{p.occupied ? "OCCUPIED" : "VACANT"}</span>
                      <span className={`pill ${p.paidOff ? "green" : "orange"}`}>{p.paidOff ? "PAID OFF" : "FINANCED"}</span>
                    </div>
                    <div className="accordion-rows">
                      {p.data.map((d) => (
                        <div key={d.key} className="accordion-row">
                          <span className="row-key">{d.key}</span>
                          <span className={`row-val${d.color ? ` ${d.color}` : ""}`}>{d.val}</span>
                        </div>
                      ))}
                    </div>
                    {!p.occupied && <div className="vacancy-alert">UNOCCUPIED - reminder active on main page</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
