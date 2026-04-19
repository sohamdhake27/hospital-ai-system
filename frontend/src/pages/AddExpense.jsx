import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../api/api";

const categories = [
  { value: "medication", label: "Medication" },
  { value: "test", label: "Test / Other Charges" },
  { value: "surgery", label: "Operation / Surgery" },
  { value: "emergency", label: "Emergency" },
  { value: "other", label: "Extra Expense" }
];

const formatCurrency = (value) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0
  })}`;

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

function ChargeRow({ label, amount, detail }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
      <div>
        <p className="font-medium text-slate-900">{label}</p>
        {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
      </div>
      <p className="shrink-0 font-semibold text-slate-950">{formatCurrency(amount)}</p>
    </div>
  );
}

function AddExpense() {
  const { id } = useParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "medication"
  });

  const fetchBill = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`/patients/bill/${id}`);
      setBill(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBill();
  }, [fetchBill]);

  const groupedExpenses = useMemo(() => {
    const groups = {
      medication: [],
      test: [],
      surgery: [],
      emergency: [],
      other: []
    };

    bill?.expenses?.forEach((expense) => {
      const key = groups[expense.category] ? expense.category : "other";
      groups[key].push(expense);
    });

    return groups;
  }, [bill]);

  const handleAddExpense = async () => {
    if (!form.title.trim() || !form.amount) {
      alert("Please enter expense title and amount");
      return;
    }

    try {
      setSaving(true);
      await API.post(`/patients/expense/${id}`, {
        title: form.title.trim(),
        amount: Number(form.amount),
        category: form.category
      });

      setForm({
        title: "",
        amount: "",
        category: "medication"
      });

      await fetchBill();
    } catch (err) {
      console.log(err);
      alert("Failed to add expense");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading bill...</p>;
  }

  if (!bill) {
    return (
      <div className="panel p-6">
        <h2 className="text-xl font-semibold text-slate-950">Bill not found</h2>
        <Link to="/patients" className="mt-4 inline-flex text-sm font-semibold text-blue-600">
          Back to patients
        </Link>
      </div>
    );
  }

  const patient = bill.patient;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Patient Bill</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">{patient.name}</h2>
          <p className="mt-2 text-sm text-slate-500">
            Bed {patient.bedNumber} | {patient.department} | {bill.days} day{bill.days === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to={`/bill/${id}`}
            className="inline-flex rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open Invoice
          </Link>
          <Link
            to="/patients"
            className="inline-flex rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to patients
          </Link>
        </div>
      </div>

      <section className="panel p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Disease</p>
            <p className="mt-2 font-semibold text-slate-950">{patient.disease}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Admission</p>
            <p className="mt-2 font-semibold text-slate-950">{formatDate(patient.admissionDate)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Discharge</p>
            <p className="mt-2 font-semibold text-slate-950">{formatDate(patient.dischargeDate)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Bill</p>
            <p className="mt-2 text-2xl font-bold text-blue-700">{formatCurrency(bill.summary.total)}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <section className="panel p-6">
          <h3 className="text-lg font-semibold text-slate-950">Calculated charges</h3>
          <div className="mt-4">
            <ChargeRow
              label="Room Rent"
              amount={bill.automaticCharges.roomRent}
              detail={`${formatCurrency(bill.rates.roomRate)} per day x ${bill.days} day${bill.days === 1 ? "" : "s"}`}
            />
            <ChargeRow
              label="Doctor Fee"
              amount={bill.automaticCharges.doctorFee}
              detail={`${formatCurrency(bill.rates.doctorFeePerDay)} per day`}
            />
            <ChargeRow
              label="Nursing Care"
              amount={bill.automaticCharges.nursingCare}
              detail={`${formatCurrency(bill.rates.nursingCarePerDay)} per day`}
            />
            <ChargeRow
              label="ICU Fee"
              amount={bill.automaticCharges.icuFee}
              detail={bill.rates.icuFeePerDay ? `${formatCurrency(bill.rates.icuFeePerDay)} per day` : "Applied only for ICU patients"}
            />
            <ChargeRow
              label="Emergency"
              amount={bill.automaticCharges.emergencyFee}
              detail={
                bill.rates.emergencyFeePerDay
                  ? `${formatCurrency(bill.rates.emergencyFeePerDay)} per day`
                  : "Applied only for Emergency department patients"
              }
            />
          </div>
        </section>

        <section className="panel p-6">
          <h3 className="text-lg font-semibold text-slate-950">Add manual expense</h3>
          <div className="mt-4 space-y-4">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              placeholder="Expense title"
            />
            <input
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="input"
              placeholder="Amount"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="select"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <button onClick={handleAddExpense} disabled={saving} className="btn-primary w-full">
              {saving ? "Adding..." : "Add Expense"}
            </button>
          </div>
        </section>
      </div>

      <section className="panel p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Patient expenses</h3>
            <p className="mt-1 text-sm text-slate-500">Medications, tests, surgery, emergency, and extra charges.</p>
          </div>
          <p className="text-lg font-bold text-slate-950">{formatCurrency(bill.summary.manualTotal)}</p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {categories.map((category) => (
            <div key={category.value} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-semibold text-slate-950">{category.label}</h4>
                <p className="text-sm font-bold text-blue-700">
                  {formatCurrency(
                    category.value === "medication"
                      ? bill.manualTotals.medications
                      : category.value === "test"
                        ? bill.manualTotals.tests
                        : category.value === "surgery"
                          ? bill.manualTotals.surgeries
                          : bill.manualTotals[category.value]
                  )}
                </p>
              </div>

              <div className="mt-3 space-y-2">
                {groupedExpenses[category.value].length > 0 ? (
                  groupedExpenses[category.value].map((expense) => (
                    <div key={expense._id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-slate-800">{expense.title}</p>
                        <p className="text-xs text-slate-500">{formatDate(expense.date)}</p>
                      </div>
                      <p className="font-semibold text-slate-950">{formatCurrency(expense.amount)}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">No expenses added.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-6">
        <h3 className="text-lg font-semibold text-slate-950">Bill summary</h3>
        <div className="mt-4 space-y-3">
          <ChargeRow label="Automatic Charges" amount={bill.summary.automaticTotal} />
          <ChargeRow label="Manual Patient Expenses" amount={bill.summary.manualTotal} />
          <ChargeRow label={`GST (${Math.round(bill.summary.gstRate * 100)}%)`} amount={bill.summary.gstAmount} />
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <p className="text-xl font-bold text-slate-950">Final Total</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(bill.summary.total)}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AddExpense;
