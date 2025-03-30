import User from '../models/userModel.js';
import Bet from '../models/betModel.js';
import Market from '../models/marketModel.js';
import Transaction from '../models/transactionModel.js';
import Admin from '../models/adminModel.js'; // Ensure the path is correct
import WinningRatio from '../models/winningRatioModel.js';
import PlatformSettings from "../models/platformSettingsModel.js";
import { storeMarketResult } from './marketResultController.js';
import cloudinary from "cloudinary";
import multer from 'multer';
import dotenv from "dotenv";
import bcrypt from 'bcryptjs';


// Fetch all users
export const getUsers = async (req, res) => {
  try {
    // Fetch all users, excluding sensitive fields like password
    const users = await User.find().select('-password');
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

// Edit a bet
export const editBet = async (req, res) => {
  const { id } = req.params;
  const { marketName, gameName, number, amount, winningRatio, status } = req.body;

  // Validate required fields
  if (!marketName || !gameName || number === undefined || !amount || !winningRatio || !status) {
    return res.status(400).json({ message: 'All fields are required for editing a bet.' });
  }

  try {
    const updatedBet = await Bet.findByIdAndUpdate(
      id,
      { marketName, gameName, number, amount, winningRatio, status },
      { new: true, runValidators: true }
    );

    if (!updatedBet) {
      return res.status(404).json({ message: 'Bet not found' });
    }

    res.status(200).json({ message: 'Bet updated successfully', bet: updatedBet });
  } catch (error) {
    console.error('Error updating bet:', error.message);
    res.status(500).json({ message: 'Server error while updating bet' });
  }
};

/**
 * @desc    Add funds to a user's wallet by email
 * @route   PUT /api/admin/users/:email/add-funds/:amount
 * @access  Admin
 */
/**export const addFundsByAdmin = async (req, res) => {
  const { email, amount } = req.body; // Extract email and amount from request body

  // Validate input
  if (!email || !amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid email or amount. Amount must be greater than 0.' });
  }

  // Validate email format
  if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }

  try {
    // Find the user by email (case-insensitive)
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (!user) {
      return res.status(404).json({ message: `User with email ${email} not found.` });
    }

    // Add funds to the user's wallet
    user.walletBalance += parseFloat(amount);
    await user.save();

    // Create a new transaction record
    const transaction = new Transaction({
      user: user._id,
      amount,
      transactionId: `ADMIN-${Date.now()}`,
      receiptUrl: null,
      status: 'approved',
      isSuccessful: true
    });

    await transaction.save();

    // Link the transaction to the user
    user.transactions.push(transaction._id);
    await user.save();

    res.status(200).json({
      message: `Successfully added ${amount} to ${user.name}'s wallet.`,
      walletBalance: user.walletBalance,
      transaction,
    });
  } catch (error) {
    console.error('Error adding funds:', error.message);
    res.status(500).json({ message: 'Server error while adding funds.' });
  }
};
**/

// Add a new market
export const addMarket = async (req, res) => {
  const { name, openTime, closeTime, isBettingOpen } = req.body;

  // Validate input
  if (!name || !openTime || !closeTime) {
    return res.status(400).json({ message: 'Name, openTime, and closeTime are required.' });
  }

  try {
    // Check if a market with the same name already exists
    const existingMarket = await Market.findOne({ name });
    if (existingMarket) {
      return res.status(400).json({ message: 'Market with this name already exists.' });
    }

    // Generate a unique market ID
    const marketId = `MKT-${Date.now()}`;

    // Create a new market
    const market = new Market({
      name,
      marketId, // Automatically set the market ID
      openTime,
      closeTime,
      isBettingOpen: isBettingOpen !== undefined ? isBettingOpen : false, // Default to true if not provided
    });

    await market.save();

    res.status(201).json({ message: 'Market added successfully', market });
  } catch (error) {
    console.error('Error adding market:', error.message);
    res.status(500).json({ message: 'Server error while adding market.' });
  }
};

export const declareResult = async (req, res) => {
  const { marketId, openResult, closeResult } = req.body;

  if (!marketId || !openResult || !closeResult) {
    return res.status(400).json({ message: 'Market ID, Open Result, and Close Result are required.' });
  }

  try {
    console.log('📢 Market ID:', marketId);

    const market = await Market.findOne({ marketId });

    if (!market) {
      return res.status(404).json({ message: 'Market not found.' });
    }

    console.log('✅ Market Found:', market.name);

    const openDigits = openResult.split('').map(Number);
    const closeDigits = closeResult.split('').map(Number);

    const openSingleDigit = openDigits.reduce((sum, digit) => sum + digit, 0) % 10;
    const closeSingleDigit = closeDigits.reduce((sum, digit) => sum + digit, 0) % 10;

    const jodiResult = `${openSingleDigit}${closeSingleDigit}`;

    const openSinglePanna = openResult;
    const closeSinglePanna = closeResult;

    const updatedMarket = await Market.findOneAndUpdate(
      { marketId },
      {
        results: {
          openNumber: openResult,
          closeNumber: closeResult,
          openSingleDigit,
          closeSingleDigit,
          jodiResult,
          openSinglePanna,
          closeSinglePanna,
        },
        isBettingOpen: false,
      },
      { new: true }
    );

    console.log('✅ Market Results Updated in Database');

    const winningBets = await Bet.find({ marketName: market.name, status: 'pending' });
    console.log('📢 Total Pending Bets:', winningBets.length);

    for (const bet of winningBets) {
      let isWinner = false;

      switch (bet.gameName) {  // Use gameName to determine the logic
        case 'Single Digit':
          if (bet.betType === 'Open') {
            isWinner = parseInt(bet.number) === openSingleDigit;
          } else if (bet.betType === 'Close') {
            isWinner = parseInt(bet.number) === closeSingleDigit;
          }
          break;
  
        case 'Jodi':
          isWinner = bet.number === jodiResult;
          break;
  
        case 'Single Panna':
          if (bet.betType === 'Open') {
            isWinner = bet.number === openSinglePanna;
          } else if (bet.betType === 'Close') {
            isWinner = bet.number === closeSinglePanna;
          }
          break;
  
        case 'Double Panna':
          const betNumberStr = bet.number;
          const openPannaStr = openSinglePanna;
          const closePannaStr = closeSinglePanna;
  
          if (bet.betType === 'Open') {
            isWinner = betNumberStr === openPannaStr && isDoublePanna(betNumberStr);
          } else if (bet.betType === 'Close') {
            isWinner = betNumberStr === closePannaStr && isDoublePanna(betNumberStr);
          }
          break;
  
        case 'Triple Panna':
          const betTripleNumberStr = bet.number;
          const openTriplePannaStr = openSinglePanna;
          const closeTriplePannaStr = closeSinglePanna;
  
          if (bet.betType === 'Open') {
            isWinner = betTripleNumberStr === openTriplePannaStr && isTriplePanna(betTripleNumberStr);
          } else if (bet.betType === 'Close') {
            isWinner = betTripleNumberStr === closeTriplePannaStr && isTriplePanna(betTripleNumberStr);
          }
          break;

        case 'Half Sangam':
          let betPannaPart, betDigitPart;
  
          if (bet.number.includes('-')) {
            const parts = bet.number.split('-');
            if (parts.length === 2) {
              if (parts[0].length === 3 && parts[1].length === 1) {
                betPannaPart = parts[0];
                betDigitPart = parts[1];
              } else if (parts[0].length === 1 && parts[1].length === 3) {
                betDigitPart = parts[0];
                betPannaPart = parts[1];
              } else {
                console.log("Invalid Half Sangam bet format:", bet.number);
                break; // Skip this bet
              }
            } else {
              console.log("Invalid Half Sangam bet format:", bet.number);
              break; // Skip this bet
            }
          } else {
            console.log("Invalid Half Sangam bet format:", bet.number);
            break; // Skip this bet
          }
  
          const openDigits = market.results.openNumber.split('').map(Number);
          const closeDigits = market.results.closeNumber.split('').map(Number);
          const openDigitResult = openDigits.reduce((sum, digit) => sum + digit, 0) % 10;
          const closeDigitResult = closeDigits.reduce((sum, digit) => sum + digit, 0) % 10;
  
          const openPannaString = market.results.openSinglePanna;
          const closePannaString = market.results.closeSinglePanna;
  
          const hsaWinner = betPannaPart === openPannaString && betDigitPart === String(closeDigitResult);
          const hsbWinner = betPannaPart === closePannaString && betDigitPart === String(openDigitResult);
  
          isWinner = hsaWinner || hsbWinner;
          break;
  
        case 'Full Sangam':
          isWinner = bet.number === `${market.results.openSinglePanna}-${market.results.closeSinglePanna}`;
          break;
  
        default:
          break;
      }

      console.log(
        `🔎 Checking Bet: ${bet.number}, Game: ${bet.gameName}, Type: ${bet.betType}, Is Winner: ${isWinner}`
      );

      if (isWinner) {
        const reward = bet.amount * bet.winningRatio;
        const user = await User.findById(bet.user);

        if (user) {
          user.walletBalance += reward;
          await user.save();
          console.log(`✅ User ${user.email} won ${reward} points!`);
        }

        bet.status = 'won';
      } else {
        bet.status = 'lost';
      }
      await bet.save();
    }

    try {
      // ✅ Call the new function to store market results
      const resultDate = req.body.date ? new Date(req.body.date) : new Date();
      storeMarketResult(market, resultDate, openResult, closeResult);
      console.log("✅ Markets Results Stored Successfully")
    }
    catch {
      console.error("❌ Markets Results Stored Successfully")
    }

    res.status(200).json({
      message: 'Results declared and rewards distributed successfully!',
      market: updatedMarket,
    });
  } catch (error) {
    console.error('❌ Error declaring result:', error.message);
    res.status(500).json({ message: 'Server error while declaring result.' });
  }
};

const isDoublePanna = (number) => {
  if (number.length !== 3) return false;
  const [a, b, c] = number.split('');
  return (a === b && a !== c) || (a === c && a !== b) || (b === c && a !== b);
};

const isTriplePanna = (number) => {
  if (number.length !== 3) return false;
  const [a, b, c] = number.split('');
  return a === b && b === c;
};


/**
 * @desc Fetch all admins
 * @route GET /api/admin/admins
 * @access Private (Master Admin only)
 */
export const getAdmins = async (req, res) => {
  try {
    // Fetch all admins excluding sensitive fields like password
    const admins = await Admin.find().select('-password');

    if (!admins.length) {
      return res.status(404).json({ message: 'No admins found' });
    }

    res.status(200).json({ message: 'Admins fetched successfully', admins });
  } catch (error) {
    console.error('Error fetching admins:', error.message);
    res.status(500).json({ message: 'Server error while fetching admins' });
  }
};

// Fetch all transactions
export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('user', 'name email') // Populate user details (e.g., name and email)
      .sort({ createdAt: -1 }); // Sort transactions by most recent

    if (!transactions.length) {
      return res.status(404).json({ message: 'No transactions found' });
    }

    res.status(200).json({
      message: 'Transactions fetched successfully',
      transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    res.status(500).json({ message: 'Server error while fetching transactions' });
  }
};

// Fetch all bets
export const getAllBets = async (req, res) => {
  try {
    const bets = await Bet.find()
      .populate('user', 'name email') // Populate user details (e.g., name and email)
      .sort({ createdAt: -1 }); // Sort bets by most recent

    if (!bets.length) {
      return res.status(404).json({ message: 'No bets found' });
    }

    res.status(200).json({
      message: 'Bets fetched successfully',
      bets,
    });
  } catch (error) {
    console.error('Error fetching bets:', error.message);
    res.status(500).json({ message: 'Server error while fetching bets' });
  }
};

// Edit a market by marketId
export const editMarket = async (req, res) => {
  const { marketId } = req.params;
  const { name, openTime, closeTime, isBettingOpen } = req.body;

  try {
    // Find the market using marketId instead of _id
    const updatedMarket = await Market.findOneAndUpdate(
      { marketId }, // Match using marketId
      { name, openTime, closeTime, isBettingOpen }, // Update fields
      { new: true, runValidators: true } // Return updated document and validate input
    );

    if (!updatedMarket) {
      return res.status(404).json({ message: 'Market not found' });
    }

    res.status(200).json({
      message: 'Market updated successfully',
      market: updatedMarket,
    });
  } catch (error) {
    console.error('Error updating market:', error.message);
    res.status(500).json({ message: 'Server error while updating market' });
  }
};


export const getAllWinningRatios = async (req, res) => {
  try {
    const winningRatios = await WinningRatio.find();
    res.status(200).json({ winningRatios });
  } catch (error) {
    console.error('Error fetching winning ratios:', error.message);
    res.status(500).json({ message: 'Server error while fetching winning ratios' });
  }
};


export const updateWinningRatio = async (req, res) => {
  const { id } = req.params;
  const { ratio } = req.body;

  if (!ratio || ratio < 1) {
    return res.status(400).json({ message: 'Invalid ratio value' });
  }

  try {
    const updatedRatio = await WinningRatio.findByIdAndUpdate(
      id,
      { ratio },
      { new: true, runValidators: true }
    );

    if (!updatedRatio) {
      return res.status(404).json({ message: 'Winning ratio not found' });
    }

    res.status(200).json({ message: 'Winning ratio updated successfully', winningRatio: updatedRatio });
  } catch (error) {
    console.error('Error updating winning ratio:', error.message);
    res.status(500).json({ message: 'Server error while updating winning ratio' });
  }
};

// Delete Market
export const deleteMarket = async (req, res) => {
  const { marketId } = req.params;

  try {
    const deletedMarket = await Market.findOneAndDelete({ marketId });

    if (!deletedMarket) {
      return res.status(404).json({ message: 'Market not found' });
    }

    res.status(200).json({
      message: 'Market deleted successfully',
      market: deletedMarket,
    });
  } catch (error) {
    console.error('Error deleting market:', error.message);
    res.status(500).json({ message: 'Server error while deleting market' });
  }
};

//Delete Bet
export const deleteBet = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedBet = await Bet.findByIdAndDelete(id);

    if (!deletedBet) {
      return res.status(404).json({ message: 'Bet not found' });
    }

    res.status(200).json({
      message: 'Bet deleted successfully',
      bet: deletedBet,
    });
  } catch (error) {
    console.error('Error deleting bet:', error.message);
    res.status(500).json({ message: 'Server error while deleting bet' });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User deleted successfully',
      user: deletedUser,
    });
  } catch (error) {
    console.error('Error deleting user:', error.message);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
};

// ✅ Fetch Platform Settings
export const getPlatformSettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.findOne();
    if (!settings) {
      return res.status(404).json({ message: 'Platform settings not found.' });
    }
    res.status(200).json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error.message);
    res.status(500).json({ message: 'Server error while fetching platform settings.' });
  }
};

// Load environment variables from .env
dotenv.config();

// ✅ Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Multer Setup for File Uploads (Temporary Buffer Storage)
const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: 'qrCode', maxCount: 1 },
  { name: 'bannerImage', maxCount: 1 },
]);

// ✅ Update Platform Settings API
export const updatePlatformSettings = async (req, res) => {
  try {
    console.log('📢 Incoming Update Request:', req.body, req.files);
    let updateFields = {};

    // Handle updates for each field in the PlatformSettings model
    if (req.body.upiId) {
      updateFields.upiId = req.body.upiId.trim();
    }
    if (req.body.whatsAppNumber) { // Correctly handling WhatsApp Number update
      updateFields.whatsAppNumber = req.body.whatsAppNumber;
    } else if (req.body.whatsappNumber) { // Handling lowercase or incorrect field name variations
      updateFields.whatsAppNumber = req.body.whatsappNumber;
    }
    if (req.body.adminContact) {
      try {
        updateFields.adminContact =
          typeof req.body.adminContact === 'string'
            ? JSON.parse(req.body.adminContact)
            : req.body.adminContact;
      } catch (error) {
        return res.status(400).json({ message: 'Invalid adminContact format. Use a valid JSON object.' });
      }
    }

    // File handling for qrCodeUrl and bannerImageUrl using Cloudinary (assuming integration)
    if (req.files && req.files.qrCode) {
      const uploadedResponse = await cloudinary.v2.uploader.upload_stream({ resource_type: 'image' }, 
        function(error, result) {
          if (result) {
            return result.url;
          } else {
            console.error('Cloudinary upload error:', error);
            return null; // or handle differently
          }
        })(req.files.qrCode[0].buffer);
      if (uploadedResponse) {
        updateFields.qrCodeUrl = uploadedResponse;
      }
    }

    if (req.files && req.files.bannerImage) {
      const uploadedResponse = await cloudinary.v2.uploader.upload_stream({ resource_type: 'image' }, 
        function(error, result) {
          if (result) {
            return result.url;
          } else {
            console.error('Cloudinary upload error:', error);
            return null; // or handle differently
          }
        })(req.files.bannerImage[0].buffer);
      if (uploadedResponse) {
        updateFields.bannerImageUrl = uploadedResponse;
      }
    }

    // Update the settings in the database
    const settings = await PlatformSettings.findOneAndUpdate(
      {},
      { $set: updateFields },
      { new: true, upsert: true }
    );

    console.log('✅ Updated Platform Settings:', settings);
    res.status(200).json({ message: 'Platform settings updated successfully!', settings });
  } catch (error) {
    console.error('❌ Error updating platform settings:', error.message);
    res.status(500).json({ message: 'Server error while updating platform settings.' });
  }
};



/**
 * @desc   Admin adds a new user
 * @route  POST /api/admin/users/add
 * @access Admin
 */
export const addUser = async (req, res) => {
  const { name, email, password, phoneNumber, walletBalance } = req.body;

  // Basic validation
  if (!name || !email || !password || !phoneNumber) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password before storing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      walletBalance: walletBalance || 0, // Default to 0 if not provided
    });

    // Save user to database
    await newUser.save();

    res.status(201).json({
      message: "User added successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        walletBalance: newUser.walletBalance,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Error adding user:", error.message);
    res.status(500).json({ message: "Server error while adding user" });
  }
};

// Controller to update open results for a market
export const publishOpenResults = async (req, res) => {
  const { marketId, openResult } = req.body;

  if (!marketId || !openResult) {
    return res.status(400).json({ message: 'Market ID and Open Result are required.' });
  }

  try {
    console.log('📢 Market ID:', marketId);

    const market = await Market.findOne({ marketId });

    if (!market) {
      return res.status(404).json({ message: 'Market not found.' });
    }

    console.log('✅ Market Found:', market.name);

    const openDigits = openResult.split('').map(Number);
    const openSingleDigit = openDigits.reduce((sum, digit) => sum + digit, 0) % 10;
    const jodiResult = openSingleDigit // Assumes the first two digits form the Jodi result

    const updatedMarket = await Market.findOneAndUpdate(
      { marketId },
      {
        results: {
          openNumber: openResult,
          openSingleDigit: openSingleDigit,
          jodiResult: jodiResult,
          openSinglePanna: openResult // Panna is typically the same as the result unless specified otherwise
        },
        isBettingOpen: true // Assuming you still want to control betting open status here
      },
      { new: true }
    );

    console.log('✅ Market Open Results Updated in Database');

    res.status(200).json({
      message: 'Open results published successfully',
      market: updatedMarket
    });
  } catch (error) {
    console.error('❌ Error updating market open results:', error);
    res.status(500).json({ message: 'Server error while updating open results' });
  }
};
