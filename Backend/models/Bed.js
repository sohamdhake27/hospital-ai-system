const mongoose = require("mongoose");

const bedSchema = new mongoose.Schema({
    bedNumber: {
        type: String,
        required: true,
        unique: true
    },
    department: {
    type: String,
    enum: ["General", "ICU", "Emergency"],
    required: true
    },
    isOccupied: {
        type: Boolean,
        default: false
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model("Bed", bedSchema);