const express = require("express");
const router = express.Router();
const { getPrediction } = require("../controllers/aiController");

router.post("/predict", getPrediction);

module.exports = router;
