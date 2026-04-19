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
  aiRisk: {
    type: String
  },
  aiRecommendation: {
    type: String
  },
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
  priority: {
    type: String,
    enum: ["normal", "emergency"],
    default: "normal"
  },
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
  ],
  caseStudies: [
    {
      date: {
        type: Date,
        default: Date.now
      },
      notes: {
        type: String,
        trim: true
      },
      doctor: {
        type: String,
        trim: true
      }
    }
  ],
  medicines: [
    {
      medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Medicine",
        default: null
      },
      name: {
        type: String,
        trim: true
      },
      quantity: {
        type: Number,
        min: 1
      },
      price: {
        type: Number,
        min: 0
      },
      total: {
        type: Number,
        min: 0
      },
      profit: {
        type: Number,
        min: 0,
        default: 0
      },
      addedBy: {
        type: String,
        trim: true
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Patient", patientSchema);
