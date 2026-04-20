const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();

// ROUTES
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const bedRoutes = require("./routes/bedRoutes");
const aiRoutes = require("./routes/aiRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const medicineRoutes = require("./routes/medicineRoutes");

// SERVICES
const seedBeds = require("./services/seedBeds");
const { seedDefaultUser } = require("./services/seedDefaultUser");

const app = express();
const server = http.createServer(app); // ✅ SINGLE SERVER (IMPORTANT)

// ENV
const PORT = process.env.PORT || 5050;

// ✅ CORS (FIXED + SAFE)
app.use(cors({
  origin: [
  "http://localhost:5173",
  "https://hospital-ai-system-woc3-n384quic0-sohamdhake27s-projects.vercel.app"
]
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// ✅ BASIC ROUTES (HEALTH CHECK)
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "hospital-ai-system",
    api: "/api"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// ✅ SOCKET.IO (CONNECTED TO SAME SERVER)
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://hospital-ai-system-woc3-n384quic0-sohamdhake27s-projects.vercel.app"
    ],
    credentials: true
  }
});

io.on("connection", () => {
  console.log("Socket client connected");
});

app.set("io", io);

// ✅ API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/beds", bedRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/medicines", medicineRoutes);

// OPTIONAL (BACKWARD SUPPORT)
app.use("/auth", authRoutes);
app.use("/patients", patientRoutes);
app.use("/beds", bedRoutes);
app.use("/ai", aiRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/medicines", medicineRoutes);

// ✅ DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected ✅");
    await seedBeds();
    await seedDefaultUser();
  })
  .catch((err) => {
    console.error("MongoDB Error ❌", err);
  });

// ✅ START SERVER (FIXED — USE server.listen)
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});