"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";

type VehicleDisplay = {
  id: string;
  year: string;
  makeModel: string;
  tag: string;
  insurance: string;
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

function formatShortDate(value: string | undefined) {
  if (!value) return "insurance --";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" });
}

function mapVehicle(v: any): VehicleDisplay {
  const color = VEHICLE_COLORS[v.vehicle_type] || "#95a5a6";
  const makeModel = [v.make, v.model].filter(Boolean).join(" | ") || v.vehicle_name || "Unknown";
  const year = v.model_year ? String(v.model_year).slice(-2) : "??";
  const tag = v.tag_number || v.license_plate || v.plate || "Tag --";
  const insurance = formatShortDate(v.insurance_renewal_date || v.insurance_date || v.insurance_due);

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
    { key: "name", val: v.vehicle_name || "—" },
    { key: "make", val: v.make || "—" },
    { key: "model", val: v.model || "—" },
    { key: "year", val: v.model_year || "—" },
    { key: "type", val: v.vehicle_type || "Car" },
    { key: "ownership", val: v.owned_or_leased || "owned" },
    { key: "availability", val: v.availability_status || "available", color: v.availability_status === "available" ? "green" : "red" },
    { key: "tag", val: tag },
    { key: "insurance", val: insurance },
  ];

  if (v.notes) data.push({ key: "notes", val: v.notes });

  return { id: v.vehicle_id || `${makeModel}-${year}`, year, makeModel, tag, insurance, color, statusPills, data };
}

export function GarageWorkspace({ onBack }: { onBack: () => void }) {
  const [vehicles, setVehicles] = useState<VehicleDisplay[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    vehicle_name: "",
    make: "",
    model: "",
    model_year: "",
    vehicle_type: "Car",
    availability_status: "available",
  });

  useEffect(() => { loadVehicles(); }, []);

  async function loadVehicles() {
    try {
      const data = await api.getVehicles();
      setVehicles(data.map(mapVehicle));
    } catch (e) {
      console.error("Failed to load vehicles:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!form.vehicle_name && !form.make) return;
    try {
      await api.addVehicle(form);
      setForm({ vehicle_name: "", make: "", model: "", model_year: "", vehicle_type: "Car", availability_status: "available" });
      setShowForm(false);
      setLoading(true);
      await loadVehicles();
    } catch (e) {
      console.error("Failed to add vehicle:", e);
    }
  }

  return (
    <div className="workspace-page single-header">
      <div className="workspace-header">
        <div className="workspace-header-row">
          <button className="workspace-back" onClick={onBack} type="button">«</button>
          <div className="workspace-title-row">
            <span className="workspace-title">Garage - Mobile Assets</span>
          </div>
          <button className="workspace-add-btn" onClick={() => setShowForm((open) => !open)} type="button">
            {showForm ? "✕ Close" : "+ Add"}
          </button>
        </div>
      </div>

      <div className="workspace-scroll">
        {showForm && (
          <div className="add-form">
            <input className="form-input" placeholder="Vehicle name" value={form.vehicle_name} onChange={(e) => setForm({ ...form, vehicle_name: e.target.value })} />
            <div className="form-row-split">
              <input className="form-input" placeholder="Make" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
              <input className="form-input" placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </div>
            <div className="form-row-split">
              <input className="form-input" placeholder="Year" value={form.model_year} onChange={(e) => setForm({ ...form, model_year: e.target.value })} />
              <select className="form-input" value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}>
                <option value="Car">Car</option>
                <option value="Truck">Truck</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Van">Van</option>
              </select>
            </div>
            <select className="form-input" value={form.availability_status} onChange={(e) => setForm({ ...form, availability_status: e.target.value })}>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
            <button className="form-submit" onClick={handleAdd} type="button">Save Vehicle</button>
          </div>
        )}

        {loading ? (
          <div className="workspace-loading">loading...</div>
        ) : vehicles.length === 0 ? (
          <div className="workspace-empty">no vehicles yet</div>
        ) : (
          <div className="accordion-stack">
            {vehicles.map((v, i) => {
              const cardId = `${v.id}-${i}`;
              const isOpen = expanded === cardId;
              return (
                <div key={cardId} className={`accordion-card card-cut${isOpen ? " expanded" : ""}`} onClick={() => setExpanded(isOpen ? null : cardId)}>
                  <div className="accordion-line" style={{ background: v.color }} />
                  <div className="accordion-header">
                    <span className="accordion-year">{v.year}</span>
                    <div className="accordion-info">
                      <div className="accordion-name">{v.makeModel}</div>
                      <div className="accordion-brief">mobile asset</div>
                    </div>
                    <div className="card-right">
                      <span className="card-right-main">{v.tag}</span>
                      <span className="card-right-sub">{v.insurance}</span>
                    </div>
                  </div>
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
