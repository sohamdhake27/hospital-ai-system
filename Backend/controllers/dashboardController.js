const Bed = require("../models/Bed");
const Patient = require("../models/Patient");

const getDashboard = async (req, res) => {
  try {
    const totalBeds = await Bed.countDocuments();
    const occupiedBeds = await Bed.countDocuments({ isOccupied: true });
    const freeBeds = await Bed.countDocuments({ isOccupied: false });

    const admittedPatients = await Patient.countDocuments({ status: "admitted" });
    const waitingPatients = await Patient.countDocuments({ status: "waiting" });
    const dischargedPatients = await Patient.countDocuments({ status: "discharged" });

    res.json({
      totalBeds,
      occupiedBeds,
      freeBeds,
      admittedPatients,
      waitingPatients,
      dischargedPatients
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching dashboard" });
  }
};

module.exports = { getDashboard };
