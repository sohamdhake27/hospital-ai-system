const Bed = require("../models/Bed");
const Patient = require("../models/Patient");

const allocateBed = async (patient) => {

    // 1️⃣ Find empty bed
    const availableBed = await Bed.findOne({ isOccupied: false });

    if (availableBed) {
        // Mark bed occupied
        availableBed.isOccupied = true;
        availableBed.patient = patient._id;
        await availableBed.save();

        // Update patient
        patient.status = "admitted";
        patient.bedNumber = availableBed.bedNumber;
        patient.admissionDate = new Date();
        await patient.save();

        return "Admitted";
    } else {
        // No bed available
        patient.status = "waiting";
        await patient.save();

        return "Waiting";
    }
};

module.exports = allocateBed;