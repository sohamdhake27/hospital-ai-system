const express = require("express");
const router = express.Router();

const Bed = require("../models/Bed");
const Patient = require("../models/Patient");
const seedBeds = require("../services/seedBeds");

const { assignBedToPatient } = require("../controllers/bedController");

// GET all beds
router.get("/", async (req, res) => {
  try {
    await seedBeds();

    const beds = await Bed.find().populate("patient", "name disease status");

    for (const bed of beds) {
      const patient = bed.patient;
      const shouldBeOccupied = Boolean(patient && patient.status === "admitted");

      if (bed.isOccupied !== shouldBeOccupied || (!shouldBeOccupied && patient)) {
        bed.isOccupied = shouldBeOccupied;
        bed.patient = shouldBeOccupied ? patient._id : null;
        await bed.save();
      }
    }

    const cleanedBeds = await Bed.find().populate("patient", "name disease status");

    await Patient.updateMany(
      { status: { $ne: "admitted" } },
      { $set: { bedId: null, bedNumber: null } }
    );

    res.json(cleanedBeds);
  } catch (error) {
    console.log("GET BEDS ERROR:", error);
    res.status(500).json({ message: "Error fetching beds" });
  }
});
router.put("/assign", assignBedToPatient);
module.exports = router;
