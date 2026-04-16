const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"]
    },
    disease: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    doctor: {
        type: String
    },

    // 🔥 AI Fields
    aiRisk: {
        type: String
    },
    aiRecommendation: {
        type: String
    },

    // 🔥 Medical Parameters
    oxygenLevel: {
        type: Number
    },
    bloodPressure: {
        type: String
    },
    heartRate: {
        type: Number
    },
    diabetes: {
        type: Boolean,
        default: false
    },

    // 🚦 Priority
    priority: {
        type: String,
        enum: ["normal", "emergency"],
        default: "normal"
    },

    // 🏥 Status
    status: {
        type: String,
        enum: ["waiting", "admitted", "discharged"],
        default: "waiting"
    },

    bedNumber: {
        type: String,
        default: null
    },

    bedId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bed",
        default: null
    },

    admissionDate: {
        type: Date,
        default: Date.now
    },

dischargeDate: {
    type: Date
},

expenses: [
    {
        title: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        category: {
            type: String,
            enum: ["medication", "test", "surgery", "emergency", "other"],
            default: "other"
        },
        date: {
            type: Date,
            default: Date.now
        }
    }
]

}, { timestamps: true });

module.exports = mongoose.model("Patient", patientSchema);
