const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  getMedicines,
  addMedicineStock,
  updateMedicineStock
} = require("../controllers/medicineController");

const router = express.Router();

router.get("/", protect, authorizeRoles("admin", "pharmacy"), getMedicines);
router.post("/", protect, authorizeRoles("admin", "pharmacy"), addMedicineStock);
router.put("/:id", protect, authorizeRoles("admin", "pharmacy"), updateMedicineStock);

module.exports = router;
