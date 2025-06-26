import User from '../models/userModel.js';
import Bet from '../models/betModel.js';
import Market from '../models/marketModel.js';
import Transaction from '../models/transactionModel.js';
import Admin from '../models/adminModel.js';
import WinningRatio from '../models/winningRatioModel.js';
import PlatformSettings from "../models/platformSettingsModel.js";
import { storeMarketResult } from './marketResultController.js';
import cloudinary from "cloudinary";
import multer from 'multer';
import dotenv from "dotenv";
import bcrypt from 'bcryptjs';

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
export const upload = multer({ storage }).fields([
  { name: 'qrCode', maxCount: 1 },
  { name: 'bannerImage', maxCount: 1 },
]);

// ✅ 1. Get Users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

// ✅ 2. Add User
export const addUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({ message: 'User added successfully.', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error while adding user.' });
  }
};

// ✅ 3. Delete User
export const deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ message: 'User deleted successfully.', user: deletedUser });
  } catch (error) {
    console.error('❌ Error deleting user:', error.message);
    res.status(500).json({ message: 'Server error while deleting user.' });
  }
};

// ✅ 4. Add Market
export const addMarket = async (req, res) => {
  const { name, openTime, closeTime, isBettingOpen } = req.body;

  if (!name || !openTime || !closeTime) {
    return res.status(400).json({ message: 'Name, openTime, and closeTime are required.' });
  }

  try {
    const existingMarket = await Market.findOne({ name });
    if (existingMarket) {
      return res.status(400).json({ message: 'Market with this name already exists.' });
    }

    const marketId = `MKT-${Date.now()}`;
    const market = new Market({
      name,
      marketId,
      openTime,
      closeTime,
      isBettingOpen: isBettingOpen !== undefined ? isBettingOpen : false
    });

    await market.save();
    res.status(201).json({ message: 'Market added successfully', market });
  } catch (error) {
    res.status(500).json({ message: 'Server error while adding market.' });
  }
};

// ✅ 5. Declare Result
export const declareResult = async (req, res) => {
  const { marketId, openResult, closeResult } = req.body;

  if (!marketId || !openResult || !closeResult) {
    return res.status(400).json({ message: 'Market ID, Open Result, and Close Result are required.' });
  }

  try {
    const market = await Market.findOne({ marketId });
    if (!market) return res.status(404).json({ message: 'Market not found.' });

    const openDigits = openResult.split('').map(Number);
    const closeDigits = closeResult.split('').map(Number);

    const openSingleDigit = openDigits.reduce((sum, d) => sum + d, 0) % 10;
    const closeSingleDigit = closeDigits.reduce((sum, d) => sum + d, 0) % 10;
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

    const resultDate = req.body.date ? new Date(req.body.date) : new Date();
    try {
      storeMarketResult(market, resultDate, openResult, closeResult);
    } catch (err) {
      console.error("❌ Failed to store result:", err.message);
    }

    res.status(200).json({ message: 'Results declared successfully!', market: updatedMarket });
  } catch (error) {
    res.status(500).json({ message: 'Server error while declaring result.' });
  }
};

// ✅ 6. Reset Market Result
export const resetMarketResult = async (req, res) => {
  const { marketId } = req.body;

  if (!marketId) return res.status(400).json({ message: 'Market ID is required.' });

  try {
    const market = await Market.findOne({ marketId });
    if (!market) return res.status(404).json({ message: 'Market not found.' });

    const resetFields = {
      openNumber: 'xxx',
      closeNumber: 'xxx',
      openSingleDigit: 'x',
      closeSingleDigit: 'x',
      jodiResult: 'xx',
      openSinglePanna: 'xxx',
      closeSinglePanna: 'xxx',
    };

    const updatedMarket = await Market.findOneAndUpdate(
      { marketId },
      { results: resetFields },
      { new: true }
    );

    res.status(200).json({
      message: 'Market result reset to default.',
      market: updatedMarket
    });
  } catch (error) {
    console.error('❌ Error resetting result:', error.message);
    res.status(500).json({ message: 'Server error while resetting result.' });
  }
};

// ✅ 7. Delete Bet
export const deleteBet = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedBet = await Bet.findByIdAndDelete(id);

    if (!deletedBet) {
      return res.status(404).json({ message: 'Bet not found.' });
    }

    res.status(200).json({ message: 'Bet deleted successfully.' });
  } catch (error) {
    console.error('❌ Error deleting bet:', error.message);
    res.status(500).json({ message: 'Server error while deleting bet.' });
  }
};

// ✅ 8. Delete Market
export const deleteMarket = async (req, res) => {
  const { marketId } = req.params;

  try {
    const deletedMarket = await Market.findOneAndDelete({ marketId });

    if (!deletedMarket) {
      return res.status(404).json({ message: 'Market not found.' });
    }

    res.status(200).json({ message: 'Market deleted successfully.', market: deletedMarket });
  } catch (error) {
    console.error('❌ Error deleting market:', error.message);
    res.status(500).json({ message: 'Server error while deleting market.' });
  }
};

// ✅ 9. Get Platform Settings
export const getPlatformSettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.findOne();
    if (!settings) {
      return res.status(404).json({ message: 'Platform settings not found.' });
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching platform settings.' });
  }
};

// ✅ 10. Update Platform Settings
export const updatePlatformSettings = async (req, res) => {
  try {
    let updateFields = {};

    if (req.body.upiId) updateFields.upiId = req.body.upiId.trim();
    if (req.body.whatsAppNumber) updateFields.whatsAppNumber = req.body.whatsAppNumber;

    if (req.body.adminContact) {
      try {
        updateFields.adminContact =
          typeof req.body.adminContact === 'string'
            ? JSON.parse(req.body.adminContact)
            : req.body.adminContact;
      } catch (error) {
        return res.status(400).json({ message: 'Invalid adminContact format.' });
      }
    }

    if (req.files && req.files.qrCode) {
      const uploadQR = await new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
          if (error) reject(error);
          else resolve(result.url);
        }).end(req.files.qrCode[0].buffer);
      });

      if (uploadQR) updateFields.qrCodeUrl = uploadQR;
    }

    if (req.files && req.files.bannerImage) {
      const uploadBanner = await new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
          if (error) reject(error);
          else resolve(result.url);
        }).end(req.files.bannerImage[0].buffer);
      });

      if (uploadBanner) updateFields.bannerImageUrl = uploadBanner;
    }

    const settings = await PlatformSettings.findOneAndUpdate(
      {},
      { $set: updateFields },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: 'Platform settings updated.', settings });
  } catch (error) {
    res.status(500).json({ message: 'Error while updating platform settings.' });
  }
};
export const editBet = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedBet = await Bet.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedBet) {
      return res.status(404).json({ message: 'Bet not found.' });
    }

    res.status(200).json({ message: 'Bet updated successfully.', bet: updatedBet });
  } catch (error) {
    console.error('❌ Error updating bet:', error.message);
    res.status(500).json({ message: 'Server error while updating bet.' });
  }
};
