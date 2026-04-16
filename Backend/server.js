const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/authRoutes");
require("dotenv").config();

const app = express();

// ========================================
// ✅ MIDDLEWARE
// ========================================
app.use(cors());
app.use(express.json());

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

// ========================================
// ✅ DATABASE CONNECTION
// ========================================
mongoose.connect("mongodb://127.0.0.1:27017/hospitalDB")
  .then(() => {
    console.log("MongoDB Connected ✅");
  })
  .catch((err) => {
    console.error("MongoDB Error ❌:", err);
  });

// ========================================
// ✅ START SERVER (IMPORTANT)
// ========================================
const PORT = 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});