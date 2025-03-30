import mongoose from 'mongoose';

const winSchema = new mongoose.Schema(
  {
    winId: {
      type: String,
      required: true,
      unique: true, // Ensures unique ID for each win record
      trim: true, // Removes unnecessary spaces
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // Links the win to a specific user
    },
    market: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Market',
      required: true, // Links the win to a specific market
    },
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true, // Links the win to a specific game
    },
    bet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bet',
      required: true, // Links the win to the associated bet
    },
    winningAmount: {
      type: Number,
      required: true, // The amount the user won
      min: [1, 'Winning amount must be at least 1'], // Ensures a valid winning amount
    },
    createdAt: {
      type: Date,
      default: Date.now, // Automatically sets creation time
    },
    updatedAt: {
      type: Date,
      default: Date.now, // Tracks the last update
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Middleware to auto-update 'updatedAt' on save
winSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Win = mongoose.models.Win || mongoose.model('Win', winSchema);

export default Win;
