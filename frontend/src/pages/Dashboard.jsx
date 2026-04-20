import { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import API from "../api/api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || window.location.origin;

const emptyStats = {
  totalBeds: 0,
  generalBeds: 0,
  icuBeds: 0,
  emergencyBeds: 0,
  occupiedBeds: 0,
  occupiedGeneralBeds: 0,
  occupiedIcuBeds: 0,
  occupiedEmergencyBeds: 0,
  freeBeds: 0,
  freeGeneralBeds: 0,
  freeIcuBeds: 0,
  freeEmergencyBeds: 0,
  admittedPatients: 0,
  waitingPatients: 0,
  dischargedToday: 0,
  highRiskPatients: 0,
  mediumRiskPatients: 0,
  lowRiskPatients: 0
};

function Dashboard() {
  const role = localStorage.getItem("role");
  const isAdmin = role === "admin";
  const [stats, setStats] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const [bedRes, patientRes] = await Promise.all([
        API.get("/beds"),
        API.get("/patients")
      ]);

      const beds = Array.isArray(bedRes.data) ? bedRes.data : [];
      const patients = Array.isArray(patientRes.data) ? patientRes.data : [];

      const countBedsByDepartment = (bedList) => ({
        general: bedList.filter((b) => b.department === "General").length,
        icu: bedList.filter((b) => b.department === "ICU").length,
        emergency: bedList.filter((b) => b.department === "Emergency").length
      });

      const countRisk = (risk) =>
        patients.filter((p) => String(p.aiRisk || "").toLowerCase() === risk).length;

      const totalBedBreakdown = countBedsByDepartment(beds);
      const occupiedBedList = beds.filter((b) => b.isOccupied);
      const freeBedList = beds.filter((b) => !b.isOccupied);
      const occupiedBedBreakdown = countBedsByDepartment(occupiedBedList);
      const freeBedBreakdown = countBedsByDepartment(freeBedList);

      const nextStats = {
        ...emptyStats,
        totalBeds: beds.length,
        generalBeds: totalBedBreakdown.general,
        icuBeds: totalBedBreakdown.icu,
        emergencyBeds: totalBedBreakdown.emergency,
        occupiedBeds: occupiedBedList.length,
        occupiedGeneralBeds: occupiedBedBreakdown.general,
        occupiedIcuBeds: occupiedBedBreakdown.icu,
        occupiedEmergencyBeds: occupiedBedBreakdown.emergency,
        freeBeds: freeBedList.length,
        freeGeneralBeds: freeBedBreakdown.general,
        freeIcuBeds: freeBedBreakdown.icu,
        freeEmergencyBeds: freeBedBreakdown.emergency,
        admittedPatients: patients.filter((p) => p.status === "admitted").length,
        waitingPatients: patients.filter((p) => p.status === "waiting").length,
        dischargedToday: patients.filter((p) => p.status === "discharged").length,
        highRiskPatients: countRisk("high"),
        mediumRiskPatients: countRisk("medium"),
        lowRiskPatients: countRisk("low")
      };

      setStats(nextStats);

      if (nextStats.highRiskPatients > 5) {
        toast.error("High risk patient count is increasing.");
      }
    } catch (error) {
      console.log("Dashboard fetch error:", error);
      toast.error("Dashboard data could not be refreshed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"]
    });

    socket.on("connect", () => setIsLive(true));
    socket.on("disconnect", () => setIsLive(false));
    socket.on("bedUpdated", () => {
      toast.success("Live hospital data updated.");
      fetchStats();
    });

    return () => socket.disconnect();
  }, [fetchStats]);

  const visibleStats = stats || emptyStats;

  const pieData = useMemo(
    () => [
      { name: "Occupied", value: visibleStats.occupiedBeds },
      { name: "Free", value: visibleStats.freeBeds }
    ],
    [visibleStats]
  );

  const patientData = useMemo(
    () => [
      { name: "Admitted", value: visibleStats.admittedPatients },
      { name: "Waiting", value: visibleStats.waitingPatients },
      { name: "Discharged", value: visibleStats.dischargedToday }
    ],
    [visibleStats]
  );

  const departmentData = useMemo(
    () => [
      { name: "General", total: visibleStats.generalBeds, occupied: visibleStats.occupiedGeneralBeds },
      { name: "ICU", total: visibleStats.icuBeds, occupied: visibleStats.occupiedIcuBeds },
      { name: "Emergency", total: visibleStats.emergencyBeds, occupied: visibleStats.occupiedEmergencyBeds }
    ],
    [visibleStats]
  );

  const riskData = useMemo(
    () => [
      { name: "High", value: visibleStats.highRiskPatients },
      { name: "Medium", value: visibleStats.mediumRiskPatients },
      { name: "Low", value: visibleStats.lowRiskPatients }
    ],
    [visibleStats]
  );

  const bedTableColumns = [
    {
      heading: `Total Beds: ${visibleStats.totalBeds}`,
      rows: [
        { label: "General", value: visibleStats.generalBeds },
        { label: "ICU", value: visibleStats.icuBeds },
        { label: "Emergency", value: visibleStats.emergencyBeds }
      ]
    },
    {
      heading: "Occupied Beds",
      rows: [
        { label: "Total", value: visibleStats.occupiedBeds },
        { label: "General", value: visibleStats.occupiedGeneralBeds },
        { label: "ICU", value: visibleStats.occupiedIcuBeds },
        { label: "Emergency", value: visibleStats.occupiedEmergencyBeds }
      ]
    },
    {
      heading: "Free Beds",
      rows: [
        { label: "Total", value: visibleStats.freeBeds },
        { label: "General", value: visibleStats.freeGeneralBeds },
        { label: "ICU", value: visibleStats.freeIcuBeds },
        { label: "Emergency", value: visibleStats.freeEmergencyBeds }
      ]
    }
  ];

  const metricCards = [
    { title: "Total Beds", value: visibleStats.totalBeds, tone: "from-slate-900 to-slate-700" },
    { title: "Occupied Beds", value: visibleStats.occupiedBeds, tone: "from-rose-500 to-rose-400" },
    { title: "Free Beds", value: visibleStats.freeBeds, tone: "from-emerald-500 to-emerald-400" },
    { title: "Admitted Patients", value: visibleStats.admittedPatients, tone: "from-blue-600 to-cyan-500" },
    { title: "Waiting Patients", value: visibleStats.waitingPatients, tone: "from-amber-500 to-orange-400" },
    { title: "High Risk", value: visibleStats.highRiskPatients, tone: "from-red-600 to-rose-500" }
  ];

  const visibleMetricCards = isAdmin
    ? metricCards
    : metricCards.filter((item) => ["Admitted Patients", "Waiting Patients", "High Risk"].includes(item.title));

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="panel h-36 animate-pulse bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Live Operations</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {isAdmin ? "Admin Dashboard" : "Doctor Dashboard"}
          </h2>
        </div>
        <div className="panel flex items-center gap-3 px-4 py-3">
          <span className={`h-2.5 w-2.5 rounded-full ${isLive ? "bg-emerald-500" : "bg-amber-500"}`} />
          <span className="text-sm font-medium text-slate-600">{isLive ? "Realtime connected" : "Realtime reconnecting"}</span>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel overflow-hidden">
          <div className={`grid ${isAdmin ? "md:grid-cols-3" : "md:grid-cols-1"}`}>
            {(isAdmin ? bedTableColumns : [bedTableColumns[1]]).map((column, columnIndex, columns) => (
              <div
                key={column.heading}
                className={columnIndex < columns.length - 1 ? "border-b border-slate-200 md:border-b-0 md:border-r" : ""}
              >
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 text-lg font-semibold text-slate-900 sm:text-xl">
                  {column.heading}
                </div>

                {column.rows.map((row, rowIndex) => (
                  <div
                    key={`${column.heading}-${row.label}`}
                    className={`flex items-center justify-between px-5 py-4 text-sm sm:text-base ${
                      rowIndex < column.rows.length - 1 ? "border-b border-slate-100" : ""
                    }`}
                  >
                    <span className="text-slate-500">{row.label}</span>
                    <span className="text-lg font-semibold text-slate-950">{row.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Status Snapshot</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">Patient flow today</h3>
          <div className="mt-6 space-y-4">
            {patientData.map((item) => (
              <div key={item.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{item.name}</p>
                  <p className="text-2xl font-semibold text-slate-950">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`grid gap-5 sm:grid-cols-2 ${isAdmin ? "xl:grid-cols-3" : "xl:grid-cols-3"}`}>
        {visibleMetricCards.map((item) => (
          <div key={item.title} className={`rounded-3xl bg-gradient-to-br ${item.tone} p-5 text-white shadow-panel`}>
            <p className="text-sm text-white/75">{item.title}</p>
            <p className="mt-6 text-4xl font-semibold">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {isAdmin && (
          <ChartPanel title="Bed occupancy" eyebrow="Resource Usage">
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={100} label>
                <Cell fill="#f43f5e" />
                <Cell fill="#10b981" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ChartPanel>
        )}

        <ChartPanel title="Patients per status" eyebrow="Throughput">
          <BarChart data={patientData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#2563eb" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ChartPanel>

        {isAdmin && (
          <ChartPanel title="Beds by department" eyebrow="Capacity Mix">
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="total" fill="#94a3b8" radius={[10, 10, 0, 0]} />
              <Bar dataKey="occupied" fill="#0f172a" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ChartPanel>
        )}

        <ChartPanel title="Risk distribution" eyebrow="Clinical Risk">
          <PieChart>
            <Pie data={riskData} dataKey="value" cx="50%" cy="50%" outerRadius={100} label>
              <Cell fill="#dc2626" />
              <Cell fill="#f59e0b" />
              <Cell fill="#059669" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ChartPanel>
      </section>
    </div>
  );
}

function ChartPanel({ eyebrow, title, children }) {
  return (
    <div className="panel p-6">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">{eyebrow}</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">{title}</h3>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Dashboard;
