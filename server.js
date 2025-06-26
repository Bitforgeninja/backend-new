import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import marketRoutes from "./routes/marketRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import betRoutes from "./routes/betRoutes.js";
import winRoutes from "./routes/winRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";

import { scheduleMarketTasks } from './utils/marketScheduler.js';

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

// Initialize the Express app
const app = express();

// ✅ Middleware for parsing JSON
app.use(express.json());

// ✅ Configure CORS for frontend communication
const allowedOrigins = [
  process.env.FRONTEND_URL?.trim() ||
    "https://consumer-new.vercel.app",
  "https://admin-new-black.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// ✅⏰ Market open/close time check (India Standard Time - IST)
function getISTHour() {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000; // Convert to UTC
  const istTime = new Date(utcTime + 5.5 * 60 * 60000); // Add 5.5 hours for IST
  return istTime.getHours(); // IST hour
}

function isMarketOpen() {
  const hour = getISTHour();
  return hour >= 7 && hour < 24; // Market open from 7 AM to 11:59 PM IST
}

// 🔧 TEMP FIX: Disable market check during testing
// This will allow `/api/markets` 24x7 so frontend doesn't break

// ⛔ Original logic (commented out)
// app.use("/api/markets", (req, res, next) => {
//   if (!isMarketOpen()) {
//     return res.status(403).json({
//       message: "⏰ Market is closed. Please come back after 7:00 AM.",
//     });
//   }
//   next();
// });

// ✅ Temporary pass-through (NO BLOCKING)
app.use("/api/markets", (req, res, next) => {
  next();
});

// 🌐 Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/markets", marketRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/bets", betRoutes);
app.use("/api/wins", winRoutes);
app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);

// 🧪 Test route
app.get("/", (req, res) => {
  res.send("Consumer API is running...");
});

// 🛑 Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error!" });
});

// 🚀 Start Express Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ⏱ Start cron job for market updates
scheduleMarketTasks();

// 🔄 Export for serverless if used
export default app;
