const Medicine = require("../models/Medicine");
const Patient = require("../models/Patient");

const LOW_STOCK_LIMIT = 10;

const getProfitSummary = async () => {
  const patients = await Patient.find({}, { medicines: 1 });

  return patients.reduce(
    (sum, patient) =>
      sum + (patient.medicines || []).reduce((medicineSum, medicine) => medicineSum + (Number(medicine.profit) || 0), 0),
    0
  );
};

const getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ name: 1 });
    const lowStock = medicines.filter((medicine) => medicine.stock < LOW_STOCK_LIMIT);
    const totalProfit = await getProfitSummary();

    res.json({
      medicines,
      lowStock,
      metrics: {
        totalItems: medicines.length,
        lowStockCount: lowStock.length,
        totalUnits: medicines.reduce((sum, medicine) => sum + (Number(medicine.stock) || 0), 0),
        inventoryValue: medicines.reduce(
          (sum, medicine) => sum + ((Number(medicine.purchasePrice) || 0) * (Number(medicine.stock) || 0)),
          0
        ),
        totalProfit
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addMedicineStock = async (req, res) => {
  try {
    const { name, stock, purchasePrice, sellingPrice, supplier } = req.body;
    const parsedStock = Number(stock);
    const parsedPurchasePrice = Number(purchasePrice);
    const parsedSellingPrice = Number(sellingPrice);

    if (
      !name?.trim() ||
      !Number.isFinite(parsedStock) ||
      parsedStock < 0 ||
      !Number.isFinite(parsedPurchasePrice) ||
      parsedPurchasePrice < 0 ||
      !Number.isFinite(parsedSellingPrice) ||
      parsedSellingPrice < 0
    ) {
      return res.status(400).json({ message: "Valid medicine stock details are required" });
    }

    const existingMedicine = await Medicine.findOne({ name: new RegExp(`^${name.trim()}$`, "i") });

    if (existingMedicine) {
      existingMedicine.stock += parsedStock;
      existingMedicine.purchasePrice = parsedPurchasePrice;
      existingMedicine.sellingPrice = parsedSellingPrice;
      existingMedicine.supplier = supplier?.trim() || existingMedicine.supplier;
      await existingMedicine.save();

      return res.status(200).json(existingMedicine);
    }

    const medicine = await Medicine.create({
      name: name.trim(),
      stock: parsedStock,
      purchasePrice: parsedPurchasePrice,
      sellingPrice: parsedSellingPrice,
      supplier: supplier?.trim() || ""
    });

    res.status(201).json(medicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMedicineStock = async (req, res) => {
  try {
    const { name, stock, purchasePrice, sellingPrice, supplier } = req.body;
    const parsedStock = Number(stock);
    const parsedPurchasePrice = Number(purchasePrice);
    const parsedSellingPrice = Number(sellingPrice);

    if (
      !name?.trim() ||
      !Number.isFinite(parsedStock) ||
      parsedStock < 0 ||
      !Number.isFinite(parsedPurchasePrice) ||
      parsedPurchasePrice < 0 ||
      !Number.isFinite(parsedSellingPrice) ||
      parsedSellingPrice < 0
    ) {
      return res.status(400).json({ message: "Valid medicine stock details are required" });
    }

    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({ message: "Medicine stock item not found" });
    }

    medicine.name = name.trim();
    medicine.stock = parsedStock;
    medicine.purchasePrice = parsedPurchasePrice;
    medicine.sellingPrice = parsedSellingPrice;
    medicine.supplier = supplier?.trim() || "";

    await medicine.save();

    res.json(medicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  LOW_STOCK_LIMIT,
  getMedicines,
  addMedicineStock,
  updateMedicineStock
};
