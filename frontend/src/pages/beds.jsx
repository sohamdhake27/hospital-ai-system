import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import API from "../api/api";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5050";

function Beds() {
  const [beds, setBeds] = useState([]);
  const [selectedBed, setSelectedBed] = useState(null);
  const [department, setDepartment] = useState("");

  const getBedNumberValue = (bedNumber = "") => {
    const numericPart = Number.parseInt(String(bedNumber).replace(/\D/g, ""), 10);
    return Number.isNaN(numericPart) ? Number.MAX_SAFE_INTEGER : numericPart;
  };

  const fetchBeds = async () => {
    try {
      const res = await API.get("/beds");
      setBeds(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.log("Error fetching beds:", error);
      setBeds([]);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadBeds = async () => {
      try {
        const res = await API.get("/beds");

        if (isMounted) {
          setBeds(Array.isArray(res.data) ? res.data : []);
        }
      } catch (error) {
        console.log("Error fetching beds:", error);
        if (isMounted) {
          setBeds([]);
        }
      }
    };

    loadBeds();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"]
    });

    socket.on("bedUpdated", fetchBeds);

    return () => socket.disconnect();
  }, []);

  const assignPatient = async (bedId) => {
    try {
      await API.put("/beds/assign", { bedId });
      alert("Patient assigned successfully");
      fetchBeds();
      setSelectedBed(null);
    } catch (error) {
      alert(error.response?.data?.message || "Error assigning patient");
    }
  };

  const filteredBeds = beds.filter((bed) =>
    department ? bed.department === department : true
  );

  const visibleBeds = [...filteredBeds].sort((a, b) => {
    if (a.isOccupied !== b.isOccupied) {
      return a.isOccupied ? -1 : 1;
    }

    if (a.department !== b.department) {
      return a.department.localeCompare(b.department);
    }

    return getBedNumberValue(a.bedNumber) - getBedNumberValue(b.bedNumber);
  });

  const summary = {
    total: filteredBeds.length,
    occupied: filteredBeds.filter((bed) => bed.isOccupied).length,
    free: filteredBeds.filter((bed) => !bed.isOccupied).length
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Bed Operations</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">Bed visualization</h2>
        </div>

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="select w-full md:w-56"
        >
          <option value="">All Departments</option>
          <option value="General">General</option>
          <option value="ICU">ICU</option>
          <option value="Emergency">Emergency</option>
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="panel p-5">
          <p className="text-sm text-slate-500">Total visible beds</p>
          <p className="mt-3 text-4xl font-semibold text-slate-950">{summary.total}</p>
        </div>
        <div className="panel p-5">
          <p className="text-sm text-slate-500">Occupied beds</p>
          <p className="mt-3 text-4xl font-semibold text-rose-600">{summary.occupied}</p>
        </div>
        <div className="panel p-5">
          <p className="text-sm text-slate-500">Free beds</p>
          <p className="mt-3 text-4xl font-semibold text-emerald-600">{summary.free}</p>
        </div>
      </div>

      {visibleBeds.length === 0 ? (
        <div className="panel p-10 text-center text-slate-500">No beds found.</div>
      ) : (
        <div className="panel p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
            {visibleBeds.map((bed) => (
              <div
                key={bed._id}
                onClick={() => setSelectedBed(bed)}
                className={`cursor-pointer rounded-3xl border p-4 text-left transition hover:-translate-y-1 hover:shadow-lg ${
                  bed.isOccupied
                    ? "border-rose-300 bg-red-100 shadow-sm shadow-red-100/80"
                    : "border-emerald-200 bg-emerald-50"
                }`}
              >
                <div
                  className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                    bed.isOccupied ? "bg-red-200 text-red-800" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {bed.isOccupied ? "Occupied" : "Available"}
                </div>
                <h3 className="text-lg font-semibold text-slate-950">Bed {bed.bedNumber}</h3>
                <p className="mt-1 text-sm text-slate-500">{bed.department}</p>
                {bed.isOccupied && (
                  <p className="mt-3 text-sm font-medium text-red-700">
                    {bed.patient?.name || "Patient assigned"}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Bed Details</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">Bed {selectedBed.bedNumber}</h3>
              </div>
              <button onClick={() => setSelectedBed(null)} className="btn-secondary px-3 py-2">
                Close
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Department</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{selectedBed.department}</p>
            </div>

            {selectedBed.isOccupied ? (
              <div className="mt-5 rounded-2xl bg-rose-50 p-4 text-rose-700">
                <p className="text-sm font-semibold uppercase tracking-[0.2em]">Occupied</p>
                <p className="mt-3 text-sm">
                  <span className="font-semibold">Patient:</span> {selectedBed.patient?.name || "N/A"}
                </p>
                <p className="mt-2 text-sm">
                  <span className="font-semibold">Disease:</span> {selectedBed.patient?.disease || "N/A"}
                </p>
              </div>
            ) : (
              <>
                <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-emerald-700">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em]">Free Bed</p>
                  <p className="mt-3 text-sm">This bed is available for immediate assignment.</p>
                </div>

                <button onClick={() => assignPatient(selectedBed._id)} className="btn-primary mt-5 w-full">
                  Assign Patient
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Beds;
