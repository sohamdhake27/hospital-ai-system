const express = require("express");
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// ✅ IMPORT MODEL (VERY IMPORTANT)
const Patient = require("../models/Patient");
const Bed = require("../models/Bed");

const patientController = require("../controllers/patientController");

router.get("/bill/:id", patientController.getBill);
router.post("/expense/:id", patientController.addExpense);

router.get("/bed-stats", patientController.getBedStats);
// Create new patient
router.post("/", patientController.createPatient);

// Get all patients
router.get("/", patientController.getAllPatients);

// Discharge patient
router.put("/discharge/:id", patientController.dischargePatient);

// ✅ DELETE ROUTE (MOVE ABOVE EXPORT)
router.delete('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (patient.bedId) {
      await Bed.findByIdAndUpdate(patient.bedId, {
        isOccupied: false,
        patient: null
      });
    }

    await Patient.findByIdAndDelete(req.params.id);

    req.app.get("io")?.emit("bedUpdated");

    res.json({ message: "Patient deleted successfully" });

  } catch (error) {
    console.log(error); // helpful debug
    res.status(500).json({ message: error.message });
  }
});


// ✅ EXPORT AT LAST

module.exports = router;
