import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";

function Patients() {
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

  const token = localStorage.getItem("token");

  const fetchPatients = async () => {
    try {
      const res = await API.get("/patients", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(res.data);
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
          setPatients(res.data);
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

      fetchPatients();

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
      fetchPatients();
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/patients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPatients();
    } catch (err) {
      console.log(err);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const query = searchTerm.trim().toLowerCase();

    return (
      (filterStatus === "all" || p.status === filterStatus) &&
      (filterDept === "all" || p.department === filterDept) &&
      (query === "" ||
        p.name?.toLowerCase().includes(query) ||
        p.disease?.toLowerCase().includes(query) ||
        p.department?.toLowerCase().includes(query))
    );
  });

  const statusClasses = {
    admitted: "bg-emerald-100 text-emerald-700",
    waiting: "bg-amber-100 text-amber-700",
    discharged: "bg-slate-200 text-slate-700"
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Patient Operations</p>
        <h2 className="text-3xl font-semibold text-slate-950">Patients</h2>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
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

        <section className="panel p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Patient registry</h3>
              <p className="mt-1 text-sm text-slate-500">Search and filter live admission records.</p>
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
                <th className="px-5 py-4">Discharge</th>
                <th className="px-5 py-4">Delete</th>
                <th className="px-5 py-4">Risk</th>
                <th className="px-5 py-4">Recommendation</th>
                <th className="px-5 py-4">Bed</th>
                <th className="px-5 py-4">Bill</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredPatients.map((p) => (
                <tr key={p._id} className="align-top text-sm text-slate-600">
                  <td className="px-5 py-4 font-medium text-slate-900">{p.name}</td>
                  <td className="px-5 py-4">{p.age}</td>
                  <td className="px-5 py-4">{p.disease}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        statusClasses[p.status] || statusClasses.discharged
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {p.status !== "discharged" && (
                      <button
                        onClick={() => handleDischarge(p._id)}
                        className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-600"
                      >
                        Discharge
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600"
                    >
                      Delete
                    </button>
                  </td>
                  <td className="px-5 py-4 font-semibold text-amber-600">{p.aiRisk || "-"}</td>
                  <td className="px-5 py-4">{p.aiRecommendation || "-"}</td>
                  <td className="px-5 py-4">
                    {p.bedId?.bedNumber || p.bedNumber ? (
                      <Link
                        to={`/patients/bill/${p._id}`}
                        className="inline-flex rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                      >
                        {p.bedId?.bedNumber || p.bedNumber}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/patients/bill/${p._id}`}
                        className="inline-flex rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                      >
                        Bill
                      </Link>
                      <Link
                        to={`/bill/${p._id}`}
                        className="inline-flex rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                      >
                        Invoice
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="10" className="px-5 py-10 text-center text-sm text-slate-500">
                    No patients match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Patients;
