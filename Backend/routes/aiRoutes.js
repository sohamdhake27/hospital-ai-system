const express = require("express");
const router = express.Router();

const Patient = require("../models/Patient");
const Bed = require("../models/Bed");
const { calculateRiskScore } = require("../services/aiPredictor");
const axios = require("axios");

// =============================================
// 1️⃣ Patient Risk Score
// =============================================
router.get("/risk/:id", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const risk = calculateRiskScore(patient);

    res.json({
      patient: patient.name,
      riskScore: risk.score,
      riskLevel: risk.level
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================
// 2️⃣ Hospital Pressure
// =============================================
router.get("/hospital-pressure", async (req, res) => {
  try {
    const totalBeds = await Bed.countDocuments();
    const occupiedBeds = await Bed.countDocuments({ isOccupied: true });

    const waitingPatients = await Patient.countDocuments({ status: "waiting" });
    const emergencyPatients = await Patient.countDocuments({
      status: "waiting",
      priority: "emergency"
    });

    let score = 0;

    const occupancyRate = (occupiedBeds / totalBeds) * 100;

    if (occupancyRate > 90) score += 40;
    else if (occupancyRate > 75) score += 25;

    if (waitingPatients > 5) score += 30;
    else if (waitingPatients > 2) score += 15;

    if (emergencyPatients > 3) score += 30;

    let level = "Low";

    if (score >= 60) level = "High";
    else if (score >= 30) level = "Medium";

    let recommendation = "System stable";

    if (level === "High")
      recommendation = "Increase emergency capacity immediately";
    else if (level === "Medium")
      recommendation = "Monitor patient inflow closely";

    res.json({
      pressureScore: score,
      pressureLevel: level,
      occupancyRate: occupancyRate.toFixed(2) + "%",
      waitingPatients,
      emergencyPatients,
      recommendation
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================
// 3️⃣ AI Prediction (ONLY ONCE ✅)
// =============================================
router.post("/predict", async (req, res) => {
  try {
    const response = await axios.post(
      "http://localhost:5001/predict",
      req.body
    );

    res.json(response.data);

  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({ message: "AI Server Error" });
  }
});

module.exports = router;