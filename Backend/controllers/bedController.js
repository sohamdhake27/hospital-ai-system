const Patient = require("../models/Patient");
const Bed = require("../models/Bed");

const assignBedToPatient = async (req, res) => {
  try {
    const { bedId } = req.body;

    // 🔥 Find one waiting patient
    const patient = await Patient.findOne({ status: "waiting" });

    if (!patient) {
      return res.status(400).json({ message: "No waiting patients" });
    }

    const bed = await Bed.findById(bedId);

    if (!bed || bed.isOccupied) {
      return res.status(400).json({ message: "Bed not available" });
    }

    // ✅ Assign bed
    bed.isOccupied = true;
    bed.patient = patient._id;
    await bed.save();

    // ✅ Update patient
    patient.status = "admitted";
    patient.bedId = bed._id;
    patient.bedNumber = bed.bedNumber;
    patient.admissionDate = new Date();
    await patient.save();

    const updatedBed = await Bed.findById(bedId).populate("patient", "name disease status");

    res.json({
      message: "Patient assigned to bed successfully",
      patient,
      bed: updatedBed
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
     assignBedToPatient 
};
