const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const bedRoutes = require("./routes/bedRoutes");
const aiRoutes = require("./routes/aiRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const seedBeds = require("./services/seedBeds");
const { seedDefaultUser } = require("./services/seedDefaultUser");

require("dotenv").config();

const app = express();
const server = http.createServer(app);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hospitalDB";
const PORT = Number(process.env.PORT) || 5050;
const HOST = process.env.HOST || "0.0.0.0";

app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true
}));
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

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    credentials: true
  }
});

io.on("connection", () => {
  console.log("Socket client connected");
});

app.set("io", io);

app.use("/api/patients", patientRoutes);
app.use("/api/beds", bedRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/medicines", medicineRoutes);

// Backward-compatible aliases for older frontend bundles that call without /api.
app.use("/patients", patientRoutes);
app.use("/beds", bedRoutes);
app.use("/ai", aiRoutes);
app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/medicines", medicineRoutes);

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log(`MongoDB connected: ${MONGO_URI}`);
    await seedBeds();
    await seedDefaultUser();
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
});
