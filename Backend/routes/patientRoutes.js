const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// ✅ IMPORT MODEL (VERY IMPORTANT)
const Patient = require("../models/Patient");
const Bed = require("../models/Bed");

const patientController = require("../controllers/patientController");

router.get("/bill/:id", protect, authorizeRoles("admin", "reception"), patientController.getBill);
router.post("/expense/:id", protect, authorizeRoles("admin", "reception"), patientController.addExpense);
router.post("/:id/case-study", protect, authorizeRoles("admin", "doctor"), patientController.addCaseStudy);
router.post("/:id/medicine", protect, authorizeRoles("admin", "pharmacy"), patientController.addMedicine);
router.put("/:id/medicine/:medicineId", protect, authorizeRoles("admin", "pharmacy"), patientController.updateMedicine);
router.delete("/:id/medicine/:medicineId", protect, authorizeRoles("admin", "pharmacy"), patientController.deleteMedicine);

router.get("/bed-stats", protect, authorizeRoles("admin", "doctor"), patientController.getBedStats);
// Create new patient
router.post("/", protect, authorizeRoles("admin", "reception"), patientController.createPatient);

// Get all patients
router.get("/", protect, authorizeRoles("admin", "doctor", "reception", "pharmacy"), patientController.getAllPatients);

// Discharge patient
router.put("/discharge/:id", protect, authorizeRoles("admin", "doctor"), patientController.dischargePatient);

// ✅ DELETE ROUTE (MOVE ABOVE EXPORT)
router.delete("/:id", protect, authorizeRoles("admin"), async (req, res) => {
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
