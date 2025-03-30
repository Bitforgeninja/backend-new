import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"], // ✅ Ensures every transaction is linked to a user
    },
    amount: {
      type: Number,
      required: [true, "Transaction amount is required"],
      min: [1, "Amount must be at least 1"], // ✅ Validates the transaction amount
    },
    transactionId: {
      type: String,
      required: [true, "Transaction ID is required"],
      unique: true, // ✅ Ensures no duplicate transactions
      trim: true,
    },
    type: {
      type: String,
      enum: ["deposit", "withdrawal"], // ✅ Differentiates deposits from withdrawals
      required: [true, "Transaction type (deposit/withdrawal) is required"],
    },
    receiptUrl: {
      type: String,
      default: null, // ✅ Optional receipt URL (only for deposits)
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending", // ✅ Default to pending
    },
    isSuccessful: {
      type: Boolean,
      default: false, // ✅ Automatically updates based on `status`
    },
    processedAt: {
      type: Date,
      default: null, // ✅ Stores the date when status changes to approved/rejected
    },
    paymentMethod: {
      type: String,
      enum: ["UPI", "Bank Transfer", "Cash", "Crypto"], // ✅ Expandable for future methods
      default: "UPI",
    },
  },
  {
    timestamps: true, // ✅ Adds `createdAt` and `updatedAt` automatically
  }
);

// ✅ Middleware: Auto-update `isSuccessful` and `processedAt` on status change
transactionSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.isSuccessful = this.status === "approved";
    this.processedAt = this.status !== "pending" ? new Date() : null;
  }
  next();
});

const Transaction =
  mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);

export default Transaction;
