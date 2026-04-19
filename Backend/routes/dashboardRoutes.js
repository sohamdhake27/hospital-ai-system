const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { getAnalytics } = require("../controllers/dashboardController");

const router = express.Router();

router.get("/analytics", protect, authorizeRoles("admin"), getAnalytics);

module.exports = router;
