import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import API from "../api/api";

const formatDateTime = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const formatPrescriptionDate = (value = new Date()) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

function Patients() {
  const location = useLocation();
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const isBillingView = location.pathname === "/billing";
  const canAddPatient = role === "admin" || role === "reception";
  const canDeletePatient = role === "admin";
  const canViewBilling = role === "admin" || role === "reception";
  const canViewAiRisk = role === "admin" || role === "doctor";
  const canDischargePatient = role === "admin" || role === "doctor";
  const canManageCaseStudies = role === "admin" || role === "doctor";
  const canAddMedicines = role === "admin" || role === "pharmacy";
  const canViewMedicines = role === "admin" || role === "pharmacy" || role === "doctor";

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    name: "",
    age: "",
    disease: "",
    department: "",
    status: "admitted"
  });
  const [selectedCaseStudyPatient, setSelectedCaseStudyPatient] = useState(null);
  const [selectedMedicinePatient, setSelectedMedicinePatient] = useState(null);
  const [caseStudyNotes, setCaseStudyNotes] = useState("");
  const [medicineForm, setMedicineForm] = useState({
    medicineId: "",
    quantity: ""
  });
  const [medicineStock, setMedicineStock] = useState([]);
  const [editingMedicineId, setEditingMedicineId] = useState(null);
  const [savingCaseStudy, setSavingCaseStudy] = useState(false);
  const [savingMedicine, setSavingMedicine] = useState(false);
  const [loadingMedicineStock, setLoadingMedicineStock] = useState(false);
  const [showPrescriptionPreview, setShowPrescriptionPreview] = useState(false);
  const [downloadingPrescription, setDownloadingPrescription] = useState(false);

  const fetchPatients = async () => {
    try {
      const res = await API.get("/patients", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadPatients = async () => {
      try {
        const res = await API.get("/patients", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (isMounted) {
          setPatients(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.log(err);
      }
    };

    loadPatients();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleAdd = async () => {
    try {
      await API.post("/patients", form, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await fetchPatients();
      setForm({
        name: "",
        age: "",
        disease: "",
        department: "",
        status: "admitted"
      });
    } catch (err) {
      console.log(err);
    }
  };

  const handleDischarge = async (id) => {
    try {
      await API.put(
        `/patients/discharge/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchPatients();
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/patients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchPatients();
    } catch (err) {
      console.log(err);
    }
  };

  const openCaseStudy = (patientId) => {
    const patient = patients.find((item) => item._id === patientId);
    setSelectedCaseStudyPatient(patient || null);
    setCaseStudyNotes("");
  };

  const loadMedicineStock = async () => {
    if (!canAddMedicines) return;

    try {
      setLoadingMedicineStock(true);
      const res = await API.get("/medicines", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMedicineStock(Array.isArray(res.data?.medicines) ? res.data.medicines : []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingMedicineStock(false);
    }
  };

  const openMedicineEntry = async (patientId) => {
    const patient = patients.find((item) => item._id === patientId);
    setSelectedMedicinePatient(patient || null);
    setMedicineForm({
      medicineId: "",
      quantity: ""
    });
    setEditingMedicineId(null);

    if (canAddMedicines) {
      await loadMedicineStock();
    }
  };

  const refreshSelectedPatient = (patientId, patientList) =>
    patientList.find((item) => item._id === patientId) || null;

  const submitCaseStudy = async () => {
    if (!selectedCaseStudyPatient || !caseStudyNotes.trim()) return;

    try {
      setSavingCaseStudy(true);
      await API.post(
        `/patients/${selectedCaseStudyPatient._id}/case-study`,
        {
          notes: caseStudyNotes.trim(),
          doctor: user.name || "Doctor"
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const res = await API.get("/patients", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const nextPatients = Array.isArray(res.data) ? res.data : [];
      setPatients(nextPatients);
      setSelectedCaseStudyPatient(refreshSelectedPatient(selectedCaseStudyPatient._id, nextPatients));
      setCaseStudyNotes("");
    } catch (err) {
      console.log(err);
    } finally {
      setSavingCaseStudy(false);
    }
  };

  const submitMedicineEntry = async () => {
    if (!selectedMedicinePatient || !medicineForm.medicineId || !medicineForm.quantity) return;

    try {
      setSavingMedicine(true);
      const payload = {
        quantity: Number(medicineForm.quantity),
        medicineId: medicineForm.medicineId,
        addedBy: user.name || "Pharmacy"
      };

      if (editingMedicineId) {
        await API.put(
          `/patients/${selectedMedicinePatient._id}/medicine/${editingMedicineId}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      } else {
        await API.post(
          `/patients/${selectedMedicinePatient._id}/medicine`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }

      const res = await API.get("/patients", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const nextPatients = Array.isArray(res.data) ? res.data : [];
      setPatients(nextPatients);
      setSelectedMedicinePatient(refreshSelectedPatient(selectedMedicinePatient._id, nextPatients));
      setMedicineForm({
        medicineId: "",
        quantity: ""
      });
      setEditingMedicineId(null);
      await loadMedicineStock();
    } catch (err) {
      console.log(err);
    } finally {
      setSavingMedicine(false);
    }
  };

  const startMedicineEdit = (medicine) => {
    setEditingMedicineId(medicine._id);
    setMedicineForm({
      medicineId: medicine.medicineId || "",
      quantity: String(medicine.quantity || "")
    });
  };

  const cancelMedicineEdit = () => {
    setEditingMedicineId(null);
    setMedicineForm({
      medicineId: "",
      quantity: ""
    });
  };

  const deleteMedicineEntry = async (medicineId) => {
    if (!selectedMedicinePatient) return;

    try {
      setSavingMedicine(true);
      await API.delete(`/patients/${selectedMedicinePatient._id}/medicine/${medicineId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const res = await API.get("/patients", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const nextPatients = Array.isArray(res.data) ? res.data : [];
      setPatients(nextPatients);
      setSelectedMedicinePatient(refreshSelectedPatient(selectedMedicinePatient._id, nextPatients));
      await loadMedicineStock();

      if (editingMedicineId === medicineId) {
        cancelMedicineEdit();
      }
    } catch (err) {
      console.log(err);
    } finally {
      setSavingMedicine(false);
    }
  };

  const filteredPatients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return patients.filter((patient) => (
      (filterStatus === "all" || patient.status === filterStatus) &&
      (filterDept === "all" || patient.department === filterDept) &&
      (query === "" ||
        patient.name?.toLowerCase().includes(query) ||
        patient.disease?.toLowerCase().includes(query) ||
        patient.department?.toLowerCase().includes(query))
    ));
  }, [filterDept, filterStatus, patients, searchTerm]);

  const selectedMedicineStock = useMemo(
    () => medicineStock.find((item) => item._id === medicineForm.medicineId) || null,
    [medicineForm.medicineId, medicineStock]
  );

  const openPrescriptionPreview = () => {
    if (!selectedCaseStudyPatient) return;
    setShowPrescriptionPreview(true);
  };

  const closePrescriptionPreview = () => {
    setShowPrescriptionPreview(false);
  };

  const downloadPrescriptionPDF = async () => {
    const input = document.getElementById("prescription");

    if (!input || !selectedCaseStudyPatient) return;

    try {
      setDownloadingPrescription(true);

      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      const safeName = (selectedCaseStudyPatient.name || "patient").replace(/[^a-z0-9]+/gi, "_");
      pdf.save(`${safeName}_prescription.pdf`);
    } finally {
      setDownloadingPrescription(false);
    }
  };

  const statusClasses = {
    admitted: "bg-emerald-100 text-emerald-700",
    waiting: "bg-amber-100 text-amber-700",
    discharged: "bg-slate-200 text-slate-700"
  };

  const totalColumns =
    5 +
    (canDischargePatient ? 1 : 0) +
    (canDeletePatient ? 1 : 0) +
    (canViewAiRisk ? 2 : 0) +
    (canManageCaseStudies ? 1 : 0) +
    (canViewBilling ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
          {role === "pharmacy" ? "Pharmacy Panel" : isBillingView ? "Reception Panel" : "Patient Operations"}
        </p>
        <h2 className="text-3xl font-semibold text-slate-950">
          {role === "pharmacy" ? "Medicine Registry" : isBillingView ? "Billing Desk" : "Patients"}
        </h2>
      </div>

      <div className={`grid gap-6 ${canAddPatient && !isBillingView && role !== "pharmacy" ? "xl:grid-cols-[0.95fr_1.05fr]" : ""}`}>
        {canAddPatient && !isBillingView && role !== "pharmacy" && (
          <section className="panel p-6">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-slate-950">Add patient</h3>
              <p className="mt-1 text-sm text-slate-500">Capture admissions and queue new cases in one place.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
              />
              <input
                placeholder="Age"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="input"
              />
              <input
                placeholder="Disease"
                value={form.disease}
                onChange={(e) => setForm({ ...form, disease: e.target.value })}
                className="input"
              />
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="select"
              >
                <option value="">Select Department</option>
                <option value="General">General</option>
                <option value="ICU">ICU</option>
                <option value="Emergency">Emergency</option>
              </select>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="select sm:col-span-2"
              >
                <option value="admitted">Admitted</option>
                <option value="waiting">Waiting</option>
              </select>
            </div>

            <button onClick={handleAdd} className="btn-primary mt-5 w-full sm:w-auto">
              Add Patient
            </button>
          </section>
        )}

        <section className="panel p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">
                {role === "pharmacy" ? "Medicine issue queue" : isBillingView ? "Billing registry" : "Patient registry"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {role === "pharmacy"
                  ? "Click a patient name to add medicine usage entries with price and keep a running medicine log."
                  : isBillingView
                    ? "Open bill editor and printable invoices for admitted patients."
                    : "Search and filter live admission records."}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
              {filteredPatients.length} records
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <input
              placeholder="Search patient, disease, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input md:col-span-3"
            />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="select">
              <option value="all">All Status</option>
              <option value="admitted">Admitted</option>
              <option value="waiting">Waiting</option>
              <option value="discharged">Discharged</option>
            </select>
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="select">
              <option value="all">All Departments</option>
              <option value="General">General</option>
              <option value="ICU">ICU</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>
        </section>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Age</th>
                <th className="px-5 py-4">Disease</th>
                <th className="px-5 py-4">Status</th>
                {canDischargePatient && <th className="px-5 py-4">Discharge</th>}
                {canDeletePatient && <th className="px-5 py-4">Delete</th>}
                {canViewAiRisk && <th className="px-5 py-4">Risk</th>}
                {canViewAiRisk && <th className="px-5 py-4">Recommendation</th>}
                {canManageCaseStudies && <th className="px-5 py-4">Case Study</th>}
                <th className="px-5 py-4">Bed</th>
                {canViewBilling && <th className="px-5 py-4">Billing</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredPatients.map((patient) => (
                <tr key={patient._id} className="align-top text-sm text-slate-600">
                  <td className="px-5 py-4 font-medium text-slate-900">
                    {canViewMedicines ? (
                      <button
                        onClick={() => openMedicineEntry(patient._id)}
                        className="font-semibold text-slate-900 transition hover:text-blue-600"
                      >
                        {patient.name}
                      </button>
                    ) : (
                      patient.name
                    )}
                  </td>
                  <td className="px-5 py-4">{patient.age}</td>
                  <td className="px-5 py-4">{patient.disease}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        statusClasses[patient.status] || statusClasses.discharged
                      }`}
                    >
                      {patient.status}
                    </span>
                  </td>

                  {canDischargePatient && (
                    <td className="px-5 py-4">
                      {patient.status !== "discharged" && (
                        <button
                          onClick={() => handleDischarge(patient._id)}
                          className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-600"
                        >
                          Discharge
                        </button>
                      )}
                    </td>
                  )}

                  {canDeletePatient && (
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleDelete(patient._id)}
                        className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600"
                      >
                        Delete
                      </button>
                    </td>
                  )}

                  {canViewAiRisk && <td className="px-5 py-4 font-semibold text-amber-600">{patient.aiRisk || "-"}</td>}
                  {canViewAiRisk && <td className="px-5 py-4">{patient.aiRecommendation || "-"}</td>}

                  {canManageCaseStudies && (
                    <td className="px-5 py-4">
                      <button
                        onClick={() => openCaseStudy(patient._id)}
                        className="inline-flex rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-700"
                      >
                        Add / View
                      </button>
                    </td>
                  )}

                  <td className="px-5 py-4">
                    {patient.bedId?.bedNumber || patient.bedNumber ? (
                      <span className="inline-flex rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white">
                        {patient.bedId?.bedNumber || patient.bedNumber}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>

                  {canViewBilling && (
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/patients/bill/${patient._id}`}
                          className="inline-flex rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Bill
                        </Link>
                        <Link
                          to={`/bill/${patient._id}`}
                          className="inline-flex rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          Invoice
                        </Link>
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={totalColumns} className="px-5 py-10 text-center text-sm text-slate-500">
                    No patients match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCaseStudyPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Case Study</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">{selectedCaseStudyPatient.name}</h3>
              </div>
              <button onClick={() => setSelectedCaseStudyPatient(null)} className="btn-secondary px-3 py-2">
                Close
              </button>
            </div>

            <textarea
              placeholder="Enter daily health update..."
              value={caseStudyNotes}
              onChange={(e) => setCaseStudyNotes(e.target.value)}
              className="input mt-6 min-h-32 resize-none"
            />

            <div className="mt-4 flex items-center gap-3">
              <button onClick={submitCaseStudy} disabled={savingCaseStudy} className="btn-primary">
                {savingCaseStudy ? "Saving..." : "Save Update"}
              </button>
              <button
                onClick={openPrescriptionPreview}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Generate Prescription
              </button>
              <p className="text-sm text-slate-500">Stored with doctor name and timestamp for daily follow-up.</p>
            </div>

            <div className="mt-6 max-h-72 space-y-3 overflow-y-auto pr-1">
              {(selectedCaseStudyPatient.caseStudies || []).length > 0 ? (
                [...selectedCaseStudyPatient.caseStudies].reverse().map((entry, index) => (
                  <div key={`${entry.date}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-950">{entry.doctor || "Doctor"}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(entry.date)}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{entry.notes}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                  No case study updates added yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedMedicinePatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Medicine Log</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">{selectedMedicinePatient.name}</h3>
              </div>
              <button onClick={() => setSelectedMedicinePatient(null)} className="btn-secondary px-3 py-2">
                Close
              </button>
            </div>

            {canAddMedicines && (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-[1fr_160px_auto]">
                  <select
                    value={medicineForm.medicineId}
                    onChange={(e) => setMedicineForm({ ...medicineForm, medicineId: e.target.value })}
                    className="select"
                  >
                    <option value="">{loadingMedicineStock ? "Loading inventory..." : "Select medicine from stock"}</option>
                    {medicineStock.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name} | Stock {item.stock} | Sell {formatCurrency(item.sellingPrice)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={medicineForm.quantity}
                    onChange={(e) => setMedicineForm({ ...medicineForm, quantity: e.target.value })}
                    className="input"
                    placeholder="Quantity"
                  />
                  <button onClick={submitMedicineEntry} disabled={savingMedicine} className="btn-primary">
                    {savingMedicine ? "Saving..." : editingMedicineId ? "Update" : "Add"}
                  </button>
                </div>

                {selectedMedicineStock && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <div className="grid gap-3 md:grid-cols-4">
                      <p>
                        <span className="font-semibold text-slate-900">Stock:</span> {selectedMedicineStock.stock}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">Buy:</span> {formatCurrency(selectedMedicineStock.purchasePrice)}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">Sell:</span> {formatCurrency(selectedMedicineStock.sellingPrice)}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">Supplier:</span> {selectedMedicineStock.supplier || "-"}
                      </p>
                    </div>
                    {selectedMedicineStock.stock < 10 && (
                      <p className="mt-3 font-medium text-rose-600">Low stock alert: replenish this item soon.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {canAddMedicines && editingMedicineId && (
              <div className="mt-3">
                <button onClick={cancelMedicineEdit} className="btn-secondary">
                  Cancel Edit
                </button>
              </div>
            )}

            <div className="mt-6 max-h-72 space-y-3 overflow-y-auto pr-1">
              {(selectedMedicinePatient.medicines || []).length > 0 ? (
                [...selectedMedicinePatient.medicines].reverse().map((entry, index) => (
                  <div key={`${entry.date}-${entry.name}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-950">{entry.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Qty: {entry.quantity} | Price: {formatCurrency(entry.price)} | Total: {formatCurrency(entry.total)}
                        </p>
                        {"profit" in entry && (
                          <p className="mt-1 text-xs font-medium text-emerald-600">Tracked margin: {formatCurrency(entry.profit)}</p>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 sm:text-right">
                        <p>Added by: {entry.addedBy || "Pharmacy"}</p>
                        <p className="mt-1 text-xs">{formatDateTime(entry.date)}</p>
                      </div>
                    </div>
                    {canAddMedicines && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => startMedicineEdit(entry)}
                          className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteMedicineEntry(entry._id)}
                          className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                  No medicine entries added yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPrescriptionPreview && selectedCaseStudyPatient && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm print:bg-transparent">
          <div className="w-full max-w-4xl rounded-[28px] bg-white p-6 shadow-2xl print:max-w-none print:rounded-none print:p-0 print:shadow-none">
            <div className="mb-4 flex flex-wrap items-center gap-3 print:hidden">
              <button onClick={downloadPrescriptionPDF} disabled={downloadingPrescription} className="btn-primary">
                {downloadingPrescription ? "Preparing PDF..." : "Download PDF"}
              </button>
              <button onClick={() => window.print()} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
                Print
              </button>
              <button onClick={closePrescriptionPreview} className="ml-auto text-sm font-semibold text-rose-600 transition hover:text-rose-700">
                Close
              </button>
            </div>

            <div className="max-h-[82vh] overflow-y-auto print:max-h-none print:overflow-visible">
              <div id="prescription" className="mx-auto w-full max-w-[800px] rounded-[28px] border border-slate-200 bg-white p-8 text-slate-900 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-8 print:shadow-none">
                <div className="border-b border-slate-200 pb-6">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">Soham Hospital AI</p>
                      <h1 className="mt-3 text-3xl font-semibold text-slate-950">Patient Prescription</h1>
                      <p className="mt-2 text-sm text-slate-500">Nashik, Maharashtra | GSTIN: 27ABCDE1234F1Z5</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <p>
                        <span className="font-semibold text-slate-950">Date:</span> {formatPrescriptionDate()}
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold text-slate-950">Doctor:</span> {user.name || "Doctor"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 py-6 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-950">Name:</span> {selectedCaseStudyPatient.name || "-"}
                    </p>
                    <p className="mt-2">
                      <span className="font-semibold text-slate-950">Age:</span> {selectedCaseStudyPatient.age ?? "-"}
                    </p>
                    <p className="mt-2">
                      <span className="font-semibold text-slate-950">Disease:</span> {selectedCaseStudyPatient.disease || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-950">Department:</span> {selectedCaseStudyPatient.department || "-"}
                    </p>
                    <p className="mt-2">
                      <span className="font-semibold text-slate-950">Status:</span> {selectedCaseStudyPatient.status || "-"}
                    </p>
                    <p className="mt-2">
                      <span className="font-semibold text-slate-950">Bed:</span> {selectedCaseStudyPatient.bedId?.bedNumber || selectedCaseStudyPatient.bedNumber || "-"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200 py-6">
                  <h2 className="text-lg font-semibold text-slate-950">Medicines</h2>
                  <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">
                    <div className="grid grid-cols-[64px_1fr_120px_120px] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      <p>No.</p>
                      <p>Medicine</p>
                      <p>Quantity</p>
                      <p className="text-right">Price</p>
                    </div>

                    {(selectedCaseStudyPatient.medicines || []).length > 0 ? (
                      [...selectedCaseStudyPatient.medicines].map((medicine, index) => (
                        <div key={`${medicine.date || medicine.name}-${index}`} className="grid grid-cols-[64px_1fr_120px_120px] border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
                          <p>{index + 1}</p>
                          <p className="font-medium text-slate-950">{medicine.name || "-"}</p>
                          <p>{medicine.quantity || 0}</p>
                          <p className="text-right">{formatCurrency(medicine.price)}</p>
                        </div>
                      ))
                    ) : (
                      <div className="border-t border-slate-100 px-4 py-4 text-sm text-slate-500">
                        No medicines added yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200 py-6">
                  <h2 className="text-lg font-semibold text-slate-950">Doctor Notes</h2>
                  <div className="mt-4 space-y-3">
                    {(selectedCaseStudyPatient.caseStudies || []).length > 0 ? (
                      [...selectedCaseStudyPatient.caseStudies].map((entry, index) => (
                        <div key={`${entry.date || "note"}-${index}`} className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-slate-950">{entry.doctor || user.name || "Doctor"}</p>
                            <p className="text-xs text-slate-500">{formatDateTime(entry.date)}</p>
                          </div>
                          <p className="mt-2 leading-6">{entry.notes || "-"}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                        No case notes available.
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-8">
                  <div className="flex items-end justify-between gap-6">
                    <div>
                      <p className="text-sm text-slate-500">Doctor Signature</p>
                      <p className="mt-4 text-lg text-slate-950">______________________</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-950">{user.name || "Doctor"}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">Authorized by hospital desk</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Patients;
