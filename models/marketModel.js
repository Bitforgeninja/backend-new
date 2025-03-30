import mongoose from 'mongoose';

const marketSchema = new mongoose.Schema({
  marketId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  openTime: {
    type: String,
    required: true,
  },
  closeTime: {
    type: String,
    required: true,
  },
  isBettingOpen: {
    type: Boolean, // Explicitly define the type as Boolean
    default: false,
  },
  openBetting: {
    type: Boolean, // Explicitly define the type as Boolean
    default: true,
  },
  results: {
    openNumber: String,
    closeNumber: String,
    openSingleDigit: Number,
    closeSingleDigit: Number,
    jodiResult: String,
    openSinglePanna: String,
    closeSinglePanna: String
  },
}, {
  timestamps: true,
});


// Middleware to auto-update 'updatedAt' on save
marketSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to fetch open markets
marketSchema.statics.findOpenMarkets = function () {
  return this.find({ isBettingOpen: true });
};

const Market = mongoose.models.Market || mongoose.model('Market', marketSchema);

export default Market;