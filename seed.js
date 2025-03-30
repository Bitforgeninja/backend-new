import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';

dotenv.config();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

// Seed Data
const seedUsers = async () => {
  try {
    await User.deleteMany(); // Clear existing users

    const users = [
      {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123', // You should hash passwords in a real app
        walletBalance: 1000,
      },
    ];

    await User.insertMany(users);
    console.log('Users seeded successfully!');
    mongoose.connection.close();
  } catch (err) {
    console.error('Error seeding users:', err);
    mongoose.connection.close();
  }
};

seedUsers();
