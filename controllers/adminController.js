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
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      walletBalance: walletBalance || 0,
    });

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
    res.status(500).json({ message: "Server error while adding user" });
  }
};

export const deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'User deleted successfully', user: deletedUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting user' });
  }
};

export const editBet = async (req, res) => {
  const { id } = req.params;
  const { marketName, gameName, number, amount, winningRatio, status } = req.body;

  if (!marketName || !gameName || number === undefined || !amount || !winningRatio || !status) {
    return res.status(400).json({ message: 'All fields are required for editing a bet.' });
  }

  try {
    const updatedBet = await Bet.findByIdAndUpdate(
      id,
      { marketName, gameName, number, amount, winningRatio, status },
      { new: true, runValidators: true }
    );

    if (!updatedBet) return res.status(404).json({ message: 'Bet not found' });

    res.status(200).json({ message: 'Bet updated successfully', bet: updatedBet });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating bet' });
  }
};

export const getAllBets = async (req, res) => {
  try {
    const bets = await Bet.find().populate('user', 'name email').sort({ createdAt: -1 });
    if (!bets.length) return res.status(404).json({ message: 'No bets found' });

    res.status(200).json({ message: 'Bets fetched successfully', bets });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching bets' });
  }
};

export const deleteBet = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedBet = await Bet.findByIdAndDelete(id);
    if (!deletedBet) return res.status(404).json({ message: 'Bet not found' });

    res.status(200).json({ message: 'Bet deleted successfully', bet: deletedBet });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting bet' });
  }
};

export const getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    if (!admins.length) return res.status(404).json({ message: 'No admins found' });

    res.status(200).json({ message: 'Admins fetched successfully', admins });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching admins' });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    if (!transactions.length) {
      return res.status(404).json({ message: 'No transactions found' });
    }

    res.status(200).json({ message: 'Transactions fetched successfully', transactions });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching transactions' });
  }
};

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

export const editMarket = async (req, res) => {
  const { marketId } = req.params;
  const { name, openTime, closeTime, isBettingOpen } = req.body;

  try {
    const updatedMarket = await Market.findOneAndUpdate(
      { marketId },
      { name, openTime, closeTime, isBettingOpen },
      { new: true, runValidators: true }
    );

    if (!updatedMarket) return res.status(404).json({ message: 'Market not found' });

    res.status(200).json({ message: 'Market updated successfully', market: updatedMarket });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating market' });
  }
};

export const deleteMarket = async (req, res) => {
  const { marketId } = req.params;

  try {
    const deletedMarket = await Market.findOneAndDelete({ marketId });

    if (!deletedMarket) {
      return res.status(404).json({ message: 'Market not found.' });
    }

    res.status(200).json({
      message: 'Market deleted successfully',
      market: deletedMarket,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting market.' });
  }
};

export const getAllWinningRatios = async (req, res) => {
  try {
    const winningRatios = await WinningRatio.find();
    res.status(200).json({ winningRatios });
  } catch (error) {
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
    res.status(500).json({ message: 'Server error while updating winning ratio' });
  }
};

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
      const uploadedQR = await new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream({ resource_type: 'image' }, (err, result) => {
          if (err) return reject(err);
          resolve(result.url);
        }).end(req.files.qrCode[0].buffer);
      });

      updateFields.qrCodeUrl = uploadedQR;
    }

    if (req.files && req.files.bannerImage) {
      const uploadedBanner = await new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream({ resource_type: 'image' }, (err, result) => {
          if (err) return reject(err);
          resolve(result.url);
        }).end(req.files.bannerImage[0].buffer);
      });

      updateFields.bannerImageUrl = uploadedBanner;
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
