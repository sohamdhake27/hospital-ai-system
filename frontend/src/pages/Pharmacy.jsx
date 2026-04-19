import { useEffect, useMemo, useState } from "react";
import API from "../api/api";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const initialFormState = {
  name: "",
  stock: "",
  purchasePrice: "",
  sellingPrice: "",
  supplier: ""
};

function Pharmacy() {
  const [inventory, setInventory] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [form, setForm] = useState(initialFormState);
  const [editingMedicineId, setEditingMedicineId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchInventory = async () => {
    try {
      const res = await API.get("/medicines");
      setInventory(Array.isArray(res.data?.medicines) ? res.data.medicines : []);
      setMetrics(res.data?.metrics || null);
    } catch (error) {
      console.log("Medicine inventory error:", error);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const lowStockItems = useMemo(
    () => inventory.filter((medicine) => Number(medicine.stock) < 10),
    [inventory]
  );

  const handleSubmit = async () => {
    const payload = {
      name: form.name,
      stock: Number(form.stock),
      purchasePrice: Number(form.purchasePrice),
      sellingPrice: Number(form.sellingPrice),
      supplier: form.supplier
    };

    try {
      setSaving(true);

      if (editingMedicineId) {
        await API.put(`/medicines/${editingMedicineId}`, payload);
      } else {
        await API.post("/medicines", payload);
      }

      setForm(initialFormState);
      setEditingMedicineId(null);
      await fetchInventory();
    } catch (error) {
      console.log("Medicine save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (medicine) => {
    setEditingMedicineId(medicine._id);
    setForm({
      name: medicine.name || "",
      stock: String(medicine.stock ?? ""),
      purchasePrice: String(medicine.purchasePrice ?? ""),
      sellingPrice: String(medicine.sellingPrice ?? ""),
      supplier: medicine.supplier || ""
    });
  };

  const cancelEdit = () => {
    setEditingMedicineId(null);
    setForm(initialFormState);
  };

  const cards = [
    { label: "Stock Items", value: metrics?.totalItems ?? inventory.length, tone: "text-slate-950" },
    { label: "Low Stock Alerts", value: metrics?.lowStockCount ?? lowStockItems.length, tone: "text-rose-600" },
    { label: "Inventory Value", value: formatCurrency(metrics?.inventoryValue), tone: "text-blue-600" },
    { label: "Tracked Profit", value: formatCurrency(metrics?.totalProfit), tone: "text-emerald-600" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Pharmacy ERP</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">Stock, alerts, and profit tracking</h2>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="panel p-5">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className={`mt-4 text-3xl font-semibold ${card.tone}`}>{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
            {editingMedicineId ? "Update Stock" : "Add Stock"}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">
            {editingMedicineId ? "Edit medicine inventory item" : "Create or restock a medicine item"}
          </h3>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input md:col-span-2"
              placeholder="Medicine name"
            />
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="input"
              placeholder="Stock units"
            />
            <input
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              className="input"
              placeholder="Supplier"
            />
            <input
              type="number"
              min="0"
              value={form.purchasePrice}
              onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
              className="input"
              placeholder="Purchase price"
            />
            <input
              type="number"
              min="0"
              value={form.sellingPrice}
              onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
              className="input"
              placeholder="Selling price"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={handleSubmit} disabled={saving} className="btn-primary">
              {saving ? "Saving..." : editingMedicineId ? "Update Stock" : "Save Stock"}
            </button>
            {editingMedicineId && (
              <button onClick={cancelEdit} className="btn-secondary">
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        <div className="panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Alert Center</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">Low stock watchlist</h3>

          <div className="mt-5 space-y-3">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((medicine) => (
                <div key={medicine._id} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{medicine.name}</p>
                      <p className="mt-1 text-sm text-slate-600">Supplier: {medicine.supplier || "-"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-rose-600">Only {medicine.stock} left</p>
                      <p className="mt-1 text-xs text-slate-500">Sell {formatCurrency(medicine.sellingPrice)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
                All medicines are above the low-stock threshold.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Inventory List</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">Live pharmacy stock</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <th className="px-5 py-4">Medicine</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Purchase</th>
                <th className="px-5 py-4">Selling</th>
                <th className="px-5 py-4">Margin</th>
                <th className="px-5 py-4">Supplier</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {inventory.map((medicine) => (
                <tr key={medicine._id} className="text-sm text-slate-600">
                  <td className="px-5 py-4 font-medium text-slate-950">
                    <div className="flex items-center gap-3">
                      <span>{medicine.name}</span>
                      {Number(medicine.stock) < 10 && (
                        <span className="rounded-full bg-rose-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-600">
                          Low
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">{medicine.stock}</td>
                  <td className="px-5 py-4">{formatCurrency(medicine.purchasePrice)}</td>
                  <td className="px-5 py-4">{formatCurrency(medicine.sellingPrice)}</td>
                  <td className="px-5 py-4 text-emerald-600">
                    {formatCurrency((Number(medicine.sellingPrice) || 0) - (Number(medicine.purchasePrice) || 0))}
                  </td>
                  <td className="px-5 py-4">{medicine.supplier || "-"}</td>
                  <td className="px-5 py-4">
                    <button onClick={() => startEdit(medicine)} className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-600">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}

              {inventory.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
                    No medicines have been stocked yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Pharmacy;
