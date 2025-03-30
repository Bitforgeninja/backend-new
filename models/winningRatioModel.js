import mongoose from 'mongoose';

const winningRatioSchema = new mongoose.Schema(
  {
    gameName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    ratio: {
      type: Number,
      required: true,
      min: [1, 'Winning ratio must be at least 1'],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

const WinningRatio = mongoose.models.WinningRatio || mongoose.model('WinningRatio', winningRatioSchema);

export default WinningRatio;
