import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const Bill = () => {
  const { id } = useParams();
  const [bill, setBill] = useState(null);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/patients/bill/${id}`);
        setBill(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchBill();
  }, [id]);
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const downloadPDF = async () => {
  const input = document.getElementById("invoice");

  const canvas = await html2canvas(input);
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF();
  pdf.addImage(imgData, "PNG", 0, 0, 210, 297);

  pdf.save("hospital-bill.pdf");
};
  if (!bill) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div id="invoice" className="bg-white p-6 rounded shadow max-w-2xl mx-auto mt-10">

      <h1 className="text-2xl font-bold text-center">
  🏥 Soham Hospital AI
</h1>

<p className="text-center text-sm text-gray-500">
  Nashik, Maharashtra | GSTIN: 27ABCDE1234F1Z5
</p>

<h2 className="text-xl font-semibold text-center mt-2 mb-4">
  Patient Invoice
</h2>

      <p><b>Patient:</b> {bill.patient.name}</p>
      <p><b>Days:</b> {bill.days}</p>

      <hr className="my-4" />

      <div className="space-y-1">

        <p>Room Rent: ₹{bill.automaticCharges.roomRent}</p>
        <p>Doctor Fee: ₹{bill.automaticCharges.doctorFee}</p>
        <p>Nursing Care: ₹{bill.automaticCharges.nursingCare}</p>
        <p>ICU Charges: ₹{bill.automaticCharges.icuFee}</p>

        <hr />

        <p>Medications: ₹{bill.manualTotals.medications}</p>
        <p>Tests: ₹{bill.manualTotals.tests}</p>
        <p>Surgery: ₹{bill.manualTotals.surgeries}</p>
        <p>Emergency: ₹{bill.manualTotals.emergency}</p>
        <p>Other: ₹{bill.manualTotals.other}</p>

        <hr />

        <p><b>Subtotal:</b> ₹{bill.summary.subtotal}</p>
        <p><b>GST (18%):</b> ₹{bill.summary.gstAmount}</p>

        <h2 className="text-xl font-bold">
          Total: ₹{bill.summary.total}
        </h2>

      </div>
      <button
  onClick={downloadPDF}
  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
>
  Download PDF
</button>

<button
  onClick={() => window.print()}
  className="mt-2 bg-green-600 text-white px-4 py-2 rounded ml-2"
>
  Print
</button>

    </div>
  );
};

export default Bill;