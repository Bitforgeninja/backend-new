import mongoose from 'mongoose';

const betSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    marketName: {
      type: String,
      required: true,
    },
    gameName: {
      type: String,
      required: true,
    },
    number: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Bet amount must be at least 1'],
    },
    winningRatio: {
      type: Number,
      required: true,
    },
    betType: {
      type: String,
      enum: ['Open', 'Close'], // Only allow 'Open' or 'Close'
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'won', 'lost'],
      default: 'pending',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Bet = mongoose.models.Bet || mongoose.model('Bet', betSchema);

export default Bet;
