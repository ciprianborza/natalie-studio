import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const COLORS = {
  bg: "#FDF6F0", card: "#FFFFFF", roseDark: "#C97B84", rose: "#E8A4A4",
  rosePale: "#FDF0EF", gold: "#C9A96E", text: "#3D2C2C", textMid: "#7A5C5C",
  textLight: "#B08080", border: "#F0DDD8", success: "#8AAF8A", warn: "#D4A04A",
};

const STAFF = ["Ioana Popescu", "Maria Ionescu", "Elena Dumitrescu", "Ana Constantin"];

const HOURS = Array.from({ length: 23 }, (_, i) => {
  const h = Math.floor(i / 2) + 9;
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
}).filter(t => t <= "20:00");

const NAV = [
  { id: "dashboard", icon: "⬡", label: "Home" },
  { id: "calendar", icon: "▦", label: "Calendar" },
  { id: "appointments", icon: "☰", label: "Programări" },
  { id: "clients", icon: "♡", label: "Clienți" },
  { id: "services", icon: "✦", label: "Servicii" },
];

const today = new Date();
const fmt = (d) => d.toISOString().split("T")[0];

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
}

function Badge({ status }) {
  const map = {
    confirmat: { bg: "#E8F5E8", color: "#4A8A4A", label: "Confirmat" },
    in_asteptare: { bg: "#FFF8E8", color: "#C9A030", label: "Așteptare" },
    anulat: { bg: "#FDE8E8", color: "#C94A4A", label: "Anulat" },
    finalizat: { bg: "#E8F0FD", color: "#4A6AC9", label: "Finalizat" },
  };
  const s = map[status] || map.in_asteptare;
  return <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{s.label}</span>;
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(61,44,44,0.45)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "8px 22px 40px", width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 -8px 40px rgba(61,44,44,0.2)" }}>
        <div style={{ width: 40, height: 4, background: COLORS.border, borderRadius: 4, margin: "12px auto 18px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: COLORS.text, fontSize: 20, fontFamily: "Georgia,serif", fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ background: COLORS.rosePale, border: "none", width: 32, height: 32, borderRadius: "50%", fontSize: 14, cursor: "pointer", color: COLORS.textLight }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FInput({ label, ...props }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.textMid, marginBottom: 5, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</label>
      <input {...props} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 15, color: COLORS.text, background: COLORS.rosePale, outline: "none", boxSizing: "border-box", fontFamily: "inherit", ...props.style }} />
    </div>
  );
}

function FSelect({ label, children, ...props }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.textMid, marginBottom: 5, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</label>
      <select {...props} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 15, color: COLORS.text, background: COLORS.rosePale, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}>{children}</select>
    </div>
  );
}

function Btn({ children, variant = "primary", small, ...props }) {
  const s = {
    primary: { background: `linear-gradient(135deg,${COLORS.roseDark},${COLORS.gold})`, color: "#fff", border: "none" },
    secondary: { background: "transparent", color: COLORS.roseDark, border: `1.5px solid ${COLORS.roseDark}` },
    ghost: { background: COLORS.rosePale, color: COLORS.textMid, border: "none" },
  };
  return (
    <button {...props} style={{ padding: small ? "7px 14px" : "10px 20px", borderRadius: 12, fontWeight: 700, fontSize: small ? 12 : 14, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.3, ...s[variant], ...props.style }}>
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${COLORS.border}`, borderTop: `3px solid ${COLORS.roseDark}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  const isMobile = useIsMobile();
  const [page, setPage] = useState("dashboard");
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editApp, setEditApp] = useState(null);
  const [search, setSearch] = useState("");
  const [calDate, setCalDate] = useState(fmt(today));
  const [form, setForm] = useState({ clientName: "", phone: "", serviceId: "", staff: STAFF[0], date: fmt(today), time: "09:00", notes: "", status: "in_asteptare" });
  const [editService, setEditService] = useState(null);
  const [serviceForm, setServiceForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // ── FETCH DATA ────────────────────────────────────────────────
  async function fetchAll() {
    setLoading(true);
    const [{ data: appsData }, { data: clientsData }, { data: svcData }] = await Promise.all([
      supabase.from("appointments").select("*").order("date").order("time"),
      supabase.from("clients").select("*").order("name"),
      supabase.from("services").select("*").order("id"),
    ]);
    setAppointments(appsData || []);
    setClients(clientsData || []);
    setServices(svcData || []);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  const todayApps = appointments.filter(a => a.date === fmt(today));

  // ── FORM HANDLERS ─────────────────────────────────────────────
  function openAdd() {
    setForm({ clientName: "", phone: "", serviceId: services[0]?.id || "", staff: STAFF[0], date: fmt(today), time: "09:00", notes: "", status: "in_asteptare" });
    setEditApp(null);
    setShowForm(true);
    setError(null);
  }

  function openEdit(app) {
    setForm({
      clientName: app.client_name,
      phone: app.phone,
      serviceId: app.service_id,
      staff: app.staff,
      date: app.date,
      time: app.time,
      notes: app.notes || "",
      status: app.status,
    });
    setEditApp(app.id);
    setShowForm(true);
    setError(null);
  }

  async function saveApp() {
    if (!form.clientName || !form.phone || !form.serviceId) {
      setError("Completează numele, telefonul și serviciul.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      client_name: form.clientName,
      phone: form.phone,
      service_id: Number(form.serviceId),
      staff: form.staff,
      date: form.date,
      time: form.time,
      notes: form.notes,
      status: form.status,
    };
    if (editApp) {
      await supabase.from("appointments").update(payload).eq("id", editApp);
    } else {
      await supabase.from("appointments").insert(payload);
      // Adaugă clientul dacă nu există
      const exists = clients.find(c => c.phone === form.phone);
      if (!exists) {
        await supabase.from("clients").insert({ name: form.clientName, phone: form.phone });
      }
    }
    await fetchAll();
    setSaving(false);
    setShowForm(false);
  }

  async function deleteApp(id) {
    if (!window.confirm("Ștergi această programare?")) return;
    await supabase.from("appointments").delete().eq("id", id);
    setAppointments(p => p.filter(a => a.id !== id));
  }

  async function changeStatus(id, status) {
    await supabase.from("appointments").update({ status }).eq("id", id);
    setAppointments(p => p.map(a => a.id === id ? { ...a, status } : a));
  }

  async function saveService() {
    await supabase.from("services").update({
      name: serviceForm.name,
      duration: Number(serviceForm.duration),
      price: Number(serviceForm.price),
    }).eq("id", editService);
    await fetchAll();
    setServiceForm(null);
  }

  const calApps = appointments.filter(a => a.date === calDate).sort((a, b) => a.time.localeCompare(b.time));
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const pad = isMobile ? "14px 16px 100px" : "32px 36px";

  // ── SIDEBAR ───────────────────────────────────────────────────
  const Sidebar = () => (
    <div style={{ width: 210, minWidth: 210, background: "linear-gradient(180deg,#3D2C2C,#5C3A3A)", display: "flex", flexDirection: "column", padding: "28px 0", minHeight: "100vh", position: "sticky", top: 0, height: "100vh" }}>
      <div style={{ padding: "0 22px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, color: "#F5D5D5" }}>Natalie Studio</div>
        <div style={{ fontSize: 10, color: COLORS.gold, letterSpacing: 2, marginTop: 3, textTransform: "uppercase" }}>Salon de Frumusețe</div>
      </div>
      <nav style={{ flex: 1, padding: "18px 10px" }}>
        {NAV.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
            borderRadius: 12, background: page === item.id ? "rgba(201,123,132,0.25)" : "transparent",
            border: "none", color: page === item.id ? "#F5D5D5" : "rgba(255,255,255,0.45)",
            fontSize: 13, fontWeight: page === item.id ? 700 : 400, cursor: "pointer", marginBottom: 3,
            textAlign: "left", fontFamily: "inherit",
            borderLeft: page === item.id ? `3px solid ${COLORS.rose}` : "3px solid transparent",
          }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span> {item.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: "16px 22px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
        {new Date().toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" })}
      </div>
    </div>
  );

  // ── BOTTOM NAV ────────────────────────────────────────────────
  const BottomNav = () => (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200, background: "#3D2C2C", display: "flex", borderTop: "1px solid rgba(255,255,255,0.1)", paddingBottom: "env(safe-area-inset-bottom, 6px)" }}>
      {NAV.map(item => (
        <button key={item.id} onClick={() => setPage(item.id)} style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          padding: "10px 2px 6px", border: "none", background: "transparent",
          cursor: "pointer", color: page === item.id ? COLORS.rose : "rgba(255,255,255,0.38)", fontFamily: "inherit",
        }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>
          <span style={{ fontSize: 10, marginTop: 3, fontWeight: page === item.id ? 700 : 400 }}>{item.label}</span>
          {page === item.id && <div style={{ width: 18, height: 2, background: COLORS.rose, borderRadius: 2, marginTop: 3 }} />}
        </button>
      ))}
    </div>
  );

  const MobileHeader = ({ title, action }) => (
    <div style={{ position: "sticky", top: 0, zIndex: 50, background: COLORS.bg, padding: "14px 18px 10px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontFamily: "Georgia,serif", fontSize: 10, color: COLORS.gold, letterSpacing: 2, textTransform: "uppercase" }}>Natalie Studio</div>
        <div style={{ fontFamily: "Georgia,serif", fontSize: 22, fontWeight: 700, color: COLORS.text, lineHeight: 1.2 }}>{title}</div>
      </div>
      {action}
    </div>
  );

  // ── DASHBOARD ─────────────────────────────────────────────────
  const DashboardPage = () => (
    <div>
      {isMobile && <MobileHeader title="Bună ziua! ✦" action={<Btn small onClick={openAdd}>+ Nou</Btn>} />}
      <div style={{ padding: pad }}>
        {!isMobile && <div style={{ marginBottom: 26 }}><h1 style={{ margin: 0, fontSize: 30, fontFamily: "Georgia,serif", fontWeight: 700 }}>Bună ziua! ✦</h1><p style={{ margin: "4px 0 0", color: COLORS.textLight, fontSize: 14 }}>Rezumatul zilei de astăzi</p></div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          {[
            { label: "Programări azi", value: todayApps.length, icon: "▦", color: COLORS.roseDark },
            { label: "Confirmate", value: todayApps.filter(a => a.status === "confirmat").length, icon: "✓", color: COLORS.success },
            { label: "În așteptare", value: todayApps.filter(a => a.status === "in_asteptare").length, icon: "◷", color: COLORS.warn },
            { label: "Finalizate", value: todayApps.filter(a => a.status === "finalizat").length, icon: "★", color: COLORS.gold },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", boxShadow: "0 2px 10px rgba(61,44,44,0.06)", border: `1px solid ${COLORS.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 10, color: COLORS.textLight, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.text, fontFamily: "Georgia,serif", lineHeight: 1 }}>{s.value}</div>
                </div>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: s.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: s.color }}>{s.icon}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 18, padding: 18, boxShadow: "0 2px 10px rgba(61,44,44,0.06)", border: `1px solid ${COLORS.border}`, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontFamily: "Georgia,serif", fontWeight: 700 }}>Programări azi</h2>
            {!isMobile && <Btn small onClick={openAdd}>+ Adaugă</Btn>}
          </div>
          {loading ? <Spinner /> : todayApps.length === 0
            ? <div style={{ textAlign: "center", color: COLORS.textLight, padding: "20px 0", fontSize: 14 }}>Nicio programare astăzi</div>
            : todayApps.sort((a, b) => a.time.localeCompare(b.time)).map(app => {
                const svc = services.find(s => s.id === app.service_id);
                return (
                  <div key={app.id} onClick={() => openEdit(app)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer" }}>
                    <div style={{ width: 44, fontWeight: 800, color: COLORS.roseDark, fontSize: 13, flexShrink: 0, textAlign: "center" }}>{app.time}</div>
                    <div style={{ width: 4, height: 38, borderRadius: 4, background: svc?.color || COLORS.rose, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{app.client_name}</div>
                      <div style={{ fontSize: 12, color: COLORS.textLight, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{svc?.name} · {app.staff.split(" ")[0]}</div>
                    </div>
                    <Badge status={app.status} />
                  </div>
                );
              })}
        </div>

        <div style={{ background: "#fff", borderRadius: 18, padding: 18, boxShadow: "0 2px 10px rgba(61,44,44,0.06)", border: `1px solid ${COLORS.border}` }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 16, fontFamily: "Georgia,serif", fontWeight: 700 }}>Servicii populare</h2>
          {services.map(svc => {
            const count = appointments.filter(a => a.service_id === svc.id).length;
            const max = Math.max(...services.map(s => appointments.filter(a => a.service_id === s.id).length), 1);
            return (
              <div key={svc.id} style={{ marginBottom: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: COLORS.textMid, fontWeight: 600 }}>{svc.name}</span>
                  <span style={{ color: COLORS.textLight }}>{count}</span>
                </div>
                <div style={{ height: 6, background: COLORS.border, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(count / max) * 100}%`, background: svc.color, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── CALENDAR ──────────────────────────────────────────────────
  const CalendarPage = () => (
    <div>
      {isMobile && <MobileHeader title="Calendar" action={<Btn small onClick={openAdd}>+ Nou</Btn>} />}
      <div style={{ padding: pad }}>
        {!isMobile && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 30, fontFamily: "Georgia,serif", fontWeight: 700 }}>Calendar</h1>
            <div style={{ display: "flex", gap: 10 }}>
              <input type="date" value={calDate} onChange={e => setCalDate(e.target.value)} style={{ padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: 14, background: "#fff", color: COLORS.text, fontFamily: "inherit", outline: "none" }} />
              <Btn onClick={openAdd}>+ Programare</Btn>
            </div>
          </div>
        )}
        {isMobile && <input type="date" value={calDate} onChange={e => setCalDate(e.target.value)} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 15, background: "#fff", color: COLORS.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 14 }} />}

        <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 10px rgba(61,44,44,0.06)", border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
          <div style={{ padding: "13px 16px", borderBottom: `1px solid ${COLORS.border}`, fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: COLORS.roseDark }}>
            {new Date(calDate + "T12:00:00").toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" })}
            <span style={{ fontSize: 12, color: COLORS.textLight, fontWeight: 400, marginLeft: 8 }}>— {calApps.length} programări</span>
          </div>
          <div style={{ padding: "0 14px 14px" }}>
            {HOURS.map(hour => {
              const app = calApps.find(a => a.time === hour);
              const svc = app ? services.find(s => s.id === app.service_id) : null;
              return (
                <div key={hour} style={{ display: "flex", gap: 10, alignItems: "stretch", minHeight: 44 }}>
                  <div style={{ width: 42, paddingTop: 12, fontSize: 11, color: COLORS.textLight, fontWeight: 700, flexShrink: 0, textAlign: "right" }}>{hour}</div>
                  <div style={{ width: 1, background: COLORS.border, flexShrink: 0 }} />
                  <div style={{ flex: 1, paddingTop: 6, paddingBottom: 2 }}>
                    {app && (
                      <div onClick={() => openEdit(app)} style={{ background: (svc?.color || COLORS.rose) + "22", border: `1.5px solid ${svc?.color || COLORS.rose}`, borderRadius: 10, padding: "7px 12px", cursor: "pointer" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                          <div><span style={{ fontWeight: 700, fontSize: 13 }}>{app.client_name}</span><span style={{ fontSize: 11, color: COLORS.textMid, marginLeft: 8 }}>{svc?.name}</span></div>
                          <Badge status={app.status} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // ── APPOINTMENTS ──────────────────────────────────────────────
  const AppointmentsPage = () => (
    <div>
      {isMobile && <MobileHeader title="Programări" action={<Btn small onClick={openAdd}>+ Nou</Btn>} />}
      <div style={{ padding: pad }}>
        {!isMobile && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 30, fontFamily: "Georgia,serif", fontWeight: 700 }}>Toate Programările</h1>
            <Btn onClick={openAdd}>+ Programare nouă</Btn>
          </div>
        )}
        {loading ? <Spinner /> : isMobile ? (
          appointments.sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time)).map(app => {
            const svc = services.find(s => s.id === app.service_id);
            return (
              <div key={app.id} style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, border: `1px solid ${COLORS.border}`, boxShadow: "0 2px 8px rgba(61,44,44,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{app.client_name}</div>
                    <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>{app.phone}</div>
                  </div>
                  <Badge status={app.status} />
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 10 }}>
                  <span style={{ background: (svc?.color || COLORS.rose) + "22", fontSize: 12, padding: "3px 10px", borderRadius: 20, fontWeight: 600, color: COLORS.text }}>{svc?.name}</span>
                  <span style={{ background: COLORS.rosePale, color: COLORS.roseDark, fontSize: 12, padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>
                    {new Date(app.date + "T12:00:00").toLocaleDateString("ro-RO", { day: "numeric", month: "short" })} · {app.time}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 12 }}>{app.staff}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => openEdit(app)} style={{ flex: 1, background: COLORS.rosePale, border: "none", borderRadius: 10, padding: 9, cursor: "pointer", fontSize: 13, color: COLORS.roseDark, fontWeight: 700 }}>Editează</button>
                  <button onClick={() => changeStatus(app.id, app.status === "finalizat" ? "confirmat" : "finalizat")} style={{ flex: 1, background: COLORS.rosePale, border: "none", borderRadius: 10, padding: 9, cursor: "pointer", fontSize: 13, color: COLORS.textMid, fontWeight: 600 }}>
                    {app.status === "finalizat" ? "↩ Redeschide" : "✓ Finalizează"}
                  </button>
                  <button onClick={() => deleteApp(app.id)} style={{ background: "#FDE8E8", border: "none", borderRadius: 10, padding: "9px 14px", cursor: "pointer", fontSize: 15, color: "#C94A4A" }}>✕</button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 12px rgba(61,44,44,0.06)", border: `1px solid ${COLORS.border}`, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: COLORS.rosePale }}>
                  {["Client", "Serviciu", "Data", "Ora", "Specialist", "Status", ""].map(h => (
                    <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: COLORS.textMid, letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appointments.sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time)).map((app, i) => {
                  const svc = services.find(s => s.id === app.service_id);
                  return (
                    <tr key={app.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? "#fff" : COLORS.rosePale + "55" }}>
                      <td style={{ padding: "12px 16px" }}><div style={{ fontWeight: 700, fontSize: 13 }}>{app.client_name}</div><div style={{ fontSize: 11, color: COLORS.textLight }}>{app.phone}</div></td>
                      <td style={{ padding: "12px 16px" }}><div style={{ display: "flex", alignItems: "center", gap: 7 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: svc?.color || COLORS.rose }} /><span style={{ fontSize: 13 }}>{svc?.name}</span></div></td>
                      <td style={{ padding: "12px 16px", fontSize: 13 }}>{new Date(app.date + "T12:00:00").toLocaleDateString("ro-RO")}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: COLORS.roseDark }}>{app.time}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13 }}>{app.staff}</td>
                      <td style={{ padding: "12px 16px" }}><Badge status={app.status} /></td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button onClick={() => openEdit(app)} style={{ background: COLORS.rosePale, border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12, color: COLORS.roseDark, fontWeight: 700 }}>Edit</button>
                          <button onClick={() => changeStatus(app.id, app.status === "finalizat" ? "confirmat" : "finalizat")} style={{ background: COLORS.rosePale, border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12, color: COLORS.textMid }}>{app.status === "finalizat" ? "↩" : "✓"}</button>
                          <button onClick={() => deleteApp(app.id)} style={{ background: "#FDE8E8", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12, color: "#C94A4A" }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // ── CLIENTS ───────────────────────────────────────────────────
  const ClientsPage = () => (
    <div>
      {isMobile && <MobileHeader title="Clienți" />}
      <div style={{ padding: pad }}>
        {!isMobile && <h1 style={{ margin: "0 0 22px", fontSize: 30, fontFamily: "Georgia,serif", fontWeight: 700 }}>Clienți</h1>}
        <input placeholder="🔍  Caută după nume sau telefon..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: `1.5px solid ${COLORS.border}`, fontSize: 14, background: "#fff", color: COLORS.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 16 }} />
        {loading ? <Spinner /> : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(270px,1fr))", gap: 14 }}>
            {filteredClients.map(client => {
              const history = appointments.filter(a => a.client_name === client.name);
              const last = [...history].sort((a, b) => b.date.localeCompare(a.date))[0];
              return (
                <div key={client.id} style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 10px rgba(61,44,44,0.06)", border: `1px solid ${COLORS.border}` }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${COLORS.roseDark},${COLORS.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, color: "#fff", fontWeight: 700, flexShrink: 0 }}>
                      {client.name.charAt(0)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{client.name}</div>
                      <div style={{ fontSize: 13, color: COLORS.textLight }}>{client.phone}</div>
                    </div>
                  </div>
                  <div style={{ background: COLORS.rosePale, borderRadius: 10, padding: "10px 12px", marginBottom: last ? 12 : 0 }}>
                    <div style={{ fontSize: 10, color: COLORS.textLight, fontWeight: 700, letterSpacing: 0.5 }}>VIZITE</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.roseDark, fontFamily: "Georgia,serif" }}>{history.length}</div>
                  </div>
                  {last && (() => { const svc = services.find(s => s.id === last.service_id); return (
                    <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 10 }}>
                      <div style={{ fontSize: 10, color: COLORS.textLight, fontWeight: 700, letterSpacing: 0.5, marginBottom: 3 }}>ULTIMA VIZITĂ</div>
                      <div style={{ fontSize: 13, color: COLORS.textMid }}>{svc?.name} · {new Date(last.date + "T12:00:00").toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}</div>
                    </div>
                  ); })()}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ── SERVICES ──────────────────────────────────────────────────
  const ServicesPage = () => (
    <div>
      {isMobile && <MobileHeader title="Servicii" />}
      <div style={{ padding: pad }}>
        {!isMobile && <h1 style={{ margin: "0 0 22px", fontSize: 30, fontFamily: "Georgia,serif", fontWeight: 700 }}>Servicii & Prețuri</h1>}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fill,minmax(250px,1fr))", gap: 14 }}>
          {services.map(svc => (
            <div key={svc.id} style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 10px rgba(61,44,44,0.06)", border: `1px solid ${COLORS.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: svc.color + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: svc.color }}>✦</div>
                <button onClick={() => { setServiceForm({ ...svc }); setEditService(svc.id); }} style={{ background: COLORS.rosePale, border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 11, color: COLORS.textMid, fontWeight: 700 }}>Edit</button>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{svc.name}</div>
              <div style={{ display: "flex", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: COLORS.textLight, fontWeight: 700, letterSpacing: 0.5 }}>DURATĂ</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.roseDark, fontFamily: "Georgia,serif" }}>{svc.duration}<span style={{ fontSize: 10, marginLeft: 2 }}>min</span></div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: COLORS.textLight, fontWeight: 700, letterSpacing: 0.5 }}>PREȚ</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.gold, fontFamily: "Georgia,serif" }}>{svc.price}<span style={{ fontSize: 10, marginLeft: 2 }}>RON</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const pages = { dashboard: <DashboardPage />, calendar: <CalendarPage />, appointments: <AppointmentsPage />, clients: <ClientsPage />, services: <ServicesPage /> };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.bg, fontFamily: "'Nunito','Segoe UI',sans-serif", color: COLORS.text }}>
      {!isMobile && <Sidebar />}
      <div style={{ flex: 1, overflow: "auto" }}>{pages[page]}</div>
      {isMobile && <BottomNav />}

      {/* FORM MODAL */}
      {showForm && (
        <Modal title={editApp ? "Editează Programare" : "Programare Nouă"} onClose={() => setShowForm(false)}>
          {error && <div style={{ background: "#FDE8E8", color: "#C94A4A", padding: "10px 14px", borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}
          <FInput label="Nume Client" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="ex: Maria Ionescu" />
          <FInput label="Telefon" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="07XX XXX XXX" />
          <FSelect label="Serviciu" value={form.serviceId} onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}>
            <option value="">-- Alege serviciul --</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </FSelect>
          <FSelect label="Specialist" value={form.staff} onChange={e => setForm(f => ({ ...f, staff: e.target.value }))}>
            {STAFF.map(s => <option key={s} value={s}>{s}</option>)}
          </FSelect>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FInput label="Data" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <FSelect label="Ora" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}>
              {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
            </FSelect>
          </div>
          <FSelect label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="in_asteptare">În așteptare</option>
            <option value="confirmat">Confirmat</option>
            <option value="finalizat">Finalizat</option>
            <option value="anulat">Anulat</option>
          </FSelect>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.textMid, marginBottom: 5, letterSpacing: 0.5, textTransform: "uppercase" }}>Observații</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 14, color: COLORS.text, background: COLORS.rosePale, outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setShowForm(false)}>Anulează</Btn>
            <Btn onClick={saveApp} style={{ opacity: saving ? 0.6 : 1 }}>{saving ? "Se salvează..." : editApp ? "Salvează" : "Adaugă"}</Btn>
          </div>
        </Modal>
      )}

      {/* SERVICE MODAL */}
      {serviceForm && (
        <Modal title="Editează Serviciu" onClose={() => setServiceForm(null)}>
          <FInput label="Nume Serviciu" value={serviceForm.name} onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FInput label="Durată (min)" type="number" value={serviceForm.duration} onChange={e => setServiceForm(f => ({ ...f, duration: e.target.value }))} />
            <FInput label="Preț (RON)" type="number" value={serviceForm.price} onChange={e => setServiceForm(f => ({ ...f, price: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setServiceForm(null)}>Anulează</Btn>
            <Btn onClick={saveService}>Salvează</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
