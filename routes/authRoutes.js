import express from 'express';
import { check, validationResult } from 'express-validator';
import { registerUser, loginUser, getUserDetails} from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Validation middleware  
const validateRequest = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((validation) => validation.run(req)));
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules
const registerValidationRules = [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
];

const loginValidationRules = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists(),
];

// Register Route
router.post('/register', validateRequest(registerValidationRules), registerUser);

// Login Route
router.post('/login', validateRequest(loginValidationRules), loginUser);

// New Route: Fetch User Details
router.get('/user', auth, getUserDetails);

export default router;
