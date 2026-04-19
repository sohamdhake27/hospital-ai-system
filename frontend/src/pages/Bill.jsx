import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import API from "../api/api";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

function Bill() {
  const { id } = useParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchBill = async () => {
      try {
        const res = await API.get(`/patients/bill/${id}`);

        if (isMounted) {
          setBill(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch bill:", err);
        if (isMounted) {
          setBill(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBill();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const downloadPDF = async () => {
    const input = document.getElementById("invoice");

    if (!input) return;

    try {
      setDownloading(true);

      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`hospital-bill-${id}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <p className="px-6 py-10 text-center text-sm text-slate-500">Loading invoice...</p>;
  }

  if (!bill) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="panel p-6 text-center">
          <h2 className="text-2xl font-semibold text-slate-950">Bill not found</h2>
          <Link to="/patients" className="mt-4 inline-flex text-sm font-semibold text-blue-600">
            Back to patients
          </Link>
        </div>
      </div>
    );
  }

  const { patient, automaticCharges, manualTotals, summary, days } = bill;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Link to={`/patients/bill/${id}`} className="btn-secondary">
          Back to bill editor
        </Link>
        <div className="flex flex-wrap gap-3">
          <button onClick={downloadPDF} disabled={downloading} className="btn-primary">
            {downloading ? "Preparing PDF..." : "Download PDF"}
          </button>
          <button onClick={() => window.print()} className="btn-secondary">
            Print
          </button>
        </div>
      </div>

      <div id="invoice" className="panel overflow-hidden bg-white p-8 shadow-xl print:shadow-none">
        <div className="border-b border-slate-200 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">Soham Hospital AI</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950">Patient Invoice</h1>
              <p className="mt-2 text-sm text-slate-500">Nashik, Maharashtra | GSTIN: 27ABCDE1234F1Z5</p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-950">Patient:</span> {patient.name}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-950">Department:</span> {patient.department}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-950">Stay:</span> {days} day{days === 1 ? "" : "s"}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-950">Admission:</span> {formatDate(patient.admissionDate)}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-950">Discharge:</span> {formatDate(patient.dischargeDate)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 py-6 md:grid-cols-2">
          <section>
            <h2 className="text-lg font-semibold text-slate-950">Automatic charges</h2>
            <div className="mt-4 space-y-3">
              <ChargeRow label="Room rent" amount={automaticCharges.roomRent} />
              <ChargeRow label="Doctor fee" amount={automaticCharges.doctorFee} />
              <ChargeRow label="Nursing care" amount={automaticCharges.nursingCare} />
              <ChargeRow label="ICU charges" amount={automaticCharges.icuFee} />
              <ChargeRow label="Emergency charges" amount={automaticCharges.emergencyFee} />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-950">Manual charges</h2>
            <div className="mt-4 space-y-3">
              <ChargeRow label="Medications" amount={manualTotals.medications} />
              <ChargeRow label="Tests" amount={manualTotals.tests} />
              <ChargeRow label="Surgery" amount={manualTotals.surgeries} />
              <ChargeRow label="Emergency" amount={manualTotals.emergency} />
              <ChargeRow label="Other" amount={manualTotals.other} />
            </div>
          </section>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <div className="ml-auto max-w-md space-y-3">
            <SummaryRow label="Automatic total" value={summary.automaticTotal} />
            <SummaryRow label="Manual total" value={summary.manualTotal} />
            <SummaryRow label={`GST (${Math.round(summary.gstRate * 100)}%)`} value={summary.gstAmount} />
            <div className="flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-4 text-white">
              <span className="text-base font-semibold">Grand total</span>
              <span className="text-2xl font-bold">{formatCurrency(summary.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChargeRow({ label, amount }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
      <span>{label}</span>
      <span className="font-semibold text-slate-950">{formatCurrency(amount)}</span>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-600">
      <span>{label}</span>
      <span className="font-semibold text-slate-950">{formatCurrency(value)}</span>
    </div>
  );
}

export default Bill;
