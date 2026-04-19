import { useEffect, useMemo, useState } from "react";
import API from "../api/api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/dashboard/analytics");
        setData(res.data);
      } catch (error) {
        console.log("Analytics error:", error);
      }
    };

    fetchData();
  }, []);

  const pieData = useMemo(
    () => [
      { name: "Admitted", value: data?.admitted || 0 },
      { name: "Waiting", value: data?.waiting || 0 },
      { name: "Discharged", value: data?.discharged || 0 }
    ],
    [data]
  );

  const barData = useMemo(
    () => [
      { name: "Patients", value: data?.totalPatients || 0 },
      { name: "High Risk", value: data?.highRisk || 0 },
      { name: "Medicine Revenue", value: data?.medicineRevenue || 0 },
      { name: "Profit", value: data?.totalProfit || 0 }
    ],
    [data]
  );

  if (!data) {
    return <p className="text-sm text-slate-500">Loading analytics...</p>;
  }

  const cards = [
    { label: "Total Patients", value: data.totalPatients, tone: "text-slate-950" },
    { label: "High Risk", value: data.highRisk, tone: "text-rose-600" },
    { label: "Total Revenue", value: formatCurrency(data.totalRevenue), tone: "text-emerald-600" },
    { label: "Medicine Revenue", value: formatCurrency(data.medicineRevenue), tone: "text-blue-600" },
    { label: "Tracked Profit", value: formatCurrency(data.totalProfit), tone: "text-violet-600" },
    { label: "Pharmacy Items", value: data.pharmacyItems, tone: "text-slate-950" },
    { label: "Low Stock Alerts", value: data.lowStockCount, tone: "text-rose-600" },
    { label: "Units In Stock", value: data.totalStockUnits, tone: "text-blue-600" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Executive Analytics</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">Admin Analytics Dashboard</h2>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="panel p-5">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className={`mt-4 text-3xl font-semibold ${card.tone}`}>{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Status Mix</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">Patient distribution</h3>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" outerRadius={110} label>
                  <Cell fill="#22c55e" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#64748b" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Revenue And Risk</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">Operational insights</h3>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
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

export default AdminDashboard;
