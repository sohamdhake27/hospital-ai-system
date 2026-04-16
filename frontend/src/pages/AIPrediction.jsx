import { useState } from "react";
import API from "../api/api";

function AIPrediction() {
  const [age, setAge] = useState("");
  const [severity, setSeverity] = useState("");
  const [disease, setDisease] = useState("");
  const [result, setResult] = useState(null);

  const predict = async () => {
    try {
      const res = await API.post("/ai/predict", {
        age: Number(age),
        severity: Number(severity),
        disease
      });

      setResult(res.data);
    } catch (err) {
      console.log("AI Error:", err);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="panel p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Clinical Intelligence</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">AI Risk Prediction</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Estimate patient risk and get a recommended action for triage planning.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Age</label>
            <input
              type="number"
              placeholder="Enter age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Severity</label>
            <input
              type="number"
              placeholder="Severity (1-3)"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Disease</label>
            <input
              type="text"
              placeholder="Disease (fever, pneumonia...)"
              value={disease}
              onChange={(e) => setDisease(e.target.value)}
              className="input"
            />
          </div>

          <button onClick={predict} className="btn-primary w-full sm:w-auto">
            Predict
          </button>
        </div>
      </section>

      <section className="panel p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Prediction Result</p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-950">Risk summary</h3>
        <p className="mt-2 text-sm text-slate-500">
          The latest AI output appears here after submitting the patient profile.
        </p>

        {result && (
          <div
            className="mt-6 rounded-[28px] p-6 text-white shadow-panel"
            style={{
              background:
                result.risk === "High"
                  ? "linear-gradient(135deg, #e11d48 0%, #fb7185 100%)"
                  : result.risk === "Medium"
                  ? "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
                  : "linear-gradient(135deg, #059669 0%, #34d399 100%)"
            }}
          >
            <p className="text-sm uppercase tracking-[0.24em] text-white/80">Risk Level</p>
            <h4 className="mt-2 text-4xl font-semibold">{result.risk}</h4>
            <div className="mt-6 rounded-2xl bg-white/15 p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-white/80">Recommendation</p>
              <p className="mt-2 text-base font-medium">{result.recommendation}</p>
            </div>
          </div>
        )}

        {!result && (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
            No prediction yet. Fill in the fields and run the AI assessment.
          </div>
        )}
      </section>
    </div>
  );
}

export default AIPrediction;
