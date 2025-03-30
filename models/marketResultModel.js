import mongoose from "mongoose";

const marketResultSchema = new mongoose.Schema(
  {
    marketId: {
      type: String,
      required: true,
      trim: true,
    },
    marketName: {
      type: String,
      required: true,
    },
    date: {
      type: String, // Format: "YYYY-MM-DD"
      required: true,
    },
    openNumber: String,
    closeNumber: String,
    openSingleDigit: Number,
    closeSingleDigit: Number,
    jodiResult: String,
    openSinglePanna: String,
    closeSinglePanna: String,
  },
  {
    timestamps: true, // Automatically creates `createdAt` & `updatedAt` fields
  }
);

const MarketResult =
  mongoose.models.MarketResult ||
  mongoose.model("MarketResult", marketResultSchema);

export default MarketResult;
