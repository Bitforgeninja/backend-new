import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please use a valid email address',
      ],
    },
    password: { type: String, required: true },
    // Fields for password reset functionality
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    phoneNumber: {
      type: String,
      required: true,
      match: [/^\d{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    walletBalance: { type: Number, default: 0 },
    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
      },
    ],
    bets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bet',
      },
    ],
    wins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Win',
      },
    ],

  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error); // Pass error to middleware
  }
});




// Instance method to verify password
userSchema.methods.verifyPassword = async function (password) {
  return bcrypt.compare(candidatePassword, this.password);
};



// Remove password field from JSON responses
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
