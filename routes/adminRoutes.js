import express from 'express';
import multer from 'multer';

import {
  getUsers,
  editBet,
  addMarket,
  declareResult,
  getAllMarketResults, // ✅ IMPORTED HERE
  getAdmins,
  getAllTransactions,
  getAllBets,
  deleteMarket,
  deleteBet,
  deleteUser,
  getAllWinningRatios,
  updateWinningRatio,
  updatePlatformSettings,
  getPlatformSettings,
  addUser,
  publishOpenResults,
  resetMarketResult
} from '../controllers/adminController.js';

import adminAuth from '../middleware/adminAuth.js';
import { updateUserDetails } from '../controllers/userController.js';
import { updateMarketStatus } from '../controllers/marketController.js';

const router = express.Router();

// ✅ Configure Multer for in-memory handling of QR and banner image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: 'qrCode', maxCount: 1 },
  { name: 'bannerImage', maxCount: 1 }
]);

// ✅ Platform Settings
router.get('/platform-settings', getPlatformSettings);
router.put('/platform-settings', adminAuth, upload, updatePlatformSettings);

// ✅ User Management
router.get('/users', adminAuth, getUsers);
router.post('/users/add', adminAuth, addUser);
router.put('/users/:id', adminAuth, updateUserDetails);
router.delete('/users/:userId', adminAuth, deleteUser);

// ✅ Bet Management
router.get('/bets', adminAuth, getAllBets);
router.put('/bets/:id', adminAuth, editBet);
router.delete('/bets/:id', adminAuth, deleteBet);

// ✅ Market Management
router.post('/add-market', adminAuth, addMarket);
router.put('/markets/:marketId', adminAuth, updateMarketStatus);
router.post('/markets/declare-results', adminAuth, declareResult);
router.post('/markets/publish-open', adminAuth, publishOpenResults);
router.post('/markets/reset-result', adminAuth, resetMarketResult);
router.delete('/markets/:marketId', adminAuth, deleteMarket);

// ✅ 📢 NEW - GET ALL DECLARED RESULTS FOR CHART
router.get('/markets/results', adminAuth, getAllMarketResults);

// ✅ Transaction Management
router.get('/transactions', adminAuth, getAllTransactions);

// ✅ Winning Ratios
router.get('/winning-ratios', getAllWinningRatios);
router.put('/winning-ratios/:id', adminAuth, updateWinningRatio);

// ✅ Admins List
router.get('/admins', adminAuth, getAdmins);

export default router;
