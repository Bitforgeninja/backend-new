import express from 'express';
import { placeBet, getUserBets } from '../controllers/betController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/bets/place
 * @desc    Place a bet on a market/game
 * @access  Private
 */
router.post('/place', auth, placeBet);

/**
 * @route   GET /api/bets/user/:userId
 * @desc    Fetch all bets placed by a specific user
 * @access  Private
 */
router.get('/user/', auth, getUserBets);

export default router;
