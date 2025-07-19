import User from '../models/userModel.js';
import Bet from '../models/betModel.js';
import Market from '../models/marketModel.js';
import Transaction from '../models/transactionModel.js';
import Admin from '../models/adminModel.js';
import WinningRatio from '../models/winningRatioModel.js';
import PlatformSettings from '../models/platformSettingsModel.js';
import { storeMarketResult } from './marketResultController.js';
import cloudinary from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

// ✅ Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ✅ Multer for in-memory file upload
const storage = multer.memoryStorage();
export const upload = multer({ storage }).fields([
  { name: 'qrCode', maxCount: 1 },
  { name: 'bannerImage', maxCount: 1 }
]);

// ✅ Users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

export const addUser = async (req, res) => {
  const { name, email, password, phoneNumber, walletBalance } = req.body;

  if (!name || !email || !password || !phoneNumber) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      walletBalance: walletBalance || 0
    });

    await newUser.save();

    res.status(201).json({
      message: 'User added successfully',
      user: newUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while adding user' });
  }
};

export const deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully', deletedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
};

// ✅ Bets
export const editBet = async (req, res) => {
  const { id } = req.params;
  const { marketName, gameName, number, amount, winningRatio, status } = req.body;

  if (!marketName || !gameName || number === undefined || !amount || !winningRatio || !status) {
    return res.status(400).json({ message: 'All fields are required.' });
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

    res.status(200).json({ message: 'Bet updated', bet: updatedBet });
  } catch (error) {
    res.status(500).json({ message: 'Error updating bet' });
  }
};

export const getAllBets = async (req, res) => {
  try {
    const bets = await Bet.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ message: 'Bets fetched successfully', bets });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bets' });
  }
};

export const deleteBet = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedBet = await Bet.findByIdAndDelete(id);
    if (!deletedBet) {
      return res.status(404).json({ message: 'Bet not found' });
    }

    res.status(200).json({ message: 'Bet deleted', bet: deletedBet });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting bet' });
  }
};

// ✅ Admins
export const getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.status(200).json({ message: 'Admins fetched successfully', admins });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admins' });
  }
};

// ✅ Transactions
export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ message: 'Transactions fetched successfully', transactions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

// ✅ Markets
export const addMarket = async (req, res) => {
  const { name, openTime, closeTime, isBettingOpen } = req.body;

  if (!name || !openTime || !closeTime) {
    return res.status(400).json({ message: 'Name, openTime, and closeTime are required.' });
  }

  try {
    const existing = await Market.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Market with this name already exists.' });

    const market = new Market({
      name,
      marketId: `MKT-${Date.now()}`,
      openTime,
      closeTime,
      isBettingOpen: isBettingOpen ?? true,
    });

    await market.save();

    res.status(201).json({ message: 'Market added successfully', market });
  } catch (error) {
    res.status(500).json({ message: 'Server error while adding market.' });
  }
};

export const editMarket = async (req, res) => {
  const { marketId } = req.params;
  const { name, openTime, closeTime, isBettingOpen } = req.body;

  try {
    const updated = await Market.findOneAndUpdate(
      { marketId },
      { name, openTime, closeTime, isBettingOpen },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Market not found' });

    res.status(200).json({ message: 'Market updated successfully', market: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error updating market' });
  }
};

export const deleteMarket = async (req, res) => {
  const { marketId } = req.params;

  try {
    const deleted = await Market.findOneAndDelete({ marketId });

    if (!deleted) return res.status(404).json({ message: 'Market not found' });

    res.status(200).json({ message: 'Market deleted successfully', market: deleted });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting market' });
  }
};

export const declareResult = async (req, res) => {
  const { marketId, openResult, closeResult } = req.body;

  if (!marketId || !openResult || !closeResult) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const market = await Market.findOne({ marketId });
    if (!market) return res.status(404).json({ message: 'Market not found.' });

    const openDigits = openResult.split('').map(Number);
    const closeDigits = closeResult.split('').map(Number);

    const openSingleDigit = openDigits.reduce((a, b) => a + b, 0) % 10;
    const closeSingleDigit = closeDigits.reduce((a, b) => a + b, 0) % 10;

    const jodiResult = `${openSingleDigit}${closeSingleDigit}`;

    const updated = await Market.findOneAndUpdate(
      { marketId },
      {
        results: {
          openNumber: openResult,
          closeNumber: closeResult,
          openSingleDigit,
          closeSingleDigit,
          jodiResult,
          openSinglePanna: openResult,
          closeSinglePanna: closeResult
        },
        isBettingOpen: false
      },
      { new: true }
    );

    res.status(200).json({ message: 'Result declared.', market: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error declaring result.' });
  }
};

// ✅ RESET market result (UPDATED)
export const resetMarketResult = async (req, res) => {
  const { marketId } = req.body;

  try {
    const updated = await Market.findOneAndUpdate(
      { marketId },
      {
        results: {
          openNumber: '000',           // String
          closeNumber: '000',          // String
          openSingleDigit: 0,          // Number
          closeSingleDigit: 0,         // Number
          jodiResult: 0,               // Number
          openSinglePanna: '000',      // String
          closeSinglePanna: '000'      // String
        }
      },
      { new: true }
    );

    res.status(200).json({ message: 'Market result reset successfully.', market: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting market result.' });
  }
};

export const publishOpenResults = async (req, res) => {
  const { marketId, openResult } = req.body;

  if (!marketId || !openResult) {
    return res.status(400).json({ message: 'Market ID and openResult are required.' });
  }

  try {
    const digits = openResult.split('').map(Number);
    const openSingleDigit = digits.reduce((a, b) => a + b, 0) % 10;

    const updated = await Market.findOneAndUpdate(
      { marketId },
      {
        results: {
          openNumber: openResult,
          openSingleDigit,
          jodiResult: `${openSingleDigit}x`,
          openSinglePanna: openResult
        },
        isBettingOpen: true
      },
      { new: true }
    );

    res.status(200).json({ message: 'Open results published', market: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error publishing open result.' });
  }
};

// ✅ WINNING RATIOS
export const getAllWinningRatios = async (req, res) => {
  try {
    const ratios = await WinningRatio.find();
    res.status(200).json({ winningRatios: ratios });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching winning ratios' });
  }
};

export const updateWinningRatio = async (req, res) => {
  const { id } = req.params;
  const { ratio } = req.body;

  try {
    const updated = await WinningRatio.findByIdAndUpdate(id, { ratio }, { new: true });
    res.status(200).json({ message: 'Winning ratio updated', winningRatio: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error updating winning ratio' });
  }
};

// ✅ PLATFORM SETTINGS
export const getPlatformSettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.findOne();
    if (!settings) return res.status(404).json({ message: 'No settings found' });
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error getting settings' });
  }
};

export const updatePlatformSettings = async (req, res) => {
  try {
    let updateFields = {};

    if (req.body.upiId) updateFields.upiId = req.body.upiId.trim();
    if (req.body.whatsAppNumber) updateFields.whatsAppNumber = req.body.whatsAppNumber;

    if (req.body.adminContact) {
      updateFields.adminContact =
        typeof req.body.adminContact === 'string'
          ? JSON.parse(req.body.adminContact)
          : req.body.adminContact;
    }

    if (req.files && req.files.qrCode) {
      const file = req.files.qrCode[0];
      const url = await new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream({}, (err, result) => {
          if (err) reject(err);
          else resolve(result.url);
        }).end(file.buffer);
      });
      updateFields.qrCodeUrl = url;
    }

    if (req.files && req.files.bannerImage) {
      const file = req.files.bannerImage[0];
      const url = await new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream({}, (err, result) => {
          if (err) reject(err);
          else resolve(result.url);
        }).end(file.buffer);
      });
      updateFields.bannerImageUrl = url;
    }

    const settings = await PlatformSettings.findOneAndUpdate(
      {},
      { $set: updateFields },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: 'Settings updated', settings });
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings' });
  }
};

// ✅ 📢 New: Get all declared results for chart page
export const getAllMarketResults = async (req, res) => {
  try {
    const markets = await Market.find({
      'results.openNumber': { $ne: 'xxx' },
      'results.closeNumber': { $ne: 'xxx' }
    });

    const formatted = markets.map((market) => ({
      marketName: market.name,
      date: new Date(market.updatedAt).toISOString().slice(0, 10),
      openNumber: market.results.openNumber,
      closeNumber: market.results.closeNumber
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching market results', error });
  }
};
