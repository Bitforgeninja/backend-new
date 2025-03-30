import express from 'express';
import { registerAdmin, loginAdmin } from '../controllers/adminAuthController.js';

const router = express.Router();

/**
 * @route POST /api/admin/register
 * @desc Register a new admin
 * @access Public
 */
router.post('/register', registerAdmin);

/**
 * @route POST /api/admin/login
 * @desc Admin login
 * @access Public
 */
router.post('/login', loginAdmin);

export default router;
