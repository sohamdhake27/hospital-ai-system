const predictRisk = (req, res) => {
  const { age, severity, disease } = req.body;

  let risk = "Low";

  if (age > 60 || severity > 7) {
    risk = "High";
  } else if (age > 40 || severity > 4) {
    risk = "Medium";
  }

  if (disease.toLowerCase().includes("heart")) {
    risk = "High";
  }

  res.json({
    risk,
    recommendation:
      risk === "High"
        ? "ICU Required"
        : risk === "Medium"
        ? "Regular Monitoring"
        : "Normal Care"
  });
};

module.exports = { predictRisk };