import express from 'express';
import multer from 'multer';
import {
  getUsers,
  editBet,
  addMarket,
  declareResult,
  getAdmins,
  getAllTransactions,
  getAllBets,
  editMarket,
  deleteMarket,
  deleteBet,
  deleteUser,
  getAllWinningRatios,
  updateWinningRatio,
  updatePlatformSettings,
  getPlatformSettings,
  addUser,
  publishOpenResults
} from '../controllers/adminController.js';

import adminAuth from '../middleware/adminAuth.js';
import { updateUserDetails } from '../controllers/userController.js';
import { updateMarketStatus } from '../controllers/marketController.js';

const router = express.Router();

// ✅ Multer upload: Handles QR and banner image in memory
const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: 'qr', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]);

// ✅ Platform Settings Routes
router.get('/platform-settings', getPlatformSettings);
router.put('/platform-settings', adminAuth, upload, updatePlatformSettings);

// ✅ User management
router.get('/users', adminAuth, getUsers);
router.put('/users/:id', adminAuth, updateUserDetails);
router.put('/bets/:id', adminAuth, editBet);
router.post("/users/add", adminAuth, addUser);
router.delete('/users/:userId', adminAuth, deleteUser);

// ✅ Market management
router.post('/add-market', adminAuth, addMarket);
router.put('/markets/:marketId', adminAuth, updateMarketStatus);
router.post('/markets/declare-results', adminAuth, declareResult);
router.delete('/markets/:marketId', adminAuth, deleteMarket);
router.post('/markets/publish-open', adminAuth, publishOpenResults);

// ✅ Transactions and Bets
router.get('/transactions', adminAuth, getAllTransactions);
router.get('/bets', adminAuth, getAllBets);
router.delete('/bets/:id', adminAuth, deleteBet);

// ✅ Winning Ratios
router.get('/winning-ratios', getAllWinningRatios);
router.put('/winning-ratios/:id', adminAuth, updateWinningRatio);

// ✅ Admins list
router.get('/admins', getAdmins);

export default router;
