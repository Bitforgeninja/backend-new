import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Register a new user
export const registerUser = async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;

  try {
    // Validate input
    // if (!name || !email || !password || !phoneNumber) {
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    // Create and save the user (raw password will be hashed by pre('save'))
    const user = new User({ 
      name, 
      email, 
      password, 
      phoneNumber, 
      walletBalance: 0, 
      transactions: [], 
      bets: [], 
      wins: [] 
    });
    await user.save();

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Respond with success
    res.status(201).json({
      message: 'User registered successfully.',
      user: { id: user._id, name: user.name, email: user.email, phoneNumber: user.phoneNumber },
      token,
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'An unexpected error occurred during registration.' });
  }
};

// Login a user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Respond with success
    res.status(200).json({
      message: 'Login successful.',
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        phoneNumber: user.phoneNumber, 
        walletBalance: user.walletBalance 
      },
      token,
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'An unexpected error occurred during login.' });
  }
};

// Fetch user details
export const getUserDetails = async (req, res) => {
  try {
    // Fetch user by ID from `req.user` (set by the auth middleware)
    const user = await User.findById(req.user)
      .populate('transactions') // Populate transactions
      .populate('bets')         // Populate bets
      .populate('wins')         // Populate wins
      .select('-password');     // Exclude password from response

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Return the user details
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      walletBalance: user.walletBalance,
      transactions: user.transactions,
      bets: user.bets,
      wins: user.wins,
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'An unexpected error occurred while fetching user details.' });
  }
};


