const Patient = require("../models/Patient");
const Bed = require("../models/Bed");
const Medicine = require("../models/Medicine");
const axios = require("axios");
const seedBeds = require("../services/seedBeds");

const getRecommendation = (risk) => {
  if (risk === "High") return "ICU Required";
  if (risk === "Medium") return "Regular Monitoring";
  return "Normal Care";
};

const emitBedUpdate = (req) => {
  req.app.get("io")?.emit("bedUpdated");
};

// ============================================
// 🔥 CREATE PATIENT
// ============================================
const createPatient = async (req, res) => {
  try {
    await seedBeds();

    let { name, age, disease, department, status } = req.body;

    // ============================================
    // 🔥 STEP 1 — AI PREDICTION
    // ============================================
    let risk = null;
    let recommendation = "Normal Care";

    try {
      const aiResponse = await axios.post(
        `${process.env.AI_URL}/predict`,
        { age, disease }
      );

      risk = aiResponse.data.risk;
      recommendation =
        aiResponse.data.recommendation || getRecommendation(risk);

    } catch (err) {
      console.log("AI error:", err.message);
      if (age >= 60) risk = "High";
      else if (age >= 40) risk = "Medium";
      else risk = "Low";
      recommendation = getRecommendation(risk);
    }

    // ============================================
    // 🔥 STEP 2 — ASSIGN BED
    // ============================================
    let assignedBed = null;

    if (status === "admitted") {
      let targetDept = department;

      // 🔥 If HIGH risk → ICU priority
      if (risk === "High") {
       targetDept = "ICU";
      }

      const freeBed = await Bed.findOne({
       isOccupied: false,
       department: targetDept
     });

      if (freeBed) {
        freeBed.isOccupied = true;
        await freeBed.save();

        assignedBed = freeBed._id;
      } else {
        // ❗ If no beds → move to waiting instead of error
        status = "waiting";
      }
    }

    // ============================================
    // 🔥 STEP 3 — CREATE PATIENT
    // ============================================
    const patient = new Patient({
      name,
      age,
      disease,
      department,
      status,
      aiRisk: risk,
      aiRecommendation: recommendation,
      bedId: assignedBed,
      admissionDate: status === "admitted" ? new Date() : null
    });

    await patient.save();

    // ============================================
    // 🔥 STEP 4 — LINK PATIENT TO BED
    // ============================================
    if (assignedBed) {
      await Bed.findByIdAndUpdate(assignedBed, {
        patient: patient._id,
        isOccupied: true
      });

      const assignedBedDoc = await Bed.findById(assignedBed);
      if (assignedBedDoc) {
        patient.bedNumber = assignedBedDoc.bedNumber;
        await patient.save();
      }
    }

    emitBedUpdate(req);
    res.json(patient);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// 🔥 GET ALL PATIENTS
// ============================================
const getAllPatients = async (req, res) => {
  try {
   const patients = await Patient.find()
  .populate("bedId")
  .sort({ createdAt: -1 });

    res.status(200).json(patients);
  } catch (error) {
    console.log("GET PATIENT ERROR:", error);
    res.status(500).json({ message: "Error fetching patients" });
  }
};

// ============================================
// 🔥 DISCHARGE PATIENT
// ============================================
async function dischargePatient(req, res) {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    let freedBedId = patient.bedId;

    // 🔥 1. FREE CURRENT BED
    if (freedBedId) {
      await Bed.findByIdAndUpdate(freedBedId, {
        isOccupied: false,
        patient: null
      });
    }

    patient.status = "discharged";
    patient.bedId = null;
    patient.bedNumber = null;
    patient.dischargeDate = new Date();
    await patient.save();

    // ============================================
    // 🔥 2. AUTO REALLOCATION
    // ============================================

    if (freedBedId) {
      const freedBed = await Bed.findById(freedBedId);

  // 👉 Find highest priority waiting patient
  // Priority: High → Medium → Low
  let waitingPatient =
    await Patient.findOne({ status: "waiting", aiRisk: "High" }).sort({ createdAt: 1 }) ||
    await Patient.findOne({ status: "waiting", aiRisk: "Medium" }).sort({ createdAt: 1 }) ||
    await Patient.findOne({ status: "waiting", aiRisk: "Low" }).sort({ createdAt: 1 });

      if (waitingPatient && freedBed) {
        let assign = false;

        // 🔥 Match department OR ICU priority
        if (waitingPatient.aiRisk === "High" && freedBed.department === "ICU") {
          assign = true;
        } else if (waitingPatient.department === freedBed.department) {
          assign = true;
        }

        if (assign) {
          // Assign bed
          waitingPatient.status = "admitted";
          waitingPatient.bedId = freedBed._id;
          waitingPatient.admissionDate = new Date();

          await waitingPatient.save();

          await Bed.findByIdAndUpdate(freedBed._id, {
            isOccupied: true,
            patient: waitingPatient._id
          });
        }
      }
    }

    emitBedUpdate(req);
    res.json({ message: "Patient discharged & bed reallocated" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

const getBedStats = async (req, res) => {
  try {
    await seedBeds();

    const beds = await Bed.find();

    const totalBeds = beds.length;
    const occupiedBeds = beds.filter((bed) => bed.isOccupied).length;
    const freeBeds = totalBeds - occupiedBeds;

    const countByDepartment = (department, occupiedOnly = false) =>
      beds.filter(
        (bed) =>
          bed.department === department && (!occupiedOnly || bed.isOccupied)
      ).length;

    res.status(200).json({
      totalBeds,
      occupiedBeds,
      freeBeds,
      departments: {
        General: {
          total: countByDepartment("General"),
          occupied: countByDepartment("General", true),
          free:
            countByDepartment("General") - countByDepartment("General", true)
        },
        ICU: {
          total: countByDepartment("ICU"),
          occupied: countByDepartment("ICU", true),
          free: countByDepartment("ICU") - countByDepartment("ICU", true)
        },
        Emergency: {
          total: countByDepartment("Emergency"),
          occupied: countByDepartment("Emergency", true),
          free:
            countByDepartment("Emergency") -
            countByDepartment("Emergency", true)
        }
      }
    });
  } catch (error) {
    console.log("GET BED STATS ERROR:", error);
    res.status(500).json({ message: "Error fetching bed stats" });
  }
};

const BILL_RATES = {
  roomRent: {
    General: 2000,
    ICU: 5000,
    Emergency: 3000
  },
  doctorFeePerDay: 1000,
  nursingCarePerDay: 500,
  icuFeePerDay: 3000,
  emergencyFeePerDay: 1500
};

const getStayDays = (patient) => {
  const startDate = patient.admissionDate || patient.createdAt || new Date();
  const endDate = patient.dischargeDate || new Date();
  const stayMs = new Date(endDate) - new Date(startDate);

  return Math.max(1, Math.ceil(stayMs / (1000 * 60 * 60 * 24)));
};

const getBill = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate("bedId");

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const days = getStayDays(patient);
    const department = patient.bedId?.department || patient.department || "General";
    const roomRate = BILL_RATES.roomRent[department] || BILL_RATES.roomRent.General;

    const automaticCharges = {
      roomRent: days * roomRate,
      doctorFee: days * BILL_RATES.doctorFeePerDay,
      nursingCare: days * BILL_RATES.nursingCarePerDay,
      icuFee: department === "ICU" ? days * BILL_RATES.icuFeePerDay : 0,
      emergencyFee:
        department === "Emergency" ? days * BILL_RATES.emergencyFeePerDay : 0
    };

    const manualTotals = {
      medications: 0,
      tests: 0,
      surgeries: 0,
      emergency: 0,
      other: 0
    };

    const expenses = patient.expenses || [];
    const medicines = patient.medicines || [];

    expenses.forEach((expense) => {
      const amount = Number(expense.amount) || 0;

      if (expense.category === "medication") manualTotals.medications += amount;
      else if (expense.category === "test") manualTotals.tests += amount;
      else if (expense.category === "surgery") manualTotals.surgeries += amount;
      else if (expense.category === "emergency") manualTotals.emergency += amount;
      else manualTotals.other += amount;
    });

    const medicineTotal = medicines.reduce((sum, medicine) => sum + (Number(medicine.total) || 0), 0);
    manualTotals.medications += medicineTotal;

    const automaticTotal = Object.values(automaticCharges).reduce((sum, value) => sum + value, 0);
    const manualTotal = Object.values(manualTotals).reduce((sum, value) => sum + value, 0);
    const subtotal = automaticTotal + manualTotal;
    const GST_RATE = 0.18;
    const gstAmount = +(subtotal * GST_RATE).toFixed(2);
    const total = +(subtotal + gstAmount).toFixed(2);

    res.status(200).json({
      patient,
      days,
      rates: {
        roomRate,
        doctorFeePerDay: BILL_RATES.doctorFeePerDay,
        nursingCarePerDay: BILL_RATES.nursingCarePerDay,
        icuFeePerDay: BILL_RATES.icuFeePerDay,
        emergencyFeePerDay: BILL_RATES.emergencyFeePerDay
      },
      automaticCharges,
      manualTotals,
      expenses,
      medicines,
      summary: {
        automaticTotal,
        manualTotal,
        subtotal,
        gstRate: GST_RATE,
        gstAmount,
        total
      }
    });
  } catch (error) {
    console.log("GET BILL ERROR:", error);
    res.status(500).json({ message: "Error fetching bill" });
  }
};

const addExpense = async (req, res) => {
  try {
    const { title, amount, category } = req.body;
    const parsedAmount = Number(amount);

    if (!title || !Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ message: "Valid title and amount are required" });
    }

    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    patient.expenses.push({
      title,
      amount: parsedAmount,
      category: category || "other"
    });

    await patient.save();

    res.status(201).json({ message: "Expense added successfully" });
  } catch (error) {
    console.log("ADD EXPENSE ERROR:", error);
    res.status(500).json({ message: "Error adding expense" });
  }
};

const addCaseStudy = async (req, res) => {
  try {
    const { notes, doctor } = req.body;

    if (!notes?.trim()) {
      return res.status(400).json({ message: "Case study notes are required" });
    }

    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    patient.caseStudies.push({
      notes: notes.trim(),
      doctor: doctor?.trim() || req.user?.role || "Doctor"
    });

    await patient.save();

    res.json({
      message: "Case study added",
      caseStudies: patient.caseStudies
    });
  } catch (error) {
    console.log("ADD CASE STUDY ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const addMedicine = async (req, res) => {
  try {
    const { medicineId, quantity, addedBy } = req.body;
    const parsedQuantity = Number(quantity);

    if (!medicineId || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ message: "Valid medicine selection and quantity are required" });
    }

    const [patient, medicineStock] = await Promise.all([
      Patient.findById(req.params.id),
      Medicine.findById(medicineId)
    ]);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (!medicineStock) {
      return res.status(404).json({ message: "Medicine stock item not found" });
    }

    if (medicineStock.stock < parsedQuantity) {
      return res.status(400).json({ message: "Insufficient stock available" });
    }

    const sellingPrice = Number(medicineStock.sellingPrice) || 0;
    const purchasePrice = Number(medicineStock.purchasePrice) || 0;
    const total = parsedQuantity * sellingPrice;
    const profit = parsedQuantity * Math.max(0, sellingPrice - purchasePrice);

    medicineStock.stock -= parsedQuantity;

    patient.medicines.push({
      medicineId: medicineStock._id,
      name: medicineStock.name,
      quantity: parsedQuantity,
      price: sellingPrice,
      total,
      profit,
      addedBy: addedBy?.trim() || req.user?.role || "Pharmacy"
    });

    await Promise.all([medicineStock.save(), patient.save()]);

    res.json({
      message: "Medicine added",
      medicines: patient.medicines
    });
  } catch (error) {
    console.log("ADD MEDICINE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateMedicine = async (req, res) => {
  try {
    const { medicineId, quantity, addedBy } = req.body;
    const parsedQuantity = Number(quantity);

    if (!medicineId || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ message: "Valid medicine selection and quantity are required" });
    }

    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const medicine = patient.medicines.id(req.params.medicineId);

    if (!medicine) {
      return res.status(404).json({ message: "Medicine entry not found" });
    }

    const previousMedicineId = medicine.medicineId ? String(medicine.medicineId) : null;
    const nextMedicineId = String(medicineId);
    const previousQuantity = Number(medicine.quantity) || 0;

    const [previousStockMedicine, nextStockMedicine] = await Promise.all([
      previousMedicineId ? Medicine.findById(previousMedicineId) : Promise.resolve(null),
      Medicine.findById(nextMedicineId)
    ]);

    if (!nextStockMedicine) {
      return res.status(404).json({ message: "Medicine stock item not found" });
    }

    if (previousMedicineId && previousMedicineId === nextMedicineId) {
      const quantityDelta = parsedQuantity - previousQuantity;

      if (quantityDelta > 0 && nextStockMedicine.stock < quantityDelta) {
        return res.status(400).json({ message: "Insufficient stock available for update" });
      }

      nextStockMedicine.stock -= quantityDelta;
      await nextStockMedicine.save();
    } else {
      if (nextStockMedicine.stock < parsedQuantity) {
        return res.status(400).json({ message: "Insufficient stock available for update" });
      }

      if (previousStockMedicine) {
        previousStockMedicine.stock += previousQuantity;
      }

      nextStockMedicine.stock -= parsedQuantity;

      await Promise.all([
        previousStockMedicine ? previousStockMedicine.save() : Promise.resolve(),
        nextStockMedicine.save()
      ]);
    }

    const sellingPrice = Number(nextStockMedicine.sellingPrice) || 0;
    const purchasePrice = Number(nextStockMedicine.purchasePrice) || 0;

    medicine.medicineId = nextStockMedicine._id;
    medicine.name = nextStockMedicine.name;
    medicine.quantity = parsedQuantity;
    medicine.price = sellingPrice;
    medicine.total = parsedQuantity * sellingPrice;
    medicine.profit = parsedQuantity * Math.max(0, sellingPrice - purchasePrice);
    medicine.addedBy = addedBy?.trim() || medicine.addedBy || req.user?.role || "Pharmacy";

    await patient.save();

    res.json({
      message: "Medicine updated",
      medicines: patient.medicines
    });
  } catch (error) {
    console.log("UPDATE MEDICINE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteMedicine = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const medicine = patient.medicines.id(req.params.medicineId);

    if (!medicine) {
      return res.status(404).json({ message: "Medicine entry not found" });
    }

    if (medicine.medicineId) {
      const stockMedicine = await Medicine.findById(medicine.medicineId);

      if (stockMedicine) {
        stockMedicine.stock += Number(medicine.quantity) || 0;
        await stockMedicine.save();
      }
    }

    medicine.deleteOne();
    await patient.save();

    res.json({
      message: "Medicine deleted",
      medicines: patient.medicines
    });
  } catch (error) {
    console.log("DELETE MEDICINE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
  createPatient,
  getAllPatients,
  dischargePatient,
  getBedStats,
  getBill,
  addExpense,
  addCaseStudy,
  addMedicine,
  updateMedicine,
  deleteMedicine
};
