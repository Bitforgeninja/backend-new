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

// ⏰ Market open/close time check
function isMarketOpen() {
  const now = new Date();
  const hour = now.getHours(); // 0 - 23

  // Market is open from 7 AM to 11:59 PM, closed from 12 AM to 6:59 AM
  return hour >= 7 && hour < 24;
}

// ❌ Block API access if market is closed
app.use((req, res, next) => {
  if (!isMarketOpen()) {
    return res.status(403).json({
      message: "⏰ Market is closed. Please come back after 7:00 AM.",
    });
  }
  next();
});

// Middleware for parsing JSON
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

// 🌐 Mount API routes
app.use("/api/auth", authRoutes);           // Auth routes
app.use("/api/markets", marketRoutes);      // Market routes
app.use("/api/wallet", walletRoutes);       // Wallet routes
app.use("/api/bets", betRoutes);            // Bets routes
app.use("/api/wins", winRoutes);            // Wins routes
app.use("/api/admin", adminAuthRoutes);     // Admin login
app.use("/api/admin", adminRoutes);         // Admin actions
app.use("/api/users", userRoutes);          // User management

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

// ⏲ Start cron job for market scheduling
scheduleMarketTasks();

// 🔄 Export for Vercel or serverless deployment
export default app;