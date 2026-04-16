const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { getDashboard } = require("../controllers/dashboardController");

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("admin", "doctor"),
  getDashboard
);

module.exports = router;
