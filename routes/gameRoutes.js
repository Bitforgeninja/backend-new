import express from 'express';
import { getGamesByMarket } from '../controllers/gameController.js';

const router = express.Router();

/**
 * @route   GET /api/games/:marketId
 * @desc    Fetch all games for a specific market
 * @access  Public
 */
router.get('/:marketId', getGamesByMarket);

export default router;
