import multer from 'multer';
import cloudinary from 'cloudinary';
import fs from 'fs';
import dotenv from "dotenv";
import Transaction from '../models/transactionModel.js';
import User from '../models/userModel.js';

// Load environment variables from .env
dotenv.config();

// ✅ Cloudinary Configuration (Ensure ENV Variables are Set)
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Multer Storage for Files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Temporary local storage before Cloudinary upload
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// ✅ Validate File Type (Images & PDFs)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, PNG, and PDF allowed."), false);
  }
};

export const upload = multer({ storage, fileFilter });
export const uploadReceipt = upload.single("receipt");

export const addFundsRequest = async (req, res) => {
  console.log("📢 Incoming Add Funds Request:", req.body);

  const { transactionId, amount, type } = req.body; // ✅ Ensure `type` is included
  const userId = req.user;

  if (!transactionId || !amount || amount <= 0 || !type) {
    console.error("❌ Validation Error: Missing fields in request");
    return res.status(400).json({
      message: "Transaction ID, amount, and type (deposit/withdrawal) are required."
    });
  }

  try {
    // ✅ Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    console.log("✅ User Found:", user.email);

    let receiptUrl = null;

    if (req.file) {
      try {
        console.log("📢 Uploading File to Cloudinary:", req.file.path);

        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "wallet_receipts",
          use_filename: true,
          unique_filename: false,
          resource_type: "auto",
        });

        receiptUrl = result.secure_url;
        console.log("✅ Upload Successful:", receiptUrl);

        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("❌ Cloudinary Upload Error:", uploadError);
        return res.status(500).json({ message: "Failed to upload receipt.", error: uploadError.message });
      }
    }

    // ✅ Create Transaction
    const transaction = new Transaction({
      user: userId,
      amount,
      transactionId,
      receiptUrl,
      status: "pending",
      type, // ✅ Ensure type (deposit/withdrawal) is saved
    });

    await transaction.save();

    // ✅ Link Transaction to User
    user.transactions.push(transaction._id);
    await user.save();

    res.status(201).json({ message: "Transaction request submitted successfully.", transaction });
  } catch (error) {
    console.error("❌ Error processing transaction:", error);
    res.status(500).json({ message: "Server error while processing transaction.", error: error.message });
  }
};



// ✅ Get Wallet Balance
export const getWalletBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user).select('walletBalance');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.status(200).json({ walletBalance: user.walletBalance });
  } catch (error) {
    console.error('Get Wallet Balance Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching wallet balance.' });
  }
};

// ✅ Get Transactions
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user }).sort({ createdAt: -1 });
    res.status(200).json({ transactions });
  } catch (error) {
    console.error('Get Transactions Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching transactions.' });
  }
};

// ✅ Verify Transaction (Handles Deposit & Withdrawal)
export const verifyRequest = async (req, res) => {
  const { transactionId, status } = req.body;

  if (!transactionId || !status) {
    return res.status(400).json({ message: 'Transaction ID and status are required.' });
  }

  try {
    console.log("📢 Incoming Verify Request:", { transactionId, status });

    // ✅ Find the transaction by ID
    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      console.log("❌ Transaction Not Found");
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    // ✅ Find User
    const user = await User.findById(transaction.user);
    if (!user) {
      console.log("❌ User Not Found for Transaction:", transactionId);
      return res.status(404).json({ message: 'User associated with the transaction not found.' });
    }

    console.log("✅ User Found:", user.email);
    console.log("💰 User Current Balance:", user.walletBalance);

    if (status === 'approved') {
      if (transaction.type === 'deposit') {
        // ✅ Deposit: Add to wallet balance
        user.walletBalance += transaction.amount;
        console.log(`💲 Depositing ${transaction.amount} to user wallet`);
      } else if (transaction.type === 'withdrawal') {
        // ✅ Withdrawal: Subtract from wallet balance (only if sufficient balance)
        if (user.walletBalance < transaction.amount) {
          console.log("❌ Insufficient Balance for Withdrawal");
          return res.status(400).json({ message: "Insufficient balance for withdrawal." });
        }
        user.walletBalance -= transaction.amount;
        console.log(`💲 Withdrawing ${transaction.amount} from user wallet`);
      }
      await user.save();
    }

    // ✅ Update Transaction Status
    transaction.status = status;
    transaction.isSuccessful = status === 'approved';
    await transaction.save();

    console.log(`✅ Transaction ${status.toUpperCase()} Successfully!`);
    res.status(200).json({
      message: `Transaction ${status} successfully.`,
      transaction,
    });
  } catch (error) {
    console.error('❌ Error verifying transaction:', error);
    res.status(500).json({ message: 'Server error while verifying the transaction.', error: error.message });
  }
};

