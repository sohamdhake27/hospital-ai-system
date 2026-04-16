import { useState } from "react";
import { predictRisk } from "../services/aiService";

const RiskPredictor = () => {
  const [form, setForm] = useState({
    age: "",
    heartRate: "",
    oxygenLevel: "",
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const data = await predictRisk({
      age: Number(form.age),
      heartRate: Number(form.heartRate),
      oxygenLevel: Number(form.oxygenLevel),
    });

    setResult(data);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>AI Patient Risk Prediction</h2>

      <input
        name="age"
        placeholder="Age"
        onChange={handleChange}
      />
      <br />

      <input
        name="heartRate"
        placeholder="Heart Rate"
        onChange={handleChange}
      />
      <br />

      <input
        name="oxygenLevel"
        placeholder="Oxygen Level"
        onChange={handleChange}
      />
      <br />

      <button onClick={handleSubmit}>Predict</button>

      {result && (
        <div>
          <h3>Risk Level: {result.riskLevel}</h3>
        </div>
      )}
    </div>
  );
};

export default RiskPredictor;