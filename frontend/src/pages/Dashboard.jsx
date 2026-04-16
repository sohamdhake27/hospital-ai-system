import { useEffect, useState } from "react";
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

function Dashboard() {
  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    try {
      const bedRes = await API.get("/beds");
      const patientRes = await API.get("/patients");

      const beds = Array.isArray(bedRes.data) ? bedRes.data : [];
      const patients = Array.isArray(patientRes.data) ? patientRes.data : [];

      const countBedsByDepartment = (bedList) => ({
        general: bedList.filter((b) => b.department === "General").length,
        icu: bedList.filter((b) => b.department === "ICU").length,
        emergency: bedList.filter((b) => b.department === "Emergency").length
      });

      const totalBeds = beds.length;
      const totalBedBreakdown = countBedsByDepartment(beds);
      const occupiedBedList = beds.filter((b) => b.isOccupied);
      const freeBedList = beds.filter((b) => !b.isOccupied);
      const occupiedBedBreakdown = countBedsByDepartment(occupiedBedList);
      const freeBedBreakdown = countBedsByDepartment(freeBedList);

      const admittedPatients = patients.filter((p) => p.status === "admitted").length;
      const waitingPatients = patients.filter((p) => p.status === "waiting").length;
      const dischargedPatients = patients.filter((p) => p.status === "discharged").length;

      setStats({
        totalBeds,
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
        admittedPatients,
        waitingPatients,
        dischargedToday: dischargedPatients
      });
    } catch (error) {
      console.log("Dashboard fetch error:", error);
    }
  };

  useEffect(() => {
    const loadStats = async () => {
      await fetchStats();
    };
    loadStats();
  }, []);

  if (!stats) {
    return (
      <div className="panel p-8">
        <h2 className="text-lg font-semibold text-slate-950">Loading dashboard...</h2>
      </div>
    );
  }

  const pieData = [
    { name: "Occupied", value: stats.occupiedBeds },
    { name: "Free", value: stats.freeBeds }
  ];

  const patientData = [
    { name: "Admitted", value: stats.admittedPatients },
    { name: "Waiting", value: stats.waitingPatients },
    { name: "Discharged", value: stats.dischargedToday }
  ];

  const bedTableColumns = [
    {
      heading: `Total Beds: ${stats.totalBeds}`,
      rows: [
        { label: "General", value: stats.generalBeds },
        { label: "ICU", value: stats.icuBeds },
        { label: "Emergency", value: stats.emergencyBeds }
      ]
    },
    {
      heading: "Occupied Beds",
      rows: [
        { label: "Total", value: stats.occupiedBeds },
        { label: "General", value: stats.occupiedGeneralBeds },
        { label: "ICU", value: stats.occupiedIcuBeds },
        { label: "Emergency", value: stats.occupiedEmergencyBeds }
      ]
    },
    {
      heading: "Free Beds",
      rows: [
        { label: "Total", value: stats.freeBeds },
        { label: "General", value: stats.freeGeneralBeds },
        { label: "ICU", value: stats.freeIcuBeds },
        { label: "Emergency", value: stats.freeEmergencyBeds }
      ]
    }
  ];

  const metricCards = [
    { title: "Total Beds", value: stats.totalBeds, tone: "from-slate-900 to-slate-700" },
    { title: "Occupied Beds", value: stats.occupiedBeds, tone: "from-rose-500 to-rose-400" },
    { title: "Free Beds", value: stats.freeBeds, tone: "from-emerald-500 to-emerald-400" },
    { title: "Admitted Patients", value: stats.admittedPatients, tone: "from-blue-600 to-cyan-500" },
    { title: "Waiting Patients", value: stats.waitingPatients, tone: "from-amber-500 to-orange-400" },
    { title: "Discharged Today", value: stats.dischargedToday, tone: "from-violet-600 to-indigo-500" }
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Capacity Overview</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Hospital Dashboard</h2>
          </div>
          <div className="grid md:grid-cols-3">
            {bedTableColumns.map((column, columnIndex) => (
              <div
                key={column.heading}
                className={columnIndex < bedTableColumns.length - 1 ? "border-b border-slate-200 md:border-b-0 md:border-r" : ""}
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

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((item) => (
          <div key={item.title} className={`rounded-3xl bg-gradient-to-br ${item.tone} p-5 text-white shadow-panel`}>
            <p className="text-sm text-white/75">{item.title}</p>
            <p className="mt-6 text-4xl font-semibold">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="panel p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Resource Usage</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">Bed occupancy</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={100} label>
                  <Cell fill="#f43f5e" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Throughput</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">Patient status</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patientData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
