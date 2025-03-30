import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema(
  {
    gameId: {
      type: String,
      required: true,
      unique: true, // Ensures each game has a unique ID
      trim: true, // Removes unnecessary spaces
    },
    market: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Market',
      required: true, // Links the game to a specific market
    },
    gameName: {
      type: String,
      required: true, // Name of the game (e.g., Single Digit, Jodi, etc.)
      trim: true,
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
gameSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Game = mongoose.models.Game || mongoose.model('Game', gameSchema);

export default Game;
