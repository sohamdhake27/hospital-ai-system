const Patient = require("../models/Patient");
const Bed = require("../models/Bed");

exports.getDashboardStats = async (req, res) => {
    try {
        const totalPatients = await Patient.countDocuments();
        const admittedPatients = await Patient.countDocuments({ status: "admitted" });
        const waitingPatients = await Patient.countDocuments({ status: "waiting" });
        const dischargedPatients = await Patient.countDocuments({ status: "discharged" });

        const totalBeds = await Bed.countDocuments();
        const occupiedBeds = await Bed.countDocuments({ isOccupied: true });
        const availableBeds = await Bed.countDocuments({ isOccupied: false });

        res.json({
            patients: {
                total: totalPatients,
                admitted: admittedPatients,
                waiting: waitingPatients,
                discharged: dischargedPatients
            },
            beds: {
                total: totalBeds,
                occupied: occupiedBeds,
                available: availableBeds
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};