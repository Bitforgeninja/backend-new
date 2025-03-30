import express from 'express';
import Market from '../models/marketModel.js';
import {
  getMarketResults,
  updateMarketDetails,
  updateMarketStatus
} from '../controllers/marketController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/markets/available
 * @desc    Fetch all open markets
 * @access  Public
 */
router.get('/available', async (req, res) => {
  try {
    const markets = await Market.find({ isBettingOpen: true });
    res.status(200).json(markets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/markets
 * @desc    Fetch all markets
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const markets = await Market.find();
    res.status(200).json(markets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/admin/markets/get-results/:marketId
 * @desc    Fetch all results for a market
 * @access  Admin
 */
router.get("/get-results/:marketId", auth, getMarketResults);

/**
 * @route   GET /api/markets/get-market-id/:marketName
 * @desc    Fetch Market ID using Market Name
 * @access  Public
 */
router.get("/get-market-id/:marketName", async (req, res) => {
  try {
    const { marketName } = req.params;

    if (!marketName) {
      return res.status(400).json({ message: "Market name is required." });
    }

    const market = await Market.findOne({ name: marketName });

    if (!market) {
      return res.status(404).json({ message: "Market not found." });
    }

    res.status(200).json({ marketId: market.marketId });
  } catch (error) {
    console.error("❌ Error fetching market ID:", error);
    res.status(500).json({ message: "Server error while fetching market ID." });
  }
});

/**
 * @route   PUT /api/admin/markets/edit/:marketId
 * @desc    Update full market details (name, time, flags)
 * @access  Admin
 */
router.put("/edit/:marketId", auth, updateMarketDetails);

/**
 * @route   PATCH /api/admin/markets/status/:marketId
 * @desc    Update betting open/close status
 * @access  Admin
 */
router.patch("/status/:marketId", auth, updateMarketStatus);

export default router;
