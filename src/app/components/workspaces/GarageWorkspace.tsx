"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";

/* ─── Vehicle display type ──────────────────── */
type VehicleDisplay = {
  id: string;
  year: string;
  name: string;
  briefTag: string;
  color: string;
  statusPills: Array<{ label: string; color: string }>;
  data: Array<{ key: string; val: string; color?: string }>;
};

const VEHICLE_COLORS: Record<string, string> = {
  Car: "#f1c40f",
  Truck: "#2ecc71",
  Motorcycle: "#e74c3c",
  Van: "#3498db",
};

function mapVehicle(v: any): VehicleDisplay {
  const color = VEHICLE_COLORS[v.vehicle_type] || "#95a5a6";
  const name = v.vehicle_name || [v.make, v.model].filter(Boolean).join(" ") || "Unknown Vehicle";
  const year = v.model_year ? String(v.model_year).slice(-2) : "??";

  const statusPills = [
    {
      label: v.owned_or_leased === "leased" ? "LEASED" : "PAID OFF",
      color: v.owned_or_leased === "leased" ? "yellow" : "green",
    },
    {
      label: v.availability_status === "available" ? "AVAILABLE" : "UNAVAILABLE",
      color: v.availability_status === "available" ? "green" : "red",
    },
  ];

  const data = [
    { key: "make", val: v.make || "—" },
    { key: "model", val: v.model || "—" },
    { key: "type", val: v.vehicle_type || "Car" },
    { key: "status", val: v.availability_status || "available", color: v.availability_status === "available" ? "green" : "red" },
  ];

  if (v.notes) data.push({ key: "notes", val: v.notes });

  return { id: v.vehicle_id, year, name, briefTag: [v.make, v.model].filter(Boolean).join(" "), color, statusPills, data };
}

/* ─── Component ──────────────────────────────── */
export function GarageWorkspace({ onBack }: { onBack: () => void }) {
  const [vehicles, setVehicles] = useState<VehicleDisplay[]>([]);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    vehicle_name: "", make: "", model: "", model_year: "",
    vehicle_type: "Car", availability_status: "available",
  });

  useEffect(() => { loadVehicles(); }, []);

  async function loadVehicles() {
    try {
      const data = await api.getVehicles();
      setVehicles(data.map(mapVehicle));
    } catch (e) { console.error("Failed to load vehicles:", e); }
    finally { setLoading(false); }
  }

  async function handleAdd() {
    if (!form.vehicle_name && !form.make) return;
    try {
      await api.addVehicle(form);
      setForm({ vehicle_name: "", make: "", model: "", model_year: "", vehicle_type: "Car", availability_status: "available" });
      setShowForm(false);
      setLoading(true);
      await loadVehicles();
    } catch (e) { console.error("Failed to add vehicle:", e); }
  }

  const fleetLabel = vehicles.length > 0 ? `${vehicles.length} vehicle${vehicles.length !== 1 ? "s" : ""}` : "no vehicles";

  return (
    <div className="workspace-page">
      <div className="workspace-header">
        <button className="workspace-back" onClick={onBack} type="button">«</button>
        <div className="workspace-title-row">
          <span className="workspace-title">◆ garage .focus</span>
        </div>
      </div>

      <div className="workspace-scoreboard">
        <div className="scoreboard-main">
          <span className="scoreboard-label">fleet</span>
          <span className="scoreboard-value green">{fleetLabel}</span>
        </div>
        <div className="scoreboard-stats">
          {vehicles.map((v) => (
            <span key={v.id} className="scoreboard-stat">
              <span className="ws-dot" style={{ background: v.color }} />{v.name}
            </span>
          ))}
        </div>
      </div>

      <div className="action-bar">
        <button className="csv-btn" onClick={() => setShowForm(!showForm)} type="button">
          {showForm ? "✕ Cancel" : "+ Add Vehicle"}
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#111", borderRadius: 10, padding: 14, marginTop: 8, border: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input placeholder="Vehicle name" value={form.vehicle_name} onChange={e => setForm({ ...form, vehicle_name: e.target.value })}
              style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="Make" value={form.make} onChange={e => setForm({ ...form, make: e.target.value })}
                style={{ flex: 1, background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
              <input placeholder="Model" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })}
                style={{ flex: 1, background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="Year" value={form.model_year} onChange={e => setForm({ ...form, model_year: e.target.value })}
                style={{ flex: 1, background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
              <select value={form.vehicle_type} onChange={e => setForm({ ...form, vehicle_type: e.target.value })}
                style={{ flex: 1, background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                <option value="Car">Car</option>
                <option value="Truck">Truck</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Van">Van</option>
              </select>
            </div>
            <select value={form.availability_status} onChange={e => setForm({ ...form, availability_status: e.target.value })}
              style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
            <button className="filter-apply-btn" onClick={handleAdd} type="button">Save Vehicle</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#555" }}>loading...</div>
      ) : vehicles.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#555" }}>no vehicles yet — add one above</div>
      ) : (
        <div className="accordion-stack">
          {vehicles.map((v, i) => {
            const isOpen = expanded === i;
            return (
              <div key={v.id + i} className={`accordion-card${isOpen ? " expanded" : ""}`}
                onClick={() => setExpanded(isOpen ? null : i)}>
                <div className="accordion-line" style={{ background: v.color }} />
                <div className="accordion-header">
                  <span className="accordion-year">{v.year}</span>
                  <div className="accordion-info">
                    <div className="accordion-name">{v.name}</div>
                    <div className="accordion-brief">{v.briefTag}</div>
                  </div>
                  <span className="accordion-arrow">{isOpen ? "▲" : "▼"}</span>
                </div>
                {isOpen && (
                  <div className="accordion-details">
                    <div className="accordion-pills">
                      {v.statusPills.map((p) => (
                        <span key={p.label} className={`pill ${p.color}`}>{p.label}</span>
                      ))}
                    </div>
                    <div className="accordion-rows">
                      {v.data.map((d) => (
                        <div key={d.key} className="accordion-row">
                          <span className="row-key">{d.key}</span>
                          <span className={`row-val${d.color ? ` ${d.color}` : ""}`}>{d.val}</span>
                        </div>
                      ))}
                    </div>
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
