const Patient = require("../models/Patient");
const Medicine = require("../models/Medicine");

const LOW_STOCK_LIMIT = 10;

exports.getAnalytics = async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const admitted = await Patient.countDocuments({ status: "admitted" });
    const waiting = await Patient.countDocuments({ status: "waiting" });
    const discharged = await Patient.countDocuments({ status: "discharged" });
    const highRisk = await Patient.countDocuments({ aiRisk: "High" });

    const [patients, medicines] = await Promise.all([
      Patient.find(),
      Medicine.find()
    ]);

    let totalRevenue = 0;
    let medicineRevenue = 0;
    let totalProfit = 0;

    patients.forEach((patient) => {
      const expenseRevenue = patient.expenses?.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0) || 0;
      const patientMedicineRevenue = patient.medicines?.reduce((sum, medicine) => sum + (Number(medicine.total) || 0), 0) || 0;
      const patientProfit = patient.medicines?.reduce((sum, medicine) => sum + (Number(medicine.profit) || 0), 0) || 0;

      totalRevenue += expenseRevenue + patientMedicineRevenue;
      medicineRevenue += patientMedicineRevenue;
      totalProfit += patientProfit;
    });

    const lowStockCount = medicines.filter((medicine) => medicine.stock < LOW_STOCK_LIMIT).length;
    const totalStockUnits = medicines.reduce((sum, medicine) => sum + (Number(medicine.stock) || 0), 0);

    res.json({
      totalPatients,
      admitted,
      waiting,
      discharged,
      highRisk,
      totalRevenue,
      medicineRevenue,
      totalProfit,
      pharmacyItems: medicines.length,
      lowStockCount,
      totalStockUnits
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
