import express from 'express';
import { getUserWins, addWinRecord } from '../controllers/winController.js'; // Correct export names
import auth from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/wins/user/:userId
 * @desc    Fetch all wins for a specific user
 * @access  Private
 */
router.get('/user/:userId', auth, getUserWins);

/**
 * @route   POST /api/wins/add
 * @desc    Add a new win record
 * @access  Private
 */
router.post('/add', auth, addWinRecord);

export default router;
