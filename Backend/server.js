const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/authRoutes");
const seedBeds = require("./services/seedBeds");
require("dotenv").config();

const app = express();

// ========================================
// ✅ MIDDLEWARE
// ========================================
app.use(cors());
app.use(express.json());

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

// ========================================
// ✅ CREATE SERVER + SOCKET.IO
// ========================================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// 🔥 SOCKET CONNECTION
io.on("connection", (socket) => {
  console.log("User connected");
});

// Make io accessible in controllers
app.set("io", io);

// ========================================
// ✅ ROUTES IMPORT
// ========================================
const patientRoutes = require("./routes/patientRoutes");
const bedRoutes = require("./routes/bedRoutes");
const aiRoutes = require("./routes/aiRoutes");

// ========================================
// ✅ ROUTES USE
// ========================================
app.use("/api/patients", patientRoutes);
app.use("/api/beds", bedRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);

// Backward-compatible aliases for older frontend bundles that call without /api.
app.use("/patients", patientRoutes);
app.use("/beds", bedRoutes);
app.use("/ai", aiRoutes);
app.use("/auth", authRoutes);

// ========================================
// ✅ DATABASE CONNECTION
// ========================================
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Atlas Connected ✅");
    await seedBeds();
  })
  .catch((err) => {
    console.error("MongoDB Error ❌:", err);
  });

// ========================================
// ✅ START SERVER (IMPORTANT)
// ========================================
const PORT = Number(process.env.PORT) || 5000;
const HOST = "0.0.0.0";

server.listen(PORT, HOST, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
