const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  supplier: {
    type: String,
    trim: true,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model("Medicine", medicineSchema);
