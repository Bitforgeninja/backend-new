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

// Connect to MongoDB
connectDB();

// Initialize app
const app = express();

// Parse JSON
app.use(express.json());

// ✅ Allow from frontend domains
const allowedOrigins = [
  process.env.FRONTEND_URL?.trim() || "https://consumer-new.vercel.app",
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

// ✅ Market routes (public)
app.use("/api/markets", marketRoutes);

// ✅ All other API routes
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/bets", betRoutes);
app.use("/api/wins", winRoutes);
app.use("/api/admin", adminAuthRoutes); // Admin login/auth
app.use("/api/admin", adminRoutes);     // Admin panel actions
app.use("/api/users", userRoutes);

// ✅ Health check
app.get("/", (req, res) => {
  res.send("Consumer API is running...");
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error!" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Start daily cron job for resets
scheduleMarketTasks();

// ✅ ONE-TIME FIX: Open all markets for betting on first deploy
import Market from "./models/marketModel.js";
(async () => {
  try {
    await Market.updateMany({}, {
      $set: {
        openBetting: true,
        isBettingOpen: true
      }
    });
    console.log('✅ All markets set to openBetting: true, isBettingOpen: true');
  } catch (err) {
    console.error('❌ Failed to update markets for open betting:', err);
  }
})();

export default app;
