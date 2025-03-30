import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import bcrypt from 'bcrypt';

// Update user details, including wallet balance
export const updateUserDetails = async (req, res) => {
  const { id } = req.params;
  const { name, email, phoneNumber, walletBalance } = req.body;

  try {
    // Find the user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if they are provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (walletBalance !== undefined && walletBalance >= 0) {
      user.walletBalance = walletBalance;
    }

    // Save the updated user
    const updatedUser = await user.save();

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user details:', error);
    res.status(500).json({ message: 'Server error while updating user details' });
  }
};


// Fetch user profile
export const getUserProfile = async (req, res) => {
  try {
    // `req.user` is populated by the auth middleware with the user ID from the token
    const user = await User.findById(req.user).select('-password'); // Exclude password from response

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      walletBalance: user.walletBalance,
      transactions: user.transactions, // Includes related transactions
      bets: user.bets, // Includes related bets
      wins: user.wins, // Includes related wins
    });
  } catch (error) {
    console.error('Error fetching user profile:', error.message);
    res.status(500).json({ message: 'Server error while fetching user profile.' });
  }
};


// export const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;

//     // ✅ Find user by email
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ message: "User not found" });

//     // ✅ Generate reset token
//     const resetToken = crypto.randomBytes(20).toString("hex");
//     user.resetPasswordToken = resetToken;
//     user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiry

//     await user.save();

//     // ✅ Send reset email
//     // In your forgotPassword controller
//     const resetUrl = `https://matka-betting-consumer-hazel.vercel.app/reset-password/${resetToken}`;

//     const message = `Click the link to reset your password: ${resetUrl}`;

//     await sendEmail(user.email, "Password Reset", message);

//     res.json({ message: "Password reset email sent" });
//   } catch (error) {
//     console.error("Error in forgot password:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// };


// export const resetPassword = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { newPassword } = req.body;
//     console.log("New password received:", newPassword); // <-- temporary log

//     const user = await User.findOne({
//       resetPasswordToken: token,
//       resetPasswordExpires: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({ message: "Invalid or expired token" });
//     }

//     // Set the new password
//     user.password = newPassword;
//     // You can remove markModified for a string field; Mongoose detects changes automatically.
//     // user.markModified('password');

//     // Clear the reset token fields
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpires = undefined;

//     // Save the user - this will trigger the pre-save hook
//     await user.save();

//     console.log("User password updated:", user.password); // <-- log to inspect updated hash
//     return res.json({ message: "Password reset successful" });
//   } catch (error) {
//     console.error("Error resetting password:", error);
//     if (!res.headersSent) {
//       return res.status(500).json({ error: "Server error" });
//     }
//   }
// };




export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No user found with that email" });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Set reset token and expiration (1 hour)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour in ms

    await user.save();

    // Construct reset URL (adjust as needed for your frontend)
    const resetUrl = `https://matka-betting-consumer-hazel.vercel.app/reset-password/${resetToken}`;

    // Email message content
    const message =
      `You are receiving this email because you (or someone else) requested a password reset for your account.\n\n` +
      `Please click on the following link, or paste it into your browser, to complete the process within one hour:\n\n` +
      `${resetUrl}\n\n` +
      `If you did not request this, please ignore this email and your password will remain unchanged.`;

    await sendEmail(user.email, "Password Reset", message);


    res.status(200).json({ message: "Reset email sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  try {
    // Find the user with the matching token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Update the password and clear reset fields
    user.password = newPassword; // This will be hashed by the pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};